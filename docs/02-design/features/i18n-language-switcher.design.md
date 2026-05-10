# Design: i18n-language-switcher

> **Feature**: `i18n-language-switcher`
> **Phase**: Design
> **Created**: 2026-05-10
> **Plan**: [`../01-plan/features/i18n-language-switcher.plan.md`](../../01-plan/features/i18n-language-switcher.plan.md)
> **Scope**: ko/en/ja/zh 4 코어 locale에서 LanguageSwitcher 클릭 시 페이지 전체 텍스트 즉시 전환

---

## 1. 설계 개요

### 1.1 핵심 결론

LanguageSwitcher는 표준 next-intl 패턴을 정확히 따르고 있다. `router.replace(pathname, { locale })`은 정상이며, 새로고침/이동 시 locale 유지도 `localePrefix: 'always'`로 자동 동작 중이다. **수정해야 할 곳은 컴포넌트의 하드코딩된 한국어 텍스트와 인프라 갭(middleware matcher 4 locale 누락 + ko.json `chat` namespace 누락) 뿐이다.**

### 1.2 설계 원칙

1. **Surgical change**: 동작 중인 코드는 건드리지 않음 (LanguageSwitcher, routing.ts, request.ts, layout.tsx, NextIntlClientProvider — 변경 없음).
2. **분리 원칙**: UI 라벨 i18n과 콘텐츠 데이터(blog/equipment/cartridge 배열) i18n은 구분. 본 design은 **UI 라벨만** 다룬다.
3. **컴포넌트 단위 namespace**: 신규 namespace는 컴포넌트 책임 단위로 분리해 충돌과 혼란 방지.
4. **번역 동시 추가**: ko/en/ja/zh 4개 message 파일에 동일 키를 동일 commit에서 추가. 누락 시 키 없는 locale에서 fallback 표시 깨짐.
5. **Shared keys 우선**: `treatmentDetail` 같이 여러 컴포넌트가 공유하는 키는 한 namespace로 묶고 `useTranslations('treatmentDetail')`로 호출.

### 1.3 In-Scope vs Out-of-Scope (재확정)

| 구분 | 항목 | 처리 |
|---|---|---|
| ✅ In-scope | UI 라벨, 버튼, 헤딩, placeholder, 토스트 메시지 | 본 design |
| ✅ In-scope | SVG `<text>` 의 시각적 라벨 (표피/진피/근막 등) | 본 design |
| ✅ In-scope | Middleware matcher 8 locale 확장 | 본 design |
| ✅ In-scope | WeChat redirect 정규식 확장 | 본 design |
| ✅ In-scope | `ko.json`에 `chat` namespace 한국어 번역 추가 | 본 design |
| ✅ In-scope | `en.json`의 `common.items` 빈 값 수정 | 본 design |
| ❌ Out-of-scope | `Equipment3DCarousel`의 `EQUIPMENT_DATA` 배열 (10개 장비 title/subTitle/desc) | **별도 task** — 이미 `equipmentPage` namespace에 유사 구조 존재. 데이터-i18n 매핑 작업으로 분리 |
| ❌ Out-of-scope | `MedicalBlogSection`의 `BLOG_POSTS` 배열 (4개 블로그 포스트 title/excerpt) | **별도 task** — 외부 콘텐츠 번역 |
| ❌ Out-of-scope | `UltheraDetail`의 cartridge 데이터 (target/applications 배열) | **별도 task** — 의학 전문 번역 |
| ❌ Out-of-scope | `vi/th/ru/zh-TW.json` 본문 번역 | 별도 task |
| ❌ Out-of-scope | admin 컴포넌트 28개 i18n | 별도 task (운영자 단일 언어 운영) |

> **변경 사항**: Plan 단계 추정치 ~131개 hardcoded 중 약 30~40개는 데이터 배열에 속해 별도 task로 분리. 본 design 실제 작업 범위는 **약 80~95개 UI 라벨 키**.

---

## 2. Architecture

### 2.1 변경 후 데이터 흐름

```
[유지]
URL: /ko/about → middleware → setRequestLocale('ko') → NextIntlClientProvider(messages.ko)
                                                           │
LanguageSwitcher.click('en') → router.replace('/about', { locale: 'en' })
                             → URL: /en/about → middleware → ... → messages.en

[수정]
1. middleware matcher: '(ko|en|ja|zh)' → '(ko|en|ja|zh|zh-TW|vi|th|ru)'
2. 각 컴포넌트: 하드코딩 "시술 정보" → t('treatmentInfo')
3. messages/{ko,en,ja,zh}.json: 신규 namespace 키 ~80~95개 추가
4. messages/ko.json: chat namespace 28키 한국어 번역 추가
```

