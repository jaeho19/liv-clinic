import { describe, it, expect } from 'vitest';
import {
  BAR_COLOR,
  bar,
  cleanUsername,
  COPY_LOOK,
  NOTICE_LOOK,
  styledAdminReply,
  styledContactNotice,
  styledDeliveryFailure,
  styledEscalation,
  styledEventHint,
  styledFeedReplyCopy,
  styledMessengerClick,
  styledReopenedNotice,
  styledRoomFirstNotice,
  styledRoomFirstVisitor,
  styledRoomVisitor,
  styledTranslationCopy,
  visitorLook,
} from '../slackLook';
import {
  buildContactText,
  buildDeliveryFailureText,
  buildEscalationText,
  buildEventHintNote,
  buildFeedReplyMirrorText,
  buildMessengerClickText,
  buildReplyText,
  buildRoomFirstNoticeText,
  buildRoomFirstText,
  buildRoomVisitorText,
  ROOM_EMAIL_CONTACT_NOTE,
  ROOM_REOPENED_LEAD,
} from '../slackText';

const YUKI = { visitorName: 'Yuki Tanaka', visitorLocale: 'ja' };
const SESSION_ID = '40e56969-aaaa-bbbb-cccc-dddddddddddd';
// 2026-10-01(목) 16:40 KST
const AT = '2026-10-01T07:40:00Z';
const BODY = { originalText: 'ウルセラの料金はいくらですか？', translatedText: '울쎄라 가격이 얼마인가요?' };

describe('cleanUsername — 이름표에 쓸 글자', () => {
  it('줄바꿈·탭·제어 문자를 공백 하나로 줄이고 앞뒤를 자른다', () => {
    expect(cleanUsername('  Yuki\n\tTanaka\u0007 ')).toBe('Yuki Tanaka');
  });
  it('70글자에서 자른다 (한글도 글자 수로)', () => {
    expect(Array.from(cleanUsername('가'.repeat(100)))).toHaveLength(70);
  });
});

describe('visitorLook — 손님 글의 이름표', () => {
  it('이름 + 손님, 로케일의 국기', () => {
    expect(visitorLook(YUKI)).toEqual({ username: 'Yuki Tanaka 손님', iconEmoji: ':flag-jp:' });
  });
  it('이름이 없으면 언어 이름으로 부른다', () => {
    expect(visitorLook({ visitorName: null, visitorLocale: 'en' })).toEqual({
      username: '영어 손님',
      iconEmoji: ':flag-gb:',
    });
    expect(visitorLook({ visitorName: '   ', visitorLocale: 'zh-TW' }).username).toBe('중국어(번체) 손님');
  });
  it('열 개 로케일 모두 국기가 있다. 모르는 로케일은 지구본', () => {
    const icons = ['en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'].map(
      (l) => visitorLook({ visitorName: 'A', visitorLocale: l }).iconEmoji
    );
    expect(icons).toEqual([
      ':flag-gb:',
      ':flag-jp:',
      ':flag-cn:',
      ':flag-tw:',
      ':flag-vn:',
      ':flag-th:',
      ':flag-ru:',
      ':flag-fr:',
      ':flag-mn:',
      ':flag-sa:',
    ]);
    expect(visitorLook({ visitorName: 'A', visitorLocale: 'xx' }).iconEmoji).toBe(':globe_with_meridians:');
  });
  it('이름의 줄바꿈은 공백으로', () => {
    expect(visitorLook({ visitorName: 'Yuki\nTanaka', visitorLocale: 'ja' }).username).toBe('Yuki Tanaka 손님');
  });
});

describe('bar — 색 막대 하나', () => {
  it('큰 줄은 section, 설명 줄은 context 요소 하나씩', () => {
    expect(bar('contact', { headline: '📱 *큰 줄* `코드`', notes: ['설명 1', '설명 2'] })).toEqual({
      color: '#2e9e6b',
      fallback: '📱 큰 줄 코드',
      blocks: [
        { type: 'section', text: { type: 'mrkdwn', text: '📱 *큰 줄* `코드`' } },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: '설명 1' },
            { type: 'mrkdwn', text: '설명 2' },
          ],
        },
      ],
    });
  });
  it('설명 줄이 없으면 context 블록을 넣지 않는다', () => {
    expect(bar('alert', { headline: '⏰ *5분째 답이 없습니다.*', notes: [] }).blocks).toHaveLength(1);
  });
  it('색은 세 가지', () => {
    expect(BAR_COLOR).toEqual({ info: '#a8a6a8', contact: '#2e9e6b', alert: '#d8452f' });
  });
});

