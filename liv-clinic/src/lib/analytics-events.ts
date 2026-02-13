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

/** GA4 이벤트 전송 (gtag 존재 여부 자동 체크) */
export function trackEvent(eventName: string, params?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && typeof gtag === 'function') {
    gtag('event', eventName, params);
  }
}

/** 연락 이벤트 (전화, 카카오, 위챗 등) */
export function trackContact(
  method: 'phone' | 'kakao' | 'wechat' | 'line' | 'naver_map' | 'kakao_map',
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

/** 시술 상세 조회 이벤트 */
export function trackViewItem(itemName: string, category: string) {
  trackEvent('view_item', {
    item_name: itemName,
    item_category: category,
  });
}