### 2.2 컴포넌트 client/server 경계

검증 결과 본 task의 모든 대상 컴포넌트가 이미 `'use client'`이며 `useTranslations` 사용 가능. SVG `<text>` 라벨도 client component 내부이므로 추가 directive 작업 불필요.

| 컴포넌트 | directive | 비고 |
|---|---|---|
| Header.tsx | `'use client'` | 기존 |
| MobileMenu.tsx | `'use client'` | 기존 |
| FloatingCTA.tsx | `'use client'` | 기존 |
| FloatingConsultation.tsx | `'use client'` | 기존 |
| TreatmentDetail.tsx | `'use client'` | 기존 |
| BotoxDetail.tsx | `'use client'` | 기존 |
| FillerDetail.tsx | `'use client'` | 기존 |
| UltheraDetail.tsx | `'use client'` | 기존 |
| ShurinkDetail.tsx | `'use client'` | 기존, SVG 텍스트 포함 |
| InModeDetail.tsx | `'use client'` | 기존, SVG 텍스트 포함 |
| ThermageDetail.tsx | `'use client'` | 기존 |
| PigmentationDetail.tsx | `'use client'` | 기존 |
| Equipment3DCarousel.tsx | `'use client'` | 기존, 데이터 배열 out-of-scope |
| MedicalBlogSection.tsx | `'use client'` | 기존, 블로그 데이터 out-of-scope |
| 그 외 (NaverBlog, InstagramFeed, BeforeAfterShowcase, Doctor, EventCard, StickyCtaBar, NaverMap, ExpandableList) | `'use client'` | 기존 |

**리스크 해소**: Plan에서 우려한 RSC 경계 문제 없음.

---

## 3. Namespace 키 설계

### 3.1 신규 namespace 일람

| Namespace | 컴포넌트 | 키 수 | 메모 |
|---|---|---|---|
| `treatmentDetail` | `TreatmentDetail.tsx` | 14 | 모든 시술 상세 페이지 공유 |
| `consultation.floating` | `FloatingConsultation.tsx` | 13 | 폼 라벨/메시지/토스트 |
| `floatingCta` | `FloatingCTA.tsx` | 4 | |
| `nav.admin` | `Header.tsx` | 1 | "관리자" |
| `mobileMenu` | `MobileMenu.tsx` | 1 | |
| `equipmentCarousel.ui` | `Equipment3DCarousel.tsx` | 4 | UI 라벨만 (배열 데이터 제외) |
| `medicalBlog.ui` | `MedicalBlogSection.tsx` | 4 | UI 라벨만 |
| `naverBlog` | `NaverBlog.tsx` | ~6 | |
| `instagram` | `InstagramFeed.tsx` | ~4 | |
| `beforeAfter` | `BeforeAfterShowcase.tsx` | ~4 | |
| `doctor.ui` | `Doctor.tsx` | 2 | |
| `eventCard` | `EventCard.tsx` | 1 | |
| `treatments.botox.ui` | `BotoxDetail.tsx` | ~6 | UI 라벨만 (시술 데이터 제외) |
| `treatments.filler.ui` | `FillerDetail.tsx` | ~10 | UI 라벨만 |
| `treatments.ulthera.ui` | `UltheraDetail.tsx` | ~6 | SVG 라벨 + UI |
| `treatments.shurink.ui` | `ShurinkDetail.tsx` | ~10 | SVG 라벨 다수 |
| `treatments.inmode.ui` | `InModeDetail.tsx` | ~2 | SVG 라벨 |
| `treatments.thermage.ui` | `ThermageDetail.tsx` | ~1 | |
| `treatments.pigmentation.ui` | `PigmentationDetail.tsx` | 3 | |
| `ui.stickyCta` | `StickyCtaBar.tsx` | ~2 | |
| `ui.naverMap` | `NaverMap.tsx` | ~2 | |
| `ui.expandableList` | `ExpandableList.tsx` | ~2 | |
| **합계** | | **~95 키** | |

### 3.2 핵심 namespace 정의 (en/ja/zh 번역 포함)

