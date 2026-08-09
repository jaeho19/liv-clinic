// 방문자가 남길 수 있는 메신저 채널 SSOT.
// 클리닉이 실제 운영하는 계정과 1:1 (constants.ts SOCIAL_LINKS 참조).
// Telegram/Zalo 등은 클리닉 계정 개설 시 여기에만 추가하면 된다 (DB CHECK 없음).
// 클라이언트/서버 공용 — 브라우저 API 접근 없음 (chatApi.ts 패턴).
export const CONTACT_CHANNELS = ['whatsapp', 'wechat', 'line'] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

// 브랜드명은 로케일 무관 — 번역하지 않는다.
export const CONTACT_CHANNEL_LABELS: Record<ContactChannel, string> = {
  whatsapp: 'WhatsApp',
  wechat: 'WeChat',
  line: 'LINE',
};

const WHATSAPP_HANDLE_RE = /^[+0-9][0-9 ()\-]{6,29}$/;
const ID_HANDLE_RE = /^[A-Za-z0-9._\-]{4,50}$/;

export function validateContactHandle(channel: ContactChannel, handle: string): boolean {
  const trimmed = handle.trim();
  if (channel === 'whatsapp') return WHATSAPP_HANDLE_RE.test(trimmed);
  return ID_HANDLE_RE.test(trimmed);
}

/** 메신저 대화 ↔ 웹챗 기록을 잇는 짧은 참조코드 (uuid 첫 세그먼트 대문자). */
export function buildChatRefCode(sessionId: string): string {
  return sessionId.replace(/-/g, '').slice(0, 8).toUpperCase();
}

export interface CaptureBlockConditions {
  /** null = presence 미조회 (조회 실패 포함) → 미노출 */
  businessHours: boolean | null;
  visitorMessageCount: number;
  dismissed: boolean;
  saved: boolean;
}

export function shouldShowCaptureBlock(c: CaptureBlockConditions): boolean {
  if (c.businessHours !== false) return false;
  if (c.visitorMessageCount < 1) return false;
  if (c.dismissed || c.saved) return false;
  return true;
}
