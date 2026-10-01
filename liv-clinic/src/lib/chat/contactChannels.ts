// 채팅 연락처 카드의 채널 SSOT (스펙 2026-10-01 §4.2~§4.4).
// 클리닉이 실제 운영하는 계정과 1:1 (constants.ts SOCIAL_LINKS·CHAT_CONTACT_EMAIL 참조).
// 클라이언트/서버 공용 — 브라우저 API 접근 없음, 정규식 lookbehind 없음 (chatApi.ts 패턴).
import { CHAT_CONTACT_EMAIL } from '@/lib/constants';
import { primaryMessengerFor } from '@/lib/messengerLinks';

/** 카드의 "병원으로 바로 연락하기" 단추 네 개. API가 받는 채널 값의 전체 집합이기도 하다. */
export const CLINIC_LINK_CHANNELS = ['whatsapp', 'wechat', 'line', 'email'] as const;
/** 카드의 "연락처 남기기" 칩. LINE ID는 받지 않는다 — 직원이 ID로 손님을 찾지 못했다(2026-10-01 실측 2건 모두 실패). */
export const CONTACT_FORM_CHANNELS = ['whatsapp', 'wechat', 'email'] as const;

export type ContactChannel = (typeof CLINIC_LINK_CHANNELS)[number];
export type ContactFormChannel = (typeof CONTACT_FORM_CHANNELS)[number];

// 손님 화면에 보이는 채널 이름 — 브랜드명이라 번역하지 않는다.
export const CONTACT_CHANNEL_LABELS: Record<ContactChannel, string> = {
  whatsapp: 'WhatsApp',
  wechat: 'WeChat',
  line: 'LINE',
  email: 'Email',
};

const WHATSAPP_HANDLE_RE = /^[+0-9][0-9 ()\-]{6,29}$/;
const ID_HANDLE_RE = /^[A-Za-z0-9._\-]{4,50}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length <= MAX_EMAIL_LENGTH && EMAIL_RE.test(trimmed);
}

export function validateContactHandle(channel: ContactChannel, handle: string): boolean {
  const trimmed = handle.trim();
  if (channel === 'whatsapp') return WHATSAPP_HANDLE_RE.test(trimmed);
  if (channel === 'email') return isValidEmail(trimmed);
  return ID_HANDLE_RE.test(trimmed);
}

/** 메신저 대화 ↔ 웹챗 기록을 잇는 짧은 참조코드 (uuid 첫 세그먼트 대문자). */
export function buildChatRefCode(sessionId: string): string {
  return sessionId.replace(/-/g, '').slice(0, 8).toUpperCase();
}

/** "연락처 남기기"의 기본 선택: 중국어 → WeChat, 일본어 → 이메일, 그 외 → WhatsApp. */
export function defaultFormChannel(locale: string): ContactFormChannel {
  if (locale === 'zh') return 'wechat';
  if (locale === 'ja') return 'email';
  return 'whatsapp';
}

/** "병원으로 바로 연락하기" 단추 순서: 그 로케일의 1순위 메신저가 맨 앞, 이메일은 맨 뒤. */
export function orderedLinkChannels(locale: string): ContactChannel[] {
  const primary = primaryMessengerFor(locale);
  const rest = (['whatsapp', 'wechat', 'line'] as const).filter((c) => c !== primary);
  return [primary, ...rest, 'email'];
}

// ── 손님 글 속 이메일 인식 (§4.3) ───────────────────────────────────────────

const EMAIL_IN_TEXT_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// 손님이 "이 주소로 메일 보냈어요"라고 병원 주소를 적어도 손님 연락처로 저장하지 않는다.
const CLINIC_EMAIL_DOMAINS = ['livps.co.kr', 'liv-clinic.net'];

/** 글 속 첫 이메일(병원 주소 제외, 254자 초과 무시). 없으면 null. */
export function extractEmail(text: string): string | null {
  for (const m of text.matchAll(EMAIL_IN_TEXT_RE)) {
    const email = m[0];
    if (email.length > MAX_EMAIL_LENGTH) continue;
    const lower = email.toLowerCase();
    if (lower === CHAT_CONTACT_EMAIL.toLowerCase()) continue;
    const domain = lower.slice(lower.lastIndexOf('@') + 1);
    if (CLINIC_EMAIL_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) continue;
    return email;
  }
  return null;
}

// ── 연락처 카드 노출 규칙 (§4.2) ────────────────────────────────────────────

/** ✕로 닫은 카드는 이만큼만 숨긴다 — 접수 안내가 12시간 뒤 다시 나갈 때 문장과 카드가 어긋나지 않게. */
export const CAPTURE_DISMISS_TTL_MS = 12 * 60 * 60 * 1000;
/** 직원 글이 이 시간 안에 있으면 "주고받는 중"으로 보고 카드를 끼워 넣지 않는다. */
export const STAFF_ACTIVE_WINDOW_MS = 10 * 60 * 1000;

export interface CaptureMessage {
  sender: string;
  /** 'auto' = 자동 안내. 직원 글로 치지 않는다 */
  source?: string | null;
  created_at: string;
}

export interface CaptureBlockConditions {
  /** presence 조회 성공 여부 — 실패하면 미노출 */
  presenceLoaded: boolean;
  /** 세션 정보(hasContact) 조회가 끝났는가 — 실패해도 true (연락처 없음으로 본다) */
  sessionInfoLoaded: boolean;
  /** 서버 기준 연락처 유무 (이메일 또는 메신저 연락처) */
  hasContact: boolean;
  /** 손님이 ✕로 닫은 시각(ms). 닫은 적 없으면 null */
  dismissedAtMs: number | null;
  /** 시간순 메시지 */
  messages: CaptureMessage[];
  nowMs: number;
}

/** 직원이 쓴 글인가 — 자동 안내(source='auto')와 시스템 메시지는 아니다. */
export function isStaffMessage(m: CaptureMessage): boolean {
  return m.sender === 'operator' && m.source !== 'auto';
}

/** 영업시간 여부는 노출 조건이 아니다 — 손님이 답을 기다리는 동안이면 낮에도 뜬다. */
export function shouldShowCaptureBlock(c: CaptureBlockConditions): boolean {
  if (!c.presenceLoaded || !c.sessionInfoLoaded) return false;
  if (c.hasContact) return false;
  if (c.dismissedAtMs !== null && c.nowMs - c.dismissedAtMs < CAPTURE_DISMISS_TTL_MS) return false;
  const turns = c.messages.filter((m) => m.sender === 'visitor' || isStaffMessage(m));
  if (!turns.some((m) => m.sender === 'visitor')) return false;
  // 기다리는 중: 손님 글과 직원 글 중 마지막이 손님 글
  if (turns[turns.length - 1].sender !== 'visitor') return false;
  // 직원과 실시간으로 주고받는 중에는 끼어들지 않는다
  const lastStaff = [...turns].reverse().find(isStaffMessage);
  if (lastStaff && c.nowMs - Date.parse(lastStaff.created_at) < STAFF_ACTIVE_WINDOW_MS) return false;
  return true;
}

/** localStorage 에 저장한 닫은 시각을 읽는다. 예전 값 '1'은 1ms로 읽혀 자연히 만료된 것으로 처리된다. */
export function parseCaptureDismissedAt(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
