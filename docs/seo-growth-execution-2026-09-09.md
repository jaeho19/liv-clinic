# LIV SEO·GEO 실행 기록 — 1차 기술 개선과 측정 기준값

실행일: 2026-09-09 · 대상: https://liv-clinic.net

[12주 실행 계획](seo-geo-growth-plan-2026-09.md)의 첫 실행 기록이다. 기술 작업, 검색엔진의 처리 상태, 관측 성과를 구분한다. 4·8·12주 성과 검증은 해당 기간이 지난 후 수행하며 이번 배포의 완료로 대체하지 않는다.

## 1. 이번 수정과 검증

| 항목 | 확인한 원인과 조치 | 검증 |
| --- | --- | --- |
| IndexNow preview 격리 | 기존 NODE_ENV 조건은 production 모드로 빌드되는 preview/branch도 통과했다. 빌드에 고정된 환경 판별을 재사용해 SSR/ISR에서도 차단하고 force로 우회하지 못하게 했다. | 실제 전송 없는 모의 회귀. 운영 전송·개발 수동 옵션은 유지 |
| 페이지별 분석 | 스크롤 임계값·체류 타이머가 경로 변경 때 초기화되지 않았고, setup ref가 cleanup 이후 재설치를 막았다. 경로마다 설치/정리를 대응시켰다. | 이동 전후 스크롤·타이머, 재설치, 늦은 gtag 정의, cleanup 회귀 |
| 초기 페이지뷰 | 첫 렌더 여부만 보는 ref 대신 직전 경로와 비교해 effect 재실행이 초기 페이지뷰를 추가하지 않게 했다. enabled=false도 반영했다. | 최초 config 1회와 실제 SPA 경로 이동별 config 관측. 실제 GA4 스트림의 자동 history 중복 여부는 별도 미확인 |
| 전화 클릭 | React onClick과 document 클릭 핸들러가 같은 전화 링크를 각각 집계했다. 명시적으로 추적하는 링크에 표시를 추가해 자동 핸들러에서 제외했다. | 명시적 링크 1회·미지정 전화 링크 1회. 실제 전화 연결 없이 모의 검증 |
| 외부 링크 이벤트 | mailto와 외부 링크의 query/fragment가 event_label에 들어갈 수 있었다. HTTP(S) 외부 링크의 origin/path만 기록한다. | 메일 본문·주소, query/fragment 제외 회귀 |
| 홈 포스터 | video 전체가 투명해 로딩 전 poster도 보이지 않았다. 기존 사진을 독립적인 반응형 Image로 먼저 표시하고 영상은 기존 방식으로 그 위에 재생한다. | 정상 영상 재생·의도적 영상 실패, 390/320px 화면 확인. 모바일 영상과 기존 문구 유지 |

홈 페이지에 별도로 남아 있던 원본 JPG preload도 제거해 Image가 생성하는 반응형 preload만 사용한다. 이 후속 변경 후 프로덕션 빌드와 lint를 다시 통과했다.

분석 스크립트 자체는 head의 동기 gtag 큐를 사용한다. 따라서 외부 gtag.js 지연만으로 기존 핸들러가 항상 누락됐다고 단정하지 않는다. 실제 수정 근거는 경로 변경/cleanup 문제와 이중 전화 집계다. 페이지 체류 이벤트는 기존처럼 타이머 시점의 문서 가시성을 확인하며, 누적 활성 체류시간 지표라고 부르지 않는다.

검증 결과: lint 오류 **0·경고 71**, 기존 테스트 **560개**, 추가 회귀 **14개**, 타입 검사와 프로덕션 빌드 통과. 로컬 HTTP 주요 **142개**, sitemap **594개**, 내부 목적지 **613개**, 초기 HTML FAQ **460개** 검사 통과. 가격 **11개 언어 전체 본문과 description 동일**.

남은 경고는 미사용 선언 56개, 일반 img 13개, hook 의존성 2개로 이전과 동일하다. 이번 변경에서 경고를 추가하거나 규칙을 끄지 않았다. 기능 위험이 없는 범용 정리를 이번 배포에 섞지 않는다.

