import { describe, it, expect } from 'vitest';
import {
  bookingEvent,
  bookingKey,
  bookingPromptText,
  bookingSummaryKo,
  bookingWhenKo,
  contactInVisitorText,
  dateLabelKo,
  effectiveContact,
  EMPTY_BOOKING,
  isBookingComplete,
  mergeBooking,
  parseBookingOutput,
  sameContact,
  sessionContactOf,
  timeTokens,
  type BookingFields,
} from '../booking';
import type { CalendarContext } from '../calendar';

const CTX: CalendarContext = {
  hours: { weekday: ['10:00', '19:00'], saturday: ['10:00', '16:00'], sunday: null },
  closedDates: new Set(['2026-10-05', '2026-10-15']),
};
const NOW = new Date('2026-10-02T16:20:00+09:00');
const given = (patch: Partial<BookingFields>): BookingFields => ({ ...EMPTY_BOOKING, ...patch });
const merge = (stored: BookingFields, patch: Partial<BookingFields>) => mergeBooking(stored, given(patch), NOW, CTX);

const FULL: BookingFields = {
  date: '2026-10-14',
  time: '14:00',
  timeNote: null,
  treatment: 'Ultherapy Prime',
  treatmentKo: '울쎄라피 프라임',
  partySize: 2,
  name: 'Emma',
  contactChannel: 'whatsapp',
  contactHandle: '+65 9123 4567',
  arrivalDate: '2026-10-14',
  departureDate: '2026-10-17',
};

describe('parseBookingOutput', () => {
  it('AI 출력(snake_case)을 읽는다', () => {
    expect(
      parseBookingOutput({
        date: '2026-10-14',
        time: '14:00',
        time_note: null,
        treatment: ' Ultherapy  Prime ',
        treatment_ko: '울쎄라피 프라임',
        party_size: 2,
        name: 'Emma',
        contact_channel: 'WhatsApp',
        contact_handle: '+65 9123 4567',
        arrival_date: '2026-10-14',
        departure_date: '2026-10-17',
      })
    ).toEqual(FULL);
  });

  it('없는 값 · 틀린 형 · 모르는 채널은 null', () => {
    expect(parseBookingOutput(null)).toEqual(EMPTY_BOOKING);
    expect(parseBookingOutput('x')).toEqual(EMPTY_BOOKING);
    expect(parseBookingOutput({ party_size: '2', contact_channel: 'kakao', name: '   ', date: 20261014 })).toEqual(
      EMPTY_BOOKING
    );
    expect(parseBookingOutput({ party_size: 0 }).partySize).toBeNull();
    expect(parseBookingOutput({ party_size: 21 }).partySize).toBeNull();
    expect(parseBookingOutput({ party_size: 2.5 }).partySize).toBeNull();
  });

  it('시각은 자르지 않고 읽는다 — "11:30pm" 을 "11:30" 으로 받지 않게', () => {
    expect(parseBookingOutput({ time: '11:30pm' }).time).toBe('11:30pm');
    expect(parseBookingOutput({ time: ' 2 PM ' }).time).toBe('2 PM');
  });

  it('긴 글은 자른다(시술 200자 · 이름 60자 · 시간 메모 60자)', () => {
    const out = parseBookingOutput({ treatment: 'a'.repeat(300), name: '가'.repeat(100), time_note: 'b'.repeat(100) });
    expect(out.treatment).toHaveLength(200);
    expect(out.name).toHaveLength(60);
    expect(out.timeNote).toHaveLength(60);
  });
});

