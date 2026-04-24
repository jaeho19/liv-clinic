# Design: 팝업 롤링 시간 관리자 설정 기능

> **Feature**: `popup-rolling-interval`
> **Phase**: Design
> **Created**: 2026-04-24
> **Plan 참조**: `docs/01-plan/features/popup-rolling-interval.plan.md`

---

## 1. 아키텍처 개요 (Architecture Overview)

### 1.1 레이어 구조
```
┌────────────────────────────────────────────────────────────────────┐
│  DB Layer                                                          │
│    popups 테이블                                                   │
│    + rolling_interval_ms INTEGER NOT NULL DEFAULT 5000  ◀ 신규     │
│    + CHECK (rolling_interval_ms BETWEEN 2000 AND 30000)  ◀ 신규    │
└────────────────────┬──────────────────────────────┬────────────────┘
                     │                              │
          (Admin)    │                              │  (Public read)
                     ▼                              ▼
┌────────────────────────────────┐    ┌─────────────────────────────┐
│  Admin Layer                   │    │  Public Layer               │
│  /admin/popups/[new|edit]      │    │  홈페이지 팝업 모달          │
│    PopupForm.tsx               │    │    PopupManager.tsx          │
│      • number input(초)        │    │      └─ select('*')          │
│      • 초 ↔ ms 변환            │    │    PopupModal.tsx            │
│    /api/admin/popups (POST)    │    │      • setTimeout 기반       │
│    /api/admin/popups/[id]      │    │        재귀 스케줄링         │
│      (PATCH body passthrough)  │    │      • currentPopup.         │
│  /admin/popups (목록)          │    │        rolling_interval_ms   │
│      • 롤링 시간 컬럼(P2)      │    │        참조                  │
└────────────────────────────────┘    └─────────────────────────────┘
```

### 1.2 변경 대상 파일

| # | 파일 | 변경 유형 | 핵심 변경 |
|---|------|-----------|-----------|
| 1 | `liv-clinic/supabase/migrations/019_popup_rolling_interval.sql` | 신규 | 컬럼 추가 + CHECK 제약 |
| 2 | `liv-clinic/src/types/supabase.ts` | 수정 | `popups` Row/Insert/Update 에 `rolling_interval_ms` 추가 |
| 3 | `liv-clinic/src/components/admin/PopupForm.tsx` | 수정 | 입력 필드, 초↔ms 변환, 검증 |
| 4 | `liv-clinic/src/components/layout/PopupModal.tsx` | **핵심 수정** | 타이머: setInterval → setTimeout 재귀 스케줄링 |
| 5 | `liv-clinic/src/components/layout/PopupManager.tsx` | 변경 없음 | `select('*')` 로 자동 포함 |
| 6 | `liv-clinic/src/app/admin/(authenticated)/popups/page.tsx` | 선택 수정 (P2) | 목록 메타에 "롤링 {n}초" 표시 |

**변경되지 않는 파일**: API routes (body passthrough), 퍼블릭 API(`/api/popups`), ImageUploader, types/admin.ts (Database 제네릭으로 자동 파급).

---

## 2. 데이터 모델 (Data Model)

### 2.1 DB 마이그레이션 SQL

```sql
-- liv-clinic/supabase/migrations/019_popup_rolling_interval.sql
-- ============================================
-- 019: Add rolling_interval_ms to popups
-- ============================================

-- 1. Add column with default value (covers existing rows)
ALTER TABLE public.popups
  ADD COLUMN IF NOT EXISTS rolling_interval_ms INTEGER NOT NULL DEFAULT 5000;

-- 2. CHECK constraint: 2~30 seconds range
ALTER TABLE public.popups
  ADD CONSTRAINT popups_rolling_interval_ms_range
  CHECK (rolling_interval_ms BETWEEN 2000 AND 30000);

-- 3. Comment for self-documentation
COMMENT ON COLUMN public.popups.rolling_interval_ms IS
  '슬라이드 자동 전환 간격(ms). 2000~30000ms 범위. 다중 팝업 캐러셀에서 이 팝업이 화면에 머무는 시간.';
```

### 2.2 TypeScript 타입 확장 (`types/supabase.ts`)

기존 `popups.Row/Insert/Update` 각각에 `rolling_interval_ms` 추가:

