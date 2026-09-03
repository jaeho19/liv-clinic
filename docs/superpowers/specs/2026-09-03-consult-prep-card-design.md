# 상담 준비 카드 — 설계

- 작성일: 2026-09-03
- 상태: 설계 확정 대기
- 범위: 리브성형외과 웹사이트(`liv-clinic`) 신규 기능 1차

---

## 1. 배경

### 1-1. 무엇이 새고 있는가

운영 DB 실측(2026-09-03 조회):

| 지표 | 값 |
|---|---|
| `consultation_requests` 총 건수 | 68 |
| 그중 `treatment_type = '빠른 상담'` | **48건 (71%)** |
| `budget_range` 기재 | **0건** |
| `inflow_leads` 중 `channel_category = 'homepage'` | 17건 → 예약 5건 (29%) |
| 국내 `referral`(지인소개) | 18건 → 예약 15건 (83%) |

손님 대부분이 **시술을 고르지 못한 채 "빠른 상담"만 누르고 있다.** 홈페이지 유입의 예약 전환은 29%로, 지인소개(83%)의 3분의 1이다.

### 1-2. 손님이 실제로 쓴 문장

`consultation_requests.message`와 `chat_messages` 원문에서:

> "discuss volume, tightening, and texture"
> "どの施術が自分に一番合っているか相談して決めたい" (어떤 시술이 나에게 맞는지 상담해서 정하고 싶다)
> "I want to focus on my smile line and double chin line. **Full face enough?**"
> "눈밑 주름, 이마주름, 전체적 스킨부스터 상담하고싶어요"
> "My skin concerns are pigmentation... Can you give a **treatment plan**?"

공통점은 **자기 고민을 부를 이름이 없다**는 것이다. 부위와 느낌은 말할 수 있지만, 그것이 임상적으로 무엇이라 불리는지, 무엇을 물어봐야 하는지를 모른다.

### 1-3. 이미 있는 것

- `ConcernPathways` — 홈의 고민 카드 5종(`sagging` / `elasticity` / `fundamental` / `underEye` / `texture`)과 국내·해외 분기 문구. **지금은 클릭하면 시술 페이지로 보낼 뿐이다.**
- `TREATMENTS` 16종 — `targetAreas` · `idealFor` · `duration` · `anesthesia` · `recovery` · `results` · `cautions`가 모두 채워져 있다.
- `MEDICAL_QA` 25건 — `question` · `questionVariants` · `shortAnswer` · `relatedTreatments` · `tags` 구조.
- `consultation_requests.procedure_tags`(text[]) — 컬럼만 있고 `src`에서 참조 0건. **빈 저장처가 준비돼 있다.**
- `src/lib/chat/translation.ts` — 서버 전용, 5초 타임아웃 + 1회 재시도, throw-free 계약.

신규로 만들어야 할 데이터는 **규칙표 하나뿐이다.**

---

## 2. 목표

**한 문장:** 손님이 자기 말로 쓴 고민을, 상담에서 쓸 수 있는 **용어와 질문**으로 바꿔 준다.

### 성공 기준

1. `consultation_requests`의 `treatment_type = '빠른 상담'` 비율이 71%에서 내려간다.
2. `procedure_tags`가 채워진 문의가 생긴다(현재 0건).
3. 이 흐름을 거친 문의의 예약 전환률이 직접 문의보다 높다.

### 비목표 (1차에서 하지 않는다)

- **시술 추천** — 무엇을 받으라고 말하지 않는다.
- **가격·견적** — 가격 출처 3곳(`pricing.ts` / `pricingGuide` / `firstVisitTrial.ts`)의 정합성이 확인되기 전에는 금액을 쓰지 않는다. 울쎄라 300샷이 147만/117만으로 갈려 있는 상태다.
- **얼굴 촬영·분석** — `liv-clinic/netlify.toml:138`이 `camera=()`를 걸고 있고, 진단 유사 리스크가 크다.
- **실장 화면 / 상담번호 브릿지** — 2차.
- **원내 태블릿** — 2차.

---

## 3. 사용자 흐름

```
[홈] 고민 카드 5종
      │  클릭
      ▼
[1단계] 확인      "처진 얼굴선과 턱선 — 맞으신가요?"        (카드에서 이미 고름)
      ▼
[2단계] 서술      "어떻게 보이는 게 제일 싫으세요?"          ← 자유 입력, 어느 언어든
                  예시 3개를 회색으로 보여줌 (입력 부담 완화)
      ▼
[3단계] 시기      "언제까지 필요하세요?"
                  ko 로케일:   없음 / 자녀 결혼식 / 상견례 / 동창회·모임 / 명절
                  그 외 로케일: 없음 / 한국 체류 기간(입국·출국일) 입력
      ▼
[결과] 카드 4장
      ▼
[전환] "이대로 상담 문의하기"  →  문의 폼에 자동 반영
```

