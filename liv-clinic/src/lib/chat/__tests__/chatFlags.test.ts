import { describe, it, expect, afterEach } from 'vitest';
import { isEventHintEnabled, isFollowupEnabled } from '../chatFlags';

describe('긴급 정지 스위치', () => {
  afterEach(() => {
    delete process.env.CHAT_FOLLOWUP;
    delete process.env.CHAT_EVENT_HINT;
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
});