미사용 선언은 유지보수 정리 대상, 일반 img는 이미지 전송량·크기 예약 검토 대상이다. hook 경고는 관리자 이벤트 목록의 fetchEvents와 써마지 heroLabels.length 의존성으로, 데이터 갱신 및 슬라이드 전환 조건이 영향을 받을 수 있어 A12에서 별도 검토한다. 현재 오류가 없다는 이유로 이 경고들을 해결 완료로 표시하지 않는다.

로컬 첫 전체 검사에서는 이벤트 상세의 index/canonical 검사가 실패했다. 실행 프로세스의 SELF_SIGNED_CERT_IN_CHAIN이 원인이었으며 해당 프로세스에 --use-system-ca를 적용한 뒤 전체 검사를 다시 통과했다. TLS 검증을 끄지 않았다. 분석 관측용 임시 프록시의 문자열 치환이 RSC 직렬화를 손상시킨 오류도 검증기에서 고쳤으며 앱 오류로 집계하지 않는다. 최종 검증은 수정된 프록시와 직접 HTTP 요청을 구분해 기록한다.

HTML을 수정하지 않는 별도 프록시에서도 영어 가격 → 일본어 가격 이동과 canonical 변경을 확인했다. 이후 일본어 본문·lang이 한국어로 바뀐 현상은 Chrome이 추가한 translated-ltr 클래스와 font 요소로 자동 번역 개입을 확인했다. 서버의 일본어 HTML·가격 본문 검사는 통과했고 이 과정에서 hydration 오류는 관측되지 않았다. 사용자 브라우저 번역 설정이나 사이트 번역 문구는 변경하지 않았다. 외부 스크립트를 차단한 프록시의 네이버 지도 로딩 오류는 실제 운영 지도 장애 여부를 판정하는 근거로 쓰지 않는다.

첫 preview의 /ko 초기 로딩에서 2026-09-09 07:56:07 UTC에 React #418 한 건을 기록했다. 따라서 이전 보고서의 개발 모드 잔여 위험에만 한정할 수 없다. 동일 배포 재방문과 새 탭에서는 영상 재생·언어 메뉴 동작·main/H1 각 1개를 확인했고 추가 #418은 없었다. 이전 개발 모드 상세 오류는 Header 다음 main/Suspense 경계 차이였으며, 이번 한 건도 특정 앱 코드나 Chrome 번역 때문이라고 확정할 증거는 없다. 원인을 입증하지 못한 SSR 비활성화·경고 억제·대규모 의존성 변경은 적용하지 않는다. 최종 preview와 운영의 추가 관측 결과를 배포 절에 기록한다.

## 2. 실제 검색·AI 기준값

| 출처·기간 | 확인 결과 | 해석 |
| --- | --- | --- |
| GSC Web, 2026-08-10~09-06 | 클릭 161, 노출 18,254, CTR 표시 0.9%, 평균 위치 6.3 | 이번 배포 이전 기준값이며 개선 효과로 귀속하지 않음 |
| GSC Web, 2026-07-13~08-09 | 클릭 129, 노출 15,059, CTR 표시 0.9%, 평균 위치 7.0 | 이전 28일 비교. 브랜드·동명이인 검색이 포함됨 |
| GSC Web, 2026-06-07~09-06 | 클릭 395, 노출 50,406 | 화면의 3개월 범위. 임의로 정확히 90일이라고 재표기하지 않음 |
| GSC 28일 검색어 표 | 공개 검색어 157개, 그 행의 클릭 합계 82, 보수적 비브랜드 분류 클릭 8 | 전체 161에서 나머지 79는 검색어별 분류 불가. 모두 비브랜드로 계산하지 않음 |
| Google 생성형 AI, 2026-08-10~09-06 | 노출 865 | 일반 Web 범위와 중복되므로 합산하지 않음. 클릭·상담·ChatGPT 인용 수가 아님 |
| Google 생성형 AI, 2026-06-07~09-06 | 노출 1,953 | Pages·Countries·Devices 원본 보관 |
| Bing Search, 2026-06-09~09-08 화면 | 클릭 4, 노출 357 | Google과 기간·집계 범위가 다름 |
| Bing AI, 동일 3개월 화면 | 총 인용 9건, 인용 URL 5개 | Microsoft Copilots and Partners 범위. grounding query 표는 데이터 미제공 |
| GSC 색인, 보고서 갱신 2026-09-04 | 색인 288, 미색인 570 | 9월 9일 배포 후 결과가 아님. 전체 알려진 URL 858개와 현재 sitemap 594개를 같은 분모로 섞지 않음 |
| GSC sitemap | 2026-09-06 읽기 성공, 발견 573개 | 현재 공개 sitemap 594개와 차이 21개. 즉시 장애·누락으로 단정하지 않고 다음 처리 결과와 비교 |
| GSC Core Web Vitals, 2026-09-07 갱신 | 모바일 불량/개선필요/양호 각 0, 데스크톱 최근 90일 사용량 부족 | 양호 판정을 받은 URL이 있다는 뜻이 아니며 실사용 성능 통과로 표시하지 않음 |
| Google AI 참여 설정 | 상위 liv-clinic.net에서 상속, 실제 적용 Include | 설정 변경 불필요 |
| Bing IndexNow | 기존 제출 이력과 11개 언어 후기 URL 확인 | 구현만 존재하는 상태가 아님. 실제 접수와 색인은 구분 |

