import 'server-only';
import { createChatAdminClient } from '@/lib/chat/db';
import { broadcastToSession } from '@/lib/chat/broadcast';
import { translate } from '@/lib/chat/translation';
import type { VisitorLocale } from '@/lib/chat/serverI18n';
import {
  escapeSlackText,
  getSlackChannelId,
  isSlackRelayConfigured,
  postSlackMessage,
  slackTextToPlain,
} from '@/lib/chat/slack';

// Slack ↔ chat_sessions/chat_messages 연결 계층.
// 아웃바운드(방문자 → Slack)와 인바운드(직원 답글 → 방문자) 양방향을 모두 담당한다.
// 두 함수 모두 throw-free: Slack 경로 실패가 채팅 자체를 막지 않는다.

// chat_messages.original_text CHECK 제약 (028) — 넘기면 23514로 INSERT가 실패한다.
const MAX_MESSAGE_CHARS = 1000;

const LOCALE_FLAG: Record<string, string> = {
  en: '🇬🇧',
  ja: '🇯🇵',
  zh: '🇨🇳',
  'zh-TW': '🇹🇼',
  vi: '🇻🇳',
  th: '🇹🇭',
  ru: '🇷🇺',
  fr: '🇫🇷',
  mn: '🇲🇳',
  ar: '🇸🇦',
};

