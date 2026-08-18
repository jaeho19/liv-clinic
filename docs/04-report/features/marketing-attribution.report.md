# marketing-attribution — 완료 보고 (Report)

> 작성: 2026-08-18 · 계획: `docs/01-plan/features/marketing-attribution.plan.md` · 설계: `docs/02-design/features/marketing-attribution.design.md`
> 범위: 관리자 마케팅 유입·전환 통계 시스템 + 대외 홈페이지 정보구조 개선. **배포·커밋 없음** (워킹트리 보존).

## 1. 현재 코드·데이터 구조 분석 결과

- **저장소**: Supabase(PostgreSQL) 단일. 유입 기록은 `inflow_leads` 202행(2026-06-21~08-14),
  브라우저 → Supabase 직결(RLS `authenticated`) 패턴. 스키마 원본은 리포 루트 `inflow-leads-table.sql`(마이그레이션 체계 밖).
- **기존 유입 데이터 실태**: `channel`은 실질적으로 **문의 수단**(wechat 102 / kakao 28 / phone 25 / etc 21 /
  website 12 / naver 7 / walk_in 7), `agency`는 바이올렛 97건 집중. `treatment`는 자유 텍스트(오타 '울쎼라',
  복합 '스킨부스터,보톡스', 메모 혼입 '바비톡신청' 등). 예약 146 / 내원 112. **결제·국내외·캠페인·담당자·취소노쇼 없음.**
- **관리자**: `/admin/inflow`(일일 입력 + 간이 통계 탭), `/admin/analytics`(GA4 웹 트래픽 — 별개 유지).
  `consultation_requests`(홈페이지 폼 64행, 전부 status pending)는 조회 화면 없음.
- **홈페이지**: 렌더 순서상 **11개 장비 마퀴가 히어로 직후 첫 콘텐츠**. 분석 래퍼(`analytics-events.ts`)는
  완비돼 있으나 홈 섹션 클릭 배선 0곳. 로케일 11개(ko/en/ja/zh/zh-TW/vi/th/ru/fr/mn/ar), 메시지 JSON은 혼합 EOL.
- **광고비 데이터는 어디에도 없음** → CAC/ROAS는 현재 계산 불가가 정답(추정 금지 원칙).

## 2. 변경한 파일

### 신규 (18)
| 파일 | 내용 |
|---|---|
| `liv-clinic/supabase/migrations/038_marketing_attribution.sql` | 추가형 마이그레이션(아래 §3) |
| `docs/migrations/038-marketing-attribution.md` | 적용·롤백 가이드 |
| `scripts/apply-migration-038.mjs` | pg 기반 적용 스크립트(.env.local의 DATABASE_URL 사용) |
| `liv-clinic/src/lib/inflow/taxonomy.ts` | 채널 대분류·시술 태그·플랫폼·귀속 등 **택소노미 SSOT** + 단계 파생/누락 판정 |
| `liv-clinic/src/lib/inflow/classify.ts` | 과거 데이터 표준화 **후보 생성 규칙 엔진**(자동 반영 금지) |
| `liv-clinic/src/lib/inflow/stats.ts` | 필터·KPI·추이·그룹·퍼널·전후비교·캠페인 지표 집계 |
| `liv-clinic/src/lib/inflow/csv.ts` | 표준화 열 포함 CSV 생성(기존 14열 순서 유지 + 신규 열 후미) |
| `liv-clinic/src/lib/utm.ts` | UTM 첫 터치 캡처/파싱/폼·API 헬퍼 |
| `liv-clinic/src/lib/inflow/__tests__/{classify,stats,csv}.test.ts`, `src/lib/__tests__/utm.test.ts` | vitest 59건 (TDD) |
| `liv-clinic/src/components/admin/inflow/InflowDashboard.tsx` | 통계 탭 대체 대시보드 |
| `liv-clinic/src/components/admin/inflow/InflowReviewTab.tsx` | 표준화 검토 탭 |
| `liv-clinic/src/components/admin/inflow/LeadContentLinks.tsx` | 리드-콘텐츠 귀속 편집기 |
| `liv-clinic/src/app/admin/(authenticated)/marketing/page.tsx` | 게시기록·캠페인 관리 |
| `liv-clinic/src/components/sections/ConcernPathways.tsx` | 홈 고민별 진입 섹션 |
| `liv-clinic/src/components/analytics/UtmCapture.tsx`, `ClickTracker.tsx` | UTM 캡처 마운트 / 서버컴포넌트 클릭 계측 래퍼 |

