import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';

// Slack Web API / Events API 저수준 래퍼.
// - 순수 함수 + fetch만 담당. DB 접근/세션 해석은 slackRelay.ts.
// - throw-free: Slack 장애가 채팅을 막지 않는다.
// - 환경변수는 호출 시점에 읽는다 (빌드 타임 평가 방지 + 테스트에서 주입 가능).
// - 일시 오류(429/5xx/timeout/network)는 1회만 재시도한다. Retry-After를 존중하되 최대 2초.

const SLACK_API_BASE = 'https://slack.com/api/';

// Slack 서명 검증 허용 시간차 (replay 공격 방지). Slack 권장값 5분.
const SIGNATURE_MAX_AGE_SEC = 60 * 5;

const RETRYABLE = new Set([
  'ratelimited',
  'timeout',
  'network_error',
  'http_429',
  'http_500',
  'http_502',
  'http_503',
  'http_504',
]);

/** 테스트에서 spy 하기 위한 내부 훅. */
export const _internals = {
  sleep: (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
};

function postTimeoutMs(): number {
  return Number(process.env.SLACK_POST_TIMEOUT_MS ?? 5000);
}

export function getSlackBotToken(): string | null {
  return process.env.SLACK_BOT_TOKEN || null;
}

export function getSlackChannelId(): string | null {
  return process.env.SLACK_CHANNEL_ID || null;
}

export function getSlackSigningSecret(): string | null {
  return process.env.SLACK_SIGNING_SECRET || null;
}

/** 아웃바운드(방문자 → Slack) 릴레이가 가능한 상태인지. */
export function isSlackRelayConfigured(): boolean {
  return Boolean(getSlackBotToken() && getSlackChannelId());
}

export type SlackCallResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; retryAfterMs?: number };

