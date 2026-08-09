// 부재중(사이트 이탈 중) 도착한 답장 카운트 — since 조회 결과에서 방문자 본인 발신을 제외.
export function countOfflineReplies(messages: Array<{ sender: string }>): number {
  return messages.filter((m) => m.sender !== 'visitor').length;
}
