# LIV SEO·GEO 4단계 최종 검증 및 배포 기록

검증일: 2026-09-09. 시작 HEAD: `86cef5b`. 앱: `D:\dev\LIV_homepage\liv-clinic`.

**최종 판정: 로컬·실제 preview·운영 검증 통과, production 반영 완료.** 운영 주소는 [https://liv-clinic.net](https://liv-clinic.net)이며, Netlify 게시 소스는 검토한 코드 커밋 `b823c38a3ff01b31cb436e737dbfd5996853dadb`와 일치한다. 게시 시각은 2026-09-09 15:29:23 KST이다. 개발 모드의 간헐 hydration 오류 원인과 외부 계정 검증은 아래와 같이 잔여 항목으로 구분한다.

## 범위와 보존 원칙

- 기존 미커밋 3단계 구현, 앞선 4단계 린트 수정, 이번 잔여 기술 수정을 함께 반영한다. [3단계 기록](seo-stage3-validation.md)과 [이전 인계](seo-stage4-handoff.md)는 당시 이력이다.
- 병원 정보는 사용자가 기존 내용이 맞다고 확인했다. 과거 문서의 운영 사실 재확인 요청을 이번 완료·배포 조건으로 사용하지 않는다. 새 사실을 추가하거나 서로 다른 기존 값을 통일하지 않았다.
- 가격·VAT·판매 옵션·샷/라인 수·할인 및 관련 안내는 변경하지 않았다. 11개 언어의 가격 본문 전체와 description을 이전 HTTP 결과와 대조했다.
- 실제 상담 제출·채팅 시작·메일·문자·운영 DB 쓰기·마이그레이션은 실행하지 않는다. 관리자 API 회귀는 모의 DB에서만 수행한다.
- `CLAUDE.md`, 마케팅 보고서, 기존 미추적 사용자 자료와 상위 검증 자료는 커밋 대상에서 제외한다. package/lockfile, 환경 파일, Netlify 설정, lint 규칙은 유지한다.

## 해결한 기술 문제

| 문제 | 변경 및 영향 |
| --- | --- |
| 전후사진 모달 닫기 버튼 잘림 | 음수 top의 절대 배치를 없애고 이미지 위의 정상 문서 흐름에 버튼 공간을 확보했다. 스크롤 컨테이너는 `100dvh`로 제한한다. 공개 DB를 읽어 실제 이미지를 표시한 390×844와 320×568 화면에서 버튼 전체 표시, 클릭/Escape 닫기, 스크롤 복원이 정상이다. |
| 중복 main | 같은 원인의 총 13곳에서 내부 main을 div로 변경했다. locale layout의 `#main-content`를 유일한 main으로 유지한다. 본문·속성·스타일·링크는 보존했다. ko/en 26페이지 HTTP에서 main 1개를 확인했다. |
| 기존 린트 오류 56개 | 앞선 4단계의 관리자 비동기 응답 처리, 재고 API 타입, 애니메이션의 순수 계산, 브라우저 상태 구독, 지도 타이머 정리, 내부 링크 및 JSX 수정을 포함했다. 최종 오류 0개를 유지한다. |
| 수동 스크립트의 내장 DB 접속값 | `migrate_manual.js`는 `DATABASE_URL`을 요구한다. 실행하지 않았고 비밀값을 출력·커밋하지 않는다. 과거 자격증명의 폐기/교체 여부는 별도 보안 확인 사항이다. |
| 3단계 SEO 수정 | 가격·상담 준비 canonical/hreflang, preview noindex/robots/빈 sitemap, 문의 및 후기 색인 정책, FAQ 초기 HTML, schema 언어·속성·실제 날짜 처리, 누락 파일 404와 모바일 고정 UI 보완을 유지했다. |
| 실제 preview의 SSR/ISR 색인 정책 불일치 | Netlify 빌드 전용 `CONTEXT`가 런타임에 없는 경우 메타·sitemap이 공개 정책으로 바뀌었다. 비밀정보가 아닌 환경 이름을 Next 빌드에 고정해 재생성에서도 preview 차단을 유지했다. 아래 실제 재배포 및 반복 요청 검사를 통과했다. |

## 최종 로컬 검사

모든 npm 명령은 `liv-clinic/`에서 실행했다. 스크립트·원본 로그·JSON·스크린샷은 상위 작업 폴더의 `seo-stage4-final-*` 파일이다.

| 검사 | 결과 | 증빙 |
| --- | --- | --- |
| ESLint | **통과: 오류 0, 경고 71** | `seo-stage4-final-lint.json` |
| TypeScript | **통과**, `tsc --noEmit --incremental false` | `seo-stage4-final-types.log` |
| 기존 Vitest 및 환경 회귀 | **41개 파일, 560개 통과** | `seo-stage4-final-tests.log` |
| 관리자/재고 추가 회귀 | **29개 통과**, 외부 통신 금지·모의 DB | `seo-stage4-final-regression.log` |
| 규칙 테스트 | **7개 통과** | `seo-stage4-final-rules.log` |
| 번역 키 | **11개 언어 통과**, 기존 zh/zh-TW 전용 키 안내 유지 | `seo-stage4-final-i18n.log` |
| Production build | **543개 정적 페이지 생성 성공** | `seo-stage4-final-build.log` |
| HTTP | **핵심 99개, 전체 표본 142개 통과** | `seo-stage4-final-local-http.json` |
| sitemap/내부 목적지 | **594개/613개 통과**, canonical·색인·상태 코드 오류 없음 | `seo-stage4-final-local-validation.json` |
| 초기 HTML FAQ | **460개 Q&A 문구 일치** | 위 validation JSON |
| JSON-LD | JSON 파싱·Schema.org 속성 적용 유형·빈 값 검사 오류 0 | `seo-stage4-final-local-schema-issues.json` |
| 가격 보존 | **11개 언어 전체 본문·description 동일**, 각 15개 가격 행 유지 | HTTP/브라우저 JSON |
| 브라우저 | 11개 언어 가격 390px에서 H1/main 각 1개, 15개 행, 가로 넘침 없음. 메뉴 열기/Escape 닫기 정상 | `seo-stage4-final-browser.json` |
| 모달 | 실제 공개 이미지, 버튼 전체 표시, 클릭/Escape 닫기·스크롤 복원 통과 | `seo-stage4-final-modal-390.png`, `seo-stage4-final-modal-320.png` |
| 변경 범위 | 명시적 파일 목록, 비밀 패턴 검사, `git diff --check` 통과 | `seo-stage4-final-commit-files.json` |

로컬 Node는 24.19.0이다. 인증서 체인 문제는 해당 프로세스에만 `NODE_OPTIONS=--use-system-ca`, `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1`을 적용해 해결했다. TLS 검증을 끄지 않았다. Netlify의 기존 Node 20 설정과 Next 어댑터를 사용하는 실제 preview·production 빌드도 성공했다. 로컬 빌드 산출물의 환경 판별 함수가 `production` 상수로 치환된 것을 확인했다.

## Hydration 조사와 배포 판단

이전 4단계에서는 URL이 기록되지 않은 React `#418` 2건이 있었다. 이번에는 **개발 모드 `/en/pricing`에서 2026-09-09 05:58:12.865 UTC에 상세 오류 1건**을 확보했다. 차이는 locale layout에서 Header 다음의 `<main>`과 Suspense 경계였다. 원문은 `seo-stage4-final-hydration-detail.json`에 저장했다.

서버 HTML의 직접 자식 순서와 Header/MobileMenu/locale layout을 읽었다. 초기 응답에는 header → main 순서가 있고, main 안에 Next의 스트리밍 경계가 있다. 이 관측만으로 특정 앱 상태·라이브러리·브라우저 확장·개발 중 재빌드를 원인으로 확정할 수 없다. 개발 서버와 빌드를 함께 검사하던 구간이지만, 그것이 원인이라는 결론도 내리지 않는다.

고정된 프로덕션 빌드에서는 `/ko/pricing`, `/en/pricing`, `/ko/medical`, `/ru/about/staff` 각 3회, 총 **12회**의 메뉴 열기·Escape 닫기를 포함한 재검사에서 hydration 오류가 없었다. 별도로 11개 언어 가격 페이지에서도 실제 메뉴 조작 후 오류가 없었다. 처음 H1이 보이는 순간과, 클라이언트 이벤트가 동작한 뒤의 관측을 구분했다.

원인을 입증하지 못한 추정 수정, SSR 비활성화, 추가 `suppressHydrationWarning`, 규칙 완화는 적용하지 않았다. **개발 모드에서 관측한 간헐 오류는 잔여 위험으로 유지한다.** 수정 preview 주요 6페이지와 배포 후 운영 주요 8페이지에서도 실제 메뉴 열기/Escape 닫기 후 hydration 오류가 없었다. 초기 콘텐츠·SEO 출력·프로덕션 상호작용과 실제 배포 검증을 통과했으므로 배포 가능하다고 판단하고 운영 반영했다. 모든 브라우저·방문 조건에서 재발하지 않는다는 보장은 아니다. 근거: [Next.js hydration 오류 안내](https://nextjs.org/docs/messages/react-hydration-error).

검증 프록시는 운영 쓰기와 외부 분석·채팅 통신을 차단한다. 최종 프록시는 RSC/Next 라우터 헤더를 보존하고 공개 전후사진 GET을 허용한다. HTTP·봇·sitemap 검사는 실제 HTTPS 주소로 직접 수행했다. 브라우저만 실제 배포 응답을 읽는 로컬 프록시를 이용했다. 홈·상담 페이지에 기록된 NaverMap 스크립트 오류는 이 프록시의 외부 CSP 차단에 따른 것이며 hydration 오류와 구분한다. 외부 팝업·지도·분석 성공을 검증한 것으로 보지 않는다. 일부 자동 클릭/초기 로딩 대기는 도구의 3초 제한을 넘었으나, 로딩 후 DOM·화면을 확인하고 실제 클릭으로 재검증했다.

## 남은 경고 71개

| 종류 | 수 | 영향 및 처리 |
| --- | --- | --- |
| `@typescript-eslint/no-unused-vars` | 56 | 미사용 선언. 필수 기능과 직접 관련 없는 정리로 범위를 확대하지 않고 유지한다. |
| `@next/next/no-img-element` | 13 | 일반 img의 최적화·대역폭 잠재 영향. 관리자 업로드 미리보기와 기존 이미지 정책을 유지한다. CWV 통과를 의미하지 않는다. |
| `react-hooks/exhaustive-deps` | 2 | 관리자 이벤트 `fetchEvents`, 써마지 `heroLabels.length`. 기존 초기 조회/고정 목록 동작에 관한 경고이며 신규 진단은 없다. 별도 기능 변경 없이 유지한다. |

전체 위치와 메시지는 `seo-stage4-final-lint.json`에 있다. 검사·규칙·ignore 범위는 유지했다. Next의 기존 middleware 명칭 폐기 예정 및 `globalNotFound` 실험 옵션 안내도 오류와 구분한다.

## 배포 대상과 수행 기록

- Netlify 프로젝트: `liv-clinic-jaeho19`, site ID `de7005fe-c770-4b2f-bbe0-1025513014d5`.
- 운영: `https://liv-clinic.net`; 저장소 `jaeho19/liv-clinic`, 운영 브랜치 `master`.
- 시작 시 운영 소스: `2ccaa23b6fb16bec190868f9f7e11b6f771419fc`, deploy ID `6a9d46ac2f2d890008ca8f30`.
- 기존 설정: Node 20, `npm run build`, `.next`, `@netlify/plugin-nextjs`. 계정·사이트 연결 확인 완료.
- 1차 코드 커밋: `9ee0467d6dc97cb28a302a7cfb555145bf5927eb`. PR #36의 실제 preview `6aa0f89e6bf32700092bafe3` 빌드 성공.
- 실제 preview의 초기 142개 HTTP 검사에서 `/ko`, `/ko/contact` robots 메타 불일치를 발견했다. 다시 요청한 다른 경로도 공개 메타로 바뀌었고 sitemap은 0개에서 594개로 재생성되었다. noindex HTTP 헤더와 robots.txt 차단은 유지되었으므로 이를 공개 색인 허용으로 해석하지 않는다.
- 원인: 기존 환경 판별은 빌드 전용 `CONTEXT`만 읽었다. Netlify 함수의 SSR/ISR에서는 이 변수가 제공되지 않아 공개 환경으로 잘못 판별했다. 비밀정보가 아닌 빌드 환경 이름만 Next 설정의 `LIV_BUILD_CONTEXT`에 포함해 재생성에서도 유지하도록 수정했다. 런타임 CONTEXT 누락 시 preview/branch의 메타·robots·빈 sitemap 유지와 production 판별에 대한 회귀 3개를 추가했다.
- 근거: [Netlify 함수 환경변수 범위](https://docs.netlify.com/build/functions/environment-variables/), [Next.js 빌드 시 env 치환](https://nextjs.org/docs/app/api-reference/config/next-config-js/env). 별도 Netlify 비밀 설정이나 의존성 변경 없이 기존 Next 16.1.1의 지원 기능을 사용한다.
- 보완 코드 커밋: `b823c38a3ff01b31cb436e737dbfd5996853dadb`. [PR #36](https://github.com/jaeho19/liv-clinic/pull/36)의 보완 preview deploy ID는 `6aa0fb65e137b00008008db9`이다. [실제 preview](https://deploy-preview-36--liv-clinic-jaeho19.netlify.app)에서 142개 HTTP 검사, JSON-LD 검사, 주요 6페이지 메뉴 조작이 통과했다. 재요청한 홈·상담·ko/en 가격·의료정보·러시아어 의료진 페이지 모두 noindex 메타/헤더를 유지했고, robots.txt는 전체 차단, sitemap은 0개였다. Netlify header·redirect 및 preview 상태 검사도 통과했다. Pages changed 검사는 플랫폼에서 skipping으로 표시했다.
- preview 검증 후 `master`를 fast-forward push했다. PR #36은 GitHub에서 merged로 확인되었다. 미커밋·미추적 파일이 포함되지 않은 Git 커밋을 Netlify가 직접 빌드했다.
- production deploy ID: `6aa0fc655cfc1d000866130c`; build ID: `6aa0fc655cfc1d000866130a`; 상태 `ready`; 게시 소스 `b823c38a3ff01b31cb436e737dbfd5996853dadb`; 게시 시각 `2026-09-09T06:29:23.244Z` (15:29:23 KST). `getSite.published_deploy`로 운영 반영을 재확인했다. [배포 관리 기록](https://app.netlify.com/projects/liv-clinic-jaeho19/deploys/6aa0fc655cfc1d000866130c).
- 결과 문서 커밋 `7699100f475abb8f9796d6c0e3f47b2382ee1ee5`도 `master`에 push했다. 앱 코드는 `b823c38`과 동일하다. 이 문서 전용 push의 Netlify 기록 `6aa0febaf3869f0009ec7d41`은 `Canceled build due to no content change`로 종료됐다(API 상태 표시는 `error`). 이는 사이트 코드 변경이 없어 새 빌드를 생략한 결과이며, 위 `ready` production 게시가 그대로 유지됨을 확인했다. 문서 커밋과 실제 배포 소스 해시를 구분한다.

## 배포 후 운영 읽기 전용 검사

| 검사 | 결과 | 증빙 |
| --- | --- | --- |
| 주요 경로·가격·다국어 | 핵심 99개, 전체 표본 142개 통과. 정상/404/410/리디렉션 상태, H1/main, title/description, canonical·OG·11개 언어와 x-default 상호 참조 정상 | `seo-stage4-final-production-http.json` |
| robots·sitemap | 운영 공개 페이지 index, 문의/관리자/빈 후기 noindex. sitemap 594개, 전체 내부 목적지 613개 상태·canonical·색인 검사 통과 | `seo-stage4-final-production-validation.json` |
| 구조화 데이터 | JSON 파싱·Schema.org 속성 적용 유형·빈 값 오류 0. 460개 FAQ 질문/답변이 초기 HTML과 일치 | `seo-stage4-final-production-schema-issues.json`, 위 validation JSON |
| 가격 보존 | 11개 언어 본문 전체와 description이 이전 기준과 동일. 금액·VAT·옵션·샷/라인 수 및 안내 변경 없음 | 위 HTTP JSON |
| 실제 다국어 이동 | 영어 가격에서 헤더 언어 메뉴로 일본어 이동 성공. `/ja/pricing`, `lang=ja`, 일본어 canonical, 가격 15행 확인 | `seo-stage4-final-production-browser.json` |
| 모바일 상호작용 | ko/en 가격, ko 의료정보, ru 의료진, ko 색소, en 문신, ko 홈/상담 8페이지에서 메뉴 열기/Escape 닫기, main/H1 각 1개, 가로 넘침 없음, hydration 오류 없음 | 위 browser JSON |
| 실제 이미지 모달 | 운영 390×844에서 이미지 로드, 닫기 버튼 전체 표시, 클릭 닫기·스크롤 복원 통과. preview 844×390 가로 화면도 동일 검사 통과 | `seo-stage4-final-production-modal-390.json/png`, `seo-stage4-final-preview-modal-landscape.json/png` |
| 대표 크롤러 요청 | Googlebot·Bingbot·Yeti·OAI-SearchBot·ChatGPT-User·PerplexityBot·GPTBot·Claude-SearchBot 8종 모두 가격 200, 운영 canonical/index 메타 정상. robots에서 가격·정적 스크립트 허용, API 차단 확인 | `seo-stage4-final-production-edges.json` |
| 호스트·언어 리디렉션 | `/` → `/ko` 307, `/pricing` → `/ko/pricing` 307, www 가격 → 주 도메인 가격 301 | 위 edges JSON |

대표 User-Agent 검사는 실제 봇 IP나 검색엔진 계정의 수집 결과를 대신하지 않는다. 운영 HTTP·schema 자동 검사 오류는 0개이다.

## 미검증 및 별도 운영 조치

- 실제 상담·채팅 시작·메일·문자·운영 DB 쓰기, 인증 후 관리자 실데이터 종단 간 동작은 실행하지 않았다.
- Google Search Console·네이버 서치어드바이저·Bing Webmaster Tools 계정 내 소유 확인/사이트맵 처리, 실제 봇 IP의 WAF 통과, CrUX/CWV 실사용 LCP·INP·CLS는 별도다. 과거 PageSpeed 429를 성공으로 바꾸지 않는다.
- 과거 DB 자격증명이 교체되었는지는 소스 수정만으로 확인할 수 없다. 운영자는 노출된 기존 자격증명을 폐기·교체했는지 확인하고, 미교체라면 회전 후 관련 배포 비밀 설정을 갱신해야 한다. 비밀값은 기록하지 않는다. 병원 정보 확인과 별개다.
- 가격 업데이트는 추후 별도 원본과 요청에 따라 진행한다. 기존 병원 사실의 재확인은 이번 완료 조건이 아니다.

## 사용자 파일 보존

시작 시 추적·미추적 파일 1,964개의 SHA-256을 `seo-stage4-final-source-before.json`에 기록했다. 기존 파일 누락은 없고 대상 외 사용자 변경과 자료는 유지한다. 빌드 생성 파일 3개는 실제 내용이 같음을 확인한 뒤 시작 시점 줄바꿈만 복구했다. 임시 검사 코드·로그·이미지·보존 ZIP과 환경 파일은 커밋하지 않는다.
