import { describe, it, expect } from 'vitest';
import { classifySlackEvent, routeInbound, type SlackEnvelope } from '../slackEvents';

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
    expect(classifySlackEvent({ type: 'url_verification', challenge: 'abc123' })).toEqual({
      action: 'challenge',
      challenge: 'abc123',
    });
  });

  it('ignores url_verification without a challenge string', () => {
    expect(classifySlackEvent({ type: 'url_verification' })).toEqual({
      action: 'ignore',
      reason: 'unknown_envelope',
    });
  });
});

describe('classifySlackEvent — 메시지 모양 판정', () => {
  it('스레드 답글을 process로 넘기며 채널·작성자를 싣는다', () => {
    expect(classifySlackEvent(staffReply())).toEqual({
      action: 'process',
      eventId: 'Ev123',
      channel: CHANNEL,
      slackTs: '1700000100.000200',
      threadTs: '1700000000.000100',
      isTopLevel: false,
      isBroadcast: false,
      slackUserId: 'U0STAFF',
      text: '안녕하세요, 상담 도와드리겠습니다.',
    });
  });

  it('채널 본문(thread_ts 없음)은 isTopLevel=true', () => {
    expect(classifySlackEvent(staffReply({ thread_ts: undefined }))).toMatchObject({
      action: 'process',
      threadTs: null,
      isTopLevel: true,
    });
  });

  it('thread_ts === ts 인 루트 메시지도 isTopLevel=true', () => {
    expect(
      classifySlackEvent(staffReply({ ts: '1700000000.000100', thread_ts: '1700000000.000100' }))
    ).toMatchObject({ action: 'process', threadTs: null, isTopLevel: true });
  });

  it('thread_broadcast는 isBroadcast=true', () => {
    expect(classifySlackEvent(staffReply({ subtype: 'thread_broadcast' }))).toMatchObject({
      action: 'process',
      isBroadcast: true,
      isTopLevel: false,
    });
  });

  it('다른 채널의 메시지도 process로 넘긴다 (채널 판정은 DB)', () => {
    expect(classifySlackEvent(staffReply({ channel: 'C0ROOM' }))).toMatchObject({
      action: 'process',
      channel: 'C0ROOM',
    });
  });

  it('trims surrounding whitespace from the text', () => {
    expect(classifySlackEvent(staffReply({ text: '  답변  ' }))).toMatchObject({ text: '답변' });
  });

  it('user가 없으면 slackUserId는 null', () => {
    expect(classifySlackEvent(staffReply({ user: undefined }))).toMatchObject({ slackUserId: null });
  });
});

describe('classifySlackEvent — 보관 이벤트', () => {
  it('group_archive → room_archived', () => {
    expect(classifySlackEvent(envelope({ type: 'group_archive', channel: 'C0ROOM' }))).toEqual({
      action: 'room_archived',
      eventId: 'Ev123',
      channel: 'C0ROOM',
    });
  });
  it('group_unarchive → room_unarchived', () => {
    expect(classifySlackEvent(envelope({ type: 'group_unarchive', channel: 'C0ROOM' }))).toEqual({
      action: 'room_unarchived',
      eventId: 'Ev123',
      channel: 'C0ROOM',
    });
  });
  it('채널이 없으면 무시', () => {
    expect(classifySlackEvent(envelope({ type: 'group_archive' }))).toEqual({
      action: 'ignore',
      reason: 'missing_channel',
    });
  });
});

describe('classifySlackEvent — infinite loop prevention', () => {
  it('ignores messages carrying bot_id (our own relayed message coming back)', () => {
    expect(classifySlackEvent(staffReply({ bot_id: 'B0APP' }))).toEqual({
      action: 'ignore',
      reason: 'bot_or_app_message',
    });
  });
  it('ignores messages carrying app_id', () => {
    expect(classifySlackEvent(staffReply({ app_id: 'A0APP' }))).toEqual({
      action: 'ignore',
      reason: 'bot_or_app_message',
    });
  });
  it('ignores bot_message subtype even without bot_id', () => {
    expect(classifySlackEvent(staffReply({ subtype: 'bot_message' })).action).toBe('ignore');
  });
});

