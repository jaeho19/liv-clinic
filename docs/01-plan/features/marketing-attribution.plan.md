# marketing-attribution — 계획 (Plan)

> 작성: 2026-08-18 · 대상: 관리자 마케팅 유입·전환 통계 시스템 + 대외 홈페이지 정보구조 개선
> 원칙: 기존 기능·데이터 삭제/재구성 금지 · 중복 섹션 생성 금지 · 과거 데이터 수치 추정 금지 · 배포 없음(로컬 구현/빌드/미리보기까지)

## 1. 현재 상태 진단 요약

### 데이터 (Supabase / PostgreSQL, 단일 저장소)
- **`inflow_leads` 202행** (2026-06-21~08-14). 이것이 기존 "유입 통계" 데이터.
  - `channel`(wechat/kakao/naver/phone/walk_in/website/livechat/etc — 실질은 **접촉 수단**), `agency`(바이올렛 97건),
    `treatment`(자유 텍스트, 오타·복합표기 혼재), `reserved/visited` + 날짜, `note`, PII(name/phone/wechat_id/kakao_id)
  - **없음**: 결제 여부/금액, 취소·노쇼, 국내/해외, 채널 대분류/세부, 캠페인·콘텐츠 연결, 담당자
  - 스키마 원본이 리포 루트 `inflow-leads-table.sql`에 있고 `supabase/migrations/` 번호 체계 밖임
- `consultation_requests` 64행: 홈페이지 상담폼 3종이 수렴(source=페이지 경로 저장). status 전부 'pending'(방치). UTM 컬럼 없음.
- 광고비 데이터는 어디에도 없음 → CAC/ROAS는 현재 계산 불가(입력 구조만 신설).
- 마케팅 콘텐츠 게시기록 테이블 없음 → 신설 필요.

### 관리자
- `/admin/inflow` (1,015줄 단일 클라이언트 파일): `entry`(일일 입력) + `stats`(간이 통계: 7d/30d/90d/월 필터, KPI 4카드, 퍼널, 채널 막대, 에이전시 비교, 일별 추세, CSV) — **브라우저 → Supabase 직결(RLS authenticated)**.
- `/admin/analytics`: GA4 웹 트래픽 대시보드(별개, 중복 생성 금지).
- 인증: Supabase Auth(이메일+비번), `(authenticated)` 레이아웃 게이트. 역할 구분 없음.

### 대외 홈페이지
- `src/app/[locale]/page.tsx` 렌더 순서: 슬림배너 → Hero → **Equipment(11장비 마퀴, 3번째)** → Signature → CoreValues → Doctor → MediaNews → Reviews → Location.
- 분석 인프라 완비(`src/lib/analytics-events.ts` 30여 래퍼) but **홈 섹션 배선 0** (`trackCTAClick('hero_cta')`, `trackEquipmentView` 등 정의만 존재).
- 로케일 11개(ko/en/ja/zh/zh-TW/vi/th/ru/fr/mn/ar), 메시지 JSON은 혼합 EOL → **바이트 보존 삽입**으로만 편집.

### 과거 데이터 자동 분류 실현 가능성 (규칙 기반 프로토타입 실측)
- 시술 태그: 202건 중 154건(80%) 후보 생성 가능(완전 77 + 부분 77), 39건은 미분류 유지 대상.
- 채널 분류: 147건(73%) 후보 생성(high 129/medium 18), 53건 미분류(kakao/phone 등 출처 단서 없음).
- 국내/해외: 전건 후보 생성(high 109 — 대행사/위챗 근거).
→ "후보 생성 → 관리자 검토 화면 → 확인된 것만 반영 → 불확실은 미분류" 절차 성립.

## 2. 데이터 구조 변경 (전부 추가형, 기존 컬럼·데이터 불변)

### `inflow_leads` 컬럼 추가
| 컬럼 | 타입 | 의미 |
|---|---|---|
| `patient_origin` | text NULL CHECK('domestic','foreign') | 국내/해외 (NULL=미분류) |
| `channel_category` | text NULL | 유입 대분류(앱/네이버 검색/…/기타) |
| `channel_detail` | text NULL | 구체 채널(강남언니/바비톡/위챗/대행사명…) |
| `treatment_tags` | text[] NOT NULL DEFAULT '{}' | 표준 시술 태그(복수) |
| `paid` / `paid_date` / `paid_amount_krw` | bool DEFAULT false / date / bigint | 결제 여부·일·금액 |
| `outcome` | text NULL CHECK('cancelled','no_show') | 취소/노쇼 |
| `campaign_id` | uuid NULL FK→marketing_campaigns | 광고 캠페인 |
| `manager` | text NULL | 담당자 |
| `classified_at` | timestamptz NULL | 표준화 확인 시각(검토 큐 이탈 마커) |

