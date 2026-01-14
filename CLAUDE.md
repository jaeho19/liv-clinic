# LIV 성형외과 웹사이트 프로젝트

> ⚠️ **CRITICAL: 모든 npm 명령은 반드시 `liv-clinic/` 폴더 내에서 실행할 것**
> 
> ```
> C:\dev\LIV_homepage\          ← 작업 폴더 (스크린샷, 테스트 스크립트)
> C:\dev\LIV_homepage\liv-clinic\  ← 실제 Next.js 프로젝트 (package.json 위치)
> ```

## 프로젝트 개요
- **프로젝트명**: LIV Plastic Surgery Website (리브성형외과 홈페이지)
- **프로젝트 루트**: `C:\dev\LIV_homepage\liv-clinic`
- **작업 폴더**: `C:\dev\LIV_homepage` (스크린샷, 이미지, 테스트 스크립트 저장용)
- **URL**: https://livps.co.kr (예정)
- **설명**: 신사역 프리미엄 안티에이징 클리닉 웹사이트

## 개발 명령어

**⚠️ 반드시 `liv-clinic` 폴더에서 실행:**

```bash
# 방법 1: 절대 경로로 이동 후 실행
cd C:\dev\LIV_homepage\liv-clinic
npm run dev

# 방법 2: 상대 경로
cd liv-clinic
npm run dev
```

