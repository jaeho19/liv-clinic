import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../slack', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../slack')>()),
  listChannelMembers: vi.fn(),
  getBotUserId: vi.fn(),
  getUserInfo: vi.fn(),
}));

import { getBotUserId, getUserInfo, listChannelMembers } from '../slack';
import {
  _internals,
  buildStaffDirectory,
  loadStaffDirectory,
  mentionOf,
  parseStaffDirectory,
  resolveStaffLabel,
  roomsDisabled,
  UNKNOWN_STAFF_LABEL,
  type StaffMember,
} from '../slackStaff';

const listMock = vi.mocked(listChannelMembers);
const botMock = vi.mocked(getBotUserId);
const infoMock = vi.mocked(getUserInfo);

function member(id: string, name: string | null = null, extra: Partial<StaffMember> = {}): StaffMember {
  return { id, name, isBot: false, deleted: false, ...extra };
}

describe('parseStaffDirectory — 답변 직원 (폴백 파서)', () => {
  it('ID:이름 쌍을 파싱하고 이름이 없으면 기본 라벨을 쓴다', () => {
    const s = parseStaffDirectory('U0AAA:이정현, U0BBB ,U0CCC:방애금');
    expect(s.responderIds).toEqual(['U0AAA', 'U0BBB', 'U0CCC']);
    expect(s.inviteIds).toEqual(['U0AAA', 'U0BBB', 'U0CCC']);
    expect(s.labelOf('U0AAA')).toBe('이정현');
    expect(s.labelOf('U0BBB')).toBe(UNKNOWN_STAFF_LABEL);
    expect(s.labelOf('U0ZZZ')).toBe(UNKNOWN_STAFF_LABEL);
    expect(s.labelOf(null)).toBe(UNKNOWN_STAFF_LABEL);
  });

  it('잘못된 ID·중복·소문자는 버린다', () => {
    const s = parseStaffDirectory('bogus:x,U0AAA:a,U0AAA:b,u0lower:c');
    expect(s.responderIds).toEqual(['U0AAA']);
    expect(s.labelOf('U0AAA')).toBe('a');
  });

  it('빈 값이면 아무도 없다', () => {
    const s = parseStaffDirectory(undefined);
    expect(s.responderIds).toEqual([]);
    expect(s.inviteIds).toEqual([]);
    expect(s.mentionAll()).toBe('');
    expect(s.isResponder('U0AAA')).toBe(false);
  });

  it('전원 멘션 문자열을 만든다', () => {
    expect(parseStaffDirectory('U0AAA,U0BBB').mentionAll()).toBe('<@U0AAA> <@U0BBB>');
    expect(mentionOf('U0AAA')).toBe('<@U0AAA>');
  });

  it('관찰자는 초대 대상이지만 멘션·담당 대상이 아니다', () => {
    const s = parseStaffDirectory('U0AAA:이정현', 'U0OBS:이재호');
    expect(s.inviteIds).toEqual(['U0AAA', 'U0OBS']);
    expect(s.responderIds).toEqual(['U0AAA']);
    expect(s.isResponder('U0OBS')).toBe(false);
    expect(s.mentionAll()).toBe('<@U0AAA>');
    expect(s.labelOf('U0OBS')).toBe('이재호');
  });

  it('양쪽에 다 있으면 답변 직원으로 본다', () => {
    const s = parseStaffDirectory('U0AAA:이정현', 'U0AAA:이정현,U0OBS');
    expect(s.responderIds).toEqual(['U0AAA']);
    expect(s.inviteIds).toEqual(['U0AAA', 'U0OBS']);
    expect(s.isResponder('U0AAA')).toBe(true);
  });
});

