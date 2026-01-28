# LIV 성형외과 다국어(i18n) 구현 현황

## 작업 일자: 2026-01-28 (최신 업데이트)

---

## 🎉 완료 현황

### ✅ 모든 Detail 페이지 번역 완료! (16개/16개)

**리프팅 시술 (6개)**
- UltheraDetail.tsx ✅
- ThermageDetail.tsx ✅
- DensityDetail.tsx ✅
- InModeDetail.tsx ✅
- ShurinkDetail.tsx ✅
- ThreadDetail.tsx ✅

**안티에이징 시술 (4개)**
- AptosDetail.tsx ✅
- BotoxDetail.tsx ✅
- FillerDetail.tsx ✅
- SkinboosterDetail.tsx ✅

**레이저 센터 (6개)**
- LaserCenterDetail.tsx ✅
- PigmentationDetail.tsx ✅
- VascularDetail.tsx ✅
- SkinToneDetail.tsx ✅
- HairRemovalDetail.tsx ✅
- TattooRemovalDetail.tsx ✅

---

## 🚀 향후 작업 (선택사항)

### 추가 개선 가능 작업
```
1. SVG 일러스트레이션 내 한국어 텍스트 리팩토링 (낮은 우선순위)
   - 일부 SVG 컴포넌트 내 하드코딩된 한국어 레이블
   - 이미 props로 전달하는 패턴 적용 완료된 파일 있음

2. 번역 품질 검토 (선택)
   - en.json, ja.json, zh.json 네이티브 검수
   - 의료 용어 일관성 확인

3. 새 페이지 추가 시 동일 패턴 적용
   - useTranslations('treatments') 훅 사용
   - t() / t.raw() 함수로 번역 데이터 접근
```

