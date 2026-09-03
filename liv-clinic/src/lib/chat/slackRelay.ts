import 'server-only';
import { createChatAdminClient, type ChatAdminClient } from '@/lib/chat/db';
import { broadcastToSession } from '@/lib/chat/broadcast';
import { translate } from '@/lib/chat/translation';
import type { VisitorLocale } from '@/lib/chat/serverI18n';
import {
  _internals,
  archiveChannel,
  getSlackChannelId,
  isSlackRelayConfigured,
  postSlackMessage,
  slackTextToPlain,
  unarchiveChannel,
} from '@/lib/chat/slack';
import { getStaffDirectory, mentionOf, type StaffDirectory } from '@/lib/chat/slackStaff';
import { ensureRoom, roomPrefix, type RoomDeps } from '@/lib/chat/slackRooms';
import { routeInbound } from '@/lib/chat/slackEvents';
import {
  adminSessionUrl,
  buildContactText,
  buildDeliveryFailureText,
  buildFeedLine,
  buildReplyText,
  buildRoomFirstText,
  buildRoomVisitorText,
  buildRootText,
  type RelaySender,
  type RoomSessionInfo,
} from '@/lib/chat/slackText';

// Slack ↔ chat_sessions/chat_messages 연결 계층. 두 방향 모두 throw-free.
//
// 세션의 slack_mode:
//   'room'   손님 전용 비공개 채널(slack_channel_id). 채널 본문 = 손님에게 전달, 스레드 = 내부 메모.
//   'thread' #해외문의 스레드(현행). 기존 세션과 방 생성 실패 폴백.
//   NULL     아직 Slack에 안 올라감 → 첫 릴레이에서 ensureRoom.
//
// supabase-js는 쓰기 실패를 throw하지 않고 `{ error }`로 돌려준다 — 모든 update/insert는
// error를 확인하고 실패 시 `[slack relay]` 경고를 한 줄 남긴다.

export { buildContactText, buildReplyText, buildRootText };
export type { RelaySender };

// chat_messages.original_text CHECK 제약 (028) — 넘기면 23514로 INSERT가 실패한다.
const MAX_MESSAGE_CHARS = 1000;

export interface RelaySessionRow {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_locale: string;
  status: string;
  slack_mode: string | null;
  slack_channel_id: string | null;
  slack_thread_ts: string | null;
  assigned_slack_user_id: string | null;
  assigned_label: string | null;
  resolved_at: string | null;
}

export const RELAY_SESSION_COLUMNS =
  'id, visitor_name, visitor_email, visitor_locale, status, slack_mode, slack_channel_id, slack_thread_ts, assigned_slack_user_id, assigned_label, resolved_at';

export type SlackTarget =
  | { mode: 'room'; channelId: string }
  | { mode: 'thread'; channelId: string | null; threadTs: string | null }
  | { mode: 'unassigned' };

/** 세션 행 → 게시 대상 (순수). */
export function resolveTarget(
  s: Pick<RelaySessionRow, 'slack_mode' | 'slack_channel_id' | 'slack_thread_ts'>,
  legacyChannelId: string | null
): SlackTarget {
  if (s.slack_mode === 'room' && s.slack_channel_id) return { mode: 'room', channelId: s.slack_channel_id };
  if (s.slack_mode === 'thread') {
    return { mode: 'thread', channelId: s.slack_channel_id ?? legacyChannelId, threadTs: s.slack_thread_ts };
  }
  return { mode: 'unassigned' };
}

/** 답변 직원이 한 명도 없으면 방·피드·실패 알림 등 오늘 없던 Slack 트래픽은 만들지 않는다. */
function hasResponders(): boolean {
  return getStaffDirectory().responderIds.length > 0;
}

function sessionInfo(s: RelaySessionRow): RoomSessionInfo {
  return {
    sessionId: s.id,
    visitorName: s.visitor_name,
    visitorLocale: s.visitor_locale,
    visitorEmail: s.visitor_email,
  };
}

async function loadSession(admin: ChatAdminClient, sessionId: string): Promise<RelaySessionRow | null> {
  const { data, error } = await admin
    .from('chat_sessions')
    .select(RELAY_SESSION_COLUMNS)
    .eq('id', sessionId)
    .maybeSingle();
  if (error || !data) {
    console.warn('[slack relay] session lookup failed:', error?.code ?? 'not_found');
    return null;
  }
  return data as RelaySessionRow;
}

