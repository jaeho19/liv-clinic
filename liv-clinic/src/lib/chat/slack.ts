import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';

// Slack Web API / Events API 저수준 래퍼.
// - 순수 함수 + fetch만 담당. DB 접근/세션 해석은 slackRelay.ts.
// - 기존 translation.ts와 동일하게 throw-free: Slack 장애가 채팅을 막지 않는다.
// - 환경변수는 호출 시점에 읽는다 (빌드 타임 평가 방지 + 테스트에서 주입 가능).

const SLACK_POST_MESSAGE_URL = 'https://slack.com/api/chat.postMessage';
const POST_TIMEOUT_MS = Number(process.env.SLACK_POST_TIMEOUT_MS ?? 5000);

// Slack 서명 검증 허용 시간차 (replay 공격 방지). Slack 권장값 5분.
const SIGNATURE_MAX_AGE_SEC = 60 * 5;

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

export interface PostMessageResult {
  ok: boolean;
  /** 성공 시 Slack 메시지 ts. 루트 메시지면 이 값이 세션의 thread_ts가 된다. */
  ts?: string;
  channel?: string;
  error?: string;
}

/**
 * chat.postMessage 호출.
 * - threadTs가 있으면 해당 스레드에 답글로 붙는다.
 * - 어떤 경우에도 throw하지 않고 { ok:false, error } 를 반환한다.
 */
export async function postSlackMessage(args: {
  text: string;
  threadTs?: string | null;
  channelId?: string;
}): Promise<PostMessageResult> {
  const token = getSlackBotToken();
  const channel = args.channelId ?? getSlackChannelId();

  if (!token) return { ok: false, error: 'no_bot_token' };
  if (!channel) return { ok: false, error: 'no_channel_id' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);

  try {
    const res = await fetch(SLACK_POST_MESSAGE_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        channel,
        text: args.text,
        // 스레드 답글이 채널 본문에도 노출되지 않도록 (기본값이지만 명시)
        reply_broadcast: false,
        ...(args.threadTs ? { thread_ts: args.threadTs } : {}),
        unfurl_links: false,
        unfurl_media: false,
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `http_${res.status}` };
    }

    const json = (await res.json()) as {
      ok?: boolean;
      ts?: string;
      channel?: string;
      error?: string;
    };

    if (!json.ok || !json.ts) {
      return { ok: false, error: json.error ?? 'invalid_response' };
    }
    return { ok: true, ts: json.ts, channel: json.channel };
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    return { ok: false, error: aborted ? 'timeout' : 'network_error' };
  } finally {
    clearTimeout(timer);
  }
}

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
 *
 * 반드시 **파싱 전 raw body 문자열**을 넘겨야 한다 (JSON.stringify 재직렬화는 바이트가 달라진다).
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

  // 길이가 다르면 timingSafeEqual이 throw하므로 먼저 비교 (길이 자체는 비밀이 아니다)
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  if (a.length !== b.length) return { valid: false, reason: 'mismatch' };
  if (!timingSafeEqual(a, b)) return { valid: false, reason: 'mismatch' };

  return { valid: true };
}

/**
 * Slack mrkdwn을 번역기에 넣기 좋은 평문으로 정리.
 * - <@U123|name> / <@U123>  → 제거 (멘션은 방문자에게 의미 없음)
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
