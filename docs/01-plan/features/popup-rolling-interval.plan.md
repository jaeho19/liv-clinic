# Plan: 팝업 롤링 시간 관리자 설정 기능

> **Feature**: `popup-rolling-interval`
> **Phase**: Plan
> **Created**: 2026-04-24
> **Owner**: jaeho19@gmail.com

---

## 1. 배경 (Background)

홈페이지의 팝업 모달(`PopupModal`)은 활성 팝업이 2개 이상이면 자동으로 순환 전환되는 캐러셀로 동작한다. 현재 전환 간격은 `PopupModal.tsx:13` 에 **`AUTO_INTERVAL = 2500`** (2.5초) 으로 하드코딩되어 있어, 이미지를 읽기엔 짧다는 피드백이 있었다. 관리자 페이지에도 롤링 시간을 조정하는 필드가 없다.

- 현재 파일:
  - `liv-clinic/src/components/layout/PopupModal.tsx` (13번 줄 상수)
  - `liv-clinic/src/components/layout/PopupManager.tsx` (DB 로드)
  - `liv-clinic/src/components/admin/PopupForm.tsx` (관리자 입력 UI)
  - `liv-clinic/src/app/api/admin/popups/route.ts` (POST)
  - `liv-clinic/src/app/api/admin/popups/[id]/route.ts` (PATCH)
  - `liv-clinic/supabase/migrations/008_popups_table.sql` (DB 스키마)
- 현재 DB 스키마: `popups` 테이블에 `rolling_interval_ms` 컬럼 **없음**

---

## 2. 목표 (Goals)

1. 관리자 페이지의 팝업 생성/수정 폼에 **롤링 시간(초)** 입력 필드를 추가한다.
2. 입력값을 DB 에 저장하고, 홈페이지에서 해당 값을 사용해 슬라이드 전환 간격을 제어한다.
3. 팝업별로 다른 시간을 설정 가능하도록 한다 (현재 슬라이드의 값으로 다음 간격 결정).
4. 기본값은 **5초(5000ms)** 로 설정 (사용자 요청 5~6초 범위의 중간값).
5. 허용 범위는 **2 ~ 30초** 로 제한 (너무 짧거나 긴 값 차단).

---

## 3. 범위 (Scope)

### In Scope
- `popups` 테이블에 `rolling_interval_ms INTEGER NOT NULL DEFAULT 5000` 컬럼 추가 (DB 마이그레이션)
- `PopupForm.tsx` 에 "롤링 시간(초)" 입력 필드 추가 (number input, 1초 단위)
- `PopupManager.tsx` 에서 `rolling_interval_ms` 값 로드 및 `PopupModal` 에 전달
- `PopupModal.tsx` 롤링 로직 변경:
  - `setInterval` (고정 간격) → `setTimeout` 기반 재귀 스케줄링 (현재 슬라이드의 `rolling_interval_ms` 참조)
  - Fallback: 값이 없으면 5000ms 사용 (기존 데이터 호환)
- 관리자 API(POST/PATCH) body 전달 확인 — 현재 body 전체를 insert/update 하므로 자동 반영
- TypeScript 타입(`PopupRow`, `PopupInsert`, `PopupUpdate`) — Supabase 타입 재생성 필요 여부 확인

### Out of Scope
- `RESUME_DELAY` (사용자 인터랙션 후 재개까지 대기 시간) — 별도 이슈
- 팝업 페이드/슬라이드 애니메이션 속도 (`slideTransition.x.duration`) — 별도 이슈
- 전역 기본값 설정 페이지(설정 페이지에 글로벌 기본값 관리) — 팝업별 설정만 구현
- 키오스크 `SlideshowModal` 등 다른 캐러셀 — 본 기능과 무관
- 프로모션/이벤트 페이지의 캐러셀 — 본 기능과 무관

---

## 4. 요구사항 (Requirements)