async function persistSlackTs(admin: ChatAdminClient, messageId: string, ts: string): Promise<void> {
  const { error } = await admin.from('chat_messages').update({ slack_ts: ts }).eq('id', messageId);
  if (error) console.warn('[slack relay] slack_ts persist failed:', error.code ?? 'unknown');
}

/**
 * 방을 포기하고 스레드 모드로 되돌린다 — 방 생성 실패, 보관 해제 실패, 해제 후 재게시 실패에서 공용.
 * slack_thread_ts까지 비워야 뒤이은 루트 게시가 세션 대표 스레드를 다시 선점할 수 있다.
 */
async function revertToThreadMode(admin: ChatAdminClient, sessionId: string): Promise<void> {
  const { error } = await admin
    .from('chat_sessions')
    .update({ slack_mode: 'thread', slack_channel_id: null, slack_thread_ts: null, slack_room_name: null })
    .eq('id', sessionId);
  if (error) console.warn('[slack relay] thread mode revert failed:', error.code ?? 'unknown');
}

/** #해외문의 피드에 한 줄. 피드 채널이 없으면 아무것도 하지 않는다. */
export async function postFeed(text: string): Promise<void> {
  const feed = getSlackChannelId();
  if (!feed) return;
  const r = await postSlackMessage({ text, channelId: feed });
  if (!r.ok) console.warn('[slack relay] feed post failed:', r.error);
}

function makeRoomDeps(admin: ChatAdminClient, staff: StaffDirectory): RoomDeps {
  return {
    staffIds: staff.inviteIds,
    hasResponders: staff.responderIds.length > 0,
    prefix: roomPrefix(),
    sleep: (ms) => _internals.sleep(ms),
    async claimRoomMode(sessionId) {
      const { data, error } = await admin
        .from('chat_sessions')
        .update({ slack_mode: 'room' })
        .eq('id', sessionId)
        .is('slack_mode', null)
        .select('id');
      if (error) {
        // 선점 실패로 취급한다 — 호출자가 reloadTarget을 폴링하고 끝내 피드에 단독 게시한다.
        console.warn('[slack relay] room mode claim failed:', error.code ?? 'unknown');
        return false;
      }
      return Boolean(data && data.length > 0);
    },
    async setRoom(sessionId, channelId, roomName) {
      const { error } = await admin
        .from('chat_sessions')
        .update({ slack_channel_id: channelId, slack_room_name: roomName })
        .eq('id', sessionId);
      if (error) {
        // 여기서 삼키면 "방은 있는데 세션이 모르는" 상태가 된다 → reject해서 ensureRoom이 방을 접고 스레드로 폴백한다.
        console.warn('[slack relay] setRoom failed:', error.code ?? 'unknown');
        throw new Error(error.message);
      }
    },
    async setThreadMode(sessionId) {
      await revertToThreadMode(admin, sessionId);
    },
    async reloadTarget(sessionId) {
      const { data } = await admin
        .from('chat_sessions')
        .select('slack_mode, slack_channel_id')
        .eq('id', sessionId)
        .maybeSingle();
      if (!data) return null;
      if (data.slack_mode === 'room' && data.slack_channel_id) {
        return { mode: 'room', channelId: data.slack_channel_id };
      }
      if (data.slack_mode === 'thread') return { mode: 'thread' };
      return null;
    },
  };
}

// ── 아웃바운드: 손님 메시지 / 관리자 화면 답장 → Slack ────────────────────

export interface RelayOutboundArgs {
  sessionId: string;
  messageId: string;
  sender: RelaySender;
  /** visitor면 외국어 원문, operator면 직원이 입력한 한국어 원문. */
  originalText: string;
  /** visitor면 한국어 번역, operator면 방문자 언어 번역. 실패/스킵이면 null. */
  translatedText: string | null;
  /** operator일 때 Slack에 표시할 작성자 라벨(관리자 이메일 등). */
  senderLabel?: string | null;
  /** chat_messages.created_at — KST 접수 시각 표기용. 없으면 지금. */
  receivedAt?: string;
}

/**
 * 응답 이후(`after()`)에 호출되는 것을 전제로 한다.
 * 방 모드: 방이 없으면 만들고(ensureRoom), 채널 본문에 게시. 보관된 방이면 해제 후 🔔로 게시.
 * 스레드 모드: 현행과 동일 (루트 게시 후 조건부 UPDATE로 thread_ts 선점).
 */
