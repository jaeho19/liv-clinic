import { describe, it, expect } from 'vitest';
import { adminBookingLine } from '../adminBooking';
import { operatorSourceLabel } from '../adminView';
import { EMPTY_BOOKING, type BookingFields } from '../ai/booking';

// 스펙 2026-10-02 chat-ai-first-response §4.12 — 관리자 채팅 상세 화면.
describe('operatorSourceLabel — 직원 쪽 글 아래의 작은 글씨', () => {
  it("AI가 쓴 글은 'AI 응대'", () => {
    expect(operatorSourceLabel({ source: 'ai', sender_label: 'AI 응대' })).toBe('AI 응대');
  });

  it('나머지는 지금과 같다', () => {
    expect(operatorSourceLabel({ source: 'auto', sender_label: null })).toBe('자동 안내');
    expect(operatorSourceLabel({ source: 'slack', sender_label: '이정현' })).toBe('Slack · 이정현');
    expect(operatorSourceLabel({ source: 'slack', sender_label: null })).toBe('Slack · Slack 직원');
    expect(operatorSourceLabel({ source: 'app', sender_label: 'admin@example.com' })).toBe('관리자 화면');
    expect(operatorSourceLabel({})).toBe('관리자 화면');
  });
});

describe('adminBookingLine — 머리말의 가예약 한 줄', () => {
  const FULL: BookingFields = {
    ...EMPTY_BOOKING,
    date: '2026-10-14',
    time: '14:00',
    treatment: 'Ultherapy Prime',
    treatmentKo: '울쎄라피 프라임',
    partySize: 2,
    name: 'Emma',
    contactChannel: 'whatsapp',
    contactHandle: '+65 9123 4567',
  };

  it('찬 가예약: 요약 + 접수 시각(한국 시간)', () => {
    expect(
      adminBookingLine({ status: 'requested', requestedAt: '2026-10-02T07:20:00Z', fields: FULL }, null)
    ).toBe('🗓 가예약 · 10/14(수) 14:00 · 2명 · 울쎄라피 프라임 · WhatsApp +65 9123 4567 · Emma · 접수 10/02(금) 16:20');
  });

  it('찬 가예약에 연락처가 없으면 세션에 저장된 연락처를 쓴다', () => {
    const fields = { ...FULL, contactChannel: null, contactHandle: null };
    expect(
      adminBookingLine({ status: 'requested', requestedAt: null, fields }, { channel: 'email', handle: 'emma@example.com' })
    ).toBe('🗓 가예약 · 10/14(수) 14:00 · 2명 · 울쎄라피 프라임 · 이메일 emma@example.com · Emma');
  });

  it('아직 차지 않았으면 "받는 중" — 가예약으로 받은 것만 보인다(세션의 연락처는 넣지 않는다)', () => {
    const fields = { ...EMPTY_BOOKING, date: '2026-10-14', treatmentKo: '울쎄라피 프라임' };
    expect(
      adminBookingLine({ status: 'collecting', requestedAt: null, fields }, { channel: 'email', handle: 'emma@example.com' })
    ).toBe('🗓 가예약 받는 중 · 10/14(수) 시간 미정 · 울쎄라피 프라임');
  });

  it('받은 것이 없으면 줄을 만들지 않는다', () => {
    expect(adminBookingLine({ status: 'collecting', requestedAt: null, fields: EMPTY_BOOKING }, null)).toBeNull();
    expect(
      adminBookingLine(
        { status: 'collecting', requestedAt: null, fields: EMPTY_BOOKING },
        { channel: 'whatsapp', handle: '+65 9123 4567' }
      )
    ).toBeNull();
    expect(adminBookingLine(null, null)).toBeNull();
  });
});
