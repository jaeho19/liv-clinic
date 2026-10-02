# Slack 손님 방 보기 개선 (방 이름·이름표·색 막대) — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 직원이 Slack에서 보는 손님 방을 알아보기 쉽게 한다 — 방 이름은 `10월01일-emma`(문의한 날짜 + 손님 이름)로 만들고, 방 안에서는 손님 글을 손님 이름과 국기로, 자동 알림을 `LIV 알림` 이름과 색 막대로, 번역본을 `번역본 · 복사용` 이름으로 올린다.

**Architecture:** 방 이름 규칙은 import 없는 순수 모듈 `roomName.ts`에 두어 운영 코드(`slackRooms.ts`)와 이름 바꾸기 스크립트가 같은 규칙을 쓴다. 방 안의 글은 문구(`slackText.ts` — 큰 줄과 설명 줄로 나눠 돌려준다)와 모양(`slackLook.ts` — 이름표·아이콘·색 막대)을 나누고, `slackRelay.ts`의 `postStyled`가 꾸민 글을 올리되 Slack이 거부하면 지금까지 운영하던 글자 문구로 다시 올린다. `#해외문의` 피드 줄과 스레드 방식 세션은 건드리지 않는다. DB 변경은 없다.

**Tech Stack:** Next.js 16.1.1(Node 런타임), TypeScript, Vitest 4(`environment: 'node'`), Slack Web API(`chat.postMessage`의 `username`·`icon_emoji`·`attachments` — 앱 권한 `chat:write.customize`, `conversations.create`·`conversations.rename`), supabase-js(admin client), pg(운영 스크립트), Node 24(스크립트가 `.ts`를 바로 import).

**Spec:** `docs/superpowers/specs/2026-10-01-slack-room-look-design.md` (원장님 승인 2026-10-01 — 미리보기와 실제 Slack 시험 방 캡처 확인)

**이 계획의 코드는 실행해 본 것이다.** 이 워크트리의 임시 브랜치에서 아래 과제를 순서대로 구현해 확인했다(2026-10-02): 테스트 60파일 985건 통과(기준선 58파일 878건), `npx tsc --noEmit` 통과, 변경 파일 `npx eslint` 통과, `npm run build` 성공. 실제 Slack 시험 방(원장님만 있는 방)에 `slackLook.ts`가 만든 글 15가지를 꾸민 글·글자 문구 양쪽으로 올려 전부 받아들여지는 것을 확인했고, 이름 바꾸기 스크립트의 미리 보기를 운영 DB(읽기 전용)에서 돌려 보았다. 그 뒤 **이 계획서만 가지고** 기준선에서 처음부터 다시 적용해(아래 `plan-apply.mjs`로 블록을 꺼내 적용) 과제마다 같은 테스트 건수와 같은 파일 내용이 나오는 것까지 확인했다. 과제마다 적힌 "실패·통과 건수"와 "대조 값"은 그때의 실제 값이다.

## Global Constraints

- **작업 위치**: 워크트리 `D:\dev\LIV_homepage-slack-rooms`, 브랜치 `feature/slack-room-look`(master `fc670e2`에서 분기, 설계서·계획서 커밋이 얹혀 있다). 메인 폴더 `D:\dev\LIV_homepage`(master)는 다른 세션이 쓴다 — 거기서 브랜치를 바꾸거나 작업하지 않는다. 이 워크트리에서도 다른 브랜치로 체크아웃하지 않는다.
- **로컬에 `scratch/slack-room-look-dev` 브랜치가 남아 있다**: 이 계획서를 만들 때 코드를 먼저 구현해 검증한 흔적이다(푸시되지 않았다). 체크아웃하거나 병합하지 않는다 — 구현은 이 계획서의 과제대로 한다. 대조가 어긋나 어디가 다른지 봐야 할 때만 `git diff scratch/slack-room-look-dev -- <파일>`로 참고한다. Task 12에서 지운다.
- **명령의 실행 위치**: 아래 명령은 전부 `cd`를 포함해 적었다. **루트** = `D:/dev/LIV_homepage-slack-rooms`(git·`plan-apply.mjs`), **앱** = `D:/dev/LIV_homepage-slack-rooms/liv-clinic`(npm·npx·node 스크립트). npm 명령을 루트에서 실행하지 않는다.
- **이 PC는 TLS 프록시 뒤다**: `npm run build`에는 `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1`, DB나 Slack·Netlify를 부르는 명령에는 `NODE_TLS_REJECT_UNAUTHORIZED=0`을 붙인다(명령에 이미 적혀 있다).
- **계획서의 코드를 그대로 옮긴다**: 고쳐 쓰거나 줄이거나 "더 낫게" 바꾸지 않는다. 옮기는 방법은 Task 0의 `plan-apply.mjs`를 권한다(계획서에서 블록을 꺼내 그대로 쓰거나 `git apply` 한다). 손으로 옮겨도 되지만, 과제마다 커밋 뒤의 **대조**(파일의 git blob 값)가 표와 같아야 한다. 계획대로 했는데 테스트가 실패하거나 대조가 다르면, 고치기 전에 멈추고 원인을 보고한다.
- **운영에 닿는 일은 원장님 승인 뒤에만 한다**: master 푸시(= Netlify 배포), 운영 사이트 시험 문의(직원 Slack에 실제 알림이 간다), 열려 있는 방 이름 바꾸기(`--commit`), Netlify 환경변수 변경. Task 0~12는 이 가운데 어느 것도 하지 않는다. Task 13이 승인 지점이고, 승인은 하나씩 따로 받는다. Task 10의 미리 보기는 운영 DB를 **읽기만** 한다(읽기 전용 트랜잭션).
- **`roomName.ts`는 다른 파일을 import하지 않는다**: 운영 스크립트가 `node`로 이 `.ts`를 바로 불러 쓴다. `server-only`·`@/…` 별칭·상대 import를 넣으면 스크립트가 깨진다.
- **`\p{…}`가 든 정규식은 리터럴로 쓰지 않는다**: tsconfig target이 ES2017이다. `new RegExp('…', 'u')`로 만든다(`priceIntent.ts`와 같은 방식).
- **`#해외문의` 피드에는 이름표·색 막대를 쓰지 않는다**: 피드 스레드 답장 전달(`findSessionByFeedParent`)이 부모 글의 `user`가 우리 봇인지로 판별하는데, 이름표를 붙인 글에는 `user`가 없다(2026-10-01 실측). `postFeed`, 하루 두 번 요약, 스레드 방식 세션, 피드 채널에서 난 전달 실패 알림은 전부 글자만 올린다.
- **멘션은 색 막대 안에 넣지 않는다**: 막대 안의 멘션이 알림을 만드는지 확인하지 못했다. 멘션은 항상 최상위 `text`에 둔다(12분 재촉의 "담당 @… 님이…" 설명 줄만 예외 — 같은 사람이 `text`의 전원 멘션에 이미 있다).
- **손님 글에는 색 막대를 붙이지 않는다**: 막대 안의 긴 글은 "더 보기"로 접힌다. 손님 글·직원 답 사본·번역본은 최상위 `text`에 둔다.
- **번역본 글의 본문은 번역문만이다**: 직원이 휴대폰에서 "텍스트 복사"로 본문을 그대로 복사해 위챗·메일에 붙인다. 이름표(`번역본 · 복사용`)만 붙고 본문에는 아무것도 더하지 않는다.
- **기존 문구는 바뀌지 않는다**: `slackText.ts`의 `build…Text` 함수들이 내는 글자는 전달 실패 사유 한 문장(`(chat-…)` → `(날짜-이름으로 된 방)`)만 빼고 그대로다. 이 글자 문구가 꾸민 글을 못 올릴 때의 대체 문구(`plainText`)다.
- **정해진 값**: 막대 색 — 회색 `#a8a6a8`(자동 안내), 초록 `#2e9e6b`(손님 쪽 연락), 빨강 `#d8452f`(재촉·전달 실패). 이름표 — 손님 `{이름} 손님`(없으면 `{언어 이름} 손님`) + 국기 `:flag-xx:`, 알림 `LIV 알림` `:bell:`, 번역본 `번역본 · 복사용` `:clipboard:`, 직원 답 사본 `{작성자} · 관리자 화면에서 답함` / `{작성자} · 피드에서 답함` `:leftwards_arrow_with_hook:`. 방 이름 — `MM월DD일-이름`(한국 시각), 이름 조각 30글자, 익명은 `영어손님` 꼴, 겹치면 `-2` → `-3` → `-참조코드 6자`, Slack이 이름을 거부하면 예전 꼴 `chat-이름-코드`로 한 번.
- **환경변수**: `SLACK_ROOM_LOOK`(신설 — `off`일 때만 뜻이 있다. 방 안의 글을 예전 모양으로). `SLACK_ROOM_PREFIX`는 폐기(코드가 읽지 않는다).
- **Slack 토큰**: `liv-clinic/.env.slack-trial.local`(git 무시)에 `SLACK_BOT_TOKEN`이 있다. 값을 화면에 찍거나 Read 도구로 이 파일을 열지 않는다. Task 13의 이름 바꾸기 스크립트만 이 파일을 읽는다.
- **throw 하지 않는다**: Slack·DB에 닿는 함수는 실패를 결과값이나 경고 한 줄로 돌려준다. 새 경고 접두어: `[slack look]`(꾸민 글 재게시), 기존 `[slack relay]`·`[slack rooms]`·`[chat ops]`는 그대로.
- **검증 게이트**: `npx vitest run` · `npx tsc --noEmit` · 변경 파일만 `npx eslint <files>`(리포 전체 lint에는 기존 오류가 있다) · `npm run build`. 기준선(2026-10-02, `fc670e2`): 테스트 58파일 878건 통과.
- **Grep 도구**: `glob`에 폴더 경로를 넣으면 이 PC에서 거짓 0건이 나온다. 폴더는 `path`로 좁힌다.
- **커밋 메시지**: 한국어 `type(scope): 요약`. 끝에 세션의 Co-Authored-By 줄을 붙인다(아래 명령에는 `Claude Fable 5.1`로 적혀 있다 — 세션 안내가 다른 줄을 주면 그 줄을 쓴다). 커밋할 때는 그 과제의 파일만 `git add` 한다(`plan-apply.mjs`가 딸려 들어가지 않게). 푸시는 하지 않는다(Task 13).

---

## 실행 요령

- 한 세션이 과제를 번호 순서대로 직접 실행한다(`superpowers:executing-plans` — 2026-10-01 "연락처 먼저" 구현과 같은 방식, 과제마다 하위 에이전트를 띄우지 않는다). **Task 0~12는 묻지 않고 끝까지 간 뒤 결과를 보고한다.** Task 13은 단계마다 원장님 승인을 받는다.
- 과제의 순서는 "테스트를 먼저 넣는다 → 실패를 본다 → 구현을 넣는다 → 통과를 본다 → 타입 검사·lint → 커밋 → 대조"다.
- 코드 블록에는 이름이 붙어 있다(`<!-- block: T2-impl-rooms | full | 경로 -->`). `full`은 파일 전체, `diff`는 `git diff` 출력이다. `node plan-apply.mjs <이름>`이 그대로 적용한다.
- **대조**: `git rev-parse HEAD:<파일>`은 커밋된 파일 내용의 지문이다(줄바꿈 CRLF/LF 차이는 git이 맞춰 준다). 표의 값과 같으면 계획서의 코드와 글자 하나까지 같다.
- 테스트 건수가 다르게 나오면 먼저 앞 과제의 대조를 다시 본다.

## 파일 구조

경로는 `liv-clinic/` 기준(★ = 신규).

| 파일 | 책임 | 과제 |
|------|------|------|
| `src/lib/chat/roomName.ts` ★ | 방 이름 규칙(순수, import 없음): 날짜·이름 조각·익명 이름·후보 순서·예전 꼴 | 1 |
| `src/lib/chat/slackRooms.ts` | 방 확보 절차. 이름은 `roomName.ts`에서 받는다 | 2 |
| `src/lib/chat/slack.ts` | `postSlackMessage`가 `username`·`iconEmoji`·`attachments`를 받는다 | 3 |
| `src/lib/chat/slackText.ts` | Slack 문구(순수). 알림을 큰 줄 + 설명 줄 조각으로도 돌려준다 | 4 |
| `src/lib/chat/slackLook.ts` ★ | 방 안의 글 모양(순수): 이름표·아이콘·색 막대 + 대체 글자 문구 | 5 |
| `src/lib/chat/chatFlags.ts` | 긴급 스위치 `SLACK_ROOM_LOOK` | 6 |
| `src/lib/chat/slackRelay.ts` | `postStyled`(꾸민 글 → 거부되면 글자만), 방 안의 모든 게시에 적용 | 2(두 줄), 6, 7, 8 |
| `src/lib/chat/escalationRunner.ts` | 방의 재촉 알림을 꾸민 글로 | 9 |
| `scripts/slack-rename-open-rooms.mjs` ★ | 열려 있는 방의 이름을 새 규칙으로(기본은 미리 보기) | 10 |
| (루트) `.env.example`, `docs/superpowers/specs/2026-09-03-slack-patient-rooms-*.md` | 환경변수 예시, 설정 안내, 예전 설계서의 개정 표시 | 11 |

테스트(모두 `src/lib/chat/__tests__/`): `roomName.test.ts` ★, `slackRooms.test.ts`, `slack.test.ts`, `slackText.test.ts`, `slackLook.test.ts` ★, `chatFlags.test.ts`, `slackRelay.test.ts`, `escalationRunner.test.ts`, `slackEvents.test.ts`.

## 작업 순서 한눈에 보기

| 묶음 | 과제 | 무엇을 만드는가 | 전체 테스트 | 운영에 닿는가 |
|------|------|-----------------|-------------|---------------|
| 준비 | 0 | 기준선 확인, `plan-apply.mjs`(임시) | 58파일 878건 | 아니오 |
| 방 이름 | 1~2 | 이름 규칙, 방 만들기에 적용 | 906 → 902 | 아니오 |
| 글 모양 바탕 | 3~6 | 게시 인자, 문구 조각, 이름표·색 막대, `postStyled`와 긴급 스위치 | 905 → 923 → 952 → 961 | 아니오 |
| 글 모양 적용 | 7~9 | 손님 글·직원 답 사본·번역본, 알림, 재촉 | 974 → 979 → 985 | 아니오 |
| 마무리 | 10~12 | 이름 바꾸기 스크립트, 문서, 전체 검증 | 60파일 985건 | 아니오(Task 10은 운영 DB 읽기만) |
| 운영 반영 | 13 | 배포 → 시험 문의 → 방 이름 바꾸기 → 정리 | — | **예 — 승인 ①②③** |

과제는 번호 순서대로 한다(뒤 과제가 앞 과제의 함수를 쓴다). 과제 하나가 끝날 때마다 전체 테스트와 타입 검사가 통과하는 상태로 커밋한다.

---

### Task 0: 준비 — 기준선 확인과 `plan-apply.mjs`

**Files:**
- Create: `plan-apply.mjs` (워크트리 루트. **임시 도구 — 커밋하지 않는다.** Task 12 끝에 지운다)

**Interfaces:**
- Consumes: 이 계획서 파일(코드 블록 앞의 `<!-- block: … -->` 표시)
- Produces: `node plan-apply.mjs <블록 이름>` — 그 블록을 파일에 쓰거나 `git apply` 한다

- [ ] **Step 1: 위치와 브랜치 확인**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git status -sb | head -3 && git log --oneline -6
```
Expected: 첫 줄 `## feature/slack-room-look`, 변경된 파일 없음. 로그 위쪽에 이 계획서와 설계서의 `docs(chat): …` 커밋들이 있고 그 아래 `fc670e2 test(chat): 연락처 카드 화면 확인 스크립트…`가 있다(코드 커밋은 아직 없다). 브랜치가 다르면 멈추고 보고한다(다른 브랜치로 체크아웃하지 않는다 — `git switch feature/slack-room-look`만 허용).

- [ ] **Step 2: 기준선 테스트와 타입 검사**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run 2>&1 | tail -6 && npx tsc --noEmit && echo TSC-OK
```
Expected: `Test Files  58 passed (58)`, `Tests  878 passed (878)`, `TSC-OK`.

- [ ] **Step 3: `plan-apply.mjs`를 워크트리 루트에 만든다**

`D:\dev\LIV_homepage-slack-rooms\plan-apply.mjs`에 아래 내용을 그대로 쓴다(이 파일만은 도구 없이 직접 써야 한다).

````js
// plan-apply.mjs — 계획서의 코드 블록을 꺼내 그대로 적용한다.
// 손으로 다시 치다가 글자가 달라지는 것을 막기 위한 임시 도구다. 커밋하지 않는다(Task 12에서 지운다).
//
// 사용 (워크트리 루트에서):
//   node plan-apply.mjs --list                  블록 이름을 모두 보여 준다
//   node plan-apply.mjs <블록 이름> [<블록 이름> …]   그 블록을 적용한다
//
// 계획서에서 `<!-- block: 이름 | full | 경로 -->` 또는 `<!-- block: 이름 | diff | 설명 -->` 바로 아래의
// 백틱 네 개(````) 코드 블록을 찾는다. full 이면 그 경로에 파일 전체로 쓰고, diff 이면 `git apply`로 적용한다.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const PLAN = 'docs/superpowers/plans/2026-10-01-slack-room-look.md';
const plan = readFileSync(PLAN, 'utf8').replace(/\r\n/g, '\n');
const BLOCK_RE = /<!-- block: (\S+) \| (full|diff) \| (.+?) -->\n````[a-z]*\n([\s\S]*?)\n````\n/g;

const blocks = new Map();
for (const m of plan.matchAll(BLOCK_RE)) blocks.set(m[1], { kind: m[2], target: m[3], body: `${m[4]}\n` });

const names = process.argv.slice(2);
if (names.length === 0 || names[0] === '--list') {
  for (const [name, b] of blocks) console.log(`${name}\t${b.kind}\t${b.target}`);
  process.exit(0);
}

for (const name of names) {
  const b = blocks.get(name);
  if (!b) {
    console.error(`블록을 찾지 못했습니다: ${name}  (node plan-apply.mjs --list 로 이름을 확인하세요)`);
    process.exit(1);
  }
  if (b.kind === 'full') {
    mkdirSync(dirname(b.target), { recursive: true });
    writeFileSync(b.target, b.body);
    console.log(`썼습니다: ${b.target} (${b.body.split('\n').length - 1}줄)`);
  } else {
    const patch = `.plan-apply-${name}.patch`;
    writeFileSync(patch, b.body);
    try {
      execFileSync('git', ['apply', '--whitespace=nowarn', patch], { stdio: 'inherit' });
      console.log(`적용했습니다: ${name} — ${b.target}`);
    } finally {
      rmSync(patch, { force: true });
    }
  }
}
````

- [ ] **Step 4: 도구가 블록을 다 찾는지 확인**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs --list | wc -l && node plan-apply.mjs --list | head -4
```
Expected: 첫 줄 `22`(블록 22개). 이어서 `T1-test	full	liv-clinic/src/lib/chat/__tests__/roomName.test.ts`로 시작하는 목록.

`plan-apply.mjs`는 커밋하지 않는다. `git status`에 `?? plan-apply.mjs`로 계속 보이는 것이 정상이다.

---

### Task 1: 방 이름 규칙 — `roomName.ts`

**Files:**
- Create: `liv-clinic/src/lib/chat/roomName.ts`
- Test: `liv-clinic/src/lib/chat/__tests__/roomName.test.ts`

**Interfaces:**
- Consumes: 없음(다른 파일을 import하지 않는다)
- Produces:
  - `ROOM_NAME_MAX = 80`
  - `roomDateLabel(at: string | Date): string` — 한국 시각 `10월01일`
  - `slugifyRoomName(name: string | null | undefined): string` — 이름 조각, 글자가 안 남으면 `''`
  - `anonymousRoomLabel(locale: string): string` — `영어손님`
  - `roomCode6(sessionId: string): string` — 세션 ID 앞 6자 소문자
  - `interface RoomNameInput { visitorName: string | null; visitorLocale: string; sessionId: string; at: string | Date }`
  - `roomNameCandidates(a: RoomNameInput): string[]` — `[기본, 기본-2, 기본-3, 기본-코드6]`
  - `isDatedRoomName(name: string | null | undefined): boolean` — `NN월NN일-`로 시작하는가
  - `legacyAsciiSlug(name: string | null | undefined): string`, `legacyRoomName(a: { visitorName: string | null; visitorLocale: string; sessionId: string }): string` — 예전 꼴 `chat-이름-코드6`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T1-test`

<!-- block: T1-test | full | liv-clinic/src/lib/chat/__tests__/roomName.test.ts -->
````ts
import { describe, it, expect } from 'vitest';
import {
  anonymousRoomLabel,
  isDatedRoomName,
  legacyAsciiSlug,
  legacyRoomName,
  roomCode6,
  roomDateLabel,
  roomNameCandidates,
  ROOM_NAME_MAX,
  slugifyRoomName,
} from '../roomName';

const SESSION_ID = '11111111-2222-3333-4444-555555555555';
// 2026-10-01(목) 16:40 KST
const AT = '2026-10-01T07:40:00Z';

describe('roomDateLabel — 한국 시각의 날짜', () => {
  it('월·일을 두 자리로 맞춘다', () => {
    expect(roomDateLabel(AT)).toBe('10월01일');
    expect(roomDateLabel('2026-01-05T03:00:00Z')).toBe('01월05일');
  });
  it('UTC 15:00은 한국의 다음 날이다', () => {
    expect(roomDateLabel('2026-09-30T14:59:59Z')).toBe('09월30일');
    expect(roomDateLabel('2026-09-30T15:00:00Z')).toBe('10월01일');
  });
  it('Date 객체도 받는다', () => {
    expect(roomDateLabel(new Date(AT))).toBe('10월01일');
  });
  it('읽을 수 없는 시각이면 지금 날짜로 대신한다 (NaN 글자가 이름에 들어가지 않게)', () => {
    expect(roomDateLabel('not-a-date')).toMatch(/^\d{2}월\d{2}일$/);
  });
});

describe('slugifyRoomName — 손님 이름을 방 이름 조각으로', () => {
  it('라틴 이름은 소문자-하이픈', () => {
    expect(slugifyRoomName('Thu Nguyen')).toBe('thu-nguyen');
  });
  it('라틴 글자의 악센트를 벗긴다', () => {
    expect(slugifyRoomName('Nguyễn Thị Thu')).toBe('nguyen-thi-thu');
    expect(slugifyRoomName('José Ñandú')).toBe('jose-nandu');
  });
  it('악센트를 벗겨도 ASCII가 안 되는 라틴 글자를 바꾼다', () => {
    expect(slugifyRoomName('Đặng Thị')).toBe('dang-thi');
    expect(slugifyRoomName('Søren Æbelø')).toBe('soren-aebelo');
    expect(slugifyRoomName('Straße')).toBe('strasse');
  });
  it('기호·연속 공백을 하이픈 하나로 줄이고 앞뒤를 자른다', () => {
    expect(slugifyRoomName("  John  O'Brien!! ")).toBe('john-o-brien');
    expect(slugifyRoomName('a_b.c')).toBe('a-b-c');
  });
  it('한자·가나·한글·키릴·태국어·아랍어는 그대로 둔다', () => {
    expect(slugifyRoomName('山田 花子')).toBe('山田-花子');
    expect(slugifyRoomName('ありがとう タナカ')).toBe('ありがとう-タナカ');
    expect(slugifyRoomName('김하늘')).toBe('김하늘');
    expect(slugifyRoomName('Мария Иванова')).toBe('мария-иванова');
    expect(slugifyRoomName('สมชาย')).toBe('สมชาย');
    expect(slugifyRoomName('محمد')).toBe('محمد');
  });
  it('전각 영문·숫자와 반각 가나를 보통 글자로 바꾼다', () => {
    expect(slugifyRoomName('Ｅｍｍａ　２')).toBe('emma-2');
    expect(slugifyRoomName('ｶﾞｲ')).toBe('ガイ');
  });
  it('여러 글자가 섞여도 된다', () => {
    expect(slugifyRoomName('Emma 王')).toBe('emma-王');
  });
  it('그림 글자는 버린다. 글자가 하나도 안 남으면 빈 글자', () => {
    expect(slugifyRoomName('Emma😊')).toBe('emma');
    expect(slugifyRoomName('😊')).toBe('');
    expect(slugifyRoomName('!!!')).toBe('');
    expect(slugifyRoomName('   ')).toBe('');
  });
  it('null·빈 값은 빈 글자', () => {
    expect(slugifyRoomName(null)).toBe('');
    expect(slugifyRoomName(undefined)).toBe('');
    expect(slugifyRoomName('')).toBe('');
  });
  it('30글자에서 자르고 끝의 하이픈을 없앤다', () => {
    expect(slugifyRoomName('abcdefghij abcdefghij abcdefgh ijk')).toBe('abcdefghij-abcdefghij-abcdefgh');
    expect(slugifyRoomName('가'.repeat(40))).toBe('가'.repeat(30));
  });
  it('Slack이 거부하는 글자(대문자·공백·마침표·따옴표)가 남지 않는다', () => {
    for (const name of ['Emma Smith', "O'Brien", 'emma.smith', 'ÉMILIE', 'МАРИЯ']) {
      expect(slugifyRoomName(name)).toMatch(/^[^A-ZÉМ\s.'"]+$/);
    }
    expect(slugifyRoomName('МАРИЯ')).toBe('мария');
  });
});

describe('anonymousRoomLabel — 이름을 안 적은 손님', () => {
  it('열 개 로케일의 한국어 이름 + 손님', () => {
    expect(anonymousRoomLabel('en')).toBe('영어손님');
    expect(anonymousRoomLabel('ja')).toBe('일본어손님');
    expect(anonymousRoomLabel('zh')).toBe('중국어손님');
    expect(anonymousRoomLabel('zh-TW')).toBe('중국어번체손님');
    expect(anonymousRoomLabel('vi')).toBe('베트남어손님');
    expect(anonymousRoomLabel('th')).toBe('태국어손님');
    expect(anonymousRoomLabel('ru')).toBe('러시아어손님');
    expect(anonymousRoomLabel('fr')).toBe('프랑스어손님');
    expect(anonymousRoomLabel('mn')).toBe('몽골어손님');
    expect(anonymousRoomLabel('ar')).toBe('아랍어손님');
  });
  it('모르는 로케일은 로케일 글자 그대로', () => {
    expect(anonymousRoomLabel('xx')).toBe('xx손님');
    expect(anonymousRoomLabel('pt-BR')).toBe('pt-br손님');
  });
});

describe('roomNameCandidates — 방을 만들 때 차례로 시도할 이름', () => {
  it('날짜-이름 → -2 → -3 → -참조코드', () => {
    expect(
      roomNameCandidates({ visitorName: 'Thu Nguyen', visitorLocale: 'vi', sessionId: SESSION_ID, at: AT })
    ).toEqual([
      '10월01일-thu-nguyen',
      '10월01일-thu-nguyen-2',
      '10월01일-thu-nguyen-3',
      '10월01일-thu-nguyen-111111',
    ]);
  });
  it('이름이 없으면 언어로 부른다', () => {
    expect(roomNameCandidates({ visitorName: null, visitorLocale: 'en', sessionId: SESSION_ID, at: AT })[0]).toBe(
      '10월01일-영어손님'
    );
  });
  it('글자가 하나도 안 남는 이름도 언어로 부른다', () => {
    expect(roomNameCandidates({ visitorName: '😊', visitorLocale: 'zh-TW', sessionId: SESSION_ID, at: AT })[0]).toBe(
      '10월01일-중국어번체손님'
    );
  });
  it('한자 이름은 그대로 쓴다', () => {
    expect(roomNameCandidates({ visitorName: '山田花子', visitorLocale: 'ja', sessionId: SESSION_ID, at: AT })[0]).toBe(
      '10월01일-山田花子'
    );
  });
  it('가장 긴 이름(60자)에도 80글자를 넘지 않는다', () => {
    const names = roomNameCandidates({ visitorName: '가'.repeat(60), visitorLocale: 'en', sessionId: SESSION_ID, at: AT });
    for (const n of names) expect(Array.from(n).length).toBeLessThanOrEqual(ROOM_NAME_MAX);
  });
});

describe('예전 이름 꼴 — Slack이 새 이름을 거부할 때만 쓴다', () => {
  it('roomCode6: 세션 ID 앞 6자, 소문자', () => {
    expect(roomCode6('A1B2C3D4-0000-0000-0000-000000000000')).toBe('a1b2c3');
  });
  it('legacyAsciiSlug: ASCII만 남기고 16자', () => {
    expect(legacyAsciiSlug('Nguyễn Thị Thu')).toBe('nguyen-thi-thu');
    expect(legacyAsciiSlug('abcdefghijklmno pqrstu')).toBe('abcdefghijklmno');
    expect(legacyAsciiSlug('山田太郎')).toBe('');
    expect(legacyAsciiSlug(null)).toBe('');
  });
  it('legacyRoomName: chat-이름-참조코드6자', () => {
    expect(legacyRoomName({ visitorName: 'Thu Nguyen', visitorLocale: 'vi', sessionId: SESSION_ID })).toBe(
      'chat-thu-nguyen-111111'
    );
  });
  it('legacyRoomName: ASCII로 못 만드는 이름은 로케일로 대신한다', () => {
    expect(legacyRoomName({ visitorName: '山田', visitorLocale: 'zh-TW', sessionId: SESSION_ID })).toBe(
      'chat-zh-tw-111111'
    );
  });
});

describe('isDatedRoomName — 이미 새 꼴인 방인가', () => {
  it('NN월NN일- 로 시작하면 새 꼴', () => {
    expect(isDatedRoomName('10월01일-emma')).toBe(true);
    expect(isDatedRoomName('09월14일-영어손님-2')).toBe(true);
  });
  it('예전 꼴·빈 값은 아니다', () => {
    expect(isDatedRoomName('chat-emma-167954')).toBe(false);
    expect(isDatedRoomName('')).toBe(false);
    expect(isDatedRoomName(null)).toBe(false);
  });
});
````

- [ ] **Step 2: 실패를 확인한다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/roomName.test.ts 2>&1 | tail -12`
Expected: FAIL — `Error: Cannot find module '../roomName'`, `Test Files  1 failed (1)`, `Tests  no tests`.

