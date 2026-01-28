'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { AnimateOnScroll, Button, Card, NaverMap } from '@/components/ui';
import { FAQ } from '@/components/sections';
import { SITE_INFO, BUSINESS_HOURS, SOCIAL_LINKS } from '@/lib/constants';

export default function ContactPage() {
  const t = useTranslations();
  const tContact = useTranslations('contact');
  const tFooter = useTranslations('footer');
  const tNav = useTranslations('nav');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const consultationSchema = z.object({
    name: z.string().min(2, tContact('form.nameError')),
    phone: z.string().min(10, tContact('form.phoneError')),
    email: z.string().email(tContact('form.emailError')).optional().or(z.literal('')),
    treatment: z.string().min(1, tContact('form.treatmentError')),
    preferredDate: z.string().optional(),
    preferredTime: z.string().optional(),
    message: z.string().optional(),
    privacy: z.boolean().refine(val => val === true, tContact('form.privacyError')),
  });

  type ConsultationForm = z.infer<typeof consultationSchema>;

  const treatmentOptions = [
    { value: '', label: tContact('form.treatmentPlaceholder') },
    { value: 'lifting-ulthera', label: tNav('ulthera') },
    { value: 'lifting-thermage', label: tNav('thermage') },
    { value: 'lifting-density', label: tNav('density') },
    { value: 'lifting-inmode', label: tNav('inmode') },
    { value: 'lifting-shurink', label: tNav('shurink') },
    { value: 'lifting-thread', label: tNav('thread') },
    { value: 'antiaging-botox', label: tNav('botox') },
    { value: 'antiaging-filler', label: tNav('filler') },
    { value: 'antiaging-skinbooster', label: tNav('skinbooster') },
    { value: 'laser', label: tNav('laser') },
    { value: 'other', label: tContact('form.other') },
  ];

  const timeOptions = [
    { value: '', label: tContact('form.timePlaceholder') },
    { value: '10:00', label: '10:00' },
    { value: '11:00', label: '11:00' },
    { value: '12:00', label: '12:00' },
    { value: '14:00', label: '14:00' },
    { value: '15:00', label: '15:00' },
    { value: '16:00', label: '16:00' },
    { value: '17:00', label: '17:00' },
    { value: '18:00', label: '18:00' },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ConsultationForm>({
    resolver: zodResolver(consultationSchema),
  });

  const onSubmit = async (data: ConsultationForm) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          email: data.email || '',
          treatment: data.treatment,
          preferredDate: data.preferredDate || '',
          preferredTime: data.preferredTime || '',
          message: data.message || '',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '상담 신청에 실패했습니다.');
      }

      setIsSubmitted(true);
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(error instanceof Error ? error.message : '상담 신청에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl">
              <p className="font-serif text-h3 text-primary mb-4">Contact</p>
              <h1 className="text-display text-secondary mb-6">{tContact('title')}</h1>
              <p className="text-h4 text-mono leading-relaxed whitespace-pre-line">
                {tContact('subtitle')}
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimateOnScroll>
              <a href={`tel:${SITE_INFO.phone}`} className="block">
                <Card padding="lg" className="text-center hover:border-primary transition-colors cursor-pointer h-full">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h3 className="text-h4 text-secondary mb-2">{tContact('phone')}</h3>
                  <p className="text-h3 text-primary">{SITE_INFO.phone}</p>
                  <p className="text-small text-mono-light mt-2">{tContact('weekdayHours')}</p>
                </Card>
              </a>
            </AnimateOnScroll>

            <AnimateOnScroll>
              <a href={SOCIAL_LINKS.kakao} target="_blank" rel="noopener noreferrer" className="block">
                <Card padding="lg" className="text-center hover:border-primary transition-colors cursor-pointer h-full">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#FEE500] flex items-center justify-center">
                    <svg className="w-7 h-7 text-[#3C1E1E]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.652 1.783 4.985 4.47 6.347-.145.53-.529 1.925-.606 2.226-.095.373.137.368.287.268.118-.079 1.878-1.238 2.645-1.745.387.055.783.084 1.204.084 5.523 0 10-3.463 10-7.691C20 6.463 17.523 3 12 3z" />
                    </svg>
                  </div>
                  <h3 className="text-h4 text-secondary mb-2">{tContact('kakao')}</h3>
                  <p className="text-body text-mono">{tContact('kakaoDesc')}</p>
                  <p className="text-small text-mono-light mt-2">{tContact('always')}</p>
                </Card>
              </a>
            </AnimateOnScroll>

            <AnimateOnScroll>
              <Card padding="lg" className="text-center h-full">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-h4 text-secondary mb-2">{tContact('visit')}</h3>
                <p className="text-body text-mono">{tContact('walkTime')}</p>
                <p className="text-small text-mono-light mt-2">{tContact('floor')}</p>
              </Card>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Consultation Form */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Form */}
            <AnimateOnScroll animation="fadeInLeft">
              <div>
                <h2 className="text-h2 text-secondary mb-8">{tContact('onlineReservation')}</h2>

                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-8 text-center"
                  >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-h3 text-secondary mb-4">{tContact('form.successTitle')}</h3>
                    <p className="text-body text-mono mb-6 whitespace-pre-line">
                      {tContact('form.successMessage')}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsSubmitted(false)}
                    >
                      {tContact('form.retry')}
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Name */}
                    <div>
                      <label className="block text-body text-secondary mb-2">
                        {tContact('form.name')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('name')}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-500' : 'border-border'} focus:border-primary focus:outline-none transition-colors`}
                        placeholder={tContact('form.namePlaceholder')}
                      />
                      {errors.name && (
                        <p className="text-small text-red-500 mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-body text-secondary mb-2">
                        {tContact('form.phone')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        {...register('phone')}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? 'border-red-500' : 'border-border'} focus:border-primary focus:outline-none transition-colors`}
                        placeholder={tContact('form.phonePlaceholder')}
                      />
                      {errors.phone && (
                        <p className="text-small text-red-500 mt-1">{errors.phone.message}</p>
                      )}
                    </div>

                    {/* Email (optional) */}
                    <div>
                      <label className="block text-body text-secondary mb-2">{tContact('form.email')}</label>
                      <input
                        type="email"
                        {...register('email')}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-border'} focus:border-primary focus:outline-none transition-colors`}
                        placeholder={tContact('form.emailPlaceholder')}
                      />
                      {errors.email && (
                        <p className="text-small text-red-500 mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Treatment */}
                    <div>
                      <label className="block text-body text-secondary mb-2">
                        {tContact('form.treatment')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('treatment')}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.treatment ? 'border-red-500' : 'border-border'} focus:border-primary focus:outline-none transition-colors bg-white`}
                      >
                        {treatmentOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.treatment && (
                        <p className="text-small text-red-500 mt-1">{errors.treatment.message}</p>
                      )}
                    </div>

                    {/* Preferred Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-body text-secondary mb-2">{tContact('form.preferredDate')}</label>
                        <input
                          type="date"
                          {...register('preferredDate')}
                          className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-body text-secondary mb-2">{tContact('form.preferredTime')}</label>
                        <select
                          {...register('preferredTime')}
                          className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:outline-none transition-colors bg-white"
                        >
                          {timeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-body text-secondary mb-2">{tContact('form.message')}</label>
                      <textarea
                        {...register('message')}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:outline-none transition-colors resize-none"
                        placeholder={tContact('form.messagePlaceholder')}
                      />
                    </div>

                    {/* Privacy Agreement */}
                    <div>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('privacy')}
                          className="mt-1 w-5 h-5 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-small text-mono">
                          {tContact('form.privacy')} <span className="text-red-500">*</span>
                        </span>
                      </label>
                      {errors.privacy && (
                        <p className="text-small text-red-500 mt-1">{errors.privacy.message}</p>
                      )}
                    </div>

                    {/* Error Message */}
                    {submitError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-red-600 text-small">{submitError}</p>
                      </div>
                    )}

                    {/* Submit */}
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? tContact('form.submitting') : tContact('form.submit')}
                    </Button>
                  </form>
                )}
              </div>
            </AnimateOnScroll>

            {/* Info */}
            <AnimateOnScroll animation="fadeInRight">
              <div className="space-y-6">
                {/* Business Hours */}
                <Card padding="lg" hover={false}>
                  <h3 className="text-h4 text-secondary mb-6 flex items-center gap-3">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {tFooter('businessHours')}
                  </h3>
                  <div className="space-y-3 text-body">
                    <div className="flex justify-between">
                      <span className="text-mono-light">{tFooter('weekday')}</span>
                      <span className="text-mono">{BUSINESS_HOURS.weekday.open} - {BUSINESS_HOURS.weekday.close}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mono-light">{tFooter('saturday')}</span>
                      <span className="text-mono">{BUSINESS_HOURS.saturday.open} - {BUSINESS_HOURS.saturday.close}</span>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <span className="text-primary font-medium">{tFooter('sunday')}</span>
                    </div>
                  </div>
                </Card>

                {/* Address */}
                <Card padding="lg" hover={false}>
                  <h3 className="text-h4 text-secondary mb-6 flex items-center gap-3">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {tContact('directions')}
                  </h3>
                  <p className="text-body text-mono mb-2">{SITE_INFO.address.ko}</p>
                  <p className="text-small text-mono-light mb-4">{tContact('floor')}</p>
                  <p className="text-body text-primary font-medium">{tContact('walkTime')}</p>

                  <div className="flex gap-3 mt-6">
                    <a
                      href={`https://map.naver.com/v5/search/${encodeURIComponent(SITE_INFO.address.ko)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        {tContact('naverMap')}
                      </Button>
                    </a>
                    <a
                      href={`https://map.kakao.com/link/search/${encodeURIComponent(SITE_INFO.address.ko)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        {tContact('kakaoMap')}
                      </Button>
                    </a>
                  </div>
                </Card>

                {/* Parking */}
                <Card padding="lg" hover={false}>
                  <h3 className="text-h4 text-secondary mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    {tContact('parking')}
                  </h3>
                  <p className="text-body text-mono">{tContact('parkingInfo')}</p>
                  <p className="text-small text-primary font-medium mt-2">{tContact('freeParking')}</p>
                </Card>

                {/* Notice */}
                <div className="bg-primary/10 rounded-2xl p-6">
                  <h4 className="text-body text-secondary font-medium mb-3">{tContact('reservationNotice')}</h4>
                  <ul className="space-y-2 text-small text-mono">
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {tContact('notice1')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {tContact('notice2')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {tContact('notice3')}
                    </li>
                  </ul>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ />

      {/* Naver Map */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <h2 className="text-h2 text-secondary mb-8 text-center">{tContact('location')}</h2>
            <div className="relative h-[450px] rounded-3xl overflow-hidden bg-mono-light/20 shadow-lg">
              <NaverMap
                lat={SITE_INFO.coordinates.lat}
                lng={SITE_INFO.coordinates.lng}
                zoom={17}
                className="absolute inset-0"
                markerTitle="리브성형외과"
              />
            </div>

            {/* Map Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <a
                href="https://map.naver.com/v5/entry/place/1100410987"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
                  </svg>
                  {tContact('naverMap')}
                </Button>
              </a>
              <a
                href={`https://map.kakao.com/link/search/${encodeURIComponent(SITE_INFO.address.ko)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3c-5.514 0-10 3.476-10 7.75 0 2.783 1.896 5.223 4.748 6.587-.164.609-.533 2.209-.61 2.552-.096.424.157.418.33.303.136-.09 2.168-1.472 3.05-2.07.791.115 1.614.175 2.482.175 5.514 0 10-3.476 10-7.75S17.514 3 12 3z" />
                  </svg>
                  {tContact('kakaoMap')}
                </Button>
              </a>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  );
}
