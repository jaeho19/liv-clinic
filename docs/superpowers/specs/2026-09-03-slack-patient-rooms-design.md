# 라이브채팅 Slack 환자별 채널(방) 전환 — 설계 (slack-patient-rooms)

> 작성: 2026-09-03 · 대상: Slack 릴레이(`liv-clinic/src/lib/chat/slack*.ts`, `src/app/api/slack/events`), 세션 API, 관리자 채팅 화면
> 관련: `docs/01-plan/features/chat-slack-ops-improvement.plan.md`(2026-09-01, 이하 "09-01 계획서"), `docs/02-design/features/chat-offhours-messenger-bridge.design.md`(구현 완료), 마이그레이션 036·037
> 결정(2026-09-03, 원장님): **A안 채택** — Slack 유지 + 손님 1명당 비공개 채널 1개. 앱 재설치는 원장님이 직접. 알림은 **첫 문의 전원 → 이후 담당자만 → 담당자가 답을 안 하면 다른 직원에게 확대**.

---

## 0. 한눈에 보기 (비개발자용)

| 지금 | 바뀐 뒤 |
|------|---------|
| `#해외문의` 채널 하나에 모든 손님이 스레드로 쌓인다 | **손님 1명 = 비공개 채널 1개.** 사이드바가 카카오톡 채팅 목록처럼 된다 |
| 스레드를 열어야 답했는지 안다 | 안 읽은 방은 **굵게**. 방을 열면 누가 뭐라고 답했는지 그대로 보인다 |
| 완료해도 채널에 계속 남는다 | **완료 = 채널 보관.** 사이드바에서 사라지고, 손님이 다시 말을 걸면 되살아난다 |
| 담당자 개념이 없다 | **답한 사람이 담당자.** 손님의 다음 메시지는 담당자만 멘션한다 |
| 답이 없어도 아무도 모른다 | 영업시간 중 **5분·12분·30분** 무응답이면 담당자 → 전원 순으로 멘션이 확대된다 |
| 직원끼리 상의할 곳이 없다 | **방 안의 스레드 = 내부 메모.** 손님에게 가지 않는다 |
| 손님이 답을 받기까지 아무 반응이 없다 | 첫 메시지 직후 손님 언어로 **"안녕하세요! 잠시만 기다려 주세요. 곧 답변을 드리겠습니다"** 자동 안내. 영업시간 외에는 "상담 시간에 순서대로 답변드리겠습니다" |
| 원장님 계정이 보기만 해도 상태가 바뀔까 걱정 | 원장님 계정은 **관찰자**. 방에 들어가 보기만 하고, 멘션 대상도 담당자도 되지 않는다. 상태는 답변 직원의 답글로만 바뀐다 |

비용 0원. Slack 앱 권한 추가로 재설치 1회. 이미 진행 중인 스레드는 그대로 끝까지 동작한다.

```
[직원 사이드바]                         [방 하나]
채널                                    # chat-thu-nguyen-a1b2c3
  # 해외문의        ← 알림 피드           주제: 🇻🇳 Thu Nguyen · 베트남어 · #A1B2C3D4 · thu@example.com · 관리자 화면에서 열기
  # chat-thu-nguyen-a1b2c3  (굵게=안읽음)
  # chat-yamada-77f0e1                   LIV 상담봇  14:03
  # chat-en-3c9e2b                       🔴 새 문의 · @이정현 @정소월 @방애금 · 📥 09/03(목) 14:03 KST
                                         울쎄라 300샷 가격이 얼마인가요?
  (완료된 방은 보관되어 사라짐)            > 원문: Ulthera 300 shots giá bao nhiêu ạ?

                                         이정현  14:06
                                         안녕하세요, 리브성형외과입니다. 울쎄라는 …   ← 손님에게 번역 전달, 이정현이 담당

                                         LIV 상담봇  14:12
                                         @이정현 · 14:12 KST
                                         이번 주 목요일 예약 가능한가요?
                                           └ (스레드) 정소월: 목요일 원장님 수술 있어요  ← 손님에게 안 감
```

---

## 1. 배경과 결정

09-01 계획서는 `#해외문의` 채널 하나를 유지한 채 스레드 루트를 Block Kit 상태 카드로 바꾸고, 완료 건은 `#상담-완료` 채널에 요약을 옮기는 방식을 잡았다. 원장님이 2026-09-03에 "카카오톡처럼 **사람별 채팅창**"을 요구하면서 세 가지 선택지를 비교했다.

| 선택지 | 판정 | 이유 |
|--------|:----:|------|
| **A. Slack 환자별 비공개 채널** | **채택** | 비용 0, 재설치 1회, 기존 릴레이 코드 대부분 유지. 완료=보관이 "채널에서 치우기"를 가장 깨끗하게 해결 |
| B. 상담 전용 툴(Chatwoot·Crisp·채널톡) | 보류 | 월 6~15만 원, Slack 연동 코드 폐기, 환자 정보를 맡기는 업체 추가. A를 2주 써보고도 불편하면 재검토 |
| C. 관리자 화면을 카톡형 인박스로 | 이후 | 직원별 로그인·휴대폰 푸시를 새로 만들어야 함(작업량 대). A와 병행 가능 |

확인된 Slack 사실 (2026-09-03):
- 무료 플랜은 **공개·비공개 채널 수 제한이 없다.**
- 봇 토큰이 `groups:write` 하나로 비공개 채널 **생성·초대·주제 설정·보관·보관 해제**를 할 수 있다. 생성은 Tier 2(분당 20회), 초대는 Tier 3(분당 50회).
- 채널 이름은 소문자·숫자·`-`·`_`, 80자 이내. 보관된 채널의 이름도 점유된다(`name_taken`).
- 사이드바 사용자 정의 섹션은 유료 전용이지만, 완료=보관이면 **열린 상담만 남으므로** 정렬 기능이 필요 없다.
- 채널 알림 기본값은 "멘션만"이다. 멘션 없이는 휴대폰에 아무 것도 오지 않는다. → 봇이 멘션한다.
- `group_archive` / `group_unarchive` 이벤트를 구독하면 직원이 Slack에서 직접 보관해도 알 수 있다.

---

## 2. 목표

| # | 목표 | 현재 | 목표 |
|---|------|------|------|
| G-1 | 손님 첫 메시지 → 직원 사이드바에 방이 뜨고 전원 멘션이 가기까지 | 해당 없음 | **≤ 5초** |
| G-2 | 완료된 상담이 사이드바에서 사라지는 비율 | 0% | **100%** (보관) |
| G-3 | Slack 답글의 작성자가 DB에 남는 비율 | 0% (`sender_admin_id: null` 고정) | **100%** (`slack_user_id`) |
| G-4 | 영업시간 내 5분 무응답 시 첫 멘션 도착 | 없음 | **≤ 8분** (3분 크론) |
| G-5 | 담당자 12분 무응답 시 전원 멘션 | 없음 | **100%** |
| G-6 | 방 생성 실패로 인한 문의 유실 | 해당 없음 | **0건** (스레드 방식 폴백) |
| G-7 | 첫 답변까지 중앙값 (`slack-health-check.mjs`) | 6.2분 | **≤ 3분** (배포 2주 후 재측정) |
| G-8 | 손님 첫 메시지 → 손님 언어 자동 안내 도착 | 없음 | **≤ 3초**, 번역 API 호출 0회 |
| G-9 | 관찰자(원장님) 계정의 열람·답글이 담당자·멘션을 바꾸는 횟수 | 해당 없음 | **0회** |

