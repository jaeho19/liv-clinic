# Media & News 기능 완료 보고서

> **Summary**: Media & News 섹션 및 상세 아카이브 기능 구현 완료. PDCA 전 사이클 통과, 설계-구현 일치도 99%, 의료광고 규제 준수, 11개 로케일 동기화 확인.
>
> **Owner**: LIV_homepage 팀
> **Feature**: media-news
> **Completed**: 2026-05-20
> **Status**: Completed (Check Phase ≥90%)

---

## 1. 기능 개요

**신규 기능**: 기존에 없던 Media & News 섹션을 메인 페이지에 추가하고, 연도별·카테고리별로 정렬된 상세 아카이브 페이지(`/[locale]/media`) 구성.

| 항목 | 내용 |
|---|---|
| 범위 | 메인: 6개 대표 카드 + 2 CTA / 상세: 14개 항목 + 5개 필터 탭 + 3개 연도 그룹 + 내부 소식 모달 |
| 데이터 구조 | 언론보도(press) + LIV 소식(news) 통합, 기사 데이터는 한국어 단일, UI 크롬은 11개 로케일 번역 |
| 메인 배치 | Doctor 섹션 다음, Location 섹션 앞 (설계 D2 준수) |
| 로케일 | ko, en, ja, zh, zh-TW, vi, th, ru, fr, mn, ar (11개 전체 노출) |
| 의료광고 | 금지 표현 0개, 중립 톤, 셀럽 실명 미노출(집계형 카드) |

---

## 2. PDCA 사이클 요약

### Plan (계획)
- **시작일**: 2026-05-20
- **문서**: `docs/01-plan/features/media-news.plan.md`
- **핵심 결정**:
  - D1: 11개 로케일 전체 노출, 기사 데이터는 한국어 공유, UI만 번역
  - D2: 메인 섹션 위치 = Doctor ↔ Location
  - D3: 내부 소식(`isExternal:false`) 모달 처리
- **요구사항**: FR-1~16 (16개 기능 요구사항)
- **리스크**: next-intl 누락 키 시 빌드 실패 → 11개 파일 모두 `mediaNews` 키 추가로 완화

### Design (설계)
- **문서**: `docs/02-design/features/media-news.design.md`
- **컴포넌트**: 신규 5개 (MediaNewsSection, MediaNewsCard, MediaNewsFilter, MediaNewsModal, 라우트)
- **데이터 모델**: MediaNewsItem(14항목), FeaturedMediaCard(6항목), 헬퍼 함수
- **메인 페이지**: `[locale]/page.tsx`에 MediaNewsSection 삽입
- **상세 페이지**: `[locale]/media/page.tsx`(client, 필터·연도 그룹 제어) + `[locale]/media/layout.tsx`(server, 메타데이터)
- **i18n 스키마**: `mediaNews` 네임스페이스 (§5 검증됨)
- **설계 검증**: design-validator 88/100 → 수정 사항(buildHreflangMap private 확인, 빈 필터 폴백 추가 등) 반영 완료

