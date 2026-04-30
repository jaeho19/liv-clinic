# Design: Floating CTA 단순화 (Instagram + YouTube + Phone)

> **Feature**: `floating-cta-redesign`
> **Phase**: Design
> **Created**: 2026-04-30
> **Plan 참조**: `docs/01-plan/features/floating-cta-redesign.plan.md`
> **선행 PDCA**: `floating-cta-instagram` (2026-04-24, 본 작업으로 일부 무효화)

---

## 1. 아키텍처 개요 (Architecture Overview)

### 1.1 컴포넌트 레이어 (변경 후)
```
┌──────────────────────────────────────────────────┐
│  Root Layout ([locale]/layout.tsx)               │
│    └─ <ClientSideWidgets />                      │
│         └─ <FloatingCTA />  ◀── 본 변경 타겟      │
│              ├─ Instagram (image)  ← 최상단       │
│              ├─ YouTube   (image)  ← 중간 (신규)  │
│              └─ Phone     (svg+bg)  ← 최하단      │
│              [Main CTA 라벨 영역 폐지]            │
└──────────────────────────────────────────────────┘
```

### 1.2 변경 대상 파일

| 파일 | 변경 유형 | 주요 변경 |
|------|-----------|-----------|
| `liv-clinic/src/components/layout/FloatingCTA.tsx` | 수정 (전면 재작성) | 5개 채널 → 3개로 축소, 메인/보조 분리 폐지, YouTube 추가, Instagram 이미지 경로 교체 |
| `liv-clinic/src/lib/analytics-events.ts` | 수정 (경량) | `trackContact` method 유니온에 `'youtube'` 추가, 사용 안 하는 `kakao`/`wechat`/`line`/`whatsapp` 채널은 **유지**(다른 위치에서 사용 가능성) |
| `liv-clinic/public/images/인스타 버튼.png` | **사용자 업로드** | 코드 머지와 별도로 사용자가 추가 |
| `liv-clinic/public/images/유튜브-버튼.png` | **사용자 업로드** | 동일 |

변경되지 않는 파일:
- `lib/constants.ts` — `SOCIAL_LINKS.youtube` 상수 이미 존재 (line 32), 그대로 활용
- `layout/ClientSideWidgets.tsx`, `layout/Header.tsx`, `layout/Footer.tsx`
- 기존 `liv-clinic/public/images/insta.jpg` (남겨둠 — 다른 곳 참조 시 영향 방지)

---

## 2. 데이터 모델 (Button Definition Schema)

### 2.1 단순화된 `CtaButton` 스키마

기존 스키마(SVG 또는 Image 분기) 유지하되, **3개 버튼만 필요**하므로 객체 크기 대폭 축소.

```ts
type Locale = 'ko' | 'en' | 'ja' | 'zh';
type ContactMethod = 'phone' | 'instagram' | 'youtube';

interface CtaButton {
  id: ContactMethod;
  label: Record<Locale, string>;
  href: string;
  // SVG 경로 (전화 버튼만 사용)
  icon?: React.ReactNode;
  // 이미지 경로 (Instagram, YouTube 사용)
  image?: {
    src: string;
    alt: string;
  };
  // 배경/텍스트 클래스
  color: string;       // SVG 버튼: 컬러 배경 / 이미지 버튼: 'bg-white'
  textColor: string;   // 미사용 가능 (이미지 버튼은 텍스트 없음)
}
```

### 2.2 버튼 정의 3개

```ts
const ctaButtons: Record<ContactMethod, CtaButton> = {
  instagram: {
    id: 'instagram',
    label: { ko: '인스타그램', en: 'Instagram', ja: 'インスタグラム', zh: 'Instagram' },
    href: 'https://www.instagram.com/livclinic_after/',
    image: { src: '/images/인스타 버튼.png', alt: 'Instagram' },
    color: 'bg-white hover:bg-gray-50',
    textColor: 'text-white',
  },
  youtube: {
    id: 'youtube',
    label: { ko: '유튜브', en: 'YouTube', ja: 'YouTube', zh: 'YouTube' },
    href: SOCIAL_LINKS.youtube,  // 'https://www.youtube.com/@리브성형외과'
    image: { src: '/images/유튜브-버튼.png', alt: 'YouTube' },
    color: 'bg-white hover:bg-gray-50',
    textColor: 'text-white',
  },
  phone: {
    id: 'phone',
    label: { ko: '전화상담', en: 'Call', ja: '電話', zh: '电话' },
    href: `tel:${SITE_INFO.phone}`,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493..." />
      </svg>
    ),
    color: 'bg-primary hover:bg-primary/90',
    textColor: 'text-white',
  },
};
```

