import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import Link from 'next/link';
import TodayCallbacks from '@/components/admin/TodayCallbacks';

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const admin = createAdminClient();

  // Fetch stats
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const todayStr = now.toISOString().split('T')[0];

  // 7일 전 날짜
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const [
    { count: todayCount },
    { count: callbackCount },
    { count: monthCount },
    { count: activeEventsCount },
    { count: activePopupsCount },
    { data: recentConsultations },
  ] = await Promise.all([
    supabase.from('consultation_requests').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
    supabase.from('consultation_requests').select('*', { count: 'exact', head: true })
      .in('status', ['callback_scheduled', 'no_answer', 're_contact'])
      .gte('next_followup_at', `${todayStr}T00:00:00`)
      .lte('next_followup_at', `${todayStr}T23:59:59`),
    supabase.from('consultation_requests').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_published', true).gte('end_date', todayStr),
    supabase.from('popups').select('*', { count: 'exact', head: true }).eq('is_active', true).lte('display_start', now.toISOString()).gte('display_end', now.toISOString()),
    supabase.from('consultation_requests').select('*').order('created_at', { ascending: false }).limit(5),
  ]);

  // Admin client queries (service role) - 시술 건수 + 알림 + 7일 트렌드
  let notificationTodayCount: number | null = 0;
  let todayProcedureCount = 0;
  let weeklyConsultData: { created_at: string }[] = [];
  let weeklyOpsData: { created_at: string }[] = [];

  try {
    const [notifResult, opsResult, weekConsultResult, weekOpsResult] = await Promise.all([
      admin.from('patient_treatments').select('*', { count: 'exact', head: true })
        .eq('notification_sent', false)
        .not('next_notification_at', 'is', null)
        .lte('next_notification_at', `${todayStr}T23:59:59`),
      admin.from('operation_cases').select('*', { count: 'exact', head: true })
        .gte('created_at', `${todayStr}T00:00:00+09:00`)
        .lte('created_at', `${todayStr}T23:59:59+09:00`),
      admin.from('consultation_requests').select('created_at')
        .gte('created_at', `${sevenDaysAgoStr}T00:00:00`)
        .lte('created_at', `${todayStr}T23:59:59`),
      admin.from('operation_cases').select('created_at')
        .gte('created_at', `${sevenDaysAgoStr}T00:00:00+09:00`)
        .lte('created_at', `${todayStr}T23:59:59+09:00`),
    ]);

    notificationTodayCount = notifResult.count;
    todayProcedureCount = opsResult.count ?? 0;
    weeklyConsultData = weekConsultResult.data || [];
    weeklyOpsData = weekOpsResult.data || [];
  } catch {
    // Fallback silently
  }

  // 7일 트렌드 데이터 집계
  const weekDays: string[] = [];
  const weekLabels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    weekDays.push(d.toISOString().split('T')[0]);
    weekLabels.push(`${d.getMonth() + 1}/${d.getDate()}`);
  }

  const consultByDay: Record<string, number> = {};
  const opsByDay: Record<string, number> = {};
  for (const c of weeklyConsultData) {
    const day = new Date(c.created_at).toISOString().split('T')[0];
    consultByDay[day] = (consultByDay[day] || 0) + 1;
  }
  for (const o of weeklyOpsData) {
    const day = new Date(o.created_at).toISOString().split('T')[0];
    opsByDay[day] = (opsByDay[day] || 0) + 1;
  }

  const weeklyTrend = weekDays.map((day, i) => ({
    label: weekLabels[i],
    consults: consultByDay[day] || 0,
    ops: opsByDay[day] || 0,
  }));

  const maxTrendValue = Math.max(1, ...weeklyTrend.map((d) => Math.max(d.consults, d.ops)));

  const stats = [
    { label: '오늘 신규 상담', value: todayCount ?? 0, href: '/admin/consultations', color: 'bg-blue-50 text-blue-700', icon: '💬' },
    { label: '오늘 콜백 예정', value: callbackCount ?? 0, href: '/admin/consultations', color: 'bg-amber-50 text-amber-700', icon: '📞' },
    { label: '오늘 시술/운영', value: todayProcedureCount, href: '/admin/operations', color: 'bg-teal-50 text-teal-700', icon: '🏥' },
    { label: '이번달 상담', value: monthCount ?? 0, href: '/admin/consultations', color: 'bg-green-50 text-green-700', icon: '📊' },
    { label: '오늘 알림 발송', value: notificationTodayCount ?? 0, href: '/admin/notifications', color: 'bg-orange-50 text-orange-700', icon: '🔔' },
    { label: '진행중 이벤트', value: activeEventsCount ?? 0, href: '/admin/events', color: 'bg-purple-50 text-purple-700', icon: '🎉' },
    { label: '활성 팝업', value: activePopupsCount ?? 0, href: '/admin/popups', color: 'bg-pink-50 text-pink-700', icon: '🪟' },
  ];

  const STATUS_LABELS: Record<string, string> = {
    new: '신규',
    callback_scheduled: '콜백 예정',
    no_answer: '부재중',
    re_contact: '재연락',
    reservation_confirmed: '예약확정',
    no_show: '노쇼',
    completed: '완료',
    cancelled: '취소',
    pending: '대기중',
    contacted: '연락완료',
  };

  const STATUS_COLORS: Record<string, string> = {
    new: 'bg-amber-100 text-amber-700',
    callback_scheduled: 'bg-blue-100 text-blue-700',
    no_answer: 'bg-orange-100 text-orange-700',
    re_contact: 'bg-purple-100 text-purple-700',
    reservation_confirmed: 'bg-green-100 text-green-700',
    no_show: 'bg-red-100 text-red-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-gray-100 text-gray-500',
    pending: 'bg-amber-100 text-amber-700',
    contacted: 'bg-blue-100 text-blue-700',
  };

  return (
    <div>
      <h2 className="text-lg lg:text-xl font-bold text-[#6d4e42] mb-4 lg:mb-6">대시보드</h2>

      {/* Stats Cards - 7 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 lg:gap-4 mb-6 lg:mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl p-3 lg:p-4 border border-[#e5e5e5] hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{stat.icon}</span>
              <p className="text-xs text-[#8a8a8a] truncate">{stat.label}</p>
            </div>
            <p className={`text-2xl lg:text-3xl font-bold ${stat.color} inline-block px-2 py-0.5 rounded-lg group-hover:scale-105 transition-transform`}>
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      {/* 7-Day Trend + Notification Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 lg:mb-8">
        {/* Weekly Trend Chart */}
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-4">
          <h3 className="font-bold text-[#6d4e42] text-sm mb-3">최근 7일 추이</h3>
          <div className="flex items-end gap-1 h-28">
            {weeklyTrend.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex flex-col items-center gap-[2px]" style={{ height: '80px' }}>
                  <div className="flex items-end gap-[2px] w-full justify-center" style={{ height: '80px' }}>
                    {/* 상담 바 */}
                    <div
                      className="bg-blue-400 rounded-t w-2.5 min-h-[2px] transition-all"
                      style={{ height: `${Math.max(2, (d.consults / maxTrendValue) * 72)}px` }}
                      title={`상담 ${d.consults}건`}
                    />
                    {/* 시술 바 */}
                    <div
                      className="bg-teal-400 rounded-t w-2.5 min-h-[2px] transition-all"
                      style={{ height: `${Math.max(2, (d.ops / maxTrendValue) * 72)}px` }}
                      title={`시술 ${d.ops}건`}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-[#8a8a8a]">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-[#8a8a8a]">
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded bg-blue-400" /> 상담</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded bg-teal-400" /> 시술</span>
          </div>
        </div>

        {/* Notification Alert */}
        <div className="flex flex-col gap-4">
          {(notificationTodayCount ?? 0) > 0 && (
            <Link href="/admin/notifications" className="block bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-2xl">&#128276;</span>
                <div>
                  <p className="text-sm font-medium text-amber-800">오늘 발송해야 할 알림이 {notificationTodayCount}건 있습니다</p>
                  <p className="text-xs text-amber-600 mt-0.5">알림관리에서 확인하고 발송 처리해 주세요.</p>
                </div>
              </div>
            </Link>
          )}
          {/* Quick Summary */}
          <div className="bg-white rounded-xl border border-[#e5e5e5] p-4 flex-1">
            <h3 className="font-bold text-[#6d4e42] text-sm mb-3">이번주 요약</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#8a8a8a]">7일간 상담</span>
                <span className="text-sm font-bold text-blue-700">{weeklyTrend.reduce((s, d) => s + d.consults, 0)}건</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#8a8a8a]">7일간 시술</span>
                <span className="text-sm font-bold text-teal-700">{weeklyTrend.reduce((s, d) => s + d.ops, 0)}건</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#8a8a8a]">일 평균 상담</span>
                <span className="text-sm font-medium text-[#575756]">{(weeklyTrend.reduce((s, d) => s + d.consults, 0) / 7).toFixed(1)}건</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today Callbacks Widget */}
      <div className="mb-8">
        <TodayCallbacks />
      </div>

      {/* Recent Consultations */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#6d4e42] text-sm lg:text-base">최근 상담 신청</h3>
          <Link href="/admin/consultations" className="text-sm text-[#b4988d] hover:underline">
            전체보기
          </Link>
        </div>

        {recentConsultations && recentConsultations.length > 0 ? (
          <>
            {/* Mobile: Card layout */}
            <div className="space-y-3 lg:hidden">
              {recentConsultations.map((c) => (
                <div key={c.id} className="border border-[#f0f0f0] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{c.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABELS[c.status] || c.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-[#8a8a8a]">
                    <p>{c.phone} · {c.treatment_type}</p>
                    <p>{c.assignee ? `담당: ${c.assignee}` : ''} · {new Date(c.created_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5]">
                    <th className="text-left py-2 px-3 text-[#8a8a8a] font-medium">이름</th>
                    <th className="text-left py-2 px-3 text-[#8a8a8a] font-medium">전화번호</th>
                    <th className="text-left py-2 px-3 text-[#8a8a8a] font-medium">시술</th>
                    <th className="text-left py-2 px-3 text-[#8a8a8a] font-medium">담당자</th>
                    <th className="text-left py-2 px-3 text-[#8a8a8a] font-medium">상태</th>
                    <th className="text-left py-2 px-3 text-[#8a8a8a] font-medium">접수일</th>
                  </tr>
                </thead>
                <tbody>
                  {recentConsultations.map((c) => (
                    <tr key={c.id} className="border-b border-[#f0f0f0] last:border-0">
                      <td className="py-2.5 px-3 font-medium">{c.name}</td>
                      <td className="py-2.5 px-3">{c.phone}</td>
                      <td className="py-2.5 px-3">{c.treatment_type}</td>
                      <td className="py-2.5 px-3 text-[#8a8a8a]">{c.assignee || '-'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-500'}`}>
                          {STATUS_LABELS[c.status] || c.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#8a8a8a]">
                        {new Date(c.created_at).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#8a8a8a] py-4 text-center">아직 상담 신청이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
