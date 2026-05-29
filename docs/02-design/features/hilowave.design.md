# HILO WAVE 통이미지 상세페이지 — 설계 (Design)

> **Feature**: `hilowave`
> **Phase**: Design
> **Created**: 2026-05-29
> **Plan**: `docs/01-plan/features/hilowave.plan.md`
> **Selected Architecture**: **Option C — 실용 균형** (page.tsx + 이미지 manifest 상수 + 작은 FadeUpImage 블록 + 좌표 상수, 새 공유 모듈 없음)

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | HILO WAVE 시술 랜딩 + 상담 전환 경로 확보. PPT 통이미지 디자인을 웹에 무손실 이식. |
| **WHO** | 안티에이징(피부 밀도·탄력·리프팅) 잠재 고객. PC·모바일 모두. |
| **RISK** | ① 이미지 `liv-clinic/public/` 미존재(복사 필요) ② 통이미지 SEO 약함 ③ 큰 이미지 9장 LCP/용량 ④ 히어로 버튼 좌표 오정렬. |
| **SUCCESS** | `/ko/antiaging/hilowave`에서 9장 정확 순서 풀폭, 가로 스크롤 0, 히어로 버튼 2개 동작, 전 블록 fade-up, 메뉴(PC/모바일) 노출. |
| **SCOPE** | 메뉴 1항목 + 단일 라우트(page+layout) + 이미지 복사 + 11개 로케일 nav 라벨. |

---

## 1. Overview

PPT 9장 통이미지를 위→아래 풀폭 세로 스택으로 렌더하는 단일 정적 페이지. 동적 데이터/API 없음. 인터랙션은 (a) 히어로 버튼 2개 + hover, (b) 전 블록 fade-up + 미세 hover 효과 2가지뿐. 기존 `antiaging/*` 라우트 패턴(`page.tsx` + `layout.tsx`)을 그대로 따른다.

**핵심 원칙**: 통이미지에는 디자인 의도가 이미 박혀 있으므로 **DOM 카드/레이아웃을 새로 만들지 않는다.** 9장은 단순 `<Image>` 스택.

---

## 2. Architecture (Option C)

### 2.1 파일 트리

```
liv-clinic/
├── public/images/antiaging/hilowave/        ← 복사 대상 (현재 없음)
│   ├── hilowave-1.jpg ... hilowave-9.jpg
│   └── hilowave-full.jpg                     (og 전용, 렌더 안 함)
└── src/
    ├── app/[locale]/antiaging/hilowave/
    │   ├── page.tsx                          ★ 신규 (통이미지 스택 + 히어로 오버레이 + fade-up + DEBUG)
    │   └── layout.tsx                        ★ 신규 (SEO 메타 + WebPage/Breadcrumb 스키마)
    ├── components/layout/Header.tsx          ✎ navItems.antiaging.children 1줄 추가
    └── messages/{11 locales}.json            ✎ nav.hilowave: "HILO WAVE"
```

### 2.2 page.tsx 내부 구조 (단일 'use client' 파일)

```
page.tsx
├─ const DEBUG = false            // 좌표 미세조정 토글 (외곽선 표시)
├─ const HERO = { src, width:1920, height:1208, alt }
├─ const HERO_BUTTONS: HeroButton[]   // 상담예약 / 카카오 좌표·링크
├─ const IMAGES: StackImage[]     // 2~9번 manifest (src, w, h, alt)
├─ function FadeUpImage({img})    // motion.div whileInView fade-up + 미세 hover (로컬 컴포넌트)
└─ default export HiloWavePage()
   ├─ <main overflow-x-hidden>
   │   ├─ Hero block: relative wrapper + <Image priority> + HERO_BUTTONS.map(→ 투명 <a>/<Link>)
   │   └─ IMAGES.map(→ <FadeUpImage>)
```

### 2.3 왜 C인가
- 1회성 페이지 → B의 공유 컴포넌트(`lib/hilowave.ts`, `HiloWaveImageStack`)는 과설계(YAGNI). // Design Ref: §2 — one-off page, no premature abstraction
- A(전부 인라인)는 9장 fade-up 마크업이 반복 → `FadeUpImage` 로컬 블록 하나로 DRY.
- 좌표·이미지 목록을 파일 상단 상수로 모아 **DEBUG 미세조정이 한눈에**.

