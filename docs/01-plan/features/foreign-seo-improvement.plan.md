# 외국인 검색 노출 개선 계획서 (다국어 SEO)

> **Feature**: `foreign-seo-improvement`
> **Phase**: Plan
> **Created**: 2026-09-05
> **Owner**: 리브성형외과 마케팅 (jaeho19@gmail.com)
> **진단 근거**: 프로덕션 `liv-clinic.net` 실측(2026-09-05), Google Search Console(2026-06-04 – 09-03, 3개월), 소스코드 점검(master `c4c3593`), 구글 검색 결과 관찰(영어·일본어·번체중문)
> **선행 작업**: `multilingual-expansion.plan.md`(11개 언어), 커밋 `865d82d`(2026-07-08 외국인 유입 종합 개선), `page-speed-optimization.report.md`, `SEO_AEO_GEO_WORK.md`

---

## 0. 한 페이지 요약

**진단 결론**: 홈페이지의 기술적 SEO 뼈대(11개 언어 완역, hreflang, 구조화 데이터, 사이트맵, 페이지별 현지어 메타)는 이미 강남권 클리닉 상위 수준으로 갖춰져 있다. 그런데도 외국인 검색 유입이 하루 1–2명에 그치는 이유는 기술이 아니라 **① 검색될 만한 콘텐츠 부재, ② 사이트 외부 신뢰도(백링크) 0, ③ 그 결과 구글이 외국어 페이지 200여 개를 색인하지 않음**의 세 가지다. 여기에 **④ 페이지 무게(홈 15.8MB)**와 **⑤ 병원명 불일치("LV Plastic Surgery")**가 발목을 잡는다.

핵심 수치 (Search Console, 최근 3개월)

| 지표 | 값 | 해석 |
|---|---|---|
| 구글 검색 클릭 | 388회 (하루 약 4회) | 거의 전부 "리브성형외과" 브랜드 검색 |
| 해외 클릭 | 131회 (34%) | 미국 32 · 일본 27 · 홍콩 17 · 대만 13 · 싱가포르 12 · 캐나다 4 |
| 해외 노출 | 약 7,300회 (전체 49.6K의 15%) | 해외 CTR(1–5%)이 국내(0.6%)보다 높음 → 노출만 늘리면 클릭은 따라옴 |
| 색인 | 266 색인 / 564 미색인 | "발견됐으나 미색인" 144 + "크롤됐으나 미색인" 72 = 외국어 페이지가 주로 탈락 |
| 외부 링크 | 18개 · 5개 도메인 | 전부 한국어 병원 디렉터리, 외국어 링크 0 |
| Core Web Vitals | 실사용 데이터 없음 | 트래픽이 적어 측정 불가. Lighthouse 모바일 성능 59점, 총 전송 15.8MB |

**3단계 로드맵**

| 단계 | 기간 | 내용 | 비용 |
|---|---|---|---|
| P0 기반 정비 | 1–2주 | 기술 결함 13건 수정, 페이지 다이어트(15.8MB → 3MB 이하), 용어·브랜드명 통일, Bing·Yandex 등록, GA4 정비 | 개발 내부 |
| P1 콘텐츠 | 1–2개월 | 외국인 검색 의도별 가이드 20편(영어·일본어·번체), 시술 페이지 외국인 FAQ 블록, 후기·이벤트 페이지 채우기 | 원고·원장 검수 시간, 번역 검수 |
| P2 외부 신뢰도 | 2–6개월 | 디렉터리·플랫폼 등재(코네스트·Creatrip·KKday 등), 제조사 인증병원 등재, GBP 다국어, 일본어·번체 SNS, 언론·크리에이터 | 일부 유료 가능 |

---

## 1. 배경과 목표

### 1.1 배경
- 2026-05 11개 언어로 확장, 2026-07-08 외국인 유입 종합 개선(메타 현지화·JSON-LD·국제환자 허브·후기 시스템) 완료.
- 두 달이 지난 지금 결과: 해외 클릭 월 44회. 홈페이지가 "번역은 되어 있으나 검색되지 않는" 상태.
- 구글에서 일본어·중국어로 검색하면 리브는 존재하지 않고, 영어로는 브랜드명 검색에서만 나타난다.

### 1.2 목표 (6개월)
1. 해외 검색 클릭 월 44회 → 월 400회 이상(약 9배). 해외 노출 월 2,400회 → 20,000회.
2. 비브랜드 외국어 검색어(예: "Ultherapy Seoul price", "韓国 サーマクール 値段")로 클릭이 발생하는 검색어 100개 이상.
3. 사이트맵 385 URL의 색인률 90% 이상.
4. 외국어 리드(라이브챗·예약 폼·메신저) 월 기준선 확정 후 2배. 현재 GA4 소유권 문제로 기준선이 없어 P0에서 먼저 정비한다.

목표치는 제안값이며, P0 완료 후 첫 달 데이터로 재조정한다.

---

## 2. 현황 진단 (2026-09-05 실측)

### 2.1 잘 되어 있는 것 (유지)

