'use client';

import type { TreatmentType, FloorMapFiltersV2 } from '@/types/admin';
import {
  TREATMENT_TYPES,
  TREATMENT_TYPE_LABELS,
  TREATMENT_TYPE_FLOOR_COLORS,
  TREATMENT_TYPE_ICONS,
  DOCTOR_OPTIONS,
} from '@/types/admin';

interface StatusLegendProps {
  filters: FloorMapFiltersV2;
  onFiltersChange: (filters: FloorMapFiltersV2) => void;
  stats: {
    active: number;
    waiting: number;
    completed: number;
    emptyRooms: number;
    totalRooms: number;
  };
}

export default function StatusLegend({ filters, onFiltersChange, stats }: StatusLegendProps) {
  const toggleType = (type: TreatmentType) => {
    const current = filters.treatmentTypes;
    if (current.length === 0) {
      onFiltersChange({ ...filters, treatmentTypes: [type] });
    } else if (current.includes(type)) {
      onFiltersChange({ ...filters, treatmentTypes: current.filter((t) => t !== type) });
    } else {
      onFiltersChange({ ...filters, treatmentTypes: [...current, type] });
    }
  };

  const toggleDoctor = (doctor: string) => {
    const current = filters.doctors;
    if (current.includes(doctor)) {
      onFiltersChange({ ...filters, doctors: current.filter((d) => d !== doctor) });
    } else {
      onFiltersChange({ ...filters, doctors: [...current, doctor] });
    }
  };

  const clearFilters = () => {
    onFiltersChange({ treatmentTypes: [], doctors: [] });
  };

  const hasFilters = filters.treatmentTypes.length > 0 || filters.doctors.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* 유형 필터 */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[#8a8a8a] mr-1">유형:</span>
        {TREATMENT_TYPES.map((type) => {
          const colors = TREATMENT_TYPE_FLOOR_COLORS[type];
          const isActive = filters.treatmentTypes.length === 0 || filters.treatmentTypes.includes(type);
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                isActive ? 'opacity-100' : 'opacity-40'
              }`}
              style={{
                backgroundColor: colors.fill,
                borderColor: colors.border,
                color: colors.text,
              }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: colors.border }}
              />
              {TREATMENT_TYPE_ICONS[type]} {TREATMENT_TYPE_LABELS[type]}
            </button>
          );
        })}
      </div>

      {/* 구분선 */}
      <div className="w-px h-5 bg-[#e5e5e5]" />

      {/* 담당의 필터 */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[#8a8a8a] mr-1">담당의:</span>
        {DOCTOR_OPTIONS.map((doctor) => {
          const isActive = filters.doctors.length === 0 || filters.doctors.includes(doctor);
          return (
            <button
              key={doctor}
              onClick={() => toggleDoctor(doctor)}
              className={`px-2 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#b4988d]/10 border-[#b4988d] text-[#6d4e42]'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}
            >
              {doctor}
            </button>
          );
        })}
      </div>

      {/* 필터 초기화 */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="text-xs text-[#8a8a8a] hover:text-[#6d4e42] underline cursor-pointer"
        >
          필터 초기화
        </button>
      )}

      {/* 통계 */}
      <div className="ml-auto flex items-center gap-2 text-xs">
        <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full font-medium">
          진행 {stats.active}
        </span>
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
          대기 {stats.waiting}
        </span>
        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
          완료 {stats.completed}
        </span>
        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full font-medium">
          빈방 {stats.emptyRooms}/{stats.totalRooms}
        </span>
      </div>
    </div>
  );
}
