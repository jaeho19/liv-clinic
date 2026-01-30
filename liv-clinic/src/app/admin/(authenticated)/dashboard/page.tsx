import { createServerClient } from '@/lib/supabase-server';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createServerClient();

  // Fetch stats
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { count: todayCount },
    { count: pendingCount },
    { count: monthCount },
    { data: recentConsultations },
    { count: activeEventsCount },
    { count: activePopupsCount },
  ] = await Promise.all([
    supabase.from('consultation_requests').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
    supabase.from('consultation_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('consultation_requests').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('consultation_requests').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_published', true).gte('end_date', now.toISOString().split('T')[0]),
    supabase.from('popups').select('*', { count: 'exact', head: true }).eq('is_active', true).lte('display_start', now.toISOString()).gte('display_end', now.toISOString()),
  ]);

  const stats = [
    { label: '오늘 신규 상담', value: todayCount ?? 0, href: '/admin/consultations', color: 'bg-blue-50 text-blue-700' },
    { label: '미처리 상담', value: pendingCount ?? 0, href: '/admin/consultations?status=pending', color: 'bg-amber-50 text-amber-700' },
    { label: '이번달 상담', value: monthCount ?? 0, href: '/admin/consultations', color: 'bg-green-50 text-green-700' },
    { label: '진행중 이벤트', value: activeEventsCount ?? 0, href: '/admin/events', color: 'bg-purple-50 text-purple-700' },
    { label: '활성 팝업', value: activePopupsCount ?? 0, href: '/admin/popups', color: 'bg-pink-50 text-pink-700' },
  ];

  const STATUS_LABELS: Record<string, string> = {
    pending: '대기중',
    contacted: '연락완료',
    completed: '완료',
    cancelled: '취소',
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    contacted: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[#6d4e42] mb-6">대시보드</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
                  <th className="text-left py-2 px-3 text-[#8a8a8a] font-medium">문의내용</th>
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
                    <td className="py-2.5 px-3 max-w-[200px]">
                      {c.message ? (
                        <span className="text-xs text-[#575756] truncate block" title={c.message}>
                          {c.message.length > 30 ? c.message.slice(0, 30) + '...' : c.message}
                        </span>
                      ) : (
                        <span className="text-xs text-[#c0c0c0]">-</span>
                      )}
                    </td>
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
