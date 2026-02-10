'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  AnalyticsPeriod,
  GA4AnalyticsData,
  GA4DailyTrend,
  GA4TopPage,
  GA4Source,
  GA4Device,
} from '@/types/analytics';

// ─── API ──────────────────────────────────────────
async function fetchAnalytics(period: AnalyticsPeriod): Promise<GA4AnalyticsData> {
  const res = await fetch(`/api/admin/analytics/google?period=${period}`);
  if (res.status === 503) {
    const body = await res.json();
    throw new Error(body.message || 'GA4_NOT_CONFIGURED');
  }
  if (!res.ok) throw new Error('Analytics 데이터를 불러오지 못했습니다.');
  return res.json();
}

// ─── 유틸 ──────────────────────────────────────────
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR');
}

function formatDate(dateStr: string): string {
  // YYYYMMDD → MM/DD
  if (dateStr.length === 8) {
    return `${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`;
  }
  return dateStr;
}

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  '7d': '최근 7일',
  '30d': '최근 30일',
  '90d': '최근 90일',
};

const NAVER_ANALYTICS_URL = 'https://analytics.naver.com';

// ─── 메인 컴포넌트 ──────────────────────────────────
export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [data, setData] = useState<GA4AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const loadData = useCallback(async (p: AnalyticsPeriod) => {
    setLoading(true);
    setError(null);
    setNotConfigured(false);
    try {
      const result = await fetchAnalytics(p);
      setData(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.';
      if (msg.includes('GA4_NOT_CONFIGURED') || msg.includes('설정되지')) {
        setNotConfigured(true);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(period); }, [period, loadData]);

  return (
    <div>
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 lg:mb-6">
        <h2 className="text-lg lg:text-xl font-bold text-[#6d4e42]">Analytics</h2>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as AnalyticsPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                period === p
                  ? 'bg-[#6d4e42] text-white'
                  : 'border border-[#e5e5e5] text-[#575756] hover:bg-[#f6f6f6]'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-[#b4988d] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[#8a8a8a] text-sm">Google Analytics 데이터를 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* 미설정 안내 */}
      {notConfigured && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <h3 className="font-bold text-amber-800 mb-2">Google Analytics 연동 필요</h3>
          <p className="text-sm text-amber-700 mb-4">
            GA4 데이터를 확인하려면 환경변수 설정이 필요합니다.
          </p>
          <div className="bg-white rounded-lg p-4 text-sm font-mono text-[#575756] space-y-1">
            <p>GA4_PROPERTY_ID=숫자ID</p>
            <p>GOOGLE_CLIENT_EMAIL=xxx@xxx.iam.gserviceaccount.com</p>
            <p>GOOGLE_PRIVATE_KEY=&quot;-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n&quot;</p>
          </div>
          <p className="text-xs text-amber-600 mt-3">
            Google Cloud Console에서 Service Account를 생성하고, GA4 속성에 뷰어 권한을 부여해주세요.
          </p>
        </div>
      )}

      {/* 에러 (미설정이 아닌 경우) */}
      {error && !notConfigured && !loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-red-600 font-medium mb-2">{error}</p>
            <button
              onClick={() => loadData(period)}
              className="px-4 py-2 bg-[#6d4e42] text-white rounded-lg text-sm hover:bg-[#5a3d33] transition-colors cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* 데이터 표시 */}
      {!loading && !error && data && <>
        {/* KPI 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard
            label="세션"
            value={formatNumber(data.overview.sessions)}
            icon="👥"
            color="bg-blue-50 text-blue-700"
          />
          <KpiCard
            label="사용자"
            value={formatNumber(data.overview.users)}
            icon="👤"
            color="bg-emerald-50 text-emerald-700"
          />
          <KpiCard
            label="페이지뷰"
            value={formatNumber(data.overview.pageviews)}
            icon="📄"
            color="bg-purple-50 text-purple-700"
          />
          <KpiCard
            label="이탈률"
            value={`${(data.overview.bounceRate * 100).toFixed(1)}%`}
            sub={`평균 체류 ${formatDuration(data.overview.avgSessionDuration)}`}
            icon="↩️"
            color="bg-amber-50 text-amber-700"
          />
        </div>

        {/* 방문자 추이 차트 */}
        <DailyTrendChart daily={data.dailyTrend} />

        {/* 유입 경로 + 기기별 접속 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <SourcesChart sources={data.sources} />
          <DevicesChart devices={data.devices} />
        </div>

        {/* 인기 페이지 테이블 */}
        <TopPagesTable pages={data.topPages} totalPageviews={data.overview.pageviews} />
      </>}

      {/* Naver Analytics 바로가기 */}
      <NaverAnalyticsCard />
    </div>
  );
}

// ─── KPI 카드 ──────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-[#e5e5e5]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <p className="text-sm text-[#8a8a8a]">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color} inline-block px-2 py-0.5 rounded-lg`}>
        {value}
      </p>
      {sub && <p className="text-xs text-[#8a8a8a] mt-2">{sub}</p>}
    </div>
  );
}

// ─── 방문자 추이 차트 ──────────────────────────────────
function DailyTrendChart({ daily }: { daily: GA4DailyTrend[] }) {
  const maxVal = Math.max(...daily.map((d) => Math.max(d.sessions, d.pageviews)), 1);

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm text-[#6d4e42]">방문자 추이</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-400" /> 세션
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> 페이지뷰
          </span>
        </div>
      </div>
      <div className="flex items-end gap-px h-40 overflow-x-auto">
        {daily.map((d) => (
          <div key={d.date} className="flex-1 min-w-[8px] flex flex-col items-center gap-px group relative">
            <div
              className="w-full bg-emerald-400 rounded-t-sm min-h-[2px] transition-all"
              style={{ height: `${(d.pageviews / maxVal) * 100}%` }}
            />
            <div
              className="w-full bg-blue-400 rounded-t-sm min-h-[2px] transition-all"
              style={{ height: `${(d.sessions / maxVal) * 100}%` }}
            />
            {/* 툴팁 */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#6d4e42] text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
              <p className="font-medium">{formatDate(d.date)}</p>
              <p>세션 {formatNumber(d.sessions)} / PV {formatNumber(d.pageviews)}</p>
            </div>
          </div>
        ))}
      </div>
      {/* X축 날짜 라벨 */}
      <div className="flex gap-px mt-1 overflow-x-auto">
        {daily.map((d, i) => {
          const showLabel = daily.length <= 10 || (daily.length <= 35 ? i % 5 === 0 : i % 10 === 0);
          return (
            <div key={d.date} className="flex-1 min-w-[8px] text-center">
              {showLabel && (
                <span className="text-[9px] text-[#8a8a8a]">{formatDate(d.date)}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 유입 경로 차트 ──────────────────────────────────
function SourcesChart({ sources }: { sources: GA4Source[] }) {
  const maxVal = sources[0]?.sessions || 1;
  const total = sources.reduce((s, src) => s + src.sessions, 0);

  const channelColors: Record<string, string> = {
    'Organic Search': 'bg-emerald-400',
    'Direct': 'bg-blue-400',
    'Referral': 'bg-purple-400',
    'Organic Social': 'bg-pink-400',
    'Paid Search': 'bg-amber-400',
    'Paid Social': 'bg-rose-400',
    'Email': 'bg-sky-400',
    'Display': 'bg-orange-400',
  };

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
      <h3 className="font-bold text-sm text-[#6d4e42] mb-4">유입 경로</h3>
      <div className="space-y-3">
        {sources.map((src) => {
          const pct = total > 0 ? ((src.sessions / total) * 100).toFixed(1) : '0';
          const barColor = channelColors[src.channel] || 'bg-[#b4988d]';
          return (
            <div key={src.channel}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-[#575756]">{src.channel}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#6d4e42]">{formatNumber(src.sessions)}</span>
                  <span className="text-xs text-[#8a8a8a]">({pct}%)</span>
                </div>
              </div>
              <div className="w-full bg-[#f0f0f0] rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${barColor} transition-all`}
                  style={{ width: `${(src.sessions / maxVal) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 기기별 접속 차트 ──────────────────────────────────
function DevicesChart({ devices }: { devices: GA4Device[] }) {
  const total = devices.reduce((s, d) => s + d.sessions, 0);
  const maxVal = Math.max(...devices.map((d) => d.sessions), 1);

  const deviceColors: Record<string, string> = {
    desktop: 'bg-blue-400',
    mobile: 'bg-emerald-400',
    tablet: 'bg-purple-400',
  };

  const deviceLabels: Record<string, string> = {
    desktop: '데스크톱',
    mobile: '모바일',
    tablet: '태블릿',
  };

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
      <h3 className="font-bold text-sm text-[#6d4e42] mb-4">기기별 접속</h3>
      <div className="flex items-end justify-center gap-6 h-40 mb-4">
        {devices.map((d) => {
          const pct = total > 0 ? ((d.sessions / total) * 100).toFixed(1) : '0';
          const barColor = deviceColors[d.device] || 'bg-[#b4988d]';
          const height = (d.sessions / maxVal) * 100;
          return (
            <div key={d.device} className="flex flex-col items-center gap-2 flex-1 max-w-[100px]">
              <span className="text-xs font-medium text-[#6d4e42]">{pct}%</span>
              <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                <div
                  className={`w-12 ${barColor} rounded-t-lg transition-all`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
              </div>
              <span className="text-xs text-[#575756]">{deviceLabels[d.device] || d.device}</span>
              <span className="text-xs text-[#8a8a8a]">{formatNumber(d.sessions)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 인기 페이지 테이블 ──────────────────────────────────
function TopPagesTable({ pages, totalPageviews }: { pages: GA4TopPage[]; totalPageviews: number }) {
  const maxPV = pages[0]?.pageviews || 1;

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-[#e5e5e5]">
        <h3 className="font-bold text-sm text-[#6d4e42]">인기 페이지 TOP 10</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e5e5] bg-[#f6f6f6]">
              <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium w-8">#</th>
              <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">페이지 경로</th>
              <th className="text-right py-3 px-4 text-[#8a8a8a] font-medium">조회수</th>
              <th className="text-right py-3 px-4 text-[#8a8a8a] font-medium">평균 체류</th>
              <th className="py-3 px-4 text-[#8a8a8a] font-medium w-32">비중</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page, i) => {
              const pct = totalPageviews > 0 ? ((page.pageviews / totalPageviews) * 100).toFixed(1) : '0';
              return (
                <tr key={page.path} className="border-b border-[#f0f0f0] last:border-0">
                  <td className="py-3 px-4 text-[#8a8a8a] font-medium">{i + 1}</td>
                  <td className="py-3 px-4 font-medium text-[#6d4e42] max-w-[300px] truncate" title={page.path}>
                    {page.path}
                  </td>
                  <td className="py-3 px-4 text-right">{formatNumber(page.pageviews)}</td>
                  <td className="py-3 px-4 text-right text-[#8a8a8a]">{formatDuration(page.avgDuration)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#f0f0f0] rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-[#b4988d] transition-all"
                          style={{ width: `${(page.pageviews / maxPV) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#8a8a8a] w-10 text-right">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {pages.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#8a8a8a]">
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Naver Analytics 바로가기 ──────────────────────────
function NaverAnalyticsCard() {
  return (
    <div className="bg-[#03C75A]/5 border border-[#03C75A]/20 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-[#03C75A] mb-1">Naver Analytics</h3>
          <p className="text-xs text-[#575756]">
            네이버 애널리틱스는 별도 대시보드에서 확인할 수 있습니다.
          </p>
        </div>
        <a
          href={NAVER_ANALYTICS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#03C75A] text-white rounded-lg text-sm font-medium hover:bg-[#02b351] transition-colors"
        >
          바로가기
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </div>
  );
}
