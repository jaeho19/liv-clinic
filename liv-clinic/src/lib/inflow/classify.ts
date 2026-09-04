/**
 * 과거 유입 데이터 표준화 후보 생성 (규칙 기반).
 *
 * DB에 자동 반영하지 않는다 — 후보는 /admin/inflow "표준화 검토" 탭에서
 * 관리자가 확인한 것만 저장되고, 불확실하면 미분류(NULL)로 남긴다.
 * (2026-08 실측: 시술 154/202건, 채널 147/202건 후보 생성 가능)
 */
import type { ChannelCategory, PatientOrigin, TreatmentTag } from './taxonomy';

export type Confidence = 'high' | 'medium' | 'low';

export interface LegacyLeadFields {
  channel: string;
  agency: string | null;
  wechat_id: string | null;
  treatment: string | null;
  note: string | null;
}

export interface TreatmentSuggestion {
  tags: TreatmentTag[];
  confidence: Confidence;
}

export interface ChannelSuggestion {
  category: ChannelCategory;
  detail: string | null;
  confidence: Confidence;
  reason: string;
}

export interface OriginSuggestion {
  origin: PatientOrigin;
  confidence: Confidence;
  reason: string;
}

export interface LeadSuggestions {
  treatment: TreatmentSuggestion | null;
  channel: ChannelSuggestion | null;
  origin: OriginSuggestion | null;
}

// ─── 시술 태그 규칙 ─────────────────────────────────
// 순서 중요: 구체 시술 먼저, 일반 리프팅(lifting_etc)은 맨 끝(다른 태그가 있으면 흡수).
// 오타·약칭은 실데이터(inflow_leads 2026-06~08)에서 관측된 것만 넣는다.
const TREATMENT_RULES: [TreatmentTag, RegExp][] = [
  ['aptos', /압토스|아프토스|압토즈|aptos/i],
  ['thread_lift', /실\s*리프팅|미스코|장미실|민트실|실루엣|에피티콘|콘셀티나|네오닥터/i],
  ['ulthera', /울쎄라|울쎼라|울세라|울테라|율쎄라|ulthera/i],
  ['thermage', /써마지|서마지|thermage/i],
  ['hilowave', /힐로\s*우?\s*웨이브|hilo\s*wave/i],
  ['lipolysis', /지방\s*분해|윤곽주사|퇴근주사|지방주사/i],
  ['potenza', /포텐자|potenza/i],
  ['rejuran', /리쥬란|리주란|rejuran/i],
  ['juvelook', /쥬베룩|주베룩|juvelook/i],
  ['facelift', /안면\s*거상|거상술|(?:^|[^가-힣])거상/i],
  ['fat_reposition', /지방\s*재배치|눈\s*밑\s*지방|눈밑지방|눈물고랑|하안검/i],
  ['filler', /필러|filler/i],
  ['botox', /보톡스|톡신|botox/i],
  ['skinbooster', /스킨\s*부스터|부스터|물광/i],
  ['inmode', /인모드|inmode/i],
  ['onda', /온다/i],
  ['density', /덴서티|density/i],
  ['shurink', /슈링크|shurink/i],
  ['lifting_etc', /리프팅|탄력/i],
];

/**
 * 태그 제거 후 잔여 텍스트에서 무시해도 되는 상투어.
 * "고민/or/또는" 같은 미결정 표현은 일부러 남긴다 — residue가 남으면 medium이 되어
 * 검토 화면에서 사람 확인을 유도한다.
 */
const TREATMENT_FILLER = /[\s,.+\/·&()~\-0-9]|cc|샷|문의|상담|예약|희망|원함|및|프라임|레이저/gi;

export function suggestTreatmentTags(text: string | null | undefined): TreatmentSuggestion | null {
  if (!text || !text.trim()) return null;
  const tags: TreatmentTag[] = [];
  let leftover = text;
  for (const [tag, re] of TREATMENT_RULES) {
    if (!re.test(leftover)) continue;
    if (tag === 'lifting_etc' && tags.length > 0) {
      // 구체 시술이 이미 있으면 일반 리프팅 언급은 흡수하되 텍스트는 제거
      leftover = leftover.replace(new RegExp(re.source, 'gi'), ' ');
      continue;
    }
    tags.push(tag);
    leftover = leftover.replace(new RegExp(re.source, 'gi'), ' ');
  }
  if (tags.length === 0) return null;
  const residue = leftover.replace(TREATMENT_FILLER, '');
  return { tags, confidence: residue.length <= 1 ? 'high' : 'medium' };
}

// ─── 채널(유입 경로) 규칙 ────────────────────────────
const APP_KEYWORDS: [string, RegExp][] = [
  ['바비톡', /바비톡/],
  ['강남언니', /강남언니|강언/],
  ['캐시닥', /캐시닥/],
  ['여신티켓', /여신티켓|여티/],
  ['당근', /당근/],
];

