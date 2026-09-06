# 검색 색인 정리 실행 계획 (2026-09-06)

설계: `docs/superpowers/specs/2026-09-06-search-index-cleanup-design.md`
작업 위치: 워크트리 `D:\dev\LIV_homepage-seo-index`, 브랜치 `feature/search-index-cleanup`
빌드 env: `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 NODE_TLS_REJECT_UNAUTHORIZED=0`

| # | 작업 | 파일 | 검증 |
|---|---|---|---|
| 1 | `resolveLegacyRequest()` — lang 별칭·레거시 경로·410 판정 (테스트 먼저) | `src/lib/legacyRedirects.ts`, `src/lib/__tests__/legacyRedirects.test.ts` | vitest |
| 2 | 미들웨어 통합: 410 응답, 301, `/{locale}/book`, matcher에 wp 점 경로 | `src/middleware.ts` | HTTP |
| 3 | Netlify 죽은 규칙 정리 + 순서 주석 | `liv-clinic/netlify.toml` | 배포 후 `/index.php` 301 유지 |
| 4 | JSON-LD 로케일 중복: 호출부 수정 + 방어 + 테스트 | `media/layout.tsx`, `src/lib/seo.ts`, `seo.test.ts` | vitest, HTTP로 `/ko/media` JSON-LD 검사 |
| 5 | 이벤트 메타: `eventsMeta.ts`(제목 보강·설명 보강 함수·테스트), 상세 페이지 슬러그 디코드·폴백 | `src/lib/eventsMeta.ts`, `events/layout.tsx`, `events/[eventId]/page.tsx` | vitest, HTTP `/ko/events/6월-프로모션` 제목 |
| 6 | `metaSeo.laserVascular` 11개 삽입(바이트 보존) + privacy zh/zh-TW 제목 교정, vascular 레이아웃 전환 | `src/messages/*.json`, `laser/vascular/layout.tsx` | `verify:i18n`, `git diff --numstat` +N/-0(삽입)·+2/-2(교정) |
| 7 | `/terms` 페이지: TS 사전 11로케일, 페이지, 푸터 링크, 사이트맵 | `src/lib/legal/terms.ts`, `[locale]/terms/page.tsx`, `Footer.tsx`, `sitemapPaths.ts`(+test) | HTTP `/ko/terms`·`/en/terms` 200 |
| 8 | IndexNow: 라이브러리·키 파일·관리자 훅·수동 스크립트·env 문서 | `src/lib/indexnow.ts`(+test), `public/<key>.txt`, `api/admin/events/*`, `api/admin/reviews/*`, `scripts/indexnow-submit.mjs`, `.env.example` | vitest, HTTP `/<key>.txt` |
| 9 | 빌드·HTTP 전수 검증(아래 표), lint(변경 파일), 전체 vitest | — | 결과를 보고서에 기록 |
| 10 | 보고서·사용자 작업 목록, 커밋, 브랜치 푸시(머지는 사용자) | `docs/04-report/features/search-index-cleanup.report.md` | — |

## HTTP 검증표 (로컬 3010, 쿠키 없음)

| 요청 | 기대 |
|---|---|
| `/notice?pageid=1&mod=document&uid=22&lang=cn` | 301 → `/zh/media` → 200 |
| `/notice?mod=document&uid=22&lang=ja` | 301 → `/ja/media` → 200 |
| `/staff` | 301 → `/ko/about/staff` → 200 |
| `/equipment`, `/ko/equipment`, `/location` | 301 → `/ko/about/...` |
| `/review?lang=en` | 301 → `/en/reviews` |
| `/?lang=cn` `/?lang=tw` `/?lang=jp` `/?lang=kr` `/?lang=vn` | 301 → `/zh` `/zh-TW` `/ja` `/ko` `/vi` |
| `/?lang=xx` | 301 → `/ko` |
| `/lifting/thermage?lang=jp&utm_source=x` | 301 → `/ja/lifting/thermage?utm_source=x` |
| `/layer_popup/abc`, `/promotion`, `/ko/promotion` | 301 → `/ko/events` |
| `/archive/1` `/feed` `/sample-page` `/wp-login.php` `/xmlrpc.php` `/wp-content/uploads/a.jpg` `/?kboard_content_redirect=5` | 410 |
| `/en/book`, `/ja/book` | 307 → `/{locale}/contact?utm_source=google&utm_medium=gbp_post&utm_campaign=foreigner` |
| `/ko/terms`, `/en/terms`, `/ar/terms` | 200 |
| `/<key>.txt` | 200, 본문 = key |
| `/ko/media` HTML | `"url":"…/ko/media"`만 있고 `/ko/ko/` 없음 |
| `/ko/events/6월-프로모션` | `<title>`이 폴백이 아님 |
| `/ko/about`, `/ko/reviews`, `/gallery` | 기존 동작 유지 |