#### 3.2.1 `treatmentDetail`

```jsonc
// ko.json
"treatmentDetail": {
  "advantages": "{name}의 장점",
  "process": "시술 과정",
  "info": "시술 정보",
  "duration": "시술 시간",
  "anesthesia": "마취",
  "recovery": "회복 기간",
  "effectDuration": "효과 지속",
  "areas": "시술 부위",
  "recommendedFor": "이런 분께 추천",
  "precautions": "시술 전후 주의사항",
  "faq": "자주 묻는 질문",
  "relatedMedical": "{name} 관련 의료정보",
  "moreInfoPrefix": "더 자세한 정보는",
  "moreInfoLink": "의료정보 Q&A",
  "moreInfoSuffix": "에서 확인하세요",
  "consultation": "{name} 상담 예약",
  "consultationDesc": "전문 의료진과 1:1 맞춤 상담을 받아보세요.",
  "ctaReserve": "상담 예약하기",
  "ctaCall": "전화 상담",
  "related": "함께 보면 좋은 시술"
}
```

```jsonc
// en.json
"treatmentDetail": {
  "advantages": "Advantages of {name}",
  "process": "Procedure Steps",
  "info": "Procedure Info",
  "duration": "Duration",
  "anesthesia": "Anesthesia",
  "recovery": "Recovery",
  "effectDuration": "Effect Duration",
  "areas": "Treatment Areas",
  "recommendedFor": "Recommended For",
  "precautions": "Pre/Post-care",
  "faq": "Frequently Asked Questions",
  "relatedMedical": "{name} — Medical Information",
  "moreInfoPrefix": "For more details, see",
  "moreInfoLink": "Medical Q&A",
  "moreInfoSuffix": ".",
  "consultation": "Book a {name} Consultation",
  "consultationDesc": "Get a one-on-one tailored consultation with our medical experts.",
  "ctaReserve": "Book Consultation",
  "ctaCall": "Call Us",
  "related": "Related Treatments"
}
```

```jsonc
// ja.json
"treatmentDetail": {
  "advantages": "{name}の特長",
  "process": "施術の流れ",
  "info": "施術情報",
  "duration": "施術時間",
  "anesthesia": "麻酔",
  "recovery": "回復期間",
  "effectDuration": "効果持続",
  "areas": "施術部位",
  "recommendedFor": "こんな方におすすめ",
  "precautions": "施術前後の注意事項",
  "faq": "よくある質問",
  "relatedMedical": "{name}関連の医療情報",
  "moreInfoPrefix": "詳しくは",
  "moreInfoLink": "医療情報Q&A",
  "moreInfoSuffix": "をご覧ください",
  "consultation": "{name}カウンセリング予約",
  "consultationDesc": "専門医による1対1のカウンセリングをご利用ください。",
  "ctaReserve": "カウンセリング予約",
  "ctaCall": "電話相談",
  "related": "あわせておすすめの施術"
}
```

```jsonc
// zh.json
"treatmentDetail": {
  "advantages": "{name}的优势",
  "process": "施术流程",
  "info": "施术信息",
  "duration": "施术时间",
  "anesthesia": "麻醉",
  "recovery": "恢复期",
  "effectDuration": "效果持续",
  "areas": "施术部位",
  "recommendedFor": "推荐人群",
  "precautions": "施术前后注意事项",
  "faq": "常见问题",
  "relatedMedical": "{name} 相关医疗信息",
  "moreInfoPrefix": "更多详情请见",
  "moreInfoLink": "医疗信息Q&A",
  "moreInfoSuffix": "。",
  "consultation": "{name} 咨询预约",
  "consultationDesc": "享受专业医师1对1的定制咨询。",
  "ctaReserve": "预约咨询",
  "ctaCall": "电话咨询",
  "related": "推荐相关施术"
}
```

#### 3.2.2 `consultation.floating`

