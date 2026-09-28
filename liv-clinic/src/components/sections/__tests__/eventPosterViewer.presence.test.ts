/**
 * 포스터 1장 이벤트 「크게 보기」 새 창 — 배선 검사.
 *
 * 렌더 환경이 없으므로(리포 관례: PrepWizard.test.ts) 소스와 메시지 파일을 직접 읽어
 * "갤러리 0장일 때만 링크", "포스터 페이지는 색인 제외", "팝업 링크 입력은 상대 경로 허용",
 * "쓰는 번역 키가 11개 로케일에 모두 있음"의 네 가지 사실을 고정한다.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(__dirname, '..', '..', '..');
const read = (...segments: string[]) => fs.readFileSync(path.join(SRC, ...segments), 'utf8');

const LOCALES = ['ko', 'en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'];

describe('EventDetailClient → EventHero 배선', () => {
  const source = read('app', '[locale]', 'events', '[eventId]', 'EventDetailClient.tsx');

  it('현재 로케일 갤러리가 0장일 때만 zoomHref 를 넘긴다', () => {
    expect(source).toMatch(/zoomHref=\{galleryImages\.length === 0 \?/);
  });

  it('새 창 경로는 포스터 전용 라우트다', () => {
    expect(source).toMatch(/`\/events\/\$\{event\.id\}\/poster`/);
  });
});

describe('포스터 전용 페이지', () => {
  const pagePath = path.join(SRC, 'app', '(viewer)', '[locale]', 'events', '[eventId]', 'poster', 'page.tsx');

  it('헤더·푸터·팝업이 없는 (viewer) 루트 레이아웃 아래에 있다', () => {
    expect(fs.existsSync(pagePath)).toBe(true);
    // 루트 레이아웃은 locale 파라미터를 받아야 하므로 [locale] 아래에 둔다
    const layout = read('app', '(viewer)', '[locale]', 'layout.tsx');
    expect(layout).toMatch(/<html/);
    expect(layout).not.toMatch(/Header|Footer|PopupManager|ChatWidget|ClientSideWidgets/);
  });

  it('검색 색인에서 제외된다', () => {
    const page = fs.readFileSync(pagePath, 'utf8');
    expect(page).toMatch(/robots:\s*\{\s*index:\s*false/);
  });

  it('원본 이미지를 next/image 축소 없이 그대로 쓴다', () => {
    const page = fs.readFileSync(pagePath, 'utf8');
    expect(page).not.toMatch(/from 'next\/image'/);
    expect(page).toMatch(/<img\b/);
  });
});

describe('팝업 관리 폼 링크 입력', () => {
  // 041 트리거는 link_url 에 상대 경로(/ko/events/<slug>)를 넣는데 type="url" 은 절대 URL 만 통과시켜
  // 운영자가 다른 항목을 고치려면 링크를 지워야 했다(2026-09-28 10월 팝업 link_url 소실).
  it('type="url" 이 아니어서 상대 경로를 받는다', () => {
    const source = read('components', 'admin', 'PopupForm.tsx');
    const start = source.indexOf('value={form.link_url}');
    expect(start).toBeGreaterThan(-1);
    const tagStart = source.lastIndexOf('<input', start);
    const tag = source.slice(tagStart, source.indexOf('/>', start));
    expect(tag).not.toMatch(/type="url"/);
    expect(tag).toMatch(/type="text"/);
    expect(tag).toMatch(/inputMode="url"/);
  });
});

describe('의존 번역 키', () => {
  for (const locale of LOCALES) {
    it(`${locale}: events.viewLarger · common.viewLarger({label}) · common.close 가 있다`, () => {
      const messages = JSON.parse(read('messages', `${locale}.json`));
      expect(messages.events?.viewLarger, 'events.viewLarger').toBeTruthy();
      expect(messages.common?.viewLarger, 'common.viewLarger').toContain('{label}');
      expect(messages.common?.close, 'common.close').toBeTruthy();
    });
  }
});
