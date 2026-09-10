# Slack 직원 명단 자동화 + 피드 스레드 답장 전달 — 설계 (slack-staff-from-channel)

> 작성: 2026-09-10 · 대상: `liv-clinic/src/lib/chat/slackStaff.ts`, `slackRelay.ts`, `slackRooms.ts`, `escalationRunner.ts`, `slack.ts`, `src/app/api/slack/events/route.ts`
> 배경: 2026-09-10 첫 실전 미전달 사고. `SLACK_STAFF`에 없던 신규 직원(유다영)이 방에 초대되지 않아 `#해외문의` 피드 줄 스레드에 답했고, 그 답장은 `session_not_found`로 버려졌다.
> 결정(2026-09-10, 원장님): ① 직원 명단은 **`#해외문의` 채널 멤버로 자동 산출** ② 이름은 **Slack 프로필에서 자동**(`users:read` 추가, 재설치 1회) ③ 피드 줄 스레드 답장은 **손님에게 전달하고 방에도 복사**.
> 선행 스펙: `2026-09-03-slack-patient-rooms-design.md`(방 모드). 이 문서는 그 §6(직원 명단)과 인바운드 라우팅 일부를 대체한다.

---

## 0. 한눈에 보기

| 지금 | 바뀐 뒤 |
|------|---------|
| 답변 직원은 Netlify 환경변수 `SLACK_STAFF`에 ID와 이름을 손으로 적는다 | **`#해외문의`에 있는 사람이 곧 답변 직원.** 새 직원은 채널에 추가만, 퇴사자는 채널에서 내보내기만 |
| 명단에 없는 직원은 손님 방을 볼 수 없고, 피드 줄 스레드에 답하면 버려진다 | 전원이 방에 초대된다. 그래도 피드 줄 스레드에 답하면 **손님에게 전달되고 방에 복사**된다 |
| 이름은 환경변수에 적은 것만 | Slack 프로필 표시 이름을 그대로 쓴다 |
| 퇴사자 ID가 남으면 초대 실패 → 방 전체가 스레드 방식으로 추락 | 채널 멤버만 초대하므로 그럴 일이 없다 |

관찰자(원장님, `SLACK_OBSERVERS`)는 그대로: 방에 초대만 되고 멘션·담당 대상이 아니다.

---

## 1. 직원 명단(StaffDirectory) 산출

### 1.1 입력

| 출처 | 용도 | 권한 |
|------|------|------|
| `conversations.members` (channel = `SLACK_CHANNEL_ID`, `#해외문의`) | 후보 ID 전부. `limit: 200`, `response_metadata.next_cursor`가 있으면 이어서 조회 | `groups:read` (있음) |
| `auth.test` | 우리 봇의 `user_id` → 후보에서 제외 | 없음 |
| `users.info` (후보마다) | `is_bot`·`deleted`·`id === 'USLACKBOT'` 제외, 이름 = `profile.display_name` ‖ `real_name` ‖ `name` | `users:read` (**추가 필요**) |
| `SLACK_OBSERVERS` (환경변수, 기존 형식) | 관찰자. 후보에 있든 없든 **초대 대상**, 답변 직원 아님 | — |
| `SLACK_ROOMS` (환경변수, 신설) | `off`면 명단을 빈 것으로 본다 = 긴급 정지 | — |

`SLACK_STAFF`는 **더 이상 읽지 않는다.** 값이 설정돼 있으면 함수 인스턴스당 한 번 `[slack staff] SLACK_STAFF is ignored; members of #해외문의 are used` 경고를 남긴다.

### 1.2 규칙 (순수 함수 `buildStaffDirectory`)

```
responders = members − {botUserId} − {bots, deleted, USLACKBOT} − observers
inviteIds  = responders ∪ observers          (입력 순서 유지, 중복 제거)
labelOf(id) = names[id] ‖ observerLabel[id] ‖ 'Slack 직원'
isResponder(id) = id ∈ responders
mentionAll() = responders.map(<@id>).join(' ')
```

`StaffDirectory` 인터페이스(`responderIds`, `inviteIds`, `isResponder`, `labelOf`, `mentionAll`)는 유지한다. 호출부는 `getStaffDirectory()`(동기) 대신 `await loadStaffDirectory()`(비동기)를 쓴다.

### 1.3 `users:read`가 아직 없을 때