확인한 Bing 인용 URL은 ko/lifting/shurink 3건, ko/lifting/aptos 3건, mn/antiaging/botox 1건, ko/lifting/thread 1건, en/lifting/onda 1건이다. Google AI의 최근 28일 상위 표에는 홈, 전후사진, 영문 덴시티, 필러, 의료진, 가격 등이 있다. 이 결과를 바탕으로 기존 실리프팅·슈링크·덴시티 설명과 관련 가이드의 근거·연결을 우선 검토한다.

계획의 비브랜드 클릭 +20% 목표는 기준값 100회 이상 조건을 충족했다고 볼 수 없다. 현재는 **분류 가능한 비브랜드 클릭의 절대 수와 관련 검색어의 반복 노출**을 우선 지표로 삼는다. 순위 상승·AI 인용 증가를 이번 수정의 결과라고 주장하지 않는다.

## 3. 계정별 접근과 남은 검증

| 대상 | 상태 | 정확한 후속 조치 |
| --- | --- | --- |
| Search Console | 로그인·소유자·보고서·AI 설정 접근 확인 | 주요 URL의 선택 canonical·제외 사유 추적, 새 배포 이후 수집 결과 비교 |
| Bing Webmaster Tools | 기존 Google 로그인으로 사이트 접근 확인 | 인용 URL·IndexNow·검색 기준값을 다음 관측과 비교 |
| GA4 | 현재 읽기 가능한 속성 520053241은 Firebase 속성. Data API 응답 성공이나 행이 없음 | 운영 측정 ID G-CFDDPRHZ6C를 소유한 속성/계정 접근 필요 |
| GSC↔GA4 연결 | 연결된 dashboard-web 스트림은 G-SNN5P6Z4XB. 운영 코드의 G-CFDDPRHZ6C와 다름 | 실제 LIV 수집 속성을 확인한 후 보고서 속성/연결을 교정. 임의의 ID로 태그 교체하지 않음 |
| 네이버 | 로그인 화면 | 사용자가 관리 계정으로 Chrome 로그인 필요. 기존 소유권·수집 결과 미검증 |
| PageSpeed API | 공개 API HTTP 429 | 성공한 성능 측정으로 표시하지 않음. 사용 가능한 측정 계정/환경에서 6개 유형의 기준값 확보 필요 |
| 실제 봇 IP/WAF | 공개 UA 검사와 구분 | 실제 봇 IP가 포함된 접근 로그는 미검증 |
| DB 자격증명 | 교체 여부 확인 요청, 비밀값 미수집 | 운영자가 과거 자격증명 폐기·교체 완료 여부만 확인 |

현재 GA4 계정의 다른 두 스트림도 운영 ID와 일치하지 않는다. 빈 Data API 응답을 LIV 방문자 0명으로 해석하지 않는다. 운영 태그는 보존했다. 실제 스트림 접근 후 자동 history 기반 page_view와 수동 경로 config의 중복 여부, 유효 상담 집계까지 확인해야 A03 전체가 완료된다.

우선 URL 20개 검사 결과는 **색인 16개, 미발견 가이드 3개, Google이 다른 canonical을 선택한 한국어 홈 1개**다. 미발견 URL은 /en/guides/ultherapy-vs-thermage-vs-shurink, /ja/guides/downtime-flight-travel-plan, /zh-TW/guides/tattoo-removal-pico-seoul이다. 공개 HTTP 응답·자체 canonical·sitemap 포함 여부는 정상이며 색인은 검색엔진의 후속 처리가 필요하다.

