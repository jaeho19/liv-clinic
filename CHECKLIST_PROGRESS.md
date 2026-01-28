# 배포 후 체크리스트 진행 상황

> 마지막 업데이트: 2026-01-28
> 배포 URL: https://liv-clinic-jaeho19.netlify.app

---

## 0. 다국어 SEO 최적화 ✅ 완료

### 작업 내용 (2026-01-28)

| 항목 | 개선 내용 | 대상 언어 |
|------|----------|----------|
| **seoConfig 키워드 확장** | 각 언어별 검색 키워드 대폭 확장 | ko, en, ja, zh |
| **LocalBusiness 다국어** | description, alternateName 다국어 지원 | ko, en, ja, zh |
| **knowsAbout 다국어** | 전문 분야 키워드 4개 언어 추가 | ko, en, ja, zh |
| **availableService 다국어** | 시술명 alternateName 다국어 추가 | ko, en, ja, zh |
| **LocalBusiness locale 연동** | 레이아웃에서 locale 파라미터 전달 | ko, en, ja, zh |
| **sitemap.xml 확장** | 레이저 카테고리 페이지 추가 | 전체 |
| **robots.txt 최적화** | Bing bot 추가 (영어/일본어 검색) | 전체 |

### 주요 키워드 (언어별)

**한국어**:
- 지역: 신사역, 강남, 서울, 압구정
- 시술: 울쎄라피, 써마지, 실리프팅, 보톡스, 필러, 스킨부스터
- 검색: 가격, 효과, 병원 추천

**English**:
- Location: Seoul, Gangnam, Sinsa, Korea
- Treatment: Ultherapy Prime, Thermage FLX, thread lift, Botox, filler
- Search: cost, before after, best clinic, medical tourism

**日本語**:
- 地域: ソウル, 江南, 新沙, 韓国
- 施術: ウルセラ, サーマジ, 糸リフト, ボトックス, フィラー
- 検索: 料金, 効果, 韓国美容, Kビューティー

**中文**:
- 地区: 首尔, 江南, 新沙, 韩国
- 项目: 超声刀, 热玛吉, 埋线, 肉毒素, 玻尿酸
- 搜索: 价格, 效果, 医疗旅游, K美容

---

## 1. 구조화된 데이터 테스트 ✅ 완료

### Google Rich Results Test 결과

| 페이지 | URL | 결과 | 비고 |
|--------|-----|------|------|
| 홈페이지 | `/ko` | ✅ 2 valid | Local businesses, Organization |
| 의료진 | `/ko/about/staff` | ✅ 수정 완료 | 재테스트 필요 (배포 후) |
| 의료정보 Q&A | `/ko/medical` | ✅ 수정 완료 | 재테스트 필요 (배포 후) |
| 울쎄라피 | `/ko/lifting/ulthera` | ✅ 3 valid | Breadcrumbs, Local businesses, Organization |
| 써마지 | `/ko/lifting/thermage` | ✅ 3 valid | Breadcrumbs, Local businesses, Organization |
| 보톡스 | `/ko/antiaging/botox` | ✅ 3 valid | Breadcrumbs, Local businesses, Organization |
| 레이저 색소 | `/ko/laser/pigmentation` | ✅ 3 valid | Breadcrumbs, Local businesses, Organization |

### 수정된 파일 (커밋 완료: 73c4958)

| 파일 | 수정 내용 |
|------|----------|
| `src/lib/seo.ts` | Physician 스키마에 address 추가, WebPage에 mainEntity 지원 |
| `src/app/[locale]/about/staff/layout.tsx` | 천형준→천신혜, ProfilePage mainEntity 추가 |
| `src/app/[locale]/medical/layout.tsx` | FAQPage 중복 제거 (WebPage로 변경) |

### 재테스트 링크 (배포 완료 후)

- [의료진 페이지](https://search.google.com/test/rich-results?url=https%3A%2F%2Fliv-clinic-jaeho19.netlify.app%2Fko%2Fabout%2Fstaff)
- [의료정보 Q&A](https://search.google.com/test/rich-results?url=https%3A%2F%2Fliv-clinic-jaeho19.netlify.app%2Fko%2Fmedical)

---

## 2. AI 검색 노출 테스트 ⏸️ 대기

> 사이트가 신규이므로 색인 후 테스트 권장 (1-2주 후)

### ChatGPT 테스트

| 검색어 | 노출 여부 | 비고 |
|--------|----------|------|
| "신사역 리프팅 잘하는 곳" | [ ] | |
| "울쎄라 써마지 차이" | [ ] | |
| "강남 비수술 리프팅 병원" | [ ] | |
| "리브성형외과" | [ ] | |

### Perplexity AI 테스트

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

## 3. 검색엔진 등록 ⏳ 진행 예정

### Google Search Console

**URL**: https://search.google.com/search-console

| 작업 | 완료 |
|------|------|
| 사이트 소유권 확인 | [ ] |
| sitemap.xml 제출 (`https://liv-clinic-jaeho19.netlify.app/sitemap.xml`) | [ ] |
| 주요 페이지 색인 요청 | [ ] |
| 구조화된 데이터 보고서 확인 | [ ] |
| 리치 결과 상태 모니터링 | [ ] |

**색인 요청 권장 페이지**:
- `/ko` (홈)
- `/ko/about/staff` (의료진)
- `/ko/lifting/ulthera` (울쎄라피)
- `/ko/lifting/thermage` (써마지)
- `/ko/medical` (의료정보 Q&A)

### Naver Search Advisor

**URL**: https://searchadvisor.naver.com/

| 작업 | 완료 |
|------|------|
| 사이트 소유권 확인 | [ ] |
| sitemap.xml 제출 | [ ] |
| 웹페이지 수집 요청 | [ ] |
| 콘텐츠 진단 확인 | [ ] |

---

## 4. 추가 최적화 (선택) ⏳ 진행 예정

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

## 5. 정기 모니터링 (월 1회) ⏳

- [ ] Google Search Console 성능 보고서 확인
- [ ] Naver Search Advisor 유입 현황 확인
- [ ] AI 검색 노출 상태 재확인
- [ ] 구조화된 데이터 오류 확인

---

## 참고 자료

- **원본 체크리스트**: `POST_DEPLOYMENT_CHECKLIST.md`
- **SEO 작업 내역**: `SEO_AEO_GEO_WORK.md` (있을 경우)
- **프로젝트 가이드**: `CLAUDE.md`

---

## 다음 세션에서 할 일

1. **Google Search Console 등록**
   - 소유권 확인 코드 받기
   - sitemap.xml 제출
   - 색인 요청

2. **Naver Search Advisor 등록**
   - 소유권 확인
   - sitemap 제출
   - 수집 요청

3. **의료진/의료정보 페이지 재테스트**
   - 배포 완료 후 Rich Results 재확인

4. **(선택) 분석 도구 설정**
   - GA4, Naver Analytics 등