| 명령어 | 설명 | 실행 위치 |
|--------|------|-----------|
| `npm run dev` | 개발 서버 (http://localhost:3000) | `liv-clinic/` |
| `npm run build` | 프로덕션 빌드 | `liv-clinic/` |
| `npm run start` | 프로덕션 서버 | `liv-clinic/` |
| `npm run lint` | ESLint 검사 | `liv-clinic/` |

## 기술 스택
- **Framework**: Next.js 16.1.1 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.x + CSS Variables
- **Animation**: Framer Motion
- **i18n**: next-intl (ko, en, ja, zh)
- **Form**: React Hook Form + Zod
- **Fonts**: Pretendard (로컬), Cormorant Garamond (Google Fonts)

## 폴더 구조

### 작업 폴더 (C:\dev\LIV_homepage)
```
LIV_homepage/
├── .claude/                    # Claude Code 설정
├── images/                     # 원본 이미지
├── screenshots/                # 스크린샷
├── public/                     # 복사용 퍼블릭 에셋
├── liv-clinic/                 # ★ 실제 Next.js 프로젝트
├── *.py                        # Playwright 테스트 스크립트
├── *.png                       # 캡처된 스크린샷
├── CLAUDE.md                   # 이 파일
└── 제안서.md
```

### 프로젝트 폴더 (C:\dev\LIV_homepage\liv-clinic)
```
liv-clinic/
├── package.json               # ★ npm 명령 실행 기준점
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── src/
│   ├── app/
│   │   ├── [locale]/              # 다국어 라우팅
│   │   │   ├── layout.tsx         # 루트 레이아웃
│   │   │   ├── page.tsx           # 메인 페이지
│   │   │   ├── loading.tsx        # 로딩 UI
│   │   │   ├── error.tsx          # 에러 UI
│   │   │   ├── not-found.tsx      # 404 페이지
│   │   │   ├── about/             # 소개 (브랜드, 의료진, 장비, 위치)
│   │   │   ├── signature/         # 시그니처 프로그램
│   │   │   ├── lifting/           # 리프팅 시술
│   │   │   ├── antiaging/         # 안티에이징 시술
│   │   │   ├── laser/             # 레이저 센터
│   │   │   ├── medical/           # 의료정보 Q&A
│   │   │   ├── gallery/           # 시술 갤러리
│   │   │   ├── promotion/         # 이벤트/프로모션
│   │   │   └── contact/           # 상담 예약
│   │   ├── globals.css            # 글로벌 스타일
│   │   ├── sitemap.ts             # 동적 사이트맵
│   │   └── robots.ts              # robots.txt
│   ├── components/
│   │   ├── ui/                    # UI 컴포넌트 (Button, Card, AnimateOnScroll)
│   │   ├── layout/                # 레이아웃 (Header, Footer, FloatingCTA)
│   │   └── sections/              # 페이지 섹션 컴포넌트
│   ├── lib/
│   │   ├── constants.ts           # 상수 (SITE_INFO, TREATMENTS, MEDICAL_QA)
│   │   ├── seo.ts                 # SEO 유틸리티 (메타데이터, Schema.org)
│   │   └── utils.ts               # 유틸리티 함수
│   ├── styles/
│   │   └── fonts.ts               # 폰트 설정
│   ├── messages/                  # i18n 번역 파일
│   │   ├── ko.json
│   │   ├── en.json
│   │   ├── ja.json
│   │   └── zh.json
│   ├── i18n/
│   │   ├── routing.ts             # 라우팅 설정
│   │   └── request.ts             # 요청 설정
│   └── types/
│       └── index.ts               # TypeScript 타입
└── public/
    ├── fonts/                     # Pretendard 폰트
    ├── images/                    # 이미지 에셋
    ├── icons/                     # PWA 아이콘
    └── manifest.json              # PWA 매니페스트
```

## 디자인 시스템

### 컬러 팔레트
```css
--color-primary: #b4988d;      /* 더스티 로즈 - 주채색, CTA */
--color-secondary: #6d4e42;    /* 다크 브라운 - 헤딩 */
--color-background: #f6f6f6;   /* 오프화이트 - 배경 */
--color-mono: #575756;         /* 차콜 그레이 - 본문 */
--color-mono-light: #8a8a8a;   /* 밝은 그레이 - 보조 텍스트 */
--color-border: #e5e5e5;       /* 테두리 */
```

### 타이포그래피
- **Display**: 72px / 48px (mobile)
- **H1**: 48px / 32px (mobile)
- **H2**: 36px / 28px (mobile)
- **H3**: 24px / 20px (mobile)
- **H4**: 20px / 18px (mobile)
- **Body**: 16px
- **Small**: 14px

### 간격
- **Section Gap**: 120px / 80px (mobile)
- **Container Max**: 1280px

## 주요 파일

### 데이터 (src/lib/constants.ts)
- `SITE_INFO`: 병원 정보 (주소, 전화, 좌표 등)
- `BUSINESS_HOURS`: 영업시간
- `TREATMENTS`: 시술 정보 (lifting, antiaging, laser)
- `MEDICAL_QA`: 의료정보 Q&A
- `EQUIPMENT_LIST`: 보유 장비

### SEO (src/lib/seo.ts)
- `generatePageMetadata()`: 페이지 메타데이터 생성
- `generateLocalBusinessSchema()`: LocalBusiness 스키마
- `generateFAQSchema()`: FAQ 스키마
- `generateMedicalProcedureSchema()`: 시술 스키마
- `generateBreadcrumbSchema()`: Breadcrumb 스키마

### 번역 키 구조 (messages/*.json)
```json
{
  "common": { ... },      // 공통 텍스트
  "nav": { ... },         // 네비게이션
  "hero": { ... },        // 히어로 슬라이드
  "sections": { ... },    // 섹션 제목/내용
  "footer": { ... },      // 푸터
  "meta": { ... },        // SEO 메타
  "contact": { ... },     // 상담 페이지
  "medical": { ... }      // 의료정보 페이지
}
```

## 페이지 목록 (73개)
- `/[locale]` - 메인 페이지
- `/[locale]/about` - 브랜드 소개
- `/[locale]/about/staff` - 의료진 소개
- `/[locale]/about/equipment` - 보유 장비
- `/[locale]/about/location` - 오시는 길
- `/[locale]/signature` - 시그니처 프로그램
- `/[locale]/lifting` - 리프팅 메인
- `/[locale]/lifting/[ulthera|thermage|density|inmode|shurink|thread]`
- `/[locale]/antiaging` - 안티에이징 메인
- `/[locale]/antiaging/[botox|filler|skinbooster]`
- `/[locale]/laser` - 레이저 센터
- `/[locale]/medical` - 의료정보 Q&A
- `/[locale]/gallery` - 시술 갤러리
- `/[locale]/promotion` - 이벤트/프로모션
- `/[locale]/contact` - 상담 예약

## 접근성
- Skip-to-content 링크 (다국어 지원)
- Focus visible 스타일
- Reduced motion 지원
- Semantic HTML (role, aria-label)
- 키보드 네비게이션

## SEO
- 동적 메타데이터 (next-intl 연동)
- Open Graph / Twitter Cards
- Schema.org 구조화 데이터 (MedicalBusiness, MedicalProcedure, FAQPage)
- 다국어 alternate 링크 (hreflang)
- 동적 sitemap.xml / robots.txt
- PWA manifest.json

## 주의사항

### Claude Code 사용 시
1. **npm 명령 실행 전 반드시 경로 확인**: `liv-clinic/` 폴더인지 확인
2. **파일 수정 시 경로**: `liv-clinic/src/...` 형태로 접근
3. **테스트 스크립트 저장**: 상위 `LIV_homepage/` 폴더에 저장
4. **스크린샷 저장**: 상위 `LIV_homepage/` 폴더에 저장

### 일반 주의사항
1. **이미지**: `/public/images/` 폴더에 실제 이미지 필요
2. **폰트**: Pretendard Variable woff2 파일 필요 (`/public/fonts/`)
3. **환경변수**: `NEXT_PUBLIC_SITE_URL` 설정 권장
4. **API**: 상담 폼은 현재 시뮬레이션 (실제 API 연동 필요)

## 향후 작업
- [ ] 실제 이미지 에셋 추가
- [ ] 상담 폼 API 연동
- [ ] Google Analytics / Naver Analytics 연동
- [ ] 카카오톡 채널 연동
- [ ] 네이버 예약 연동
- [ ] Next.js 16 middleware → proxy 마이그레이션