기존 `channel`은 "문의 수단"으로 의미 유지(기존 UI 무변경), `treatment`(자유 텍스트)·`note`도 유지.

### 신규 테이블
- `marketing_campaigns`: name, code(=utm_campaign, unique), channel_category/detail, start_date, end_date, **spend_krw NULL**(광고비 — 값 있을 때만 CAC/ROAS 계산), note, is_active
- `marketing_contents`: posted_at, platform, content_type, title, url, campaign_id FK, code(=utm_content, unique), manager, view/comment/save/share/inquiry_count(**전부 NULL 허용 — 미입력은 '데이터 없음' 표기**), note
- `lead_content_links`: lead_id FK, content_id FK, attribution CHECK('direct','assisted','inferred','unknown'), note, UNIQUE(lead_id, content_id)

### `consultation_requests` 컬럼 추가
`utm_source` / `utm_medium` / `utm_campaign` / `utm_content` (text NULL) — 홈페이지 폼 제출 시 세션 첫 터치 UTM 저장.

RLS: 신규 테이블 3종에 기존 `inflow_leads`와 동일한 authenticated 전권 정책. 마이그레이션 파일 `supabase/migrations/038_marketing_attribution.sql` + 롤백 `docs/migrations/038_rollback.sql`.

## 3. 변경 대상 파일

### 신규
- `liv-clinic/supabase/migrations/038_marketing_attribution.sql`, `docs/migrations/038-marketing-attribution.md`(+롤백 SQL)
- `liv-clinic/src/lib/inflow/taxonomy.ts` · `classify.ts` · `stats.ts` · `csv.ts` (+ `__tests__/` 4파일)
- `liv-clinic/src/lib/utm.ts`
- `liv-clinic/src/components/admin/inflow/InflowDashboard.tsx` · `InflowReviewTab.tsx` · `LeadFormFields.tsx`(신규 필드 묶음) · `LeadContentLinksEditor.tsx`
- `liv-clinic/src/app/admin/(authenticated)/marketing/page.tsx` (+ 하위 컴포넌트)
- `liv-clinic/src/components/sections/ConcernPathways.tsx` (홈 신규 섹션)

### 수정
- `liv-clinic/src/app/admin/(authenticated)/inflow/page.tsx` — 탭 추가/폼 필드 확장/stats 탭을 대시보드 컴포넌트로 교체
- `liv-clinic/src/types/admin.ts`(택소노미 타입·라벨) · `src/types/supabase.ts`(신규 컬럼·테이블 타입)
- `liv-clinic/src/components/admin/AdminSidebar.tsx` — '마케팅 콘텐츠' 메뉴 추가
- `liv-clinic/src/app/api/consultation/route.ts` · `api/contact/route.ts` · `api/quick-consult/route.ts` — utm 수집(선택 필드)
- `liv-clinic/src/components/sections/ConsultationForm.tsx` · `src/components/layout/QuickConsultBar.tsx` · `src/app/[locale]/contact/page.tsx` — utm 전달
- `liv-clinic/src/app/[locale]/page.tsx` — 섹션 순서 재배치 + ConcernPathways 삽입
- `liv-clinic/src/components/sections/{Hero,Equipment,Signature,Doctor,MediaNewsSection,Location}.tsx`, `ReviewsSection` 클라 래퍼, `Header/Footer` — 기존 analytics 래퍼 배선(+장비 전체보기 링크)
- `liv-clinic/src/lib/analytics-events.ts` — concern 카드·foreign patient 등 소수 타입 확장
- `liv-clinic/src/messages/*.json` ×11 — `sections.concerns.*`, `sections.equipment.viewAll` 키 바이트 보존 삽입

## 4. 구현 순서
A. 마이그레이션+타입 → B. lib+테스트(TDD) → C. `/admin/inflow` 확장(입력 필드 → 대시보드 → 표준화 검토) → D. `/admin/marketing` → E. UTM 연동 → F. 홈페이지 IA(신규 섹션·재배치·이벤트 배선·i18n) → G. lint/tsc/test/build + 스모크 + 보고서(docs/04-report)

## 5. 명시적 비목표 (이번 작업에서 하지 않음)
- 기존 `stats` 탭 지표의 산식 변경(superset 대시보드로 흡수하되 기존 지표 유지)
- `consultation_requests` → `inflow_leads` 자동 연동(사람 결정 필요로 보고)
- 장비 섹션 삭제·축소(하단 이동 + 전체보기 링크만)
- 광고비 수치 추정(입력 구조만 제공, 데이터 없으면 '데이터 없음' 표기)
- 배포, Supabase Auth 사용자 생성, 기존 알려진 이슈(form-01, sec-01 등) 수정 — 보고서에 재플래그만