describe('mergeBooking', () => {
  it('새 값을 더하고, 비어 있는 값은 이미 받은 것을 지우지 못한다', () => {
    const first = merge(EMPTY_BOOKING, { date: '2026-10-14', time: '14:00', partySize: 2 });
    expect(first).toMatchObject({ issues: [], contactRejected: false });
    expect(first.next).toMatchObject({ date: '2026-10-14', time: '14:00', partySize: 2, name: null });

    const second = merge(first.next, { name: 'Emma', treatment: 'Ulthera', treatmentKo: '울쎄라' });
    expect(second.next).toMatchObject({ date: '2026-10-14', time: '14:00', partySize: 2, name: 'Emma', treatmentKo: '울쎄라' });
  });

  it('휴진일 · 일요일은 받아들이지 않고 이유를 남긴다', () => {
    const r = merge(EMPTY_BOOKING, { date: '2026-10-15', time: '14:00' });
    expect(r.issues).toEqual(['booking_closed_day:2026-10-15']);
    expect(r.next.date).toBeNull();
    expect(r.next.time).toBeNull();
    expect(merge(EMPTY_BOOKING, { date: '2026-10-18' }).issues).toEqual(['booking_closed_day:2026-10-18']);
  });

  it('진료 시간 밖 · 지난 날도 받아들이지 않는다', () => {
    expect(merge(EMPTY_BOOKING, { date: '2026-10-17', time: '16:30' }).issues).toEqual([
      'booking_outside_hours:2026-10-17 16:30',
    ]);
    expect(merge(EMPTY_BOOKING, { date: '2026-10-01', time: '14:00' }).issues).toEqual(['booking_past:2026-10-01 14:00']);
    expect(merge(EMPTY_BOOKING, { date: '2026-10-01' }).issues).toEqual(['booking_past:2026-10-01']);
  });

  it('날짜만 바뀌었는데 받아 둔 시각이 새 날짜에 맞지 않으면, 날짜는 받고 시각을 비운다 (AI가 시각을 다시 묻는다)', () => {
    const stored = given({ date: '2026-10-14', time: '17:00' });
    // 토요일은 16시까지 → 17:00 은 밖이다
    const r = merge(stored, { date: '2026-10-17' });
    expect(r.issues).toEqual([]);
    expect(r.next).toMatchObject({ date: '2026-10-17', time: null, timeNote: null });
    // 새 날짜에도 맞는 시각이면 그대로 둔다
    expect(merge(stored, { date: '2026-10-16' }).next).toMatchObject({ date: '2026-10-16', time: '17:00' });
    // 새 날짜 자체가 휴진일이면 받아들이지 않는다
    const closed = merge(stored, { date: '2026-10-15' });
    expect(closed.issues).toEqual(['booking_closed_day:2026-10-15']);
    expect(closed.next).toMatchObject({ date: '2026-10-14', time: '17:00' });
    // 날짜와 시각을 함께 새로 받았으면 지금처럼 이유를 남긴다
    expect(merge(stored, { date: '2026-10-17', time: '16:30' }).issues).toEqual(['booking_outside_hours:2026-10-17 16:30']);
  });

  it('받아 둔 날짜가 이제 지났거나 휴진일이 됐으면, 새 시각을 받을 때 그 날짜를 비운다 (AI가 날짜를 다시 묻는다)', () => {
    const past = merge(given({ date: '2026-10-01', time: '14:00' }), { time: '15:00' });
    expect(past.issues).toEqual([]);
    expect(past.next).toMatchObject({ date: null, time: '15:00' });
    const holiday = merge(given({ date: '2026-10-15', time: '14:00' }), { time: '15:00' });
    expect(holiday.issues).toEqual([]);
    expect(holiday.next).toMatchObject({ date: null, time: '15:00' });
    // 날짜는 멀쩡하고 새 시각이 진료 시간 밖이면 지금처럼 이유를 남긴다
    expect(merge(given({ date: '2026-10-14', time: '14:00' }), { time: '19:30' }).issues).toEqual([
      'booking_outside_hours:2026-10-14 19:30',
    ]);
  });

  it('형식이 틀린 날짜는 조용히 무시한다', () => {
    const r = merge(EMPTY_BOOKING, { date: 'Oct 14', name: 'Emma' });
    expect(r.issues).toEqual([]);
    expect(r.next).toMatchObject({ date: null, name: 'Emma' });
  });

  it('"2pm" · "2:30 PM" · "9:05" 꼴은 HH:MM 으로 읽는다', () => {
    const at = (time: string) => merge(EMPTY_BOOKING, { date: '2026-10-14', time });
    expect(at('2pm').next).toMatchObject({ time: '14:00', timeNote: null });
    expect(at('2:30 PM').next.time).toBe('14:30');
    expect(at('11 a.m.').next.time).toBe('11:00');
    expect(at('12pm').next.time).toBe('12:00');
    expect(at('10:05').next.time).toBe('10:05');
    expect(merge(EMPTY_BOOKING, { time: '9:05' }).next.time).toBe('09:05');
    // 오후 11시 반은 진료 시간 밖이다 — 앞 다섯 글자만 보고 11:30 으로 받지 않는다
    expect(at('11:30pm').issues).toEqual(['booking_outside_hours:2026-10-14 23:30']);
    expect(at('12am').issues).toEqual(['booking_outside_hours:2026-10-14 00:00']);
  });

  it('읽지 못하는 시각은 시간 메모로 돌린다. 정확한 시각이 오면 메모를 지운다', () => {
    const r = merge(EMPTY_BOOKING, { date: '2026-10-14', time: 'after lunch' });
    expect(r.next).toMatchObject({ date: '2026-10-14', time: null, timeNote: 'after lunch' });
    expect(merge(EMPTY_BOOKING, { date: '2026-10-14', time: '25:00' }).next).toMatchObject({ time: null, timeNote: '25:00' });
    const note = merge(EMPTY_BOOKING, { date: '2026-10-14', timeNote: 'afternoon' });
    expect(note.next).toMatchObject({ time: null, timeNote: 'afternoon' });
    expect(merge(note.next, { time: '15:00' }).next).toMatchObject({ time: '15:00', timeNote: null });
  });

  it('시각 앞뒤에 다른 말이 붙어 있어도 읽는다 — "21:00 KST" 를 읽지 못해 진료 시간 검사를 지나치지 않게', () => {
    const at = (time: string) => merge(EMPTY_BOOKING, { date: '2026-10-14', time });
    expect(at('14:00 KST').next).toMatchObject({ time: '14:00', timeNote: null });
    expect(at('14:00:00').next.time).toBe('14:00');
    expect(at('around 3pm').next.time).toBe('15:00');
    expect(at('3 p.m. (Korea time)').next.time).toBe('15:00');
    expect(at('21:00 KST').issues).toEqual(['booking_outside_hours:2026-10-14 21:00']);
    expect(at('21:00:00').issues).toEqual(['booking_outside_hours:2026-10-14 21:00']);
    expect(at('around 9pm').issues).toEqual(['booking_outside_hours:2026-10-14 21:00']);
  });

  it('시각이 둘 이상이거나 다른 숫자가 섞여 있으면 정확한 시각으로 받지 않고 시간 메모로 둔다', () => {
    expect(merge(EMPTY_BOOKING, { date: '2026-10-14', time: '14:00-16:00' }).next).toMatchObject({
      time: null,
      timeNote: '14:00-16:00',
    });
    expect(merge(EMPTY_BOOKING, { date: '2026-10-14', time: '10 or 11am' }).next).toMatchObject({
      time: null,
      timeNote: '10 or 11am',
    });
  });

  it('시간 메모 속의 시각도 진료 시간으로 본다', () => {
    // 이번에 받은 메모가 진료 시간 밖이면 이유를 남긴다
    expect(merge(EMPTY_BOOKING, { date: '2026-10-14', time: '21:00-22:00' }).issues).toEqual([
      'booking_outside_hours:2026-10-14 21:00',
    ]);
    expect(merge(EMPTY_BOOKING, { date: '2026-10-17', timeNote: 'after 5pm' }).issues).toEqual([
      'booking_outside_hours:2026-10-17 17:00',
    ]);
    expect(merge(given({ date: '2026-10-17' }), { timeNote: 'between 3pm and 5pm' }).issues).toEqual([
      'booking_outside_hours:2026-10-17 17:00',
    ]);
    // 시각이 없는 메모 · 진료 시간 안의 메모는 받는다
    expect(merge(EMPTY_BOOKING, { date: '2026-10-14', timeNote: 'afternoon' }).issues).toEqual([]);
    expect(merge(EMPTY_BOOKING, { date: '2026-10-14', timeNote: 'between 2pm and 4pm' }).next.timeNote).toBe(
      'between 2pm and 4pm'
    );
    // 날짜를 아직 모르면 보지 않는다 — 날짜가 올 때 본다
    expect(merge(EMPTY_BOOKING, { timeNote: 'after 5pm' }).issues).toEqual([]);
    // 받아 둔 메모가 새 날짜에 맞지 않으면 메모를 비운다(AI가 시각을 다시 묻는다)
    const r = merge(given({ timeNote: 'after 5pm' }), { date: '2026-10-17' });
    expect(r.issues).toEqual([]);
    expect(r.next).toMatchObject({ date: '2026-10-17', time: null, timeNote: null });
  });

  it('날짜 없이 시각만 먼저 받으면 그대로 둔다', () => {
    expect(merge(EMPTY_BOOKING, { time: '14:00' }).next).toMatchObject({ date: null, time: '14:00' });
  });

  it('연락처는 채널과 값이 함께 있고 형식이 맞을 때만 받는다', () => {
    expect(merge(EMPTY_BOOKING, { contactChannel: 'whatsapp', contactHandle: ' +65 9123 4567 ' }).next).toMatchObject({
      contactChannel: 'whatsapp',
      contactHandle: '+65 9123 4567',
    });
    expect(merge(EMPTY_BOOKING, { contactChannel: 'line', contactHandle: 'sakura_0328' }).contactRejected).toBe(false);
    expect(merge(EMPTY_BOOKING, { contactChannel: 'email', contactHandle: 'emma@example.com' }).next.contactChannel).toBe(
      'email'
    );

    // 같은 연락처를 다른 꼴로 다시 받으면 처음 받은 꼴을 둔다
    expect(merge(FULL, { contactChannel: 'whatsapp', contactHandle: '+6591234567' }).next.contactHandle).toBe('+65 9123 4567');

    const bad = merge(FULL, { contactChannel: 'whatsapp', contactHandle: 'call me' });
    expect(bad.contactRejected).toBe(true);
    expect(bad.next).toMatchObject({ contactChannel: 'whatsapp', contactHandle: '+65 9123 4567' }); // 예전 것 유지
    expect(merge(EMPTY_BOOKING, { contactHandle: '+65 9123 4567' }).contactRejected).toBe(true);
    expect(merge(EMPTY_BOOKING, { contactChannel: 'email', contactHandle: 'not-an-email' }).contactRejected).toBe(true);
  });

  it('입국일·출국일은 실제 날짜일 때만 받는다', () => {
    const r = merge(EMPTY_BOOKING, { arrivalDate: '2026-10-14', departureDate: '2026-02-30' });
    expect(r.next).toMatchObject({ arrivalDate: '2026-10-14', departureDate: null });
  });
});

