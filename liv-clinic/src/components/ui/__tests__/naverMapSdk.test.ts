/**
 * 네이버 지도 SDK 경계 — 2026-11-27 「일시적인 오류가 발생했습니다」 사고.
 *
 * 옛 AI NAVER API 지도 키가 2026-06-25 종료되어 인증이 실패하면 SDK 가 스스로를 해체한다
 * (window.naver.maps 가 사라짐). 그 뒤 지도가 있는 페이지(홈·오시는 길·상담)에서 다른 메뉴로
 * 이동하면 언마운트 정리의 map.destroy() 가 SDK 안에서 TypeError 를 던졌고, 이 오류가
 * React 를 타고 최상위 global-error 화면까지 올라가 페이지 전체를 가렸다.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  destroyMapSafely,
  naverMapScriptUrl,
  NAVER_MAP_SCRIPT_SELECTOR,
} from '../naverMapSdk';

describe('destroyMapSafely', () => {
  it('SDK 의 destroy() 가 던져도 밖으로 오류를 내보내지 않는다', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const brokenMap = {
      destroy: () => {
        throw new TypeError("Cannot read properties of null (reading 'isArray')");
      },
    };

    expect(() => destroyMapSafely(brokenMap)).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('정상 지도는 destroy() 를 한 번 부른다', () => {
    const destroy = vi.fn();
    destroyMapSafely({ destroy });
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});

describe('naverMapScriptUrl', () => {
  it('신규 NCP Maps 형식(oapi 호스트 + ncpKeyId)으로 만든다', () => {
    expect(naverMapScriptUrl('abc123', 'ko')).toBe(
      'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=abc123&language=ko',
    );
  });

  it('키 값은 URL 인코딩한다', () => {
    expect(naverMapScriptUrl('a b&c', 'en')).toContain('ncpKeyId=a%20b%26c');
  });

  it('이미 주입된 스크립트를 찾는 선택자가 새 주소와 맞는다', () => {
    const src = naverMapScriptUrl('abc123', 'ko');
    const needle = NAVER_MAP_SCRIPT_SELECTOR.match(/src\*="([^"]+)"/)?.[1];
    expect(needle).toBeTruthy();
    expect(src).toContain(needle);
  });
});
