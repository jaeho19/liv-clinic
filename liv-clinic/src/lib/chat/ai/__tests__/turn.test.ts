import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../openai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../openai')>()),
  callChatAi: vi.fn(),
}));
vi.mock('@/lib/chat/broadcast', () => ({ broadcastToSession: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/chat/contactService', () => ({ saveVisitorContact: vi.fn().mockResolvedValue({ ok: true }) }));

import { broadcastToSession } from '@/lib/chat/broadcast';
import { _resetBusinessHoursForTesting } from '@/lib/chat/businessHours';
import { saveVisitorContact } from '@/lib/chat/contactService';
import { _resetRateLimitForTesting } from '@/lib/chat/rateLimit';
import { fakeAdmin, hasFilter, type FakeOp, type FakeResult } from '@/lib/chat/__tests__/fakeAdmin';
import { getKnowledge } from '../knowledge';
import { callChatAi, type AiMessage } from '../openai';
import { AI_SENDER_LABEL, decideAiTurn, runAiTurn, type AiTurnContext } from '../turn';

const callAi = vi.mocked(callChatAi);
const saveContact = vi.mocked(saveVisitorContact);

const SESSION_ID = '11111111-2222-3333-4444-555555555555';
const NOW = new Date('2026-10-02T16:20:00+09:00'); // 금요일, 상담 시간 중
const K = getKnowledge('en', NOW);
const THERMAGE = K.rows.find((r) => r.key === 'thermage.name.shot600')!.id;

const CTX: AiTurnContext = {
  sessionId: SESSION_ID,
  locale: 'en',
  visitorEmail: null,
  messengerChannel: null,
  messengerHandle: null,
  sessionContact: null,
  handoffAt: null,
  offersOn: false,
};

const SESSION_ROW = {
  id: SESSION_ID,
  visitor_locale: 'en',
  visitor_name: 'Emma',
  visitor_email: null,
  visitor_messenger_channel: null,
  visitor_messenger_handle: null,
  staff_engaged_at: null,
  ai_handoff_at: null,
};

const ok = (output: Record<string, unknown>) => ({
  ok: true as const,
  content: JSON.stringify(output),
  latencyMs: 3700,
  usage: { promptTokens: 9600, cachedTokens: 9000, completionTokens: 200 },
});

interface World {
  /** 시간순 */
  messages: Array<Record<string, unknown>>;
  booking: Record<string, unknown> | null;
  turns: Array<Record<string, unknown>>;
  /** 손님 글만, 최신순 — 답을 버릴지 볼 때 읽는다 */
  recentVisitor: Array<{ id: string; original_text: string }>;
  engagedAt: string | null;
  override?: (op: FakeOp) => FakeResult | undefined;
}

const world = (patch: Partial<World> = {}): World => ({
  messages: [{ id: 'v-1', sender: 'visitor', source: 'app', original_text: 'Hello', translated_text: null }],
  booking: null,
  turns: [],
  recentVisitor: [{ id: 'v-1', original_text: 'Hello' }],
  engagedAt: null,
  ...patch,
});

function adminFor(w: World) {
  return fakeAdmin((op) => {
    const custom = w.override?.(op);
    if (custom) return custom;
    if (op.table === 'chat_messages' && op.op === 'select') {
      if (hasFilter(op, 'sender', 'visitor')) return { data: w.recentVisitor };
      return { data: [...w.messages].reverse() }; // DB는 최신순으로 돌려준다
    }
    if (op.table === 'chat_messages' && op.op === 'insert') return { data: { id: 'm-ai' } };
    if (op.table === 'chat_bookings' && op.op === 'select') return { data: w.booking };
    if (op.table === 'chat_ai_turns' && op.op === 'select') return { data: w.turns };
    if (op.table === 'chat_sessions' && op.op === 'select') return { data: { staff_engaged_at: w.engagedAt } };
    return { data: null };
  });
}

const run = (admin: ReturnType<typeof fakeAdmin>, text = 'Hello', ctx: AiTurnContext = CTX) =>
  runAiTurn(admin as never, { ctx, triggerMessageId: 'v-1', text, now: NOW });
const opsOf = (admin: ReturnType<typeof fakeAdmin>, table: string, kind: FakeOp['op']) =>
  admin.ops.filter((o) => o.table === table && o.op === kind);
const turnLog = (admin: ReturnType<typeof fakeAdmin>) =>
  opsOf(admin, 'chat_ai_turns', 'insert')[0]?.payload as Record<string, unknown> | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  saveContact.mockResolvedValue({ ok: true });
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.CHAT_AI = 'on';
  process.env.CHAT_CLOSED_DATES = '2026-10-05,2026-10-15';
  _resetBusinessHoursForTesting();
  _resetRateLimitForTesting();
});
afterEach(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.CHAT_AI;
  delete process.env.CHAT_CLOSED_DATES;
  delete process.env.CHAT_AI_MAX_REPLIES;
  _resetBusinessHoursForTesting();
  vi.restoreAllMocks();
});

