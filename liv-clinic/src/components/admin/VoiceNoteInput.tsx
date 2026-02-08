'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  TEMPLATE_CONFIGS,
  templateDataToText,
} from '@/types/voice-templates';
import type { TemplateType, TemplateData } from '@/types/voice-templates';

// Web Speech API 타입 선언
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

/** @deprecated Use TemplateData from voice-templates.ts instead */
export interface ConsultationTemplate {
  patientName?: string;
  consultType?: string;
  mainConcern?: string;
  consultNote?: string;
  recommended?: string;
  estimatedCost?: string;
  nextStep?: string;
  memo?: string;
}

type InputMode = 'free' | TemplateType;

interface VoiceNoteInputProps {
  value: string;
  onChange: (value: string) => void;
  onTemplateComplete?: (data: TemplateData) => void;
  templateType?: TemplateType;
  availableTemplates?: TemplateType[];
  mobileOptimized?: boolean;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export default function VoiceNoteInput({
  value,
  onChange,
  onTemplateComplete,
  templateType,
  availableTemplates,
  mobileOptimized = false,
  placeholder = '메모를 입력하세요...',
  rows = 4,
  className = '',
}: VoiceNoteInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>(templateType || 'free');
  const [templateData, setTemplateData] = useState<TemplateData>({});
  const [currentFieldIdx, setCurrentFieldIdx] = useState(0);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 현재 활성 템플릿 설정
  const activeConfig = inputMode !== 'free' ? TEMPLATE_CONFIGS[inputMode] : null;
  const currentFields = activeConfig?.fields || [];
  const currentField = currentFields[currentFieldIdx];

  // 모드 옵션 목록
  const modeOptions = useMemo(() => {
    const options: { mode: InputMode; label: string }[] = [
      { mode: 'free', label: '자유 입력' },
    ];
    const templates = availableTemplates || (['consultation', 'operation', 'quickNote'] as TemplateType[]);
    for (const t of templates) {
      options.push({ mode: t, label: TEMPLATE_CONFIGS[t].label });
    }
    return options;
  }, [availableTemplates]);

  // 현재 모드 라벨
  const currentModeLabel = inputMode === 'free'
    ? '자유입력'
    : TEMPLATE_CONFIGS[inputMode].label;

  // 브라우저 지원 여부 확인
  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionClass);
  }, []);

  // templateType prop 변경 시 모드 동기화
  useEffect(() => {
    if (templateType) {
      setInputMode(templateType);
      setCurrentFieldIdx(0);
      setTemplateData({});
    }
  }, [templateType]);

  // 템플릿 데이터 → 텍스트 변환
  const templateToText = useCallback((data: TemplateData): string => {
    if (!activeConfig) return '';
    return templateDataToText(data, activeConfig);
  }, [activeConfig]);

  // 음성 인식 시작
  const startListening = useCallback(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ko-KR';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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
        if (inputMode !== 'free' && currentField) {
          // 템플릿 모드: 현재 필드에 텍스트 추가
          const fieldKey = currentField.key;
          setTemplateData(prev => {
            const updated = {
              ...prev,
              [fieldKey]: (prev[fieldKey] ? prev[fieldKey] + ' ' : '') + finalTranscript.trim(),
            };
            const config = TEMPLATE_CONFIGS[inputMode as TemplateType];
            onChange(templateDataToText(updated, config));
            return updated;
          });
        } else {
          // 자유 입력 모드: 기존 텍스트에 추가
          const newValue = value ? value + ' ' + finalTranscript.trim() : finalTranscript.trim();
          onChange(newValue);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted') {
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
  }, [inputMode, currentField, value, onChange]);

  // 음성 인식 중지
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  // 다음 필드로 이동 (템플릿 모드)
  const nextField = useCallback(() => {
    stopListening();
    if (currentFieldIdx < currentFields.length - 1) {
      setCurrentFieldIdx(prev => prev + 1);
    } else {
      // 템플릿 완성
      onTemplateComplete?.(templateData);
    }
  }, [currentFieldIdx, currentFields.length, stopListening, templateData, onTemplateComplete]);

  // 이전 필드로 이동
  const prevField = useCallback(() => {
    stopListening();
    if (currentFieldIdx > 0) {
      setCurrentFieldIdx(prev => prev - 1);
    }
  }, [currentFieldIdx, stopListening]);

  // 필드 건너뛰기
  const skipField = useCallback(() => {
    nextField();
  }, [nextField]);

  // 모드 변경
  const switchMode = useCallback((mode: InputMode) => {
    stopListening();
    setInputMode(mode);
    setShowModeSelector(false);
    if (mode !== 'free') {
      setCurrentFieldIdx(0);
      setTemplateData({});
    }
  }, [stopListening]);

  // 현재 필드 텍스트 초기화
  const clearCurrentField = useCallback(() => {
    if (inputMode !== 'free' && currentField) {
      const fieldKey = currentField.key;
      setTemplateData(prev => {
        const updated = { ...prev };
        delete updated[fieldKey];
        onChange(templateToText(updated));
        return updated;
      });
    }
  }, [inputMode, currentField, onChange, templateToText]);

  // 모바일 최적화 스타일
  const mobile = mobileOptimized;

  if (!isSupported) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`text-sm border border-[#ebe7e4] rounded-xl px-3 py-2 w-full resize-none focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow ${className}`}
      />
    );
  }

  return (
    <div className="relative">
      {/* 모드 선택 + 마이크 헤더 */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {/* 모드 토글 */}
          {!templateType && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowModeSelector(!showModeSelector)}
                className={`flex items-center gap-1 font-medium rounded-md bg-[#f6f4f2] text-[#6d4e42] hover:bg-[#ebe7e4] transition-colors cursor-pointer ${
                  mobile ? 'px-3 py-1.5 text-xs' : 'px-2 py-0.5 text-[10px]'
                }`}
              >
                {currentModeLabel}
                <svg className={mobile ? 'w-4 h-4' : 'w-3 h-3'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showModeSelector && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-[#ebe7e4] rounded-lg shadow-lg z-10 min-w-[140px]">
                  {modeOptions.map(opt => (
                    <button
                      key={opt.mode}
                      type="button"
                      onClick={() => switchMode(opt.mode)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-[#faf8f7] cursor-pointer ${
                        inputMode === opt.mode ? 'text-[#b4988d] font-semibold' : 'text-[#575756]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* templateType 고정 모드일 때 라벨 표시 */}
          {templateType && inputMode !== 'free' && (
            <span className={`font-medium text-[#6d4e42] ${mobile ? 'text-xs' : 'text-[10px]'}`}>
              {currentModeLabel}
            </span>
          )}

          {/* 템플릿 모드: 현재 필드 표시 */}
          {inputMode !== 'free' && currentField && (
            <span className={`text-[#a09080] ${mobile ? 'text-xs' : 'text-[10px]'}`}>
              {currentFieldIdx + 1}/{currentFields.length}: {currentField.label}
            </span>
          )}
        </div>

        {/* 마이크 버튼 */}
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          className={`flex items-center gap-1 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
            mobile ? 'px-4 py-2 text-sm' : 'px-2.5 py-1 text-xs'
          } ${
            isListening
              ? 'bg-red-50 text-red-600 ring-2 ring-red-200'
              : 'bg-[#f6f4f2] text-[#6d4e42] hover:bg-[#ebe7e4]'
          }`}
        >
          {isListening ? (
            <>
              <span className={`relative flex ${mobile ? 'h-3 w-3' : 'h-2.5 w-2.5'}`}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className={`relative inline-flex rounded-full bg-red-500 ${mobile ? 'h-3 w-3' : 'h-2.5 w-2.5'}`} />
              </span>
              녹음 중...
            </>
          ) : (
            <>
              <svg className={mobile ? 'w-5 h-5' : 'w-3.5 h-3.5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              음성 입력
            </>
          )}
        </button>
      </div>

      {/* 템플릿 모드: 가이드 프롬프트 */}
      {inputMode !== 'free' && currentField && (
        <div className={`bg-[#faf8f7] rounded-lg border border-[#ebe7e4]/60 mb-2 ${mobile ? 'px-4 py-3' : 'px-3 py-2'}`}>
          <p className={`text-[#a09080] mb-1.5 ${mobile ? 'text-sm' : 'text-xs'}`}>
            {currentField.placeholder}
          </p>
          {/* 현재 필드 값 미리보기 */}
          {templateData[currentField.key] && (
            <div className="flex items-center gap-2">
              <p className={`text-[#575756] flex-1 ${mobile ? 'text-base' : 'text-sm'}`}>
                {templateData[currentField.key]}
              </p>
              <button
                type="button"
                onClick={clearCurrentField}
                className={`text-red-400 hover:text-red-600 cursor-pointer ${mobile ? 'text-xs px-2 py-1' : 'text-[10px]'}`}
              >
                지우기
              </button>
            </div>
          )}
          {/* interim 텍스트 */}
          {interimText && (
            <p className={`text-[#b4988d] italic ${mobile ? 'text-base' : 'text-sm'}`}>{interimText}</p>
          )}
          {/* 네비게이션 */}
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={prevField}
              disabled={currentFieldIdx === 0}
              className={`rounded bg-white border border-[#ebe7e4] text-[#a09080] hover:bg-[#f6f4f2] disabled:opacity-30 cursor-pointer ${
                mobile ? 'px-4 py-2 text-xs' : 'px-2 py-0.5 text-[10px]'
              }`}
            >
              이전
            </button>
            <button
              type="button"
              onClick={skipField}
              className={`rounded bg-white border border-[#ebe7e4] text-[#a09080] hover:bg-[#f6f4f2] cursor-pointer ${
                mobile ? 'px-4 py-2 text-xs' : 'px-2 py-0.5 text-[10px]'
              }`}
            >
              건너뛰기
            </button>
            <button
              type="button"
              onClick={nextField}
              className={`rounded cursor-pointer ${
                mobile ? 'px-4 py-2 text-xs' : 'px-2 py-0.5 text-[10px]'
              } ${
                currentFieldIdx < currentFields.length - 1
                  ? 'bg-[#6d4e42] text-white hover:bg-[#5a3d33]'
                  : 'bg-[#b4988d] text-white hover:bg-[#a08878]'
              }`}
            >
              {currentFieldIdx < currentFields.length - 1 ? '다음' : '완료'}
            </button>
            {/* 진행바 */}
            <div className="flex-1 flex gap-0.5 ml-2">
              {currentFields.map((_, idx) => (
                <div
                  key={idx}
                  className={`flex-1 rounded-full transition-colors ${mobile ? 'h-2' : 'h-1'} ${
                    idx < currentFieldIdx ? 'bg-[#b4988d]'
                    : idx === currentFieldIdx ? 'bg-[#6d4e42]'
                    : 'bg-[#ebe7e4]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 텍스트 영역 */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={inputMode !== 'free' ? '위 가이드에 따라 음성으로 입력하세요. 텍스트가 여기에 정리됩니다.' : placeholder}
          rows={rows}
          className={`text-sm border border-[#ebe7e4] rounded-xl px-3 py-2 w-full resize-none focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow ${
            isListening ? 'ring-2 ring-red-100 border-red-200' : ''
          } ${className}`}
        />
        {/* 자유 모드 interim 표시 */}
        {inputMode === 'free' && interimText && (
          <div className="absolute bottom-2 left-3 right-3">
            <p className="text-xs text-[#b4988d] italic bg-white/90 px-1 rounded">{interimText}</p>
          </div>
        )}
      </div>
    </div>
  );
}
