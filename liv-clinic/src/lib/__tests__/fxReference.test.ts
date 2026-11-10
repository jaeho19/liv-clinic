import { describe, expect, it } from 'vitest';
import { buildFxLine, parseFxResponse, roundReference } from '../fxReference';

const OK = {
  result: 'success',
  time_last_update_unix: Date.UTC(2026, 10, 10, 0, 2, 31) / 1000,
  rates: { JPY: 0.117358, TWD: 0.024397, HKD: 0.005825, USD: 0.000744, CNY: 0.004913, EUR: 0.0007 },
};

describe('parseFxResponse', () => {
  it('reads the date and the five currencies', () => {
    const fx = parseFxResponse(OK);
    expect(fx?.date).toBe('2026-11-10');
    expect(fx?.rates.JPY).toBe(0.117358);
    expect(Object.keys(fx?.rates ?? {})).toHaveLength(5);
  });

  it('returns null when the response is not usable', () => {
    expect(parseFxResponse(null)).toBeNull();
    expect(parseFxResponse({ ...OK, result: 'error' })).toBeNull();
    expect(parseFxResponse({ ...OK, rates: { ...OK.rates, HKD: 0 } })).toBeNull();
    expect(parseFxResponse({ ...OK, rates: { JPY: 0.1 } })).toBeNull();
  });
});

describe('roundReference', () => {
  it('keeps three significant digits', () => {
    expect(roundReference(117358)).toBe(117000);
    expect(roundReference(24397)).toBe(24400);
    expect(roundReference(5825)).toBe(5830);
    expect(roundReference(744)).toBe(744);
  });
});

describe('buildFxLine', () => {
  const fx = parseFxResponse(OK)!;

  it('uses yen for Japanese', () => {
    const line = buildFxLine('ja', fx);
    expect(line).toContain('約117,000円');
    expect(line).toContain('2026-11-10');
    expect(line).toContain('決済日のレート');
  });

  it('shows both Taiwan and Hong Kong dollars for Traditional Chinese', () => {
    const line = buildFxLine('zh-TW', fx);
    expect(line).toContain('新台幣24,400元');
    expect(line).toContain('港幣5,830元');
  });

  it('uses yuan for Simplified Chinese and US dollars for English', () => {
    expect(buildFxLine('zh', fx)).toContain('人民币4,910元');
    expect(buildFxLine('en', fx)).toContain('USD 744');
  });
});