한국어 홈의 선언 canonical은 /ko이지만 Google은 루트 /를 선택했다. 최종 수집 시각은 9월 8일 04:11로 이번 배포 이전이다. 현재 루트의 언어 감지 리디렉션은 방문 언어에 따라 달라지므로 근거 없이 /ko 고정 영구 리디렉션으로 바꾸지 않는다. 색인 보고서의 과거 404·리디렉션·canonical 제외 URL 전부를 장애로 취급하지 않고 실제 목적과 후속 수집 결과를 확인한다.

20개 URL 모두 색인 상세를 열어 선언 canonical·Google 선택·마지막 수집 시각을 저장했다. 색인된 16개는 모두 자체 URL이 Google canonical이며, 영문 울쎄라의 마지막 수집은 6월 20일, 한국어 써마지·울쎄라는 7월 17·18일로 오래된 결과다. 현재 HTTP 정상 여부와 Google이 새 내용을 재수집했는지는 별도 추적한다.

운영 배포 후 sitemap을 한 번 재제출했다. GSC는 **2026-09-09 읽기 성공·발견 594개**로 갱신되어 기존 573개와의 차이가 해소됐다. 위 가이드 3개도 각각 한 번씩 요청하여 **Indexing requested** 접수를 확인했다. 이 결과는 크롤링 우선 대기열 등록이며 실제 색인·검색 상위 노출 확정이 아니다. 일본어 가이드 화면은 sitemap 처리 뒤 discovered 상태로 바뀌었으나 색인 완료는 여전히 미확인이다.

| 우선 URL | GSC 판정 | Google canonical |
| --- | --- | --- |
| /ko | 다른 canonical 선택 | https://liv-clinic.net/ |
| /en, /ja, /zh-TW | 각 URL 색인 | 각 자체 URL |
| /ko/lifting/ulthera, /ko/lifting/thermage, /ko/lifting/aptos | 각 URL 색인 | 각 자체 URL |
| /en/lifting/ulthera, /ja/lifting/thermage, /zh-TW/laser/tattoo | 각 URL 색인 | 각 자체 URL |
| /ko/pricing, /en/pricing | 각 URL 색인 | 각 자체 URL |
| /ko/about/staff, /ko/about/location | 각 URL 색인 | 각 자체 URL |
| /en/international, /ko/contact, /ko/medical | 각 URL 색인 | 각 자체 URL |
| /en/guides/ultherapy-vs-thermage-vs-shurink | 미발견 | N/A |
| /ja/guides/downtime-flight-travel-plan | 미발견 | N/A |
| /zh-TW/guides/tattoo-removal-pico-seoul | 미발견 | N/A |

분석 이벤트 정의는 다음처럼 구분한다. 실제 운영 접수나 채팅을 만들지 않았으므로 성공 집계의 운영 수신은 아직 완료 기준에 포함하지 않는다.

| 이벤트 | 현재 의미와 검증 범위 | 성과 집계에서의 사용 |
| --- | --- | --- |
| page_view | 초기 head config와 SPA 경로 config. 로컬 호출 확인 | 실제 속성에서 자동 history 중복 여부 확인 후 방문 지표 |
| scroll_depth / time_on_page | 페이지별 스크롤 단계 / 특정 경과 시점의 가시성 | 콘텐츠 이용 보조 지표 |
| contact | 전화·메신저·지도·소셜 클릭을 method로 구분 | 상담 접수 건수로 합산하지 않음 |
| generate_lead | form_type별 폼 성공 처리. contact 페이지 소스에서 비정상 HTTP 응답은 이벤트 전에 예외 처리 | 실제 수신·중복·스팸 구분 확인 전 유효 상담 확정 불가 |
| chat_open / chat_first_message / chat_capture_contact_saved | 열기·첫 메시지·연락처 저장은 서로 다른 단계 | 열기를 상담 성공으로 취급하지 않음. 실제 채팅 검증 미실행 |

## 4. 콘텐츠·전체 경로 점검 결과와 다음 순서

