# i18n 번역 작업 진행 상황

## 완료된 작업 (Priority 3 - 2024.01.28)

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

### 2. ko.json 상세 번역 키 추가

#### treatments.laser.pigmentation.detail
- hero (subtitle, description)
- threeStageSystem (title, subtitle, stages[])
- picoVsNano (title, subtitle, 비교 데이터)
- equipment (title, subtitle, featured)
- protocol (mild, moderate, severe)
- idealFor[]
- faq[]
- cta (title, description)

#### treatments.laser.vascular.detail
- hero (subtitle, description)
- rednessTypes (title, subtitle, recommendedTreatment, types[])
- dualWavelength (title, subtitle, epidermis, dermis, alexandrite, ndyag)
- clarity (title, subtitle, badge, why, whyDesc, recommendedSessions)
- protocol (mild, moderate, severe)
- idealFor[]
- faq[]
- cta (title, description)

#### treatments.laser.tattoo.detail
- breadcrumb
- hero (title, subtitle, description)
- picoTech (badge, title, descriptions, benefits[], illustration)
- colorWavelength (badge, title, subtitle, colors, wavelengths[])
- tattooTypes (badge, title, subtitle, difficulty, types[])
- process (badge, title, steps[])
- lucas (title, subtitle, specs, strengths)
- precautions (before, after)
- faq[]
- cta (title, description)

#### treatments.antiaging.botox.detail
- hero (badge, title, description)
- benefits (title)
- targetAreas (title, subtitle, areas)
- treatmentInfo (title, duration, anesthesia, recovery, results)
- faq (title)
- cta (title, description)

#### treatments.antiaging.filler.detail
- hero (badge, title, description)
- benefits (title)
- targetAreas (title, subtitle, areas[])
- fillerTypes (title, subtitle, types[])
- safety (title, subtitle, steps[])
- treatmentInfo (title, duration, anesthesia, recovery, results)
- faq (title)
- cta (title, description)

### 3. en.json 상세 번역 키 추가

위 ko.json과 동일한 구조로 영어 번역 완료:
- treatments.laser.pigmentation.detail
- treatments.laser.vascular.detail
- treatments.laser.tattoo.detail
- treatments.antiaging.botox.detail
- treatments.antiaging.filler.detail

### 4. ja.json/zh.json 상세 키 추가 완료 (2024.01.28)

위 ko.json/en.json과 동일한 구조로 일본어/중국어 번역 완료:
- treatments.laser.pigmentation.detail
- treatments.laser.vascular.detail
- treatments.laser.tattoo.detail
- treatments.antiaging.botox.detail
- treatments.antiaging.filler.detail

### 5. Detail 컴포넌트 useTranslations 적용 완료 (2024.01.28)

- [x] PigmentationDetail.tsx - useTranslations 적용
- [x] VascularDetail.tsx - useTranslations 적용
- [x] TattooRemovalDetail.tsx - useTranslations 적용
- [x] BotoxDetail.tsx - useTranslations 적용
- [x] FillerDetail.tsx - useTranslations 적용

---

## 남은 작업 (TODO)

### Priority 3 계속

#### 1. 추가 Detail 컴포넌트 검토
- [ ] AptosDetail.tsx - 번역 키 추가 필요
- [ ] SkinboosterDetail.tsx - 검토 필요
- [ ] LaserCenterDetail.tsx - 검토 필요

#### 2. 기타 검토 대상
- [ ] UltheraDetail.tsx - 기존 번역 키 활용 상태 확인
- [ ] ThermageDetail.tsx - 기존 번역 키 활용 상태 확인
- [ ] DensityDetail.tsx - 기존 번역 키 활용 상태 확인

---

## 번역 키 사용 예시

```tsx
// 컴포넌트에서 사용
const t = useTranslations('treatments');

// 공통 키
{t('common.freeConsultation')}
{t('common.laserCenter')}

// 상세 키
{t('laser.pigmentation.detail.hero.subtitle')}
{t('laser.vascular.detail.rednessTypes.title')}
{t('antiaging.filler.detail.fillerTypes.title')}
```

---

## 참고 사항

- 모든 JSON 파일 유효성 검증 완료
- 기존 번역 키와 충돌 없음
- 빌드 테스트 필요
