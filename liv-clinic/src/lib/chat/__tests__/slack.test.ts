import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHmac } from 'crypto';
import {
  _internals,
  archiveChannel,
  callSlack,
  createPrivateChannel,
  inviteToChannel,
  postSlackMessage,
  unarchiveChannel,
  verifySlackSignature,
  slackTextToPlain,
  escapeSlackText,
} from '../slack';

const SECRET = 'test-signing-secret';

function sign(rawBody: string, timestamp: string, secret = SECRET): string {
  return 'v0=' + createHmac('sha256', secret).update(`v0:${timestamp}:${rawBody}`).digest('hex');
}

describe('verifySlackSignature', () => {
  const NOW_SEC = 1_700_000_000;
  const originalSecret = process.env.SLACK_SIGNING_SECRET;

  beforeEach(() => {
    process.env.SLACK_SIGNING_SECRET = SECRET;
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.SLACK_SIGNING_SECRET;
    else process.env.SLACK_SIGNING_SECRET = originalSecret;
  });

  it('accepts a correctly signed request', () => {
    const rawBody = '{"type":"event_callback"}';
    const ts = String(NOW_SEC);
    const result = verifySlackSignature({
      rawBody,
      signature: sign(rawBody, ts),
      timestamp: ts,
      nowSec: NOW_SEC,
    });
    expect(result.valid).toBe(true);
  });

  it('rejects a tampered body', () => {
    const ts = String(NOW_SEC);
    const signature = sign('{"type":"event_callback"}', ts);
    const result = verifySlackSignature({
      rawBody: '{"type":"event_callback","evil":true}',
      signature,
      timestamp: ts,
      nowSec: NOW_SEC,
    });
    expect(result).toEqual({ valid: false, reason: 'mismatch' });
  });

  it('rejects a signature made with a different secret', () => {
    const rawBody = '{}';
    const ts = String(NOW_SEC);
    const result = verifySlackSignature({
      rawBody,
      signature: sign(rawBody, ts, 'wrong-secret'),
      timestamp: ts,
      nowSec: NOW_SEC,
    });
    expect(result).toEqual({ valid: false, reason: 'mismatch' });
  });

  it('rejects a replayed request older than 5 minutes', () => {
    const rawBody = '{}';
    const staleTs = String(NOW_SEC - 301);
    const result = verifySlackSignature({
      rawBody,
      signature: sign(rawBody, staleTs),
      timestamp: staleTs,
      nowSec: NOW_SEC,
    });
    expect(result).toEqual({ valid: false, reason: 'stale_timestamp' });
  });

  it('rejects a timestamp too far in the future', () => {
    const rawBody = '{}';
    const futureTs = String(NOW_SEC + 301);
    const result = verifySlackSignature({
      rawBody,
      signature: sign(rawBody, futureTs),
      timestamp: futureTs,
      nowSec: NOW_SEC,
    });
    expect(result).toEqual({ valid: false, reason: 'stale_timestamp' });
  });

  it('rejects missing headers', () => {
    expect(
      verifySlackSignature({ rawBody: '{}', signature: null, timestamp: null, nowSec: NOW_SEC })
    ).toEqual({ valid: false, reason: 'missing_headers' });
  });

  it('rejects a non-numeric timestamp', () => {
    expect(
      verifySlackSignature({
        rawBody: '{}',
        signature: 'v0=abc',
        timestamp: 'not-a-number',
        nowSec: NOW_SEC,
      })
    ).toEqual({ valid: false, reason: 'bad_timestamp' });
  });

  it('reports missing configuration distinctly from a bad signature', () => {
    delete process.env.SLACK_SIGNING_SECRET;
    expect(
      verifySlackSignature({ rawBody: '{}', signature: 'v0=abc', timestamp: '1', nowSec: 1 })
    ).toEqual({ valid: false, reason: 'no_signing_secret' });
  });

  it('does not throw on a signature of a different length', () => {
    const rawBody = '{}';
    const ts = String(NOW_SEC);
    expect(() =>
      verifySlackSignature({ rawBody, signature: 'v0=short', timestamp: ts, nowSec: NOW_SEC })
    ).not.toThrow();
  });
});

describe('slackTextToPlain', () => {
  it('strips user mentions', () => {
    expect(slackTextToPlain('<@U123ABC> 안녕하세요')).toBe('안녕하세요');
    expect(slackTextToPlain('<@U123ABC|jae> 안녕하세요')).toBe('안녕하세요');
  });

  it('unwraps links, keeping the label when present', () => {
    expect(slackTextToPlain('<https://livps.co.kr|예약 페이지>를 확인하세요')).toBe(
      '예약 페이지를 확인하세요'
    );
    expect(slackTextToPlain('<https://livps.co.kr>')).toBe('https://livps.co.kr');
  });

  it('converts channel references to a readable form', () => {
    expect(slackTextToPlain('<#C123|general> 참고')).toBe('#general 참고');
  });

  it('decodes Slack HTML entities', () => {
    expect(slackTextToPlain('a &lt; b &amp;&amp; c &gt; d')).toBe('a < b && c > d');
  });
});

