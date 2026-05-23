# Media & News 카드 이미지 위주 리디자인 설계

> **Feature**: `media-news-image-cards`
> **Phase**: Design
> **Created**: 2026-05-23
> **Plan**: `docs/01-plan/features/media-news-image-cards.plan.md`
> **확정 결정 (2026-05-23)**: 레이아웃=썸네일 상단형 · 이미지=OG 썸네일 · 범위=홈+/media · **아키텍처=C(실용적 균형)** · **저작권=OG 그대로 사용(출처 표기)**

---

## Context Anchor

| 키 | 값 |
|----|----|
| **WHY** | 텍스트 전용 카드는 언론 노출·소식의 시각적 임팩트를 살리지 못한다. 이미지 위주 카드로 가독성·주목도·클릭률을 높인다. |
| **WHO** | 홈 방문자(잠재 고객), 글로벌 고객, 언론/제휴 검토자. 모바일 비중 높음. |
| **RISK** | ① 외부 OG 이미지 저작권(→ 출처 표기로 보도 인용 맥락 유지) ② OG 품질 편차 ③ 폴백 일관성 ④ 홈 상단 다수 이미지 LCP/CLS. |
| **SUCCESS** | 홈 6 + /media 전 카드 깨짐 0, 폴백 포함 100% 커버, CLS 0, 모바일/데스크톱 정상. |
| **SCOPE** | 홈 `MediaNewsSection`(6) + `/media` 아카이브 전 카드. 카드 레이아웃·데이터 모델·OG 파이프라인. 모달 상세는 기존 유지. |

---

## 1. 개요 & 아키텍처

`MediaNewsCard`(홈·아카이브 **공용**)에 **16:9 미디어 슬롯**을 상단에 추가한다. 이미지 렌더/폴백 판단을 **공용 서브컴포넌트 `MediaNewsCardMedia`** 1개로 캡슐화하여, 카드의 3개 wrapper(외부 `<a>` / 내부 `<button>` / 내부 `<Link>`)가 동일하게 재사용한다(중복 제거). 외부 기사 썸네일은 **OG 이미지를 로컬로 내려받아** `next/image`로 서빙하고, 이미지가 없는 항목은 **브랜드 톤 그라데이션 플레이스홀더**로 폴백한다.

```
src/lib/data/mediaNewsData.ts (+image? 필드)
   ├─► featuredMediaNews(6) ─► MediaNewsSection ─► [locale]/page.tsx (priority: 1행 3장)
   └─► mediaNewsData(15)  ───► [locale]/media/page.tsx (연도그룹 → 카드, lazy)

MediaNewsCard.tsx (공용, 3 wrapper)
   └─► [신규] MediaNewsCardMedia.tsx ── src 있으면 <Image>, 없으면 <Placeholder>(코로케이트)
   └─► CardBody (기존 메타/제목/설명/CTA, p-6 내부로 이동)

[신규] extract-og-images.py (작업 폴더) ─► public/images/media-news/og/{id}.jpg
```

### 1.1 Plan 대비 설계 정제

| Plan 표현 | Design 확정 | 사유 |
|---|---|---|
| `MediaNewsPlaceholder.tsx`(신규 분리) | **`MediaNewsCardMedia.tsx` 내부에 `Placeholder` 코로케이트** | 폴백은 미디어 슬롯 전용·소형. 별도 파일 분리는 과임(아키텍처 C). 파일 1개로 응집 |
| 카드 이미지 로직 인라인 | **`MediaNewsCardMedia` 공용 서브컴포넌트** | 카드 wrapper가 3종이라 인라인 시 3× 중복 → "반복 3회+면 추상화" 규칙 적용 |
| `image` 또는 `images[0]` 사용 | **해상 우선순위: `item.image ?? images[0] ?? 폴백`** | featured엔 `images` 없음 → `'images' in item` 가드 |
| OG 핫링크 가능(remotePatterns) | **로컬 다운로드 고정** | 외부 의존·CLS·핫링크 차단 회피 (Plan §4.1) |

---

## 2. 파일 구조 (신규/수정)

