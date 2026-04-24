# Design: Floating CTA Instagram 버튼 추가

> **Feature**: `floating-cta-instagram`
> **Phase**: Design
> **Created**: 2026-04-24
> **Plan 참조**: `docs/01-plan/features/floating-cta-instagram.plan.md`

---

## 1. 아키텍처 개요 (Architecture Overview)

### 1.1 컴포넌트 레이어
```
┌─────────────────────────────────────────────────┐
│  Root Layout ([locale]/layout.tsx)              │
│    └─ <ClientSideWidgets />                     │
│         └─ <FloatingCTA />  ◀────── 본 변경 타겟 │
│              ├─ Secondary Buttons (stack, top→bottom)
│              │    • instagram  ◀── 신규(최상단) │
│              │    • [locale별 2개]              │
│              └─ Main CTA Button (label 포함)    │
└─────────────────────────────────────────────────┘
```

### 1.2 변경 대상 파일

| 파일 | 변경 유형 | 주요 변경 |
|------|-----------|-----------|
| `liv-clinic/public/images/insta.jpg` | 신규(복사) | 루트 `public/images/insta.jpg` → Next.js public 경로로 복사 |
| `liv-clinic/src/components/layout/FloatingCTA.tsx` | 수정 | `ctaButtons.instagram` 추가 / 렌더 분기 / 로케일 순서 |
| `liv-clinic/src/lib/analytics-events.ts` | 수정(경량) | `trackContact` method 유니온에 `'instagram'` 추가 |

변경되지 않는 파일:
- `lib/constants.ts` (`SOCIAL_LINKS.instagram=livps_official` 그대로 유지 — 헤더/푸터 영향 방지)
- `layout/ClientSideWidgets.tsx`, `layout/Header.tsx`, `layout/Footer.tsx`

---

## 2. 데이터 모델 (Button Definition Schema)

### 2.1 기존 `CtaButton` 스키마 (암묵적)
기존 코드는 TypeScript 인라인 객체 리터럴로 정의되어 있으며 공용 타입이 없다. 본 변경에서는 **이미지 기반 버튼을 수용**하도록 스키마를 공식화한다.

```ts
type Locale = 'ko' | 'en' | 'ja' | 'zh';
type ContactMethod = 'phone' | 'kakao' | 'wechat' | 'line' | 'whatsapp' | 'instagram';

interface CtaButton {
  id: ContactMethod;
  label: Record<Locale, string>;
  href: string;
  // 색상/텍스트 클래스 (SVG 버튼 공통 필드)
  color: string;
  textColor: string;
  // 아이콘 렌더링: 둘 중 하나만 제공
  icon?: React.ReactNode;      // SVG 아이콘 (기존 방식)
  image?: {                    // 이미지 아이콘 (신규 - Instagram)
    src: string;               // e.g., '/images/insta.jpg'
    alt: string;               // 'Instagram'
  };
}
```

### 2.2 Instagram 버튼 정의

```ts
instagram: {
  id: 'instagram',
  label: {
    ko: '인스타그램',
    en: 'Instagram',
    ja: 'インスタグラム',
    zh: 'Instagram',
  },
  href: 'https://www.instagram.com/livclinic_after/',
  // 이미지 자체에 그라디언트가 있으므로 배경은 흰색으로 충돌 최소화
  color: 'bg-white hover:bg-gray-50',
  textColor: 'text-white', // 미사용(이미지 버튼이므로)
  image: {
    src: '/images/insta.jpg',
    alt: 'Instagram',
  },
},
```

> **Rationale**: 기존 `color` 필드는 배경 클래스로 사용되며 펄스 애니메이션에 `color.split(' ')[0]` 로 참조된다. Instagram 은 Secondary 버튼이라 펄스 애니메이션이 없지만, 일관된 필드 구조 유지를 위해 동일 패턴 사용.

---

## 3. 로케일별 버튼 배치 매트릭스

### 3.1 현재 상태
```ts
const buttonOrderByLocale = {
  ko: ['kakao', 'phone', 'whatsapp', 'line'],
  en: ['phone', 'whatsapp', 'kakao', 'line'],
  ja: ['line', 'phone', 'whatsapp', 'kakao'],
  zh: ['wechat', 'phone', 'whatsapp', 'kakao'],
};
// 구조: [mainButton, ...secondaryButtons]
// secondary 는 컴포넌트에서 flex-col 로 위→아래 순서 렌더
```

