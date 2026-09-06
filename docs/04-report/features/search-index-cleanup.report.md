# 검색 색인 정리 보고서 (GSC 404 221건 · Bing 진단)

- 작업일: 2026-09-06
- 브랜치: `feature/search-index-cleanup` (워크트리 `D:\dev\LIV_homepage-seo-index`, master `ce2fb4d` 기준)
- 설계: `docs/superpowers/specs/2026-09-06-search-index-cleanup-design.md`
- 계획: `docs/superpowers/plans/2026-09-06-search-index-cleanup.md`
- 배포: **머지하지 않았다.** master 머지 = 프로덕션 배포이므로 사장님 결정으로 남긴다(§6).

## 1. 요약

브리핑의 8개 항목을 전부 코드로 반영했다. 핵심은 세 가지다.

1. **Netlify에서는 Next 미들웨어가 `netlify.toml` 리다이렉트보다 먼저 실행된다.** `/staff → /ko/about/staff` 같은 규칙이 `netlify.toml`에 이미 있었지만, 점(.)이 없는 경로는 미들웨어가 먼저 `/ko/staff`로 보내 버려 한 번도 발동하지 않았다(프로덕션 실측). 그래서 `?lang=` 별칭·레거시 경로·410을 전부 미들웨어 한 곳(`src/lib/legacyRedirects.ts`)으로 모았다.
2. **로케일 중복 URL(`/ko/ko/media`)의 출처는 링크가 아니라 JSON-LD였다.** `media/layout.tsx`가 로케일이 붙은 경로를 `generateWebPageSchema`에 넘겨 `url`이 두 번 접두됐고 구글이 그 URL을 크롤링했다. 호출부를 고치고 함수에 방어 코드를 넣었다.
3. **Bing "짧은 메타" 123페이지의 대부분은 이벤트 상세였다.** 사이트맵 601 URL을 전수 크롤링한 결과 설명 50자 미만 68건 중 52건이 `/events/*`. 한글 슬러그 이벤트 4종(5월·6월·7월 프로모션·온다 런칭)은 라우트 파라미터가 퍼센트 인코딩된 채 DB 조회에 들어가 실패 → 12자짜리 폴백 제목으로 서빙되고 있었다. 슬러그 디코드 + 설명 최소 길이 보강으로 해결했다.

입력 파일(`docs/05-handoff/p1-inputs/gsc-404.csv` 등 4종)은 이 PC와 리포 어디에도 없었다. 브리핑의 수치·URL 패턴만으로 작업했고, "기타 15건"은 확인하지 못했다.

## 2. 항목별 변경