> **Rationale**: 인스타와 유튜브는 동일 이미지 버튼 구조(흰 배경 + 원형 마스킹). 전화는 SVG + 브랜드 컬러(`bg-primary`)로 시각적 강조 → 행동 유도 채널 차별화.

---

## 3. 로케일 매트릭스 (단순화)

### 3.1 변경 전 (선행 PDCA 결과)
```ts
const buttonOrderByLocale = {
  ko: ['kakao', 'instagram', 'phone', 'whatsapp', 'line'],
  en: ['phone', 'instagram', 'whatsapp', 'kakao', 'line'],
  ja: ['line',  'instagram', 'phone',    'whatsapp', 'kakao'],
  zh: ['wechat','instagram', 'phone',    'whatsapp', 'kakao'],
};
// 첫 번째: 메인 CTA, 나머지: 보조 (위→아래)
```

### 3.2 변경 후 (모든 로케일 동일)

```ts
const BUTTON_ORDER: ContactMethod[] = ['instagram', 'youtube', 'phone'];
// 메인/보조 구분 없음. 모든 로케일 동일.
// 위→아래 순서
```

> **Rationale**: 사용자 확정 사항 — 모든 로케일 동일 적용. 로케일별 분기 객체(`buttonOrderByLocale`) 자체를 폐지하고 단일 상수 배열로 단순화. 코드 유지보수 비용 ↓.

### 3.3 시각적 렌더 순서 (Top → Bottom)

```
┌────────────────────┐
│  📷 Instagram      │ ← BUTTON_ORDER[0], 최상단
├────────────────────┤
│  ▶️ YouTube        │ ← BUTTON_ORDER[1], 중간 (신규)
├────────────────────┤
│  📞 Phone          │ ← BUTTON_ORDER[2], 최하단
└────────────────────┘
```

라벨이 포함된 메인 CTA, pulse 애니메이션, 카카오톡 노란색 박스 모두 제거. 3개 버튼 모두 동일 크기·간격.

---

## 4. 렌더 분기 설계

### 4.1 전체 컴포넌트 구조 (변경 후)

```tsx
'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { SITE_INFO, SOCIAL_LINKS } from '@/lib/constants';
import { trackContact } from '@/lib/analytics-events';

type Locale = 'ko' | 'en' | 'ja' | 'zh';
type ContactMethod = 'phone' | 'instagram' | 'youtube';

const ctaButtons: Record<ContactMethod, CtaButton> = { /* §2.2 참조 */ };
const BUTTON_ORDER: ContactMethod[] = ['instagram', 'youtube', 'phone'];

export default function FloatingCTA() {
  const locale = useLocale() as Locale;

  return (
    <div
      className="fixed right-2 sm:right-4 md:right-6 z-40 flex flex-col items-end gap-2"
      style={{ bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}
    >
      {BUTTON_ORDER.map((key, index) => {
        const button = ctaButtons[key];
        const isImageButton = !!button.image;
        const isExternal = button.href.startsWith('http');

        return (
          <motion.a
            key={button.id}
            href={button.href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            onClick={() => trackContact(button.id)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-lg flex items-center justify-center ${
              isImageButton ? 'bg-white overflow-hidden' : `${button.color} ${button.textColor}`
            } transition-all`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label={button.label[locale] || button.label.ko}
          >
            {isImageButton ? (
              <Image
                src={button.image!.src}
                alt={button.image!.alt}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              button.icon
            )}
          </motion.a>
        );
      })}
    </div>
  );
}
```

> **Key 변경점**:
> - `[mainButton, ...secondaryButtons]` 분리 폐지 → 단일 `BUTTON_ORDER.map()` 루프
> - `useState`/`useEffect`/`showPulse` 제거 (메인 CTA pulse 애니메이션 폐지)
> - `buttonOrderByLocale` 객체 → 단일 `BUTTON_ORDER` 배열
> - 컨테이너 `gap` 단순화 (`gap-1.5 sm:gap-2 md:gap-3` → `gap-2`)
> - 메인 CTA 별도 렌더 블록 제거 (라벨 포함 `<motion.a>` 50줄 삭제)

### 4.2 이미지 아이콘 스타일 (Instagram + YouTube 공통)

```
┌──────────────────────────┐
│  Outer: w-11 h-11        │  ← 44px (모바일), 48px (sm 이상)
│  rounded-full shadow-lg  │  ← 원형 + 그림자
│  bg-white overflow-hidden│  ← PNG 배경 + 마스킹
│  ┌────────────────────┐  │
│  │ <Image              │  │
│  │   src=/images/...  │  │
│  │   width=48 h=48    │  │
│  │   object-cover     │  │
│  │ />                 │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

