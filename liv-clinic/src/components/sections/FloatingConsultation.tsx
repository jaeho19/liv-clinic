'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { consultationFormSchema, TREATMENT_OPTIONS, type ConsultationFormData } from '@/types/consultation';

export default function FloatingConsultation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // setTimeout 타이머 추적을 위한 ref (메모리 누수 방지)
  const successTimerRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
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
        throw new Error(result.error || '상담 신청에 실패했습니다');
      }

      setSubmitStatus('success');
      reset();

      // 3초 후 폼 닫기 및 메시지 숨김 (기존 타이머 정리 후 새로 설정)
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        setSubmitStatus('idle');
        setIsOpen(false);
      }, 3000);
    } catch (error) {
      console.error('Consultation submission error:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '상담 신청에 실패했습니다');

      // 5초 후 에러 메시지 숨김 (기존 타이머 정리 후 새로 설정)
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => {
        setSubmitStatus('idle');
        setErrorMessage('');
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 고정 하단 바 */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-primary shadow-2xl"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
      >
        <div className="container-custom">
          <AnimatePresence mode="wait">
            {!isOpen ? (
              // 접힌 상태: 버튼만 표시
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="py-4"
              >
                <button
                  onClick={() => setIsOpen(true)}
                  className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                    <div className="text-left">
                      <p className="font-semibold text-lg">빠른 상담 신청</p>
                      <p className="text-sm text-white/80">
                        전문 상담사가 친절하게 안내해 드립니다
                      </p>
                    </div>
                  </div>
                  <svg
                    className="w-6 h-6 group-hover:translate-y-[-2px] transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
              </motion.div>
            ) : (
              // 펼쳐진 상태: 폼 표시
              <motion.div
                key="expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="py-6 max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-h3 text-secondary font-semibold">상담 신청</h3>
                    <p className="text-sm text-mono-light mt-1">
                      전문 상담사가 친절하게 안내해 드립니다
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="닫기"
                  >
                    <svg
                      className="w-6 h-6 text-mono"
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
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                  {/* 입력 필드 - 데스크톱: 가로, 모바일: 세로 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                    {/* 성함 */}
                    <div className="lg:col-span-1">
                      <input
                        {...register('name')}
                        type="text"
                        placeholder="성함"
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.name
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-border focus:ring-primary'
                        } focus:outline-none focus:ring-2 transition-all bg-white text-mono placeholder:text-mono-light`}
                        disabled={isSubmitting}
                      />
                      {errors.name && (
                        <p className="text-xs text-red-500 mt-1 ml-1">{errors.name.message}</p>
                      )}
                    </div>

                    {/* 비밀번호 (선택) */}
                    <div className="lg:col-span-1">
                      <input
                        {...register('password')}
                        type="password"
                        placeholder="비밀번호 (선택)"
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.password
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-border focus:ring-primary'
                        } focus:outline-none focus:ring-2 transition-all bg-white text-mono placeholder:text-mono-light`}
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* 연락처 */}
                    <div className="lg:col-span-1">
                      <input
                        {...register('phone')}
                        type="tel"
                        placeholder="010-0000-0000"
                        maxLength={13}
                        onChange={(e) => {
                          e.target.value = formatPhoneNumber(e.target.value);
                        }}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.phone
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-border focus:ring-primary'
                        } focus:outline-none focus:ring-2 transition-all bg-white text-mono placeholder:text-mono-light`}
                        disabled={isSubmitting}
                      />
                      {errors.phone && (
                        <p className="text-xs text-red-500 mt-1 ml-1">{errors.phone.message}</p>
                      )}
                    </div>

                    {/* 진료과목 */}
                    <div className="lg:col-span-1">
                      <select
                        {...register('treatment')}
                        className={`w-full px-4 py-3 rounded-lg border ${
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
                        <option value="">진료과목 선택</option>
                        {TREATMENT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {errors.treatment && (
                        <p className="text-xs text-red-500 mt-1 ml-1">
                          {errors.treatment.message}
                        </p>
                      )}
                    </div>

                    {/* 제출 버튼 */}
                    <div className="lg:col-span-1">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-full px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
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
                            <span>전송 중...</span>
                          </>
                        ) : (
                          <span>상담신청</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 개인정보 동의 */}
                  <div className="flex items-start gap-3">
                    <input
                      {...register('agreePrivacy')}
                      type="checkbox"
                      id="agreePrivacy"
                      className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="agreePrivacy"
                      className="text-sm text-mono-light cursor-pointer flex-1"
                    >
                      <span className="text-secondary font-medium">[필수]</span> 개인정보 수집 및
                      이용에 동의합니다. (성함, 연락처는 상담 목적으로만 사용됩니다)
                    </label>
                  </div>
                  {errors.agreePrivacy && (
                    <p className="text-xs text-red-500 mt-1.5 ml-7">
                      {errors.agreePrivacy.message}
                    </p>
                  )}
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 토스트 메시지 */}
      <AnimatePresence>
        {submitStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
          >
            <div
              className={`rounded-xl shadow-2xl p-4 flex items-center gap-3 ${
                submitStatus === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
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
                    <p className="font-medium">상담신청이 완료되었습니다</p>
                    <p className="text-sm opacity-90">곧 연락드리겠습니다</p>
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
                    <p className="font-medium">상담신청에 실패했습니다</p>
                    <p className="text-sm opacity-90">{errorMessage || '다시 시도해주세요'}</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
