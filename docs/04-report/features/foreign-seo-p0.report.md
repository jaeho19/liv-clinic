# 외국인 검색 노출 개선 P0(기반 정비) 완료 보고서

> **Feature**: `foreign-seo-improvement` / Phase P0
> **Completed**: 2026-09-05
> **계획**: `docs/01-plan/features/foreign-seo-improvement.plan.md` (§5 P0), 실행 계획 `docs/superpowers/plans/2026-09-05-foreign-seo-p0.md`
> **머지 커밋**: `51bd4df` (master), 브랜치 `feature/foreign-seo-p0` 커밋 10개

---

## 1. 요약

계획서의 P0 과제 10건 중 코드로 할 수 있는 8건(P0-1~P0-8)을 모두 반영해 배포했다. 남은 2건(P0-9 측정 등록, P0-10 외부 플랫폼 병원명)은 계정이 필요한 사용자 작업이라 §6에 절차를 정리했다.

| 지표 (홈 `/en`, 로컬 프로덕션 빌드 Lighthouse 모바일) | 이전 | 이후 |
|---|---|---|
| 총 전송량 | 15,799 KiB | 5,087 KiB (−68%) |
| 성능 점수 | 59 | 65 |
| SEO 점수 | 92 (link-text 실패) | 100 |
| 이미지 | 10,556 KiB | 2,284 KiB |
| 폰트 | 2,843 KiB | 366 KiB |

남은 전송량의 큰 몫은 히어로 영상(webm 1.3MB)과 JS(0.9MB)다. 영상은 디자인 결정이라 P0 범위에서 건드리지 않았다(§7).

---

## 2. 반영 내역 (계획서 번호 기준)

| 계획 항목 | 내용 | 커밋 |
|---|---|---|
| T1 hreflang 이중 신호 | `routing.ts` `alternateLinks: false` — next-intl이 붙이던 HTTP `Link` 헤더(bare code, x-default→`/`) 제거. HTML 태그(BCP-47, x-default→`/en`)가 단일 진실 공급원 | `ca9648c` |
| T2 이벤트 상세 hreflang | 4개 언어 bare code → 공통 `buildHreflangMap` 11개 로케일 + x-default. 외국어 제목의 "리브성형외과" 하드코딩 → `getSiteName(locale)` | `ca9648c` |
| T3 옛 URL `?lang=` | 미들웨어에서 `/?lang=en|ja|zh|zh-tw`(및 `/ko/...?lang=`) → 해당 로케일 301, utm 등 다른 파라미터 유지. `src/lib/legacyRedirects.ts` + 테스트 | `6ba79f0` |
| T4 `/index.php` 500 | `netlify.toml` `/index.php`·`/xmlrpc.php` → `/ko` 301. `i18n/request.ts`의 `notFound()`를 기본 로케일 폴백으로 교체 | `6ba79f0` |
| T5 GSC 404 221건 | 목록 추출 실패(§5) → 사용자 내보내기 후 2차 처리 | — |
| T6 사이트맵 | 누락 5종(`hilowave`, `hilowave-v2`, `events/first-visit`, `inquiry`, `consult-prep`) + `/wechat`(zh 전용) + 발행 이벤트 상세(Supabase, `updated_at`→lastmod) 추가. 매 빌드 현재 시각이던 lastmod 제거. 385 → 573 URL | `33bc6dc` |
| T7 robots.txt | `/_next/`·`*.json` 차단 삭제, YandexBot·Applebot·DuckDuckBot 명시 | `12d20d2` |
| T8 이벤트 목록 SSR | `/events`를 서버 컴포넌트가 렌더(ISR 60초) → 검색엔진이 이벤트 카드를 읽음. 실패 시에만 클라이언트 재시도 | `f6673c6` |
| T9 후기 0건 noindex | 게시 후기가 0건인 외국어 로케일은 `noindex, follow`. 한국어판은 브랜드 검색 도착 페이지라 유지. 후기 게시 시 자동 해제 | `f6673c6` |
| T10 언어 링크 | 푸터에 11개 언어 `<a hrefLang>` 링크(현재 경로 유지) | `9ad254e` |
| T11 앵커 텍스트 | "Learn More" 22개 앵커에 프로그램·장비·고민명(sr-only) 추가 → Lighthouse link-text 통과 | `4407874`, `9ad254e` |
| S1 원본 사진 | `aptos/presentation-mips.jpg` 3.9MB→158KB, `presentation.jpg` 2.5MB→182KB, 히어로 포스터 237→149KB (제자리 축소, 경로 유지) | `4407874` |
| S2 시그니처 PNG | 10장(각 0.6~1.3MB) → WebP(11~55KB), 참조 교체 | `4407874` |
| S3 Pretendard 2MB | `preload: false` (아랍어 폴백에만 쓰이는 폰트가 모든 페이지에 preload되던 문제) | `6d167ca` |
| S4 Paperlogy TTF | TTF 3종(680KB×3) → 라틴 14KB + 한글 126KB × 3 weight woff2, `unicode-range`로 외국어 페이지는 라틴 조각만 | `6d167ca` |
| §2.7 일본어 | 병원명 `LIV美容クリニック` 통일(`LIV美容外科` 11곳, 스키마·이벤트 메타 포함), `サーマクール` 병기, `カロスキル`·`美容皮膚科` 추가 | `1788492` |
| §2.7 번체 | `鳳凰電波`·`電波拉提`·`除刺青`·`林蔭道` 병기 + **간체로 남아 있던 85개 값 변환**(international 80 + privacy·formExtras·metaSeo 등) | `1788492` |
| §2.7 영어 | `Garosu-gil` 추가(location·about·international), 키워드 보강 | `1788492` |
| 테스트 기반 | vitest에서 `@/i18n/routing`을 import하는 테스트가 로드조차 되지 않던 문제(next/navigation 미해석) → 스텁 + `deps.inline` | `63faee5` |

