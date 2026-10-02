# Slack 손님 방 알림 줄이기 (핵심 한 줄만) — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 손님 방의 `LIV 알림`에서 회색 설명 줄을 빼고 알림마다 큰 줄 하나만 올린다(답글 전달 실패의 사유만 남긴다). 시작 화면에서 이메일을 넣은 손님은 새 문의 알림에 초록 막대 한 줄로 알린다.

**Architecture:** 문구는 `slackText.ts`가 가진다 — 큰 줄을 돌려주는 함수(`roomFirstNoticeHeadline`·`escalationNoticeHeadline`·`contactNoticeHeadline`)와 짧은 이벤트 문장(`EVENT_HINT_SHORT`)을 더하고, 쓰는 곳이 없어지는 조각(`roomFirstNoticeParts`·`escalationNoticeParts`·`bareNote`)을 지운다. 모양은 `slackLook.ts`가 정한다 — 내부 `notice()`가 큰 줄만 받고, 설명 줄은 전달 실패만 넘긴다. 글자만 문구(`plainText` = `build…Text`)는 한 글자도 바꾸지 않는다.

**Tech Stack:** Next.js 16.1.1, TypeScript, Vitest 4(`environment: 'node'`), Slack `chat.postMessage`의 `attachments`(색 막대 = attachments 요소 하나, 그 안에 `section` 블록).

**Spec:** `docs/superpowers/specs/2026-10-02-slack-room-notice-trim-design.md` (원장님 승인 2026-10-02)

## Global Constraints

- **작업 위치**: 워크트리 `D:\dev\LIV_homepage-slack-rooms`, 브랜치 `feature/slack-room-look`(HEAD가 운영 master `67917f0` 위에 있다 — 이 계획의 커밋을 그 위에 쌓는다). 다른 브랜치로 체크아웃하지 않는다. 메인 폴더 `D:\dev\LIV_homepage`는 건드리지 않는다.
- **명령의 실행 위치**: **루트** = `D:/dev/LIV_homepage-slack-rooms`(git), **앱** = `D:/dev/LIV_homepage-slack-rooms/liv-clinic`(npm·npx). npm 명령을 루트에서 실행하지 않는다.
- **이 PC는 TLS 프록시 뒤다**: `npm run build`에는 `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 NODE_TLS_REJECT_UNAUTHORIZED=0`을 붙인다.
- **글자만 문구는 바뀌지 않는다**: `buildContactText`·`buildMessengerClickText`·`buildEventHintNote`·`buildEscalationText`·`buildRoomFirstText`·`buildRoomFirstNoticeText`·`buildDeliveryFailureText`가 내는 글자와 그 테스트 기대값을 건드리지 않는다. 이 문구가 `SLACK_ROOM_LOOK=off`이거나 꾸민 글이 거부됐을 때 올라가는 비상용이다.
- **`#해외문의` 피드 줄·스레드 방식 세션의 글은 그대로다**: `postFeed`, 스레드에 올리는 글자 문구.
- **멘션은 색 막대 안에 넣지 않는다**: 항상 최상위 `text`.
- **설명 줄(`context` 블록)이 남는 알림은 답글 전달 실패 하나뿐이다.**
- **운영에 닿는 일은 원장님 승인 뒤에만 한다**: master 푸시(= Netlify 배포). Task 1~3은 푸시하지 않는다.
- **검증 게이트**: `npx vitest run` · `npx tsc --noEmit` · 변경 파일만 `npx eslint <files>` · `npm run build`. 기준선(`67917f0`): 테스트 60파일 985건 통과.
- **커밋 메시지**: 한국어 `type(scope): 요약`, 끝에 `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. 그 과제의 파일만 `git add` 한다.

## 파일 구조

경로는 `liv-clinic/` 기준.

| 파일 | 책임 | 과제 |
|------|------|------|
| `src/lib/chat/slackText.ts` | 문구(순수). 큰 줄 함수 세 개와 `EVENT_HINT_SHORT`를 더하고, 안 쓰게 되는 조각을 지운다 | 1(더하기), 2(지우기) |
| `src/lib/chat/slackLook.ts` | 방 안의 글 모양(순수). 알림은 큰 줄만, 시작 화면 이메일은 초록 막대 | 2 |
| `src/lib/chat/slackRelay.ts` | 첫 알림을 만들 때 `contactEmail`을 넘긴다(한 곳) | 2 |
| (루트) `docs/superpowers/specs/*.md` | 직원 사용법, 예전 설계서의 개정 표시, 이 설계서의 구현 상태 | 3 |

테스트(모두 `src/lib/chat/__tests__/`): `slackText.test.ts`, `slackLook.test.ts`, `slackRelay.test.ts`, `escalationRunner.test.ts`.

---

### Task 1: 큰 줄 함수와 짧은 이벤트 문장 — `slackText.ts`

**Files:**
- Modify: `liv-clinic/src/lib/chat/slackText.ts`
- Test: `liv-clinic/src/lib/chat/__tests__/slackText.test.ts`

**Interfaces:**
- Consumes: 기존 `escapeSlackText`, `formatKst`, `buildChatRefCode`
- Produces (모두 export):
  - `contactNoticeHeadline(channelLabel: string, handle: string): string` — `📱 *손님이 연락처를 남겼습니다* — {채널}: {연락처}`(연락처는 이스케이프)
  - `EVENT_HINT_SHORT: string` — `'이벤트 링크를 자동으로 보냈습니다'`
  - `roomFirstNoticeHeadline(args: { receivedAt: string; sessionId: string }): string`
  - `escalationNoticeHeadline(args: { level: 1 | 2 | 3; minutes: number }): string`
- 이 과제는 더하기만 한다. 예전 조각(`roomFirstNoticeParts`·`escalationNoticeParts`·`bareNote`)은 Task 2에서 지운다(그때까지 `slackLook.ts`가 쓴다).

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`slackText.test.ts`의 import 목록에 네 이름을 더한다:

```ts
  contactNoticeHeadline,
  escalationNoticeHeadline,
  EVENT_HINT_SHORT,
  roomFirstNoticeHeadline,
```

`describe('deliveryFailureParts — 전달 실패 알림의 조각', …)` 블록 **바로 뒤**에 다음을 넣는다:

```ts
// ── 큰 줄만 (스펙 2026-10-02 slack-room-notice-trim) — 손님 방의 색 막대에는 큰 줄 하나만 올린다 ─────────────

describe('contactNoticeHeadline — 연락처 알림의 큰 줄', () => {
  it('채널 이름과 연락처를 한 줄로', () => {
    expect(contactNoticeHeadline('이메일', 'guest@example.com')).toBe(
      '📱 *손님이 연락처를 남겼습니다* — 이메일: guest@example.com'
    );
  });
  it('연락처의 Slack 마크업을 이스케이프한다', () => {
    expect(contactNoticeHeadline('WeChat', '<!channel>')).toBe(
      '📱 *손님이 연락처를 남겼습니다* — WeChat: &lt;!channel&gt;'
    );
  });
  it('contactNoticeParts의 큰 줄과 같다', () => {
    expect(
      contactNoticeParts({ channelLabel: 'LINE', handle: 'x', adminUrl: null, mode: 'room', followup: true }).headline
    ).toBe(contactNoticeHeadline('LINE', 'x'));
  });
});

describe('EVENT_HINT_SHORT', () => {
  it('손님 방의 색 막대에 넣는 짧은 문장', () => {
    expect(EVENT_HINT_SHORT).toBe('이벤트 링크를 자동으로 보냈습니다');
  });
});

describe('roomFirstNoticeHeadline — 방의 첫 알림(새 문의)의 큰 줄', () => {
  it('접수 시각과 참조코드 (코드는 백틱으로 감싼다)', () => {
    expect(
      roomFirstNoticeHeadline({ receivedAt: '2026-10-01T07:40:00Z', sessionId: '40e56969-aaaa-bbbb-cccc-dddddddddddd' })
    ).toBe('*새 문의* · 📥 10/01(목) 16:40 KST · 참조코드 `#40E56969`');
  });
});

describe('escalationNoticeHeadline — 재촉 알림의 큰 줄 (멘션은 넣지 않는다)', () => {
  it('5분·12분은 ⏰', () => {
    expect(escalationNoticeHeadline({ level: 1, minutes: 5 })).toBe('⏰ *5분째 답이 없습니다.*');
    expect(escalationNoticeHeadline({ level: 2, minutes: 12 })).toBe('⏰ *12분째 답이 없습니다.*');
  });
  it('30분은 🚨', () => {
    expect(escalationNoticeHeadline({ level: 3, minutes: 30 })).toBe('🚨 *30분째 미응답입니다.*');
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/slackText.test.ts 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | tail -6`
Expected: FAIL — `Tests  7 failed | 77 passed (84)` (새 함수·상수가 아직 없다).

- [ ] **Step 3: 구현을 더한다**

`slackText.ts`에서 세 곳을 고친다.

(가) `contactNoticeParts` 바로 위(`export interface ContactNoticeArgs { … }` 다음)에 넣고, `contactNoticeParts`의 첫 줄이 이것을 쓰게 한다:

```ts
/** 연락처 알림의 큰 줄 — 📱 알림과, 시작 화면에서 이메일을 넣은 손님의 첫 알림(초록 막대)이 같이 쓴다. */
export function contactNoticeHeadline(channelLabel: string, handle: string): string {
  return `📱 *손님이 연락처를 남겼습니다* — ${channelLabel}: ${escapeSlackText(handle)}`;
}
```

`contactNoticeParts` 안의

```ts
  const headline = `📱 *손님이 연락처를 남겼습니다* — ${args.channelLabel}: ${escapeSlackText(args.handle)}`;
