# SEO/AEO/GEO 최적화 작업 내역

> 작성일: 2026-01-27
> 마지막 업데이트: 2026-01-27 (레이저 시술 페이지 스키마 적용 완료)
> 기반 자료: 유튜브 마케팅 트렌드 영상 요약

---

## 완료된 작업 (16개)

### 1. Physician 스키마 함수 추가 ✅
- **파일**: `liv-clinic/src/lib/seo.ts`
- **함수**: `generatePhysicianSchema()`
- **내용**:
  - 의료진 E-E-A-T 신호 강화
  - SCI 논문 구조화 (`ScholarlyArticle`)
  - 학력, 자격증, 전문분야 구조화
  - 소속 병원 연결 (`worksFor`)

### 2. 조직 스키마 확장 ✅
- **파일**: `liv-clinic/src/lib/seo.ts`
- **함수**: `generateLocalBusinessSchema()` 확장
- **추가 내용**:
  - 학회 소속 (`memberOf`): 대한성형외과의사회, 대한성형외과학회, 대한미용성형외과학회, MIPS
  - 장비 인증 (`hasCredential`): 울쎄라피 프라임, 써마지 FLX, APTOS 인증
  - 전문 분야 키워드 (`knowsAbout`)
  - 예약 액션 (`ReserveAction`)

### 3. MEDICAL_QA 음성검색 최적화 ✅
- **파일**: `liv-clinic/src/lib/constants.ts`
- **변경 내용**:
  - `shortAnswer` 필드 추가 (한 문장 정답, 30자 내외)
  - `questionVariants` 필드 추가 (구어체 질문 변형)
  - 17개 Q&A 모두 음성검색 최적화 완료

### 4. 음성검색 최적화 FAQ 스키마 ✅
- **파일**: `liv-clinic/src/lib/seo.ts`
- **함수**: `generateVoiceOptimizedFAQSchema()`
- **내용**: `alternateName`, `Speakable` 스키마

### 5. 시술별 MedicalService 스키마 ✅
- **파일**: `liv-clinic/src/lib/seo.ts`
- **함수**: `generateMedicalServiceSchema()`
- **내용**: `ReserveAction`으로 AI 커머스 예약 연동 준비

### 6. HowTo 스키마 ✅
- **파일**: `liv-clinic/src/lib/seo.ts`
- **함수**: `generateHowToSchema()`
- **용도**: 시술 과정 설명 (AI 오버뷰 최적화)

### 7. WebSite/WebPage 스키마 ✅
- **파일**: `liv-clinic/src/lib/seo.ts`
- **함수**: `generateWebSiteSchema()`, `generateWebPageSchema()`

### 8. 의료진 페이지 스키마 삽입 ✅
- **파일**: `liv-clinic/src/app/[locale]/about/staff/layout.tsx` (신규)
- **내용**: 김수영/천형준 원장 Physician 스키마

### 9. 의료정보 페이지 FAQ 스키마 삽입 ✅
- **파일**: `liv-clinic/src/app/[locale]/medical/layout.tsx` (신규)

### 10. FAQ 컴포넌트 UI 개선 ✅
- **파일**: `liv-clinic/src/components/sections/FAQ.tsx`
- **변경**: `shortAnswer` UI, `.short-answer` 클래스

### 11. 의료정보 페이지 UI 개선 ✅
- **파일**: `liv-clinic/src/app/[locale]/medical/page.tsx`

### 12. 시술 상세 페이지 스키마 적용 ✅ (10개 페이지)
**리프팅 시술 (7개)**:
| 파일 | 시술명 |
|------|--------|
| `lifting/ulthera/layout.tsx` | 울쎄라피 프라임 |
| `lifting/thermage/layout.tsx` | 써마지 FLX |
| `lifting/density/layout.tsx` | 덴서티 |
| `lifting/inmode/layout.tsx` | 인모드 |
| `lifting/shurink/layout.tsx` | 슈링크 |
| `lifting/thread/layout.tsx` | 실리프팅 |
| `lifting/aptos/layout.tsx` | 압토스 나미카 |

**안티에이징 시술 (3개)**:
| 파일 | 시술명 |
|------|--------|
| `antiaging/botox/layout.tsx` | 보톡스 |
| `antiaging/filler/layout.tsx` | 필러 |
| `antiaging/skinbooster/layout.tsx` | 스킨부스터 |

**적용 스키마**: MedicalService, HowTo, WebPage (Breadcrumb, Speakable)

### 13. 전역 레이아웃 WebSite 스키마 추가 ✅
- **파일**: `liv-clinic/src/app/[locale]/layout.tsx`
- **내용**: `generateWebSiteSchema()` JSON-LD 삽입

### 14. 빌드 오류 해결 (ssr: false 이슈) ✅
- **문제**: Next.js 16에서 Server Components에서 `ssr: false` 사용 불가
- **해결**: `ClientSideWidgets.tsx` 클라이언트 래퍼 생성
- **생성 파일**: `liv-clinic/src/components/layout/ClientSideWidgets.tsx`
- **빌드 성공 확인**: ✅

