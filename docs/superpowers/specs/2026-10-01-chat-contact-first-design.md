# 라이브채팅 "연락처 먼저" 1단계 — 자동 안내 + 연락처 받기 + 오늘 연락할 손님 (chat-contact-first)

> 작성: 2026-10-01 · 대상: 자동 안내(`liv-clinic/src/lib/chat/autoAck.ts`, `serverI18n.ts`), 연락처 카드(`components/chat/ChatCaptureBlock.tsx`, `ChatPanel.tsx`, `lib/chat/contactChannels.ts`), 연락처·메시지·세션 API(`app/api/chat/*`), 확대 알림(`escalationRunner.ts`), 영업시간(`businessHours.ts`), Slack 문구(`slackText.ts`, `slackRelay.ts`), 관리자 채팅 목록
> 선행 문서: `2026-09-03-slack-patient-rooms-design.md` §4.10(자동 첫 안내)·확대 알림, `chat-offhours-messenger-bridge.design.md`(2026-08-09, 영업시간 외 연락처 카드 — 리포에 커밋되지 않고 메인 작업 폴더 `docs/02-design/features/`에만 있다). 이 문서는 그 카드의 "영업시간 외에만 노출" 규칙과 자동 안내 문구를 대체한다.
> 결정(2026-10-01, 원장님): ① 영업시간 중 헤더 "We're online" 유지 ② 손님이 이메일을 쓰면 연락처로 저장 ③ 연락처를 남긴 손님은 5·12·30분 알림을 멈추고 **"오늘 연락할 손님"**으로 분류 ④ 약속 문구는 **"오늘 안에, 최대한 빨리 연락"** ⑤ 가격·효과는 사람이 직접 답변 ⑥ 이 1단계(AI 없음)를 먼저 내고, AI 이용 안내 답변은 바로 이어서 별도 문서로.
> 추가 결정(2026-10-01, 직원 의견 검토 뒤): ⑦ 채팅 카드에 **병원 WeChat QR과 아이디를 넣는다** — WeChat은 업무폰 한 대로만 응대할 수 있지만 앱 자체 번역으로 응대가 가능하므로, 손님이 병원 WeChat을 추가하게 한다(같은 날 "추가 버튼 제거" 안을 검토했다가 이쪽으로 확정). WhatsApp·LINE은 병원 계정으로 연결하는 버튼을 유지한다 ⑧ 연락처를 남긴 손님의 방에는 **직원 답글의 번역본**을 올려, 복사해서 위챗·왓츠앱·메일에 붙여 넣게 한다.
> 상태: **원장님 승인(2026-10-01).** 다음은 구현 계획과 구현 — §11 인계 메모를 따른다.

---

## 0. 한눈에 보기 (비개발자용)

| 지금 | 바뀐 뒤 |
|------|---------|
| 영업시간 중 첫 글에 "잠시만 기다려 주세요. 곧 답변드리겠습니다"만 나간다 (실제 첫 답변은 중앙값 12분) | "답변까지 10~20분쯤 걸릴 수 있습니다. 연락처를 남겨 주시면 **오늘 안에 최대한 빨리** 연락드리겠습니다" |
| 직원 첫 답변의 절반이 "어떤 시술, 언제 오시나요?" 되묻기이고, 그 사이 손님은 떠난다 | 자동 안내가 **시술과 방문 예정일을 먼저 묻는다** |
| 자동 안내가 손님 글 뒤 약 8초(4~14초) 만에 나간다 | **3초 이내**로 앞당긴다 |
| 연락처 카드는 밤·주말에만 뜬다 | 손님이 답을 기다리는 동안이면 **낮에도** 뜬다 |
| 카드에서 받는 연락처: WhatsApp·WeChat·LINE ID | WhatsApp 번호·WeChat ID·**이메일**. LINE ID는 받지 않는다 (ID 검색이 2건 모두 실패) |
| 카드의 WeChat은 버튼 하나다. 휴대폰에서는 앱 링크(안 열리는 경우가 있다), PC에서는 QR만 뜬다 | 카드에 **병원 WeChat QR과 아이디(복사 버튼)**를 함께 보여 준다. 중국어 화면에서는 펼친 채로 나온다 |
| 손님이 대화에 이메일을 써도 그냥 글자다 | **자동으로 연락처로 저장**하고 Slack 방에 알린다 |
| 직원 답글이 손님 언어로 어떻게 나갔는지는 관리자 화면에서만 보인다 | 연락처를 남긴 손님의 방에는 **번역본이 바로 아래 올라온다** — 복사해서 위챗·왓츠앱·메일에 붙여 넣는다 |
| 연락처를 남겨도 5·12·30분 재촉 알림이 계속 울린다 | 재촉 알림을 멈추고 **"오늘 연락할 손님"**으로 분류. 하루 두 번(문 열 때, 마감 1시간 전) 남은 손님 목록을 `#해외문의`에 올린다 |
| 공휴일·임시 휴진을 모른다 (추석 낮에도 "곧 답변드리겠습니다") | **휴진일을 등록**하면 그날은 "상담 시간 아님" 안내, 알림 없음 |

비용 0원, Slack 앱 재설치 없음, AI 호출 없음. 직원이 Slack에서 답하는 방법은 그대로다.

### 0.1 원장님이 확인·제공하실 것

| # | 항목 | 설명 |
|---|------|------|
| U-1 | **손님 문구 확인** | §4.1 한국어 원문 12문장. 다른 언어는 이 원문을 기준으로 옮긴다 |
| U-2 | **병원 LINE 친구 추가 링크** | LINE 앱 → 홈 → 친구 추가 → QR 코드 → 링크 복사. 받으면 사이트 전체의 LINE 버튼이 ID 검색 없이 동작한다. 늦게 주셔도 나머지는 먼저 나간다 |
| U-3 | **올해 남은 휴진일** | 날짜 목록(예: 10/3, 10/9, 12/25). 없으면 빈 채로 나가고 지금처럼 동작한다 |
| U-4 | **이메일만 남긴 손님은 직원이 직접 메일을 보내야 한다** | 1단계에는 메일 자동 발송이 없다. 방에 한국어로 답을 쓰면 번역본이 올라오므로(§4.5 d) 그것을 복사해 메일에 붙이면 된다. 자동 발송은 다음 단계 후보다(§10) |
| U-5 | **개인정보 처리방침에 OpenAI·Slack 추가 여부** | 지금 위탁 업체 목록에 Supabase·Google Analytics만 있다. 넣으려면 문구 초안(§10)을 승인해 주시면 함께 반영한다 |

---

## 1. 배경 — 실측 (2026-05-08 ~ 10-01, 시험 제외 문의 25건)

운영 DB 읽기 전용 조회(2026-10-01 오전 기준 — 그날 새벽 문의가 오후에 답변되면서 일부 수치는 이후 조금 달라진다). 건수가 적어 비율은 참고용이다. 5/8 개통일 저녁 2건은 시험일 수 있다. 같은 정의로 다시 재려면 `liv-clinic/scripts/chat-response-baseline.mjs`를 쓴다.

