// 클라이언트(브라우저) 측 fetch 래퍼.
// 서버 라우트(/api/chat/*)와 1:1 매핑.

import type { ContactChannel } from './contactChannels';

export type VisitorLocale =
  | 'en'
  | 'ja'
  | 'zh'
  | 'zh-TW'
  | 'vi'
  | 'th'
  | 'ru'
  | 'fr'
  | 'mn'
  | 'ar';
// 클라이언트에서 라이브챗 활성 로케일을 판정하는 런타임 목록([locale]/layout.tsx 마운트 게이트가 이 목록을 직접 사용).
export const CHAT_VISITOR_LOCALES = [
  'en',
  'ja',
  'zh',
  'zh-TW',
  'vi',
  'th',
  'ru',
  'fr',
  'mn',
  'ar',
] as const;
export type MessageSender = 'visitor' | 'operator' | 'system';
export type TranslationStatus = 'pending' | 'success' | 'failed' | 'skipped';

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: MessageSender;
  original_text: string;
  original_lang: 'ko' | VisitorLocale;
  translated_text: string | null;
  translated_lang: 'ko' | VisitorLocale | null;
  translation_status: TranslationStatus;
  translation_error: string | null;
  created_at: string;
  sender_label?: string | null;
  source?: string | null;
}

export interface CreateSessionResponse {
  sessionId: string;
  sessionToken: string;
  visitorLocale: VisitorLocale;
  status: 'open' | 'closed' | 'abandoned';
  createdAt: string;
  businessHours: boolean;
  operatorOnline: boolean;
}

export async function createChatSession(input: {
  visitorLocale: VisitorLocale;
  visitorName?: string;
  visitorEmail?: string;
}): Promise<CreateSessionResponse> {
  const res = await fetch('/api/chat/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new ChatApiError(res.status, err?.error ?? 'create_failed', err);
  }
  return res.json();
}

export async function fetchVisitorMessages(
  sessionToken: string,
  since?: string
): Promise<ChatMessage[]> {
  const url = new URL('/api/chat/messages', window.location.origin);
  url.searchParams.set('sessionToken', sessionToken);
  if (since) url.searchParams.set('since', since);
  const res = await fetch(url.toString());
  if (!res.ok) throw new ChatApiError(res.status, 'fetch_failed');
  const json = (await res.json()) as { messages: ChatMessage[] };
  return json.messages;
}

export interface VisitorSendResult {
  message: ChatMessage;
  /**
   * saved: 서버가 이 글 속 이메일을 연락처로 저장했다. hasContact: 지금 연락처(이메일·메신저)가 있다 — 연락처 카드를 숨길지 판단한다.
   * 배포 직후 옛 서버가 응답하면 없을 수 있어 null을 허용한다.
   */
  contact: { saved: boolean; hasContact: boolean } | null;
}

export async function sendVisitorMessage(
  sessionToken: string,
  text: string
): Promise<VisitorSendResult> {
  const res = await fetch('/api/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken, text }),
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new ChatApiError(res.status, err?.error ?? 'send_failed', err);
  }
  const json = (await res.json()) as {
    message: ChatMessage;
    contact?: { saved: boolean; hasContact: boolean };
  };
  return { message: json.message, contact: json.contact ?? null };
}

/** 세션의 연락처 유무 — 패널을 열 때 연락처 카드를 띄울지 판단한다. 연락처 값 자체는 받지 않는다. */
export async function fetchSessionInfo(sessionToken: string): Promise<{ hasContact: boolean }> {
  const url = new URL('/api/chat/sessions', window.location.origin);
  url.searchParams.set('token', sessionToken);
  const res = await fetch(url.toString());
  if (!res.ok) throw new ChatApiError(res.status, 'session_info_failed');
  const json = (await res.json()) as { hasContact?: boolean };
  return { hasContact: Boolean(json.hasContact) };
}

export async function sendOperatorMessage(
  sessionId: string,
  text: string
): Promise<ChatMessage> {
  const res = await fetch('/api/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, text }),
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new ChatApiError(res.status, err?.error ?? 'send_failed', err);
  }
  const json = (await res.json()) as { message: ChatMessage };
  return json.message;
}

// 연락처 카드: 손님이 자기 연락처(WhatsApp 번호·WeChat ID·이메일)를 남긴다
export async function saveContact(
  sessionToken: string,
  channel: ContactChannel,
  handle: string
): Promise<void> {
  const res = await fetch('/api/chat/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken, channel, handle, kind: 'save' }),
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new ChatApiError(res.status, err?.error ?? 'contact_failed', err);
  }
}

/**
 * 연락처 카드: 손님이 병원 연락 단추(WhatsApp·WeChat·LINE·이메일)를 눌렀음을 알린다 → 직원 Slack 방에 한 줄.
 * 화면 이동(새 창·메일 앱)을 막지 않도록 응답을 기다리지 않고, 실패해도 조용히 넘어간다.
 */
export function reportContactClick(sessionToken: string, channel: ContactChannel): void {
  try {
    void fetch('/api/chat/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken, channel, kind: 'click' }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // fetch 자체를 쓸 수 없는 환경 — 무시
  }
}

export async function closeSession(sessionId: string): Promise<void> {
  const res = await fetch(`/api/chat/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new ChatApiError(res.status, err?.error ?? 'close_failed', err);
  }
}

async function patchSession(sessionId: string, action: 'resolve' | 'unresolve'): Promise<void> {
  const res = await fetch(`/api/chat/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new ChatApiError(res.status, err?.error ?? `${action}_failed`, err);
  }
}

/** 완료 처리 — 내부 정리. 손님에게는 아무 메시지도 가지 않는다. */
export function resolveSession(sessionId: string): Promise<void> {
  return patchSession(sessionId, 'resolve');
}

export function unresolveSession(sessionId: string): Promise<void> {
  return patchSession(sessionId, 'unresolve');
}

export async function fetchPresence(): Promise<{
  online: boolean;
  operatorCount: number;
  businessHours: boolean;
  nextOpenAt: string | null;
}> {
  const res = await fetch('/api/chat/presence');
  if (!res.ok) throw new ChatApiError(res.status, 'presence_failed');
  return res.json();
}

export class ChatApiError extends Error {
  status: number;
  code: string;
  body: unknown;
  constructor(status: number, code: string, body?: unknown) {
    super(`${code} (${status})`);
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

async function safeJson(res: Response): Promise<{ error?: string } | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// ChatWidget을 외부 컴포넌트(QuickConsultBar 등)에서 여는 경량 메커니즘.
// ChatWidget이 window에서 이 이벤트를 구독한다 — 컨텍스트 프로바이더/의존성 없이 동작.
export const OPEN_CHAT_EVENT = 'liv:open-chat';

export function openLivChat(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT));
  }
}
