'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, StaggerChildren, StaggerItem, Card } from '@/components/ui';
import { openLivChat, CHAT_VISITOR_LOCALES } from '@/lib/chat/chatApi';
import { trackPromoClick } from '@/lib/analytics-events';
import { primaryMessengerFor, buildWhatsAppLink, LINE_LINK } from '@/lib/messengerLinks';

type Item = { title: string; desc: string };
type Channel = { lang: string; value: string };
type Route = { from: string; detail: string };
type Row = { treatment: string; stay: string };

export default function InternationalPage() {
  const t = useTranslations('international');
  const tMsg = useTranslations('messengers');
  const tCta = useTranslations('stickyCta');
  const tChat = useTranslations('chat');
  const locale = useLocale();

  const whyItems = t.raw('why.items') as Item[];
  const channels = t.raw('communication.channels') as Channel[];
  const steps = t.raw('booking.steps') as Item[];
  const routes = t.raw('gettingHere.routes') as Route[];
  const rows = t.raw('stay.rows') as Row[];

  // 로케일별 CTA: 라이브챗(6개 방문자 로케일) + 1순위 메신저 + 상담 예약(/contact)
  const chatEnabled = (CHAT_VISITOR_LOCALES as readonly string[]).includes(locale);
  const messenger = primaryMessengerFor(locale);
  const messengerHref =
    messenger === 'line'
      ? LINE_LINK
      : messenger === 'wechat'
        ? `/${locale}/wechat` // 데스크톱에서도 죽지 않도록 QR 페이지로
        : buildWhatsAppLink(tMsg('whatsappPrefill'));
  const messengerLabel =
    messenger === 'line' ? tCta('line') : messenger === 'wechat' ? tCta('wechat') : tCta('whatsapp');
  const messengerExternal = messenger === 'line' || messenger === 'whatsapp';

  const ctaButtons = (chatLabel: string, contactLabel: string) => (
    <div className="flex flex-col sm:flex-row gap-3">
      {chatEnabled && (
        <button
          type="button"
          onClick={() => {
            trackPromoClick('chat_direct_booking', 'international_landing_click');
            openLivChat();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-white px-7 py-3.5 font-medium hover:bg-secondary transition-colors min-h-[48px]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {chatLabel}
        </button>
      )}
      <a
        href={messengerHref}
        target={messengerExternal ? '_blank' : undefined}
        rel={messengerExternal ? 'noopener noreferrer' : undefined}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-primary text-primary px-7 py-3.5 font-medium hover:bg-primary hover:text-white transition-colors min-h-[48px]"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.8 5.27 4.5 6.7-.2.74-.72 2.68-.82 3.1-.13.5.18.49.38.36.16-.1 2.52-1.71 3.54-2.4.78.12 1.58.18 2.4.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
        </svg>
        {messengerLabel}
      </a>
      <Link
        href="/contact"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary text-white px-7 py-3.5 font-medium hover:bg-primary transition-colors min-h-[48px]"
      >
        {contactLabel}
      </Link>
    </div>
  );

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl">
              <p className="font-serif text-h3 text-primary mb-4">{t('hero.badge')}</p>
              <h1 className="text-display text-secondary mb-4">{t('hero.title')}</h1>
              <p className="text-h4 text-primary mb-6">{t('hero.langLine')}</p>
              <p className="text-h4 text-mono leading-relaxed mb-8">{t('hero.subtitle')}</p>
              {/* 라이브챗 CTA 옆 혜택 병기 — 채팅 지원 로케일 전용 */}
              {chatEnabled && (
                <p className="text-body font-medium text-secondary mb-4">{tChat('promoTitle')}</p>
              )}
              {ctaButtons(t('hero.ctaChat'), t('hero.ctaContact'))}
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Why LIV */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-primary mb-2">{t('why.subtitle')}</p>
              <h2 className="text-h1 text-secondary">{t('why.title')}</h2>
            </div>
          </AnimateOnScroll>

          <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whyItems.map((item, i) => (
              <StaggerItem key={i}>
                <Card padding="lg" className="h-full">
                  <h3 className="text-h4 text-secondary mb-3">{item.title}</h3>
                  <p className="text-body text-mono leading-relaxed">{item.desc}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Communication */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimateOnScroll animation="fadeInLeft">
              <div>
                <p className="font-serif text-h3 text-primary mb-2">{t('communication.subtitle')}</p>
                <h2 className="text-h1 text-secondary mb-6">{t('communication.title')}</h2>
                <p className="text-body text-mono leading-relaxed mb-4">{t('communication.desc')}</p>
                <p className="text-small text-mono-light">{t('communication.note')}</p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll animation="fadeInRight">
              <div className="space-y-4">
                {channels.map((ch, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 bg-white rounded-2xl border border-border px-6 py-5"
                  >
                    <span className="text-h4 text-secondary">{ch.lang}</span>
                    <span className="text-body text-mono text-right">{ch.value}</span>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Booking process */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-6">
              <p className="font-serif text-h3 text-primary mb-2">{t('booking.subtitle')}</p>
              <h2 className="text-h1 text-secondary mb-4">{t('booking.title')}</h2>
              <p className="text-body text-mono max-w-2xl mx-auto leading-relaxed">{t('booking.desc')}</p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <div className="flex justify-center mb-12">
              <span className="inline-block rounded-full bg-primary/10 text-primary px-5 py-2 text-small font-medium">
                {t('booking.duration')}
              </span>
            </div>
          </AnimateOnScroll>

          <StaggerChildren className="max-w-3xl mx-auto space-y-4">
            {steps.map((step, i) => (
              <StaggerItem key={i}>
                <div className="flex gap-5 bg-background rounded-2xl p-6">
                  <div className="shrink-0 w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-serif text-h4">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-h4 text-secondary mb-1">{step.title}</h3>
                    <p className="text-body text-mono leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Getting here */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl mb-10">
              <p className="font-serif text-h3 text-primary mb-2">{t('gettingHere.subtitle')}</p>
              <h2 className="text-h1 text-secondary mb-6">{t('gettingHere.title')}</h2>
              <p className="text-h4 text-secondary">{t('gettingHere.address')}</p>
              <p className="text-body text-mono-light mt-2">{t('gettingHere.addressNote')}</p>
            </div>
          </AnimateOnScroll>

          <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {routes.map((route, i) => (
              <StaggerItem key={i}>
                <Card padding="lg" className="h-full">
                  <h3 className="text-h4 text-primary mb-2">{route.from}</h3>
                  <p className="text-body text-mono leading-relaxed">{route.detail}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Stay duration */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <p className="font-serif text-h3 text-primary mb-2">{t('stay.subtitle')}</p>
              <h2 className="text-h1 text-secondary mb-4">{t('stay.title')}</h2>
              <p className="text-body text-mono max-w-2xl mx-auto leading-relaxed">{t('stay.desc')}</p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <div className="max-w-3xl mx-auto overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-secondary text-white">
                    <th className="px-6 py-4 text-body font-medium">{t('stay.colTreatment')}</th>
                    <th className="px-6 py-4 text-body font-medium">{t('stay.colStay')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-background'}>
                      <td className="px-6 py-4 text-body text-secondary font-medium">{row.treatment}</td>
                      <td className="px-6 py-4 text-body text-mono">{row.stay}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnimateOnScroll>
          <p className="text-small text-mono-light text-center mt-4">{t('stay.note')}</p>
        </div>
      </section>

      {/* Aftercare + Payment */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimateOnScroll animation="fadeInLeft">
              <Card padding="lg" className="h-full">
                <p className="font-serif text-h4 text-primary mb-2">{t('aftercare.subtitle')}</p>
                <h3 className="text-h3 text-secondary mb-4">{t('aftercare.title')}</h3>
                <p className="text-body text-mono leading-relaxed">{t('aftercare.desc')}</p>
              </Card>
            </AnimateOnScroll>
            <AnimateOnScroll animation="fadeInRight">
              <Card padding="lg" className="h-full">
                <p className="font-serif text-h4 text-primary mb-2">{t('payment.subtitle')}</p>
                <h3 className="text-h3 text-secondary mb-4">{t('payment.title')}</h3>
                <p className="text-body text-mono leading-relaxed mb-4">{t('payment.desc')}</p>
                <p className="text-body text-secondary font-medium">{t('payment.methods')}</p>
              </Card>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* FAQ teaser */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-h2 text-secondary mb-3">{t('faq.title')}</h2>
              <p className="text-body text-mono mb-6">{t('faq.desc')}</p>
              <Link
                href="/medical"
                className="inline-flex items-center gap-2 text-primary font-medium hover:text-secondary transition-colors"
              >
                {t('faq.cta')}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-24 bg-secondary text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-h1 mb-4">{t('closing.title')}</h2>
              <p className="text-h4 opacity-80 mb-8">{t('closing.desc')}</p>
              {/* 라이브챗 CTA 옆 혜택 병기 — 채팅 지원 로케일 전용 */}
              {chatEnabled && (
                <p className="text-body font-medium mb-6">{tChat('promoTitle')}</p>
              )}
              <div className="flex justify-center">
                {ctaButtons(t('closing.ctaChat'), t('closing.ctaContact'))}
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  );
}