### 수정 (19)
- `src/types/supabase.ts`(신규 컬럼·테이블 타입, FK 관계 실제 제약명 반영) · `src/types/admin.ts`(마케팅 Row 타입)
- `src/app/admin/(authenticated)/inflow/page.tsx` — 탭 3개(일일 입력/통계/표준화 검토), 입력 모달 표준화 필드,
  결제 토글·일 요약 4카드, CSV 교체, 페이지 레벨 공용 수정 모달. 구 StatsTab 코드는 대시보드가 상위 호환으로 대체
- `src/components/admin/AdminSidebar.tsx`, `AdminLayoutClient.tsx` — '마케팅 콘텐츠' 메뉴/타이틀
- `src/app/api/{consultation,contact,quick-consult}/route.ts` — UTM 4필드 저장
- `src/components/sections/ConsultationForm.tsx`, `src/components/layout/QuickConsultBar.tsx`, `src/app/[locale]/contact/page.tsx` — 제출 시 UTM 첨부
- `src/app/[locale]/layout.tsx` — `<UtmCapture />` 마운트
- `src/app/[locale]/page.tsx` — 섹션 순서 재배치(§6)
- `src/components/sections/{Hero,Equipment,Signature,Doctor,MediaNewsSection,ReviewsSection,Location}.tsx`,
  `src/components/layout/{Header,Footer}.tsx` — 기존 분석 래퍼 배선 + 배경 교대 조정 + 장비 '전체 보기' 링크
- `src/lib/analytics-events.ts` — `trackConcernClick`/`trackContentClick` 추가, `trackCTAClick` 타입 3종 확장
- `src/messages/*.json` ×11 — `sections.concerns.*`(21키) + `sections.equipment.viewAll` **바이트 보존 삽입**(파일당 정확히 +17줄/-0줄, 재직렬화 없음)

## 3. 추가·변경한 데이터베이스 필드

| 대상 | 필드 | 비고 |
|---|---|---|
| `inflow_leads` +11 | `patient_origin`(domestic/foreign CHECK), `channel_category`, `channel_detail`, `treatment_tags` text[] DEFAULT '{}', `paid` bool DEFAULT false, `paid_date`, `paid_amount_krw`, `outcome`(cancelled/no_show CHECK), `campaign_id` FK, `manager`, `classified_at` | 전부 NULL/DEFAULT — 기존 행·배포 코드 영향 없음 |
| `consultation_requests` +4 | `utm_source/medium/campaign/content` | 홈 폼 세션 첫 터치 |
| 신규 `marketing_campaigns` | name, code(UNIQUE, =utm_campaign), channel_category/detail, start/end_date, **spend_krw NULL**, note, is_active | 광고비 NULL=데이터 없음 |
| 신규 `marketing_contents` | posted_at, platform, content_type, title, url, campaign_id FK, code(UNIQUE, =utm_content), manager, view/comment/save/share/inquiry_count(**전부 NULL 허용**), note | 지표 미입력≠0 |
| 신규 `lead_content_links` | lead_id/content_id FK(CASCADE), attribution(direct/assisted/inferred/unknown, DEFAULT **inferred**), note, UNIQUE(lead,content) | 게시일 근접만으로 direct 금지 |

RLS: 신규 3테이블 각각 authenticated 4정책(기존 `inflow_leads`와 동일). `updated_at` 트리거는 기존 `update_updated_at_column()` 재사용. 인덱스 7개.

## 4. 마이그레이션·롤백

