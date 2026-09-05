import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { routing } from './i18n/routing';
import { LOCALES } from './i18n/routing';
import type { Locale } from './i18n/routing';
import { legacyLangRedirectPath } from './lib/legacyRedirects';

const intlMiddleware = createMiddleware(routing);

// Derived from LOCALES SSOT so adding a locale only requires updating routing.ts.
const WECHAT_REDIRECT_RE = new RegExp(
  `^/(${LOCALES.filter((l) => l !== 'zh').join('|')})/wechat(/.*)?$`,
);

// /book 단축 링크: 구글 비즈니스 프로필 포스트(외국인 타겟)용 진입점.
// 방문자 브라우저 언어를 감지해 해당 언어의 예약상담 폼으로 리다이렉트하고,
// UTM 파라미터를 붙여 GA4에서 유입을 분리 측정한다.
// 기본 UTM은 링크별로 query로 덮어쓸 수 있다. 예: /book?utm_campaign=summer2026
const BOOK_UTM_DEFAULTS: Record<string, string> = {
  utm_source: 'google',
  utm_medium: 'gbp_post',
  utm_campaign: 'foreigner',
};

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

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // 옛 워드프레스 URL `?lang=xx` → 해당 로케일로 301 (구글에 아직 색인된 /?lang=en 등을 회수한다).
  // lang 이외의 파라미터(utm 등)는 유지한다.
  const legacyLang = request.nextUrl.searchParams.get('lang');
  if (legacyLang) {
    const target = legacyLangRedirectPath(pathname, legacyLang);
    if (target) {
      const url = new URL(target, request.url);
      request.nextUrl.searchParams.forEach((value, key) => {
        if (key !== 'lang') url.searchParams.set(key, value);
      });
      return NextResponse.redirect(url, 301);
    }
  }

  // /book 단축 링크 → 브라우저 언어별 예약상담 폼 + UTM 추적.
  if (pathname === '/book') {
    const locale = detectBookLocale(request.headers.get('accept-language'));
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
    '/(ko|en|ja|zh|zh-TW|vi|th|ru|fr|mn|ar)/:path*'
  ]
};
