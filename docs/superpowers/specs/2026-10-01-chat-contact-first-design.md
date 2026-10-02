# 라이브채팅 "연락처 먼저" 1단계 — 자동 안내 + 연락처 받기 + 오늘 연락할 손님 (chat-contact-first)

> 작성: 2026-10-01 · 대상: 자동 안내(`liv-clinic/src/lib/chat/autoAck.ts`, `serverI18n.ts`), 연락처 카드(`components/chat/ChatCaptureBlock.tsx`, `ChatPanel.tsx`, `lib/chat/contactChannels.ts`), 연락처·메시지·세션 API(`app/api/chat/*`), 확대 알림(`escalationRunner.ts`), 영업시간(`businessHours.ts`), Slack 문구(`slackText.ts`, `slackRelay.ts`), 관리자 채팅 목록, 가격 문의 이벤트 안내(`lib/chat/priceIntent.ts`·`eventHint.ts`·`linkify.ts` 신규, `components/chat/MessageBubble.tsx`), 채널 아이콘(`components/ui/ChannelIcon.tsx` 신규, `components/layout/FloatingCTA.tsx`)
> 선행 문서: `2026-09-03-slack-patient-rooms-design.md` §4.10(자동 첫 안내)·확대 알림, `chat-offhours-messenger-bridge.design.md`(2026-08-09, 영업시간 외 연락처 카드 — 리포에 커밋되지 않고 메인 작업 폴더 `docs/02-design/features/`에만 있다). 이 문서는 그 카드의 "영업시간 외에만 노출" 규칙과 자동 안내 문구를 대체한다.
> 결정(2026-10-01, 원장님): ① 영업시간 중 헤더 "We're online" 유지 ② 손님이 이메일을 쓰면 연락처로 저장 ③ 연락처를 남긴 손님은 5·12·30분 알림을 멈추고 **"오늘 연락할 손님"**으로 분류 ④ 약속 문구는 **"오늘 안에, 최대한 빨리 연락"** ⑤ 가격·효과는 사람이 직접 답변 ⑥ 이 1단계(AI 없음)를 먼저 내고, AI 이용 안내 답변은 바로 이어서 별도 문서로.
> 추가 결정(2026-10-01, 직원 의견 검토 뒤): ⑦ 채팅 카드에 **병원 WeChat QR과 아이디를 넣는다** — WeChat은 업무폰 한 대로만 응대할 수 있지만 앱 자체 번역으로 응대가 가능하므로, 손님이 병원 WeChat을 추가하게 한다(같은 날 "추가 버튼 제거" 안을 검토했다가 이쪽으로 확정). WhatsApp·LINE은 병원 계정으로 연결하는 버튼을 유지한다 ⑧ 연락처를 남긴 손님의 방에는 **직원 답글의 번역본**을 올려, 복사해서 위챗·왓츠앱·메일에 붙여 넣게 한다.
> 추가 결정(2026-10-01, 원장님 제안): ⑨ **가격·프로모션을 물은 손님에게는 이번 달 프로모션 페이지 링크를 손님 언어로 먼저 보낸다**(이번 달 것이 없으면 이벤트 목록). 가격 답변은 계속 직원이 한다(⑤ 유지) — 링크는 직원이 확인하는 동안 손님이 먼저 볼 것을 주는 것이다(§4.10).
> 추가 결정(2026-10-01, 원장님 — 미리보기를 본 뒤): ⑩ 카드의 병원 연락 단추를 **WhatsApp·WeChat·LINE·이메일 네 개로, 아이콘과 함께 나란히** 둔다. 이메일은 병원 주소 `jaeho19@gmail.com`을 보여 준다(§4.2).
> 2026-10-02 개정: 5·12·30분 재촉 알림은 연락처와 무관하게 **모두 껐다**(원장님 결정). §4.5 (a)의 규칙(연락처가 없는 손님에게만 재촉)은 `CHAT_ESCALATION=on`으로 다시 켰을 때만 적용된다. 글자만 문구에서 "5·12·30분 알림은 울리지 않습니다"·"재촉 알림은 울리지 않습니다"를 뺐다. 하루 두 번 요약(§4.5 c)과 번역본(§4.5 d)은 그대로다.
> 상태: **원장님 승인(2026-10-01), 손님 문구도 확정.** ⑨(§4.10)·⑩(§4.2)은 같은 날 추가됐고, 원장님이 미리보기 화면(초안 2)을 본 뒤 "이대로 구현하자"고 했다. 다음은 **새 세션에서 구현 계획과 구현** — §11 인계 메모를 따른다.
> 구현(2026-10-01): 계획서 `docs/superpowers/plans/2026-10-01-chat-contact-first.md` 대로 브랜치 `feature/chat-contact-first`에 구현했다 — 테스트 58파일 878건·타입 검사·빌드·화면 확인(35개 항목) 통과. 스펙을 보완한 점은 계획서의 「스펙에서 보완한 점」 표에 있다. **운영 반영(042 적용 → master 푸시 → 스모크)은 원장님 승인 대기.**

---

## 0. 한눈에 보기 (비개발자용)

| 지금 | 바뀐 뒤 |
|------|---------|
| 영업시간 중 첫 글에 "잠시만 기다려 주세요. 곧 답변드리겠습니다"만 나간다 (실제 첫 답변은 중앙값 12분) | "답변까지 10~20분쯤 걸릴 수 있습니다. 연락처를 남겨 주시면 **오늘 안에 최대한 빨리** 연락드리겠습니다" |
| 직원 첫 답변의 절반이 "어떤 시술, 언제 오시나요?" 되묻기이고, 그 사이 손님은 떠난다 | 자동 안내가 **시술과 방문 예정일을 먼저 묻는다** |
| 자동 안내가 손님 글 뒤 약 8초(4~14초) 만에 나간다 | **3초 이내**로 앞당긴다 |
| 가격을 물으면 직원이 답할 때까지 손님이 볼 것이 없다 (가격 문의 9건 중 5건은 답까지 1시간 반~4일) | 가격을 물으면 **이번 달 프로모션 페이지 링크**를 손님 언어로 바로 보낸다(첫 글이면 접수 안내 바로 뒤에, 대화 중간에 물어도 보낸다). "가격은 직원이 확인해 안내드린다"고 함께 알린다 |
| 채팅창의 링크는 글자로만 보여 눌리지 않는다 | 직원과 자동 안내가 보낸 링크는 **눌린다**(새 창) |
| 연락처 카드는 밤·주말에만 뜬다 | 손님이 답을 기다리는 동안이면 **낮에도** 뜬다 |
| 카드에서 받는 연락처: WhatsApp·WeChat·LINE ID | WhatsApp 번호·WeChat ID·**이메일**. LINE ID는 받지 않는다 (ID 검색이 2건 모두 실패) |
| 카드의 메신저 단추는 글자뿐이고, 1순위만 크고 나머지는 작은 링크다. 이메일로 병원에 연락할 길은 없다 | **WhatsApp·WeChat·LINE·이메일 단추 네 개를 아이콘과 함께 나란히** 보여 준다. 이메일 단추는 병원 주소(`jaeho19@gmail.com`)와 복사 버튼을 보여 준다 |
| 카드의 WeChat은 버튼 하나다. 휴대폰에서는 앱 링크(안 열리는 경우가 있다), PC에서는 QR만 뜬다 | 카드에 **병원 WeChat QR과 아이디(복사 버튼)**를 함께 보여 준다. 중국어 화면에서는 펼친 채로 나온다 |
| 손님이 대화에 이메일을 써도 그냥 글자다 | **자동으로 연락처로 저장**하고 Slack 방에 알린다 |
| 직원 답글이 손님 언어로 어떻게 나갔는지는 관리자 화면에서만 보인다 | 연락처를 남긴 손님의 방에는 **번역본이 바로 아래 올라온다** — 복사해서 위챗·왓츠앱·메일에 붙여 넣는다 |
| 연락처를 남겨도 5·12·30분 재촉 알림이 계속 울린다 | 재촉 알림을 멈추고 **"오늘 연락할 손님"**으로 분류. 하루 두 번(문 열 때, 마감 1시간 전) 남은 손님 목록을 `#해외문의`에 올린다 |
| 공휴일·임시 휴진을 모른다 (추석 낮에도 "곧 답변드리겠습니다") | **휴진일을 등록**하면 그날은 "상담 시간 아님" 안내, 알림 없음 |

비용 0원, Slack 앱 재설치 없음, AI 호출 없음. 직원이 Slack에서 답하는 방법은 그대로다.

### 0.1 원장님이 확인·제공하실 것