- `object-cover` + `w-full h-full` → 원형 마스크 내부 가득 채우기
- PNG가 정사각형이면 자연스럽게 표시. 비정사각형이면 `object-cover`가 중앙 크롭.
- `priority={false}` (기본값) — LCP 대상 아님

### 4.3 전화 버튼 스타일

전화 버튼은 SVG 아이콘 + `bg-primary` (브랜드 컬러). 이미지 버튼과 시각적 차별화로 행동 유도 강조.

```
┌──────────────────────────┐
│  Outer: w-11 h-11        │
│  rounded-full shadow-lg  │
│  bg-primary text-white   │  ← 더스티 로즈 #b4988d
│  ┌──────┐                │
│  │ SVG  │ phone icon     │
│  └──────┘                │
└──────────────────────────┘
```

---

## 5. Analytics 이벤트 설계

### 5.1 `trackContact` 타입 확장

```ts
// liv-clinic/src/lib/analytics-events.ts (line 29-32)

// Before
export function trackContact(
  method: 'phone' | 'kakao' | 'wechat' | 'line' | 'whatsapp' | 'naver_map' | 'kakao_map' | 'instagram',
  pagePath?: string,
)

// After (youtube 추가, 기존 채널은 다른 위치 사용 가능성으로 유지)
export function trackContact(
  method: 'phone' | 'kakao' | 'wechat' | 'line' | 'whatsapp' | 'naver_map' | 'kakao_map' | 'instagram' | 'youtube',
  pagePath?: string,
)
```

> **Rationale**: 플로팅 CTA에서 카카오/WeChat/LINE/WhatsApp 채널은 사라지지만, 헤더·푸터 등 다른 위치에서 `trackContact()`를 호출할 가능성을 위해 타입 유니온은 유지. YouTube는 신규 추가.

### 5.2 FloatingCTA 내 호출 단순화

```ts
onClick={() => trackContact(button.id)}
// button.id 의 타입은 ContactMethod ('phone' | 'instagram' | 'youtube')
// trackContact의 method 유니온 부분집합이므로 캐스팅 불필요
```

기존 코드의 `as 'phone' | 'kakao' | ...` 캐스팅은 제거 가능 → 타입 안전성 향상.

### 5.3 GA4 이벤트 매트릭스

| 버튼 | trackContact 호출 | GA4 event_params |
|------|-------------------|------------------|
| Instagram | `trackContact('instagram')` | `{ method: 'instagram', page_location: '...' }` |
| YouTube | `trackContact('youtube')` | `{ method: 'youtube', page_location: '...' }` |
| Phone | `trackContact('phone')` | `{ method: 'phone', page_location: '...' }` |

---

## 6. 접근성 (Accessibility)

| 항목 | 설계 |
|------|------|
| 키보드 포커스 | `<a>` 태그 기본 포커스 스타일 유지. Tab 순서: Instagram → YouTube → Phone |
| `aria-label` | 로케일별 다국어 라벨 (fallback: 한국어) |
| `alt` 속성 | `<Image alt="Instagram" />`, `<Image alt="YouTube" />` (브랜드명, 다국어 불필요) |
| 색상 대비 | 흰 배경 + 컬러풀 PNG → `--color-background: #f6f6f6` 대비 양호. `shadow-lg` 경계 강조 |
| 터치 타겟 | 44×44px (모바일), 48×48px (sm 이상) — WCAG 2.5.5 (Target Size) 충족 |
| `prefers-reduced-motion` | Framer Motion 자동 축소 (`transition` 단순화) |
| `noopener noreferrer` | 외부 링크(`http`) 자동 적용 — XSS 방지 |

---

## 7. 반응형 / 레이아웃 영향

### 7.1 버튼 수 축소 영향
- 변경 전: 5개 × (44~48px + 8~12px gap) ≈ 260~310px 세로 점유 (메인 CTA 라벨 포함 시 약 300~360px)
- 변경 후: 3개 × (44~48px + 8px gap) ≈ 144~160px 세로 점유
- **세로 공간 절약 약 100~200px** → 모바일 가독성 향상

