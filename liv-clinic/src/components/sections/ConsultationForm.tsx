'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { consultationFormSchema, type ConsultationFormData } from '@/types/consultation';
import { AnimateOnScroll } from '@/components/ui';

// 진료과목 옵션 키 (번역 파일의 treatmentOptions와 매핑)
const TREATMENT_OPTION_KEYS = ['laser', 'filler', 'botox', 'skincare', 'lifting', 'antiaging', 'other'] as const;

export default function ConsultationForm() {
  const t = useTranslations('contact.form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationFormSchema),
    defaultValues: {
      name: '',
      password: '',
      phone: '',
      treatment: '',
      agreePrivacy: false,
    },
  });

  // 전화번호 자동 하이픈 추가
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const onSubmit = async (data: ConsultationFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('submitError'));
      }

      setSubmitStatus('success');
      reset();

      // 3초 후 성공 메시지 숨김
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Consultation submission error:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : t('submitError'));

      // 5초 후 에러 메시지 숨김
      setTimeout(() => {
        setSubmitStatus('idle');
        setErrorMessage('');
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-secondary/5 to-primary/5 py-12 border-t border-border">
      <div className="container-custom">
        <AnimateOnScroll animation="fadeInUpSmooth">
          <div className="text-center mb-8">
            <h2 className="text-h2 text-secondary mb-2">{t('consultTitle')}</h2>
            <p className="text-body text-mono-light">
              {t('consultSubtitle')}
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll animation="fadeInUpSmooth" delay={0.1}>
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto">
            {/* Desktop: 가로 배치, Mobile: 세로 스택 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* 성함 */}
              <div className="lg:col-span-1">
                <input
                  {...register('name')}
                  type="text"
                  placeholder={t('namePlaceholder')}
                  aria-label={t('namePlaceholder')}
                  className={`w-full px-4 py-3.5 rounded-xl border ${
                    errors.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-border focus:ring-primary'
                  } focus:outline-none focus:ring-2 transition-all bg-white text-mono placeholder:text-mono-light`}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.name.message}</p>
                )}
              </div>

              {/* 비밀번호 (선택) */}
              <div className="lg:col-span-1">
                <input
                  {...register('password')}
                  type="password"
                  placeholder={t('password')}
                  aria-label={t('password')}
                  className={`w-full px-4 py-3.5 rounded-xl border ${
                    errors.password
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-border focus:ring-primary'
                  } focus:outline-none focus:ring-2 transition-all bg-white text-mono placeholder:text-mono-light`}
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.password.message}</p>
                )}
              </div>

              {/* 연락처 */}
              <div className="lg:col-span-1">
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder={t('phonePlaceholder')}
                  aria-label={t('phonePlaceholder')}
                  maxLength={13}
                  onChange={(e) => {
                    e.target.value = formatPhoneNumber(e.target.value);
                  }}
                  className={`w-full px-4 py-3.5 rounded-xl border ${
                    errors.phone
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-border focus:ring-primary'
                  } focus:outline-none focus:ring-2 transition-all bg-white text-mono placeholder:text-mono-light`}
                  disabled={isSubmitting}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.phone.message}</p>
                )}
              </div>

              {/* 진료과목 */}
              <div className="lg:col-span-1">
                <select
                  {...register('treatment')}
                  aria-label={t('treatmentSelect')}
                  className={`w-full px-4 py-3.5 rounded-xl border ${
                    errors.treatment
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-border focus:ring-primary'
                  } focus:outline-none focus:ring-2 transition-all bg-white text-mono appearance-none cursor-pointer`}
                  disabled={isSubmitting}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem',
                  }}
                >
                  <option value="">{t('treatmentSelect')}</option>
                  {TREATMENT_OPTION_KEYS.map((key) => (
                    <option key={key} value={t(`treatmentOptions.${key}`)}>
                      {t(`treatmentOptions.${key}`)}
                    </option>
                  ))}
                </select>
                {errors.treatment && (
                  <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.treatment.message}</p>
                )}
              </div>

              {/* 제출 버튼 */}
              <div className="lg:col-span-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-full px-6 py-3.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[52px]"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>{t('submitting')}</span>
                    </>
                  ) : (
                    <span>{t('submitButton')}</span>
                  )}
                </button>
              </div>
            </div>

            {/* 개인정보 동의 - 터치 영역 확대 */}
            <div className="flex items-start gap-3 max-w-3xl mx-auto">
              <div className="relative flex items-center justify-center w-6 h-6 mt-0.5">
                <input
                  {...register('agreePrivacy')}
                  type="checkbox"
                  id="agreePrivacy"
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                  disabled={isSubmitting}
                />
              </div>
              <label htmlFor="agreePrivacy" className="text-sm text-mono-light cursor-pointer flex-1 min-h-[44px] flex items-center">
                <span><span className="text-secondary font-medium">{t('required')}</span> {t('privacyConsent')}</span>
              </label>
            </div>
            {errors.agreePrivacy && (
              <p className="text-xs text-red-500 mt-1.5 text-center">
                {errors.agreePrivacy.message}
              </p>
            )}
          </form>
        </AnimateOnScroll>

        {/* 토스트 메시지 */}
        <AnimatePresence>
          {submitStatus !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
            >
              <div
                className={`rounded-xl shadow-2xl p-4 flex items-center gap-3 ${
                  submitStatus === 'success'
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {submitStatus === 'success' ? (
                  <>
                    <svg
                      className="w-6 h-6 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="font-medium">{t('successTitle')}</p>
                      <p className="text-sm opacity-90">{t('successSubtitle')}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-6 h-6 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="font-medium">{t('submitError')}</p>
                      <p className="text-sm opacity-90">{errorMessage || t('errorSubtitle')}</p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