| 영역 | 상태 | 근거 |
|---|---|---|
| 언어 커버리지 | 11개 로케일, 번역 키 4,420개 전부 동일 | `src/messages/*.json` 키 수 비교 |
| URL 구조 | `/{locale}/...` 접두사 통일, 페이지마다 자체 canonical | `/en/lifting/ulthera` → canonical 자기 자신 |
| hreflang | 페이지당 12개 태그(11언어 + x-default → `/en`), BCP-47 표기(`zh-Hans-CN`, `zh-Hant-TW`) | `<link rel="alternate" hrefLang>` 12개 확인 |
| 사이트맵 | 385 URL(35페이지 × 11언어), URL마다 alternates 12개 | `/sitemap.xml` |
| 페이지별 메타 | 35페이지 × 11언어 현지어 title/description/keywords | `metaSeo` 네임스페이스 |
| 구조화 데이터 | MedicalBusiness, WebSite, MedicalProcedure, HowTo, BreadcrumbList, MedicalWebPage(inLanguage) | 시술 페이지 JSON-LD 7종 |
| 홈 H1 | 언어별 키워드형 H1 (예: "Premium Non-Surgical Anti-Aging & Lifting Clinic in Gangnam, Seoul") | SSR HTML |
| 외국어 페이지 한국어 잔존 | 0자 | /en, /ja, /zh-TW 본문 한글 0 |
| robots.txt | 검색봇 + AI 크롤러 8종 허용, /admin·/api 차단, `llms.txt` 제공 | `/robots.txt` |
| 검색엔진 등록 | Google Search Console 인증·데이터 정상, 네이버 인증 | GSC 접근 확인 |
| 국제환자 허브 | `/international` 4개 언어 정본, 푸터 링크 | 페이지 확인 |

즉, "hreflang 넣기", "사이트맵 만들기" 같은 흔한 다국어 SEO 조치는 더 할 것이 없다. 남은 것은 결함 수정, 콘텐츠, 외부 신뢰도다.

### 2.2 검색 성과 실태 (Search Console 3개월)

**국가별**

| 국가 | 클릭 | 노출 | CTR |
|---|---|---|---|
| 한국 | 257 | 42,328 | 0.6% |
| 미국 | 32 | 2,779 | 1.2% |
| 일본 | 27 | 816 | 3.3% |
| 홍콩 | 17 | 400 | 4.3% |
| 대만 | 13 | 331 | 3.9% |
| 싱가포르 | 12 | 221 | 5.4% |
| 캐나다 | 4 | 251 | 1.6% |

**해외 유입 상위 페이지**

| 페이지 | 클릭 | 노출 | 시사점 |
|---|---|---|---|
| `/en` | 23 | 2,566 | 브랜드·일반 검색 |
| `/en/lifting/density` | 18 | 556 | 경쟁이 적은 장비명(Density)에서 자연 유입 |
| `/ja/lifting/density` | 11 | 100 | 일본어도 같은 패턴 |
| `/ko/international` | 10 | 914 | 한국어판 국제환자 페이지가 외국어판보다 먼저 노출됨 |
| `/zh-TW/laser/tattoo` | 7 | 153 | 번체 "타투 제거"에서 유입 |

**검색어**: 상위 검색어는 리브성형외과(150클릭)·리브의원·리브 성형·리브(노출 33,286) 등 브랜드 계열이 전부다. 영어 "liv clinic" 3클릭. GSC가 추천으로 띄운 중국어 검색어 "韩国整形美容医院治疗黄褐斑的先进技术"(기미 치료)처럼 산발적인 외국어 롱테일 노출은 있다.

**해석**
- 해외 CTR이 국내보다 3–9배 높다. 외국인은 검색 결과에 리브가 뜨기만 하면 눌러 본다. 문제는 노출 자체가 없다는 것이다.
- 유입이 발생한 곳은 전부 **경쟁이 적은 롱테일**(Density·ONDA 같은 장비명, 타투 제거)이다. 울쎄라·써마지 같은 대형 키워드는 어그리게이터와 대형 클리닉 블로그가 점유하고 있어 정면 승부가 어렵다. 롱테일에서 시작해 권위를 쌓는 순서가 맞다.

### 2.3 구글 검색 결과 관찰 (누가 상위에 있나)

| 시장 | 검색 예 | 상위 노출 유형 | 리브 |
|---|---|---|---|
| 영어 | Ultherapy Thermage clinic Seoul English | 어그리게이터(koreahealthpages, medicaltravelkorea 매거진), 경쟁 클리닉 블로그 가이드(Yaan "Ultherapy South Korea Clinics That Speak English", seoulskin.clinic "Ultherapy vs Thermage in Korea", Forena) | 없음 |
| 영어 브랜드 | "LIV Plastic Surgery" Sinsa | 자사 페이지 + TikTok, 강남언니 글로벌, iCloudHospital, Yeoshin, kosmedi 블로그 | 있음. 그러나 병원명이 **"LV Plastic Surgery"**로 등록된 곳이 다수 |
| 일본어 | 韓国 ウルセラ サーマクール 新沙 日本語対応 | 코네스트(Konest) 클리닉 목록(新沙洞・カロスキル 지역), 강남언니 JP, 경쟁 클리닉의 일본어 전용 인스타(@vands_sinsa.jp, @doctors_jp), minfor 가이드 | 없음 (リブ形成外科 검색도 0건) |
| 번체 중문 | 首爾 抗衰老 醫美診所 推薦 熱瑪吉 | KKday 블로그, Cosmopolitan HK, PressLogic, Threads 게시물, travel-deals.tw | 없음 |

공통점: 검색 결과 1페이지는 **가이드형 콘텐츠**(가격·비교·예약 방법)와 **플랫폼 목록**이 차지한다. 클리닉 홈페이지의 시술 소개 페이지 자체는 거의 상위에 없다.

### 2.4 색인 상태 (GSC 페이지 색인 보고서)

