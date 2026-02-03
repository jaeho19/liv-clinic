'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { PatientTreatmentRow, NotificationChannel, NOTIFICATION_CHANNEL_LABELS } from '@/types/admin';

interface TodayData {
  today: PatientTreatmentRow[];
  todayCount: number;
  weekCount: number;
}

const CHANNEL_OPTIONS: { value: NotificationChannel; label: string }[] = [
  { value: 'kakao', label: '카카오톡' },
  { value: 'sms', label: '문자' },
  { value: 'call', label: '전화' },
];

// 시술 등록 모달
function AddTreatmentModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    patient_name: '',
    phone: '',
    treatment_name: '',
    treatment_category: '',
    doctor: '',
    treated_at: new Date().toISOString().split('T')[0],
    notification_cycle_days: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.patient_name || !form.phone || !form.treatment_name || !form.treated_at) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        patient_name: form.patient_name,
        phone: form.phone,
        treatment_name: form.treatment_name,
        treatment_category: form.treatment_category || null,
        doctor: form.doctor || null,
        treated_at: new Date(form.treated_at).toISOString(),
        notes: form.notes || null,
      };
      if (form.notification_cycle_days) {
        body.notification_cycle_days = parseInt(form.notification_cycle_days);
      }
      const res = await fetch('/api/admin/patient-treatments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { onAdded(); onClose(); }
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[#6d4e42] mb-4">시술 기록 등록</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#8a8a8a] block mb-1">환자명 *</label>
              <input className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm" value={form.patient_name} onChange={e => setForm(p => ({ ...p, patient_name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-[#8a8a8a] block mb-1">전화번호 *</label>
              <input className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="010-0000-0000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#8a8a8a] block mb-1">시술명 *</label>
              <input className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm" value={form.treatment_name} onChange={e => setForm(p => ({ ...p, treatment_name: e.target.value }))} placeholder="보톡스, 울쎄라 등" />
            </div>
            <div>
              <label className="text-xs text-[#8a8a8a] block mb-1">카테고리</label>
              <select className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm" value={form.treatment_category} onChange={e => setForm(p => ({ ...p, treatment_category: e.target.value }))}>
                <option value="">선택</option>
                <option value="lifting">리프팅</option>
                <option value="antiaging">안티에이징</option>
                <option value="laser">레이저</option>
                <option value="skincare">스킨케어</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[#8a8a8a] block mb-1">담당의</label>
              <select className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm" value={form.doctor} onChange={e => setForm(p => ({ ...p, doctor: e.target.value }))}>
                <option value="">선택</option>
                <option value="김수영 원장">김수영 원장</option>
                <option value="천신혜 원장">천신혜 원장</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#8a8a8a] block mb-1">시술일 *</label>
              <input type="date" className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm" value={form.treated_at} onChange={e => setForm(p => ({ ...p, treated_at: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-[#8a8a8a] block mb-1">알림 주기 (일)</label>
              <input type="number" className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm" value={form.notification_cycle_days} onChange={e => setForm(p => ({ ...p, notification_cycle_days: e.target.value }))} placeholder="예: 90" />
            </div>
          </div>
          <div>
            <label className="text-xs text-[#8a8a8a] block mb-1">메모</label>
            <textarea className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#8a8a8a] hover:bg-[#f6f6f6] rounded-lg">취소</button>
          <button onClick={handleSubmit} disabled={saving || !form.patient_name || !form.phone || !form.treatment_name} className="px-4 py-2 text-sm bg-[#b4988d] text-white rounded-lg hover:bg-[#a08478] disabled:opacity-50">
            {saving ? '저장 중...' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 발송 완료 모달
function SendCompleteModal({ treatment, onClose, onCompleted }: { treatment: PatientTreatmentRow; onClose: () => void; onCompleted: () => void }) {
  const [channel, setChannel] = useState<NotificationChannel>('kakao');
  const [sentBy, setSentBy] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSend = async (status: 'sent' | 'skipped') => {
    if (!sentBy) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/notifications/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_treatment_id: treatment.id, channel, sent_by: sentBy, status, notes: notes || null }),
      });
      if (res.ok) { onCompleted(); onClose(); }
    } finally { setSaving(false); }
  };

  const maskPhone = (phone: string) => {
    if (phone.length >= 8) return phone.slice(0, -4) + '****';
    return phone;
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[#6d4e42] mb-1">알림 발송 처리</h3>
        <p className="text-sm text-[#8a8a8a] mb-4">{treatment.patient_name} ({maskPhone(treatment.phone)}) - {treatment.treatment_name}</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[#8a8a8a] block mb-1">발송 채널</label>
            <div className="flex gap-2">
              {CHANNEL_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setChannel(opt.value)} className={`px-3 py-1.5 text-sm rounded-lg border ${channel === opt.value ? 'border-[#b4988d] bg-[#b4988d]/10 text-[#6d4e42]' : 'border-[#e5e5e5] text-[#8a8a8a]'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-[#8a8a8a] block mb-1">담당자 *</label>
            <input className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm" value={sentBy} onChange={e => setSentBy(e.target.value)} placeholder="발송 담당자 이름" />
          </div>
          <div>
            <label className="text-xs text-[#8a8a8a] block mb-1">메모</label>
            <textarea className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => handleSend('skipped')} disabled={saving || !sentBy} className="px-4 py-2 text-sm text-[#8a8a8a] hover:bg-[#f6f6f6] rounded-lg border border-[#e5e5e5] disabled:opacity-50">
            건너뛰기
          </button>
          <button onClick={() => handleSend('sent')} disabled={saving || !sentBy} className="px-4 py-2 text-sm bg-[#b4988d] text-white rounded-lg hover:bg-[#a08478] disabled:opacity-50">
            {saving ? '처리 중...' : '발송 완료'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<PatientTreatmentRow | null>(null);
  const [filter, setFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notifications/today');
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data?.today.filter(t =>
    !filter || t.patient_name.includes(filter) || t.phone.includes(filter) || t.treatment_name.includes(filter)
  ) || [];

  const getDaysAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const maskPhone = (phone: string) => {
    if (phone.length >= 8) return phone.slice(0, -4) + '****';
    return phone;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#6d4e42]">알림관리</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 text-sm bg-[#b4988d] text-white rounded-lg hover:bg-[#a08478]">
            + 시술 기록 등록
          </button>
          <Link href="/admin/notifications/templates" className="px-4 py-2 text-sm border border-[#e5e5e5] text-[#575756] rounded-lg hover:bg-[#f6f6f6]">
            템플릿 관리
          </Link>
          <Link href="/admin/notifications/history" className="px-4 py-2 text-sm border border-[#e5e5e5] text-[#575756] rounded-lg hover:bg-[#f6f6f6]">
            발송 이력
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-[#e5e5e5]">
          <p className="text-sm text-[#8a8a8a] mb-1">오늘 발송 대상</p>
          <p className="text-3xl font-bold text-amber-600">{loading ? '-' : data?.todayCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-[#e5e5e5]">
          <p className="text-sm text-[#8a8a8a] mb-1">미발송 건수</p>
          <p className="text-3xl font-bold text-red-500">{loading ? '-' : data?.todayCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-[#e5e5e5]">
          <p className="text-sm text-[#8a8a8a] mb-1">이번 주 예정</p>
          <p className="text-3xl font-bold text-blue-600">{loading ? '-' : data?.weekCount ?? 0}</p>
        </div>
      </div>

      {/* 미발송 경고 배너 */}
      {data && data.todayCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">&#9888;&#65039;</span>
          <div>
            <p className="text-sm font-medium text-amber-800">오늘 발송해야 할 알림이 {data.todayCount}건 있습니다</p>
            <p className="text-xs text-amber-600 mt-0.5">환자별 시술 주기에 따라 재방문 안내가 필요한 고객입니다.</p>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="환자명, 전화번호, 시술명 검색..."
          className="w-full max-w-sm border border-[#e5e5e5] rounded-lg px-4 py-2.5 text-sm"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      {/* 발송 대상 목록 */}
      <div className="bg-white rounded-xl border border-[#e5e5e5]">
        <div className="px-5 py-4 border-b border-[#e5e5e5]">
          <h3 className="font-bold text-[#6d4e42]">오늘 발송 대상</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-[#8a8a8a]">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#8a8a8a]">
            {data?.todayCount === 0 ? '오늘 발송 대상이 없습니다.' : '검색 결과가 없습니다.'}
          </div>
        ) : (
          <div className="divide-y divide-[#f0f0f0]">
            {filtered.map(t => {
              const daysAgo = getDaysAgo(t.treated_at);
              const isOverdue = t.next_notification_at && new Date(t.next_notification_at) < new Date(new Date().toISOString().split('T')[0]);
              return (
                <div key={t.id} className={`px-5 py-4 hover:bg-[#fafafa] ${isOverdue ? 'bg-red-50/50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#6d4e42]">{t.patient_name}</span>
                          <span className="text-sm text-[#8a8a8a]">{maskPhone(t.phone)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{t.treatment_name}</span>
                          {t.doctor && <span className="text-xs text-[#8a8a8a]">{t.doctor}</span>}
                          <span className="text-xs text-[#8a8a8a]">
                            시술일: {new Date(t.treated_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <p className="text-xs text-amber-600 mt-1">
                          {isOverdue ? `${daysAgo}일 경과 (지연됨)` : `${daysAgo}일 경과`} &mdash; 재시술 안내 필요
                          {t.notification_cycle_days && ` (주기: ${t.notification_cycle_days}일)`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTreatment(t)}
                      className="px-4 py-2 text-sm bg-[#b4988d] text-white rounded-lg hover:bg-[#a08478] whitespace-nowrap"
                    >
                      발송 처리
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && <AddTreatmentModal onClose={() => setShowAddModal(false)} onAdded={fetchData} />}
      {selectedTreatment && <SendCompleteModal treatment={selectedTreatment} onClose={() => setSelectedTreatment(null)} onCompleted={fetchData} />}
    </div>
  );
}
