'use client';

import { useReducer, useCallback, useMemo } from 'react';
import type {
  SmartFormTemplate,
  HybridFormData,
  HybridFormPhase,
  HybridFormField,
} from '@/types/smart-forms';
import { hybridFormDataToText } from '@/types/smart-forms';
import VoiceFieldRecorder from './VoiceFieldRecorder';
import FormPreview from './FormPreview';

// ─── State & Reducer ─────────────────────────
interface FormState {
  data: HybridFormData;
  phase: HybridFormPhase;
  voiceFieldIdx: number;
}

type FormAction =
  | { type: 'SET_FIELD'; key: string; value: string }
  | { type: 'SET_PHASE'; phase: HybridFormPhase }
  | { type: 'VOICE_NEXT' }
  | { type: 'VOICE_PREV' }
  | { type: 'RESET'; initialData?: HybridFormData };

function createInitialState(template: SmartFormTemplate, initialData?: HybridFormData): FormState {
  const data: HybridFormData = { ...initialData };
  // 기본값 설정
  for (const field of template.fields) {
    if (field.defaultValue && !data[field.key]) {
      data[field.key] = field.defaultValue;
    }
  }
  return { data, phase: 'manual', voiceFieldIdx: 0 };
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, data: { ...state.data, [action.key]: action.value } };
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'VOICE_NEXT':
      return { ...state, voiceFieldIdx: state.voiceFieldIdx + 1 };
    case 'VOICE_PREV':
      return { ...state, voiceFieldIdx: Math.max(0, state.voiceFieldIdx - 1) };
    case 'RESET':
      return { data: action.initialData || {}, phase: 'manual', voiceFieldIdx: 0 };
    default:
      return state;
  }
}

// ─── Props ────────────────────────────────────
interface HybridFormProps {
  template: SmartFormTemplate;
  initialData?: HybridFormData;
  onSubmit: (data: HybridFormData, textOutput: string) => void;
  onCancel?: () => void;
  compact?: boolean;
  saving?: boolean;
}