| 사유 | 페이지 수 | 판단 |
|---|---|---|
| 찾을 수 없음(404) | 221 | 옛 워드프레스 URL 등. 목록 검토 후 리다이렉트 필요 |
| 발견됨 – 현재 색인되지 않음 | 144 | 사이트맵으로 알렸으나 구글이 크롤 우선순위를 안 줌 = 사이트 권위 부족·중복성 |
| 크롤됨 – 현재 색인되지 않음 | 72 | 크롤 후 "가치 낮음/중복" 판정. 얇은 외국어 페이지(후기 0건, 이벤트, 갤러리 등)로 추정 |
| 리다이렉트 페이지 | 62 | 정상(`/`, `/gallery` 등) |
| 적절한 canonical이 있는 대체 페이지 | 38 | 정상 |
| noindex 제외 | 25 | 정상(admin 등) |
| 중복(사용자 canonical 미지정 / 구글이 다른 canonical 선택) | 2 | 확인 필요 |

사이트맵 385 URL 중 색인은 266(비사이트맵 포함). **외국어 페이지 200여 개가 색인 밖**에 있다는 뜻이며, 이 상태에서는 어떤 키워드 작업도 효과가 없다. 해결 순서: 얇은 페이지 정리 → 내부 링크 → 외부 링크.

### 2.5 기술 결함 (수정 대상)

| # | 문제 | 근거 | 영향 | 수정 |
|---|---|---|---|---|
| T1 | **hreflang 이중 신호**: next-intl이 붙이는 HTTP `Link` 헤더는 `ko, en, zh, zh-TW…`에 `x-default → /`, HTML 태그는 `ko-KR, zh-Hans-CN…`에 `x-default → /en` | `/en` 응답 헤더 vs `<head>` | 구글이 충돌 시 hreflang을 무시할 수 있음 | `routing.ts`의 `defineRouting`에 `alternateLinks: false` (HTML 태그를 단일 진실 공급원으로) |
| T2 | 이벤트 상세 페이지 hreflang이 4개 언어(`ko/en/ja/zh` bare code), x-default 없음, 트위터 제목 "리브성형외과" 하드코딩 | `events/[eventId]/page.tsx` | 나머지 7개 언어 미연결, 신호 불일치 | `buildHreflangMap` 재사용, `getSiteName(locale)` |
| T3 | **옛 URL** `?lang=en/ja/zh` → `/ko?lang=…`(307). 구글에 아직 `liv-clinic.net/?lang=en`이 색인돼 있음 | curl, `site:` 검색 | 옛 외국어 유입이 한국어 홈으로 떨어짐 | Netlify redirect: `from="/" query={lang="en"} to="/en" status=301` (ja·zh·zh-TW 동일) |
| T4 | `/index.php` → **500 오류** | curl | 옛 URL 크롤 시 서버 오류 누적 | 301 → `/ko` |
| T5 | GSC 404 221건 미처리 | GSC | 크롤 예산 낭비, 옛 링크 가치 소실 | 목록 내려받아 상위 URL 리다이렉트 맵 작성 |
| T6 | 사이트맵 누락: `/antiaging/hilowave`, `/antiaging/hilowave-v2`, `/events/first-visit`, `/events/{slug}`(동적), `/inquiry`, `/consult-prep`. `lastmod`가 매 빌드 현재 시각 | `sitemap.ts` | 발견 지연, lastmod 신뢰도 0 | 누락 추가(이벤트는 DB 조회), lastmod는 실제 수정일 |
| T7 | robots.txt `*` 규칙이 `/_next/`와 `/*.json$` 차단. Googlebot·Bing·Yeti·Baidu는 개별 규칙으로 예외지만 **Yandex(러시아)·Applebot·DuckDuckBot 등은 CSS/JS 차단** | `/robots.txt` | 렌더링 평가 불가 | `/_next/`·`*.json` 차단 삭제(정적 자원을 차단할 이유 없음), `YandexBot` 명시 허용 |
| T8 | **이벤트 목록이 클라이언트 렌더링** → SSR HTML에 이벤트 카드 없음. 외국어 이벤트 설명이 1줄("LIV Plastic Surgery September Promotion") | `/en/events` HTML | 프로모션이 검색에 안 보임 | 서버 컴포넌트 렌더 + 외국어 설명 3–5문장 |
| T9 | **후기 페이지 외국어 0건** (`/api/reviews?locale=en` → `[]`) | API | 빈 페이지 색인 탈락, 신뢰 신호 없음 | 후기 확보 전까지 `noindex` 또는 구글 리뷰 큐레이션 |
| T10 | 언어 전환이 JS(`window.location.assign`) → 크롤 가능한 `<a>` 링크 아님 | `LanguageSwitcher.tsx` | 언어 버전 간 링크 부재(구글 권장 사항 위반) | 푸터에 11개 언어 `<a href>` 목록 |
| T11 | "Learn More" 앵커 22개 | Lighthouse link-text | 링크 문맥 없음 | "Ultherapy Prime 자세히 보기"처럼 시술명 포함 |
| T12 | 단일 OG 이미지(`og-image.jpg`) 전 언어 공통 | HTML | 메신저·SNS 공유 시 현지어 없음 | 언어별 OG 이미지(최소 en/ja/zh-TW) |
| T13 | 루트 `/`가 항상 307 리다이렉트 | curl | GSC에 `/`가 40K 노출로 잡힘(브랜드 결과가 리다이렉트 URL) | 당장은 유지. T1 해결 후 관찰 |

