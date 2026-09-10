# Slack 직원 명단 자동화 + 피드 스레드 답장 전달 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 답변 직원 명단을 Netlify 환경변수(`SLACK_STAFF`) 대신 `#해외문의` 채널 멤버로 자동 산출하고, `#해외문의` 피드 줄 스레드에 달린 직원 답장을 손님에게 전달한 뒤 손님 방에 복사한다.

**Architecture:** `slack.ts`에 읽기 API 4개(`conversations.members`, `auth.test`, `users.info`, `conversations.replies`)를 추가하고, `slackStaff.ts`의 동기 `getStaffDirectory()`를 캐시 있는 비동기 `loadStaffDirectory()`로 바꾼다. `StaffDirectory` 인터페이스는 그대로라 호출부(`slackRelay.ts`, `escalationRunner.ts`)는 `await`만 붙는다. 인바운드 릴레이는 세션 조회 3단계(피드 부모 메시지의 `<#채널>` 링크)를 더하고 방에 복사본을 게시한다. 스키마 변경 없음.

**Tech Stack:** Next.js 16 App Router(Node 런타임), TypeScript, Vitest 4, Slack Web API(JSON body), supabase-js(admin client).

**Spec:** `docs/superpowers/specs/2026-09-10-slack-staff-from-channel-design.md`

## Global Constraints

- 모든 npm/npx 명령은 `liv-clinic/` 안에서 실행한다. 이 PC는 TLS 프록시 뒤라 `NODE_TLS_REJECT_UNAUTHORIZED=0`을 붙인다(테스트는 네트워크를 안 쓰지만 붙여도 무해).
- 테스트: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run <파일>` / 전체 `npx vitest run`. 기준선 **41파일 560건 통과**(2026-09-10). 타입: `npx tsc --noEmit`.
- Slack 래퍼는 **throw-free**(`callSlack` 경유, `SlackCallResult<T>` 반환). DB 접근은 `slackRelay.ts`/`escalationRunner.ts`에서만.
- 로그 접두어: `[slack staff]`, `[slack relay]`, `[chat ops]`. 경고는 한 줄, 코드 문자열만(토큰·본문 금지).
- 이름 폴백 라벨은 정확히 `'Slack 직원'`(`UNKNOWN_STAFF_LABEL`). 관찰자 환경변수 `SLACK_OBSERVERS` 형식(`ID:이름,…`)은 불변. 신설 환경변수는 `SLACK_ROOMS`(`off`만 의미) 하나. `SLACK_STAFF`는 읽지 않는다.
- 캐시 TTL: 명단 60초, `users.info` 10분, 봇 ID는 인스턴스 수명.
- 커밋 메시지는 한국어 `type(scope): 요약` 형식, 끝에 아래 두 줄:
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01BJ9fuHM4akdooSddDNsSxp
  ```
- 브랜치 `feature/slack-staff-from-channel`(워크트리 `D:\dev\LIV_homepage-slack-rooms`, origin/master cb2276e 기반). 다른 브랜치로 체크아웃 금지.

---

## 파일 구조

| 파일 | 책임 | 변경 |
|------|------|------|
| `liv-clinic/src/lib/chat/slack.ts` | Slack Web API 저수준 래퍼 | `listChannelMembers`, `getBotUserId`, `getUserInfo`, `fetchThreadParent`, `_internals.resetCaches` 추가 |
| `liv-clinic/src/lib/chat/slackStaff.ts` | 직원 명단 산출·캐시 | `buildStaffDirectory`(순수), `loadStaffDirectory`(비동기), `resolveStaffLabel`, `roomsDisabled`, `_internals`; `getStaffDirectory` 삭제 |
| `liv-clinic/src/lib/chat/slackText.ts` | Slack 문구(순수) | `extractRoomChannelFromFeedText`, `buildFeedReplyMirrorText`, 실패 안내문 수정 |
| `liv-clinic/src/lib/chat/slackRelay.ts` | Slack ↔ DB 연결 | 비동기 명단, 피드 부모 조회, 방 복사 |
| `liv-clinic/src/lib/chat/escalationRunner.ts` | 3분 크론 | 비동기 명단 |
| `liv-clinic/src/lib/chat/__tests__/fakeAdmin.ts` | 테스트용 supabase admin 가짜 | 신규 |
| `liv-clinic/src/lib/chat/__tests__/{slack,slackStaff,slackText,slackRelay}.test.ts` | 테스트 | 추가 |
| `.env.example`, `docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md`, `docs/superpowers/specs/2026-09-03-slack-patient-rooms-design.md` | 문서 | `SLACK_STAFF` 폐기·`users:read`·`SLACK_ROOMS` |

---

### Task 1: Slack 읽기 API 래퍼 4개

**Files:**
- Modify: `liv-clinic/src/lib/chat/slack.ts` (`_internals` 25~27행, 비공개 채널 관리 블록 154~187행 뒤에 새 블록)
- Test: `liv-clinic/src/lib/chat/__tests__/slack.test.ts` (파일 끝에 describe 추가; 파일 안의 `jsonResponse` 헬퍼 재사용)

**Interfaces:**
- Consumes: `callSlack<T>(method, payload): Promise<SlackCallResult<T>>` (기존)
- Produces:
  ```ts
  export interface SlackUserInfo { id: string; name: string | null; isBot: boolean; deleted: boolean }
  export async function listChannelMembers(channelId: string): Promise<SlackCallResult<{ members: string[] }>>
  export async function getBotUserId(): Promise<string | null>          // auth.test, 인스턴스 캐시
  export async function getUserInfo(userId: string): Promise<SlackCallResult<SlackUserInfo>>
  export async function fetchThreadParent(channelId: string, threadTs: string): Promise<SlackCallResult<{ text: string; botId: string | null }>>
  export const _internals: { sleep(ms): Promise<void>; resetCaches(): void }
  ```

- [ ] **Step 1: 실패하는 테스트 작성**

`slack.test.ts` 맨 끝에 추가:

