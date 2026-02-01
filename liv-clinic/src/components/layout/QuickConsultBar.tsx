'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [isFormOpen, setIsFormOpen] = useState(false); // 모바일 바텀시트
  const [isMinimized, setIsMinimized] = useState(false); // 데스크톱 최소화
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; privacy?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const successTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // 타이머 정리
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // 모바일 폼 열릴 때 이름 입력란 자동 포커스
  useEffect(() => {
    if (isFormOpen) {
      const timer = setTimeout(() => nameInputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [isFormOpen]);

  // ESC 키로 바텀시트 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFormOpen) {
        setIsFormOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFormOpen]);

  // 바텀시트 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (isFormOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFormOpen]);

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
    if (!name.trim()) newErrors.name = t('contact.form.nameError');
    if (!isValidPhone(phone)) newErrors.phone = t('contact.form.phoneError');
    if (!privacyAgreed) newErrors.privacy = t('contact.form.privacyError');
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          agreePrivacy: privacyAgreed,
          source: typeof window !== 'undefined' ? window.location.pathname : 'quick-bar',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || t('contact.form.submitError'));
      }

      setShowSuccess(true);
      setName('');
      setPhone('');
      setPrivacyAgreed(false);

      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        setShowSuccess(false);
        setIsFormOpen(false);
      }, 5000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('contact.form.submitErrorRetry'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 공통 성공 메시지 UI
  const successMessage = (
    <div className="flex items-center justify-center gap-3 py-2">
      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="font-medium text-secondary">{t('contact.form.successTitle')}</p>
        <p className="text-sm text-mono-light">{t('contact.notice1')}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* ===== 모바일: 하단 CTA 버튼 바 (< md) ===== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
        <AnimatePresence mode="wait">
          {showSuccess && !isFormOpen ? (
            <motion.div
              key="mobile-success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white/95 backdrop-blur-md border-t border-border px-4 py-3"
            >
              {successMessage}
            </motion.div>
          ) : !isFormOpen ? (
            <motion.div
              key="mobile-collapsed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white/95 backdrop-blur-md border-t border-border px-4 py-2"
            >
              <button
                onClick={() => setIsFormOpen(true)}
                className="w-full h-12 bg-primary text-white rounded-lg font-medium text-base hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                aria-expanded={isFormOpen}
                aria-controls="mobile-consult-sheet"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {t('contact.form.submit')}
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* ===== 모바일: 바텀시트 폼 (< md) ===== */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            {/* 백드롭 오버레이 */}
            <motion.div
              className="md:hidden fixed inset-0 z-[55] bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
            />

            {/* 바텀시트 */}
            <motion.div
              id="mobile-consult-sheet"
              className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] safe-area-pb"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ maxHeight: '80dvh' }}
              role="dialog"
              aria-modal="true"
              aria-label={t('contact.onlineReservation')}
            >
              {/* 드래그 핸들 */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* 헤더 */}
              <div className="flex items-center justify-between px-5 pb-3 border-b border-border">
                <div>
                  <h3 className="text-lg font-semibold text-secondary">
                    {t('contact.form.consultTitle')}
                  </h3>
                  <p className="text-sm text-mono-light">
                    {t('contact.form.consultSubtitle')}
                  </p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 text-mono-light hover:text-secondary transition-colors rounded-full hover:bg-gray-100"
                  aria-label={t('common.close')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 폼 콘텐츠 */}
              <div className="px-5 pt-4 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(80dvh - 100px)' }}>
                <AnimatePresence mode="wait">
                  {showSuccess ? (
                    <motion.div
                      key="sheet-success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="py-8"
                    >
                      {successMessage}
                    </motion.div>
                  ) : (
                    <motion.form
                      key="sheet-form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit}
                      className="space-y-4"
                    >
                      {/* 제출 에러 */}
                      {submitError && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="flex-1">{submitError}</span>
                          <button type="button" onClick={() => setSubmitError(null)} className="hover:text-red-800">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* 성함 */}
                      <div>
                        <label htmlFor="mobile-consult-name" className="block text-sm font-medium text-secondary mb-1.5">
                          {t('contact.form.name')} <span className="text-red-400">*</span>
                        </label>
                        <input
                          ref={nameInputRef}
                          id="mobile-consult-name"
                          type="text"
                          value={name}
                          onChange={handleNameChange}
                          placeholder={t('contact.form.namePlaceholder')}
                          className={`w-full h-12 px-4 rounded-lg border ${
                            errors.name ? 'border-red-400 bg-red-50' : 'border-border bg-white'
                          } text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors`}
                          aria-invalid={!!errors.name}
                        />
                        {errors.name && (
                          <p className="mt-1 text-xs text-red-500" role="alert">{errors.name}</p>
                        )}
                      </div>

                      {/* 연락처 */}
                      <div>
                        <label htmlFor="mobile-consult-phone" className="block text-sm font-medium text-secondary mb-1.5">
                          {t('contact.form.phone')} <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="mobile-consult-phone"
                          type="tel"
                          value={phone}
                          onChange={handlePhoneChange}
                          placeholder={t('contact.form.phonePlaceholder')}
                          className={`w-full h-12 px-4 rounded-lg border ${
                            errors.phone ? 'border-red-400 bg-red-50' : 'border-border bg-white'
                          } text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors`}
                          aria-invalid={!!errors.phone}
                          inputMode="tel"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-xs text-red-500" role="alert">{errors.phone}</p>
                        )}
                      </div>

                      {/* 개인정보 동의 */}
                      <label className="flex items-start gap-3 cursor-pointer group py-2">
                        <div className="relative flex items-center justify-center w-6 h-6 mt-0.5">
                          <input
                            type="checkbox"
                            checked={privacyAgreed}
                            onChange={handlePrivacyChange}
                            className="w-5 h-5 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
                            aria-invalid={!!errors.privacy}
                          />
                        </div>
                        <span
                          className={`text-sm leading-relaxed ${
                            errors.privacy ? 'text-red-500' : 'text-mono-light'
                          } group-hover:text-mono transition-colors`}
                        >
                          {t('contact.form.required')} {t('contact.form.privacyConsent')}
                        </span>
                      </label>
                      {errors.privacy && (
                        <p className="text-xs text-red-500 -mt-2" role="alert">{errors.privacy}</p>
                      )}

                      {/* 제출 버튼 */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 bg-primary text-white rounded-lg font-medium text-base hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
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
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== 데스크톱: 인라인 폼 바 (>= md) ===== */}
      <AnimatePresence>
        {isMinimized ? (
          <motion.button
            key="desktop-minimized"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            onClick={() => setIsMinimized(false)}
            className="hidden md:flex fixed bottom-6 left-6 z-50 bg-primary text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors items-center gap-2 text-sm font-medium"
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
            <span>{t('common.consultation')}</span>
          </motion.button>
        ) : (
          <motion.div
            key="desktop-expanded"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="hidden md:block fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-pb"
          >
            <div className="max-w-6xl mx-auto px-4 py-3">
              <AnimatePresence mode="wait">
                {showSuccess ? (
                  <motion.div
                    key="desktop-success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    {successMessage}
                  </motion.div>
                ) : (
                  <motion.form
                    key="desktop-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="flex flex-row items-center gap-3"
                  >
                    {/* 에러 메시지 */}
                    {submitError && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-auto bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm shadow-lg flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-center">{submitError}</span>
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
                      onClick={() => setIsMinimized(true)}
                      className="order-last p-1.5 text-mono-light hover:text-secondary transition-colors"
                      aria-label={t('common.close')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* 타이틀 */}
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
                    <div className="flex flex-row flex-1 gap-3">
                      <div className="relative flex-1 min-w-0 max-w-[160px]">
                        <input
                          type="text"
                          value={name}
                          onChange={handleNameChange}
                          placeholder={t('contact.form.namePlaceholder')}
                          className={`w-full h-11 px-3 rounded-lg border ${
                            errors.name ? 'border-red-400 bg-red-50' : 'border-border bg-white'
                          } text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors`}
                          aria-label={t('contact.form.name')}
                          aria-invalid={!!errors.name}
                        />
                        {errors.name && (
                          <span className="absolute -bottom-5 left-0 text-xs text-red-500" role="alert">{errors.name}</span>
                        )}
                      </div>

                      <div className="relative flex-1 min-w-0 max-w-[200px]">
                        <input
                          type="tel"
                          value={phone}
                          onChange={handlePhoneChange}
                          placeholder={t('contact.form.phonePlaceholder')}
                          className={`w-full h-11 px-3 rounded-lg border ${
                            errors.phone ? 'border-red-400 bg-red-50' : 'border-border bg-white'
                          } text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors`}
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
                    <div className="flex items-center gap-4">
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
                          className={`text-xs ${errors.privacy ? 'text-red-500' : 'text-mono-light'} group-hover:text-mono transition-colors max-w-none line-clamp-1`}
                        >
                          {t('contact.form.privacyShort')}
                        </span>
                      </label>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-11 px-6 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex items-center justify-center gap-2 min-w-[80px]"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
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
