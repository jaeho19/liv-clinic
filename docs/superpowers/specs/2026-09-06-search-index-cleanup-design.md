# 검색 색인 정리(GSC 404·Bing 진단) 설계

- 날짜: 2026-09-06
- 브랜치: `feature/search-index-cleanup` (워크트리 `D:\dev\LIV_homepage-seo-index`)
- 입력: 사용자 실측 브리핑(GSC 404 221건 구조, Bing 진단). `docs/05-handoff/p1-inputs/`의 CSV 4종은 이 PC·리포 어디에도 없어 브리핑 수치만 근거로 삼았다.

## 실측으로 확정한 전제

| 사실 | 근거 |
|---|---|
| Netlify에서는 Next 미들웨어(엣지 함수)가 `netlify.toml` `[[redirects]]`보다 먼저 실행된다 | `/staff` → 307 `/ko/staff`(미들웨어 로케일 접두), Netlify의 `/staff → /ko/about/staff` 규칙은 발동하지 않음. 점(.)이 있는 `/index.php`, `/wp-login.php`만 Netlify 301이 동작 |
| `?lang=cn/jp/…` 미매핑 시 쿠키 로케일로 흘러감 | `/?lang=cn` → 307 `/ko?lang=cn` |
| `/book`은 이미 Accept-Language 분기 중 | ja → `/ja/contact?utm…`, 헤더 없음 → `/en/contact`. `/en/book`만 404 |
| 로케일 중복 URL의 출처는 링크가 아니라 JSON-LD | `media/layout.tsx`가 `generateWebPageSchema({ path: \`/${locale}/media\` })`로 호출 → `url`이 `/ko/ko/media` |
| Bing "짧은 메타" 123페이지는 이벤트 상세가 대부분 | 사이트맵 601 URL 전수 크롤: 설명 50자 미만 68건 중 52건이 `/events/*`. 한글 슬러그 이벤트 4종×11로케일은 `getEvent`가 퍼센트 인코딩된 슬러그로 조회해 실패 → 폴백 제목 `이벤트 \| 리브성형외과`(12자) |
| Netlify redirects는 410을 문서화하지 않음 | 410은 미들웨어에서 직접 응답 |

## 결정

### [1]+[2] `?lang=` 별칭 + 레거시 경로 → `src/lib/legacyRedirects.ts` 한 곳
- 별칭: `cn→zh, tw→zh-TW, jp→ja, kr→ko, vn→vi` + 기존(ko/en/ja/zh/zh-cn/zh-hans/zh-tw/zh-hant) + `zh-hk→zh-TW`, `ru/th/fr/mn/ar` 자기 자신.
- 레거시 경로(로케일 접두 유무 무관): `/notice(/*)`→`/media`, `/review(/*)`→`/reviews`, `/staff`→`/about/staff`, `/equipment`→`/about/equipment`, `/location`→`/about/location`, `/promotion`·`/layer_popup(/*)`·`/덴서티-이벤트`·`/직원픽-이벤트`→`/events`.
- 로케일 결정 순서: `?lang` 별칭 → URL의 기존 로케일 접두 → `ko`. 쿠키·Accept-Language는 쓰지 않는다(크롤러에게 결정적 301을 주기 위해; 옛 사이트 기본 언어가 한국어). `?lang` 값이 미지이면 lang만 떼고 같은 규칙으로 301.
- 쿼리: 레거시 경로 매핑 시 `utm_*`만 유지(게시판 파라미터 폐기). 일반 경로의 `?lang=`만 제거하는 경우는 기존처럼 나머지 유지.
- 모두 301. `[1]`과 `[2]`는 한 함수 `resolveLegacyRequest()`가 직렬로 처리한다.