describe('classifySlackEvent — filtering', () => {
  it('ignores edits and deletions', () => {
    expect(classifySlackEvent(staffReply({ subtype: 'message_changed' }))).toEqual({
      action: 'ignore',
      reason: 'unsupported_subtype',
    });
    expect(classifySlackEvent(staffReply({ subtype: 'message_deleted' }))).toEqual({
      action: 'ignore',
      reason: 'unsupported_subtype',
    });
  });
  it('ignores channel join notices', () => {
    expect(classifySlackEvent(staffReply({ subtype: 'channel_join' }))).toEqual({
      action: 'ignore',
      reason: 'unsupported_subtype',
    });
  });
  it('ignores empty or whitespace-only replies', () => {
    expect(classifySlackEvent(staffReply({ text: '   ' }))).toEqual({ action: 'ignore', reason: 'empty_text' });
    expect(classifySlackEvent(staffReply({ text: undefined }))).toEqual({ action: 'ignore', reason: 'empty_text' });
  });
  it('ignores messages without channel or ts', () => {
    expect(classifySlackEvent(staffReply({ channel: undefined }))).toEqual({ action: 'ignore', reason: 'missing_channel' });
    expect(classifySlackEvent(staffReply({ ts: undefined }))).toEqual({ action: 'ignore', reason: 'missing_channel' });
  });
  it('ignores non-message event types', () => {
    expect(classifySlackEvent(envelope({ type: 'reaction_added', channel: CHANNEL }))).toEqual({
      action: 'ignore',
      reason: 'not_message',
    });
  });
  it('ignores envelopes without an event_id (cannot be deduped)', () => {
    const body = staffReply();
    delete body.event_id;
    expect(classifySlackEvent(body)).toEqual({ action: 'ignore', reason: 'missing_event_id' });
  });
  it('ignores unknown envelope types', () => {
    expect(classifySlackEvent({ type: 'app_rate_limited' })).toEqual({ action: 'ignore', reason: 'unknown_envelope' });
  });
  it('ignores event_callback with no event payload', () => {
    expect(classifySlackEvent({ type: 'event_callback', event_id: 'Ev1' })).toEqual({
      action: 'ignore',
      reason: 'missing_event',
    });
  });
});

describe('routeInbound', () => {
  const LEGACY = 'C0LEGACY';
  it('#해외문의 스레드 답글 → legacy_thread', () => {
    expect(routeInbound({ channel: LEGACY, threadTs: '1.0', isTopLevel: false, isBroadcast: false }, LEGACY)).toEqual({
      kind: 'legacy_thread',
      threadTs: '1.0',
    });
  });
  it('#해외문의 본문 → skip(legacy_top_level)', () => {
    expect(routeInbound({ channel: LEGACY, threadTs: null, isTopLevel: true, isBroadcast: false }, LEGACY)).toEqual({
      kind: 'skip',
      reason: 'legacy_top_level',
    });
  });
  it('방 본문 → room', () => {
    expect(routeInbound({ channel: 'C0ROOM', threadTs: null, isTopLevel: true, isBroadcast: false }, LEGACY)).toEqual({
      kind: 'room',
      channel: 'C0ROOM',
    });
  });
  it('방 스레드 답글 → skip(internal_note) — 직원끼리 메모', () => {
    expect(routeInbound({ channel: 'C0ROOM', threadTs: '1.0', isTopLevel: false, isBroadcast: false }, LEGACY)).toEqual({
      kind: 'skip',
      reason: 'internal_note',
    });
  });
  it('방 스레드 답글이라도 "채널에도 보내기"면 room', () => {
    expect(routeInbound({ channel: 'C0ROOM', threadTs: '1.0', isTopLevel: false, isBroadcast: true }, LEGACY)).toEqual({
      kind: 'room',
      channel: 'C0ROOM',
    });
  });
  it('피드 채널이 미설정이면 모든 채널을 방 후보로 본다', () => {
    expect(routeInbound({ channel: 'C0ANY', threadTs: null, isTopLevel: true, isBroadcast: false }, null)).toEqual({
      kind: 'room',
      channel: 'C0ANY',
    });
  });
});
