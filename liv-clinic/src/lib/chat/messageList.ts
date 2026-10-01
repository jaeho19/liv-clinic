// 손님 화면의 메시지 목록을 다루는 순수 함수 — 브라우저 API 접근 없음.
// 자동 안내를 번역·응답보다 먼저 보내면서(스펙 2026-10-01 §4.1) 손님 자신의 글이
// "broadcast로 먼저 불러온 번역 전 상태"와 "전송 응답으로 온 완성본" 두 길로 도착하게 됐다.

interface ListMessage {
  id: string;
  created_at: string;
}

/** 목록에 한 건을 넣는다. 같은 id가 이미 있으면 새 것으로 바꾼다. 시간순 정렬을 유지한다. */
export function upsertMessage<T extends ListMessage>(list: T[], message: T): T[] {
  const next = list.some((m) => m.id === message.id)
    ? list.map((m) => (m.id === message.id ? message : m))
    : [...list, message];
  next.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  return next;
}

/** 손님이 쓴 글 가운데 내용이 text 와 같은 것의 개수. */
export function countVisitorText(list: Array<{ sender: string; original_text: string }>, text: string): number {
  return list.filter((m) => m.sender === 'visitor' && m.original_text === text).length;
}