제외: **S5 번역 JSON 페이로드 축소** — 클라이언트 필수 네임스페이스가 90%라 절감이 10%뿐이고 `useTranslations()` 무인자 호출 5곳 때문에 누락 위험이 커서 P1 이후 라우트별 프로바이더로 재검토(계획 문서 Global Constraints 기록).

---

## 3. 검증 기록

### 3.1 게이트
- `npx tsc --noEmit` 오류 0
- `npx vitest run` 32 파일 / 446 테스트 통과 (기준선 28 파일 / 429 → 신규 테스트 4 파일 17개)
- `npm run verify:i18n` 11개 로케일 동기화 (값만 바꿨고 키 변경 없음; `git diff --numstat` ja +21/−21, zh-TW +96/−96, en +4/−4 — 전 라인 diff 없음)
- `npx eslint <변경 파일>` — 신규 오류 0. `SignatureDetail.tsx`의 7건은 기존 코드(impure render, setState in effect)로 이번 변경 라인이 아님
- `npm run build` 성공, 정적 페이지 504개

### 3.2 로컬 프로덕션 서버(`next start`) 확인

| 항목 | 결과 |
|---|---|
| `/en` 응답 `Link` 헤더 | 없음 |
| `/?lang=ja` | 301 → `/ja` |
| `/ko/about?lang=zh-tw&utm_source=x` | 301 → `/zh-TW/about?utm_source=x` |
| `robots.txt` `_next` 차단 | 0건, YandexBot 그룹 있음 |
| `sitemap.xml` `<loc>` | 573 (이벤트 상세 12건 × 11, wechat zh 1) |
| `/en/events` SSR HTML | 이벤트 링크 포함 |
| `/en/reviews` | `noindex, follow` |
| `/ja/lifting/thermage` 제목 | サーマクール（サーマジ）FLX \| 韓国・江南の高周波リフト \| LIV美容クリニック |
| `/ja` 제목 | LIV美容クリニック \| ソウル新沙・カロスキルの美容皮膚科 非手術アンチエイジング |
| `/zh-TW/international` | 간체 0건, 林蔭道 8회 |
| 푸터 언어 링크 | 11개, `/en/lifting/ulthera` → `/ja/lifting/ulthera` |
| `/en` HTML | Pretendard preload 0, `.ttf` 0, hreflang 태그 12 + 푸터 11 |
| 자산 | latin woff2 14KB, hangul woff2 126KB, signature webp 41KB, aptos jpg 305KB(이후 158KB로 재축소) |

