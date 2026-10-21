// 관리자 채팅 상세 화면의 순수 규칙 (스펙 2026-10-02 chat-ai-first-response §4.12).
// 브라우저에서 도는 화면(ChatDetailClient)이 불러 쓴다 — 서버 전용 모듈을 import 하지 않는다.
// 머리말의 가예약 한 줄은 서버에서 만든다(adminBooking.ts).

/** 직원 쪽 글 아래의 작은 글씨 — 누가(무엇이) 쓴 글인가. */
export function operatorSourceLabel(message: { source?: string | null; sender_label?: string | null }): string {
  if (message.source === 'ai') return 'AI 응대';
  if (message.source === 'auto') return '자동 안내';
  if (message.source === 'slack') return `Slack · ${message.sender_label ?? 'Slack 직원'}`;
  return '관리자 화면';
}