**비목표 (이번 단계에서 하지 않음)**
- Block Kit 상태 카드·버튼(내가 맡기/완료/담당 넘기기), `/api/slack/interactive` — 2단계
- 자주 쓰는 답변, 번역 캐시 — 2단계
- 손님 화면 즉시 반응·번역 비동기화(09-01 §6.1) — 별건으로 진행 (모델 교체 마감 2026-10-23은 그대로 유효)
- 읽음 표시 — Slack은 봇에게 누가 읽었는지 알려주지 않고, 관리자 화면은 공용 계정이라 사람을 특정할 수 없다(§4.11)
- `users:read` 스코프 — 직원 이름은 환경변수로 매핑
- 관리자 화면 2단 인박스 개편 — 선택지 C

---

## 3. 범위

**In Scope**
- Slack 봇 API 래퍼 확장: 공통 호출기(재시도) + 채널 생성·초대·주제·보관·해제
- 방 생성/게시/멘션 규칙, 인바운드 라우팅(방 본문=전달, 스레드=내부 메모), 자동 담당
- 완료/종료/재오픈 ↔ 보관/해제 동기화(양방향)
- 미응답 확대 알림 크론 (`netlify/functions/chat-ops.mts` + `POST /api/chat/ops`)
- `#해외문의` 피드 한 줄 알림 + 방 생성 실패 시 스레드 폴백
- 마이그레이션 040 (전부 추가형)
- 관리자 화면 최소 변경: KST 고정, 담당/작성자 표시, 완료 처리 버튼, 완료 탭
- 자동 첫 안내(손님 언어, 영업시간 중/외 2종) — `serverI18n.ts`의 시스템 메시지 표에 키 2개 추가. `src/messages/*.json`은 건드리지 않으므로 `verify:i18n` 영향 없음
- 관찰자 계정(`SLACK_OBSERVERS`) — 방 초대만, 멘션·담당 제외
- 직원 답장 번역 말투를 친근하게 — 번역 프롬프트 규칙 1줄 교체(§4.12)
- 손님 문구 신규는 위 자동 안내 2종뿐 (로케일 JSON 변경 0건)

**Out of Scope**
- `chat.delete` 어떤 경로로도 호출하지 않음 (09-01 §4.4)
- `conversations.history` / `replies`로 Slack을 **읽는** 기능 (무료 90일 제한, 현재 0건 유지)
- 기존 `message.groups` 구독·서명 검증·event_id 멱등 처리 구조 변경 없음

---

## 4. 설계

### 4.1 세 가지 자리

| 이름 | 무엇 | 언제 |
|------|------|------|
| **방 (room)** | 손님 1명당 비공개 채널 `chat-{이름}-{코드}` | 이번 설계의 기본. `chat_sessions.slack_mode = 'room'` |
| **스레드 (thread)** | `#해외문의` 안의 스레드 (현행 방식) | 이미 진행 중인 세션, 그리고 방 생성 실패 시 폴백. `slack_mode = 'thread'` |
| **피드 (feed)** | `#해외문의` 본문 | 새 문의·완료·재오픈·🚨 한 줄 알림. **멘션 없음**. 스레드 모드의 스레드도 여기 붙는다 |

`SLACK_CHANNEL_ID`는 계속 `#해외문의`를 가리킨다. 채널 이름·ID를 바꾸지 않는다. 세션의 모드는 컬럼 `slack_mode`로 명시한다 — `slack_channel_id`와 환경변수를 비교해 추론하지 않는다(환경변수가 바뀌면 추론이 깨진다).

### 4.2 방 생성 — 손님의 첫 메시지

`relayChatMessageToSlack()`이 세션의 `slack_mode`가 NULL이면 `ensureRoom(session)`을 부른다. `after()` 안에서 실행되며 Slack 호출 최대 5회(생성·주제·초대·본문·피드)로 1.5~3초, 09-01 §9.2의 8초 예산 안이다.

1. **선점**: `UPDATE chat_sessions SET slack_mode='room' WHERE id=? AND slack_mode IS NULL RETURNING id`. 0행이면 다른 요청이 먼저 잡은 것 → 4단계.
   `SLACK_STAFF`가 비어 있으면 선점하지 않고 곧바로 5단계(스레드)로 간다 — 아무도 초대되지 않는 방은 없는 것과 같다.
2. **채널 이름** `{SLACK_ROOM_PREFIX}-{slug}-{code6}` — 순수 함수 `buildRoomName()`.
   - `slug` = `visitor_name`을 NFKD 정규화 → 결합 부호 제거 → 소문자 → `[a-z0-9]` 외 연속 문자를 `-` 하나로 → 앞뒤 `-` 제거 → 16자 절단 후 끝의 `-` 제거. 비면 `visitor_locale` 소문자(`ja`, `zh-tw`).
   - `code6` = `buildChatRefCode(session.id)`(8자, `contactChannels.ts`) 앞 6자 소문자. 전체 8자는 방 주제에 표시한다.
   - 접두어 기본 `chat`. 한글 접두어는 배포 첫날 시험한다(§9). `invalid_name_specials`면 접두어를 `chat`으로 바꿔 1회 재시도. `name_taken`이면 `-2`, `-3`을 붙여 재시도(최대 3회).
3. **생성·설정·초대** (전부 `groups:write`)
   - `conversations.create { name, is_private: true }` → 채널 ID. 봇은 자동으로 멤버다.
   - `conversations.setTopic`: `🇻🇳 Thu Nguyen · 베트남어 · #A1B2C3D4 · thu@example.com · <관리자URL|관리자 화면에서 열기>` (250자 절단, 실패 무시).
   - `conversations.invite users=<SLACK_STAFF ID 전부, 쉼표 구분>`. `already_in_channel`은 성공으로 본다. 그 외 실패 → 방을 `archive`하고 5단계(스레드 폴백)로.
   - 세션 확정: `UPDATE SET slack_channel_id = C…, slack_room_name = …`.
   - 피드 한 줄: `🔴 새 문의 · 🇻🇳 Thu Nguyen · <#C…> · 09/03(목) 14:03 KST`.
4. **선점에서 진 요청**: 0.7초 간격으로 최대 3회 세션을 재조회해 `slack_channel_id`가 채워지면 그 방에 게시한다. 끝내 비어 있으면 피드 채널에 관리자 링크가 달린 단독 메시지로 게시한다(유실 0).
5. **생성 실패** (`missing_scope`, `restricted_action`, `ratelimited` 재시도 후, timeout, `SLACK_STAFF` 미설정): `slack_mode='thread'`로 바꾸고 현행 스레드 경로를 그대로 탄다. `console.warn` 1줄.

### 4.3 방 안의 메시지와 멘션

전부 평문 mrkdwn `text`다. Block Kit은 2단계에서 카드로 승격할 때 넣는다. 멘션은 `<@U…>`, 시각은 서버가 구운 KST 문자열(`formatKst`, 예 `09/03(목) 14:03 KST`). `<!date>`는 쓰지 않는다(09-01 §4.4).