// ─── Component ────────────────────────────────
export default function HybridForm({
  template,
  initialData,
  onSubmit,
  onCancel,
  compact = false,
  saving = false,
}: HybridFormProps) {
  const [state, dispatch] = useReducer(
    formReducer,
    { template, initialData },
    ({ template: t, initialData: d }) => createInitialState(t, d),
  );

  const { data, phase, voiceFieldIdx } = state;

  // 필드 분류
  const manualFields = useMemo(
    () => template.fields.filter(f => f.inputMethod === 'manual' || f.inputMethod === 'both'),
    [template],
  );
  const voiceFields = useMemo(
    () => template.fields.filter(f => f.inputMethod === 'voice' || f.inputMethod === 'both'),
    [template],
  );
  const hasVoiceFields = voiceFields.length > 0;

  // 필드 값 변경
  const setField = useCallback((key: string, value: string) => {
    dispatch({ type: 'SET_FIELD', key, value });
  }, []);

  // 수동 → 음성 전환
  const goToVoice = useCallback(() => {
    dispatch({ type: 'SET_PHASE', phase: 'voice' });
  }, []);

  // 음성 → 미리보기
  const goToPreview = useCallback(() => {
    dispatch({ type: 'SET_PHASE', phase: 'preview' });
  }, []);

  // 미리보기 → 수동 (수정)
  const goToManual = useCallback(() => {
    dispatch({ type: 'SET_PHASE', phase: 'manual' });
  }, []);

  // 음성 필드 다음
  const voiceNext = useCallback(() => {
    if (voiceFieldIdx >= voiceFields.length - 1) {
      // 마지막 음성 필드 완료 → 마무리 수동 필드가 있으면 preview, 없으면 바로 preview
      goToPreview();
    } else {
      dispatch({ type: 'VOICE_NEXT' });
    }
  }, [voiceFieldIdx, voiceFields.length, goToPreview]);

  const voicePrev = useCallback(() => {
    if (voiceFieldIdx === 0) {
      dispatch({ type: 'SET_PHASE', phase: 'manual' });
    } else {
      dispatch({ type: 'VOICE_PREV' });
    }
  }, [voiceFieldIdx]);

  const voiceSkip = useCallback(() => {
    voiceNext();
  }, [voiceNext]);

  // 제출
  const handleSubmit = useCallback(() => {
    const textOutput = hybridFormDataToText(data, template);
    onSubmit(data, textOutput);
  }, [data, template, onSubmit]);

  // 필수 필드 검증
  const missingRequired = template.fields
    .filter(f => f.required && !data[f.key]?.trim())
    .map(f => f.label);

  // ━━━ RENDER: Manual Phase ━━━━━━━━━━━━━━━━━━
  if (phase === 'manual') {
    return (
      <div className={compact ? 'space-y-3' : 'space-y-4'}>
        {/* 양식 제목 */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{template.icon}</span>
          <span className="font-medium text-sm text-[#6d4e42]">{template.name}</span>
        </div>

        {/* 수동 필드 렌더링 */}
        {manualFields.map((field) => (
          <ManualFieldInput
            key={field.key}
            field={field}
            value={data[field.key] || ''}
            onChange={(v) => setField(field.key, v)}
            compact={compact}
          />
        ))}

        {/* 액션 버튼 */}
        <div className="flex gap-2 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 border border-[#e5e5e5] rounded-xl text-sm text-[#8a8a8a] hover:bg-[#f6f6f6] cursor-pointer"
            >
              취소
            </button>
          )}
          {hasVoiceFields ? (
            <button
              type="button"
              onClick={goToVoice}
              className="flex-1 py-2.5 bg-[#6d4e42] text-white rounded-xl text-sm font-medium hover:bg-[#5a3d33] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              음성 입력으로
            </button>
          ) : (
            <button
              type="button"
              onClick={goToPreview}
              disabled={missingRequired.length > 0}
              className="flex-1 py-2.5 bg-[#b4988d] text-white rounded-xl text-sm font-medium hover:bg-[#a08878] disabled:opacity-50 transition-colors cursor-pointer"
            >
              미리보기
            </button>
          )}
        </div>

        {/* 음성 건너뛰기 링크 */}
        {hasVoiceFields && (
          <button
            type="button"
            onClick={goToPreview}
            className="w-full text-center text-xs text-[#a09080] hover:text-[#6d4e42] cursor-pointer py-1"
          >
            음성 건너뛰고 직접 입력으로 완료하기
          </button>
        )}
      </div>
    );
  }

  // ━━━ RENDER: Voice Phase ━━━━━━━━━━━━━━━━━━━
  if (phase === 'voice') {
    const currentVoiceField = voiceFields[voiceFieldIdx];
    if (!currentVoiceField) {
      goToPreview();
      return null;
    }

    return (
      <div className={compact ? 'space-y-3' : 'space-y-4'}>
        {/* 양식 제목 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{template.icon}</span>
            <span className="font-medium text-sm text-[#6d4e42]">{template.name}</span>
          </div>
          <span className="text-xs text-[#a09080]">음성 입력</span>
        </div>

        {/* 음성 필드 레코더 */}
        <VoiceFieldRecorder
          key={currentVoiceField.key}
          field={currentVoiceField}
          value={data[currentVoiceField.key] || ''}
          onChange={(v) => setField(currentVoiceField.key, v)}
          onNext={voiceNext}
          onPrev={voicePrev}
          onSkip={voiceSkip}
          fieldIndex={voiceFieldIdx}
          totalFields={voiceFields.length}
          isLast={voiceFieldIdx >= voiceFields.length - 1}
        />

        {/* 직접 입력 링크 */}
        <button
          type="button"
          onClick={goToPreview}
          className="w-full text-center text-xs text-[#a09080] hover:text-[#6d4e42] cursor-pointer py-1"
        >
          음성 건너뛰고 완료하기
        </button>
      </div>
    );
  }

  // ━━━ RENDER: Preview Phase ━━━━━━━━━━━━━━━━━
  return (
    <FormPreview
      template={template}
      data={data}
      onEdit={goToManual}
      onSubmit={handleSubmit}
      saving={saving}
      missingRequired={missingRequired}
    />
  );
}

// ─── Manual Field Input ───────────────────────
function ManualFieldInput({
  field,
  value,
  onChange,
  compact,
}: {
  field: HybridFormField;
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  const labelClass = `block text-xs font-medium text-[#575756] mb-1 ${compact ? '' : 'mb-1.5'}`;

  // radio 타입
  if (field.fieldType === 'radio' && field.options) {
    return (
      <div>
        <label className={labelClass}>
          {field.label} {field.required && <span className="text-red-400">*</span>}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {field.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                value === opt
                  ? 'border-[#b4988d] bg-[#b4988d]/10 text-[#6d4e42]'
                  : 'border-[#e5e5e5] text-[#8a8a8a] hover:border-[#b4988d]/50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // select 타입
  if (field.fieldType === 'select' && field.options) {
    return (
      <div>
        <label className={labelClass}>
          {field.label} {field.required && <span className="text-red-400">*</span>}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
        >
          <option value="">선택하세요</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  // number 타입
  if (field.fieldType === 'number') {
    return (
      <div>
        <label className={labelClass}>
          {field.label} {field.required && <span className="text-red-400">*</span>}
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
        />
      </div>
    );
  }

  // textarea 타입
  if (field.fieldType === 'textarea') {
    return (
      <div>
        <label className={labelClass}>
          {field.label} {field.required && <span className="text-red-400">*</span>}
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d] resize-none"
        />
      </div>
    );
  }

  // text 타입 (기본)
  return (
    <div>
      <label className={labelClass}>
        {field.label} {field.required && <span className="text-red-400">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
      />
    </div>
  );
}