describe('decideAiTurn', () => {
  const decideAdmin = (session: Record<string, unknown> | null, counts = { session: 0, daily: 0 }, error = false) =>
    fakeAdmin((op) => {
      if (op.table === 'chat_sessions') return error ? { error: { code: '42703' } } : { data: session };
      if (op.table === 'chat_ai_turns') {
        return { count: hasFilter(op, 'session_id', SESSION_ID) ? counts.session : counts.daily };
      }
      return { data: null };
    });

  it('스위치가 꺼져 있으면 DB를 건드리지 않고 off', async () => {
    delete process.env.CHAT_AI;
    const admin = decideAdmin(SESSION_ROW);
    expect(await decideAiTurn(admin as never, SESSION_ID, 'Hello', NOW)).toEqual({ run: false, reason: 'off', ctx: null });
    expect(admin.ops).toHaveLength(0);
  });

  it('키가 없으면 DB를 건드리지 않는다', async () => {
    const admin = decideAdmin(SESSION_ROW);
    delete process.env.OPENAI_API_KEY;
    expect(await decideAiTurn(admin as never, SESSION_ID, 'Hello', NOW)).toEqual({ run: false, reason: 'no_key', ctx: null });
    expect(admin.ops).toHaveLength(0);
  });

  it('내용이 없는 글(이모지·문장부호뿐)에는 답하지 않는다 — AI가 맡은 대화라는 것은 ctx 로 알린다', async () => {
    const admin = decideAdmin(SESSION_ROW);
    expect(await decideAiTurn(admin as never, SESSION_ID, '👍', NOW)).toEqual({ run: false, reason: 'no_substance', ctx: CTX });
    expect(opsOf(admin, 'chat_ai_turns', 'select')).toHaveLength(0);
  });

  it('직원이 맡은 대화 · 시험 대상이 아닌 대화의 이모지 글은 no_substance 가 아니다 (지금 방식대로 다룬다)', async () => {
    const engaged = decideAdmin({ ...SESSION_ROW, staff_engaged_at: '2026-10-02T07:00:00Z' });
    expect(await decideAiTurn(engaged as never, SESSION_ID, '👍', NOW)).toMatchObject({ run: false, reason: 'staff_engaged' });
    process.env.CHAT_AI = 'test';
    expect(await decideAiTurn(decideAdmin(SESSION_ROW) as never, SESSION_ID, '👍', NOW)).toMatchObject({
      run: false,
      reason: 'off',
    });
  });

  it('세션 조회가 실패하면(043 미적용) error — throw 하지 않는다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const admin = decideAdmin(null, undefined, true);
    expect(await decideAiTurn(admin as never, SESSION_ID, 'Hello', NOW)).toEqual({ run: false, reason: 'error', ctx: null });
    expect(warn).toHaveBeenCalled();
  });

  it('조건이 맞으면 AI가 답한다 — 세션의 연락처를 함께 돌려준다', async () => {
    const admin = decideAdmin({ ...SESSION_ROW, visitor_email: 'emma@example.com', ai_handoff_at: '2026-10-02T07:00:00Z' });
    expect(await decideAiTurn(admin as never, SESSION_ID, 'Hello', NOW)).toEqual({
      run: true,
      ctx: {
        ...CTX,
        visitorEmail: 'emma@example.com',
        sessionContact: { channel: 'email', handle: 'emma@example.com' },
        handoffAt: '2026-10-02T07:00:00Z',
      },
    });
  });

  it('시험 모드에서는 이름이 ai-test 로 시작하는 문의만', async () => {
    process.env.CHAT_AI = 'test';
    expect((await decideAiTurn(decideAdmin(SESSION_ROW) as never, SESSION_ID, 'Hello', NOW)).run).toBe(false);
    const admin = decideAdmin({ ...SESSION_ROW, visitor_name: 'ai-test-1002' });
    expect((await decideAiTurn(admin as never, SESSION_ID, 'Hello', NOW)).run).toBe(true);
  });

  it('제안형 응대(CHAT_AI_OFFERS): on 이면 모든 문의, test 면 이름이 ai-test 로 시작하는 문의만 — AI 스위치와 따로 정한다', async () => {
    const offersOf = async (name: string) =>
      (await decideAiTurn(decideAdmin({ ...SESSION_ROW, visitor_name: name }) as never, SESSION_ID, 'Hello', NOW)).ctx?.offersOn;
    try {
      expect(await offersOf('Emma')).toBe(false);
      process.env.CHAT_AI_OFFERS = 'test';
      expect(await offersOf('Emma')).toBe(false);
      expect(await offersOf('ai-test-1021')).toBe(true);
      process.env.CHAT_AI_OFFERS = 'on';
      expect(await offersOf('Emma')).toBe(true);
    } finally {
      delete process.env.CHAT_AI_OFFERS;
    }
  });

  it('직원이 맡은 대화에는 답하지 않는다 (호출 수도 세지 않는다)', async () => {
    const admin = decideAdmin({ ...SESSION_ROW, staff_engaged_at: '2026-10-02T07:00:00Z' });
    const d = await decideAiTurn(admin as never, SESSION_ID, 'Hello', NOW);
    expect(d).toMatchObject({ run: false, reason: 'staff_engaged' });
    expect(opsOf(admin, 'chat_ai_turns', 'select')).toHaveLength(0);
  });

  it('대화당 한도 · 하루 한도', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await decideAiTurn(decideAdmin(SESSION_ROW, { session: 30, daily: 40 }) as never, SESSION_ID, 'Hello', NOW)).toMatchObject({
      run: false,
      reason: 'session_cap',
    });
    expect(await decideAiTurn(decideAdmin(SESSION_ROW, { session: 3, daily: 300 }) as never, SESSION_ID, 'Hello', NOW)).toMatchObject({
      run: false,
      reason: 'daily_cap',
    });
    expect(warn).toHaveBeenCalledTimes(1);
    process.env.CHAT_AI_MAX_REPLIES = '2';
    expect(
      (await decideAiTurn(decideAdmin(SESSION_ROW, { session: 2, daily: 2 }) as never, SESSION_ID, 'Hello', NOW)).run
    ).toBe(false);
  });

  it('하루 호출 수는 최근 24시간을 센다', async () => {
    const admin = decideAdmin(SESSION_ROW);
    await decideAiTurn(admin as never, SESSION_ID, 'Hello', NOW);
    const daily = opsOf(admin, 'chat_ai_turns', 'select').find((o) => !hasFilter(o, 'session_id', SESSION_ID))!;
    expect(daily.filters).toEqual([['created_at', 'gte', '2026-10-01T07:20:00.000Z']]);
  });

  it('대화당 한도는 그 대화에서 AI를 부른 횟수를 모두 센다 — 버린 답 · 대신한 답도 (글을 연달아 보내 하루 한도를 태우지 못하게)', async () => {
    const admin = decideAdmin(SESSION_ROW);
    await decideAiTurn(admin as never, SESSION_ID, 'Hello', NOW);
    const perSession = opsOf(admin, 'chat_ai_turns', 'select').find((o) => hasFilter(o, 'session_id', SESSION_ID))!;
    expect(perSession.filters).toEqual([['session_id', 'eq', SESSION_ID]]);
  });
});