describe('contactInVisitorText — AI가 낸 연락처가 손님 글에 실제로 있는가', () => {
  it('전화번호는 숫자만 견준다 — 나라 번호를 덧붙였거나 뺀 꼴도 같은 번호다', () => {
    const texts = ['Hello', 'My WhatsApp is +65 9123 4567'];
    expect(contactInVisitorText('+65 9123 4567', texts)).toBe(true);
    expect(contactInVisitorText('+6591234567', texts)).toBe(true);
    expect(contactInVisitorText('9123 4567', texts)).toBe(true);
    expect(contactInVisitorText('+86 138 0013 8000', texts)).toBe(false);
    expect(contactInVisitorText('+65 9123 4568', texts)).toBe(false);
    expect(contactInVisitorText('4567', texts)).toBe(false); // 너무 짧다
  });

  it('아이디 · 메일은 대소문자만 무시한다', () => {
    expect(contactInVisitorText('sakura_0328', ['LINEのIDは Sakura_0328 です'])).toBe(true);
    expect(contactInVisitorText('@sakura_0328', ['my line: sakura_0328'])).toBe(true);
    expect(contactInVisitorText('Emma@Example.com', ['mail: emma@example.com'])).toBe(true);
    expect(contactInVisitorText('evil_agent', ['my line is sakura_0328'])).toBe(false);
    expect(contactInVisitorText('', ['x'])).toBe(false);
  });
});