### 2.1 신규
| 파일 | 역할 | 'use client' |
|---|---|---|
| `src/components/sections/MediaNewsCardMedia.tsx` | 16:9 미디어 슬롯(이미지\|폴백) + `Placeholder` 코로케이트 | ✅ |
| `C:\dev\LIV_homepage\extract-og-images.py` | OG 썸네일 추출·다운로드(1회성) | - (작업 폴더 스크립트) |
| `liv-clinic/public/images/media-news/og/{id}.jpg` | 다운로드된 OG 이미지 | - (정적 자산) |

### 2.2 수정
| 파일 | 변경 |
|---|---|
| `src/lib/data/mediaNewsData.ts` | `MediaNewsItem`·`FeaturedMediaCard`에 `image?: string` 추가 + 항목별 경로 주입(§5.3) |
| `src/components/sections/MediaNewsCard.tsx` | 미디어 슬롯 상단 삽입 + 패딩 재구조화(`p-6` 외곽→내부) + `priority?` prop |
| `src/components/sections/MediaNewsSection.tsx` | `MediaNewsCard`에 `priority={index < 3}` 전달(1행 LCP) |

> **불변(Surgical)**: `CardBody`(텍스트 렌더), `MediaNewsModal`, `MediaNewsFilter`, i18n 키, `media/page.tsx`, `media/layout.tsx`는 변경 없음. (i18n `readArticle/readMore` 그대로 사용)

---

## 3. 데이터 모델 변경 (`mediaNewsData.ts`)

```ts
export interface MediaNewsItem {
  // …기존 필드 (id, type, category, badge, year, title, description, source?, link?, isExternal?, body?, images?)
  image?: string;   // ★ 카드 썸네일(로컬 경로). 없으면 images[0] → 폴백 순
}

export interface FeaturedMediaCard {
  // …기존 필드 (id, type, badge, year, title, description, link, isExternal, newsId?)
  image?: string;   // ★ 카드 썸네일(로컬 경로). 없으면 폴백
}
```

- **역할 분리**: `image`=카드 썸네일(1장), `images`=모달 갤러리(N장). 혼동 금지.
- 신규 필드는 **optional** → 기존 데이터/타입 호환(빌드 안전).

---

## 4. 컴포넌트 상세 설계

### 4.1 `MediaNewsCardMedia.tsx` (신규, 공용)

```ts
interface MediaNewsCardMediaProps {
  src?: string | null;   // 해상된 썸네일 경로(없으면 폴백)
  alt: string;           // = item.title (의미 있는 대체텍스트)
  type: MediaType;       // 폴백 색조(press=브라운 / news=로즈)
  badge: string;         // 폴백에 표기할 라벨
  priority?: boolean;    // 홈 1행만 true (LCP)
}
```

**렌더**
```tsx
<div className="relative aspect-[16/9] overflow-hidden rounded-t-2xl bg-background">
  {src ? (
    <Image
      src={src} alt={alt} fill
      sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
      priority={priority}
      className="object-cover transition-transform duration-500 group-hover:scale-105"
    />
  ) : (
    <Placeholder type={type} badge={badge} />   // 코로케이트
  )}
</div>
```

**`Placeholder`(동일 파일 내부)**
```tsx
// 브랜드 톤 그라데이션 + LIV 모노그램 + 배지. 이미지 자산 0(CSS/SVG).
const grad = type === 'press'
  ? 'from-secondary to-secondary/60'   // 다크 브라운 톤
  : 'from-primary to-primary/55';      // 더스티 로즈 톤
<div role="img" aria-label={`${badge} 대표 이미지`}
     className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${grad}`}>
  <span className="font-serif text-4xl tracking-[0.2em] text-white/95">LIV</span>
  <span className="mt-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/80">{badge}</span>
</div>
```

### 4.2 `MediaNewsCard.tsx` (수정)

**(a) 썸네일 해상**
```ts
const imageSrc =
  item.image ?? ('images' in item ? item.images?.[0] : undefined) ?? null;
```

**(b) 패딩 재구조화** — 이미지가 카드 모서리까지 닿도록 외곽 `p-6` 제거, 텍스트만 패딩.
```ts
// 변경 전: '… bg-white p-6 …'
// 변경 후: '… bg-white overflow-hidden …'  (p-6 제거, overflow-hidden 추가)
const cardClass =
  'group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white text-left ' +
  'transition-shadow duration-300 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50';
