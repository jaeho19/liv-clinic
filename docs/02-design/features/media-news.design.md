# Media & News 섹션/아카이브 설계

> **Feature**: `media-news`
> **Phase**: Design
> **Created**: 2026-05-20
> **Plan**: `docs/01-plan/features/media-news.plan.md`
> **확정 결정**: D1 전 언어 노출+UI만 번역 · D2 Doctor↔Location 사이 · D3 내부 소식 모달

---

## 1. 개요 & 아키텍처

언론보도(press) + LIV 소식(news)을 **단일 데이터 소스**(`mediaNewsData.ts`)로 관리하고, 메인은 대표 6카드, `/[locale]/media`는 연도·카테고리 아카이브로 렌더한다. 기사 데이터는 KR 단일, UI 크롬만 11개 로케일 번역(D1).

```
src/lib/data/mediaNewsData.ts ─┬─► featuredMediaNews(6) ─► MediaNewsSection ─► [locale]/page.tsx (Doctor↔Location)
                               │
                               └─► mediaNewsData(14) ────► [locale]/media/page.tsx('use client')
                                                              ├─ MediaNewsFilter (category 탭)
                                                              ├─ 연도 그룹 → MediaNewsCard[]
                                                              └─ MediaNewsModal (내부 소식 D3)
                                   [locale]/media/layout.tsx (server) ─► generateMetadata + JSON-LD
공통: MediaNewsCard ← MediaNewsSection / media page 양쪽에서 재사용
i18n: messages/*.json × 11 ─► "mediaNews" 네임스페이스
```

### 1.1 Plan 대비 설계 정제 (중요)
| Plan 표현 | Design 확정 | 사유 |
|---|---|---|
| `media/page.tsx`(서버) + `MediaNewsArchive`(client child) | **`media/layout.tsx`(서버, 메타데이터/JSON-LD) + `media/page.tsx`('use client', 아카이브 본문)** | 기존 `events`/`medical` 라우트 컨벤션과 일치. 별도 Archive 래퍼 불필요 |
| 컴포넌트 6개 | **5개**(MediaNewsArchive 제거, page.tsx에 흡수) + layout.tsx | 코드베이스 관례(페이지 로직을 client page.tsx에 직접 작성) |
| hreflang 4개 | **`generatePageMetadata({ path: '/media' })` 호출 → 11개 전체** | ⚠️ `buildHreflangMap`은 `seo.ts`에서 **export 안 됨**(private). 대신 export된 `generatePageMetadata`가 내부에서 `buildHreflangMap(path)`로 11로케일 hreflang을 생성(seo.ts:204). 직접 import 금지 |
| 헬퍼명 `getYears(items)` (Plan §6.2) | **`MEDIA_YEARS` 상수 + `getItemsByYear(items, year)`** | 연도 순서를 하드코딩(2026/2025/2021)으로 고정해 표시 순서 보장 |

---

## 2. 파일 구조 (신규/수정)

### 2.1 신규
| 파일 | 역할 | 'use client' |
|---|---|---|
| `src/lib/data/mediaNewsData.ts` | 타입 + `mediaNewsData`(14) + `featuredMediaNews`(6) + 헬퍼 | - (순수 TS) |
| `src/components/sections/MediaNewsSection.tsx` | 메인 섹션(제목/설명/6카드/CTA 2) | ✅ |
| `src/components/sections/MediaNewsCard.tsx` | 공용 카드(메인·아카이브) | ✅ |
| `src/components/sections/MediaNewsFilter.tsx` | 카테고리 필터 탭 | ✅ |
| `src/components/sections/MediaNewsModal.tsx` | 내부 소식 모달(D3, portal) | ✅ |
| `src/app/[locale]/media/page.tsx` | 아카이브 본문(필터·연도그룹·모달 제어) | ✅ |
| `src/app/[locale]/media/layout.tsx` | 메타데이터 + Schema.org JSON-LD | - (server) |

### 2.2 수정
| 파일 | 변경 |
|---|---|
| `src/app/[locale]/page.tsx` | `MediaNewsSection` 동적 import, **Doctor 다음 / Location 앞** 삽입 |
| `src/components/sections/index.ts` | `MediaNewsSection`, `MediaNewsCard` export 추가 |
| `src/messages/{ko,en,ja,zh,zh-TW,vi,th,ru,fr,mn,ar}.json` (11) | `mediaNews` 네임스페이스 추가 |

---