- 영업시간 중 12건 / 밖 13건. 영업시간 중 첫 직원 답변까지 **중앙값 11.8분**.
- 답변 뒤 손님이 대화를 이어간 비율: 5분 안에 답한 8건 중 5건, **15분을 넘긴 11건 중 2건**.
- 연락처 카드(2026-08-09 배포)는 영업시간 외에만 뜬다. 이후 영업시간 외 8건 중 4건이 메신저를 남겼고, **영업시간 중 4건은 4건 모두 연락처가 없다.**
- 25건 중 8건은 연락처도 없고 손님도 돌아오지 않아 다시 닿을 방법이 없다.
- 직원이 답한 22건 중 **12건의 첫 답변이 "어떤 시술, 언제"를 되묻는 말**이었고, 그중 9건은 손님이 답하지 않고 끝났다.
- LINE ID 방식은 기록에 남은 2건 모두 실패했다(8/19 일본 손님: 병원 LINE 링크에서 "ID 검색 불가", 직원도 손님 ID 조회 불가 / 9/24 대만 손님: 직원이 ID 확인 불가). LINE은 연령 인증이 안 된 계정의 ID 검색을 막고, QR·친구 추가 링크는 막지 않는다.
- 추석 연휴 9/24 04:20 문의는 9/28에 답변됐다. 코드에 휴진일 개념이 없어 연휴 낮에도 영업시간으로 판정한다.

문제의 구조: 웹 채팅은 양쪽이 동시에 있어야 하는데 손님은 한 번 쓰고 떠난다. 손님이 확실히 화면 앞에 있는 순간은 **첫 글을 보낸 직후 몇 초**뿐이므로, 그때 (1) 정직한 예상 시간 (2) 돌아올 길(연락처) (3) 한 번에 답하는 데 필요한 정보를 받는다.

---

## 2. 목표

| # | 지표 | 현재 | 목표 |
|---|------|------|------|
| G-1 | 영업시간 중 문의 가운데 연락 수단을 확보한 비율 (이메일·메신저 연락처·메신저 버튼 클릭) | 4건 중 0건 (8/9 이후) | **절반 이상** |
| G-2 | 다시 닿을 방법이 없는 문의 | 25건 중 8건 | **절반 이하** |
| G-3 | 연락처를 남긴 손님의 방에 울린 5·12·30분 알림 | 매번 | **0회** |
| G-4 | 마감 1시간 전 요약에 남아 있는 "오늘 연락할 손님" | 측정 없음 | 요약으로 매일 관찰 (0건 지향) |
| G-5 | 손님 첫 글 → 자동 안내 도착 | **4.2~13.7초, 중앙값 7.9초** (자동 안내 15회 실측. 선행 스펙의 목표 3초에 못 미친다) | **3초 이내** (§4.1 발송 시점 변경, 번역 API 호출 0회 유지) |

측정은 `liv-clinic/scripts/chat-response-baseline.mjs`(읽기 전용, 이 문서와 함께 커밋됨)로 배포 2주·4주 뒤에 한다. 시험 세션 판정: 이름에 `test`·`테스트`·`smoke`가 있거나 첫 글이 3자 이하·한글.

---

## 3. 범위

**In Scope**
- 자동 안내를 "접수 안내"(예상 시간 + 연락처 요청 + 되묻기)로 교체 — 영업 중 / 마감 임박 / 상담 시간 외, 연락처 있음 / 없음
- 자동 안내 발송 시점 앞당기기 (번역·Slack 릴레이를 기다리지 않고 손님 글 저장 직후)
- 연락처 카드: 영업시간 중에도 노출, 이메일 채널 추가, LINE ID 수집 중단, 병원 WeChat QR·아이디 표시, 메신저 버튼을 눌러도 카드를 닫지 않음
- 손님 글 속 이메일 자동 인식 → 연락처 저장
- 연락처를 남긴 손님: 확대 알림 제외 + Slack 분류 표시 + 하루 두 번 요약 + 직원 답글 번역본을 방에 올리기
- 휴진일(`CHAT_CLOSED_DATES`)
- 관리자 채팅 목록에 "오늘 연락" 표시
- 마이그레이션 042 (컬럼 2개, 추가형)
- 측정 스크립트 (작성 완료 — 구현 뒤 메신저 버튼 집계가 맞게 나오는지만 확인)

**Out of Scope** — §10에 이유와 함께 정리

---

## 4. 설계

### 4.1 자동 안내 (접수 안내)

**언제 무엇을 보내는가** — `sendAutoAckIfDue`의 발송 조건(새 대기 구간의 첫 손님 글, 조건부 선점)은 그대로 두고 **내용만** 가른다.

| 종류 | 조건 | 내용 |
|------|------|------|
| 접수 안내 | 이 세션에서 자동 안내를 보낸 적이 없거나(`auto_ack_at IS NULL`), 마지막 자동 안내가 **12시간보다 오래됨** | 아래 문장 조합 |
| 짧은 안내 | 그 밖(직원과 주고받는 중의 재발신) | **현행 문구 그대로** (`autoAck` / `autoAckOffHours`) |

**시간대 구분** — `businessHours.ts`에 `businessSlot(now)` 추가:

| 값 | 조건 |
|----|------|
| `open` | 영업시간 중이고 마감까지 60분 초과 |
| `closing` | 영업시간 중이고 마감까지 60분 이하 |
| `closed` | 영업시간 외 또는 휴진일(§4.6) |

**문장 조합** — `G` + `S_{slot}` + `C_{연락처 유무}_{slot}` + `Q` + (`open`일 때만 `W`), 줄바꿈으로 잇는다. 연락처 유무 = `visitor_email` 또는 `visitor_messenger_handle`이 있는가(시작 화면에서 넣은 이메일 포함).

한국어 원문 (U-1 확인 대상):

| 키 | 문장 |
|----|------|
| `G` | 안녕하세요, 리브성형외과입니다. 메시지 잘 받았습니다. |
| `S_open` | 지금 상담 직원이 다른 손님을 안내 중이라 답변까지 10~20분쯤 걸릴 수 있습니다. |
| `S_closing` | 오늘 상담 시간이 곧 끝납니다. |
| `S_closed` | 지금은 상담 시간이 아닙니다. |
| `C_ask_open` | 기다리지 않으셔도 되도록 아래에 WeChat·LINE·WhatsApp·이메일 중 편한 연락처를 남겨 주시면, 오늘 안에 최대한 빨리 그쪽으로 연락드리겠습니다. |
| `C_ask_closing` | 아래에 WeChat·LINE·WhatsApp·이메일 중 편한 연락처를 남겨 주시면, 오늘 안에 연락드리고, 어려우면 다음 영업일에 가장 먼저 연락드리겠습니다. |
| `C_ask_closed` | 아래에 WeChat·LINE·WhatsApp·이메일 중 편한 연락처를 남겨 주시면, 상담 시간이 시작되는 대로 최대한 빨리 그쪽으로 연락드리겠습니다. |
| `C_known_open` | 남겨 주신 연락처로 오늘 안에 최대한 빨리 연락드리겠습니다. |
| `C_known_closing` | 남겨 주신 연락처로 오늘 안에 연락드리고, 어려우면 다음 영업일에 가장 먼저 연락드리겠습니다. |
| `C_known_closed` | 남겨 주신 연락처로 상담 시간이 시작되는 대로 최대한 빨리 연락드리겠습니다. |
| `Q` | 원하시는 시술과 방문 예정일을 함께 적어 주시면 한 번에 정확히 안내드릴 수 있습니다. |
| `W` | 이 창을 열어 두시면 여기로도 답변드립니다. |

`closed`의 약속을 "다음 영업일"이 아니라 "상담 시간이 시작되는 대로"로 쓴 이유: 영업시간 외 문의 13건 중 7건은 문 열기 전 새벽·아침에 왔고, 그런 날은 **당일**에 문을 연다. 정확한 시각은 카드가 손님 현지 시각으로 보여 준다(§4.2).

영어 기준문 (다른 9개 언어는 이 뜻을 그대로 옮긴다):

