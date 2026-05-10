# Plan: 다국어 7개 추가 확장 (4 → 11 locales)

> **Feature**: `multilingual-expansion`
> **Phase**: Plan
> **Created**: 2026-05-10
> **Owner**: jaeho19@gmail.com
> **Related**: `zh-i18n-fix` (선행 — 중국어 페이지 한국어 혼용 제거 완료)

---

## 1. 배경 (Background)

LIV 성형외과 웹사이트는 현재 **4개 locale**(`ko`, `en`, `ja`, `zh`)을 지원하나, 한국 의료관광 시장 데이터와 강남권 톱티어 클리닉 벤치마크 대비 다국어 커버리지가 부족하다.

### 시장 데이터 (2024 보건복지부/KHIDI)

- 한국 방문 외국인 환자 **117만명** (202개국, 전년 대비 +93%)
- 국적 TOP 5: 일본(44.1만) · 중국(26.1만) · 미국(10.2만) · **대만(8.3만, +550%)** · **태국(3.8만, +24%)**
- 베트남: 성형 환자 **+22% 성장**, 페이스컨투어 핵심 시장
- 몽골·러시아: 2025년 안티에이징/리프팅 환자 급증
- 미국 환자 2025년 **+70% 폭증** (17.3만)

### 강남 주요 성형외과 다국어 벤치마크

| 클리닉 | 언어 수 | 지원 언어 |
|--------|--------|-----------|
| DA 성형외과 | 10 | KR/EN/CN/JP/TH/VN/MN/RU/ID/AR |
| 원진성형외과 | 9 | + 캄보디아어 |
| 바노바기 | 9 | + 미얀마어 |
| RE:BERRY | 8 | EN/JP/CN/**TW**/TH/**ES**/MN/AR |
| JK 성형외과 | 7 | KR/EN/CN/JP/RU/AR/ID |
| **LIV (현재)** | **4** | KR/EN/JP/CN |

### 핵심 격차

LIV는 **신사역 프리미엄 안티에이징·리프팅** 포지셔닝(시그니처 프로그램, 울쎄라/써마지/슈링크/인모드/리쥬란/보톡스/필러). 30~40대 안티에이징 수요는 일본·대만·동남아 시장에 집중되어 있으나, 핵심 타겟인 **대만(번체 중국어)**과 **베트남·태국**이 미커버 상태.

---

## 2. 목표 (Goals)

1. **단계적**으로 7개 locale 추가 → 총 **11개 언어** 지원
2. 의료관광 TOP 7 국가(일본·중국·미국·대만·태국·러시아·베트남) 100% 커버
3. 강남 톱티어 클리닉(8~10개) 동급 수준 달성
4. RTL(아랍어) 도입 전 LTR locale 안정화 우선
5. 회귀 위험 없이 기존 4개 locale 동작 보존

---

## 3. 범위 (Scope)

### Phase 1 — LTR 4개 추가 (필수, 본 PDCA의 핵심 범위)

`zh-TW` · `vi` · `th` · `ru` 추가 → 총 **8개 locale**

### Phase 2 — LTR 2개 추가 (후속 PDCA)

`es` · `mn` 추가 → 총 **10개 locale**

### Phase 3 — RTL 1개 추가 (별도 PDCA, RTL 작업 포함)

`ar` 추가 → 총 **11개 locale**

### In Scope (Phase 1)

- `src/i18n/routing.ts` — `locales` 배열에 4개 추가
- `src/types/index.ts` — `Locale` union type 확장, `locales` 배열 동기화
- `src/messages/{zh-TW,vi,th,ru}.json` — `ko.json` 구조 그대로 4개 신규 번역 파일
- `src/components/layout/LanguageSwitcher.tsx` — 드롭다운 메뉴에 4개 항목 추가, locale union type 확장
- `src/lib/treatmentsI18n.ts` — `TreatmentL10n` locale override 4개 추가 (`zh-TW`, `vi`, `th`, `ru`)
- `src/app/sitemap.ts` — 신규 locale alternates 추가
- `src/lib/seo.ts` — hreflang alternate 링크 4개 추가
- `next-intl` 설정 검증 (locale prefix `/zh-TW`, `/vi`, `/th`, `/ru`)
- 폰트: 베트남어·태국어·러시아어는 기존 Pretendard/Cormorant Garamond 글리프 검증

### Out of Scope

