import { describe, it, expect } from 'vitest';
import { mentionOf, parseStaffDirectory, UNKNOWN_STAFF_LABEL } from '../slackStaff';

describe('parseStaffDirectory — 답변 직원', () => {
  it('ID:이름 쌍을 파싱하고 이름이 없으면 기본 라벨을 쓴다', () => {
    const s = parseStaffDirectory('U0AAA:이정현, U0BBB ,U0CCC:방애금');
    expect(s.responderIds).toEqual(['U0AAA', 'U0BBB', 'U0CCC']);
    expect(s.inviteIds).toEqual(['U0AAA', 'U0BBB', 'U0CCC']);
    expect(s.labelOf('U0AAA')).toBe('이정현');
    expect(s.labelOf('U0BBB')).toBe(UNKNOWN_STAFF_LABEL);
    expect(s.labelOf('U0ZZZ')).toBe(UNKNOWN_STAFF_LABEL);
    expect(s.labelOf(null)).toBe(UNKNOWN_STAFF_LABEL);
  });

  it('잘못된 ID·중복·소문자는 버린다', () => {
    const s = parseStaffDirectory('bogus:x,U0AAA:a,U0AAA:b,u0lower:c');
    expect(s.responderIds).toEqual(['U0AAA']);
    expect(s.labelOf('U0AAA')).toBe('a');
  });

  it('빈 값이면 아무도 없다', () => {
    const s = parseStaffDirectory(undefined);
    expect(s.responderIds).toEqual([]);
    expect(s.inviteIds).toEqual([]);
    expect(s.mentionAll()).toBe('');
    expect(s.isResponder('U0AAA')).toBe(false);
  });

  it('전원 멘션 문자열을 만든다', () => {
    expect(parseStaffDirectory('U0AAA,U0BBB').mentionAll()).toBe('<@U0AAA> <@U0BBB>');
    expect(mentionOf('U0AAA')).toBe('<@U0AAA>');
  });
});

describe('parseStaffDirectory — 관찰자 (원장님 계정)', () => {
  it('관찰자는 초대 대상이지만 멘션·담당 대상이 아니다', () => {
    const s = parseStaffDirectory('U0AAA:이정현', 'U0OBS:이재호');
    expect(s.inviteIds).toEqual(['U0AAA', 'U0OBS']);
    expect(s.responderIds).toEqual(['U0AAA']);
    expect(s.isResponder('U0OBS')).toBe(false);
    expect(s.isResponder('U0AAA')).toBe(true);
    expect(s.mentionAll()).toBe('<@U0AAA>');
    expect(s.labelOf('U0OBS')).toBe('이재호');
  });

  it('양쪽에 다 있으면 답변 직원으로 본다', () => {
    const s = parseStaffDirectory('U0AAA:이정현', 'U0AAA:이정현,U0OBS');
    expect(s.responderIds).toEqual(['U0AAA']);
    expect(s.inviteIds).toEqual(['U0AAA', 'U0OBS']);
    expect(s.isResponder('U0AAA')).toBe(true);
  });
});
