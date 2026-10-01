import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../broadcast', () => ({ broadcastToSession: vi.fn().mockResolvedValue(undefined) }));

import { broadcastToSession } from '../broadcast';
import {
  currentPromotionSlug,
  eventHintUrl,
  EVENT_HINT_REPEAT_MS,
  EVENT_HINT_STAFF_ACTIVE_MS,
  kstDateKey,
  sendEventHintIfDue,
  shouldSendEventHint,
} from '../eventHint';
import { composeEventHintTexts, VISITOR_LOCALES } from '../serverI18n';
import { SITE_URL } from '@/lib/siteEnvironment';
import { fakeAdmin, hasFilter, hasFilterOp, type FakeOp, type FakeResult } from './fakeAdmin';

describe('currentPromotionSlug — 한국 시각의 연·월', () => {
  it('한국 시각 기준으로 달을 정한다 (UTC 9/30 15:00 = 한국 10/1 00:00)', () => {
    expect(currentPromotionSlug(new Date('2026-09-30T14:59:59Z'))).toBe('2026-09-promotion');
    expect(currentPromotionSlug(new Date('2026-09-30T15:00:00Z'))).toBe('2026-10-promotion');
  });
  it('해가 바뀌는 날', () => {
    expect(currentPromotionSlug(new Date('2026-12-31T15:00:00Z'))).toBe('2027-01-promotion');
  });
  it('kstDateKey 도 한국 날짜', () => {
    expect(kstDateKey(new Date('2026-09-30T15:00:00Z'))).toBe('2026-10-01');
  });
});

describe('eventHintUrl', () => {
  it('이번 달 프로모션이 있으면 상세, 없으면 목록 — 10개 로케일', () => {
    for (const locale of VISITOR_LOCALES) {
      expect(eventHintUrl(locale, '2026-10-promotion')).toBe(`${SITE_URL}/${locale}/events/2026-10-promotion`);
      expect(eventHintUrl(locale, null)).toBe(`${SITE_URL}/${locale}/events`);
    }
  });
  it('주소는 https 로 시작하고 끝에 /가 겹치지 않는다', () => {
    expect(eventHintUrl('en', null)).toMatch(/^https:\/\/[^/]+\/en\/events$/);
  });
});

describe('shouldSendEventHint', () => {
  const now = new Date('2026-10-05T03:00:00Z');
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

  it('처음이면 보낸다', () => {
    expect(shouldSendEventHint({ eventHintAt: null, lastStaffAt: null }, now)).toBe(true);
  });
  it('12시간 이내에 보냈으면 보내지 않고, 12시간보다 오래됐으면 다시 보낸다', () => {
    expect(shouldSendEventHint({ eventHintAt: ago(60_000), lastStaffAt: null }, now)).toBe(false);
    expect(shouldSendEventHint({ eventHintAt: ago(EVENT_HINT_REPEAT_MS), lastStaffAt: null }, now)).toBe(false);
    expect(shouldSendEventHint({ eventHintAt: ago(EVENT_HINT_REPEAT_MS + 1), lastStaffAt: null }, now)).toBe(true);
  });
  it('직원 글이 10분 안에 있으면 보내지 않는다 — 직원이 바로 답한다', () => {
    expect(shouldSendEventHint({ eventHintAt: null, lastStaffAt: ago(9 * 60_000) }, now)).toBe(false);
    expect(shouldSendEventHint({ eventHintAt: null, lastStaffAt: ago(EVENT_HINT_STAFF_ACTIVE_MS) }, now)).toBe(true);
  });
});