- **번역 품질 검수**: 본 PDCA에서는 1차 번역 텍스트만 작성 (전문 검수자 외주는 별도 작업)
- **콘텐츠 현지화**: 시술 가격·이벤트·프로모션 등 시장별 차별화 콘텐츠 (현행 `ko` 콘텐츠 미러링)
- **상담 코디네이터 운영**: 다국어 전화·카톡 상담 인력 (운영 측면, 별도 검토)
- **Phase 2·3**: `es`, `mn`, `ar`는 본 PDCA 종료 후 별도 plan으로 진행
- **`/admin` 다국어화**: 관리자 페이지는 `ko` 고정 유지
- **DB 콘텐츠 다국어화**: Supabase 이벤트·팝업 데이터 (현재 단일 언어 → 별도 작업)

---

## 4. 요구사항 (Requirements)

### Functional Requirements

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | `/zh-TW`, `/vi`, `/th`, `/ru` URL 접근 시 각 locale 페이지가 정상 렌더된다 | P0 |
| FR-02 | LanguageSwitcher 드롭다운에 8개 언어가 노출되며 로케일 전환이 동작한다 | P0 |
| FR-03 | 모든 신규 locale에서 메인·about·signature·lifting·antiaging·laser·medical·gallery·promotion·contact 페이지가 깨지지 않는다 | P0 |
| FR-04 | `next-intl` notFound() 동작 — 미지원 locale 접근 시 404 (기존 4개 locale 동작 유지) | P0 |
| FR-05 | sitemap.xml에 신규 locale URL 4개 × 페이지 수만큼 alternate 등록 | P0 |
| FR-06 | hreflang 메타 태그가 `zh-TW`, `vi`, `th`, `ru`을 포함한다 | P0 |
| FR-07 | TREATMENTS 데이터(`targetAreas`, `idealFor`, `cautions`, `faqs`, `process`, `duration`, `anesthesia`, `recovery`, `results`)가 신규 4개 locale에서 현지어로 표시된다 | P0 |
| FR-08 | 플로팅 CTA(인스타·유튜브·전화) `aria-label`이 신규 locale에서도 올바르게 표시된다 | P1 |
| FR-09 | Footer·Header·MobileMenu 등 공통 컴포넌트 텍스트가 신규 locale에서 현지어로 표시된다 | P0 |
| FR-10 | LanguageSwitcher의 언어 정렬 순서: ko · zh · zh-TW · ja · en · vi · th · ru (시장 규모 기반) | P2 |

### Non-Functional Requirements

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-01 | 빌드 시간 증가 최소화 | `npm run build` 대비 +15% 이내 |
| NFR-02 | 번들 크기 증가 최소화 | locale별 메시지 dynamic import 유지 (`request.ts`의 `await import` 패턴) |
| NFR-03 | 번역 누락 키 0건 | `ko.json` 키 구조 100% 동기화, 빌드 시 next-intl missing key warning 0건 |
| NFR-04 | 폰트 글리프 커버리지 | 베트남어 diacritics, 태국어 자음·모음, 러시아어 키릴 문자가 깨지지 않음 |
| NFR-05 | TypeScript strict 호환 | `Locale` union 확장 후 `tsc --noEmit` 0 errors |
| NFR-06 | 기존 4개 locale 회귀 0건 | 수동 스모크 테스트로 ko/en/ja/zh 메인·시술 페이지 정상 |
| NFR-07 | Lighthouse SEO 점수 유지 | 신규 locale에서도 ≥90점 |

---

## 5. 제약사항 (Constraints)

- **`zh-TW` locale code**: BCP 47 표준은 `zh-Hant` 또는 `zh-TW` 모두 허용. **`zh-TW` 채택**(URL 가독성 + Next.js 관습). 기존 `zh`는 `zh-Hans` 의미 유지(코드는 `zh` 그대로).
- **번역 파일 크기**: 현재 `ko.json` ~3,991줄 / ~3,997줄(zh.json). 4개 추가 시 약 16,000줄 추가. dynamic import 유지로 초기 번들 영향 0.
- **번역 비용**: 4,000줄 × 4 locale ≈ 1.6만 항목. 1차 LLM 번역 후 부분 검수가 현실적. 예산·일정 별도 합의 필요.
- **하드코딩 locale union 4곳**: `LanguageSwitcher.tsx:28` (`'ko' | 'en' | 'ja' | 'zh'`), `treatmentsI18n.ts`, `routing.ts`, `types/index.ts`. 모두 `Locale` 타입 단일 출처로 통합 후 확장.
- **폰트 의존성**:
  - **러시아어(키릴)**: Pretendard Variable에 Cyrillic glyph 포함됨(검증 필요). 미포함 시 `Inter` fallback 검토.
  - **베트남어**: 라틴 + diacritics. Pretendard 미커버 가능성 → `Be Vietnam Pro` 또는 `Inter` fallback.
  - **태국어**: 별도 폰트 필요(`Noto Sans Thai`, `IBM Plex Sans Thai`).
  - 폰트 추가는 `liv-clinic/src/styles/fonts.ts`와 `[locale]/layout.tsx` 동적 클래스 적용으로 처리.
