# 이벤트 발행 시 팝업 자동 생성 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이벤트 편집 화면의 "팝업도 함께 띄우기" 체크 하나로, 발행된 이벤트의 포스터·기간·주소를 가진 팝업이 자동 생성·갱신되게 한다.

**Architecture:** 동기화 규칙은 PostgreSQL 트리거(`events` AFTER INSERT/UPDATE → `popups` upsert) 한 곳에 둔다. 관리자 화면은 체크박스·배지·안내 문구만 추가하고, 팝업 창은 이미지가 창 높이에 맞게 축소되도록 손본다. 스펙: `docs/superpowers/specs/2026-09-05-event-auto-popup-design.md`.

**Tech Stack:** Next.js 16 / React 19 / TypeScript, Supabase(PostgreSQL 트리거·RLS), Vitest, Playwright(npx 캐시 playwright-core + chromium-1228), `pg` 로 DB 직접 접근.

## Global Constraints

- 모든 npm 명령은 `D:\dev\LIV_homepage\liv-clinic` 에서 실행한다. Node 스크립트·빌드는 TLS 프록시 때문에 `NODE_TLS_REJECT_UNAUTHORIZED=0`(스크립트) / `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1`(빌드)를 붙인다.
- DB 접근은 `D:/dev/LIV_homepage/image-migration/scripts/lib.mjs` 의 `pg()` 를 재사용한다(`.env.local` 의 `DATABASE_URL`, 여러 줄 따옴표 값 안전 파서).
- 마이그레이션은 추가형·멱등(`IF NOT EXISTS`, `CREATE OR REPLACE`). 기존 행은 `auto_popup=false` 라 트리거가 아무것도 바꾸지 않는다.
- 팝업 링크는 루트 상대 경로 `'/ko/events/' || slug` (도메인 하드코딩 금지). `PopupModal.localizePopupHref` 가 방문자 언어로 바꾼다.
- 생성 시에만 넣는 값: `width 480`, `show_on_mobile true`, `sort_order 0`, `rolling_interval_ms 5000`. 갱신 시 덮어쓰는 값: `title, image_url(+en/ja/zh), link_url, link_target, display_start, display_end, is_active, updated_at`.
- 노출 기간은 한국시간: `display_start = start_date 00:00:00 KST`, `display_end = end_date 23:59:59 KST`.
- 포스터(`poster_image`)가 없는 이벤트는 팝업을 만들지 않는다(기존 연동 팝업은 꺼진다).
- 관리자 문구는 쉬운 한국어(전문용어 회피). 파일 EOL 은 기존 파일 그대로(CRLF 파일은 CRLF 유지).
- 커밋 메시지는 리포 관례(`feat(scope): 한국어 요약`) + `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

### Task 1: 마이그레이션 041 + DB 검증 스크립트 (트리거)

**Files:**
- Create: `liv-clinic/supabase/migrations/041_event_auto_popup.sql`
- Create: `D:\dev\LIV_homepage\event-auto-popup-db-check.mjs` (검증 스크립트, 커밋하지 않음 — 상위 폴더 관례)

**Interfaces:**
- Produces: `events.auto_popup boolean not null default false`, `popups.event_id uuid null` (FK cascade, 부분 유니크), 함수 `public.sync_event_popup()`, 트리거 `trg_events_sync_popup`.

- [ ] **Step 1: 실패하는 검증 스크립트 작성**

`D:\dev\LIV_homepage\event-auto-popup-db-check.mjs`:

```js
// 이벤트 → 팝업 자동 동기화 트리거 검증. 트랜잭션 안에서 임시 이벤트로 5가지 경우를 확인하고 항상 ROLLBACK 한다.
// 실행: NODE_TLS_REJECT_UNAUTHORIZED=0 node event-auto-popup-db-check.mjs   (종료코드 0 PASS / 1 FAIL)
const { pg } = await import('file:///D:/dev/LIV_homepage/image-migration/scripts/lib.mjs');
const c = await pg();
const fails = [];
const check = (name, ok, detail = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? '  (' + detail + ')' : ''}`); if (!ok) fails.push(name); };
const slug = `zz-autopopup-check-${Date.now()}`;
const popupOf = async (eventId) => (await c.query('select * from popups where event_id=$1', [eventId])).rows[0];
try {
  await c.query('BEGIN');
  // 1) 생성: auto_popup + 발행 → 팝업 생성
  const { rows: [ev] } = await c.query(`
    insert into events (slug, title_ko, description_ko, poster_image, poster_image_en, poster_image_ja, poster_image_zh,
      start_date, end_date, category, featured, is_published, sort_order, auto_popup)
    values ($1, '검증 이벤트', '검증', 'https://x/ko.webp', 'https://x/en.webp', 'https://x/ja.webp', 'https://x/zh.webp',
      '2026-09-10', '2026-09-20', 'all', false, true, 0, true)
    returning id`, [slug]);
  let p = await popupOf(ev.id);
  check('생성: 팝업 행이 생김', !!p);
  check('생성: 제목=title_ko', p?.title === '검증 이벤트');
  check('생성: 이미지 4장=포스터', p?.image_url === 'https://x/ko.webp' && p?.image_url_en === 'https://x/en.webp' && p?.image_url_ja === 'https://x/ja.webp' && p?.image_url_zh === 'https://x/zh.webp');
  check('생성: 링크=/ko/events/slug', p?.link_url === `/ko/events/${slug}` && p?.link_target === '_self');
  check('생성: 시작=9/10 00:00 KST', p && new Date(p.display_start).toISOString() === '2026-09-09T15:00:00.000Z', p && new Date(p.display_start).toISOString());
  check('생성: 종료=9/20 23:59:59 KST', p && new Date(p.display_end).toISOString() === '2026-09-20T14:59:59.000Z', p && new Date(p.display_end).toISOString());
  check('생성: 활성=발행', p?.is_active === true);
  check('생성: 기본값 폭480/모바일/정렬0/5000', p?.width === 480 && p?.show_on_mobile === true && p?.sort_order === 0 && p?.rolling_interval_ms === 5000);
  // 2) 갱신: 운영자가 바꾼 폭은 유지, 제목·영어 포스터는 덮어씀
  await c.query('update popups set width=520 where event_id=$1', [ev.id]);
  await c.query(`update events set title_ko='검증 이벤트 v2', poster_image_en='https://x/en2.webp', end_date='2026-09-25' where id=$1`, [ev.id]);
  p = await popupOf(ev.id);
  check('갱신: 제목 덮어씀', p?.title === '검증 이벤트 v2');
  check('갱신: 영어 포스터 덮어씀', p?.image_url_en === 'https://x/en2.webp');
  check('갱신: 종료일 덮어씀', p && new Date(p.display_end).toISOString() === '2026-09-25T14:59:59.000Z');
  check('갱신: 폭 520 유지', p?.width === 520, String(p?.width));
  check('갱신: 팝업은 여전히 하나', (await c.query('select count(*)::int as n from popups where event_id=$1', [ev.id])).rows[0].n === 1);
  // 3) 발행 해제 → 팝업 꺼짐
  await c.query('update events set is_published=false where id=$1', [ev.id]);
  check('발행 해제: 팝업 비활성', (await popupOf(ev.id))?.is_active === false);
  await c.query('update events set is_published=true where id=$1', [ev.id]);
  check('재발행: 팝업 활성', (await popupOf(ev.id))?.is_active === true);
  // 4) 체크 해제 → 팝업 꺼짐(삭제 아님)
  await c.query('update events set auto_popup=false where id=$1', [ev.id]);
  p = await popupOf(ev.id);
  check('체크 해제: 팝업 남아 있고 비활성', !!p && p.is_active === false);
  // 5) 포스터 없는 이벤트는 팝업을 만들지 않음
  const { rows: [ev2] } = await c.query(`insert into events (slug, title_ko, description_ko, start_date, end_date, category, featured, is_published, sort_order, auto_popup)
    values ($1, '포스터 없음', '', '2026-09-10', '2026-09-20', 'all', false, true, 0, true) returning id`, [slug + '-noposter']);
  check('포스터 없음: 팝업 미생성', !(await popupOf(ev2.id)));
  // 6) 삭제 → 연동 팝업 삭제(cascade)
  await c.query('delete from events where id=$1', [ev.id]);
  check('삭제: 팝업 같이 삭제', !(await popupOf(ev.id)));
} catch (e) {
  console.log('ERROR', e.message); fails.push('exception');
} finally {
  await c.query('ROLLBACK');
  await c.end();
}
console.log(fails.length ? `\nFAIL ${fails.length}건` : '\nPASS');
process.exit(fails.length ? 1 : 0);
```

