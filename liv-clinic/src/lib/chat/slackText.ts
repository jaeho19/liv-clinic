import 'server-only';
import { escapeSlackText } from '@/lib/chat/slack';
import { formatKst, formatKstTime } from '@/lib/chat/kst';
import { buildChatRefCode } from '@/lib/chat/contactChannels';

// Slack에 보내는 모든 문구는 여기서만 만든다 — I/O 없음, 전부 Vitest로 고정.
// 표시가 틀렸다면 원인은 세션 행이거나 이 파일의 함수 하나뿐이다.

export const LOCALE_FLAG: Record<string, string> = {
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

const LOCALE_KO_NAME: Record<string, string> = {
  en: '영어',
  ja: '일본어',
  zh: '중국어(간체)',
  'zh-TW': '중국어(번체)',
  vi: '베트남어',
  th: '태국어',
  ru: '러시아어',
  fr: '프랑스어',
  mn: '몽골어',
  ar: '아랍어',
};

export function localeFlag(locale: string): string {
  return LOCALE_FLAG[locale] ?? '🌐';
}

export function localeKoName(locale: string): string {
  return LOCALE_KO_NAME[locale] ?? locale;
}

export function adminSessionUrl(sessionId: string): string | null {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/admin/chat/${sessionId}`;
}

export type RelaySender = 'visitor' | 'operator';

/**
 * 메시지 본문 라인.
 * - visitor : 한국어 번역을 먼저 보여주고 외국어 원문을 인용으로 붙인다.
 * - operator: 직원이 쓴 한국어 원문을 보여주고 방문자에게 나간 번역문을 인용으로 붙인다.
 */
export function buildBodyLines(args: {
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

// ── 스레드 모드 (현행 문구, 변경 없음) ────────────────────────────────────

/** 루트(첫) 메시지 — 세션 컨텍스트를 헤더로 붙인다. */
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
  const flag = localeFlag(args.visitorLocale);
  const name = args.visitorName || '익명';
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

/** 스레드 후속 메시지 — 본문만 (운영자면 머리말 1줄). 방 모드의 관리자 화면 답장 미러에도 쓴다. */
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

/** 방문자 연락처 릴레이 본문. */
export function buildContactText(args: {
  channelLabel: string;
  handle: string;
  /** 방/스레드 없이 단독 게시될 때만 어드민 링크를 첨부한다. */
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

// ── 방 모드 ─────────────────────────────────────────────────────────────

export interface RoomSessionInfo {
  sessionId: string;
  visitorName: string | null;
  visitorLocale: string;
  visitorEmail: string | null;
}

/** 채널 주제: 🇻🇳 Thu Nguyen · 베트남어 · #A1B2C3D4 · thu@example.com · <관리자 링크> (250자 절단) */
export function buildRoomTopic(s: RoomSessionInfo): string {
  const parts = [
    `${localeFlag(s.visitorLocale)} ${escapeSlackText(s.visitorName || '익명')}`,
    localeKoName(s.visitorLocale),
    `#${buildChatRefCode(s.sessionId)}`,
  ];
  if (s.visitorEmail) parts.push(escapeSlackText(s.visitorEmail));
  const url = adminSessionUrl(s.sessionId);
  if (url) parts.push(`<${url}|관리자 화면에서 열기>`);
  return parts.join(' · ').slice(0, 250);
}

export const ROOM_FOOTER =
  '_이 채널에 쓰면 손님에게 번역되어 전달됩니다. 직원끼리 메모는 스레드로 남겨 주세요._';
export const ROOM_AUTO_ACK_NOTE =
  '_손님에게는 "잠시만 기다려 주세요" 자동 안내가 먼저 나갔습니다._';

function joinHead(parts: Array<string | null | undefined>): string {
  return parts.filter((p): p is string => Boolean(p && p.length > 0)).join(' · ');
}