- [ ] **Step 3: 구현을 쓴다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T1-impl`

<!-- block: T1-impl | full | liv-clinic/src/lib/chat/roomName.ts -->
````ts
// Slack 손님 방 이름 규칙 (스펙 2026-10-01 slack-room-look §3.1). 순수 함수만 있다.
//
// ⚠️ 이 파일은 다른 파일을 import하지 않는다. 운영 스크립트(scripts/slack-rename-open-rooms.mjs)가
//    node로 이 .ts를 바로 불러 같은 규칙을 쓴다 — 'server-only'·'@/…' 별칭·상대 import를 넣으면 그 스크립트가 깨진다.
//
// Slack 채널 이름 (2026-10-01 실측): 한글·한자·가나·키릴·태국어·아랍어 같은 각국 글자와 숫자·하이픈·밑줄은 받는다.
// 대문자·공백·마침표·따옴표는 invalid_name_specials 로 거부한다(고쳐 주지 않는다). 길이는 글자 수로 80.

export const ROOM_NAME_MAX = 80;

const SLUG_MAX = 30;
const LEGACY_SLUG_MAX = 16;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** 한국 시각의 날짜 `10월01일`. 두 자리로 맞춰야 이름순 정렬이 날짜순이 된다. */
export function roomDateLabel(at: string | Date): string {
  const parsed = typeof at === 'string' ? Date.parse(at) : at.getTime();
  const ms = Number.isFinite(parsed) ? parsed : Date.now();
  const d = new Date(ms + KST_OFFSET_MS);
  return `${pad2(d.getUTCMonth() + 1)}월${pad2(d.getUTCDate())}일`;
}

// tsconfig target(ES2017)의 정규식 리터럴 검사를 피하려고 생성자로 만든다(\p{…}는 Node가 지원한다).
const LATIN_RE = new RegExp('^\\p{Script=Latin}$', 'u');
const MARK_RE = new RegExp('^\\p{M}$', 'u');
const MARKS_RE = new RegExp('\\p{M}+', 'gu');
const LETTER_OR_DIGIT_RE = new RegExp('^[\\p{L}\\p{Nd}]$', 'u');

/** 악센트를 벗겨도 ASCII가 되지 않는 라틴 글자 */
const LATIN_FOLD: Record<string, string> = { đ: 'd', ø: 'o', ł: 'l', ß: 'ss', æ: 'ae', œ: 'oe', ı: 'i' };

function foldLatin(ch: string): string {
  const base = ch.normalize('NFD').replace(MARKS_RE, '').toLowerCase();
  return LATIN_FOLD[base] ?? base;
}

/**
 * 손님 이름 → 방 이름 조각.
 * 라틴 글자는 악센트를 벗겨 소문자로, 그 밖의 글자(한글·한자·가나 …)와 숫자는 그대로, 나머지는 '-' 하나로.
 * 30글자에서 자른다. 글자가 하나도 남지 않으면 ''(호출자가 언어 이름으로 대신한다).
 */
export function slugifyRoomName(name: string | null | undefined): string {
  if (!name) return '';
  let out = '';
  let afterLatin = false;
  for (const ch of name.normalize('NFKC')) {
    if (LATIN_RE.test(ch)) {
      out += foldLatin(ch);
      afterLatin = true;
    } else if (MARK_RE.test(ch)) {
      // 라틴 글자에 따로 붙은 결합 부호는 버린다. 태국어·아랍어 등의 부호는 글자의 일부라 둔다.
      if (!afterLatin) out += ch;
    } else {
      afterLatin = false;
      out += LETTER_OR_DIGIT_RE.test(ch) ? ch.toLowerCase() : '-';
    }
  }
  const collapsed = out.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return Array.from(collapsed).slice(0, SLUG_MAX).join('').replace(/-+$/g, '');
}

const LOCALE_ROOM_LABEL: Record<string, string> = {
  en: '영어',
  ja: '일본어',
  zh: '중국어',
  'zh-TW': '중국어번체',
  vi: '베트남어',
  th: '태국어',
  ru: '러시아어',
  fr: '프랑스어',
  mn: '몽골어',
  ar: '아랍어',
};

/** 이름을 안 적은 손님의 방 이름 조각: `영어손님`. 모르는 로케일은 로케일 글자 그대로. */
export function anonymousRoomLabel(locale: string): string {
  return `${LOCALE_ROOM_LABEL[locale] ?? slugifyRoomName(locale)}손님`;
}

/** 참조코드(세션 ID 앞 8자) 가운데 앞 6자, 소문자 — 예전 방 이름 끝에 붙던 그 부호. */
export function roomCode6(sessionId: string): string {
  return sessionId.replace(/-/g, '').slice(0, 6).toLowerCase();
}

export interface RoomNameInput {
  visitorName: string | null;
  visitorLocale: string;
  sessionId: string;
  /** 방을 만들게 한 첫 글의 시각 */
  at: string | Date;
}

/** 방을 만들 때 차례로 시도할 이름: `10월01일-이름` → `-2` → `-3` → `-참조코드6자`. Slack이 name_taken을 주면 다음 것. */
export function roomNameCandidates(a: RoomNameInput): string[] {
  const base = `${roomDateLabel(a.at)}-${slugifyRoomName(a.visitorName) || anonymousRoomLabel(a.visitorLocale)}`;
  return [base, `${base}-2`, `${base}-3`, `${base}-${roomCode6(a.sessionId)}`];
}

/** 이미 새 꼴(`NN월NN일-…`)인 방 이름인가 — 이름 바꾸기 스크립트가 건너뛸 방을 고를 때 쓴다. */
export function isDatedRoomName(name: string | null | undefined): boolean {
  return /^\d{2}월\d{2}일-/.test(name ?? '');
}

// ── 예전 꼴 (2026-09-03 규칙) — Slack이 새 이름을 invalid_name… 으로 거부할 때만 쓴다 ─────────

/** ASCII만 남긴 이름 조각, 16자. 한자·태국어처럼 ASCII로 못 만드는 이름은 ''. */
export function legacyAsciiSlug(name: string | null | undefined): string {
  if (!name) return '';
  const ascii = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return ascii.slice(0, LEGACY_SLUG_MAX).replace(/-+$/g, '');
}

/** `chat-{이름 ‖ 로케일}-{참조코드 6자}` — 지금까지 운영에서 항상 통한 꼴. */
export function legacyRoomName(a: { visitorName: string | null; visitorLocale: string; sessionId: string }): string {
  const slug = legacyAsciiSlug(a.visitorName) || a.visitorLocale.toLowerCase();
  return `chat-${slug}-${roomCode6(a.sessionId)}`;
}
````

- [ ] **Step 4: 통과를 확인한다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/roomName.test.ts 2>&1 | tail -6`
Expected: `Test Files  1 passed (1)`, `Tests  28 passed (28)`.

- [ ] **Step 5: node가 이 파일을 바로 부를 수 있는지 확인한다 (운영 스크립트가 이렇게 쓴다)**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && node --input-type=module -e "import { roomNameCandidates } from './src/lib/chat/roomName.ts'; console.log(roomNameCandidates({ visitorName: 'Yuki Tanaka', visitorLocale: 'ja', sessionId: '40e56969-0000-0000-0000-000000000000', at: '2026-10-01T07:40:00Z' }).join(' | '));" 2>&1 | tail -1
```
Expected: `10월01일-yuki-tanaka | 10월01일-yuki-tanaka-2 | 10월01일-yuki-tanaka-3 | 10월01일-yuki-tanaka-40e569` (그 위에 뜨는 `MODULE_TYPELESS_PACKAGE_JSON` 경고는 무시한다).

- [ ] **Step 6: 전체 테스트·타입 검사·lint**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run 2>&1 | tail -6 && npx tsc --noEmit && echo TSC-OK && npx eslint src/lib/chat/roomName.ts src/lib/chat/__tests__/roomName.test.ts && echo LINT-OK
```
Expected: `Test Files  59 passed (59)`, `Tests  906 passed (906)`, `TSC-OK`, `LINT-OK`.

- [ ] **Step 7: 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git add liv-clinic/src/lib/chat/roomName.ts liv-clinic/src/lib/chat/__tests__/roomName.test.ts && git commit -m "feat(chat): 방 이름 규칙 roomName.ts — 날짜-이름, 겹칠 때 후보, 예전 꼴 폴백" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 8: 대조**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms" && for f in liv-clinic/src/lib/chat/roomName.ts liv-clinic/src/lib/chat/__tests__/roomName.test.ts; do echo "$(git rev-parse HEAD:$f)  $f"; done
```
Expected:

| 파일 | 나와야 하는 값 |
|------|----------------|
| `liv-clinic/src/lib/chat/roomName.ts` | `ef1ac69a142ba74121b83eb6e4c317d18867296c` |
| `liv-clinic/src/lib/chat/__tests__/roomName.test.ts` | `a632af88ca4d33aa4812d6baeb4853dabfb0bfc8` |

---

### Task 2: 방을 날짜-이름으로 만든다 — `slackRooms.ts`

**Files:**
- Modify: `liv-clinic/src/lib/chat/slackRooms.ts` (파일 전체를 바꾼다)
- Modify: `liv-clinic/src/lib/chat/slackRelay.ts` (import 한 줄, `prefix` 한 줄 삭제, `ensureRoom` 호출에 인자 하나)
- Test: `liv-clinic/src/lib/chat/__tests__/slackRooms.test.ts` (파일 전체를 바꾼다), `liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts` (테스트 1건 추가)

**Interfaces:**
- Consumes: Task 1의 `roomNameCandidates(a: RoomNameInput): string[]`, `legacyRoomName(a): string`
- Produces:
  - `ensureRoom(session: RoomSessionInfo, deps: RoomDeps, receivedAt: string | Date): Promise<EnsureRoomResult>` — 세 번째 인자(첫 글의 시각)가 생겼다
  - `RoomDeps`에서 `prefix`가 빠졌다
  - 없어진 export: `DEFAULT_ROOM_PREFIX`, `roomPrefix`, `slugifyName`, `buildRoomName` (이름 규칙은 전부 `roomName.ts`)

방 만들기 순서: 후보 이름을 차례로 시도 → `name_taken`이면 다음 후보 → `invalid_name…`이면 예전 꼴(`chat-이름-코드`)로 한 번 → 그 밖의 오류나 후보 소진이면 지금처럼 스레드 방식으로 넘어간다.

- [ ] **Step 1: 테스트를 바꾼다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T2-test-rooms T2-test-relay`

`slackRooms.test.ts` 전체(이름 규칙 테스트는 Task 1의 `roomName.test.ts`로 옮겨 갔으므로 여기서는 방을 확보하는 절차만 본다):

<!-- block: T2-test-rooms | full | liv-clinic/src/lib/chat/__tests__/slackRooms.test.ts -->
````ts
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
````

`slackRelay.test.ts`에 테스트 1건 추가(첫 글의 시각이 `ensureRoom`으로 넘어가는지):

<!-- block: T2-test-relay | diff | slackRelay.test.ts -->
````diff
diff --git a/liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts b/liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts
index d88015e..e03a47c 100644
--- a/liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts
+++ b/liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts
@@ -628,4 +628,11 @@ describe('relayChatMessageToSlack — 방 첫 메시지의 연락처 꼬리말',
     await relayChatMessageToSlack(FIRST);
     expect(postMock.mock.calls[0][0].text).not.toContain('이메일을 남긴 손님입니다');
   });
+
+  it('첫 글의 시각을 방 만들기에 넘긴다 (방 이름의 날짜가 된다)', async () => {
+    adminFor(UNASSIGNED_ROW);
+    await relayChatMessageToSlack(FIRST);
+    expect(ensureRoomMock).toHaveBeenCalledTimes(1);
+    expect(ensureRoomMock.mock.calls[0][2]).toBe(FIRST.receivedAt);
+  });
 });
````

- [ ] **Step 2: 실패를 확인한다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/slackRooms.test.ts src/lib/chat/__tests__/slackRelay.test.ts 2>&1 | tail -8`
Expected: FAIL — `Test Files  2 failed (2)`, `Tests  8 failed | 46 passed (54)`. (`slackRooms` 7건: 이름이 `undefined-thu-nguyen-111111`로 나온다. `slackRelay` 1건: 세 번째 인자가 `undefined`.)

- [ ] **Step 3: 구현을 바꾼다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T2-impl-rooms T2-impl-relay`

`slackRooms.ts` 전체:

<!-- block: T2-impl-rooms | full | liv-clinic/src/lib/chat/slackRooms.ts -->
````ts
import 'server-only';
import {
  archiveChannel,
  createPrivateChannel,
  inviteToChannel,
  setChannelTopic,
} from '@/lib/chat/slack';
import { legacyRoomName, roomNameCandidates } from '@/lib/chat/roomName';
import { buildRoomTopic, type RoomSessionInfo } from '@/lib/chat/slackText';

// 손님 1명 = 비공개 채널 1개. 이 파일은 "방을 확보하는" 절차만 담당한다.
// DB 접근은 RoomDeps로 주입받아 Vitest에서 가짜로 바꿀 수 있게 한다.
// 방 이름 규칙은 roomName.ts에 있다 (스펙 2026-10-01 slack-room-look §3.1).

