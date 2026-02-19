'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { DEVICE_INITIAL_SHOTS } from '@/types/admin';
import type { DeviceTipShot, DeviceShotLog, DeviceType, InventoryItem } from '@/types/admin';
import { useShotTracking } from '@/hooks/useShotTracking';
import { ProgressBar } from './StockGauge';

// ─── Types ──────────────────────────────────────
const DEVICE_LABELS: Record<DeviceType, string> = { ulthera: '울쎄라', shurink: '슈링크' };

const ULTHERA_AREAS = ['상안면', '하안면', '전안면', '전안면+목'] as const;

// ─── TipCard ────────────────────────────────────
interface TipCardProps {
  tip: DeviceTipShot;
  onUse: (tip: DeviceTipShot) => void;
}

function TipCard({ tip, onUse }: TipCardProps) {
  const pct = tip.initial_shots > 0
    ? Math.round((tip.remaining_shots / tip.initial_shots) * 100)
    : 0;

  return (
    <div className={`rounded-2xl border p-4 transition-all ${
      tip.is_active
        ? 'bg-white border-[#ebe7e4]'
        : 'bg-[#f6f4f2] border-[#ebe7e4] opacity-50'
    }`} style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-[#6d4e42]">{tip.tip_type}팁</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
          tip.is_active
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-red-50 text-red-700'
        }`}>
          {tip.is_active ? '활성' : '소진'}
        </span>
      </div>

      <ProgressBar
        current={tip.remaining_shots}
        min={tip.initial_shots * 0.2}
        max={tip.initial_shots}
        showLabel
      />

      <div className="flex items-baseline justify-between mt-2">
        <span className="text-xs text-[#6d4e42] font-semibold tabular-nums">
          {tip.remaining_shots.toLocaleString()} / {tip.initial_shots.toLocaleString()}
        </span>
        <span className="text-[10px] text-[#a09080]">{pct}%</span>
      </div>

      <div className="text-[10px] text-[#a09080] mt-2">
        등록: {new Date(tip.registered_at).toLocaleDateString('ko-KR')}
      </div>

      {tip.is_active && (
        <button
          onClick={() => onUse(tip)}
          className="w-full mt-3 py-2 rounded-xl text-sm font-medium bg-[#6d4e42] text-white hover:bg-[#5a3d33] transition-colors cursor-pointer active:scale-[0.98]"
        >
          샷 차감
        </button>
      )}
    </div>
  );
}

// ─── UseModal ───────────────────────────────────
interface UseModalProps {
  tip: DeviceTipShot;
  onSubmit: (shotsUsed: number, meta: { patient_name?: string; chart_number?: string; procedure_area?: string; note?: string }) => Promise<void>;
  onClose: () => void;
}

function UseModal({ tip, onSubmit, onClose }: UseModalProps) {
  const [shotsUsed, setShotsUsed] = useState(0);
  const [patientName, setPatientName] = useState('');
  const [chartNumber, setChartNumber] = useState('');
  const [procedureArea, setProcedureArea] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isUlthera = tip.device_type === 'ulthera';
  const isOverLimit = shotsUsed > tip.remaining_shots;
  const canSubmit = shotsUsed > 0 && !isOverLimit && !submitting;
  const afterShots = tip.remaining_shots - shotsUsed;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit(shotsUsed, {
        patient_name: patientName.trim() || undefined,
        chart_number: chartNumber.trim() || undefined,
        procedure_area: procedureArea.trim() || undefined,
        note: note.trim() || undefined,
      });
      onClose();
    } catch {
      // error handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end lg:items-center justify-center" onClick={onClose}>
      <div
        className="w-full lg:max-w-md bg-white rounded-t-2xl lg:rounded-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#ebe7e4] bg-[#faf8f7] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#6d4e42]">
              샷 차감 — {tip.tip_type}팁 ({DEVICE_LABELS[tip.device_type]})
            </h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-[#ebe7e4] flex items-center justify-center cursor-pointer">
            <svg className="w-3.5 h-3.5 text-[#a09080]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 잔여 표시 */}
          <div>
            <div className="text-xs text-[#a09080] mb-1">잔여: {tip.remaining_shots.toLocaleString()} / {tip.initial_shots.toLocaleString()}</div>
            <ProgressBar current={tip.remaining_shots} min={tip.initial_shots * 0.2} max={tip.initial_shots} />
          </div>

          {/* 사용 샷 수 */}
          <div>
            <label className="block text-[10px] font-semibold text-[#a09080] mb-1.5 uppercase tracking-wider">사용 샷 수</label>
            <input
              type="number"
              min={1}
              max={tip.remaining_shots}
              value={shotsUsed || ''}
              onChange={e => setShotsUsed(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm text-center tabular-nums focus:outline-none focus:ring-2 transition-shadow ${
                isOverLimit
                  ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                  : 'border-[#ebe7e4] focus:ring-[#b4988d]/20 focus:border-[#b4988d]'
              }`}
            />
            {isOverLimit && (
              <p className="text-xs text-red-500 mt-1">잔여 샷을 초과했습니다!</p>
            )}
          </div>

          {/* 환자 / 차트 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[#a09080] mb-1.5 uppercase tracking-wider">환자명</label>
              <input
                type="text"
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                placeholder="홍길동"
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#a09080] mb-1.5 uppercase tracking-wider">차트번호</label>
              <input
                type="text"
                value={chartNumber}
                onChange={e => setChartNumber(e.target.value)}
                placeholder="C-001"
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow"
              />
            </div>
          </div>

          {/* 시술 부위 */}
          <div>
            <label className="block text-[10px] font-semibold text-[#a09080] mb-1.5 uppercase tracking-wider">시술 부위</label>
            {isUlthera ? (
              <select
                value={procedureArea}
                onChange={e => setProcedureArea(e.target.value)}
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow"
              >
                <option value="">선택하세요</option>
                {ULTHERA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={procedureArea}
                onChange={e => setProcedureArea(e.target.value)}
                placeholder="시술 부위"
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow"
              />
            )}
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-[10px] font-semibold text-[#a09080] mb-1.5 uppercase tracking-wider">메모</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="비고 (선택)"
              className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow"
            />
          </div>

          {/* 차감 후 미리보기 */}
          {shotsUsed > 0 && !isOverLimit && (
            <div className="bg-[#faf8f7] rounded-xl p-3 border border-[#ebe7e4] text-center">
              <span className="text-xs text-[#a09080]">차감 후: </span>
              <span className="text-sm font-bold text-[#6d4e42] tabular-nums">{afterShots.toLocaleString()} 샷</span>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#f6f4f2] text-[#575756] hover:bg-[#ebe7e4] transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 py-3 rounded-xl text-sm font-bold bg-[#6d4e42] text-white hover:bg-[#5a3d33] transition-colors cursor-pointer disabled:opacity-40 active:scale-[0.98]"
            >
              {submitting ? '처리 중...' : '차감 확인'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RegisterModal ──────────────────────────────
interface RegisterModalProps {
  deviceType: DeviceType;
  items: InventoryItem[];
  onSubmit: (tipType: string, itemId: string) => Promise<void>;
  onClose: () => void;
}

function RegisterModal({ deviceType, items, onSubmit, onClose }: RegisterModalProps) {
  const tipTypes = Object.keys(DEVICE_INITIAL_SHOTS[deviceType]);
  const [selectedTipType, setSelectedTipType] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const initialShots = selectedTipType
    ? DEVICE_INITIAL_SHOTS[deviceType][selectedTipType]
    : null;

  const deviceItems = useMemo(() =>
    items.filter(i => i.category === 'device_tip' && i.is_active),
    [items]
  );

  const handleSubmit = async () => {
    if (!selectedTipType || !selectedItemId) return;
    setSubmitting(true);
    try {
      await onSubmit(selectedTipType, selectedItemId);
      onClose();
    } catch {
      // error handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end lg:items-center justify-center" onClick={onClose}>
      <div
        className="w-full lg:max-w-sm bg-white rounded-t-2xl lg:rounded-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[#ebe7e4] bg-[#faf8f7] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#6d4e42]">
            새 팁 등록 — {DEVICE_LABELS[deviceType]}
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-[#ebe7e4] flex items-center justify-center cursor-pointer">
            <svg className="w-3.5 h-3.5 text-[#a09080]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 팁 종류 */}
          <div>
            <label className="block text-[10px] font-semibold text-[#a09080] mb-1.5 uppercase tracking-wider">팁 종류</label>
            <select
              value={selectedTipType}
              onChange={e => setSelectedTipType(e.target.value)}
              className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow"
            >
              <option value="">선택하세요</option>
              {tipTypes.map(t => (
                <option key={t} value={t}>{t}팁</option>
              ))}
            </select>
          </div>

          {/* 초기 샷 수 (읽기 전용) */}
          {initialShots && (
            <div className="bg-[#faf8f7] rounded-xl p-3 border border-[#ebe7e4]">
              <span className="text-[10px] text-[#a09080]">초기 샷 수: </span>
              <span className="text-sm font-bold text-[#6d4e42] tabular-nums">{initialShots.toLocaleString()} 샷</span>
            </div>
          )}

          {/* 연결 품목 */}
          <div>
            <label className="block text-[10px] font-semibold text-[#a09080] mb-1.5 uppercase tracking-wider">연결 품목</label>
            <select
              value={selectedItemId}
              onChange={e => setSelectedItemId(e.target.value)}
              className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow"
            >
              <option value="">품목을 선택하세요</option>
              {deviceItems.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#f6f4f2] text-[#575756] hover:bg-[#ebe7e4] transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedTipType || !selectedItemId || submitting}
              className="flex-1 py-3 rounded-xl text-sm font-bold bg-[#6d4e42] text-white hover:bg-[#5a3d33] transition-colors cursor-pointer disabled:opacity-40 active:scale-[0.98]"
            >
              {submitting ? '등록 중...' : '등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LogRow ─────────────────────────────────────
function formatLogDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}.${dd} ${hh}:${mi}`;
}

function findTipType(tipId: string, tips: DeviceTipShot[]): string {
  return tips.find(t => t.id === tipId)?.tip_type ?? '?';
}

// ─── Main Component ─────────────────────────────
interface ShotTrackerProps {
  items: InventoryItem[];
}

export default function ShotTracker({ items }: ShotTrackerProps) {
  const [deviceTab, setDeviceTab] = useState<DeviceType>('ulthera');
  const [showRegister, setShowRegister] = useState(false);
  const [useTarget, setUseTarget] = useState<DeviceTipShot | null>(null);
  const [showExhausted, setShowExhausted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { tips, logs, loading, error, registerTip, useShots, refresh } = useShotTracking(deviceTab);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const activeTips = useMemo(() => tips.filter(t => t.is_active), [tips]);
  const exhaustedTips = useMemo(() => tips.filter(t => !t.is_active), [tips]);

  const handleUseSubmit = useCallback(async (
    shotsUsed: number,
    meta: { patient_name?: string; chart_number?: string; procedure_area?: string; note?: string },
  ) => {
    if (!useTarget) return;
    await useShots(useTarget.id, shotsUsed, meta);
    setToast({ message: `${useTarget.tip_type}팁 — ${shotsUsed}샷 차감 완료`, type: 'success' });
  }, [useTarget, useShots]);

  const handleRegisterSubmit = useCallback(async (tipType: string, itemId: string) => {
    await registerTip(deviceTab, tipType, itemId);
    setToast({ message: `${tipType}팁 등록 완료`, type: 'success' });
  }, [deviceTab, registerTip]);

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-semibold shadow-lg animate-[fadeInDown_0.3s_ease-out] ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' && (
            <svg className="w-4 h-4 inline mr-2 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#ebe7e4] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#ebe7e4] bg-[#faf8f7] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-[#6d4e42] tracking-tight">샷 추적 관리</h3>
            {/* Device Tab */}
            <div className="flex bg-[#ebe7e4] rounded-xl p-0.5">
              {(['ulthera', 'shurink'] as DeviceType[]).map(dt => (
                <button
                  key={dt}
                  onClick={() => setDeviceTab(dt)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    deviceTab === dt
                      ? 'bg-white text-[#6d4e42] shadow-sm'
                      : 'text-[#a09080] hover:text-[#6d4e42]'
                  }`}
                >
                  {DEVICE_LABELS[dt]}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowRegister(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#6d4e42] text-white hover:bg-[#5a3d33] transition-colors cursor-pointer active:scale-[0.98]"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            새 팁 등록
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Loading / Error */}
          {loading && (
            <div className="flex items-center justify-center py-8 text-[#a09080]">
              <div className="w-5 h-5 border-2 border-[#ebe7e4] border-t-[#6d4e42] rounded-full animate-spin mr-2" />
              <span className="text-sm">불러오는 중...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
              {error}
              <button onClick={refresh} className="ml-2 underline cursor-pointer">다시 시도</button>
            </div>
          )}

          {/* Active Tips Grid */}
          {!loading && activeTips.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-12 text-[#c5b8b0]">
              <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-sm font-medium">등록된 활성 팁이 없습니다</p>
              <p className="text-[10px] mt-1">&ldquo;새 팁 등록&rdquo; 버튼으로 팁을 추가하세요</p>
            </div>
          )}

          {!loading && activeTips.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeTips.map(tip => (
                <TipCard key={tip.id} tip={tip} onUse={setUseTarget} />
              ))}
            </div>
          )}

          {/* Exhausted Tips */}
          {!loading && exhaustedTips.length > 0 && (
            <div>
              <button
                onClick={() => setShowExhausted(!showExhausted)}
                className="flex items-center gap-2 text-xs text-[#a09080] hover:text-[#6d4e42] transition-colors cursor-pointer"
              >
                <svg className={`w-3 h-3 transition-transform ${showExhausted ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                소진된 팁 {exhaustedTips.length}개
              </button>
              {showExhausted && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                  {exhaustedTips.map(tip => (
                    <TipCard key={tip.id} tip={tip} onUse={() => {}} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Logs */}
          {!loading && logs.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[#a09080] uppercase tracking-wider mb-3">최근 사용 이력</p>
              <div className="space-y-1.5">
                {logs.slice(0, 15).map(log => (
                  <div key={log.id} className="flex items-center gap-3 text-xs bg-[#faf8f7] rounded-xl px-3 py-2 border border-[#ebe7e4]">
                    <span className="text-[#a09080] tabular-nums w-20 flex-shrink-0">{formatLogDate(log.created_at)}</span>
                    <span className="text-[#6d4e42] font-medium w-12 flex-shrink-0">{findTipType(log.tip_id, tips)}팁</span>
                    <span className="text-red-600 font-semibold tabular-nums w-16 flex-shrink-0">-{log.shots_used.toLocaleString()}</span>
                    <span className="text-[#575756] truncate hidden sm:block">{log.patient_name || '—'}</span>
                    <span className="text-[#a09080] truncate hidden lg:block">{log.procedure_area || ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {useTarget && (
        <UseModal
          tip={useTarget}
          onSubmit={handleUseSubmit}
          onClose={() => setUseTarget(null)}
        />
      )}
      {showRegister && (
        <RegisterModal
          deviceType={deviceTab}
          items={items}
          onSubmit={handleRegisterSubmit}
          onClose={() => setShowRegister(false)}
        />
      )}
    </div>
  );
}
