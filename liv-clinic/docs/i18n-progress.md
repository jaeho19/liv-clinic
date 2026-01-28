# i18n 번역 작업 진행 상황

## 완료된 작업 - 2025.01.28 (Phase 2)

### Phase 1: 페이지 레벨 번역 키 추가

4개 언어 파일에 새로운 번역 키 추가:

| 파일 | 상태 | 추가된 섹션 |
|------|------|------------|
| `src/messages/ko.json` | ✅ 완료 | signaturePage, liftingPage, antiagingPage, laserPage, trust, floatingCta |
| `src/messages/en.json` | ✅ 완료 | 영어 번역 추가 |
| `src/messages/zh.json` | ✅ 완료 | 중국어 번역 추가 |
| `src/messages/ja.json` | ✅ 완료 | 일본어 번역 추가 |

### Phase 2: 컴포넌트 수정

하드코딩된 한국어 텍스트를 `useTranslations()` 호출로 교체:

| 파일 | 상태 | 수정 내용 |
|------|------|----------|
| `src/components/sections/SignatureDetail.tsx` | ✅ 완료 | hero, photoComparison, whySignature, comparison, CTA 섹션 |
| `src/app/[locale]/lifting/page.tsx` | ✅ 완료 | hero, lineup, whyChoose, CTA 섹션 |
| `src/app/[locale]/antiaging/page.tsx` | ✅ 완료 | hero, lineup, benefits, CTA 섹션 |
| `src/components/sections/TrustBlock.tsx` | ✅ 완료 | trustItems, CTA 버튼 |
| `src/components/layout/FloatingCTA.tsx` | ✅ 스킵 | 이미 locale 기반 처리 구현됨 |

### Phase 3: 빌드 검증

- `npm run build` 성공 ✅

---

## 완료된 작업 - 2024.01.28 (Phase 1)

### 1. treatments.common 공통 키 추가 (ko/en/ja/zh 모두)

추가된 키:
- `laserCenter` - 레이저 센터
- `freeConsultation` - 무료 상담 예약
- `onlineConsultation` - 온라인 상담 예약
- `phoneConsultation` - 전화 상담
- `treatmentInfo` - 시술 정보
- `downtime` - 다운타임
- `recommendedSessions` - 권장 횟수
- `sessionInterval` - 시술 간격
- `recommendedTreatment` - 추천 치료
- `otherTreatments` - 다른 시술 보기
- `otherLaserTreatments` - 다른 레이저 시술 보기
- `mild` - 경증
- `moderate` - 중등도
- `severe` - 중증
- `benefits` - 장점
- `consultationCta` - 상담 예약
- `effectDuration` - 효과 지속

### 2. Detail 컴포넌트 번역 키 추가

- treatments.laser.pigmentation.detail
- treatments.laser.vascular.detail
- treatments.laser.tattoo.detail
- treatments.antiaging.botox.detail
- treatments.antiaging.filler.detail

### 3. Detail 컴포넌트 useTranslations 적용

- [x] PigmentationDetail.tsx
- [x] VascularDetail.tsx
- [x] TattooRemovalDetail.tsx
- [x] BotoxDetail.tsx
- [x] FillerDetail.tsx

---

## 남은 작업 (TODO)

### 우선순위 HIGH

#### 1. LaserCenterDetail.tsx 수정
- **파일**: `src/components/sections/LaserCenterDetail.tsx`
- **하드코딩 개수**: 50+ 개
- **수정 필요 섹션**:
  - Hero 섹션 (레이저 센터 소개)
  - Categories 섹션 (색소, 혈관, 피부톤 등)
  - Equipment 섹션 (장비 소개)
  - Synergy 섹션 (시너지 효과)
  - Process 섹션 (시술 과정)
  - FAQ 섹션 (자주 묻는 질문)
  - CTA 섹션

#### 2. SignatureDetail.tsx - 프로그램 카드 데이터
- **파일**: `src/components/sections/SignatureDetail.tsx`
- **내용**: `signaturePrograms` 배열 내 하드코딩된 카드 데이터
  - 프로그램명 (LIFTING, PETIT, GLOW, TOTAL)
  - 설명 텍스트
  - 추천 대상 텍스트

### 우선순위 MEDIUM

#### 3. SignatureProgramsSection.tsx
- **파일**: `src/components/sections/SignatureProgramsSection.tsx`
- **하드코딩 개수**: 약 5개

#### 4. 레이아웃 Breadcrumbs
- **파일들**: 각 페이지 레이아웃 파일
- **내용**: 네비게이션 breadcrumb 텍스트

#### 5. 추가 Detail 컴포넌트 검토
- [ ] AptosDetail.tsx - 번역 키 추가 필요
- [ ] SkinboosterDetail.tsx - 검토 필요
- [ ] UltheraDetail.tsx - 기존 번역 키 활용 상태 확인
- [ ] ThermageDetail.tsx - 기존 번역 키 활용 상태 확인
- [ ] DensityDetail.tsx - 기존 번역 키 활용 상태 확인

### 우선순위 LOW

#### 6. NaverMap.tsx
- **파일**: `src/components/ui/NaverMap.tsx`
- **하드코딩 개수**: 2개 (지도 팝업 텍스트)

#### 7. LanguageSwitcher.tsx / MobileMenu.tsx
- 각각 1개씩 하드코딩된 텍스트

---

## 번역 키 구조 (Phase 2에서 추가됨)

```json
{
  "signaturePage": {
    "hero": { "subtitle", "title", "description1", "description2" },
    "photoComparison": { "title", "subtitle" },
    "programs": { "recommended", "viewDetails" },
    "whySignature": {
      "title", "subtitle",
      "synergy": { "title", "description" },
      "price": { "title", "description" },
      "protocol": { "title", "description" }
    },
    "comparison": { "title", "subtitle", "headers": {...}, "rows": {...} },
    "cta": { "title", "subtitle", "button" }
  },
  "liftingPage": {
    "hero": { "subtitle", "description1", "description2" },
    "lineup": { "subtitle", "title" },
    "whyChoose": {
      "subtitle", "title",
      "certification": { "title", "description1", "description2" },
      "experts": { "title", "description1", "description2" },
      "customized": { "title", "description1", "description2" }
    },
    "cta": { "title", "description", "button" }
  },
  "antiagingPage": {
    "hero": { "subtitle", "description1", "description2" },
    "lineup": { "subtitle", "title" },
    "benefits": {
      "subtitle", "title", "description",
      "authentic": { "title", "description" },
      "customized": { "title", "description" },
      "natural": { "title", "description" }
    },
    "cta": { "title", "description", "button" }
  },
  "trust": {
    "certification": { "title", "subtitle" },
    "doctor": { "title", "subtitle" },
    "location": { "title", "subtitle" },
    "cta": { "consultation", "kakao" }
  }
}
```

---

## 테스트 방법

### 개발 서버 실행
```bash
cd liv-clinic
npm run dev
```

### 각 언어별 URL 접속
- 한국어: http://localhost:3000/ko/signature
- 영어: http://localhost:3000/en/signature
- 중국어: http://localhost:3000/zh/signature
- 일본어: http://localhost:3000/ja/signature

### 확인 사항
1. 모든 텍스트가 해당 언어로 표시되는지 확인
2. 한국어 텍스트가 남아있지 않은지 확인
3. 레이아웃이 깨지지 않았는지 확인

---

## 참고 사항

- 번역 함수: `useTranslations()` from `next-intl`
- 번역 파일 위치: `src/messages/*.json`
- 라우팅: `[locale]` 동적 세그먼트 사용
- 모든 JSON 파일 유효성 검증 완료
- 빌드 테스트 완료