```

를 다음으로 바꾼다:

```ts
  const headline = contactNoticeHeadline(args.channelLabel, args.handle);
```

(나) `export const EVENT_HINT_SENTENCE = …;` 줄 **바로 아래**에 넣는다:

```ts
/** 손님 방의 색 막대에 넣는 짧은 문장 — 방의 알림은 큰 줄만 올린다 (스펙 2026-10-02 slack-room-notice-trim). 글자만 문구는 위 문장 그대로다. */
export const EVENT_HINT_SHORT = '이벤트 링크를 자동으로 보냈습니다';
```

(다) `roomFirstNoticeParts` 함수 **바로 아래**에 넣는다:

```ts
/**
 * 방의 첫 알림(새 문의)의 큰 줄 — 손님 방의 색 막대에는 이 한 줄만 올린다 (스펙 2026-10-02 slack-room-notice-trim).
 * 참조코드는 방 이름에서 빠졌으므로 여기와 방 주제에 남긴다(검색으로 방을 찾는다). 백틱 = 코드 글씨.
 */
export function roomFirstNoticeHeadline(args: { receivedAt: string; sessionId: string }): string {
  return `*새 문의* · 📥 ${formatKst(args.receivedAt)} · 참조코드 \`#${buildChatRefCode(args.sessionId)}\``;
}
```

(라) `escalationNoticeParts` 함수 **바로 아래**에 넣는다:

```ts
/**
 * 재촉 알림의 큰 줄 — 손님 방의 빨간 막대에는 이 한 줄만 올린다. 멘션은 넣지 않는다:
 * 막대 안의 멘션이 알림을 만드는지 확인하지 못했으므로 호출자가 최상위 text에 따로 둔다 (slack-room-look §3.3).
 */
