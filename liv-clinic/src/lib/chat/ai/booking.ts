import {
  CONTACT_CHANNEL_LABELS,
  validateContactHandle,
  type ContactChannel,
} from '@/lib/chat/contactChannels';
import { checkBookingSlot, isRealDateKey, type CalendarContext } from './calendar';

// 가예약의 규칙 (스펙 2026-10-02 chat-ai-first-response §4.7). 순수 함수 — DB 는 bookingStore.ts 가 맡는다.
// AI가 낸 값은 그대로 믿지 않는다: 형식이 맞는 것만 받아들이고, 비어 있는 값으로 이미 받은 것을 지우지 못한다.

export interface BookingFields {
  /** 방문 날짜 (한국 날짜 YYYY-MM-DD) */
  date: string | null;
  /** 방문 시각 HH:MM (한국 시간) */
  time: string | null;
  /** 정확한 시각이 없을 때의 메모 — "afternoon", "any time" (손님 말 그대로) */
  timeNote: string | null;
  /** 시술 — 손님 말 그대로 */
  treatment: string | null;
  /** 시술 — 직원이 읽을 한국어 */
  treatmentKo: string | null;
  partySize: number | null;
  name: string | null;
  contactChannel: ContactChannel | null;
  contactHandle: string | null;
  arrivalDate: string | null;
  departureDate: string | null;
}

export const EMPTY_BOOKING: BookingFields = {
  date: null,
  time: null,
  timeNote: null,
  treatment: null,
  treatmentKo: null,
  partySize: null,
  name: null,
  contactChannel: null,
  contactHandle: null,
  arrivalDate: null,
  departureDate: null,
};

export interface ContactRef {
  channel: ContactChannel;
  handle: string;
}

const CHANNELS: readonly ContactChannel[] = ['whatsapp', 'wechat', 'line', 'email'];
/** 2pm · 2:30 PM · 11 a.m. */
const TIME_12H_RE = /(?<![\d:])(\d{1,2})(?::([0-5]\d))?\s*([ap])\.?\s?m\b\.?/gi;
/** 14:00 · 9:05 · 21:00:00 */
const TIME_24H_RE = /(?<![\d:])(\d{1,2}):([0-5]\d)(?::[0-5]\d)?(?![\d:])/g;
/** AI가 낸 시각 글의 한도 — 읽기 전에 자르면 "11:30pm" 이 "11:30" 이 된다 */
const TIME_RAW_MAX = 20;
const TIME_NOTE_MAX = 60;
const TEXT_MAX = 200;
const NAME_MAX = 60;

const text = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.replace(/\s+/g, ' ').trim();
  return t ? Array.from(t).slice(0, max).join('') : null;
};