```

**(c) 공용 내용 블록** — 3개 wrapper 중복 제거용 내부 컴포넌트.
```tsx
function CardContent({ item, ctaLabel, imageSrc, priority }: …) {
  return (
    <>
      <MediaNewsCardMedia src={imageSrc} alt={item.title} type={item.type}
                          badge={item.badge} priority={priority} />
      <div className="flex flex-1 flex-col p-6">   {/* mt-auto(CTA) 동작 위해 flex-col flex-1 */}
        <CardBody item={item} ctaLabel={ctaLabel} />
      </div>
    </>
  );
}
```
> `CardBody`의 CTA는 `mt-auto`로 하단 고정 → 부모가 `flex flex-1 flex-col`이어야 동작하므로 내부 패딩 div에 적용.

**(d) wrapper 3종은 `CardContent`만 감싼다** (렌더 분기 로직은 기존 유지)
- 외부(`isExternal && link`): `<motion.a target=_blank rel=noopener>` → `<CardContent priority={priority} … />`
- 내부+`onSelect`(아카이브): `<motion.button onClick>` → `<CardContent … />` (priority 미전달=lazy)
- 내부(메인): `<Link href><motion.div>` → `<CardContent priority={priority} … />`

**(e) props 추가**: `priority?: boolean`(기본 false). 모션 `whileHover={{ y:-6 }}`·stagger 유지.

### 4.3 `MediaNewsSection.tsx` (수정)
```tsx
{featuredMediaNews.map((card, index) => (
  <MediaNewsCard key={card.id} item={card} index={index} priority={index < 3} />
))}
```
> 홈 1행(lg 3열)만 `priority` → LCP 대상 최소화. `/media`는 미전달(전부 lazy, 스크롤 다수).

---

## 5. OG 추출 파이프라인 (`extract-og-images.py`)

### 5.1 동작
1. `mediaNewsData`의 `isExternal === true` 항목 `link` 수집(§5.3 외부 8건)
2. 각 페이지 요청(UA 헤더 지정) → `<meta property="og:image">`(없으면 `twitter:image`) 파싱
3. 이미지 다운로드 → `liv-clinic/public/images/media-news/og/{id}.jpg`
4. 성공/실패·해상도 리포트 출력 → 실패 항목은 **폴백 처리**(데이터에 `image` 미주입)

```
표준 라이브러리/requests 기반(파이썬). WebFetch 툴 미사용.
저장 규칙: og/{id}.jpg, 가로<600px 또는 매체 공용 로고면 SKIP→폴백.
```

### 5.2 저작권 처리 (확정: OG 그대로 사용)
- 외부 기사 OG를 사용하되 카드에 **출처·매체명(`source`) 표기 유지**(보도 인용 맥락).
- 카드 클릭 시 **원문 링크로 이동**(귀속 명확). 내부 소식엔 OG 미적용.

### 5.3 항목별 이미지 매핑

**외부(OG 대상, 8건)** — Do 실측 반영(2026-05-23): 8/8 성공, 확장자·해상도는 매체 OG 원본을 따름
| id | 매체 | OG 경로(실측) | 해상도 | 비고 |
|----|------|------------------|--------|------|
| 1 (f3) | 하이뉴스 | `og/1.jpg` | 500×375 | 양호 |
| 2 (f1) | Vegan News/SBS | `og/2.png` | 500×562 | 양호(PNG) |
| 3 | 이슈메이커 | `og/3.jpg` | 300×168 | 저화질 |
| 4 (f2) | 이슈메이커 | `og/4.jpg` | 300×214 | 저화질 |
| 5 | 헤모필리아 | `og/5.png` | 260×391 | 좁음(PNG) |
| 6 | 메디컬투데이 | `og/6.jpg` | 600×429 | 양호 |
| 13 | 이슈메이커 | `og/13.jpg` | 300×199 | 저화질 |
| 14 | 메디컬투데이 | `og/14.jpg` | 450×300 | 보통 |

**내부(폴백/보유, 7건)**
| id | 항목 | 이미지 |
|----|------|--------|
| 15 (f7) | 메디컬 에스테틱 | **보유** `media-news/medical-aesthetic-1.jpg`(`images[0]` 자동) |
| 7 (f4) | 학회 강연 | 폴백(press 톤) |
| 8 | 인증패 | 폴백 |
| 9·10·12 | 셀럽 방문 | 폴백(초상권 — 실사 금지) |
| 11 | 글로벌 인플루언서 | 폴백 |
| f6 | 셀럽 집계(홈) | 폴백(news 톤) |

> **홈 6장 결과**: f7(실사) + f1/f2/f3(OG) = 4 실이미지 + f4/f6 폴백 2 → 전 카드 비주얼 100%.

### 5.4 얼굴 자동 초점 (object-position, 2026-05-23 추가)
OG/실사 썸네일을 16:9로 중앙 크롭하면 세로형 사진의 얼굴이 잘리는 문제 → **로컬 얼굴 검출로 초점 좌표 자동 산출**.
- `detect-faces.py`(작업 폴더, OpenCV haar: frontal/alt2/profile, 작은 썸네일은 가로 600 업스케일 후 검출) → 가장 큰 얼굴 중심을 `%`로 환산 → `imagePosition` 문자열(예: `'52% 14%'`). 얼굴 미검출·중앙근접(±8%)은 중앙 유지.
- 데이터: `MediaNewsItem`·`FeaturedMediaCard`에 **`imagePosition?: string`** 추가. `MediaNewsCardMedia`가 `<Image style={{objectPosition}}>`로 적용(없으면 CSS 기본 중앙).
- 검출 결과(중앙 외): id1 `25% 30%`, id2/f1 `52% 14%`, id4/f2 `83% 18%`, id5 `49% 30%`, id6 `51% 17%`, id13 `63% 33%`, id14 `67% 27%`, id15/f7 `63% 57%`. id3=얼굴 미검출→중앙.
- 외부 접속 아님(받아둔 로컬 이미지 분석) → 정책 차단 없이 에이전트 실행 가능.

---

## 6. 디자인 토큰 & 스타일

| 요소 | 토큰/클래스 |
|---|---|
| 미디어 프레임 | `relative aspect-[16/9] overflow-hidden rounded-t-2xl bg-background` |
| 이미지 | `object-cover` + `group-hover:scale-105 transition-transform duration-500` |
| 폴백 press | `bg-gradient-to-br from-secondary to-secondary/60`(브라운) |
| 폴백 news | `bg-gradient-to-br from-primary to-primary/55`(로즈) |
| 폴백 모노그램 | `font-serif text-4xl tracking-[0.2em] text-white/95` + 배지 `text-[11px] uppercase tracking-[0.2em] text-white/80` |
| 카드 외곽 | `rounded-2xl border border-border bg-white overflow-hidden` + hover `shadow-lg` + `y:-6` |
| 텍스트 영역 | `flex flex-1 flex-col p-6` (CardBody 그대로) |
| 그리드 | 홈 `lg:grid-cols-3` / 아카이브 `lg:grid-cols-3 xl:grid-cols-4` / `sm:grid-cols-2` / 모바일 1열 (기존 유지) |

---

## 7. 성능 (LCP/CLS)

- **CLS 0**: `aspect-[16/9]`로 공간 사전 예약(이미지 로드 전후 시프트 없음).
- **LCP**: 홈 1행 3장만 `priority`, 나머지 전부 `loading=lazy`(next/image 기본). `/media`는 전부 lazy.
- **포맷/용량**: `next.config.ts` `formats:['avif','webp']` 자동 변환. OG 원본 권장 ≤ 200KB, 가로 ≥ 600px.
- `sizes`로 뷰포트별 적정 해상도 다운로드(모바일 100vw / 태블릿 50vw / 데스크톱 33vw).

---

## 8. 접근성

- 이미지 `alt={item.title}` — 기사/소식을 설명하는 의미 있는 텍스트.
- 폴백 `role="img" aria-label="{badge} 대표 이미지"`.
- 미디어는 카드 wrapper(a/button/Link) 내부 → 전체 카드가 단일 클릭/포커스 타깃(중복 포커스 없음).
- 외부 `rel="noopener noreferrer"` 유지, 키보드 접근 가능(button/a).

---

## 9. 상태·인터랙션

```
호버: 카드 y:-6(상승) + shadow-lg + 이미지 scale-105(줌) 동시
외부 카드 클릭 → 새 탭(원문, target=_blank)
내부 카드(홈) → /media 이동 (newsId 있으면 상세 모달 자동 오픈)
내부 카드(/media, onSelect) → 모달 오픈
이미지 로드 실패(런타임) → next/image 기본 동작 (대비책: 데이터 단계서 OG 실패는 폴백 처리)
```

---

## 10. 리스크 (Plan §8 + 설계 보강)

| 리스크 | 완화 |
|---|---|
| OG fetch 차단/부재 | 스크립트 실패 리포트 → 해당 항목 폴백 자동 |
| OG 규격/로고형 | §5.1 SKIP 기준(가로<600·로고) → 폴백 |
| OG 저작권(수용) | 출처 표기 + 원문 링크 귀속 유지(확정 방침) |
| 홈 다수 이미지 LCP | 1행만 priority, 나머지 lazy, avif/webp |
| CLS | `aspect-[16/9]` 고정 |
| 실사/폴백 톤 불일치 | 동일 16:9 프레임 + 브랜드 팔레트 폴백으로 통일 |
| 패딩 재구조화로 `mt-auto` CTA 깨짐 | 내부 div `flex flex-1 flex-col` 명시(§4.2c) |

---

## 11. 구현 가이드

### 11.1 구현 순서 (Do 체크리스트)
1. [ ] `extract-og-images.py` 작성·실행 → `public/images/media-news/og/*.jpg` 생성 + 성공/실패 리포트
2. [ ] `mediaNewsData.ts` — `image?` 필드 추가 + §5.3 매핑대로 외부 OG 경로/ f7 보유 경로 주입
3. [ ] `MediaNewsCardMedia.tsx` 신규(이미지 슬롯 + `Placeholder` 코로케이트)
4. [ ] `MediaNewsCard.tsx` — `imageSrc` 해상 + `cardClass` 패딩 재구조화 + `CardContent` + `priority?` prop
5. [ ] `MediaNewsSection.tsx` — `priority={index < 3}` 전달
6. [ ] 빌드/lint + 육안(홈 6카드, `/media` 전 필터, 모바일/데스크톱)

### 11.2 검증 계획 (Evidence-Based)
```bash
cd C:\dev\LIV_homepage\liv-clinic
npm run lint     # 0 errors
npm run build    # exit 0 (타입체크 + 정적 생성)
```
- 육안: `/ko`(홈 6카드 비주얼·1행 즉시 로드·폴백 2), `/ko/media`(연도그룹 전 카드 이미지/폴백, 필터 전환), 모바일 1열·태블릿 2열.
- 성능: PageSpeed/Lighthouse — CLS≈0, LCP 예산 내.
- 인수 조건: Plan §9 Success Criteria(SC-1~SC-8).

### 11.3 Session Guide

**Module Map**
| scope key | 모듈 | 파일 | 의존 |
|---|---|---|---|
| `module-1` | 데이터·OG 파이프라인 | `extract-og-images.py`, `mediaNewsData.ts`, `public/.../og/*` | - |
| `module-2` | 미디어 컴포넌트 | `MediaNewsCardMedia.tsx`(+Placeholder) | module-1(경로) |
| `module-3` | 카드 통합·성능 | `MediaNewsCard.tsx`, `MediaNewsSection.tsx` | module-2 |

**Recommended Session Plan**
- 소규모(신규 1·수정 3)라 **단일 세션** 권장.
- 분할 시: 세션 A=`module-1`(OG 추출·데이터), 세션 B=`module-2,module-3`(UI 통합·검증).
```
/pdca do media-news-image-cards                          # 전체
/pdca do media-news-image-cards --scope module-1         # 데이터·OG만
/pdca do media-news-image-cards --scope module-2,module-3 # UI 통합
```

---

## 12. 다음 단계

→ `/pdca do media-news-image-cards` 로 구현 진행(§11.1 순서). OG 스크립트(module-1)부터 실행해 실제 확보 가능한 이미지 수를 먼저 확인하는 것을 권장.