### 7.2 컨테이너 위치 (변경 없음)
- `right-2 sm:right-4 md:right-6` — 우측 여백 유지
- `bottom: calc(60px + env(safe-area-inset-bottom, 0px))` — iPhone 노치 안전 영역 고려
- `z-40` 유지

### 7.3 모바일 최적 검증 매트릭스

| 디바이스 | 뷰포트 | 예상 표시 | 검증 방법 |
|---------|--------|-----------|-----------|
| iPhone SE (375×667) | 작은 모바일 | 3개 버튼 우하단 깨끗하게 표시 | DevTools 시뮬레이션 |
| iPhone 14 Pro (393×852) | 표준 모바일 | 동일 | DevTools |
| iPad Mini (768×1024) | 태블릿 | sm 브레이크 → 48px 버튼 | DevTools |
| Desktop (1440×900) | 데스크탑 | md 브레이크 → 우측 24px 여백 | 직접 확인 |

---

## 8. 구현 순서 (Implementation Order)

1. **타입 확장** (선행 권장)
   - `analytics-events.ts` `trackContact` method 유니온에 `'youtube'` 추가

2. **컴포넌트 재작성** — `FloatingCTA.tsx`
   - 사용하지 않는 `useState`, `useEffect` import 제거
   - `ctaButtons` 객체 단순화: `instagram`, `youtube`, `phone` 3개만 정의
   - `instagram.image.src`를 `/images/인스타 버튼.png`로 변경
   - `youtube` 버튼 신규 정의
   - `buttonOrderByLocale` 객체 폐지 → `BUTTON_ORDER` 배열로 단순화
   - 메인 CTA 렌더 블록(50줄) 삭제
   - 단일 렌더 루프로 통합
   - `INSTAGRAM_CTA_URL` 상수는 `ctaButtons.instagram.href`에 인라인 (또는 유지)

3. **빌드 확인**
   - `npm run lint` → 0 errors
   - `npm run build` → exit 0

4. **사용자 안내**
   - `public/images/인스타 버튼.png`, `public/images/유튜브-버튼.png` 업로드 필요 명시

5. **수동 QA** — 4개 로케일 홈에서 3개 버튼 확인, 클릭 동작 검증

---

## 9. 엣지 케이스 및 테스트 매트릭스

| 케이스 | 예상 동작 | 검증 방법 |
|--------|-----------|-----------|
| 로케일 = `ko` | 인스타→유튜브→전화 3개, 한국어 aria-label | 브라우저 확인 |
| 로케일 = `en` | 동일 순서, 영어 aria-label ('Instagram', 'YouTube', 'Call') | 브라우저 확인 |
| 로케일 = `ja` | 동일 순서, 일본어 aria-label ('インスタグラム', 'YouTube', '電話') | 브라우저 확인 |
| 로케일 = `zh` | 동일 순서, 중국어 aria-label ('Instagram', 'YouTube', '电话') | 브라우저 확인 |
| 이미지 미업로드 | 인스타·유튜브 버튼 깨진 이미지 | DevTools Network 탭 404 확인 |
| 이미지 로드 실패(런타임) | next/image alt 텍스트 표시 + 흰 배경 | 네트워크 차단 |
| 한글 파일명 인코딩 | 브라우저 자동 URL 인코딩 처리 | DevTools Network 요청 URL 확인 |
| `prefers-reduced-motion` | Framer Motion 애니메이션 축소 | OS 접근성 설정 |
| 키보드 Tab 이동 | Instagram → YouTube → Phone 순 포커스 | 키보드 네비게이션 |
| 스크린리더 | "Instagram 링크", "YouTube 링크", "전화상담 링크" | VoiceOver/NVDA |
| `tel:` 링크 모바일 | 다이얼러 호출 | 실기기 |
| `tel:` 링크 데스크탑 | OS 기본 통화 앱 (Skype 등) 또는 무동작 | Chrome 확인 |

---

## 10. 기존 대비 차이 요약

| 항목 | 현재 (선행 PDCA 결과) | 변경 후 |
|------|---------------------|---------|
| 버튼 총 수 | 5 (메인 1 + 보조 4) | **3** |
| 메인 CTA 분리 | O (라벨 + pulse 애니메이션) | **X** (단일 렌더) |
| 지원 채널 | phone/kakao/wechat/line/whatsapp/instagram | **instagram/youtube/phone** |
| 아이콘 타입 | SVG + Image | SVG + Image |
| 로케일 분기 | `buttonOrderByLocale` 객체 | **단일 `BUTTON_ORDER` 배열** |
| GA4 contact method | 6종 (instagram 추가) | **8종** (youtube 추가, 기존 유지) |
| `useState`/`useEffect` | O (showPulse) | **X** (불필요) |
| Instagram 이미지 | `/images/insta.jpg` | `/images/인스타 버튼.png` |