describe('composeEventHintTexts', () => {
  const url = 'https://liv-clinic.net/en/events/2026-10-promotion';

  it('10개 로케일 × 2종 문장이 비어 있지 않고 서로 다르며, 줄바꿈 뒤 링크로 끝난다', () => {
    for (const locale of VISITOR_LOCALES) {
      const promo = composeEventHintTexts(locale, 'promotion', url);
      const list = composeEventHintTexts(locale, 'list', url);
      for (const t of [promo, list]) {
        expect(t.localized.endsWith(`\n${url}`)).toBe(true);
        expect(t.ko.endsWith(`\n${url}`)).toBe(true);
        expect(t.localized.split('\n')).toHaveLength(2);
        expect(t.localized.split('\n')[0].trim().length).toBeGreaterThan(10);
      }
      expect(promo.localized).not.toBe(list.localized);
    }
  });

  it('한국어 원문: 프로모션이면 "이번 달 프로모션", 목록이면 "진행 중인 이벤트"', () => {
    expect(composeEventHintTexts('en', 'promotion', url).ko).toBe(
      `가격은 상담 직원이 확인한 뒤 정확히 안내드리겠습니다. 이번 달 프로모션은 아래에서 보실 수 있습니다.\n${url}`
    );
    expect(composeEventHintTexts('en', 'list', url).ko).toBe(
      `가격은 상담 직원이 확인한 뒤 정확히 안내드리겠습니다. 진행 중인 이벤트는 아래에서 보실 수 있습니다.\n${url}`
    );
  });

  it('원장님이 확인한 영어·일본어·중국어 문장', () => {
    expect(composeEventHintTexts('en', 'promotion', url).localized.split('\n')[0]).toBe(
      "Our consultants will confirm the exact price and get back to you. You can see this month's promotion here:"
    );
    expect(composeEventHintTexts('ja', 'list', url).localized.split('\n')[0]).toBe(
      '料金はスタッフが確認のうえ、正確にご案内いたします。実施中のイベントはこちらからご覧いただけます。'
    );
    expect(composeEventHintTexts('zh', 'promotion', url).localized.split('\n')[0]).toBe(
      '具体价格将由咨询人员确认后为您准确说明。本月优惠活动可在此查看：'
    );
    expect(composeEventHintTexts('zh-TW', 'promotion', url).localized.split('\n')[0]).toBe(
      '確切價格將由諮詢人員確認後為您準確說明。本月優惠活動可在此查看：'
    );
  });

  it('문장에 가격·할인율 숫자를 넣지 않는다', () => {
    for (const locale of VISITOR_LOCALES) {
      for (const kind of ['promotion', 'list'] as const) {
        expect(composeEventHintTexts(locale, kind, url).localized.split('\n')[0]).not.toMatch(/[0-9%]/);
      }
    }
  });
});