export async function relayChatMessageToSlack(args: RelayOutboundArgs): Promise<void> {
  if (!isSlackRelayConfigured()) return;
  try {
    const admin = createChatAdminClient();
    const session = await loadSession(admin, args.sessionId);
    if (!session) return;
    const staff = getStaffDirectory();
    const legacy = getSlackChannelId();
    const receivedAt = args.receivedAt ?? new Date().toISOString();

    let target = resolveTarget(session, legacy);
    let firstInRoom = false;

    if (target.mode === 'unassigned') {
      const r = await ensureRoom(sessionInfo(session), makeRoomDeps(admin, staff));
      if (r.mode === 'room') {
        target = { mode: 'room', channelId: r.channelId };
        firstInRoom = r.created;
      } else if (r.mode === 'thread') {
        target = { mode: 'thread', channelId: legacy, threadTs: null };
      } else {
        // 경합에서 졌고 방이 끝내 안 보임 — 피드에 단독 게시. 답글은 chat_messages.slack_ts 역조회로 계속 전달된다.
        const posted = await postSlackMessage({ text: rootText(session, args), channelId: legacy ?? undefined });
        if (posted.ok && posted.ts) await persistSlackTs(admin, args.messageId, posted.ts);
        return;
      }
    }

    if (target.mode === 'room') {
      const outcome = await postInRoom(admin, session, staff, target.channelId, args, receivedAt, firstInRoom);
      if (outcome !== 'fallback_thread') return;
      target = { mode: 'thread', channelId: legacy, threadTs: null };
    }

    if (target.mode === 'thread') await postInThread(admin, session, target, args);
  } catch (e) {
    console.warn('[slack relay] outbound failed:', e);
  }
}

function rootText(session: RelaySessionRow, args: RelayOutboundArgs): string {
  return buildRootText({
    sessionId: session.id,
    sender: args.sender,
    senderLabel: args.senderLabel ?? null,
    visitorName: session.visitor_name,
    visitorLocale: session.visitor_locale,
    visitorEmail: session.visitor_email,
    originalText: args.originalText,
    translatedText: args.translatedText,
  });
}

function roomText(
  session: RelaySessionRow,
  staff: StaffDirectory,
  args: RelayOutboundArgs,
  receivedAt: string,
  firstInRoom: boolean,
  reopened: boolean
): string {
  if (args.sender === 'operator') {
    return buildReplyText({
      sender: 'operator',
      senderLabel: args.senderLabel ?? null,
      visitorLocale: session.visitor_locale,
      originalText: args.originalText,
      translatedText: args.translatedText,
    });
  }
  const body = {
    visitorLocale: session.visitor_locale,
    originalText: args.originalText,
    translatedText: args.translatedText,
  };
  if (firstInRoom) return buildRoomFirstText({ mentionAll: staff.mentionAll(), receivedAt, ...body });
  // 담당자가 있으면 담당자만, 없으면 전원. 관찰자는 mentionAll에 들어 있지 않다.
  const mention = session.assigned_slack_user_id ? mentionOf(session.assigned_slack_user_id) : staff.mentionAll();
  return buildRoomVisitorText({ mention, receivedAt, reopened, ...body });
}

async function postInRoom(
  admin: ChatAdminClient,
  session: RelaySessionRow,
  staff: StaffDirectory,
  channelId: string,
  args: RelayOutboundArgs,
  receivedAt: string,
  firstInRoom: boolean
): Promise<'posted' | 'failed' | 'fallback_thread'> {
  let posted = await postSlackMessage({
    text: roomText(session, staff, args, receivedAt, firstInRoom, false),
    channelId,
  });

  if (!posted.ok && posted.error === 'is_archived') {
    // 완료(보관)된 방에 손님이 다시 말을 걸었다 → 해제 후 🔔로 게시 + 피드에 '다시 열림'
    const un = await unarchiveChannel(channelId);
    if (!un.ok) {
      console.warn('[slack relay] unarchive failed, switching session to thread mode:', un.error);
      await revertToThreadMode(admin, session.id);
      return 'fallback_thread';
    }
    posted = await postSlackMessage({ text: roomText(session, staff, args, receivedAt, false, true), channelId });
    if (!posted.ok || !posted.ts) {
      // 해제는 됐는데 재게시가 실패 — 손님 메시지를 잃지 않도록 스레드로 폴백한다.
      console.warn('[slack relay] reopened room post failed, switching session to thread mode:', posted.error);
      await revertToThreadMode(admin, session.id);
      return 'fallback_thread';
    }
    await postFeed(
      buildFeedLine({
        kind: 'reopened',
        visitorName: session.visitor_name,
        visitorLocale: session.visitor_locale,
        channelId,
        at: receivedAt,
      })
    );
  }

  if (!posted.ok || !posted.ts) {
    console.warn('[slack relay] room post failed:', posted.error);
    return 'failed';
  }
  await persistSlackTs(admin, args.messageId, posted.ts);
  if (firstInRoom) {
    await postFeed(
      buildFeedLine({
        kind: 'new',
        visitorName: session.visitor_name,
        visitorLocale: session.visitor_locale,
        channelId,
        at: receivedAt,
      })
    );
  }
  return 'posted';
}

