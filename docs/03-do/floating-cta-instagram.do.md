# Do: Floating CTA Instagram 버튼 추가

> **Feature**: `floating-cta-instagram`
> **Phase**: Do (Implementation)
> **Completed**: 2026-04-24
> **Design 참조**: `docs/02-design/features/floating-cta-instagram.design.md`

---

## 1. 구현 체크리스트

- [x] `liv-clinic/public/images/insta.jpg` 자산 복사 (3.8MB, `next/image`가 자동 최적화)
- [x] `liv-clinic/src/lib/analytics-events.ts` `trackContact` method 유니온에 `'instagram'` 추가
- [x] `liv-clinic/src/components/layout/FloatingCTA.tsx`
  - [x] `import Image from 'next/image'` 추가
  - [x] `INSTAGRAM_CTA_URL` 상수 추가 (`https://www.instagram.com/livclinic_after/`)
  - [x] `ctaButtons.instagram` 정의 추가 (image 필드, 4개 로케일 라벨)
  - [x] `buttonOrderByLocale` 4개 로케일에 `'instagram'` 을 secondary 첫 자리(인덱스 1)로 삽입
  - [x] Secondary 렌더 블록에 `isImageButton` 분기 추가 (`next/image` + `overflow-hidden`)
  - [x] `trackContact` 캐스팅 유니온에 `'instagram'` 추가

---

## 2. 변경 파일 요약

### 2.1 `liv-clinic/src/lib/analytics-events.ts`
- `trackContact` method 타입에 `'instagram'` 추가 (1 line diff)

### 2.2 `liv-clinic/src/components/layout/FloatingCTA.tsx`
- `next/image` import 추가
- `INSTAGRAM_CTA_URL` 상수 분리 (기존 `SOCIAL_LINKS.instagram=livps_official` 과 격리)
- `ctaButtons.instagram` 정의 추가 — `image: { src: '/images/insta.jpg', alt: 'Instagram' }`
- `buttonOrderByLocale` 각 로케일 4→5 항목, instagram 을 secondary 최상단으로 고정
- Secondary 렌더에서 `'image' in button` 체크로 `next/image` vs SVG 아이콘 분기

### 2.3 `liv-clinic/public/images/insta.jpg` (신규)
- 루트 `public/images/insta.jpg` → Next.js public 디렉토리로 복사

---

## 3. 검증 결과

### 3.1 ESLint
```bash
npm run lint | grep -iE "(FloatingCTA|analytics-events)"
# (no output — 변경 파일에 lint 오류 없음)
```
> 기존 코드베이스에 사전 존재하는 lint 경고 다수 있음 (StickyCtaBar, GoogleMap 등 — 본 기능과 무관)

### 3.2 TypeScript
```bash
npx tsc --noEmit
# (no errors)
```

### 3.3 시각적/동작 검증 (수동 QA 대상)
- [ ] `npm run dev` 으로 서버 기동 후 `/ko` 접속, 우측 하단 스택 최상단에 Instagram 아이콘 확인
- [ ] 클릭 시 `https://www.instagram.com/livclinic_after/` 새 탭 오픈
- [ ] `/en`, `/ja`, `/zh` 로케일에서 동일 확인
- [ ] 모바일(≤375px) 레이아웃 깨짐 없음 확인

---

## 4. 다음 단계

- **`/pdca analyze floating-cta-instagram`** — gap-detector 로 Design ↔ 구현 Gap 분석 및 매칭률 측정
- 매칭률 ≥ 90% 시 → **`/pdca report floating-cta-instagram`** (완료 보고서)
- 90% 미만 시 → **`/pdca iterate floating-cta-instagram`** (자동 개선 루프)