- [ ] **Step 2: RED 확인 (트리거·컬럼이 아직 없어 실패해야 함)**

Run: `cd D:\dev\LIV_homepage && NODE_TLS_REJECT_UNAUTHORIZED=0 node event-auto-popup-db-check.mjs`
Expected: `ERROR column "auto_popup" of relation "events" does not exist` → `FAIL 1건`, exit 1

- [ ] **Step 3: 마이그레이션 작성**

`liv-clinic/supabase/migrations/041_event_auto_popup.sql`:

```sql
-- ============================================
-- 041: 이벤트 발행 시 팝업 자동 생성
-- 설계: docs/superpowers/specs/2026-09-05-event-auto-popup-design.md
-- 전부 추가형·멱등. 기존 행은 auto_popup=false 라 트리거가 아무것도 바꾸지 않는다.
-- ============================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS auto_popup BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.popups
  ADD COLUMN IF NOT EXISTS event_id UUID NULL REFERENCES public.events(id) ON DELETE CASCADE;

-- 이벤트당 연동 팝업 하나
CREATE UNIQUE INDEX IF NOT EXISTS popups_event_id_uidx
  ON public.popups (event_id) WHERE event_id IS NOT NULL;

-- 이벤트 저장 → 연동 팝업 upsert. 호출자 권한(SECURITY INVOKER)으로 동작한다.
-- 이벤트를 쓰는 인증 관리자·service role 은 popups RLS 로 이미 쓰기가 가능하다.
CREATE OR REPLACE FUNCTION public.sync_event_popup()
RETURNS TRIGGER AS $$
DECLARE
  v_start TIMESTAMPTZ;
  v_end   TIMESTAMPTZ;
BEGIN
  -- 체크 해제 또는 포스터 없음 → 연동 팝업은 끄기만 한다(삭제하지 않음)
  IF NOT NEW.auto_popup OR NEW.poster_image IS NULL OR NEW.poster_image = '' THEN
    UPDATE public.popups
       SET is_active = false, updated_at = now()
     WHERE event_id = NEW.id AND is_active = true;
    RETURN NEW;
  END IF;

  -- 한국시간 기준 시작일 00:00:00 ~ 종료일 23:59:59
  v_start := (NEW.start_date::timestamp) AT TIME ZONE 'Asia/Seoul';
  v_end   := ((NEW.end_date + 1)::timestamp) AT TIME ZONE 'Asia/Seoul' - INTERVAL '1 second';

  INSERT INTO public.popups (
    event_id, title,
    image_url, image_url_en, image_url_ja, image_url_zh,
    link_url, link_target, display_start, display_end, is_active,
    width, show_on_mobile, sort_order, rolling_interval_ms
  ) VALUES (
    NEW.id, NEW.title_ko,
    NEW.poster_image, NEW.poster_image_en, NEW.poster_image_ja, NEW.poster_image_zh,
    '/ko/events/' || NEW.slug, '_self', v_start, v_end, NEW.is_published,
    480, true, 0, 5000
  )
  ON CONFLICT (event_id) WHERE event_id IS NOT NULL DO UPDATE SET
    title         = EXCLUDED.title,
    image_url     = EXCLUDED.image_url,
    image_url_en  = EXCLUDED.image_url_en,
    image_url_ja  = EXCLUDED.image_url_ja,
    image_url_zh  = EXCLUDED.image_url_zh,
    link_url      = EXCLUDED.link_url,
    link_target   = EXCLUDED.link_target,
    display_start = EXCLUDED.display_start,
    display_end   = EXCLUDED.display_end,
    is_active     = EXCLUDED.is_active,
    updated_at    = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_events_sync_popup ON public.events;
CREATE TRIGGER trg_events_sync_popup
  AFTER INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.sync_event_popup();
```

