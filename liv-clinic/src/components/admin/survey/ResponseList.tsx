'use client';

import { useState } from 'react';
import {
  QUESTION_ADMIN_LABELS,
  SURVEY_PARTS,
  TREATMENT_ADMIN_LABELS,
  isPartShown,
  type TreatmentId,
} from '@/lib/survey/questions';
import { SURVEY_COPY } from '@/lib/survey/copy';
import { readRatings, type SurveyResponseLike } from '@/lib/survey/summary';
import { seoulDateTime } from '@/lib/survey/csv';

/**
 * 「응답 하나씩 보기」 — 응답을 최신순으로 나열하고, 누르면 그 응답의 답을 파트별로 모두 펼친다(사용자 요청 2026-11-18).
 * 엑셀 내려받기와 같은 내용을 화면에서 본다. 익명이라 누가 썼는지는 나오지 않는다.
 */

const PAGE_SIZE = 20;
const SCALE_WORDS = SURVEY_COPY.ko.scale;
const OVERALL_WORDS = SURVEY_COPY.ko.recommend.scale;
const LANGUAGE_NAMES: Record<string, string> = {
  ko: '한국어',
  en: '영어',
  ja: '일본어',
  zh: '중국어(간체)',
  'zh-TW': '중국어(번체)',
};

function treatmentText(response: SurveyResponseLike): string {
  return response.treatments
    .map((t) =>
      t === 'other' && response.treatment_other
        ? `기타(${response.treatment_other})`
        : (TREATMENT_ADMIN_LABELS[t as TreatmentId] ?? t),
    )
    .join(', ');
}

function scoreText(score: number, words: readonly string[]): string {
  const word = words.at(score - 1);
  return word ? `${score}점 · ${word}` : `${score}점`;
}

export default function ResponseList({ responses }: { responses: SurveyResponseLike[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const rows = responses.slice(0, visible);

  return (
    <section className="rounded-xl border border-[#e5e5e5] bg-white p-4 lg:p-5">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-bold text-[#6d4e42]">응답 하나씩 보기 {responses.length}건</h3>
        <p className="text-xs text-[#8a8a8a]">최신순 · 누르면 그 응답의 답이 모두 펼쳐져요 · 익명이라 누가 썼는지는 알 수 없어요</p>
      </div>

      <ul className="divide-y divide-[#f3f3f3]">
        {rows.map((response, index) => {
          const key = response.id ?? `${response.created_at}-${index}`;
          const open = openKey === key;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => setOpenKey(open ? null : key)}
                aria-expanded={open}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-[#faf8f7]"
              >
                <span className="w-[112px] shrink-0 text-xs tabular-nums text-[#8a8a8a]">
                  {seoulDateTime(response.created_at)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-[#575756]">{treatmentText(response)}</span>
                <span className="hidden shrink-0 text-xs text-[#8a8a8a] sm:inline">
                  {response.first_visit ? '첫 방문' : '다시 방문'}
                </span>
                {response.comment && (
                  <span className="hidden shrink-0 rounded-full border border-[#e5e5e5] px-2 py-px text-[11px] text-[#8a8a8a] sm:inline">
                    의견 있음
                  </span>
                )}
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                    response.recommend <= 2 ? 'bg-[#fbeee9] text-[#9a4a2f]' : 'bg-[#faf6f3] text-[#6d4e42]'
                  }`}
                >
                  종합 {response.recommend}점
                </span>
                <svg
                  aria-hidden
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8a8a8a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {open && <ResponseDetail response={response} />}
            </li>
          );
        })}
      </ul>

      {responses.length > visible && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="mt-3 w-full cursor-pointer rounded-lg border border-[#e5e5e5] py-2.5 text-sm text-[#575756] hover:bg-[#f6f6f6]"
        >
          더 보기 ({responses.length - visible}건 남음)
        </button>
      )}
    </section>
  );
}

function ResponseDetail({ response }: { response: SurveyResponseLike }) {
  const ratings = readRatings(response.ratings);
  const treatments = response.treatments as TreatmentId[];

  return (
    <div className="mb-3 space-y-3 rounded-lg bg-[#faf8f7] px-4 py-3">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr_auto_1fr]">
        <dt className="text-[#8a8a8a]">제출</dt>
        <dd className="tabular-nums text-[#575756]">{seoulDateTime(response.created_at)}</dd>
        <dt className="text-[#8a8a8a]">언어</dt>
        <dd className="text-[#575756]">{LANGUAGE_NAMES[response.locale] ?? response.locale}</dd>
        <dt className="text-[#8a8a8a]">방문</dt>
        <dd className="text-[#575756]">{response.first_visit ? '첫 방문' : '다시 방문'}</dd>
        <dt className="text-[#8a8a8a]">받은 시술</dt>
        <dd className="text-[#575756]">{treatmentText(response)}</dd>
      </dl>

      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-[#e5e5e5] text-left text-xs text-[#8a8a8a]">
              <th className="py-1.5 pe-3 font-medium">파트</th>
              <th className="py-1.5 pe-3 font-medium">문항</th>
              <th className="py-1.5 font-medium">답</th>
            </tr>
          </thead>
          <tbody>
            {SURVEY_PARTS.map((part) => {
              const status = !isPartShown(part, treatments)
                ? '해당 없음 (상담만 받음)'
                : response.skipped_parts.includes(part.id)
                  ? '오늘 만나지 않음'
                  : null;
              if (status) {
                return (
                  <tr key={part.id} className="border-b border-[#efebe9]">
                    <td className="py-1.5 pe-3 text-[#575756]">{part.adminLabel}</td>
                    <td colSpan={2} className="py-1.5 text-[#8a8a8a]">
                      {status}
                    </td>
                  </tr>
                );
              }
              return part.questions.map((questionId, i) => {
                const score = ratings[questionId];
                return (
                  <tr key={questionId} className="border-b border-[#efebe9]">
                    <td className="py-1.5 pe-3 text-[#575756]">{i === 0 ? part.adminLabel : ''}</td>
                    <td className="py-1.5 pe-3 text-[#575756]">{QUESTION_ADMIN_LABELS[questionId]}</td>
                    <td
                      className={`py-1.5 tabular-nums ${
                        score === undefined
                          ? 'text-[#b3aaa6]'
                          : score <= 2
                            ? 'font-semibold text-[#9a4a2f]'
                            : 'text-[#6d4e42]'
                      }`}
                    >
                      {score === undefined ? '답 안 함' : scoreText(score, SCALE_WORDS)}
                    </td>
                  </tr>
                );
              });
            })}
            <tr>
              <td className="py-1.5 pe-3 font-semibold text-[#6d4e42]">종합 평가</td>
              <td className="py-1.5 pe-3 text-[#575756]">가족·지인에게 추천</td>
              <td
                className={`py-1.5 font-semibold tabular-nums ${
                  response.recommend <= 2 ? 'text-[#9a4a2f]' : 'text-[#6d4e42]'
                }`}
              >
                {scoreText(response.recommend, OVERALL_WORDS)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <p className="text-xs text-[#8a8a8a]">자유 의견</p>
        <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-[#575756]">
          {response.comment?.trim() ? response.comment : '적지 않음'}
        </p>
      </div>
    </div>
  );
}