- **이벤트·팝업 콘텐츠**: Supabase 테이블이 단일 언어 컬럼 구조. 신규 locale에서는 ko 또는 en fallback 표시 (DB 다국어화는 별도 PDCA).
- **선행 작업**: `zh-i18n-fix`에서 `treatmentsI18n.ts` 도입됨. 본 작업은 동일 패턴을 4개 locale에 확장하는 형태.
- **Next.js 16 호환**: `localePrefix: 'always'` 유지 → 모든 신규 URL이 `/{locale}/...` 패턴.
- **검색엔진 인덱싱**: 새 locale URL 인덱싱은 sitemap 갱신 + Google Search Console 등록 후 수 일~수 주 소요.

---

## 6. 수용 기준 (Acceptance Criteria)

- [ ] `/zh-TW`, `/vi`, `/th`, `/ru` 메인 페이지 접속 시 각 locale 콘텐츠가 정상 렌더된다.
- [ ] LanguageSwitcher에 **8개 언어**가 정의된 순서로 노출되며, 클릭 시 현재 페이지의 동일 경로 다른 locale로 이동한다.
- [ ] 시술 상세 페이지 8개(ulthera/thermage/shurink/inmode/density/thread/botox/filler/skinbooster) 신규 locale에서 `targetAreas`/`process`/`faqs` 등이 현지어로 표시된다.
- [ ] Footer·Header·MobileMenu·FloatingCTA에 한국어/영어 잔존 텍스트가 0건이다 (고유명사 제외).
- [ ] `npx tsc --noEmit` → 0 errors.
- [ ] `npm run build` → exit 0, missing translation key warning 0건.
- [ ] `npm run lint` → 0 errors.
- [ ] sitemap.xml이 신규 locale URL을 포함한다 (수동 fetch 확인).
- [ ] hreflang 메타 태그가 8개 언어 alternate를 모두 노출한다.
- [ ] 기존 `/ko`, `/en`, `/ja`, `/zh` 메인·시술 페이지가 회귀 없이 동작한다.
- [ ] 폰트 깨짐(tofu) 없이 신규 4개 locale의 모든 페이지가 표시된다.

---

## 7. 예상 구조 (변경 파일)

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `liv-clinic/src/i18n/routing.ts` | 수정 | `locales` 배열에 `'zh-TW', 'vi', 'th', 'ru'` 추가 |
| `liv-clinic/src/types/index.ts` | 수정 | `Locale` union, `locales` 배열 동기화 (단일 출처) |
| `liv-clinic/src/messages/zh-TW.json` | **신규** | `ko.json` 구조 그대로 번체 중국어 번역 |
| `liv-clinic/src/messages/vi.json` | **신규** | 베트남어 번역 |
| `liv-clinic/src/messages/th.json` | **신규** | 태국어 번역 |
| `liv-clinic/src/messages/ru.json` | **신규** | 러시아어 번역 |
| `liv-clinic/src/components/layout/LanguageSwitcher.tsx` | 수정 | `languages` 배열에 4개 추가, locale union 확장, 정렬 순서 적용 |
| `liv-clinic/src/lib/treatmentsI18n.ts` | 수정 | `TreatmentL10n` locale override 4개 추가, `getLocalizedTreatment` 분기 |
| `liv-clinic/src/app/sitemap.ts` | 수정 | locale alternates 4개 추가 |
| `liv-clinic/src/lib/seo.ts` | 수정 | `generatePageMetadata` hreflang alternate 8개 동기화 |
| `liv-clinic/src/styles/fonts.ts` | 수정 (조건부) | 태국어 폰트(`Noto Sans Thai`) 추가 검토 |
| `liv-clinic/src/app/[locale]/layout.tsx` | 수정 (조건부) | locale별 폰트 클래스 분기 (태국어 한정) |

**폴더·파일 추가 없음** — 모든 변경은 기존 i18n 구조 안에서 확장.

---

## 8. 리스크 및 대응

