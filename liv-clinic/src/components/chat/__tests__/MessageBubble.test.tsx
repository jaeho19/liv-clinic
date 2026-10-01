/**
 * 채팅 말풍선의 링크 누르기 (스펙 2026-10-01 §4.10).
 * 환경은 `node`(jsdom 없음)라 react-dom/server 로 정적 마크업을 만들어 검사한다.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ChatMessage } from '@/lib/chat/chatApi';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import MessageBubble from '../MessageBubble';

const URL = 'https://liv-clinic.net/en/events/2026-10-promotion';

function message(over: Partial<ChatMessage>): ChatMessage {
  return {
    id: 'm1',
    session_id: 's1',
    sender: 'operator',
    original_text: '',
    original_lang: 'ko',
    translated_text: null,
    translated_lang: null,
    translation_status: 'success',
    translation_error: null,
    created_at: '2026-10-05T03:00:00Z',
    source: 'app',
    ...over,
  };
}

const render = (m: ChatMessage) => renderToStaticMarkup(<MessageBubble message={m} visitorLocale="en" />);

describe('MessageBubble — 링크', () => {
  it('자동 안내의 주소는 새 창으로 여는 링크다', () => {
    const html = render(
      message({
        source: 'auto',
        original_text: `가격은 상담 직원이 확인한 뒤 안내드리겠습니다.\n${URL}`,
        translated_text: `Our consultants will confirm the exact price.\n${URL}`,
        translated_lang: 'en',
      })
    );
    expect(html).toContain(`<a href="${URL}" target="_blank" rel="noopener noreferrer"`);
    expect(html).toContain('Our consultants will confirm the exact price.');
  });

  it('직원이 붙여 넣은 주소도 링크다', () => {
    const html = render(message({ source: 'slack', original_text: `여기를 보세요 ${URL}`, translated_text: `See ${URL}` }));
    expect(html).toContain(`<a href="${URL}"`);
  });

  it('주소가 없는 직원 글에는 링크가 없다', () => {
    expect(render(message({ original_text: '안녕하세요', translated_text: 'Hello' }))).not.toContain('<a ');
  });

  it('손님 자신의 글은 주소가 있어도 글자 그대로다', () => {
    const html = render(message({ sender: 'visitor', original_lang: 'en', original_text: `is this right? ${URL}` }));
    expect(html).not.toContain('<a ');
    expect(html).toContain(URL);
  });

  it('시스템 메시지(노란 띠)도 글자 그대로다', () => {
    const html = render(message({ sender: 'system', original_text: `Email contact saved. ${URL}`, translation_status: 'skipped' }));
    expect(html).not.toContain('<a ');
  });

  it('javascript: 같은 주소는 링크로 만들지 않는다', () => {
    const html = render(message({ original_text: 'javascript:alert(1)', translated_text: 'javascript:alert(1)' }));
    expect(html).not.toContain('<a ');
  });
});
