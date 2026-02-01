'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  OPERATION_STAGES,
  OPERATION_STAGE_LABELS,
  OPERATION_STAGE_COLORS,
  PROCEDURE_TAG_OPTIONS,
  DOCTOR_OPTIONS,
} from '@/types/admin';
import type { OperationStage, PatientCase } from '@/types/admin';

// ─── Mock 데이터 ──────────────────────────────────────────
function createMockData(): PatientCase[] {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  return [
    {
      id: '1',
      name: '이지은',
      phone: '010-1234-5678',
      procedure: '보톡스',
      doctor: '천원장',
      stage: 'waiting',
      stageEnteredAt: `${today}T09:30:00`,
      createdAt: `${today}T09:15:00`,
      memo: '이마 + 눈가 요청',
    },
    {
      id: '2',
      name: '박서현',
      phone: '010-2345-6789',
      procedure: '필러',
      doctor: '김원장',
      stage: 'waiting',
      stageEnteredAt: `${today}T09:45:00`,
      createdAt: `${today}T09:30:00`,
    },
    {
      id: '3',
      name: '최유진',
      phone: '010-3456-7890',
      procedure: '울쎄라',
      doctor: '천원장',
      stage: 'anesthesia',
      stageEnteredAt: `${today}T09:20:00`,
      createdAt: `${today}T08:50:00`,
      memo: '마취 크림 도포 완료',
    },
    {
      id: '4',
      name: '정민서',
      phone: '010-4567-8901',
      procedure: '써마지',
      doctor: '천원장',
      stage: 'procedure',
      stageEnteredAt: `${today}T09:00:00`,
      createdAt: `${today}T08:30:00`,
    },
    {
      id: '5',
      name: '한소영',
      phone: '010-5678-9012',
      procedure: '실리프팅',
      doctor: '김원장',
      stage: 'procedure',
      stageEnteredAt: `${today}T09:10:00`,
      createdAt: `${today}T08:40:00`,
      memo: '양쪽 볼라인',
    },
    {
      id: '6',
      name: '김서연',
      phone: '010-6789-0123',
      procedure: '덴서티',
      doctor: '천원장',
      stage: 'recovery',
      stageEnteredAt: `${today}T09:40:00`,
      createdAt: `${today}T08:00:00`,
    },
    {
      id: '7',
      name: '오하나',
      phone: '010-7890-1234',
      procedure: '스킨부스터',
      doctor: '김원장',
      stage: 'completed',
      stageEnteredAt: `${today}T09:30:00`,
      createdAt: `${today}T08:00:00`,
    },
    {
      id: '8',
      name: '송지아',
      phone: '010-8901-2345',
      procedure: '인모드',
      doctor: '천원장',
      stage: 'completed',
      stageEnteredAt: `${today}T09:15:00`,
      createdAt: `${today}T07:30:00`,
    },
  ];
}

// ─── 유틸 ──────────────────────────────────────────
function maskPhone(phone: string): string {
  const parts = phone.split('-');
  if (parts.length === 3) {
    return `${parts[0]}-****-${parts[2]}`;
  }
  return phone;
}

function getElapsedMinutes(isoStr: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000));
}

