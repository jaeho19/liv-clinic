# Do: 팝업 롤링 시간 관리자 설정 기능

> **Feature**: `popup-rolling-interval`
> **Phase**: Do (Implementation)
> **Completed**: 2026-04-24
> **Design 참조**: `docs/02-design/features/popup-rolling-interval.design.md`

---

## 1. 구현 체크리스트

- [x] 마이그레이션 파일 `019_popup_rolling_interval.sql` 생성 (컬럼 + CHECK 제약 + COMMENT)
- [x] Supabase DB 에 마이그레이션 적용 (프로젝트 `aravkffjmaslddgbhtgz`)
- [x] 기존 3개 팝업 행 자동으로 `rolling_interval_ms = 5000` 로 채워짐 확인
- [x] `types/supabase.ts` — `popups` Row/Insert/Update 세 곳에 `rolling_interval_ms` 추가
- [x] `PopupForm.tsx` — 폼 state `rolling_interval_sec` 추가(기본 5), 입력 필드 3열 그리드, 제출 시 `clamp(2,30)*1000` 변환
- [x] `PopupModal.tsx` — `AUTO_INTERVAL` 상수 제거, `DEFAULT_INTERVAL_MS = 5000` 도입, `setInterval → setTimeout` 재귀 스케줄링, `startAutoPlay`/`stopAutoPlay` 제거, `isPaused` 기반 상태 단순화
- [x] 호버 핸들러 `onMouseEnter/onMouseLeave` 를 `setIsPaused` 로 교체
- [x] `/admin/popups` 목록 페이지 메타에 `· 롤링 N초` 표시 (P2)
- [x] `npx tsc --noEmit` 0 errors

---

## 2. 변경 파일 상세

### 2.1 `liv-clinic/supabase/migrations/019_popup_rolling_interval.sql` (신규)
- `popups` 테이블에 `rolling_interval_ms INTEGER NOT NULL DEFAULT 5000` 컬럼 추가
- `popups_rolling_interval_ms_range` CHECK 제약 (2000 ~ 30000)
- 컬럼 설명 COMMENT

### 2.2 DB 적용 결과 (Supabase MCP)
```
apply_migration → {"success": true}
SELECT 결과: 기존 3개 행 모두 rolling_interval_ms = 5000 자동 채워짐
```

### 2.3 `liv-clinic/src/types/supabase.ts`
- `popups.Row.rolling_interval_ms: number`
- `popups.Insert.rolling_interval_ms?: number`
- `popups.Update.rolling_interval_ms?: number`
- `PopupRow` 등은 Database 제네릭 경유이므로 자동 파급

### 2.4 `liv-clinic/src/components/admin/PopupForm.tsx`
- state 확장: `rolling_interval_sec` (ms → 초 초기화)
- handleSubmit: `Math.max(2, Math.min(30, sec))` clamp 후 `*1000` 으로 ms 변환, payload 에서 `rolling_interval_sec` 제거 + `rolling_interval_ms` 추가
- Settings 그리드 `grid-cols-2 → grid-cols-1 sm:grid-cols-3`: 너비 / 정렬 순서 / **롤링 시간(초)** 3개 필드
- min=2 max=30 step=1, 도움말 "자동 전환 간격 (2~30초). 복수 팝업일 때 머무는 시간."

### 2.5 `liv-clinic/src/components/layout/PopupModal.tsx` (핵심 리팩토링)
- `AUTO_INTERVAL = 2500` → 삭제
- `DEFAULT_INTERVAL_MS = 5000` 신규 (fallback)
- `autoPlayRef` 타입 `ReturnType<typeof setInterval>` → `ReturnType<typeof setTimeout>`
- `startAutoPlay` / `stopAutoPlay` 함수 **삭제**
- `pauseAndResume`: `setIsPaused(true)` 후 `RESUME_DELAY` 뒤 `setIsPaused(false)` (함수 호출 대신 상태 기반)
- 메인 effect: `useEffect([currentIndex, isMultiple, isPaused, popups])` — 현재 슬라이드의 `rolling_interval_ms` 참조하여 `setTimeout` 1회 예약, cleanup 에서 `clearTimeout`
- unmount effect: `resumeTimerRef` cleanup
- onMouseEnter: `setIsPaused(true)` (effect cleanup 이 자동 취소)
- onMouseLeave: `resumeTimerRef` 취소 + `setIsPaused(false)` (effect 재실행으로 재예약)

### 2.6 `liv-clinic/src/app/admin/(authenticated)/popups/page.tsx`
- 카드 메타라인에 `· 롤링 ${Math.round((popup.rolling_interval_ms ?? 5000) / 1000)}초` 추가

### 2.7 변경 없음 (자동 파급)
- `liv-clinic/src/components/layout/PopupManager.tsx` — `.select('*')` 로 `rolling_interval_ms` 자동 포함
- `liv-clinic/src/app/api/admin/popups/route.ts` (POST) — body passthrough, 별도 변경 불필요
- `liv-clinic/src/app/api/admin/popups/[id]/route.ts` (PATCH) — body passthrough
- `liv-clinic/src/types/admin.ts` — Database 제네릭으로 `PopupRow` 자동 갱신

---

## 3. 검증 결과

### 3.1 TypeScript
```bash
npx tsc --noEmit
# (no errors — 0 output)
```

### 3.2 DB 상태 확인
```sql
SELECT id, title, rolling_interval_ms FROM public.popups ORDER BY created_at DESC LIMIT 10;
-- 결과: 3개 행 모두 rolling_interval_ms = 5000
```

### 3.3 수동 QA 대상 (브라우저 확인 필요)
- [ ] `/admin/popups/new` → 롤링 시간 필드 기본값 5 렌더, 2~30 외 입력 시도 시 HTML min/max 검증
- [ ] `/admin/popups/[id]/edit` → 기존 값(초) 표시, 변경 저장 성공
- [ ] `/admin/popups` 목록에 `· 롤링 5초` 표시
- [ ] 홈페이지 팝업 2개 활성 시 설정한 시간만큼 머문 후 전환
- [ ] 호버 시 즉시 정지, 이탈 시 현재 슬라이드 값으로 재예약
- [ ] 단일 팝업일 때 타이머 생성 안 됨(무한 정지 상태)
- [ ] 모바일 스와이프 시 `RESUME_DELAY(5초)` 후 자동 재개

---

## 4. 다음 단계

- **`/pdca analyze popup-rolling-interval`** — gap-detector 로 Design ↔ 구현 매칭률 산출
- 매칭률 ≥ 90% 시 → `/pdca report popup-rolling-interval`
- 매칭률 < 90% 시 → `/pdca iterate popup-rolling-interval`
