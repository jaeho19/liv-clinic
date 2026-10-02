import { describe, it, expect, afterEach } from 'vitest';
import {
  buildContactText,
  buildDeliveryFailureText,
  buildEscalationText,
  buildEventHintNote,
  buildFeedLine,
  buildFollowupDigestText,
  buildMessengerClickText,
  buildReplyText,
  buildRoomFirstNoticeText,
  buildRoomFirstText,
  buildRoomTopic,
  buildRoomVisitorText,
  buildRootText,
  buildTranslationCopyText,
  contactNoticeHeadline,
  contactNoticeParts,
  deliveryFailureParts,
  escalationNoticeHeadline,
  EVENT_HINT_SENTENCE,
  EVENT_HINT_SHORT,
  extractRoomChannelFromFeedText,
  buildFeedReplyMirrorText,
  FOLLOWUP_DIGEST_MAX_LINES,
  messengerClickParts,
  ROOM_AUTO_ACK_NOTE,
  ROOM_EMAIL_CONTACT_NOTE,
  ROOM_FOOTER,
  ROOM_REOPENED_LEAD,
  roomFirstNoticeHeadline,
  staffChannelLabel,
  type FollowupDigestItem,
} from '../slackText';
import { CHAT_CONTACT_EMAIL } from '@/lib/constants';

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

describe('buildContactText — 손님 연락처 알림', () => {
  it("방: '오늘 연락할 손님' 분류와 번역본 안내 세 줄을 붙인다", () => {
    const text = buildContactText({
      channelLabel: 'WeChat',
      handle: 'abc123',
      adminUrl: null,
      mode: 'room',
      followup: true,
    });
    expect(text).toBe(
      '📱 *손님이 연락처를 남겼습니다* — WeChat: abc123\n' +
        "_'오늘 연락할 손님'으로 분류했습니다._\n" +
        '_이 방에 한국어로 답을 쓰면 바로 아래에 번역본이 올라옵니다. 복사해서 위챗·왓츠앱·메일에 붙여 넣으세요._\n' +
        '_방에 답을 쓰면 목록에서 빠집니다. 상담이 끝나면 방을 보관(완료)해 주세요._'
    );
  });

  it('스레드: 번역본은 방에만 올라오므로 그 줄을 뺀다', () => {
    const text = buildContactText({
      channelLabel: '이메일',
      handle: 'guest@example.com',
      adminUrl: null,
      mode: 'thread',
      followup: true,
    });
    expect(text).toBe(
      '📱 *손님이 연락처를 남겼습니다* — 이메일: guest@example.com\n' +
        "_'오늘 연락할 손님'으로 분류했습니다._\n" +
        '_이 스레드에 답글을 쓰면 목록에서 빠집니다._'
    );
  });

  it('긴급 정지(CHAT_FOLLOWUP=off) 중에는 분류 안내 대신 연락 요청만 남긴다', () => {
    const text = buildContactText({
      channelLabel: 'WhatsApp',
      handle: '+82 10-1234-5678',
      adminUrl: null,
      mode: 'room',
      followup: false,
    });
    expect(text).toBe(
      '📱 *손님이 연락처를 남겼습니다* — WhatsApp: +82 10-1234-5678\n_이 연락처로 먼저 연락해 주세요._'
    );
  });

  it('핸들의 Slack 마크업을 이스케이프한다', () => {
    const text = buildContactText({
      channelLabel: 'WeChat',
      handle: '<!channel>id',
      adminUrl: null,
      mode: 'room',
      followup: true,
    });
    expect(text).not.toContain('<!channel>');
    expect(text).toContain('&lt;!channel&gt;id');
  });

  it('붙일 방·스레드가 없으면(단독 게시) 관리자 화면에서 답하라는 안내와 링크를 붙인다', () => {
    const text = buildContactText({
      channelLabel: 'LINE',
      handle: 'my_line_id',
      adminUrl: 'https://example.com/admin/chat/abc',
      mode: 'standalone',
      followup: true,
    });
    expect(text).toBe(
      '📱 *손님이 연락처를 남겼습니다* — LINE: my_line_id\n' +
        "_'오늘 연락할 손님'으로 분류했습니다._\n" +
        '_관리자 화면에서 답하면 목록에서 빠집니다._\n' +
        '🔗 <https://example.com/admin/chat/abc|관리자 화면에서 열기>'
    );
  });

  it('방·스레드에 붙을 때는 관리자 링크를 붙이지 않는다', () => {
    const text = buildContactText({
      channelLabel: 'LINE',
      handle: 'my_line_id',
      adminUrl: 'https://example.com/admin/chat/abc',
      mode: 'room',
      followup: true,
    });
    expect(text).not.toContain('🔗');
  });
});