---

## 11. 리스크 대응 (Plan §8과 연계)

| 리스크 (Plan에서 식별) | Design 단계 대응 |
|----------------------|-----------------|
| 이미지 미업로드로 깨진 이미지 | 구현 후 사용자 안내 메시지 + Analyze 단계에서 파일 존재 검증 |
| 한글 파일명 인코딩 이슈 | next/image 자동 처리 의존, Vercel 정상 동작 검증된 환경. 향후 ASCII 마이그레이션 후보 |
| 카카오 채널 유입 감소 | Out of scope (별도 이슈로 트래킹), 헤더/푸터 카카오 노출 별도 검토 |
| `trackContact('youtube')` 누락 | 타입 유니온 확장으로 컴파일 시점 보장 |
| 해외 사용자 접근성 (WhatsApp/LINE) | Plan에서 의식적 trade-off 결정 — Design은 그대로 적용 |

---

## 12. 구현 중 스코프 변경 (Addendum, 2026-04-30)

Do 단계 진행 중 사용자 추가 요청에 따라 다음 3가지가 변경되었다. 본 절은 Design 원본(§1~§11)을 보완하며, **변경 후 사양이 최종 진실 소스**다.

### 12.1 버튼 수: 3개 → 7개 (kakao/line/whatsapp/wechat 복원)

**변경 사유**: 사용자가 3개로 단순화한 후 "전화 아래에 카카오·라인·WhatsApp·WeChat이 다 보이게 해달라"고 추가 요청.

```ts
// 최종 사양
type ContactMethod = 'instagram' | 'youtube' | 'phone' | 'kakao' | 'line' | 'whatsapp' | 'wechat';

const BUTTON_ORDER: ContactMethod[] = [
  'instagram',  // 이미지
  'youtube',    // 이미지 (신규)
  'phone',      // SVG, bg-primary
  'kakao',      // SVG, bg-[#FEE500] 노랑
  'line',       // SVG, bg-[#00B900] 초록
  'whatsapp',   // SVG, bg-[#25D366] 그린
  'wechat',     // SVG, bg-[#07C160] 그린
];
```

**영향**:
- `ctaButtons` 객체에 4개 정의 복원 (선행 PDCA `floating-cta-instagram` 시점의 SVG 아이콘·컬러 값 그대로 사용)
- `wechat`은 `weixin://` 프로토콜이라 외부 링크 분기 별도 처리:
  ```ts
  const isExternal = button.href.startsWith('http') || button.href.startsWith('weixin');
  // target="_blank"는 weixin도 적용, rel="noopener noreferrer"는 http만 적용
  ```
- 세로 점유 공간 약 144~160px → 약 308~360px

### 12.2 컨테이너 bottom: 60px → 80px

**변경 사유**: 하단 고정 CTA 바(상담 신청하기 바, 높이 69px)와 전화 버튼 하단이 9px 겹침. 11px 여유 + CTA 바 높이를 고려해 80px로 상향.

```diff
- style={{ bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}
+ style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
```

### 12.3 이미지 파일명: 한글 → ASCII