| 상황 | 첫 줄 | 본문 |
|------|-------|------|
| 손님 첫 메시지 | `🔴 새 문의 · {전원 멘션} · 📥 09/03(목) 14:03 KST` | 한국어 번역 + `> _원문:_ …` (현행 `buildBodyLines`) + 꼬리말 `_이 채널에 쓰면 손님에게 번역되어 전달됩니다. 직원끼리 메모는 스레드로 남겨 주세요._` |
| 손님 후속 메시지 | `{담당자 멘션 또는 전원 멘션} · 14:12 KST` | 본문 |
| 완료 후 손님 재발신 | `🔔 완료했던 문의에 손님이 다시 말을 걸었습니다 · {담당자 또는 전원} · 16:40 KST` | 본문 |
| 관리자 화면에서 보낸 답장 | `↩️ _관리자 화면 답장_` (현행) | 한국어 원문 + `> _vi 전달:_ …` |
| 전달 실패 알림 | `⚠️ 방금 답글이 손님에게 전달되지 않았습니다 · 사유: {한국어 사유}` | — |
| 손님이 연락처를 남김 (오프시간 캡처, `relayContactToSlack`) | `📱 방문자가 연락처를 남겼습니다 — WhatsApp: …` (현행 문구, 멘션 없음) | 방 또는 스레드 — 세션의 모드를 따른다 |
| 확대 알림 | §4.6 표 | — |

**멘션 규칙**
- **전원** = `SLACK_STAFF`(답변 직원)의 모든 ID. `SLACK_OBSERVERS`(관찰자 — 원장님 계정)는 방에 **초대만** 되고 어떤 멘션에도 들어가지 않는다.
- **담당자** = `chat_sessions.assigned_slack_user_id`. 담당자가 있으면 담당자만, 없으면 전원.
- 관리자 화면 답장과 봇의 실패 알림에는 멘션이 없다.
- 첫 메시지 꼬리말에 `_손님에게는 "잠시만 기다려 주세요" 자동 안내가 먼저 나갔습니다._` 한 줄을 더 붙인다(§4.10).

### 4.4 직원 답글 → 손님 (인바운드)

이벤트 구독은 그대로 `message.groups`다. 봇이 속한 모든 비공개 채널(방 전부 + `#해외문의`)의 메시지가 온다.

`classifySlackEvent()`(순수 함수, I/O 없음)는 **모양만** 판정한다: `url_verification`, 봇/앱 메시지 제외, subtype `undefined`·`thread_broadcast`만 허용, `channel`·`ts`·`thread_ts`·`user`·`text`를 실어 `process`로 넘긴다. 어느 채널이 어느 세션인지는 DB가 필요하므로 `relaySlackReplyToVisitor()`가 판정한다. 라우트는 지금처럼 분류 → `claimEvent` → `after()` 순서를 유지한다.

| 채널 | 메시지 위치 | 동작 |
|------|-------------|------|
| `#해외문의` (`SLACK_CHANNEL_ID`) | 스레드 답글 | 현행: `slack_thread_ts`(폴백 `chat_messages.slack_ts`)로 세션을 찾아 전달 |
| `#해외문의` | 본문 | 무시 (현행 `not_thread_reply`) |
| 방 (`slack_channel_id = channel AND slack_mode = 'room'`) | 본문 | **손님에게 전달** |
| 방 | 스레드 답글 | **내부 메모 — 전달하지 않음** (`internal_note`). 단 "채널에도 보내기"를 체크한 답글(`thread_broadcast`)은 전달 |
| 그 외 채널 | — | 무시 (`unknown_channel`) |

전달 시:
1. `chat_messages` INSERT에 `slack_user_id = event.user`, `sender_label = SLACK_STAFF의 이름(없으면 'Slack 직원')`, `source = 'slack'`. `sender_admin_id`는 계속 NULL(Supabase 사용자가 아니다).
2. **담당자 갱신**: `assigned_slack_user_id = event.user`, `assigned_label`, `assigned_at = now()`. **가장 최근에 답한 답변 직원이 담당자**다 — 버튼 없이 답만 하면 인계가 된다(원장님 D-7: 담당자 아닌 직원의 답변 허용, 누가 답했는지 기록). 2단계 카드에서 "담당 고정"을 덧붙일 수 있다.
   **관찰자(`SLACK_OBSERVERS`)의 답글은 예외다.** 손님에게 전달되고 작성자로 기록되지만 **담당자를 바꾸지 않는다** — 원장님 결정(2026-09-03): 이재호 계정은 답변자가 아니다.
3. `status = 'closed'`인 세션이면 `status = 'open', closed_at = NULL`로 되돌리고 전달한다(09-01 §6.5-B, 현행은 `session_closed`로 조용히 폐기). `resolved_at`은 손님 재발신 트리거가 다루므로 여기서는 건드리지 않는다.
4. 실패(`session_not_found`, `empty_text`, `error`) 시 같은 방(스레드 모드면 같은 스레드)에 ⚠️ 알림을 게시한다. 봇 메시지는 인바운드에서 걸러지므로 루프가 없다.

**`group_archive` / `group_unarchive` 이벤트** (구독 추가): `channel`로 방을 찾아 `resolved_at`을 세팅(`resolved_label = 'Slack에서 보관'`)/해제한다. 우리 코드가 API로 보관해도 같은 이벤트가 되돌아오지만 `WHERE resolved_at IS NULL` 조건부라 무해하다. **직원이 Slack 채널 메뉴에서 직접 보관하는 것이 곧 완료 처리**다. 방이 아닌 채널(예: `#해외문의` 자체)의 보관 이벤트는 세션 조회가 실패하므로 무시된다.

### 4.5 완료·종료·재오픈 ↔ 보관·해제

"완료 ≠ 종료"(09-01 §6.2, D-13)를 그대로 쓴다. 완료는 내부 정리이고 손님에게 아무 것도 가지 않는다.

| 동작 | DB | Slack | 손님 |
|------|-----|-------|------|
| **완료** (`resolve`) | `resolved_at = now()`, `resolved_label = '관리자 화면'` | 방 `archive` + 피드 `✅ 완료 · Thu Nguyen · 담당 이정현 · 15:02 KST` | 없음 |
| **완료 취소** (`unresolve`) | `resolved_at = NULL` | 방 `unarchive` | 없음 |
| **종료 안내** (`close`, 현행) | `status = 'closed'`, `closed_at` + 시스템 메시지 | 방 `archive` + 피드 `✅ 종료 · …` | 종료 안내 문구(현행) |
| Slack에서 직접 보관 | `group_archive` → `resolved_at` | — | 없음 |
| **손님 재발신** | 트리거가 `resolved_at = NULL`, `awaiting_since` 세팅. `closed`면 라우트가 `open`으로(현행 `messages/route.ts:52-61`) | 게시 시 `is_archived` 오류 → `unarchive` → 🔔 헤더로 게시 + 피드 `🔄 다시 열림 · Thu Nguyen · <#C…> · 16:40 KST` | 없음 |

`PATCH /api/chat/sessions/[id]` 바디: `{ action: 'resolve' | 'unresolve' | 'close' }`, **기본 `close`** (현행 `closeSession()`이 바디 없이 호출하므로 zod `.default`). 보관/해제는 `after()`에서, throw-free. 보관에 실패해도 완료 처리는 200이다 — 다음 손님 메시지가 그냥 그 방에 붙는다.

스레드 모드 세션의 완료·종료: Slack 쪽 변화 없음(스레드는 자연 소멸). 피드 한 줄만 남긴다.

### 4.6 미응답 확대 알림

원장님 규칙: 첫 문의 전원 → 이후 담당자만 → **담당자가 답을 안 하면(처음이든, 한 번 답한 뒤든) 다른 직원에게**.

