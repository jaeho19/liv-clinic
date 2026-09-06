# 외국인 검색 노출 개선 P1(콘텐츠) 진행 보고서

> **Feature**: `foreign-seo-improvement` / Phase P1
> **작성**: 2026-09-06 (브랜치 작업 완료 시점 — 머지·배포는 사장님 승인 후 §8에 추가)
> **계획**: `docs/01-plan/features/foreign-seo-improvement.plan.md` §5 P1, 실행 계획 `docs/superpowers/plans/2026-09-06-foreign-seo-p1.md`, 사장님 결정 `docs/05-handoff/foreign-seo-p1-user-inputs.md` §E
> **브랜치**: `feature/foreign-seo-p1` (master `e6af139` 기준)

---

## 1. 요약

계획서 P1 과제 6건(P1-1 가이드 허브, P1-2 시술 페이지 외국인 블록, P1-3 가격 페이지, P1-4 후기, P1-5 이벤트 설명, P1-6 OG 이미지)을 브랜치에서 모두 구현했다. 가이드는 계획서의 6편(1·3·9·11·16·18)이 사실상 2주제의 언어별 판이라 **6주제 × 4개 언어(en·ja·zh·zh-TW) = 24편**으로 재구성했고, 전부 `status: draft`(직접 URL로만 열림, noindex)로 두어 **사장님 검수 후 `published`로 바꾸면** 허브·사이트맵·hreflang에 자동 포함된다. 사이트에 근거가 없는 의료 수치(비행 시점·붓기 일수·음주 제한 등)는 문장을 만들지 않고 `[검수 필요: …]` 표식으로 남겼으며, 표식이 남은 채 게시하면 빌드가 실패하도록 막았다.

이벤트(9월 프로모션) 외국어 설명은 DB가 아니라 포스터에만 조건이 있어 포스터를 읽고 초안을 문서로 만들었고, **DB 반영과 master 머지·배포는 승인 후**에 한다.

## 2. 반영 내역 (계획 번호 기준)

| 계획 항목 | 내용 | 커밋 |
|---|---|---|
| P1-1 파이프라인 | `content/guides/{locale}/{slug}.md` → `tsx scripts/compile-guides.mjs`(prebuild) → `src/lib/guides/guides.generated.ts` + 클라이언트용 소형 색인. Markdown 부분집합 파서(외부 패키지 없음) + 테스트 7개. `published`에 `[검수 필요]`가 남으면 빌드 실패 | `c1e9b84` |
| P1-1 근거 시트 | `scripts/dump-guide-facts.mjs`가 코드·메시지(가격·시술 정보·international·의료 Q&A 전체·의료진)에서 `content/guides/_facts.md`를 생성. 가이드는 이 시트의 값만 쓴다 | `4dfcc06`, `440b5dd` |
| P1-1 라우트 | `/{en,ja,zh,zh-TW}/guides`(허브)·`/guides/[slug]`(상세, `dynamicParams=false` — 다른 7개 로케일·없는 slug는 404). Article(저자 기본 병원, `reviewer: dr-kim`이면 원장 Physician)·MedicalWebPage·FAQPage 스키마, 로케일 제한 hreflang(`buildHreflangMap(path, locales)`), 사이트맵은 게시본만, 게시 0편 언어의 허브는 noindex. 푸터·국제환자 페이지 링크는 게시 가이드가 있을 때만 | `fcb89f3`, `e450c5b` |
| P1-1 초안 24편 | 6주제(울쎄라 가격·일정 / 에이전시 없이 예약 / 울쎄라·써마지·슈링크 비교 / 보톡스·필러 가격 / 피코 타투 제거 / 다운타임·비행·모델 일정) × 4개 언어. 주제당 작성 서브에이전트 1 + 독립 검토 서브에이전트. 언어별로 검색 의도에 맞춰 다시 씀(직역 아님) | `c3996ef`, `62c963f` 외 |
| P1-2 시술 블록 | 시술 상세 17종(리프팅 8·안티에이징 4·레이저 5)에 `InternationalNotice`: 동일 가격표·VAT 별도, 소요 시간·당일/재방문(사이트 표기 6종), 통역·채널, 결제, Q&A 2개(FAQ 스키마에도 병합), 게시 가이드 링크. en·ja·zh·zh-TW 외에는 렌더하지 않음. 비행 시점은 넣지 않음(D6) | `91d4cdb` |
| P1-3 가격 페이지 | `/pricing` 외국어 4개 로케일에 "동일 가격·VAT 별도·해외 카드·통역 무료" 블록 + meta description 보강. 참고 환산은 넣지 않음(D3, 가이드 본문에서만 기준일과 함께) | `0bf0a55` |
| P1-4 후기 직접 등록 | `/admin/reviews`에 "후기 직접 등록" 폼(표시 이름·언어·나라·시술·별점·내용·받은 날짜·바로 게시·치료 확인). `POST /api/admin/reviews`(세션 필수, zod 검증, `source='onsite'`). **출처·동의 항목 없음**(지시). 게시 시 후기 페이지 재생성 → 해당 언어 noindex 자동 해제(P0 T9) | `3648057` |
| P1-5 이벤트 | 9월 프로모션 외국어 설명 초안(ko·en·ja·zh) + 반영 절차 문서 `docs/05-handoff/event-2026-09-foreign-copy.md`, 반영 스크립트 `apply-event-2026-09-copy.mjs`(dry-run 기본). 이벤트 상세 meta가 zh-TW·vi 등에서 한국어로 떨어지던 폴백 버그 수정 | `5ad4ce4` |
| P1-6 OG 이미지 | `public/images/og/og-{en,ja,zh,zh-TW}.jpg` 1200×630(sharp, 시스템 CJK 폰트로 렌더 확인). `defaultOgImage(locale)`가 4개 언어에만 적용, 나머지는 기존 `og-image.jpg` | `66b2ed7` |
| P0 후속 | zh-TW.json 간체 잔존 11곳(國際患者須知·주소·결제수단·stay 표 등) 번체 교정 + 스캔 스크립트 `zh-tw-simplified-scan.py` | `e917509` |

