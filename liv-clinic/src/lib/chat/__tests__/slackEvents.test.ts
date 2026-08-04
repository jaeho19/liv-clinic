import { describe, it, expect } from 'vitest';
import { classifySlackEvent, type SlackEnvelope } from '../slackEvents';

const CHANNEL = 'C0TESTCHANNEL';

function envelope(event: Record<string, unknown>, eventId = 'Ev123'): SlackEnvelope {
  return { type: 'event_callback', event_id: eventId, event };
}

/** 직원이 스레드에 남긴 정상 답글. */
function staffReply(overrides: Record<string, unknown> = {}) {
  return envelope({
    type: 'message',
    channel: CHANNEL,
    channel_type: 'group',
    user: 'U0STAFF',
    text: '안녕하세요, 상담 도와드리겠습니다.',
    ts: '1700000100.000200',
    thread_ts: '1700000000.000100',
    ...overrides,
  });
}

describe('classifySlackEvent — url_verification', () => {
  it('returns the challenge', () => {
    const result = classifySlackEvent(
      { type: 'url_verification', challenge: 'abc123' },
      CHANNEL
    );
    expect(result).toEqual({ action: 'challenge', challenge: 'abc123' });
  });

  it('ignores url_verification without a challenge string', () => {
    const result = classifySlackEvent({ type: 'url_verification' }, CHANNEL);
    expect(result).toEqual({ action: 'ignore', reason: 'unknown_envelope' });
  });
});

describe('classifySlackEvent — happy path', () => {
  it('processes a human thread reply in the target channel', () => {
    expect(classifySlackEvent(staffReply(), CHANNEL)).toEqual({
      action: 'process',
      eventId: 'Ev123',
      threadTs: '1700000000.000100',
      slackTs: '1700000100.000200',
      text: '안녕하세요, 상담 도와드리겠습니다.',
    });
  });

  it('accepts a thread_broadcast reply', () => {
    const result = classifySlackEvent(staffReply({ subtype: 'thread_broadcast' }), CHANNEL);
    expect(result.action).toBe('process');
  });

  it('trims surrounding whitespace from the text', () => {
    const result = classifySlackEvent(staffReply({ text: '  답변  ' }), CHANNEL);
    expect(result).toMatchObject({ action: 'process', text: '답변' });
  });
});

describe('classifySlackEvent — infinite loop prevention', () => {
  it('ignores messages carrying bot_id (our own relayed message coming back)', () => {
    const result = classifySlackEvent(staffReply({ bot_id: 'B0APP' }), CHANNEL);
    expect(result).toEqual({ action: 'ignore', reason: 'bot_or_app_message' });
  });

  it('ignores messages carrying app_id', () => {
    const result = classifySlackEvent(staffReply({ app_id: 'A0APP' }), CHANNEL);
    expect(result).toEqual({ action: 'ignore', reason: 'bot_or_app_message' });
  });

  it('ignores bot_message subtype even without bot_id', () => {
    const result = classifySlackEvent(staffReply({ subtype: 'bot_message' }), CHANNEL);
    expect(result.action).toBe('ignore');
  });
});

describe('classifySlackEvent — filtering', () => {
  it('ignores a root channel message (thread_ts equals ts)', () => {
    const result = classifySlackEvent(
      staffReply({ ts: '1700000000.000100', thread_ts: '1700000000.000100' }),
      CHANNEL
    );
    expect(result).toEqual({ action: 'ignore', reason: 'not_thread_reply' });
  });

  it('ignores a message with no thread_ts at all', () => {
    const result = classifySlackEvent(staffReply({ thread_ts: undefined }), CHANNEL);
    expect(result).toEqual({ action: 'ignore', reason: 'not_thread_reply' });
  });

  it('ignores messages from another channel', () => {
    const result = classifySlackEvent(staffReply({ channel: 'C0OTHER' }), CHANNEL);
    expect(result).toEqual({ action: 'ignore', reason: 'other_channel' });
  });

  it('ignores everything when the channel is not configured', () => {
    const result = classifySlackEvent(staffReply(), null);
    expect(result).toEqual({ action: 'ignore', reason: 'other_channel' });
  });

  it('ignores edits and deletions', () => {
    expect(classifySlackEvent(staffReply({ subtype: 'message_changed' }), CHANNEL)).toEqual({
      action: 'ignore',
      reason: 'unsupported_subtype',
    });
    expect(classifySlackEvent(staffReply({ subtype: 'message_deleted' }), CHANNEL)).toEqual({
      action: 'ignore',
      reason: 'unsupported_subtype',
    });
  });

  it('ignores channel join notices', () => {
    const result = classifySlackEvent(staffReply({ subtype: 'channel_join' }), CHANNEL);
    expect(result).toEqual({ action: 'ignore', reason: 'unsupported_subtype' });
  });

  it('ignores empty or whitespace-only replies', () => {
    expect(classifySlackEvent(staffReply({ text: '   ' }), CHANNEL)).toEqual({
      action: 'ignore',
      reason: 'empty_text',
    });
    expect(classifySlackEvent(staffReply({ text: undefined }), CHANNEL)).toEqual({
      action: 'ignore',
      reason: 'empty_text',
    });
  });

  it('ignores non-message event types', () => {
    const result = classifySlackEvent(
      envelope({ type: 'reaction_added', channel: CHANNEL }),
      CHANNEL
    );
    expect(result).toEqual({ action: 'ignore', reason: 'not_message' });
  });

  it('ignores envelopes without an event_id (cannot be deduped)', () => {
    const body = staffReply();
    delete body.event_id;
    expect(classifySlackEvent(body, CHANNEL)).toEqual({
      action: 'ignore',
      reason: 'missing_event_id',
    });
  });

  it('ignores unknown envelope types', () => {
    expect(classifySlackEvent({ type: 'app_rate_limited' }, CHANNEL)).toEqual({
      action: 'ignore',
      reason: 'unknown_envelope',
    });
  });

  it('ignores event_callback with no event payload', () => {
    expect(classifySlackEvent({ type: 'event_callback', event_id: 'Ev1' }, CHANNEL)).toEqual({
      action: 'ignore',
      reason: 'missing_event',
    });
  });
});
