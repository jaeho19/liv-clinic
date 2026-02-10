'use client';

import type { SmartFormTemplate, SmartFormCategory } from '@/types/smart-forms';
import { SMART_FORM_TEMPLATES } from '@/types/smart-forms';

interface FormTemplateSelectorProps {
  templates?: SmartFormTemplate[];
  categories?: SmartFormCategory[];
  onSelect: (template: SmartFormTemplate) => void;
  onFreeInput?: () => void;
  compact?: boolean;
}

export default function FormTemplateSelector({
  templates,
  categories,
  onSelect,
  onFreeInput,
  compact = false,
}: FormTemplateSelectorProps) {
  let displayTemplates = templates || SMART_FORM_TEMPLATES;

  if (categories) {
    displayTemplates = displayTemplates.filter(t => categories.includes(t.category));
  }

  return (
    <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'}`}>
      {displayTemplates.map((template) => (
        <button
          key={template.id}
          type="button"
          onClick={() => onSelect(template)}
          className="p-3 bg-white border border-[#e5e5e5] rounded-xl text-left hover:border-[#b4988d] hover:shadow-md transition-all cursor-pointer group"
        >
          <span className={`block mb-1.5 ${compact ? 'text-xl' : 'text-2xl'}`}>
            {template.icon}
          </span>
          <p className={`font-medium text-[#6d4e42] group-hover:text-[#b4988d] ${compact ? 'text-xs' : 'text-sm'}`}>
            {template.name}
          </p>
          {!compact && (
            <p className="text-[10px] text-[#8a8a8a] mt-0.5 leading-tight">
              {template.description}
            </p>
          )}
        </button>
      ))}

      {/* 자유 입력 옵션 */}
      {onFreeInput && (
        <button
          type="button"
          onClick={onFreeInput}
          className="p-3 bg-white border border-dashed border-[#e5e5e5] rounded-xl text-left hover:border-[#b4988d] transition-all cursor-pointer group"
        >
          <span className={`block mb-1.5 ${compact ? 'text-xl' : 'text-2xl'}`}>✏️</span>
          <p className={`font-medium text-[#6d4e42] group-hover:text-[#b4988d] ${compact ? 'text-xs' : 'text-sm'}`}>
            자유 입력
          </p>
          {!compact && (
            <p className="text-[10px] text-[#8a8a8a] mt-0.5 leading-tight">
              양식 없이 자유롭게 입력
            </p>
          )}
        </button>
      )}
    </div>
  );
}
