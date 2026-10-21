// 관리자 채팅 상세 화면 머리말의 가예약 한 줄 (스펙 2026-10-02 chat-ai-first-response §4.12).
// 서버(page.tsx)에서만 쓴다 — booking.ts 가 달력을 거쳐 서버 전용 모듈(businessHours.ts)을 불러온다.
import { bookingSummaryKo, type BookingFields, type ContactRef } from '@/lib/chat/ai/booking';
import { formatKst } from '@/lib/chat/kst';

export interface AdminBooking {
  status: 'collecting' | 'requested';
  /** 가예약이 처음 찬 시각 */
  requestedAt: string | null;
  fields: BookingFields;
}

/**
 * 찼으면 `🗓 가예약 · 10/14(수) 14:00 · 2명 · 울쎄라피 프라임 · WhatsApp +65 9123 4567 · Emma · 접수 10/02(금) 16:20`,
 * 아직 받는 중이면 `🗓 가예약 받는 중 · …`(가예약으로 받은 것만 — 세션의 연락처는 넣지 않는다). 받은 것이 없으면 null.
 */
export function adminBookingLine(booking: AdminBooking | null, sessionContact: ContactRef | null): string | null {
  if (!booking) return null;
  if (booking.status === 'requested') {
    const parts = [`🗓 가예약 · ${bookingSummaryKo(booking.fields, sessionContact)}`];
    if (booking.requestedAt) parts.push(`접수 ${formatKst(booking.requestedAt).replace(' KST', '')}`);
    return parts.join(' · ');
  }
  const summary = bookingSummaryKo(booking.fields, null);
  return summary ? `🗓 가예약 받는 중 · ${summary}` : null;
}
