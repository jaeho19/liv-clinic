'use client';

import type { RoomConfig } from '@/types/admin';
import {
  ROOM_TYPE_LABELS,
  TREATMENT_TYPE_LABELS,
  TREATMENT_TYPE_ICONS,
  TREATMENT_TYPE_FLOOR_COLORS,
} from '@/types/admin';
import { getCaseProgress, formatElapsed, getProgressColor } from './useElapsedTimer';
import type { RoomCaseState } from './FloorMap';

interface RoomTooltipProps {
  room: RoomConfig;
  roomState?: RoomCaseState;
  position: { x: number; y: number };
}

export default function RoomTooltip({ room, roomState, position }: RoomTooltipProps) {
  const activeCase = roomState?.activeCase;
  const waitingCount = (roomState?.waitingCases.length || 0) + (roomState?.loungeCase ? 1 : 0);

  return (
    <div
      className="fixed z-50 pointer-events-none bg-white rounded-lg shadow-lg border border-[#e5e5e5] p-3 min-w-[200px] max-w-[280px]"
      style={{
        left: `${position.x + 12}px`,
        top: `${position.y - 8}px`,
      }}
    >
      {/* 방 이름/유형 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="font-bold text-sm text-[#6d4e42]">{room.name}</span>
        <span className="text-xs px-1.5 py-0.5 bg-[#f6f6f6] text-[#8a8a8a] rounded">
          {ROOM_TYPE_LABELS[room.type]}
        </span>
      </div>

      {activeCase ? (
        <>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#8a8a8a]">환자</span>
              <span className="font-medium text-[#575756]">{activeCase.patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8a8a8a]">유형</span>
              <span
                className="px-1.5 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: TREATMENT_TYPE_FLOOR_COLORS[activeCase.treatmentType].fill,
                  color: TREATMENT_TYPE_FLOOR_COLORS[activeCase.treatmentType].text,
                }}
              >
                {TREATMENT_TYPE_ICONS[activeCase.treatmentType]} {TREATMENT_TYPE_LABELS[activeCase.treatmentType]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8a8a8a]">시술</span>
              <span className="text-[#575756]">{activeCase.procedure}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8a8a8a]">담당의</span>
              <span className="text-[#575756]">{activeCase.doctor}</span>
            </div>
            {/* 진행률 */}
            {activeCase.actualStart && (() => {
              const progress = getCaseProgress(activeCase.actualStart, activeCase.expectedDurationMin);
              return (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#8a8a8a]">진행률</span>
                    <span className="font-medium text-[#575756]">
                      {formatElapsed(progress.elapsed)} / {activeCase.expectedDurationMin}분
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(progress.percent, 100)}%`,
                        backgroundColor: getProgressColor(progress.percent),
                      }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
          {waitingCount > 0 && (
            <div className="mt-2 pt-1.5 border-t border-[#e5e5e5]">
              <span className="text-[10px] text-amber-600 font-medium">
                + 대기 {waitingCount}건
              </span>
            </div>
          )}
          <div className="mt-2 pt-2 border-t border-[#e5e5e5] text-[10px] text-[#b4988d]">
            클릭하여 상세보기
          </div>
        </>
      ) : waitingCount > 0 ? (
        <>
          <p className="text-xs text-amber-600 font-medium">대기 {waitingCount}건</p>
          <div className="mt-2 pt-2 border-t border-[#e5e5e5] text-[10px] text-[#b4988d]">
            클릭하여 상세보기
          </div>
        </>
      ) : (
        <p className="text-xs text-[#8a8a8a]">비어 있는 방입니다</p>
      )}
    </div>
  );
}
