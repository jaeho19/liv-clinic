import 'server-only';
import type { ChatAdminClient } from '@/lib/chat/db';
import type { ContactChannel } from '@/lib/chat/contactChannels';
import { bookingKey, EMPTY_BOOKING, type BookingEvent, type BookingFields, type ContactRef } from './booking';

// 가예약의 저장 (스펙 2026-10-02 chat-ai-first-response §4.7 · §5 chat_bookings). throw 하지 않는다.
// 대화마다 한 줄이다. 규칙(값 합치기 · 찼는가 · 바뀌었는가)은 booking.ts 가 정하고 여기는 읽고 쓰기만 한다.

export interface StoredBooking {
  /** chat_bookings.id — 아직 줄이 없으면 null */
  id: string | null;
  status: 'collecting' | 'requested';
  /** 직원에게 마지막으로 알린 지문 */
  notifiedKey: string | null;
  requestedAt: string | null;
  fields: BookingFields;
}

export const NO_BOOKING: StoredBooking = {
  id: null,
  status: 'collecting',
  notifiedKey: null,
  requestedAt: null,
  fields: EMPTY_BOOKING,
};

const COLUMNS =
  'id, status, visit_date, visit_time, time_note, treatment, treatment_ko, party_size, visitor_name, contact_channel, contact_handle, arrival_date, departure_date, requested_at, notified_key';

interface BookingRow {
  id: string;
  status: string;
  visit_date: string | null;
  visit_time: string | null;
  time_note: string | null;
  treatment: string | null;
  treatment_ko: string | null;
  party_size: number | null;
  visitor_name: string | null;
  contact_channel: string | null;
  contact_handle: string | null;
  arrival_date: string | null;
  departure_date: string | null;
  requested_at: string | null;
  notified_key: string | null;
}

export function rowToStored(row: BookingRow): StoredBooking {
  return {
    id: row.id,
    status: row.status === 'requested' ? 'requested' : 'collecting',
    notifiedKey: row.notified_key,
    requestedAt: row.requested_at,
    fields: {
      date: row.visit_date,
      time: row.visit_time,
      timeNote: row.time_note,
      treatment: row.treatment,
      treatmentKo: row.treatment_ko,
      partySize: row.party_size,
      name: row.visitor_name,
      contactChannel: (row.contact_channel as ContactChannel | null) ?? null,
      contactHandle: row.contact_handle,
      arrivalDate: row.arrival_date,
      departureDate: row.departure_date,
    },
  };
}

function fieldsToRow(f: BookingFields) {
  return {
    visit_date: f.date,
    visit_time: f.time,
    time_note: f.timeNote,
    treatment: f.treatment,
    treatment_ko: f.treatmentKo,
    party_size: f.partySize,
    visitor_name: f.name,
    contact_channel: f.contactChannel,
    contact_handle: f.contactHandle,
    arrival_date: f.arrivalDate,
    departure_date: f.departureDate,
  };
}

/**
 * 이 대화의 가예약을 읽는다. 줄이 없으면 NO_BOOKING.
 * 조회가 실패하면(043 미적용 등) null — 호출자는 AI 답을 포기하고 접수 안내로 대신한다.
 */
export async function loadBooking(admin: ChatAdminClient, sessionId: string): Promise<StoredBooking | null> {
  try {
    const { data, error } = await admin.from('chat_bookings').select(COLUMNS).eq('session_id', sessionId).maybeSingle();
    if (error) {
      console.warn('[chat ai] booking read failed:', error.code ?? 'unknown');
      return null;
    }
    return data ? rowToStored(data as BookingRow) : NO_BOOKING;
  } catch (e) {
    console.warn('[chat ai] booking read threw:', e);
    return null;
  }
}

const sameFields = (a: BookingFields, b: BookingFields): boolean =>
  (Object.keys(a) as Array<keyof BookingFields>).every((k) => a[k] === b[k]);

/**
 * 합친 가예약을 저장한다. 바뀐 것도 알릴 일도 없으면 아무것도 하지 않는다.
 * event 가 있으면 "직원에게 알린 지문"을 함께 적는다 — requested 는 처음 찬 시각도 적는다.
 * 저장에 실패하면 false (경고만 — 답은 그대로 나간다. 다음 차례에 AI가 다시 받는다).
 */
export async function saveBooking(
  admin: ChatAdminClient,
  sessionId: string,
  prev: StoredBooking,
  next: BookingFields,
  event: BookingEvent,
  sessionContact: ContactRef | null,
  now: Date
): Promise<boolean> {
  if (!event && prev.id !== null && sameFields(prev.fields, next)) return true;
  if (!event && prev.id === null && sameFields(EMPTY_BOOKING, next)) return true;
  const stamp = now.toISOString();
  const patch = {
    ...fieldsToRow(next),
    ...(event ? { status: 'requested', notified_key: bookingKey(next, sessionContact), notified_at: stamp } : {}),
    ...(event === 'requested' ? { requested_at: stamp } : {}),
  };
  try {
    if (prev.id !== null) {
      const { error } = await admin.from('chat_bookings').update(patch).eq('id', prev.id);
      if (error) {
        console.warn('[chat ai] booking update failed:', error.code ?? 'unknown');
        return false;
      }
      return true;
    }
    const { error } = await admin.from('chat_bookings').insert({ session_id: sessionId, ...patch });
    if (!error) return true;
    if (error.code === '23505') {
      // 같은 대화의 다른 차례가 방금 줄을 만들었다 → 그 줄을 고친다
      const { error: updateError } = await admin.from('chat_bookings').update(patch).eq('session_id', sessionId);
      if (!updateError) return true;
      console.warn('[chat ai] booking update after conflict failed:', updateError.code ?? 'unknown');
      return false;
    }
    console.warn('[chat ai] booking insert failed:', error.code ?? 'unknown');
    return false;
  } catch (e) {
    console.warn('[chat ai] booking save threw:', e);
    return false;
  }
}