describe('손님 글 (1·3)', () => {
  it('첫 글: 손님 이름표, 멘션 줄 + 번역 + 원문. 글자만 문구는 지금까지의 첫 글 전체', () => {
    const m = styledRoomFirstVisitor({ session: YUKI, mentionAll: '<@U1> <@U2>', receivedAt: AT, ...BODY });
    expect(m.username).toBe('Yuki Tanaka 손님');
    expect(m.iconEmoji).toBe(':flag-jp:');
    expect(m.text).toBe('<@U1> <@U2>\n울쎄라 가격이 얼마인가요?\n> _원문:_ ウルセラの料金はいくらですか？');
    expect(m.attachments).toBeUndefined();
    expect(m.plainText).toBe(
      buildRoomFirstText({ mentionAll: '<@U1> <@U2>', receivedAt: AT, visitorLocale: 'ja', ...BODY })
    );
  });
  it('첫 글: 연락처 꼬리말은 글자만 문구에만 들어간다 (꾸민 글에서는 알림 쪽에 붙는다)', () => {
    const m = styledRoomFirstVisitor({
      session: YUKI,
      mentionAll: '<@U1>',
      receivedAt: AT,
      contactNote: ROOM_EMAIL_CONTACT_NOTE,
      ...BODY,
    });
    expect(m.text).not.toContain('이메일을 남긴 손님입니다');
    expect(m.plainText.endsWith(ROOM_EMAIL_CONTACT_NOTE)).toBe(true);
  });
  it('멘션 대상이 없으면 멘션 줄을 뺀다', () => {
    const m = styledRoomFirstVisitor({ session: YUKI, mentionAll: '', receivedAt: AT, ...BODY });
    expect(m.text.split('\n')[0]).toBe('울쎄라 가격이 얼마인가요?');
  });
  it('후속 글: 담당자 멘션 줄 + 본문, 시각 글자는 없다', () => {
    const m = styledRoomVisitor({ session: YUKI, mention: '<@U1>', receivedAt: AT, reopened: false, ...BODY });
    expect(m.username).toBe('Yuki Tanaka 손님');
    expect(m.text).toBe('<@U1>\n울쎄라 가격이 얼마인가요?\n> _원문:_ ウルセラの料金はいくらですか？');
    expect(m.text).not.toContain('KST');
    expect(m.plainText).toBe(
      buildRoomVisitorText({ mention: '<@U1>', receivedAt: AT, reopened: false, visitorLocale: 'ja', ...BODY })
    );
  });
  it('재발신: 🔔 머리말은 글자만 문구에만 들어간다', () => {
    const m = styledRoomVisitor({ session: YUKI, mention: '<@U1>', receivedAt: AT, reopened: true, ...BODY });
    expect(m.text).not.toContain('🔔');
    expect(m.plainText.startsWith(ROOM_REOPENED_LEAD)).toBe(true);
  });
  it('손님 글의 Slack 마크업은 이스케이프된다', () => {
    const m = styledRoomVisitor({
      session: YUKI,
      mention: '',
      receivedAt: AT,
      reopened: false,
      originalText: '<!channel> hi',
      translatedText: null,
    });
    expect(m.text).toBe('&lt;!channel&gt; hi');
  });
});

