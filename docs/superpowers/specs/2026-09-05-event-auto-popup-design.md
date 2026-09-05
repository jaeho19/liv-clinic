# 이벤트 발행 시 팝업 자동 생성 — 설계

작성 2026-09-05 · 상태: 사용자 승인(1안 "이벤트 화면에서 한 번에")

## 배경

이벤트(`events`)와 팝업(`popups`)은 데이터상 연결이 없다. 운영자는 이벤트를 발행한 뒤 팝업 관리에서
이미지 4장을 다시 올리고, 이벤트 페이지 주소를 복사해 "링크 URL" 칸에 붙여 넣어야 한다.
2026-09-05 9월 프로모션에서 이 과정이 빠져 외국어 팝업 누락·링크 누락이 생겼다.

## 목표

- 이벤트 편집 화면에서 체크 하나("팝업도 함께 띄우기")로 팝업이 자동 생성·갱신된다.
- 팝업 이미지 = 이벤트 포스터(ko/en/ja/zh), 노출 기간 = 이벤트 기간, 링크 = 이벤트 페이지.
- 발행되지 않은 이벤트의 팝업은 절대 켜지지 않는다.

## 비목표

- 팝업 관리에서 이벤트를 골라 연결하는 기능(2안)은 만들지 않는다.
- 팝업 전용 아트워크 업로드 흐름은 바꾸지 않는다(진료일정 등 수동 팝업은 그대로).

## 데이터 모델 (마이그레이션 `041_event_auto_popup.sql`)

- `events.auto_popup boolean not null default false` — "팝업도 함께 띄우기" 체크 값.
- `popups.event_id uuid null references events(id) on delete cascade` + 부분 유니크 인덱스
  (`where event_id is not null`) — 이벤트당 연동 팝업 하나. 이벤트 삭제 시 연동 팝업도 삭제.

## 동기화 규칙 (트리거 `trg_events_sync_popup`, `after insert or update on events`)

`auto_popup = true`일 때 `event_id = NEW.id`인 팝업을 upsert 한다.

| 팝업 필드 | 값 | 갱신 시 |
|---|---|---|
| `title` | `title_ko` | 덮어씀 |
| `image_url`, `image_url_en/ja/zh` | `poster_image`, `poster_image_en/ja/zh` | 덮어씀 |
| `link_url` / `link_target` | `'/ko/events/' \|\| slug` / `'_self'` | 덮어씀 |
| `display_start` | `start_date` 한국시간 00:00 | 덮어씀 |
| `display_end` | `end_date` 한국시간 23:59:59 | 덮어씀 |
| `is_active` | `is_published` | 덮어씀 |
| `width`, `show_on_mobile`, `sort_order`, `rolling_interval_ms` | 480, true, 0, 5000 | **생성 시만** (운영자 조정 보존) |
| `updated_at` | `now()` | 덮어씀 |

`auto_popup = false`이면 연동 팝업을 `is_active = false`로만 바꾼다(삭제하지 않음).
링크는 루트 상대 경로로 저장한다 — `PopupModal.localizePopupHref`가 방문자 언어로 바꿔 준다.
함수는 기본 권한(SECURITY INVOKER)으로 둔다. 이벤트를 쓰는 주체(인증된 관리자·service role)는
`popups` RLS 정책("Authenticated users can manage popups", service role)으로 이미 팝업을 쓸 수 있다.

## 관리자 화면

- `EventForm`: "발행" 옆에 "팝업도 함께 띄우기" 체크. 새 이벤트 기본 true, 기존 이벤트는 저장된 값.
  도움말: "발행하면 포스터 4장·이벤트 기간·이벤트 주소로 팝업이 자동 생성됩니다."
- 이벤트 목록 복제: 복제본은 `auto_popup: false`.
- 팝업 목록: `event_id`가 있으면 "이벤트 연동" 배지.
- `PopupForm`: `event_id`가 있으면 상단 안내 "이벤트와 연동된 팝업입니다. 이벤트를 저장하면
  제목·이미지·기간·링크가 다시 덮어써집니다(창 폭·정렬·전환 간격은 유지)."
- 타입: `src/types/supabase.ts`의 `events`(`auto_popup`)·`popups`(`event_id`) Row/Insert/Update 보강.

## 팝업 창 표시 보완 (`PopupModal`)

이미지가 창 높이(85dvh) 안에 들어가도록 축소한다: 이미지에 `max-height: calc(85dvh - 44px)`,
`width: auto`, `max-width: 100%`. 3:4 포스터가 세로 768px 화면에서도 잘리지 않는다.
기존 팝업도 잘림 대신 축소로 바뀐다.

## 9월 프로모션 적용 (데이터 작업)

1. 기존 "9월 이벤트" 팝업(`24af5104-…`)에 `event_id = 9월 프로모션 id`를 넣어 연동한다(새 팝업이
   하나 더 생기지 않게).
2. 배포 후 `events.auto_popup = true`로 바꾸면 트리거가 링크·이미지·기간을 채운다.

## 검증

- DB: 임시 이벤트로 생성 → 갱신(폭 보존 확인) → 발행 해제 → 체크 해제 → 삭제(cascade) 다섯 경우를
  확인하는 스크립트를 트랜잭션 안에서 실행하고 ROLLBACK 한다. 마이그레이션 적용 전 RED(트리거 없음 →
  실패), 적용 후 GREEN.
- 코드: eslint, tsc, `npm run test`, 프로덕션 빌드.
- 관리자 화면: 원격 관측 불가. 배포 후 사용자가 이벤트 편집에서 저장해 팝업이 채워지는지 확인.

## 배포 순서

1. 마이그레이션 041을 프로덕션 DB에 적용(기존 코드와 호환: 새 컬럼은 기본값/NULL, 트리거는
   `auto_popup=true`인 행에만 동작).
2. 9월 팝업 `event_id` 연동.
3. master 머지·푸시 → Netlify.
4. 9월 이벤트 `auto_popup=true` → 프로덕션에서 팝업 링크 확인(트리거는 DB 쪽이라 배포 전에 해도 된다).