- [ ] **Step 4: 프로덕션 DB 에 적용**

`D:\dev\LIV_homepage\apply-migration-041.mjs` (일회용):

```js
import { readFileSync } from 'node:fs';
const { pg } = await import('file:///D:/dev/LIV_homepage/image-migration/scripts/lib.mjs');
const sql = readFileSync('D:/dev/LIV_homepage/liv-clinic/supabase/migrations/041_event_auto_popup.sql', 'utf8');
const c = await pg();
await c.query('BEGIN'); await c.query(sql); await c.query('COMMIT');
const { rows } = await c.query(`select tgname from pg_trigger where tgrelid='public.events'::regclass and not tgisinternal`);
console.log('triggers:', rows.map(r => r.tgname).join(', '));
await c.end();
```

Run: `cd D:\dev\LIV_homepage && NODE_TLS_REJECT_UNAUTHORIZED=0 node apply-migration-041.mjs`
Expected: `triggers: trg_events_sync_popup`

- [ ] **Step 5: GREEN 확인**

Run: `cd D:\dev\LIV_homepage && NODE_TLS_REJECT_UNAUTHORIZED=0 node event-auto-popup-db-check.mjs`
Expected: 모든 줄 `ok`, 마지막 `PASS`, exit 0. (스크립트는 ROLLBACK 하므로 실제 데이터에 흔적이 없다 — `select count(*) from events where slug like 'zz-autopopup-check-%'` 가 0 인지 확인.)

