import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { notifyIndexNow } from './liv-clinic/src/lib/indexnow';
import { setupPageEngagementTracking } from './liv-clinic/src/components/analytics/GoogleAnalytics';
import { trackContact } from './liv-clinic/src/lib/analytics-events';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('IndexNow isolates preview and branch builds from live search submission', () => {
  it.each(['deploy-preview', 'branch-deploy'])('blocks %s, including explicit force', async context => {
    const fetchImpl = vi.fn();
    for (const force of [false, true]) {
      for (const contextField of ['CONTEXT', 'LIV_BUILD_CONTEXT']) {
        const result = await notifyIndexNow(['https://liv-clinic.net/en'], {
          fetchImpl, force, env: { NODE_ENV: 'production', [contextField]: context },
        });
        expect(result).toEqual({ ok: true, skipped: 'preview' });
      }
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('retains preview blocking when the build-only variable is absent at runtime', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('LIV_BUILD_CONTEXT', 'deploy-preview');
    vi.stubEnv('CONTEXT', undefined);
    const fetchImpl = vi.fn();
    expect(await notifyIndexNow(['https://liv-clinic.net/en'], { fetchImpl, force: true }))
      .toEqual({ ok: true, skipped: 'preview' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('continues production submission and development-only force', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 202 }));
    expect(await notifyIndexNow(['https://liv-clinic.net/en'], {
      fetchImpl, env: { NODE_ENV: 'production', LIV_BUILD_CONTEXT: 'production' },
    })).toEqual({ ok: true, status: 202 });
    expect(await notifyIndexNow(['https://liv-clinic.net/en'], {
      fetchImpl, force: true, env: { NODE_ENV: 'development' },
    })).toEqual({ ok: true, status: 202 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does not override an explicit disabled policy with force', async () => {
    const fetchImpl = vi.fn();
    expect(await notifyIndexNow(['https://liv-clinic.net/en'], {
      fetchImpl, force: true, env: { NODE_ENV: 'production', INDEXNOW_DISABLED: '1' },
    })).toEqual({ ok: true, skipped: 'disabled' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('page engagement lifecycle, duplication and private link text', () => {
  let view: EventTarget & { innerHeight: number; scrollY: number; location: URL };
  let doc: EventTarget & { hidden: boolean; documentElement: { scrollHeight: number } };
  let send: ReturnType<typeof vi.fn>;
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    view = Object.assign(new EventTarget(), { innerHeight: 1000, scrollY: 0, location: new URL('https://liv-clinic.net/en') });
    doc = Object.assign(new EventTarget(), { hidden: false, documentElement: { scrollHeight: 2000 } });
    send = vi.fn();
    vi.stubGlobal('window', view);
    vi.stubGlobal('document', doc);
    vi.stubGlobal('gtag', send);
    vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Live network forbidden in analytics regression'); }));
  });

  afterEach(() => { cleanup?.(); cleanup = undefined; });

  function click(href: string, trackedPhone = false) {
    const link = Object.assign(new URL(href), { dataset: trackedPhone ? { analyticsContact: 'phone' } : {} });
    const event = new Event('click');
    Object.defineProperty(event, 'target', { value: { closest: () => link } });
    doc.dispatchEvent(event);
  }

  it('resets scroll thresholds per page and attributes each event to that page', () => {
    cleanup = setupPageEngagementTracking('/en');
    view.scrollY = 500;
    view.dispatchEvent(new Event('scroll'));
    view.dispatchEvent(new Event('scroll'));
    expect(send).toHaveBeenCalledTimes(2);
    cleanup();
    cleanup = setupPageEngagementTracking('/en/pricing');
    view.dispatchEvent(new Event('scroll'));
    expect(send).toHaveBeenCalledTimes(4);
    expect(send.mock.calls.map(c => c[2].page_path)).toEqual(['/en', '/en', '/en/pricing', '/en/pricing']);
  });

  it('starts a fresh page timer on navigation without attributing the old timer to the new page', () => {
    cleanup = setupPageEngagementTracking('/en');
    vi.advanceTimersByTime(20000);
    cleanup();
    cleanup = setupPageEngagementTracking('/ja/pricing');
    vi.advanceTimersByTime(10000);
    expect(send).not.toHaveBeenCalled();
    vi.advanceTimersByTime(20000);
    expect(send).toHaveBeenCalledExactlyOnceWith('event', 'time_on_page', { seconds: 30, page_path: '/ja/pricing' });
  });

  it('remounts cleanly with exactly one listener and timer set', () => {
    setupPageEngagementTracking('/en')();
    cleanup = setupPageEngagementTracking('/en');
    click('tel:+82200000000');
    vi.advanceTimersByTime(30000);
    expect(send.mock.calls.map(c => c[1])).toEqual(['contact', 'time_on_page']);
  });

  it('retains listeners when gtag arrives after setup', () => {
    vi.stubGlobal('gtag', undefined);
    cleanup = setupPageEngagementTracking('/en');
    view.scrollY = 250;
    view.dispatchEvent(new Event('scroll'));
    vi.stubGlobal('gtag', send);
    view.dispatchEvent(new Event('scroll'));
    expect(send).toHaveBeenCalledExactlyOnceWith('event', 'scroll_depth', { percent_scrolled: 25, page_path: '/en' });
  });

  it('counts explicitly instrumented phone links once and still covers other phone links', () => {
    cleanup = setupPageEngagementTracking('/en');
    trackContact('phone');
    click('tel:+82200000000', true);
    expect(send).toHaveBeenCalledTimes(1);
    click('tel:+82200000000');
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('never records mailto text, outbound query values or URL fragments', () => {
    cleanup = setupPageEngagementTracking('/en');
    click('mailto:patient@example.test?body=private');
    click('https://example.test/contact?email=patient@example.test#private-message');
    click('https://liv-clinic.net/en/pricing');
    expect(send).toHaveBeenCalledExactlyOnceWith('event', 'click', {
      event_category: 'outbound', event_label: 'https://example.test/contact', page_path: '/en', transport_type: 'beacon',
    });
  });

  it('cleans up all listeners and timers', () => {
    cleanup = setupPageEngagementTracking('/en');
    cleanup();
    click('tel:+82200000000');
    view.scrollY = 1000;
    view.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(300000);
    expect(send).not.toHaveBeenCalled();
  });

  it('does not emit scroll percentages for a page shorter than the viewport', () => {
    cleanup = setupPageEngagementTracking('/en');
    doc.documentElement.scrollHeight = 500;
    view.dispatchEvent(new Event('scroll'));
    expect(send).not.toHaveBeenCalled();
  });

  it('skips timer events while the document is hidden', () => {
    cleanup = setupPageEngagementTracking('/en');
    doc.hidden = true;
    vi.advanceTimersByTime(30000);
    expect(send).not.toHaveBeenCalled();
  });
});