export function escalationNoticeHeadline(args: { level: 1 | 2 | 3; minutes: number }): string {
  return args.level === 3 ? `🚨 *${args.minutes}분째 미응답입니다.*` : `⏰ *${args.minutes}분째 답이 없습니다.*`;
}
```

- [ ] **Step 4: 통과·전체 테스트·타입 검사·lint**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/slackText.test.ts 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | tail -4 && npx vitest run 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | tail -6 && npx tsc --noEmit && echo TSC-OK && npx eslint src/lib/chat/slackText.ts src/lib/chat/__tests__/slackText.test.ts && echo LINT-OK
```
Expected: `Tests  84 passed (84)`, 이어서 `Test Files  60 passed (60)`, `Tests  992 passed (992)`, `TSC-OK`, `LINT-OK`. 기존 `contactNoticeParts`·`build…Text` 기대값이 그대로 통과하는 것이 "글자만 문구가 안 바뀌었다"는 증거다.

- [ ] **Step 5: 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git add liv-clinic/src/lib/chat/slackText.ts liv-clinic/src/lib/chat/__tests__/slackText.test.ts && git commit -m "feat(chat): 방 알림의 큰 줄 함수와 짧은 이벤트 문장 — 알림 줄이기 준비" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: 방의 알림은 큰 줄만, 시작 화면 이메일은 초록 막대 — `slackLook.ts`·`slackRelay.ts`

**Files:**
- Modify: `liv-clinic/src/lib/chat/slackLook.ts`, `liv-clinic/src/lib/chat/slackRelay.ts`(`postInRoom`의 첫 알림 호출), `liv-clinic/src/lib/chat/slackText.ts`(안 쓰게 되는 조각 삭제)
- Test: `liv-clinic/src/lib/chat/__tests__/slackLook.test.ts`, `slackRelay.test.ts`, `escalationRunner.test.ts`, `slackText.test.ts`

**Interfaces:**
- Consumes: Task 1의 `contactNoticeHeadline`·`EVENT_HINT_SHORT`·`roomFirstNoticeHeadline`·`escalationNoticeHeadline`, 기존 `staffChannelLabel`·`messengerClickParts`·`deliveryFailureParts`
- Produces:
  - `styledRoomFirstNotice(args: RoomFirstNoticeArgs & { contactEmail?: string | null }): StyledMessage` — `contactEmail`이 있으면 `attachments`가 두 개(회색 새 문의 + 초록 연락처)
  - 그 밖의 `styled…` 함수는 인자와 `plainText`가 그대로이고, `attachments[0].blocks`가 `section` 하나뿐이다(`styledDeliveryFailure`만 `context`가 남는다)
  - `slackText.ts`에서 없어지는 export: `bareNote`, `roomFirstNoticeParts`, `escalationNoticeParts`

- [ ] **Step 1: 테스트를 바꾼다**

**(가) `slackLook.test.ts`** — `describe('알림 (2·4·8·9·10·11·12·13) — LIV 알림 + 색 막대', …)` 안의 여섯 건을 아래로 바꾼다(제목이 같은 자리의 테스트를 통째로 교체).

`'첫 알림: 회색, 큰 줄에 접수 시각과 참조코드'`와 `'첫 알림: 연락처 꼬리말이 있으면 설명이 세 줄'` 두 건 →

```ts
  it('첫 알림: 회색, 큰 줄 하나 — 접수 시각과 참조코드 (설명 줄 없음)', () => {
    const m = styledRoomFirstNotice({ sessionId: SESSION_ID, receivedAt: AT });
    expect(m.username).toBe('LIV 알림');
    expect(m.iconEmoji).toBe(':bell:');
    expect(m.text).toBe('');
    expect(m.attachments).toEqual([
      {
        color: BAR_COLOR.info,
        fallback: '새 문의 · 📥 10/01(목) 16:40 KST · 참조코드 #40E56969',
        blocks: [
          { type: 'section', text: { type: 'mrkdwn', text: '*새 문의* · 📥 10/01(목) 16:40 KST · 참조코드 `#40E56969`' } },
        ],
      },
    ]);
    expect(m.plainText).toBe(buildRoomFirstNoticeText({ sessionId: SESSION_ID, receivedAt: AT }));
  });
  it('첫 알림: 시작 화면에서 이메일을 넣은 손님이면 초록 막대 한 줄이 따라붙는다', () => {
    const args = { sessionId: SESSION_ID, receivedAt: AT, contactNote: ROOM_EMAIL_CONTACT_NOTE };
    const m = styledRoomFirstNotice({ ...args, contactEmail: 'yuki.t@example.com' });
    expect(m.attachments).toHaveLength(2);
    expect(m.attachments![0].color).toBe(BAR_COLOR.info);
    expect(m.attachments![1]).toEqual({
      color: BAR_COLOR.contact,
      fallback: '📱 손님이 연락처를 남겼습니다 — 이메일: yuki.t@example.com',
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: '📱 *손님이 연락처를 남겼습니다* — 이메일: yuki.t@example.com' },
        },
      ],
    });
    // 글자만 문구에는 지금까지의 꼬리말이 그대로 붙는다
    expect(m.plainText).toBe(buildRoomFirstNoticeText(args));
    expect(m.plainText.endsWith(ROOM_EMAIL_CONTACT_NOTE)).toBe(true);
  });
