// 손님 화면(ChatPanel)의 순수 규칙 — 브라우저 API 접근 없음 (스펙 2026-10-02 chat-ai-first-response §4.10).

/** "입력 중" 표시를 켜 두는 가장 긴 시간. 답이 오지 않으면 이 뒤에 지운다 */
export const TYPING_MAX_MS = 30_000;

export interface TypingState {
  /** 답을 기다리는 손님 글이 저장된 시각 (그 글의 created_at) */
  since: string;
  /** 이 시각(ms)에 지운다 */
  untilMs: number;
}

interface PanelMessage {
  id: string;
  sender: string;
  created_at: string;
}

/** 글을 보낸 응답에 instantReply 가 오면 부른다. */
export function startTyping(messageCreatedAt: string, nowMs: number): TypingState {
  return { since: messageCreatedAt, untilMs: nowMs + TYPING_MAX_MS };
}

/** 표시를 지울 때까지 남은 시간(ms). 지났으면 0. */
export function typingRemainingMs(state: TypingState, nowMs: number): number {
  return Math.max(0, state.untilMs - nowMs);
}

/** 그 손님 글 뒤에 직원·자동 응대의 글이 도착했는가 — 도착했으면 "입력 중"을 지운다. 시스템 문구는 답이 아니다. */
export function hasReplyAfter(messages: PanelMessage[], since: string): boolean {
  const sinceMs = Date.parse(since);
  return messages.some((m) => m.sender === 'operator' && Date.parse(m.created_at) > sinceMs);
}

/**
 * 가장 최근의 직원·자동 응대 글의 id. 이 값이 바뀌면 세션 정보를 다시 읽는다 —
 * 답과 함께 연락처가 저장됐을 수 있고(카드를 닫는다), 직원이 맡았을 수 있다(온라인 표시가 지금 방식으로 돌아간다).
 */
export function lastReplyId(messages: PanelMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].sender === 'operator') return messages[i].id;
  }
  return null;
}

/** 새 글의 머리와 화면 위쪽 사이에 두는 여백 */
const SCROLL_MARGIN_PX = 8;

/**
 * 새 글이 왔을 때의 스크롤 위치: 그 글의 머리가 보이는 한에서 가장 아래.
 * 글과 그 아래 내용(연락처 카드)이 한 화면에 들어가면 맨 아래로, 넘치면 글의 머리를 화면 위쪽에 맞춘다.
 * messageTop 은 스크롤 영역의 내용 맨 위에서 잰 그 글의 위치다.
 */
export function scrollTopForNewMessage(m: { messageTop: number; scrollHeight: number; clientHeight: number }): number {
  const bottom = Math.max(0, m.scrollHeight - m.clientHeight);
  return Math.max(0, Math.min(bottom, m.messageTop - SCROLL_MARGIN_PX));
}