| # | 항목 | 설명 |
|---|------|------|
| U-1 | ~~손님 문구 확인~~ **확정(2026-10-01)** | §4.1 한국어 원문 12문장 + §4.10 이벤트 안내 2문장 + 카드 문구(§7). 원장님이 미리보기 화면(§11)에서 상황·언어별로 확인하고 그대로 진행하기로 했다. 일본어·간체·번체는 미리보기에 넣은 문장(부록 A)을 그대로 쓰고, 나머지 6개 언어는 영어 기준문에서 옮긴다 |
| U-2 | ~~병원 LINE 친구 추가 링크~~ **받음(2026-10-01)** | `https://line.me/ti/p/VJYu9BSnsX` — 아이디 검색을 거치지 않는 주소(열어 보면 친구 추가 화면이 뜬다). `fix/wechat-qr-latest`(435869d)에서 `SOCIAL_LINKS.line`을 바꿔 사이트의 모든 LINE 버튼에 적용했고 이 브랜치에도 병합돼 있다. 같은 날 받은 LINE QR 이미지는 예전 아이디 방식 주소라 쓰지 않는다 |
| U-3 | **올해 남은 휴진일** | 날짜 목록(예: 10/3, 10/9, 12/25). 없으면 빈 채로 나가고 지금처럼 동작한다 |
| U-4 | **이메일만 남긴 손님은 직원이 직접 메일을 보내야 한다** | 1단계에는 메일 자동 발송이 없다. 방에 한국어로 답을 쓰면 번역본이 올라오므로(§4.5 d) 그것을 복사해 메일에 붙이면 된다. 자동 발송은 다음 단계 후보다(§10) |
| U-5 | **개인정보 처리방침에 OpenAI·Slack 추가 여부** | 지금 위탁 업체 목록에 Supabase·Google Analytics만 있다. 넣으려면 문구 초안(§10)을 승인해 주시면 함께 반영한다 |
| U-6 | ~~병원 WeChat QR 원본 이미지~~ **받음(2026-10-01)** | 원본 화면에서 QR만 잘라 `liv-clinic/public/images/wechat-qr-code.png`(660×660, 흑백)로 넣었다. 읽어 보면 `https://u.wechat.com/kH7fonYYvwh851jK2Y2nsfo?s=2`이고 160px로 줄여도 읽힌다 |
| U-7 | ~~사이트의 위챗 포스터 QR 확인~~ **끝남(2026-10-01)** | 원장님 확인: 받은 QR이 최신이고, 사이트 포스터(`wechat-qr.png`, 주소 `https://u.wechat.com/kL9gQH6GOesxNpNB-SWRDko`)는 예전 QR이다. 브랜치 `fix/wechat-qr-latest`(8646dfc)에서 `/zh/wechat` 페이지와 QR 크게 보기 화면을 새 QR로 바꾸고 포스터를 지웠다(테스트 633건·타입 검사·빌드 통과, 화면 확인). 이 설계 브랜치에도 병합돼 있다. **운영 반영(master 푸시)은 원장님 승인 대기** — 1단계보다 먼저 따로 내보낼 수 있다. 같은 브랜치에 LINE 링크 교체(U-2, 435869d)도 들어 있다 |
| U-8 | **매달 프로모션은 관리자 화면의 「매달 프로모션」으로 등록** | 그렇게 만든 이벤트는 주소가 `2026-11-promotion` 꼴이 되고, 가격을 물은 손님에게 그 페이지로 바로 가는 링크가 나간다(§4.10). 다른 방법으로 만들었거나 아직 게시 전이면 이벤트 목록 링크가 나간다 — 고장은 아니고 손님이 한 번 더 눌러야 할 뿐이다. 8·9·10월 프로모션은 이미 이 꼴이다 |
| U-9 | **채팅 카드의 병원 이메일은 `jaeho19@gmail.com`** (원장님 지정, 2026-10-01) | 이 메일함은 원장님만 볼 수 있다. 손님이 그 주소로 메일을 보내면 Slack 방에 "병원 이메일 주소를 확인했습니다" 알림이 오지만 직원은 메일을 볼 수 없으므로, 원장님이 직접 답하거나 메일 내용을 방에 전달해야 한다. 사이트의 다른 곳(푸터·문의 페이지)은 `info@livps.co.kr` 그대로다 — 그쪽도 바꾸려면 따로 알려 주시면 된다 |

코드에 이미 있어 따로 받을 필요가 없는 값: WeChat ID `livps0414`, WhatsApp `+82 10-6888-2773`, LINE ID `icps7972773`, 이메일 `info@livps.co.kr`, 전화 `02-797-2773`(모두 `constants.ts`). 바뀐 것이 있을 때만 알려 주시면 된다.

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
- **가격·프로모션을 물은 손님은 25건 중 9건**이다(첫 글 6건, 대화 중간 3건). 그 질문에 직원이 처음 답하기까지 중앙값 95분이고, 5건은 1시간 35분~4일이 걸렸다(대부분 상담 시간 밖 문의).
- 직원도 가격 질문에 **이벤트 내용으로** 답한다(3건). 10/1 대만 손님에게는 울쎄라 600샷을 275만 원으로 답했다가 44분 뒤 이벤트 가격 220만 원으로 다시 보냈다.

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
| G-6 | 가격·프로모션을 물은 손님이 첫 정보를 받기까지 | 직원 첫 답변까지 **중앙값 95분** (9건) | 이벤트 링크 **3초 이내** (§4.10). 직원이 10분 안에 답하던 대화는 대상이 아니다 |

측정은 `liv-clinic/scripts/chat-response-baseline.mjs`(읽기 전용, 이 문서와 함께 커밋됨)로 배포 2주·4주 뒤에 한다. G-6은 구현 때 스크립트에 더하는 항목 9로 센다(§4.10). 시험 세션 판정: 이름에 `test`·`테스트`·`smoke`가 있거나 첫 글이 3자 이하·한글.

---

## 3. 범위

**In Scope**
- 자동 안내를 "접수 안내"(예상 시간 + 연락처 요청 + 되묻기)로 교체 — 영업 중 / 마감 임박 / 상담 시간 외, 연락처 있음 / 없음
- 자동 안내 발송 시점 앞당기기 (번역·Slack 릴레이를 기다리지 않고 손님 글 저장 직후)
- 연락처 카드: 영업시간 중에도 노출, 이메일 채널 추가, LINE ID 수집 중단, 병원 WeChat QR·아이디 표시, 메신저 버튼을 눌러도 카드를 닫지 않음, 병원 연락 단추 네 개(WhatsApp·WeChat·LINE·이메일)를 아이콘과 함께 나란히
- 손님 글 속 이메일 자동 인식 → 연락처 저장
- 가격·프로모션을 물은 손님에게 이벤트 안내(이번 달 프로모션 링크) 자동 발송, 채팅 말풍선의 링크를 눌리게 (§4.10)
- 연락처를 남긴 손님: 확대 알림 제외 + Slack 분류 표시 + 하루 두 번 요약 + 직원 답글 번역본을 방에 올리기
- 휴진일(`CHAT_CLOSED_DATES`)
- 관리자 채팅 목록에 "오늘 연락" 표시
- 마이그레이션 042 (컬럼 3개, 추가형)
- 측정 스크립트 (작성 완료 — 구현 뒤 메신저 버튼 집계가 맞게 나오는지 확인하고, 이벤트 안내 항목 9를 더한다)

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

한국어 원문 (U-1 — 확정):

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
3. 자동 안내 시작 — 기다리지 않는다     ← 번역·Slack과 무관. 가격 문의면 이어서 이벤트 안내(§4.10)
4. 번역 → UPDATE → broadcast → 응답
5. after: Promise.all([ Slack 릴레이(→ 연락처 알림), 3의 Promise ]) → 이벤트 안내가 나갔으면 방에 한 줄(§4.10)
```

자동 안내는 번역도 Slack도 쓰지 않으므로 3에서 바로 나간다(DB 왕복 3~4회). 5에서 그 Promise를 기다려 함수가 끝나기 전에 완료를 보장한다. `sendAutoAckIfDue`는 throw하지 않는다. 직원 알림 시점은 바뀌지 않는다. 손님 화면은 자동 안내 broadcast를 받으면 메시지를 다시 가져오므로 손님 자신의 글과 자동 안내가 함께 보이고, 뒤이어 오는 응답은 id로 중복 제거된다(현행 `appendOptimistic`).

**구현 단위**
- 새 파일 `lib/chat/visitorMessageFollowups.ts`(라우트 테스트가 없는 리포라 로직을 lib로 뺀다):
  - `startEarlyFollowups(admin, session, text)` — 2를 끝까지 하고 3을 시작해 `{ contact, ackPromise }`를 돌려준다. `ackPromise`는 자동 안내에 이어 이벤트 안내(§4.10)까지 끝낸 뒤 `{ ack, eventHintUrl }`로 풀린다.
  - `runVisitorMessageFollowups({ relayArgs, contact, ackPromise })` — 5. Slack 쪽은 손님 글 릴레이 → (이메일이 저장됐으면) 연락처 알림을 순차로. 릴레이와 `ackPromise`가 모두 끝난 뒤 `eventHintUrl`이 있으면 이벤트 안내 알림(§4.10)을 보낸다.
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
| 병원으로 바로 연락하기 | 안내 한 줄(신규 `captureChannelsLead`) + **같은 크기의 단추 네 개: WhatsApp · WeChat · LINE · 이메일. 단추마다 아이콘 + 이름**(아래). 그 로케일의 1순위 메신저가 맨 앞, 이메일은 맨 뒤. WhatsApp·LINE은 병원 계정을 여는 단추, **WeChat은 병원 QR·아이디 블록**, **이메일은 병원 주소 블록**을 카드 안에 펼친다. 그 아래에 참조 코드 안내(`captureCodeInstruction`, 현행) | **이메일 단추 추가, 아이콘 추가, 네 단추를 나란히**(지금은 1순위만 큰 글자 단추이고 나머지는 작은 링크다 — 결정 ⑩). **단추를 눌러도 카드를 닫지 않는다.** WhatsApp·LINE을 누르면 그 아래에 `captureMessengerFallback` 한 줄이 나타난다. 누른 것은 서버에 알린다(§4.4) |
| 연락처 남기기 | 칩 `[WhatsApp] [WeChat] [Email]`(아이콘 포함) + 입력 1칸 + 저장 | **이메일 추가, LINE 칩 제거.** 기본 선택: `zh` → WeChat, `ja` → Email, 그 외 → WhatsApp |
| 개인정보 한 줄 | 신규 `capturePrivacyNote` | 신규 |

- **아이콘** (결정 ⑩ — 글자만 있는 단추보다 한눈에 알아보게)
  - WhatsApp·LINE은 `FloatingCTA.tsx`에 이미 있는 SVG, WeChat은 `/images/wechat-icon.png`(사이트 오른쪽 단추가 쓰는 그림), 이메일은 봉투 모양 SVG(신규)를 쓴다.
  - 새 파일 `components/ui/ChannelIcon.tsx`에 네 아이콘을 모은다(`<ChannelIcon channel="whatsapp" className="…" />`). `FloatingCTA`는 SVG를 이 파일에서 가져다 쓰도록만 바꾼다 — 같은 그림을 두 군데에 두지 않기 위해서이고, 모양은 달라지지 않는다.
  - 단추 이름은 번역하지 않는다(`WhatsApp`·`WeChat`·`LINE`·`Email`). 아이콘은 꾸밈이므로 `aria-hidden`이고, 단추의 이름이 접근성 이름이다.
- **이메일은 병원 주소를 보여 준다** (결정 ⑩)
  - 블록 내용: 주소 `jaeho19@gmail.com` + **복사 버튼**, 안내 한 줄(신규 `captureEmailLead` — 이 주소로 메일을 보낼 때 참조 코드를 적어 달라는 내용).
  - 주소를 누르면 메일 앱이 열린다(`mailto:` — 제목 `LIV Plastic Surgery #코드`, 본문은 기존 `whatsappPrefillChat` 문구). 메일 앱이 없는 PC에서는 아무 일도 일어나지 않을 수 있으므로 복사 버튼이 기본 길이다.
  - 주소는 `constants.ts`의 새 상수 `CHAT_CONTACT_EMAIL`로 둔다(원장님 지정, 2026-10-01 — U-9). **채팅 카드 전용이다.** 푸터·문의 페이지·검색엔진용 정보가 쓰는 `SITE_INFO.email`(`info@livps.co.kr`)은 바꾸지 않는다.
  - 복사하거나 주소를 누르면 서버에 `click`(email)을 알린다(§4.4) → 방에 한 줄. 블록이 보이기만 한 것은 알리지 않는다.
  - 손님이 자기 이메일을 남기는 길("연락처 남기기"의 Email 칩, 글 속 이메일 인식)은 따로 그대로 있다. 단추는 **병원 주소**, 칩은 **손님 주소**다.