## 3. 검증 기록

### 3.1 게이트 (브랜치 최종, 커밋 19개)
- `npx tsc --noEmit` 오류 0
- `npx vitest run` 39 파일 / 499 테스트 통과 (기준선 32 / 446 → 신규 7 파일 53개: 가이드 파서·색인·언어 전환, hreflang·OG, 사이트맵, 시술 블록 사전·17종 삽입 검사, 가격 안내, 후기 입력 스키마, 이벤트 폴백)
- `npm run verify:i18n` 11개 로케일 in sync (zh-TW는 값만 13줄 변경, `git diff --numstat` 13/13)
- 브랜치에서 바뀐 소스 62개 파일 `npx eslint`: 오류 11건 전부 기존 코드 줄(`MobileMenu.tsx` 176행 admin 링크 3, `PigmentationDetail.tsx` 68–69행 impure render 2, `SkinToneDetail.tsx` 521–531행 key 3, 그 밖 기존 any) — 이번 변경 줄에는 0건
- 가이드 게이트: `compile-guides` 24편(0 published, 24 draft), zh-TW 간체 스캔 0건, 표식 외 한국어 0건, 금지 표현 grep 0건, 내부 링크 전부 허용 목록 안
- `npm run build` 성공(§3.3)

### 3.2 로컬 프로덕션 서버(`next start --port 3010`) 1차 확인 (가이드 8편 시점)

| 항목 | 결과 |
|---|---|
| `/en|ja|zh|zh-TW/guides` | 200 / `/ko/guides`·`/vi/guides` 처음 200 → `dynamicParams=false`로 고쳐 404 (최종 빌드에서 재확인) |
| `/en/guides` robots (게시 0편) | `noindex, follow` |
| `/ja/guides/ultherapy-cost-seoul` (초안) | 200, `noindex, nofollow`, "検収中" 띠, head hreflang 2개(자기+x-default), Article/FAQPage/MedicalWebPage 각 1, `og:type=article`, 표식 노출 |
| `/ko/guides/ultherapy-cost-seoul`, 없는 slug | 404 |
| 사이트맵 `/guides` | 0건(게시 0편) |
| `/zh-TW/lifting/ulthera` 블록 | "國際患者須知" 표시 / `/ko/lifting/ulthera`에는 없음 |
| `/en/lifting/thermage` JSON-LD | 외국인 Q&A 병합됨 / `/en/laser/tattoo`·`/ja/antiaging/skincare` 블록 표시 |
| `/ja/pricing` | VAT 안내 + 외국인 블록 |
| OG | `/zh` → `og-zh.jpg`, `/ko` → `og-image.jpg`, 파일 200(54KB) |
| `/zh-TW/events/2026-09-promotion` description | 중문(간체 폴백) — 이전엔 한국어 |
| `POST /api/admin/reviews` 무세션 | 401 |
| `/zh-TW/international` 간체 | 본문 0건(남은 1건은 privacy 메시지 페이로드 — P0 정책상 제외 항목) |

