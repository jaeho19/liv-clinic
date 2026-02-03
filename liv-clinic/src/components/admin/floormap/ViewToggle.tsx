'use client';

import type { OperationsViewMode } from '@/types/admin';

const VIEW_OPTIONS: { value: OperationsViewMode; label: string; icon: string }[] = [
  { value: 'kanban', label: '칸반', icon: '▦' },
  { value: 'floormap', label: '평면도', icon: '▣' },
];

export default function ViewToggle({
  mode,
  onChange,
}: {
  mode: OperationsViewMode;
  onChange: (mode: OperationsViewMode) => void;
}) {
  return (
    <div className="flex rounded-lg border border-[#e5e5e5] overflow-hidden">
      {VIEW_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
            mode === opt.value
              ? 'bg-[#b4988d] text-white'
              : 'bg-white text-[#8a8a8a] hover:bg-[#f6f6f6]'
          }`}
        >
          <span className="mr-1">{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
