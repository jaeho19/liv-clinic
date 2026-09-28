# 포스터 1장 이벤트 「크게 보기」 새 창 — 설계

작성 2026-09-28 · 상태: 자율 구현(사용자 부재, 아래 가정 명시)

## 배경

10월 프로모션(`2026-10-promotion`)은 포스터 1장(1122×1402)에 모든 내용이 들어 있고 상세 갤러리는 0장이다.
이벤트 상세 페이지는 2단 레이아웃이라 데스크톱에서 포스터가 약 600px 폭으로 표시되어 글자가 작다.
팝업 → 이벤트 페이지로 들어온 방문자가 포스터를 더 크게 볼 방법이 없다.

같은 조사에서 발견한 부수 문제: 10월 팝업의 `link_url`이 비어 있어 팝업을 눌러도 아무 데도 가지 않는다.
원인은 팝업 관리 폼의 링크 입력이 `type="url"`이라 트리거(041)가 넣는 상대 경로 `/ko/events/<slug>`를
브라우저 유효성 검사가 거부하는 것 — 운영자가 다른 항목(노출 시작 시각)을 고치려면 링크를 지울 수밖에 없었다
(팝업 `updated_at` 12:41 > 이벤트 `updated_at` 12:20, 트리거 값과 다른 `display_start`).

## 목표

- 상세 갤러리가 없는(포스터 1장) 이벤트의 상세 페이지에서 포스터를 클릭하면 **새 창(탭)** 이 열리고,
  포스터가 원본 크기로 페이지를 꽉 채워 보인다. 모바일은 핀치 확대(뷰포트 `maximum-scale=5`)로 더 키운다.
- 갤러리가 있는 이벤트는 기존 동작(갤러리 라이트박스) 그대로.
- 팝업 링크 입력이 상대 경로를 받도록 고치고, 10월 팝업 링크를 복구한다.

## 비목표

- 갤러리 라이트박스(줌 없음)의 개선.
- 팝업에서 이벤트 페이지를 거치지 않고 바로 포스터 창을 여는 것.
- 새 번역 키 추가 — 기존 `events.viewLarger`(크게 보기), `common.viewLarger`({label} 확대 보기),
  `common.close`(닫기)가 11개 로케일에 모두 있어 그대로 쓴다.

## 가정 (사용자 확인 필요 시 되돌리기 쉬운 것들)

- "새 창" = 브라우저 새 탭(`target="_blank"`). 팝업 관리 화면의 "열기 방식: 새 창"이 `_blank`인 것과 같은 용어.
- "한 페이지로만 구성" = 현재 로케일 기준 상세 갤러리 이미지가 0장(포스터만 있는 이벤트).
- 새 창은 사이트 안의 전용 페이지다(원본 스토리지 URL을 그대로 열지 않는다) — 주소창이 `liv-clinic.net`이고
  헤더·푸터·팝업·채팅 위젯이 없는 깨끗한 화면.

## 구성

### 1. 포스터 전용 페이지 `/{locale}/events/{slug}/poster`

- 위치: `src/app/(viewer)/[locale]/events/[eventId]/poster/page.tsx` + `src/app/(viewer)/[locale]/layout.tsx`
  (루트 레이아웃이 locale 파라미터를 받아야 하므로 `[locale]` 아래에 둔다).
  `(viewer)`는 별도 **루트 레이아웃**(html/body만, `admin/layout.tsx`와 같은 방식)이라
  `[locale]/layout.tsx`의 Header·Footer·QuickConsultBar·PopupManager·ChatWidget이 붙지 않는다.
  구현 중 확인: globals.css의 레이어 밖 `body { background-color; color }` 규칙이 Tailwind 유틸리티를
  이기므로 body 색은 인라인 style로, viewport는 수동 meta 대신 `viewport` export로(Next가 기본 태그를 중복 삽입).
- 서버 컴포넌트. 발행된 이벤트를 슬러그(디코드 후)로 조회, 로케일별 포스터를 `pickLocalized`로 고른다.
  이벤트가 없거나 포스터가 없으면 `notFound()`.
- 화면: 검은 배경, 상단 고정 바(병원명 · 이벤트 제목 · 닫기 버튼), 본문은 `<img>` 하나를
  **원본 크기(최대 화면 너비)** 로 가운데 정렬. 세로가 길면 스크롤. 원본 URL을 그대로 쓴다(next/image 축소 없음).
- 닫기: `window.close()` → 닫히지 않으면(직접 접속 등) 이벤트 페이지로 이동. `Esc`도 같은 동작.
- 메타: `제목 | 병원명`, `robots: noindex, follow`. hreflang·OG 없음(얇은 페이지, 색인 대상 아님).
- 공통 조회 함수 `getPublishedEventRow(rawSlug)`를 `src/lib/eventsServer.ts`로 뽑아
  기존 상세 `page.tsx`와 공유한다(중복 제거).

### 2. `EventHero`에 `zoomHref` 선택 prop

- 값이 있고 실제 포스터가 있으면 이미지 영역을 `<Link target="_blank" rel="noopener">`로 감싼다.
  `aria-label` = `common.viewLarger({label: 이벤트 제목})`.
- 우하단에 돋보기 아이콘 + `events.viewLarger`(크게 보기) 배지를 항상 표시(호버 없는 모바일에서도 보이게).
  커서 `zoom-in`. 상태 배지(진행중/종료)는 그대로 좌상단.
- 값이 없으면 지금과 완전히 같다.

### 3. `EventDetailClient`

- `galleryImages.length === 0`일 때만 `zoomHref={`/events/${event.id}/poster`}` 전달.

### 4. 팝업 관리 폼

- 링크 입력 `type="url"` → `type="text"` + `inputMode="url"`. 안내 문구에 상대 경로 예시 추가.
- 데이터: 10월 팝업(`64beee29-…`) `link_url`을 `/ko/events/2026-10-promotion`으로 복구(서비스 키로 1회 UPDATE).
  이후 이벤트를 다시 저장하면 트리거가 같은 값을 쓴다.

## 테스트 (vitest, node 환경)

- `EventHero` 렌더 테스트(`react-dom/server` + next-intl·framer-motion·next/image 목):
  `zoomHref` 있으면 `target="_blank"`·`rel="noopener"`·aria-label·배지, 없으면 앵커 없음, 플레이스홀더면 앵커 없음.
- 의존 번역 키 3개가 11개 로케일 파일에 모두 있다.
- `EventDetailClient`는 갤러리 0장 조건으로만 `zoomHref`를 넘긴다(소스 검사, 리포 관례).
- 포스터 페이지 메타가 `index: false`다(소스 검사).
- `PopupForm` 링크 입력이 `type="url"`이 아니다(상대 경로 회귀 방지).

## 검증

`npm run test` · `npm run verify:i18n` · 변경 파일 `eslint` · `tsc --noEmit` · `next build` 후
`next start --port 3010`에서 Playwright로 데스크톱(1440)·모바일(390) 확인: 포스터 클릭 → 새 탭 → 원본 폭 표시 → 닫기.
갤러리 있는 이벤트(9월)는 배지가 없어야 한다. 배포 후 프로덕션 재확인.