describe('escapeSlackText', () => {
  it('escapes mrkdwn control characters so visitor input cannot inject markup', () => {
    expect(escapeSlackText('<@channel> & <script>')).toBe(
      '&lt;@channel&gt; &amp; &lt;script&gt;'
    );
  });

  it('round-trips through slackTextToPlain', () => {
    const original = 'a < b & c > d';
    expect(slackTextToPlain(escapeSlackText(original))).toBe(original);
  });
});

function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {}
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
}

describe('callSlack / postSlackMessage', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-test';
    process.env.SLACK_CHANNEL_ID = 'C0FEED';
    vi.spyOn(_internals, 'sleep').mockResolvedValue(undefined);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_CHANNEL_ID;
  });

  it('성공 응답을 기존 PostMessageResult 형태로 돌려준다', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true, ts: '1.2', channel: 'C1' }));
    const r = await postSlackMessage({ text: 'hi', channelId: 'C1' });
    expect(r).toEqual({ ok: true, ts: '1.2', channel: 'C1' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
    expect(body.channel).toBe('C1');
    expect(body.reply_broadcast).toBe(false);
  });

  it('replyBroadcast는 thread_ts가 있을 때만 켜진다', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true, ts: '1.2', channel: 'C1' }));
    await postSlackMessage({ text: 'hi', channelId: 'C1', threadTs: '1.0', replyBroadcast: true });
    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
    expect(body.thread_ts).toBe('1.0');
    expect(body.reply_broadcast).toBe(true);
  });

  it('429는 Retry-After 뒤 1회 재시도한다', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ ok: false, error: 'ratelimited' }, { status: 429, headers: { 'retry-after': '1' } })
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true, ts: '1.3', channel: 'C1' }));
    const r = await postSlackMessage({ text: 'hi', channelId: 'C1' });
    expect(r.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(_internals.sleep).toHaveBeenCalledWith(1000);
  });

  it('invalid_auth 같은 영구 오류는 재시도하지 않는다', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: false, error: 'invalid_auth' }));
    const r = await callSlack('chat.postMessage', { channel: 'C1', text: 'x' });
    expect(r).toEqual({ ok: false, error: 'invalid_auth' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('토큰이 없으면 fetch를 부르지 않는다', async () => {
    delete process.env.SLACK_BOT_TOKEN;
    global.fetch = vi.fn();
    expect(await callSlack('chat.postMessage', {})).toEqual({ ok: false, error: 'no_bot_token' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('네트워크 예외는 network_error로 돌려주고 throw하지 않는다', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('boom'));
    const r = await callSlack('chat.postMessage', {});
    expect(r).toEqual({ ok: false, error: 'network_error' });
  });
});

describe('채널 관리 메서드', () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-test';
    vi.spyOn(_internals, 'sleep').mockResolvedValue(undefined);
  });
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
    delete process.env.SLACK_BOT_TOKEN;
  });

  it('createPrivateChannel은 is_private로 만들고 채널 id·name을 돌려준다', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: true, channel: { id: 'C9', name: 'chat-thu-111111' } }));
    const r = await createPrivateChannel('chat-thu-111111');
    expect(r).toEqual({ ok: true, data: expect.objectContaining({ channel: { id: 'C9', name: 'chat-thu-111111' } }) });
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('https://slack.com/api/conversations.create');
    expect(JSON.parse(call[1].body as string)).toEqual({ name: 'chat-thu-111111', is_private: true });
  });

  it('createPrivateChannel은 name_taken을 그대로 돌려준다 (접미 재시도는 slackRooms 담당)', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: false, error: 'name_taken' }));
    expect(await createPrivateChannel('x')).toEqual({ ok: false, error: 'name_taken' });
  });

  it('inviteToChannel은 already_in_channel을 성공으로 본다', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: false, error: 'already_in_channel' }));
    expect((await inviteToChannel('C1', ['U1'])).ok).toBe(true);
  });

  it('inviteToChannel은 대상이 없으면 호출하지 않는다', async () => {
    global.fetch = vi.fn();
    expect((await inviteToChannel('C1', [])).ok).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('inviteToChannel은 ID를 쉼표로 이어 보낸다', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    await inviteToChannel('C1', ['U1', 'U2']);
    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
    expect(body).toEqual({ channel: 'C1', users: 'U1,U2' });
  });

  it('archiveChannel은 already_archived를, unarchiveChannel은 not_archived를 성공으로 본다', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: false, error: 'already_archived' }));
    expect((await archiveChannel('C1')).ok).toBe(true);
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: false, error: 'not_archived' }));
    expect((await unarchiveChannel('C1')).ok).toBe(true);
  });
});