## 3. 데이터 모델 (`src/lib/data/mediaNewsData.ts`)

### 3.1 타입
```ts
export type MediaType = 'press' | 'news';
export type MediaCategory = 'press' | 'news' | 'academic_global' | 'visit';

export interface MediaNewsItem {
  id: string;
  type: MediaType;          // 색·라벨 구분용 (press↔news)
  category: MediaCategory;  // 필터 기준
  badge: string;            // 예: 'BROADCAST'
  year: string;             // '2026' | '2025' | '2021'
  title: string;
  description: string;
  source?: string;
  link?: string;
  isExternal?: boolean;
}

export interface FeaturedMediaCard {
  id: string;
  type: MediaType;
  badge: string;
  year: string;
  title: string;
  description: string;      // 메인용 짧은 카피(상세와 다름)
  link: string;
  isExternal: boolean;
}

// 헬퍼
export const MEDIA_YEARS = ['2026', '2025', '2021'] as const; // 표시 순서(내림차순)
export function getItemsByYear(items: MediaNewsItem[], year: string): MediaNewsItem[];
export function filterByCategory(items: MediaNewsItem[], cat: MediaCategory | 'all'): MediaNewsItem[];
```

### 3.2 `mediaNewsData` (상세 14항목) — 요청서 §5 그대로
| id | type | category | badge | year | title | source | isExternal | link |
|----|------|----------|-------|------|-------|--------|-----------|------|
| 1 | press | academic_global | GLOBAL TRAINER | 2026 | APTOS 공식 트레이너 인증 | 하이뉴스 | true | hinews.co.kr/…dacadeb388_48 |
| 2 | press | press | BROADCAST | 2025 | SBS 좋은아침 방송 출연 | SBS / Vegan News | true | vegannews.co.kr/…no=354684 |
| 3 | press | academic_global | GLOBAL PROGRAM | 2025 | APTOS International Program 보도 | 이슈메이커 | true | issuemaker.kr/…idxno=51127 |
| 4 | press | press | COVER STORY | 2025 | 이슈메이커 커버스토리 | 이슈메이커 | true | issuemaker.kr/…idxno=50870 |
| 5 | press | press | ULTHERAPY PRIME | 2025 | Ultherapy-Prime 도입 인터뷰 | 헤모필리아 라이프 | true | hemophilia.co.kr/…idxno=32088 |
| 6 | press | press | REGENERATIVE CARE | 2025 | GRIDA 메디컬 톤매칭 시스템 소개 | 메디컬투데이 | true | mdtoday.co.kr/…1065576613797810 |
| 7 | news | academic_global | ACADEMIC | 2025 | 김수영 대표원장, Aesthetic Plastic Surgery Korea 초청 강연 | LIV 소식 | false | /media |
| 8 | news | academic_global | LIV NEWS | 2025 | APTOS 글로벌 트레이너 공식 인증패 수여 | LIV NEWS | false | /media |
| 9 | news | visit | LIV VISIT | 2025 | 배우 심형탁 님, 리브성형외과 방문 | LIV 소식 | false | /media |
| 10 | news | visit | LIV VISIT | 2025 | 가수 배기성 님 & 쇼호스트 이은비 님 부부, 리브성형외과 방문 | LIV 소식 | false | /media |
| 11 | news | visit | GLOBAL VISIT | 2025 | 중국 유명 인플루언서 다수, 리브성형외과 방문 | LIV 소식 | false | /media |
| 12 | news | visit | LIV VISIT | 2025 | 이진주 아나운서, 리브성형외과 방문 | LIV 소식 | false | /media |
| 13 | press | press | INTERVIEW | 2021 | 이슈메이커 인터뷰 | 이슈메이커 | true | issuemaker.kr/…idxno=32976 |
| 14 | press | press | MEDICAL COLUMN | 2021 | 메디컬투데이 초음파 강도 조절 인터뷰 | 메디컬투데이 | true | mdtoday.co.kr/…179516865175686 |

> `description`은 요청서 §5 원문 전체를 그대로 사용(여기선 지면상 생략). 내부 `link`는 `/media`로 두되, **모달 전용**(D3)이라 실제 네비게이션엔 쓰지 않음.
> 참고: id 7·8은 `type:news` + `category:academic_global`이라 필터에서 **"학술·글로벌"·"전체"**에만 노출되고 **"LIV 소식"(news 카테고리) 탭엔 노출되지 않음**(의도된 동작 — 학술 소식은 학술·글로벌로 분류). 필터는 `category` 기준이며 `type`은 색·라벨 구분 전용.

