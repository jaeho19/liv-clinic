# Media & News 갭 분석 (PDCA Check)

> **Feature**: `media-news`
> **Phase**: Check (Gap Analysis)
> **Date**: 2026-05-20
> **Agent**: bkit:gap-detector
> **설계 기준**: `docs/02-design/features/media-news.design.md`

---

## 종합 결과

| 항목 | 점수 |
|---|:--:|
| Design Match (FR/설계 항목) | 99% |
| Architecture Compliance | 100% |
| Convention Compliance | 100% |
| **Overall Match Rate** | **99% ✅ (≥90% 게이트 통과)** |

**판정**: 설계와 구현이 매우 높은 일치도. 누락 기능·스펙 일탈 없음. → `[Act]` 반복 불필요.

**빌드 근거**: `npm run build` exit 0, 정적 생성 396/396, 11로케일 키 동기화 verify 통과(누락 키 시 next-intl 빌드 실패하므로 11/11 키 존재 확정).

---

## FR 매핑 (Plan FR-1~16) — 16/16 ✅

| FR | 내용 | 결과 | 근거 |
|----|------|:--:|---|
| FR-1 | 섹션 제목/설명 2문단 | ✅ | MediaNewsSection.tsx:18-21 |
| FR-2 | 6 카드, grid 1/2/3열 | ✅ | MediaNewsSection.tsx:26-30 |
| FR-3 | CTA 2개(/media, /contact) | ✅ | MediaNewsSection.tsx:35-44 |
| FR-4 | f6 집계형, 실명 미노출 | ✅ | mediaNewsData.ts:289-297 |
| FR-5 | 메인 외부=새탭/내부=/media | ✅ | MediaNewsCard.tsx:90-126 |
| FR-6 | 아카이브 히어로 | ✅ | media/page.tsx:30-40 |
| FR-7 | 필터 5탭(category) | ✅ | MediaNewsFilter.tsx:13 |
| FR-8 | 연도 2026/2025/2021 + 빈 그룹 숨김 | ✅ | media/page.tsx:56-58 |
| FR-9 | 카드 필드 badge/year/source/title/desc/btn | ✅ | MediaNewsCard.tsx CardBody |
| FR-10 | 외부="기사 보기"/내부="자세히 보기" | ✅ | MediaNewsCard.tsx:79 |
| FR-11 | 외부 `target=_blank rel=noopener noreferrer` | ✅ | MediaNewsCard.tsx:93-95 |
| FR-12 | 내부 자세히 보기 → 모달 전체 내용 | ✅ | MediaNewsCard.tsx:105-117 / Modal |
| FR-13 | 반응형 1/2/3~4열 | ✅ | media/page.tsx:65 |
| FR-14 | SEO generateMetadata + hreflang | ✅ | media/layout.tsx:32-46 |
| FR-15 | press/news 색 구분 | ✅ | MediaNewsCard.tsx:16-19 |
| FR-16 | 11로케일 mediaNews 키 | ✅ | 11/11 파일 확인 |

---

## 설계 세부 일치

- **데이터**: 타입(MediaType/MediaCategory/MediaNewsItem/FeaturedMediaCard) 필드 1:1 일치, 상세 14항목·메인 6카드 전부 존재, category(필터)/type(색) 역할 분리, id 7·8 category=academic_global, 헬퍼(`MEDIA_YEARS`/`getItemsByYear`/`filterByCategory`).
- **컴포넌트**: MediaNewsCard 3분기(외부 anchor / 내부+onSelect 모달 / 내부 메인 Link) + `'category' in item` narrowing. 모달 a11y(role=dialog, aria-modal, aria-labelledby, 초기 포커스, 포커스 복원, Esc, 스크롤락, portal, backdrop). 필터 sticky top-16 z-30.
- **라우트/메타데이터**: `generatePageMetadata({ path: '/media' })` 사용(11로케일 hreflang 자동), `buildHreflangMap` 직접 import 안 함(private 확인). WebPage + ItemList(NewsArticle) JSON-LD.
- **빈 결과 폴백**: `mediaNews.empty` 사용. CTA 링크 정상.
- **의료광고 규제**: 금지 표현 11종 미포함, 셀럽 방문 중립 표현, f6 집계형.

---

## 발견된 차이 (1건, Trivial)

| # | 항목 | 설계 | 구현 | 심각도 | 조치 |
|---|------|------|------|:--:|---|
| 1 | Breadcrumb JSON-LD 구성 | §4.6에 `generateBreadcrumbSchema([...])` 별도 호출로 기술 | `generateWebPageSchema({ breadcrumbs:[...] })` 내부에 BreadcrumbList 임베드(layout.tsx:62-67) | Trivial(문서 표현) | 설계 §4.6 표현을 구현(더 깔끔)에 맞춰 동기화 — **반영 완료** |

> 기능적으로 동등(유효한 BreadcrumbList 출력). 행동 갭 아님.

추가(설계 초과, 개선): 필터 버튼 `aria-pressed` 속성 — a11y 향상, 조치 불필요.

---

## 결론 & 다음 단계

Match Rate **99%** ≥ 90% → Check 게이트 통과. Act(반복) 불필요.
→ `/bkit:pdca report media-news`로 완료 보고서 생성 권장.
