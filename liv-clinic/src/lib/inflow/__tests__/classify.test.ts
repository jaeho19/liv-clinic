import { describe, expect, test } from 'vitest';
import { suggestTreatmentTags, suggestChannel, suggestOrigin, suggestForLead } from '../classify';
import type { LegacyLeadFields } from '../classify';

function lead(partial: Partial<LegacyLeadFields>): LegacyLeadFields {
  return {
    channel: 'etc',
    agency: null,
    wechat_id: null,
    treatment: null,
    note: null,
    ...partial,
  };
}

describe('suggestTreatmentTags — 자유 텍스트 → 표준 태그 후보', () => {
  test('단일 시술명은 high 신뢰도로 매핑된다', () => {
    const s = suggestTreatmentTags('압토스 문의');
    expect(s?.tags).toEqual(['aptos']);
    expect(s?.confidence).toBe('high');
  });

  test('쉼표 복합 표기는 태그 여러 개를 만든다', () => {
    const s = suggestTreatmentTags('스킨부스터,보톡스');
    expect(s?.tags).toContain('skinbooster');
    expect(s?.tags).toContain('botox');
  });

  test('오타 변형(울쎼라·율쎄라)도 울쎄라로 인식한다', () => {
    expect(suggestTreatmentTags('울쎼라')?.tags).toEqual(['ulthera']);
    expect(suggestTreatmentTags('율쎄라')?.tags).toEqual(['ulthera']);
  });

  test('기기 미지정 "리프팅"은 lifting_etc 하나만 태깅된다', () => {
    expect(suggestTreatmentTags('리프팅')?.tags).toEqual(['lifting_etc']);
  });

  test('구체 시술이 있으면 일반 리프팅 태그는 흡수된다', () => {
    const s = suggestTreatmentTags('리프팅상담(압토스)');
    expect(s?.tags).toContain('aptos');
    expect(s?.tags).not.toContain('lifting_etc');
  });

  test('인모드·물광주사 같은 관측된 표기도 매핑된다', () => {
    expect(suggestTreatmentTags('인모드')?.tags).toEqual(['inmode']);
    expect(suggestTreatmentTags('물광주사')?.tags).toEqual(['skinbooster']);
  });

  test('시술을 특정할 수 없는 텍스트는 후보를 만들지 않는다(미분류 유지)', () => {
    expect(suggestTreatmentTags('원장님 연령대문의')).toBeNull();
    expect(suggestTreatmentTags('확인중')).toBeNull();
  });

  test('빈 값은 null', () => {
    expect(suggestTreatmentTags(null)).toBeNull();
    expect(suggestTreatmentTags('')).toBeNull();
  });

  test('알 수 없는 텍스트가 섞이면 medium으로 낮아진다', () => {
    const s = suggestTreatmentTags('압토스or리쥬란,포텐자 중고민(상담원해요)');
    expect(s?.tags).toEqual(expect.arrayContaining(['aptos', 'rejuran', 'potenza']));
    expect(s?.confidence).toBe('medium');
  });
});

describe('suggestChannel — 레거시 채널/대행사/노트 → 유입 경로 후보', () => {
  test('대행사가 있으면 해외 대행사(high, 세부=대행사명)', () => {
    const s = suggestChannel(lead({ channel: 'wechat', agency: '바이올렛' }));
    expect(s).toMatchObject({ category: 'foreign_agency', detail: '바이올렛', confidence: 'high' });
  });

  test('대행사 없는 위챗은 해외 SNS/위챗(high)', () => {
    const s = suggestChannel(lead({ channel: 'wechat' }));
    expect(s).toMatchObject({ category: 'foreign_sns', detail: '위챗', confidence: 'high' });
  });

  test('노트/시술 텍스트의 앱 키워드가 최우선이다', () => {
    const s = suggestChannel(lead({ channel: 'etc', note: '바비톡 신청 / 부재' }));
    expect(s).toMatchObject({ category: 'app', detail: '바비톡', confidence: 'high' });
  });

  test('워크인·홈페이지는 그대로 직행(high)', () => {
    expect(suggestChannel(lead({ channel: 'walk_in' }))?.category).toBe('walk_in');
    expect(suggestChannel(lead({ channel: 'website' }))?.category).toBe('homepage');
  });

  test('네이버는 검색/플레이스 구분이 안 되므로 medium', () => {
    const s = suggestChannel(lead({ channel: 'naver' }));
    expect(s?.category).toBe('naver_search');
    expect(s?.confidence).toBe('medium');
  });

  test('단서 없는 카카오/전화는 후보를 만들지 않는다(사람이 판단)', () => {
    expect(suggestChannel(lead({ channel: 'kakao' }))).toBeNull();
    expect(suggestChannel(lead({ channel: 'phone' }))).toBeNull();
  });

  test('노트의 지인·소개 키워드는 referral(medium)', () => {
    const s = suggestChannel(lead({ channel: 'phone', note: '지인 소개로 연락' }));
    expect(s).toMatchObject({ category: 'referral', confidence: 'medium' });
  });
});

describe('suggestOrigin — 국내/해외 후보', () => {
  test('위챗 채널·위챗ID·대행사는 해외(high)', () => {
    expect(suggestOrigin(lead({ channel: 'wechat' }))).toMatchObject({ origin: 'foreign', confidence: 'high' });
    expect(suggestOrigin(lead({ channel: 'kakao', agency: '라미타' }))).toMatchObject({ origin: 'foreign', confidence: 'high' });
    expect(suggestOrigin(lead({ channel: 'etc', wechat_id: 'abc' }))).toMatchObject({ origin: 'foreign', confidence: 'high' });
  });

  test('국내 접촉 수단은 국내(medium — 반드시 사람 확인)', () => {
    expect(suggestOrigin(lead({ channel: 'kakao' }))).toMatchObject({ origin: 'domestic', confidence: 'medium' });
    expect(suggestOrigin(lead({ channel: 'phone' }))).toMatchObject({ origin: 'domestic', confidence: 'medium' });
  });
});

describe('suggestForLead — 통합 후보', () => {
  test('세 축의 후보를 한 번에 돌려준다', () => {
    const s = suggestForLead(
      lead({ channel: 'wechat', agency: '바이올렛', treatment: '울쎄라,보톡스' })
    );
    expect(s.channel?.category).toBe('foreign_agency');
    expect(s.origin?.origin).toBe('foreign');
    expect(s.treatment?.tags).toEqual(expect.arrayContaining(['ulthera', 'botox']));
  });
});
