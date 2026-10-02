import { describe, it, expect, afterEach } from 'vitest';
import { isEventHintEnabled, isFollowupEnabled, isRoomLookEnabled } from '../chatFlags';

describe('긴급 정지 스위치', () => {
  afterEach(() => {
    delete process.env.CHAT_FOLLOWUP;
    delete process.env.CHAT_EVENT_HINT;
    delete process.env.SLACK_ROOM_LOOK;
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
});
