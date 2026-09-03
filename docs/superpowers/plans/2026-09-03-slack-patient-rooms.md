# Slack 환자별 채널(방) 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 라이브채팅의 Slack 연동을 "손님 1명 = 비공개 채널 1개"로 바꾸고, 완료=보관, 담당자 자동 지정, 미응답 멘션 확대, 손님 자동 첫 안내, 친근한 번역 말투를 함께 넣는다.

**Architecture:** 기존 Slack 릴레이(`slackRelay.ts`)를 유지하되 세션마다 `slack_mode`(room/thread)를 두고, 방 모드에서는 봇이 비공개 채널을 만들어 직원을 초대하고 그 채널 본문을 손님에게 전달한다. 문구·이름·판정은 전부 I/O 없는 순수 모듈로 분리해 Vitest로 고정하고, DB·Slack 접근은 얇은 어댑터에 모은다. 미응답 확대 알림은 Netlify 예약 함수 → `/api/chat/ops` 라우트가 3분마다 처리한다.

**Tech Stack:** Next.js 16 App Router(`after()`), Supabase(service_role, postgres 트리거), Slack Web API(`chat:write`, `groups:write`, `groups:read`), Vitest, zod, Netlify Scheduled Functions(`.mts`), OpenAI 번역(기존).

**Spec:** `docs/superpowers/specs/2026-09-03-slack-patient-rooms-design.md` (이하 "스펙"). 사람이 할 Slack/Netlify 설정: `docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md`.

## Global Constraints

- 모든 npm 명령은 `D:\dev\LIV_homepage\liv-clinic\` 에서 실행한다. 상위 폴더에는 package.json이 없다.
- 이 PC는 TLS 프록시 뒤다: `npm run build`는 `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1`, DB 스크립트는 `NODE_TLS_REJECT_UNAUTHORIZED=0`을 붙인다(프로덕션 무관).
- `src/messages/*.json`(11개 로케일)은 **건드리지 않는다.** `verify:i18n`이 prebuild 게이트다. 손님 문구 신규는 `serverI18n.ts`의 자동 안내 2종뿐이다.
- Slack 경로는 **throw-free**: 어떤 Slack 실패도 채팅·완료 처리를 막지 않는다. `console.warn` 1줄로 끝낸다.
- `chat.delete`는 어떤 경로로도 호출하지 않는다. `conversations.history`/`replies`로 Slack을 읽지 않는다.
- `chat_sessions`에 고빈도 쓰기를 추가하지 않는다(030 REPLICA IDENTITY FULL). 메시지당 세션 UPDATE는 트리거 1회 + 담당 갱신 1회(Slack 답글 시)까지만.
- 관리자 화면 문구는 쉬운 한국어. '퍼널', '아카이브', '세션', 'SLA', 'p95' 금지.
- `SLACK_STAFF`가 비어 있으면 **현행 스레드 방식과 100% 동일하게** 동작해야 한다(안전 스위치).
- 커밋은 이 작업 파일만 명시적 `git add <경로>`. `git add -A` 금지. 리포에 있는 무관한 미커밋 변경(CLAUDE.md, .codex/, 다른 브랜치 작업물)은 절대 포함하지 않는다.
- 커밋 메시지 끝에 `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` 한 줄.
- 테스트 실행: `npx vitest run <파일경로>` (단일 파일), 전체는 `npm run test`.

## File Structure

| 파일 | 상태 | 책임 |
|------|:----:|------|
| `src/lib/chat/kst.ts` | 신규 | KST 문자열 (`formatKst`, `formatKstTime`) |
| `src/lib/chat/slackStaff.ts` | 신규 | `SLACK_STAFF`/`SLACK_OBSERVERS` 파싱, 멘션·라벨 |
| `src/lib/chat/slack.ts` | 수정 | `callSlack` 공통 호출기 + 채널 생성/초대/주제/보관/해제 |
| `src/lib/chat/slackText.ts` | 신규 | Slack 문구 빌더 전부 (기존 3개 이전 + 방/피드/확대/실패 문구) |
| `supabase/migrations/040_chat_slack_rooms.sql` + `src/types/supabase.ts` | 신규/수정 | 컬럼·인덱스·트리거 |
| `src/lib/chat/slackRooms.ts` | 신규 | 채널 이름, `ensureRoom` (RoomDeps 포트) |
| `src/lib/chat/escalation.ts` | 신규 | 확대 알림 단계 판정(순수) |
| `src/lib/chat/slackEvents.ts` | 수정 | 분류기 확장 + `routeInbound` |
| `src/lib/chat/slackRelay.ts` | 재작성 | 모드 해석, 아웃바운드/인바운드, 보관/해제, 실패 알림 |
| `src/app/api/slack/events/route.ts` | 수정 | 새 결정 2종 + 실패 알림 |
| `src/lib/chat/serverI18n.ts` + `src/lib/chat/autoAck.ts` | 수정/신규 | 자동 첫 안내 |
| `src/app/api/chat/messages/route.ts` | 수정 | receivedAt·sender_label 전달, 자동 안내 호출 |
| `src/app/api/chat/sessions/[id]/route.ts` + `src/lib/chat/chatApi.ts` | 수정 | resolve/unresolve/close |
| `src/lib/chat/escalationRunner.ts` + `src/app/api/chat/ops/route.ts` + `netlify/functions/chat-ops.mts` | 신규 | 미응답 확대 알림 크론 |
| `src/lib/chat/translation.ts` | 수정 | 친근한 말투 규칙 |
| `src/app/admin/(authenticated)/chat/page.tsx`, `[sessionId]/page.tsx`, `[sessionId]/ChatDetailClient.tsx` | 수정 | 탭·담당·완료 버튼·KST·작성자 라벨 |
| `.env.example`, `scripts/_db/run-sql.mjs` | 수정/신규 | 환경변수 문서, 마이그레이션 적용/검증 스크립트 |

---

### Task 0: 브랜치와 문서 커밋

**Files:**
- 커밋: `docs/superpowers/specs/2026-09-03-slack-patient-rooms-design.md`, `docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md`, `docs/superpowers/plans/2026-09-03-slack-patient-rooms.md`

- [ ] **Step 1: 작업 트리 상태 확인**

Run: `git -C D:\dev\LIV_homepage branch --show-current && git -C D:\dev\LIV_homepage status --short | head -20`
Expected: 현재 브랜치가 `master`가 아니면(예: `fix/image-upload-pipeline`) **다른 세션의 작업 중**이다. 그 브랜치의 변경이 커밋·머지될 때까지 기다리거나 원장님에게 확인한 뒤 진행한다. 미커밋 tracked 변경(`.gitignore`, `CLAUDE.md`, `translation.ts` 등)은 이 작업의 것이 아니다 — 절대 스테이징하지 않는다.

- [ ] **Step 2: master에서 브랜치 생성**

```bash
git -C D:\dev\LIV_homepage checkout master
git -C D:\dev\LIV_homepage pull --ff-only
git -C D:\dev\LIV_homepage checkout -b feature/chat-slack-rooms
```

- [ ] **Step 3: 문서 3개만 커밋**

```bash
cd D:\dev\LIV_homepage
git add docs/superpowers/specs/2026-09-03-slack-patient-rooms-design.md docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md docs/superpowers/plans/2026-09-03-slack-patient-rooms.md
git commit -m "docs(chat): Slack 환자별 채널 전환 설계·설정 안내·구현 계획

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 1: KST 시각 문자열 — `kst.ts`

**Files:**
- Create: `liv-clinic/src/lib/chat/kst.ts`
- Test: `liv-clinic/src/lib/chat/__tests__/kst.test.ts`

**Interfaces:**
- Produces: `formatKst(input: string | Date): string` → `'01/01(월) 09:00 KST'`, `formatKstTime(input: string | Date): string` → `'09:00 KST'`. 이후 모든 Slack 문구가 이 두 함수만 쓴다. `<!date>` 토큰은 쓰지 않는다(스펙 §4.3).

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/chat/__tests__/kst.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { formatKst, formatKstTime } from '../kst';

// 2024-01-01은 월요일 — 요일 계산의 기준점으로 쓴다.
describe('formatKst', () => {
  it('UTC 시각을 KST 날짜·요일·시각으로 굽는다', () => {
    expect(formatKst('2024-01-01T00:00:00Z')).toBe('01/01(월) 09:00 KST');
  });

  it('자정을 넘기면 KST 기준 다음 날로 표기한다', () => {
    expect(formatKst('2023-12-31T15:30:00Z')).toBe('01/01(월) 00:30 KST');
  });

  it('Date 객체도 받는다 (토요일)', () => {
    expect(formatKst(new Date('2024-01-06T03:05:00Z'))).toBe('01/06(토) 12:05 KST');
  });

  it('한 자리 월·일·시·분을 0으로 채운다', () => {
    expect(formatKst('2024-03-04T22:07:00Z')).toBe('03/05(화) 07:07 KST');
  });
});

describe('formatKstTime', () => {
  it('시각만 굽는다', () => {
    expect(formatKstTime('2024-01-01T05:03:00Z')).toBe('14:03 KST');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/chat/__tests__/kst.test.ts`
Expected: FAIL — `Cannot find module '../kst'`

- [ ] **Step 3: 구현**

`src/lib/chat/kst.ts`:
```ts
// KST(UTC+9) 고정 표기. 한국은 서머타임이 없으므로 산술로 충분하다 (businessHours.ts와 같은 방식).
// Slack의 <!date> 토큰은 "보는 기기의 시간대"로 렌더되어 KST를 보장하지 못하므로 서버에서 문자열을 굽는다.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

interface KstParts {
  month: number;
  day: number;
  weekday: (typeof WEEKDAY_KO)[number];
  hour: number;
  minute: number;
}

function kstParts(input: string | Date): KstParts {
  const ms = typeof input === 'string' ? Date.parse(input) : input.getTime();
  const d = new Date(ms + KST_OFFSET_MS);
  return {
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    weekday: WEEKDAY_KO[d.getUTCDay()],
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

const pad = (n: number): string => String(n).padStart(2, '0');

/** `01/01(월) 09:00 KST` */
export function formatKst(input: string | Date): string {
  const p = kstParts(input);
  return `${pad(p.month)}/${pad(p.day)}(${p.weekday}) ${pad(p.hour)}:${pad(p.minute)} KST`;
}

/** `09:00 KST` */
export function formatKstTime(input: string | Date): string {
  const p = kstParts(input);
  return `${pad(p.hour)}:${pad(p.minute)} KST`;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/chat/__tests__/kst.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: 커밋**

```bash
git add liv-clinic/src/lib/chat/kst.ts liv-clinic/src/lib/chat/__tests__/kst.test.ts
git commit -m "feat(chat): KST 고정 시각 문자열 유틸

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: 직원 명단 — `slackStaff.ts`

**Files:**
- Create: `liv-clinic/src/lib/chat/slackStaff.ts`
- Test: `liv-clinic/src/lib/chat/__tests__/slackStaff.test.ts`

**Interfaces:**
- Produces:
  ```ts
  interface StaffDirectory {
    responderIds: string[];                 // SLACK_STAFF — 멘션·담당 대상
    inviteIds: string[];                    // responderIds + SLACK_OBSERVERS — 방 초대 대상
    isResponder(id: string | null | undefined): boolean;
    labelOf(id: string | null | undefined): string;   // 미등록 → 'Slack 직원'
    mentionAll(): string;                   // '<@U1> <@U2>' (답변 직원만)
  }
  parseStaffDirectory(staffRaw, observerRaw?): StaffDirectory   // 순수
  getStaffDirectory(): StaffDirectory                            // process.env 읽기
  mentionOf(id: string): string                                  // '<@U1>'
  UNKNOWN_STAFF_LABEL = 'Slack 직원'
  ```

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/chat/__tests__/slackStaff.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { mentionOf, parseStaffDirectory, UNKNOWN_STAFF_LABEL } from '../slackStaff';

describe('parseStaffDirectory — 답변 직원', () => {
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
});

describe('parseStaffDirectory — 관찰자 (원장님 계정)', () => {
  it('관찰자는 초대 대상이지만 멘션·담당 대상이 아니다', () => {
    const s = parseStaffDirectory('U0AAA:이정현', 'U0OBS:이재호');
    expect(s.inviteIds).toEqual(['U0AAA', 'U0OBS']);
    expect(s.responderIds).toEqual(['U0AAA']);
    expect(s.isResponder('U0OBS')).toBe(false);
    expect(s.isResponder('U0AAA')).toBe(true);
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
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/chat/__tests__/slackStaff.test.ts`
Expected: FAIL — `Cannot find module '../slackStaff'`

- [ ] **Step 3: 구현**

`src/lib/chat/slackStaff.ts`:
```ts
import 'server-only';

// 직원 명단은 환경변수 두 개로 관리한다. users:read 스코프 없이 이름을 표시하려고 이름을 함께 싣는다.
//   SLACK_STAFF="U0AAA:이정현,U0BBB:정소월,U0CCC"   답변 직원: 방 초대 + 멘션 + 담당 대상
//   SLACK_OBSERVERS="U0ZZZ:이재호"                    관찰자: 방 초대만. 멘션·담당 제외 (원장님 결정 2026-09-03)

export interface StaffDirectory {
  /** 답변 직원 ID (입력 순서, 중복 제거) */
  responderIds: string[];
  /** 방에 초대할 전원 = 답변 직원 + 관찰자 */
  inviteIds: string[];
  isResponder(id: string | null | undefined): boolean;
  /** 표시용 이름. 미등록이면 'Slack 직원' */
  labelOf(id: string | null | undefined): string;
  /** 답변 직원 전원 멘션 `<@U1> <@U2>`. 비어 있으면 '' */
  mentionAll(): string;
}

export const UNKNOWN_STAFF_LABEL = 'Slack 직원';
const ID_RE = /^[UW][A-Z0-9]{2,}$/;

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

export function parseStaffDirectory(
  staffRaw: string | undefined | null,
  observerRaw?: string | undefined | null
): StaffDirectory {
  const responders = parseList(staffRaw);
  const observers = parseList(observerRaw);
  for (const id of responders.keys()) observers.delete(id); // 양쪽에 있으면 답변 직원
  const responderIds = [...responders.keys()];
  const inviteIds = [...responderIds, ...observers.keys()];
  const labels = new Map([...observers, ...responders]);
  return {
    responderIds,
    inviteIds,
    isResponder: (id) => Boolean(id && responders.has(id)),
    labelOf: (id) => (id && labels.get(id)) || UNKNOWN_STAFF_LABEL,
    mentionAll: () => responderIds.map(mentionOf).join(' '),
  };
}

export function getStaffDirectory(): StaffDirectory {
  return parseStaffDirectory(process.env.SLACK_STAFF, process.env.SLACK_OBSERVERS);
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/chat/__tests__/slackStaff.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: 커밋**

```bash
git add liv-clinic/src/lib/chat/slackStaff.ts liv-clinic/src/lib/chat/__tests__/slackStaff.test.ts
git commit -m "feat(chat): Slack 직원·관찰자 명단 파서 (SLACK_STAFF / SLACK_OBSERVERS)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---
### Task 3: Slack API 래퍼 — 공통 호출기 + 채널 메서드 (`slack.ts`)

**Files:**
- Modify: `liv-clinic/src/lib/chat/slack.ts` (전체 교체 — 아래 코드)
- Test: `liv-clinic/src/lib/chat/__tests__/slack.test.ts` (기존 케이스 유지 + 추가)

**Interfaces:**
- Consumes: 없음 (fetch만)
- Produces:
  ```ts
  type SlackCallResult<T> = { ok: true; data: T } | { ok: false; error: string; retryAfterMs?: number };
  callSlack<T>(method: string, payload: object): Promise<SlackCallResult<T>>   // 429/5xx/timeout 1회 재시도, throw 없음
  postSlackMessage(args: { text: string; threadTs?: string | null; channelId?: string; replyBroadcast?: boolean }): Promise<PostMessageResult>  // 기존 시그니처 + replyBroadcast
  createPrivateChannel(name: string): Promise<SlackCallResult<{ channel: { id: string; name: string } }>>
  inviteToChannel(channelId: string, userIds: string[]): Promise<SlackCallResult<unknown>>   // already_in_channel → ok, 빈 목록 → 호출 없이 ok
  setChannelTopic(channelId: string, topic: string): Promise<SlackCallResult<unknown>>       // 250자 절단
  archiveChannel(channelId: string): Promise<SlackCallResult<unknown>>                      // already_archived → ok
  unarchiveChannel(channelId: string): Promise<SlackCallResult<unknown>>                    // not_archived → ok
  _internals.sleep(ms)   // 테스트에서 spy
  ```
  기존 `verifySlackSignature`, `slackTextToPlain`, `escapeSlackText`, `getSlackBotToken`, `getSlackChannelId`, `getSlackSigningSecret`, `isSlackRelayConfigured`, `PostMessageResult`는 **그대로** 유지.

- [ ] **Step 1: 실패하는 테스트 추가**

`src/lib/chat/__tests__/slack.test.ts` 맨 위 import를 아래로 바꾸고, 파일 끝에 describe 두 개를 추가한다.

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHmac } from 'crypto';
import {
  _internals,
  archiveChannel,
  callSlack,
  createPrivateChannel,
  inviteToChannel,
  postSlackMessage,
  unarchiveChannel,
  verifySlackSignature,
  slackTextToPlain,
  escapeSlackText,
} from '../slack';
```

파일 끝에 추가:
```ts
function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {}
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
}

describe('callSlack / postSlackMessage', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-test';
    process.env.SLACK_CHANNEL_ID = 'C0FEED';
    vi.spyOn(_internals, 'sleep').mockResolvedValue(undefined);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_CHANNEL_ID;
  });

  it('성공 응답을 기존 PostMessageResult 형태로 돌려준다', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true, ts: '1.2', channel: 'C1' }));
    const r = await postSlackMessage({ text: 'hi', channelId: 'C1' });
    expect(r).toEqual({ ok: true, ts: '1.2', channel: 'C1' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
    expect(body.channel).toBe('C1');
    expect(body.reply_broadcast).toBe(false);
  });

  it('replyBroadcast는 thread_ts가 있을 때만 켜진다', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true, ts: '1.2', channel: 'C1' }));
    await postSlackMessage({ text: 'hi', channelId: 'C1', threadTs: '1.0', replyBroadcast: true });
    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
    expect(body.thread_ts).toBe('1.0');
    expect(body.reply_broadcast).toBe(true);
  });

  it('429는 Retry-After 뒤 1회 재시도한다', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ ok: false, error: 'ratelimited' }, { status: 429, headers: { 'retry-after': '1' } })
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true, ts: '1.3', channel: 'C1' }));
    const r = await postSlackMessage({ text: 'hi', channelId: 'C1' });
    expect(r.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(_internals.sleep).toHaveBeenCalledWith(1000);
  });

  it('invalid_auth 같은 영구 오류는 재시도하지 않는다', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: false, error: 'invalid_auth' }));
    const r = await callSlack('chat.postMessage', { channel: 'C1', text: 'x' });
    expect(r).toEqual({ ok: false, error: 'invalid_auth' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('토큰이 없으면 fetch를 부르지 않는다', async () => {
    delete process.env.SLACK_BOT_TOKEN;
    global.fetch = vi.fn();
    expect(await callSlack('chat.postMessage', {})).toEqual({ ok: false, error: 'no_bot_token' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('네트워크 예외는 network_error로 돌려주고 throw하지 않는다', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('boom'));
    const r = await callSlack('chat.postMessage', {});
    expect(r).toEqual({ ok: false, error: 'network_error' });
  });
});

describe('채널 관리 메서드', () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-test';
    vi.spyOn(_internals, 'sleep').mockResolvedValue(undefined);
  });
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
    delete process.env.SLACK_BOT_TOKEN;
  });

  it('createPrivateChannel은 is_private로 만들고 채널 id·name을 돌려준다', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: true, channel: { id: 'C9', name: 'chat-thu-111111' } }));
    const r = await createPrivateChannel('chat-thu-111111');
    expect(r).toEqual({ ok: true, data: expect.objectContaining({ channel: { id: 'C9', name: 'chat-thu-111111' } }) });
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('https://slack.com/api/conversations.create');
    expect(JSON.parse(call[1].body as string)).toEqual({ name: 'chat-thu-111111', is_private: true });
  });

  it('createPrivateChannel은 name_taken을 그대로 돌려준다 (접미 재시도는 slackRooms 담당)', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: false, error: 'name_taken' }));
    expect(await createPrivateChannel('x')).toEqual({ ok: false, error: 'name_taken' });
  });

  it('inviteToChannel은 already_in_channel을 성공으로 본다', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: false, error: 'already_in_channel' }));
    expect((await inviteToChannel('C1', ['U1'])).ok).toBe(true);
  });

  it('inviteToChannel은 대상이 없으면 호출하지 않는다', async () => {
    global.fetch = vi.fn();
    expect((await inviteToChannel('C1', [])).ok).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('inviteToChannel은 ID를 쉼표로 이어 보낸다', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    await inviteToChannel('C1', ['U1', 'U2']);
    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
    expect(body).toEqual({ channel: 'C1', users: 'U1,U2' });
  });

  it('archiveChannel은 already_archived를, unarchiveChannel은 not_archived를 성공으로 본다', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: false, error: 'already_archived' }));
    expect((await archiveChannel('C1')).ok).toBe(true);
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: false, error: 'not_archived' }));
    expect((await unarchiveChannel('C1')).ok).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/chat/__tests__/slack.test.ts`
Expected: FAIL — `_internals`, `callSlack`, `createPrivateChannel` … export 없음

- [ ] **Step 3: `slack.ts` 전체 교체**

```ts
import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';

