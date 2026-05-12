# Plan: page-speed-optimization

> 검색엔진(Google/Naver) 클릭 시 첫 페이지 로드 속도 개선

## 1. 개요

### 배경
사용자가 Google·Naver 검색결과에서 livps.co.kr를 클릭했을 때 다른 사이트보다 페이지 표시가 느린 현상이 보고됨. 코드 분석 결과 **루트 레이아웃에서 매 요청마다 Supabase DB를 호출하여 TTFB(Time To First Byte)가 누적 지연**되고 있고, 정적 생성될 수 있는 페이지들이 모두 dynamic SSR로 동작 중임. 또한 Hero 비디오(6MB)와 large image folder(257MB)가 추가 부담을 주고 있음.

### 목표
1. **TTFB 단축**: 매 요청마다 발생하는 불필요한 DB round-trip 제거 (목표: −200~500ms)
2. **정적 생성 복원**: 공개 페이지(메인, 시술, 갤러리, 의료진 등)를 ISR/static으로 전환
3. **LCP 개선**: Hero 비디오·이미지 최적화로 첫 화면 표시 시간 단축 (목표: LCP < 2.5s)
4. **에셋 슬림화**: 거대한 이미지/비디오 파일 압축·정리

### 비목표 (Out of Scope)
- /admin 영역 성능 개선 (인증 페이지는 dynamic이 정상)
- 새로운 기능 추가
- 디자인 변경

## 2. 현재 상태 분석

### 측정 대상
공개 페이지(`/[locale]`, `/[locale]/about`, `/[locale]/lifting/*`, `/[locale]/gallery` 등 약 73개)

### 발견된 문제점

#### 🔴 P0 — 블로커 (TTFB 직접 영향)

**P0-1. `getAnalyticsSettings()` 캐시 없음** (`src/app/[locale]/layout.tsx:16-37`)
- 모든 페이지 요청마다 Supabase에 동일한 GA/Naver 설정 쿼리
- `await`로 layout 렌더링을 블로킹 → 모든 페이지가 dynamic 강제
- 영향: TTFB +200~500ms (cold start 시 더 큼)

**P0-2. 공개 페이지 ISR/revalidate 미설정**
- `export const revalidate = N` 없음 → P0-1과 결합되어 매번 SSR
- Vercel/Next.js 캐시를 전혀 활용하지 못함

#### 🟡 P1 — 핵심 (LCP 영향)

**P1-1. Hero 비디오 6MB 자동 재생** (`src/components/sections/Hero.tsx:7`)
- `/videos/hero.mp4` 6,043,298 bytes
- `preload="metadata"`로 일부 완화되어 있으나 여전히 큼
- 모바일·저속 회선에서 LCP 악화 주범

**P1-2. Hero poster 이미지 preload 누락**
- LCP candidate인 `hero-poster.jpg`가 `<link rel="preload">` 없음
- next/image의 priority도 적용 안됨 (poster 속성으로 사용 중)

#### 🟢 P2 — 보조 개선

**P2-1. `public/images/` 폴더 257MB**
- 빌드/배포 시간 증가, Vercel 디플로이 시 cold start 영향
- 일부 hero 이미지는 230~388KB → AVIF/WebP 압축 여지

**P2-2. 인라인 `<script>` 다수**
- GA, Consent Mode, JSON-LD 등 head에 inline script 多
- next/script 컴포넌트로 적절한 strategy 적용 가능

**P2-3. Framer Motion 자동 로드**
- Hero에서 Framer Motion 즉시 import → 초기 JS 번들 증가
- LazyMotion 또는 정적 CSS 애니메이션 대체 검토

### 측정 베이스라인 (Design 단계에서 확정)
- [ ] PageSpeed Insights 점수 (모바일/데스크탑)
- [ ] LCP, FCP, TTFB, CLS
- [ ] 번들 크기 (`.next/analyze`)

## 3. 개선 계획

### 3.1 Phase A — TTFB 즉시 개선 (P0)

#### A-1. `getAnalyticsSettings()` 캐싱 적용
- **방법**: `unstable_cache` 또는 React `cache()` + `revalidate: 3600` 적용
- **대안**: DB 의존 제거 → 환경변수만 사용 (가장 빠름)
- **결정 필요**: 운영자가 Admin UI로 GA ID를 자주 바꾸는지? → Design 단계 확인

#### A-2. 공개 페이지 ISR 설정
- 루트 레이아웃과 메인 페이지에 `export const revalidate = 3600`
- 시술/갤러리/의료진 등 정적 데이터 페이지 동일 적용
- /admin은 제외 (이미 dynamic이 정상)

### 3.2 Phase B — LCP 개선 (P1)

#### B-1. Hero 비디오 최적화
**선택 옵션**:
- (a) 비디오 파일 압축: 6MB → 1~2MB (ffmpeg, h.264 → h.265 또는 비트레이트 조정)
- (b) 모바일에서 비디오 비활성화 (poster만 표시)
- (c) Intersection Observer로 viewport 진입 시 로드

#### B-2. Hero poster preload
- `<link rel="preload" as="image" href="/images/hero-poster.jpg">` 추가
- 또는 next/image priority + fill 적용

### 3.3 Phase C — 에셋 슬림화 (P2)

#### C-1. 이미지 감사
- `public/images/` 내 사용 안 하는 파일 식별
- 큰 파일을 sharp로 압축, AVIF/WebP 추가 변환
- 갤러리 등 다량 이미지는 next/image lazy loading 확인

#### C-2. Script 최적화
- next/script `strategy="afterInteractive"` 또는 `lazyOnload` 활용
- JSON-LD는 정적이므로 그대로 inline OK

### 3.4 Phase D — 측정·검증

- Lighthouse CI 또는 PageSpeed Insights로 Before/After 비교
- Vercel Speed Insights 활용 (가능한 경우)

## 4. 위험 요소

| 위험 | 영향 | 완화 방안 |
|------|------|----------|
| DB 캐싱으로 GA ID 변경 반영 지연 | Admin에서 GA 설정 변경 시 1시간 대기 | revalidateTag 호출 또는 짧은 revalidate |
| ISR 적용 시 콘텐츠 업데이트 지연 | 컨텐츠 즉시 반영 안됨 | on-demand revalidate API 추가 |
| 비디오 제거/축소로 시각적 임팩트 감소 | 디자인 의도 손상 | 압축으로 절충, 디자이너 확인 필요 |

## 5. 성공 기준

- [ ] **TTFB**: 메인 페이지 < 600ms (cold), < 200ms (warm)
- [ ] **LCP**: 모바일 < 2.5s, 데스크탑 < 1.8s
- [ ] **PageSpeed 점수**: 모바일 80+ , 데스크탑 90+
- [ ] **Layout DB 호출**: 매 요청 → 시간당 1회로 감소
- [ ] **빌드 사이즈**: hero.mp4 < 2MB

## 6. 다음 단계

→ `/pdca design page-speed-optimization` 으로 진행
   - Phase A 우선순위 확정 (가장 빠른 효과)
   - GA 설정 DB 의존 유지/제거 결정
   - 비디오 처리 방식 결정
