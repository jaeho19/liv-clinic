/**
 * 가격 페이지의 "참고 환산" 한 줄(en·ja·zh·zh-TW).
 * 환율은 하루 한 번 받아 온다. 받지 못하면 null → 줄 자체를 그리지 않는다(값을 지어내지 않는다).
 * 결제는 원화이고 실제 금액은 결제일 환율에 따른다는 문장을 항상 함께 적는다.
 */
import type { GuideLocale } from '@/lib/guides/types';

export type FxCurrency = 'JPY' | 'TWD' | 'HKD' | 'USD' | 'CNY';

export interface FxReference {
  /** 환율 기준일 YYYY-MM-DD (UTC) */
  date: string;
  /** 1원당 각 통화 */
  rates: Record<FxCurrency, number>;
}

const FX_URL = 'https://open.er-api.com/v6/latest/KRW';
const CURRENCIES: FxCurrency[] = ['JPY', 'TWD', 'HKD', 'USD', 'CNY'];
/** 환산 기준 금액(원). 가격표가 수십만~수백만 원대라 100만 원으로 잡는다. */
export const FX_BASE_KRW = 1_000_000;

export function parseFxResponse(json: unknown): FxReference | null {
  if (!json || typeof json !== 'object') return null;
  const d = json as { result?: unknown; time_last_update_unix?: unknown; rates?: Record<string, unknown> };
  if (d.result !== 'success' || typeof d.time_last_update_unix !== 'number' || !d.rates) return null;
  const rates = {} as Record<FxCurrency, number>;
  for (const c of CURRENCIES) {
    const v = d.rates[c];
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) return null;
    rates[c] = v;
  }
  return { date: new Date(d.time_last_update_unix * 1000).toISOString().slice(0, 10), rates };
}

export async function getFxReference(): Promise<FxReference | null> {
  try {
    const res = await fetch(FX_URL, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return parseFxResponse(await res.json());
  } catch {
    return null;
  }
}

/** 유효 숫자 3자리로 반올림한다 — 참고값이므로 끝자리까지 보이지 않게 한다. */
export function roundReference(value: number): number {
  if (value <= 0) return 0;
  const magnitude = 10 ** (Math.floor(Math.log10(value)) - 2);
  return Math.round(value / magnitude) * magnitude;
}

const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });

export function buildFxLine(locale: GuideLocale, fx: FxReference): string {
  const amount = (c: FxCurrency) => fmt(roundReference(FX_BASE_KRW * fx.rates[c]));
  switch (locale) {
    case 'ja':
      return `参考換算：100万ウォン ≒ 約${amount('JPY')}円（${fx.date}時点の為替レート）。お支払いは韓国ウォン建てで、実際の金額は決済日のレートにより変わります。`;
    case 'zh-TW':
      return `參考換算：100萬韓元 ≒ 約新台幣${amount('TWD')}元／港幣${amount('HKD')}元（${fx.date}匯率）。以韓元付款，實際金額依付款當日匯率而定。`;
    case 'zh':
      return `参考换算：100万韩元 ≈ 约人民币${amount('CNY')}元（${fx.date}汇率）。以韩元付款，实际金额以付款当日汇率为准。`;
    default:
      return `For reference: KRW 1,000,000 ≈ USD ${amount('USD')} (exchange rate of ${fx.date}). You pay in Korean won; the amount on your statement depends on the rate on the day of payment.`;
  }
}