```

`'연락처 남김: 초록, 설명 세 줄(기울임 없음)'` →

```ts
  it('연락처 남김: 초록, 큰 줄만 (설명은 글자만 문구에만 남는다)', () => {
    const args = { channelLabel: '이메일', handle: 'yuki.t@example.com', mode: 'room' as const, followup: true, adminUrl: null };
    const m = styledContactNotice(args);
    expect(m).toMatchObject({ ...NOTICE_LOOK, text: '', plainText: buildContactText(args) });
    expect(m.attachments![0].color).toBe(BAR_COLOR.contact);
    expect(m.attachments![0].blocks).toEqual([
      { type: 'section', text: { type: 'mrkdwn', text: '📱 *손님이 연락처를 남겼습니다* — 이메일: yuki.t@example.com' } },
    ]);
    expect(m.plainText).toContain("_'오늘 연락할 손님'으로 분류했습니다");
  });
```

`'병원 연락 단추: 초록, 번역본 안내는 설명 줄'` →

```ts
  it('병원 연락 단추: 초록, 큰 줄만 (번역본 안내는 글자만 문구에만 남는다)', () => {
    const args = { channel: 'whatsapp' as const, sessionId: SESSION_ID, copyHint: true };
    const m = styledMessengerClick(args);
    expect(m.attachments![0].color).toBe(BAR_COLOR.contact);
    expect(m.attachments![0].blocks).toEqual([
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '📲 손님이 WhatsApp으로 이어가기를 눌렀습니다 — 병원 WhatsApp에서 코드 #40E56969 가 담긴 메시지를 확인해 주세요.',
        },
      },
    ]);
    expect(m.plainText).toBe(buildMessengerClickText(args));
    expect(m.plainText).toContain('번역본이 아래에 올라옵니다');
  });
```

`'이벤트 링크 안내: 회색, 문장 다음 줄에 링크'` →

```ts
  it('이벤트 링크 안내: 회색, 짧은 문장 다음 줄에 링크', () => {
    const url = 'https://liv-clinic.net/ja/events/2026-10-promotion';
    const m = styledEventHint(url);
    expect(m.attachments![0].color).toBe(BAR_COLOR.info);
    expect(m.attachments![0].blocks).toEqual([
      { type: 'section', text: { type: 'mrkdwn', text: `🎁 이벤트 링크를 자동으로 보냈습니다\n${url}` } },
    ]);
    expect(m.plainText).toBe(buildEventHintNote(url));
  });
```

`'12분 재촉: 담당자가 답하지 않았다는 사유가 설명 줄'` →

```ts
  it('12분 재촉: 큰 줄만 — 담당자가 답하지 않았다는 사유는 글자만 문구에만 남는다', () => {
    const args = { level: 2 as const, minutes: 12, mention: '<@U1> <@U2>', assigneeMention: '<@U1>' };
    const m = styledEscalation(args);
    expect(m.text).toBe('<@U1> <@U2>');
    expect(m.attachments![0].blocks).toEqual([
      { type: 'section', text: { type: 'mrkdwn', text: '⏰ *12분째 답이 없습니다.*' } },
    ]);
    expect(m.plainText).toBe(buildEscalationText(args));
    expect(m.plainText).toContain('담당 <@U1> 님이 응답하지 않아 전원에게 알립니다.');
  });
```

`'전달 실패: 빨강, 사유는 설명 줄'`은 그대로 둔다(사유가 남는다는 것을 고정한다).

**(나) `slackRelay.test.ts`**

1. import 줄에서 `bareNote`와 `ROOM_EMAIL_CONTACT_NOTE`를 뺀다:

```ts
import { buildRoomFirstText, ROOM_REOPENED_LEAD } from '../slackText';
```

2. `describe('relayContactToSlack — 연락처 알림', …)`의 첫 테스트 제목과 막대 기대값:

```ts
  it('방: LIV 알림의 초록 막대(큰 줄만)를 방에, 피드에 "연락처 남김" 한 줄', async () => {
    adminFor(ROOM_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'email', handle: 'guest@example.com' });

    expect(postMock).toHaveBeenCalledTimes(2);
    const room = postMock.mock.calls[0][0];
    expect(room).toMatchObject({ channelId: 'C0ROOM', username: 'LIV 알림', iconEmoji: ':bell:', text: '' });
    // 설명 줄 없이 큰 줄 하나 (slack-room-notice-trim)
    expect(barOf(room)).toEqual({
      color: BAR_COLOR.contact,
      headline: '📱 *손님이 연락처를 남겼습니다* — 이메일: guest@example.com',
      notes: [],
    });
    const feed = postMock.mock.calls[1][0];
    expect(feed.channelId).toBe('C0FEED');
    expect(feed.text.startsWith('📋 연락처 남김 · 🇨🇳 익명 · 이메일 · <#C0ROOM> · ')).toBe(true);
    expect(feed.username).toBeUndefined();
  });
```

3. 같은 묶음의 `'CHAT_FOLLOWUP=off 면 분류 안내 대신 연락 요청만 남긴다'` →

```ts
  it('CHAT_FOLLOWUP=off 여도 방의 막대는 큰 줄만이다', async () => {
    process.env.CHAT_FOLLOWUP = 'off';
    adminFor(ROOM_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'email', handle: 'guest@example.com' });
    expect(barOf(postMock.mock.calls[0][0])).toEqual({
      color: BAR_COLOR.contact,
      headline: '📱 *손님이 연락처를 남겼습니다* — 이메일: guest@example.com',
      notes: [],
    });
  });
```

4. `'단추 클릭: 방에 LIV 알림의 초록 막대 (번역본 안내는 설명 줄)'` — 제목을 `'단추 클릭: 방에 LIV 알림의 초록 막대 (큰 줄만)'`로, 기대값의 `notes`를 `[]`로:

```ts
      notes: [],
```

5. `'이벤트 안내: 방에 LIV 알림의 회색 막대 (문장 다음 줄에 링크)'` — 제목을 `'이벤트 안내: 방에 LIV 알림의 회색 막대 (짧은 문장 다음 줄에 링크)'`로, 기대값의 `headline`을:

```ts
      headline: `🎁 이벤트 링크를 자동으로 보냈습니다\n${url}`,
