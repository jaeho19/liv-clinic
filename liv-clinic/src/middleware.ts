import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { routing } from './i18n/routing';
import { LOCALES } from './i18n/routing';
import type { Locale } from './i18n/routing';
import { resolveLegacyRequest, type LegacyResolution } from './lib/legacyRedirects';

const intlMiddleware = createMiddleware(routing);

// Derived from LOCALES SSOT so adding a locale only requires updating routing.ts.
const WECHAT_REDIRECT_RE = new RegExp(
  `^/(${LOCALES.filter((l) => l !== 'zh').join('|')})/wechat(/.*)?$`,
);

// /book 단축 링크: 구글 비즈니스 프로필 포스트(외국인 타겟)용 진입점.
// 방문자 브라우저 언어를 감지해 해당 언어의 예약상담 폼으로 리다이렉트하고,
// UTM 파라미터를 붙여 GA4에서 유입을 분리 측정한다.
// 기본 UTM은 링크별로 query로 덮어쓸 수 있다. 예: /book?utm_campaign=summer2026
// /{locale}/book 은 언어 감지 없이 그 로케일로 보낸다(언어별 링크를 나눠 쓸 때).
const BOOK_UTM_DEFAULTS: Record<string, string> = {
  utm_source: 'google',
  utm_medium: 'gbp_post',
  utm_campaign: 'foreigner',
};
const BOOK_LOCALE_RE = new RegExp(`^/(${LOCALES.join('|')})/book/?$`);

// Accept-Language 1차 서브태그 → 지원 locale 매핑. 미매칭은 'en'으로 폴백.
const BOOK_LOCALE_BY_LANG: Partial<Record<string, Locale>> = {
  ko: 'ko', ja: 'ja', fr: 'fr', ru: 'ru', vi: 'vi', th: 'th', ar: 'ar', mn: 'mn',
};

function detectBookLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return 'en';

  // "ja,en-US;q=0.9,en;q=0.8" → q값 내림차순 정렬 후 우선순위대로 매칭.
  const tags = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { tag: tag.toLowerCase(), q: q ? Number.parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of tags) {
    const primary = tag.split('-')[0];
    // 중국어는 번체(대만/홍콩)와 간체를 구분.
    if (primary === 'zh') {
      return tag.includes('tw') || tag.includes('hk') || tag.includes('hant')
        ? 'zh-TW'
        : 'zh';
    }
    const mapped = BOOK_LOCALE_BY_LANG[primary];
    if (mapped) return mapped;
  }
  return 'en';
}

function bookRedirect(request: NextRequest, locale: Locale) {
  const target = new URL(`/${locale}/contact`, request.url);

  // 기본 UTM 먼저 적용 후, 들어온 query로 덮어쓴다(링크별 캠페인 override 허용).
  for (const [key, value] of Object.entries(BOOK_UTM_DEFAULTS)) {
    target.searchParams.set(key, value);
  }
  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  return NextResponse.redirect(target);
}

// 옛 워드프레스 잔재(/feed, /wp-*.php, /archive/* …)에 주는 410. 301로 홈에 보내면
// 검색엔진이 계속 재방문하므로 "영구히 없음"을 명시해 색인에서 지운다.
const GONE_HTML = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>410 Gone</title></head><body style="font-family:sans-serif;padding:2rem"><h1>410 Gone</h1><p>이 페이지는 더 이상 제공되지 않습니다. This page has been permanently removed.</p><p><a href="/ko">liv-clinic.net</a></p></body></html>`;

function goneResponse() {
  return new NextResponse(GONE_HTML, {
    status: 410,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=86400',
    },
  });
}

function legacyRedirect(request: NextRequest, resolution: Extract<LegacyResolution, { kind: 'redirect' }>) {
  const url = new URL(resolution.path, request.url);
  request.nextUrl.searchParams.forEach((value, key) => {
    if (key === 'lang') return;
    // 옛 게시판 파라미터(pageid·mod·uid …)는 버리고 캠페인 파라미터만 살린다
    if (resolution.query === 'utm-only' && !key.startsWith('utm_')) return;
    url.searchParams.set(key, value);
  });
  return NextResponse.redirect(url, 301);
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 옛 워드프레스 URL(`?lang=cn`, /notice?…, /staff, /feed …) — 다른 어떤 처리보다 먼저.
  // Netlify에서는 이 미들웨어(엣지 함수)가 netlify.toml의 [[redirects]]보다 먼저 실행되므로
  // 레거시 매핑은 여기 한 곳에만 둔다(2026-09-06 실측: /staff가 Netlify 규칙 대신 /ko/staff로 갔다).
  const legacy = resolveLegacyRequest(pathname, request.nextUrl.searchParams);
  if (legacy?.kind === 'gone') return goneResponse();
  if (legacy?.kind === 'redirect') return legacyRedirect(request, legacy);

  // /book 단축 링크 → 브라우저 언어별 예약상담 폼 + UTM 추적. /{locale}/book 은 로케일 고정.
  if (pathname === '/book') {
    return bookRedirect(request, detectBookLocale(request.headers.get('accept-language')));
  }
  const bookLocale = pathname.match(BOOK_LOCALE_RE)?.[1] as Locale | undefined;
  if (bookLocale) return bookRedirect(request, bookLocale);

  // /wechat 안내 페이지는 zh 전용. 다른 로케일 접근은 /zh/wechat으로 redirect.
  if (WECHAT_REDIRECT_RE.test(pathname)) {
    return NextResponse.redirect(new URL('/zh/wechat', request.url));
  }

  // /admin routes: refresh Supabase session cookies
  if (pathname.startsWith('/admin')) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh the session so cookies stay valid
    await supabase.auth.getUser();

    return supabaseResponse;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // ⚠️ Next.js 제약상 정적 문자열만 허용 — LOCALES (src/i18n/routing.ts)와 수동 동기화 필수.
    // locale 추가/제거 시 반드시 함께 수정. 누락 시 해당 locale 라우팅이 silent하게 실패함.
    '/(ko|en|ja|zh|zh-TW|vi|th|ru|fr|mn|ar)/:path*',
    // 옛 워드프레스 파일 경로는 점(.)이 있어 첫 패턴에서 빠진다 — 301(/index.php)·410 처리를 위해 명시.
    // /index.php를 미들웨어 없이 Next 서버가 받으면 next-intl requestLocale이 500을 낸다(2026-09-05 실측).
    '/index.php',
    '/(wp-[a-z0-9-]+\\.php|xmlrpc\\.php)',
    '/wp-admin/:path*',
    '/wp-content/:path*',
    '/wp-includes/:path*',
    '/wp-json/:path*',
  ],
};
