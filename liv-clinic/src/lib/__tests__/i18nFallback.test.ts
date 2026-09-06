import { describe, it, expect } from 'vitest';
import { pickLocalized } from '@/lib/i18nFallback';

describe('pickLocalized (event copy)', () => {
  const c = { ko: '한국어', en: 'English', ja: '日本語', zh: '中文' };

  it('zh-TW falls back to zh, then en, never ko while zh/en exist', () => {
    expect(pickLocalized(c, 'zh-TW')).toBe('中文');
    expect(pickLocalized({ ...c, zh: '' }, 'zh-TW')).toBe('English');
  });

  it('vi/th/ru/fr/mn/ar fall back to en', () => {
    for (const l of ['vi', 'th', 'ru', 'fr', 'mn', 'ar'] as const) expect(pickLocalized(c, l)).toBe('English');
  });

  it('returns ko only when nothing else exists', () => {
    expect(pickLocalized({ ko: '한국어' }, 'zh-TW')).toBe('한국어');
    expect(pickLocalized(null, 'ja')).toBe('');
  });
});