- **WeChat은 병원 QR과 아이디를 보여 준다** (결정 ⑦)
  - 블록 내용: **QR만 담은 정사각형 이미지**, `WeChat ID: livps0414` + **복사 버튼**, 안내 한 줄(`captureWechatLead` — QR을 스캔하거나 아이디를 검색해 추가한 뒤 참조 코드를 보내 달라는 내용).
  - QR 이미지: **`/images/wechat-qr-code.png`**(원장님이 준 WeChat 원본 화면에서 QR만 자른 것 — U-6). 코드에서는 `constants.ts`의 `WECHAT_QR_IMAGE`로 쓴다. 예전 포스터 `wechat-qr.png`는 옛 QR이라 지웠다(U-7). 실제 스캔 확인은 다른 기기의 WeChat으로 한다(§9).
  - `zh`는 1순위가 WeChat이므로 이 블록을 **펼친 채로** 보여 준다. 다른 로케일은 WeChat 단추를 누르면 같은 블록이 카드 안에 펼쳐진다. 이메일 블록과는 한 번에 하나만 펼친다.
  - 휴대폰·PC 모두 같은 블록이다. 지금 휴대폰에서 쓰는 앱 링크(`weixin://dl/chat?…`)는 카드에서 쓰지 않는다 — 자기 화면의 QR은 스캔할 수 없으므로 휴대폰 손님은 **아이디 복사 → WeChat에서 검색**이 확실한 길이다. QR을 누르면 `WeChatQRModal`로 크게 본다(저장하거나 다른 기기로 스캔). 이 모달은 이미 새 QR과 아이디를 보여 준다(8646dfc) — 카드에서 그대로 쓰면 된다.
  - 아이디 복사 또는 QR 확대를 누르면 서버에 `click`(wechat)을 알린다(§4.4) → 방에 한 줄. 블록이 보이기만 한 것은 알리지 않는다.
  - 병원 아이디는 `constants.ts`의 `WECHAT_ID`를 쓴다(8646dfc에서 추가, `WeChatInfo.tsx`·`WeChatQRModal.tsx`가 이미 쓰고 있다).
  - 직원 쪽: 친구 요청과 메시지는 업무폰 WeChat으로 온다. 앱의 번역(받은 글 자동 번역, 쓰면서 번역)으로 응대하고, 긴 답은 방에 써서 올라온 번역본을 붙여 넣는다(§4.5 d, §9 직원 안내).
  - "WeChat ID 남기기"(연락처 남기기의 WeChat 칩)는 그대로 둔다 — 손님이 원하면 직원이 추가하는 길도 남긴다.

- 메신저 버튼을 누른 뒤에도 카드를 남기는 이유: 지금은 버튼을 누르는 순간 카드가 닫힌다. 8/19 손님은 LINE 버튼이 실패한 뒤 대화창에 직접 "LINE이 안 된다"와 이메일을 적어야 했다.
- 저장에 성공하면 카드는 사라진다(`hasContact = true`). 확인은 대화창의 시스템 메시지가 한다(§4.4) — 카드 안의 초록색 "Saved!" 상태는 없앤다.
- **LINE**: 직원이 손님 LINE ID를 찾지 못하므로 ID를 받지 않는다. LINE은 손님이 병원을 추가하는 버튼으로만 남는다. 버튼의 주소(`SOCIAL_LINKS.line`)는 아이디 검색을 거치지 않는 친구 추가 링크로 이미 바꿨다(U-2, 435869d) — 카드에서는 지금처럼 `LINE_LINK`를 쓰면 된다.
- `contactChannels.ts`: `CONTACT_CHANNELS`를 `CLINIC_LINK_CHANNELS = ['whatsapp','wechat','line','email']`(병원으로 바로 연락하기)과 `CONTACT_FORM_CHANNELS = ['whatsapp','wechat','email']`(남기기)로 나눈다. `validateContactHandle`에 `email` 분기, `defaultFormChannel(locale)`, `orderedLinkChannels(locale)`(1순위 메신저를 맨 앞으로, 이메일은 맨 뒤 — 지금 `ChatCaptureBlock` 안의 `orderedChannels`를 옮긴 것) 추가. `primaryMessengerFor`(사이트 전역)는 바꾸지 않는다.

### 4.3 손님 글 속 이메일 자동 인식

`POST /api/chat/messages` 손님 경로에서, 손님 글을 INSERT한 **직후(번역 전)** 처리한다(§4.1의 순서 2). 원문만 보면 되고, 자동 안내가 결과를 써야 하기 때문이다.

1. `extractEmail(text)`(순수, `contactChannels.ts`): 첫 이메일 형태 문자열 1개. 병원 자체 도메인(`livps.co.kr`, `liv-clinic.net`)과 **카드에 보여 주는 병원 주소(`CHAT_CONTACT_EMAIL`)**는 제외 — 손님이 "이 주소로 메일 보냈어요"라고 병원 주소를 적어도 손님 연락처로 저장되지 않게. 254자 초과는 무시.
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
| `click` | `whatsapp` · `wechat` · `line` · `email` | `visitor_messenger_clicked`에 채널 기록 + Slack 방에 한 줄. `handle` 없음. 연락처로 치지 않는다. WeChat은 아이디 복사·QR 확대가, 이메일은 주소 복사·주소 누르기가 클릭이다(§4.2) |

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
- 메신저 버튼 클릭 시 방에: `📲 손님이 WhatsApp으로 이어가기를 눌렀습니다 — 병원 WhatsApp에서 코드 #A1B2C3D4 가 담긴 메시지를 확인해 주세요. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다.` (LINE도 같은 형식). WeChat은 `📲 손님이 병원 WeChat 아이디·QR을 확인했습니다 — 업무폰 WeChat에서 친구 요청과 코드 #A1B2C3D4 메시지를 확인해 주세요. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다.` 이메일은 `📲 손님이 병원 이메일 주소를 확인했습니다 — jaeho19@gmail.com 메일함에서 코드 #A1B2C3D4 가 담긴 메일을 확인해 주세요. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다.`(주소는 `CHAT_CONTACT_EMAIL`)

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
| (병원 이메일 주소 확인) | 병원 메일함(`jaeho19@gmail.com`)에 온 손님 메일에 답장으로. 이 메일함은 원장님만 볼 수 있다 — 원장님이 직접 답하거나 메일 내용을 방에 전달한다(U-9) |

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
| 신규 `buildMessengerClickText` | §4.5 (b) — WhatsApp·LINE·WeChat·이메일 |
| 신규 `buildFollowupDigestText` | §4.5 (c) |
| 신규 `buildTranslationCopyText` | §4.5 (d) — 번역문만, Slack 이스케이프 |
| 신규 `buildEventHintNote` | §4.10 — 손님에게 이벤트 링크가 나갔다는 한 줄 + 링크 |

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
| 이번 달 프로모션이 아직 게시 전이거나 「매달 프로모션」으로 만들지 않았다 | 이벤트 목록 링크를 보낸다(§4.10) |
| 이번 달 프로모션 조회가 실패 | 이벤트 목록 링크를 보낸다 — 안내 자체는 나간다 |
| 가격 낱말은 있지만 가격 질문이 아니다 | 이벤트 링크가 한 번 나갈 뿐이다. 직원 답변·알림에는 영향이 없다 |
| 낱말 없이 돌려 말한 가격 질문 | 이벤트 안내는 나가지 않고 접수 안내만 나간다(지금과 같다). 뜻으로 판정하는 것은 2단계 |
| 직원이 10분 안에 답한 대화에서 가격을 물음 | 이벤트 안내를 보내지 않는다 — 직원이 바로 답한다 |
| 손님이 이벤트 링크를 눌러 다른 화면으로 감 | 새 창으로 열린다. 그 화면에도 채팅 버튼과 미확인 표시가 있어 직원 답이 오면 알 수 있다 |
| 042 적용 전에 코드가 먼저 배포됨 (이벤트 안내) | 선점 UPDATE가 실패해 이벤트 안내가 나가지 않는다(경고만). 접수 안내와 릴레이는 정상이다 — `event_hint_at`은 자동 안내의 세션 조회에 넣지 않는다 |

