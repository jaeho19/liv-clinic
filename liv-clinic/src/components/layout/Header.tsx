'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import NextLink from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from './LanguageSwitcher';
import MobileMenu, { type NavItem } from './MobileMenu';
import { useHashNavigation } from '@/hooks/useHashNavigation';
import { LOCALES, type Locale } from '@/i18n/routing';

// LOCALES SSOT 기반 홈 경로 매칭 — 새 locale 추가 시 자동 동기화
const LOCALE_HOME_RE = new RegExp(`^/(${LOCALES.map((l) => l.replace(/\./g, '\\.')).join('|')})$`);

// Per-locale minimum viewport width at which the 9-item desktop nav is shown. Translated
// labels differ in length, so every locale gets its own breakpoint instead of the old binary
// "compact" switch that hid the nav at EVERY width for long-label locales. Below the threshold
// the hamburger drawer takes over — and the drawer now renders at every width, so no locale is
// ever left without a way to reach the 9 categories.
//
// Measured 2026-07-27 (dev, unscrolled = the widest state) on this header row: content width is
// viewport − 80px, capped at 1800px. Required row width = logo (172) + nav + right cluster, and
// the right cluster is dominated by the locale's consultation-CTA label (267px for ko → 353px
// for ru). Thresholds are the smallest step that leaves ≥30px of slack:
//   locale     nav   right   required   threshold (slack)
//   ko         690     267       1140     1280 (+60)   zh 1121 (+79) / zh-TW 1126 (+74)
//   ar         786     283       1253     1440 (+107)
//   th         765     342       1291     1440 (+69)
//   vi         833     288       1304     1440 (+56)
//   en         839     336       1366     1536 (+90)
//   ja         956     266       1414     1536 (+42)
//   mn         945     288       1425     1536 (+31)
//   fr         951     293       1436     1600 (+84)   only +20 at 1536 → deferred
//   ru         912     353       1457     1600 (+63)   overflows 1536 by 1px
// Below its threshold a locale overflows by 50–250px, which is what used to push the language
// switcher off-screen; the hamburger drawer covers that band.
type NavBreakpoint = 1280 | 1440 | 1536 | 1600;

const NAV_MIN_WIDTH: Record<Locale, NavBreakpoint> = {
  ko: 1280,
  zh: 1280,
  'zh-TW': 1280,
  ar: 1440,
  th: 1440,
  vi: 1440,
  en: 1536,
  ja: 1536,
  mn: 1536,
  fr: 1600,
  ru: 1600,
};

// Tailwind v4 scans literal class strings, so each threshold's variants are spelled out here
// instead of being interpolated at runtime.
const NAV_VISIBILITY_CLASS: Record<NavBreakpoint, string> = {
  1280: 'hidden xl:flex',
  1440: 'hidden min-[1440px]:flex',
  1536: 'hidden 2xl:flex',
  1600: 'hidden min-[1600px]:flex',
};

const HAMBURGER_VISIBILITY_CLASS: Record<NavBreakpoint, string> = {
  1280: 'xl:hidden',
  1440: 'min-[1440px]:hidden',
  1536: '2xl:hidden',
  1600: 'min-[1600px]:hidden',
};

// Nav item spacing. Long-label locales stop growing the gap at 2xl: the extra 8px per gap costs
// 64px across the 9 items, which is what keeps en/ja/mn on 1536 and ru on 1600 — without the cap
// ja/mn need 1600 and ru needs 1700. ko/zh/zh-TW have room to spare, so they keep the airier rhythm.
const NAV_GAP_WIDE = { top: 'gap-5 xl:gap-7 2xl:gap-9', scrolled: 'gap-4 xl:gap-6 2xl:gap-7' };
const NAV_GAP_TIGHT = { top: 'gap-5 xl:gap-7', scrolled: 'gap-4 xl:gap-6' };

