/**
 * 마케팅 유입 표준화 택소노미 SSOT.
 *
 * 관리자 UI(선택지·라벨·색), 분류 제안 엔진(classify.ts), 통계 집계(stats.ts)가
 * 모두 이 파일을 참조한다. DB에는 영문 키를 저장하고 한글 라벨은 표시 시점에만 쓴다.
 *
 * 기존 `inflow_leads.channel`(wechat/kakao/…)은 "문의 수단" 의미로 그대로 두고
 * (라벨·색상은 src/types/admin.ts), 여기의 ChannelCategory는 "어디서 알고 왔나"
 * (유입 경로)를 표준화한다 — 두 축은 서로 다른 질문이므로 병행 유지한다.
 */

// ─── 국내/해외 ───────────────────────────────────────
export type PatientOrigin = 'domestic' | 'foreign';

export const PATIENT_ORIGINS: PatientOrigin[] = ['domestic', 'foreign'];

export const PATIENT_ORIGIN_LABELS: Record<PatientOrigin, string> = {
  domestic: '국내',
  foreign: '해외',
};

/** 도넛/막대용. dataviz 검증 통과 페어(#c2703d/#0284c7) — 라벨 병기 필수, 색 단독 식별 금지 */
export const PATIENT_ORIGIN_HEX: Record<PatientOrigin, string> = {
  domestic: '#c2703d',
  foreign: '#0284c7',
};

export function getPatientOriginLabel(v: string | null | undefined): string {
  return PATIENT_ORIGIN_LABELS[v as PatientOrigin] ?? '미분류';
}

// ─── 유입 채널 대분류 ────────────────────────────────
export type ChannelCategory =
  | 'app'
  | 'naver_search'
  | 'google_search'
  | 'naver_place'
  | 'kakao_map'
  | 'instagram'
  | 'youtube'
  | 'community'
  | 'foreign_sns'
  | 'foreign_agency'
  | 'referral'
  | 'walk_in'
  | 'homepage'
  | 'etc';

export const CHANNEL_CATEGORIES: ChannelCategory[] = [
  'app',
  'naver_search',
  'google_search',
  'naver_place',
  'kakao_map',
  'instagram',
  'youtube',
  'community',
  'foreign_sns',
  'foreign_agency',
  'referral',
  'walk_in',
  'homepage',
  'etc',
];

export const CHANNEL_CATEGORY_LABELS: Record<ChannelCategory, string> = {
  app: '앱',
  naver_search: '네이버 검색',
  google_search: '구글 검색',
  naver_place: '네이버 플레이스',
  kakao_map: '카카오맵',
  instagram: '인스타그램',
  youtube: '유튜브',
  community: '카페·커뮤니티',
  foreign_sns: '해외 SNS',
  foreign_agency: '해외 대행사',
  referral: '지인 소개',
  walk_in: '워크인',
  homepage: '홈페이지',
  etc: '기타',
};

/** 배지·막대 보조색 — 식별은 항상 라벨이 우선(색 단독 식별 금지) */
export const CHANNEL_CATEGORY_COLORS: Record<ChannelCategory, string> = {
  app: 'bg-pink-500',
  naver_search: 'bg-emerald-600',
  google_search: 'bg-blue-500',
  naver_place: 'bg-teal-500',
  kakao_map: 'bg-yellow-500',
  instagram: 'bg-fuchsia-500',
  youtube: 'bg-red-500',
  community: 'bg-orange-500',
  foreign_sns: 'bg-green-600',
  foreign_agency: 'bg-rose-500',
  referral: 'bg-indigo-500',
  walk_in: 'bg-purple-500',
  homepage: 'bg-[#a08474]',
  etc: 'bg-gray-400',
};

export function getChannelCategoryLabel(v: string | null | undefined): string {
  return CHANNEL_CATEGORY_LABELS[v as ChannelCategory] ?? (v ? v : '미분류');
}

/** 대분류별 세부 채널 프리셋 (datalist 제안용 — 자유 입력 허용) */
export const APP_CHANNEL_PRESETS = ['강남언니', '바비톡', '캐시닥', '여신티켓', '당근'] as const;
export const FOREIGN_SNS_PRESETS = ['위챗', '샤오홍슈', '더우인', '왓츠앱', '라인'] as const;

export const CHANNEL_DETAIL_PRESETS: Partial<Record<ChannelCategory, readonly string[]>> = {
  app: APP_CHANNEL_PRESETS,
  foreign_sns: FOREIGN_SNS_PRESETS,
};

// ─── 시술 태그 ──────────────────────────────────────
export type TreatmentTag =
  | 'aptos'
  | 'thread_lift'
  | 'ulthera'
  | 'thermage'
  | 'hilowave'
  | 'lipolysis'
  | 'potenza'
  | 'rejuran'
  | 'juvelook'
  | 'facelift'
  | 'fat_reposition'
  | 'filler'
  | 'botox'
  | 'skinbooster'
  | 'inmode'
  | 'onda'
  | 'density'
  | 'shurink'
  | 'lifting_etc'
  | 'etc';

export const TREATMENT_TAGS: TreatmentTag[] = [
  'aptos',
  'thread_lift',
  'ulthera',
  'thermage',
  'hilowave',
  'lipolysis',
  'potenza',
  'rejuran',
  'juvelook',
  'facelift',
  'fat_reposition',
  'filler',
  'botox',
  'skinbooster',
  'inmode',
  'onda',
  'density',
  'shurink',
  'lifting_etc',
  'etc',
];