```

6. `describe('relayChatMessageToSlack — 방의 첫 글: 손님 글과 새 문의 알림', …)`에서 `noticeNotes` 도우미를 다음으로 바꾼다:

```ts
  /** n번째 게시(새 문의 알림)의 막대들 — 색, 큰 줄, 블록 수(1 = 설명 줄 없음) */
  const noticeBars = (call: number) =>
    postMock.mock.calls[call][0].attachments!.map((a) => ({
      color: a.color,
      headline: (a.blocks[0].text as { text: string }).text,
      blocks: a.blocks.length,
    }));
  const NEW_INQUIRY_BAR = {
    color: BAR_COLOR.info,
    headline: '*새 문의* · 📥 10/05(월) 12:00 KST · 참조코드 `#5B0C7C1A`',
    blocks: 1,
  };
```

그 묶음의 다섯 군데를 고친다:

- 첫 테스트(`'손님 글(손님 이름표) → 새 문의 알림(LIV 알림, 회색 막대) → 피드 줄 순으로 올린다'`)의 `expect(noticeNotes(1)).toHaveLength(2);` →

```ts
    // 설명 줄 없이 큰 줄 하나 (slack-room-notice-trim)
    expect(noticeBars(1)).toEqual([NEW_INQUIRY_BAR]);
```

- `'시작 화면에서 이메일을 넣은 손님: 알림의 설명에 연락처 꼬리말이 한 줄 더 붙는다'` 테스트 전체 →

```ts
  it('시작 화면에서 이메일을 넣은 손님: 새 문의 알림에 초록 막대 한 줄(연락처)이 따라붙는다', async () => {
    adminFor({ ...UNASSIGNED_ROW, visitor_email: 'guest@example.com' });
    await relayChatMessageToSlack(FIRST);
    // 손님 글, 알림(막대 두 개), 피드 줄 — 게시 횟수는 늘지 않는다
    expect(postMock).toHaveBeenCalledTimes(3);
    expect(postMock.mock.calls[0][0].text).toBe(VISITOR_TEXT);
    expect(noticeBars(1)).toEqual([
      NEW_INQUIRY_BAR,
      { color: BAR_COLOR.contact, headline: '📱 *손님이 연락처를 남겼습니다* — 이메일: guest@example.com', blocks: 1 },
    ]);
  });
