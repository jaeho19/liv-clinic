'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import GiftCodeChecker from '@/components/admin/survey/GiftCodeChecker';
import SurveyDashboard from '@/components/admin/survey/SurveyDashboard';
import { summarizeSurvey, type SurveyResponseLike } from '@/lib/survey/summary';
import { buildSurveyCsv } from '@/lib/survey/csv';
import { seoulDate } from '@/lib/survey/giftCode';
import { PERIOD_LABELS, periodRange, type PeriodKey } from '@/lib/survey/periods';
import { SURVEY_PUBLIC_PATH, SURVEY_SHARE_PATH } from '@/lib/survey/questions';
import { copyText } from '@/lib/copyText';

/**
 * /admin/survey — 내원객 만족도 설문 결과와 답례품 번호 확인.
 * 응답은 /api/admin/survey 에서 받아 화면에서 계산한다(lib/survey/summary.ts).
 */

interface ApiResult {
  from: string;
  to: string;
  responses: SurveyResponseLike[];
  truncated: boolean;
  gifts: { issued: number; redeemed: number };
}

const PERIOD_KEYS = Object.keys(PERIOD_LABELS) as PeriodKey[];

export default function SurveyAdminPage() {
  const today = seoulDate();
  const [period, setPeriod] = useState<PeriodKey>('this_month');
  const [custom, setCustom] = useState(() => periodRange('this_month', today));
  const [data, setData] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const range = useMemo(
    () => (period === 'custom' ? custom : periodRange(period, today)),
    [period, custom, today],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/survey?from=${range.from}&to=${range.to}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? '응답을 불러오지 못했습니다.');
      setData(json as ApiResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : '응답을 불러오지 못했습니다.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => (data ? summarizeSurvey(data.responses) : null), [data]);

  // 카톡으로 보내는 주소 — 카카오 미리보기 캐시를 피하려고 ?from=kakao 를 붙인다(questions.ts SURVEY_SHARE_PATH)
  const surveyUrl = typeof window === 'undefined' ? SURVEY_SHARE_PATH : `${window.location.origin}${SURVEY_SHARE_PATH}`;
  const kakaoLine = `오늘 리브성형외과를 찾아 주셔서 감사합니다. 2분짜리 만족도 설문에 답해 주시면 작은 답례품을 드립니다. (이름은 받지 않습니다) ${surveyUrl}`;

  const copy = async (label: string, text: string) => {
    const ok = await copyText(text);
    setCopied(ok ? label : null);
    if (ok) window.setTimeout(() => setCopied(null), 1800);
  };

  const download = () => {
    if (!data) return;
    const blob = new Blob([buildSurveyCsv(data.responses)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `만족도설문_${data.from}_${data.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#6d4e42] lg:text-xl">만족도 설문</h2>
          <p className="mt-1 text-xs text-[#8a8a8a]">시술 후 주의사항 카톡에 함께 보내는 설문의 결과예요. 이름·연락처는 받지 않습니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => copy('url', surveyUrl)}
            className="min-h-[40px] cursor-pointer rounded-lg border border-[#e5e5e5] bg-white px-3 text-sm text-[#575756] hover:bg-[#f6f6f6]"
          >
            {copied === 'url' ? '복사했어요' : '설문 주소 복사'}
          </button>
          <button
            type="button"
            onClick={() => copy('kakao', kakaoLine)}
            className="min-h-[40px] cursor-pointer rounded-lg border border-[#e5e5e5] bg-white px-3 text-sm text-[#575756] hover:bg-[#f6f6f6]"
          >
            {copied === 'kakao' ? '복사했어요' : '카톡 문구 복사'}
          </button>
          <a
            href={SURVEY_PUBLIC_PATH}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-[40px] items-center rounded-lg border border-[#e5e5e5] bg-white px-3 text-sm text-[#575756] hover:bg-[#f6f6f6]"
          >
            설문 화면 보기
          </a>
        </div>
      </div>

      <GiftCodeChecker onRedeemed={load} />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e5e5e5] bg-white p-3">
        <div className="flex flex-wrap gap-1">
          {PERIOD_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              aria-pressed={period === key}
              className={`min-h-[36px] cursor-pointer rounded-lg px-3 text-sm transition-colors ${
                period === key ? 'bg-[#b4988d] font-medium text-white' : 'text-[#575756] hover:bg-[#f6f6f6]'
              }`}
            >
              {PERIOD_LABELS[key]}
            </button>
          ))}
        </div>
        {period === 'custom' ? (
          <div className="flex items-center gap-1.5 text-sm text-[#575756]">
            <input
              type="date"
              value={custom.from}
              max={custom.to}
              onChange={(e) => e.target.value && setCustom((c) => ({ ...c, from: e.target.value }))}
              className="h-9 rounded-lg border border-[#e5e5e5] px-2"
              aria-label="시작일"
            />
            ~
            <input
              type="date"
              value={custom.to}
              min={custom.from}
              max={today}
              onChange={(e) => e.target.value && setCustom((c) => ({ ...c, to: e.target.value }))}
              className="h-9 rounded-lg border border-[#e5e5e5] px-2"
              aria-label="끝날"
            />
          </div>
        ) : (
          <span className="text-xs text-[#8a8a8a] tabular-nums">
            {range.from} ~ {range.to}
          </span>
        )}
        <button
          type="button"
          onClick={download}
          disabled={!data || data.responses.length === 0}
          className="ms-auto min-h-[36px] cursor-pointer rounded-lg border border-[#e5e5e5] px-3 text-sm text-[#575756] hover:bg-[#f6f6f6] disabled:cursor-default disabled:opacity-50"
        >
          엑셀 내려받기
        </button>
      </div>

      {loading && <p className="py-10 text-center text-sm text-[#8a8a8a]">불러오는 중…</p>}
      {!loading && error && (
        <p className="rounded-xl border border-[#f1d9d3] bg-[#fdf6f4] px-4 py-6 text-center text-sm text-[#9a4a2f]">{error}</p>
      )}
      {!loading && !error && data && summary && (
        <>
          {data.truncated && (
            <p className="text-xs text-[#9a4a2f]">응답이 너무 많아 최근 5,000건만 계산했어요. 기간을 줄여 주세요.</p>
          )}
          <SurveyDashboard summary={summary} gifts={data.gifts} />
        </>
      )}
    </div>
  );
}