### 15. 시술별 FAQ shortA 추가 ✅
- **파일**: `liv-clinic/src/lib/constants.ts`
- **내용**: TREATMENTS 내 10개 시술의 27개 FAQ에 `shortA` 필드 추가
- **대상**: ulthera, thermage, density, inmode, shurink, thread, aptos, botox, filler, skinbooster
- **빌드 성공 확인**: ✅

### 16. 레이저 시술 페이지 스키마 적용 ✅ (5개 페이지)
| 파일 | 시술명 |
|------|--------|
| `laser/pigmentation/layout.tsx` | 기미/색소 개선 |
| `laser/vascular/layout.tsx` | 홍조/혈관 치료 |
| `laser/skintone/layout.tsx` | 피부톤 균일화 |
| `laser/hair-removal/layout.tsx` | 프리미엄 제모 |
| `laser/tattoo/layout.tsx` | 문신 제거 |

**적용 스키마**: MedicalService, WebPage (Breadcrumb, Speakable)
- **빌드 성공 확인**: ✅

---

## 앞으로 할 작업

### 1. 시술별 FAQ에 shortAnswer 추가 ✅ 완료 (2026-01-27)
`TREATMENTS`의 각 시술별 `faqs`에 `shortA` 필드 추가 완료.

**수정 파일**: `liv-clinic/src/lib/constants.ts`

**완료 시술 (10개)**:
- [x] ulthera (3개 FAQ)
- [x] thermage (3개 FAQ)
- [x] density (2개 FAQ)
- [x] inmode (2개 FAQ)
- [x] shurink (2개 FAQ)
- [x] thread (3개 FAQ)
- [x] aptos (3개 FAQ)
- [x] botox (3개 FAQ)
- [x] filler (3개 FAQ)
- [x] skinbooster (3개 FAQ)

**총 27개 FAQ에 shortA 추가 완료**

---

### 2. 구조화된 데이터 테스트 (우선순위: 높음) ⚠️ 필수

배포 후 반드시 아래 도구들로 스키마 유효성 검사 진행 필요:

#### Google Rich Results Test
- **URL**: https://search.google.com/test/rich-results
- **테스트할 페이지**:
  - [ ] 홈페이지: `https://livps.co.kr/ko`
  - [ ] 의료진 페이지: `https://livps.co.kr/ko/about/staff`
  - [ ] 의료정보 Q&A: `https://livps.co.kr/ko/medical`
  - [ ] 울쎄라피 프라임: `https://livps.co.kr/ko/lifting/ulthera`
  - [ ] 써마지: `https://livps.co.kr/ko/lifting/thermage`
  - [ ] 보톡스: `https://livps.co.kr/ko/antiaging/botox`

#### Schema.org Validator
- **URL**: https://validator.schema.org/
- **검증 항목**:
  - [ ] LocalBusiness 스키마 (memberOf, hasCredential)
  - [ ] Physician 스키마 (SCI 논문, 학력)
  - [ ] FAQPage 스키마 (alternateName, Speakable)
  - [ ] MedicalProcedure 스키마 (ReserveAction)
  - [ ] HowTo 스키마 (시술 과정)
  - [ ] WebSite 스키마 (SearchAction)

#### 오류 발견 시 수정 사항 기록
| 페이지 | 오류 내용 | 수정 여부 |
|--------|----------|----------|
| | | |

---

### 3. AI 검색 노출 테스트 (우선순위: 높음) ⚠️ 필수

배포 후 아래 AI 검색 서비스에서 노출 상태 확인:

#### ChatGPT (GPT-4)
- [ ] "신사역 리프팅 잘하는 곳"
- [ ] "울쎄라 써마지 차이"
- [ ] "강남 비수술 리프팅 병원"
- [ ] "리브성형외과"

#### Perplexity AI
- [ ] "신사역 울쎄라피 프라임"
- [ ] "써마지 FLX 강남"
- [ ] "비수술 안티에이징 서울"

#### Naver Q (AI 검색)
- [ ] "신사역 피부과 추천"
- [ ] "울쎄라피 프라임 효과"
- [ ] "써마지 보톡스 병행"

#### Google AI Overview
- [ ] "ultherapy prime seoul"
- [ ] "thermage flx korea"
- [ ] "non surgical facelift gangnam"

#### 테스트 결과 기록
| 검색 서비스 | 검색어 | 노출 여부 | 비고 |
|------------|--------|----------|------|
| | | | |

---

### 4. 레이저 시술 페이지 스키마 적용 ✅ 완료 (2026-01-27)

레이저 센터 하위 5개 페이지에 스키마 적용 완료:
- [x] `/laser/pigmentation` - 기미/색소 개선
- [x] `/laser/vascular` - 홍조/혈관 치료
- [x] `/laser/skintone` - 피부톤 균일화
- [x] `/laser/hair-removal` - 프리미엄 제모
- [x] `/laser/tattoo` - 문신 제거

---

### 5. Google Search Console 등록 (우선순위: 높음)

배포 후 진행:
- [ ] sitemap.xml 제출
- [ ] 색인 요청
- [ ] 구조화된 데이터 보고서 확인
- [ ] 리치 결과 상태 모니터링

---