### 2.6 성능: 외국인은 모바일·해외망으로 온다

로컬 Lighthouse(모바일 에뮬레이션, 사내 프록시 경유라 절대값은 참고용) `/en`: 성능 59 · SEO 92 · 접근성 91 · 총 전송 **15.8MB** (이미지 10.5MB, 폰트 2.8MB, 영상 1.3MB, 스크립트 0.9MB).

| # | 원인 | 크기 | 수정 |
|---|---|---|---|
| S1 | 홈 `Doctor.tsx` 국제활동 갤러리가 CSS `backgroundImage`로 **원본 JPG**(3.9MB, 2.5MB)를 로드 | 6.4MB | 1,200px WebP로 사전 리사이즈 또는 `next/image` |
| S2 | `Signature.tsx` 시그니처 카드 PNG 3장(CSS background) | 2.7MB | WebP 변환(각 100KB 이하) |
| S3 | **Pretendard 가변 폰트 2MB preload**. CSS에서 아랍어 폴백에만 사용(`globals.css:716`) | 2.0MB | `/ar` 외 로드 제거(`preload: false` + ar 전용 로드) |
| S4 | 본문 폰트 Paperlogy TTF 3종을 `@font-face`로 미압축·서브셋 없이 로드 | 680KB × 3 (전송 211KB × 3) | woff2 서브셋으로 변환, `next/font/local` |
| S5 | HTML 430KB 중 63–74%가 **전체 번역 JSON(4,420키) RSC 페이로드**. `getMessages()` 전체를 `NextIntlClientProvider`에 전달 | 270KB/페이지 | 클라이언트에 필요한 네임스페이스만 전달(`pick`) |
| S6 | `public/images` 271MB. 21MB PNG(`ultherapy-new.png`)·11MB JPG(`lobby.jpg`) 등 원본 방치 | — | 정적 이미지 일괄 WebP·리사이즈(9/3 Supabase 이미지 마이그레이션과 같은 방식) |

Core Web Vitals 실사용 데이터는 "데이터 부족"이라 현재 순위 요인으로 작동하지 않지만, 일본·대만 모바일 방문자의 이탈(전환)에는 직접 영향을 준다. 목표: 홈 총 전송 3MB 이하, LCP 2.5초 이하(PageSpeed Insights 기준).

### 2.7 브랜드명·용어 불일치

| 언어 | 현재 | 문제 | 권장 정본 |
|---|---|---|---|
| 영어(외부) | 강남언니 글로벌·Yeoshin·iCloudHospital·TikTok = "LV Plastic Surgery" | 브랜드 검색 분산, 지식패널 형성 방해 | "LIV Plastic Surgery" (별칭 LIV Clinic) |
| 일본어 이름 | `meta.title` = リブ形成外科, 페이지 제목 = LIV美容クリニック, 후기 = LIV美容外科, 스키마 = リブ形成外科 | 3–4개 이름 혼용. 일본에서 形成外科는 재건외과 뉘앙스, 검색은 美容皮膚科·美容外科 | 이름 "LIV美容クリニック"(alternateName リブ形成外科), 카테고리어 "美容皮膚科" |
| 일본어 용어 | サーマジ 93회 / **サーマクール 2회** | 일본 검색 수요는 압도적으로 "サーマクール" | 제목·본문에 サーマクール 병기 |
| 일본어 지명 | カロスキル(가로수길) 0회 | 일본인 관광객 최대 랜드마크 | 위치 문구에 "新沙駅·カロスキル" 병기 |
| 번체 중문 | 電波拉提 1회 / 熱瑪吉 19회, 林蔭道 0회, 刺青 0회(紋身 64회) | 대만은 電波拉提·林蔭道·刺青 표현이 일반적 | 병기 |
| 영어 지명 | Garosu-gil 0회 | 관광객 검색어 | "Sinsa Station · Garosu-gil" |

### 2.8 측정 체계

| 도구 | 상태 | 조치 |
|---|---|---|
| Google Search Console | 정상(URL 접두사 속성 `https://liv-clinic.net/`), 사용자 계정 접근 가능 | 월간 국가별 리포트 루틴 |
| GA4 | 홈페이지 태그는 작동하나 **속성 소유권이 사용자 계정에 없음**(관리자 분석 화면 0) | 소유권 이관 → 외국어 리드 전환 측정 |
| Bing Webmaster Tools | 미등록(추정) | GSC 가져오기로 5분 등록. ChatGPT 검색이 Bing 색인을 쓴다 |
| Yandex Webmaster | 미등록 | `ru` 로케일을 유지한다면 등록 |
| Google Business Profile | 존재(`/book` 링크 운용) | 외국어 설명·리뷰·사진 상태 점검 필요(P2-1) |

---

## 3. 시장별 검색 채널 (어디서 검색되는가)