### 번역 파일 위치
```
liv-clinic/src/messages/
├── ko.json  (한국어 - 원본)
├── en.json  (영어)
├── ja.json  (일본어)
└── zh.json  (중국어)
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

## 3. 완료: ThermageDetail.tsx ✅

### 3.1 핵심 데이터 구조 번역

| 항목 | 설명 | 상태 |
|------|------|------|
| `heroLabels` | 동적 레이블 (AccuREP, Comfort Pulse 등) | ✅ 완료 |
| `skinLayers` | 피부층 레이블 (표피, 진피, 피하지방, 근막) | ✅ 완료 |
| `timeline` | 타임라인 데이터 (시술 직후 ~ 12개월+) | ✅ 완료 |
| `comparison` | 세대별 비교 테이블 (FLX vs CPT vs NXT) | ✅ 완료 |
| `tips` | 팁 종류 데이터 (900/600/400/225) | ✅ 완료 |
| `rfSteps` | RF 에너지 원리 3단계 | ✅ 완료 |
| `extendedFaqs` | 확장 FAQ 질문/답변 (3개) | ✅ 완료 |

### 3.2 섹션별 번역

| 섹션 | 번역 항목 | 상태 |
|------|-----------|------|
| Hero | 뱃지, 제목, 설명, 통계 레이블, floating badges | ✅ 완료 |
| About | 제목, 설명, RF 에너지 원리 3단계 | ✅ 완료 |
| Why Thermage | 섹션 제목, 3개 카드, Global Trust 통계 | ✅ 완료 |
| Tips | 섹션 제목, 부제목, Thermage Eye 섹션 | ✅ 완료 |
| Generation Compare | 섹션 제목, 부제목, 테이블 헤더 | ✅ 완료 |
| LIV Difference | 섹션 제목, 3개 카드 (정품 인증, 샷 수 투명, 전문의 직접) | ✅ 완료 |
| Timeline | 섹션 제목, 부제목 | ✅ 완료 |
| Treatment Info | 섹션 제목, 레이블, 권장 샷 수 | ✅ 완료 |
| FAQ | 섹션 제목, "더 많은 의료 정보", "의료정보 Q&A 더보기" | ✅ 완료 |
| CTA | 제목, 설명, 버튼, 운영시간, 위치 | ✅ 완료 |
| Related | 섹션 제목 | ✅ 완료 |

### 3.3 번역 키 구조 (treatments.lifting.thermage.detail)

```json
{
  "treatments": {
    "lifting": {
      "thermage": {
        "detail": {
          "heroLabels": [...],
          "skinLayers": { "epidermis", "dermis", "subcutaneous", "fascia" },
          "timeline": { "items": [...] },
          "comparison": { "title", "subtitle", "headers", "rows" },
          "tips": { "title", "subtitle", "items": [...] },
          "hero": { "badge", "title", "description", "stats" },
          "about": { "sectionLabel", "title", "description", "rfPrinciple" },
          "whyThermage": { "sectionLabel", "title", "cards", "globalTrust" },
          "tipsSection": { "sectionLabel", "title", "subtitle", "eye" },
          "generationCompare": { "sectionLabel", "title", "subtitle" },
          "livDifference": { "sectionLabel", "title", "cards" },
          "timelineSection": { "sectionLabel", "subtitle" },
          "treatmentInfo": { "sectionLabel", "title", "labels", "recommendedShots" },
          "faq": { "sectionLabel", "title", "extendedFaqs", "moreInfo", "viewMedicalQA" },
          "cta": { "sectionLabel", "title", "description", "bookConsultation", "businessHours", "location" },
          "related": { "sectionLabel", "title" }
        }
      }
    }
  }
}
```

---

## 4. 완료: DensityDetail.tsx ✅

### 4.1 핵심 데이터 구조 번역

| 항목 | 설명 | 상태 |
|------|------|------|
| `illustrations` | SVG 일러스트레이션 레이블 (dualEnergy, multiLayer, cooling, diagram) | ✅ 완료 |
| `timeline` | 타임라인 데이터 (시술 직후 ~ 6개월+) | ✅ 완료 |
| `comparison` | 비교 테이블 헤더/데이터 (덴서티 vs 울쎄라 vs 써마지) | ✅ 완료 |
| `extendedFaqs` | 확장 FAQ 질문/답변 (3개) | ✅ 완료 |

### 4.2 섹션별 번역

| 섹션 | 번역 항목 | 상태 |
|------|-----------|------|
| Hero | 뱃지, 제목, 설명, 통계 레이블, floating badges | ✅ 완료 |
| About | 제목, 설명, RF 원리 3단계 카드 | ✅ 완료 |
| Why Density | 섹션 제목, 3개 카드 (RF, 합리적 가격, 쿨링), Clinical Banner | ✅ 완료 |
| Compare | 섹션 제목, 부제목, 복합 시술 노트 | ✅ 완료 |
| LIV Difference | 섹션 제목, 3개 카드 (맞춤 에너지, 정품, 전문의 직접) | ✅ 완료 |
| Timeline | 섹션 제목, 부제목 | ✅ 완료 |
| Process | 섹션 레이블 | ✅ 완료 |
| Treatment Info | 섹션 제목, 레이블 (시술 시간, 마취, 회복, 효과) | ✅ 완료 |
| FAQ | 섹션 제목, "더 많은 의료 정보", "의료정보 Q&A 더보기" | ✅ 완료 |
| CTA | 제목, 설명, 버튼, 운영시간, 위치 | ✅ 완료 |
| Related | 섹션 제목 | ✅ 완료 |

### 4.3 번역 키 구조 (treatments.lifting.density.detail)

```json
{
  "treatments": {
    "lifting": {
      "density": {
        "detail": {
          "illustrations": { "dualEnergy", "multiLayer", "cooling", "diagram" },
          "timeline": { "items": [...] },
          "comparison": { "headers", "rows" },
          "extendedFaqs": [...],
          "hero": { "badge", "title", "description", "stats", "floatingBadges" },
          "about": { "sectionLabel", "title", "description", "rfPrinciple" },
          "whyDensity": { "sectionLabel", "title", "cards", "clinicalBanner" },
          "compare": { "sectionLabel", "title", "subtitle", "combinationNote" },
          "livDifference": { "sectionLabel", "title", "cards" },
          "timelineSection": { "sectionLabel", "subtitle" },
          "processSection": { "sectionLabel" },
          "treatmentInfo": { "sectionLabel", "title", "labels" },
          "faq": { "sectionLabel", "title", "moreInfo", "viewMedicalQA" },
          "cta": { "sectionLabel", "title", "description", "bookConsultation", "businessHours", "location" },
          "related": { "sectionLabel", "title" }
        }
      }
    }
  }
}
```

---

## 5. 완료: InModeDetail.tsx ✅

### 5.1 핵심 데이터 구조 번역

| 항목 | 설명 | 상태 |
|------|------|------|
| `illustrations` | SVG 일러스트레이션 레이블 (rfPrinciple, skinLayer) | ✅ 완료 |
| `treatmentCard` | 시술 카드 레이블 (효과, 특장점, 추천대상) | ✅ 완료 |
| `comparison` | 비교 테이블 헤더/데이터 (포마, 모피어스, 페이스타이트 비교) | ✅ 완료 |
| `treatmentOptions` | 시술 옵션 3가지 (Forma, Morpheus8, FaceTite) | ✅ 완료 |
| `recommendations` | 추천 대상 카드 데이터 | ✅ 완료 |
| `extendedFaqs` | 확장 FAQ 질문/답변 (3개) | ✅ 완료 |

### 5.2 섹션별 번역

| 섹션 | 번역 항목 | 상태 |
|------|-----------|------|
| Hero | 뱃지, 제목, 설명, 통계 레이블, floating badges | ✅ 완료 |
| About | 제목, 설명, RF 원리 3단계 카드 | ✅ 완료 |
| Compare | 섹션 제목, 부제목 | ✅ 완료 |
| LIV Difference | 섹션 제목, 3개 카드 (맞춤 에너지, 정품, 전문의 직접) | ✅ 완료 |
| Process | 섹션 레이블 | ✅ 완료 |
| Treatment Info | 섹션 제목, 레이블 (시술 시간, 마취, 회복, 효과) | ✅ 완료 |
| FAQ | 섹션 제목, "더 많은 의료 정보", "의료정보 Q&A 더보기" | ✅ 완료 |
| CTA | 제목, 설명, 버튼, 운영시간, 위치 | ✅ 완료 |
| Related | 섹션 제목 | ✅ 완료 |

### 5.3 번역 키 구조 (treatments.lifting.inmode.detail)

```json
{
  "treatments": {
    "lifting": {
      "inmode": {
        "detail": {
          "illustrations": { "rfPrinciple", "skinLayer" },
          "treatmentCard": { "effects", "features", "idealFor" },
          "comparison": { "headers", "rows" },
          "treatmentOptions": { "forma", "morpheus", "facetite" },
          "recommendations": [...],
          "extendedFaqs": [...],
          "hero": { "badge", "title", "description", "stats", "floatingBadges" },
          "about": { "sectionLabel", "title", "description", "rfPrinciple" },
          "compare": { "sectionLabel", "title", "subtitle" },
          "livDifference": { "sectionLabel", "title", "cards" },
          "processSection": { "sectionLabel" },
          "treatmentInfo": { "sectionLabel", "title", "labels" },
          "faq": { "sectionLabel", "title", "moreInfo", "moreButton" },
          "cta": { "subtitle", "title", "description", "consultButton", "hours", "location" },
          "related": { "sectionLabel", "title" }
        }
      }
    }
  }
}
```

---

## 6. 완료: ShurinkDetail.tsx ✅

### 6.1 핵심 데이터 구조 번역

| 항목 | 설명 | 상태 |
|------|------|------|
| `skinLayers` | 피부층 레이블 (표피, 진피, SMAS, 근막) | ✅ 완료 |
| `cartridges` | 카트리지 데이터 (1.5/3.0/4.5/6.0-9.0mm) | ✅ 완료 |
| `rapidShot` | 고속 연사 통계 및 비교 데이터 | ✅ 완료 |
| `comparison` | 비교 테이블 헤더/데이터 (슈링크 vs 울쎄라) | ✅ 완료 |
| `extendedFaqs` | 확장 FAQ 질문/답변 (3개) | ✅ 완료 |

### 6.2 섹션별 번역

| 섹션 | 번역 항목 | 상태 |
|------|-----------|------|
| Hero | 뱃지 (HIFU LIFTING) | ✅ 완료 |
| 슈링크 장점 | 제목, 부제목, "Premium HIFU" 라벨 | ✅ 완료 |
| 고속 연사 | 제목, 설명, 통계 3개 (30분, 7샷/초, 4종) | ✅ 완료 |
| 카트리지 시스템 | 제목, 설명, 카트리지별 정보 | ✅ 완료 |
| 시술 부위 | 제목, 부제목, 부위별 레이블 | ✅ 완료 |
| 시술 정보 | 제목, 레이블 4개 (시술 시간, 마취, 회복 기간, 효과 지속) | ✅ 완료 |
| 비교 테이블 | 제목, 부제목, 헤더 3개, 데이터 7행 (t.raw() 사용) | ✅ 완료 |
| 추천 대상 | 제목 | ✅ 완료 |
| FAQ | 제목, 관련 의료정보 Q&A 라벨, 더보기 링크 | ✅ 완료 |
| 주의사항 | 제목 | ✅ 완료 |
| CTA | 제목, 설명, 버튼 2개 | ✅ 완료 |

**참고**: SVG 일러스트레이션 내 텍스트(피부층 다이어그램 등)는 별도 리팩토링 필요 (우선순위 낮음)

### 6.3 번역 키 구조 (treatments.lifting.shurink.detail)

```json
{
  "treatments": {
    "lifting": {
      "shurink": {
        "detail": {
          "skinLayers": { "epidermis", "dermis", "smas", "fascia" },
          "cartridges": {
            "1_5mm": { "layer", "description" },
            "3_0mm": { "layer", "description" },
            "4_5mm": { "layer", "description" },
            "6_0_9_0mm": { "layer", "description" }
          },
          "rapidShot": {
            "conventional": { "label", "speed" },
            "shurink": { "label", "speed" },
            "badge": "3배 빠름"
          },
          "hero": { "badge" },
          "advantages": { "sectionLabel", "title", "subtitle", "premiumLabel" },
          "rapidShotSection": { "sectionLabel", "title", "description", "stats" },
          "cartridgeSection": { "sectionLabel", "title", "description" },
          "targetAreas": { "sectionLabel", "title", "subtitle", "areas" },
          "treatmentInfo": { "sectionLabel", "title", "labels" },
          "comparison": { "sectionLabel", "title", "subtitle", "headers", "rows" },
          "faq": { "sectionLabel", "title", "moreInfo", "moreButton" },
          "cautions": { "sectionLabel", "title" },
          "cta": { "subtitle", "title", "description", "consultButton", "callButton" }
        }
      }
    }
  }
}
```

---

## 7. 완료: ThreadDetail.tsx ✅

### 7.1 핵심 데이터 구조 번역

| 항목 | 설명 | 상태 |
|------|------|------|
| `skinLayers` | 피부층 레이블 (표피, 진피, 피하지방, SMAS) | ✅ 완료 |
| `liftingEffect` | 리프팅 효과 텍스트 | ✅ 완료 |
| `threadTypes` | 실 종류 데이터 (PDO, PLLA, PCL) | ✅ 완료 |
| `collagenTimeline` | 콜라겐 재생 타임라인 (시술 직후 ~ 3-6개월) | ✅ 완료 |
| `treatmentAreas` | 시술 부위 레이블 (이마, 광대, 볼, 팔자, 턱선, 목) | ✅ 완료 |
| `comparison` | 비교 테이블 헤더/데이터 (레이저 vs 실리프팅) | ✅ 완료 |

### 7.2 섹션별 번역

| 섹션 | 번역 항목 | 상태 |
|------|-----------|------|
| Hero | 뱃지 (THREAD LIFTING) | ✅ 완료 |
| 장점 | 섹션 라벨, 제목, 설명 | ✅ 완료 |
| 실 종류 | 제목, 설명, PDO/PLLA/PCL 카드 (제목, 부제목, 특징 리스트) | ✅ 완료 |
| 콜라겐 재생 | 제목, 설명, 타임라인 (시술 직후, 1-2개월, 3-6개월) | ✅ 완료 |
| 시술 부위 | 제목, 설명 | ✅ 완료 |
| 시술 과정 | 제목 | ✅ 완료 |
| 시술 정보 | 제목, 레이블 (시술 시간, 마취, 회복, 효과) | ✅ 완료 |
| 비교 테이블 | 제목, 설명, 헤더, 데이터 7행 | ✅ 완료 |
| 추천 대상 | 제목 | ✅ 완료 |
| FAQ | 제목, 관련 의료정보 Q&A, 더보기 버튼 | ✅ 완료 |
| 주의사항 | 제목 | ✅ 완료 |
| CTA | 제목, 설명, 버튼 2개 | ✅ 완료 |

### 7.3 번역 키 구조 (treatments.lifting.thread.detail)

```json
{
  "treatments": {
    "lifting": {
      "thread": {
        "detail": {
          "skinLayers": { "epidermis", "dermis", "subcutaneous", "smas" },
          "liftingEffect": "↑ LIFTING EFFECT ↑",
          "threadTypes": { "pdo", "plla", "pcl" },
          "collagenTimeline": { "immediate", "oneToTwo", "threeToSix" },
          "treatmentAreas": { "forehead", "cheekbone", "cheek", "nasolabial", "jawline", "neck" },
          "hero": { "badge" },
          "advantages": { "sectionLabel", "title", "description" },
          "threadTypesSection": { "title", "description", "pdoCard", "pllaCard", "pclCard" },
          "collagenSection": { "title", "description" },
          "targetAreasSection": { "title", "description" },
          "processSection": { "title" },
          "treatmentInfo": { "title", "labels" },
          "comparison": { "title", "description", "headers", "rows" },
          "recommended": { "title" },
          "faq": { "title", "relatedQA", "moreButton" },
          "cautions": { "title" },
          "cta": { "title", "description", "consultButton", "callButton" }
        }
      }
    }
  }
}
```

---

## 8. 완료: AptosDetail.tsx ✅

### 8.1 핵심 데이터 구조 번역

| 항목 | 설명 | 상태 |
|------|------|------|
| `namicaIllustration` | NAMICA 일러스트레이션 레이블 (title, subtitle) | ✅ 완료 |
| `phaseEffects` | 3단계 효과 데이터 (phase, title, description, effects) | ✅ 완료 |
| `certifications` | 인증서 데이터 (title, items) | ✅ 완료 |
| `gallery` | 갤러리 이미지 alt 텍스트 | ✅ 완료 |

### 8.2 섹션별 번역

| 섹션 | 번역 항목 | 상태 |
|------|-----------|------|
| Hero | 뱃지, 제목, 설명, duration 레이블 | ✅ 완료 |
| NAMICA 기술 | 제목, 설명, 3개 특징 카드 | ✅ 완료 |
| 3단계 효과 | 제목, 설명, 3단계 카드 데이터 | ✅ 완료 |
| 인증 | 제목, 인증서 5개 | ✅ 완료 |
| 트레이닝 | 제목, 설명, 인증서 정보 | ✅ 완료 |
| CTA | 제목, 설명, 버튼 | ✅ 완료 |
| 이미지 모달 | 갤러리 이미지 alt 텍스트 | ✅ 완료 |

### 8.3 번역 키 구조 (treatments.lifting.aptos.detail)

```json
{
  "treatments": {
    "lifting": {
      "aptos": {
        "detail": {
          "namicaIllustration": { "title", "subtitle" },
          "phaseEffects": [{ "phase", "title", "description", "effects" }],
          "certifications": { "title", "items" },
          "gallery": [{ "alt" }],
          "hero": { "badge", "title", "description", "durationLabel", "durationValue" },
          "namica": { "sectionLabel", "title", "description", "features" },
          "phases": { "sectionLabel", "title", "description" },
          "certificationsSection": { "sectionLabel", "title" },
          "training": { "sectionLabel", "title", "description", "certificateTitle", "certificateSubtitle" },
          "cta": { "title", "description", "button" }
        }
      }
    }
  }
}
```

---

## 9. 완료: BotoxDetail.tsx ✅

### 9.1 핵심 데이터 구조 번역

| 항목 | 설명 | 상태 |
|------|------|------|
| `treatmentAreasLabels` | SVG 시술 부위 레이블 (이마, 미간, 눈가, 사각턱, 입꼬리, 승모근, 종아리) | ✅ 완료 |
| `timeline` | 타임라인 데이터 (시술 당일 ~ 3-6개월) | ✅ 완료 |
| `treatmentInfoLabels` | 시술 정보 라벨 (시술 시간, 마취, 회복 기간, 효과 지속) | ✅ 완료 |
| `mechanismLabel` | 정밀 주사 매핑 일러스트 라벨 | ✅ 완료 |

### 9.2 섹션별 번역

| 섹션 | 번역 항목 | 상태 |
|------|-----------|------|
| SVG 일러스트 | 7개 시술 부위 레이블 | ✅ 완료 |
| 타겟 영역 설명 | 하드코딩된 한국어 설명 → 번역 | ✅ 완료 |
| 타임라인 | 4개 단계 (당일, 3-7일, 2-4주, 3-6개월) | ✅ 완료 |
| 시술 정보 | 4개 라벨 (시술 시간, 마취, 회복, 효과 지속) | ✅ 완료 |
| 매커니즘 일러스트 | 하단 라벨 번역 | ✅ 완료 |

### 9.3 번역 키 구조 (treatments.antiaging.botox.detail)

```json
{
  "treatments": {
    "antiaging": {
      "botox": {
        "detail": {
          "treatmentAreasLabels": { "forehead", "glabella", "crowsFeet", "masseter", "mouthCorners", "trapezius", "calves" },
          "targetAreasDescription": "시술 부위 설명",
          "timeline": { "title", "items": [...] },
          "mechanismLabel": "PRECISION INJECTION MAPPING",
          "treatmentInfoLabels": { "duration", "anesthesia", "recovery", "results" }
        }
      }
    }
  }
}
```

---

## 10. 완료: FillerDetail.tsx ✅

FillerDetail.tsx는 이미 대부분의 번역이 구현되어 있었습니다. 추가된 항목:

| 항목 | 설명 | 상태 |
|------|------|------|
| `volumeIllustrationLabel` | SVG 볼륨 일러스트레이션 라벨 | ✅ 완료 |
| `heroImageAlt` | Hero 이미지 alt 텍스트 | ✅ 완료 |

---

## 11. 완료: SkinboosterDetail.tsx ✅

SkinboosterDetail.tsx 번역 완료. 주요 변경 사항:

| 항목 | 설명 | 상태 |
|------|------|------|
| `heroImageAlt` | Hero 이미지 alt 텍스트 | ✅ 완료 |
| `hydrationIllustration` | SVG 수분 일러스트레이션 라벨 (epidermis, dehydrated, hydrated 등) | ✅ 완료 |
| `courseTimeline.items` | 코스 타임라인 데이터 (4회차) | ✅ 완료 |
| `benefits.title` | 장점 섹션 제목 | ✅ 완료 |
| `effects` | 효과 섹션 (제목 + 3개 효과 아이템) | ✅ 완료 |
| `treatmentCourse` | 코스 시술 섹션 (제목, 부제목, 유지 관리 안내) | ✅ 완료 |
| `products` | 제품 섹션 (제목, 부제목, 3개 제품 정보) | ✅ 완료 |
| `treatmentInfo` | 시술 정보 섹션 (제목 + 라벨) | ✅ 완료 |
| `faqTitle` | FAQ 섹션 제목 | ✅ 완료 |
| `cta` | CTA 섹션 (제목, 설명, 버튼 텍스트) | ✅ 완료 |

### 11.1 TypeScript 인터페이스 추가
```typescript
interface HydrationLabels {
  epidermis: string;
  dehydrated: string;
  hydrated: string;
  haGrowthFactors: string;
  deepHydration: string;
}

