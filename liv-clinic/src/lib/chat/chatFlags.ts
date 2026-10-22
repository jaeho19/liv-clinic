import 'server-only';

// 긴급 정지 스위치 (스펙 2026-10-01 §4.5·§4.10). 값이 'off'일 때만 꺼진다 — 비어 있으면 켜진 것이다.
// 아래쪽의 재촉 알림(CHAT_ESCALATION)·AI 응대(CHAT_AI)·고지 한 줄(CHAT_AI_NOTICE)은 반대다: 비어 있으면 꺼진 것이다.
// 환경변수는 호출 시점에 읽는다(테스트에서 바꿔 넣을 수 있게).

function isOff(name: string): boolean {
  return (process.env[name] ?? '').trim().toLowerCase() === 'off';
}

/**
 * "오늘 연락할 손님" 묶음 — 연락처를 남긴 손님의 5·12·30분 알림 제외, 하루 두 번 요약, 직원 답글 번역본 게시.
 * CHAT_FOLLOWUP=off 면 false (요약·번역본은 나가지 않고, 재촉 알림을 켜 둔 경우에는 연락처가 있어도 울린다).
 */
export function isFollowupEnabled(): boolean {
  return !isOff('CHAT_FOLLOWUP');
}

/** 가격 문의에 이벤트 링크 자동 발송. CHAT_EVENT_HINT=off 면 false. 말풍선의 링크 누르기와는 무관하다. */
export function isEventHintEnabled(): boolean {
  return !isOff('CHAT_EVENT_HINT');
}

/**
 * 손님 방 글의 이름표·색 막대 (스펙 2026-10-01 slack-room-look §3.5).
 * SLACK_ROOM_LOOK=off 면 false — 방 안의 글을 예전처럼 글자만으로 올린다. 방 이름 규칙과는 무관하다.
 */
export function isRoomLookEnabled(): boolean {
  return !isOff('SLACK_ROOM_LOOK');
}

/**
 * 대화가 멈췄을 때의 AI 응대 요약 (스펙 2026-10-22 chat-ai-slack-transcript §2).
 * CHAT_AI_SUMMARY=off 면 false — 요약만 멈춘다(AI 답 전문은 그대로 방에 올라간다).
 */
export function isAiSummaryEnabled(): boolean {
  return !isOff('CHAT_AI_SUMMARY');
}

/**
 * 재촉 알림 — 방의 5·12·30분 "답이 없습니다" 와 #해외문의의 🚨 줄.
 * 위 스위치들과 반대로 기본이 꺼져 있다(원장님 2026-10-02: 재촉 알림을 없앤다). CHAT_ESCALATION=on 일 때만 true.
 */
export function isEscalationEnabled(): boolean {
  return (process.env.CHAT_ESCALATION ?? '').trim().toLowerCase() === 'on';
}

export type ChatAiMode = 'off' | 'test' | 'on';

/**
 * AI 1차 응대 (스펙 2026-10-02 chat-ai-first-response §4.2). 기본이 꺼져 있다.
 * CHAT_AI=on 이면 모든 문의, test 면 이름이 `ai-test`로 시작하는 문의만, 그 밖의 값은 꺼짐.
 * 긴급 정지: 값을 지우거나 off 로 두고 재배포한다.
 */
export function chatAiMode(): ChatAiMode {
  const value = (process.env.CHAT_AI ?? '').trim().toLowerCase();
  return value === 'on' || value === 'test' ? value : 'off';
}

/**
 * 제안형 응대 (스펙 2026-10-12 chat-ai-guided-offers §6) — 조합 · 저부담 대안 제안, 첫방문 체험가 줄, 채팅 예약 혜택의 피부관리 · 수액.
 * 기본이 꺼져 있다. 값의 뜻은 CHAT_AI 와 같다: on = 모든 문의, test = 이름이 `ai-test`로 시작하는 문의만, 그 밖의 값은 꺼짐.
 * 꺼져 있으면 혜택 문장은 5%만 말한다(10/2 와 같은 뜻). 자문(U-4 · U-11) 전에는 on 으로 두지 않는다(test 는 된다).
 * 긴급 정지: 값을 지우고 재배포 — AI 응대는 그대로 두고 제안만 멈춘다.
 */
export function chatAiOffersMode(): ChatAiMode {
  const value = (process.env.CHAT_AI_OFFERS ?? '').trim().toLowerCase();
  return value === 'on' || value === 'test' ? value : 'off';
}

/**
 * 손님 화면의 고지 한 줄 ("자동 응대가 먼저 답하고, 예약은 병원에서 확인합니다") — 스펙 §4.10.
 * 기본이 꺼져 있다(원장님 2026-10-02: AI라고 적지 않는다). 자문 결과 고지가 필요하면 CHAT_AI_NOTICE=on.
 */
export function isAiNoticeEnabled(): boolean {
  return (process.env.CHAT_AI_NOTICE ?? '').trim().toLowerCase() === 'on';
}
