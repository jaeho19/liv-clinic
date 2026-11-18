'use client';

import { useState } from 'react';
import { formatGiftCode, normalizeGiftCode } from '@/lib/survey/giftCode';

/**
 * 데스크용 「답례품 번호 확인」. 손님이 보여 준 번호를 넣으면 상태를 보여 주고, 쓸 수 있으면 「드림」 표시를 한다.
 * 번호는 응답과 연결돼 있지 않아 여기서는 손님의 답을 볼 수 없다.
 */

type GiftView =
  | { code: string; status: 'none' }
  | {
      code: string;
      status: 'unused' | 'used' | 'expired';
      issued_on: string;
      last_day: string;
      redeemed_at: string | null;
    };

const STATUS_TEXT: Record<GiftView['status'], { label: string; tone: string }> = {
  unused: { label: '드릴 수 있어요', tone: 'bg-[#e9f3ea] text-[#2f6b3a]' },
  used: { label: '이미 드렸어요', tone: 'bg-[#f1eeec] text-[#575756]' },
  expired: { label: '기간이 지났어요', tone: 'bg-[#fbeee9] text-[#9a4a2f]' },
  none: { label: '없는 번호예요', tone: 'bg-[#fbeee9] text-[#9a4a2f]' },
};

function seoulDateTimeText(iso: string): string {
  return new Date(Date.parse(iso) + 9 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' ');
}

export default function GiftCodeChecker({ onRedeemed }: { onRedeemed?: () => void }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<GiftView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const check = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    const code = normalizeGiftCode(input);
    if (!code) {
      setError('번호는 영문·숫자 6자리예요. (예: K7P-3QD)');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/survey/gift?code=${code}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? '번호를 확인하지 못했습니다.');
      setResult(data as GiftView);
    } catch (e) {
      setError(e instanceof Error ? e.message : '번호를 확인하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const redeem = async () => {
    if (!result) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/survey/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: result.code }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setResult(data as GiftView);
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? '「드림」 표시를 하지 못했습니다.');
      setResult(data as GiftView);
      onRedeemed?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : '「드림」 표시를 하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const status = result ? STATUS_TEXT[result.status] : null;

  return (
    <section className="rounded-xl border border-[#e5e5e5] bg-white p-4 lg:p-5">
      <h3 className="text-sm font-bold text-[#6d4e42]">답례품 번호 확인</h3>
      <p className="mt-1 text-xs text-[#8a8a8a]">
        손님이 보여 주는 번호를 넣고 확인하세요. 드릴 수 있으면 답례품을 드리고 「드림」을 누릅니다. 번호로는 손님의 답을 볼 수 없어요.
      </p>
      <form onSubmit={check} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="K7P-3QD"
          maxLength={9}
          autoCapitalize="characters"
          autoComplete="off"
          aria-label="답례품 번호"
          className="h-11 w-40 rounded-lg border border-[#e5e5e5] px-3 text-base font-semibold tracking-[0.12em] text-[#575756] outline-none focus:border-[#b4988d]"
        />
        <button
          type="submit"
          disabled={busy}
          className="h-11 cursor-pointer rounded-lg bg-[#b4988d] px-4 text-sm font-medium text-white hover:bg-[#a08474] disabled:opacity-60"
        >
          확인
        </button>
      </form>

      {error && <p className="mt-2 text-xs font-medium text-[#b4483c]">{error}</p>}

      {result && status && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-[#faf8f7] px-3 py-2.5">
          <span className="text-base font-bold tracking-[0.1em] text-[#6d4e42]">{formatGiftCode(result.code)}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.tone}`}>{status.label}</span>
          {result.status !== 'none' && (
            <span className="text-xs text-[#8a8a8a]">
              {result.issued_on} 발급 · {result.last_day}까지
              {result.redeemed_at && ` · ${seoulDateTimeText(result.redeemed_at)} 드림`}
            </span>
          )}
          {result.status === 'unused' && (
            <button
              type="button"
              onClick={redeem}
              disabled={busy}
              className="ms-auto h-9 cursor-pointer rounded-lg bg-[#6d4e42] px-4 text-sm font-medium text-white hover:bg-[#5a3f35] disabled:opacity-60"
            >
              드림
            </button>
          )}
        </div>
      )}
    </section>
  );
}
