import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /wechat 안내 페이지는 zh 전용. 다른 로케일 접근은 /zh/wechat으로 redirect.
  const wechatNonZh = pathname.match(/^\/(ko|en|ja|zh-TW|vi|th|ru)\/wechat(\/.*)?$/);
  if (wechatNonZh) {
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
    // LOCALES (src/i18n/routing.ts)와 동기화 — 추가 시 함께 수정
    '/(ko|en|ja|zh|zh-TW|vi|th|ru)/:path*'
  ]
};
