'use client';

import {
  QUESTION_ADMIN_LABELS,
  SURVEY_PARTS,
  TREATMENT_ADMIN_LABELS,
  type PartId,
  type TreatmentId,
} from '@/lib/survey/questions';
import type { SurveySummary } from '@/lib/survey/summary';
import { seoulDateTime } from '@/lib/survey/csv';

/**
 * 「만족도 설문」 결과 — summarizeSurvey() 결과를 그대로 그린다(계산 없음).
 * 막대는 한 가지 색(브랜드 주색), 숫자는 글자색. 파트·문항은 점수가 낮은 순서로 보여 준다.
 */

const PART_LABEL = Object.fromEntries(SURVEY_PARTS.map((p) => [p.id, p.adminLabel])) as Record<PartId, string>;
const SMALL_SAMPLE = 30;

function score(value: number | null): string {
  return value === null ? '–' : value.toFixed(1);
}

function percent(value: number | null): string {
  return value === null ? '–' : `${Math.round(value * 100)}%`;
}

function signed(value: number | null): string {
  if (value === null) return '–';
  return value > 0 ? `+${value}` : String(value);
}

function Card({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#e5e5e5] bg-white p-4 lg:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-bold text-[#6d4e42]">{title}</h3>
        {note && <p className="text-xs text-[#8a8a8a]">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Tile({ label, value, unit, sub }: { label: string; value: string; unit?: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white px-4 py-3.5">
      <p className="text-xs text-[#8a8a8a]">{label}</p>
      <p className="mt-1 text-[28px] font-bold leading-none text-[#6d4e42] tabular-nums">
        {value}
        {unit && <span className="ms-1 text-sm font-medium text-[#8a8a8a]">{unit}</span>}
      </p>
      {sub && <p className="mt-2 text-xs text-[#8a8a8a]">{sub}</p>}
    </div>
  );
}

export default function SurveyDashboard({
  summary,
  gifts,
}: {
  summary: SurveySummary;
  gifts: { issued: number; redeemed: number };
}) {
  const parts = [...summary.parts].sort((a, b) => (a.avg ?? 99) - (b.avg ?? 99));
  const questions = [...summary.questions].sort((a, b) => (a.avg ?? 99) - (b.avg ?? 99));

  if (summary.count === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#e5e5e5] bg-white px-4 py-12 text-center text-sm text-[#8a8a8a]">
        이 기간에는 응답이 없어요.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {summary.count < SMALL_SAMPLE && (
        <p className="rounded-lg bg-[#faf6f3] px-3 py-2 text-xs text-[#6d4e42]">
          응답이 {summary.count}건이라 숫자가 크게 흔들릴 수 있어요. 30건쯤 모일 때까지는 참고만 해 주세요.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          label="응답 수"
          value={String(summary.count)}
          unit="건"
          sub={`답례품 ${gifts.redeemed}건 드림 · 번호 ${gifts.issued}건 발급`}
        />
        <Tile
          label="추천 지수"
          value={signed(summary.nps)}
          sub={`9~10점 ${summary.promoters}명 · 7~8점 ${summary.passives}명 · 0~6점 ${summary.detractors}명`}
        />
        <Tile label="추천 점수 평균" value={score(summary.recommendAvg)} unit="/ 10점" />
        <Tile label="첫 방문 손님" value={percent(summary.firstVisitShare)} sub="나머지는 다시 방문" />
      </div>
      <p className="text-xs text-[#8a8a8a]">
        추천 지수 = 9~10점을 준 분의 비율 − 0~6점을 준 분의 비율. -100에서 100 사이이고, 0보다 크면 추천하는 분이 더 많다는 뜻이에요.
      </p>

      <Card title="파트별 점수" note="5점 만점 · 그 파트 문항 2개의 평균 · 낮은 순">
        <ul className="space-y-2.5">
          {parts.map((part) => (
            <li key={part.id} className="grid grid-cols-[88px_1fr_auto] items-center gap-3 sm:grid-cols-[120px_1fr_auto]">
              <span className="text-sm text-[#575756]">{PART_LABEL[part.id]}</span>
              <div
                className="h-3 rounded-[4px] bg-[#f3efed]"
                title={part.avg === null ? '응답 없음' : `${PART_LABEL[part.id]} ${score(part.avg)}점 (응답 ${part.n}건)`}
              >
                {part.avg !== null && (
                  <div
                    className="h-full rounded-[4px] bg-[#b4988d]"
                    style={{ width: `${(part.avg / 5) * 100}%` }}
                  />
                )}
              </div>
              <span className="w-[150px] whitespace-nowrap text-end text-xs text-[#8a8a8a] tabular-nums sm:w-[190px]">
                <b className="me-1.5 text-sm font-bold text-[#6d4e42]">{score(part.avg)}</b>
                응답 {part.n}
                {part.skipped > 0 && ` · 만나지 않음 ${part.skipped}`}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="문항별 점수" note="낮게 준 비율 = 1~2점(아니다 이하)을 준 분의 비율">
        <div className="-mx-4 overflow-x-auto px-4 lg:-mx-5 lg:px-5">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-[#e5e5e5] text-left text-xs text-[#8a8a8a]">
                <th className="py-2 pe-3 font-medium">파트</th>
                <th className="py-2 pe-3 font-medium">문항</th>
                <th className="py-2 pe-3 text-end font-medium">평균</th>
                <th className="py-2 pe-3 text-end font-medium">낮게 준 비율</th>
                <th className="py-2 text-end font-medium">응답</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id} className="border-b border-[#f3f3f3] last:border-0">
                  <td className="py-2 pe-3 text-[#8a8a8a]">{PART_LABEL[q.part]}</td>
                  <td className="py-2 pe-3 text-[#575756]">{QUESTION_ADMIN_LABELS[q.id]}</td>
                  <td className="py-2 pe-3 text-end font-semibold text-[#6d4e42] tabular-nums">{score(q.avg)}</td>
                  <td className="py-2 pe-3 text-end tabular-nums text-[#575756]">{percent(q.lowShare)}</td>
                  <td className="py-2 text-end tabular-nums text-[#8a8a8a]">{q.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="달별 변화" note="파트 점수는 5점 만점">
        <div className="-mx-4 overflow-x-auto px-4 lg:-mx-5 lg:px-5">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[#e5e5e5] text-xs text-[#8a8a8a]">
                <th className="py-2 pe-3 text-left font-medium">달</th>
                <th className="py-2 pe-3 text-end font-medium">응답</th>
                <th className="py-2 pe-3 text-end font-medium">추천 지수</th>
                {SURVEY_PARTS.map((p) => (
                  <th key={p.id} className="py-2 pe-3 text-end font-medium last:pe-0">
                    {p.adminLabel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...summary.months].reverse().map((m) => (
                <tr key={m.month} className="border-b border-[#f3f3f3] last:border-0 tabular-nums">
                  <td className="py-2 pe-3 text-[#575756]">{m.month.replace('-', '년 ')}월</td>
                  <td className="py-2 pe-3 text-end text-[#575756]">{m.count}</td>
                  <td className="py-2 pe-3 text-end font-semibold text-[#6d4e42]">{signed(m.nps)}</td>
                  {SURVEY_PARTS.map((p) => (
                    <td key={p.id} className="py-2 pe-3 text-end text-[#575756] last:pe-0">
                      {score(m.parts[p.id])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card title="받은 시술별" note="한 분이 여러 시술을 고를 수 있어요">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e5e5] text-xs text-[#8a8a8a]">
                <th className="py-2 pe-3 text-left font-medium">시술</th>
                <th className="py-2 pe-3 text-end font-medium">응답</th>
                <th className="py-2 text-end font-medium">추천 지수</th>
              </tr>
            </thead>
            <tbody>
              {summary.treatments.map((t) => (
                <tr key={t.id} className="border-b border-[#f3f3f3] last:border-0 tabular-nums">
                  <td className="py-2 pe-3 text-[#575756]">{TREATMENT_ADMIN_LABELS[t.id]}</td>
                  <td className="py-2 pe-3 text-end text-[#575756]">{t.count}</td>
                  <td className="py-2 text-end font-semibold text-[#6d4e42]">{signed(t.nps)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title={`자유 의견 ${summary.comments.length}건`} note="최신순 · 직원 회의와 교육에만 써 주세요">
          {summary.comments.length === 0 ? (
            <p className="text-sm text-[#8a8a8a]">이 기간에 적어 주신 의견이 없어요.</p>
          ) : (
            <ul className="max-h-[520px] space-y-2.5 overflow-y-auto pe-1">
              {summary.comments.map((c, i) => (
                <li key={`${c.created_at}-${i}`} className="rounded-lg bg-[#faf8f7] px-3.5 py-3">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#8a8a8a]">
                    <span className="tabular-nums">{seoulDateTime(c.created_at)}</span>
                    <span className="rounded-full bg-white px-2 py-px font-semibold text-[#6d4e42]">추천 {c.recommend}점</span>
                    <span>{c.first_visit ? '첫 방문' : '다시 방문'}</span>
                    <span>
                      ·{' '}
                      {c.treatments
                        .map((t) => (t === 'other' && c.treatment_other ? c.treatment_other : TREATMENT_ADMIN_LABELS[t as TreatmentId] ?? t))
                        .join(', ')}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[#575756]">{c.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
