import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'crypto';
import { verifySlackSignature, slackTextToPlain, escapeSlackText } from '../slack';

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
