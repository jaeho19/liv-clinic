import { describe, it, expect } from 'vitest';
import {
  hasReplyAfter,
  lastReplyId,
  scrollTopForNewMessage,
  startTyping,
  TYPING_MAX_MS,
  typingRemainingMs,
} from '../panelRules';

// 스펙 2026-10-02 chat-ai-first-response §4.10 — 손님 화면의 "입력 중" 표시와 새 글 스크롤.
const SENT_AT = '2026-10-02T07:20:00.512+00:00';
const NOW = Date.parse('2026-10-02T07:20:01.300Z');
const msg = (sender: string, created_at: string, id = `${sender}-${created_at}`) => ({ id, sender, created_at });

describe('입력 중 표시', () => {
  it('손님 글이 저장된 시각을 기억하고, 30초 뒤에 지운다', () => {
    const state = startTyping(SENT_AT, NOW);
    expect(state).toEqual({ since: SENT_AT, untilMs: NOW + TYPING_MAX_MS });
    expect(TYPING_MAX_MS).toBe(30_000);
    expect(typingRemainingMs(state, NOW)).toBe(30_000);
    expect(typingRemainingMs(state, NOW + 29_000)).toBe(1_000);
    expect(typingRemainingMs(state, NOW + 31_000)).toBe(0);
  });

  it('그 글 뒤에 직원·자동 응대의 글이 도착하면 지운다', () => {
    const before = [msg('visitor', SENT_AT), msg('operator', '2026-10-02T07:19:00+00:00')];
    expect(hasReplyAfter(before, SENT_AT)).toBe(false);
    expect(hasReplyAfter([...before, msg('operator', '2026-10-02T07:20:04.100+00:00')], SENT_AT)).toBe(true);
  });

  it('손님 자신의 글과 시스템 문구("연락처를 저장했습니다")는 답이 아니다', () => {
    const list = [
      msg('visitor', SENT_AT),
      msg('visitor', '2026-10-02T07:20:02+00:00'),
      msg('system', '2026-10-02T07:20:03+00:00'),
    ];
    expect(hasReplyAfter(list, SENT_AT)).toBe(false);
  });

  it('같은 시각의 글은 "뒤"가 아니다 · 시각을 읽지 못하면 답이 없는 것으로 본다', () => {
    expect(hasReplyAfter([msg('operator', SENT_AT)], SENT_AT)).toBe(false);
    expect(hasReplyAfter([msg('operator', 'not-a-date')], SENT_AT)).toBe(false);
    expect(hasReplyAfter([msg('operator', '2026-10-02T07:20:04+00:00')], 'not-a-date')).toBe(false);
  });
});

describe('lastReplyId — 세션 정보를 다시 읽을 때를 아는 값', () => {
  it('가장 최근의 직원·자동 응대 글의 id, 없으면 null', () => {
    expect(lastReplyId([])).toBeNull();
    expect(lastReplyId([msg('visitor', SENT_AT, 'v-1'), msg('system', SENT_AT, 's-1')])).toBeNull();
    expect(
      lastReplyId([
        msg('operator', '2026-10-02T07:19:00+00:00', 'o-1'),
        msg('visitor', SENT_AT, 'v-1'),
        msg('operator', '2026-10-02T07:20:04+00:00', 'o-2'),
        msg('visitor', '2026-10-02T07:20:30+00:00', 'v-2'),
      ])
    ).toBe('o-2');
  });
});

describe('scrollTopForNewMessage — 새 글이 보이는 자리', () => {
  it('글과 그 아래 내용이 한 화면에 들어가면 맨 아래로 내린다', () => {
    // 내용 900, 화면 400 → 맨 아래 = 500. 새 글의 머리가 820 이면 맨 아래에서도 보인다.
    expect(scrollTopForNewMessage({ messageTop: 820, scrollHeight: 900, clientHeight: 400 })).toBe(500);
  });

  it('글 아래에 연락처 카드가 있어 한 화면을 넘으면, 글의 머리를 화면 위쪽에 맞춘다', () => {
    // 새 글의 머리 420, 그 아래로 글 + 카드가 480 → 맨 아래(500)로 내리면 글의 머리가 가려진다.
    expect(scrollTopForNewMessage({ messageTop: 420, scrollHeight: 900, clientHeight: 400 })).toBe(412);
  });

  it('내용이 화면보다 짧으면 0', () => {
    expect(scrollTopForNewMessage({ messageTop: 40, scrollHeight: 300, clientHeight: 400 })).toBe(0);
    expect(scrollTopForNewMessage({ messageTop: 4, scrollHeight: 900, clientHeight: 400 })).toBe(0);
  });
});
