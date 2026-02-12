'use client';

import { useState, useCallback } from 'react';
import PatientPhotoGallery from '@/components/admin/PatientPhotoGallery';

// ─── Types ──────────────────────────────────────
interface PatientSearchResult {
  name: string;
  phone: string;
  treatmentCount: number;
  consultationCount: number;
  lastVisit: string;
  totalSpent: number;
}

interface PatientProfile {
  patient: { name: string; phone: string };
  treatments: {
    id: string;
    treatmentName: string;
    category: string | null;
    doctor: string | null;
    treatedAt: string;
    notificationSent: boolean;
    cycleDays: number | null;
    nextNotification: string | null;
  }[];
  consultations: {
    id: string;
    status: string;
    procedureTags: string[];
    treatmentType: string;
    message: string;
    assignee: string | null;
    createdAt: string;
  }[];
  notifications: {
    id: string;
    channel: string;
    status: string;
    sentAt: string;
    notes: string | null;
  }[];
  revenue: {
    totalSpent: number;
    visitCount: number;
    avgPerVisit: number;
    procedures: { name: string; count: number; total: number }[];
  };
}

// ─── Status Configs ─────────────────────────────
const CONSULT_STATUS_LABELS: Record<string, string> = {
  new: '신규', contacted: '연락완료', callback_scheduled: '콜백예정',
  no_answer: '부재중', not_interested: '관심없음', reserved: '예약확정',
  visited: '내원완료', completed: '완료', cancelled: '취소',
};

const CONSULT_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700', contacted: 'bg-sky-50 text-sky-700',
  callback_scheduled: 'bg-amber-50 text-amber-700', no_answer: 'bg-orange-50 text-orange-700',
  reserved: 'bg-emerald-50 text-emerald-700', visited: 'bg-teal-50 text-teal-700',
  completed: 'bg-gray-100 text-gray-600', cancelled: 'bg-red-50 text-red-600',
  not_interested: 'bg-gray-100 text-gray-500',
};

const CHANNEL_LABELS: Record<string, string> = {
  kakao: '카카오 알림톡', sms: 'SMS', phone: '전화',
};

