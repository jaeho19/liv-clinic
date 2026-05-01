/**
 * GA4 커스텀 이벤트 추적 유틸리티
 *
 * 사용법:
 *   import { trackContact, trackFormSubmit } from '@/lib/analytics-events';
 *   trackContact('phone');
 */

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
