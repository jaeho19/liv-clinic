'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TREATMENT_TYPES,
  TREATMENT_TYPE_LABELS,
  TREATMENT_TYPE_ICONS,
  DOCTOR_OPTIONS,
  DEFAULT_TREATMENT_CONFIGS,
  PROCEDURE_OPTIONS_BY_TYPE,
  DURATION_OPTIONS,
} from '@/types/admin';
import type { OperationCase, TreatmentType, CaseStatus } from '@/types/admin';
import FloorMap from '@/components/admin/floormap/FloorMap';

// ─── API fetch ──────────────────────────────────────────
async function fetchCases(): Promise<OperationCase[]> {
  const res = await fetch('/api/admin/operations');
  if (!res.ok) throw new Error('운영 현황을 불러오지 못했습니다.');
  return res.json();
}

// ─── API 호출 헬퍼 ──────────────────────────────────
async function apiPatch(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/admin/operations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '업데이트에 실패했습니다.');
  }
  return res.json();
}

async function apiPost(body: Record<string, unknown>) {
  const res = await fetch('/api/admin/operations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '생성에 실패했습니다.');
  }
  return res.json();
}

async function apiDelete(id: string) {
  const res = await fetch(`/api/admin/operations/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '삭제에 실패했습니다.');
  }
}

// ─── 메인 컴포넌트 ──────────────────────────────────
export default function OperationsPage() {
  const [cases, setCases] = useState<OperationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [kanbanOpen, setKanbanOpen] = useState(false);

  // 데이터 로드
  const loadCases = useCallback(async () => {
    try {
      const data = await fetchCases();
      setCases(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCases(); }, [loadCases]);

  // 30초마다 경과시간 갱신
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // 새 케이스 추가 (글로벌 모달용)
  const addCase = useCallback(async (newCase: Omit<OperationCase, 'id' | 'createdAt'>) => {
    try {
      await apiPost(newCase);
      await loadCases();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    }
  }, [loadCases]);

  // 방에 새 케이스 추가 (방이 점유 중이면 자동 대기)
  const addCaseForRoom = useCallback(async (roomId: string, data: {
    patientName: string;
    treatmentType: TreatmentType;
    doctor: string;
    procedure: string;
    expectedDurationMin: number;
    memo?: string;
  }) => {
    try {
      const hasActive = cases.some(
        (c) => c.roomId === roomId && c.status === 'IN_PROGRESS' && c.location === 'ROOM'
      );
      const now = new Date().toISOString();
      await apiPost({
        ...data,
        roomId,
        status: hasActive ? 'WAITING' : 'IN_PROGRESS',
        location: hasActive ? 'LOUNGE' : 'ROOM',
        actualStart: hasActive ? null : now,
      });
      await loadCases();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    }
  }, [cases, loadCases]);

  // 케이스 완료
  const completeCase = useCallback(async (caseId: string) => {
    try {
      await apiPatch(caseId, { status: 'COMPLETED' });
      await loadCases();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    }
  }, [loadCases]);

  // 케이스 삭제/취소
  const cancelCase = useCallback(async (caseId: string) => {
    try {
      await apiDelete(caseId);
      await loadCases();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    }
  }, [loadCases]);

  // 대기실로 이동
  const moveToLounge = useCallback(async (caseId: string) => {
    try {
      await apiPatch(caseId, { location: 'LOUNGE' });
      await loadCases();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    }
  }, [loadCases]);

  // 대기 케이스 시작
  const startCase = useCallback(async (caseId: string) => {
    const target = cases.find((c) => c.id === caseId);
    if (!target) return;
    const hasActive = cases.some((c) =>
      c.roomId === target.roomId && c.id !== caseId &&
      c.status === 'IN_PROGRESS' && c.location === 'ROOM'
    );
    if (hasActive) return;
    try {
      await apiPatch(caseId, {
        status: 'IN_PROGRESS',
        location: 'ROOM',
        actualStart: new Date().toISOString(),
      });
      await loadCases();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    }
  }, [cases, loadCases]);

  // 통계
  const activeCount = cases.filter((c) => c.status === 'IN_PROGRESS').length;
  const waitingCount = cases.filter((c) => c.status === 'WAITING').length;
  const completedCount = cases.filter((c) => c.status === 'COMPLETED').length;

  const todayStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });

  // 칸반 그룹
  const kanbanGroups = useMemo(() => ({
    waiting: cases.filter((c) => c.status === 'WAITING'),
    consult: cases.filter((c) => c.status === 'IN_PROGRESS' && c.treatmentType === 'CONSULT'),
    anesthesia: cases.filter((c) => c.status === 'IN_PROGRESS' && c.treatmentType === 'ANESTHESIA'),
    treatment: cases.filter((c) => c.status === 'IN_PROGRESS' && (c.treatmentType === 'PROCEDURE' || c.treatmentType === 'SKINCARE')),
    completed: cases.filter((c) => c.status === 'COMPLETED'),
  }), [cases]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#b4988d] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-[#8a8a8a] text-sm">운영 현황을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#6d4e42]">운영현황</h2>
          <p className="text-sm text-[#8a8a8a] mt-0.5">{todayStr}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 text-sm">
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-medium">
              진행 {activeCount}
            </span>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
              대기 {waitingCount}
            </span>
            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
              완료 {completedCount}
            </span>
            <span className="px-2.5 py-1 bg-[#b4988d]/10 text-[#6d4e42] rounded-full font-medium">
              전체 {cases.length}
            </span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#b4988d] text-white rounded-lg text-sm font-medium hover:bg-[#a08878] transition-colors cursor-pointer"
          >
            + 새 케이스
          </button>
        </div>
      </div>

      {/* 평면도 */}
      <FloorMap
        cases={cases}
        onCompleteCase={completeCase}
        onCancelCase={cancelCase}
        onMoveToLounge={moveToLounge}
        onStartCase={startCase}
        onAddCase={addCaseForRoom}
      />

      {/* 칸반 보드 */}
      <div className="mt-6">
        <button
          onClick={() => setKanbanOpen((v) => !v)}
          className="flex items-center gap-2 mb-3 text-sm font-bold text-[#6d4e42] cursor-pointer hover:text-[#b4988d] transition-colors"
        >
          <span className={`transition-transform ${kanbanOpen ? 'rotate-90' : ''}`}>&#x25B6;</span>
          칸반 보드
          <span className="text-xs font-normal text-[#8a8a8a] ml-1">
            (진행 {activeCount} / 대기 {waitingCount} / 완료 {completedCount})
          </span>
        </button>
        {kanbanOpen && (
          <div className="grid grid-cols-5 gap-3 min-h-[280px]">
            <KanbanColumn label="대기" colorKey="amber" items={kanbanGroups.waiting} onComplete={completeCase} onCancel={cancelCase} onStart={startCase} />
            <KanbanColumn label="상담" colorKey="gray" items={kanbanGroups.consult} onComplete={completeCase} onCancel={cancelCase} />
            <KanbanColumn label="마취" colorKey="blue" items={kanbanGroups.anesthesia} onComplete={completeCase} onCancel={cancelCase} />
            <KanbanColumn label="시술/관리" colorKey="purple" items={kanbanGroups.treatment} onComplete={completeCase} onCancel={cancelCase} />
            <KanbanColumn label="완료" colorKey="grayLight" items={kanbanGroups.completed} onCancel={cancelCase} isCompleted />
          </div>
        )}
      </div>

      {/* 새 케이스 모달 */}
      {showAddModal && (
        <AddCaseModal
          onAdd={(data) => { addCase(data); setShowAddModal(false); }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

// ─── 칸반 컬럼 ──────────────────────────────────────
const KANBAN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  amber:     { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  gray:      { bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200' },
  blue:      { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  purple:    { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  grayLight: { bg: 'bg-gray-50',   text: 'text-gray-500',   border: 'border-gray-200' },
};

function KanbanColumn({
  label, colorKey, items, onComplete, onCancel, onStart, isCompleted,
}: {
  label: string;
  colorKey: string;
  items: OperationCase[];
  onComplete?: (id: string) => void;
  onCancel: (id: string) => void;
  onStart?: (id: string) => void;
  isCompleted?: boolean;
}) {
  const c = KANBAN_COLORS[colorKey] || KANBAN_COLORS.gray;
  return (
    <div className={`${c.bg} rounded-xl border ${c.border} p-3 flex flex-col`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-bold text-sm ${c.text}`}>{label}</h3>
        <span className={`text-xs font-medium ${c.text} px-2 py-0.5 rounded-full border ${c.border}`}>
          {items.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-xs text-[#8a8a8a] text-center py-8">비어 있음</p>
        ) : items.map((item) => (
          <KanbanCard key={item.id} item={item} onComplete={onComplete} onCancel={onCancel} onStart={onStart} isCompleted={isCompleted} />
        ))}
      </div>
    </div>
  );
}