### 3.3 프로덕션 확인
배포 후 결과는 §8에 기록.

---

## 4. 알게 된 것 (다음 작업자를 위해)

- `/index.php`가 500이던 진짜 원인: next-intl `requestLocale`이 헤더를 읽는데 `[locale]` 라우트가 정적(ISR)이라 "Page changed from static to dynamic at runtime" 오류가 난다. 미지원 로케일 세그먼트(점 있는 경로는 미들웨어가 건너뜀)에서 발생. Netlify 301로 알려진 경로는 막았고, 근본 해결은 `dynamicParams=false`(단, 하위 `[eventId]`에 영향 여부 확인 필요) 또는 미들웨어 매처 확장 — P1에서 검토.
- zh-TW 파일은 간체(zh)에서 자동 변환된 것이라 변환이 빠진 값이 85개 있었다. OpenCC `s2twp`(관용구)는 "项目"을 "專案"으로 바꾸므로 `s2tw` + 직접 용어 보정을 써야 한다. 검출은 간체 전용 글자 정규식으로 한다(`zh-tw-international-fix.py`).
- 번역 JSON 값 치환은 `scripts/_i18n-work/apply-value-edits.mjs`(바이트 보존, 1회 일치 검증)로 한다. 키워드 토큰처럼 여러 곳에 있는 값은 `all: true, expect: n`.
- Windows에서 sharp로 같은 경로에 덮어쓰면 `UNKNOWN` 오류 — 파일을 버퍼로 먼저 읽는다.
- `next dev`는 `.next/dev/lock`을 잡는다. 다른 세션이 띄운 dev 서버(포트 3000, 57초 응답·500)가 남아 있어 로컬 검증은 `next build` + `next start --port 3010`으로 했다. 백그라운드 명령을 `| head`로 파이프하면 서버가 죽는다.
- vitest는 node_modules를 외부화하므로 next-intl(ESM)의 `next/navigation` import를 해석하지 못한다 → `server.deps.inline: ['next-intl']` + alias 스텁.

---

## 5. 하지 못한 것

| 항목 | 이유 | 대안 |
|---|---|---|
| GSC 404 목록(221건) 추출 | Search Console 드릴다운 표가 Chrome 확장에서 텍스트로 추출되지 않음(쿼리스트링 차단) | 사용자가 GSC → 페이지 색인 → "찾을 수 없음(404)" → 내보내기(CSV) 후 전달하면 리다이렉트 맵 작성 |
| 프로덕션 PageSpeed Insights 절대값 | API 익명 할당량 초과, 로컬 Lighthouse는 사내 프록시 영향 | 배포 후 https://pagespeed.web.dev 에서 `/en` 직접 측정 권장 |
| S5 메시지 페이로드 | §2 참조 | P1 |

---

## 6. 사용자만 할 수 있는 작업

