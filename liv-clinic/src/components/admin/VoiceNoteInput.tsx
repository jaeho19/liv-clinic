'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

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

// 상담 템플릿 필드 정의
export interface ConsultationTemplate {
  patientName?: string;    // 환자명
  consultType?: string;    // 상담 유형 (초진/재진/시술후관리)
  mainConcern?: string;    // 주요 호소
  consultNote?: string;    // 상담 내용
  recommended?: string;    // 권장 시술
  estimatedCost?: string;  // 예상 비용
  nextStep?: string;       // 다음 단계
  memo?: string;           // 메모
}

const TEMPLATE_FIELDS = [
  { key: 'patientName', label: '환자명', placeholder: '환자 이름을 말씀해주세요' },
  { key: 'consultType', label: '상담 유형', placeholder: '초진, 재진, 시술후관리 중 하나를 말씀해주세요' },
  { key: 'mainConcern', label: '주요 호소', placeholder: '환자의 주요 고민이나 원하는 부위를 말씀해주세요' },
  { key: 'consultNote', label: '상담 내용', placeholder: '상담한 내용을 말씀해주세요' },
  { key: 'recommended', label: '권장 시술', placeholder: '추천 시술을 말씀해주세요' },
  { key: 'estimatedCost', label: '예상 비용', placeholder: '예상 비용을 말씀해주세요' },
  { key: 'nextStep', label: '다음 단계', placeholder: '예약확정, 재연락, 검토중 등을 말씀해주세요' },
  { key: 'memo', label: '메모', placeholder: '추가 메모를 말씀해주세요' },
] as const;

type InputMode = 'free' | 'template';

