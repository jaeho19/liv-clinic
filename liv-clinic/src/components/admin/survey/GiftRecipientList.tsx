'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { seoulDate } from '@/lib/survey/giftCode';
import {
  RECIPIENT_NAME_MAX,
  matchRecipient,
  oldestHeldGivenOn,
  parseRecipient,
  type GiftRecipientRow,
} from '@/lib/survey/giftRecipients';
import { GIFT_RECIPIENT_HOLD_DAYS } from '@/lib/survey/questions';

/**
 * 「답례품 받은 분 (최근 90일)」 — 카톡으로 설문 링크를 보내기 전에 찾아본다.
 * 명단에 있는 분께는 「다시 보낼 수 있는 날」 전까지 보내지 않는다. 90일이 지나면 API 가 명단에서 지운다.
 * 「드림」 때 저장되고(GiftCodeChecker), 여기서는 찾기·직접 추가·잘못 적은 줄 지우기만 한다.
 */

type Row = GiftRecipientRow & { send_again_on: string };

const PREVIEW_ROWS = 5;
const FIELD =
  'h-10 rounded-lg border border-[#e5e5e5] bg-white px-3 text-sm text-[#575756] outline-none focus:border-[#b4988d]';

export default function GiftRecipientList({ refreshKey = 0 }: { refreshKey?: number }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const today = seoulDate();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [givenOn, setGivenOn] = useState(today);
  const [addError, setAddError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/survey/recipients');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? '명단을 불러오지 못했습니다.');
      setRows(json.recipients as Row[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '명단을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const matches = useMemo(() => (rows ?? []).filter((row) => matchRecipient(row, query)), [rows, query]);
  const searching = query.trim().length > 0;
  const visible = searching || showAll ? matches : matches.slice(0, PREVIEW_ROWS);

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    setAddError(null);
    const recipient = parseRecipient({ name, phone_last4: phone });
    if (!recipient.ok) {
      setAddError(recipient.error);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/survey/recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...recipient.value, given_on: givenOn }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? '명단에 넣지 못했습니다.');
      setAdding(false);
      setName('');
      setPhone('');
      setGivenOn(today);
      await load();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : '명단에 넣지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/survey/recipients?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? '지우지 못했습니다.');
      setConfirmingId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '지우지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-[#e5e5e5] bg-white p-4 lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold text-[#6d4e42]">
          답례품 받은 분 <span className="font-medium text-[#8a8a8a]">(최근 {GIFT_RECIPIENT_HOLD_DAYS}일)</span>
        </h3>
        <button
          type="button"
          onClick={() => {
            setAdding((v) => !v);
            setAddError(null);
          }}
          className="shrink-0 cursor-pointer text-xs font-medium text-[#8a6e62] underline-offset-2 hover:underline"
        >
          {adding ? '닫기' : '직접 추가'}
        </button>
      </div>
      <p className="mt-1 text-xs text-[#8a8a8a]">
        설문 링크를 보내기 전에 찾아보세요. 명단에 있는 분께는 「다시 보낼 수 있는 날」 전까지 보내지 않습니다. {GIFT_RECIPIENT_HOLD_DAYS}일이 지나면 명단에서 저절로 빠져요.
      </p>

      {adding && (
        <form onSubmit={add} className="mt-3 rounded-lg bg-[#faf8f7] px-3 py-2.5">
          <p className="text-xs text-[#8a8a8a]">「드림」 때 적지 못했거나 잘못 적어 다시 넣을 때 씁니다.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              maxLength={RECIPIENT_NAME_MAX}
              autoComplete="off"
              aria-label="받은 분 이름"
              className={`${FIELD} w-32`}
            />
            <input
              value={phone}
              // 전체 번호를 넣어도 마지막 4자리만 남는다(서버로는 4자리만 간다)
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(-4))}
              placeholder="휴대폰 뒤 4자리"
              inputMode="numeric"
              autoComplete="off"
              aria-label="휴대폰 뒤 4자리"
              className={`${FIELD} w-36 tracking-[0.08em]`}
            />
            <label className="flex items-center gap-1.5 text-xs text-[#8a8a8a]">
              받은 날
              <input
                type="date"
                value={givenOn}
                min={oldestHeldGivenOn(today)}
                max={today}
                onChange={(e) => setGivenOn(e.target.value)}
                className={FIELD}
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="h-10 cursor-pointer rounded-lg bg-[#6d4e42] px-4 text-sm font-medium text-white hover:bg-[#5a3f35] disabled:opacity-60"
            >
              추가
            </button>
          </div>
          {addError && <p className="mt-1.5 text-xs font-medium text-[#b4483c]">{addError}</p>}
        </form>
      )}

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="이름 또는 휴대폰 뒤 4자리로 찾기"
        aria-label="답례품 받은 분 찾기"
        className={`${FIELD} mt-3 w-full`}
      />

      {searching && rows && (
        <p
          role="status"
          className={`mt-2 rounded-lg px-3 py-2 text-xs font-semibold ${
            matches.length > 0 ? 'bg-[#fbeee9] text-[#9a4a2f]' : 'bg-[#e9f3ea] text-[#2f6b3a]'
          }`}
        >
          {matches.length > 0
            ? `${GIFT_RECIPIENT_HOLD_DAYS}일 안에 답례품을 받은 분이에요 — 아래 날짜 전까지 설문 링크를 보내지 마세요.`
            : '명단에 없어요 — 설문 링크를 보내도 됩니다.'}
        </p>
      )}

      {loading && !rows && <p className="mt-3 text-xs text-[#8a8a8a]">불러오는 중…</p>}
      {error && <p className="mt-2 text-xs font-medium text-[#b4483c]">{error}</p>}
      {rows && rows.length === 0 && !searching && (
        <p className="mt-3 text-xs text-[#8a8a8a]">아직 답례품을 받은 분이 없어요.</p>
      )}

      {visible.length > 0 && (
        <ul className="mt-2 divide-y divide-[#f0ecea]">
          {visible.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
              <span className="text-sm font-semibold text-[#575756]">{row.name}</span>
              <span className="text-xs tracking-[0.06em] text-[#8a8a8a]">뒤 {row.phone_last4}</span>
              <span className="text-xs text-[#8a8a8a]">
                {row.given_on} 받음 · <span className="font-medium text-[#6d4e42]">{row.send_again_on}</span>부터 다시 보낼 수 있어요
              </span>
              {confirmingId === row.id ? (
                <span className="ms-auto flex items-center gap-2 text-xs">
                  <span className="text-[#b4483c]">지울까요?</span>
                  <button
                    type="button"
                    onClick={() => remove(row.id)}
                    disabled={busy}
                    className="cursor-pointer rounded-md bg-[#b4483c] px-2.5 py-1 font-medium text-white disabled:opacity-60"
                  >
                    지우기
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="cursor-pointer rounded-md border border-[#e5e5e5] px-2.5 py-1 text-[#575756]"
                  >
                    취소
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingId(row.id)}
                  className="ms-auto cursor-pointer text-xs text-[#a0a0a0] hover:text-[#b4483c]"
                >
                  지우기
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!searching && matches.length > PREVIEW_ROWS && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-1 cursor-pointer text-xs font-medium text-[#8a6e62] underline-offset-2 hover:underline"
        >
          {showAll ? '줄여 보기' : `전체 보기 (${matches.length}명)`}
        </button>
      )}
    </section>
  );
}