| 키 | 문장 |
|----|------|
| `G` | Hello, this is LIV Plastic Surgery. We've received your message. |
| `S_open` | Our consultants are assisting other guests right now, so a reply may take about 10–20 minutes. |
| `S_closing` | Our consultation hours end soon today. |
| `S_closed` | We're outside consultation hours right now. |
| `C_ask_open` | So you don't have to wait, leave a contact below (WeChat, LINE, WhatsApp or email) and we'll reach out to you there today, as soon as we can. |
| `C_ask_closing` | Leave a contact below (WeChat, LINE, WhatsApp or email) and we'll reach out to you there — today if we can, otherwise first thing on the next business day. |
| `C_ask_closed` | Leave a contact below (WeChat, LINE, WhatsApp or email) and we'll reach out to you there as soon as our consultation hours begin. |
| `C_known_open` | We'll reach out to you today at the contact you left, as soon as we can. |
| `C_known_closing` | We'll reach out to you at the contact you left — today if we can, otherwise first thing on the next business day. |
| `C_known_closed` | We'll reach out to you at the contact you left as soon as our consultation hours begin. |
| `Q` | If you tell us which treatment you're interested in and when you plan to visit, we can give you a complete answer in one go. |
| `W` | If you keep this window open, we'll also reply here. |

**저장 형태·전달은 현행과 같다**(선행 스펙 §4.10): `sender='operator'`, `original_text`=한국어 원문, `translated_text`=손님 언어, `source='auto'`, `sender_label='자동 안내'`, 번역 API 호출 없음. `source='auto'`라 대기 시계·미응답 수를 건드리지 않는다. 한 메시지(말풍선 하나)에 줄바꿈으로 넣는다 — 손님 말풍선은 `whitespace-pre-wrap`이라 줄이 그대로 보인다.

**발송 시점을 앞당긴다** — 지금은 손님 글을 번역하고(동기, 9/4 이후 실측 중앙값 2.6초·상위 10% 4.1초) 응답한 뒤 `after`에서 Slack 릴레이(첫 글이면 방 생성·초대·주제·게시·피드까지)를 **끝낸 다음** 자동 안내를 보낸다. 운영 실측으로 손님 글 뒤 4.2~13.7초(중앙값 7.9초, 15회)가 걸렸다. 이 설계는 손님이 화면 앞에 있는 첫 몇 초에 기대고 있으므로 순서를 바꾼다.

```
1. 손님 글 INSERT (pending)            ← 트리거가 awaiting_since를 세운다
2. 글 속 이메일 인식·저장 (§4.3)        ← 원문만 있으면 된다
3. 자동 안내 시작 — 기다리지 않는다     ← 번역·Slack과 무관
4. 번역 → UPDATE → broadcast → 응답
5. after: Promise.all([ Slack 릴레이(→ 연락처 알림), 3의 Promise ])
```

자동 안내는 번역도 Slack도 쓰지 않으므로 3에서 바로 나간다(DB 왕복 3~4회). 5에서 그 Promise를 기다려 함수가 끝나기 전에 완료를 보장한다. `sendAutoAckIfDue`는 throw하지 않는다. 직원 알림 시점은 바뀌지 않는다. 손님 화면은 자동 안내 broadcast를 받으면 메시지를 다시 가져오므로 손님 자신의 글과 자동 안내가 함께 보이고, 뒤이어 오는 응답은 id로 중복 제거된다(현행 `appendOptimistic`).

**구현 단위**
- 새 파일 `lib/chat/visitorMessageFollowups.ts`(라우트 테스트가 없는 리포라 로직을 lib로 뺀다):
  - `startEarlyFollowups(admin, session, text)` — 2를 끝까지 하고 3을 시작해 `{ contact, ackPromise }`를 돌려준다.
  - `runVisitorMessageFollowups({ relayArgs, contact, ackPromise })` — 5. Slack 쪽은 손님 글 릴레이 → (이메일이 저장됐으면) 연락처 알림을 순차로.
  - `api/chat/messages` 손님 경로는 INSERT 직후 `startEarlyFollowups`, `after()`에서 `runVisitorMessageFollowups`를 부른다. 직원(관리자 화면) 경로는 Slack 릴레이만 하던 그대로다.
- `serverI18n.ts`: `INTAKE_FRAGMENTS`(10개 로케일 × 12키) + `INTAKE_FRAGMENTS_KO`, `composeIntakeTexts(locale, slot, hasContact): { ko, localized }` (순수).
- `autoAck.ts`: `autoAckKind({ autoAckAt }, now): 'intake' | 'short'` (순수), `sendAutoAckIfDue`가 세션 조회에 `visitor_email, visitor_messenger_handle`을 더 읽고 종류에 따라 문구를 고른다. 선점·INSERT·broadcast는 그대로.
- 기존 `getAutoAckTexts`·`autoAck`·`autoAckOffHours` 문구는 "짧은 안내"로 계속 쓴다(변경 없음).

### 4.2 연락처 카드

**노출 규칙** — `contactChannels.ts`의 `shouldShowCaptureBlock`(순수)을 아래로 교체하고, `ChatPanel`의 인라인 조건을 이 함수로 바꾼다. 영업시간 여부는 더 이상 노출 조건이 아니고 **안내 문구만** 가른다.

```
presence 조회됨 (실패 시 미노출 — 현행)
AND 세션 정보 조회가 끝남 (hasContact 판정, 실패하면 "연락처 없음"으로 본다)
AND 손님 글 1건 이상
AND 서버 기준 연락처 없음 (hasContact = false)
AND 손님이 최근 12시간 안에 ✕로 닫지 않음
AND 기다리는 중: 손님 글과 직원 글(자동 안내·시스템 메시지 제외) 중 마지막이 손님 글
AND 최근 10분 안에 직원 글이 없음
```

- 마지막 두 조건은 직원과 실시간으로 주고받는 중에 카드가 끼어들지 않게 한다. 직원이 10분 넘게 조용해지면 카드가 다시 나타난다(presence 30초 폴링이 다시 그린다).
- ✕로 닫은 상태는 지금 영구 저장(`'1'`)인데, **닫은 시각을 저장해 12시간만 유지**한다. 접수 안내가 12시간 뒤 다시 나갈 때(§4.1) "아래에 연락처를 남겨 주세요"라는 문장과 카드가 어긋나지 않게 하기 위해서다. 옛 값 `'1'`은 만료된 것으로 본다.
- 직원 글 판정을 위해 손님용 `GET /api/chat/messages` 응답에 `source`를 추가한다(`'auto'`면 자동 안내).
- `hasContact`는 서버가 알려 준다: 패널을 열 때 `GET /api/chat/sessions?token=`(응답에 `hasContact` 추가), 글을 보낼 때 `POST /api/chat/messages` 응답(§4.3), 카드에서 저장했을 때.

**카드 내용** (위에서 아래로)

| 부분 | 내용 | 변경 |
|------|------|------|
| 제목 | `captureHeading` ("Don't miss our reply") | 그대로 |
| 안내 한 줄 | 상담 시간 외: 기존 `captureReturnAt`(복귀 시각을 한국 시각 + 손님 현지 시각으로). 영업시간 중: 신규 `captureBusyLead` | 영업시간 중 문구 신규 |
| 메신저로 이어가기 | 그 로케일의 1순위 메신저는 크게, 나머지는 작은 링크 + 참조 코드 안내(현행 순서). WhatsApp·LINE은 병원 계정으로 가는 버튼, **WeChat은 병원 QR·아이디 블록**(아래) | **버튼을 눌러도 카드를 닫지 않는다.** 누르면 그 아래에 `captureMessengerFallback` 한 줄이 나타나고 서버에 알린다(§4.4) |
| 연락처 남기기 | 칩 `[WhatsApp] [WeChat] [Email]` + 입력 1칸 + 저장 | **이메일 추가, LINE 칩 제거.** 기본 선택: `zh` → WeChat, `ja` → Email, 그 외 → WhatsApp |
| 개인정보 한 줄 | 신규 `capturePrivacyNote` | 신규 |