### 3.3 `featuredMediaNews` (메인 6카드) — 요청서 §2 (짧은 카피)
| id | type | badge | year | title | isExternal | link |
|----|------|-------|------|-------|-----------|------|
| f1 | press | BROADCAST | 2025 | SBS 좋은아침 방송 출연 | true | vegannews…354684 |
| f2 | press | COVER STORY | 2025 | 이슈메이커 커버스토리 | true | issuemaker…50870 |
| f3 | press | GLOBAL TRAINER | 2026 | APTOS 공식 트레이너 인증 | true | hinews…388_48 |
| f4 | news | ACADEMIC | 2025 | Aesthetic Plastic Surgery Korea 초청 강연 | false | /media |
| f5 | news | LIV NEWS | 2025 | APTOS 글로벌 트레이너 공식 인증패 수여 | false | /media |
| f6 | news | LIV VISIT | 2025 | 셀럽과 글로벌 인플루언서의 리브 방문 | false | /media |

> f6는 14항목에 없는 **집계형**(셀럽 실명 미노출, FR-4).

---

## 4. 컴포넌트 상세 설계

### 4.1 `MediaNewsCard.tsx` (공용)
```ts
interface MediaNewsCardProps {
  item: MediaNewsItem | FeaturedMediaCard;
  onSelect?: (item: MediaNewsItem) => void; // 제공 시 내부 소식 클릭→모달
  index?: number;                            // stagger 지연용
}
```
> 타입 narrowing: `FeaturedMediaCard`엔 `category`가 없고 `link`/`isExternal`이 필수, `MediaNewsItem`은 선택적이므로 union 처리 시 `'category' in item`로 분기. `onSelect`는 `MediaNewsItem`만 받으므로 내부 소식 클릭 시 narrowing 후 호출(메인의 `FeaturedMediaCard`는 `onSelect` 미전달이라 안전).
**렌더 분기**
- `isExternal === true` → `<a href={link} target="_blank" rel="noopener noreferrer">`, 버튼 라벨 `t('mediaNews.readArticle')`("기사 보기").
- 내부(`isExternal !== true`):
  - `onSelect` 있음(아카이브) → `<button onClick={() => onSelect(item)}>`, 라벨 `t('mediaNews.readMore')`("자세히 보기") → **모달**.
  - `onSelect` 없음(메인) → `<Link href="/media">`(next-intl Link, 로케일 자동), 라벨 `t('mediaNews.readMore')`.

**표시 요소**: badge(타입별 색) · year · source(있으면) · title(`line-clamp-2`) · description(`line-clamp-3`) · 버튼(화살표 아이콘).
**스타일**: `bg-white rounded-2xl border border-border p-6` + framer-motion `whileHover={{ y: -6 }}`. 텍스트 중심(이미지 없음).

### 4.2 `MediaNewsFilter.tsx`
```ts
interface MediaNewsFilterProps {
  active: MediaCategory | 'all';
  onChange: (next: MediaCategory | 'all') => void;
}
```
- 탭 정의(라벨은 i18n): `all`→전체, `press`→언론보도, `news`→LIV 소식, `academic_global`→학술·글로벌, `visit`→방문 소식.
- UI: `events`/`medical` 패턴의 pill 버튼. active=`bg-secondary text-white`, idle=`bg-background text-mono hover:bg-primary/10`. 모바일 가로 스크롤(`overflow-x-auto scrollbar-hide`).
- sticky: `sticky top-16 z-30 bg-white border-b border-border`(medical과 동일 오프셋).

### 4.3 `MediaNewsModal.tsx` (D3)
```ts
interface MediaNewsModalProps {
  open: boolean;
  item: MediaNewsItem | null;
  onClose: () => void;
}
```
- `BeforeAfterModal` 패턴 재사용: `createPortal(document.body)`, `mounted` 가드, `Escape` 닫기, `body.overflow='hidden'` 스크롤 락, 백드롭 클릭 닫기, `stopPropagation`.
- 내용: badge + year + source + title(h3) + **전체 description**(line-clamp 없음). 닫기 버튼(aria-label `common.close`).
- **a11y 강화(콘텐츠 모달 기준)**: 컨테이너에 `role="dialog" aria-modal="true" aria-labelledby={titleId}`. 열릴 때 닫기 버튼에 초기 포커스, 닫힐 때 직전 트리거(카드 버튼)로 포커스 복원(`triggerRef`). 단순 라이트박스인 `BeforeAfterModal`엔 없는 항목이므로 본 모달에서 추가 구현.
- 외부 기사엔 사용 안 함(외부는 anchor 직접 이동).

