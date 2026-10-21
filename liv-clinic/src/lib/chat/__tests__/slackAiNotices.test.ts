import { describe, it, expect } from 'vitest';
import {
  AI_LOOK,
  BAR_COLOR,
  NOTICE_LOOK,
  styledAiReply,
  styledBookingNotice,
  styledRoomFirstVisitor,
  styledRoomVisitor,
  styledStaffNeeded,
} from '../slackLook';
import {
  AI_FALLBACK_REASON,
  AI_SESSION_CAP_REASON,
  bookingNoticeHeadline,
  buildAiReplyBody,
  buildAiReplyText,
  buildBookingNoticeText,
  buildFeedLine,
  buildFollowupDigestText,
  buildStaffNeededText,
  staffNeededHeadline,
  type FollowupDigestItem,
} from '../slackText';

// 스펙 2026-10-02 chat-ai-first-response §4.11 — 방 안에 새로 생기는 글 세 가지와 피드·요약의 덧붙임.
const SUMMARY = '10/14(수) 14:00 · 2명 · 울쎄라피 프라임 · WhatsApp +65 9123 4567 · Emma';
const MENTION = '<@U0AAA> <@U0BBB>';
const AT = '2026-10-02T07:20:00Z'; // 10/02(금) 16:20 KST

describe('AI 응대 글 — AI가 손님에게 한 답의 요지', () => {
  it('요지 한두 문장, 금액 줄을 썼으면 그 아래 "안내한 금액"', () => {
    expect(buildAiReplyBody({ note: '써마지 600샷 가격과 이달 프로모션을 안내했습니다.', quoted: [] })).toBe(
      '써마지 600샷 가격과 이달 프로모션을 안내했습니다.'
    );
    expect(
      buildAiReplyBody({
        note: '써마지 600샷 가격과 이달 프로모션을 안내했습니다.',
        quoted: ['써마지 레이저 · 600샷 2,400,000원~', '[리프팅] 써마지 FLX 600샷 + 온다리프팅 30kJ + LDM관리 2,200,000원'],
      })
    ).toBe(
      '써마지 600샷 가격과 이달 프로모션을 안내했습니다.\n> 안내한 금액: 써마지 레이저 · 600샷 2,400,000원~ / [리프팅] 써마지 FLX 600샷 + 온다리프팅 30kJ + LDM관리 2,200,000원'
    );
  });

  it('요지가 비어 있으면 정해진 문장, 특수문자는 이스케이프', () => {
    expect(buildAiReplyBody({ note: '  ', quoted: [] })).toBe('손님에게 답했습니다.');
    expect(buildAiReplyBody({ note: 'A & B <c>', quoted: ['x <y>'] })).toBe('A &amp; B &lt;c&gt;\n> 안내한 금액: x &lt;y&gt;');
  });

  it('꾸민 글: 이름표 AI 응대, 막대 없음, 멘션 없음. 글자만 문구에는 머리말이 붙는다', () => {
    const m = styledAiReply({ note: '위치를 안내했습니다.', quoted: [] });
    expect(AI_LOOK).toEqual({ username: 'AI 응대', iconEmoji: ':speech_balloon:' });
    expect(m).toEqual({
      ...AI_LOOK,
      text: '위치를 안내했습니다.',
      plainText: '💬 _AI 응대_\n위치를 안내했습니다.',
    });
    expect(buildAiReplyText({ note: '위치를 안내했습니다.', quoted: [] })).toBe(m.plainText);
    expect(m.attachments).toBeUndefined();
  });
});

describe('가예약 알림 — 파란 막대', () => {
  it('큰 줄: 가예약 / 가예약 변경', () => {
    expect(bookingNoticeHeadline({ changed: false, summary: SUMMARY })).toBe(`🗓 *가예약* · ${SUMMARY}`);
    expect(bookingNoticeHeadline({ changed: true, summary: SUMMARY })).toBe(`🗓 *가예약 변경* · ${SUMMARY}`);
    expect(bookingNoticeHeadline({ changed: false, summary: 'a <b> & c' })).toBe('🗓 *가예약* · a &lt;b&gt; &amp; c');
  });

  it('꾸민 글: LIV 알림 + 파란 막대, 멘션은 최상위 글에', () => {
    const m = styledBookingNotice({ changed: false, summary: SUMMARY, mention: MENTION });
    expect(BAR_COLOR.booking).toBe('#2f6fde');
    expect(m.username).toBe(NOTICE_LOOK.username);
    expect(m.iconEmoji).toBe(NOTICE_LOOK.iconEmoji);
    expect(m.text).toBe(MENTION);
    expect(m.attachments).toEqual([
      {
        color: '#2f6fde',
        fallback: `🗓 가예약 · ${SUMMARY}`,
        blocks: [{ type: 'section', text: { type: 'mrkdwn', text: `🗓 *가예약* · ${SUMMARY}` } }],
      },
    ]);
    expect(m.plainText).toBe(`🗓 *가예약* ${MENTION} · ${SUMMARY}`);
    expect(buildBookingNoticeText({ changed: true, summary: SUMMARY, mention: MENTION })).toBe(
      `🗓 *가예약 변경* ${MENTION} · ${SUMMARY}`
    );
  });
});

