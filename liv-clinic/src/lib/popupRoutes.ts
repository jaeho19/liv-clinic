/**
 * 팝업을 띄우지 않는 페이지인지 판정한다. 로케일이 빠진 경로(`/events/x`)를 받는다.
 *
 * 팝업을 누르면 이벤트 페이지로 가는데, 거기서 같은 팝업이 다시 떠서 이벤트 내용을 가렸다.
 * 이벤트 목록 · 상세 · 첫 방문 안내를 모두 제외한다.
 */
export function isPopupHiddenPath(pathname: string): boolean {
  return pathname === '/events' || pathname.startsWith('/events/');
}
