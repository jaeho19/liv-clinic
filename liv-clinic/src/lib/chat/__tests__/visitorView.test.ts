import { describe, it, expect } from 'vitest';
import { isStaffMessage, shouldShowCaptureBlock } from '../contactChannels';
import { toVisitorMessages } from '../visitorView';

describe('toVisitorMessages — 손님 화면으로 가는 글', () => {
  it("출처 'ai' 는 'auto' 로 바꿔 보내고, 나머지는 그대로 둔다", () => {
    const rows = [
      { id: '1', sender: 'visitor', source: 'app' },
      { id: '2', sender: 'operator', source: 'ai' },
      { id: '3', sender: 'operator', source: 'auto' },
      { id: '4', sender: 'operator', source: 'slack' },
      { id: '5', sender: 'system', source: null },
    ];
    expect(toVisitorMessages(rows).map((r) => r.source)).toEqual(['app', 'auto', 'auto', 'slack', null]);
    expect(rows[1].source).toBe('ai'); // 원래 배열은 건드리지 않는다
  });
});

describe('AI 글은 직원 글이 아니다 (연락처 카드 규칙)', () => {
  const at = (minutesAgo: number) => new Date(Date.parse('2026-10-02T07:20:00Z') - minutesAgo * 60_000).toISOString();

  it("isStaffMessage: 'ai'·'auto' 는 직원 글로 치지 않는다", () => {
    expect(isStaffMessage({ sender: 'operator', source: 'ai', created_at: at(0) })).toBe(false);
    expect(isStaffMessage({ sender: 'operator', source: 'auto', created_at: at(0) })).toBe(false);
    expect(isStaffMessage({ sender: 'operator', source: 'slack', created_at: at(0) })).toBe(true);
    expect(isStaffMessage({ sender: 'operator', source: 'app', created_at: at(0) })).toBe(true);
  });

  it('AI가 방금 답했어도 연락처가 없으면 카드는 지금 규칙대로 뜬다', () => {
    const base = {
      presenceLoaded: true,
      sessionInfoLoaded: true,
      hasContact: false,
      dismissedAtMs: null,
      nowMs: Date.parse('2026-10-02T07:20:00Z'),
    };
    const messages = [
      { sender: 'visitor', source: 'app', created_at: at(2) },
      { sender: 'operator', source: 'ai', created_at: at(1) },
    ];
    expect(shouldShowCaptureBlock({ ...base, messages })).toBe(true);
    // 직원이 방금 답했으면 뜨지 않는다 (지금과 같다)
    expect(
      shouldShowCaptureBlock({ ...base, messages: [...messages, { sender: 'operator', source: 'slack', created_at: at(0) }] })
    ).toBe(false);
  });
});
