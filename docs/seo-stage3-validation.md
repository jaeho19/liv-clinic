# LIV SEO·GEO 3단계 구현 및 4단계 배포 전 검증

검증일: 2026-09-09. 기준 커밋: `86cef5b`. 작업 위치: `D:\dev\LIV_homepage\liv-clinic`.

**상태: 외부 설정 확인 후 배포 가능.** 이번 기술 변경의 빌드와 로컬 회귀 검증은 통과했다. 전체 린트는 기존 오류 56개·경고 73개로 여전히 실패하므로 모든 검사가 통과한 상태는 아니다. 저장소의 Netlify 빌드 명령은 `npm run build`이며, 별도 린트 CI는 발견되지 않았다. 린트 0건을 배포 조건으로 적용한다면 기존 오류를 먼저 해결해야 한다.

commit·push·merge·배포, 실제 상담 접수·채팅 시작·메일·문자·운영 DB 쓰기는 실행하지 않았다. 이전 단계의 의료 문안 검토와 운영 사실 확인 요청은 [2단계 기록](seo-stage2-content-review.md)에 그대로 남아 있다.

## 코드에 반영한 내용

| 대상 | 수정 전 확인 | 최종 동작 |
| --- | --- | --- |
| 가격 메타데이터 | HTML hreflang 없음. HTTP Link 대체 구현도 없음. 사이트맵에는 대체 언어 존재 | 기존 공통 메타데이터 함수를 사용해 HTML에 11개 언어와 x-default 출력. 기존 제목·가격 설명 유지 |
| 영문 hreflang | en-US로 미국에 한정 | 국제 방문자 대상 영문 문서에 `en` 사용. 다른 언어 및 OG locale 유지 |
| 상담 준비 페이지 | 11개 언어 모두 canonical이 각 언어의 홈을 가리킴 | `/[locale]/consult-prep` 자기 canonical·hreflang. 기존 화면 제목·안내 문구를 메타데이터에 재사용 |
| robots / preview | 일반 공개 정책만 존재 | 검색용·사용자 요청용·학습용 에이전트를 구분. Netlify deploy-preview/branch-deploy는 noindex 헤더, 메타 및 robots 전체 차단·빈 사이트맵 |
| 문의 조회 / 후기 | 비공개 조회 페이지와 비어 있는 외국어 후기가 사이트맵에 포함 | 문의 조회 noindex 및 사이트맵 제외. 후기는 공개된 언어 집합을 metadata와 sitemap에서 공유 |
| 후기 조회 실패 | 오류를 후기 1개로 취급 | 오류를 전파하여 잘못된 빈 상태/noindex로 ISR 결과를 덮어쓰지 않음. 첫 빌드에는 정상 DB 읽기가 필요. 1,000행을 넘는 경우도 페이지 단위로 조회 |
| FAQ 초기 HTML | 의료정보·울쎄라·써마지 답변 일부가 클릭 뒤 DOM에 생성 | 기존 답변을 서버 HTML에 포함. 접힌 답변은 화면·접근성 트리에서 숨기고 펼칠 때 표시. 울쎄라 더보기 목록도 HTML에 유지 |
| 문서 날짜 / 검색 액션 | WebPage 기본 발행일 및 실행일 수정일, 실제로 처리하지 않는 검색 쿼리 액션 | 근거 없는 날짜와 SearchAction 제거. 가이드의 기존 수정일·행사의 실제 DB updated_at은 유지 |
| 문서·시술 schema | 지원하지 않는 속성, 영문 문서의 한국어 속성, 언어 없는 예약 URL | 지원 속성으로 정리하고 예약·문서 URL·breadcrumb를 해당 언어로 연결. FAQ는 문서에 연결하고 실제 화면 원본 재사용 |
| 병원·의료진 schema | clinic의 availableService 유형 불일치, credential issuedBy, 모든 의사에 같은 전문과목, 김수영 학력 충돌 | 병원은 MedicalClinic, credential은 recognizedBy. 의사는 Person/Physician과 실제 표시 전문과목 사용. 김수영 학력은 확인 전 schema에서 생략 |
| 누락 아이콘 / 404 | `/icon.svg`, `/apple-touch-icon.png` HTTP 500 및 static-to-dynamic/headers 오류 | 아이콘 메타는 기존 정상 PNG로 연결. 홈의 locale 검증과 독립 global-not-found로 누락 파일은 정상 404 |
| 모바일 고정 UI | 오른쪽 소셜 버튼 열이 가격 열과 본문을 가림 | 모바일 소셜 링크를 문서 하단으로 이동. 외국어 채팅 런처는 하단 상담 바 공간 안에 배치. 연락 수단·할인 안내·상담 기능 보존 |
| 이미지 선로딩 | 모든 페이지에서 홈 포스터를 preload | 홈에서만 선로딩. 홈 외 경로에서 149,200바이트 이미지의 불필요한 조기 요청 제거 |

