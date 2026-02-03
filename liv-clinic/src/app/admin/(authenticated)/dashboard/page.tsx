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

  const [
    { count: todayCount },
    { count: callbackCount },
    { count: monthCount },
    { count: activeEventsCount },
    { count: activePopupsCount },
    { data: recentConsultations },
    { count: notificationTodayCount },
  ] = await Promise.all([
    supabase.from('consultation_requests').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
    supabase.from('consultation_requests').select('*', { count: 'exact', head: true })
      .in('status', ['callback_scheduled', 'no_answer', 're_contact'])
      .gte('next_followup_at', `${todayStr}T00:00:00`)
      .lte('next_followup_at', `${todayStr}T23:59:59`),
    supabase.from('consultation_requests').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_published', true).gte('end_date', now.toISOString().split('T')[0]),
    supabase.from('popups').select('*', { count: 'exact', head: true }).eq('is_active', true).lte('display_start', now.toISOString()).gte('display_end', now.toISOString()),
    supabase.from('consultation_requests').select('*').order('created_at', { ascending: false }).limit(5),
    admin.from('patient_treatments').select('*', { count: 'exact', head: true })
      .eq('notification_sent', false)
      .not('next_notification_at', 'is', null)
      .lte('next_notification_at', `${todayStr}T23:59:59`),
  ]);

  const stats = [
    { label: '오늘 신규 상담', value: todayCount ?? 0, href: '/admin/consultations', color: 'bg-blue-50 text-blue-700' },
    { label: '오늘 콜백 예정', value: callbackCount ?? 0, href: '/admin/consultations', color: 'bg-amber-50 text-amber-700' },
    { label: '이번달 상담', value: monthCount ?? 0, href: '/admin/consultations', color: 'bg-green-50 text-green-700' },
    { label: '오늘 알림 발송', value: notificationTodayCount ?? 0, href: '/admin/notifications', color: 'bg-orange-50 text-orange-700' },
    { label: '진행중 이벤트', value: activeEventsCount ?? 0, href: '/admin/events', color: 'bg-purple-50 text-purple-700' },
    { label: '활성 팝업', value: activePopupsCount ?? 0, href: '/admin/popups', color: 'bg-pink-50 text-pink-700' },
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
      <h2 className="text-xl font-bold text-[#6d4e42] mb-6">대시보드</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl p-5 border border-[#e5e5e5] hover:shadow-md transition-shadow"
          >
            <p className="text-sm text-[#8a8a8a] mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color} inline-block px-2 py-0.5 rounded-lg`}>
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Notification Alert Banner */}
      {(notificationTodayCount ?? 0) > 0 && (
        <Link href="/admin/notifications" className="block bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 hover:bg-amber-100 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-2xl">&#128276;</span>
            <div>
              <p className="text-sm font-medium text-amber-800">오늘 발송해야 할 알림이 {notificationTodayCount}건 있습니다</p>
              <p className="text-xs text-amber-600 mt-0.5">알림관리에서 확인하고 발송 처리해 주세요.</p>
            </div>
          </div>
        </Link>
      )}

      {/* Today Callbacks Widget */}
      <div className="mb-8">
        <TodayCallbacks />
      </div>

      {/* Recent Consultations */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#6d4e42]">최근 상담 신청</h3>
          <Link href="/admin/consultations" className="text-sm text-[#b4988d] hover:underline">
            전체보기
          </Link>
        </div>

        {recentConsultations && recentConsultations.length > 0 ? (
          <div className="overflow-x-auto">
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
        ) : (
          <p className="text-sm text-[#8a8a8a] py-4 text-center">아직 상담 신청이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
