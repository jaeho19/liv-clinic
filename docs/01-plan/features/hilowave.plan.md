# HILO WAVE 안티에이징 통이미지 상세페이지 추가

> **Feature**: `hilowave`
> **Phase**: Plan
> **Created**: 2026-05-29
> **Owner**: 리브성형외과 / LIV_homepage (liv-clinic Next.js)
> **Route**: `/[locale]/antiaging/hilowave`

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem (문제)** | HILO WAVE 시술을 소개할 전용 페이지가 없고, 안티에이징 서브메뉴에도 진입 경로가 없다. PPT로 완성된 9장 통이미지 디자인을 화질 손상·가로 스크롤 없이 웹에 그대로 옮겨야 한다. |
| **Solution (해결책)** | 기존 antiaging 하위 페이지 패턴(`page.tsx` + `layout.tsx`)을 따라 `/antiaging/hilowave` 라우트를 신설하고, 9장 이미지를 풀폭 세로 스택으로 렌더. 안티에이징 서브메뉴 맨 끝에 "HILO WAVE" 항목 추가(11개 로케일 라벨 동일). |
| **Function·UX Effect** | 데스크톱 드롭다운/모바일 햄버거 동일 노출. 히어로 1번 이미지 위 투명 `<a>` 2개(상담 예약·카카오)로 클릭 처리. 각 이미지 블록 fade-up 등장(framer-motion). soft/premium 무드 유지. |
| **Core Value (핵심 가치)** | 디자인 의도가 이미 박힌 통이미지를 손실 없이 노출 + 단 2개의 명확한 CTA로 상담 전환. 신규 의존성 0, 기존 컨벤션 100% 준수. |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | HILO WAVE 시술 랜딩 + 상담 전환 경로 확보. PPT 통이미지 디자인을 웹에 무손실 이식. |
| **WHO** | 안티에이징(피부 밀도·탄력·리프팅)에 관심 있는 잠재 고객. PC·모바일 모두. |
| **RISK** | ① 이미지가 아직 Next.js 프로젝트 `public/`에 없음(복사 필요) ② 통이미지라 본문 텍스트가 SEO에 안 잡힘 ③ 1920px 큰 이미지 9장 → LCP/용량 ④ 히어로 버튼 좌표 오정렬. |
| **SUCCESS** | `/ko/antiaging/hilowave`에서 9장이 정확한 순서로 풀폭 표시, 가로 스크롤 0, 히어로 버튼 2개 정상 동작, 모든 블록 fade-up, 메뉴(PC/모바일) 노출. |
| **SCOPE** | 메뉴 1항목 추가 + 단일 라우트(page+layout) 신설 + 이미지 복사 + 11개 로케일 nav 라벨. 그 외 디자인/카피 변경 없음. |

---

## 1. 배경 & 요구사항

PPT 슬라이드 1~11을 두 가지 작업으로 구현한다.

- **작업 1 (슬라이드 1)**: 안티에이징 서브메뉴에 "HILO WAVE" 진입점 추가.
- **작업 2 (슬라이드 2~11)**: HILO WAVE 단독 통이미지 상세페이지 생성.

슬라이드 3~11의 "디자인 의도"는 **이미 각 이미지 안에 디자인되어 있음**(통이미지). 따라서 별도 DOM 카드/레이아웃을 새로 만들지 않는다. 실제 구현할 인터랙션은 (a) 히어로 버튼 2개 + hover, (b) 모든 블록 fade-up 등장뿐이다.

---

## 2. 범위 (Scope)

### 작업 1 — 메뉴 추가
- `Header.tsx`의 `navItems` → `antiaging.children` 배열 **맨 끝**(skincare 뒤)에 항목 추가:
  ```ts
  { key: 'hilowave', label: t('hilowave'), href: '/antiaging/hilowave' }
  ```
- `navItems`는 데스크톱 드롭다운과 `MobileMenu`가 **공유** → 모바일/PC 자동 동일 노출.
- href는 locale-less(`/antiaging/hilowave`). next-intl `<Link>`가 현재 locale을 자동 prefix(ko → `/ko/antiaging/hilowave`).
- 11개 로케일 메시지(`src/messages/{ko,en,ja,zh,zh-TW,vi,th,ru,mn,fr,ar}.json`)의 `nav` 블록에 `"hilowave": "HILO WAVE"` 추가(전 로케일 동일 라벨).

