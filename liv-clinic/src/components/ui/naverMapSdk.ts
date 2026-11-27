/**
 * 네이버 지도 SDK 와 맞닿는 부분만 모은 순수 함수 (테스트: __tests__/naverMapSdk.test.ts).
 *
 * - 스크립트 주소: 옛 AI NAVER API 지도(openapi 호스트 + ncpClientId)는 2026-06-25 종료.
 *   신규 NCP Maps 는 `oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=` 형식이다
 *   (https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html).
 *   옛 키는 이 형식에서도 401 이라 콘솔에서 새 키를 받아야 지도가 뜬다.
 * - 정리: 인증이 실패하면 SDK 가 스스로를 해체해 destroy() 가 TypeError 를 던진다.
 *   이 오류가 React 언마운트 정리에서 새면 페이지 전체가 global-error 로 바뀌므로 여기서 삼킨다.
 */

/** 이미 주입된 SDK 스크립트를 찾는 선택자 (naverMapScriptUrl 의 주소와 맞아야 함) */
export const NAVER_MAP_SCRIPT_SELECTOR = 'script[src*="map.naver.com/openapi/v3/maps.js"]';

export function naverMapScriptUrl(keyId: string, language: string): string {
  return (
    'https://oapi.map.naver.com/openapi/v3/maps.js' +
    `?ncpKeyId=${encodeURIComponent(keyId)}&language=${encodeURIComponent(language)}`
  );
}

export function destroyMapSafely(map: { destroy: () => void }): void {
  try {
    map.destroy();
  } catch (err) {
    // 지도 하나 정리에 실패해도 페이지 이동은 계속되어야 한다.
    console.warn('[NaverMap] 지도 정리 중 SDK 오류(무시함):', err);
  }
}
