'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  type PaymentMethod,
  type PaymentStatus,
} from '@/types/admin';
import CsvUploadModal from '@/components/admin/CsvUploadModal';

// ─── 타입 ──────────────────────────────────────
interface Transaction {
  id: string;
  patientName: string;
  procedure: string;
  priceKrw: number | null;
  discountKrw: number | null;
  netAmount: number;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus | null;
  doctor: string;
  createdAt: string;
}

interface KPIs {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  avgPerCase: number;
  totalCases: number;
}

interface DailyTrend {
  date: string;
  revenue: number;
  count: number;
}

interface RevenueData {
  kpis: KPIs;
  transactions: Transaction[];
  dailyTrend: DailyTrend[];
}

// ─── 유틸 ──────────────────────────────────────
function formatMoney(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${Math.round(n / 10000).toLocaleString('ko-KR')}만`;
  return n.toLocaleString('ko-KR');
}

function formatMoneyFull(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─── CSV 내보내기 ──────────────────────────────
function exportCSV(transactions: Transaction[]) {
  const headers = '날짜,환자명,시술,금액,할인,최종금액,결제수단,상태,의사';
  const rows = transactions.map((t) =>
    [
      new Date(t.createdAt).toLocaleDateString('ko-KR'),
      `"${t.patientName}"`,
      `"${t.procedure}"`,
      t.priceKrw ?? 0,
      t.discountKrw ?? 0,
      t.netAmount,
      t.paymentMethod ? PAYMENT_METHOD_LABELS[t.paymentMethod] : '',
      t.paymentStatus ? PAYMENT_STATUS_LABELS[t.paymentStatus] : '',
      `"${t.doctor}"`,
    ].join(',')
  );

  const csv = '\uFEFF' + [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `매출내역_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── 페이지 ──────────────────────────────────
export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editMethod, setEditMethod] = useState<PaymentMethod>('CARD');
  const [saving, setSaving] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/revenue?period=${period}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 인라인 결제 처리
  const handlePayment = async (id: string) => {
    if (!editPrice || isNaN(Number(editPrice))) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/operations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceKrw: Number(editPrice),
          paymentMethod: editMethod,
          paymentStatus: 'COMPLETED',
        }),
      });
      if (res.ok) {
        setEditingId(null);
        setEditPrice('');
        fetchData();
      }
    } finally {
      setSaving(false);
    }
  };

  // 환불 처리
  const handleRefund = async (id: string) => {
    if (!confirm('환불 처리하시겠습니까?')) return;
    await fetch(`/api/admin/operations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: 'REFUNDED' }),
    });
    fetchData();
  };

  const filteredTransactions = data?.transactions.filter(
    (t) => statusFilter === 'ALL' || t.paymentStatus === statusFilter
  ) || [];

  // 바 차트 최대값
  const maxRevenue = data ? Math.max(...data.dailyTrend.map((d) => d.revenue), 1) : 1;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#6d4e42]">매출관리</h1>
          <p className="text-sm text-[#8a8a8a] mt-1">결제 현황 및 매출 추이</p>
        </div>
        <div className="flex items-center gap-2">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
                period === p
                  ? 'bg-[#b4988d] text-white'
                  : 'bg-white text-[#575756] border border-[#e5e5e5] hover:bg-[#f6f6f6]'
              }`}
            >
              {p === 'today' ? '오늘' : p === 'week' ? '이번주' : '이번달'}
            </button>
          ))}
          <button
            onClick={() => setCsvModalOpen(true)}
            className="px-3 py-1.5 text-sm rounded-lg bg-[#b4988d] text-white hover:bg-[#a08878] transition-colors cursor-pointer"
          >
            CSV 업로드
          </button>
          <button
            onClick={() => data && exportCSV(filteredTransactions)}
            className="px-3 py-1.5 text-sm rounded-lg bg-white border border-[#e5e5e5] text-[#575756] hover:bg-[#f6f6f6] transition-colors cursor-pointer"
          >
            CSV 내보내기
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#b4988d] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div className="text-center py-20 text-[#8a8a8a]">데이터를 불러오지 못했습니다.</div>
      ) : (
        <>
          {/* KPI 카드 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '오늘 매출', value: data.kpis.todayRevenue, prefix: '', suffix: '원' },
              { label: '이번주 매출', value: data.kpis.weekRevenue, prefix: '', suffix: '원' },
              { label: '이번달 매출', value: data.kpis.monthRevenue, prefix: '', suffix: '원' },
              { label: '건당 평균', value: data.kpis.avgPerCase, prefix: '', suffix: '원' },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-xl border border-[#e5e5e5] p-5">
                <p className="text-xs text-[#8a8a8a] mb-1">{kpi.label}</p>
                <p className="text-xl font-bold text-[#6d4e42]">
                  {formatMoney(kpi.value)}<span className="text-sm font-normal text-[#8a8a8a]">{kpi.suffix}</span>
                </p>
              </div>
            ))}
          </div>

          {/* 7일 매출 추이 바 차트 */}
          <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
            <h2 className="text-sm font-semibold text-[#6d4e42] mb-4">7일 매출 추이</h2>
            <div className="flex items-end gap-2 h-40">
              {data.dailyTrend.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-[#8a8a8a]">
                    {d.revenue > 0 ? formatMoney(d.revenue) : ''}
                  </span>
                  <div
                    className="w-full bg-[#b4988d]/80 rounded-t-md transition-all min-h-[2px]"
                    style={{ height: `${Math.max((d.revenue / maxRevenue) * 120, 2)}px` }}
                  />
                  <span className="text-[10px] text-[#8a8a8a]">{d.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 결제 상태 필터 탭 */}
          <div className="flex items-center gap-1 bg-white rounded-xl border border-[#e5e5e5] p-1">
            {(['ALL', 'COMPLETED', 'PENDING', 'REFUNDED'] as const).map((s) => {
              const count = s === 'ALL'
                ? data.transactions.length
                : data.transactions.filter((t) => t.paymentStatus === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                    statusFilter === s
                      ? 'bg-[#b4988d] text-white'
                      : 'text-[#575756] hover:bg-[#f6f6f6]'
                  }`}
                >
                  {s === 'ALL' ? '전체' : PAYMENT_STATUS_LABELS[s]} ({count})
                </button>
              );
            })}
          </div>

          {/* 거래 내역 테이블 */}
          <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5] bg-[#f6f6f6]">
                    <th className="text-left px-4 py-3 font-medium text-[#575756]">날짜</th>
                    <th className="text-left px-4 py-3 font-medium text-[#575756]">환자명</th>
                    <th className="text-left px-4 py-3 font-medium text-[#575756]">시술</th>
                    <th className="text-right px-4 py-3 font-medium text-[#575756]">금액</th>
                    <th className="text-right px-4 py-3 font-medium text-[#575756]">할인</th>
                    <th className="text-right px-4 py-3 font-medium text-[#575756]">최종금액</th>
                    <th className="text-center px-4 py-3 font-medium text-[#575756]">결제수단</th>
                    <th className="text-center px-4 py-3 font-medium text-[#575756]">상태</th>
                    <th className="text-left px-4 py-3 font-medium text-[#575756]">의사</th>
                    <th className="text-center px-4 py-3 font-medium text-[#575756]">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-[#8a8a8a]">
                        해당 기간의 거래 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => (
                      <tr key={t.id} className="border-b border-[#e5e5e5] hover:bg-[#fafafa]">
                        <td className="px-4 py-3 text-[#8a8a8a] whitespace-nowrap">{formatDate(t.createdAt)}</td>
                        <td className="px-4 py-3 font-medium text-[#6d4e42]">{t.patientName}</td>
                        <td className="px-4 py-3 text-[#575756]">{t.procedure}</td>
                        <td className="px-4 py-3 text-right text-[#575756]">
                          {t.priceKrw != null ? formatMoneyFull(t.priceKrw) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-[#8a8a8a]">
                          {t.discountKrw ? `-${formatMoneyFull(t.discountKrw)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-[#6d4e42]">
                          {t.priceKrw != null ? formatMoneyFull(t.netAmount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-[#575756]">
                          {t.paymentMethod ? PAYMENT_METHOD_LABELS[t.paymentMethod] : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {t.paymentStatus ? (
                            <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${PAYMENT_STATUS_COLORS[t.paymentStatus]}`}>
                              {PAYMENT_STATUS_LABELS[t.paymentStatus]}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-[#575756]">{t.doctor}</td>
                        <td className="px-4 py-3 text-center">
                          {t.paymentStatus === 'PENDING' && editingId !== t.id && (
                            <button
                              onClick={() => {
                                setEditingId(t.id);
                                setEditPrice(t.priceKrw != null ? String(t.priceKrw) : '');
                                setEditMethod('CARD');
                              }}
                              className="text-xs text-[#b4988d] hover:underline cursor-pointer"
                            >
                              결제처리
                            </button>
                          )}
                          {t.paymentStatus === 'COMPLETED' && (
                            <button
                              onClick={() => handleRefund(t.id)}
                              className="text-xs text-red-400 hover:underline cursor-pointer"
                            >
                              환불
                            </button>
                          )}
                          {editingId === t.id && (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                placeholder="금액"
                                className="w-24 px-2 py-1 text-xs border border-[#e5e5e5] rounded"
                              />
                              <select
                                value={editMethod}
                                onChange={(e) => setEditMethod(e.target.value as PaymentMethod)}
                                className="px-1 py-1 text-xs border border-[#e5e5e5] rounded"
                              >
                                {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(([k, v]) => (
                                  <option key={k} value={k}>{v}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handlePayment(t.id)}
                                disabled={saving}
                                className="px-2 py-1 text-xs bg-[#b4988d] text-white rounded hover:bg-[#a08878] cursor-pointer disabled:opacity-50"
                              >
                                확인
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-2 py-1 text-xs text-[#8a8a8a] hover:text-[#575756] cursor-pointer"
                              >
                                취소
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* CSV Upload Modal */}
      <CsvUploadModal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onComplete={() => fetchData()}
      />
    </div>
  );
}