- **시계**: `awaiting_since` = 답을 기다리기 시작한 시각. 트리거가 손님 메시지 INSERT 시 `COALESCE(awaiting_since, NEW.created_at)`, 직원 메시지 INSERT 시 `NULL` + `escalation_level = 0`. 관리자 화면 답장도 직원 메시지이므로 시계를 멈춘다.
- **임계**: `CHAT_ESCALATION_MINUTES=5,12,30` (09-01 D-6). 영업시간(`businessHours.ts`의 `isBusinessHours()`, 평일 10~19시·토 10~16시)에만 동작한다. 영업시간 외에는 아무 것도 하지 않는다 — 오프시간 캡처 블록이 손님을 안내한다.
- **실행**: `netlify/functions/chat-ops.mts` 예약 함수(`keepwarm.mts` 패턴 복제) `schedule: '*/3 1-10 * * 1-6'` (UTC = KST 10:00~19:59 월~토)가 `POST /api/chat/ops`를 `Authorization: Bearer ${CHAT_OPS_SECRET}`로 호출한다. 예약 함수 한도가 30초라 함수는 fetch 1발만 하고 실제 처리는 라우트가 한다. 라우트는 시크릿 미설정이면 503, 불일치면 401, 영업시간 밖이면 즉시 200.
- **대상**: `status = 'open' AND resolved_at IS NULL AND awaiting_since IS NOT NULL AND escalation_level < 3 AND slack_mode IS NOT NULL` 를 `awaiting_since` 오름차순 최대 20건. **한 실행에 세션당 한 단계만** 올린다(밤새 기다린 문의가 아침 10:00에 🚨로 바로 튀지 않고 10:00→10:03→10:06에 걸쳐 올라간다). 갱신은 `UPDATE … SET escalation_level = n+1 WHERE id = ? AND escalation_level = n` 조건부라 실행이 겹쳐도 알림이 중복되지 않는다.

| 단계 | 조건 | 담당자 있음 | 담당자 없음 |
|:----:|------|-------------|-------------|
| 1 | 대기 ≥ 5분 | 방: `⏰ <@담당> 5분째 답이 없습니다` | 방: `⏰ {전원} 5분째 답이 없습니다` |
| 2 | 대기 ≥ 12분 | 방: `⏰ {전원} 12분째 답이 없습니다 · 담당 <@담당> 님이 응답하지 않아 전원에게 알립니다` | 방: `⏰ {전원} 12분째 답이 없습니다` |
| 3 | 대기 ≥ 30분 | 방: `🚨 {전원} 30분째 미응답` + 피드 `🚨 30분째 미응답 · Thu Nguyen · <#C…>` | 같음 |

3단계 이후에는 더 보내지 않는다. 직원이 답하면 트리거가 단계를 0으로 되돌려 다음 손님 메시지부터 다시 센다. 스레드 모드 세션은 같은 문구를 스레드 답글로 보내고 2단계부터 `reply_broadcast: true`로 채널 본문에 띄운다.

같은 실행에서 `chat_slack_events`의 30일 초과 행을 지운다. 처리할 세션이 없으면 인덱스 조회 1회 후 즉시 끝난다(§5 부분 인덱스). 비용: 월 약 5,200회 = 레거시 무료 한도 125,000회의 4%(09-01 §9.1).

### 4.7 `#해외문의` 피드

네 종류 한 줄만 흐른다: `🔴 새 문의`, `✅ 완료/종료`, `🔄 다시 열림`, `🚨 30분째 미응답`. 채널 링크 `<#C…>`를 달아 클릭하면 방으로 간다. **멘션이 없으므로** 직원이 이 채널을 음소거해도 방 멘션은 온다. 실장님이 "오늘 몇 건 들어와 몇 건 끝났나"를 훑는 용도다. 스레드 모드 폴백의 스레드도 여기 붙는다(현행과 동일한 모양).

### 4.8 관리자 화면 최소 변경

관리자 화면은 보조 창구다(09-01 D-2). 새 데이터와 어긋나지 않게만 손본다. 문구는 쉬운 한국어(NFR-09).

- **시각 KST 고정**: `ChatDetailClient.tsx`의 `formatTime`에 `timeZone: 'Asia/Seoul'` — 서버(UTC)·브라우저 9시간 어긋남 버그 수정(09-01 §6.4).
- **상세 헤더**: `담당: 이정현` 또는 `담당 미정`. 상태 배지에 `완료` 추가.
- **말풍선 라벨**: 직원 말풍선 아래 `Slack · 이정현` / `관리자 화면` (`sender_label`, `source`).
- **버튼 2개**: `완료 처리`(주 버튼) — 확인 문구 "이 상담을 완료로 표시할까요? Slack에서는 이 손님의 방이 보관함으로 들어가고, 대화 기록은 이 화면에 그대로 남습니다. 손님에게는 아무 메시지도 가지 않습니다." / `상담 종료 안내 보내기`(보조, 회색) — 현행 문구 유지. 완료 상태에서는 `완료 취소`.
- **목록 탭 3개**: 진행 중(`status='open' AND resolved_at IS NULL`) / 완료(`resolved_at IS NOT NULL`) / 종료(`status='closed'`). 행에 `담당 이정현` 배지.
- **상세 Realtime**: 기존 채널에 `chat_sessions` UPDATE(`id=eq.{id}`) 리스너 추가 → 다른 직원의 담당·완료가 새로고침 없이 반영.
- `chatApi.ts`: `resolveSession(id)`, `unresolveSession(id)` 추가. `closeSession`은 그대로.
- 관리자 화면 답장은 `source='app'`, `sender_label`은 현행대로 이메일(공용 계정이라 이름을 구분할 수 없다 — 09-01 D-4).

### 4.9 실패 시 동작

| 상황 | 동작 | 유실 |
|------|------|:----:|
| `SLACK_STAFF` 미설정 | 모든 세션 스레드 모드(현행과 동일) | 없음 |
| 재설치 전 배포(`missing_scope`) | 스레드 모드 폴백 + 경고 로그 | 없음 |
| 워크스페이스가 채널 생성 제한(`restricted_action`) | 스레드 모드 폴백 | 없음 |
| `name_taken` / `invalid_name_specials` | 접미·접두 바꿔 재시도, 그래도 실패면 스레드 | 없음 |
| 초대 실패 | 방 보관 + 스레드 모드 폴백 | 없음 |
| 주제 설정 실패 | 무시 | — |
| 선점 경합에서 짐 | 재조회 3회 → 방 게시, 끝내 없으면 피드에 단독 게시 | 없음 |
| 보관된 방에 게시(`is_archived`) | `unarchive` 후 1회 재시도. 그래도 실패면 세션을 스레드 모드로 전환해 `#해외문의`에 게시 | 없음 |
| 보관/해제 실패 | 로그만. 완료 처리는 200 | — |
| 크론 실행 겹침 | 조건부 UPDATE로 1회만 알림 | — |
| Slack 429/5xx/timeout | `callSlack`이 1회 재시도(Retry-After 존중, 최대 2초 대기) | — |
| 직원 답글 전달 실패 | 같은 방에 ⚠️ 사유 게시 | 직원이 봄 |
| 자동 안내 INSERT 실패 | 로그만. 손님 메시지·Slack 릴레이는 이미 끝난 뒤라 영향 없음 | — |

### 4.10 자동 첫 안내 (원장님 요청, 2026-09-03)

손님이 메시지를 쓰고 답을 받기까지 아무 반응이 없는 공백을 메운다. **번역 API를 부르지 않고** 로케일별로 미리 쓴 문구를 낸다.