- **WeChat은 병원 QR과 아이디를 보여 준다** (결정 ⑦)
  - 블록 내용: QR 이미지(`/images/wechat-qr.png`, 기존 자산), `WeChat ID: livps0414` + **복사 버튼**, 안내 한 줄(`captureWechatLead` — QR을 스캔하거나 아이디를 검색해 추가한 뒤 참조 코드를 보내 달라는 내용).
  - `zh`는 1순위가 WeChat이므로 이 블록을 **펼친 채로** 보여 준다(큰 버튼 자리). 다른 로케일은 작은 링크 "WeChat"을 누르면 같은 블록이 카드 안에 펼쳐진다.
  - 휴대폰·PC 모두 같은 블록이다. 지금 휴대폰에서 쓰는 앱 링크(`weixin://dl/chat?…`)는 카드에서 쓰지 않는다 — 자기 화면의 QR은 스캔할 수 없으므로 휴대폰 손님은 **아이디 복사 → WeChat에서 검색**이 확실한 길이다. QR을 누르면 기존 `WeChatQRModal`로 크게 본다(저장하거나 다른 기기로 스캔).
  - 아이디 복사 또는 QR 확대를 누르면 서버에 `click`(wechat)을 알린다(§4.4) → 방에 한 줄. 블록이 보이기만 한 것은 알리지 않는다.
  - 병원 아이디는 상수 한 곳에 둔다: `constants.ts`에 `WECHAT_ID = 'livps0414'`를 추가하고, 지금 값을 따로 들고 있는 `WeChatInfo.tsx`도 이 상수를 쓰게 한다.
  - 직원 쪽: 친구 요청과 메시지는 업무폰 WeChat으로 온다. 앱의 번역(받은 글 자동 번역, 쓰면서 번역)으로 응대하고, 긴 답은 방에 써서 올라온 번역본을 붙여 넣는다(§4.5 d, §9 직원 안내).
  - "WeChat ID 남기기"(연락처 남기기의 WeChat 칩)는 그대로 둔다 — 손님이 원하면 직원이 추가하는 길도 남긴다.

- 메신저 버튼을 누른 뒤에도 카드를 남기는 이유: 지금은 버튼을 누르는 순간 카드가 닫힌다. 8/19 손님은 LINE 버튼이 실패한 뒤 대화창에 직접 "LINE이 안 된다"와 이메일을 적어야 했다.
- 저장에 성공하면 카드는 사라진다(`hasContact = true`). 확인은 대화창의 시스템 메시지가 한다(§4.4) — 카드 안의 초록색 "Saved!" 상태는 없앤다.
- **LINE**: 직원이 손님 LINE ID를 찾지 못하므로 ID를 받지 않는다. LINE은 손님이 병원을 추가하는 버튼으로만 남는다. 원장님이 친구 추가 링크(U-2)를 주시면 `constants.ts`의 `SOCIAL_LINKS.line`을 그 링크로 바꾼다(사이트 전체 LINE 버튼에 적용). 받기 전까지는 현행 링크를 쓴다.
- `contactChannels.ts`: `CONTACT_CHANNELS`를 `MESSENGER_LINK_CHANNELS = ['whatsapp','wechat','line']`(메신저로 이어가기)과 `CONTACT_FORM_CHANNELS = ['whatsapp','wechat','email']`(남기기)로 나눈다. `validateContactHandle`에 `email` 분기, `defaultFormChannel(locale)`, `orderedLinkChannels(locale)`(1순위 메신저를 맨 앞으로 — 지금 `ChatCaptureBlock` 안의 `orderedChannels`를 옮긴 것) 추가. `primaryMessengerFor`(사이트 전역)는 바꾸지 않는다.

### 4.3 손님 글 속 이메일 자동 인식

`POST /api/chat/messages` 손님 경로에서, 손님 글을 INSERT한 **직후(번역 전)** 처리한다(§4.1의 순서 2). 원문만 보면 되고, 자동 안내가 결과를 써야 하기 때문이다.

1. `extractEmail(text)`(순수, `contactChannels.ts`): 첫 이메일 형태 문자열 1개. 병원 자체 도메인(`livps.co.kr`, `liv-clinic.net`)은 제외. 254자 초과는 무시.
2. 찾았고 세션의 `visitor_email`과 다르면(대소문자 무시) `visitor_email`을 갱신한다 — 마지막에 쓴 주소가 이긴다. 같으면 아무것도 하지 않는다.
3. 손님 화면에 확인 시스템 메시지(§4.4와 같은 문구), Slack 방·피드에 알림(§4.5). Slack 알림은 응답 뒤(`after`) 손님 글 릴레이 **다음**에 보낸다 — 방에서 글 → 연락처 순으로 보이게.
4. 응답에 `contact: { saved: boolean, hasContact: boolean }`를 싣는다.
5. 연락처 저장 한도(세션당 하루 5회, `checkContactSaveLimit`)를 넘으면 인식을 건너뛴다. 글 자체는 정상 처리한다.

자동 안내는 이 뒤에 시작하므로, 첫 글에 이메일을 쓴 손님(10/1 06:36 사례)은 "남겨 주신 연락처로 …" 문장을 받는다. 손님 화면의 순서는 손님 글 → 저장 확인 → 접수 안내가 된다.

메신저 ID(WeChat·LINE 등)는 글에서 인식하지 않는다 — 형식이 일정하지 않아 오인식이 많다. 직원이 글을 읽으면 된다.

### 4.4 연락처 API — `POST /api/chat/contact`

요청: `{ sessionToken, channel, handle?, kind? }`

| `kind` | `channel` | 동작 |
|--------|-----------|------|
| `save` (기본) | `whatsapp` · `wechat` · `line`(옛 화면 호환) | 현행: `visitor_messenger_channel/handle` 저장 |
| `save` | `email` | `visitor_email` 저장 (형식 검증은 세션 생성과 같은 규칙) |
| `click` | `whatsapp` · `wechat` · `line` | `visitor_messenger_clicked`에 채널 기록 + Slack 방에 한 줄. `handle` 없음. 연락처로 치지 않는다. WeChat은 아이디 복사·QR 확대가 클릭이다(§4.2) |

- `save` 성공 시: 확인 시스템 메시지 INSERT + broadcast(현행), Slack 방·피드 알림(§4.5), 응답 `{ ok: true, hasContact: true }`.
- 확인 문구(`CONTACT_SAVED_TEMPLATES`, 10개 로케일)는 영업시간 중에도 맞도록 바꾼다: `{channel} contact saved: {handle}. We'll reach out to you there as soon as we can.` (기존: "…once we are back online"). 이메일의 채널 표기는 `Email`.
- `click`은 손님 화면에 아무것도 남기지 않는다. 화면 이동을 막지 않도록 클라이언트는 응답을 기다리지 않는다.
- 한도: `save`·`click`·글 속 이메일 인식(§4.3)을 합쳐 세션당 하루 5회(현행 한도 재사용).

**구현 단위** — 이 리포에는 라우트 단위 테스트가 없고 로직은 `lib/chat`에서 테스트한다. 그래서 저장 로직을 새 파일 `lib/chat/contactService.ts`로 뺀다: `saveVisitorContact(admin, session, { channel, handle })`, `recordMessengerClick(admin, session, channel)`, `saveEmailFromMessage(admin, session, text)`. 세 함수 모두 throw하지 않고 결과 객체를 돌려준다. 라우트(`api/chat/contact`, `api/chat/messages`)는 검증·한도·응답만 맡는다.

