/**
 * EventHero 「크게 보기」 새 창 링크 테스트.
 *
 * 환경은 `node`(jsdom 없음)라 react-dom/server 로 정적 마크업을 만들어 검사한다.
 * next-intl 은 실제 ko 메시지를 읽는 얇은 목으로 대체해 라벨 문구가 진짜 번역 키에서 오는지 본다.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentProps } from 'react';

vi.mock('next-intl', async () => {
  const { default: ko } = await import('@/messages/ko.json');
  const lookup = (obj: unknown, path: string): string => {
    const value = path.split('.').reduce<unknown>((acc, part) => {
      if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part];
      return undefined;
    }, obj);
    if (typeof value !== 'string') throw new Error(`missing message: ${path}`);
    return value;
  };
  return {
    useTranslations: (namespace: string) => (key: string, values?: Record<string, string>) =>
      lookup(ko, `${namespace}.${key}`).replace(/\{(\w+)\}/g, (_, name: string) => values?.[name] ?? ''),
    useLocale: () => 'ko',
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ initial, animate, transition, whileInView, viewport, exit, ...rest }: Record<string, unknown>) => {
      void initial; void animate; void transition; void whileInView; void viewport; void exit;
      return <div {...(rest as ComponentProps<'div'>)} />;
    },
  },
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, width, height, className }: { src: string; alt: string; width: number; height: number; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- 테스트 목: next/image 를 평범한 img 로 대체
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}));

vi.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...rest }: { href: string; children?: React.ReactNode } & ComponentProps<'a'>) => (
    <a href={`/ko${href}`} {...rest}>{children}</a>
  ),
}));

import EventHero from '../EventHero';

const baseProps = {
  imageSrc: 'https://example.supabase.co/storage/v1/object/public/events/oct/poster.webp',
  imageAlt: '10월 프로모션',
  status: 'active' as const,
  isEnded: false,
};

function render(props: Partial<ComponentProps<typeof EventHero>> = {}) {
  return renderToStaticMarkup(<EventHero {...baseProps} {...props} />);
}

describe('EventHero 크게 보기 링크', () => {
  it('zoomHref 가 있으면 포스터가 새 탭 링크가 된다', () => {
    const html = render({ zoomHref: '/events/2026-10-promotion/poster' });
    expect(html).toContain('<a ');
    expect(html).toContain('href="/ko/events/2026-10-promotion/poster"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener"');
  });

  it('링크의 접근 가능한 이름은 common.viewLarger 에 이벤트 제목을 넣은 문구다', () => {
    const html = render({ zoomHref: '/events/2026-10-promotion/poster' });
    expect(html).toContain('aria-label="10월 프로모션 확대 보기"');
  });

  it('「크게 보기」 배지가 항상 보인다(호버 없는 모바일 포함)', () => {
    const html = render({ zoomHref: '/events/2026-10-promotion/poster' });
    expect(html).toContain('크게 보기');
  });

  it('zoomHref 가 없으면 링크도 배지도 없다(기존 동작)', () => {
    const html = render();
    expect(html).not.toContain('<a ');
    expect(html).not.toContain('크게 보기');
    expect(html).toContain('<img ');
  });

  it('포스터가 플레이스홀더면 zoomHref 가 있어도 링크를 만들지 않는다', () => {
    const html = render({ imageSrc: '/images/placeholder-event.jpg', zoomHref: '/events/x/poster' });
    expect(html).not.toContain('<a ');
    expect(html).not.toContain('크게 보기');
  });

  it('상태 배지는 링크 유무와 관계없이 그대로 나온다', () => {
    expect(render({ zoomHref: '/events/x/poster' })).toContain('진행중');
    expect(render()).toContain('진행중');
  });
});