describe('runAiTurn — 답이 나간다', () => {
  it('글을 저장하고(출처 ai · 이름표 AI 응대) 손님 화면에 알리고 기록을 남긴다', async () => {
    callAi.mockResolvedValue(ok({ reply: 'Hello! How can we help you today?', staff_note_ko: '인사에 답했습니다.' }));
    const admin = adminFor(world());
    const out = await run(admin);

    expect(out).toMatchObject({
      kind: 'sent',
      messageId: 'm-ai',
      text: 'Hello! How can we help you today?',
      staffNoteKo: '인사에 답했습니다.',
      usedRows: [],
      bookingEvent: null,
      needsStaff: false,
      contactSaved: null,
    });
    expect(opsOf(admin, 'chat_messages', 'insert')[0].payload).toEqual({
      session_id: SESSION_ID,
      sender: 'operator',
      sender_admin_id: null,
      original_text: 'Hello! How can we help you today?',
      original_lang: 'ko',
      translated_text: 'Hello! How can we help you today?',
      translated_lang: 'en',
      translation_status: 'success',
      translation_latency_ms: 3700,
      source: 'ai',
      sender_label: AI_SENDER_LABEL,
    });
    expect(broadcastToSession).toHaveBeenCalledWith(SESSION_ID, {
      type: 'message_created',
      payload: { messageId: 'm-ai', sender: 'operator' },
    });
    expect(turnLog(admin)).toMatchObject({
      session_id: SESSION_ID,
      trigger_message_id: 'v-1',
      reply_message_id: 'm-ai',
      outcome: 'sent',
      model: 'gpt-6-sol',
      attempts: 1,
      latency_ms: 3700,
      prompt_tokens: 9600,
      cached_tokens: 9000,
      completion_tokens: 200,
      history_text: 'Hello! How can we help you today?',
      staff_note_ko: '인사에 답했습니다.',
      needs_staff: false,
      issues: null,
    });
    expect(opsOf(admin, 'chat_bookings', 'insert')).toHaveLength(0);
  });

  it('모델에는 지시문 + 대화 이력을 준다 — 마지막 차례는 손님 글', async () => {
    callAi.mockResolvedValue(ok({ reply: 'ok' }));
    const admin = adminFor(
      world({
        messages: [
          { id: 'v-0', sender: 'visitor', source: 'app', original_text: 'How much is Thermage?', translated_text: null },
          { id: 'a-0', sender: 'operator', source: 'ai', original_text: '번역', translated_text: '• Thermage: from KRW 2,400,000' },
          { id: 'v-1', sender: 'visitor', source: 'app', original_text: 'Oct 14 please', translated_text: null },
        ],
        turns: [{ reply_message_id: 'a-0', history_text: 'Prices:\n[price line shown: 써마지 레이저 · 600샷]' }],
        booking: {
          id: 'b-1',
          status: 'collecting',
          visit_date: null,
          visit_time: null,
          time_note: null,
          treatment: 'Thermage',
          treatment_ko: '써마지',
          party_size: null,
          visitor_name: null,
          contact_channel: null,
          contact_handle: null,
          arrival_date: null,
          departure_date: null,
          requested_at: null,
          notified_key: null,
        },
      })
    );
    await run(admin, 'Oct 14 please');
    const messages = callAi.mock.calls[0][0] as AiMessage[];
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('# PRICE ROWS (Korean; amounts exclude VAT)');
    expect(messages[0].content).toContain('2026-10-02 Fri 16:20 — the clinic is open right now.');
    expect(messages[0].content).toContain('# REPLY PROMISE\ntoday (Korea time)');
    expect(messages[0].content).toContain('treatment: Thermage');
    expect(messages[0].content).toContain('2026-10-05 Mon: CLOSED (clinic holiday)');
    expect(messages.slice(1)).toEqual([
      { role: 'user', content: 'How much is Thermage?' },
      { role: 'assistant', content: JSON.stringify({ reply: 'Prices:\n[price line shown: 써마지 레이저 · 600샷]' }) },
      { role: 'user', content: 'Oct 14 please' },
    ]);
  });

  it('꼬리표는 금액 줄이 되어 나가고, 기록에는 AI가 쓴 글과 금액 없는 이력용 글이 남는다', async () => {
    callAi.mockResolvedValue(ok({ reply: `Here is the price:\n{{${THERMAGE}}}\nWhich date suits you?`, staff_note_ko: '써마지 600샷 가격을 안내했습니다.' }));
    const admin = adminFor(world());
    const out = await run(admin, 'How much is Thermage 600?');
    if (out.kind !== 'sent') throw new Error('expected sent');
    expect(out.text.split('\n')).toEqual([
      'Here is the price:',
      '• Thermage Laser · 600 shots: from KRW 2,400,000 (KRW 2,640,000 incl. VAT)',
      'The exact amount is decided after your consultation with the doctor; the amounts above are approximate.',
      'Which date suits you?',
    ]);
    expect(out.usedRows.map((r) => r.key)).toEqual(['thermage.name.shot600']);
    expect(turnLog(admin)).toMatchObject({
      raw_reply: `Here is the price:\n{{${THERMAGE}}}\nWhich date suits you?`,
      history_text: 'Here is the price:\n[price line shown: 써마지 레이저 · 600샷]\nWhich date suits you?',
    });
  });

  it('직원 확인 필요와 사유를 그대로 넘긴다', async () => {
    callAi.mockResolvedValue(
      ok({ reply: 'We will send the exact price with your booking confirmation.', needs_staff: true, staff_reason_ko: '스컬트라 금액 문의' })
    );
    const out = await run(adminFor(world()), 'How much is Sculptra?');
    expect(out).toMatchObject({ kind: 'sent', needsStaff: true, staffReasonKo: '스컬트라 금액 문의' });
  });

  it('손님이 연락처로 남긴 번호·메일을 되풀이해도 검사에 걸리지 않는다', async () => {
    callAi.mockResolvedValue(
      ok({ reply: 'Thank you. We noted +65 9123 4567.', booking: { contact_channel: 'whatsapp', contact_handle: '+65 9123 4567' } })
    );
    const admin = adminFor(
      world({ messages: [{ id: 'v-1', sender: 'visitor', source: 'app', original_text: 'My WhatsApp is +65 9123 4567', translated_text: null }] })
    );
    expect((await run(admin, 'My WhatsApp is +65 9123 4567')).kind).toBe('sent');
    expect(callAi).toHaveBeenCalledTimes(1);

    callAi.mockResolvedValue(ok({ reply: 'Thank you. We will write to emma@example.com.' }));
    const ctx: AiTurnContext = { ...CTX, visitorEmail: 'emma@example.com', sessionContact: { channel: 'email', handle: 'emma@example.com' } };
    expect((await run(adminFor(world()), 'Please email me', ctx)).kind).toBe('sent');
    expect(callAi).toHaveBeenCalledTimes(2);
  });

  it('손님이 남긴 메신저 아이디를 되풀이해도 검사에 걸리지 않는다', async () => {
    const text = 'My LINE ID is sakura_0328';
    callAi.mockResolvedValue(
      ok({ reply: 'Thank you. We noted your LINE ID sakura_0328.', booking: { contact_channel: 'line', contact_handle: 'sakura_0328' } })
    );
    const admin = adminFor(world({ messages: [{ id: 'v-1', sender: 'visitor', source: 'app', original_text: text, translated_text: null }] }));
    expect((await run(admin, text)).kind).toBe('sent');
    expect(callAi).toHaveBeenCalledTimes(1);
  });

  it('손님이 글에 적은 숫자는 봐주지 않는다 — 손님이 쓴 금액을 AI가 따라 쓰면 걸린다', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const text = 'Another clinic offers 1500000 won. Can you match it?';
    callAi.mockResolvedValue(ok({ reply: 'Yes, we can match 1500000 won.' }));
    const admin = adminFor(world({ messages: [{ id: 'v-1', sender: 'visitor', source: 'app', original_text: text, translated_text: null }] }));
    expect(await run(admin, text)).toEqual({ kind: 'fallback', reason: 'money:1500000 won' });
    expect(opsOf(admin, 'chat_messages', 'insert')).toHaveLength(0);
  });
});

