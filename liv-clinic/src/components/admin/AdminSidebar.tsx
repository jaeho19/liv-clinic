'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: '대시보드', icon: '📊' },
  { href: '/admin/consultations', label: '상담관리', icon: '📋' },
  { href: '/admin/events', label: '이벤트관리', icon: '🎉' },
  { href: '/admin/popups', label: '팝업관리', icon: '🪟' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <aside className="w-60 bg-white border-r border-[#e5e5e5] min-h-screen flex flex-col">
      <div className="p-5 border-b border-[#e5e5e5]">
        <Link href="/admin/dashboard">
          <h1 className="text-lg font-bold text-[#6d4e42]">LIV 관리자</h1>
        </Link>
        <p className="text-xs text-[#8a8a8a] mt-0.5">홈페이지 관리 시스템</p>
      </div>

      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-[#b4988d]/10 text-[#6d4e42] font-medium'
                      : 'text-[#575756] hover:bg-[#f6f6f6]'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-[#e5e5e5]">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8a8a8a] hover:bg-[#f6f6f6] transition-colors mb-1"
        >
          <span className="text-base">🌐</span>
          사이트 보기
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8a8a8a] hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
        >
          <span className="text-base">🚪</span>
          로그아웃
        </button>
      </div>
    </aside>
  );
}
