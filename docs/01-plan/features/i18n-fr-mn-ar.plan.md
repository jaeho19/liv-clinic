# Plan: 다국어 3개 추가 — 프랑스어 · 몽골어 · 아랍어 (8 → 11 locales)

> **Feature**: `i18n-fr-mn-ar`
> **Phase**: Plan
> **Created**: 2026-05-11
> **Owner**: jaeho19@gmail.com
> **Related**:
> - `multilingual-expansion` (Phase 1 완료 — zh-TW, vi, th, ru 추가됨)
> - `i18n-language-switcher` (완료, matchRate 96%)
> - `zh-i18n-fix` (선행 — `treatmentsI18n.ts` 도입)

---

## 1. 배경 (Background)

`multilingual-expansion` Phase 1로 4개 → 8개 locale 확장이 완료된 상태(`ko · en · ja · zh · zh-TW · vi · th · ru`). 이번 작업은 동일 plan의 **Phase 2(`mn`)와 Phase 3(`ar`)를 통합**하고, 원안에 없던 **프랑스어(`fr`)를 추가**한다.

### 추가 사유

| 언어 | 시장 근거 | 의료관광 의의 |
|------|-----------|----------------|
| 🇫🇷 **프랑스어 (`fr`)** | 프랑스·벨기에·스위스·퀘벡 + 프랑스어권 아프리카(모로코·튀니지·세네갈) 의료관광 수요. 영어 비선호 환자 대응. | 유럽 안티에이징·리프팅 시장 진입 게이트. 기존 `en` fallback의 한계 보완. |
| 🇲🇳 **몽골어 (`mn`)** | 2024 한국 의료관광 통계상 몽골 환자 안티에이징/리프팅 급증. RE:BERRY · DA · 원진 등 강남 톱티어 클리닉 표준 지원. | 객단가 높은 안티에이징 환자군. 키릴 문자라 러시아어 인프라 재사용. |
| 🇸🇦 **아랍어 (`ar`)** | UAE·사우디·쿠웨이트 의료관광 고소비층. JK·DA·RE:BERRY 모두 지원. | LIV 프리미엄 포지셔닝과 직결. RTL 도입은 본 PDCA 핵심 과제. |

### 강남 톱티어 클리닉 다국어 격차 (재확인)

| 클리닉 | 언어 수 | `fr` | `mn` | `ar` |
|--------|--------|------|------|------|
| DA 성형외과 | 10 | ❌ | ✅ | ✅ |
| 원진성형외과 | 9 | ❌ | ❌ | ❌ |
| 바노바기 | 9 | ❌ | ❌ | ❌ |
| RE:BERRY | 8 | ❌ | ✅ | ✅ |
| JK 성형외과 | 7 | ❌ | ❌ | ✅ |
| **LIV (본 작업 후)** | **11** | ✅ | ✅ | ✅ |

본 작업 완료 시 **강남 톱티어 대비 1위 언어 커버리지**(11개, `fr` 신규 도입은 차별화 포인트).

---

## 2. 목표 (Goals)

1. `fr`, `mn`, `ar` 3개 locale 추가 → 총 **11개 언어 지원**
2. **RTL 레이아웃 인프라 구축** (아랍어 도입 = 사이트 전체 RTL 대응 시발점)
3. 기존 8개 locale 회귀 0건
4. `LOCALE_META.dir` (Phase 3 hook으로 이미 예약됨) 실사용 활성화
5. Tailwind logical properties로 점진적 마이그레이션 시작
6. 폰트: 아랍어(`Noto Sans Arabic`) 추가, 몽골어는 키릴 글리프 검증, 프랑스어는 라틴 그대로

---

## 3. 범위 (Scope)

### In Scope

#### A. i18n 인프라
- `src/i18n/routing.ts` — `LOCALES` 배열에 `'fr', 'mn', 'ar'` 추가
- `src/i18n/locales-meta.ts` — `LOCALE_META`에 3개 항목, `LOCALE_ORDER` 재정렬, `ar`에 `dir: 'rtl'` 활성화
- `src/messages/fr.json`, `src/messages/mn.json`, `src/messages/ar.json` — `ko.json` 구조 기반 신규 번역 파일
- `src/lib/treatmentsI18n.ts` — `FR`, `MN`, `AR` `LocaleMap` 추가, `MAPS`에 등록 (현재 `ZH`/`EN`/`JA`만 있음)