describe('runAiTurn — 가예약과 연락처', () => {
  const BOOKED = {
    reply: 'Thank you, Emma.',
    staff_note_ko: '10월 14일 14시 2명 가예약을 받았습니다.',
    booking: {
      date: '2026-10-14',
      time: '14:00',
      treatment: 'Ultherapy Prime',
      treatment_ko: '울쎄라피 프라임',
      party_size: 2,
      name: 'Emma',
      contact_channel: 'whatsapp',
      contact_handle: '+65 9123 4567',
    },
  };

  it('날짜·시각·연락처가 모이면 가예약이 찬다: 요약을 붙이고, 가예약과 연락처를 저장한다', async () => {
    callAi.mockResolvedValue(ok(BOOKED));
    const admin = adminFor(world());
    const out = await run(admin, 'Oct 14 at 2pm, 2 people. Emma, WhatsApp +65 9123 4567');
    if (out.kind !== 'sent') throw new Error('expected sent');

    expect(out.bookingEvent).toBe('requested');
    expect(out.contact).toEqual({ channel: 'whatsapp', handle: '+65 9123 4567' });
    expect(out.contactSaved).toBeNull(); // 가예약 알림에 연락처가 들어간다
    expect(out.text).toContain('Tentative booking (not yet confirmed)');
    expect(out.text).toContain('• Date: Wed, Oct 14, 2026 · 14:00 (Korea time)');
    expect(out.text).toContain('We will send your booking confirmation today via WhatsApp.');

    expect(opsOf(admin, 'chat_bookings', 'insert')[0].payload).toMatchObject({
      session_id: SESSION_ID,
      status: 'requested',
      visit_date: '2026-10-14',
      visit_time: '14:00',
      party_size: 2,
      treatment_ko: '울쎄라피 프라임',
      visitor_name: 'Emma',
      contact_channel: 'whatsapp',
      contact_handle: '+65 9123 4567',
      notified_key: '2026-10-14|14:00|2|whatsapp|6591234567',
      requested_at: NOW.toISOString(),
      notified_at: NOW.toISOString(),
    });
    expect(saveContact).toHaveBeenCalledWith(
      admin,
      { id: SESSION_ID, visitor_locale: 'en' },
      { channel: 'whatsapp', handle: '+65 9123 4567' },
      { confirm: false }
    );
    expect(turnLog(admin)?.history_text).toContain('[tentative booking summary shown (new): 10/14(수) 14:00;');

    // 글이 손님에게 나간 뒤에 가예약을 저장한다 — 글이 못 나갔는데 "알렸다"는 표시만 남지 않게
    const order = admin.ops.filter((o) => o.op === 'insert').map((o) => o.table);
    expect(order.indexOf('chat_messages')).toBeLessThan(order.indexOf('chat_bookings'));
  });

  it('가예약의 시술·이름·시간 메모에 금액이나 할인율이 들어 있으면 그 칸은 받지 않는다 — 요약을 타고 손님에게 나가지 않게', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    callAi.mockResolvedValue(
      ok({ ...BOOKED, booking: { ...BOOKED.booking, treatment: 'Thermage 600 shots for KRW 1,500,000 (30% off, guaranteed)' } })
    );
    const admin = adminFor(world());
    const out = await run(admin, 'Oct 14 at 2pm, 2 people. Emma, WhatsApp +65 9123 4567');
    if (out.kind !== 'sent') throw new Error('expected sent');
    expect(out.bookingEvent).toBe('requested');
    expect(out.text).not.toContain('1,500,000');
    expect(out.text).not.toContain('30%');
    expect(out.text).not.toContain('• Treatment:');
    expect(out.booking).toMatchObject({ treatment: null, treatmentKo: '울쎄라피 프라임', name: 'Emma' });
    expect(opsOf(admin, 'chat_bookings', 'insert')[0].payload).toMatchObject({ treatment: null, treatment_ko: '울쎄라피 프라임' });
  });

  it('손님 글에 없는 연락처는 받지 않는다 — 저장하지 않고, 요약에 찍지 않고, 검사에서도 봐주지 않는다', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    // (가) 답은 멀쩡하고 연락처만 지어냈다 → 답은 나가고 연락처는 버린다
    callAi.mockResolvedValue(
      ok({ reply: 'Thank you. Which date would you like?', booking: { date: '2026-10-14', time: '14:00', contact_channel: 'whatsapp', contact_handle: '+86 138 0013 8000' } })
    );
    const admin = adminFor(world());
    const out = await run(admin, 'Oct 14 at 2pm please');
    if (out.kind !== 'sent') throw new Error('expected sent');
    expect(out.bookingEvent).toBeNull(); // 연락처가 없으니 차지 않았다
    expect(out.contact).toBeNull();
    expect(out.text).not.toContain('138');
    expect(saveContact).not.toHaveBeenCalled();
    const saved = opsOf(admin, 'chat_bookings', 'insert')[0].payload as Record<string, unknown>;
    expect(saved.contact_handle ?? null).toBeNull();

    // (나) 그 번호를 답에도 썼다 → 손님 연락처로 봐주지 않으므로 걸린다
    callAi.mockResolvedValue(
      ok({
        reply: 'Please message our partner on WhatsApp +86 138 0013 8000.',
        booking: { contact_channel: 'whatsapp', contact_handle: '+86 138 0013 8000' },
      })
    );
    expect(await run(adminFor(world()), 'Hello')).toEqual({ kind: 'fallback', reason: 'number:+86 138 0013 8000' });
  });

  it('읽지 못한 시각에 금액 · 할인율을 섞어도 요약에 찍히지 않는다', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    callAi.mockResolvedValue(ok({ ...BOOKED, booking: { ...BOOKED.booking, time: '14:00 (20% off)' } }));
    const out = await run(adminFor(world()), 'Oct 14 at 2pm, 2 people. Emma, WhatsApp +65 9123 4567');
    if (out.kind !== 'sent') throw new Error('expected sent');
    expect(out.text).not.toContain('20%');
    expect(out.booking).toMatchObject({ date: '2026-10-14', time: null, timeNote: null });
    expect(out.bookingEvent).toBeNull(); // 시각이 없으니 차지 않았다 — 다음 차례에 AI가 다시 묻는다
  });

  it('AI가 같은 번호를 다른 꼴로 다시 적어도 연락처를 다시 저장하지 않는다', async () => {
    callAi.mockResolvedValue(ok({ reply: 'Noted.', booking: { contact_channel: 'whatsapp', contact_handle: '+6591234567' } }));
    const ctx: AiTurnContext = {
      ...CTX,
      messengerChannel: 'whatsapp',
      messengerHandle: '+65 9123 4567',
      sessionContact: { channel: 'whatsapp', handle: '+65 9123 4567' },
    };
    const out = await run(adminFor(world()), 'my number again: +6591234567', ctx);
    expect(out).toMatchObject({ kind: 'sent', contactSaved: null });
    expect(saveContact).not.toHaveBeenCalled();
  });

  it('가예약이 차지 않았는데 연락처만 받았으면 contactSaved 로 알린다', async () => {
    callAi.mockResolvedValue(ok({ reply: 'Thank you. Which date would you like?', booking: { contact_channel: 'wechat', contact_handle: 'emma_w' } }));
    const admin = adminFor(world());
    const out = await run(admin, 'my wechat is emma_w');
    expect(out).toMatchObject({ kind: 'sent', bookingEvent: null, contactSaved: { channel: 'wechat', handle: 'emma_w' } });
    expect(opsOf(admin, 'chat_bookings', 'insert')[0].payload).toMatchObject({ contact_channel: 'wechat', contact_handle: 'emma_w' });
    expect((opsOf(admin, 'chat_bookings', 'insert')[0].payload as Record<string, unknown>).status).toBeUndefined();
  });

  it('세션에 이미 같은 연락처가 있으면 다시 저장하지 않는다', async () => {
    callAi.mockResolvedValue(ok({ reply: 'Noted.', booking: { contact_channel: 'email', contact_handle: 'Emma@Example.com' } }));
    const ctx: AiTurnContext = {
      ...CTX,
      visitorEmail: 'emma@example.com',
      sessionContact: { channel: 'email', handle: 'emma@example.com' },
    };
    const out = await run(adminFor(world()), 'emma@example.com', ctx);
    expect(out).toMatchObject({ kind: 'sent', contactSaved: null });
    expect(saveContact).not.toHaveBeenCalled();
  });

  it('세션에 저장된 연락처만으로도 가예약이 찬다 (카드에서 남긴 연락처)', async () => {
    callAi.mockResolvedValue(ok({ reply: 'Thank you.', booking: { date: '2026-10-14', time: '14:00' } }));
    const ctx: AiTurnContext = {
      ...CTX,
      messengerChannel: 'wechat',
      messengerHandle: 'emma_w',
      sessionContact: { channel: 'wechat', handle: 'emma_w' },
    };
    const admin = adminFor(world());
    const out = await run(admin, 'Oct 14 at 2pm', ctx);
    expect(out).toMatchObject({ kind: 'sent', bookingEvent: 'requested', contact: { channel: 'wechat', handle: 'emma_w' } });
    expect(saveContact).not.toHaveBeenCalled();
    expect((opsOf(admin, 'chat_bookings', 'insert')[0].payload as Record<string, unknown>).notified_key).toBe(
      '2026-10-14|14:00||wechat|emma_w'
    );
  });

  it('찬 가예약의 날짜가 바뀌면 changed — 기존 줄을 고친다', async () => {
    callAi.mockResolvedValue(ok({ reply: 'Updated.', booking: { date: '2026-10-16' } }));
    const admin = adminFor(
      world({
        booking: {
          id: 'b-1',
          status: 'requested',
          visit_date: '2026-10-14',
          visit_time: '14:00',
          time_note: null,
          treatment: null,
          treatment_ko: null,
          party_size: 2,
          visitor_name: 'Emma',
          contact_channel: 'whatsapp',
          contact_handle: '+65 9123 4567',
          arrival_date: null,
          departure_date: null,
          requested_at: '2026-10-02T07:00:00Z',
          notified_key: '2026-10-14|14:00|2|whatsapp|6591234567',
        },
      })
    );
    const ctx: AiTurnContext = {
      ...CTX,
      messengerChannel: 'whatsapp',
      messengerHandle: '+65 9123 4567',
      sessionContact: { channel: 'whatsapp', handle: '+65 9123 4567' },
    };
    const out = await run(admin, 'Can we make it Oct 16 instead?', ctx);
    if (out.kind !== 'sent') throw new Error('expected sent');
    expect(out.bookingEvent).toBe('changed');
    expect(out.text).toContain('Updated tentative booking (not yet confirmed)');
    const update = opsOf(admin, 'chat_bookings', 'update')[0];
    expect(hasFilter(update, 'id', 'b-1')).toBe(true);
    expect(update.payload).toMatchObject({
      visit_date: '2026-10-16',
      status: 'requested',
      notified_key: '2026-10-16|14:00|2|whatsapp|6591234567',
    });
    expect((update.payload as Record<string, unknown>).requested_at).toBeUndefined(); // 처음 찬 시각은 그대로
    expect(saveContact).not.toHaveBeenCalled();
  });
});

