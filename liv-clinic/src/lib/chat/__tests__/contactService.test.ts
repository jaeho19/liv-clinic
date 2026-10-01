import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../broadcast', () => ({ broadcastToSession: vi.fn().mockResolvedValue(undefined) }));

import { broadcastToSession } from '../broadcast';
import { recordMessengerClick, saveEmailFromMessage, saveVisitorContact, type ContactSession } from '../contactService';
import { _resetRateLimitForTesting } from '../rateLimit';
import { fakeAdmin, type FakeOp, type FakeResult } from './fakeAdmin';

const SESSION: ContactSession = {
  id: '11111111-2222-3333-4444-555555555555',
  visitor_locale: 'en',
  visitor_email: null,
  visitor_messenger_handle: null,
};

function okAdmin(override?: (op: FakeOp) => FakeResult | undefined) {
  return fakeAdmin((op) => {
    const custom = override?.(op);
    if (custom) return custom;
    if (op.table === 'chat_messages' && op.op === 'insert') return { data: { id: 'm-sys' } };
    return { data: null };
  });
}

const sessionUpdate = (admin: ReturnType<typeof fakeAdmin>) =>
  admin.ops.find((o) => o.table === 'chat_sessions' && o.op === 'update');
const systemInsert = (admin: ReturnType<typeof fakeAdmin>) =>
  admin.ops.find((o) => o.table === 'chat_messages' && o.op === 'insert');

beforeEach(() => {
  _resetRateLimitForTesting();
  vi.mocked(broadcastToSession).mockClear();
});