#### B. RTL 레이아웃 (아랍어 전용)
- `src/app/[locale]/layout.tsx` — `<html lang={...} dir={LOCALE_META[locale].dir ?? 'ltr'}>` 적용
- `src/app/globals.css` — RTL 보조 유틸리티(필요 시) 정의
- `tailwind.config.ts` — RTL 플러그인 검토(`tailwindcss-rtl` 또는 logical properties 표준 사용)
- **Tailwind 좌우 클래스 logical 화** (필수 컴포넌트만, 단계적):
  - `ml-* → ms-*`, `mr-* → me-*`
  - `pl-* → ps-*`, `pr-* → pe-*`
  - `left-* → start-*`, `right-* → end-*`
  - `text-left → text-start`, `text-right → text-end`
  - `border-l → border-s`, `border-r → border-e`
  - `rounded-l → rounded-s`, `rounded-r → rounded-e`
- **방향성 컴포넌트 분기**:
  - Hero 슬라이드 전환 방향 (Framer Motion `x: 100 → x: -100`)
  - 화살표 아이콘(`→` 류 SVG) 좌우 반전(`scaleX(-1)` 또는 logical SVG)
  - LanguageSwitcher 드롭다운 정렬
  - FloatingCTA 좌우 위치
  - 메뉴 슬라이드 인 방향
  - 페이지네이션/탭 인덱스 순서

#### C. 폰트
- `src/styles/fonts.ts` — `Noto_Sans_Arabic` 추가(`subsets: ['arabic']`)
- `src/app/[locale]/layout.tsx` — `locale === 'ar'` 시 Arabic 폰트 클래스 분기
- 몽골어(키릴): `pretendard` 키릴 글리프 사전 검증, 미흡 시 `Noto Sans Mongolian Cyrl` 추가 검토

#### D. SEO·사이트맵
- `src/app/sitemap.ts` — 3개 locale alternates 추가
- `src/lib/seo.ts` — `hreflang` alternate에 `fr-FR`, `mn-MN`, `ar-SA` 동기화
- 11개 locale × 약 73 페이지 = +219 URL을 sitemap에 등록

#### E. 검증
- `scripts/verify-locale-keys.mjs` — 11개 locale 모두 `ko.json` 키와 100% 동기화 검증
- `npx tsc --noEmit` 0 errors
- `npm run build` 0 errors, missing key warning 0건
- 수동 스모크: `/fr`, `/mn`, `/ar` 메인·시술 페이지 + 기존 8개 locale 회귀

### Out of Scope

- 번역 품질 네이티브 검수(전문 검수자 외주 = 별도 작업)
- 시술 가격·이벤트 등 시장별 차별 콘텐츠(현행 ko 미러링)
- 다국어 코디네이터 운영(전화·카톡 응대)
- DB 콘텐츠 다국어화(이벤트·팝업 Supabase 컬럼은 단일 언어 유지, fallback 정책으로 처리)
- `/admin` 다국어화(ko 고정)
- 캄보디아어·미얀마어·인도네시아어·스페인어 추가
- 사이트 전체 컴포넌트 RTL 완전 마이그레이션(본 PDCA에서는 **유저가 보이는 핵심 경로**만 RTL 검증, 관리자 미사용 영역은 후속 PDCA)

---

## 4. 요구사항 (Requirements)