현재 sitemap 594개를 페이지군으로 분류했다. 홈 11, about 44, contact 11, international 11, lifting 99, antiaging 77, laser 66, medical 11, signature 11, before-after 11, media 11, pricing 11, events 154, consult-prep 11, wechat 1, privacy 11, terms 11, reviews 4, guides 28(허브 4+본문 24)이다.

공개 가이드 24편은 모두 reviewer: clinic이고, Markdown 본문의 외부 출처 링크가 0개다. 예시 draft는 공개 가이드 수에서 제외했다. 본문의 질문·내부 링크·검토자·출처 목록을 URL별로 기록했다. 기존 의료진/시술 페이지의 출처가 없다는 뜻은 아니다. 실제 검토 없이 원장 검토 완료로 표시하지 않는다.

힐로웨이브는 원본 이미지 페이지와 비교용 컴포넌트 버전이 함께 존재하며 헤더는 v2를 안내한다. 현재 병원·가격 내용을 비교 없이 합치거나 한쪽을 삭제하지 않는다. 내용 차이와 실제 유입에 대한 검토 기록을 먼저 준비한 뒤 대표 URL 처리 범위를 확정한다.

다음 단계는 (1) 미확인 GA4/네이버 계정 연결을 해결해 기준값 확정, (2) 수집·색인 제외 사유별 처분과 주요 내부 연결 확인, (3) 이미 노출·인용이 있는 주제 및 비교/회복 가이드의 근거 검토, (4) 외부 프로필의 현재 오류와 수정안 작성 순서다. 기존 병원 정보와 모든 가격 내용의 동결을 유지한다. 새 의료 설명·새 검토자 표시·외부 연락은 이 기록으로 완료 처리하지 않는다.

ChatGPT·Perplexity·Copilot의 고정 질문 20개 × 서로 다른 두 날 관측은 별도 실행 항목이다. 이번 Google/Bing 공식 보고서를 그 실험 결과로 바꿔 부르지 않는다. 4·8·12주 비교와 지속 모니터링이 자동으로 실행되도록 설정한 상태도 아니다.

계획 항목별 현재 상태:

| 항목 | 이번 실행 결과 | 남은 완료 조건 |
| --- | --- | --- |
| A01 계정·기준값 | GSC/Bing 데이터, 20 URL 상세 완료 | GA4 실제 속성·네이버 접근 |
| A02 AI·봇·IndexNow | Google Include, Bing 수신 이력, preview 전송 차단 완료 | 실제 봇 IP/WAF 로그 |
| A03 분석 | 페이지별 이벤트와 전화 중복 수정·회귀 완료 | 실제 GA4 수신·자동 page_view 설정·유효 상담 정의 확정 |
| A04 성능 | 홈 포스터 결함·중복 preload 수정, 정상/실패 영상 회귀 | 6개 유형의 동일 조건 성능 측정, 실사용 데이터 |
| A05 URL 역할 | sitemap 594개 분류와 힐로웨이브 두 버전 현황 완료 | 두 페이지의 역할·유입을 근거로 유지/통합 결정 |
| A06 콘텐츠 | 공개 가이드 24편의 질문·링크·검토자·출처 목록 확보 | 우선 6 URL의 실제 근거·의료 검토·번역 검토 |
| A07 내부 연결 | 내부 목적지 613개 기술 검사 | 주요 20 URL의 양방향 연결과 고립 여부 그래프 확인 |
| A08 언어 품질 | 실제 검색어·국가·페이지 기준값 확보 | 언어별 표현 검토 및 수정 |
| A09–A10 외부 프로필·자료 | 후속 작업 | 실제 프로필 현황과 교정안 준비, 허용된 외부 작업 |
| A11 성과 관측 | Google AI/Bing AI 공식 기준값 확보 | 고정 질문 실험, 주간·4/8/12주 재측정 |
| A12 경고·hydration | 71개 분류, preview 재현 1건 및 후속 회귀 기록 | 원인 특정과 영향이 있는 경고의 조치 |
| S01 자격증명 | 비밀값 없이 교체 여부 확인 요청 | 운영자 답변 및 미교체 시 폐기·교체 |

## 5. 배포와 재현 정보

관련 파일만 명시적으로 커밋한다. 사용자 변경 CLAUDE.md, marketing-attribution.report.md, 기존 미추적 파일, 환경 파일, 원본 계정 보고서, 임시 스크립트·로그·스크린샷을 포함하지 않는다. 상위 폴더의 seo-growth-regression.test.ts와 seo-growth-vitest.config.mts는 재사용할 회귀 테스트이므로 관련 코드와 함께 보관한다.