### 결과 카드 4장

| # | 제목 | 내용 | 출처 |
|---|---|---|---|
| **1** | 말씀하신 건 보통 이렇게 부릅니다 | 용어 1~3개 + 한 줄 되받기 | 용어 사전(고정) + 생성 1문장 |
| **2** | 이 부위를 다루는 시술 | 시술 3개 + 각 한 줄 | 규칙표(고정 순서) |
| **3** | 상담에서 물어보세요 | 질문 3개 | 질문 은행(고정) |
| **4** | 참고 | 소요시간 · 마취 · 회복 · 주의사항 | `TREATMENTS` |

카드 2의 제목은 **"추천 시술"이 아니라 "이 부위를 다루는 시술"**이다. 순서는 점수순이 아니라 규칙표의 `display_order` 고정값을 따른다. 점수 정렬을 쓰지 않는 것이 "목록"과 "추천"을 가르는 선이다.

---

## 4. 시스템 구조

```
src/app/[locale]/consult-prep/page.tsx        진입 (고민 id를 쿼리로 받음)
  └ components/consultPrep/PrepWizard.tsx     3단계 폼 (클라이언트)
  └ components/consultPrep/PrepResult.tsx     결과 카드 4장 (클라이언트)

src/app/api/consult-prep/route.ts             POST — 유일한 서버 진입점
  └ lib/consultPrep/classify.ts               LLM 호출 1회 (분류 + 선택)
  └ lib/consultPrep/rules.ts                  규칙표 조회 (순수 함수)
  └ lib/consultPrep/adGuard.ts                금지어 검사
  └ lib/data/concernRules.generated.ts        빌드 시 CSV에서 생성

data/concern-rules.csv                        원장 검수 대상 (§5의 CSV 3종)
scripts/compile-concern-rules.mjs             CSV → TS, prebuild에서 실행·검증
```

경로는 모두 `liv-clinic/` 기준이다. 빌드 스크립트는 이미 의존성에 있는 `papaparse`로 CSV를 읽고, `prebuild`에 `verify:i18n`과 나란히 건다:

```json
"prebuild": "node scripts/compile-concern-rules.mjs && npm run verify:i18n"
```

생성물(`concernRules.generated.ts`)은 커밋한다 — Netlify 빌드가 실패해도 이전 값으로 돌아갈 수 있고, 규칙표 변경이 diff에 드러난다.

각 단위의 책임은 하나다. `classify.ts`는 **분류만** 하고 문장을 만들지 않는다. `rules.ts`는 **조회만** 하고 LLM을 모른다. `adGuard.ts`는 **검사만** 하고 무엇을 검사하는지 모른다(문자열을 받아 통과/차단만 반환).

---

## 5. 데이터 모델

### 5-1. 규칙표 `data/concern-rules.csv`

원장·실장이 엑셀로 편집하는 단일 진실 공급원. 커밋하면 자동 배포된다.

| 컬럼 | 설명 | 예 |
|---|---|---|
| `concern_id` | 고민 분류. **1차는 기존 `sections.concerns` 5종 그대로** | `sagging` |
| `treatment_id` | `TREATMENTS`에 실재해야 함 | `ulthera` |
| `display_order` | 화면 고정 순서 (점수 아님) | `1` |
| `reason_ko` `reason_en` `reason_ja` `reason_zh` | 왜 이 부위를 다루는지 한 줄 | `초음파로 깊은 층을 다룹니다` |
| `caution_ko` `caution_en` `caution_ja` `caution_zh` | 주의사항 한 줄 (비워도 됨) | `임신·수유 중에는 불가합니다` |
| `reviewed_by` | 검수자 | `김수영 원장` |
| `reviewed_at` | 검수일 | `2026-09-10` |

`reviewed_by` / `reviewed_at`이 비어 있으면 **빌드가 실패한다.** 검수 안 된 문구가 배포되지 않게 하는 장치이고, 동시에 "누가 언제 이 문장을 승인했는가"에 대한 답이 된다.

`reason_ko`가 채워졌는데 `reason_en`·`reason_ja`·`reason_zh` 중 빈 칸이 있으면 **경고만** 내고 빌드는 통과시킨다(그 언어에서는 시술명만 표시). 원장이 한국어부터 채우고 번역은 나중에 붙이는 실제 순서를 막지 않기 위해서다. 반면 `reviewed_by`는 언어와 무관하게 필수다.

### 5-2. 용어 사전 `data/concern-terms.csv`