| # | 항목 | 변경 | 파일 |
|---|---|---|---|
| 1 | `?lang=` 별칭 | `cn→zh, tw→zh-TW, jp→ja, kr→ko, vn→vi, hk/zh-hk→zh-TW` 추가. 미지 값은 쿠키 대신 `ko`(또는 URL의 기존 로케일)로 301 | `src/lib/legacyRedirects.ts` |
| 2 | 레거시 경로 | `/notice(/*)→/media`, `/review(/*)→/reviews`, `/staff`, `/equipment`, `/location→/about/*`, `/promotion`·`/layer_popup/*`·`/덴서티-이벤트`·`/직원픽-이벤트→/events`. 로케일 접두가 이미 붙은 형태(`/ja/notice`, `/ko/staff`)도 같이 처리. 게시판 파라미터는 버리고 `utm_*`만 유지 | 같은 파일 + `src/middleware.ts` |
| 3 | IndexNow | `src/lib/indexnow.ts`(`notifyIndexNow`), 키 파일 `public/e1df8e0ebf0144d48a69b03b8e4c605a.txt`, 관리자 이벤트 생성·수정·삭제와 후기 등록·수정·삭제 뒤 자동 통보, 수동 제출 스크립트 `scripts/indexnow-submit.mjs` | `src/lib/indexnow.ts`, `api/admin/events/*`, `api/admin/reviews/*`, `.env.example` |
| 4 | 메타데이터 | 이벤트 상세: 슬러그 디코드, 설명 60자 미만이면 로케일 공통 설명 덧붙임, 해당 언어 원문 없으면 한국어 대신 공통 설명. 허브 제목 12자→19~27자(`EVENTS_META`를 `src/lib/eventsMeta.ts`로 공유). `/laser/vascular`에 `metaSeo.laserVascular` 11개 로케일 신설. zh·zh-TW `metaSeo.privacy.title` 14자→교정(zh-TW 간체 오류 포함) | `src/lib/eventsMeta.ts`, `events/[eventId]/page.tsx`, `events/layout.tsx`, `laser/vascular/layout.tsx`, `src/messages/*.json` |
| 5 | `/terms` | 이용약관 페이지 신설(11개 로케일, TS 사전 `src/lib/legal/terms.ts`), 푸터 링크 활성화, 사이트맵 추가 | `[locale]/terms/page.tsx`, `Footer.tsx`, `sitemapPaths.ts` |
| 6 | 로케일 중복 | `media/layout.tsx` 호출부 수정 + `generateWebPageSchema`가 접두를 방어적으로 제거(`stripLocalePrefix`). 리다이렉트는 넣지 않음 | `media/layout.tsx`, `src/lib/seo.ts` |
| 7 | `/book` 다국어 | `/{locale}/book → /{locale}/contact?utm…`(307). `/book`의 Accept-Language 분기는 이미 프로덕션에서 동작 중이었다 | `src/middleware.ts` |
| 8 | 워드프레스 잔재 | `/archive/*`, `/feed(/*)`, `/sample-page`, `/wp-admin/*`, `/wp-content/*`, `/wp-includes/*`, `/wp-json/*`, `/wp-*.php`, `/xmlrpc.php`, `?kboard_content_redirect=` → 410(작은 HTML, noindex). `/index.php` → 301 로케일 홈(`?lang=` 존중). 점(.) 경로가 미들웨어에 오도록 matcher 확장. `netlify.toml`의 죽은 규칙 13개 삭제, `/index.php` 규칙은 예비로 유지, 실행 순서 주석 | `src/middleware.ts`, `liv-clinic/netlify.toml` |

메시지 JSON은 재직렬화 없이 바이트 보존 삽입(`git diff --numstat` 파일당 +13/-0, zh·zh-TW는 +14/-1)했고 `verify:i18n` 통과.

## 3. 검증

### 3.1 단위 테스트·정적 검사

| 검사 | 결과 |
|---|---|
| `npx vitest run` (전체) | 41 파일 543 테스트 통과 (legacyRedirects 30, eventsMeta 9, indexnow 6, seo +3, sitemapPaths +1) |
| `npx eslint <변경 파일 19개>` | 오류 0 |
| `npx tsc --noEmit` | 오류 0 |
| `npm run verify:i18n` | 11개 로케일 동기 |

### 3.2 HTTP 검증 (로컬 `next build` + `next start --port 3010`, 쿠키 없음, 요청 70건 전부 통과)

스크립트: 세션 스크래치패드 `verify-http.mjs <base>` — 프로덕션에도 같은 스크립트를 쓸 수 있다.