describe('staffChannelLabel — 직원에게 보이는 채널 이름', () => {
  it('이메일만 한국어, 메신저는 브랜드명', () => {
    expect(staffChannelLabel('email')).toBe('이메일');
    expect(staffChannelLabel('wechat')).toBe('WeChat');
    expect(staffChannelLabel('whatsapp')).toBe('WhatsApp');
    expect(staffChannelLabel('line')).toBe('LINE');
  });
  it('모르는 값은 그대로, 없으면 빈 글자', () => {
    expect(staffChannelLabel('telegram')).toBe('telegram');
    expect(staffChannelLabel(null)).toBe('');
  });
});

describe('buildMessengerClickText — 손님이 카드의 병원 연락 단추를 눌렀다', () => {
  const sessionId = 'a1b2c3d4-0000-0000-0000-000000000000';

  it('WhatsApp', () => {
    expect(buildMessengerClickText({ channel: 'whatsapp', sessionId, copyHint: true })).toBe(
      '📲 손님이 WhatsApp으로 이어가기를 눌렀습니다 — 병원 WhatsApp에서 코드 #A1B2C3D4 가 담긴 메시지를 확인해 주세요. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다.'
    );
  });

  it('LINE도 같은 형식', () => {
    expect(buildMessengerClickText({ channel: 'line', sessionId, copyHint: true })).toBe(
      '📲 손님이 LINE으로 이어가기를 눌렀습니다 — 병원 LINE에서 코드 #A1B2C3D4 가 담긴 메시지를 확인해 주세요. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다.'
    );
  });

  it('WeChat은 아이디·QR 확인', () => {
    expect(buildMessengerClickText({ channel: 'wechat', sessionId, copyHint: true })).toBe(
      '📲 손님이 병원 WeChat 아이디·QR을 확인했습니다 — 업무폰 WeChat에서 친구 요청과 코드 #A1B2C3D4 메시지를 확인해 주세요. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다.'
    );
  });

  it('이메일은 병원 주소가 들어간다', () => {
    const text = buildMessengerClickText({ channel: 'email', sessionId, copyHint: true });
    expect(text).toBe(
      `📲 손님이 병원 이메일 주소를 확인했습니다 — ${CHAT_CONTACT_EMAIL} 메일함에서 코드 #A1B2C3D4 가 담긴 메일을 확인해 주세요. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다.`
    );
    expect(text).toContain('jaeho19@gmail.com');
  });

  it('번역본이 올라오지 않는 곳(스레드·긴급 정지)에서는 그 안내를 붙이지 않는다', () => {
    const text = buildMessengerClickText({ channel: 'whatsapp', sessionId, copyHint: false });
    expect(text.endsWith('메시지를 확인해 주세요.')).toBe(true);
    expect(text).not.toContain('번역본');
  });
});

describe('buildTranslationCopyText — 직원 답글의 번역본', () => {
  it('번역문만 담는다 (머리말·이모지 없음)', () => {
    expect(buildTranslationCopyText('您好，价格是100万韩元。')).toBe('您好，价格是100万韩元。');
  });
  it('Slack 마크업만 이스케이프한다', () => {
    expect(buildTranslationCopyText('A & B <!channel>')).toBe('A &amp; B &lt;!channel&gt;');
  });
});