/** 스레드 모드 — 현행 동작 그대로. 루트면 조건부 UPDATE로 thread_ts를 선점한다. */
async function postInThread(
  admin: ChatAdminClient,
  session: RelaySessionRow,
  target: { channelId: string | null; threadTs: string | null },
  args: RelayOutboundArgs
): Promise<void> {
  const isRoot = !target.threadTs;
  const text = isRoot
    ? rootText(session, args)
    : buildReplyText({
        sender: args.sender,
        senderLabel: args.senderLabel ?? null,
        visitorLocale: session.visitor_locale,
        originalText: args.originalText,
        translatedText: args.translatedText,
      });

  const result = await postSlackMessage({
    text,
    threadTs: target.threadTs,
    channelId: target.channelId ?? undefined,
  });
  if (!result.ok || !result.ts) {
    console.warn('[slack relay] postMessage failed:', result.error);
    return;
  }
  await persistSlackTs(admin, args.messageId, result.ts);

  if (isRoot) {
    // 동시 요청 중 하나만 세션 대표 스레드를 확정한다. 진 쪽 루트도 chat_messages.slack_ts로 역조회된다.
    const { data: claimed, error: claimError } = await admin
      .from('chat_sessions')
      .update({
        slack_thread_ts: result.ts,
        slack_channel_id: result.channel ?? target.channelId,
        slack_mode: 'thread',
      })
      .eq('id', session.id)
      .is('slack_thread_ts', null)
      .select('id');
    if (claimError) {
      console.warn('[slack relay] thread_ts claim failed:', claimError.code ?? 'unknown');
    } else if (!claimed || claimed.length === 0) {
      console.warn('[slack relay] thread_ts already claimed by a concurrent message');
    }
  }
}

/** 방문자가 남긴 메신저 연락처를 세션의 방/스레드에 게시한다. throw-free. */
export async function relayContactToSlack(args: {
  sessionId: string;
  channelLabel: string;
  handle: string;
}): Promise<void> {
  if (!isSlackRelayConfigured()) return;
  try {
    const admin = createChatAdminClient();
    const session = await loadSession(admin, args.sessionId);
    if (!session) return;
    const target = resolveTarget(session, getSlackChannelId());
    const attached = target.mode === 'room' || (target.mode === 'thread' && Boolean(target.threadTs));
    const text = buildContactText({
      channelLabel: args.channelLabel,
      handle: args.handle,
      adminUrl: attached ? null : adminSessionUrl(args.sessionId),
    });
    const result =
      target.mode === 'room'
        ? await postSlackMessage({ text, channelId: target.channelId })
        : await postSlackMessage({
            text,
            threadTs: target.mode === 'thread' ? target.threadTs : null,
            channelId: (target.mode === 'thread' ? target.channelId : null) ?? undefined,
          });
    if (!result.ok) console.warn('[slack relay] contact post failed:', result.error);
  } catch (e) {
    console.warn('[slack relay] contact relay failed:', e);
  }
}

// ── 완료 / 종료 / 재오픈 ↔ 보관 / 해제 ─────────────────────────────────

