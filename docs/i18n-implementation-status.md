# LIV 성형외과 다국어(i18n) 구현 현황

## 작업 일자: 2026-01-27 (최신 업데이트)

---

## 🚀 빠른 시작 (새 세션용)

### 현재 진행률
- **완료**: 메인 페이지, 공통 UI, 상담 폼, UltheraDetail, ThermageDetail, DensityDetail, InModeDetail, ShurinkDetail (5개)
- **대기**: 나머지 11개 시술 상세 페이지

### 다음에 해야 할 작업
```
1. ThreadDetail.tsx 번역 작업 (다음 파일)
   - 분석 후 번역 키 추가
   - ko/en/ja/zh.json에 번역 추가
   - 컴포넌트에서 t() 함수로 교체

2. 나머지 11개 Detail 파일에 동일 패턴 적용
   - ThreadDetail, AptosDetail (리프팅 2개)
   - BotoxDetail, FillerDetail, SkinboosterDetail (안티에이징 3개)
   - LaserCenterDetail 외 5개 (레이저 6개)

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

## 7. 대기 중: 나머지 11개 Detail 파일

### 7.1 리프팅 (2개)
| 파일 | 상태 |
|------|------|
| `ThreadDetail.tsx` | ⏳ 대기 |
| `AptosDetail.tsx` | ⏳ 대기 |

### 7.2 안티에이징 (3개)
| 파일 | 상태 |
|------|------|
| `BotoxDetail.tsx` | ⏳ 대기 |
| `FillerDetail.tsx` | ⏳ 대기 |
| `SkinboosterDetail.tsx` | ⏳ 대기 |

### 7.3 레이저 (6개)
| 파일 | 상태 |
|------|------|
| `LaserCenterDetail.tsx` | ⏳ 대기 |
| `PigmentationDetail.tsx` | ⏳ 대기 |
| `VascularDetail.tsx` | ⏳ 대기 |
| `SkinToneDetail.tsx` | ⏳ 대기 |
| `HairRemovalDetail.tsx` | ⏳ 대기 |
| `TattooRemovalDetail.tsx` | ⏳ 대기 |

---

## 8. 번역 작업 패턴 가이드

### 8.1 컴포넌트 수정 패턴

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

### 8.2 번역 키 추가 패턴

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

## 9. 테스트 방법

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

## 10. 참고 파일 경로

| 용도 | 경로 |
|------|------|
| 번역 파일 | `liv-clinic/src/messages/{ko,en,ja,zh}.json` |
| Detail 컴포넌트 | `liv-clinic/src/components/sections/*Detail.tsx` |
| i18n 설정 | `liv-clinic/src/i18n/routing.ts`, `request.ts` |
| 타입 정의 | `liv-clinic/src/types/index.ts` |

---

*마지막 업데이트: 2026-01-27 (ShurinkDetail.tsx 번역 완료 - 5개 Detail 페이지 완료)*
