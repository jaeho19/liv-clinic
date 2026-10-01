import { describe, it, expect } from 'vitest';
import { countVisitorText, upsertMessage } from '../messageList';

const msg = (id: string, created_at: string, extra: Record<string, unknown> = {}) => ({ id, created_at, ...extra });

describe('upsertMessage', () => {
  it('없는 글은 덧붙이고 시간순으로 둔다', () => {
    const list = [msg('a', '2026-10-05T03:00:00Z'), msg('c', '2026-10-05T03:00:05Z')];
    const next = upsertMessage(list, msg('b', '2026-10-05T03:00:02Z'));
    expect(next.map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });

  it('같은 id가 있으면 새 것으로 바꾼다 (번역 전 상태 → 완성본)', () => {
    const list = [msg('a', '2026-10-05T03:00:00Z', { translation_status: 'pending' })];
    const next = upsertMessage(list, msg('a', '2026-10-05T03:00:00Z', { translation_status: 'success' }));
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ id: 'a', translation_status: 'success' });
  });

  it('원래 목록을 바꾸지 않는다', () => {
    const list = [msg('a', '2026-10-05T03:00:00Z')];
    upsertMessage(list, msg('b', '2026-10-05T02:00:00Z'));
    expect(list.map((m) => m.id)).toEqual(['a']);
  });
});

describe('countVisitorText', () => {
  const list = [
    { sender: 'visitor', original_text: 'hello' },
    { sender: 'operator', original_text: 'hello' },
    { sender: 'visitor', original_text: 'hello' },
    { sender: 'visitor', original_text: 'price?' },
  ];
  it('손님 글 가운데 내용이 같은 것만 센다', () => {
    expect(countVisitorText(list, 'hello')).toBe(2);
    expect(countVisitorText(list, 'price?')).toBe(1);
    expect(countVisitorText(list, 'none')).toBe(0);
  });
});
