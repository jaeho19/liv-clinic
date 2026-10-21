import { describe, it, expect, vi, afterEach } from 'vitest';
import { fakeAdmin, hasFilter, type FakeOp, type FakeResult } from '@/lib/chat/__tests__/fakeAdmin';
import { EMPTY_BOOKING, type BookingFields } from '../booking';
import { loadBooking, NO_BOOKING, rowToStored, saveBooking, type StoredBooking } from '../bookingStore';

const SESSION_ID = '11111111-2222-3333-4444-555555555555';
const NOW = new Date('2026-10-02T07:20:00Z');
const ROW = {
  id: 'b-1',
  status: 'requested',
  visit_date: '2026-10-14',
  visit_time: '14:00',
  time_note: null,
  treatment: 'Ultherapy Prime',
  treatment_ko: '울쎄라피 프라임',
  party_size: 2,
  visitor_name: 'Emma',
  contact_channel: 'whatsapp',
  contact_handle: '+65 9123 4567',
  arrival_date: '2026-10-14',
  departure_date: '2026-10-17',
  requested_at: '2026-10-02T07:00:00Z',
  notified_key: '2026-10-14|14:00|2|whatsapp|6591234567',
};
const FIELDS: BookingFields = {
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
const STORED: StoredBooking = {
  id: 'b-1',
  status: 'requested',
  notifiedKey: '2026-10-14|14:00|2|whatsapp|6591234567',
  requestedAt: '2026-10-02T07:00:00Z',
  fields: FIELDS,
};

const admin = (handler: (op: FakeOp) => FakeResult) => fakeAdmin(handler);

afterEach(() => vi.restoreAllMocks());

describe('loadBooking', () => {
  it('줄을 읽어 가예약으로 바꾼다', async () => {
    const a = admin(() => ({ data: ROW }));
    expect(await loadBooking(a as never, SESSION_ID)).toEqual(STORED);
    expect(hasFilter(a.ops[0], 'session_id', SESSION_ID)).toBe(true);
    expect(rowToStored({ ...ROW, status: 'collecting' }).status).toBe('collecting');
  });

  it('줄이 없으면 빈 가예약', async () => {
    expect(await loadBooking(admin(() => ({ data: null })) as never, SESSION_ID)).toEqual(NO_BOOKING);
  });

  it('조회가 실패하면(043 미적용) null — throw 하지 않는다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await loadBooking(admin(() => ({ error: { code: '42P01' } })) as never, SESSION_ID)).toBeNull();
    expect(warn).toHaveBeenCalled();
  });
});

describe('saveBooking', () => {
  it('바뀐 것도 알릴 일도 없으면 DB를 건드리지 않는다', async () => {
    const a = admin(() => ({ data: null }));
    expect(await saveBooking(a as never, SESSION_ID, STORED, FIELDS, null, null, NOW)).toBe(true);
    expect(await saveBooking(a as never, SESSION_ID, NO_BOOKING, EMPTY_BOOKING, null, null, NOW)).toBe(true);
    expect(a.ops).toHaveLength(0);
  });

  it('줄이 없으면 만든다 — 알릴 일이 없으면 상태·지문을 건드리지 않는다', async () => {
    const a = admin(() => ({ data: null }));
    await saveBooking(a as never, SESSION_ID, NO_BOOKING, { ...EMPTY_BOOKING, treatment: 'Thermage', treatmentKo: '써마지' }, null, null, NOW);
    expect(a.ops[0]).toMatchObject({ table: 'chat_bookings', op: 'insert' });
    expect(a.ops[0].payload).toEqual({
      session_id: SESSION_ID,
      visit_date: null,
      visit_time: null,
      time_note: null,
      treatment: 'Thermage',
      treatment_ko: '써마지',
      party_size: null,
      visitor_name: null,
      contact_channel: null,
      contact_handle: null,
      arrival_date: null,
      departure_date: null,
    });
  });

  it('처음 찼으면 requested · 지문 · 시각을 적는다', async () => {
    const a = admin(() => ({ data: null }));
    await saveBooking(a as never, SESSION_ID, NO_BOOKING, FIELDS, 'requested', null, NOW);
    expect(a.ops[0].payload).toMatchObject({
      status: 'requested',
      notified_key: '2026-10-14|14:00|2|whatsapp|6591234567',
      notified_at: '2026-10-02T07:20:00.000Z',
      requested_at: '2026-10-02T07:20:00.000Z',
    });
  });

  it('바뀌었으면 기존 줄의 지문과 알린 시각만 새로 적는다(처음 찬 시각은 그대로)', async () => {
    const a = admin(() => ({ data: null }));
    await saveBooking(a as never, SESSION_ID, STORED, { ...FIELDS, date: '2026-10-16' }, 'changed', null, NOW);
    expect(a.ops[0]).toMatchObject({ table: 'chat_bookings', op: 'update' });
    expect(hasFilter(a.ops[0], 'id', 'b-1')).toBe(true);
    const payload = a.ops[0].payload as Record<string, unknown>;
    expect(payload.visit_date).toBe('2026-10-16');
    expect(payload.notified_key).toBe('2026-10-16|14:00|2|whatsapp|6591234567');
    expect('requested_at' in payload).toBe(false);
  });

  it('세션에 저장된 연락처로 찬 가예약은 그 연락처가 지문에 들어간다', async () => {
    const a = admin(() => ({ data: null }));
    await saveBooking(
      a as never,
      SESSION_ID,
      NO_BOOKING,
      { ...EMPTY_BOOKING, date: '2026-10-14', time: '14:00' },
      'requested',
      { channel: 'email', handle: 'emma@example.com' },
      NOW
    );
    expect((a.ops[0].payload as Record<string, unknown>).notified_key).toBe('2026-10-14|14:00||email|emma@example.com');
  });

  it('다른 차례가 방금 줄을 만들었으면(23505) 그 줄을 고친다', async () => {
    const a = admin((op) => (op.op === 'insert' ? { error: { code: '23505' } } : { data: null }));
    expect(await saveBooking(a as never, SESSION_ID, NO_BOOKING, FIELDS, 'requested', null, NOW)).toBe(true);
    expect(a.ops.map((o) => o.op)).toEqual(['insert', 'update']);
    expect(hasFilter(a.ops[1], 'session_id', SESSION_ID)).toBe(true);
  });

  it('저장이 실패하면 false — throw 하지 않는다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await saveBooking(admin(() => ({ error: { code: '57014' } })) as never, SESSION_ID, STORED, { ...FIELDS, partySize: 3 }, null, null, NOW)).toBe(false);
    expect(await saveBooking(admin(() => ({ error: { code: '57014' } })) as never, SESSION_ID, NO_BOOKING, FIELDS, null, null, NOW)).toBe(false);
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