- **언제**: 손님 메시지가 **새 대기 구간을 시작할 때** 1회. 즉 `awaiting_since`가 방금 세팅됐고 `auto_ack_at`이 그보다 이전(또는 NULL)일 때. 같은 대기 구간의 두 번째·세 번째 메시지에는 다시 보내지 않는다. 직원이 답한 뒤 손님이 다시 쓰면(다음 날 재방문 포함) 새 구간이므로 다시 나간다.
- **경쟁 방지**: 세션을 읽어 `awaiting_since`·`auto_ack_at`을 본 뒤, `UPDATE … SET auto_ack_at = now() WHERE id = ? AND awaiting_since = <읽은 값> AND (auto_ack_at IS NULL 또는 = <읽은 값>)` 조건부 갱신이 1행을 돌려줄 때만 보낸다. 손님이 연달아 두 번 보내도 안내는 한 번이다.
- **문구** (`serverI18n.ts` `SystemMessageKey`에 추가, 10개 로케일 전부 타입으로 강제됨):
  - `autoAck` (영업시간 중): ko 원문 `안녕하세요! 메시지 감사합니다. 잠시만 기다려 주세요. 곧 답변을 드리겠습니다.`
  - `autoAckOffHours` (영업시간 외, `isBusinessHours()`로 판정): ko 원문 `안녕하세요! 메시지 감사합니다. 지금은 상담 시간이 아니어서 상담 시간에 순서대로 답변드리겠습니다.`
- **저장 형태**: 직원 답장과 똑같이 보이도록 `sender='operator'`, `original_text`=한국어 원문, `original_lang='ko'`, `translated_text`=손님 언어 문구, `translated_lang`=손님 로케일, `translation_status='success'`, `translation_latency_ms=0`, **`source='auto'`**, `sender_label='자동 안내'`. 이렇게 하면 손님 위젯(번역문 메인 + 원문 토글)과 관리자 화면(한국어 메인 + 번역 아래) 렌더링을 **한 줄도 고치지 않아도** 된다.
- **트리거 예외**: `source='auto'`인 operator INSERT는 `unread_admin_count`·`awaiting_since`·`escalation_level`을 **건드리지 않는다**(§5 트리거). 자동 안내가 "답변함"으로 계산되면 미응답 표시와 확대 알림이 전부 무력화되기 때문이다.
- **전달**: `after()`에서 INSERT 후 `broadcastToSession(message_created, sender:'operator')`. Slack 방에는 미러하지 않고, 첫 메시지 꼬리말 한 줄로만 알린다(§4.3).
- **실행 위치**: `POST /api/chat/messages` 손님 경로의 `after()` — Slack 릴레이와 같은 자리, 릴레이 **뒤**에 실행해 직원 알림을 늦추지 않는다.

### 4.11 "읽음"에 대하여

- Slack은 봇에게 **누가 어떤 메시지를 읽었는지 알려주지 않는다.** 원장님 계정이 방을 열어 봐도 다른 직원의 굵은 글씨(안 읽음)는 그대로이고, 우리 코드는 Slack 읽음 상태를 어디에도 쓰지 않는다.
- 관리자 화면을 **열어 보는 것은 아무 상태도 바꾸지 않는다**(현행과 동일 — `unread_admin_count`는 직원 답장으로만 0이 된다). 공용 계정이라 누가 봤는지 특정할 수도 없다.
- 따라서 이 시스템에서 상태를 바꾸는 유일한 계기는 **답변 직원(`SLACK_STAFF`)의 답글**이다: 담당자 지정, 미응답 시계 정지, 확대 알림 중단. 관찰자(`SLACK_OBSERVERS`)의 열람·답글은 담당자를 바꾸지 않는다(§4.4).

### 4.12 번역 말투 — 직원 답장은 더 친근하게 (원장님 요청, 2026-09-03)

직원이 한국어로 쓴 답장이 손님 언어로 나갈 때 딱딱한 "의료기관 공식 문체" 대신 **따뜻하고 친근한 안내 데스크 말투**로 번역되게 한다. `translation.ts`의 `buildSystemPrompt(from, to)` 중 **한국어 → 손님 언어 방향의 규칙 3**만 바꾼다.

- 현행: `Maintain a polite, professional tone suitable for a medical clinic.`
- 변경: `Tone: warm, friendly and welcoming, like a caring front-desk consultant speaking to a guest. Stay polite and respectful in the natural courteous register of {언어}. Convey warmth through word choice and natural phrasing only. Do not add greetings, emojis, or any sentence that is not in the source, and keep every fact, number, and price exactly as written.`
- 손님 → 한국어 방향(직원이 읽는 쪽)은 그대로 둔다(~합니다체).
- `buildSystemPrompt`를 export해 Vitest로 고정한다: ko→en 프롬프트에 `warm, friendly` 포함, en→ko 프롬프트에는 미포함.
- 배포 후 실장님이 영어·일본어·중국어 답장 각 3건을 보고 "너무 가볍다/딱딱하다"를 판정하면 문구를 조정한다. 이 파일은 현재 모델 교체 작업으로 미커밋 변경이 있으므로, 그 작업이 커밋된 뒤에 얹는다.

---

## 5. 데이터 모델 — 마이그레이션 040 (전부 추가형·멱등)

09-01 계획서 §7의 040 초안 중 **카드·완료 채널 전용 컬럼**(`slack_render_state`, `slack_done_ts`, `slack_root_hash` 등)과 2단계 테이블(`chat_quick_replies`, `chat_translation_cache`)은 넣지 않는다. 담당·완료·확대 알림 컬럼은 이름을 그대로 쓴다.