describe('sendEventHintIfDue', () => {
  const SESSION_ID = '11111111-2222-3333-4444-555555555555';
  // 2026-10-05(월) 12:00 KST
  const NOW = new Date('2026-10-05T03:00:00Z');
  const PRICE_TEXT = 'How much is Ulthera?';

  interface Scenario {
    session?: FakeResult;
    lastStaff?: FakeResult;
    promo?: FakeResult;
    claim?: FakeResult;
    insert?: FakeResult;
  }

  function adminFor(s: Scenario = {}) {
    return fakeAdmin((op: FakeOp) => {
      if (op.table === 'chat_sessions' && op.op === 'select') {
        return s.session ?? { data: { id: SESSION_ID, visitor_locale: 'en', event_hint_at: null } };
      }
      if (op.table === 'chat_messages' && op.op === 'select') return s.lastStaff ?? { data: null };
      if (op.table === 'events') return s.promo ?? { data: { slug: '2026-10-promotion' } };
      if (op.table === 'chat_sessions' && op.op === 'update') return s.claim ?? { data: [{ id: SESSION_ID }] };
      if (op.table === 'chat_messages' && op.op === 'insert') return s.insert ?? { data: { id: 'm-hint' } };
      return { data: null };
    });
  }

  const insertOf = (admin: ReturnType<typeof fakeAdmin>) =>
    admin.ops.find((o) => o.table === 'chat_messages' && o.op === 'insert');

  beforeEach(() => {
    delete process.env.CHAT_EVENT_HINT;
    vi.mocked(broadcastToSession).mockClear();
  });
  afterEach(() => {
    delete process.env.CHAT_EVENT_HINT;
    vi.restoreAllMocks();
  });

  it('가격 낱말이 없으면 DB를 건드리지 않는다', async () => {
    const admin = adminFor();
    expect(await sendEventHintIfDue(admin as never, SESSION_ID, 'I want to book next week', NOW)).toEqual({
      outcome: 'not_due',
    });
    expect(admin.ops).toHaveLength(0);
  });

  it('CHAT_EVENT_HINT=off 면 DB를 건드리지 않는다', async () => {
    process.env.CHAT_EVENT_HINT = 'off';
    const admin = adminFor();
    expect(await sendEventHintIfDue(admin as never, SESSION_ID, PRICE_TEXT, NOW)).toEqual({ outcome: 'not_due' });
    expect(admin.ops).toHaveLength(0);
  });

  it('보냄: 이번 달 프로모션 링크로, 자동 안내와 같은 꼴로 INSERT', async () => {
    const admin = adminFor();
    const url = `${SITE_URL}/en/events/2026-10-promotion`;
    expect(await sendEventHintIfDue(admin as never, SESSION_ID, PRICE_TEXT, NOW)).toEqual({ outcome: 'sent', url });

    const expected = composeEventHintTexts('en', 'promotion', url);
    expect(insertOf(admin)?.payload).toMatchObject({
      session_id: SESSION_ID,
      sender: 'operator',
      source: 'auto',
      sender_label: '자동 안내',
      original_lang: 'ko',
      original_text: expected.ko,
      translated_text: expected.localized,
      translated_lang: 'en',
      translation_status: 'success',
    });
    const payload = insertOf(admin)?.payload as { original_text: string; translated_text: string };
    expect(payload.original_text.endsWith(url)).toBe(true);
    expect(payload.translated_text.endsWith(url)).toBe(true);
    expect(broadcastToSession).toHaveBeenCalledWith(SESSION_ID, {
      type: 'message_created',
      payload: { messageId: 'm-hint', sender: 'operator' },
    });
  });

  it('이번 달 프로모션은 주소(slug)·게시 여부·종료일(한국 날짜)로 찾는다', async () => {
    const admin = adminFor();
    await sendEventHintIfDue(admin as never, SESSION_ID, PRICE_TEXT, NOW);
    const promoQuery = admin.ops.find((o) => o.table === 'events');
    expect(promoQuery && hasFilter(promoQuery, 'slug', '2026-10-promotion')).toBe(true);
    expect(promoQuery && hasFilter(promoQuery, 'is_published', true)).toBe(true);
    expect(promoQuery?.filters).toContainEqual(['end_date', 'gte', '2026-10-05']);
  });

  it('마지막 직원 글은 자동 안내를 빼고 찾는다 (source 가 app·slack)', async () => {
    const admin = adminFor();
    await sendEventHintIfDue(admin as never, SESSION_ID, PRICE_TEXT, NOW);
    const staffQuery = admin.ops.find((o) => o.table === 'chat_messages' && o.op === 'select');
    expect(staffQuery && hasFilter(staffQuery, 'sender', 'operator')).toBe(true);
    expect(staffQuery && hasFilterOp(staffQuery, 'source', 'in')).toBe(true);
    expect(staffQuery?.filters).toContainEqual(['source', 'in', ['app', 'slack']]);
  });

  it('이번 달 프로모션이 아직 없으면 이벤트 목록 링크로 보낸다', async () => {
    const admin = adminFor({ promo: { data: null }, session: { data: { id: SESSION_ID, visitor_locale: 'ja', event_hint_at: null } } });
    const url = `${SITE_URL}/ja/events`;
    expect(await sendEventHintIfDue(admin as never, SESSION_ID, 'ウルセラの料金を教えてください', NOW)).toEqual({
      outcome: 'sent',
      url,
    });
    expect((insertOf(admin)?.payload as { translated_text: string }).translated_text).toBe(
      composeEventHintTexts('ja', 'list', url).localized
    );
  });

  it('프로모션 조회가 실패해도 목록 링크로 보낸다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const admin = adminFor({ promo: { error: { code: '57014' } } });
    expect(await sendEventHintIfDue(admin as never, SESSION_ID, PRICE_TEXT, NOW)).toEqual({
      outcome: 'sent',
      url: `${SITE_URL}/en/events`,
    });
    expect(warn).toHaveBeenCalled();
  });

  it('12시간 안에 이미 보냈으면 보내지 않는다', async () => {
    const admin = adminFor({
      session: { data: { id: SESSION_ID, visitor_locale: 'en', event_hint_at: '2026-10-05T01:00:00Z' } },
    });
    expect(await sendEventHintIfDue(admin as never, SESSION_ID, PRICE_TEXT, NOW)).toEqual({ outcome: 'not_due' });
    expect(insertOf(admin)).toBeUndefined();
    expect(admin.ops.some((o) => o.op === 'update')).toBe(false);
  });

  it('직원이 10분 안에 답한 대화면 보내지 않는다', async () => {
    const admin = adminFor({ lastStaff: { data: { created_at: '2026-10-05T02:55:00Z' } } });
    expect(await sendEventHintIfDue(admin as never, SESSION_ID, PRICE_TEXT, NOW)).toEqual({ outcome: 'not_due' });
    expect(insertOf(admin)).toBeUndefined();
  });

  it('선점이 0행이면 lost_race — INSERT 하지 않는다', async () => {
    const admin = adminFor({ claim: { data: [] } });
    expect(await sendEventHintIfDue(admin as never, SESSION_ID, PRICE_TEXT, NOW)).toEqual({ outcome: 'lost_race' });
    expect(insertOf(admin)).toBeUndefined();
  });

  it('선점은 읽은 값이 그대로일 때만 — 처음이면 IS NULL, 다시 보낼 때는 읽은 시각과 같을 때', async () => {
    const first = adminFor();
    await sendEventHintIfDue(first as never, SESSION_ID, PRICE_TEXT, NOW);
    const firstClaim = first.ops.find((o) => o.table === 'chat_sessions' && o.op === 'update');
    expect(firstClaim?.filters).toContainEqual(['event_hint_at', 'is', null]);
    expect(firstClaim?.payload).toEqual({ event_hint_at: NOW.toISOString() });

    const old = '2026-10-04T10:00:00Z';
    const again = adminFor({ session: { data: { id: SESSION_ID, visitor_locale: 'en', event_hint_at: old } } });
    expect((await sendEventHintIfDue(again as never, SESSION_ID, PRICE_TEXT, NOW)).outcome).toBe('sent');
    const againClaim = again.ops.find((o) => o.table === 'chat_sessions' && o.op === 'update');
    expect(againClaim?.filters).toContainEqual(['event_hint_at', 'eq', old]);
  });

  it('세션 조회 오류(042 미적용 등)는 error — throw 하지 않는다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const admin = adminFor({ session: { error: { code: '42703' } } });
    expect(await sendEventHintIfDue(admin as never, SESSION_ID, PRICE_TEXT, NOW)).toEqual({ outcome: 'error' });
    expect(insertOf(admin)).toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });

  it('선점 오류도 error — INSERT 하지 않는다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const admin = adminFor({ claim: { error: { code: '42703' } } });
    expect(await sendEventHintIfDue(admin as never, SESSION_ID, PRICE_TEXT, NOW)).toEqual({ outcome: 'error' });
    expect(insertOf(admin)).toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });

  it('세션이 없으면 not_due', async () => {
    const admin = adminFor({ session: { data: null } });
    expect(await sendEventHintIfDue(admin as never, SESSION_ID, PRICE_TEXT, NOW)).toEqual({ outcome: 'not_due' });
  });
});