// The multilingual trust chip only fills the gap left by a hidden nav: show it from xl up to
// the locale's nav threshold. Locales that already show the nav at xl never get room for it.
// One stacked min+max variant per threshold rather than `xl:inline-flex` plus a separate
// `<threshold>:hidden`: Tailwind v4 emits arbitrary min-width variants BEFORE the named `xl`
// variant, so the two-variant form left `xl:inline-flex` winning and the chip visible next to
// the nav (measured: +139~144px of right-cluster width).
// The max-width bound is the threshold itself, not threshold−1: Tailwind v4 compiles
// `max-[1440px]` to `not (min-width: 1440px)`, i.e. strictly BELOW 1440 — the exact complement
// of the nav's `min-[1440px]`. Using `max-[1439px]` left a 1px dead band at exactly 1439
// where neither the chip nor the nav rendered.
const TRUST_CHIP_VISIBILITY_CLASS: Record<NavBreakpoint, string> = {
  1280: 'hidden',
  1440: 'hidden xl:max-[1440px]:inline-flex',
  1536: 'hidden xl:max-[1536px]:inline-flex',
  1600: 'hidden xl:max-[1600px]:inline-flex',
};

// Throttle 훅 - 스크롤 성능 최적화 (Vercel Best Practice: rerender-dependencies)
function useThrottle<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: unknown[]) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        callback(...args);
        lastRun.current = now;
      } else if (!timeoutRef.current) {
        // 마지막 호출도 실행되도록 보장
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
          timeoutRef.current = null;
        }, delay - timeSinceLastRun);
      }
    }) as T,
    [callback, delay]
  ) as T;
}