// ─── Main Component ─────────────────────────────
export default function PatientsPage() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [activeTab, setActiveTab] = useState<'treatments' | 'consultations' | 'notifications' | 'revenue' | 'photos'>('treatments');

  const handleSearch = useCallback(async () => {
    if (!query.trim() || query.trim().length < 2) return;
    setSearching(true);
    setSearched(true);
    setSelectedPatient(null);
    setProfile(null);
    try {
      const res = await fetch(`/api/admin/patients/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.patients || []);
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }, [query]);

  const handleSelectPatient = useCallback(async (patient: PatientSearchResult) => {
    setSelectedPatient(patient);
    setLoadingProfile(true);
    setActiveTab('treatments');
    try {
      const params = new URLSearchParams({ name: patient.name });
      if (patient.phone) params.set('phone', patient.phone);
      const res = await fetch(`/api/admin/patients/profile?${params}`);
      if (res.ok) {
        setProfile(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
  };

  const formatKRW = (n: number) => n.toLocaleString('ko-KR');

  return (
    <div>
      {/* Header */}
      <div className="mb-5 lg:mb-7">
        <h2 className="text-lg lg:text-xl font-bold text-[#6d4e42] tracking-tight">환자 프로필 조회</h2>
        <p className="text-xs text-[#a09080] mt-1">환자명 또는 전화번호로 검색하여 시술/상담/매출 이력을 통합 조회합니다</p>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-2xl border border-[#ebe7e4] p-5 mb-5"
        style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04), 0 4px 12px rgba(109,78,66,0.03)' }}
      >
        <div className="flex gap-3">
          <div className="relative flex-1">
            <svg className="w-4.5 h-4.5 text-[#c5b8b0] absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="환자명 또는 전화번호 (2글자 이상)..."
              className="w-full border border-[#ebe7e4] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow placeholder:text-[#c5b8b0]"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || query.trim().length < 2}
            className="px-6 py-3 bg-[#6d4e42] text-white rounded-xl text-sm font-semibold hover:bg-[#5a3d33] transition-all cursor-pointer disabled:opacity-40 flex items-center gap-2 shadow-sm"
          >
            {searching ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
            검색
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex gap-5">
        {/* Left: Search results */}
        <div className={`${selectedPatient ? 'w-80 flex-shrink-0' : 'w-full max-w-md'}`}>
          {searched && !searching && results.length === 0 && (
            <div className="bg-white rounded-2xl border border-[#ebe7e4] p-10 text-center"
              style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
            >
              <div className="w-14 h-14 rounded-2xl bg-[#f6f4f2] flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-[#c5b8b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <p className="text-sm text-[#a09080]">검색 결과가 없습니다</p>
              <p className="text-xs text-[#c5b8b0] mt-1">이름 또는 전화번호를 확인해주세요</p>
            </div>
          )}

          {!searched && !searching && (
            <div className="bg-white rounded-2xl border border-[#ebe7e4] p-10 text-center"
              style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
            >
              <div className="w-14 h-14 rounded-2xl bg-[#f6f4f2] flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-[#c5b8b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <p className="text-sm text-[#a09080]">환자명 또는 전화번호로 검색하세요</p>
              <p className="text-xs text-[#c5b8b0] mt-1">시술, 상담, 알림, 매출 이력을 통합 조회합니다</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#ebe7e4] overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04), 0 4px 12px rgba(109,78,66,0.03)' }}
            >
              <div className="px-5 py-3 border-b border-[#ebe7e4] bg-[#faf8f7]">
                <span className="text-xs text-[#a09080] font-medium">검색 결과 {results.length}명</span>
              </div>
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                {results.map((p, idx) => {
                  const isSelected = selectedPatient?.name === p.name && selectedPatient?.phone === p.phone;
                  return (
                    <button
                      key={`${p.name}-${p.phone}-${idx}`}
                      onClick={() => handleSelectPatient(p)}
                      className={`w-full text-left px-5 py-4 border-b border-[#f5f2f0] last:border-0 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#b4988d]/[0.06] border-l-[3px] border-l-[#b4988d]'
                          : 'hover:bg-[#faf8f7]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-sm text-[#6d4e42]">{p.name}</span>
                        {p.totalSpent > 0 && (
                          <span className="text-[10px] text-[#b4988d] font-semibold">{formatKRW(p.totalSpent)}원</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#a09080]">
                        <span>{p.phone || '전화번호 없음'}</span>
                        <span className="text-[#e0d8d4]">|</span>
                        <span>시술 {p.treatmentCount}회</span>
                        {p.consultationCount > 0 && (
                          <>
                            <span className="text-[#e0d8d4]">|</span>
                            <span>상담 {p.consultationCount}건</span>
                          </>
                        )}
                      </div>
                      {p.lastVisit && (
                        <p className="text-[10px] text-[#c5b8b0] mt-1">최근: {formatDate(p.lastVisit)}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Patient profile */}
        {selectedPatient && (
          <div className="flex-1 min-w-0">
            {loadingProfile ? (
              <div className="bg-white rounded-2xl border border-[#ebe7e4] p-12 flex items-center justify-center"
                style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
              >
                <div className="text-center">
                  <div className="inline-block w-8 h-8 border-[3px] border-[#b4988d]/30 border-t-[#b4988d] rounded-full animate-spin mb-3" />
                  <p className="text-sm text-[#a09080]">프로필 로딩 중...</p>
                </div>
              </div>
            ) : profile ? (
              <div className="space-y-5">
                {/* Profile header */}
                <div className="bg-white rounded-2xl border border-[#ebe7e4] p-6"
                  style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04), 0 4px 12px rgba(109,78,66,0.03)' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#b4988d]/20 to-[#6d4e42]/10 flex items-center justify-center">
                        <span className="text-xl font-bold text-[#6d4e42]">{profile.patient.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#6d4e42]">{profile.patient.name}</h3>
                        <p className="text-sm text-[#a09080] mt-0.5">{profile.patient.phone || '전화번호 없음'}</p>
                      </div>
                    </div>
                    <div className="flex gap-6 text-center">
                      <div>
                        <p className="text-2xl font-bold text-[#6d4e42] tabular-nums">{profile.treatments.length}</p>
                        <p className="text-[10px] text-[#a09080] mt-0.5">시술 횟수</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#6d4e42] tabular-nums">{profile.consultations.length}</p>
                        <p className="text-[10px] text-[#a09080] mt-0.5">상담 건수</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#b4988d] tabular-nums">{formatKRW(profile.revenue.totalSpent)}</p>
                        <p className="text-[10px] text-[#a09080] mt-0.5">총 매출</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revenue summary cards */}
                {profile.revenue.visitCount > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gradient-to-br from-[#faf6f4] to-[#f5eeea] rounded-2xl border border-[#ebe7e4] p-4">
                      <p className="text-[10px] text-[#a09080] font-medium uppercase tracking-wide">총 매출</p>
                      <p className="text-xl font-bold text-[#6d4e42] mt-1 tabular-nums">{formatKRW(profile.revenue.totalSpent)}<span className="text-[10px] text-[#a09080] ml-0.5">원</span></p>
                    </div>
                    <div className="bg-gradient-to-br from-[#faf6f4] to-[#f5eeea] rounded-2xl border border-[#ebe7e4] p-4">
                      <p className="text-[10px] text-[#a09080] font-medium uppercase tracking-wide">방문 횟수</p>
                      <p className="text-xl font-bold text-[#6d4e42] mt-1 tabular-nums">{profile.revenue.visitCount}<span className="text-[10px] text-[#a09080] ml-0.5">회</span></p>
                    </div>
                    <div className="bg-gradient-to-br from-[#faf6f4] to-[#f5eeea] rounded-2xl border border-[#ebe7e4] p-4">
                      <p className="text-[10px] text-[#a09080] font-medium uppercase tracking-wide">평균 객단가</p>
                      <p className="text-xl font-bold text-[#6d4e42] mt-1 tabular-nums">{formatKRW(profile.revenue.avgPerVisit)}<span className="text-[10px] text-[#a09080] ml-0.5">원</span></p>
                    </div>
                  </div>
                )}

                {/* Tab navigation */}
                <div className="flex gap-0.5 bg-[#f6f4f2] p-1 rounded-xl">
                  {([
                    { id: 'treatments' as const, label: '시술 이력', count: profile.treatments.length },
                    { id: 'consultations' as const, label: '상담 이력', count: profile.consultations.length },
                    { id: 'notifications' as const, label: '알림 발송', count: profile.notifications.length },
                    { id: 'revenue' as const, label: '시술별 매출', count: profile.revenue.procedures.length },
                    { id: 'photos' as const, label: '사진', count: null },
                  ]).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                        activeTab === tab.id
                          ? 'bg-white text-[#6d4e42] shadow-sm'
                          : 'text-[#a09080] hover:text-[#575756]'
                      }`}
                    >
                      {tab.label}
                      {tab.count !== null && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${
                          activeTab === tab.id ? 'bg-[#b4988d]/15 text-[#b4988d]' : 'bg-[#e0d8d4]/50 text-[#a09080]'
                        }`}>{tab.count}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="bg-white rounded-2xl border border-[#ebe7e4] overflow-hidden"
                  style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04), 0 4px 12px rgba(109,78,66,0.03)' }}
                >
                  {/* Treatments tab */}
                  {activeTab === 'treatments' && (
                    profile.treatments.length === 0 ? (
                      <EmptyState message="시술 이력이 없습니다" />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#ebe7e4]">
                              <th className="text-left py-3 px-5 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">시술일</th>
                              <th className="text-left py-3 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">시술명</th>
                              <th className="text-left py-3 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">담당의</th>
                              <th className="text-center py-3 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">알림주기</th>
                              <th className="text-center py-3 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">알림발송</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profile.treatments.map((t) => (
                              <tr key={t.id} className="border-b border-[#f5f2f0] last:border-0 hover:bg-[#faf8f7]">
                                <td className="py-3 px-5 text-[#575756] tabular-nums">{formatDate(t.treatedAt)}</td>
                                <td className="py-3 px-4">
                                  <span className="font-medium text-[#6d4e42]">{t.treatmentName}</span>
                                  {t.category && <span className="text-[10px] text-[#b4988d] ml-1.5">({t.category})</span>}
                                </td>
                                <td className="py-3 px-4 text-[#8a8a8a]">{t.doctor || '-'}</td>
                                <td className="py-3 px-4 text-center text-[#8a8a8a] tabular-nums">{t.cycleDays ? `${t.cycleDays}일` : '-'}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                    t.notificationSent ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {t.notificationSent ? '발송완료' : '미발송'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}

                  {/* Consultations tab */}
                  {activeTab === 'consultations' && (
                    profile.consultations.length === 0 ? (
                      <EmptyState message="상담 이력이 없습니다" />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#ebe7e4]">
                              <th className="text-left py-3 px-5 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">접수일</th>
                              <th className="text-left py-3 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">시술</th>
                              <th className="text-center py-3 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">상태</th>
                              <th className="text-left py-3 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">담당자</th>
                              <th className="text-left py-3 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">메시지</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profile.consultations.map((c) => (
                              <tr key={c.id} className="border-b border-[#f5f2f0] last:border-0 hover:bg-[#faf8f7]">
                                <td className="py-3 px-5 text-[#575756] tabular-nums">{formatDate(c.createdAt)}</td>
                                <td className="py-3 px-4">
                                  <div className="flex flex-wrap gap-1">
                                    {c.procedureTags.length > 0 ? c.procedureTags.map((tag, i) => (
                                      <span key={i} className="text-[10px] bg-[#b4988d]/10 text-[#b4988d] px-1.5 py-0.5 rounded-md font-medium">{tag}</span>
                                    )) : (
                                      <span className="text-[#8a8a8a]">{c.treatmentType || '-'}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-semibold ${CONSULT_STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-500'}`}>
                                    {CONSULT_STATUS_LABELS[c.status] || c.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-[#8a8a8a]">{c.assignee || '-'}</td>
                                <td className="py-3 px-4 text-[#8a8a8a] truncate max-w-[200px]">{c.message || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}

                  {/* Notifications tab */}
                  {activeTab === 'notifications' && (
                    profile.notifications.length === 0 ? (
                      <EmptyState message="알림 발송 이력이 없습니다" />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#ebe7e4]">
                              <th className="text-left py-3 px-5 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">발송일</th>
                              <th className="text-left py-3 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">채널</th>
                              <th className="text-center py-3 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">상태</th>
                              <th className="text-left py-3 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">메모</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profile.notifications.map((n) => (
                              <tr key={n.id} className="border-b border-[#f5f2f0] last:border-0 hover:bg-[#faf8f7]">
                                <td className="py-3 px-5 text-[#575756] tabular-nums">{formatDate(n.sentAt)}</td>
                                <td className="py-3 px-4 text-[#575756]">{CHANNEL_LABELS[n.channel] || n.channel}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                    n.status === 'sent' ? 'bg-emerald-50 text-emerald-700' :
                                    n.status === 'failed' ? 'bg-red-50 text-red-600' :
                                    'bg-gray-100 text-gray-500'
                                  }`}>
                                    {n.status === 'sent' ? '발송완료' : n.status === 'failed' ? '실패' : n.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-[#8a8a8a]">{n.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}

                  {/* Revenue tab */}
                  {activeTab === 'revenue' && (
                    profile.revenue.procedures.length === 0 ? (
                      <EmptyState message="매출 데이터가 없습니다" />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#ebe7e4]">
                              <th className="text-left py-3 px-5 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">시술명</th>
                              <th className="text-right py-3 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">횟수</th>
                              <th className="text-right py-3 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">총 금액</th>
                              <th className="text-right py-3 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">평균</th>
                              <th className="text-left py-3 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider w-40">비중</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profile.revenue.procedures.map((proc) => {
                              const pct = profile.revenue.totalSpent > 0
                                ? Math.round((proc.total / profile.revenue.totalSpent) * 100)
                                : 0;
                              return (
                                <tr key={proc.name} className="border-b border-[#f5f2f0] last:border-0 hover:bg-[#faf8f7]">
                                  <td className="py-3 px-5 font-medium text-[#6d4e42]">{proc.name}</td>
                                  <td className="py-3 px-4 text-right text-[#575756] tabular-nums">{proc.count}회</td>
                                  <td className="py-3 px-4 text-right font-semibold text-[#6d4e42] tabular-nums">{formatKRW(proc.total)}원</td>
                                  <td className="py-3 px-4 text-right text-[#8a8a8a] tabular-nums">{formatKRW(Math.round(proc.total / proc.count))}원</td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-2 bg-[#f0eeec] rounded-full overflow-hidden">
                                        <div className="h-full bg-[#b4988d] rounded-full transition-all" style={{ width: `${pct}%` }} />
                                      </div>
                                      <span className="text-[10px] text-[#a09080] tabular-nums w-8 text-right">{pct}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}

                  {/* Photos tab */}
                  {activeTab === 'photos' && (
                    <PatientPhotoGallery
                      patientName={profile.patient.name}
                      phone={profile.patient.phone}
                    />
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty state helper ─────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-[#a09080]">
      <div className="w-12 h-12 rounded-2xl bg-[#f6f4f2] flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-[#c5b8b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <span className="text-sm">{message}</span>
    </div>
  );
}