```ts
popups: {
  Row: {
    created_at: string
    display_end: string
    display_start: string
    id: string
    image_url: string | null
    is_active: boolean
    link_target: string
    link_url: string
    rolling_interval_ms: number      // ◀ 신규
    show_on_mobile: boolean
    sort_order: number
    title: string
    updated_at: string
    width: number
  }
  Insert: {
    // ... 기존 ...
    rolling_interval_ms?: number     // ◀ 신규 (DEFAULT 5000)
  }
  Update: {
    // ... 기존 ...
    rolling_interval_ms?: number     // ◀ 신규
  }
}
```

> **Rationale**: `PopupRow` / `PopupInsert` / `PopupUpdate` 는 `types/admin.ts` 에서 `Database['public']['Tables']['popups']['...']` 제네릭으로 정의되므로 `supabase.ts` 만 갱신하면 자동 파급.

---

## 3. 관리자 UI 설계 (PopupForm)

### 3.1 폼 state 확장

```ts
const [form, setForm] = useState({
  // ... 기존 필드 ...
  rolling_interval_sec: popup?.rolling_interval_ms
    ? Math.round(popup.rolling_interval_ms / 1000)
    : 5,                             // 기본값 5초
});
```

### 3.2 입력 필드 (PopupForm.tsx — Settings 섹션 내 추가)

기존 Settings grid (`grid-cols-2: width | sort_order`) 옆에 새 행 추가 또는 `grid-cols-3` 로 확장:

```tsx
<div>
  <label className="block text-sm font-medium text-[#575756] mb-1.5">
    롤링 시간 (초)
  </label>
  <input
    type="number"
    value={form.rolling_interval_sec}
    onChange={(e) =>
      updateField('rolling_interval_sec', parseInt(e.target.value) || 5)
    }
    className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
    min={2}
    max={30}
    step={1}
  />
  <p className="text-xs text-[#b4b4b4] mt-1">
    자동 전환 간격 (2~30초). 복수 팝업일 때 각 팝업이 머무는 시간입니다.
  </p>
</div>
```

### 3.3 제출 시 초 → ms 변환

```ts
const payload = {
  ...form,
  display_start: new Date(form.display_start).toISOString(),
  display_end: new Date(form.display_end).toISOString(),
  rolling_interval_ms: clamp(form.rolling_interval_sec, 2, 30) * 1000,
};
delete (payload as Record<string, unknown>).rolling_interval_sec;
```

`clamp` 유틸 (PopupForm 로컬 함수):
```ts
const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
```

### 3.4 에지 케이스

| 입력 | 처리 |
|------|------|
| `NaN` / 빈 문자열 | `parseInt(... ) || 5` → 기본 5 |
| `< 2` | `clamp` 로 2 로 보정 후 저장 |
| `> 30` | `clamp` 로 30 으로 보정 후 저장 |
| 소수점 | `parseInt` 으로 정수화 |

---

## 4. 퍼블릭 런타임 설계 (PopupModal — 핵심)

### 4.1 현재 구현 (문제점)

```tsx
const AUTO_INTERVAL = 2500;  // ◀ 하드코딩

const startAutoPlay = useCallback(() => {
  if (!isMultiple) return;
  stopAutoPlay();
  autoPlayRef.current = setInterval(() => {    // ◀ 고정 간격
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % popups.length);
  }, AUTO_INTERVAL);
}, [isMultiple, popups.length, stopAutoPlay]);
```

`setInterval` 은 **고정 간격**만 지원 → 팝업별 다른 값을 사용할 수 없음.

### 4.2 변경 후 (setTimeout 재귀 스케줄링)

```tsx
// 상단 상수 제거:
// const AUTO_INTERVAL = 2500;   ← 삭제
const DEFAULT_INTERVAL_MS = 5000;   // ◀ fallback 기본값
const RESUME_DELAY = 5000;          // 유지

// 타이머 ref 타입 교체: Interval → Timeout
const autoPlayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const stopAutoPlay = useCallback(() => {
  if (autoPlayRef.current) {
    clearTimeout(autoPlayRef.current);
    autoPlayRef.current = null;
  }
}, []);

// currentIndex 변경마다 다음 전환을 예약
useEffect(() => {
  if (!isMultiple || isPaused) return;
  const intervalMs = popups[currentIndex]?.rolling_interval_ms || DEFAULT_INTERVAL_MS;
  autoPlayRef.current = setTimeout(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % popups.length);
  }, intervalMs);
  return () => {
    if (autoPlayRef.current) clearTimeout(autoPlayRef.current);
  };
}, [currentIndex, isMultiple, isPaused, popups]);
```