병원·의사·시술의 언어 중립 `@id`는 유지했다. 언어별 FAQPage의 문서 ID만 해당 언어 경로로 구분했다. 신규 FAQPage나 AI 전용 schema를 추가하지 않았으며, 기존 `public/llms.txt`는 변경하지 않았다.

MedicalProcedure에서 제거한 `estimatedCost`는 금액 없이 KRW만 들어 있던 지원되지 않는 객체였다. 가격·VAT·판매 옵션·샷/라인 수·할인 안내와 가격 원본은 변경하지 않았다. 확인되지 않은 학교·담당자·자격·도보 시간은 새 사실로 확정하지 않았다.

주요 코드: `src/lib/seo.ts`, `schemaI18n.ts`, `siteEnvironment.ts`, `reviewIndexing.ts`, `sitemapPaths.ts`, `src/app/robots.ts`, `sitemap.ts`, `global-not-found.tsx`, 언어별 pricing/consult-prep/inquiry/reviews/layout, `CollapsibleContent.tsx`, `ExpandableList.tsx`, FAQ 및 상담 UI 구성요소, `next.config.ts`.

## 실행한 검증

| 검사 | 최종 결과 | 근거 파일(저장소 상위 작업 폴더) |
| --- | --- | --- |
| `npm run build` | 성공, 543개 정적 페이지 생성 | `seo-stage3-build-final.log` |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | 성공 | `seo-stage3-types-final.log` |
| `npm test` | 41개 파일, **557개 통과**. 기존 544개 + 회귀 13개 | `seo-stage3-tests-final.log` |
| `npm run test:rules` | 7개 통과 | `seo-stage3-rules.log` |
| `npm run verify:i18n` 및 prebuild 검사 | 11개 언어 통과. 기존 zh/zh-TW 전용 키 안내 유지 | `seo-stage3-i18n.log`, 빌드 로그 |
| 전체 ESLint | **실패: 기존과 동일한 오류 56개·경고 73개, 신규 진단 0개** | `seo-stage3-lint-before.json`, `seo-stage3-lint-final.json` |
| 핵심 HTTP 검사 | 9개 경로 × 11개 언어 = 99개 모두 200. H1·canonical·OG URL·대체 언어 상호 연결·색인 상태 통과 | `seo-stage3-http-after.json`, `seo-stage3-validation.json` |
| 사이트맵 / 내부 링크 | 사이트맵 594개, 사이트 내부 목적지 총 613개 모두 200. 사이트맵 canonical·noindex·중복 검사 통과 | `seo-stage3-validation.json` |
| JSON-LD | 출력 JSON 파싱, Schema.org 어휘의 속성 적용 유형·빈 값 검사 통과 | `seo-stage3-schema-check.py`, `seo-stage3-schema-issues.json`(빈 배열) |
| FAQ와 초기 HTML | 핵심 페이지의 460개 언어별 Q&A가 해당 본문 HTML에 포함 | `seo-stage3-validation.json` |
| 브라우저 | 69개 경로/화면 크기 조합. H1/main 각 1개, 가로 넘침 없음 | `seo-stage3-browser.json` |
| FAQ와 최종 DOM | 브라우저 표본의 397개 Q&A 문구 모두 DOM과 일치 | `seo-stage3-dom-parity.json` |
| 간헐적 React #418 | 전체 화면 검사 및 기존 발생 경로 4개 × 3회 독립 재방문에서 미재현 | `seo-stage3-hydration-recheck.json` |
| 보존 검사 | 11개 언어 가격 본문·가격 description 동일. 번역/가격 원본·기존 사용자 수정·package/lockfile 등 보호 대상 22개 SHA-256 동일 | `seo-stage3-source-before.json`, `seo-stage3-validation.json` |
| Git diff | whitespace 검사 통과. 빌드 생성 파일은 내용·기존 해시 확인 후 줄바꿈만 복구 | `seo-stage3-diff-check.log` |