export default function Header() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tLang = useTranslations('langSupport');
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  // ?? 1280: an unexpected locale would otherwise yield undefined and interpolate
  // `undefined` into the nav/hamburger/chip className lookups.
  const navMinWidth = NAV_MIN_WIDTH[locale] ?? 1280;
  const navGap = navMinWidth === 1280 ? NAV_GAP_WIDE : NAV_GAP_TIGHT;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const handleHashNav = useHashNavigation();

  // Check if we're on the homepage (has dark hero background)
  const isHomePage = pathname === '/' || LOCALE_HOME_RE.test(pathname);

  // Use dark styling on non-homepage or when scrolled
  const useDarkStyle = isScrolled || !isHomePage;

  // Throttled 스크롤 핸들러 (100ms 간격) - 60fps에서 ~6회/초로 감소
  const handleScroll = useThrottle(
    useCallback(() => {
      setIsScrolled(window.scrollY > 50);
    }, []),
    100
  );

  useEffect(() => {
    // passive: true로 스크롤 성능 추가 최적화
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Close the drawer once the viewport is wide enough to show this locale's desktop nav,
  // so the hamburger and the drawer are never both live at the same width.
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleResize = () => {
      if (window.innerWidth >= navMinWidth) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [navMinWidth, isMobileMenuOpen]);

  const navItems: NavItem[] = [
    {
      key: 'about',
      label: t('about'),
      href: '/about',
      children: [
        { key: 'aboutBrand', label: t('aboutBrand'), href: '/about' },
        { key: 'aboutStaff', label: t('aboutStaff'), href: '/about/staff' },
        { key: 'aboutMediaNews', label: t('aboutMediaNews'), href: { pathname: '/', hash: 'media-news' }, hash: 'media-news' },
        { key: 'aboutEquipment', label: t('aboutEquipment'), href: '/about/equipment' },
        { key: 'aboutLocation', label: t('aboutLocation'), href: '/about/location' },
      ],
    },
    {
      key: 'signature',
      label: t('signature'),
      href: '/signature',
    },
    {
      key: 'lifting',
      label: t('lifting'),
      href: '/lifting',
      children: [
        { key: 'ulthera', label: t('ulthera'), href: '/lifting/ulthera' },
        { key: 'thermage', label: t('thermage'), href: '/lifting/thermage' },
        { key: 'onda', label: t('onda'), href: '/lifting/onda' },
        { key: 'density', label: t('density'), href: '/lifting/density' },
        { key: 'inmode', label: t('inmode'), href: '/lifting/inmode' },
        { key: 'shurink', label: t('shurink'), href: '/lifting/shurink' },
        { key: 'aptos', label: t('aptos'), href: '/lifting/aptos' },
        { key: 'thread', label: t('thread'), href: '/lifting/thread' },
      ],
    },
    {
      key: 'antiaging',
      label: t('antiaging'),
      href: '/antiaging',
      children: [
        { key: 'botox', label: t('botox'), href: '/antiaging/botox' },
        { key: 'filler', label: t('filler'), href: '/antiaging/filler' },
        { key: 'skinbooster', label: t('skinbooster'), href: '/antiaging/skinbooster' },
        { key: 'skincare', label: t('skincare'), href: '/antiaging/skincare' },
        { key: 'hilowave', label: t('hilowave'), href: '/antiaging/hilowave-v2' },
      ],
    },
    {
      key: 'laser',
      label: t('laser'),
      href: '/laser',
    },
    {
      key: 'pricing',
      label: t('pricing'),
      href: '/pricing',
    },
    {
      key: 'beforeAfter',
      label: t('beforeAfter'),
      href: '/before-after',
    },
    {
      key: 'medical',
      label: t('medical'),
      href: '/medical',
    },
    {
      key: 'events',
      label: t('events'),
      href: '/events',
    },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-area-pt ${
          useDarkStyle
            ? 'bg-white/95 backdrop-blur-md shadow-sm'
            : 'bg-secondary/95 backdrop-blur-md shadow-sm'
        }`}
      >
        {/* Header-only wrapper instead of .container-custom (1120px content cap + overflow-x:clip):
            the wider row is what makes the 9-item nav fit for long-label locales, and a plain div
            can never clip the end of the right cluster (language switcher) the way clip did.
            Deliberate trade-off: above 1280px this gutter is wider than the page body's
            .container-custom (1280), so the header row and the page content below it are
            intentionally NOT left/right aligned — nav fit wins over edge alignment. */}
        <div className="mx-auto w-full max-w-[1800px] px-6 md:px-8 lg:px-10">
          <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? 'h-16' : 'h-20'}`}>
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
              <Image
                src="/images/logo.png"
                alt="LIV Plastic Surgery"
                width={206}
                height={48}
                priority
                className={`object-contain transition-all duration-300 ${
                  isScrolled ? 'h-8 w-auto' : 'h-10 w-auto'
                } ${
                  useDarkStyle ? '' : 'brightness-0 invert'
                }`}
              />
            </Link>

            {/* Desktop Navigation — shown from this locale's NAV_MIN_WIDTH up; narrower viewports
                 fall back to the hamburger drawer so the right cluster is never pushed off-screen */}
            <nav
              className={`${NAV_VISIBILITY_CLASS[navMinWidth]} items-center transition-all duration-300 xl:ms-4 2xl:ms-5 ${
                isScrolled ? navGap.scrolled : navGap.top
              }`}
            >
              {navItems.map((item) => (
                <div
                  key={item.key}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(item.key)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={`whitespace-nowrap font-medium tracking-[0.02em] transition-all duration-300 hover:text-primary ${
                      isScrolled ? 'text-[13px] xl:text-sm' : 'text-sm xl:text-[15px]'
                    } ${
                      useDarkStyle ? 'text-mono' : 'text-white text-shadow-light'
                    }`}
                  >
                    {item.label}
                  </Link>

                  {/* Dropdown Menu */}
                  {item.children && (
                    <AnimatePresence>
                      {activeDropdown === item.key && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full start-0 pt-4"
                        >
                          <div className="bg-white rounded-xl shadow-lg py-3 min-w-[180px]">
                            {item.children.map((child) =>
                              // 홈 섹션 앵커 항목은 next-intl Link(소프트 라우팅) 대신 일반 <a>로
                              // 렌더한다. onClick에서 setState/scroll을 동기 호출하면 드롭다운
                              // AnimatePresence exit와 겹쳐 reconciler가 깨지므로, 클릭 시 React
                              // 작업을 전혀 하지 않고 브라우저 네이티브 해시 스크롤에 맡긴다.
                              // (드롭다운은 스크롤 후 mouseleave로 자연스럽게 닫힘)
                              child.hash ? (
                                <a
                                  key={child.key}
                                  href={`/${locale}#${child.hash}`}
                                  onClick={(e) => handleHashNav(e, child.hash!)}
                                  className="block px-5 py-3 text-sm text-mono hover:text-primary hover:bg-background transition-colors min-h-[44px] flex items-center"
                                >
                                  {child.label}
                                </a>
                              ) : (
                                <Link
                                  key={child.key}
                                  href={child.href}
                                  className="block px-5 py-3 text-sm text-mono hover:text-primary hover:bg-background transition-colors min-h-[44px] flex items-center"
                                >
                                  {child.label}
                                </Link>
                              )
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Side: CTA + Language Switcher (shrink-0: 우측 영역 절대 압축 금지 → LanguageSwitcher 항상 노출 보장) */}
            <div className="flex items-center gap-2 md:gap-3 xl:gap-5 shrink-0">
              {/* Consultation Button - Desktop */}
              <Link
                href="/contact"
                className={`hidden md:inline-block whitespace-nowrap btn-primary transition-all duration-300 xl:ms-2 2xl:ms-3 ${
                  isScrolled ? 'text-xs py-1.5! px-3! xl:px-4!' : 'text-xs py-1.5! px-3! xl:px-4!'
                } ${
                  !useDarkStyle && 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
                }`}
              >
                {tCommon('consultation')}
              </Link>

              {/* Admin Link */}
              <NextLink
                href="/admin/login"
                className={`hidden md:flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                  useDarkStyle
                    ? 'text-mono-light hover:text-secondary hover:bg-background'
                    : 'text-white/50 hover:text-white hover:bg-white/10'
                }`}
                title={t('admin')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </NextLink>

              {/* Multilingual support trust chip - Desktop.
                  Only rendered in the band where the desktop nav is still hidden (xl → NAV_MIN_WIDTH),
                  so it can never compete with the nav for horizontal room. */}
              <span
                title={tLang('badgeAria')}
                className={`${TRUST_CHIP_VISIBILITY_CLASS[navMinWidth]} items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  useDarkStyle
                    ? 'border-primary/30 bg-primary/5 text-primary/90'
                    : 'border-white/40 bg-white/10 text-white/90 backdrop-blur-sm'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3M3.6 9h16.8M3.6 15h16.8" />
                </svg>
                {tLang('badge')}
              </span>

              {/* Language Switcher */}
              <LanguageSwitcher isScrolled={useDarkStyle} />

              {/* Consultation CTA - Mobile (compact, always visible < md; 데스크톱은 위 텍스트 버튼이 담당) */}
              <Link
                href="/contact"
                aria-label={tCommon('consultation')}
                className={`md:hidden flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors ${
                  useDarkStyle
                    ? 'bg-primary text-white hover:bg-secondary'
                    : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </Link>

              {/* Mobile Menu Button — visible below this locale's NAV_MIN_WIDTH, hidden above it */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className={`${HAMBURGER_VISIBILITY_CLASS[navMinWidth]} p-3 min-w-[44px] min-h-[44px] flex items-center justify-center`}
                aria-label="Open menu"
              >
                <svg
                  className={`w-6 h-6 transition-colors ${
                    useDarkStyle ? 'text-mono' : 'text-white'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={navItems}
      />
    </>
  );
}