/** 완료·종료 시: 방이면 보관, 피드에 한 줄. throw-free. */
export async function archiveSessionRoom(sessionId: string, kind: 'resolved' | 'closed'): Promise<void> {
  if (!isSlackRelayConfigured()) return;
  // 답변 직원이 없으면 방도 피드도 없다 = 오늘의 스레드 모드와 100% 동일하게 아무것도 보내지 않는다.
  if (!hasResponders()) return;
  try {
    const admin = createChatAdminClient();
    const session = await loadSession(admin, sessionId);
    if (!session) return;
    const target = resolveTarget(session, getSlackChannelId());
    if (target.mode === 'room') {
      const r = await archiveChannel(target.channelId);
      if (!r.ok) console.warn('[slack relay] archive failed:', r.error);
    }
    await postFeed(
      buildFeedLine({
        kind,
        visitorName: session.visitor_name,
        visitorLocale: session.visitor_locale,
        channelId: target.mode === 'room' ? target.channelId : null,
        at: new Date().toISOString(),
        assignedLabel: session.assigned_label,
      })
    );
  } catch (e) {
    console.warn('[slack relay] archiveSessionRoom failed:', e);
  }
}

/** 완료 취소 시: 방이면 보관 해제. throw-free. */
export async function unarchiveSessionRoom(sessionId: string): Promise<void> {
  if (!isSlackRelayConfigured()) return;
  try {
    const admin = createChatAdminClient();
    const session = await loadSession(admin, sessionId);
    if (!session) return;
    const target = resolveTarget(session, getSlackChannelId());
    if (target.mode !== 'room') return;
    const r = await unarchiveChannel(target.channelId);
    if (!r.ok) console.warn('[slack relay] unarchive failed:', r.error);
  } catch (e) {
    console.warn('[slack relay] unarchiveSessionRoom failed:', e);
  }
}

/** 직원이 Slack에서 직접 방을 보관했다 → 완료 처리 (조건부: 이미 완료면 무변경). */
export async function handleRoomArchived(channel: string): Promise<void> {
  try {
    const admin = createChatAdminClient();
    const { error } = await admin
      .from('chat_sessions')
      .update({ resolved_at: new Date().toISOString(), resolved_label: 'Slack에서 보관' })
      .eq('slack_channel_id', channel)
      .eq('slack_mode', 'room')
      .is('resolved_at', null);
    if (error) console.warn('[slack relay] handleRoomArchived update failed:', error.code ?? 'unknown');
  } catch (e) {
    console.warn('[slack relay] handleRoomArchived failed:', e);
  }
}

/** 직원이 Slack에서 직접 보관을 해제했다 → 완료 취소. 이미 완료가 아니면 무변경(우리 해제의 메아리). */
export async function handleRoomUnarchived(channel: string): Promise<void> {
  try {
    const admin = createChatAdminClient();
    const { error } = await admin
      .from('chat_sessions')
      .update({ resolved_at: null, resolved_label: null })
      .eq('slack_channel_id', channel)
      .eq('slack_mode', 'room')
      .not('resolved_at', 'is', null);
    if (error) console.warn('[slack relay] handleRoomUnarchived update failed:', error.code ?? 'unknown');
  } catch (e) {
    console.warn('[slack relay] handleRoomUnarchived failed:', e);
  }
}

// ── 인바운드: 직원 답글 → 손님 ────────────────────────────────────────────

export type InboundOutcome =
  | 'delivered'
  | 'session_not_found'
  | 'unknown_channel'
  | 'internal_note'
  | 'legacy_top_level'
  | 'empty_text'
  | 'error';

export interface RelayInboundArgs {
  channel: string;
  slackTs: string;
  threadTs: string | null;
  isTopLevel: boolean;
  isBroadcast: boolean;
  text: string;
  slackUserId: string | null;
}

async function findSessionByRoom(admin: ChatAdminClient, channel: string): Promise<RelaySessionRow | null> {
  const { data } = await admin
    .from('chat_sessions')
    .select(RELAY_SESSION_COLUMNS)
    .eq('slack_channel_id', channel)
    .eq('slack_mode', 'room')
    .maybeSingle();
  return (data as RelaySessionRow | null) ?? null;
}

async function findSessionByThread(admin: ChatAdminClient, threadTs: string): Promise<RelaySessionRow | null> {
  // 1. 세션의 대표 스레드
  const { data: byThread } = await admin
    .from('chat_sessions')
    .select(RELAY_SESSION_COLUMNS)
    .eq('slack_thread_ts', threadTs)
    .maybeSingle();
  if (byThread) return byThread as RelaySessionRow;
  // 2. fallback: 해당 ts로 게시된 메시지에서 세션을 찾는다 (경합에서 진 루트, 피드 단독 게시)
  const { data: byMessage } = await admin
    .from('chat_messages')
    .select('session_id')
    .eq('slack_ts', threadTs)
    .limit(1)
    .maybeSingle();
  if (!byMessage) return null;
  return loadSession(admin, byMessage.session_id);
}

