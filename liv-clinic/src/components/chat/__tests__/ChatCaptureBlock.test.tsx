/**
 * 연락처 카드 (스펙 2026-10-01 §4.2, 결정 ⑦·⑩).
 * 환경은 `node`(jsdom 없음)라 react-dom/server 로 처음 그려지는 모습(정적 마크업)을 검사한다.
 * 단추를 눌렀을 때의 동작(펼치기·복사·저장)은 브라우저 확인 단계에서 본다.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentProps, ReactNode } from 'react';

const state = vi.hoisted(() => ({ locale: 'en' as 'en' | 'ja' | 'zh' }));

vi.mock('next-intl', async () => {
  const messages = {
    en: (await import('@/messages/en.json')).default,
    ja: (await import('@/messages/ja.json')).default,
    zh: (await import('@/messages/zh.json')).default,
  } as unknown as Record<string, Record<string, Record<string, unknown>>>;
  return {
    useTranslations: (namespace: string) => (key: string, values?: Record<string, string>) => {
      const value = messages[state.locale][namespace]?.[key];
      if (typeof value !== 'string') throw new Error(`missing message: ${state.locale}.${namespace}.${key}`);
      return value.replace(/\{(\w+)\}/g, (_m, name: string) => values?.[name] ?? `{${name}}`);
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
  default: (props: { src: string; alt: string; width: number; height: number; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- 테스트 목: next/image 를 평범한 img 로 대체
    <img src={props.src} alt={props.alt} width={props.width} height={props.height} className={props.className} />
  ),
}));

vi.mock('@/lib/analytics-events', () => ({
  trackChatCaptureShown: vi.fn(),
  trackChatCaptureMessengerClick: vi.fn(),
  trackChatContactSaved: vi.fn(),
}));

import ChatCaptureBlock from '../ChatCaptureBlock';

const SESSION_ID = 'a1b2c3d4-0000-0000-0000-000000000000';

function render(locale: 'en' | 'ja' | 'zh', over: Partial<ComponentProps<typeof ChatCaptureBlock>> = {}) {
  state.locale = locale;
  return renderToStaticMarkup(
    <ChatCaptureBlock
      locale={locale}
      sessionId={SESSION_ID}
      sessionToken="11111111-2222-3333-4444-555555555555"
      businessHours
      nextOpenAt={null}
      onDismiss={() => {}}
      onSaved={() => {}}
      {...over}
    />
  );
}

/** "병원으로 바로 연락하기" 단추 묶음(role=group) 안의 단추 이름을 순서대로. */
function tileLabels(html: string): string[] {
  const group = /<div[^>]*role="group"[^>]*>(.*?)<\/div>/.exec(html)?.[1] ?? '';
  return [...group.matchAll(/<span>([^<]+)<\/span>/g)].map((m) => m[1]);
}
/** "연락처 남기기" 칩(role=radio)의 이름과 선택 여부. */
function chips(html: string): Array<{ label: string; checked: boolean }> {
  return [...html.matchAll(/<button[^>]*role="radio"[^>]*aria-checked="(true|false)"[^>]*>(.*?)<\/button>/g)].map((m) => ({
    label: m[2].replace(/<[^>]+>/g, ''),
    checked: m[1] === 'true',
  }));
}

describe('ChatCaptureBlock — 병원으로 바로 연락하기 단추 네 개', () => {
  it('영어 화면: WhatsApp · WeChat · LINE · Email 순서', () => {
    expect(tileLabels(render('en'))).toEqual(['WhatsApp', 'WeChat', 'LINE', 'Email']);
  });

  it('일본어 화면은 LINE, 중국어 화면은 WeChat 이 맨 앞 — 이메일은 늘 맨 뒤', () => {
    expect(tileLabels(render('ja'))).toEqual(['LINE', 'WhatsApp', 'WeChat', 'Email']);
    expect(tileLabels(render('zh'))).toEqual(['WeChat', 'WhatsApp', 'LINE', 'Email']);
  });

  it('WhatsApp·LINE 은 병원 계정을 새 창으로 여는 링크다', () => {
    const html = render('en');
    expect(html).toContain('href="https://wa.me/821068882773?text=');
    expect(html).toContain(encodeURIComponent('(code: A1B2C3D4)'));
    expect(html).toContain('href="https://line.me/ti/p/VJYu9BSnsX"');
    expect(html).not.toContain('weixin://');
  });

  it('단추마다 아이콘이 있고 꾸밈(aria-hidden)이다', () => {
    const group = /<div[^>]*role="group"[^>]*>(.*?)<\/div>/.exec(render('en'))?.[1] ?? '';
    expect((group.match(/<svg/g) ?? []).length).toBe(3); // WhatsApp·LINE·Email
    expect(group).toContain('src="/images/wechat-icon.png"');
  });
});