| 시장 | 검색·발견 채널 | 리브 현재 | 우선순위 | 전략 |
|---|---|---|---|---|
| 영어권(미국·싱가포르·캐나다·호주·중동 영어) | Google, Bing/ChatGPT, Reddit·TikTok, 어그리게이터 | 브랜드 검색만 | **1** | 가이드 콘텐츠 + 어그리게이터 등재 + 병원명 통일 |
| 일본 | Google(Yahoo Japan 포함), 코네스트, 강남언니 JP, 인스타·LINE | 없음 | **1** | 일본어 가이드 + 코네스트 등재 + 일본어 인스타·LINE + 용어 교정 |
| 대만·홍콩(번체) | Google, Threads·IG, KKday·Klook, HK 여성지 | 타투 제거만 유입 | **1** | 번체 가이드 + 플랫폼 등재 + 용어 교정 |
| 중국 본토(간체) | 바이두(해외 호스팅·ICP 없이는 사실상 불가), 小红书, 위챗, 大众点评 | 위챗 페이지 있음 | 2 | 검색 SEO는 zh-TW로 대체, 본토는 小红书·위챗 운영(SEO 범위 밖) |
| 베트남·태국·몽골 | Google, Facebook | 페이지만 있음 | 3 | 자동 유지, 별도 투자 없음 |
| 러시아 | Yandex, Google | 페이지만 있음 | 3 | Yandex 등록만 |
| 프랑스·아랍 | Google | 페이지만 있음 | 3 | 자동 유지 |

**가정**: 1순위 3개 시장(영어·일본어·번체)에 콘텐츠·외부 활동을 집중하고, 나머지 8개 언어는 현재 번역 수준을 유지한다. 근거는 GSC 해외 클릭 상위 국가(미국·일본·홍콩·대만·싱가포르), 2024년 한국 방문 외국인 환자 국적(일본 44만·중국 26만·미국 10만·대만 8만), 그리고 상담 채널(라이브챗·LINE·WhatsApp·WeChat) 운영 가능성이다.

---

## 4. 전략 방향

1. **"번역된 사이트"에서 "그 언어로 검색될 이유가 있는 사이트"로.** 외국인은 병원 이름이 아니라 "Ultherapy Seoul price", "韓国 サーマクール 値段", "首爾 音波拉提 價格"처럼 시술 + 도시 + 가격/방법으로 검색한다. 이런 검색 의도에 정확히 답하는 페이지가 지금은 한 장도 없다.
2. **롱테일과 장비명에서 시작한다.** Density·ONDA·타투 제거처럼 경쟁이 적은 곳에서 이미 유입이 나오고 있다. 울쎄라·써마지 대형 키워드는 권위가 쌓인 뒤 도전한다.
3. **사이트 밖에서 신뢰를 쌓아 안으로 끌어온다.** 외부 링크 5개 도메인으로는 어떤 외국어 페이지도 색인·상위 노출이 어렵다. 디렉터리·플랫폼·제조사 인증·언론·SNS가 검색 순위의 절반이다.
4. **의료광고 규정 안에서.** 가이드 콘텐츠는 정보 제공형(가격 범위·절차·회복)으로 쓰고, 최상급·보장·비교·환자 유인 표현을 쓰지 않는다. 후기 노출은 법무 확인 후 진행한다.

---

## 5. 개선 과제

### P0. 기반 정비 (1–2주, 개발 내부)

| ID | 과제 | 방법 | 기대 효과 | 공수 |
|---|---|---|---|---|
| P0-1 | hreflang 단일화 (T1, T2) | `alternateLinks: false`, 이벤트 상세 `buildHreflangMap` | 언어 버전 매핑 신뢰도 회복 | 0.5일 |
| P0-2 | 옛 URL 리다이렉트 (T3, T4, T5) | `?lang=` 4종 301, `/index.php` 301, GSC 404 상위 URL 맵 | 옛 외국어 유입 회수, 404 221건 감소 | 1일 |
| P0-3 | 사이트맵 보강 (T6) | 누락 7종 + 이벤트 동적 + 실제 lastmod | 발견 지연 해소 | 0.5일 |
| P0-4 | robots.txt 정리 (T7) | `/_next/`·`*.json` 차단 삭제, YandexBot 추가 | 모든 봇 렌더 가능 | 0.2일 |
| P0-5 | 페이지 다이어트 (S1–S6) | 원본 이미지 WebP 리사이즈, Pretendard 제거(ar 제외), Paperlogy woff2, 메시지 pick | 홈 15.8MB → 3MB 이하 | 2일 |
| P0-6 | 얇은 페이지 처리 (T8, T9) | 이벤트 SSR + 외국어 설명, 후기 0건 로케일 noindex | "크롤됨 – 미색인" 72건 감소 | 1일 |
| P0-7 | 언어 링크·앵커 (T10, T11) | 푸터 11개 언어 `<a>`, "Learn More" → 시술명 앵커 | 내부 링크 신호 | 0.5일 |
| P0-8 | 용어·브랜드명 교정 (§2.7) | ja: サーマクール·カロスキル·美容皮膚科·이름 통일 / zh-TW: 電波拉提·林蔭道·刺青 / en: Garosu-gil | 실제 검색어와 일치 | 1일 (번역 검수 포함) |
| P0-9 | 측정 정비 | Bing Webmaster(GSC 가져오기), Yandex, GA4 소유권 이관 요청, GSC 국가별 월간 리포트 템플릿 | 이후 모든 판단의 기준선 | 0.5일 + 대기 |
| P0-10 | 외부 플랫폼 병원명 수정 | 강남언니 글로벌·Yeoshin·iCloudHospital "LV" → "LIV", GBP 영문명 확인 | 브랜드 신호 통합 | 운영 0.5일 |

### P1. 콘텐츠 (1–2개월)

**P1-1 외국인 가이드 허브** — `/{locale}/guides/{slug}` (en·ja·zh-TW 3개 언어만, 서버 렌더, 원장 명의·검수일 표기, FAQ 스키마).

작성 원칙: 1편 1,200–2,000자. 실제 가격 범위(원화 + 참고 환산)·소요 시간·회복·여행 일정에 답한다. 자동 번역 대량 생성 금지(구글 스팸 정책과 품질 문제). 언어별 원어민 검수 1회.

