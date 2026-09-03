import { describe, it, expect, afterEach } from 'vitest';
import {
  buildContactText,
  buildDeliveryFailureText,
  buildEscalationText,
  buildFeedLine,
  buildReplyText,
  buildRoomFirstText,
  buildRoomTopic,
  buildRoomVisitorText,
  buildRootText,
  ROOM_AUTO_ACK_NOTE,
  ROOM_FOOTER,
} from '../slackText';

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

describe('buildRoomFirstText — 방의 첫 메시지', () => {
  const base = {
    receivedAt: '2024-01-01T05:03:00Z',
    visitorLocale: 'vi',
    originalText: 'Xin chào',
    translatedText: '안녕하세요',
  };

  it('전원 멘션·접수 시각·본문·꼬리말 2줄을 붙인다', () => {
    const text = buildRoomFirstText({ ...base, mentionAll: '<@U1> <@U2>' });
    const lines = text.split('\n');
    expect(lines[0]).toBe('🔴 *새 문의* · <@U1> <@U2> · 📥 01/01(월) 14:03 KST');
    expect(lines[1]).toBe('안녕하세요');
    expect(lines[2]).toBe('> _원문:_ Xin chào');
    expect(text.endsWith(`${ROOM_FOOTER}\n${ROOM_AUTO_ACK_NOTE}`)).toBe(true);
  });

  it('멘션 대상이 없어도 구분자가 남지 않는다', () => {
    const text = buildRoomFirstText({ ...base, mentionAll: '' });
    expect(text.split('\n')[0]).toBe('🔴 *새 문의* · 📥 01/01(월) 14:03 KST');
  });
});

describe('buildRoomVisitorText — 손님 후속 메시지', () => {
  const base = {
    receivedAt: '2024-01-01T05:12:00Z',
    visitorLocale: 'vi',
    originalText: 'Thứ Năm được không?',
    translatedText: '목요일 가능한가요?',
  };

  it('담당자만 멘션하고 시각을 붙인다', () => {
    const text = buildRoomVisitorText({ ...base, mention: '<@U1>', reopened: false });
    expect(text.split('\n')[0]).toBe('<@U1> · 14:12 KST');
    expect(text).toContain('목요일 가능한가요?\n> _원문:_ Thứ Năm được không?');
  });

  it('재오픈이면 🔔 머리말을 붙인다', () => {
    const text = buildRoomVisitorText({ ...base, mention: '<@U1> <@U2>', reopened: true });
    expect(text.split('\n')[0]).toBe(
      '🔔 *완료했던 문의에 손님이 다시 말을 걸었습니다* · <@U1> <@U2> · 14:12 KST'
    );
  });
});

describe('buildRoomTopic', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SITE_URL;
  afterEach(() => {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalUrl;
  });

  it('국기·이름·한국어 언어명·참조코드·이메일·관리자 링크를 · 로 잇는다', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://liv-clinic.net/';
    const topic = buildRoomTopic({
      sessionId: '11111111-2222-3333-4444-555555555555',
      visitorName: 'Thu Nguyen',
      visitorLocale: 'vi',
      visitorEmail: 'thu@example.com',
    });
    expect(topic).toBe(
      '🇻🇳 Thu Nguyen · 베트남어 · #11111111 · thu@example.com · <https://liv-clinic.net/admin/chat/11111111-2222-3333-4444-555555555555|관리자 화면에서 열기>'
    );
  });

  it('이름·이메일·사이트 URL이 없으면 해당 조각을 생략하고 익명으로 쓴다', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const topic = buildRoomTopic({
      sessionId: '11111111-2222-3333-4444-555555555555',
      visitorName: null,
      visitorLocale: 'xx',
      visitorEmail: null,
    });
    expect(topic).toBe('🌐 익명 · xx · #11111111');
  });

  it('250자를 넘지 않는다', () => {
    const topic = buildRoomTopic({
      sessionId: '11111111-2222-3333-4444-555555555555',
      visitorName: 'a'.repeat(300),
      visitorLocale: 'en',
      visitorEmail: null,
    });
    expect(topic.length).toBeLessThanOrEqual(250);
  });
});