function formatElapsed(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}시간 ${m}분`;
}

// ─── 메인 컴포넌트 ──────────────────────────────────
export default function OperationsPage() {
  const [cases, setCases] = useState<PatientCase[]>(createMockData);
  const [, setTick] = useState(0); // 경과시간 갱신용
  const [showAddModal, setShowAddModal] = useState(false);

  // 1분마다 경과시간 갱신
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  // 단계 이동
  const moveStage = useCallback((caseId: string, direction: 'next' | 'prev') => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const idx = OPERATION_STAGES.indexOf(c.stage);
        const newIdx = direction === 'next' ? idx + 1 : idx - 1;
        if (newIdx < 0 || newIdx >= OPERATION_STAGES.length) return c;
        return {
          ...c,
          stage: OPERATION_STAGES[newIdx],
          stageEnteredAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  // 새 케이스 추가
  const addCase = useCallback((newCase: Omit<PatientCase, 'id' | 'stage' | 'stageEnteredAt' | 'createdAt'>) => {
    const now = new Date().toISOString();
    setCases((prev) => [
      ...prev,
      {
        ...newCase,
        id: crypto.randomUUID(),
        stage: 'waiting',
        stageEnteredAt: now,
        createdAt: now,
      },
    ]);
  }, []);

  // 케이스 삭제
  const removeCase = useCallback((caseId: string) => {
    setCases((prev) => prev.filter((c) => c.id !== caseId));
  }, []);

  // 통계
  const activeCount = cases.filter((c) => c.stage !== 'completed').length;
  const completedCount = cases.filter((c) => c.stage === 'completed').length;

  const todayStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <div>
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#6d4e42]">운영현황</h2>
          <p className="text-sm text-[#8a8a8a] mt-0.5">{todayStr}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* 통계 배지 */}
          <div className="flex gap-2 text-sm">
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-medium">
              진행 {activeCount}
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

      {/* 칸반 보드 */}
      <div className="grid grid-cols-5 gap-3 min-h-[calc(100vh-200px)]">
        {OPERATION_STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            cases={cases.filter((c) => c.stage === stage)}
            onMove={moveStage}
            onRemove={removeCase}
          />
        ))}
      </div>

      {/* 새 케이스 모달 */}
      {showAddModal && (
        <AddCaseModal
          onAdd={(data) => {
            addCase(data);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

// ─── 칸반 컬럼 ──────────────────────────────────────
function KanbanColumn({
  stage,
  cases,
  onMove,
  onRemove,
}: {
  stage: OperationStage;
  cases: PatientCase[];
  onMove: (id: string, dir: 'next' | 'prev') => void;
  onRemove: (id: string) => void;
}) {
  const colors = OPERATION_STAGE_COLORS[stage];
  const label = OPERATION_STAGE_LABELS[stage];
  const stageIdx = OPERATION_STAGES.indexOf(stage);

  return (
    <div className={`${colors.bg} rounded-xl border ${colors.border} p-3 flex flex-col`}>
      {/* 컬럼 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-bold text-sm ${colors.text}`}>{label}</h3>
        <span className={`text-xs font-medium ${colors.text} ${colors.bg} px-2 py-0.5 rounded-full border ${colors.border}`}>
          {cases.length}
        </span>
      </div>

      {/* 카드 스택 */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {cases.length === 0 ? (
          <p className="text-xs text-[#8a8a8a] text-center py-8">비어 있음</p>
        ) : (
          cases.map((c) => (
            <PatientCard
              key={c.id}
              patient={c}
              canPrev={stageIdx > 0}
              canNext={stageIdx < OPERATION_STAGES.length - 1}
              onMove={onMove}
              onRemove={onRemove}
              isCompleted={stage === 'completed'}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── 환자 카드 ──────────────────────────────────────
function PatientCard({
  patient,
  canPrev,
  canNext,
  onMove,
  onRemove,
  isCompleted,
}: {
  patient: PatientCase;
  canPrev: boolean;
  canNext: boolean;
  onMove: (id: string, dir: 'next' | 'prev') => void;
  onRemove: (id: string) => void;
  isCompleted: boolean;
}) {
  const elapsed = getElapsedMinutes(patient.stageEnteredAt);

  return (
    <div className="bg-white rounded-lg border border-[#e5e5e5] p-3 shadow-sm">
      {/* 이름 + 시술 */}
      <div className="flex items-start justify-between mb-1.5">
        <span className="font-medium text-sm text-[#6d4e42]">{patient.name}</span>
        <span className="text-xs bg-[#b4988d]/10 text-[#6d4e42] px-1.5 py-0.5 rounded">
          {patient.procedure}
        </span>
      </div>

      {/* 전화 + 담당의 */}
      <div className="text-xs text-[#8a8a8a] space-y-0.5 mb-2">
        <p>{maskPhone(patient.phone)}</p>
        <p>담당: {patient.doctor}</p>
      </div>

      {/* 경과시간 */}
      <div className={`text-xs mb-2 ${elapsed > 60 ? 'text-red-500 font-medium' : 'text-[#8a8a8a]'}`}>
        {isCompleted ? (
          <span className="text-emerald-600">퇴원 완료</span>
        ) : (
          <span>경과 {formatElapsed(elapsed)}</span>
        )}
      </div>

      {/* 메모 */}
      {patient.memo && (
        <p className="text-xs text-[#b4988d] bg-[#b4988d]/5 rounded px-2 py-1 mb-2 line-clamp-2">
          {patient.memo}
        </p>
      )}

      {/* 이동 버튼 */}
      {isCompleted ? (
        <button
          onClick={() => onRemove(patient.id)}
          className="w-full text-xs text-red-400 hover:text-red-600 py-1 cursor-pointer"
        >
          삭제
        </button>
      ) : (
        <div className="flex gap-1.5">
          {canPrev && (
            <button
              onClick={() => onMove(patient.id, 'prev')}
              className="flex-1 text-xs text-[#8a8a8a] hover:text-[#6d4e42] bg-[#f6f6f6] hover:bg-[#e5e5e5] rounded py-1.5 transition-colors cursor-pointer"
            >
              ← 이전
            </button>
          )}
          {canNext && (
            <button
              onClick={() => onMove(patient.id, 'next')}
              className="flex-1 text-xs text-white bg-[#b4988d] hover:bg-[#a08878] rounded py-1.5 transition-colors cursor-pointer"
            >
              다음 →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 새 케이스 모달 ──────────────────────────────────
function AddCaseModal({
  onAdd,
  onClose,
}: {
  onAdd: (data: Omit<PatientCase, 'id' | 'stage' | 'stageEnteredAt' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<{
    name: string;
    phone: string;
    procedure: string;
    doctor: string;
    memo: string;
  }>({
    name: '',
    phone: '',
    procedure: PROCEDURE_TAG_OPTIONS[0],
    doctor: DOCTOR_OPTIONS[0],
    memo: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    onAdd({
      name: form.name.trim(),
      phone: form.phone.trim(),
      procedure: form.procedure,
      doctor: form.doctor,
      memo: form.memo.trim() || undefined,
    });
  };

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
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="홍길동"
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              required
            />
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">
              전화번호 <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="010-0000-0000"
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              required
            />
          </div>

          {/* 시술 */}
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">
              시술 <span className="text-red-400">*</span>
            </label>
            <select
              value={form.procedure}
              onChange={(e) => setForm((f) => ({ ...f, procedure: e.target.value }))}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
            >
              {PROCEDURE_TAG_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* 담당의 */}
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">
              담당의 <span className="text-red-400">*</span>
            </label>
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