---

## 3. Data Model (페이지 로컬 타입)

```ts
interface StackImage {
  src: string;      // '/images/antiaging/hilowave/hilowave-2.jpg'
  width: number;    // 1920
  height: number;   // 실측 px (CLS 방지)
  alt: string;      // §섹션명 (SEO 보완)
}

interface HeroButton {
  label: string;            // 접근성용 (aria-label / sr-only)
  topPct: number;           // 79
  leftPct: number;          // 7 / 26.5
  widthPct: number;         // 17.5
  heightPct: number;        // 7
  href: string;             // '/contact' | 'https://pf.kakao.com/_hgFwn'
  external: boolean;        // true → <a target=_blank>, false → next-intl <Link>
}
```

### 3.1 IMAGES manifest (실측 치수 — Plan §4 확정)

| idx | src | width×height | alt |
|----|-----|------|-----|
| 1(HERO) | hilowave-1.jpg | 1920×1208 | 힐로웨이브 히어로 — 피부 깊숙이 차오르는 탄력의 흐름 |
| 2 | hilowave-2.jpg | 1920×1071 | 지금 이런 변화가 느껴지시나요 |
| 3 | hilowave-3.jpg | 1920×988 | 힐로웨이브란 — 피부 단면 다이어그램 |
| 4 | hilowave-4.jpg | 1920×1145 | 이런 분께 추천합니다 |
| 5 | hilowave-5.jpg | 1920×1128 | 자연스러운 변화의 무드 |
| 6 | hilowave-6.jpg | 1920×972 | HILO WAVE PROGRAM 가격 안내 |
| 7 | hilowave-7.jpg | 1920×1004 | 과하지 않게, 하지만 확실하게 |
| 8 | hilowave-8.jpg | 1920×2058 | 의료진 소개 — 김수영·천신혜 대표원장 |
| 9 | hilowave-9.jpg | 1920×2189 | LIV EXPERIENCE 공간 |

### 3.2 HERO_BUTTONS (Plan §5 확정 좌표)

| label | top% | left% | w% | h% | href | external | target |
|-------|------|-------|----|----|------|----------|--------|
| 상담 예약 | 79 | 7 | 17.5 | 7 | `/contact` | false (next-intl Link) | 같은 탭 |
| 카카오 상담 | 79 | 26.5 | 17.5 | 7 | `https://pf.kakao.com/_hgFwn` | true | `_blank` + `rel="noopener noreferrer"` |

---

## 4. API Contract

**없음.** 정적 페이지, 서버 라우트/fetch 0. (gap-detector Contract 축은 N/A)

---

## 5. Component Spec

### 5.1 page.tsx

- `'use client'` (framer-motion 사용).
- 컨테이너: `<main className="overflow-x-hidden bg-white">`. 가로 스크롤 원천 차단.
- 이미지 래퍼: `<div className="relative w-full max-w-[1920px] mx-auto">` — 초대형 모니터(>1920px)에서도 중앙정렬·여백(레터박스 대신 흰 배경). 이미지 `className="block w-full h-auto"`.
- 모든 `<Image>`: `quality={95}`, `width`/`height` 명시(실측). 히어로만 `priority`, 나머지는 기본 lazy + `sizes="100vw"`.

**히어로 블록**:
```tsx
<section className="relative w-full max-w-[1920px] mx-auto">
  <Image src={HERO.src} width={1920} height={1208} alt={HERO.alt}
         quality={95} priority sizes="100vw" className="block w-full h-auto" />
  {HERO_BUTTONS.map((b) => {
    const style = { top:`${b.topPct}%`, left:`${b.leftPct}%`,
                    width:`${b.widthPct}%`, height:`${b.heightPct}%` };
    const cls = `absolute z-10 rounded-md transition-colors duration-300
                 hover:bg-white/15 ${DEBUG ? 'outline outline-2 outline-red-500 bg-red-500/20' : ''}`;
    return b.external
      ? <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer"
           aria-label={b.label} className={cls} style={style} />
      : <Link key={b.label} href={b.href} aria-label={b.label}
              className={cls} style={style} />;
  })}
</section>
```
- 투명 오버레이: 평소 `bg-transparent`, hover 시 `hover:bg-white/15`(살짝 밝아짐), `transition-colors`. DEBUG=true면 빨간 외곽선+반투명으로 좌표 확인.