| 컬럼 | 예 |
|---|---|
| `term_id` | `jawline_sagging` |
| `concern_id` | `sagging` |
| `label_ko` / `label_en` / `label_ja` / `label_zh` | `하악선 처짐` / `Jawline laxity` / … |
| `body_area` | `lower_face` |
| `reviewed_by` / `reviewed_at` | (동일) |

### 5-3. 질문 은행 `data/prep-questions.csv`

| 컬럼 | 예 |
|---|---|
| `question_id` | `how_many_sessions` |
| `applies_to` | `concern:sagging` 또는 `treatment:ulthera` 또는 `*` |
| `text_ko` / `text_en` / `text_ja` / `text_zh` | `몇 회가 필요한가요?` |
| `answer_source` | **필수.** `TREATMENTS.ulthera.results` 처럼 답이 존재하는 위치 |

`answer_source`가 가리키는 필드가 실제로 존재하지 않으면 빌드가 실패한다. **답이 없는 질문은 만들 수 없다**는 규칙을 코드로 강제한다.

### 5-4. 저장

신규 테이블 없음. 손님이 "이대로 문의하기"를 누르면 기존 `consultation_requests`에 저장한다.

| 컬럼 | 채우는 값 |
|---|---|
| `treatment_type` | 카드 2의 첫 시술명 (지금 71%가 '빠른 상담'인 자리) |
| `procedure_tags` | 선택된 `treatment_id[]` (현재 미사용 컬럼) |
| `message` | 손님 자유 서술 원문 + 용어 + 질문 3개 |
| `source` | `consult-prep` (기존 문의와 구분해 전환률 비교) |

---

## 6. AI 경계 — 여기가 이 설계의 핵심

### LLM이 하는 것 (호출 1회, 구조화 출력)

입력: 고민 id + 자유 서술 + 시기. 출력 스키마:

```
{
  term_ids:      string[]   // 용어 사전에 실재하는 id만. 최대 3개
  treatment_ids: string[]   // 규칙표가 이미 준 후보 안에서만 고름
  question_ids:  string[]   // 질문 은행에 실재하는 id만. 정확히 3개
  restatement:   string     // 손님 말 되받기 1문장. 유일한 생성물
  confidence:    "high" | "low"
}
```

### LLM이 하지 않는 것

- 시술을 **추천**하지 않는다 — 후보는 규칙표가 정하고, LLM은 그 안에서 순서 없이 고르기만 한다.
- 질문을 **생성**하지 않는다 — 은행에서 고른다.
- 용어를 **만들지 않는다** — 사전에서 고른다.
- 가격·기간·효과를 **말하지 않는다** — 해당 필드가 스키마에 없다.

### 반환값 검증 (서버, LLM 응답 직후)

1. `term_ids` / `treatment_ids` / `question_ids` 중 사전·규칙표·은행에 없는 id가 하나라도 있으면 **그 id만 버린다.**
2. `treatment_ids`가 비면 규칙표의 `display_order` 상위 3개로 대체한다.
3. `restatement`은 `adGuard` 통과 필수. 실패하면 **문장을 통째로 생략**하고 카드 1은 용어만 보여준다.
4. `confidence === "low"`면 카드 1에 "말씀을 조금 더 자세히 적어주시면 정확해집니다" 안내를 붙인다.

### 실패 시

`translation.ts`의 throw-free 계약을 그대로 따른다. LLM 호출이 실패해도 **화면은 반드시 나온다** — 고민 카드 id만으로 규칙표를 조회해 카드 2·3·4를 채우고, 카드 1은 그 고민의 기본 용어를 보여준다. 손님은 실패를 인지하지 못한다.

타임아웃 5초, 재시도 1회. 모델은 `OPENAI_CONSULT_PREP_MODEL` 환경변수, 기본값은 번역과 동일한 `gpt-5.6-luna`.

---

## 7. 의료광고·개인정보 규칙

### 화면 문구

- 카드 2 제목은 **"이 부위를 다루는 시술"**. "추천"·"맞춤"·"최적" 금지.
- 모든 용어는 완곡형으로만 — `~에 가까워 보입니다`. `~입니다` 단정 금지.
- 삭제 불가 고지 (모든 결과 화면 하단 고정):
  > 이 안내는 진단이 아니며, 상담을 준비하기 위한 참고 자료입니다.
  > 개인차가 있으며 실제 시술 여부와 방법은 의료진 상담으로 결정됩니다.

### `adGuard` 금지어

`ConcernPathways.tsx:11-14` 주석에 이미 적힌 목록을 코드 상수로 내린다: `최고` `유일` `1위` `100%` `완벽` `영구` `부작용 없` `보장` `확실` `즉시 효과` + 가격·할인 패턴 + 전후 비교 표현.

`restatement`에만 적용한다(나머지는 검수된 고정 문구라 검사 대상이 아니다).

### 개인정보