### 작업 2 — 통이미지 상세페이지
- 신규 폴더: `src/app/[locale]/antiaging/hilowave/`
  - `page.tsx` — 통이미지 스택 + 히어로 오버레이 + fade-up + DEBUG 토글
  - `layout.tsx` — title/description/og:image/breadcrumb 스키마 (기존 skincare/layout.tsx 패턴 참고)
- **이미지 복사**: `public/images/antiaging/hilowave/*.jpg`(작업폴더) → `liv-clinic/public/images/antiaging/hilowave/`. 9장 + `hilowave-full.jpg`(og용).

---

## 3. 확정된 설계 결정 (사용자 확인 완료)

| # | 결정 사항 | 선택 | 비고 |
|---|-----------|------|------|
| D1 | 메뉴 위치 | **가장 마지막** (skincare 뒤) | botox/filler/skinbooster/skincare/**HILO WAVE** |
| D2 | fade-up 애니메이션 | **framer-motion `whileInView`** | 기존 antiaging 페이지와 동일 컨벤션, 신규 의존성 없음. `viewport={{ once: true }}` |
| D3 | 이미지 렌더링 | **next/image `quality={95}` + width/height 명시** | 레이아웃 시프트 방지, 히어로만 `priority`. 기존 페이지(quality 95)와 일치 |
| D4 | 블록 hover | **전체 블록 미세 효과** | 각 이미지 블록 전체에 아주 약한 scale/shadow hover (과하지 않게) |

---

## 4. 이미지 사양 (실측 확인 완료 — 모두 width 1920px)

| # | 파일 | 실측 px | 섹션 / alt 텍스트 | 비고 |
|---|------|---------|------------------|------|
| 1 | hilowave-1.jpg | 1920×1208 | 히어로 "피부 깊숙이 차오르는 탄력의 흐름" + 버튼 2개 | `priority`, 오버레이 2개 |
| 2 | hilowave-2.jpg | 1920×1071 | 지금 이런 변화가 느껴지시나요 | |
| 3 | hilowave-3.jpg | 1920×988  | 힐로웨이브란 (피부 단면 다이어그램) | |
| 4 | hilowave-4.jpg | 1920×1145 | 이런 분께 추천합니다 | |
| 5 | hilowave-5.jpg | 1920×1128 | 자연스러운 변화의 무드 | |
| 6 | hilowave-6.jpg | 1920×972  | HILO WAVE PROGRAM (가격 2cc 53.9만 / 4cc 88만) | |
| 7 | hilowave-7.jpg | 1920×1004 | 과하지 않게, 하지만 확실하게 | |
| 8 | hilowave-8.jpg | 1920×2058 | 의료진 소개 (김수영·천신혜 대표원장) | |
| 9 | hilowave-9.jpg | 1920×2189 | LIV EXPERIENCE 공간 | |
| og | hilowave-full.jpg | 1920×11732 | 전체 통이미지 (og:image 용) | 렌더 안 함, 메타 전용 |

- 컨테이너: 풀폭(`width:100%`), 이미지 `height:auto`, 최대폭 제한 없이 화면 가득(또는 `max-w-[1920px] mx-auto`로 초대형 모니터 대응 — Do에서 확정).
- **가로 스크롤 방지**: 래퍼에 `overflow-x-hidden`, 이미지 `w-full block`.

---

## 5. 히어로 버튼 오버레이 사양

1번 이미지 위에 `position:relative` 컨테이너 + 투명 `<a>` 2개를 **% 절대좌표**로 배치(비율 유지되므로 PC/모바일 동일 적용).

| 버튼 | top | left | width | height | 링크 | 타깃 |
|------|-----|------|-------|--------|------|------|
| 상담 예약 | 79% | 7% | 17.5% | 7% | `/contact` (i18n `<Link>`) | 같은 탭 |
| 카카오 상담 | 79% | 26.5% | 17.5% | 7% | `https://pf.kakao.com/_hgFwn` | `_blank` + `rel="noopener noreferrer"` |

- hover 시 부드러운 transition(배경 살짝 밝아짐 등, `transition` 적용).
- **DEBUG 토글**: 오버레이 외곽선 표시용 플래그(예: 상수 `DEBUG` 또는 `?debug` 쿼리) — 좌표 미세조정용.

---

## 6. SEO / 메타 (layout.tsx)

- `title`: `힐로웨이브(HILO WAVE) | LIV 성형외과`
- `description`: 피부 밀도·탄력·리프팅 핵심 키워드 포함
- 각 `<Image alt>`: §4 섹션명 활용(통이미지 텍스트 보완)
- `og:image`: `/images/antiaging/hilowave/hilowave-full.jpg`
- breadcrumb: 홈 → 안티에이징 → HILO WAVE (기존 skincare/layout.tsx 패턴)

---

## 7. Success Criteria (검증 기준)

- [ ] **SC1** 안티에이징 메뉴(데스크톱 드롭다운)에 "HILO WAVE"가 맨 끝에 노출되고 클릭 시 `/ko/antiaging/hilowave` 이동
- [ ] **SC2** 모바일 햄버거 메뉴에도 동일 노출·동작
- [ ] **SC3** 11개 로케일 모두 nav 라벨 "HILO WAVE" 표시(누락 키 없음, 빌드 에러 없음)
- [ ] **SC4** 상세페이지에서 9장이 1→9 순서로 풀폭 세로 스택 표시
- [ ] **SC5** 가로 스크롤 0 (모든 뷰포트), 비율 유지, 레이아웃 시프트 없음
- [ ] **SC6** 히어로 버튼 2개 정상 동작(상담 예약=같은 탭, 카카오=새 탭)
- [ ] **SC7** 각 이미지 블록 스크롤 진입 시 fade-up 등장
- [ ] **SC8** DEBUG 토글로 오버레이 외곽선 확인 가능
- [ ] **SC9** `npm run build` 성공(0 에러), `npm run lint` 통과

---

## 8. 리스크 & 제약

| 리스크 | 대응 |
|--------|------|
| 이미지가 `liv-clinic/public/`에 없음 | Do 첫 단계에서 복사. 복사 누락 시 404 → 검증 필수 |
| 통이미지 SEO 약함 | title/description/alt/og로 최소 보완(§6) |
| 큰 이미지 9장 LCP/용량 | next/image 최적화(quality 95) + 히어로만 priority, 나머지 lazy |
| 히어로 버튼 좌표 오정렬 | % 좌표 + DEBUG 토글로 미세조정 |
| 신규 의존성 | 금지 — framer-motion/next-intl/next/image 기존 것만 사용 |
| AnimatePresence+스크롤 크래시(기존 메모리) | 메뉴는 navItems 단순 추가라 영향 없음 |

---

## 9. 변경/생성 파일 목록

**생성**
- `src/app/[locale]/antiaging/hilowave/page.tsx`
- `src/app/[locale]/antiaging/hilowave/layout.tsx`
- `liv-clinic/public/images/antiaging/hilowave/hilowave-{1..9}.jpg`, `hilowave-full.jpg` (복사)

**수정**
- `src/components/layout/Header.tsx` (navItems antiaging.children 1줄 추가)
- `src/messages/{ko,en,ja,zh,zh-TW,vi,th,ru,mn,fr,ar}.json` (nav.hilowave 11개)

---

## 10. Out of Scope / 열린 항목

- TREATMENTS 상수(constants.ts) 데이터 추가는 **불필요**(통이미지라 데이터 기반 렌더 안 함). MedicalService 스키마는 layout에서 최소만(또는 생략) — Design에서 확정.
- 초대형 모니터(>1920px) 처리: `max-w-[1920px] 중앙정렬` vs 풀블리드 — Design/Do에서 확정.
- 다국어 페이지 본문: 통이미지는 한국어 디자인 1종. en/ja 등에서도 동일 이미지 노출(별도 번역 이미지 없음) — 현 범위 유지.

---

**다음 단계**: `/pdca design hilowave` (3가지 아키텍처 옵션 비교 후 선택)