interface VoiceNoteInputProps {
  value: string;
  onChange: (value: string) => void;
  onTemplateComplete?: (template: ConsultationTemplate) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export default function VoiceNoteInput({
  value,
  onChange,
  onTemplateComplete,
  placeholder = '메모를 입력하세요...',
  rows = 4,
  className = '',
}: VoiceNoteInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('free');
  const [templateData, setTemplateData] = useState<ConsultationTemplate>({});
  const [currentFieldIdx, setCurrentFieldIdx] = useState(0);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 브라우저 지원 여부 확인
  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionClass);
  }, []);

  // 템플릿 데이터 → 텍스트 변환
  const templateToText = useCallback((data: ConsultationTemplate): string => {
    const lines: string[] = [];
    if (data.patientName) lines.push(`[환자명] ${data.patientName}`);
    if (data.consultType) lines.push(`[상담유형] ${data.consultType}`);
    if (data.mainConcern) lines.push(`[주요호소] ${data.mainConcern}`);
    if (data.consultNote) lines.push(`[상담내용] ${data.consultNote}`);
    if (data.recommended) lines.push(`[권장시술] ${data.recommended}`);
    if (data.estimatedCost) lines.push(`[예상비용] ${data.estimatedCost}`);
    if (data.nextStep) lines.push(`[다음단계] ${data.nextStep}`);
    if (data.memo) lines.push(`[메모] ${data.memo}`);
    return lines.join('\n');
  }, []);

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
        if (inputMode === 'template') {
          // 템플릿 모드: 현재 필드에 텍스트 추가
          const fieldKey = TEMPLATE_FIELDS[currentFieldIdx].key as keyof ConsultationTemplate;
          setTemplateData(prev => {
            const updated = {
              ...prev,
              [fieldKey]: (prev[fieldKey] ? prev[fieldKey] + ' ' : '') + finalTranscript.trim(),
            };
            onChange(templateToText(updated));
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
  }, [inputMode, currentFieldIdx, value, onChange, templateToText]);

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
    if (currentFieldIdx < TEMPLATE_FIELDS.length - 1) {
      setCurrentFieldIdx(prev => prev + 1);
    } else {
      // 템플릿 완성
      onTemplateComplete?.(templateData);
    }
  }, [currentFieldIdx, stopListening, templateData, onTemplateComplete]);

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
    if (mode === 'template') {
      setCurrentFieldIdx(0);
      setTemplateData({});
    }
  }, [stopListening]);

  // 현재 필드 텍스트 초기화
  const clearCurrentField = useCallback(() => {
    if (inputMode === 'template') {
      const fieldKey = TEMPLATE_FIELDS[currentFieldIdx].key as keyof ConsultationTemplate;
      setTemplateData(prev => {
        const updated = { ...prev };
        delete updated[fieldKey];
        onChange(templateToText(updated));
        return updated;
      });
    }
  }, [inputMode, currentFieldIdx, onChange, templateToText]);

  if (!isSupported) {
    // Web Speech API 미지원 시 일반 textarea만 표시
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
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowModeSelector(!showModeSelector)}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md bg-[#f6f4f2] text-[#6d4e42] hover:bg-[#ebe7e4] transition-colors cursor-pointer"
            >
              {inputMode === 'free' ? '자유입력' : '템플릿'}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showModeSelector && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#ebe7e4] rounded-lg shadow-lg z-10 min-w-[120px]">
                <button
                  type="button"
                  onClick={() => switchMode('free')}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-[#faf8f7] cursor-pointer ${inputMode === 'free' ? 'text-[#b4988d] font-semibold' : 'text-[#575756]'}`}
                >
                  자유 입력
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('template')}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-[#faf8f7] cursor-pointer ${inputMode === 'template' ? 'text-[#b4988d] font-semibold' : 'text-[#575756]'}`}
                >
                  템플릿 가이드
                </button>
              </div>
            )}
          </div>

          {/* 템플릿 모드: 현재 필드 표시 */}
          {inputMode === 'template' && (
            <span className="text-[10px] text-[#a09080]">
              {currentFieldIdx + 1}/{TEMPLATE_FIELDS.length}: {TEMPLATE_FIELDS[currentFieldIdx].label}
            </span>
          )}
        </div>

        {/* 마이크 버튼 */}
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
            isListening
              ? 'bg-red-50 text-red-600 ring-2 ring-red-200'
              : 'bg-[#f6f4f2] text-[#6d4e42] hover:bg-[#ebe7e4]'
          }`}
        >
          {isListening ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              녹음 중...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              음성 입력
            </>
          )}
        </button>
      </div>

      {/* 템플릿 모드: 가이드 프롬프트 */}
      {inputMode === 'template' && (
        <div className="bg-[#faf8f7] rounded-lg px-3 py-2 mb-2 border border-[#ebe7e4]/60">
          <p className="text-xs text-[#a09080] mb-1.5">{TEMPLATE_FIELDS[currentFieldIdx].placeholder}</p>
          {/* 현재 필드 값 미리보기 */}
          {templateData[TEMPLATE_FIELDS[currentFieldIdx].key as keyof ConsultationTemplate] && (
            <div className="flex items-center gap-2">
              <p className="text-sm text-[#575756] flex-1">
                {templateData[TEMPLATE_FIELDS[currentFieldIdx].key as keyof ConsultationTemplate]}
              </p>
              <button
                type="button"
                onClick={clearCurrentField}
                className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer"
              >
                지우기
              </button>
            </div>
          )}
          {/* interim 텍스트 */}
          {interimText && (
            <p className="text-sm text-[#b4988d] italic">{interimText}</p>
          )}
          {/* 네비게이션 */}
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={prevField}
              disabled={currentFieldIdx === 0}
              className="px-2 py-0.5 text-[10px] rounded bg-white border border-[#ebe7e4] text-[#a09080] hover:bg-[#f6f4f2] disabled:opacity-30 cursor-pointer"
            >
              이전
            </button>
            <button
              type="button"
              onClick={skipField}
              className="px-2 py-0.5 text-[10px] rounded bg-white border border-[#ebe7e4] text-[#a09080] hover:bg-[#f6f4f2] cursor-pointer"
            >
              건너뛰기
            </button>
            <button
              type="button"
              onClick={nextField}
              className={`px-2 py-0.5 text-[10px] rounded cursor-pointer ${
                currentFieldIdx < TEMPLATE_FIELDS.length - 1
                  ? 'bg-[#6d4e42] text-white hover:bg-[#5a3d33]'
                  : 'bg-[#b4988d] text-white hover:bg-[#a08878]'
              }`}
            >
              {currentFieldIdx < TEMPLATE_FIELDS.length - 1 ? '다음' : '완료'}
            </button>
            {/* 진행바 */}
            <div className="flex-1 flex gap-0.5 ml-2">
              {TEMPLATE_FIELDS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-colors ${
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

      {/* 자유입력 모드: 텍스트 영역 */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={inputMode === 'template' ? '위 가이드에 따라 음성으로 입력하세요. 텍스트가 여기에 정리됩니다.' : placeholder}
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