### Functional Requirements

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | `/fr`, `/mn`, `/ar` URL 접근 시 각 locale 페이지가 정상 렌더된다 | P0 |
| FR-02 | LanguageSwitcher 드롭다운에 **11개 언어**가 정의된 순서로 노출되며 전환 동작 | P0 |
| FR-03 | 모든 신규 locale에서 핵심 페이지(메인·about·signature·lifting·antiaging·laser·medical·gallery·promotion·contact)가 깨지지 않는다 | P0 |
| FR-04 | `/ar` 접근 시 `<html dir="rtl">`로 렌더된다 | P0 |
| FR-05 | `/ar`에서 메인 페이지 레이아웃이 RTL로 자연스럽게 표시된다 (헤더 네비·hero·footer·LanguageSwitcher) | P0 |
| FR-06 | `/fr`, `/mn`(LTR)은 기존 8개 locale과 동일하게 LTR로 렌더된다 | P0 |
| FR-07 | sitemap.xml에 신규 3개 locale URL이 등록된다 | P0 |
| FR-08 | hreflang 메타가 `fr-FR`, `mn-MN`, `ar-SA`(또는 `ar`)을 포함한다 | P0 |
| FR-09 | TREATMENTS 데이터의 `targetAreas/idealFor/cautions/faqs/process/duration/anesthesia/recovery/results`가 신규 3개 locale에서 현지어로 표시된다 | P0 |
| FR-10 | Footer·Header·MobileMenu·FloatingCTA 텍스트가 신규 locale에서 현지어 | P0 |
| FR-11 | 시술 상세 페이지(ulthera·thermage·shurink·inmode·density·thread·botox·filler·skinbooster)가 신규 locale에서 정상 동작 | P1 |
| FR-12 | RTL 모드에서 화살표 아이콘이 좌우 반전된다 (`→` → `←`) | P1 |
| FR-13 | RTL 모드에서 hero 슬라이드 전환 방향이 자연스럽다 | P2 |
| FR-14 | LanguageSwitcher 정렬 순서: `ko · zh · zh-TW · ja · en · fr · vi · th · mn · ru · ar` (의료관광 우선순위 + RTL 마지막 배치) | P2 |

### Non-Functional Requirements

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-01 | 빌드 시간 증가 최소화 | Phase 1 완료 시점 대비 +12% 이내 |
| NFR-02 | 번들 크기 증가 최소화 | locale별 dynamic import 유지, 초기 번들 +5KB 이내(Arabic 폰트 제외) |
| NFR-03 | 번역 누락 키 0건 | `ko.json` 키 구조 100% 동기화 (verify-locale-keys.mjs 통과) |
| NFR-04 | 폰트 글리프 커버리지 | 프랑스어 diacritics(é, è, ç, ô, à, ù), 몽골어 키릴(Ө, Ү, ё), 아랍어 28자 모두 렌더 |
| NFR-05 | TypeScript strict 호환 | `tsc --noEmit` 0 errors |
| NFR-06 | 기존 8개 locale 회귀 0건 | 수동 스모크 테스트 ko/en/ja/zh/zh-TW/vi/th/ru 메인·시술 페이지 정상 |
| NFR-07 | Lighthouse SEO 점수 유지 | 신규 locale 메인 페이지 ≥90점 |
| NFR-08 | RTL 핵심 경로 시각 회귀 0건 | `/ar` 메인·시술 1개 페이지 수동 검수 (overflow·텍스트 잘림 없음) |
| NFR-09 | 폰트 로딩 FOUT 방지 | Arabic 폰트 `display: 'swap'` + preload |

---

## 5. 제약사항 (Constraints)

### 5.1 RTL 도입 비용
- 사이트 전체 `ml-*`/`mr-*` 등 좌우 클래스 사용처가 다수. **본 PDCA에서는 유저 가시 핵심 경로 5종(Header·Hero·Section card·Footer·CTA)**만 logical 화. 나머지는 시각적 깨짐 발견 시 hotfix.
- Tailwind 4.x logical properties는 v3.3+부터 표준 지원. 별도 플러그인 불필요.

### 5.2 번역 비용
- 5,616줄 × 3 locale ≈ 17,000 항목 추가. LLM 1차 번역 + 의료 전문 용어집(보톡스/필러/HIFU/RF 등) 사전 정의로 품질 보장. 네이티브 검수는 출시 후 단계적.

### 5.3 폰트
- **프랑스어**: Pretendard Variable Latin glyph로 충분. `é è ç ô ù â à` 등 diacritics 모두 커버.
- **몽골어**: 현대 몽골은 키릴 사용. Pretendard Variable에 키릴 포함 가정(러시아어 도입 시 이미 검증). 전통 몽골 문자(수직 글자)는 Out of Scope.
- **아랍어**: 별도 폰트 필수. `Noto_Sans_Arabic` (`next/font/google`) 사용. `--font-arabic` CSS variable로 `[lang="ar"]` 시 적용.

### 5.4 BCP 47 코드
- `fr` (프랑스 본토 + 프랑스어권 디폴트), URL은 `/fr`
- `mn` (몽골, 키릴), URL은 `/mn`
- `ar` (아랍어 표준, MSA — Modern Standard Arabic), URL은 `/ar`