### 4.10 가격 문의에 이벤트 안내 (결정 ⑨)

가격을 물은 손님은 직원이 확인해 답할 때까지 볼 것이 없다(§1 — 9건 중 5건은 1시간 반 넘게 기다렸다). 직원도 결국 이벤트 내용으로 답한다. 그래서 **가격은 직원이 답한다는 원칙(⑤)은 그대로 두고**, 그 전에 손님 언어의 프로모션 페이지 링크를 먼저 보낸다. AI는 쓰지 않는다 — 낱말로 판정하고, 문장은 미리 써 둔다.

**언제 보내는가** — 손님 글마다 아래를 모두 만족할 때. 접수 안내(§4.1)와 조건이 따로라서 **첫 글이 아니어도** 나간다(대화 중간에 가격을 물은 3건).

```
손님 글에 가격·프로모션 낱말이 있다                                      (looksLikePriceQuestion — 아래)
AND CHAT_EVENT_HINT ≠ off
AND 이 세션에 이벤트 안내를 보낸 적이 없거나, 마지막이 12시간보다 오래됨   (event_hint_at)
AND 최근 10분 안에 직원 글(자동 안내 제외)이 없다
```

- 12시간은 접수 안내(§4.1)와, 10분은 연락처 카드(§4.2)와 같은 기준이다. 직원이 지금 답하고 있는 대화에는 끼어들지 않는다 — 그때는 직원이 바로 답한다.
- 영업시간과 무관하다. 답을 가장 오래 기다리는 것은 상담 시간 밖 문의다.

**낱말 판정** — 새 파일 `lib/chat/priceIntent.ts`의 `looksLikePriceQuestion(text): boolean`(순수).

1. 5% 직접 예약 배너가 입력창에 넣어 주는 문장(`chat.promoDraft`, 11개 언어)을 글에서 먼저 지운다. 그 문장에는 "할인·優惠·割引" 같은 낱말이 들어 있지만 손님이 쓴 가격 질문이 아니다(25건 중 5건이 이 문장으로 시작했다). 문장은 이 파일에 상수로 두고, 테스트가 메시지 JSON의 값과 같은지 확인한다.
2. 남은 글에서 아래 낱말을 찾는다. **손님 화면 언어와 상관없이 전체 목록을 본다** — 중국어 화면에서 영어·한국어로 쓴 손님이 있었다.

| 묶음 | 판정 | 낱말 |
|------|------|------|
| 띄어 쓰는 언어 | 낱말 단위(앞뒤가 글자·숫자가 아님 — `(?<![\p{L}\p{N}])…(?![\p{L}\p{N}])`), 대소문자 무시 | 영어 `price` `prices` `priced` `pricing` `cost` `costs` `how much` `fee` `fees` `quote` `quotation` `promotion` `promotions` `promo` `discount` `discounts` `event` `events` · 프랑스어 `prix` `tarif` `tarifs` `coût` `coûte` `réduction` `remise` · 베트남어 `giá` `bao nhiêu tiền` `chi phí` `khuyến mãi` `ưu đãi` · 러시아어 `цена` `цены` `цену` `цене` `ценах` `стоимость` `стоимости` `сколько стоит` `скидка` `скидки` `скидку` `акция` `акции` `прайс` · 몽골어 `үнэ` `үнийн` `үнэтэй` `хямдрал` `урамшуулал` |
| 붙여 쓰는 언어 | 글에 들어 있으면 | 중국어(간체·번체) `价格` `價格` `价钱` `價錢` `多少钱` `多少錢` `价目` `價目` `费用` `費用` `总价` `總價` `报价` `報價` `价位` `價位` `收费` `收費` `优惠` `優惠` `折扣` `促销` `促銷` · 일본어 `価格` `料金` `値段` `金額` `費用` `いくら` `キャンペーン` `割引` `プロモーション` `イベント` · 한국어 `가격` `비용` `금액` `할인` `이벤트` `프로모션` `얼마예요` `얼마에요` `얼마인가요` `얼마입니까` `얼마죠` · 태국어 `ราคา` `กี่บาท` `ค่าใช้จ่าย` `โปรโมชั่น` `โปรโมชัน` `ส่วนลด` · 아랍어 `سعر` `أسعار` `اسعار` `بكم` `تكلفة` `خصم` `عروض` |

- 일부러 넣지 않은 낱말: `offer`("Do you offer Sculptra?"), `活动`("움직임"으로도 쓴다), `rate`, `deal`, `عرض`("폭·표시"), 그리고 "얼마나 걸리나요"처럼 **시간을 묻는 말에도 쓰이는** `얼마` · `combien` · `bao nhiêu` · `เท่าไหร่`(가격을 묻는 꼴만 넣었다). 영어 `how much`는 "how much downtime"에도 걸리지만 영어 가격 질문의 가장 흔한 꼴이라 넣는다.
- 지난 문의에 대입한 결과(2026-10-01, 손님 글 58개): 글 12개·세션 9건이 걸렸고, 읽어서 분류한 가격·프로모션 세션 9건과 일치한다. 잘못 걸린 글은 없고, 배너 문장 11개는 하나도 걸리지 않는다. 문의가 영어·중국어·일본어뿐이었으므로 다른 언어의 낱말은 대입해 보지 못했다.
- 낱말이 걸렸지만 가격 질문이 아니면 이벤트 링크가 한 번 나갈 뿐이다. 낱말 없이 돌려 말한 가격 질문은 놓친다 — 그 손님은 접수 안내만 받는다(지금과 같다). 뜻으로 판정하는 것은 2단계(AI)에서 다룬다.

**무엇을 보내는가** — 문장 + 줄바꿈 + 링크. 말풍선 하나. 문장은 링크가 어디로 가느냐에 따라 둘 중 하나다.

| 키 | 쓰이는 때 | 한국어 원문 (U-1 — 확정) | 영어 기준문 |
|----|-----------|------------------------------|-------------|
| `P_promo` | 이번 달 프로모션으로 갈 때 | 가격은 상담 직원이 확인한 뒤 정확히 안내드리겠습니다. 이번 달 프로모션은 아래에서 보실 수 있습니다. | Our consultants will confirm the exact price and get back to you. You can see this month's promotion here: |
| `P_list` | 이벤트 목록으로 갈 때 | 가격은 상담 직원이 확인한 뒤 정확히 안내드리겠습니다. 진행 중인 이벤트는 아래에서 보실 수 있습니다. | Our consultants will confirm the exact price and get back to you. You can see our current promotions here: |

다른 9개 언어는 영어 기준문의 뜻을 그대로 옮긴다. 문장에는 가격·할인율·효과를 넣지 않는다 — 그런 내용은 링크한 페이지에만 있다. "기다리시는 동안" 같은 말은 원장님 의견으로 뺐다(2026-10-01).

**링크** — `eventHintUrl(locale, promotionSlug)`(순수):

| 경우 | 링크 |
|------|------|
| 이번 달 프로모션이 게시돼 있다 | `{SITE_URL}/{locale}/events/{YYYY}-{MM}-promotion` |
| 없다 · 조회 실패 | `{SITE_URL}/{locale}/events` (이벤트 목록) |

- **이번 달 프로모션** = `events`에서 `slug = '{YYYY}-{MM}-promotion'`(한국 시각의 연·월) AND `is_published = true` AND `end_date >= 오늘(한국 날짜)`인 행. 관리자 화면의 「매달 프로모션」 템플릿(`monthlyPromotionTemplate.ts`)이 이 주소를 만든다 — 8·9·10월 프로모션이 모두 이 꼴이다(U-8).
- 주소로 찾는 이유: "진행 중인 이벤트"로 찾으면 런칭 이벤트·상시 이벤트(종료일 2099년)와 섞이고, 다음 달 프로모션이 미리 시작된 날(10월 것은 9/28 시작)에는 둘이 겹친다. 주소는 그런 날에도 하나로 정해진다.
- 상세 페이지는 손님 언어의 포스터를 고른다(영어·일본어·중국어 포스터 컬럼. 번체는 중국어 → 영어, 그 밖의 언어는 영어 순으로 대신한다 — 기존 `pickLocalized`). 운영 사이트에서 확인했다(2026-10-01): `/{locale}/events/2026-10-promotion`이 10개 로케일 모두 열리고, 영어·일본어·중국어는 각자의 제목과 포스터, 번체는 중국어판, 나머지 6개 언어는 영어판이 나온다.
- 달이 바뀌면 손댈 것이 없다. 주소의 연·월을 발송 시각(한국 시각)으로 만들기 때문에 11월 1일 0시부터는 `2026-11-promotion`을 찾는다. 그 달 것이 아직 게시 전이면 목록으로 가고, 게시하는 순간부터 그 페이지로 간다.
- `SITE_URL`은 `lib/siteEnvironment.ts`의 값이다.

**저장 형태** — 자동 안내와 같다: `sender='operator'`, `source='auto'`, `sender_label='자동 안내'`, `original_text` = 한국어 문장 + 링크, `translated_text` = 손님 언어 문장 + 링크, 번역 API 호출 없음. `source='auto'`이므로 대기 시계·미응답 수·확대 알림·"오늘 연락할 손님"을 건드리지 않는다 — 가격은 여전히 직원이 답해야 하기 때문이다.

