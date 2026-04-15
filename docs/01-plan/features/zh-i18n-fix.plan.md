# Plan: /zh 페이지 한국어·영어 혼용 제거

> Feature: zh-i18n-fix
> Created: 2026-04-15
> Status: Completed

---

## 1. 배경

LIV 성형외과 웹사이트(`https://liv-clinic.net`)의 중국어 페이지(`/zh`)에서 한국어·영어 텍스트가 중국어와 섞여 표시되는 문제가 보고됨. 중국어권 사용자 경험 저하 및 지역 검색 SEO 신뢰도 저하 원인.

### 근본 원인 2가지
1. **`src/lib/constants.ts` 한국어 전용**: `TREATMENTS.*`의 `targetAreas`, `idealFor`, `cautions`, `faqs`, `process[]`, `duration`, `anesthesia`, `recovery`, `results` 필드가 한국어 리터럴로만 존재. 모든 상세 컴포넌트(`UltheraDetail`, `ThermageDetail`, `ShurinkDetail` 등)가 `treatment.targetAreas.map(...)` 식으로 직접 참조해 locale과 무관하게 한국어 노출.
2. **번역 훅 우회 컴포넌트**: `NaverMap.tsx`의 InfoWindow HTML, `about/location/page.tsx`의 H1/리드/라벨, `Certification.tsx`의 "공식 사이트 방문" 버튼, `zh.json`의 `common.slogan` 값 자체가 한국어/영어 하드코딩.

---

## 2. 범위

### 포함
- 사용자가 열거한 모든 `/zh` 페이지 한국어·영어 혼용 텍스트 (Footer, Map, Certifications, Ulthera 상세, Thermage 상세, Location 페이지 일부)
- 동일 패턴 공유하는 나머지 리프팅/안티에이징 상세 페이지 (Shurink, InMode, Density, Botox, Filler, Skinbooster)
- `ko.json`/`en.json`/`ja.json` 신규 키 동기화 (깨짐 방지)

### 제외
- `/admin` 관리자 페이지
- `/zh/about/location`의 주차·교통편·CTA 섹션 등 사용자 명시 목록 외 한국어 하드코딩
- `en`/`ja` locale의 상세 페이지 치료 데이터 번역 (Shurink 이하 6개 treatment — 현행 유지)

---

## 3. 접근 방식

**핵심 리팩터링 1건 + 번역 확충 1건 + 하드코딩 제거 3건** 구성. 컴포넌트 재작성 최소화, 데이터 출처만 전환.

### 3-1. TREATMENTS 데이터 locale override
새 파일 `src/lib/treatmentsI18n.ts` 도입.
- `TreatmentL10n` 인터페이스: `tagline`, `shortDesc`, `targetAreas`, `idealFor`, `cautions`, `duration`, `anesthesia`, `recovery`, `results`, `process`, `faqs`
- `getLocalizedTreatment(base, treatmentId, locale)` 헬퍼: constants.ts 한국어 base + locale override merge
- `getRelatedTreatmentLabel(treatmentId, locale)`: Related Treatments 카드 이름/설명 로컬라이즈
- `constants.ts` 건드리지 않음 → `/ko` 회귀 위험 0

### 3-2. 공통 UI 번역 키 추가 (zh/ko/en/ja.json)
- `common.slogan` 중국어화
- `sections.certification.visitSite`, `officialPartner` 신규
- `sections.location.markerTitle`, `infoWindowSubway`, `mapLoading`, `mapError` 신규
- `aboutPage.locationPage.*` 신규

### 3-3. 컴포넌트 훅 연결
- `Certification.tsx` "공식 사이트 방문" → `t('visitSite')`
- `NaverMap.tsx` → `useTranslations('sections.location')` + XSS escape
- `about/location/page.tsx` H1/리드/주소·전화 라벨 → `aboutPage.locationPage`
- `Location.tsx`, `contact/page.tsx` `markerTitle="리브성형외과"` 제거 → 번역 기본값 사용
- 상세 컴포넌트 8개: `const treatment = getLocalizedTreatment(TREATMENTS.X.Y, id, locale)` 패턴 적용

---

## 4. 주요 파일

| 파일 | 변경 요지 |
|---|---|
| `src/lib/treatmentsI18n.ts` | **신규** locale override 데이터 + 헬퍼 |
| `src/messages/zh.json` | 공통 UI 키 추가/수정, 잔존 영문 섹션라벨 중국어화 |
| `src/messages/ko.json`, `en.json`, `ja.json` | 동일 키 구조로 locale-appropriate 값 |
| `src/components/ui/NaverMap.tsx` | `useTranslations` 도입, HTML escape |
| `src/components/sections/Certification.tsx` | `t('visitSite')`/`t('officialPartner')` |
| `src/components/sections/Location.tsx` | `markerTitle` 제거 |
| `src/app/[locale]/about/location/page.tsx` | H1/리드/라벨 번역 전환 |
| `src/app/[locale]/contact/page.tsx` | `markerTitle` 제거 |
| `src/components/sections/UltheraDetail.tsx` | `getLocalizedTreatment` 연결 + Related Treatments 로컬라이즈 |
| `src/components/sections/ThermageDetail.tsx` | 동일 |
| `src/components/sections/{Shurink,Thread,InMode,Density}Detail.tsx` | 동일 |

---

## 5. 검증 전략

1. `npx tsc --noEmit` → 0 errors
2. `npx next build` → ✓ Compiled successfully
3. `rg "[\uAC00-\uD7AF]" src/messages/zh.json` → 0 matches (고유명사 제외)
4. 수동 `/zh` 페이지 스모크 체크 (Footer, /zh/lifting/ulthera, /zh/lifting/thermage, /zh/about/location)
5. `/ko` 회귀 확인 (constants.ts 값 그대로 표시되는지)

---

## 6. 리스크 & 완화

| 리스크 | 완화 |
|---|---|
| `getLocalizedTreatment` 반환 타입이 Korean union이라 컴파일 에러 | Generic `T & TreatmentL10n` merge 반환, `as TreatmentL10n` 추론 |
| NaverMap InfoWindow HTML 주입 → XSS | `escapeHtml()` 유틸로 번역값 이스케이프 후 주입 |
| `en`/`ja` 페이지에서 상세 치료 데이터가 여전히 한국어 | 현행 동작과 동일 — 별도 PR로 후속 처리 (본 PR 범위 외) |
| JSON 키 누락 시 빌드 실패 | 4개 locale에 모두 동일 키 구조 추가 |