`users.info`가 `missing_scope`로 실패하면 **그 사용자는 후보에 남기고** 이름은 `'Slack 직원'`. 봇 제외는 `auth.test`(자기 자신)만으로 이뤄진다. 지금 `#해외문의`의 봇 멤버는 우리 봇뿐이므로 재설치 전에 배포해도 초대·멘션 대상이 틀리지 않는다. 그 외 `users.info` 오류(네트워크 등)도 같은 처리.

### 1.4 캐시와 실패

- 모듈 수준 캐시 1개: `{ directory, fetchedAt }`, **TTL 60초**. 같은 함수 인스턴스 안에서 크론 1회(최대 20세션)·연속 메시지가 API를 1번만 부른다.
- `auth.test` 결과(봇 ID)는 인스턴스 수명 동안 캐시.
- `users.info` 결과는 ID별 **10분** 캐시(멤버 목록보다 느리게 변한다).
- `conversations.members` 실패: 캐시가 살아 있으면(TTL 지났어도) **마지막 성공 결과**를 쓰고 경고 1줄. 캐시가 없으면 **빈 명단**을 반환한다. 빈 명단은 기존 안전 경로와 같다 — 새 방을 만들지 않고 스레드 방식, 확대 알림은 그 틱을 건너뜀, 방 멘션은 비움.
- `SLACK_ROOMS=off`면 API를 부르지 않고 빈 명단.

### 1.5 답장 작성자 라벨 (온디맨드)

Slack 답장(`relaySlackReplyToVisitor`)의 `sender_label`은 `directory.labelOf(userId)`로 먼저 찾고, 없으면(방에는 있지만 `#해외문의`에 없는 사람 등) `users.info` 1회를 시도해 같은 캐시에 넣는다. 그래도 없으면 `'Slack 직원'`. 헬퍼 `resolveStaffLabel(userId)`.

### 1.6 호출부 변경

| 파일 | 변경 |
|------|------|
| `slackRelay.ts` | `getStaffDirectory()` 3곳 → `await loadStaffDirectory()`. `hasResponders()`도 비동기. `makeRoomDeps`는 인터페이스 그대로(`staffIds`, `hasResponders`) |
| `escalationRunner.ts` | 실행 초입에 `await loadStaffDirectory()` 1회 |
| `slackStaff.ts` | `parseStaffDirectory(staff, observers)`는 테스트 호환용으로 남기되 내부적으로 `buildStaffDirectory`를 호출. 새 export: `buildStaffDirectory`, `loadStaffDirectory`, `resolveStaffLabel`, `_internals.resetCache()` |
| `slack.ts` | `listChannelMembers(channelId)`(커서 순회), `getBotUserId()`, `getUserInfo(id)`, `fetchThreadParent(channelId, ts)`(§2) 추가. 전부 `callSlack` 경유, throw-free |

---

## 2. 피드 줄 스레드 답장 → 손님 전달 + 방 복사

### 2.1 라우팅

`routeInbound`는 그대로다(`#해외문의` 스레드 답글 = `legacy_thread`). `relaySlackReplyToVisitor`의 세션 조회 순서만 한 단계 늘린다:

1. `chat_sessions.slack_thread_ts = threadTs` (스레드 모드 대표 스레드)
2. `chat_messages.slack_ts = threadTs` (경합에서 진 루트, 피드 단독 게시)
3. **신설** — 채널이 `#해외문의`일 때: `conversations.replies(channel, ts: threadTs, limit: 1)`로 부모 메시지 1건을 읽고, 본문에서 첫 `<#C…>`(또는 `<#C…|이름>`)를 추출해 `findSessionByRoom(channelId)`. 부모가 우리 봇 메시지가 아니거나 링크가 없으면 `session_not_found`.

피드 줄은 새 문의·다시 열림·미응답 확대 전부 `<#채널>`을 담고 있으므로(`buildFeedLine`) 세 종류 모두 통한다. 스키마 변경 없음.

### 2.2 전달과 복사

세션을 찾은 뒤는 방 본문 답장과 **동일 경로**: 상태 open 복구 → 번역 → `chat_messages` INSERT(`source='slack'`, `slack_ts`, `slack_user_id`, `sender_label`) → 답변 직원이면 담당자 지정 → 브로드캐스트.

그다음 방(`session.slack_channel_id`)에 복사한다:

```
↩️ 피드에서 답함 · 이정현
안녕하세요~ 리브성형외과입니다. …
```