- [ ] **Step 6: 커밋**

```bash
cd D:\dev\LIV_homepage
git add liv-clinic/supabase/migrations/041_event_auto_popup.sql
git commit -m "feat(events): 이벤트 발행 시 팝업 자동 생성 트리거(041)" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: 타입 + 이벤트 편집 체크박스 + 복제 시 해제

**Files:**
- Modify: `liv-clinic/src/types/supabase.ts` — `events` 블록(약 613행~) Row/Insert/Update 에 `auto_popup`, `popups` 블록(약 1385행~) Row/Insert/Update 에 `event_id`
- Modify: `liv-clinic/src/components/admin/EventForm.tsx:56-58` (form 초기값), `:414-423` (토글)
- Modify: `liv-clinic/src/app/admin/(authenticated)/events/page.tsx:57` (복제 insert)

**Interfaces:**
- Consumes: Task 1 의 컬럼.
- Produces: `EventRow.auto_popup: boolean`, `PopupRow.event_id: string | null` (Task 3 가 사용).

- [ ] **Step 1: 타입 보강**

`src/types/supabase.ts` 의 `events` 블록에서 `is_published: boolean` 바로 아래(Row)에 `auto_popup: boolean`, Insert/Update 의 `is_published?: boolean` 아래에 `auto_popup?: boolean` 을 넣는다. `popups` 블록에서 Row 의 `rolling_interval_ms: number` 아래에 `event_id: string | null`, Insert/Update 의 `rolling_interval_ms?: number` 아래에 `event_id?: string | null` 을 넣는다. (다른 테이블의 같은 이름 키를 건드리지 않도록 블록 안에서만 편집한다.)

- [ ] **Step 2: EventForm 체크박스**

form 초기값(`is_published: event?.is_published ?? false,` 다음 줄):

```ts
    auto_popup: event?.auto_popup ?? true, // 새 이벤트는 기본 체크, 기존 이벤트는 저장된 값
```

토글 영역의 "발행" label 다음에:

```tsx
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.auto_popup}
            onChange={(e) => updateField('auto_popup', e.target.checked)}
            className="rounded border-[#e5e5e5]"
          />
          팝업도 함께 띄우기
        </label>
      </div>
      <p className="text-xs text-[#b4b4b4]">
        팝업도 함께 띄우기: 발행하면 포스터 4장·이벤트 기간·이벤트 주소로 첫 화면 팝업이 자동으로 만들어집니다.
        발행 전에는 팝업이 꺼진 채 준비만 되고, 체크를 풀면 팝업이 꺼집니다. 창 폭이나 순서는 팝업 관리에서 바꿀 수 있습니다.
      </p>
```

(원래 토글 `</div>` 를 위 코드의 `</div>` 로 대체한다 — 안내 문구는 토글 묶음 바깥에 둔다.)

- [ ] **Step 3: 복제 시 해제**

`src/app/admin/(authenticated)/events/page.tsx` 복제 insert 의 `is_published: false,` 아래에:

```ts
        auto_popup: false, // 복제본마다 꺼진 팝업이 쌓이지 않게
```

- [ ] **Step 4: 검사**

Run: `cd D:\dev\LIV_homepage\liv-clinic && npx tsc --noEmit -p tsconfig.json && npx eslint src/components/admin/EventForm.tsx "src/app/admin/(authenticated)/events/page.tsx" src/types/supabase.ts`
Expected: tsc 출력 없음(exit 0), eslint 오류 0.

- [ ] **Step 5: 커밋**

```bash
cd D:\dev\LIV_homepage
git add liv-clinic/src/types/supabase.ts liv-clinic/src/components/admin/EventForm.tsx "liv-clinic/src/app/admin/(authenticated)/events/page.tsx"
git commit -m "feat(admin): 이벤트 편집에 '팝업도 함께 띄우기' 체크 추가" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: 팝업 관리 배지 + 편집 안내