### [8] 워드프레스 잔재 410
- 미들웨어에서 `410 Gone`(작은 HTML) 응답: `/archive/*`, `/feed(/*)`, `/sample-page`, `/wp-admin/*`, `/wp-content/*`, `/wp-includes/*`, `/wp-json/*`, `/wp-*.php`, `/xmlrpc.php`, `?kboard_content_redirect=`.
- 점(.)이 있는 경로는 기본 matcher에서 빠지므로 matcher에 `wp-*.php`·`xmlrpc.php`·`wp-content/*` 등을 명시한다.
- `netlify.toml`의 죽은 레거시 규칙(about/staff/…/reviews, wp-admin/wp-login/wp-content)은 삭제하고 실행 순서를 주석으로 남긴다. `/index.php`→`/ko` 301, www, `/`→`/ko`, 헤더는 유지.

### [3] IndexNow
- 키 파일 `public/<key>.txt`(키는 공개값), `src/lib/indexnow.ts`의 `notifyIndexNow(urls)` → `https://api.indexnow.org/indexnow`. `NODE_ENV=production`일 때만 전송, `INDEXNOW_DISABLED=1`로 끔, 실패는 로그만(응답을 막지 않음, 5초 타임아웃).
- 호출 지점: 관리자 이벤트 생성·수정·삭제(`/events`, `/events/<slug>` × 11로케일), 후기 등록·수정·삭제(`/reviews` × 11).
- `scripts/indexnow-submit.mjs`: 사이트맵 전체 또는 지정 URL을 수동 제출(배포 직후 1회).

### [4] 메타데이터
- 이벤트 상세: 슬러그 `decodeURIComponent` 후 조회. 설명이 60자 미만이거나 해당 로케일 원문이 없으면 그 로케일의 이벤트 공통 설명(`EVENTS_META`)을 덧붙인다/대체한다. `EVENTS_META`는 `src/lib/eventsMeta.ts`로 옮겨 허브·상세가 공유하고, 허브 제목(ko/zh/zh-TW 12자)을 늘린다.
- `/laser/vascular`: `metaSeo.laserVascular`를 11개 메시지 파일에 바이트 보존 삽입하고 다른 레이저 페이지처럼 `buildLocalizedMetadata`를 쓴다.
- `metaSeo.privacy.title` zh·zh-TW(14자, zh-TW가 간체)를 교정한다.
- 나머지 CJK 40~60자 설명은 정상 범위로 보고 손대지 않는다.

### [5] `/{locale}/terms` 신설
- 내용은 `src/lib/legal/terms.ts` TS 사전(11로케일; 메시지 JSON은 혼합 EOL이라 늘리지 않는다). 페이지 `src/app/[locale]/terms/page.tsx`는 privacy 페이지 구조를 따른다. 푸터 링크 활성화, 사이트맵에 `/terms` 추가.

### [6] 로케일 중복
- `media/layout.tsx`가 로케일 없는 `path`를 넘기도록 고친다. `generateWebPageSchema`는 넘어온 path의 로케일 접두를 방어적으로 제거한다(테스트 포함). 리다이렉트는 넣지 않는다(사용자 지시).

### [7] `/{locale}/book`
- `/book`과 같은 처리(UTM 부착, 307)를 로케일 고정으로. GBP 예약 링크를 `/ko/contact`에서 `/book`으로 바꾸는 것은 사용자 작업.

## 검증
- 로컬 `next build` + `next start --port 3010`에 실제 HTTP 요청(쿠키 없음): 사용자 지정 3건 + 별칭·410·book·terms·IndexNow 키·JSON-LD 중복 부재·한글 슬러그 이벤트 제목.
- 단위 테스트: legacyRedirects, generateWebPageSchema 접두 제거, eventsMeta 설명 보강, indexnow URL 구성·게이팅, sitemapPaths `/terms`.
- 배포는 사용자가 master 머지로 결정한다(외부 노출 변경).

## 하지 않는 것
- 강남언니 4150·여신티켓 4667·iCloudHospital "LV Plastic Surgery"는 다른 병원 — 무관.
- 사이트맵 재제출·색인 요청(완료됨), 러시아어 축소(별도 검토).