```

- `'이메일이 없는 손님에게는 붙지 않는다'`의 기대 줄 → `expect(noticeBars(1)).toEqual([NEW_INQUIRY_BAR]);`
- `'이 글에서 방금 이메일이 저장됐으면(📱 알림이 뒤따른다) 붙이지 않는다'`의 기대 줄 → `expect(noticeBars(1)).toEqual([NEW_INQUIRY_BAR]);`
- `'CHAT_FOLLOWUP=off 면 붙이지 않는다'`의 기대 줄 → `expect(noticeBars(1)).toEqual([NEW_INQUIRY_BAR]);`

**(다) `escalationRunner.test.ts`** — `'12분: 담당자가 답하지 않았다는 사유가 막대의 설명 줄로 붙는다'`의 제목과 블록 기대값:

```ts
  it('12분: 방에는 큰 줄만 올린다 (담당자가 답하지 않았다는 사유는 넣지 않는다)', async () => {
```

```ts
    expect(post.attachments![0].blocks).toEqual([
      { type: 'section', text: { type: 'mrkdwn', text: '⏰ *12분째 답이 없습니다.*' } },
    ]);
```

**(라) `slackText.test.ts`** — 지워질 조각의 테스트를 정리한다.

- import 목록에서 `bareNote`, `escalationNoticeParts`, `roomFirstNoticeParts`를 뺀다.
- `describe('bareNote — 기울임 표시를 벗긴다', …)` 블록을 통째로 지운다.
- `describe('roomFirstNoticeParts — 방의 첫 알림(새 문의)', …)` 블록을 다음으로 바꾼다(글자만 문구 테스트만 남긴다):

```ts
describe('buildRoomFirstNoticeText — 첫 알림의 글자만 문구', () => {
  const base = { receivedAt: '2026-10-01T07:40:00Z', sessionId: '40e56969-aaaa-bbbb-cccc-dddddddddddd' };

  it('🔴 머리 + 기울임 설명 (꾸민 알림이 거부됐을 때만 쓴다)', () => {
    expect(buildRoomFirstNoticeText(base)).toBe(
      `🔴 *새 문의* · 📥 10/01(목) 16:40 KST · 참조코드 #40E56969\n${ROOM_FOOTER}\n${ROOM_AUTO_ACK_NOTE}`
    );
    expect(buildRoomFirstNoticeText({ ...base, contactNote: ROOM_EMAIL_CONTACT_NOTE }).endsWith(ROOM_EMAIL_CONTACT_NOTE)).toBe(
      true
    );
  });
});
```

- `describe('escalationNoticeParts — 재촉 알림의 조각 (멘션은 넣지 않는다)', …)` 블록을 통째로 지운다(Task 1의 `escalationNoticeHeadline` 테스트가 대신한다).
- 그 구역 머리의 주석 두 줄(`// ── 큰 줄 + 설명 줄 (스펙 2026-10-01 …` / `// 같은 문장을 글자만 올리는 …`)을 다음으로 바꾼다:

```ts
// ── 알림의 조각 (스펙 2026-10-01 slack-room-look §3.4) — 글자만 문구가 큰 줄과 설명 줄을 이어 붙인다 ─────────
// 손님 방의 색 막대에는 큰 줄만 올린다(2026-10-02 slack-room-notice-trim). 설명 줄은 글자만 문구에 남는다.
```

- [ ] **Step 2: 실패를 확인한다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/slackLook.test.ts src/lib/chat/__tests__/slackRelay.test.ts src/lib/chat/__tests__/escalationRunner.test.ts src/lib/chat/__tests__/slackText.test.ts 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -E "^ FAIL|Test Files|Tests "`
Expected: FAIL — `slackLook` 6건(첫 알림 두 건, 연락처, 단추, 이벤트, 12분), `slackRelay` 9건(연락처 두 건, 단추, 이벤트, 방의 첫 글 다섯 건 — 막대의 블록 수가 아직 2다), `escalationRunner` 1건. `slackText`는 전부 통과(77건). 합계 `Tests  16 failed | 163 passed (179)`.

- [ ] **Step 3: 구현을 바꾼다**

**(가) `slackLook.ts`**

import 목록을 다음으로 바꾼다(`contactNoticeParts`·`escalationNoticeParts`·`EVENT_HINT_SENTENCE`·`roomFirstNoticeParts`가 빠지고 다섯 이름이 들어온다):

```ts
import {
  buildBodyLines,
  buildContactText,
  buildDeliveryFailureText,
  buildEscalationText,
  buildEventHintNote,
  buildFeedReplyMirrorText,
  buildMessengerClickText,
  buildReplyText,
  buildRoomFirstNoticeText,
  buildRoomFirstText,
  buildRoomVisitorText,
  buildTranslationCopyText,
  contactNoticeHeadline,
  deliveryFailureParts,
  escalationNoticeHeadline,
  EVENT_HINT_SHORT,
  localeKoName,
  messengerClickParts,
  ROOM_REOPENED_LEAD,
  roomFirstNoticeHeadline,
  staffChannelLabel,
  type ContactNoticeArgs,
  type MessengerClickArgs,
  type NoticeParts,
  type RoomFirstNoticeArgs,
} from '@/lib/chat/slackText';
```

파일 머리 주석의 마지막 줄(`// 손님 글에는 막대를 붙이지 않는다 — …`) 아래에 두 줄을 더한다:

```ts
// 알림(LIV 알림)의 색 막대에는 큰 줄만 넣는다 (스펙 2026-10-02 slack-room-notice-trim) — 설명 줄은 방에서 뺐다.
// 예외는 답글 전달 실패의 사유 한 줄. 글자만 문구(plainText)는 예전 문구 그대로라 설명이 남아 있다.
```

`notice` 함수를 다음으로 바꾼다:

```ts
/** LIV 알림 하나 = 색 막대 하나에 큰 줄 하나. notes(작은 회색 설명)는 전달 실패의 사유만 넘긴다. */
function notice(
  kind: BarKind,
  headline: string,
  plainText: string,
  opts: { text?: string; notes?: string[] } = {}
): StyledMessage {
  return {
    ...NOTICE_LOOK,
    text: opts.text ?? '',
    attachments: [bar(kind, { headline, notes: opts.notes ?? [] })],
    plainText,
  };
}
```

`styledRoomFirstVisitor`의 `contactNote` 주석을 고친다:

```ts
    /** 연락처가 이미 있는 손님이면 ROOM_EMAIL_CONTACT_NOTE — 꾸민 글에서는 첫 알림에 초록 막대(연락처)로 붙는다 */
```

`styledRoomFirstNotice`를 다음으로 바꾼다:

```ts
/**
 * 첫 손님 글 바로 뒤의 새 문의 알림 — 접수 시각·참조코드 한 줄.
 * contactEmail(시작 화면에서 이메일을 넣은 손님)이 있으면 같은 글에 초록 막대 한 줄을 더 단다 — 연락처는 언제나 초록 한 줄로 보인다.
 */
export function styledRoomFirstNotice(args: RoomFirstNoticeArgs & { contactEmail?: string | null }): StyledMessage {
  const msg = notice('info', roomFirstNoticeHeadline(args), buildRoomFirstNoticeText(args));
  if (!args.contactEmail) return msg;
  const contact = bar('contact', {
    headline: contactNoticeHeadline(staffChannelLabel('email'), args.contactEmail),
    notes: [],
  });
  return { ...msg, attachments: [...(msg.attachments ?? []), contact] };
}
```

`styledReopenedNotice`의 본문:

```ts
  return notice('info', ROOM_REOPENED_LEAD, ROOM_REOPENED_LEAD);
```

`// ── 알림 ──` 아래 다섯 함수를 다음으로 바꾼다:

```ts
export function styledContactNotice(args: ContactNoticeArgs): StyledMessage {
  return notice('contact', contactNoticeHeadline(args.channelLabel, args.handle), buildContactText(args));
}

export function styledMessengerClick(args: MessengerClickArgs): StyledMessage {
  return notice('contact', messengerClickParts(args).headline, buildMessengerClickText(args));
}

export function styledEventHint(url: string): StyledMessage {
  return notice('info', `🎁 ${EVENT_HINT_SHORT}\n${url}`, buildEventHintNote(url));
}

/** 재촉: 멘션은 최상위 text에(알림이 가야 한다), 문장은 빨간 막대에. */
export function styledEscalation(args: {
  level: 1 | 2 | 3;
  minutes: number;
  mention: string;
  assigneeMention: string | null;
}): StyledMessage {
  return notice('alert', escalationNoticeHeadline(args), buildEscalationText(args), { text: args.mention });
}

/** 전달 실패: 사유를 알아야 다시 보낼 수 있다 — 설명 줄을 남기는 유일한 알림. */
export function styledDeliveryFailure(reason: string): StyledMessage {
  const parts = deliveryFailureParts(reason);
  return notice('alert', parts.headline, buildDeliveryFailureText(reason), { notes: parts.notes });
}
```

**(나) `slackRelay.ts`** — `postInRoom`의 첫 알림 호출:

```ts
    if (firstInRoom) {
      await postRoomNotice(
        styledRoomFirstNotice({ sessionId: session.id, receivedAt, contactNote: firstContactNote(session, args) }),
        channelId,
        'first notice'
      );
    } else if (reopened) {
```

를 다음으로 바꾼다:

```ts
    if (firstInRoom) {
      // 시작 화면에서 이메일을 넣은 손님이면 알림에 초록 막대(연락처) 한 줄이 따라붙는다 (slack-room-notice-trim §2.3)
      const contactNote = firstContactNote(session, args);
      await postRoomNotice(
        styledRoomFirstNotice({
          sessionId: session.id,
          receivedAt,
          contactNote,
          contactEmail: contactNote ? session.visitor_email : null,
        }),
        channelId,
        'first notice'
      );
    } else if (reopened) {
```

**(다) `slackText.ts`** — 쓰는 곳이 없어진 조각을 지운다.

- `bareNote` 함수와 그 주석(`/** \`_문장_\` → \`문장\`. … */`)을 지운다.
- `roomFirstNoticeParts` 함수와 그 주석을 지운다(`roomFirstNoticeHeadline`은 남는다).
- `escalationNoticeParts` 함수와 그 주석을 지운다(`escalationNoticeHeadline`은 남는다).
- `// ── 알림의 조각: 큰 줄 + 설명 줄 …` 주석 세 줄을 다음으로 바꾼다:

```ts
// ── 알림의 조각: 큰 줄 + 설명 줄 (스펙 2026-10-01 slack-room-look §3.4, 2026-10-02 slack-room-notice-trim) ────
// 손님 방에서는 slackLook.ts 가 큰 줄만 색 막대에 넣는다 — 설명 줄은 방에서 뺐다(전달 실패의 사유만 남긴다).
// 글자만 올릴 때(스레드 방식·피드·긴급 정지·꾸민 글 실패)는 아래 build…Text 가 큰 줄과 설명 줄을 이어 붙인다.
```

- [ ] **Step 4: 통과·전체 테스트·타입 검사·lint, 남은 참조 확인**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/slackLook.test.ts src/lib/chat/__tests__/slackRelay.test.ts src/lib/chat/__tests__/escalationRunner.test.ts src/lib/chat/__tests__/slackText.test.ts 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | tail -4 && npx vitest run 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | tail -6 && npx tsc --noEmit && echo TSC-OK && npx eslint src/lib/chat/slackText.ts src/lib/chat/slackLook.ts src/lib/chat/slackRelay.ts src/lib/chat/__tests__/slackText.test.ts src/lib/chat/__tests__/slackLook.test.ts src/lib/chat/__tests__/slackRelay.test.ts src/lib/chat/__tests__/escalationRunner.test.ts && echo LINT-OK && (grep -rn "bareNote\|roomFirstNoticeParts\|escalationNoticeParts" src || echo NO-LEFTOVER)
```
Expected: 네 파일 `Tests  179 passed (179)`(slackLook 29 + slackRelay 66 + escalationRunner 7 + slackText 77), 이어서 `Test Files  60 passed (60)`, `Tests  985 passed (985)`, `TSC-OK`, `LINT-OK`, `NO-LEFTOVER`.

- [ ] **Step 5: 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git add liv-clinic/src/lib/chat/slackLook.ts liv-clinic/src/lib/chat/slackRelay.ts liv-clinic/src/lib/chat/slackText.ts liv-clinic/src/lib/chat/__tests__/slackLook.test.ts liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts liv-clinic/src/lib/chat/__tests__/escalationRunner.test.ts liv-clinic/src/lib/chat/__tests__/slackText.test.ts && git commit -m "feat(chat): 손님 방의 알림은 큰 줄만 — 설명 줄을 빼고, 시작 화면 이메일은 초록 막대 한 줄" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: 문서와 전체 검증

**Files:**
- Modify: `docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md`(직원 사용법), `docs/superpowers/specs/2026-10-01-slack-room-look-design.md`(개정 표시 한 줄), `docs/superpowers/specs/2026-10-02-slack-room-notice-trim-design.md`(구현 상태 한 줄)

**Interfaces:**
- Consumes: Task 1~2의 커밋
- Produces: 검증된 브랜치, 원장님께 드릴 결과 보고와 배포 승인 질문

- [ ] **Step 1: 직원 사용법에 두 가지를 더한다**

`2026-09-03-slack-patient-rooms-slack-setup.md` §9의 사용법 글에는 "답은 방 본문에 / 상의는 스레드로 / 끝나면 보관"이 이미 있다(2·4·5번). 없는 두 가지(가격은 직접 답하기, 초록 막대 손님에게 번역본 보내기)를 8번 줄 **바로 아래**(코드 블록을 닫는 ``` 앞)에 더한다:

```
9. 방 안의 자동 알림(LIV 알림)은 한 줄씩만 올라옵니다(2026-10-02). 아래 두 가지는 화면에 따로 안내가 나오지 않으니 기억해 주세요.
   · 가격 문의에는 이벤트 링크가 자동으로 나갑니다(🎁 줄). 가격은 직접 답해 주세요.
   · 초록 막대(📱 연락처)가 뜬 손님은 재촉 알림이 울리지 않습니다. 답글 아래에 올라오는 "번역본 · 복사용" 글을 복사해 위챗·왓츠앱·메일로 보내 주세요.
```

- [ ] **Step 2: 예전 설계서에 개정 표시, 이 설계서에 구현 상태**

`2026-10-01-slack-room-look-design.md` 머리의 `> 구현(2026-10-02): …` 줄 **바로 아래**에 한 줄:

```
> 2026-10-02 개정: §3.4 표의 2·8·9·10·11번 알림은 색 막대 안의 설명 줄을 빼고 **큰 줄만** 올린다(답글 전달 실패의 사유는 남긴다). 시작 화면에서 이메일을 넣은 손님은 새 문의 알림에 초록 막대 한 줄로 알린다. 자세한 내용은 `2026-10-02-slack-room-notice-trim-design.md`.
```

`2026-10-02-slack-room-notice-trim-design.md` 머리의 `> 상태: **설계 승인(2026-10-02).** …` 줄 **바로 아래**에 한 줄:

```
> 구현(2026-10-02): 계획서 `docs/superpowers/plans/2026-10-02-slack-room-notice-trim.md`대로 브랜치 `feature/slack-room-look`에 구현했다 — 테스트 60파일 985건·타입 검사·빌드 통과. **운영 반영(master 푸시)은 원장님 승인 대기.**
```

- [ ] **Step 3: 전체 게이트**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | tail -6 && npx tsc --noEmit && echo TSC-OK && npx eslint src/lib/chat/slackText.ts src/lib/chat/slackLook.ts src/lib/chat/slackRelay.ts src/lib/chat/__tests__/slackText.test.ts src/lib/chat/__tests__/slackLook.test.ts src/lib/chat/__tests__/slackRelay.test.ts src/lib/chat/__tests__/escalationRunner.test.ts && echo LINT-OK
```
Expected: `Test Files  60 passed (60)`, `Tests  985 passed (985)`, `TSC-OK`, `LINT-OK`.

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 NODE_TLS_REJECT_UNAUTHORIZED=0 npm run build 2>&1 | tail -12`
Expected: 경로 목록과 범례(`○ (Static)`·`● (SSG)`·`ƒ (Dynamic)`)로 끝난다. 오류 없음.

빌드가 `*.generated.ts` 세 파일의 줄바꿈을 바꿔 놓는다. 되돌린다:

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && git checkout -- liv-clinic/src/lib/data/concernRules.generated.ts liv-clinic/src/lib/guides/guides.generated.ts liv-clinic/src/lib/guides/guides.index.generated.ts && git status --short`
Expected: 문서 세 파일만 `M`으로 남는다.

- [ ] **Step 4: 글자만 문구가 바뀌지 않았는지 확인**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && git diff 67917f0 HEAD -- liv-clinic/src/lib/chat/slackText.ts | grep -E "^[-+]" | grep -vE "^(\+\+\+|---)" | grep -E "오늘 연락할 손님|이 채널에 쓰면|접수 안내|가격 문의로 보여|이 연락처로 먼저|번역본이 아래에|응답하지 않아 전원" ; echo "(위에 줄이 없으면 기존 문장은 손대지 않은 것)"`
Expected: `-` 로 시작하는 줄은 `담당 ${args.assigneeMention} 님이 응답하지 않아 전원에게 알립니다.`가 든 한 줄뿐이다(지운 `escalationNoticeParts`의 설명 줄 — 글자만 문구 `buildEscalationText`의 같은 문장은 그대로 남아 있다). `+` 줄은 없다.

- [ ] **Step 5: 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git add docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md docs/superpowers/specs/2026-10-01-slack-room-look-design.md docs/superpowers/specs/2026-10-02-slack-room-notice-trim-design.md && git commit -m "docs(chat): 알림 줄이기 — 직원 사용법 보완, 예전 설계서 개정 표시, 구현 상태 기록" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git status --short | wc -l
```
Expected: 커밋 1건, `0`.

- [ ] **Step 6: 원장님께 결과 보고와 배포 승인 질문**

쉬운 한국어로: ① 무엇이 바뀌는지(알림마다 한 줄, 시작 화면 이메일은 초록 한 줄) ② 검증 결과 ③ 아직 운영에 나가지 않았다는 것 ④ 배포 승인 질문 — "master에 올리면 Netlify가 자동으로 배포합니다(1분 30초쯤). 배포 뒤 올라오는 알림부터 한 줄이 됩니다. 진행할까요?" 승인 뒤: `git fetch origin && git merge-base --is-ancestor origin/master HEAD && echo FF-OK` → `git push origin feature/slack-room-look:master` → Netlify `listSiteDeploys`로 `ready` 확인(추정으로 "배포됨"이라고 하지 않는다). 직원 안내문(설계서 §5)을 드린다.

---

## 스펙 대조 (자체 점검)

| 스펙 | 요구 | 과제 |
|------|------|------|
| §2.1 | 방의 알림은 큰 줄 하나, 예외는 전달 실패의 사유 | 2 (`notice`, `styledDeliveryFailure`) |
| §2.2 2·4·8·9·11·12 | 새 문의·재발신·연락처·단추·재촉 = 큰 줄만 | 2 |
| §2.2 10 | 이벤트 링크 = `🎁 이벤트 링크를 자동으로 보냈습니다` + 링크 | 1 (`EVENT_HINT_SHORT`), 2 |
| §2.2 13 | 전달 실패 = 큰 줄 + 사유 | 2 (기존 테스트 유지) |
| §2.3 | 시작 화면 이메일 → 같은 글의 초록 막대, 조건은 꼬리말과 같다, 게시 횟수 불변 | 1 (`contactNoticeHeadline`), 2 (`styledRoomFirstNotice`, `postInRoom`) |
| §2.4 | 글자만 문구·피드·스레드 방식 그대로 | 전 과제(기존 기대값 유지), 3 Step 4 |
| §2.5 | 코드 구조(추가·삭제하는 이름) | 1, 2 |
| §3 | 테스트 네 파일 | 1, 2 |
| §4 | 롤아웃 — 승인 뒤 푸시, 배포 확인 | 3 Step 6 |
| §5 | 직원 안내문, 설정 안내 문서의 사용법 | 3 Step 1, Step 6 |