```ts
import { fetchThreadParent, getBotUserId, getUserInfo, listChannelMembers } from '../slack';

describe('멤버·사용자·스레드 부모 조회', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-test';
    vi.spyOn(_internals, 'sleep').mockResolvedValue(undefined);
    _internals.resetCaches();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
    delete process.env.SLACK_BOT_TOKEN;
    _internals.resetCaches();
  });

  function bodyOf(call: number): Record<string, unknown> {
    return JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[call][1].body as string);
  }

  it('listChannelMembers는 next_cursor를 따라가며 합친다', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ ok: true, members: ['U1', 'U2'], response_metadata: { next_cursor: 'abc' } })
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true, members: ['U3'], response_metadata: { next_cursor: '' } }));
    const r = await listChannelMembers('C0FEED');
    expect(r).toEqual({ ok: true, data: { members: ['U1', 'U2', 'U3'] } });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(bodyOf(0)).toMatchObject({ channel: 'C0FEED', limit: 200 });
    expect(bodyOf(0).cursor).toBeUndefined();
    expect(bodyOf(1)).toMatchObject({ cursor: 'abc' });
  });

  it('listChannelMembers는 첫 오류를 그대로 돌려준다', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: false, error: 'missing_scope' }));
    const r = await listChannelMembers('C0FEED');
    expect(r).toEqual({ ok: false, error: 'missing_scope' });
  });

  it('getBotUserId는 auth.test 결과를 인스턴스 동안 캐시한다', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true, user_id: 'U0BOT' }));
    expect(await getBotUserId()).toBe('U0BOT');
    expect(await getBotUserId()).toBe('U0BOT');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe('https://slack.com/api/auth.test');
  });

  it('getBotUserId는 실패하면 null이고 캐시하지 않는다', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ok: false, error: 'invalid_auth' }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, user_id: 'U0BOT' }));
    expect(await getBotUserId()).toBeNull();
    expect(await getBotUserId()).toBe('U0BOT');
  });

  it('getUserInfo는 표시 이름 → 실명 → 핸들 순으로 이름을 고른다', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        ok: true,
        user: { id: 'U1', name: 'dayoung', real_name: 'Yoo Dayoung', is_bot: false, deleted: false, profile: { display_name: '유다영', real_name: 'Yoo Dayoung' } },
      })
    );
    expect(await getUserInfo('U1')).toEqual({ ok: true, data: { id: 'U1', name: '유다영', isBot: false, deleted: false } });
    expect(bodyOf(0)).toEqual({ user: 'U1' });
  });

  it('getUserInfo는 display_name이 비면 real_name, 그것도 없으면 name', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      jsonResponse({ ok: true, user: { id: 'U1', name: 'handle', is_bot: true, deleted: true, profile: { display_name: '' } } })
    );
    expect(await getUserInfo('U1')).toEqual({ ok: true, data: { id: 'U1', name: 'handle', isBot: true, deleted: true } });
  });

  it('getUserInfo는 오류를 그대로 돌려준다', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: false, error: 'missing_scope' }));
    expect(await getUserInfo('U1')).toEqual({ ok: false, error: 'missing_scope' });
  });

  it('fetchThreadParent는 ts가 일치하는 메시지의 본문과 bot_id를 돌려준다', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      jsonResponse({ ok: true, messages: [{ ts: '1.0', text: '🔴 새 문의 · <#C0ROOM>', bot_id: 'B1' }, { ts: '2.0', text: '답글' }] })
    );
    expect(await fetchThreadParent('C0FEED', '1.0')).toEqual({ ok: true, data: { text: '🔴 새 문의 · <#C0ROOM>', botId: 'B1' } });
    expect(bodyOf(0)).toMatchObject({ channel: 'C0FEED', ts: '1.0', limit: 1, inclusive: true });
  });

  it('fetchThreadParent는 메시지가 없으면 parent_not_found', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true, messages: [] }));
    expect(await fetchThreadParent('C0FEED', '1.0')).toEqual({ ok: false, error: 'parent_not_found' });
  });
});
```

`slack.test.ts` 상단 import 목록에 위 4개 함수를 합쳐도 되고, 위처럼 별도 import를 두어도 된다(중복 import는 ESLint `no-duplicate-imports`가 없으므로 허용되지만, 상단 목록에 합치는 쪽을 권장).

- [ ] **Step 2: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/slack.test.ts`
Expected: FAIL — `listChannelMembers`/`getBotUserId`/`getUserInfo`/`fetchThreadParent`/`resetCaches` is not a function (또는 export 없음).

- [ ] **Step 3: 구현**

`slack.ts`의 `_internals`를 다음으로 교체(25~27행). `botUserIdCache`는 `_internals`보다 **위에** 선언:

```ts
let botUserIdCache: string | null = null;

