// Slack 손님 방 이름 규칙 (스펙 2026-10-01 slack-room-look §3.1). 순수 함수만 있다.
//
// ⚠️ 이 파일은 다른 파일을 import하지 않는다. 운영 스크립트(scripts/slack-rename-open-rooms.mjs)가
//    node로 이 .ts를 바로 불러 같은 규칙을 쓴다 — 'server-only'·'@/…' 별칭·상대 import를 넣으면 그 스크립트가 깨진다.
//
// Slack 채널 이름 (2026-10-01 실측): 한글·한자·가나·키릴·태국어·아랍어 같은 각국 글자와 숫자·하이픈·밑줄은 받는다.
// 대문자·공백·마침표·따옴표는 invalid_name_specials 로 거부한다(고쳐 주지 않는다). 길이는 글자 수로 80.

export const ROOM_NAME_MAX = 80;

const SLUG_MAX = 30;
const LEGACY_SLUG_MAX = 16;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** 한국 시각의 날짜 `10월01일`. 두 자리로 맞춰야 이름순 정렬이 날짜순이 된다. */
export function roomDateLabel(at: string | Date): string {
  const parsed = typeof at === 'string' ? Date.parse(at) : at.getTime();
  const ms = Number.isFinite(parsed) ? parsed : Date.now();
  const d = new Date(ms + KST_OFFSET_MS);
  return `${pad2(d.getUTCMonth() + 1)}월${pad2(d.getUTCDate())}일`;
}

// tsconfig target(ES2017)의 정규식 리터럴 검사를 피하려고 생성자로 만든다(\p{…}는 Node가 지원한다).
const LATIN_RE = new RegExp('^\\p{Script=Latin}$', 'u');
const MARK_RE = new RegExp('^\\p{M}$', 'u');
const MARKS_RE = new RegExp('\\p{M}+', 'gu');
const LETTER_OR_DIGIT_RE = new RegExp('^[\\p{L}\\p{Nd}]$', 'u');

/** 악센트를 벗겨도 ASCII가 되지 않는 라틴 글자 */
const LATIN_FOLD: Record<string, string> = { đ: 'd', ø: 'o', ł: 'l', ß: 'ss', æ: 'ae', œ: 'oe', ı: 'i' };

function foldLatin(ch: string): string {
  const base = ch.normalize('NFD').replace(MARKS_RE, '').toLowerCase();
  return LATIN_FOLD[base] ?? base;
}

/**
 * 손님 이름 → 방 이름 조각.
 * 라틴 글자는 악센트를 벗겨 소문자로, 그 밖의 글자(한글·한자·가나 …)와 숫자는 그대로, 나머지는 '-' 하나로.
 * 30글자에서 자른다. 글자가 하나도 남지 않으면 ''(호출자가 언어 이름으로 대신한다).
 */
export function slugifyRoomName(name: string | null | undefined): string {
  if (!name) return '';
  let out = '';
  let afterLatin = false;
  for (const ch of name.normalize('NFKC')) {
    if (LATIN_RE.test(ch)) {
      out += foldLatin(ch);
      afterLatin = true;
    } else if (MARK_RE.test(ch)) {
      // 라틴 글자에 따로 붙은 결합 부호는 버린다. 태국어·아랍어 등의 부호는 글자의 일부라 둔다.
      if (!afterLatin) out += ch;
    } else {
      afterLatin = false;
      out += LETTER_OR_DIGIT_RE.test(ch) ? ch.toLowerCase() : '-';
    }
  }
  const collapsed = out.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return Array.from(collapsed).slice(0, SLUG_MAX).join('').replace(/-+$/g, '');
}

const LOCALE_ROOM_LABEL: Record<string, string> = {
  en: '영어',
  ja: '일본어',
  zh: '중국어',
  'zh-TW': '중국어번체',
  vi: '베트남어',
  th: '태국어',
  ru: '러시아어',
  fr: '프랑스어',
  mn: '몽골어',
  ar: '아랍어',
};

/** 이름을 안 적은 손님의 방 이름 조각: `영어손님`. 모르는 로케일은 로케일 글자 그대로. */
export function anonymousRoomLabel(locale: string): string {
  return `${LOCALE_ROOM_LABEL[locale] ?? slugifyRoomName(locale)}손님`;
}

/** 참조코드(세션 ID 앞 8자) 가운데 앞 6자, 소문자 — 예전 방 이름 끝에 붙던 그 부호. */
export function roomCode6(sessionId: string): string {
  return sessionId.replace(/-/g, '').slice(0, 6).toLowerCase();
}

export interface RoomNameInput {
  visitorName: string | null;
  visitorLocale: string;
  sessionId: string;
  /** 방을 만들게 한 첫 글의 시각 */
  at: string | Date;
}

/** 방을 만들 때 차례로 시도할 이름: `10월01일-이름` → `-2` → `-3` → `-참조코드6자`. Slack이 name_taken을 주면 다음 것. */
export function roomNameCandidates(a: RoomNameInput): string[] {
  const base = `${roomDateLabel(a.at)}-${slugifyRoomName(a.visitorName) || anonymousRoomLabel(a.visitorLocale)}`;
  return [base, `${base}-2`, `${base}-3`, `${base}-${roomCode6(a.sessionId)}`];
}

/** 이미 새 꼴(`NN월NN일-…`)인 방 이름인가 — 이름 바꾸기 스크립트가 건너뛸 방을 고를 때 쓴다. */
export function isDatedRoomName(name: string | null | undefined): boolean {
  return /^\d{2}월\d{2}일-/.test(name ?? '');
}

// ── 예전 꼴 (2026-09-03 규칙) — Slack이 새 이름을 invalid_name… 으로 거부할 때만 쓴다 ─────────

/** ASCII만 남긴 이름 조각, 16자. 한자·태국어처럼 ASCII로 못 만드는 이름은 ''. */
export function legacyAsciiSlug(name: string | null | undefined): string {
  if (!name) return '';
  const ascii = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return ascii.slice(0, LEGACY_SLUG_MAX).replace(/-+$/g, '');
}

/** `chat-{이름 ‖ 로케일}-{참조코드 6자}` — 지금까지 운영에서 항상 통한 꼴. */
export function legacyRoomName(a: { visitorName: string | null; visitorLocale: string; sessionId: string }): string {
  const slug = legacyAsciiSlug(a.visitorName) || a.visitorLocale.toLowerCase();
  return `chat-${slug}-${roomCode6(a.sessionId)}`;
}