### 4.5 "오늘 연락할 손님"

**정의** — 아래를 모두 만족하는 세션:

```
status = 'open' AND resolved_at IS NULL
AND awaiting_since IS NOT NULL          -- 손님의 마지막 글에 직원이 아직 답하지 않음
AND (visitor_email IS NOT NULL OR visitor_messenger_handle IS NOT NULL)
```

새 상태 컬럼을 만들지 않는다 — 기존 값에서 파생된다. 메신저 버튼 클릭만 한 손님은 해당하지 않는다(우리가 먼저 연락할 길이 없다).

**목록에서 빠지는 때** (= 연락 완료): 직원이 방에 답글을 쓰거나(대기 시계가 멈춘다 — 현행 트리거), 방을 보관(완료)하거나, 관리자 화면에서 완료했을 때. WeChat 등으로만 연락하고 방을 그대로 두면 목록에 남아 다음 요약에 다시 오른다. 운영 규칙은 **"답은 방에 한국어로 쓰고, 올라온 번역본을 복사해 위챗·왓츠앱·메일에 붙여 넣는다. 상담이 끝나면 방을 보관한다"**이다((d) 참고). 방에 쓴 답은 채팅창에도 남으므로 손님이 사이트에 돌아와도 본다. 손님이 다시 글을 쓰면 다시 목록에 든다.

**(a) 재촉 알림 정지** — `escalationRunner.ts`의 후보 조회에 `visitor_email IS NULL AND visitor_messenger_handle IS NULL` 조건을 더한다. 5·12·30분 알림은 **연락처가 없는 손님에게만** 간다(그 손님은 창을 닫으면 끝이므로 지금처럼 급하게). 알림이 이미 1~2단계 올라간 뒤에 연락처를 남기면 그 시점부터 멈춘다. 첫 문의의 전원 멘션은 그대로다.

**(b) 분류 표시**
- 연락처 저장 시 방에 게시(기존 `buildContactText` 문구 교체):
  ```
  📱 *손님이 연락처를 남겼습니다* — WeChat: abc123
  _'오늘 연락할 손님'으로 분류했습니다. 5·12·30분 알림은 울리지 않습니다._
  _이 방에 한국어로 답을 쓰면 바로 아래에 번역본이 올라옵니다. 복사해서 위챗·왓츠앱·메일에 붙여 넣으세요._
  _방에 답을 쓰면 목록에서 빠집니다. 상담이 끝나면 방을 보관(완료)해 주세요._
  ```
- `#해외문의` 피드에 한 줄(`buildFeedLine` 종류 `contact` 추가): `📋 연락처 남김 · 🇨🇳 Li Wei · WeChat · <#방> · 10/01(목) 14:03 KST`
- 시작 화면에서 이메일을 넣은 손님은 방의 첫 메시지 꼬리말에 `_이메일을 남긴 손님입니다 — '오늘 연락할 손님'으로 관리되며 재촉 알림은 울리지 않습니다. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다._`를 붙인다.
- 메신저 버튼 클릭 시 방에: `📲 손님이 WhatsApp으로 이어가기를 눌렀습니다 — 병원 WhatsApp에서 코드 #A1B2C3D4 가 담긴 메시지를 확인해 주세요. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다.` (LINE도 같은 형식). WeChat은 `📲 손님이 병원 WeChat 아이디·QR을 확인했습니다 — 업무폰 WeChat에서 친구 요청과 코드 #A1B2C3D4 메시지를 확인해 주세요. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다.`

**(c) 하루 두 번 요약** — `#해외문의`에 답변 직원 전원 멘션으로:

```
📋 *오늘 연락할 손님 2명* @이정현 @방애금 @유다영
• 🇨🇳 Li Wei · WeChat · 10/01(목) 09:26 문의 · <#방>
• 🇬🇧 익명 · 이메일 · 10/01(목) 14:03 문의 · <#방>
_방에 답을 쓰거나 방을 보관(완료)하면 목록에서 빠집니다._
```

- 시각: 그날 **영업 시작 시각**(평일·토 10:00)과 **마감 60분 전**(평일 18:00, 토 15:00). `businessHours` 설정에서 계산한다. 휴진일에는 없다.
- 대상: 위 정의 + `awaiting_since`가 최근 7일 이내(오래된 건이 끝없이 오르지 않게). 0명이면 게시하지 않는다. 20명 초과는 "외 N명".
- 실행: 3분 크론(`POST /api/chat/ops`)이 확대 알림 다음에 `runFollowupDigest(now)`를 부른다. 창은 각 시각부터 **9분**(크론 3회분 — 한 번 빠져도 다음 회가 받는다). 세션마다 `followup_digest_at`을 조건부 UPDATE(`IS NULL OR < 창 시작`)로 선점하고, **선점된 세션만** 모아 한 번 게시한다 — 크론이 겹치거나 다시 돌아도 같은 세션이 같은 창에 두 번 오르지 않는다. 창이 열린 뒤 9분 안에 새로 연락처를 남긴 손님은 다음 회에 한 줄짜리 요약으로 따로 오를 수 있다(드물고, 놓치는 것보다 낫다).
- 방이 없는 세션(스레드 방식 폴백)은 방 링크 대신 관리자 화면 링크.
- 답변 직원이 없으면(`SLACK_ROOMS=off` 등) 게시하지 않는다(기존 안전 스위치와 같다).
- 새 파일 `followupDigest.ts`: `digestWindow(now, hours)`(순수 — 지금이 어느 창인지와 창 시작 시각), `runFollowupDigest(now)`. 문구는 `slackText.ts`의 `buildFollowupDigestText`.

**(d) 직원 답글의 번역본을 방에 올린다** (결정 ⑧)

직원 답글은 지금도 손님 언어로 번역되어 채팅창에 전달되지만, Slack에서 쓴 답글의 번역문은 관리자 화면에서만 보인다. 연락처를 남긴 손님에게는 그 번역문을 위챗·왓츠앱·메일로 **옮겨 보내야** 하므로 방에 올려 준다.

- **대상**: 방 모드 세션 중 `visitor_email`·`visitor_messenger_handle`·`visitor_messenger_clicked` 가운데 하나라도 있는 세션. 버튼만 누른 손님도 직원이 그 메신저에서 답해야 하므로 포함한다.
- **언제**: 직원이 Slack에서 쓴 답글(방 본문, `#해외문의` 피드 줄 스레드 답장)이 손님에게 전달된 직후. 번역이 성공했고 번역문이 원문과 다를 때만.
- **무엇을**: 봇이 방 본문에 **번역문만 담은 메시지 하나**를 올린다. 머리말·이모지·꾸밈을 붙이지 않는다 — 휴대폰 Slack의 "텍스트 복사"는 메시지 전체를 복사하므로 다른 글자가 섞이면 붙여 넣은 뒤 지워야 한다. 무엇인지는 (b)의 안내 줄과 위치(직원 답글 바로 아래, 봇이 쓴 글)로 알 수 있다.
- 관리자 화면에서 쓴 답글은 지금도 방에 원문과 번역이 함께 올라가므로(`buildReplyText`) 그대로 둔다.
- 손님 화면·DB에는 영향이 없다(`chat_messages`에 넣지 않는다). 봇이 쓴 글이라 손님에게 되돌아가지 않는다.
- **구현**: `slackRelay.ts`의 `relaySlackReplyToVisitor`가 전달(INSERT·broadcast, 피드 답장이면 방 복사까지) 뒤에 `postTranslationCopy(admin, session, translation)`을 부른다. 연락 수단 유무는 **별도 조회**(`select visitor_email, visitor_messenger_handle, visitor_messenger_clicked`)로 확인한다 — 공용 `RELAY_SESSION_COLUMNS`에 새 컬럼을 넣으면 042 적용 전 배포에서 릴레이 전체가 깨지기 때문이다. 조회나 게시가 실패하면 경고만 남긴다(답글 전달 결과 `delivered`는 그대로). 문구는 `slackText.ts`의 `buildTranslationCopyText(translated)` — Slack 이스케이프만 한다.