**Files:**
- Modify: `liv-clinic/src/app/admin/(authenticated)/popups/page.tsx:93-96` (제목 옆 배지)
- Modify: `liv-clinic/src/components/admin/PopupForm.tsx:97` (`<form>` 바로 아래 안내)

**Interfaces:**
- Consumes: `PopupRow.event_id` (Task 2).

- [ ] **Step 1: 목록 배지**

상태 배지 `<span ...>{badge.label}</span>` 바로 뒤에:

```tsx
                      {popup.event_id && (
                        <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-blue-100 text-blue-700">이벤트 연동</span>
                      )}
```

- [ ] **Step 2: 편집 안내**

`<form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">` 바로 아래:

```tsx
      {popup?.event_id && (
        <p className="text-xs text-[#6d4e42] bg-[#f6f0ec] px-4 py-2 rounded-lg">
          이벤트와 연동된 팝업입니다. 이벤트를 저장하면 제목·이미지·기간·링크가 다시 덮어써집니다(창 폭·순서·전환 간격은 유지).
          이미지를 따로 쓰려면 이벤트 편집에서 &quot;팝업도 함께 띄우기&quot;를 끄고 새 팝업을 만드세요.
        </p>
      )}
```

- [ ] **Step 3: 검사**

Run: `cd D:\dev\LIV_homepage\liv-clinic && npx tsc --noEmit -p tsconfig.json && npx eslint "src/app/admin/(authenticated)/popups/page.tsx" src/components/admin/PopupForm.tsx`
Expected: exit 0, 오류 0 (PopupForm 의 기존 `<img>` 경고 1건은 무관).

- [ ] **Step 4: 커밋**

```bash
cd D:\dev\LIV_homepage
git add "liv-clinic/src/app/admin/(authenticated)/popups/page.tsx" liv-clinic/src/components/admin/PopupForm.tsx
git commit -m "feat(admin): 이벤트 연동 팝업 배지·안내 문구" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: 팝업 창 이미지가 화면 높이에 맞게 축소

**Files:**
- Modify: `liv-clinic/src/components/layout/PopupModal.tsx:246-251` (`<img>`)
- Test: `D:\dev\LIV_homepage\popup-fit-check.mjs` (Playwright, 커밋하지 않음)

- [ ] **Step 1: 실패하는 검사 스크립트**

`D:\dev\LIV_homepage\popup-fit-check.mjs` — 세로 768px 화면에서 팝업 이미지 아래가 잘리지 않는지(이미지 바닥이 카드 안에 있는지):

```js
// 사용: node popup-fit-check.mjs [baseUrl=http://localhost:3100]
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const HOME = process.env.USERPROFILE || process.env.HOME;
const { chromium } = require(path.join(HOME, 'AppData/Local/npm-cache/_npx/db89d7302a373f10/node_modules/playwright-core'));
const CHROME = path.join(HOME, 'AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe');
const base = (process.argv[2] || 'http://localhost:3100').replace(/\/$/, '');
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, ignoreHTTPSErrors: true });
await page.goto(`${base}/ko`, { waitUntil: 'load' });
await page.waitForSelector('.z-\\[9999\\] img', { timeout: 20000 });
await page.waitForTimeout(1500);
const r = await page.evaluate(() => {
  const img = document.querySelector('.z-\\[9999\\] img');
  const card = img.closest('.pointer-events-auto');
  const ir = img.getBoundingClientRect(), cr = card.getBoundingClientRect();
  return { imgBottom: Math.round(ir.bottom), cardBottom: Math.round(cr.bottom), imgH: Math.round(ir.height), natural: [img.naturalWidth, img.naturalHeight], viewportH: innerHeight, clipped: ir.bottom > cr.bottom + 1 || cr.bottom > innerHeight * 0.85 + 1 };
});
await browser.close();
console.log(JSON.stringify(r));
console.log(r.clipped ? 'FAIL: 이미지가 잘림' : 'PASS');
process.exit(r.clipped ? 1 : 0);
```

- [ ] **Step 2: RED 확인 (프로덕션은 아직 예전 코드)**

Run: `cd D:\dev\LIV_homepage && node popup-fit-check.mjs https://liv-clinic.net`
Expected: 현재 2:3 팝업(1000×1500, 480px 폭 → 720px 높이)이 768px 화면 85%(653px)를 넘어 `FAIL: 이미지가 잘림`, exit 1.

- [ ] **Step 3: 구현**

`PopupModal.tsx` 의 `<img ... className="w-full h-auto block" draggable={false} />` 를:

