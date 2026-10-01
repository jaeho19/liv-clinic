/**
 * 연락 채널 아이콘 (스펙 2026-10-01 §4.2, 결정 ⑩).
 * WhatsApp·LINE 그림은 사이트 오른쪽 단추(FloatingCTA)에 있던 것을 이 파일로 옮긴 것이다 —
 * 모양이 달라지면 안 되므로 path 문자열을 옮기기 전 값의 해시와 비교한다.
 * 환경은 `node`(jsdom 없음)라 react-dom/server 로 정적 마크업을 만들어 검사한다.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

vi.mock('next/image', () => ({
  default: (props: { src: string; alt: string; width: number; height: number; className?: string; 'aria-hidden'?: 'true' }) => (
    // eslint-disable-next-line @next/next/no-img-element -- 테스트 목: next/image 를 평범한 img 로 대체
    <img src={props.src} alt={props.alt} width={props.width} height={props.height} className={props.className} aria-hidden={props['aria-hidden']} />
  ),
}));

import ChannelIcon, { LINE_ICON_PATH, WECHAT_ICON_IMAGE, WHATSAPP_ICON_PATH } from '../ChannelIcon';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const SRC_DIR = path.resolve(__dirname, '..', '..', '..');
const PUBLIC_DIR = path.resolve(SRC_DIR, '..', 'public');

describe('ChannelIcon', () => {
  it.each(['whatsapp', 'line', 'email'])('%s: svg 아이콘을 그리고 aria-hidden 이다', (channel) => {
    const html = renderToStaticMarkup(<ChannelIcon channel={channel} className="w-5 h-5" />);
    expect(html.startsWith('<svg')).toBe(true);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('class="w-5 h-5"');
  });

  it('wechat: 사이트 오른쪽 단추와 같은 그림 파일을 쓰고 aria-hidden 이다', () => {
    const html = renderToStaticMarkup(<ChannelIcon channel="wechat" className="w-5 h-5" />);
    expect(html).toContain(`src="${WECHAT_ICON_IMAGE}"`);
    expect(html).toContain('alt=""');
    expect(html).toContain('aria-hidden="true"');
    expect(fs.existsSync(path.join(PUBLIC_DIR, WECHAT_ICON_IMAGE))).toBe(true);
  });

  it('whatsapp·line 은 currentColor 로 칠하고, email 은 선으로 그린다', () => {
    expect(renderToStaticMarkup(<ChannelIcon channel="whatsapp" />)).toContain('fill="currentColor"');
    expect(renderToStaticMarkup(<ChannelIcon channel="line" />)).toContain('fill="currentColor"');
    const email = renderToStaticMarkup(<ChannelIcon channel="email" />);
    expect(email).toContain('fill="none"');
    expect(email).toContain('stroke="currentColor"');
  });

  it('알 수 없는 채널은 아무것도 그리지 않는다', () => {
    expect(renderToStaticMarkup(<ChannelIcon channel="telegram" />)).toBe('');
    expect(renderToStaticMarkup(<ChannelIcon channel="" />)).toBe('');
  });

  it('WhatsApp·LINE 그림은 FloatingCTA 에 있던 것과 글자 하나까지 같다', () => {
    expect(WHATSAPP_ICON_PATH).toHaveLength(1104);
    expect(sha256(WHATSAPP_ICON_PATH)).toBe('281335ac991e0f1a4f6ff8da3b54714ad89f3e3f0e0cebd16abeb2e73ffa5bf4');
    expect(LINE_ICON_PATH).toHaveLength(1066);
    expect(sha256(LINE_ICON_PATH)).toBe('0669b7b2d3145af41634787e2e9684ece85843e381b840ca74d393c6260cbfaa');
  });

  it('FloatingCTA 는 그림을 따로 갖지 않고 ChannelIcon 을 가져다 쓴다', () => {
    const source = fs.readFileSync(path.join(SRC_DIR, 'components', 'layout', 'FloatingCTA.tsx'), 'utf8');
    expect(source).toContain("import ChannelIcon from '@/components/ui/ChannelIcon'");
    expect(source).toContain('<ChannelIcon channel="line" className="w-5 h-5" />');
    expect(source).toContain('<ChannelIcon channel="whatsapp" className="w-5 h-5" />');
    expect(source).not.toContain('M19.365 9.863');
    expect(source).not.toContain('M17.472 14.382');
  });
});