// Slack Web API / Events API 저수준 래퍼.
// - 순수 함수 + fetch만 담당. DB 접근/세션 해석은 slackRelay.ts.
// - throw-free: Slack 장애가 채팅을 막지 않는다.
// - 환경변수는 호출 시점에 읽는다 (빌드 타임 평가 방지 + 테스트에서 주입 가능).
// - 일시 오류(429/5xx/timeout/network)는 1회만 재시도한다. Retry-After를 존중하되 최대 2초.

const SLACK_API_BASE = 'https://slack.com/api/';

// Slack 서명 검증 허용 시간차 (replay 공격 방지). Slack 권장값 5분.
const SIGNATURE_MAX_AGE_SEC = 60 * 5;

const RETRYABLE = new Set([
  'ratelimited',
  'timeout',
  'network_error',
  'http_429',
  'http_500',
  'http_502',
  'http_503',
  'http_504',
]);

/** 테스트에서 spy 하기 위한 내부 훅. */
export const _internals = {
  sleep: (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
};

function postTimeoutMs(): number {
  return Number(process.env.SLACK_POST_TIMEOUT_MS ?? 5000);
}

export function getSlackBotToken(): string | null {
  return process.env.SLACK_BOT_TOKEN || null;
}

export function getSlackChannelId(): string | null {
  return process.env.SLACK_CHANNEL_ID || null;
}

export function getSlackSigningSecret(): string | null {
  return process.env.SLACK_SIGNING_SECRET || null;
}

/** 아웃바운드(방문자 → Slack) 릴레이가 가능한 상태인지. */
export function isSlackRelayConfigured(): boolean {
  return Boolean(getSlackBotToken() && getSlackChannelId());
}

export type SlackCallResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; retryAfterMs?: number };

async function callOnce<T>(
  method: string,
  payload: object,
  token: string
): Promise<SlackCallResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), postTimeoutMs());
  try {
    const res = await fetch(SLACK_API_BASE + method, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const retryAfterSec = Number(res.headers.get('retry-after'));
      return {
        ok: false,
        error: `http_${res.status}`,
        retryAfterMs:
          Number.isFinite(retryAfterSec) && retryAfterSec > 0 ? retryAfterSec * 1000 : undefined,
      };
    }

    const json = (await res.json()) as { ok?: boolean; error?: string } & T;
    if (!json.ok) return { ok: false, error: json.error ?? 'invalid_response' };
    return { ok: true, data: json };
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    return { ok: false, error: aborted ? 'timeout' : 'network_error' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Slack Web API 호출. 일시 오류는 1회 재시도. 어떤 경우에도 throw하지 않는다.
 * @param method 'chat.postMessage' 처럼 메서드 이름만.
 */
export async function callSlack<T = Record<string, unknown>>(
  method: string,
  payload: object
): Promise<SlackCallResult<T>> {
  const token = getSlackBotToken();
  if (!token) return { ok: false, error: 'no_bot_token' };

  let last: SlackCallResult<T> = { ok: false, error: 'not_called' };
  for (let attempt = 0; attempt < 2; attempt++) {
    last = await callOnce<T>(method, payload, token);
    if (last.ok || !RETRYABLE.has(last.error)) return last;
    if (attempt === 0) await _internals.sleep(Math.min(last.retryAfterMs ?? 800, 2000));
  }
  return last;
}

export interface PostMessageResult {
  ok: boolean;
  /** 성공 시 Slack 메시지 ts. 루트 메시지면 이 값이 세션의 thread_ts가 된다. */
  ts?: string;
  channel?: string;
  error?: string;
}

/**
 * chat.postMessage 호출.
 * - threadTs가 있으면 해당 스레드에 답글로 붙는다. replyBroadcast는 threadTs가 있을 때만 의미 있다.
 * - channelId 미지정 시 SLACK_CHANNEL_ID(#해외문의).
 */
export async function postSlackMessage(args: {
  text: string;
  threadTs?: string | null;
  channelId?: string;
  replyBroadcast?: boolean;
}): Promise<PostMessageResult> {
  if (!getSlackBotToken()) return { ok: false, error: 'no_bot_token' };
  const channel = args.channelId ?? getSlackChannelId();
  if (!channel) return { ok: false, error: 'no_channel_id' };

  const r = await callSlack<{ ts?: string; channel?: string }>('chat.postMessage', {
    channel,
    text: args.text,
    reply_broadcast: Boolean(args.replyBroadcast && args.threadTs),
    ...(args.threadTs ? { thread_ts: args.threadTs } : {}),
    unfurl_links: false,
    unfurl_media: false,
  });

  if (!r.ok) return { ok: false, error: r.error };
  if (!r.data.ts) return { ok: false, error: 'invalid_response' };
  return { ok: true, ts: r.data.ts, channel: r.data.channel };
}

// ── 비공개 채널 관리 (groups:write) ─────────────────────────────────────────

export async function createPrivateChannel(
  name: string
): Promise<SlackCallResult<{ channel: { id: string; name: string } }>> {
  return callSlack('conversations.create', { name, is_private: true });
}

export async function inviteToChannel(
  channelId: string,
  userIds: string[]
): Promise<SlackCallResult<unknown>> {
  if (userIds.length === 0) return { ok: true, data: {} };
  const r = await callSlack('conversations.invite', { channel: channelId, users: userIds.join(',') });
  if (!r.ok && r.error === 'already_in_channel') return { ok: true, data: {} };
  return r;
}

export async function setChannelTopic(
  channelId: string,
  topic: string
): Promise<SlackCallResult<unknown>> {
  return callSlack('conversations.setTopic', { channel: channelId, topic: topic.slice(0, 250) });
}

export async function archiveChannel(channelId: string): Promise<SlackCallResult<unknown>> {
  const r = await callSlack('conversations.archive', { channel: channelId });
  if (!r.ok && r.error === 'already_archived') return { ok: true, data: {} };
  return r;
}

export async function unarchiveChannel(channelId: string): Promise<SlackCallResult<unknown>> {
  const r = await callSlack('conversations.unarchive', { channel: channelId });
  if (!r.ok && r.error === 'not_archived') return { ok: true, data: {} };
  return r;
}

// ── 서명 검증 / 텍스트 유틸 (변경 없음) ───────────────────────────────────

export type SignatureFailure =
  | 'no_signing_secret'
  | 'missing_headers'
  | 'bad_timestamp'
  | 'stale_timestamp'
  | 'mismatch';

export interface SignatureResult {
  valid: boolean;
  reason?: SignatureFailure;
}

/**
 * x-slack-signature 검증.
 * base string = `v0:{timestamp}:{rawBody}` 를 SLACK_SIGNING_SECRET으로 HMAC-SHA256.
 * 반드시 **파싱 전 raw body 문자열**을 넘겨야 한다.
 */
export function verifySlackSignature(args: {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
  nowSec?: number;
}): SignatureResult {
  const secret = getSlackSigningSecret();
  if (!secret) return { valid: false, reason: 'no_signing_secret' };

  const { rawBody, signature, timestamp } = args;
  if (!signature || !timestamp) return { valid: false, reason: 'missing_headers' };

  const tsNum = Number(timestamp);
  if (!Number.isFinite(tsNum)) return { valid: false, reason: 'bad_timestamp' };

  const now = args.nowSec ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - tsNum) > SIGNATURE_MAX_AGE_SEC) {
    return { valid: false, reason: 'stale_timestamp' };
  }

  const expected =
    'v0=' + createHmac('sha256', secret).update(`v0:${timestamp}:${rawBody}`).digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  if (a.length !== b.length) return { valid: false, reason: 'mismatch' };
  if (!timingSafeEqual(a, b)) return { valid: false, reason: 'mismatch' };

  return { valid: true };
}

/**
 * Slack mrkdwn을 번역기에 넣기 좋은 평문으로 정리.
 * - <@U123|name> / <@U123>  → 제거
 * - <#C123|general>         → #general
 * - <http://x|label>        → label
 * - <http://x>              → http://x
 * - &amp; &lt; &gt;         → 원문자
 */
