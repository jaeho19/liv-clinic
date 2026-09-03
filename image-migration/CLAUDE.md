# liv-clinic 이미지 최적화

> 이 폴더는 `D:\dev\LIV_homepage\image-migration\` 이며 **.gitignore 대상**이다.
> 실제 웹사이트 코드는 `D:\dev\LIV_homepage\liv-clinic\` 에 있다.

## 문제
- Supabase 공개 버킷 3개(events, popups, before-after)에 이미지 233장 / 257MB
- 전부 원본 그대로. PNG 146장(158MB), JPEG 87장(99MB), 평균 1.1MB, 최대 4.93MB
- 월 cached egress 5.79GB → Free 한도 5GB 초과로 프로젝트가 402 제한을 받았음
- **근본 원인**: `liv-clinic/src/components/admin/ImageUploader.tsx` 가 원본 File을
  그대로 `supabase.storage.upload`에 넘긴다. 검증은 `maxSizeMb`(기본 5MB) 크기 체크뿐

## 현재 상태 (2026-09-03)
- **Pro 플랜으로 업그레이드됨 → 402 해제, Storage API 정상 동작**
- 목표는 egress를 낮춰 **다시 Free로 내려가는 것**이므로 Pro 전용 기능에 의존하면 안 된다

## 목표
- 전 이미지를 WebP로 변환 + 표시 크기로 리사이즈 → 월 egress 1GB 미만
- DB의 이미지 URL을 새 경로로 교체
- 업로드 파이프라인 수정 (원본이 다시 쌓이지 않게)

## 절대 금지
- Supabase Image Transformation(`?width=`, `?format=` URL 파라미터) 사용 금지.
  Pro 전용 기능이라 Free로 내리면 전부 깨진다. 파일 자체를 변환할 것.
- SERVICE_ROLE 키를 프론트엔드 코드나 커밋에 넣지 말 것. `liv-clinic/.env.local` 에만 둔다.
- 원본 삭제는 검증이 끝난 뒤 마지막 단계에서만.
- sharp 변환 시 `.rotate()` 생략 금지 (EXIF 회전 — 시술 전후 사진이 눕는다).

## 이미지가 참조되는 위치 (public 스키마)
- `events`: `gallery_images` / `_en` / `_ja` / `_zh` (**text[]**),
            `poster_image` / `_en` / `_ja` / `_zh`, `thumbnail_image`
- `popups`: `image_url` / `_en` / `_ja` / `_zh`
- `before_after`: `image_url`
- `marketing_contents.url`, `reviews.video_url`, `notification_templates.video_url`
  (이미지가 아닐 수 있으니 값에 `/storage/v1/object/public/` 이 들어간 것만 대상)
- 참조값에는 Supabase URL이 아닌 로컬 `/images/...` 경로도 섞여 있다 — 대조 대상 아님

> ⚠️ **`gallery_images*` 배열 컬럼 4개를 빠뜨리면 참조 판정이 틀린다.**
> 과거 조사가 이걸 놓쳐 `events/temp` 참조본을 14개로 계산했으나 실제로는 50개였다.
> 그대로 지웠으면 살아있는 갤러리 이미지 36장이 날아갔다.

## 참조/고아 실측 (2026-09-03, 배열 컬럼 포함)
| 버킷/prefix | 고아 | 고아 MB | 참조됨 | 참조 MB |
|---|---|---|---|---|
| events/temp | 75 | 103.5 | 50 | 50.8 |
| events/aprilevent | 10 | 24.8 | 5 | 4.6 |
| popups/new | 3 | 0.5 | 10 | 9.7 |
| 그 외 | 1 | 0.2 | 79 | 63.4 |
| **합계** | **89** | **129.0** | **144** | **128.5** |

(STEP 2에서 재측정해 확정한다)

## 환경 — 이 PC 고유 함정
- Node 24.19, sharp 0.34.5, pg 는 `liv-clinic/node_modules` 에 있다
- 이 PC는 **TLS 가로채기 프록시 뒤**에 있다:
  - Node 스크립트의 `fetch`가 전부 막힌다 → `NODE_TLS_REJECT_UNAUTHORIZED=0 node script.mjs`
  - `curl`도 막힌다 → `curl -k`
  - pg 직접 접속은 `ssl: { rejectUnauthorized: false }`
- 자격증명은 `liv-clinic/.env.local` 의 `NEXT_PUBLIC_SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
- 프로젝트 ref: `aravkffjmaslddgbhtgz`
- 배포는 **Netlify**

## 단계별 산출물
| 단계 | 스크립트 | 산출물 |
|---|---|---|
| 1 | `scripts/01-backup.mjs` | `backup/<bucket>/...`, `backup/manifest.json` |
| 2 | `scripts/02-refmap.mjs` | `refmap.json` (참조/고아 목록) |
| 3 | `scripts/03-convert.mjs` | `dist/...`, `imgmap.csv` |
| 4 | `scripts/04-upload.mjs` | 업로드 + `cacheControl: 31536000` |
| 5 | `scripts/05-dburl.sql` | DB URL 교체 |
| 6 | `scripts/06-verify.mjs` | HEAD 전수 검증 |
| 7 | `scripts/07-delete.mjs` | 원본 삭제 (검증 통과 후에만) |
| 8 | — | `liv-clinic/` 업로드 파이프라인 수정 |