### 3.2 변경 후 (Instagram 을 secondary 맨 앞 = 화면 최상단)

```ts
const buttonOrderByLocale = {
  ko: ['kakao', 'instagram', 'phone', 'whatsapp', 'line'],
  en: ['phone', 'instagram', 'whatsapp', 'kakao', 'line'],
  ja: ['line',  'instagram', 'phone',    'whatsapp', 'kakao'],
  zh: ['wechat','instagram', 'phone',    'whatsapp', 'kakao'],
};
// 메인 CTA 는 기존 유지 → secondary 는 4개(instagram 최상단 + 기존 3개)
```

### 3.3 렌더 순서 (Top → Bottom, 시각적)

```
┌───────────────┐
│  📷 Instagram │ ← 최상단 (secondaryButtons[0])
├───────────────┤
│  📞 Phone     │
├───────────────┤
│  💬 WhatsApp  │
├───────────────┤
│  ✉️ LINE      │
├───────────────┤
│  💛 카카오톡  │ ← Main CTA (라벨 포함)
└───────────────┘
```

---

## 4. 렌더 분기 설계

### 4.1 Secondary Button 렌더 로직 (현재)

```tsx
<motion.a ... className="... ${button.color} ${button.textColor} ...">
  {button.icon}
</motion.a>
```

### 4.2 변경 후 (이미지/SVG 분기)

```tsx
{secondaryButtons.map((buttonKey, index) => {
  const button = ctaButtons[buttonKey];
  const isImageButton = 'image' in button && button.image;

  return (
    <motion.a
      key={button.id}
      href={button.href}
      target="_blank"            // instagram 은 항상 새 탭
      rel="noopener noreferrer"
      onClick={() => trackContact(button.id)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className={`
        w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-lg
        flex items-center justify-center
        ${isImageButton ? 'bg-white overflow-hidden' : `${button.color} ${button.textColor}`}
        transition-all
      `}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label={button.label[locale] || button.label.ko}
    >
      {isImageButton ? (
        <Image
          src={button.image.src}
          alt={button.image.alt}
          width={48}
          height={48}
          className="w-full h-full object-cover"
          priority={false}
        />
      ) : (
        button.icon
      )}
    </motion.a>
  );
})}
```

> **주의**: `target`/`rel` 기존 삼항식은 모든 secondary 버튼에서 외부 링크 여부에 따라 분기했으나, Instagram도 HTTP 외부 링크이므로 기존 삼항식으로도 올바르게 `_blank` 가 적용됨. 기존 삼항식을 그대로 유지한다.

```tsx
target={button.href.startsWith('http') || button.href.startsWith('weixin') ? '_blank' : undefined}
rel={button.href.startsWith('http') ? 'noopener noreferrer' : undefined}
```

### 4.3 이미지 아이콘 스타일링

```
┌──────────────────────────┐
│  Outer: w-11 h-11        │  ← 버튼 크기(44px, 모바일 기준)
│  rounded-full shadow-lg  │  ← 원형 + 그림자
│  bg-white overflow-hidden│  ← jpg 배경이 정사각이므로 마스킹
│  ┌────────────────────┐  │
│  │ <Image              │  │
│  │   src=/insta.jpg   │  │
│  │   w=48 h=48        │  │
│  │   object-cover     │  │  ← 원형 안에 가득 차도록
│  │ />                 │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

- `object-cover` + `w-full h-full` 로 원형 마스크 내부 가득 채우기
- `next/image` 는 LCP 대상이 아니므로 `priority={false}` (기본값)
- jpg 크기는 원본(정방형 3D 아이콘) → Next.js 가 자동 최적화

---

## 5. Analytics 이벤트 설계

### 5.1 타입 확장

```ts
// Before
method: 'phone' | 'kakao' | 'wechat' | 'line' | 'whatsapp' | 'naver_map' | 'kakao_map'