```jsonc
// ko.json (예시 — 다른 locale은 동일 키 구조)
"consultation": {
  "floating": {
    "quickTitle": "빠른 상담 신청",
    "quickSubtitle": "전문 상담사가 친절하게 안내해 드립니다",
    "title": "상담 신청",
    "close": "닫기",
    "namePlaceholder": "성함",
    "passwordPlaceholder": "비밀번호 (선택)",
    "departmentSelect": "진료과목 선택",
    "submit": "상담신청",
    "submitting": "전송 중...",
    "consentRequired": "[필수]",
    "consentText": "개인정보 수집 및 이용에 동의합니다. (성함, 연락처는 상담 목적으로만 사용됩니다)",
    "successTitle": "상담신청이 완료되었습니다",
    "successDesc": "곧 연락드리겠습니다",
    "errorTitle": "상담신청에 실패했습니다",
    "errorRetry": "다시 시도해주세요",
    "errorDefault": "상담 신청에 실패했습니다"
  }
}
```

#### 3.2.3 `nav.admin` (Header.tsx)

```jsonc
// ko.json — nav 기존 namespace에 admin 키 추가
"nav": {
  ...,
  "admin": "관리자"
}
// en: "Admin", ja: "管理者", zh: "管理员"
```

#### 3.2.4 `equipmentCarousel.ui` (UI 라벨만)

```jsonc
// ko.json
"equipmentCarousel": {
  "ui": {
    "introLine1": "리브성형외과는 정품 인증된 프리미엄 장비만을 사용합니다.",
    "introLine2": "최신 기술로 안전하고 효과적인 시술을 제공합니다.",
    "viewMore": "자세히 보기",
    "navigationHint": "드래그 또는 스크롤로 탐색"
  }
}
// en, ja, zh 번역 동일 구조로 추가
```

#### 3.2.5 `medicalBlog.ui` (UI 라벨만, 블로그 포스트 데이터 제외)

```jsonc
// ko.json
"medicalBlog": {
  "ui": {
    "title": "관련 블로그 포스트",
    "subtitle": "더 자세한 의료 정보를 확인하세요",
    "visitBlogDesktop": "네이버 블로그 방문",
    "visitBlogMobile": "네이버 블로그 더보기"
  }
}
```

#### 3.2.6 `treatments.shurink.ui` (SVG 라벨)

```jsonc
// ko.json
"treatments": {
  ...,
  "shurink": {
    ...,
    "ui": {
      "layerEpidermis": "표피",
      "layerDermis": "진피",
      "layerFascia": "근막",
      "layerEpidermisBox": "표피층",
      "layerDermisBox": "진피층",
      "layerDeepBox": "심부층",
      "fineWrinklesPores": "잔주름, 모공",
      "collagenRegen": "콜라겐 재생",
      "liftingEffect": "리프팅 효과",
      "bodyDoubleChin": "바디, 이중턱",
      "legacyHifu": "기존 HIFU",
      "shurinkLabel": "슈링크",
      "shotsLegacy": "1초당 1-2샷",
      "timeLegacy": "시술시간 60분+",
      "shotsShurink": "1초당 7샷 이상",
      "timeShurink": "시술시간 30분대"
    }
  }
}
```

#### 3.2.7 `chat` (ko.json 누락 — 28키 한국어 번역 추가)

en.json의 `chat` namespace 구조를 그대로 복사 후 한국어 번역. 키 매핑 표:

| key | ko 번역 |
|---|---|
| `welcome` | "안녕하세요! 무엇을 도와드릴까요?" |
| `subtitle` | "전문 상담사가 답변드립니다" |
| `title` | "실시간 상담" |
| `placeholder` | "메시지를 입력하세요..." |
| `send` | "보내기" |
| `close` | "닫기" |
| `online` | "온라인" |
| `offline` | "오프라인" |
| `consent` | "동의" |
| `namePlaceholder` | "성함" |
| `emailPlaceholder` | "이메일 (선택)" |
| `startChat` | "채팅 시작" |
| `openButton` | "실시간 상담 열기" |
| `openButtonShort` | "상담" |
| `tooltipText` | "궁금한 점이 있으신가요? 채팅으로 문의해보세요!" |
| `tooltipDismiss` | "닫기" |
| `unreadAria` | "{count}개의 읽지 않은 메시지" |
| `messageCountdown` | "{seconds}초 후 자동 전송" |
| `tooLong` | "메시지가 너무 깁니다" |
| `rateLimited` | "잠시 후 다시 시도해주세요" |
| `sessionEnded` | "상담이 종료되었습니다" |
| `followupNotice` | "운영시간 외 문의는 다음 영업일에 답변드립니다" |
| `delayedResponseNotice` | "응답이 다소 지연될 수 있습니다" |
| `allOperatorsBusyNotice` | "모든 상담사가 통화중입니다. 잠시만 기다려주세요" |
| `businessHours` | "평일 10:00 ~ 19:00" |
| `showOriginal` | "원문 보기" |
| `hideOriginal` | "원문 숨기기" |
| `translationFailed` | "번역에 실패했습니다" |

