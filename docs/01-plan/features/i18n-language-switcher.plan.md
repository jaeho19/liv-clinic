# Plan: i18n-language-switcher

> 언어 전환 시 페이지 전체 텍스트가 즉시 반영되도록 i18n 동작 정상화

## 1. 개요

### 배경
우측 상단 LanguageSwitcher 버튼을 눌러도 헤더/본문/버튼/메뉴/푸터 등 페이지 전체 텍스트가 변경되지 않는 문제가 보고됨. 사용자 검증 결과 ko/en/ja/zh 4개 핵심 locale 모두에서 동일한 증상 발생.

### 결론 (탐색 후 진단)
LanguageSwitcher 자체는 정상이다. `next-intl@4.6.1`의 `useRouter().replace(pathname, { locale })`를 표준대로 사용 중이며, URL은 `/ko/...` → `/en/...`로 정상 변경된다. 진짜 원인은 **컴포넌트에 한국어가 직접 박혀있는 하드코딩 + 일부 인프라 누락**이다.

### 목표
1. **공개 페이지 컴포넌트의 하드코딩 한국어 텍스트 약 131개를 `useTranslations` 기반으로 전면 i18n 처리**
2. **Middleware matcher와 WeChat redirect 정규식을 8개 locale 전체로 확장**
3. **`ko.json`에 누락된 `chat` 네임스페이스(28키) 한국어 번역 추가**
4. ko/en/ja/zh 4개 locale에서 LanguageSwitcher 클릭 시 페이지 전체 텍스트가 즉시 전환되는 것을 시각적으로 검증
5. 새로고침/페이지 이동 후에도 선택 언어 유지 (이미 URL prefix + next-intl 자동 cookie로 동작 — 검증만)

## 2. 현재 상태 분석

### 동작 중인 부분 ✅
- `src/components/layout/LanguageSwitcher.tsx` — `router.replace(pathname, { locale })` 표준 호출
- `src/i18n/routing.ts` — 8 locale (`ko, en, ja, zh, zh-TW, vi, th, ru`) + `localePrefix: 'always'` + `defaultLocale: 'ko'`
- `src/i18n/request.ts` — `getRequestConfig` 정상, 최근 commit `3b235d8` Turbopack TDZ 픽스 완료
- `next.config.ts` — `createNextIntlPlugin('./src/i18n/request.ts')` 정상
- `src/app/[locale]/layout.tsx` — `setRequestLocale`, `NextIntlClientProvider` 정상 wiring
- `src/middleware.ts` — `createMiddleware(routing)` + Supabase admin auth 통합

### 문제점 P1: 컴포넌트 한국어 하드코딩 (가장 큰 원인)
공개 페이지 컴포넌트 22개 파일에서 약 131개 한국어 문자열이 `useTranslations` 없이 JSX에 직접 박혀있다. locale 변경 시 메시지를 안 읽으니 한국어 그대로 남는다.

| 파일 | 발견 수 | 비고 |
|---|---|---|
| `sections/FillerDetail.tsx` | 17 | |
| `sections/BotoxDetail.tsx` | 14 | "종아리 시술 부위" |
| `sections/Equipment3DCarousel.tsx` | 12 | "드래그 또는 스크롤로 탐색" |
| `sections/FloatingConsultation.tsx` | 12 | "상담신청", "곧 연락드리겠습니다" |
| `sections/MedicalBlogSection.tsx` | 10 | "관련 블로그 포스트" |
| `sections/UltheraDetail.tsx` | 9 | SVG `<text>` 라벨 포함 |
| `sections/NaverBlog.tsx` | 9 | |
| `sections/ShurinkDetail.tsx` | 8 | SVG `<text>` 라벨 포함 |
| `sections/TreatmentDetail.tsx` | 7 | "시술 과정", "시술 정보", "회복 기간" — 모든 시술 상세 공유 |
| `sections/BeforeAfterShowcase.tsx` | 6 | |
| `sections/InstagramFeed.tsx` | 6 | "업데이트" |
| `layout/FloatingCTA.tsx` | 4 | |
| `sections/PigmentationDetail.tsx` | 3 | "시술 시간", "다운타임", "권장 횟수" |
| `sections/Doctor.tsx` | 2 | |
| `sections/InModeDetail.tsx` | 2 | SVG 텍스트 |
| `ui/StickyCtaBar.tsx` | 2 | |
| `ui/NaverMap.tsx` | 2 | |
| `ui/ExpandableList.tsx` | 2 | |
| `sections/ThermageDetail.tsx` | 1 | |
| `sections/EventCard.tsx` | 1 | |
| `layout/Header.tsx` | 1 | "관리자" |
| `layout/MobileMenu.tsx` | 1 | |
| **합계** | **131** | |

### 문제점 P2: Middleware matcher 8 locale 중 4개만 매치
`src/middleware.ts:54`:
```typescript
matcher: [
  '/((?!api|_next|_vercel|.*\\..*).*)',
  '/(ko|en|ja|zh)/:path*'   // ❌ zh-TW, vi, th, ru 누락
]
```
`src/middleware.ts:12` WeChat redirect 정규식도 `(ko|en|ja)`만 처리 → zh 외 locale에서 `/wechat` 접근 시 redirect 안 됨.