describe('알림 (2·4·8·9·10·11·12·13) — LIV 알림 + 색 막대', () => {
  it('첫 알림: 회색, 큰 줄 하나 — 접수 시각과 참조코드 (설명 줄 없음)', () => {
    const m = styledRoomFirstNotice({ sessionId: SESSION_ID, receivedAt: AT });
    expect(m.username).toBe('LIV 알림');
    expect(m.iconEmoji).toBe(':bell:');
    expect(m.text).toBe('');
    expect(m.attachments).toEqual([
      {
        color: BAR_COLOR.info,
        fallback: '새 문의 · 📥 10/01(목) 16:40 KST · 참조코드 #40E56969',
        blocks: [
          { type: 'section', text: { type: 'mrkdwn', text: '*새 문의* · 📥 10/01(목) 16:40 KST · 참조코드 `#40E56969`' } },
        ],
      },
    ]);
    expect(m.plainText).toBe(buildRoomFirstNoticeText({ sessionId: SESSION_ID, receivedAt: AT }));
  });
  it('첫 알림: 시작 화면에서 이메일을 넣은 손님이면 초록 막대 한 줄이 따라붙는다', () => {
    const args = { sessionId: SESSION_ID, receivedAt: AT, contactNote: ROOM_EMAIL_CONTACT_NOTE };
    const m = styledRoomFirstNotice({ ...args, contactEmail: 'yuki.t@example.com' });
    expect(m.attachments).toHaveLength(2);
    expect(m.attachments![0].color).toBe(BAR_COLOR.info);
    expect(m.attachments![1]).toEqual({
      color: BAR_COLOR.contact,
      fallback: '📱 손님이 연락처를 남겼습니다 — 이메일: yuki.t@example.com',
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: '📱 *손님이 연락처를 남겼습니다* — 이메일: yuki.t@example.com' },
        },
      ],
    });
    // 글자만 문구에는 지금까지의 꼬리말이 그대로 붙는다
    expect(m.plainText).toBe(buildRoomFirstNoticeText(args));
    expect(m.plainText.endsWith(ROOM_EMAIL_CONTACT_NOTE)).toBe(true);
  });
  it('재발신 알림: 회색, 설명 없음', () => {
    const m = styledReopenedNotice();
    expect(m).toMatchObject({ ...NOTICE_LOOK, text: '', plainText: ROOM_REOPENED_LEAD });
    expect(m.attachments![0].color).toBe(BAR_COLOR.info);
    expect(m.attachments![0].blocks).toEqual([{ type: 'section', text: { type: 'mrkdwn', text: ROOM_REOPENED_LEAD } }]);
  });
  it('연락처 남김: 초록, 큰 줄만 (설명은 글자만 문구에만 남는다)', () => {
    const args = { channelLabel: '이메일', handle: 'yuki.t@example.com', mode: 'room' as const, followup: true, adminUrl: null };
    const m = styledContactNotice(args);
    expect(m).toMatchObject({ ...NOTICE_LOOK, text: '', plainText: buildContactText(args) });
    expect(m.attachments![0].color).toBe(BAR_COLOR.contact);
    expect(m.attachments![0].blocks).toEqual([
      { type: 'section', text: { type: 'mrkdwn', text: '📱 *손님이 연락처를 남겼습니다* — 이메일: yuki.t@example.com' } },
    ]);
    expect(m.plainText).toContain("_'오늘 연락할 손님'으로 분류했습니다");
  });
  it('병원 연락 단추: 초록, 큰 줄만 (번역본 안내는 글자만 문구에만 남는다)', () => {
    const args = { channel: 'whatsapp' as const, sessionId: SESSION_ID, copyHint: true };
    const m = styledMessengerClick(args);
    expect(m.attachments![0].color).toBe(BAR_COLOR.contact);
    expect(m.attachments![0].blocks).toEqual([
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '📲 손님이 WhatsApp으로 이어가기를 눌렀습니다 — 병원 WhatsApp에서 코드 #40E56969 가 담긴 메시지를 확인해 주세요.',
        },
      },
    ]);
    expect(m.plainText).toBe(buildMessengerClickText(args));
    expect(m.plainText).toContain('번역본이 아래에 올라옵니다');
  });
  it('이벤트 링크 안내: 회색, 짧은 문장 다음 줄에 링크', () => {
    const url = 'https://liv-clinic.net/ja/events/2026-10-promotion';
    const m = styledEventHint(url);
    expect(m.attachments![0].color).toBe(BAR_COLOR.info);
    expect(m.attachments![0].blocks).toEqual([
      { type: 'section', text: { type: 'mrkdwn', text: `🎁 이벤트 링크를 자동으로 보냈습니다\n${url}` } },
    ]);
    expect(m.plainText).toBe(buildEventHintNote(url));
  });
  it('재촉: 멘션은 최상위 text, 문장은 빨간 막대', () => {
    const args = { level: 1 as const, minutes: 5, mention: '<@U1> <@U2>', assigneeMention: null };
    const m = styledEscalation(args);
    expect(m).toMatchObject({ ...NOTICE_LOOK, text: '<@U1> <@U2>', plainText: buildEscalationText(args) });
    expect(m.attachments![0].color).toBe(BAR_COLOR.alert);
    expect(m.attachments![0].blocks).toEqual([
      { type: 'section', text: { type: 'mrkdwn', text: '⏰ *5분째 답이 없습니다.*' } },
    ]);
  });
  it('12분 재촉: 큰 줄만 — 담당자가 답하지 않았다는 사유는 글자만 문구에만 남는다', () => {
    const args = { level: 2 as const, minutes: 12, mention: '<@U1> <@U2>', assigneeMention: '<@U1>' };
    const m = styledEscalation(args);
    expect(m.text).toBe('<@U1> <@U2>');
    expect(m.attachments![0].blocks).toEqual([
      { type: 'section', text: { type: 'mrkdwn', text: '⏰ *12분째 답이 없습니다.*' } },
    ]);
    expect(m.plainText).toBe(buildEscalationText(args));
    expect(m.plainText).toContain('담당 <@U1> 님이 응답하지 않아 전원에게 알립니다.');
  });
  it('30분 재촉: 🚨', () => {
    const m = styledEscalation({ level: 3, minutes: 30, mention: '<@U1>', assigneeMention: null });
    expect(m.attachments![0].blocks[0]).toEqual({
      type: 'section',
      text: { type: 'mrkdwn', text: '🚨 *30분째 미응답입니다.*' },
    });
  });
  it('전달 실패: 빨강, 사유는 설명 줄', () => {
    const m = styledDeliveryFailure('empty_text');
    expect(m).toMatchObject({ ...NOTICE_LOOK, text: '', plainText: buildDeliveryFailureText('empty_text') });
    expect(m.attachments![0].color).toBe(BAR_COLOR.alert);
    expect(m.attachments![0].blocks[1]).toEqual({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: '사유: 내용이 비어 있습니다' }],
    });
  });
});