describe('runAiTurn — 검사에 걸리면 한 번 다시 쓰게 한다', () => {
  it('금액을 직접 쓴 답 → 이유를 알려 다시 → 통과', async () => {
    callAi
      .mockResolvedValueOnce(ok({ reply: 'Thermage 600 shots is KRW 2,400,000.' }))
      .mockResolvedValueOnce(ok({ reply: `Here is the price:\n{{${THERMAGE}}}` }));
    const admin = adminFor(world());
    const out = await run(admin, 'How much is Thermage?');
    expect(out.kind).toBe('sent');
    expect(callAi).toHaveBeenCalledTimes(2);
    const second = callAi.mock.calls[1][0] as AiMessage[];
    expect(second[second.length - 2]).toEqual({ role: 'assistant', content: JSON.stringify({ reply: 'Thermage 600 shots is KRW 2,400,000.' }) });
    expect(second[second.length - 1].role).toBe('system');
    expect(second[second.length - 1].content).toContain('You typed an amount of money');
    // 다시 써서 나간 답에도 처음 걸린 이유를 남긴다 — 매주 점검에서 "왜 다시 썼는가"를 본다
    expect(turnLog(admin)).toMatchObject({ outcome: 'sent', attempts: 2, latency_ms: 7400, issues: ['money:KRW 2,400,000'] });
  });

  it('휴진일을 가예약으로 받으면 다시 쓰게 한다', async () => {
    callAi
      .mockResolvedValueOnce(ok({ reply: 'Noted for Oct 15.', booking: { date: '2026-10-15', time: '14:00' } }))
      .mockResolvedValueOnce(ok({ reply: 'October 15 is closed. Would October 14 or 16 work?' }));
    const out = await run(adminFor(world()), 'Oct 15 at 2pm');
    expect(out.kind).toBe('sent');
    const second = callAi.mock.calls[1][0] as AiMessage[];
    expect(second[second.length - 1].content).toContain('2026-10-15 is a closed day');
  });

  it('JSON 이 아니면 다시 쓰게 한다', async () => {
    callAi
      .mockResolvedValueOnce({ ok: true, content: 'Sure! Hello there', latencyMs: 100, usage: { promptTokens: 1, cachedTokens: 0, completionTokens: 1 } })
      .mockResolvedValueOnce(ok({ reply: 'Hello!' }));
    expect((await run(adminFor(world()))).kind).toBe('sent');
    expect((callAi.mock.calls[1][0] as AiMessage[]).pop()?.content).toContain('valid JSON');
  });

  it('두 번 다 걸리면 fallback — 글을 내보내지 않고 이유를 기록한다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    callAi.mockResolvedValue(ok({ reply: 'It is the best, KRW 500,000.' }));
    const admin = adminFor(world());
    const out = await run(admin);
    expect(out).toEqual({ kind: 'fallback', reason: 'money:KRW 500,000 | banned:best' });
    expect(callAi).toHaveBeenCalledTimes(2);
    expect(opsOf(admin, 'chat_messages', 'insert')).toHaveLength(0);
    expect(broadcastToSession).not.toHaveBeenCalled();
    expect(turnLog(admin)).toMatchObject({
      outcome: 'fallback',
      attempts: 2,
      reply_message_id: null,
      issues: ['money:KRW 500,000', 'banned:best'],
      raw_reply: JSON.stringify({ reply: 'It is the best, KRW 500,000.' }),
    });
    expect(warn).toHaveBeenCalled();
  });

  it('호출이 실패하면 한 번 더 부르고, 또 실패하면 fallback', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    callAi.mockResolvedValue({ ok: false, error: 'timeout', latencyMs: 100 });
    const admin = adminFor(world());
    expect(await run(admin)).toEqual({ kind: 'fallback', reason: 'call:timeout' });
    expect(callAi).toHaveBeenCalledTimes(2);
    expect(turnLog(admin)).toMatchObject({ outcome: 'fallback', issues: ['call:timeout'], raw_reply: null });
  });

  it('호출 실패 뒤 성공하면 답이 나간다', async () => {
    callAi.mockResolvedValueOnce({ ok: false, error: 'api_error', status: 500, latencyMs: 50 }).mockResolvedValueOnce(ok({ reply: 'Hello!' }));
    const admin = adminFor(world());
    expect((await run(admin)).kind).toBe('sent');
    expect(turnLog(admin)).toMatchObject({ outcome: 'sent', attempts: 2, issues: ['call:api_error'] });
  });
});

