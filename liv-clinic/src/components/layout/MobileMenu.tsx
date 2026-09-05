'use client';

import { useState, useEffect, useCallback, useRef, type ComponentProps } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link, usePathname } from '@/i18n/routing';
import { LOCALE_META, LOCALE_ORDER } from '@/i18n/locales-meta';
import { localeSwitchPath } from '@/lib/guides/publicIndex';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useDirection } from '@/hooks/useDirection';
import { useHashNavigation } from '@/hooks/useHashNavigation';

// href는 일반 경로 문자열('/about') 외에 홈+해시 앵커({ pathname: '/', hash: 'media-news' })도
// 허용해야 하므로 next-intl Link의 href 타입을 그대로 사용한다.
type NavHref = ComponentProps<typeof Link>['href'];

export interface NavItem {
  key: string;
  label: string;
  href: NavHref;
  // 홈 섹션 앵커 항목이면 대상 요소 id(예: 'media-news'). 지정 시 소프트 라우팅 대신
  // useHashNavigation으로 처리한다.
  hash?: string;
  children?: NavItem[];
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
}

// 드로어는 aria-modal="true"이고, ru/fr 등 긴 라벨 로케일에서는 데스크톱 폭에서도 이 드로어가
// 유일한 내비게이션이다. Tab이 뒤 페이지로 새지 않도록 패널 안에서만 순환시킨다.
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const languages = LOCALE_ORDER.map((code) => ({
  code,
  label: LOCALE_META[code].name,
  flag: LOCALE_META[code].flag,
}));

