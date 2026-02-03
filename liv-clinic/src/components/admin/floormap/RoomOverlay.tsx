'use client';

import type { RoomConfig, OperationCase } from '@/types/admin';
import { TREATMENT_TYPE_FLOOR_COLORS, TREATMENT_TYPE_ICONS, TREATMENT_TYPE_LABELS } from '@/types/admin';
import { ROOM_TYPE_COLORS } from './roomConfig';
import { getCaseProgress, getProgressColor, formatElapsed } from './useElapsedTimer';

interface RoomOverlayProps {
  room: RoomConfig;
  activeCase?: OperationCase;
  waitingCount: number;
  isSelected: boolean;
  isFiltered: boolean;
  onClick: () => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  style?: React.CSSProperties;
}

export default function RoomOverlay({
  room,
  activeCase,
  waitingCount,
  isSelected,
  isFiltered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  style: externalStyle,
}: RoomOverlayProps) {
  const hasCase = !!activeCase;
  const isIvory = room.type === 'office' || room.type === 'utility' || room.type === 'waiting';

  // 색상
  const treatmentColors = activeCase ? TREATMENT_TYPE_FLOOR_COLORS[activeCase.treatmentType] : null;
  const typeColors = ROOM_TYPE_COLORS[room.type];

  // 진행률
  const progress = activeCase ? getCaseProgress(activeCase.actualStart, activeCase.expectedDurationMin) : null;
  const progressColor = progress ? getProgressColor(progress.percent) : '#22c55e';

  const bgColor = hasCase ? treatmentColors!.fill : typeColors.bg;
  const borderColor = hasCase
    ? (progress && progress.percent >= 120 ? '#ef4444' : treatmentColors!.border)
    : typeColors.border;
  const textColor = hasCase
    ? (progress && progress.percent >= 120 ? '#ef4444' : treatmentColors!.text)
    : typeColors.text;
  const opacity = isFiltered ? 1 : 0.25;
  const isLargeRoom = room.id === 'mgmt-9' || room.id === 'proc-1';

  // Box 공통 스타일
  const boxStyle: React.CSSProperties = {
    backgroundColor: bgColor,
    borderStyle: 'solid',
    borderColor,
    opacity,
    ...externalStyle,
  };

  // ── 아이보리 방: 빈 박스만 ──
  if (isIvory && !hasCase) {
    return (
      <div
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`cursor-pointer transition-all duration-200 rounded-xl overflow-hidden ${
          isSelected ? 'ring-2 ring-[#b4988d] ring-offset-2 z-20' : 'z-10'
        }`}
        style={{
          ...boxStyle,
          borderWidth: '1px',
        }}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative cursor-pointer transition-all duration-200 rounded-xl flex flex-col items-center justify-center overflow-hidden ${
        hasCase ? 'shadow-sm hover:shadow-lg' : 'hover:shadow-md'
      } ${
        progress && progress.percent >= 120 ? 'animate-pulse' : ''
      } ${
        isSelected ? 'ring-2 ring-[#b4988d] ring-offset-2 z-20 shadow-lg scale-[1.02]' : 'z-10 hover:scale-[1.01]'
      }`}
      style={{
        ...boxStyle,
        borderWidth: hasCase ? '2px' : '1px',
      }}
    >
      {/* 대기 배지 */}
      {waitingCount > 0 && (
        <div className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-amber-400 text-white text-[8px] font-bold flex items-center justify-center z-10">
          {waitingCount}
        </div>
      )}

      {/* 방 이름 */}
      {room.name && (
        <span
          className={`${isLargeRoom ? 'text-[15px]' : 'text-[13px]'} leading-tight font-semibold truncate max-w-full px-1`}
          style={{ color: textColor }}
        >
          {room.name}
        </span>
      )}

      {/* 환자 정보 (있을 때) */}
      {hasCase && (
        <>
          <span
            className={`${isLargeRoom ? 'text-[15px]' : 'text-[13px]'} leading-tight font-bold truncate max-w-full mt-0.5 px-1`}
            style={{ color: textColor }}
          >
            {TREATMENT_TYPE_ICONS[activeCase.treatmentType]} {activeCase.patientName}
          </span>
          <span
            className={`${isLargeRoom ? 'text-[13px]' : 'text-[11px]'} leading-tight mt-0.5 font-medium px-1`}
            style={{ color: progress && progress.isOvertime ? '#ef4444' : textColor }}
          >
            {progress && progress.elapsed > 0
              ? `${formatElapsed(progress.elapsed)} / ${activeCase.expectedDurationMin}분`
              : TREATMENT_TYPE_LABELS[activeCase.treatmentType]}
          </span>
          {/* 대형 방: 추가 정보 */}
          {isLargeRoom && (
            <>
              <span className="text-[12px] leading-tight mt-1 px-1 opacity-80" style={{ color: textColor }}>
                {activeCase.procedure}
              </span>
              <span className="text-[12px] leading-tight px-1 opacity-70" style={{ color: textColor }}>
                {activeCase.doctor}
              </span>
            </>
          )}
        </>
      )}

      {/* 빈 방 (기능 방만 표시) */}
      {!hasCase && !isIvory && (
        <span
          className={`${isLargeRoom ? 'text-[12px]' : 'text-[11px]'} mt-0.5 opacity-60`}
          style={{ color: textColor }}
        >
          ---
        </span>
      )}

      {/* 진행바 (하단) */}
      {hasCase && progress && progress.elapsed > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${Math.min(progress.percent, 100)}%`,
              backgroundColor: progressColor,
            }}
          />
        </div>
      )}
    </div>
  );
}