### 문제점 P3: 번역 파일 누락
- `ko.json`: `chat` 네임스페이스 전체 누락(28키) — Chat Widget이 한국어 모드에서 깨진다
- `en.json`: `common.items` 빈 문자열
- `ko/en/ja.json`: `wechatPage` 누락 (zh만 보유, wechat은 zh 전용이므로 의도적 가능 — 본 plan 범위 제외)

### 발견 사항 (out of scope)
- `vi.json`, `th.json`, `ru.json` 모두 ko.json과 동일한 3992라인 → ko 복사본/placeholder 가능성 매우 높음
- `zh-TW.json`은 5473라인으로 다른 파일과 크게 차이 — 별도 검증 필요
- → 본 plan에서는 routing이 정상 동작하는 것까지만 보장. 4개 신규 locale의 실제 번역 품질은 별도 task

## 3. 개선 계획

### 3.1 인프라 수정 (Phase A — 선행, 즉시 효과)

#### A-1. Middleware matcher 8 locale 확장
`src/middleware.ts` 수정:
```typescript
matcher: [
  '/((?!api|_next|_vercel|.*\\..*).*)',
  '/(ko|en|ja|zh|zh-TW|vi|th|ru)/:path*'
]
```
- 가능하면 `LOCALES.join('|')`로 동적 생성. Edge runtime 제약 시 hardcode 유지.

#### A-2. WeChat redirect 정규식 확장
```typescript
const wechatNonZh = pathname.match(/^\/(ko|en|ja|zh-TW|vi|th|ru)\/wechat(\/.*)?$/);
```
zh 외 모든 locale을 `/zh/wechat`으로 redirect.

#### A-3. `ko.json`에 `chat` 네임스페이스 추가
en.json의 `chat` 네임스페이스 구조 그대로 복사 후 28개 키 한국어 번역 (예: `welcome` → "안녕하세요! 무엇을 도와드릴까요?", `placeholder` → "메시지를 입력하세요...", `send` → "보내기" 등).

#### A-4. `en.json` `common.items` 빈 문자열 수정
`""` → `"items"` (또는 컨텍스트에 맞는 단어).

### 3.2 컴포넌트 i18n 마이그레이션 (Phase B — 대규모)

#### B-1. 신규 번역 키 namespace 그룹화
| Namespace | 대상 컴포넌트 | 예상 키 수 |
|---|---|---|
| `treatmentDetail` | `TreatmentDetail`, `*Detail.tsx` 공통 라벨 | ~25 |
| `consultation.floating` | `FloatingConsultation` | ~15 |
| `floatingCta` | `FloatingCTA` | ~5 |
| `equipmentCarousel` | `Equipment3DCarousel` | ~12 |
| `medicalBlog` | `MedicalBlogSection` | ~10 |
| `naverBlog` | `NaverBlog` | ~10 |
| `instagram` | `InstagramFeed` | ~6 |
| `treatments.botox` | `BotoxDetail` 고유 라벨 | ~14 |
| `treatments.filler` | `FillerDetail` 고유 라벨 | ~17 |
| `treatments.ulthera` | `UltheraDetail` 고유 + SVG | ~9 |
| `treatments.shurink` | `ShurinkDetail` 고유 + SVG | ~8 |
| `treatments.inmode` | `InModeDetail` SVG | ~2 |
| `treatments.thermage` | `ThermageDetail` | ~1 |
| `treatments.pigmentation` | `PigmentationDetail` | ~3 |
| `beforeAfter` | `BeforeAfterShowcase` | ~6 |
| `doctor` | `Doctor` | ~2 |
| `eventCard` | `EventCard` | ~1 |
| `nav.admin` | `Header.tsx` "관리자" | 1 |
| `mobileMenu.misc` | `MobileMenu.tsx` | 1 |
| `ui.stickyCta` | `StickyCtaBar` | ~2 |
| `ui.naverMap` | `NaverMap` | ~2 |
| `ui.expandableList` | `ExpandableList` | ~2 |
| **합계** | **~22 namespace** | **~150 키** |

> 정확한 키 이름과 영/일/중 번역 문구는 `/pdca design` 단계에서 확정.

#### B-2. 우선순위 (영향 범위)
1. **Tier 1 (전 페이지 노출)**: `Header.tsx`, `MobileMenu.tsx`, `FloatingCTA.tsx`, `FloatingConsultation.tsx` — 사이트 어디서든 보임
2. **Tier 2 (공통 시술 페이지)**: `TreatmentDetail.tsx` — 모든 시술 상세 페이지 공유
3. **Tier 3 (개별 시술 상세)**: `BotoxDetail`, `FillerDetail`, `UltheraDetail`, `ShurinkDetail`, `InModeDetail`, `ThermageDetail`, `PigmentationDetail`
4. **Tier 4 (보조 섹션)**: `Equipment3DCarousel`, `MedicalBlogSection`, `NaverBlog`, `InstagramFeed`, `BeforeAfterShowcase`, `Doctor`, `EventCard`
5. **Tier 5 (UI 유틸)**: `StickyCtaBar`, `NaverMap`, `ExpandableList`

