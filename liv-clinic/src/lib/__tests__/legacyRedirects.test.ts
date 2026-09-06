import { describe, it, expect } from 'vitest';
import { legacyLangToLocale, resolveLegacyRequest } from '@/lib/legacyRedirects';

const redirect = (path: string, query: 'strip-lang' | 'utm-only' = 'strip-lang') => ({
  kind: 'redirect',
  path,
  query,
});

describe('legacyLangToLocale', () => {
  it('maps the WPML codes the old site used, case-insensitively', () => {
    expect(legacyLangToLocale('en')).toBe('en');
    expect(legacyLangToLocale('EN')).toBe('en');
    expect(legacyLangToLocale('ja')).toBe('ja');
    expect(legacyLangToLocale('zh')).toBe('zh');
    expect(legacyLangToLocale('zh-tw')).toBe('zh-TW');
    expect(legacyLangToLocale('zh-hant')).toBe('zh-TW');
  });

  it('maps the aliases that were falling through to the cookie locale (GSC 404 166건)', () => {
    expect(legacyLangToLocale('cn')).toBe('zh');
    expect(legacyLangToLocale('tw')).toBe('zh-TW');
    expect(legacyLangToLocale('jp')).toBe('ja');
    expect(legacyLangToLocale('kr')).toBe('ko');
    expect(legacyLangToLocale('vn')).toBe('vi');
    expect(legacyLangToLocale('ru')).toBe('ru');
    expect(legacyLangToLocale('zh-hk')).toBe('zh-TW');
  });

  it('returns null for unknown or empty values', () => {
    expect(legacyLangToLocale('xx')).toBeNull();
    expect(legacyLangToLocale('')).toBeNull();
    expect(legacyLangToLocale(null)).toBeNull();
    expect(legacyLangToLocale(undefined)).toBeNull();
  });
});

describe('resolveLegacyRequest — ?lang= on normal paths', () => {
  it('sends the WordPress root to the locale home', () => {
    expect(resolveLegacyRequest('/', 'lang=en')).toEqual(redirect('/en'));
    expect(resolveLegacyRequest('/', 'lang=cn')).toEqual(redirect('/zh'));
    expect(resolveLegacyRequest('/', 'lang=tw')).toEqual(redirect('/zh-TW'));
    expect(resolveLegacyRequest('/', 'lang=jp')).toEqual(redirect('/ja'));
    expect(resolveLegacyRequest('/', 'lang=kr')).toEqual(redirect('/ko'));
    expect(resolveLegacyRequest('/', 'lang=vn')).toEqual(redirect('/vi'));
  });

  it('replaces an existing locale prefix (the URL our old 307 produced)', () => {
    expect(resolveLegacyRequest('/ko', 'lang=en')).toEqual(redirect('/en'));
    expect(resolveLegacyRequest('/ko/about', 'lang=zh-TW')).toEqual(redirect('/zh-TW/about'));
    expect(resolveLegacyRequest('/ko/about/', 'lang=ja')).toEqual(redirect('/ja/about'));
    expect(resolveLegacyRequest('/zh-TW/lifting', 'lang=ja')).toEqual(redirect('/ja/lifting'));
  });

  it('prefixes a plain path and keeps the rest of the query (strip-lang mode)', () => {
    expect(resolveLegacyRequest('/lifting/ulthera', 'lang=en')).toEqual(redirect('/en/lifting/ulthera'));
    expect(resolveLegacyRequest('/lifting/thermage', 'lang=jp&utm_source=x')).toEqual(
      redirect('/ja/lifting/thermage'),
    );
  });

  it('falls back to ko (or the existing prefix) instead of the cookie when the value is unknown', () => {
    expect(resolveLegacyRequest('/', 'lang=xx')).toEqual(redirect('/ko'));
    expect(resolveLegacyRequest('/', 'lang=')).toEqual(redirect('/ko'));
    expect(resolveLegacyRequest('/ja/about', 'lang=xx')).toEqual(redirect('/ja/about'));
  });

  it('leaves requests without ?lang= and without a legacy path to normal routing', () => {
    expect(resolveLegacyRequest('/', '')).toBeNull();
    expect(resolveLegacyRequest('/ko/about', 'utm_source=x')).toBeNull();
    expect(resolveLegacyRequest('/lifting/ulthera', '')).toBeNull();
    // 로케일 중복 URL은 리다이렉트하지 않는다 (링크 생성 코드를 고친다 — 사용자 지시)
    expect(resolveLegacyRequest('/ko/ko/media', '')).toBeNull();
  });
});