> 정확한 표현은 기존 운영 문구가 있다면 우선 재사용. 본 design 작성 시점에 확인 가능한 en.json 키를 baseline으로 하되 **실제 키 list는 ko.json patch 시점에 en.json을 조회 후 1:1 대응**한다.

### 3.3 키 명명 규칙

- **camelCase**: 기존 코드 컨벤션 일치
- **dot-grouped namespace**: `treatments.shurink.ui` 처럼 점으로 그룹화. next-intl이 nested object 자동 인식.
- **`.ui` 접미사**: 컴포넌트의 UI 라벨임을 명시. 데이터 영역(`treatments.shurink.benefits` 같은)과 구분.
- **ICU MessageFormat**: 동적 값은 `{name}` 패턴 (이미 다수 사용 중).

---

## 4. Middleware 수정 설계

### 4.1 변경 diff (`src/middleware.ts`)

```diff
- const wechatNonZh = pathname.match(/^\/(ko|en|ja)\/wechat(\/.*)?$/);
+ const wechatNonZh = pathname.match(/^\/(ko|en|ja|zh-TW|vi|th|ru)\/wechat(\/.*)?$/);
```

```diff
  export const config = {
    matcher: [
      '/((?!api|_next|_vercel|.*\\..*).*)',
-     '/(ko|en|ja|zh)/:path*'
+     '/(ko|en|ja|zh|zh-TW|vi|th|ru)/:path*'
    ]
  };
```

### 4.2 동적 생성(권장) vs Hardcode

**동적 생성 시도**:
```typescript
import { LOCALES } from './i18n/routing';
const localePattern = LOCALES.join('|'); // 'ko|en|ja|zh|zh-TW|vi|th|ru'

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    `/(${localePattern})/:path*`,
  ],
};
```

**검증 필요**: Next.js 16 + Turbopack edge runtime에서 matcher가 build-time 평가되는지. 최근 commit `3b235d8`에서 `request.ts`에 비슷한 TDZ 이슈가 있었음.

**의사결정 트리**:
1. 동적 생성으로 시도 → `npm run build` 통과 → 채택.
2. 빌드 에러 → hardcode 8 locale로 fallback. 코드에 주석으로 "LOCALES 변경 시 함께 수정" 표시.

> 우선 hardcode 방식으로 안정적으로 배포한 뒤, 별도 PR에서 동적화 시도 권장.

---

## 5. 컴포넌트별 변경 명세

### 5.1 변경 패턴 (공통)

```typescript
// Before
<h2 className="text-h1 text-secondary">시술 과정</h2>

// After (이미 useTranslations 사용 중인 컴포넌트)
const t = useTranslations('treatmentDetail');
<h2 className="text-h1 text-secondary">{t('process')}</h2>
```

이미 `useTranslations`로 다른 namespace를 호출 중인 컴포넌트는 **별도의 hook을 추가**:
```typescript
const t = useTranslations('sections.treatmentDetail'); // 기존
const tDetail = useTranslations('treatmentDetail');     // 신규 (혼동 피하려면 다른 변수명)
```

또는 namespace 없이 root에서 호출 후 full path 사용:
```typescript
const t = useTranslations(); // root
t('treatmentDetail.process')
```
→ **컴포넌트별로 결정**, 본 design은 namespace 호출 방식 권장 (DX와 typecheck 측면).

### 5.2 컴포넌트별 키 사용 표 (요약)