/** 테스트에서 spy 하기 위한 내부 훅. */
export const _internals = {
  sleep: (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
  resetCaches() {
    botUserIdCache = null;
  },
};
```

`unarchiveChannel` 뒤(서명 검증 블록 앞)에 추가:

```ts
// ── 멤버·사용자·스레드 조회 (groups:read / users:read / groups:history) ─────

export interface SlackUserInfo {
  id: string;
  /** profile.display_name ‖ profile.real_name ‖ real_name ‖ name. 전부 비면 null */
  name: string | null;
  isBot: boolean;
  deleted: boolean;
}

const MEMBERS_PAGE_LIMIT = 200;
const MEMBERS_MAX_PAGES = 10;

/** conversations.members 커서 순회. 실패하면 첫 오류를 그대로 돌려준다. */
export async function listChannelMembers(channelId: string): Promise<SlackCallResult<{ members: string[] }>> {
  const members: string[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MEMBERS_MAX_PAGES; page++) {
    const r = await callSlack<{ members?: string[]; response_metadata?: { next_cursor?: string } }>(
      'conversations.members',
      { channel: channelId, limit: MEMBERS_PAGE_LIMIT, ...(cursor ? { cursor } : {}) }
    );
    if (!r.ok) return r;
    members.push(...(r.data.members ?? []));
    cursor = r.data.response_metadata?.next_cursor || undefined;
    if (!cursor) break;
  }
  return { ok: true, data: { members } };
}

/** auth.test → 우리 봇의 user_id. 성공 시 인스턴스 수명 동안 캐시(실패는 캐시하지 않는다). */
export async function getBotUserId(): Promise<string | null> {
  if (botUserIdCache) return botUserIdCache;
  const r = await callSlack<{ user_id?: string }>('auth.test', {});
  if (!r.ok || !r.data.user_id) return null;
  botUserIdCache = r.data.user_id;
  return botUserIdCache;
}

interface SlackUserPayload {
  id: string;
  name?: string;
  real_name?: string;
  is_bot?: boolean;
  deleted?: boolean;
  profile?: { display_name?: string; real_name?: string };
}

/** users.info (users:read). 권한이 없으면 { ok: false, error: 'missing_scope' }. */
export async function getUserInfo(userId: string): Promise<SlackCallResult<SlackUserInfo>> {
  const r = await callSlack<{ user?: SlackUserPayload }>('users.info', { user: userId });
  if (!r.ok) return r;
  const u = r.data.user;
  if (!u) return { ok: false, error: 'invalid_response' };
  const name = u.profile?.display_name || u.profile?.real_name || u.real_name || u.name || null;
  return { ok: true, data: { id: u.id, name, isBot: Boolean(u.is_bot), deleted: Boolean(u.deleted) } };
}

/** 스레드의 부모(루트) 메시지 1건 — conversations.replies (groups:history). */
export async function fetchThreadParent(
  channelId: string,
  threadTs: string
): Promise<SlackCallResult<{ text: string; botId: string | null }>> {
  const r = await callSlack<{ messages?: Array<{ ts?: string; text?: string; bot_id?: string }> }>(
    'conversations.replies',
    { channel: channelId, ts: threadTs, limit: 1, inclusive: true }
  );
  if (!r.ok) return r;
  const messages = r.data.messages ?? [];
  const parent = messages.find((m) => m.ts === threadTs) ?? messages[0];
  if (!parent) return { ok: false, error: 'parent_not_found' };
  return { ok: true, data: { text: parent.text ?? '', botId: parent.bot_id ?? null } };
}
```

- [ ] **Step 4: 통과 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/slack.test.ts`
Expected: PASS (기존 케이스 포함 전부).

- [ ] **Step 5: 커밋**

```bash
git add liv-clinic/src/lib/chat/slack.ts liv-clinic/src/lib/chat/__tests__/slack.test.ts
git commit -m "feat(chat): Slack 멤버·사용자·스레드 부모 조회 래퍼 추가"
```

---

### Task 2: 직원 명단을 채널 멤버로 산출 (`slackStaff.ts`)

**Files:**
- Modify: `liv-clinic/src/lib/chat/slackStaff.ts` (전체 재작성; `parseStaffDirectory`·`mentionOf`·`UNKNOWN_STAFF_LABEL`·`StaffDirectory`는 유지)
- Test: `liv-clinic/src/lib/chat/__tests__/slackStaff.test.ts` (기존 케이스 유지 + 추가)

**Interfaces:**
- Consumes (Task 1): `listChannelMembers`, `getBotUserId`, `getUserInfo`, `getSlackChannelId` from `@/lib/chat/slack`
- Produces:
  ```ts
  export interface StaffMember { id: string; name: string | null; isBot: boolean; deleted: boolean }
  export function buildStaffDirectory(args: { members: StaffMember[]; botUserId: string | null; observers: Map<string, string> }): StaffDirectory
  export function parseStaffDirectory(staffRaw, observerRaw?): StaffDirectory   // 유지(테스트·폴백용 순수 파서)
  export function roomsDisabled(): boolean                                     // SLACK_ROOMS === 'off'
  export async function loadStaffDirectory(): Promise<StaffDirectory>          // 캐시 60초
  export async function resolveStaffLabel(userId: string | null, directory: StaffDirectory): Promise<string>
  export const _internals: { now(): number; resetCache(): void }
  ```
  `getStaffDirectory`는 **삭제**된다(Task 4에서 호출부 교체).

- [ ] **Step 1: 실패하는 테스트 작성**

`slackStaff.test.ts` 전체를 다음으로 교체(기존 `parseStaffDirectory` 케이스는 그대로 포함):

```ts
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
```

- [ ] **Step 2: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/slackStaff.test.ts`
Expected: FAIL — `buildStaffDirectory`/`loadStaffDirectory`/`_internals` export 없음.

- [ ] **Step 3: 구현**

`slackStaff.ts` 전체를 다음으로 교체:

```ts
import 'server-only';
import { getBotUserId, getSlackChannelId, getUserInfo, listChannelMembers } from '@/lib/chat/slack';

// 답변 직원 = #해외문의(SLACK_CHANNEL_ID) 채널의 사람 멤버 − 관찰자. (2026-09-10 원장님 결정)
//   - 새 직원은 채널에 추가, 퇴사자는 채널에서 내보내기만 하면 된다.
//   - 관찰자 SLACK_OBSERVERS="U0ZZZ:이재호": 방 초대만, 멘션·담당 제외 (2026-09-03 결정, 형식 불변)
//   - SLACK_STAFF 는 더 이상 읽지 않는다. SLACK_ROOMS=off 는 긴급 정지(빈 명단 = 스레드 방식).
// 이름은 users.info(users:read) 프로필 표시 이름. 권한이 없으면 'Slack 직원'.

export interface StaffDirectory {
  /** 답변 직원 ID (채널 순서, 중복 제거) */
  responderIds: string[];
  /** 방에 초대할 전원 = 답변 직원 + 관찰자 */
  inviteIds: string[];
  isResponder(id: string | null | undefined): boolean;
  /** 표시용 이름. 모르면 'Slack 직원' */
  labelOf(id: string | null | undefined): string;
  /** 답변 직원 전원 멘션 `<@U1> <@U2>`. 비어 있으면 '' */
  mentionAll(): string;
}

export interface StaffMember {
  id: string;
  name: string | null;
  isBot: boolean;
  deleted: boolean;
}

export const UNKNOWN_STAFF_LABEL = 'Slack 직원';
const SLACKBOT_ID = 'USLACKBOT';
const ID_RE = /^[UW][A-Z0-9]{2,}$/;

const DIRECTORY_TTL_MS = 60_000;
const USER_TTL_MS = 600_000;

function parseList(raw: string | undefined | null): Map<string, string> {
  const out = new Map<string, string>();
  for (const part of (raw ?? '').split(',')) {
    const [idRaw, ...rest] = part.split(':');
    const id = (idRaw ?? '').trim();
    if (!ID_RE.test(id) || out.has(id)) continue;
    const label = rest.join(':').trim();
    out.set(id, label || UNKNOWN_STAFF_LABEL);
  }
  return out;
}

export function mentionOf(id: string): string {
  return `<@${id}>`;
}

/** 채널 멤버 + 관찰자 → 명단 (순수). 봇 자신·다른 봇·삭제 계정·Slackbot·관찰자는 답변 직원에서 뺀다. */
export function buildStaffDirectory(args: {
  members: StaffMember[];
  botUserId: string | null;
  observers: Map<string, string>;
}): StaffDirectory {
  const responders = new Map<string, string>();
  for (const m of args.members) {
    if (m.id === args.botUserId || m.id === SLACKBOT_ID || m.isBot || m.deleted) continue;
    if (args.observers.has(m.id) || responders.has(m.id)) continue;
    responders.set(m.id, m.name || UNKNOWN_STAFF_LABEL);
  }
  const responderIds = [...responders.keys()];
  const inviteIds = [...responderIds, ...args.observers.keys()];
  const labels = new Map([...responders, ...args.observers]);
  return {
    responderIds,
    inviteIds,
    isResponder: (id) => Boolean(id && responders.has(id)),
    labelOf: (id) => (id && labels.get(id)) || UNKNOWN_STAFF_LABEL,
    mentionAll: () => responderIds.map(mentionOf).join(' '),
  };
}

/** "ID:이름,…" 두 목록 → 명단. 테스트와 폴백용 순수 파서(환경변수는 읽지 않는다). */
export function parseStaffDirectory(
  staffRaw: string | undefined | null,
  observerRaw?: string | undefined | null
): StaffDirectory {
  const staff = parseList(staffRaw);
  const observers = parseList(observerRaw);
  for (const id of staff.keys()) observers.delete(id); // 양쪽에 있으면 답변 직원
  const members: StaffMember[] = [...staff].map(([id, label]) => ({
    id,
    name: label === UNKNOWN_STAFF_LABEL ? null : label,
    isBot: false,
    deleted: false,
  }));
  return buildStaffDirectory({ members, botUserId: null, observers });
}

export function roomsDisabled(): boolean {
  return (process.env.SLACK_ROOMS ?? '').trim().toLowerCase() === 'off';
}

function observersFromEnv(): Map<string, string> {
  return parseList(process.env.SLACK_OBSERVERS);
}

const EMPTY_DIRECTORY: StaffDirectory = buildStaffDirectory({ members: [], botUserId: null, observers: new Map() });

let directoryCache: { directory: StaffDirectory; fetchedAt: number } | null = null;
const userCache = new Map<string, { member: StaffMember; fetchedAt: number }>();
let warnedStaffEnv = false;
let warnedMissingScope = false;

/** 테스트용 훅. */
export const _internals = {
  now: () => Date.now(),
  resetCache() {
    directoryCache = null;
    userCache.clear();
    warnedStaffEnv = false;
    warnedMissingScope = false;
  },
};

async function lookupMember(id: string, now: number): Promise<StaffMember> {
  const cached = userCache.get(id);
  if (cached && now - cached.fetchedAt < USER_TTL_MS) return cached.member;
  const r = await getUserInfo(id);
  let member: StaffMember;
  if (r.ok) {
    member = { id, name: r.data.name, isBot: r.data.isBot, deleted: r.data.deleted };
  } else {
    // users:read 미추가(missing_scope)·일시 오류: 후보에 남기고 이름만 비운다. 봇 제외는 auth.test로 충분하다.
    if (r.error === 'missing_scope') {
      if (!warnedMissingScope) {
        warnedMissingScope = true;
        console.warn('[slack staff] users:read scope missing — names fall back to', UNKNOWN_STAFF_LABEL);
      }
    } else {
      console.warn('[slack staff] users.info failed:', id, r.error);
    }
    member = { id, name: null, isBot: false, deleted: false };
  }
  userCache.set(id, { member, fetchedAt: now });
  return member;
}

/**
 * #해외문의 멤버 → 명단. 60초 캐시. 조회 실패 시 마지막 성공값, 그것도 없으면 빈 명단(= 기존 안전 경로).
 */
export async function loadStaffDirectory(): Promise<StaffDirectory> {
  if (process.env.SLACK_STAFF && !warnedStaffEnv) {
    warnedStaffEnv = true;
    console.warn('[slack staff] SLACK_STAFF is ignored; members of SLACK_CHANNEL_ID are used');
  }
  if (roomsDisabled()) return EMPTY_DIRECTORY;
  const now = _internals.now();
  if (directoryCache && now - directoryCache.fetchedAt < DIRECTORY_TTL_MS) return directoryCache.directory;

  const channel = getSlackChannelId();
  if (!channel) return EMPTY_DIRECTORY;

  const listed = await listChannelMembers(channel);
  if (!listed.ok) {
    console.warn('[slack staff] members lookup failed:', listed.error);
    return directoryCache?.directory ?? EMPTY_DIRECTORY;
  }

  const botUserId = await getBotUserId();
  const observers = observersFromEnv();
  const members: StaffMember[] = [];
  for (const id of listed.data.members) {
    if (id === botUserId || id === SLACKBOT_ID || observers.has(id)) {
      members.push({ id, name: null, isBot: false, deleted: false }); // 어차피 답변 직원이 아니다 — users.info 생략
      continue;
    }
    members.push(await lookupMember(id, now));
  }
  const directory = buildStaffDirectory({ members, botUserId, observers });
  directoryCache = { directory, fetchedAt: now };
  return directory;
}

/** 답장 작성자 라벨: 명단 → users.info 1회(캐시) → 'Slack 직원'. */
export async function resolveStaffLabel(userId: string | null, directory: StaffDirectory): Promise<string> {
  if (!userId) return UNKNOWN_STAFF_LABEL;
  const known = directory.labelOf(userId);
  if (known !== UNKNOWN_STAFF_LABEL) return known;
  const member = await lookupMember(userId, _internals.now());
  return member.name || UNKNOWN_STAFF_LABEL;
}
```

- [ ] **Step 4: 통과 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/slackStaff.test.ts`
Expected: PASS. 이 시점에 `npx tsc --noEmit`은 `getStaffDirectory` 없음으로 `slackRelay.ts`·`escalationRunner.ts`에서 실패한다 — **정상**(Task 4에서 고친다). 전체 vitest는 아직 돌리지 않는다.

- [ ] **Step 5: 커밋**

```bash
git add liv-clinic/src/lib/chat/slackStaff.ts liv-clinic/src/lib/chat/__tests__/slackStaff.test.ts
git commit -m "feat(chat): 답변 직원 명단을 #해외문의 채널 멤버로 산출 (60초 캐시, SLACK_STAFF 폐기)"
```

---

### Task 3: 피드 문구 유틸 — 채널 링크 추출·복사본·실패 안내문

**Files:**
- Modify: `liv-clinic/src/lib/chat/slackText.ts` (`FAILURE_REASON_KO` 268~272행, 파일 끝에 함수 2개)
- Test: `liv-clinic/src/lib/chat/__tests__/slackText.test.ts` (끝에 describe 추가)

**Interfaces:**
- Produces:
  ```ts
  export function extractRoomChannelFromFeedText(text: string): string | null   // '<#C0ABC>' | '<#C0ABC|name>' → 'C0ABC'
  export function buildFeedReplyMirrorText(args: { senderLabel: string | null; text: string }): string
  ```
  `buildDeliveryFailureText('session_not_found')`의 문구가 바뀐다.

- [ ] **Step 1: 실패하는 테스트 작성**

`slackText.test.ts` 끝에 추가(상단 import에 `extractRoomChannelFromFeedText`, `buildFeedReplyMirrorText`를 더한다; `buildDeliveryFailureText`는 이미 import돼 있다):

```ts
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

```

그리고 **기존** `describe('buildDeliveryFailureText')`(336~341행)의 첫 케이스 `'알려진 사유는 한국어로'`의 기대 문자열을 다음으로 교체한다(새 describe를 만들지 않는다):

```ts
    expect(buildDeliveryFailureText('session_not_found')).toBe(
      '⚠️ 방금 답글이 손님에게 전달되지 않았습니다 · 사유: 이 스레드는 상담과 연결돼 있지 않습니다. 사이드바의 손님 방(chat-…) 본문에 답해 주세요'
    );
```

- [ ] **Step 2: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/slackText.test.ts`
Expected: FAIL — export 없음 / 문구 불일치.

- [ ] **Step 3: 구현**

`FAILURE_REASON_KO`의 `session_not_found` 값을 교체:

```ts
const FAILURE_REASON_KO: Record<string, string> = {
  session_not_found: '이 스레드는 상담과 연결돼 있지 않습니다. 사이드바의 손님 방(chat-…) 본문에 답해 주세요',
  empty_text: '내용이 비어 있습니다',
  error: '서버 오류가 났습니다. 관리자 화면에서 다시 보내 주세요',
};
```

파일 끝에 추가:

```ts
// ── 피드 줄 스레드 답장 (2026-09-10) ─────────────────────────────────────────

/** 피드 줄 본문의 첫 채널 링크 `<#C…>` 또는 `<#C…|이름>` → 채널 ID. 없으면 null. */
export function extractRoomChannelFromFeedText(text: string): string | null {
  const m = /<#([CG][A-Z0-9]+)(?:\|[^>]*)?>/.exec(text);
  return m ? m[1] : null;
}

/** 피드 스레드에 달린 직원 답장을 손님 방에 남기는 복사본. */
export function buildFeedReplyMirrorText(args: { senderLabel: string | null; text: string }): string {
  const who = args.senderLabel ? ` · ${escapeSlackText(args.senderLabel)}` : '';
  return [`↩️ _피드에서 답함${who}_`, escapeSlackText(args.text)].join('\n');
}
```

- [ ] **Step 4: 통과 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/slackText.test.ts`
Expected: PASS (기존 케이스 포함).

- [ ] **Step 5: 커밋**

```bash
git add liv-clinic/src/lib/chat/slackText.ts liv-clinic/src/lib/chat/__tests__/slackText.test.ts
git commit -m "feat(chat): 피드 줄 채널 링크 추출·답장 복사본 문구·미연결 안내문"
```

---

### Task 4: 호출부를 비동기 명단으로 전환 (`slackRelay.ts`, `escalationRunner.ts`)

**Files:**
- Modify: `liv-clinic/src/lib/chat/slackRelay.ts` (15행 import, 81~84행 `hasResponders`, 210행, 441행, 619~620행, 678행)
- Modify: `liv-clinic/src/lib/chat/escalationRunner.ts` (5행 import, 22행)

**Interfaces:**
- Consumes (Task 2): `loadStaffDirectory(): Promise<StaffDirectory>`, `resolveStaffLabel(userId, directory): Promise<string>`, `mentionOf`, `type StaffDirectory`
- Produces: 외부 시그니처 변화 없음(`relayChatMessageToSlack`, `relaySlackReplyToVisitor`, `archiveSessionRoom`, `notifyDeliveryFailure`, `runEscalations` 그대로).

- [ ] **Step 1: 타입 오류로 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsc --noEmit`
Expected: `slackRelay.ts`·`escalationRunner.ts`에서 `getStaffDirectory` has no exported member 오류.

- [ ] **Step 2: `slackRelay.ts` 수정**

import(15행):

```ts
import { loadStaffDirectory, mentionOf, resolveStaffLabel, type StaffDirectory } from '@/lib/chat/slackStaff';
```

`hasResponders`(81~84행):

```ts
/** 답변 직원이 한 명도 없으면 방·피드·실패 알림 등 오늘 없던 Slack 트래픽은 만들지 않는다. */
async function hasResponders(): Promise<boolean> {
  return (await loadStaffDirectory()).responderIds.length > 0;
}
```

`relayChatMessageToSlack` 안(210행): `const staff = getStaffDirectory();` → `const staff = await loadStaffDirectory();`

`archiveSessionRoom` 안(441행): `if (!hasResponders()) return;` → `if (!(await hasResponders())) return;`

`relaySlackReplyToVisitor` 안(619~620행):

```ts
    const staff = await loadStaffDirectory();
    const senderLabel = await resolveStaffLabel(args.slackUserId, staff);
```

`notifyDeliveryFailure` 안(678행): `if (!hasResponders()) return;` → `if (!(await hasResponders())) return;`

- [ ] **Step 3: `escalationRunner.ts` 수정**

5행: `import { loadStaffDirectory, mentionOf } from '@/lib/chat/slackStaff';`
22행: `const staff = await loadStaffDirectory();`

- [ ] **Step 4: 타입·전체 테스트 통과 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsc --noEmit && NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run`
Expected: tsc 오류 0, vitest 전부 PASS (Task 1~3에서 늘어난 케이스 포함, 기준선 560건 이상).

`grep -rn "getStaffDirectory" liv-clinic/src` 결과가 **비어 있어야** 한다.

- [ ] **Step 5: 커밋**

```bash
git add liv-clinic/src/lib/chat/slackRelay.ts liv-clinic/src/lib/chat/escalationRunner.ts
git commit -m "refactor(chat): 릴레이·확대 알림이 채널 멤버 명단을 비동기로 읽도록 전환"
```

---

### Task 5: 피드 줄 스레드 답장 → 손님 전달 + 방 복사

**Files:**
- Create: `liv-clinic/src/lib/chat/__tests__/fakeAdmin.ts`
- Modify: `liv-clinic/src/lib/chat/slackRelay.ts` (import 6~14행·22~29행, `findSessionByThread` 뒤, `relaySlackReplyToVisitor` 590~671행)
- Test: `liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts` (끝에 describe 추가)

**Interfaces:**
- Consumes: Task 1 `fetchThreadParent`, Task 3 `extractRoomChannelFromFeedText`·`buildFeedReplyMirrorText`, Task 2 `parseStaffDirectory`(테스트 모킹용)
- Produces: `relaySlackReplyToVisitor` 동작 확장(시그니처 불변). 테스트 헬퍼 `fakeAdmin(handler)`.

- [ ] **Step 1: 테스트 헬퍼 작성**

`liv-clinic/src/lib/chat/__tests__/fakeAdmin.ts`:

```ts
// supabase-js admin 클라이언트의 체이닝 빌더를 흉내 낸다.
// 각 from() 체인이 끝(maybeSingle/single/await)에 닿으면 handler(op)의 결과를 돌려준다.
export interface FakeOp {
  table: string;
  op: 'select' | 'update' | 'insert';
  filters: Array<[column: string, operator: string, value: unknown]>;
  payload?: unknown;
}

export interface FakeResult {
  data?: unknown;
  error?: { code: string; message?: string } | null;
}

export function fakeAdmin(handler: (op: FakeOp) => FakeResult) {
  const ops: FakeOp[] = [];
  const client = {
    ops,
    from(table: string) {
      const op: FakeOp = { table, op: 'select', filters: [] };
      ops.push(op);
      const finish = () => {
        const r = handler(op);
        return { data: r.data ?? null, error: r.error ?? null };
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b: any = {
        select: () => b,
        update: (payload: unknown) => ((op.op = 'update'), (op.payload = payload), b),
        insert: (payload: unknown) => ((op.op = 'insert'), (op.payload = payload), b),
        eq: (c: string, v: unknown) => (op.filters.push([c, 'eq', v]), b),
        is: (c: string, v: unknown) => (op.filters.push([c, 'is', v]), b),
        not: (c: string, o: string, v: unknown) => (op.filters.push([c, `not.${o}`, v]), b),
        lt: (c: string, v: unknown) => (op.filters.push([c, 'lt', v]), b),
        limit: () => b,
        order: () => b,
        maybeSingle: () => Promise.resolve(finish()),
        single: () => Promise.resolve(finish()),
        then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(finish()).then(res, rej),
      };
      return b;
    },
  };
  return client;
}

export function hasFilter(op: FakeOp, column: string, value: unknown): boolean {
  return op.filters.some(([c, , v]) => c === column && v === value);
}
```

- [ ] **Step 2: 실패하는 테스트 작성**

`slackRelay.test.ts` 맨 위 import 블록을 다음으로 교체하고, 파일 끝에 describe를 추가:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../db', () => ({ createChatAdminClient: vi.fn() }));
vi.mock('../broadcast', () => ({ broadcastToSession: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../translation', () => ({
  translate: vi.fn().mockResolvedValue({ status: 'success', text: '翻译', latencyMs: 1 }),
}));
vi.mock('../slackStaff', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../slackStaff')>();
  return {
    ...actual,
    loadStaffDirectory: vi.fn(async () => actual.parseStaffDirectory('U0AAA:이정현', 'U0OBS:이재호')),
    resolveStaffLabel: vi.fn(async (id: string | null) => (id === 'U0AAA' ? '이정현' : actual.UNKNOWN_STAFF_LABEL)),
  };
});
vi.mock('../slack', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../slack')>()),
  fetchThreadParent: vi.fn(),
  postSlackMessage: vi.fn(),
}));