describe('resolveLegacyRequest — legacy WordPress paths', () => {
  it('maps the old kboard notice board (168건) to /media, resolving lang first', () => {
    expect(resolveLegacyRequest('/notice', 'pageid=1&mod=document&uid=22&lang=cn')).toEqual(
      redirect('/zh/media', 'utm-only'),
    );
    expect(resolveLegacyRequest('/notice', 'mod=document&uid=22&lang=ja')).toEqual(
      redirect('/ja/media', 'utm-only'),
    );
    expect(resolveLegacyRequest('/notice', 'pageid=1&mod=list')).toEqual(redirect('/ko/media', 'utm-only'));
    expect(resolveLegacyRequest('/notice/', '')).toEqual(redirect('/ko/media', 'utm-only'));
    expect(resolveLegacyRequest('/notice/123', '')).toEqual(redirect('/ko/media', 'utm-only'));
  });

  it('keeps the locale prefix our earlier 301 added (/ja/notice → /ja/media)', () => {
    expect(resolveLegacyRequest('/ja/notice', 'mod=document&uid=22')).toEqual(redirect('/ja/media', 'utm-only'));
    expect(resolveLegacyRequest('/ko/staff', '')).toEqual(redirect('/ko/about/staff', 'utm-only'));
    expect(resolveLegacyRequest('/ko/equipment', '')).toEqual(redirect('/ko/about/equipment', 'utm-only'));
  });

  it('sends the old PHP entry point to the locale home without reaching next-intl (500 before)', () => {
    expect(resolveLegacyRequest('/index.php', '')).toEqual(redirect('/ko', 'utm-only'));
    expect(resolveLegacyRequest('/index.php', 'lang=en&p=12')).toEqual(redirect('/en', 'utm-only'));
    expect(resolveLegacyRequest('/INDEX.PHP', 'lang=cn')).toEqual(redirect('/zh', 'utm-only'));
  });

  it('maps the remaining old pages', () => {
    expect(resolveLegacyRequest('/staff', '')).toEqual(redirect('/ko/about/staff', 'utm-only'));
    expect(resolveLegacyRequest('/equipment', '')).toEqual(redirect('/ko/about/equipment', 'utm-only'));
    expect(resolveLegacyRequest('/location', '')).toEqual(redirect('/ko/about/location', 'utm-only'));
    expect(resolveLegacyRequest('/review', 'lang=en')).toEqual(redirect('/en/reviews', 'utm-only'));
    expect(resolveLegacyRequest('/review/12', '')).toEqual(redirect('/ko/reviews', 'utm-only'));
    expect(resolveLegacyRequest('/promotion', '')).toEqual(redirect('/ko/events', 'utm-only'));
    expect(resolveLegacyRequest('/ko/promotion', '')).toEqual(redirect('/ko/events', 'utm-only'));
    expect(resolveLegacyRequest('/layer_popup/abc', '')).toEqual(redirect('/ko/events', 'utm-only'));
  });

  it('handles the Korean event slugs whether the path arrives decoded or percent-encoded', () => {
    expect(resolveLegacyRequest('/덴서티-이벤트', '')).toEqual(redirect('/ko/events', 'utm-only'));
    expect(resolveLegacyRequest(encodeURI('/직원픽-이벤트'), 'lang=jp')).toEqual(redirect('/ja/events', 'utm-only'));
  });

  it('does not touch real routes that merely look similar', () => {
    expect(resolveLegacyRequest('/reviews', '')).toBeNull();
    expect(resolveLegacyRequest('/ko/reviews', '')).toBeNull();
    expect(resolveLegacyRequest('/ko/about/staff', '')).toBeNull();
    expect(resolveLegacyRequest('/ko/events', '')).toBeNull();
    expect(resolveLegacyRequest('/ko/media', '')).toBeNull();
  });
});

describe('resolveLegacyRequest — WordPress remnants are gone (410)', () => {
  it.each([
    '/archive',
    '/archive/2021/05',
    '/feed',
    '/feed/',
    '/sample-page',
    '/wp-admin',
    '/wp-admin/admin-ajax.php',
    '/wp-content/uploads/2020/01/a.jpg',
    '/wp-includes/js/jquery.js',
    '/wp-json/wp/v2/posts',
    '/wp-login.php',
    '/wp-cron.php',
    '/xmlrpc.php',
    '/ko/feed',
    '/en/sample-page',
  ])('%s → gone', (path) => {
    expect(resolveLegacyRequest(path, '')).toEqual({ kind: 'gone' });
  });

  it('treats the kboard redirect parameter as gone regardless of path', () => {
    expect(resolveLegacyRequest('/', 'kboard_content_redirect=5')).toEqual({ kind: 'gone' });
    expect(resolveLegacyRequest('/ko', 'kboard_content_redirect=5&lang=en')).toEqual({ kind: 'gone' });
  });

  it('does not mark unrelated paths as gone', () => {
    expect(resolveLegacyRequest('/ko/about', '')).toBeNull();
    expect(resolveLegacyRequest('/archives-of-something', '')).toBeNull();
  });
});
