import 'server-only';
import { escapeSlackText } from '@/lib/chat/slack';
import { formatKst, formatKstTime } from '@/lib/chat/kst';
import { buildChatRefCode, CONTACT_CHANNEL_LABELS, type ContactChannel } from '@/lib/chat/contactChannels';
import { CHAT_CONTACT_EMAIL } from '@/lib/constants';

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

/** 직원에게 보이는 채널 이름 — 이메일만 한국어, 메신저는 브랜드명. 모르는 값은 그대로 둔다. */
export function staffChannelLabel(channel: string | null | undefined): string {
  if (!channel) return '';
  if (channel === 'email') return '이메일';
  return CONTACT_CHANNEL_LABELS[channel as ContactChannel] ?? channel;
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

/** 연락처 알림이 올라가는 곳: 손님 방 / #해외문의 스레드 / 붙일 곳이 없어 #해외문의에 단독 게시. */
export type ContactNoticeMode = 'room' | 'thread' | 'standalone';

const FOLLOWUP_CLASSIFIED_NOTE = "_'오늘 연락할 손님'으로 분류했습니다. 5·12·30분 알림은 울리지 않습니다._";

/**
 * 손님이 연락처를 남겼을 때 올리는 글 (스펙 2026-10-01 §4.5 b).
 * - followup=false(CHAT_FOLLOWUP=off): '오늘 연락할 손님' 안내를 붙이지 않는다 — 알림이 계속 울리고 번역본도 올라오지 않기 때문이다.
 * - 번역본은 방에만 올라오므로 그 안내는 mode='room'에만 붙인다.
 */
export function buildContactText(args: {
  channelLabel: string;
  handle: string;
  mode: ContactNoticeMode;
  followup: boolean;
  /** 단독 게시(mode='standalone')일 때 붙이는 관리자 화면 주소 */
  adminUrl: string | null;
}): string {
  const lines = [`📱 *손님이 연락처를 남겼습니다* — ${args.channelLabel}: ${escapeSlackText(args.handle)}`];
  if (!args.followup) {
    lines.push('_이 연락처로 먼저 연락해 주세요._');
  } else if (args.mode === 'room') {
    lines.push(
      FOLLOWUP_CLASSIFIED_NOTE,
      '_이 방에 한국어로 답을 쓰면 바로 아래에 번역본이 올라옵니다. 복사해서 위챗·왓츠앱·메일에 붙여 넣으세요._',
      '_방에 답을 쓰면 목록에서 빠집니다. 상담이 끝나면 방을 보관(완료)해 주세요._'
    );
  } else if (args.mode === 'thread') {
    lines.push(FOLLOWUP_CLASSIFIED_NOTE, '_이 스레드에 답글을 쓰면 목록에서 빠집니다._');
  } else {
    lines.push(FOLLOWUP_CLASSIFIED_NOTE, '_관리자 화면에서 답하면 목록에서 빠집니다._');
  }
  if (args.mode === 'standalone' && args.adminUrl) {
    lines.push(`🔗 <${args.adminUrl}|관리자 화면에서 열기>`);
  }
  return lines.join('\n');
}

/**
 * 손님이 카드에서 병원 연락 단추를 눌렀을 때 방/스레드에 올리는 한 줄 (§4.5 b).
 * copyHint = 번역본이 이 방에 올라오는 경우(방 모드 + CHAT_FOLLOWUP 켜짐)에만 그 안내를 붙인다.
 */
export function buildMessengerClickText(args: {
  channel: ContactChannel;
  sessionId: string;
  copyHint: boolean;
}): string {
  const code = `#${buildChatRefCode(args.sessionId)}`;
  let body: string;
  if (args.channel === 'wechat') {
    body = `📲 손님이 병원 WeChat 아이디·QR을 확인했습니다 — 업무폰 WeChat에서 친구 요청과 코드 ${code} 메시지를 확인해 주세요.`;
  } else if (args.channel === 'email') {
    body = `📲 손님이 병원 이메일 주소를 확인했습니다 — ${CHAT_CONTACT_EMAIL} 메일함에서 코드 ${code} 가 담긴 메일을 확인해 주세요.`;
  } else {
    const label = CONTACT_CHANNEL_LABELS[args.channel];
    body = `📲 손님이 ${label}으로 이어가기를 눌렀습니다 — 병원 ${label}에서 코드 ${code} 가 담긴 메시지를 확인해 주세요.`;
  }
  return args.copyHint ? `${body} 이 방에 답을 쓰면 번역본이 아래에 올라옵니다.` : body;
}

/** 직원 답글의 번역본 — 번역문만 담는다. 휴대폰 Slack의 "텍스트 복사"가 메시지 전체를 복사하므로 머리말·꾸밈을 붙이지 않는다 (§4.5 d). */
export function buildTranslationCopyText(translated: string): string {
  return escapeSlackText(translated);
}

/** 가격 문의에 이벤트 링크가 자동으로 나갔음을 직원에게 알린다 (§4.10). */
export function buildEventHintNote(url: string): string {
  return ['🎁 _가격 문의로 보여 손님에게 이벤트 링크를 자동으로 보냈습니다. 가격은 직접 답해 주세요._', url].join('\n');
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
  '_손님에게는 접수 안내(예상 시간·연락처 요청·시술과 방문일 질문)가 자동으로 나갔습니다._';
/** 시작 화면에서 이메일을 넣은 손님의 방 첫 메시지에 붙이는 꼬리말 (§4.5 b). */
export const ROOM_EMAIL_CONTACT_NOTE =
  "_이메일을 남긴 손님입니다 — '오늘 연락할 손님'으로 관리되며 재촉 알림은 울리지 않습니다. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다._";

function joinHead(parts: Array<string | null | undefined>): string {
  return parts.filter((p): p is string => Boolean(p && p.length > 0)).join(' · ');
}

/** 방의 첫 메시지(손님 첫 발신): 전원 멘션 + 접수 시각 + 본문 + 꼬리말 2줄 (+ 연락처 꼬리말) */
export function buildRoomFirstText(args: {
  mentionAll: string;
  receivedAt: string;
  visitorLocale: string;
  originalText: string;
  translatedText: string | null;
  /** 연락처가 이미 있는 손님이면 ROOM_EMAIL_CONTACT_NOTE */
  contactNote?: string | null;
}): string {
  const head = joinHead(['🔴 *새 문의*', args.mentionAll, `📥 ${formatKst(args.receivedAt)}`]);
  const lines = [
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
  ];
  if (args.contactNote) lines.push(args.contactNote);
  return lines.join('\n');
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

export type FeedKind = 'new' | 'resolved' | 'closed' | 'reopened' | 'escalated' | 'contact';

export function buildFeedLine(args: {
  kind: FeedKind;
  visitorName: string | null;
  visitorLocale: string;
  channelId: string | null;
  at: string;
  assignedLabel?: string | null;
  minutes?: number;
  /** kind='contact'일 때 남긴 채널 이름 (WeChat, 이메일 …) */
  contactLabel?: string | null;
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
    case 'contact':
      return joinHead(['📋 연락처 남김', `${localeFlag(args.visitorLocale)} ${name}`, args.contactLabel, link, when]);
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
  session_not_found: '이 스레드는 상담과 연결돼 있지 않습니다. 사이드바의 손님 방(chat-…) 본문에 답해 주세요',
  empty_text: '내용이 비어 있습니다',
  error: '서버 오류가 났습니다. 관리자 화면에서 다시 보내 주세요',
};

export function buildDeliveryFailureText(reason: string): string {
  return `⚠️ 방금 답글이 손님에게 전달되지 않았습니다 · 사유: ${FAILURE_REASON_KO[reason] ?? escapeSlackText(reason)}`;
}

// ── "오늘 연락할 손님" 하루 두 번 요약 (스펙 2026-10-01 §4.5 c) ────────────────

export interface FollowupDigestItem {
  visitorName: string | null;
  visitorLocale: string;
  /** 'WeChat', '이메일' 등. 여러 개면 ', '로 이은 것 */
  contactLabel: string;
  /** 손님이 답을 기다리기 시작한 시각 (chat_sessions.awaiting_since) */
  awaitingSince: string;
  /** 방 채널 ID. 방이 없으면(스레드 방식) null */
  channelId: string | null;
  /** 방이 없을 때 대신 붙이는 관리자 화면 주소 */
  adminUrl: string | null;
}

/** 요약 한 번에 이름을 적는 최대 인원 — 넘으면 "외 N명". */
export const FOLLOWUP_DIGEST_MAX_LINES = 20;

export function buildFollowupDigestText(args: { mentionAll: string; items: FollowupDigestItem[] }): string {
  const head = [`📋 *오늘 연락할 손님 ${args.items.length}명*`, args.mentionAll].filter(Boolean).join(' ');
  const lines = args.items.slice(0, FOLLOWUP_DIGEST_MAX_LINES).map((it) => {
    const where = it.channelId ? `<#${it.channelId}>` : it.adminUrl ? `<${it.adminUrl}|관리자 화면>` : null;
    const when = `${formatKst(it.awaitingSince).replace(/ KST$/, '')} 문의`;
    const who = `${localeFlag(it.visitorLocale)} ${escapeSlackText(it.visitorName || '익명')}`;
    return `• ${joinHead([who, it.contactLabel, when, where])}`;
  });
  const rest = args.items.length - lines.length;
  if (rest > 0) lines.push(`• 외 ${rest}명`);
  return [head, ...lines, '_방에 답을 쓰거나 방을 보관(완료)하면 목록에서 빠집니다._'].join('\n');
}

// ── 피드 줄 스레드 답장 (2026-09-10) ─────────────────────────────────────────

/** 피드 줄 본문의 첫 채널 링크 `<#C…>` 또는 `<#C…|이름>` → 채널 ID. 없으면 null. */
export function extractRoomChannelFromFeedText(text: string): string | null {
  const m = /<#([CG][A-Z0-9]+)(?:\|[^>]*)?>/.exec(text);
  return m ? m[1] : null;
}

/** 피드 스레드에 달린 직원 답장을 손님 방에 남기는 복사본. */
export function buildFeedReplyMirrorText(args: { senderLabel: string | null; text: string }): string {
  const who = args.senderLabel ? ` · ${escapeSlackText(args.senderLabel)}` : '';
  return [`↩️ _피드에서 답함${who}_`, escapeSlackText(args.text)].join('\n');
}