export interface RoomDeps {
  /** 초대 대상 = 답변 직원 + 관찰자 */
  staffIds: string[];
  /** 답변 직원이 1명 이상인지. 없으면 방을 만들지 않는다(아무도 멘션할 수 없는 방은 없는 것과 같다) */
  hasResponders: boolean;
  sleep(ms: number): Promise<void>;
  /** `slack_mode IS NULL`인 세션을 'room'으로 선점. 성공 시 true */
  claimRoomMode(sessionId: string): Promise<boolean>;
  /** 선점한 세션에 채널 확정. DB 쓰기 실패 시 reject — ensureRoom이 스레드로 폴백한다 */
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

/** receivedAt = 방을 만들게 한 첫 글의 시각. 방 이름의 날짜가 된다. */
export async function ensureRoom(
  session: RoomSessionInfo,
  deps: RoomDeps,
  receivedAt: string | Date
): Promise<EnsureRoomResult> {
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

  const created = await createWithRetries(session, receivedAt);
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

  try {
    await deps.setRoom(session.sessionId, created.id, created.name);
  } catch (e) {
    console.warn('[slack rooms] setRoom failed:', e);
    await archiveChannel(created.id);
    await deps.setThreadMode(session.sessionId);
    return { mode: 'thread' };
  }

  const topic = await setChannelTopic(created.id, buildRoomTopic(session));
  if (!topic.ok) console.warn('[slack rooms] setTopic failed:', topic.error);
  return { mode: 'room', channelId: created.id, created: true };
}

/**
 * 이름 후보를 차례로 시도한다 (`10월01일-이름` → `-2` → `-3` → `-참조코드`).
 * - name_taken: 다음 후보 (보관된 방의 이름도 점유된다).
 * - invalid_name…: Slack이 이름 글자를 거부했다 → 지금까지 항상 통한 예전 꼴(`chat-이름-코드`)로 한 번만 더.
 * - 그 밖의 오류(권한·제한·시간 초과): 곧바로 포기 → 호출자가 스레드 방식으로 넘긴다.
 */
async function createWithRetries(
  session: RoomSessionInfo,
  receivedAt: string | Date
): Promise<{ id: string; name: string } | null> {
  const names = roomNameCandidates({
    visitorName: session.visitorName,
    visitorLocale: session.visitorLocale,
    sessionId: session.sessionId,
    at: receivedAt,
  });
  let lastError = 'name_taken';
  for (const name of names) {
    const r = await createPrivateChannel(name);
    if (r.ok) return { id: r.data.channel.id, name: r.data.channel.name };
    lastError = r.error;
    if (r.error === 'name_taken') continue;
    if (r.error.startsWith('invalid_name')) {
      console.warn('[slack rooms] name rejected, retrying with legacy name:', r.error);
      const legacy = await createPrivateChannel(legacyRoomName(session));
      if (legacy.ok) return { id: legacy.data.channel.id, name: legacy.data.channel.name };
      lastError = legacy.error;
    }
    break;
  }
  console.warn('[slack rooms] create failed:', lastError);
  return null;
}
````

`slackRelay.ts`의 세 곳:

<!-- block: T2-impl-relay | diff | slackRelay.ts -->
````diff
diff --git a/liv-clinic/src/lib/chat/slackRelay.ts b/liv-clinic/src/lib/chat/slackRelay.ts
index 94a508e..5aa5281 100644
--- a/liv-clinic/src/lib/chat/slackRelay.ts
+++ b/liv-clinic/src/lib/chat/slackRelay.ts
@@ -18,7 +18,7 @@ import {
   type PostMessageResult,
 } from '@/lib/chat/slack';
 import { loadStaffDirectory, mentionOf, resolveStaffLabel, type StaffDirectory } from '@/lib/chat/slackStaff';
-import { ensureRoom, roomPrefix, type RoomDeps } from '@/lib/chat/slackRooms';
+import { ensureRoom, type RoomDeps } from '@/lib/chat/slackRooms';
 import { routeInbound } from '@/lib/chat/slackEvents';
 import {
   adminSessionUrl,
@@ -146,7 +146,6 @@ function makeRoomDeps(admin: ChatAdminClient, staff: StaffDirectory): RoomDeps {
   return {
     staffIds: staff.inviteIds,
     hasResponders: staff.responderIds.length > 0,
-    prefix: roomPrefix(),
     sleep: (ms) => _internals.sleep(ms),
     async claimRoomMode(sessionId) {
       const { data, error } = await admin
@@ -229,7 +228,7 @@ export async function relayChatMessageToSlack(args: RelayOutboundArgs): Promise<
     let firstInRoom = false;
 
     if (target.mode === 'unassigned') {
-      const r = await ensureRoom(sessionInfo(session), makeRoomDeps(admin, staff));
+      const r = await ensureRoom(sessionInfo(session), makeRoomDeps(admin, staff), receivedAt);
       if (r.mode === 'room') {
         target = { mode: 'room', channelId: r.channelId };
         firstInRoom = r.created;
````

- [ ] **Step 4: 통과를 확인한다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/slackRooms.test.ts src/lib/chat/__tests__/slackRelay.test.ts 2>&1 | tail -6`
Expected: `Test Files  2 passed (2)`, `Tests  54 passed (54)`.

- [ ] **Step 5: 전체 테스트·타입 검사·lint, 남은 참조 확인**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run 2>&1 | tail -6 && npx tsc --noEmit && echo TSC-OK && npx eslint src/lib/chat/slackRooms.ts src/lib/chat/slackRelay.ts src/lib/chat/__tests__/slackRooms.test.ts src/lib/chat/__tests__/slackRelay.test.ts && echo LINT-OK && (grep -rn "roomPrefix\|DEFAULT_ROOM_PREFIX\|buildRoomName\|slugifyName\|SLACK_ROOM_PREFIX" src || echo NO-LEFTOVER)
```
Expected: `Test Files  59 passed (59)`, `Tests  902 passed (902)`, `TSC-OK`, `LINT-OK`, `NO-LEFTOVER`. (전체 건수가 906에서 902로 준다 — `slackRooms.test.ts`의 이름 규칙 테스트 9건이 Task 1로 옮겨 갔고, 절차 테스트가 4건, 릴레이 테스트가 1건 늘었다.)

- [ ] **Step 6: 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git add liv-clinic/src/lib/chat/slackRooms.ts liv-clinic/src/lib/chat/slackRelay.ts liv-clinic/src/lib/chat/__tests__/slackRooms.test.ts liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts && git commit -m "feat(chat): 방을 날짜-이름으로 만든다 — 겹치면 다음 후보, 거부되면 예전 꼴로 한 번" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 7: 대조**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms" && for f in liv-clinic/src/lib/chat/slackRooms.ts liv-clinic/src/lib/chat/slackRelay.ts liv-clinic/src/lib/chat/__tests__/slackRooms.test.ts liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts; do echo "$(git rev-parse HEAD:$f)  $f"; done
```
Expected:

| 파일 | 나와야 하는 값 |
|------|----------------|
| `liv-clinic/src/lib/chat/slackRooms.ts` | `ae766d4388177d7d5f64d218b0ea814f90fa3800` |
| `liv-clinic/src/lib/chat/slackRelay.ts` | `5aa5281ef726a375267df13857a316d9a159d36c` |
| `liv-clinic/src/lib/chat/__tests__/slackRooms.test.ts` | `ebbdc9274de138db2b47743c8b9efc3df9aa0e18` |
| `liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts` | `e03a47cf69f6d288e500b3ef54f573c671dd7193` |

---

### Task 3: `postSlackMessage`가 이름표·아이콘·색 막대를 받는다 — `slack.ts`

**Files:**
- Modify: `liv-clinic/src/lib/chat/slack.ts`
- Test: `liv-clinic/src/lib/chat/__tests__/slack.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `interface SlackBlock { type: string; [key: string]: unknown }`
  - `interface SlackAttachment { color: string; fallback: string; blocks: SlackBlock[] }`
  - `interface SlackLook { username?: string; iconEmoji?: string; attachments?: SlackAttachment[] }`
  - `postSlackMessage(args: { text: string; threadTs?: string | null; channelId?: string; replyBroadcast?: boolean } & SlackLook): Promise<PostMessageResult>` — `username`·`icon_emoji`·`attachments`는 주어졌을 때만 요청 본문에 넣는다(없으면 요청 본문이 예전과 같다)

- [ ] **Step 1: 테스트를 더한다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T3-test`

<!-- block: T3-test | diff | slack.test.ts -->
````diff
diff --git a/liv-clinic/src/lib/chat/__tests__/slack.test.ts b/liv-clinic/src/lib/chat/__tests__/slack.test.ts
index 2309e1e..d24339a 100644
--- a/liv-clinic/src/lib/chat/__tests__/slack.test.ts
+++ b/liv-clinic/src/lib/chat/__tests__/slack.test.ts
@@ -211,6 +211,37 @@ describe('callSlack / postSlackMessage', () => {
     expect(body.reply_broadcast).toBe(true);
   });
 
+  it('이름표·아이콘·색 막대가 없으면 요청 본문은 예전 그대로다', async () => {
+    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true, ts: '1.2', channel: 'C1' }));
+    await postSlackMessage({ text: 'hi', channelId: 'C1' });
+    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
+    expect(Object.keys(body).sort()).toEqual(['channel', 'reply_broadcast', 'text', 'unfurl_links', 'unfurl_media']);
+  });
+
+  it('이름표·아이콘·색 막대를 주면 username·icon_emoji·attachments로 보낸다', async () => {
+    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true, ts: '1.2', channel: 'C1' }));
+    const attachments = [
+      {
+        color: '#a8a6a8',
+        fallback: '새 문의',
+        blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '*새 문의*' } }],
+      },
+    ];
+    await postSlackMessage({ text: '', channelId: 'C1', username: 'LIV 알림', iconEmoji: ':bell:', attachments });
+    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
+    expect(body.username).toBe('LIV 알림');
+    expect(body.icon_emoji).toBe(':bell:');
+    expect(body.attachments).toEqual(attachments);
+    expect(body.text).toBe('');
+  });
+
+  it('빈 attachments 배열은 보내지 않는다', async () => {
+    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true, ts: '1.2', channel: 'C1' }));
+    await postSlackMessage({ text: 'hi', channelId: 'C1', attachments: [] });
+    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
+    expect('attachments' in body).toBe(false);
+  });
+
   it('429는 Retry-After 뒤 1회 재시도한다', async () => {
     global.fetch = vi
       .fn()
````

- [ ] **Step 2: 실패를 확인한다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/slack.test.ts 2>&1 | tail -8`
Expected: FAIL — `Tests  1 failed | 39 passed (40)` (`expected undefined to be 'LIV 알림'`). 나머지 새 테스트 두 건은 지금 구현으로도 통과한다(요청 본문이 그대로라는 것, 빈 배열을 안 보낸다는 것 — 회귀 방지용이다).

- [ ] **Step 3: 구현을 바꾼다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T3-impl`

<!-- block: T3-impl | diff | slack.ts -->
````diff
diff --git a/liv-clinic/src/lib/chat/slack.ts b/liv-clinic/src/lib/chat/slack.ts
index 051d82c..86b7c6e 100644
--- a/liv-clinic/src/lib/chat/slack.ts
+++ b/liv-clinic/src/lib/chat/slack.ts
@@ -142,17 +142,41 @@ export interface PostMessageResult {
   error?: string;
 }
 
+/** Block Kit 블록 하나 (색 막대 안에 넣는 section·context). 내용은 slackLook.ts가 만든다. */
+export interface SlackBlock {
+  type: string;
+  [key: string]: unknown;
+}
+
+/** 색 막대 하나 = attachments 요소 하나. */
+export interface SlackAttachment {
+  color: string;
+  /** 알림 미리보기처럼 블록을 그리지 못하는 곳에 쓰이는 글자만의 요약 */
+  fallback: string;
+  blocks: SlackBlock[];
+}
+
+/** 글마다 바꾸는 겉모습. username·icon_emoji는 앱에 chat:write.customize 권한이 있어야 적용된다. */
+export interface SlackLook {
+  username?: string;
+  iconEmoji?: string;
+  attachments?: SlackAttachment[];
+}
+
 /**
  * chat.postMessage 호출.
  * - threadTs가 있으면 해당 스레드에 답글로 붙는다. replyBroadcast는 threadTs가 있을 때만 의미 있다.
  * - channelId 미지정 시 SLACK_CHANNEL_ID(#해외문의).
+ * - username·iconEmoji·attachments는 주어졌을 때만 요청에 넣는다(없으면 요청 본문이 예전과 같다).
  */
-export async function postSlackMessage(args: {
-  text: string;
-  threadTs?: string | null;
-  channelId?: string;
-  replyBroadcast?: boolean;
-}): Promise<PostMessageResult> {
+export async function postSlackMessage(
+  args: {
+    text: string;
+    threadTs?: string | null;
+    channelId?: string;
+    replyBroadcast?: boolean;
+  } & SlackLook
+): Promise<PostMessageResult> {
   if (!getSlackBotToken()) return { ok: false, error: 'no_bot_token' };
   const channel = args.channelId ?? getSlackChannelId();
   if (!channel) return { ok: false, error: 'no_channel_id' };
@@ -162,6 +186,9 @@ export async function postSlackMessage(args: {
     text: args.text,
     reply_broadcast: Boolean(args.replyBroadcast && args.threadTs),
     ...(args.threadTs ? { thread_ts: args.threadTs } : {}),
+    ...(args.username ? { username: args.username } : {}),
+    ...(args.iconEmoji ? { icon_emoji: args.iconEmoji } : {}),
+    ...(args.attachments && args.attachments.length > 0 ? { attachments: args.attachments } : {}),
     unfurl_links: false,
     unfurl_media: false,
   });
````

- [ ] **Step 4: 통과·전체 테스트·타입 검사·lint**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/slack.test.ts 2>&1 | tail -4 && npx vitest run 2>&1 | tail -6 && npx tsc --noEmit && echo TSC-OK && npx eslint src/lib/chat/slack.ts src/lib/chat/__tests__/slack.test.ts && echo LINT-OK
```
Expected: `Tests  40 passed (40)`, 이어서 `Test Files  59 passed (59)`, `Tests  905 passed (905)`, `TSC-OK`, `LINT-OK`.

- [ ] **Step 5: 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git add liv-clinic/src/lib/chat/slack.ts liv-clinic/src/lib/chat/__tests__/slack.test.ts && git commit -m "feat(chat): postSlackMessage가 이름표·아이콘·색 막대를 받는다" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 6: 대조**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms" && for f in liv-clinic/src/lib/chat/slack.ts liv-clinic/src/lib/chat/__tests__/slack.test.ts; do echo "$(git rev-parse HEAD:$f)  $f"; done
```
Expected:

| 파일 | 나와야 하는 값 |
|------|----------------|
| `liv-clinic/src/lib/chat/slack.ts` | `86b7c6e1a26512e486f3d73f88249fbfb1f2a5e5` |
| `liv-clinic/src/lib/chat/__tests__/slack.test.ts` | `d24339a13202e343b91c54e4f92cf54820344383` |

---

### Task 4: 알림 문구를 큰 줄·설명 줄 조각으로 — `slackText.ts`

**Files:**
- Modify: `liv-clinic/src/lib/chat/slackText.ts`
- Test: `liv-clinic/src/lib/chat/__tests__/slackText.test.ts`

**Interfaces:**
- Consumes: 없음(기존 `buildChatRefCode`, `formatKst`, `escapeSlackText`)
- Produces (모두 export):
  - `interface NoticeParts { headline: string; notes: string[] }` — 큰 줄(mrkdwn) + 설명 줄들(기울임 표시 없는 문장)
  - `bareNote(s: string): string` — `_문장_` → `문장`
  - `interface ContactNoticeArgs { channelLabel: string; handle: string; mode: ContactNoticeMode; followup: boolean; adminUrl: string | null }`
  - `contactNoticeParts(args: ContactNoticeArgs): NoticeParts & { link: string | null }`
  - `interface MessengerClickArgs { channel: ContactChannel; sessionId: string; copyHint: boolean }`
  - `messengerClickParts(args: MessengerClickArgs): NoticeParts`
  - `EVENT_HINT_SENTENCE: string`
  - `interface RoomFirstNoticeArgs { receivedAt: string; sessionId: string; contactNote?: string | null }`
  - `roomFirstNoticeParts(args: RoomFirstNoticeArgs): NoticeParts`, `buildRoomFirstNoticeText(args: RoomFirstNoticeArgs): string`
  - `ROOM_REOPENED_LEAD: string`
  - `escalationNoticeParts(args: { level: 1 | 2 | 3; minutes: number; assigneeMention: string | null }): NoticeParts`
  - `deliveryFailureParts(reason: string): NoticeParts`
- 기존 `buildContactText`·`buildMessengerClickText`·`buildEventHintNote`·`buildRoomVisitorText`·`buildDeliveryFailureText`는 같은 조각을 이어 붙여 **예전과 같은 글자**를 낸다. 바뀌는 글자는 전달 실패 사유 한 문장뿐이다: `…사이드바의 손님 방(chat-…) 본문에…` → `…사이드바의 손님 방(날짜-이름으로 된 방) 본문에…`.

- [ ] **Step 1: 테스트를 더한다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T4-test`

<!-- block: T4-test | diff | slackText.test.ts -->
````diff
diff --git a/liv-clinic/src/lib/chat/__tests__/slackText.test.ts b/liv-clinic/src/lib/chat/__tests__/slackText.test.ts
index ef4b4fd..288c1d8 100644
--- a/liv-clinic/src/lib/chat/__tests__/slackText.test.ts
+++ b/liv-clinic/src/lib/chat/__tests__/slackText.test.ts
@@ -1,5 +1,6 @@
 import { describe, it, expect, afterEach } from 'vitest';
 import {
+  bareNote,
   buildContactText,
   buildDeliveryFailureText,
   buildEscalationText,
@@ -8,17 +9,25 @@ import {
   buildFollowupDigestText,
   buildMessengerClickText,
   buildReplyText,
+  buildRoomFirstNoticeText,
   buildRoomFirstText,
   buildRoomTopic,
   buildRoomVisitorText,
   buildRootText,
   buildTranslationCopyText,
+  contactNoticeParts,
+  deliveryFailureParts,
+  escalationNoticeParts,
+  EVENT_HINT_SENTENCE,
   extractRoomChannelFromFeedText,
   buildFeedReplyMirrorText,
   FOLLOWUP_DIGEST_MAX_LINES,
+  messengerClickParts,
   ROOM_AUTO_ACK_NOTE,
   ROOM_EMAIL_CONTACT_NOTE,
   ROOM_FOOTER,
+  ROOM_REOPENED_LEAD,
+  roomFirstNoticeParts,
   staffChannelLabel,
   type FollowupDigestItem,
 } from '../slackText';
@@ -551,7 +560,7 @@ describe('buildEscalationText', () => {
 describe('buildDeliveryFailureText', () => {
   it('알려진 사유는 한국어로', () => {
     expect(buildDeliveryFailureText('session_not_found')).toBe(
-      '⚠️ 방금 답글이 손님에게 전달되지 않았습니다 · 사유: 이 스레드는 상담과 연결돼 있지 않습니다. 사이드바의 손님 방(chat-…) 본문에 답해 주세요'
+      '⚠️ 방금 답글이 손님에게 전달되지 않았습니다 · 사유: 이 스레드는 상담과 연결돼 있지 않습니다. 사이드바의 손님 방(날짜-이름으로 된 방) 본문에 답해 주세요'
     );
   });
   it('모르는 사유는 코드 그대로', () => {
@@ -564,6 +573,157 @@ describe('buildDeliveryFailureText', () => {
   });
 });
 
+// ── 큰 줄 + 설명 줄 (스펙 2026-10-01 slack-room-look §3.4) — 색 막대에 넣을 조각 ─────────────────
+// 같은 문장을 글자만 올리는 build…Text 가 이어 붙여 쓴다. 위의 기존 기대값이 바뀌지 않는 것이 그 증거다.
+
+describe('bareNote — 기울임 표시를 벗긴다', () => {
+  it('앞뒤 밑줄 하나씩만 벗긴다', () => {
+    expect(bareNote('_설명입니다._')).toBe('설명입니다.');
+    expect(bareNote(ROOM_FOOTER)).toBe(
+      '이 채널에 쓰면 손님에게 번역되어 전달됩니다. 직원끼리 메모는 스레드로 남겨 주세요.'
+    );
+  });
+  it('밑줄이 없으면 그대로', () => {
+    expect(bareNote('그대로')).toBe('그대로');
+  });
+});
+
+describe('contactNoticeParts — 연락처 알림의 조각', () => {
+  it('방: 큰 줄 하나 + 설명 세 줄(기울임 없음), 링크 없음', () => {
+    expect(
+      contactNoticeParts({ channelLabel: 'WeChat', handle: 'abc123', adminUrl: null, mode: 'room', followup: true })
+    ).toEqual({
+      headline: '📱 *손님이 연락처를 남겼습니다* — WeChat: abc123',
+      notes: [
+        "'오늘 연락할 손님'으로 분류했습니다. 5·12·30분 알림은 울리지 않습니다.",
+        '이 방에 한국어로 답을 쓰면 바로 아래에 번역본이 올라옵니다. 복사해서 위챗·왓츠앱·메일에 붙여 넣으세요.',
+        '방에 답을 쓰면 목록에서 빠집니다. 상담이 끝나면 방을 보관(완료)해 주세요.',
+      ],
+      link: null,
+    });
+  });
+  it('긴급 정지 중에는 설명이 한 줄', () => {
+    expect(
+      contactNoticeParts({ channelLabel: '이메일', handle: 'a@b.co', adminUrl: null, mode: 'room', followup: false }).notes
+    ).toEqual(['이 연락처로 먼저 연락해 주세요.']);
+  });
+  it('단독 게시일 때만 관리자 링크가 있다', () => {
+    const args = { channelLabel: 'LINE', handle: 'x', adminUrl: 'https://example.com/admin/chat/abc', followup: true };
+    expect(contactNoticeParts({ ...args, mode: 'standalone' }).link).toBe(
+      '🔗 <https://example.com/admin/chat/abc|관리자 화면에서 열기>'
+    );
+    expect(contactNoticeParts({ ...args, mode: 'room' }).link).toBeNull();
+  });
+  it('핸들의 Slack 마크업을 이스케이프한다', () => {
+    expect(
+      contactNoticeParts({ channelLabel: 'WeChat', handle: '<!channel>', adminUrl: null, mode: 'room', followup: true })
+        .headline
+    ).toBe('📱 *손님이 연락처를 남겼습니다* — WeChat: &lt;!channel&gt;');
+  });
+});
+
+describe('messengerClickParts — 병원 연락 단추 알림의 조각', () => {
+  const sessionId = 'a1b2c3d4-0000-0000-0000-000000000000';
+  it('번역본 안내는 설명 줄로 뺀다', () => {
+    expect(messengerClickParts({ channel: 'whatsapp', sessionId, copyHint: true })).toEqual({
+      headline:
+        '📲 손님이 WhatsApp으로 이어가기를 눌렀습니다 — 병원 WhatsApp에서 코드 #A1B2C3D4 가 담긴 메시지를 확인해 주세요.',
+      notes: ['이 방에 답을 쓰면 번역본이 아래에 올라옵니다.'],
+    });
+  });
+  it('번역본이 올라오지 않는 곳에서는 설명 줄이 없다', () => {
+    expect(messengerClickParts({ channel: 'wechat', sessionId, copyHint: false }).notes).toEqual([]);
+  });
+});
+
+describe('EVENT_HINT_SENTENCE', () => {
+  it('이벤트 안내 알림의 문장 (글자만 올릴 때는 기울임으로 감싼다)', () => {
+    expect(EVENT_HINT_SENTENCE).toBe(
+      '가격 문의로 보여 손님에게 이벤트 링크를 자동으로 보냈습니다. 가격은 직접 답해 주세요.'
+    );
+    expect(buildEventHintNote('https://x.y/z')).toBe(`🎁 _${EVENT_HINT_SENTENCE}_\nhttps://x.y/z`);
+  });
+});
+
+describe('roomFirstNoticeParts — 방의 첫 알림(새 문의)', () => {
+  const base = { receivedAt: '2026-10-01T07:40:00Z', sessionId: '40e56969-aaaa-bbbb-cccc-dddddddddddd' };
+
+  it('큰 줄에 접수 시각과 참조코드, 설명에 사용법과 접수 안내', () => {
+    expect(roomFirstNoticeParts(base)).toEqual({
+      headline: '*새 문의* · 📥 10/01(목) 16:40 KST · 참조코드 `#40E56969`',
+      notes: [
+        '이 채널에 쓰면 손님에게 번역되어 전달됩니다. 직원끼리 메모는 스레드로 남겨 주세요.',
+        '손님에게는 접수 안내(예상 시간·연락처 요청·시술과 방문일 질문)가 자동으로 나갔습니다.',
+      ],
+    });
+  });
+  it('연락처 꼬리말이 있으면 설명이 한 줄 는다', () => {
+    const p = roomFirstNoticeParts({ ...base, contactNote: ROOM_EMAIL_CONTACT_NOTE });
+    expect(p.notes).toHaveLength(3);
+    expect(p.notes[2]).toBe(
+      "이메일을 남긴 손님입니다 — '오늘 연락할 손님'으로 관리되며 재촉 알림은 울리지 않습니다. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다."
+    );
+  });
+  it('글자만 올릴 때: 🔴 머리 + 기울임 설명', () => {
+    expect(buildRoomFirstNoticeText(base)).toBe(
+      `🔴 *새 문의* · 📥 10/01(목) 16:40 KST · 참조코드 #40E56969\n${ROOM_FOOTER}\n${ROOM_AUTO_ACK_NOTE}`
+    );
+    expect(buildRoomFirstNoticeText({ ...base, contactNote: ROOM_EMAIL_CONTACT_NOTE }).endsWith(ROOM_EMAIL_CONTACT_NOTE)).toBe(
+      true
+    );
+  });
+});
+
+describe('ROOM_REOPENED_LEAD', () => {
+  it('손님 후속 글의 🔔 머리말과 같은 문장이다', () => {
+    expect(ROOM_REOPENED_LEAD).toBe('🔔 *완료했던 문의에 손님이 다시 말을 걸었습니다*');
+    expect(
+      buildRoomVisitorText({
+        mention: '<@U1>',
+        receivedAt: '2024-01-01T05:12:00Z',
+        reopened: true,
+        visitorLocale: 'vi',
+        originalText: 'a',
+        translatedText: null,
+      }).startsWith(`${ROOM_REOPENED_LEAD} · <@U1>`)
+    ).toBe(true);
+  });
+});
+
+describe('escalationNoticeParts — 재촉 알림의 조각 (멘션은 넣지 않는다)', () => {
+  it('1단계', () => {
+    expect(escalationNoticeParts({ level: 1, minutes: 5, assigneeMention: '<@U1>' })).toEqual({
+      headline: '⏰ *5분째 답이 없습니다.*',
+      notes: [],
+    });
+  });
+  it('2단계: 담당자가 있으면 전원에게 알리는 사유를 설명 줄로', () => {
+    expect(escalationNoticeParts({ level: 2, minutes: 12, assigneeMention: '<@U1>' })).toEqual({
+      headline: '⏰ *12분째 답이 없습니다.*',
+      notes: ['담당 <@U1> 님이 응답하지 않아 전원에게 알립니다.'],
+    });
+    expect(escalationNoticeParts({ level: 2, minutes: 12, assigneeMention: null }).notes).toEqual([]);
+  });
+  it('3단계: 🚨', () => {
+    expect(escalationNoticeParts({ level: 3, minutes: 30, assigneeMention: null })).toEqual({
+      headline: '🚨 *30분째 미응답입니다.*',
+      notes: [],
+    });
+  });
+});
+
+describe('deliveryFailureParts — 전달 실패 알림의 조각', () => {
+  it('큰 줄 + 사유 한 줄', () => {
+    expect(deliveryFailureParts('empty_text')).toEqual({
+      headline: '⚠️ *방금 답글이 손님에게 전달되지 않았습니다*',
+      notes: ['사유: 내용이 비어 있습니다'],
+    });
+  });
+  it('모르는 사유는 이스케이프한 코드 그대로', () => {
+    expect(deliveryFailureParts('<@U1>').notes).toEqual(['사유: &lt;@U1&gt;']);
+  });
+});
+
 describe('extractRoomChannelFromFeedText', () => {
   it('피드 줄의 첫 채널 링크를 뽑는다', () => {
     expect(extractRoomChannelFromFeedText('🔴 *새 문의* · 익명 · <#C0C0FPY4HC3> · 09/10(목) 00:10 KST')).toBe('C0C0FPY4HC3');
````

- [ ] **Step 2: 실패를 확인한다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/slackText.test.ts 2>&1 | tail -6`
Expected: FAIL — `Tests  19 failed | 58 passed (77)` (새 함수·상수가 아직 없어서 18건 + 바뀐 실패 사유 문구 1건). 기존 58건은 그대로 통과한다.

- [ ] **Step 3: 구현을 바꾼다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T4-impl`

<!-- block: T4-impl | diff | slackText.ts -->
````diff
diff --git a/liv-clinic/src/lib/chat/slackText.ts b/liv-clinic/src/lib/chat/slackText.ts
index 0dfc9f3..9ff3673 100644
--- a/liv-clinic/src/lib/chat/slackText.ts
+++ b/liv-clinic/src/lib/chat/slackText.ts
@@ -91,6 +91,24 @@ function operatorPrefix(senderLabel: string | null): string {
   return `↩️ _관리자 화면 답장${who}_`;
 }
 
+// ── 알림의 조각: 큰 줄 + 설명 줄 (스펙 2026-10-01 slack-room-look §3.4) ─────────────────────
+// 손님 방에서는 slackLook.ts 가 이 조각을 색 막대에 넣는다(큰 줄 = section, 설명 = 작은 회색 글씨).
+// 글자만 올릴 때(스레드 방식·피드·긴급 정지·꾸민 글 실패)는 아래 build…Text 가 같은 조각을 이어 붙인다.
+
+export interface NoticeParts {
+  /** 큰 줄 (mrkdwn) */
+  headline: string;
+  /** 설명 줄들 — 기울임 표시 없는 문장 */
+  notes: string[];
+}
+
+const italic = (s: string): string => `_${s}_`;
+
+/** `_문장_` → `문장`. 기울임으로 감싸 둔 상수(ROOM_FOOTER 등)를 설명 줄로 쓸 때. */
+export function bareNote(s: string): string {
+  return s.replace(/^_/, '').replace(/_$/, '');
+}
+
 // ── 스레드 모드 (현행 문구, 변경 없음) ────────────────────────────────────
 
 /** 루트(첫) 메시지 — 세션 컨텍스트를 헤더로 붙인다. */
@@ -139,61 +157,74 @@ export function buildReplyText(args: {
 /** 연락처 알림이 올라가는 곳: 손님 방 / #해외문의 스레드 / 붙일 곳이 없어 #해외문의에 단독 게시. */
 export type ContactNoticeMode = 'room' | 'thread' | 'standalone';
 
-const FOLLOWUP_CLASSIFIED_NOTE = "_'오늘 연락할 손님'으로 분류했습니다. 5·12·30분 알림은 울리지 않습니다._";
+const FOLLOWUP_CLASSIFIED_NOTE = "'오늘 연락할 손님'으로 분류했습니다. 5·12·30분 알림은 울리지 않습니다.";
 
-/**
- * 손님이 연락처를 남겼을 때 올리는 글 (스펙 2026-10-01 §4.5 b).
- * - followup=false(CHAT_FOLLOWUP=off): '오늘 연락할 손님' 안내를 붙이지 않는다 — 알림이 계속 울리고 번역본도 올라오지 않기 때문이다.
- * - 번역본은 방에만 올라오므로 그 안내는 mode='room'에만 붙인다.
- */
-export function buildContactText(args: {
+export interface ContactNoticeArgs {
   channelLabel: string;
   handle: string;
   mode: ContactNoticeMode;
   followup: boolean;
   /** 단독 게시(mode='standalone')일 때 붙이는 관리자 화면 주소 */
   adminUrl: string | null;
-}): string {
-  const lines = [`📱 *손님이 연락처를 남겼습니다* — ${args.channelLabel}: ${escapeSlackText(args.handle)}`];
+}
+
+/**
+ * 손님이 연락처를 남겼을 때 올리는 글의 조각 (스펙 2026-10-01 §4.5 b).
+ * - followup=false(CHAT_FOLLOWUP=off): '오늘 연락할 손님' 안내를 붙이지 않는다 — 알림이 계속 울리고 번역본도 올라오지 않기 때문이다.
+ * - 번역본은 방에만 올라오므로 그 안내는 mode='room'에만 붙인다.
+ */
+export function contactNoticeParts(args: ContactNoticeArgs): NoticeParts & { link: string | null } {
+  const headline = `📱 *손님이 연락처를 남겼습니다* — ${args.channelLabel}: ${escapeSlackText(args.handle)}`;
+  let notes: string[];
   if (!args.followup) {
-    lines.push('_이 연락처로 먼저 연락해 주세요._');
+    notes = ['이 연락처로 먼저 연락해 주세요.'];
   } else if (args.mode === 'room') {
-    lines.push(
+    notes = [
       FOLLOWUP_CLASSIFIED_NOTE,
-      '_이 방에 한국어로 답을 쓰면 바로 아래에 번역본이 올라옵니다. 복사해서 위챗·왓츠앱·메일에 붙여 넣으세요._',
-      '_방에 답을 쓰면 목록에서 빠집니다. 상담이 끝나면 방을 보관(완료)해 주세요._'
-    );
+      '이 방에 한국어로 답을 쓰면 바로 아래에 번역본이 올라옵니다. 복사해서 위챗·왓츠앱·메일에 붙여 넣으세요.',
+      '방에 답을 쓰면 목록에서 빠집니다. 상담이 끝나면 방을 보관(완료)해 주세요.',
+    ];
   } else if (args.mode === 'thread') {
-    lines.push(FOLLOWUP_CLASSIFIED_NOTE, '_이 스레드에 답글을 쓰면 목록에서 빠집니다._');
+    notes = [FOLLOWUP_CLASSIFIED_NOTE, '이 스레드에 답글을 쓰면 목록에서 빠집니다.'];
   } else {
-    lines.push(FOLLOWUP_CLASSIFIED_NOTE, '_관리자 화면에서 답하면 목록에서 빠집니다._');
+    notes = [FOLLOWUP_CLASSIFIED_NOTE, '관리자 화면에서 답하면 목록에서 빠집니다.'];
   }
-  if (args.mode === 'standalone' && args.adminUrl) {
-    lines.push(`🔗 <${args.adminUrl}|관리자 화면에서 열기>`);
-  }
-  return lines.join('\n');
+  const link = args.mode === 'standalone' && args.adminUrl ? `🔗 <${args.adminUrl}|관리자 화면에서 열기>` : null;
+  return { headline, notes, link };
 }
 
-/**
- * 손님이 카드에서 병원 연락 단추를 눌렀을 때 방/스레드에 올리는 한 줄 (§4.5 b).
- * copyHint = 번역본이 이 방에 올라오는 경우(방 모드 + CHAT_FOLLOWUP 켜짐)에만 그 안내를 붙인다.
- */
-export function buildMessengerClickText(args: {
+/** 연락처 알림을 글자만으로 — 큰 줄, 기울임 설명 줄, (단독 게시면) 관리자 링크. */
+export function buildContactText(args: ContactNoticeArgs): string {
+  const p = contactNoticeParts(args);
+  return [p.headline, ...p.notes.map(italic), ...(p.link ? [p.link] : [])].join('\n');
+}
+
+export interface MessengerClickArgs {
   channel: ContactChannel;
   sessionId: string;
+  /** 번역본이 이 방에 올라오는 경우(방 모드 + CHAT_FOLLOWUP 켜짐)에만 그 안내를 붙인다 */
   copyHint: boolean;
-}): string {
+}
+
+/** 손님이 카드에서 병원 연락 단추를 눌렀을 때 방/스레드에 올리는 글의 조각 (§4.5 b). */
+export function messengerClickParts(args: MessengerClickArgs): NoticeParts {
   const code = `#${buildChatRefCode(args.sessionId)}`;
-  let body: string;
+  let headline: string;
   if (args.channel === 'wechat') {
-    body = `📲 손님이 병원 WeChat 아이디·QR을 확인했습니다 — 업무폰 WeChat에서 친구 요청과 코드 ${code} 메시지를 확인해 주세요.`;
+    headline = `📲 손님이 병원 WeChat 아이디·QR을 확인했습니다 — 업무폰 WeChat에서 친구 요청과 코드 ${code} 메시지를 확인해 주세요.`;
   } else if (args.channel === 'email') {
-    body = `📲 손님이 병원 이메일 주소를 확인했습니다 — ${CHAT_CONTACT_EMAIL} 메일함에서 코드 ${code} 가 담긴 메일을 확인해 주세요.`;
+    headline = `📲 손님이 병원 이메일 주소를 확인했습니다 — ${CHAT_CONTACT_EMAIL} 메일함에서 코드 ${code} 가 담긴 메일을 확인해 주세요.`;
   } else {
     const label = CONTACT_CHANNEL_LABELS[args.channel];
-    body = `📲 손님이 ${label}으로 이어가기를 눌렀습니다 — 병원 ${label}에서 코드 ${code} 가 담긴 메시지를 확인해 주세요.`;
+    headline = `📲 손님이 ${label}으로 이어가기를 눌렀습니다 — 병원 ${label}에서 코드 ${code} 가 담긴 메시지를 확인해 주세요.`;
   }
-  return args.copyHint ? `${body} 이 방에 답을 쓰면 번역본이 아래에 올라옵니다.` : body;
+  return { headline, notes: args.copyHint ? ['이 방에 답을 쓰면 번역본이 아래에 올라옵니다.'] : [] };
+}
+
+/** 단추 알림을 글자만으로 — 한 줄. */
+export function buildMessengerClickText(args: MessengerClickArgs): string {
+  const p = messengerClickParts(args);
+  return [p.headline, ...p.notes].join(' ');
 }
 
 /** 직원 답글의 번역본 — 번역문만 담는다. 휴대폰 Slack의 "텍스트 복사"가 메시지 전체를 복사하므로 머리말·꾸밈을 붙이지 않는다 (§4.5 d). */
@@ -201,9 +232,11 @@ export function buildTranslationCopyText(translated: string): string {
   return escapeSlackText(translated);
 }
 
+export const EVENT_HINT_SENTENCE = '가격 문의로 보여 손님에게 이벤트 링크를 자동으로 보냈습니다. 가격은 직접 답해 주세요.';
+
 /** 가격 문의에 이벤트 링크가 자동으로 나갔음을 직원에게 알린다 (§4.10). */
 export function buildEventHintNote(url: string): string {
-  return ['🎁 _가격 문의로 보여 손님에게 이벤트 링크를 자동으로 보냈습니다. 가격은 직접 답해 주세요._', url].join('\n');
+  return [`🎁 ${italic(EVENT_HINT_SENTENCE)}`, url].join('\n');
 }
 
 // ── 방 모드 ─────────────────────────────────────────────────────────────
@@ -267,6 +300,34 @@ export function buildRoomFirstText(args: {
   return lines.join('\n');
 }
 
+export interface RoomFirstNoticeArgs {
+  receivedAt: string;
+  sessionId: string;
+  /** 연락처가 이미 있는 손님이면 ROOM_EMAIL_CONTACT_NOTE */
+  contactNote?: string | null;
+}
+
+/**
+ * 방의 첫 알림(새 문의)의 조각 — 손님 글을 손님 이름표로 따로 올릴 때 그 바로 뒤에 붙는다 (slack-room-look §3.4).
+ * 참조코드는 방 이름에서 빠졌으므로 여기와 방 주제에 남긴다(검색으로 방을 찾는다). 백틱 = 코드 글씨.
+ */
+export function roomFirstNoticeParts(args: RoomFirstNoticeArgs): NoticeParts {
+  const code = buildChatRefCode(args.sessionId);
+  const notes = [bareNote(ROOM_FOOTER), bareNote(ROOM_AUTO_ACK_NOTE)];
+  if (args.contactNote) notes.push(bareNote(args.contactNote));
+  return { headline: `*새 문의* · 📥 ${formatKst(args.receivedAt)} · 참조코드 \`#${code}\``, notes };
+}
+
+/** 첫 알림을 글자만으로 — 꾸민 알림이 거부됐을 때만 쓴다(손님 글은 이미 이름표로 올라가 있다). */
+export function buildRoomFirstNoticeText(args: RoomFirstNoticeArgs): string {
+  const code = buildChatRefCode(args.sessionId);
+  const lines = [`🔴 *새 문의* · 📥 ${formatKst(args.receivedAt)} · 참조코드 #${code}`, ROOM_FOOTER, ROOM_AUTO_ACK_NOTE];
+  if (args.contactNote) lines.push(args.contactNote);
+  return lines.join('\n');
+}
+
+export const ROOM_REOPENED_LEAD = '🔔 *완료했던 문의에 손님이 다시 말을 걸었습니다*';
+
 /** 방의 손님 후속 메시지: 담당자(또는 전원) 멘션 + 시각 + 본문. reopened면 🔔 머리말 */
 export function buildRoomVisitorText(args: {
   mention: string;
@@ -276,7 +337,7 @@ export function buildRoomVisitorText(args: {
   originalText: string;
   translatedText: string | null;
 }): string {
-  const lead = args.reopened ? '🔔 *완료했던 문의에 손님이 다시 말을 걸었습니다*' : null;
+  const lead = args.reopened ? ROOM_REOPENED_LEAD : null;
   const head = joinHead([lead, args.mention, formatKstTime(args.receivedAt)]);
   return [
     head,
@@ -337,14 +398,38 @@ export function buildEscalationText(args: {
   return `⏰ ${args.mention} ${args.minutes}분째 답이 없습니다.`;
 }
 
+/**
+ * 재촉 알림의 조각 — 손님 방의 빨간 막대에 넣는다. 멘션은 여기 넣지 않는다:
+ * 막대 안의 멘션이 알림을 만드는지 확인하지 못했으므로 호출자가 최상위 text에 따로 둔다 (slack-room-look §3.3).
+ */
+export function escalationNoticeParts(args: {
+  level: 1 | 2 | 3;
+  minutes: number;
+  assigneeMention: string | null;
+}): NoticeParts {
+  if (args.level === 3) return { headline: `🚨 *${args.minutes}분째 미응답입니다.*`, notes: [] };
+  const notes =
+    args.level === 2 && args.assigneeMention
+      ? [`담당 ${args.assigneeMention} 님이 응답하지 않아 전원에게 알립니다.`]
+      : [];
+  return { headline: `⏰ *${args.minutes}분째 답이 없습니다.*`, notes };
+}
+
 const FAILURE_REASON_KO: Record<string, string> = {
-  session_not_found: '이 스레드는 상담과 연결돼 있지 않습니다. 사이드바의 손님 방(chat-…) 본문에 답해 주세요',
+  session_not_found: '이 스레드는 상담과 연결돼 있지 않습니다. 사이드바의 손님 방(날짜-이름으로 된 방) 본문에 답해 주세요',
   empty_text: '내용이 비어 있습니다',
   error: '서버 오류가 났습니다. 관리자 화면에서 다시 보내 주세요',
 };
 
+const failureReason = (reason: string): string => FAILURE_REASON_KO[reason] ?? escapeSlackText(reason);
+
 export function buildDeliveryFailureText(reason: string): string {
-  return `⚠️ 방금 답글이 손님에게 전달되지 않았습니다 · 사유: ${FAILURE_REASON_KO[reason] ?? escapeSlackText(reason)}`;
+  return `⚠️ 방금 답글이 손님에게 전달되지 않았습니다 · 사유: ${failureReason(reason)}`;
+}
+
+/** 전달 실패 알림의 조각 — 손님 방의 빨간 막대에 넣는다. */
+export function deliveryFailureParts(reason: string): NoticeParts {
+  return { headline: '⚠️ *방금 답글이 손님에게 전달되지 않았습니다*', notes: [`사유: ${failureReason(reason)}`] };
 }
 
 // ── "오늘 연락할 손님" 하루 두 번 요약 (스펙 2026-10-01 §4.5 c) ────────────────
````

- [ ] **Step 4: 통과·전체 테스트·타입 검사·lint**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/slackText.test.ts 2>&1 | tail -4 && npx vitest run 2>&1 | tail -6 && npx tsc --noEmit && echo TSC-OK && npx eslint src/lib/chat/slackText.ts src/lib/chat/__tests__/slackText.test.ts && echo LINT-OK
```
Expected: `Tests  77 passed (77)`, 이어서 `Test Files  59 passed (59)`, `Tests  923 passed (923)`, `TSC-OK`, `LINT-OK`. 기존 기대값(예: `buildContactText`의 세 줄 기울임 문구)이 하나도 바뀌지 않고 통과하는 것이 "글자 문구가 그대로"라는 증거다.

- [ ] **Step 5: 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git add liv-clinic/src/lib/chat/slackText.ts liv-clinic/src/lib/chat/__tests__/slackText.test.ts && git commit -m "feat(chat): Slack 알림 문구를 큰 줄·설명 줄 조각으로 나누고 실패 안내의 방 이름 예시를 고친다" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 6: 대조**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms" && for f in liv-clinic/src/lib/chat/slackText.ts liv-clinic/src/lib/chat/__tests__/slackText.test.ts; do echo "$(git rev-parse HEAD:$f)  $f"; done
```
Expected:

| 파일 | 나와야 하는 값 |
|------|----------------|
| `liv-clinic/src/lib/chat/slackText.ts` | `9ff36739308894f00bb2a6dc65248311d5b2ffc9` |
| `liv-clinic/src/lib/chat/__tests__/slackText.test.ts` | `288c1d8ebfe36555fcbbd34b2bba51da07ab4c9f` |

---

### Task 5: 이름표·색 막대 — `slackLook.ts`

**Files:**
- Create: `liv-clinic/src/lib/chat/slackLook.ts`
- Test: `liv-clinic/src/lib/chat/__tests__/slackLook.test.ts`

**Interfaces:**
- Consumes: Task 3의 `SlackAttachment`·`SlackBlock`·`SlackLook`·`escapeSlackText`, Task 4의 조각 함수들과 기존 `build…Text`·`buildBodyLines`·`localeKoName`
- Produces (모두 export, 순수 함수):
  - `interface StyledMessage extends SlackLook { text: string; plainText: string }` — `text`는 최상위 글(멘션 포함, 막대만 있는 알림은 `''`), `plainText`는 꾸민 글을 못 올릴 때의 글자 문구
  - `BAR_COLOR = { info: '#a8a6a8', contact: '#2e9e6b', alert: '#d8452f' }`, `type BarKind`
  - `NOTICE_LOOK = { username: 'LIV 알림', iconEmoji: ':bell:' }`, `COPY_LOOK = { username: '번역본 · 복사용', iconEmoji: ':clipboard:' }`
  - `cleanUsername(raw: string): string`, `visitorLook(s: { visitorName: string | null; visitorLocale: string }): SlackLook`
  - `bar(kind: BarKind, parts: NoticeParts): SlackAttachment`
  - `styledRoomFirstVisitor(args: { session: { visitorName: string | null; visitorLocale: string }; mentionAll: string; receivedAt: string; originalText: string; translatedText: string | null; contactNote?: string | null }): StyledMessage`
  - `styledRoomFirstNotice(args: RoomFirstNoticeArgs): StyledMessage`
  - `styledRoomVisitor(args: { session: …; mention: string; receivedAt: string; reopened: boolean; originalText: string; translatedText: string | null }): StyledMessage`
  - `styledReopenedNotice(): StyledMessage`
  - `styledAdminReply(args: { senderLabel: string | null; visitorLocale: string; originalText: string; translatedText: string | null }): StyledMessage`
  - `styledFeedReplyCopy(args: { senderLabel: string | null; text: string }): StyledMessage`
  - `styledTranslationCopy(translated: string): StyledMessage`
  - `styledContactNotice(args: ContactNoticeArgs): StyledMessage`, `styledMessengerClick(args: MessengerClickArgs): StyledMessage`, `styledEventHint(url: string): StyledMessage`
  - `styledEscalation(args: { level: 1 | 2 | 3; minutes: number; mention: string; assigneeMention: string | null }): StyledMessage`
  - `styledDeliveryFailure(reason: string): StyledMessage`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T5-test`

<!-- block: T5-test | full | liv-clinic/src/lib/chat/__tests__/slackLook.test.ts -->
````ts
import { describe, it, expect } from 'vitest';
import {
  BAR_COLOR,
  bar,
  cleanUsername,
  COPY_LOOK,
  NOTICE_LOOK,
  styledAdminReply,
  styledContactNotice,
  styledDeliveryFailure,
  styledEscalation,
  styledEventHint,
  styledFeedReplyCopy,
  styledMessengerClick,
  styledReopenedNotice,
  styledRoomFirstNotice,
  styledRoomFirstVisitor,
  styledRoomVisitor,
  styledTranslationCopy,
  visitorLook,
} from '../slackLook';
import {
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
  ROOM_EMAIL_CONTACT_NOTE,
  ROOM_REOPENED_LEAD,
} from '../slackText';

const YUKI = { visitorName: 'Yuki Tanaka', visitorLocale: 'ja' };
const SESSION_ID = '40e56969-aaaa-bbbb-cccc-dddddddddddd';
// 2026-10-01(목) 16:40 KST
const AT = '2026-10-01T07:40:00Z';
const BODY = { originalText: 'ウルセラの料金はいくらですか？', translatedText: '울쎄라 가격이 얼마인가요?' };

describe('cleanUsername — 이름표에 쓸 글자', () => {
  it('줄바꿈·탭·제어 문자를 공백 하나로 줄이고 앞뒤를 자른다', () => {
    expect(cleanUsername('  Yuki\n\tTanaka\u0007 ')).toBe('Yuki Tanaka');
  });
  it('70글자에서 자른다 (한글도 글자 수로)', () => {
    expect(Array.from(cleanUsername('가'.repeat(100)))).toHaveLength(70);
  });
});

describe('visitorLook — 손님 글의 이름표', () => {
  it('이름 + 손님, 로케일의 국기', () => {
    expect(visitorLook(YUKI)).toEqual({ username: 'Yuki Tanaka 손님', iconEmoji: ':flag-jp:' });
  });
  it('이름이 없으면 언어 이름으로 부른다', () => {
    expect(visitorLook({ visitorName: null, visitorLocale: 'en' })).toEqual({
      username: '영어 손님',
      iconEmoji: ':flag-gb:',
    });
    expect(visitorLook({ visitorName: '   ', visitorLocale: 'zh-TW' }).username).toBe('중국어(번체) 손님');
  });
  it('열 개 로케일 모두 국기가 있다. 모르는 로케일은 지구본', () => {
    const icons = ['en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'].map(
      (l) => visitorLook({ visitorName: 'A', visitorLocale: l }).iconEmoji
    );
    expect(icons).toEqual([
      ':flag-gb:',
      ':flag-jp:',
      ':flag-cn:',
      ':flag-tw:',
      ':flag-vn:',
      ':flag-th:',
      ':flag-ru:',
      ':flag-fr:',
      ':flag-mn:',
      ':flag-sa:',
    ]);
    expect(visitorLook({ visitorName: 'A', visitorLocale: 'xx' }).iconEmoji).toBe(':globe_with_meridians:');
  });
  it('이름의 줄바꿈은 공백으로', () => {
    expect(visitorLook({ visitorName: 'Yuki\nTanaka', visitorLocale: 'ja' }).username).toBe('Yuki Tanaka 손님');
  });
});

describe('bar — 색 막대 하나', () => {
  it('큰 줄은 section, 설명 줄은 context 요소 하나씩', () => {
    expect(bar('contact', { headline: '📱 *큰 줄* `코드`', notes: ['설명 1', '설명 2'] })).toEqual({
      color: '#2e9e6b',
      fallback: '📱 큰 줄 코드',
      blocks: [
        { type: 'section', text: { type: 'mrkdwn', text: '📱 *큰 줄* `코드`' } },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: '설명 1' },
            { type: 'mrkdwn', text: '설명 2' },
          ],
        },
      ],
    });
  });
  it('설명 줄이 없으면 context 블록을 넣지 않는다', () => {
    expect(bar('alert', { headline: '⏰ *5분째 답이 없습니다.*', notes: [] }).blocks).toHaveLength(1);
  });
  it('색은 세 가지', () => {
    expect(BAR_COLOR).toEqual({ info: '#a8a6a8', contact: '#2e9e6b', alert: '#d8452f' });
  });
});

describe('손님 글 (1·3)', () => {
  it('첫 글: 손님 이름표, 멘션 줄 + 번역 + 원문. 글자만 문구는 지금까지의 첫 글 전체', () => {
    const m = styledRoomFirstVisitor({ session: YUKI, mentionAll: '<@U1> <@U2>', receivedAt: AT, ...BODY });
    expect(m.username).toBe('Yuki Tanaka 손님');
    expect(m.iconEmoji).toBe(':flag-jp:');
    expect(m.text).toBe('<@U1> <@U2>\n울쎄라 가격이 얼마인가요?\n> _원문:_ ウルセラの料金はいくらですか？');
    expect(m.attachments).toBeUndefined();
    expect(m.plainText).toBe(
      buildRoomFirstText({ mentionAll: '<@U1> <@U2>', receivedAt: AT, visitorLocale: 'ja', ...BODY })
    );
  });
  it('첫 글: 연락처 꼬리말은 글자만 문구에만 들어간다 (꾸민 글에서는 알림 쪽에 붙는다)', () => {
    const m = styledRoomFirstVisitor({
      session: YUKI,
      mentionAll: '<@U1>',
      receivedAt: AT,
      contactNote: ROOM_EMAIL_CONTACT_NOTE,
      ...BODY,
    });
    expect(m.text).not.toContain('이메일을 남긴 손님입니다');
    expect(m.plainText.endsWith(ROOM_EMAIL_CONTACT_NOTE)).toBe(true);
  });
  it('멘션 대상이 없으면 멘션 줄을 뺀다', () => {
    const m = styledRoomFirstVisitor({ session: YUKI, mentionAll: '', receivedAt: AT, ...BODY });
    expect(m.text.split('\n')[0]).toBe('울쎄라 가격이 얼마인가요?');
  });
  it('후속 글: 담당자 멘션 줄 + 본문, 시각 글자는 없다', () => {
    const m = styledRoomVisitor({ session: YUKI, mention: '<@U1>', receivedAt: AT, reopened: false, ...BODY });
    expect(m.username).toBe('Yuki Tanaka 손님');
    expect(m.text).toBe('<@U1>\n울쎄라 가격이 얼마인가요?\n> _원문:_ ウルセラの料金はいくらですか？');
    expect(m.text).not.toContain('KST');
    expect(m.plainText).toBe(
      buildRoomVisitorText({ mention: '<@U1>', receivedAt: AT, reopened: false, visitorLocale: 'ja', ...BODY })
    );
  });
  it('재발신: 🔔 머리말은 글자만 문구에만 들어간다', () => {
    const m = styledRoomVisitor({ session: YUKI, mention: '<@U1>', receivedAt: AT, reopened: true, ...BODY });
    expect(m.text).not.toContain('🔔');
    expect(m.plainText.startsWith(ROOM_REOPENED_LEAD)).toBe(true);
  });
  it('손님 글의 Slack 마크업은 이스케이프된다', () => {
    const m = styledRoomVisitor({
      session: YUKI,
      mention: '',
      receivedAt: AT,
      reopened: false,
      originalText: '<!channel> hi',
      translatedText: null,
    });
    expect(m.text).toBe('&lt;!channel&gt; hi');
  });
});

describe('알림 (2·4·8·9·10·11·12·13) — LIV 알림 + 색 막대', () => {
  it('첫 알림: 회색, 큰 줄에 접수 시각과 참조코드', () => {
    const m = styledRoomFirstNotice({ sessionId: SESSION_ID, receivedAt: AT });
    expect(m.username).toBe('LIV 알림');
    expect(m.iconEmoji).toBe(':bell:');
    expect(m.text).toBe('');
    expect(m.attachments).toHaveLength(1);
    expect(m.attachments![0].color).toBe(BAR_COLOR.info);
    expect(m.attachments![0].blocks[0]).toEqual({
      type: 'section',
      text: { type: 'mrkdwn', text: '*새 문의* · 📥 10/01(목) 16:40 KST · 참조코드 `#40E56969`' },
    });
    expect(m.attachments![0].fallback).toBe('새 문의 · 📥 10/01(목) 16:40 KST · 참조코드 #40E56969');
    expect(m.plainText).toBe(buildRoomFirstNoticeText({ sessionId: SESSION_ID, receivedAt: AT }));
  });
  it('첫 알림: 연락처 꼬리말이 있으면 설명이 세 줄', () => {
    const m = styledRoomFirstNotice({ sessionId: SESSION_ID, receivedAt: AT, contactNote: ROOM_EMAIL_CONTACT_NOTE });
    expect(m.attachments![0].blocks[1].elements as unknown[]).toHaveLength(3);
  });
  it('재발신 알림: 회색, 설명 없음', () => {
    const m = styledReopenedNotice();
    expect(m).toMatchObject({ ...NOTICE_LOOK, text: '', plainText: ROOM_REOPENED_LEAD });
    expect(m.attachments![0].color).toBe(BAR_COLOR.info);
    expect(m.attachments![0].blocks).toEqual([{ type: 'section', text: { type: 'mrkdwn', text: ROOM_REOPENED_LEAD } }]);
  });
  it('연락처 남김: 초록, 설명 세 줄(기울임 없음)', () => {
    const args = { channelLabel: '이메일', handle: 'yuki.t@example.com', mode: 'room' as const, followup: true, adminUrl: null };
    const m = styledContactNotice(args);
    expect(m).toMatchObject({ ...NOTICE_LOOK, text: '', plainText: buildContactText(args) });
    expect(m.attachments![0].color).toBe(BAR_COLOR.contact);
    expect(m.attachments![0].blocks[0]).toEqual({
      type: 'section',
      text: { type: 'mrkdwn', text: '📱 *손님이 연락처를 남겼습니다* — 이메일: yuki.t@example.com' },
    });
    const notes = (m.attachments![0].blocks[1].elements as Array<{ text: string }>).map((e) => e.text);
    expect(notes).toHaveLength(3);
    expect(notes.every((n) => !n.startsWith('_'))).toBe(true);
  });
  it('병원 연락 단추: 초록, 번역본 안내는 설명 줄', () => {
    const args = { channel: 'whatsapp' as const, sessionId: SESSION_ID, copyHint: true };
    const m = styledMessengerClick(args);
    expect(m.attachments![0].color).toBe(BAR_COLOR.contact);
    expect(m.attachments![0].blocks).toHaveLength(2);
    expect(m.plainText).toBe(buildMessengerClickText(args));
  });
  it('이벤트 링크 안내: 회색, 문장 다음 줄에 링크', () => {
    const url = 'https://liv-clinic.net/ja/events/2026-10-promotion';
    const m = styledEventHint(url);
    expect(m.attachments![0].color).toBe(BAR_COLOR.info);
    expect(m.attachments![0].blocks).toEqual([
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🎁 가격 문의로 보여 손님에게 이벤트 링크를 자동으로 보냈습니다. 가격은 직접 답해 주세요.\n${url}`,
        },
      },
    ]);
    expect(m.plainText).toBe(buildEventHintNote(url));
  });
  it('재촉: 멘션은 최상위 text, 문장은 빨간 막대', () => {
    const args = { level: 1 as const, minutes: 5, mention: '<@U1> <@U2>', assigneeMention: null };
    const m = styledEscalation(args);
    expect(m).toMatchObject({ ...NOTICE_LOOK, text: '<@U1> <@U2>', plainText: buildEscalationText(args) });
    expect(m.attachments![0].color).toBe(BAR_COLOR.alert);
    expect(m.attachments![0].blocks).toEqual([
      { type: 'section', text: { type: 'mrkdwn', text: '⏰ *5분째 답이 없습니다.*' } },
    ]);
  });
  it('12분 재촉: 담당자가 답하지 않았다는 사유가 설명 줄', () => {
    const m = styledEscalation({ level: 2, minutes: 12, mention: '<@U1> <@U2>', assigneeMention: '<@U1>' });
    expect(m.attachments![0].blocks[1]).toEqual({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: '담당 <@U1> 님이 응답하지 않아 전원에게 알립니다.' }],
    });
  });
  it('30분 재촉: 🚨', () => {
    const m = styledEscalation({ level: 3, minutes: 30, mention: '<@U1>', assigneeMention: null });
    expect(m.attachments![0].blocks[0]).toEqual({
      type: 'section',
      text: { type: 'mrkdwn', text: '🚨 *30분째 미응답입니다.*' },
    });
  });
  it('전달 실패: 빨강, 사유는 설명 줄', () => {
    const m = styledDeliveryFailure('empty_text');
    expect(m).toMatchObject({ ...NOTICE_LOOK, text: '', plainText: buildDeliveryFailureText('empty_text') });
    expect(m.attachments![0].color).toBe(BAR_COLOR.alert);
    expect(m.attachments![0].blocks[1]).toEqual({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: '사유: 내용이 비어 있습니다' }],
    });
  });
});

describe('직원 답의 사본과 번역본 (5·6·7)', () => {
  it('관리자 화면 답장: 작성자 이름표, 한국어 원문 + 전달된 번역', () => {
    const args = {
      senderLabel: 'admin@livps.co.kr',
      visitorLocale: 'ja',
      originalText: '안녕하세요, 리브성형외과입니다.',
      translatedText: 'こんにちは、LIV美容クリニックです。',
    };
    const m = styledAdminReply(args);
    expect(m.username).toBe('admin@livps.co.kr · 관리자 화면에서 답함');
    expect(m.iconEmoji).toBe(':leftwards_arrow_with_hook:');
    expect(m.text).toBe('안녕하세요, 리브성형외과입니다.\n> _ja 전달:_ こんにちは、LIV美容クリニックです。');
    expect(m.attachments).toBeUndefined();
    expect(m.plainText).toBe(buildReplyText({ sender: 'operator', ...args }));
  });
  it('관리자 화면 답장: 작성자를 모르면 이름표에 설명만', () => {
    expect(
      styledAdminReply({ senderLabel: null, visitorLocale: 'ja', originalText: '안녕하세요', translatedText: null }).username
    ).toBe('관리자 화면에서 답함');
  });
  it('피드 답장 사본: 작성자 이름표, 본문은 답장 글', () => {
    const m = styledFeedReplyCopy({ senderLabel: '유다영', text: '안녕하세요 <b> & 리브' });
    expect(m.username).toBe('유다영 · 피드에서 답함');
    expect(m.iconEmoji).toBe(':leftwards_arrow_with_hook:');
    expect(m.text).toBe('안녕하세요 &lt;b&gt; &amp; 리브');
    expect(m.plainText).toBe(buildFeedReplyMirrorText({ senderLabel: '유다영', text: '안녕하세요 <b> & 리브' }));
    expect(styledFeedReplyCopy({ senderLabel: null, text: 'a' }).username).toBe('피드에서 답함');
  });
  it('번역본: 이름표만 붙고 본문은 번역문 그대로 (꾸민 글·글자만 글이 같다)', () => {
    const m = styledTranslationCopy('您好，价格是100万韩元。');
    expect(m).toEqual({ ...COPY_LOOK, text: '您好，价格是100万韩元。', plainText: '您好，价格是100万韩元。' });
    expect(COPY_LOOK).toEqual({ username: '번역본 · 복사용', iconEmoji: ':clipboard:' });
  });
});
````

- [ ] **Step 2: 실패를 확인한다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/slackLook.test.ts 2>&1 | tail -8`
Expected: FAIL — `Error: Cannot find module '../slackLook'`, `Test Files  1 failed (1)`, `Tests  no tests`.

- [ ] **Step 3: 구현을 쓴다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T5-impl`

<!-- block: T5-impl | full | liv-clinic/src/lib/chat/slackLook.ts -->
````ts
import 'server-only';
import { escapeSlackText, type SlackAttachment, type SlackBlock, type SlackLook } from '@/lib/chat/slack';
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
  contactNoticeParts,
  deliveryFailureParts,
  escalationNoticeParts,
  EVENT_HINT_SENTENCE,
  localeKoName,
  messengerClickParts,
  ROOM_REOPENED_LEAD,
  roomFirstNoticeParts,
  type ContactNoticeArgs,
  type MessengerClickArgs,
  type NoticeParts,
  type RoomFirstNoticeArgs,
} from '@/lib/chat/slackText';

// 손님 방 안의 글 모양 (스펙 2026-10-01 slack-room-look §3.2~§3.4). 순수 함수 — I/O 없음.
// 문구는 slackText.ts가 만든다. 여기서는 보낸 사람 이름표·아이콘·색 막대만 정하고,
// 꾸민 글을 못 올릴 때 대신 올릴 글자만의 문구(plainText = 지금까지 운영하던 문구)를 함께 묶는다.
//
// 멘션은 색 막대 안에 넣지 않는다 — 막대 안의 멘션이 알림을 만드는지 확인하지 못했다. 항상 최상위 text에 둔다.
// 손님 글에는 막대를 붙이지 않는다 — 막대 안의 긴 글은 "더 보기"로 접힌다.

export interface StyledMessage extends SlackLook {
  /** 최상위 text — 화면에 그대로 보이고 멘션 알림에 쓰인다. 색 막대만 있는 알림은 '' */
  text: string;
  /** 꾸민 글을 못 올렸을 때(또는 SLACK_ROOM_LOOK=off) 대신 올리는 글자만의 문구 */
  plainText: string;
}

export const BAR_COLOR = {
  /** 자동 안내 — 새 문의 접수, 이벤트 링크 발송, 다시 말을 걸었음 */
  info: '#a8a6a8',
  /** 손님 쪽 연락 — 연락처 남김, 병원 연락 단추 누름 */
  contact: '#2e9e6b',
  /** 재촉, 전달 실패 */
  alert: '#d8452f',
} as const;
export type BarKind = keyof typeof BAR_COLOR;

export const NOTICE_LOOK: SlackLook = { username: 'LIV 알림', iconEmoji: ':bell:' };
export const COPY_LOOK: SlackLook = { username: '번역본 · 복사용', iconEmoji: ':clipboard:' };

const STAFF_COPY_ICON = ':leftwards_arrow_with_hook:';
const UNKNOWN_LOCALE_ICON = ':globe_with_meridians:';
const USERNAME_MAX = 70;

// slackText.ts의 LOCALE_FLAG와 같은 나라 (영어 = 영국기 관례). Slack 아이콘은 단축 이름으로 준다.
const LOCALE_ICON: Record<string, string> = {
  en: ':flag-gb:',
  ja: ':flag-jp:',
  zh: ':flag-cn:',
  'zh-TW': ':flag-tw:',
  vi: ':flag-vn:',
  th: ':flag-th:',
  ru: ':flag-ru:',
  fr: ':flag-fr:',
  mn: ':flag-mn:',
  ar: ':flag-sa:',
};

/** 이름표에 쓸 글자: 줄바꿈·탭·제어 문자를 공백 하나로 줄이고 70글자에서 자른다. */
export function cleanUsername(raw: string): string {
  const flat = Array.from(raw)
    .map((ch) => (ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127 ? ' ' : ch))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  return Array.from(flat).slice(0, USERNAME_MAX).join('').trim();
}

interface VisitorIdentity {
  visitorName: string | null;
  visitorLocale: string;
}

/** 손님 글의 이름표: `{이름} 손님` + 로케일의 국기. 이름이 없으면 `{언어 이름} 손님`. */
export function visitorLook(s: VisitorIdentity): SlackLook {
  const name = cleanUsername(s.visitorName ?? '');
  return {
    username: cleanUsername(`${name || localeKoName(s.visitorLocale)} 손님`),
    iconEmoji: LOCALE_ICON[s.visitorLocale] ?? UNKNOWN_LOCALE_ICON,
  };
}

function staffCopyLook(senderLabel: string | null, where: string): SlackLook {
  const who = cleanUsername(senderLabel ?? '');
  return { username: cleanUsername(who ? `${who} · ${where}` : where), iconEmoji: STAFF_COPY_ICON };
}

/** 색 막대 하나: 큰 줄(section) + 설명 줄(context — 작은 회색 글씨). fallback은 알림 미리보기용 글자. */
export function bar(kind: BarKind, parts: NoticeParts): SlackAttachment {
  const blocks: SlackBlock[] = [{ type: 'section', text: { type: 'mrkdwn', text: parts.headline } }];
  if (parts.notes.length > 0) {
    blocks.push({ type: 'context', elements: parts.notes.map((n) => ({ type: 'mrkdwn', text: n })) });
  }
  return { color: BAR_COLOR[kind], fallback: parts.headline.replace(/[*`]/g, ''), blocks };
}

function notice(kind: BarKind, parts: NoticeParts, plainText: string, text = ''): StyledMessage {
  return { ...NOTICE_LOOK, text, attachments: [bar(kind, parts)], plainText };
}

const joinLines = (lines: string[]): string => lines.filter((l) => l.length > 0).join('\n');

interface VisitorBody {
  originalText: string;
  translatedText: string | null;
}

// ── 손님 글 ─────────────────────────────────────────────────────────────

/** 방의 첫 손님 글. 글자만 문구는 지금까지의 첫 글 전체다(새 문의 머리말·꼬리말 포함) — 그때는 첫 알림을 따로 올리지 않는다. */
export function styledRoomFirstVisitor(
  args: VisitorBody & {
    session: VisitorIdentity;
    mentionAll: string;
    receivedAt: string;
    /** 연락처가 이미 있는 손님이면 ROOM_EMAIL_CONTACT_NOTE — 꾸민 글에서는 첫 알림 쪽에 붙는다 */
    contactNote?: string | null;
  }
): StyledMessage {
  const body = {
    visitorLocale: args.session.visitorLocale,
    originalText: args.originalText,
    translatedText: args.translatedText,
  };
  return {
    ...visitorLook(args.session),
    text: joinLines([args.mentionAll, ...buildBodyLines({ sender: 'visitor', ...body })]),
    plainText: buildRoomFirstText({
      mentionAll: args.mentionAll,
      receivedAt: args.receivedAt,
      contactNote: args.contactNote,
      ...body,
    }),
  };
}

/** 첫 손님 글 바로 뒤의 새 문의 알림 — 접수 시각·참조코드·사용법. */
export function styledRoomFirstNotice(args: RoomFirstNoticeArgs): StyledMessage {
  return notice('info', roomFirstNoticeParts(args), buildRoomFirstNoticeText(args));
}

/** 손님 후속 글. 시각 글자는 넣지 않는다(Slack이 글마다 보여 준다). reopened의 🔔 머리말은 글자만 문구에만 들어간다. */
export function styledRoomVisitor(
  args: VisitorBody & { session: VisitorIdentity; mention: string; receivedAt: string; reopened: boolean }
): StyledMessage {
  const body = {
    visitorLocale: args.session.visitorLocale,
    originalText: args.originalText,
    translatedText: args.translatedText,
  };
  return {
    ...visitorLook(args.session),
    text: joinLines([args.mention, ...buildBodyLines({ sender: 'visitor', ...body })]),
    plainText: buildRoomVisitorText({
      mention: args.mention,
      receivedAt: args.receivedAt,
      reopened: args.reopened,
      ...body,
    }),
  };
}

/** 완료(보관)했던 방에 손님이 다시 썼을 때, 손님 글 뒤에 붙는 알림. */
export function styledReopenedNotice(): StyledMessage {
  return notice('info', { headline: ROOM_REOPENED_LEAD, notes: [] }, ROOM_REOPENED_LEAD);
}

// ── 직원 답의 사본, 번역본 ─────────────────────────────────────────────────

/** 관리자 화면에서 쓴 직원 답의 사본. */
export function styledAdminReply(
  args: VisitorBody & { senderLabel: string | null; visitorLocale: string }
): StyledMessage {
  const body = {
    visitorLocale: args.visitorLocale,
    originalText: args.originalText,
    translatedText: args.translatedText,
  };
  return {
    ...staffCopyLook(args.senderLabel, '관리자 화면에서 답함'),
    text: joinLines(buildBodyLines({ sender: 'operator', ...body })),
    plainText: buildReplyText({ sender: 'operator', senderLabel: args.senderLabel, ...body }),
  };
}

/** #해외문의 피드 스레드에 쓴 직원 답을 손님 방에 남기는 사본. */
export function styledFeedReplyCopy(args: { senderLabel: string | null; text: string }): StyledMessage {
  return {
    ...staffCopyLook(args.senderLabel, '피드에서 답함'),
    text: escapeSlackText(args.text),
    plainText: buildFeedReplyMirrorText(args),
  };
}

/** 직원 답글의 번역본. 본문은 번역문만 — 휴대폰의 "텍스트 복사"가 본문 전체를 복사한다. 이름표는 복사되지 않는다. */
export function styledTranslationCopy(translated: string): StyledMessage {
  const text = buildTranslationCopyText(translated);
  return { ...COPY_LOOK, text, plainText: text };
}

// ── 알림 ────────────────────────────────────────────────────────────────

export function styledContactNotice(args: ContactNoticeArgs): StyledMessage {
  return notice('contact', contactNoticeParts(args), buildContactText(args));
}

export function styledMessengerClick(args: MessengerClickArgs): StyledMessage {
  return notice('contact', messengerClickParts(args), buildMessengerClickText(args));
}

export function styledEventHint(url: string): StyledMessage {
  return notice('info', { headline: `🎁 ${EVENT_HINT_SENTENCE}\n${url}`, notes: [] }, buildEventHintNote(url));
}

/** 재촉: 멘션은 최상위 text에(알림이 가야 한다), 문장은 빨간 막대에. */
export function styledEscalation(args: {
  level: 1 | 2 | 3;
  minutes: number;
  mention: string;
  assigneeMention: string | null;
}): StyledMessage {
  return notice('alert', escalationNoticeParts(args), buildEscalationText(args), args.mention);
}

export function styledDeliveryFailure(reason: string): StyledMessage {
  return notice('alert', deliveryFailureParts(reason), buildDeliveryFailureText(reason));
}
````

- [ ] **Step 4: 통과·전체 테스트·타입 검사·lint**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/slackLook.test.ts 2>&1 | tail -4 && npx vitest run 2>&1 | tail -6 && npx tsc --noEmit && echo TSC-OK && npx eslint src/lib/chat/slackLook.ts src/lib/chat/__tests__/slackLook.test.ts && echo LINT-OK
```
Expected: `Tests  29 passed (29)`, 이어서 `Test Files  60 passed (60)`, `Tests  952 passed (952)`, `TSC-OK`, `LINT-OK`.

- [ ] **Step 5: 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git add liv-clinic/src/lib/chat/slackLook.ts liv-clinic/src/lib/chat/__tests__/slackLook.test.ts && git commit -m "feat(chat): 손님 방 글의 이름표·색 막대를 만드는 slackLook.ts" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 6: 대조**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms" && for f in liv-clinic/src/lib/chat/slackLook.ts liv-clinic/src/lib/chat/__tests__/slackLook.test.ts; do echo "$(git rev-parse HEAD:$f)  $f"; done
```
Expected:

| 파일 | 나와야 하는 값 |
|------|----------------|
| `liv-clinic/src/lib/chat/slackLook.ts` | `08e23a20b75e94c8e7a7d3cdf9e64d51e5bfe3c7` |
| `liv-clinic/src/lib/chat/__tests__/slackLook.test.ts` | `165130f3eb5f14ebb52c330faebf1157bffc2298` |

---

### Task 6: `postStyled`와 긴급 스위치 `SLACK_ROOM_LOOK`

**Files:**
- Modify: `liv-clinic/src/lib/chat/chatFlags.ts`, `liv-clinic/src/lib/chat/slackRelay.ts`
- Test: `liv-clinic/src/lib/chat/__tests__/chatFlags.test.ts`, `liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts`

**Interfaces:**
- Consumes: Task 3의 `postSlackMessage`(이름표·막대 인자), Task 5의 `StyledMessage`
- Produces:
  - `isRoomLookEnabled(): boolean` (`chatFlags.ts`) — `SLACK_ROOM_LOOK=off`면 `false`
  - `interface StyledPostResult extends PostMessageResult { plain: boolean }` (`slackRelay.ts`)
  - `postStyled(msg: StyledMessage, where: { channelId: string; threadTs?: string | null }): Promise<StyledPostResult>` (`slackRelay.ts`)

`postStyled`의 동작: ① `SLACK_ROOM_LOOK=off`면 `plainText`만 올린다(`plain: true`) ② 아니면 꾸민 글을 올린다 ③ 실패했고 그 오류가 "다시 올리지 않는 오류" 목록에 없으면 `plainText`로 한 번 더 올린다(`plain: true`, 경고 `[slack look] styled post failed, retrying plain:`). 다시 올리지 않는 오류: 방 상태(`is_archived`·`channel_not_found`·`not_in_channel` — 호출부가 처리한다), 설정·인증(`no_bot_token`·`no_channel_id`·`invalid_auth`·`not_authed`·`account_inactive`·`token_revoked`), 일시 오류(`ratelimited`·`timeout`·`network_error`·`http_429`·`http_500`·`http_502`·`http_503`·`http_504` — `callSlack`이 이미 한 번 재시도했다).

이 과제에서는 `postStyled`를 만들기만 한다. 실제 게시에 쓰는 것은 Task 7~9다.

- [ ] **Step 1: 테스트를 더한다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T6-test`

<!-- block: T6-test | diff | chatFlags.test.ts, slackRelay.test.ts -->
````diff
diff --git a/liv-clinic/src/lib/chat/__tests__/chatFlags.test.ts b/liv-clinic/src/lib/chat/__tests__/chatFlags.test.ts
index 01cad9e..74a412a 100644
--- a/liv-clinic/src/lib/chat/__tests__/chatFlags.test.ts
+++ b/liv-clinic/src/lib/chat/__tests__/chatFlags.test.ts
@@ -1,10 +1,11 @@
 import { describe, it, expect, afterEach } from 'vitest';
-import { isEventHintEnabled, isFollowupEnabled } from '../chatFlags';
+import { isEventHintEnabled, isFollowupEnabled, isRoomLookEnabled } from '../chatFlags';
 
 describe('긴급 정지 스위치', () => {
   afterEach(() => {
     delete process.env.CHAT_FOLLOWUP;
     delete process.env.CHAT_EVENT_HINT;
+    delete process.env.SLACK_ROOM_LOOK;
   });
 
   it('환경변수가 없으면 둘 다 켜져 있다', () => {
@@ -31,4 +32,13 @@ describe('긴급 정지 스위치', () => {
     expect(isFollowupEnabled()).toBe(false);
     expect(isEventHintEnabled()).toBe(true);
   });
+
+  it('방 글 모양 스위치(SLACK_ROOM_LOOK)도 같은 규칙이다: 없으면 켜짐, off면 꺼짐, 다른 스위치와 독립', () => {
+    expect(isRoomLookEnabled()).toBe(true);
+    process.env.SLACK_ROOM_LOOK = ' Off ';
+    expect(isRoomLookEnabled()).toBe(false);
+    expect(isFollowupEnabled()).toBe(true);
+    process.env.SLACK_ROOM_LOOK = 'plain';
+    expect(isRoomLookEnabled()).toBe(true);
+  });
 });
diff --git a/liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts b/liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts
index e03a47c..4470917 100644
--- a/liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts
+++ b/liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts
@@ -30,6 +30,7 @@ import { fetchThreadParent, getBotUserId, postSlackMessage } from '../slack';
 import { ensureRoom } from '../slackRooms';
 import { translate } from '../translation';
 import {
+  postStyled,
   relayChatMessageToSlack,
   relayContactToSlack,
   relayEventHintNoteToSlack,
@@ -636,3 +637,108 @@ describe('relayChatMessageToSlack — 방 첫 메시지의 연락처 꼬리말',
     expect(ensureRoomMock.mock.calls[0][2]).toBe(FIRST.receivedAt);
   });
 });
+
+// ── 손님 방 글 모양 (스펙 2026-10-01 slack-room-look §3.5) ───────────────────────────
+
+describe('postStyled — 꾸민 글 올리기와 글자만 재게시', () => {
+  const postMock = vi.mocked(postSlackMessage);
+  const MSG = {
+    username: 'LIV 알림',
+    iconEmoji: ':bell:',
+    text: '',
+    attachments: [
+      { color: '#a8a6a8', fallback: '안내', blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '*안내*' } }] },
+    ],
+    plainText: '글자만 문구',
+  };
+  const OK = { ok: true, ts: '9.9', channel: 'C0ROOM' };
+
+  beforeEach(() => {
+    setSlackEnv();
+    postMock.mockReset();
+    postMock.mockResolvedValue(OK);
+  });
+  afterEach(() => {
+    clearSlackEnv();
+    delete process.env.SLACK_ROOM_LOOK;
+  });
+
+  it('이름표·아이콘·색 막대를 붙여 한 번 올린다', async () => {
+    const r = await postStyled(MSG, { channelId: 'C0ROOM' });
+    expect(r).toEqual({ ...OK, plain: false });
+    expect(postMock).toHaveBeenCalledTimes(1);
+    expect(postMock.mock.calls[0][0]).toEqual({
+      text: '',
+      username: 'LIV 알림',
+      iconEmoji: ':bell:',
+      attachments: MSG.attachments,
+      channelId: 'C0ROOM',
+    });
+  });
+
+  it('SLACK_ROOM_LOOK=off 면 글자만 문구를 올린다', async () => {
+    process.env.SLACK_ROOM_LOOK = 'off';
+    const r = await postStyled(MSG, { channelId: 'C0ROOM' });
+    expect(r).toEqual({ ...OK, plain: true });
+    expect(postMock).toHaveBeenCalledTimes(1);
+    expect(postMock.mock.calls[0][0]).toEqual({ text: '글자만 문구', channelId: 'C0ROOM' });
+  });
+
+  it('꾸민 글이 거부되면(invalid_blocks) 같은 내용을 글자만으로 한 번 더 올린다', async () => {
+    postMock.mockResolvedValueOnce({ ok: false, error: 'invalid_blocks' }).mockResolvedValueOnce(OK);
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    const r = await postStyled(MSG, { channelId: 'C0ROOM' });
+    expect(r).toEqual({ ...OK, plain: true });
+    expect(postMock).toHaveBeenCalledTimes(2);
+    expect(postMock.mock.calls[1][0]).toEqual({ text: '글자만 문구', channelId: 'C0ROOM' });
+    expect(warn.mock.calls.some((c) => String(c[0]).includes('styled post failed, retrying plain'))).toBe(true);
+    warn.mockRestore();
+  });
+
+  it('앱 권한이 빠졌을 때(missing_scope)와 모르는 오류도 글자만으로 올린다', async () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    for (const error of ['missing_scope', 'some_new_slack_error']) {
+      postMock.mockReset();
+      postMock.mockResolvedValueOnce({ ok: false, error }).mockResolvedValueOnce(OK);
+      expect(await postStyled(MSG, { channelId: 'C0ROOM' })).toEqual({ ...OK, plain: true });
+      expect(postMock).toHaveBeenCalledTimes(2);
+    }
+    warn.mockRestore();
+  });
+
+  it('방 상태 오류(is_archived·channel_not_found·not_in_channel)는 다시 올리지 않는다 — 호출부가 처리한다', async () => {
+    for (const error of ['is_archived', 'channel_not_found', 'not_in_channel']) {
+      postMock.mockReset();
+      postMock.mockResolvedValue({ ok: false, error });
+      expect(await postStyled(MSG, { channelId: 'C0ROOM' })).toEqual({ ok: false, error, plain: false });
+      expect(postMock).toHaveBeenCalledTimes(1);
+    }
+  });
+
+  it('일시 오류(timeout·ratelimited·http_503)는 다시 올리지 않는다 — callSlack이 이미 한 번 재시도했다', async () => {
+    for (const error of ['timeout', 'ratelimited', 'network_error', 'http_503']) {
+      postMock.mockReset();
+      postMock.mockResolvedValue({ ok: false, error });
+      expect(await postStyled(MSG, { channelId: 'C0ROOM' })).toEqual({ ok: false, error, plain: false });
+      expect(postMock).toHaveBeenCalledTimes(1);
+    }
+  });
+
+  it('글자만 재게시도 실패하면 그 결과를 돌려준다', async () => {
+    postMock
+      .mockResolvedValueOnce({ ok: false, error: 'invalid_attachments' })
+      .mockResolvedValueOnce({ ok: false, error: 'msg_too_long' });
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    expect(await postStyled(MSG, { channelId: 'C0ROOM' })).toEqual({ ok: false, error: 'msg_too_long', plain: true });
+    warn.mockRestore();
+  });
+
+  it('스레드 안에 올릴 때는 thread_ts를 두 번 다 넘긴다', async () => {
+    postMock.mockResolvedValueOnce({ ok: false, error: 'invalid_blocks' }).mockResolvedValueOnce(OK);
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    await postStyled(MSG, { channelId: 'C0ROOM', threadTs: '1.5' });
+    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0ROOM', threadTs: '1.5', username: 'LIV 알림' });
+    expect(postMock.mock.calls[1][0]).toEqual({ text: '글자만 문구', channelId: 'C0ROOM', threadTs: '1.5' });
+    warn.mockRestore();
+  });
+});
````

- [ ] **Step 2: 실패를 확인한다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/chatFlags.test.ts src/lib/chat/__tests__/slackRelay.test.ts 2>&1 | tail -6`
Expected: FAIL — `Test Files  2 failed (2)`, `Tests  9 failed | 44 passed (53)` (`isRoomLookEnabled is not a function` 1건, `postStyled is not a function` 8건).

- [ ] **Step 3: 구현을 더한다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T6-impl`

<!-- block: T6-impl | diff | chatFlags.ts, slackRelay.ts -->
````diff
diff --git a/liv-clinic/src/lib/chat/chatFlags.ts b/liv-clinic/src/lib/chat/chatFlags.ts
index 7872ce5..bc889f8 100644
--- a/liv-clinic/src/lib/chat/chatFlags.ts
+++ b/liv-clinic/src/lib/chat/chatFlags.ts
@@ -19,3 +19,11 @@ export function isFollowupEnabled(): boolean {
 export function isEventHintEnabled(): boolean {
   return !isOff('CHAT_EVENT_HINT');
 }
+
+/**
+ * 손님 방 글의 이름표·색 막대 (스펙 2026-10-01 slack-room-look §3.5).
+ * SLACK_ROOM_LOOK=off 면 false — 방 안의 글을 예전처럼 글자만으로 올린다. 방 이름 규칙과는 무관하다.
+ */
+export function isRoomLookEnabled(): boolean {
+  return !isOff('SLACK_ROOM_LOOK');
+}
diff --git a/liv-clinic/src/lib/chat/slackRelay.ts b/liv-clinic/src/lib/chat/slackRelay.ts
index 5aa5281..d9aa0ac 100644
--- a/liv-clinic/src/lib/chat/slackRelay.ts
+++ b/liv-clinic/src/lib/chat/slackRelay.ts
@@ -3,8 +3,9 @@ import { createChatAdminClient, type ChatAdminClient } from '@/lib/chat/db';
 import { broadcastToSession } from '@/lib/chat/broadcast';
 import { translate, type TranslationResult } from '@/lib/chat/translation';
 import type { VisitorLocale } from '@/lib/chat/serverI18n';
-import { isFollowupEnabled } from '@/lib/chat/chatFlags';
+import { isFollowupEnabled, isRoomLookEnabled } from '@/lib/chat/chatFlags';
 import type { ContactChannel } from '@/lib/chat/contactChannels';
+import type { StyledMessage } from '@/lib/chat/slackLook';
 import {
   _internals,
   archiveChannel,
@@ -142,6 +143,61 @@ export async function postFeed(text: string): Promise<void> {
   if (!r.ok) console.warn('[slack relay] feed post failed:', r.error);
 }
 
+// ── 손님 방 글 모양 (스펙 2026-10-01 slack-room-look §3.5) ─────────────────────
+
+/** 꾸민 글이 실패해도 글자만으로 다시 올리지 않는 오류. 여기 없는 오류(invalid_blocks·missing_scope·모르는 오류)는 다시 올린다. */
+const NO_PLAIN_RETRY = new Set([
+  // 방 상태 — 호출부가 처리한다(보관 해제, 스레드 방식 전환)
+  'is_archived',
+  'channel_not_found',
+  'not_in_channel',
+  // 설정·인증 — 다시 해도 같다
+  'no_bot_token',
+  'no_channel_id',
+  'invalid_auth',
+  'not_authed',
+  'account_inactive',
+  'token_revoked',
+  // 일시 오류 — callSlack이 이미 한 번 재시도했다. 더 하면 함수 실행 한도를 넘긴다
+  'ratelimited',
+  'timeout',
+  'network_error',
+  'http_429',
+  'http_500',
+  'http_502',
+  'http_503',
+  'http_504',
+]);
+
+export interface StyledPostResult extends PostMessageResult {
+  /** 글자만의 문구로 올렸는가 — 긴급 정지(SLACK_ROOM_LOOK=off) 중이거나 꾸민 글이 거부돼 다시 올렸을 때 */
+  plain: boolean;
+}
+
+/**
+ * 손님 방에 꾸민 글(이름표·색 막대)을 올린다.
+ * 꾸민 글이 거부되면 같은 내용을 글자만으로 한 번 더 올린다 — 모양 때문에 글이 사라지는 일이 없게 한다.
+ * #해외문의 피드 줄에는 쓰지 않는다: 이름표를 붙인 글은 user 필드가 없어 피드 스레드 답장 전달(findSessionByFeedParent)이 끊긴다.
+ */
+export async function postStyled(
+  msg: StyledMessage,
+  where: { channelId: string; threadTs?: string | null }
+): Promise<StyledPostResult> {
+  if (!isRoomLookEnabled()) {
+    return { ...(await postSlackMessage({ text: msg.plainText, ...where })), plain: true };
+  }
+  const styled = await postSlackMessage({
+    text: msg.text,
+    username: msg.username,
+    iconEmoji: msg.iconEmoji,
+    attachments: msg.attachments,
+    ...where,
+  });
+  if (styled.ok || NO_PLAIN_RETRY.has(styled.error ?? '')) return { ...styled, plain: false };
+  console.warn('[slack look] styled post failed, retrying plain:', styled.error);
+  return { ...(await postSlackMessage({ text: msg.plainText, ...where })), plain: true };
+}
+
 function makeRoomDeps(admin: ChatAdminClient, staff: StaffDirectory): RoomDeps {
   return {
     staffIds: staff.inviteIds,
````

- [ ] **Step 4: 통과·전체 테스트·타입 검사·lint**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/chatFlags.test.ts src/lib/chat/__tests__/slackRelay.test.ts 2>&1 | tail -4 && npx vitest run 2>&1 | tail -6 && npx tsc --noEmit && echo TSC-OK && npx eslint src/lib/chat/chatFlags.ts src/lib/chat/slackRelay.ts src/lib/chat/__tests__/chatFlags.test.ts src/lib/chat/__tests__/slackRelay.test.ts && echo LINT-OK
```
Expected: `Tests  53 passed (53)`, 이어서 `Test Files  60 passed (60)`, `Tests  961 passed (961)`, `TSC-OK`, `LINT-OK`.

- [ ] **Step 5: 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git add liv-clinic/src/lib/chat/chatFlags.ts liv-clinic/src/lib/chat/slackRelay.ts liv-clinic/src/lib/chat/__tests__/chatFlags.test.ts liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts && git commit -m "feat(chat): postStyled — 꾸민 글이 거부되면 글자만으로 다시 올린다, 긴급 스위치 SLACK_ROOM_LOOK" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 6: 대조**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms" && for f in liv-clinic/src/lib/chat/chatFlags.ts liv-clinic/src/lib/chat/slackRelay.ts liv-clinic/src/lib/chat/__tests__/chatFlags.test.ts liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts; do echo "$(git rev-parse HEAD:$f)  $f"; done
```
Expected:

| 파일 | 나와야 하는 값 |
|------|----------------|
| `liv-clinic/src/lib/chat/chatFlags.ts` | `bc889f80f0990c3c8d89e4abc80e2868fcca89fb` |
| `liv-clinic/src/lib/chat/slackRelay.ts` | `d9aa0ac49025c144196adc16e5d4d64de3f4d69d` |
| `liv-clinic/src/lib/chat/__tests__/chatFlags.test.ts` | `74a412aab278ec5420e62f42dc82ebae52bf83eb` |
| `liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts` | `44709179bc6e95ca16b1dbcb5bd8453e30cec55d` |

---

### Task 7: 손님 글·직원 답 사본·번역본을 이름표로, 새 문의·재발신 알림을 따로

**Files:**
- Modify: `liv-clinic/src/lib/chat/slackRelay.ts`
- Test: `liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts`

**Interfaces:**
- Consumes: Task 5의 `styledRoomFirstVisitor`·`styledRoomFirstNotice`·`styledRoomVisitor`·`styledReopenedNotice`·`styledAdminReply`·`styledFeedReplyCopy`·`styledTranslationCopy`, Task 6의 `postStyled`
- Produces: 외부 인터페이스 변화 없음. `relayChatMessageToSlack`·`relaySlackReplyToVisitor`의 방 안 게시 모양만 바뀐다:
  - 방의 첫 손님 글 = 게시 두 번(손님 이름표의 글 → `LIV 알림`의 회색 막대 "새 문의 · 접수 시각 · 참조코드" + 사용법) 뒤에 피드 줄. `chat_messages.slack_ts`에는 **손님 글**의 ts.
  - 손님 후속 글 = 손님 이름표로 한 번(멘션 줄 + 본문, 시각 글자 없음).
  - 보관된 방에 손님이 다시 씀 = 보관 해제 → 손님 글 → 피드 "다시 열림" → 방에 `LIV 알림` 회색 막대 🔔.
  - 관리자 화면 답장 = `{작성자} · 관리자 화면에서 답함` 이름표. 피드 스레드 답장의 방 사본 = `{작성자} · 피드에서 답함`. 번역본 = `번역본 · 복사용`(본문은 번역문만).
  - 손님 글이 글자만으로 올라갔으면(`plain: true` — 긴급 스위치나 재게시) 뒤따르는 알림은 올리지 않는다(그 글자 문구에 이미 들어 있다).
  - 스레드 방식 세션과 `#해외문의` 피드 줄은 그대로 글자만.

- [ ] **Step 1: 테스트를 바꾼다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T7-test`

`archiveChannel`·`unarchiveChannel`을 목으로 바꾸고(보관 해제 경로를 시험하려면 진짜 Slack 호출이 나가면 안 된다), "방의 첫 글" 묶음을 다시 쓰고, "이미 있는 방" 묶음을 새로 더한다.

<!-- block: T7-test | diff | slackRelay.test.ts -->
````diff
diff --git a/liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts b/liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts
index 4470917..318d23a 100644
--- a/liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts
+++ b/liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts
@@ -18,6 +18,8 @@ vi.mock('../slack', async (importOriginal) => ({
   fetchThreadParent: vi.fn(),
   postSlackMessage: vi.fn(),
   getBotUserId: vi.fn(),
+  archiveChannel: vi.fn(),
+  unarchiveChannel: vi.fn(),
 }));
 
 vi.mock('../slackRooms', async (importOriginal) => ({
@@ -26,7 +28,7 @@ vi.mock('../slackRooms', async (importOriginal) => ({
 }));
 
 import { createChatAdminClient } from '../db';
-import { fetchThreadParent, getBotUserId, postSlackMessage } from '../slack';
+import { archiveChannel, fetchThreadParent, getBotUserId, postSlackMessage, unarchiveChannel } from '../slack';
 import { ensureRoom } from '../slackRooms';
 import { translate } from '../translation';
 import {
@@ -38,7 +40,8 @@ import {
   relaySlackReplyToVisitor,
   resolveTarget,
 } from '../slackRelay';
-import { ROOM_EMAIL_CONTACT_NOTE } from '../slackText';
+import { BAR_COLOR } from '../slackLook';
+import { bareNote, buildRoomFirstText, ROOM_EMAIL_CONTACT_NOTE, ROOM_REOPENED_LEAD } from '../slackText';
 import { fakeAdmin, hasFilter, type FakeOp } from './fakeAdmin';
 
 describe('resolveTarget', () => {
@@ -154,9 +157,13 @@ describe('relaySlackReplyToVisitor — #해외문의 피드 줄 스레드 답장
     const assign = admin.ops.find((o) => o.table === 'chat_sessions' && o.op === 'update');
     expect(assign?.payload).toMatchObject({ assigned_slack_user_id: 'U0AAA', assigned_label: '이정현' });
     expect(postMock).toHaveBeenCalledTimes(1);
-    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0ROOM' });
-    expect(postMock.mock.calls[0][0].text).toContain('피드에서 답함 · 이정현');
-    expect(postMock.mock.calls[0][0].text).toContain(INBOUND.text);
+    // 방에 남기는 사본은 작성자 이름표로 올라간다 (slack-room-look §3.4의 6번)
+    expect(postMock.mock.calls[0][0]).toMatchObject({
+      channelId: 'C0ROOM',
+      username: '이정현 · 피드에서 답함',
+      iconEmoji: ':leftwards_arrow_with_hook:',
+      text: INBOUND.text,
+    });
   });
 
   it('부모에 채널 링크가 없으면 session_not_found, 저장하지 않는다', async () => {
@@ -334,11 +341,15 @@ describe('relaySlackReplyToVisitor — 연락 수단이 있는 손님의 방에
   });
   afterEach(clearSlackEnv);
 
+  // 번역본 글: 이름표는 붙지만 본문(text)은 번역문만이다 — 휴대폰의 "텍스트 복사"가 본문을 그대로 복사한다.
+  const COPY_POST = { text: '翻译', username: '번역본 · 복사용', iconEmoji: ':clipboard:', channelId: 'C0ROOM' };
+
   it('이메일을 남긴 손님의 방: 전달 뒤 번역문만 담은 글을 한 번 올린다', async () => {
     adminFor({ ...NONE, visitor_email: 'guest@example.com' });
     expect(await relaySlackReplyToVisitor(ROOM_REPLY)).toBe('delivered');
     expect(postMock).toHaveBeenCalledTimes(1);
-    expect(postMock.mock.calls[0][0]).toEqual({ text: '翻译', channelId: 'C0ROOM' });
+    expect(postMock.mock.calls[0][0]).toEqual(COPY_POST);
+    expect(postMock.mock.calls[0][0].attachments).toBeUndefined();
   });
 
   it('메신저 연락처를 남겼거나 카드 단추만 누른 손님도 대상이다', async () => {
@@ -427,8 +438,8 @@ describe('relaySlackReplyToVisitor — 연락 수단이 있는 손님의 방에
 
     expect(await relaySlackReplyToVisitor(FEED_REPLY)).toBe('delivered');
     expect(postMock).toHaveBeenCalledTimes(2);
-    expect(postMock.mock.calls[0][0].text).toContain('피드에서 답함');
-    expect(postMock.mock.calls[1][0]).toEqual({ text: '翻译', channelId: 'C0ROOM' });
+    expect(postMock.mock.calls[0][0].username).toBe('이정현 · 피드에서 답함');
+    expect(postMock.mock.calls[1][0]).toEqual(COPY_POST);
   });
 });
 
@@ -572,7 +583,7 @@ describe('relayMessengerClickToSlack · relayEventHintNoteToSlack — 방에 한
   });
 });
 
-describe('relayChatMessageToSlack — 방 첫 메시지의 연락처 꼬리말', () => {
+describe('relayChatMessageToSlack — 방의 첫 글: 손님 글과 새 문의 알림', () => {
   const postMock = vi.mocked(postSlackMessage);
   const adminMock = vi.mocked(createChatAdminClient);
   const ensureRoomMock = vi.mocked(ensureRoom);
@@ -584,6 +595,7 @@ describe('relayChatMessageToSlack — 방 첫 메시지의 연락처 꼬리말',
       return { data: null };
     });
     adminMock.mockReturnValue(admin as never);
+    return admin;
   }
 
   const FIRST = {
@@ -592,8 +604,13 @@ describe('relayChatMessageToSlack — 방 첫 메시지의 연락처 꼬리말',
     sender: 'visitor' as const,
     originalText: 'How much is Ulthera?',
     translatedText: '울쎄라 얼마인가요?',
+    // 2026-10-05(월) 12:00 KST
     receivedAt: '2026-10-05T03:00:00Z',
   };
+  const VISITOR_TEXT = '<@U0AAA>\n울쎄라 얼마인가요?\n> _원문:_ How much is Ulthera?';
+  /** n번째 게시(새 문의 알림)의 설명 줄들 */
+  const noticeNotes = (call: number): string[] =>
+    (postMock.mock.calls[call][0].attachments![0].blocks[1].elements as Array<{ text: string }>).map((e) => e.text);
 
   beforeEach(() => {
     setSlackEnv();
@@ -602,32 +619,131 @@ describe('relayChatMessageToSlack — 방 첫 메시지의 연락처 꼬리말',
     ensureRoomMock.mockReset();
     ensureRoomMock.mockResolvedValue({ mode: 'room', channelId: 'C0NEW', created: true });
   });
-  afterEach(clearSlackEnv);
+  afterEach(() => {
+    clearSlackEnv();
+    delete process.env.SLACK_ROOM_LOOK;
+  });
+
+  it('손님 글(손님 이름표) → 새 문의 알림(LIV 알림, 회색 막대) → 피드 줄 순으로 올린다', async () => {
+    adminFor(UNASSIGNED_ROW);
+    await relayChatMessageToSlack(FIRST);
+    expect(postMock).toHaveBeenCalledTimes(3);
+
+    const visitor = postMock.mock.calls[0][0];
+    expect(visitor).toMatchObject({
+      channelId: 'C0NEW',
+      username: '중국어(간체) 손님',
+      iconEmoji: ':flag-cn:',
+      text: VISITOR_TEXT,
+    });
+    expect(visitor.attachments).toBeUndefined();
+
+    const notice = postMock.mock.calls[1][0];
+    expect(notice).toMatchObject({ channelId: 'C0NEW', username: 'LIV 알림', iconEmoji: ':bell:', text: '' });
+    expect(notice.attachments![0].color).toBe(BAR_COLOR.info);
+    expect(notice.attachments![0].blocks[0]).toEqual({
+      type: 'section',
+      text: { type: 'mrkdwn', text: '*새 문의* · 📥 10/05(월) 12:00 KST · 참조코드 `#5B0C7C1A`' },
+    });
+    expect(noticeNotes(1)).toHaveLength(2);
 
-  it('시작 화면에서 이메일을 넣은 손님: 첫 메시지 끝에 꼬리말이 붙는다', async () => {
+    // 피드 줄에는 이름표를 붙이지 않는다 — 피드 스레드 답장 전달이 부모 글의 user로 우리 봇을 판별한다.
+    const feed = postMock.mock.calls[2][0];
+    expect(feed.channelId).toBe('C0FEED');
+    expect(feed.text.startsWith('🔴 새 문의 · 🇨🇳 익명 · <#C0NEW> · ')).toBe(true);
+    expect(feed.username).toBeUndefined();
+    expect(feed.attachments).toBeUndefined();
+  });
+
+  it('손님 이름이 있으면 이름표에 쓴다', async () => {
+    adminFor({ ...UNASSIGNED_ROW, visitor_name: 'Li Wei' });
+    await relayChatMessageToSlack(FIRST);
+    expect(postMock.mock.calls[0][0].username).toBe('Li Wei 손님');
+  });
+
+  it('chat_messages.slack_ts에는 손님 글의 ts를 남긴다 (알림 글의 ts가 아니다)', async () => {
+    const admin = adminFor(UNASSIGNED_ROW);
+    postMock
+      .mockResolvedValueOnce({ ok: true, ts: '1.1', channel: 'C0NEW' })
+      .mockResolvedValueOnce({ ok: true, ts: '2.2', channel: 'C0NEW' })
+      .mockResolvedValueOnce({ ok: true, ts: '3.3', channel: 'C0FEED' });
+    await relayChatMessageToSlack(FIRST);
+    const persist = admin.ops.find((o) => o.table === 'chat_messages' && o.op === 'update');
+    expect(persist?.payload).toEqual({ slack_ts: '1.1' });
+  });
+
+  it('시작 화면에서 이메일을 넣은 손님: 알림의 설명에 연락처 꼬리말이 한 줄 더 붙는다', async () => {
     adminFor({ ...UNASSIGNED_ROW, visitor_email: 'guest@example.com' });
     await relayChatMessageToSlack(FIRST);
-    expect(postMock.mock.calls[0][0].channelId).toBe('C0NEW');
-    expect(postMock.mock.calls[0][0].text.endsWith(ROOM_EMAIL_CONTACT_NOTE)).toBe(true);
+    expect(postMock.mock.calls[0][0].text).toBe(VISITOR_TEXT);
+    expect(noticeNotes(1)).toHaveLength(3);
+    expect(noticeNotes(1)[2]).toBe(bareNote(ROOM_EMAIL_CONTACT_NOTE));
   });
 
   it('이메일이 없는 손님에게는 붙지 않는다', async () => {
     adminFor(UNASSIGNED_ROW);
     await relayChatMessageToSlack(FIRST);
-    expect(postMock.mock.calls[0][0].text).not.toContain('이메일을 남긴 손님입니다');
+    expect(noticeNotes(1).join('\n')).not.toContain('이메일을 남긴 손님입니다');
   });
 
   it('이 글에서 방금 이메일이 저장됐으면(📱 알림이 뒤따른다) 붙이지 않는다', async () => {
     adminFor({ ...UNASSIGNED_ROW, visitor_email: 'guest@example.com' });
     await relayChatMessageToSlack({ ...FIRST, contactJustSaved: true });
-    expect(postMock.mock.calls[0][0].text).not.toContain('이메일을 남긴 손님입니다');
+    expect(noticeNotes(1)).toHaveLength(2);
   });
 
   it('CHAT_FOLLOWUP=off 면 붙이지 않는다', async () => {
     process.env.CHAT_FOLLOWUP = 'off';
     adminFor({ ...UNASSIGNED_ROW, visitor_email: 'guest@example.com' });
     await relayChatMessageToSlack(FIRST);
-    expect(postMock.mock.calls[0][0].text).not.toContain('이메일을 남긴 손님입니다');
+    expect(noticeNotes(1)).toHaveLength(2);
+  });
+
+  it('알림 게시가 실패해도 피드 줄까지 간다', async () => {
+    adminFor(UNASSIGNED_ROW);
+    postMock
+      .mockResolvedValueOnce({ ok: true, ts: '1.1', channel: 'C0NEW' })
+      .mockResolvedValueOnce({ ok: false, error: 'timeout' })
+      .mockResolvedValueOnce({ ok: true, ts: '3.3', channel: 'C0FEED' });
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    await relayChatMessageToSlack(FIRST);
+    expect(postMock).toHaveBeenCalledTimes(3);
+    expect(postMock.mock.calls[2][0].channelId).toBe('C0FEED');
+    expect(warn.mock.calls.some((c) => String(c[0]).includes('first notice failed'))).toBe(true);
+    warn.mockRestore();
+  });
+
+  it('SLACK_ROOM_LOOK=off: 예전처럼 한 글에 머리말·꼬리말을 담고, 알림은 따로 올리지 않는다', async () => {
+    process.env.SLACK_ROOM_LOOK = 'off';
+    adminFor(UNASSIGNED_ROW);
+    await relayChatMessageToSlack(FIRST);
+    expect(postMock).toHaveBeenCalledTimes(2);
+    expect(postMock.mock.calls[0][0]).toEqual({
+      text: buildRoomFirstText({
+        mentionAll: '<@U0AAA>',
+        receivedAt: FIRST.receivedAt,
+        visitorLocale: 'zh',
+        originalText: FIRST.originalText,
+        translatedText: FIRST.translatedText,
+        contactNote: null,
+      }),
+      channelId: 'C0NEW',
+    });
+    expect(postMock.mock.calls[1][0].channelId).toBe('C0FEED');
+  });
+
+  it('꾸민 손님 글이 거부돼 글자만으로 올라가면 알림은 따로 올리지 않는다', async () => {
+    adminFor(UNASSIGNED_ROW);
+    postMock
+      .mockResolvedValueOnce({ ok: false, error: 'invalid_blocks' })
+      .mockResolvedValueOnce({ ok: true, ts: '1.1', channel: 'C0NEW' })
+      .mockResolvedValueOnce({ ok: true, ts: '3.3', channel: 'C0FEED' });
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    await relayChatMessageToSlack(FIRST);
+    expect(postMock).toHaveBeenCalledTimes(3);
+    expect(postMock.mock.calls[1][0].text.startsWith('🔴 *새 문의* · <@U0AAA> · 📥')).toBe(true);
+    expect(postMock.mock.calls[2][0].channelId).toBe('C0FEED');
+    warn.mockRestore();
   });
 
   it('첫 글의 시각을 방 만들기에 넘긴다 (방 이름의 날짜가 된다)', async () => {
@@ -638,6 +754,144 @@ describe('relayChatMessageToSlack — 방 첫 메시지의 연락처 꼬리말',
   });
 });
 
+describe('relayChatMessageToSlack — 이미 있는 방: 후속 글, 재발신, 관리자 화면 답장', () => {
+  const postMock = vi.mocked(postSlackMessage);
+  const adminMock = vi.mocked(createChatAdminClient);
+  const archiveMock = vi.mocked(archiveChannel);
+  const unarchiveMock = vi.mocked(unarchiveChannel);
+
+  function adminFor(row: Record<string, unknown>) {
+    const admin = fakeAdmin((op: FakeOp) => {
+      if (op.table === 'chat_sessions' && op.op === 'select' && hasFilter(op, 'id', SESSION_ID)) return { data: row };
+      if (op.op === 'update') return { data: [{ id: SESSION_ID }] };
+      return { data: null };
+    });
+    adminMock.mockReturnValue(admin as never);
+    return admin;
+  }
+
+  const NEXT = {
+    sessionId: SESSION_ID,
+    messageId: 'm-2',
+    sender: 'visitor' as const,
+    originalText: 'Can I book for Thursday?',
+    translatedText: '목요일에 예약할 수 있나요?',
+    // 2026-10-05(월) 12:12 KST
+    receivedAt: '2026-10-05T03:12:00Z',
+  };
+  const ADMIN_REPLY = {
+    sessionId: SESSION_ID,
+    messageId: 'm-3',
+    sender: 'operator' as const,
+    senderLabel: 'admin@livps.co.kr',
+    originalText: '안녕하세요',
+    translatedText: '你好',
+  };
+
+  beforeEach(() => {
+    setSlackEnv();
+    postMock.mockReset();
+    postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0ROOM' });
+    archiveMock.mockReset();
+    archiveMock.mockResolvedValue({ ok: true, data: {} });
+    unarchiveMock.mockReset();
+    unarchiveMock.mockResolvedValue({ ok: true, data: {} });
+  });
+  afterEach(() => {
+    clearSlackEnv();
+    delete process.env.SLACK_ROOM_LOOK;
+  });
+
+  it('후속 글: 손님 이름표로 한 번만 올린다 (알림·피드 없음, 시각 글자 없음)', async () => {
+    adminFor({ ...ROOM_ROW, visitor_name: 'Li Wei' });
+    await relayChatMessageToSlack(NEXT);
+    expect(postMock).toHaveBeenCalledTimes(1);
+    expect(postMock.mock.calls[0][0]).toEqual({
+      text: '<@U0AAA>\n목요일에 예약할 수 있나요?\n> _원문:_ Can I book for Thursday?',
+      username: 'Li Wei 손님',
+      iconEmoji: ':flag-cn:',
+      channelId: 'C0ROOM',
+    });
+  });
+
+  it('보관된 방에 손님이 다시 쓰면: 보관 해제 → 손님 글 → 피드 "다시 열림" → 방에 🔔 알림', async () => {
+    adminFor(ROOM_ROW);
+    postMock.mockResolvedValueOnce({ ok: false, error: 'is_archived' });
+    await relayChatMessageToSlack(NEXT);
+
+    expect(unarchiveMock).toHaveBeenCalledWith('C0ROOM');
+    expect(postMock).toHaveBeenCalledTimes(4);
+    // [0]은 보관된 방이라 실패한 게시. [1] 해제 뒤 손님 글 — 🔔 머리말은 글에 넣지 않는다
+    expect(postMock.mock.calls[1][0]).toMatchObject({ channelId: 'C0ROOM', username: '중국어(간체) 손님' });
+    expect(postMock.mock.calls[1][0].text).not.toContain('🔔');
+    // [2] 피드 줄
+    expect(postMock.mock.calls[2][0].channelId).toBe('C0FEED');
+    expect(postMock.mock.calls[2][0].text.startsWith('🔄 다시 열림 · 익명 · <#C0ROOM> · ')).toBe(true);
+    // [3] 방의 🔔 알림 (회색 막대)
+    const notice = postMock.mock.calls[3][0];
+    expect(notice).toMatchObject({ channelId: 'C0ROOM', username: 'LIV 알림', text: '' });
+    expect(notice.attachments![0].color).toBe(BAR_COLOR.info);
+    expect(notice.attachments![0].blocks).toEqual([
+      { type: 'section', text: { type: 'mrkdwn', text: ROOM_REOPENED_LEAD } },
+    ]);
+  });
+
+  it('SLACK_ROOM_LOOK=off 재발신: 🔔 머리말이 든 글 하나만 올린다', async () => {
+    process.env.SLACK_ROOM_LOOK = 'off';
+    adminFor(ROOM_ROW);
+    postMock.mockResolvedValueOnce({ ok: false, error: 'is_archived' });
+    await relayChatMessageToSlack(NEXT);
+    expect(postMock).toHaveBeenCalledTimes(3); // 실패한 게시, 해제 뒤 게시, 피드 줄
+    expect(postMock.mock.calls[1][0].text.startsWith(`${ROOM_REOPENED_LEAD} · <@U0AAA> · 12:12 KST`)).toBe(true);
+    expect(postMock.mock.calls[1][0].username).toBeUndefined();
+  });
+
+  it('보관 해제가 실패하면 스레드 방식으로 넘겨 손님 글을 잃지 않는다', async () => {
+    adminFor(ROOM_ROW);
+    postMock.mockResolvedValueOnce({ ok: false, error: 'is_archived' });
+    unarchiveMock.mockResolvedValue({ ok: false, error: 'restricted_action' });
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    await relayChatMessageToSlack(NEXT);
+    // 스레드 방식의 첫 글은 #해외문의에 글자만으로 올라간다
+    const last = postMock.mock.calls[postMock.mock.calls.length - 1][0];
+    expect(last.channelId).toBe('C0FEED');
+    expect(last.username).toBeUndefined();
+    expect(last.text).toContain('새 채팅 문의');
+    warn.mockRestore();
+  });
+
+  it('관리자 화면에서 쓴 답: 작성자 이름표로 사본을 올린다', async () => {
+    adminFor(ROOM_ROW);
+    await relayChatMessageToSlack(ADMIN_REPLY);
+    expect(postMock).toHaveBeenCalledTimes(1);
+    expect(postMock.mock.calls[0][0]).toEqual({
+      text: '안녕하세요\n> _zh 전달:_ 你好',
+      username: 'admin@livps.co.kr · 관리자 화면에서 답함',
+      iconEmoji: ':leftwards_arrow_with_hook:',
+      channelId: 'C0ROOM',
+    });
+  });
+
+  it('관리자 화면 답으로 보관된 방이 되살아나면 🔔 알림은 올리지 않는다', async () => {
+    adminFor(ROOM_ROW);
+    postMock.mockResolvedValueOnce({ ok: false, error: 'is_archived' });
+    await relayChatMessageToSlack(ADMIN_REPLY);
+    expect(postMock).toHaveBeenCalledTimes(3); // 실패한 게시, 해제 뒤 게시, 피드 줄
+    expect(postMock.mock.calls.every((c) => c[0].username !== 'LIV 알림')).toBe(true);
+  });
+
+  it('스레드 방식 세션의 글은 예전 그대로 글자만 올린다', async () => {
+    adminFor(THREAD_ROW);
+    await relayChatMessageToSlack(NEXT);
+    expect(postMock).toHaveBeenCalledTimes(1);
+    expect(postMock.mock.calls[0][0]).toEqual({
+      text: '목요일에 예약할 수 있나요?\n> _원문:_ Can I book for Thursday?',
+      threadTs: THREAD_TS,
+      channelId: 'C0FEED',
+    });
+  });
+});
+
 // ── 손님 방 글 모양 (스펙 2026-10-01 slack-room-look §3.5) ───────────────────────────
 
 describe('postStyled — 꾸민 글 올리기와 글자만 재게시', () => {
````

- [ ] **Step 2: 실패를 확인한다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/slackRelay.test.ts 2>&1 | tail -6`
Expected: FAIL — `Tests  14 failed | 47 passed (61)`.

- [ ] **Step 3: 구현을 바꾼다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T7-impl`

<!-- block: T7-impl | diff | slackRelay.ts -->
````diff
diff --git a/liv-clinic/src/lib/chat/slackRelay.ts b/liv-clinic/src/lib/chat/slackRelay.ts
index d9aa0ac..f88a842 100644
--- a/liv-clinic/src/lib/chat/slackRelay.ts
+++ b/liv-clinic/src/lib/chat/slackRelay.ts
@@ -5,7 +5,16 @@ import { translate, type TranslationResult } from '@/lib/chat/translation';
 import type { VisitorLocale } from '@/lib/chat/serverI18n';
 import { isFollowupEnabled, isRoomLookEnabled } from '@/lib/chat/chatFlags';
 import type { ContactChannel } from '@/lib/chat/contactChannels';
-import type { StyledMessage } from '@/lib/chat/slackLook';
+import {
+  styledAdminReply,
+  styledFeedReplyCopy,
+  styledReopenedNotice,
+  styledRoomFirstNotice,
+  styledRoomFirstVisitor,
+  styledRoomVisitor,
+  styledTranslationCopy,
+  type StyledMessage,
+} from '@/lib/chat/slackLook';
 import {
   _internals,
   archiveChannel,
@@ -27,13 +36,9 @@ import {
   buildDeliveryFailureText,
   buildEventHintNote,
   buildFeedLine,
-  buildFeedReplyMirrorText,
   buildMessengerClickText,
   buildReplyText,
-  buildRoomFirstText,
-  buildRoomVisitorText,
   buildRootText,
-  buildTranslationCopyText,
   extractRoomChannelFromFeedText,
   ROOM_EMAIL_CONTACT_NOTE,
   staffChannelLabel,
@@ -50,6 +55,9 @@ import {
 //
 // supabase-js는 쓰기 실패를 throw하지 않고 `{ error }`로 돌려준다 — 모든 update/insert는
 // error를 확인하고 실패 시 `[slack relay]` 경고를 한 줄 남긴다.
+//
+// 글 모양 (스펙 2026-10-01 slack-room-look): 손님 방 안의 글은 postStyled로 올린다 — 손님 글은 손님 이름표,
+// 알림은 LIV 알림 + 색 막대, 거부되면 글자만으로 다시. #해외문의(피드 줄·스레드 방식)는 postSlackMessage로 글자만.
 
 export { buildContactText, buildReplyText, buildRootText };
 export type { RelaySender };
@@ -323,39 +331,49 @@ function rootText(session: RelaySessionRow, args: RelayOutboundArgs): string {
   });
 }
 
-function roomText(
+/** 시작 화면에서 이메일을 넣은 손님 — '오늘 연락할 손님'으로 관리된다는 꼬리말 (스펙 2026-10-01 §4.5 b). */
+function firstContactNote(session: RelaySessionRow, args: RelayOutboundArgs): string | null {
+  return session.visitor_email && !args.contactJustSaved && isFollowupEnabled() ? ROOM_EMAIL_CONTACT_NOTE : null;
+}
+
+/** 방에 올릴 글: 손님 글(손님 이름표) 또는 관리자 화면 답장의 사본(작성자 이름표). */
+function roomMessage(
   session: RelaySessionRow,
   staff: StaffDirectory,
   args: RelayOutboundArgs,
   receivedAt: string,
   firstInRoom: boolean,
   reopened: boolean
-): string {
+): StyledMessage {
+  const body = { originalText: args.originalText, translatedText: args.translatedText };
   if (args.sender === 'operator') {
-    return buildReplyText({
-      sender: 'operator',
+    return styledAdminReply({
       senderLabel: args.senderLabel ?? null,
       visitorLocale: session.visitor_locale,
-      originalText: args.originalText,
-      translatedText: args.translatedText,
+      ...body,
     });
   }
-  const body = {
-    visitorLocale: session.visitor_locale,
-    originalText: args.originalText,
-    translatedText: args.translatedText,
-  };
+  const who = { visitorName: session.visitor_name, visitorLocale: session.visitor_locale };
   if (firstInRoom) {
-    // 시작 화면에서 이메일을 넣은 손님 — '오늘 연락할 손님'으로 관리된다는 꼬리말을 붙인다 (스펙 2026-10-01 §4.5 b).
-    const contactNote =
-      session.visitor_email && !args.contactJustSaved && isFollowupEnabled() ? ROOM_EMAIL_CONTACT_NOTE : null;
-    return buildRoomFirstText({ mentionAll: staff.mentionAll(), receivedAt, contactNote, ...body });
+    return styledRoomFirstVisitor({
+      session: who,
+      mentionAll: staff.mentionAll(),
+      receivedAt,
+      contactNote: firstContactNote(session, args),
+      ...body,
+    });
   }
   // 담당자가 있으면 담당자만, 없으면 전원. 관찰자는 mentionAll에 들어 있지 않다.
   // 명단에서 빠진 담당자를 계속 부르지 않도록 지금도 답변 직원인지 확인한다.
   const assignee = session.assigned_slack_user_id;
   const mention = assignee && staff.isResponder(assignee) ? mentionOf(assignee) : staff.mentionAll();
-  return buildRoomVisitorText({ mention, receivedAt, reopened, ...body });
+  return styledRoomVisitor({ session: who, mention, receivedAt, reopened, ...body });
+}
+
+/** 손님 글 뒤에 붙는 알림(새 문의·다시 말을 걸었음). 실패해도 손님 글은 이미 올라가 있으므로 경고만 남긴다. */
+async function postRoomNotice(msg: StyledMessage, channelId: string, label: string): Promise<void> {
+  const r = await postStyled(msg, { channelId });
+  if (!r.ok) console.warn(`[slack relay] ${label} failed:`, r.error);
 }
 
 async function postInRoom(
@@ -367,20 +385,18 @@ async function postInRoom(
   receivedAt: string,
   firstInRoom: boolean
 ): Promise<'posted' | 'failed' | 'fallback_thread'> {
-  let posted = await postSlackMessage({
-    text: roomText(session, staff, args, receivedAt, firstInRoom, false),
-    channelId,
-  });
+  let posted = await postStyled(roomMessage(session, staff, args, receivedAt, firstInRoom, false), { channelId });
+  let reopened = false;
 
   if (!posted.ok && posted.error === 'is_archived') {
-    // 완료(보관)된 방에 손님이 다시 말을 걸었다 → 해제 후 🔔로 게시 + 피드에 '다시 열림'
+    // 완료(보관)된 방에 손님이 다시 말을 걸었다 → 해제 후 다시 게시 + 피드에 '다시 열림' (방의 🔔 알림은 아래에서 붙인다)
     const un = await unarchiveChannel(channelId);
     if (!un.ok) {
       console.warn('[slack relay] unarchive failed, switching session to thread mode:', un.error);
       await revertToThreadMode(admin, session.id);
       return 'fallback_thread';
     }
-    posted = await postSlackMessage({ text: roomText(session, staff, args, receivedAt, false, true), channelId });
+    posted = await postStyled(roomMessage(session, staff, args, receivedAt, false, true), { channelId });
     if (!posted.ok || !posted.ts) {
       // 해제는 됐는데 재게시가 실패 — 손님 메시지를 잃지 않도록 스레드로 폴백한다.
       // 방을 다시 보관해야 한다. 열린 채로 두면 세션과 끊긴 방에 직원이 답을 쓰고 손님은 못 받는다.
@@ -390,6 +406,7 @@ async function postInRoom(
       if (!r.ok) console.warn('[slack relay] archive failed:', r.error);
       return 'fallback_thread';
     }
+    reopened = true;
     await postFeed(
       buildFeedLine({
         kind: 'reopened',
@@ -411,6 +428,21 @@ async function postInRoom(
     return 'failed';
   }
   await persistSlackTs(admin, args.messageId, posted.ts);
+
+  // 꾸민 손님 글에는 머리말·꼬리말이 없다 → 알림을 따로 붙인다 (slack-room-look §3.4의 2·4번).
+  // 글자만으로 올라갔으면(긴급 정지·재게시) 그 문구에 이미 들어 있으므로 올리지 않는다.
+  if (args.sender === 'visitor' && !posted.plain) {
+    if (firstInRoom) {
+      await postRoomNotice(
+        styledRoomFirstNotice({ sessionId: session.id, receivedAt, contactNote: firstContactNote(session, args) }),
+        channelId,
+        'first notice'
+      );
+    } else if (reopened) {
+      await postRoomNotice(styledReopenedNotice(), channelId, 'reopened notice');
+    }
+  }
+
   if (firstInRoom) {
     await postFeed(
       buildFeedLine({
@@ -772,10 +804,7 @@ async function postTranslationCopy(
       return;
     }
     if (!data || !(data.visitor_email || data.visitor_messenger_handle || data.visitor_messenger_clicked)) return;
-    const posted = await postSlackMessage({
-      text: buildTranslationCopyText(translated),
-      channelId: session.slack_channel_id,
-    });
+    const posted = await postStyled(styledTranslationCopy(translated), { channelId: session.slack_channel_id });
     if (!posted.ok) console.warn('[slack relay] translation copy failed:', posted.error);
   } catch (e) {
     console.warn('[slack relay] translation copy threw:', e);
@@ -871,8 +900,7 @@ export async function relaySlackReplyToVisitor(args: RelayInboundArgs): Promise<
     });
 
     if (viaFeed && session.slack_mode === 'room' && session.slack_channel_id) {
-      const mirror = await postSlackMessage({
-        text: buildFeedReplyMirrorText({ senderLabel, text: plain }),
+      const mirror = await postStyled(styledFeedReplyCopy({ senderLabel, text: plain }), {
         channelId: session.slack_channel_id,
       });
       if (!mirror.ok) console.warn('[slack relay] feed reply mirror failed:', mirror.error);
````

- [ ] **Step 4: 통과·전체 테스트·타입 검사·lint**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/slackRelay.test.ts 2>&1 | tail -4 && npx vitest run 2>&1 | tail -6 && npx tsc --noEmit && echo TSC-OK && npx eslint src/lib/chat/slackRelay.ts src/lib/chat/__tests__/slackRelay.test.ts && echo LINT-OK
```
Expected: `Tests  61 passed (61)`, 이어서 `Test Files  60 passed (60)`, `Tests  974 passed (974)`, `TSC-OK`, `LINT-OK`.

- [ ] **Step 5: 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git add liv-clinic/src/lib/chat/slackRelay.ts liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts && git commit -m "feat(chat): 손님 방의 손님 글·직원 답 사본·번역본을 이름표로, 새 문의·재발신 알림을 따로 올린다" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 6: 대조**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms" && for f in liv-clinic/src/lib/chat/slackRelay.ts liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts; do echo "$(git rev-parse HEAD:$f)  $f"; done
```
Expected:

| 파일 | 나와야 하는 값 |
|------|----------------|
| `liv-clinic/src/lib/chat/slackRelay.ts` | `f88a84280c72398c1ec9d4fc6a091f62a0012967` |
| `liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts` | `318d23af4be3898cebf2bd5ad09e6bdd6be5fefd` |

---

### Task 8: 연락처·단추·이벤트·전달 실패 알림을 색 막대로

**Files:**
- Modify: `liv-clinic/src/lib/chat/slackRelay.ts`
- Test: `liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts`

**Interfaces:**
- Consumes: Task 5의 `styledContactNotice`·`styledMessengerClick`·`styledEventHint`·`styledDeliveryFailure`, Task 6의 `postStyled`
- Produces: 외부 인터페이스 변화 없음. `relayContactToSlack`·`relayMessengerClickToSlack`·`relayEventHintNoteToSlack`·`notifyDeliveryFailure`의 게시 모양:
  - 방 → `LIV 알림` + 색 막대(연락처·단추 = 초록, 이벤트 = 회색, 전달 실패 = 빨강).
  - 스레드 방식 세션, `#해외문의`에 단독으로 올리는 연락처 글, `#해외문의` 채널에서 난 전달 실패 알림 → 예전 그대로 글자만.

- [ ] **Step 1: 테스트를 바꾼다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T8-test`

<!-- block: T8-test | diff | slackRelay.test.ts -->
````diff
diff --git a/liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts b/liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts
index 318d23a..1d4c219 100644
--- a/liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts
+++ b/liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts
@@ -32,6 +32,7 @@ import { archiveChannel, fetchThreadParent, getBotUserId, postSlackMessage, unar
 import { ensureRoom } from '../slackRooms';
 import { translate } from '../translation';
 import {
+  notifyDeliveryFailure,
   postStyled,
   relayChatMessageToSlack,
   relayContactToSlack,
@@ -290,6 +291,17 @@ function clearSlackEnv() {
   delete process.env.SLACK_CHANNEL_ID;
   delete process.env.CHAT_FOLLOWUP;
   delete process.env.NEXT_PUBLIC_SITE_URL;
+  delete process.env.SLACK_ROOM_LOOK;
+}
+
+/** 색 막대 알림 한 건의 색·큰 줄·설명 줄 (slack-room-look §3.3). */
+function barOf(post: Parameters<typeof postSlackMessage>[0]) {
+  const a = post.attachments![0];
+  return {
+    color: a.color,
+    headline: (a.blocks[0].text as { text: string }).text,
+    notes: a.blocks[1] ? (a.blocks[1].elements as Array<{ text: string }>).map((e) => e.text) : [],
+  };
 }
 
 describe('relaySlackReplyToVisitor — 연락 수단이 있는 손님의 방에 번역본 게시', () => {
@@ -461,25 +473,39 @@ describe('relayContactToSlack — 연락처 알림', () => {
   });
   afterEach(clearSlackEnv);
 
-  it('방: 분류 안내가 담긴 글을 방에, 피드에 "연락처 남김" 한 줄', async () => {
+  it('방: LIV 알림의 초록 막대(큰 줄 + 분류 안내 세 줄)를 방에, 피드에 "연락처 남김" 한 줄', async () => {
     adminFor(ROOM_ROW);
     await relayContactToSlack({ sessionId: SESSION_ID, channel: 'email', handle: 'guest@example.com' });
 
     expect(postMock).toHaveBeenCalledTimes(2);
     const room = postMock.mock.calls[0][0];
-    expect(room.channelId).toBe('C0ROOM');
-    expect(room.text.split('\n')[0]).toBe('📱 *손님이 연락처를 남겼습니다* — 이메일: guest@example.com');
-    expect(room.text).toContain("'오늘 연락할 손님'으로 분류했습니다");
-    expect(room.text).toContain('번역본이 올라옵니다');
+    expect(room).toMatchObject({ channelId: 'C0ROOM', username: 'LIV 알림', iconEmoji: ':bell:', text: '' });
+    const bar = barOf(room);
+    expect(bar.color).toBe(BAR_COLOR.contact);
+    expect(bar.headline).toBe('📱 *손님이 연락처를 남겼습니다* — 이메일: guest@example.com');
+    expect(bar.notes).toHaveLength(3);
+    expect(bar.notes[0]).toBe("'오늘 연락할 손님'으로 분류했습니다. 5·12·30분 알림은 울리지 않습니다.");
+    expect(bar.notes[1]).toContain('번역본이 올라옵니다');
     const feed = postMock.mock.calls[1][0];
     expect(feed.channelId).toBe('C0FEED');
     expect(feed.text.startsWith('📋 연락처 남김 · 🇨🇳 익명 · 이메일 · <#C0ROOM> · ')).toBe(true);
+    expect(feed.username).toBeUndefined();
   });
 
   it('메신저 채널은 브랜드명으로 적는다', async () => {
     adminFor(ROOM_ROW);
     await relayContactToSlack({ sessionId: SESSION_ID, channel: 'wechat', handle: 'liwei88' });
-    expect(postMock.mock.calls[0][0].text.split('\n')[0]).toBe('📱 *손님이 연락처를 남겼습니다* — WeChat: liwei88');
+    expect(barOf(postMock.mock.calls[0][0]).headline).toBe('📱 *손님이 연락처를 남겼습니다* — WeChat: liwei88');
+  });
+
+  it('SLACK_ROOM_LOOK=off 면 방에도 예전 글자 문구로 올린다', async () => {
+    process.env.SLACK_ROOM_LOOK = 'off';
+    adminFor(ROOM_ROW);
+    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'wechat', handle: 'liwei88' });
+    const room = postMock.mock.calls[0][0];
+    expect(room.username).toBeUndefined();
+    expect(room.text.split('\n')[0]).toBe('📱 *손님이 연락처를 남겼습니다* — WeChat: liwei88');
+    expect(room.text).toContain("_'오늘 연락할 손님'으로 분류했습니다");
   });
 
   it('스레드: 대표 스레드에 올리고 번역본 안내와 피드 줄은 없다', async () => {
@@ -490,6 +516,9 @@ describe('relayContactToSlack — 연락처 알림', () => {
     expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0FEED', threadTs: THREAD_TS });
     expect(postMock.mock.calls[0][0].text).not.toContain('번역본');
     expect(postMock.mock.calls[0][0].text).toContain('이 스레드에 답글을 쓰면 목록에서 빠집니다');
+    // 스레드 방식은 예전 그대로 글자만
+    expect(postMock.mock.calls[0][0].username).toBeUndefined();
+    expect(postMock.mock.calls[0][0].attachments).toBeUndefined();
   });
 
   it('방도 스레드도 없으면 관리자 화면 링크를 붙여 단독 게시한다', async () => {
@@ -500,15 +529,19 @@ describe('relayContactToSlack — 연락처 알림', () => {
     expect(postMock).toHaveBeenCalledTimes(1);
     expect(postMock.mock.calls[0][0].threadTs).toBeUndefined();
     expect(postMock.mock.calls[0][0].text).toContain(`🔗 <https://liv-clinic.net/admin/chat/${SESSION_ID}|관리자 화면에서 열기>`);
+    // #해외문의에 단독으로 올리는 글에는 이름표를 붙이지 않는다
+    expect(postMock.mock.calls[0][0].username).toBeUndefined();
   });
 
   it('CHAT_FOLLOWUP=off 면 분류 안내 대신 연락 요청만 남긴다', async () => {
     process.env.CHAT_FOLLOWUP = 'off';
     adminFor(ROOM_ROW);
     await relayContactToSlack({ sessionId: SESSION_ID, channel: 'email', handle: 'guest@example.com' });
-    expect(postMock.mock.calls[0][0].text).toBe(
-      '📱 *손님이 연락처를 남겼습니다* — 이메일: guest@example.com\n_이 연락처로 먼저 연락해 주세요._'
-    );
+    expect(barOf(postMock.mock.calls[0][0])).toEqual({
+      color: BAR_COLOR.contact,
+      headline: '📱 *손님이 연락처를 남겼습니다* — 이메일: guest@example.com',
+      notes: ['이 연락처로 먼저 연락해 주세요.'],
+    });
   });
 
   it('Slack 설정이 없으면 아무것도 하지 않는다', async () => {
@@ -537,14 +570,17 @@ describe('relayMessengerClickToSlack · relayEventHintNoteToSlack — 방에 한
   });
   afterEach(clearSlackEnv);
 
-  it('단추 클릭: 방에 📲 한 줄 (번역본 안내 포함)', async () => {
+  it('단추 클릭: 방에 LIV 알림의 초록 막대 (번역본 안내는 설명 줄)', async () => {
     adminFor(ROOM_ROW);
     await relayMessengerClickToSlack({ sessionId: SESSION_ID, channel: 'whatsapp' });
     expect(postMock).toHaveBeenCalledTimes(1);
-    expect(postMock.mock.calls[0][0].channelId).toBe('C0ROOM');
-    expect(postMock.mock.calls[0][0].text).toBe(
-      '📲 손님이 WhatsApp으로 이어가기를 눌렀습니다 — 병원 WhatsApp에서 코드 #5B0C7C1A 가 담긴 메시지를 확인해 주세요. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다.'
-    );
+    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0ROOM', username: 'LIV 알림', text: '' });
+    expect(barOf(postMock.mock.calls[0][0])).toEqual({
+      color: BAR_COLOR.contact,
+      headline:
+        '📲 손님이 WhatsApp으로 이어가기를 눌렀습니다 — 병원 WhatsApp에서 코드 #5B0C7C1A 가 담긴 메시지를 확인해 주세요.',
+      notes: ['이 방에 답을 쓰면 번역본이 아래에 올라옵니다.'],
+    });
   });
 
   it('단추 클릭: 스레드 모드는 스레드에, 번역본 안내 없이', async () => {
@@ -560,14 +596,16 @@ describe('relayMessengerClickToSlack · relayEventHintNoteToSlack — 방에 한
     expect(postMock).not.toHaveBeenCalled();
   });
 
-  it('이벤트 안내: 방에 🎁 한 줄과 링크', async () => {
+  it('이벤트 안내: 방에 LIV 알림의 회색 막대 (문장 다음 줄에 링크)', async () => {
     adminFor(ROOM_ROW);
     const url = 'https://liv-clinic.net/zh/events/2026-10-promotion';
     await relayEventHintNoteToSlack({ sessionId: SESSION_ID, url });
     expect(postMock).toHaveBeenCalledTimes(1);
-    expect(postMock.mock.calls[0][0]).toEqual({
-      text: `🎁 _가격 문의로 보여 손님에게 이벤트 링크를 자동으로 보냈습니다. 가격은 직접 답해 주세요._\n${url}`,
-      channelId: 'C0ROOM',
+    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0ROOM', username: 'LIV 알림', text: '' });
+    expect(barOf(postMock.mock.calls[0][0])).toEqual({
+      color: BAR_COLOR.info,
+      headline: `🎁 가격 문의로 보여 손님에게 이벤트 링크를 자동으로 보냈습니다. 가격은 직접 답해 주세요.\n${url}`,
+      notes: [],
     });
   });
 
@@ -583,6 +621,61 @@ describe('relayMessengerClickToSlack · relayEventHintNoteToSlack — 방에 한
   });
 });
 
+describe('notifyDeliveryFailure — 답글 전달 실패 알림', () => {
+  const postMock = vi.mocked(postSlackMessage);
+  const ROOM_REPLY = {
+    channel: 'C0ROOM',
+    slackTs: '3.0',
+    threadTs: null,
+    isTopLevel: true,
+    isBroadcast: false,
+    text: '답',
+    slackUserId: 'U0AAA',
+  };
+
+  beforeEach(() => {
+    setSlackEnv();
+    postMock.mockReset();
+    postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0ROOM' });
+  });
+  afterEach(clearSlackEnv);
+
+  it('손님 방 안: LIV 알림의 빨간 막대 (큰 줄 + 사유)', async () => {
+    await notifyDeliveryFailure(ROOM_REPLY, 'error');
+    expect(postMock).toHaveBeenCalledTimes(1);
+    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0ROOM', username: 'LIV 알림', text: '' });
+    expect(barOf(postMock.mock.calls[0][0])).toEqual({
+      color: BAR_COLOR.alert,
+      headline: '⚠️ *방금 답글이 손님에게 전달되지 않았습니다*',
+      notes: ['사유: 서버 오류가 났습니다. 관리자 화면에서 다시 보내 주세요'],
+    });
+  });
+
+  it('방 안의 스레드에서 난 실패는 그 스레드에 단다', async () => {
+    await notifyDeliveryFailure({ ...ROOM_REPLY, threadTs: '1.5', isTopLevel: false, isBroadcast: true }, 'empty_text');
+    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0ROOM', threadTs: '1.5', username: 'LIV 알림' });
+  });
+
+  it('#해외문의(피드 채널)의 스레드에서는 예전 그대로 글자만 올린다', async () => {
+    await notifyDeliveryFailure(
+      { ...ROOM_REPLY, channel: 'C0FEED', threadTs: THREAD_TS, isTopLevel: false },
+      'session_not_found'
+    );
+    expect(postMock.mock.calls[0][0]).toEqual({
+      text: '⚠️ 방금 답글이 손님에게 전달되지 않았습니다 · 사유: 이 스레드는 상담과 연결돼 있지 않습니다. 사이드바의 손님 방(날짜-이름으로 된 방) 본문에 답해 주세요',
+      channelId: 'C0FEED',
+      threadTs: THREAD_TS,
+    });
+  });
+
+  it('전달됐거나 일부러 무시한 경우에는 알리지 않는다', async () => {
+    for (const outcome of ['delivered', 'internal_note', 'legacy_top_level', 'unknown_channel'] as const) {
+      await notifyDeliveryFailure(ROOM_REPLY, outcome);
+    }
+    expect(postMock).not.toHaveBeenCalled();
+  });
+});
+
 describe('relayChatMessageToSlack — 방의 첫 글: 손님 글과 새 문의 알림', () => {
   const postMock = vi.mocked(postSlackMessage);
   const adminMock = vi.mocked(createChatAdminClient);
````

- [ ] **Step 2: 실패를 확인한다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/slackRelay.test.ts 2>&1 | tail -6`
Expected: FAIL — `Tests  7 failed | 59 passed (66)`.

- [ ] **Step 3: 구현을 바꾼다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T8-impl`

<!-- block: T8-impl | diff | slackRelay.ts -->
````diff
diff --git a/liv-clinic/src/lib/chat/slackRelay.ts b/liv-clinic/src/lib/chat/slackRelay.ts
index f88a842..7b4f542 100644
--- a/liv-clinic/src/lib/chat/slackRelay.ts
+++ b/liv-clinic/src/lib/chat/slackRelay.ts
@@ -7,7 +7,11 @@ import { isFollowupEnabled, isRoomLookEnabled } from '@/lib/chat/chatFlags';
 import type { ContactChannel } from '@/lib/chat/contactChannels';
 import {
   styledAdminReply,
+  styledContactNotice,
+  styledDeliveryFailure,
+  styledEventHint,
   styledFeedReplyCopy,
+  styledMessengerClick,
   styledReopenedNotice,
   styledRoomFirstNotice,
   styledRoomFirstVisitor,
@@ -33,10 +37,7 @@ import { routeInbound } from '@/lib/chat/slackEvents';
 import {
   adminSessionUrl,
   buildContactText,
-  buildDeliveryFailureText,
-  buildEventHintNote,
   buildFeedLine,
-  buildMessengerClickText,
   buildReplyText,
   buildRootText,
   extractRoomChannelFromFeedText,
@@ -506,11 +507,15 @@ async function postInThread(
   }
 }
 
-/** 세션의 방(본문) 또는 대표 스레드에 한 줄을 올린다. 붙일 곳이 없으면 null. */
-async function postToSessionTarget(target: SlackTarget, text: string): Promise<PostMessageResult | null> {
-  if (target.mode === 'room') return postSlackMessage({ text, channelId: target.channelId });
+/** 세션의 방(본문) 또는 대표 스레드에 알림 하나를 올린다 — 방이면 꾸민 글, 스레드면 글자만. 붙일 곳이 없으면 null. */
+async function postToSessionTarget(target: SlackTarget, msg: StyledMessage): Promise<PostMessageResult | null> {
+  if (target.mode === 'room') return postStyled(msg, { channelId: target.channelId });
   if (target.mode === 'thread' && target.threadTs) {
-    return postSlackMessage({ text, threadTs: target.threadTs, channelId: target.channelId ?? undefined });
+    return postSlackMessage({
+      text: msg.plainText,
+      threadTs: target.threadTs,
+      channelId: target.channelId ?? undefined,
+    });
   }
   return null;
 }
@@ -532,18 +537,18 @@ export async function relayContactToSlack(args: {
     const target = resolveTarget(session, getSlackChannelId());
     const channelLabel = staffChannelLabel(args.channel);
     const attached = target.mode === 'room' || (target.mode === 'thread' && Boolean(target.threadTs));
-    const text = buildContactText({
+    const msg = styledContactNotice({
       channelLabel,
       handle: args.handle,
       mode: target.mode === 'room' ? 'room' : attached ? 'thread' : 'standalone',
       followup: isFollowupEnabled(),
       adminUrl: adminSessionUrl(args.sessionId),
     });
-    // 방도 스레드도 없으면 #해외문의에 관리자 화면 링크를 붙여 단독 게시한다.
+    // 방도 스레드도 없으면 #해외문의에 관리자 화면 링크를 붙여 단독 게시한다(글자만 — 피드에는 이름표를 쓰지 않는다).
     const result =
-      (await postToSessionTarget(target, text)) ??
+      (await postToSessionTarget(target, msg)) ??
       (await postSlackMessage({
-        text,
+        text: msg.plainText,
         channelId: (target.mode === 'thread' ? target.channelId : null) ?? undefined,
       }));
     if (!result.ok) console.warn('[slack relay] contact post failed:', result.error);
@@ -573,12 +578,12 @@ export async function relayMessengerClickToSlack(args: { sessionId: string; chan
     const session = await loadSession(admin, args.sessionId);
     if (!session) return;
     const target = resolveTarget(session, getSlackChannelId());
-    const text = buildMessengerClickText({
+    const msg = styledMessengerClick({
       channel: args.channel,
       sessionId: args.sessionId,
       copyHint: target.mode === 'room' && isFollowupEnabled(),
     });
-    const result = await postToSessionTarget(target, text);
+    const result = await postToSessionTarget(target, msg);
     if (result && !result.ok) console.warn('[slack relay] messenger click post failed:', result.error);
   } catch (e) {
     console.warn('[slack relay] messenger click relay failed:', e);
@@ -593,7 +598,7 @@ export async function relayEventHintNoteToSlack(args: { sessionId: string; url:
     const session = await loadSession(admin, args.sessionId);
     if (!session) return;
     const target = resolveTarget(session, getSlackChannelId());
-    const result = await postToSessionTarget(target, buildEventHintNote(args.url));
+    const result = await postToSessionTarget(target, styledEventHint(args.url));
     if (result && !result.ok) console.warn('[slack relay] event hint note failed:', result.error);
   } catch (e) {
     console.warn('[slack relay] event hint note relay failed:', e);
@@ -922,11 +927,12 @@ export async function notifyDeliveryFailure(args: RelayInboundArgs, outcome: Inb
   // 답변 직원이 없으면 오늘과 동일하게 라우트의 console.warn만 남긴다.
   if (!(await hasResponders())) return;
   try {
-    const r = await postSlackMessage({
-      text: buildDeliveryFailureText(outcome),
-      channelId: args.channel,
-      threadTs: args.threadTs,
-    });
+    const msg = styledDeliveryFailure(outcome);
+    // 손님 방 안에서는 빨간 막대 알림, #해외문의(스레드 방식·피드 줄의 스레드)에서는 글자만 — 피드 채널에는 이름표를 쓰지 않는다.
+    const r =
+      args.channel === getSlackChannelId()
+        ? await postSlackMessage({ text: msg.plainText, channelId: args.channel, threadTs: args.threadTs })
+        : await postStyled(msg, { channelId: args.channel, threadTs: args.threadTs });
     if (!r.ok) console.warn('[slack relay] failure notice not posted:', r.error);
   } catch (e) {
     console.warn('[slack relay] failure notice threw:', e);
````

- [ ] **Step 4: 통과·전체 테스트·타입 검사·lint**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/slackRelay.test.ts 2>&1 | tail -4 && npx vitest run 2>&1 | tail -6 && npx tsc --noEmit && echo TSC-OK && npx eslint src/lib/chat/slackRelay.ts src/lib/chat/__tests__/slackRelay.test.ts && echo LINT-OK
```
Expected: `Tests  66 passed (66)`, 이어서 `Test Files  60 passed (60)`, `Tests  979 passed (979)`, `TSC-OK`, `LINT-OK`. (이 과제의 diff는 더 이상 쓰이지 않는 import 세 개 — `buildDeliveryFailureText`·`buildEventHintNote`·`buildMessengerClickText` — 도 함께 지운다. 손으로 옮기다 빠뜨리면 eslint가 "defined but never used" 경고를 낸다.)

- [ ] **Step 5: 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git add liv-clinic/src/lib/chat/slackRelay.ts liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts && git commit -m "feat(chat): 손님 방의 연락처·단추·이벤트·전달 실패 알림을 LIV 알림 색 막대로" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 6: 대조**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms" && for f in liv-clinic/src/lib/chat/slackRelay.ts liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts; do echo "$(git rev-parse HEAD:$f)  $f"; done
```
Expected:

| 파일 | 나와야 하는 값 |
|------|----------------|
| `liv-clinic/src/lib/chat/slackRelay.ts` | `7b4f542a510af2aebfc711f30c0ca7a432287a78` |
| `liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts` | `1d4c21908e61c89fbaf2ae573549b2935521ddd2` |

---

### Task 9: 재촉 알림을 빨간 막대로 + 이름표 글이 되돌아오지 않는다는 회귀 테스트

**Files:**
- Modify: `liv-clinic/src/lib/chat/escalationRunner.ts`
- Test: `liv-clinic/src/lib/chat/__tests__/escalationRunner.test.ts`, `liv-clinic/src/lib/chat/__tests__/slackEvents.test.ts`

**Interfaces:**
- Consumes: Task 5의 `styledEscalation`, Task 6의 `postStyled`
- Produces: 외부 인터페이스 변화 없음. `runEscalations`의 방 게시 = `LIV 알림`, 최상위 `text`에 멘션, 빨간 막대에 `⏰ *N분째 답이 없습니다.*`(30분은 `🚨 *30분째 미응답입니다.*`, 12분이고 담당자가 있으면 설명 줄 `담당 @… 님이 응답하지 않아 전원에게 알립니다.`). 스레드 방식은 예전 문구 그대로. 피드의 🚨 줄도 그대로.

`slackEvents.test.ts`에 더하는 두 건은 **처음부터 통과한다** — 이름표를 붙여 올린 우리 글(`subtype: bot_message`, `user` 없음, `bot_id` 있음)을 지금의 분류기가 이미 무시한다는 것을 고정해 두는 회귀 테스트다(이 글이 걸러지지 않으면 손님 방의 봇 글이 손님에게 되돌아간다).

- [ ] **Step 1: 테스트를 바꾼다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T9-test`

<!-- block: T9-test | diff | escalationRunner.test.ts, slackEvents.test.ts -->
````diff
diff --git a/liv-clinic/src/lib/chat/__tests__/escalationRunner.test.ts b/liv-clinic/src/lib/chat/__tests__/escalationRunner.test.ts
index b857b5b..eeb2223 100644
--- a/liv-clinic/src/lib/chat/__tests__/escalationRunner.test.ts
+++ b/liv-clinic/src/lib/chat/__tests__/escalationRunner.test.ts
@@ -65,6 +65,7 @@ describe('runEscalations — 연락처를 남긴 손님은 재촉 알림에서 
     delete process.env.SLACK_BOT_TOKEN;
     delete process.env.SLACK_CHANNEL_ID;
     delete process.env.CHAT_FOLLOWUP;
+    delete process.env.SLACK_ROOM_LOOK;
   });
 
   it('후보 조회에 연락처 NULL 조건 두 개가 붙는다', async () => {
@@ -88,12 +89,72 @@ describe('runEscalations — 연락처를 남긴 손님은 재촉 알림에서 
     expect(hasFilter(q, 'status', 'open')).toBe(true);
   });
 
-  it('회귀: 연락처가 없는 손님은 예전처럼 5분 알림이 방에 간다', async () => {
+  it('회귀: 연락처가 없는 손님의 방에는 5분 알림이 간다 — 멘션은 본문, 문장은 LIV 알림의 빨간 막대', async () => {
     adminWith([WAITING]);
     const result = await runEscalations(NOW);
     expect(result).toEqual({ checked: 1, escalated: 1 });
     expect(postMock).toHaveBeenCalledTimes(1);
-    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0ROOM' });
-    expect(postMock.mock.calls[0][0].text).toBe('⏰ <@U0AAA> 5분째 답이 없습니다.');
+    const post = postMock.mock.calls[0][0];
+    // 멘션은 막대 밖(최상위 text)에 둔다 — 알림이 가야 한다 (slack-room-look §3.3)
+    expect(post).toMatchObject({ channelId: 'C0ROOM', username: 'LIV 알림', iconEmoji: ':bell:', text: '<@U0AAA>' });
+    expect(post.attachments).toEqual([
+      {
+        color: '#d8452f',
+        fallback: '⏰ 5분째 답이 없습니다.',
+        blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '⏰ *5분째 답이 없습니다.*' } }],
+      },
+    ]);
+  });
+
+  it('12분: 담당자가 답하지 않았다는 사유가 막대의 설명 줄로 붙는다', async () => {
+    adminWith([
+      {
+        ...WAITING,
+        awaiting_since: '2026-10-05T02:47:00Z', // 13분째
+        escalation_level: 1,
+        assigned_slack_user_id: 'U0AAA',
+        assigned_label: '이정현',
+      },
+    ]);
+    await runEscalations(NOW);
+    const post = postMock.mock.calls[0][0];
+    expect(post.text).toBe('<@U0AAA>');
+    expect(post.attachments![0].blocks).toEqual([
+      { type: 'section', text: { type: 'mrkdwn', text: '⏰ *12분째 답이 없습니다.*' } },
+      {
+        type: 'context',
+        elements: [{ type: 'mrkdwn', text: '담당 <@U0AAA> 님이 응답하지 않아 전원에게 알립니다.' }],
+      },
+    ]);
+  });
+
+  it('30분: 방에는 🚨 빨간 막대, #해외문의 피드에는 예전 그대로 글자 한 줄', async () => {
+    adminWith([{ ...WAITING, awaiting_since: '2026-10-05T02:29:00Z', escalation_level: 2 }]); // 31분째
+    await runEscalations(NOW);
+    expect(postMock).toHaveBeenCalledTimes(2);
+    expect(postMock.mock.calls[0][0].attachments![0].blocks[0]).toEqual({
+      type: 'section',
+      text: { type: 'mrkdwn', text: '🚨 *30분째 미응답입니다.*' },
+    });
+    // 피드 줄에는 이름표를 붙이지 않는다
+    expect(postMock.mock.calls[1][0]).toEqual({ text: '🚨 30분째 미응답 · 익명 · <#C0ROOM>', channelId: 'C0FEED' });
+  });
+
+  it('스레드 방식 세션에는 예전 문구 그대로 스레드에 올린다', async () => {
+    adminWith([{ ...WAITING, slack_mode: 'thread', slack_channel_id: 'C0FEED', slack_thread_ts: '1.0' }]);
+    await runEscalations(NOW);
+    expect(postMock.mock.calls[0][0]).toEqual({
+      text: '⏰ <@U0AAA> 5분째 답이 없습니다.',
+      channelId: 'C0FEED',
+      threadTs: '1.0',
+      replyBroadcast: false,
+    });
+  });
+
+  it('SLACK_ROOM_LOOK=off 면 방에도 예전 문구로 올린다', async () => {
+    process.env.SLACK_ROOM_LOOK = 'off';
+    adminWith([WAITING]);
+    await runEscalations(NOW);
+    expect(postMock.mock.calls[0][0]).toEqual({ text: '⏰ <@U0AAA> 5분째 답이 없습니다.', channelId: 'C0ROOM' });
   });
 });
diff --git a/liv-clinic/src/lib/chat/__tests__/slackEvents.test.ts b/liv-clinic/src/lib/chat/__tests__/slackEvents.test.ts
index c67038f..d289a5c 100644
--- a/liv-clinic/src/lib/chat/__tests__/slackEvents.test.ts
+++ b/liv-clinic/src/lib/chat/__tests__/slackEvents.test.ts
@@ -129,6 +129,34 @@ describe('classifySlackEvent — infinite loop prevention', () => {
   it('ignores bot_message subtype even without bot_id', () => {
     expect(classifySlackEvent(staffReply({ subtype: 'bot_message' })).action).toBe('ignore');
   });
+  // 2026-10-01 실측: username·icon_emoji를 붙여 올린 글(손님 이름표·LIV 알림·번역본)은
+  // subtype이 bot_message이고 user가 없다. 손님 방의 본문 글이므로 걸러지지 않으면 손님에게 되돌아간다.
+  it('이름표를 붙여 올린 우리 글(bot_message, user 없음, 방 본문)을 무시한다', () => {
+    const event = envelope({
+      type: 'message',
+      subtype: 'bot_message',
+      channel: 'C0ROOM',
+      channel_type: 'group',
+      bot_id: 'B0BMNF6U39R',
+      username: 'Yuki Tanaka 손님',
+      icons: { emoji: ':flag-jp:' },
+      text: '울쎄라 가격이 얼마인가요?',
+      ts: '1790847492.238449',
+    });
+    expect(classifySlackEvent(event)).toEqual({ action: 'ignore', reason: 'bot_or_app_message' });
+  });
+  it('색 막대만 있는 알림 글(text가 비어 있음)도 무시한다', () => {
+    const event = envelope({
+      type: 'message',
+      subtype: 'bot_message',
+      channel: 'C0ROOM',
+      bot_id: 'B0BMNF6U39R',
+      username: 'LIV 알림',
+      text: '',
+      ts: '1790847493.695469',
+    });
+    expect(classifySlackEvent(event)).toEqual({ action: 'ignore', reason: 'bot_or_app_message' });
+  });
 });
 
 describe('classifySlackEvent — filtering', () => {
````

- [ ] **Step 2: 실패를 확인한다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/escalationRunner.test.ts src/lib/chat/__tests__/slackEvents.test.ts 2>&1 | tail -6`
Expected: FAIL — `Test Files  1 failed | 1 passed (2)`, `Tests  3 failed | 35 passed (38)` (`escalationRunner`의 방 게시 3건. `slackEvents`는 전부 통과).

- [ ] **Step 3: 구현을 바꾼다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T9-impl`

<!-- block: T9-impl | diff | escalationRunner.ts -->
````diff
diff --git a/liv-clinic/src/lib/chat/escalationRunner.ts b/liv-clinic/src/lib/chat/escalationRunner.ts
index 1c6fdec..3b28311 100644
--- a/liv-clinic/src/lib/chat/escalationRunner.ts
+++ b/liv-clinic/src/lib/chat/escalationRunner.ts
@@ -4,8 +4,15 @@ import { isFollowupEnabled } from '@/lib/chat/chatFlags';
 import { parseThresholds, planEscalation } from '@/lib/chat/escalation';
 import { getSlackChannelId, isSlackRelayConfigured, postSlackMessage } from '@/lib/chat/slack';
 import { loadStaffDirectory, mentionOf } from '@/lib/chat/slackStaff';
-import { postFeed, RELAY_SESSION_COLUMNS, resolveTarget, type RelaySessionRow } from '@/lib/chat/slackRelay';
-import { buildEscalationText, buildFeedLine } from '@/lib/chat/slackText';
+import { styledEscalation } from '@/lib/chat/slackLook';
+import {
+  postFeed,
+  postStyled,
+  RELAY_SESSION_COLUMNS,
+  resolveTarget,
+  type RelaySessionRow,
+} from '@/lib/chat/slackRelay';
+import { buildFeedLine } from '@/lib/chat/slackText';
 
 // 3분마다 호출된다 (netlify/functions/chat-ops.mts → POST /api/chat/ops).
 // 영업시간 판정은 호출자(app/api/chat/ops/route.ts) 한 곳에서만 한다 — 여기서는 반복하지 않는다.
@@ -84,14 +91,16 @@ export async function runEscalations(now: Date): Promise<{ checked: number; esca
 
     const assigneeMention = assigneeId ? mentionOf(assigneeId) : null;
     const mention = step.target === 'assignee' && assigneeMention ? assigneeMention : staff.mentionAll();
-    const text = buildEscalationText({ level: step.nextLevel, minutes: step.minutes, mention, assigneeMention });
+    const msg = styledEscalation({ level: step.nextLevel, minutes: step.minutes, mention, assigneeMention });
 
     if (target.mode === 'room') {
-      const r = await postSlackMessage({ text, channelId: target.channelId });
+      // 손님 방: LIV 알림 이름표 — 멘션은 본문에, 문장은 빨간 막대에 (스펙 slack-room-look §3.4)
+      const r = await postStyled(msg, { channelId: target.channelId });
       if (!r.ok) console.warn('[chat ops] escalation post failed:', r.error);
     } else if (target.mode === 'thread' && target.threadTs) {
+      // 스레드 방식: 예전 문구 그대로 글자만
       const r = await postSlackMessage({
-        text,
+        text: msg.plainText,
         channelId: target.channelId ?? undefined,
         threadTs: target.threadTs,
         replyBroadcast: step.nextLevel >= 2,
````

- [ ] **Step 4: 통과·전체 테스트·타입 검사·lint**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run src/lib/chat/__tests__/escalationRunner.test.ts src/lib/chat/__tests__/slackEvents.test.ts 2>&1 | tail -4 && npx vitest run 2>&1 | tail -6 && npx tsc --noEmit && echo TSC-OK && npx eslint src/lib/chat/escalationRunner.ts src/lib/chat/__tests__/escalationRunner.test.ts src/lib/chat/__tests__/slackEvents.test.ts && echo LINT-OK
```
Expected: `Tests  38 passed (38)`, 이어서 `Test Files  60 passed (60)`, `Tests  985 passed (985)`, `TSC-OK`, `LINT-OK`.

- [ ] **Step 5: 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git add liv-clinic/src/lib/chat/escalationRunner.ts liv-clinic/src/lib/chat/__tests__/escalationRunner.test.ts liv-clinic/src/lib/chat/__tests__/slackEvents.test.ts && git commit -m "feat(chat): 손님 방의 재촉 알림을 LIV 알림 빨간 막대로 + 이름표 글 되돌아옴 방지 회귀 테스트" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 6: 대조**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms" && for f in liv-clinic/src/lib/chat/escalationRunner.ts liv-clinic/src/lib/chat/__tests__/escalationRunner.test.ts liv-clinic/src/lib/chat/__tests__/slackEvents.test.ts; do echo "$(git rev-parse HEAD:$f)  $f"; done
```
Expected:

| 파일 | 나와야 하는 값 |
|------|----------------|
| `liv-clinic/src/lib/chat/escalationRunner.ts` | `3b2831178f5725a582471d1c625a9b29672ec0cf` |
| `liv-clinic/src/lib/chat/__tests__/escalationRunner.test.ts` | `eeb22230042582a26de357424d48398ab4ef62f8` |
| `liv-clinic/src/lib/chat/__tests__/slackEvents.test.ts` | `d289a5c84a23b0eb63775afa0ffb60874f17dda0` |

---

### Task 10: 열려 있는 방 이름을 바꾸는 운영 스크립트

**Files:**
- Create: `liv-clinic/scripts/slack-rename-open-rooms.mjs`

**Interfaces:**
- Consumes: Task 1의 `isDatedRoomName`·`roomNameCandidates`(node가 `../src/lib/chat/roomName.ts`를 바로 import), `liv-clinic/.env.local`의 `DATABASE_URL`, (`--commit`일 때만) `liv-clinic/.env.slack-trial.local`의 `SLACK_BOT_TOKEN`
- Produces: `node scripts/slack-rename-open-rooms.mjs` = 미리 보기(읽기 전용 트랜잭션, Slack 호출 없음). `node scripts/slack-rename-open-rooms.mjs --commit` = 실제로 바꾼다(`conversations.rename` + `chat_sessions.slack_room_name` 갱신, 호출마다 3.3초 쉼)

**이 과제에서는 미리 보기만 돌린다.** `--commit`은 Task 13에서 원장님 승인 뒤에만 쓴다. 미리 보기는 운영 DB를 읽기만 하고 Slack을 부르지 않는다.

- [ ] **Step 1: 스크립트를 쓴다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T10-script`

<!-- block: T10-script | full | liv-clinic/scripts/slack-rename-open-rooms.mjs -->
````js
// 열려 있는 손님 방의 이름을 새 규칙(날짜-이름)으로 바꾼다 — 배포 뒤 한 번 돌리는 운영 스크립트.
// 스펙: docs/superpowers/specs/2026-10-01-slack-room-look-design.md §3.7
//
// 실행 (liv-clinic 폴더에서):
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/slack-rename-open-rooms.mjs            ← 미리 보기. 아무것도 바꾸지 않는다
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/slack-rename-open-rooms.mjs --commit   ← 실제로 바꾼다 (원장님 승인 뒤에만)
//
// 대상   slack_mode='room' 이고 채널이 있고 status='open' 이고 완료(resolved_at)되지 않은 세션. 이미 새 꼴이면 건너뛴다.
// 새 이름 src/lib/chat/roomName.ts 의 roomNameCandidates — 운영 코드와 같은 규칙. 날짜는 세션을 만든 날(한국 시각).
// Slack  conversations.rename (우리 봇이 만든 방이라 가능, groups:write). name_taken 이면 다음 후보(-2, -3, -참조코드).
//        분당 20회 한도라 호출마다 3.3초 쉰다. 보관된 방은 is_archived 로 실패하므로 건너뛰고 적어 둔다.
// 토큰   .env.slack-trial.local 의 SLACK_BOT_TOKEN — 이 PC에서는 Netlify 값이 가려져 읽히지 않는다. 값은 화면에 찍지 않는다.
// 참고   Node 24는 .ts 를 바로 import 한다. 실행할 때 뜨는 MODULE_TYPELESS_PACKAGE_JSON 경고는 무시해도 된다.

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { isDatedRoomName, roomNameCandidates } from '../src/lib/chat/roomName.ts';

const require = createRequire(new URL('../package.json', import.meta.url));
const { Client } = require('pg');

const COMMIT = process.argv.includes('--commit');
const RENAME_INTERVAL_MS = 3300;

/** KEY=값 한 줄만 읽는다 (.env.local 에는 여러 줄 값도 있다). */
function readEnv(file, key) {
  const url = new URL(`../${file}`, import.meta.url);
  if (!existsSync(url)) return '';
  for (const line of readFileSync(url, 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, '');
  }
  return '';
}

const DATABASE_URL = readEnv('.env.local', 'DATABASE_URL');
if (!DATABASE_URL) throw new Error('DATABASE_URL 없음 (liv-clinic/.env.local)');
const TOKEN = readEnv('.env.slack-trial.local', 'SLACK_BOT_TOKEN');
if (COMMIT && !TOKEN.startsWith('xoxb-')) {
  throw new Error('SLACK_BOT_TOKEN 없음 (liv-clinic/.env.slack-trial.local 에 xoxb- 로 시작하는 봇 토큰이 있어야 한다)');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function renameChannel(channel, name) {
  try {
    const res = await fetch('https://slack.com/api/conversations.rename', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ channel, name }),
    });
    const json = await res.json();
    return json.ok ? { ok: true, name: json.channel?.name ?? name } : { ok: false, error: json.error ?? 'invalid_response' };
  } catch (e) {
    return { ok: false, error: `fetch_failed: ${e?.message ?? e}` };
  }
}

const db = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await db.connect();
if (!COMMIT) await db.query('BEGIN READ ONLY');

const { rows } = await db.query(
  `SELECT id, visitor_name, visitor_locale, slack_channel_id, slack_room_name, created_at
     FROM chat_sessions
    WHERE slack_mode = 'room' AND slack_channel_id IS NOT NULL AND status = 'open' AND resolved_at IS NULL
    ORDER BY created_at ASC`
);

const targets = rows.filter((r) => !isDatedRoomName(r.slack_room_name));
console.log(`열려 있는 방 ${rows.length}개 · 이미 새 이름 ${rows.length - targets.length}개 · 바꿀 방 ${targets.length}개`);
console.log(COMMIT ? '실제로 바꿉니다 (--commit)\n' : '미리 보기입니다 — 아무것도 바꾸지 않습니다. 실제로 바꾸려면 --commit\n');

const planned = new Set(rows.map((r) => r.slack_room_name).filter(isDatedRoomName));
// 이미 새 이름인 방도 표에 보여 준다 — 배포 뒤 새로 생긴 방이 새 규칙으로 만들어졌는지 확인하는 데 쓴다.
const report = rows
  .filter((r) => isDatedRoomName(r.slack_room_name))
  .map((r) => ({ 지금: r.slack_room_name, 새이름: r.slack_room_name, 결과: '이미 새 이름' }));

for (const r of targets) {
  const candidates = roomNameCandidates({
    visitorName: r.visitor_name,
    visitorLocale: r.visitor_locale,
    sessionId: r.id,
    at: r.created_at,
  });

  if (!COMMIT) {
    // 같은 묶음 안에서 겹치는 이름만 미리 피한다. Slack 쪽(보관된 방 포함) 겹침은 --commit 때 name_taken 으로 드러난다.
    const name = candidates.find((n) => !planned.has(n)) ?? candidates[candidates.length - 1];
    planned.add(name);
    report.push({ 지금: r.slack_room_name, 새이름: name, 결과: '미리 보기' });
    continue;
  }

  let outcome = '실패: name_taken';
  for (const name of candidates) {
    const res = await renameChannel(r.slack_channel_id, name);
    await sleep(RENAME_INTERVAL_MS);
    if (res.ok) {
      await db.query('UPDATE chat_sessions SET slack_room_name = $1 WHERE id = $2', [res.name, r.id]);
      outcome = res.name;
      break;
    }
    if (res.error === 'name_taken') continue;
    outcome = res.error === 'is_archived' ? '건너뜀: 보관된 방' : `실패: ${res.error}`;
    break;
  }
  const done = !outcome.startsWith('실패') && !outcome.startsWith('건너뜀');
  report.push({ 지금: r.slack_room_name, 새이름: done ? outcome : candidates[0], 결과: done ? '바꿈' : outcome });
}

console.table(report);
if (COMMIT) {
  const changed = report.filter((x) => x.결과 === '바꿈').length;
  console.log(`바꾼 방 ${changed}개 / 대상 ${targets.length}개`);
}

if (!COMMIT) await db.query('ROLLBACK');
await db.end();
````

- [ ] **Step 2: 미리 보기를 돌린다 (읽기 전용)**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/slack-rename-open-rooms.mjs 2>&1 | grep -v "Warning\|warning\|Reparsing\|trace-warnings"`
Expected: 첫 줄 `열려 있는 방 N개 · 이미 새 이름 0개 · 바꿀 방 N개`, 둘째 줄 `미리 보기입니다 — 아무것도 바꾸지 않습니다. …`, 이어서 `지금`·`새이름`·`결과` 세 칸짜리 표. 2026-10-02에는 8줄이었다(그 사이 방이 보관되거나 새로 생겼으면 수가 다르다 — 정상이다):

| 지금 | 새이름 |
|------|--------|
| `chat-en-39f4d4` | `09월14일-영어손님` |
| `chat-yumi-652e53` | `09월24일-yumi` |
| `chat-esther-b64871` | `09월29일-esther` |
| `chat-fiona-d8553f` | `10월01일-fiona` |
| `chat-esther-167954` | `10월01일-esther` |
| `chat-sarah-64f363` | `10월01일-sarah` |
| `chat-smoke-test-1001-a38519` | `10월01일-smoke-test-1001` |
| `chat-test-demo-claude-40e569` | `10월01일-test-demo-claude` |

모든 줄의 `결과`는 `미리 보기`다. 새 이름이 `NN월NN일-…` 꼴이 아니거나 오류로 끝나면 멈추고 보고한다.

- [ ] **Step 3: lint·커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx eslint scripts/slack-rename-open-rooms.mjs && echo LINT-OK && cd .. && git add liv-clinic/scripts/slack-rename-open-rooms.mjs && git commit -m "feat(chat): 열려 있는 손님 방 이름을 새 규칙으로 바꾸는 운영 스크립트(기본은 미리 보기)" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```
Expected: `LINT-OK`, 커밋 1건.

- [ ] **Step 4: 대조**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && git rev-parse HEAD:liv-clinic/scripts/slack-rename-open-rooms.mjs`
Expected:

| 파일 | 나와야 하는 값 |
|------|----------------|
| `liv-clinic/scripts/slack-rename-open-rooms.mjs` | `c541c48c02ea9062b082d904b70e7cf52edecf95` |

---

### Task 11: 문서와 환경변수 예시

**Files:**
- Modify: `.env.example` (루트), `docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md`, `docs/superpowers/specs/2026-09-03-slack-patient-rooms-design.md`

**Interfaces:**
- Consumes: 없음
- Produces: `.env.example`에서 `SLACK_ROOM_PREFIX`가 빠지고 `SLACK_ROOM_LOOK`이 들어간다. 봇 토큰 설명의 스코프 목록에 `chat:write.customize`. 설정 안내 문서의 권한·환경변수·첫날 확인·직원 사용법이 새 방 이름과 글 모양에 맞게 바뀐다. 2026-09-03 설계서 머리에 개정 표시 한 줄.

- [ ] **Step 1: 고친다**

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && node plan-apply.mjs T11-docs`

<!-- block: T11-docs | diff | .env.example, 2026-09-03-slack-patient-rooms-design.md, 2026-09-03-slack-patient-rooms-slack-setup.md -->
````diff
diff --git a/.env.example b/.env.example
index 4467346..60a56a2 100644
--- a/.env.example
+++ b/.env.example
@@ -34,7 +34,7 @@ INSTAGRAM_ACCESS_TOKEN=your-instagram-access-token
 # ========================================
 # Slack 라이브채팅 릴레이 (서버 전용)
 # ========================================
-# 봇 토큰 (xoxb-…). 스코프: chat:write, groups:history, groups:write, groups:read, users:read
+# 봇 토큰 (xoxb-…). 스코프: chat:write, chat:write.customize, groups:history, groups:write, groups:read, users:read
 SLACK_BOT_TOKEN=xoxb-...
 # Events API 서명 검증용
 SLACK_SIGNING_SECRET=
@@ -45,8 +45,8 @@ SLACK_CHANNEL_ID=
 SLACK_OBSERVERS=
 # 긴급 정지: off 로 두면 방을 만들지 않고 #해외문의 스레드 방식으로만 동작한다. 평소에는 비워 둔다
 SLACK_ROOMS=
-# 손님별 채널 이름 접두어 (기본 chat). 한글 가능 여부는 첫날 시험
-SLACK_ROOM_PREFIX=chat
+# 긴급 정지: off 로 두면 손님 방 안의 글을 예전 모양(이름표·색 막대 없이 글자만)으로 올린다. 방 이름 규칙과는 무관. 평소에는 비워 둔다
+SLACK_ROOM_LOOK=
 # Slack API 호출 타임아웃(ms)
 SLACK_POST_TIMEOUT_MS=5000
 # 미응답 확대 알림 — netlify/functions/chat-ops.mts → POST /api/chat/ops 공유 시크릿. 비우면 503
diff --git a/docs/superpowers/specs/2026-09-03-slack-patient-rooms-design.md b/docs/superpowers/specs/2026-09-03-slack-patient-rooms-design.md
index 8c60064..563fb94 100644
--- a/docs/superpowers/specs/2026-09-03-slack-patient-rooms-design.md
+++ b/docs/superpowers/specs/2026-09-03-slack-patient-rooms-design.md
@@ -4,6 +4,7 @@
 > 관련: `docs/01-plan/features/chat-slack-ops-improvement.plan.md`(2026-09-01, 이하 "09-01 계획서"), `docs/02-design/features/chat-offhours-messenger-bridge.design.md`(구현 완료), 마이그레이션 036·037
 > 결정(2026-09-03, 원장님): **A안 채택** — Slack 유지 + 손님 1명당 비공개 채널 1개. 앱 재설치는 원장님이 직접. 알림은 **첫 문의 전원 → 이후 담당자만 → 담당자가 답을 안 하면 다른 직원에게 확대**.
 > 2026-09-10 개정: §6 직원 명단(`SLACK_STAFF`)은 **`#해외문의` 채널 멤버 자동 산출**로 대체, 피드 줄 스레드 답장은 손님에게 전달 + 방 복사. 자세한 내용은 `2026-09-10-slack-staff-from-channel-design.md`.
+> 2026-10-01 개정: §4.2의 채널 이름(`chat-{이름}-{코드}`)은 **`10월01일-이름`**(문의한 날짜 + 손님 이름)으로, §4.3 "방 안의 메시지"의 모양은 **이름표(손님 글·LIV 알림·번역본) + 색 막대**로 대체. `SLACK_ROOM_PREFIX`는 폐기. 자세한 내용은 `2026-10-01-slack-room-look-design.md`.
 
 ---
 
diff --git a/docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md b/docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md
index d7e6866..d2d011e 100644
--- a/docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md
+++ b/docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md
@@ -35,6 +35,8 @@
 
 > 2026-09-10 추가. 이미 설치된 앱이면 스코프 추가 후 **§3 재설치**를 한 번 더 한다. 토큰 값은 바뀌지 않는다.
 
+> 2026-10-01 추가: `chat:write.customize` — 손님 방 안에서 글마다 보낸 사람 이름과 아이콘을 바꾼다(손님 글은 `이름 손님` + 국기, 알림은 `LIV 알림`, 번역본은 `번역본 · 복사용`). 같은 방법으로 추가하고 재설치한다. **2026-10-01에 추가·재설치를 마쳤고 토큰은 바뀌지 않았다.** 목록은 이제 여섯 개다: `chat:write`, `chat:write.customize`, `groups:history`, `groups:write`, `groups:read`, `users:read`. 설계: `2026-10-01-slack-room-look-design.md`.
+
 ## 2. B — 이벤트 2개 추가
 
 1. 같은 앱 화면 왼쪽 메뉴 **Event Subscriptions** 를 클릭합니다. (**Enable Events** 가 이미 켜져 있고 Request URL이 등록돼 있을 겁니다. 건드리지 않습니다.)
@@ -76,7 +78,9 @@
 |------|-----|------|
 | `SLACK_OBSERVERS` | `U0BMNA7292P:이재호` | 지켜보기만 하는 계정(원장님). 방에 초대만 되고 멘션·담당 대상이 아니다 |
 | `SLACK_ROOMS` | 비워 둠 | `off`로 두면 긴급 정지(방 생성·멘션·확대 알림 중지, 스레드 방식) |
-| `SLACK_ROOM_PREFIX` | `chat` | 채널 이름 앞머리. 첫날 시험 뒤 `문의`로 바꿔 볼 수 있음 |
+| `SLACK_ROOM_LOOK` | 비워 둠 | `off`로 두면 손님 방 안의 글을 예전 모양(글자만)으로 올린다 — 이름표·색 막대에 문제가 생겼을 때의 긴급 정지. 방 이름은 그대로다 (2026-10-01 추가) |
+
+> `SLACK_ROOM_PREFIX`는 2026-10-01부터 쓰지 않는다. 방 이름은 `10월01일-이름`(문의한 날짜 + 손님 이름)으로 만들어진다. Netlify에 값이 남아 있어도 해가 없고, 지워도 된다.
 | `CHAT_OPS_SECRET` | 무작위 문자열 40자 (아래 만들기) | 3분마다 도는 미응답 확인 작업의 비밀번호 |
 | `CHAT_ESCALATION_MINUTES` | `5,12,30` | 미응답 알림 간격(분). 나중에 이 값만 바꾸면 됨 |
 
@@ -98,7 +102,7 @@
 
 | 확인 | 방법 | 안 되면 |
 |------|------|---------|
-| 한글 채널 이름 | `SLACK_ROOM_PREFIX`를 `문의`로 바꾸고 재배포 → 새 문의 1건 → 방 이름이 `문의-…`인지 | 자동으로 `chat-…`로 만들어집니다. 그대로 두면 됩니다 |
+| 방 이름 | 새 문의 1건 → 방 이름이 `10월01일-이름` 꼴(문의한 날짜 + 손님 이름)인지 (2026-10-01 개정 — 한글 이름을 Slack이 받는 것은 시험 방에서 확인했다) | Slack이 이름을 거부하면 자동으로 예전 꼴 `chat-…`로 만들어집니다. Netlify **Logs → Functions** 의 `[slack rooms] name rejected` 줄을 Claude에게 보내 주세요 |
 | 방 되살리기 | 방을 완료(보관)한 뒤 그 손님 채팅창에서 메시지를 하나 더 보냄 → 방이 다시 나타나고 🔔 표시가 붙는지 | Netlify **Logs → Functions** 에서 `[slack relay]` 로 시작하는 줄을 Claude에게 보내 주세요 |
 | 휴대폰 알림 | 직원 3명의 휴대폰에 첫 문의 멘션 푸시가 오는지 | Slack 앱 알림 설정에서 "멘션" 알림이 켜져 있는지 확인 |
 | 내부 메모 | 방 안에서 메시지에 마우스를 올려 **스레드로 답글** 을 남김 → 손님 채팅창에 **안 나타나는지** | 나타난다면 즉시 Claude에게 알려 주세요 |
@@ -109,8 +113,9 @@
 ```
 [해외 문의 채팅 — 새 방식 안내]
 
-1. 손님이 홈페이지에서 문의하면 Slack에 손님별 방(#chat-이름-코드)이 생기고 전원이 멘션됩니다.
-   손님에게는 "잠시만 기다려 주세요, 곧 답변드리겠습니다" 안내가 자동으로 먼저 나가 있습니다.
+1. 손님이 홈페이지에서 문의하면 Slack에 손님별 방(#10월01일-이름 — 문의한 날짜와 손님 이름)이 생기고 전원이 멘션됩니다.
+   방 안에서 손님이 쓴 글은 손님 이름과 국기로, 자동 알림은 "LIV 알림"으로 올라옵니다(회색 막대 = 안내, 초록 = 손님이 연락처를 남김, 빨강 = 답이 늦다는 재촉).
+   손님에게는 접수 안내가 자동으로 먼저 나가 있습니다.
 2. 그 방에 한국어로 답을 쓰면 손님 언어로 번역되어 바로 전달됩니다. 먼저 답한 사람이 담당자가 됩니다.
 3. 손님이 이어서 말하면 담당자만 멘션됩니다. 5분 안에 답이 없으면 담당자에게 한 번 더,
    12분이면 전원에게, 30분이면 🚨와 함께 전원에게 알림이 갑니다. 답을 쓰면 알림이 멈춥니다.
````

- [ ] **Step 2: 확인·커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && (grep -c "SLACK_ROOM_PREFIX" .env.example; grep -c "SLACK_ROOM_LOOK" .env.example) && git add .env.example docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md docs/superpowers/specs/2026-09-03-slack-patient-rooms-design.md && git commit -m "docs(chat): 설정 안내와 환경변수 예시를 새 방 이름·글 모양에 맞춘다 (SLACK_ROOM_PREFIX 폐기, SLACK_ROOM_LOOK 추가)" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```
Expected: `0`, `1`, 커밋 1건.

- [ ] **Step 3: 대조**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms" && for f in .env.example docs/superpowers/specs/2026-09-03-slack-patient-rooms-design.md docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md; do echo "$(git rev-parse HEAD:$f)  $f"; done
```
Expected:

| 파일 | 나와야 하는 값 |
|------|----------------|
| `.env.example` | `60a56a26acd1567d1946c6e861bf7ec11c36a87e` |
| `docs/superpowers/specs/2026-09-03-slack-patient-rooms-design.md` | `563fb9448f720ca436638901b8cedb09ade2c30b` |
| `docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md` | `d2d011e403e024f84dd8d091ab4f40114a6846d9` |

---

### Task 12: 전체 검증과 마무리

**Files:**
- Modify: `docs/superpowers/specs/2026-10-01-slack-room-look-design.md` (상태 한 줄 추가)
- Delete: `plan-apply.mjs` (루트의 임시 도구)

**Interfaces:**
- Consumes: Task 1~11의 커밋
- Produces: 검증된 브랜치, 원장님께 드릴 결과 보고

- [ ] **Step 1: 테스트·타입·lint 게이트**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && npx vitest run 2>&1 | tail -6 && npx tsc --noEmit && echo TSC-OK && npx eslint src/lib/chat/roomName.ts src/lib/chat/slackRooms.ts src/lib/chat/slack.ts src/lib/chat/slackText.ts src/lib/chat/slackLook.ts src/lib/chat/chatFlags.ts src/lib/chat/slackRelay.ts src/lib/chat/escalationRunner.ts src/lib/chat/__tests__/roomName.test.ts src/lib/chat/__tests__/slackRooms.test.ts src/lib/chat/__tests__/slack.test.ts src/lib/chat/__tests__/slackText.test.ts src/lib/chat/__tests__/slackLook.test.ts src/lib/chat/__tests__/chatFlags.test.ts src/lib/chat/__tests__/slackRelay.test.ts src/lib/chat/__tests__/escalationRunner.test.ts src/lib/chat/__tests__/slackEvents.test.ts scripts/slack-rename-open-rooms.mjs && echo LINT-OK
```
Expected: `Test Files  60 passed (60)`, `Tests  985 passed (985)`, `TSC-OK`, `LINT-OK`.

- [ ] **Step 2: 빌드**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 NODE_TLS_REJECT_UNAUTHORIZED=0 npm run build 2>&1 | tail -12`
Expected: 경로 목록(`ƒ /api/slack/events` 등)과 범례(`○ (Static)`·`● (SSG)`·`ƒ (Dynamic)`)로 끝난다. 오류 없음.

빌드가 `*.generated.ts` 세 파일의 줄바꿈을 바꿔 놓는다. 되돌린다:

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && git checkout -- liv-clinic/src/lib/data/concernRules.generated.ts liv-clinic/src/lib/guides/guides.generated.ts liv-clinic/src/lib/guides/guides.index.generated.ts && git status --short`
Expected: `?? plan-apply.mjs` 한 줄만 남는다.

- [ ] **Step 3: 전체 대조**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms" && for f in .env.example docs/superpowers/specs/2026-09-03-slack-patient-rooms-design.md docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md liv-clinic/scripts/slack-rename-open-rooms.mjs liv-clinic/src/lib/chat/chatFlags.ts liv-clinic/src/lib/chat/escalationRunner.ts liv-clinic/src/lib/chat/roomName.ts liv-clinic/src/lib/chat/slack.ts liv-clinic/src/lib/chat/slackLook.ts liv-clinic/src/lib/chat/slackRelay.ts liv-clinic/src/lib/chat/slackRooms.ts liv-clinic/src/lib/chat/slackText.ts liv-clinic/src/lib/chat/__tests__/chatFlags.test.ts liv-clinic/src/lib/chat/__tests__/escalationRunner.test.ts liv-clinic/src/lib/chat/__tests__/roomName.test.ts liv-clinic/src/lib/chat/__tests__/slack.test.ts liv-clinic/src/lib/chat/__tests__/slackEvents.test.ts liv-clinic/src/lib/chat/__tests__/slackLook.test.ts liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts liv-clinic/src/lib/chat/__tests__/slackRooms.test.ts liv-clinic/src/lib/chat/__tests__/slackText.test.ts; do echo "$(git rev-parse HEAD:$f)  $f"; done
```
Expected(21개 파일 — 이 과제 전까지 손댄 파일 전부):

| 파일 | 나와야 하는 값 |
|------|----------------|
| `.env.example` | `60a56a26acd1567d1946c6e861bf7ec11c36a87e` |
| `docs/superpowers/specs/2026-09-03-slack-patient-rooms-design.md` | `563fb9448f720ca436638901b8cedb09ade2c30b` |
| `docs/superpowers/specs/2026-09-03-slack-patient-rooms-slack-setup.md` | `d2d011e403e024f84dd8d091ab4f40114a6846d9` |
| `liv-clinic/scripts/slack-rename-open-rooms.mjs` | `c541c48c02ea9062b082d904b70e7cf52edecf95` |
| `liv-clinic/src/lib/chat/chatFlags.ts` | `bc889f80f0990c3c8d89e4abc80e2868fcca89fb` |
| `liv-clinic/src/lib/chat/escalationRunner.ts` | `3b2831178f5725a582471d1c625a9b29672ec0cf` |
| `liv-clinic/src/lib/chat/roomName.ts` | `ef1ac69a142ba74121b83eb6e4c317d18867296c` |
| `liv-clinic/src/lib/chat/slack.ts` | `86b7c6e1a26512e486f3d73f88249fbfb1f2a5e5` |
| `liv-clinic/src/lib/chat/slackLook.ts` | `08e23a20b75e94c8e7a7d3cdf9e64d51e5bfe3c7` |
| `liv-clinic/src/lib/chat/slackRelay.ts` | `7b4f542a510af2aebfc711f30c0ca7a432287a78` |
| `liv-clinic/src/lib/chat/slackRooms.ts` | `ae766d4388177d7d5f64d218b0ea814f90fa3800` |
| `liv-clinic/src/lib/chat/slackText.ts` | `9ff36739308894f00bb2a6dc65248311d5b2ffc9` |
| `liv-clinic/src/lib/chat/__tests__/chatFlags.test.ts` | `74a412aab278ec5420e62f42dc82ebae52bf83eb` |
| `liv-clinic/src/lib/chat/__tests__/escalationRunner.test.ts` | `eeb22230042582a26de357424d48398ab4ef62f8` |
| `liv-clinic/src/lib/chat/__tests__/roomName.test.ts` | `a632af88ca4d33aa4812d6baeb4853dabfb0bfc8` |
| `liv-clinic/src/lib/chat/__tests__/slack.test.ts` | `d24339a13202e343b91c54e4f92cf54820344383` |
| `liv-clinic/src/lib/chat/__tests__/slackEvents.test.ts` | `d289a5c84a23b0eb63775afa0ffb60874f17dda0` |
| `liv-clinic/src/lib/chat/__tests__/slackLook.test.ts` | `165130f3eb5f14ebb52c330faebf1157bffc2298` |
| `liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts` | `1d4c21908e61c89fbaf2ae573549b2935521ddd2` |
| `liv-clinic/src/lib/chat/__tests__/slackRooms.test.ts` | `ebbdc9274de138db2b47743c8b9efc3df9aa0e18` |
| `liv-clinic/src/lib/chat/__tests__/slackText.test.ts` | `288c1d8ebfe36555fcbbd34b2bba51da07ab4c9f` |

그리고 이 브랜치가 그 밖의 파일을 건드리지 않았는지 본다:

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && git diff --stat fc670e2 HEAD | tail -1 && git diff --name-only fc670e2 HEAD | wc -l`
Expected: `23 files changed, …`와 `23` — 위 21개 + 이 계획서 + 설계서.

- [ ] **Step 4: 설계서에 구현 상태를 적는다**

`docs/superpowers/specs/2026-10-01-slack-room-look-design.md` 머리의 `> 상태: **모양 승인(…` 줄 **바로 아래**에 다음 한 줄을 넣는다. `YYYY-MM-DD` 자리에는 실행한 날짜를 적는다(예: `2026-10-02`):

```
> 구현(YYYY-MM-DD): 계획서 `docs/superpowers/plans/2026-10-01-slack-room-look.md`대로 브랜치 `feature/slack-room-look`에 구현했다 — 테스트 60파일 985건·타입 검사·빌드 통과, 계획서 대조 21개 파일 일치. **운영 반영(master 푸시 → 시험 문의 → 방 이름 바꾸기)은 원장님 승인 대기.**
```

- [ ] **Step 5: 임시 도구와 검증용 브랜치를 지우고 커밋**

```bash
cd "D:/dev/LIV_homepage-slack-rooms" && rm plan-apply.mjs && git add docs/superpowers/specs/2026-10-01-slack-room-look-design.md && git commit -m "docs(chat): 설계서에 구현 상태 기록 — Slack 손님 방 보기 개선" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git status --short | wc -l && (git branch -D scratch/slack-room-look-dev 2>/dev/null || echo "scratch 브랜치 없음")
```
Expected: 커밋 1건, `0`(작업 폴더가 깨끗하다), 이어서 `Deleted branch scratch/slack-room-look-dev …` 또는 `scratch 브랜치 없음`. (그 브랜치는 계획서를 만들 때 쓴 검증용이다. Step 3의 대조가 통과했으므로 이 브랜치의 내용과 같다는 것이 이미 확인됐다.)

- [ ] **Step 6: 원장님께 결과 보고**

쉬운 한국어로 보고한다(전문용어를 피한다). 담을 것: ① 무엇을 만들었는지 두 줄(방 이름, 방 안의 글 모양) ② 검증 결과(테스트 985건 통과, 빌드 성공, 계획서 대조 일치) ③ 아직 운영에는 아무것도 나가지 않았다는 것 ④ 다음에 승인이 필요한 일 세 가지(배포 / 시험 문의 — 직원에게 알림이 한 번 간다 / 열려 있는 방 이름 바꾸기 — 목록을 먼저 보여 드린다). 그리고 Task 13의 Step 1로 넘어가 첫 승인을 여쭌다.

---

### Task 13: 운영 반영 (원장님 승인 지점)

**이 과제의 모든 단계는 운영에 닿는다. 단계마다 원장님께 묻고, 답을 받은 뒤에만 실행한다.** 한 번의 승인을 다음 단계의 승인으로 넘겨 쓰지 않는다.

**Files:** 없음(코드 변경 없음)

**Interfaces:**
- Consumes: 브랜치 `feature/slack-room-look`(Task 1~12 커밋), Netlify CLI 로그인(사이트 `de7005fe-c770-4b2f-bbe0-1025513014d5`), `liv-clinic/.env.local`의 `DATABASE_URL`, `liv-clinic/.env.slack-trial.local`의 `SLACK_BOT_TOKEN`
- Produces: 운영 배포, 시험 문의 결과, 새 이름으로 바뀐 방, 직원 안내

DB 변경이 없으므로 배포 순서에 걸리는 것이 없다. Slack 앱 권한(`chat:write.customize`)은 2026-10-01에 이미 추가돼 있다.

- [ ] **Step 1: [승인 ①] 운영 배포를 묻는다**

원장님께 이렇게 묻는다: "master에 올리면 Netlify가 자동으로 배포합니다(1분 30초쯤). DB 변경은 없습니다. 배포되면 그때부터 새로 생기는 방은 `10월02일-이름` 꼴로 만들어지고, 이미 있는 방도 새로 올라오는 글부터 이름표와 색 막대로 보입니다. 진행할까요?"

- [ ] **Step 2: 푸시 (승인 ① 뒤)**

Run:
```bash
cd "D:/dev/LIV_homepage-slack-rooms" && git fetch origin && git merge-base --is-ancestor origin/master HEAD && echo FF-OK
```
Expected: `FF-OK`(origin/master가 이 브랜치의 조상 — fast-forward 가능). `FF-OK`가 안 나오면 멈춘다: master가 그 사이 움직인 것이므로 `git merge origin/master` → Task 12의 Step 1·2를 다시 통과시킨 뒤 원장님께 알리고 진행한다.

Run: `cd "D:/dev/LIV_homepage-slack-rooms" && git push origin feature/slack-room-look:master && git rev-parse --short HEAD`
Expected: `… -> master`(fast-forward)와 푸시한 커밋의 짧은 값. 메인 폴더 `D:\dev\LIV_homepage`의 체크아웃은 건드리지 않는다.

- [ ] **Step 3: 배포 완료 확인**

이번 변경은 서버 쪽뿐이라 공개 페이지에 표식이 없다. Netlify의 배포 상태로 확인한다(20초 간격, 최대 25분):

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && NODE_TLS_REJECT_UNAUTHORIZED=0 netlify api listSiteDeploys --data '{"site_id":"de7005fe-c770-4b2f-bbe0-1025513014d5","per_page":2}' 2>/dev/null | grep -E '"state"|"commit_ref"|"published_at"' | head -6`
Expected: 첫 배포의 `"commit_ref"`가 Step 2에서 푸시한 커밋으로 시작하고 `"state": "ready"`. `building`이면 기다렸다 다시 본다. 추정으로 "배포됨"이라고 보고하지 않는다.

- [ ] **Step 4: [승인 ②] 시험 문의를 묻는다**

원장님께 이렇게 묻는다: "운영 사이트에 시험 문의를 1건 넣어 방 이름과 모양을 확인하려 합니다. 직원분들 Slack에 실제 알림(멘션)이 한 번 갑니다 — '시험입니다'라고 미리 알려 주시면 좋겠습니다. 시험이 끝나면 그 방은 바로 보관해 주셔야 합니다(안 그러면 5분·12분·30분 알림이 이어집니다). 지금 해도 될까요?"

- [ ] **Step 5: 시험 문의 (승인 ② 뒤)**

운영 사이트 `https://liv-clinic.net/en`의 채팅창에서 이름 `Smoke Test 1002`로 "How much is Ulthera?"를 보낸다(Playwright MCP — 요령은 메모리 `chat-contact-first-plan-status`의 "운영 시험에서 배운 것": 세션을 만들고 5~6초 뒤에 글을 보낸다, 팝업이 채팅 단추를 가리면 먼저 닫는다, 끝나면 작업 폴더의 `.playwright-mcp/`를 지운다). 손님 화면에는 접수 안내와 이벤트 링크 안내만 보여야 한다.

방 이름을 확인한다(읽기 전용):

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/slack-rename-open-rooms.mjs 2>&1 | grep -v "Warning\|warning\|Reparsing\|trace-warnings"`
Expected: 표에 `MM월DD일-smoke-test-1002`(오늘 날짜) 줄이 `이미 새 이름`으로 있다. `chat-smoke-test-…`로 만들어졌다면 Slack이 새 이름을 거부한 것이다 — 멈추고 Netlify 로그의 `[slack rooms] name rejected` 줄을 본다.

이 PC의 브라우저는 Slack에 로그인돼 있지 않다. Slack 쪽은 원장님께 그 방의 캡처를 부탁해 아래를 확인한다:

| # | 볼 것 | 기대 |
|---|-------|------|
| 1 | 왼쪽 목록 | `MM월DD일-smoke-test-1002` 방이 생겼다 |
| 2 | 방의 첫 글 | `Smoke Test 1002 손님` 이름과 영국 국기, 직원 멘션 줄, 번역, 원문 인용 |
| 3 | 그 아래 | `LIV 알림`의 회색 막대 `새 문의 · 📥 … · 참조코드 #…` + 작은 회색 설명 두 줄, 이어서 회색 막대 `🎁 가격 문의로 보여 …` + 링크 |
| 4 | `#해외문의` | `🔴 새 문의 · 🇬🇧 Smoke Test 1002 · #MM월DD일-smoke-test-1002 · …` 한 줄(예전과 같은 모양, 방 이름만 새 꼴) |
| 5 | 원장님이 방에 한국어로 답글 | 손님 화면에 번역되어 보인다. 손님 화면에 봇 알림 글이 딸려 오지 않는다 |
| 6 | 손님 화면의 카드에서 이메일을 남김 | 방에 `LIV 알림`의 초록 막대 `📱 손님이 연락처를 남겼습니다 — 이메일: …` |
| 7 | 원장님이 방에 답글을 한 번 더 | 바로 아래 `번역본 · 복사용` 이름으로 번역문만 든 글 |
| 8 | 휴대폰에서 그 번역본을 길게 눌러 "텍스트 복사" → 붙여 넣기 | 번역문만 나온다(이름표 글자가 딸려 오지 않는다) |
| 9 | Slack 검색창에 그 방의 참조코드 | 그 방의 글이 나온다 |

꾸민 글이 거부돼 글자만으로 다시 올라간 흔적이 없는지 본다(시험 시각 앞뒤로 창을 좁게 — 한국 시각에서 9시간을 뺀 UTC로 적는다):

Run (시각 두 개는 실제 시험 시각으로 바꾼다 — 예: 한국 시각 14:10~14:25에 시험했으면 `2026-10-02T05:10:00Z`와 `2026-10-02T05:25:00Z`):
```bash
cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && NETLIFY_SITE_ID=de7005fe-c770-4b2f-bbe0-1025513014d5 NODE_TLS_REJECT_UNAUTHORIZED=0 netlify logs --source functions --function ___netlify-server-handler --since 2026-10-02T05:10:00Z --until 2026-10-02T05:25:00Z 2>&1 | grep -c "slack look\|name rejected"
```
Expected: `0`. (로그는 유실될 수 있으므로 0이라도 위 캡처 확인이 본 증거다.)

끝나면 원장님께 그 시험 방을 **바로 보관**해 달라고 한다. 실패한 항목이 있으면 아래 "되돌리기"를 원장님과 정한다.

- [ ] **Step 6: [승인 ③] 열려 있는 방 이름 바꾸기를 묻는다**

미리 보기를 다시 뽑는다(읽기 전용):

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/slack-rename-open-rooms.mjs 2>&1 | grep -v "Warning\|warning\|Reparsing\|trace-warnings"`

표(지금 이름 → 새 이름)를 원장님께 그대로 보여 드리고 묻는다: "지금 열려 있는 방 N개의 이름을 이렇게 바꿔도 될까요? 방마다 Slack이 '채널 이름을 변경했습니다' 한 줄을 남깁니다. 시험용 방(`chat-smoke-test-…`, `chat-test-demo-…`)은 먼저 보관하시면 목록에서 빠집니다."

- [ ] **Step 7: 방 이름 바꾸기 (승인 ③ 뒤)**

Run: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/slack-rename-open-rooms.mjs --commit 2>&1 | grep -v "Warning\|warning\|Reparsing\|trace-warnings"`
Expected: 방마다 3.3초씩 걸린다. 표의 `결과`가 `바꿈`(또는 보관된 방은 `건너뜀: 보관된 방`), 마지막 줄 `바꾼 방 N개 / 대상 N개`. `실패: …`가 있으면 그 오류를 보고한다(`not_authorized`면 그 방은 우리 봇이 만든 방이 아니다).

다시 미리 보기를 돌려 모든 줄이 `이미 새 이름`인지 확인하고, 원장님께 왼쪽 목록을 한 번 봐 달라고 한다.

- [ ] **Step 8: 정리 (하나씩 확인받는다)**

1. 원장님께 시험 방 `10월01일-yuki-tanaka`(원장님만 들어 있는 방)의 보관을 부탁한다.
2. 토큰 파일을 지운다: `cd "D:/dev/LIV_homepage-slack-rooms" && rm liv-clinic/.env.slack-trial.local && ls liv-clinic/.env.slack-trial.local 2>&1 | tail -1` → `No such file or directory`.
3. 묻는다: "이제 쓰지 않는 Netlify 환경변수 `SLACK_ROOM_PREFIX`를 지워도 될까요? 코드가 읽지 않아서 지워도, 그대로 둬도 동작은 같습니다." 승인 뒤: `cd "D:/dev/LIV_homepage-slack-rooms/liv-clinic" && NETLIFY_SITE_ID=de7005fe-c770-4b2f-bbe0-1025513014d5 NODE_TLS_REJECT_UNAUTHORIZED=0 netlify env:unset SLACK_ROOM_PREFIX`(재배포는 필요 없다).

- [ ] **Step 9: 직원 안내문 (원장님이 `#해외문의`에 게시)**

설계서 §6의 문안을 그대로 드린다:

> 손님 방이 보기 쉽게 바뀌었습니다.
> ① 방 이름이 `10월01일-이름`으로 바뀝니다. 날짜는 손님이 처음 문의한 날입니다. 이름을 안 적은 손님은 `영어손님`처럼 보입니다.
> ② 방 안에서 손님이 쓴 글은 손님 이름과 국기로, 자동 알림은 `LIV 알림`으로 올라옵니다. 회색 막대는 안내, 초록 막대는 손님이 연락처를 남겼다는 뜻, 빨간 막대는 답이 늦다는 재촉입니다.
> ③ `번역본 · 복사용` 글은 지금처럼 길게 눌러 복사해서 위챗·왓츠앱·메일에 붙여 넣으시면 됩니다.
> ④ 위챗·왓츠앱으로 코드(#로 시작)를 보내온 손님은 Slack 맨 위 검색창에 코드를 넣으면 그 방이 나옵니다.
> 답하는 방법은 그대로입니다. 방에 한국어로 쓰면 손님에게 번역되어 전달되고, 직원끼리 메모는 스레드로 남깁니다.

- [ ] **Step 10: 메모리 갱신**

`C:\Users\1\.claude\projects\D--dev-LIV-homepage\memory\slack-room-ux-request-2026-10.md`의 상태를 고친다: 구현 커밋 범위, 배포 커밋과 시각, 시험 문의 결과(표의 9개 항목), 이름을 바꾼 방 수, 정리한 것(시험 방 보관·토큰 파일 삭제·`SLACK_ROOM_PREFIX`), 휴대폰 확인 결과. `MEMORY.md`의 그 줄도 한 줄로 고친다. 설정 안내 문서의 내용이 바뀐 것(`chat:write.customize`, `SLACK_ROOM_LOOK`)은 메모리 `liv-slack-rooms-rollout-notes`에도 한 줄 보탠다.

**되돌리기** (설계서 §6): 방 안의 글 모양은 Netlify 환경변수 `SLACK_ROOM_LOOK=off` + 재배포(`netlify env:set SLACK_ROOM_LOOK off` → `netlify api createSiteBuild --data '{"site_id":"de7005fe-c770-4b2f-bbe0-1025513014d5"}'`, 승인 필요)로 예전 모양이 된다. 방 이름 규칙은 해당 커밋을 되돌려 푸시한다(승인 필요). 이미 만들어졌거나 이름을 바꾼 방은 어느 이름이든 그대로 동작한다 — 코드는 방을 채널 ID로 찾는다.

---

## 스펙 대조 (자체 점검)

| 스펙 | 요구 | 과제 |
|------|------|------|
| §3.1 | 방 이름 `MM월DD일-이름`, 이름 조각 규칙, 익명 이름, 겹칠 때 후보, 예전 꼴 폴백, `roomName.ts`는 import 없음 | 1 |
| §3.1 | `ensureRoom(session, deps, receivedAt)`, `prefix`·`SLACK_ROOM_PREFIX` 제거, 이름 거부 시 예전 꼴로 한 번 → 스레드 | 2 |
| §3.2 | 이름표 다섯 가지와 아이콘, 이름 다듬기(70글자) | 5 |
| §3.3 | 색 막대 = attachments(`color`·`fallback`·`blocks`: section + context), 색 세 가지, 멘션은 막대 밖 | 5, 9 |
| §3.4 1·2 | 방의 첫 글 = 손님 글 + 새 문의 알림(참조코드), `slack_ts`는 손님 글 | 7 |
| §3.4 3·4 | 후속 글, 재발신 🔔 알림 | 7 |
| §3.4 5·6·7 | 관리자 화면 답장·피드 답장 사본·번역본의 이름표 | 7 |
| §3.4 8·9·10 | 연락처·단추·이벤트 알림 | 8 |
| §3.4 11·12 | 재촉 알림 | 9 |
| §3.4 13 | 전달 실패 알림(방 안만 꾸민 글), 사유 문구 수정 | 4(문구), 8 |
| §3.4 | 문구는 `slackText.ts`가 가진다 — 조각 함수, 기존 글자 불변 | 4 |
| §3.5 | `postSlackMessage` 인자, `postStyled`(긴급 스위치·재게시 규칙·`plain`), 글자만으로 갔으면 뒤 알림 생략 | 3, 6, 7 |
| §3.5 | 이름표 글이 손님에게 되돌아가지 않는다(회귀 테스트) | 9 |
| §3.6 | 피드 줄·요약·스레드 방식·피드 채널의 실패 알림은 글자만 | 7, 8, 9(테스트로 고정) |
| §3.7 | 이름 바꾸기 스크립트(미리 보기 기본, `--commit`) | 10, 13 |
| §4 | `SLACK_ROOM_LOOK` 신설, `SLACK_ROOM_PREFIX` 폐기 | 6, 2, 11 |
| §5 | 테스트 표의 아홉 파일 | 1~9 |
| §6 | 롤아웃 순서, 승인 ①②③, 정리, 직원 안내문, 되돌리기 | 13 |
| §0.1 U-6 | 휴대폰 확인 | 13 Step 5의 8번 |
