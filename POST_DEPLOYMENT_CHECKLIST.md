# 배포 후 체크리스트 - SEO/AEO/GEO 검증

> 작성일: 2026-01-27
> 목적: 배포 후 SEO/AEO/GEO 최적화 검증 및 검색엔진 등록

---

## 1. 구조화된 데이터 테스트 (우선순위: 높음)

### Google Rich Results Test
- **URL**: https://search.google.com/test/rich-results

| 페이지 | URL | 확인할 스키마 | 완료 |
|--------|-----|--------------|------|
| 홈페이지 | `https://livps.co.kr/ko` | MedicalBusiness, WebSite | [ ] |
| 의료진 | `https://livps.co.kr/ko/about/staff` | Physician (SCI 논문) | [ ] |
| 의료정보 Q&A | `https://livps.co.kr/ko/medical` | FAQPage (Speakable) | [ ] |
| 울쎄라피 | `https://livps.co.kr/ko/lifting/ulthera` | MedicalProcedure, HowTo | [ ] |
| 써마지 | `https://livps.co.kr/ko/lifting/thermage` | MedicalProcedure, HowTo | [ ] |
| 보톡스 | `https://livps.co.kr/ko/antiaging/botox` | MedicalProcedure | [ ] |
| 레이저 색소 | `https://livps.co.kr/ko/laser/pigmentation` | MedicalService | [ ] |

### Schema.org Validator
- **URL**: https://validator.schema.org/

| 스키마 타입 | 검증 항목 | 완료 |
|------------|----------|------|
| LocalBusiness | memberOf, hasCredential, knowsAbout | [ ] |
| Physician | alumniOf, performerIn (SCI 논문), hasCredential | [ ] |
| FAQPage | alternateName, Speakable | [ ] |
| MedicalProcedure | ReserveAction, additionalProperty | [ ] |
| HowTo | step, totalTime | [ ] |
| WebSite | SearchAction | [ ] |

### 오류 발견 시 기록

| 페이지 | 오류 내용 | 수정 완료 |
|--------|----------|----------|
| | | [ ] |
| | | [ ] |

---

## 2. AI 검색 노출 테스트 (우선순위: 높음)

### ChatGPT (GPT-4)

| 검색어 | 노출 여부 | 비고 |
|--------|----------|------|
| "신사역 리프팅 잘하는 곳" | [ ] | |
| "울쎄라 써마지 차이" | [ ] | |
| "강남 비수술 리프팅 병원" | [ ] | |
| "리브성형외과" | [ ] | |

### Perplexity AI

| 검색어 | 노출 여부 | 비고 |
|--------|----------|------|
| "신사역 울쎄라피 프라임" | [ ] | |
| "써마지 FLX 강남" | [ ] | |
| "비수술 안티에이징 서울" | [ ] | |

### Google AI Overview (영문)

| 검색어 | 노출 여부 | 비고 |
|--------|----------|------|
| "ultherapy prime seoul" | [ ] | |
| "thermage flx korea" | [ ] | |
| "non surgical facelift gangnam" | [ ] | |

### Naver Q (AI 검색)

| 검색어 | 노출 여부 | 비고 |
|--------|----------|------|
| "신사역 피부과 추천" | [ ] | |
| "울쎄라피 프라임 효과" | [ ] | |
| "써마지 보톡스 병행" | [ ] | |

---

## 3. 검색엔진 등록 (우선순위: 높음)

### Google Search Console
- **URL**: https://search.google.com/search-console

| 작업 | 완료 |
|------|------|
| 사이트 소유권 확인 | [ ] |
| sitemap.xml 제출 (`https://livps.co.kr/sitemap.xml`) | [ ] |
| 주요 페이지 색인 요청 | [ ] |
| 구조화된 데이터 보고서 확인 | [ ] |
| 리치 결과 상태 모니터링 | [ ] |

### Naver Search Advisor
- **URL**: https://searchadvisor.naver.com/

| 작업 | 완료 |
|------|------|
| 사이트 소유권 확인 | [ ] |
| sitemap.xml 제출 | [ ] |
| 웹페이지 수집 요청 | [ ] |
| 콘텐츠 진단 확인 | [ ] |

---

## 4. 추가 최적화 (선택)

### 소셜 미디어 연동

| 플랫폼 | 작업 | 완료 |
|--------|------|------|
| 카카오톡 채널 | 연동 확인 | [ ] |
| 인스타그램 | 프로필 링크 확인 | [ ] |
| 네이버 블로그 | 연동 확인 | [ ] |

### 분석 도구 설정

| 도구 | 작업 | 완료 |
|------|------|------|
| Google Analytics 4 | 설치 및 목표 설정 | [ ] |
| Naver Analytics | 설치 | [ ] |
| Hotjar/Clarity | 히트맵 설정 (선택) | [ ] |

---

## 5. 정기 모니터링 (월 1회)

- [ ] Google Search Console 성능 보고서 확인
- [ ] Naver Search Advisor 유입 현황 확인
- [ ] AI 검색 노출 상태 재확인
- [ ] 구조화된 데이터 오류 확인

---

## 구현 완료 요약

### 적용된 스키마 (8종)

| 스키마 | 적용 페이지 | 목적 |
|--------|------------|------|
| MedicalBusiness | 전체 | E-E-A-T, 조직 신뢰도 |
| Physician | 의료진 | E-E-A-T, 전문성 |
| FAQPage | 의료정보, 시술 페이지 | 음성검색, AI 답변 |
| MedicalProcedure | 15개 시술 페이지 | AI 커머스 |
| MedicalService | 레이저 5개 페이지 | AI 커머스 |
| HowTo | 시술 페이지 | AI 오버뷰 |
| WebSite | 전역 | 사이트 검색 |
| WebPage | 시술 페이지 | Speakable |

### 음성검색 최적화

| 항목 | 개수 |
|------|------|
| MEDICAL_QA shortAnswer | 17개 |
| TREATMENTS FAQ shortA | 27개 (10개 시술) |
| questionVariants | 17개 질문 변형 |

### 수정된 파일

- `seo.ts`: 8개 스키마 함수
- `constants.ts`: FAQ 음성검색 최적화
- `layout.tsx`: 17개 시술 페이지 + 의료진 + 의료정보
- `ClientSideWidgets.tsx`: SSR 오류 해결

---

## 문의

상세 작업 내역: `SEO_AEO_GEO_WORK.md` 참고
