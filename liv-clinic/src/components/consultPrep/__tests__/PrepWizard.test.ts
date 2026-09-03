/**
 * PrepWizard 접근성 회귀 테스트.
 *
 * 이 스위트는 `environment: 'node'` 이고 jsdom / testing-library 가 없어(package.json 은
 * 이번 수정 범위 밖) 컴포넌트를 렌더할 수 없다. 그래서 소스를 직접 읽어 검사한다.
 * 검사 대상은 렌더 결과가 아니라 "2단계 textarea 에 접근 가능한 이름이 붙어 있는가"라는
 * 한 가지 사실이고, 그 사실은 소스에서 그대로 읽힌다.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import koMessages from '@/messages/ko.json';
import enMessages from '@/messages/en.json';
import jaMessages from '@/messages/ja.json';
import zhMessages from '@/messages/zh.json';

const source = readFileSync(new URL('../PrepWizard.tsx', import.meta.url), 'utf8');

/** 여는 태그 `<textarea ... />` 부분만 잘라낸다. */
function textareaTags(): string[] {
  const tags: string[] = [];
  let from = 0;
  for (;;) {
    const start = source.indexOf('<textarea', from);
    if (start === -1) break;
    const end = source.indexOf('/>', start);
    expect(end, 'textarea 태그가 닫히지 않았다').toBeGreaterThan(start);
    tags.push(source.slice(start, end));
    from = end;
  }
  return tags;
}

describe('PrepWizard 접근성', () => {
  it('자유 서술 textarea 가 하나 있다', () => {
    expect(textareaTags()).toHaveLength(1);
  });

  // 리뷰(2026-09-03) Important 4: 이 기능의 필수 입력인데 <label> 도 aria-label 도 없이
  // placeholder 만 있었다. placeholder 는 접근 가능한 이름이 아니다.
  it('textarea 에 접근 가능한 이름(aria-label)이 붙어 있다', () => {
    const [tag] = textareaTags();
    const hasName =
      /\baria-label(?:ledby)?\s*=/.test(tag) || /\bid\s*=/.test(tag);
    expect(hasName, 'textarea 에 aria-label / aria-labelledby / label 연결이 없다').toBe(true);
    // 새 i18n 키를 만들지 않고 step2Title(질문 문장)을 그대로 쓴다.
    expect(tag).toMatch(/aria-label=\{t\('step2Title'\)\}/);
  });

  it('placeholder 만으로 이름을 대신하지 않는다', () => {
    const [tag] = textareaTags();
    expect(tag).toMatch(/placeholder=/);
    expect(tag).toMatch(/aria-label=/);
  });

  it('aria-label 이 가리키는 step2Title 키가 4개 언어에 모두 있다', () => {
    for (const [locale, messages] of Object.entries({
      ko: koMessages,
      en: enMessages,
      ja: jaMessages,
      zh: zhMessages,
    })) {
      const value = (messages as { consultPrep?: Record<string, string> }).consultPrep?.step2Title;
      expect(value, `${locale}.json 에 consultPrep.step2Title 이 없다`).toBeTruthy();
    }
  });
});
