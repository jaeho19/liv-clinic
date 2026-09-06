import { describe, it, expect, vi } from 'vitest';
import { BASE_URL } from '@/lib/seo';
import { LOCALES } from '@/i18n/routing';
import {
  INDEXNOW_ENDPOINT,
  INDEXNOW_KEY,
  eventIndexNowUrls,
  indexNowKeyLocation,
  indexNowUrlsFor,
  notifyIndexNow,
  reviewIndexNowUrls,
} from '@/lib/indexnow';

const okFetch = (status = 200) =>
  vi.fn(async () => new Response(null, { status })) as unknown as typeof fetch;

describe('IndexNow url helpers', () => {
  it('expands a path to every locale once', () => {
    const urls = indexNowUrlsFor(['/reviews']);
    expect(urls).toHaveLength(LOCALES.length);
    expect(urls).toContain(`${BASE_URL}/ko/reviews`);
    expect(urls).toContain(`${BASE_URL}/zh-TW/reviews`);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('lists the events hub and the encoded event detail', () => {
    const urls = eventIndexNowUrls('6월-프로모션');
    expect(urls).toHaveLength(LOCALES.length * 2);
    expect(urls).toContain(`${BASE_URL}/ko/events/6%EC%9B%94-%ED%94%84%EB%A1%9C%EB%AA%A8%EC%85%98`);
    expect(eventIndexNowUrls(null)).toHaveLength(LOCALES.length);
    expect(reviewIndexNowUrls()).toHaveLength(LOCALES.length);
  });

  it('points keyLocation at the public key file', () => {
    expect(INDEXNOW_KEY).toMatch(/^[a-f0-9]{32}$/);
    expect(indexNowKeyLocation()).toBe(`${BASE_URL}/${INDEXNOW_KEY}.txt`);
  });
});

describe('notifyIndexNow', () => {
  it('posts host, key, keyLocation and urlList to the IndexNow endpoint in production', async () => {
    const fetchImpl = okFetch(202);
    const result = await notifyIndexNow([`${BASE_URL}/ko/reviews`], {
      fetchImpl,
      env: { NODE_ENV: 'production' },
    });
    expect(result).toEqual({ ok: true, status: 202 });
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe(INDEXNOW_ENDPOINT);
    expect(init.method).toBe('POST');
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      host: new URL(BASE_URL).host,
      key: INDEXNOW_KEY,
      keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: [`${BASE_URL}/ko/reviews`],
    });
  });

  it('skips outside production unless forced, and when disabled', async () => {
    const fetchImpl = okFetch();
    expect(await notifyIndexNow(['x'], { fetchImpl, env: { NODE_ENV: 'development' } })).toEqual({
      ok: true,
      skipped: 'not-production',
    });
    expect(await notifyIndexNow(['x'], { fetchImpl, env: { NODE_ENV: 'production', INDEXNOW_DISABLED: '1' } })).toEqual({
      ok: true,
      skipped: 'disabled',
    });
    expect(await notifyIndexNow([], { fetchImpl, env: { NODE_ENV: 'production' } })).toEqual({ ok: true, skipped: 'no-urls' });
    expect(fetchImpl).not.toHaveBeenCalled();

    await notifyIndexNow(['x'], { fetchImpl, env: { NODE_ENV: 'development' }, force: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('never throws — reports non-2xx and network errors as results', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await notifyIndexNow(['x'], { fetchImpl: okFetch(422), env: { NODE_ENV: 'production' } })).toEqual({
      ok: false,
      status: 422,
    });
    const failing = vi.fn(async () => {
      throw new Error('boom');
    }) as unknown as typeof fetch;
    expect(await notifyIndexNow(['x'], { fetchImpl: failing, env: { NODE_ENV: 'production' } })).toEqual({
      ok: false,
      error: 'boom',
    });
    warn.mockRestore();
  });
});