모든 npm 명령은 liv-clinic에서 실행했다. 추가 회귀 명령은 `npm run test -- --root .. --config seo-growth-vitest.config.mts`다. 브라우저는 공개 GET만 허용하고 실제 상담·채팅·분석 서버 전송을 차단한 검증 프록시를 사용했다. 모의 분석 호출 관측은 실제 GA4 수신 검증을 대신하지 않는다.

수정 커밋은 223468b6269094e69b1dbd73806b3c93d2cb084d, 중복 preload 정리를 포함한 최종 앱 커밋은 **351df0e2e11a6bcd7f68010a48a5a216196d7d69**다. [PR #37](https://github.com/jaeho19/liv-clinic/pull/37)의 최종 preview 검증 후 master에 fast-forward하고 푸시했다. 관련 없는 기존 PR과 사용자 변경은 포함하지 않았다.

| 배포 | 실제 결과 |
| --- | --- |
| 최종 preview | [deploy-preview-37](https://deploy-preview-37--liv-clinic-jaeho19.netlify.app), deploy 6aa1120bd87a3e0008bdb076, ready, 소스 351df0e |
| preview 검증 | 주요 142 URL, noindex/nofollow·X-Robots-Tag·전체 차단 robots·빈 sitemap·운영 canonical·가격 보존 통과. 6개 주요 화면의 언어 메뉴 조작 및 main/H1·가로 넘침 검사 통과, 추가 #418 없음 |
| production | [liv-clinic.net](https://liv-clinic.net), deploy 6aa11319e137b0000803ad69, ready, published_deploy 소스 351df0e 일치 |
| 게시 시각 | **2026-09-09 17:06:13 KST** (08:06:13 UTC) |
| 운영 브라우저 | 홈 영상·포스터 표시, 가격·의료정보·의료진·상담·가이드의 실제 메뉴 조작 정상. 영어 가격 → 일본어 가격 경로·canonical·15행 확인. Chrome 자동 번역 개입은 앞 절과 동일하게 구분 |
| 운영 HTTP·schema | **142 URL, sitemap 594개, 내부 목적지 613개, FAQ 460개 통과**. canonical·hreflang·robots·JSON-LD 속성 적용 유형/빈 값 오류 **0**. 가격 11개 언어의 전체 본문·description 동일 |

운영 근거는 상위 폴더의 seo-growth-production-validation.json, seo-growth-production-schema-issues.json, seo-growth-production-browser.json, seo-growth-production-language.json, seo-growth-production-home.json과 Netlify 조회 기록이다. GSC 접수 원본은 seo-growth-gsc-sitemap-submitted.txt 및 seo-growth-gsc-requested-*-guide.txt에 보관했다. 이 임시·원본 자료는 커밋하지 않았다.

종료 전 기존 파일 2,025개의 해시를 다시 비교했다. 누락 파일은 0개이며, 변경은 관련 앱 7개와 이번에 갱신·커밋한 SEO 문서뿐이다. CLAUDE.md와 기존 marketing-attribution.report.md 사용자 변경을 보존했다. 빌드가 줄바꿈만 바꾼 생성 파일 3개는 시작 해시와 같은 바이트로 복구했다. 최종 결과 문서 커밋은 배포한 앱 코드를 변경하지 않는다.

첫 preview #418 한 건은 잔여 오류로 남긴다. 최종 preview의 반복 로딩·상호작용과 운영 검증에서 재발하지 않았고 초기 콘텐츠·SEO 출력·가격 보존이 정상임을 근거로 이번 제한된 변경을 배포 가능하다고 판단했다. 모든 방문 조건에서 오류가 사라졌다는 판정은 아니다. [Next.js hydration 오류 안내](https://nextjs.org/docs/messages/react-hydration-error)도 조사 근거로 참고했다.

공식 구현 근거: [Google SPA 측정](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications), [Google 페이지뷰 측정](https://developers.google.com/analytics/devguides/collection/ga4/views), [Next Image](https://nextjs.org/docs/app/api-reference/components/image). 검색·AI 지표 정의의 공식 링크는 실행 계획서에 포함돼 있다.
