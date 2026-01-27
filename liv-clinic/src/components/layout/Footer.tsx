'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { SITE_INFO, BUSINESS_HOURS, SOCIAL_LINKS } from '@/lib/constants';

export default function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');

  return (
    <footer className="bg-secondary text-white pb-20 sm:pb-16">
      {/* Main Footer */}
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block mb-6">
              <span className="font-serif text-3xl tracking-wider">LIV</span>
              <p className="text-sm text-white/60 mt-1">Plastic Surgery</p>
            </Link>
            <p className="text-sm text-white/70 leading-relaxed">
              {tCommon('slogan')}
              <br />
              {t('slogan')}
            </p>
          </div>

          {/* Business Hours */}
          <div>
            <h4 className="text-lg font-medium mb-5">{t('businessHours')}</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex justify-between">
                <span>{t('weekday')}</span>
                <span>
                  {BUSINESS_HOURS.weekday.open} - {BUSINESS_HOURS.weekday.close}
                </span>
              </li>
              <li className="flex justify-between">
                <span>{t('saturday')}</span>
                <span>
                  {BUSINESS_HOURS.saturday.open} - {BUSINESS_HOURS.saturday.close}
                </span>
              </li>
              <li className="text-primary">{t('sunday')}</li>
            </ul>
          </div>

          {/* Location */}
          <div>
            <h4 className="text-lg font-medium mb-5">{t('address')}</h4>
            <address className="not-italic text-sm text-white/70 space-y-2">
              <p>{SITE_INFO.address.ko}</p>
              <p className="text-white/50">{SITE_INFO.address.en}</p>
            </address>
            <div className="mt-4 space-y-2">
              <a
                href={`tel:${SITE_INFO.phone}`}
                className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors min-h-[44px] py-2"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>{SITE_INFO.phone}</span>
              </a>
              <a
                href={`mailto:${SITE_INFO.email}`}
                className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors min-h-[44px] py-2"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="break-all">{SITE_INFO.email}</span>
              </a>
            </div>
          </div>

          {/* Quick Links & SNS */}
          <div>
            <h4 className="text-lg font-medium mb-5">{t('quickLinks')}</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-white/70 hover:text-white transition-colors inline-flex items-center min-h-[44px] py-2"
                >
                  {tNav('about')}
                </Link>
              </li>
              <li>
                <Link
                  href="/lifting"
                  className="text-white/70 hover:text-white transition-colors inline-flex items-center min-h-[44px] py-2"
                >
                  {tNav('lifting')}
                </Link>
              </li>
              <li>
                <Link
                  href="/medical"
                  className="text-white/70 hover:text-white transition-colors inline-flex items-center min-h-[44px] py-2"
                >
                  {tNav('medical')}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-white/70 hover:text-white transition-colors inline-flex items-center min-h-[44px] py-2"
                >
                  {tNav('contact')}
                </Link>
              </li>
            </ul>

            {/* Social Links */}
            <div className="mt-6">
              <p className="text-sm text-white/50 mb-3">{t('followUs')}</p>
              <div className="flex gap-3">
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href={SOCIAL_LINKS.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label="YouTube"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
                <a
                  href={SOCIAL_LINKS.naver}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label="Naver Blog"
                >
                  <span className="text-sm font-bold">N</span>
                </a>
                <a
                  href={SOCIAL_LINKS.kakao}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label="KakaoTalk"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3c-5.514 0-10 3.476-10 7.75 0 2.783 1.896 5.223 4.748 6.587-.164.609-.533 2.209-.61 2.552-.096.424.157.418.33.303.136-.09 2.168-1.472 3.05-2.07.791.115 1.614.175 2.482.175 5.514 0 10-3.476 10-7.75S17.514 3 12 3z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-custom py-4 md:py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50">
            <p className="text-center md:text-left">{t('copyright')}</p>
            <div className="flex gap-4 sm:gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors min-h-[44px] flex items-center py-2">
                {t('privacy')}
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors min-h-[44px] flex items-center py-2">
                {t('terms')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