### Functional Requirements

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | 관리자 팝업 생성/수정 폼에 "롤링 시간(초)" 입력 필드가 표시된다. | P0 |
| FR-02 | 입력값은 정수, 최소 2초, 최대 30초 범위로 검증된다. | P0 |
| FR-03 | 저장 시 `rolling_interval_ms` (= 입력값 × 1000) 로 DB 에 저장된다. | P0 |
| FR-04 | 홈페이지 팝업 모달은 활성 팝업 2개 이상일 때 **현재 슬라이드의 `rolling_interval_ms`** 값을 다음 전환 딜레이로 사용한다. | P0 |
| FR-05 | `rolling_interval_ms` 값이 null/undefined 인 기존 데이터는 5000ms 기본값으로 동작한다. | P0 |
| FR-06 | 기본 생성 시 기본값 5초(5000ms) 가 자동 입력된다. | P1 |
| FR-07 | 입력 필드 하단에 "홈페이지 팝업 자동 전환 간격 (2~30초)" 도움말이 표시된다. | P1 |
| FR-08 | 관리자 팝업 목록(`/admin/popups`)에서 설정된 롤링 시간을 확인할 수 있다. | P2 |

### Non-Functional Requirements

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-01 | DB 마이그레이션 backward compatible | 컬럼 추가 + DEFAULT 값 지정, 기존 행 자동 채움 |
| NFR-02 | 기존 슬라이드 UX 유지 | 펄스/슬라이드 애니메이션, 호버 일시정지, 터치 스와이프 동작 변경 없음 |
| NFR-03 | 타이머 누수 방지 | `setTimeout` 기반 전환 시 cleanup 에서 반드시 clear |
| NFR-04 | 단일 팝업일 때 타이머 생성 안 함 | `isMultiple` 체크 유지 |

---

## 5. 제약사항 (Constraints)

- **값 단위**: 관리자 UI 는 **초(초 단위 정수)** 로 입력, DB 와 컴포넌트는 **ms** 로 저장 (정밀도 및 일관성).
- **Fallback 기본값**: `rolling_interval_ms IS NULL` 또는 `<= 0` 일 경우 **5000ms** 사용 (마이그레이션 시 NOT NULL DEFAULT 5000 로 기존 행 자동 채워지므로 실전에선 null 없음, 방어적 처리).
- **타이머 전략 변경**: 현재 `setInterval` 은 **고정 간격**을 전제로 하므로 팝업별 다른 값을 적용하려면 `setTimeout` + `useEffect(currentIndex)` 기반 재귀 스케줄링으로 교체. 기존 `startAutoPlay/stopAutoPlay` 시그니처 유지 시 내부 구현만 교체 가능.
- **DB 마이그레이션 번호**: 현재 최대 번호는 `018_nurse_requests_schema.sql` → 신규 파일은 `019_popup_rolling_interval.sql`.
- **TypeScript 타입**: `PopupRow` 는 Supabase 자동 생성 타입에 의존. 마이그레이션 후 `src/types/database.ts` 재생성 또는 수동 `rolling_interval_ms: number` 추가 필요.

---

## 6. 수용 기준 (Acceptance Criteria)

- [ ] `/admin/popups/new` 에서 "롤링 시간(초)" 필드가 기본값 `5` 로 렌더되며 범위 2~30 을 벗어나면 저장 불가.
- [ ] `/admin/popups/[id]/edit` 에서 기존 값(초 단위)이 올바르게 표시되고 수정 후 저장된다.
- [ ] DB `popups.rolling_interval_ms` 컬럼이 존재하며 DEFAULT 5000 NOT NULL 제약이 적용된다.
- [ ] 홈페이지에서 팝업 2개 이상 활성 시, 첫 팝업은 해당 값으로 표시된 후 다음으로 전환된다.
- [ ] 각 팝업마다 다른 롤링 시간을 설정하면 각 슬라이드가 **자기 값**만큼 머문 뒤 전환된다.
- [ ] 호버로 일시정지 → 이탈 시 재개 동작이 기존과 동일하게 유지된다.
- [ ] 단일 팝업일 때는 타이머가 동작하지 않는다.
- [ ] 기존에 `rolling_interval_ms` 값이 없던 레코드도 마이그레이션 후 5초로 동작한다.
- [ ] `npx tsc --noEmit` 통과, 변경 파일 lint 오류 0건.
- [ ] 관리자 팝업 목록에 롤링 시간이 표시된다 (FR-08, P2).

