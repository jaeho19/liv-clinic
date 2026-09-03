import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../slack', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../slack')>()),
  createPrivateChannel: vi.fn(),
  inviteToChannel: vi.fn(),
  setChannelTopic: vi.fn(),
  archiveChannel: vi.fn(),
}));

import { archiveChannel, createPrivateChannel, inviteToChannel, setChannelTopic } from '../slack';
import { buildRoomName, ensureRoom, slugifyName, type RoomDeps } from '../slackRooms';

const SESSION = {
  sessionId: '11111111-2222-3333-4444-555555555555',
  visitorName: 'Thu Nguyen',
  visitorLocale: 'vi',
  visitorEmail: null,
};

describe('slugifyName', () => {
  it('라틴 이름을 소문자-하이픈으로', () => {
    expect(slugifyName('Thu Nguyen')).toBe('thu-nguyen');
  });
  it('악센트를 벗긴다', () => {
    expect(slugifyName('Nguyễn Thị Thu')).toBe('nguyen-thi-thu');
  });
  it('기호·연속 공백을 하이픈 하나로 압축하고 앞뒤를 자른다', () => {
    expect(slugifyName('  John  O\'Brien!! ')).toBe('john-o-brien');
  });
  it('CJK·태국어처럼 ASCII로 못 만드는 이름은 빈 문자열', () => {
    expect(slugifyName('山田太郎')).toBe('');
    expect(slugifyName('สมชาย')).toBe('');
  });
  it('16자에서 자르고 끝의 하이픈을 없앤다', () => {
    expect(slugifyName('abcdefghijklmno pqrstu')).toBe('abcdefghijklmno');
  });
  it('null/빈값은 빈 문자열', () => {
    expect(slugifyName(null)).toBe('');
    expect(slugifyName('')).toBe('');
  });
});

describe('buildRoomName', () => {
  it('접두어-이름-참조코드6자', () => {
    expect(buildRoomName({ prefix: 'chat', ...SESSION })).toBe('chat-thu-nguyen-111111');
  });
  it('이름이 없으면 로케일로 대체한다 (zh-TW → zh-tw)', () => {
    expect(buildRoomName({ prefix: 'chat', ...SESSION, visitorName: '山田', visitorLocale: 'zh-TW' })).toBe(
      'chat-zh-tw-111111'
    );
  });
  it('접미 번호는 2부터 붙는다', () => {
    expect(buildRoomName({ prefix: 'chat', ...SESSION, suffix: 1 })).toBe('chat-thu-nguyen-111111');
    expect(buildRoomName({ prefix: 'chat', ...SESSION, suffix: 2 })).toBe('chat-thu-nguyen-111111-2');
  });
});

function fakeDeps(overrides: Partial<RoomDeps> = {}): RoomDeps & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    staffIds: ['U1', 'U2', 'UOBS'],
    hasResponders: true,
    prefix: 'chat',
    sleep: async () => {},
    claimRoomMode: async () => {
      calls.push('claim');
      return true;
    },
    setRoom: async (_id, ch, name) => {
      calls.push(`setRoom:${ch}:${name}`);
    },
    setThreadMode: async () => {
      calls.push('thread');
    },
    reloadTarget: async () => null,
    ...overrides,
  };
}

const ok = <T,>(data: T) => ({ ok: true as const, data });
const fail = (error: string) => ({ ok: false as const, error });