export function slackTextToPlain(text: string): string {
  return text
    .replace(/<@[UW][A-Z0-9]*(?:\|[^>]*)?>/g, '')
    .replace(/<#C[A-Z0-9]*(?:\|([^>]*))?>/g, (_m, label) => (label ? `#${label}` : ''))
    .replace(/<(https?:\/\/[^|>]+)\|([^>]*)>/g, '$2')
    .replace(/<(https?:\/\/[^|>]+)>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

/** Slack mrkdwn 특수문자 이스케이프 (방문자 입력을 Slack으로 보낼 때). */
export function escapeSlackText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/chat/__tests__/slack.test.ts`
Expected: PASS (기존 14 + 신규 12)

- [ ] **Step 5: 커밋**

```bash
git add liv-clinic/src/lib/chat/slack.ts liv-clinic/src/lib/chat/__tests__/slack.test.ts
git commit -m "feat(chat): Slack 공통 호출기(재시도) + 비공개 채널 생성·초대·주제·보관·해제

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Slack 문구 빌더 — `slackText.ts`

**Files:**
- Create: `liv-clinic/src/lib/chat/slackText.ts`
- Modify: `liv-clinic/src/lib/chat/slackRelay.ts` (기존 빌더 3개 + `buildBodyLines`/`LOCALE_FLAG`/`adminSessionUrl`/`operatorPrefix`를 **잘라내어** slackText로 옮기고, slackRelay는 `export { buildRootText, buildReplyText, buildContactText } from './slackText'` 재수출 + import로 대체. Task 9에서 slackRelay를 전면 재작성하므로 여기서는 옮기기만 한다.)
- Rename: `liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts` → `slackText.test.ts` (import 경로 `../slackText`) + 신규 케이스 추가

**Interfaces:**
- Consumes: `escapeSlackText`(slack.ts), `formatKst`/`formatKstTime`(kst.ts), `buildChatRefCode`(contactChannels.ts)
- Produces (전부 순수):
  ```ts
  LOCALE_FLAG: Record<string,string>; localeFlag(locale): string; localeKoName(locale): string
  adminSessionUrl(sessionId): string | null
  buildBodyLines(args): string[]                        // 기존
  buildRootText(args), buildReplyText(args), buildContactText(args)   // 기존 그대로
  interface RoomSessionInfo { sessionId: string; visitorName: string | null; visitorLocale: string; visitorEmail: string | null }
  buildRoomTopic(s: RoomSessionInfo): string
  ROOM_FOOTER: string; ROOM_AUTO_ACK_NOTE: string
  buildRoomFirstText({ mentionAll, receivedAt, visitorLocale, originalText, translatedText }): string
  buildRoomVisitorText({ mention, receivedAt, reopened, visitorLocale, originalText, translatedText }): string
  type FeedKind = 'new' | 'resolved' | 'closed' | 'reopened' | 'escalated'
  buildFeedLine({ kind, visitorName, visitorLocale, channelId, at, assignedLabel?, minutes? }): string
  buildEscalationText({ level: 1|2|3, minutes, mention, assigneeMention }): string
  buildDeliveryFailureText(reason: string): string
  ```

- [ ] **Step 1: 기존 테스트 파일 이동 + 신규 테스트 추가**

```bash
git mv liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts liv-clinic/src/lib/chat/__tests__/slackText.test.ts
```
파일 첫 줄의 import를 바꾼다:
```ts
import { describe, it, expect, afterEach } from 'vitest';
import {
  buildContactText,
  buildDeliveryFailureText,
  buildEscalationText,
  buildFeedLine,
  buildReplyText,
  buildRoomFirstText,
  buildRoomTopic,
  buildRoomVisitorText,
  buildRootText,
  ROOM_AUTO_ACK_NOTE,
  ROOM_FOOTER,
} from '../slackText';
```
파일 끝에 추가:
```ts
describe('buildRoomFirstText — 방의 첫 메시지', () => {
  const base = {
    receivedAt: '2024-01-01T05:03:00Z',
    visitorLocale: 'vi',
    originalText: 'Xin chào',
    translatedText: '안녕하세요',
  };

  it('전원 멘션·접수 시각·본문·꼬리말 2줄을 붙인다', () => {
    const text = buildRoomFirstText({ ...base, mentionAll: '<@U1> <@U2>' });
    const lines = text.split('\n');
    expect(lines[0]).toBe('🔴 *새 문의* · <@U1> <@U2> · 📥 01/01(월) 14:03 KST');
    expect(lines[1]).toBe('안녕하세요');
    expect(lines[2]).toBe('> _원문:_ Xin chào');
    expect(text.endsWith(`${ROOM_FOOTER}\n${ROOM_AUTO_ACK_NOTE}`)).toBe(true);
  });

  it('멘션 대상이 없어도 구분자가 남지 않는다', () => {
    const text = buildRoomFirstText({ ...base, mentionAll: '' });
    expect(text.split('\n')[0]).toBe('🔴 *새 문의* · 📥 01/01(월) 14:03 KST');
  });
});

describe('buildRoomVisitorText — 손님 후속 메시지', () => {
  const base = {
    receivedAt: '2024-01-01T05:12:00Z',
    visitorLocale: 'vi',
    originalText: 'Thứ Năm được không?',
    translatedText: '목요일 가능한가요?',
  };

  it('담당자만 멘션하고 시각을 붙인다', () => {
    const text = buildRoomVisitorText({ ...base, mention: '<@U1>', reopened: false });
    expect(text.split('\n')[0]).toBe('<@U1> · 14:12 KST');
    expect(text).toContain('목요일 가능한가요?\n> _원문:_ Thứ Năm được không?');
  });

  it('재오픈이면 🔔 머리말을 붙인다', () => {
    const text = buildRoomVisitorText({ ...base, mention: '<@U1> <@U2>', reopened: true });
    expect(text.split('\n')[0]).toBe(
      '🔔 *완료했던 문의에 손님이 다시 말을 걸었습니다* · <@U1> <@U2> · 14:12 KST'
    );
  });
});

describe('buildRoomTopic', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SITE_URL;
  afterEach(() => {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalUrl;
  });

  it('국기·이름·한국어 언어명·참조코드·이메일·관리자 링크를 · 로 잇는다', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://liv-clinic.net/';
    const topic = buildRoomTopic({
      sessionId: '11111111-2222-3333-4444-555555555555',
      visitorName: 'Thu Nguyen',
      visitorLocale: 'vi',
      visitorEmail: 'thu@example.com',
    });
    expect(topic).toBe(
      '🇻🇳 Thu Nguyen · 베트남어 · #11111111 · thu@example.com · <https://liv-clinic.net/admin/chat/11111111-2222-3333-4444-555555555555|관리자 화면에서 열기>'
    );
  });

  it('이름·이메일·사이트 URL이 없으면 해당 조각을 생략하고 익명으로 쓴다', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const topic = buildRoomTopic({
      sessionId: '11111111-2222-3333-4444-555555555555',
      visitorName: null,
      visitorLocale: 'xx',
      visitorEmail: null,
    });
    expect(topic).toBe('🌐 익명 · xx · #11111111');
  });

  it('250자를 넘지 않는다', () => {
    const topic = buildRoomTopic({
      sessionId: '11111111-2222-3333-4444-555555555555',
      visitorName: 'a'.repeat(300),
      visitorLocale: 'en',
      visitorEmail: null,
    });
    expect(topic.length).toBeLessThanOrEqual(250);
  });
});

describe('buildFeedLine — #해외문의 피드', () => {
  const at = '2024-01-01T06:02:00Z';
  it('새 문의', () => {
    expect(buildFeedLine({ kind: 'new', visitorName: 'Thu', visitorLocale: 'vi', channelId: 'C9', at })).toBe(
      '🔴 새 문의 · 🇻🇳 Thu · <#C9> · 01/01(월) 15:02 KST'
    );
  });
  it('완료 (담당 표시, 채널 링크 없음)', () => {
    expect(
      buildFeedLine({ kind: 'resolved', visitorName: 'Thu', visitorLocale: 'vi', channelId: null, at, assignedLabel: '이정현' })
    ).toBe('✅ 완료 · Thu · 담당 이정현 · 01/01(월) 15:02 KST');
  });
  it('종료 안내', () => {
    expect(buildFeedLine({ kind: 'closed', visitorName: null, visitorLocale: 'en', channelId: null, at })).toBe(
      '✅ 종료 안내 보냄 · 익명 · 01/01(월) 15:02 KST'
    );
  });
  it('다시 열림', () => {
    expect(buildFeedLine({ kind: 'reopened', visitorName: 'Thu', visitorLocale: 'vi', channelId: 'C9', at })).toBe(
      '🔄 다시 열림 · Thu · <#C9> · 01/01(월) 15:02 KST'
    );
  });
  it('미응답 확대', () => {
    expect(
      buildFeedLine({ kind: 'escalated', visitorName: 'Thu', visitorLocale: 'vi', channelId: 'C9', at, minutes: 30 })
    ).toBe('🚨 30분째 미응답 · Thu · <#C9>');
  });
  it('이름의 Slack 마크업을 이스케이프한다', () => {
    expect(buildFeedLine({ kind: 'new', visitorName: '<!channel>', visitorLocale: 'en', channelId: null, at })).not.toContain(
      '<!channel>'
    );
  });
});

describe('buildEscalationText', () => {
  it('1단계: 대상만 멘션', () => {
    expect(buildEscalationText({ level: 1, minutes: 5, mention: '<@U1>', assigneeMention: '<@U1>' })).toBe(
      '⏰ <@U1> 5분째 답이 없습니다.'
    );
  });
  it('2단계: 담당자가 있으면 전원에게 알린다는 사유를 붙인다', () => {
    expect(
      buildEscalationText({ level: 2, minutes: 12, mention: '<@U1> <@U2>', assigneeMention: '<@U1>' })
    ).toBe('⏰ <@U1> <@U2> 12분째 답이 없습니다 · 담당 <@U1> 님이 응답하지 않아 전원에게 알립니다.');
  });
  it('2단계: 담당자가 없으면 사유 없이', () => {
    expect(buildEscalationText({ level: 2, minutes: 12, mention: '<@U1> <@U2>', assigneeMention: null })).toBe(
      '⏰ <@U1> <@U2> 12분째 답이 없습니다.'
    );
  });
  it('3단계: 🚨', () => {
    expect(buildEscalationText({ level: 3, minutes: 30, mention: '<@U1>', assigneeMention: null })).toBe(
      '🚨 <@U1> 30분째 미응답입니다.'
    );
  });
});

describe('buildDeliveryFailureText', () => {
  it('알려진 사유는 한국어로', () => {
    expect(buildDeliveryFailureText('session_not_found')).toBe(
      '⚠️ 방금 답글이 손님에게 전달되지 않았습니다 · 사유: 이 채널과 연결된 상담을 찾지 못했습니다'
    );
  });
  it('모르는 사유는 코드 그대로', () => {
    expect(buildDeliveryFailureText('weird')).toContain('사유: weird');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/chat/__tests__/slackText.test.ts`
Expected: FAIL — `Cannot find module '../slackText'`

- [ ] **Step 3: `slackText.ts` 작성**

```ts
import 'server-only';
import { escapeSlackText } from '@/lib/chat/slack';
import { formatKst, formatKstTime } from '@/lib/chat/kst';
import { buildChatRefCode } from '@/lib/chat/contactChannels';

// Slack에 보내는 모든 문구는 여기서만 만든다 — I/O 없음, 전부 Vitest로 고정.
// 표시가 틀렸다면 원인은 세션 행이거나 이 파일의 함수 하나뿐이다.

export const LOCALE_FLAG: Record<string, string> = {
  en: '🇬🇧',
  ja: '🇯🇵',
  zh: '🇨🇳',
  'zh-TW': '🇹🇼',
  vi: '🇻🇳',
  th: '🇹🇭',
  ru: '🇷🇺',
  fr: '🇫🇷',
  mn: '🇲🇳',
  ar: '🇸🇦',
};

const LOCALE_KO_NAME: Record<string, string> = {
  en: '영어',
  ja: '일본어',
  zh: '중국어(간체)',
  'zh-TW': '중국어(번체)',
  vi: '베트남어',
  th: '태국어',
  ru: '러시아어',
  fr: '프랑스어',
  mn: '몽골어',
  ar: '아랍어',
};

export function localeFlag(locale: string): string {
  return LOCALE_FLAG[locale] ?? '🌐';
}

export function localeKoName(locale: string): string {
  return LOCALE_KO_NAME[locale] ?? locale;
}

export function adminSessionUrl(sessionId: string): string | null {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/admin/chat/${sessionId}`;
}

export type RelaySender = 'visitor' | 'operator';

/**
 * 메시지 본문 라인.
 * - visitor : 한국어 번역을 먼저 보여주고 외국어 원문을 인용으로 붙인다.
 * - operator: 직원이 쓴 한국어 원문을 보여주고 방문자에게 나간 번역문을 인용으로 붙인다.
 */
export function buildBodyLines(args: {
  sender: RelaySender;
  visitorLocale: string;
  originalText: string;
  translatedText: string | null;
}): string[] {
  const original = escapeSlackText(args.originalText);
  const translated = args.translatedText?.trim();
  const hasUsefulTranslation = Boolean(translated && translated !== args.originalText.trim());

  if (args.sender === 'operator') {
    const lines = [original];
    if (hasUsefulTranslation) {
      lines.push(`> _${args.visitorLocale} 전달:_ ${escapeSlackText(translated!)}`);
    }
    return lines;
  }

  if (hasUsefulTranslation) {
    return [escapeSlackText(translated!), `> _원문:_ ${original}`];
  }
  return [original];
}

/** 어드민 화면에서 보낸 답장임을 Slack 쪽에서 구분할 수 있게 하는 머리말. */
function operatorPrefix(senderLabel: string | null): string {
  const who = senderLabel ? ` — ${escapeSlackText(senderLabel)}` : '';
  return `↩️ _관리자 화면 답장${who}_`;
}

// ── 스레드 모드 (현행 문구, 변경 없음) ────────────────────────────────────

/** 루트(첫) 메시지 — 세션 컨텍스트를 헤더로 붙인다. */
export function buildRootText(args: {
  sessionId: string;
  sender: RelaySender;
  senderLabel: string | null;
  visitorName: string | null;
  visitorLocale: string;
  visitorEmail: string | null;
  originalText: string;
  translatedText: string | null;
}): string {
  const flag = localeFlag(args.visitorLocale);
  const name = args.visitorName || '익명';
  const headline = args.sender === 'visitor' ? '새 채팅 문의' : '채팅 세션';
  const lines = [`${flag} *${headline}* — ${escapeSlackText(name)} (${args.visitorLocale})`];
  if (args.visitorEmail) lines.push(`✉️ ${escapeSlackText(args.visitorEmail)}`);
  lines.push('');
  if (args.sender === 'operator') lines.push(operatorPrefix(args.senderLabel));
  lines.push(...buildBodyLines(args));

  const url = adminSessionUrl(args.sessionId);
  if (url) {
    lines.push('');
    lines.push(`🔗 <${url}|관리자 화면에서 열기>`);
  }
  lines.push('');
  lines.push('_이 스레드에 답글을 달면 방문자에게 번역되어 전달됩니다._');
  return lines.join('\n');
}

/** 스레드 후속 메시지 — 본문만 (운영자면 머리말 1줄). 방 모드의 관리자 화면 답장 미러에도 쓴다. */
export function buildReplyText(args: {
  sender: RelaySender;
  senderLabel: string | null;
  visitorLocale: string;
  originalText: string;
  translatedText: string | null;
}): string {
  const lines = args.sender === 'operator' ? [operatorPrefix(args.senderLabel)] : [];
  lines.push(...buildBodyLines(args));
  return lines.join('\n');
}

/** 방문자 연락처 릴레이 본문. */
export function buildContactText(args: {
  channelLabel: string;
  handle: string;
  /** 방/스레드 없이 단독 게시될 때만 어드민 링크를 첨부한다. */
  adminUrl: string | null;
}): string {
  const lines = [
    `📱 *방문자가 연락처를 남겼습니다* — ${args.channelLabel}: ${escapeSlackText(args.handle)}`,
    '_근무 시작 후 이 연락처로 먼저 연락해 주세요._',
  ];
  if (args.adminUrl) {
    lines.push(`🔗 <${args.adminUrl}|관리자 화면에서 열기>`);
  }
  return lines.join('\n');
}

// ── 방 모드 ─────────────────────────────────────────────────────────────

export interface RoomSessionInfo {
  sessionId: string;
  visitorName: string | null;
  visitorLocale: string;
  visitorEmail: string | null;
}

/** 채널 주제: 🇻🇳 Thu Nguyen · 베트남어 · #A1B2C3D4 · thu@example.com · <관리자 링크> (250자 절단) */
export function buildRoomTopic(s: RoomSessionInfo): string {
  const parts = [
    `${localeFlag(s.visitorLocale)} ${escapeSlackText(s.visitorName || '익명')}`,
    localeKoName(s.visitorLocale),
    `#${buildChatRefCode(s.sessionId)}`,
  ];
  if (s.visitorEmail) parts.push(escapeSlackText(s.visitorEmail));
  const url = adminSessionUrl(s.sessionId);
  if (url) parts.push(`<${url}|관리자 화면에서 열기>`);
  return parts.join(' · ').slice(0, 250);
}

export const ROOM_FOOTER =
  '_이 채널에 쓰면 손님에게 번역되어 전달됩니다. 직원끼리 메모는 스레드로 남겨 주세요._';
export const ROOM_AUTO_ACK_NOTE =
  '_손님에게는 "잠시만 기다려 주세요" 자동 안내가 먼저 나갔습니다._';

function joinHead(parts: Array<string | null | undefined>): string {
  return parts.filter((p): p is string => Boolean(p && p.length > 0)).join(' · ');
}

/** 방의 첫 메시지(손님 첫 발신): 전원 멘션 + 접수 시각 + 본문 + 꼬리말 2줄 */
export function buildRoomFirstText(args: {
  mentionAll: string;
  receivedAt: string;
  visitorLocale: string;
  originalText: string;
  translatedText: string | null;
}): string {
  const head = joinHead(['🔴 *새 문의*', args.mentionAll, `📥 ${formatKst(args.receivedAt)}`]);
  return [
    head,
    ...buildBodyLines({
      sender: 'visitor',
      visitorLocale: args.visitorLocale,
      originalText: args.originalText,
      translatedText: args.translatedText,
    }),
    '',
    ROOM_FOOTER,
    ROOM_AUTO_ACK_NOTE,
  ].join('\n');
}

/** 방의 손님 후속 메시지: 담당자(또는 전원) 멘션 + 시각 + 본문. reopened면 🔔 머리말 */
export function buildRoomVisitorText(args: {
  mention: string;
  receivedAt: string;
  reopened: boolean;
  visitorLocale: string;
  originalText: string;
  translatedText: string | null;
}): string {
  const lead = args.reopened ? '🔔 *완료했던 문의에 손님이 다시 말을 걸었습니다*' : null;
  const head = joinHead([lead, args.mention, formatKstTime(args.receivedAt)]);
  return [
    head,
    ...buildBodyLines({
      sender: 'visitor',
      visitorLocale: args.visitorLocale,
      originalText: args.originalText,
      translatedText: args.translatedText,
    }),
  ].join('\n');
}

// ── #해외문의 피드 / 확대 알림 / 실패 알림 ───────────────────────────────

export type FeedKind = 'new' | 'resolved' | 'closed' | 'reopened' | 'escalated';

export function buildFeedLine(args: {
  kind: FeedKind;
  visitorName: string | null;
  visitorLocale: string;
  channelId: string | null;
  at: string;
  assignedLabel?: string | null;
  minutes?: number;
}): string {
  const name = escapeSlackText(args.visitorName || '익명');
  const link = args.channelId ? `<#${args.channelId}>` : null;
  const when = formatKst(args.at);
  const who = args.assignedLabel ? `담당 ${escapeSlackText(args.assignedLabel)}` : null;
  switch (args.kind) {
    case 'new':
      return joinHead(['🔴 새 문의', `${localeFlag(args.visitorLocale)} ${name}`, link, when]);
    case 'resolved':
      return joinHead(['✅ 완료', name, who, when]);
    case 'closed':
      return joinHead(['✅ 종료 안내 보냄', name, who, when]);
    case 'reopened':
      return joinHead(['🔄 다시 열림', name, link, when]);
    case 'escalated':
      return joinHead([`🚨 ${args.minutes ?? 30}분째 미응답`, name, link]);
  }
}

export function buildEscalationText(args: {
  level: 1 | 2 | 3;
  minutes: number;
  mention: string;
  assigneeMention: string | null;
}): string {
  if (args.level === 3) return `🚨 ${args.mention} ${args.minutes}분째 미응답입니다.`;
  if (args.level === 2 && args.assigneeMention) {
    return `⏰ ${args.mention} ${args.minutes}분째 답이 없습니다 · 담당 ${args.assigneeMention} 님이 응답하지 않아 전원에게 알립니다.`;
  }
  return `⏰ ${args.mention} ${args.minutes}분째 답이 없습니다.`;
}

const FAILURE_REASON_KO: Record<string, string> = {
  session_not_found: '이 채널과 연결된 상담을 찾지 못했습니다',
  empty_text: '내용이 비어 있습니다',
  error: '서버 오류가 났습니다. 관리자 화면에서 다시 보내 주세요',
};

export function buildDeliveryFailureText(reason: string): string {
  return `⚠️ 방금 답글이 손님에게 전달되지 않았습니다 · 사유: ${FAILURE_REASON_KO[reason] ?? reason}`;
}
```

- [ ] **Step 4: `slackRelay.ts`에서 옮긴 코드 제거 + 재수출**

`slackRelay.ts` 상단의 `LOCALE_FLAG`, `adminSessionUrl`, `buildBodyLines`, `operatorPrefix`, `buildRootText`, `buildReplyText`, `buildContactText` 정의를 삭제하고, import 블록 아래에 다음을 넣는다. `RelaySender` 타입 정의도 삭제하고 slackText에서 가져온다.

```ts
import {
  adminSessionUrl,
  buildContactText,
  buildReplyText,
  buildRootText,
  type RelaySender,
} from '@/lib/chat/slackText';

export { buildContactText, buildReplyText, buildRootText };
export type { RelaySender };
```
`escapeSlackText` import는 slackRelay에서 더 이상 쓰지 않으므로 제거한다.

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run src/lib/chat/__tests__/slackText.test.ts && npx tsc --noEmit -p tsconfig.json`
Expected: PASS (기존 14 + 신규 20). tsc 오류 0.

- [ ] **Step 6: 커밋**

```bash
git add liv-clinic/src/lib/chat/slackText.ts liv-clinic/src/lib/chat/slackRelay.ts liv-clinic/src/lib/chat/__tests__/slackText.test.ts
git commit -m "feat(chat): Slack 문구 빌더 분리 + 방·피드·확대·실패 문구

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---
### Task 5: 마이그레이션 040 + Supabase 타입 + 적용/검증 스크립트

**Files:**
- Create: `liv-clinic/supabase/migrations/040_chat_slack_rooms.sql`
- Create: `liv-clinic/scripts/_db/run-sql.mjs`
- Modify: `liv-clinic/src/types/supabase.ts` (chat_sessions / chat_messages Row·Insert·Update)

**Interfaces:**
- Produces (DB): `chat_sessions.slack_mode('room'|'thread'|null)`, `slack_room_name`, `assigned_slack_user_id`, `assigned_label`, `assigned_at`, `resolved_at`, `resolved_label`, `awaiting_since`, `escalation_level`, `auto_ack_at`; `chat_messages.slack_user_id`, `sender_label`, `source('app'|'slack'|'auto')`. 트리거 `fn_chat_after_message_insert` 교체.
- 프로덕션 적용은 **Task 17(롤아웃)에서 원장님 승인 후**. 여기서는 트랜잭션 안에서 적용→검증→ROLLBACK만 한다.

- [ ] **Step 1: 마이그레이션 파일 작성**

`supabase/migrations/040_chat_slack_rooms.sql` — 스펙 §5의 SQL을 **그대로** 넣는다(컬럼 10개 + backfill UPDATE + chat_messages 3컬럼 + 인덱스 3개 + 트리거 함수 교체 + COMMENT 4개). 스펙 §5 코드 블록을 복사해 파일 첫 줄에 아래 헤더만 덧붙인다:
```sql
-- ============================================
-- 040: Slack 환자별 채널(방) + 담당 + 완료 + 미응답 확대 알림 + 자동 첫 안내
-- 설계: docs/superpowers/specs/2026-09-03-slack-patient-rooms-design.md §5
-- 전부 추가형·멱등. 기존 컬럼/정책/publication 무변경.
-- ============================================
```

- [ ] **Step 2: 적용/검증 스크립트 작성**

`scripts/_db/run-sql.mjs`:
```js
// 마이그레이션을 프로덕션 DB에 적용하거나(--apply) 트랜잭션 안에서 검증만 하고 되돌린다(기본).
// 사용:
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/_db/run-sql.mjs supabase/migrations/040_chat_slack_rooms.sql          # 검증만 (ROLLBACK)
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/_db/run-sql.mjs supabase/migrations/040_chat_slack_rooms.sql --apply  # 실제 적용
// .env.local의 DATABASE_URL을 쓴다 (한 줄 값만 읽는다 — 여러 줄 따옴표 값은 다른 키에만 있다).
import fs from 'node:fs';
import pg from 'pg';

const file = process.argv[2];
const apply = process.argv.includes('--apply');
if (!file) {
  console.error('usage: node scripts/_db/run-sql.mjs <file.sql> [--apply]');
  process.exit(1);
}
const env = fs.readFileSync('.env.local', 'utf8');
const m = env.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
if (!m) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const VERIFY = `
  INSERT INTO public.chat_sessions (visitor_locale, visitor_name) VALUES ('en', 'Verify 040') RETURNING id;
`;

const client = new pg.Client({ connectionString: m[1], ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query('BEGIN');
  await client.query(fs.readFileSync(file, 'utf8'));
  console.log(`[run-sql] ${file} executed inside transaction`);

  // 트리거 동작 검증 (항상 실행, 결과는 화면에만)
  const { rows: [s] } = await client.query(VERIFY);
  const q = (sql, params) => client.query(sql, params).then((r) => r.rows[0]);
  const state = () =>
    q(
      'SELECT unread_admin_count, awaiting_since, escalation_level, resolved_at, auto_ack_at FROM public.chat_sessions WHERE id = $1',
      [s.id]
    );
  await q("UPDATE public.chat_sessions SET resolved_at = now(), escalation_level = 2 WHERE id = $1", [s.id]);
  await q("INSERT INTO public.chat_messages (session_id, sender, original_text, original_lang) VALUES ($1, 'visitor', 'hi', 'en')", [s.id]);
  const afterVisitor = await state();
  console.log('[verify] after visitor  :', afterVisitor);
  await q("INSERT INTO public.chat_messages (session_id, sender, original_text, original_lang, source, translation_status) VALUES ($1, 'operator', '자동', 'ko', 'auto', 'success')", [s.id]);
  const afterAuto = await state();
  console.log('[verify] after auto ack :', afterAuto);
  await q("INSERT INTO public.chat_messages (session_id, sender, original_text, original_lang, source) VALUES ($1, 'operator', '답변', 'ko', 'slack')", [s.id]);
  const afterOperator = await state();
  console.log('[verify] after operator :', afterOperator);

  const ok =
    afterVisitor.unread_admin_count === 1 && afterVisitor.awaiting_since !== null && afterVisitor.resolved_at === null &&
    afterAuto.unread_admin_count === 1 && afterAuto.awaiting_since !== null && afterAuto.escalation_level === 2 &&
    afterOperator.unread_admin_count === 0 && afterOperator.awaiting_since === null && afterOperator.escalation_level === 0;
  console.log(ok ? '[verify] trigger OK' : '[verify] trigger MISMATCH — do not apply');

  // 검증용 행은 항상 지운다 (CASCADE로 메시지도)
  await client.query('DELETE FROM public.chat_sessions WHERE id = $1', [s.id]);

  if (apply && ok) {
    await client.query('COMMIT');
    console.log('[run-sql] COMMITTED');
  } else {
    await client.query('ROLLBACK');
    console.log(apply ? '[run-sql] ROLLED BACK (verify failed)' : '[run-sql] ROLLED BACK (dry run)');
  }
} catch (e) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('[run-sql] failed:', e.message);
  process.exit(1);
} finally {
  await client.end();
}
```

- [ ] **Step 3: 드라이런으로 검증 (ROLLBACK)**

Run (liv-clinic에서): `NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/_db/run-sql.mjs supabase/migrations/040_chat_slack_rooms.sql`
Expected: 세 줄의 `[verify] after …` 뒤에 `[verify] trigger OK`, 마지막 줄 `ROLLED BACK (dry run)`. `MISMATCH`면 트리거 SQL을 고친 뒤 다시 돌린다. (`.env.local`이 없거나 `DATABASE_URL`이 없으면 원장님에게 값을 요청한다 — 메모리 `dev-machine-tls-proxy` 참조.)

- [ ] **Step 4: Supabase 타입 수동 반영**

`src/types/supabase.ts`의 `chat_sessions` **Row**에 다음 줄을 알파벳 순서 위치에 추가한다(Insert/Update에는 `?:` 로 같은 필드 추가):
```ts
          assigned_at: string | null
          assigned_label: string | null
          assigned_slack_user_id: string | null
          auto_ack_at: string | null
          awaiting_since: string | null
          escalation_level: number
          resolved_at: string | null
          resolved_label: string | null
          slack_mode: string | null
          slack_room_name: string | null
```
Insert/Update 예: `assigned_at?: string | null`, `escalation_level?: number`.

`chat_messages` Row에 추가(Insert/Update는 `?:`):
```ts
          sender_label: string | null
          slack_user_id: string | null
          source: string
```
Insert의 `source?: string` (DB 기본값 'app').

- [ ] **Step 5: 타입 검사**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 오류 0 (아직 새 컬럼을 쓰는 코드가 없으므로 기존과 동일해야 한다)

- [ ] **Step 6: 커밋**

```bash
git add liv-clinic/supabase/migrations/040_chat_slack_rooms.sql liv-clinic/scripts/_db/run-sql.mjs liv-clinic/src/types/supabase.ts
git commit -m "feat(chat): 마이그레이션 040 — 방 모드·담당·완료·미응답 시계·자동 안내 컬럼과 트리거

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: 방 이름과 방 생성 — `slackRooms.ts`

**Files:**
- Create: `liv-clinic/src/lib/chat/slackRooms.ts`
- Test: `liv-clinic/src/lib/chat/__tests__/slackRooms.test.ts`

**Interfaces:**
- Consumes: `createPrivateChannel`, `inviteToChannel`, `setChannelTopic`, `archiveChannel`(slack.ts), `buildRoomTopic`, `RoomSessionInfo`(slackText.ts), `buildChatRefCode`(contactChannels.ts)
- Produces:
  ```ts
  DEFAULT_ROOM_PREFIX = 'chat'; roomPrefix(): string   // SLACK_ROOM_PREFIX
  slugifyName(name: string | null | undefined): string
  buildRoomName({ prefix, visitorName, visitorLocale, sessionId, suffix? }): string
  interface RoomDeps {
    staffIds: string[];              // 초대 대상 (답변 직원 + 관찰자)
    hasResponders: boolean;          // 답변 직원이 1명 이상인지 — 없으면 방을 만들지 않는다
    prefix: string;
    sleep(ms: number): Promise<void>;
    claimRoomMode(sessionId): Promise<boolean>;            // slack_mode IS NULL → 'room'
    setRoom(sessionId, channelId, roomName): Promise<void>;
    setThreadMode(sessionId): Promise<void>;
    reloadTarget(sessionId): Promise<{ mode: 'room'; channelId: string } | { mode: 'thread' } | null>;
  }
  type EnsureRoomResult = { mode: 'room'; channelId: string; created: boolean } | { mode: 'thread' } | { mode: 'feed' }
  ensureRoom(session: RoomSessionInfo, deps: RoomDeps): Promise<EnsureRoomResult>
  ```

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/chat/__tests__/slackRooms.test.ts`:
```ts
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
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/chat/__tests__/slackRooms.test.ts`
Expected: FAIL — `Cannot find module '../slackRooms'`

- [ ] **Step 3: 구현**

`src/lib/chat/slackRooms.ts`:
```ts
import 'server-only';
import { buildChatRefCode } from '@/lib/chat/contactChannels';
import {
  archiveChannel,
  createPrivateChannel,
  inviteToChannel,
  setChannelTopic,
} from '@/lib/chat/slack';
import { buildRoomTopic, type RoomSessionInfo } from '@/lib/chat/slackText';

// 손님 1명 = 비공개 채널 1개. 이 파일은 "방을 확보하는" 절차만 담당한다.
// DB 접근은 RoomDeps로 주입받아 Vitest에서 가짜로 바꿀 수 있게 한다.

export const DEFAULT_ROOM_PREFIX = 'chat';

export function roomPrefix(): string {
  return (process.env.SLACK_ROOM_PREFIX || DEFAULT_ROOM_PREFIX).trim() || DEFAULT_ROOM_PREFIX;
}

/**
 * 이름 슬러그: NFKD → 결합 부호 제거 → 소문자 → [a-z0-9] 외 연속 문자를 '-' 하나로 → 앞뒤 '-' 제거 → 16자.
 * CJK·태국어처럼 ASCII로 만들 수 없는 이름은 ''(호출자가 로케일로 대체).
 */
export function slugifyName(name: string | null | undefined): string {
  if (!name) return '';
  const ascii = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return ascii.slice(0, 16).replace(/-+$/g, '');
}

/** `{prefix}-{slug|locale}-{참조코드 앞 6자}` (+ `-N`, N ≥ 2) */
export function buildRoomName(args: {
  prefix: string;
  visitorName: string | null;
  visitorLocale: string;
  sessionId: string;
  suffix?: number;
}): string {
  const slug = slugifyName(args.visitorName) || args.visitorLocale.toLowerCase();
  const code = buildChatRefCode(args.sessionId).slice(0, 6).toLowerCase();
  const base = `${args.prefix}-${slug}-${code}`;
  return args.suffix && args.suffix > 1 ? `${base}-${args.suffix}` : base;
}

export interface RoomDeps {
  /** 초대 대상 = 답변 직원 + 관찰자 */
  staffIds: string[];
  /** 답변 직원이 1명 이상인지. 없으면 방을 만들지 않는다(아무도 멘션할 수 없는 방은 없는 것과 같다) */
  hasResponders: boolean;
  prefix: string;
  sleep(ms: number): Promise<void>;
  /** `slack_mode IS NULL`인 세션을 'room'으로 선점. 성공 시 true */
  claimRoomMode(sessionId: string): Promise<boolean>;
  /** 선점한 세션에 채널 확정 */
  setRoom(sessionId: string, channelId: string, roomName: string): Promise<void>;
  /** 방 생성을 포기하고 스레드 모드로 */
  setThreadMode(sessionId: string): Promise<void>;
  /** 선점에서 진 쪽이 상대의 결과를 기다릴 때 */
  reloadTarget(
    sessionId: string
  ): Promise<{ mode: 'room'; channelId: string } | { mode: 'thread' } | null>;
}

export type EnsureRoomResult =
  | { mode: 'room'; channelId: string; created: boolean }
  | { mode: 'thread' }
  /** 경합에서 졌는데 방이 끝내 안 보임 → 호출자가 피드에 단독 게시 */
  | { mode: 'feed' };

const LOST_RACE_POLLS = 3;
const LOST_RACE_INTERVAL_MS = 700;

export async function ensureRoom(session: RoomSessionInfo, deps: RoomDeps): Promise<EnsureRoomResult> {
  if (!deps.hasResponders) {
    await deps.setThreadMode(session.sessionId);
    return { mode: 'thread' };
  }

  const claimed = await deps.claimRoomMode(session.sessionId);
  if (!claimed) {
    for (let i = 0; i < LOST_RACE_POLLS; i++) {
      await deps.sleep(LOST_RACE_INTERVAL_MS);
      const t = await deps.reloadTarget(session.sessionId);
      if (t?.mode === 'room') return { mode: 'room', channelId: t.channelId, created: false };
      if (t?.mode === 'thread') return { mode: 'thread' };
    }
    return { mode: 'feed' };
  }

  const created = await createWithRetries(session, deps.prefix);
  if (!created) {
    await deps.setThreadMode(session.sessionId);
    return { mode: 'thread' };
  }

  const invited = await inviteToChannel(created.id, deps.staffIds);
  if (!invited.ok) {
    console.warn('[slack rooms] invite failed:', invited.error);
    await archiveChannel(created.id);
    await deps.setThreadMode(session.sessionId);
    return { mode: 'thread' };
  }

  await deps.setRoom(session.sessionId, created.id, created.name);
  const topic = await setChannelTopic(created.id, buildRoomTopic(session));
  if (!topic.ok) console.warn('[slack rooms] setTopic failed:', topic.error);
  return { mode: 'room', channelId: created.id, created: true };
}

async function createWithRetries(
  session: RoomSessionInfo,
  prefix: string
): Promise<{ id: string; name: string } | null> {
  let currentPrefix = prefix;
  let suffix = 1;
  for (let attempt = 0; attempt < 4; attempt++) {
    const name = buildRoomName({
      prefix: currentPrefix,
      visitorName: session.visitorName,
      visitorLocale: session.visitorLocale,
      sessionId: session.sessionId,
      suffix,
    });
    const r = await createPrivateChannel(name);
    if (r.ok) return { id: r.data.channel.id, name: r.data.channel.name };
    if (r.error === 'name_taken' && suffix < 3) {
      suffix += 1;
      continue;
    }
    if (r.error === 'invalid_name_specials' && currentPrefix !== DEFAULT_ROOM_PREFIX) {
      currentPrefix = DEFAULT_ROOM_PREFIX;
      continue;
    }
    console.warn('[slack rooms] create failed:', r.error);
    return null;
  }
  return null;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/chat/__tests__/slackRooms.test.ts`
Expected: PASS (18 tests)

- [ ] **Step 5: 커밋**

```bash
git add liv-clinic/src/lib/chat/slackRooms.ts liv-clinic/src/lib/chat/__tests__/slackRooms.test.ts
git commit -m "feat(chat): 손님별 비공개 채널 이름 규칙과 생성 절차(선점·재시도·폴백)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: 미응답 확대 단계 판정 — `escalation.ts`

**Files:**
- Create: `liv-clinic/src/lib/chat/escalation.ts`
- Test: `liv-clinic/src/lib/chat/__tests__/escalation.test.ts`

**Interfaces:**
- Produces (순수):
  ```ts
  DEFAULT_THRESHOLDS_MIN = [5, 12, 30]
  parseThresholds(raw: string | undefined | null): number[]          // 3개·양수·오름차순 아니면 기본값
  interface EscalationInput { awaitingSinceMs: number | null; level: number; hasAssignee: boolean }
  interface EscalationStep { nextLevel: 1 | 2 | 3; target: 'assignee' | 'all'; feed: boolean; minutes: number }
  planEscalation(input, nowMs, thresholdsMin = DEFAULT_THRESHOLDS_MIN): EscalationStep | null   // 한 번에 한 단계만
  ```

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/chat/__tests__/escalation.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { DEFAULT_THRESHOLDS_MIN, parseThresholds, planEscalation } from '../escalation';

const MIN = 60_000;
const T0 = Date.parse('2024-01-01T01:00:00Z');

describe('parseThresholds', () => {
  it('쉼표 구분 3개를 읽는다', () => {
    expect(parseThresholds('5,12,30')).toEqual([5, 12, 30]);
    expect(parseThresholds(' 3 , 8 , 20 ')).toEqual([3, 8, 20]);
  });
  it('비었거나 개수·순서가 틀리면 기본값', () => {
    expect(parseThresholds(undefined)).toEqual(DEFAULT_THRESHOLDS_MIN);
    expect(parseThresholds('5,12')).toEqual(DEFAULT_THRESHOLDS_MIN);
    expect(parseThresholds('12,5,30')).toEqual(DEFAULT_THRESHOLDS_MIN);
    expect(parseThresholds('a,b,c')).toEqual(DEFAULT_THRESHOLDS_MIN);
  });
});

describe('planEscalation', () => {
  it('기다리는 중이 아니면 null', () => {
    expect(planEscalation({ awaitingSinceMs: null, level: 0, hasAssignee: true }, T0)).toBeNull();
  });
  it('임계 미달이면 null', () => {
    expect(planEscalation({ awaitingSinceMs: T0 - 4 * MIN, level: 0, hasAssignee: true }, T0)).toBeNull();
  });
  it('5분, 담당자 있음 → 1단계, 담당자만', () => {
    expect(planEscalation({ awaitingSinceMs: T0 - 5 * MIN, level: 0, hasAssignee: true }, T0)).toEqual({
      nextLevel: 1,
      target: 'assignee',
      feed: false,
      minutes: 5,
    });
  });
  it('5분, 담당자 없음 → 1단계, 전원', () => {
    expect(planEscalation({ awaitingSinceMs: T0 - 5 * MIN, level: 0, hasAssignee: false }, T0)).toMatchObject({
      nextLevel: 1,
      target: 'all',
    });
  });
  it('12분, 담당자 있어도 → 2단계, 전원 (담당자가 답을 안 했으므로)', () => {
    expect(planEscalation({ awaitingSinceMs: T0 - 12 * MIN, level: 1, hasAssignee: true }, T0)).toEqual({
      nextLevel: 2,
      target: 'all',
      feed: false,
      minutes: 12,
    });
  });
  it('30분 → 3단계, 전원 + 피드', () => {
    expect(planEscalation({ awaitingSinceMs: T0 - 30 * MIN, level: 2, hasAssignee: true }, T0)).toEqual({
      nextLevel: 3,
      target: 'all',
      feed: true,
      minutes: 30,
    });
  });
  it('3단계 이후에는 null', () => {
    expect(planEscalation({ awaitingSinceMs: T0 - 90 * MIN, level: 3, hasAssignee: true }, T0)).toBeNull();
  });
  it('밤새 기다렸어도 한 번에 한 단계만 올린다', () => {
    expect(planEscalation({ awaitingSinceMs: T0 - 600 * MIN, level: 0, hasAssignee: false }, T0)).toMatchObject({
      nextLevel: 1,
    });
  });
  it('환경변수 임계를 쓴다', () => {
    expect(planEscalation({ awaitingSinceMs: T0 - 3 * MIN, level: 0, hasAssignee: true }, T0, [3, 8, 20])).toMatchObject({
      nextLevel: 1,
      minutes: 3,
    });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/chat/__tests__/escalation.test.ts`
Expected: FAIL — `Cannot find module '../escalation'`

- [ ] **Step 3: 구현**

`src/lib/chat/escalation.ts`:
```ts
// 미응답 확대 알림의 "다음 단계" 판정. I/O 없음.
// 원장님 규칙(2026-09-03): 첫 문의 전원 → 이후 담당자만 → 담당자가 답을 안 하면 다른 직원에게.
//   1단계(5분):  담당자 있으면 담당자만, 없으면 전원
//   2단계(12분): 전원 (담당자가 응답하지 않았으므로)
//   3단계(30분): 전원 + #해외문의 피드 🚨
// 영업시간 판정은 호출자(escalationRunner)가 한다.

export const DEFAULT_THRESHOLDS_MIN = [5, 12, 30];

export function parseThresholds(raw: string | undefined | null): number[] {
  const nums = (raw ?? '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length !== 3) return DEFAULT_THRESHOLDS_MIN;
  for (let i = 1; i < 3; i++) if (nums[i] <= nums[i - 1]) return DEFAULT_THRESHOLDS_MIN;
  return nums;
}

export interface EscalationInput {
  awaitingSinceMs: number | null;
  level: number;
  hasAssignee: boolean;
}

export interface EscalationStep {
  nextLevel: 1 | 2 | 3;
  target: 'assignee' | 'all';
  feed: boolean;
  /** 문구에 쓰는 "N분째" — 임계값 */
  minutes: number;
}

/** 한 실행에 한 단계만 올린다. 올릴 것이 없으면 null. */
export function planEscalation(
  input: EscalationInput,
  nowMs: number,
  thresholdsMin: number[] = DEFAULT_THRESHOLDS_MIN
): EscalationStep | null {
  if (input.awaitingSinceMs === null) return null;
  if (input.level < 0 || input.level >= 3) return null;
  const nextLevel = (input.level + 1) as 1 | 2 | 3;
  const threshold = thresholdsMin[nextLevel - 1];
  const waitedMin = (nowMs - input.awaitingSinceMs) / 60_000;
  if (waitedMin < threshold) return null;
  const target: EscalationStep['target'] = nextLevel === 1 && input.hasAssignee ? 'assignee' : 'all';
  return { nextLevel, target, feed: nextLevel === 3, minutes: threshold };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/chat/__tests__/escalation.test.ts`
Expected: PASS (11 tests)

- [ ] **Step 5: 커밋**

```bash
git add liv-clinic/src/lib/chat/escalation.ts liv-clinic/src/lib/chat/__tests__/escalation.test.ts
git commit -m "feat(chat): 미응답 확대 알림 단계 판정(담당자 → 전원 → 피드)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---
### Task 8: 이벤트 분류기 확장 + 인바운드 라우팅 — `slackEvents.ts`

**Files:**
- Modify: `liv-clinic/src/lib/chat/slackEvents.ts` (전체 교체)
- Modify: `liv-clinic/src/lib/chat/__tests__/slackEvents.test.ts` (전체 교체)
- Modify: `liv-clinic/src/app/api/slack/events/route.ts` (임시 어댑터 — Task 9에서 최종본으로 교체)

**Interfaces:**
- Produces:
  ```ts
  interface ProcessDecision { action: 'process'; eventId: string; channel: string; slackTs: string; threadTs: string | null; isTopLevel: boolean; isBroadcast: boolean; slackUserId: string | null; text: string }
  type SlackEventDecision = { action: 'challenge'; challenge } | { action: 'ignore'; reason: IgnoreReason } | ProcessDecision | { action: 'room_archived'; eventId; channel } | { action: 'room_unarchived'; eventId; channel }
  classifySlackEvent(body: SlackEnvelope): SlackEventDecision        // ⚠️ 두 번째 인자(channelId) 제거 — 채널 판정은 routeInbound/DB가 한다
  type InboundRoute = { kind: 'legacy_thread'; threadTs } | { kind: 'room'; channel } | { kind: 'skip'; reason: 'legacy_top_level' | 'internal_note' }
  routeInbound(d: Pick<ProcessDecision,'channel'|'threadTs'|'isTopLevel'|'isBroadcast'>, legacyChannelId: string | null): InboundRoute
  ```
  `IgnoreReason`에서 `other_channel`·`not_thread_reply`가 빠지고 `missing_channel`이 들어간다.

- [ ] **Step 1: 테스트 파일 전체 교체**

`src/lib/chat/__tests__/slackEvents.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { classifySlackEvent, routeInbound, type SlackEnvelope } from '../slackEvents';

const CHANNEL = 'C0TESTCHANNEL';

function envelope(event: Record<string, unknown>, eventId = 'Ev123'): SlackEnvelope {
  return { type: 'event_callback', event_id: eventId, event };
}

/** 직원이 스레드에 남긴 정상 답글. */
function staffReply(overrides: Record<string, unknown> = {}) {
  return envelope({
    type: 'message',
    channel: CHANNEL,
    channel_type: 'group',
    user: 'U0STAFF',
    text: '안녕하세요, 상담 도와드리겠습니다.',
    ts: '1700000100.000200',
    thread_ts: '1700000000.000100',
    ...overrides,
  });
}

describe('classifySlackEvent — url_verification', () => {
  it('returns the challenge', () => {
    expect(classifySlackEvent({ type: 'url_verification', challenge: 'abc123' })).toEqual({
      action: 'challenge',
      challenge: 'abc123',
    });
  });

  it('ignores url_verification without a challenge string', () => {
    expect(classifySlackEvent({ type: 'url_verification' })).toEqual({
      action: 'ignore',
      reason: 'unknown_envelope',
    });
  });
});

describe('classifySlackEvent — 메시지 모양 판정', () => {
  it('스레드 답글을 process로 넘기며 채널·작성자를 싣는다', () => {
    expect(classifySlackEvent(staffReply())).toEqual({
      action: 'process',
      eventId: 'Ev123',
      channel: CHANNEL,
      slackTs: '1700000100.000200',
      threadTs: '1700000000.000100',
      isTopLevel: false,
      isBroadcast: false,
      slackUserId: 'U0STAFF',
      text: '안녕하세요, 상담 도와드리겠습니다.',
    });
  });

  it('채널 본문(thread_ts 없음)은 isTopLevel=true', () => {
    expect(classifySlackEvent(staffReply({ thread_ts: undefined }))).toMatchObject({
      action: 'process',
      threadTs: null,
      isTopLevel: true,
    });
  });

  it('thread_ts === ts 인 루트 메시지도 isTopLevel=true', () => {
    expect(
      classifySlackEvent(staffReply({ ts: '1700000000.000100', thread_ts: '1700000000.000100' }))
    ).toMatchObject({ action: 'process', threadTs: null, isTopLevel: true });
  });

  it('thread_broadcast는 isBroadcast=true', () => {
    expect(classifySlackEvent(staffReply({ subtype: 'thread_broadcast' }))).toMatchObject({
      action: 'process',
      isBroadcast: true,
      isTopLevel: false,
    });
  });

  it('다른 채널의 메시지도 process로 넘긴다 (채널 판정은 DB)', () => {
    expect(classifySlackEvent(staffReply({ channel: 'C0ROOM' }))).toMatchObject({
      action: 'process',
      channel: 'C0ROOM',
    });
  });

  it('trims surrounding whitespace from the text', () => {
    expect(classifySlackEvent(staffReply({ text: '  답변  ' }))).toMatchObject({ text: '답변' });
  });

  it('user가 없으면 slackUserId는 null', () => {
    expect(classifySlackEvent(staffReply({ user: undefined }))).toMatchObject({ slackUserId: null });
  });
});

describe('classifySlackEvent — 보관 이벤트', () => {
  it('group_archive → room_archived', () => {
    expect(classifySlackEvent(envelope({ type: 'group_archive', channel: 'C0ROOM' }))).toEqual({
      action: 'room_archived',
      eventId: 'Ev123',
      channel: 'C0ROOM',
    });
  });
  it('group_unarchive → room_unarchived', () => {
    expect(classifySlackEvent(envelope({ type: 'group_unarchive', channel: 'C0ROOM' }))).toEqual({
      action: 'room_unarchived',
      eventId: 'Ev123',
      channel: 'C0ROOM',
    });
  });
  it('채널이 없으면 무시', () => {
    expect(classifySlackEvent(envelope({ type: 'group_archive' }))).toEqual({
      action: 'ignore',
      reason: 'missing_channel',
    });
  });
});

describe('classifySlackEvent — infinite loop prevention', () => {
  it('ignores messages carrying bot_id (our own relayed message coming back)', () => {
    expect(classifySlackEvent(staffReply({ bot_id: 'B0APP' }))).toEqual({
      action: 'ignore',
      reason: 'bot_or_app_message',
    });
  });
  it('ignores messages carrying app_id', () => {
    expect(classifySlackEvent(staffReply({ app_id: 'A0APP' }))).toEqual({
      action: 'ignore',
      reason: 'bot_or_app_message',
    });
  });
  it('ignores bot_message subtype even without bot_id', () => {
    expect(classifySlackEvent(staffReply({ subtype: 'bot_message' })).action).toBe('ignore');
  });
});

describe('classifySlackEvent — filtering', () => {
  it('ignores edits and deletions', () => {
    expect(classifySlackEvent(staffReply({ subtype: 'message_changed' }))).toEqual({
      action: 'ignore',
      reason: 'unsupported_subtype',
    });
    expect(classifySlackEvent(staffReply({ subtype: 'message_deleted' }))).toEqual({
      action: 'ignore',
      reason: 'unsupported_subtype',
    });
  });
  it('ignores channel join notices', () => {
    expect(classifySlackEvent(staffReply({ subtype: 'channel_join' }))).toEqual({
      action: 'ignore',
      reason: 'unsupported_subtype',
    });
  });
  it('ignores empty or whitespace-only replies', () => {
    expect(classifySlackEvent(staffReply({ text: '   ' }))).toEqual({ action: 'ignore', reason: 'empty_text' });
    expect(classifySlackEvent(staffReply({ text: undefined }))).toEqual({ action: 'ignore', reason: 'empty_text' });
  });
  it('ignores messages without channel or ts', () => {
    expect(classifySlackEvent(staffReply({ channel: undefined }))).toEqual({ action: 'ignore', reason: 'missing_channel' });
    expect(classifySlackEvent(staffReply({ ts: undefined }))).toEqual({ action: 'ignore', reason: 'missing_channel' });
  });
  it('ignores non-message event types', () => {
    expect(classifySlackEvent(envelope({ type: 'reaction_added', channel: CHANNEL }))).toEqual({
      action: 'ignore',
      reason: 'not_message',
    });
  });
  it('ignores envelopes without an event_id (cannot be deduped)', () => {
    const body = staffReply();
    delete body.event_id;
    expect(classifySlackEvent(body)).toEqual({ action: 'ignore', reason: 'missing_event_id' });
  });
  it('ignores unknown envelope types', () => {
    expect(classifySlackEvent({ type: 'app_rate_limited' })).toEqual({ action: 'ignore', reason: 'unknown_envelope' });
  });
  it('ignores event_callback with no event payload', () => {
    expect(classifySlackEvent({ type: 'event_callback', event_id: 'Ev1' })).toEqual({
      action: 'ignore',
      reason: 'missing_event',
    });
  });
});

describe('routeInbound', () => {
  const LEGACY = 'C0LEGACY';
  it('#해외문의 스레드 답글 → legacy_thread', () => {
    expect(routeInbound({ channel: LEGACY, threadTs: '1.0', isTopLevel: false, isBroadcast: false }, LEGACY)).toEqual({
      kind: 'legacy_thread',
      threadTs: '1.0',
    });
  });
  it('#해외문의 본문 → skip(legacy_top_level)', () => {
    expect(routeInbound({ channel: LEGACY, threadTs: null, isTopLevel: true, isBroadcast: false }, LEGACY)).toEqual({
      kind: 'skip',
      reason: 'legacy_top_level',
    });
  });
  it('방 본문 → room', () => {
    expect(routeInbound({ channel: 'C0ROOM', threadTs: null, isTopLevel: true, isBroadcast: false }, LEGACY)).toEqual({
      kind: 'room',
      channel: 'C0ROOM',
    });
  });
  it('방 스레드 답글 → skip(internal_note) — 직원끼리 메모', () => {
    expect(routeInbound({ channel: 'C0ROOM', threadTs: '1.0', isTopLevel: false, isBroadcast: false }, LEGACY)).toEqual({
      kind: 'skip',
      reason: 'internal_note',
    });
  });
  it('방 스레드 답글이라도 "채널에도 보내기"면 room', () => {
    expect(routeInbound({ channel: 'C0ROOM', threadTs: '1.0', isTopLevel: false, isBroadcast: true }, LEGACY)).toEqual({
      kind: 'room',
      channel: 'C0ROOM',
    });
  });
  it('피드 채널이 미설정이면 모든 채널을 방 후보로 본다', () => {
    expect(routeInbound({ channel: 'C0ANY', threadTs: null, isTopLevel: true, isBroadcast: false }, null)).toEqual({
      kind: 'room',
      channel: 'C0ANY',
    });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/chat/__tests__/slackEvents.test.ts`
Expected: FAIL — `routeInbound` export 없음, 결과 모양 불일치

- [ ] **Step 3: `slackEvents.ts` 전체 교체**

```ts
import 'server-only';

// Slack Events API 엔벨로프 분류기 — 순수 함수 (I/O 없음).
// 라우트가 3초 내 200을 반환해야 하므로, 무거운 작업 전에 여기서 먼저 걸러낸다.
// "어느 채널이 어느 세션인가"는 DB가 필요하므로 여기서 판정하지 않는다 → routeInbound + slackRelay.

export interface SlackMessageEvent {
  type?: string;
  subtype?: string;
  channel?: string;
  channel_type?: string;
  user?: string;
  bot_id?: string;
  app_id?: string;
  text?: string;
  ts?: string;
  thread_ts?: string;
}

export interface SlackEnvelope {
  type?: string;
  token?: string;
  challenge?: string;
  event_id?: string;
  event?: SlackMessageEvent;
}

export type IgnoreReason =
  | 'unknown_envelope'
  | 'missing_event'
  | 'missing_event_id'
  | 'not_message'
  | 'bot_or_app_message'
  | 'unsupported_subtype'
  | 'missing_channel'
  | 'empty_text';

export interface ProcessDecision {
  action: 'process';
  eventId: string;
  channel: string;
  slackTs: string;
  /** 스레드 답글이면 루트 ts, 본문이면 null */
  threadTs: string | null;
  isTopLevel: boolean;
  /** "채널에도 보내기"를 체크한 스레드 답글 */
  isBroadcast: boolean;
  slackUserId: string | null;
  text: string;
}

export type SlackEventDecision =
  | { action: 'challenge'; challenge: string }
  | { action: 'ignore'; reason: IgnoreReason }
  | ProcessDecision
  | { action: 'room_archived'; eventId: string; channel: string }
  | { action: 'room_unarchived'; eventId: string; channel: string };

// 사람이 남긴 메시지로 취급할 subtype. 그 외(bot_message, message_changed, message_deleted, channel_join, file_share …)는 무시.
const ACCEPTED_SUBTYPES = new Set<string | undefined>([undefined, 'thread_broadcast']);

function ignore(reason: IgnoreReason): SlackEventDecision {
  return { action: 'ignore', reason };
}

export function classifySlackEvent(body: SlackEnvelope): SlackEventDecision {
  if (body.type === 'url_verification') {
    return typeof body.challenge === 'string'
      ? { action: 'challenge', challenge: body.challenge }
      : ignore('unknown_envelope');
  }
  if (body.type !== 'event_callback') return ignore('unknown_envelope');

  const event = body.event;
  if (!event) return ignore('missing_event');
  // event_id는 중복 처리 방지의 키 — 없으면 멱등성을 보장할 수 없으므로 처리하지 않는다.
  if (!body.event_id) return ignore('missing_event_id');

  if (event.type === 'group_archive' || event.type === 'group_unarchive') {
    if (!event.channel) return ignore('missing_channel');
    return {
      action: event.type === 'group_archive' ? 'room_archived' : 'room_unarchived',
      eventId: body.event_id,
      channel: event.channel,
    };
  }

  if (event.type !== 'message') return ignore('not_message');
  // 무한 루프 차단 — 우리 봇이 남긴 메시지도 message.groups로 되돌아온다.
  if (event.bot_id || event.app_id) return ignore('bot_or_app_message');
  if (!ACCEPTED_SUBTYPES.has(event.subtype)) return ignore('unsupported_subtype');
  if (!event.channel || !event.ts) return ignore('missing_channel');

  const text = (event.text ?? '').trim();
  if (!text) return ignore('empty_text');

  const threadTs = event.thread_ts && event.thread_ts !== event.ts ? event.thread_ts : null;
  return {
    action: 'process',
    eventId: body.event_id,
    channel: event.channel,
    slackTs: event.ts,
    threadTs,
    isTopLevel: threadTs === null,
    isBroadcast: event.subtype === 'thread_broadcast',
    slackUserId: event.user ?? null,
    text,
  };
}

export type InboundRoute =
  | { kind: 'legacy_thread'; threadTs: string }
  | { kind: 'room'; channel: string }
  | { kind: 'skip'; reason: 'legacy_top_level' | 'internal_note' };

/**
 * 메시지가 어디로 가야 하는지 (순수).
 * - #해외문의(legacy): 스레드 답글만 전달 (현행), 본문은 무시
 * - 그 외 채널(=방 후보): 본문 또는 "채널에도 보내기" 답글만 전달, 일반 스레드 답글은 내부 메모
 */
export function routeInbound(
  d: Pick<ProcessDecision, 'channel' | 'threadTs' | 'isTopLevel' | 'isBroadcast'>,
  legacyChannelId: string | null
): InboundRoute {
  if (legacyChannelId && d.channel === legacyChannelId) {
    if (d.threadTs) return { kind: 'legacy_thread', threadTs: d.threadTs };
    return { kind: 'skip', reason: 'legacy_top_level' };
  }
  if (d.isTopLevel || d.isBroadcast) return { kind: 'room', channel: d.channel };
  return { kind: 'skip', reason: 'internal_note' };
}
```

- [ ] **Step 4: 라우트 임시 어댑터 (Task 9 전까지 현행 동작 유지)**

`src/app/api/slack/events/route.ts`에서 `// 4. 분류` 부터 `return NextResponse.json({ ok: true });` 직전까지를 아래로 바꾼다. import에 `routeInbound` 추가.

```ts
  // 4. 분류 (모양) → 라우팅 (채널)
  const decision = classifySlackEvent(body);

  if (decision.action === 'challenge') {
    return NextResponse.json({ challenge: decision.challenge });
  }
  if (decision.action === 'ignore') {
    debug('ignored:', decision.reason);
    return NextResponse.json({ ok: true, ignored: decision.reason });
  }
  // Task 9 전 임시: 보관 이벤트와 방 메시지는 아직 처리하지 않는다 (현행 = #해외문의 스레드만)
  if (decision.action !== 'process') {
    return NextResponse.json({ ok: true, ignored: decision.action });
  }
  const route = routeInbound(decision, getSlackChannelId());
  if (route.kind !== 'legacy_thread') {
    return NextResponse.json({ ok: true, ignored: route.kind === 'skip' ? route.reason : 'room_pending' });
  }

  // 5. event_id 선점 (중복/재시도 차단)
  const claim = await claimEvent(decision.eventId, body.event?.type ?? null);
  if (claim === 'duplicate') {
    debug('duplicate event_id, skipping:', decision.eventId);
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // 6. 무거운 작업은 응답 이후로
  after(async () => {
    const outcome = await relaySlackReplyToVisitor({
      threadTs: route.threadTs,
      slackTs: decision.slackTs,
      text: decision.text,
    });
    if (outcome !== 'delivered') {
      console.warn(
        `[slack/events] reply not delivered (${outcome}) event_id=${decision.eventId} thread_ts=${route.threadTs}`
      );
    } else {
      debug('delivered to visitor:', route.threadTs);
    }
  });
```

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run src/lib/chat/__tests__/slackEvents.test.ts && npx tsc --noEmit -p tsconfig.json`
Expected: PASS (28 tests), tsc 오류 0

- [ ] **Step 6: 커밋**

```bash
git add liv-clinic/src/lib/chat/slackEvents.ts liv-clinic/src/lib/chat/__tests__/slackEvents.test.ts liv-clinic/src/app/api/slack/events/route.ts
git commit -m "feat(chat): Slack 이벤트 분류기에 채널·작성자·보관 이벤트 추가, 인바운드 라우팅 분리

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: 릴레이 재작성 — 방 모드 아웃바운드/인바운드/보관 (`slackRelay.ts`) + 이벤트 라우트 최종본

**Files:**
- Rewrite: `liv-clinic/src/lib/chat/slackRelay.ts`
- Rewrite: `liv-clinic/src/app/api/slack/events/route.ts`
- Test: `liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts` (신규 — `resolveTarget`)

**Interfaces:**
- Consumes: Task 2·3·4·6·8의 export, `createChatAdminClient`, `broadcastToSession`, `translate`
- Produces:
  ```ts
  RELAY_SESSION_COLUMNS: string; interface RelaySessionRow {...}
  type SlackTarget = { mode:'room'; channelId } | { mode:'thread'; channelId: string|null; threadTs: string|null } | { mode:'unassigned' }
  resolveTarget(row, legacyChannelId): SlackTarget                                  // 순수
  relayChatMessageToSlack({ sessionId, messageId, sender, originalText, translatedText, senderLabel?, receivedAt? }): Promise<void>
  relayContactToSlack({ sessionId, channelLabel, handle }): Promise<void>
  archiveSessionRoom(sessionId, kind: 'resolved' | 'closed'): Promise<void>
  unarchiveSessionRoom(sessionId): Promise<void>
  interface RelayInboundArgs { channel; slackTs; threadTs; isTopLevel; isBroadcast; text; slackUserId }
  type InboundOutcome = 'delivered' | 'session_not_found' | 'unknown_channel' | 'internal_note' | 'legacy_top_level' | 'empty_text' | 'error'
  relaySlackReplyToVisitor(args: RelayInboundArgs): Promise<InboundOutcome>
  notifyDeliveryFailure(args: RelayInboundArgs, outcome: InboundOutcome): Promise<void>
  handleRoomArchived(channel): Promise<void>; handleRoomUnarchived(channel): Promise<void>
  ```

- [ ] **Step 1: `resolveTarget` 테스트 작성**

`src/lib/chat/__tests__/slackRelay.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { resolveTarget } from '../slackRelay';

describe('resolveTarget', () => {
  it('room 모드 + 채널 → room', () => {
    expect(resolveTarget({ slack_mode: 'room', slack_channel_id: 'C9', slack_thread_ts: null }, 'C0FEED')).toEqual({
      mode: 'room',
      channelId: 'C9',
    });
  });
  it('room 선점만 되고 채널이 아직 없으면 unassigned (경합 폴링 대상)', () => {
    expect(resolveTarget({ slack_mode: 'room', slack_channel_id: null, slack_thread_ts: null }, 'C0FEED')).toEqual({
      mode: 'unassigned',
    });
  });
  it('thread 모드는 저장된 채널과 thread_ts를 쓴다', () => {
    expect(resolveTarget({ slack_mode: 'thread', slack_channel_id: 'C0OLD', slack_thread_ts: '1.0' }, 'C0FEED')).toEqual({
      mode: 'thread',
      channelId: 'C0OLD',
      threadTs: '1.0',
    });
  });
  it('thread 모드인데 채널이 비어 있으면 피드 채널', () => {
    expect(resolveTarget({ slack_mode: 'thread', slack_channel_id: null, slack_thread_ts: null }, 'C0FEED')).toEqual({
      mode: 'thread',
      channelId: 'C0FEED',
      threadTs: null,
    });
  });
  it('모드가 없으면 unassigned', () => {
    expect(resolveTarget({ slack_mode: null, slack_channel_id: null, slack_thread_ts: null }, 'C0FEED')).toEqual({
      mode: 'unassigned',
    });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/chat/__tests__/slackRelay.test.ts`
Expected: FAIL — `resolveTarget` export 없음

- [ ] **Step 3: `slackRelay.ts` 전체 교체**

```ts
import 'server-only';
import { createChatAdminClient, type ChatAdminClient } from '@/lib/chat/db';
import { broadcastToSession } from '@/lib/chat/broadcast';
import { translate } from '@/lib/chat/translation';
import type { VisitorLocale } from '@/lib/chat/serverI18n';
import {
  archiveChannel,
  getSlackChannelId,
  isSlackRelayConfigured,
  postSlackMessage,
  slackTextToPlain,
  unarchiveChannel,
} from '@/lib/chat/slack';
import { getStaffDirectory, mentionOf, type StaffDirectory } from '@/lib/chat/slackStaff';
import { ensureRoom, roomPrefix, type RoomDeps } from '@/lib/chat/slackRooms';
import { routeInbound } from '@/lib/chat/slackEvents';
import {
  adminSessionUrl,
  buildContactText,
  buildDeliveryFailureText,
  buildFeedLine,
  buildReplyText,
  buildRoomFirstText,
  buildRoomVisitorText,
  buildRootText,
  type RelaySender,
  type RoomSessionInfo,
} from '@/lib/chat/slackText';

// Slack ↔ chat_sessions/chat_messages 연결 계층. 두 방향 모두 throw-free.
//
// 세션의 slack_mode:
//   'room'   손님 전용 비공개 채널(slack_channel_id). 채널 본문 = 손님에게 전달, 스레드 = 내부 메모.
//   'thread' #해외문의 스레드(현행). 기존 세션과 방 생성 실패 폴백.
//   NULL     아직 Slack에 안 올라감 → 첫 릴레이에서 ensureRoom.

export { buildContactText, buildReplyText, buildRootText };
export type { RelaySender };

// chat_messages.original_text CHECK 제약 (028) — 넘기면 23514로 INSERT가 실패한다.
const MAX_MESSAGE_CHARS = 1000;

export interface RelaySessionRow {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_locale: string;
  status: string;
  slack_mode: string | null;
  slack_channel_id: string | null;
  slack_thread_ts: string | null;
  assigned_slack_user_id: string | null;
  assigned_label: string | null;
  resolved_at: string | null;
}

export const RELAY_SESSION_COLUMNS =
  'id, visitor_name, visitor_email, visitor_locale, status, slack_mode, slack_channel_id, slack_thread_ts, assigned_slack_user_id, assigned_label, resolved_at';

export type SlackTarget =
  | { mode: 'room'; channelId: string }
  | { mode: 'thread'; channelId: string | null; threadTs: string | null }
  | { mode: 'unassigned' };

/** 세션 행 → 게시 대상 (순수). */
export function resolveTarget(
  s: Pick<RelaySessionRow, 'slack_mode' | 'slack_channel_id' | 'slack_thread_ts'>,
  legacyChannelId: string | null
): SlackTarget {
  if (s.slack_mode === 'room' && s.slack_channel_id) return { mode: 'room', channelId: s.slack_channel_id };
  if (s.slack_mode === 'thread') {
    return { mode: 'thread', channelId: s.slack_channel_id ?? legacyChannelId, threadTs: s.slack_thread_ts };
  }
  return { mode: 'unassigned' };
}

function sessionInfo(s: RelaySessionRow): RoomSessionInfo {
  return {
    sessionId: s.id,
    visitorName: s.visitor_name,
    visitorLocale: s.visitor_locale,
    visitorEmail: s.visitor_email,
  };
}

async function loadSession(admin: ChatAdminClient, sessionId: string): Promise<RelaySessionRow | null> {
  const { data, error } = await admin
    .from('chat_sessions')
    .select(RELAY_SESSION_COLUMNS)
    .eq('id', sessionId)
    .maybeSingle();
  if (error || !data) {
    console.warn('[slack relay] session lookup failed:', error?.code ?? 'not_found');
    return null;
  }
  return data as RelaySessionRow;
}

async function persistSlackTs(admin: ChatAdminClient, messageId: string, ts: string): Promise<void> {
  const { error } = await admin.from('chat_messages').update({ slack_ts: ts }).eq('id', messageId);
  if (error) console.warn('[slack relay] slack_ts persist failed:', error.code ?? 'unknown');
}

async function postFeed(text: string): Promise<void> {
  const feed = getSlackChannelId();
  if (!feed) return;
  const r = await postSlackMessage({ text, channelId: feed });
  if (!r.ok) console.warn('[slack relay] feed post failed:', r.error);
}

function makeRoomDeps(admin: ChatAdminClient, staff: StaffDirectory): RoomDeps {
  return {
    staffIds: staff.inviteIds,
    hasResponders: staff.responderIds.length > 0,
    prefix: roomPrefix(),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    async claimRoomMode(sessionId) {
      const { data } = await admin
        .from('chat_sessions')
        .update({ slack_mode: 'room' })
        .eq('id', sessionId)
        .is('slack_mode', null)
        .select('id');
      return Boolean(data && data.length > 0);
    },
    async setRoom(sessionId, channelId, roomName) {
      await admin
        .from('chat_sessions')
        .update({ slack_channel_id: channelId, slack_room_name: roomName })
        .eq('id', sessionId);
    },
    async setThreadMode(sessionId) {
      await admin
        .from('chat_sessions')
        .update({ slack_mode: 'thread', slack_channel_id: null, slack_room_name: null })
        .eq('id', sessionId);
    },
    async reloadTarget(sessionId) {
      const { data } = await admin
        .from('chat_sessions')
        .select('slack_mode, slack_channel_id')
        .eq('id', sessionId)
        .maybeSingle();
      if (!data) return null;
      if (data.slack_mode === 'room' && data.slack_channel_id) {
        return { mode: 'room', channelId: data.slack_channel_id };
      }
      if (data.slack_mode === 'thread') return { mode: 'thread' };
      return null;
    },
  };
}

// ── 아웃바운드: 손님 메시지 / 관리자 화면 답장 → Slack ────────────────────

export interface RelayOutboundArgs {
  sessionId: string;
  messageId: string;
  sender: RelaySender;
  /** visitor면 외국어 원문, operator면 직원이 입력한 한국어 원문. */
  originalText: string;
  /** visitor면 한국어 번역, operator면 방문자 언어 번역. 실패/스킵이면 null. */
  translatedText: string | null;
  /** operator일 때 Slack에 표시할 작성자 라벨(관리자 이메일 등). */
  senderLabel?: string | null;
  /** chat_messages.created_at — KST 접수 시각 표기용. 없으면 지금. */
  receivedAt?: string;
}

/**
 * 응답 이후(`after()`)에 호출되는 것을 전제로 한다.
 * 방 모드: 방이 없으면 만들고(ensureRoom), 채널 본문에 게시. 보관된 방이면 해제 후 🔔로 게시.
 * 스레드 모드: 현행과 동일 (루트 게시 후 조건부 UPDATE로 thread_ts 선점).
 */
export async function relayChatMessageToSlack(args: RelayOutboundArgs): Promise<void> {
  if (!isSlackRelayConfigured()) return;
  try {
    const admin = createChatAdminClient();
    const session = await loadSession(admin, args.sessionId);
    if (!session) return;
    const staff = getStaffDirectory();
    const legacy = getSlackChannelId();
    const receivedAt = args.receivedAt ?? new Date().toISOString();

    let target = resolveTarget(session, legacy);
    let firstInRoom = false;

    if (target.mode === 'unassigned') {
      const r = await ensureRoom(sessionInfo(session), makeRoomDeps(admin, staff));
      if (r.mode === 'room') {
        target = { mode: 'room', channelId: r.channelId };
        firstInRoom = r.created;
      } else if (r.mode === 'thread') {
        target = { mode: 'thread', channelId: legacy, threadTs: null };
      } else {
        // 경합에서 졌고 방이 끝내 안 보임 — 피드에 단독 게시. 답글은 chat_messages.slack_ts 역조회로 계속 전달된다.
        const posted = await postSlackMessage({ text: rootText(session, args), channelId: legacy ?? undefined });
        if (posted.ok && posted.ts) await persistSlackTs(admin, args.messageId, posted.ts);
        return;
      }
    }

    if (target.mode === 'room') {
      const outcome = await postInRoom(admin, session, staff, target.channelId, args, receivedAt, firstInRoom);
      if (outcome !== 'fallback_thread') return;
      target = { mode: 'thread', channelId: legacy, threadTs: null };
    }

    if (target.mode === 'thread') await postInThread(admin, session, target, args);
  } catch (e) {
    console.warn('[slack relay] outbound failed:', e);
  }
}

function rootText(session: RelaySessionRow, args: RelayOutboundArgs): string {
  return buildRootText({
    sessionId: session.id,
    sender: args.sender,
    senderLabel: args.senderLabel ?? null,
    visitorName: session.visitor_name,
    visitorLocale: session.visitor_locale,
    visitorEmail: session.visitor_email,
    originalText: args.originalText,
    translatedText: args.translatedText,
  });
}

function roomText(
  session: RelaySessionRow,
  staff: StaffDirectory,
  args: RelayOutboundArgs,
  receivedAt: string,
  firstInRoom: boolean,
  reopened: boolean
): string {
  if (args.sender === 'operator') {
    return buildReplyText({
      sender: 'operator',
      senderLabel: args.senderLabel ?? null,
      visitorLocale: session.visitor_locale,
      originalText: args.originalText,
      translatedText: args.translatedText,
    });
  }
  const body = {
    visitorLocale: session.visitor_locale,
    originalText: args.originalText,
    translatedText: args.translatedText,
  };
  if (firstInRoom) return buildRoomFirstText({ mentionAll: staff.mentionAll(), receivedAt, ...body });
  // 담당자가 있으면 담당자만, 없으면 전원. 관찰자는 mentionAll에 들어 있지 않다.
  const mention = session.assigned_slack_user_id ? mentionOf(session.assigned_slack_user_id) : staff.mentionAll();
  return buildRoomVisitorText({ mention, receivedAt, reopened, ...body });
}

async function postInRoom(
  admin: ChatAdminClient,
  session: RelaySessionRow,
  staff: StaffDirectory,
  channelId: string,
  args: RelayOutboundArgs,
  receivedAt: string,
  firstInRoom: boolean
): Promise<'posted' | 'failed' | 'fallback_thread'> {
  let posted = await postSlackMessage({
    text: roomText(session, staff, args, receivedAt, firstInRoom, false),
    channelId,
  });

  if (!posted.ok && posted.error === 'is_archived') {
    // 완료(보관)된 방에 손님이 다시 말을 걸었다 → 해제 후 🔔로 게시 + 피드에 '다시 열림'
    const un = await unarchiveChannel(channelId);
    if (!un.ok) {
      console.warn('[slack relay] unarchive failed, switching session to thread mode:', un.error);
      await admin
        .from('chat_sessions')
        .update({ slack_mode: 'thread', slack_channel_id: null, slack_thread_ts: null, slack_room_name: null })
        .eq('id', session.id);
      return 'fallback_thread';
    }
    posted = await postSlackMessage({ text: roomText(session, staff, args, receivedAt, false, true), channelId });
    await postFeed(
      buildFeedLine({
        kind: 'reopened',
        visitorName: session.visitor_name,
        visitorLocale: session.visitor_locale,
        channelId,
        at: receivedAt,
      })
    );
  }

  if (!posted.ok || !posted.ts) {
    console.warn('[slack relay] room post failed:', posted.error);
    return 'failed';
  }
  await persistSlackTs(admin, args.messageId, posted.ts);
  if (firstInRoom) {
    await postFeed(
      buildFeedLine({
        kind: 'new',
        visitorName: session.visitor_name,
        visitorLocale: session.visitor_locale,
        channelId,
        at: receivedAt,
      })
    );
  }
  return 'posted';
}

/** 스레드 모드 — 현행 동작 그대로. 루트면 조건부 UPDATE로 thread_ts를 선점한다. */
async function postInThread(
  admin: ChatAdminClient,
  session: RelaySessionRow,
  target: { channelId: string | null; threadTs: string | null },
  args: RelayOutboundArgs
): Promise<void> {
  const isRoot = !target.threadTs;
  const text = isRoot
    ? rootText(session, args)
    : buildReplyText({
        sender: args.sender,
        senderLabel: args.senderLabel ?? null,
        visitorLocale: session.visitor_locale,
        originalText: args.originalText,
        translatedText: args.translatedText,
      });

  const result = await postSlackMessage({
    text,
    threadTs: target.threadTs,
    channelId: target.channelId ?? undefined,
  });
  if (!result.ok || !result.ts) {
    console.warn('[slack relay] postMessage failed:', result.error);
    return;
  }
  await persistSlackTs(admin, args.messageId, result.ts);

  if (isRoot) {
    // 동시 요청 중 하나만 세션 대표 스레드를 확정한다. 진 쪽 루트도 chat_messages.slack_ts로 역조회된다.
    const { data: claimed, error: claimError } = await admin
      .from('chat_sessions')
      .update({
        slack_thread_ts: result.ts,
        slack_channel_id: result.channel ?? target.channelId,
        slack_mode: 'thread',
      })
      .eq('id', session.id)
      .is('slack_thread_ts', null)
      .select('id');
    if (claimError) {
      console.warn('[slack relay] thread_ts claim failed:', claimError.code ?? 'unknown');
    } else if (!claimed || claimed.length === 0) {
      console.warn('[slack relay] thread_ts already claimed by a concurrent message');
    }
  }
}

/** 방문자가 남긴 메신저 연락처를 세션의 방/스레드에 게시한다. throw-free. */
export async function relayContactToSlack(args: {
  sessionId: string;
  channelLabel: string;
  handle: string;
}): Promise<void> {
  if (!isSlackRelayConfigured()) return;
  try {
    const admin = createChatAdminClient();
    const session = await loadSession(admin, args.sessionId);
    if (!session) return;
    const target = resolveTarget(session, getSlackChannelId());
    const attached = target.mode === 'room' || (target.mode === 'thread' && Boolean(target.threadTs));
    const text = buildContactText({
      channelLabel: args.channelLabel,
      handle: args.handle,
      adminUrl: attached ? null : adminSessionUrl(args.sessionId),
    });
    const result =
      target.mode === 'room'
        ? await postSlackMessage({ text, channelId: target.channelId })
        : await postSlackMessage({
            text,
            threadTs: target.mode === 'thread' ? target.threadTs : null,
            channelId: (target.mode === 'thread' ? target.channelId : null) ?? undefined,
          });
    if (!result.ok) console.warn('[slack relay] contact post failed:', result.error);
  } catch (e) {
    console.warn('[slack relay] contact relay failed:', e);
  }
}

// ── 완료 / 종료 / 재오픈 ↔ 보관 / 해제 ─────────────────────────────────

/** 완료·종료 시: 방이면 보관, 피드에 한 줄. throw-free. */
export async function archiveSessionRoom(sessionId: string, kind: 'resolved' | 'closed'): Promise<void> {
  if (!isSlackRelayConfigured()) return;
  try {
    const admin = createChatAdminClient();
    const session = await loadSession(admin, sessionId);
    if (!session) return;
    const target = resolveTarget(session, getSlackChannelId());
    if (target.mode === 'room') {
      const r = await archiveChannel(target.channelId);
      if (!r.ok) console.warn('[slack relay] archive failed:', r.error);
    }
    await postFeed(
      buildFeedLine({
        kind,
        visitorName: session.visitor_name,
        visitorLocale: session.visitor_locale,
        channelId: target.mode === 'room' ? target.channelId : null,
        at: new Date().toISOString(),
        assignedLabel: session.assigned_label,
      })
    );
  } catch (e) {
    console.warn('[slack relay] archiveSessionRoom failed:', e);
  }
}

/** 완료 취소 시: 방이면 보관 해제. throw-free. */
export async function unarchiveSessionRoom(sessionId: string): Promise<void> {
  if (!isSlackRelayConfigured()) return;
  try {
    const admin = createChatAdminClient();
    const session = await loadSession(admin, sessionId);
    if (!session) return;
    const target = resolveTarget(session, getSlackChannelId());
    if (target.mode !== 'room') return;
    const r = await unarchiveChannel(target.channelId);
    if (!r.ok) console.warn('[slack relay] unarchive failed:', r.error);
  } catch (e) {
    console.warn('[slack relay] unarchiveSessionRoom failed:', e);
  }
}

/** 직원이 Slack에서 직접 방을 보관했다 → 완료 처리 (조건부: 이미 완료면 무변경). */
export async function handleRoomArchived(channel: string): Promise<void> {
  try {
    const admin = createChatAdminClient();
    await admin
      .from('chat_sessions')
      .update({ resolved_at: new Date().toISOString(), resolved_label: 'Slack에서 보관' })
      .eq('slack_channel_id', channel)
      .eq('slack_mode', 'room')
      .is('resolved_at', null);
  } catch (e) {
    console.warn('[slack relay] handleRoomArchived failed:', e);
  }
}

/** 직원이 Slack에서 직접 보관을 해제했다 → 완료 취소. */
export async function handleRoomUnarchived(channel: string): Promise<void> {
  try {
    const admin = createChatAdminClient();
    await admin
      .from('chat_sessions')
      .update({ resolved_at: null, resolved_label: null })
      .eq('slack_channel_id', channel)
      .eq('slack_mode', 'room');
  } catch (e) {
    console.warn('[slack relay] handleRoomUnarchived failed:', e);
  }
}

// ── 인바운드: 직원 답글 → 손님 ────────────────────────────────────────────

export type InboundOutcome =
  | 'delivered'
  | 'session_not_found'
  | 'unknown_channel'
  | 'internal_note'
  | 'legacy_top_level'
  | 'empty_text'
  | 'error';

export interface RelayInboundArgs {
  channel: string;
  slackTs: string;
  threadTs: string | null;
  isTopLevel: boolean;
  isBroadcast: boolean;
  text: string;
  slackUserId: string | null;
}

async function findSessionByRoom(admin: ChatAdminClient, channel: string): Promise<RelaySessionRow | null> {
  const { data } = await admin
    .from('chat_sessions')
    .select(RELAY_SESSION_COLUMNS)
    .eq('slack_channel_id', channel)
    .eq('slack_mode', 'room')
    .maybeSingle();
  return (data as RelaySessionRow | null) ?? null;
}

async function findSessionByThread(admin: ChatAdminClient, threadTs: string): Promise<RelaySessionRow | null> {
  // 1. 세션의 대표 스레드
  const { data: byThread } = await admin
    .from('chat_sessions')
    .select(RELAY_SESSION_COLUMNS)
    .eq('slack_thread_ts', threadTs)
    .maybeSingle();
  if (byThread) return byThread as RelaySessionRow;
  // 2. fallback: 해당 ts로 게시된 메시지에서 세션을 찾는다 (경합에서 진 루트, 피드 단독 게시)
  const { data: byMessage } = await admin
    .from('chat_messages')
    .select('session_id')
    .eq('slack_ts', threadTs)
    .limit(1)
    .maybeSingle();
  if (!byMessage) return null;
  return loadSession(admin, byMessage.session_id);
}

/**
 * Slack 메시지를 손님 채팅창으로 전달한다.
 * operator 메시지로 INSERT하므로 040 트리거가 unread_admin_count·awaiting_since를 리셋하고,
 * 어드민 상세(postgres_changes)와 방문자 위젯(broadcast)에 모두 반영된다.
 */
export async function relaySlackReplyToVisitor(args: RelayInboundArgs): Promise<InboundOutcome> {
  try {
    const admin = createChatAdminClient();
    const route = routeInbound(args, getSlackChannelId());
    if (route.kind === 'skip') return route.reason;

    const plain = slackTextToPlain(args.text).slice(0, MAX_MESSAGE_CHARS);
    if (!plain) return 'empty_text';

    const session =
      route.kind === 'room'
        ? await findSessionByRoom(admin, route.channel)
        : await findSessionByThread(admin, route.threadTs);
    if (!session) return route.kind === 'room' ? 'unknown_channel' : 'session_not_found';

    if (session.status !== 'open') {
      // 종료된 상담에 직원이 답하면 되살려서 전달한다 (09-01 §6.5-B). 손님은 돌아왔을 때 티저로 본다.
      const { error } = await admin
        .from('chat_sessions')
        .update({ status: 'open', closed_at: null })
        .eq('id', session.id);
      if (error) {
        console.error('[slack relay] reopen failed:', error);
        return 'error';
      }
    }

    const staff = getStaffDirectory();
    const senderLabel = staff.labelOf(args.slackUserId);
    const visitorLocale = session.visitor_locale as VisitorLocale;
    const translation = await translate(plain, 'ko', visitorLocale);

    const { data: inserted, error: insertError } = await admin
      .from('chat_messages')
      .insert({
        session_id: session.id,
        sender: 'operator',
        sender_admin_id: null, // Slack 경유 — Supabase 사용자와 매핑되지 않음
        original_text: plain,
        original_lang: 'ko',
        translated_text: translation.status === 'failed' ? null : translation.text,
        translated_lang: translation.status === 'failed' ? null : visitorLocale,
        translation_status: translation.status,
        translation_latency_ms: translation.latencyMs,
        translation_error: translation.errorCode ?? null,
        slack_ts: args.slackTs,
        slack_user_id: args.slackUserId,
        sender_label: senderLabel,
        source: 'slack',
      })
      .select('id')
      .single();
    if (insertError || !inserted) {
      console.error('[slack relay] inbound insert failed:', insertError);
      return 'error';
    }

    // 담당자 = 가장 최근에 답한 "답변 직원". 관찰자(SLACK_OBSERVERS)는 담당자가 되지 않는다.
    if (args.slackUserId && staff.isResponder(args.slackUserId)) {
      await admin
        .from('chat_sessions')
        .update({
          assigned_slack_user_id: args.slackUserId,
          assigned_label: senderLabel,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', session.id);
    }

    await broadcastToSession(session.id, {
      type: 'message_created',
      payload: { messageId: inserted.id, sender: 'operator' },
    });
    return 'delivered';
  } catch (e) {
    console.error('[slack relay] inbound failed:', e);
    return 'error';
  }
}

/** 전달 실패를 같은 방/스레드에 알린다. 의도된 무시(내부 메모 등)와 무관한 채널에는 보내지 않는다. */
export async function notifyDeliveryFailure(args: RelayInboundArgs, outcome: InboundOutcome): Promise<void> {
  const silent: InboundOutcome[] = ['delivered', 'internal_note', 'legacy_top_level', 'unknown_channel'];
  if (silent.includes(outcome)) return;
  try {
    const r = await postSlackMessage({
      text: buildDeliveryFailureText(outcome),
      channelId: args.channel,
      threadTs: args.threadTs,
    });
    if (!r.ok) console.warn('[slack relay] failure notice not posted:', r.error);
  } catch (e) {
    console.warn('[slack relay] failure notice threw:', e);
  }
}
```

- [ ] **Step 4: 이벤트 라우트 최종본**

`src/app/api/slack/events/route.ts` 전체:
```ts
import { after, NextRequest, NextResponse } from 'next/server';
import { createChatAdminClient } from '@/lib/chat/db';
import { verifySlackSignature } from '@/lib/chat/slack';
import { classifySlackEvent, type SlackEnvelope } from '@/lib/chat/slackEvents';
import {
  handleRoomArchived,
  handleRoomUnarchived,
  notifyDeliveryFailure,
  relaySlackReplyToVisitor,
  type RelayInboundArgs,
} from '@/lib/chat/slackRelay';

export const runtime = 'nodejs';
// 서명 검증에는 원본 바이트가 필요하므로 어떤 캐싱/변형도 걸리지 않게 한다.
export const dynamic = 'force-dynamic';

const IS_DEV = process.env.NODE_ENV !== 'production';

function debug(...args: unknown[]): void {
  if (IS_DEV) console.log('[slack/events]', ...args);
}

/**
 * Slack Events API 수신 (message.groups + group_archive + group_unarchive).
 * 동기 구간은 [서명 검증 → 분류 → event_id 선점]까지. 번역·DB INSERT·Broadcast는 after().
 */
export async function POST(req: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: 'unreadable_body' }, { status: 400 });
  }

  const sig = verifySlackSignature({
    rawBody,
    signature: req.headers.get('x-slack-signature'),
    timestamp: req.headers.get('x-slack-request-timestamp'),
  });
  if (!sig.valid) {
    if (sig.reason === 'no_signing_secret') {
      console.error('[slack/events] SLACK_SIGNING_SECRET is not configured');
      return NextResponse.json({ error: 'not_configured' }, { status: 503 });
    }
    debug('signature rejected:', sig.reason);
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  let body: SlackEnvelope;
  try {
    body = JSON.parse(rawBody) as SlackEnvelope;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const decision = classifySlackEvent(body);
  if (decision.action === 'challenge') {
    return NextResponse.json({ challenge: decision.challenge });
  }
  if (decision.action === 'ignore') {
    debug('ignored:', decision.reason);
    return NextResponse.json({ ok: true, ignored: decision.reason });
  }

  const claim = await claimEvent(decision.eventId, body.event?.type ?? null);
  if (claim === 'duplicate') {
    debug('duplicate event_id, skipping:', decision.eventId);
    return NextResponse.json({ ok: true, duplicate: true });
  }

  after(async () => {
    if (decision.action === 'room_archived') {
      await handleRoomArchived(decision.channel);
      return;
    }
    if (decision.action === 'room_unarchived') {
      await handleRoomUnarchived(decision.channel);
      return;
    }
    const inbound: RelayInboundArgs = {
      channel: decision.channel,
      slackTs: decision.slackTs,
      threadTs: decision.threadTs,
      isTopLevel: decision.isTopLevel,
      isBroadcast: decision.isBroadcast,
      text: decision.text,
      slackUserId: decision.slackUserId,
    };
    const outcome = await relaySlackReplyToVisitor(inbound);
    if (outcome === 'delivered') {
      debug('delivered to visitor:', decision.channel);
      return;
    }
    // event_id를 이미 선점했으므로 Slack 재시도로는 복구되지 않는다 — 로그 + 같은 방/스레드에 ⚠️ 알림.
    console.warn(
      `[slack/events] reply not delivered (${outcome}) event_id=${decision.eventId} channel=${decision.channel}`
    );
    await notifyDeliveryFailure(inbound, outcome);
  });

  return NextResponse.json({ ok: true });
}

type ClaimResult = 'claimed' | 'duplicate' | 'unknown';

/** chat_slack_events에 event_id를 INSERT하여 처리 권한을 선점한다. PK 충돌(23505) = 이미 처리됨. */
async function claimEvent(eventId: string, eventType: string | null): Promise<ClaimResult> {
  try {
    const admin = createChatAdminClient();
    const { error } = await admin.from('chat_slack_events').insert({ event_id: eventId, event_type: eventType });
    if (!error) return 'claimed';
    if (error.code === '23505') return 'duplicate';
    console.warn('[slack/events] event claim failed:', error.code ?? 'unknown');
    return 'unknown';
  } catch (e) {
    console.warn('[slack/events] event claim threw:', e);
    return 'unknown';
  }
}

// Slack은 POST만 보낸다. GET은 헬스체크(keep-warm 대상) 용도로만 최소 응답.
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'slack-events' });
}
```

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run src/lib/chat && npx tsc --noEmit -p tsconfig.json`
Expected: 모든 chat 테스트 PASS, tsc 오류 0. `grep -rn "chat.delete" src` → 0건.

- [ ] **Step 6: 커밋**

```bash
git add liv-clinic/src/lib/chat/slackRelay.ts liv-clinic/src/app/api/slack/events/route.ts liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts
git commit -m "feat(chat): 방 모드 릴레이 — 채널 본문 전달, 내부 메모, 자동 담당, 보관·해제, 전달 실패 알림

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---
### Task 10: 자동 첫 안내 — `serverI18n.ts` 문구 + `autoAck.ts`

**Files:**
- Modify: `liv-clinic/src/lib/chat/serverI18n.ts` (`SystemMessageKey`에 2개 추가, 10개 로케일 문구, `getAutoAckTexts`)
- Create: `liv-clinic/src/lib/chat/autoAck.ts`
- Test: `liv-clinic/src/lib/chat/__tests__/autoAck.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // serverI18n.ts
  type SystemMessageKey = 'welcome' | 'delayedResponseNotice' | 'allOperatorsBusyNotice' | 'sessionEnded' | 'autoAck' | 'autoAckOffHours'
  getAutoAckTexts(locale: VisitorLocale, offHours: boolean): { ko: string; localized: string }
  // autoAck.ts
  interface AutoAckState { awaitingSince: string | null; autoAckAt: string | null }
  shouldSendAutoAck(s: AutoAckState): boolean                       // 순수
  type AutoAckOutcome = 'sent' | 'not_due' | 'lost_race' | 'error'
  sendAutoAckIfDue(sessionId: string, now?: Date): Promise<AutoAckOutcome>
  ```

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/chat/__tests__/autoAck.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { shouldSendAutoAck } from '../autoAck';
import { getAutoAckTexts, VISITOR_LOCALES } from '../serverI18n';

describe('shouldSendAutoAck', () => {
  it('기다리는 중이 아니면(awaiting_since NULL) 안 보낸다', () => {
    expect(shouldSendAutoAck({ awaitingSince: null, autoAckAt: null })).toBe(false);
  });
  it('아직 한 번도 안 보냈으면 보낸다', () => {
    expect(shouldSendAutoAck({ awaitingSince: '2024-01-01T01:00:00Z', autoAckAt: null })).toBe(true);
  });
  it('이번 대기 구간이 시작된 뒤에 이미 보냈으면 안 보낸다', () => {
    expect(
      shouldSendAutoAck({ awaitingSince: '2024-01-01T01:00:00Z', autoAckAt: '2024-01-01T01:00:05Z' })
    ).toBe(false);
  });
  it('지난 대기 구간에 보낸 것이면(직원 답변 후 손님 재발신) 다시 보낸다', () => {
    expect(
      shouldSendAutoAck({ awaitingSince: '2024-01-02T09:00:00Z', autoAckAt: '2024-01-01T01:00:05Z' })
    ).toBe(true);
  });
});

describe('getAutoAckTexts', () => {
  it('10개 로케일 모두 영업시간 중/외 문구가 있고 서로 다르다', () => {
    for (const locale of VISITOR_LOCALES) {
      const open = getAutoAckTexts(locale, false);
      const off = getAutoAckTexts(locale, true);
      expect(open.localized.length).toBeGreaterThan(10);
      expect(off.localized.length).toBeGreaterThan(10);
      expect(open.localized).not.toBe(off.localized);
    }
  });
  it('한국어 원문은 로케일과 무관하게 같고, 영업시간 중/외가 다르다', () => {
    expect(getAutoAckTexts('en', false).ko).toBe(getAutoAckTexts('ja', false).ko);
    expect(getAutoAckTexts('en', false).ko).toContain('잠시만 기다려 주세요');
    expect(getAutoAckTexts('en', true).ko).toContain('상담 시간에 순서대로');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/chat/__tests__/autoAck.test.ts`
Expected: FAIL — `Cannot find module '../autoAck'`, `getAutoAckTexts` 없음

- [ ] **Step 3: `serverI18n.ts` 수정**

`SystemMessageKey` 유니온에 `| 'autoAck' | 'autoAckOffHours'`를 추가하고, `SYSTEM_MESSAGES`의 각 로케일 객체에 아래 두 키를 넣는다.

```ts
  en: {
    // …기존 4개…
    autoAck: "Hello! Thank you for your message. Please hold on a moment, we'll get back to you shortly.",
    autoAckOffHours: "Hello! Thank you for your message. We're outside consultation hours right now and will reply in order once we're back.",
  },
  ja: {
    autoAck: 'こんにちは！メッセージありがとうございます。少々お待ちください。まもなくご返信いたします。',
    autoAckOffHours: 'こんにちは！メッセージありがとうございます。ただいま相談時間外のため、営業時間開始後に順番にご返信いたします。',
  },
  zh: {
    autoAck: '您好！感谢您的留言。请稍等，我们会尽快回复您。',
    autoAckOffHours: '您好！感谢您的留言。现在是非咨询时间，我们将在营业时间内按顺序回复您。',
  },
  'zh-TW': {
    autoAck: '您好！感謝您的留言。請稍候，我們會盡快回覆您。',
    autoAckOffHours: '您好！感謝您的留言。現在是非諮詢時間，我們將在營業時間內依序回覆您。',
  },
  vi: {
    autoAck: 'Xin chào! Cảm ơn bạn đã nhắn tin. Vui lòng đợi trong giây lát, chúng tôi sẽ trả lời bạn ngay.',
    autoAckOffHours: 'Xin chào! Cảm ơn bạn đã nhắn tin. Hiện đang ngoài giờ tư vấn, chúng tôi sẽ lần lượt trả lời trong giờ làm việc.',
  },
  th: {
    autoAck: 'สวัสดีค่ะ! ขอบคุณสำหรับข้อความ กรุณารอสักครู่ เราจะตอบกลับโดยเร็วที่สุด',
    autoAckOffHours: 'สวัสดีค่ะ! ขอบคุณสำหรับข้อความ ขณะนี้อยู่นอกเวลาให้คำปรึกษา เราจะตอบกลับตามลำดับในเวลาทำการค่ะ',
  },
  ru: {
    autoAck: 'Здравствуйте! Спасибо за сообщение. Пожалуйста, подождите немного, мы скоро вам ответим.',
    autoAckOffHours: 'Здравствуйте! Спасибо за сообщение. Сейчас нерабочее время, мы ответим вам в порядке очереди в рабочие часы.',
  },
  fr: {
    autoAck: 'Bonjour ! Merci pour votre message. Un instant, nous vous répondons très vite.',
    autoAckOffHours: "Bonjour ! Merci pour votre message. Nous sommes en dehors des heures de consultation et vous répondrons dans l'ordre à notre retour.",
  },
  mn: {
    autoAck: 'Сайн байна уу! Мессеж үлдээсэнд баярлалаа. Түр хүлээнэ үү, бид удахгүй хариулах болно.',
    autoAckOffHours: 'Сайн байна уу! Мессеж үлдээсэнд баярлалаа. Одоо зөвлөгөөний цаг биш тул ажлын цагаар дарааллын дагуу хариулах болно.',
  },
  ar: {
    autoAck: 'مرحباً! شكراً لرسالتك. يرجى الانتظار قليلاً، سنرد عليك قريباً.',
    autoAckOffHours: 'مرحباً! شكراً لرسالتك. نحن حالياً خارج ساعات الاستشارة وسنرد عليك بالترتيب عند عودتنا.',
  },
```
(위 블록은 각 로케일 객체 안에 **추가할 두 줄**만 적은 것이다. 기존 4개 키는 그대로 둔다. `Record<VisitorLocale, Record<SystemMessageKey, string>>` 타입이 10개 로케일 전부에 두 키를 강제하므로 빠뜨리면 컴파일이 실패한다.)

파일 끝에 추가:
```ts
// 자동 첫 안내의 한국어 원문 — 관리자 화면에 "직원 답장"처럼 보이도록 original_text로 저장한다 (스펙 §4.10).
const AUTO_ACK_KO: Record<'autoAck' | 'autoAckOffHours', string> = {
  autoAck: '안녕하세요! 메시지 감사합니다. 잠시만 기다려 주세요. 곧 답변을 드리겠습니다.',
  autoAckOffHours:
    '안녕하세요! 메시지 감사합니다. 지금은 상담 시간이 아니어서 상담 시간에 순서대로 답변드리겠습니다.',
};

export function getAutoAckTexts(
  locale: VisitorLocale,
  offHours: boolean
): { ko: string; localized: string } {
  const key = offHours ? 'autoAckOffHours' : 'autoAck';
  return { ko: AUTO_ACK_KO[key], localized: getChatSystemMessage(locale, key) };
}
```

- [ ] **Step 4: `autoAck.ts` 작성**

```ts
import 'server-only';
import { createChatAdminClient } from '@/lib/chat/db';
import { broadcastToSession } from '@/lib/chat/broadcast';
import { isBusinessHours } from '@/lib/chat/businessHours';
import { getAutoAckTexts, type VisitorLocale } from '@/lib/chat/serverI18n';

// 자동 첫 안내 (스펙 §4.10): 손님 메시지가 새 대기 구간을 시작할 때 1회, 손님 언어로 미리 쓴 문구를 낸다.
// 번역 API 호출 없음. source='auto'라 040 트리거가 "답변"으로 세지 않는다.

export interface AutoAckState {
  awaitingSince: string | null;
  autoAckAt: string | null;
}

/** 새 대기 구간의 첫 손님 메시지일 때만 true (순수). */
export function shouldSendAutoAck(s: AutoAckState): boolean {
  if (!s.awaitingSince) return false;
  if (!s.autoAckAt) return true;
  return Date.parse(s.autoAckAt) < Date.parse(s.awaitingSince);
}

export type AutoAckOutcome = 'sent' | 'not_due' | 'lost_race' | 'error';

export async function sendAutoAckIfDue(sessionId: string, now = new Date()): Promise<AutoAckOutcome> {
  try {
    const admin = createChatAdminClient();
    const { data: s } = await admin
      .from('chat_sessions')
      .select('id, visitor_locale, awaiting_since, auto_ack_at')
      .eq('id', sessionId)
      .maybeSingle();
    if (!s || !s.awaiting_since) return 'not_due';
    if (!shouldSendAutoAck({ awaitingSince: s.awaiting_since, autoAckAt: s.auto_ack_at })) return 'not_due';

    // 조건부 선점 — 읽은 값이 그대로일 때만 1행. 손님이 연달아 보내도 안내는 한 번이다.
    let claim = admin
      .from('chat_sessions')
      .update({ auto_ack_at: now.toISOString() })
      .eq('id', sessionId)
      .eq('awaiting_since', s.awaiting_since);
    claim = s.auto_ack_at ? claim.eq('auto_ack_at', s.auto_ack_at) : claim.is('auto_ack_at', null);
    const { data: claimed } = await claim.select('id');
    if (!claimed || claimed.length === 0) return 'lost_race';

    const locale = s.visitor_locale as VisitorLocale;
    const texts = getAutoAckTexts(locale, !isBusinessHours(now));
    const { data: inserted, error } = await admin
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        sender: 'operator',
        sender_admin_id: null,
        original_text: texts.ko,
        original_lang: 'ko',
        translated_text: texts.localized,
        translated_lang: locale,
        translation_status: 'success',
        translation_latency_ms: 0,
        source: 'auto',
        sender_label: '자동 안내',
      })
      .select('id')
      .single();
    if (error || !inserted) {
      console.warn('[auto ack] insert failed:', error?.code ?? 'unknown');
      return 'error';
    }
    await broadcastToSession(sessionId, {
      type: 'message_created',
      payload: { messageId: inserted.id, sender: 'operator' },
    });
    return 'sent';
  } catch (e) {
    console.warn('[auto ack] failed:', e);
    return 'error';
  }
}
```

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run src/lib/chat/__tests__/autoAck.test.ts && npx tsc --noEmit -p tsconfig.json`
Expected: PASS (6 tests), tsc 오류 0

- [ ] **Step 6: 커밋**

```bash
git add liv-clinic/src/lib/chat/serverI18n.ts liv-clinic/src/lib/chat/autoAck.ts liv-clinic/src/lib/chat/__tests__/autoAck.test.ts
git commit -m "feat(chat): 손님 첫 메시지 자동 안내 (10개 언어, 영업시간 중/외, 번역 API 미사용)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: 메시지 라우트 — 접수 시각·작성자 라벨 전달 + 자동 안내 호출

**Files:**
- Modify: `liv-clinic/src/app/api/chat/messages/route.ts`

**Interfaces:**
- Consumes: `relayChatMessageToSlack` (Task 9, `receivedAt` 인자), `sendAutoAckIfDue` (Task 10)

- [ ] **Step 1: import 추가**

```ts
import { sendAutoAckIfDue } from '@/lib/chat/autoAck';
```

- [ ] **Step 2: `persistAndBroadcast` 수정 — INSERT에 `sender_label`, after()에 receivedAt + 자동 안내**

`// 1. pending 메시지 INSERT`의 insert 객체에 한 줄 추가:
```ts
      sender_label: sender === 'operator' ? senderLabel : null,
```

`// 5. Slack 채널로 릴레이` 블록의 `after(...)`를 아래로 교체:
```ts
  after(async () => {
    await relayChatMessageToSlack({
      sessionId,
      messageId: updated.id,
      sender,
      originalText: updated.original_text,
      translatedText,
      senderLabel,
      receivedAt: updated.created_at,
    });
    // 자동 첫 안내 — Slack 릴레이 뒤에 실행해 직원 알림을 늦추지 않는다 (스펙 §4.10)
    if (sender === 'visitor') {
      const ack = await sendAutoAckIfDue(sessionId);
      if (ack === 'error') console.warn('[chat/messages] auto ack failed for session', sessionId);
    }
  });
```

- [ ] **Step 3: 타입·테스트 확인**

Run: `npx tsc --noEmit -p tsconfig.json && npm run test`
Expected: 오류 0, 전체 테스트 PASS

- [ ] **Step 4: 커밋**

```bash
git add liv-clinic/src/app/api/chat/messages/route.ts
git commit -m "feat(chat): 손님 메시지 뒤 자동 안내 발송, Slack에 접수 시각·작성자 전달

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: 완료/완료 취소/종료 — 세션 PATCH + 클라이언트 API

**Files:**
- Modify: `liv-clinic/src/app/api/chat/sessions/[id]/route.ts`
- Modify: `liv-clinic/src/lib/chat/chatApi.ts`

**Interfaces:**
- Consumes: `archiveSessionRoom`, `unarchiveSessionRoom` (Task 9)
- Produces: `PATCH /api/chat/sessions/[id]` 바디 `{ action?: 'resolve' | 'unresolve' | 'close' }` (기본 `close`). 응답 `{ success: true, sessionId, action }`. `chatApi.ts`: `resolveSession(id)`, `unresolveSession(id)`; `closeSession` 불변.

- [ ] **Step 1: 라우트 수정**

import에 추가:
```ts
import { after } from 'next/server';
import { z } from 'zod';
import { archiveSessionRoom, unarchiveSessionRoom } from '@/lib/chat/slackRelay';
```
(`NextRequest, NextResponse`는 이미 `next/server`에서 가져오므로 한 줄로 합친다: `import { after, NextRequest, NextResponse } from 'next/server';`)

스키마를 파일 상단에:
```ts
// 기존 closeSession()은 바디 없이 호출하므로 default가 필수.
const PatchSchema = z
  .object({ action: z.enum(['resolve', 'unresolve', 'close']).default('close') })
  .default({ action: 'close' });
```

인증 확인 뒤(`if (!user) …` 다음), 세션 조회 **앞**에 바디 파싱:
```ts
  let action: 'resolve' | 'unresolve' | 'close' = 'close';
  try {
    const raw = await req.text();
    const parsed = PatchSchema.safeParse(raw ? JSON.parse(raw) : {});
    if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    action = parsed.data.action;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
```

세션 조회 select에 `resolved_at` 추가: `.select('id, status, visitor_locale, resolved_at')`.

기존 `if (session.status !== 'open') { … 409 }` **앞**에 resolve/unresolve 분기:
```ts
  // 완료 ≠ 종료 (스펙 §4.5). resolved_at만 세팅하고 status는 open 유지 — 손님에게 아무 것도 가지 않는다.
  if (action === 'resolve') {
    if (session.status !== 'open') {
      return NextResponse.json({ error: 'already_closed', status: session.status }, { status: 409 });
    }
    const { error } = await admin
      .from('chat_sessions')
      .update({ resolved_at: new Date().toISOString(), resolved_label: '관리자 화면' })
      .eq('id', sessionId);
    if (error) {
      console.error('[chat/sessions/[id]] resolve failed:', error);
      return NextResponse.json({ error: 'db_error' }, { status: 500 });
    }
    after(() => archiveSessionRoom(sessionId, 'resolved'));
    return NextResponse.json({ success: true, sessionId, action });
  }

  if (action === 'unresolve') {
    const { error } = await admin
      .from('chat_sessions')
      .update({ resolved_at: null, resolved_label: null })
      .eq('id', sessionId);
    if (error) {
      console.error('[chat/sessions/[id]] unresolve failed:', error);
      return NextResponse.json({ error: 'db_error' }, { status: 500 });
    }
    after(() => unarchiveSessionRoom(sessionId));
    return NextResponse.json({ success: true, sessionId, action });
  }
```

기존 close 경로의 마지막 `return NextResponse.json({ success: true, sessionId });` 직전에:
```ts
  after(() => archiveSessionRoom(sessionId, 'closed'));
```
그리고 그 return을 `return NextResponse.json({ success: true, sessionId, action });`로.

- [ ] **Step 2: `chatApi.ts`에 추가** (`closeSession` 바로 아래)

```ts
async function patchSession(sessionId: string, action: 'resolve' | 'unresolve'): Promise<void> {
  const res = await fetch(`/api/chat/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new ChatApiError(res.status, err?.error ?? `${action}_failed`, err);
  }
}

/** 완료 처리 — 내부 정리. 손님에게는 아무 메시지도 가지 않는다. */
export function resolveSession(sessionId: string): Promise<void> {
  return patchSession(sessionId, 'resolve');
}

export function unresolveSession(sessionId: string): Promise<void> {
  return patchSession(sessionId, 'unresolve');
}
```

`ChatMessage` 인터페이스에 선택 필드 추가(관리자 화면 라벨용):
```ts
  sender_label?: string | null;
  source?: string | null;
```

- [ ] **Step 3: 확인**

Run: `npx tsc --noEmit -p tsconfig.json && npm run test`
Expected: 오류 0, PASS

- [ ] **Step 4: 커밋**

```bash
git add "liv-clinic/src/app/api/chat/sessions/[id]/route.ts" liv-clinic/src/lib/chat/chatApi.ts
git commit -m "feat(chat): 세션 완료/완료 취소 동작 추가 — 방 보관·해제와 동기화

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 13: 미응답 확대 알림 실행기 + `/api/chat/ops` + Netlify 예약 함수

**Files:**
- Create: `liv-clinic/src/lib/chat/escalationRunner.ts`
- Create: `liv-clinic/src/app/api/chat/ops/route.ts`
- Create: `liv-clinic/netlify/functions/chat-ops.mts`

**Interfaces:**
- Consumes: `planEscalation`, `parseThresholds`(Task 7), `buildEscalationText`, `buildFeedLine`(Task 4), `resolveTarget`, `RELAY_SESSION_COLUMNS`(Task 9), `getStaffDirectory`, `mentionOf`(Task 2), `postSlackMessage`, `getSlackChannelId`(Task 3), `isBusinessHours`
- Produces: `runEscalations(now: Date): Promise<{ checked: number; escalated: number }>`, `pruneSlackEvents(now: Date): Promise<number>`; `POST /api/chat/ops` (Bearer `CHAT_OPS_SECRET`) → `{ ok: true, checked, escalated, pruned }` 또는 `{ ok: true, skipped: 'off_hours', pruned }`.

- [ ] **Step 1: `escalationRunner.ts`**

```ts
import 'server-only';
import { createChatAdminClient } from '@/lib/chat/db';
import { isBusinessHours } from '@/lib/chat/businessHours';
import { parseThresholds, planEscalation } from '@/lib/chat/escalation';
import { getSlackChannelId, isSlackRelayConfigured, postSlackMessage } from '@/lib/chat/slack';
import { getStaffDirectory, mentionOf } from '@/lib/chat/slackStaff';
import { RELAY_SESSION_COLUMNS, resolveTarget, type RelaySessionRow } from '@/lib/chat/slackRelay';
import { buildEscalationText, buildFeedLine } from '@/lib/chat/slackText';

// 3분마다 호출된다 (netlify/functions/chat-ops.mts → POST /api/chat/ops).
// 영업시간에만, 세션당 한 실행에 한 단계만, 조건부 UPDATE로 중복 알림 없이.

const BATCH = 20;
const EVENT_RETENTION_DAYS = 30;

type Candidate = RelaySessionRow & { awaiting_since: string; escalation_level: number };

export async function runEscalations(now: Date): Promise<{ checked: number; escalated: number }> {
  if (!isSlackRelayConfigured() || !isBusinessHours(now)) return { checked: 0, escalated: 0 };
  const admin = createChatAdminClient();
  const thresholds = parseThresholds(process.env.CHAT_ESCALATION_MINUTES);
  const staff = getStaffDirectory();
  const legacy = getSlackChannelId();

  const { data, error } = await admin
    .from('chat_sessions')
    .select(`${RELAY_SESSION_COLUMNS}, awaiting_since, escalation_level`)
    .eq('status', 'open')
    .is('resolved_at', null)
    .not('awaiting_since', 'is', null)
    .lt('escalation_level', 3)
    .not('slack_mode', 'is', null)
    .order('awaiting_since', { ascending: true })
    .limit(BATCH);
  if (error) {
    console.warn('[chat ops] candidate query failed:', error.code ?? 'unknown');
    return { checked: 0, escalated: 0 };
  }
  const rows = (data ?? []) as Candidate[];

  let escalated = 0;
  for (const s of rows) {
    const step = planEscalation(
      {
        awaitingSinceMs: Date.parse(s.awaiting_since),
        level: s.escalation_level,
        hasAssignee: Boolean(s.assigned_slack_user_id),
      },
      now.getTime(),
      thresholds
    );
    if (!step) continue;

    // 단계 선점 — 겹쳐 실행돼도 한 번만 알린다
    const { data: claimed } = await admin
      .from('chat_sessions')
      .update({ escalation_level: step.nextLevel })
      .eq('id', s.id)
      .eq('escalation_level', s.escalation_level)
      .select('id');
    if (!claimed || claimed.length === 0) continue;

    const assigneeMention = s.assigned_slack_user_id ? mentionOf(s.assigned_slack_user_id) : null;
    const mention = step.target === 'assignee' && assigneeMention ? assigneeMention : staff.mentionAll();
    const text = buildEscalationText({ level: step.nextLevel, minutes: step.minutes, mention, assigneeMention });

    const target = resolveTarget(s, legacy);
    if (target.mode === 'room') {
      await postSlackMessage({ text, channelId: target.channelId });
    } else if (target.mode === 'thread' && target.threadTs) {
      await postSlackMessage({
        text,
        channelId: target.channelId ?? undefined,
        threadTs: target.threadTs,
        replyBroadcast: step.nextLevel >= 2,
      });
    }
    if (step.feed && legacy) {
      await postSlackMessage({
        text: buildFeedLine({
          kind: 'escalated',
          visitorName: s.visitor_name,
          visitorLocale: s.visitor_locale,
          channelId: target.mode === 'room' ? target.channelId : null,
          at: now.toISOString(),
          minutes: step.minutes,
        }),
        channelId: legacy,
      });
    }
    escalated += 1;
  }
  return { checked: rows.length, escalated };
}

/** 처리 기록 정리 — Slack 재시도 창(수 분)보다 훨씬 긴 30일만 남긴다. */
export async function pruneSlackEvents(now: Date): Promise<number> {
  const admin = createChatAdminClient();
  const cutoff = new Date(now.getTime() - EVENT_RETENTION_DAYS * 86_400_000).toISOString();
  const { data, error } = await admin.from('chat_slack_events').delete().lt('received_at', cutoff).select('event_id');
  if (error) {
    console.warn('[chat ops] prune failed:', error.code ?? 'unknown');
    return 0;
  }
  return data?.length ?? 0;
}
```

- [ ] **Step 2: `app/api/chat/ops/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { isBusinessHours } from '@/lib/chat/businessHours';
import { pruneSlackEvents, runEscalations } from '@/lib/chat/escalationRunner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 운영 작업 라우트 — Netlify 예약 함수(chat-ops.mts)가 3분마다 호출한다.
 * 공유 시크릿(CHAT_OPS_SECRET)으로만 접근. 영업시간 밖에는 정리만 하고 즉시 끝난다.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CHAT_OPS_SECRET;
  if (!secret) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const pruned = await pruneSlackEvents(now);
  if (!isBusinessHours(now)) return NextResponse.json({ ok: true, skipped: 'off_hours', pruned });

  const result = await runEscalations(now);
  return NextResponse.json({ ok: true, ...result, pruned });
}
```

- [ ] **Step 3: `netlify/functions/chat-ops.mts`**

```ts
// 미응답 확대 알림 (Netlify Scheduled Function, 영업시간대 3분 간격).
// 예약 함수 한도가 30초라 여기서는 fetch 1발만 하고 실제 처리는 POST /api/chat/ops 가 한다.
// 스케줄은 UTC: 1-10시 = KST 10:00~19:59, 월~토. 영업시간 판정은 라우트가 다시 한다(토요일 16시 이후 등).
// 타입 주의: tsconfig가 **/*.mts를 타입체크하므로 @netlify/functions 타입 import를 쓰지 않는다 (keepwarm.mts와 동일).

const SITE_URL = process.env.URL ?? 'https://liv-clinic.net';

const chatOps = async () => {
  const secret = process.env.CHAT_OPS_SECRET;
  if (!secret) {
    console.warn('[chat-ops] CHAT_OPS_SECRET not set — skipping');
    return;
  }
  try {
    const res = await fetch(`${SITE_URL}/api/chat/ops`, {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}`, 'user-agent': 'liv-chat-ops/1.0' },
      signal: AbortSignal.timeout(25_000),
    });
    console.log(`[chat-ops] -> ${res.status} ${await res.text()}`);
  } catch (e) {
    console.warn('[chat-ops] failed:', e instanceof Error ? e.message : e);
  }
};

export default chatOps;

export const config = { schedule: '*/3 1-10 * * 1-6' };
```

- [ ] **Step 4: 확인**

Run: `npx tsc --noEmit -p tsconfig.json && npm run test && npm run lint`
Expected: 오류 0, PASS, lint 0 errors

- [ ] **Step 5: 커밋**

```bash
git add liv-clinic/src/lib/chat/escalationRunner.ts liv-clinic/src/app/api/chat/ops/route.ts liv-clinic/netlify/functions/chat-ops.mts
git commit -m "feat(chat): 미응답 확대 알림 3분 크론 — 담당자 → 전원 → 피드 🚨

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---
### Task 14: 번역 말투 — 직원 답장을 친근하게 (`translation.ts`)

**Files:**
- Modify: `liv-clinic/src/lib/chat/translation.ts` (`buildSystemPrompt` export + 규칙 3 교체)
- Modify: `liv-clinic/src/lib/chat/__tests__/translation.test.ts` (케이스 추가)

> ⚠️ 이 파일은 현재 **모델 교체 작업의 미커밋 변경**이 있을 수 있다(`git status`에 `M translation.ts`). 그 변경이 다른 브랜치에서 커밋·머지된 뒤 이 태스크를 실행한다. 미커밋 상태라면 원장님에게 확인한다.

**Interfaces:**
- Produces: `buildSystemPrompt(from: SupportedLang, to: SupportedLang): string` (export). ko→외국어 프롬프트 규칙 3이 친근한 말투 지시로 바뀐다. 외국어→ko는 불변.

- [ ] **Step 1: 실패하는 테스트 추가**

`translation.test.ts` import에 `buildSystemPrompt`를 추가하고 파일 끝에:
```ts
describe('buildSystemPrompt — 말투 (원장님 요청 2026-09-03)', () => {
  it('한국어 → 손님 언어는 따뜻하고 친근한 안내 데스크 말투를 지시한다', () => {
    const p = buildSystemPrompt('ko', 'en');
    expect(p).toContain('warm, friendly and welcoming');
    expect(p).toContain('Do not add greetings, emojis, or any sentence that is not in the source');
    expect(p).toContain('English');
  });
  it('손님 언어 → 한국어(직원이 읽는 쪽)는 그대로 ~합니다체', () => {
    const p = buildSystemPrompt('en', 'ko');
    expect(p).not.toContain('warm, friendly');
    expect(p).toContain('~합니다체');
  });
  it('브랜드 보존 규칙은 양방향에 남아 있다', () => {
    expect(buildSystemPrompt('ko', 'ja')).toContain('Ulthera');
    expect(buildSystemPrompt('ja', 'ko')).toContain('울쎄라');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/chat/__tests__/translation.test.ts`
Expected: FAIL — `buildSystemPrompt` export 없음

- [ ] **Step 3: 구현**

`function buildSystemPrompt(` → `export function buildSystemPrompt(`. ko→외국어 분기(두 번째 return)의 규칙 3 한 줄을 교체:

```ts
    `3. Tone: warm, friendly and welcoming, like a caring front-desk consultant speaking to a guest. Stay polite and respectful in the natural courteous register of ${LANG_NAMES[to]}. Convey warmth through word choice and natural phrasing only. Do not add greetings, emojis, or any sentence that is not in the source, and keep every fact, number, and price exactly as written.`,
```
(기존: `` `3. Maintain a polite, professional tone suitable for a medical clinic.`, ``)

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/chat/__tests__/translation.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add liv-clinic/src/lib/chat/translation.ts liv-clinic/src/lib/chat/__tests__/translation.test.ts
git commit -m "feat(chat): 직원 답장 번역을 친근한 안내 데스크 말투로

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 15: 관리자 화면 — 탭·담당·완료 버튼·KST·작성자 라벨

**Files:**
- Modify: `liv-clinic/src/app/admin/(authenticated)/chat/page.tsx`
- Modify: `liv-clinic/src/app/admin/(authenticated)/chat/[sessionId]/page.tsx`
- Modify: `liv-clinic/src/app/admin/(authenticated)/chat/[sessionId]/ChatDetailClient.tsx`

**Interfaces:**
- Consumes: `resolveSession`, `unresolveSession`, `closeSession`, `ChatMessage.sender_label/source` (Task 12)
- 문구는 쉬운 한국어. 컴포넌트 단위 테스트는 이 리포에 없다 — `tsc`·`lint`·`npm run dev` 수동 확인.

- [ ] **Step 1: 목록 페이지 `page.tsx`**

`SessionRow`에 추가: `assigned_label: string | null; resolved_at: string | null;`

`loadSessions`를 탭 3개로:
```ts
type Tab = 'open' | 'resolved' | 'closed';

async function loadSessions(tab: Tab): Promise<SessionRow[]> {
  const admin = createChatAdminClient();
  let query = admin
    .from('chat_sessions')
    .select(
      'id, visitor_locale, visitor_name, visitor_email, visitor_messenger_channel, visitor_messenger_handle, status, last_message_at, unread_admin_count, created_at, assigned_label, resolved_at'
    );
  if (tab === 'open') query = query.eq('status', 'open').is('resolved_at', null);
  else if (tab === 'resolved') query = query.eq('status', 'open').not('resolved_at', 'is', null);
  else query = query.eq('status', 'closed');
  const { data, error } = await query
    .order('unread_admin_count', { ascending: false })
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(100);
  if (error) {
    console.error('[admin/chat] list failed:', error);
    return [];
  }
  return (data ?? []) as SessionRow[];
}
```
페이지 컴포넌트에서 `const status = …` 두 줄을:
```ts
  const tab: Tab = sp.status === 'closed' ? 'closed' : sp.status === 'resolved' ? 'resolved' : 'open';
  const sessions = await loadSessions(tab);
```
탭 링크 3개 (기존 2개 링크를 교체):
```tsx
        <div className="flex gap-2 text-sm">
          {(
            [
              ['open', '진행 중'],
              ['resolved', '완료'],
              ['closed', '종료'],
            ] as const
          ).map(([key, label]) => (
            <Link
              key={key}
              href={`/admin/chat?status=${key}`}
              className={`px-3 inline-flex items-center min-h-[40px] rounded-md ${
                tab === key ? 'bg-[#b4988d] text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
```
빈 상태 문구: `tab === 'open' ? '진행 중인 대화가 없습니다.' : tab === 'resolved' ? '완료한 대화가 없습니다.' : '종료된 대화가 없습니다.'`
행의 오른쪽 열(`flex flex-col items-end gap-1`) 맨 위에 담당 배지:
```tsx
                    {s.assigned_label && (
                      <span className="text-[11px] text-[#6d4e42] bg-[#b4988d]/10 rounded-full px-2 py-0.5 whitespace-nowrap">
                        담당 {s.assigned_label}
                      </span>
                    )}
```
`status` 변수를 쓰던 나머지 자리(`status === 'open'` 비교)는 전부 `tab`으로 바꾼다.

- [ ] **Step 2: 상세 서버 페이지 `[sessionId]/page.tsx`**

세션 select에 `, assigned_label, resolved_at` 추가. 메시지 select에 `, sender_label, source` 추가. `ChatDetailClient`에 넘기는 session 객체에:
```ts
        assigned_label: session.assigned_label,
        resolved_at: session.resolved_at,
```

- [ ] **Step 3: `ChatDetailClient.tsx`**

(a) `SessionMeta`에 `assigned_label: string | null; resolved_at: string | null;` 추가. import에 `resolveSession, unresolveSession` 추가.

(b) `formatTime`을 KST 고정으로:
```ts
function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', { hour12: false, timeZone: 'Asia/Seoul' });
}
```

(c) state 추가 (기존 `sessionStatus` 아래):
```ts
  const [assignedLabel, setAssignedLabel] = useState<string | null>(session.assigned_label);
  const [resolvedAt, setResolvedAt] = useState<string | null>(session.resolved_at);
  const [resolving, setResolving] = useState(false);
```

(d) Realtime 구독 체인에 세션 UPDATE 리스너 추가 (두 번째 `.on(` 뒤, `.subscribe()` 앞):
```ts
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_sessions', filter: `id=eq.${session.id}` },
        (payload) => {
          const s = payload.new as { status?: SessionMeta['status']; assigned_label?: string | null; resolved_at?: string | null };
          if (s.status) setSessionStatus(s.status);
          setAssignedLabel(s.assigned_label ?? null);
          setResolvedAt(s.resolved_at ?? null);
        }
      )
```

(e) 핸들러 추가 (`handleClose` 아래). 기존 `handleClose`의 confirm 문구는 그대로 두되 버튼 라벨만 바꾼다:
```ts
  const handleResolve = async () => {
    if (
      !window.confirm(
        '이 상담을 완료로 표시할까요?\nSlack에서는 이 손님의 방이 보관함으로 들어가고, 대화 기록은 이 화면에 그대로 남습니다.\n손님에게는 아무 메시지도 가지 않습니다.'
      )
    )
      return;
    setResolving(true);
    setError(null);
    try {
      await resolveSession(session.id);
      setResolvedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof ChatApiError ? `완료 처리 실패: ${err.code}` : '완료 처리 실패');
    } finally {
      setResolving(false);
    }
  };

  const handleUnresolve = async () => {
    setResolving(true);
    setError(null);
    try {
      await unresolveSession(session.id);
      setResolvedAt(null);
    } catch (err) {
      setError(err instanceof ChatApiError ? `완료 취소 실패: ${err.code}` : '완료 취소 실패');
    } finally {
      setResolving(false);
    }
  };
```

(f) 헤더 — 이메일 줄 아래에 담당 표시:
```tsx
              <div className="text-xs text-gray-500 mt-0.5">
                담당: {assignedLabel ?? '미정'}
              </div>
```

(g) 헤더 오른쪽 버튼 영역을 교체:
```tsx
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`text-xs px-2 py-1 rounded-md whitespace-nowrap ${
                  sessionStatus !== 'open'
                    ? 'bg-gray-100 text-gray-500'
                    : resolvedAt
                    ? 'bg-[#b4988d]/10 text-[#6d4e42] border border-[#b4988d]/30'
                    : 'bg-green-50 text-green-700 border border-green-100'
                }`}
              >
                {sessionStatus !== 'open' ? '종료' : resolvedAt ? '완료' : '진행 중'}
              </span>
              {sessionStatus === 'open' && !resolvedAt && (
                <button
                  type="button"
                  onClick={() => void handleResolve()}
                  disabled={resolving}
                  className="text-xs px-3 min-h-[32px] rounded-md bg-[#b4988d] text-white hover:bg-[#a3877d] disabled:opacity-50 transition whitespace-nowrap"
                >
                  {resolving ? '처리 중...' : '완료 처리'}
                </button>
              )}
              {sessionStatus === 'open' && resolvedAt && (
                <button
                  type="button"
                  onClick={() => void handleUnresolve()}
                  disabled={resolving}
                  className="text-xs px-3 min-h-[32px] rounded-md border border-[#b4988d] text-[#6d4e42] hover:bg-[#b4988d]/10 disabled:opacity-50 transition whitespace-nowrap"
                >
                  {resolving ? '처리 중...' : '완료 취소'}
                </button>
              )}
              {sessionStatus === 'open' && (
                <button
                  type="button"
                  onClick={() => void handleClose()}
                  disabled={closing}
                  className="text-xs px-3 min-h-[32px] rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition whitespace-nowrap"
                >
                  {closing ? '보내는 중...' : '상담 종료 안내 보내기'}
                </button>
              )}
            </div>
```

(h) `AdminMessageRow`의 시각 줄(`<div className="mt-0.5 text-[10px] text-gray-400">{formatTime(message.created_at)}</div>`)을 작성자 라벨 포함으로 교체:
```tsx
      <div className="mt-0.5 text-[10px] text-gray-400">
        {isOperator && (
          <span className="mr-1">
            {message.source === 'auto'
              ? '자동 안내'
              : message.source === 'slack'
              ? `Slack · ${message.sender_label ?? 'Slack 직원'}`
              : '관리자 화면'}
            {' · '}
          </span>
        )}
        {formatTime(message.created_at)}
      </div>
```

- [ ] **Step 4: 확인**

Run: `npx tsc --noEmit -p tsconfig.json && npm run lint`
Expected: 오류 0
Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev` → `http://localhost:3000/admin/chat` 로그인 후 탭 3개·담당 배지·상세의 완료 처리/완료 취소/상담 종료 안내 버튼·말풍선 라벨을 눈으로 확인. 시각이 KST로 보이는지(브라우저와 서버 렌더가 같은지 새로고침으로) 확인.

- [ ] **Step 5: 커밋**

```bash
git add "liv-clinic/src/app/admin/(authenticated)/chat/page.tsx" "liv-clinic/src/app/admin/(authenticated)/chat/[sessionId]/page.tsx" "liv-clinic/src/app/admin/(authenticated)/chat/[sessionId]/ChatDetailClient.tsx"
git commit -m "feat(admin): 채팅 상담 완료 탭·담당 표시·완료 처리 버튼·KST 시각·작성자 라벨

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 16: 환경변수 문서 + 전체 검증

**Files:**
- Modify: `liv-clinic/.env.example`

- [ ] **Step 1: `.env.example`에 Slack 구역 추가** (파일 끝)

```
# ========================================
# Slack 라이브채팅 릴레이 (서버 전용)
# ========================================
# 봇 토큰 (xoxb-…). 스코프: chat:write, groups:history, groups:write, groups:read
SLACK_BOT_TOKEN=xoxb-...
# Events API 서명 검증용
SLACK_SIGNING_SECRET=
# #해외문의 채널 ID — 새 문의/완료/재오픈/미응답 한 줄 피드 + 방 생성 실패 시 스레드 폴백
SLACK_CHANNEL_ID=
# 답변 직원 명단 "ID:이름,ID:이름" — 방 초대 + 멘션 + 담당 대상. 비우면 방을 만들지 않고 #해외문의 스레드 방식으로 동작(안전 스위치)
SLACK_STAFF=
# 관찰자 명단 (원장님 계정 등) — 방에 초대만 되고 멘션·담당 대상이 아니다. 형식은 SLACK_STAFF와 같다
SLACK_OBSERVERS=
# 손님별 채널 이름 접두어 (기본 chat). 한글 가능 여부는 첫날 시험
SLACK_ROOM_PREFIX=chat
# Slack API 호출 타임아웃(ms)
SLACK_POST_TIMEOUT_MS=5000
# 미응답 확대 알림 — netlify/functions/chat-ops.mts → POST /api/chat/ops 공유 시크릿. 비우면 503
CHAT_OPS_SECRET=
# 확대 알림 임계(분): 담당자 재멘션, 전원, 전원+피드 🚨
CHAT_ESCALATION_MINUTES=5,12,30
```

- [ ] **Step 2: 전체 검증**

```bash
npm run lint
npm run test
npm run verify:i18n
NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 npm run build
grep -rn "chat.delete" src netlify ; echo "(위 grep 결과가 비어 있어야 한다)"
```
Expected: lint 0 errors · 전체 테스트 PASS · verify:i18n 통과(로케일 JSON 무변경) · build exit 0 · `chat.delete` 0건

- [ ] **Step 3: 커밋**

```bash
git add liv-clinic/.env.example
git commit -m "docs(chat): Slack 방 모드·확대 알림 환경변수 문서화

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 17: 롤아웃 (사람이 하는 단계 — 코드 없음)

**Files:** 없음. 절차는 `docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md`(원장님용)와 스펙 §9를 따른다.

- [ ] **Step 1: 원장님 사전 작업 확인** — 설정 안내 §1~§6 완료 여부(권한 2개, 이벤트 2개, 재설치, 워크스페이스 설정, 환경변수 4개 중 `SLACK_STAFF`·`SLACK_OBSERVERS`는 비움).
- [ ] **Step 2: 마이그레이션 적용** (원장님 승인 후): `NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/_db/run-sql.mjs supabase/migrations/040_chat_slack_rooms.sql --apply` → `COMMITTED` 확인.
- [ ] **Step 3: 브랜치 머지·배포**: `feature/chat-slack-rooms` → master 머지 → Netlify 배포 완료 확인(메모리 `netlify-deploy-observability` 참조 — 커밋 상태 없음, 폴링 필요).
- [ ] **Step 4: 스레드 모드 스모크** (`SLACK_STAFF` 비어 있음): 사이트 외국어 페이지에서 문의 1건 → `#해외문의` 스레드 정상, 손님에게 자동 안내 도착, Slack 스레드 답글 전달, 관리자 화면 KST·`자동 안내`/`Slack · 이름` 라벨.
- [ ] **Step 5: 방 모드 전환**: 원장님이 `SLACK_STAFF`·`SLACK_OBSERVERS` 입력 → Netlify 재배포 → 새 세션으로 문의 → 스펙 §9 확인표 전 항목.
- [ ] **Step 6: 첫날 확인 4가지** (설정 안내 §8) 결과를 원장님에게 보고. 한글 접두어 가능 여부, 봇 unarchive 동작, 휴대폰 멘션 푸시, 스레드 메모 미전달.
- [ ] **Step 7: 2주 후**: `slack-health-check.mjs`로 첫 답변 중앙값 재측정(G-7) → 2단계(카드·버튼·자주 쓰는 답변) 착수 판단.

---

## 스펙 대응표 (self-review)

| 스펙 | 태스크 |
|------|--------|
| §4.1 세 가지 자리 / `slack_mode` | 5, 9 |
| §4.2 방 생성(선점·이름·초대·주제·피드·폴백) | 6, 9 |
| §4.3 방 메시지·멘션 규칙·관찰자 제외·자동 안내 꼬리말 | 2, 4, 9 |
| §4.4 인바운드(본문 전달·스레드 메모·자동 담당·관찰자 예외·종료 재오픈·실패 알림·보관 이벤트) | 8, 9 |
| §4.5 완료/취소/종료 ↔ 보관/해제, 재발신 🔔 | 9, 12 |
| §4.6 미응답 확대 알림 | 7, 13 |
| §4.7 피드 4종 | 4, 9, 13 |
| §4.8 관리자 화면 | 12, 15 |
| §4.9 실패 매트릭스 | 3, 6, 9 |
| §4.10 자동 첫 안내 | 5(트리거), 10, 11 |
| §4.11 읽음 없음 | 설계 사실 — 코드 변경 없음 |
| §4.12 번역 말투 | 14 |
| §5 마이그레이션 040 | 5 |
| §6 Slack 앱·환경변수 | 16, 17 + 설정 안내 문서 |
| §8 테스트 | 각 태스크 Step 1 |
| §9 롤아웃 | 17 |
