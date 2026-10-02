import 'server-only';
import { escapeSlackText, type SlackAttachment, type SlackBlock, type SlackLook } from '@/lib/chat/slack';
import {
  buildBodyLines,
  buildContactText,
  buildDeliveryFailureText,
  buildEscalationText,
  buildEventHintNote,
  buildFeedReplyMirrorText,
  buildMessengerClickText,
  buildReplyText,
  buildRoomFirstNoticeText,
  buildRoomFirstText,
  buildRoomVisitorText,
  buildTranslationCopyText,
  contactNoticeParts,
  deliveryFailureParts,
  escalationNoticeParts,
  EVENT_HINT_SENTENCE,
  localeKoName,
  messengerClickParts,
  ROOM_REOPENED_LEAD,
  roomFirstNoticeParts,
  type ContactNoticeArgs,
  type MessengerClickArgs,
  type NoticeParts,
  type RoomFirstNoticeArgs,
} from '@/lib/chat/slackText';

// 손님 방 안의 글 모양 (스펙 2026-10-01 slack-room-look §3.2~§3.4). 순수 함수 — I/O 없음.
// 문구는 slackText.ts가 만든다. 여기서는 보낸 사람 이름표·아이콘·색 막대만 정하고,
// 꾸민 글을 못 올릴 때 대신 올릴 글자만의 문구(plainText = 지금까지 운영하던 문구)를 함께 묶는다.
//
// 멘션은 색 막대 안에 넣지 않는다 — 막대 안의 멘션이 알림을 만드는지 확인하지 못했다. 항상 최상위 text에 둔다.
// 손님 글에는 막대를 붙이지 않는다 — 막대 안의 긴 글은 "더 보기"로 접힌다.

export interface StyledMessage extends SlackLook {
  /** 최상위 text — 화면에 그대로 보이고 멘션 알림에 쓰인다. 색 막대만 있는 알림은 '' */
  text: string;
  /** 꾸민 글을 못 올렸을 때(또는 SLACK_ROOM_LOOK=off) 대신 올리는 글자만의 문구 */
  plainText: string;
}

export const BAR_COLOR = {
  /** 자동 안내 — 새 문의 접수, 이벤트 링크 발송, 다시 말을 걸었음 */
  info: '#a8a6a8',
  /** 손님 쪽 연락 — 연락처 남김, 병원 연락 단추 누름 */
  contact: '#2e9e6b',
  /** 재촉, 전달 실패 */
  alert: '#d8452f',
} as const;
export type BarKind = keyof typeof BAR_COLOR;

export const NOTICE_LOOK: SlackLook = { username: 'LIV 알림', iconEmoji: ':bell:' };
export const COPY_LOOK: SlackLook = { username: '번역본 · 복사용', iconEmoji: ':clipboard:' };

const STAFF_COPY_ICON = ':leftwards_arrow_with_hook:';
const UNKNOWN_LOCALE_ICON = ':globe_with_meridians:';
const USERNAME_MAX = 70;

// slackText.ts의 LOCALE_FLAG와 같은 나라 (영어 = 영국기 관례). Slack 아이콘은 단축 이름으로 준다.
const LOCALE_ICON: Record<string, string> = {
  en: ':flag-gb:',
  ja: ':flag-jp:',
  zh: ':flag-cn:',
  'zh-TW': ':flag-tw:',
  vi: ':flag-vn:',
  th: ':flag-th:',
  ru: ':flag-ru:',
  fr: ':flag-fr:',
  mn: ':flag-mn:',
  ar: ':flag-sa:',
};

/** 이름표에 쓸 글자: 줄바꿈·탭·제어 문자를 공백 하나로 줄이고 70글자에서 자른다. */
export function cleanUsername(raw: string): string {
  const flat = Array.from(raw)
    .map((ch) => (ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127 ? ' ' : ch))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  return Array.from(flat).slice(0, USERNAME_MAX).join('').trim();
}

interface VisitorIdentity {
  visitorName: string | null;
  visitorLocale: string;
}

/** 손님 글의 이름표: `{이름} 손님` + 로케일의 국기. 이름이 없으면 `{언어 이름} 손님`. */
export function visitorLook(s: VisitorIdentity): SlackLook {
  const name = cleanUsername(s.visitorName ?? '');
  return {
    username: cleanUsername(`${name || localeKoName(s.visitorLocale)} 손님`),
    iconEmoji: LOCALE_ICON[s.visitorLocale] ?? UNKNOWN_LOCALE_ICON,
  };
}

function staffCopyLook(senderLabel: string | null, where: string): SlackLook {
  const who = cleanUsername(senderLabel ?? '');
  return { username: cleanUsername(who ? `${who} · ${where}` : where), iconEmoji: STAFF_COPY_ICON };
}