- 자유 서술은 **문의로 전환할 때만** 저장한다. 결과만 보고 나가면 아무것도 남지 않는다.
- 신체 증상·복용약·질환명이 입력되면 민감정보이므로, 문의 전환 시 **저장 전에 손님에게 명시적으로 보여주고 동의를 받는다**(기존 `agree_privacy` 재사용).
- OpenAI 국외이전 고지가 개인정보 처리방침에 반영돼야 한다. 채팅 번역이 이미 같은 상태이므로 **함께 처리한다.**

---

## 8. i18n 전략

`verify:i18n`이 11개 로케일(ko/en/ja/zh/zh-TW/vi/th/ru/fr/mn/ar) 키 정합성을 강제하고 어긋나면 **빌드가 실패한다.**

- **UI 문구**(질문·버튼·헤더·고지)는 `messages/*.json`에 넣는다 → 11개 파일 전부 추가 필수.
- **용어·시술 사유·질문 본문**은 i18n에 넣지 않는다. CSV의 `*_ko` / `*_en` / `*_ja` / `*_zh` 컬럼으로 관리한다. 이 데이터는 원장 검수 대상이라 개발자 배포 주기와 분리돼야 하고, i18n에 넣으면 문구 하나 고칠 때마다 11개 파일을 건드려야 한다.
- **1차 지원 언어는 ko / en / ja / zh 4종.** 나머지 7개 로케일에서는 진입점(고민 카드의 링크)을 기존 시술 페이지로 유지한다. 로그상 문의의 대부분이 이 4개 언어다.
- 메시지 JSON 편집 시: 줄 중간에 고립된 `\r`이 있어 `/[^\r\n]*(?:\r*\n|$)/g` 방식 줄 분할은 바이트를 삼킨다. `\n`만 경계로 삼는 수동 분할 + 라운드트립 검증 필수. (2026-09-03 실제 발생)

---

## 9. 측정

`analytics-events.ts`에 이벤트 4개를 추가한다.

| 이벤트 | 시점 |
|---|---|
| `prep_started` | 1단계 진입 |
| `prep_described` | 2단계 자유 서술 제출 |
| `prep_result_shown` | 결과 카드 노출 (`confidence` 함께) |
| `prep_to_inquiry` | "이대로 문의하기" 클릭 |

핵심 지표는 이벤트가 아니라 DB에서 본다:

```sql
-- 목표: '빠른 상담' 비율이 71%에서 내려가는가
select source, treatment_type, count(*) from consultation_requests group by 1,2;

-- 목표: 이 흐름을 거친 문의의 예약 전환이 더 높은가
select l.channel_category, count(*), count(*) filter (where l.reserved)
from consultation_requests c join inflow_leads l on l.consultation_id = c.id
where c.source = 'consult-prep' group by 1;
```

---

## 10. 테스트

- `rules.ts` — 규칙표 조회가 `display_order`를 지키는가, 없는 `concern_id`에 빈 배열을 돌려주는가.
- `adGuard.ts` — 금지어 목록 각각에 대해 차단되는가, 정상 문장이 통과하는가.
- `classify.ts` — LLM 응답을 스텁으로 두고: 없는 id가 섞이면 버리는가, `treatment_ids`가 비면 대체하는가, `restatement`이 금지어를 포함하면 생략되는가, 호출이 실패하면 규칙표 결과만으로 카드가 완성되는가.
- `scripts/compile-concern-rules.mjs` — `reviewed_by`가 비면 실패하는가, `answer_source`가 없는 필드를 가리키면 실패하는가.

기존 `vitest` 스위트(194개)에 붙인다.

---

## 11. 2차 이후

| 항목 | 조건 |
|---|---|
| 카드 5 "예상 비용대" | 가격 3곳 정합성 확인 후 |
| 3자리 상담번호 + 실장 화면 | 1차 데이터가 쌓인 뒤 |
| 실장 화면의 "오늘 권하지 않을 것" | 회피 사유를 비의학적 사유로만 한정하는 규칙 확정 후 |
| 원내 대기실 태블릿 | 웹에서 규칙표를 다듬은 뒤 |
| 나머지 7개 로케일 | 1차 언어에서 지표가 확인된 뒤 |

---

## 12. 열린 질문

1. 고민 분류 5종으로 충분한가. 로그 빈도상 `이중턱` · `팔자주름` · `모공·피부결`이 자주 나오는데, `sagging`·`texture`에 흡수시킬지 분리할지.
2. 2단계 자유 서술을 **필수**로 할지 건너뛸 수 있게 할지. 필수면 결과가 정확해지고, 선택이면 이탈이 준다.
3. 규칙표 검수를 누가 하는가 — 원장 단독인지, 실장 초안 + 원장 승인인지. `reviewed_by` 운영 방식이 여기서 갈린다.