describe('buildStaffDirectory — 채널 멤버 → 명단 (순수)', () => {
  it('봇 자신·다른 봇·삭제 계정·Slackbot을 제외하고 순서를 지킨다', () => {
    const s = buildStaffDirectory({
      members: [
        member('U0BOT', 'LIV Chat Alert'),
        member('U0AAA', '이정현'),
        member('U0OTHERBOT', 'Zapier', { isBot: true }),
        member('U0GONE', '정소월', { deleted: true }),
        member('USLACKBOT', 'Slackbot'),
        member('U0BBB', '방애금'),
        member('U0AAA', '이정현(중복)'),
      ],
      botUserId: 'U0BOT',
      observers: new Map(),
    });
    expect(s.responderIds).toEqual(['U0AAA', 'U0BBB']);
    expect(s.inviteIds).toEqual(['U0AAA', 'U0BBB']);
    expect(s.labelOf('U0AAA')).toBe('이정현');
    expect(s.mentionAll()).toBe('<@U0AAA> <@U0BBB>');
  });

  it('관찰자는 채널에 있든 없든 초대 대상이고 답변 직원이 아니다', () => {
    const s = buildStaffDirectory({
      members: [member('U0AAA', '이정현'), member('U0OBS', '이재호(프로필)')],
      botUserId: null,
      observers: new Map([
        ['U0OBS', '이재호'],
        ['U0OBS2', '외부 관찰자'],
      ]),
    });
    expect(s.responderIds).toEqual(['U0AAA']);
    expect(s.inviteIds).toEqual(['U0AAA', 'U0OBS', 'U0OBS2']);
    expect(s.isResponder('U0OBS')).toBe(false);
    expect(s.labelOf('U0OBS')).toBe('이재호'); // 환경변수 이름이 우선
    expect(s.labelOf('U0OBS2')).toBe('외부 관찰자');
  });

  it('이름이 없는 멤버는 기본 라벨', () => {
    const s = buildStaffDirectory({ members: [member('U0AAA')], botUserId: null, observers: new Map() });
    expect(s.labelOf('U0AAA')).toBe(UNKNOWN_STAFF_LABEL);
    expect(s.isResponder('U0AAA')).toBe(true);
  });
});