```sql
-- 040: Slack 환자별 채널(방) + 담당 + 완료 + 미응답 확대 알림
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS slack_mode             TEXT NULL
    CHECK (slack_mode IS NULL OR slack_mode IN ('room', 'thread')),
  ADD COLUMN IF NOT EXISTS slack_room_name        TEXT NULL,
  ADD COLUMN IF NOT EXISTS assigned_slack_user_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS assigned_label         TEXT NULL,
  ADD COLUMN IF NOT EXISTS assigned_at            TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS resolved_at            TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS resolved_label         TEXT NULL,
  ADD COLUMN IF NOT EXISTS awaiting_since         TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS escalation_level       SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_ack_at            TIMESTAMPTZ NULL;

-- 기존 세션: 스레드가 있으면 thread 모드로 고정 (새 방을 만들지 않는다)
UPDATE public.chat_sessions SET slack_mode = 'thread'
 WHERE slack_mode IS NULL AND slack_thread_ts IS NOT NULL;
-- awaiting_since는 백필하지 않는다 — 오래 방치된 세션이 배포 직후 한꺼번에 🚨를 울리는 것을 막는다.

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS slack_user_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS sender_label  TEXT NULL,
  ADD COLUMN IF NOT EXISTS source        TEXT NOT NULL DEFAULT 'app'
    CHECK (source IN ('app', 'slack', 'auto'));   -- auto = 자동 첫 안내 (§4.10)

-- 방 → 세션 역조회 (인바운드 주 경로)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_slack_room
  ON public.chat_sessions (slack_channel_id)
  WHERE slack_mode = 'room';

-- 확대 알림 대상 (크론이 이 인덱스 1회 조회로 끝난다)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_escalation
  ON public.chat_sessions (awaiting_since)
  WHERE status = 'open' AND resolved_at IS NULL AND awaiting_since IS NOT NULL AND escalation_level < 3;

-- 관리자 목록 탭 (진행 중 / 완료)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_open_resolved
  ON public.chat_sessions (resolved_at, last_message_at DESC)
  WHERE status = 'open';

-- 메시지 INSERT 트리거 확장 (028의 함수를 교체. UPDATE 횟수는 그대로 1회 — 030 REPLICA IDENTITY FULL 비용 불변)
CREATE OR REPLACE FUNCTION public.fn_chat_after_message_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_sessions
  SET
    last_message_at = NEW.created_at,
    updated_at      = NEW.created_at,
    -- 자동 첫 안내(source='auto')는 "답변"이 아니다 — 미응답 카운트·대기 시계를 건드리지 않는다 (§4.10)
    unread_admin_count = CASE
      WHEN NEW.sender = 'visitor'  THEN unread_admin_count + 1
      WHEN NEW.sender = 'operator' AND NEW.source <> 'auto' THEN 0
      ELSE unread_admin_count END,
    -- 손님 메시지: 답 대기 시작(이미 기다리는 중이면 유지). 직원 메시지: 시계 정지 + 단계 초기화
    awaiting_since = CASE
      WHEN NEW.sender = 'visitor'  THEN COALESCE(awaiting_since, NEW.created_at)
      WHEN NEW.sender = 'operator' AND NEW.source <> 'auto' THEN NULL
      ELSE awaiting_since END,
    escalation_level = CASE
      WHEN NEW.sender = 'operator' AND NEW.source <> 'auto' THEN 0
      ELSE escalation_level END,
    -- 손님 재발신: 완료 자동 해제 (앱 코드가 잊어도 정합성 유지)
    resolved_at    = CASE WHEN NEW.sender = 'visitor' THEN NULL ELSE resolved_at END,
    resolved_label = CASE WHEN NEW.sender = 'visitor' THEN NULL ELSE resolved_label END
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN public.chat_sessions.slack_mode IS
  'room = 세션 전용 비공개 채널(slack_channel_id). thread = #해외문의 스레드(slack_thread_ts). NULL = 아직 Slack에 안 올라감';
COMMENT ON COLUMN public.chat_sessions.awaiting_since IS
  '직원 답을 기다리기 시작한 시각. 직원 메시지 INSERT 시 NULL. 미응답 확대 알림의 기준';
COMMENT ON COLUMN public.chat_sessions.assigned_slack_user_id IS
  '담당 직원 Slack user id. 가장 최근에 Slack에서 답한 답변 직원(관찰자 제외). users:read 없이 <@U…> 멘션으로 표시';
COMMENT ON COLUMN public.chat_sessions.auto_ack_at IS
  '자동 첫 안내를 마지막으로 보낸 시각. awaiting_since보다 이전이면 새 대기 구간 → 다시 보낸다';
```

적용 후 `npx supabase gen types typescript`로 `src/types/supabase.ts`를 재생성한다. 기존 컬럼·정책·publication은 건드리지 않는다.

---

## 6. Slack 앱·환경변수 변경

| 항목 | 현재 | 변경 | 재설치 |
|------|------|------|:------:|
| Bot Token Scopes | `chat:write`, `groups:history` | **+ `groups:write`** (채널 생성·초대·주제·보관·해제), **+ `groups:read`** (`group_archive` 이벤트 구독 요건 — Slack 이벤트 목록 기준, 재설치 때 함께 넣는다) | **1회** |
| Event Subscriptions (bot events) | `message.groups` | **+ `group_archive`, `group_unarchive`** | 위와 함께 |
| Interactivity | 꺼짐 | 그대로 (2단계) | — |
| 워크스페이스 설정 | — | 설정 및 관리 → 권한 → 채널 관리: **비공개 채널 생성 권한이 "모든 멤버"인지 확인** (아니면 봇이 `restricted_action`) | — |
| 재설치 후 | — | 봇 토큰이 바뀌었으면 Netlify `SLACK_BOT_TOKEN` 갱신 | — |

`chat.postMessage`의 mrkdwn `text`에 `<@U…>`와 `<#C…>`를 넣으면 Slack이 렌더 시점에 이름·채널명을 그려준다 — `users:read`가 필요 없다.

**환경변수** (Netlify + `.env.example`에 문서화)

```
SLACK_STAFF=U0BMYAJKMJQ:이정현,U0BMYAMNASG:정소월,U0BMUKXLL3C:방애금
                                  # 방 초대 + 멘션 대상. "ID:이름" 쉼표 구분, 이름 생략 가능.
                                  # 비우면 방을 만들지 않고 현행 스레드 방식으로 동작(안전 스위치).
SLACK_OBSERVERS=U0XXXXXXXXX:이재호  # 지켜보기만 하는 계정(원장님). 방에 초대되지만 멘션·담당 대상이 아니다.
                                  # 형식은 SLACK_STAFF와 같다. 비워도 된다.
SLACK_ROOM_PREFIX=chat            # 채널 이름 접두어. 한글 가능 여부는 배포 첫날 시험
SLACK_CHANNEL_ID=(기존 값)         # #해외문의 = 피드 + 스레드 폴백
CHAT_OPS_SECRET=(무작위 32자+)     # 예약 함수 → /api/chat/ops 공유 시크릿. 비우면 라우트 503
CHAT_ESCALATION_MINUTES=5,12,30   # 확대 알림 임계(분). 코드 배포 없이 조정
SLACK_POST_TIMEOUT_MS=5000        # 모듈 상단 const → 호출 시점 평가로 변경
```

09-01 계획서의 `SLACK_ESCALATION_MENTIONS`는 `SLACK_STAFF`로 이름을 바꾼다(초대 명단을 겸하고 이름을 실을 수 있다).

⚠️ Netlify는 **환경변수를 바꾼 뒤 새로 배포해야 반영한다**(공식 문서: "Environment variable changes require a build and deploy to take effect"). 레거시 무료 플랜이라 배포 비용은 0이다 — 값을 바꿨으면 Deploys → Trigger deploy를 한 번 누른다.

---

## 7. 모듈 구조 — 파일별 책임

