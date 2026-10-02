import 'server-only';

// 긴급 정지 스위치 (스펙 2026-10-01 §4.5·§4.10). 값이 'off'일 때만 꺼진다 — 비어 있으면 켜진 것이다.
// 맨 아래 재촉 알림(CHAT_ESCALATION)만 반대다: 비어 있으면 꺼진 것이고 'on'일 때만 켜진다.
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
 * 재촉 알림 — 방의 5·12·30분 "답이 없습니다" 와 #해외문의의 🚨 줄.
 * 위 스위치들과 반대로 기본이 꺼져 있다(원장님 2026-10-02: 재촉 알림을 없앤다). CHAT_ESCALATION=on 일 때만 true.
 */
export function isEscalationEnabled(): boolean {
  return (process.env.CHAT_ESCALATION ?? '').trim().toLowerCase() === 'on';
}
