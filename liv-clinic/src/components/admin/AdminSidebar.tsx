'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { UnreadBadge } from './notifications/UnreadBadge';
import { SoundToggle } from './notifications/SoundToggle';

type BadgeKind = 'chat-unread';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: BadgeKind;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: '재고관리',
    items: [
      { href: '/admin/inventory', label: '물품 사용 기록', icon: '📋' },
      { href: '/admin/inventory/overview', label: '재고 현황', icon: '📊' },
    ],
  },
  {
    title: '홈페이지 관리',
    items: [
      { href: '/admin/events', label: '이벤트관리', icon: '🎉' },
      { href: '/admin/before-after', label: '전후사진관리', icon: '📷' },
      { href: '/admin/reviews', label: '시술 후기', icon: '⭐' },
      { href: '/admin/popups', label: '팝업관리', icon: '🪟' },
      { href: '/admin/chat', label: '채팅 상담', icon: '💬', badge: 'chat-unread' },
      { href: '/admin/inflow', label: '유입 통계', icon: '📈' },
      { href: '/admin/marketing', label: '마케팅 콘텐츠', icon: '📣' },
      { href: '/admin/analytics', label: 'Analytics', icon: '🌐' },
    ],
  },
  {
    title: '시스템',
    items: [
      { href: '/admin/settings', label: '설정', icon: '⚙️' },
    ],
  },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose?.();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 w-64 bg-white border-r border-[#e5e5e5] h-full flex flex-col
          transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0 lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#e5e5e5] flex items-center justify-between">
          <Link href="/admin/inventory" onClick={onClose}>
            <h1 className="text-lg font-bold text-[#6d4e42]">LIV 관리자</h1>
            <p className="text-xs text-[#8a8a8a] mt-0.5">재고 & 홈페이지 관리</p>
          </Link>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer text-[#8a8a8a]"
            aria-label="메뉴 닫기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          {NAV_SECTIONS.map((section, idx) => (
            <div key={section.title}>
              {idx > 0 && <div className="border-t border-[#e5e5e5] my-2" />}
              <p className="px-3 py-1.5 text-[10px] font-semibold text-[#b4988d] uppercase tracking-wider">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/admin/inventory');
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
                        <span className="flex-1">{item.label}</span>
                        {item.badge === 'chat-unread' && <UnreadBadge />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[#e5e5e5]">
          <SoundToggle />
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8a8a8a] hover:bg-[#f6f6f6] transition-colors mb-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            사이트 보기
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8a8a8a] hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            로그아웃
          </button>
        </div>
      </aside>
    </>
  );
}
