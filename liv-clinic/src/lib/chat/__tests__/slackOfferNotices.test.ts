import { describe, it, expect } from 'vitest';
import { adminBookingLine } from '../adminBooking';
import { EMPTY_BOOKING, type BookingFields } from '../ai/booking';
import { benefitKo } from '../ai/knowledge/offers';
import { styledBookingNotice } from '../slackLook';
import { bookingNoticeHeadline, buildBookingNoticeText } from '../slackText';

// 스펙 2026-10-12 chat-ai-guided-offers §4.6 — 직원 쪽 글에 덧붙이는 것: 가예약의 "· 혜택:".
// 새 글은 만들지 않는다(알림 수가 늘지 않는다). 제안형 응대가 꺼진 대화는 10/2 와 글자 하나까지 같다.
// 2026-10-22: 요지의 "> 제안:" 줄은 없어졌다 — 방에 AI 답 전문이 올라가므로 제안은 그 글에 그대로 보인다(스펙 2026-10-22 chat-ai-slack-transcript §1).
const SUMMARY = '10/14(수) 14:00 · 2명 · 울쎄라피 프라임 · WhatsApp +65 9123 4567 · Emma';

describe('가예약 — "· 혜택:"', () => {
  it('파란 막대의 큰 줄과 글자만 문구 끝에 혜택을 붙인다', () => {
    const benefit = benefitKo('full');
    expect(bookingNoticeHeadline({ changed: false, summary: SUMMARY, benefit })).toBe(`🗓 *가예약* · ${SUMMARY} · ${benefit}`);
    expect(buildBookingNoticeText({ changed: true, summary: SUMMARY, benefit, mention: '<@U0AAA>' })).toBe(
      `🗓 *가예약 변경* <@U0AAA> · ${SUMMARY} · ${benefit}`
    );
  });

  it('혜택이 없으면(제안형 응대가 꺼진 대화) 10/2 와 같다', () => {
    const plain = styledBookingNotice({ changed: false, summary: SUMMARY, mention: '<@U0AAA>' });
    expect(styledBookingNotice({ changed: false, summary: SUMMARY, benefit: null, mention: '<@U0AAA>' })).toEqual(plain);
  });

  it('관리자 화면의 가예약 한 줄 끝에도 같은 혜택', () => {
    const fields: BookingFields = {
      ...EMPTY_BOOKING,
      date: '2026-10-14',
      time: '14:00',
      treatmentKo: '울쎄라피 프라임',
      partySize: 2,
      name: 'Emma',
      contactChannel: 'whatsapp',
      contactHandle: '+65 9123 4567',
    };
    expect(adminBookingLine({ status: 'requested', requestedAt: '2026-10-02T07:20:00Z', fields, benefit: 'five' }, null)).toBe(
      `🗓 가예약 · ${SUMMARY} · 접수 10/02(금) 16:20 · 혜택: 5%만(첫방문 체험가만 안내함)`
    );
    expect(adminBookingLine({ status: 'requested', requestedAt: null, fields, benefit: null }, null)).toBe(`🗓 가예약 · ${SUMMARY}`);
  });
});
