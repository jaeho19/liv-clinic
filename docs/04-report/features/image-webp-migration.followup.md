# 후속 점검: 이미지 WebP 감량 — Free 복귀 판단

> **Feature**: `image-webp-migration`
> **Phase**: Follow-up (검증 대기)
> **작업 완료**: 2026-09-03
> **점검 예정**: **2026-09-10** (1주) · 최종 판단 **2026-09-17** (2주)
> **Owner**: jaeho19@gmail.com

---

## 0. 지금 당장 할 일 (30초)

**① Supabase에서 숫자 하나를 확인한다**

[Supabase 대시보드](https://supabase.com/dashboard) → 좌상단에서 조직 **"jaeho19's Org"** 선택
→ **Usage** → **Cached Egress**

(프로젝트 ref `aravkffjmaslddgbhtgz`, org id `qlegdpajlazijqwzqgbc`. 프로젝트 단위가 아니라
**조직 단위 Usage** 를 봐야 한다 — 한도가 조직에 걸리기 때문이다.)

- ⚠️ **퍼센트는 보지 말 것.** 현재 Pro 플랜이라 한도가 250GB여서 어떤 값이든 0%대로 보인다.
- 봐야 하는 것은 **절대값(GB)** 과 **청구주기 시작일** 두 가지다.

**② Claude Code를 열고 아래를 그대로 붙여넣는다**

```
docs/04-report/features/image-webp-migration.followup.md 를 읽고 후속 점검을 진행해줘.

Supabase Usage에서 확인한 값:
- Cached Egress: ___ GB
- 청구주기: ___ ~ ___
```

빈칸만 채우면 된다. 나머지는 Claude가 스크립트를 돌려서 자동으로 확인한다.

---

## 1. 왜 이 점검을 하는가

2026-08에 Supabase 프로젝트가 **Cached Egress 5.786 / 5 GB (116%)** 초과로
Fair Use 위반 전면 정지(HTTP 402)됐다. 사이트 전체가 멈췄다.

원인은 업로드 파이프라인에 이미지 변환이 없어서, 4~5MB짜리 원본이 그대로 쌓이고
그대로 서빙된 것이다. **저장 용량은 27%였는데 전송량만 116%였던 게 그 증거다.**

2026-09-03에 두 가지를 했다.

1. **청소** — 기존 이미지 144장을 WebP로 일괄 변환. 실 서빙 **128.4MB → 9.3MB (92.8% 감량)**
2. **재발 방지** — 업로드 시 WebP 변환을 강제하도록 코드 수정 (PR #35, 배포 완료)

지금은 **Pro로 업그레이드해 둔 상태**라 5GB 한도가 적용되지 않는다(Pro는 250GB).
그래서 이 점검의 진짜 질문은 하나다:

> **Free로 다시 내려가도 안전한가?**

Free 복귀 시 월 $25를 아낀다. (org에 크레딧 $23.39가 있어 첫 달은 거의 상쇄되므로 급하지는 않다.)

---

## 2. 판단 기준

| Cached Egress (절대값) | 월 환산 | 판단 |
|---|---|---|
| 1주 뒤 **0.5GB 미만** | ~2GB | ✅ **Free 복귀 안전** |
| 1주 뒤 0.5 ~ 1.2GB | 2~5GB | ⚠️ 아슬아슬 — 2주 더 보고 판단 |
| 1주 뒤 **1.2GB 초과** | 5GB↑ | ❌ 예상과 다름 — 원인 재조사 필요 |

### 예상치와 그 근거

8월 수치를 역산하면 이렇다.

```
5.786 GB ÷ 평균 1.1MB ≈ 원본 5,260회 fetch/월
                       ≈ 이미지 1장당 월 36회
```

이미지가 144장인데 장당 36번씩 원본을 다시 받아갔다. 이유는 **`cacheControl`이 3600초(1시간)** 였기 때문이다.
사이트는 `next/image`를 통해서만 이미지를 부르는데(직접 호출 0건, 브라우저에서 실측),
Netlify 이미지 최적화기가 원본의 캐시 헤더를 존중해서 **1시간마다 원본을 다시 가져갔다.**

이번에 두 축이 동시에 줄었다.

- **파일 크기** ×0.072 (92.8% 감량)
- **재요청 빈도** 1시간 → 1년 (`max-age=31536000`)

그래서 같은 트래픽이면 **수십 MB 수준**이 나와야 정상이다.

> ⚠️ 이건 추정이다. Netlify 최적화기가 긴 캐시를 실제로 얼마나 존중하는지,
> 배포마다 원본을 다시 받는지는 측정하지 못했다. **그래서 실측이 필요하다.**

---

## 3. Claude가 자동으로 확인하는 것

사람이 볼 숫자는 egress 하나뿐이고, 나머지는 스크립트가 확인한다.

```bash
cd D:\dev\LIV_homepage\image-migration
NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/10-followup-check.mjs
```

> 이 PC는 TLS 가로채기 프록시 뒤에 있어 `NODE_TLS_REJECT_UNAUTHORIZED=0` 이 **반드시** 필요하다.
> 빼면 `TypeError: fetch failed` 로 즉시 죽는데, 에러에 TLS 언급이 없어 네트워크 장애로 오인하기 쉽다.

점검 항목:

| # | 확인 내용 | 정상 기준 |
|---|---|---|
| 1 | 스토리지 현황 | 참조 144개 / 9.3MB, 고아 89개 / 129MB |
| 2 | **배포 이후 신규 업로드가 규칙을 지키는가** | 전부 `image/webp` + `max-age=31536000` |
| 2 | 배포 이후 `temp/` 에 새로 쌓이는가 | 0개 |
| 3 | DB 참조 URL 전수 헬스체크 | 144건 전부 200/206 + webp |

**#2가 이 점검의 핵심이다.** 청소는 이미 끝났고, 파이프라인이 실제로 작동하는지는
누군가 이벤트를 새로 등록해봐야 알 수 있다. 그때 올라간 파일이 webp가 아니면 파이프라인이 샌 것이다.

2026-09-03 시점 기준값(작업 직후):

```
전체 233개 138.3MB · 참조 144개 9.3MB · 고아 89개 129.0MB
배포 이후 신규 업로드 0개  ← 아직 실사용 검증 전
참조 URL 144건 전부 정상
```

---

## 4. 결과별 다음 행동

### ✅ egress가 충분히 낮다 (0.5GB 미만/주)

Free 복귀를 진행한다. 순서가 중요하다.

1. **고아 89개(129MB) 먼저 삭제** — Free는 Storage 한도가 1GB다. 지우면 138MB → 9.3MB
   ```bash
   cd D:\dev\LIV_homepage\image-migration
   NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/07-delete.mjs --all          # 드라이런
   NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/07-delete.mjs --all --commit # 실행
   ```
   되돌릴 수 없으므로 드라이런 결과를 먼저 확인할 것. 로컬 백업이 있으면 복구는 가능하다.
2. Supabase 대시보드에서 Pro → Free 다운그레이드
3. 다운그레이드 직후 `10-followup-check.mjs` 를 한 번 더 돌려 이미지가 안 깨졌는지 확인
4. 확인되면 로컬 백업 `image-migration/backup/` (257.4MB) 삭제해도 된다

### ❌ egress가 여전히 높다

Claude에게 아래를 조사시킨다.

- **Netlify 이미지 최적화기가 원본을 얼마나 자주 재요청하는지** — 가장 유력한 용의자.
  Supabase Logs에서 `/storage/v1/object/public/` 요청의 User-Agent와 빈도를 본다
- **배포할 때마다 Netlify 이미지 캐시가 비워지는지** — 그렇다면 배포 빈도가 egress를 좌우한다
- 봇/크롤러 트래픽 — `x-robots-tag: none` 이 붙어 있지만 무시하는 봇이 있다
- 그래도 안 되면 이미지를 Netlify(`public/images/`)나 별도 CDN으로 옮기는 선택지

### ⚠️ 신규 업로드가 webp가 아니다 (파이프라인이 샜다)

`liv-clinic/src/lib/imageCompress.ts` 의 `compressForUpload` 가 패스스루로 빠지고 있다는 뜻이다.
정상적인 패스스루 조건은 GIF / 디코딩 실패 / 변환 후 더 커짐 세 가지뿐이다.
관리자 브라우저의 콘솔과 실제 파일 형식을 확인한다.

---

## 5. 참고 — 이번 작업에서 실제로 밟은 함정

다시 만지게 되면 또 걸릴 것들이다.

1. **`curl -I` / `fetch(HEAD)` 로 캐시 헤더를 검증하면 안 된다.**
   Supabase/Cloudflare는 HEAD 응답에 **항상** `cache-control: no-cache` 를 붙인다.
   정상 업로드도 실패로 보인다. **1바이트 Range GET**(`Range: bytes=0-0`)을 쓰면
   실제 헤더가 오고 전송량도 사실상 0이다.
2. **WebP는 한 변 16383px 제한.** 세로로 긴 이벤트 상세 이미지가 걸린다(1920×20322짜리가 실재).
   `fit: 'inside'` + height 상한으로 비율을 유지한 채 넣어야 한다.
3. **참조 판정에서 `gallery_images{,_en,_ja,_zh}` 배열 4개를 빠뜨리면 안 된다.**
   과거 조사가 이걸 놓쳐 살아있는 이미지 36장을 지울 뻔했다.
   컬럼을 손으로 열거하지 말고 `information_schema` 에서 동적으로 읽을 것.
4. **PostgreSQL 문자열 리터럴의 정규식 백슬래시가 꼬인다.** `'[^"?\\s]'` 는
   "s를 제외"로 해석돼 `events/...` 가 `event` 에서 끊긴다. POSIX 클래스(`[:space:]`)를 쓸 것.
5. **Supabase Image Transformation(`?width=`) 금지.** Pro 전용이라
   Free로 내리는 순간 이미지가 전부 깨진다. 파일 자체를 변환해야 한다.

---

## 6. 관련 파일

| 위치 | 내용 |
|---|---|
| `image-migration/scripts/10-followup-check.mjs` | **후속 점검 스크립트** (이 문서의 3장) |
| `image-migration/scripts/01~09` | 마이그레이션 전 단계 스크립트 (전부 재실행 가능, 검증 게이트 포함) |
| `image-migration/backup/` | 원본 233개 / 257.4MB (sha256 검증됨) — Free 복귀 확정까지 보관 |
| `image-migration/CLAUDE.md` | 작업 전제와 금지사항 |
| `liv-clinic/src/lib/imageCompress.ts` | 변환 규격(`PRESETS`) — **단일 진실 공급원** |
| `liv-clinic/src/components/admin/ImageUploader.tsx` | 업로드 지점 (프로젝트 전체에서 여기 한 곳뿐) |
| `liv-clinic/src/app/api/admin/images/finalize/route.ts` | `temp/` → 정식 폴더 이동 |
| PR [#35](https://github.com/jaeho19/liv-clinic/pull/35) | 파이프라인 수정 (2026-09-03 머지) |

> `image-migration/` 은 `.gitignore` 대상이다(백업 257MB 때문). 로컬에만 있으므로
> 다른 PC에서 작업하려면 `scripts/` 를 따로 옮겨야 한다.