export function suggestChannel(lead: LegacyLeadFields): ChannelSuggestion | null {
  const text = `${lead.treatment ?? ''} ${lead.note ?? ''}`;

  // 1) 노트·시술 텍스트의 앱 언급이 최우선 (가장 구체적인 단서)
  for (const [label, re] of APP_KEYWORDS) {
    if (re.test(text)) {
      return { category: 'app', detail: label, confidence: 'high', reason: `기록에 "${label}" 언급` };
    }
  }

  // 2) 대행사 기록 = 해외 대행사 경유
  if (lead.agency) {
    return {
      category: 'foreign_agency',
      detail: lead.agency,
      confidence: 'high',
      reason: `대행사(${lead.agency}) 기록`,
    };
  }

  // 3) 레거시 채널 직행 매핑
  //    카카오·전화·왓츠앱은 순수 연락 수단이라 "어디서 알고 왔나"의 단서가 아니므로
  //    여기서 매핑하지 않고 4)의 텍스트 단서로만 판단한다.
  switch (lead.channel) {
    case 'wechat':
      return { category: 'foreign_sns', detail: '위챗', confidence: 'high', reason: '위챗 문의' };
    case 'walk_in':
      return { category: 'walk_in', detail: null, confidence: 'high', reason: '워크인 기록' };
    case 'website':
      return { category: 'homepage', detail: null, confidence: 'high', reason: '홈페이지 폼 접수' };
    case 'livechat':
      return { category: 'homepage', detail: '라이브챗', confidence: 'medium', reason: '사이트 라이브챗 문의' };
    case 'naver':
      return {
        category: 'naver_search',
        detail: null,
        confidence: 'medium',
        reason: '네이버 유입(검색/플레이스 구분 불가)',
      };
  }

  // 4) 텍스트 단서 (카카오/전화/기타 채널)
  if (/인스타|insta/i.test(text)) return { category: 'instagram', detail: null, confidence: 'medium', reason: '기록에 인스타그램 언급' };
  if (/유튜브|youtube/i.test(text)) return { category: 'youtube', detail: null, confidence: 'medium', reason: '기록에 유튜브 언급' };
  if (/샤오홍슈|소홍서/.test(text)) return { category: 'foreign_sns', detail: '샤오홍슈', confidence: 'medium', reason: '기록에 샤오홍슈 언급' };
  if (/더우인|틱톡|tiktok/i.test(text)) return { category: 'foreign_sns', detail: '더우인', confidence: 'medium', reason: '기록에 더우인 언급' };
  if (/지인|소개/.test(text)) return { category: 'referral', detail: null, confidence: 'medium', reason: '기록에 지인·소개 언급' };
  if (/플레이스/.test(text)) return { category: 'naver_place', detail: null, confidence: 'low', reason: '기록에 플레이스 언급' };
  if (/네이버/.test(text)) return { category: 'naver_search', detail: null, confidence: 'low', reason: '기록에 네이버 언급' };
  if (/구글|google/i.test(text)) return { category: 'google_search', detail: null, confidence: 'low', reason: '기록에 구글 언급' };
  if (/카페|커뮤니티/.test(text)) return { category: 'community', detail: null, confidence: 'low', reason: '기록에 카페 언급' };

  // 단서 없음 → 후보 없이 미분류 유지 (사람이 판단)
  return null;
}

// ─── 국내/해외 규칙 ─────────────────────────────────
const DOMESTIC_CONTACT_CHANNELS = ['kakao', 'phone', 'naver', 'walk_in', 'website', 'livechat', 'etc'];

export function suggestOrigin(lead: LegacyLeadFields): OriginSuggestion | null {
  if (lead.wechat_id || lead.channel === 'wechat') {
    return { origin: 'foreign', confidence: 'high', reason: '위챗 채널/ID' };
  }
  if (lead.channel === 'whatsapp') {
    return { origin: 'foreign', confidence: 'high', reason: '왓츠앱 문의(국내 미사용 메신저)' };
  }
  if (lead.agency) {
    return { origin: 'foreign', confidence: 'high', reason: `해외 대행사(${lead.agency}) 경유` };
  }
  if (DOMESTIC_CONTACT_CHANNELS.includes(lead.channel)) {
    return { origin: 'domestic', confidence: 'medium', reason: '국내 접촉 수단(확인 필요)' };
  }
  return null;
}

export function suggestForLead(lead: LegacyLeadFields): LeadSuggestions {
  return {
    treatment: suggestTreatmentTags(lead.treatment),
    channel: suggestChannel(lead),
    origin: suggestOrigin(lead),
  };
}