| 파일 | 책임 | I/O |
|------|------|:---:|
| `lib/chat/slack.ts` | `callSlack()` 공통 호출기(타임아웃·1회 재시도·Retry-After), `postSlackMessage`(+`replyBroadcast`), `createPrivateChannel`, `inviteToChannel`, `setChannelTopic`, `archiveChannel`, `unarchiveChannel`, 서명 검증(현행) | fetch |
| `lib/chat/slackStaff.ts` **신규** | `parseStaffDirectory(staffEnv, observerEnv)` → `{ responderIds, inviteIds, isResponder(id), labelOf(id), mentionAll() }`. `mentionAll`은 답변 직원만 | 없음 |
| `lib/chat/slackText.ts` **신규** | 방·스레드·피드·확대 알림 문구 빌더. 현행 `buildRootText`/`buildReplyText`/`buildContactText`/`buildBodyLines` 이전. `LOCALE_FLAG` + 한국어 언어명 맵 | 없음 |
| `lib/chat/slackRooms.ts` **신규** | `slugifyName()`·`buildRoomName()`(순수), `ensureRoom(session, deps)` — DB·Slack 접근은 `RoomDeps` 포트로 주입해 가짜로 테스트 | Slack(주입) |
| `lib/chat/kst.ts` **신규** | `formatKst(iso)` → `09/03(목) 14:03 KST`, `formatKstTime(iso)` → `14:03 KST`. UTC+9 고정 산술(서머타임 없음, `businessHours.ts`와 동일 방식) | 없음 |
| `lib/chat/escalation.ts` **신규** | `parseThresholds(env)`, `planEscalation({ awaitingSinceMs, level, hasAssignee }, nowMs, thresholds)` → `{ nextLevel, target: 'assignee' \| 'all', feed, minutes } \| null` | 없음 |
| `lib/chat/escalationRunner.ts` **신규** | `runEscalations(now)` — 대상 조회 → 단계 선점 → 방/스레드 게시 → 피드 | DB+Slack |
| `lib/chat/autoAck.ts` **신규** | `shouldSendAutoAck({ awaitingSince, autoAckAt })`(순수) + `sendAutoAckIfDue(sessionId)` — 조건부 선점 후 `source='auto'` 메시지 INSERT + broadcast | DB |
| `lib/chat/serverI18n.ts` | `SystemMessageKey`에 `autoAck`·`autoAckOffHours` 추가(10개 로케일) + `getAutoAckTexts(locale, offHours)` → `{ ko, localized }` | 없음 |
| `lib/chat/slackRelay.ts` | 모드 해석(`resolveTarget`), 아웃바운드 조립, 인바운드 세션 판정·INSERT·담당 갱신(관찰자 제외)·실패 알림, 완료/재오픈 시 보관·해제 | DB+Slack |
| `lib/chat/slackEvents.ts` | 분류기 확장: `user`·`channel`·`isTopLevel`·`isBroadcast` 전달, `group_archive`/`group_unarchive` → `room_archived`/`room_unarchived`. 순수 `routeInbound(decision, legacyChannelId)` → 스레드/방/무시 | 없음 |
| `app/api/slack/events/route.ts` | 새 액션 2종을 `after()`로 위임. 실패 시 ⚠️ 알림. 그 외 불변 | — |
| `app/api/chat/ops/route.ts` **신규** | 시크릿 검증 → `chat_slack_events` 정리 → 영업시간 가드 → `runEscalations` | DB+Slack |
| `netlify/functions/chat-ops.mts` **신규** | 3분 예약, fetch 1발 | fetch |
| `app/api/chat/sessions/[id]/route.ts` | `action` 분기(resolve/unresolve/close) + `after()` 보관/해제 + 피드 | DB+Slack |
| `lib/chat/chatApi.ts` | `resolveSession`, `unresolveSession` | fetch |
| `admin/(authenticated)/chat/page.tsx`, `[sessionId]/page.tsx`, `ChatDetailClient.tsx` | §4.8 | — |

원칙: 문구·이름·판정은 전부 **I/O 없는 순수 모듈**에 두고 Vitest로 고정한다. Slack 표시가 틀리면 원인은 세션 행이거나 순수 함수 하나뿐이다. Slack 경로는 전부 throw-free(현행 전역 제약).

---

## 8. 테스트 계획 (Vitest, 구현 전 작성)

| 파일 | 케이스 |
|------|--------|
| `slackRooms.test.ts` | `buildRoomName`: 라틴 이름 → `chat-thu-nguyen-a1b2c3` · 악센트 제거(`Nguyễn`→`nguyen`) · 공백/기호 → `-` 압축 · CJK/태국어 이름 → `chat-ja-…` 로케일 폴백 · 16자 절단 후 끝 `-` 제거 · 접두어 교체 |
| `slackStaff.test.ts` | `U1:이정현,U2,U3:방애금` 파싱 · 잘못된 ID 무시 · 빈 값 → `responderIds=[]` · `labelOf` 미등록 → `'Slack 직원'` · `mentionAll`은 답변 직원만 · 관찰자는 `inviteIds`에만 포함되고 `isResponder`가 false |
| `autoAck.test.ts` | `awaiting_since` NULL → 안 보냄 · `auto_ack_at` NULL → 보냄 · `auto_ack_at < awaiting_since` → 보냄 · `auto_ack_at >= awaiting_since` → 안 보냄 · `getAutoAckTexts` 10개 로케일 모두 비어 있지 않고 ko 원문이 다름(영업시간 중/외) |
| `slackText.test.ts` | 첫 메시지(전원 멘션+📥 KST+꼬리말) · 후속(담당자만) · 후속(담당 없음→전원) · 재오픈 🔔 · 관리자 답장 멘션 없음 · 피드 4종 · 확대 알림 3단계×담당 유무 · 실패 알림 사유 한국어 |
| `slackEvents.test.ts` | 기존 케이스 유지 + 방 본문 → `process(isTopLevel=true, user)` · 방 스레드 답글 → `process(isTopLevel=false)` · `thread_broadcast` → 전달 · `group_archive`/`group_unarchive` 분류 · 봇/앱 메시지 여전히 무시 |
| `slackRelay.test.ts` | `resolveTarget`: room/thread/NULL 분기. 인바운드 라우팅(방 본문 전달·스레드 메모 무시·"채널에도 보내기"·피드 채널 스레드)은 순수 함수 `routeInbound`로 분리해 `slackEvents.test.ts`에서 고정한다. DB를 타는 경로(작성자 기록·담당 갱신·`closed` 재오픈·`unknown_channel`)는 이 리포에 Supabase mock 관례가 없으므로 롤아웃 확인표(§9)로 검증한다 |
| `escalation.test.ts` | 임계 미달 → null · 5분/담당 있음 → `assignee` · 5분/담당 없음 → `all` · 12분/담당 있음 → `all` · 30분 → `all + feed` · 레벨 3 → null · 한 번에 한 단계만 |
| `kst.test.ts` | UTC 입력 → `09/03(목) 14:03 KST` · 자정 넘김 · 요일 한글 |
| `slack.test.ts` | 기존 유지 + `callSlack` 재시도(429 Retry-After 존중, `invalid_auth`는 즉시 포기) · `createPrivateChannel` `name_taken` → `-2` · `invalid_name_specials` → 접두 폴백 |
| `translation.test.ts` | 기존 유지 + `buildSystemPrompt('ko','en')`에 `warm, friendly` 포함 · `buildSystemPrompt('en','ko')`에는 미포함 · 브랜드 보존 규칙은 양방향 유지 |
| `businessHours.test.ts` | 변경 없음(재사용 확인) |

DB 검증(로컬 Supabase, 실제 INSERT): 손님 INSERT → `awaiting_since` 세팅·`resolved_at` NULL / 직원 INSERT → `awaiting_since` NULL·`escalation_level` 0 / 두 번째 손님 INSERT → `awaiting_since` 유지. 이 PC는 TLS 프록시 뒤라 DB 접근에 우회 env가 필요하다(메모리 참조).

---

## 9. 롤아웃과 배포 첫날 확인

**순서** (되돌리기 쉬운 것부터)

1. Slack 앱: 스코프 2개 추가, bot events 2개 추가, 재설치. 토큰이 바뀌었으면 Netlify `SLACK_BOT_TOKEN` 갱신. 워크스페이스 채널 생성 권한 확인. (**코드 배포 전에 해도 안전** — 현행 코드는 새 권한을 쓰지 않는다)
2. 프로덕션 Supabase에 040 적용 → 타입 재생성.
3. Netlify 환경변수: `CHAT_OPS_SECRET`, `CHAT_ESCALATION_MINUTES`, `SLACK_ROOM_PREFIX`. **`SLACK_STAFF`는 아직 비워 둔다.**
4. 코드 배포. `SLACK_STAFF`가 비어 있으므로 **동작은 현행과 동일**(스레드). 스모크: 사이트에서 문의 1건 → `#해외문의` 스레드 정상, Slack 답글 전달 정상, 관리자 화면 KST·담당 표시 정상.
5. `SLACK_STAFF`(+ `SLACK_OBSERVERS`에 원장님 ID) 설정 → **재배포** (Netlify는 환경변수 변경을 다음 배포부터 반영한다) → 사이트에서 새 세션으로 문의 → 아래 확인표.
6. 기존 스레드 세션은 자연 소멸. 2주 뒤 `slack-health-check.mjs`로 첫 답변 중앙값 재측정(G-7) → 2단계(카드·버튼·자주 쓰는 답변) 착수 판단.

