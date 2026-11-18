import {
  QUESTION_ADMIN_LABELS,
  SURVEY_PARTS,
  TREATMENT_ADMIN_LABELS,
  type TreatmentId,
} from './questions';
import { readRatings, type SurveyResponseLike } from './summary';

/**
 * 관리자 「엑셀 내려받기」 — 엑셀이 한글을 깨뜨리지 않도록 BOM 을 붙인 CSV.
 * 자유 의견은 손님이 쓴 글이라 =·+·-·@ 로 시작하면 앞에 ' 를 붙여 수식으로 실행되지 않게 한다.
 */

const PART_LABEL: Record<string, string> = Object.fromEntries(
  SURVEY_PARTS.map((part) => [part.id, part.adminLabel]),
);

function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** created_at(UTC) → 서울 'YYYY-MM-DD HH:mm' */
export function seoulDateTime(createdAt: string): string {
  return new Date(Date.parse(createdAt) + 9 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' ');
}

export function buildSurveyCsv(rows: SurveyResponseLike[]): string {
  const questionColumns = SURVEY_PARTS.flatMap((part) =>
    part.questions.map((id) => ({ id, header: `${part.adminLabel}: ${QUESTION_ADMIN_LABELS[id]}` })),
  );

  const header = [
    '제출 시각',
    '언어',
    '첫 방문',
    '받은 시술',
    '기타 시술',
    ...questionColumns.map((c) => c.header),
    '넘긴 파트',
    '종합 평가(추천, 1~5)',
    '자유 의견',
  ];

  const lines = rows.map((row) => {
    const ratings = readRatings(row.ratings);
    return [
      seoulDateTime(row.created_at),
      row.locale,
      row.first_visit ? '처음' : '다시 방문',
      row.treatments.map((t) => TREATMENT_ADMIN_LABELS[t as TreatmentId] ?? t).join(', '),
      row.treatment_other,
      ...questionColumns.map((c) => ratings[c.id] ?? null),
      row.skipped_parts.map((p) => PART_LABEL[p] ?? p).join(', '),
      row.recommend,
      row.comment,
    ]
      .map(cell)
      .join(',');
  });

  return `﻿${[header.map(cell).join(','), ...lines].join('\r\n')}\r\n`;
}