#### B-3. SVG `<text>` 라벨 처리
- `useTranslations`는 client component에서만 동작. 일부 *Detail.tsx가 server component면 `'use client'` 추가 또는 부모에서 prop으로 전달.
- design 단계에서 컴포넌트별 client/server 경계 표 작성.

#### B-4. 4개 messages/*.json (ko/en/ja/zh) 동시 보강
하드코딩에서 빠진 텍스트를 키로 옮긴 만큼 4개 파일 모두 동일 키 추가.

### 3.3 영속성(Persistence) — 추가 작업 불필요
- `localePrefix: 'always'` 이므로 모든 URL이 locale prefix 보유 → 페이지 이동/새로고침 시 URL이 locale 전달
- next-intl middleware가 `NEXT_LOCALE` 쿠키 자동 set/read → prefix-less URL 진입 시 detection
- 사용자가 명시한 localStorage는 next-intl 표준이 아니고(SSR/middleware에서 접근 불가) 쿠키로 자동 처리 중
- → **검증 항목으로만 둠**, 코드 변경 없음

### 3.4 영향받는 파일 요약
- 인프라 (2): `src/middleware.ts`, `src/messages/ko.json` (chat namespace 추가)
- 메시지 파일 (4): `src/messages/{ko,en,ja,zh}.json`
- 컴포넌트 (22): 위 P1 표 참조
- (수정 안 함) `src/i18n/routing.ts`, `src/i18n/request.ts`, `next.config.ts`, `src/app/[locale]/layout.tsx`, `src/components/layout/LanguageSwitcher.tsx`

## 4. Out of Scope (별도 처리)

- **`vi/th/ru/zh-TW.json` 본문 번역**: 실제 번역 품질 검증/작성은 별도 task
- **admin 페이지 i18n**: 운영자 전용 한국어 단일 운영이 일반적, 28개 admin 컴포넌트는 본 plan 제외
- **`wechatPage` 키를 ko/en/ja에 추가**: WeChat은 zh 전용이고 middleware redirect로 처리됨
- **e2e 자동화 테스트**: Playwright 회귀 테스트 추가는 별도 task

## 5. Verification

### 빌드/린트
```powershell
cd C:\dev\LIV_homepage\liv-clinic
npm run lint
npm run build
```
0 errors / 0 warnings 기대.

### Dev 수동 검증
```powershell
cd C:\dev\LIV_homepage\liv-clinic
npm run dev
```
1. `http://localhost:3000/ko` → LanguageSwitcher 클릭 → en/ja/zh 전환 시 헤더/본문/푸터/CTA 모두 즉시 해당 언어 표시
2. 메인, about/staff, lifting/ulthera, antiaging/botox, contact, medical, gallery, promotion 각 페이지에서 동일 검증
3. en으로 전환 후 다른 페이지로 이동 → URL이 `/en/...` 유지
4. 브라우저 새로고침 → 선택 언어 유지 (URL prefix가 자동 유지)
5. Chat Widget 열기 (우하단) → ko 모드에서 한국어로 깨지지 않고 표시
6. zh 진입 → `/zh/wechat`이 정상 표시되고, `/ko/wechat`/`/en/wechat`/`/ja/wechat`이 `/zh/wechat`으로 redirect

### 회귀 우려 확인
- `chat-followups-g03-g05-g07` 직전 feature가 동작하는지 (ChatWidget operator presence)
- Admin 라우트가 여전히 작동 (Supabase 세션)
- Turbopack edge runtime에서 빌드 에러 없음 (최근 TDZ 이슈)

## 6. Risk & Mitigation

| 위험 | 완화 |
|---|---|
| SVG `<text>` 라벨 client-only 제약으로 일부 Detail에 `'use client'` 추가 필요 | design 단계에서 컴포넌트별 directive 표 작성 |
| 키 namespace 충돌 / 위계 혼란 | 컴포넌트 단위로 신규 namespace 분리, 기존 `sections.*`에 합치지 않음 |
| en/ja/zh 신규 키 번역 품질 | 도메인 단어(시술명, 의학 용어)는 기존 messages 파일의 표현 우선 재사용 |
| Turbopack edge runtime build 실패 | `LOCALES.join('|')` 평가 실패 시 hardcode 8 locale로 fallback |
| 한국어 하드코딩 누락 검색의 false positive | comment/log 등 사용자 비노출 한국어는 제외, 실제 JSX 출력 텍스트만 대상 |

## 7. Estimated Scope
- **인프라 수정**: 1 commit (~10분 작업)
- **chat namespace 한국어 번역**: 1 commit (~30분)
- **컴포넌트 i18n 마이그레이션**: 5~7 commits (Tier 단위로 분할), 약 4~6시간
- **검증**: 1시간 (수동 브라우저 검증 8 페이지 × 4 locale)

---

> 다음 단계: `/pdca design i18n-language-switcher`로 정밀 설계 (namespace 키 이름 확정, 영/일/중 번역 문구 sketch, 컴포넌트별 client/server 경계 결정).
