'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  key: string;
  label: string;
  href: string;
  children?: NavItem[];
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
}

const languages = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export default function MobileMenu({ isOpen, onClose, navItems }: MobileMenuProps) {
  const t = useTranslations('common');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleExpand = (key: string) => {
    setExpandedItems((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const handleLanguageChange = (langCode: string) => {
    router.replace(pathname, { locale: langCode as 'ko' | 'en' | 'ja' | 'zh' });
    onClose();
  };

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
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 w-[300px] bg-white z-50 lg:hidden overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <span className="font-serif text-xl text-secondary">LIV</span>
              <button
                onClick={onClose}
                className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-mono hover:text-primary transition-colors"
                aria-label="Close menu"
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

            {/* Navigation */}
            <nav className="p-5">
              {navItems.map((item) => (
                <div key={item.key} className="border-b border-border last:border-0">
                  {item.children ? (
                    <>
                      <button
                        onClick={() => toggleExpand(item.key)}
                        className="w-full flex items-center justify-between py-4 text-mono hover:text-primary transition-colors"
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
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pb-4 pl-4 space-y-1">
                              {item.children.map((child) => (
                                <Link
                                  key={child.key}
                                  href={child.href}
                                  onClick={onClose}
                                  className="block py-2 text-sm text-mono-light hover:text-primary transition-colors"
                                >
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="block py-4 font-medium text-mono hover:text-primary transition-colors"
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
              <p className="text-sm text-mono-light mb-3">Language</p>
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
            <div className="px-5 py-4 border-t border-border">
              <a
                href="tel:02-797-2773"
                className="flex items-center gap-3 text-mono hover:text-primary transition-colors"
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