| # | 언어 | 주제(검색 의도) | 겨냥 검색어 예 |
|---|---|---|---|
| 1 | en | Ultherapy in Korea: 2026 price guide & what's included | ultherapy korea price, ultherapy seoul cost |
| 2 | en | Ultherapy vs Thermage vs Shurink: a Korean doctor's comparison | ultherapy vs thermage korea |
| 3 | en | How to book a skin clinic in Seoul as a foreigner (no agency) | seoul skin clinic foreigner booking |
| 4 | en | Rejuran & skin boosters in Seoul: timing before your flight | rejuran seoul price foreigner |
| 5 | en | Botox & filler in Seoul: brands, prices, same price for foreigners | botox seoul price foreigner |
| 6 | en | Tattoo removal in Seoul with pico laser: sessions & cost | tattoo removal seoul cost |
| 7 | en | Sinsa & Garosu-gil clinic guide: what to do around your appointment | garosu-gil skin clinic |
| 8 | en | Can I fly after Ultherapy? Aftercare timeline for travelers | ultherapy aftercare flight |
| 9 | ja | 韓国でウルセラを受ける前に：値段相場・ショット数・正規品の見分け方 | 韓国 ウルセラ 値段 |
| 10 | ja | サーマクールFLXの韓国相場と日本との違い | 韓国 サーマクール 料金 |
| 11 | ja | 新沙・カロスキルで日本語対応の美容皮膚科を探す方法 | 新沙 美容皮膚科 日本語 |
| 12 | ja | 1泊2日・2泊3日 美容医療旅行モデルプラン | 韓国 美容医療 旅行 プラン |
| 13 | ja | リジュラン・スキンブースターの韓国価格と注意点 | 韓国 リジュラン 値段 |
| 14 | ja | 韓国のボトックス（アラガン・ゼオミン）値段と選び方 | 韓国 ボトックス 値段 |
| 15 | ja | 施術後の飛行機搭乗とダウンタイム目安 | ウルセラ ダウンタイム 飛行機 |
| 16 | zh-TW | 韓國音波拉提(Ultherapy)價格與行程規劃 | 韓國 音波拉提 價格 |
| 17 | zh-TW | 韓國電波拉提 Thermage FLX 價格 vs 台灣 | 韓國 電波拉提 價格 |
| 18 | zh-TW | 首爾江南醫美診所 中文預約教學（LINE/WeChat/WhatsApp） | 首爾 醫美 中文 預約 |
| 19 | zh-TW | 首爾皮秒雷射除刺青：療程次數與費用 | 首爾 除刺青 |
| 20 | zh-TW | 外國人同價·付款·發票：韓國醫美費用 Q&A | 韓國 醫美 外國人 價格 |

**P1-2 시술 페이지 외국인 블록** — 16개 시술 페이지(en·ja·zh-TW)에 "외국인 안내" 섹션: 외국인 동일 가격, 소요 시간, 회복·비행 가능 시점, 통역, 결제 수단, 예약 링크. FAQ 스키마에 포함.

**P1-3 가격 페이지 강화** — `/pricing`이 이미 노출(한국어 1,352회)되는 만큼 외국어판에 "동일 가격·부가세 포함·카드 결제" 명시. 대표 시술은 원화 + 참고 환산(USD/JPY/TWD, 환율 기준일 표기).

**P1-4 후기 채우기** — 후기 시스템은 있으나 외국어 0건. (a) 구글 리뷰·강남언니 외국어 후기를 동의 받아 큐레이션, (b) 시술 후 외국어 후기 요청 카드(QR, 기존 후기 안내 문서 활용), (c) 3건 이상 확보 시 AggregateRating 자동 활성(이미 구현). 의료법상 치료경험담 게시 범위는 법무 확인.

**P1-5 이벤트·프로모션** — 외국어 이벤트 설명 3–5문장(대상·기간·조건), 서버 렌더, 사이트맵 포함. 이벤트는 "price"·"promotion" 검색 의도와 맞아 유입 페이지가 된다.

**P1-6 언어별 OG 이미지** — en·ja·zh-TW 3종(브랜드 + 한 줄 카피).

### P2. 외부 신뢰도 (2–6개월)

| ID | 과제 | 내용 |
|---|---|---|
| P2-1 | Google Business Profile 다국어 | 영어·일본어·중문 설명, 외국어 리뷰 요청(QR), 시술 사진, 예약 링크 `/book`, "English/日本語 OK" 속성. 외국인의 "clinic near me"·지도 검색은 GBP가 전부다 |
| P2-2 | 플랫폼·디렉터리 등재 | 코네스트(일본), Creatrip(영·일·중), 강남언니 글로벌·JP(이름 수정 포함), Yeoshin, iCloudHospital, KKday·Klook·Trip.com 뷰티 체험 상품, Medical Korea(KHIDI, 외국인환자 유치기관 등록 필요), 서울의료관광 |
| P2-3 | 제조사 공식 인증병원 페이지 | 울쎄라피(Merz)·써마지(Solta)·APTOS(공식 트레이너)·리쥬란·쥬베룩 공식 사이트의 인증 병원 목록에 등재·링크 요청 |
| P2-4 | 일본어·번체 SNS | 일본어 인스타그램 + LINE 공식계정(경쟁 클리닉 @vands_sinsa.jp 방식), 번체 Threads·인스타. 게시물마다 가이드 링크 |
| P2-5 | 유튜브 다국어 | 기존 채널 영상에 en·ja·zh 자막·제목·설명, 가이드와 상호 링크 |
| P2-6 | 언론·크리에이터 | 일본·대만 뷰티 미디어(minfor, PressLogic, Cosmopolitan HK 류) 기고·협찬 취재, 미국·싱가포르 TikTok 크리에이터 방문(이미 자발적 후기 존재) |
| P2-7 | 학술·전문성 링크 | 원장 SCI 논문 → ORCID·Google Scholar·ResearchGate 프로필에 병원 URL, 학회 회원 페이지 |
| P2-8 | 월간 리포트 | GSC 국가별 클릭·노출·검색어, 색인률, 외부 링크 도메인 수, 외국어 리드. 매월 첫째 주 |

