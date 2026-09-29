/**
 * ImageUploader 버튼이 폼 제출 버튼이 되지 않는지 확인한다.
 *
 * ImageUploader 는 EventForm·PopupForm·BeforeAfterForm 의 <form> 안에 들어간다.
 * type 이 없는 <button> 은 기본값이 submit 이라, 이미지의 ✕ 를 누르면 폼이 저장되고 목록으로 이동했다
 * (2026-09-29 10월 프로모션 포스터 교체 중 발생 — Storage 파일은 지워졌는데 DB 는 옛 주소를 다시 저장).
 *
 * 환경은 `node`(jsdom 없음)라 react-dom/server 로 정적 마크업을 만들어 검사한다.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentProps } from 'react';

vi.mock('@/lib/supabase-browser', () => ({
  createClient: () => ({ storage: { from: () => ({}) } }),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- 테스트 목: next/image 를 평범한 img 로 대체
    <img src={src} alt={alt} />
  ),
}));

import ImageUploader from '../ImageUploader';

const POSTER_URL =
  'https://example.supabase.co/storage/v1/object/public/events/2026-10-promotion/1790596979180-0-z0pzps.webp';

const buttonTags = (markup: string): string[] => markup.match(/<button\b[^>]*>/g) ?? [];

function render(props: ComponentProps<typeof ImageUploader>) {
  return renderToStaticMarkup(<ImageUploader {...props} />);
}

describe('ImageUploader 버튼은 감싼 폼을 제출하지 않는다', () => {
  it('등록된 이미지의 ✕(삭제) 버튼은 type="button" 이다', () => {
    const markup = render({
      bucket: 'events',
      folder: '2026-10-promotion',
      value: POSTER_URL,
      onChange: () => {},
    });

    const buttons = buttonTags(markup);
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toContain('type="button"');
  });

  it.each([
    ['단일 · 이미지 있음', { value: POSTER_URL, onChange: () => {} }],
    ['단일 · 이미지 없음', { value: null, onChange: () => {} }],
    ['여러 장', { multiple: true as const, onUploadMany: () => {} }],
  ])('%s: 렌더된 모든 버튼이 type="button" 이다', (_, modeProps) => {
    const markup = render({ bucket: 'events', folder: '2026-10-promotion', ...modeProps });

    for (const tag of buttonTags(markup)) {
      expect(tag).toContain('type="button"');
    }
  });
});
