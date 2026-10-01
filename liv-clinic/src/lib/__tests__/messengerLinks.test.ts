import { describe, it, expect } from 'vitest';
import { LINE_LINK } from '../messengerLinks';

describe('LINE 친구 추가 링크', () => {
  // 아이디 방식(`line.me/R/ti/p/~아이디`)은 LINE의 아이디 검색을 거친다. 연령 인증이 안 된 계정은
  // 아이디 검색이 막혀 있어, 2026-08-19 일본 손님에게 "ID를 검색할 수 없다"가 떴다.
  // LINE 앱의 "QR 코드 → 링크 복사"로 얻는 주소(`line.me/ti/p/무작위 글자`)는 검색을 거치지 않는다.
  it('아이디 검색을 거치지 않는 주소다', () => {
    expect(LINE_LINK).not.toContain('~');
    expect(LINE_LINK).toMatch(/^https:\/\/line\.me\/ti\/p\/[A-Za-z0-9_-]+$/);
  });
});
