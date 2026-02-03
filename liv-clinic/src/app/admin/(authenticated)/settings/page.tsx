'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TREATMENT_MASTER_CATEGORY_LABELS,
  STAFF_ROLE_LABELS,
  STAFF_ROLE_COLORS,
  AUDIT_ACTION_LABELS,
} from '@/types/admin';
import type {
  TreatmentMaster,
  TreatmentMasterCategory,
  StaffMember,
  StaffRole,
  AuditLog,
  AuditAction,
} from '@/types/admin';

// ─── API 헬퍼 ──────────────────────────────────────────

async function fetchTreatments(): Promise<TreatmentMaster[]> {
  const res = await fetch('/api/admin/settings/treatments');
  if (!res.ok) throw new Error('시술 목록을 불러오지 못했습니다.');
  return res.json();
}

async function fetchStaff(): Promise<StaffMember[]> {
  const res = await fetch('/api/admin/settings/staff');
  if (!res.ok) throw new Error('직원 목록을 불러오지 못했습니다.');
  return res.json();
}

async function fetchAuditLogs(action?: string, userName?: string): Promise<AuditLog[]> {
  const params = new URLSearchParams();
  if (action && action !== 'all') params.set('action', action);
  if (userName && userName !== 'all') params.set('userName', userName);
  const qs = params.toString();
  const res = await fetch(`/api/admin/settings/audit-logs${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('감사 로그를 불러오지 못했습니다.');
  return res.json();
}

interface ClinicInfo {
  name: string;
  phone: string;
  address: string;
  email: string;
  kakao: string;
  hours: { weekday: string; saturday: string; sunday: string; lunch: string };
  notifications: { callbackReminder: boolean; lowStockAlert: boolean; newConsultation: boolean };
}

async function fetchClinicInfo(): Promise<ClinicInfo> {
  const res = await fetch('/api/admin/settings/clinic');
  if (!res.ok) throw new Error('병원 정보를 불러오지 못했습니다.');
  return res.json();
}

// ─── 탭 정의 ──────────────────────────────────────────
type SettingsTab = 'treatments' | 'staff' | 'audit' | 'clinic';

const TABS: { key: SettingsTab; label: string }[] = [
  { key: 'treatments', label: '시술 마스터' },
  { key: 'staff', label: '직원 관리' },
  { key: 'audit', label: '감사 로그' },
  { key: 'clinic', label: '기본정보' },
];

// ─── 메인 컴포넌트 ──────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('treatments');

  return (
    <div>
      <h2 className="text-xl font-bold text-[#6d4e42] mb-6">설정</h2>

      {/* 탭 네비게이션 */}
      <div className="flex border-b border-[#e5e5e5] mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'border-[#b4988d] text-[#6d4e42]'
                : 'border-transparent text-[#8a8a8a] hover:text-[#575756]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'treatments' && <TreatmentMasterTab />}
      {activeTab === 'staff' && <StaffTab />}
      {activeTab === 'audit' && <AuditLogTab />}
      {activeTab === 'clinic' && <ClinicInfoTab />}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. 시술 마스터 탭
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function TreatmentMasterTab() {
  const [treatments, setTreatments] = useState<TreatmentMaster[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<TreatmentMaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchTreatments();
      setTreatments(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    if (categoryFilter === 'all') return treatments;
    return treatments.filter((t) => t.category === categoryFilter);
  }, [treatments, categoryFilter]);

  const handleSave = useCallback(async (data: Omit<TreatmentMaster, 'id'> & { id?: string }) => {
    try {
      if (data.id) {
        const res = await fetch(`/api/admin/settings/treatments/${data.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('수정 실패');
      } else {
        const res = await fetch('/api/admin/settings/treatments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('추가 실패');
      }
      setShowModal(false);
      setEditTarget(null);
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    }
  }, [loadData]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/settings/treatments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    }
  }, [loadData]);

  const handleToggleActive = useCallback(async (id: string) => {
    const target = treatments.find((t) => t.id === id);
    if (!target) return;
    try {
      const res = await fetch(`/api/admin/settings/treatments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !target.isActive }),
      });
      if (!res.ok) throw new Error('상태 변경 실패');
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    }
  }, [treatments, loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#b4988d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-[#b4988d] text-white rounded-lg text-sm cursor-pointer">
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* 필터 + 추가 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
        >
          <option value="all">전체 카테고리</option>
          {(Object.entries(TREATMENT_MASTER_CATEGORY_LABELS) as [TreatmentMasterCategory, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#8a8a8a]">{filtered.length}개 시술</span>
          <button
            onClick={() => { setEditTarget(null); setShowModal(true); }}
            className="px-4 py-2 bg-[#b4988d] text-white rounded-lg text-sm font-medium hover:bg-[#a08878] transition-colors cursor-pointer"
          >
            + 시술 추가
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e5e5] bg-[#f6f6f6]">
                <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">시술명</th>
                <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">카테고리</th>
                <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">가격대</th>
                <th className="text-right py-3 px-4 text-[#8a8a8a] font-medium">소요시간</th>
                <th className="text-center py-3 px-4 text-[#8a8a8a] font-medium">상태</th>
                <th className="text-center py-3 px-4 text-[#8a8a8a] font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-[#f0f0f0] last:border-0 hover:bg-[#f6f6f6]">
                  <td className="py-3 px-4 font-medium text-[#6d4e42]">{t.name}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#b4988d]/10 text-[#6d4e42]">
                      {TREATMENT_MASTER_CATEGORY_LABELS[t.category]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#575756]">{t.priceRange}</td>
                  <td className="py-3 px-4 text-right text-[#575756]">{t.duration}분</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleActive(t.id)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer transition-colors ${
                        t.isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {t.isActive ? '활성' : '비활성'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => { setEditTarget(t); setShowModal(true); }}
                        className="px-2 py-1 text-xs text-[#b4988d] hover:bg-[#b4988d]/10 rounded transition-colors cursor-pointer"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="px-2 py-1 text-xs text-red-400 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 시술 추가/수정 모달 */}
      {showModal && (
        <TreatmentModal
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}

// ─── 시술 모달 ──────────────────────────────────────
function TreatmentModal({
  initial,
  onSave,
  onClose,
}: {
  initial: TreatmentMaster | null;
  onSave: (data: Omit<TreatmentMaster, 'id'> & { id?: string }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    category: initial?.category || ('lifting' as TreatmentMasterCategory),
    priceRange: initial?.priceRange || '',
    duration: initial?.duration || 30,
    isActive: initial?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      ...(initial ? { id: initial.id } : {}),
      name: form.name.trim(),
      category: form.category,
      priceRange: form.priceRange.trim() || '-',
      duration: form.duration,
      isActive: form.isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl border border-[#e5e5e5] shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-[#e5e5e5]">
          <h3 className="font-bold text-[#6d4e42]">{initial ? '시술 수정' : '시술 추가'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">
              시술명 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">카테고리</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as TreatmentMasterCategory }))}
                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              >
                {(Object.entries(TREATMENT_MASTER_CATEGORY_LABELS) as [TreatmentMasterCategory, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">소요시간 (분)</label>
              <input
                type="number"
                min={5}
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}
                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">가격대</label>
            <input
              type="text"
              value={form.priceRange}
              onChange={(e) => setForm((f) => ({ ...f, priceRange: e.target.value }))}
              placeholder="예: 50~100만원"
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="rounded border-[#e5e5e5]"
            />
            <label htmlFor="isActive" className="text-sm text-[#575756]">활성화</label>
          </div>
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
              {initial ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. 직원 관리 탭
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function StaffTab() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchStaff();
      setStaff(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = useCallback(async (data: Omit<StaffMember, 'id' | 'createdAt'> & { id?: string }) => {
    try {
      if (data.id) {
        const res = await fetch(`/api/admin/settings/staff/${data.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('수정 실패');
      } else {
        const res = await fetch('/api/admin/settings/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('추가 실패');
      }
      setShowModal(false);
      setEditTarget(null);
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    }
  }, [loadData]);

  const handleToggleActive = useCallback(async (id: string) => {
    const target = staff.find((s) => s.id === id);
    if (!target) return;
    try {
      const res = await fetch(`/api/admin/settings/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !target.isActive }),
      });
      if (!res.ok) throw new Error('상태 변경 실패');
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    }
  }, [staff, loadData]);

  const activeCount = staff.filter((s) => s.isActive).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#b4988d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-[#b4988d] text-white rounded-lg text-sm cursor-pointer">
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#8a8a8a]">
            전체 {staff.length}명 / 활성 {activeCount}명
          </span>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="px-4 py-2 bg-[#b4988d] text-white rounded-lg text-sm font-medium hover:bg-[#a08878] transition-colors cursor-pointer"
        >
          + 직원 추가
        </button>
      </div>

      {/* 직원 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {staff.map((s) => (
          <div
            key={s.id}
            className={`bg-white rounded-xl border border-[#e5e5e5] p-5 ${!s.isActive ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-bold text-[#6d4e42]">{s.name}</h4>
                <p className="text-xs text-[#8a8a8a] mt-0.5">{s.position}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAFF_ROLE_COLORS[s.role]}`}>
                {STAFF_ROLE_LABELS[s.role]}
              </span>
            </div>
            <div className="space-y-1.5 text-xs mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[#8a8a8a] w-12">이메일</span>
                <span className="text-[#575756]">{s.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#8a8a8a] w-12">등록일</span>
                <span className="text-[#575756]">{s.createdAt}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#8a8a8a] w-12">상태</span>
                <span className={s.isActive ? 'text-emerald-600' : 'text-gray-400'}>
                  {s.isActive ? '활성' : '비활성'}
                </span>
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
              <button
                onClick={() => { setEditTarget(s); setShowModal(true); }}
                className="flex-1 py-1.5 text-xs text-[#b4988d] border border-[#b4988d]/30 rounded-lg hover:bg-[#b4988d]/5 transition-colors cursor-pointer"
              >
                수정
              </button>
              <button
                onClick={() => handleToggleActive(s.id)}
                className={`flex-1 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                  s.isActive
                    ? 'text-amber-600 border border-amber-200 hover:bg-amber-50'
                    : 'text-emerald-600 border border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                {s.isActive ? '비활성화' : '활성화'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 직원 추가/수정 모달 */}
      {showModal && (
        <StaffModal
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}

// ─── 직원 모달 ──────────────────────────────────────
function StaffModal({
  initial,
  onSave,
  onClose,
}: {
  initial: StaffMember | null;
  onSave: (data: Omit<StaffMember, 'id' | 'createdAt'> & { id?: string }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    email: initial?.email || '',
    role: initial?.role || ('staff' as StaffRole),
    position: initial?.position || '',
    isActive: initial?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    onSave({
      ...(initial ? { id: initial.id } : {}),
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      position: form.position.trim(),
      isActive: form.isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl border border-[#e5e5e5] shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-[#e5e5e5]">
          <h3 className="font-bold text-[#6d4e42]">{initial ? '직원 수정' : '직원 추가'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">
              이름 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">
              이메일 <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">역할</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as StaffRole }))}
                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              >
                {(Object.entries(STAFF_ROLE_LABELS) as [StaffRole, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">직책</label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                placeholder="상담사, 간호사 등"
                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="staffActive"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="rounded border-[#e5e5e5]"
            />
            <label htmlFor="staffActive" className="text-sm text-[#575756]">활성화</label>
          </div>
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
              {initial ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. 감사 로그 탭
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function AuditLogTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchAuditLogs(actionFilter, userFilter);
      setLogs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, userFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const users = useMemo(() => {
    return [...new Set(logs.map((l) => l.userName))];
  }, [logs]);

  const ACTION_COLORS: Record<AuditAction, string> = {
    create: 'bg-emerald-50 text-emerald-700',
    update: 'bg-blue-50 text-blue-700',
    delete: 'bg-red-50 text-red-700',
    login: 'bg-purple-50 text-purple-700',
    export: 'bg-amber-50 text-amber-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#b4988d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-[#b4988d] text-white rounded-lg text-sm cursor-pointer">
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* 필터 */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
        >
          <option value="all">전체 작업</option>
          {(Object.entries(AUDIT_ACTION_LABELS) as [AuditAction, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
        >
          <option value="all">전체 사용자</option>
          {users.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <span className="text-sm text-[#8a8a8a] ml-auto">{logs.length}건</span>
      </div>

      {/* 로그 테이블 */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e5e5] bg-[#f6f6f6]">
                <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">일시</th>
                <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">사용자</th>
                <th className="text-center py-3 px-4 text-[#8a8a8a] font-medium">작업</th>
                <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">대상</th>
                <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">상세</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[#8a8a8a]">
                    로그가 없습니다.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#f0f0f0] last:border-0">
                    <td className="py-3 px-4 text-[#8a8a8a] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#6d4e42]">{log.userName}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action]}`}>
                        {AUDIT_ACTION_LABELS[log.action]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#575756]">{log.target}</td>
                    <td className="py-3 px-4 text-[#8a8a8a]">{log.detail}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. 기본정보 탭
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ClinicInfoTab() {
  const [form, setForm] = useState<ClinicInfo>({
    name: '',
    phone: '',
    address: '',
    email: '',
    kakao: '',
    hours: { weekday: '', saturday: '', sunday: '', lunch: '' },
    notifications: { callbackReminder: true, lowStockAlert: true, newConsultation: true },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchClinicInfo();
      setForm(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/settings/clinic', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('저장 실패');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert(e instanceof Error ? e.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#b4988d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-[#b4988d] text-white rounded-lg text-sm cursor-pointer">
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* 병원 기본정보 */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-6 mb-6">
        <h3 className="font-bold text-sm text-[#6d4e42] mb-4">병원 정보</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">병원명</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">전화번호</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">주소</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">카카오톡 채널</label>
            <input
              type="text"
              value={form.kakao}
              onChange={(e) => setForm((f) => ({ ...f, kakao: e.target.value }))}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
            />
          </div>
        </div>
      </div>

      {/* 영업시간 */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-6 mb-6">
        <h3 className="font-bold text-sm text-[#6d4e42] mb-4">영업시간</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">평일</label>
            <input
              type="text"
              value={form.hours.weekday}
              onChange={(e) => setForm((f) => ({ ...f, hours: { ...f.hours, weekday: e.target.value } }))}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">토요일</label>
            <input
              type="text"
              value={form.hours.saturday}
              onChange={(e) => setForm((f) => ({ ...f, hours: { ...f.hours, saturday: e.target.value } }))}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">일요일</label>
            <input
              type="text"
              value={form.hours.sunday}
              onChange={(e) => setForm((f) => ({ ...f, hours: { ...f.hours, sunday: e.target.value } }))}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">점심시간</label>
            <input
              type="text"
              value={form.hours.lunch}
              onChange={(e) => setForm((f) => ({ ...f, hours: { ...f.hours, lunch: e.target.value } }))}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
            />
          </div>
        </div>
      </div>

      {/* 알림 설정 */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-6 mb-6">
        <h3 className="font-bold text-sm text-[#6d4e42] mb-4">알림 설정</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-[#575756]">콜백 리마인더</p>
              <p className="text-xs text-[#8a8a8a]">콜백 예정 30분 전 알림</p>
            </div>
            <ToggleSwitch
              checked={form.notifications.callbackReminder}
              onChange={(v) => setForm((f) => ({ ...f, notifications: { ...f.notifications, callbackReminder: v } }))}
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-[#575756]">재고 부족 알림</p>
              <p className="text-xs text-[#8a8a8a]">최소 재고 이하 시 알림</p>
            </div>
            <ToggleSwitch
              checked={form.notifications.lowStockAlert}
              onChange={(v) => setForm((f) => ({ ...f, notifications: { ...f.notifications, lowStockAlert: v } }))}
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-[#575756]">신규 상담 알림</p>
              <p className="text-xs text-[#8a8a8a]">새 상담 접수 시 실시간 알림</p>
            </div>
            <ToggleSwitch
              checked={form.notifications.newConsultation}
              onChange={(v) => setForm((f) => ({ ...f, notifications: { ...f.notifications, newConsultation: v } }))}
            />
          </label>
        </div>
      </div>

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
          saved
            ? 'bg-emerald-500 text-white'
            : saving
              ? 'bg-[#b4988d]/60 text-white cursor-wait'
              : 'bg-[#b4988d] text-white hover:bg-[#a08878]'
        }`}
      >
        {saved ? '저장되었습니다' : saving ? '저장 중...' : '변경사항 저장'}
      </button>
    </div>
  );
}

// ─── 토글 스위치 ──────────────────────────────────────
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
        checked ? 'bg-[#b4988d]' : 'bg-[#e5e5e5]'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