### 4.4 `MediaNewsSection.tsx` (메인)
- `t = useTranslations('mediaNews')`.
- 헤더: `label`(serif, "Media & News") + `title`(h2) + `description`(2문단).
- 그리드: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`, `featuredMediaNews.map` → `MediaNewsCard`(onSelect 미전달 → 내부는 /media 이동).
- CTA 2개: `<Link href="/media"><Button variant="primary">{t('viewAll')}</Button></Link>` + `<ScrollLink href="/contact"><Button variant="outline">{t('reservation')}</Button></ScrollLink>`.
- 래퍼: `<section className="section-gap bg-background">` + `container-custom` + `AnimateOnScroll`/`StaggerChildren`.

### 4.5 `media/page.tsx` (아카이브 본문, 'use client')
- 상태: `const [active, setActive] = useState<MediaCategory|'all'>('all')`; `const [selected, setSelected] = useState<MediaNewsItem|null>(null)`.
- `filtered = useMemo(() => filterByCategory(mediaNewsData, active), [active])`.
- 구성: ① 히어로(label/subtitle/description) ② `<MediaNewsFilter active onChange={setActive} />` ③ `MEDIA_YEARS.map(year => { const ys = getItemsByYear(filtered, year); if (!ys.length) return null; return <YearGroup>… })` ④ `<MediaNewsModal open={!!selected} item={selected} onClose={() => setSelected(null)} />`.
- 카드 그리드: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`. 카드에 `onSelect={setSelected}` 전달(내부→모달).
- 빈 연도 그룹 숨김(FR-8). 필터 전환 애니메이션은 `AnimatePresence`(events 패턴) 선택 적용.
- **빈 결과 폴백**: `filtered.length === 0`(모든 연도 그룹이 비는 경우) → events의 `noEvents`처럼 빈 상태 블록 렌더(`t('mediaNews.empty')` + 아이콘). 현재 데이터로는 모든 탭에 항목이 있으나, 향후 카테고리 확장 시 빈 페이지 방지.

### 4.6 `media/layout.tsx` (server, 메타데이터)
- `events/layout.tsx` 구조 차용(server 컴포넌트가 JSON-LD `<script>` 렌더 + `generateMetadata` export).
- **메타데이터**: 직접 hand-roll 하지 말고 export된 `generatePageMetadata`를 호출(11로케일 hreflang 자동).
  ```ts
  import { generatePageMetadata, BASE_URL } from '@/lib/seo';
  export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const meta = { ko: { title, description, keywords:[…] }, en:{…}, ja:{…}, zh:{…} };
    const m = meta[locale] ?? meta.ko;
    return generatePageMetadata({
      locale, title: m.title, description: m.description, keywords: m.keywords,
      path: '/media',
      images: [{ url: `${BASE_URL}/images/og-media.jpg`, width: 1200, height: 630, alt: m.title }],
    });
  }
  ```
  → 반환값에 `alternates.canonical`(=`${BASE_URL}/${locale}/media`) + `alternates.languages`(11로케일, 내부 `buildHreflangMap('/media')`) + `openGraph`/`twitter`/`robots`가 포함됨. `buildHreflangMap`/`seoConfig`는 직접 import하지 않는다.
- **JSON-LD**(layout 본문): `generateWebPageSchema({ ..., breadcrumbs:[{홈},{Media & News}] })`(seo.ts:723) — breadcrumb은 별도 호출 없이 WebPage 스키마 내부에 BreadcrumbList로 임베드(단일 스키마, 더 깔끔). 외부 기사 목록은 `ItemList`(`@type: NewsArticle`)로 직접 구성. `<script type="application/ld+json">`로 렌더. ※ 구현 반영(검증 결과 동기화).

---

## 5. i18n 키 스키마 (`messages/{locale}.json` × 11)

