# 세션 핸드오프 - SEO/AEO/GEO 최적화 작업

> 작성일: 2026-01-27
> 목적: 새 세션에서 작업 이어가기 위한 컨텍스트 전달

---

## 프로젝트 정보

- **프로젝트**: LIV 성형외과 웹사이트 (리브성형외과)
- **프로젝트 루트**: `C:\dev\LIV_homepage\liv-clinic`
- **상세 작업 내역**: `SEO_AEO_GEO_WORK.md` 참고

---

## 완료된 작업 요약 (16개)

### 코드 작업 (모두 완료)

1. **스키마 함수 추가** (seo.ts)
   - Physician, LocalBusiness 확장, VoiceOptimizedFAQ
   - MedicalService, HowTo, WebSite, WebPage

2. **음성검색 최적화** (constants.ts)
   - MEDICAL_QA: shortAnswer + questionVariants (17개)
   - TREATMENTS FAQ: shortA 추가 (10개 시술, 27개 FAQ)

3. **페이지 스키마 적용** (layout.tsx 신규 생성)
   - 의료진: `/about/staff`
   - 의료정보: `/medical`
   - 리프팅 7개: ulthera, thermage, density, inmode, shurink, thread, aptos
   - 안티에이징 3개: botox, filler, skinbooster
   - 레이저 5개: pigmentation, vascular, skintone, hair-removal, tattoo

4. **빌드 오류 해결**
   - ClientSideWidgets.tsx 생성 (SSR 이슈)

**빌드 상태**: ✅ 성공

---

## 앞으로 할 작업 (배포 후)

### 1. 구조화된 데이터 테스트 (우선순위: 높음)

**Google Rich Results Test** (https://search.google.com/test/rich-results)
- [ ] 홈페이지: `https://livps.co.kr/ko`
- [ ] 의료진: `https://livps.co.kr/ko/about/staff`
- [ ] 의료정보 Q&A: `https://livps.co.kr/ko/medical`
- [ ] 울쎄라피 프라임: `https://livps.co.kr/ko/lifting/ulthera`
- [ ] 보톡스: `https://livps.co.kr/ko/antiaging/botox`

**Schema.org Validator** (https://validator.schema.org/)
- [ ] LocalBusiness (memberOf, hasCredential)
- [ ] Physician (SCI 논문, 학력)
- [ ] FAQPage (alternateName, Speakable)
- [ ] MedicalProcedure (ReserveAction)

### 2. AI 검색 노출 테스트 (우선순위: 높음)

**ChatGPT**
- [ ] "신사역 리프팅 잘하는 곳"
- [ ] "울쎄라 써마지 차이"
- [ ] "리브성형외과"

**Perplexity AI**
- [ ] "신사역 울쎄라피 프라임"
- [ ] "써마지 FLX 강남"

**Google AI Overview**
- [ ] "ultherapy prime seoul"
- [ ] "thermage flx korea"

### 3. 검색엔진 등록 (우선순위: 높음)

**Google Search Console**
- [ ] sitemap.xml 제출
- [ ] 색인 요청
- [ ] 구조화된 데이터 보고서 확인

**Naver Search Advisor**
- [ ] 사이트 소유 확인
- [ ] sitemap.xml 제출
- [ ] 웹페이지 수집 요청

---

## 주요 파일 위치

| 용도 | 경로 |
|-----|------|
| 스키마 함수 | `liv-clinic/src/lib/seo.ts` |
| 상수/데이터 | `liv-clinic/src/lib/constants.ts` |
| 상세 작업 내역 | `SEO_AEO_GEO_WORK.md` |
| 프로젝트 가이드 | `CLAUDE.md` |

---

## 빠른 명령어

```bash
# 개발 서버
cd C:\dev\LIV_homepage\liv-clinic && npm run dev

# 빌드 테스트
npm run build --prefix "c:/dev/LIV_homepage/liv-clinic"
```

---

## 체크리스트 상태

| 항목 | 상태 |
|-----|------|
| E-E-A-T 신호 | ✅ 완료 |
| AI 커머스 대비 | ✅ 완료 |
| 음성검색 최적화 | ✅ 완료 |
| AI 검색 최적화 | ✅ 완료 |
| 테스트 | ⏳ 배포 후 |
| 검색엔진 등록 | ⏳ 배포 후 |

---

**다음 세션에서 할 일**: 배포 후 구조화된 데이터 테스트 및 AI 검색 노출 확인
