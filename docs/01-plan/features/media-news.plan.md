# Media & News 섹션/아카이브 기획

> **Feature**: `media-news`
> **Phase**: Plan
> **Created**: 2026-05-20
> **Owner**: 리브성형외과 / LIV_homepage (Next.js)
> **관련 라우트**: `/[locale]` (메인), `/[locale]/media` (신규 상세 아카이브)

---

## 0. 한 줄 결론

기존 "Media & Press"를 확장하라는 요청이지만 **현재 코드베이스에는 해당 섹션도 `/media` 라우트도 존재하지 않으므로, 사실상 신규 기능으로 설계한다.** 언론보도(press)와 LIV 소식(news)을 하나의 데이터로 통합해, 메인에는 대표 6개 카드, `/[locale]/media`에는 연도별·카테고리별 프리미엄 아카이브를 만든다.

---

## 1. 배경 & 현재 상태 (Reality Check)

요청서는 "기존 Media & Press 섹션 / 기존 /ko/media 페이지"를 전제하지만, 실제 확인 결과는 다음과 같다.

| 요청서 전제 | 실제 코드베이스 상태 | 영향 |
|---|---|---|
| 기존 Media & Press 섹션 존재 | **없음.** 메인 = `Hero → Equipment → Signature → CoreValues → Doctor → Location` (`src/app/[locale]/page.tsx`) | "수정"이 아닌 **신규 섹션 추가** |
| 기존 `/ko/media` 페이지 존재 | **없음.** `src/app/[locale]/` 하위에 `media/` 라우트 없음 | **신규 라우트 생성** |
| 단일 언어 | 실제 **11개 로케일** (`ko, en, ja, zh, zh-TW, vi, th, ru, fr, mn, ar`) | i18n 전략 필요 (§5) |