/**
 * Slack 메시지를 손님 채팅창으로 전달한다.
 * operator 메시지로 INSERT하므로 040 트리거가 unread_admin_count·awaiting_since를 리셋하고,
 * 어드민 상세(postgres_changes)와 방문자 위젯(broadcast)에 모두 반영된다.
 */
export async function relaySlackReplyToVisitor(args: RelayInboundArgs): Promise<InboundOutcome> {
  try {
    const admin = createChatAdminClient();
    const route = routeInbound(args, getSlackChannelId());
    if (route.kind === 'skip') return route.reason;

    const plain = slackTextToPlain(args.text).slice(0, MAX_MESSAGE_CHARS);
    if (!plain) return 'empty_text';

    const session =
      route.kind === 'room'
        ? await findSessionByRoom(admin, route.channel)
        : await findSessionByThread(admin, route.threadTs);
    if (!session) return route.kind === 'room' ? 'unknown_channel' : 'session_not_found';

    if (session.status !== 'open') {
      // 종료된 상담에 직원이 답하면 되살려서 전달한다 (09-01 §6.5-B). 손님은 돌아왔을 때 티저로 본다.
      const { error } = await admin
        .from('chat_sessions')
        .update({ status: 'open', closed_at: null })
        .eq('id', session.id);
      if (error) {
        console.error('[slack relay] reopen failed:', error);
        return 'error';
      }
    }

    const staff = getStaffDirectory();
    const senderLabel = staff.labelOf(args.slackUserId);
    const visitorLocale = session.visitor_locale as VisitorLocale;
    const translation = await translate(plain, 'ko', visitorLocale);

    const { data: inserted, error: insertError } = await admin
      .from('chat_messages')
      .insert({
        session_id: session.id,
        sender: 'operator',
        sender_admin_id: null, // Slack 경유 — Supabase 사용자와 매핑되지 않음
        original_text: plain,
        original_lang: 'ko',
        translated_text: translation.status === 'failed' ? null : translation.text,
        translated_lang: translation.status === 'failed' ? null : visitorLocale,
        translation_status: translation.status,
        translation_latency_ms: translation.latencyMs,
        translation_error: translation.errorCode ?? null,
        slack_ts: args.slackTs,
        slack_user_id: args.slackUserId,
        sender_label: senderLabel,
        source: 'slack',
      })
      .select('id')
      .single();
    if (insertError || !inserted) {
      console.error('[slack relay] inbound insert failed:', insertError);
      return 'error';
    }

    // 담당자 = 가장 최근에 답한 "답변 직원". 관찰자(SLACK_OBSERVERS)는 담당자가 되지 않는다.
    if (args.slackUserId && staff.isResponder(args.slackUserId)) {
      const { error: assignError } = await admin
        .from('chat_sessions')
        .update({
          assigned_slack_user_id: args.slackUserId,
          assigned_label: senderLabel,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', session.id);
      if (assignError) console.warn('[slack relay] assignee update failed:', assignError.code ?? 'unknown');
    }

    await broadcastToSession(session.id, {
      type: 'message_created',
      payload: { messageId: inserted.id, sender: 'operator' },
    });
    return 'delivered';
  } catch (e) {
    console.error('[slack relay] inbound failed:', e);
    return 'error';
  }
}

/** 전달 실패를 같은 방/스레드에 알린다. 의도된 무시(내부 메모 등)와 무관한 채널에는 보내지 않는다. */
export async function notifyDeliveryFailure(args: RelayInboundArgs, outcome: InboundOutcome): Promise<void> {
  const silent: InboundOutcome[] = ['delivered', 'internal_note', 'legacy_top_level', 'unknown_channel'];
  if (silent.includes(outcome)) return;
  // 답변 직원이 없으면 오늘과 동일하게 라우트의 console.warn만 남긴다.
  if (!hasResponders()) return;
  try {
    const r = await postSlackMessage({
      text: buildDeliveryFailureText(outcome),
      channelId: args.channel,
      threadTs: args.threadTs,
    });
    if (!r.ok) console.warn('[slack relay] failure notice not posted:', r.error);
  } catch (e) {
    console.warn('[slack relay] failure notice threw:', e);
  }
}
