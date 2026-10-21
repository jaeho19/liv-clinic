// 손님 화면으로 내보내는 글의 모양 (스펙 2026-10-02 chat-ai-first-response §4.10). 순수 함수 — 서버·브라우저 공용.

/**
 * 글의 출처 값 'ai'(AI 1차 응대)를 'auto'(자동 안내)로 바꿔 보낸다.
 * 손님 화면은 "직원 글인가 아닌가"만 알면 되고(연락처 카드 규칙), 원장님 결정으로 손님 쪽에는 AI라는 표시를 두지 않는다.
 * 관리자 화면은 이 함수를 거치지 않는다 — 거기서는 'ai' 를 그대로 보고 `AI 응대`로 표시한다.
 */
export function toVisitorMessages<T extends { source?: string | null }>(rows: T[]): T[] {
  return rows.map((row) => (row.source === 'ai' ? { ...row, source: 'auto' } : row));
}