export const TREATMENT_TAG_LABELS: Record<TreatmentTag, string> = {
  aptos: '압토스',
  thread_lift: '실리프팅',
  ulthera: '울쎄라',
  thermage: '써마지',
  hilowave: '힐로우웨이브',
  lipolysis: '지방분해주사',
  potenza: '포텐자',
  rejuran: '리쥬란',
  juvelook: '쥬베룩',
  facelift: '안면거상',
  fat_reposition: '지방재배치',
  filler: '필러',
  botox: '보톡스',
  skinbooster: '스킨부스터',
  inmode: '인모드',
  onda: '온다',
  density: '덴서티',
  shurink: '슈링크',
  lifting_etc: '리프팅(기타)',
  etc: '기타',
};

export function getTreatmentTagLabel(v: string): string {
  return TREATMENT_TAG_LABELS[v as TreatmentTag] ?? v;
}

// ─── 콘텐츠 게시기록 ─────────────────────────────────
export type ContentPlatform =
  | 'instagram'
  | 'youtube_shorts'
  | 'youtube'
  | 'naver_blog'
  | 'naver_cafe'
  | 'xiaohongshu'
  | 'douyin'
  | 'etc';

export const CONTENT_PLATFORMS: ContentPlatform[] = [
  'instagram',
  'youtube_shorts',
  'youtube',
  'naver_blog',
  'naver_cafe',
  'xiaohongshu',
  'douyin',
  'etc',
];

export const CONTENT_PLATFORM_LABELS: Record<ContentPlatform, string> = {
  instagram: '인스타그램',
  youtube_shorts: '유튜브 쇼츠',
  youtube: '유튜브',
  naver_blog: '네이버 블로그',
  naver_cafe: '네이버 카페',
  xiaohongshu: '샤오홍슈',
  douyin: '더우인',
  etc: '기타',
};

export function getContentPlatformLabel(v: string | null | undefined): string {
  return CONTENT_PLATFORM_LABELS[v as ContentPlatform] ?? (v ? v : '기타');
}

export type ContentType = 'reels' | 'shorts' | 'video' | 'post' | 'blog' | 'live' | 'etc';

export const CONTENT_TYPES: ContentType[] = ['reels', 'shorts', 'video', 'post', 'blog', 'live', 'etc'];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  reels: '릴스',
  shorts: '쇼츠',
  video: '영상',
  post: '게시물',
  blog: '블로그 글',
  live: '라이브',
  etc: '기타',
};

/**
 * 리드-콘텐츠 귀속 단계.
 * 게시일과 문의일이 가깝다는 이유만으로 direct를 지정하지 않는다 — 기본값은 inferred.
 */
export type Attribution = 'direct' | 'assisted' | 'inferred' | 'unknown';

export const ATTRIBUTIONS: Attribution[] = ['direct', 'assisted', 'inferred', 'unknown'];

export const ATTRIBUTION_LABELS: Record<Attribution, string> = {
  direct: '직접',
  assisted: '보조',
  inferred: '추정',
  unknown: '출처불명',
};

export const ATTRIBUTION_DESCRIPTIONS: Record<Attribution, string> = {
  direct: 'UTM·앱결제·전용 링크·고객 응답으로 출처가 확인됨',
  assisted: '고객이 여러 채널을 함께 봤다고 응답함',
  inferred: '게시일과 문의일의 시간적 연관성만 있음 (단정 금지)',
  unknown: '출처 불명',
};

// ─── 퍼널 단계 (기존 contact/reserved/visited에 paid 확장) ──
export type LeadStage = 'contact' | 'reserved' | 'visited' | 'paid';

export const LEAD_STAGES: LeadStage[] = ['contact', 'reserved', 'visited', 'paid'];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  contact: '신규 연락',
  reserved: '예약',
  visited: '내원',
  paid: '결제',
};

/** 추이/퍼널 계열색. dataviz 검증 통과(4색, 인접 CVD는 범례·라벨·간격으로 보조) */
export const LEAD_STAGE_HEX: Record<LeadStage, string> = {
  contact: '#3b82f6',
  reserved: '#d97706',
  visited: '#059669',
  paid: '#a855f7',
};

export type LeadOutcome = 'cancelled' | 'no_show';

export const LEAD_OUTCOMES: LeadOutcome[] = ['cancelled', 'no_show'];

export const LEAD_OUTCOME_LABELS: Record<LeadOutcome, string> = {
  cancelled: '취소',
  no_show: '노쇼',
};

export interface LeadStageFields {
  reserved: boolean;
  visited: boolean;
  paid: boolean;
}

/** 현재 단계 = 플래그에서 파생 (별도 상태 컬럼을 두지 않아 불일치를 원천 차단) */
export function getLeadStage(l: LeadStageFields): LeadStage {
  if (l.paid) return 'paid';
  if (l.visited) return 'visited';
  if (l.reserved) return 'reserved';
  return 'contact';
}

// ─── 입력 누락/검토 큐 판정 ──────────────────────────
export interface LeadClassificationFields {
  patient_origin: string | null;
  channel_category: string | null;
  treatment_tags: string[];
  classified_at: string | null;
}

export type MissingField = 'origin' | 'channel' | 'treatment';

export const MISSING_FIELD_LABELS: Record<MissingField, string> = {
  origin: '국내/해외',
  channel: '유입 경로',
  treatment: '시술 태그',
};

export function getMissingFields(l: LeadClassificationFields): MissingField[] {
  const missing: MissingField[] = [];
  if (!l.patient_origin) missing.push('origin');
  if (!l.channel_category) missing.push('channel');
  if (!l.treatment_tags || l.treatment_tags.length === 0) missing.push('treatment');
  return missing;
}

/** 표준화 검토 큐 대상: 아직 관리자가 확인하지 않았고(classified_at 없음) 누락이 있는 행 */
export function needsReview(l: LeadClassificationFields): boolean {
  return !l.classified_at && getMissingFields(l).length > 0;
}
