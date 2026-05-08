// 클라이언트(브라우저) 측 fetch 래퍼.
// 서버 라우트(/api/chat/*)와 1:1 매핑.

export type VisitorLocale = 'en' | 'ja' | 'zh';
export type MessageSender = 'visitor' | 'operator' | 'system';
export type TranslationStatus = 'pending' | 'success' | 'failed' | 'skipped';

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: MessageSender;
  original_text: string;
  original_lang: 'ko' | 'en' | 'ja' | 'zh';
  translated_text: string | null;
  translated_lang: 'ko' | 'en' | 'ja' | 'zh' | null;
  translation_status: TranslationStatus;
  created_at: string;
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

export async function sendVisitorMessage(
  sessionToken: string,
  text: string
): Promise<ChatMessage> {
  const res = await fetch('/api/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken, text }),
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new ChatApiError(res.status, err?.error ?? 'send_failed', err);
  }
  const json = (await res.json()) as { message: ChatMessage };
  return json.message;
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

export async function fetchPresence(): Promise<{
  online: boolean;
  operatorCount: number;
  businessHours: boolean;
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
