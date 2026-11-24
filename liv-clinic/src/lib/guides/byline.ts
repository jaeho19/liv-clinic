/**
 * 글에 적는 이름 줄(저자·날짜). 클라이언트 안전(생성물을 import하지 않는다).
 *
 * 한국어 칼럼은 김수영 대표원장 이름으로 나간다(2026-11-24 결정): "글 김수영 대표원장" 한 가지만 적고
 * 수정일·읽는 시간은 화면에 적지 않는다. 원장이 검수하지 않은 칼럼은 공개할 수 없으므로
 * (markdown.ts publishBlockers) 공개된 칼럼에는 언제나 원장 이름이 맞다.
 * 날짜는 화면에서만 뺀다 — 검색·AI가 읽는 구조화 데이터(schema.ts)에는 그대로 둔다.
 *
 * 외국인 가이드는 그대로다: 수정일 · 읽는 시간 · 병원 이름(원장이 검수한 편은 "검수 원장").
 */
import { COLUMN_LOCALE, type GuideDoc } from './types';
import { GUIDE_UI } from './ui';

type Signed = Pick<GuideDoc, 'locale' | 'reviewer'>;
type Dated = Signed & Pick<GuideDoc, 'updated' | 'readingMinutes'>;

/** 원장이 저자로 나가는 글인가: 한국어 칼럼은 전부, 외국인 가이드는 원장이 검수한 편만. */
export function isDoctorAuthored(guide: Signed): boolean {
  return guide.locale === COLUMN_LOCALE || guide.reviewer === 'dr-kim';
}

function doctorLine(guide: Signed): string {
  const ui = GUIDE_UI[guide.locale];
  return `${ui.author} ${ui.doctorAuthor}`;
}

/** 글 제목 아래 한 줄 */
export function guideMetaLine(guide: Dated): string {
  if (guide.locale === COLUMN_LOCALE) return doctorLine(guide);
  const ui = GUIDE_UI[guide.locale];
  const byline = guide.reviewer === 'dr-kim' ? `${ui.reviewedBy} ${ui.doctorAuthor}` : `${ui.author} ${ui.clinicAuthor}`;
  return `${ui.updated} ${guide.updated} · ${ui.readingTime(guide.readingMinutes)} · ${byline}`;
}

/** 목록 카드 아래 한 줄 */
export function guideCardMeta(guide: Dated): string {
  if (guide.locale === COLUMN_LOCALE) return doctorLine(guide);
  const ui = GUIDE_UI[guide.locale];
  return `${ui.updated} ${guide.updated} · ${ui.readingTime(guide.readingMinutes)}`;
}