### 6. Naver Search Advisor 등록 (우선순위: 높음)

배포 후 진행:
- [ ] 사이트 소유 확인
- [ ] sitemap.xml 제출
- [ ] 웹페이지 수집 요청

---

## 수정된 파일 목록 (전체 26개)

| 파일 경로 | 상태 | 설명 |
|----------|------|------|
| `liv-clinic/src/lib/seo.ts` | 수정 | 8개 스키마 함수 추가 |
| `liv-clinic/src/lib/constants.ts` | 수정 | MEDICAL_QA 음성검색 최적화 + TREATMENTS FAQ shortA 추가 |
| `liv-clinic/src/components/sections/FAQ.tsx` | 수정 | shortAnswer UI |
| `liv-clinic/src/components/layout/ClientSideWidgets.tsx` | **신규** | SSR 오류 해결용 래퍼 |
| `liv-clinic/src/app/[locale]/layout.tsx` | 수정 | WebSite 스키마, SSR 수정 |
| `liv-clinic/src/app/[locale]/about/staff/layout.tsx` | **신규** | Physician 스키마 |
| `liv-clinic/src/app/[locale]/medical/layout.tsx` | **신규** | FAQ 스키마 |
| `liv-clinic/src/app/[locale]/medical/page.tsx` | 수정 | shortAnswer UI |
| `liv-clinic/src/app/[locale]/lifting/ulthera/layout.tsx` | **신규** | 스키마 |
| `liv-clinic/src/app/[locale]/lifting/thermage/layout.tsx` | **신규** | 스키마 |
| `liv-clinic/src/app/[locale]/lifting/density/layout.tsx` | **신규** | 스키마 |
| `liv-clinic/src/app/[locale]/lifting/inmode/layout.tsx` | **신규** | 스키마 |
| `liv-clinic/src/app/[locale]/lifting/shurink/layout.tsx` | **신규** | 스키마 |
| `liv-clinic/src/app/[locale]/lifting/thread/layout.tsx` | **신규** | 스키마 |
| `liv-clinic/src/app/[locale]/lifting/aptos/layout.tsx` | **신규** | 스키마 |
| `liv-clinic/src/app/[locale]/antiaging/botox/layout.tsx` | **신규** | 스키마 |
| `liv-clinic/src/app/[locale]/antiaging/filler/layout.tsx` | **신규** | 스키마 |
| `liv-clinic/src/app/[locale]/antiaging/skinbooster/layout.tsx` | **신규** | 스키마 |
| `liv-clinic/src/app/[locale]/laser/pigmentation/layout.tsx` | **신규** | 스키마 |
| `liv-clinic/src/app/[locale]/laser/vascular/layout.tsx` | **신규** | 스키마 |
| `liv-clinic/src/app/[locale]/laser/skintone/layout.tsx` | **신규** | 스키마 |
| `liv-clinic/src/app/[locale]/laser/hair-removal/layout.tsx` | **신규** | 스키마 |
| `liv-clinic/src/app/[locale]/laser/tattoo/layout.tsx` | **신규** | 스키마 |

---

## SEO/AEO/GEO 최적화 체크리스트

### E-E-A-T 신호 ✅ 완료
- [x] 의료진 Physician 스키마 (학력, 자격증, SCI 논문)
- [x] 조직 memberOf (학회 소속)
- [x] hasCredential (장비 인증)
- [x] knowsAbout (전문 분야 키워드)

### AI 커머스 대비 ✅ 완료
- [x] ReserveAction 스키마 (예약 연동 준비)
- [x] 시술별 MedicalService 스키마
- [x] HowTo 스키마 (시술 과정)

### 음성검색 최적화 ✅ 완료
- [x] MEDICAL_QA shortAnswer + questionVariants
- [x] Speakable 스키마
- [x] TREATMENTS 시술별 FAQ shortAnswer (10개 시술, 27개 FAQ)

### AI 검색 최적화 ✅ 완료
- [x] WebSite 스키마 (SearchAction)
- [x] WebPage 스키마 (Speakable)
- [x] FAQ 스키마 (alternateName)

### 테스트 ⏳ 대기
- [ ] Google Rich Results Test
- [ ] Schema.org Validator
- [ ] AI 검색 노출 테스트
- [ ] Google Search Console 등록
- [ ] Naver Search Advisor 등록

---

## 참고: 추가된 스키마 함수

```typescript
// liv-clinic/src/lib/seo.ts

// 기존 함수 (확장됨)
generateLocalBusinessSchema()  // memberOf, hasCredential, knowsAbout, ReserveAction

// 신규 함수
generatePhysicianSchema(doctor)           // 의료진 E-E-A-T
generateScholarlyArticleSchema(pub)       // 학술 논문
generateWebSiteSchema()                   // 사이트 전체 + SearchAction
generateWebPageSchema(page)               // 개별 페이지 + Speakable
generateVoiceOptimizedFAQSchema(faqs)     // 음성검색 최적화 FAQ
generateMedicalServiceSchema(treatment)   // 시술 서비스 + ReserveAction
generateHowToSchema(treatment)            // 시술 과정
generatePageSchemas(options)              // 통합 유틸리티
```