function adminSessionUrl(sessionId: string): string | null {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/admin/chat/${sessionId}`;
}

/**
 * 메시지 본문 라인.
 * - visitor : 한국어 번역을 먼저 보여주고 외국어 원문을 인용으로 붙인다.
 * - operator: 직원이 쓴 한국어 원문을 보여주고 방문자에게 나간 번역문을 인용으로 붙인다.
 */
function buildBodyLines(args: {
  sender: RelaySender;
  visitorLocale: string;
  originalText: string;
  translatedText: string | null;
}): string[] {
  const original = escapeSlackText(args.originalText);
  const translated = args.translatedText?.trim();
  const hasUsefulTranslation = Boolean(translated && translated !== args.originalText.trim());

  if (args.sender === 'operator') {
    const lines = [original];
    if (hasUsefulTranslation) {
      lines.push(`> _${args.visitorLocale} 전달:_ ${escapeSlackText(translated!)}`);
    }
    return lines;
  }

  if (hasUsefulTranslation) {
    return [escapeSlackText(translated!), `> _원문:_ ${original}`];
  }
  return [original];
}

/** 어드민 화면에서 보낸 답장임을 Slack 쪽에서 구분할 수 있게 하는 머리말. */
function operatorPrefix(senderLabel: string | null): string {
  const who = senderLabel ? ` — ${escapeSlackText(senderLabel)}` : '';
  return `↩️ _관리자 화면 답장${who}_`;
}

/** 루트(첫) 메시지 — 세션 컨텍스트를 헤더로 붙인다. (테스트를 위해 export) */
export function buildRootText(args: {
  sessionId: string;
  sender: RelaySender;
  senderLabel: string | null;
  visitorName: string | null;
  visitorLocale: string;
  visitorEmail: string | null;
  originalText: string;
  translatedText: string | null;
}): string {
  const flag = LOCALE_FLAG[args.visitorLocale] ?? '🌐';
  const name = args.visitorName || '익명';
  // 방문자 메시지가 스레드를 여는 것이 정상 경로. 운영자가 먼저 말을 거는 경우도 열 수 있게 한다.
  const headline = args.sender === 'visitor' ? '새 채팅 문의' : '채팅 세션';
  const lines = [`${flag} *${headline}* — ${escapeSlackText(name)} (${args.visitorLocale})`];
  if (args.visitorEmail) lines.push(`✉️ ${escapeSlackText(args.visitorEmail)}`);
  lines.push('');
  if (args.sender === 'operator') lines.push(operatorPrefix(args.senderLabel));
  lines.push(...buildBodyLines(args));

  const url = adminSessionUrl(args.sessionId);
  if (url) {
    lines.push('');
    lines.push(`🔗 <${url}|관리자 화면에서 열기>`);
  }
  lines.push('');
  lines.push('_이 스레드에 답글을 달면 방문자에게 번역되어 전달됩니다._');
  return lines.join('\n');
}

/** 스레드 후속 메시지 — 본문만 (운영자면 머리말 1줄). (테스트를 위해 export) */
export function buildReplyText(args: {
  sender: RelaySender;
  senderLabel: string | null;
  visitorLocale: string;
  originalText: string;
  translatedText: string | null;
}): string {
  const lines = args.sender === 'operator' ? [operatorPrefix(args.senderLabel)] : [];
  lines.push(...buildBodyLines(args));
  return lines.join('\n');
}

export type RelaySender = 'visitor' | 'operator';

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
}

/**
 * 채팅 메시지를 Slack 채널로 릴레이한다 (방문자 메시지 + 어드민 UI 답장 양쪽).
 *
 * - 세션에 slack_thread_ts가 없으면 루트 메시지로 posting 후 세션에 ts를 기록한다.
 *   (동시 요청으로 두 개의 루트가 생겨도 `WHERE slack_thread_ts IS NULL` 조건부 UPDATE로
 *    세션에는 하나만 남고, 나머지 루트는 chat_messages.slack_ts로 여전히 역조회 가능하다.)
 * - 이미 있으면 thread_ts로 스레드에 이어 붙인다.
 *
 * 에코 없음: Slack에서 들어온 직원 답글은 이 함수를 거치지 않고 relaySlackReplyToVisitor가
 * chat_messages에 직접 INSERT하므로 다시 Slack으로 나가지 않는다. 또한 우리 봇이 posting한
 * 메시지는 되돌아올 때 bot_id/app_id를 달고 오므로 classifySlackEvent가 걸러낸다.
 *
 * 응답 이후(`after()`)에 호출되는 것을 전제로 한다 — 채팅 응답 지연에 영향을 주지 않는다.
 */
export async function relayChatMessageToSlack(args: RelayOutboundArgs): Promise<void> {
  if (!isSlackRelayConfigured()) return;

  try {
    const admin = createChatAdminClient();

    const { data: session, error: sessionError } = await admin
      .from('chat_sessions')
      .select('id, visitor_name, visitor_email, visitor_locale, slack_thread_ts')
      .eq('id', args.sessionId)
      .single();

    if (sessionError || !session) {
      console.warn('[slack relay] session lookup failed:', sessionError?.code ?? 'not_found');
      return;
    }

    const threadTs = session.slack_thread_ts;
    const isRoot = !threadTs;
    const senderLabel = args.senderLabel ?? null;

    const text = isRoot
      ? buildRootText({
          sessionId: session.id,
          sender: args.sender,
          senderLabel,
          visitorName: session.visitor_name,
          visitorLocale: session.visitor_locale,
          visitorEmail: session.visitor_email,
          originalText: args.originalText,
          translatedText: args.translatedText,
        })
      : buildReplyText({
          sender: args.sender,
          senderLabel,
          visitorLocale: session.visitor_locale,
          originalText: args.originalText,
          translatedText: args.translatedText,
        });

    const result = await postSlackMessage({ text, threadTs });
    if (!result.ok || !result.ts) {
      console.warn('[slack relay] postMessage failed:', result.error);
      return;
    }

    // 메시지 ↔ Slack ts 대응 기록 (인바운드 세션 역조회 fallback)
    const { error: msgError } = await admin
      .from('chat_messages')
      .update({ slack_ts: result.ts })
      .eq('id', args.messageId);
    if (msgError) {
      console.warn('[slack relay] slack_ts persist failed:', msgError.code ?? 'unknown');
    }

    if (isRoot) {
      // 조건부 UPDATE — 동시 요청 중 하나만 세션 스레드를 확정한다.
      const { data: claimed, error: claimError } = await admin
        .from('chat_sessions')
        .update({
          slack_thread_ts: result.ts,
          slack_channel_id: result.channel ?? getSlackChannelId(),
        })
        .eq('id', session.id)
        .is('slack_thread_ts', null)
        .select('id');

      if (claimError) {
        console.warn('[slack relay] thread_ts claim failed:', claimError.code ?? 'unknown');
      } else if (!claimed || claimed.length === 0) {
        // 경합에서 밀림 — 이 루트 메시지는 세션 대표 스레드가 아니지만
        // chat_messages.slack_ts로 답글 역조회는 계속 동작한다.
        console.warn('[slack relay] thread_ts already claimed by a concurrent message');
      }
    }
  } catch (e) {
    console.warn('[slack relay] outbound failed:', e);
  }
}

/** 방문자 연락처 릴레이 본문. (테스트를 위해 export) */
export function buildContactText(args: {
  channelLabel: string;
  handle: string;
  /** 세션 스레드가 없어 단독 게시될 때만 어드민 링크를 첨부한다. */
  adminUrl: string | null;
}): string {
  const lines = [
    `📱 *방문자가 연락처를 남겼습니다* — ${args.channelLabel}: ${escapeSlackText(args.handle)}`,
    '_근무 시작 후 이 연락처로 먼저 연락해 주세요._',
  ];
  if (args.adminUrl) {
    lines.push(`🔗 <${args.adminUrl}|관리자 화면에서 열기>`);
  }
  return lines.join('\n');
}

/**
 * 방문자가 남긴 메신저 연락처를 세션의 Slack 스레드에 게시한다.
 * 스태프용 한국어 고정 문구 — RelaySender('visitor'|'operator') 경로와 분리된 전용 헬퍼.
 * throw-free: 실패해도 연락처 저장 자체를 막지 않는다.
 */
export async function relayContactToSlack(args: {
  sessionId: string;
  channelLabel: string;
  handle: string;
}): Promise<void> {
  if (!isSlackRelayConfigured()) return;
  try {
    const admin = createChatAdminClient();
    const { data: session } = await admin
      .from('chat_sessions')
      .select('id, slack_thread_ts')
      .eq('id', args.sessionId)
      .maybeSingle();

    const threadTs = session?.slack_thread_ts ?? null;
    const text = buildContactText({
      channelLabel: args.channelLabel,
      handle: args.handle,
      adminUrl: threadTs ? null : adminSessionUrl(args.sessionId),
    });

    const result = await postSlackMessage({ text, threadTs });
    if (!result.ok) {
      console.warn('[slack relay] contact post failed:', result.error);
    }
  } catch (e) {
    console.warn('[slack relay] contact relay failed:', e);
  }
}

export type InboundOutcome =
  | 'delivered'
  | 'session_not_found'
  | 'session_closed'
  | 'empty_text'
  | 'error';

export interface RelayInboundArgs {
  /** 직원 답글이 달린 스레드의 루트 ts. */
  threadTs: string;
  /** 답글 자체의 ts. chat_messages.slack_ts로 저장한다. */
  slackTs: string;
  /** Slack 원문 (mrkdwn). */
  text: string;
}

/**
 * Slack 스레드 답글을 방문자 채팅창으로 전달한다.
 * operator 메시지로 INSERT하므로 028 트리거가 unread_admin_count를 0으로 리셋하고,
 * 어드민 상세 화면(postgres_changes)과 방문자 위젯(broadcast)에 모두 반영된다.
 */
export async function relaySlackReplyToVisitor(args: RelayInboundArgs): Promise<InboundOutcome> {
  try {
    const admin = createChatAdminClient();

    const plain = slackTextToPlain(args.text).slice(0, MAX_MESSAGE_CHARS);
    if (!plain) return 'empty_text';

    // 1. thread_ts → 세션 해석 (주 경로: 세션의 대표 스레드)
    let sessionId: string | null = null;
    const { data: byThread } = await admin
      .from('chat_sessions')
      .select('id')
      .eq('slack_thread_ts', args.threadTs)
      .maybeSingle();

    if (byThread) {
      sessionId = byThread.id;
    } else {
      // 2. fallback: 해당 ts로 posting된 메시지에서 세션을 찾는다
      //    (경합으로 세션 대표가 되지 못한 루트 메시지 스레드 대응)
      const { data: byMessage } = await admin
        .from('chat_messages')
        .select('session_id')
        .eq('slack_ts', args.threadTs)
        .limit(1)
        .maybeSingle();
      if (byMessage) sessionId = byMessage.session_id;
    }

    if (!sessionId) return 'session_not_found';

    const { data: session, error: sessionError } = await admin
      .from('chat_sessions')
      .select('id, visitor_locale, status')
      .eq('id', sessionId)
      .single();
    if (sessionError || !session) return 'session_not_found';
    if (session.status !== 'open') return 'session_closed';

    const visitorLocale = session.visitor_locale as VisitorLocale;

    // 3. ko → 방문자 언어 번역 (아웃바운드 경로와 동일한 정책)
    const translation = await translate(plain, 'ko', visitorLocale);

    // 4. operator 메시지로 INSERT
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
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      console.error('[slack relay] inbound insert failed:', insertError);
      return 'error';
    }

    // 5. 방문자 위젯에 도달 알림 (기존 Broadcast 구조 재사용)
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
