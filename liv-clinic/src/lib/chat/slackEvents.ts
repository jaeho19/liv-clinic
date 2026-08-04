import 'server-only';

// Slack Events API 엔벨로프 분류기 — 순수 함수 (I/O 없음).
// 라우트가 3초 내 200을 반환해야 하므로, 무거운 작업 전에 여기서 먼저 걸러낸다.

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
  | 'other_channel'
  | 'not_thread_reply'
  | 'empty_text';

export type SlackEventDecision =
  | { action: 'challenge'; challenge: string }
  | { action: 'ignore'; reason: IgnoreReason }
  | {
      action: 'process';
      eventId: string;
      threadTs: string;
      slackTs: string;
      text: string;
    };

// 사람이 스레드에 남긴 답글로 취급할 subtype.
// - undefined         : 일반 답글
// - 'thread_broadcast': "채널에도 보내기"를 체크한 답글
// 그 외(bot_message, message_changed, message_deleted, channel_join, file_share …)는 무시한다.
const ACCEPTED_SUBTYPES = new Set<string | undefined>([undefined, 'thread_broadcast']);

/**
 * Slack 엔벨로프를 처리 액션으로 분류한다.
 *
 * @param body       서명 검증을 통과한 파싱된 요청 본문
 * @param channelId  SLACK_CHANNEL_ID (비공개 채널 → message.groups 구독)
 */
export function classifySlackEvent(
  body: SlackEnvelope,
  channelId: string | null
): SlackEventDecision {
  // 1. Events API URL 등록 검증
  if (body.type === 'url_verification') {
    return typeof body.challenge === 'string'
      ? { action: 'challenge', challenge: body.challenge }
      : { action: 'ignore', reason: 'unknown_envelope' };
  }

  if (body.type !== 'event_callback') {
    return { action: 'ignore', reason: 'unknown_envelope' };
  }

  const event = body.event;
  if (!event) return { action: 'ignore', reason: 'missing_event' };

  // event_id는 중복 처리 방지의 키 — 없으면 멱등성을 보장할 수 없으므로 처리하지 않는다.
  if (!body.event_id) return { action: 'ignore', reason: 'missing_event_id' };

  // 2. message.groups 구독의 이벤트 타입은 'message'
  if (event.type !== 'message') return { action: 'ignore', reason: 'not_message' };

  // 3. 무한 루프 차단 — 우리 봇이 스레드에 남긴 메시지도 message.groups로 되돌아온다.
  //    bot_id / app_id 중 하나라도 있으면 사람이 보낸 메시지가 아니다.
  if (event.bot_id || event.app_id) {
    return { action: 'ignore', reason: 'bot_or_app_message' };
  }

  if (!ACCEPTED_SUBTYPES.has(event.subtype)) {
    return { action: 'ignore', reason: 'unsupported_subtype' };
  }

  // 4. 대상 채널만 처리
  if (!channelId || event.channel !== channelId) {
    return { action: 'ignore', reason: 'other_channel' };
  }

  // 5. 스레드 답글만 처리 — thread_ts === ts 이면 스레드 루트(채널 새 글)이다.
  const threadTs = event.thread_ts;
  const slackTs = event.ts;
  if (!threadTs || !slackTs || threadTs === slackTs) {
    return { action: 'ignore', reason: 'not_thread_reply' };
  }

  const text = (event.text ?? '').trim();
  if (!text) return { action: 'ignore', reason: 'empty_text' };

  return { action: 'process', eventId: body.event_id, threadTs, slackTs, text };
}