**FadeUpImage 블록 (2~9번)**:
```tsx
function FadeUpImage({ img }: { img: StackImage }) {
  return (
    <motion.div
      className="relative w-full max-w-[1920px] mx-auto transition-transform transition-shadow
                 duration-500 hover:scale-[1.005] hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)]"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <Image src={img.src} width={img.width} height={img.height} alt={img.alt}
             quality={95} sizes="100vw" className="block w-full h-auto" />
    </motion.div>
  );
}
```
- fade-up: `y:32→0` + `opacity 0→1`, `once:true`(1회), soft easeOut 0.7s. // Plan SC7
- 미세 hover(D4): `hover:scale-[1.005]` + 아주 옅은 shadow. 과하지 않게.

### 5.2 layout.tsx (SEO)

기존 `antiaging/skincare/layout.tsx` 패턴 + `generatePageMetadata`(hreflang 자동) 사용.

```tsx
import { generatePageMetadata, generateWebPageSchema, generateBreadcrumbSchema, BASE_URL } from '@/lib/seo';
import { SITE_INFO } from '@/lib/constants';

const PATH = '/antiaging/hilowave';
const TITLE = '힐로웨이브(HILO WAVE) | LIV 성형외과';
const DESC = '피부 밀도·탄력·리프팅을 한 번에 — HILO WAVE는 피부 깊숙이 차오르는 자연스러운 탄력의 흐름을 선사하는 LIV 성형외과의 안티에이징 프로그램입니다.';
const OG = `${BASE_URL}/images/antiaging/hilowave/hilowave-full.jpg`;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return generatePageMetadata({
    locale, path: PATH, title: TITLE, description: DESC,
    keywords: ['힐로웨이브','HILO WAVE','피부 밀도','피부 탄력','리프팅','안티에이징','신사역 안티에이징','LIV 성형외과'],
    images: [{ url: OG, width: 1920, height: 11732, alt: 'HILO WAVE' }],
  });
}

export default function HiloWaveLayout({ children }: { children: React.ReactNode }) {
  const pageSchema = generateWebPageSchema({
    path: PATH, title: TITLE, description: DESC, locale: 'ko', type: 'MedicalWebPage',
  });
  const breadcrumb = generateBreadcrumbSchema([
    { name: '홈', url: '/' },
    { name: '안티에이징', url: '/antiaging' },
    { name: 'HILO WAVE', url: PATH },
  ]);
  return (<>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
    {children}
  </>);
}
```
> 주의: 기존 skincare layout은 `generateWebPageSchema`에 `breadcrumbs`를 직접 넣음 — seo.ts 실제 시그니처 확인 후 `breadcrumbs` 인자 지원 시 통합, 미지원 시 위처럼 분리 스키마 사용(Do에서 시그니처 검증).

### 5.3 Header.tsx 메뉴 (작업 1)

`navItems`의 `antiaging.children` **맨 끝**에 1줄:
```ts
{ key: 'hilowave', label: t('hilowave'), href: '/antiaging/hilowave' },
```
- 위치: skincare 뒤(D1). href는 locale-less(next-intl `<Link>` 자동 prefix).
- 데스크톱 드롭다운 + `MobileMenu` 공유 → 양쪽 자동 노출(SC1/SC2).

### 5.4 i18n 라벨 (11개 로케일)

`src/messages/{ko,en,ja,zh,zh-TW,vi,th,ru,mn,fr,ar}.json`의 `nav` 블록에 추가:
```json
"hilowave": "HILO WAVE"
```
- 전 로케일 동일 라벨(영문 브랜드명 유지). 누락 시 next-intl 런타임 에러 → 11개 전부 필수(SC3).

---

## 6. 이미지 복사 (작업 2 선행)

```
copy  C:\dev\LIV_homepage\public\images\antiaging\hilowave\*.jpg
  →   C:\dev\LIV_homepage\liv-clinic\public\images\antiaging\hilowave\
```
9장 + `hilowave-full.jpg`. **복사 누락 시 전 이미지 404** → Do 첫 단계 + 검증 필수.

