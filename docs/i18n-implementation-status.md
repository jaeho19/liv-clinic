# LIV 성형외과 다국어(i18n) 구현 현황

## 작업 일자: 2026-01-27 (최신 업데이트)

---

## 🚀 빠른 시작 (새 세션용)

### 현재 진행률
- **완료**: 우선순위 1~4 (메인 페이지, 공통 UI, 상담 폼, UltheraDetail.tsx)
- **대기**: 나머지 15개 시술 상세 페이지

### 다음에 해야 할 작업
```
1. ThermageDetail.tsx 번역 (UltheraDetail.tsx 패턴 적용)
   - 번역 키 추가 (ko, en, ja, zh.json)
   - 컴포넌트에서 t() 함수로 교체

2. 나머지 14개 Detail 파일에 동일 패턴 적용
   - DensityDetail, InModeDetail, ShurinkDetail, ThreadDetail, AptosDetail
   - BotoxDetail, FillerDetail, SkinboosterDetail
   - LaserCenterDetail, PigmentationDetail, VascularDetail 등

3. 번역 파일 위치: liv-clinic/src/messages/{ko,en,ja,zh}.json
```

### 명령어
```bash
cd c:/dev/LIV_homepage/liv-clinic
npm run dev          # 개발 서버
npm run build        # 빌드 테스트
npx tsc --noEmit     # 타입 검사
```

---

## 1. 완료된 작업

### 1.0 메인 페이지 섹션 컴포넌트

| 파일 | 변경 내용 | 상태 |
|------|-----------|------|
| `Equipment.tsx` | 장비 설명, 상태바, 장비별 정보 번역 적용 | ✅ 완료 |
| `CoreValues.tsx` | 이미 번역 적용됨 (기존) | ✅ 완료 |
| `Doctor.tsx` | 의사 정보, 자격증 뱃지, 국제활동, YouTube 섹션 번역 | ✅ 완료 |
| `Location.tsx` | 주소, 연락처, 주차, 지도 버튼 번역 | ✅ 완료 |

### 1.1 공통 UI 레이아웃 컴포넌트

| 파일 | 변경 내용 | 상태 |
|------|-----------|------|
| `QuickConsultBar.tsx` | 에러 메시지, 개인정보 동의, 닫기 버튼 번역 | ✅ 완료 |
| `FloatingCTA.tsx` | 이미 inline 다국어 지원 (ko, en, ja, zh) | ✅ 완료 |
| `MobileMenu.tsx` | 메뉴 닫기, 언어 라벨 번역 | ✅ 완료 |
| `BackToTop.tsx` | 맨 위로 버튼 번역 | ✅ 완료 |
| `ConsultationForm.tsx` | 전체 UI 텍스트, 진료과목 옵션, 토스트 메시지 번역 | ✅ 완료 |

### 1.2 번역 파일 구조
모든 4개 언어 파일에 `treatments` 섹션 구조 완료:
- `liv-clinic/src/messages/ko.json` ✅
- `liv-clinic/src/messages/en.json` ✅
- `liv-clinic/src/messages/ja.json` ✅
- `liv-clinic/src/messages/zh.json` ✅

---

## 2. 완료: UltheraDetail.tsx ✅

### 2.1 핵심 데이터 구조 번역

| 항목 | 설명 | 상태 |
|------|------|------|
| `SkinLayerDiagram` | 피부층 레이블 (표피, 진피 상층, 진피 하층, SMAS층) | ✅ 완료 |
| `CollagenTimeline` | 타임라인 데이터 (시술 직후 ~ 12-24개월) | ✅ 완료 |
| `ComparisonTable` | 비교 테이블 헤더/데이터 (울쎄라 vs 슈링크 vs 써마지) | ✅ 완료 |
| `TRANSDUCERS` | 트랜스듀서 target/applications (6개 트랜스듀서) | ✅ 완료 |
| `extendedFaqs` | 확장 FAQ 질문/답변 (3개) | ✅ 완료 |

### 2.2 섹션별 번역

| 섹션 | 번역 항목 | 상태 |
|------|-----------|------|
| Hero | 뱃지, 제목, 설명, 통계 레이블, floating badges | ✅ 완료 |
| About | 제목, 설명, 깊이별 맞춤 타겟팅 카드 3개 | ✅ 완료 |
| Transducers | 섹션 제목, 부제목, 표층/심층 레이블, 에너지 전달 텍스트 | ✅ 완료 |
| Why Ulthera | 섹션 제목, 3개 카드 (FDA, DeepSEE, SMAS), Clinical Evidence | ✅ 완료 |
| Compare | Synergy note 제목/설명 | ✅ 완료 |
| LIV Difference | 섹션 제목, 3개 카드 (정품 인증, 샷 수 투명, 전문의 직접) | ✅ 완료 |
| Journey | 섹션 제목 | ✅ 완료 |
| Treatment Info | 섹션 제목, 레이블 (시술 시간, 마취, 회복, 효과), 권장 라인 수 | ✅ 완료 |
| Detailed Info | 섹션 제목 | ✅ 완료 |
| FAQ | 섹션 제목, "N개 더 보기", "의료정보 Q&A 더보기" | ✅ 완료 |
| CTA | 제목, 설명, 버튼, 운영시간, 위치 | ✅ 완료 |
| Related | 섹션 제목 | ✅ 완료 |