### 5.5 RTL 영향 컴포넌트 (수정 대상 후보)
- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/layout/FloatingCTA.tsx`
- `src/components/layout/LanguageSwitcher.tsx`
- `src/components/layout/MobileMenu.tsx`
- `src/components/sections/Hero*.tsx`
- `src/components/ui/Card.tsx`, `Button.tsx`
- `[locale]/page.tsx` 메인
- 시술 상세 페이지의 process step 인디케이터

(전수 조사는 Design 단계에서 `grep -rE "(^|\s)(m[lr]|p[lr]|left|right|text-(left|right)|border-[lr]|rounded-[lr])-"` 로 산출)

### 5.6 Next.js 16 호환
- `localePrefix: 'always'` 유지. 모든 신규 URL은 `/{locale}/...`.
- App Router의 `<html lang dir>`은 `src/app/[locale]/layout.tsx`에서 `params.locale` 기반 동적 설정.

### 5.7 검색엔진 인덱싱
- 신규 locale URL은 sitemap 갱신 후 Google Search Console 재제출 권장. 인덱싱은 수일~수주 소요.

---

## 6. 수용 기준 (Acceptance Criteria)

- [ ] `/fr`, `/mn`, `/ar` 메인 페이지 접속 시 각 locale 콘텐츠로 정상 렌더
- [ ] LanguageSwitcher에 **11개 언어**가 정의된 순서로 노출, 모든 항목 전환 동작
- [ ] `/ar` 렌더 시 DOM `<html dir="rtl">` 확인
- [ ] `/ar` 메인 페이지 핵심 5종(Header·Hero·Section·Footer·CTA) RTL 정상 표시(텍스트 정렬·여백·화살표 방향)
- [ ] `/fr`, `/mn`은 `<html dir="ltr">`로 렌더
- [ ] 시술 상세 페이지 9종이 신규 3개 locale에서 `targetAreas`/`process`/`faqs` 등 현지어 표시
- [ ] Footer·Header·MobileMenu·FloatingCTA에 신규 locale에서 한국어 잔존 0건(고유명사 제외)
- [ ] `npx tsc --noEmit` 0 errors
- [ ] `npm run build` exit 0, missing translation key warning 0건
- [ ] `npm run lint` 0 errors
- [ ] `node scripts/verify-locale-keys.mjs` 통과(11개 locale 100% 동기화)
- [ ] sitemap.xml에 신규 locale URL 포함(수동 fetch 확인)
- [ ] hreflang 메타가 11개 alternate 노출
- [ ] 기존 8개 locale(`ko/en/ja/zh/zh-TW/vi/th/ru`) 메인·시술 페이지 회귀 0건
- [ ] 폰트 깨짐(tofu) 없이 3개 locale 모든 페이지 표시
- [ ] Arabic 폰트가 `/ar`에서만 로드(다른 locale에서 미로드 = 번들 격리)

---

## 7. 예상 구조 (변경 파일)

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `liv-clinic/src/i18n/routing.ts` | 수정 | `LOCALES` 배열에 `'fr', 'mn', 'ar'` 추가 |
| `liv-clinic/src/i18n/locales-meta.ts` | 수정 | `LOCALE_META`에 3개 항목, `LOCALE_ORDER` 11개로 확장, `ar`에 `dir: 'rtl'` 활성화 |
| `liv-clinic/src/messages/fr.json` | **신규** | `ko.json` 구조 기반 프랑스어 번역 (~5,600줄) |
| `liv-clinic/src/messages/mn.json` | **신규** | 몽골어 번역 |
| `liv-clinic/src/messages/ar.json` | **신규** | 아랍어 번역 |
| `liv-clinic/src/lib/treatmentsI18n.ts` | 수정 | `FR`, `MN`, `AR` `LocaleMap` 추가, `MAPS` 등록 (현재 `ZH/EN/JA`만 있음 → 8개 미반영 locale 포함하여 별도 후속 작업으로 확장 권장; 본 PDCA는 우선 신규 3개 추가) |
| `liv-clinic/src/app/[locale]/layout.tsx` | 수정 | `<html lang dir>` 동적 적용, Arabic 폰트 클래스 분기 |
| `liv-clinic/src/styles/fonts.ts` | 수정 | `Noto_Sans_Arabic` 추가, `--font-arabic` variable |
| `liv-clinic/src/app/globals.css` | 수정 (조건부) | RTL 유틸리티(필요 시) |
| `liv-clinic/src/app/sitemap.ts` | 수정 | locale alternates 3개 추가 |
| `liv-clinic/src/lib/seo.ts` | 수정 | hreflang alternate 11개 동기화 |
| `liv-clinic/src/components/layout/Header.tsx` | 수정 | logical 클래스 마이그레이션 |
| `liv-clinic/src/components/layout/Footer.tsx` | 수정 | logical 클래스 마이그레이션 |
| `liv-clinic/src/components/layout/FloatingCTA.tsx` | 수정 | RTL 위치 분기 |
| `liv-clinic/src/components/layout/MobileMenu.tsx` | 수정 | 슬라이드 방향 분기 |
| `liv-clinic/src/components/sections/Hero*.tsx` | 수정 | 슬라이드 애니메이션 방향 분기 |
| `liv-clinic/scripts/verify-locale-keys.mjs` | 수정 (필요 시) | 11개 locale 인식 확인 |

**총 변경**: 신규 3 파일, 수정 약 12~15 파일. 폴더 추가 없음.

---

## 8. 리스크 및 대응

| 리스크 | 영향도 | 대응 |
|--------|--------|------|
| 1차 LLM 번역 의료 전문 용어 품질 저하 | High | "보톡스/필러/HIFU(고강도 집속 초음파)/RF(고주파)/리프팅/안티에이징" 등 핵심 용어집 사전 정의. 프랑스·아랍 의료 표준 용어 참조. 출시 후 네이티브 검수 단계적 진행. |
| RTL 마이그레이션 누락으로 `/ar` 레이아웃 깨짐 | **High** | 핵심 5종 페이지·컴포넌트 수동 시각 검수. logical properties 마이그레이션은 grep + 우선순위 기반 단계적 적용. 발견 시 hotfix. |
| 아랍어 폰트 미로드로 tofu 표시 | High | `next/font/google`의 `Noto_Sans_Arabic` `preload: true` + `display: 'swap'`. 빌드 후 `/ar` 시각 검증 필수. |
| 몽골어 키릴 글리프 누락 (Pretendard) | Medium | 러시아어 추가 시점에 검증되었을 것으로 추정. 미흡 시 `Noto Sans` Cyrillic fallback. |
| 프랑스어 diacritics 잘림 | Low | Pretendard Latin glyph 충분. 빌드 후 `/fr` 시각 검증. |
| Framer Motion 슬라이드 방향 RTL에서 부자연스러움 | Medium | `useLocale()` + `dir` 기반 `x` 값 부호 분기 헬퍼 도입. Hero·MobileMenu만 우선 적용. |
| `treatmentsI18n.ts`의 vi/th/ru/zh-TW가 여전히 한국어 fallback인 상태에서 fr/mn/ar만 추가되면 일관성 결여 | **High** | **선결**: Design 단계에서 vi/th/ru/zh-TW 누락 분석 → 본 PDCA에서 fr/mn/ar만 추가하되 누락 4개 locale은 별도 hotfix PDCA로 분리 권고. (사용자 확인 필요) |
| 빌드 시간 +30% 이상 증가 | Medium | dynamic import 유지로 mitigated. 측정 후 NFR-01 위반 시 lazy boundary 추가. |
| sitemap.xml +219 URL로 폭증 | Low | Google Search Console 재제출. 11 × 73 = 803 URL은 sitemap 단일 파일 한도(50,000) 내. |
| Supabase 이벤트·팝업이 신규 locale에서 한국어 표시 | Medium | UX fallback 정책: 영어 → 한국어 순. 베트남어·태국어 출시 시 정책 확정되었을 것 가정, 재확인. |
| Cloudflare/Vercel CDN locale routing 충돌 | Low | `localePrefix: 'always'`로 명시적 prefix. 충돌 가능성 최소. |
| Arabic 폰트 추가로 번들 크기 급증 | Low | `next/font/google`의 자동 서브셋팅으로 `/ar` 페이지만 로드. 다른 locale 영향 없음. |
| 번역 파일 5,600줄 × 3 = 16,800줄 → 리뷰 부담 | Medium | LLM 번역 후 핵심 페이지(메인·시술 상세) 우선 검수. Long-tail 페이지는 베타 라벨 부착도 옵션. |

---

## 9. 구현 순서 (개략)

1. **Design 단계 산출물**: `Locale` 타입 영향 사용처 전수 조사, RTL 마이그레이션 대상 컴포넌트 grep 결과, 폰트 분기 코드 패턴 명세, 번역 키 동기화 자동화 스크립트.
2. **Do 1단계 (인프라)**:
   - `routing.ts` + `locales-meta.ts`에 3개 추가, `ar` → `dir: 'rtl'`
   - `[locale]/layout.tsx`에서 `dir` 동적 적용
   - `fonts.ts`에 `Noto_Sans_Arabic` 추가
3. **Do 2단계 (번역)**:
   - `ko.json` 기반 `fr.json` / `mn.json` / `ar.json` 1차 생성
   - `verify-locale-keys.mjs` 통과
4. **Do 3단계 (RTL)**:
   - 핵심 5종 컴포넌트 logical properties 마이그레이션
   - Hero/MobileMenu 슬라이드 방향 분기
   - `/ar` 시각 검수
5. **Do 4단계 (Treatments)**:
   - `treatmentsI18n.ts`에 `FR/MN/AR` 추가, `MAPS` 등록
6. **Do 5단계 (SEO/Sitemap)**:
   - sitemap·hreflang 동기화
7. **빌드·타입체크·스모크 → Analyze → Iterate → Report**

---

## 10. 다음 단계 (Next Phase)

- `/pdca design i18n-fr-mn-ar` — RTL 마이그레이션 컴포넌트 전수 조사, 폰트 분기 코드 패턴, 번역 키 자동화, treatmentsI18n 확장 전략 확정
- `/pdca do i18n-fr-mn-ar` — 인프라·번역·RTL·SEO 5단계 순차 구현
- `/pdca analyze i18n-fr-mn-ar` — 11개 locale 회귀 검증 + RTL 시각 검수
- `/pdca report i18n-fr-mn-ar` — 완료 보고서

---

## 11. 결정 필요 사항 (Design 진입 전 확인)

1. **`treatmentsI18n.ts` 누락 4개 locale 처리**: 현재 `vi/th/ru/zh-TW`가 한국어 fallback인 상태. 본 PDCA에서 같이 보완할지(범위 확장), 별도 hotfix로 분리할지 선택. **권장: 분리** (본 PDCA 집중도 보존).
2. **Arabic locale code**: `ar` (MSA) 단일로 시작 vs `ar-SA`·`ar-AE` 분기. **권장: `ar` 단일** (시장 진입 후 분기).
3. **RTL 마이그레이션 범위**: 핵심 5종만 vs 전체. **권장: 핵심 5종 + 발견 즉시 hotfix**.
4. **번역 검수 정책**: LLM 1차 → 출시 → 네이티브 검수 vs 출시 전 부분 검수. **권장: LLM + 의료 용어집 + 출시 후 검수**.
5. **`LOCALE_ORDER` 순서**: 본 plan은 `ko · zh · zh-TW · ja · en · fr · vi · th · mn · ru · ar`. 변경 의향 확인.

---

## 12. 참고 자료

### 시장 데이터
- 2024 외국인환자 유치실적 통계분석보고서 (KHIDI, 2025-07)
- 보건복지부 보도자료 (2025-04-02): "2024년 외국인 환자 117만 명"
- 의료관광 신흥시장: 몽골(+안티에이징 급증), UAE(고소비 안티에이징)
- 프랑스어권 의료관광: 모로코·튀니지·세네갈·캐나다 퀘벡

### 강남 클리닉 다국어 벤치마크
- DA 성형외과 (mn·ar 지원)
- RE:BERRY (mn·ar 지원, fr 미지원)
- JK 성형외과 (ar 지원)

### 기술 자료
- next-intl docs: <https://next-intl.dev/docs/getting-started/app-router>
- Tailwind Logical Properties: <https://tailwindcss.com/docs/margin#using-logical-properties>
- `Noto_Sans_Arabic` next/font: <https://nextjs.org/docs/app/api-reference/components/font#google-fonts>
- BCP 47 language tags
- 선행 PDCA: `docs/01-plan/features/multilingual-expansion.plan.md`, `docs/01-plan/features/zh-i18n-fix.plan.md`
- 현재 i18n: `liv-clinic/src/i18n/routing.ts:10`, `liv-clinic/src/i18n/locales-meta.ts:31`