describe('직원 확인 필요 — 빨간 막대', () => {
  it('큰 줄에 사유를 붙인다. 사유가 없으면 제목만', () => {
    expect(staffNeededHeadline('스컬트라 금액 문의')).toBe('🙋 *직원 확인 필요* · 스컬트라 금액 문의');
    expect(staffNeededHeadline(null)).toBe('🙋 *직원 확인 필요*');
    expect(staffNeededHeadline('a <b>')).toBe('🙋 *직원 확인 필요* · a &lt;b&gt;');
    expect(AI_FALLBACK_REASON).toBe('자동 응대가 답하지 못했습니다');
    expect(AI_SESSION_CAP_REASON).toBe('AI 응답 한도에 닿았습니다');
  });

  it('꾸민 글: 빨간 막대 + 멘션. 이미 알린 대화면 멘션 없이 막대만', () => {
    const first = styledStaffNeeded({ reason: '스컬트라 금액 문의', mention: MENTION });
    expect(first.text).toBe(MENTION);
    expect(first.attachments?.[0].color).toBe(BAR_COLOR.alert);
    expect(first.plainText).toBe(`🙋 *직원 확인 필요* ${MENTION} · 스컬트라 금액 문의`);

    const again = styledStaffNeeded({ reason: '추가 할인 요청', mention: '' });
    expect(again.text).toBe('');
    expect(again.plainText).toBe('🙋 *직원 확인 필요* · 추가 할인 요청');
    expect(buildStaffNeededText({ reason: null, mention: '' })).toBe('🙋 *직원 확인 필요*');
  });
});

describe('AI가 답하는 대화의 손님 글 — 멘션 없이', () => {
  const who = { visitorName: 'Emma', visitorLocale: 'en' };
  const body = { originalText: 'How much is Ulthera?', translatedText: '울쎄라 얼마인가요?' };

  it('첫 글: 멘션이 비어 있으면 본문만 올라간다', () => {
    const m = styledRoomFirstVisitor({ session: who, mentionAll: '', receivedAt: AT, ...body });
    expect(m.text).toBe('울쎄라 얼마인가요?\n> _원문:_ How much is Ulthera?');
    expect(m.plainText.split('\n')[0]).toBe('🔴 *새 문의* · 📥 10/02(금) 16:20 KST');
  });

  it('후속 글도 같다', () => {
    const m = styledRoomVisitor({ session: who, mention: '', receivedAt: AT, reopened: false, ...body });
    expect(m.text).toBe('울쎄라 얼마인가요?\n> _원문:_ How much is Ulthera?');
    expect(m.plainText.split('\n')[0]).toBe('16:20 KST');
  });
});

describe('#해외문의 피드와 하루 두 번 요약', () => {
  it('가예약 줄: 국기 · 이름 · 가예약 날짜 · 방 · 접수 시각', () => {
    expect(
      buildFeedLine({
        kind: 'booking',
        visitorName: 'Emma',
        visitorLocale: 'en',
        channelId: 'C0ROOM',
        at: AT,
        bookingWhen: '10/14(수) 14:00',
      })
    ).toBe('🗓 가예약 · 🇬🇧 Emma · 10/14(수) 14:00 · <#C0ROOM> · 10/02(금) 16:20 KST');
  });

  it('요약 줄에 가예약 날짜와 🙋 를 덧붙인다', () => {
    const base: FollowupDigestItem = {
      visitorName: 'Emma',
      visitorLocale: 'en',
      contactLabel: 'WhatsApp',
      awaitingSince: AT,
      channelId: 'C0ROOM',
      adminUrl: null,
    };
    const text = buildFollowupDigestText({
      mentionAll: MENTION,
      items: [
        base,
        { ...base, visitorName: 'Yuki', visitorLocale: 'ja', bookingWhen: '10/20(화) 14:00' },
        { ...base, visitorName: 'Li', visitorLocale: 'zh', needsStaff: true },
        { ...base, visitorName: 'Anna', bookingWhen: '10/22(목) 16:00', needsStaff: true },
      ],
    });
    const lines = text.split('\n');
    expect(lines[1]).toBe('• 🇬🇧 Emma · WhatsApp · 10/02(금) 16:20 문의 · <#C0ROOM>');
    expect(lines[2]).toBe('• 🇯🇵 Yuki · WhatsApp · 10/02(금) 16:20 문의 · 🗓 10/20(화) 14:00 · <#C0ROOM>');
    expect(lines[3]).toBe('• 🇨🇳 Li · WhatsApp · 10/02(금) 16:20 문의 · 🙋 · <#C0ROOM>');
    expect(lines[4]).toBe('• 🇬🇧 Anna · WhatsApp · 10/02(금) 16:20 문의 · 🗓 10/22(목) 16:00 · 🙋 · <#C0ROOM>');
  });
});