import { createChatAdminClient } from '../db';
import { fetchThreadParent, postSlackMessage } from '../slack';
import { relaySlackReplyToVisitor, resolveTarget } from '../slackRelay';
import { fakeAdmin, hasFilter, type FakeOp } from './fakeAdmin';
```

(기존 `describe('resolveTarget', …)` 블록은 그대로 둔다.) 파일 끝에 추가:

```ts
describe('relaySlackReplyToVisitor — #해외문의 피드 줄 스레드 답장', () => {
  const ROOM_SESSION = {
    id: '5b0c7c1a-07c0-49bc-91da-2f556884b769',
    visitor_name: null,
    visitor_email: null,
    visitor_locale: 'zh',
    status: 'open',
    slack_mode: 'room',
    slack_channel_id: 'C0ROOM',
    slack_thread_ts: null,
    assigned_slack_user_id: null,
    assigned_label: null,
    resolved_at: null,
  };

  const parentMock = vi.mocked(fetchThreadParent);
  const postMock = vi.mocked(postSlackMessage);
  const adminMock = vi.mocked(createChatAdminClient);

  /** 기본 DB: 세션 스레드/메시지 ts로는 못 찾고, 방 채널 C0ROOM으로는 찾는다. */
  function defaultHandler(op: FakeOp) {
    if (op.table === 'chat_sessions' && op.op === 'select' && hasFilter(op, 'slack_channel_id', 'C0ROOM')) {
      return { data: ROOM_SESSION };
    }
    if (op.table === 'chat_messages' && op.op === 'insert') return { data: { id: 'm-new' } };
    if (op.op === 'update') return { data: [{ id: ROOM_SESSION.id }] };
    return { data: null };
  }

  const INBOUND = {
    channel: 'C0FEED',
    slackTs: '1788999999.000100',
    threadTs: '1788966626.694829',
    isTopLevel: false,
    isBroadcast: false,
    text: '안녕하세요~ 리브성형외과입니다.',
    slackUserId: 'U0AAA',
  };

  beforeEach(() => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-test';
    process.env.SLACK_CHANNEL_ID = 'C0FEED';
    parentMock.mockReset();
    postMock.mockReset();
    postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0ROOM' });
  });

  afterEach(() => {
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_CHANNEL_ID;
  });

  it('부모 피드 줄의 <#채널>로 방 세션을 찾아 전달하고 방에 복사한다', async () => {
    const admin = fakeAdmin(defaultHandler);
    adminMock.mockReturnValue(admin as never);
    parentMock.mockResolvedValue({ ok: true, data: { text: '🔴 *새 문의* · 익명 · <#C0ROOM> · 09/10(목) 00:10 KST', botId: 'B1' } });

    const outcome = await relaySlackReplyToVisitor(INBOUND);

    expect(outcome).toBe('delivered');
    expect(parentMock).toHaveBeenCalledWith('C0FEED', INBOUND.threadTs);
    const insert = admin.ops.find((o) => o.table === 'chat_messages' && o.op === 'insert');
    expect(insert?.payload).toMatchObject({
      session_id: ROOM_SESSION.id,
      sender: 'operator',
      source: 'slack',
      slack_user_id: 'U0AAA',
      sender_label: '이정현',
      original_text: INBOUND.text,
      translated_text: '翻译',
    });
    const assign = admin.ops.find((o) => o.table === 'chat_sessions' && o.op === 'update');
    expect(assign?.payload).toMatchObject({ assigned_slack_user_id: 'U0AAA', assigned_label: '이정현' });
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0ROOM' });
    expect(postMock.mock.calls[0][0].text).toContain('피드에서 답함 · 이정현');
    expect(postMock.mock.calls[0][0].text).toContain(INBOUND.text);
  });

  it('부모에 채널 링크가 없으면 session_not_found, 저장하지 않는다', async () => {
    const admin = fakeAdmin(defaultHandler);
    adminMock.mockReturnValue(admin as never);
    parentMock.mockResolvedValue({ ok: true, data: { text: '새 채팅 문의 — 익명 (en)', botId: 'B1' } });

    expect(await relaySlackReplyToVisitor(INBOUND)).toBe('session_not_found');
    expect(admin.ops.some((o) => o.op === 'insert')).toBe(false);
    expect(postMock).not.toHaveBeenCalled();
  });

  it('부모가 봇 메시지가 아니면 session_not_found', async () => {
    const admin = fakeAdmin(defaultHandler);
    adminMock.mockReturnValue(admin as never);
    parentMock.mockResolvedValue({ ok: true, data: { text: '<#C0ROOM> 여기 봐주세요', botId: null } });
    expect(await relaySlackReplyToVisitor(INBOUND)).toBe('session_not_found');
  });

  it('부모 조회가 실패해도 session_not_found (⚠️ 안내로 방에 쓰도록 유도)', async () => {
    adminMock.mockReturnValue(fakeAdmin(defaultHandler) as never);
    parentMock.mockResolvedValue({ ok: false, error: 'ratelimited' });
    expect(await relaySlackReplyToVisitor(INBOUND)).toBe('session_not_found');
  });

  it('방 복사가 실패해도 손님 전달은 delivered', async () => {
    const admin = fakeAdmin(defaultHandler);
    adminMock.mockReturnValue(admin as never);
    parentMock.mockResolvedValue({ ok: true, data: { text: '🔔 다시 열림 · <#C0ROOM|chat-zh-5b0c7c>', botId: 'B1' } });
    postMock.mockResolvedValue({ ok: false, error: 'is_archived' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(await relaySlackReplyToVisitor(INBOUND)).toBe('delivered');
    expect(warn.mock.calls.some((c) => String(c[0]).includes('feed reply mirror failed'))).toBe(true);
    warn.mockRestore();
  });

  it('관찰자의 피드 답장도 전달되지만 담당자가 되지는 않는다', async () => {
    const admin = fakeAdmin(defaultHandler);
    adminMock.mockReturnValue(admin as never);
    parentMock.mockResolvedValue({ ok: true, data: { text: '🔴 새 문의 · <#C0ROOM>', botId: 'B1' } });

    expect(await relaySlackReplyToVisitor({ ...INBOUND, slackUserId: 'U0OBS' })).toBe('delivered');
    expect(admin.ops.some((o) => o.table === 'chat_sessions' && o.op === 'update')).toBe(false);
  });

  it('방 본문 답장(기존 경로)은 부모를 조회하지 않고 복사도 하지 않는다', async () => {
    const admin = fakeAdmin(defaultHandler);
    adminMock.mockReturnValue(admin as never);

    const outcome = await relaySlackReplyToVisitor({
      channel: 'C0ROOM',
      slackTs: '3.0',
      threadTs: null,
      isTopLevel: true,
      isBroadcast: false,
      text: '방에서 답',
      slackUserId: 'U0AAA',
    });
    expect(outcome).toBe('delivered');
    expect(parentMock).not.toHaveBeenCalled();
    expect(postMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/slackRelay.test.ts`
Expected: 새 케이스 중 첫 번째·다섯 번째·여섯 번째가 FAIL(`session_not_found`가 나옴, `fetchThreadParent` 미호출). 나머지 세 개는 우연히 통과할 수 있다 — 첫 케이스 실패면 충분.

- [ ] **Step 4: 구현**

`slackRelay.ts` import에 추가:

```ts
import {
  _internals,
  archiveChannel,
  fetchThreadParent,
  getSlackChannelId,
  isSlackRelayConfigured,
  postSlackMessage,
  slackTextToPlain,
  unarchiveChannel,
} from '@/lib/chat/slack';
```

`@/lib/chat/slackText` import 목록에 `buildFeedReplyMirrorText`, `extractRoomChannelFromFeedText` 추가.

`findSessionByThread` 바로 뒤에 추가:

```ts
/**
 * 3단계 — #해외문의 피드 줄("새 문의 · <#방>", "다시 열림", "N분째 미응답")의 스레드.
 * 부모 메시지를 읽어 <#채널> 링크로 방 세션을 찾는다. 우리 봇의 메시지가 아니거나 링크가 없으면 null.
 * API 실패도 null — ⚠️ 안내문이 방 본문에 쓰도록 유도한다.
 */
async function findSessionByFeedParent(
  admin: ChatAdminClient,
  channel: string,
  threadTs: string
): Promise<SessionLookup> {
  const parent = await fetchThreadParent(channel, threadTs);
  if (!parent.ok) {
    console.warn('[slack relay] feed parent lookup failed:', parent.error);
    return null;
  }
  if (!parent.data.botId) return null;
  const roomChannel = extractRoomChannelFromFeedText(parent.data.text);
  if (!roomChannel) return null;
  return findSessionByRoom(admin, roomChannel);
}
```

`relaySlackReplyToVisitor`의 세션 조회 부분(599~605행)을 다음으로 교체:

```ts
    let lookup =
      route.kind === 'room'
        ? await findSessionByRoom(admin, route.channel)
        : await findSessionByThread(admin, route.threadTs);
    let viaFeed = false;
    if (lookup === null && route.kind === 'legacy_thread') {
      lookup = await findSessionByFeedParent(admin, args.channel, route.threadTs);
      viaFeed = lookup !== null && lookup !== LOOKUP_ERROR;
    }
    // 조회 실패는 "우리 방이 아님"이 아니다 — 무음 처리하면 직원 답글이 조용히 사라진다.
    if (lookup === LOOKUP_ERROR) return 'error';
    if (!lookup) return route.kind === 'room' ? 'unknown_channel' : 'session_not_found';
    const session: RelaySessionRow = lookup;
```

(이후 코드는 `session` 변수를 그대로 쓴다.) `broadcastToSession(...)` 호출과 `return 'delivered';` 사이에 추가:

```ts
    if (viaFeed && session.slack_mode === 'room' && session.slack_channel_id) {
      const mirror = await postSlackMessage({
        text: buildFeedReplyMirrorText({ senderLabel, text: plain }),
        channelId: session.slack_channel_id,
      });
      if (!mirror.ok) console.warn('[slack relay] feed reply mirror failed:', mirror.error);
    }
```

- [ ] **Step 5: 통과 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsc --noEmit && NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run`
Expected: tsc 오류 0, vitest 전부 PASS.

- [ ] **Step 6: 커밋**

```bash
git add liv-clinic/src/lib/chat/slackRelay.ts liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts liv-clinic/src/lib/chat/__tests__/fakeAdmin.ts
git commit -m "feat(chat): #해외문의 피드 줄 스레드 답장을 손님에게 전달하고 방에 복사"
```

---

### Task 6: 문서·환경변수 예시 갱신

**Files:**
- Modify: `.env.example` (41~46행)
- Modify: `docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md` (§1 스코프 목록 25~34행, §5 59~74행, §7 98~110행, §10 표 140행)
- Modify: `docs/superpowers/specs/2026-09-03-slack-patient-rooms-design.md` (문서 상단 메모 1줄)

- [ ] **Step 1: `.env.example` 수정**

41~46행을 다음으로 교체:

```
# #해외문의 채널 ID — 새 문의/완료/재오픈/미응답 한 줄 피드 + 방 생성 실패 시 스레드 폴백.
# 이 채널의 사람 멤버가 곧 답변 직원(방 초대 + 멘션 + 담당 대상)이다. 직원 추가/제외는 채널 멤버로만 관리한다.
SLACK_CHANNEL_ID=
# 관찰자 명단 "ID:이름,ID:이름" (원장님 계정 등) — 방에 초대만 되고 멘션·담당 대상이 아니다
SLACK_OBSERVERS=
# 긴급 정지: off 로 두면 방을 만들지 않고 #해외문의 스레드 방식으로만 동작한다. 평소에는 비워 둔다
SLACK_ROOMS=
```

`SLACK_STAFF` 줄은 삭제한다.

- [ ] **Step 2: 설정 안내 문서 수정**

`2026-09-03-slack-patient-rooms-slack-setup.md`:

1. §1(스코프): 목록에 `users:read` 추가. 32행의 "네 개" → "다섯 개: `chat:write`, `groups:history`, `groups:write`, `groups:read`, `users:read`". 34행 뜻 설명에 `users:read`: "직원 이름을 Slack 프로필에서 읽어 관리자 화면·방에 표시한다" 추가. 그 아래에 한 줄: "> 2026-09-10 추가. 이미 설치된 앱이면 스코프 추가 후 **§3 재설치**를 한 번 더 한다. 토큰 값은 바뀌지 않는다."
2. §5(멤버 ID 확인) 제목을 `## 5. E — 직원 추가·제외 (채널 멤버로만)`로 바꾸고 본문 전체를 다음으로 교체:

```
2026-09-10부터 답변 직원 명단은 **`#해외문의` 채널의 사람 멤버**로 자동 정해집니다. 멤버 ID를 찾거나 Netlify에 적을 일이 없습니다.

- **새 직원**: `#해외문의` 채널에서 "채널에 사람 추가"로 초대합니다. 다음 손님 문의부터 자동으로 방에 초대되고 멘션됩니다.
- **퇴사자**: `#해외문의`에서 내보냅니다(또는 Slack 계정 비활성화). 이후 새 방에 초대되지 않습니다.
- **원장님(관찰자)**: 채널에 있어도 `SLACK_OBSERVERS`에 적혀 있으면 멘션·담당에서 빠집니다(§6).
- 이미 만들어진 손님 방에는 소급되지 않습니다. 필요하면 그 방에서 직접 초대하세요.
```

3. §6 표(환경변수)에서 `SLACK_STAFF` 행을 삭제하고 `SLACK_ROOMS` 행 추가: "`SLACK_ROOMS` · 비워 둠 · `off`로 두면 긴급 정지(방 생성·멘션·확대 알림 중지, 스레드 방식)".
4. §7(직원 명단 채우고 재배포) 본문을 "2026-09-10부터 이 단계는 없습니다. 직원은 §5대로 채널 멤버로 관리합니다."로 교체.
5. §10 표 140행의 원인 열에서 "`SLACK_STAFF` 비어 있음"을 "`#해외문의`에 사람 멤버가 없음 / `SLACK_ROOMS=off`"로 바꾼다.

- [ ] **Step 3: 09-03 설계 문서에 메모**

`2026-09-03-slack-patient-rooms-design.md` 3~4행(결정 메모) 아래에 한 줄 추가:

```
> 2026-09-10 개정: §6 직원 명단(`SLACK_STAFF`)은 **`#해외문의` 채널 멤버 자동 산출**로 대체, 피드 줄 스레드 답장은 손님에게 전달 + 방 복사. 자세한 내용은 `2026-09-10-slack-staff-from-channel-design.md`.
```

- [ ] **Step 4: 확인**

`grep -rn "SLACK_STAFF" .env.example liv-clinic/src` 결과가 `slackStaff.ts`의 경고 문자열·주석 외에는 없어야 한다. 문서(`docs/`)에 남은 언급은 역사 기록이라 허용.

- [ ] **Step 5: 커밋**

```bash
git add .env.example docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md docs/superpowers/specs/2026-09-03-slack-patient-rooms-design.md
git commit -m "docs(chat): 직원 명단 채널 멤버 관리·users:read·SLACK_ROOMS 반영, SLACK_STAFF 폐기"
```

---

### Task 7: 롤아웃 (메인 세션 — 하위 에이전트에 맡기지 않는다)

**Files:** 없음(운영 절차)

- [ ] **Step 1: 최종 검증**

`liv-clinic/`에서 `NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsc --noEmit && NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run` 통과, `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 npm run build` 통과.

- [ ] **Step 2: 원장님 작업 안내**

api.slack.com/apps → LIV Chat Alert(A0BNP20H116) → OAuth & Permissions → Bot Token Scopes에 `users:read` 추가 → 상단 "Reinstall to Workspace". 배포 전후 무관.

- [ ] **Step 3: 머지·배포**

`D:\dev\LIV_homepage`(master 체크아웃)에서 `git merge --no-ff feature/slack-staff-from-channel` → `git push origin master`(=Netlify 배포). 배포 상태: `NODE_TLS_REJECT_UNAUTHORIZED=0 netlify api listSiteDeploys --data '{"site_id":"de7005fe-c770-4b2f-bbe0-1025513014d5","per_page":1}'` 로 `state: ready` 확인.

- [ ] **Step 4: 스모크**

1. 홈페이지 채팅(외국어 로케일)으로 테스트 문의 1건 → Slack에 새 방 생성, 멤버가 `#해외문의` 사람 전원(현재 이정현·방애금·유다영·이재호) 인지 확인, 첫 문의 멘션에 관찰자(이재호) 제외 3명.
2. `#해외문의` 피드 줄 스레드에 답장 → 손님 화면 수신 + 방에 "↩️ 피드에서 답함 · 이름" 복사 확인. `users:read` 전이면 이름이 "Slack 직원".
3. 테스트 세션은 관리자 화면에서 완료 처리(방 보관).

- [ ] **Step 5: `SLACK_STAFF` 삭제**

`NODE_TLS_REJECT_UNAUTHORIZED=0 netlify env:unset SLACK_STAFF --site de7005fe-c770-4b2f-bbe0-1025513014d5` → `netlify env:get SLACK_STAFF --site …`가 빈 값. 코드가 읽지 않으므로 재배포 불필요(경고 로그만 사라진다).

- [ ] **Step 6: 메모리 갱신**

`chat-slack-rooms-direction.md`·`liv-slack-rooms-rollout-notes.md`의 `SLACK_STAFF` 관련 항목(1·3·5)을 "채널 멤버 자동"으로 정정.