모든 npm 명령은 앱 폴더에서 실행했다. 검증 스크립트·로그·스크린샷은 상위 작업 폴더에 저장했다. `CLAUDE.md`, 마케팅 보고서 및 기존 미추적 문서·도구·이미지는 보존했다. 의존성·lockfile·환경 파일·Netlify 설정 파일은 변경하지 않았다.

검증용 로컬 서버와 프록시는 작업 종료 시 중지했고 브라우저 화면 크기를 복구했다. HEAD는 `86cef5b`로 유지된다.

빌드 환경은 로컬 Node 24.19.0이다. 기본 로컬 인증서 체인에서 Google Fonts/DB 읽기 문제가 있어 최종 빌드 프로세스에만 `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1`과 `NODE_OPTIONS=--use-system-ca`를 적용했다. 인증서 검증을 끄지 않았으며 최종 빌드에 데이터 조회 오류는 없었다. 저장소 Netlify 런타임 설정은 기존 Node 20으로 유지했다. 이 결과는 Netlify 어댑터를 거친 실제 배포 테스트를 대신하지 않는다.

## HTTP·렌더링·모바일 확인 범위

핵심 경로는 홈, 울쎄라, 써마지, 실리프팅, 가격, 의료정보, 의료진, 위치, 상담이다. 가격 페이지는 11개 언어 모두 canonical 및 12개 alternate(자기 언어 포함 11개 + x-default)가 상호 일치한다. next-intl의 기존 `alternateLinks: false`를 유지하므로 별도 HTTP Link 헤더와 충돌하지 않는다. 사이트맵 한글 행사 slug의 percent-encoding 차이는 URL을 정규화해 비교했다.

미리보기 로컬 서버에서 `/ko/pricing`, `/admin/login`, `/robots.txt`, `/sitemap.xml`의 `X-Robots-Tag: noindex, nofollow`를 확인했다. 가격 canonical은 운영 URL, robots는 전체 disallow, sitemap은 비어 있다. branch-deploy 조건은 단위 테스트로도 확인했다. 실제 Netlify preview의 CDN 헤더는 후속 배포에서 재확인해야 한다.

현재 공개 후기가 있는 언어는 ko/en/ja/zh이며 이들만 후기 대체 언어와 사이트맵에 포함된다. 다른 7개 언어는 `noindex, follow`이고 문의 조회는 `noindex, nofollow`이다. 관리자 noindex는 유지했다. robots에서 공개 리소스와 `_next` 렌더링 파일을 막지 않는다.

기존 `/staff` 301, `/ko/gallery` 308, `/en/book` 307, `/feed` 410과 일반 404를 확인했다. 정상 아이콘 PNG 두 개는 200, 누락 아이콘 두 개 및 추가 누락 파일은 404다. 최종 검사 중 서버의 static-to-dynamic 또는 NoFallbackError는 없었다. 존재하지 않는 이벤트 슬러그는 기존 동적 페이지가 200 + noindex로 응답한다. 일반 404와 별개인 기존 동작이며 사이트맵에는 포함되지 않는다.