describe('timeTokens', () => {
  it('글 안의 시각을 나온 순서대로 찾는다', () => {
    expect(timeTokens('21:00 KST')).toEqual(['21:00']);
    expect(timeTokens('between 2pm and 4:30 PM')).toEqual(['14:00', '16:30']);
    expect(timeTokens('14:00-16:00')).toEqual(['14:00', '16:00']);
    expect(timeTokens('9:05:30')).toEqual(['09:05']);
    expect(timeTokens('afternoon')).toEqual([]);
    expect(timeTokens('25:00 or 13pm')).toEqual([]);
  });
});

describe('찼는가 · 지문 · 알릴 일', () => {
  const EMAIL = { channel: 'email' as const, handle: 'emma@example.com' };

  it('날짜 + (시각 또는 시간 메모) + 연락처가 있으면 찼다', () => {
    expect(isBookingComplete(FULL, null)).toBe(true);
    expect(isBookingComplete(given({ date: '2026-10-14', timeNote: 'afternoon' }), EMAIL)).toBe(true);
    expect(isBookingComplete(given({ date: '2026-10-14', time: '14:00' }), null)).toBe(false); // 연락처 없음
    expect(isBookingComplete(given({ date: '2026-10-14' }), EMAIL)).toBe(false); // 시간 없음
    expect(isBookingComplete(given({ time: '14:00' }), EMAIL)).toBe(false); // 날짜 없음
  });

  it('연락처는 가예약에 받은 것이 먼저, 없으면 세션에 저장된 것', () => {
    expect(effectiveContact(FULL, EMAIL)).toEqual({ channel: 'whatsapp', handle: '+65 9123 4567' });
    expect(effectiveContact(EMPTY_BOOKING, EMAIL)).toEqual(EMAIL);
    expect(effectiveContact(EMPTY_BOOKING, null)).toBeNull();
  });

  it('세션의 연락처: 메신저가 있으면 메신저, 없으면 이메일', () => {
    expect(
      sessionContactOf({ visitor_email: 'a@b.co', visitor_messenger_channel: 'wechat', visitor_messenger_handle: 'emma_w' })
    ).toEqual({ channel: 'wechat', handle: 'emma_w' });
    expect(
      sessionContactOf({ visitor_email: 'a@b.co', visitor_messenger_channel: null, visitor_messenger_handle: null })
    ).toEqual({ channel: 'email', handle: 'a@b.co' });
    expect(
      sessionContactOf({ visitor_email: null, visitor_messenger_channel: 'telegram', visitor_messenger_handle: 'x' })
    ).toBeNull();
    expect(sessionContactOf({ visitor_email: null, visitor_messenger_channel: null, visitor_messenger_handle: null })).toBeNull();
  });

  it('지문은 날짜|시각|인원|채널|연락처 — 연락처는 띄어쓰기 · 기호 · 대소문자를 뺀 꼴로', () => {
    expect(bookingKey(FULL, null)).toBe('2026-10-14|14:00|2|whatsapp|6591234567');
    expect(bookingKey(given({ date: '2026-10-14', timeNote: 'afternoon' }), EMAIL)).toBe('2026-10-14|||email|emma@example.com');
    expect(bookingKey({ ...FULL, contactHandle: '+6591234567' }, null)).toBe(bookingKey(FULL, null));
    expect(bookingKey(EMPTY_BOOKING, { channel: 'email', handle: 'Emma@Example.com' })).toBe('|||email|emma@example.com');
  });

  it('sameContact: 같은 채널의 같은 연락처인가 (꼴이 달라도)', () => {
    expect(sameContact({ channel: 'whatsapp', handle: '+65 9123 4567' }, { channel: 'whatsapp', handle: '+65-9123-4567' })).toBe(true);
    expect(sameContact({ channel: 'email', handle: 'Emma@Example.com' }, { channel: 'email', handle: 'emma@example.com' })).toBe(true);
    expect(sameContact({ channel: 'line', handle: 'Sakura_0328' }, { channel: 'line', handle: 'sakura_0328' })).toBe(true);
    expect(sameContact({ channel: 'whatsapp', handle: '+65 9123 4567' }, { channel: 'wechat', handle: '+65 9123 4567' })).toBe(false);
    expect(sameContact({ channel: 'whatsapp', handle: '+65 9123 4567' }, null)).toBe(false);
  });

  it('처음 차면 requested, 찬 뒤에 지문이 바뀌면 changed, 그 밖에는 null', () => {
    expect(bookingEvent({ status: 'collecting', notifiedKey: null }, FULL, null)).toBe('requested');
    expect(bookingEvent({ status: 'collecting', notifiedKey: null }, given({ date: '2026-10-14' }), null)).toBeNull();
    const key = bookingKey(FULL, null);
    expect(bookingEvent({ status: 'requested', notifiedKey: key }, FULL, null)).toBeNull();
    expect(bookingEvent({ status: 'requested', notifiedKey: key }, { ...FULL, treatmentKo: '써마지' }, null)).toBeNull();
    expect(bookingEvent({ status: 'requested', notifiedKey: key }, { ...FULL, date: '2026-10-16' }, null)).toBe('changed');
    expect(bookingEvent({ status: 'requested', notifiedKey: key }, { ...FULL, partySize: 3 }, null)).toBe('changed');
    // AI가 같은 번호를 다른 꼴로 다시 적어도 바뀐 것이 아니다
    expect(bookingEvent({ status: 'requested', notifiedKey: key }, { ...FULL, contactHandle: '+6591234567' }, null)).toBeNull();
  });
});