### 3.3 최종 빌드·로컬 확인·Lighthouse (24편 완료, 커밋 `a6f081d`)

- `npm run build` 성공: prebuild `[compile-guides] 24 guide(s) (0 published, 24 draft)`, 정적 페이지 **532**(P0 504 + 허브 4 + 가이드 24). 빌드 로그의 Supabase fetch 오류는 로컬 TLS 프록시 탓(P0와 동일, 배포 환경 무관).
- `next start --port 3010` 확인표(`D:\dev\LIV_homepage\p1-local-checks.sh`):

| 확인 | 결과 |
|---|---|
| `/en|ja|zh|zh-TW/guides` | 200 |
| `/ko/guides`, `/vi/guides` | **404** (1차 200 → `dynamicParams=false` 후) |
| `/en/guides` robots (게시 0편) | `noindex, follow` |
| `/ja/guides/ultherapy-cost-seoul` (초안) | 200, `noindex, nofollow`, "検収中" 띠, head hreflang 2(자기+x-default) + 푸터 언어 링크는 현재 언어 1개만, Article/FAQPage/MedicalWebPage 각 1, `og:type=article`, 표식 6개 노출 |
| `/ko/guides/ultherapy-cost-seoul`, `/en/guides/no-such-guide` | 404 |
| 사이트맵 `/guides` | 0건(게시 0편) — `<loc>` 441은 로컬에서 이벤트 132건이 빠진 값 |
| `/zh-TW/lifting/ulthera` 외국인 블록 | 표시(6) / `/ko/lifting/ulthera` 0 |
| `/en/lifting/thermage` JSON-LD 외국인 Q&A | 병합됨 / `/en/laser/tattoo`·`/ja/antiaging/skincare` 블록 표시 |
| `/ja/pricing` | VAT 안내 8회(기존 + 새 블록), meta description 보강 |
| OG | `/zh` → `og-zh.jpg`, `/ko` → `og-image.jpg`, `og-en.jpg` 200(54KB) |
| `/zh-TW/events/2026-09-promotion` description | 중문(간체 폴백) |
| `POST /api/admin/reviews` 무세션 | 401 |
| `/zh-TW/international` 간체 | 본문 0건(HTML 페이로드의 1건은 privacy 메시지 — P0 정책상 제외) |

- Lighthouse 12 데스크톱, 로컬 `/en`(사내 프록시 경유, 변화폭만 유효): 성능 0.87, SEO 1.0, 총 전송 **4,405 KiB**, LCP 2.2s — P0 배포 직후(4,558 KiB, SEO 100)와 같은 수준. 새 블록·페이지로 늘어난 무게 없음.
- 스크린샷(상위 폴더): `p1-guide-ja.png`(가이드 데스크톱, 초안 띠 포함), `p1-guide-ja-mobile.png`(390px), `p1-block-en.png`(울쎄라 페이지의 외국인 블록 — 9월 이벤트 팝업이 겹쳐 찍혔는데, 그 팝업 영문판에 "SEPTEMBER EVENT TBA" 배지가 그대로 보인다), `p1-pricing-zhtw.png`(가격 안내 블록; 표 영역은 스크롤 애니메이션 전이라 비어 보임 — 헤드리스 캡처 한계).

## 4. 알게 된 것 (다음 작업자를 위해)

