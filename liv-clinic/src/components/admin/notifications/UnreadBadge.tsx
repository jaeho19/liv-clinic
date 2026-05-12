'use client';

import { useNotifications } from './NotificationProvider';

export function UnreadBadge() {
  const { totalUnread } = useNotifications();
  if (totalUnread === 0) return null;
  return (
    <span
      className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-semibold bg-red-500 text-white rounded-full"
      aria-label={`미응답 ${totalUnread}건`}
    >
      {totalUnread > 99 ? '99+' : totalUnread}
    </span>
  );
}