```jsonc
"mediaNews": {
  "label": "Media & News",
  "title": "언론과 소식을 통해 전하는 리브의 진료 철학",
  "description": "리브성형외과는 자연스러운 안티에이징, 정밀 리프팅, 재생 중심의 진료 철학을 바탕으로 방송, 전문 매체 인터뷰, 학술 활동, 글로벌 프로그램, LIV 소식을 통해 다양한 이야기를 전하고 있습니다.",
  "description2": "과장된 변화보다 개인의 얼굴 구조와 피부 상태를 고려한 절제된 시술을 지향합니다.",
  "viewAll": "미디어 전체보기",
  "reservation": "상담 예약하기",
  "page": {
    "title": "Media & News",
    "subtitle": "언론보도와 LIV 소식을 통해 전하는 리브의 진료 철학",
    "description": "리브성형외과의 방송 출연, 전문 매체 인터뷰, 학술 활동, 글로벌 인증, 병원 소식을 한곳에서 확인하실 수 있습니다. 리브는 자연스러운 안티에이징과 정밀한 맞춤 진료를 바탕으로, 국내외 다양한 채널을 통해 진료 철학과 전문 활동을 전하고 있습니다."
  },
  "filters": {
    "all": "전체", "press": "언론보도", "news": "LIV 소식",
    "academic_global": "학술·글로벌", "visit": "방문 소식"
  },
  "readArticle": "기사 보기",
  "readMore": "자세히 보기",
  "empty": "표시할 소식이 없습니다."
}
```
- **ko**: 위 원문. **en/ja/zh**: 자연어 번역. **zh-TW/vi/th/ru/fr/mn/ar**: 번역(또는 KO 폴백) — **키는 11개 전부 필수**(next-intl 누락 시 빌드 에러).
- 기존 `nav`에 `media` 키 추가는 **선택**(별도 합의). 본 설계 범위에선 미포함.

---

## 6. 메인 페이지 통합 (`[locale]/page.tsx`)

```tsx
const Doctor = dynamic(() => import('@/components/sections/Doctor'), { ssr: true });
const MediaNewsSection = dynamic(() => import('@/components/sections/MediaNewsSection'), { ssr: true }); // 추가
const Location = dynamic(() => import('@/components/sections/Location'), { ssr: true });
// …
<Doctor />
<MediaNewsSection />   {/* ← 추가: Doctor 다음, Location 앞 (D2) */}
<Location />
```

---

## 7. 디자인 토큰 & 스타일 매핑

