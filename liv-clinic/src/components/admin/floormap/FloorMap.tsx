'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import type { OperationCase, TreatmentType, FloorMapFiltersV2 } from '@/types/admin';
import { ROOM_CONFIGS } from './roomConfig';
import { useElapsedTimer } from './useElapsedTimer';
import RoomOverlay from './RoomOverlay';
import RoomTooltip from './RoomTooltip';
import RoomDetailPanel from './RoomDetailPanel';
import StatusLegend from './StatusLegend';

// Room 별 케이스 상태
export interface RoomCaseState {
  activeCase?: OperationCase;       // IN_PROGRESS + location ROOM
  waitingCases: OperationCase[];    // status WAITING
  loungeCase?: OperationCase;       // IN_PROGRESS + location LOUNGE
}

interface FloorMapProps {
  cases: OperationCase[];
  onCompleteCase: (caseId: string) => void;
  onCancelCase: (caseId: string) => void;
  onMoveToLounge: (caseId: string) => void;
  onStartCase: (caseId: string) => void;
  onAddCase: (roomId: string, data: {
    patientName: string;
    treatmentType: TreatmentType;
    doctor: string;
    procedure: string;
    expectedDurationMin: number;
    memo?: string;
  }) => void;
}

export default function FloorMap({
  cases, onCompleteCase, onCancelCase, onMoveToLounge, onStartCase, onAddCase,
}: FloorMapProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<{ roomId: string; x: number; y: number } | null>(null);
  const [filters, setFilters] = useState<FloorMapFiltersV2>({ treatmentTypes: [], doctors: [] });

  // 경과시간 갱신 (30초 간격)
  useElapsedTimer(30000);

  // room → case state 매핑
  const roomCaseMap = useMemo(() => {
    const map = new Map<string, RoomCaseState>();
    for (const c of cases) {
      if (!c.roomId || c.status === 'CANCELLED') continue;
      if (!map.has(c.roomId)) {
        map.set(c.roomId, { waitingCases: [] });
      }
      const state = map.get(c.roomId)!;
      if (c.status === 'IN_PROGRESS' && c.location === 'ROOM') {
        state.activeCase = c;
      } else if (c.status === 'IN_PROGRESS' && c.location === 'LOUNGE') {
        state.loungeCase = c;
      } else if (c.status === 'WAITING') {
        state.waitingCases.push(c);
      }
    }
    return map;
  }, [cases]);

  // 필터 적용
  const isRoomFiltered = useCallback(
    (roomId: string) => {
      const state = roomCaseMap.get(roomId);
      const noFilters = filters.treatmentTypes.length === 0 && filters.doctors.length === 0;
      if (noFilters) return true;
      if (!state?.activeCase) return false;
      const typeOk = filters.treatmentTypes.length === 0 || filters.treatmentTypes.includes(state.activeCase.treatmentType);
      const doctorOk = filters.doctors.length === 0 || filters.doctors.includes(state.activeCase.doctor);
      return typeOk && doctorOk;
    },
    [roomCaseMap, filters],
  );

  // 통계
  const stats = useMemo(() => {
    const activeCases = cases.filter((c) => c.status === 'IN_PROGRESS');
    const waitingCases = cases.filter((c) => c.status === 'WAITING');
    const completedCases = cases.filter((c) => c.status === 'COMPLETED');
    const occupiedRoomIds = new Set(
      cases.filter((c) => c.status === 'IN_PROGRESS' && c.location === 'ROOM').map((c) => c.roomId)
    );
    const functionalRooms = ROOM_CONFIGS.filter((r) =>
      r.type !== 'office' && r.type !== 'utility' && r.type !== 'waiting'
    );
    const emptyRooms = functionalRooms.length - occupiedRoomIds.size;
    return {
      active: activeCases.length,
      waiting: waitingCases.length,
      completed: completedCases.length,
      emptyRooms,
      totalRooms: functionalRooms.length,
    };
  }, [cases]);

  const selectedRoom = selectedRoomId ? ROOM_CONFIGS.find((r) => r.id === selectedRoomId) : null;
  const selectedRoomState = selectedRoomId ? roomCaseMap.get(selectedRoomId) : undefined;
  const hoveredRoomConfig = hoveredRoom ? ROOM_CONFIGS.find((r) => r.id === hoveredRoom.roomId) : null;
  const hoveredRoomState = hoveredRoom ? roomCaseMap.get(hoveredRoom.roomId) : undefined;

  return (
    <div className="flex flex-col" style={{ minHeight: '650px', height: 'calc(100vh - 220px)' }}>
      {/* 범례 + 필터 */}
      <StatusLegend
        filters={filters}
        onFiltersChange={setFilters}
        stats={stats}
      />

      {/* 메인 영역 */}
      <div className="flex flex-col flex-1 gap-0 rounded-xl border border-[#e5e5e5] overflow-hidden bg-white">
        {/* 평면도 — 이미지 기반 레이아웃 */}
        <div
          className="flex-1 overflow-auto flex items-start justify-center"
          style={{ backgroundColor: '#f9f8f5', padding: '16px' }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '1000px',
              aspectRatio: '2208 / 1952',
            }}
          >
            {/* 배경 도면 이미지 */}
            <Image
              src="/images/admin/floormap-color.png"
              alt="LIV 클리닉 평면도"
              fill
              sizes="(max-width: 1200px) 100vw, 1000px"
              style={{ objectFit: 'contain', borderRadius: '12px' }}
              priority
            />

            {/* 방 오버레이 */}
            {ROOM_CONFIGS.map((room) => {
              const state = roomCaseMap.get(room.id);
              return (
                <RoomOverlay
                  key={room.id}
                  room={room}
                  style={{
                    position: 'absolute',
                    left: `${room.bounds.x}%`,
                    top: `${room.bounds.y}%`,
                    width: `${room.bounds.width}%`,
                    height: `${room.bounds.height}%`,
                  }}
                  activeCase={state?.activeCase}
                  waitingCount={(state?.waitingCases.length || 0) + (state?.loungeCase ? 1 : 0)}
                  isSelected={selectedRoomId === room.id}
                  isFiltered={isRoomFiltered(room.id)}
                  onClick={() => setSelectedRoomId(room.id === selectedRoomId ? null : room.id)}
                  onMouseEnter={(e) =>
                    setHoveredRoom({ roomId: room.id, x: e.clientX, y: e.clientY })
                  }
                  onMouseLeave={() => setHoveredRoom(null)}
                />
              );
            })}
          </div>
        </div>

        {/* 상세 패널 (하단) */}
        {selectedRoom && (
          <RoomDetailPanel
            room={selectedRoom}
            roomState={selectedRoomState}
            onClose={() => setSelectedRoomId(null)}
            onCompleteCase={onCompleteCase}
            onCancelCase={onCancelCase}
            onMoveToLounge={onMoveToLounge}
            onStartCase={onStartCase}
            onAddCase={onAddCase}
          />
        )}
      </div>

      {/* 툴팁 */}
      {hoveredRoomConfig && hoveredRoom && hoveredRoom.roomId !== selectedRoomId && (
        <RoomTooltip
          room={hoveredRoomConfig}
          roomState={hoveredRoomState}
          position={{ x: hoveredRoom.x, y: hoveredRoom.y }}
        />
      )}
    </div>
  );
}