export default function MobileMenu({ isOpen, onClose, navItems }: MobileMenuProps) {
  const t = useTranslations('common');
  const tNav = useTranslations('nav');
  const tLang = useTranslations('langSupport');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const locale = useLocale();
  const pathname = usePathname();
  const dir = useDirection();
  const handleHashNav = useHashNavigation();
  const menuRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // 드로어를 연 요소(햄버거 버튼) — 닫힐 때 포커스를 되돌려 준다.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // RTL에서는 왼쪽에서 슬라이드 인, LTR에서는 오른쪽에서 슬라이드 인
  const slideInitial = dir === 'rtl' ? '-100%' : '100%';

  // Escape 키로 메뉴 닫기 + Tab 포커스 트랩
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;

    const panel = menuRef.current;
    if (!panel) return;
    const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    // 패널 밖에 포커스가 있으면 방향에 맞는 끝으로 되돌리고, 끝에 닿으면 반대 끝으로 순환.
    if (e.shiftKey) {
      if (active === first || !panel.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last || !panel.contains(active)) {
      e.preventDefault();
      first.focus();
    }
  }, [onClose]);

  // Escape/Tab 키 리스너 — onClose 아이덴티티가 바뀌어도 아래 포커스 효과를 재실행시키지 않도록 분리.
  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // 메뉴 열릴 때 초기 포커스 + 스크롤 방지, 닫히거나 언마운트되면 원래 포커스 복원
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      return;
    }

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    // 메뉴 열릴 때 닫기 버튼에 포커스
    const focusTimer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);
    // 스크롤 방지
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = '';
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
    };
  }, [isOpen]);

  // useCallback으로 메모이제이션 - 불필요한 리렌더 방지 (Vercel Best Practice: rerender-functional-setstate)
  const toggleExpand = useCallback((key: string) => {
    setExpandedItems((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  }, []);

  // Hard navigation: next-intl 소프트 라우팅 + AnimatePresence(메뉴 슬라이드 exit) 동시 발생 시
  // React reconciler가 "removeChild ... not a child of this node" 예외로 페이지를 깨뜨림.
  // locale 전환은 폰트·dir·서버 컴포넌트 모두 새로 받아야 하므로 전체 리로드가 안전·정합.
  const handleLanguageChange = useCallback((langCode: string) => {
    // 가이드(/guides…)는 4개 언어에만 있어 없는 언어로는 국제환자 페이지/허브로 보낸다(publicIndex.localeSwitchPath).
    const target = localeSwitchPath(pathname, langCode);
    const suffix = target === '/' ? '' : target;
    window.location.assign(`/${langCode}${suffix}`);
  }, [pathname]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Menu Panel — no width cap: the hamburger that opens it stays visible up to a
              locale-specific breakpoint (Header NAV_MIN_WIDTH), so a lg:hidden drawer would
              open invisibly on desktop while still locking body scroll. */}
          <motion.div
            ref={menuRef}
            initial={{ x: slideInitial }}
            animate={{ x: 0 }}
            exit={{ x: slideInitial }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 end-0 bottom-0 w-[min(300px,85vw)] bg-white z-50 overflow-y-auto safe-area-pr"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border safe-area-pt">
              <Image
                src="/images/logo.png"
                alt="LIV Plastic Surgery"
                width={206}
                height={48}
                className="h-7 w-auto object-contain"
              />
              <div className="flex items-center">
                <a
                  href="/admin/login"
                  onClick={onClose}
                  className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-mono-light/40 hover:text-primary transition-colors"
                  aria-label={tNav('admin')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </a>
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-mono hover:text-primary transition-colors"
                  aria-label={t('closeMenu')}
                >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-5">
              {navItems.map((item) => (
                <div key={item.key} className="border-b border-border last:border-0">
                  {item.children ? (
                    <>
                      <button
                        onClick={() => toggleExpand(item.key)}
                        className="w-full flex items-center justify-between py-4 text-mono hover:text-primary transition-colors min-h-[52px]"
                        aria-expanded={expandedItems.includes(item.key)}
                        aria-controls={`submenu-${item.key}`}
                      >
                        <span className="font-medium">{item.label}</span>
                        <svg
                          className={`w-5 h-5 transition-transform ${
                            expandedItems.includes(item.key) ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      <AnimatePresence>
                        {expandedItems.includes(item.key) && (
                          <motion.div
                            id={`submenu-${item.key}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pb-4 ps-4 space-y-1">
                              {item.children.map((child) =>
                                // 홈 섹션 앵커 항목은 일반 <a>로 렌더(소프트 라우팅 회피)
                                child.hash ? (
                                  <a
                                    key={child.key}
                                    href={`/${locale}#${child.hash}`}
                                    onClick={(e) => handleHashNav(e, child.hash!)}
                                    className="block py-3 text-sm text-mono-light hover:text-primary transition-colors min-h-[44px] flex items-center"
                                  >
                                    {child.label}
                                  </a>
                                ) : (
                                  <Link
                                    key={child.key}
                                    href={child.href}
                                    onClick={onClose}
                                    className="block py-3 text-sm text-mono-light hover:text-primary transition-colors min-h-[44px] flex items-center"
                                  >
                                    {child.label}
                                  </Link>
                                )
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="block py-4 font-medium text-mono hover:text-primary transition-colors min-h-[52px] flex items-center"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* CTA Button */}
            <div className="px-5 py-4">
              <Link
                href="/contact"
                onClick={onClose}
                className="block w-full btn-primary text-center"
              >
                {t('consultation')}
              </Link>
            </div>

            {/* Language Switcher */}
            <div className="px-5 py-4 border-t border-border">
              {/* Multilingual support trust badge */}
              <div
                title={tLang('badgeAria')}
                className="mb-3 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs font-medium text-primary"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3M3.6 9h16.8M3.6 15h16.8" />
                </svg>
                <span>{tLang('badge')}</span>
              </div>
              <p className="text-sm text-mono-light mb-3">{t('language')}</p>
              <div className="grid grid-cols-2 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`flex items-center gap-2 py-3 px-3 rounded-lg text-sm transition-colors min-h-[44px] ${
                      lang.code === locale
                        ? 'bg-primary text-white'
                        : 'bg-background text-mono hover:bg-border'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="px-5 py-4 border-t border-border safe-area-pb">
              <a
                href="tel:02-797-2773"
                className="flex items-center gap-3 text-mono hover:text-primary transition-colors min-h-[44px]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className="font-medium">02-797-2773</span>
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