- **적용 완료**(2026-08-18, `scripts/apply-migration-038.mjs`, 트랜잭션+검증): 신규 컬럼 11+4, 테이블 3, 정책 12 생성 확인.
  적용 후 점검 — `inflow_leads` 202행 무변화, 표준화 필드 전부 미기록(origin_set=0, cat_set=0, paid_set=0, classified=0),
  신규 테이블 0행. **과거 데이터에 어떤 값도 자동 기록하지 않았다.**
- 멱등(IF NOT EXISTS/DROP POLICY IF EXISTS)이라 재실행 안전. 롤백 SQL과 절차는 `docs/migrations/038-marketing-attribution.md`
  (롤백 시 신규 필드 입력 데이터 소실 경고 포함). 배포 중인 프로덕션 코드는 추가형 변경이라 영향 없음(사전 검토 완료).

## 5. 관리자 대시보드 구현 내용

`/admin/inflow` — 탭 3개:
1. **일일 입력**(기존 유지+확장): 결제 토글 칩, 일 요약 4카드(연락/예약/내원/결제), 입력·수정 모달에
   국내외(미분류 기본) / 유입 경로 대분류+세부(프리셋 datalist) / 시술 태그 칩 복수선택 / 결제(일·금액 — 미입력은 빈 값 유지) /
   취소·노쇼 / 담당자 / 캠페인 / 콘텐츠 귀속 편집기(수정 모드). 기존 채널 필드는 '문의 수단'으로 명칭만 정리.
2. **통계**(대시보드로 상위 호환 대체): 기간(시작·종료/7·30·90일)+일·주·월 단위, 필터 10종(국내외/대분류/세부/시술/단계/결제/취소노쇼/담당자/캠페인/콘텐츠),
   KPI 9종(연락·예약·내원·결제·총결제금액·전환율3종·취소노쇼 — 분모 0은 '–', 금액 미입력 건수 병기),
   4계열 추이(발생일 기준)·퍼널·유입경로/시술 비교(연락일 코호트)·국내외 비율·**광고 전후 비교**(캠페인 기간 동일 길이 전/중/후 일평균),
   **캠페인 광고비 표**(CPL·CAC(결제당)·ROAS — 광고비 없으면 '데이터 없음' 표기, 0 금지),
   상세 목록(정렬/검색/페이지네이션/CSV/행 수정/입력 누락 배지). 개인정보는 상세 목록·CSV에만 노출.
3. **표준화 검토**: 규칙 엔진이 후보 제안(확실/확인 권장/불확실 신뢰도) → 관리자가 체크한 행만 반영(이미 있는 값은 덮어쓰지 않음),
   '미분류 확정'은 필드를 비운 채 큐에서만 내림(`classified_at`). 반영 전 DB 무변경.
   실측: 시술 154/202건(76%), 채널 147/202건(73%), 국내외 202/202건 후보 생성 가능.

`/admin/marketing` — 게시기록(플랫폼 8종/유형/링크/캠페인/코드/담당자/지표 5종 — 미입력 '–'/연결 리드 수)
+ 캠페인(코드=utm_campaign, 기간, 광고비 선택 입력) CRUD. 콘텐츠 코드 입력 시 **UTM 링크 생성·복사** 버튼 제공.

## 6. 대외 홈페이지 변경 내용

새 렌더 순서 (권장 위계 1~9 적용, 섹션 삭제 없음):
`배너+Hero(핵심 메시지·CTA)` → `CoreValues(선택 근거)` → **`ConcernPathways(신규: 고민별 진입 5카드 + 국내/해외 경로 2카드)`** →
`Signature(대표 프로그램)` → `Doctor(전문성·학술)` → `Reviews(후기)` → `MediaNews(의료정보·미디어)` →
**`Equipment(장비 — 하단 이동, '전체 장비 보기' 링크 추가)`** → `Location(위치·상담)`

- 고민 카드: 처진 얼굴선·턱선→`/lifting/aptos` · 수술 없이 탄력→`/lifting` · 근본적 처짐(안면거상)→`/contact` ·
  눈밑 노화(지방재배치)→`/contact` · 피부결·모공·재생→`/antiaging/skinbooster`. 연령 표기 없이 고민 중심 카피.