- **9월 프로모션 조건은 DB에 없다.** `events.description_*`는 "리브성형외과 9월 프로모션" 한 줄이고 조건은 포스터 8장에만 있다. 포스터 상단 배지가 "9월 이벤트 미정 / SEPTEMBER EVENT TBA"로 남아 있다(아트워크 오류 추정).
- **후기 테이블은 0건**(모든 언어). 외국어 후기 페이지 noindex는 관리자가 후기를 게시하는 순간 풀린다.
- `notFound()`만으로는 프리렌더된 `[locale]` 하위 페이지가 200으로 서빙됐다(`/ko/guides`). 일부 로케일에만 있는 라우트는 `generateStaticParams` + `dynamicParams=false`로 막아야 404가 된다.
- 푸터의 11개 언어 `<a hrefLang>`(P0 T10)와 헤더 언어 전환기는 "같은 경로의 다른 언어"를 가정한다. 일부 언어에만 있는 페이지에서는 404 링크를 만들므로 `localeSwitchPath`로 존재하는 언어만 잇게 했다.
- sharp의 SVG 텍스트는 Windows 시스템 CJK 폰트(Yu Gothic·Microsoft JhengHei·YaHei)를 그대로 쓴다 — OG 이미지에 Playwright 스크린샷이 필요 없었다.
- 사이트 원문 불일치(가이드 검토 중 발견, 시술 페이지 값을 따름): 써마지 마취(시술 페이지 "무마취" vs 의료 Q&A lifting-pain "마취크림 30분"), 울쎄라 지속 기간(시술 페이지 "1–2년" vs Q&A lifting-duration "약 1년"). ja.json에는 옛 병원명 `リブ形成外科`가 31곳 남아 있다(P0에서 alternateName으로 허용한 표기 — 가격 페이지 설명 등 본문 노출은 재검토 대상).
- `international.stay.rows`의 zh-TW 값에 간체(水光针 등)가 남아 있었다 — P0 스캔은 international의 일부만 봤다. 이번에 만든 스캔 스크립트로 전체를 잡았다.
- Git Bash의 `grep '[가-힣]'`은 CJK를 오탐한다(한글 검사는 node 정규식으로). Windows 콘솔은 cp949라 Python 출력에 `sys.stdout.reconfigure('utf-8')`가 필요하다.
- 로컬 빌드 시 Supabase fetch가 TLS 프록시로 실패해 사이트맵의 이벤트 132건·후기 페이지가 빠진다(로컬 한정, P0와 같음).

## 5. 하지 못한 것 / 보류

| 항목 | 이유 | 대안 |
|---|---|---|
| 이벤트 포스터 배지 "9월 이벤트 미정 / SEPTEMBER EVENT TBA" | 아트워크 파일(4개 언어 포스터) 수정은 이미지 제작 작업 | 포스터 재생성 후 관리자에서 교체 |
| 이벤트 zh-TW 컬럼 | DB 변경은 사장님 결정(D4) | 필요 시 마이그레이션 042 + 관리자 폼 + 폴백 순서 |
| 가격 페이지 참고 환산 | 환율 갱신 부담·B1 미답(D3) | 가이드 본문에서만 기준일과 함께 |
| T5(GSC 404 리다이렉트 맵), Bing·Yandex 인증, GA4 속성 | 사장님 자료 대기(A1~A5) | 계획 Task 15 |
| 후기 언어별 필터 | 후기 0건 상태라 판단 보류(D7) | 후기 누적 후 재검토 |

## 6. 사장님 결정 (2026-09-06 오후, 모두 반영)

1. **가이드 검수 → "가장 일반적인 내용으로 반영"**: 기준표 `liv-clinic/content/guides/_review-answers.md`(21개 주제)를 만들고, 주제별 서브에이전트가 표식 117건을 표식 없는 일반 안내 문장으로 바꿨다. 의학적 일반 안내(비행·붓기·음주/사우나)는 "일반적으로/보통 + 개인차 + 상담에서 확인", 병원 고유 규정(유닛 수·취소 위약금·모바일 결제·세금 환급·제품명·'1부위' 기준)은 단정 없이 "상담에서 확인/견적"으로 썼다. **24편 전부 `published`**(커밋 `f951124`). 되돌리려면 파일의 `status`를 `draft`로.
2. **상담비 문구**: 외국인 상담에도 동일 적용 확인 → 유지.
3. **이벤트 설명 DB 반영 승인** → §8에 반영 기록. 포스터 배지 "9월 이벤트 미정/SEPTEMBER EVENT TBA"는 아트워크 파일이라 별도 수정 필요(미해결).
4. **fr·ar 로케일**: 현행 유지.
5. **머지·배포 승인** → §8.

## 7. 다음 단계
1. 승인 → master 머지 → Netlify 배포 → 프로덕션 확인표(§8) → 모바일 LCP.
2. 검수 완료 편부터 `published` 전환(빌드마다 사이트맵·허브 자동 반영) → GSC 색인 요청.
3. A 자료 도착 시 Task 15(404 맵·Bing·Yandex·GA4).
4. P2(외부 신뢰도): GBP 다국어, 코네스트·Creatrip, 제조사 인증병원 페이지.

## 8. 프로덕션 검증
(배포 후 기록)
