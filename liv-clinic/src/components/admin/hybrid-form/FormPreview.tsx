'use client';

import type { SmartFormTemplate, HybridFormData } from '@/types/smart-forms';

interface FormPreviewProps {
  template: SmartFormTemplate;
  data: HybridFormData;
  onEdit: () => void;
  onSubmit: () => void;
  saving?: boolean;
  missingRequired?: string[];
}

export default function FormPreview({
  template,
  data,
  onEdit,
  onSubmit,
  saving = false,
  missingRequired = [],
}: FormPreviewProps) {
  const hasData = template.fields.some(f => data[f.key]?.trim());

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{template.icon}</span>
          <span className="font-medium text-sm text-[#6d4e42]">{template.name}</span>
        </div>
        <span className="text-xs text-[#a09080]">미리보기</span>
      </div>

      {/* 필드 값 표시 */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] divide-y divide-[#f0f0f0]">
        {template.fields.map((field) => {
          const value = data[field.key]?.trim();
          const isMissing = field.required && !value;

          return (
            <div key={field.key} className="px-4 py-2.5">
              <div className="flex items-start gap-3">
                <span className={`text-xs font-medium min-w-[80px] pt-0.5 ${
                  isMissing ? 'text-red-500' : 'text-[#a09080]'
                }`}>
                  {field.label}
                  {field.required && <span className="text-red-400 ml-0.5">*</span>}
                </span>
                <span className={`text-sm flex-1 ${
                  value ? 'text-[#575756]' : 'text-[#c0c0c0]'
                } ${field.fieldType === 'textarea' ? 'whitespace-pre-wrap' : ''}`}>
                  {value || (isMissing ? '필수 입력' : '-')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 필수 필드 경고 */}
      {missingRequired.length > 0 && (
        <p className="text-xs text-red-500">
          필수 항목을 입력해주세요: {missingRequired.join(', ')}
        </p>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 py-2.5 border border-[#e5e5e5] rounded-xl text-sm text-[#8a8a8a] hover:bg-[#f6f6f6] transition-colors cursor-pointer"
        >
          수정하기
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving || missingRequired.length > 0 || !hasData}
          className="flex-1 py-2.5 bg-[#b4988d] text-white rounded-xl text-sm font-medium hover:bg-[#a08878] disabled:opacity-50 transition-colors cursor-pointer"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
