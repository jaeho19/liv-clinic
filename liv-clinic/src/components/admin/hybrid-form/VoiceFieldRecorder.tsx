'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { HybridFormField } from '@/types/smart-forms';

// Web Speech API 이벤트 타입 (모듈 스코프 — global 충돌 방지)
interface SpeechRecogEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecogErrorEvent extends Event {
  error: string;
  message: string;
}
type SpeechRecognitionInstance = InstanceType<NonNullable<typeof window.SpeechRecognition>>;

interface VoiceFieldRecorderProps {
  field: HybridFormField;
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  fieldIndex: number;
  totalFields: number;
  isLast: boolean;
  autoStart?: boolean;
}

export default function VoiceFieldRecorder({
  field,
  value,
  onChange,
  onNext,
  onPrev,
  onSkip,
  fieldIndex,
  totalFields,
  isLast,
  autoStart = false,
}: VoiceFieldRecorderProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionClass);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;
    setErrorMessage('');

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ko-KR';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecogEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setInterimText(interimTranscript);

      if (finalTranscript) {
        onChange(value ? value + ' ' + finalTranscript.trim() : finalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecogErrorEvent) => {
      if (event.error === 'not-allowed') {
        setErrorMessage('마이크 권한이 필요합니다. 브라우저 설정에서 허용해주세요.');
      } else if (event.error === 'no-speech') {
        setErrorMessage('음성이 감지되지 않았습니다. 다시 시도해주세요.');
      } else if (event.error !== 'aborted') {
        setErrorMessage('음성 인식에 실패했습니다. 다시 시도하거나 직접 입력해주세요.');
        console.error('Speech recognition error:', event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [value, onChange]);

  // 필드 변경 시 음성 중지
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, [field.key]);

  // 자동 시작
  useEffect(() => {
    if (autoStart && isSupported && !isListening) {
      const timer = setTimeout(startListening, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, isSupported]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = () => {
    stopListening();
    onNext();
  };

  const handlePrev = () => {
    stopListening();
    onPrev();
  };

  return (
    <div className="bg-[#faf8f7] rounded-xl border border-[#ebe7e4]/60 p-4">
      {/* 필드 안내 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#6d4e42]">{field.label}</span>
        <span className="text-xs text-[#a09080]">
          {fieldIndex + 1}/{totalFields}
        </span>
      </div>

      {field.voicePrompt && (
        <p className="text-xs text-[#a09080] mb-3">{field.voicePrompt}</p>
      )}

      {/* 마이크 버튼 */}
      {isSupported && (
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 font-medium transition-all duration-200 cursor-pointer mb-3 ${
            isListening
              ? 'bg-red-50 text-red-600 ring-2 ring-red-200'
              : 'bg-white text-[#6d4e42] border border-[#ebe7e4] hover:border-[#b4988d] hover:bg-[#f6f4f2]'
          }`}
        >
          {isListening ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              녹음 중... (클릭하여 중지)
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              음성 입력 시작
            </>
          )}
        </button>
      )}

      {/* 인식 중 텍스트 */}
      {interimText && (
        <p className="text-sm text-[#b4988d] italic mb-2">{interimText}</p>
      )}

      {/* 에러 메시지 */}
      {errorMessage && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-2">{errorMessage}</p>
      )}

      {/* 현재 값 표시 + 직접 입력 */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || '직접 입력도 가능합니다'}
        rows={3}
        className={`w-full text-sm border rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow ${
          isListening ? 'border-red-200 ring-1 ring-red-100' : 'border-[#ebe7e4]'
        }`}
      />

      {/* 값 지우기 */}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-xs text-red-400 hover:text-red-600 mt-1 cursor-pointer"
        >
          지우기
        </button>
      )}

      {/* 네비게이션 */}
      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={handlePrev}
          disabled={fieldIndex === 0}
          className="rounded-lg bg-white border border-[#ebe7e4] text-[#a09080] hover:bg-[#f6f4f2] disabled:opacity-30 cursor-pointer px-3 py-1.5 text-xs"
        >
          이전
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-lg bg-white border border-[#ebe7e4] text-[#a09080] hover:bg-[#f6f4f2] cursor-pointer px-3 py-1.5 text-xs"
        >
          건너뛰기
        </button>
        <button
          type="button"
          onClick={handleNext}
          className={`rounded-lg cursor-pointer px-4 py-1.5 text-xs font-medium ${
            isLast
              ? 'bg-[#b4988d] text-white hover:bg-[#a08878]'
              : 'bg-[#6d4e42] text-white hover:bg-[#5a3d33]'
          }`}
        >
          {isLast ? '완료' : '다음'}
        </button>

        {/* 진행바 */}
        <div className="flex-1 flex gap-0.5 ml-2">
          {Array.from({ length: totalFields }).map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                idx < fieldIndex ? 'bg-[#b4988d]'
                : idx === fieldIndex ? 'bg-[#6d4e42]'
                : 'bg-[#ebe7e4]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
