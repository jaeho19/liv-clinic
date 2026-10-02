import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../slack', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../slack')>()),
  createPrivateChannel: vi.fn(),
  inviteToChannel: vi.fn(),
  setChannelTopic: vi.fn(),
  archiveChannel: vi.fn(),
}));

import { archiveChannel, createPrivateChannel, inviteToChannel, setChannelTopic } from '../slack';
import { ensureRoom, type RoomDeps } from '../slackRooms';

// 방 이름 규칙 자체는 roomName.test.ts 가 고정한다. 여기서는 방을 확보하는 절차만 본다.

const SESSION = {
  sessionId: '11111111-2222-3333-4444-555555555555',
  visitorName: 'Thu Nguyen',
  visitorLocale: 'vi',
  visitorEmail: null,
};
// 2026-10-01(목) 16:40 KST
const AT = '2026-10-01T07:40:00Z';
const NAME = '10월01일-thu-nguyen';

function fakeDeps(overrides: Partial<RoomDeps> = {}): RoomDeps & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    staffIds: ['U1', 'U2', 'UOBS'],
    hasResponders: true,
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
const triedNames = () => vi.mocked(createPrivateChannel).mock.calls.map((c) => c[0]);

describe('ensureRoom', () => {
  beforeEach(() => {
    vi.mocked(createPrivateChannel).mockReset();
    vi.mocked(inviteToChannel).mockReset().mockResolvedValue(ok({}));
    vi.mocked(setChannelTopic).mockReset().mockResolvedValue(ok({}));
    vi.mocked(archiveChannel).mockReset().mockResolvedValue(ok({}));
  });

  it('정상: 선점 → 날짜-이름으로 생성 → 초대 → 세션 확정 → 주제', async () => {
    vi.mocked(createPrivateChannel).mockResolvedValue(ok({ channel: { id: 'C9', name: NAME } }));
    const deps = fakeDeps();
    const r = await ensureRoom(SESSION, deps, AT);
    expect(r).toEqual({ mode: 'room', channelId: 'C9', created: true });
    expect(triedNames()).toEqual([NAME]);
    expect(deps.calls).toEqual(['claim', `setRoom:C9:${NAME}`]);
    expect(inviteToChannel).toHaveBeenCalledWith('C9', ['U1', 'U2', 'UOBS']);
    expect(setChannelTopic).toHaveBeenCalledWith('C9', expect.stringContaining('Thu Nguyen'));
  });

  it('이름을 안 적은 손님의 방은 언어로 부른다', async () => {
    vi.mocked(createPrivateChannel).mockResolvedValue(ok({ channel: { id: 'C9', name: '10월01일-영어손님' } }));
    await ensureRoom({ ...SESSION, visitorName: null, visitorLocale: 'en' }, fakeDeps(), AT);
    expect(triedNames()).toEqual(['10월01일-영어손님']);
  });

  it('name_taken이면 -2 접미로 다시 만든다', async () => {
    vi.mocked(createPrivateChannel)
      .mockResolvedValueOnce(fail('name_taken'))
      .mockResolvedValueOnce(ok({ channel: { id: 'C9', name: `${NAME}-2` } }));
    const deps = fakeDeps();
    const r = await ensureRoom(SESSION, deps, AT);
    expect(r).toMatchObject({ mode: 'room', channelId: 'C9' });
    expect(triedNames()).toEqual([NAME, `${NAME}-2`]);
    expect(deps.calls).toEqual(['claim', `setRoom:C9:${NAME}-2`]);
  });

  it('-2, -3도 겹치면 참조코드를 붙인다', async () => {
    vi.mocked(createPrivateChannel)
      .mockResolvedValueOnce(fail('name_taken'))
      .mockResolvedValueOnce(fail('name_taken'))
      .mockResolvedValueOnce(fail('name_taken'))
      .mockResolvedValueOnce(ok({ channel: { id: 'C9', name: `${NAME}-111111` } }));
    expect(await ensureRoom(SESSION, fakeDeps(), AT)).toMatchObject({ mode: 'room', channelId: 'C9' });
    expect(triedNames()).toEqual([NAME, `${NAME}-2`, `${NAME}-3`, `${NAME}-111111`]);
  });

  it('네 이름이 모두 겹치면 스레드 모드로 되돌린다', async () => {
    vi.mocked(createPrivateChannel).mockResolvedValue(fail('name_taken'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const deps = fakeDeps();
    expect(await ensureRoom(SESSION, deps, AT)).toEqual({ mode: 'thread' });
    expect(createPrivateChannel).toHaveBeenCalledTimes(4);
    expect(deps.calls).toEqual(['claim', 'thread']);
    warn.mockRestore();
  });

  it('Slack이 이름을 거부하면(invalid_name_specials) 예전 꼴로 한 번 더 만든다', async () => {
    vi.mocked(createPrivateChannel)
      .mockResolvedValueOnce(fail('invalid_name_specials'))
      .mockResolvedValueOnce(ok({ channel: { id: 'C9', name: 'chat-thu-nguyen-111111' } }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const deps = fakeDeps();
    expect(await ensureRoom(SESSION, deps, AT)).toMatchObject({ mode: 'room', channelId: 'C9' });
    expect(triedNames()).toEqual([NAME, 'chat-thu-nguyen-111111']);
    expect(deps.calls).toEqual(['claim', 'setRoom:C9:chat-thu-nguyen-111111']);
    warn.mockRestore();
  });

  it('예전 꼴도 실패하면 더 시도하지 않고 스레드 모드', async () => {
    vi.mocked(createPrivateChannel)
      .mockResolvedValueOnce(fail('invalid_name_maxlength'))
      .mockResolvedValueOnce(fail('name_taken'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const deps = fakeDeps();
    expect(await ensureRoom(SESSION, deps, AT)).toEqual({ mode: 'thread' });
    expect(createPrivateChannel).toHaveBeenCalledTimes(2);
    expect(deps.calls).toEqual(['claim', 'thread']);
    warn.mockRestore();
  });

  it('생성이 실패하면(restricted_action) 스레드 모드로 되돌리고 초대하지 않는다', async () => {
    vi.mocked(createPrivateChannel).mockResolvedValue(fail('restricted_action'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const deps = fakeDeps();
    expect(await ensureRoom(SESSION, deps, AT)).toEqual({ mode: 'thread' });
    expect(createPrivateChannel).toHaveBeenCalledTimes(1);
    expect(deps.calls).toEqual(['claim', 'thread']);
    expect(inviteToChannel).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('초대가 실패하면 방을 보관하고 스레드 모드로 되돌린다', async () => {
    vi.mocked(createPrivateChannel).mockResolvedValue(ok({ channel: { id: 'C9', name: 'x' } }));
    vi.mocked(inviteToChannel).mockResolvedValue(fail('cant_invite'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const deps = fakeDeps();
    expect(await ensureRoom(SESSION, deps, AT)).toEqual({ mode: 'thread' });
    expect(archiveChannel).toHaveBeenCalledWith('C9');
    expect(deps.calls).toEqual(['claim', 'thread']);
    warn.mockRestore();
  });

  it('setRoom이 reject되면 방을 보관하고 스레드 모드로 폴백한다', async () => {
    vi.mocked(createPrivateChannel).mockResolvedValue(ok({ channel: { id: 'C9', name: NAME } }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const deps = fakeDeps({
      setRoom: async () => {
        throw new Error('db write failed');
      },
    });
    expect(await ensureRoom(SESSION, deps, AT)).toEqual({ mode: 'thread' });
    expect(archiveChannel).toHaveBeenCalledWith('C9');
    expect(deps.calls).toEqual(['claim', 'thread']);
    warn.mockRestore();
  });

  it('답변 직원이 없으면 선점조차 하지 않고 스레드 모드', async () => {
    const deps = fakeDeps({ hasResponders: false, staffIds: ['UOBS'] });
    expect(await ensureRoom(SESSION, deps, AT)).toEqual({ mode: 'thread' });
    expect(deps.calls).toEqual(['thread']);
    expect(createPrivateChannel).not.toHaveBeenCalled();
  });

  it('선점에서 지면 재조회로 방을 찾아 쓴다', async () => {
    let polls = 0;
    const deps = fakeDeps({
      claimRoomMode: async () => false,
      reloadTarget: async () => (++polls >= 2 ? { mode: 'room', channelId: 'C7' } : null),
    });
    expect(await ensureRoom(SESSION, deps, AT)).toEqual({ mode: 'room', channelId: 'C7', created: false });
    expect(createPrivateChannel).not.toHaveBeenCalled();
  });

  it('선점에서 졌는데 상대가 스레드로 갔으면 스레드', async () => {
    const deps = fakeDeps({ claimRoomMode: async () => false, reloadTarget: async () => ({ mode: 'thread' }) });
    expect(await ensureRoom(SESSION, deps, AT)).toEqual({ mode: 'thread' });
  });

  it('선점에서 졌고 3번 재조회해도 없으면 feed', async () => {
    const deps = fakeDeps({ claimRoomMode: async () => false });
    expect(await ensureRoom(SESSION, deps, AT)).toEqual({ mode: 'feed' });
  });
});