describe('buildEventHintNote — 이벤트 링크가 자동으로 나갔다', () => {
  it('안내 한 줄 + 링크 줄', () => {
    expect(buildEventHintNote('https://liv-clinic.net/en/events/2026-10-promotion')).toBe(
      '🎁 _가격 문의로 보여 손님에게 이벤트 링크를 자동으로 보냈습니다. 가격은 직접 답해 주세요._\n' +
        'https://liv-clinic.net/en/events/2026-10-promotion'
    );
  });
});

describe("buildFollowupDigestText — '오늘 연락할 손님' 요약", () => {
  const item = (over: Partial<FollowupDigestItem> = {}): FollowupDigestItem => ({
    visitorName: 'Li Wei',
    visitorLocale: 'zh',
    contactLabel: 'WeChat',
    awaitingSince: '2026-10-01T00:26:00Z',
    channelId: 'C0ROOM1',
    adminUrl: null,
    ...over,
  });

  it('머리말(인원·전원 멘션) + 손님 줄 + 꼬리말', () => {
    const text = buildFollowupDigestText({
      mentionAll: '<@U1> <@U2>',
      items: [
        item(),
        item({ visitorName: null, visitorLocale: 'en', contactLabel: '이메일', awaitingSince: '2026-10-01T05:03:00Z', channelId: 'C0ROOM2' }),
      ],
    });
    expect(text).toBe(
      '📋 *오늘 연락할 손님 2명* <@U1> <@U2>\n' +
        '• 🇨🇳 Li Wei · WeChat · 10/01(목) 09:26 문의 · <#C0ROOM1>\n' +
        '• 🇬🇧 익명 · 이메일 · 10/01(목) 14:03 문의 · <#C0ROOM2>\n' +
        '_방에 답을 쓰거나 방을 보관(완료)하면 목록에서 빠집니다._'
    );
  });

  it('방이 없는 손님(스레드 방식)은 관리자 화면 링크', () => {
    const text = buildFollowupDigestText({
      mentionAll: '',
      items: [item({ channelId: null, adminUrl: 'https://liv-clinic.net/admin/chat/abc' })],
    });
    expect(text.split('\n')[0]).toBe('📋 *오늘 연락할 손님 1명*');
    expect(text.split('\n')[1]).toBe(
      '• 🇨🇳 Li Wei · WeChat · 10/01(목) 09:26 문의 · <https://liv-clinic.net/admin/chat/abc|관리자 화면>'
    );
  });

  it('20명을 넘으면 "외 N명"', () => {
    const items = Array.from({ length: FOLLOWUP_DIGEST_MAX_LINES + 3 }, (_, i) => item({ visitorName: `G${i}` }));
    const lines = buildFollowupDigestText({ mentionAll: '<@U1>', items }).split('\n');
    expect(lines[0]).toBe('📋 *오늘 연락할 손님 23명* <@U1>');
    expect(lines).toHaveLength(1 + FOLLOWUP_DIGEST_MAX_LINES + 1 + 1);
    expect(lines[FOLLOWUP_DIGEST_MAX_LINES + 1]).toBe('• 외 3명');
  });

  it('이름의 Slack 마크업을 이스케이프한다', () => {
    expect(buildFollowupDigestText({ mentionAll: '', items: [item({ visitorName: '<!channel>' })] })).not.toContain(
      '<!channel>'
    );
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

  it('자동 안내 꼬리말은 접수 안내가 나갔다고 알린다', () => {
    expect(ROOM_AUTO_ACK_NOTE).toBe(
      '_손님에게는 접수 안내(예상 시간·연락처 요청·시술과 방문일 질문)가 자동으로 나갔습니다._'
    );
  });

  it('시작 화면에서 이메일을 넣은 손님이면 꼬리말을 한 줄 더 붙인다', () => {
    const text = buildRoomFirstText({ ...base, mentionAll: '<@U1>', contactNote: ROOM_EMAIL_CONTACT_NOTE });
    expect(text.endsWith(`${ROOM_FOOTER}\n${ROOM_AUTO_ACK_NOTE}\n${ROOM_EMAIL_CONTACT_NOTE}`)).toBe(true);
    expect(ROOM_EMAIL_CONTACT_NOTE).toBe(
      "_이메일을 남긴 손님입니다 — '오늘 연락할 손님'으로 관리됩니다. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다._"
    );
  });

  it('연락처 꼬리말이 null이면 붙이지 않는다', () => {
    const text = buildRoomFirstText({ ...base, mentionAll: '<@U1>', contactNote: null });
    expect(text.endsWith(`${ROOM_FOOTER}\n${ROOM_AUTO_ACK_NOTE}`)).toBe(true);
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

  it('연락처 남김 (채널 이름과 방 링크)', () => {
    expect(
      buildFeedLine({
        kind: 'contact',
        visitorName: 'Li Wei',
        visitorLocale: 'zh',
        channelId: 'C9',
        at: '2026-10-01T05:03:00Z',
        contactLabel: 'WeChat',
      })
    ).toBe('📋 연락처 남김 · 🇨🇳 Li Wei · WeChat · <#C9> · 10/01(목) 14:03 KST');
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
      '⚠️ 방금 답글이 손님에게 전달되지 않았습니다 · 사유: 이 스레드는 상담과 연결돼 있지 않습니다. 사이드바의 손님 방(날짜-이름으로 된 방) 본문에 답해 주세요'
    );
  });
  it('모르는 사유는 코드 그대로', () => {
    expect(buildDeliveryFailureText('weird')).toContain('사유: weird');
  });
  it('모르는 사유에 Slack 마크업이 있으면 이스케이프한다', () => {
    expect(buildDeliveryFailureText('<!channel> & <@U1>')).toBe(
      '⚠️ 방금 답글이 손님에게 전달되지 않았습니다 · 사유: &lt;!channel&gt; &amp; &lt;@U1&gt;'
    );
  });
});

// ── 알림의 조각 (스펙 2026-10-01 slack-room-look §3.4) — 글자만 문구가 큰 줄과 설명 줄을 이어 붙인다 ─────────
// 손님 방의 색 막대에는 큰 줄만 올린다(2026-10-02 slack-room-notice-trim). 설명 줄은 글자만 문구에 남는다.

describe('contactNoticeParts — 연락처 알림의 조각', () => {
  it('방: 큰 줄 하나 + 설명 세 줄(기울임 없음), 링크 없음', () => {
    expect(
      contactNoticeParts({ channelLabel: 'WeChat', handle: 'abc123', adminUrl: null, mode: 'room', followup: true })
    ).toEqual({
      headline: '📱 *손님이 연락처를 남겼습니다* — WeChat: abc123',
      notes: [
        "'오늘 연락할 손님'으로 분류했습니다.",
        '이 방에 한국어로 답을 쓰면 바로 아래에 번역본이 올라옵니다. 복사해서 위챗·왓츠앱·메일에 붙여 넣으세요.',
        '방에 답을 쓰면 목록에서 빠집니다. 상담이 끝나면 방을 보관(완료)해 주세요.',
      ],
      link: null,
    });
  });
  it('긴급 정지 중에는 설명이 한 줄', () => {
    expect(
      contactNoticeParts({ channelLabel: '이메일', handle: 'a@b.co', adminUrl: null, mode: 'room', followup: false }).notes
    ).toEqual(['이 연락처로 먼저 연락해 주세요.']);
  });
  it('단독 게시일 때만 관리자 링크가 있다', () => {
    const args = { channelLabel: 'LINE', handle: 'x', adminUrl: 'https://example.com/admin/chat/abc', followup: true };
    expect(contactNoticeParts({ ...args, mode: 'standalone' }).link).toBe(
      '🔗 <https://example.com/admin/chat/abc|관리자 화면에서 열기>'
    );
    expect(contactNoticeParts({ ...args, mode: 'room' }).link).toBeNull();
  });
  it('핸들의 Slack 마크업을 이스케이프한다', () => {
    expect(
      contactNoticeParts({ channelLabel: 'WeChat', handle: '<!channel>', adminUrl: null, mode: 'room', followup: true })
        .headline
    ).toBe('📱 *손님이 연락처를 남겼습니다* — WeChat: &lt;!channel&gt;');
  });
});

describe('messengerClickParts — 병원 연락 단추 알림의 조각', () => {
  const sessionId = 'a1b2c3d4-0000-0000-0000-000000000000';
  it('번역본 안내는 설명 줄로 뺀다', () => {
    expect(messengerClickParts({ channel: 'whatsapp', sessionId, copyHint: true })).toEqual({
      headline:
        '📲 손님이 WhatsApp으로 이어가기를 눌렀습니다 — 병원 WhatsApp에서 코드 #A1B2C3D4 가 담긴 메시지를 확인해 주세요.',
      notes: ['이 방에 답을 쓰면 번역본이 아래에 올라옵니다.'],
    });
  });
  it('번역본이 올라오지 않는 곳에서는 설명 줄이 없다', () => {
    expect(messengerClickParts({ channel: 'wechat', sessionId, copyHint: false }).notes).toEqual([]);
  });
});

describe('EVENT_HINT_SENTENCE', () => {
  it('이벤트 안내 알림의 문장 (글자만 올릴 때는 기울임으로 감싼다)', () => {
    expect(EVENT_HINT_SENTENCE).toBe(
      '가격 문의로 보여 손님에게 이벤트 링크를 자동으로 보냈습니다. 가격은 직접 답해 주세요.'
    );
    expect(buildEventHintNote('https://x.y/z')).toBe(`🎁 _${EVENT_HINT_SENTENCE}_\nhttps://x.y/z`);
  });
});

describe('buildRoomFirstNoticeText — 첫 알림의 글자만 문구', () => {
  const base = { receivedAt: '2026-10-01T07:40:00Z', sessionId: '40e56969-aaaa-bbbb-cccc-dddddddddddd' };

  it('🔴 머리 + 기울임 설명 (꾸민 알림이 거부됐을 때만 쓴다)', () => {
    expect(buildRoomFirstNoticeText(base)).toBe(
      `🔴 *새 문의* · 📥 10/01(목) 16:40 KST · 참조코드 #40E56969\n${ROOM_FOOTER}\n${ROOM_AUTO_ACK_NOTE}`
    );
    expect(buildRoomFirstNoticeText({ ...base, contactNote: ROOM_EMAIL_CONTACT_NOTE }).endsWith(ROOM_EMAIL_CONTACT_NOTE)).toBe(
      true
    );
  });
});

describe('ROOM_REOPENED_LEAD', () => {
  it('손님 후속 글의 🔔 머리말과 같은 문장이다', () => {
    expect(ROOM_REOPENED_LEAD).toBe('🔔 *완료했던 문의에 손님이 다시 말을 걸었습니다*');
    expect(
      buildRoomVisitorText({
        mention: '<@U1>',
        receivedAt: '2024-01-01T05:12:00Z',
        reopened: true,
        visitorLocale: 'vi',
        originalText: 'a',
        translatedText: null,
      }).startsWith(`${ROOM_REOPENED_LEAD} · <@U1>`)
    ).toBe(true);
  });
});

describe('deliveryFailureParts — 전달 실패 알림의 조각', () => {
  it('큰 줄 + 사유 한 줄', () => {
    expect(deliveryFailureParts('empty_text')).toEqual({
      headline: '⚠️ *방금 답글이 손님에게 전달되지 않았습니다*',
      notes: ['사유: 내용이 비어 있습니다'],
    });
  });
  it('모르는 사유는 이스케이프한 코드 그대로', () => {
    expect(deliveryFailureParts('<@U1>').notes).toEqual(['사유: &lt;@U1&gt;']);
  });
});

// ── 큰 줄만 (스펙 2026-10-02 slack-room-notice-trim) — 손님 방의 색 막대에는 큰 줄 하나만 올린다 ─────────────

describe('contactNoticeHeadline — 연락처 알림의 큰 줄', () => {
  it('채널 이름과 연락처를 한 줄로', () => {
    expect(contactNoticeHeadline('이메일', 'guest@example.com')).toBe(
      '📱 *손님이 연락처를 남겼습니다* — 이메일: guest@example.com'
    );
  });
  it('연락처의 Slack 마크업을 이스케이프한다', () => {
    expect(contactNoticeHeadline('WeChat', '<!channel>')).toBe(
      '📱 *손님이 연락처를 남겼습니다* — WeChat: &lt;!channel&gt;'
    );
  });
  it('contactNoticeParts의 큰 줄과 같다', () => {
    expect(
      contactNoticeParts({ channelLabel: 'LINE', handle: 'x', adminUrl: null, mode: 'room', followup: true }).headline
    ).toBe(contactNoticeHeadline('LINE', 'x'));
  });
});

describe('EVENT_HINT_SHORT', () => {
  it('손님 방의 색 막대에 넣는 짧은 문장', () => {
    expect(EVENT_HINT_SHORT).toBe('이벤트 링크를 자동으로 보냈습니다');
  });
});

describe('roomFirstNoticeHeadline — 방의 첫 알림(새 문의)의 큰 줄', () => {
  it('접수 시각과 참조코드 (코드는 백틱으로 감싼다)', () => {
    expect(
      roomFirstNoticeHeadline({ receivedAt: '2026-10-01T07:40:00Z', sessionId: '40e56969-aaaa-bbbb-cccc-dddddddddddd' })
    ).toBe('*새 문의* · 📥 10/01(목) 16:40 KST · 참조코드 `#40E56969`');
  });
});

describe('escalationNoticeHeadline — 재촉 알림의 큰 줄 (멘션은 넣지 않는다)', () => {
  it('5분·12분은 ⏰', () => {
    expect(escalationNoticeHeadline({ level: 1, minutes: 5 })).toBe('⏰ *5분째 답이 없습니다.*');
    expect(escalationNoticeHeadline({ level: 2, minutes: 12 })).toBe('⏰ *12분째 답이 없습니다.*');
  });
  it('30분은 🚨', () => {
    expect(escalationNoticeHeadline({ level: 3, minutes: 30 })).toBe('🚨 *30분째 미응답입니다.*');
  });
});

describe('extractRoomChannelFromFeedText', () => {
  it('피드 줄의 첫 채널 링크를 뽑는다', () => {
    expect(extractRoomChannelFromFeedText('🔴 *새 문의* · 익명 · <#C0C0FPY4HC3> · 09/10(목) 00:10 KST')).toBe('C0C0FPY4HC3');
    expect(extractRoomChannelFromFeedText('🚨 30분째 미응답 · <#C0ROOM|chat-zh-5b0c7c>')).toBe('C0ROOM');
  });
  it('링크가 없으면 null', () => {
    expect(extractRoomChannelFromFeedText('새 채팅 문의 — 익명 (en)')).toBeNull();
    expect(extractRoomChannelFromFeedText('')).toBeNull();
    expect(extractRoomChannelFromFeedText('<@U0AAA> 답 없음')).toBeNull();
  });
});

describe('buildFeedReplyMirrorText', () => {
  it('작성자와 본문을 두 줄로, 특수문자는 이스케이프', () => {
    expect(buildFeedReplyMirrorText({ senderLabel: '유다영', text: '안녕하세요 <b> & 리브' })).toBe(
      '↩️ _피드에서 답함 · 유다영_\n안녕하세요 &lt;b&gt; &amp; 리브'
    );
  });
  it('작성자를 모르면 이름을 생략한다', () => {
    expect(buildFeedReplyMirrorText({ senderLabel: null, text: '안녕' })).toBe('↩️ _피드에서 답함_\n안녕');
  });
});