describe('runAiTurn — 답을 버리는 경우 · 오류', () => {
  it('더 새 손님 글이 있으면 superseded — 글을 내보내지 않는다', async () => {
    callAi.mockResolvedValue(ok({ reply: 'Hello!' }));
    const admin = adminFor(
      world({
        recentVisitor: [
          { id: 'v-2', original_text: 'And Thermage?' },
          { id: 'v-1', original_text: 'Hello' },
        ],
      })
    );
    expect(await run(admin)).toEqual({ kind: 'superseded' });
    expect(opsOf(admin, 'chat_messages', 'insert')).toHaveLength(0);
    expect(opsOf(admin, 'chat_bookings', 'insert')).toHaveLength(0);
    expect(turnLog(admin)).toMatchObject({ outcome: 'superseded' });
  });

  it('뒤따라온 글이 이모지·문장부호뿐이면 버리지 않는다 — 앞 글의 답이 나간다', async () => {
    callAi.mockResolvedValue(ok({ reply: 'Hello!' }));
    const admin = adminFor(
      world({
        recentVisitor: [
          { id: 'v-3', original_text: '!!' },
          { id: 'v-2', original_text: '🙏' },
          { id: 'v-1', original_text: 'Hello' },
        ],
      })
    );
    expect((await run(admin)).kind).toBe('sent');
    expect(opsOf(admin, 'chat_messages', 'insert')).toHaveLength(1);
  });

  it('답을 만드는 사이에 직원이 답했으면 superseded', async () => {
    callAi.mockResolvedValue(ok({ reply: 'Hello!' }));
    const admin = adminFor(world({ engagedAt: '2026-10-02T07:20:03Z' }));
    expect(await run(admin)).toEqual({ kind: 'superseded' });
    expect(broadcastToSession).not.toHaveBeenCalled();
  });

  it('버릴지 확인하는 조회가 실패하면 답을 내보내지 않고 fallback (직원이 답했는지 모르는 채로 내보내지 않는다)', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    callAi.mockResolvedValue(ok({ reply: 'Hello!' }));
    for (const failing of ['chat_messages', 'chat_sessions'] as const) {
      const admin = adminFor(
        world({
          override: (op) => {
            const supersedeRead =
              failing === 'chat_messages'
                ? op.table === 'chat_messages' && op.op === 'select' && hasFilter(op, 'sender', 'visitor')
                : op.table === 'chat_sessions' && op.op === 'select';
            return supersedeRead ? { error: { code: '57014' } } : undefined;
          },
        })
      );
      expect(await run(admin), failing).toEqual({ kind: 'fallback', reason: 'supersede_check_failed' });
      expect(opsOf(admin, 'chat_messages', 'insert'), failing).toHaveLength(0);
      expect(turnLog(admin), failing).toMatchObject({ outcome: 'fallback', issues: ['supersede_check:57014'] });
    }
  });

  it('대화 이력을 읽지 못하면 모델을 부르지 않고 fallback', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const admin = adminFor(
      world({ override: (op) => (op.table === 'chat_messages' && op.op === 'select' ? { error: { code: '57014' } } : undefined) })
    );
    expect(await run(admin)).toEqual({ kind: 'fallback', reason: 'context_read_failed' });
    expect(callAi).not.toHaveBeenCalled();
  });

  it('가예약 테이블을 읽지 못하면(043 미적용) fallback', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const admin = adminFor(
      world({ override: (op) => (op.table === 'chat_bookings' && op.op === 'select' ? { error: { code: '42P01' } } : undefined) })
    );
    expect(await run(admin)).toEqual({ kind: 'fallback', reason: 'context_read_failed' });
  });

  it('글 저장이 실패하면 fallback', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    callAi.mockResolvedValue(ok({ reply: 'Hello!' }));
    const admin = adminFor(
      world({ override: (op) => (op.table === 'chat_messages' && op.op === 'insert' ? { error: { code: '23514' } } : undefined) })
    );
    expect(await run(admin)).toEqual({ kind: 'fallback', reason: 'insert_failed' });
    expect(turnLog(admin)).toMatchObject({ outcome: 'fallback', issues: ['insert:23514'] });
  });

  it('글 저장이 실패하면 가예약도 연락처도 저장하지 않는다 — 다음 차례에 다시 알릴 수 있게', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    callAi.mockResolvedValue(
      ok({
        reply: 'Thank you, Emma.',
        booking: { date: '2026-10-14', time: '14:00', contact_channel: 'whatsapp', contact_handle: '+65 9123 4567' },
      })
    );
    const admin = adminFor(
      world({ override: (op) => (op.table === 'chat_messages' && op.op === 'insert' ? { error: { code: '23514' } } : undefined) })
    );
    expect((await run(admin)).kind).toBe('fallback');
    expect(opsOf(admin, 'chat_bookings', 'insert')).toHaveLength(0);
    expect(saveContact).not.toHaveBeenCalled();
  });

  it('기록 저장이 실패해도 답은 나간다', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    callAi.mockResolvedValue(ok({ reply: 'Hello!' }));
    const admin = adminFor(
      world({ override: (op) => (op.table === 'chat_ai_turns' && op.op === 'insert' ? { error: { code: '42P01' } } : undefined) })
    );
    expect((await run(admin)).kind).toBe('sent');
  });

  it('안에서 예외가 나도 throw 하지 않는다', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    callAi.mockRejectedValue(new Error('boom'));
    expect(await run(adminFor(world()))).toEqual({ kind: 'fallback', reason: 'exception' });
  });
});