### 1.1 참고할 기존 패턴 (재사용 자산)
- **가장 유사한 컴포넌트**: `src/components/sections/NaverBlog.tsx` — 클라이언트 카테고리 필터 + 카드 그리드(`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) + `AnimateOnScroll/StaggerChildren/StaggerItem` + framer-motion 호버. 본 기능의 카드/필터 UX 레퍼런스.
- **섹션 컨벤션**: `'use client'`, `useTranslations`, `section-gap`, `container-custom`, 색 토큰(`text-secondary/text-primary/text-mono-light`, `bg-background/bg-white`), `@/components/ui`의 `AnimateOnScroll`·`StaggerChildren`·`StaggerItem`·`Button`. (`CoreValues.tsx`, `NaverBlog.tsx` 참고)
- **콘텐츠 페이지 + 필터 패턴**: `src/app/[locale]/medical/page.tsx` — sticky 필터바, 클라이언트 상태 필터, `LayoutGroup` 애니메이션, CTA 섹션. 상세 아카이브 레이아웃 레퍼런스.
- **모달 패턴**: `src/components/sections/BeforeAfterModal.tsx`, `src/components/layout/PopupModal.tsx` — 내부 소식 모달에 재사용.
- **상담 예약 경로**: `/contact` (medical 페이지에서 `<ScrollLink href="/contact">` 사용). "상담 예약하기" 버튼은 이 경로를 따른다.
- **i18n SSOT**: `src/i18n/routing.ts`의 `LOCALES` 배열. 메시지는 `src/messages/{locale}.json`.

---

## 2. 목표 & 비목표

### 2.1 목표
1. 언론보도 + LIV 소식을 **하나의 통합 데이터(`mediaNewsData`)**로 관리하고, 단순 기사 목록이 아닌 **프리미엄 아카이브** 톤으로 표현.
2. **메인 섹션**: 대표성 있는 6개 카드 + 2개 CTA(미디어 전체보기 / 상담 예약하기).
3. **상세 아카이브 `/[locale]/media`**: 히어로 + 카테고리 필터 탭 + 연도별 그룹(2026/2025/2021) + 카드 리스트 + 내부 소식 모달.
4. **의료광고 규제 준수**: 금지 표현 0개, 중립적·절제된 표현 유지(§7).
5. 11개 로케일 전체에서 빌드/렌더 오류 없이 동작.

### 2.2 비목표 (Out of Scope)
- 기사 데이터의 CMS/DB 연동 (이번엔 정적 데이터 파일로 관리, Supabase 미사용).
- 항목별 개별 상세 라우트(`/media/[id]`) 생성 (내부 소식은 모달로 처리).
- 14개 항목의 제목·본문까지 11개 언어 완전 번역 (UI 크롬만 번역, §5).
- 실제 기사 썸네일 이미지 수급 (텍스트 중심 카드, 이미지는 선택).
- Naver/Instagram 등 외부 피드 자동 수집.

---

## 3. 확정된 설계 결정 (사용자 승인 완료, 2026-05-20)

| # | 결정 사항 | 선택 | 근거 |
|---|---|---|---|
| D1 | i18n 범위 | **전 언어 노출 + UI만 번역** | 언론보도는 본질적으로 한국 매체 → 기사 데이터는 KR 공유, UI 크롬(제목/필터/버튼)만 11개 번역. 유지보수 부담 최소. |
| D2 | 메인 섹션 배치 | **Doctor 다음, Location 앞** | 의료진(전문성) → 미디어/소식(신뢰 확장) → 오시는 길(전환) 흐름. |
| D3 | 내부 소식(`isExternal:false`) 동작 | **모달 팝업으로 전체 내용 표시** | 개별 라우트 불필요, 기존 모달 패턴 재사용, 확장성 확보. |

---

## 4. 기능 요구사항 (FR)

### 4.1 메인 섹션 (`MediaNewsSection`)
- **FR-1** 섹션 제목 `Media & News`, 부제 "언론과 소식을 통해 전하는 리브의 진료 철학", 설명문(2문단) 표시 — 모두 i18n 키.
- **FR-2** 대표 카드 **6개** 노출 (`featuredMediaNews` 배열). 배열: 모바일 1열 / 태블릿 2열 / 데스크톱 3열 (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).
- **FR-3** CTA 버튼 2개: "미디어 전체보기" → `/media`(로케일 Link), "상담 예약하기" → `/contact`.
- **FR-4** 메인 카드는 셀럽 실명 최소화 — 6번 카드는 개별 인물이 아닌 **집계형("셀럽과 글로벌 인플루언서의 리브 방문")** 으로 처리(요청서 명시).
- **FR-5** 메인 카드 클릭: 외부 링크면 새 탭, 내부면 `/media`로 이동(메인에서는 모달 미사용).

### 4.2 상세 아카이브 (`/[locale]/media`)
- **FR-6** 히어로: `Media & News` + 부제 + 설명문(i18n).
- **FR-7** 필터 탭 5개: 전체 / 언론보도(press) / LIV 소식(news) / 학술·글로벌(academic_global) / 방문 소식(visit). `category` 기준 필터링.
- **FR-8** 연도별 그룹 표시: **2026 → 2025 → 2021** (데이터 `year` 기준 내림차순 그룹핑). 필터 적용 시 해당 카테고리가 없는 연도 그룹은 숨김.
- **FR-9** 카드 표시 필드: `badge`, `year`, `source`, `title`, `description`(line-clamp), 버튼.
- **FR-10** 버튼 문구: 외부 기사 → "기사 보기", 내부 소식 → "자세히 보기".
- **FR-11** 외부 링크: `target="_blank" rel="noopener noreferrer"`.
- **FR-12** 내부 소식 "자세히 보기" 클릭 → **모달**로 badge/year/source/title/전체 description 표시 (D3).
- **FR-13** 반응형 카드 그리드: 모바일 1열 / 태블릿 2열 / 데스크톱 3~4열.
- **FR-14** SEO: 라우트에 `generateMetadata` 적용(seo 유틸 `generatePageMetadata` 패턴), hreflang/alternate 기존 라우트와 동일하게 동작.

### 4.3 공통
- **FR-15** `press`와 `news`는 색상/라벨로 **은은하게** 구분 (press=secondary 톤, news=primary 톤 등).
- **FR-16** 11개 로케일 모두 `mediaNews` 네임스페이스 키 존재 (next-intl은 누락 키 시 dev 오류).

---

## 5. i18n 전략 (D1 구체화)

**원칙**: 기사 데이터(제목/설명/뱃지)는 한국어 단일 소스 → 전 로케일 공유. UI 크롬만 번역.

### 5.1 데이터 (번역 안 함)
- `src/lib/data/mediaNewsData.ts`의 `mediaNewsData` / `featuredMediaNews` 배열 (KR 텍스트 그대로, 모든 로케일에서 동일 렌더).

### 5.2 UI 크롬 (11개 로케일 번역) — `messages/{locale}.json`에 `mediaNews` 네임스페이스 추가
```jsonc
"mediaNews": {
  "label": "Media & News",
  "title": "언론과 소식을 통해 전하는 리브의 진료 철학",   // 메인 섹션 헤딩
  "description": "리브성형외과는 자연스러운 안티에이징...", // 메인 설명문
  "viewAll": "미디어 전체보기",
  "reservation": "상담 예약하기",
  "page": {
    "title": "Media & News",
    "subtitle": "언론보도와 LIV 소식을 통해 전하는 리브의 진료 철학",
    "description": "리브성형외과의 방송 출연, 전문 매체 인터뷰..."
  },
  "filters": {
    "all": "전체", "press": "언론보도", "news": "LIV 소식",
    "academic_global": "학술·글로벌", "visit": "방문 소식"
  },
  "readArticle": "기사 보기",
  "readMore": "자세히 보기"
}
```
- **ko**: 요청서 원문 카피 그대로.
- **en/ja/zh**: UI 크롬 자연어 번역.
- **zh-TW/vi/th/ru/fr/mn/ar**: UI 크롬 번역(짧은 분량). 미작업 시 KO 폴백 허용하되, **키 자체는 11개 파일 모두에 존재해야 함**(FR-16).

> ⚠️ 제약: next-intl은 사용 중인 키가 특정 로케일 파일에 없으면 dev에서 에러/경고. 따라서 `mediaNews` 블록은 11개 파일 전부에 반드시 추가.

---

## 6. 데이터 모델 & 구조

### 6.1 타입 (`src/lib/data/mediaNewsData.ts`)
```ts
export type MediaType = 'press' | 'news';
export type MediaCategory = 'press' | 'news' | 'academic_global' | 'visit';

export interface MediaNewsItem {
  id: string;
  type: MediaType;
  category: MediaCategory;   // 필터 기준
  badge: string;             // 예: "BROADCAST"
  year: string;              // "2026" | "2025" | "2021"
  title: string;
  description: string;
  source?: string;
  link?: string;
  isExternal?: boolean;
}

// 메인 노출용 대표 카드 (6개) — 일부는 항목 요약, 6번은 집계형
export interface FeaturedMediaCard {
  id: string;
  type: MediaType;
  badge: string;
  year: string;
  title: string;
  description: string;       // 메인용 짧은 카피
  link: string;
  isExternal: boolean;
}
```

### 6.2 데이터 분리
- `mediaNewsData: MediaNewsItem[]` — 상세 페이지용 **14개 항목**(요청서 #1~#14 그대로).
- `featuredMediaNews: FeaturedMediaCard[]` — 메인용 **6개 카드**(요청서 카드1~6). 카드 설명은 메인용 짧은 버전이므로 별도 배열로 관리(상세 description과 다름). 6번 카드는 14개 항목에 없는 집계형.
- 헬퍼: `getYears(items)`(내림차순 유니크 연도), `filterByCategory(items, cat)`.

### 6.3 카테고리 → 필터 매핑
`전체`(all) / `언론보도`(press) / `LIV 소식`(news) / `학술·글로벌`(academic_global) / `방문 소식`(visit).
`type`은 press/news 색상 구분용, `category`는 필터링용으로 **역할 분리**.

---

## 7. 의료광고 / 표현 규정 (필수 준수)

### ❌ 금지 표현 (사용 시 즉시 수정)
언론이 인정한 병원 · 방송이 선택한 병원 · 대한민국 대표 병원 · 최고의 리프팅 병원 · 검증된 효과 · 부작용 없는 시술 · 확실한 변화 · 무조건 만족 · 셀럽들이 믿고 선택한 병원 · 글로벌 고객들이 인정한 병원

### ✅ 유지할 톤
- "방송 및 전문 매체를 통해 소개된 진료 철학"
- "학술 활동과 국제 프로그램을 통해 확장해 온 전문성"
- "개인별 피부 구조를 고려한 맞춤형 접근"
- "자연스러운 안티에이징을 지향하는 리브의 방향성"

### 셀럽 방문 소식 처리 원칙
"방문했다 / 응원한다 / 진료 철학을 소개한다" 수준의 **중립 표현**만. 시술 효과 직접 암시 금지. 메인에서는 실명 노출 최소화(집계형 카드).

---

## 8. 컴포넌트 아키텍처 & 파일 변경 목록

### 8.1 신규 파일
| 파일 | 역할 | 클라/서버 |
|---|---|---|
| `src/lib/data/mediaNewsData.ts` | 타입 + `mediaNewsData`(14) + `featuredMediaNews`(6) + 헬퍼 | - |
| `src/components/sections/MediaNewsSection.tsx` | 메인 섹션 (제목/설명/6카드/CTA 2개) | client |
| `src/components/sections/MediaNewsCard.tsx` | 재사용 카드 (메인·상세 공용, press/news 톤 구분) | client |
| `src/components/sections/MediaNewsFilter.tsx` | 필터 탭 바 (active/onChange) | client |
| `src/components/sections/MediaNewsModal.tsx` | 내부 소식 모달 (D3) | client |
| `src/components/sections/MediaNewsArchive.tsx` | 상세 페이지 본문 (필터 상태 + 연도 그룹 + 모달 제어) | client |
| `src/app/[locale]/media/page.tsx` | 라우트 (서버, `generateMetadata` + `MediaNewsArchive` 렌더) | server |

> 디렉터리 컨벤션: 기존 섹션이 모두 `src/components/sections/`에 평면 배치되어 있어 동일하게 따른다(요청서의 `components/`·`data/` 제안을 프로젝트 구조에 맞춰 매핑). 데이터는 프로젝트 관례상 `src/lib/`(constants.ts와 동급)에 `lib/data/`로 둔다.

### 8.2 수정 파일
| 파일 | 변경 내용 |
|---|---|
| `src/app/[locale]/page.tsx` | `MediaNewsSection` 동적 import, **Doctor 다음·Location 앞**에 삽입 (D2) |
| `src/components/sections/index.ts` | (있으면) `MediaNewsSection` 등 export 추가 |
| `src/messages/ko.json` | `mediaNews` 네임스페이스 추가(원문 카피) |
| `src/messages/en.json` `ja.json` `zh.json` | `mediaNews` 번역 추가 |
| `src/messages/zh-TW.json` `vi.json` `th.json` `ru.json` `fr.json` `mn.json` `ar.json` | `mediaNews` 키 추가(번역 또는 KO 폴백) |

### 8.3 선택(권장) 변경
- `src/messages/*.json`의 `nav`에 `media` 키 + `Header.tsx`/`MobileMenu.tsx` 네비게이션에 "미디어" 링크 추가. (요청서 필수 아님 → 별도 합의 후 진행)

---

## 9. 디자인 가이드

- **색**: `--color-primary #b4988d`(더스티 로즈), `--color-secondary #6d4e42`(브라운), `--color-background #f6f6f6`(크림), `mono/mono-light`(muted gray), `border #e5e5e5`. 요청서의 "베이지·크림·브라운·muted gray"와 일치.
- **press vs news 구분(은은)**: press → `bg-secondary/8 text-secondary`, news → `bg-primary/8 text-primary` 뱃지. 라벨도 보조 표기.
- **badge**: 작고 고급스럽게 — `text-[11px] tracking-[0.15em] uppercase`, 얇은 배경칩.
- **카드**: 텍스트 중심, 과한 이미지 없이 정돈. `rounded-2xl`, 미세 호버(`whileHover y:-6`), `description`은 `line-clamp-2~3`.
- **뉴스 게시판 느낌 회피**: 표 형태/조밀 리스트 대신 여백 큰 카드 아카이브. 연도 헤더는 `font-serif` 라지 타이포 + 구분선.
- **반응형**: 메인 6카드 = `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. 상세 = `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.

---

## 10. 구현 단계 (Do 단계 예고)

1. **데이터**: `lib/data/mediaNewsData.ts` (타입 + 14항목 + 6 featured + 헬퍼).
2. **i18n**: `messages/*.json` 11개에 `mediaNews` 네임스페이스 추가.
3. **공용 컴포넌트**: `MediaNewsCard`, `MediaNewsModal`, `MediaNewsFilter`.
4. **메인 섹션**: `MediaNewsSection` → `page.tsx`에 D2 위치로 삽입.
5. **상세 아카이브**: `MediaNewsArchive` + `app/[locale]/media/page.tsx`(metadata).
6. **검증**: build / lint / 11로케일 렌더 / `/ko/media` 육안 확인.

---

## 11. 인수 조건 (Acceptance Criteria)

- [ ] 메인에 Media & News 섹션이 Doctor와 Location 사이에 노출, 6카드 + 2 CTA 동작.
- [ ] "미디어 전체보기" → `/{locale}/media`, "상담 예약하기" → `/{locale}/contact` 이동.
- [ ] `/ko/media`: 히어로 + 필터 5탭 + 연도 그룹(2026/2025/2021) + 14카드 표시.
- [ ] 필터 클릭 시 category 기준 정확히 필터링, 빈 연도 그룹 숨김.
- [ ] 외부 기사 = "기사 보기"(새 탭, noopener), 내부 = "자세히 보기"(모달).
- [ ] press/news 색·라벨 구분이 은은하게 적용.
- [ ] 금지 표현 0개 (§7 체크리스트 통과).
- [ ] 모바일1/태블릿2/데스크톱3~4열 반응형.
- [ ] 11개 로케일에서 missing-key 오류 없이 렌더.

### 검증 방법 (Evidence-Based)
```bash
cd C:\dev\LIV_homepage\liv-clinic
npm run lint        # 0 errors
npm run build       # exit 0 (타입체크 포함)
# 육안: /ko/media, /en/media 및 메인(/ko) 스크린샷
```

---

## 12. 리스크 & 완화

| 리스크 | 영향 | 완화 |
|---|---|---|
| next-intl 누락 키 → dev/build 에러 | 11개 파일 누락 시 빌드 실패 | §5.2대로 11개 전부 `mediaNews` 키 추가, build로 검증 |
| KR 데이터가 비-KR 로케일에 그대로 노출 | 글로벌 UX 일관성 약간 저하 | D1 승인 사항. UI 크롬은 번역되어 맥락 제공 |
| 클라이언트 필터 컴포넌트의 SEO | 필터/모달 client → 메타데이터 누락 위험 | 라우트 page.tsx는 **서버**로 두고 `generateMetadata` 적용, 본문만 client 분리 |
| 메인 카드 6번(집계형)이 14항목과 불일치 | 데이터 정합성 혼동 | `featuredMediaNews`를 별도 배열로 명시 관리(§6.2) |
| 셀럽 실명/광고성 표현 규제 위반 | 의료광고법 리스크 | §7 준수, 메인 집계형 처리, 중립 표현 |

---

## 13. 다음 단계

→ `/bkit:pdca design media-news` 로 설계 문서화 후 구현(Do) 진행.
