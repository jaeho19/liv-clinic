import 'server-only';

// 긴급 정지 스위치 (스펙 2026-10-01 §4.5·§4.10). 값이 'off'일 때만 꺼진다 — 비어 있으면 켜진 것이다.
// 환경변수는 호출 시점에 읽는다(테스트에서 바꿔 넣을 수 있게).

function isOff(name: string): boolean {
  return (process.env[name] ?? '').trim().toLowerCase() === 'off';
}

/**
 * "오늘 연락할 손님" 묶음 — 연락처를 남긴 손님의 5·12·30분 알림 제외, 하루 두 번 요약, 직원 답글 번역본 게시.
 * CHAT_FOLLOWUP=off 면 false (연락처가 있어도 예전처럼 알림이 울리고, 요약·번역본은 나가지 않는다).
 */
export function isFollowupEnabled(): boolean {
  return !isOff('CHAT_FOLLOWUP');
}

/** 가격 문의에 이벤트 링크 자동 발송. CHAT_EVENT_HINT=off 면 false. 말풍선의 링크 누르기와는 무관하다. */
export function isEventHintEnabled(): boolean {
  return !isOff('CHAT_EVENT_HINT');
}