---

## 7. Test Plan (Check 단계 실행)

| Lv | 항목 | 방법 | 기대 |
|----|------|------|------|
| L1 | 라우트 200 | `curl /ko/antiaging/hilowave` | 200, HTML 포함 |
| L1 | 이미지 200 | `curl -I /images/antiaging/hilowave/hilowave-1.jpg` | 200(404 아님) |
| L2 | 9장 렌더 순서 | Playwright/Chrome: `img[src*=hilowave-]` 9개, 순서 1→9 | 일치 |
| L2 | 가로 스크롤 0 | `document.documentElement.scrollWidth <= innerWidth` (모바일 375 + PC 1440) | true |
| L2 | 히어로 버튼 2개 | 오버레이 `a`/`Link` 2개, href·target 확인 | /contact(같은탭), kakao(_blank) |
| L2 | 메뉴 노출 | 안티에이징 드롭다운/모바일에 "HILO WAVE" 클릭 → 이동 | 정상 |
| L3 | fade-up | 스크롤 진입 시 opacity/transform 전이 | 동작 |
| - | 빌드/린트 | `npm run build` / `npm run lint` (liv-clinic) | 0 에러 |

---

## 8. Edge Cases / 제약

- **초대형 모니터(>1920px)**: `max-w-[1920px] mx-auto` 중앙정렬 + 흰 배경 여백(확정).
- **다국어 본문**: 통이미지는 한국어 디자인 1종. en/ja 등에서도 동일 이미지 노출(별도 번역 이미지 없음) — 메뉴 라벨만 다국어.
- **reduced-motion**: 기존 프로젝트 globals.css의 reduced-motion 정책 준수(framer-motion `whileInView`는 시스템 설정 영향 적음, 과한 모션 아님).
- **TREATMENTS 상수 미사용**: 통이미지라 데이터 기반 렌더 없음 → constants.ts 변경 0.
- **신규 의존성 0**: framer-motion / next-intl / next/image 기존 것만.

---

## 9. SEO 요약

- title `힐로웨이브(HILO WAVE) | LIV 성형외과` / description(밀도·탄력·리프팅 키워드)
- og:image `/images/antiaging/hilowave/hilowave-full.jpg`
- 9개 `<Image alt>` = §3.1 섹션명 (통이미지 텍스트 보완)
- hreflang/canonical: `generatePageMetadata`가 11개 로케일 자동 생성
- WebPage + Breadcrumb 스키마(layout)

---

## 10. 변경/생성 파일

**생성**: `app/[locale]/antiaging/hilowave/page.tsx`, `.../layout.tsx`, `public/images/antiaging/hilowave/*.jpg`(복사)
**수정**: `components/layout/Header.tsx`(1줄), `messages/*.json`(11개 nav.hilowave)

---

## 11. Implementation Guide

### 11.1 구현 순서
1. **이미지 복사** (public → liv-clinic/public) — 선행 필수
2. **layout.tsx** 생성 (SEO) — seo.ts 시그니처 검증 포함
3. **page.tsx** 생성 (manifest 상수 → 히어로 오버레이 → FadeUpImage 스택)
4. **Header.tsx** navItems 1줄 추가
5. **messages 11개** nav.hilowave 추가
6. **검증**: 이미지 복사 확인 → `npm run build`/`lint` → dev 서버 `/ko/antiaging/hilowave` 육안 점검(9장 순서·버튼·fade-up·가로스크롤)

### 11.2 의존성 설치
없음 (기존 의존성만).

### 11.3 Session Guide

**Module Map**
| 모듈 | 범위 키 | 파일 | 의존 |
|------|--------|------|------|
| M1 이미지 자산 | `assets` | public 복사 | — |
| M2 페이지 | `page` | page.tsx + layout.tsx | M1 |
| M3 메뉴/i18n | `menu` | Header.tsx + messages 11개 | — |

**Recommended Session Plan**: 단일 세션 권장(소규모). 분할 시:
- `/pdca do hilowave --scope assets,page` (자산 복사 + 페이지)
- `/pdca do hilowave --scope menu` (메뉴 + 11개 로케일)

---

**다음 단계**: `/pdca do hilowave` (구현 시작 — Checkpoint 4 승인 후 진행)