| 요소 | 토큰/클래스 |
|---|---|
| 섹션 배경 | `bg-background`(#f6f6f6 크림) / 아카이브 `bg-white`·`bg-background` 교차 |
| 카드 | `bg-white rounded-2xl border border-border`, hover `shadow-lg` + `y:-6` |
| **press 뱃지** | `bg-secondary/8 text-secondary`(브라운 톤) |
| **news 뱃지** | `bg-primary/8 text-primary`(더스티 로즈 톤) |
| badge 타이포 | `text-[11px] tracking-[0.15em] uppercase font-medium px-2.5 py-1 rounded-full` |
| 연도 헤더 | `font-serif text-h2 text-secondary` + 하단 `border-b border-border` |
| title | `text-h4 text-secondary line-clamp-2` |
| description | `text-small text-mono-light line-clamp-3 leading-relaxed` |
| 버튼(카드) | 텍스트+화살표, `text-primary hover:gap-* ` (NaverBlog readMore 패턴) |
| 그리드 | 메인 `lg:grid-cols-3` / 아카이브 `lg:grid-cols-3 xl:grid-cols-4` / 태블릿 `sm:grid-cols-2` / 모바일 1열 |

---

## 8. 상태·인터랙션 흐름

```
[아카이브]
필터 클릭 → setActive(cat) → filtered 재계산 → 연도 그룹 재렌더(빈 그룹 숨김)
내부카드 "자세히 보기" 클릭 → setSelected(item) → MediaNewsModal open
  → Esc / 백드롭 / 닫기버튼 → setSelected(null)
외부카드 "기사 보기" 클릭 → 새 탭(target=_blank, noopener)

[메인]
"미디어 전체보기" → Link /media
"상담 예약하기" → ScrollLink /contact
내부카드 → Link /media   |   외부카드 → 새 탭
```

---

## 9. 접근성

- 모달: `role="dialog" aria-modal="true" aria-labelledby`(제목), `Escape` 닫기, 스크롤 락, 닫기 버튼 `aria-label`(`common.close`) + 초기 포커스, 닫힐 때 트리거로 포커스 복원, 백드롭 클릭 닫기, portal 렌더.
- 카드 버튼/링크: 외부는 `rel="noopener noreferrer"`, 키보드 포커스 가능(button/a 사용).
- 필터 탭: `<button>` 사용, active 시각 + 텍스트 라벨 동시 제공.
- 이미지 미사용(텍스트 중심)으로 alt 이슈 없음.

---

## 10. 의료광고 카피 검수 (Plan §7 연동)

- 데이터/카피 작성 시 금지어 11종 미포함(언론이 인정한/방송이 선택한/대한민국 대표/최고의/검증된 효과/부작용 없는/확실한 변화/무조건 만족/셀럽들이 믿고 선택한/글로벌 고객들이 인정한).
- 셀럽 방문: "방문했다 / Slow Aging 케어 철학을 소개" 중립 표현. 메인 f6 집계형으로 실명 미노출.
- 시술 효과 직접 암시 금지. (요청서 §5 원문이 이미 준수 — 그대로 사용)

---

## 11. 구현 순서 (Do 체크리스트)

1. [ ] `src/lib/data/mediaNewsData.ts` — 타입 + 14 + 6 + 헬퍼
2. [ ] `messages/*.json` 11개 `mediaNews` 네임스페이스 추가(ko 원문, en/ja/zh 번역, 그 외 폴백)
3. [ ] `MediaNewsCard.tsx`
4. [ ] `MediaNewsModal.tsx`
5. [ ] `MediaNewsFilter.tsx`
6. [ ] `MediaNewsSection.tsx` + `sections/index.ts` export
7. [ ] `[locale]/page.tsx` 삽입(Doctor↔Location)
8. [ ] `[locale]/media/page.tsx`(아카이브) + `[locale]/media/layout.tsx`(metadata/JSON-LD)
9. [ ] 빌드/lint/11로케일 렌더 검증

---

## 12. 검증 계획 (Evidence-Based)

```bash
cd C:\dev\LIV_homepage\liv-clinic
npm run lint     # 0 errors
npm run build    # exit 0 (타입체크 + 11로케일 정적 생성 → 누락 키 즉시 검출)
```
- 육안: `/ko/media`(필터 5탭·연도 2026/2025/2021·14카드·모달), `/en/media`(UI 번역·KR 데이터), 메인 `/ko`(Doctor↔Location 위치, 6카드, CTA 2 이동).
- 인수 조건: Plan §11 체크리스트 전 항목.

---

## 13. 리스크 (Plan §12 + 설계 보강)

| 리스크 | 완화 |
|---|---|
| 11개 로케일 누락 키 → build 실패 | §5대로 11개 전부 추가, build로 검증 |
| 모달 portal과 framer-motion transform 충돌 | `BeforeAfterModal` 검증된 portal 패턴 그대로 차용 |
| 외부 링크 도메인 오타 | §3.2 표 기준으로 1:1 입력, 빌드 후 링크 육안 확인 |
| f6 집계형 데이터 정합성 | `featuredMediaNews` 별도 배열 + 주석 명시 |

---

## 14. 설계 검증 반영 (design-validator, 2026-05-20)

완전성 점수 **88/100** → 아래 수정 반영 후 **Do-ready**.

| 우선순위 | 항목 | 반영 |
|---|---|---|
| 🔴 Critical | `buildHreflangMap` 미export(직접 import 시 빌드 실패) — seo.ts:10 private 확인됨 | §1.1·§4.6: export된 `generatePageMetadata({ path:'/media' })` 호출로 변경(내부 11로케일 hreflang) |
| 🟡 Warning | 빈 필터 결과 폴백 부재 | §4.5 빈 결과 블록 + §5 `mediaNews.empty` 키 추가 |
| 🟡 Warning | 모달 a11y(dialog 표준 미달) | §4.3·§9: `role=dialog`/`aria-modal`/초기 포커스/포커스 복원 추가 |
| 🟡 Warning | 헬퍼명 변경 미추적(`getYears`→`getItemsByYear`) | §1.1 표에 행 추가 |
| 🟢 Info | id 7·8가 "LIV 소식" 탭 미노출 | §3.2 각주로 의도 명시 |
| 🟢 Info | `MediaNewsCard` union narrowing 필요 | §4.1 narrowing 주석 추가 |
| 🟢 Info | `common.readMore` 기존 존재(중복) | 별도 `mediaNews.readMore` 유지(충돌 없음, 의도적) |

검증이 소스 대비 사실 확인됨(events/layout 패턴, BeforeAfterModal portal, routing.ts 11로케일, seo.ts export 여부 등 교차검증 통과).

## 15. 다음 단계

→ `/bkit:pdca do media-news`로 구현 진행(§11 순서).
