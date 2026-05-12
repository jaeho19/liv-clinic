'use client';

import Link from 'next/link';
import { useNotifications } from './NotificationProvider';

export function ToastStack() {
  const { toasts, dismissToast } = useNotifications();
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-[90vw] sm:max-w-sm pointer-events-none"
      role="region"
      aria-label="새 채팅 알림"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <Link
          key={t.id}
          href={`/admin/chat/${t.sessionId}`}
          onClick={() => dismissToast(t.id)}
          className="pointer-events-auto group block bg-white border border-[#b4988d]/30 shadow-lg rounded-lg p-3 hover:bg-[#f6f6f6] transition-colors animate-in slide-in-from-right"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-[#b4988d] mb-1 uppercase tracking-wider">
                💬 새 채팅 문의
              </div>
              <div className="text-sm font-medium text-[#6d4e42] truncate">
                {t.visitorLabel}
              </div>
              <div className="text-xs text-[#575756] line-clamp-2 mt-0.5">
                {t.preview}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dismissToast(t.id);
              }}
              className="text-[#8a8a8a] hover:text-[#575756] p-1 -m-1 flex-shrink-0"
              aria-label="알림 닫기"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </Link>
      ))}
    </div>
  );
}