> **변경 요점**:
> - `setInterval` → `setTimeout` 으로 **1회 예약** 방식
> - 매 `currentIndex` 변경 시 effect 가 재실행되어 다음 전환을 예약
> - effect cleanup 에서 반드시 `clearTimeout` (경합/누수 방지)
> - `isPaused === true` 동안에는 예약하지 않음 (기존 RESUME_DELAY 로직과 일관)
> - fallback: `rolling_interval_ms` 가 0/null/undefined 이면 `DEFAULT_INTERVAL_MS` (5000)

### 4.3 `startAutoPlay` / `stopAutoPlay` 의존 코드 재정비

기존 코드에서 `startAutoPlay/stopAutoPlay` 를 참조하던 곳:

| 위치 | 기존 동작 | 변경 후 동작 |
|------|-----------|-------------|
| `pauseAndResume` | `stopAutoPlay()` → RESUME_DELAY 후 `startAutoPlay()` | `stopAutoPlay()` → RESUME_DELAY 후 `setIsPaused(false)` (effect 가 자동 재시작) |
| `onMouseEnter` (호버 진입) | `isMultiple && stopAutoPlay()` | `isMultiple && setIsPaused(true)` (또는 `stopAutoPlay` 유지 + `isPaused` 동시 활용) |
| `onMouseLeave` (호버 이탈) | `isMultiple && !isPaused && startAutoPlay()` | `isMultiple && setIsPaused(false)` |

권장 리팩토링 — **`startAutoPlay` 함수는 제거하고 `isPaused` 상태로만 제어**:

```tsx
// 단순화된 hover/pause:
onMouseEnter={() => isMultiple && setIsPaused(true)}
onMouseLeave={() => isMultiple && setIsPaused(false)}

// pauseAndResume (터치/화살표/도트 클릭 시):
const pauseAndResume = useCallback(() => {
  setIsPaused(true);
  if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  resumeTimerRef.current = setTimeout(() => setIsPaused(false), RESUME_DELAY);
}, []);
```

이렇게 하면 **"isPaused 가 타이머 예약의 게이트"** 역할을 하여 상태 관리가 일관됨.

### 4.4 Effect 의존성 검토

```tsx
useEffect(() => { ... }, [currentIndex, isMultiple, isPaused, popups]);
```

| 변경 트리거 | 동작 |
|-------------|------|
| `currentIndex` 이동 (자동/수동) | 새 팝업의 `rolling_interval_ms` 로 예약 |
| 호버 진입 (`isPaused=true`) | cleanup 으로 기존 타이머 취소, 새 예약 없음 |
| 호버 이탈 (`isPaused=false`) | 현재 슬라이드의 값으로 재예약 |
| `popups` 배열 갱신 (드물게) | 새 배열로 재예약 |

---

## 5. 목록 페이지 (선택, P2)

`/admin/popups` 카드의 메타 라인에 롤링 시간 추가:

```tsx
<p className="text-xs text-[#8a8a8a]">
  {startDate} ~ {endDate}
  {!popup.show_on_mobile && ' · 모바일 숨김'}
  {` · 롤링 ${Math.round(popup.rolling_interval_ms / 1000)}초`}
</p>
```

> P2 이므로 Plan AC 마지막 항목으로만 유지. 시간 부족 시 생략 가능.

---

## 6. 검증 매트릭스

| # | 시나리오 | 예상 동작 | 검증 방법 |
|---|----------|-----------|-----------|
| T-1 | 단일 팝업 | 타이머 생성 안 함 | PopupModal 렌더 후 `autoPlayRef.current === null` |
| T-2 | 2개 팝업, 5초/10초 | 첫 팝업 5초 후 두 번째로 전환, 두 번째는 10초 후 다시 첫 번째 | DevTools 타이머 탭 또는 수동 측정 |
| T-3 | 호버 진입 | 타이머 즉시 취소, 이탈 시 현재 슬라이드 값으로 재예약 | 호버 → cleanup 로그 |
| T-4 | 터치 스와이프 | RESUME_DELAY(5초) 동안 정지, 이후 현재 슬라이드 값으로 재예약 | 모바일 테스트 |
| T-5 | 화살표 클릭 | 동일 (T-4) | 데스크탑 클릭 테스트 |
| T-6 | 마이그레이션 전 데이터 | `rolling_interval_ms` 컬럼 자동 5000 채움 | `SELECT rolling_interval_ms FROM popups;` |
| T-7 | 폼 입력 0 / 음수 / NaN | 저장 시 2로 클램프 또는 기본 5 | 폼 submit 로그 |
| T-8 | 폼 입력 >30 | 30 으로 클램프 | 폼 submit 로그 |
| T-9 | DB CHECK 위반 직접 insert | 저장 실패 | Supabase SQL 콘솔 |
| T-10 | 타이머 누수 | 모달 닫기 후 `autoPlayRef.current === null`, 콘솔 경고 없음 | React DevTools |