| 요청 | 응답 |
|---|---|
| `/notice?pageid=1&mod=document&uid=22&lang=cn` | **301 → `/zh/media`** (사용자 지정 검증 1) |
| `/notice?mod=document&uid=22&lang=ja` | **301 → `/ja/media`** (사용자 지정 검증 2) |
| `/staff` | **301 → `/ko/about/staff`** (사용자 지정 검증 3) |
| `/equipment`, `/ko/equipment`, `/ko/staff`, `/location` | 301 → `/ko/about/equipment` · `/ko/about/staff` · `/ko/about/location` |
| `/review?lang=en`, `/ja/notice?…` | 301 → `/en/reviews`, `/ja/media` |
| `/notice?pageid=1&mod=list&utm_source=naver` | 301 → `/ko/media?utm_source=naver` (게시판 파라미터 폐기, utm 유지) |
| `/layer_popup/abc`, `/promotion`, `/ko/promotion`, `/덴서티-이벤트`(인코딩) | 301 → `/ko/events` |
| `/?lang=cn` `tw` `jp` `kr` `vn` `en` `xx` | 301 → `/zh` `/zh-TW` `/ja` `/ko` `/vi` `/en` `/ko` |
| `/lifting/thermage?lang=jp&utm_source=x` | 301 → `/ja/lifting/thermage?utm_source=x` |
| `/ko/about?lang=zh-tw` | 301 → `/zh-TW/about` |
| `/index.php`, `/index.php?lang=en&p=12` | 301 → `/ko`, `/en` (미들웨어. 변경 전 로컬은 500) |
| `/archive/1` `/feed` `/sample-page` `/wp-admin` `/wp-admin/admin-ajax.php` `/wp-login.php` `/wp-cron.php` `/xmlrpc.php` `/wp-content/uploads/2020/01/a.jpg` `/wp-json/wp/v2/posts` `/?kboard_content_redirect=5` `/ko/feed` | **410** |
| `/feed/`, `/wp-admin/`, `/notice/?…` | 308 → 슬래시 제거(Next 자체 정규화) → 두 번째 홉에서 위와 같이 처리 |
| `/en/book`, `/ja/book` | 307 → `/{locale}/contact?utm_source=google&utm_medium=gbp_post&utm_campaign=foreigner` |
| `/zh-TW/book?utm_campaign=x` | 307 → `/zh-TW/contact?…&utm_campaign=x` (링크별 덮어쓰기 유지) |
| `/book` (Accept-Language: ja) | 307 → `/ja/contact?utm…` (기존 동작 유지) |
| `/ko/terms`, `/en/terms`, `/ar/terms` | 200. `/terms` → 307 `/ko/terms`. 사이트맵에 `/terms` 11개 |
| `/e1df8e0ebf0144d48a69b03b8e4c605a.txt` | 200, 본문 = 키 |
| `/ko/media`, `/mn/media` HTML | JSON-LD `url` = `/ko/media` — `/ko/ko/`·`/mn/mn/` 없음. `/ko/ko/media`는 404 유지 |
| `/ko/events/6월-프로모션` | `<title>6월 프로모션 \| 리브성형외과</title>`, description 91자 (변경 전: 폴백 제목 12자) |
| `/en/events/guerrilla-event` | description 136자 영어 (변경 전: 한국어 33자) |
| `/zh/events/2026-08-promotion` | description 83자 (변경 전 13자) |
| `/ko/events` | `이벤트·프로모션 안내 \| 리브성형외과 신사역` (변경 전 12자) |
| `/zh/laser/vascular` | `血管治疗·红血丝激光 \| LIV整形外科（江南）`, description 61자 (변경 전 21자) |
| `/zh-TW/privacy` | `隱私權政策·個人資料保護 \| LIV整形外科（首爾江南）` (변경 전 간체 14자) |
| `/ko/about`, `/ko/reviews`, `/about`, `/reviews`, `/ko/about/staff`, `/ko/laser/vascular` | 기존 동작 유지(200 / 307 로케일 접두) |

## 4. 프로덕션 실측 기록 (변경 전, 2026-09-06)

| 요청 | 응답 |
|---|---|
| `/staff` | 307 → `/ko/staff` (Netlify 규칙 미발동) |
| `/notice?pageid=1&mod=document&uid=22&lang=cn` | 307 → `/ko/notice?…&lang=cn` |
| `/notice?mod=document&uid=22&lang=ja` | 301 → `/ja/notice?…` → 404 |
| `/?lang=cn`, `/?lang=jp` | 307 → `/ko?lang=…` |
| `/index.php`, `/wp-login.php` | 301 → `/ko` (Netlify 규칙 — 점 경로만 동작) |
| `/book` (Accept-Language ja / zh-TW / 없음) | 307 → `/ja/contact` / `/zh-TW/contact` / `/en/contact` (+UTM) |
| `/en/book`, `/ko/terms`, `/ko/ko/media` | 404 |
| `/feed`, `/sample-page`, `/archive/123`, `/layer_popup/abc` | 307 → `/ko/...` → 404 |
| 사이트맵 601 URL 전수 | 전부 200. 제목 15자 미만 14, 설명 50자 미만 68(이벤트 52·vascular 4·privacy 2·media 2…) |
| `/ko/events/6월-프로모션` | `<title>이벤트 \| 리브성형외과</title>` (조회 실패 폴백), `/api/events/<인코딩 슬러그>`는 200 |

## 5. 사장님·운영자 작업 (코드로 못 하는 것)