- `buildFeedReplyMirrorText({ senderLabel, text })` (slackText.ts, 순수).
- 복사 실패(`is_archived`, `channel_not_found` 등)는 `[slack relay] feed reply mirror failed:` 경고만. 손님은 이미 받았다.
- 봇이 쓴 복사본은 `bot_id`로 이벤트 단계에서 걸러지므로 되돌아 전달되지 않는다.
- 세션이 방 모드가 아니면(스레드 모드 세션의 피드 줄은 없음) 복사를 건너뛴다.

### 2.3 실패 안내문

`session_not_found` 안내문을 다음으로 바꾼다: `⚠️ 방금 답글이 손님에게 전달되지 않았습니다 · 이 스레드는 상담과 연결돼 있지 않습니다. 사이드바의 chat-… 방 본문에 답해 주세요.` (`buildDeliveryFailureText`).

---

## 3. 환경변수

| 변수 | 상태 |
|------|------|
| `SLACK_STAFF` | **폐기.** 코드에서 읽지 않음. 배포 검증 후 Netlify에서 삭제. `.env.example`·설정 안내 문서에서 제거 |
| `SLACK_OBSERVERS` | 유지 |
| `SLACK_ROOMS` | 신설, 선택. `off`일 때만 의미 있음(방 생성·멘션·확대 알림 중지 = 스레드 방식) |
| `SLACK_CHANNEL_ID` | 유지. 이제 "피드 채널"이자 "직원 명단의 원천" |

---

## 4. 테스트

| 파일 | 내용 |
|------|------|
| `slackStaff.test.ts` | `buildStaffDirectory`: 봇 자신·is_bot·deleted·USLACKBOT 제외, 관찰자는 초대만, 이름 폴백, 순서·중복. `loadStaffDirectory`: fetch 스파이로 members→auth.test→users.info 호출 순서, 커서 순회, 60초 캐시(가짜 시계), members 실패 시 마지막 성공값/빈 명단, `missing_scope` 시 후보 유지, `SLACK_ROOMS=off`, `SLACK_STAFF` 설정 시 경고 1회 |
| `slack.test.ts` | `listChannelMembers` 커서, `getBotUserId` 캐시, `getUserInfo`, `fetchThreadParent` |
| `slackRelay.test.ts` | 피드 스레드 답장: 부모에서 `<#C…>` 추출 → 방 세션 → INSERT·담당·복사 게시; 링크 없음 → `session_not_found`; 복사 실패는 delivered 유지. 기존 방 본문·스레드 모드 케이스는 `loadStaffDirectory` 모킹으로 통과 유지 |
| `slackText.test.ts` | `buildFeedReplyMirrorText`, 바뀐 실패 안내문 |
| `slackEvents.test.ts` | 변경 없음(라우팅 불변 확인) |

---

## 5. 롤아웃 (Task 마지막)

1. **원장님**: api.slack.com → LIV Chat Alert → OAuth & Permissions → Bot Token Scopes에 `users:read` 추가 → 워크스페이스에 재설치. 배포 전후 무관(전이면 이름이 곧바로 나오고, 후면 그때부터 나온다). 토큰 값은 바뀌지 않는다.
2. master 머지·푸시(=Netlify 배포).
3. 스모크: 홈페이지 채팅 테스트 세션 1건 → 방 생성, `#해외문의` 사람 멤버 전원(현재 4명) 초대, 첫 문의 멘션에 관찰자 제외 3명. 피드 줄 스레드에 답장 → 손님 화면 수신 + 방에 ↩️ 복사.
4. Netlify `SLACK_STAFF` 삭제(`netlify env:unset SLACK_STAFF --site de7005fe-…`). 코드가 읽지 않으므로 순서 무관.
5. 설정 안내 문서 `2026-09-03-slack-patient-rooms-slack-setup.md` §5(SLACK_STAFF)를 "채널에 추가/내보내기"로 교체.

기존 방(예: `chat-zh-5b0c7c`)에는 소급되지 않는다. 필요하면 Slack에서 수동 초대.

---

## 6. 하지 않는 것

- 기존 방에 새 멤버를 소급 초대하는 배치.
- 피드 줄 ts를 DB에 저장하는 방식(부모 메시지 읽기로 충분).
- `SLACK_STAFF` 폴백 유지("여전히 관리해야 하나"라는 혼란을 낳는다).
- Block Kit 카드·버튼(2단계 그대로 보류).