**긴급 정지** — 환경변수 `CHAT_FOLLOWUP=off`면 (a)의 조건을 빼고(연락처가 있어도 지금처럼 5·12·30분 알림) 요약도, (d)의 번역본도 보내지 않는다.

**연락 방법 (직원, 코드 밖)** — 답은 항상 방에 한국어로 쓰고, 올라온 번역본을 복사해 옮긴다.

| 손님이 남긴 것 | 번역본을 붙여 넣는 곳 |
|----------------|----------------|
| WeChat ID | 업무폰 WeChat에서 손님 ID를 친구 추가한 뒤 대화창에 |
| WhatsApp 번호 | 병원 WhatsApp에서 그 번호로 (PC에서도 가능) |
| 이메일 | 병원 메일 (1단계는 직접 발송) |
| (WhatsApp·LINE 버튼 클릭) | 그 메신저에 온 손님 메시지(참조 코드로 확인)에 답장으로 |
| (병원 WeChat QR·아이디 확인) | 업무폰 WeChat에 온 친구 요청을 수락하고, 참조 코드로 손님을 확인한 뒤 그 대화창에 |

손님이 메신저로 보낸 글은 그 앱의 번역으로 읽는다. WeChat은 "받은 메시지 자동 번역"과 "쓰면서 번역"이 있어, 짧은 답은 방을 거치지 않고 WeChat 안에서 바로 써도 된다(§9 직원 안내). 그 경우 방은 그대로 남으므로 상담이 끝나면 보관한다.

### 4.6 휴진일

- 환경변수 `CHAT_CLOSED_DATES`: 한국 날짜를 쉼표로 (`2026-10-03,2026-10-09`). 형식이 틀린 항목은 무시하고 경고 1줄.
- `businessHours.ts`: `isBusinessHours`는 휴진일에 항상 `false`, `getNextOpenAt`은 휴진일을 건너뛴다. `businessSlot`은 `closed`.
- 결과: 그날은 헤더가 오프라인 문구, 자동 안내는 `closed` 문장, 카드는 다음 영업일 시각, 확대 알림·요약 없음(크론 라우트가 `isBusinessHours`로 걸러 낸다 — 현행).
- 등록·변경은 Netlify 환경변수 수정 + 재배포(함수 환경변수는 배포 시점에 고정된다). 관리자 화면에서 고치는 기능은 이번에 만들지 않는다.

### 4.7 Slack 문구 (`slackText.ts`)

| 대상 | 변경 |
|------|------|
| `ROOM_AUTO_ACK_NOTE` | `_손님에게는 접수 안내(예상 시간·연락처 요청·시술과 방문일 질문)가 자동으로 나갔습니다._` |
| `buildContactText` | §4.5 (b) 문구. 이메일 채널 표기 `이메일` |
| `buildFeedLine` | 종류 `contact` 추가 |
| `buildRoomFirstText` | 선택 인자 `contactNote` |
| 신규 `buildMessengerClickText` | §4.5 (b) |
| 신규 `buildFollowupDigestText` | §4.5 (c) |
| 신규 `buildTranslationCopyText` | §4.5 (d) — 번역문만, Slack 이스케이프 |

봇이 쓴 글은 이벤트 단계에서 걸러지므로(`bot_id`) 손님에게 되돌아가지 않는다.

### 4.8 관리자 채팅 목록

`admin/(authenticated)/chat/page.tsx`: 조회에 `awaiting_since`를 더하고, §4.5 정의에 맞는 줄에 `오늘 연락` 배지를 붙인다. 이메일·메신저 표시는 이미 있다.

### 4.9 오류·엣지

| 상황 | 처리 |
|------|------|
| 이메일 인식·저장 실패 | 경고 로그만. 손님 글·Slack 릴레이는 정상 |
| 카드 저장 실패 | 카드 안에 오류 문구, 다시 시도 가능 (현행) |
| 세션 정보 조회 실패 | 연락처 없음으로 보고 카드를 띄운다(놓치는 것보다 한 번 더 묻는 편이 낫다) |
| 마감 5분 전 문의 | `closing` 문장 — "오늘 안에"만 약속하지 않는다 |
| 손님이 틀린 이메일을 남김 | 재촉 알림은 멈춘다. 직원 답글은 채팅창에 남으므로 손님이 돌아오면 본다. 손님이 대화에 다시 쓰면 마지막 주소로 바뀐다 |
| 042 적용 전에 코드가 먼저 배포됨 | 요약·클릭 기록·번역본 게시가 경고만 남기고 실패한다(채팅 본 기능과 기존 릴레이는 정상 — 새 컬럼은 공용 조회 `RELAY_SESSION_COLUMNS`에 넣지 않는다). 그래도 **042를 먼저** 적용한다(§9) |
| 직원 답글의 번역이 실패했거나 생략됨(이모지·URL만) | 번역본을 올리지 않는다. 손님 쪽 처리는 현행(원문 전달 + 실패 표시)과 같다 |
| 번역본 게시가 Slack 오류로 실패(보관된 방 등) | 경고 로그만. 답글은 이미 손님에게 전달됐다 |
| 직원이 번역본을 보고 잘못을 발견 | 방에 고쳐 쓴 답을 다시 쓴다(새 번역본이 올라온다). 이미 보낸 글을 고치는 기능은 없다 — 현행과 같다 |
| 요약 게시가 Slack 오류로 실패 | 그 창에서는 다시 시도하지 않는다(선점 후 게시 — 확대 알림과 같은 방식). 다음 창에서 다시 오른다 |
| 옛 화면(캐시된 스크립트)이 `line` 저장 요청 | API가 받아 준다 |
| 자동 안내가 손님 글 전송 응답(번역 포함 약 2.6초)보다 먼저 도착 | 손님 글 말풍선이 먼저 보이고 입력창에는 같은 글이 잠깐 남는다 → `ChatPanel`이 전송 중인 글과 같은 손님 글이 목록에 나타나면 입력창을 바로 비운다 |
| 자동 안내를 시작한 뒤 번역·UPDATE가 실패해 500 응답 | 자동 안내는 이미 나갔거나 나가는 중이다. 손님 글 자체는 INSERT돼 있으므로(현행과 같은 상태) 문제 없다 |

---

## 5. 데이터 모델 — 마이그레이션 042 (추가형·멱등)

```sql
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS followup_digest_at        TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS visitor_messenger_clicked TEXT NULL
    CHECK (visitor_messenger_clicked IS NULL OR char_length(visitor_messenger_clicked) <= 20);

COMMENT ON COLUMN public.chat_sessions.followup_digest_at IS
  '"오늘 연락할 손님" 요약에 마지막으로 오른 시각. 요약 창 시작보다 이전이면 다시 오른다';
COMMENT ON COLUMN public.chat_sessions.visitor_messenger_clicked IS
  '손님이 카드에서 마지막으로 누른 메신저(whatsapp/wechat/line). 연락처가 아니다 — 측정과 번역본 게시 대상 판정에 쓴다';
```

트리거·인덱스·정책·publication 변경 없음. 이메일은 기존 `visitor_email`을 쓴다.