/** 방의 첫 메시지(손님 첫 발신): 전원 멘션 + 접수 시각 + 본문 + 꼬리말 2줄 */
export function buildRoomFirstText(args: {
  mentionAll: string;
  receivedAt: string;
  visitorLocale: string;
  originalText: string;
  translatedText: string | null;
}): string {
  const head = joinHead(['🔴 *새 문의*', args.mentionAll, `📥 ${formatKst(args.receivedAt)}`]);
  return [
    head,
    ...buildBodyLines({
      sender: 'visitor',
      visitorLocale: args.visitorLocale,
      originalText: args.originalText,
      translatedText: args.translatedText,
    }),
    '',
    ROOM_FOOTER,
    ROOM_AUTO_ACK_NOTE,
  ].join('\n');
}

/** 방의 손님 후속 메시지: 담당자(또는 전원) 멘션 + 시각 + 본문. reopened면 🔔 머리말 */
export function buildRoomVisitorText(args: {
  mention: string;
  receivedAt: string;
  reopened: boolean;
  visitorLocale: string;
  originalText: string;
  translatedText: string | null;
}): string {
  const lead = args.reopened ? '🔔 *완료했던 문의에 손님이 다시 말을 걸었습니다*' : null;
  const head = joinHead([lead, args.mention, formatKstTime(args.receivedAt)]);
  return [
    head,
    ...buildBodyLines({
      sender: 'visitor',
      visitorLocale: args.visitorLocale,
      originalText: args.originalText,
      translatedText: args.translatedText,
    }),
  ].join('\n');
}

// ── #해외문의 피드 / 확대 알림 / 실패 알림 ───────────────────────────────

export type FeedKind = 'new' | 'resolved' | 'closed' | 'reopened' | 'escalated';

export function buildFeedLine(args: {
  kind: FeedKind;
  visitorName: string | null;
  visitorLocale: string;
  channelId: string | null;
  at: string;
  assignedLabel?: string | null;
  minutes?: number;
}): string {
  const name = escapeSlackText(args.visitorName || '익명');
  const link = args.channelId ? `<#${args.channelId}>` : null;
  const when = formatKst(args.at);
  const who = args.assignedLabel ? `담당 ${escapeSlackText(args.assignedLabel)}` : null;
  switch (args.kind) {
    case 'new':
      return joinHead(['🔴 새 문의', `${localeFlag(args.visitorLocale)} ${name}`, link, when]);
    case 'resolved':
      return joinHead(['✅ 완료', name, who, when]);
    case 'closed':
      return joinHead(['✅ 종료 안내 보냄', name, who, when]);
    case 'reopened':
      return joinHead(['🔄 다시 열림', name, link, when]);
    case 'escalated':
      return joinHead([`🚨 ${args.minutes ?? 30}분째 미응답`, name, link]);
  }
}

export function buildEscalationText(args: {
  level: 1 | 2 | 3;
  minutes: number;
  mention: string;
  assigneeMention: string | null;
}): string {
  if (args.level === 3) return `🚨 ${args.mention} ${args.minutes}분째 미응답입니다.`;
  if (args.level === 2 && args.assigneeMention) {
    return `⏰ ${args.mention} ${args.minutes}분째 답이 없습니다 · 담당 ${args.assigneeMention} 님이 응답하지 않아 전원에게 알립니다.`;
  }
  return `⏰ ${args.mention} ${args.minutes}분째 답이 없습니다.`;
}

const FAILURE_REASON_KO: Record<string, string> = {
  session_not_found: '이 채널과 연결된 상담을 찾지 못했습니다',
  empty_text: '내용이 비어 있습니다',
  error: '서버 오류가 났습니다. 관리자 화면에서 다시 보내 주세요',
};

export function buildDeliveryFailureText(reason: string): string {
  return `⚠️ 방금 답글이 손님에게 전달되지 않았습니다 · 사유: ${FAILURE_REASON_KO[reason] ?? reason}`;
}