**순서와 선점**
- 같은 글에서 접수 안내(또는 짧은 안내)가 나가면 이벤트 안내는 그 **뒤에** INSERT한다 — 손님 화면에서 손님 글 → 안내 → 이벤트 안내 순으로 보인다. §4.1 순서 3의 Promise가 `sendAutoAckIfDue` 다음에 `sendEventHintIfDue`를 잇는다. 번역·Slack을 기다리지 않는 것도 같다.
- `event_hint_at`을 조건부 UPDATE(읽은 값이 그대로일 때만 1행 — `auto_ack_at`과 같은 방식)로 선점한 뒤 보낸다. 손님이 가격을 연달아 물어도 한 번만 나간다.
- `event_hint_at`은 **별도 조회**로 읽는다. 자동 안내의 세션 조회에 넣으면 042 적용 전 배포에서 자동 안내까지 깨진다(§4.5 (d)에서 `RELAY_SESSION_COLUMNS`를 건드리지 않는 것과 같은 이유).

**직원에게 알림** — 이벤트 안내가 나갔으면, 손님 글 릴레이가 끝난 뒤 그 세션의 방(스레드 모드면 스레드)에 올린다:

```
🎁 _가격 문의로 보여 손님에게 이벤트 링크를 자동으로 보냈습니다. 가격은 직접 답해 주세요._
https://liv-clinic.net/en/events/2026-10-promotion
```

- 직원이 손님이 무엇을 보고 있는지 알고 답하게 하기 위해서다. 10/1에는 275만 원으로 답했다가 이벤트 가격 220만 원으로 다시 보낸 일이 있었다(§1).
- 방도 스레드도 없으면 올리지 않는다. 봇이 쓴 글이라 손님에게 되돌아가지 않는다(§4.7). 실패는 경고 로그만 남긴다.
- 문구는 `slackText.ts`의 `buildEventHintNote(url)`, 게시는 `slackRelay.ts`의 `relayEventHintNoteToSlack({ sessionId, url })` — `relayContactToSlack`과 같은 방식으로 대상을 찾는다.

**링크를 눌리게** — 지금 손님 화면의 말풍선은 글자만 그린다(`MessageBubble.tsx`).
- 새 파일 `lib/chat/linkify.ts`의 `splitLinks(text): Array<{ kind: 'text' | 'link'; value: string }>`(순수): `http://`·`https://`로 시작하는 주소만 링크로 가른다. 주소 끝의 문장부호(`. , ; : ! ? ) ]`와 `。 、 ， ！ ？ ）`)는 링크에서 뺀다.
- `MessageBubble`은 **직원·자동 안내 말풍선**(본문과 "원문 보기")에서 링크 조각을 `<a target="_blank" rel="noopener noreferrer">`(밑줄)로 그린다. 손님 자신의 글과 시스템 메시지(노란 띠)는 그대로 글자다.
- 직원이 Slack이나 관리자 화면에서 붙여 넣은 주소도 같이 눌리게 된다.
- 새 창으로 여는 이유: 대화가 있던 화면을 그대로 두기 위해서다. 새로 열린 화면도 같은 사이트라 채팅 버튼과 미확인 표시가 그대로 있고(세션은 브라우저에 저장된다), 직원 답이 오면 그 화면에서도 알림이 뜬다.
- 관리자 화면의 대화 보기는 바꾸지 않는다.

**긴급 정지** — 환경변수 `CHAT_EVENT_HINT=off`면 이벤트 안내를 보내지 않는다(낱말 판정도 조회도 하지 않는다). 링크 누르기는 그대로다.

**구현 단위**
- `lib/chat/priceIntent.ts`(신규, 순수): `looksLikePriceQuestion`, 낱말 목록, 배너 문장 상수.
- `lib/chat/eventHint.ts`(신규):
  - 순수: `currentPromotionSlug(now)`(한국 시각 기준 `YYYY-MM-promotion`), `eventHintUrl(locale, slug | null)`, `shouldSendEventHint({ eventHintAt, lastStaffAt }, now)`.
  - `sendEventHintIfDue(admin, sessionId, text, now): Promise<{ outcome: 'sent' | 'not_due' | 'lost_race' | 'error'; url?: string }>` — throw하지 않는다. 낱말이 없거나 정지 상태면 DB를 건드리지 않고 돌아온다. 순서: 조회 3개를 함께(세션의 `visitor_locale, event_hint_at` · 마지막 직원 글 시각 — `sender='operator'`이고 `source`가 `app`·`slack` · 이번 달 프로모션) → 판정 → 선점 → INSERT → broadcast.
- `serverI18n.ts`: `EVENT_HINT_TEXTS`(10개 로케일 × `P_promo`·`P_list`) + 한국어 원문, `composeEventHintTexts(locale, kind, url): { ko, localized }`(순수, `kind`는 `'promotion' | 'list'` — 링크가 프로모션 상세면 `P_promo`, 목록이면 `P_list`).
- `visitorMessageFollowups.ts`(§4.1): `ackPromise`가 `sendAutoAckIfDue` → `sendEventHintIfDue`를 차례로 돌고 `{ ack, eventHintUrl }`로 풀린다. `runVisitorMessageFollowups`는 손님 글 릴레이와 그 Promise가 모두 끝난 뒤 `eventHintUrl`이 있으면 `relayEventHintNoteToSlack`을 부른다.
- `components/chat/MessageBubble.tsx`, `lib/chat/linkify.ts`(신규).
- 측정 스크립트 `chat-response-baseline.mjs`에 항목 9를 **더한다**(기존 항목의 정의는 건드리지 않는다): 이벤트 안내가 나간 세션 수, 손님 글에서 안내까지 걸린 초(G-6), 그중 연락 수단을 확보한 세션 수. `event_hint_at` 컬럼이 없으면(042 적용 전) 건너뛴다 — `visitor_messenger_clicked`를 다루는 방식과 같다.

---

## 5. 데이터 모델 — 마이그레이션 042 (추가형·멱등)