---

## 7. 구현 순서 (Implementation Order)

1. **마이그레이션 파일 작성** — `019_popup_rolling_interval.sql` 생성
2. **마이그레이션 적용** — Supabase MCP `apply_migration` 혹은 수동 실행
3. **Supabase 타입 동기화** — `types/supabase.ts` 에 `rolling_interval_ms` 수동 추가 (또는 `supabase gen types` 실행)
4. **PopupForm.tsx 수정** — state 확장, 입력 필드, 초↔ms 변환 로직
5. **PopupModal.tsx 리팩토링** — `setInterval` 제거, `useEffect([currentIndex, isMultiple, isPaused, popups])` 기반 `setTimeout` 예약, `startAutoPlay` 제거
6. **(선택) 목록 페이지 표기** — 롤링 시간 메타 추가
7. **타입체크** — `npx tsc --noEmit` 0 errors 확인
8. **수동 QA** — T-1~T-10 체크

---

## 8. 엣지 케이스 및 리스크 (Design 확정)

| 케이스 | 처리 방침 |
|--------|-----------|
| 관리자 저장 직후 퍼블릭 캐시 불일치 | `PopupManager` 는 마운트 시 1회 로드. 퍼블릭 측 revalidation 범위 밖 → 기존 동작 유지 (변경 없음) |
| `popups` 배열 변경 시 effect 재실행 경합 | 의존성 명시 + cleanup 으로 안전 |
| CHECK 제약 위반 (2000 미만/30000 초과) | API 응답 500 → 관리자 측 폼 클램프로 사전 방어 |
| 기존 타이머(`setInterval`) 정리 | `stopAutoPlay` 내부 함수가 `clearTimeout` 으로 변경되며 호환 |
| `autoPlayRef` 타입 mismatch | `ReturnType<typeof setTimeout>` 으로 교체 |
| RESUME_DELAY(5초) 와 `rolling_interval_ms` 관계 | RESUME_DELAY 는 **사용자 인터랙션 후 재개 대기 시간** (별개 목적). 본 feature 범위 외로 불변 유지 |

---

## 9. 기존 대비 차이 요약

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 롤링 간격 저장 위치 | 하드코딩 (`AUTO_INTERVAL=2500`) | DB 컬럼 `rolling_interval_ms` |
| 관리자 UI | 없음 | PopupForm 에 "롤링 시간(초)" 필드 |
| 팝업별 개별 설정 | 불가(전역 고정) | **가능** |
| 타이머 구현 | `setInterval` | `setTimeout` 재귀 스케줄링 |
| fallback | 불필요 | `DEFAULT_INTERVAL_MS = 5000` |
| 기본값 | 2.5초 | **5초** (사용자 요청 반영) |
| 허용 범위 | 해당 없음 | **2~30초** (DB CHECK + 폼 clamp) |
| 타이머 상태 관리 | `startAutoPlay`/`stopAutoPlay` 함수 기반 | `isPaused` 상태 + effect 기반 단순화 |

---

## 10. 참고

- Plan: [`../01-plan/features/popup-rolling-interval.plan.md`](../../01-plan/features/popup-rolling-interval.plan.md)
- 현행 코드:
  - `liv-clinic/src/components/layout/PopupModal.tsx:13` — `AUTO_INTERVAL = 2500`
  - `liv-clinic/supabase/migrations/008_popups_table.sql` — 기존 스키마
  - `liv-clinic/src/types/supabase.ts:844` — `popups` 타입 정의 블록
  - `liv-clinic/src/components/admin/PopupForm.tsx` — 기존 Settings 섹션
- 사용자 요청: "팝업 롤링 시간 1개 팝업당 5초~6초, 관리자에서 설정 가능하게"