function KanbanCard({
  item, onComplete, onCancel, onStart, isCompleted,
}: {
  item: OperationCase;
  onComplete?: (id: string) => void;
  onCancel: (id: string) => void;
  onStart?: (id: string) => void;
  isCompleted?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-[#e5e5e5] p-3 shadow-sm">
      <div className="flex items-start justify-between mb-1.5">
        <span className="font-medium text-sm text-[#6d4e42]">{item.patientName}</span>
        <span className="text-xs bg-[#b4988d]/10 text-[#6d4e42] px-1.5 py-0.5 rounded">
          {TREATMENT_TYPE_ICONS[item.treatmentType]} {item.procedure}
        </span>
      </div>
      <div className="text-xs text-[#8a8a8a] space-y-0.5 mb-2">
        <p>담당: {item.doctor}</p>
        {item.location === 'LOUNGE' && (
          <p className="text-blue-600 font-medium">&#x1F4CD; 대기실</p>
        )}
      </div>
      {isCompleted ? (
        <button
          onClick={() => onCancel(item.id)}
          className="w-full text-xs text-red-400 hover:text-red-600 py-1 cursor-pointer"
        >
          삭제
        </button>
      ) : (
        <div className="flex gap-1.5">
          {item.status === 'WAITING' && onStart && (
            <button
              onClick={() => onStart(item.id)}
              className="flex-1 text-xs text-white bg-[#b4988d] hover:bg-[#a08878] rounded py-1.5 transition-colors cursor-pointer"
            >
              시작
            </button>
          )}
          {item.status === 'IN_PROGRESS' && onComplete && (
            <button
              onClick={() => onComplete(item.id)}
              className="flex-1 text-xs text-white bg-[#b4988d] hover:bg-[#a08878] rounded py-1.5 transition-colors cursor-pointer"
            >
              완료
            </button>
          )}
          <button
            onClick={() => onCancel(item.id)}
            className="flex-1 text-xs text-[#8a8a8a] hover:text-[#6d4e42] bg-[#f6f6f6] hover:bg-[#e5e5e5] rounded py-1.5 transition-colors cursor-pointer"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}

// ─── 새 케이스 모달 ──────────────────────────────────
function AddCaseModal({
  onAdd, onClose,
}: {
  onAdd: (data: Omit<OperationCase, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    patientName: '',
    treatmentType: 'PROCEDURE' as TreatmentType,
    doctor: DOCTOR_OPTIONS[0] as string,
    procedure: PROCEDURE_OPTIONS_BY_TYPE['PROCEDURE'][0] as string,
    expectedDurationMin: 60,
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
    onAdd({
      patientName: form.patientName.trim(),
      treatmentType: form.treatmentType,
      status: 'WAITING',
      location: 'LOUNGE',
      doctor: form.doctor,
      procedure: form.procedure,
      expectedDurationMin: form.expectedDurationMin,
      roomId: 'cons-1',
      memo: form.memo.trim() || undefined,
    });
  };

  const procedureOptions = PROCEDURE_OPTIONS_BY_TYPE[form.treatmentType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl border border-[#e5e5e5] shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-[#e5e5e5]">
          <h3 className="font-bold text-[#6d4e42]">새 케이스 추가</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 환자명 */}
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">
              환자명 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.patientName}
              onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
              placeholder="홍길동"
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              required
              autoFocus
            />
          </div>

          {/* 유형 */}
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">
              유형 <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TREATMENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTreatmentTypeChange(type)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
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

          {/* 시술 + 소요시간 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#575756] mb-1">시술</label>
              <select
                value={form.procedure}
                onChange={(e) => setForm((f) => ({ ...f, procedure: e.target.value }))}
                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              >
                {procedureOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">소요(분)</label>
              <select
                value={form.expectedDurationMin}
                onChange={(e) => setForm((f) => ({ ...f, expectedDurationMin: parseInt(e.target.value) }))}
                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}분</option>
                ))}
              </select>
            </div>
          </div>

          {/* 담당의 */}
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">담당의</label>
            <select
              value={form.doctor}
              onChange={(e) => setForm((f) => ({ ...f, doctor: e.target.value }))}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
            >
              {DOCTOR_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">메모</label>
            <textarea
              value={form.memo}
              onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
              placeholder="특이사항, 요청사항 등"
              rows={2}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d] resize-none"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#e5e5e5] rounded-lg text-sm text-[#8a8a8a] hover:bg-[#f6f6f6] transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#b4988d] text-white rounded-lg text-sm font-medium hover:bg-[#a08878] transition-colors cursor-pointer"
            >
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