1. **머지·배포 결정** — `git merge feature/search-index-cleanup` 후 푸시. 배포 뒤 §6 확인표.
2. **Bing Webmaster Tools → IndexNow**: 배포 후 `https://liv-clinic.net/e1df8e0ebf0144d48a69b03b8e4c605a.txt`가 열리는지 확인하고, 이 PC에서 `NODE_TLS_REJECT_UNAUTHORIZED=0 node liv-clinic/scripts/indexnow-submit.mjs --sitemap`으로 전체 URL을 1회 제출. 이후에는 관리자에서 이벤트·후기를 바꿀 때마다 자동 통보된다. Bing 진단의 "IndexNow 미설정" 항목은 첫 제출 뒤 며칠 내 사라진다.
3. **GBP 예약 링크**를 `https://liv-clinic.net/ko/contact`에서 `https://liv-clinic.net/book`으로 교체(브라우저 언어별 자동 분기 + UTM). 언어별 포스트를 나눠 쓴다면 `/en/book`, `/ja/book`, `/zh-TW/book`.
4. **이용약관 검수**: `liv-clinic/src/lib/legal/terms.ts`의 한국어 본문(제1~10조)을 읽고 병원 실정에 맞게 고칠 곳을 알려 주면 반영한다. 외국어 10개는 한국어 기준 번역이다.
5. **GSC**: 배포 1~2주 뒤 색인 → 페이지 → "찾을 수 없음(404)" 추이 확인. 이번 변경으로 221건 중 `/notice`(168)·팝업(17)·잔재(11)·`/review`(5)·`/terms`(3)·중복(2) = 206건이 301/410/200으로 바뀐다. "기타 15건"은 CSV가 없어 확인하지 못했다 — CSV를 `docs/05-handoff/p1-inputs/`에 넣어 주면 다음 세션이 마저 본다.
6. **러시아어 축소 여부**는 별도 검토(사이트맵 `/ru` 52개, hreflang, 언어 선택기 세 곳을 같이 손봐야 한다).

## 6. 배포 후 확인표 (프로덕션)

```
curl -k -sI "https://liv-clinic.net/notice?pageid=1&mod=document&uid=22&lang=cn"   # 301 → /zh/media
curl -k -sI "https://liv-clinic.net/notice?mod=document&uid=22&lang=ja"             # 301 → /ja/media
curl -k -sI "https://liv-clinic.net/staff"                                           # 301 → /ko/about/staff
curl -k -sI "https://liv-clinic.net/?lang=cn"                                        # 301 → /zh
curl -k -sI "https://liv-clinic.net/feed"                                            # 410
curl -k -sI "https://liv-clinic.net/wp-login.php"                                    # 410 (matcher 확장이 Netlify 엣지에 반영됐는지)
curl -k -sI "https://liv-clinic.net/index.php"                                       # 301 → /ko (Netlify 규칙 유지)
curl -k -sI "https://liv-clinic.net/en/book"                                         # 307 → /en/contact?utm…
curl -k -sI "https://liv-clinic.net/ko/terms"                                        # 200
curl -k -s  "https://liv-clinic.net/e1df8e0ebf0144d48a69b03b8e4c605a.txt"           # 키 문자열
curl -k -s  "https://liv-clinic.net/ko/media" | grep -o '"url":"[^"]*media"'         # /ko/media 만, /ko/ko/ 없음
curl -k -s  "https://liv-clinic.net/ko/events/6%EC%9B%94-%ED%94%84%EB%A1%9C%EB%AA%A8%EC%85%98" | grep -o "<title>[^<]*"  # 폴백 아님
```

`wp-login.php` 410이 프로덕션에서 301로 남으면 Netlify가 matcher의 점(.) 패턴을 엣지 함수 경로로 옮기지 못한 것이다 — 그때는 `netlify.toml`에 해당 경로를 `status = 404`로 두는 차선책을 쓴다(410은 Netlify 문서에 없다).

## 7. 하지 않은 것·주의

- 강남언니 4150 / 여신티켓 4667 / iCloudHospital "LV Plastic Surgery"는 다른 병원(엘브이성형외과) — 건드리지 않았다.
- 사이트맵 재제출·색인 요청은 이미 완료된 것으로 두었다.
- `/ko/ko/media` 같은 중복 URL에 리다이렉트를 넣지 않았다(생성 코드만 수정 — 지시대로). 구글이 재크롤 때 404를 보고 떨어뜨린다.
- CJK 페이지의 40~60자 설명(zh·zh-TW·ko 시술 페이지 등)은 정상 범위로 보고 손대지 않았다. Bing이 계속 잡으면 그때 `metaSeo` 값을 늘린다.