- 이동 섹션의 배경 교대 유지를 위해 배경 클래스만 4곳 조정(Signature/Reviews→background, MediaNews/Location→white, 후기 카드→white).
- i18n: `sections.concerns` 21키 + `sections.equipment.viewAll`을 11개 로케일에 번역 삽입(en/ja/zh/zh-TW/vi/th/ru/fr/mn/ar 포함), `verify:i18n` 통과.
- **이벤트 계측**(기존 SSOT 재사용·확장): hero_consult→`cta_click/hero_cta`, 고민 카드→`concern_card_click(concern_id,destination)`
  (압토스 카드 = aptos_detail 대응), 해외 경로→`cta_click/foreign_patient`, 국내 경로→`cta_click/concern_path_domestic`,
  Signature 카드→`cta_click/signature_card`, 장비 카드·전체보기→`equipment_view`, 미디어 카드·더보기→`content_click/media`(blog_content 대응),
  후기 CTA·구글 리뷰→`content_click/review`, 길찾기→`get_directions`, 전화→`contact/phone`, Doctor CTA→`doctor_profile_view`,
  유튜브→`social_click`, 헤더/푸터 상담→`cta_click/header_consult·footer_cta`.
- 의료광고 유의사항을 `ConcernPathways.tsx` 상단 주석과 설계 문서 §6에 명시(최상급·보장 표현 금지, 후기·전후사진·효과 표현은 사전심의 대상).
  신규 카피는 '상담·안내·제안' 중심으로 작성.

## 7. 기존 기능과의 호환성

- 삭제·중복 생성 없음: 기존 섹션 9종 전부 유지(순서·배경만 변경), `/admin/analytics`(GA4)와 역할 분리 유지.
- `inflow_leads.channel`(문의 수단)·`agency`·`treatment`(원문)·`note` 의미 그대로 유지 — 기존 입력 워크플로 무변경.
- 통계 탭의 기존 지표(신규 연락/예약/내원, 퍼널, 채널 비교, 에이전시 vs 직접≒해외 대행사 그룹, 일별 추세)는
  대시보드가 동일 산식(발생일 기준)으로 포함. CSV는 기존 14열 순서 유지 + 신규 열 후미 추가.
- 신규 DB 필드는 전부 NULL/DEFAULT — 배포 중인 프론트가 즉시 재배포되지 않아도 동작.
- 검토 탭 반영은 누락 필드만 채우고 기존 값은 덮어쓰지 않음.

## 8. 테스트·빌드 결과 (2026-08-18 실측)

