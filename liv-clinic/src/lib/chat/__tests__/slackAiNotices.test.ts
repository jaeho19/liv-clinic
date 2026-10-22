import { describe, it, expect } from 'vitest';
import {
  AI_LOOK,
  BAR_COLOR,
  NOTICE_LOOK,
  styledAiReply,
  styledAiSummary,
  styledBookingNotice,
  styledRoomFirstVisitor,
  styledRoomVisitor,
  styledStaffNeeded,
} from '../slackLook';
import {
  AI_FALLBACK_REASON,
  AI_SESSION_CAP_REASON,
  AI_TRANSLATION_FAILED_NOTE,
  bookingNoticeHeadline,
  buildAiReplyBody,
  buildAiReplyText,
  buildAiSummaryBody,
  missingAmounts,
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

const SENT =
  'Ultherapy Prime pricing depends on the area.\n• Ultherapy Prime · Upper face (200-300 shots): from KRW 780,000 (KRW 858,000 incl. VAT)\nIf you book through this chat, you get 5% off.';
const KO =
  '울쎄라피 프라임 가격은 부위에 따라 다릅니다.\n• 울쎄라피 프라임 · 상안면(200~300샷): KRW 780,000부터 (부가세 포함 KRW 858,000)\n이 채팅으로 예약하시면 5% 할인됩니다.';
const QUOTED = ['울쎄라피 프라임 · 상안면 (200~300샷) 780,000원~'];

describe('AI 응대 글 — 손님에게 나간 답의 한국어 번역 전문 (스펙 2026-10-22 §1)', () => {
  it('번역문 전문을 그대로 올린다. 금액이 다 들어 있으면 금액 줄을 덧붙이지 않는다', () => {
    expect(buildAiReplyBody({ sentText: SENT, koreanText: KO, quoted: QUOTED })).toBe(KO);
  });

  it('missingAmounts: KRW 금액 가운데 번역문에 없는 것 — 쉼표는 무시, 다른 숫자에 붙은 것은 없는 것으로 본다', () => {
    expect(missingAmounts(SENT, KO)).toEqual([]);
    expect(missingAmounts(SENT, '상안면 780000원부터, 부가세 포함 858,000원')).toEqual([]);
    expect(missingAmounts(SENT, '상안면 78만 원부터 (부가세 포함 85만 8천 원)')).toEqual(['780000', '858000']);
    expect(missingAmounts(SENT, '상안면 7800001원')).toEqual(['780000', '858000']);
    expect(missingAmounts('KRW 1,000 and KRW 1,000', '없음')).toEqual(['1000']);
  });

  it('번역이 금액을 바꿨으면 정확한 금액 줄을 붙인다', () => {
    const ko = '울쎄라피 프라임 상안면은 78만 원부터입니다.';
    expect(buildAiReplyBody({ sentText: SENT, koreanText: ko, quoted: QUOTED })).toBe(
      `${ko}\n> 안내한 금액: 울쎄라피 프라임 · 상안면 (200~300샷) 780,000원~`
    );
  });

  it('번역 실패(null): 나간 글 그대로 + 정확한 금액 줄 + 실패 표시', () => {
    expect(AI_TRANSLATION_FAILED_NOTE).toBe('_(번역 실패 — 손님에게 나간 글 그대로)_');
    expect(buildAiReplyBody({ sentText: SENT, koreanText: null, quoted: QUOTED })).toBe(
      `${SENT}\n> 안내한 금액: 울쎄라피 프라임 · 상안면 (200~300샷) 780,000원~\n${AI_TRANSLATION_FAILED_NOTE}`
    );
    expect(buildAiReplyBody({ sentText: 'Hello!', koreanText: null, quoted: [] })).toBe(`Hello!\n${AI_TRANSLATION_FAILED_NOTE}`);
  });

  it('빈 글이면 정해진 문장, 특수문자는 이스케이프', () => {
    expect(buildAiReplyBody({ sentText: ' ', koreanText: '  ', quoted: [] })).toBe('손님에게 답했습니다.');
    expect(buildAiReplyBody({ sentText: 'x', koreanText: 'A & B <c>', quoted: [] })).toBe('A &amp; B &lt;c&gt;');
  });

  it('꾸민 글: 이름표 AI 응대, 막대 없음, 멘션 없음. 글자만 문구에는 머리말이 붙는다', () => {
    const args = { sentText: 'Hi', koreanText: '위치를 안내했습니다.', quoted: [] };
    const m = styledAiReply(args);
    expect(AI_LOOK).toEqual({ username: 'AI 응대', iconEmoji: ':speech_balloon:' });
    expect(m).toEqual({ ...AI_LOOK, text: '위치를 안내했습니다.', plainText: '💬 _AI 응대_\n위치를 안내했습니다.' });
    expect(buildAiReplyText(args)).toBe(m.plainText);
    expect(m.attachments).toBeUndefined();
  });
});

describe('AI 응대 요약 — 대화가 멈췄을 때 1개 (스펙 2026-10-22 §2)', () => {
  const base = { from: '2026-10-22T01:43:14Z', until: '2026-10-22T01:50:05Z', visitorMessages: 7, notes: [] };

  it('머리줄(시각 범위 · 손님 글 수) + 물은 것 · 답한 것 · 직원이 할 일', () => {
    expect(
      buildAiSummaryBody({
        ...base,
        summary: { asked: '울쎄라 가격, 예약 변경', answered: '부위별 가격 안내, 10/28 11시 가예약', todo: '가예약 확정 연락' },
      })
    ).toBe(
      '📝 *AI 응대 요약* · 10:43~10:50 · 손님 글 7개\n• 물은 것: 울쎄라 가격, 예약 변경\n• 답한 것: 부위별 가격 안내, 10/28 11시 가예약\n• 직원이 할 일: 가예약 확정 연락'
    );
  });

  it('할 일이 비어 있으면 그 줄을 빼고, 같은 분이면 시각을 하나만', () => {
    expect(
      buildAiSummaryBody({ ...base, until: base.from, visitorMessages: 1, summary: { asked: '위치', answered: '주소 안내', todo: ' ' } })
    ).toBe('📝 *AI 응대 요약* · 10:43 · 손님 글 1개\n• 물은 것: 위치\n• 답한 것: 주소 안내');
  });

  it('요약 실패: 머리줄에 표시하고 차례별 요지를 목록으로. 요지도 없으면 머리줄만. 특수문자 이스케이프', () => {
    expect(buildAiSummaryBody({ ...base, summary: null, notes: ['가격을 안내했습니다.', ' ', 'A <b>'] })).toBe(
      '📝 *AI 응대 요약* · 10:43~10:50 · 손님 글 7개 · 자동 요약 실패 — 차례별 요지\n• 가격을 안내했습니다.\n• A &lt;b&gt;'
    );
    expect(buildAiSummaryBody({ ...base, summary: null, notes: [] })).toBe(
      '📝 *AI 응대 요약* · 10:43~10:50 · 손님 글 7개 · 자동 요약 실패 — 차례별 요지'
    );
  });

  it('꾸민 글: AI 응대 이름표, 막대 · 멘션 없음, 글자만 문구도 같은 본문', () => {
    const m = styledAiSummary({ ...base, summary: { asked: 'a', answered: 'b', todo: '' } });
    expect(m).toEqual({ ...AI_LOOK, text: m.plainText, plainText: '📝 *AI 응대 요약* · 10:43~10:50 · 손님 글 7개\n• 물은 것: a\n• 답한 것: b' });
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
