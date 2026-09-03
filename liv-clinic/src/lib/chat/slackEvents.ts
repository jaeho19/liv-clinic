import 'server-only';

// Slack Events API 엔벨로프 분류기 — 순수 함수 (I/O 없음).
// 라우트가 3초 내 200을 반환해야 하므로, 무거운 작업 전에 여기서 먼저 걸러낸다.
// "어느 채널이 어느 세션인가"는 DB가 필요하므로 여기서 판정하지 않는다 → routeInbound + slackRelay.

export interface SlackMessageEvent {
  type?: string;
  subtype?: string;
  channel?: string;
  channel_type?: string;
  user?: string;
  bot_id?: string;
  app_id?: string;
  text?: string;
  ts?: string;
  thread_ts?: string;
}

export interface SlackEnvelope {
  type?: string;
  token?: string;
  challenge?: string;
  event_id?: string;
  event?: SlackMessageEvent;
}

export type IgnoreReason =
  | 'unknown_envelope'
  | 'missing_event'
  | 'missing_event_id'
  | 'not_message'
  | 'bot_or_app_message'
  | 'unsupported_subtype'
  | 'missing_channel'
  | 'empty_text';

export interface ProcessDecision {
  action: 'process';
  eventId: string;
  channel: string;
  slackTs: string;
  /** 스레드 답글이면 루트 ts, 본문이면 null */
  threadTs: string | null;
  isTopLevel: boolean;
  /** "채널에도 보내기"를 체크한 스레드 답글 */
  isBroadcast: boolean;
  slackUserId: string | null;
  text: string;
}

export type SlackEventDecision =
  | { action: 'challenge'; challenge: string }
  | { action: 'ignore'; reason: IgnoreReason }
  | ProcessDecision
  | { action: 'room_archived'; eventId: string; channel: string }
  | { action: 'room_unarchived'; eventId: string; channel: string };

// 사람이 남긴 메시지로 취급할 subtype. 그 외(bot_message, message_changed, message_deleted, channel_join, file_share …)는 무시.
const ACCEPTED_SUBTYPES = new Set<string | undefined>([undefined, 'thread_broadcast']);

function ignore(reason: IgnoreReason): SlackEventDecision {
  return { action: 'ignore', reason };
}

export function classifySlackEvent(body: SlackEnvelope): SlackEventDecision {
  if (body.type === 'url_verification') {
    return typeof body.challenge === 'string'
      ? { action: 'challenge', challenge: body.challenge }
      : ignore('unknown_envelope');
  }
  if (body.type !== 'event_callback') return ignore('unknown_envelope');

  const event = body.event;
  if (!event) return ignore('missing_event');
  // event_id는 중복 처리 방지의 키 — 없으면 멱등성을 보장할 수 없으므로 처리하지 않는다.
  if (!body.event_id) return ignore('missing_event_id');

  if (event.type === 'group_archive' || event.type === 'group_unarchive') {
    if (!event.channel) return ignore('missing_channel');
    return {
      action: event.type === 'group_archive' ? 'room_archived' : 'room_unarchived',
      eventId: body.event_id,
      channel: event.channel,
    };
  }

  if (event.type !== 'message') return ignore('not_message');
  // 무한 루프 차단 — 우리 봇이 남긴 메시지도 message.groups로 되돌아온다.
  if (event.bot_id || event.app_id) return ignore('bot_or_app_message');
  if (!ACCEPTED_SUBTYPES.has(event.subtype)) return ignore('unsupported_subtype');
  if (!event.channel || !event.ts) return ignore('missing_channel');

  const text = (event.text ?? '').trim();
  if (!text) return ignore('empty_text');

  const threadTs = event.thread_ts && event.thread_ts !== event.ts ? event.thread_ts : null;
  return {
    action: 'process',
    eventId: body.event_id,
    channel: event.channel,
    slackTs: event.ts,
    threadTs,
    isTopLevel: threadTs === null,
    isBroadcast: event.subtype === 'thread_broadcast',
    slackUserId: event.user ?? null,
    text,
  };
}

export type InboundRoute =
  | { kind: 'legacy_thread'; threadTs: string }
  | { kind: 'room'; channel: string }
  | { kind: 'skip'; reason: 'legacy_top_level' | 'internal_note' };

/**
 * 메시지가 어디로 가야 하는지 (순수).
 * - #해외문의(legacy): 스레드 답글만 전달 (현행), 본문은 무시
 * - 그 외 채널(=방 후보): 본문 또는 "채널에도 보내기" 답글만 전달, 일반 스레드 답글은 내부 메모
 */
export function routeInbound(
  d: Pick<ProcessDecision, 'channel' | 'threadTs' | 'isTopLevel' | 'isBroadcast'>,
  legacyChannelId: string | null
): InboundRoute {
  if (legacyChannelId && d.channel === legacyChannelId) {
    if (d.threadTs) return { kind: 'legacy_thread', threadTs: d.threadTs };
    return { kind: 'skip', reason: 'legacy_top_level' };
  }
  if (d.isTopLevel || d.isBroadcast) return { kind: 'room', channel: d.channel };
  return { kind: 'skip', reason: 'internal_note' };
}
