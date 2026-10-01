/**
 * 병원 WeChat QR 표시 테스트.
 *
 * 2026-10-01: 사이트에 걸려 있던 QR 포스터가 예전 QR(다른 u.wechat.com 주소)이었다.
 * 원장님이 준 최신 QR(`wechat-qr-code.png`, QR만 있는 그림)로 바꾸면서, 포스터에 인쇄돼 있던
 * 아이디가 사라지므로 화면이 아이디를 글자로 보여 줘야 한다.
 *
 * 환경은 `node`(jsdom 없음)라 react-dom/server 로 정적 마크업을 만들어 검사한다.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import type { ComponentProps, ReactNode } from 'react';

vi.mock('next-intl', async () => {
  const { default: zh } = await import('@/messages/zh.json');
  return {
    useTranslations: (namespace: string) => (key: string) => {
      const value = (zh as unknown as Record<string, Record<string, unknown>>)[namespace]?.[key];
      if (typeof value !== 'string') throw new Error(`missing message: ${namespace}.${key}`);
      return value;
    },
  };
});

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ initial, animate, exit, transition, ...rest }: Record<string, unknown>) => {
      void initial; void animate; void exit; void transition;
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

import WeChatQRModal from '../WeChatQRModal';
import WeChatInfo from '../../sections/WeChatInfo';

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'public');

/** 마크업에서 img 의 src 를 전부 뽑는다. */
function imageSources(html: string): string[] {
  return [...html.matchAll(/<img[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
}

describe('WeChatQRModal — QR 크게 보기', () => {
  const html = renderToStaticMarkup(<WeChatQRModal open onClose={() => {}} />);

  it('최신 QR 이미지를 보여 준다 (예전 포스터가 아니다)', () => {
    expect(imageSources(html)).toEqual(['/images/wechat-qr-code.png']);
  });

  it('보여 주는 이미지 파일이 public 폴더에 실제로 있다', () => {
    for (const src of imageSources(html)) {
      expect(fs.existsSync(path.join(PUBLIC_DIR, src))).toBe(true);
    }
  });

  it('QR만 있는 그림이므로 병원 WeChat 아이디를 글자로 함께 보여 준다', () => {
    expect(html).toContain('livps0414');
  });

  it('닫혀 있으면 아무것도 그리지 않는다', () => {
    expect(renderToStaticMarkup(<WeChatQRModal open={false} onClose={() => {}} />)).toBe('');
  });
});

describe('WeChatInfo — /zh/wechat 안내 페이지', () => {
  const html = renderToStaticMarkup(<WeChatInfo />);

  it('크게 보기와 같은 최신 QR 이미지를 보여 준다', () => {
    expect(imageSources(html)).toEqual(['/images/wechat-qr-code.png']);
  });

  it('아이디와 복사 버튼을 보여 준다', () => {
    expect(html).toContain('livps0414');
    expect(html).toContain('复制');
  });
});