interface CourseTimelineItem {
  session: string;
  week: string;
  effect: number;
  desc: string;
}

interface EffectItem {
  icon: string;
  title: string;
  desc: string;
}

interface ProductItem {
  name: string;
  desc: string;
  feature: string;
}
```

---

## 12. 완료: 레이저 센터 Detail 파일 6개 ✅

### 12.1 레이저 (6개 모두 완료)
| 파일 | 상태 |
|------|------|
| `LaserCenterDetail.tsx` | ✅ 완료 |
| `PigmentationDetail.tsx` | ✅ 완료 |
| `VascularDetail.tsx` | ✅ 완료 |
| `SkinToneDetail.tsx` | ✅ 완료 |
| `HairRemovalDetail.tsx` | ✅ 완료 |
| `TattooRemovalDetail.tsx` | ✅ 완료 |

### 12.2 레이저 Detail 파일 번역 키 구조
모든 레이저 시술 상세 페이지에서 `treatments.laser.{시술명}.detail` 구조 사용:
- SVG 일러스트레이션 레이블 (illustrationLabels)
- 시술 부위 및 관심사 (concerns, treatmentAreas)
- 장비 정보 (equipmentSection, equipment)
- 프로토콜 및 FAQ (protocolSection, faq)
- CTA 섹션 (cta)

---

## 13. 번역 작업 패턴 가이드

### 13.1 컴포넌트 수정 패턴

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

### 13.2 번역 키 추가 패턴

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

## 14. 테스트 방법

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

## 15. 참고 파일 경로

| 용도 | 경로 |
|------|------|
| 번역 파일 | `liv-clinic/src/messages/{ko,en,ja,zh}.json` |
| Detail 컴포넌트 | `liv-clinic/src/components/sections/*Detail.tsx` |
| i18n 설정 | `liv-clinic/src/i18n/routing.ts`, `request.ts` |
| 타입 정의 | `liv-clinic/src/types/index.ts` |

---

*마지막 업데이트: 2026-01-28 (모든 16개 Detail 페이지 i18n 번역 완료!)*