describe('ensureRoom', () => {
  beforeEach(() => {
    vi.mocked(createPrivateChannel).mockReset();
    vi.mocked(inviteToChannel).mockReset().mockResolvedValue(ok({}));
    vi.mocked(setChannelTopic).mockReset().mockResolvedValue(ok({}));
    vi.mocked(archiveChannel).mockReset().mockResolvedValue(ok({}));
  });

  it('정상: 선점 → 생성 → 초대 → 세션 확정 → 주제', async () => {
    vi.mocked(createPrivateChannel).mockResolvedValue(ok({ channel: { id: 'C9', name: 'chat-thu-nguyen-111111' } }));
    const deps = fakeDeps();
    const r = await ensureRoom(SESSION, deps);
    expect(r).toEqual({ mode: 'room', channelId: 'C9', created: true });
    expect(deps.calls).toEqual(['claim', 'setRoom:C9:chat-thu-nguyen-111111']);
    expect(inviteToChannel).toHaveBeenCalledWith('C9', ['U1', 'U2', 'UOBS']);
    expect(setChannelTopic).toHaveBeenCalledWith('C9', expect.stringContaining('Thu Nguyen'));
  });

  it('name_taken이면 -2 접미로 재시도한다', async () => {
    vi.mocked(createPrivateChannel)
      .mockResolvedValueOnce(fail('name_taken'))
      .mockResolvedValueOnce(ok({ channel: { id: 'C9', name: 'chat-thu-nguyen-111111-2' } }));
    const r = await ensureRoom(SESSION, fakeDeps());
    expect(r).toMatchObject({ mode: 'room', channelId: 'C9' });
    expect(vi.mocked(createPrivateChannel).mock.calls.map((c) => c[0])).toEqual([
      'chat-thu-nguyen-111111',
      'chat-thu-nguyen-111111-2',
    ]);
  });

  it('한글 접두어가 invalid_name_specials면 chat으로 바꿔 재시도한다', async () => {
    vi.mocked(createPrivateChannel)
      .mockResolvedValueOnce(fail('invalid_name_specials'))
      .mockResolvedValueOnce(ok({ channel: { id: 'C9', name: 'chat-thu-nguyen-111111' } }));
    const r = await ensureRoom(SESSION, fakeDeps({ prefix: '문의' }));
    expect(r).toMatchObject({ mode: 'room' });
    expect(vi.mocked(createPrivateChannel).mock.calls.map((c) => c[0])).toEqual([
      '문의-thu-nguyen-111111',
      'chat-thu-nguyen-111111',
    ]);
  });

  it('생성이 실패하면(restricted_action) 스레드 모드로 되돌리고 초대하지 않는다', async () => {
    vi.mocked(createPrivateChannel).mockResolvedValue(fail('restricted_action'));
    const deps = fakeDeps();
    expect(await ensureRoom(SESSION, deps)).toEqual({ mode: 'thread' });
    expect(deps.calls).toEqual(['claim', 'thread']);
    expect(inviteToChannel).not.toHaveBeenCalled();
  });

  it('초대가 실패하면 방을 보관하고 스레드 모드로 되돌린다', async () => {
    vi.mocked(createPrivateChannel).mockResolvedValue(ok({ channel: { id: 'C9', name: 'x' } }));
    vi.mocked(inviteToChannel).mockResolvedValue(fail('cant_invite'));
    const deps = fakeDeps();
    expect(await ensureRoom(SESSION, deps)).toEqual({ mode: 'thread' });
    expect(archiveChannel).toHaveBeenCalledWith('C9');
    expect(deps.calls).toEqual(['claim', 'thread']);
  });

  it('setRoom이 reject되면 방을 보관하고 스레드 모드로 폴백한다', async () => {
    vi.mocked(createPrivateChannel).mockResolvedValue(
      ok({ channel: { id: 'C9', name: 'chat-thu-nguyen-111111' } })
    );
    const deps = fakeDeps({
      setRoom: async () => {
        throw new Error('db write failed');
      },
    });
    expect(await ensureRoom(SESSION, deps)).toEqual({ mode: 'thread' });
    expect(archiveChannel).toHaveBeenCalledWith('C9');
    expect(deps.calls).toEqual(['claim', 'thread']);
  });

  it('답변 직원이 없으면 선점조차 하지 않고 스레드 모드', async () => {
    const deps = fakeDeps({ hasResponders: false, staffIds: ['UOBS'] });
    expect(await ensureRoom(SESSION, deps)).toEqual({ mode: 'thread' });
    expect(deps.calls).toEqual(['thread']);
    expect(createPrivateChannel).not.toHaveBeenCalled();
  });

  it('선점에서 지면 재조회로 방을 찾아 쓴다', async () => {
    let polls = 0;
    const deps = fakeDeps({
      claimRoomMode: async () => false,
      reloadTarget: async () => (++polls >= 2 ? { mode: 'room', channelId: 'C7' } : null),
    });
    expect(await ensureRoom(SESSION, deps)).toEqual({ mode: 'room', channelId: 'C7', created: false });
    expect(createPrivateChannel).not.toHaveBeenCalled();
  });

  it('선점에서 졌는데 상대가 스레드로 갔으면 스레드', async () => {
    const deps = fakeDeps({ claimRoomMode: async () => false, reloadTarget: async () => ({ mode: 'thread' }) });
    expect(await ensureRoom(SESSION, deps)).toEqual({ mode: 'thread' });
  });

  it('선점에서 졌고 3번 재조회해도 없으면 feed', async () => {
    const deps = fakeDeps({ claimRoomMode: async () => false });
    expect(await ensureRoom(SESSION, deps)).toEqual({ mode: 'feed' });
  });
});