---

## 6. 환경변수

| 변수 | 상태 |
|------|------|
| `CHAT_CLOSED_DATES` | 신설, 선택. 비면 현행과 같다 |
| `CHAT_FOLLOWUP` | 신설, 선택. `off`일 때만 의미(§4.5 긴급 정지) |
| `CHAT_BUSINESS_HOURS_JSON`, `CHAT_ESCALATION_MINUTES`, `SLACK_*`, `CHAT_OPS_SECRET` | 그대로 |

루트 `.env.example`에 두 변수를 적는다.

---

## 7. i18n

| 위치 | 변경 |
|------|------|
| `serverI18n.ts` | `INTAKE_FRAGMENTS` 10개 로케일 × 12키 + 한국어 원문, `CONTACT_SAVED_TEMPLATES` 10개 문구 교체 |
| `src/messages/*.json` 11개 (`chat` 네임스페이스) | 신규 키 8개: `captureBusyLead`, `captureContactPlaceholderEmail`, `captureMessengerFallback`(`{code}` 변수), `capturePrivacyNote`, `captureWechatLead`(`{code}` 변수), `captureWechatIdLabel`, `captureCopy`, `captureCopied`. 기존 값은 바꾸지 않는다 |

- 메시지 JSON은 줄바꿈이 섞여 있어 다시 직렬화하면 안 된다. 기존 `chat` 키 줄 뒤에 **바이트 보존 삽입**으로 넣고, `JSON.parse` 무결성 + `npm run verify:i18n` + `git diff --numstat`(파일당 +8/−0)으로 검증한다.
- 쓰지 않게 되는 키(`captureContactSaved`, `captureContactPlaceholderLine`)는 지우지 않는다.
- 신규 키 문구(영어 기준):
  - `captureBusyLead`: "You don't have to wait here. Leave a contact and we'll reach out to you first."
  - `captureContactPlaceholderEmail`: "Email address"
  - `captureMessengerFallback`: "Send us the code {code} there. If it doesn't open, leave your contact below."
  - `capturePrivacyNote`: "We use your contact only to reply to this inquiry."
  - `captureWechatLead`: "Scan this QR code in WeChat, or copy our ID and search for it, to add us. Then send us the code {code}."
  - `captureWechatIdLabel`: "WeChat ID"
  - `captureCopy`: "Copy"
  - `captureCopied`: "Copied ✓"
- `zh`·`zh-TW`의 WeChat 문구는 이미 있는 `wechatPage` 문구(微信号, 复制, 已复制 ✓, 请使用微信扫描二维码…)와 표현을 맞춘다.

---

## 8. 테스트 (Vitest)

| 파일 | 내용 |
|------|------|
| `businessHours.test.ts` | 휴진일: `isBusinessHours` false, `getNextOpenAt` 건너뛰기, 형식 오류 무시. `businessSlot`: 마감 61분 전 `open` / 60분 전 `closing` / 마감 뒤·일요일·휴진일 `closed`, 토요일 마감 기준 |
| `autoAck.test.ts` | `autoAckKind`: 첫 발송·12시간 초과 → `intake`, 이내 → `short`. `composeIntakeTexts`: 10개 로케일 × 3 시간대 × 연락처 유무가 비어 있지 않고 서로 다름, `W`는 `open`에만, 한국어 원문에 "오늘 안에 최대한 빨리"·"상담 시간이 시작되는 대로". 기존 짧은 안내 테스트 유지 |
| `contactChannels.test.ts` | `extractEmail`(본문 중간·문장 끝 마침표·병원 도메인 제외·없음·여러 개면 첫째), 이메일 검증, `defaultFormChannel`, 채널 목록 분리(남기기 목록에 `line` 없음·`email` 있음), `orderedLinkChannels`(`ja` → LINE 먼저, `en` → WhatsApp 먼저, `zh` → WeChat 먼저), `shouldShowCaptureBlock` 새 조건 조합(영업시간 무관, 연락처 있음, 기다리는 중 아님, 직원 글 10분 이내, ✕ 12시간) |
| `contactService.test.ts` (신규) | `saveVisitorContact`: `email` → `visitor_email` 갱신 + 시스템 메시지, 메신저 → 기존 컬럼, `line` 호환. `recordMessengerClick`: 클릭 컬럼만 갱신·시스템 메시지 없음. `saveEmailFromMessage`: 인식 저장 1회, 같은 주소 재입력은 무변경, 이메일 없는 글은 무변경. DB 오류는 throw 없이 실패 결과 |
| `visitorMessageFollowups.test.ts` (신규) | `startEarlyFollowups`: 이메일 저장이 끝난 뒤에 자동 안내를 시작하고, 자동 안내 완료는 기다리지 않고 돌아온다. `runVisitorMessageFollowups`: 이메일이 저장된 경우에만 연락처 알림이 손님 글 릴레이 **뒤에** 간다, `ackPromise`를 끝까지 기다린다, 한쪽이 실패해도 다른 쪽은 끝난다 |
| `escalationRunner.test.ts` (신규) | 후보 조회에 연락처 NULL 조건 2개, `CHAT_FOLLOWUP=off`면 조건 없음 |
| `followupDigest.test.ts` (신규) | `digestWindow`: 평일 10:00~10:08·18:00~18:08, 토 15:00~, 창 밖은 null, 영업시간 설정 변경 반영. `runFollowupDigest`: 대상 조회 조건, 선점된 세션만 게시, 0명 무게시, 7일 초과 제외, 직원 없음·`off` 무게시 |
| `slackRelay.test.ts` | 번역본 게시: 연락 수단이 있는 방 세션의 Slack 답글 → 전달 뒤 번역문만 담은 게시 1회. 연락 수단 없음·번역 실패·번역 생략·스레드 모드·`CHAT_FOLLOWUP=off` → 게시 없음. 연락 수단 조회 실패·게시 실패 → 결과는 `delivered` 유지. 피드 스레드 답장은 방 복사 **뒤에** 번역본 |
| `slackText.test.ts` | 바뀐 문구와 신규 빌더 5종 |
| `fakeAdmin.ts` | `in`·`or`·`gte` 지원 추가 |

검증 게이트: `npm test`, `npx tsc --noEmit`, 변경 파일 대상 `npx eslint`, `npm run verify:i18n`, `npm run build`.

---

## 9. 롤아웃

1. **마이그레이션 042를 운영 DB에 먼저 적용**(추가형이라 기존 코드에 영향 없음).
2. 원장님 입력 반영: 휴진일 → Netlify `CHAT_CLOSED_DATES`, LINE 링크 → `SOCIAL_LINKS.line`(받았을 때).
3. master 머지·푸시(= Netlify 배포)는 원장님 승인 뒤.
4. 스모크(운영, 시험 이름 `Smoke Test 1001`):
   - 영업시간 중 첫 글 → 접수 안내(`open`) + 카드 표시 → 이메일 저장 → 대화창 확인 문구, 방에 📱, 피드에 📋 → 5분 뒤에도 재촉 알림 없음.
   - 다른 시험 세션에서 연락처 없이 5분 대기 → 기존 ⏰ 알림이 온다(회귀 확인).
   - 글에 이메일을 써서 자동 저장 확인.
   - 다음 요약 시각에 `#해외문의` 요약 게시 → 방에 답글 → 다음 요약에서 빠짐.
   - 연락처를 남긴 시험 세션의 방에 한국어로 답글 → 번역본이 바로 아래 올라옴 → **업무폰 Slack에서 길게 눌러 복사 → WeChat 입력창에 붙여 넣어** 번역문만 깨끗하게 들어가는지 확인.
   - 중국어 화면(`/zh`)에서 카드에 병원 WeChat QR과 아이디가 펼쳐져 있고, 복사 버튼으로 아이디가 복사되며, 누르면 방에 📲 한 줄이 오는지 확인. 영어 화면에서는 작은 "WeChat" 링크를 눌러야 펼쳐지는지 확인. 휴대폰에서 복사한 아이디로 실제 WeChat 검색이 되는지 확인.