```tsx
                    <img
                      src={popupImageSrc}
                      alt={currentPopup.title}
                      // 창 높이(85dvh) 안에 들어가도록 축소. 44px 은 아래 "오늘 하루 보지 않기/닫기" 바 높이.
                      className="block h-auto mx-auto"
                      style={{ maxHeight: 'calc(85dvh - 44px)', width: 'auto', maxWidth: '100%' }}
                      draggable={false}
                    />
```

- [ ] **Step 4: 로컬 프로덕션 빌드로 GREEN 확인**

```bash
cd D:\dev\LIV_homepage\liv-clinic
NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 NODE_TLS_REJECT_UNAUTHORIZED=0 npm run build
NODE_TLS_REJECT_UNAUTHORIZED=0 npx next start -p 3100   # 백그라운드
cd D:\dev\LIV_homepage && node popup-fit-check.mjs http://localhost:3100
```
Expected: `PASS`, exit 0. 확인 후 3100 서버 종료.

- [ ] **Step 5: 커밋**

```bash
cd D:\dev\LIV_homepage
git add liv-clinic/src/components/layout/PopupModal.tsx
git commit -m "fix(popup): 세로로 긴 팝업 이미지가 창 높이에 맞게 축소되도록" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: 전체 검증 → 머지·배포 → 9월 적용

**Files:**
- Create: `D:\dev\LIV_homepage\sept-popup-link.mjs` (일회용 데이터 작업, 커밋하지 않음)

- [ ] **Step 1: 전체 검사**

Run: `cd D:\dev\LIV_homepage\liv-clinic && npm run test && npx eslint src/components/admin src/components/layout/PopupModal.tsx "src/app/admin/(authenticated)/events" "src/app/admin/(authenticated)/popups"`
Expected: Vitest 전부 통과(28 파일 429+), eslint 오류 0.

- [ ] **Step 2: 9월 팝업을 이벤트에 연동 (새 팝업이 생기지 않게, 배포 전 실행)**

`D:\dev\LIV_homepage\sept-popup-link.mjs`:

```js
const { pg } = await import('file:///D:/dev/LIV_homepage/image-migration/scripts/lib.mjs');
const c = await pg();
const { rows: [ev] } = await c.query(`select id, slug from events where slug='2026-09-promotion'`);
const r = await c.query(`update popups set event_id=$1, updated_at=now() where id='24af5104-c3c1-402b-a361-bbb741e4f75f' and event_id is null returning title`, [ev.id]);
console.log('linked:', r.rowCount, r.rows[0]?.title);
const u = await c.query(`update events set auto_popup=true, updated_at=now() where id=$1 and auto_popup=false returning slug`, [ev.id]);
console.log('auto_popup on:', u.rowCount);
const { rows: [p] } = await c.query(`select title, link_url, is_active, display_start, display_end, image_url, image_url_en from popups where event_id=$1`, [ev.id]);
console.log(JSON.stringify(p));
await c.end();
```

Run: `cd D:\dev\LIV_homepage && NODE_TLS_REJECT_UNAUTHORIZED=0 node sept-popup-link.mjs`
Expected: `linked: 1 9월 이벤트`, `auto_popup on: 1`, 팝업 `link_url=/ko/events/2026-09-promotion`, `is_active=true`, 이미지=포스터 URL.

- [ ] **Step 3: 프로덕션에서 링크 동작 확인 (기존 배포 코드로도 동작)**

Playwright 로 `https://liv-clinic.net/en` 팝업 두 번째 슬라이드 클릭 → URL 이 `/en/events/2026-09-promotion` 인지 확인.

- [ ] **Step 4: 머지·푸시 (superpowers:finishing-a-development-branch 절차)**

```bash
cd D:\dev\LIV_homepage\liv-clinic && npm run test
cd D:\dev\LIV_homepage && git checkout master && git pull origin master && git merge --no-ff --no-edit feature/event-auto-popup
cd liv-clinic && npm run test && cd ..
git branch -d feature/event-auto-popup
git push origin master
```

- [ ] **Step 5: 배포 감지 후 프로덕션 확인**

청크 셋 변경 폴링(60초 × 25회) → `node popup-fit-check.mjs https://liv-clinic.net` PASS, `/ko` 팝업 2장·자동 전환 유지.

- [ ] **Step 6: 사용자 확인 요청**

관리자 이벤트 편집에서 9월 프로모션의 "팝업도 함께 띄우기"가 체크돼 있는지, 저장 후 팝업 관리에 "이벤트 연동" 배지가 보이는지 확인 요청(원격 관측 불가).