describe('직원에게 보이는 글 · 프롬프트에 넣는 글', () => {
  it('날짜 표기', () => {
    expect(dateLabelKo('2026-10-14')).toBe('10/14(수)');
    expect(bookingWhenKo({ date: '2026-10-14', time: '14:00', timeNote: null })).toBe('10/14(수) 14:00');
    expect(bookingWhenKo({ date: '2026-10-14', time: null, timeNote: 'afternoon' })).toBe('10/14(수) afternoon');
    expect(bookingWhenKo({ date: '2026-10-14', time: null, timeNote: null })).toBe('10/14(수) 시간 미정');
    expect(bookingWhenKo({ date: null, time: '14:00', timeNote: null })).toBe('');
  });

  it('가예약 한 줄 — 없는 항목은 뺀다', () => {
    expect(bookingSummaryKo(FULL, null)).toBe('10/14(수) 14:00 · 2명 · 울쎄라피 프라임 · WhatsApp +65 9123 4567 · Emma');
    expect(
      bookingSummaryKo(given({ date: '2026-10-20', time: '14:00', treatment: 'サーマクール' }), {
        channel: 'email',
        handle: 'a@b.co',
      })
    ).toBe('10/20(화) 14:00 · サーマクール · 이메일 a@b.co');
    expect(bookingSummaryKo(EMPTY_BOOKING, null)).toBe('');
  });

  it('프롬프트의 BOOKING SO FAR', () => {
    expect(bookingPromptText(FULL, null)).toBe(
      [
        'date: 2026-10-14',
        'time: 14:00',
        'treatment: Ultherapy Prime',
        'party_size: 2',
        'name: Emma',
        'contact: whatsapp +65 9123 4567',
        'in Seoul: 2026-10-14 ~ 2026-10-17',
      ].join('\n')
    );
    expect(bookingPromptText(given({ timeNote: 'afternoon' }), { channel: 'wechat', handle: 'emma_w' })).toBe(
      [
        'date: (not given yet)',
        'time: (no exact time) afternoon',
        'treatment: (not given yet)',
        'party_size: (not given yet)',
        'name: (not given yet)',
        'contact: wechat emma_w (already saved — do not ask again)',
      ].join('\n')
    );
    expect(bookingPromptText(EMPTY_BOOKING, null)).toContain('contact: (not given yet)');
  });
});