목표 링크 도메인: 6개월 내 30개(현재 5개), 그중 외국어 도메인 15개 이상.

---

## 6. 일정

| 주차 | 개발 | 콘텐츠 | 운영·외부 |
|---|---|---|---|
| 1–2주 | P0-1 – P0-7 (기술·성능) | P0-8 용어 교정 검수 | P0-9 측정 등록, P0-10 플랫폼 이름 수정 |
| 3–4주 | 가이드 허브 템플릿, FAQ 스키마 | 가이드 1–6편(en) | GBP 다국어(P2-1) |
| 5–8주 | 시술 페이지 외국인 블록, 가격 페이지 | 가이드 7–15편(en·ja), 이벤트 설명, OG 이미지 | 코네스트·Creatrip·강남언니(P2-2), 제조사(P2-3) |
| 9–12주 | 후기 큐레이션 UI | 가이드 16–20편(zh-TW) | 일본어 인스타·LINE 개설(P2-4), 유튜브 자막(P2-5) |
| 4–6개월 | GSC 데이터 기반 리라이트 | 성과 상위 주제 심화 2차 10편 | 언론·크리에이터(P2-6), 월간 리포트 지속 |

---

## 7. KPI (제안)

| 지표 | 현재(월 환산) | 3개월 | 6개월 | 측정 |
|---|---|---|---|---|
| 해외 클릭 | 44 | 150 | 400 | GSC, 국가 ≠ 한국 |
| 해외 노출 | 2,400 | 8,000 | 20,000 | GSC |
| 클릭 발생 비브랜드 외국어 검색어 | 소수 | 30 | 100 | GSC 검색어 |
| 색인 페이지 / 사이트맵 | 266 / 385 | 330 | 400 이상(가이드 포함) | GSC 페이지 색인 |
| 외부 링크 도메인 | 5 | 15 | 30 | GSC 링크 |
| 홈 총 전송량(모바일) | 15.8MB | 3MB | 2MB | PageSpeed Insights |
| 외국어 리드(챗·폼·메신저) | 기준선 미확정 | 기준선 × 1.5 | × 2 | GA4(소유권 이관 후) |

---

## 8. 리스크와 주의

- **의료광고**: 외국어 페이지도 의료법 제56조 적용. 최상급·보장·비교·환자 유인(할인 강조) 표현 금지. 가이드는 정보 제공형으로. 후기(치료경험담) 노출 범위는 법무 확인 후.
- **외국인환자 유치**: 유치 활동을 본격화하려면 외국인환자 유치 의료기관 등록 여부 확인(의료해외진출법). Medical Korea 등재 조건이기도 하다.
- **자동 생성 콘텐츠**: 11개 언어 전부에 가이드를 기계 번역으로 뿌리면 구글의 대량 생성 콘텐츠 정책에 걸릴 수 있다 → 3개 언어, 사람 검수.
- **운영 부담**: 일본어 인스타·LINE은 응대 인력이 전제. 기존 라이브챗(자동 번역)·메신저 체계와 역할 분담 필요.
- **측정 공백**: GA4 소유권 이관 전에는 리드 기준선을 만들 수 없다. 임시로 채팅 세션·폼 제출 DB 카운트 사용.
- **리다이렉트 변경**: 루트 `/` 리다이렉트 방식 변경은 브랜드 검색 결과 변동 위험 → 이번 범위에서 제외.

---

## 9. 확인이 필요한 사항 (가정 목록)

| # | 가정 | 확인자 |
|---|---|---|
| A1 | 1순위 시장 = 영어·일본·대만/홍콩 | 마케팅 |
| A2 | 가이드 원고 작성·원장 검수 시간 확보(주 2–3편) | 원장 |
| A3 | 번역 원어민 검수 예산(3개 언어 × 약 20편) | 마케팅 |
| A4 | GA4 실제 속성 소유자(대행사?)와 이관 가능 여부 | 마케팅 |
| A5 | Google Business Profile 관리 계정과 현재 언어·리뷰 상태 | 운영 |
| A6 | 외국인환자 유치 의료기관 등록 상태 | 원장·행정 |
| A7 | 홈페이지 후기(치료경험담) 게시 가능 범위 | 법무 |
| A8 | 플랫폼 유료 등재(KKday·Klook·코네스트 광고) 예산 | 마케팅 |
| A9 | `ru`·`vi`·`th`·`mn`·`fr`·`ar` 로케일 유지 여부(유지 시 사이트맵·색인 부담 지속) | 마케팅 |

---

## 부록 A. 실측 기록 (2026-09-05)