| 컴포넌트 | 신규 호출 namespace | 영향 라인 수 (대략) |
|---|---|---|
| `TreatmentDetail.tsx` | `treatmentDetail` | 14 |
| `FloatingConsultation.tsx` | `consultation.floating` | 13 |
| `Header.tsx` | `nav` (기존, key 1개 추가) | 1 |
| `MobileMenu.tsx` | 기존 namespace + 1키 | 1 |
| `FloatingCTA.tsx` | `floatingCta` | 4 |
| `Equipment3DCarousel.tsx` | `equipmentCarousel.ui` | 4 (배열 데이터는 별도 task) |
| `MedicalBlogSection.tsx` | `medicalBlog.ui` | 4 (블로그 데이터는 별도 task) |
| `NaverBlog.tsx` | `naverBlog` | ~6 |
| `InstagramFeed.tsx` | `instagram` | ~4 |
| `BeforeAfterShowcase.tsx` | `beforeAfter` | ~4 |
| `Doctor.tsx` | `doctor.ui` | 2 |
| `EventCard.tsx` | `eventCard` | 1 |
| `BotoxDetail.tsx` | `treatments.botox.ui` | ~6 (배열 데이터 제외) |
| `FillerDetail.tsx` | `treatments.filler.ui` | ~10 (배열 데이터 제외) |
| `UltheraDetail.tsx` | `treatments.ulthera.ui` | ~6 (cartridge 배열 제외) |
| `ShurinkDetail.tsx` | `treatments.shurink.ui` | ~10 (SVG 라벨) |
| `InModeDetail.tsx` | `treatments.inmode.ui` | 2 (SVG 라벨) |
| `ThermageDetail.tsx` | `treatments.thermage.ui` | 1 |
| `PigmentationDetail.tsx` | `treatments.pigmentation.ui` | 3 |
| `StickyCtaBar.tsx` | `ui.stickyCta` | ~2 |
| `NaverMap.tsx` | `ui.naverMap` | ~2 |
| `ExpandableList.tsx` | `ui.expandableList` | ~2 |

### 5.3 동적 보간(`{name}`) 처리

`TreatmentDetail.tsx`에서 `treatment.name`은 이미 `treatmentsI18n.ts`에서 locale별 이름을 가져온다. 따라서:

```typescript
// Before
<h2>{treatment.name}의 장점</h2>

// After
<h2>{t('advantages', { name: treatment.name })}</h2>
// next-intl ICU: "Advantages of {name}" → "Advantages of Ulthera"
```

`treatment.name` 자체는 ko/en/ja/zh 별 값이 이미 있어 추가 작업 불필요.

---

## 6. 영속성(Persistence) 설계

### 6.1 결론: 추가 작업 없음

| 시나리오 | 동작 | 메커니즘 |
|---|---|---|
| Switcher로 ko→en 전환 | URL `/en/...`로 변경, 전체 리렌더 | next-intl `router.replace` |
| 다른 페이지로 이동 | URL prefix `/en/`이 그대로 전달 | next-intl `<Link>` + `localePrefix: 'always'` |
| 새로고침 | URL이 locale을 보유하므로 자동 유지 | URL prefix |
| `/` 같은 prefix-less 진입 | `NEXT_LOCALE` 쿠키로 detection 후 redirect | next-intl middleware (자동) |

`localStorage` 사용 요청은 의도와 결과가 동일하나, next-intl은 SSR/edge 환경에서 동작하므로 클라이언트만 접근 가능한 localStorage는 부적합. 쿠키 기반 자동 처리가 표준.

### 6.2 검증 항목

- [ ] DevTools → Application → Cookies에서 `NEXT_LOCALE` 쿠키 set 확인
- [ ] 시크릿 창에서 `/`로 진입 시 브라우저 Accept-Language → 적절한 locale로 redirect
- [ ] en으로 전환 후 `/`로 직접 이동 → `/en`으로 redirect

---

## 7. 실행 순서 (Implementation Order)

### 7.1 Phase A: 인프라 (1 commit)

1. `src/middleware.ts` matcher에 4 locale 추가 + WeChat redirect 정규식 확장
2. `src/messages/ko.json`에 `chat` namespace 28키 한국어 번역 추가
3. `src/messages/en.json`의 `common.items` 빈 값 → `"items"`
4. `npm run lint` + `npm run build` 검증
5. dev에서 ko/en/ja/zh 4 locale 진입 + LanguageSwitcher 동작 시각 검증

### 7.2 Phase B-Tier 1: 전 페이지 노출 컴포넌트 (1~2 commits)

영향 범위가 가장 큰 4개 컴포넌트.
1. `Header.tsx` ("관리자" → `t('nav.admin')`)
2. `MobileMenu.tsx`
3. `FloatingCTA.tsx`
4. `FloatingConsultation.tsx`

각 컴포넌트당:
- 4개 message 파일에 신규 키 추가
- 컴포넌트 hardcoded text → `t(...)` 교체
- dev에서 시각 검증