| 검사 | 결과 |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npx vitest run` | ✅ **158 passed** (기존 99 + 신규 59: classify 17 / stats 17 / csv 6 / utm 16 등) |
| `npm run verify:i18n` | ✅ 11개 로케일 동기화 (신규 22키 포함) |
| `npx eslint src` | ✅ **54 errors / 72 warnings** — 베이스라인(57/91) 대비 **감소**, 델타 증가 0. 신규 파일 잔여 3건은 코드베이스 공통 fetch-on-mount 패턴에 대한 react-compiler 규칙(기존 admin 페이지들과 동일 유형) |
| `npm run build` | ✅ exit 0 (prebuild verify:i18n 포함, TLS 프록시 우회 env 사용) |
| 프로덕션 프리뷰 스모크 (`next start` + Playwright) | ✅ `/ko` 섹션 순서가 목표 위계와 정확히 일치(Hero→CoreValues→**Concerns**→Signature→Doctor→Reviews→MediaNews→**Equipment**→Location), 배경 완전 교대. 신규 섹션·경로 카드 렌더 스크린샷: 루트 `smoke-concerns-section-ko.png`, `smoke-concern-paths-ko.png`, `home-ko-full.png` |
| 다국어 스모크 | ✅ en/ja/zh/th 신규 카피 SSR 확인, ar RTL+아랍어 확인 |
| admin 게이트 | ✅ `/admin/login` 200, `/admin/marketing` 미인증 → login 리다이렉트 |
| UTM E2E | ✅ `/ko?utm_source=…` 방문 시 sessionStorage 첫 터치 저장 확인 (4필드) |
| DB 사후 점검 | ✅ `inflow_leads` 202행 무변화·표준화 필드 전부 미기록, 신규 테이블 0행, FK 제약명 = 타입 정의 일치 |

참고: 로컬 프리뷰에서 `/icon.svg` 500 콘솔 에러 1건 — 이번 변경과 무관한 로컬 `next start` 환경 이슈(변경 파일 아님).
전체 페이지 캡처(`home-ko-full.png`)의 하단 공백은 `whileInView` 스크롤 애니메이션 특성(뷰포트 진입 전 opacity 0)으로 정상.

## 9. 과거 데이터에서 계산할 수 없는 지표 (정직성 명세)

| 지표 | 사유 | 화면 처리 |
|---|---|---|
| 과거 결제 건수·금액, 내원→결제 전환율 | `paid` 이력이 없음(2026-08-18 이전) | 소급 입력 전까지 0 또는 '–' |
| 과거 취소·노쇼 | 기록 자체가 없음 | 소급 입력 필요 |
| CAC·CPL·ROAS | 광고비 데이터가 전무 | **'데이터 없음'** 표기(0 금지). 캠페인에 광고비 입력 시부터 계산 |
| 콘텐츠 지표(조회 등) | 게시기록이 없었음 | 신규 입력분부터. 미입력은 '–' |
| 콘텐츠→유입 귀속 | UTM 미수집 과거분은 확인 불가 | `inferred/unknown`으로만 수동 연결 가능 |
| kakao/phone 55건의 유입 경로 | 출처 단서 없음 | 미분류 유지(검토 탭에서 사람이 판단) |
| 과거 UTM | 수집 시작 전 | `consultation_requests` 신규 제출부터 적재 |

## 10. 사람이 결정해야 하는 사항

1. **표준화 검토 실행**: `/admin/inflow → 표준화 검토`에서 과거 202건 후보를 확인·반영(자동 반영 안 함). '확실'만 일괄 선택 기능 제공.
2. **결제·취소노쇼 소급 입력 범위**: 6~8월 리드에 결제 정보를 소급할지, 이번 달부터 쌓을지.
3. **안면거상·지방재배치 상세 페이지 신설 여부**: 현재 고민 카드가 `/contact`로 연결(페이지 부재). 신설 시 카드 링크 1줄 교체.
4. **광고비 입력 규칙**: 캠페인 단위 총액 vs 월별 분할(현재 총액 1필드). 대행사 수수료 포함 여부.
5. **CAC 정의 채택**: 현재 리드당 비용(CPL)과 결제환자당 비용(CAC) 병기 — 병원 내부 기준 확정 필요.
6. **`consultation_requests` ↔ `inflow_leads` 연동**: 홈페이지 폼 리드를 유입 통계에 자동 편입할지(현재 별도. status도 전부 pending으로 방치 상태).
7. **후기·전후사진 재개 시 의료광고 사전심의** 절차(코드 주석·설계 문서에 플래그).
8. **운영 문서 갱신**: `documents/운영_권고_2026-06.md`의 입력 당번 가이드에 신규 필드(국내외/경로/태그/결제) 기입 규칙 추가 권장.

## 11. 후속 반영 (2026-08-18 2차 — 운영 결정 사항 적용)

§10의 결정에 따라 다음을 추가 반영했다.

1. **과거 202건 표준화 검토·반영 완료** — 규칙 후보 전건을 육안 검토(원문 덤프) 후 34건 오버라이드를 더해 적용:
   - 오탐 수정: '바비톡신청'의 &lsquo;톡신&rsquo;→보톡스 오인식 제거, 축약어(턱보/스보/얼전스보/울써마지/미간보), 리투오→스킨부스터
   - 노트 근거 재분류: 기존 고객 가족·추천→지인 소개(6건), 네이버지도→플레이스, &lsquo;업무폰&rsquo;은 대행사가 아니므로 위챗으로, 픽클스 유입/호주분·중국인·왓츠앱 문의→해외 등
   - 결과: 국내 83 / 해외 118 / 미분류 1(판단 불가 명시 유지) · 유입 경로 156건 분류(해외 대행사 104, 소개 16, 홈페이지 12, 워크인 7, 네이버 검색 6, 앱 5, …), **46건은 출처 단서가 없어 정직하게 미분류** · 시술 태그 176건(보톡스 44, 필러 30, 울쎄라 25, …)
   - 전건 `classified_at` 기록 → 표준화 검토 큐 0건(신규 입력분만 다시 쌓임). 기존 값 덮어쓰기 0건.
   - 반영 스크립트는 규칙 엔진 이식본에 센티널 자가검증(단위 테스트 기대값 대조)을 포함해 실행.
2. **결제 정보**: 소급하지 않음 — 기능 도입 시점 이후 입력분만 집계(결정 반영, 작업 없음).
3. **안면거상·지방재배치 페이지**: 보류 확정 — 고민 카드는 `/contact` 연결 유지. 페이지 신설 시 `ConcernPathways.tsx`의 href 1줄씩만 교체하면 된다.
4. **광고비·CAC 규칙 확정(권장안 채택)** — ① 광고비는 **수수료·VAT 포함 총지출**을 캠페인 단위 총액으로 입력 ② 월을 넘기는 장기 집행은 **월 단위로 캠페인을 분리** 등록(스키마 변경 없이 기간 비교 가능) ③ **CAC = 광고비 ÷ 결제 환자 수**를 공식 지표로, 리드당 비용(CPL)은 보조 지표로 병기. 관리자 화면 캡션 2곳에 명시.
5. **홈페이지 폼 → 유입 통계 자동 연동 구현** — 마이그레이션 `039_consultation_inflow_link.sql`(`inflow_leads.consultation_id` UNIQUE FK, 중복 연동 원천 차단) + `src/lib/inflow/consultationImport.ts`(+테스트 12건) + 상담 API 3종에 `after()` 배선:
   - 매핑: 접수일(KST) / 문의 수단 website / 유입 경로 홈페이지·폼 유형(상담 폼·문의 페이지·빠른 상담바) / 국내외 = 페이지 로케일(ko=국내, 기타 지원 로케일=해외, 미상=미분류) / 시술 태그 = 규칙 &lsquo;확실&rsquo;만 / 비고에 자동 연동 표식·경로·이메일
   - **UTM 코드가 캠페인·콘텐츠 코드와 일치하면 캠페인 자동 연결 + 콘텐츠 &lsquo;직접(direct)&rsquo; 귀속 자동 기록** (UTM 확인은 direct 근거라는 택소노미 정의 그대로)
   - 연동 실패는 로그만 남기고 폼 응답에 영향 없음. 과거 64건은 수동 기록과의 중복 위험 때문에 소급하지 않음(전 항목 2번 결정과 동일 원칙).
6. **의료광고 심의**: 보류 — 플래그 주석·문서 유지.

## 12. 알려진 한계·기존 이슈 재플래그 (이번 범위 외)

- 관리자 로그인 자격증명이 없어 **admin UI는 로그인 화면까지만 라이브 스모크** — 대시보드·검토 로직은 단위 테스트 59건으로 검증.
- `react-hooks/set-state-in-effect` 3건(fetch-on-mount 패턴)은 이 코드베이스 전반의 기존 패턴과 동일 — src 전체 lint는
  베이스라인 57→**54 errors**(감소), 델타 증가 없음.
- 기존 이슈 유지(이번 작업과 무관, IMPROVEMENT_PLAN 참조): form-01(비한국어 상담폼 제출 불가 — **UTM 저장도 이 폼에선 제출 성공 시에만 유효**),
  sec-01(/api/instagram 토큰 노출), `scripts/migrate_manual.js`의 **DB 접속 문자열 하드코딩**(신규 스크립트는 .env.local 참조로 작성함 — 기존 파일 정리 권장).
- 유입 대시보드는 5,000행 클라이언트 집계(현행 패턴) — 수년치 누적 시 서버 집계 전환 검토.
