'use client';

import { getExpiryStatus, formatExpiryDate, getRemainingText, EXPIRY_STYLES } from '@/lib/expiry-utils';

interface ExpiryBadgeProps {
  expiryDate: string | null | undefined;
  showRemaining?: boolean;
  size?: 'sm' | 'md';
}

export default function ExpiryBadge({ expiryDate, showRemaining = true, size = 'sm' }: ExpiryBadgeProps) {
  if (!expiryDate) return null;

  const status = getExpiryStatus(expiryDate);
  const style = EXPIRY_STYLES[status];
  const dateStr = formatExpiryDate(expiryDate);
  const remaining = getRemainingText(expiryDate);

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${style.bg} ${style.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
        {dateStr}
        {showRemaining && remaining && (
          <span className="opacity-70">({remaining})</span>
        )}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold ${style.bg} ${style.text}`}>
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      <span>{dateStr}</span>
      {showRemaining && remaining && (
        <span className="opacity-70">{remaining}</span>
      )}
      <span className={`px-1.5 py-0.5 rounded text-[10px] ${status === 'expired' ? 'bg-red-200 text-red-800' : ''}`}>
        {style.label}
      </span>
    </div>
  );
}