// After
method: 'phone' | 'kakao' | 'wechat' | 'line' | 'whatsapp' | 'naver_map' | 'kakao_map' | 'instagram'
```

### 5.2 FloatingCTA 내 호출

```ts
onClick={() => trackContact(button.id as ContactMethod)}
// 기존: trackContact(button.id as 'phone' | 'kakao' | 'wechat' | 'line' | 'whatsapp')
// 변경: ContactMethod 타입 사용 또는 별칭 (타입 안정성 확보)
```

> **참고**: 공통 타입 파일이 별도로 없으므로 `analytics-events.ts` 의 `trackContact` 첫 번째 파라미터 타입에 `'instagram'` 을 추가하고, FloatingCTA 의 기존 `as` 캐스팅 유니온도 동일하게 확장한다.

---

## 6. 접근성 (Accessibility)

| 항목 | 설계 |
|------|------|
| 키보드 포커스 | `<a>` 태그 기본 포커스 스타일 유지, 기존 버튼과 동일 |
| `aria-label` | 로케일별 라벨 적용 (fallback: 한국어) |
| `alt` 속성 | `Image` 에 `alt="Instagram"` (다국어 필요성 낮음 — 브랜드명) |
| 색상 대비 | 흰색 배경 + 그라디언트 아이콘 → 배경(`--color-background: #f6f6f6`) 대비 양호, `shadow-lg` 로 경계 강조 |
| 터치 타겟 | 44×44px(모바일), 48×48px(데스크탑) 유지 |

---

## 7. 반응형 / 레이아웃 영향

### 7.1 버튼 수 증가 영향
- 기존: 4개 × (44~48px + 8~12px gap) ≈ 200~240px 세로 점유
- 변경: 5개 × (44~48px + 8~12px gap) ≈ 260~310px 세로 점유
- 컨테이너: `bottom: calc(60px + env(safe-area-inset-bottom))`
- 뷰포트 최소 높이 기준(iPhone SE 667px)에서도 화면 중앙 ~ 하단 범위 내 수납 가능 → **레이아웃 깨짐 없음**

### 7.2 z-index 확인
- `z-40` 유지 (Header `z-50`, FloatingCTA `z-40`, Main content `z-10 이하`)

---

## 8. 구현 순서 (Implementation Order)

1. **자산 복사** — `public/images/insta.jpg` → `liv-clinic/public/images/insta.jpg`
2. **타입 확장** — `analytics-events.ts` `trackContact` method 유니온에 `'instagram'` 추가
3. **컴포넌트 수정** — `FloatingCTA.tsx`
   - `import Image from 'next/image'` 추가
   - `ctaButtons.instagram` 정의 추가
   - `buttonOrderByLocale` 4개 로케일에 `'instagram'` 삽입 (각 로케일의 secondary 첫 자리)
   - Secondary 렌더 블록에 `isImageButton` 분기 추가
   - `trackContact` 캐스팅 타입 확장
4. **빌드 확인** — `npm run lint` / `npm run build` 0 errors
5. **수동 QA** — 4개 로케일 홈 접속, 버튼 클릭 → 새 탭으로 `livclinic_after` 오픈 확인

---

## 9. 엣지 케이스 및 테스트 매트릭스

| 케이스 | 예상 동작 | 검증 방법 |
|--------|-----------|-----------|
| 로케일 = `ko` | Instagram 이 카카오톡(메인) 위 첫 번째 | 브라우저 확인 |
| 로케일 = `zh` | Instagram 이 WeChat(메인) 위 첫 번째 | 브라우저 확인 |
| 이미지 로드 실패 | 원형 흰 배경 + alt text 만 표시 | 네트워크 차단 테스트 |
| 느린 회선 | `next/image` placeholder 없어 공백 이후 표시 | Chrome DevTools Slow 3G |
| prefers-reduced-motion | Framer Motion 애니메이션 축소 | OS 접근성 설정 |
| 키보드 `Tab` 이동 | Instagram → 기존 보조 버튼 → 메인 CTA 순 포커스 | 키보드 네비게이션 |
| 스크린리더 | "Instagram 링크" 로 읽힘 | VoiceOver/NVDA |

---

## 10. 기존 대비 차이 요약

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| Secondary 버튼 수 | 3 | 4 |
| 지원 채널 | phone/kakao/wechat/line/whatsapp | + **instagram** |
| 아이콘 타입 | SVG only | SVG + **Image (next/image)** |
| 로케일 순서 배열 길이 | 4 | 5 |
| GA4 contact method | 5종 | **6종** |

---

## 11. 참고 링크

- Plan: [`../01-plan/features/floating-cta-instagram.plan.md`](../../01-plan/features/floating-cta-instagram.plan.md)
- 컴포넌트: `liv-clinic/src/components/layout/FloatingCTA.tsx`
- 요청 링크: <https://www.instagram.com/livclinic_after/>
- next/image 공식: <https://nextjs.org/docs/app/api-reference/components/image>
