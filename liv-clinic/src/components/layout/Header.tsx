'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from './LanguageSwitcher';
import MobileMenu from './MobileMenu';
import { MAIN_NAV } from '@/lib/constants';

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
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Check if we're on the homepage (has dark hero background)
  const isHomePage = pathname === '/' || /^\/(ko|en|ja|zh)$/.test(pathname);

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

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    {
      key: 'about',
      label: t('about'),
      href: '/about',
      children: [
        { key: 'aboutBrand', label: t('aboutBrand'), href: '/about' },
        { key: 'aboutStaff', label: t('aboutStaff'), href: '/about/staff' },
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
        { key: 'density', label: t('density'), href: '/lifting/density' },
        { key: 'inmode', label: t('inmode'), href: '/lifting/inmode' },
        { key: 'shurink', label: t('shurink'), href: '/lifting/shurink' },
        { key: 'thread', label: t('thread'), href: '/lifting/thread' },
        { key: 'aptos', label: t('aptos'), href: '/lifting/aptos' },
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
      ],
    },
    {
      key: 'laser',
      label: t('laser'),
      href: '/laser',
    },
    {
      key: 'medical',
      label: t('medical'),
      href: '/medical',
    },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-area-pt ${
          useDarkStyle
            ? 'bg-white/95 backdrop-blur-md shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="container-custom">
          <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? 'h-16' : 'h-20'}`}>
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span
                className={`font-serif tracking-wider transition-all duration-300 ${
                  isScrolled ? 'text-xl' : 'text-2xl'
                } ${
                  useDarkStyle ? 'text-secondary' : 'text-white text-shadow'
                }`}
              >
                LIV
              </span>
              <span
                className={`hidden sm:block tracking-[0.2em] uppercase transition-all duration-300 ${
                  isScrolled ? 'text-[10px]' : 'text-xs'
                } ${
                  useDarkStyle ? 'text-mono' : 'text-white/90 text-shadow-light'
                }`}
              >
                Plastic Surgery
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className={`hidden lg:flex items-center transition-all duration-300 ${isScrolled ? 'gap-6' : 'gap-8'}`}>
              {navItems.map((item) => (
                <div
                  key={item.key}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(item.key)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={`font-medium tracking-[0.02em] transition-all duration-300 hover:text-primary ${
                      isScrolled ? 'text-sm' : 'text-[15px]'
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
                          className="absolute top-full left-0 pt-4"
                        >
                          <div className="bg-white rounded-xl shadow-lg py-3 min-w-[180px]">
                            {item.children.map((child) => (
                              <Link
                                key={child.key}
                                href={child.href}
                                className="block px-5 py-3 text-sm text-mono hover:text-primary hover:bg-background transition-colors min-h-[44px] flex items-center"
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Side: CTA + Language Switcher */}
            <div className="flex items-center gap-4">
              {/* Consultation Button - Desktop */}
              <Link
                href="/contact"
                className={`hidden md:block btn-primary transition-all duration-300 ${
                  isScrolled ? 'text-xs py-2 px-4' : 'text-sm py-2.5 px-6'
                } ${
                  !useDarkStyle && 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
                }`}
              >
                {tCommon('consultation')}
              </Link>

              {/* Language Switcher */}
              <LanguageSwitcher isScrolled={useDarkStyle} />

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