describe('runAiTurn — 제안형 응대 (이 대화에 켜짐, 스펙 2026-10-12)', () => {
  const KO = getKnowledge('en', NOW, { offers: true });
  const C = (key: string) => KO.offers.find((o) => o.key === key)!.id;
  const T = (key: string) => KO.rows.find((r) => r.key === key)!.id;
  const EARLIER = { reply_message_id: 'm-0', history_text: 'Yes, we offer Sculptra.', shown_keys: ['benefit'], offer_declined: false };

  const OCTX: AiTurnContext = { ...CTX, offersOn: true };

  it('첫 답: 혜택 문장(5% + 피부관리 · 수액 조건)은 나가고 제안 줄은 지운다 — 지운 것과 반응을 기록한다', async () => {
    callAi.mockResolvedValue(
      ok({ reply: `Yes, we offer Sculptra.\n{{B01}}\n{{${C('sculptra.first')}}}\nWhen are you visiting?`, staff_note_ko: '스컬트라 안내', reaction: 'R1' })
    );
    const admin = adminFor(world());
    const out = await run(admin, 'Do you have Sculptra?', OCTX);
    expect(out.kind).toBe('sent');
    if (out.kind !== 'sent') return;
    expect(out.text).toBe(
      [
        'Yes, we offer Sculptra.',
        'If you book through this chat and pay at your visit, you get 5% off. If your payment that day is KRW 300,000 or more (excl. VAT), you can also have one complimentary skin-care session or IV drip per person — you choose which on the day (first-visit trial prices excluded).',
        'When are you visiting?',
      ].join('\n')
    );
    expect(out.usedOffers).toEqual([]);
    expect(turnLog(admin)).toMatchObject({
      shown_keys: ['benefit'],
      reaction: 'R1',
      offer_declined: false,
      offers_dropped: [`${C('sculptra.first')}:first_reply`],
    });
    // 지시문에 "첫 답" 상태와 제안 규칙이 들어간다
    const system = callAi.mock.calls[0][0][0].content;
    expect(system).toContain('# OFFER STATE\nThe direct-booking benefit ({{B01}}) has not been shown yet in this conversation.\nThis is your first reply');
    expect(system).toContain('# OFFER ROWS (Korean)');
  });

  it('두 번째 답(관심): 제안 줄이 나가고, 바로 앞 답에 있던 혜택 문장은 되풀이하지 않는다', async () => {
    callAi.mockResolvedValue(
      ok({ reply: `{{B01}}\n{{${C('sculptra.first')}}}\nWhat time works for you?`, staff_note_ko: '리프팅 구성 제안', reaction: 'R1' })
    );
    const admin = adminFor(world({ turns: [EARLIER] }));
    const out = await run(admin, 'Around Oct 20. How much is it?', OCTX);
    if (out.kind !== 'sent') throw new Error(out.kind);
    expect(out.text).toContain("Sculptra can be combined with a lifting treatment such as Ultherapy Prime or Thermage at the same consultation. This month's set:");
    expect(out.text).toContain('Which combination suits you is decided by the doctor at the consultation.');
    expect(out.text).not.toContain('If you book through this chat');
    expect(out.usedOffers.map((o) => o.key)).toEqual(['sculptra.first']);
    expect(turnLog(admin)).toMatchObject({ shown_keys: ['sculptra.first', 'promo.2026-10.19'], offers_dropped: ['B01:benefit_repeat'] });
  });

  it('손님이 거절하면(R5) 그 답의 제안도 지우고 거절을 기록한다 — 다음 차례 지시문은 "거절"', async () => {
    callAi.mockResolvedValue(
      ok({ reply: `Understood — Sculptra only.\n{{${C('sculptra.second')}}}`, reaction: 'R5', offer_declined: true })
    );
    const admin = adminFor(world({ turns: [EARLIER] }));
    const out = await run(admin, 'Just Sculptra for now.', OCTX);
    if (out.kind !== 'sent') throw new Error(out.kind);
    expect(out.text).toBe('Understood — Sculptra only.');
    expect(turnLog(admin)).toMatchObject({ offer_declined: true, offers_dropped: [`${C('sculptra.second')}:declined`] });

    callAi.mockClear();
    callAi.mockResolvedValue(ok({ reply: 'Noted.', reaction: 'R1' }));
    await run(adminFor(world({ turns: [{ ...EARLIER, offer_declined: true, shown_keys: [] }] })), 'What time?', OCTX);
    expect(callAi.mock.calls[0][0][0].content).toContain('The visitor declined suggestions');
  });

  it('가예약이 차면 요약 아래에 혜택 한 줄(조건까지)이 붙고, 같은 답의 혜택 문장은 지운다', async () => {
    callAi.mockResolvedValue(
      ok({
        reply: 'Thank you, Emma.\n{{B01}}',
        reaction: 'R7',
        booking: { date: '2026-10-14', time: '14:00', treatment: 'Thermage', party_size: 1, name: 'Emma', contact_channel: 'whatsapp', contact_handle: '+65 9123 4567' },
      })
    );
    const admin = adminFor(world({ messages: [{ id: 'v-1', sender: 'visitor', source: 'app', original_text: 'Oct 14 2pm Thermage, Emma, WhatsApp +65 9123 4567', translated_text: null }] }));
    const out = await run(admin, 'Oct 14 2pm Thermage, Emma, WhatsApp +65 9123 4567', OCTX);
    if (out.kind !== 'sent') throw new Error(out.kind);
    const lines = out.text.split('\n');
    expect(lines.filter((l) => l.startsWith('If you book through this chat'))).toEqual([]);
    expect(lines[lines.length - 2]).toMatch(/^Since you booked through this chat, you get 5% off when you pay at your visit\. If your payment that day is KRW 300,000/);
    expect(turnLog(admin)).toMatchObject({ shown_keys: ['benefit-line'], offers_dropped: ['B01:benefit_in_summary'] });
    // 가예약에 안내한 혜택을 남긴다 — Slack 파란 막대 · 관리자 화면의 "· 혜택:"
    expect(out.bookingBenefit).toBe('full');
    expect(opsOf(admin, 'chat_bookings', 'insert')[0]?.payload).toMatchObject({ status: 'requested', benefit: 'full' });
  });

  it('이 대화에서 안내한 금액이 첫방문 체험가뿐이면 요약 아래 줄은 5%만', async () => {
    callAi.mockResolvedValue(
      ok({
        reply: 'Thank you, Emma.',
        reaction: 'R7',
        booking: { date: '2026-10-14', time: '14:00', treatment: 'Underarm hair removal', party_size: 1, name: 'Emma', contact_channel: 'whatsapp', contact_handle: '+65 9123 4567' },
      })
    );
    const turns = [{ ...EARLIER, shown_keys: ['benefit', 'trial.armpitHairRemoval'] }];
    const admin = adminFor(
      world({ turns, messages: [{ id: 'v-1', sender: 'visitor', source: 'app', original_text: 'Oct 14 2pm, Emma, WhatsApp +65 9123 4567', translated_text: null }] })
    );
    const out = await run(admin, 'Oct 14 2pm, Emma, WhatsApp +65 9123 4567', OCTX);
    if (out.kind !== 'sent') throw new Error(out.kind);
    const lines = out.text.split('\n');
    expect(lines[lines.length - 2]).toBe('Since you booked through this chat, you get 5% off when you pay at your visit.');
    expect(T('trial.armpitHairRemoval')).toBe('T01');
    expect(out.bookingBenefit).toBe('five');
    expect(opsOf(admin, 'chat_bookings', 'insert')[0]?.payload).toMatchObject({ benefit: 'five' });
  });

  it('꺼져 있으면 혜택 문장은 5%만, 제안 줄 꼬리표는 없는 꼬리표로 다시 쓰게 한다', async () => {
    callAi
      .mockResolvedValueOnce(ok({ reply: `Yes.\n{{B01}}\n{{C01}}` }))
      .mockResolvedValueOnce(ok({ reply: 'Yes.\n{{B01}}' }));
    const admin = adminFor(world());
    const out = await run(admin, 'Do you have Sculptra?');
    if (out.kind !== 'sent') throw new Error(out.kind);
    expect(out.text).toBe('Yes.\nIf you book through this chat and pay at your visit, you get 5% off.');
    expect(turnLog(admin)?.issues).toEqual(['tag_unknown:C01']);
  });
});
