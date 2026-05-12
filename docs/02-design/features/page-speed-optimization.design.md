# Design: page-speed-optimization

> Plan 문서의 결정사항을 반영한 간결 설계 (전술적 변경이므로 핵심만 기록)

## 결정사항 (사용자 선택)

| 항목 | 선택 | 이유 |
|------|------|------|
| GA 설정 운영 | **환경변수 한정** | "거의 바꾸지 않음" → 최고 성능 |
| Hero 비디오 | **압축해서 유지 (1~2MB)** | 시각적 임팩트 유지하면서 사이즈 감소 |

## 변경 사항 요약

### 1. `src/app/[locale]/layout.tsx`

**제거**:
- `getAnalyticsSettings()` 함수 전체 (DB 호출)
- `import { createAdminClient } from '@/lib/supabase-admin'`
- `analytics?.gaTrackingId / naverWcsId / gaEnabled / naverEnabled` 변수

**추가**:
- `export const revalidate = 3600` (ISR 1시간)
- `<link rel="preload" as="image" href="/images/hero/hero-1.jpg" fetchPriority="high">`
- 환경변수로 GA ID 직접 사용

**유지**:
- `<GoogleAnalytics />` (env var 자동 폴백)
- `<NaverAnalytics />` (env var 자동 폴백)
- LocalBusiness/WebSite JSON-LD
- Consent Mode v2 inline script

### 2. `src/components/sections/Hero.tsx`

**수정**:
- `HERO_POSTER`: `/images/hero-poster.jpg` (404 발생) → `/images/hero/hero-1.jpg` (실제 존재, 232KB)

### 3. 비디오 압축 (사용자 직접 실행 필요)

ffmpeg가 시스템에 설치되어 있지 않아 코드로 자동 처리 불가. 아래 명령어로 직접 수행 권장.

#### Windows에 ffmpeg 설치
```powershell
# Chocolatey 사용
choco install ffmpeg

# 또는 winget
winget install Gyan.FFmpeg
```

#### Hero 비디오 압축 (6MB → 1~2MB)
```powershell
cd C:\dev\LIV_homepage\liv-clinic\public\videos

# 기존 백업
copy hero.mp4 hero-original.mp4

# H.264, CRF 28(품질-사이즈 균형), 1080p 유지
ffmpeg -i hero-original.mp4 `
  -c:v libx264 `
  -crf 28 `
  -preset slow `
  -vf "scale=1920:-2" `
  -an `
  -movflags +faststart `
  hero.mp4
```

옵션 설명:
- `-c:v libx264`: H.264 코덱 (가장 광범위 호환)
- `-crf 28`: 품질 (낮을수록 고품질, 23~28 권장)
- `-preset slow`: 압축 효율 (slow가 file size 작음)
- `-vf scale=1920:-2`: 1920px 너비 (필요 시 1280으로 더 줄임)
- `-an`: 오디오 제거 (muted 자동재생이므로)
- `-movflags +faststart`: 스트리밍 시작점 헤더 앞으로 이동

#### 추가 최적화 (WebM 변환 - 선택)
모던 브라우저용 더 작은 포맷:
```powershell
ffmpeg -i hero-original.mp4 -c:v libvpx-vp9 -crf 35 -b:v 0 -an hero.webm
```

이후 `Hero.tsx`의 `<source>`에 `<source src="/videos/hero.webm" type="video/webm">` 추가 권장.

## 성능 영향 예상

| 지표 | 변경 전 (추정) | 변경 후 (예상) |
|------|---------------|---------------|
| TTFB (cold) | 500~800ms | **150~300ms** |
| TTFB (warm) | 300~500ms | **30~80ms** (캐시 히트) |
| 정적 페이지 수 | 0 | **385개** |
| 매 요청당 DB 호출 | 1회 | **0회** |
| Hero poster 404 | 발생 | **해소** |

## 트레이드오프

- **Admin에서 GA/Naver 설정 변경 시**: 사이트에 반영 안됨 (env var 변경 + 재배포 필요)
  - `/admin/settings` 페이지의 analytics 섹션은 향후 안내문 추가 권장
  - 또는 추후 별도 PDCA로 webhook 기반 revalidateTag 구현
- **ISR 1시간**: 컨텐츠 변경 후 최대 1시간 대기 (대부분 정적 페이지라 영향 미미)

## 검증 결과

- ✅ `npm run build` 성공 (6.0초 컴파일, 0 에러)
- ✅ 385개 정적 페이지 생성
- ✅ TypeScript 에러 없음
- ✅ admin 영역은 dynamic 유지

## 후속 작업 (사용자)

1. **(중요)** ffmpeg 설치 후 hero.mp4 압축 (위 명령어 참고)
2. **(권장)** 배포 후 PageSpeed Insights로 Before/After 측정
3. **(선택)** `public/images/` 257MB 중 미사용 이미지 정리
