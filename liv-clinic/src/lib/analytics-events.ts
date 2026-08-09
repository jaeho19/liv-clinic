/**
 * GA4 커스텀 이벤트 추적 유틸리티
 *
 * 사용법:
 *   import { trackContact, trackFormSubmit } from '@/lib/analytics-events';
 *   trackContact('phone');
 */

// Chat event locale param follows the chat whitelist SSOT (type-only import — no runtime coupling).
import type { VisitorLocale } from '@/lib/chat/chatApi';

declare global {
  function gtag(...args: unknown[]): void;
}

// ============================================
// Core: 이벤트 전송 기본 함수
// ============================================

/** GA4 이벤트 전송 (gtag 존재 여부 자동 체크) */
export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  if (typeof window !== 'undefined' && typeof gtag === 'function') {
    gtag('event', eventName, params);
  }
}

// ============================================
// 연락/상담 이벤트
// ============================================

/** 연락 이벤트 (전화, 카카오, 위챗 등) */
export function trackContact(
  method:
    | 'phone'
    | 'kakao'
    | 'wechat'
    | 'line'
    | 'whatsapp'
    | 'naver_map'
    | 'kakao_map'
    | 'instagram'
    | 'youtube',
  pagePath?: string,
) {
  trackEvent('contact', {
    method,
    page_location: pagePath || (typeof window !== 'undefined' ? window.location.pathname : ''),
  });
}

/** 채팅 위젯 열기 */
export function trackChatOpen(locale: VisitorLocale) {
  trackEvent('chat_open', { locale });
}

/** 채팅 첫 메시지 전송 (세션 생성 직후) */
export function trackChatFirstMessage(locale: VisitorLocale) {
  trackEvent('chat_first_message', { locale });
}

/** 채팅 메시지 전송/수신 */
export function trackChatMessage(
  direction: 'sent' | 'received',
  locale: VisitorLocale,
) {
  trackEvent('chat_message', { direction, locale });
}

/** 첫 방문 티저 말풍선 노출 */
export function trackChatTeaserShown(locale: VisitorLocale) {
  trackEvent('chat_teaser_shown', { locale });
}

/** 첫 방문 티저 말풍선 클릭 (채팅 패널 열림) */
export function trackChatTeaserClick(locale: VisitorLocale) {
  trackEvent('chat_teaser_click', { locale });
}

/** 오프시간 캡처 블록 노출 (세션당 1회) */
export function trackChatCaptureShown(locale: VisitorLocale) {
  trackEvent('chat_capture_shown', { locale });
}

/** 캡처 블록의 메신저 이동 버튼 클릭 */
export function trackChatCaptureMessengerClick(channel: string, locale: VisitorLocale) {
  trackEvent('chat_capture_messenger_click', { channel, locale });
}

/** 캡처 블록에서 연락처 저장 성공 */
export function trackChatContactSaved(channel: string, locale: VisitorLocale) {
  trackEvent('chat_capture_contact_saved', { channel, locale });
}

/** 재방문 시 부재중 답장 티저 노출 */
export function trackChatReplyTeaserShown(locale: VisitorLocale) {
  trackEvent('chat_reply_teaser_shown', { locale });
}

/** 부재중 답장 티저 클릭 (패널 열림) */
export function trackChatReplyTeaserClick(locale: VisitorLocale) {
  trackEvent('chat_reply_teaser_click', { locale });
}

/** 번역 실패 */
export function trackChatTranslationFailure(reason: string) {
  trackEvent('chat_translation_error', { reason });
}

/**
 * Session ID를 GA4용 16자 hex 해시로 변환 (PII 보호).
 * Web Crypto SubtleCrypto를 사용해 클라이언트 측에서 SHA-256 후 앞 8바이트만 사용.
 * 64-bit 엔트로피로 GA4 cardinality 충분 + 평문 외부 노출 방지.
 */
async function hashSessionId(sessionId: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return 'unsupported';
  }
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(sessionId);
    const buf = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf))
      .slice(0, 8)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return 'hash_failed';
  }
}

export type ChatCloseReason = 'visitor_close' | 'operator_close' | 'session_timeout';

/**
 * 채팅 세션 종료 이벤트 (방문자 패널 닫기 또는 어드민 종료).
 * Fire-and-forget 패턴: await 없이 호출해도 안전.
 * sessionId는 SHA-256 16자 해시로 변환되어 평문 노출 없음.
 */