| # | 작업 | 방법 | 효과 |
|---|---|---|---|
| U1 | Bing Webmaster Tools 등록 | https://www.bing.com/webmasters → "Import from Google Search Console" → liv-clinic.net 선택 (5분) | Bing·DuckDuckGo·ChatGPT 검색(Bing 색인 사용) 노출 |
| U2 | Yandex Webmaster 등록 | https://webmaster.yandex.com → 사이트 추가 → HTML 메타 인증. 인증 코드를 주면 `layout.tsx`에 반영 | `ru` 로케일 |
| U3 | GA4 속성 소유권 | 측정 ID `G-CFDDPRHZ6C`가 속한 속성 소유자(대행사 추정)에게 jaeho19@gmail.com 편집자 권한 요청 | 외국어 리드 전환 측정(현재 관리자 분석 0) |
| U4 | 외부 플랫폼 병원명 | 강남언니 글로벌 `hospitals/4150`, Yeoshin `hospitals/4667`, iCloudHospital: "LV Plastic Surgery" → "LIV Plastic Surgery" 수정 요청 | 브랜드 신호 통합 |
| U5 | GSC 사이트맵 재제출 | Search Console → Sitemaps → `https://liv-clinic.net/sitemap.xml` 재제출 | 새 URL 188개 조기 발견 |
| U6 | GSC 404 내보내기 | 페이지 색인 → 찾을 수 없음(404) → 내보내기 → 전달 | T5 처리 |
| U7 | Google Business Profile | 이름 "LIV Plastic Surgery (리브성형외과)", 언어 속성 English/日本語/中文, 예약 링크 `/book` | 지도 검색 |

---

## 7. 다음 단계 (P1 착수 전 결정)

1. **히어로 영상(1.3MB)**: 모바일에서는 포스터만 보여주고 영상은 데스크톱에서만 내려받을지 결정(총 전송량 5.0 → 3.7MB). 디자인 판단이라 보류.
2. **P1 콘텐츠**: 가이드 허브 `/{locale}/guides/` 20편(en·ja·zh-TW), 시술 페이지 외국인 블록, 가격 페이지, 이벤트 설명 3~5문장(현재 1줄), 언어별 OG 이미지. 원장 검수 시간(주 2~3편) 확인 필요.
3. **P2 외부 신뢰도**: 코네스트·Creatrip·제조사 인증병원 등재, 일본어 인스타·LINE.

---

## 8. 프로덕션 검증 (2026-09-05, 배포 완료 직후 `liv-clinic.net`)

| 항목 | 결과 |
|---|---|
| 배포 마커 `/fonts/Paperlogy-4Regular-latin.woff2` | 200, 14,276B |
| `/en` 응답 `Link` 헤더 | 없음 |
| `/?lang=en` | 301 → `/en` |
| `/ko?lang=ja` | 301 → `/ja` |
| `/index.php` | 301 → `/ko` (이전 500) |
| `/no-such-locale.txt` | 500 (알려진 한계, §4 첫 항목) |
| `robots.txt` | `_next` 차단 0, YandexBot 그룹 있음 |
| `sitemap.xml` `<loc>` | 573 (이전 385) |
| `/en/events` SSR HTML | 이벤트 링크 포함 |
| `/en/reviews` / `/ko/reviews` | `noindex, follow` / `index, follow` |
| `/ja/lifting/thermage` 제목 | サーマクール（サーマジ）FLX \| 韓国・江南の高周波リフト \| LIV美容クリニック |
| `/ja` 제목 | LIV美容クリニック \| ソウル新沙・カロスキルの美容皮膚科 非手術アンチエイジング |
| `/zh-TW/international` 간체 | 0건 |
| `/en/lifting/ulthera` 푸터 언어 링크 | 11개(`/ja/lifting/ulthera` 포함) |
| `/en` HTML | Pretendard preload 0, `.ttf` 0, sr-only 앵커 30 |
| `aptos/presentation-mips.jpg` | 157,983B (이전 3,932,031B) |
| Lighthouse 모바일 `/en` (사내 프록시 경유, 변화폭만 유효) | 총 전송 **4,558 KiB** (이전 15,799), SEO **100** (이전 92), link-text 통과. 남은 큰 항목: 영상 1,313 KiB, 이미지 1,806 KiB, JS 871 KiB |
