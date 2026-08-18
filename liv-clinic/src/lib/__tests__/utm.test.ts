import { describe, expect, test } from 'vitest';
import { parseUtmFromSearch, captureUtm, readStoredUtm, pickUtmFields, storedUtmBody, UTM_STORAGE_KEY } from '../utm';

function memStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    _dump: () => Object.fromEntries(map),
  };
}

describe('parseUtmFromSearch', () => {
  test('utm 파라미터를 추출한다', () => {
    expect(parseUtmFromSearch('?utm_source=instagram&utm_campaign=aug_promo')).toEqual({
      source: 'instagram',
      campaign: 'aug_promo',
    });
  });

  test('utm이 하나도 없으면 null', () => {
    expect(parseUtmFromSearch('?foo=1')).toBeNull();
    expect(parseUtmFromSearch('')).toBeNull();
  });

  test('값은 100자로 자르고 제어문자를 제거한다', () => {
    const long = 'a'.repeat(200);
    const parsed = parseUtmFromSearch(`?utm_source=${long}&utm_content=ab%0Acd`);
    expect(parsed?.source).toHaveLength(100);
    expect(parsed?.content).toBe('abcd');
  });
});

describe('captureUtm — 세션 첫 터치', () => {
  test('첫 방문 UTM을 저장한다', () => {
    const s = memStorage();
    captureUtm('?utm_source=youtube&utm_medium=video', s);
    expect(readStoredUtm(s)).toEqual({ source: 'youtube', medium: 'video' });
  });

  test('이미 저장된 값은 덮어쓰지 않는다(첫 터치 유지)', () => {
    const s = memStorage({ [UTM_STORAGE_KEY]: JSON.stringify({ source: 'first' }) });
    captureUtm('?utm_source=second', s);
    expect(readStoredUtm(s)?.source).toBe('first');
  });

  test('utm이 없으면 아무것도 저장하지 않는다', () => {
    const s = memStorage();
    captureUtm('?page=2', s);
    expect(s.getItem(UTM_STORAGE_KEY)).toBeNull();
  });

  test('스토리지가 던져도 크래시하지 않는다(시크릿 모드 등)', () => {
    const throwing = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    };
    expect(() => captureUtm('?utm_source=x', throwing)).not.toThrow();
    expect(readStoredUtm(throwing)).toBeNull();
  });
});

describe('pickUtmFields — API 요청 본문에서 UTM 컬럼 값 추출', () => {
  test('camelCase 키를 DB 컬럼 형태로 매핑한다', () => {
    expect(pickUtmFields({ utmSource: 'instagram', utmCampaign: 'aug' })).toEqual({
      utm_source: 'instagram',
      utm_medium: null,
      utm_campaign: 'aug',
      utm_content: null,
    });
  });

  test('문자열이 아니거나 비어 있으면 null', () => {
    expect(pickUtmFields({ utmSource: 123, utmMedium: '', utmContent: '  ' })).toEqual({
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
    });
  });

  test('본문이 객체가 아니어도 안전하다', () => {
    expect(pickUtmFields(null).utm_source).toBeNull();
    expect(pickUtmFields('x').utm_source).toBeNull();
  });

  test('값은 100자 절단 + 제어문자 제거', () => {
    const out = pickUtmFields({ utmSource: 'a'.repeat(300) });
    expect(out.utm_source).toHaveLength(100);
  });
});

describe('storedUtmBody — 폼 제출 본문용 camelCase 변환', () => {
  test('저장된 UTM을 API 본문 필드로 바꾼다', () => {
    const s = memStorage({ [UTM_STORAGE_KEY]: JSON.stringify({ source: 'youtube', content: 'v01' }) });
    expect(storedUtmBody(s)).toEqual({ utmSource: 'youtube', utmContent: 'v01' });
  });

  test('저장된 UTM이 없으면 빈 객체', () => {
    expect(storedUtmBody(memStorage())).toEqual({});
  });

  test('스토리지 인자가 없고 window도 없으면(SSR) 빈 객체', () => {
    expect(storedUtmBody()).toEqual({});
  });
});

describe('readStoredUtm', () => {
  test('깨진 JSON은 null', () => {
    const s = memStorage({ [UTM_STORAGE_KEY]: '{broken' });
    expect(readStoredUtm(s)).toBeNull();
  });

  test('객체가 아닌 값은 null', () => {
    const s = memStorage({ [UTM_STORAGE_KEY]: '"just a string"' });
    expect(readStoredUtm(s)).toBeNull();
  });
});