/** AI 출력의 booking 객체(snake_case)를 읽는다. 모르는 값·틀린 형은 null 로 둔다(= "새로 받은 것 없음"). */
export function parseBookingOutput(raw: unknown): BookingFields {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const party = typeof o.party_size === 'number' ? o.party_size : Number.NaN;
  const channel = typeof o.contact_channel === 'string' ? o.contact_channel.trim().toLowerCase() : '';
  return {
    date: text(o.date, 10),
    time: text(o.time, TIME_RAW_MAX),
    timeNote: text(o.time_note, TIME_NOTE_MAX),
    treatment: text(o.treatment, TEXT_MAX),
    treatmentKo: text(o.treatment_ko, TEXT_MAX),
    partySize: Number.isInteger(party) && party >= 1 && party <= 20 ? party : null,
    name: text(o.name, NAME_MAX),
    contactChannel: (CHANNELS as readonly string[]).includes(channel) ? (channel as ContactChannel) : null,
    contactHandle: text(o.contact_handle, 254),
    arrivalDate: text(o.arrival_date, 10),
    departureDate: text(o.departure_date, 10),
  };
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

interface TimeScan {
  /** 찾은 시각 (HH:MM) — 나온 순서대로 */
  times: string[];
  /** 시각을 뺀 나머지 글 */
  rest: string;
}

function scanTimes(raw: string): TimeScan {
  const found: Array<{ at: number; time: string }> = [];
  // 12시간 꼴을 먼저 뗀다 — "2:30 PM" 의 "2:30" 을 24시간 꼴로 다시 읽지 않게
  let rest = raw.replace(TIME_12H_RE, (m: string, h: string, min: string | undefined, ap: string, at: number) => {
    const hour = Number(h);
    if (hour < 1 || hour > 12) return m;
    found.push({ at, time: `${pad2((hour % 12) + (ap.toLowerCase() === 'p' ? 12 : 0))}:${min ?? '00'}` });
    return ' '.repeat(m.length);
  });
  rest = rest.replace(TIME_24H_RE, (m: string, h: string, min: string, at: number) => {
    if (Number(h) > 23) return m;
    found.push({ at, time: `${pad2(Number(h))}:${min}` });
    return ' '.repeat(m.length);
  });
  return { times: found.sort((a, b) => a.at - b.at).map((f) => f.time), rest };
}

/** 글 안의 시각을 모두 찾는다 — "21:00 KST" → ["21:00"], "between 2pm and 4pm" → ["14:00", "16:00"], "afternoon" → []. */
export function timeTokens(raw: string): string[] {
  return scanTimes(raw).times;
}

/**
 * "14:00" · "9:05" · "2pm" · "2:30 PM" · "21:00 KST" · "around 3pm" → "HH:MM".
 * 시각이 하나가 아니거나("14:00-16:00") 다른 숫자가 섞여 있으면("10 or 11am") null — 호출자가 시간 메모로 돌린다.
 */
export function normalizeTime(raw: string): string | null {
  const { times, rest } = scanTimes(raw);
  return times.length === 1 && !/\d/.test(rest) ? times[0] : null;
}

/** 연락처를 견줄 때의 꼴 — WhatsApp 은 숫자만, 그 밖은 소문자. AI가 같은 번호를 "+6591234567" · "+65 9123 4567" 로 다르게 적는다. */
function contactKey(channel: ContactChannel, handle: string): string {
  return channel === 'whatsapp' ? handle.replace(/\D/g, '') : handle.trim().toLowerCase();
}

/** 같은 채널의 같은 연락처인가 (띄어쓰기 · 기호 · 대소문자는 보지 않는다). */
export function sameContact(a: ContactRef | null, b: ContactRef | null): boolean {
  return a !== null && b !== null && a.channel === b.channel && contactKey(a.channel, a.handle) === contactKey(b.channel, b.handle);
}

const PHONE_IN_TEXT_RE = /\+?\d[\d\s().-]{5,}\d/g;
const PHONE_SHAPED_RE = /^\+?[\d\s().-]+$/;
const MIN_PHONE_MATCH = 7;

/**
 * AI가 낸 연락처가 손님 글에 실제로 있는가. 없으면(지어냈거나 다른 사람의 것) 받지 않는다 —
 * 연락처는 가예약 요약에 그대로 찍히고, 검사(C-8)에서도 "손님 연락처"로 통과되기 때문이다.
 * 전화번호는 숫자만 견준다(나라 번호를 덧붙였거나 뺀 꼴도 같은 번호로 본다). 아이디 · 메일은 대소문자만 무시한다.
 */
export function contactInVisitorText(handle: string, visitorTexts: readonly string[]): boolean {
  const h = handle.trim().replace(/^@/, '');
  if (!h) return false;
  if (PHONE_SHAPED_RE.test(h)) {
    const d = h.replace(/\D/g, '');
    if (d.length < MIN_PHONE_MATCH) return false;
    return visitorTexts.some((t) =>
      (t.match(PHONE_IN_TEXT_RE) ?? []).some((found) => {
        const v = found.replace(/\D/g, '');
        return v.length >= MIN_PHONE_MATCH && (v === d || d.endsWith(v) || v.endsWith(d));
      })
    );
  }
  const needle = h.toLowerCase();
  return visitorTexts.some((t) => t.toLowerCase().includes(needle));
}

export interface MergeResult {
  next: BookingFields;
  /** 검사 C-10 에 걸린 이유 — 있으면 호출자가 AI에게 다시 쓰게 한다. 이때 날짜·시간은 받아들이지 않았다 */
  issues: string[];
  /** 연락처가 형식에 맞지 않아 버렸다 */
  contactRejected: boolean;
}

/**
 * 서버가 가진 가예약(stored)에 AI가 이번에 낸 값(incoming)을 합친다.
 * - 비어 있는 값은 무시한다(지우지 못한다).
 * - 날짜·시간은 달력으로 본다: 지난 날 · 휴진일 · 진료 시간 밖이면 받아들이지 않고 issues 에 적는다.
 * - 받아 둔 값이 새 값과 맞지 않으면 받아 둔 쪽을 비운다(AI는 값을 지울 수 없으므로 여기서 한다):
 *   날짜만 바뀌었는데 받아 둔 시각이 그 요일의 진료 시간 밖 → 시각을 비운다 / 받아 둔 날짜가 이제 지났거나 휴진일 → 날짜를 비운다.
 * - 시간 메모("after 8pm" · "21:00-22:00") 속의 시각도 진료 시간으로 본다.
 * - 연락처는 채널과 값이 함께 있고 형식이 맞을 때만 받아들인다.
 */
export function mergeBooking(stored: BookingFields, given: BookingFields, now: Date, ctx: CalendarContext): MergeResult {
  const next: BookingFields = { ...stored };
  const issues: string[] = [];

  // "2pm" 은 14:00 으로 읽고, 읽지 못하는 시각("after lunch")은 시간 메모로 돌린다(날짜까지 버리지 않게)
  const time = given.time === null ? null : normalizeTime(given.time);
  const incoming: BookingFields =
    time !== null ? { ...given, time } : { ...given, time: null, timeNote: given.timeNote ?? text(given.time, TIME_NOTE_MAX) };

  const dateGiven = incoming.date !== null && incoming.date !== stored.date;
  const timeGiven = incoming.time !== null && incoming.time !== stored.time;
  if (dateGiven || timeGiven) {
    const date = incoming.date ?? stored.date;
    let slotTime = incoming.time ?? stored.time;
    const dateOnly = date === null ? null : checkBookingSlot(date, null, now, ctx);
    if (date === null) {
      // 날짜 없이 시각만 받았다 — 날짜가 올 때 함께 본다
      next.time = slotTime;
    } else if (!dateGiven && (dateOnly === 'past' || dateOnly === 'closed_day')) {
      // 받아 둔 날짜가 이제 지났거나 휴진일이 됐다 → 날짜를 비우고 새 시각만 둔다(AI가 날짜를 다시 묻는다)
      next.date = null;
      next.time = slotTime;
    } else {
      let check = checkBookingSlot(date, slotTime, now, ctx);
      if (incoming.time === null && slotTime !== null && dateOnly === 'ok' && (check === 'outside_hours' || check === 'past')) {
        // 날짜만 바꿨는데 받아 둔 시각이 새 날짜에 맞지 않는다(토요일 17:00) → 날짜는 받고 시각을 비운다(AI가 시각을 다시 묻는다)
        slotTime = null;
        check = 'ok';
      }
      const time = slotTime;
      if (check === 'ok') {
        next.date = date;
        next.time = time;
      } else if (check === 'past') {
        issues.push(`booking_past:${date}${time ? ` ${time}` : ''}`);
      } else if (check === 'closed_day') {
        issues.push(`booking_closed_day:${date}`);
      } else if (check === 'outside_hours') {
        issues.push(`booking_outside_hours:${date} ${time}`);
      }
      // 'invalid'(형식이 틀림 · 너무 먼 날)는 조용히 무시한다 — 다음 차례에 AI가 다시 묻는다
    }
  }
  if (next.time !== null) next.timeNote = null;
  else if (incoming.timeNote !== null) next.timeNote = incoming.timeNote;

  // 시간 메모 속의 시각도 진료 시간으로 본다 — 정확한 시각이 아니라서 위의 검사를 지나지 않았다
  const noteDate = next.date;
  if (next.time === null && next.timeNote !== null && noteDate !== null && issues.length === 0) {
    const outside = timeTokens(next.timeNote).find((t) => checkBookingSlot(noteDate, t, now, ctx) === 'outside_hours');
    if (outside && incoming.timeNote !== null) issues.push(`booking_outside_hours:${noteDate} ${outside}`);
    // 받아 둔 메모가 새 날짜에 맞지 않는다 → 메모를 비운다(AI가 시각을 다시 묻는다)
    else if (outside) next.timeNote = null;
  }

  if (incoming.treatment !== null) next.treatment = incoming.treatment;
  if (incoming.treatmentKo !== null) next.treatmentKo = incoming.treatmentKo;
  if (incoming.partySize !== null) next.partySize = incoming.partySize;
  if (incoming.name !== null) next.name = incoming.name;
  if (incoming.arrivalDate !== null && isRealDateKey(incoming.arrivalDate)) next.arrivalDate = incoming.arrivalDate;
  if (incoming.departureDate !== null && isRealDateKey(incoming.departureDate)) next.departureDate = incoming.departureDate;

  let contactRejected = false;
  if (incoming.contactChannel !== null || incoming.contactHandle !== null) {
    const ok =
      incoming.contactChannel !== null &&
      incoming.contactHandle !== null &&
      validateContactHandle(incoming.contactChannel, incoming.contactHandle);
    const incomingContact: ContactRef | null = ok
      ? { channel: incoming.contactChannel!, handle: incoming.contactHandle!.trim() }
      : null;
    const storedContact: ContactRef | null =
      stored.contactChannel && stored.contactHandle ? { channel: stored.contactChannel, handle: stored.contactHandle } : null;
    if (incomingContact && sameContact(incomingContact, storedContact)) {
      // 같은 연락처를 다른 꼴로 다시 적었다 — 처음 받은 꼴을 둔다
    } else if (incomingContact) {
      next.contactChannel = incomingContact.channel;
      next.contactHandle = incomingContact.handle;
    } else {
      contactRejected = true;
    }
  }
  return { next, issues, contactRejected };
}

/** 가예약에 쓸 연락처 — 가예약에 받은 것이 없으면 세션에 저장된 것(카드·시작 화면에서 남긴 것). */
export function effectiveContact(b: BookingFields, sessionContact: ContactRef | null): ContactRef | null {
  if (b.contactChannel && b.contactHandle) return { channel: b.contactChannel, handle: b.contactHandle };
  return sessionContact;
}

/** 세션 행의 연락처 → ContactRef. 메신저가 있으면 메신저, 없으면 이메일. */
export function sessionContactOf(s: {
  visitor_email: string | null;
  visitor_messenger_channel: string | null;
  visitor_messenger_handle: string | null;
}): ContactRef | null {
  const channel = (s.visitor_messenger_channel ?? '').toLowerCase();
  if (s.visitor_messenger_handle && (CHANNELS as readonly string[]).includes(channel) && channel !== 'email') {
    return { channel: channel as ContactChannel, handle: s.visitor_messenger_handle };
  }
  if (s.visitor_email) return { channel: 'email', handle: s.visitor_email };
  return null;
}

/** 가예약이 "찼다" — 날짜 + (시각 또는 시간 메모) + 연락처. */
export function isBookingComplete(b: BookingFields, sessionContact: ContactRef | null): boolean {
  return Boolean(b.date && (b.time || b.timeNote) && effectiveContact(b, sessionContact));
}

/**
 * 직원에게 알린 내용의 지문 — 날짜|시각|인원|채널|연락처. 시술·이름·시간 메모는 넣지 않는다(AI가 매번 조금씩 다르게 적는다).
 * 연락처는 견주는 꼴로 넣는다 — 같은 번호를 다르게 적었다고 "가예약 변경"을 알리지 않게.
 */
export function bookingKey(b: BookingFields, sessionContact: ContactRef | null): string {
  const c = effectiveContact(b, sessionContact);
  return [b.date ?? '', b.time ?? '', b.partySize ?? '', c?.channel ?? '', c ? contactKey(c.channel, c.handle) : ''].join('|');
}

export type BookingEvent = 'requested' | 'changed' | null;

/**
 * 이번 차례에 직원에게 알릴 일이 있는가.
 * requested = 처음 찼다, changed = 찬 뒤에 날짜·시각·인원·연락처가 바뀌었다.
 */
export function bookingEvent(
  prev: { status: 'collecting' | 'requested'; notifiedKey: string | null },
  next: BookingFields,
  sessionContact: ContactRef | null
): BookingEvent {
  if (!isBookingComplete(next, sessionContact)) return null;
  if (prev.status !== 'requested') return 'requested';
  return bookingKey(next, sessionContact) === prev.notifiedKey ? null : 'changed';
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** 직원에게 보이는 채널 이름 — 이메일만 한국어, 메신저는 브랜드명 (slackText.staffChannelLabel 과 같다). */
export function channelLabelKo(channel: ContactChannel): string {
  return channel === 'email' ? '이메일' : CONTACT_CHANNEL_LABELS[channel];
}

/** `10/14(수)` */
export function dateLabelKo(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}(${WEEKDAY_KO[d.getUTCDay()]})`;
}

/** `10/14(수) 14:00` — 시각이 없으면 시간 메모, 그것도 없으면 `시간 미정`. 날짜가 없으면 '' */
export function bookingWhenKo(b: Pick<BookingFields, 'date' | 'time' | 'timeNote'>): string {
  if (!b.date) return '';
  return `${dateLabelKo(b.date)} ${b.time ?? b.timeNote ?? '시간 미정'}`;
}

/**
 * 직원이 보는 가예약 한 줄 (Slack 파란 막대 · 관리자 화면):
 * `10/14(수) 14:00 · 2명 · 울쎄라피 프라임 · WhatsApp +65 9123 4567 · Emma` — 없는 항목은 뺀다.
 */
export function bookingSummaryKo(b: BookingFields, sessionContact: ContactRef | null): string {
  const c = effectiveContact(b, sessionContact);
  const parts = [
    bookingWhenKo(b),
    b.partySize ? `${b.partySize}명` : '',
    b.treatmentKo ?? b.treatment ?? '',
    c ? `${channelLabelKo(c.channel)} ${c.handle}` : '',
    b.name ?? '',
  ];
  return parts.filter((p) => p.length > 0).join(' · ');
}

/** 프롬프트의 BOOKING SO FAR — 서버가 가진 기록. 이것이 기준이다(AI가 받았다고 생각해도 여기 없으면 다시 묻는다). */
export function bookingPromptText(b: BookingFields, sessionContact: ContactRef | null): string {
  const show = (v: string | number | null): string => (v === null || v === '' ? '(not given yet)' : String(v));
  const lines = [
    `date: ${show(b.date)}`,
    `time: ${show(b.time ?? (b.timeNote ? `(no exact time) ${b.timeNote}` : null))}`,
    `treatment: ${show(b.treatment)}`,
    `party_size: ${show(b.partySize)}`,
    `name: ${show(b.name)}`,
  ];
  if (b.contactChannel && b.contactHandle) {
    lines.push(`contact: ${b.contactChannel} ${b.contactHandle}`);
  } else if (sessionContact) {
    lines.push(`contact: ${sessionContact.channel} ${sessionContact.handle} (already saved — do not ask again)`);
  } else {
    lines.push('contact: (not given yet)');
  }
  if (b.arrivalDate || b.departureDate) lines.push(`in Seoul: ${show(b.arrivalDate)} ~ ${show(b.departureDate)}`);
  return lines.join('\n');
}
