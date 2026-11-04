/**
 * 팝업을 띄우지 않는 페이지 — 경로 판정과 PopupManager 배선.
 *
 * 렌더 환경이 없으므로(리포 관례: eventPosterViewer.presence.test.ts) 배선은 소스를 직접 읽어 고정한다.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { isPopupHiddenPath } from '../popupRoutes';

describe('isPopupHiddenPath', () => {
  it.each([
    '/events',
    '/events/',
    '/events/first-visit',
    '/events/2026-11-promotion',
    '/events/리브-new-스킨-프로그램-이벤트',
    '/events/%EC%9D%B4%EB%B2%A4%ED%8A%B8',
  ])('이벤트 페이지 %s 에서는 숨긴다', (pathname) => {
    expect(isPopupHiddenPath(pathname)).toBe(true);
  });

  it.each(['/', '/about', '/pricing', '/laser/events', '/eventsfoo', '/events-guide'])(
    '다른 페이지 %s 에서는 그대로 띄운다',
    (pathname) => {
      expect(isPopupHiddenPath(pathname)).toBe(false);
    }
  );
});

describe('PopupManager 배선', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '..', '..', 'components', 'layout', 'PopupManager.tsx'),
    'utf8'
  );

  it('로케일이 빠진 경로를 주는 @/i18n/routing 의 usePathname 을 쓴다', () => {
    // next/navigation 의 usePathname 은 /ko/events 를 그대로 줘서 판정이 항상 false 가 된다
    expect(source).toMatch(/import \{[^}]*\busePathname\b[^}]*\} from '@\/i18n\/routing'/);
    expect(source).not.toMatch(/from 'next\/navigation'/);
  });

  it('숨김 페이지면 모달을 그리지 않는다', () => {
    expect(source).toMatch(/isPopupHiddenPath\(pathname\)[^\n]*\) return null;/);
  });
});