### 2.3 번역 키 구조 (treatments.lifting.ulthera.detail)

```json
{
  "treatments": {
    "lifting": {
      "ulthera": {
        "detail": {
          "skinLayers": { "epidermis", "upperDermis", "lowerDermis", "smas" },
          "timeline": { "items": [...], "note" },
          "comparison": { "title", "subtitle", "headers", "rows", "synergy" },
          "transducers": { "title", "subtitle", "shallow", "deep", "energyDelivery", "items" },
          "hero": { "badge", "premiumLifting", "title", "description", "stats", "deepSee", "smasTarget" },
          "about": { "sectionLabel", "title", "description", "depthTargeting", "depths" },
          "whyUlthera": { ... },
          "livDifference": { ... },
          "journey": { ... },
          "treatmentInfo": { ... },
          "detailedInfo": { ... },
          "faq": { ... },
          "cta": { ... },
          "related": { ... }
        }
      }
    }
  }
}
```

---

## 3. 대기 중: 나머지 15개 Detail 파일

### 3.1 리프팅 (6개)
| 파일 | 상태 |
|------|------|
| `ThermageDetail.tsx` | ⏳ 대기 |
| `DensityDetail.tsx` | ⏳ 대기 |
| `InModeDetail.tsx` | ⏳ 대기 |
| `ShurinkDetail.tsx` | ⏳ 대기 |
| `ThreadDetail.tsx` | ⏳ 대기 |
| `AptosDetail.tsx` | ⏳ 대기 |

### 3.2 안티에이징 (3개)
| 파일 | 상태 |
|------|------|
| `BotoxDetail.tsx` | ⏳ 대기 |
| `FillerDetail.tsx` | ⏳ 대기 |
| `SkinboosterDetail.tsx` | ⏳ 대기 |

### 3.3 레이저 (6개)
| 파일 | 상태 |
|------|------|
| `LaserCenterDetail.tsx` | ⏳ 대기 |
| `PigmentationDetail.tsx` | ⏳ 대기 |
| `VascularDetail.tsx` | ⏳ 대기 |
| `SkinToneDetail.tsx` | ⏳ 대기 |
| `HairRemovalDetail.tsx` | ⏳ 대기 |
| `TattooRemovalDetail.tsx` | ⏳ 대기 |

---

## 4. 번역 작업 패턴 가이드

### 4.1 컴포넌트 수정 패턴

```tsx
// 1. 번역 훅 사용 선언
const t = useTranslations('treatments');

// 2. 번역 데이터 가져오기 (배열/객체)
const timelineItems = t.raw('lifting.ulthera.detail.timeline.items') as TimelineItem[];

// 3. 단순 문자열 교체
<h2>{t('lifting.ulthera.detail.about.title')}</h2>

// 4. HTML 포함 텍스트 (dangerouslySetInnerHTML 사용)
<p dangerouslySetInnerHTML={{ __html: t('lifting.ulthera.detail.about.description') }} />

// 5. 컴포넌트에 props로 전달
<CollagenTimeline items={timelineItems} />
<ComparisonTable rows={comparisonRows} headers={comparisonHeaders} />
```

### 4.2 번역 키 추가 패턴

```json
// ko.json
"treatments": {
  "lifting": {
    "ulthera": {
      "detail": {
        "sectionName": {
          "title": "한국어 제목",
          "description": "한국어 설명"
        }
      }
    }
  }
}

// en.json - 동일 구조로 영어 번역
// ja.json - 동일 구조로 일본어 번역
// zh.json - 동일 구조로 중국어 번역
```

---

## 5. 테스트 방법

```bash
cd c:/dev/LIV_homepage/liv-clinic

# 타입 검사
npx tsc --noEmit

# 개발 서버 실행
npm run dev
```

브라우저에서 언어별 확인:
- http://localhost:3000/ko/lifting/ulthera (한국어)
- http://localhost:3000/en/lifting/ulthera (영어)
- http://localhost:3000/ja/lifting/ulthera (일본어)
- http://localhost:3000/zh/lifting/ulthera (중국어)

---

## 6. 참고 파일 경로

| 용도 | 경로 |
|------|------|
| 번역 파일 | `liv-clinic/src/messages/{ko,en,ja,zh}.json` |
| Detail 컴포넌트 | `liv-clinic/src/components/sections/*Detail.tsx` |
| i18n 설정 | `liv-clinic/src/i18n/routing.ts`, `request.ts` |
| 타입 정의 | `liv-clinic/src/types/index.ts` |

---

*마지막 업데이트: 2026-01-27 (UltheraDetail.tsx 100% 완료)*