```sql
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

트리거·인덱스·정책·publication 변경 없음. 이메일은 기존 `visitor_email`을 쓴다. 이벤트 안내 메시지는 기존 `source='auto'`를 쓰므로 `chat_messages`의 CHECK도 그대로다.

---

## 6. 환경변수

| 변수 | 상태 |
|------|------|
| `CHAT_CLOSED_DATES` | 신설, 선택. 비면 현행과 같다 |
| `CHAT_FOLLOWUP` | 신설, 선택. `off`일 때만 의미(§4.5 긴급 정지) |
| `CHAT_EVENT_HINT` | 신설, 선택. `off`일 때만 의미(§4.10 긴급 정지) |
| `CHAT_BUSINESS_HOURS_JSON`, `CHAT_ESCALATION_MINUTES`, `SLACK_*`, `CHAT_OPS_SECRET` | 그대로 |

루트 `.env.example`에 세 변수를 적는다.

---

## 7. i18n

| 위치 | 변경 |
|------|------|
| `serverI18n.ts` | `INTAKE_FRAGMENTS` 10개 로케일 × 12키 + 한국어 원문, `CONTACT_SAVED_TEMPLATES` 10개 문구 교체, `EVENT_HINT_TEXTS` 10개 로케일 × 2문장 + 한국어 원문(§4.10 — 메시지 JSON은 바꾸지 않는다) |
| `src/messages/*.json` 11개 (`chat` 네임스페이스) | 신규 키 10개: `captureBusyLead`, `captureChannelsLead`, `captureContactPlaceholderEmail`, `captureMessengerFallback`(`{code}` 변수), `capturePrivacyNote`, `captureWechatLead`(`{code}` 변수), `captureWechatIdLabel`, `captureEmailLead`(`{code}` 변수), `captureCopy`, `captureCopied`. 기존 값은 바꾸지 않는다 |

- 메시지 JSON은 줄바꿈이 섞여 있어 다시 직렬화하면 안 된다. 기존 `chat` 키 줄 뒤에 **바이트 보존 삽입**으로 넣고, `JSON.parse` 무결성 + `npm run verify:i18n` + `git diff --numstat`(파일당 +10/−0)으로 검증한다.
- 쓰지 않게 되는 키(`captureContactSaved`, `captureContactPlaceholderLine`, `captureMessengerLead`)는 지우지 않는다.
- 신규 키 문구(영어 기준):
  - `captureBusyLead`: "You don't have to wait here. Leave a contact and we'll reach out to you first."
  - `captureChannelsLead`: "Reach us wherever is easiest for you:" (네 단추 위. 이메일이 들어가면서 기존 `captureMessengerLead`의 "messenger"가 맞지 않게 돼 새 키를 쓴다)
  - `captureEmailLead`: "Email us at this address and include the code {code}."
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
| `contactChannels.test.ts` | `extractEmail`(본문 중간·문장 끝 마침표·병원 도메인 제외·**카드의 병원 주소 `CHAT_CONTACT_EMAIL` 제외**·없음·여러 개면 첫째), 이메일 검증, `defaultFormChannel`, 채널 목록 분리(남기기 목록에 `line` 없음·`email` 있음, 바로 연락하기 목록은 네 개), `orderedLinkChannels`(`ja` → LINE 먼저, `en` → WhatsApp 먼저, `zh` → WeChat 먼저, **이메일은 어느 로케일에서나 맨 뒤**), `shouldShowCaptureBlock` 새 조건 조합(영업시간 무관, 연락처 있음, 기다리는 중 아님, 직원 글 10분 이내, ✕ 12시간) |
| `contactService.test.ts` (신규) | `saveVisitorContact`: `email` → `visitor_email` 갱신 + 시스템 메시지, 메신저 → 기존 컬럼, `line` 호환. `recordMessengerClick`: 클릭 컬럼만 갱신·시스템 메시지 없음, `email` 클릭도 같은 방식으로 기록. `saveEmailFromMessage`: 인식 저장 1회, 같은 주소 재입력은 무변경, 이메일 없는 글은 무변경. DB 오류는 throw 없이 실패 결과 |
| `visitorMessageFollowups.test.ts` (신규) | `startEarlyFollowups`: 이메일 저장이 끝난 뒤에 자동 안내를 시작하고, 자동 안내 완료는 기다리지 않고 돌아온다. 이벤트 안내는 자동 안내가 끝난 **뒤에** 시작한다. `runVisitorMessageFollowups`: 이메일이 저장된 경우에만 연락처 알림이 손님 글 릴레이 **뒤에** 간다, `ackPromise`를 끝까지 기다린다, 한쪽이 실패해도 다른 쪽은 끝난다. `eventHintUrl`이 있을 때만 이벤트 안내 알림이 손님 글 릴레이 **뒤에** 간다 |
| `priceIntent.test.ts` (신규) | 실제 문의 문장 9개(영어 "…the price of Ulthera", "any promotion on ultherapy prime ?" · 중국어 "超声刀多少钱？", "我想了解一下价目表", "…含税总价是多少" · 번체 "想問除紋身價格" · 일본어 "…大体の金額についても…" 등) → true. 가격과 무관한 실제 문장(예약·진료 절차·"Do you have sculptra", "what kind of fillers do you do?") → false. `chat.promoDraft` 11개 로케일(메시지 JSON에서 읽는다)이 파일의 상수와 같고 모두 false, 배너 문장 뒤에 가격 질문이 붙으면 true. 대소문자 무시, 낱말 경계(`priceless`·`Costa`·`eventually` → false), 넣지 않은 낱말(`Do you offer…`, `얼마나 걸리나요`) → false |
| `eventHint.test.ts` (신규) | `currentPromotionSlug`: 한국 시각 월 경계(UTC 9/30 15:00 → `2026-10-promotion`). `eventHintUrl`: 슬러그 있음 → 상세, 없음 → 목록, 10개 로케일. `shouldSendEventHint`: 처음 → true, 12시간 이내 → false, 초과 → true, 직원 글 10분 이내 → false. `composeEventHintTexts`: 10개 로케일 × 2종(프로모션·목록) 문장이 비어 있지 않고 서로 다르며, 한국어 원문·번역문 모두 줄바꿈 뒤 링크로 끝난다. 프로모션이 있으면 `P_promo`, 없으면 `P_list`. `sendEventHintIfDue`: 낱말 없음·`CHAT_EVENT_HINT=off` → DB 호출 0회. 보냄 → INSERT가 `source='auto'`이고 원문·번역문 모두 링크로 끝난다. 선점 0행 → `lost_race`·INSERT 없음. 프로모션 없음·조회 오류 → 목록 링크로 보냄. 세션 조회·선점 오류(042 미적용) → `error`, throw 없음 |
| `linkify.test.ts` (신규) | 주소 없음 → 글 조각 하나, 문장 중간의 주소, 여러 개, 줄바꿈 뒤 주소, 끝 문장부호(`.` `。` `)`) 제외, `http`·`https`만(`javascript:`·`www.`만 있는 글은 글자 그대로) |
| `escalationRunner.test.ts` (신규) | 후보 조회에 연락처 NULL 조건 2개, `CHAT_FOLLOWUP=off`면 조건 없음 |
| `followupDigest.test.ts` (신규) | `digestWindow`: 평일 10:00~10:08·18:00~18:08, 토 15:00~, 창 밖은 null, 영업시간 설정 변경 반영. `runFollowupDigest`: 대상 조회 조건, 선점된 세션만 게시, 0명 무게시, 7일 초과 제외, 직원 없음·`off` 무게시 |
| `slackRelay.test.ts` | 번역본 게시: 연락 수단이 있는 방 세션의 Slack 답글 → 전달 뒤 번역문만 담은 게시 1회. 연락 수단 없음·번역 실패·번역 생략·스레드 모드·`CHAT_FOLLOWUP=off` → 게시 없음. 연락 수단 조회 실패·게시 실패 → 결과는 `delivered` 유지. 피드 스레드 답장은 방 복사 **뒤에** 번역본 |
| `slackText.test.ts` | §4.7 표의 바뀐 문구와 신규 빌더 전부(`buildEventHintNote`는 안내 한 줄 + 링크 줄, `buildMessengerClickText`는 WhatsApp·LINE·WeChat·이메일 네 가지 — 이메일은 병원 주소가 들어간다) |
| `ChannelIcon.test.tsx` (신규, `components/ui/__tests__`) | 네 채널 모두 아이콘을 그리고 `aria-hidden`이다. 알 수 없는 채널은 아무것도 그리지 않는다 |
| `fakeAdmin.ts` | `in`·`or`·`gte` 지원 추가 |

검증 게이트: `npm test`, `npx tsc --noEmit`, 변경 파일 대상 `npx eslint`, `npm run verify:i18n`, `npm run build`.

---

## 9. 롤아웃

1. **마이그레이션 042를 운영 DB에 먼저 적용**(추가형이라 기존 코드에 영향 없음).
2. 원장님 입력 반영: 휴진일 → Netlify `CHAT_CLOSED_DATES`(받았을 때). LINE 링크와 WeChat QR은 코드에 이미 반영돼 있다.
3. master 머지·푸시(= Netlify 배포)는 원장님 승인 뒤.
4. 스모크(운영, 시험 이름 `Smoke Test 1001`):
   - 영업시간 중 첫 글 → 접수 안내(`open`) + 카드 표시 → 이메일 저장 → 대화창 확인 문구, 방에 📱, 피드에 📋 → 5분 뒤에도 재촉 알림 없음.
   - 다른 시험 세션에서 연락처 없이 5분 대기 → 기존 ⏰ 알림이 온다(회귀 확인).
   - 글에 이메일을 써서 자동 저장 확인.
   - 다음 요약 시각에 `#해외문의` 요약 게시 → 방에 답글 → 다음 요약에서 빠짐.
   - 연락처를 남긴 시험 세션의 방에 한국어로 답글 → 번역본이 바로 아래 올라옴 → **업무폰 Slack에서 길게 눌러 복사 → WeChat 입력창에 붙여 넣어** 번역문만 깨끗하게 들어가는지 확인.
   - 중국어 화면(`/zh`)에서 카드에 병원 WeChat QR과 아이디가 펼쳐져 있고, 복사 버튼으로 아이디가 복사되며, 누르면 방에 📲 한 줄이 오는지 확인. 영어 화면에서는 작은 "WeChat" 링크를 눌러야 펼쳐지는지 확인. 휴대폰에서 복사한 아이디로 실제 WeChat 검색이 되는지, 카드의 QR(잘라 만든 이미지)을 다른 기기의 WeChat으로 스캔하면 병원 계정이 뜨는지 확인.
   - 카드에 WhatsApp·WeChat·LINE·이메일 단추 네 개가 아이콘과 함께 나란히 보이는지(영어 화면은 WhatsApp, 일본어는 LINE, 중국어는 WeChat이 맨 앞). 이메일 단추 → 병원 주소가 펼쳐지고, 복사 버튼으로 주소가 복사되며, 주소를 누르면 휴대폰 메일 앱이 코드가 든 글과 함께 열리고, 방에 📲 한 줄이 오는지 확인. 사이트 오른쪽의 LINE·WhatsApp 단추 모양이 그대로인지 확인(아이콘 파일을 옮겼으므로).
   - 영어 화면에서 "How much is Ulthera?"를 보냄 → 접수 안내 **뒤에** 이벤트 안내 말풍선이 오고, 링크를 누르면 새 창에서 이번 달 프로모션(영어 포스터)이 열림 → 방에 🎁 한 줄. 같은 세션에서 가격을 다시 물어도 두 번째 안내는 없음. 일본어·중국어 화면에서도 그 언어 문장과 그 언어 페이지인지 확인.
   - 이벤트 화면의 5% 배너로 채팅을 열어 미리 채워진 문장만 보냄 → 이벤트 안내가 나가지 않음.
   - 이벤트 안내가 나간 뒤에도 5분 재촉 알림이 그대로 오는지 확인(연락처 없는 시험 세션 — 이벤트 안내는 답변으로 치지 않는다).
5. 직원 안내(`#해외문의`에 게시):
   > 손님이 연락처를 남기면 재촉 알림이 멈추고 '오늘 연락할 손님'으로 표시됩니다. 여유 있을 때 **그 방에 한국어로 답을 쓰면 바로 아래에 번역본이 올라옵니다.** 그것을 복사해 위챗·왓츠앱·메일에 붙여 넣어 보내 주세요. 방에 답을 쓰면 목록에서 빠지고, 상담이 끝나면 방을 보관해 주세요. 문 열 때와 마감 1시간 전에 남은 손님 목록이 올라옵니다. 연락처가 없는 손님은 지금처럼 5·12·30분 알림이 옵니다.
   > 채팅창에 병원 위챗 QR과 아이디가 나갑니다. 업무폰 위챗에 친구 요청이 오면 수락하고, 손님이 보낸 코드(#로 시작)로 어느 방 손님인지 확인해 주세요.
   > 위챗 손님이 보낸 글은 위챗의 번역으로 읽을 수 있습니다: 나 → 설정 → 일반 → 번역 → "채팅에서 받은 메시지 자동 번역"을 켜거나, 메시지를 길게 눌러 "번역". 짧은 답은 입력창을 길게 눌러 "쓰면서 번역"을 써도 됩니다(업무폰에서 메뉴가 보이는지는 확인 필요).
   > 손님이 가격을 물으면 이번 달 프로모션 페이지 링크가 자동으로 먼저 나갑니다(방에 🎁 표시). 가격 답변은 지금처럼 직접 해 주세요 — 손님이 이벤트 페이지를 보고 있으니 그 내용과 맞춰 안내해 주세요.
6. 2주·4주 뒤 측정 스크립트로 G-1~G-6 확인(자동 안내 지연은 스모크 직후에도 한 번 잰다).

되돌리기: Slack 쪽은 `CHAT_FOLLOWUP=off`, 이벤트 안내는 `CHAT_EVENT_HINT=off`(둘 다 재배포), 그 밖의 손님 화면은 커밋 되돌리기. 042는 추가형이라 그대로 둔다.

---

## 10. 하지 않는 것 / 다음 단계

**이번에 하지 않는 것**
- AI 답변 — 결정 ⑥. 다음 문서에서 "병원 이용 안내를 홈페이지 답변 중에서 골라 보여 주기"로 다룬다.
- 직원 답변을 번역해 손님 이메일로 자동 발송 — 발송 코드(Resend)는 상담 예약 폼에 있지만 운영 서버에 키가 없다. 키 등록·발신 도메인 인증·다른 기기에서 대화 이어가기 링크가 필요해 별도 단계로 둔다. **이메일만 남긴 손님을 직원 손 없이 챙기려면 이것이 필요하다**(U-4).
- 손님 글에서 메신저 ID 인식, 방 주제(topic)에 나중에 남긴 연락처 반영.
- 사이트의 다른 WeChat 버튼(하단 바, WeChat 안내 페이지, 문의 페이지) 변경 — 결정 ⑦은 채팅 카드에만 적용한다.
- 사이트의 다른 곳에 적힌 병원 이메일(`SITE_INFO.email` = `info@livps.co.kr`) 변경 — 결정 ⑩의 주소는 채팅 카드에만 쓴다(U-9). 그 주소로 온 메일을 Slack 방에 자동으로 옮기는 일도 하지 않는다.
- 관리자 화면에서 쓴 답글의 번역본을 따로 올리기 — 방에 원문·번역이 이미 함께 올라간다.
- 위챗·왓츠앱과 채팅을 직접 연결하기(직원이 Slack에서 답하면 그 메신저로 자동 발송) — 병원 계정이 개인형이라 연동 수단이 없다. 번역본 복사로 대신한다.
- 대화 중 재발신 때 나가는 짧은 안내 변경, 세션 시작 시의 시스템 안내·노란 안내 띠 변경.
- 사이트 전역 1순위 메신저(`primaryMessengerFor`) 변경 — LINE 링크는 고쳤으니(U-2) 대만·태국을 LINE 기본으로 바꿀지는 따로 정한다.
- 가이드 글 본문의 "LINE ID: icps7972773" 표기(일본어·대만어 가이드 10여 곳) — 아이디 검색이 안 되는 손님에게는 통하지 않으므로 친구 추가 링크로 바꾸는 것이 좋지만, 가이드 원고를 고치는 별도 작업이다.
- 휴진일을 관리자 화면에서 고치기, Slack 버튼(Block Kit), 연락 완료 전용 버튼.
- 이벤트 안내(§4.10)에서: 가격표 페이지(`/pricing`) 링크 — 정가 기준이라 직원이 안내하는 이벤트 가격과 달라 혼선이 생긴다. 가격 질문을 뜻으로 판정하기, 물어본 시술에 맞는 이벤트 고르기 — 2단계(AI)에서 다룬다. 채팅창 안에 포스터 미리보기 카드, 링크 클릭 기록, 가격 질문이 아닌 손님에게도 이벤트 링크 보내기(접수 안내가 길어져 연락처 요청이 묻힌다), 관리자 화면 대화 보기의 링크 누르기.

**U-5 문구 초안 (승인 시 11개 로케일 `privacy` 5조에 반영)**
> 서비스 운영을 위해 신뢰할 수 있는 수탁업체에 업무를 위탁합니다: Supabase(데이터베이스 호스팅), Google Analytics(웹사이트 이용 분석), **OpenAI(채팅 번역, 국외 처리), Slack(상담 문의 알림 전달, 국외 처리).** 수탁업체는 서비스 제공에 필요한 범위에서만 정보를 처리합니다.

---

## 11. 구현 인계 메모 (새 세션용)

- **상태**: 설계와 손님 문구 모두 확정(2026-10-01). 다음은 구현 계획(`superpowers:writing-plans`, `docs/superpowers/plans/`에 저장) → 원장님께 계획을 보여 드린 뒤 구현. 경위와 실측은 메모리 `chat-auto-reply-baseline-2026-10`에 있다.
- **작업 위치**: 워크트리 `D:\dev\LIV_homepage-slack-rooms`, 브랜치 `feature/chat-contact-first`(master `a485c64`에서 분기). 메인 폴더 `D:\dev\LIV_homepage`(master)는 다른 세션이 쓰므로 거기서 브랜치를 바꾸거나 작업하지 않는다.
- **명령**: npm은 `liv-clinic/`에서 실행한다. 이 PC는 TLS 프록시 뒤라 `npm run build`에는 `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1`, DB·Node 스크립트에는 `NODE_TLS_REJECT_UNAUTHORIZED=0`이 필요하다. 워크트리의 `node_modules`는 복사본이며 master와 `package.json` 차이가 없다.
- **검증 게이트**: `npm test` · `npx tsc --noEmit` · 변경 파일만 `npx eslint <files>`(리포 전체 lint에는 기존 오류가 있다) · `npm run verify:i18n` · `npm run build`.
- **테스트 관례**: 라우트 단위 테스트가 없다. 로직은 `src/lib/chat/*`로 빼고 `__tests__/fakeAdmin.ts`로 Supabase를 흉내 낸다(`in`·`or`·`gte` 지원을 더해야 한다). Slack 호출은 fetch 스파이로 본다.
- **기대값이 바뀌는 기존 테스트**: `contactChannels.test.ts`(채널 목록, 카드 노출 조건), `slackText.test.ts`(`ROOM_AUTO_ACK_NOTE`, `buildContactText`, 방 첫 메시지 꼬리). `autoAck.test.ts`의 짧은 안내 기대값은 유지된다.
- **메시지 JSON**: 11개 파일은 줄바꿈이 섞여 있다. 재직렬화하지 말고 `\n`만 경계로 줄을 나눠 바이트 보존 삽입한다(메모리 `liv-i18n-file-quirks`).
- **Grep 도구**: `glob`에 폴더 경로를 넣으면 이 PC에서 거짓 0건이 나온다. 폴더는 `path`로 좁힌다(메모리 `grep-glob-dir-false-negative`).
- **손님 문구(U-1)는 확정됐다**: 원장님이 미리보기 화면 `https://claude.ai/artifact/5sAwkitRkzQ47no9mLFqxv`(원장님 계정에서만 열린다. 초안 2 — 상황·언어를 고르면 손님 화면, 한국어 원문, 단추 네 개가 놓인 연락처 카드가 나온다)을 보고 그대로 진행하기로 했다(2026-10-01). 문구는 §4.1·§4.10·§7과 **부록 A** 그대로 구현한다. 원장님은 문장을 번호(1~16)와 글자(가~아)로 부른다 — 대응은 부록 A에 있다. 나중에 문구를 고치게 되면 미리보기도 같은 주소로 다시 올린다(화면의 원본 파일은 세션 임시 폴더에 있었으므로, Artifact 도구로 이 주소를 읽어 온 뒤 고친다).
- **아직 받지 못한 값의 기본 처리**: U-3 휴진일은 `CHAT_CLOSED_DATES`를 비워 둔다. U-5 처리방침은 건드리지 않는다.
- **이벤트 안내(§4.10, 결정 ⑨)는 설계 승인 뒤 같은 날 추가됐다**: 신규 파일 `priceIntent.ts`·`eventHint.ts`·`linkify.ts`와 각 테스트, `MessageBubble.tsx` 수정, `serverI18n.ts`의 `EVENT_HINT_TEXTS`, 042의 세 번째 컬럼 `event_hint_at`, 환경변수 `CHAT_EVENT_HINT`. 낱말 목록은 §4.10 표 그대로 옮기고, 테스트에는 그 절에 적은 실제 문의 문장을 쓴다. 이번 달 프로모션은 **주소(`YYYY-MM-promotion`)로** 찾는다 — "진행 중인 이벤트"로 찾지 않는다.
- **카드의 단추 네 개와 아이콘(§4.2, 결정 ⑩)도 같은 날 추가됐다**: 신규 `components/ui/ChannelIcon.tsx`(WhatsApp·LINE SVG는 `FloatingCTA.tsx`에서 옮기고 `FloatingCTA`는 가져다 쓰게 바꾼다 — 모양이 달라지면 안 된다), `constants.ts`의 `CHAT_CONTACT_EMAIL`, `click` 채널에 `email`, 메시지 키 2개 추가(`captureChannelsLead`·`captureEmailLead` — 신규 키는 모두 10개). 병원 이메일 주소는 채팅 카드에만 쓰고 `SITE_INFO.email`은 건드리지 않는다.
- **이미 끝난 것(다시 만들지 않는다)**: U-2·U-6·U-7 — LINE 친구 추가 링크(`SOCIAL_LINKS.line`), `public/images/wechat-qr-code.png`, `WECHAT_ID`·`WECHAT_QR_IMAGE` 상수, 새 QR을 쓰는 `WeChatQRModal`·`WeChatInfo`, 테스트 `components/ui/__tests__/WeChatQR.test.tsx`·`lib/__tests__/messengerLinks.test.ts`가 이 브랜치에 있다(`fix/wechat-qr-latest`의 8646dfc·435869d 병합). 카드에서 가져다 쓴다. 그 수정이 운영에 먼저 나갔는지는 `git fetch` 뒤 `git log origin/master`로 확인하고, 나갔다면 master를 이 브랜치에 병합한 뒤 시작한다.
- **운영에 닿는 일은 원장님 승인 뒤에만 한다**: 마이그레이션 042 운영 적용, master 머지·푸시(= Netlify 배포), Netlify 환경변수 변경.
- **측정 스크립트**는 이미 있다(`liv-clinic/scripts/chat-response-baseline.mjs`). §1·§2의 수치를 낸 질의이므로 기존 항목의 정의를 바꾸지 않는다. 이벤트 안내 항목 9는 새로 더한다(§4.10).
- **2단계(별도 문서)**: AI 이용 안내(홈페이지 답변에서 고르기), 직원 답변 이메일 자동 발송.

---

## 부록 A. 미리보기에 쓴 문구 (원장님이 확인한 것)

미리보기 화면(§11)의 번호·글자와 키의 대응, 그리고 그 화면에 넣은 일본어·중국어 문장이다. 한국어 원문과 영어 기준문은 §4.1·§4.10·§7에 있다. **일본어·간체·번체는 아래 문장을 그대로 쓴다**(원장님이 본 화면과 실제로 나가는 글이 같아야 한다). 나머지 6개 언어(vi·th·ru·fr·mn·ar)는 구현 때 영어 기준문에서 옮긴다. 병원 이름은 로케일별 표기를 따른다(일본어 `LIV美容クリニック`, 중국어 `LIV整形外科`).

**번호 ↔ 키** (접수 안내·이벤트 안내 — `serverI18n.ts`)

1 `G` · 2 `S_open` · 3 `S_closing` · 4 `S_closed` · 5 `C_ask_open` · 6 `C_ask_closing` · 7 `C_ask_closed` · 8 `C_known_open` · 9 `C_known_closing` · 10 `C_known_closed` · 11 `Q` · 12 `W` · 13 `P_promo` · 14 `P_list` · 15 `autoAck`(현행 그대로) · 16 `autoAckOffHours`(현행 그대로)

**글자 ↔ 키** (연락처 카드 — `messages/*.json`의 `chat`)

가 `captureHeading`(현행) · 나 `captureBusyLead`(영업 중·신규) 또는 `captureReturnAt`(상담 시간 외·현행) · 다 `captureChannelsLead`(신규) · 라 `captureWechatLead`(신규) · 마 `captureEmailLead`(신규) · 바 `captureCodeInstruction`(현행) · 사 `captureContactLead`(현행) · 아 `capturePrivacyNote`(신규)

### A.1 일본어 (ja)

- `G`: こんにちは、LIV美容クリニックです。メッセージを受け付けました。
- `S_open`: ただいまスタッフが他のお客様をご案内中のため、ご返信まで10〜20分ほどかかる場合がございます。
- `S_closing`: 本日のご相談時間はまもなく終了いたします。
- `S_closed`: ただいまはご相談時間外です。
- `C_ask_open`: お待ちいただかなくて済むよう、下にWeChat・LINE・WhatsApp・メールのうちご都合のよい連絡先をお残しください。本日中に、できるだけ早くそちらへご連絡いたします。
- `C_ask_closing`: 下にWeChat・LINE・WhatsApp・メールのうちご都合のよい連絡先をお残しください。本日中にご連絡し、難しい場合は翌営業日に最優先でご連絡いたします。
- `C_ask_closed`: 下にWeChat・LINE・WhatsApp・メールのうちご都合のよい連絡先をお残しください。ご相談時間が始まり次第、できるだけ早くそちらへご連絡いたします。
- `C_known_open`: お残しいただいた連絡先へ、本日中にできるだけ早くご連絡いたします。
- `C_known_closing`: お残しいただいた連絡先へ本日中にご連絡し、難しい場合は翌営業日に最優先でご連絡いたします。
- `C_known_closed`: お残しいただいた連絡先へ、ご相談時間が始まり次第できるだけ早くご連絡いたします。
- `Q`: ご希望の施術とご来院予定日をあわせてお知らせいただければ、一度で正確にご案内できます。
- `W`: この画面を開いたままにしていただければ、こちらにもご返信いたします。
- `P_promo`: 料金はスタッフが確認のうえ、正確にご案内いたします。今月のプロモーションはこちらからご覧いただけます。
- `P_list`: 料金はスタッフが確認のうえ、正確にご案内いたします。実施中のイベントはこちらからご覧いただけます。

### A.2 중국어 간체 (zh)

- `G`: 您好，这里是LIV整形外科。已收到您的留言。
- `S_open`: 目前咨询人员正在接待其他顾客，回复可能需要10～20分钟左右。
- `S_closing`: 今天的咨询时间即将结束。
- `S_closed`: 现在不在咨询时间内。
- `C_ask_open`: 为了不让您久等，请在下方留下方便的联系方式（微信、LINE、WhatsApp或邮箱），我们会在今天之内尽快通过该方式联系您。
- `C_ask_closing`: 请在下方留下方便的联系方式（微信、LINE、WhatsApp或邮箱），我们会在今天之内联系您；如来不及，将在下一个营业日第一时间联系您。
- `C_ask_closed`: 请在下方留下方便的联系方式（微信、LINE、WhatsApp或邮箱），咨询时间一开始，我们会尽快通过该方式联系您。
- `C_known_open`: 我们会在今天之内尽快通过您留下的联系方式与您联系。
- `C_known_closing`: 我们会在今天之内通过您留下的联系方式与您联系；如来不及，将在下一个营业日第一时间联系您。
- `C_known_closed`: 咨询时间一开始，我们会尽快通过您留下的联系方式与您联系。
- `Q`: 请一并告知您想了解的项目和预计到访日期，我们可以一次性为您准确说明。
- `W`: 保持此窗口打开，我们也会在这里回复您。
- `P_promo`: 具体价格将由咨询人员确认后为您准确说明。本月优惠活动可在此查看：
- `P_list`: 具体价格将由咨询人员确认后为您准确说明。目前进行中的活动可在此查看：

### A.3 중국어 번체 (zh-TW)

- `G`: 您好，這裡是LIV整形外科。已收到您的訊息。
- `S_open`: 目前諮詢人員正在接待其他顧客，回覆可能需要10～20分鐘左右。
- `S_closing`: 今天的諮詢時間即將結束。
- `S_closed`: 現在不在諮詢時間內。
- `C_ask_open`: 為了不讓您久等，請在下方留下方便的聯絡方式（微信、LINE、WhatsApp或電子郵件），我們會在今天之內盡快透過該方式與您聯絡。
- `C_ask_closing`: 請在下方留下方便的聯絡方式（微信、LINE、WhatsApp或電子郵件），我們會在今天之內與您聯絡；如來不及，將在下一個營業日優先與您聯絡。
- `C_ask_closed`: 請在下方留下方便的聯絡方式（微信、LINE、WhatsApp或電子郵件），諮詢時間一開始，我們會盡快透過該方式與您聯絡。
- `C_known_open`: 我們會在今天之內盡快透過您留下的聯絡方式與您聯絡。
- `C_known_closing`: 我們會在今天之內透過您留下的聯絡方式與您聯絡；如來不及，將在下一個營業日優先與您聯絡。
- `C_known_closed`: 諮詢時間一開始，我們會盡快透過您留下的聯絡方式與您聯絡。
- `Q`: 請一併告知您想了解的療程和預計到訪日期，我們可以一次為您準確說明。
- `W`: 保持此視窗開啟，我們也會在這裡回覆您。
- `P_promo`: 確切價格將由諮詢人員確認後為您準確說明。本月優惠活動可在此查看：
- `P_list`: 確切價格將由諮詢人員確認後為您準確說明。目前進行中的活動可在此查看：

### A.4 연락처 카드의 새 문구

`{code}`에는 `#A1B2C3D4` 꼴의 참조 코드가 들어간다(기존 `captureCodeInstruction`과 같은 방식). 영어는 §7의 기준문이다. 표에 없는 새 키(`captureMessengerFallback`, `captureCopied`)는 미리보기에 넣지 않았으므로 구현 때 옮긴다.

| 키 | 한국어 | 일본어 | 간체 | 번체 |
|----|--------|--------|------|------|
| `captureBusyLead` | 여기서 기다리지 않으셔도 됩니다. 연락처를 남겨 주시면 저희가 먼저 연락드립니다. | こちらでお待ちいただく必要はありません。連絡先を残していただければ、こちらから先にご連絡します。 | 您不必在这里等候。留下联系方式，我们会主动联系您。 | 您不必在這裡等候。留下聯絡方式，我們會主動聯絡您。 |
| `captureChannelsLead` | 편한 방법으로 바로 연락하실 수 있습니다: | ご都合のよい方法で直接ご連絡いただけます： | 您可以通过方便的方式直接联系我们： | 您可以透過方便的方式直接聯絡我們： |
| `captureWechatLead` | WeChat에서 이 QR을 스캔하거나 아이디를 복사해 검색해서 추가한 뒤, 코드 {code}를 보내 주세요. | WeChatでこのQRコードを読み取るか、IDをコピーして検索し、追加してください。その後、コード {code} をお送りください。 | 请使用微信扫描二维码，或复制微信号搜索添加我们，然后发送代码 {code}。 | 請使用微信掃描 QR Code，或複製微信號搜尋加入我們，然後傳送代碼 {code}。 |
| `captureWechatIdLabel` | WeChat 아이디 | WeChat ID | 微信号 | 微信號 |
| `captureEmailLead` | 이 주소로 메일을 보내실 때 코드 {code}를 함께 적어 주세요. | こちらのアドレスにメールをお送りください。コード {code} もあわせてご記入ください。 | 请发送邮件至此地址，并注明代码 {code}。 | 請寄信至此地址，並註明代碼 {code}。 |
| `captureContactPlaceholderEmail` | 이메일 주소 | メールアドレス | 邮箱地址 | 電子郵件地址 |
| `capturePrivacyNote` | 연락처는 이 문의에 답변드리는 데에만 사용합니다. | ご連絡先は、このお問い合わせへのご返信にのみ使用します。 | 您的联系方式仅用于回复本次咨询。 | 您的聯絡方式僅用於回覆本次諮詢。 |
| `captureCopy` | 복사 | コピー | 复制 | 複製 |