| 항목 | 명령·경로 | 결과 |
|---|---|---|
| 루트 리다이렉트 | `curl -I https://liv-clinic.net/` | 307 → `/ko` (Accept-Language: ja → `/ja`) |
| www | `curl -I https://www.liv-clinic.net/` | 301 → non-www |
| 옛 URL | `/?lang=en` `/?lang=ja` `/?lang=zh` | 307 → `/ko?lang=…` |
| 옛 URL | `/index.php` | 500 |
| hreflang | `/en` `<head>` | 12개, x-default → `/en` |
| Link 헤더 | `/en` 응답 헤더 | hreflang `ko, en, … x-default → /` |
| 사이트맵 | `/sitemap.xml` | 385 URL, alternates 4,620개 |
| HTML 크기 | `/en` 430KB(RSC 63%), `/ja` 340KB, `/en/lifting/ulthera` 364KB(RSC 74%) | |
| 본문 분량 | `/en` 1,262단어, `/ja` 4,706자, `/en/lifting/ulthera` 835단어, `/en/reviews` 164단어 | |
| 후기 API | `/api/reviews?locale=en` | `[]` |
| 이벤트 API | `/api/events?locale=en` | 9월 프로모션 1건(설명 1줄) |
| Lighthouse | `npx lighthouse https://liv-clinic.net/en` (모바일) | 성능 59·SEO 92·접근성 91, 15.8MB, 요청 110개 |
| PageSpeed Insights API | 익명 호출 | 일일 할당량 초과(429) → 웹 UI로 재측정 필요 |
| GSC | Search Console 3개월 | §2.2, §2.4 |

## 부록 B. 언어별 키워드 후보

| 시술·주제 | 영어 | 일본어 | 번체 중문(대만·홍콩) |
|---|---|---|---|
| 울쎄라 | ultherapy korea price · ultherapy seoul · ultherapy prime korea | 韓国 ウルセラ 値段 · ウルセラ 韓国 おすすめ · ウルセラプライム 韓国 | 韓國 音波拉提 價格 · 首爾 音波拉提 推薦 · 韓國 Ultherapy |
| 써마지 | thermage flx korea price · thermage seoul | 韓国 サーマクール 料金 · サーマクールFLX 韓国 | 韓國 電波拉提 價格 · 首爾 熱瑪吉 |
| 슈링크·HIFU | hifu seoul price · shurink korea | 韓国 シュリンク 値段 · 韓国 ハイフ 安い | 韓國 HIFU 價格 · 首爾 音波 便宜 |
| 리쥬란·스킨부스터 | rejuran seoul · skin booster korea price · juvelook korea | 韓国 リジュラン 値段 · 韓国 スキンブースター | 韓國 麗珠蘭 價格 · 首爾 水光針 |
| 보톡스·필러 | botox seoul price · filler korea cost | 韓国 ボトックス 値段 · 韓国 ヒアルロン酸 安い | 韓國 肉毒 價格 · 首爾 玻尿酸 |
| 레이저 | pico laser seoul · tattoo removal seoul · laser hair removal seoul foreigner | 韓国 ピコレーザー · 韓国 タトゥー除去 · 韓国 医療脱毛 | 首爾 皮秒 · 首爾 除刺青 · 韓國 除毛 |
| 지역·일반 | skin clinic seoul english · gangnam dermatology foreigner · garosu-gil clinic · sinsa skin clinic | 新沙 美容皮膚科 日本語 · カロスキル 皮膚科 · 江南 美容クリニック 日本語対応 · 韓国 美容皮膚科 通訳 | 首爾 醫美 中文 · 江南 皮膚科 中文 · 林蔭道 醫美 · 韓國 醫美 外國人 |
| 여행·절차 | seoul skin clinic booking foreigner · korea medical tourism skin · same price foreigners korea clinic | 韓国 美容医療 旅行 プラン · 韓国 美容皮膚科 予約 方法 · 施術後 飛行機 | 韓國 醫美 行程 · 首爾 醫美 預約 教學 · 醫美 後 搭飛機 |

검색량 수치는 이 문서에 넣지 않았다. Google Keyword Planner(광고 계정) 또는 GSC 노출 데이터로 P1 착수 시 확정한다.

## 부록 C. 참고 링크 (관찰한 경쟁·채널)

- 영어 어그리게이터: https://www.koreahealthpages.com/ulthera · https://medicaltravelkorea.com/en/magazine/100/Top-15-Skin-Clinics-in-Korea-for-Foreigners-2026-Guide
- 영어 경쟁 클리닉 가이드: https://enyaanclinic.com/trend/ultherapy-south-korea-english-kr/ · https://www.seoulskin.clinic/blog/ultherapy-vs-thermage-in-korea · https://www.forenaclinic.com/
- 리브 외부 등록(이름 수정 대상): https://www.gangnamunni.com/us/hospitals/4150 · https://www.yeoshin.co.kr/en/hospitals/4667 · https://icloudhospital.com/hospitals/lv-plastic-surgery-clinic-gangnam-district-seoul
- 리브 언급 블로그: https://kosmedi.co.kr/liv-plastic-surgery-korea-powerful-insider-guide/
- 일본어 채널: https://www.konest.com/contents/clinic_mise_search.html?sa=87 (新沙洞・カロスキル) · https://www.gangnamunni.com/jp/ · https://minfor.jp/beauty/5966/ · https://www.instagram.com/vands_sinsa.jp/
- 번체 채널: https://www.kkday.com/zh-hk/blog/114165/korea-aesthetic-clinic-top-9 · https://www.cosmopolitan.com.hk/beauty/korea-seoul-skin-clinic-recommendations
