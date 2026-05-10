'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from './AdminSidebar';
import { useOperatorHeartbeat } from '@/hooks/useOperatorHeartbeat';

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': '대시보드',
  '/admin/consultations': '상담관리',
  '/admin/operations': '운영현황',
  '/admin/inventory': '재고관리',
  '/admin/notifications': '알림관리',
  '/admin/reports': '리포트',
  '/admin/revenue': '매출관리',
  '/admin/patients': '환자조회',
  '/admin/events': '이벤트관리',
  '/admin/before-after': '전후사진관리',
  '/admin/popups': '팝업관리',
  '/admin/settings': '설정',
};

function getPageTitle(pathname: string): string {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(path)) return title;
  }
  return '관리자';
}

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  // 운영자 presence heartbeat (60s) — visitor 위젯의 정확한 온라인 표시용
  useOperatorHeartbeat();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-[#e5e5e5] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer text-[#575756]"
              aria-label="메뉴 열기"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div>
              <h1 className="text-sm font-bold text-[#6d4e42] leading-tight">LIV 관리자</h1>
              <p className="text-xs text-[#8a8a8a]">{pageTitle}</p>
            </div>
          </div>

          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8a8a8a] border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            사이트 보기
          </Link>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