5. 직원 안내(`#해외문의`에 게시):
   > 손님이 연락처를 남기면 재촉 알림이 멈추고 '오늘 연락할 손님'으로 표시됩니다. 여유 있을 때 **그 방에 한국어로 답을 쓰면 바로 아래에 번역본이 올라옵니다.** 그것을 복사해 위챗·왓츠앱·메일에 붙여 넣어 보내 주세요. 방에 답을 쓰면 목록에서 빠지고, 상담이 끝나면 방을 보관해 주세요. 문 열 때와 마감 1시간 전에 남은 손님 목록이 올라옵니다. 연락처가 없는 손님은 지금처럼 5·12·30분 알림이 옵니다.
   > 채팅창에 병원 위챗 QR과 아이디가 나갑니다. 업무폰 위챗에 친구 요청이 오면 수락하고, 손님이 보낸 코드(#로 시작)로 어느 방 손님인지 확인해 주세요.
   > 위챗 손님이 보낸 글은 위챗의 번역으로 읽을 수 있습니다: 나 → 설정 → 일반 → 번역 → "채팅에서 받은 메시지 자동 번역"을 켜거나, 메시지를 길게 눌러 "번역". 짧은 답은 입력창을 길게 눌러 "쓰면서 번역"을 써도 됩니다(업무폰에서 메뉴가 보이는지는 확인 필요).
6. 2주·4주 뒤 측정 스크립트로 G-1~G-5 확인(자동 안내 지연은 스모크 직후에도 한 번 잰다).

되돌리기: Slack 쪽은 `CHAT_FOLLOWUP=off`(재배포), 손님 화면은 커밋 되돌리기. 042는 추가형이라 그대로 둔다.

---

## 10. 하지 않는 것 / 다음 단계

**이번에 하지 않는 것**
- AI 답변 — 결정 ⑥. 다음 문서에서 "병원 이용 안내를 홈페이지 답변 중에서 골라 보여 주기"로 다룬다.
- 직원 답변을 번역해 손님 이메일로 자동 발송 — 발송 코드(Resend)는 상담 예약 폼에 있지만 운영 서버에 키가 없다. 키 등록·발신 도메인 인증·다른 기기에서 대화 이어가기 링크가 필요해 별도 단계로 둔다. **이메일만 남긴 손님을 직원 손 없이 챙기려면 이것이 필요하다**(U-4).
- 손님 글에서 메신저 ID 인식, 방 주제(topic)에 나중에 남긴 연락처 반영.
- 사이트의 다른 WeChat 버튼(하단 바, WeChat 안내 페이지, 문의 페이지) 변경 — 결정 ⑦은 채팅 카드에만 적용한다.
- 관리자 화면에서 쓴 답글의 번역본을 따로 올리기 — 방에 원문·번역이 이미 함께 올라간다.
- 위챗·왓츠앱과 채팅을 직접 연결하기(직원이 Slack에서 답하면 그 메신저로 자동 발송) — 병원 계정이 개인형이라 연동 수단이 없다. 번역본 복사로 대신한다.
- 대화 중 재발신 때 나가는 짧은 안내 변경, 세션 시작 시의 시스템 안내·노란 안내 띠 변경.
- 사이트 전역 1순위 메신저(`primaryMessengerFor`) 변경 — LINE 링크 교체(U-2) 뒤 대만·태국을 LINE으로 바꿀지 다시 본다.
- 휴진일을 관리자 화면에서 고치기, Slack 버튼(Block Kit), 연락 완료 전용 버튼.

**U-5 문구 초안 (승인 시 11개 로케일 `privacy` 5조에 반영)**
> 서비스 운영을 위해 신뢰할 수 있는 수탁업체에 업무를 위탁합니다: Supabase(데이터베이스 호스팅), Google Analytics(웹사이트 이용 분석), **OpenAI(채팅 번역, 국외 처리), Slack(상담 문의 알림 전달, 국외 처리).** 수탁업체는 서비스 제공에 필요한 범위에서만 정보를 처리합니다.

---

## 11. 구현 인계 메모 (새 세션용)

- **상태**: 설계 승인(2026-10-01). 다음은 구현 계획(`superpowers:writing-plans`, `docs/superpowers/plans/`에 저장) → 구현. 경위와 실측은 메모리 `chat-auto-reply-baseline-2026-10`에 있다.
- **작업 위치**: 워크트리 `D:\dev\LIV_homepage-slack-rooms`, 브랜치 `feature/chat-contact-first`(master `a485c64`에서 분기). 메인 폴더 `D:\dev\LIV_homepage`(master)는 다른 세션이 쓰므로 거기서 브랜치를 바꾸거나 작업하지 않는다.
- **명령**: npm은 `liv-clinic/`에서 실행한다. 이 PC는 TLS 프록시 뒤라 `npm run build`에는 `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1`, DB·Node 스크립트에는 `NODE_TLS_REJECT_UNAUTHORIZED=0`이 필요하다. 워크트리의 `node_modules`는 복사본이며 master와 `package.json` 차이가 없다.
- **검증 게이트**: `npm test` · `npx tsc --noEmit` · 변경 파일만 `npx eslint <files>`(리포 전체 lint에는 기존 오류가 있다) · `npm run verify:i18n` · `npm run build`.
- **테스트 관례**: 라우트 단위 테스트가 없다. 로직은 `src/lib/chat/*`로 빼고 `__tests__/fakeAdmin.ts`로 Supabase를 흉내 낸다(`in`·`or`·`gte` 지원을 더해야 한다). Slack 호출은 fetch 스파이로 본다.
- **기대값이 바뀌는 기존 테스트**: `contactChannels.test.ts`(채널 목록, 카드 노출 조건), `slackText.test.ts`(`ROOM_AUTO_ACK_NOTE`, `buildContactText`, 방 첫 메시지 꼬리). `autoAck.test.ts`의 짧은 안내 기대값은 유지된다.
- **메시지 JSON**: 11개 파일은 줄바꿈이 섞여 있다. 재직렬화하지 말고 `\n`만 경계로 줄을 나눠 바이트 보존 삽입한다(메모리 `liv-i18n-file-quirks`).
- **Grep 도구**: `glob`에 폴더 경로를 넣으면 이 PC에서 거짓 0건이 나온다. 폴더는 `path`로 좁힌다(메모리 `grep-glob-dir-false-negative`).
- **아직 받지 못한 값의 기본 처리**: U-1 문구는 §4.1 그대로 구현한다. U-2 LINE 링크는 현행을 유지한다(상수만 나중에 교체). U-3 휴진일은 `CHAT_CLOSED_DATES`를 비워 둔다. U-5 처리방침은 건드리지 않는다.
- **운영에 닿는 일은 원장님 승인 뒤에만 한다**: 마이그레이션 042 운영 적용, master 머지·푸시(= Netlify 배포), Netlify 환경변수 변경.
- **측정 스크립트**는 이미 있다(`liv-clinic/scripts/chat-response-baseline.mjs`). §1·§2의 수치를 낸 질의이므로 정의를 바꾸지 않는다.
- **2단계(별도 문서)**: AI 이용 안내(홈페이지 답변에서 고르기), 직원 답변 이메일 자동 발송.
