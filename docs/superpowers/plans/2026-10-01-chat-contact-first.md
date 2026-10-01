# 라이브채팅 "연락처 먼저" 1단계 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 손님이 채팅에 글을 남기면 3초 안에 접수 안내(예상 시간·연락처 요청·되묻기)를 보내고, 낮에도 연락처 카드로 연락처를 받고, 연락처를 남긴 손님은 재촉 알림 대신 "오늘 연락할 손님"으로 챙기며, 가격을 물은 손님에게는 이번 달 프로모션 링크를 먼저 보낸다.

**Architecture:** AI 호출 없이 미리 쓴 문장과 낱말 판정만 쓴다. 로직은 전부 `liv-clinic/src/lib/chat/*`의 작은 모듈(순수 함수 + throw 하지 않는 DB 함수)로 빼고, API 라우트는 검증·한도·응답만 맡는다. 손님 글 처리 순서를 "INSERT → 이메일 인식 → 자동 안내 시작(기다리지 않음) → 번역 → 응답 → 응답 뒤 Slack"으로 바꿔 자동 안내를 앞당긴다. DB는 `chat_sessions`에 컬럼 3개(042, 추가형)만 더하고, 새 컬럼은 기존 공용 조회에 넣지 않아 042 적용 전에 코드가 나가도 채팅 본 기능이 깨지지 않는다.

**Tech Stack:** Next.js 16.1.1 App Router(Node 런타임, `after()`), TypeScript, Vitest 4(`environment: 'node'`, 컴포넌트는 `react-dom/server` 정적 마크업), supabase-js(admin client, 타입 `src/types/supabase.ts`), Slack Web API, next-intl, Tailwind CSS 4.

**Spec:** `docs/superpowers/specs/2026-10-01-chat-contact-first-design.md` (원장님 승인 2026-10-01, 손님 문구 확정 — 부록 A)

**이 계획의 코드는 실행해 본 것이다.** 리포 바깥 임시 사본에서 아래 과제를 순서대로 적용해 확인했다(2026-10-01): 테스트 58파일 878건 통과(기준선 46파일 634건), `npx tsc --noEmit` 통과, 변경 파일 `npx eslint` 통과, `npm run verify:i18n` 통과, `npm run build` 성공, 화면 확인 스크립트 35개 항목 통과. 운영 DB·Slack에는 닿지 않았다. 과제마다 적힌 "통과 건수"는 그때의 실제 값이다.

## Global Constraints

- **작업 위치**: 워크트리 `D:\dev\LIV_homepage-slack-rooms`, 브랜치 `feature/chat-contact-first`. 메인 폴더 `D:\dev\LIV_homepage`(master)는 다른 세션이 쓴다 — 거기서 브랜치를 바꾸거나 작업하지 않는다. 다른 브랜치로 체크아웃하지 않는다.
- **계획서의 코드를 그대로 옮긴다**: 이 계획의 코드는 실행해 검증한 것이다. 고쳐 쓰거나, 줄이거나, "더 낫게" 바꾸지 않는다 — 특히 10개 언어의 손님 문구는 테스트가 글자 하나하나를 보지 않는다. 과제를 커밋하기 전에 `node ../plan-fidelity-check.mjs --root .. --through <과제 번호>`(Task 0에서 만드는 임시 도구)가 두 수가 같은 `N/N 일치`로 끝나는지 확인한다. 옮기는 방법은 자유다(직접 쓰거나, 계획서에서 코드 블록을 스크립트로 꺼내 써도 된다) — 결과가 대조를 통과하면 된다. 계획대로 했는데 테스트가 실패하거나 계획과 다르게 해야 할 이유가 생기면, 고치기 전에 멈추고 원인을 보고한다.
- **운영에 닿는 일은 원장님 승인 뒤에만 한다**: 마이그레이션 042 운영 적용(검증용 dry-run 포함), master 머지·푸시(= Netlify 배포), Netlify 환경변수 변경, 운영 사이트 스모크(직원 Slack에 실제 알림이 간다). Task 1~18은 이 가운데 어느 것도 하지 않는다. Task 19가 승인 지점이다.
- **명령**: 모든 npm/npx/node 명령은 `liv-clinic/` 안에서 실행한다(아래 명령은 cwd = `liv-clinic/` 기준이고, git 경로도 그 기준이다). 이 PC는 TLS 프록시 뒤라 `npm run build`에는 `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1`, DB·Node 스크립트에는 `NODE_TLS_REJECT_UNAUTHORIZED=0`이 필요하다. 테스트에는 `NODE_TLS_REJECT_UNAUTHORIZED=0`을 붙여도 무해하다.
- **검증 게이트**: `npx vitest run` · `npx tsc --noEmit` · 변경 파일만 `npx eslint <files>`(리포 전체 lint에는 기존 오류가 있다) · `npm run verify:i18n` · `npm run build`. 기준선(2026-10-01, `5cb3d3e`): 테스트 46파일 634건 통과, tsc 통과.
- **테스트 관례**: 라우트 단위 테스트가 없다. 로직은 `src/lib/chat/*`에 두고 `src/lib/chat/__tests__/fakeAdmin.ts`로 Supabase를 흉내 낸다. Slack 호출은 `postSlackMessage` 목으로 본다. 컴포넌트 테스트는 jsdom 없이 `renderToStaticMarkup`으로 한다(`components/ui/__tests__/WeChatQR.test.tsx` 방식).
- **손님 문구는 스펙 그대로 쓴다**: 한국어 원문·영어 기준문은 스펙 §4.1·§4.10·§7, 일본어·간체·번체는 부록 A(원장님이 미리보기에서 확인한 문장). 나머지 6개 언어(vi·th·ru·fr·mn·ar)는 이 계획에 적힌 문장을 그대로 쓴다. 문구를 고치게 되면 미리보기(`https://claude.ai/artifact/5sAwkitRkzQ47no9mLFqxv`)도 같이 고친다.
- **throw 하지 않는다**: Slack·DB에 닿는 함수(`sendAutoAckIfDue`, `sendEventHintIfDue`, `contactService`의 세 함수, `slackRelay`의 relay 함수들, `runFollowupDigest`)는 실패를 결과값이나 경고 로그로 돌려주고 throw 하지 않는다. 로그 접두어: `[auto ack]`, `[event hint]`, `[chat contact]`, `[chat followups]`, `[slack relay]`, `[chat ops]`, `[business hours]`. 경고는 한 줄, 오류 코드만(토큰·본문·연락처 금지).
- **042의 새 컬럼(`followup_digest_at`, `visitor_messenger_clicked`, `event_hint_at`)은 공용 조회에 넣지 않는다**: `RELAY_SESSION_COLUMNS`(slackRelay.ts)와 `sendAutoAckIfDue`의 세션 조회에 넣으면 042 적용 전 배포에서 릴레이·자동 안내 전체가 깨진다. 새 컬럼은 그것을 쓰는 함수가 별도 조회로 읽는다.
- **자동으로 나가는 메시지의 저장 형태**: `sender='operator'`, `source='auto'`, `sender_label='자동 안내'`, `original_text`=한국어 원문, `translated_text`=손님 언어, `translation_status='success'`, 번역 API 호출 없음. `source='auto'`는 040 트리거가 답변으로 세지 않는다(대기 시계·미응답 수·확대 알림 불변).
- **정해진 값**: 접수 안내·이벤트 안내 재발송 간격 12시간, 연락처 카드 ✕ 유지 12시간, "직원이 답하는 중" 판정 10분, 마감 임박 60분, 요약 창 9분, 요약 대상 최근 7일, 요약 한 번에 20명("외 N명"), 연락처 저장 한도 세션당 하루 5회.
- **환경변수(신설, 모두 선택)**: `CHAT_CLOSED_DATES`(한국 날짜 쉼표 구분), `CHAT_FOLLOWUP`(`off`만 의미), `CHAT_EVENT_HINT`(`off`만 의미). 기존 `CHAT_BUSINESS_HOURS_JSON`·`CHAT_ESCALATION_MINUTES`·`SLACK_*`·`CHAT_OPS_SECRET`은 그대로다.
- **건드리지 않는 것**: `SITE_INFO.email`(`info@livps.co.kr`), `primaryMessengerFor`(사이트 전역 1순위 메신저), 짧은 안내 문구(`autoAck`·`autoAckOffHours`), 세션 시작 시스템 안내·노란 안내 띠, 관리자 화면의 대화 보기, 개인정보 처리방침(U-5 미승인), `chat-response-baseline.mjs`의 기존 항목 0~8 정의.
- **메시지 JSON 11개 파일**은 줄바꿈이 섞여 있다. 다시 직렬화하지 않는다 — Task 14의 스크립트(바이트 보존 삽입)로만 고친다. 검증은 `git diff --numstat`(파일당 `10 0`) + `npm run verify:i18n`.
- **Grep 도구**: `glob`에 폴더 경로를 넣으면 이 PC에서 거짓 0건이 나온다. 폴더는 `path`로 좁힌다.
- **커밋 메시지**: 한국어 `type(scope): 요약`, 끝에 `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` 한 줄. 푸시는 하지 않는다(Task 19).

---

## 파일 구조

경로는 모두 `liv-clinic/` 기준(★ = 신규).

| 파일 | 책임 | 과제 |
|------|------|------|
| `supabase/migrations/042_chat_contact_first.sql` ★ | `chat_sessions` 컬럼 3개(추가형·멱등) | 1 |
| `src/types/supabase.ts` | 위 컬럼의 타입 | 1 |
| `src/lib/chat/chatFlags.ts` ★ | 긴급 정지 스위치 두 개 | 1 |
| `src/lib/chat/businessHours.ts` | 영업시간 + 휴진일 + 시간대(`open`/`closing`/`closed`) | 2 |
| `src/lib/chat/contactChannels.ts` | 채널 목록·검증·이메일 인식·카드 노출 규칙(순수, 손님 화면과 서버 공용) | 3, 15 |
| `src/lib/constants.ts` | `CHAT_CONTACT_EMAIL` | 3 |
| `src/lib/chat/serverI18n.ts` | 접수 안내 문장·연락처 저장 확인 문구·이벤트 안내 문장(10개 언어) | 4, 6, 8 |
| `src/lib/chat/autoAck.ts` | 자동 안내: 접수 안내 / 짧은 안내 고르기 | 4 |
| `src/lib/chat/slackText.ts` | Slack 문구(순수) | 5 |
| `src/lib/chat/slackRelay.ts` | Slack ↔ DB: 연락처 알림·클릭 알림·이벤트 안내 알림·번역본 게시 | 5 |
| `src/lib/chat/contactService.ts` ★ | 연락처 저장·클릭 기록·글 속 이메일 저장 | 6 |
| `src/lib/chat/rateLimit.ts` | 클릭 알림 한도 | 6 |
| `src/app/api/chat/contact/route.ts` | 연락처 API(`save`/`click`) | 5(한 줄), 6 |
| `src/lib/chat/priceIntent.ts` ★ | 가격·프로모션 낱말 판정(순수, 서버 전용) | 7 |
| `src/lib/chat/eventHint.ts` ★ | 이벤트 안내 발송 | 8 |
| `src/lib/chat/visitorMessageFollowups.ts` ★ | 손님 글에 뒤따르는 일의 순서 | 9 |
| `src/app/api/chat/messages/route.ts` | 손님 글 처리 순서 변경, `source` 응답 | 9 |
| `src/app/api/chat/sessions/route.ts` | 손님용 세션 조회에 `hasContact` | 9 |
| `src/lib/chat/escalationRunner.ts` | 연락처를 남긴 손님을 재촉 알림 후보에서 제외 | 10 |
| `src/lib/chat/followupDigest.ts` ★ | "오늘 연락할 손님" 정의·요약 창·하루 두 번 요약 | 11 |
| `src/app/api/chat/ops/route.ts` | 3분 크론에 요약 연결 | 11 |
| `src/lib/chat/linkify.ts` ★ | 글에서 주소 가르기(순수) | 12 |
| `src/components/chat/MessageBubble.tsx` | 직원·자동 안내 말풍선의 링크 | 12 |
| `src/components/ui/ChannelIcon.tsx` ★ | 채널 아이콘 네 개 | 13 |
| `src/components/layout/FloatingCTA.tsx` | 아이콘을 `ChannelIcon`에서 가져다 씀(모양 불변) | 13 |
| `scripts/_i18n-work/add-chat-contact-first-keys.mjs` ★ | 카드 문구 10개 × 11개 언어 바이트 보존 삽입 | 14 |
| `src/messages/*.json` (11개) | `chat` 신규 키 10개 | 14 |
| `src/lib/chat/messageList.ts` ★ | 손님 화면 메시지 목록(순수) | 15 |
| `src/lib/chat/chatApi.ts` | 손님 화면 fetch 래퍼 | 15 |
| `src/hooks/useChatRealtime.ts` | 같은 글이 두 길로 도착할 때 완성본으로 교체 | 15 |
| `src/lib/copyText.ts` ★ | 클립보드 복사 | 15 |
| `src/components/chat/ChatCaptureBlock.tsx` | 연락처 카드 | 15 |
| `src/components/chat/ChatPanel.tsx` | 카드 노출 판단·연락처 유무·입력창 | 15 |
| `src/app/admin/(authenticated)/chat/page.tsx` | `오늘 연락` 배지 | 16 |
| `scripts/chat-response-baseline.mjs` | 측정 항목 9(G-6) | 17 |
| (루트) `.env.example` | 환경변수 세 개 | 1 |
| (루트) `chat-contact-card-check.mjs` ★ | 손님 화면 확인 스크립트(가짜 API) | 18 |

테스트(모두 `src/` 아래): `lib/chat/__tests__/{chatFlags,businessHours,contactChannels,autoAck,slackText,slackRelay,contactService,priceIntent,eventHint,visitorMessageFollowups,escalationRunner,followupDigest,linkify,messageList}.test.ts`, `lib/chat/__tests__/fakeAdmin.ts`(테스트 도구), `components/chat/__tests__/{MessageBubble,ChatCaptureBlock}.test.tsx`, `components/ui/__tests__/ChannelIcon.test.tsx`.

## 스펙에서 보완한 점

스펙의 결정을 바꾸지 않는 범위에서, 구현하며 드러난 빈틈을 이렇게 메웠다. 과제에 그대로 반영돼 있다.

| # | 스펙 | 이 계획 | 이유 |
|---|------|---------|------|
| 1 | §4.4 한도: 저장·클릭·이메일 인식을 합쳐 하루 5회 | 저장(+이메일 인식) 5회, **클릭 알림은 따로 5회** | 합치면 병원 연락 단추를 몇 번 누른 손님이 정작 연락처 저장에서 막힌다. Slack에 올라가는 📲 줄은 여전히 하루 5줄로 제한된다. 한도를 넘은 클릭은 조용히 버린다 |
| 2 | §4.5 (b) 연락처 알림 문구는 한 가지 | 방 / 스레드 / 단독 게시, 그리고 `CHAT_FOLLOWUP=off`일 때 줄을 달리 붙인다. 방 모드·기능 켜짐일 때는 스펙 문구 그대로다 | 번역본은 방에만 올라오고(§4.5 d), 긴급 정지 중에는 알림이 계속 울린다. 사실과 다른 안내를 직원에게 보내지 않기 위해서다 |
| 3 | §4.5 (b) 시작 화면 이메일 꼬리말 | 그 글에서 방금 이메일을 인식해 📱 알림이 바로 뒤따르는 경우에는 꼬리말을 생략한다 | 같은 내용이 두 번 올라오지 않게 |
| 4 | §4.5 (b) 피드 줄 `📋 연락처 남김` | 방 모드에서만 올린다. 답변 직원이 없으면 올리지 않는다 | 스레드 모드는 같은 채널(#해외문의)이라 중복이다. 기존 안전 스위치(답변 직원 없음 = 새 Slack 트래픽 없음)를 따른다 |
| 5 | §4.10 `splitLinks`: `http(s)://`로 시작하는 주소 | 주소에 쓸 수 있는 ASCII 글자까지만 링크로 본다 | 일본어·중국어 글이 띄어쓰기 없이 주소 뒤에 붙어도 링크가 거기서 끝난다 |
| 6 | §4.9 "입력창을 바로 비운다" | 화면에 보이는 값만 비운다(상태를 지우지 않는다). 그리고 전송 응답으로 온 글이 먼저 불러온 글(번역 전)을 대체한다 | 응답을 기다리는 사이 손님이 새 글을 쓰기 시작해도 지워지지 않게. 대체하지 않으면 손님 자신의 글에 "원문 보기"가 생기지 않는다 |
| 7 | §4.2 QR 크게 보기 | 크게 보기가 떠 있을 때 Esc는 그것만 닫고 채팅창은 닫지 않는다. WeChat·이메일 블록을 펼치면 보이는 곳까지 스크롤한다 | 지금은 Esc 한 번에 채팅창까지 닫힌다 |
| 8 | §4.6 `getNextOpenAt` | 탐색 범위 7일 → 14일 | 연휴(휴진일 여러 날 + 일요일)를 건너뛸 수 있게 |
| 9 | §8 테스트 표 | `chatFlags`·`messageList`·`MessageBubble`·`ChatCaptureBlock`·`sendAutoAckIfDue` 테스트를 더했다. `priceIntent`의 문의 문장은 스펙에 적힌 7개(일부는 앞뒤를 채움) + 스모크 문장 2개다 | 스펙 표에 없는 화면·배선 코드에도 시험 주기를 두기 위해 |
| 10 | §4.10 측정 항목 9 | 시험 세션은 이름(test·테스트·smoke)으로만 뺀다 | 대화 중간의 가격 질문도 세므로 "첫 글" 기준을 쓸 수 없다 |
| 11 | §4.4 `click` | 손님 화면은 같은 채널을 카드에서 한 번만 서버에 알린다 | 복사 버튼을 여러 번 눌러도 방에 한 줄만 |

## 작업 순서 한눈에 보기

| 묶음 | 과제 | 무엇을 만드는가 | 운영에 닿는가 |
|------|------|-----------------|---------------|
| 바탕 | 0~3 | 계획서 대조 도구(임시), DB 칸 3개(파일만)·정지 스위치, 휴진일과 시간대, 연락처 채널 규칙 | 아니오 |
| 서버 | 4~11 | 접수 안내, Slack 알림·번역본, 연락처 저장, 가격 문의 판정과 이벤트 안내, 손님 글 처리 순서, 재촉 알림 제외, 하루 두 번 요약 | 아니오 |
| 손님 화면 | 12~15 | 말풍선 링크, 채널 아이콘, 카드 문구(11개 언어), 연락처 카드와 채팅창 | 아니오 |
| 마무리 | 16~18 | 관리자 목록 배지, 측정 항목, 전체 검증(테스트·빌드·화면 확인) | 아니오 (화면 확인은 가짜 응답으로) |
| 운영 반영 | 19 | 042 적용 → 배포 → 스모크 → 직원 안내 → 측정 | **예 — 승인 ①②③** |

과제는 번호 순서대로 한다(뒤 과제가 앞 과제의 함수를 쓴다). 과제 하나가 끝날 때마다 전체 테스트와 타입 검사가 통과하는 상태로 커밋한다.

---

### Task 0: 준비 — 기준선 확인과 계획서 대조 도구

**Files:**
- Create: `plan-fidelity-check.mjs` (워크트리 루트. **임시 도구 — 커밋하지 않는다.** Task 18 끝에 지운다)

**Interfaces:**
- Consumes: 이 계획서 파일(코드 블록 앞의 `<!-- plan-check: … -->` 표시)
- Produces: `node ../plan-fidelity-check.mjs --root .. [--through N]` → 마지막 줄 `N/N 일치`, 종료 코드 0(전부 일치) 또는 1

- [ ] **Step 1: 시작 상태 확인**

Run: `git status --short && git log --oneline -1`
Expected: 작업 폴더가 깨끗하고(추적되지 않은 파일이 있다면 이 계획과 무관한 것인지 확인), 맨 위 커밋이 이 계획서를 더한 커밋이다(`docs(chat): 연락처 먼저 — 구현 계획서 …`).

Run: `git fetch origin && git log --oneline -1 origin/master`
Expected: `a485c64 …` (계획을 쓸 때의 운영 master). 다른 커밋이면 그 사이 운영에 무엇인가 나간 것이다 — 멈추고 원장님께 알린 뒤, 이 브랜치에 `origin/master`를 병합하고 시작한다.

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run && npx tsc --noEmit`
Expected: `Test Files  46 passed (46)` · `Tests  634 passed (634)`, tsc 출력 없음. 다르면 시작하지 않고 원인을 찾는다.

- [ ] **Step 2: 대조 도구 작성**

워크트리 루트에 `plan-fidelity-check.mjs` 를 새로 만든다(`D:\dev\LIV_homepage-slack-rooms\plan-fidelity-check.mjs`):

<!-- plan-check: full plan-fidelity-check.mjs -->
```js
// 계획서 대조 — 계획서에 실린 코드와 워크트리의 파일이 글자 하나까지 같은지 확인한다.
//
// 계획서(docs/superpowers/plans/2026-10-01-chat-contact-first.md)의 코드는 미리 실행해 검증한 것이다.
// 옮기는 과정에서 글자가 달라지면(특히 테스트가 잡지 못하는 손님 문구) 검증의 뜻이 없어지므로,
// 과제를 커밋하기 전에 이 스크립트로 대조한다. 이 파일은 임시 도구다 — 커밋하지 않고, Task 18 끝에 지운다.
//
// 계획서의 코드 블록 가운데 앞줄에 `<!-- plan-check: <방식> <경로> -->` 표시가 있는 것만 본다.
//   full     : 파일 전체가 그 블록과 같다
//   contains : 파일 안에 그 블록이 그대로 들어 있다
//   added    : diff 블록의 추가(+) 줄 묶음이 파일 안에 그대로 들어 있다
// 줄바꿈 종류(CRLF/LF), 줄 끝 공백, 파일 앞뒤의 빈 줄은 무시한다.
//
// 사용 (워크트리 루트에서):
//   node plan-fidelity-check.mjs               # 계획서 전체
//   node plan-fidelity-check.mjs --through 6   # Task 6 까지만
// 종료코드: 0 전부 일치 / 1 다른 곳 있음

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const root = path.resolve(argOf('--root', '.'));
const planFile = path.resolve(root, argOf('--plan', 'docs/superpowers/plans/2026-10-01-chat-contact-first.md'));
const through = Number(argOf('--through', '999'));

const norm = (s) =>
  s
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join('\n');
const trimBlank = (s) => s.replace(/^\n+/, '').replace(/\n+$/, '');

const lines = norm(fs.readFileSync(planFile, 'utf8')).split('\n');
const checks = [];
let task = -1;
for (let i = 0; i < lines.length; i++) {
  const heading = /^### Task (\d+):/.exec(lines[i]);
  if (heading) task = Number(heading[1]);
  const mark = /^<!-- plan-check: (full|contains|added) (.+) -->$/.exec(lines[i]);
  if (!mark) continue;
  const open = lines.findIndex((l, k) => k > i && /^`{3,}/.test(l));
  const ticks = /^(`{3,})/.exec(lines[open])[1];
  const close = lines.findIndex((l, k) => k > open && l === ticks);
  checks.push({ task, mode: mark[1], file: mark[2], line: i + 1, body: lines.slice(open + 1, close).join('\n') });
  i = close;
}

/** diff 블록에서 연달아 있는 추가(+) 줄 묶음을 꺼낸다. */
function addedRuns(diff) {
  const runs = [];
  let run = [];
  for (const l of diff.split('\n')) {
    if (l.startsWith('+') && !l.startsWith('+++')) {
      run.push(l.slice(1));
    } else if (run.length) {
      runs.push(run.join('\n'));
      run = [];
    }
  }
  if (run.length) runs.push(run.join('\n'));
  return runs.map(trimBlank).filter((r) => r.trim() !== '');
}

let checked = 0;
let failed = 0;
for (const c of checks) {
  if (c.task > through) continue;
  checked += 1;
  const label = `Task ${c.task} · ${c.mode} · ${c.file} (계획서 ${c.line}행)`;
  const target = path.resolve(root, c.file);
  if (!fs.existsSync(target)) {
    failed += 1;
    console.log(`없음  ${label}`);
    continue;
  }
  const file = norm(fs.readFileSync(target, 'utf8'));
  let problem = null;
  if (c.mode === 'full') {
    const a = trimBlank(file).split('\n');
    const b = trimBlank(c.body).split('\n');
    const at = a.findIndex((l, k) => l !== b[k]);
    if (at >= 0 || a.length !== b.length) {
      const k = at >= 0 ? at : Math.min(a.length, b.length);
      problem = `${k + 1}번째 줄부터 다르다\n      파일  : ${a[k] ?? '(끝)'}\n      계획서: ${b[k] ?? '(끝)'}`;
    }
  } else if (c.mode === 'contains') {
    if (!file.includes(trimBlank(c.body))) {
      const first = trimBlank(c.body).split('\n').find((l) => l.trim() !== '' && !file.includes(l));
      problem = `블록이 그대로 들어 있지 않다${first ? `\n      파일에 없는 첫 줄: ${first}` : ' (줄은 다 있지만 순서·빈 줄이 다르다)'}`;
    }
  } else {
    const missing = addedRuns(c.body).find((r) => !file.includes(r));
    if (missing) {
      const first = missing.split('\n').find((l) => l.trim() !== '' && !file.includes(l));
      problem = `추가 줄이 그대로 들어 있지 않다\n      ${first ? `파일에 없는 첫 줄: ${first}` : `줄은 다 있지만 순서·빈 줄이 다르다: ${missing.split('\n')[0]}`}`;
    }
  }
  if (problem) {
    failed += 1;
    console.log(`다름  ${label}\n      ${problem}`);
  }
}

console.log(`${checked - failed}/${checked} 일치${through < 999 ? ` (Task ${through} 까지)` : ''}`);
process.exit(failed ? 1 : 0);
```

- [ ] **Step 3: 동작 확인**

Run: `node ../plan-fidelity-check.mjs --root .. --through 0`
Expected: `1/1 일치 (Task 0 까지)` — 이 도구 자신이 계획서와 같다는 뜻이다. 커밋하지 않는다.

---

### Task 1: DB 컬럼·타입·긴급 정지 스위치

**Files:**
- Create: `liv-clinic/supabase/migrations/042_chat_contact_first.sql`
- Modify: `liv-clinic/src/types/supabase.ts` (`chat_sessions`의 `Row`·`Insert`·`Update`)
- Modify: `.env.example` (루트, `CHAT_ESCALATION_MINUTES=5,12,30` 줄 뒤)
- Create: `liv-clinic/src/lib/chat/chatFlags.ts`
- Test: `liv-clinic/src/lib/chat/__tests__/chatFlags.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  ```ts
  // src/lib/chat/chatFlags.ts
  export function isFollowupEnabled(): boolean;   // CHAT_FOLLOWUP=off 면 false
  export function isEventHintEnabled(): boolean;  // CHAT_EVENT_HINT=off 면 false
  ```
  타입: `chat_sessions.followup_digest_at: string | null`, `visitor_messenger_clicked: string | null`, `event_hint_at: string | null`.

**이 과제는 마이그레이션 파일만 만든다. 운영 DB에는 적용하지 않는다(Task 19, 승인 뒤).**

- [ ] **Step 1: 실패하는 테스트 작성**

`liv-clinic/src/lib/chat/__tests__/chatFlags.test.ts` 를 새로 만든다:

<!-- plan-check: full liv-clinic/src/lib/chat/__tests__/chatFlags.test.ts -->
```ts
import { describe, it, expect, afterEach } from 'vitest';
import { isEventHintEnabled, isFollowupEnabled } from '../chatFlags';

describe('긴급 정지 스위치', () => {
  afterEach(() => {
    delete process.env.CHAT_FOLLOWUP;
    delete process.env.CHAT_EVENT_HINT;
  });

  it('환경변수가 없으면 둘 다 켜져 있다', () => {
    expect(isFollowupEnabled()).toBe(true);
    expect(isEventHintEnabled()).toBe(true);
  });

  it("'off'일 때만 꺼진다 (대소문자·앞뒤 공백 무시)", () => {
    process.env.CHAT_FOLLOWUP = ' OFF ';
    process.env.CHAT_EVENT_HINT = 'off';
    expect(isFollowupEnabled()).toBe(false);
    expect(isEventHintEnabled()).toBe(false);
  });

  it('다른 값은 켜진 것으로 본다', () => {
    process.env.CHAT_FOLLOWUP = 'on';
    process.env.CHAT_EVENT_HINT = '0';
    expect(isFollowupEnabled()).toBe(true);
    expect(isEventHintEnabled()).toBe(true);
  });

  it('두 스위치는 서로 독립이다', () => {
    process.env.CHAT_FOLLOWUP = 'off';
    expect(isFollowupEnabled()).toBe(false);
    expect(isEventHintEnabled()).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/chatFlags.test.ts`
Expected: FAIL — `Failed to resolve import "../chatFlags"` (모듈이 아직 없다)

- [ ] **Step 3: 구현**

`liv-clinic/src/lib/chat/chatFlags.ts` 를 새로 만든다:

<!-- plan-check: full liv-clinic/src/lib/chat/chatFlags.ts -->
```ts
import 'server-only';

// 긴급 정지 스위치 (스펙 2026-10-01 §4.5·§4.10). 값이 'off'일 때만 꺼진다 — 비어 있으면 켜진 것이다.
// 환경변수는 호출 시점에 읽는다(테스트에서 바꿔 넣을 수 있게).

function isOff(name: string): boolean {
  return (process.env[name] ?? '').trim().toLowerCase() === 'off';
}

/**
 * "오늘 연락할 손님" 묶음 — 연락처를 남긴 손님의 5·12·30분 알림 제외, 하루 두 번 요약, 직원 답글 번역본 게시.
 * CHAT_FOLLOWUP=off 면 false (연락처가 있어도 예전처럼 알림이 울리고, 요약·번역본은 나가지 않는다).
 */
export function isFollowupEnabled(): boolean {
  return !isOff('CHAT_FOLLOWUP');
}

/** 가격 문의에 이벤트 링크 자동 발송. CHAT_EVENT_HINT=off 면 false. 말풍선의 링크 누르기와는 무관하다. */
export function isEventHintEnabled(): boolean {
  return !isOff('CHAT_EVENT_HINT');
}
```

- [ ] **Step 4: 통과 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/chatFlags.test.ts`
Expected: PASS — 4건

- [ ] **Step 5: 마이그레이션 파일 작성 (적용하지 않는다)**

`liv-clinic/supabase/migrations/042_chat_contact_first.sql` 을 새로 만든다:

<!-- plan-check: full liv-clinic/supabase/migrations/042_chat_contact_first.sql -->
```sql
-- ============================================
-- 042: 라이브채팅 "연락처 먼저" 1단계
-- 설계: docs/superpowers/specs/2026-10-01-chat-contact-first-design.md §5
-- 전부 추가형·멱등. 트리거·인덱스·정책·publication 변경 없음.
-- 코드 배포보다 먼저 적용한다 (적용 전에 코드가 나가면 요약·클릭 기록·번역본 게시·이벤트 안내가 경고만 남기고 실패한다).
-- ============================================
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS followup_digest_at        TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS visitor_messenger_clicked TEXT NULL
    CHECK (visitor_messenger_clicked IS NULL OR char_length(visitor_messenger_clicked) <= 20),
  ADD COLUMN IF NOT EXISTS event_hint_at             TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.chat_sessions.followup_digest_at IS
  '"오늘 연락할 손님" 요약에 마지막으로 오른 시각. 요약 창 시작보다 이전이면 다시 오른다';
COMMENT ON COLUMN public.chat_sessions.visitor_messenger_clicked IS
  '손님이 카드에서 마지막으로 누른 단추(whatsapp/wechat/line/email). 연락처가 아니다 — 측정과 번역본 게시 대상 판정에 쓴다';
COMMENT ON COLUMN public.chat_sessions.event_hint_at IS
  '가격 문의에 이벤트 안내(프로모션 링크)를 마지막으로 보낸 시각. 12시간이 지나야 다시 보낸다';
```

- [ ] **Step 6: 타입 정의에 새 컬럼 추가**

`liv-clinic/src/types/supabase.ts` 의 `chat_sessions` 블록 세 곳(`Row`·`Insert`·`Update`)에 알파벳 순서 자리에 넣는다. 이 파일은 손으로 관리한다(자동 생성 명령을 돌리지 않는다).

<!-- plan-check: added liv-clinic/src/types/supabase.ts -->
```diff
--- a/src/types/supabase.ts
+++ b/src/types/supabase.ts
@@ -228,6 +228,8 @@ export type Database = {
           closed_at: string | null
           created_at: string
           escalation_level: number
+          event_hint_at: string | null
+          followup_digest_at: string | null
           id: string
           ip_hash: string | null
           last_message_at: string | null
@@ -245,6 +247,7 @@ export type Database = {
           visitor_email: string | null
           visitor_locale: string
           visitor_messenger_channel: string | null
+          visitor_messenger_clicked: string | null
           visitor_messenger_handle: string | null
           visitor_name: string | null
         }
@@ -258,6 +261,8 @@ export type Database = {
           closed_at?: string | null
           created_at?: string
           escalation_level?: number
+          event_hint_at?: string | null
+          followup_digest_at?: string | null
           id?: string
           ip_hash?: string | null
           last_message_at?: string | null
@@ -275,6 +280,7 @@ export type Database = {
           visitor_email?: string | null
           visitor_locale: string
           visitor_messenger_channel?: string | null
+          visitor_messenger_clicked?: string | null
           visitor_messenger_handle?: string | null
           visitor_name?: string | null
         }
@@ -288,6 +294,8 @@ export type Database = {
           closed_at?: string | null
           created_at?: string
           escalation_level?: number
+          event_hint_at?: string | null
+          followup_digest_at?: string | null
           id?: string
           ip_hash?: string | null
           last_message_at?: string | null
@@ -305,6 +313,7 @@ export type Database = {
           visitor_email?: string | null
           visitor_locale?: string
           visitor_messenger_channel?: string | null
+          visitor_messenger_clicked?: string | null
           visitor_messenger_handle?: string | null
           visitor_name?: string | null
         }
```

- [ ] **Step 7: 환경변수 예시 추가**

루트 `.env.example` 의 `CHAT_ESCALATION_MINUTES=5,12,30` 줄 바로 뒤에 넣는다:

<!-- plan-check: added .env.example -->
```diff
 # 확대 알림 임계(분): 담당자 재멘션, 전원, 전원+피드 🚨
 CHAT_ESCALATION_MINUTES=5,12,30
+# 휴진일(한국 날짜, 쉼표 구분). 그날은 하루 종일 상담 시간 외로 본다 — 예: 2026-10-03,2026-10-09. 비우면 휴진일 없음.
+# 함수 환경변수는 배포 시점에 고정되므로 값을 바꾼 뒤에는 다시 배포해야 한다
+CHAT_CLOSED_DATES=
+# 긴급 정지: off 로 두면 연락처를 남긴 손님에게도 5·12·30분 알림이 다시 울리고, '오늘 연락할 손님' 요약과 번역본 게시를 멈춘다. 평소에는 비워 둔다
+CHAT_FOLLOWUP=
+# 긴급 정지: off 로 두면 가격 문의에 이벤트 링크를 자동으로 보내지 않는다. 평소에는 비워 둔다
+CHAT_EVENT_HINT=
 # Event Subscriptions > Request URL: https://<도메인>/api/slack/events
```

- [ ] **Step 8: 타입 검사**

Run: `npx tsc --noEmit`
Expected: 출력 없음(종료 코드 0)

- [ ] **Step 9: 커밋**

```bash
git add supabase/migrations/042_chat_contact_first.sql src/types/supabase.ts src/lib/chat/chatFlags.ts src/lib/chat/__tests__/chatFlags.test.ts ../.env.example
git commit -m "feat(chat): 연락처 먼저 — 042 컬럼 3개(파일만)·타입·긴급 정지 스위치" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: 휴진일과 시간대 구분

**Files:**
- Modify: `liv-clinic/src/lib/chat/businessHours.ts` (파일 전체 교체)
- Test: `liv-clinic/src/lib/chat/__tests__/businessHours.test.ts` (파일 전체 교체 — 기존 6건 유지 + 11건 추가)

**Interfaces:**
- Consumes: 환경변수 `CHAT_BUSINESS_HOURS_JSON`(기존), `CHAT_CLOSED_DATES`(신설)
- Produces:
  ```ts
  export interface BusinessHoursConfig { weekday: DayRange; saturday: DayRange; sunday: DayRange } // 이제 export
  export function dayRangeMinutes(cfg: BusinessHoursConfig, weekday: number): { startMin: number; endMin: number } | null; // 순수, 휴진일 무관
  export function isBusinessHours(now?: Date): boolean;   // 휴진일이면 항상 false
  export type BusinessSlot = 'open' | 'closing' | 'closed';
  export const CLOSING_SOON_MIN = 60;
  export function businessSlot(now?: Date): BusinessSlot;  // closing = 영업 중이고 마감까지 60분 이하
  export function getNextOpenAt(now?: Date): Date | null;  // 휴진일을 건너뛴다
  export function getBusinessHoursConfig(): BusinessHoursConfig;
  export function _resetBusinessHoursForTesting(): void;   // 휴진일 캐시도 지운다
  ```
  호출부(`api/chat/presence`, `api/chat/sessions`, `api/chat/ops`)는 바꾸지 않는다 — `isBusinessHours`·`getNextOpenAt`이 휴진일을 반영하므로 헤더 문구·시스템 안내·크론이 그대로 따라온다.

- [ ] **Step 1: 실패하는 테스트 작성**

`liv-clinic/src/lib/chat/__tests__/businessHours.test.ts` 를 아래 내용으로 교체한다:

<!-- plan-check: full liv-clinic/src/lib/chat/__tests__/businessHours.test.ts -->
```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  businessSlot,
  dayRangeMinutes,
  getBusinessHoursConfig,
  getNextOpenAt,
  isBusinessHours,
  _resetBusinessHoursForTesting,
} from '../businessHours';

function resetEnv() {
  delete process.env.CHAT_BUSINESS_HOURS_JSON;
  delete process.env.CHAT_CLOSED_DATES;
  _resetBusinessHoursForTesting();
}

// 기본 운영시간: 평일 10:00–19:00, 토 10:00–16:00, 일 휴무 (KST)
describe('getNextOpenAt', () => {
  beforeEach(resetEnv);
  afterEach(resetEnv);

  it('일요일 낮 → 월요일 10:00 KST', () => {
    // 2026-08-09(일) 14:00 KST = 05:00 UTC
    const now = new Date('2026-08-09T05:00:00Z');
    expect(getNextOpenAt(now)?.toISOString()).toBe('2026-08-10T01:00:00.000Z');
  });

  it('토요일 마감(16시) 이후 → 월요일 10:00 KST', () => {
    // 2026-08-08(토) 17:00 KST = 08:00 UTC
    const now = new Date('2026-08-08T08:00:00Z');
    expect(getNextOpenAt(now)?.toISOString()).toBe('2026-08-10T01:00:00.000Z');
  });

  it('금요일 밤 → 토요일 10:00 KST', () => {
    // 2026-08-07(금) 20:00 KST = 11:00 UTC
    const now = new Date('2026-08-07T11:00:00Z');
    expect(getNextOpenAt(now)?.toISOString()).toBe('2026-08-08T01:00:00.000Z');
  });

  it('평일 오픈 전 → 같은 날 10:00 KST', () => {
    // 2026-08-10(월) 08:00 KST = 2026-08-09T23:00:00Z
    const now = new Date('2026-08-09T23:00:00Z');
    expect(getNextOpenAt(now)?.toISOString()).toBe('2026-08-10T01:00:00.000Z');
  });

  it('영업 중 → null', () => {
    // 2026-08-10(월) 12:00 KST = 03:00 UTC
    expect(getNextOpenAt(new Date('2026-08-10T03:00:00Z'))).toBeNull();
  });

  it('전일 휴무 설정이면 null (무한 루프 방지)', () => {
    process.env.CHAT_BUSINESS_HOURS_JSON = JSON.stringify({
      weekday: null,
      saturday: null,
      sunday: null,
    });
    _resetBusinessHoursForTesting();
    expect(getNextOpenAt(new Date('2026-08-09T05:00:00Z'))).toBeNull();
  });
});

describe('휴진일 (CHAT_CLOSED_DATES)', () => {
  beforeEach(resetEnv);
  afterEach(() => {
    resetEnv();
    vi.restoreAllMocks();
  });

  it('휴진일에는 낮에도 영업시간이 아니다 — 다음 날은 정상', () => {
    process.env.CHAT_CLOSED_DATES = '2026-10-09';
    _resetBusinessHoursForTesting();
    // 2026-10-09(금) 12:00 KST = 03:00 UTC
    expect(isBusinessHours(new Date('2026-10-09T03:00:00Z'))).toBe(false);
    // 2026-10-10(토) 12:00 KST
    expect(isBusinessHours(new Date('2026-10-10T03:00:00Z'))).toBe(true);
  });

  it('휴진일 낮의 다음 오픈 시각은 다음 영업일 10:00 KST', () => {
    process.env.CHAT_CLOSED_DATES = '2026-10-09';
    _resetBusinessHoursForTesting();
    expect(getNextOpenAt(new Date('2026-10-09T03:00:00Z'))?.toISOString()).toBe('2026-10-10T01:00:00.000Z');
  });

  it('휴진일이 이어지면 모두 건너뛴다 (금·토 휴진 + 일요일 → 월요일)', () => {
    process.env.CHAT_CLOSED_DATES = '2026-10-09,2026-10-10';
    _resetBusinessHoursForTesting();
    // 2026-10-08(목) 20:00 KST = 11:00 UTC
    expect(getNextOpenAt(new Date('2026-10-08T11:00:00Z'))?.toISOString()).toBe('2026-10-12T01:00:00.000Z');
  });

  it('형식이 틀린 항목은 무시하고 경고를 한 번 남긴다', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.CHAT_CLOSED_DATES = ' 2026-10-09 , 10/03, 2026-13-40, 2026-02-30,';
    _resetBusinessHoursForTesting();
    expect(isBusinessHours(new Date('2026-10-09T03:00:00Z'))).toBe(false);
    // 2026-10-03(토) 12:00 KST — '10/03'은 형식이 틀려 휴진일로 치지 않는다
    expect(isBusinessHours(new Date('2026-10-03T03:00:00Z'))).toBe(true);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][1])).toBe('10/03, 2026-13-40, 2026-02-30');
  });

  it('비어 있으면 휴진일이 없다', () => {
    process.env.CHAT_CLOSED_DATES = '';
    _resetBusinessHoursForTesting();
    expect(isBusinessHours(new Date('2026-10-09T03:00:00Z'))).toBe(true);
  });
});

describe('businessSlot — 접수 안내 문장을 가르는 시간대', () => {
  beforeEach(resetEnv);
  afterEach(resetEnv);

  it('평일: 마감 61분 전 open, 60분 전부터 closing, 마감 뒤 closed', () => {
    // 2026-10-05(월). 17:59 KST = 08:59 UTC
    expect(businessSlot(new Date('2026-10-05T08:59:00Z'))).toBe('open');
    expect(businessSlot(new Date('2026-10-05T09:00:00Z'))).toBe('closing'); // 18:00
    expect(businessSlot(new Date('2026-10-05T09:59:00Z'))).toBe('closing'); // 18:59
    expect(businessSlot(new Date('2026-10-05T10:00:00Z'))).toBe('closed'); // 19:00
  });

  it('문 열기 전 새벽은 closed, 문 연 직후는 open', () => {
    expect(businessSlot(new Date('2026-10-05T00:59:00Z'))).toBe('closed'); // 09:59
    expect(businessSlot(new Date('2026-10-05T01:00:00Z'))).toBe('open'); // 10:00
  });

  it('토요일은 16시 마감 기준', () => {
    // 2026-10-10(토). 14:59 KST = 05:59 UTC
    expect(businessSlot(new Date('2026-10-10T05:59:00Z'))).toBe('open');
    expect(businessSlot(new Date('2026-10-10T06:00:00Z'))).toBe('closing'); // 15:00
    expect(businessSlot(new Date('2026-10-10T07:00:00Z'))).toBe('closed'); // 16:00
  });

  it('일요일과 휴진일은 closed', () => {
    expect(businessSlot(new Date('2026-10-11T03:00:00Z'))).toBe('closed'); // 일요일 12:00
    process.env.CHAT_CLOSED_DATES = '2026-10-05';
    _resetBusinessHoursForTesting();
    expect(businessSlot(new Date('2026-10-05T03:00:00Z'))).toBe('closed'); // 휴진일 12:00
  });
});

describe('dayRangeMinutes', () => {
  beforeEach(resetEnv);
  afterEach(resetEnv);

  it('요일별 영업 구간을 분으로 돌려준다', () => {
    const cfg = getBusinessHoursConfig();
    expect(dayRangeMinutes(cfg, 1)).toEqual({ startMin: 600, endMin: 1140 });
    expect(dayRangeMinutes(cfg, 6)).toEqual({ startMin: 600, endMin: 960 });
    expect(dayRangeMinutes(cfg, 0)).toBeNull();
  });

  it('시각 형식이 틀리면 null', () => {
    expect(dayRangeMinutes({ weekday: ['10시', '19:00'], saturday: null, sunday: null }, 1)).toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/businessHours.test.ts`
Expected: FAIL — 새 테스트가 `businessSlot is not a function`·`dayRangeMinutes is not a function`으로 실패하고, 휴진일 테스트는 `expected true to be false`로 실패한다. 기존 `getNextOpenAt` 6건은 통과한다.

- [ ] **Step 3: 구현**

`liv-clinic/src/lib/chat/businessHours.ts` 를 아래 내용으로 교체한다:

<!-- plan-check: full liv-clinic/src/lib/chat/businessHours.ts -->
```ts
import 'server-only';

// 운영시간 판정 (KST 기준)
// - 평일 10:00–19:00, 토 10:00–16:00, 일 휴무 (사용자 확정, 2026-05-08)
// - 환경변수 CHAT_BUSINESS_HOURS_JSON 으로 override 가능
// - 휴진일: 환경변수 CHAT_CLOSED_DATES="2026-10-03,2026-10-09" (한국 날짜). 그날은 하루 종일 영업시간 외로 본다 (2026-10-01)
// - 채팅 자체는 24/7 가능, 이 모듈은 *응답 가능 안내 여부* 판단용

type DayRange = [string, string] | null; // ["10:00","19:00"] or null

export interface BusinessHoursConfig {
  weekday: DayRange;
  saturday: DayRange;
  sunday: DayRange;
}

const DEFAULT_HOURS: BusinessHoursConfig = {
  weekday: ['10:00', '19:00'],
  saturday: ['10:00', '16:00'],
  sunday: null,
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

let cachedConfig: BusinessHoursConfig | null = null;
let cachedClosedDates: Set<string> | null = null;

function loadConfig(): BusinessHoursConfig {
  if (cachedConfig) return cachedConfig;
  const raw = process.env.CHAT_BUSINESS_HOURS_JSON;
  if (!raw) {
    cachedConfig = DEFAULT_HOURS;
    return cachedConfig;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<BusinessHoursConfig>;
    // 키가 존재하면 명시적 null("휴무")도 그대로 존중한다 — `??`는 null을 기본값으로
    // 되돌려 휴무 설정을 불가능하게 만들므로 사용하지 않는다.
    cachedConfig = {
      weekday: 'weekday' in parsed ? (parsed.weekday ?? null) : DEFAULT_HOURS.weekday,
      saturday: 'saturday' in parsed ? (parsed.saturday ?? null) : DEFAULT_HOURS.saturday,
      sunday: 'sunday' in parsed ? (parsed.sunday ?? null) : DEFAULT_HOURS.sunday,
    };
    return cachedConfig;
  } catch {
    cachedConfig = DEFAULT_HOURS;
    return cachedConfig;
  }
}

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** 'YYYY-MM-DD' 가 실제로 있는 날짜인가 (2026-02-30 같은 값은 Date가 다음 달로 넘겨 버리므로 되돌려 비교한다). */
function isRealDateKey(value: string): boolean {
  if (!DATE_KEY_RE.test(value)) return false;
  const ms = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === value;
}

/** CHAT_CLOSED_DATES → 한국 날짜 집합. 형식이 틀린 항목은 버리고 경고 1줄. */
function loadClosedDates(): Set<string> {
  if (cachedClosedDates) return cachedClosedDates;
  const dates = new Set<string>();
  const ignored: string[] = [];
  for (const part of (process.env.CHAT_CLOSED_DATES ?? '').split(',')) {
    const value = part.trim();
    if (!value) continue;
    if (isRealDateKey(value)) dates.add(value);
    else ignored.push(value);
  }
  if (ignored.length > 0) {
    console.warn('[business hours] CHAT_CLOSED_DATES ignored entries:', ignored.join(', '));
  }
  cachedClosedDates = dates;
  return dates;
}

interface KstParts {
  hour: number;
  minute: number;
  weekday: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  dateKey: string; // 'YYYY-MM-DD' (한국 날짜)
}

function getKstParts(date: Date): KstParts {
  // KST = UTC+9. 서머타임 없음.
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    hour: kst.getUTCHours(),
    minute: kst.getUTCMinutes(),
    weekday: kst.getUTCDay(),
    dateKey: kst.toISOString().slice(0, 10),
  };
}

function rangeForWeekday(cfg: BusinessHoursConfig, weekday: number): DayRange {
  if (weekday === 0) return cfg.sunday;
  if (weekday === 6) return cfg.saturday;
  return cfg.weekday;
}

function parseHHMM(s: string): { h: number; m: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return null;
  return { h: Number(m[1]), m: Number(m[2]) };
}

/** 그 요일의 영업 구간을 자정부터의 분으로 (순수). 휴무·형식 오류면 null. 휴진일은 보지 않는다. */
export function dayRangeMinutes(
  cfg: BusinessHoursConfig,
  weekday: number
): { startMin: number; endMin: number } | null {
  const range = rangeForWeekday(cfg, weekday);
  if (!range) return null;
  const start = parseHHMM(range[0]);
  const end = parseHHMM(range[1]);
  if (!start || !end) return null;
  return { startMin: start.h * 60 + start.m, endMin: end.h * 60 + end.m };
}

export function isBusinessHours(now = new Date()): boolean {
  const { hour, minute, weekday, dateKey } = getKstParts(now);
  if (loadClosedDates().has(dateKey)) return false;
  const range = dayRangeMinutes(loadConfig(), weekday);
  if (!range) return false;
  const cur = hour * 60 + minute;
  return cur >= range.startMin && cur < range.endMin;
}

export type BusinessSlot = 'open' | 'closing' | 'closed';

/** 마감까지 이만큼(분) 이하로 남으면 '마감 임박' — 접수 안내 문장과 하루 두 번 요약의 기준. */
export const CLOSING_SOON_MIN = 60;

/** 접수 안내 문장을 가르는 시간대. closed = 영업시간 외 또는 휴진일. */
export function businessSlot(now = new Date()): BusinessSlot {
  if (!isBusinessHours(now)) return 'closed';
  const { hour, minute, weekday } = getKstParts(now);
  const range = dayRangeMinutes(loadConfig(), weekday);
  if (!range) return 'closed';
  return range.endMin - (hour * 60 + minute) <= CLOSING_SOON_MIN ? 'closing' : 'open';
}

/**
 * 다음 오픈 시각(UTC Date). 영업 중이거나 계산 불가(전일 휴무)면 null.
 * KST 기준으로 오늘부터 최대 14일을 탐색한다 (휴진일은 건너뛴다).
 */
export function getNextOpenAt(now = new Date()): Date | null {
  if (isBusinessHours(now)) return null;
  const cfg = loadConfig();
  const closed = loadClosedDates();
  const nowMs = now.getTime();
  const kstNow = new Date(nowMs + KST_OFFSET_MS);
  for (let offset = 0; offset <= 14; offset++) {
    const kstDay = new Date(
      Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate() + offset)
    );
    if (closed.has(kstDay.toISOString().slice(0, 10))) continue;
    const range = dayRangeMinutes(cfg, kstDay.getUTCDay());
    if (!range) continue;
    const openMs = kstDay.getTime() + range.startMin * 60_000 - KST_OFFSET_MS;
    if (openMs > nowMs) return new Date(openMs);
  }
  return null;
}

export function getBusinessHoursConfig(): BusinessHoursConfig {
  return loadConfig();
}

// 테스트용 캐시 리셋
export function _resetBusinessHoursForTesting() {
  cachedConfig = null;
  cachedClosedDates = null;
}
```

- [ ] **Step 4: 통과 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/businessHours.test.ts`
Expected: PASS — 17건

- [ ] **Step 5: 전체 회귀 + 타입 검사**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run && npx tsc --noEmit`
Expected: 47파일 649건 통과, tsc 출력 없음

- [ ] **Step 6: 커밋**

```bash
git add src/lib/chat/businessHours.ts src/lib/chat/__tests__/businessHours.test.ts
git commit -m "feat(chat): 휴진일(CHAT_CLOSED_DATES)과 시간대 구분(open·closing·closed)" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: 연락처 채널 규칙 (순수 로직)

**Files:**
- Modify: `liv-clinic/src/lib/constants.ts` (`WECHAT_QR_IMAGE` 줄 뒤)
- Modify: `liv-clinic/src/lib/chat/contactChannels.ts` (파일 전체 교체)
- Test: `liv-clinic/src/lib/chat/__tests__/contactChannels.test.ts` (파일 전체 교체)

**Interfaces:**
- Consumes: `primaryMessengerFor(locale)` from `@/lib/messengerLinks` (기존, 바꾸지 않는다)
- Produces:
  ```ts
  // src/lib/constants.ts
  export const CHAT_CONTACT_EMAIL = 'jaeho19@gmail.com'; // 채팅 카드 전용. SITE_INFO.email 은 그대로

  // src/lib/chat/contactChannels.ts (손님 화면·서버 공용 — 브라우저 API·lookbehind 없음)
  export const CLINIC_LINK_CHANNELS = ['whatsapp', 'wechat', 'line', 'email'] as const;
  export const CONTACT_FORM_CHANNELS = ['whatsapp', 'wechat', 'email'] as const;
  export const CONTACT_CHANNELS = ['whatsapp', 'wechat', 'line'] as const; // @deprecated — Task 15에서 지운다(옛 카드가 아직 쓴다)
  export type ContactChannel = 'whatsapp' | 'wechat' | 'line' | 'email';
  export type ContactFormChannel = 'whatsapp' | 'wechat' | 'email';
  export const CONTACT_CHANNEL_LABELS: Record<ContactChannel, string>; // email → 'Email'
  export function isValidEmail(value: string): boolean;
  export function validateContactHandle(channel: ContactChannel, handle: string): boolean;
  export function buildChatRefCode(sessionId: string): string; // 기존 그대로
  export function defaultFormChannel(locale: string): ContactFormChannel; // zh→wechat, ja→email, 그 외 whatsapp
  export function orderedLinkChannels(locale: string): ContactChannel[];  // 1순위 메신저 맨 앞, email 맨 뒤
  export function extractEmail(text: string): string | null;
  export const CAPTURE_DISMISS_TTL_MS: number;   // 12시간
  export const STAFF_ACTIVE_WINDOW_MS: number;   // 10분
  export interface CaptureMessage { sender: string; source?: string | null; created_at: string }
  export interface CaptureBlockConditions { presenceLoaded: boolean; sessionInfoLoaded: boolean; hasContact: boolean; dismissedAtMs: number | null; messages: CaptureMessage[]; nowMs: number }
  export function isStaffMessage(m: CaptureMessage): boolean;
  export function shouldShowCaptureBlock(c: CaptureBlockConditions): boolean;
  export function parseCaptureDismissedAt(raw: string | null | undefined): number | null;
  ```

- [ ] **Step 1: 병원 이메일 상수 추가**

`liv-clinic/src/lib/constants.ts`:

<!-- plan-check: added liv-clinic/src/lib/constants.ts -->
```diff
--- a/src/lib/constants.ts
+++ b/src/lib/constants.ts
@@ -49,6 +49,10 @@ export const WHATSAPP_NUMBER = '821068882773';
 export const WECHAT_ID = 'livps0414';
 export const WECHAT_QR_IMAGE = '/images/wechat-qr-code.png';
 
+// 채팅 연락처 카드의 "이메일" 단추가 보여 주는 병원 주소 (원장님 지정, 2026-10-01).
+// 채팅 카드 전용이다 — 푸터·문의 페이지·검색엔진용 정보는 SITE_INFO.email(info@livps.co.kr)을 그대로 쓴다.
+export const CHAT_CONTACT_EMAIL = 'jaeho19@gmail.com';
+
 // Google Business(구글 지도) 후기 페이지 URL — 홈 ReviewsSection의 외부 신뢰 링크.
 // cid 단축형: 로케일·세션 파라미터 없이 항상 리브성형외과 신사(LIV Clinic Sinsa)
 // 지도 상세(후기 포함)로 연결된다. 빈 문자열이면 링크는 렌더링되지 않는다.
```

- [ ] **Step 2: 실패하는 테스트 작성**

`liv-clinic/src/lib/chat/__tests__/contactChannels.test.ts` 를 아래 내용으로 교체한다:

<!-- plan-check: full liv-clinic/src/lib/chat/__tests__/contactChannels.test.ts -->
```ts
import { describe, it, expect } from 'vitest';
import { CHAT_CONTACT_EMAIL } from '@/lib/constants';
import {
  CAPTURE_DISMISS_TTL_MS,
  CLINIC_LINK_CHANNELS,
  CONTACT_CHANNEL_LABELS,
  CONTACT_FORM_CHANNELS,
  STAFF_ACTIVE_WINDOW_MS,
  buildChatRefCode,
  defaultFormChannel,
  extractEmail,
  isStaffMessage,
  orderedLinkChannels,
  parseCaptureDismissedAt,
  shouldShowCaptureBlock,
  validateContactHandle,
  type CaptureBlockConditions,
} from '../contactChannels';

describe('채널 목록', () => {
  it('바로 연락하기 단추는 네 개 — whatsapp/wechat/line/email', () => {
    expect(CLINIC_LINK_CHANNELS).toEqual(['whatsapp', 'wechat', 'line', 'email']);
  });

  it('연락처 남기기에는 line이 없고 email이 있다', () => {
    expect(CONTACT_FORM_CHANNELS).toEqual(['whatsapp', 'wechat', 'email']);
  });

  it('채널 이름은 번역하지 않는다', () => {
    expect(CONTACT_CHANNEL_LABELS).toEqual({ whatsapp: 'WhatsApp', wechat: 'WeChat', line: 'LINE', email: 'Email' });
  });
});

describe('validateContactHandle', () => {
  it('WhatsApp: 국제 형식 번호 허용, 짧거나 문자는 거부', () => {
    expect(validateContactHandle('whatsapp', '+82 10-6888-2773')).toBe(true);
    expect(validateContactHandle('whatsapp', '+1 (234) 567-8900')).toBe(true);
    expect(validateContactHandle('whatsapp', '01068882773')).toBe(true);
    expect(validateContactHandle('whatsapp', '+82')).toBe(false);
    expect(validateContactHandle('whatsapp', 'not-a-number')).toBe(false);
  });

  it('WeChat/LINE: 영숫자 ID 허용, 공백/한글 거부', () => {
    expect(validateContactHandle('wechat', 'livps0414')).toBe(true);
    expect(validateContactHandle('line', 'user_name-1.x')).toBe(true);
    expect(validateContactHandle('wechat', 'ab')).toBe(false);
    expect(validateContactHandle('line', 'has space')).toBe(false);
  });

  it('Email: 주소 형식만 허용', () => {
    expect(validateContactHandle('email', 'guest@example.com')).toBe(true);
    expect(validateContactHandle('email', '  guest@example.co.jp  ')).toBe(true);
    expect(validateContactHandle('email', 'guest@example')).toBe(false);
    expect(validateContactHandle('email', 'guest example@x.com')).toBe(false);
    expect(validateContactHandle('email', `${'a'.repeat(250)}@x.com`)).toBe(false);
  });
});

describe('buildChatRefCode', () => {
  it('참조코드는 uuid 앞 8자 대문자', () => {
    expect(buildChatRefCode('a1b2c3d4-0000-0000-0000-000000000000')).toBe('A1B2C3D4');
  });
});

describe('defaultFormChannel — 연락처 남기기의 기본 선택', () => {
  it('중국어 → WeChat, 일본어 → 이메일, 그 외 → WhatsApp', () => {
    expect(defaultFormChannel('zh')).toBe('wechat');
    expect(defaultFormChannel('ja')).toBe('email');
    expect(defaultFormChannel('en')).toBe('whatsapp');
    expect(defaultFormChannel('zh-TW')).toBe('whatsapp');
    expect(defaultFormChannel('th')).toBe('whatsapp');
  });
});

describe('orderedLinkChannels — 바로 연락하기 단추 순서', () => {
  it('1순위 메신저가 맨 앞', () => {
    expect(orderedLinkChannels('ja')).toEqual(['line', 'whatsapp', 'wechat', 'email']);
    expect(orderedLinkChannels('en')).toEqual(['whatsapp', 'wechat', 'line', 'email']);
    expect(orderedLinkChannels('zh')).toEqual(['wechat', 'whatsapp', 'line', 'email']);
    expect(orderedLinkChannels('zh-TW')).toEqual(['whatsapp', 'wechat', 'line', 'email']);
  });

  it('이메일은 어느 로케일에서나 맨 뒤', () => {
    for (const locale of ['en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar']) {
      const order = orderedLinkChannels(locale);
      expect(order).toHaveLength(4);
      expect(order[3]).toBe('email');
      expect(new Set(order).size).toBe(4);
    }
  });
});

describe('extractEmail — 손님 글 속 이메일', () => {
  it('본문 중간의 주소를 찾는다', () => {
    expect(extractEmail('Please reply to guest@example.com thanks')).toBe('guest@example.com');
  });

  it('문장 끝 마침표는 주소에 넣지 않는다', () => {
    expect(extractEmail('My email is guest@example.com.')).toBe('guest@example.com');
    expect(extractEmail('メールは guest.name+liv@example.co.jp です。')).toBe('guest.name+liv@example.co.jp');
  });

  it('병원 자체 도메인은 제외한다', () => {
    expect(extractEmail('I wrote to info@livps.co.kr yesterday')).toBeNull();
    expect(extractEmail('sent to hello@liv-clinic.net')).toBeNull();
    expect(extractEmail('sent to hello@mail.livps.co.kr')).toBeNull();
  });

  it('카드의 병원 주소(CHAT_CONTACT_EMAIL)는 제외한다 — 대소문자 무시', () => {
    expect(extractEmail(`I emailed ${CHAT_CONTACT_EMAIL}`)).toBeNull();
    expect(extractEmail(`I emailed ${CHAT_CONTACT_EMAIL.toUpperCase()}`)).toBeNull();
  });

  it('병원 주소 뒤에 손님 주소가 있으면 손님 주소를 고른다', () => {
    expect(extractEmail(`I emailed ${CHAT_CONTACT_EMAIL} from me@example.com`)).toBe('me@example.com');
  });

  it('여러 개면 첫째', () => {
    expect(extractEmail('a@example.com or b@example.com')).toBe('a@example.com');
  });

  it('없으면 null', () => {
    expect(extractEmail('How much is Ulthera?')).toBeNull();
    expect(extractEmail('my wechat is @liwei')).toBeNull();
    expect(extractEmail('')).toBeNull();
  });

  it('254자를 넘는 주소는 무시한다', () => {
    expect(extractEmail(`${'a'.repeat(250)}@example.com`)).toBeNull();
  });
});

describe('shouldShowCaptureBlock — 연락처 카드 노출 규칙', () => {
  const NOW = Date.parse('2026-10-05T03:00:00Z');
  const at = (minutesAgo: number) => new Date(NOW - minutesAgo * 60_000).toISOString();
  const visitor = (minutesAgo: number) => ({ sender: 'visitor', source: 'app', created_at: at(minutesAgo) });
  const staff = (minutesAgo: number, source = 'slack') => ({ sender: 'operator', source, created_at: at(minutesAgo) });
  const auto = (minutesAgo: number) => ({ sender: 'operator', source: 'auto', created_at: at(minutesAgo) });
  const system = (minutesAgo: number) => ({ sender: 'system', source: 'app', created_at: at(minutesAgo) });

  const base: CaptureBlockConditions = {
    presenceLoaded: true,
    sessionInfoLoaded: true,
    hasContact: false,
    dismissedAtMs: null,
    messages: [system(3), visitor(2), auto(2)],
    nowMs: NOW,
  };

  it('손님이 글을 남기고 기다리는 중이면 뜬다 — 영업시간과 무관하다', () => {
    expect(shouldShowCaptureBlock(base)).toBe(true);
  });

  it('presence나 세션 정보 조회가 끝나지 않았으면 뜨지 않는다', () => {
    expect(shouldShowCaptureBlock({ ...base, presenceLoaded: false })).toBe(false);
    expect(shouldShowCaptureBlock({ ...base, sessionInfoLoaded: false })).toBe(false);
  });

  it('손님 글이 없으면 뜨지 않는다', () => {
    expect(shouldShowCaptureBlock({ ...base, messages: [system(3)] })).toBe(false);
    expect(shouldShowCaptureBlock({ ...base, messages: [] })).toBe(false);
  });

  it('연락처가 이미 있으면 뜨지 않는다', () => {
    expect(shouldShowCaptureBlock({ ...base, hasContact: true })).toBe(false);
  });

  it('✕로 닫은 뒤 12시간 동안은 뜨지 않고, 그 뒤에는 다시 뜬다', () => {
    expect(shouldShowCaptureBlock({ ...base, dismissedAtMs: NOW - 60_000 })).toBe(false);
    expect(shouldShowCaptureBlock({ ...base, dismissedAtMs: NOW - CAPTURE_DISMISS_TTL_MS + 1 })).toBe(false);
    expect(shouldShowCaptureBlock({ ...base, dismissedAtMs: NOW - CAPTURE_DISMISS_TTL_MS })).toBe(true);
  });

  it('마지막이 직원 글이면(기다리는 중이 아니면) 뜨지 않는다', () => {
    expect(shouldShowCaptureBlock({ ...base, messages: [visitor(30), staff(20)] })).toBe(false);
  });

  it('자동 안내와 시스템 메시지는 직원 글로 치지 않는다', () => {
    expect(shouldShowCaptureBlock({ ...base, messages: [visitor(5), auto(5), system(4)] })).toBe(true);
    expect(isStaffMessage(auto(1))).toBe(false);
    expect(isStaffMessage(system(1))).toBe(false);
    expect(isStaffMessage(staff(1, 'app'))).toBe(true);
  });

  it('직원 글이 10분 안에 있으면(주고받는 중) 뜨지 않고, 10분이 지나면 다시 뜬다', () => {
    expect(shouldShowCaptureBlock({ ...base, messages: [visitor(8), staff(5), visitor(1)] })).toBe(false);
    expect(shouldShowCaptureBlock({ ...base, messages: [visitor(30), staff(11), visitor(9)] })).toBe(true);
    const justInside = new Date(NOW - STAFF_ACTIVE_WINDOW_MS + 1).toISOString();
    expect(
      shouldShowCaptureBlock({
        ...base,
        messages: [visitor(30), { sender: 'operator', source: 'slack', created_at: justInside }, visitor(1)],
      })
    ).toBe(false);
  });
});

describe('parseCaptureDismissedAt', () => {
  it('저장된 시각(ms)을 읽는다', () => {
    expect(parseCaptureDismissedAt('1790000000000')).toBe(1790000000000);
  });

  it("없거나 숫자가 아니면 null, 예전 값 '1'은 아주 옛날 시각으로 읽혀 만료 처리된다", () => {
    expect(parseCaptureDismissedAt(null)).toBeNull();
    expect(parseCaptureDismissedAt('')).toBeNull();
    expect(parseCaptureDismissedAt('abc')).toBeNull();
    expect(parseCaptureDismissedAt('1')).toBe(1);
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/contactChannels.test.ts`
Expected: FAIL — `CLINIC_LINK_CHANNELS`가 `undefined`, `extractEmail is not a function` 등으로 새 테스트가 실패한다.

- [ ] **Step 4: 구현**

`liv-clinic/src/lib/chat/contactChannels.ts` 를 아래 내용으로 교체한다. `CONTACT_CHANNELS`(@deprecated)는 지금의 카드(`ChatCaptureBlock`)와 연락처 라우트가 아직 쓰므로 남긴다 — Task 15에서 지운다.

```ts
// 채팅 연락처 카드의 채널 SSOT (스펙 2026-10-01 §4.2~§4.4).
// 클리닉이 실제 운영하는 계정과 1:1 (constants.ts SOCIAL_LINKS·CHAT_CONTACT_EMAIL 참조).
// 클라이언트/서버 공용 — 브라우저 API 접근 없음, 정규식 lookbehind 없음 (chatApi.ts 패턴).
import { CHAT_CONTACT_EMAIL } from '@/lib/constants';
import { primaryMessengerFor } from '@/lib/messengerLinks';

/** 카드의 "병원으로 바로 연락하기" 단추 네 개. API가 받는 채널 값의 전체 집합이기도 하다. */
export const CLINIC_LINK_CHANNELS = ['whatsapp', 'wechat', 'line', 'email'] as const;
/** 카드의 "연락처 남기기" 칩. LINE ID는 받지 않는다 — 직원이 ID로 손님을 찾지 못했다(2026-10-01 실측 2건 모두 실패). */
export const CONTACT_FORM_CHANNELS = ['whatsapp', 'wechat', 'email'] as const;
/** @deprecated 예전 카드(메신저 3종)용. 새 카드로 바꾸는 작업에서 지운다. */
export const CONTACT_CHANNELS = ['whatsapp', 'wechat', 'line'] as const;

export type ContactChannel = (typeof CLINIC_LINK_CHANNELS)[number];
export type ContactFormChannel = (typeof CONTACT_FORM_CHANNELS)[number];

// 손님 화면에 보이는 채널 이름 — 브랜드명이라 번역하지 않는다.
export const CONTACT_CHANNEL_LABELS: Record<ContactChannel, string> = {
  whatsapp: 'WhatsApp',
  wechat: 'WeChat',
  line: 'LINE',
  email: 'Email',
};

const WHATSAPP_HANDLE_RE = /^[+0-9][0-9 ()\-]{6,29}$/;
const ID_HANDLE_RE = /^[A-Za-z0-9._\-]{4,50}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length <= MAX_EMAIL_LENGTH && EMAIL_RE.test(trimmed);
}

export function validateContactHandle(channel: ContactChannel, handle: string): boolean {
  const trimmed = handle.trim();
  if (channel === 'whatsapp') return WHATSAPP_HANDLE_RE.test(trimmed);
  if (channel === 'email') return isValidEmail(trimmed);
  return ID_HANDLE_RE.test(trimmed);
}

/** 메신저 대화 ↔ 웹챗 기록을 잇는 짧은 참조코드 (uuid 첫 세그먼트 대문자). */
export function buildChatRefCode(sessionId: string): string {
  return sessionId.replace(/-/g, '').slice(0, 8).toUpperCase();
}

/** "연락처 남기기"의 기본 선택: 중국어 → WeChat, 일본어 → 이메일, 그 외 → WhatsApp. */
export function defaultFormChannel(locale: string): ContactFormChannel {
  if (locale === 'zh') return 'wechat';
  if (locale === 'ja') return 'email';
  return 'whatsapp';
}

/** "병원으로 바로 연락하기" 단추 순서: 그 로케일의 1순위 메신저가 맨 앞, 이메일은 맨 뒤. */
export function orderedLinkChannels(locale: string): ContactChannel[] {
  const primary = primaryMessengerFor(locale);
  const rest = (['whatsapp', 'wechat', 'line'] as const).filter((c) => c !== primary);
  return [primary, ...rest, 'email'];
}

// ── 손님 글 속 이메일 인식 (§4.3) ───────────────────────────────────────────

const EMAIL_IN_TEXT_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// 손님이 "이 주소로 메일 보냈어요"라고 병원 주소를 적어도 손님 연락처로 저장하지 않는다.
const CLINIC_EMAIL_DOMAINS = ['livps.co.kr', 'liv-clinic.net'];

/** 글 속 첫 이메일(병원 주소 제외, 254자 초과 무시). 없으면 null. */
export function extractEmail(text: string): string | null {
  for (const m of text.matchAll(EMAIL_IN_TEXT_RE)) {
    const email = m[0];
    if (email.length > MAX_EMAIL_LENGTH) continue;
    const lower = email.toLowerCase();
    if (lower === CHAT_CONTACT_EMAIL.toLowerCase()) continue;
    const domain = lower.slice(lower.lastIndexOf('@') + 1);
    if (CLINIC_EMAIL_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) continue;
    return email;
  }
  return null;
}

// ── 연락처 카드 노출 규칙 (§4.2) ────────────────────────────────────────────

/** ✕로 닫은 카드는 이만큼만 숨긴다 — 접수 안내가 12시간 뒤 다시 나갈 때 문장과 카드가 어긋나지 않게. */
export const CAPTURE_DISMISS_TTL_MS = 12 * 60 * 60 * 1000;
/** 직원 글이 이 시간 안에 있으면 "주고받는 중"으로 보고 카드를 끼워 넣지 않는다. */
export const STAFF_ACTIVE_WINDOW_MS = 10 * 60 * 1000;

export interface CaptureMessage {
  sender: string;
  /** 'auto' = 자동 안내. 직원 글로 치지 않는다 */
  source?: string | null;
  created_at: string;
}

export interface CaptureBlockConditions {
  /** presence 조회 성공 여부 — 실패하면 미노출 */
  presenceLoaded: boolean;
  /** 세션 정보(hasContact) 조회가 끝났는가 — 실패해도 true (연락처 없음으로 본다) */
  sessionInfoLoaded: boolean;
  /** 서버 기준 연락처 유무 (이메일 또는 메신저 연락처) */
  hasContact: boolean;
  /** 손님이 ✕로 닫은 시각(ms). 닫은 적 없으면 null */
  dismissedAtMs: number | null;
  /** 시간순 메시지 */
  messages: CaptureMessage[];
  nowMs: number;
}

/** 직원이 쓴 글인가 — 자동 안내(source='auto')와 시스템 메시지는 아니다. */
export function isStaffMessage(m: CaptureMessage): boolean {
  return m.sender === 'operator' && m.source !== 'auto';
}

/** 영업시간 여부는 노출 조건이 아니다 — 손님이 답을 기다리는 동안이면 낮에도 뜬다. */
export function shouldShowCaptureBlock(c: CaptureBlockConditions): boolean {
  if (!c.presenceLoaded || !c.sessionInfoLoaded) return false;
  if (c.hasContact) return false;
  if (c.dismissedAtMs !== null && c.nowMs - c.dismissedAtMs < CAPTURE_DISMISS_TTL_MS) return false;
  const turns = c.messages.filter((m) => m.sender === 'visitor' || isStaffMessage(m));
  if (!turns.some((m) => m.sender === 'visitor')) return false;
  // 기다리는 중: 손님 글과 직원 글 중 마지막이 손님 글
  if (turns[turns.length - 1].sender !== 'visitor') return false;
  // 직원과 실시간으로 주고받는 중에는 끼어들지 않는다
  const lastStaff = [...turns].reverse().find(isStaffMessage);
  if (lastStaff && c.nowMs - Date.parse(lastStaff.created_at) < STAFF_ACTIVE_WINDOW_MS) return false;
  return true;
}

/** localStorage 에 저장한 닫은 시각을 읽는다. 예전 값 '1'은 1ms로 읽혀 자연히 만료된 것으로 처리된다. */
export function parseCaptureDismissedAt(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
```

- [ ] **Step 5: 통과 확인 + 타입 검사**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/contactChannels.test.ts && npx tsc --noEmit`
Expected: PASS — 28건, tsc 출력 없음

- [ ] **Step 6: 커밋**

```bash
git add src/lib/constants.ts src/lib/chat/contactChannels.ts src/lib/chat/__tests__/contactChannels.test.ts
git commit -m "feat(chat): 연락처 채널 규칙 — 이메일 채널·글 속 이메일 인식·카드 노출 조건" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: 접수 안내 (자동 안내의 내용 교체)

**Files:**
- Modify: `liv-clinic/src/lib/chat/serverI18n.ts` (파일 끝에 덧붙임)
- Modify: `liv-clinic/src/lib/chat/autoAck.ts` (파일 전체 교체)
- Test: `liv-clinic/src/lib/chat/__tests__/autoAck.test.ts` (파일 전체 교체 — 기존 6건 유지 + 16건 추가)

**Interfaces:**
- Consumes: `businessSlot(now)`, `isBusinessHours(now)` (Task 2); `fakeAdmin`, `FakeOp` (기존 `__tests__/fakeAdmin.ts`)
- Produces:
  ```ts
  // src/lib/chat/serverI18n.ts
  export type IntakeSlot = 'open' | 'closing' | 'closed';
  export type IntakeFragmentKey = 'G' | 'S_open' | 'S_closing' | 'S_closed' | 'C_ask_open' | 'C_ask_closing' | 'C_ask_closed' | 'C_known_open' | 'C_known_closing' | 'C_known_closed' | 'Q' | 'W';
  export function intakeFragmentKeys(slot: IntakeSlot, hasContact: boolean): IntakeFragmentKey[];
  export function composeIntakeTexts(locale: VisitorLocale, slot: IntakeSlot, hasContact: boolean): { ko: string; localized: string };

  // src/lib/chat/autoAck.ts
  export type AutoAckKind = 'intake' | 'short';
  export const INTAKE_REPEAT_MS: number; // 12시간
  export function autoAckKind(s: { autoAckAt: string | null }, now: Date): AutoAckKind;
  export type AutoAckOutcome = 'sent' | 'not_due' | 'lost_race' | 'error';          // 기존 그대로
  export async function sendAutoAckIfDue(sessionId: string, now?: Date): Promise<AutoAckOutcome>; // 시그니처 그대로, 내용만 가른다
  ```
  `getAutoAckTexts`·`shouldSendAutoAck`는 바꾸지 않는다(짧은 안내와 발송 조건은 현행 그대로).

- [ ] **Step 1: 실패하는 테스트 작성**

`liv-clinic/src/lib/chat/__tests__/autoAck.test.ts` 를 아래 내용으로 교체한다:

<!-- plan-check: full liv-clinic/src/lib/chat/__tests__/autoAck.test.ts -->
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../db', () => ({ createChatAdminClient: vi.fn() }));
vi.mock('../broadcast', () => ({ broadcastToSession: vi.fn().mockResolvedValue(undefined) }));

import { createChatAdminClient } from '../db';
import { broadcastToSession } from '../broadcast';
import { autoAckKind, INTAKE_REPEAT_MS, sendAutoAckIfDue, shouldSendAutoAck } from '../autoAck';
import { _resetBusinessHoursForTesting } from '../businessHours';
import { composeIntakeTexts, getAutoAckTexts, intakeFragmentKeys, VISITOR_LOCALES, type IntakeSlot } from '../serverI18n';
import { fakeAdmin, type FakeOp } from './fakeAdmin';

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

describe('autoAckKind — 접수 안내 / 짧은 안내', () => {
  const now = new Date('2026-10-05T03:00:00Z');
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

  it('자동 안내를 보낸 적이 없으면 접수 안내', () => {
    expect(autoAckKind({ autoAckAt: null }, now)).toBe('intake');
  });
  it('마지막 안내가 12시간보다 오래됐으면 접수 안내', () => {
    expect(autoAckKind({ autoAckAt: ago(INTAKE_REPEAT_MS + 1) }, now)).toBe('intake');
  });
  it('12시간 이내면 짧은 안내', () => {
    expect(autoAckKind({ autoAckAt: ago(INTAKE_REPEAT_MS) }, now)).toBe('short');
    expect(autoAckKind({ autoAckAt: ago(60_000) }, now)).toBe('short');
  });
});

describe('composeIntakeTexts — 접수 안내 문장 조합', () => {
  const SLOTS: IntakeSlot[] = ['open', 'closing', 'closed'];

  it('문장 키: G + S + C + Q, 영업 중일 때만 W', () => {
    expect(intakeFragmentKeys('open', false)).toEqual(['G', 'S_open', 'C_ask_open', 'Q', 'W']);
    expect(intakeFragmentKeys('closing', false)).toEqual(['G', 'S_closing', 'C_ask_closing', 'Q']);
    expect(intakeFragmentKeys('closed', true)).toEqual(['G', 'S_closed', 'C_known_closed', 'Q']);
  });

  it('10개 로케일 × 3 시간대 × 연락처 유무가 모두 비어 있지 않고 서로 다르다', () => {
    for (const locale of VISITOR_LOCALES) {
      const seen = new Set<string>();
      for (const slot of SLOTS) {
        for (const hasContact of [false, true]) {
          const { localized } = composeIntakeTexts(locale, slot, hasContact);
          const lines = localized.split('\n');
          expect(lines).toHaveLength(slot === 'open' ? 5 : 4);
          for (const line of lines) expect(line.trim().length).toBeGreaterThan(5);
          seen.add(localized);
        }
      }
      expect(seen.size).toBe(6);
    }
  });

  it('채팅 메시지 길이 제한(1000자)을 넘지 않는다', () => {
    for (const locale of VISITOR_LOCALES) {
      for (const slot of SLOTS) {
        for (const hasContact of [false, true]) {
          const t = composeIntakeTexts(locale, slot, hasContact);
          expect(t.localized.length).toBeLessThanOrEqual(1000);
          expect(t.ko.length).toBeLessThanOrEqual(1000);
        }
      }
    }
  });

  it('한국어 원문은 로케일과 무관하게 같다', () => {
    expect(composeIntakeTexts('en', 'open', false).ko).toBe(composeIntakeTexts('ar', 'open', false).ko);
  });

  it('한국어 원문: 영업 중에는 "오늘 안에 최대한 빨리", 상담 시간 외에는 "상담 시간이 시작되는 대로"', () => {
    expect(composeIntakeTexts('en', 'open', false).ko).toContain('오늘 안에 최대한 빨리');
    expect(composeIntakeTexts('en', 'open', true).ko).toContain('남겨 주신 연락처로 오늘 안에 최대한 빨리');
    expect(composeIntakeTexts('en', 'closed', false).ko).toContain('상담 시간이 시작되는 대로');
    expect(composeIntakeTexts('en', 'closing', false).ko).toContain('다음 영업일에 가장 먼저');
  });

  it('"이 창을 열어 두시면" 문장(W)은 영업 중에만 붙는다', () => {
    const w = '이 창을 열어 두시면 여기로도 답변드립니다.';
    expect(composeIntakeTexts('en', 'open', false).ko.endsWith(w)).toBe(true);
    expect(composeIntakeTexts('en', 'closing', false).ko).not.toContain(w);
    expect(composeIntakeTexts('en', 'closed', false).ko).not.toContain(w);
  });

  it('원장님이 확인한 영어·일본어·중국어 첫 문장', () => {
    expect(composeIntakeTexts('en', 'open', false).localized.split('\n')[0]).toBe(
      "Hello, this is LIV Plastic Surgery. We've received your message."
    );
    expect(composeIntakeTexts('ja', 'open', false).localized.split('\n')[0]).toBe(
      'こんにちは、LIV美容クリニックです。メッセージを受け付けました。'
    );
    expect(composeIntakeTexts('zh', 'open', false).localized.split('\n')[0]).toBe('您好，这里是LIV整形外科。已收到您的留言。');
    expect(composeIntakeTexts('zh-TW', 'open', false).localized.split('\n')[0]).toBe(
      '您好，這裡是LIV整形外科。已收到您的訊息。'
    );
  });
});

describe('sendAutoAckIfDue — 종류에 따라 문구를 고른다', () => {
  const adminMock = vi.mocked(createChatAdminClient);
  const SESSION_ID = '11111111-2222-3333-4444-555555555555';
  // 2026-10-05(월) 12:00 KST — 영업 중(open)
  const NOW = new Date('2026-10-05T03:00:00Z');

  function sessionRow(over: Record<string, unknown> = {}) {
    return {
      id: SESSION_ID,
      visitor_locale: 'en',
      awaiting_since: '2026-10-05T02:59:58Z',
      auto_ack_at: null,
      visitor_email: null,
      visitor_messenger_handle: null,
      ...over,
    };
  }

  function adminWith(row: Record<string, unknown> | null) {
    const admin = fakeAdmin((op: FakeOp) => {
      if (op.table === 'chat_sessions' && op.op === 'select') return { data: row };
      if (op.table === 'chat_sessions' && op.op === 'update') return { data: [{ id: SESSION_ID }] };
      if (op.table === 'chat_messages' && op.op === 'insert') return { data: { id: 'm-auto' } };
      return { data: null };
    });
    adminMock.mockReturnValue(admin as never);
    return admin;
  }

  const insertedPayload = (admin: ReturnType<typeof fakeAdmin>) =>
    admin.ops.find((o) => o.table === 'chat_messages' && o.op === 'insert')?.payload as Record<string, unknown>;

  beforeEach(() => {
    delete process.env.CHAT_BUSINESS_HOURS_JSON;
    delete process.env.CHAT_CLOSED_DATES;
    _resetBusinessHoursForTesting();
    adminMock.mockReset();
    vi.mocked(broadcastToSession).mockClear();
  });
  afterEach(() => {
    _resetBusinessHoursForTesting();
  });

  it('첫 문의(연락처 없음) → 접수 안내: 연락처를 남겨 달라는 문장', async () => {
    const admin = adminWith(sessionRow());
    expect(await sendAutoAckIfDue(SESSION_ID, NOW)).toBe('sent');
    const expected = composeIntakeTexts('en', 'open', false);
    expect(insertedPayload(admin)).toMatchObject({
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
    expect(expected.ko).toContain('편한 연락처를 남겨 주시면');
    expect(broadcastToSession).toHaveBeenCalledTimes(1);
  });

  it('시작 화면에서 이메일을 넣은 손님 → "남겨 주신 연락처로" 문장', async () => {
    const admin = adminWith(sessionRow({ visitor_email: 'guest@example.com', visitor_locale: 'ja' }));
    expect(await sendAutoAckIfDue(SESSION_ID, NOW)).toBe('sent');
    expect(insertedPayload(admin).original_text).toBe(composeIntakeTexts('ja', 'open', true).ko);
    expect(insertedPayload(admin).translated_text).toBe(composeIntakeTexts('ja', 'open', true).localized);
  });

  it('상담 시간 외 첫 문의 → closed 문장', async () => {
    const admin = adminWith(sessionRow({ awaiting_since: '2026-10-04T15:00:00Z' }));
    // 2026-10-05(월) 00:00 KST
    expect(await sendAutoAckIfDue(SESSION_ID, new Date('2026-10-04T15:00:02Z'))).toBe('sent');
    expect(insertedPayload(admin).original_text).toBe(composeIntakeTexts('en', 'closed', false).ko);
  });

  it('12시간 안의 재발신 → 예전 짧은 안내 그대로', async () => {
    const admin = adminWith(
      sessionRow({ auto_ack_at: '2026-10-05T01:00:00Z', awaiting_since: '2026-10-05T02:59:58Z' })
    );
    expect(await sendAutoAckIfDue(SESSION_ID, NOW)).toBe('sent');
    expect(insertedPayload(admin).original_text).toBe(getAutoAckTexts('en', false).ko);
    expect(insertedPayload(admin).translated_text).toBe(getAutoAckTexts('en', false).localized);
  });

  it('마지막 안내가 12시간보다 오래됐으면 다시 접수 안내', async () => {
    const admin = adminWith(
      sessionRow({ auto_ack_at: '2026-10-04T10:00:00Z', awaiting_since: '2026-10-05T02:59:58Z' })
    );
    expect(await sendAutoAckIfDue(SESSION_ID, NOW)).toBe('sent');
    expect(insertedPayload(admin).original_text).toBe(composeIntakeTexts('en', 'open', false).ko);
  });

  it('이번 대기 구간에 이미 보냈으면 아무것도 넣지 않는다', async () => {
    const admin = adminWith(
      sessionRow({ auto_ack_at: '2026-10-05T02:59:59Z', awaiting_since: '2026-10-05T02:59:58Z' })
    );
    expect(await sendAutoAckIfDue(SESSION_ID, NOW)).toBe('not_due');
    expect(admin.ops.some((o) => o.op === 'insert')).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/autoAck.test.ts`
Expected: FAIL — `autoAckKind is not a function`, `composeIntakeTexts is not a function` 등. 기존 `shouldSendAutoAck`·`getAutoAckTexts` 6건은 통과한다.

- [ ] **Step 3: 접수 안내 문장 추가**

`liv-clinic/src/lib/chat/serverI18n.ts` 의 **파일 맨 끝**에 아래를 덧붙인다(기존 내용은 건드리지 않는다). ja·zh·zh-TW 문장은 스펙 부록 A와 글자 하나까지 같아야 한다.

<!-- plan-check: contains liv-clinic/src/lib/chat/serverI18n.ts -->
```ts
// ── 접수 안내 (스펙 2026-10-01 §4.1) ────────────────────────────────────────
// 새 문의의 첫 자동 안내: 예상 시간 + 연락처 요청 + 되묻기. 문장을 조합해 말풍선 하나로 보낸다.
// ja·zh·zh-TW 는 원장님이 미리보기에서 확인한 문장(스펙 부록 A) 그대로다 — 고치려면 미리보기도 함께 고친다.

export type IntakeSlot = 'open' | 'closing' | 'closed';

export type IntakeFragmentKey =
  | 'G'
  | 'S_open'
  | 'S_closing'
  | 'S_closed'
  | 'C_ask_open'
  | 'C_ask_closing'
  | 'C_ask_closed'
  | 'C_known_open'
  | 'C_known_closing'
  | 'C_known_closed'
  | 'Q'
  | 'W';

const INTAKE_FRAGMENTS_KO: Record<IntakeFragmentKey, string> = {
  G: '안녕하세요, 리브성형외과입니다. 메시지 잘 받았습니다.',
  S_open: '지금 상담 직원이 다른 손님을 안내 중이라 답변까지 10~20분쯤 걸릴 수 있습니다.',
  S_closing: '오늘 상담 시간이 곧 끝납니다.',
  S_closed: '지금은 상담 시간이 아닙니다.',
  C_ask_open:
    '기다리지 않으셔도 되도록 아래에 WeChat·LINE·WhatsApp·이메일 중 편한 연락처를 남겨 주시면, 오늘 안에 최대한 빨리 그쪽으로 연락드리겠습니다.',
  C_ask_closing:
    '아래에 WeChat·LINE·WhatsApp·이메일 중 편한 연락처를 남겨 주시면, 오늘 안에 연락드리고, 어려우면 다음 영업일에 가장 먼저 연락드리겠습니다.',
  C_ask_closed:
    '아래에 WeChat·LINE·WhatsApp·이메일 중 편한 연락처를 남겨 주시면, 상담 시간이 시작되는 대로 최대한 빨리 그쪽으로 연락드리겠습니다.',
  C_known_open: '남겨 주신 연락처로 오늘 안에 최대한 빨리 연락드리겠습니다.',
  C_known_closing: '남겨 주신 연락처로 오늘 안에 연락드리고, 어려우면 다음 영업일에 가장 먼저 연락드리겠습니다.',
  C_known_closed: '남겨 주신 연락처로 상담 시간이 시작되는 대로 최대한 빨리 연락드리겠습니다.',
  Q: '원하시는 시술과 방문 예정일을 함께 적어 주시면 한 번에 정확히 안내드릴 수 있습니다.',
  W: '이 창을 열어 두시면 여기로도 답변드립니다.',
};

const INTAKE_FRAGMENTS: Record<VisitorLocale, Record<IntakeFragmentKey, string>> = {
  en: {
    G: "Hello, this is LIV Plastic Surgery. We've received your message.",
    S_open: 'Our consultants are assisting other guests right now, so a reply may take about 10–20 minutes.',
    S_closing: 'Our consultation hours end soon today.',
    S_closed: "We're outside consultation hours right now.",
    C_ask_open:
      "So you don't have to wait, leave a contact below (WeChat, LINE, WhatsApp or email) and we'll reach out to you there today, as soon as we can.",
    C_ask_closing:
      "Leave a contact below (WeChat, LINE, WhatsApp or email) and we'll reach out to you there — today if we can, otherwise first thing on the next business day.",
    C_ask_closed:
      "Leave a contact below (WeChat, LINE, WhatsApp or email) and we'll reach out to you there as soon as our consultation hours begin.",
    C_known_open: "We'll reach out to you today at the contact you left, as soon as we can.",
    C_known_closing:
      "We'll reach out to you at the contact you left — today if we can, otherwise first thing on the next business day.",
    C_known_closed: "We'll reach out to you at the contact you left as soon as our consultation hours begin.",
    Q: "If you tell us which treatment you're interested in and when you plan to visit, we can give you a complete answer in one go.",
    W: "If you keep this window open, we'll also reply here.",
  },
  ja: {
    G: 'こんにちは、LIV美容クリニックです。メッセージを受け付けました。',
    S_open: 'ただいまスタッフが他のお客様をご案内中のため、ご返信まで10〜20分ほどかかる場合がございます。',
    S_closing: '本日のご相談時間はまもなく終了いたします。',
    S_closed: 'ただいまはご相談時間外です。',
    C_ask_open:
      'お待ちいただかなくて済むよう、下にWeChat・LINE・WhatsApp・メールのうちご都合のよい連絡先をお残しください。本日中に、できるだけ早くそちらへご連絡いたします。',
    C_ask_closing:
      '下にWeChat・LINE・WhatsApp・メールのうちご都合のよい連絡先をお残しください。本日中にご連絡し、難しい場合は翌営業日に最優先でご連絡いたします。',
    C_ask_closed:
      '下にWeChat・LINE・WhatsApp・メールのうちご都合のよい連絡先をお残しください。ご相談時間が始まり次第、できるだけ早くそちらへご連絡いたします。',
    C_known_open: 'お残しいただいた連絡先へ、本日中にできるだけ早くご連絡いたします。',
    C_known_closing: 'お残しいただいた連絡先へ本日中にご連絡し、難しい場合は翌営業日に最優先でご連絡いたします。',
    C_known_closed: 'お残しいただいた連絡先へ、ご相談時間が始まり次第できるだけ早くご連絡いたします。',
    Q: 'ご希望の施術とご来院予定日をあわせてお知らせいただければ、一度で正確にご案内できます。',
    W: 'この画面を開いたままにしていただければ、こちらにもご返信いたします。',
  },
  zh: {
    G: '您好，这里是LIV整形外科。已收到您的留言。',
    S_open: '目前咨询人员正在接待其他顾客，回复可能需要10～20分钟左右。',
    S_closing: '今天的咨询时间即将结束。',
    S_closed: '现在不在咨询时间内。',
    C_ask_open:
      '为了不让您久等，请在下方留下方便的联系方式（微信、LINE、WhatsApp或邮箱），我们会在今天之内尽快通过该方式联系您。',
    C_ask_closing:
      '请在下方留下方便的联系方式（微信、LINE、WhatsApp或邮箱），我们会在今天之内联系您；如来不及，将在下一个营业日第一时间联系您。',
    C_ask_closed: '请在下方留下方便的联系方式（微信、LINE、WhatsApp或邮箱），咨询时间一开始，我们会尽快通过该方式联系您。',
    C_known_open: '我们会在今天之内尽快通过您留下的联系方式与您联系。',
    C_known_closing: '我们会在今天之内通过您留下的联系方式与您联系；如来不及，将在下一个营业日第一时间联系您。',
    C_known_closed: '咨询时间一开始，我们会尽快通过您留下的联系方式与您联系。',
    Q: '请一并告知您想了解的项目和预计到访日期，我们可以一次性为您准确说明。',
    W: '保持此窗口打开，我们也会在这里回复您。',
  },
  'zh-TW': {
    G: '您好，這裡是LIV整形外科。已收到您的訊息。',
    S_open: '目前諮詢人員正在接待其他顧客，回覆可能需要10～20分鐘左右。',
    S_closing: '今天的諮詢時間即將結束。',
    S_closed: '現在不在諮詢時間內。',
    C_ask_open:
      '為了不讓您久等，請在下方留下方便的聯絡方式（微信、LINE、WhatsApp或電子郵件），我們會在今天之內盡快透過該方式與您聯絡。',
    C_ask_closing:
      '請在下方留下方便的聯絡方式（微信、LINE、WhatsApp或電子郵件），我們會在今天之內與您聯絡；如來不及，將在下一個營業日優先與您聯絡。',
    C_ask_closed:
      '請在下方留下方便的聯絡方式（微信、LINE、WhatsApp或電子郵件），諮詢時間一開始，我們會盡快透過該方式與您聯絡。',
    C_known_open: '我們會在今天之內盡快透過您留下的聯絡方式與您聯絡。',
    C_known_closing: '我們會在今天之內透過您留下的聯絡方式與您聯絡；如來不及，將在下一個營業日優先與您聯絡。',
    C_known_closed: '諮詢時間一開始，我們會盡快透過您留下的聯絡方式與您聯絡。',
    Q: '請一併告知您想了解的療程和預計到訪日期，我們可以一次為您準確說明。',
    W: '保持此視窗開啟，我們也會在這裡回覆您。',
  },
  vi: {
    G: 'Xin chào, đây là Phẫu thuật thẩm mỹ LIV. Chúng tôi đã nhận được tin nhắn của bạn.',
    S_open: 'Hiện nhân viên tư vấn đang hỗ trợ khách khác nên có thể mất khoảng 10–20 phút để trả lời.',
    S_closing: 'Giờ tư vấn hôm nay sắp kết thúc.',
    S_closed: 'Hiện đang ngoài giờ tư vấn.',
    C_ask_open:
      'Để bạn không phải chờ, hãy để lại một cách liên hệ bên dưới (WeChat, LINE, WhatsApp hoặc email), chúng tôi sẽ liên hệ với bạn qua đó trong hôm nay, sớm nhất có thể.',
    C_ask_closing:
      'Hãy để lại một cách liên hệ bên dưới (WeChat, LINE, WhatsApp hoặc email), chúng tôi sẽ liên hệ với bạn qua đó trong hôm nay nếu kịp, nếu không sẽ liên hệ đầu tiên vào ngày làm việc tiếp theo.',
    C_ask_closed:
      'Hãy để lại một cách liên hệ bên dưới (WeChat, LINE, WhatsApp hoặc email), chúng tôi sẽ liên hệ với bạn qua đó ngay khi giờ tư vấn bắt đầu.',
    C_known_open: 'Chúng tôi sẽ liên hệ với bạn trong hôm nay qua thông tin liên hệ bạn đã để lại, sớm nhất có thể.',
    C_known_closing:
      'Chúng tôi sẽ liên hệ với bạn qua thông tin liên hệ bạn đã để lại — trong hôm nay nếu kịp, nếu không sẽ liên hệ đầu tiên vào ngày làm việc tiếp theo.',
    C_known_closed: 'Chúng tôi sẽ liên hệ với bạn qua thông tin liên hệ bạn đã để lại ngay khi giờ tư vấn bắt đầu.',
    Q: 'Nếu bạn cho chúng tôi biết dịch vụ bạn quan tâm và thời gian dự định đến, chúng tôi có thể tư vấn đầy đủ chỉ trong một lần.',
    W: 'Nếu bạn để cửa sổ này mở, chúng tôi cũng sẽ trả lời tại đây.',
  },
  th: {
    G: 'สวัสดีค่ะ ที่นี่ศัลยกรรมพลาสติกลีฟค่ะ เราได้รับข้อความของคุณแล้วค่ะ',
    S_open: 'ขณะนี้เจ้าหน้าที่กำลังดูแลลูกค้าท่านอื่นอยู่ การตอบกลับอาจใช้เวลาประมาณ 10–20 นาทีค่ะ',
    S_closing: 'เวลาให้คำปรึกษาของวันนี้ใกล้จะสิ้นสุดแล้วค่ะ',
    S_closed: 'ขณะนี้อยู่นอกเวลาให้คำปรึกษาค่ะ',
    C_ask_open:
      'เพื่อไม่ให้คุณต้องรอ กรุณาฝากช่องทางติดต่อไว้ด้านล่าง (WeChat, LINE, WhatsApp หรืออีเมล) เราจะติดต่อกลับทางนั้นภายในวันนี้โดยเร็วที่สุดค่ะ',
    C_ask_closing:
      'กรุณาฝากช่องทางติดต่อไว้ด้านล่าง (WeChat, LINE, WhatsApp หรืออีเมล) เราจะติดต่อกลับทางนั้นภายในวันนี้ หากไม่ทันจะติดต่อเป็นอันดับแรกในวันทำการถัดไปค่ะ',
    C_ask_closed:
      'กรุณาฝากช่องทางติดต่อไว้ด้านล่าง (WeChat, LINE, WhatsApp หรืออีเมล) เราจะติดต่อกลับทางนั้นโดยเร็วที่สุดเมื่อถึงเวลาให้คำปรึกษาค่ะ',
    C_known_open: 'เราจะติดต่อกลับทางช่องทางที่คุณฝากไว้ภายในวันนี้โดยเร็วที่สุดค่ะ',
    C_known_closing: 'เราจะติดต่อกลับทางช่องทางที่คุณฝากไว้ภายในวันนี้ หากไม่ทันจะติดต่อเป็นอันดับแรกในวันทำการถัดไปค่ะ',
    C_known_closed: 'เราจะติดต่อกลับทางช่องทางที่คุณฝากไว้โดยเร็วที่สุดเมื่อถึงเวลาให้คำปรึกษาค่ะ',
    Q: 'หากแจ้งหัตถการที่สนใจและวันที่คาดว่าจะเข้ามา เราจะให้ข้อมูลได้ครบถ้วนในครั้งเดียวค่ะ',
    W: 'หากเปิดหน้าต่างนี้ไว้ เราจะตอบกลับที่นี่ด้วยค่ะ',
  },
  ru: {
    G: 'Здравствуйте, это клиника «ЛИВ Пластическая хирургия». Мы получили ваше сообщение.',
    S_open: 'Сейчас наши консультанты заняты с другими гостями, поэтому ответ может занять около 10–20 минут.',
    S_closing: 'Время консультаций на сегодня скоро заканчивается.',
    S_closed: 'Сейчас нерабочее время консультаций.',
    C_ask_open:
      'Чтобы вам не пришлось ждать, оставьте ниже удобный контакт (WeChat, LINE, WhatsApp или email), и мы свяжемся с вами там сегодня, как можно скорее.',
    C_ask_closing:
      'Оставьте ниже удобный контакт (WeChat, LINE, WhatsApp или email), и мы свяжемся с вами там — сегодня, если успеем, а если нет — первым делом в следующий рабочий день.',
    C_ask_closed:
      'Оставьте ниже удобный контакт (WeChat, LINE, WhatsApp или email), и мы свяжемся с вами там, как только начнётся время консультаций.',
    C_known_open: 'Мы свяжемся с вами сегодня по оставленному вами контакту, как можно скорее.',
    C_known_closing:
      'Мы свяжемся с вами по оставленному вами контакту — сегодня, если успеем, а если нет — первым делом в следующий рабочий день.',
    C_known_closed: 'Мы свяжемся с вами по оставленному вами контакту, как только начнётся время консультаций.',
    Q: 'Если вы сообщите, какая процедура вас интересует и когда вы планируете визит, мы сможем сразу дать полный ответ.',
    W: 'Если вы оставите это окно открытым, мы ответим и здесь.',
  },
  fr: {
    G: 'Bonjour, ici LIV Chirurgie Esthétique. Nous avons bien reçu votre message.',
    S_open:
      "Nos conseillers s'occupent actuellement d'autres patients ; la réponse peut prendre environ 10 à 20 minutes.",
    S_closing: "Nos horaires de consultation se terminent bientôt aujourd'hui.",
    S_closed: 'Nous sommes actuellement en dehors des horaires de consultation.',
    C_ask_open:
      "Pour vous éviter d'attendre, laissez un contact ci-dessous (WeChat, LINE, WhatsApp ou e-mail) et nous vous y recontacterons aujourd'hui, dès que possible.",
    C_ask_closing:
      "Laissez un contact ci-dessous (WeChat, LINE, WhatsApp ou e-mail) et nous vous y recontacterons — aujourd'hui si possible, sinon en priorité le prochain jour ouvré.",
    C_ask_closed:
      'Laissez un contact ci-dessous (WeChat, LINE, WhatsApp ou e-mail) et nous vous y recontacterons dès le début de nos horaires de consultation.',
    C_known_open: "Nous vous recontacterons aujourd'hui au contact que vous avez laissé, dès que possible.",
    C_known_closing:
      "Nous vous recontacterons au contact que vous avez laissé — aujourd'hui si possible, sinon en priorité le prochain jour ouvré.",
    C_known_closed:
      'Nous vous recontacterons au contact que vous avez laissé dès le début de nos horaires de consultation.',
    Q: 'Si vous nous indiquez le soin qui vous intéresse et la date prévue de votre visite, nous pourrons vous donner une réponse complète en une seule fois.',
    W: 'Si vous gardez cette fenêtre ouverte, nous vous répondrons aussi ici.',
  },
  mn: {
    G: 'Сайн байна уу, LIV Гоо Заслын Эмнэлэг байна. Таны мессежийг хүлээн авлаа.',
    S_open:
      'Одоо манай зөвлөхүүд бусад үйлчлүүлэгчид үйлчилж байгаа тул хариу өгөхөд 10–20 орчим минут шаардагдаж магадгүй.',
    S_closing: 'Өнөөдрийн зөвлөгөөний цаг удахгүй дуусна.',
    S_closed: 'Одоо зөвлөгөөний цаг биш байна.',
    C_ask_open:
      'Таныг хүлээлгэхгүйн тулд доор холбоо барих хаягаа (WeChat, LINE, WhatsApp эсвэл имэйл) үлдээвэл бид өнөөдөртөө багтаан аль болох хурдан тэр хаягаар тантай холбогдоно.',
    C_ask_closing:
      'Доор холбоо барих хаягаа (WeChat, LINE, WhatsApp эсвэл имэйл) үлдээвэл бид өнөөдөртөө багтаан холбогдох бөгөөд амжихгүй бол дараагийн ажлын өдөр хамгийн түрүүнд холбогдоно.',
    C_ask_closed:
      'Доор холбоо барих хаягаа (WeChat, LINE, WhatsApp эсвэл имэйл) үлдээвэл зөвлөгөөний цаг эхэлмэгц бид аль болох хурдан тэр хаягаар тантай холбогдоно.',
    C_known_open: 'Таны үлдээсэн хаягаар бид өнөөдөртөө багтаан аль болох хурдан холбогдоно.',
    C_known_closing:
      'Таны үлдээсэн хаягаар бид өнөөдөртөө багтаан холбогдох бөгөөд амжихгүй бол дараагийн ажлын өдөр хамгийн түрүүнд холбогдоно.',
    C_known_closed: 'Таны үлдээсэн хаягаар зөвлөгөөний цаг эхэлмэгц бид аль болох хурдан холбогдоно.',
    Q: 'Сонирхож буй эмчилгээ болон ирэхээр төлөвлөж буй өдрөө хамт бичвэл бид нэг дор бүрэн хариулт өгөх боломжтой.',
    W: 'Энэ цонхыг нээлттэй үлдээвэл бид энд бас хариулна.',
  },
  ar: {
    G: 'مرحباً، معكم مستشفى ليف للتجميل. لقد استلمنا رسالتك.',
    S_open: 'مستشارونا يساعدون ضيوفاً آخرين حالياً، لذا قد يستغرق الرد نحو 10–20 دقيقة.',
    S_closing: 'ساعات الاستشارة لهذا اليوم ستنتهي قريباً.',
    S_closed: 'نحن حالياً خارج ساعات الاستشارة.',
    C_ask_open:
      'حتى لا تضطر للانتظار، اترك وسيلة تواصل أدناه (WeChat أو LINE أو WhatsApp أو البريد الإلكتروني) وسنتواصل معك عبرها اليوم في أقرب وقت ممكن.',
    C_ask_closing:
      'اترك وسيلة تواصل أدناه (WeChat أو LINE أو WhatsApp أو البريد الإلكتروني) وسنتواصل معك عبرها اليوم إن أمكن، وإلا فسنتواصل معك أولاً في يوم العمل التالي.',
    C_ask_closed:
      'اترك وسيلة تواصل أدناه (WeChat أو LINE أو WhatsApp أو البريد الإلكتروني) وسنتواصل معك عبرها فور بدء ساعات الاستشارة.',
    C_known_open: 'سنتواصل معك اليوم عبر وسيلة التواصل التي تركتها في أقرب وقت ممكن.',
    C_known_closing:
      'سنتواصل معك عبر وسيلة التواصل التي تركتها اليوم إن أمكن، وإلا فسنتواصل معك أولاً في يوم العمل التالي.',
    C_known_closed: 'سنتواصل معك عبر وسيلة التواصل التي تركتها فور بدء ساعات الاستشارة.',
    Q: 'إذا أخبرتنا بالإجراء الذي يهمك وموعد زيارتك المتوقع، يمكننا إعطاؤك إجابة كاملة دفعة واحدة.',
    W: 'إذا أبقيت هذه النافذة مفتوحة، سنرد عليك هنا أيضاً.',
  },
};

/** 접수 안내에 들어가는 문장 키 (순수): G + S + C + Q, 영업 중일 때만 W. */
export function intakeFragmentKeys(slot: IntakeSlot, hasContact: boolean): IntakeFragmentKey[] {
  const keys: IntakeFragmentKey[] = ['G', `S_${slot}`, `C_${hasContact ? 'known' : 'ask'}_${slot}`, 'Q'];
  if (slot === 'open') keys.push('W');
  return keys;
}

/** 접수 안내 문구. ko = 관리자 화면에 보이는 원문, localized = 손님 언어. 줄바꿈으로 이은 말풍선 하나. */
export function composeIntakeTexts(
  locale: VisitorLocale,
  slot: IntakeSlot,
  hasContact: boolean
): { ko: string; localized: string } {
  const keys = intakeFragmentKeys(slot, hasContact);
  const table = INTAKE_FRAGMENTS[locale] ?? INTAKE_FRAGMENTS.en;
  return {
    ko: keys.map((k) => INTAKE_FRAGMENTS_KO[k]).join('\n'),
    localized: keys.map((k) => table[k]).join('\n'),
  };
}
```

- [ ] **Step 4: 자동 안내가 종류에 따라 문구를 고르게 한다**

`liv-clinic/src/lib/chat/autoAck.ts` 를 아래 내용으로 교체한다. 바뀌는 곳은 세 군데다 — 세션 조회에 `visitor_email, visitor_messenger_handle` 추가(037에 이미 있는 컬럼), `autoAckKind` 추가, 문구 고르기. 선점·INSERT·broadcast는 그대로다.

<!-- plan-check: full liv-clinic/src/lib/chat/autoAck.ts -->
```ts
import 'server-only';
import { createChatAdminClient } from '@/lib/chat/db';
import { broadcastToSession } from '@/lib/chat/broadcast';
import { businessSlot, isBusinessHours } from '@/lib/chat/businessHours';
import { composeIntakeTexts, getAutoAckTexts, type VisitorLocale } from '@/lib/chat/serverI18n';

// 자동 안내: 손님 메시지가 새 대기 구간을 시작할 때 1회, 손님 언어로 미리 쓴 문구를 낸다.
// 번역 API 호출 없음. source='auto'라 040 트리거가 "답변"으로 세지 않는다.
// 종류 (스펙 2026-10-01 §4.1):
//   intake = 접수 안내(예상 시간 + 연락처 요청 + 되묻기). 처음이거나 마지막 안내가 12시간보다 오래됐을 때
//   short  = 짧은 안내(예전 문구 그대로). 직원과 주고받는 중에 다시 나갈 때

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

export type AutoAckKind = 'intake' | 'short';

/** 접수 안내를 다시 보내기까지의 간격 — 연락처 카드를 닫아 두는 시간(12시간)과 같다. */
export const INTAKE_REPEAT_MS = 12 * 60 * 60 * 1000;

/** 이번에 나갈 안내의 종류 (순수). 보낼지 말지는 shouldSendAutoAck가 따로 판정한다. */
export function autoAckKind(s: { autoAckAt: string | null }, now: Date): AutoAckKind {
  if (!s.autoAckAt) return 'intake';
  return now.getTime() - Date.parse(s.autoAckAt) > INTAKE_REPEAT_MS ? 'intake' : 'short';
}

export type AutoAckOutcome = 'sent' | 'not_due' | 'lost_race' | 'error';

export async function sendAutoAckIfDue(sessionId: string, now = new Date()): Promise<AutoAckOutcome> {
  try {
    const admin = createChatAdminClient();
    // 042의 새 컬럼(event_hint_at 등)은 여기에 넣지 않는다 — 042 적용 전 배포에서도 자동 안내는 나가야 한다.
    const { data: s, error: readError } = await admin
      .from('chat_sessions')
      .select('id, visitor_locale, awaiting_since, auto_ack_at, visitor_email, visitor_messenger_handle')
      .eq('id', sessionId)
      .maybeSingle();
    if (readError) {
      console.warn('[auto ack] session read failed:', readError.code ?? 'unknown');
      return 'error';
    }
    if (!s || !s.awaiting_since) return 'not_due';
    if (!shouldSendAutoAck({ awaitingSince: s.awaiting_since, autoAckAt: s.auto_ack_at })) return 'not_due';

    // 조건부 선점 — 읽은 값이 그대로일 때만 1행. 손님이 연달아 보내도 안내는 한 번이다.
    let claim = admin
      .from('chat_sessions')
      .update({ auto_ack_at: now.toISOString() })
      .eq('id', sessionId)
      .eq('awaiting_since', s.awaiting_since);
    claim = s.auto_ack_at ? claim.eq('auto_ack_at', s.auto_ack_at) : claim.is('auto_ack_at', null);
    const { data: claimed, error: claimError } = await claim.select('id');
    if (claimError) {
      console.warn('[auto ack] claim failed:', claimError.code ?? 'unknown');
      return 'error';
    }
    if (!claimed || claimed.length === 0) return 'lost_race';

    const locale = s.visitor_locale as VisitorLocale;
    const hasContact = Boolean(s.visitor_email || s.visitor_messenger_handle);
    const texts =
      autoAckKind({ autoAckAt: s.auto_ack_at }, now) === 'intake'
        ? composeIntakeTexts(locale, businessSlot(now), hasContact)
        : getAutoAckTexts(locale, !isBusinessHours(now));
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

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/autoAck.test.ts`
Expected: PASS — 22건

- [ ] **Step 6: 전체 회귀 + 타입 검사**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run && npx tsc --noEmit`
Expected: 47파일 688건 통과, tsc 출력 없음

- [ ] **Step 7: 커밋**

```bash
git add src/lib/chat/serverI18n.ts src/lib/chat/autoAck.ts src/lib/chat/__tests__/autoAck.test.ts
git commit -m "feat(chat): 접수 안내 — 예상 시간·연락처 요청·되묻기 문장 조합(10개 언어), 12시간마다" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Slack 문구와 알림 릴레이

**Files:**
- Modify: `liv-clinic/src/lib/chat/__tests__/fakeAdmin.ts` (파일 전체 교체 — 테스트 도구)
- Modify: `liv-clinic/src/lib/chat/slackText.ts` (파일 전체 교체)
- Modify: `liv-clinic/src/lib/chat/slackRelay.ts` (import, `RelayOutboundArgs`, `roomText`, `relayContactToSlack` 교체 + 함수 4개 추가)
- Modify: `liv-clinic/src/app/api/chat/contact/route.ts` (호출 한 줄 — 새 시그니처에 맞춤)
- Test: `liv-clinic/src/lib/chat/__tests__/slackText.test.ts`, `liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts`

**Interfaces:**
- Consumes: `isFollowupEnabled()` (Task 1); `CONTACT_CHANNEL_LABELS`, `buildChatRefCode`, `ContactChannel` (Task 3); `CHAT_CONTACT_EMAIL` (Task 3)
- Produces:
  ```ts
  // __tests__/fakeAdmin.ts
  export interface FakeOp { table: string; op: 'select' | 'update' | 'insert'; columns?: string; filters: Array<[string, string, unknown]>; payload?: unknown }
  // 빌더가 gte / in / or 를 받고, select(columns) 의 컬럼 문자열을 op.columns 에 남긴다
  export function hasFilterOp(op: FakeOp, column: string, operator: string): boolean;

  // src/lib/chat/slackText.ts
  export function staffChannelLabel(channel: string | null | undefined): string; // 'email' → '이메일'
  export type ContactNoticeMode = 'room' | 'thread' | 'standalone';
  export function buildContactText(args: { channelLabel: string; handle: string; mode: ContactNoticeMode; followup: boolean; adminUrl: string | null }): string;
  export function buildMessengerClickText(args: { channel: ContactChannel; sessionId: string; copyHint: boolean }): string;
  export function buildTranslationCopyText(translated: string): string;
  export function buildEventHintNote(url: string): string;
  export const ROOM_AUTO_ACK_NOTE: string;        // 문구 교체
  export const ROOM_EMAIL_CONTACT_NOTE: string;
  export function buildRoomFirstText(args: { mentionAll: string; receivedAt: string; visitorLocale: string; originalText: string; translatedText: string | null; contactNote?: string | null }): string;
  export type FeedKind = 'new' | 'resolved' | 'closed' | 'reopened' | 'escalated' | 'contact';
  export function buildFeedLine(args: { kind: FeedKind; /* 기존 인자 */; contactLabel?: string | null }): string;
  export interface FollowupDigestItem { visitorName: string | null; visitorLocale: string; contactLabel: string; awaitingSince: string; channelId: string | null; adminUrl: string | null }
  export const FOLLOWUP_DIGEST_MAX_LINES = 20;
  export function buildFollowupDigestText(args: { mentionAll: string; items: FollowupDigestItem[] }): string;

  // src/lib/chat/slackRelay.ts
  export interface RelayOutboundArgs { /* 기존 */; contactJustSaved?: boolean }
  export async function relayContactToSlack(args: { sessionId: string; channel: ContactChannel; handle: string }): Promise<void>; // 시그니처 변경: channelLabel → channel
  export async function relayMessengerClickToSlack(args: { sessionId: string; channel: ContactChannel }): Promise<void>;
  export async function relayEventHintNoteToSlack(args: { sessionId: string; url: string }): Promise<void>;
  // relaySlackReplyToVisitor: 전달 뒤 연락 수단이 있는 방 세션에 번역본을 올린다(내부 함수 postTranslationCopy)
  ```

- [ ] **Step 1: 테스트 도구 확장**

`liv-clinic/src/lib/chat/__tests__/fakeAdmin.ts` 를 아래 내용으로 교체한다(`gte`·`in`·`or` 지원, `select` 컬럼 기록, `hasFilterOp` 추가. 기존 테스트가 쓰는 동작은 그대로다):

<!-- plan-check: full liv-clinic/src/lib/chat/__tests__/fakeAdmin.ts -->
```ts
// supabase-js admin 클라이언트의 체이닝 빌더를 흉내 낸다.
// 각 from() 체인이 끝(maybeSingle/single/await)에 닿으면 handler(op)의 결과를 돌려준다.
export interface FakeOp {
  table: string;
  op: 'select' | 'update' | 'insert';
  /** 마지막 select(...)에 넘긴 컬럼 문자열 — 같은 테이블의 조회를 서로 구분할 때 쓴다 */
  columns?: string;
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
        select: (columns?: string) => ((op.columns = columns), b),
        update: (payload: unknown) => ((op.op = 'update'), (op.payload = payload), b),
        insert: (payload: unknown) => ((op.op = 'insert'), (op.payload = payload), b),
        eq: (c: string, v: unknown) => (op.filters.push([c, 'eq', v]), b),
        is: (c: string, v: unknown) => (op.filters.push([c, 'is', v]), b),
        not: (c: string, o: string, v: unknown) => (op.filters.push([c, `not.${o}`, v]), b),
        lt: (c: string, v: unknown) => (op.filters.push([c, 'lt', v]), b),
        gte: (c: string, v: unknown) => (op.filters.push([c, 'gte', v]), b),
        in: (c: string, v: unknown[]) => (op.filters.push([c, 'in', v]), b),
        // or('a.is.null,b.is.null') — 식 전체를 값으로 남긴다 (컬럼 자리는 빈 글자)
        or: (expr: string) => (op.filters.push(['', 'or', expr]), b),
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

/** 연산자까지 맞는 필터가 있는가 — 예: hasFilterOp(op, 'awaiting_since', 'gte') */
export function hasFilterOp(op: FakeOp, column: string, operator: string): boolean {
  return op.filters.some(([c, o]) => c === column && o === operator);
}
```

- [ ] **Step 2: Slack 문구 테스트 고치기 (실패하는 상태로)**

`liv-clinic/src/lib/chat/__tests__/slackText.test.ts` 를 네 군데 고친다.

(1) 파일 맨 위의 `import { … } from '../slackText';` 묶음(2~16행)을 아래로 바꾼다:

<!-- plan-check: contains liv-clinic/src/lib/chat/__tests__/slackText.test.ts -->
```ts
import {
  buildContactText,
  buildDeliveryFailureText,
  buildEscalationText,
  buildEventHintNote,
  buildFeedLine,
  buildFollowupDigestText,
  buildMessengerClickText,
  buildReplyText,
  buildRoomFirstText,
  buildRoomTopic,
  buildRoomVisitorText,
  buildRootText,
  buildTranslationCopyText,
  extractRoomChannelFromFeedText,
  buildFeedReplyMirrorText,
  FOLLOWUP_DIGEST_MAX_LINES,
  ROOM_AUTO_ACK_NOTE,
  ROOM_EMAIL_CONTACT_NOTE,
  ROOM_FOOTER,
  staffChannelLabel,
  type FollowupDigestItem,
} from '../slackText';
import { CHAT_CONTACT_EMAIL } from '@/lib/constants';
```

(2) `describe('buildContactText — 방문자 연락처 릴레이', …)` 블록 전체(테스트 3건)를 지우고 그 자리에 아래를 넣는다(describe 6개):

<!-- plan-check: contains liv-clinic/src/lib/chat/__tests__/slackText.test.ts -->
```ts
describe('buildContactText — 손님 연락처 알림', () => {
  it("방: '오늘 연락할 손님' 분류와 번역본 안내 세 줄을 붙인다", () => {
    const text = buildContactText({
      channelLabel: 'WeChat',
      handle: 'abc123',
      adminUrl: null,
      mode: 'room',
      followup: true,
    });
    expect(text).toBe(
      '📱 *손님이 연락처를 남겼습니다* — WeChat: abc123\n' +
        "_'오늘 연락할 손님'으로 분류했습니다. 5·12·30분 알림은 울리지 않습니다._\n" +
        '_이 방에 한국어로 답을 쓰면 바로 아래에 번역본이 올라옵니다. 복사해서 위챗·왓츠앱·메일에 붙여 넣으세요._\n' +
        '_방에 답을 쓰면 목록에서 빠집니다. 상담이 끝나면 방을 보관(완료)해 주세요._'
    );
  });

  it('스레드: 번역본은 방에만 올라오므로 그 줄을 뺀다', () => {
    const text = buildContactText({
      channelLabel: '이메일',
      handle: 'guest@example.com',
      adminUrl: null,
      mode: 'thread',
      followup: true,
    });
    expect(text).toBe(
      '📱 *손님이 연락처를 남겼습니다* — 이메일: guest@example.com\n' +
        "_'오늘 연락할 손님'으로 분류했습니다. 5·12·30분 알림은 울리지 않습니다._\n" +
        '_이 스레드에 답글을 쓰면 목록에서 빠집니다._'
    );
  });

  it('긴급 정지(CHAT_FOLLOWUP=off) 중에는 분류 안내 대신 연락 요청만 남긴다', () => {
    const text = buildContactText({
      channelLabel: 'WhatsApp',
      handle: '+82 10-1234-5678',
      adminUrl: null,
      mode: 'room',
      followup: false,
    });
    expect(text).toBe(
      '📱 *손님이 연락처를 남겼습니다* — WhatsApp: +82 10-1234-5678\n_이 연락처로 먼저 연락해 주세요._'
    );
  });

  it('핸들의 Slack 마크업을 이스케이프한다', () => {
    const text = buildContactText({
      channelLabel: 'WeChat',
      handle: '<!channel>id',
      adminUrl: null,
      mode: 'room',
      followup: true,
    });
    expect(text).not.toContain('<!channel>');
    expect(text).toContain('&lt;!channel&gt;id');
  });

  it('붙일 방·스레드가 없으면(단독 게시) 관리자 화면에서 답하라는 안내와 링크를 붙인다', () => {
    const text = buildContactText({
      channelLabel: 'LINE',
      handle: 'my_line_id',
      adminUrl: 'https://example.com/admin/chat/abc',
      mode: 'standalone',
      followup: true,
    });
    expect(text).toBe(
      '📱 *손님이 연락처를 남겼습니다* — LINE: my_line_id\n' +
        "_'오늘 연락할 손님'으로 분류했습니다. 5·12·30분 알림은 울리지 않습니다._\n" +
        '_관리자 화면에서 답하면 목록에서 빠집니다._\n' +
        '🔗 <https://example.com/admin/chat/abc|관리자 화면에서 열기>'
    );
  });

  it('방·스레드에 붙을 때는 관리자 링크를 붙이지 않는다', () => {
    const text = buildContactText({
      channelLabel: 'LINE',
      handle: 'my_line_id',
      adminUrl: 'https://example.com/admin/chat/abc',
      mode: 'room',
      followup: true,
    });
    expect(text).not.toContain('🔗');
  });
});

describe('staffChannelLabel — 직원에게 보이는 채널 이름', () => {
  it('이메일만 한국어, 메신저는 브랜드명', () => {
    expect(staffChannelLabel('email')).toBe('이메일');
    expect(staffChannelLabel('wechat')).toBe('WeChat');
    expect(staffChannelLabel('whatsapp')).toBe('WhatsApp');
    expect(staffChannelLabel('line')).toBe('LINE');
  });
  it('모르는 값은 그대로, 없으면 빈 글자', () => {
    expect(staffChannelLabel('telegram')).toBe('telegram');
    expect(staffChannelLabel(null)).toBe('');
  });
});

describe('buildMessengerClickText — 손님이 카드의 병원 연락 단추를 눌렀다', () => {
  const sessionId = 'a1b2c3d4-0000-0000-0000-000000000000';

  it('WhatsApp', () => {
    expect(buildMessengerClickText({ channel: 'whatsapp', sessionId, copyHint: true })).toBe(
      '📲 손님이 WhatsApp으로 이어가기를 눌렀습니다 — 병원 WhatsApp에서 코드 #A1B2C3D4 가 담긴 메시지를 확인해 주세요. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다.'
    );
  });

  it('LINE도 같은 형식', () => {
    expect(buildMessengerClickText({ channel: 'line', sessionId, copyHint: true })).toBe(
      '📲 손님이 LINE으로 이어가기를 눌렀습니다 — 병원 LINE에서 코드 #A1B2C3D4 가 담긴 메시지를 확인해 주세요. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다.'
    );
  });

  it('WeChat은 아이디·QR 확인', () => {
    expect(buildMessengerClickText({ channel: 'wechat', sessionId, copyHint: true })).toBe(
      '📲 손님이 병원 WeChat 아이디·QR을 확인했습니다 — 업무폰 WeChat에서 친구 요청과 코드 #A1B2C3D4 메시지를 확인해 주세요. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다.'
    );
  });

  it('이메일은 병원 주소가 들어간다', () => {
    const text = buildMessengerClickText({ channel: 'email', sessionId, copyHint: true });
    expect(text).toBe(
      `📲 손님이 병원 이메일 주소를 확인했습니다 — ${CHAT_CONTACT_EMAIL} 메일함에서 코드 #A1B2C3D4 가 담긴 메일을 확인해 주세요. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다.`
    );
    expect(text).toContain('jaeho19@gmail.com');
  });

  it('번역본이 올라오지 않는 곳(스레드·긴급 정지)에서는 그 안내를 붙이지 않는다', () => {
    const text = buildMessengerClickText({ channel: 'whatsapp', sessionId, copyHint: false });
    expect(text.endsWith('메시지를 확인해 주세요.')).toBe(true);
    expect(text).not.toContain('번역본');
  });
});

describe('buildTranslationCopyText — 직원 답글의 번역본', () => {
  it('번역문만 담는다 (머리말·이모지 없음)', () => {
    expect(buildTranslationCopyText('您好，价格是100万韩元。')).toBe('您好，价格是100万韩元。');
  });
  it('Slack 마크업만 이스케이프한다', () => {
    expect(buildTranslationCopyText('A & B <!channel>')).toBe('A &amp; B &lt;!channel&gt;');
  });
});

describe('buildEventHintNote — 이벤트 링크가 자동으로 나갔다', () => {
  it('안내 한 줄 + 링크 줄', () => {
    expect(buildEventHintNote('https://liv-clinic.net/en/events/2026-10-promotion')).toBe(
      '🎁 _가격 문의로 보여 손님에게 이벤트 링크를 자동으로 보냈습니다. 가격은 직접 답해 주세요._\n' +
        'https://liv-clinic.net/en/events/2026-10-promotion'
    );
  });
});

describe("buildFollowupDigestText — '오늘 연락할 손님' 요약", () => {
  const item = (over: Partial<FollowupDigestItem> = {}): FollowupDigestItem => ({
    visitorName: 'Li Wei',
    visitorLocale: 'zh',
    contactLabel: 'WeChat',
    awaitingSince: '2026-10-01T00:26:00Z',
    channelId: 'C0ROOM1',
    adminUrl: null,
    ...over,
  });

  it('머리말(인원·전원 멘션) + 손님 줄 + 꼬리말', () => {
    const text = buildFollowupDigestText({
      mentionAll: '<@U1> <@U2>',
      items: [
        item(),
        item({ visitorName: null, visitorLocale: 'en', contactLabel: '이메일', awaitingSince: '2026-10-01T05:03:00Z', channelId: 'C0ROOM2' }),
      ],
    });
    expect(text).toBe(
      '📋 *오늘 연락할 손님 2명* <@U1> <@U2>\n' +
        '• 🇨🇳 Li Wei · WeChat · 10/01(목) 09:26 문의 · <#C0ROOM1>\n' +
        '• 🇬🇧 익명 · 이메일 · 10/01(목) 14:03 문의 · <#C0ROOM2>\n' +
        '_방에 답을 쓰거나 방을 보관(완료)하면 목록에서 빠집니다._'
    );
  });

  it('방이 없는 손님(스레드 방식)은 관리자 화면 링크', () => {
    const text = buildFollowupDigestText({
      mentionAll: '',
      items: [item({ channelId: null, adminUrl: 'https://liv-clinic.net/admin/chat/abc' })],
    });
    expect(text.split('\n')[0]).toBe('📋 *오늘 연락할 손님 1명*');
    expect(text.split('\n')[1]).toBe(
      '• 🇨🇳 Li Wei · WeChat · 10/01(목) 09:26 문의 · <https://liv-clinic.net/admin/chat/abc|관리자 화면>'
    );
  });

  it('20명을 넘으면 "외 N명"', () => {
    const items = Array.from({ length: FOLLOWUP_DIGEST_MAX_LINES + 3 }, (_, i) => item({ visitorName: `G${i}` }));
    const lines = buildFollowupDigestText({ mentionAll: '<@U1>', items }).split('\n');
    expect(lines[0]).toBe('📋 *오늘 연락할 손님 23명* <@U1>');
    expect(lines).toHaveLength(1 + FOLLOWUP_DIGEST_MAX_LINES + 1 + 1);
    expect(lines[FOLLOWUP_DIGEST_MAX_LINES + 1]).toBe('• 외 3명');
  });

  it('이름의 Slack 마크업을 이스케이프한다', () => {
    expect(buildFollowupDigestText({ mentionAll: '', items: [item({ visitorName: '<!channel>' })] })).not.toContain(
      '<!channel>'
    );
  });
});
```

(3) `describe('buildRoomFirstText — 방의 첫 메시지', …)` 안, 마지막 테스트(`멘션 대상이 없어도 구분자가 남지 않는다`) 뒤에 아래 3건을 더한다:

<!-- plan-check: contains liv-clinic/src/lib/chat/__tests__/slackText.test.ts -->
```ts
  it('자동 안내 꼬리말은 접수 안내가 나갔다고 알린다', () => {
    expect(ROOM_AUTO_ACK_NOTE).toBe(
      '_손님에게는 접수 안내(예상 시간·연락처 요청·시술과 방문일 질문)가 자동으로 나갔습니다._'
    );
  });

  it('시작 화면에서 이메일을 넣은 손님이면 꼬리말을 한 줄 더 붙인다', () => {
    const text = buildRoomFirstText({ ...base, mentionAll: '<@U1>', contactNote: ROOM_EMAIL_CONTACT_NOTE });
    expect(text.endsWith(`${ROOM_FOOTER}\n${ROOM_AUTO_ACK_NOTE}\n${ROOM_EMAIL_CONTACT_NOTE}`)).toBe(true);
    expect(ROOM_EMAIL_CONTACT_NOTE).toBe(
      "_이메일을 남긴 손님입니다 — '오늘 연락할 손님'으로 관리되며 재촉 알림은 울리지 않습니다. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다._"
    );
  });

  it('연락처 꼬리말이 null이면 붙이지 않는다', () => {
    const text = buildRoomFirstText({ ...base, mentionAll: '<@U1>', contactNote: null });
    expect(text.endsWith(`${ROOM_FOOTER}\n${ROOM_AUTO_ACK_NOTE}`)).toBe(true);
  });
```

(4) `describe('buildFeedLine — #해외문의 피드', …)` 안, 마지막 테스트(`이름의 Slack 마크업을 이스케이프한다`) 뒤에 아래 1건을 더한다:

<!-- plan-check: contains liv-clinic/src/lib/chat/__tests__/slackText.test.ts -->
```ts
  it('연락처 남김 (채널 이름과 방 링크)', () => {
    expect(
      buildFeedLine({
        kind: 'contact',
        visitorName: 'Li Wei',
        visitorLocale: 'zh',
        channelId: 'C9',
        at: '2026-10-01T05:03:00Z',
        contactLabel: 'WeChat',
      })
    ).toBe('📋 연락처 남김 · 🇨🇳 Li Wei · WeChat · <#C9> · 10/01(목) 14:03 KST');
  });
```

- [ ] **Step 3: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/slackText.test.ts`
Expected: FAIL — `staffChannelLabel is not a function`, `buildMessengerClickText is not a function` 등, 그리고 `buildContactText`·`ROOM_AUTO_ACK_NOTE`의 문구 불일치.

- [ ] **Step 4: Slack 문구 구현**

`liv-clinic/src/lib/chat/slackText.ts` 를 아래 내용으로 교체한다. 바뀌는 것: `staffChannelLabel`·`buildMessengerClickText`·`buildTranslationCopyText`·`buildEventHintNote`·`buildFollowupDigestText`·`ROOM_EMAIL_CONTACT_NOTE` 추가, `buildContactText`·`ROOM_AUTO_ACK_NOTE` 문구 교체, `buildRoomFirstText`에 `contactNote`, `buildFeedLine`에 `contact` 종류. 나머지 함수는 글자 하나도 바뀌지 않는다.

<!-- plan-check: full liv-clinic/src/lib/chat/slackText.ts -->
```ts
import 'server-only';
import { escapeSlackText } from '@/lib/chat/slack';
import { formatKst, formatKstTime } from '@/lib/chat/kst';
import { buildChatRefCode, CONTACT_CHANNEL_LABELS, type ContactChannel } from '@/lib/chat/contactChannels';
import { CHAT_CONTACT_EMAIL } from '@/lib/constants';

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

/** 직원에게 보이는 채널 이름 — 이메일만 한국어, 메신저는 브랜드명. 모르는 값은 그대로 둔다. */
export function staffChannelLabel(channel: string | null | undefined): string {
  if (!channel) return '';
  if (channel === 'email') return '이메일';
  return CONTACT_CHANNEL_LABELS[channel as ContactChannel] ?? channel;
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

/** 연락처 알림이 올라가는 곳: 손님 방 / #해외문의 스레드 / 붙일 곳이 없어 #해외문의에 단독 게시. */
export type ContactNoticeMode = 'room' | 'thread' | 'standalone';

const FOLLOWUP_CLASSIFIED_NOTE = "_'오늘 연락할 손님'으로 분류했습니다. 5·12·30분 알림은 울리지 않습니다._";

/**
 * 손님이 연락처를 남겼을 때 올리는 글 (스펙 2026-10-01 §4.5 b).
 * - followup=false(CHAT_FOLLOWUP=off): '오늘 연락할 손님' 안내를 붙이지 않는다 — 알림이 계속 울리고 번역본도 올라오지 않기 때문이다.
 * - 번역본은 방에만 올라오므로 그 안내는 mode='room'에만 붙인다.
 */
export function buildContactText(args: {
  channelLabel: string;
  handle: string;
  mode: ContactNoticeMode;
  followup: boolean;
  /** 단독 게시(mode='standalone')일 때 붙이는 관리자 화면 주소 */
  adminUrl: string | null;
}): string {
  const lines = [`📱 *손님이 연락처를 남겼습니다* — ${args.channelLabel}: ${escapeSlackText(args.handle)}`];
  if (!args.followup) {
    lines.push('_이 연락처로 먼저 연락해 주세요._');
  } else if (args.mode === 'room') {
    lines.push(
      FOLLOWUP_CLASSIFIED_NOTE,
      '_이 방에 한국어로 답을 쓰면 바로 아래에 번역본이 올라옵니다. 복사해서 위챗·왓츠앱·메일에 붙여 넣으세요._',
      '_방에 답을 쓰면 목록에서 빠집니다. 상담이 끝나면 방을 보관(완료)해 주세요._'
    );
  } else if (args.mode === 'thread') {
    lines.push(FOLLOWUP_CLASSIFIED_NOTE, '_이 스레드에 답글을 쓰면 목록에서 빠집니다._');
  } else {
    lines.push(FOLLOWUP_CLASSIFIED_NOTE, '_관리자 화면에서 답하면 목록에서 빠집니다._');
  }
  if (args.mode === 'standalone' && args.adminUrl) {
    lines.push(`🔗 <${args.adminUrl}|관리자 화면에서 열기>`);
  }
  return lines.join('\n');
}

/**
 * 손님이 카드에서 병원 연락 단추를 눌렀을 때 방/스레드에 올리는 한 줄 (§4.5 b).
 * copyHint = 번역본이 이 방에 올라오는 경우(방 모드 + CHAT_FOLLOWUP 켜짐)에만 그 안내를 붙인다.
 */
export function buildMessengerClickText(args: {
  channel: ContactChannel;
  sessionId: string;
  copyHint: boolean;
}): string {
  const code = `#${buildChatRefCode(args.sessionId)}`;
  let body: string;
  if (args.channel === 'wechat') {
    body = `📲 손님이 병원 WeChat 아이디·QR을 확인했습니다 — 업무폰 WeChat에서 친구 요청과 코드 ${code} 메시지를 확인해 주세요.`;
  } else if (args.channel === 'email') {
    body = `📲 손님이 병원 이메일 주소를 확인했습니다 — ${CHAT_CONTACT_EMAIL} 메일함에서 코드 ${code} 가 담긴 메일을 확인해 주세요.`;
  } else {
    const label = CONTACT_CHANNEL_LABELS[args.channel];
    body = `📲 손님이 ${label}으로 이어가기를 눌렀습니다 — 병원 ${label}에서 코드 ${code} 가 담긴 메시지를 확인해 주세요.`;
  }
  return args.copyHint ? `${body} 이 방에 답을 쓰면 번역본이 아래에 올라옵니다.` : body;
}

/** 직원 답글의 번역본 — 번역문만 담는다. 휴대폰 Slack의 "텍스트 복사"가 메시지 전체를 복사하므로 머리말·꾸밈을 붙이지 않는다 (§4.5 d). */
export function buildTranslationCopyText(translated: string): string {
  return escapeSlackText(translated);
}

/** 가격 문의에 이벤트 링크가 자동으로 나갔음을 직원에게 알린다 (§4.10). */
export function buildEventHintNote(url: string): string {
  return ['🎁 _가격 문의로 보여 손님에게 이벤트 링크를 자동으로 보냈습니다. 가격은 직접 답해 주세요._', url].join('\n');
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
  '_손님에게는 접수 안내(예상 시간·연락처 요청·시술과 방문일 질문)가 자동으로 나갔습니다._';
/** 시작 화면에서 이메일을 넣은 손님의 방 첫 메시지에 붙이는 꼬리말 (§4.5 b). */
export const ROOM_EMAIL_CONTACT_NOTE =
  "_이메일을 남긴 손님입니다 — '오늘 연락할 손님'으로 관리되며 재촉 알림은 울리지 않습니다. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다._";

function joinHead(parts: Array<string | null | undefined>): string {
  return parts.filter((p): p is string => Boolean(p && p.length > 0)).join(' · ');
}

/** 방의 첫 메시지(손님 첫 발신): 전원 멘션 + 접수 시각 + 본문 + 꼬리말 2줄 (+ 연락처 꼬리말) */
export function buildRoomFirstText(args: {
  mentionAll: string;
  receivedAt: string;
  visitorLocale: string;
  originalText: string;
  translatedText: string | null;
  /** 연락처가 이미 있는 손님이면 ROOM_EMAIL_CONTACT_NOTE */
  contactNote?: string | null;
}): string {
  const head = joinHead(['🔴 *새 문의*', args.mentionAll, `📥 ${formatKst(args.receivedAt)}`]);
  const lines = [
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
  ];
  if (args.contactNote) lines.push(args.contactNote);
  return lines.join('\n');
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

export type FeedKind = 'new' | 'resolved' | 'closed' | 'reopened' | 'escalated' | 'contact';

export function buildFeedLine(args: {
  kind: FeedKind;
  visitorName: string | null;
  visitorLocale: string;
  channelId: string | null;
  at: string;
  assignedLabel?: string | null;
  minutes?: number;
  /** kind='contact'일 때 남긴 채널 이름 (WeChat, 이메일 …) */
  contactLabel?: string | null;
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
    case 'contact':
      return joinHead(['📋 연락처 남김', `${localeFlag(args.visitorLocale)} ${name}`, args.contactLabel, link, when]);
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
  session_not_found: '이 스레드는 상담과 연결돼 있지 않습니다. 사이드바의 손님 방(chat-…) 본문에 답해 주세요',
  empty_text: '내용이 비어 있습니다',
  error: '서버 오류가 났습니다. 관리자 화면에서 다시 보내 주세요',
};

export function buildDeliveryFailureText(reason: string): string {
  return `⚠️ 방금 답글이 손님에게 전달되지 않았습니다 · 사유: ${FAILURE_REASON_KO[reason] ?? escapeSlackText(reason)}`;
}

// ── "오늘 연락할 손님" 하루 두 번 요약 (스펙 2026-10-01 §4.5 c) ────────────────

export interface FollowupDigestItem {
  visitorName: string | null;
  visitorLocale: string;
  /** 'WeChat', '이메일' 등. 여러 개면 ', '로 이은 것 */
  contactLabel: string;
  /** 손님이 답을 기다리기 시작한 시각 (chat_sessions.awaiting_since) */
  awaitingSince: string;
  /** 방 채널 ID. 방이 없으면(스레드 방식) null */
  channelId: string | null;
  /** 방이 없을 때 대신 붙이는 관리자 화면 주소 */
  adminUrl: string | null;
}

/** 요약 한 번에 이름을 적는 최대 인원 — 넘으면 "외 N명". */
export const FOLLOWUP_DIGEST_MAX_LINES = 20;

export function buildFollowupDigestText(args: { mentionAll: string; items: FollowupDigestItem[] }): string {
  const head = [`📋 *오늘 연락할 손님 ${args.items.length}명*`, args.mentionAll].filter(Boolean).join(' ');
  const lines = args.items.slice(0, FOLLOWUP_DIGEST_MAX_LINES).map((it) => {
    const where = it.channelId ? `<#${it.channelId}>` : it.adminUrl ? `<${it.adminUrl}|관리자 화면>` : null;
    const when = `${formatKst(it.awaitingSince).replace(/ KST$/, '')} 문의`;
    const who = `${localeFlag(it.visitorLocale)} ${escapeSlackText(it.visitorName || '익명')}`;
    return `• ${joinHead([who, it.contactLabel, when, where])}`;
  });
  const rest = args.items.length - lines.length;
  if (rest > 0) lines.push(`• 외 ${rest}명`);
  return [head, ...lines, '_방에 답을 쓰거나 방을 보관(완료)하면 목록에서 빠집니다._'].join('\n');
}

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

- [ ] **Step 5: Slack 문구 통과 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/slackText.test.ts`
Expected: PASS — 59건

- [ ] **Step 6: 릴레이 테스트 추가 (실패하는 상태로)**

`liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts`:

(1) `vi.mock('../slack', …)` 블록 **뒤**의 import 4줄(`import { createChatAdminClient } from '../db';` ~ `import { fakeAdmin, hasFilter, type FakeOp } from './fakeAdmin';`)을 아래로 바꾼다(`ensureRoom` 목 추가 포함):

<!-- plan-check: contains liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts -->
```ts
vi.mock('../slackRooms', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../slackRooms')>()),
  ensureRoom: vi.fn(),
}));

import { createChatAdminClient } from '../db';
import { fetchThreadParent, getBotUserId, postSlackMessage } from '../slack';
import { ensureRoom } from '../slackRooms';
import { translate } from '../translation';
import {
  relayChatMessageToSlack,
  relayContactToSlack,
  relayEventHintNoteToSlack,
  relayMessengerClickToSlack,
  relaySlackReplyToVisitor,
  resolveTarget,
} from '../slackRelay';
import { ROOM_EMAIL_CONTACT_NOTE } from '../slackText';
import { fakeAdmin, hasFilter, type FakeOp } from './fakeAdmin';
```

(2) 파일 **맨 끝**에 아래를 덧붙인다(describe 4개, 테스트 25건):

<!-- plan-check: contains liv-clinic/src/lib/chat/__tests__/slackRelay.test.ts -->
```ts
// ── "연락처 먼저" 1단계 (스펙 2026-10-01) ───────────────────────────────────

const SESSION_ID = '5b0c7c1a-07c0-49bc-91da-2f556884b769';
const ROOM_ROW = {
  id: SESSION_ID,
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
const THREAD_TS = '1788966626.694829';
const THREAD_ROW = { ...ROOM_ROW, slack_mode: 'thread', slack_channel_id: 'C0FEED', slack_thread_ts: THREAD_TS };
const UNASSIGNED_ROW = { ...ROOM_ROW, slack_mode: null, slack_channel_id: null };

function setSlackEnv() {
  process.env.SLACK_BOT_TOKEN = 'xoxb-test';
  process.env.SLACK_CHANNEL_ID = 'C0FEED';
}
function clearSlackEnv() {
  delete process.env.SLACK_BOT_TOKEN;
  delete process.env.SLACK_CHANNEL_ID;
  delete process.env.CHAT_FOLLOWUP;
  delete process.env.NEXT_PUBLIC_SITE_URL;
}

describe('relaySlackReplyToVisitor — 연락 수단이 있는 손님의 방에 번역본 게시', () => {
  const postMock = vi.mocked(postSlackMessage);
  const adminMock = vi.mocked(createChatAdminClient);
  const parentMock = vi.mocked(fetchThreadParent);
  const translateMock = vi.mocked(translate);

  type Means = { visitor_email: string | null; visitor_messenger_handle: string | null; visitor_messenger_clicked: string | null };
  const NONE: Means = { visitor_email: null, visitor_messenger_handle: null, visitor_messenger_clicked: null };

  /** 연락 수단 조회(visitor_messenger_clicked 를 읽는 조회)만 따로 답하는 가짜 DB. */
  function adminFor(means: Means | 'lookup_error', row: typeof ROOM_ROW | typeof THREAD_ROW = ROOM_ROW) {
    const admin = fakeAdmin((op: FakeOp) => {
      if (op.table === 'chat_sessions' && op.op === 'select') {
        if (op.columns?.includes('visitor_messenger_clicked')) {
          return means === 'lookup_error' ? { error: { code: '42703' } } : { data: means };
        }
        if (hasFilter(op, 'slack_channel_id', 'C0ROOM')) return { data: row.slack_mode === 'room' ? row : null };
        if (hasFilter(op, 'slack_thread_ts', THREAD_TS)) return { data: row.slack_mode === 'thread' ? row : null };
        return { data: null };
      }
      if (op.table === 'chat_messages' && op.op === 'insert') return { data: { id: 'm-new' } };
      if (op.op === 'update') return { data: [{ id: row.id }] };
      return { data: null };
    });
    adminMock.mockReturnValue(admin as never);
    return admin;
  }

  const ROOM_REPLY = {
    channel: 'C0ROOM',
    slackTs: '3.0',
    threadTs: null,
    isTopLevel: true,
    isBroadcast: false,
    text: '안녕하세요, 100만원입니다.',
    slackUserId: 'U0AAA',
  };
  const FEED_REPLY = { ...ROOM_REPLY, channel: 'C0FEED', slackTs: '1788999999.000100', threadTs: THREAD_TS, isTopLevel: false };

  beforeEach(() => {
    setSlackEnv();
    postMock.mockReset();
    parentMock.mockReset();
    vi.mocked(getBotUserId).mockReset();
    vi.mocked(getBotUserId).mockResolvedValue('U0BOT');
    postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0ROOM' });
  });
  afterEach(clearSlackEnv);

  it('이메일을 남긴 손님의 방: 전달 뒤 번역문만 담은 글을 한 번 올린다', async () => {
    adminFor({ ...NONE, visitor_email: 'guest@example.com' });
    expect(await relaySlackReplyToVisitor(ROOM_REPLY)).toBe('delivered');
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toEqual({ text: '翻译', channelId: 'C0ROOM' });
  });

  it('메신저 연락처를 남겼거나 카드 단추만 누른 손님도 대상이다', async () => {
    adminFor({ ...NONE, visitor_messenger_handle: 'liwei88' });
    await relaySlackReplyToVisitor(ROOM_REPLY);
    expect(postMock).toHaveBeenCalledTimes(1);

    postMock.mockClear();
    adminFor({ ...NONE, visitor_messenger_clicked: 'whatsapp' });
    await relaySlackReplyToVisitor(ROOM_REPLY);
    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it('연락 수단이 없는 손님의 방에는 올리지 않는다', async () => {
    adminFor(NONE);
    expect(await relaySlackReplyToVisitor(ROOM_REPLY)).toBe('delivered');
    expect(postMock).not.toHaveBeenCalled();
  });

  it('번역이 실패했으면 올리지 않는다', async () => {
    adminFor({ ...NONE, visitor_email: 'guest@example.com' });
    translateMock.mockResolvedValueOnce({ status: 'failed', text: ROOM_REPLY.text, latencyMs: 1, errorCode: 'api_error' });
    expect(await relaySlackReplyToVisitor(ROOM_REPLY)).toBe('delivered');
    expect(postMock).not.toHaveBeenCalled();
  });

  it('번역이 생략됐거나(이모지·URL만) 번역문이 원문과 같으면 올리지 않는다', async () => {
    adminFor({ ...NONE, visitor_email: 'guest@example.com' });
    translateMock.mockResolvedValueOnce({ status: 'skipped', text: ROOM_REPLY.text, latencyMs: 0 });
    await relaySlackReplyToVisitor(ROOM_REPLY);
    translateMock.mockResolvedValueOnce({ status: 'success', text: ` ${ROOM_REPLY.text} `, latencyMs: 1 });
    await relaySlackReplyToVisitor(ROOM_REPLY);
    expect(postMock).not.toHaveBeenCalled();
  });

  it('스레드 모드 세션에는 올리지 않는다', async () => {
    adminFor({ ...NONE, visitor_email: 'guest@example.com' }, THREAD_ROW);
    expect(await relaySlackReplyToVisitor(FEED_REPLY)).toBe('delivered');
    expect(postMock).not.toHaveBeenCalled();
  });

  it('CHAT_FOLLOWUP=off 면 올리지 않는다 (연락 수단 조회도 하지 않는다)', async () => {
    process.env.CHAT_FOLLOWUP = 'off';
    const admin = adminFor({ ...NONE, visitor_email: 'guest@example.com' });
    expect(await relaySlackReplyToVisitor(ROOM_REPLY)).toBe('delivered');
    expect(postMock).not.toHaveBeenCalled();
    expect(admin.ops.some((o) => o.columns?.includes('visitor_messenger_clicked'))).toBe(false);
  });

  it('연락 수단 조회가 실패해도(042 미적용) 답글 전달은 delivered', async () => {
    adminFor('lookup_error');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await relaySlackReplyToVisitor(ROOM_REPLY)).toBe('delivered');
    expect(postMock).not.toHaveBeenCalled();
    expect(warn.mock.calls.some((c) => String(c[0]).includes('contact means lookup failed'))).toBe(true);
    warn.mockRestore();
  });

  it('번역본 게시가 실패해도 delivered', async () => {
    adminFor({ ...NONE, visitor_email: 'guest@example.com' });
    postMock.mockResolvedValue({ ok: false, error: 'is_archived' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await relaySlackReplyToVisitor(ROOM_REPLY)).toBe('delivered');
    expect(warn.mock.calls.some((c) => String(c[0]).includes('translation copy failed'))).toBe(true);
    warn.mockRestore();
  });

  it('피드 스레드 답장은 방 복사 뒤에 번역본을 올린다', async () => {
    const admin = fakeAdmin((op: FakeOp) => {
      if (op.table === 'chat_sessions' && op.op === 'select') {
        if (op.columns?.includes('visitor_messenger_clicked')) {
          return { data: { ...NONE, visitor_messenger_handle: 'liwei88' } };
        }
        if (hasFilter(op, 'slack_channel_id', 'C0ROOM')) return { data: ROOM_ROW };
        return { data: null };
      }
      if (op.table === 'chat_messages' && op.op === 'insert') return { data: { id: 'm-new' } };
      if (op.op === 'update') return { data: [{ id: SESSION_ID }] };
      return { data: null };
    });
    adminMock.mockReturnValue(admin as never);
    parentMock.mockResolvedValue({
      ok: true,
      data: { text: '🔴 새 문의 · <#C0ROOM>', botId: 'B1', userId: 'U0BOT' },
    });

    expect(await relaySlackReplyToVisitor(FEED_REPLY)).toBe('delivered');
    expect(postMock).toHaveBeenCalledTimes(2);
    expect(postMock.mock.calls[0][0].text).toContain('피드에서 답함');
    expect(postMock.mock.calls[1][0]).toEqual({ text: '翻译', channelId: 'C0ROOM' });
  });
});

describe('relayContactToSlack — 연락처 알림', () => {
  const postMock = vi.mocked(postSlackMessage);
  const adminMock = vi.mocked(createChatAdminClient);

  function adminFor(row: Record<string, unknown>) {
    const admin = fakeAdmin((op: FakeOp) =>
      op.table === 'chat_sessions' && op.op === 'select' && hasFilter(op, 'id', SESSION_ID) ? { data: row } : { data: null }
    );
    adminMock.mockReturnValue(admin as never);
  }

  beforeEach(() => {
    setSlackEnv();
    postMock.mockReset();
    postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0ROOM' });
  });
  afterEach(clearSlackEnv);

  it('방: 분류 안내가 담긴 글을 방에, 피드에 "연락처 남김" 한 줄', async () => {
    adminFor(ROOM_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'email', handle: 'guest@example.com' });

    expect(postMock).toHaveBeenCalledTimes(2);
    const room = postMock.mock.calls[0][0];
    expect(room.channelId).toBe('C0ROOM');
    expect(room.text.split('\n')[0]).toBe('📱 *손님이 연락처를 남겼습니다* — 이메일: guest@example.com');
    expect(room.text).toContain("'오늘 연락할 손님'으로 분류했습니다");
    expect(room.text).toContain('번역본이 올라옵니다');
    const feed = postMock.mock.calls[1][0];
    expect(feed.channelId).toBe('C0FEED');
    expect(feed.text.startsWith('📋 연락처 남김 · 🇨🇳 익명 · 이메일 · <#C0ROOM> · ')).toBe(true);
  });

  it('메신저 채널은 브랜드명으로 적는다', async () => {
    adminFor(ROOM_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'wechat', handle: 'liwei88' });
    expect(postMock.mock.calls[0][0].text.split('\n')[0]).toBe('📱 *손님이 연락처를 남겼습니다* — WeChat: liwei88');
  });

  it('스레드: 대표 스레드에 올리고 번역본 안내와 피드 줄은 없다', async () => {
    adminFor(THREAD_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'whatsapp', handle: '+82 10-1234-5678' });

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0FEED', threadTs: THREAD_TS });
    expect(postMock.mock.calls[0][0].text).not.toContain('번역본');
    expect(postMock.mock.calls[0][0].text).toContain('이 스레드에 답글을 쓰면 목록에서 빠집니다');
  });

  it('방도 스레드도 없으면 관리자 화면 링크를 붙여 단독 게시한다', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://liv-clinic.net';
    adminFor(UNASSIGNED_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'email', handle: 'guest@example.com' });

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0].threadTs).toBeUndefined();
    expect(postMock.mock.calls[0][0].text).toContain(`🔗 <https://liv-clinic.net/admin/chat/${SESSION_ID}|관리자 화면에서 열기>`);
  });

  it('CHAT_FOLLOWUP=off 면 분류 안내 대신 연락 요청만 남긴다', async () => {
    process.env.CHAT_FOLLOWUP = 'off';
    adminFor(ROOM_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'email', handle: 'guest@example.com' });
    expect(postMock.mock.calls[0][0].text).toBe(
      '📱 *손님이 연락처를 남겼습니다* — 이메일: guest@example.com\n_이 연락처로 먼저 연락해 주세요._'
    );
  });

  it('Slack 설정이 없으면 아무것도 하지 않는다', async () => {
    delete process.env.SLACK_BOT_TOKEN;
    adminFor(ROOM_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'email', handle: 'guest@example.com' });
    expect(postMock).not.toHaveBeenCalled();
  });
});

describe('relayMessengerClickToSlack · relayEventHintNoteToSlack — 방에 한 줄', () => {
  const postMock = vi.mocked(postSlackMessage);
  const adminMock = vi.mocked(createChatAdminClient);

  function adminFor(row: Record<string, unknown>) {
    const admin = fakeAdmin((op: FakeOp) =>
      op.table === 'chat_sessions' && op.op === 'select' && hasFilter(op, 'id', SESSION_ID) ? { data: row } : { data: null }
    );
    adminMock.mockReturnValue(admin as never);
  }

  beforeEach(() => {
    setSlackEnv();
    postMock.mockReset();
    postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0ROOM' });
  });
  afterEach(clearSlackEnv);

  it('단추 클릭: 방에 📲 한 줄 (번역본 안내 포함)', async () => {
    adminFor(ROOM_ROW);
    await relayMessengerClickToSlack({ sessionId: SESSION_ID, channel: 'whatsapp' });
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0].channelId).toBe('C0ROOM');
    expect(postMock.mock.calls[0][0].text).toBe(
      '📲 손님이 WhatsApp으로 이어가기를 눌렀습니다 — 병원 WhatsApp에서 코드 #5B0C7C1A 가 담긴 메시지를 확인해 주세요. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다.'
    );
  });

  it('단추 클릭: 스레드 모드는 스레드에, 번역본 안내 없이', async () => {
    adminFor(THREAD_ROW);
    await relayMessengerClickToSlack({ sessionId: SESSION_ID, channel: 'line' });
    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0FEED', threadTs: THREAD_TS });
    expect(postMock.mock.calls[0][0].text).not.toContain('번역본');
  });

  it('단추 클릭: 방도 스레드도 없으면 올리지 않는다', async () => {
    adminFor(UNASSIGNED_ROW);
    await relayMessengerClickToSlack({ sessionId: SESSION_ID, channel: 'email' });
    expect(postMock).not.toHaveBeenCalled();
  });

  it('이벤트 안내: 방에 🎁 한 줄과 링크', async () => {
    adminFor(ROOM_ROW);
    const url = 'https://liv-clinic.net/zh/events/2026-10-promotion';
    await relayEventHintNoteToSlack({ sessionId: SESSION_ID, url });
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toEqual({
      text: `🎁 _가격 문의로 보여 손님에게 이벤트 링크를 자동으로 보냈습니다. 가격은 직접 답해 주세요._\n${url}`,
      channelId: 'C0ROOM',
    });
  });

  it('이벤트 안내: 스레드 모드는 스레드에, 방도 스레드도 없으면 올리지 않는다', async () => {
    adminFor(THREAD_ROW);
    await relayEventHintNoteToSlack({ sessionId: SESSION_ID, url: 'https://liv-clinic.net/en/events' });
    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0FEED', threadTs: THREAD_TS });

    postMock.mockClear();
    adminFor(UNASSIGNED_ROW);
    await relayEventHintNoteToSlack({ sessionId: SESSION_ID, url: 'https://liv-clinic.net/en/events' });
    expect(postMock).not.toHaveBeenCalled();
  });
});

describe('relayChatMessageToSlack — 방 첫 메시지의 연락처 꼬리말', () => {
  const postMock = vi.mocked(postSlackMessage);
  const adminMock = vi.mocked(createChatAdminClient);
  const ensureRoomMock = vi.mocked(ensureRoom);

  function adminFor(row: Record<string, unknown>) {
    const admin = fakeAdmin((op: FakeOp) => {
      if (op.table === 'chat_sessions' && op.op === 'select' && hasFilter(op, 'id', SESSION_ID)) return { data: row };
      if (op.op === 'update') return { data: [{ id: SESSION_ID }] };
      return { data: null };
    });
    adminMock.mockReturnValue(admin as never);
  }

  const FIRST = {
    sessionId: SESSION_ID,
    messageId: 'm-1',
    sender: 'visitor' as const,
    originalText: 'How much is Ulthera?',
    translatedText: '울쎄라 얼마인가요?',
    receivedAt: '2026-10-05T03:00:00Z',
  };

  beforeEach(() => {
    setSlackEnv();
    postMock.mockReset();
    postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0NEW' });
    ensureRoomMock.mockReset();
    ensureRoomMock.mockResolvedValue({ mode: 'room', channelId: 'C0NEW', created: true });
  });
  afterEach(clearSlackEnv);

  it('시작 화면에서 이메일을 넣은 손님: 첫 메시지 끝에 꼬리말이 붙는다', async () => {
    adminFor({ ...UNASSIGNED_ROW, visitor_email: 'guest@example.com' });
    await relayChatMessageToSlack(FIRST);
    expect(postMock.mock.calls[0][0].channelId).toBe('C0NEW');
    expect(postMock.mock.calls[0][0].text.endsWith(ROOM_EMAIL_CONTACT_NOTE)).toBe(true);
  });

  it('이메일이 없는 손님에게는 붙지 않는다', async () => {
    adminFor(UNASSIGNED_ROW);
    await relayChatMessageToSlack(FIRST);
    expect(postMock.mock.calls[0][0].text).not.toContain('이메일을 남긴 손님입니다');
  });

  it('이 글에서 방금 이메일이 저장됐으면(📱 알림이 뒤따른다) 붙이지 않는다', async () => {
    adminFor({ ...UNASSIGNED_ROW, visitor_email: 'guest@example.com' });
    await relayChatMessageToSlack({ ...FIRST, contactJustSaved: true });
    expect(postMock.mock.calls[0][0].text).not.toContain('이메일을 남긴 손님입니다');
  });

  it('CHAT_FOLLOWUP=off 면 붙이지 않는다', async () => {
    process.env.CHAT_FOLLOWUP = 'off';
    adminFor({ ...UNASSIGNED_ROW, visitor_email: 'guest@example.com' });
    await relayChatMessageToSlack(FIRST);
    expect(postMock.mock.calls[0][0].text).not.toContain('이메일을 남긴 손님입니다');
  });
});
```

- [ ] **Step 7: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/slackRelay.test.ts`
Expected: FAIL — `relayMessengerClickToSlack`·`relayEventHintNoteToSlack`가 export 되지 않아 `is not a function`, 번역본 게시 테스트는 `expected "spy" to be called 1 times, but got 0 times`. 기존 14건은 통과한다.

- [ ] **Step 8: 릴레이 구현 — import·인자·방 첫 메시지 꼬리말**

`liv-clinic/src/lib/chat/slackRelay.ts` 에 아래 다섯 군데를 적용한다:

<!-- plan-check: added liv-clinic/src/lib/chat/slackRelay.ts -->
```diff
--- a/src/lib/chat/slackRelay.ts
+++ b/src/lib/chat/slackRelay.ts
@@ -1,8 +1,10 @@
 import 'server-only';
 import { createChatAdminClient, type ChatAdminClient } from '@/lib/chat/db';
 import { broadcastToSession } from '@/lib/chat/broadcast';
-import { translate } from '@/lib/chat/translation';
+import { translate, type TranslationResult } from '@/lib/chat/translation';
 import type { VisitorLocale } from '@/lib/chat/serverI18n';
+import { isFollowupEnabled } from '@/lib/chat/chatFlags';
+import type { ContactChannel } from '@/lib/chat/contactChannels';
 import {
   _internals,
   archiveChannel,
@@ -13,6 +15,7 @@ import {
   postSlackMessage,
   slackTextToPlain,
   unarchiveChannel,
+  type PostMessageResult,
 } from '@/lib/chat/slack';
 import { loadStaffDirectory, mentionOf, resolveStaffLabel, type StaffDirectory } from '@/lib/chat/slackStaff';
 import { ensureRoom, roomPrefix, type RoomDeps } from '@/lib/chat/slackRooms';
@@ -21,13 +24,18 @@ import {
   adminSessionUrl,
   buildContactText,
   buildDeliveryFailureText,
+  buildEventHintNote,
   buildFeedLine,
   buildFeedReplyMirrorText,
+  buildMessengerClickText,
   buildReplyText,
   buildRoomFirstText,
   buildRoomVisitorText,
   buildRootText,
+  buildTranslationCopyText,
   extractRoomChannelFromFeedText,
+  ROOM_EMAIL_CONTACT_NOTE,
+  staffChannelLabel,
   type RelaySender,
   type RoomSessionInfo,
 } from '@/lib/chat/slackText';
@@ -198,6 +206,8 @@ export interface RelayOutboundArgs {
   senderLabel?: string | null;
   /** chat_messages.created_at — KST 접수 시각 표기용. 없으면 지금. */
   receivedAt?: string;
+  /** 이 글에서 방금 이메일이 저장돼 📱 연락처 알림이 바로 뒤따른다 → 방 첫 메시지의 연락처 꼬리말은 생략한다. */
+  contactJustSaved?: boolean;
 }
 
 /**
@@ -280,7 +290,12 @@ function roomText(
     originalText: args.originalText,
     translatedText: args.translatedText,
   };
-  if (firstInRoom) return buildRoomFirstText({ mentionAll: staff.mentionAll(), receivedAt, ...body });
+  if (firstInRoom) {
+    // 시작 화면에서 이메일을 넣은 손님 — '오늘 연락할 손님'으로 관리된다는 꼬리말을 붙인다 (스펙 2026-10-01 §4.5 b).
+    const contactNote =
+      session.visitor_email && !args.contactJustSaved && isFollowupEnabled() ? ROOM_EMAIL_CONTACT_NOTE : null;
+    return buildRoomFirstText({ mentionAll: staff.mentionAll(), receivedAt, contactNote, ...body });
+  }
   // 담당자가 있으면 담당자만, 없으면 전원. 관찰자는 mentionAll에 들어 있지 않다.
   // 명단에서 빠진 담당자를 계속 부르지 않도록 지금도 답변 직원인지 확인한다.
   const assignee = session.assigned_slack_user_id;
```

- [ ] **Step 9: 릴레이 구현 — 연락처·클릭·이벤트 안내 알림**

같은 파일에서 기존 `relayContactToSlack` 함수 전체(주석 `/** 방문자가 남긴 메신저 연락처를 세션의 방/스레드에 게시한다. throw-free. */` 부터 그 함수의 닫는 `}` 까지)를 지우고, 그 자리에 아래를 넣는다(`// ── 완료 / 종료 / 재오픈 ↔ 보관 / 해제` 구분선 바로 앞):

<!-- plan-check: contains liv-clinic/src/lib/chat/slackRelay.ts -->
```ts
/** 세션의 방(본문) 또는 대표 스레드에 한 줄을 올린다. 붙일 곳이 없으면 null. */
async function postToSessionTarget(target: SlackTarget, text: string): Promise<PostMessageResult | null> {
  if (target.mode === 'room') return postSlackMessage({ text, channelId: target.channelId });
  if (target.mode === 'thread' && target.threadTs) {
    return postSlackMessage({ text, threadTs: target.threadTs, channelId: target.channelId ?? undefined });
  }
  return null;
}

/**
 * 손님이 남긴 연락처(메신저·이메일)를 세션의 방/스레드에 게시하고, 방이면 #해외문의 피드에도 한 줄 남긴다. throw-free.
 * 카드에서 저장했을 때와 손님 글 속 이메일을 자동 저장했을 때 모두 이 함수를 쓴다 (스펙 2026-10-01 §4.3·§4.5 b).
 */
export async function relayContactToSlack(args: {
  sessionId: string;
  channel: ContactChannel;
  handle: string;
}): Promise<void> {
  if (!isSlackRelayConfigured()) return;
  try {
    const admin = createChatAdminClient();
    const session = await loadSession(admin, args.sessionId);
    if (!session) return;
    const target = resolveTarget(session, getSlackChannelId());
    const channelLabel = staffChannelLabel(args.channel);
    const attached = target.mode === 'room' || (target.mode === 'thread' && Boolean(target.threadTs));
    const text = buildContactText({
      channelLabel,
      handle: args.handle,
      mode: target.mode === 'room' ? 'room' : attached ? 'thread' : 'standalone',
      followup: isFollowupEnabled(),
      adminUrl: adminSessionUrl(args.sessionId),
    });
    // 방도 스레드도 없으면 #해외문의에 관리자 화면 링크를 붙여 단독 게시한다.
    const result =
      (await postToSessionTarget(target, text)) ??
      (await postSlackMessage({
        text,
        channelId: (target.mode === 'thread' ? target.channelId : null) ?? undefined,
      }));
    if (!result.ok) console.warn('[slack relay] contact post failed:', result.error);
    // 피드 줄은 방 모드에서만 — 스레드 모드는 같은 채널(#해외문의)이라 중복이다. 답변 직원이 없으면 새 트래픽을 만들지 않는다.
    if (target.mode === 'room' && (await hasResponders())) {
      await postFeed(
        buildFeedLine({
          kind: 'contact',
          visitorName: session.visitor_name,
          visitorLocale: session.visitor_locale,
          channelId: target.channelId,
          at: new Date().toISOString(),
          contactLabel: channelLabel,
        })
      );
    }
  } catch (e) {
    console.warn('[slack relay] contact relay failed:', e);
  }
}

/** 손님이 카드의 병원 연락 단추(WhatsApp·WeChat·LINE·이메일)를 눌렀음을 방/스레드에 알린다. throw-free. */
export async function relayMessengerClickToSlack(args: { sessionId: string; channel: ContactChannel }): Promise<void> {
  if (!isSlackRelayConfigured()) return;
  try {
    const admin = createChatAdminClient();
    const session = await loadSession(admin, args.sessionId);
    if (!session) return;
    const target = resolveTarget(session, getSlackChannelId());
    const text = buildMessengerClickText({
      channel: args.channel,
      sessionId: args.sessionId,
      copyHint: target.mode === 'room' && isFollowupEnabled(),
    });
    const result = await postToSessionTarget(target, text);
    if (result && !result.ok) console.warn('[slack relay] messenger click post failed:', result.error);
  } catch (e) {
    console.warn('[slack relay] messenger click relay failed:', e);
  }
}

/** 가격 문의에 이벤트 링크가 자동으로 나갔음을 방/스레드에 알린다. 방도 스레드도 없으면 올리지 않는다. throw-free. */
export async function relayEventHintNoteToSlack(args: { sessionId: string; url: string }): Promise<void> {
  if (!isSlackRelayConfigured()) return;
  try {
    const admin = createChatAdminClient();
    const session = await loadSession(admin, args.sessionId);
    if (!session) return;
    const target = resolveTarget(session, getSlackChannelId());
    const result = await postToSessionTarget(target, buildEventHintNote(args.url));
    if (result && !result.ok) console.warn('[slack relay] event hint note failed:', result.error);
  } catch (e) {
    console.warn('[slack relay] event hint note relay failed:', e);
  }
}
```

- [ ] **Step 10: 릴레이 구현 — 번역본 게시**

같은 파일에서 `relaySlackReplyToVisitor` 의 문서 주석(`/**` … `Slack 메시지를 손님 채팅창으로 전달한다.`) **바로 앞**에 아래 함수를 넣는다:

<!-- plan-check: contains liv-clinic/src/lib/chat/slackRelay.ts -->
```ts
/**
 * 직원 답글의 번역본을 방에 올린다 (스펙 2026-10-01 §4.5 d) — 직원이 복사해 위챗·왓츠앱·메일에 붙여 넣는다.
 * 대상: 방 모드이고 연락 수단(이메일·메신저 연락처·카드 단추 클릭)이 하나라도 있는 세션.
 * 번역이 성공했고 번역문이 원문과 다를 때만. 실패는 경고만 — 답글 전달 결과(delivered)에 영향을 주지 않는다.
 */
async function postTranslationCopy(
  admin: ChatAdminClient,
  session: RelaySessionRow,
  original: string,
  translation: TranslationResult
): Promise<void> {
  try {
    if (!isFollowupEnabled()) return;
    if (session.slack_mode !== 'room' || !session.slack_channel_id) return;
    if (translation.status !== 'success') return;
    const translated = translation.text.trim();
    if (!translated || translated === original.trim()) return;
    // 공용 RELAY_SESSION_COLUMNS에 넣지 않고 따로 읽는다 — visitor_messenger_clicked는 042의 새 컬럼이라,
    // 공용 조회에 넣으면 042 적용 전 배포에서 릴레이 전체가 깨진다.
    const { data, error } = await admin
      .from('chat_sessions')
      .select('visitor_email, visitor_messenger_handle, visitor_messenger_clicked')
      .eq('id', session.id)
      .maybeSingle();
    if (error) {
      console.warn('[slack relay] contact means lookup failed:', error.code ?? 'unknown');
      return;
    }
    if (!data || !(data.visitor_email || data.visitor_messenger_handle || data.visitor_messenger_clicked)) return;
    const posted = await postSlackMessage({
      text: buildTranslationCopyText(translated),
      channelId: session.slack_channel_id,
    });
    if (!posted.ok) console.warn('[slack relay] translation copy failed:', posted.error);
  } catch (e) {
    console.warn('[slack relay] translation copy threw:', e);
  }
}
```

그리고 `relaySlackReplyToVisitor` 끝부분에서 호출한다:

<!-- plan-check: added liv-clinic/src/lib/chat/slackRelay.ts -->
```diff
--- a/src/lib/chat/slackRelay.ts
+++ b/src/lib/chat/slackRelay.ts
@@ -707,6 +823,8 @@ export async function relaySlackReplyToVisitor(args: RelayInboundArgs): Promise<
       if (!mirror.ok) console.warn('[slack relay] feed reply mirror failed:', mirror.error);
     }
 
+    await postTranslationCopy(admin, session, plain, translation);
+
     return 'delivered';
   } catch (e) {
     console.error('[slack relay] inbound failed:', e);
```

- [ ] **Step 11: 연락처 라우트의 호출을 새 시그니처에 맞춘다**

`liv-clinic/src/app/api/chat/contact/route.ts` (이 라우트는 Task 6에서 다시 쓴다 — 여기서는 타입 검사가 통과하도록 한 줄만 고친다):

<!-- plan-check: added liv-clinic/src/app/api/chat/contact/route.ts -->
```diff
   after(async () => {
-    await relayContactToSlack({ sessionId: session.id, channelLabel: label, handle });
+    await relayContactToSlack({ sessionId: session.id, channel, handle });
   });
```

- [ ] **Step 12: 통과 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/slackRelay.test.ts src/lib/chat/__tests__/slackText.test.ts`
Expected: PASS — slackRelay 39건, slackText 59건

- [ ] **Step 13: 전체 회귀 + 타입 검사**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run && npx tsc --noEmit`
Expected: 47파일 734건 통과, tsc 출력 없음

- [ ] **Step 14: 커밋**

```bash
git add src/lib/chat/slackText.ts src/lib/chat/slackRelay.ts src/lib/chat/__tests__/fakeAdmin.ts src/lib/chat/__tests__/slackText.test.ts src/lib/chat/__tests__/slackRelay.test.ts src/app/api/chat/contact/route.ts
git commit -m "feat(chat): Slack 알림 — 연락처 분류 안내·단추 클릭·이벤트 안내 알림, 직원 답글 번역본 게시" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: 연락처 저장 서비스와 API

**Files:**
- Create: `liv-clinic/src/lib/chat/contactService.ts`
- Modify: `liv-clinic/src/lib/chat/rateLimit.ts` (`checkContactSaveLimit` 블록)
- Modify: `liv-clinic/src/lib/chat/serverI18n.ts` (`CONTACT_SAVED_TEMPLATES`)
- Modify: `liv-clinic/src/app/api/chat/contact/route.ts` (파일 전체 교체)
- Test: `liv-clinic/src/lib/chat/__tests__/contactService.test.ts`

**Interfaces:**
- Consumes: `extractEmail`, `CONTACT_CHANNEL_LABELS`, `CLINIC_LINK_CHANNELS`, `validateContactHandle`, `ContactChannel` (Task 3); `relayContactToSlack({ sessionId, channel, handle })`, `relayMessengerClickToSlack({ sessionId, channel })` (Task 5); `getContactSavedMessage(locale, channelLabel, handle)` (기존)
- Produces:
  ```ts
  // src/lib/chat/contactService.ts — 세 함수 모두 throw 하지 않는다
  export interface ContactSession { id: string; visitor_locale: string; visitor_email: string | null; visitor_messenger_handle: string | null }
  export type SaveContactResult = { ok: true } | { ok: false; error: 'db_error' };
  export async function saveVisitorContact(admin: ChatAdminClient, session: Pick<ContactSession, 'id' | 'visitor_locale'>, input: { channel: ContactChannel; handle: string }): Promise<SaveContactResult>;
  export async function recordMessengerClick(admin: ChatAdminClient, session: Pick<ContactSession, 'id'>, channel: ContactChannel): Promise<{ ok: boolean }>;
  export interface MessageEmailResult { saved: boolean; hasContact: boolean; email?: string }
  export async function saveEmailFromMessage(admin: ChatAdminClient, session: ContactSession, text: string): Promise<MessageEmailResult>;

  // src/lib/chat/rateLimit.ts
  export function checkContactClickLimit(sessionId: string): RateLimitDecision; // 저장 한도와 통이 다르다

  // POST /api/chat/contact  요청 { sessionToken, channel: 'whatsapp'|'wechat'|'line'|'email', kind?: 'save'|'click', handle? }
  //   save  → 201 { ok: true, hasContact: true }   (400 invalid_input | invalid_handle, 404, 429, 500)
  //   click → 200 { ok: true } 또는 { ok: true, ignored: true }
  ```

- [ ] **Step 1: 실패하는 테스트 작성**

`liv-clinic/src/lib/chat/__tests__/contactService.test.ts` 를 새로 만든다:

<!-- plan-check: full liv-clinic/src/lib/chat/__tests__/contactService.test.ts -->
```ts
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
```

- [ ] **Step 2: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/contactService.test.ts`
Expected: FAIL — `Failed to resolve import "../contactService"`

- [ ] **Step 3: 저장 확인 문구를 영업시간 중에도 맞게 바꾼다**

`liv-clinic/src/lib/chat/serverI18n.ts`:

<!-- plan-check: added liv-clinic/src/lib/chat/serverI18n.ts -->
```diff
--- a/src/lib/chat/serverI18n.ts
+++ b/src/lib/chat/serverI18n.ts
@@ -139,18 +139,19 @@ export function getChatSystemMessage(
 }
 
 // 연락처 저장 확인 — 채널 라벨/핸들 삽입이 필요해 별도 템플릿 테이블.
-// 채널 라벨(WhatsApp 등)은 브랜드명이라 로케일 무관.
+// 채널 라벨(WhatsApp·Email 등)은 로케일 무관.
+// 2026-10-01: 카드가 영업시간 중에도 뜨므로 "영업 재개 후"가 아니라 "최대한 빨리 그쪽으로"로 바꿨다.
 const CONTACT_SAVED_TEMPLATES: Record<VisitorLocale, string> = {
-  en: '{channel} contact saved: {handle}. We will message you first once we are back online.',
-  ja: '{channel}の連絡先を保存しました：{handle}。営業再開後、こちらから先にご連絡いたします。',
-  zh: '已保存您的{channel}联系方式：{handle}。恢复营业后我们会主动联系您。',
-  'zh-TW': '已儲存您的{channel}聯絡方式：{handle}。恢復營業後我們會主動聯絡您。',
-  vi: 'Đã lưu thông tin {channel} của bạn: {handle}. Chúng tôi sẽ chủ động liên hệ ngay khi làm việc trở lại.',
-  th: 'บันทึกข้อมูลติดต่อ {channel} ของคุณแล้ว: {handle} เราจะติดต่อคุณทันทีเมื่อกลับมาทำการ',
-  ru: 'Контакт {channel} сохранён: {handle}. Мы сами свяжемся с вами, как только снова будем онлайн.',
-  fr: 'Contact {channel} enregistré : {handle}. Nous vous contacterons dès notre retour.',
-  mn: '{channel} холбоо барих мэдээлэл хадгалагдлаа: {handle}. Бид ажил эхэлмэгц тантай эхэлж холбогдоно.',
-  ar: 'تم حفظ جهة اتصال {channel}: {handle}. سنتواصل معك أولاً فور عودتنا.',
+  en: "{channel} contact saved: {handle}. We'll reach out to you there as soon as we can.",
+  ja: '{channel}の連絡先を保存しました：{handle}。できるだけ早くそちらへご連絡いたします。',
+  zh: '已保存您的{channel}联系方式：{handle}。我们会尽快通过该方式联系您。',
+  'zh-TW': '已儲存您的{channel}聯絡方式：{handle}。我們會盡快透過該方式與您聯絡。',
+  vi: 'Đã lưu thông tin {channel} của bạn: {handle}. Chúng tôi sẽ liên hệ với bạn qua đó sớm nhất có thể.',
+  th: 'บันทึกข้อมูลติดต่อ {channel} ของคุณแล้ว: {handle} เราจะติดต่อคุณทางนั้นโดยเร็วที่สุด',
+  ru: 'Контакт {channel} сохранён: {handle}. Мы свяжемся с вами там как можно скорее.',
+  fr: 'Contact {channel} enregistré : {handle}. Nous vous y recontacterons dès que possible.',
+  mn: '{channel} холбоо барих мэдээлэл хадгалагдлаа: {handle}. Бид аль болох хурдан тэр хаягаар тантай холбогдоно.',
+  ar: 'تم حفظ جهة اتصال {channel}: {handle}. سنتواصل معك عبرها في أقرب وقت ممكن.',
 };
 
 export function getContactSavedMessage(
```

- [ ] **Step 4: 클릭 알림 한도 추가**

`liv-clinic/src/lib/chat/rateLimit.ts` (저장 한도의 동작은 그대로다 — 같은 로직을 함수로 빼고 클릭용 통을 하나 더 둔다):

<!-- plan-check: added liv-clinic/src/lib/chat/rateLimit.ts -->
```diff
--- a/src/lib/chat/rateLimit.ts
+++ b/src/lib/chat/rateLimit.ts
@@ -94,27 +94,39 @@ export function checkIpSessionDailyLimit(ipHash: string | null): RateLimitDecisi
 
 const CONTACT_SAVES_PER_DAY = Number(process.env.CHAT_RATE_LIMIT_CONTACT_PER_DAY ?? 5);
 const contactDaily = new Map<string, IpDailyBucket>();
+const contactClickDaily = new Map<string, IpDailyBucket>();
 
-// 오프시간 캡처 블록의 연락처 저장 — 세션당 일일 제한 (마지막 값으로 덮어쓰기 허용)
-export function checkContactSaveLimit(sessionId: string): RateLimitDecision {
+function checkContactDaily(map: Map<string, IpDailyBucket>, sessionId: string): RateLimitDecision {
   const dayKey = kstDateKey();
-  const bucket = contactDaily.get(sessionId);
+  const bucket = map.get(sessionId);
   if (!bucket || bucket.dayKey !== dayKey) {
-    contactDaily.set(sessionId, { dayKey, count: 1 });
+    map.set(sessionId, { dayKey, count: 1 });
   } else {
     if (bucket.count >= CONTACT_SAVES_PER_DAY) {
       return { allowed: false, reason: 'contact_daily' };
     }
     bucket.count += 1;
   }
-  trimIfTooLarge(contactDaily);
+  trimIfTooLarge(map);
   return { allowed: true };
 }
 
+// 연락처 저장(카드 저장 + 손님 글 속 이메일 인식) — 세션당 일일 제한 (마지막 값으로 덮어쓰기 허용)
+export function checkContactSaveLimit(sessionId: string): RateLimitDecision {
+  return checkContactDaily(contactDaily, sessionId);
+}
+
+// 카드의 병원 연락 단추 클릭 알림 — 세션당 일일 제한. 저장과 통을 따로 둔다:
+// 단추를 여러 번 눌렀다고 정작 연락처 저장이 막히면 안 된다 (Slack 방에 올라가는 📲 줄만 제한하면 된다).
+export function checkContactClickLimit(sessionId: string): RateLimitDecision {
+  return checkContactDaily(contactClickDaily, sessionId);
+}
+
 // 테스트/개발용 리셋
 export function _resetRateLimitForTesting() {
   sessionMinute.clear();
   sessionTotal.clear();
   ipDaily.clear();
   contactDaily.clear();
+  contactClickDaily.clear();
 }
```

- [ ] **Step 5: 서비스 구현**

`liv-clinic/src/lib/chat/contactService.ts` 를 새로 만든다:

<!-- plan-check: full liv-clinic/src/lib/chat/contactService.ts -->
```ts
import 'server-only';
import type { ChatAdminClient } from '@/lib/chat/db';
import { broadcastToSession } from '@/lib/chat/broadcast';
import { CONTACT_CHANNEL_LABELS, extractEmail, type ContactChannel } from '@/lib/chat/contactChannels';
import { checkContactSaveLimit } from '@/lib/chat/rateLimit';
import { getContactSavedMessage, type VisitorLocale } from '@/lib/chat/serverI18n';

// 손님 연락처 저장 로직 (스펙 2026-10-01 §4.3·§4.4). 라우트(api/chat/contact, api/chat/messages)는 검증·한도·응답만 맡는다.
// 세 함수 모두 throw하지 않고 결과 객체를 돌려준다. Slack 알림은 호출자가 응답 뒤(after)에 보낸다.

export interface ContactSession {
  id: string;
  visitor_locale: string;
  visitor_email: string | null;
  visitor_messenger_handle: string | null;
}

export type SaveContactResult = { ok: true } | { ok: false; error: 'db_error' };

/** 손님 화면에 확인 문구(시스템 메시지)를 남긴다. 실패해도 저장 자체는 성공으로 친다 (세션 생성 라우트와 같은 정책). */
async function confirmToVisitor(
  admin: ChatAdminClient,
  session: Pick<ContactSession, 'id' | 'visitor_locale'>,
  channel: ContactChannel,
  handle: string
): Promise<void> {
  const locale = session.visitor_locale as VisitorLocale;
  const { data: sysMsg, error } = await admin
    .from('chat_messages')
    .insert({
      session_id: session.id,
      sender: 'system',
      original_text: getContactSavedMessage(locale, CONTACT_CHANNEL_LABELS[channel], handle),
      original_lang: locale,
      translation_status: 'skipped',
    })
    .select('id')
    .single();
  if (error || !sysMsg) {
    console.warn('[chat contact] system message insert failed:', error?.code ?? 'unknown');
    return;
  }
  await broadcastToSession(session.id, {
    type: 'message_created',
    payload: { messageId: sysMsg.id, sender: 'system' },
  });
}

/** 연락처 저장: email → visitor_email, 메신저 → visitor_messenger_channel/handle. 그 뒤 손님 화면에 확인 문구. */
export async function saveVisitorContact(
  admin: ChatAdminClient,
  session: Pick<ContactSession, 'id' | 'visitor_locale'>,
  input: { channel: ContactChannel; handle: string }
): Promise<SaveContactResult> {
  try {
    const patch =
      input.channel === 'email'
        ? { visitor_email: input.handle }
        : { visitor_messenger_channel: input.channel, visitor_messenger_handle: input.handle };
    const { error } = await admin.from('chat_sessions').update(patch).eq('id', session.id);
    if (error) {
      console.error('[chat contact] update failed:', error.code ?? 'unknown');
      return { ok: false, error: 'db_error' };
    }
    await confirmToVisitor(admin, session, input.channel, input.handle);
    return { ok: true };
  } catch (e) {
    console.error('[chat contact] save failed:', e);
    return { ok: false, error: 'db_error' };
  }
}

/** 카드의 병원 연락 단추를 눌렀음을 기록한다 — 연락처가 아니며 손님 화면에는 아무것도 남기지 않는다. */
export async function recordMessengerClick(
  admin: ChatAdminClient,
  session: Pick<ContactSession, 'id'>,
  channel: ContactChannel
): Promise<{ ok: boolean }> {
  try {
    const { error } = await admin
      .from('chat_sessions')
      .update({ visitor_messenger_clicked: channel })
      .eq('id', session.id);
    if (error) {
      // 042 적용 전이면 컬럼이 없어 여기로 온다 — 채팅 본 기능에는 영향이 없다.
      console.warn('[chat contact] click record failed:', error.code ?? 'unknown');
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.warn('[chat contact] click record threw:', e);
    return { ok: false };
  }
}

export interface MessageEmailResult {
  /** 이번 글에서 이메일을 새로 저장했는가 */
  saved: boolean;
  /** 처리 뒤 기준으로 연락처(이메일·메신저)가 있는가 */
  hasContact: boolean;
  /** saved=true일 때 저장한 주소 */
  email?: string;
}

/**
 * 손님 글 속 이메일을 연락처로 저장한다 (§4.3). 마지막에 쓴 주소가 이긴다.
 * 이미 같은 주소면 아무것도 하지 않는다. 하루 저장 한도(카드 저장과 공용)를 넘으면 건너뛴다.
 */
export async function saveEmailFromMessage(
  admin: ChatAdminClient,
  session: ContactSession,
  text: string
): Promise<MessageEmailResult> {
  const had = Boolean(session.visitor_email || session.visitor_messenger_handle);
  try {
    const email = extractEmail(text);
    if (!email) return { saved: false, hasContact: had };
    if (session.visitor_email && session.visitor_email.toLowerCase() === email.toLowerCase()) {
      return { saved: false, hasContact: true };
    }
    if (!checkContactSaveLimit(session.id).allowed) return { saved: false, hasContact: had };
    const result = await saveVisitorContact(admin, session, { channel: 'email', handle: email });
    if (!result.ok) return { saved: false, hasContact: had };
    return { saved: true, hasContact: true, email };
  } catch (e) {
    console.warn('[chat contact] email from message failed:', e);
    return { saved: false, hasContact: had };
  }
}
```

- [ ] **Step 6: 통과 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/contactService.test.ts`
Expected: PASS — 14건

- [ ] **Step 7: 라우트 교체**

`liv-clinic/src/app/api/chat/contact/route.ts` 를 아래 내용으로 교체한다(검증·한도·응답만 남고 저장은 서비스가 한다):

<!-- plan-check: full liv-clinic/src/app/api/chat/contact/route.ts -->
```ts
import { after, NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createChatAdminClient } from '@/lib/chat/db';
import { CLINIC_LINK_CHANNELS, validateContactHandle } from '@/lib/chat/contactChannels';
import { recordMessengerClick, saveVisitorContact } from '@/lib/chat/contactService';
import { checkContactClickLimit, checkContactSaveLimit } from '@/lib/chat/rateLimit';
import { relayContactToSlack, relayMessengerClickToSlack } from '@/lib/chat/slackRelay';

export const runtime = 'nodejs';

const ContactSchema = z.object({
  sessionToken: z.string().uuid(),
  // line 저장은 새 카드에 없지만, 캐시된 옛 화면이 보낼 수 있어 받아 준다.
  channel: z.enum(CLINIC_LINK_CHANNELS),
  kind: z.enum(['save', 'click']).default('save'),
  handle: z.string().trim().max(254).optional(),
});

// 이메일 형식 검증은 세션 생성(api/chat/sessions)과 같은 규칙을 쓴다.
const EmailSchema = z.string().email();

// 연락처 카드 (스펙 2026-10-01 §4.4).
//   kind=save  : 손님이 자기 연락처(WhatsApp 번호·WeChat ID·이메일)를 남긴다 → '오늘 연락할 손님'
//   kind=click : 손님이 병원 연락 단추를 눌렀다 → 기록 + 방에 한 줄. 연락처로 치지 않는다
export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = ContactSchema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }
  const { sessionToken, channel, kind } = parsed.data;
  const handle = parsed.data.handle ?? '';

  if (kind === 'save') {
    if (handle.length < 4) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }
    const valid =
      channel === 'email' ? EmailSchema.safeParse(handle).success : validateContactHandle(channel, handle);
    if (!valid) {
      return NextResponse.json({ error: 'invalid_handle' }, { status: 400 });
    }
  }

  const admin = createChatAdminClient();
  const { data: session, error: sessionError } = await admin
    .from('chat_sessions')
    .select('id, visitor_locale')
    .eq('session_token', sessionToken)
    .single();
  if (sessionError || !session) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
  }

  if (kind === 'click') {
    // 손님 화면은 응답을 기다리지 않는다. 한도를 넘은 클릭은 조용히 버린다(방에 📲 줄이 쌓이지 않게).
    if (!checkContactClickLimit(session.id).allowed) {
      return NextResponse.json({ ok: true, ignored: true });
    }
    await recordMessengerClick(admin, session, channel);
    after(async () => {
      await relayMessengerClickToSlack({ sessionId: session.id, channel });
    });
    return NextResponse.json({ ok: true });
  }

  const limit = checkContactSaveLimit(session.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'rate_limited', reason: limit.reason }, { status: 429 });
  }

  const saved = await saveVisitorContact(admin, session, { channel, handle });
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: 500 });
  }

  after(async () => {
    await relayContactToSlack({ sessionId: session.id, channel, handle });
  });

  return NextResponse.json({ ok: true, hasContact: true }, { status: 201 });
}
```

- [ ] **Step 8: 전체 회귀 + 타입 검사**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run && npx tsc --noEmit`
Expected: 48파일 748건 통과, tsc 출력 없음

- [ ] **Step 9: 커밋**

```bash
git add src/lib/chat/contactService.ts src/lib/chat/__tests__/contactService.test.ts src/lib/chat/rateLimit.ts src/lib/chat/serverI18n.ts src/app/api/chat/contact/route.ts
git commit -m "feat(chat): 연락처 API — 이메일 저장, 병원 연락 단추 클릭 기록, 저장 로직을 contactService로" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: 가격·프로모션 문의 판정

**Files:**
- Create: `liv-clinic/src/lib/chat/priceIntent.ts`
- Test: `liv-clinic/src/lib/chat/__tests__/priceIntent.test.ts`

**Interfaces:**
- Consumes: `src/messages/*.json`의 `chat.promoDraft`(테스트가 읽어 상수와 비교한다)
- Produces:
  ```ts
  // src/lib/chat/priceIntent.ts — 순수, 서버 전용(lookbehind 사용)
  export const PROMO_DRAFTS: readonly string[];              // ko, en, ja, zh, zh-TW, vi, th, ru, fr, mn, ar 순서
  export function stripPromoDraft(text: string): string;
  export function looksLikePriceQuestion(text: string): boolean;
  ```
  낱말 목록은 스펙 §4.10 표 그대로다. 더하거나 빼지 않는다.

- [ ] **Step 1: 실패하는 테스트 작성**

`liv-clinic/src/lib/chat/__tests__/priceIntent.test.ts` 를 새로 만든다:

<!-- plan-check: full liv-clinic/src/lib/chat/__tests__/priceIntent.test.ts -->
```ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { looksLikePriceQuestion, PROMO_DRAFTS, stripPromoDraft } from '../priceIntent';

const MESSAGES_DIR = path.resolve(__dirname, '..', '..', '..', 'messages');
const MESSAGE_LOCALES = ['ko', 'en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'];

/** 5% 직접 예약 배너가 입력창에 넣어 주는 문장 — 메시지 JSON에서 직접 읽는다. */
const draftsFromJson = MESSAGE_LOCALES.map((locale) => {
  const json = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), 'utf8'));
  return json.chat.promoDraft as string;
});

describe('looksLikePriceQuestion — 가격·프로모션 문의', () => {
  // 스펙 §8에 적힌 지난 문의 문장(일부는 앞뒤를 채웠다)과 스모크 문장
  it.each([
    'Hi, could you tell me the price of Ulthera?',
    'any promotion on ultherapy prime ?',
    'How much is Ulthera 600 shots?',
    '超声刀多少钱？',
    '我想了解一下价目表',
    '请问含税总价是多少',
    '想問除紋身價格',
    '大体の金額についても教えていただけますか',
    '울쎄라 가격이 얼마예요?',
  ])('가격 질문으로 본다: %s', (text) => {
    expect(looksLikePriceQuestion(text)).toBe(true);
  });

  it.each([
    "Hello, I'd like to book a consultation for next week.",
    'Can I make a reservation by WeChat?',
    'Does the doctor do the procedure directly?',
    'Do you have sculptra',
    'what kind of fillers do you do?',
    '我想预约下周的面诊',
    'こんにちは。来週、カウンセリングを予約したいです。',
  ])('가격과 무관한 문의는 아니다: %s', (text) => {
    expect(looksLikePriceQuestion(text)).toBe(false);
  });

  it('손님 화면 언어와 상관없이 다른 언어의 낱말도 본다', () => {
    expect(looksLikePriceQuestion('Quel est le prix du Botox ?')).toBe(true);
    expect(looksLikePriceQuestion('Giá botox bao nhiêu tiền?')).toBe(true);
    expect(looksLikePriceQuestion('Сколько стоит ботокс?')).toBe(true);
    expect(looksLikePriceQuestion('Ботокс ямар үнэтэй вэ?')).toBe(true);
    expect(looksLikePriceQuestion('โบท็อกซ์ราคาเท่าไหร่')).toBe(true);
    expect(looksLikePriceQuestion('كم سعر البوتوكس؟')).toBe(true);
  });

  it('대소문자와 낱말 사이 줄바꿈을 가리지 않는다', () => {
    expect(looksLikePriceQuestion('HOW MUCH for botox')).toBe(true);
    expect(looksLikePriceQuestion('What is the Price?')).toBe(true);
    expect(looksLikePriceQuestion('how\nmuch is it')).toBe(true);
  });

  it('낱말 경계를 지킨다 — 다른 낱말의 일부는 아니다', () => {
    expect(looksLikePriceQuestion('This is priceless')).toBe(false);
    expect(looksLikePriceQuestion('I live in Costa Rica')).toBe(false);
    expect(looksLikePriceQuestion('I will eventually visit')).toBe(false);
  });

  it('일부러 넣지 않은 낱말은 걸리지 않는다', () => {
    expect(looksLikePriceQuestion('Do you offer Sculptra?')).toBe(false);
    expect(looksLikePriceQuestion('얼마나 걸리나요')).toBe(false);
    expect(looksLikePriceQuestion('Combien de temps dure la séance ?')).toBe(false);
  });

  it('빈 글은 아니다', () => {
    expect(looksLikePriceQuestion('')).toBe(false);
  });
});

describe('배너 문장(chat.promoDraft)', () => {
  it('파일의 상수가 메시지 JSON 11개 언어의 값과 같다', () => {
    expect([...PROMO_DRAFTS]).toEqual(draftsFromJson);
  });

  it('배너 문장만 보낸 글은 가격 질문이 아니다 (11개 언어 모두)', () => {
    for (const draft of draftsFromJson) {
      expect(looksLikePriceQuestion(draft)).toBe(false);
      expect(stripPromoDraft(draft).trim()).toBe('');
    }
  });

  it('배너 문장을 지우지 않으면 걸렸을 문장이 실제로 있다 (지우는 이유)', () => {
    // 한국어 배너 문장의 마지막 글자를 잘라 "정확히 같은 문장"이 아니게 만들면 '할인'·'이벤트'에 걸린다
    expect(looksLikePriceQuestion(draftsFromJson[0].slice(0, -1))).toBe(true);
  });

  it('배너 문장 뒤에 가격 질문이 붙으면 가격 질문이다', () => {
    expect(looksLikePriceQuestion(`${draftsFromJson[1]} How much is Ulthera?`)).toBe(true);
    expect(looksLikePriceQuestion(`${draftsFromJson[3]}超声刀多少钱？`)).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/priceIntent.test.ts`
Expected: FAIL — `Failed to resolve import "../priceIntent"`

- [ ] **Step 3: 구현**

`liv-clinic/src/lib/chat/priceIntent.ts` 를 새로 만든다:

<!-- plan-check: full liv-clinic/src/lib/chat/priceIntent.ts -->
```ts
import 'server-only';

// 가격·프로모션 문의 판정 (스펙 2026-10-01 §4.10). AI 없이 낱말로만 본다 — 순수 함수.
// 서버 전용으로 쓴다: 낱말 경계 판정에 lookbehind를 쓰므로 손님 화면 번들에 넣지 않는다.

/**
 * 5% 직접 예약 배너가 입력창에 넣어 주는 문장(messages/*.json 의 chat.promoDraft, 11개 언어).
 * 이 문장에는 "할인·優惠·割引" 같은 낱말이 들어 있지만 손님이 쓴 가격 질문이 아니므로 판정 전에 지운다.
 * 메시지 JSON과 글자 하나까지 같아야 한다 — priceIntent.test.ts 가 확인한다.
 */
export const PROMO_DRAFTS: readonly string[] = [
  '직접 예약하고 싶어요. 5% 직접예약 할인 이벤트를 봤어요.',
  "I'd like to book directly - I saw the 5% direct-booking offer.",
  '直接予約したいです。5%の直接予約割引を見ました。',
  '我想直接预约，我看到了5%直接预约优惠。',
  '我想直接預約，我看到了5%直接預約優惠。',
  'Tôi muốn đặt lịch trực tiếp. Tôi đã thấy ưu đãi giảm 5% khi đặt lịch trực tiếp.',
  'ต้องการจองโดยตรง เห็นโปรโมชันส่วนลด 5% สำหรับการจองตรงผ่านแชท',
  'Хочу записаться напрямую. Меня интересует скидка 5% при прямой записи.',
  "Je souhaite réserver directement — j'ai vu l'offre de 5% de réduction pour une réservation directe.",
  'Би шууд захиалмаар байна. Шууд захиалгын 5% хямдралыг харлаа.',
  'أرغب في الحجز مباشرة — لقد رأيت عرض خصم 5% على الحجز المباشر.',
];

// 띄어 쓰는 언어 — 낱말 단위(앞뒤가 글자·숫자가 아님), 대소문자 무시.
const SPACED_WORDS: readonly string[] = [
  // 영어
  'price', 'prices', 'priced', 'pricing', 'cost', 'costs', 'how much', 'fee', 'fees', 'quote', 'quotation',
  'promotion', 'promotions', 'promo', 'discount', 'discounts', 'event', 'events',
  // 프랑스어
  'prix', 'tarif', 'tarifs', 'coût', 'coûte', 'réduction', 'remise',
  // 베트남어
  'giá', 'bao nhiêu tiền', 'chi phí', 'khuyến mãi', 'ưu đãi',
  // 러시아어
  'цена', 'цены', 'цену', 'цене', 'ценах', 'стоимость', 'стоимости', 'сколько стоит',
  'скидка', 'скидки', 'скидку', 'акция', 'акции', 'прайс',
  // 몽골어
  'үнэ', 'үнийн', 'үнэтэй', 'хямдрал', 'урамшуулал',
];

// 붙여 쓰는 언어 — 글에 들어 있으면.
const UNSPACED_WORDS: readonly string[] = [
  // 중국어(간체·번체)
  '价格', '價格', '价钱', '價錢', '多少钱', '多少錢', '价目', '價目', '费用', '費用', '总价', '總價',
  '报价', '報價', '价位', '價位', '收费', '收費', '优惠', '優惠', '折扣', '促销', '促銷',
  // 일본어
  '価格', '料金', '値段', '金額', '費用', 'いくら', 'キャンペーン', '割引', 'プロモーション', 'イベント',
  // 한국어
  '가격', '비용', '금액', '할인', '이벤트', '프로모션', '얼마예요', '얼마에요', '얼마인가요', '얼마입니까', '얼마죠',
  // 태국어
  'ราคา', 'กี่บาท', 'ค่าใช้จ่าย', 'โปรโมชั่น', 'โปรโมชัน', 'ส่วนลด',
  // 아랍어
  'سعر', 'أسعار', 'اسعار', 'بكم', 'تكلفة', 'خصم', 'عروض',
];

const nfc = (s: string): string => s.normalize('NFC');

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// tsconfig target(ES2017)의 정규식 리터럴 검사를 피하려고 생성자로 만든다(\p{…}·lookbehind는 Node가 지원한다).
const SPACED_RE = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:${SPACED_WORDS.map((w) => escapeRegExp(nfc(w)).replace(/ /g, '\\s+')).join('|')})(?![\\p{L}\\p{N}])`,
  'iu'
);
const UNSPACED = UNSPACED_WORDS.map(nfc);
const DRAFTS = PROMO_DRAFTS.map(nfc);

/** 배너가 넣어 준 문장을 지운 나머지 글. */
export function stripPromoDraft(text: string): string {
  let out = nfc(text);
  for (const draft of DRAFTS) out = out.split(draft).join(' ');
  return out;
}

/** 손님 글이 가격·프로모션을 묻는 것으로 보이는가. 손님 화면 언어와 상관없이 전체 낱말 목록을 본다. */
export function looksLikePriceQuestion(text: string): boolean {
  const body = stripPromoDraft(text);
  if (SPACED_RE.test(body)) return true;
  return UNSPACED.some((w) => body.includes(w));
}
```

- [ ] **Step 4: 통과 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/priceIntent.test.ts`
Expected: PASS — 25건

- [ ] **Step 5: 커밋**

```bash
git add src/lib/chat/priceIntent.ts src/lib/chat/__tests__/priceIntent.test.ts
git commit -m "feat(chat): 가격·프로모션 문의 낱말 판정(배너 문장은 지우고 본다)" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: 이벤트 안내 (이번 달 프로모션 링크)

**Files:**
- Modify: `liv-clinic/src/lib/chat/serverI18n.ts` (파일 끝에 덧붙임)
- Create: `liv-clinic/src/lib/chat/eventHint.ts`
- Test: `liv-clinic/src/lib/chat/__tests__/eventHint.test.ts`

**Interfaces:**
- Consumes: `looksLikePriceQuestion(text)` (Task 7); `isEventHintEnabled()` (Task 1); `SITE_URL` from `@/lib/siteEnvironment`(기존); `fakeAdmin`·`hasFilter`·`hasFilterOp` (Task 5)
- Produces:
  ```ts
  // src/lib/chat/serverI18n.ts
  export type EventHintKind = 'promotion' | 'list';
  export function composeEventHintTexts(locale: VisitorLocale, kind: EventHintKind, url: string): { ko: string; localized: string };

  // src/lib/chat/eventHint.ts
  export const EVENT_HINT_REPEAT_MS: number;        // 12시간
  export const EVENT_HINT_STAFF_ACTIVE_MS: number;  // 10분
  export function kstDateKey(now: Date): string;                 // 'YYYY-MM-DD' (한국 날짜)
  export function currentPromotionSlug(now: Date): string;       // 'YYYY-MM-promotion' (한국 시각의 연·월)
  export function eventHintUrl(locale: string, promotionSlug: string | null): string;
  export function shouldSendEventHint(s: { eventHintAt: string | null; lastStaffAt: string | null }, now: Date): boolean;
  export type EventHintOutcome = 'sent' | 'not_due' | 'lost_race' | 'error';
  export async function sendEventHintIfDue(admin: ChatAdminClient, sessionId: string, text: string, now?: Date): Promise<{ outcome: EventHintOutcome; url?: string }>;
  ```

- [ ] **Step 1: 실패하는 테스트 작성**

`liv-clinic/src/lib/chat/__tests__/eventHint.test.ts` 를 새로 만든다:

<!-- plan-check: full liv-clinic/src/lib/chat/__tests__/eventHint.test.ts -->
```ts
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
```

- [ ] **Step 2: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/eventHint.test.ts`
Expected: FAIL — `Failed to resolve import "../eventHint"`

- [ ] **Step 3: 이벤트 안내 문장 추가**

`liv-clinic/src/lib/chat/serverI18n.ts` 의 **파일 맨 끝**(Task 4에서 덧붙인 접수 안내 뒤)에 아래를 덧붙인다. ja·zh·zh-TW 문장은 스펙 부록 A와 글자 하나까지 같아야 한다.

<!-- plan-check: contains liv-clinic/src/lib/chat/serverI18n.ts -->
```ts
// ── 이벤트 안내 (스펙 2026-10-01 §4.10) ─────────────────────────────────────
// 가격·프로모션을 물은 손님에게 "가격은 직원이 확인해 안내드린다" + 프로모션 페이지 링크를 먼저 보낸다.
// 문장에는 가격·할인율·효과를 넣지 않는다 — 그런 내용은 링크한 페이지에만 있다.
// ja·zh·zh-TW 는 원장님이 미리보기에서 확인한 문장(스펙 부록 A) 그대로다.

/** promotion = 이번 달 프로모션 상세로 갈 때, list = 이벤트 목록으로 갈 때 */
export type EventHintKind = 'promotion' | 'list';

const EVENT_HINT_KO: Record<EventHintKind, string> = {
  promotion: '가격은 상담 직원이 확인한 뒤 정확히 안내드리겠습니다. 이번 달 프로모션은 아래에서 보실 수 있습니다.',
  list: '가격은 상담 직원이 확인한 뒤 정확히 안내드리겠습니다. 진행 중인 이벤트는 아래에서 보실 수 있습니다.',
};

const EVENT_HINT_TEXTS: Record<VisitorLocale, Record<EventHintKind, string>> = {
  en: {
    promotion: "Our consultants will confirm the exact price and get back to you. You can see this month's promotion here:",
    list: 'Our consultants will confirm the exact price and get back to you. You can see our current promotions here:',
  },
  ja: {
    promotion: '料金はスタッフが確認のうえ、正確にご案内いたします。今月のプロモーションはこちらからご覧いただけます。',
    list: '料金はスタッフが確認のうえ、正確にご案内いたします。実施中のイベントはこちらからご覧いただけます。',
  },
  zh: {
    promotion: '具体价格将由咨询人员确认后为您准确说明。本月优惠活动可在此查看：',
    list: '具体价格将由咨询人员确认后为您准确说明。目前进行中的活动可在此查看：',
  },
  'zh-TW': {
    promotion: '確切價格將由諮詢人員確認後為您準確說明。本月優惠活動可在此查看：',
    list: '確切價格將由諮詢人員確認後為您準確說明。目前進行中的活動可在此查看：',
  },
  vi: {
    promotion:
      'Nhân viên tư vấn sẽ xác nhận giá chính xác và phản hồi lại cho bạn. Bạn có thể xem chương trình khuyến mãi tháng này tại đây:',
    list: 'Nhân viên tư vấn sẽ xác nhận giá chính xác và phản hồi lại cho bạn. Bạn có thể xem các chương trình khuyến mãi hiện có tại đây:',
  },
  th: {
    promotion: 'เจ้าหน้าที่จะตรวจสอบราคาที่แน่นอนแล้วแจ้งให้ทราบอีกครั้งค่ะ ดูโปรโมชันประจำเดือนนี้ได้ที่นี่:',
    list: 'เจ้าหน้าที่จะตรวจสอบราคาที่แน่นอนแล้วแจ้งให้ทราบอีกครั้งค่ะ ดูโปรโมชันที่กำลังจัดอยู่ได้ที่นี่:',
  },
  ru: {
    promotion: 'Наши консультанты уточнят точную стоимость и ответят вам. Акцию этого месяца можно посмотреть здесь:',
    list: 'Наши консультанты уточнят точную стоимость и ответят вам. Действующие акции можно посмотреть здесь:',
  },
  fr: {
    promotion:
      'Nos conseillers vérifieront le tarif exact et reviendront vers vous. Vous pouvez consulter la promotion du mois ici :',
    list: 'Nos conseillers vérifieront le tarif exact et reviendront vers vous. Vous pouvez consulter nos offres en cours ici :',
  },
  mn: {
    promotion: 'Үнийг манай зөвлөх нягталж, танд яг таг мэдээлэл өгнө. Энэ сарын урамшууллыг эндээс үзнэ үү:',
    list: 'Үнийг манай зөвлөх нягталж, танд яг таг мэдээлэл өгнө. Одоо явагдаж буй урамшууллыг эндээс үзнэ үү:',
  },
  ar: {
    promotion: 'سيتأكد مستشارونا من السعر الدقيق ويعودون إليك. يمكنك الاطلاع على عرض هذا الشهر هنا:',
    list: 'سيتأكد مستشارونا من السعر الدقيق ويعودون إليك. يمكنك الاطلاع على عروضنا الحالية هنا:',
  },
};

/** 이벤트 안내 문구: 문장 + 줄바꿈 + 링크. ko = 관리자 화면에 보이는 원문, localized = 손님 언어. */
export function composeEventHintTexts(
  locale: VisitorLocale,
  kind: EventHintKind,
  url: string
): { ko: string; localized: string } {
  const table = EVENT_HINT_TEXTS[locale] ?? EVENT_HINT_TEXTS.en;
  return { ko: `${EVENT_HINT_KO[kind]}\n${url}`, localized: `${table[kind]}\n${url}` };
}
```

- [ ] **Step 4: 구현**

`liv-clinic/src/lib/chat/eventHint.ts` 를 새로 만든다:

<!-- plan-check: full liv-clinic/src/lib/chat/eventHint.ts -->
```ts
import 'server-only';
import type { ChatAdminClient } from '@/lib/chat/db';
import { broadcastToSession } from '@/lib/chat/broadcast';
import { isEventHintEnabled } from '@/lib/chat/chatFlags';
import { looksLikePriceQuestion } from '@/lib/chat/priceIntent';
import { composeEventHintTexts, type VisitorLocale } from '@/lib/chat/serverI18n';
import { SITE_URL } from '@/lib/siteEnvironment';

// 가격 문의에 이벤트 안내 (스펙 2026-10-01 §4.10).
// 가격은 계속 직원이 답한다 — 여기서는 직원이 확인하는 동안 손님이 볼 프로모션 페이지 링크만 먼저 보낸다.
// 메시지는 자동 안내와 같은 꼴(source='auto')이라 대기 시계·미응답 수·확대 알림을 건드리지 않는다.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 한 손님에게 이벤트 안내를 다시 보내기까지의 간격 — 접수 안내와 같은 12시간. */
export const EVENT_HINT_REPEAT_MS = 12 * 60 * 60 * 1000;
/** 직원 글이 이 시간 안에 있으면 끼어들지 않는다 — 연락처 카드와 같은 10분. */
export const EVENT_HINT_STAFF_ACTIVE_MS = 10 * 60 * 1000;

function kstDate(now: Date): Date {
  return new Date(now.getTime() + KST_OFFSET_MS);
}

/** 한국 날짜 'YYYY-MM-DD' */
export function kstDateKey(now: Date): string {
  return kstDate(now).toISOString().slice(0, 10);
}

/**
 * 이번 달 프로모션의 주소(slug) — 관리자 화면 「매달 프로모션」이 만드는 꼴 (monthlyPromotionTemplate.ts).
 * "진행 중인 이벤트"가 아니라 주소로 찾는다: 상시 이벤트나 미리 시작된 다음 달 프로모션과 섞이지 않는다.
 */
export function currentPromotionSlug(now: Date): string {
  return `${kstDate(now).toISOString().slice(0, 7)}-promotion`;
}

/** 손님에게 보낼 링크: 이번 달 프로모션이 게시돼 있으면 상세, 없으면 이벤트 목록. */
export function eventHintUrl(locale: string, promotionSlug: string | null): string {
  const base = `${SITE_URL}/${locale}/events`;
  return promotionSlug ? `${base}/${promotionSlug}` : base;
}

/** 12시간 안에 이미 보냈거나, 직원이 10분 안에 답하고 있는 대화면 보내지 않는다 (순수). */
export function shouldSendEventHint(s: { eventHintAt: string | null; lastStaffAt: string | null }, now: Date): boolean {
  const nowMs = now.getTime();
  if (s.eventHintAt && nowMs - Date.parse(s.eventHintAt) <= EVENT_HINT_REPEAT_MS) return false;
  if (s.lastStaffAt && nowMs - Date.parse(s.lastStaffAt) < EVENT_HINT_STAFF_ACTIVE_MS) return false;
  return true;
}

export type EventHintOutcome = 'sent' | 'not_due' | 'lost_race' | 'error';

/**
 * 손님 글이 가격·프로모션 문의로 보이면 이벤트 안내를 보낸다. throw하지 않는다.
 * 낱말이 없거나 긴급 정지(CHAT_EVENT_HINT=off) 상태면 DB를 건드리지 않고 돌아온다.
 */
export async function sendEventHintIfDue(
  admin: ChatAdminClient,
  sessionId: string,
  text: string,
  now = new Date()
): Promise<{ outcome: EventHintOutcome; url?: string }> {
  try {
    if (!isEventHintEnabled() || !looksLikePriceQuestion(text)) return { outcome: 'not_due' };

    const slug = currentPromotionSlug(now);
    const [sessionRes, staffRes, promoRes] = await Promise.all([
      // event_hint_at 은 042의 새 컬럼 — 자동 안내의 세션 조회와 따로 읽는다(042 적용 전 배포에서 자동 안내까지 깨지지 않게).
      admin.from('chat_sessions').select('id, visitor_locale, event_hint_at').eq('id', sessionId).maybeSingle(),
      // 마지막 직원 글 — 자동 안내(source='auto')는 직원 글이 아니다
      admin
        .from('chat_messages')
        .select('created_at')
        .eq('session_id', sessionId)
        .eq('sender', 'operator')
        .in('source', ['app', 'slack'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from('events')
        .select('slug')
        .eq('slug', slug)
        .eq('is_published', true)
        .gte('end_date', kstDateKey(now))
        .maybeSingle(),
    ]);
    if (sessionRes.error) {
      console.warn('[event hint] session read failed:', sessionRes.error.code ?? 'unknown');
      return { outcome: 'error' };
    }
    if (staffRes.error) {
      console.warn('[event hint] staff message read failed:', staffRes.error.code ?? 'unknown');
      return { outcome: 'error' };
    }
    const session = sessionRes.data;
    if (!session) return { outcome: 'not_due' };
    if (
      !shouldSendEventHint({ eventHintAt: session.event_hint_at, lastStaffAt: staffRes.data?.created_at ?? null }, now)
    ) {
      return { outcome: 'not_due' };
    }

    // 조건부 선점 — 읽은 값이 그대로일 때만 1행. 손님이 가격을 연달아 물어도 한 번만 나간다.
    let claim = admin.from('chat_sessions').update({ event_hint_at: now.toISOString() }).eq('id', sessionId);
    claim = session.event_hint_at
      ? claim.eq('event_hint_at', session.event_hint_at)
      : claim.is('event_hint_at', null);
    const { data: claimed, error: claimError } = await claim.select('id');
    if (claimError) {
      console.warn('[event hint] claim failed:', claimError.code ?? 'unknown');
      return { outcome: 'error' };
    }
    if (!claimed || claimed.length === 0) return { outcome: 'lost_race' };

    // 이번 달 프로모션 조회가 실패했거나 아직 게시 전이면 이벤트 목록으로 보낸다 — 안내 자체는 나간다.
    if (promoRes.error) console.warn('[event hint] promotion lookup failed:', promoRes.error.code ?? 'unknown');
    const published = !promoRes.error && Boolean(promoRes.data);
    const locale = session.visitor_locale as VisitorLocale;
    const url = eventHintUrl(locale, published ? slug : null);
    const texts = composeEventHintTexts(locale, published ? 'promotion' : 'list', url);

    const { data: inserted, error: insertError } = await admin
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
    if (insertError || !inserted) {
      console.warn('[event hint] insert failed:', insertError?.code ?? 'unknown');
      return { outcome: 'error' };
    }
    await broadcastToSession(sessionId, {
      type: 'message_created',
      payload: { messageId: inserted.id, sender: 'operator' },
    });
    return { outcome: 'sent', url };
  } catch (e) {
    console.warn('[event hint] failed:', e);
    return { outcome: 'error' };
  }
}
```

- [ ] **Step 5: 통과 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/eventHint.test.ts`
Expected: PASS — 26건

- [ ] **Step 6: 전체 회귀 + 타입 검사**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run && npx tsc --noEmit`
Expected: 50파일 799건 통과, tsc 출력 없음

- [ ] **Step 7: 커밋**

```bash
git add src/lib/chat/serverI18n.ts src/lib/chat/eventHint.ts src/lib/chat/__tests__/eventHint.test.ts
git commit -m "feat(chat): 가격 문의에 이번 달 프로모션 링크 먼저 보내기(없으면 이벤트 목록)" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: 손님 글 처리 순서 — 자동 안내를 앞당긴다

**Files:**
- Create: `liv-clinic/src/lib/chat/visitorMessageFollowups.ts`
- Modify: `liv-clinic/src/app/api/chat/messages/route.ts` (파일 전체 교체)
- Modify: `liv-clinic/src/app/api/chat/sessions/route.ts` (손님용 `GET ?token=`)
- Test: `liv-clinic/src/lib/chat/__tests__/visitorMessageFollowups.test.ts`

**Interfaces:**
- Consumes: `sendAutoAckIfDue(sessionId)` (Task 4); `saveEmailFromMessage(admin, session, text)`, `ContactSession`, `MessageEmailResult` (Task 6); `sendEventHintIfDue(admin, sessionId, text)` (Task 8); `relayChatMessageToSlack`, `relayContactToSlack`, `relayEventHintNoteToSlack`, `RelayOutboundArgs` (Task 5)
- Produces:
  ```ts
  // src/lib/chat/visitorMessageFollowups.ts
  export interface AckResult { ack: AutoAckOutcome; eventHintUrl: string | null }
  export interface EarlyFollowups { contact: MessageEmailResult; ackPromise: Promise<AckResult> } // ackPromise 는 reject 되지 않는다
  export async function startEarlyFollowups(admin: ChatAdminClient, session: ContactSession, text: string): Promise<EarlyFollowups>;
  export async function runVisitorMessageFollowups(args: { relayArgs: RelayOutboundArgs; contact: MessageEmailResult; ackPromise: Promise<AckResult> }): Promise<void>;

  // POST /api/chat/messages (손님) 응답: { message, contact: { saved: boolean, hasContact: boolean } }
  // GET  /api/chat/messages 응답의 각 메시지에 source 추가
  // GET  /api/chat/sessions?token= 응답: { session: { id, visitor_locale, status, last_message_at, created_at }, hasContact: boolean }
  ```

- [ ] **Step 1: 실패하는 테스트 작성**

`liv-clinic/src/lib/chat/__tests__/visitorMessageFollowups.test.ts` 를 새로 만든다:

<!-- plan-check: full liv-clinic/src/lib/chat/__tests__/visitorMessageFollowups.test.ts -->
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../autoAck', () => ({ sendAutoAckIfDue: vi.fn() }));
vi.mock('../eventHint', () => ({ sendEventHintIfDue: vi.fn() }));
vi.mock('../contactService', () => ({ saveEmailFromMessage: vi.fn() }));
vi.mock('../slackRelay', () => ({
  relayChatMessageToSlack: vi.fn(),
  relayContactToSlack: vi.fn(),
  relayEventHintNoteToSlack: vi.fn(),
}));

import { sendAutoAckIfDue } from '../autoAck';
import { sendEventHintIfDue } from '../eventHint';
import { saveEmailFromMessage } from '../contactService';
import { relayChatMessageToSlack, relayContactToSlack, relayEventHintNoteToSlack } from '../slackRelay';
import { runVisitorMessageFollowups, startEarlyFollowups, type AckResult } from '../visitorMessageFollowups';

const saveEmail = vi.mocked(saveEmailFromMessage);
const autoAck = vi.mocked(sendAutoAckIfDue);
const eventHint = vi.mocked(sendEventHintIfDue);
const relayMessage = vi.mocked(relayChatMessageToSlack);
const relayContact = vi.mocked(relayContactToSlack);
const relayHintNote = vi.mocked(relayEventHintNoteToSlack);

const SESSION = {
  id: '11111111-2222-3333-4444-555555555555',
  visitor_locale: 'en',
  visitor_email: null,
  visitor_messenger_handle: null,
};
const ADMIN = {} as never;
const URL = 'https://liv-clinic.net/en/events/2026-10-promotion';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
/** 마이크로태스크 큐를 비운다 — "아직 호출되지 않았다"를 확인하기 전에 쓴다. */
const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  vi.clearAllMocks();
  saveEmail.mockResolvedValue({ saved: false, hasContact: false });
  autoAck.mockResolvedValue('sent');
  eventHint.mockResolvedValue({ outcome: 'not_due' });
  relayMessage.mockResolvedValue(undefined);
  relayContact.mockResolvedValue(undefined);
  relayHintNote.mockResolvedValue(undefined);
});

describe('startEarlyFollowups', () => {
  it('이메일 저장이 끝난 뒤에 자동 안내를 시작한다', async () => {
    const saving = deferred<{ saved: boolean; hasContact: boolean; email?: string }>();
    saveEmail.mockReturnValue(saving.promise);

    const started = startEarlyFollowups(ADMIN, SESSION, 'mail me at guest@example.com');
    await flush();
    expect(saveEmail).toHaveBeenCalledWith(ADMIN, SESSION, 'mail me at guest@example.com');
    expect(autoAck).not.toHaveBeenCalled();

    saving.resolve({ saved: true, hasContact: true, email: 'guest@example.com' });
    const early = await started;
    expect(early.contact).toEqual({ saved: true, hasContact: true, email: 'guest@example.com' });
    expect(autoAck).toHaveBeenCalledWith(SESSION.id);
  });

  it('자동 안내 완료를 기다리지 않고 돌아오며, 이벤트 안내는 자동 안내가 끝난 뒤에 시작한다', async () => {
    const ack = deferred<'sent'>();
    autoAck.mockReturnValue(ack.promise);
    eventHint.mockResolvedValue({ outcome: 'sent', url: URL });

    const early = await startEarlyFollowups(ADMIN, SESSION, 'How much is Ulthera?');
    await flush();
    expect(autoAck).toHaveBeenCalledTimes(1);
    expect(eventHint).not.toHaveBeenCalled();

    ack.resolve('sent');
    expect(await early.ackPromise).toEqual({ ack: 'sent', eventHintUrl: URL });
    expect(eventHint).toHaveBeenCalledWith(ADMIN, SESSION.id, 'How much is Ulthera?');
  });

  it('이벤트 안내가 나가지 않았으면 eventHintUrl 은 null', async () => {
    const early = await startEarlyFollowups(ADMIN, SESSION, 'hello');
    expect(await early.ackPromise).toEqual({ ack: 'sent', eventHintUrl: null });
  });

  it('자동 안내가 not_due 여도 이벤트 안내는 따로 판정한다 (대화 중간의 가격 질문)', async () => {
    autoAck.mockResolvedValue('not_due');
    eventHint.mockResolvedValue({ outcome: 'sent', url: URL });
    const early = await startEarlyFollowups(ADMIN, SESSION, 'and the price?');
    expect(await early.ackPromise).toEqual({ ack: 'not_due', eventHintUrl: URL });
  });

  it('안쪽에서 예외가 나도 ackPromise 는 reject 되지 않는다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    autoAck.mockRejectedValue(new Error('boom'));
    const early = await startEarlyFollowups(ADMIN, SESSION, 'hello');
    expect(await early.ackPromise).toEqual({ ack: 'error', eventHintUrl: null });
    warn.mockRestore();
  });
});

describe('runVisitorMessageFollowups', () => {
  const relayArgs = {
    sessionId: SESSION.id,
    messageId: 'm-1',
    sender: 'visitor' as const,
    originalText: 'How much is Ulthera?',
    translatedText: '울쎄라 얼마인가요?',
    senderLabel: null,
    receivedAt: '2026-10-05T03:00:00Z',
  };
  const ackDone = (value: AckResult) => Promise.resolve(value);

  it('이메일이 저장된 경우에만 연락처 알림이 손님 글 릴레이 뒤에 간다', async () => {
    const order: string[] = [];
    relayMessage.mockImplementation(async () => {
      order.push('message');
    });
    relayContact.mockImplementation(async () => {
      order.push('contact');
    });

    await runVisitorMessageFollowups({
      relayArgs,
      contact: { saved: true, hasContact: true, email: 'guest@example.com' },
      ackPromise: ackDone({ ack: 'sent', eventHintUrl: null }),
    });
    expect(order).toEqual(['message', 'contact']);
    expect(relayMessage).toHaveBeenCalledWith({ ...relayArgs, contactJustSaved: true });
    expect(relayContact).toHaveBeenCalledWith({ sessionId: SESSION.id, channel: 'email', handle: 'guest@example.com' });
  });

  it('이메일이 저장되지 않았으면 연락처 알림은 없다', async () => {
    await runVisitorMessageFollowups({
      relayArgs,
      contact: { saved: false, hasContact: true },
      ackPromise: ackDone({ ack: 'sent', eventHintUrl: null }),
    });
    expect(relayMessage).toHaveBeenCalledWith({ ...relayArgs, contactJustSaved: false });
    expect(relayContact).not.toHaveBeenCalled();
  });

  it('ackPromise 를 끝까지 기다린다', async () => {
    const ack = deferred<AckResult>();
    let finished = false;
    const running = runVisitorMessageFollowups({
      relayArgs,
      contact: { saved: false, hasContact: false },
      ackPromise: ack.promise,
    }).then(() => {
      finished = true;
    });
    await flush();
    expect(relayMessage).toHaveBeenCalledTimes(1);
    expect(finished).toBe(false);

    ack.resolve({ ack: 'sent', eventHintUrl: null });
    await running;
    expect(finished).toBe(true);
  });

  it('eventHintUrl 이 있을 때만 이벤트 안내 알림이 손님 글 릴레이 뒤에 간다', async () => {
    const order: string[] = [];
    const relaying = deferred<void>();
    relayMessage.mockImplementation(async () => {
      await relaying.promise;
      order.push('message');
    });
    relayHintNote.mockImplementation(async () => {
      order.push('hint-note');
    });

    const running = runVisitorMessageFollowups({
      relayArgs,
      contact: { saved: false, hasContact: false },
      ackPromise: ackDone({ ack: 'sent', eventHintUrl: URL }),
    });
    await flush();
    expect(relayHintNote).not.toHaveBeenCalled(); // 자동 안내는 끝났지만 손님 글 릴레이가 아직이다
    relaying.resolve();
    await running;
    expect(order).toEqual(['message', 'hint-note']);
    expect(relayHintNote).toHaveBeenCalledWith({ sessionId: SESSION.id, url: URL });
  });

  it('eventHintUrl 이 없으면 이벤트 안내 알림은 없다', async () => {
    await runVisitorMessageFollowups({
      relayArgs,
      contact: { saved: false, hasContact: false },
      ackPromise: ackDone({ ack: 'not_due', eventHintUrl: null }),
    });
    expect(relayHintNote).not.toHaveBeenCalled();
  });

  it('Slack 릴레이가 실패해도 자동 안내 쪽은 끝까지 가고 이벤트 안내 알림도 보낸다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    relayMessage.mockRejectedValue(new Error('slack down'));
    await expect(
      runVisitorMessageFollowups({
        relayArgs,
        contact: { saved: false, hasContact: false },
        ackPromise: ackDone({ ack: 'sent', eventHintUrl: URL }),
      })
    ).resolves.toBeUndefined();
    expect(relayHintNote).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('자동 안내 쪽이 실패해도 Slack 릴레이는 끝난다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(
      runVisitorMessageFollowups({
        relayArgs,
        contact: { saved: true, hasContact: true, email: 'guest@example.com' },
        ackPromise: Promise.reject(new Error('boom')),
      })
    ).resolves.toBeUndefined();
    expect(relayMessage).toHaveBeenCalledTimes(1);
    expect(relayContact).toHaveBeenCalledTimes(1);
    expect(relayHintNote).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('자동 안내가 error 면 경고를 남긴다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await runVisitorMessageFollowups({
      relayArgs,
      contact: { saved: false, hasContact: false },
      ackPromise: ackDone({ ack: 'error', eventHintUrl: null }),
    });
    expect(warn.mock.calls.some((c) => String(c[0]).includes('auto ack failed'))).toBe(true);
    warn.mockRestore();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/visitorMessageFollowups.test.ts`
Expected: FAIL — `Failed to resolve import "../visitorMessageFollowups"`

- [ ] **Step 3: 구현**

`liv-clinic/src/lib/chat/visitorMessageFollowups.ts` 를 새로 만든다:

<!-- plan-check: full liv-clinic/src/lib/chat/visitorMessageFollowups.ts -->
```ts
import 'server-only';
import type { ChatAdminClient } from '@/lib/chat/db';
import { sendAutoAckIfDue, type AutoAckOutcome } from '@/lib/chat/autoAck';
import { saveEmailFromMessage, type ContactSession, type MessageEmailResult } from '@/lib/chat/contactService';
import { sendEventHintIfDue } from '@/lib/chat/eventHint';
import {
  relayChatMessageToSlack,
  relayContactToSlack,
  relayEventHintNoteToSlack,
  type RelayOutboundArgs,
} from '@/lib/chat/slackRelay';

// 손님 글 한 건에 뒤따르는 일들 (스펙 2026-10-01 §4.1 "발송 시점을 앞당긴다").
//   1. 손님 글 INSERT                      ← 라우트
//   2. 글 속 이메일 인식·저장               ← startEarlyFollowups (끝까지 기다린다)
//   3. 자동 안내 → 이벤트 안내 시작         ← startEarlyFollowups (기다리지 않는다 — 번역·Slack과 무관)
//   4. 번역 → UPDATE → broadcast → 응답     ← 라우트
//   5. 응답 뒤: Slack 릴레이(→ 연락처 알림)와 3의 완료를 함께 기다린 뒤 이벤트 안내 알림   ← runVisitorMessageFollowups
// 라우트 단위 테스트가 없는 리포라 순서 로직을 여기로 뺐다.

export interface AckResult {
  ack: AutoAckOutcome;
  /** 이벤트 안내가 나갔으면 그 링크. 안 나갔으면 null */
  eventHintUrl: string | null;
}

export interface EarlyFollowups {
  contact: MessageEmailResult;
  /** 자동 안내에 이어 이벤트 안내까지 끝나면 풀린다. reject 되지 않는다. */
  ackPromise: Promise<AckResult>;
}

export async function startEarlyFollowups(
  admin: ChatAdminClient,
  session: ContactSession,
  text: string
): Promise<EarlyFollowups> {
  // 2. 자동 안내가 "남겨 주신 연락처로 …" 문장을 고르려면 이메일 저장이 먼저 끝나 있어야 한다.
  const contact = await saveEmailFromMessage(admin, session, text);
  // 3. 손님이 화면 앞에 있는 첫 몇 초 안에 나가도록, 번역과 Slack 릴레이를 기다리지 않고 지금 시작한다.
  const ackPromise = (async (): Promise<AckResult> => {
    try {
      const ack = await sendAutoAckIfDue(session.id);
      // 이벤트 안내는 자동 안내 뒤에 넣는다 — 손님 화면에서 손님 글 → 안내 → 이벤트 안내 순으로 보인다.
      const hint = await sendEventHintIfDue(admin, session.id, text);
      return { ack, eventHintUrl: hint.outcome === 'sent' && hint.url ? hint.url : null };
    } catch (e) {
      console.warn('[chat followups] ack chain failed:', e);
      return { ack: 'error', eventHintUrl: null };
    }
  })();
  return { contact, ackPromise };
}

export async function runVisitorMessageFollowups(args: {
  relayArgs: RelayOutboundArgs;
  contact: MessageEmailResult;
  ackPromise: Promise<AckResult>;
}): Promise<void> {
  const { relayArgs, contact, ackPromise } = args;
  // Slack: 손님 글 → (이메일이 저장됐으면) 연락처 알림 순. 방에서 글 → 연락처 순으로 보이게 한다.
  const slackChain = (async () => {
    await relayChatMessageToSlack({ ...relayArgs, contactJustSaved: contact.saved });
    if (contact.saved && contact.email) {
      await relayContactToSlack({ sessionId: relayArgs.sessionId, channel: 'email', handle: contact.email });
    }
  })();
  // 한쪽이 실패해도 다른 쪽은 끝까지 간다.
  const [slack, ack] = await Promise.allSettled([slackChain, ackPromise]);
  if (slack.status === 'rejected') console.warn('[chat followups] slack relay failed:', slack.reason);
  if (ack.status === 'rejected') {
    console.warn('[chat followups] ack failed:', ack.reason);
    return;
  }
  if (ack.value.ack === 'error') {
    console.warn('[chat followups] auto ack failed for session', relayArgs.sessionId);
  }
  // 직원이 손님이 무엇을 보고 있는지 알고 답하도록, 손님 글 릴레이가 끝난 뒤에 방에 알린다.
  if (ack.value.eventHintUrl) {
    try {
      await relayEventHintNoteToSlack({ sessionId: relayArgs.sessionId, url: ack.value.eventHintUrl });
    } catch (e) {
      console.warn('[chat followups] event hint note failed:', e);
    }
  }
}
```

- [ ] **Step 4: 통과 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/visitorMessageFollowups.test.ts`
Expected: PASS — 13건

- [ ] **Step 5: 메시지 라우트를 새 순서로 바꾼다**

`liv-clinic/src/app/api/chat/messages/route.ts` 를 아래 내용으로 교체한다. 바뀌는 것: 손님 세션 조회에 `visitor_email, visitor_messenger_handle` 추가, INSERT 직후 `startEarlyFollowups`, `after()`에서 `runVisitorMessageFollowups`, UPDATE 실패 시에도 자동 안내가 끝나도록 `after()` 등록, 손님 응답에 `contact`, 조회 컬럼에 `source`. 직원(관리자 화면) 경로는 Slack 릴레이만 하던 그대로다.

<!-- plan-check: full liv-clinic/src/app/api/chat/messages/route.ts -->
```ts
import { after, NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createChatAdminClient, type ChatAdminClient } from '@/lib/chat/db';
import { createServerClient } from '@/lib/supabase-server';
import { translate, type SupportedLang } from '@/lib/chat/translation';
import type { VisitorLocale } from '@/lib/chat/serverI18n';
import { checkSessionMessageLimit } from '@/lib/chat/rateLimit';
import { broadcastToSession } from '@/lib/chat/broadcast';
import { relayChatMessageToSlack } from '@/lib/chat/slackRelay';
import type { ContactSession } from '@/lib/chat/contactService';
import {
  runVisitorMessageFollowups,
  startEarlyFollowups,
  type EarlyFollowups,
} from '@/lib/chat/visitorMessageFollowups';

export const runtime = 'nodejs';

const VisitorMessageSchema = z.object({
  sessionToken: z.string().uuid(),
  text: z.string().trim().min(1).max(1000),
});

const OperatorMessageSchema = z.object({
  sessionId: z.string().uuid(),
  text: z.string().trim().min(1).max(1000),
});

// source 는 손님 화면이 직원 글과 자동 안내(source='auto')를 가르는 데 쓴다 (연락처 카드 노출 규칙).
const MESSAGE_COLUMNS =
  'id, session_id, sender, original_text, original_lang, translated_text, translated_lang, translation_status, created_at, source';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // 운영자 / 방문자 모드 분기 — body 형태로 판단
  const isVisitorBody = body && typeof body === 'object' && 'sessionToken' in (body as object);
  return isVisitorBody ? handleVisitorMessage(body) : handleOperatorMessage(body);
}

async function handleVisitorMessage(body: unknown) {
  const parsed = VisitorMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }
  const { sessionToken, text } = parsed.data;
  const admin = createChatAdminClient();

  const { data: session, error: sessionError } = await admin
    .from('chat_sessions')
    .select('id, visitor_locale, status, visitor_email, visitor_messenger_handle')
    .eq('session_token', sessionToken)
    .single();
  if (sessionError || !session) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
  }
  if (session.status !== 'open') {
    // 자동 재오픈: 방문자가 돌아와 말을 이으면 종료된 상담을 되살린다 (spec §5.4).
    // 운영자 경로(handleOperatorMessage)는 여전히 409 — 재오픈은 방문자 발신 전용.
    const { error: reopenError } = await admin
      .from('chat_sessions')
      .update({ status: 'open', closed_at: null })
      .eq('id', session.id);
    if (reopenError) {
      console.error('[chat/messages] session reopen failed:', reopenError);
      return NextResponse.json({ error: 'db_error' }, { status: 500 });
    }
  }

  const limit = checkSessionMessageLimit(session.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', reason: limit.reason, retryAfterSec: limit.retryAfterSec },
      { status: 429 }
    );
  }

  const visitorLocale = session.visitor_locale as VisitorLocale;
  return persistAndBroadcast(admin, {
    sessionId: session.id,
    sender: 'visitor',
    senderAdminId: null,
    text,
    fromLang: visitorLocale,
    toLang: 'ko',
    visitorSession: {
      id: session.id,
      visitor_locale: session.visitor_locale,
      visitor_email: session.visitor_email,
      visitor_messenger_handle: session.visitor_messenger_handle,
    },
  });
}

async function handleOperatorMessage(body: unknown) {
  const parsed = OperatorMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }
  const { sessionId, text } = parsed.data;

  // 어드민 인증 (Supabase 쿠키 기반)
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createChatAdminClient();
  const { data: session, error: sessionError } = await admin
    .from('chat_sessions')
    .select('id, visitor_locale, status')
    .eq('id', sessionId)
    .single();
  if (sessionError || !session) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
  }
  if (session.status !== 'open') {
    return NextResponse.json({ error: 'session_closed' }, { status: 409 });
  }

  const visitorLocale = session.visitor_locale as VisitorLocale;
  return persistAndBroadcast(admin, {
    sessionId: session.id,
    sender: 'operator',
    senderAdminId: user.id,
    // Slack 스레드에서 누가 답장했는지 구분할 수 있도록 (비공개 채널 내부 표시용)
    senderLabel: user.email ?? null,
    text,
    fromLang: 'ko',
    toLang: visitorLocale,
  });
}

interface PersistArgs {
  sessionId: string;
  sender: 'visitor' | 'operator';
  senderAdminId: string | null;
  /** Slack에 표시할 작성자 라벨. 방문자 메시지에는 쓰지 않는다. */
  senderLabel?: string | null;
  text: string;
  fromLang: SupportedLang;
  toLang: SupportedLang;
  /** 손님 글일 때만 — 글 속 이메일 인식과 자동 안내에 쓴다 */
  visitorSession?: ContactSession;
}

async function persistAndBroadcast(
  admin: ChatAdminClient,
  args: PersistArgs
) {
  const { sessionId, sender, senderAdminId, senderLabel = null, text, fromLang, toLang, visitorSession } = args;

  // 1. pending 메시지 INSERT (손님 글이면 트리거가 awaiting_since를 세운다)
  const { data: pending, error: insertError } = await admin
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      sender,
      sender_admin_id: senderAdminId,
      sender_label: sender === 'operator' ? senderLabel : null,
      original_text: text,
      original_lang: fromLang,
      translation_status: 'pending',
    })
    .select('id, created_at')
    .single();
  if (insertError || !pending) {
    console.error('[chat/messages] insert failed:', insertError);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  // 2. 손님 글: 글 속 이메일을 저장하고, 자동 안내(→ 이벤트 안내)를 번역·Slack을 기다리지 않고 지금 시작한다.
  //    손님이 화면 앞에 있는 첫 몇 초 안에 안내가 도착해야 한다 (스펙 2026-10-01 §4.1).
  const early: EarlyFollowups | null = visitorSession
    ? await startEarlyFollowups(admin, visitorSession, text)
    : null;

  // 3. 동기 번역
  const translation = await translate(text, fromLang, toLang);

  // 4. 결과 UPDATE
  const { data: updated, error: updateError } = await admin
    .from('chat_messages')
    .update({
      translated_text: translation.status === 'failed' ? null : translation.text,
      translated_lang: translation.status === 'failed' ? null : toLang,
      translation_status: translation.status,
      translation_latency_ms: translation.latencyMs,
      translation_error: translation.errorCode ?? null,
    })
    .eq('id', pending.id)
    .select(MESSAGE_COLUMNS)
    .single();
  if (updateError || !updated) {
    console.error('[chat/messages] update failed:', updateError);
    // 자동 안내는 이미 나갔거나 나가는 중이다 — 함수가 끝나기 전에 마저 끝나게 한다.
    if (early) {
      const ackPromise = early.ackPromise;
      after(async () => {
        await ackPromise;
      });
    }
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  // 5. Broadcast (방문자 측 위젯 도달용. 어드민은 postgres_changes로 자체 수신)
  void broadcastToSession(sessionId, {
    type: 'message_created',
    payload: { messageId: updated.id, sender: updated.sender as 'visitor' | 'operator' | 'system' },
  });

  // 6. Slack 채널로 릴레이 — 방문자 메시지와 어드민 UI 답장을 같은 방/스레드에 미러링한다.
  //    응답 이후(after)에 처리 — 이미 동기 번역이 걸려 있는 경로에 Slack 왕복까지 얹지 않는다.
  //    Slack에서 들어온 답글은 이 라우트를 거치지 않고 slackRelay가 직접 INSERT하므로 에코가 없다.
  const translatedText = updated.translation_status === 'success' ? updated.translated_text : null;
  const relayArgs = {
    sessionId,
    messageId: updated.id,
    sender,
    originalText: updated.original_text,
    translatedText,
    senderLabel,
    receivedAt: updated.created_at,
  };
  after(async () => {
    if (early) {
      // 손님 글: Slack 릴레이 → (이메일 저장 시) 연락처 알림, 그리고 2에서 시작한 자동 안내의 완료를 기다린다.
      await runVisitorMessageFollowups({ relayArgs, contact: early.contact, ackPromise: early.ackPromise });
    } else {
      await relayChatMessageToSlack(relayArgs);
    }
  });

  if (early) {
    // contact.saved: 이번 글에서 이메일을 저장했다. hasContact: 연락처 카드를 숨길지 판단하는 값.
    return NextResponse.json(
      { message: updated, contact: { saved: early.contact.saved, hasContact: early.contact.hasContact } },
      { status: 201 }
    );
  }
  return NextResponse.json({ message: updated }, { status: 201 });
}

// GET /api/chat/messages?sessionToken=xxx (visitor) OR ?sessionId=xxx (admin)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionToken = url.searchParams.get('sessionToken');
  const sessionIdParam = url.searchParams.get('sessionId');
  const since = url.searchParams.get('since');

  const admin = createChatAdminClient();
  let sessionId: string | null = null;

  if (sessionToken) {
    const { data, error } = await admin
      .from('chat_sessions')
      .select('id')
      .eq('session_token', sessionToken)
      .single();
    if (error || !data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    sessionId = data.id;
  } else if (sessionIdParam) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    sessionId = sessionIdParam;
  } else {
    return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  }

  let query = admin
    .from('chat_messages')
    .select(MESSAGE_COLUMNS)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (since) {
    query = query.gt('created_at', since);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[chat/messages] list failed:', error);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}
```

- [ ] **Step 6: 손님용 세션 조회에 연락처 유무를 싣는다**

`liv-clinic/src/app/api/chat/sessions/route.ts`:

<!-- plan-check: added liv-clinic/src/app/api/chat/sessions/route.ts -->
```diff
--- a/src/app/api/chat/sessions/route.ts
+++ b/src/app/api/chat/sessions/route.ts
@@ -111,14 +111,16 @@ export async function GET(req: NextRequest) {
     // Visitor 측: token으로 단건 조회
     const { data, error } = await admin
       .from('chat_sessions')
-      .select('id, visitor_locale, status, last_message_at, created_at')
+      .select('id, visitor_locale, status, last_message_at, created_at, visitor_email, visitor_messenger_handle')
       .eq('session_token', token)
       .single();
 
     if (error || !data) {
       return NextResponse.json({ error: 'not_found' }, { status: 404 });
     }
-    return NextResponse.json({ session: data });
+    // 연락처 값은 돌려주지 않는다 — 손님 화면은 연락처 카드를 띄울지 판단할 유무(hasContact)만 필요하다.
+    const { visitor_email, visitor_messenger_handle, ...session } = data;
+    return NextResponse.json({ session, hasContact: Boolean(visitor_email || visitor_messenger_handle) });
   }
 
   // Admin 측: 쿠키 기반 Supabase 세션으로 인증 확인
```

- [ ] **Step 7: 전체 회귀 + 타입 검사**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run && npx tsc --noEmit`
Expected: 51파일 812건 통과, tsc 출력 없음

- [ ] **Step 8: 커밋**

```bash
git add src/lib/chat/visitorMessageFollowups.ts src/lib/chat/__tests__/visitorMessageFollowups.test.ts src/app/api/chat/messages/route.ts src/app/api/chat/sessions/route.ts
git commit -m "feat(chat): 자동 안내를 번역·Slack보다 먼저 — 손님 글 속 이메일 저장, 이벤트 안내 연결" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: 연락처를 남긴 손님은 재촉 알림에서 뺀다

**Files:**
- Modify: `liv-clinic/src/lib/chat/escalationRunner.ts` (후보 조회)
- Test: `liv-clinic/src/lib/chat/__tests__/escalationRunner.test.ts` (신규)

**Interfaces:**
- Consumes: `isFollowupEnabled()` (Task 1); `fakeAdmin`·`hasFilter` (Task 5)
- Produces: `runEscalations(now)`의 시그니처·반환은 그대로. 후보 조회에 `visitor_email IS NULL AND visitor_messenger_handle IS NULL`이 붙는다(`CHAT_FOLLOWUP=off`면 붙지 않는다).

- [ ] **Step 1: 실패하는 테스트 작성**

`liv-clinic/src/lib/chat/__tests__/escalationRunner.test.ts` 를 새로 만든다:

<!-- plan-check: full liv-clinic/src/lib/chat/__tests__/escalationRunner.test.ts -->
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../db', () => ({ createChatAdminClient: vi.fn() }));
vi.mock('../slackStaff', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../slackStaff')>();
  return {
    ...actual,
    loadStaffDirectory: vi.fn(async () => actual.parseStaffDirectory('U0AAA:이정현')),
  };
});
vi.mock('../slack', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../slack')>()),
  postSlackMessage: vi.fn(),
}));

import { createChatAdminClient } from '../db';
import { postSlackMessage } from '../slack';
import { runEscalations } from '../escalationRunner';
import { fakeAdmin, hasFilter, type FakeOp } from './fakeAdmin';

describe('runEscalations — 연락처를 남긴 손님은 재촉 알림에서 뺀다', () => {
  const adminMock = vi.mocked(createChatAdminClient);
  const postMock = vi.mocked(postSlackMessage);
  // 2026-10-05(월) 12:00 KST
  const NOW = new Date('2026-10-05T03:00:00Z');

  const WAITING = {
    id: '5b0c7c1a-07c0-49bc-91da-2f556884b769',
    visitor_name: null,
    visitor_email: null,
    visitor_locale: 'en',
    status: 'open',
    slack_mode: 'room',
    slack_channel_id: 'C0ROOM',
    slack_thread_ts: null,
    assigned_slack_user_id: null,
    assigned_label: null,
    resolved_at: null,
    awaiting_since: '2026-10-05T02:54:00Z', // 6분째
    escalation_level: 0,
  };

  function adminWith(rows: unknown[]) {
    const admin = fakeAdmin((op: FakeOp) => {
      if (op.table === 'chat_sessions' && op.op === 'select') return { data: rows };
      if (op.table === 'chat_sessions' && op.op === 'update') return { data: [{ id: WAITING.id }] };
      return { data: null };
    });
    adminMock.mockReturnValue(admin as never);
    return admin;
  }

  const candidateQuery = (admin: ReturnType<typeof fakeAdmin>) =>
    admin.ops.find((o) => o.table === 'chat_sessions' && o.op === 'select') as FakeOp;

  beforeEach(() => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-test';
    process.env.SLACK_CHANNEL_ID = 'C0FEED';
    delete process.env.CHAT_FOLLOWUP;
    delete process.env.CHAT_ESCALATION_MINUTES;
    postMock.mockReset();
    postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0ROOM' });
  });
  afterEach(() => {
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_CHANNEL_ID;
    delete process.env.CHAT_FOLLOWUP;
  });

  it('후보 조회에 연락처 NULL 조건 두 개가 붙는다', async () => {
    const admin = adminWith([]);
    await runEscalations(NOW);
    const q = candidateQuery(admin);
    expect(q.filters).toContainEqual(['visitor_email', 'is', null]);
    expect(q.filters).toContainEqual(['visitor_messenger_handle', 'is', null]);
    // 기존 조건은 그대로다
    expect(hasFilter(q, 'status', 'open')).toBe(true);
    expect(q.filters).toContainEqual(['resolved_at', 'is', null]);
    expect(q.filters).toContainEqual(['escalation_level', 'lt', 3]);
  });

  it('CHAT_FOLLOWUP=off 면 연락처 조건이 없다 (예전처럼 모두에게 알린다)', async () => {
    process.env.CHAT_FOLLOWUP = 'off';
    const admin = adminWith([]);
    await runEscalations(NOW);
    const q = candidateQuery(admin);
    expect(q.filters.some(([c]) => c === 'visitor_email' || c === 'visitor_messenger_handle')).toBe(false);
    expect(hasFilter(q, 'status', 'open')).toBe(true);
  });

  it('회귀: 연락처가 없는 손님은 예전처럼 5분 알림이 방에 간다', async () => {
    adminWith([WAITING]);
    const result = await runEscalations(NOW);
    expect(result).toEqual({ checked: 1, escalated: 1 });
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0ROOM' });
    expect(postMock.mock.calls[0][0].text).toBe('⏰ <@U0AAA> 5분째 답이 없습니다.');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/escalationRunner.test.ts`
Expected: FAIL 1건 — `후보 조회에 연락처 NULL 조건 두 개가 붙는다`(조건이 아직 없다). 나머지 2건(긴급 정지, 회귀)은 통과한다.

- [ ] **Step 3: 구현**

`liv-clinic/src/lib/chat/escalationRunner.ts`:

<!-- plan-check: added liv-clinic/src/lib/chat/escalationRunner.ts -->
```diff
--- a/src/lib/chat/escalationRunner.ts
+++ b/src/lib/chat/escalationRunner.ts
@@ -1,5 +1,6 @@
 import 'server-only';
 import { createChatAdminClient } from '@/lib/chat/db';
+import { isFollowupEnabled } from '@/lib/chat/chatFlags';
 import { parseThresholds, planEscalation } from '@/lib/chat/escalation';
 import { getSlackChannelId, isSlackRelayConfigured, postSlackMessage } from '@/lib/chat/slack';
 import { loadStaffDirectory, mentionOf } from '@/lib/chat/slackStaff';
@@ -24,16 +25,21 @@ export async function runEscalations(now: Date): Promise<{ checked: number; esca
   if (staff.responderIds.length === 0) return { checked: 0, escalated: 0 };
   const legacy = getSlackChannelId();
 
-  const { data, error } = await admin
+  let query = admin
     .from('chat_sessions')
     .select(`${RELAY_SESSION_COLUMNS}, awaiting_since, escalation_level`)
     .eq('status', 'open')
     .is('resolved_at', null)
     .not('awaiting_since', 'is', null)
     .lt('escalation_level', 3)
-    .not('slack_mode', 'is', null)
-    .order('awaiting_since', { ascending: true })
-    .limit(BATCH);
+    .not('slack_mode', 'is', null);
+  // 연락처를 남긴 손님은 '오늘 연락할 손님'으로 따로 챙긴다 — 5·12·30분 알림은 연락처가 없는 손님에게만 간다
+  // (스펙 2026-10-01 §4.5 a). 알림이 이미 올라간 뒤에 연락처를 남기면 그때부터 후보에서 빠진다.
+  // CHAT_FOLLOWUP=off(긴급 정지)면 예전처럼 연락처와 무관하게 알린다.
+  if (isFollowupEnabled()) {
+    query = query.is('visitor_email', null).is('visitor_messenger_handle', null);
+  }
+  const { data, error } = await query.order('awaiting_since', { ascending: true }).limit(BATCH);
   if (error) {
     console.warn('[chat ops] candidate query failed:', error.code ?? 'unknown');
     return { checked: 0, escalated: 0 };
```

- [ ] **Step 4: 통과 확인 + 타입 검사**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/escalationRunner.test.ts && npx tsc --noEmit`
Expected: PASS — 3건, tsc 출력 없음

- [ ] **Step 5: 커밋**

```bash
git add src/lib/chat/escalationRunner.ts src/lib/chat/__tests__/escalationRunner.test.ts
git commit -m "feat(chat): 연락처를 남긴 손님은 5·12·30분 알림 후보에서 제외(CHAT_FOLLOWUP=off 로 되돌림)" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: "오늘 연락할 손님" 하루 두 번 요약

**Files:**
- Create: `liv-clinic/src/lib/chat/followupDigest.ts`
- Modify: `liv-clinic/src/app/api/chat/ops/route.ts` (파일 전체 교체)
- Test: `liv-clinic/src/lib/chat/__tests__/followupDigest.test.ts`

**Interfaces:**
- Consumes: `dayRangeMinutes`, `CLOSING_SOON_MIN`, `getBusinessHoursConfig`, `BusinessHoursConfig` (Task 2); `isFollowupEnabled()` (Task 1); `buildFollowupDigestText`, `staffChannelLabel`, `adminSessionUrl`, `FollowupDigestItem` (Task 5); `loadStaffDirectory()`, `postSlackMessage()`, `isSlackRelayConfigured()` (기존)
- Produces:
  ```ts
  // src/lib/chat/followupDigest.ts
  export const DIGEST_WINDOW_MIN = 9;
  export interface FollowupState { status: string; resolved_at: string | null; awaiting_since: string | null; visitor_email: string | null; visitor_messenger_handle: string | null }
  export function isFollowupDue(s: FollowupState): boolean;                       // 순수 — 관리자 목록 배지(Task 16)도 쓴다
  export interface DigestWindow { kind: 'open' | 'closing'; startsAt: Date }
  export function digestWindow(now: Date, hours: BusinessHoursConfig): DigestWindow | null; // 순수
  export interface DigestResult { window: 'open' | 'closing' | null; listed: number }
  export async function runFollowupDigest(now: Date): Promise<DigestResult>;      // throw 하지 않는다

  // POST /api/chat/ops 응답에 digest: DigestResult 추가
  ```
  요약은 `#해외문의`(기본 채널 = `SLACK_CHANNEL_ID`)에 올린다. 영업시간·휴진일 판정은 라우트가 한다(`isBusinessHours` — 현행). 크론 일정(`netlify/functions/chat-ops.mts`, 3분 간격, KST 10:00~19:59)은 바꾸지 않는다 — 10:00과 18:00(토 15:00)이 그 안에 있다.

- [ ] **Step 1: 실패하는 테스트 작성**

`liv-clinic/src/lib/chat/__tests__/followupDigest.test.ts` 를 새로 만든다:

<!-- plan-check: full liv-clinic/src/lib/chat/__tests__/followupDigest.test.ts -->
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../db', () => ({ createChatAdminClient: vi.fn() }));
vi.mock('../slackStaff', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../slackStaff')>();
  return { ...actual, loadStaffDirectory: vi.fn() };
});
vi.mock('../slack', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../slack')>()),
  postSlackMessage: vi.fn(),
}));

import { createChatAdminClient } from '../db';
import { postSlackMessage } from '../slack';
import { loadStaffDirectory, parseStaffDirectory } from '../slackStaff';
import { _resetBusinessHoursForTesting, getBusinessHoursConfig } from '../businessHours';
import { digestWindow, isFollowupDue, runFollowupDigest } from '../followupDigest';
import { fakeAdmin, hasFilter, type FakeOp, type FakeResult } from './fakeAdmin';

function resetHours() {
  delete process.env.CHAT_BUSINESS_HOURS_JSON;
  delete process.env.CHAT_CLOSED_DATES;
  _resetBusinessHoursForTesting();
}

describe('isFollowupDue — 오늘 연락할 손님', () => {
  const base = {
    status: 'open',
    resolved_at: null,
    awaiting_since: '2026-10-05T02:00:00Z',
    visitor_email: 'guest@example.com',
    visitor_messenger_handle: null,
  };
  it('열려 있고, 답을 기다리는 중이고, 연락처가 있으면 해당한다', () => {
    expect(isFollowupDue(base)).toBe(true);
    expect(isFollowupDue({ ...base, visitor_email: null, visitor_messenger_handle: 'liwei88' })).toBe(true);
  });
  it('연락처가 없으면 아니다', () => {
    expect(isFollowupDue({ ...base, visitor_email: null })).toBe(false);
  });
  it('직원이 답했으면(awaiting_since 없음) 아니다', () => {
    expect(isFollowupDue({ ...base, awaiting_since: null })).toBe(false);
  });
  it('완료했거나 종료된 상담은 아니다', () => {
    expect(isFollowupDue({ ...base, resolved_at: '2026-10-05T02:30:00Z' })).toBe(false);
    expect(isFollowupDue({ ...base, status: 'closed' })).toBe(false);
  });
});

describe('digestWindow — 하루 두 번 요약 창', () => {
  beforeEach(resetHours);
  afterEach(resetHours);
  const hours = () => getBusinessHoursConfig();

  it('평일 영업 시작 10:00~10:08 (KST)', () => {
    // 2026-10-05(월) 10:00 KST = 01:00 UTC
    expect(digestWindow(new Date('2026-10-05T01:00:00Z'), hours())).toEqual({
      kind: 'open',
      startsAt: new Date('2026-10-05T01:00:00Z'),
    });
    expect(digestWindow(new Date('2026-10-05T01:08:59Z'), hours())?.kind).toBe('open');
    expect(digestWindow(new Date('2026-10-05T01:09:00Z'), hours())).toBeNull();
    expect(digestWindow(new Date('2026-10-05T00:59:59Z'), hours())).toBeNull();
  });

  it('평일 마감 60분 전 18:00~18:08', () => {
    expect(digestWindow(new Date('2026-10-05T09:00:00Z'), hours())).toEqual({
      kind: 'closing',
      startsAt: new Date('2026-10-05T09:00:00Z'),
    });
    expect(digestWindow(new Date('2026-10-05T09:06:00Z'), hours())?.startsAt.toISOString()).toBe(
      '2026-10-05T09:00:00.000Z'
    );
    expect(digestWindow(new Date('2026-10-05T09:09:00Z'), hours())).toBeNull();
  });

  it('토요일은 15:00 (16시 마감 60분 전)', () => {
    // 2026-10-10(토) 15:00 KST = 06:00 UTC
    expect(digestWindow(new Date('2026-10-10T06:00:00Z'), hours())).toEqual({
      kind: 'closing',
      startsAt: new Date('2026-10-10T06:00:00Z'),
    });
    expect(digestWindow(new Date('2026-10-10T09:00:00Z'), hours())).toBeNull(); // 토요일 18:00 — 평일 시각은 아니다
  });

  it('창 밖과 휴무일(일요일)은 null', () => {
    expect(digestWindow(new Date('2026-10-05T03:00:00Z'), hours())).toBeNull(); // 월 12:00
    expect(digestWindow(new Date('2026-10-11T01:00:00Z'), hours())).toBeNull(); // 일 10:00
  });

  it('영업시간 설정을 바꾸면 창도 따라간다', () => {
    process.env.CHAT_BUSINESS_HOURS_JSON = JSON.stringify({ weekday: ['09:30', '18:30'] });
    _resetBusinessHoursForTesting();
    // 09:30 KST = 00:30 UTC, 17:30 KST = 08:30 UTC
    expect(digestWindow(new Date('2026-10-05T00:30:00Z'), hours())?.kind).toBe('open');
    expect(digestWindow(new Date('2026-10-05T08:30:00Z'), hours())?.kind).toBe('closing');
    expect(digestWindow(new Date('2026-10-05T01:00:00Z'), hours())).toBeNull();
  });

  it('영업시간이 60분보다 짧은 날에는 마감 전 요약이 없다', () => {
    const short = { weekday: ['10:00', '10:30'] as [string, string], saturday: null, sunday: null };
    expect(digestWindow(new Date('2026-10-05T01:00:00Z'), short)?.kind).toBe('open');
    expect(digestWindow(new Date('2026-10-05T00:30:00Z'), short)).toBeNull();
  });
});

describe('runFollowupDigest', () => {
  const adminMock = vi.mocked(createChatAdminClient);
  const postMock = vi.mocked(postSlackMessage);
  const staffMock = vi.mocked(loadStaffDirectory);

  // 2026-10-05(월) 18:03 KST — 마감 60분 전 창(18:00 시작) 안
  const NOW = new Date('2026-10-05T09:03:00Z');
  const WINDOW_START = '2026-10-05T09:00:00.000Z';

  const row = (over: Record<string, unknown> = {}) => ({
    id: 'aaaaaaaa-0000-0000-0000-000000000001',
    visitor_name: 'Li Wei',
    visitor_locale: 'zh',
    visitor_email: null,
    visitor_messenger_channel: 'wechat',
    visitor_messenger_handle: 'liwei88',
    awaiting_since: '2026-10-05T00:26:00Z',
    followup_digest_at: null,
    slack_mode: 'room',
    slack_channel_id: 'C0ROOM1',
    ...over,
  });

  function adminWith(rows: unknown[], claim: (op: FakeOp) => FakeResult = () => ({ data: [{ id: 'x' }] })) {
    const admin = fakeAdmin((op: FakeOp) => {
      if (op.table === 'chat_sessions' && op.op === 'select') return { data: rows };
      if (op.table === 'chat_sessions' && op.op === 'update') return claim(op);
      return { data: null };
    });
    adminMock.mockReturnValue(admin as never);
    return admin;
  }

  beforeEach(() => {
    resetHours();
    process.env.SLACK_BOT_TOKEN = 'xoxb-test';
    process.env.SLACK_CHANNEL_ID = 'C0FEED';
    delete process.env.CHAT_FOLLOWUP;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    adminMock.mockReset();
    postMock.mockReset();
    postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0FEED' });
    staffMock.mockReset();
    staffMock.mockResolvedValue(parseStaffDirectory('U0AAA:이정현,U0BBB:방애금'));
  });
  afterEach(() => {
    resetHours();
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_CHANNEL_ID;
    delete process.env.CHAT_FOLLOWUP;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it('창 안이면 대상 손님을 한 번에 모아 #해외문의에 올린다', async () => {
    const admin = adminWith([
      row(),
      row({
        id: 'aaaaaaaa-0000-0000-0000-000000000002',
        visitor_name: null,
        visitor_locale: 'en',
        visitor_email: 'guest@example.com',
        visitor_messenger_channel: null,
        visitor_messenger_handle: null,
        awaiting_since: '2026-10-05T05:03:00Z',
        slack_channel_id: 'C0ROOM2',
      }),
    ]);

    expect(await runFollowupDigest(NOW)).toEqual({ window: 'closing', listed: 2 });
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0].channelId).toBeUndefined(); // 기본 채널 = #해외문의
    expect(postMock.mock.calls[0][0].text).toBe(
      '📋 *오늘 연락할 손님 2명* <@U0AAA> <@U0BBB>\n' +
        '• 🇨🇳 Li Wei · WeChat · 10/05(월) 09:26 문의 · <#C0ROOM1>\n' +
        '• 🇬🇧 익명 · 이메일 · 10/05(월) 14:03 문의 · <#C0ROOM2>\n' +
        '_방에 답을 쓰거나 방을 보관(완료)하면 목록에서 빠집니다._'
    );
    const claims = admin.ops.filter((o) => o.op === 'update');
    expect(claims).toHaveLength(2);
    expect(claims[0].payload).toEqual({ followup_digest_at: NOW.toISOString() });
    expect(claims[0].filters).toContainEqual(['followup_digest_at', 'is', null]);
  });

  it('대상 조회 조건: 열림·미완료·기다리는 중·연락처 있음·최근 7일', async () => {
    const admin = adminWith([]);
    await runFollowupDigest(NOW);
    const q = admin.ops.find((o) => o.op === 'select') as FakeOp;
    expect(hasFilter(q, 'status', 'open')).toBe(true);
    expect(q.filters).toContainEqual(['resolved_at', 'is', null]);
    expect(q.filters).toContainEqual(['awaiting_since', 'not.is', null]);
    expect(q.filters).toContainEqual(['awaiting_since', 'gte', '2026-09-28T09:03:00.000Z']);
    expect(q.filters).toContainEqual(['', 'or', 'visitor_email.not.is.null,visitor_messenger_handle.not.is.null']);
  });

  it('0명이면 게시하지 않는다', async () => {
    adminWith([]);
    expect(await runFollowupDigest(NOW)).toEqual({ window: 'closing', listed: 0 });
    expect(postMock).not.toHaveBeenCalled();
  });

  it('이 창에서 이미 오른 손님은 다시 올리지 않고, 지난 창에서 오른 손님은 다시 올린다', async () => {
    const admin = adminWith([
      row({ followup_digest_at: '2026-10-05T09:00:30Z' }), // 이번 창(18:00~)에서 이미 올랐다
      row({ id: 'aaaaaaaa-0000-0000-0000-000000000002', visitor_name: 'Aya', followup_digest_at: '2026-10-05T01:02:00Z' }), // 아침 창
    ]);
    expect(await runFollowupDigest(NOW)).toEqual({ window: 'closing', listed: 1 });
    const claims = admin.ops.filter((o) => o.op === 'update');
    expect(claims).toHaveLength(1);
    expect(claims[0].filters).toContainEqual(['followup_digest_at', 'eq', '2026-10-05T01:02:00Z']);
    expect(postMock.mock.calls[0][0].text).toContain('Aya');
    expect(postMock.mock.calls[0][0].text).not.toContain('Li Wei');
    expect(Date.parse('2026-10-05T09:00:30Z')).toBeGreaterThan(Date.parse(WINDOW_START));
  });

  it('선점된 세션만 게시한다 (겹쳐 돈 크론이 먼저 가져간 손님은 뺀다)', async () => {
    adminWith(
      [row(), row({ id: 'aaaaaaaa-0000-0000-0000-000000000002', visitor_name: 'Aya' })],
      (op) => (hasFilter(op, 'id', 'aaaaaaaa-0000-0000-0000-000000000001') ? { data: [] } : { data: [{ id: 'x' }] })
    );
    expect(await runFollowupDigest(NOW)).toEqual({ window: 'closing', listed: 1 });
    expect(postMock.mock.calls[0][0].text.split('\n')[0]).toBe('📋 *오늘 연락할 손님 1명* <@U0AAA> <@U0BBB>');
    expect(postMock.mock.calls[0][0].text).toContain('Aya');
  });

  it('방이 없는 손님(스레드 방식)은 관리자 화면 링크', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://liv-clinic.net';
    adminWith([row({ slack_mode: 'thread', slack_channel_id: 'C0FEED' })]);
    await runFollowupDigest(NOW);
    expect(postMock.mock.calls[0][0].text).toContain(
      '<https://liv-clinic.net/admin/chat/aaaaaaaa-0000-0000-0000-000000000001|관리자 화면>'
    );
  });

  it('메신저와 이메일을 둘 다 남겼으면 둘 다 적는다', async () => {
    adminWith([row({ visitor_email: 'liwei@example.com' })]);
    await runFollowupDigest(NOW);
    expect(postMock.mock.calls[0][0].text).toContain('• 🇨🇳 Li Wei · WeChat, 이메일 · ');
  });

  it('창 밖이면 조회하지 않는다', async () => {
    const admin = adminWith([row()]);
    // 2026-10-05(월) 12:00 KST
    expect(await runFollowupDigest(new Date('2026-10-05T03:00:00Z'))).toEqual({ window: null, listed: 0 });
    expect(admin.ops).toHaveLength(0);
    expect(postMock).not.toHaveBeenCalled();
  });

  it('CHAT_FOLLOWUP=off 면 아무것도 하지 않는다', async () => {
    process.env.CHAT_FOLLOWUP = 'off';
    const admin = adminWith([row()]);
    expect(await runFollowupDigest(NOW)).toEqual({ window: null, listed: 0 });
    expect(admin.ops).toHaveLength(0);
    expect(postMock).not.toHaveBeenCalled();
  });

  it('답변 직원이 없으면 게시하지 않는다 (선점도 하지 않는다)', async () => {
    staffMock.mockResolvedValue(parseStaffDirectory(''));
    const admin = adminWith([row()]);
    expect(await runFollowupDigest(NOW)).toEqual({ window: 'closing', listed: 0 });
    expect(admin.ops).toHaveLength(0);
    expect(postMock).not.toHaveBeenCalled();
  });

  it('조회가 실패하면(042 미적용 등) 경고만 남긴다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const admin = fakeAdmin(() => ({ error: { code: '42703' } }));
    adminMock.mockReturnValue(admin as never);
    expect(await runFollowupDigest(NOW)).toEqual({ window: 'closing', listed: 0 });
    expect(postMock).not.toHaveBeenCalled();
    expect(warn.mock.calls.some((c) => String(c[0]).includes('followup digest query failed'))).toBe(true);
    warn.mockRestore();
  });

  it('게시가 실패해도 throw 하지 않는다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    adminWith([row()]);
    postMock.mockResolvedValue({ ok: false, error: 'channel_not_found' });
    expect(await runFollowupDigest(NOW)).toEqual({ window: 'closing', listed: 1 });
    warn.mockRestore();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/followupDigest.test.ts`
Expected: FAIL — `Failed to resolve import "../followupDigest"`

- [ ] **Step 3: 구현**

`liv-clinic/src/lib/chat/followupDigest.ts` 를 새로 만든다:

<!-- plan-check: full liv-clinic/src/lib/chat/followupDigest.ts -->
```ts
import 'server-only';
import { createChatAdminClient } from '@/lib/chat/db';
import {
  CLOSING_SOON_MIN,
  dayRangeMinutes,
  getBusinessHoursConfig,
  type BusinessHoursConfig,
} from '@/lib/chat/businessHours';
import { isFollowupEnabled } from '@/lib/chat/chatFlags';
import { isSlackRelayConfigured, postSlackMessage } from '@/lib/chat/slack';
import { loadStaffDirectory } from '@/lib/chat/slackStaff';
import {
  adminSessionUrl,
  buildFollowupDigestText,
  staffChannelLabel,
  type FollowupDigestItem,
} from '@/lib/chat/slackText';

// "오늘 연락할 손님" (스펙 2026-10-01 §4.5).
// 연락처를 남겼고 직원 답을 기다리는 손님 — 새 상태 컬럼 없이 기존 값에서 파생한다.
// 하루 두 번(영업 시작 시각, 마감 60분 전) #해외문의에 남은 손님 목록을 올린다.
// 3분 크론(POST /api/chat/ops)이 확대 알림 다음에 부른다. 영업시간·휴진일 판정은 그 라우트가 한다.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 요약 창 길이(분) — 3분 크론 3회분. 한 번 빠져도 다음 회가 받는다. */
export const DIGEST_WINDOW_MIN = 9;
/** 이보다 오래 기다린 건은 요약에 올리지 않는다 — 오래된 건이 끝없이 오르지 않게. */
const LOOKBACK_DAYS = 7;
const QUERY_LIMIT = 50;

export interface FollowupState {
  status: string;
  resolved_at: string | null;
  awaiting_since: string | null;
  visitor_email: string | null;
  visitor_messenger_handle: string | null;
}

/** '오늘 연락할 손님'인가 (순수). 카드 단추만 누른 손님은 아니다 — 우리가 먼저 연락할 길이 없다. */
export function isFollowupDue(s: FollowupState): boolean {
  return (
    s.status === 'open' &&
    !s.resolved_at &&
    Boolean(s.awaiting_since) &&
    Boolean(s.visitor_email || s.visitor_messenger_handle)
  );
}

export interface DigestWindow {
  /** open = 영업 시작 시각, closing = 마감 60분 전 */
  kind: 'open' | 'closing';
  startsAt: Date;
}

/**
 * 지금이 요약 창 안인가 (순수).
 * 창은 그날 영업 시작 시각부터 9분, 마감 60분 전부터 9분. 휴진일 판정은 호출자가 한다.
 */
export function digestWindow(now: Date, hours: BusinessHoursConfig): DigestWindow | null {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const range = dayRangeMinutes(hours, kst.getUTCDay());
  if (!range) return null;
  const cur = kst.getUTCHours() * 60 + kst.getUTCMinutes();
  const dayStartMs = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - KST_OFFSET_MS;
  const candidates: Array<[DigestWindow['kind'], number]> = [
    ['open', range.startMin],
    ['closing', range.endMin - CLOSING_SOON_MIN],
  ];
  for (const [kind, startMin] of candidates) {
    if (startMin < range.startMin) continue; // 영업시간이 60분보다 짧은 날에는 마감 전 요약이 없다
    if (cur >= startMin && cur < startMin + DIGEST_WINDOW_MIN) {
      return { kind, startsAt: new Date(dayStartMs + startMin * 60_000) };
    }
  }
  return null;
}

const DIGEST_COLUMNS =
  'id, visitor_name, visitor_locale, visitor_email, visitor_messenger_channel, visitor_messenger_handle, awaiting_since, followup_digest_at, slack_mode, slack_channel_id';

interface DigestRow {
  id: string;
  visitor_name: string | null;
  visitor_locale: string;
  visitor_email: string | null;
  visitor_messenger_channel: string | null;
  visitor_messenger_handle: string | null;
  awaiting_since: string;
  followup_digest_at: string | null;
  slack_mode: string | null;
  slack_channel_id: string | null;
}

function toDigestItem(s: DigestRow): FollowupDigestItem {
  const labels: string[] = [];
  if (s.visitor_messenger_handle) labels.push(staffChannelLabel(s.visitor_messenger_channel) || '메신저');
  if (s.visitor_email) labels.push('이메일');
  const channelId = s.slack_mode === 'room' ? s.slack_channel_id : null;
  return {
    visitorName: s.visitor_name,
    visitorLocale: s.visitor_locale,
    contactLabel: labels.join(', '),
    awaitingSince: s.awaiting_since,
    channelId,
    adminUrl: channelId ? null : adminSessionUrl(s.id),
  };
}

export interface DigestResult {
  /** 지금 열려 있는 창. 창 밖이거나 꺼져 있으면 null */
  window: DigestWindow['kind'] | null;
  /** 이번 실행에서 요약에 올린 손님 수 */
  listed: number;
}

/**
 * 요약 창 안이면 '오늘 연락할 손님'을 #해외문의에 한 번 올린다. throw하지 않는다.
 * 세션마다 followup_digest_at 을 조건부 UPDATE로 선점하고, 선점된 세션만 모아 게시한다 —
 * 크론이 겹치거나 같은 창에서 다시 돌아도 같은 손님이 두 번 오르지 않는다.
 */
export async function runFollowupDigest(now: Date): Promise<DigestResult> {
  if (!isFollowupEnabled() || !isSlackRelayConfigured()) return { window: null, listed: 0 };
  const window = digestWindow(now, getBusinessHoursConfig());
  if (!window) return { window: null, listed: 0 };
  try {
    const staff = await loadStaffDirectory();
    // 답변 직원이 한 명도 없으면(SLACK_ROOMS=off 등) 새 Slack 트래픽을 만들지 않는다 — 기존 안전 스위치와 같다.
    if (staff.responderIds.length === 0) return { window: window.kind, listed: 0 };

    const admin = createChatAdminClient();
    const cutoff = new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000).toISOString();
    const { data, error } = await admin
      .from('chat_sessions')
      .select(DIGEST_COLUMNS)
      .eq('status', 'open')
      .is('resolved_at', null)
      .not('awaiting_since', 'is', null)
      .gte('awaiting_since', cutoff)
      .or('visitor_email.not.is.null,visitor_messenger_handle.not.is.null')
      .order('awaiting_since', { ascending: true })
      .limit(QUERY_LIMIT);
    if (error) {
      // 042 적용 전이면 followup_digest_at 이 없어 여기로 온다.
      console.warn('[chat ops] followup digest query failed:', error.code ?? 'unknown');
      return { window: window.kind, listed: 0 };
    }

    const windowStartMs = window.startsAt.getTime();
    const due = ((data ?? []) as DigestRow[]).filter(
      (s) => !s.followup_digest_at || Date.parse(s.followup_digest_at) < windowStartMs
    );

    const claimed: DigestRow[] = [];
    for (const s of due) {
      // 조건부 선점 — 읽은 값이 그대로일 때만 1행 (auto_ack_at 과 같은 방식).
      let claim = admin.from('chat_sessions').update({ followup_digest_at: now.toISOString() }).eq('id', s.id);
      claim = s.followup_digest_at
        ? claim.eq('followup_digest_at', s.followup_digest_at)
        : claim.is('followup_digest_at', null);
      const { data: got, error: claimError } = await claim.select('id');
      if (claimError) {
        console.warn('[chat ops] followup digest claim failed:', claimError.code ?? 'unknown');
        continue;
      }
      if (got && got.length > 0) claimed.push(s);
    }
    if (claimed.length === 0) return { window: window.kind, listed: 0 };

    // 선점 뒤 게시 — 게시가 실패해도 이 창에서는 다시 시도하지 않는다(확대 알림과 같은 방식). 다음 창에서 다시 오른다.
    const posted = await postSlackMessage({
      text: buildFollowupDigestText({ mentionAll: staff.mentionAll(), items: claimed.map(toDigestItem) }),
    });
    if (!posted.ok) console.warn('[chat ops] followup digest post failed:', posted.error);
    return { window: window.kind, listed: claimed.length };
  } catch (e) {
    console.warn('[chat ops] followup digest failed:', e);
    return { window: window.kind, listed: 0 };
  }
}
```

- [ ] **Step 4: 통과 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/followupDigest.test.ts`
Expected: PASS — 22건

- [ ] **Step 5: 크론 라우트에 연결**

`liv-clinic/src/app/api/chat/ops/route.ts` 를 아래 내용으로 교체한다(확대 알림 다음에 요약을 부르고, 응답에 `digest`를 싣는다):

<!-- plan-check: full liv-clinic/src/app/api/chat/ops/route.ts -->
```ts
import { NextRequest, NextResponse } from 'next/server';
import { isBusinessHours } from '@/lib/chat/businessHours';
import { pruneSlackEvents, runEscalations } from '@/lib/chat/escalationRunner';
import { runFollowupDigest } from '@/lib/chat/followupDigest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 운영 작업 라우트 — Netlify 예약 함수(chat-ops.mts)가 3분마다 호출한다.
 * 공유 시크릿(CHAT_OPS_SECRET)으로만 접근. 영업시간 밖(휴진일 포함)에는 정리만 하고 즉시 끝난다.
 * 영업시간 중: 미응답 확대 알림 → '오늘 연락할 손님' 요약(하루 두 번, 창 안에서만).
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
  const digest = await runFollowupDigest(now);
  return NextResponse.json({ ok: true, ...result, pruned, digest });
}
```

- [ ] **Step 6: 전체 회귀 + 타입 검사**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run && npx tsc --noEmit`
Expected: 53파일 837건 통과, tsc 출력 없음

- [ ] **Step 7: 커밋**

```bash
git add src/lib/chat/followupDigest.ts src/lib/chat/__tests__/followupDigest.test.ts src/app/api/chat/ops/route.ts
git commit -m "feat(chat): '오늘 연락할 손님' 요약 — 문 열 때와 마감 1시간 전에 #해외문의로" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: 말풍선의 링크를 눌리게

**Files:**
- Create: `liv-clinic/src/lib/chat/linkify.ts`
- Modify: `liv-clinic/src/components/chat/MessageBubble.tsx` (파일 전체 교체)
- Test: `liv-clinic/src/lib/chat/__tests__/linkify.test.ts`, `liv-clinic/src/components/chat/__tests__/MessageBubble.test.tsx` (둘 다 신규)

**Interfaces:**
- Consumes: 없음
- Produces:
  ```ts
  // src/lib/chat/linkify.ts — 순수, 손님 화면에서 쓴다(lookbehind 없음)
  export interface LinkPart { kind: 'text' | 'link'; value: string }
  export function splitLinks(text: string): LinkPart[];
  ```
  `MessageBubble`의 props는 그대로다. 직원·자동 안내 말풍선(본문과 "원문 보기")만 링크를 그리고, 손님 자신의 글과 시스템 메시지는 글자 그대로다.

- [ ] **Step 1: 실패하는 테스트 작성 (주소 가르기)**

`liv-clinic/src/lib/chat/__tests__/linkify.test.ts` 를 새로 만든다:

<!-- plan-check: full liv-clinic/src/lib/chat/__tests__/linkify.test.ts -->
```ts
import { describe, it, expect } from 'vitest';
import { splitLinks } from '../linkify';

describe('splitLinks — 말풍선 글에서 주소 가르기', () => {
  it('주소가 없으면 글 조각 하나', () => {
    expect(splitLinks('hello')).toEqual([{ kind: 'text', value: 'hello' }]);
    expect(splitLinks('')).toEqual([{ kind: 'text', value: '' }]);
  });

  it('문장 중간의 주소', () => {
    expect(splitLinks('see https://liv-clinic.net/en/events now')).toEqual([
      { kind: 'text', value: 'see ' },
      { kind: 'link', value: 'https://liv-clinic.net/en/events' },
      { kind: 'text', value: ' now' },
    ]);
  });

  it('주소가 여러 개', () => {
    expect(splitLinks('a http://a.com b https://b.com/x?y=1&z=2')).toEqual([
      { kind: 'text', value: 'a ' },
      { kind: 'link', value: 'http://a.com' },
      { kind: 'text', value: ' b ' },
      { kind: 'link', value: 'https://b.com/x?y=1&z=2' },
    ]);
  });

  it('줄바꿈 뒤의 주소 — 이벤트 안내 말풍선의 꼴', () => {
    expect(splitLinks('本月优惠活动可在此查看：\nhttps://liv-clinic.net/zh/events/2026-10-promotion')).toEqual([
      { kind: 'text', value: '本月优惠活动可在此查看：\n' },
      { kind: 'link', value: 'https://liv-clinic.net/zh/events/2026-10-promotion' },
    ]);
  });

  it('주소 끝의 문장부호는 링크에서 뺀다', () => {
    expect(splitLinks('Visit https://liv-clinic.net/en/events.')).toEqual([
      { kind: 'text', value: 'Visit ' },
      { kind: 'link', value: 'https://liv-clinic.net/en/events' },
      { kind: 'text', value: '.' },
    ]);
    expect(splitLinks('(https://liv-clinic.net/en)')).toEqual([
      { kind: 'text', value: '(' },
      { kind: 'link', value: 'https://liv-clinic.net/en' },
      { kind: 'text', value: ')' },
    ]);
    expect(splitLinks('https://liv-clinic.net/ja/events。ご覧ください')).toEqual([
      { kind: 'link', value: 'https://liv-clinic.net/ja/events' },
      { kind: 'text', value: '。ご覧ください' },
    ]);
  });

  it('띄어쓰기 없이 일본어·중국어 글이 붙어도 주소는 거기서 끝난다', () => {
    expect(splitLinks('https://liv-clinic.net/ja/eventsをご覧ください')).toEqual([
      { kind: 'link', value: 'https://liv-clinic.net/ja/events' },
      { kind: 'text', value: 'をご覧ください' },
    ]);
  });

  it('http·https 만 링크다 — javascript: 나 www. 만 있는 글은 글자 그대로', () => {
    expect(splitLinks('javascript:alert(1) and www.example.com')).toEqual([
      { kind: 'text', value: 'javascript:alert(1) and www.example.com' },
    ]);
  });

  it('주소 없이 http:// 만 있으면 글자 그대로', () => {
    expect(splitLinks('http://')).toEqual([{ kind: 'text', value: 'http://' }]);
    expect(splitLinks('x http://. y')).toEqual([{ kind: 'text', value: 'x http://. y' }]);
  });

  it('조각을 이어 붙이면 원래 글이 된다', () => {
    const text = '가격은 https://liv-clinic.net/ko/events, 그리고 (http://a.com/b?c=d) 를 보세요.';
    expect(splitLinks(text).map((p) => p.value).join('')).toBe(text);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/linkify.test.ts`
Expected: FAIL — `Failed to resolve import "../linkify"`

- [ ] **Step 3: 구현 (주소 가르기)**

`liv-clinic/src/lib/chat/linkify.ts` 를 새로 만든다:

<!-- plan-check: full liv-clinic/src/lib/chat/linkify.ts -->
```ts
// 채팅 말풍선의 글에서 눌러서 열 수 있는 주소를 가른다 (스펙 2026-10-01 §4.10). 순수 함수 — 손님 화면에서 쓴다.

export interface LinkPart {
  kind: 'text' | 'link';
  value: string;
}

// http(s) 주소만. 주소에 쓸 수 있는 ASCII 글자만 받는다 — 일본어·중국어 글이 띄어쓰기 없이 뒤에 붙어도 주소가 거기서 끝난다.
const URL_RE = /https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/g;
// 주소 끝에 붙은 문장부호는 링크에서 뺀다 (전각 문장부호는 위 글자 집합에 없어 처음부터 들어오지 않는다).
const TRAILING_PUNCT_RE = /[.,;:!?)\]'"]+$/;
const SCHEME_ONLY_RE = /^https?:\/\/$/;

export function splitLinks(text: string): LinkPart[] {
  const parts: LinkPart[] = [];
  let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    const start = m.index ?? 0;
    const url = m[0].replace(TRAILING_PUNCT_RE, '');
    if (SCHEME_ONLY_RE.test(url)) continue;
    if (start > last) parts.push({ kind: 'text', value: text.slice(last, start) });
    parts.push({ kind: 'link', value: url });
    last = start + url.length;
  }
  if (last < text.length || parts.length === 0) parts.push({ kind: 'text', value: text.slice(last) });
  return parts;
}
```

- [ ] **Step 4: 통과 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/linkify.test.ts`
Expected: PASS — 9건

- [ ] **Step 5: 실패하는 테스트 작성 (말풍선)**

`liv-clinic/src/components/chat/__tests__/MessageBubble.test.tsx` 를 새로 만든다(폴더 `__tests__`도 새로 생긴다):

<!-- plan-check: full liv-clinic/src/components/chat/__tests__/MessageBubble.test.tsx -->
```tsx
/**
 * 채팅 말풍선의 링크 누르기 (스펙 2026-10-01 §4.10).
 * 환경은 `node`(jsdom 없음)라 react-dom/server 로 정적 마크업을 만들어 검사한다.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ChatMessage } from '@/lib/chat/chatApi';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import MessageBubble from '../MessageBubble';

const URL = 'https://liv-clinic.net/en/events/2026-10-promotion';

function message(over: Partial<ChatMessage>): ChatMessage {
  return {
    id: 'm1',
    session_id: 's1',
    sender: 'operator',
    original_text: '',
    original_lang: 'ko',
    translated_text: null,
    translated_lang: null,
    translation_status: 'success',
    translation_error: null,
    created_at: '2026-10-05T03:00:00Z',
    source: 'app',
    ...over,
  };
}

const render = (m: ChatMessage) => renderToStaticMarkup(<MessageBubble message={m} visitorLocale="en" />);

describe('MessageBubble — 링크', () => {
  it('자동 안내의 주소는 새 창으로 여는 링크다', () => {
    const html = render(
      message({
        source: 'auto',
        original_text: `가격은 상담 직원이 확인한 뒤 안내드리겠습니다.\n${URL}`,
        translated_text: `Our consultants will confirm the exact price.\n${URL}`,
        translated_lang: 'en',
      })
    );
    expect(html).toContain(`<a href="${URL}" target="_blank" rel="noopener noreferrer"`);
    expect(html).toContain('Our consultants will confirm the exact price.');
  });

  it('직원이 붙여 넣은 주소도 링크다', () => {
    const html = render(message({ source: 'slack', original_text: `여기를 보세요 ${URL}`, translated_text: `See ${URL}` }));
    expect(html).toContain(`<a href="${URL}"`);
  });

  it('주소가 없는 직원 글에는 링크가 없다', () => {
    expect(render(message({ original_text: '안녕하세요', translated_text: 'Hello' }))).not.toContain('<a ');
  });

  it('손님 자신의 글은 주소가 있어도 글자 그대로다', () => {
    const html = render(message({ sender: 'visitor', original_lang: 'en', original_text: `is this right? ${URL}` }));
    expect(html).not.toContain('<a ');
    expect(html).toContain(URL);
  });

  it('시스템 메시지(노란 띠)도 글자 그대로다', () => {
    const html = render(message({ sender: 'system', original_text: `Email contact saved. ${URL}`, translation_status: 'skipped' }));
    expect(html).not.toContain('<a ');
  });

  it('javascript: 같은 주소는 링크로 만들지 않는다', () => {
    const html = render(message({ original_text: 'javascript:alert(1)', translated_text: 'javascript:alert(1)' }));
    expect(html).not.toContain('<a ');
  });
});
```

- [ ] **Step 6: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/components/chat/__tests__/MessageBubble.test.tsx`
Expected: FAIL 2건 — `자동 안내의 주소는 새 창으로 여는 링크다`, `직원이 붙여 넣은 주소도 링크다`(지금은 글자만 그린다). 나머지 4건은 통과한다.

- [ ] **Step 7: 구현 (말풍선)**

`liv-clinic/src/components/chat/MessageBubble.tsx` 를 아래 내용으로 교체한다(`LinkedText` 추가, 직원 말풍선의 본문·원문 보기에 적용. 나머지는 그대로다):

<!-- plan-check: full liv-clinic/src/components/chat/MessageBubble.tsx -->
```tsx
'use client';

import { Fragment, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ChatMessage, VisitorLocale } from '@/lib/chat/chatApi';
import { splitLinks } from '@/lib/chat/linkify';

interface Props {
  message: ChatMessage;
  visitorLocale: VisitorLocale;
}

/**
 * 직원·자동 안내 말풍선의 글 — http(s) 주소는 새 창으로 여는 링크로 그린다 (스펙 2026-10-01 §4.10).
 * 새 창으로 여는 이유: 대화가 있던 화면을 그대로 두기 위해서다.
 */
function LinkedText({ text }: { text: string }) {
  return (
    <>
      {splitLinks(text).map((part, i) =>
        part.kind === 'link' ? (
          <a
            key={i}
            href={part.value}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 break-all"
          >
            {part.value}
          </a>
        ) : (
          <Fragment key={i}>{part.value}</Fragment>
        )
      )}
    </>
  );
}

export default function MessageBubble({ message, visitorLocale }: Props) {
  const t = useTranslations('chat');
  const [showOriginal, setShowOriginal] = useState(false);

  if (message.sender === 'system') {
    return (
      <div className="my-2 mx-auto max-w-[90%] text-center">
        <div className="inline-block rounded-md bg-yellow-50 px-3 py-2 text-xs text-yellow-900 border border-yellow-100">
          {message.original_text}
        </div>
      </div>
    );
  }

  const isVisitor = message.sender === 'visitor';
  const align = isVisitor ? 'items-end' : 'items-start';
  const bubbleColor = isVisitor
    ? 'bg-[#b4988d] text-white'
    : 'bg-gray-100 text-[#575756]';

  // 방문자 메시지(visitorLocale 원문) → 한국어 번역, 운영자 메시지(ko 원문) → visitorLocale 번역
  // 위젯 사용자(방문자)는 자기 언어로 보여줘야 함.
  // - visitor 본인 메시지: 원문(자기 언어) 메인. 토글로 한국어 확인 가능
  // - operator 메시지: 번역(자기 언어) 메인. 토글로 한국어 원문 확인 가능
  const primary =
    message.sender === 'visitor'
      ? message.original_text
      : message.translation_status === 'success' && message.translated_text
      ? message.translated_text
      : message.original_text;

  const secondary =
    message.sender === 'visitor'
      ? message.translated_text
      : message.original_text;

  const failed = message.translation_status === 'failed';
  const showSecondary =
    !failed && secondary !== null && secondary !== undefined && secondary !== primary;

  void visitorLocale;

  return (
    <div className={`my-1.5 flex flex-col ${align}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${bubbleColor} whitespace-pre-wrap break-words`}
      >
        {/* 손님 자신의 글은 글자 그대로, 직원·자동 안내의 글만 링크를 눌리게 한다 */}
        {isVisitor ? primary : <LinkedText text={primary} />}
      </div>
      {failed && (
        <div className="mt-0.5 text-[11px] text-red-500">{t('translationFailed')}</div>
      )}
      {showSecondary && (
        <button
          type="button"
          onClick={() => setShowOriginal((v) => !v)}
          className="mt-1 text-[11px] text-gray-400 hover:text-gray-600 transition"
        >
          {showOriginal ? t('hideOriginal') : t('showOriginal')}
        </button>
      )}
      {showSecondary && showOriginal && (
        <div
          className={`mt-1 max-w-[85%] rounded-xl px-3 py-1.5 text-xs ${
            isVisitor ? 'bg-[#b4988d]/10 text-[#6d4e42]' : 'bg-gray-50 text-gray-500'
          } border border-dashed ${
            isVisitor ? 'border-[#b4988d]/30' : 'border-gray-200'
          } whitespace-pre-wrap break-words`}
        >
          {isVisitor ? secondary : <LinkedText text={secondary ?? ''} />}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8: 통과 확인 + 전체 회귀 + 타입 검사**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run && npx tsc --noEmit`
Expected: 55파일 852건 통과(MessageBubble 6건, linkify 9건 포함), tsc 출력 없음

- [ ] **Step 9: 커밋**

```bash
git add src/lib/chat/linkify.ts src/lib/chat/__tests__/linkify.test.ts src/components/chat/MessageBubble.tsx src/components/chat/__tests__/MessageBubble.test.tsx
git commit -m "feat(chat): 직원·자동 안내 말풍선의 링크를 새 창으로 열리게" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 13: 채널 아이콘 한 벌

**Files:**
- Create: `liv-clinic/src/components/ui/ChannelIcon.tsx`
- Modify: `liv-clinic/src/components/layout/FloatingCTA.tsx` (import 1줄, `line`·`whatsapp`의 `icon`)
- Test: `liv-clinic/src/components/ui/__tests__/ChannelIcon.test.tsx` (신규)

**Interfaces:**
- Consumes: `/images/wechat-icon.png` (이미 있다)
- Produces:
  ```tsx
  // src/components/ui/ChannelIcon.tsx
  export const WHATSAPP_ICON_PATH: string; // FloatingCTA 에 있던 path 그대로 (길이 1104)
  export const LINE_ICON_PATH: string;     // FloatingCTA 에 있던 path 그대로 (길이 1066)
  export const WECHAT_ICON_IMAGE = '/images/wechat-icon.png';
  export default function ChannelIcon(props: { channel: string; className?: string }): JSX.Element | null;
  // 'whatsapp' | 'line' → svg(fill currentColor), 'email' → 봉투 svg(stroke currentColor), 'wechat' → 그림, 그 밖 → null. 모두 aria-hidden
  ```
  **`FloatingCTA`의 모양은 달라지면 안 된다.** 같은 path를 `ChannelIcon`이 그리게 옮기는 것뿐이다. 테스트가 path 문자열의 해시(옮기기 전 값)를 확인한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`liv-clinic/src/components/ui/__tests__/ChannelIcon.test.tsx` 를 새로 만든다:

<!-- plan-check: full liv-clinic/src/components/ui/__tests__/ChannelIcon.test.tsx -->
```tsx
/**
 * 연락 채널 아이콘 (스펙 2026-10-01 §4.2, 결정 ⑩).
 * WhatsApp·LINE 그림은 사이트 오른쪽 단추(FloatingCTA)에 있던 것을 이 파일로 옮긴 것이다 —
 * 모양이 달라지면 안 되므로 path 문자열을 옮기기 전 값의 해시와 비교한다.
 * 환경은 `node`(jsdom 없음)라 react-dom/server 로 정적 마크업을 만들어 검사한다.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

vi.mock('next/image', () => ({
  default: (props: { src: string; alt: string; width: number; height: number; className?: string; 'aria-hidden'?: 'true' }) => (
    // eslint-disable-next-line @next/next/no-img-element -- 테스트 목: next/image 를 평범한 img 로 대체
    <img src={props.src} alt={props.alt} width={props.width} height={props.height} className={props.className} aria-hidden={props['aria-hidden']} />
  ),
}));

import ChannelIcon, { LINE_ICON_PATH, WECHAT_ICON_IMAGE, WHATSAPP_ICON_PATH } from '../ChannelIcon';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const SRC_DIR = path.resolve(__dirname, '..', '..', '..');
const PUBLIC_DIR = path.resolve(SRC_DIR, '..', 'public');

describe('ChannelIcon', () => {
  it.each(['whatsapp', 'line', 'email'])('%s: svg 아이콘을 그리고 aria-hidden 이다', (channel) => {
    const html = renderToStaticMarkup(<ChannelIcon channel={channel} className="w-5 h-5" />);
    expect(html.startsWith('<svg')).toBe(true);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('class="w-5 h-5"');
  });

  it('wechat: 사이트 오른쪽 단추와 같은 그림 파일을 쓰고 aria-hidden 이다', () => {
    const html = renderToStaticMarkup(<ChannelIcon channel="wechat" className="w-5 h-5" />);
    expect(html).toContain(`src="${WECHAT_ICON_IMAGE}"`);
    expect(html).toContain('alt=""');
    expect(html).toContain('aria-hidden="true"');
    expect(fs.existsSync(path.join(PUBLIC_DIR, WECHAT_ICON_IMAGE))).toBe(true);
  });

  it('whatsapp·line 은 currentColor 로 칠하고, email 은 선으로 그린다', () => {
    expect(renderToStaticMarkup(<ChannelIcon channel="whatsapp" />)).toContain('fill="currentColor"');
    expect(renderToStaticMarkup(<ChannelIcon channel="line" />)).toContain('fill="currentColor"');
    const email = renderToStaticMarkup(<ChannelIcon channel="email" />);
    expect(email).toContain('fill="none"');
    expect(email).toContain('stroke="currentColor"');
  });

  it('알 수 없는 채널은 아무것도 그리지 않는다', () => {
    expect(renderToStaticMarkup(<ChannelIcon channel="telegram" />)).toBe('');
    expect(renderToStaticMarkup(<ChannelIcon channel="" />)).toBe('');
  });

  it('WhatsApp·LINE 그림은 FloatingCTA 에 있던 것과 글자 하나까지 같다', () => {
    expect(WHATSAPP_ICON_PATH).toHaveLength(1104);
    expect(sha256(WHATSAPP_ICON_PATH)).toBe('281335ac991e0f1a4f6ff8da3b54714ad89f3e3f0e0cebd16abeb2e73ffa5bf4');
    expect(LINE_ICON_PATH).toHaveLength(1066);
    expect(sha256(LINE_ICON_PATH)).toBe('0669b7b2d3145af41634787e2e9684ece85843e381b840ca74d393c6260cbfaa');
  });

  it('FloatingCTA 는 그림을 따로 갖지 않고 ChannelIcon 을 가져다 쓴다', () => {
    const source = fs.readFileSync(path.join(SRC_DIR, 'components', 'layout', 'FloatingCTA.tsx'), 'utf8');
    expect(source).toContain("import ChannelIcon from '@/components/ui/ChannelIcon'");
    expect(source).toContain('<ChannelIcon channel="line" className="w-5 h-5" />');
    expect(source).toContain('<ChannelIcon channel="whatsapp" className="w-5 h-5" />');
    expect(source).not.toContain('M19.365 9.863');
    expect(source).not.toContain('M17.472 14.382');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/components/ui/__tests__/ChannelIcon.test.tsx`
Expected: FAIL — `Failed to resolve import "../ChannelIcon"`

- [ ] **Step 3: 구현**

`liv-clinic/src/components/ui/ChannelIcon.tsx` 를 새로 만든다. 두 path 문자열은 `FloatingCTA.tsx`의 `line`·`whatsapp` 항목에 있는 `<path d="…" />`의 값과 글자 하나까지 같다(아래에 이미 들어 있다 — 손으로 다시 치지 않는다):

<!-- plan-check: full liv-clinic/src/components/ui/ChannelIcon.tsx -->
```tsx
import Image from 'next/image';

// 연락 채널 아이콘 한 벌 — 사이트 오른쪽 단추(FloatingCTA)와 채팅 연락처 카드가 같은 그림을 쓴다.
// 꾸밈 요소라 aria-hidden 이다. 접근성 이름은 아이콘을 감싼 단추·링크가 갖는다.
// WhatsApp·LINE·이메일은 currentColor 로 그린다 — 색과 크기는 쓰는 쪽에서 className 으로 정한다.

/** WhatsApp 로고. FloatingCTA 에 있던 것을 그대로 옮겼다 — 글자 하나도 바꾸지 말 것(테스트가 해시로 확인한다). */
export const WHATSAPP_ICON_PATH =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';

/** LINE 로고. FloatingCTA 에 있던 것을 그대로 옮겼다 — 글자 하나도 바꾸지 말 것(테스트가 해시로 확인한다). */
export const LINE_ICON_PATH =
  'M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314';

/** WeChat 은 사이트 오른쪽 단추가 쓰는 그림 파일을 같이 쓴다. */
export const WECHAT_ICON_IMAGE = '/images/wechat-icon.png';

interface Props {
  /** 'whatsapp' | 'wechat' | 'line' | 'email'. 모르는 값이면 아무것도 그리지 않는다 */
  channel: string;
  className?: string;
}

export default function ChannelIcon({ channel, className }: Props) {
  if (channel === 'whatsapp') {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d={WHATSAPP_ICON_PATH} />
      </svg>
    );
  }
  if (channel === 'line') {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d={LINE_ICON_PATH} />
      </svg>
    );
  }
  if (channel === 'wechat') {
    return <Image src={WECHAT_ICON_IMAGE} alt="" aria-hidden="true" width={48} height={48} className={className} />;
  }
  if (channel === 'email') {
    return (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="M3.5 7.5l8.5 6 8.5-6" />
      </svg>
    );
  }
  return null;
}
```

- [ ] **Step 4: FloatingCTA 가 그 아이콘을 가져다 쓰게 한다**

`liv-clinic/src/components/layout/FloatingCTA.tsx` — import 한 줄을 더하고, `line`·`whatsapp` 항목의 `icon: ( <svg …>…</svg> ),` 블록을 한 줄로 바꾼다(지워지는 줄의 긴 문자열은 Step 3에서 옮긴 그 path다):

<!-- plan-check: added liv-clinic/src/components/layout/FloatingCTA.tsx -->
```diff
--- a/src/components/layout/FloatingCTA.tsx
+++ b/src/components/layout/FloatingCTA.tsx
@@ -8,6 +8,7 @@ import { SITE_INFO, SOCIAL_LINKS } from '@/lib/constants';
 import { trackContact } from '@/lib/analytics-events';
 import { buildWhatsAppLink } from '@/lib/messengerLinks';
 import WeChatQRModal from '@/components/ui/WeChatQRModal';
+import ChannelIcon from '@/components/ui/ChannelIcon';
 import type { Locale } from '@/i18n/routing';
 import { pickLocalized } from '@/lib/i18nFallback';
 type ContactMethod = 'instagram' | 'youtube' | 'phone' | 'kakao' | 'line' | 'whatsapp' | 'wechat';
@@ -73,11 +74,7 @@ const ctaButtons: Record<ContactMethod, CtaButton> = {
     id: 'line',
     label: { ko: 'LINE', en: 'LINE', ja: 'LINE', zh: 'LINE' },
     href: SOCIAL_LINKS.line,
-    icon: (
-      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
-        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
-      </svg>
-    ),
+    icon: <ChannelIcon channel="line" className="w-5 h-5" />,
     color: 'bg-[#00B900] hover:bg-[#00A000]',
     textColor: 'text-white',
   },
@@ -85,11 +82,7 @@ const ctaButtons: Record<ContactMethod, CtaButton> = {
     id: 'whatsapp',
     label: { ko: 'WhatsApp', en: 'WhatsApp', ja: 'WhatsApp', zh: 'WhatsApp' },
     href: SOCIAL_LINKS.whatsapp,
-    icon: (
-      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
-        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
-      </svg>
-    ),
+    icon: <ChannelIcon channel="whatsapp" className="w-5 h-5" />,
     color: 'bg-[#25D366] hover:bg-[#1DA851]',
     textColor: 'text-white',
   },
```

- [ ] **Step 5: 통과 확인 + 전체 회귀 + 타입 검사**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run && npx tsc --noEmit`
Expected: 56파일 860건 통과(ChannelIcon 8건 포함), tsc 출력 없음

- [ ] **Step 6: 커밋**

```bash
git add src/components/ui/ChannelIcon.tsx src/components/ui/__tests__/ChannelIcon.test.tsx src/components/layout/FloatingCTA.tsx
git commit -m "refactor(ui): 채널 아이콘을 ChannelIcon 으로 모음 — 이메일 아이콘 추가, 오른쪽 단추 모양은 그대로" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 14: 카드 문구 10개 × 11개 언어

**Files:**
- Create: `liv-clinic/scripts/_i18n-work/add-chat-contact-first-keys.mjs`
- Modify: `liv-clinic/src/messages/{ko,en,ja,zh,zh-TW,vi,th,ru,fr,mn,ar}.json` (스크립트로만 — 파일당 +10줄)

**Interfaces:**
- Consumes: 없음
- Produces: `chat` 네임스페이스의 신규 키 10개 — `captureBusyLead`, `captureChannelsLead`, `captureContactPlaceholderEmail`, `captureMessengerFallback`(`{code}`), `capturePrivacyNote`, `captureWechatLead`(`{code}`), `captureWechatIdLabel`, `captureEmailLead`(`{code}`), `captureCopy`, `captureCopied`. 기존 키는 값도 순서도 바꾸지 않는다. 쓰지 않게 되는 키(`captureContactSaved`, `captureContactPlaceholderLine`, `captureMessengerLead`)는 지우지 않는다.

**이 파일들을 Edit·Write 도구나 `JSON.stringify`로 고치지 않는다.** 줄바꿈이 섞여 있어(`\r\r\n`·`\r\n`·`\n`, 줄 중간의 고립된 `\r`) 다시 쓰면 파일 전체가 diff에 잡힌다. 아래 스크립트는 `\n`만 경계로 줄을 나누고 기존 `captureContactPlaceholderLine` 줄 바로 뒤에 새 줄만 끼워 넣는다.

- [ ] **Step 1: 삽입 스크립트 작성**

`liv-clinic/scripts/_i18n-work/add-chat-contact-first-keys.mjs` 를 새로 만든다. ko·ja·zh·zh-TW의 여덟 문구는 스펙 부록 A.4와 글자 하나까지 같아야 한다:

<!-- plan-check: full liv-clinic/scripts/_i18n-work/add-chat-contact-first-keys.mjs -->
```js
/**
 * chat 네임스페이스에 "연락처 먼저" 카드 문구 10개를 11개 로케일에 넣는다
 * (docs/superpowers/specs/2026-10-01-chat-contact-first-design.md §7, 부록 A.4).
 *
 * 메시지 JSON은 줄바꿈이 섞여 있고(\r\r\n · \r\n · \n) 줄 중간에 고립된 \r 도 있어
 * 다시 직렬화하거나 정규식으로 줄을 나누면 바이트가 바뀐다. \n 만 경계로 줄을 나누고,
 * 편집 전에 라운드트립(나눈 것을 그대로 이으면 원본과 같은가)을 확인한 뒤
 * 기존 chat 키 줄(captureContactPlaceholderLine) 바로 뒤에 새 줄만 끼워 넣는다.
 *
 * 실행 (liv-clinic 폴더에서):
 *   node scripts/_i18n-work/add-chat-contact-first-keys.mjs           # 미리보기 (파일을 바꾸지 않는다)
 *   node scripts/_i18n-work/add-chat-contact-first-keys.mjs --write   # 기록
 * 이미 들어 있는 파일은 건너뛴다(다시 돌려도 안전하다).
 *
 * ko·ja·zh·zh-TW 의 여덟 문구는 원장님이 미리보기에서 확인한 것(부록 A.4) 그대로다.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DIR = fileURLToPath(new URL('../../src/messages/', import.meta.url));
const LOCALES = ['ko', 'en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'];
const WRITE = process.argv.includes('--write');

/** 이 줄 바로 뒤에 넣는다 — chat 네임스페이스 안에 있고 11개 파일 모두 한 번씩만 나온다. */
const ANCHOR_KEY = 'captureContactPlaceholderLine';

const KEYS = [
  'captureBusyLead',
  'captureChannelsLead',
  'captureContactPlaceholderEmail',
  'captureMessengerFallback',
  'capturePrivacyNote',
  'captureWechatLead',
  'captureWechatIdLabel',
  'captureEmailLead',
  'captureCopy',
  'captureCopied',
];
/** {code} 변수가 꼭 들어 있어야 하는 키 */
const KEYS_WITH_CODE = ['captureMessengerFallback', 'captureWechatLead', 'captureEmailLead'];

const T = {
  ko: {
    captureBusyLead: '여기서 기다리지 않으셔도 됩니다. 연락처를 남겨 주시면 저희가 먼저 연락드립니다.',
    captureChannelsLead: '편한 방법으로 바로 연락하실 수 있습니다:',
    captureContactPlaceholderEmail: '이메일 주소',
    captureMessengerFallback: '그곳에서 코드 {code}를 보내 주세요. 열리지 않으면 아래에 연락처를 남겨 주세요.',
    capturePrivacyNote: '연락처는 이 문의에 답변드리는 데에만 사용합니다.',
    captureWechatLead: 'WeChat에서 이 QR을 스캔하거나 아이디를 복사해 검색해서 추가한 뒤, 코드 {code}를 보내 주세요.',
    captureWechatIdLabel: 'WeChat 아이디',
    captureEmailLead: '이 주소로 메일을 보내실 때 코드 {code}를 함께 적어 주세요.',
    captureCopy: '복사',
    captureCopied: '복사됨 ✓',
  },
  en: {
    captureBusyLead: "You don't have to wait here. Leave a contact and we'll reach out to you first.",
    captureChannelsLead: 'Reach us wherever is easiest for you:',
    captureContactPlaceholderEmail: 'Email address',
    captureMessengerFallback: "Send us the code {code} there. If it doesn't open, leave your contact below.",
    capturePrivacyNote: 'We use your contact only to reply to this inquiry.',
    captureWechatLead: 'Scan this QR code in WeChat, or copy our ID and search for it, to add us. Then send us the code {code}.',
    captureWechatIdLabel: 'WeChat ID',
    captureEmailLead: 'Email us at this address and include the code {code}.',
    captureCopy: 'Copy',
    captureCopied: 'Copied ✓',
  },
  ja: {
    captureBusyLead: 'こちらでお待ちいただく必要はありません。連絡先を残していただければ、こちらから先にご連絡します。',
    captureChannelsLead: 'ご都合のよい方法で直接ご連絡いただけます：',
    captureContactPlaceholderEmail: 'メールアドレス',
    captureMessengerFallback: 'そちらでコード {code} をお送りください。開かない場合は、下に連絡先をお残しください。',
    capturePrivacyNote: 'ご連絡先は、このお問い合わせへのご返信にのみ使用します。',
    captureWechatLead: 'WeChatでこのQRコードを読み取るか、IDをコピーして検索し、追加してください。その後、コード {code} をお送りください。',
    captureWechatIdLabel: 'WeChat ID',
    captureEmailLead: 'こちらのアドレスにメールをお送りください。コード {code} もあわせてご記入ください。',
    captureCopy: 'コピー',
    captureCopied: 'コピーしました ✓',
  },
  zh: {
    captureBusyLead: '您不必在这里等候。留下联系方式，我们会主动联系您。',
    captureChannelsLead: '您可以通过方便的方式直接联系我们：',
    captureContactPlaceholderEmail: '邮箱地址',
    captureMessengerFallback: '请在那里发送代码 {code}。如果无法打开，请在下方留下联系方式。',
    capturePrivacyNote: '您的联系方式仅用于回复本次咨询。',
    captureWechatLead: '请使用微信扫描二维码，或复制微信号搜索添加我们，然后发送代码 {code}。',
    captureWechatIdLabel: '微信号',
    captureEmailLead: '请发送邮件至此地址，并注明代码 {code}。',
    captureCopy: '复制',
    captureCopied: '已复制 ✓',
  },
  'zh-TW': {
    captureBusyLead: '您不必在這裡等候。留下聯絡方式，我們會主動聯絡您。',
    captureChannelsLead: '您可以透過方便的方式直接聯絡我們：',
    captureContactPlaceholderEmail: '電子郵件地址',
    captureMessengerFallback: '請在那裡傳送代碼 {code}。如果無法開啟，請在下方留下聯絡方式。',
    capturePrivacyNote: '您的聯絡方式僅用於回覆本次諮詢。',
    captureWechatLead: '請使用微信掃描 QR Code，或複製微信號搜尋加入我們，然後傳送代碼 {code}。',
    captureWechatIdLabel: '微信號',
    captureEmailLead: '請寄信至此地址，並註明代碼 {code}。',
    captureCopy: '複製',
    captureCopied: '已複製 ✓',
  },
  vi: {
    captureBusyLead: 'Bạn không cần chờ ở đây. Hãy để lại thông tin liên hệ, chúng tôi sẽ chủ động liên hệ với bạn.',
    captureChannelsLead: 'Liên hệ với chúng tôi qua kênh thuận tiện nhất cho bạn:',
    captureContactPlaceholderEmail: 'Địa chỉ email',
    captureMessengerFallback: 'Hãy gửi cho chúng tôi mã {code} tại đó. Nếu không mở được, hãy để lại thông tin liên hệ bên dưới.',
    capturePrivacyNote: 'Chúng tôi chỉ dùng thông tin liên hệ của bạn để trả lời yêu cầu này.',
    captureWechatLead: 'Quét mã QR này trong WeChat, hoặc sao chép ID của chúng tôi rồi tìm kiếm để kết bạn. Sau đó gửi cho chúng tôi mã {code}.',
    captureWechatIdLabel: 'ID WeChat',
    captureEmailLead: 'Gửi email cho chúng tôi theo địa chỉ này và ghi kèm mã {code}.',
    captureCopy: 'Sao chép',
    captureCopied: 'Đã sao chép ✓',
  },
  th: {
    captureBusyLead: 'ไม่จำเป็นต้องรอที่นี่ ฝากช่องทางติดต่อไว้ แล้วเราจะติดต่อกลับไปก่อนค่ะ',
    captureChannelsLead: 'ติดต่อเราได้ทางช่องทางที่คุณสะดวก:',
    captureContactPlaceholderEmail: 'อีเมล',
    captureMessengerFallback: 'กรุณาส่งรหัส {code} ให้เราทางนั้น หากเปิดไม่ได้ กรุณาฝากช่องทางติดต่อไว้ด้านล่าง',
    capturePrivacyNote: 'เราใช้ข้อมูลติดต่อของคุณเพื่อตอบกลับการสอบถามนี้เท่านั้น',
    captureWechatLead: 'สแกน QR โค้ดนี้ใน WeChat หรือคัดลอก ID ของเราไปค้นหาเพื่อเพิ่มเพื่อน จากนั้นส่งรหัส {code} ให้เรา',
    captureWechatIdLabel: 'WeChat ID',
    captureEmailLead: 'ส่งอีเมลมาที่อยู่นี้ และระบุรหัส {code}',
    captureCopy: 'คัดลอก',
    captureCopied: 'คัดลอกแล้ว ✓',
  },
  ru: {
    captureBusyLead: 'Вам не обязательно ждать здесь. Оставьте контакт, и мы сами свяжемся с вами.',
    captureChannelsLead: 'Свяжитесь с нами удобным для вас способом:',
    captureContactPlaceholderEmail: 'Адрес электронной почты',
    captureMessengerFallback: 'Отправьте нам там код {code}. Если не открывается, оставьте контакт ниже.',
    capturePrivacyNote: 'Мы используем ваш контакт только для ответа на этот запрос.',
    captureWechatLead: 'Отсканируйте этот QR-код в WeChat или скопируйте наш ID и найдите его, чтобы добавить нас. Затем отправьте нам код {code}.',
    captureWechatIdLabel: 'WeChat ID',
    captureEmailLead: 'Напишите нам на этот адрес и укажите код {code}.',
    captureCopy: 'Копировать',
    captureCopied: 'Скопировано ✓',
  },
  fr: {
    captureBusyLead: "Vous n'avez pas besoin d'attendre ici. Laissez un contact et nous vous recontacterons en premier.",
    captureChannelsLead: 'Contactez-nous par le moyen qui vous convient le mieux :',
    captureContactPlaceholderEmail: 'Adresse e-mail',
    captureMessengerFallback: "Envoyez-nous le code {code} là-bas. Si cela ne s'ouvre pas, laissez votre contact ci-dessous.",
    capturePrivacyNote: 'Nous utilisons votre contact uniquement pour répondre à cette demande.',
    captureWechatLead: 'Scannez ce QR code dans WeChat, ou copiez notre identifiant et recherchez-le pour nous ajouter. Envoyez-nous ensuite le code {code}.',
    captureWechatIdLabel: 'ID WeChat',
    captureEmailLead: 'Écrivez-nous à cette adresse en indiquant le code {code}.',
    captureCopy: 'Copier',
    captureCopied: 'Copié ✓',
  },
  mn: {
    captureBusyLead: 'Та энд хүлээх шаардлагагүй. Холбоо барих хаягаа үлдээвэл бид эхэлж тантай холбогдоно.',
    captureChannelsLead: 'Өөрт тохиромжтой сувгаар бидэнтэй холбогдоорой:',
    captureContactPlaceholderEmail: 'Имэйл хаяг',
    captureMessengerFallback: 'Тэнд бидэнд {code} кодыг илгээнэ үү. Нээгдэхгүй бол доор холбоо барих хаягаа үлдээнэ үү.',
    capturePrivacyNote: 'Таны холбоо барих мэдээллийг зөвхөн энэ лавлагаанд хариулахад ашиглана.',
    captureWechatLead: 'WeChat-аар энэ QR кодыг уншуулах эсвэл манай ID-г хуулж хайгаад биднийг нэмнэ үү. Дараа нь {code} кодыг илгээнэ үү.',
    captureWechatIdLabel: 'WeChat ID',
    captureEmailLead: 'Энэ хаягаар имэйл илгээхдээ {code} кодыг хамт бичнэ үү.',
    captureCopy: 'Хуулах',
    captureCopied: 'Хуулагдлаа ✓',
  },
  ar: {
    captureBusyLead: 'لا داعي للانتظار هنا. اترك وسيلة تواصل وسنتواصل معك نحن أولاً.',
    captureChannelsLead: 'تواصل معنا بالطريقة الأسهل لك:',
    captureContactPlaceholderEmail: 'عنوان البريد الإلكتروني',
    captureMessengerFallback: 'أرسل لنا الرمز {code} هناك. إذا لم يُفتح، اترك وسيلة تواصلك أدناه.',
    capturePrivacyNote: 'نستخدم وسيلة تواصلك للرد على هذا الاستفسار فقط.',
    captureWechatLead: 'امسح رمز QR هذا في WeChat، أو انسخ معرّفنا وابحث عنه لإضافتنا. ثم أرسل لنا الرمز {code}.',
    captureWechatIdLabel: 'معرّف WeChat',
    captureEmailLead: 'راسلنا على هذا العنوان واذكر الرمز {code}.',
    captureCopy: 'نسخ',
    captureCopied: 'تم النسخ ✓',
  },
};

/** \n 만 경계로 줄을 나눈다 — 각 조각은 자기 줄바꿈 바이트를 그대로 갖는다. */
function splitLines(raw) {
  const out = [];
  let start = 0;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '\n') {
      out.push(raw.slice(start, i + 1));
      start = i + 1;
    }
  }
  if (start < raw.length) out.push(raw.slice(start));
  return out;
}
const eolOf = (line) => (line.match(/\r*\n$/) || ['\n'])[0];
const indentOf = (line) => (line.match(/^[ \t]*/) || [''])[0];

// 문구 표 자체를 먼저 점검한다 — 한 언어라도 키가 빠지면 아무 파일도 건드리지 않는다.
for (const locale of LOCALES) {
  const t = T[locale];
  if (!t) throw new Error(`${locale}: 문구가 없습니다`);
  for (const key of KEYS) {
    if (typeof t[key] !== 'string' || t[key].trim() === '') throw new Error(`${locale}.${key}: 비어 있습니다`);
  }
  if (Object.keys(t).length !== KEYS.length) throw new Error(`${locale}: 키 개수가 ${KEYS.length}개가 아닙니다`);
  for (const key of KEYS_WITH_CODE) {
    if (!t[key].includes('{code}')) throw new Error(`${locale}.${key}: {code} 가 없습니다`);
  }
}

let failed = 0;
for (const locale of LOCALES) {
  const file = `${DIR}${locale}.json`;
  const raw = readFileSync(file, 'utf8');
  const lines = splitLines(raw);
  if (lines.join('') !== raw) {
    console.log(`!! ${locale}: 라운드트립 실패 — 건드리지 않음`);
    failed++;
    continue;
  }
  const before = JSON.parse(raw);
  if (before.chat?.[KEYS[0]] !== undefined) {
    console.log(`-- ${locale}: 이미 있음, 건너뜀`);
    continue;
  }

  const anchors = lines
    .map((line, index) => (line.trimStart().startsWith(`"${ANCHOR_KEY}":`) ? index : -1))
    .filter((index) => index >= 0);
  if (anchors.length !== 1 || before.chat?.[ANCHOR_KEY] === undefined) {
    console.log(`!! ${locale}: 앵커 줄을 찾지 못함 (${anchors.length}개)`);
    failed++;
    continue;
  }
  const anchor = anchors[0];
  if (!lines[anchor].replace(/\r*\n$/, '').endsWith(',')) {
    console.log(`!! ${locale}: 앵커 줄이 쉼표로 끝나지 않음`);
    failed++;
    continue;
  }

  const eol = eolOf(lines[anchor]);
  const indent = indentOf(lines[anchor]);
  const block = KEYS.map((key) => `${indent}${JSON.stringify(key)}: ${JSON.stringify(T[locale][key])},${eol}`);
  lines.splice(anchor + 1, 0, ...block);
  const out = lines.join('');

  let after;
  try {
    after = JSON.parse(out);
  } catch (err) {
    console.log(`!! ${locale}: JSON 깨짐 ${err.message}`);
    failed++;
    continue;
  }
  const valuesOk = KEYS.every((key) => after.chat[key] === T[locale][key]);
  const othersOk = Object.keys(before.chat).every((key) => after.chat[key] === before.chat[key]);
  const sizeOk = out.length === raw.length + block.join('').length;
  if (!valuesOk || !othersOk || !sizeOk) {
    console.log(`!! ${locale}: 삽입 결과 검증 실패`);
    failed++;
    continue;
  }

  console.log(`${WRITE ? '기록' : '미리보기'} ${locale} (+${block.length}줄, chat 키 ${Object.keys(after.chat).length}개)`);
  if (WRITE) writeFileSync(file, out, 'utf8');
}
console.log(failed ? `실패 ${failed}건` : '전체 정상');
if (failed) process.exitCode = 1;
```

- [ ] **Step 2: 미리보기 (파일을 바꾸지 않는다)**

Run: `node scripts/_i18n-work/add-chat-contact-first-keys.mjs`
Expected: 11줄 `미리보기 <언어> (+10줄, chat 키 60개)` 와 마지막 줄 `전체 정상`. `git status --short src/messages` 는 비어 있다.

- [ ] **Step 3: 기록**

Run: `node scripts/_i18n-work/add-chat-contact-first-keys.mjs --write`
Expected: 11줄 `기록 <언어> (+10줄, chat 키 60개)` 와 `전체 정상`

- [ ] **Step 4: 바이트 보존 검증**

Run: `git diff --numstat src/messages`
Expected: 11개 파일 모두 정확히 `10	0` (추가 10줄, 삭제 0줄). 한 파일이라도 다르면 `git checkout -- src/messages` 로 되돌리고 원인을 찾는다.

Run: `npm run verify:i18n`
Expected: `✓ all master keys present` (종료 코드 0)

Run: `node scripts/_i18n-work/add-chat-contact-first-keys.mjs --write`
Expected: 11줄 `-- <언어>: 이미 있음, 건너뜀` (다시 돌려도 바뀌지 않는다)

- [ ] **Step 5: 커밋**

```bash
git add scripts/_i18n-work/add-chat-contact-first-keys.mjs src/messages
git commit -m "feat(chat): 연락처 카드 문구 10개를 11개 언어에 추가(바이트 보존 삽입)" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 15: 손님 화면 — 연락처 카드와 패널

**Files:**
- Create: `liv-clinic/src/lib/chat/messageList.ts`, `liv-clinic/src/lib/copyText.ts`
- Modify: `liv-clinic/src/lib/chat/chatApi.ts`, `liv-clinic/src/hooks/useChatRealtime.ts`
- Modify: `liv-clinic/src/components/chat/ChatCaptureBlock.tsx` (파일 전체 교체), `liv-clinic/src/components/chat/ChatPanel.tsx` (파일 전체 교체)
- Modify: `liv-clinic/src/lib/chat/contactChannels.ts` (`CONTACT_CHANNELS` 삭제)
- Test: `liv-clinic/src/lib/chat/__tests__/messageList.test.ts`, `liv-clinic/src/components/chat/__tests__/ChatCaptureBlock.test.tsx` (둘 다 신규)

**Interfaces:**
- Consumes: `orderedLinkChannels`, `defaultFormChannel`, `CONTACT_FORM_CHANNELS`, `CONTACT_CHANNEL_LABELS`, `validateContactHandle`, `buildChatRefCode`, `shouldShowCaptureBlock`, `parseCaptureDismissedAt` (Task 3); `CHAT_CONTACT_EMAIL` (Task 3), `WECHAT_ID`·`WECHAT_QR_IMAGE` (이미 있다); `ChannelIcon` (Task 13); `chat.capture*` 신규 키 10개 (Task 14); `MessageBubble` (Task 12); 서버 응답 — `POST /api/chat/messages` 의 `contact`, `GET /api/chat/sessions?token=` 의 `hasContact`, `GET /api/chat/messages` 의 `source` (Task 9); `POST /api/chat/contact` 의 `kind` (Task 6)
- Produces:
  ```ts
  // src/lib/chat/messageList.ts — 순수
  export function upsertMessage<T extends { id: string; created_at: string }>(list: T[], message: T): T[];
  export function countVisitorText(list: Array<{ sender: string; original_text: string }>, text: string): number;

  // src/lib/copyText.ts
  export async function copyText(text: string): Promise<boolean>;

  // src/lib/chat/chatApi.ts
  export interface VisitorSendResult { message: ChatMessage; contact: { saved: boolean; hasContact: boolean } | null }
  export async function sendVisitorMessage(sessionToken: string, text: string): Promise<VisitorSendResult>; // 반환 타입 변경
  export async function fetchSessionInfo(sessionToken: string): Promise<{ hasContact: boolean }>;
  export async function saveContact(sessionToken: string, channel: ContactChannel, handle: string): Promise<void>; // 요청에 kind:'save'
  export function reportContactClick(sessionToken: string, channel: ContactChannel): void; // 응답을 기다리지 않는다

  // src/components/chat/ChatCaptureBlock.tsx
  props: { locale: VisitorLocale; sessionId: string; sessionToken: string; businessHours: boolean; nextOpenAt: string | null; onDismiss: () => void; onSaved: () => void }
  ```
  카드의 배치는 원장님이 확인한 미리보기(초안 2)와 같다: 제목 → 안내 한 줄 → 단추 네 개(아이콘 위, 이름 아래) → (펼친 블록) → 코드 안내 → 연락처 남기기 칩 세 개 + 입력칸 + 저장 → 개인정보 한 줄.

- [ ] **Step 1: 실패하는 테스트 작성 (메시지 목록)**

`liv-clinic/src/lib/chat/__tests__/messageList.test.ts` 를 새로 만든다:

<!-- plan-check: full liv-clinic/src/lib/chat/__tests__/messageList.test.ts -->
```ts
import { describe, it, expect } from 'vitest';
import { countVisitorText, upsertMessage } from '../messageList';

const msg = (id: string, created_at: string, extra: Record<string, unknown> = {}) => ({ id, created_at, ...extra });

describe('upsertMessage', () => {
  it('없는 글은 덧붙이고 시간순으로 둔다', () => {
    const list = [msg('a', '2026-10-05T03:00:00Z'), msg('c', '2026-10-05T03:00:05Z')];
    const next = upsertMessage(list, msg('b', '2026-10-05T03:00:02Z'));
    expect(next.map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });

  it('같은 id가 있으면 새 것으로 바꾼다 (번역 전 상태 → 완성본)', () => {
    const list = [msg('a', '2026-10-05T03:00:00Z', { translation_status: 'pending' })];
    const next = upsertMessage(list, msg('a', '2026-10-05T03:00:00Z', { translation_status: 'success' }));
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ id: 'a', translation_status: 'success' });
  });

  it('원래 목록을 바꾸지 않는다', () => {
    const list = [msg('a', '2026-10-05T03:00:00Z')];
    upsertMessage(list, msg('b', '2026-10-05T02:00:00Z'));
    expect(list.map((m) => m.id)).toEqual(['a']);
  });
});

describe('countVisitorText', () => {
  const list = [
    { sender: 'visitor', original_text: 'hello' },
    { sender: 'operator', original_text: 'hello' },
    { sender: 'visitor', original_text: 'hello' },
    { sender: 'visitor', original_text: 'price?' },
  ];
  it('손님 글 가운데 내용이 같은 것만 센다', () => {
    expect(countVisitorText(list, 'hello')).toBe(2);
    expect(countVisitorText(list, 'price?')).toBe(1);
    expect(countVisitorText(list, 'none')).toBe(0);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/messageList.test.ts`
Expected: FAIL — `Failed to resolve import "../messageList"`

- [ ] **Step 3: 구현 (메시지 목록)**

`liv-clinic/src/lib/chat/messageList.ts` 를 새로 만든다:

<!-- plan-check: full liv-clinic/src/lib/chat/messageList.ts -->
```ts
// 손님 화면의 메시지 목록을 다루는 순수 함수 — 브라우저 API 접근 없음.
// 자동 안내를 번역·응답보다 먼저 보내면서(스펙 2026-10-01 §4.1) 손님 자신의 글이
// "broadcast로 먼저 불러온 번역 전 상태"와 "전송 응답으로 온 완성본" 두 길로 도착하게 됐다.

interface ListMessage {
  id: string;
  created_at: string;
}

/** 목록에 한 건을 넣는다. 같은 id가 이미 있으면 새 것으로 바꾼다. 시간순 정렬을 유지한다. */
export function upsertMessage<T extends ListMessage>(list: T[], message: T): T[] {
  const next = list.some((m) => m.id === message.id)
    ? list.map((m) => (m.id === message.id ? message : m))
    : [...list, message];
  next.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  return next;
}

/** 손님이 쓴 글 가운데 내용이 text 와 같은 것의 개수. */
export function countVisitorText(list: Array<{ sender: string; original_text: string }>, text: string): number {
  return list.filter((m) => m.sender === 'visitor' && m.original_text === text).length;
}
```

- [ ] **Step 4: 통과 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/lib/chat/__tests__/messageList.test.ts`
Expected: PASS — 4건

- [ ] **Step 5: 손님 화면 fetch 래퍼**

`liv-clinic/src/lib/chat/chatApi.ts`:

<!-- plan-check: added liv-clinic/src/lib/chat/chatApi.ts -->
```diff
--- a/src/lib/chat/chatApi.ts
+++ b/src/lib/chat/chatApi.ts
@@ -85,10 +85,19 @@ export async function fetchVisitorMessages(
   return json.messages;
 }
 
+export interface VisitorSendResult {
+  message: ChatMessage;
+  /**
+   * saved: 서버가 이 글 속 이메일을 연락처로 저장했다. hasContact: 지금 연락처(이메일·메신저)가 있다 — 연락처 카드를 숨길지 판단한다.
+   * 배포 직후 옛 서버가 응답하면 없을 수 있어 null을 허용한다.
+   */
+  contact: { saved: boolean; hasContact: boolean } | null;
+}
+
 export async function sendVisitorMessage(
   sessionToken: string,
   text: string
-): Promise<ChatMessage> {
+): Promise<VisitorSendResult> {
   const res = await fetch('/api/chat/messages', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
@@ -98,8 +107,21 @@ export async function sendVisitorMessage(
     const err = await safeJson(res);
     throw new ChatApiError(res.status, err?.error ?? 'send_failed', err);
   }
-  const json = (await res.json()) as { message: ChatMessage };
-  return json.message;
+  const json = (await res.json()) as {
+    message: ChatMessage;
+    contact?: { saved: boolean; hasContact: boolean };
+  };
+  return { message: json.message, contact: json.contact ?? null };
+}
+
+/** 세션의 연락처 유무 — 패널을 열 때 연락처 카드를 띄울지 판단한다. 연락처 값 자체는 받지 않는다. */
+export async function fetchSessionInfo(sessionToken: string): Promise<{ hasContact: boolean }> {
+  const url = new URL('/api/chat/sessions', window.location.origin);
+  url.searchParams.set('token', sessionToken);
+  const res = await fetch(url.toString());
+  if (!res.ok) throw new ChatApiError(res.status, 'session_info_failed');
+  const json = (await res.json()) as { hasContact?: boolean };
+  return { hasContact: Boolean(json.hasContact) };
 }
 
 export async function sendOperatorMessage(
@@ -119,7 +141,7 @@ export async function sendOperatorMessage(
   return json.message;
 }
 
-// 오프시간 캡처 블록: 방문자 메신저 연락처 저장
+// 연락처 카드: 손님이 자기 연락처(WhatsApp 번호·WeChat ID·이메일)를 남긴다
 export async function saveContact(
   sessionToken: string,
   channel: ContactChannel,
@@ -128,7 +150,7 @@ export async function saveContact(
   const res = await fetch('/api/chat/contact', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
-    body: JSON.stringify({ sessionToken, channel, handle }),
+    body: JSON.stringify({ sessionToken, channel, handle, kind: 'save' }),
   });
   if (!res.ok) {
     const err = await safeJson(res);
@@ -136,6 +158,23 @@ export async function saveContact(
   }
 }
 
+/**
+ * 연락처 카드: 손님이 병원 연락 단추(WhatsApp·WeChat·LINE·이메일)를 눌렀음을 알린다 → 직원 Slack 방에 한 줄.
+ * 화면 이동(새 창·메일 앱)을 막지 않도록 응답을 기다리지 않고, 실패해도 조용히 넘어간다.
+ */
+export function reportContactClick(sessionToken: string, channel: ContactChannel): void {
+  try {
+    void fetch('/api/chat/contact', {
+      method: 'POST',
+      headers: { 'Content-Type': 'application/json' },
+      body: JSON.stringify({ sessionToken, channel, kind: 'click' }),
+      keepalive: true,
+    }).catch(() => {});
+  } catch {
+    // fetch 자체를 쓸 수 없는 환경 — 무시
+  }
+}
+
 export async function closeSession(sessionId: string): Promise<void> {
   const res = await fetch(`/api/chat/sessions/${sessionId}`, {
     method: 'PATCH',
```

- [ ] **Step 6: 같은 글이 두 길로 도착할 때 완성본으로 바꾼다**

`liv-clinic/src/hooks/useChatRealtime.ts`:

<!-- plan-check: added liv-clinic/src/hooks/useChatRealtime.ts -->
```diff
--- a/src/hooks/useChatRealtime.ts
+++ b/src/hooks/useChatRealtime.ts
@@ -3,6 +3,7 @@
 import { useEffect, useRef, useState, useCallback } from 'react';
 import { createClient } from '@/lib/supabase-browser';
 import { fetchVisitorMessages, type ChatMessage } from '@/lib/chat/chatApi';
+import { upsertMessage } from '@/lib/chat/messageList';
 
 interface UseChatRealtimeArgs {
   sessionId: string | null;
@@ -86,13 +87,13 @@ export function useChatRealtime(args: UseChatRealtimeArgs): UseChatRealtimeRetur
   }, [enabled, sessionId, refresh]);
 
   const appendOptimistic = useCallback((msg: ChatMessage) => {
-    setMessages((prev) => {
-      if (prev.some((m) => m.id === msg.id)) return prev;
-      const next = [...prev, msg];
-      next.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
-      return next;
-    });
-    lastFetchedAtRef.current = msg.created_at;
+    // 같은 글이 이미 목록에 있을 수 있다 — 자동 안내의 broadcast가 전송 응답보다 먼저 도착해
+    // 번역 전 상태로 불러온 경우다. 그때는 응답으로 온 완성본으로 바꾼다.
+    setMessages((prev) => upsertMessage(prev, msg));
+    // 워터마크는 앞으로만 움직인다 — 이미 더 늦은 글(자동 안내)까지 불러왔으면 되돌리지 않는다.
+    if (!lastFetchedAtRef.current || msg.created_at > lastFetchedAtRef.current) {
+      lastFetchedAtRef.current = msg.created_at;
+    }
   }, []);
 
   return { messages, loading, error, appendOptimistic, refresh };
```

- [ ] **Step 7: 클립보드 복사 유틸**

`liv-clinic/src/lib/copyText.ts` 를 새로 만든다(`WeChatInfo.tsx`의 복사 로직과 같은 방식 — 그 파일은 건드리지 않는다):

<!-- plan-check: full liv-clinic/src/lib/copyText.ts -->
```ts
/**
 * 글자를 클립보드에 복사한다 (브라우저 전용). 실패하면 false — 손님은 글자를 길게 눌러 직접 복사할 수 있다.
 * Clipboard API 를 쓸 수 없는 환경(일부 인앱 브라우저·http)에서는 임시 textarea 로 대신한다.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      return document.execCommand('copy');
    } finally {
      document.body.removeChild(ta);
    }
  } catch {
    return false;
  }
}
```

- [ ] **Step 8: 실패하는 테스트 작성 (카드)**

`liv-clinic/src/components/chat/__tests__/ChatCaptureBlock.test.tsx` 를 새로 만든다:

<!-- plan-check: full liv-clinic/src/components/chat/__tests__/ChatCaptureBlock.test.tsx -->
```tsx
/**
 * 연락처 카드 (스펙 2026-10-01 §4.2, 결정 ⑦·⑩).
 * 환경은 `node`(jsdom 없음)라 react-dom/server 로 처음 그려지는 모습(정적 마크업)을 검사한다.
 * 단추를 눌렀을 때의 동작(펼치기·복사·저장)은 브라우저 확인 단계에서 본다.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentProps, ReactNode } from 'react';

const state = vi.hoisted(() => ({ locale: 'en' as 'en' | 'ja' | 'zh' }));

vi.mock('next-intl', async () => {
  const messages = {
    en: (await import('@/messages/en.json')).default,
    ja: (await import('@/messages/ja.json')).default,
    zh: (await import('@/messages/zh.json')).default,
  } as unknown as Record<string, Record<string, Record<string, unknown>>>;
  return {
    useTranslations: (namespace: string) => (key: string, values?: Record<string, string>) => {
      const value = messages[state.locale][namespace]?.[key];
      if (typeof value !== 'string') throw new Error(`missing message: ${state.locale}.${namespace}.${key}`);
      return value.replace(/\{(\w+)\}/g, (_m, name: string) => values?.[name] ?? `{${name}}`);
    },
  };
});

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ initial, animate, exit, transition, ...rest }: Record<string, unknown>) => {
      void initial; void animate; void exit; void transition;
      return <div {...(rest as ComponentProps<'div'>)} />;
    },
  },
}));

vi.mock('next/image', () => ({
  default: (props: { src: string; alt: string; width: number; height: number; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- 테스트 목: next/image 를 평범한 img 로 대체
    <img src={props.src} alt={props.alt} width={props.width} height={props.height} className={props.className} />
  ),
}));

vi.mock('@/lib/analytics-events', () => ({
  trackChatCaptureShown: vi.fn(),
  trackChatCaptureMessengerClick: vi.fn(),
  trackChatContactSaved: vi.fn(),
}));

import ChatCaptureBlock from '../ChatCaptureBlock';

const SESSION_ID = 'a1b2c3d4-0000-0000-0000-000000000000';

function render(locale: 'en' | 'ja' | 'zh', over: Partial<ComponentProps<typeof ChatCaptureBlock>> = {}) {
  state.locale = locale;
  return renderToStaticMarkup(
    <ChatCaptureBlock
      locale={locale}
      sessionId={SESSION_ID}
      sessionToken="11111111-2222-3333-4444-555555555555"
      businessHours
      nextOpenAt={null}
      onDismiss={() => {}}
      onSaved={() => {}}
      {...over}
    />
  );
}

/** "병원으로 바로 연락하기" 단추 묶음(role=group) 안의 단추 이름을 순서대로. */
function tileLabels(html: string): string[] {
  const group = /<div[^>]*role="group"[^>]*>(.*?)<\/div>/.exec(html)?.[1] ?? '';
  return [...group.matchAll(/<span>([^<]+)<\/span>/g)].map((m) => m[1]);
}
/** "연락처 남기기" 칩(role=radio)의 이름과 선택 여부. */
function chips(html: string): Array<{ label: string; checked: boolean }> {
  return [...html.matchAll(/<button[^>]*role="radio"[^>]*aria-checked="(true|false)"[^>]*>(.*?)<\/button>/g)].map((m) => ({
    label: m[2].replace(/<[^>]+>/g, ''),
    checked: m[1] === 'true',
  }));
}

describe('ChatCaptureBlock — 병원으로 바로 연락하기 단추 네 개', () => {
  it('영어 화면: WhatsApp · WeChat · LINE · Email 순서', () => {
    expect(tileLabels(render('en'))).toEqual(['WhatsApp', 'WeChat', 'LINE', 'Email']);
  });

  it('일본어 화면은 LINE, 중국어 화면은 WeChat 이 맨 앞 — 이메일은 늘 맨 뒤', () => {
    expect(tileLabels(render('ja'))).toEqual(['LINE', 'WhatsApp', 'WeChat', 'Email']);
    expect(tileLabels(render('zh'))).toEqual(['WeChat', 'WhatsApp', 'LINE', 'Email']);
  });

  it('WhatsApp·LINE 은 병원 계정을 새 창으로 여는 링크다', () => {
    const html = render('en');
    expect(html).toContain('href="https://wa.me/821068882773?text=');
    expect(html).toContain(encodeURIComponent('(code: A1B2C3D4)'));
    expect(html).toContain('href="https://line.me/ti/p/VJYu9BSnsX"');
    expect(html).not.toContain('weixin://');
  });

  it('단추마다 아이콘이 있고 꾸밈(aria-hidden)이다', () => {
    const group = /<div[^>]*role="group"[^>]*>(.*?)<\/div>/.exec(render('en'))?.[1] ?? '';
    expect((group.match(/<svg/g) ?? []).length).toBe(3); // WhatsApp·LINE·Email
    expect(group).toContain('src="/images/wechat-icon.png"');
  });
});

describe('ChatCaptureBlock — 병원 WeChat QR·아이디, 병원 이메일', () => {
  it('중국어 화면은 WeChat 블록을 펼친 채로 보여 준다 (QR + 아이디 + 복사)', () => {
    const html = render('zh');
    expect(html).toContain('src="/images/wechat-qr-code.png"');
    expect(html).toContain('livps0414');
    expect(html).toContain('微信号');
    expect(html).toContain('复制');
    expect(html).toContain('然后发送代码 #A1B2C3D4。');
  });

  it('다른 화면에서는 눌러야 펼쳐진다 — 처음에는 QR 이 없다', () => {
    expect(render('en')).not.toContain('wechat-qr-code.png');
    expect(render('ja')).not.toContain('wechat-qr-code.png');
  });

  it('병원 이메일 주소는 이메일 단추를 눌러야 보인다', () => {
    for (const locale of ['en', 'ja', 'zh'] as const) {
      const html = render(locale);
      expect(html).not.toContain('mailto:');
      expect(html).not.toContain('jaeho19@gmail.com');
    }
  });
});

describe('ChatCaptureBlock — 연락처 남기기', () => {
  it('칩은 WhatsApp · WeChat · Email — LINE 아이디는 받지 않는다', () => {
    expect(chips(render('en')).map((c) => c.label)).toEqual(['WhatsApp', 'WeChat', 'Email']);
  });

  it('기본 선택: 영어 WhatsApp, 일본어 Email, 중국어 WeChat', () => {
    expect(chips(render('en')).find((c) => c.checked)?.label).toBe('WhatsApp');
    expect(chips(render('ja')).find((c) => c.checked)?.label).toBe('Email');
    expect(chips(render('zh')).find((c) => c.checked)?.label).toBe('WeChat');
  });

  it('입력칸 안내 글자는 고른 채널을 따른다', () => {
    expect(render('en')).toContain('placeholder="WhatsApp number (e.g. +1 234 567 8900)"');
    expect(render('ja')).toContain('placeholder="メールアドレス"');
    expect(render('ja')).toContain('type="email"');
    expect(render('zh')).toContain('placeholder="微信号"');
  });
});

describe('ChatCaptureBlock — 안내 문구', () => {
  it('영업시간 중에는 "기다리지 않으셔도 됩니다"', () => {
    const html = render('en', { businessHours: true });
    expect(html).toContain('You don&#x27;t have to wait here. Leave a contact and we&#x27;ll reach out to you first.');
  });

  it('상담 시간 외에는 복귀 시각(한국 시각 + 손님 현지 시각)', () => {
    const html = render('en', { businessHours: false, nextOpenAt: '2026-10-05T01:00:00Z' });
    expect(html).toContain('(Korea time)');
    expect(html).toContain('Mon 10:00');
    expect(html).not.toContain('have to wait here');
  });

  it('제목·단추 위 안내·코드 안내·개인정보 안내가 있다', () => {
    const html = render('en');
    expect(html).toContain('Don&#x27;t miss our reply');
    expect(html).toContain('Reach us wherever is easiest for you:');
    expect(html).toContain('Mention this code so we can find your chat: #A1B2C3D4');
    expect(html).toContain('We use your contact only to reply to this inquiry.');
  });

  it('단추를 누르기 전에는 "그곳에서 코드를 보내 주세요" 안내와 저장 완료 표시가 없다', () => {
    const html = render('en');
    expect(html).not.toContain('Send us the code');
    expect(html).not.toContain('Saved!');
  });
});
```

- [ ] **Step 9: 실패 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/components/chat/__tests__/ChatCaptureBlock.test.tsx`
Expected: FAIL — 지금의 카드는 단추 묶음(`role="group"`)이 없고 칩이 WhatsApp·WeChat·LINE이라 대부분의 테스트가 실패한다.

- [ ] **Step 10: 카드 구현**

`liv-clinic/src/components/chat/ChatCaptureBlock.tsx` 를 아래 내용으로 교체한다:

<!-- plan-check: full liv-clinic/src/components/chat/ChatCaptureBlock.tsx -->
```tsx
'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  CONTACT_CHANNEL_LABELS,
  CONTACT_FORM_CHANNELS,
  buildChatRefCode,
  defaultFormChannel,
  orderedLinkChannels,
  validateContactHandle,
  type ContactChannel,
  type ContactFormChannel,
} from '@/lib/chat/contactChannels';
import { buildWhatsAppLink, LINE_LINK } from '@/lib/messengerLinks';
import { CHAT_CONTACT_EMAIL, WECHAT_ID, WECHAT_QR_IMAGE } from '@/lib/constants';
import { saveContact, reportContactClick, ChatApiError, type VisitorLocale } from '@/lib/chat/chatApi';
import { copyText } from '@/lib/copyText';
import {
  trackChatCaptureShown,
  trackChatCaptureMessengerClick,
  trackChatContactSaved,
} from '@/lib/analytics-events';
import ChannelIcon from '@/components/ui/ChannelIcon';
import WeChatQRModal from '@/components/ui/WeChatQRModal';

// 연락처 카드 (스펙 2026-10-01 §4.2). 손님이 답을 기다리는 동안 대화 아래에 뜬다 — 띄울지는 ChatPanel 이 정한다.
//   위: 병원으로 바로 연락하기 — WhatsApp·WeChat·LINE·이메일 단추 네 개(아이콘 + 이름)
//   아래: 연락처 남기기 — WhatsApp 번호·WeChat ID·이메일 (LINE ID 는 받지 않는다)
// 단추를 눌러도 카드는 닫히지 않는다. 저장에 성공하면 onSaved 로 알리고 카드가 사라진다(확인은 대화창의 시스템 메시지).

interface Props {
  locale: VisitorLocale;
  sessionId: string;
  sessionToken: string;
  /** 영업시간 중인가 — 노출 조건이 아니라 안내 한 줄만 가른다 */
  businessHours: boolean;
  nextOpenAt: string | null;
  /** ✕ 로 닫았다 (닫은 시각을 기억하는 일은 ChatPanel 이 한다) */
  onDismiss: () => void;
  /** 연락처 저장에 성공했다 */
  onSaved: () => void;
}

type ExpandedPanel = 'wechat' | 'email' | null;

// 단추의 아이콘 색 — 브랜드 색. 선택된 칩 안에서는 흰색으로 바뀐다.
const ICON_COLOR: Record<ContactChannel, string> = {
  whatsapp: 'text-[#25D366]',
  line: 'text-[#00B900]',
  wechat: '',
  email: 'text-[#6d4e42]',
};

const PLACEHOLDER_KEY: Record<ContactFormChannel, string> = {
  whatsapp: 'captureContactPlaceholderWhatsapp',
  wechat: 'captureContactPlaceholderWechat',
  email: 'captureContactPlaceholderEmail',
};

function formatReturnTime(iso: string, locale: string, timeZone?: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...(timeZone ? { timeZone } : {}),
    }).format(d);
  } catch {
    // 알 수 없는 로케일/타임존이어도 블록의 나머지는 정상 노출 (spec §12)
    return null;
  }
}

export default function ChatCaptureBlock({
  locale,
  sessionId,
  sessionToken,
  businessHours,
  nextOpenAt,
  onDismiss,
  onSaved,
}: Props) {
  const t = useTranslations('chat');
  const linkChannels = orderedLinkChannels(locale);
  // 중국어 화면은 1순위가 WeChat 이라 병원 QR·아이디를 펼친 채로 보여 준다.
  const [expanded, setExpanded] = useState<ExpandedPanel>(() => (linkChannels[0] === 'wechat' ? 'wechat' : null));
  const [openedMessenger, setOpenedMessenger] = useState(false);
  const [formChannel, setFormChannel] = useState<ContactFormChannel>(() => defaultFormChannel(locale));
  const [handle, setHandle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [copied, setCopied] = useState<ExpandedPanel>(null);
  const shownTrackedRef = useRef(false);
  const reportedRef = useRef<Set<ContactChannel>>(new Set());
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shownTrackedRef.current) {
      shownTrackedRef.current = true;
      trackChatCaptureShown(locale);
    }
  }, [locale]);

  useEffect(
    () => () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    },
    []
  );

  const refCode = buildChatRefCode(sessionId);
  const codeLabel = `#${refCode}`;
  const prefill = t('whatsappPrefillChat', { code: refCode });

  const kst = nextOpenAt ? formatReturnTime(nextOpenAt, locale, 'Asia/Seoul') : null;
  const local = nextOpenAt ? formatReturnTime(nextOpenAt, locale) : null;
  const lead = businessHours ? t('captureBusyLead') : kst && local ? t('captureReturnAt', { kst, local }) : null;

  /** WeChat·이메일 블록을 펼치거나 접는다 — 한 번에 하나만. */
  const togglePanel = (panel: 'wechat' | 'email') => {
    setExpanded((cur) => (cur === panel ? null : panel));
    // 펼친 블록이 대화창 아래로 잘리지 않게, 그려진 뒤 보이는 곳까지만 스크롤한다
    requestAnimationFrame(() => expandedRef.current?.scrollIntoView({ block: 'nearest' }));
  };

  /** 병원 연락 단추를 실제로 썼다 — 직원 Slack 방에 한 줄. 같은 채널은 카드당 한 번만 알린다. */
  const reportClick = (channel: ContactChannel) => {
    trackChatCaptureMessengerClick(channel, locale);
    if (reportedRef.current.has(channel)) return;
    reportedRef.current.add(channel);
    reportContactClick(sessionToken, channel);
  };

  const handleCopy = async (panel: 'wechat' | 'email', value: string) => {
    reportClick(panel);
    if (!(await copyText(value))) return;
    setCopied(panel);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = handle.trim();
    if (!validateContactHandle(formChannel, trimmed)) {
      setError(t('captureContactInvalid'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveContact(sessionToken, formChannel, trimmed);
      trackChatContactSaved(formChannel, locale);
      onSaved();
    } catch (err) {
      if (err instanceof ChatApiError && (err.code === 'invalid_handle' || err.code === 'invalid_input')) {
        setError(t('captureContactInvalid'));
      } else {
        setError(t('captureContactFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  const mailtoHref = `mailto:${CHAT_CONTACT_EMAIL}?subject=${encodeURIComponent(
    `LIV Plastic Surgery ${codeLabel}`
  )}&body=${encodeURIComponent(prefill)}`;

  const tileClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1 rounded-xl border px-0.5 pt-2 pb-1.5 min-h-[58px] text-[11px] leading-tight transition ${
      active
        ? 'border-[#0f766e] bg-[#0f766e]/5 text-[#6d4e42] font-medium'
        : 'border-gray-200 bg-white text-gray-600 hover:border-[#0f766e]/50'
    }`;
  const tileIcon = (channel: ContactChannel) => (
    <ChannelIcon channel={channel} className={`w-7 h-7 rounded-md ${ICON_COLOR[channel]}`} />
  );
  const copyButtonClass =
    'rounded-full border border-gray-200 bg-white px-2.5 min-h-[28px] text-[11px] text-gray-600 hover:border-[#0f766e]/50 transition';
  const panelClass = 'mt-1.5 flex flex-col gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-[12px] leading-relaxed text-gray-600';

  return (
    <div className="relative my-2 rounded-lg border border-[#0f766e]/25 bg-white px-3 py-3 shadow-sm">
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t('captureDismiss')}
        className="absolute top-1 right-1 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-sm leading-none"
      >
        ✕
      </button>

      <p className="text-[13px] font-semibold text-[#6d4e42] pr-6">{t('captureHeading')}</p>
      {lead && <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{lead}</p>}

      {/* 병원으로 바로 연락하기 — 단추 네 개 */}
      <p className="text-[11px] text-gray-600 mt-2.5 font-medium">{t('captureChannelsLead')}</p>
      <div className="mt-1.5 grid grid-cols-4 gap-1.5" role="group" aria-label={t('captureChannelsLead')}>
        {linkChannels.map((c) =>
          c === 'wechat' || c === 'email' ? (
            <button
              key={c}
              type="button"
              aria-expanded={expanded === c}
              onClick={() => togglePanel(c)}
              className={tileClass(expanded === c)}
            >
              {tileIcon(c)}
              <span>{CONTACT_CHANNEL_LABELS[c]}</span>
            </button>
          ) : (
            <a
              key={c}
              href={c === 'whatsapp' ? buildWhatsAppLink(prefill) : LINE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                reportClick(c);
                setOpenedMessenger(true);
              }}
              className={tileClass(false)}
            >
              {tileIcon(c)}
              <span>{CONTACT_CHANNEL_LABELS[c]}</span>
            </a>
          )
        )}
      </div>

      {expanded === 'wechat' && (
        <div ref={expandedRef} className={panelClass}>
          <button
            type="button"
            onClick={() => {
              reportClick('wechat');
              setQrOpen(true);
            }}
            aria-label="WeChat QR"
            className="self-center rounded-lg bg-white p-1.5 cursor-zoom-in"
          >
            <Image src={WECHAT_QR_IMAGE} alt="WeChat QR" width={132} height={132} className="w-[132px] h-[132px]" />
          </button>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{t('captureWechatIdLabel')}</span>
            <span className="font-mono text-[13px] text-[#6d4e42] select-all">{WECHAT_ID}</span>
            <button
              type="button"
              onClick={() => void handleCopy('wechat', WECHAT_ID)}
              className={copyButtonClass}
              aria-live="polite"
            >
              {copied === 'wechat' ? t('captureCopied') : t('captureCopy')}
            </button>
          </div>
          <p>{t('captureWechatLead', { code: codeLabel })}</p>
        </div>
      )}

      {expanded === 'email' && (
        <div ref={expandedRef} className={panelClass}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <a
              href={mailtoHref}
              onClick={() => reportClick('email')}
              className="font-mono text-[13px] text-[#6d4e42] underline underline-offset-2 break-all"
            >
              {CHAT_CONTACT_EMAIL}
            </a>
            <button
              type="button"
              onClick={() => void handleCopy('email', CHAT_CONTACT_EMAIL)}
              className={copyButtonClass}
              aria-live="polite"
            >
              {copied === 'email' ? t('captureCopied') : t('captureCopy')}
            </button>
          </div>
          <p>{t('captureEmailLead', { code: codeLabel })}</p>
        </div>
      )}

      {openedMessenger && (
        <p className="mt-1.5 text-[11px] text-gray-500 leading-relaxed">
          {t('captureMessengerFallback', { code: codeLabel })}
        </p>
      )}

      <p className="mt-1.5 text-[10px] text-gray-400 text-center">
        {t('captureCodeInstruction', { code: codeLabel })}
      </p>

      {/* 연락처 남기기 */}
      <p className="text-[11px] text-gray-600 mt-2.5 font-medium">{t('captureContactLead')}</p>
      <form onSubmit={handleSave} className="mt-1.5 flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('captureContactLead')}>
          {CONTACT_FORM_CHANNELS.map((c) => {
            const selected = formChannel === c;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setFormChannel(c);
                  setError(null);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 min-h-[32px] rounded-full text-[11px] border transition ${
                  selected
                    ? 'bg-[#0f766e] text-white border-[#0f766e]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#0f766e]/50'
                }`}
              >
                <ChannelIcon channel={c} className={`w-3.5 h-3.5 rounded-sm ${selected ? '' : ICON_COLOR[c]}`} />
                {CONTACT_CHANNEL_LABELS[c]}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1.5">
          <input
            type={formChannel === 'whatsapp' ? 'tel' : formChannel === 'email' ? 'email' : 'text'}
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={t(PLACEHOLDER_KEY[formChannel])}
            autoComplete={formChannel === 'email' ? 'email' : formChannel === 'whatsapp' ? 'tel' : 'off'}
            maxLength={254}
            className="flex-1 min-w-0 px-3 h-10 text-[12px] border border-gray-200 rounded-md focus:outline-none focus:border-[#0f766e]"
          />
          <button
            type="submit"
            disabled={saving || handle.trim().length === 0}
            className="px-3 h-10 bg-[#0f766e] text-white text-[12px] rounded-md hover:bg-[#115e59] disabled:opacity-50 transition whitespace-nowrap"
          >
            {t('captureContactSubmit')}
          </button>
        </div>
        {error && <div className="text-[11px] text-red-500">{error}</div>}
      </form>

      <p className="mt-2 text-[10px] text-gray-400 leading-relaxed">{t('capturePrivacyNote')}</p>

      <WeChatQRModal open={qrOpen} onClose={() => setQrOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 11: 패널 구현**

`liv-clinic/src/components/chat/ChatPanel.tsx` 를 아래 내용으로 교체한다. 바뀌는 것: 카드 노출을 `shouldShowCaptureBlock`으로 판단(영업시간 조건 삭제), 연락처 유무 조회(`fetchSessionInfo`)와 전송 응답의 `contact` 반영, ✕로 닫은 시각을 12시간만 기억, 보내는 중인 글이 목록에 먼저 나타나면 입력창을 비워 보여 주기, QR 크게 보기가 떠 있을 때 Esc가 채팅창을 닫지 않게. 세션 시작 화면·머리말·노란 안내 띠·입력창의 모양은 그대로다.

<!-- plan-check: full liv-clinic/src/components/chat/ChatPanel.tsx -->
```tsx
'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import type { UseChatSessionReturn } from '@/hooks/useChatSession';
import { useChatRealtime } from '@/hooks/useChatRealtime';
import { sendVisitorMessage, fetchPresence, fetchSessionInfo, ChatApiError } from '@/lib/chat/chatApi';
import { parseCaptureDismissedAt, shouldShowCaptureBlock } from '@/lib/chat/contactChannels';
import { countVisitorText } from '@/lib/chat/messageList';
import {
  trackChatFirstMessage,
  trackChatMessage,
  trackChatTranslationFailure,
  trackChatClose,
  trackPromoClick,
} from '@/lib/analytics-events';
import type { VisitorLocale } from '@/lib/chat/chatApi';
import MessageBubble from './MessageBubble';
import ChatCaptureBlock from './ChatCaptureBlock';

interface Props {
  locale: VisitorLocale;
  open: boolean;
  onClose: () => void;
  // ChatWidget이 단일 useChatSession 인스턴스를 소유하고 props로 주입.
  // 새 세션 생성 시 ChatWidget의 unread broadcast 구독이 즉시 활성화되도록 하는 G-07 fix.
  sessionState: UseChatSessionReturn;
}

const MAX_LEN = 1000;

// 연락처 카드를 ✕로 닫은 시각(ms)을 세션별로 기억한다. 12시간 뒤에는 다시 뜬다 (스펙 2026-10-01 §4.2).
const captureDismissKey = (sessionId: string) => `liv-chat-capture-dismissed:${sessionId}`;

function readCaptureDismissedAt(sessionId: string): number | null {
  try {
    return parseCaptureDismissedAt(window.localStorage.getItem(captureDismissKey(sessionId)));
  } catch {
    return null;
  }
}

export default function ChatPanel({ locale, open, onClose, sessionState }: Props) {
  const t = useTranslations('chat');
  const { session, start, loading: starting, error: startError } = sessionState;
  const sessionId = session?.sessionId ?? null;
  const sessionToken = session?.sessionToken ?? null;
  const [presence, setPresence] = useState<{
    online: boolean;
    businessHours: boolean;
    nextOpenAt: string | null;
  } | null>(null);
  // presence 를 받아 올 때마다(30초) 갱신하는 "지금" — 연락처 카드의 시간 조건(직원 글 10분, ✕ 12시간)에 쓴다.
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // 보내는 중인 글 — 전송 응답보다 자동 안내가 먼저 도착하면 손님 글이 목록에 먼저 보인다. 그때 입력창을 바로 비운다.
  const [inFlight, setInFlight] = useState<{ text: string; countBefore: number } | null>(null);
  // 서버 기준 연락처 유무 (세션별). null = 아직 모름
  const [contactInfo, setContactInfo] = useState<{ sessionId: string; hasContact: boolean } | null>(null);
  // 이 화면에서 방금 ✕로 닫은 시각 (세션별)
  const [dismissedNow, setDismissedNow] = useState<{ sessionId: string; atMs: number } | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  // G-03: 패널 열린 시각 추적 — close 이벤트의 duration 산출용
  const openedAtRef = useRef<number | null>(null);
  // M2: 사전-세션 화면에 직접예약 프로모션 노출 + select_promotion 추적.
  // 위젯이 뜨는 방문자 로케일 6개 전체 대상 (초기 en/ja/zh 한정 → fr/mn/ar 확장).
  const promoViewedRef = useRef(false);
  // 데스크톱(hover+fine pointer)에서만 Enter=전송. 모바일은 Enter=줄바꿈 + Send 버튼만 사용.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const { messages, appendOptimistic } = useChatRealtime({
    sessionId,
    sessionToken,
    enabled: open && !!session,
  });

  // Presence polling
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const p = await fetchPresence();
        if (!cancelled) {
          setPresence({
            online: p.online,
            businessHours: p.businessHours,
            nextOpenAt: p.nextOpenAt,
          });
          setNowMs(Date.now());
        }
      } catch {
        // ignore
      }
    };
    void tick();
    const interval = setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [open]);

  // 연락처 유무 조회 — 패널을 열 때 한 번. 실패하면 "연락처 없음"으로 본다(놓치는 것보다 한 번 더 묻는 편이 낫다).
  useEffect(() => {
    if (!open || !sessionId || !sessionToken) return;
    let cancelled = false;
    fetchSessionInfo(sessionToken)
      .then((info) => {
        if (!cancelled) setContactInfo({ sessionId, hasContact: info.hasContact });
      })
      .catch(() => {
        if (!cancelled) {
          setContactInfo((cur) => (cur?.sessionId === sessionId ? cur : { sessionId, hasContact: false }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, sessionId, sessionToken]);

  // Auto scroll on new messages
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // 패널 위에 모달(WeChat QR 크게 보기)이 떠 있으면 Esc 는 그 모달만 닫는다
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // G-03: open 전환 추적 → 닫힐 때 trackChatClose 발화 (모든 close 경로 커버: Esc, X, toggle)
  useEffect(() => {
    if (open && session) {
      openedAtRef.current = Date.now();
      return;
    }
    if (!open && openedAtRef.current !== null && session) {
      const durationSec = (Date.now() - openedAtRef.current) / 1000;
      const closedSessionId = session.sessionId;
      openedAtRef.current = null;
      void trackChatClose('visitor_close', durationSec, closedSessionId, locale);
    }
  }, [open, session, locale]);

  // M2: 프로모션 노출 1회 추적 (사전-세션 화면이 실제로 보일 때)
  useEffect(() => {
    if (open && !session && !promoViewedRef.current) {
      promoViewedRef.current = true;
      trackPromoClick('chat_direct_booking', 'view');
    }
  }, [open, session]);

  // 저장돼 있던 "카드를 닫은 시각" — 세션이 정해지면 한 번 읽는다.
  const storedDismissedAt = useMemo(() => (open && sessionId ? readCaptureDismissedAt(sessionId) : null), [open, sessionId]);

  const handleStart = async (e: FormEvent) => {
    e.preventDefault();
    await start({ name: name.trim() || undefined, email: email.trim() || undefined });
  };

  // M2: 프로모션 CTA — 직접예약 초안 메시지를 미리 채운 뒤 세션 시작(방문자는 전송만 하면 됨).
  const handlePromoStart = async () => {
    trackPromoClick('chat_direct_booking', 'cta');
    setText(t('promoDraft'));
    await start({ name: name.trim() || undefined, email: email.trim() || undefined });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_LEN || sending) return;
    // wasFirst: appendOptimistic 호출 전 visitor 메시지 수 판정 (§8.1)
    const wasFirst =
      messages.filter((m) => m.sender === 'visitor').length === 0;
    setSending(true);
    setSendError(null);
    setInFlight({ text: trimmed, countBefore: countVisitorText(messages, trimmed) });
    try {
      const { message: created, contact } = await sendVisitorMessage(session.sessionToken, trimmed);
      trackChatMessage('sent', locale);
      if (wasFirst) trackChatFirstMessage(locale);
      if (created.translation_status === 'failed') {
        trackChatTranslationFailure(created.translation_error ?? 'unknown');
      }
      appendOptimistic(created);
      // 글 속 이메일이 연락처로 저장됐으면 카드를 숨긴다 (hasContact 는 서버가 알려 준다)
      if (contact) setContactInfo({ sessionId: session.sessionId, hasContact: contact.hasContact });
      // 응답을 기다리는 사이 손님이 새 글을 쓰기 시작했으면 지우지 않는다
      setText((cur) => (cur.trim() === trimmed ? '' : cur));
    } catch (err) {
      if (err instanceof ChatApiError) {
        if (err.code === 'rate_limited') setSendError(t('rateLimited'));
        else if (err.code === 'invalid_input') setSendError(t('tooLong'));
        else if (err.code === 'session_closed') setSendError(t('sessionEnded'));
        else setSendError(t('rateLimited'));
      } else {
        setSendError(t('rateLimited'));
      }
    } finally {
      setSending(false);
      setInFlight(null);
    }
  };

  const dismissCapture = () => {
    if (!sessionId) return;
    const atMs = Date.now();
    setDismissedNow({ sessionId, atMs });
    try {
      window.localStorage.setItem(captureDismissKey(sessionId), String(atMs));
    } catch {
      // privacy 모드 등 — 저장하지 못해도 이 화면에서는 닫힌 채로 둔다
    }
  };

  if (!open) return null;

  // 보내는 중인 글이 이미 목록에 나타났으면(자동 안내가 응답보다 먼저 도착) 입력창을 비워 보여 준다.
  const echoed =
    inFlight !== null &&
    text.trim() === inFlight.text &&
    countVisitorText(messages, inFlight.text) > inFlight.countBefore;
  const shownText = echoed ? '' : text;
  const remaining = MAX_LEN - shownText.length;
  const overLimit = shownText.length > MAX_LEN;
  const isOnline = presence?.online ?? false;

  const hasContact = contactInfo?.sessionId === sessionId ? contactInfo.hasContact : false;
  const dismissedAtMs = dismissedNow?.sessionId === sessionId ? dismissedNow.atMs : storedDismissedAt;
  const showCapture = shouldShowCaptureBlock({
    presenceLoaded: presence !== null,
    sessionInfoLoaded: contactInfo?.sessionId === sessionId,
    hasContact,
    dismissedAtMs,
    messages,
    nowMs,
  });

  return (
    <div
      role="dialog"
      aria-label={t('title')}
      // Pinned physically by owner decision (chat left, socials right, all writing directions) — do not convert to logical properties.
      className="fixed left-2 sm:left-4 md:left-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
      style={{
        bottom: 'calc(150px + env(safe-area-inset-bottom, 0px))',
        width: 'min(384px, calc(100vw - 16px))',
        // dvh 우선(iOS Safari toolbar 정확 반영). 미지원 브라우저는 72vh로 fallback
        height: 'min(600px, 72dvh)',
        maxHeight: 'min(600px, 72vh)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100 bg-[#0f766e] text-white">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate">{t('title')}</div>
          <div className="text-[11px] opacity-90 mt-0.5 flex items-center gap-1.5">
            <span
              className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                isOnline ? 'bg-green-300' : 'bg-gray-300'
              }`}
              aria-hidden
            />
            <span className="truncate">{isOnline ? t('online') : t('offline')}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="text-white/90 hover:text-white text-xl leading-none flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2 flex-shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      {!session ? (
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          <p className="text-sm text-gray-600">{t('welcome')}</p>
          {/* 직접예약 프로모션 — 라이브챗을 통한 직접 유입 유도 (에이전시 fee 절감) */}
          <div className="rounded-lg border border-[#b4988d]/40 bg-[#b4988d]/10 px-3 py-2.5">
            <p className="text-[13px] font-semibold text-[#6d4e42]">🎁 {t('promoTitle')}</p>
            <p className="text-[11px] text-[#8a6f63] mt-0.5 leading-relaxed">{t('promoBody')}</p>
            <button
              type="button"
              onClick={() => void handlePromoStart()}
              disabled={starting}
              className="mt-2 w-full bg-[#0f766e] text-white text-[12px] font-medium min-h-[44px] rounded-md hover:bg-[#115e59] disabled:opacity-60 transition"
            >
              {t('promoCta')} →
            </button>
            <p className="mt-1.5 text-[10px] leading-relaxed text-[#8a6f63]/80">{t('promoTerms')}</p>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">{t('businessHours')}</p>
          <p className="text-[11px] text-gray-400 leading-relaxed">{t('consent')}</p>
          <form onSubmit={handleStart} className="flex flex-col gap-2 mt-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              maxLength={60}
              autoComplete="nickname"
              className="px-3 h-11 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#0f766e]"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              autoComplete="email"
              inputMode="email"
              className="px-3 h-11 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#0f766e]"
            />
            <button
              type="submit"
              disabled={starting}
              className="mt-1 bg-[#0f766e] text-white text-sm font-medium h-11 rounded-md hover:bg-[#115e59] disabled:opacity-60 transition"
            >
              {starting ? '...' : t('startChat')}
            </button>
            {startError && <div className="text-[11px] text-red-500">{t('startFailed')}</div>}
          </form>
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 py-3 bg-gray-50/40"
            aria-live="polite"
          >
            {/* 운영시간 외 안내 */}
            {presence && !presence.online && (
              <div className="my-1.5 mx-auto max-w-[95%] text-center">
                <div className="inline-block rounded-md bg-yellow-50 px-3 py-2 text-[11px] text-yellow-900 border border-yellow-100">
                  {presence.businessHours
                    ? t('allOperatorsBusyNotice')
                    : t('delayedResponseNotice')}
                </div>
              </div>
            )}
            {messages.length === 0 && (
              <div className="text-xs text-gray-400 text-center py-6">{t('welcome')}</div>
            )}
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} visitorLocale={locale} />
            ))}
            {/* 연락처 카드 — 손님이 답을 기다리는 동안이면 영업시간에도 뜬다 (스펙 2026-10-01 §4.2).
                띄울지는 shouldShowCaptureBlock 이 정하고, 영업시간 여부는 카드 안의 안내 한 줄만 가른다. */}
            {presence && showCapture && (
              <ChatCaptureBlock
                locale={locale}
                sessionId={session.sessionId}
                sessionToken={session.sessionToken}
                businessHours={presence.businessHours}
                nextOpenAt={presence.nextOpenAt}
                onDismiss={dismissCapture}
                onSaved={() => setContactInfo({ sessionId: session.sessionId, hasContact: true })}
              />
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-gray-100 px-3 py-2 flex flex-col gap-1 bg-white"
            style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="flex items-end gap-2">
              <textarea
                value={shownText}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  // 데스크톱에서만 Enter=전송. 모바일은 Enter=줄바꿈 (자연스러운 입력)
                  if (isDesktop && e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSubmit(e as unknown as FormEvent);
                  }
                }}
                placeholder={t('placeholder')}
                rows={2}
                enterKeyHint="send"
                className="flex-1 resize-none px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#0f766e] max-h-[120px]"
              />
              <button
                type="submit"
                disabled={sending || shownText.trim().length === 0 || overLimit}
                className="bg-[#0f766e] text-white text-sm px-4 py-2 rounded-md hover:bg-[#115e59] disabled:opacity-50 transition self-end min-h-[44px] min-w-[60px]"
              >
                {t('send')}
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>{t('subtitle')}</span>
              <span className={overLimit || remaining < 100 ? 'text-red-500' : ''}>
                {shownText.length}/{MAX_LEN}
              </span>
            </div>
            {sendError && <div className="text-[11px] text-red-500">{sendError}</div>}
          </form>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 12: 옛 채널 목록 삭제**

`liv-clinic/src/lib/chat/contactChannels.ts` — 이제 아무도 쓰지 않는 `CONTACT_CHANNELS`를 지운다:

<!-- plan-check: added liv-clinic/src/lib/chat/contactChannels.ts -->
```diff
--- a/src/lib/chat/contactChannels.ts
+++ b/src/lib/chat/contactChannels.ts
@@ -8,8 +8,6 @@ import { primaryMessengerFor } from '@/lib/messengerLinks';
 export const CLINIC_LINK_CHANNELS = ['whatsapp', 'wechat', 'line', 'email'] as const;
 /** 카드의 "연락처 남기기" 칩. LINE ID는 받지 않는다 — 직원이 ID로 손님을 찾지 못했다(2026-10-01 실측 2건 모두 실패). */
 export const CONTACT_FORM_CHANNELS = ['whatsapp', 'wechat', 'email'] as const;
-/** @deprecated 예전 카드(메신저 3종)용. 새 카드로 바꾸는 작업에서 지운다. */
-export const CONTACT_CHANNELS = ['whatsapp', 'wechat', 'line'] as const;
 
 export type ContactChannel = (typeof CLINIC_LINK_CHANNELS)[number];
 export type ContactFormChannel = (typeof CONTACT_FORM_CHANNELS)[number];
```

지운 뒤의 `contactChannels.ts` 전체는 아래와 같다(Task 3에서 쓴 내용에서 위 두 줄만 빠진 것 — 대조용):

<!-- plan-check: full liv-clinic/src/lib/chat/contactChannels.ts -->
```ts
// 채팅 연락처 카드의 채널 SSOT (스펙 2026-10-01 §4.2~§4.4).
// 클리닉이 실제 운영하는 계정과 1:1 (constants.ts SOCIAL_LINKS·CHAT_CONTACT_EMAIL 참조).
// 클라이언트/서버 공용 — 브라우저 API 접근 없음, 정규식 lookbehind 없음 (chatApi.ts 패턴).
import { CHAT_CONTACT_EMAIL } from '@/lib/constants';
import { primaryMessengerFor } from '@/lib/messengerLinks';

/** 카드의 "병원으로 바로 연락하기" 단추 네 개. API가 받는 채널 값의 전체 집합이기도 하다. */
export const CLINIC_LINK_CHANNELS = ['whatsapp', 'wechat', 'line', 'email'] as const;
/** 카드의 "연락처 남기기" 칩. LINE ID는 받지 않는다 — 직원이 ID로 손님을 찾지 못했다(2026-10-01 실측 2건 모두 실패). */
export const CONTACT_FORM_CHANNELS = ['whatsapp', 'wechat', 'email'] as const;

export type ContactChannel = (typeof CLINIC_LINK_CHANNELS)[number];
export type ContactFormChannel = (typeof CONTACT_FORM_CHANNELS)[number];

// 손님 화면에 보이는 채널 이름 — 브랜드명이라 번역하지 않는다.
export const CONTACT_CHANNEL_LABELS: Record<ContactChannel, string> = {
  whatsapp: 'WhatsApp',
  wechat: 'WeChat',
  line: 'LINE',
  email: 'Email',
};

const WHATSAPP_HANDLE_RE = /^[+0-9][0-9 ()\-]{6,29}$/;
const ID_HANDLE_RE = /^[A-Za-z0-9._\-]{4,50}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length <= MAX_EMAIL_LENGTH && EMAIL_RE.test(trimmed);
}

export function validateContactHandle(channel: ContactChannel, handle: string): boolean {
  const trimmed = handle.trim();
  if (channel === 'whatsapp') return WHATSAPP_HANDLE_RE.test(trimmed);
  if (channel === 'email') return isValidEmail(trimmed);
  return ID_HANDLE_RE.test(trimmed);
}

/** 메신저 대화 ↔ 웹챗 기록을 잇는 짧은 참조코드 (uuid 첫 세그먼트 대문자). */
export function buildChatRefCode(sessionId: string): string {
  return sessionId.replace(/-/g, '').slice(0, 8).toUpperCase();
}

/** "연락처 남기기"의 기본 선택: 중국어 → WeChat, 일본어 → 이메일, 그 외 → WhatsApp. */
export function defaultFormChannel(locale: string): ContactFormChannel {
  if (locale === 'zh') return 'wechat';
  if (locale === 'ja') return 'email';
  return 'whatsapp';
}

/** "병원으로 바로 연락하기" 단추 순서: 그 로케일의 1순위 메신저가 맨 앞, 이메일은 맨 뒤. */
export function orderedLinkChannels(locale: string): ContactChannel[] {
  const primary = primaryMessengerFor(locale);
  const rest = (['whatsapp', 'wechat', 'line'] as const).filter((c) => c !== primary);
  return [primary, ...rest, 'email'];
}

// ── 손님 글 속 이메일 인식 (§4.3) ───────────────────────────────────────────

const EMAIL_IN_TEXT_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// 손님이 "이 주소로 메일 보냈어요"라고 병원 주소를 적어도 손님 연락처로 저장하지 않는다.
const CLINIC_EMAIL_DOMAINS = ['livps.co.kr', 'liv-clinic.net'];

/** 글 속 첫 이메일(병원 주소 제외, 254자 초과 무시). 없으면 null. */
export function extractEmail(text: string): string | null {
  for (const m of text.matchAll(EMAIL_IN_TEXT_RE)) {
    const email = m[0];
    if (email.length > MAX_EMAIL_LENGTH) continue;
    const lower = email.toLowerCase();
    if (lower === CHAT_CONTACT_EMAIL.toLowerCase()) continue;
    const domain = lower.slice(lower.lastIndexOf('@') + 1);
    if (CLINIC_EMAIL_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) continue;
    return email;
  }
  return null;
}

// ── 연락처 카드 노출 규칙 (§4.2) ────────────────────────────────────────────

/** ✕로 닫은 카드는 이만큼만 숨긴다 — 접수 안내가 12시간 뒤 다시 나갈 때 문장과 카드가 어긋나지 않게. */
export const CAPTURE_DISMISS_TTL_MS = 12 * 60 * 60 * 1000;
/** 직원 글이 이 시간 안에 있으면 "주고받는 중"으로 보고 카드를 끼워 넣지 않는다. */
export const STAFF_ACTIVE_WINDOW_MS = 10 * 60 * 1000;

export interface CaptureMessage {
  sender: string;
  /** 'auto' = 자동 안내. 직원 글로 치지 않는다 */
  source?: string | null;
  created_at: string;
}

export interface CaptureBlockConditions {
  /** presence 조회 성공 여부 — 실패하면 미노출 */
  presenceLoaded: boolean;
  /** 세션 정보(hasContact) 조회가 끝났는가 — 실패해도 true (연락처 없음으로 본다) */
  sessionInfoLoaded: boolean;
  /** 서버 기준 연락처 유무 (이메일 또는 메신저 연락처) */
  hasContact: boolean;
  /** 손님이 ✕로 닫은 시각(ms). 닫은 적 없으면 null */
  dismissedAtMs: number | null;
  /** 시간순 메시지 */
  messages: CaptureMessage[];
  nowMs: number;
}

/** 직원이 쓴 글인가 — 자동 안내(source='auto')와 시스템 메시지는 아니다. */
export function isStaffMessage(m: CaptureMessage): boolean {
  return m.sender === 'operator' && m.source !== 'auto';
}

/** 영업시간 여부는 노출 조건이 아니다 — 손님이 답을 기다리는 동안이면 낮에도 뜬다. */
export function shouldShowCaptureBlock(c: CaptureBlockConditions): boolean {
  if (!c.presenceLoaded || !c.sessionInfoLoaded) return false;
  if (c.hasContact) return false;
  if (c.dismissedAtMs !== null && c.nowMs - c.dismissedAtMs < CAPTURE_DISMISS_TTL_MS) return false;
  const turns = c.messages.filter((m) => m.sender === 'visitor' || isStaffMessage(m));
  if (!turns.some((m) => m.sender === 'visitor')) return false;
  // 기다리는 중: 손님 글과 직원 글 중 마지막이 손님 글
  if (turns[turns.length - 1].sender !== 'visitor') return false;
  // 직원과 실시간으로 주고받는 중에는 끼어들지 않는다
  const lastStaff = [...turns].reverse().find(isStaffMessage);
  if (lastStaff && c.nowMs - Date.parse(lastStaff.created_at) < STAFF_ACTIVE_WINDOW_MS) return false;
  return true;
}

/** localStorage 에 저장한 닫은 시각을 읽는다. 예전 값 '1'은 1ms로 읽혀 자연히 만료된 것으로 처리된다. */
export function parseCaptureDismissedAt(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
```

- [ ] **Step 13: 통과 확인**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run src/components/chat src/lib/chat/__tests__/messageList.test.ts src/lib/chat/__tests__/contactChannels.test.ts`
Expected: PASS — ChatCaptureBlock 14건, MessageBubble 6건, messageList 4건, contactChannels 28건

- [ ] **Step 14: 전체 회귀 + 타입 검사 + lint**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run && npx tsc --noEmit`
Expected: 58파일 878건 통과, tsc 출력 없음

Run: `npx eslint src/components/chat src/hooks/useChatRealtime.ts src/lib/copyText.ts src/lib/chat/messageList.ts src/lib/chat/chatApi.ts src/lib/chat/contactChannels.ts`
Expected: 출력 없음(종료 코드 0)

- [ ] **Step 15: 커밋**

```bash
git add src/lib/chat/messageList.ts src/lib/chat/__tests__/messageList.test.ts src/lib/copyText.ts src/lib/chat/chatApi.ts src/hooks/useChatRealtime.ts src/components/chat/ChatCaptureBlock.tsx src/components/chat/__tests__/ChatCaptureBlock.test.tsx src/components/chat/ChatPanel.tsx src/lib/chat/contactChannels.ts
git commit -m "feat(chat): 연락처 카드 — 낮에도 표시, 단추 네 개(아이콘), 병원 WeChat QR·이메일, 이메일 남기기" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 16: 관리자 채팅 목록에 "오늘 연락" 배지

**Files:**
- Modify: `liv-clinic/src/app/admin/(authenticated)/chat/page.tsx`

**Interfaces:**
- Consumes: `isFollowupDue(s)` (Task 11)
- Produces: 진행 중 목록에서 "연락처가 있고 답을 기다리는" 줄에 `오늘 연락` 배지. 조회에 `awaiting_since` 추가(040에 이미 있는 컬럼). 이메일·메신저 표시는 그대로다.

판정 로직(`isFollowupDue`)은 Task 11에서 테스트했다. 이 과제는 그 결과를 화면에 붙이는 것뿐이라 새 테스트가 없다 — 타입 검사와 Task 18의 빌드로 확인한다.

- [ ] **Step 1: 구현**

`liv-clinic/src/app/admin/(authenticated)/chat/page.tsx`:

<!-- plan-check: added liv-clinic/src/app/admin/(authenticated)/chat/page.tsx -->
```diff
--- a/src/app/admin/(authenticated)/chat/page.tsx
+++ b/src/app/admin/(authenticated)/chat/page.tsx
@@ -1,5 +1,6 @@
 import Link from 'next/link';
 import { createChatAdminClient } from '@/lib/chat/db';
+import { isFollowupDue } from '@/lib/chat/followupDigest';
 import type { VisitorLocale } from '@/lib/chat/chatApi';
 
 export const dynamic = 'force-dynamic';
@@ -17,6 +18,7 @@ interface SessionRow {
   created_at: string;
   assigned_label: string | null;
   resolved_at: string | null;
+  awaiting_since: string | null;
 }
 
 // 방문자가 남긴 채널 표기 (미지의 값은 원문 그대로 — 채널 확장 대비)
@@ -62,7 +64,7 @@ async function loadSessions(tab: Tab): Promise<SessionRow[]> {
   let query = admin
     .from('chat_sessions')
     .select(
-      'id, visitor_locale, visitor_name, visitor_email, visitor_messenger_channel, visitor_messenger_handle, status, last_message_at, unread_admin_count, created_at, assigned_label, resolved_at'
+      'id, visitor_locale, visitor_name, visitor_email, visitor_messenger_channel, visitor_messenger_handle, status, last_message_at, unread_admin_count, created_at, assigned_label, resolved_at, awaiting_since'
     );
   if (tab === 'open') query = query.eq('status', 'open').is('resolved_at', null);
   else if (tab === 'resolved') query = query.eq('status', 'open').not('resolved_at', 'is', null);
@@ -156,6 +158,12 @@ export default async function AdminChatListPage({
                     </div>
                   </div>
                   <div className="flex flex-col items-end gap-1 flex-shrink-0">
+                    {/* 연락처를 남기고 답을 기다리는 손님 — Slack의 '오늘 연락할 손님'과 같은 기준 */}
+                    {isFollowupDue(s) && (
+                      <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 whitespace-nowrap">
+                        오늘 연락
+                      </span>
+                    )}
                     {s.assigned_label && (
                       <span className="text-[11px] text-[#6d4e42] bg-[#b4988d]/10 rounded-full px-2 py-0.5 whitespace-nowrap">
                         담당 {s.assigned_label}
```

- [ ] **Step 2: 타입 검사 + lint**

Run: `npx tsc --noEmit && npx eslint "src/app/admin/(authenticated)/chat/page.tsx"`
Expected: 출력 없음(종료 코드 0)

- [ ] **Step 3: 커밋**

```bash
git add "src/app/admin/(authenticated)/chat/page.tsx"
git commit -m "feat(admin): 채팅 목록에 '오늘 연락' 배지 — 연락처를 남기고 답을 기다리는 손님" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 17: 측정 스크립트에 이벤트 안내 항목(G-6)

**Files:**
- Modify: `liv-clinic/scripts/chat-response-baseline.mjs`

**Interfaces:**
- Consumes: 운영 DB(읽기 전용 트랜잭션), `chat_sessions.event_hint_at` 컬럼 유무
- Produces: 출력 항목 `9. [G-6] 이벤트 안내 — 나간 세션·손님 글에서 안내까지(초)·연락 수단 확보`. `event_hint_at` 컬럼이 없으면(042 적용 전) 건너뛴다. **기존 항목 0~8의 질의는 한 글자도 바꾸지 않는다**(스펙 §1·§2의 수치를 낸 정의다).

이 과제에서는 스크립트를 실행하지 않는다 — 042 적용 전에는 항목 9가 건너뛰어져 새 질의가 돌지 않는다. 실제 실행은 Task 19(042 적용 뒤)에서 한다.

- [ ] **Step 1: 구현**

`liv-clinic/scripts/chat-response-baseline.mjs`:

<!-- plan-check: added liv-clinic/scripts/chat-response-baseline.mjs -->
```diff
--- a/scripts/chat-response-baseline.mjs
+++ b/scripts/chat-response-baseline.mjs
@@ -1,5 +1,5 @@
 // 채팅 응답 실측 (읽기 전용) — "연락처 먼저" 설계(docs/superpowers/specs/2026-10-01-chat-contact-first-design.md)의
-// 목표 G-1~G-5를 같은 정의로 다시 재기 위한 스크립트. 아무것도 변경하지 않는다(READ ONLY 트랜잭션).
+// 목표 G-1~G-6을 같은 정의로 다시 재기 위한 스크립트. 아무것도 변경하지 않는다(READ ONLY 트랜잭션).
 //
 // 실행 (liv-clinic 폴더에서):
 //   NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/chat-response-baseline.mjs [--since 2026-05-08] [--card-since 2026-08-09]
@@ -10,6 +10,7 @@
 //   - 영업중: 평일 10:00–19:00, 토 10:00–16:00 (KST, 코드 기본값). 휴진일(CHAT_CLOSED_DATES)은 반영하지 않는다.
 //   - 다시 닿을 길 없음: 이메일·메신저 연락처가 없고, 직원 답변이 없거나 답변 뒤 손님이 다시 말하지 않음.
 //   - 이름·연락처 값은 읽지 않고 유무만 센다.
+//   - 이벤트 안내(항목 9): 자동 안내(source='auto') 가운데 본문이 이벤트 페이지 주소(…/events 또는 …/events/…)로 끝나는 글.
 
 import { readFileSync } from 'node:fs';
 import { createRequire } from 'node:module';
@@ -52,6 +53,11 @@ const { rows: colRows } = await db.query(
     WHERE table_schema='public' AND table_name='chat_sessions' AND column_name='visitor_messenger_clicked'`
 );
 const CLICKED = colRows.length > 0 ? 'cs.visitor_messenger_clicked' : 'NULL::text';
+const { rows: hintColRows } = await db.query(
+  `SELECT 1 FROM information_schema.columns
+    WHERE table_schema='public' AND table_name='chat_sessions' AND column_name='event_hint_at'`
+);
+const HAS_EVENT_HINT = hintColRows.length > 0;
 
 const base = (since) => `
 WITH s AS (
@@ -155,6 +161,39 @@ await q('8. [G-5] 자동 안내 지연(초) — 직전 손님 글 기준', `
          to_char(max(created_at) AT TIME ZONE 'Asia/Seoul', 'MM-DD HH24:MI') AS 마지막_KST
     FROM d`);
 
+// G-6: 가격·프로모션을 물은 손님이 이벤트 안내(프로모션 링크)를 몇 초 만에 받았는가.
+// 시험 세션은 이름으로만 뺀다(첫 글 기준은 쓰지 않는다 — 대화 중간의 가격 질문도 세기 때문이다).
+if (HAS_EVENT_HINT) {
+  await q('9. [G-6] 이벤트 안내 — 나간 세션·손님 글에서 안내까지(초)·연락 수단 확보', `
+    WITH h AS (
+      SELECT a.session_id,
+             EXTRACT(EPOCH FROM (a.created_at - v.created_at)) AS sec
+        FROM public.chat_messages a
+        JOIN LATERAL (
+          SELECT created_at FROM public.chat_messages v
+           WHERE v.session_id = a.session_id AND v.sender = 'visitor' AND v.created_at <= a.created_at
+           ORDER BY v.created_at DESC LIMIT 1) v ON true
+       WHERE a.source = 'auto'
+         AND a.original_text ~ 'https?://[^[:space:]]+/events(/[^[:space:]]*)?$'
+         AND a.created_at >= timestamptz '${SINCE} 00:00+09'),
+    s AS (
+      SELECT h.session_id, min(h.sec) AS first_sec, count(*) AS hints,
+             bool_or((cs.visitor_email IS NOT NULL AND cs.visitor_email <> '')
+                     OR cs.visitor_messenger_handle IS NOT NULL
+                     OR ${CLICKED} IS NOT NULL) AS has_means
+        FROM h JOIN public.chat_sessions cs ON cs.id = h.session_id
+       WHERE coalesce(cs.visitor_name, '') !~* '(test|테스트|smoke)'
+       GROUP BY h.session_id)
+    SELECT count(*) AS 세션, coalesce(sum(hints), 0) AS 안내_횟수,
+           round(min(first_sec)::numeric, 1) AS 최소,
+           round((percentile_cont(0.5) WITHIN GROUP (ORDER BY first_sec))::numeric, 1) AS 중앙값,
+           round(max(first_sec)::numeric, 1) AS 최대,
+           count(*) FILTER (WHERE has_means) AS 연락수단_확보
+      FROM s`);
+} else {
+  console.log('\n── 9. [G-6] 이벤트 안내 ──\n  (건너뜀 — event_hint_at 컬럼 없음, 042 미적용)');
+}
+
 await db.query('ROLLBACK');
 await db.end();
 console.log('\n완료 (READ ONLY 트랜잭션 — 아무것도 변경하지 않았습니다)');
```

- [ ] **Step 2: 문법 확인**

Run: `node --check scripts/chat-response-baseline.mjs`
Expected: 출력 없음(종료 코드 0)

Run: `git diff --stat scripts/chat-response-baseline.mjs`
Expected: 삭제는 주석 1줄(`G-1~G-5` → `G-1~G-6`)뿐이다. 기존 `await q('0.` ~ `await q('8.` 질의가 diff에 나오지 않는지 확인한다.

- [ ] **Step 3: 커밋**

```bash
git add scripts/chat-response-baseline.mjs
git commit -m "feat(chat): 측정 스크립트에 이벤트 안내 항목 9(G-6) 추가" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 18: 전체 검증 — 게이트·빌드·화면 확인

**Files:**
- Create: `chat-contact-card-check.mjs` (워크트리 루트 — CLAUDE.md의 "테스트 스크립트는 상위 폴더")
- Modify: `docs/superpowers/specs/2026-10-01-chat-contact-first-design.md` (상태 한 줄)
- Delete: `plan-fidelity-check.mjs` (Task 0의 임시 도구 — 마지막 대조 뒤에 지운다)

**Interfaces:**
- Consumes: Task 0~17의 결과 전체
- Produces: 검증 기록(게이트 5종 + 화면 확인 35개 항목 + 계획서 대조 66개 + 화면 사진 `screenshots/chat-contact-first/*.png`)

**이 과제는 운영 DB·Slack에 쓰지 않는다.** 화면 확인은 로컬에서 빌드한 사이트를 열되 `/api/chat/*` 요청을 전부 가짜 응답으로 대신한다(서버의 채팅 라우트는 호출되지 않는다). 사이트의 다른 페이지 데이터(이벤트·팝업)는 운영 DB에서 **읽기만** 한다.

- [ ] **Step 1: 테스트·타입·lint·i18n 게이트**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run`
Expected: `Test Files  58 passed (58)` · `Tests  878 passed (878)`

Run: `npx tsc --noEmit`
Expected: 출력 없음(종료 코드 0)

Run:
```bash
npx eslint scripts/_i18n-work/add-chat-contact-first-keys.mjs scripts/chat-response-baseline.mjs "src/app/admin/(authenticated)/chat/page.tsx" src/app/api/chat/contact/route.ts src/app/api/chat/messages/route.ts src/app/api/chat/ops/route.ts src/app/api/chat/sessions/route.ts src/components/chat src/components/layout/FloatingCTA.tsx src/components/ui/ChannelIcon.tsx src/components/ui/__tests__/ChannelIcon.test.tsx src/hooks/useChatRealtime.ts src/lib/chat src/lib/constants.ts src/lib/copyText.ts
```
Expected: 출력 없음(종료 코드 0). (리포 전체 `npm run lint`에는 이 작업과 무관한 기존 오류가 있으므로 변경 파일만 본다.)

Run: `npm run verify:i18n`
Expected: `✓ all master keys present`

- [ ] **Step 2: 빌드**

Run: `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 NODE_TLS_REJECT_UNAUTHORIZED=0 npm run build`
Expected: 종료 코드 0, 끝에 라우트 표(`ƒ /api/chat/contact`, `ƒ /api/chat/ops` 등)가 나온다.

Run: `git status --short`
Expected: `?? ../plan-fidelity-check.mjs` 한 줄뿐이다(Task 0의 임시 도구. 빌드가 추적 파일을 바꾸지 않았다). `*.generated.ts`가 나오면 줄바꿈만 달라진 것인지 `git diff --stat`으로 확인하고 `git checkout -- <파일>`로 되돌린다.

- [ ] **Step 3: 화면 확인 스크립트 작성**

워크트리 루트에 `chat-contact-card-check.mjs` 를 새로 만든다(`D:\dev\LIV_homepage-slack-rooms\chat-contact-card-check.mjs`):

<!-- plan-check: full chat-contact-card-check.mjs -->
```js
// 라이브채팅 "연락처 먼저" 손님 화면 확인 스크립트 (스펙 2026-10-01 §4.2·§4.10).
//
// 로컬에서 빌드한 사이트(next start)를 열어 연락처 카드·말풍선 링크·오른쪽 단추 아이콘을 확인한다.
// 운영 DB·Slack 에 아무것도 쓰지 않도록 /api/chat/* 요청은 전부 이 스크립트가 가짜 응답으로 대신한다
// (서버의 채팅 라우트는 한 번도 호출되지 않는다). 분석 스크립트(GA·네이버)도 막는다.
//
// 사용: node chat-contact-card-check.mjs [baseUrl=http://localhost:3010] [shotDir=screenshots/chat-contact-first]
// 종료코드: 0 전부 통과 / 1 실패 있음 / 3 실행 환경 없음
//
// 의존: playwright MCP 가 받아 둔 npx 캐시의 playwright-core + ms-playwright chromium (프로젝트 node_modules 불필요)

import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const HOME = process.env.USERPROFILE || process.env.HOME;
const PW_CORE = path.join(HOME, 'AppData/Local/npm-cache/_npx/db89d7302a373f10/node_modules/playwright-core');
const CHROME = path.join(HOME, 'AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe');
if (!existsSync(PW_CORE) || !existsSync(CHROME)) {
  console.error('playwright-core 또는 chromium 경로가 없습니다:', PW_CORE, CHROME);
  process.exit(3);
}
const { chromium } = require(PW_CORE);

const base = (process.argv[2] || 'http://localhost:3010').replace(/\/$/, '');
const shotDir = process.argv[3] || 'screenshots/chat-contact-first';
mkdirSync(shotDir, { recursive: true });

const SID = 'a1b2c3d4-0000-4000-8000-000000000000';
const TOKEN = '11111111-2222-4333-8444-555555555555';
const PROMO_URL = (locale) => `https://liv-clinic.net/${locale}/events/2026-10-promotion`;

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

/** /api/chat/* 를 가짜로 대신한다. 서버가 하는 일(접수 안내·이벤트 안내·연락처 저장)을 흉내 낸다. */
async function mockChatApi(page, { locale, businessHours }) {
  const state = { messages: [], hasContact: false, contactPosts: [] };
  const iso = (offsetMs = 0) => new Date(Date.now() + offsetMs).toISOString();
  const push = (m) =>
    state.messages.push({
      session_id: SID,
      original_lang: 'ko',
      translated_text: null,
      translated_lang: null,
      translation_status: 'success',
      translation_error: null,
      source: 'app',
      ...m,
    });
  push({ id: 'sys-1', sender: 'system', original_text: 'Hello! How can we help you today?', original_lang: locale, translation_status: 'skipped', created_at: iso(-5000) });

  await page.route(/google-analytics|googletagmanager|wcs\.naver|analytics\.google/, (r) => r.abort());
  await page.route('**/api/chat/presence', (r) =>
    r.fulfill({
      json: {
        online: businessHours,
        operatorCount: 0,
        businessHours,
        nextOpenAt: businessHours ? null : '2026-10-05T01:00:00.000Z',
        schedule: {},
        source: 'businessHours',
      },
    })
  );
  await page.route('**/api/chat/sessions**', (r) => {
    if (r.request().method() === 'POST') {
      return r.fulfill({
        status: 201,
        json: { sessionId: SID, sessionToken: TOKEN, visitorLocale: locale, status: 'open', createdAt: iso(), businessHours, operatorOnline: businessHours },
      });
    }
    return r.fulfill({ json: { session: { id: SID, visitor_locale: locale, status: 'open' }, hasContact: state.hasContact } });
  });
  await page.route('**/api/chat/messages**', (r) => {
    const req = r.request();
    if (req.method() === 'GET') {
      const since = new URL(req.url()).searchParams.get('since');
      return r.fulfill({ json: { messages: state.messages.filter((m) => !since || m.created_at > since) } });
    }
    const { text } = req.postDataJSON();
    const visitor = {
      id: `v-${state.messages.length}`,
      session_id: SID,
      sender: 'visitor',
      original_text: text,
      original_lang: locale,
      translated_text: '(한국어 번역)',
      translated_lang: 'ko',
      translation_status: 'success',
      translation_error: null,
      created_at: iso(),
      source: 'app',
    };
    state.messages.push(visitor);
    push({
      id: `a-${state.messages.length}`,
      sender: 'operator',
      source: 'auto',
      original_text: '안녕하세요, 리브성형외과입니다. 메시지 잘 받았습니다.',
      translated_text: "Hello, this is LIV Plastic Surgery. We've received your message.",
      translated_lang: locale,
      created_at: iso(5),
    });
    if (/price|how much/i.test(text)) {
      push({
        id: `h-${state.messages.length}`,
        sender: 'operator',
        source: 'auto',
        original_text: `가격은 상담 직원이 확인한 뒤 정확히 안내드리겠습니다. 이번 달 프로모션은 아래에서 보실 수 있습니다.\n${PROMO_URL(locale)}`,
        translated_text: `Our consultants will confirm the exact price and get back to you. You can see this month's promotion here:\n${PROMO_URL(locale)}`,
        translated_lang: locale,
        created_at: iso(10),
      });
    }
    const saved = /@/.test(text);
    if (saved) state.hasContact = true;
    return r.fulfill({ status: 201, json: { message: visitor, contact: { saved, hasContact: state.hasContact } } });
  });
  await page.route('**/api/chat/contact', (r) => {
    const body = r.request().postDataJSON();
    state.contactPosts.push(body);
    if (body.kind === 'click') return r.fulfill({ json: { ok: true } });
    state.hasContact = true;
    return r.fulfill({ status: 201, json: { ok: true, hasContact: true } });
  });
  return state;
}

const panelOf = (page) => page.locator('div[role="dialog"]').filter({ has: page.locator('form') });
const cardOf = (page) => panelOf(page).locator('div.relative.my-2');
const tilesOf = (page) => cardOf(page).locator('[role="group"] > *');

async function openPage(context, locale, opts) {
  const page = await context.newPage();
  const state = await mockChatApi(page, { locale, ...opts });
  await page.goto(`${base}/${locale}`, { waitUntil: 'load' });
  // 이벤트 팝업이 떠 있으면 닫는다 (채팅 단추를 가릴 수 있다)
  const popupClose = page.locator('.z-\\[9999\\] .pointer-events-auto > button').first();
  try {
    await popupClose.waitFor({ timeout: 4000 });
    await popupClose.click();
  } catch {
    // 팝업 없음
  }
  return { page, state };
}

/** 채팅을 시작하고 첫 글을 보낸다. */
async function startAndSend(page, text) {
  await page.locator('.chat-launcher').click();
  const panel = panelOf(page);
  await panel.locator('form button[type="submit"]').click(); // Start Chat
  await panel.locator('textarea').waitFor();
  await panel.locator('textarea').fill(text);
  await panel.locator('form button[type="submit"]').click();
}

/** 패널을 닫았다 다시 연다 — 가짜 환경에는 실시간 알림이 없으므로, 이렇게 해야 자동 안내를 다시 불러온다. */
async function reopen(page) {
  await page.keyboard.press('Escape');
  await page.locator('.chat-launcher').click();
  await panelOf(page).locator('textarea').waitFor();
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
try {
  // ── 1. 영어 화면 · 영업시간 중 ──────────────────────────────────────────
  {
    const context = await browser.newContext({ viewport: { width: 414, height: 896 }, ignoreHTTPSErrors: true, permissions: ['clipboard-read', 'clipboard-write'] });
    const { page, state } = await openPage(context, 'en', { businessHours: true });
    await startAndSend(page, 'How much is Ulthera?');
    const card = cardOf(page);
    await card.waitFor({ timeout: 10000 });
    check('영어: 글을 보내면 영업시간 중에도 카드가 뜬다', await card.isVisible());
    check(
      '영어: 단추 순서 WhatsApp·WeChat·LINE·Email',
      JSON.stringify(await tilesOf(page).locator('span').allInnerTexts()) === JSON.stringify(['WhatsApp', 'WeChat', 'LINE', 'Email'])
    );
    check('영어: 영업 중 안내 문구', (await card.innerText()).includes("You don't have to wait here."));
    check('영어: 처음에는 WeChat QR 이 접혀 있다', (await card.locator('img[alt="WeChat QR"]').count()) === 0);
    const waHref = await tilesOf(page).nth(0).getAttribute('href');
    check('영어: WhatsApp 단추는 병원 번호 + 코드가 든 인사말', Boolean(waHref?.startsWith('https://wa.me/821068882773?text=') && waHref.includes('A1B2C3D4')));
    check('영어: LINE 단추는 친구 추가 링크', (await tilesOf(page).nth(2).getAttribute('href')) === 'https://line.me/ti/p/VJYu9BSnsX');
    await page.screenshot({ path: path.join(shotDir, 'en-1-card.png') });

    await tilesOf(page).nth(1).click(); // WeChat
    await card.locator('img[alt="WeChat QR"]').waitFor();
    check('영어: WeChat 단추를 누르면 QR·아이디가 펼쳐진다', (await card.innerText()).includes('livps0414'));
    check('영어: 펼친 것만으로는 직원에게 알리지 않는다', state.contactPosts.length === 0);
    await card.getByRole('button', { name: 'Copy' }).click();
    await card.getByRole('button', { name: 'Copied ✓' }).waitFor({ timeout: 3000 });
    check('영어: 아이디 복사 → 클립보드에 livps0414', (await page.evaluate(() => navigator.clipboard.readText())) === 'livps0414');
    await page.waitForTimeout(300);
    check('영어: 복사하면 직원에게 알린다 (click · wechat)', JSON.stringify(state.contactPosts) === JSON.stringify([{ sessionToken: TOKEN, channel: 'wechat', kind: 'click' }]));
    await card.getByRole('button', { name: 'Copied ✓' }).click();
    await page.waitForTimeout(300);
    check('영어: 같은 단추를 다시 눌러도 한 번만 알린다', state.contactPosts.length === 1);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(shotDir, 'en-2-wechat.png') });

    await tilesOf(page).nth(3).click(); // Email
    const mail = card.locator('a[href^="mailto:"]');
    await mail.waitFor();
    check('영어: 이메일 단추를 누르면 병원 주소가 펼쳐지고 WeChat 블록은 접힌다', (await mail.innerText()) === 'jaeho19@gmail.com' && (await card.locator('img[alt="WeChat QR"]').count()) === 0);
    check(
      '영어: 펼친 단추만 눌린 모양이다 (Email 펼침, WeChat 접힘)',
      (await tilesOf(page).nth(3).getAttribute('aria-expanded')) === 'true' && (await tilesOf(page).nth(1).getAttribute('aria-expanded')) === 'false'
    );
    await page.waitForTimeout(400);
    const mailHref = await mail.getAttribute('href');
    check('영어: 메일 제목에 코드가 들어간다', Boolean(mailHref?.includes(encodeURIComponent('LIV Plastic Surgery #A1B2C3D4'))));
    await page.screenshot({ path: path.join(shotDir, 'en-3-email.png') });

    // 연락처 남기기: Email 칩 → 저장 → 카드가 사라진다
    await card.getByRole('radio', { name: 'Email' }).click();
    await card.locator('input').fill('guest@example.com');
    await card.getByRole('button', { name: 'Save contact' }).click();
    await card.waitFor({ state: 'detached', timeout: 5000 });
    check('영어: 이메일을 저장하면 카드가 사라진다', (await cardOf(page).count()) === 0);
    const saved = state.contactPosts.find((p) => p.kind === 'save');
    check('영어: 저장 요청은 channel=email', saved?.channel === 'email' && saved?.handle === 'guest@example.com');

    // 자동 안내·이벤트 안내 말풍선 (다시 불러오기)
    await reopen(page);
    const link = panelOf(page).locator(`a[href="${PROMO_URL('en')}"]`);
    await link.waitFor({ timeout: 5000 });
    check('영어: 이벤트 안내의 주소는 새 창으로 여는 링크다', (await link.getAttribute('target')) === '_blank' && (await link.getAttribute('rel')) === 'noopener noreferrer');
    check('영어: 연락처가 있으면 다시 열어도 카드가 없다', (await cardOf(page).count()) === 0);
    await page.screenshot({ path: path.join(shotDir, 'en-4-bubbles.png') });
    await context.close();
  }

  // ── 2. 영어 화면 · 상담 시간 외 + ✕ 닫기 ─────────────────────────────────
  {
    const context = await browser.newContext({ viewport: { width: 414, height: 896 }, ignoreHTTPSErrors: true });
    const { page } = await openPage(context, 'en', { businessHours: false });
    await startAndSend(page, 'Hello, I want to book next week');
    const card = cardOf(page);
    await card.waitFor({ timeout: 10000 });
    check('상담 시간 외: 복귀 시각 안내(한국 시각)', (await card.innerText()).includes('(Korea time)'));
    await page.screenshot({ path: path.join(shotDir, 'en-5-offhours.png') });
    await card.getByRole('button', { name: 'Dismiss' }).click();
    check('✕ 를 누르면 카드가 사라진다', (await cardOf(page).count()) === 0);
    const stored = await page.evaluate((sid) => window.localStorage.getItem(`liv-chat-capture-dismissed:${sid}`), SID);
    check('닫은 시각을 기억한다 (12시간용)', Number(stored) > 1_700_000_000_000);
    await reopen(page);
    await page.waitForTimeout(800);
    check('닫은 뒤 다시 열어도 12시간 안에는 뜨지 않는다', (await cardOf(page).count()) === 0);
    await context.close();
  }

  // ── 3. 중국어·일본어 화면 ────────────────────────────────────────────────
  for (const [locale, firstTile, defaultChip] of [
    ['zh', 'WeChat', 'WeChat'],
    ['ja', 'LINE', 'Email'],
  ]) {
    const context = await browser.newContext({ viewport: { width: 414, height: 896 }, ignoreHTTPSErrors: true });
    const { page } = await openPage(context, locale, { businessHours: true });
    await startAndSend(page, locale === 'zh' ? '超声刀多少钱？' : 'ウルセラの料金を教えてください');
    const card = cardOf(page);
    await card.waitFor({ timeout: 10000 });
    const labels = await tilesOf(page).locator('span').allInnerTexts();
    check(`${locale}: 맨 앞 단추는 ${firstTile}, 맨 뒤는 Email`, labels[0] === firstTile && labels[3] === 'Email', labels.join(' · '));
    const checkedChip = await card.locator('[role="radio"][aria-checked="true"]').innerText();
    check(`${locale}: 연락처 남기기의 기본 선택은 ${defaultChip}`, checkedChip.trim() === defaultChip);
    const qrShown = (await card.locator('img[alt="WeChat QR"]').count()) === 1;
    check(`${locale}: WeChat QR ${locale === 'zh' ? '이 펼쳐져 있다' : '은 접혀 있다'}`, locale === 'zh' ? qrShown : !qrShown);
    check(`${locale}: 칩에 LINE 이 없다`, !(await card.locator('[role="radio"]').allInnerTexts()).some((t) => t.includes('LINE')));
    await page.screenshot({ path: path.join(shotDir, `${locale}-card.png`) });
    if (locale === 'zh') {
      await card.locator('button[aria-label="WeChat QR"]').click();
      const modal = page.locator('div[role="dialog"][aria-label="WeChat QR"]');
      await modal.waitFor();
      check('zh: QR 을 누르면 크게 보기가 뜬다', await modal.isVisible());
      await page.keyboard.press('Escape');
      await modal.waitFor({ state: 'detached' });
      check('zh: 크게 보기를 닫아도 카드는 그대로다', await card.isVisible());
    }
    await context.close();
  }

  // ── 4. 사이트 오른쪽 단추(데스크톱)의 아이콘이 그대로인가 ───────────────────
  {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, ignoreHTTPSErrors: true });
    const { page } = await openPage(context, 'ja', { businessHours: true });
    await page.waitForTimeout(1500); // 단추가 나타나는 애니메이션(scale 0.8 → 1)이 끝나기를 기다린다
    const lineD = await page.locator('a[data-analytics-contact="line"] svg path').getAttribute('d');
    const waD = await page.locator('a[data-analytics-contact="whatsapp"] svg path').getAttribute('d');
    check('오른쪽 LINE 단추 아이콘', Boolean(lineD?.startsWith('M19.365 9.863') && lineD.length === 1066));
    check('오른쪽 WhatsApp 단추 아이콘', Boolean(waD?.startsWith('M17.472 14.382') && waD.length === 1104));
    const box = await page.locator('a[data-analytics-contact="line"]').boundingBox();
    check('오른쪽 단추 크기 48×48', Boolean(box && Math.round(box.width) === 48 && Math.round(box.height) === 48), box ? `${box.width}×${box.height}` : '없음');
    await page.locator('.social-contact-links').screenshot({ path: path.join(shotDir, 'floating-cta.png') });
    await context.close();
  }
} catch (e) {
  check('스크립트가 끝까지 돌았다', false, e instanceof Error ? e.message.split('\n')[0] : String(e));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} 통과 · 화면 사진: ${shotDir}`);
process.exit(failed ? 1 : 0);
```

- [ ] **Step 4: 로컬 서버를 띄우고 화면 확인**

포트 3000은 다른 프로젝트(liv-crm)가 쓴다 — 3010을 쓴다.

Run (백그라운드): `NODE_TLS_REJECT_UNAUTHORIZED=0 npx next start -p 3010`
서버가 뜰 때까지 기다린다: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3010/en` 이 `200`을 돌려줄 때까지(보통 2~3초).

Run (워크트리 루트에서): `node chat-contact-card-check.mjs http://localhost:3010 screenshots/chat-contact-first`
Expected: 마지막 줄 `35/35 통과 · 화면 사진: screenshots/chat-contact-first`, 종료 코드 0. `FAIL` 줄이 있으면 그 항목부터 고친다(스크립트를 고쳐서 통과시키지 않는다).

화면 사진 8장을 열어 눈으로 확인한다(Read 도구로 PNG를 연다): `en-1-card.png`(단추 네 개가 아이콘과 함께 나란히), `en-2-wechat.png`(QR·아이디·Copied ✓), `en-3-email.png`(병원 주소·Copy, Email 단추가 눌린 모양), `en-4-bubbles.png`(이벤트 안내 주소에 밑줄), `en-5-offhours.png`(복귀 시각 안내), `zh-card.png`(QR이 펼쳐져 있다), `ja-card.png`(LINE이 맨 앞, Email 칩 선택), `floating-cta.png`(오른쪽 LINE·WhatsApp 단추가 예전 그대로).

끝나면 서버를 멈춘다(PowerShell): `Get-NetTCPConnection -LocalPort 3010 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -Confirm:$false }`

- [ ] **Step 5: 계획서 대조 (전체)**

Run: `node ../plan-fidelity-check.mjs --root ..`
Expected: `66/66 일치`, 종료 코드 0 — 계획서에 실린 코드 블록 66개가 모두 워크트리의 파일과 글자 하나까지 같다. `다름`·`없음` 줄이 있으면 **파일을 계획서에 맞춰** 고치고(계획서를 고치지 않는다) Step 1부터 다시 한다. 계획서 쪽이 틀렸다고 판단되면 고치기 전에 멈추고 보고한다.

- [ ] **Step 6: 스펙에 구현 상태를 적는다**

`docs/superpowers/specs/2026-10-01-chat-contact-first-design.md` 머리말의 `> 상태: **원장님 승인(2026-10-01), 손님 문구도 확정.** …` 줄 **바로 아래**에 한 줄을 더한다(날짜는 구현을 마친 날로):

```markdown
> 구현(2026-10-01): 계획서 `docs/superpowers/plans/2026-10-01-chat-contact-first.md` 대로 브랜치 `feature/chat-contact-first`에 구현했다 — 테스트 58파일 878건·타입 검사·빌드·화면 확인(35개 항목) 통과. 스펙을 보완한 점은 계획서의 「스펙에서 보완한 점」 표에 있다. **운영 반영(042 적용 → master 푸시 → 스모크)은 원장님 승인 대기.**
```

- [ ] **Step 7: 임시 도구를 지우고 커밋**

대조 도구는 이 계획 전용이라 남기지 않는다. 화면 확인 스크립트는 다시 쓸 수 있으므로 커밋한다(`screenshots/`는 `.gitignore`에 있어 커밋되지 않는다).

```bash
rm ../plan-fidelity-check.mjs
git add ../chat-contact-card-check.mjs ../docs/superpowers/specs/2026-10-01-chat-contact-first-design.md
git commit -m "test(chat): 연락처 카드 화면 확인 스크립트(가짜 API) + 스펙에 구현 상태 기록" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git status --short
```
Expected: 마지막 `git status --short` 가 비어 있다.

- [ ] **Step 8: 원장님께 결과 보고**

보고할 것: 게이트 결과(실제 출력의 건수), 화면 사진 위치, 스펙을 보완한 점 11가지(위 표), 그리고 Task 19의 승인 요청 세 가지. 푸시는 하지 않았다는 점을 분명히 적는다.

---

### Task 19: 운영 반영 (원장님 승인 지점)

**이 과제의 모든 단계는 운영에 닿는다. 단계마다 원장님께 묻고, 답을 받은 뒤에만 실행한다.** 한 번의 승인을 다음 단계의 승인으로 넘겨 쓰지 않는다.

**Files:** 없음(코드 변경 없음)

**Interfaces:**
- Consumes: 브랜치 `feature/chat-contact-first`(Task 1~18 커밋), `liv-clinic/.env.local`의 `DATABASE_URL`, Netlify CLI 로그인(사이트 `de7005fe-c770-4b2f-bbe0-1025513014d5`)
- Produces: 운영 DB의 042 컬럼, 운영 배포, 스모크 결과, 직원 안내

순서는 스펙 §9 그대로다: **042를 먼저** 적용하고(추가형이라 지금 돌고 있는 코드에 영향이 없다), 그 다음에 배포한다.

- [ ] **Step 1: [승인 ①] 마이그레이션 042 적용을 묻는다**

원장님께 이렇게 묻는다: "채팅 테이블에 칸 3개를 더하는 마이그레이션 042를 운영 DB에 적용해도 될까요? 추가만 하는 변경이라 지금 사이트 동작에는 영향이 없습니다. 먼저 되돌리는 시험(dry-run)을 한 번 하고, 이상 없으면 적용합니다."

- [ ] **Step 2: 042 dry-run (승인 ① 뒤)**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/_db/run-sql.mjs supabase/migrations/042_chat_contact_first.sql`
Expected: `[run-sql] … executed inside transaction` → `[verify] trigger OK` → `[run-sql] ROLLED BACK (dry run)`. (이 스크립트의 트리거 검증은 040 것이다 — 042가 트리거를 건드리지 않았음을 다시 확인하는 용도로 그대로 쓴다.)

- [ ] **Step 3: 042 적용**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/_db/run-sql.mjs supabase/migrations/042_chat_contact_first.sql --apply`
Expected: `[verify] trigger OK` → `[run-sql] COMMITTED`

- [ ] **Step 4: 컬럼 확인 + 측정 항목 9 첫 실행 (읽기 전용)**

Run: `NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/chat-response-baseline.mjs`
Expected: 첫 줄에 `클릭 컬럼: 있음`, 항목 0~8이 예전처럼 나오고, `── 9. [G-6] 이벤트 안내 …` 표가 `세션 0`으로 나온다(건너뜀 문구가 아니다), 마지막 줄 `완료 (READ ONLY 트랜잭션 — 아무것도 변경하지 않았습니다)`. 항목 9에서 SQL 오류가 나면 Task 17의 질의를 고치고 다시 커밋한다.

- [ ] **Step 5: [승인 ②] 운영 배포와 스모크를 묻는다**

원장님께 이렇게 묻는다(세 가지를 함께 알린다):
1. "master에 푸시하면 Netlify가 자동으로 배포합니다. 진행할까요?"
2. "이 브랜치에는 WeChat QR 교체(8646dfc)와 LINE 친구 추가 링크(435869d)도 들어 있어 함께 나갑니다."
3. "배포 뒤 시험 문의(이름 `Smoke Test 1001`)를 운영 사이트에 넣어 확인합니다. 직원 Slack에 실제 알림이 가므로, 직원분들께 미리 알려 주시거나 시험할 시간을 정해 주세요."

- [ ] **Step 6: 푸시 (승인 ② 뒤)**

Run:
```bash
git fetch origin
git merge-base --is-ancestor origin/master HEAD && echo FF-OK
```
Expected: `FF-OK` (origin/master가 이 브랜치의 조상이다 — fast-forward 가능). `FF-OK`가 안 나오면 멈춘다: master가 그 사이 움직인 것이므로 워크트리에서 `git merge origin/master` → Task 18의 게이트(Step 1·2)를 다시 통과시킨 뒤 원장님께 다시 알리고 진행한다.

Run: `git push origin feature/chat-contact-first:master`
Expected: `… -> master` (fast-forward). 메인 폴더 `D:\dev\LIV_homepage`의 체크아웃은 건드리지 않는다(그쪽 세션이 `git pull`로 따라온다).

- [ ] **Step 7: 배포 완료 확인**

Netlify는 GitHub 커밋 상태를 남기지 않는다. 공개 페이지의 표식으로 확인한다 — 새 카드 문구가 페이지에 실려 나오는지 60초 간격으로 최대 25번 본다:

Run: `curl -sk https://liv-clinic.net/en | grep -c "captureBusyLead"`
Expected: 배포 전 `0` → 배포 뒤 `1` 이상(채팅 문구는 페이지에 함께 실려 나간다 — 2026-10-01 확인: 지금은 `captureHeading`만 있고 `captureBusyLead`는 없다). 25분 안에 바뀌지 않으면 Netlify CLI로 배포 상태를 본다(`NETLIFY_SITE_ID=de7005fe-c770-4b2f-bbe0-1025513014d5 NODE_TLS_REJECT_UNAUTHORIZED=0 netlify api listSiteDeploys --data '{"site_id":"de7005fe-c770-4b2f-bbe0-1025513014d5","per_page":3}'` 의 `state`: `building` → `ready`). 추정으로 "배포됨"이라고 보고하지 않는다.

- [ ] **Step 8: [승인 ③ — 값이 있을 때만] 휴진일 등록**

원장님이 올해 남은 휴진일(U-3)을 알려 주신 경우에만 한다. 묻는다: "휴진일 `2026-…` 을 Netlify 환경변수 `CHAT_CLOSED_DATES`에 등록하고 다시 배포해도 될까요?"

Run (승인 뒤, 값은 받은 날짜로):
```bash
NETLIFY_SITE_ID=de7005fe-c770-4b2f-bbe0-1025513014d5 NODE_TLS_REJECT_UNAUTHORIZED=0 netlify env:set CHAT_CLOSED_DATES "2026-10-03,2026-10-09"
NETLIFY_SITE_ID=de7005fe-c770-4b2f-bbe0-1025513014d5 NODE_TLS_REJECT_UNAUTHORIZED=0 netlify api createSiteBuild --data '{"site_id":"de7005fe-c770-4b2f-bbe0-1025513014d5"}'
```
Expected: `env:set` 성공 메시지, `createSiteBuild` 응답에 `deploy_id`. 함수 환경변수는 배포 시점에 고정되므로 재배포가 끝나야 적용된다. 값을 받지 못했으면 이 단계를 건너뛴다(빈 값 = 지금과 같은 동작).

- [ ] **Step 9: 운영 스모크 (승인 ②에서 정한 시간에)**

운영 사이트 `https://liv-clinic.net`에서 이름 `Smoke Test 1001`로 한다. Slack 쪽 확인은 원장님 또는 직원이 화면을 보고 알려 준다(이 PC의 브라우저는 Slack에 로그인돼 있지 않다). 스펙 §9의 4번 목록 그대로다:

| # | 하는 일 | 기대 |
|---|---------|------|
| 1 | 영업시간 중 `/en`에서 "Hello, I'd like a consultation" | 접수 안내(`open`: "…10–20 minutes…")가 3초 안에, 카드가 낮에도 뜬다 |
| 2 | 카드에서 Email 칩 → 이메일 저장 | 대화창에 "Email contact saved: …", 방에 📱(분류 안내 3줄), `#해외문의`에 📋. 5분 뒤에도 ⏰ 알림이 없다 |
| 3 | 다른 시험 세션에서 연락처 없이 5분 대기 | 기존 ⏰ 5분 알림이 온다(회귀 확인) |
| 4 | 글에 이메일을 써서 보냄 | 자동 저장 확인 문구, 접수 안내가 "…at the contact you left…", 방에 글 → 📱 순서 |
| 5 | 연락처를 남긴 시험 세션의 방에 한국어로 답글 | 바로 아래 번역문만 담긴 글 → 업무폰 Slack에서 길게 눌러 복사 → WeChat 입력창에 붙여 넣어 번역문만 들어가는지 |
| 6 | `/zh`에서 글 보냄 | 카드에 병원 WeChat QR·아이디가 펼쳐져 있다. 아이디 복사 → 방에 📲. 복사한 아이디로 실제 WeChat 검색, 다른 기기로 QR 스캔 |
| 7 | 카드의 단추 네 개 | 영어 WhatsApp·일본어 LINE·중국어 WeChat이 맨 앞. Email 단추 → 병원 주소 → 복사·메일 앱(코드가 든 글) → 방에 📲. 사이트 오른쪽 LINE·WhatsApp 단추 모양 그대로 |
| 8 | `/en`에서 "How much is Ulthera?" | 접수 안내 **뒤에** 이벤트 안내, 링크를 누르면 새 창에서 이번 달 프로모션(영어 포스터), 방에 🎁. 같은 세션에서 다시 물어도 두 번째 안내 없음. `/ja`·`/zh`에서도 그 언어 문장·페이지 |
| 9 | 5% 배너로 채팅을 열어 미리 채워진 문장만 보냄 | 이벤트 안내가 나가지 않는다 |
| 10 | 연락처 없는 시험 세션에서 가격 질문 뒤 5분 대기 | ⏰ 알림이 그대로 온다(이벤트 안내는 답변으로 치지 않는다) |
| 11 | 다음 요약 시각(10:00 또는 18:00, 토 15:00) | `#해외문의`에 📋 오늘 연락할 손님 N명 → 방에 답글 → 다음 요약에서 빠진다 |

스모크가 끝나면 시험 세션의 방을 보관(완료)한다. 실패한 항목이 있으면 되돌리기(아래)를 원장님과 정한다.

- [ ] **Step 10: 직원 안내문 (원장님이 `#해외문의`에 게시)**

스펙 §9의 5번 문안을 그대로 드린다:

> 손님이 연락처를 남기면 재촉 알림이 멈추고 '오늘 연락할 손님'으로 표시됩니다. 여유 있을 때 **그 방에 한국어로 답을 쓰면 바로 아래에 번역본이 올라옵니다.** 그것을 복사해 위챗·왓츠앱·메일에 붙여 넣어 보내 주세요. 방에 답을 쓰면 목록에서 빠지고, 상담이 끝나면 방을 보관해 주세요. 문 열 때와 마감 1시간 전에 남은 손님 목록이 올라옵니다. 연락처가 없는 손님은 지금처럼 5·12·30분 알림이 옵니다.
> 채팅창에 병원 위챗 QR과 아이디가 나갑니다. 업무폰 위챗에 친구 요청이 오면 수락하고, 손님이 보낸 코드(#로 시작)로 어느 방 손님인지 확인해 주세요.
> 위챗 손님이 보낸 글은 위챗의 번역으로 읽을 수 있습니다: 나 → 설정 → 일반 → 번역 → "채팅에서 받은 메시지 자동 번역"을 켜거나, 메시지를 길게 눌러 "번역". 짧은 답은 입력창을 길게 눌러 "쓰면서 번역"을 써도 됩니다(업무폰에서 메뉴가 보이는지는 확인 필요).
> 손님이 가격을 물으면 이번 달 프로모션 페이지 링크가 자동으로 먼저 나갑니다(방에 🎁 표시). 가격 답변은 지금처럼 직접 해 주세요 — 손님이 이벤트 페이지를 보고 있으니 그 내용과 맞춰 안내해 주세요.

- [ ] **Step 11: 측정**

스모크 직후 한 번: `NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/chat-response-baseline.mjs --since 2026-10-01` → 항목 8의 자동 안내 지연(목표 3초 이내, G-5)과 항목 9(G-6)를 기록한다. 2주·4주 뒤에 같은 명령으로 G-1~G-6을 다시 잰다(시험 세션은 이름으로 빠진다).

- [ ] **Step 12: 메모리 갱신**

`C:\Users\1\.claude\projects\D--dev-LIV-homepage\memory\chat-auto-reply-baseline-2026-10.md` 의 진행 상태를 고친다: 구현 완료 커밋, 042 적용일, 배포 커밋, 스모크 결과, 스펙을 보완한 점(클릭 한도 분리 등), 측정 재실행 예정일(2주·4주 뒤의 날짜를 절대 날짜로). `MEMORY.md`의 그 줄도 한 줄로 고친다.

**되돌리기** (스펙 §9): Slack 쪽 동작은 Netlify 환경변수 `CHAT_FOLLOWUP=off`, 이벤트 안내는 `CHAT_EVENT_HINT=off`(둘 다 재배포해야 적용 — 승인 필요), 그 밖의 손님 화면은 해당 커밋을 되돌려 푸시한다(승인 필요). 042는 추가형이라 그대로 둔다.

---

## 스펙 대조 (자체 점검)

| 스펙 | 요구 | 과제 |
|------|------|------|
| §4.1 | 접수 안내 문장 조합(12키 × 10개 언어 + 한국어 원문), 12시간마다, 그 밖에는 짧은 안내 | 4 |
| §4.1 | `businessSlot` — open / closing(마감 60분 이하) / closed | 2 |
| §4.1 | 발송 시점 앞당기기: INSERT → 이메일 인식 → 자동 안내 시작 → 번역 → 응답 → after | 9 |
| §4.2 | 카드 노출 규칙(`shouldShowCaptureBlock`), ✕ 12시간, 직원 글 10분 | 3, 15 |
| §4.2 | 단추 네 개 + 아이콘, WeChat QR·아이디 블록(zh는 펼침), 이메일 블록, 눌러도 카드 유지, 저장하면 사라짐, LINE ID 미수집 | 13, 15 |
| §4.2 | `GET /api/chat/messages`에 `source`, `GET /api/chat/sessions?token=`에 `hasContact` | 9 |
| §4.3 | 글 속 이메일 인식(`extractEmail`) → 저장 → 확인 문구 → 응답 `contact` → Slack은 글 다음에 | 3, 6, 9 |
| §4.4 | `POST /api/chat/contact` `save`(email 포함, line 호환)·`click`, 확인 문구 교체, 한도 | 6 |
| §4.5 (a) | 연락처가 있는 세션을 재촉 알림 후보에서 제외 | 10 |
| §4.5 (b) | 방 📱 문구, 피드 📋, 시작 화면 이메일 꼬리말, 단추 클릭 📲(네 채널) | 5 |
| §4.5 (c) | 하루 두 번 요약(창 9분, 선점, 7일, 20명, 방 없으면 관리자 링크, 직원 없으면 무게시) | 5(문구), 11 |
| §4.5 (d) | 직원 답글 번역본을 방에 게시(연락 수단이 있는 방 세션, 별도 조회) | 5 |
| §4.5 | 긴급 정지 `CHAT_FOLLOWUP=off` | 1, 5, 10, 11 |
| §4.6 | 휴진일 `CHAT_CLOSED_DATES` | 2 |
| §4.7 | Slack 문구 표 전부 | 5 |
| §4.8 | 관리자 목록 `오늘 연락` 배지 | 11(판정), 16 |
| §4.9 | 오류·엣지 표 — 042 미적용 시 경고만, 입력창 비우기, 프로모션 없음·조회 실패 → 목록 링크 등 | 5, 6, 8, 9, 11, 15 |
| §4.10 | 낱말 판정(`looksLikePriceQuestion`, 배너 문장 제거) | 7 |
| §4.10 | 이벤트 안내 발송(주소로 프로모션 찾기, 12시간·10분, 선점, `source='auto'`), 문장 2종 × 10개 언어 | 8 |
| §4.10 | 방에 🎁 알림 | 5, 9 |
| §4.10 | 말풍선 링크(`splitLinks`, `MessageBubble`) | 12 |
| §4.10 | 긴급 정지 `CHAT_EVENT_HINT=off` | 1, 8 |
| §4.10 | 측정 항목 9 | 17 |
| §5 | 마이그레이션 042 (파일) / 운영 적용 | 1 / 19 |
| §6 | 환경변수 세 개, `.env.example` | 1 |
| §7 | `serverI18n` 문장, 메시지 JSON 신규 키 10개(바이트 보존) | 4, 6, 8, 14 |
| §8 | 테스트 표 | 각 과제 |
| §9 | 롤아웃(042 먼저 → 배포 → 스모크 → 직원 안내 → 측정), 되돌리기 | 19 |
| §11 | 인계 메모의 제약(명령·게이트·JSON·승인) | Global Constraints |

스펙에 있지만 이 계획이 하지 않는 것: U-3 휴진일 값 등록(값을 받으면 Task 19 Step 8), U-5 처리방침 문구(승인 전), §10 "이번에 하지 않는 것" 전부.

---

## 실행 방식

**원장님 확인(2026-10-01): 이 계획대로, 새 창에서 그 창이 직접 과제를 차례로 실행한다(Inline Execution — REQUIRED SUB-SKILL: superpowers:executing-plans).** 코드가 이미 검증돼 있으므로 과제마다 하위 에이전트를 띄워 검토하는 방식(superpowers:subagent-driven-development)은 쓰지 않는다.

- Task 0~18은 원장님께 묻지 않고 끝까지 진행한다(이미 승인됨). 막히거나 계획과 다르게 해야 할 때만 멈추고 보고한다.
- Task 18이 끝나면 결과를 보고하고, Task 19는 승인 지점 ①②③에서 하나씩 묻는다.
- 계획서가 길다(약 9천 줄). 한 번에 다 읽지 않는다 — `### Task N` 제목의 줄 번호를 Grep으로 찾아 과제 단위로 읽는다.