describe('buildFeedLine — #해외문의 피드', () => {
  const at = '2024-01-01T06:02:00Z';
  it('새 문의', () => {
    expect(buildFeedLine({ kind: 'new', visitorName: 'Thu', visitorLocale: 'vi', channelId: 'C9', at })).toBe(
      '🔴 새 문의 · 🇻🇳 Thu · <#C9> · 01/01(월) 15:02 KST'
    );
  });
  it('완료 (담당 표시, 채널 링크 없음)', () => {
    expect(
      buildFeedLine({ kind: 'resolved', visitorName: 'Thu', visitorLocale: 'vi', channelId: null, at, assignedLabel: '이정현' })
    ).toBe('✅ 완료 · Thu · 담당 이정현 · 01/01(월) 15:02 KST');
  });
  it('종료 안내', () => {
    expect(buildFeedLine({ kind: 'closed', visitorName: null, visitorLocale: 'en', channelId: null, at })).toBe(
      '✅ 종료 안내 보냄 · 익명 · 01/01(월) 15:02 KST'
    );
  });
  it('다시 열림', () => {
    expect(buildFeedLine({ kind: 'reopened', visitorName: 'Thu', visitorLocale: 'vi', channelId: 'C9', at })).toBe(
      '🔄 다시 열림 · Thu · <#C9> · 01/01(월) 15:02 KST'
    );
  });
  it('미응답 확대', () => {
    expect(
      buildFeedLine({ kind: 'escalated', visitorName: 'Thu', visitorLocale: 'vi', channelId: 'C9', at, minutes: 30 })
    ).toBe('🚨 30분째 미응답 · Thu · <#C9>');
  });
  it('이름의 Slack 마크업을 이스케이프한다', () => {
    expect(buildFeedLine({ kind: 'new', visitorName: '<!channel>', visitorLocale: 'en', channelId: null, at })).not.toContain(
      '<!channel>'
    );
  });
});

describe('buildEscalationText', () => {
  it('1단계: 대상만 멘션', () => {
    expect(buildEscalationText({ level: 1, minutes: 5, mention: '<@U1>', assigneeMention: '<@U1>' })).toBe(
      '⏰ <@U1> 5분째 답이 없습니다.'
    );
  });
  it('2단계: 담당자가 있으면 전원에게 알린다는 사유를 붙인다', () => {
    expect(
      buildEscalationText({ level: 2, minutes: 12, mention: '<@U1> <@U2>', assigneeMention: '<@U1>' })
    ).toBe('⏰ <@U1> <@U2> 12분째 답이 없습니다 · 담당 <@U1> 님이 응답하지 않아 전원에게 알립니다.');
  });
  it('2단계: 담당자가 없으면 사유 없이', () => {
    expect(buildEscalationText({ level: 2, minutes: 12, mention: '<@U1> <@U2>', assigneeMention: null })).toBe(
      '⏰ <@U1> <@U2> 12분째 답이 없습니다.'
    );
  });
  it('3단계: 🚨', () => {
    expect(buildEscalationText({ level: 3, minutes: 30, mention: '<@U1>', assigneeMention: null })).toBe(
      '🚨 <@U1> 30분째 미응답입니다.'
    );
  });
});

describe('buildDeliveryFailureText', () => {
  it('알려진 사유는 한국어로', () => {
    expect(buildDeliveryFailureText('session_not_found')).toBe(
      '⚠️ 방금 답글이 손님에게 전달되지 않았습니다 · 사유: 이 채널과 연결된 상담을 찾지 못했습니다'
    );
  });
  it('모르는 사유는 코드 그대로', () => {
    expect(buildDeliveryFailureText('weird')).toContain('사유: weird');
  });
});
