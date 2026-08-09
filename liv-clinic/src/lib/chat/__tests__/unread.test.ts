import { describe, it, expect } from 'vitest';
import { countOfflineReplies } from '../unread';

describe('countOfflineReplies', () => {
  it('visitor 본인 메시지는 제외하고 operator/system만 센다', () => {
    expect(
      countOfflineReplies([
        { sender: 'visitor' },
        { sender: 'operator' },
        { sender: 'system' },
        { sender: 'operator' },
      ]),
    ).toBe(3);
  });

  it('빈 배열은 0', () => {
    expect(countOfflineReplies([])).toBe(0);
  });
});
