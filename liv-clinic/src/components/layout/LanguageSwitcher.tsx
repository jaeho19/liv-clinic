'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter, type Locale } from '@/i18n/routing';
import { LOCALE_META, LOCALE_ORDER } from '@/i18n/locales-meta';
import { motion, AnimatePresence } from 'framer-motion';

interface LanguageSwitcherProps {
  isScrolled?: boolean;
}

const languages = LOCALE_ORDER.map((code) => LOCALE_META[code]);

export default function LanguageSwitcher({ isScrolled = true }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const currentLanguage = languages.find((lang) => lang.code === locale) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    router.replace(pathname, { locale: langCode as Locale });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 md:gap-3 lg:gap-2 text-base md:text-lg lg:text-sm xl:text-[15px] font-medium transition-colors min-h-[48px] md:min-h-[52px] lg:min-h-[40px] px-3 md:px-4 lg:px-2 xl:px-2.5 ${
          isScrolled ? 'text-mono hover:text-primary' : 'text-white hover:text-white/80'
        }`}
      >
        <span className="text-xl md:text-2xl lg:text-base xl:text-lg leading-none">{currentLanguage.flag}</span>
        <span className="inline font-semibold tracking-wide">{currentLanguage.label}</span>
        <svg
          className={`w-5 h-5 md:w-6 md:h-6 lg:w-4 lg:h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full end-0 mt-2 z-50"
            >
              <div className="bg-white rounded-xl shadow-lg py-2 min-w-[140px]">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-base transition-colors hover:bg-background min-h-[48px] ${
                      lang.code === locale ? 'text-primary font-medium' : 'text-mono'
                    }`}
                  >
                    <span className="text-xl leading-none">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
