import { describe, it, expect } from 'vitest';
import { buildContactText, buildReplyText, buildRootText } from '../slackRelay';

describe('buildReplyText — 방문자 메시지', () => {
  it('한국어 번역을 먼저 보여주고 원문을 인용으로 붙인다', () => {
    const text = buildReplyText({
      sender: 'visitor',
      senderLabel: null,
      visitorLocale: 'en',
      originalText: 'How much is Ulthera?',
      translatedText: '울쎄라 얼마인가요?',
    });
    expect(text).toBe('울쎄라 얼마인가요?\n> _원문:_ How much is Ulthera?');
  });

  it('번역이 없으면 원문만 보여준다', () => {
    const text = buildReplyText({
      sender: 'visitor',
      senderLabel: null,
      visitorLocale: 'en',
      originalText: 'How much is Ulthera?',
      translatedText: null,
    });
    expect(text).toBe('How much is Ulthera?');
  });

  it('번역문이 원문과 같으면 중복 노출하지 않는다', () => {
    const text = buildReplyText({
      sender: 'visitor',
      senderLabel: null,
      visitorLocale: 'en',
      originalText: '😊',
      translatedText: '😊',
    });
    expect(text).toBe('😊');
  });

  it('방문자 입력의 Slack 마크업을 이스케이프한다', () => {
    const text = buildReplyText({
      sender: 'visitor',
      senderLabel: null,
      visitorLocale: 'en',
      originalText: '<!channel> hi',
      translatedText: null,
    });
    expect(text).not.toContain('<!channel>');
    expect(text).toBe('&lt;!channel&gt; hi');
  });
});

describe('buildReplyText — 어드민 UI 답장 미러링', () => {
  it('관리자 화면 답장임을 머리말로 표시한다', () => {
    const text = buildReplyText({
      sender: 'operator',
      senderLabel: 'staff@livps.co.kr',
      visitorLocale: 'ja',
      originalText: '울쎄라는 30만원입니다.',
      translatedText: 'ウルセラは30万ウォンです。',
    });
    expect(text).toBe(
      '↩️ _관리자 화면 답장 — staff@livps.co.kr_\n' +
        '울쎄라는 30만원입니다.\n' +
        '> _ja 전달:_ ウルセラは30万ウォンです。'
    );
  });

  it('작성자 라벨이 없어도 머리말은 유지한다', () => {
    const text = buildReplyText({
      sender: 'operator',
      senderLabel: null,
      visitorLocale: 'ja',
      originalText: '안녕하세요',
      translatedText: null,
    });
    expect(text).toBe('↩️ _관리자 화면 답장_\n안녕하세요');
  });

  it('한국어 원문을 먼저, 방문자에게 나간 번역을 인용으로 보여준다 (방문자와 순서 반대)', () => {
    const text = buildReplyText({
      sender: 'operator',
      senderLabel: null,
      visitorLocale: 'en',
      originalText: '예약 도와드릴까요?',
      translatedText: 'Shall I help you book?',
    });
    const lines = text.split('\n');
    expect(lines[1]).toBe('예약 도와드릴까요?');
    expect(lines[2]).toBe('> _en 전달:_ Shall I help you book?');
  });
});

describe('buildRootText', () => {
  const base = {
    sessionId: '11111111-2222-3333-4444-555555555555',
    visitorName: 'John',
    visitorLocale: 'en',
    visitorEmail: 'john@example.com',
    originalText: 'Hello',
    translatedText: '안녕하세요',
  };

  it('방문자가 스레드를 열면 새 채팅 문의로 표시한다', () => {
    const text = buildRootText({ ...base, sender: 'visitor', senderLabel: null });
    expect(text).toContain('🇬🇧 *새 채팅 문의* — John (en)');
    expect(text).toContain('✉️ john@example.com');
    expect(text).toContain('안녕하세요');
    expect(text).toContain('> _원문:_ Hello');
    expect(text).toContain('_이 스레드에 답글을 달면 방문자에게 번역되어 전달됩니다._');
  });

  it('운영자가 먼저 말을 걸어 스레드를 열 수도 있다', () => {
    const text = buildRootText({
      ...base,
      sender: 'operator',
      senderLabel: 'staff@livps.co.kr',
      originalText: '무엇을 도와드릴까요?',
      translatedText: 'How can I help you?',
    });
    expect(text).toContain('*채팅 세션* — John (en)');
    expect(text).toContain('↩️ _관리자 화면 답장 — staff@livps.co.kr_');
    expect(text).toContain('무엇을 도와드릴까요?');
  });

  it('이름과 이메일이 없으면 익명으로 표시하고 이메일 줄을 생략한다', () => {
    const text = buildRootText({
      ...base,
      sender: 'visitor',
      senderLabel: null,
      visitorName: null,
      visitorEmail: null,
    });
    expect(text).toContain('— 익명 (en)');
    expect(text).not.toContain('✉️');
  });

  it('알 수 없는 로케일이면 기본 국기로 대체한다', () => {
    const text = buildRootText({
      ...base,
      sender: 'visitor',
      senderLabel: null,
      visitorLocale: 'xx',
    });
    expect(text).toContain('🌐 *새 채팅 문의*');
  });
});

describe('buildContactText — 방문자 연락처 릴레이', () => {
  it('채널 라벨과 핸들, 스태프 안내 문구를 포함한다', () => {
    const text = buildContactText({
      channelLabel: 'WhatsApp',
      handle: '+82 10-1234-5678',
      adminUrl: null,
    });
    expect(text).toBe(
      '📱 *방문자가 연락처를 남겼습니다* — WhatsApp: +82 10-1234-5678\n' +
        '_근무 시작 후 이 연락처로 먼저 연락해 주세요._'
    );
  });

  it('핸들의 Slack 마크업을 이스케이프한다', () => {
    const text = buildContactText({
      channelLabel: 'WeChat',
      handle: '<!channel>id',
      adminUrl: null,
    });
    expect(text).not.toContain('<!channel>');
    expect(text).toContain('&lt;!channel&gt;id');
  });

  it('스레드 없이 단독 게시될 때만 어드민 링크를 붙인다', () => {
    const text = buildContactText({
      channelLabel: 'LINE',
      handle: 'my_line_id',
      adminUrl: 'https://example.com/admin/chat/abc',
    });
    expect(text).toContain('🔗 <https://example.com/admin/chat/abc|관리자 화면에서 열기>');
  });
});