Next의 스트리밍 HTML은 처음 `<main>`에 Loading이 있어도 뒤쪽 숨김 전송 컨테이너에 본문을 포함한다. 스크립트를 제외하고 전체 응답을 검사했다. 가격의 15개 행과 VAT/조건은 수정 전부터 초기 HTML에 있었고 그대로 유지했다. 의료정보 등의 FAQ 답변은 이번에 초기 본문으로 전달되도록 보완했다.

브라우저 표본: 390px에서 ko/en 핵심 18개 화면 및 나머지 9개 언어의 가격·의료정보·의료진 27개, 320px에서 ko/en/ru/fr/mn/ar 가격 6개, 1440px에서 ko/en 핵심 18개. 가격→써마지, 시술→의료정보 특정 질문, 같은 페이지 언어 전환, 의료정보 검색, FAQ 펼침/접힘, 울쎄라 3개→6개 더보기, 콜백 폼 열기/닫기와 채팅 시작 전 화면을 확인했다. 폼과 채팅은 제출하지 않았다.

브라우저는 쓰기를 거부하는 로컬 프록시에서 확인했다. 외부 연결·폼 전송을 차단했으므로 분석 수집 성공이나 실제 상담 성공을 검증했다고 해석하면 안 된다. 네이버 지도는 로컬 도메인 인증 오류가 있었고, 외부 Supabase에 직접 접근하는 운영 팝업 데이터는 이 환경에서 로드가 제한됐다. 팝업의 기존 언어 필터·모바일 표시 옵션·닫기 코드는 유지했으며, 실제 활성 팝업과 지도는 운영/preview에서 재확인해야 한다.

## 성능 및 인계된 미해결 사항

리소스 검사는 `seo-stage3-resources.json`에 남겼다. 홈 외 포스터 선로딩 제거는 파일 크기와 실제 preload 출력으로 확인했다. Pretendard 전체 파일은 기존처럼 preload하지 않고, 기존 폰트·이미지·코드 분할 정책은 유지했다. 로컬 HTTP 응답 시간은 사용자 기기의 Core Web Vitals가 아니다.

PageSpeed Insights API로 운영 영문 가격 페이지의 모바일 지표를 요청했으나 서비스 공용 할당량 초과(HTTP 429)로 CWV/CrUX 데이터를 받지 못했다(`seo-stage3-pagespeed.json`). LCP·INP·CLS 점수 개선 또는 통과를 주장하지 않는다. GSC/CrUX 및 배포 후 측정이 필요하다.

- 전체 린트의 기존 오류 56개·경고 73개는 미해결이다. 새 진단은 없으며 검사를 삭제·완화하지 않았다.
- React #418은 이번에 재현되지 않아 원인을 확정하거나 완치로 표시하지 않았다. 기존 발생 경로의 배포 후 관찰이 필요하다.
- 김수영 학력, 실제 시술 담당자/인증 근거, 도보 1분/3분 충돌, 공식 Instagram 계정 불일치는 운영 확인이 필요하다. 학력 schema 생략 외에는 임의 사실 수정이 없다.
- 2단계의 의료 문안·효과/회복/병행 간격 검토, 기존 CTA의 링크 안 버튼 중첩 등 이번에 새로 생기지 않은 항목은 남아 있다. 새 의료 주장·검토자·검토일은 부여하지 않았다.
- Netlify `globalNotFound`는 Next 16.1.1에서 지원하는 실험 옵션이다. 로컬 404 검증은 통과했으며 어댑터 적용 결과는 preview에서 확인해야 한다. 기존 middleware 명칭 폐기 예정 경고는 유지된다.

## 검색·AI 접근 정책 근거

2026-09-09에 공식 문서를 재확인했다. 검색 노출이나 AI 인용을 보장하는 변경은 아니다.

