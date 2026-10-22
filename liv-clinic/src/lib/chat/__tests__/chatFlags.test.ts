import { describe, it, expect, afterEach } from 'vitest';
import {
  chatAiMode,
  chatAiOffersMode,
  isAiNoticeEnabled,
  isAiSummaryEnabled,
  isEscalationEnabled,
  isEventHintEnabled,
  isFollowupEnabled,
  isRoomLookEnabled,
} from '../chatFlags';

describe('긴급 정지 스위치', () => {
  afterEach(() => {
    delete process.env.CHAT_FOLLOWUP;
    delete process.env.CHAT_EVENT_HINT;
    delete process.env.SLACK_ROOM_LOOK;
    delete process.env.CHAT_ESCALATION;
    delete process.env.CHAT_AI;
    delete process.env.CHAT_AI_NOTICE;
    delete process.env.CHAT_AI_OFFERS;
    delete process.env.CHAT_AI_SUMMARY;
  });

  it('환경변수가 없으면 둘 다 켜져 있다', () => {
    expect(isFollowupEnabled()).toBe(true);
    expect(isEventHintEnabled()).toBe(true);
  });

  it("'off'일 때만 꺼진다 (대소문자·앞뒤 공백 무시)", () => {
    process.env.CHAT_FOLLOWUP = ' OFF ';
    process.env.CHAT_EVENT_HINT = 'off';
    expect(isFollowupEnabled()).toBe(false);
    expect(isEventHintEnabled()).toBe(false);
  });

  it('다른 값은 켜진 것으로 본다', () => {
    process.env.CHAT_FOLLOWUP = 'on';
    process.env.CHAT_EVENT_HINT = '0';
    expect(isFollowupEnabled()).toBe(true);
    expect(isEventHintEnabled()).toBe(true);
  });

  it('두 스위치는 서로 독립이다', () => {
    process.env.CHAT_FOLLOWUP = 'off';
    expect(isFollowupEnabled()).toBe(false);
    expect(isEventHintEnabled()).toBe(true);
  });

  it('방 글 모양 스위치(SLACK_ROOM_LOOK)도 같은 규칙이다: 없으면 켜짐, off면 꺼짐, 다른 스위치와 독립', () => {
    expect(isRoomLookEnabled()).toBe(true);
    process.env.SLACK_ROOM_LOOK = ' Off ';
    expect(isRoomLookEnabled()).toBe(false);
    expect(isFollowupEnabled()).toBe(true);
    process.env.SLACK_ROOM_LOOK = 'plain';
    expect(isRoomLookEnabled()).toBe(true);
  });

  it("재촉 알림 스위치(CHAT_ESCALATION)는 반대다: 없으면 꺼짐, 'on'일 때만 켜짐 (대소문자·앞뒤 공백 무시)", () => {
    expect(isEscalationEnabled()).toBe(false);
    process.env.CHAT_ESCALATION = ' ON ';
    expect(isEscalationEnabled()).toBe(true);
    process.env.CHAT_ESCALATION = 'off';
    expect(isEscalationEnabled()).toBe(false);
    process.env.CHAT_ESCALATION = '1';
    expect(isEscalationEnabled()).toBe(false);
  });

  it('재촉 알림 스위치는 다른 스위치와 독립이다', () => {
    process.env.CHAT_ESCALATION = 'on';
    expect(isFollowupEnabled()).toBe(true);
    process.env.CHAT_FOLLOWUP = 'off';
    expect(isEscalationEnabled()).toBe(true);
  });

  it("AI 응대 스위치(CHAT_AI): 없으면 off, 'on'·'test'만 뜻이 있다 (대소문자·앞뒤 공백 무시)", () => {
    expect(chatAiMode()).toBe('off');
    process.env.CHAT_AI = ' ON ';
    expect(chatAiMode()).toBe('on');
    process.env.CHAT_AI = 'Test';
    expect(chatAiMode()).toBe('test');
    process.env.CHAT_AI = 'off';
    expect(chatAiMode()).toBe('off');
    process.env.CHAT_AI = '1';
    expect(chatAiMode()).toBe('off');
  });

  it("고지 한 줄 스위치(CHAT_AI_NOTICE): 없으면 꺼짐, 'on'일 때만 켜짐. AI 스위치와 독립이다", () => {
    expect(isAiNoticeEnabled()).toBe(false);
    process.env.CHAT_AI_NOTICE = ' On ';
    expect(isAiNoticeEnabled()).toBe(true);
    expect(chatAiMode()).toBe('off');
    process.env.CHAT_AI_NOTICE = 'yes';
    expect(isAiNoticeEnabled()).toBe(false);
  });

  it("제안형 응대 스위치(CHAT_AI_OFFERS): 없으면 off, 'on'·'test'만 뜻이 있다. AI 스위치와 독립이다", () => {
    expect(chatAiOffersMode()).toBe('off');
    process.env.CHAT_AI_OFFERS = ' On ';
    expect(chatAiOffersMode()).toBe('on');
    expect(chatAiMode()).toBe('off');
    process.env.CHAT_AI_OFFERS = 'TEST';
    expect(chatAiOffersMode()).toBe('test');
    process.env.CHAT_AI_OFFERS = 'yes';
    expect(chatAiOffersMode()).toBe('off');
    process.env.CHAT_AI = 'on';
    delete process.env.CHAT_AI_OFFERS;
    expect(chatAiOffersMode()).toBe('off');
  });

  it("AI 응대 요약 스위치(CHAT_AI_SUMMARY): 없으면 켜짐, 'off'일 때만 꺼짐", () => {
    expect(isAiSummaryEnabled()).toBe(true);
    process.env.CHAT_AI_SUMMARY = ' Off ';
    expect(isAiSummaryEnabled()).toBe(false);
    process.env.CHAT_AI_SUMMARY = 'on';
    expect(isAiSummaryEnabled()).toBe(true);
  });
});