describe('직원 답의 사본과 번역본 (5·6·7)', () => {
  it('관리자 화면 답장: 작성자 이름표, 한국어 원문 + 전달된 번역', () => {
    const args = {
      senderLabel: 'admin@livps.co.kr',
      visitorLocale: 'ja',
      originalText: '안녕하세요, 리브성형외과입니다.',
      translatedText: 'こんにちは、LIV美容クリニックです。',
    };
    const m = styledAdminReply(args);
    expect(m.username).toBe('admin@livps.co.kr · 관리자 화면에서 답함');
    expect(m.iconEmoji).toBe(':leftwards_arrow_with_hook:');
    expect(m.text).toBe('안녕하세요, 리브성형외과입니다.\n> _ja 전달:_ こんにちは、LIV美容クリニックです。');
    expect(m.attachments).toBeUndefined();
    expect(m.plainText).toBe(buildReplyText({ sender: 'operator', ...args }));
  });
  it('관리자 화면 답장: 작성자를 모르면 이름표에 설명만', () => {
    expect(
      styledAdminReply({ senderLabel: null, visitorLocale: 'ja', originalText: '안녕하세요', translatedText: null }).username
    ).toBe('관리자 화면에서 답함');
  });
  it('피드 답장 사본: 작성자 이름표, 본문은 답장 글', () => {
    const m = styledFeedReplyCopy({ senderLabel: '유다영', text: '안녕하세요 <b> & 리브' });
    expect(m.username).toBe('유다영 · 피드에서 답함');
    expect(m.iconEmoji).toBe(':leftwards_arrow_with_hook:');
    expect(m.text).toBe('안녕하세요 &lt;b&gt; &amp; 리브');
    expect(m.plainText).toBe(buildFeedReplyMirrorText({ senderLabel: '유다영', text: '안녕하세요 <b> & 리브' }));
    expect(styledFeedReplyCopy({ senderLabel: null, text: 'a' }).username).toBe('피드에서 답함');
  });
  it('번역본: 이름표만 붙고 본문은 번역문 그대로 (꾸민 글·글자만 글이 같다)', () => {
    const m = styledTranslationCopy('您好，价格是100万韩元。');
    expect(m).toEqual({ ...COPY_LOOK, text: '您好，价格是100万韩元。', plainText: '您好，价格是100万韩元。' });
    expect(COPY_LOOK).toEqual({ username: '번역본 · 복사용', iconEmoji: ':clipboard:' });
  });
});