- OAI-SearchBot 검색 정책과 GPTBot 학습 정책은 독립이다. ChatGPT-User는 사용자 요청형 접근이다. 기존 학습 봇 허용 상태는 유지했다. [OpenAI 봇 문서](https://developers.openai.com/api/docs/bots)
- Claude-SearchBot, Claude-User, ClaudeBot의 역할을 구분했다. [Anthropic 크롤러 안내](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
- PerplexityBot과 Perplexity-User를 구분했다. 사용자 요청 에이전트에는 robots만으로 모든 접근을 제어한다고 가정할 수 없다. [Perplexity 크롤러 문서](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)
- Google FAQ 리치 결과는 2026-05-07 종료로 공식 변경 기록에서 확인했다. 기존 FAQ 본문 유지와 schema 문법 검증을 리치 결과 성과와 구분했다. [Google 변경 기록](https://developers.google.com/search/updates)
- AI 검색을 위한 별도 schema나 llms.txt 생성을 요구하지 않는다. [Google AI 검색 최적화 안내](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- 명시적 봇 그룹에도 관리자/API 차단을 유지했다. Yeti 접근은 User-Agent 문자열만으로 실제 크롤러 신원을 입증할 수 없다. [Bing robots 안내](https://www.bing.com/webmasters/help/how-to-create-a-robots-txt-file-cb7c31ec), [네이버 방화벽 안내](https://searchadvisor.naver.com/guide/seo-basic-firewall)
- JSON-LD 속성 유형은 [Schema.org 공식 어휘](https://schema.org/version/latest/schemaorg-current-https.jsonld)로 대조했다. 이것은 Google Rich Results Test 통과 판정이나 의료 사실 검증을 의미하지 않는다.
- locale 밖 누락 파일 처리는 [next-intl 오류 파일 안내](https://next-intl.dev/docs/environments/error-files)와 [Next global-not-found 문서](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)를 참고했다.

운영 사이트에 Googlebot/Bingbot/Yeti/OAI-SearchBot/Claude-SearchBot/PerplexityBot/ChatGPT-User/GPTBot User-Agent로 영문 가격 페이지를 GET 요청해 모두 200이고 X-Robots-Tag 차단이 없음을 확인했다. 로컬 최종 빌드에서도 동일 에이전트의 가격 행·canonical·alternate를 확인했다. 이 검사는 **해당 요청 출발지의 응답**만 증명하며 실제 봇 IP의 CDN/WAF 통과를 증명하지 않는다. 저장소에서 확인되지 않는 WAF/IP 허용 목록은 수정하지 않았다. 운영의 `/icon.svg`는 아직 500이며 이번 변경을 배포하기 전 상태다.

## 후속 배포에서 확인할 순서

1. **robots**: 운영 공개 허용, preview 전체 차단, 검색/학습 정책 유지 및 실제 봇의 CDN/WAF 접근.
2. **sitemap**: 운영 도메인·공개 URL·실제 lastmod, 후기 언어 집합, preview 빈 응답.
3. **noindex/canonical**: 운영 핵심 페이지가 색인 가능하고 자기 URL을 가리키는지, preview와 문의 조회·빈 후기가 차단되는지. 가격 11개 언어의 상호 hreflang.
4. **HTTP/리다이렉트**: 404/아이콘, `/staff`, `/gallery`, `/book`, `/feed`, Netlify 어댑터의 global-not-found. 모바일 활성 팝업·채팅·지도와 기존 hydration 경로.
5. **검색 도구**: Google Search Console, 네이버 서치어드바이저, Bing Webmaster Tools 소유 확인 및 사이트맵 처리. Rich Results Test 지원 항목과 일반 Schema.org 검증을 구분. CWV/CrUX 실측.
6. **분석·상담**: 담당자가 승인한 검증 범위에서 분석 수집과 실제 접수/알림 확인. 자유 입력·건강정보·개인정보를 분석 이벤트에 넣지 않는다.

필요한 설정 이름과 용도: `NEXT_PUBLIC_SITE_URL`(운영 대표 주소), `CONTEXT`(Netlify 환경 구분), `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`(공개 데이터 읽기), `NEXT_PUBLIC_GA_ID`/`NEXT_PUBLIC_NAVER_WCS_ID`(분석), `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`(지도 및 허용 도메인). 실제 접수·알림은 기존 서버 자격 증명과 운영 정책에 따라 별도로 확인한다. 배포 및 검색 도구 계정 권한은 이번 작업에서 사용하지 않았다.