**변경 사유**: 사용자가 ASCII 파일명(`instagram.png`, `youtube.png`)으로 직접 업로드. 호스팅·CDN 인코딩 안정성 향상 (Plan §8 리스크 #2 해소).

```diff
- image: { src: '/images/인스타 버튼.png', alt: 'Instagram' }
+ image: { src: '/images/instagram.png', alt: 'Instagram' }
- image: { src: '/images/유튜브-버튼.png', alt: 'YouTube' }
+ image: { src: '/images/youtube.png', alt: 'YouTube' }
```

업로드된 파일 (`liv-clinic/public/images/`):
- `instagram.png` (205KB, 그라디언트 카메라 아이콘)
- `youtube.png` (32KB, 빨간 재생 버튼)

### 12.4 변경 후 최종 시각적 렌더 순서

```
┌───────────────────┐
│  📷 Instagram     │  ← image
├───────────────────┤
│  ▶️ YouTube       │  ← image (신규)
├───────────────────┤
│  📞 Phone         │  ← SVG, bg-primary
├───────────────────┤
│  💛 KakaoTalk     │  ← SVG, 노랑
├───────────────────┤
│  💚 LINE          │  ← SVG, 라인 그린
├───────────────────┤
│  💬 WhatsApp      │  ← SVG, WhatsApp 그린
├───────────────────┤
│  🟢 WeChat        │  ← SVG, WeChat 그린
└───────────────────┘
[하단 CTA 바 (69px)]
```

### 12.6 로케일 필터링 도입 (2026-04-30, 추가 변경)

**변경 사유**: 사용자 추가 요청 — 한국어(`ko`) 사용자는 카톡·전화 위주 채널이 적합하고, 비-ko 사용자는 LINE/WhatsApp/WeChat 등 글로벌 채널이 적합하므로 로케일별 노출 분리.

**최종 사양**:

```ts
const BUTTON_ORDER_KO: ContactMethod[] = ['instagram', 'youtube', 'phone', 'kakao'];
const BUTTON_ORDER_NON_KO: ContactMethod[] = [
  'instagram',
  'youtube',
  'phone',
  'line',
  'whatsapp',
  'wechat',
];

// 컴포넌트 내부
const buttonOrder = locale === 'ko' ? BUTTON_ORDER_KO : BUTTON_ORDER_NON_KO;
```

**로케일별 노출 매트릭스**:

| 로케일 | 버튼 수 | 순서 (위→아래) |
|--------|--------|---------------|
| `ko` | 4개 | 인스타그램 → 유튜브 → 전화 → **카카오톡** |
| `en` / `ja` / `zh` | 6개 | 인스타그램 → 유튜브 → 전화 → **LINE** → **WhatsApp** → **WeChat** |

**상호 배타 채널**:
- ko 전용: `kakao`
- 비-ko 전용: `line`, `whatsapp`, `wechat`
- 공통: `instagram`, `youtube`, `phone`

**선행 변경(§12.1)과의 관계**: §12.1은 모든 로케일 동일 7개 버튼이었으나, §12.6에서 로케일별 분기로 재변경. **`ctaButtons` 객체 7개 정의는 보존**(필터링만 적용)하여 향후 추가 변경 유연성 확보.

**구현 영향**:
- 코드 위치: `FloatingCTA.tsx:106-119`
- TypeScript 타입 안전성: `ContactMethod` 유니온은 §12.1 그대로 7개 채널 모두 포함 (filter 결과는 부분집합)
- 검증: `npx eslint` exit 0, `npx tsc --noEmit` 통과 (2026-04-30)

**Plan §6 AC-5 영향**: Plan AC-5 "모든 로케일 동일 구성"은 §12.6으로 명시적으로 번복됨. 이는 새로운 사용자 요청에 따른 **공식 승인 스코프 변경**.

### 12.7 §3.1 ~ §10 표 갱신 사항 (최종, §12.1·§12.6 통합)

| 항목 | §변경 전 | §변경 후 (최종) |
|------|---------|----------------|
| 버튼 총 수 (정의) | 3 | **7** (`ctaButtons` 객체) |
| 노출 버튼 수 (ko) | 3 | **4** (instagram/youtube/phone/kakao) |
| 노출 버튼 수 (비-ko) | 3 | **6** (instagram/youtube/phone/line/whatsapp/wechat) |
| 지원 채널 | instagram/youtube/phone | **+ kakao/line/whatsapp/wechat** |
| 컨테이너 bottom | 60px | **80px** |
| 이미지 경로 | 한글 + 공백 | **ASCII (instagram.png/youtube.png)** |
| 외부 링크 분기 | `http`만 | **`http` + `weixin`** (wechat 대응) |
| 로케일 분기 | 없음 (모든 로케일 동일) | **`ko` vs 비-`ko`** 이원 분기 |

---

## 13. 참고 링크

- Plan: [`../01-plan/features/floating-cta-redesign.plan.md`](../../01-plan/features/floating-cta-redesign.plan.md)
- 선행 PDCA: [`./floating-cta-instagram.design.md`](./floating-cta-instagram.design.md)
- 컴포넌트: `liv-clinic/src/components/layout/FloatingCTA.tsx`
- 상수: `liv-clinic/src/lib/constants.ts:32` (`SOCIAL_LINKS.youtube`)
- 사용자 요청 URL:
  - Instagram: <https://www.instagram.com/livclinic_after/>
  - YouTube: <https://www.youtube.com/@리브성형외과>
- next/image 공식: <https://nextjs.org/docs/app/api-reference/components/image>
- WCAG 2.5.5 Target Size: <https://www.w3.org/WAI/WCAG21/Understanding/target-size.html>
