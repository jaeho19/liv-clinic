'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

// 전화번호 포맷팅 함수
function formatPhoneNumber(value: string): string {
  const numbers = value.replace(/[^\d]/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
}

// 전화번호 유효성 검사
function isValidPhone(phone: string): boolean {
  const numbers = phone.replace(/[^\d]/g, '');
  return numbers.length >= 10 && numbers.length <= 11;
}

export default function QuickConsultBar() {
  const t = useTranslations();
  const [isMinimized, setIsMinimized] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; privacy?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
  };

  const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrivacyAgreed(e.target.checked);
    if (errors.privacy) setErrors((prev) => ({ ...prev, privacy: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; phone?: string; privacy?: string } = {};

    if (!name.trim()) {
      newErrors.name = t('contact.form.nameError');
    }

    if (!isValidPhone(phone)) {
      newErrors.phone = t('contact.form.phoneError');
    }

    if (!privacyAgreed) {
      newErrors.privacy = t('contact.form.privacyError');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/quick-consult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          agreePrivacy: privacyAgreed,
          source: typeof window !== 'undefined' ? window.location.pathname : 'quick-bar',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || '상담 신청에 실패했습니다.');
      }

      setShowSuccess(true);
      setName('');
      setPhone('');
      setPrivacyAgreed(false);

      // 5초 후 성공 메시지 숨기기
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '상담 신청에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsMinimized(true);
  };

  const handleReopen = () => {
    setIsMinimized(false);
  };

  // 항상 표시 (하단 고정)
  return (
    <>
      <AnimatePresence>
        {isMinimized ? (
          // 최소화된 상태 - 작은 버튼으로 표시
          <motion.button
            key="minimized"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            onClick={handleReopen}
            className="fixed bottom-20 left-4 z-50 bg-primary text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
            aria-label={t('contact.onlineReservation')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="hidden sm:inline">{t('common.consultation')}</span>
          </motion.button>
        ) : (
          // 펼쳐진 상태 - 전체 폼
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-pb"
          >
            <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3">
              <AnimatePresence mode="wait">
                {showSuccess ? (
                  // 성공 메시지
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-center gap-3 py-2"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-secondary">{t('contact.form.successTitle')}</p>
                      <p className="text-sm text-mono-light">{t('contact.notice1')}</p>
                    </div>
                  </motion.div>
                ) : (
                  // 폼
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                  >
                    {/* 에러 메시지 */}
                    {submitError && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm shadow-lg flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{submitError}</span>
                        <button type="button" onClick={() => setSubmitError(null)} className="ml-2 hover:text-red-800">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* 닫기 버튼 */}
                    <button
                      type="button"
                      onClick={handleClose}
                      className="absolute top-2 right-2 sm:static sm:order-last p-1.5 text-mono-light hover:text-secondary transition-colors"
                      aria-label="닫기"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* 타이틀 (데스크탑만) */}
                    <div className="hidden lg:flex items-center gap-2 text-secondary font-medium shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span>{t('contact.onlineReservation')}</span>
                    </div>

                    {/* 입력 필드들 */}
                    <div className="flex flex-col sm:flex-row flex-1 gap-2 sm:gap-3">
                      {/* 성함 */}
                      <div className="relative flex-1 min-w-0 sm:max-w-[160px]">
                        <input
                          type="text"
                          value={name}
                          onChange={handleNameChange}
                          placeholder={t('contact.form.namePlaceholder')}
                          className={`w-full h-11 px-3 rounded-lg border ${
                            errors.name ? 'border-red-400 bg-red-50' : 'border-border bg-white'
                          } text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors`}
                          aria-label={t('contact.form.name')}
                          aria-invalid={!!errors.name}
                        />
                        {errors.name && (
                          <span className="absolute -bottom-5 left-0 text-xs text-red-500" role="alert">{errors.name}</span>
                        )}
                      </div>

                      {/* 핸드폰 번호 */}
                      <div className="relative flex-1 min-w-0 sm:max-w-[200px]">
                        <input
                          type="tel"
                          value={phone}
                          onChange={handlePhoneChange}
                          placeholder={t('contact.form.phonePlaceholder')}
                          className={`w-full h-11 px-3 rounded-lg border ${
                            errors.phone ? 'border-red-400 bg-red-50' : 'border-border bg-white'
                          } text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors`}
                          aria-label={t('contact.form.phone')}
                          aria-invalid={!!errors.phone}
                          inputMode="tel"
                        />
                        {errors.phone && (
                          <span className="absolute -bottom-5 left-0 text-xs text-red-500" role="alert">{errors.phone}</span>
                        )}
                      </div>
                    </div>

                    {/* 개인정보 동의 + 제출 버튼 */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* 개인정보 동의 체크박스 */}
                      <label className="flex items-center gap-2 cursor-pointer group min-h-[44px]">
                        <div className="relative flex items-center justify-center w-6 h-6">
                          <input
                            type="checkbox"
                            checked={privacyAgreed}
                            onChange={handlePrivacyChange}
                            className="w-5 h-5 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
                            aria-invalid={!!errors.privacy}
                          />
                        </div>
                        <span
                          className={`text-xs ${errors.privacy ? 'text-red-500' : 'text-mono-light'} group-hover:text-mono transition-colors max-w-[120px] sm:max-w-none line-clamp-2 sm:line-clamp-1`}
                        >
                          개인정보 수집 동의
                        </span>
                      </label>

                      {/* 제출 버튼 */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-11 px-4 sm:px-6 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex items-center justify-center gap-2 min-w-[80px]"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                            <span>{t('contact.form.submitting')}</span>
                          </>
                        ) : (
                          <span>{t('contact.form.submit')}</span>
                        )}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
