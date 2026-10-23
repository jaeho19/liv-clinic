import type { VisitorLocale } from '@/lib/chat/chatApi';

// AI 응대의 가격 줄 (스펙 2026-10-02 chat-ai-first-response §4.3).
// AI는 금액을 직접 쓰지 못한다 — 꼬리표({{P031}})만 쓰고, 이름과 금액은 프로그램이 이 줄에서 넣는다.

/** starting = "부터" 금액, fixed = 정해진 금액(프로모션·상담비) */
export type PriceUnit = 'starting' | 'fixed';

/** base = 기본 가격표, promo = 이달 프로모션, fee = 그 밖의 금액, trial = 첫방문 1회 체험가(제안형 응대가 켜졌을 때만) */
export type PriceGroup = 'base' | 'promo' | 'fee' | 'trial';

export interface PriceRowSource {
  /** 자료 안에서 겹치지 않는 이름 — 예: 'ulthera.name.upperFace', 'promo.2026-10.19' */
  key: string;
  group: PriceGroup;
  /** AI에게 보여 주는 한국어 이름 */
  labelKo: string;
  /** 부가세 별도 금액(원) */
  amount: number;
  unit: PriceUnit;
  /** 유효 기간(한국 날짜 YYYY-MM-DD, 양 끝 포함). 없으면 늘 유효하다 */
  validFrom?: string;
  validUntil?: string;
  /**
   * 프로모션 줄만: 이 묶음에 든 시술의 기본 가격 줄 key 앞부분(예: 'thermage.name.shot' — 300 · 600 · 900샷, 아이팁은 아님).
   * AI가 그 기본 가격 줄을 보여 주면 이 줄을 프로그램이 함께 붙인다(2026-10-23). 덤으로 든 것('… 포함'),
   * '또는'으로 고르는 시술, '추가 선택' 줄은 적지 않는다.
   */
  includes?: readonly string[];
  /** 손님에게 보이는 이름 — 10개 언어 */
  labels: Record<VisitorLocale, string>;
}

export interface PriceRow extends PriceRowSource {
  /** 꼬리표. AI가 {{P031}} 꼴로 쓴다. 자료를 읽을 때마다 순서대로 붙인다(저장하지 않는다) */
  id: string;
}