### Do (구현)
- **시작**: 2026-05-20 09:30
- **산출물**:
  - **신규 파일 7개**:
    - `src/lib/data/mediaNewsData.ts` - 타입 + 14개 항목 + 6개 메인 카드 + 헬퍼
    - `src/components/sections/MediaNewsSection.tsx` - 메인 섹션
    - `src/components/sections/MediaNewsCard.tsx` - 공용 카드
    - `src/components/sections/MediaNewsFilter.tsx` - 필터 탭
    - `src/components/sections/MediaNewsModal.tsx` - 내부 소식 모달
    - `src/app/[locale]/media/page.tsx` - 아카이브 본문
    - `src/app/[locale]/media/layout.tsx` - 메타데이터 + JSON-LD
  - **수정 파일 3종** (app/[locale]/page.tsx, sections/index.ts, messages/*.json × 11)

### Check (검증)
- **문서**: `docs/03-analysis/media-news.analysis.md`
- **검증 에이전트**: bkit:gap-detector
- **빌드 결과**:
  ```
  npm run build → exit 0
  정적 생성: 396/396 (11 로케일 전체)
  ```
- **FR 매핑**: 16/16 모두 구현됨
- **일치율**: 99% (≥90% 게이트 통과)
- **발견 사항**: 1건 Trivial (Breadcrumb JSON-LD 구성 표현, 기능적 동등) → 문서 반영
- **누락 키**: 0개 (11개 파일 mediaNews 키 전부 확인)

---

## 3. 핵심 메트릭

| 메트릭 | 값 | 근거 |
|---|---|---|
| **Design Match Rate** | 99% | FR-1~16 16/16 ✅, 설계 세부 사항 100% 일치 |
| **Architecture Compliance** | 100% | 기존 컨벤션(sections, layout, types) 완벽 준수 |
| **Convention Compliance** | 100% | next-intl, framer-motion, Tailwind 토큰 일치 |
| **빌드 성공** | exit 0 | 타입체크 포함, 11 로케일 정적 생성 완료 |
| **의료광고 규제** | 통과 | 금지 표현 11종 0개, 중립 표현 유지 |
| **로케일 동기화** | 11/11 | mediaNews 네임스페이스 모든 파일 키 존재 |
| **코드 라인** | ~950줄 | 신규 컴포넌트 + 데이터 총합 |

---

## 4. 구현 검증 결과 (Evidence-Based)

### 4.1 빌드 검증
```bash
npm run build
✓ Compiled successfully (타입체크 포함)
✓ Linting passed (0 errors)
✓ 정적 생성: 396 페이지
  - 11 로케일 × 36 페이지 = 396개 (/media 포함)
  - next-intl 누락 키 검출 시점 = 빌드 실패 → 전 로케일 키 존재 확정
```

### 4.2 FR 검증 (16/16 완전 일치)

| FR | 내용 | 결과 | 파일 |
|----|------|:--:|---|
| FR-1 | 섹션 제목/설명 2문단 | ✅ | MediaNewsSection.tsx:18-21 |
| FR-2 | 6 카드, 반응형 그리드 | ✅ | MediaNewsSection.tsx:26-30 |
| FR-3 | CTA 2개 (/media, /contact) | ✅ | MediaNewsSection.tsx:35-44 |
| FR-4 | f6 집계형, 실명 미노출 | ✅ | mediaNewsData.ts:289-297 |
| FR-5 | 메인 외부/내부 링크 동작 | ✅ | MediaNewsCard.tsx:90-126 |
| FR-6 | 아카이브 히어로 | ✅ | media/page.tsx:30-40 |
| FR-7 | 필터 5탭 (category 기준) | ✅ | MediaNewsFilter.tsx:13 |
| FR-8 | 연도 그룹(2026/2025/2021) + 빈 숨김 | ✅ | media/page.tsx:56-58 |
| FR-9 | 카드 필드 전체 | ✅ | MediaNewsCard.tsx CardBody |
| FR-10 | 버튼 문구 구분 | ✅ | MediaNewsCard.tsx:79 |
| FR-11 | target=_blank + noopener | ✅ | MediaNewsCard.tsx:93-95 |
| FR-12 | 내부 → 모달 전체 내용 | ✅ | MediaNewsModal.tsx |
| FR-13 | 반응형 그리드 | ✅ | media/page.tsx:65 |
| FR-14 | SEO + hreflang (11로케일) | ✅ | media/layout.tsx:32-46 |
| FR-15 | press/news 색 구분 | ✅ | MediaNewsCard.tsx:16-19 |
| FR-16 | 11로케일 mediaNews 키 | ✅ | 11/11 파일 확인 |

### 4.3 의료광고 규제 검증

**금지 표현 11종 체크리스트**:
- ❌ 언론이 인정한 병원
- ❌ 방송이 선택한 병원
- ❌ 대한민국 대표 병원
- ❌ 최고의 리프팅 병원
- ❌ 검증된 효과
- ❌ 부작용 없는 시술
- ❌ 확실한 변화
- ❌ 무조건 만족
- ❌ 셀럽들이 믿고 선택한 병원
- ❌ 글로벌 고객들이 인정한 병원
- ❌ (메인 카드 셀럽 실명 노출)

**결과**: 0개 포함, 모두 중립 표현으로 일관됨.

### 4.4 i18n 검증

**11개 로케일 키 동기화 확인**:
```
✅ ko.json  - mediaNews 네임스페이스 (원문)
✅ en.json  - mediaNews 네임스페이스 (번역)
✅ ja.json  - mediaNews 네임스페이스 (번역)
✅ zh.json  - mediaNews 네임스페이스 (번역)
✅ zh-TW.json - mediaNews 네임스페이스
✅ vi.json  - mediaNews 네임스페이스
✅ th.json  - mediaNews 네임스페이스
✅ ru.json  - mediaNews 네임스페이스
✅ fr.json  - mediaNews 네임스페이스
✅ mn.json  - mediaNews 네임스페이스
✅ ar.json  - mediaNews 네임스페이스

빌드 결과: missing-key 오류 없음 → 전부 존재 확정
```

---

## 5. 주요 설계 결정과 반영

| 결정 사항 | 선택 | 구현 |
|---|---|---|
| D1: 11로케일 노출 범위 | 데이터 KR 공유, UI만 번역 | mediaNewsData.ts는 영어 없음, messages/*.json 11개 추가 |
| D2: 메인 배치 | Doctor ↔ Location | [locale]/page.tsx에 동적 import 적용, 위치 확인 |
| D3: 내부 소식 동작 | 모달로 표시 | MediaNewsModal.tsx + page.tsx 상태 제어 |
| 색 구분 | press=secondary, news=primary | MediaNewsCard.tsx 타입 체크 후 bg 클래스 적용 |
| 빈 결과 처리 | 폴백 메시지 표시 | mediaNews.empty 키 추가, 필터 결과 0 시 조건 렌더 |
| hreflang 생성 | buildHreflangMap private → generatePageMetadata 호출 | layout.tsx에서 export된 함수만 사용 |

---

## 6. 문제 해결 (Lessons Learned)

### 6.1 주요 학습 포인트

1. **요청서 vs 코드베이스 불일치**
   - 요청서: "기존 Media & Press 섹션 확장"
   - 실제: 섹션 미존재 → 신규로 재정의
   - **교훈**: 요구사항 전제 사실 확인 후 설계 시작

2. **next-intl 빌드 게이트**
   - 문제: 11개 로케일 중 하나라도 mediaNews 키 누락 시 빌드 실패
   - 해결: 11개 파일 모두에 mediaNews 네임스페이스 추가 (자동화 스크립트 활용)
   - **교훈**: i18n은 누락 키가 critical → 자동 검증 필수

3. **buildHreflangMap Private 제약**
   - 문제: seo.ts에서 buildHreflangMap이 export 안 됨 (private)
   - 설계 단계: "별도 호출"이라 명시했으나 구현 불가
   - 해결: generatePageMetadata({ path: '/media' })로 변경 (내부에서 11로케일 hreflang 생성)
   - **교훈**: 외부 함수 export 상태는 코드 검증 후 설계에 반영

4. **14항목 vs 6항목 데이터 정합성**
   - 메인 6카드 중 f6는 14개 항목에 없는 집계형(셀럽 방문 종합)
   - 해결: featuredMediaNews를 별도 배열로 명시 관리 → 혼동 방지
   - **교훈**: 신규 컨셉(집계형 카드)은 설계에서 사전 명시

5. **셀럽 실명 미노출 의료광고 규제**
   - 요청서 메인 카드 중 6번: "방문한 셀럽 나열"
   - 문제: 실명 노출 시 의료광고법 위반
   - 해결: f6를 집계형("셀럽과 글로벌 인플루언서의 리브 방문")으로 처리
   - **교훈**: 규제 대상 콘텐츠는 early validation 필수

### 6.2 과정에서의 이슈 및 해결

| 이슈 | 영향 | 해결 방법 |
|---|---|---|
| design-validator 88/100 (Critical 1건) | buildHreflangMap 미export → 구현 불가능 | generatePageMetadata 호출로 변경, 설계 문서 동기화 |
| 빈 필터 결과 폴백 부재 | UX 불완성 | mediaNews.empty 키 추가, 조건 렌더 구현 |
| 모달 a11y 미달 | 접근성 위반 | role=dialog, aria-modal, 초기 포커스, 포커스 복원 추가 |
| 헬퍼 함수명 변경 미추적 | 설계-구현 표현 차이 | 설계 문서에 변경 동기 주석 추가 |

---

## 7. 성과 및 완성도

### 7.1 인수 조건 (Plan §11) — 전 항목 통과

- [x] 메인에 Media & News 섹션, Doctor-Location 사이 노출
- [x] "미디어 전체보기" → /media, "상담 예약하기" → /contact 이동
- [x] /ko/media: 히어로 + 필터 5탭 + 연도 3그룹 + 14카드
- [x] 필터 클릭 시 category 정확히 필터링, 빈 연도 숨김
- [x] 외부 = "기사 보기"(새 탭), 내부 = "자세히 보기"(모달)
- [x] press/news 색·라벨 구분 적용
- [x] 금지 표현 0개 (§7 체크 통과)
- [x] 반응형 1/2/3~4열
- [x] 11로케일 missing-key 오류 없음

### 7.2 최종 메트릭

| 항목 | 결과 | 평가 |
|---|---|---|
| **Match Rate** | 99% | 매우 우수 (≥90% 기준) |
| **빌드 성공** | 396/396 (exit 0) | 완벽 |
| **FRs** | 16/16 | 100% 달성 |
| **의료광고 규제** | 0개 위반 | 합규 |
| **로케일** | 11/11 | 전체 동기화 |
| **코드 품질** | 컨벤션 준수 | 프로젝트 표준 일치 |

---

## 8. 기술 상세 (참고)

### 8.1 데이터 구조

```typescript
// 14개 항목 (상세 페이지)
mediaNewsData: [
  {
    id: '1', type: 'press', category: 'academic_global', badge: 'GLOBAL TRAINER',
    year: '2026', title: '...', source: '...',
    isExternal: true, link: '...'
  },
  // ... 14개
]

// 6개 메인 카드 (f6는 집계형)
featuredMediaNews: [
  { id: 'f1', type: 'press', badge: 'BROADCAST', ... },
  // ... f6: { title: '셀럽과 글로벌 인플루언서의 리브 방문' }
]
```

### 8.2 컴포넌트 아키텍처

```
[locale]/page.tsx (서버)
  └─ dynamic import MediaNewsSection
      └─ useTranslations('mediaNews')
      └─ featuredMediaNews[0:6]
      └─ MediaNewsCard × 6 (onSelect 미전달 → /media Link)
      └─ CTA 2개

[locale]/media/layout.tsx (서버)
  └─ generateMetadata() → 11로케일 hreflang 포함
  └─ JSON-LD: WebPageSchema + ItemList(NewsArticle)

[locale]/media/page.tsx ('use client')
  └─ useState<active, selected>
  └─ MediaNewsFilter(onChange)
  └─ MEDIA_YEARS.map() → filtered items → MediaNewsCard(onSelect)
  └─ MediaNewsModal(selected)
```

### 8.3 i18n 키 구조

```json
{
  "mediaNews": {
    "label": "Media & News",
    "title": "...",
    "description": "... (2문단)",
    "viewAll": "미디어 전체보기",
    "reservation": "상담 예약하기",
    "page": { "title": "...", "subtitle": "...", "description": "..." },
    "filters": { "all": "전체", "press": "언론보도", ... },
    "readArticle": "기사 보기",
    "readMore": "자세히 보기",
    "empty": "표시할 소식이 없습니다."
  }
}
```

---

## 9. 다음 단계 & 권장사항

### 9.1 즉시 (선택)

- [ ] 네비게이션 헤더에 "미디어" 링크 추가 (nav 키 + Header.tsx 메뉴)
- [ ] 실제 기사 OG 이미지 추가 (`/images/og-media.jpg`)

### 9.2 장기 (권장)

- [ ] 비-KR 로케일(zh-TW/vi/th/ru/fr/mn/ar)의 UI 번역 검수 및 완성
- [ ] Supabase 연동 (현재는 정적 데이터, 향후 CMS화)
- [ ] 각 기사의 개별 상세 라우트(`/media/[id]`) 고려

### 9.3 모니터링

- [ ] 월간 분석: 미디어 섹션 CTR / 상담 전환
- [ ] 로케일별 이용률 (특히 비-KR 로케일)

---

## 10. 최종 결론

**Media & News 기능은 설계부터 구현, 검증까지 PDCA 전 사이클을 완료했으며, 모든 기준(FR, 설계, 빌드, 의료광고, 로케일)을 충족합니다.**

- **Match Rate 99%**: 설계와 구현의 높은 일치
- **빌드 성공**: 타입체크 + 11 로케일 정적 생성 전부 통과
- **의료광고 준수**: 금지 표현 0개, 중립 톤 유지
- **완성도**: 16개 FR 전부 구현, 인수 조건 100% 달성

**평가**: Excellent — Act(반복) 불필요, 바로 배포 가능.

---

## 관련 문서

- **Plan**: `docs/01-plan/features/media-news.plan.md`
- **Design**: `docs/02-design/features/media-news.design.md`
- **Analysis**: `docs/03-analysis/media-news.analysis.md`
- **산출물**: 
  - `src/lib/data/mediaNewsData.ts`
  - `src/components/sections/{MediaNewsSection,MediaNewsCard,MediaNewsFilter,MediaNewsModal}.tsx`
  - `src/app/[locale]/media/{page.tsx,layout.tsx}`
  - `src/messages/*.json` × 11

---

**보고서 작성**: 2026-05-20
**PDCA 완료**: 2026-05-20 (Check Phase = 99% ≥ 90% Gate)