| 리스크 | 영향도 | 대응 |
|--------|--------|------|
| 1차 LLM 번역 품질 저하 (의료 전문 용어) | High | "보톡스/필러/리프팅/안티에이징" 등 핵심 용어집 사전 정의. 출시 전 각 locale 네이티브 검수자 1회 리뷰. |
| 태국어 폰트 글리프 누락 | Medium | `Noto Sans Thai` 추가 + `[locale]/layout.tsx`에서 locale === 'th' 시 폰트 클래스 분기 |
| 베트남어 diacritics 깨짐 | Medium | 빌드 후 `/vi` 페이지에서 á, ấ, ự, ặ 등 시각 검증. 필요 시 `Be Vietnam Pro` 도입 |
| 러시아어 키릴 글리프 누락 | Low | Pretendard Variable에 Cyrillic 포함 여부 사전 검증. 미포함 시 시스템 sans-serif fallback |
| 빌드 시간 +30% 이상 증가 | Medium | dynamic import 유지로 mitigated. 측정 후 NFR-01 위반 시 lazy boundary 추가 |
| 번역 누락 키로 missing key warning | Medium | `scripts/check-locale-keys.mjs`(또는 동등) 자동화로 빌드 전 검증. 4개 신규 파일이 `ko.json`과 100% 키 일치 |
| 기존 locale 회귀 (`Locale` union 변경 영향) | Medium | 단일 출처(`types/index.ts`)로 통합 후 컴파일러가 모든 사용처 강제 검증 |
| sitemap.xml 폭증 (4 locale × 73 페이지 = +292 URL) | Low | Google Search Console 신규 sitemap 제출. robots.txt 영향 없음 |
| Supabase 이벤트·팝업이 신규 locale에서 한국어 표시 | Medium | UX 명시적 fallback 정책 (예: 베트남어 페이지에서 한국어 이벤트 표시 → 영어 우선 fallback 결정 필요) |
| Cloudflare/Vercel CDN locale routing 충돌 | Low | `localePrefix: 'always'`로 모든 URL이 명시적 prefix → 충돌 가능성 최소 |
| 번역 외주 비용·일정 미확정 | High | 본 PDCA Design 단계에서 LLM 1차 번역 + 부분 검수 범위 확정 |

---

## 9. 단계별 출시 전략

### Phase 1 (본 PDCA, ~2주 예상)
1. `Locale` 타입 통합 + `routing.ts`·`LanguageSwitcher` 확장
2. `ko.json` 기준 4개 locale JSON LLM 번역 생성
3. `treatmentsI18n.ts` locale override 4개 추가
4. 폰트·SEO·sitemap 업데이트
5. 빌드·타입체크·스모크 테스트
6. 스테이징 배포 → 네이티브 1차 리뷰 → 프로덕션

### Phase 2 (별도 PDCA, ~1주)
- `es`, `mn` 추가. Phase 1과 동일 패턴 반복. RTL 부담 없음.

### Phase 3 (별도 PDCA, ~2~3주)
- `ar` 추가. **RTL 레이아웃 작업 포함**:
  - `dir="rtl"` 동적 적용 (`[locale]/layout.tsx`)
  - Tailwind logical properties 마이그레이션 (`ml-* → ms-*`, `mr-* → me-*`, `pl-* → ps-*`, `pr-* → pe-*`)
  - 화살표 아이콘·슬라이더 좌우 반전
  - `Noto Sans Arabic` 폰트 추가
  - Framer Motion 슬라이드 애니메이션 방향 분기

---

## 10. 다음 단계 (Next Phase)

- `/pdca design multilingual-expansion` — `Locale` 타입 단일 출처 설계, `LanguageSwitcher` 확장 구조, locale별 폰트 분기 전략, 번역 키 동기화 자동화 스크립트 명세
- `/pdca do multilingual-expansion` — Phase 1 구현 (8개 locale)
- `/pdca analyze multilingual-expansion` — 수용 기준 기반 Gap 분석

---

## 11. 참고 자료

### 시장 데이터
- 2024 외국인환자 유치실적 통계분석보고서 (한국보건산업진흥원, 2025-07)
- 보건복지부 보도자료 (2025-04-02): "2024년 외국인 환자 유치 117만 명"
- The Korea Herald (2025-09-04): "Seoul attracts 1 million medical tourists in 2024"
- Yonhap News (2026-04-24): "Foreign patients top 2 mln for 1st time in 2025"

### 강남 클리닉 벤치마크
- DA 성형외과: <https://daprseng.com/>
- 원진성형외과: <https://wonjinbeauty.com/en/>
- 바노바기: <https://eng.banobagi.com/>
- RE:BERRY: <https://gangnamskinclinicreberry.com/>
- JK 성형외과: <https://www.jkplastic.com/en/>
- 기린 성형외과: <https://girinpsen.com/>

### 기술 자료
- next-intl docs: <https://next-intl.dev/docs/getting-started/app-router>
- BCP 47 language tags
- 선행 PDCA: `docs/01-plan/features/zh-i18n-fix.plan.md`
- 현재 i18n 설정: `liv-clinic/src/i18n/routing.ts`, `liv-clinic/src/types/index.ts`
