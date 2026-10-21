// 원장님이 정하는 "어디까지 말할까" (스펙 2026-10-02 chat-ai-first-response §4.3).
// 2026-10-02 기준 값은 원장님 엑셀(LIV_AI응대_가격안내범위_작성용.xlsx) 회신 전의 임시 기준이다.
// 엑셀이 오면 이 파일과 facts.ts · priceRows.extra.ts 를 고친다.

/**
 * 금액을 말하지 않는 기본 가격 줄 — 금액이 출처마다 달라 원장님 확인이 필요한 줄(엑셀 시트 3의 주황 칸).
 * 이 줄은 AI에게 주지 않는다. 손님이 물으면 "가예약 확정 때 정확한 금액을 함께 알려 드린다"고 답하고 직원에게 넘긴다.
 * 원장님이 엑셀 시트 2에서 "금액은 직원이"로 정한 시술의 줄도 여기에 더한다.
 */
export const STAFF_ONLY_KEYS: ReadonlySet<string> = new Set([
  // 울쎄라피 프라임 하안면(300~400샷) 117만 원부터 — 첫방문 체험가 표에는 300샷 정가가 147만 원이다
  'ulthera.name.lowerFace',
  // 슈링크 페이지 가격표 안의 '울쎄라 레이저' 300·600샷 — 울쎄라피 프라임 표와 금액이 다르다
  'shurink.ultheraLaser.shot300',
  'shurink.ultheraLaser.shot600',
  // 압토스 NAMICA 300만 원부터 — 10월 포스터에는 정가 350만 원 → 300만 원
  'thread.name.aptosNamica',
  // 표기가 '사넬주사'다(샤넬주사인지 확인 필요)
  'filler.chanelInjection.volume3cc',
  // 힐로웨이브 2cc 50만 원부터 — 소개 페이지에는 53만 9천 원
  'skinbooster.hilowave.volume2cc',
  // 제모 페이지에 듀얼토닝 금액이 그대로 들어가 있다
  'hairRemoval.dualToning.single',
]);

/**
 * 부가세를 어떻게 적는가 (엑셀 규칙 1).
 *   both     = 별도 금액 + (부가세 포함 금액)
 *   excluded = 별도 금액만
 *   included = 포함 금액만
 */
export type VatDisplay = 'both' | 'excluded' | 'included';
export const VAT_DISPLAY: VatDisplay = 'both';

/** AI가 쓴 글에 나와도 되는 퍼센트 (검사 C-3) — 직접 예약 5% */
export const ALLOWED_PERCENTS: ReadonlySet<string> = new Set(['5']);
