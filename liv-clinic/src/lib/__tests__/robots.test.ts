import { describe, it, expect } from 'vitest';
import robots from '@/app/robots';

describe('robots.txt', () => {
  const result = robots();
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
  const disallowOf = (rule: (typeof rules)[number]) => ([] as string[]).concat(rule.disallow ?? []);

  it('never blocks static assets or JSON for any crawler', () => {
    for (const rule of rules) {
      const disallow = disallowOf(rule);
      expect(disallow).not.toContain('/_next/');
      expect(disallow.some((d) => d.includes('.json'))).toBe(false);
    }
  });

  it('keeps admin and api blocked for every crawler', () => {
    for (const rule of rules) {
      const disallow = disallowOf(rule);
      expect(disallow).toContain('/admin');
      expect(disallow).toContain('/api');
    }
  });

  it('names Yandex explicitly for the ru locale', () => {
    expect(rules.some((r) => r.userAgent === 'YandexBot')).toBe(true);
  });

  it('points to the sitemap on the canonical host', () => {
    expect(result.sitemap).toBe('https://liv-clinic.net/sitemap.xml');
  });
});