### 7.3 Phase B-Tier 2: 공통 시술 페이지 (1 commit)

5. `TreatmentDetail.tsx` (모든 시술 상세 페이지 공유)

이 컴포넌트 하나만으로 lifting/* 6개, antiaging/* 3개, laser/* 다수 페이지에서 텍스트 전환 효과 발생.

### 7.4 Phase B-Tier 3: 개별 시술 Detail (3~4 commits)

6. `BotoxDetail.tsx` (UI 라벨 ~6키)
7. `FillerDetail.tsx` (UI 라벨 ~10키)
8. `UltheraDetail.tsx` (UI + SVG ~6키)
9. `ShurinkDetail.tsx` (SVG 다수 ~10키)
10. `InModeDetail.tsx` (SVG ~2키)
11. `ThermageDetail.tsx` (1키)
12. `PigmentationDetail.tsx` (3키)

### 7.5 Phase B-Tier 4: 보조 섹션 (1~2 commits)

13. `Equipment3DCarousel.tsx` (UI 라벨만)
14. `MedicalBlogSection.tsx` (UI 라벨만)
15. `NaverBlog.tsx`
16. `InstagramFeed.tsx`
17. `BeforeAfterShowcase.tsx`
18. `Doctor.tsx`
19. `EventCard.tsx`

### 7.6 Phase B-Tier 5: UI 유틸 (1 commit)

20. `StickyCtaBar.tsx`
21. `NaverMap.tsx`
22. `ExpandableList.tsx`

### 7.7 Phase C: 검증 (1 commit — 검증만, 코드 변경 없으면 commit 생략)

검증 항목 § 9 참조.

---

## 8. 번역 품질 가이드라인

### 8.1 Domain-aware 우선 재사용

기존 `messages/*.json`에 의학/시술 용어가 이미 잘 정리되어 있다. 신규 키 번역 시:
- "시술" → en.json의 기존 표현 확인 ("treatment" / "procedure" 일관성)
- "상담" → "consultation" (이미 다수 사용)
- "리프팅" → "lifting"
- 약어 표기 (HIFU, RF, CO2 등)는 모든 locale에서 영문 그대로 유지

### 8.2 일/중 톤

- ja: 정중체(です・ます). 의료 사이트 톤.
- zh: 简体. zh-TW 별도 (본 design 범위 외).

### 8.3 ICU placeholder 일관성

`{name}`, `{count}`, `{seconds}` 등의 키는 모든 locale에서 동일하게 유지. 어순이 달라져도 placeholder 위치만 자유롭게 조정.

---

## 9. Verification

### 9.1 자동 검증

```powershell
cd C:\dev\LIV_homepage\liv-clinic
npm run lint
npm run build
```

기대: 0 errors / 0 warnings. `next-intl` 누락 키 검증이 컴파일 단계 직접 검증은 안 되므로 추가 grep 검증:

```powershell
cd C:\dev\LIV_homepage\liv-clinic
# 변경된 컴포넌트에 한국어 잔존 확인
Get-ChildItem -Path src/components -Recurse -Include *.tsx | Select-String -Pattern '[가-힣]{2,}' | Where-Object { $_.Line -notmatch '^\s*//' -and $_.Line -notmatch 'console\.' }
```

기대: 본 design 범위(공개 페이지 22 파일)의 JSX 내 한국어 라인 0개. 데이터 배열(out-of-scope) 내 한국어는 잔존 허용.

### 9.2 수동 시각 검증

#### 9.2.1 Locale 전환 (Switcher)

```
http://localhost:3000/ko
→ Switcher 클릭: en, ja, zh 각각
→ 모든 페이지 영역(Header, Hero, Sections, Footer, FloatingCTA)이 즉시 해당 언어로 바뀌는지 확인
```

#### 9.2.2 페이지별 검증

각 locale에서 다음 페이지 순회 후 한국어 잔존 없음 확인:
- `/[locale]` (메인)
- `/[locale]/about/staff`
- `/[locale]/lifting/ulthera`
- `/[locale]/lifting/shurink`
- `/[locale]/antiaging/botox`
- `/[locale]/antiaging/filler`
- `/[locale]/laser/pigmentation`
- `/[locale]/contact`
- `/[locale]/medical`
- `/[locale]/gallery`
- `/[locale]/promotion`

> Out-of-scope 데이터(Equipment 카드 desc, MedicalBlog 포스트 title/excerpt, Ulthera cartridge 배열)는 한국어 잔존 허용 — 별도 task로 처리.

#### 9.2.3 영속성 검증

- en으로 전환 후 다른 페이지 이동 → URL이 `/en/...` 유지
- 브라우저 새로고침 → 선택 locale 유지
- 시크릿 창에서 `/` 진입 → Accept-Language 또는 cookie 기반 redirect 확인

#### 9.2.4 Chat Widget 한국어 모드

- ko에서 ChatWidget 열기 → 한국어 텍스트 정상 표시 (welcome, placeholder, send 등)
- DevTools console 에러 없음

#### 9.2.5 WeChat redirect

- `/zh/wechat` 정상 표시
- `/ko/wechat`, `/en/wechat`, `/ja/wechat` 모두 `/zh/wechat`으로 redirect

### 9.3 회귀 검증

- `chat-followups-g03-g05-g07` (직전 feature) — operator presence/heartbeat 동작
- Admin 라우트 (`/admin/inventory`) — Supabase 세션 + 인증 정상
- Turbopack edge runtime build 에러 없음

---

## 10. Risk & Mitigation

| 위험 | 발생 확률 | 영향 | 완화 |
|---|---|---|---|
| 키 누락 → 일부 locale에서 raw key 노출 | 中 | 中 | 신규 키는 4개 message 파일에 동시 추가. PR 리뷰 시 4 파일 diff 동시 확인 |
| Turbopack edge runtime에서 동적 matcher 평가 실패 | 中 | 高 | hardcode fallback 우선, 빌드 통과 후 동적화 별도 PR |
| 번역 톤 불일치 (의역/직역) | 中 | 低 | 기존 messages 파일의 표현 우선 재사용, 도메인 단어 통일 |
| ICU placeholder 누락 | 低 | 中 | 모든 locale에서 동일 placeholder 유지, lint 단계에서 next-intl `--missing-placeholders` 옵션은 없으므로 PR 리뷰로 검증 |
| 데이터 배열(EQUIPMENT_DATA 등)이 out-of-scope임을 까먹고 수정 시 scope creep | 低 | 中 | design § 1.3에 명시적 표 + Tier 4에서 명시적으로 "UI 라벨만" 표시 |
| `chat` namespace 한국어 번역의 어색한 표현 | 中 | 低 | 별도 PR에서 운영팀 검수 가능 |
| 신규 namespace 명이 기존 namespace와 충돌 | 低 | 中 | `treatments.{name}.ui`, `medicalBlog.ui` 등 `.ui` 접미사로 격리 |

---

## 11. Estimated Effort

| Phase | 작업 | 예상 시간 |
|---|---|---|
| A | Middleware + ko.json chat + en.json fix | 30분 |
| B-T1 | Header/MobileMenu/FloatingCTA/FloatingConsultation | 1.5시간 |
| B-T2 | TreatmentDetail | 1시간 |
| B-T3 | 7개 시술 Detail (SVG 포함) | 2시간 |
| B-T4 | 보조 섹션 7개 | 1.5시간 |
| B-T5 | UI 유틸 3개 | 30분 |
| C | 검증 (수동 시각) | 1시간 |
| **합계** | | **~8시간** |

---

## 12. Out-of-Scope (재차 명시) — 별도 follow-up task

본 design 완료 후 별도 task로 분리되어야 할 항목:

1. **`Equipment3DCarousel.tsx` `EQUIPMENT_DATA` 배열 i18n** — 10개 장비 × 4 locale × 3필드 (title/subTitle/desc) = 120 entries
2. **`MedicalBlogSection.tsx` `BLOG_POSTS` 배열 i18n** — 4 포스트 × 4 locale × 2 필드 = 32 entries (또는 외부 CMS 연동)
3. **`UltheraDetail.tsx` cartridge 배열 i18n** — target/applications 의학 용어 번역 필요
4. **`vi/th/ru/zh-TW.json` 본문 번역 검증/작성** — placeholder로 의심되는 3개 파일 점검
5. **admin 컴포넌트 28개 i18n** — 운영자 전용, 한국어 단일 운영 정책 확인 후 결정
6. **e2e 회귀 테스트 (Playwright)** — locale 전환 후 특정 키 텍스트 visible 검증

---

> 다음 단계: `/pdca do i18n-language-switcher` — Phase A부터 순차 구현.