describe('ChatCaptureBlock — 병원 WeChat QR·아이디, 병원 이메일', () => {
  it('중국어 화면은 WeChat 블록을 펼친 채로 보여 준다 (QR + 아이디 + 복사)', () => {
    const html = render('zh');
    expect(html).toContain('src="/images/wechat-qr-code.png"');
    expect(html).toContain('livps0414');
    expect(html).toContain('微信号');
    expect(html).toContain('复制');
    expect(html).toContain('然后发送代码 #A1B2C3D4。');
  });

  it('다른 화면에서는 눌러야 펼쳐진다 — 처음에는 QR 이 없다', () => {
    expect(render('en')).not.toContain('wechat-qr-code.png');
    expect(render('ja')).not.toContain('wechat-qr-code.png');
  });

  it('병원 이메일 주소는 이메일 단추를 눌러야 보인다', () => {
    for (const locale of ['en', 'ja', 'zh'] as const) {
      const html = render(locale);
      expect(html).not.toContain('mailto:');
      expect(html).not.toContain('jaeho19@gmail.com');
    }
  });
});

describe('ChatCaptureBlock — 연락처 남기기', () => {
  it('칩은 WhatsApp · WeChat · Email — LINE 아이디는 받지 않는다', () => {
    expect(chips(render('en')).map((c) => c.label)).toEqual(['WhatsApp', 'WeChat', 'Email']);
  });

  it('기본 선택: 영어 WhatsApp, 일본어 Email, 중국어 WeChat', () => {
    expect(chips(render('en')).find((c) => c.checked)?.label).toBe('WhatsApp');
    expect(chips(render('ja')).find((c) => c.checked)?.label).toBe('Email');
    expect(chips(render('zh')).find((c) => c.checked)?.label).toBe('WeChat');
  });

  it('입력칸 안내 글자는 고른 채널을 따른다', () => {
    expect(render('en')).toContain('placeholder="WhatsApp number (e.g. +1 234 567 8900)"');
    expect(render('ja')).toContain('placeholder="メールアドレス"');
    expect(render('ja')).toContain('type="email"');
    expect(render('zh')).toContain('placeholder="微信号"');
  });
});

describe('ChatCaptureBlock — 안내 문구', () => {
  it('영업시간 중에는 "기다리지 않으셔도 됩니다"', () => {
    const html = render('en', { businessHours: true });
    expect(html).toContain('You don&#x27;t have to wait here. Leave a contact and we&#x27;ll reach out to you first.');
  });

  it('상담 시간 외에는 복귀 시각(한국 시각 + 손님 현지 시각)', () => {
    const html = render('en', { businessHours: false, nextOpenAt: '2026-10-05T01:00:00Z' });
    expect(html).toContain('(Korea time)');
    expect(html).toContain('Mon 10:00');
    expect(html).not.toContain('have to wait here');
  });

  it('제목·단추 위 안내·코드 안내·개인정보 안내가 있다', () => {
    const html = render('en');
    expect(html).toContain('Don&#x27;t miss our reply');
    expect(html).toContain('Reach us wherever is easiest for you:');
    expect(html).toContain('Mention this code so we can find your chat: #A1B2C3D4');
    expect(html).toContain('We use your contact only to reply to this inquiry.');
  });

  it('단추를 누르기 전에는 "그곳에서 코드를 보내 주세요" 안내와 저장 완료 표시가 없다', () => {
    const html = render('en');
    expect(html).not.toContain('Send us the code');
    expect(html).not.toContain('Saved!');
  });
});