export async function trackChatClose(
  reason: ChatCloseReason,
  durationSec: number,
  sessionId: string,
  locale?: VisitorLocale,
): Promise<void> {
  const sessionIdHash = await hashSessionId(sessionId);
  trackEvent('chat_close', {
    reason,
    duration_sec: Math.max(0, Math.round(durationSec)),
    session_id_hash: sessionIdHash,
    ...(locale && { locale }),
  });
}

/** 상담 폼 제출 이벤트 */
export function trackFormSubmit(formType: string, treatment?: string) {
  trackEvent('generate_lead', {
    form_type: formType,
    ...(treatment && { treatment }),
  });
}

/** 예약/상담 시작 이벤트 */
export function trackBookingStart(source: string, treatment?: string) {
  trackEvent('begin_checkout', {
    source,
    ...(treatment && { item_name: treatment }),
  });
}

// ============================================
// 시술/콘텐츠 조회 이벤트
// ============================================

/** 시술 상세 조회 이벤트 */
export function trackViewItem(itemName: string, category: string) {
  trackEvent('view_item', {
    item_name: itemName,
    item_category: category,
  });
}

/** 프로모션/이벤트 클릭 */
export function trackPromoClick(promoName: string, promoId?: string) {
  trackEvent('select_promotion', {
    promotion_name: promoName,
    ...(promoId && { promotion_id: promoId }),
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
  });
}

/** 갤러리 이미지 조회 */
export function trackGalleryView(imageCategory: string, imageIndex?: number) {
  trackEvent('view_item_list', {
    item_list_name: 'gallery',
    item_category: imageCategory,
    ...(imageIndex !== undefined && { index: imageIndex }),
  });
}

// ============================================
// 네비게이션/UX 이벤트
// ============================================

/** 언어 변경 이벤트 */
export function trackLanguageSwitch(fromLang: string, toLang: string) {
  trackEvent('language_switch', {
    from_language: fromLang,
    to_language: toLang,
  });
}

/** CTA 버튼 클릭 이벤트 */
export function trackCTAClick(
  ctaType: 'header_consult' | 'floating_consult' | 'hero_cta' | 'treatment_cta' | 'quick_consult' | 'footer_cta',
  label?: string,
) {
  trackEvent('cta_click', {
    cta_type: ctaType,
    ...(label && { cta_label: label }),
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
  });
}

/** 길찾기/지도 클릭 이벤트 */
export function trackDirections(mapType: 'naver_map' | 'kakao_map' | 'google_map') {
  trackEvent('get_directions', {
    map_type: mapType,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
  });
}

/** 메뉴 네비게이션 이벤트 */
export function trackNavigation(destination: string, source: 'header' | 'footer' | 'breadcrumb' | 'internal_link') {
  trackEvent('navigation', {
    destination,
    source,
  });
}

// ============================================
// 시술 비교/탐색 이벤트
// ============================================

/** 시술 비교 이벤트 */
export function trackTreatmentCompare(treatments: string[]) {
  trackEvent('treatment_compare', {
    items: treatments.join(','),
    item_count: treatments.length,
  });
}

/** 시술 카테고리 탐색 이벤트 */
export function trackCategoryBrowse(category: 'lifting' | 'antiaging' | 'laser' | 'signature') {
  trackEvent('view_item_list', {
    item_list_name: category,
    item_category: category,
  });
}

// ============================================
// 의료정보/FAQ 이벤트
// ============================================

/** FAQ 조회 이벤트 */
export function trackFAQView(question: string, category: string) {
  trackEvent('faq_view', {
    question_text: question.substring(0, 100),
    faq_category: category,
  });
}

/** 의료정보 검색 이벤트 */
export function trackSearch(searchTerm: string, resultCount?: number) {
  trackEvent('search', {
    search_term: searchTerm,
    ...(resultCount !== undefined && { results_count: resultCount }),
  });
}

// ============================================
// 소셜/공유 이벤트
// ============================================

/** SNS 링크 클릭 */
export function trackSocialClick(platform: 'instagram' | 'blog_naver' | 'kakao_channel' | 'youtube') {
  trackEvent('social_click', {
    social_platform: platform,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
  });
}

/** 콘텐츠 공유 이벤트 */
export function trackShare(method: string, contentType: string) {
  trackEvent('share', {
    method,
    content_type: contentType,
  });
}

// ============================================
// 의사/장비 관련 이벤트
// ============================================

/** 의료진 프로필 조회 */
export function trackDoctorView(doctorName: string) {
  trackEvent('doctor_profile_view', {
    doctor_name: doctorName,
  });
}

/** 장비 상세 조회 */
export function trackEquipmentView(equipmentName: string) {
  trackEvent('equipment_view', {
    equipment_name: equipmentName,
  });
}