/** 색 막대 하나: 큰 줄(section) + 설명 줄(context — 작은 회색 글씨). fallback은 알림 미리보기용 글자. */
export function bar(kind: BarKind, parts: NoticeParts): SlackAttachment {
  const blocks: SlackBlock[] = [{ type: 'section', text: { type: 'mrkdwn', text: parts.headline } }];
  if (parts.notes.length > 0) {
    blocks.push({ type: 'context', elements: parts.notes.map((n) => ({ type: 'mrkdwn', text: n })) });
  }
  return { color: BAR_COLOR[kind], fallback: parts.headline.replace(/[*`]/g, ''), blocks };
}

function notice(kind: BarKind, parts: NoticeParts, plainText: string, text = ''): StyledMessage {
  return { ...NOTICE_LOOK, text, attachments: [bar(kind, parts)], plainText };
}

const joinLines = (lines: string[]): string => lines.filter((l) => l.length > 0).join('\n');

interface VisitorBody {
  originalText: string;
  translatedText: string | null;
}

// ── 손님 글 ─────────────────────────────────────────────────────────────

/** 방의 첫 손님 글. 글자만 문구는 지금까지의 첫 글 전체다(새 문의 머리말·꼬리말 포함) — 그때는 첫 알림을 따로 올리지 않는다. */
export function styledRoomFirstVisitor(
  args: VisitorBody & {
    session: VisitorIdentity;
    mentionAll: string;
    receivedAt: string;
    /** 연락처가 이미 있는 손님이면 ROOM_EMAIL_CONTACT_NOTE — 꾸민 글에서는 첫 알림 쪽에 붙는다 */
    contactNote?: string | null;
  }
): StyledMessage {
  const body = {
    visitorLocale: args.session.visitorLocale,
    originalText: args.originalText,
    translatedText: args.translatedText,
  };
  return {
    ...visitorLook(args.session),
    text: joinLines([args.mentionAll, ...buildBodyLines({ sender: 'visitor', ...body })]),
    plainText: buildRoomFirstText({
      mentionAll: args.mentionAll,
      receivedAt: args.receivedAt,
      contactNote: args.contactNote,
      ...body,
    }),
  };
}

/** 첫 손님 글 바로 뒤의 새 문의 알림 — 접수 시각·참조코드·사용법. */
export function styledRoomFirstNotice(args: RoomFirstNoticeArgs): StyledMessage {
  return notice('info', roomFirstNoticeParts(args), buildRoomFirstNoticeText(args));
}

/** 손님 후속 글. 시각 글자는 넣지 않는다(Slack이 글마다 보여 준다). reopened의 🔔 머리말은 글자만 문구에만 들어간다. */
export function styledRoomVisitor(
  args: VisitorBody & { session: VisitorIdentity; mention: string; receivedAt: string; reopened: boolean }
): StyledMessage {
  const body = {
    visitorLocale: args.session.visitorLocale,
    originalText: args.originalText,
    translatedText: args.translatedText,
  };
  return {
    ...visitorLook(args.session),
    text: joinLines([args.mention, ...buildBodyLines({ sender: 'visitor', ...body })]),
    plainText: buildRoomVisitorText({
      mention: args.mention,
      receivedAt: args.receivedAt,
      reopened: args.reopened,
      ...body,
    }),
  };
}

/** 완료(보관)했던 방에 손님이 다시 썼을 때, 손님 글 뒤에 붙는 알림. */
export function styledReopenedNotice(): StyledMessage {
  return notice('info', { headline: ROOM_REOPENED_LEAD, notes: [] }, ROOM_REOPENED_LEAD);
}

// ── 직원 답의 사본, 번역본 ─────────────────────────────────────────────────

/** 관리자 화면에서 쓴 직원 답의 사본. */
export function styledAdminReply(
  args: VisitorBody & { senderLabel: string | null; visitorLocale: string }
): StyledMessage {
  const body = {
    visitorLocale: args.visitorLocale,
    originalText: args.originalText,
    translatedText: args.translatedText,
  };
  return {
    ...staffCopyLook(args.senderLabel, '관리자 화면에서 답함'),
    text: joinLines(buildBodyLines({ sender: 'operator', ...body })),
    plainText: buildReplyText({ sender: 'operator', senderLabel: args.senderLabel, ...body }),
  };
}

/** #해외문의 피드 스레드에 쓴 직원 답을 손님 방에 남기는 사본. */
export function styledFeedReplyCopy(args: { senderLabel: string | null; text: string }): StyledMessage {
  return {
    ...staffCopyLook(args.senderLabel, '피드에서 답함'),
    text: escapeSlackText(args.text),
    plainText: buildFeedReplyMirrorText(args),
  };
}

/** 직원 답글의 번역본. 본문은 번역문만 — 휴대폰의 "텍스트 복사"가 본문 전체를 복사한다. 이름표는 복사되지 않는다. */
export function styledTranslationCopy(translated: string): StyledMessage {
  const text = buildTranslationCopyText(translated);
  return { ...COPY_LOOK, text, plainText: text };
}

// ── 알림 ────────────────────────────────────────────────────────────────

export function styledContactNotice(args: ContactNoticeArgs): StyledMessage {
  return notice('contact', contactNoticeParts(args), buildContactText(args));
}

export function styledMessengerClick(args: MessengerClickArgs): StyledMessage {
  return notice('contact', messengerClickParts(args), buildMessengerClickText(args));
}

export function styledEventHint(url: string): StyledMessage {
  return notice('info', { headline: `🎁 ${EVENT_HINT_SENTENCE}\n${url}`, notes: [] }, buildEventHintNote(url));
}

/** 재촉: 멘션은 최상위 text에(알림이 가야 한다), 문장은 빨간 막대에. */
export function styledEscalation(args: {
  level: 1 | 2 | 3;
  minutes: number;
  mention: string;
  assigneeMention: string | null;
}): StyledMessage {
  return notice('alert', escalationNoticeParts(args), buildEscalationText(args), args.mention);
}

export function styledDeliveryFailure(reason: string): StyledMessage {
  return notice('alert', deliveryFailureParts(reason), buildDeliveryFailureText(reason));
}