---

## 7. 예상 변경 파일

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `liv-clinic/supabase/migrations/019_popup_rolling_interval.sql` | 신규 | `ALTER TABLE popups ADD COLUMN rolling_interval_ms INTEGER NOT NULL DEFAULT 5000;` |
| `liv-clinic/src/types/admin.ts` (또는 `database.ts`) | 수정 | `PopupRow`/`PopupInsert`/`PopupUpdate` 에 `rolling_interval_ms` 추가 (Supabase 타입 재생성 혹은 수동 확장) |
| `liv-clinic/src/components/admin/PopupForm.tsx` | 수정 | 입력 필드 추가, 초↔ms 변환, 범위 검증 |
| `liv-clinic/src/components/layout/PopupManager.tsx` | 경미한 수정 | `select('*')` 이므로 자동으로 `rolling_interval_ms` 로드됨. `PopupRow` 타입 갱신만 확인 |
| `liv-clinic/src/components/layout/PopupModal.tsx` | 핵심 수정 | `AUTO_INTERVAL` 상수 제거, 현재 popup 의 `rolling_interval_ms` 사용하도록 타이머 로직 교체 |
| `liv-clinic/src/app/admin/(authenticated)/popups/page.tsx` | 선택 수정 | 목록 테이블에 롤링 시간 컬럼 추가 (FR-08) |

**변경되지 않는 파일**: API routes (body passthrough), 퍼블릭 API(`/api/popups`), DB RLS/인덱스.

---

## 8. 리스크 및 대응

| 리스크 | 영향도 | 대응 |
|--------|--------|------|
| `setInterval → setTimeout` 전환 시 타이머 누수 | Medium | `useEffect` cleanup 에서 명시적으로 `clearTimeout`, ref 로 관리 |
| `currentIndex` 변경과 타이머 재설정 사이 경합 | Medium | `useEffect([currentIndex, isPaused])` 로 의존성 명확히 표기, 매 effect 마다 이전 timeout clear |
| 기존 데이터 (null 컬럼) 로 인한 undefined 동작 | Low | DB DEFAULT 5000 NOT NULL + 컴포넌트에서도 `|| 5000` fallback 중복 방어 |
| Supabase 타입 재생성 누락 → 빌드 오류 | Medium | `npm run supabase:types` 실행 또는 `PopupRow` 수동 확장 후 커밋 |
| 사용자가 너무 짧은 값(0, 음수) 저장 시도 | Low | 폼 `min=2 max=30` + DB CHECK 제약 (선택) + API 측 Zod 검증 (선택) |
| 2~30 초 외 사용자 요청(예: 60초) 발생 | Low | 상수로 관리하여 추후 쉽게 확장 가능 |

---

## 9. 다음 단계 (Next Phase)

- `/pdca design popup-rolling-interval` — 타이머 로직 재설계, DB 마이그레이션 SQL, 타입 확장 구체화
- `/pdca do popup-rolling-interval` — 마이그레이션 적용 + 코드 수정 구현
- `/pdca analyze popup-rolling-interval` — 수용 기준 기반 Gap 분석

---

## 10. 참고 자료

- 하드코딩 위치: `liv-clinic/src/components/layout/PopupModal.tsx:13` — `const AUTO_INTERVAL = 2500;`
- DB 스키마: `liv-clinic/supabase/migrations/008_popups_table.sql`
- 관리자 폼: `liv-clinic/src/components/admin/PopupForm.tsx`
- 로더: `liv-clinic/src/components/layout/PopupManager.tsx`
- 사용자 요청: "홈페이지 팝업 롤링 시간 1개 팝업당 5초~6초 정도로 설정하고 싶은데, 관리자 페이지에서는 시간 조정 기능이 없는 것 같아. 설정할 수 있도록 만들어줘"