describe('saveVisitorContact', () => {
  it('이메일은 visitor_email에 저장하고 확인 문구를 남긴다', async () => {
    const admin = okAdmin();
    const r = await saveVisitorContact(admin as never, SESSION, { channel: 'email', handle: 'guest@example.com' });

    expect(r).toEqual({ ok: true });
    expect(sessionUpdate(admin)?.payload).toEqual({ visitor_email: 'guest@example.com' });
    expect(systemInsert(admin)?.payload).toMatchObject({
      session_id: SESSION.id,
      sender: 'system',
      original_lang: 'en',
      translation_status: 'skipped',
      original_text: "Email contact saved: guest@example.com. We'll reach out to you there as soon as we can.",
    });
    expect(broadcastToSession).toHaveBeenCalledWith(SESSION.id, {
      type: 'message_created',
      payload: { messageId: 'm-sys', sender: 'system' },
    });
  });

  it('메신저는 기존 컬럼(visitor_messenger_channel/handle)에 저장한다', async () => {
    const admin = okAdmin();
    await saveVisitorContact(admin as never, SESSION, { channel: 'wechat', handle: 'liwei88' });
    expect(sessionUpdate(admin)?.payload).toEqual({
      visitor_messenger_channel: 'wechat',
      visitor_messenger_handle: 'liwei88',
    });
    expect((systemInsert(admin)?.payload as { original_text: string }).original_text).toContain('WeChat contact saved: liwei88');
  });

  it('옛 화면이 보내는 line 저장도 받는다', async () => {
    const admin = okAdmin();
    const r = await saveVisitorContact(admin as never, SESSION, { channel: 'line', handle: 'my_line_id' });
    expect(r).toEqual({ ok: true });
    expect(sessionUpdate(admin)?.payload).toEqual({
      visitor_messenger_channel: 'line',
      visitor_messenger_handle: 'my_line_id',
    });
  });

  it('DB 오류는 throw 없이 실패 결과 — 확인 문구도 넣지 않는다', async () => {
    const admin = okAdmin((op) => (op.op === 'update' ? { error: { code: '57014' } } : undefined));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = await saveVisitorContact(admin as never, SESSION, { channel: 'email', handle: 'guest@example.com' });
    expect(r).toEqual({ ok: false, error: 'db_error' });
    expect(systemInsert(admin)).toBeUndefined();
    error.mockRestore();
  });

  it('확인 문구 INSERT가 실패해도 저장은 성공으로 친다', async () => {
    const admin = okAdmin((op) => (op.op === 'insert' ? { error: { code: '23514' } } : undefined));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = await saveVisitorContact(admin as never, SESSION, { channel: 'email', handle: 'guest@example.com' });
    expect(r).toEqual({ ok: true });
    expect(broadcastToSession).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('recordMessengerClick', () => {
  it('클릭 컬럼만 갱신하고 손님 화면에는 아무것도 남기지 않는다', async () => {
    const admin = okAdmin();
    expect(await recordMessengerClick(admin as never, SESSION, 'whatsapp')).toEqual({ ok: true });
    expect(admin.ops).toHaveLength(1);
    expect(sessionUpdate(admin)?.payload).toEqual({ visitor_messenger_clicked: 'whatsapp' });
    expect(systemInsert(admin)).toBeUndefined();
    expect(broadcastToSession).not.toHaveBeenCalled();
  });

  it('email 클릭도 같은 방식으로 기록한다', async () => {
    const admin = okAdmin();
    await recordMessengerClick(admin as never, SESSION, 'email');
    expect(sessionUpdate(admin)?.payload).toEqual({ visitor_messenger_clicked: 'email' });
  });

  it('DB 오류(042 미적용 등)는 throw 없이 실패 결과', async () => {
    const admin = okAdmin((op) => (op.op === 'update' ? { error: { code: '42703' } } : undefined));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await recordMessengerClick(admin as never, SESSION, 'line')).toEqual({ ok: false });
    warn.mockRestore();
  });
});

describe('saveEmailFromMessage — 손님 글 속 이메일', () => {
  it('글에서 찾은 주소를 한 번 저장한다', async () => {
    const admin = okAdmin();
    const r = await saveEmailFromMessage(admin as never, SESSION, 'Please reply to Guest@Example.com. Thanks');
    expect(r).toEqual({ saved: true, hasContact: true, email: 'Guest@Example.com' });
    expect(sessionUpdate(admin)?.payload).toEqual({ visitor_email: 'Guest@Example.com' });
    expect(systemInsert(admin)).toBeDefined();
  });

  it('이미 같은 주소면(대소문자 무시) 아무것도 바꾸지 않는다', async () => {
    const admin = okAdmin();
    const r = await saveEmailFromMessage(
      admin as never,
      { ...SESSION, visitor_email: 'guest@example.com' },
      'my email is GUEST@example.com'
    );
    expect(r).toEqual({ saved: false, hasContact: true });
    expect(admin.ops).toHaveLength(0);
  });

  it('다른 주소를 쓰면 마지막 주소로 바꾼다', async () => {
    const admin = okAdmin();
    const r = await saveEmailFromMessage(
      admin as never,
      { ...SESSION, visitor_email: 'old@example.com' },
      'sorry, use new@example.com'
    );
    expect(r).toEqual({ saved: true, hasContact: true, email: 'new@example.com' });
  });

  it('이메일이 없는 글은 아무것도 바꾸지 않는다 — hasContact는 기존 연락처 기준', async () => {
    const admin = okAdmin();
    expect(await saveEmailFromMessage(admin as never, SESSION, 'How much is Ulthera?')).toEqual({
      saved: false,
      hasContact: false,
    });
    expect(
      await saveEmailFromMessage(admin as never, { ...SESSION, visitor_messenger_handle: 'liwei88' }, 'hello')
    ).toEqual({ saved: false, hasContact: true });
    expect(admin.ops).toHaveLength(0);
  });

  it('하루 저장 한도(5회)를 넘으면 인식을 건너뛴다', async () => {
    const admin = okAdmin();
    for (let i = 0; i < 5; i++) {
      const r = await saveEmailFromMessage(admin as never, SESSION, `mail me at guest${i}@example.com`);
      expect(r.saved).toBe(true);
    }
    const before = admin.ops.length;
    expect(await saveEmailFromMessage(admin as never, SESSION, 'or guest9@example.com')).toEqual({
      saved: false,
      hasContact: false,
    });
    expect(admin.ops.length).toBe(before);
  });

  it('DB 오류는 throw 없이 실패 결과', async () => {
    const admin = okAdmin((op) => (op.op === 'update' ? { error: { code: '57014' } } : undefined));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await saveEmailFromMessage(admin as never, SESSION, 'guest@example.com')).toEqual({
      saved: false,
      hasContact: false,
    });
    error.mockRestore();
  });
});