async function callOnce<T>(
  method: string,
  payload: object,
  token: string
): Promise<SlackCallResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), postTimeoutMs());
  try {
    const res = await fetch(SLACK_API_BASE + method, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const retryAfterSec = Number(res.headers.get('retry-after'));
      return {
        ok: false,
        error: `http_${res.status}`,
        retryAfterMs:
          Number.isFinite(retryAfterSec) && retryAfterSec > 0 ? retryAfterSec * 1000 : undefined,
      };
    }

    const json = (await res.json()) as { ok?: boolean; error?: string } & T;
    if (!json.ok) return { ok: false, error: json.error ?? 'invalid_response' };
    return { ok: true, data: json };
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    return { ok: false, error: aborted ? 'timeout' : 'network_error' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Slack Web API 호출. 일시 오류는 1회 재시도. 어떤 경우에도 throw하지 않는다.
 * @param method 'chat.postMessage' 처럼 메서드 이름만.
 */
export async function callSlack<T = Record<string, unknown>>(
  method: string,
  payload: object
): Promise<SlackCallResult<T>> {
  const token = getSlackBotToken();
  if (!token) return { ok: false, error: 'no_bot_token' };

  let last: SlackCallResult<T> = { ok: false, error: 'not_called' };
  for (let attempt = 0; attempt < 2; attempt++) {
    last = await callOnce<T>(method, payload, token);
    if (last.ok || !RETRYABLE.has(last.error)) return last;
    if (attempt === 0) await _internals.sleep(Math.min(last.retryAfterMs ?? 800, 2000));
  }
  return last;
}

export interface PostMessageResult {
  ok: boolean;
  /** 성공 시 Slack 메시지 ts. 루트 메시지면 이 값이 세션의 thread_ts가 된다. */
  ts?: string;
  channel?: string;
  error?: string;
}

/**
 * chat.postMessage 호출.
 * - threadTs가 있으면 해당 스레드에 답글로 붙는다. replyBroadcast는 threadTs가 있을 때만 의미 있다.
 * - channelId 미지정 시 SLACK_CHANNEL_ID(#해외문의).
 */
export async function postSlackMessage(args: {
  text: string;
  threadTs?: string | null;
  channelId?: string;
  replyBroadcast?: boolean;
}): Promise<PostMessageResult> {
  if (!getSlackBotToken()) return { ok: false, error: 'no_bot_token' };
  const channel = args.channelId ?? getSlackChannelId();
  if (!channel) return { ok: false, error: 'no_channel_id' };

  const r = await callSlack<{ ts?: string; channel?: string }>('chat.postMessage', {
    channel,
    text: args.text,
    reply_broadcast: Boolean(args.replyBroadcast && args.threadTs),
    ...(args.threadTs ? { thread_ts: args.threadTs } : {}),
    unfurl_links: false,
    unfurl_media: false,
  });

  if (!r.ok) return { ok: false, error: r.error };
  if (!r.data.ts) return { ok: false, error: 'invalid_response' };
  return { ok: true, ts: r.data.ts, channel: r.data.channel };
}

// ── 비공개 채널 관리 (groups:write) ─────────────────────────────────────────

export async function createPrivateChannel(
  name: string
): Promise<SlackCallResult<{ channel: { id: string; name: string } }>> {
  return callSlack('conversations.create', { name, is_private: true });
}

export async function inviteToChannel(
  channelId: string,
  userIds: string[]
): Promise<SlackCallResult<unknown>> {
  if (userIds.length === 0) return { ok: true, data: {} };
  const r = await callSlack('conversations.invite', { channel: channelId, users: userIds.join(',') });
  if (!r.ok && r.error === 'already_in_channel') return { ok: true, data: {} };
  return r;
}

export async function setChannelTopic(
  channelId: string,
  topic: string
): Promise<SlackCallResult<unknown>> {
  return callSlack('conversations.setTopic', { channel: channelId, topic: topic.slice(0, 250) });
}

export async function archiveChannel(channelId: string): Promise<SlackCallResult<unknown>> {
  const r = await callSlack('conversations.archive', { channel: channelId });
  if (!r.ok && r.error === 'already_archived') return { ok: true, data: {} };
  return r;
}

export async function unarchiveChannel(channelId: string): Promise<SlackCallResult<unknown>> {
  const r = await callSlack('conversations.unarchive', { channel: channelId });
  if (!r.ok && r.error === 'not_archived') return { ok: true, data: {} };
  return r;
}

// ── 서명 검증 / 텍스트 유틸 (변경 없음) ───────────────────────────────────

export type SignatureFailure =
  | 'no_signing_secret'
  | 'missing_headers'
  | 'bad_timestamp'
  | 'stale_timestamp'
  | 'mismatch';

export interface SignatureResult {
  valid: boolean;
  reason?: SignatureFailure;
}

/**
 * x-slack-signature 검증.
 * base string = `v0:{timestamp}:{rawBody}` 를 SLACK_SIGNING_SECRET으로 HMAC-SHA256.
 * 반드시 **파싱 전 raw body 문자열**을 넘겨야 한다.
 */
export function verifySlackSignature(args: {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
  nowSec?: number;
}): SignatureResult {
  const secret = getSlackSigningSecret();
  if (!secret) return { valid: false, reason: 'no_signing_secret' };

  const { rawBody, signature, timestamp } = args;
  if (!signature || !timestamp) return { valid: false, reason: 'missing_headers' };

  const tsNum = Number(timestamp);
  if (!Number.isFinite(tsNum)) return { valid: false, reason: 'bad_timestamp' };

  const now = args.nowSec ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - tsNum) > SIGNATURE_MAX_AGE_SEC) {
    return { valid: false, reason: 'stale_timestamp' };
  }

  const expected =
    'v0=' + createHmac('sha256', secret).update(`v0:${timestamp}:${rawBody}`).digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  if (a.length !== b.length) return { valid: false, reason: 'mismatch' };
  if (!timingSafeEqual(a, b)) return { valid: false, reason: 'mismatch' };

  return { valid: true };
}

/**
 * Slack mrkdwn을 번역기에 넣기 좋은 평문으로 정리.
 * - <@U123|name> / <@U123>  → 제거
 * - <#C123|general>         → #general
 * - <http://x|label>        → label
 * - <http://x>              → http://x
 * - &amp; &lt; &gt;         → 원문자
 */
export function slackTextToPlain(text: string): string {
  return text
    .replace(/<@[UW][A-Z0-9]*(?:\|[^>]*)?>/g, '')
    .replace(/<#C[A-Z0-9]*(?:\|([^>]*))?>/g, (_m, label) => (label ? `#${label}` : ''))
    .replace(/<(https?:\/\/[^|>]+)\|([^>]*)>/g, '$2')
    .replace(/<(https?:\/\/[^|>]+)>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

/** Slack mrkdwn 특수문자 이스케이프 (방문자 입력을 Slack으로 보낼 때). */
export function escapeSlackText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
