'use client';

import { useState } from 'react';
import type { RoomConfig, OperationCase, TreatmentType, RoomType } from '@/types/admin';
import {
  ROOM_TYPE_LABELS,
  TREATMENT_TYPE_LABELS,
  TREATMENT_TYPE_ICONS,
  TREATMENT_TYPE_FLOOR_COLORS,
  DOCTOR_OPTIONS,
  DEFAULT_TREATMENT_CONFIGS,
  PROCEDURE_OPTIONS_BY_TYPE,
  DURATION_OPTIONS,
  getOptionsForRoomType,
  getDefaultTreatmentForRoom,
} from '@/types/admin';
import { getCaseProgress, getProgressColor, formatElapsed } from './useElapsedTimer';
import type { RoomCaseState } from './FloorMap';

interface RoomDetailPanelProps {
  room: RoomConfig;
  roomState?: RoomCaseState;
  onClose: () => void;
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

// ─── 진행바 ──────────────────────────
function CaseProgressBar({ percent }: { percent: number }) {
  const color = getProgressColor(percent);
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ─── 진행 중 케이스 카드 ──────────────
function ActiveCaseCard({
  case_, onComplete, onMoveToLounge, onCancel,
}: {
  case_: OperationCase;
  onComplete: () => void;
  onMoveToLounge: () => void;
  onCancel: () => void;
}) {
  const progress = getCaseProgress(case_.actualStart, case_.expectedDurationMin);
  const treatmentColors = TREATMENT_TYPE_FLOOR_COLORS[case_.treatmentType];

  return (
    <div className="flex-1 min-w-[320px]">
      {/* 환자 정보 */}
      <div className="flex items-center gap-3 mb-3">
        <span className="font-bold text-base text-[#6d4e42]">{case_.patientName}</span>
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{
            backgroundColor: treatmentColors.fill,
            color: treatmentColors.text,
            border: `1px solid ${treatmentColors.border}`,
          }}
        >
          {TREATMENT_TYPE_ICONS[case_.treatmentType]} {TREATMENT_TYPE_LABELS[case_.treatmentType]}
        </span>
        {case_.location === 'LOUNGE' && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            &#x1F4CD; 대기실
          </span>
        )}
      </div>

      {/* 정보 그리드 */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3">
        <div>
          <span className="text-[#8a8a8a] block">시술</span>
          <span className="text-[#575756] font-medium">{case_.procedure}</span>
        </div>
        <div>
          <span className="text-[#8a8a8a] block">담당의</span>
          <span className="text-[#575756] font-medium">{case_.doctor}</span>
        </div>
        <div>
          <span className="text-[#8a8a8a] block">접수 시각</span>
          <span className="text-[#575756] font-medium">
            {new Date(case_.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* 진행률 + 예상 종료 시간 */}
      <div className="bg-[#f6f6f6] rounded-lg px-4 py-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#8a8a8a]">진행률</span>
          <span className={`text-sm font-bold ${progress.isOvertime ? 'text-red-500' : 'text-[#6d4e42]'}`}>
            {formatElapsed(progress.elapsed)} / {case_.expectedDurationMin}분
            {progress.isOvertime && (
              <span className="text-red-500 ml-1">
                (+{formatElapsed(progress.elapsed - case_.expectedDurationMin)} 초과)
              </span>
            )}
          </span>
        </div>
        <CaseProgressBar percent={progress.percent} />
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-[#8a8a8a]">
            경과 {formatElapsed(progress.elapsed)}
          </span>
          <span className="text-[10px] font-medium text-[#6d4e42]">
            {Math.round(progress.percent)}%
          </span>
          <span className="text-[10px] text-[#8a8a8a]">
            남은 {formatElapsed(progress.remaining)}
          </span>
        </div>
        {progress.estimatedEndTime && (
          <div className="mt-2 text-center py-1 bg-white rounded border border-[#e5e5e5]">
            <span className={`text-xs font-medium ${progress.isOvertime ? 'text-red-500' : 'text-[#6d4e42]'}`}>
              {progress.isOvertime
                ? `\u23F0 예상 종료 시간 초과 (${progress.estimatedEndTime})`
                : `\u23F0 예상 종료: ${progress.estimatedEndTime}`}
            </span>
          </div>
        )}
      </div>

      {/* 메모 */}
      {case_.memo && (
        <div className="text-xs bg-[#b4988d]/5 border border-[#b4988d]/20 rounded-lg px-3 py-2 mb-3">
          <span className="text-[#8a8a8a] block mb-0.5">메모</span>
          <span className="text-[#6d4e42]">{case_.memo}</span>
        </div>
      )}

      {/* 액션 */}
      <div className="flex gap-2">
        <button
          onClick={onComplete}
          className="px-4 py-2 text-xs text-white bg-[#b4988d] hover:bg-[#a08878] rounded-lg transition-colors cursor-pointer font-medium"
        >
          완료
        </button>
        {case_.location === 'ROOM' && (
          <button
            onClick={onMoveToLounge}
            className="px-4 py-2 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            대기실 이동
          </button>
        )}
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
        >
          취소
        </button>
      </div>
    </div>
  );
}

// ─── 인라인 새 케이스 폼 (방 타입별 필터링) ──────────────
function InlineAddCaseForm({
  roomId, roomType, onAdd, onCancel,
}: {
  roomId: string;
  roomType: RoomType;
  onAdd: (roomId: string, data: {
    patientName: string;
    treatmentType: TreatmentType;
    doctor: string;
    procedure: string;
    expectedDurationMin: number;
    memo?: string;
  }) => void;
  onCancel: () => void;
}) {
  const allowedTypes = getOptionsForRoomType(roomType);
  const defaultType = getDefaultTreatmentForRoom(roomType);
  const defaultConfig = DEFAULT_TREATMENT_CONFIGS.find((c) => c.type === defaultType);

  const [form, setForm] = useState({
    patientName: '',
    treatmentType: defaultType,
    doctor: DOCTOR_OPTIONS[0] as string,
    procedure: PROCEDURE_OPTIONS_BY_TYPE[defaultType][0] as string,
    expectedDurationMin: defaultConfig?.defaultDurationMin || 60,
    memo: '',
  });

  const handleTreatmentTypeChange = (type: TreatmentType) => {
    const config = DEFAULT_TREATMENT_CONFIGS.find((c) => c.type === type);
    const procedures = PROCEDURE_OPTIONS_BY_TYPE[type];
    setForm((f) => ({
      ...f,
      treatmentType: type,
      procedure: procedures[0] as string,
      expectedDurationMin: config?.defaultDurationMin || 60,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientName.trim()) return;
    onAdd(roomId, {
      patientName: form.patientName.trim(),
      treatmentType: form.treatmentType,
      doctor: form.doctor,
      procedure: form.procedure,
      expectedDurationMin: form.expectedDurationMin,
      memo: form.memo.trim() || undefined,
    });
  };

  const procedureOptions = PROCEDURE_OPTIONS_BY_TYPE[form.treatmentType];

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* 환자명 */}
      <div>
        <label className="block text-[10px] font-medium text-[#8a8a8a] mb-0.5">환자명 *</label>
        <input
          type="text"
          value={form.patientName}
          onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
          placeholder="홍길동"
          className="w-full border border-[#e5e5e5] rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
          required
          autoFocus
        />
      </div>

      {/* 유형 버튼 - 방 타입에 따라 필터링 */}
      <div>
        <label className="block text-[10px] font-medium text-[#8a8a8a] mb-1">유형</label>
        <div className="flex gap-1.5">
          {allowedTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleTreatmentTypeChange(type)}
              className={`py-1 px-2 rounded text-[10px] font-medium border transition-all cursor-pointer ${
                form.treatmentType === type
                  ? 'border-[#b4988d] bg-[#b4988d]/10 text-[#6d4e42]'
                  : 'border-[#e5e5e5] text-[#8a8a8a] hover:border-[#b4988d]/50'
              }`}
            >
              {TREATMENT_TYPE_ICONS[type]} {TREATMENT_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <select
          value={form.procedure}
          onChange={(e) => setForm((f) => ({ ...f, procedure: e.target.value }))}
          className="border border-[#e5e5e5] rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#b4988d]/30"
        >
          {procedureOptions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={form.doctor}
          onChange={(e) => setForm((f) => ({ ...f, doctor: e.target.value }))}
          className="border border-[#e5e5e5] rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#b4988d]/30"
        >
          {DOCTOR_OPTIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={form.expectedDurationMin}
          onChange={(e) => setForm((f) => ({ ...f, expectedDurationMin: parseInt(e.target.value) }))}
          className="border border-[#e5e5e5] rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#b4988d]/30"
        >
          {DURATION_OPTIONS.map((d) => (
            <option key={d} value={d}>{d}분</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-1.5 text-xs text-white bg-[#b4988d] hover:bg-[#a08878] rounded transition-colors cursor-pointer font-medium"
        >
          추가
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 text-xs text-[#8a8a8a] hover:text-[#6d4e42] bg-[#f6f6f6] hover:bg-[#e5e5e5] rounded transition-colors cursor-pointer"
        >
          취소
        </button>
      </div>
    </form>
  );
}

// ─── 메인 패널 ──────────────────────────
export default function RoomDetailPanel({
  room, roomState, onClose,
  onCompleteCase, onCancelCase, onMoveToLounge, onStartCase, onAddCase,
}: RoomDetailPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const activeCase = roomState?.activeCase;
  const loungeCase = roomState?.loungeCase;
  const waitingCases = roomState?.waitingCases || [];
  const allWaiting = [...waitingCases, ...(loungeCase ? [loungeCase] : [])];

  return (
    <div className="w-full bg-white border-t border-[#e5e5e5] overflow-hidden">
      {/* 헤더 바 */}
      <div className="px-5 py-2.5 border-b border-[#e5e5e5] flex items-center justify-between bg-[#fafafa]">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-sm text-[#6d4e42]">{room.name}</h3>
          <span className="text-xs text-[#8a8a8a]">{ROOM_TYPE_LABELS[room.type]}</span>
          {activeCase && (
            <span
              className="px-2 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: TREATMENT_TYPE_FLOOR_COLORS[activeCase.treatmentType].fill,
                color: TREATMENT_TYPE_FLOOR_COLORS[activeCase.treatmentType].text,
                border: `1px solid ${TREATMENT_TYPE_FLOOR_COLORS[activeCase.treatmentType].border}`,
              }}
            >
              {TREATMENT_TYPE_ICONS[activeCase.treatmentType]} {TREATMENT_TYPE_LABELS[activeCase.treatmentType]} 진행 중
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="px-3 py-1 text-xs font-medium text-[#b4988d] hover:text-[#6d4e42] bg-[#b4988d]/10 hover:bg-[#b4988d]/20 rounded-lg transition-colors cursor-pointer"
          >
            + 새 케이스
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#e5e5e5] text-[#8a8a8a] hover:text-[#6d4e42] transition-colors cursor-pointer"
          >
            &#x2715;
          </button>
        </div>
      </div>

      <div className="p-5">
        {activeCase ? (
          <div className="flex gap-6">
            {/* 진행 중 케이스 */}
            <ActiveCaseCard
              case_={activeCase}
              onComplete={() => onCompleteCase(activeCase.id)}
              onMoveToLounge={() => onMoveToLounge(activeCase.id)}
              onCancel={() => onCancelCase(activeCase.id)}
            />

            {/* 구분선 + 대기 큐 */}
            {allWaiting.length > 0 && (
              <>
                <div className="w-px bg-[#e5e5e5] self-stretch" />
                <div className="min-w-[220px]">
                  <span className="text-xs text-[#8a8a8a] font-medium block mb-2">
                    대기 ({allWaiting.length})
                  </span>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {allWaiting.map((c) => (
                      <div key={c.id} className="bg-[#f6f6f6] rounded-lg p-2.5 border border-[#e5e5e5]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-[#6d4e42]">
                            {TREATMENT_TYPE_ICONS[c.treatmentType]} {c.patientName}
                          </span>
                          {c.location === 'LOUNGE' && (
                            <span className="text-[9px] px-1 py-0.5 bg-amber-50 text-amber-600 rounded">대기실</span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#8a8a8a] mb-1.5">
                          {c.procedure} &middot; {c.doctor} &middot; {c.expectedDurationMin}분
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => onCancelCase(c.id)}
                            className="text-[10px] px-2 py-0.5 text-red-400 hover:text-red-600 bg-red-50 rounded cursor-pointer"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* 빈 방 */
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#f6f6f6] flex items-center justify-center text-xl">
              &#x1F3E0;
            </div>
            <div>
              <p className="text-sm text-[#8a8a8a]">비어 있는 방</p>
              <p className="text-xs text-[#c4c4c4]">
                {allWaiting.length > 0
                  ? `대기 중인 케이스 ${allWaiting.length}건`
                  : '새 케이스를 추가해주세요'}
              </p>
            </div>
            {/* 대기 케이스 */}
            {allWaiting.length > 0 && (
              <div className="ml-4 flex gap-2">
                {allWaiting.map((c) => (
                  <div key={c.id} className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <div className="text-xs font-medium text-amber-700">
                      {TREATMENT_TYPE_ICONS[c.treatmentType]} {c.patientName}
                    </div>
                    <div className="text-[10px] text-amber-600">{c.procedure}</div>
                    <button
                      onClick={() => onStartCase(c.id)}
                      className="mt-1 text-[10px] px-2 py-0.5 text-white bg-[#b4988d] hover:bg-[#a08878] rounded cursor-pointer"
                    >
                      시작
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 인라인 추가 폼 - 방 타입 전달 */}
        {showAddForm && (
          <div className="mt-4 pt-4 border-t border-[#e5e5e5]">
            <span className="text-xs text-[#8a8a8a] font-medium block mb-2">새 케이스 추가</span>
            <InlineAddCaseForm
              roomId={room.id}
              roomType={room.type}
              onAdd={(roomId, data) => {
                onAddCase(roomId, data);
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