**배포 첫날 실제 워크스페이스에서 확인할 것** (자동 검증 불가)

- [ ] `SLACK_ROOM_PREFIX=문의`로 한글 접두어가 되는지. 안 되면 `chat` 유지(코드는 자동 폴백)
- [ ] 완료 → 손님 재발신 시 봇의 `unarchive`가 동작하는지. 안 되면 스레드 모드 전환 로그 확인
- [ ] 직원 휴대폰에 첫 문의 멘션 푸시가 오는지 (3명)
- [ ] 방 스레드에 쓴 메모가 손님에게 가지 **않는지**

**확인표**

- [ ] 새 세션 첫 메시지 → 비공개 채널 생성, 직원 초대, 전원 멘션, 주제 설정, 피드 1줄 — 5초 내
- [ ] 방 본문 답글 → 손님 화면 도착. `chat_messages.slack_user_id`·`sender_label`·`source='slack'` 기록. `assigned_*` 세팅
- [ ] 방 스레드 답글 → 손님에게 안 감. "채널에도 보내기" 체크 시 감
- [ ] 손님 후속 메시지 → 담당자만 멘션
- [ ] 다른 직원이 답하면 담당자가 그 직원으로 바뀜
- [ ] 관찰자(원장님) 계정이 방을 열어 보거나 답글을 달아도 담당자·멘션이 바뀌지 않음. 관찰자는 어떤 멘션에도 들어가지 않음
- [ ] 손님 첫 메시지 직후 손님 언어로 자동 안내가 뜨고, 관리자 화면에는 `자동 안내` 라벨의 한국어 말풍선으로 보임. 미응답 배지는 그대로 남음
- [ ] 같은 대기 구간의 두 번째 메시지에는 자동 안내가 다시 나가지 않음. 직원 답변 후 손님이 다시 쓰면 다시 나감
- [ ] 영업시간 외 첫 메시지 → "상담 시간에 순서대로" 문구
- [ ] 관리자 화면 `완료 처리` → 방 보관, 피드 ✅, 손님 무통보, 목록 '완료' 탭으로 이동
- [ ] Slack에서 직접 보관 → 관리자 화면 '완료' 탭
- [ ] 완료 후 손님 재발신 → 방 보관 해제 + 🔔 + 멘션 + 피드 🔄, 목록 '진행 중' 복귀
- [ ] 영업시간 내 5분 무응답 → 담당자(또는 전원) 멘션. 12분 → 전원. 30분 → 🚨 + 피드. 답하면 중단. 예약 함수는 Netlify 대시보드 'Run now'로 강제 실행 가능
- [ ] 영업시간 외 무응답 → 알림 없음
- [ ] `SLACK_STAFF` 비움 → 현행 스레드 방식 그대로 (회귀 0)
- [ ] 재설치 전 토큰 → 스레드 폴백 + 경고 로그
- [ ] 기존 진행 중 스레드 세션 → 답글 전달·완료 정상
- [ ] 서명 불일치 401, 중복 event_id 1회 처리 (현행 유지)
- [ ] `npm run lint` 0 errors, `npm run test` 통과, `npm run build` exit 0, `verify:i18n` 통과(신규 키 0)

---

## 10. 09-01 계획서와의 관계

| 09-01 항목 | 처리 |
|-----------|------|
| §6.1 답변 속도(낙관적 렌더, 비동기 번역, 모델 교체 ⏰ 2026-10-23) | **유지, 별건.** 이 설계와 독립 |
| §6.2 완료 = `#상담-완료` 이관 + 1줄 축약 | **삭제.** 채널 보관으로 대체. `#상담-완료` 채널을 만들지 않는다 |
| §6.3-A 상태 카드(Block Kit) | 2단계 — 방의 첫 메시지(고정 메시지)로 승격 |
| §6.3-B 버튼 + `/api/slack/interactive` | 2단계 |
| §6.3-C 담당자 | **1단계 포함**(마지막 답변자 규칙, 버튼 없음) |
| §6.3-D 관리자 화면 담당 표시 | **1단계 포함** |
| §6.4 KST | **1단계 포함** |
| §6.5-A 전달 실패 표시 | **1단계 포함** |
| §6.5-B 종료 세션 답글 재오픈 | **1단계 포함** |
| §6.5-C `after()` 유실 방지 2단계 기록 | 2단계 |
| §6.5-D 자주 쓰는 답변 | 2단계 |
| §6.5-E 미응답 리마인드 | **1단계 포함** — 방 안 멘션 확대로 재정의(담당자 → 전원) |
| §7 마이그레이션 040 | 이 문서 §5로 대체(카드·완료 채널·2단계 테이블 제외) |
| §8 Slack 설정 | 스코프 2개·이벤트 2개 추가로 변경. Interactivity는 2단계 |
| §13 결정 D-1(완료 채널) | 원장님 2026-09-03 결정으로 **A안(보관)이 대체** |

---

## 11. 리스크와 대응

| 리스크 | 대응 |
|--------|------|
| 채널 이름에 한글 불가 | 코드가 `chat`으로 자동 폴백. 주제에는 한글·이모지 가능 |
| 봇이 비공개 채널을 `unarchive`하지 못함 | 첫날 확인. 실패 시 스레드 모드로 전환해 `#해외문의`에 게시(유실 0) |
| 워크스페이스가 봇의 채널 생성을 제한 | `restricted_action` → 스레드 폴백. 설정 1회 확인(§6) |
| 방이 많아져 사이드바가 복잡 | 완료=보관으로 열린 방만 남는다. 월 25건 규모 |
| 알림 과다 | 담당자만 멘션, 확대는 3단계로 끝. 임계는 환경변수. 피드에는 멘션 없음 |
| 직원이 실수로 방 본문에 내부 얘기를 씀 → 손님에게 감 | 첫 메시지 꼬리말 안내 + "스레드 = 메모" 관습. 2단계 카드에 상시 안내 |
| 담당자 = 마지막 답변자라 잠깐 끼어들면 담당이 바뀜 | 3~4명 팀에서는 "지금 응대 중인 사람"이 담당인 것이 의도. 2단계 버튼으로 고정 가능 |
| Slack 무료 90일 히스토리 | 기록은 Supabase. 방 주제에 관리자 링크. Slack을 읽지 않는다 |
| Netlify 함수 호출 한도 | 크론 월 5,200회(4%) + keep-warm 14%. 주기를 더 조이지 않는다 |
| 재설치로 토큰 변경 | 롤아웃 1단계 체크리스트 |
| `after()` 안에서 Slack 5회 호출 | 1.5~3초, 8초 예산 내. 실패해도 채팅은 이미 201 |
| 두 직원이 거의 동시에 답함 | 둘 다 전달된다(D-7). 담당은 나중 것. 알림은 트리거가 멈춤 |