describe('loadStaffDirectory — 조회·캐시·실패', () => {
  let now = 1_000_000;

  beforeEach(() => {
    process.env.SLACK_CHANNEL_ID = 'C0FEED';
    process.env.SLACK_OBSERVERS = 'U0OBS:이재호';
    delete process.env.SLACK_STAFF;
    delete process.env.SLACK_ROOMS;
    now = 1_000_000;
    vi.spyOn(_internals, 'now').mockImplementation(() => now);
    _internals.resetCache();
    listMock.mockReset();
    botMock.mockReset();
    infoMock.mockReset();
    botMock.mockResolvedValue('U0BOT');
    infoMock.mockImplementation(async (id) => ({
      ok: true,
      data: { id, name: `이름-${id}`, isBot: false, deleted: false },
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.SLACK_CHANNEL_ID;
    delete process.env.SLACK_OBSERVERS;
    delete process.env.SLACK_ROOMS;
    delete process.env.SLACK_STAFF;
  });

  it('멤버 → 봇 ID → users.info 순으로 조회해 명단을 만든다 (봇·관찰자는 users.info 생략)', async () => {
    listMock.mockResolvedValue({ ok: true, data: { members: ['U0BOT', 'U0AAA', 'U0OBS', 'U0BBB'] } });
    const s = await loadStaffDirectory();
    expect(listMock).toHaveBeenCalledWith('C0FEED');
    expect(s.responderIds).toEqual(['U0AAA', 'U0BBB']);
    expect(s.inviteIds).toEqual(['U0AAA', 'U0BBB', 'U0OBS']);
    expect(s.labelOf('U0AAA')).toBe('이름-U0AAA');
    expect(s.labelOf('U0OBS')).toBe('이재호');
    expect(infoMock.mock.calls.map((c) => c[0])).toEqual(['U0AAA', 'U0BBB']);
  });

  it('60초 안에는 캐시를 쓰고, 지나면 다시 조회한다', async () => {
    listMock.mockResolvedValue({ ok: true, data: { members: ['U0AAA'] } });
    await loadStaffDirectory();
    now += 59_000;
    await loadStaffDirectory();
    expect(listMock).toHaveBeenCalledTimes(1);
    now += 2_000;
    await loadStaffDirectory();
    expect(listMock).toHaveBeenCalledTimes(2);
  });

  it('users.info 결과는 10분 캐시한다', async () => {
    listMock.mockResolvedValue({ ok: true, data: { members: ['U0AAA'] } });
    await loadStaffDirectory();
    now += 61_000;
    await loadStaffDirectory();
    expect(listMock).toHaveBeenCalledTimes(2);
    expect(infoMock).toHaveBeenCalledTimes(1);
    now += 600_000;
    await loadStaffDirectory();
    expect(infoMock).toHaveBeenCalledTimes(2);
  });

  it('users.info가 missing_scope면 후보에 남기고 이름만 기본 라벨', async () => {
    listMock.mockResolvedValue({ ok: true, data: { members: ['U0AAA'] } });
    infoMock.mockResolvedValue({ ok: false, error: 'missing_scope' });
    const s = await loadStaffDirectory();
    expect(s.responderIds).toEqual(['U0AAA']);
    expect(s.labelOf('U0AAA')).toBe(UNKNOWN_STAFF_LABEL);
  });

  it('멤버 조회 실패: 이전 성공값이 있으면 그것을, 없으면 빈 명단', async () => {
    listMock.mockResolvedValueOnce({ ok: false, error: 'ratelimited' });
    const empty = await loadStaffDirectory();
    expect(empty.responderIds).toEqual([]);
    expect(empty.inviteIds).toEqual([]);

    listMock.mockResolvedValueOnce({ ok: true, data: { members: ['U0AAA'] } });
    now += 61_000;
    expect((await loadStaffDirectory()).responderIds).toEqual(['U0AAA']);

    listMock.mockResolvedValueOnce({ ok: false, error: 'http_503' });
    now += 61_000;
    expect((await loadStaffDirectory()).responderIds).toEqual(['U0AAA']);
  });

  it('SLACK_ROOMS=off면 API를 부르지 않고 빈 명단', async () => {
    process.env.SLACK_ROOMS = 'off';
    expect(roomsDisabled()).toBe(true);
    const s = await loadStaffDirectory();
    expect(s.responderIds).toEqual([]);
    expect(listMock).not.toHaveBeenCalled();
  });

  it('SLACK_CHANNEL_ID가 없으면 빈 명단', async () => {
    delete process.env.SLACK_CHANNEL_ID;
    const s = await loadStaffDirectory();
    expect(s.inviteIds).toEqual([]);
    expect(listMock).not.toHaveBeenCalled();
  });

  it('SLACK_STAFF가 설정돼 있으면 무시하고 경고를 한 번만 남긴다', async () => {
    process.env.SLACK_STAFF = 'U0OLD:옛직원';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    listMock.mockResolvedValue({ ok: true, data: { members: ['U0AAA'] } });
    const s = await loadStaffDirectory();
    expect(s.responderIds).toEqual(['U0AAA']);
    now += 61_000;
    await loadStaffDirectory();
    const staffWarnings = warn.mock.calls.filter((c) => String(c[0]).includes('SLACK_STAFF'));
    expect(staffWarnings).toHaveLength(1);
  });
});

describe('resolveStaffLabel', () => {
  beforeEach(() => {
    _internals.resetCache();
    infoMock.mockReset();
  });

  it('명단에 있으면 명단 이름', async () => {
    const dir = parseStaffDirectory('U0AAA:이정현');
    expect(await resolveStaffLabel('U0AAA', dir)).toBe('이정현');
    expect(infoMock).not.toHaveBeenCalled();
  });

  it('명단에 없으면 users.info 1회, 그래도 없으면 기본 라벨', async () => {
    const dir = parseStaffDirectory('U0AAA:이정현');
    infoMock.mockResolvedValueOnce({ ok: true, data: { id: 'U0NEW', name: '유다영', isBot: false, deleted: false } });
    expect(await resolveStaffLabel('U0NEW', dir)).toBe('유다영');
    infoMock.mockResolvedValueOnce({ ok: false, error: 'missing_scope' });
    expect(await resolveStaffLabel('U0X', dir)).toBe(UNKNOWN_STAFF_LABEL);
    expect(await resolveStaffLabel(null, dir)).toBe(UNKNOWN_STAFF_LABEL);
  });
});
