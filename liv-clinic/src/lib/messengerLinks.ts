// 메신저 딥링크 유틸 — 로케일별 1순위 메신저 선택과 wa.me 링크 조립을 한곳에서 담당.
// FloatingCTA / QuickConsultBar / StickyCtaBar가 공유한다.
import { SOCIAL_LINKS, WHATSAPP_NUMBER } from '@/lib/constants';

export type PrimaryMessenger = 'line' | 'whatsapp' | 'wechat';

/**
 * 로케일별 1순위 메신저.
 * - ja → LINE, zh → WeChat, 그 외(en/fr/mn/ar/ru/vi/th/zh-TW) → WhatsApp.
 * ko는 이 매핑을 사용하지 않는다(국내는 카카오/전화 유지).
 */
export function primaryMessengerFor(locale: string): PrimaryMessenger {
  if (locale === 'ja') return 'line';
  if (locale === 'zh') return 'wechat';
  return 'whatsapp';
}

/** wa.me 딥링크를 렌더 시점에 조립(로케일별 prefill을 URL 인코딩). */
export function buildWhatsAppLink(prefill?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  const text = prefill?.trim();
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** LINE 앱 딥링크(고정). */
export const LINE_LINK = SOCIAL_LINKS.line;

/** WeChat 모바일 딥링크(고정) — 데스크톱은 WeChatQRModal(QR 스캔)을 사용한다. */
export const WECHAT_DEEPLINK = SOCIAL_LINKS.wechat;
