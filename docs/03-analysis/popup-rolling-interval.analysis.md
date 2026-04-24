# Analysis: 팝업 롤링 시간 관리자 설정 기능

> **Feature**: `popup-rolling-interval`
> **Phase**: Check (Gap Analysis)
> **Analyzed**: 2026-04-24
> **Analyzer**: bkit:gap-detector

---

## Analysis Overview

| 항목 | 내용 |
|------|------|
| Feature | `popup-rolling-interval` |
| 분석일 | 2026-04-24 |
| Design 문서 | `docs/02-design/features/popup-rolling-interval.design.md` |
| **Match Rate** | **100%** (31/31) |
| 판정 | **PASS** (>= 90%) |

---

## 1. Functional Requirements 매칭 — 8/8 Pass

| FR | 요구사항 | 상태 | 근거 (file:line) |
|----|----------|:----:|-------------------|
| FR-01 (P0) | 관리자 폼에 "롤링 시간(초)" 필드 표시 | ✅ | `PopupForm.tsx:197-209` — label + number input |
| FR-02 (P0) | 정수 2~30초 범위 검증 | ✅ | `PopupForm.tsx:204-206` `min=2 max=30 step=1` + `:57` `Math.max(2, Math.min(30, ...))` |
| FR-03 (P0) | 저장 시 `rolling_interval_ms`(sec × 1000) DB 저장 | ✅ | `PopupForm.tsx:57,64` `clampedSec * 1000` → payload |
| FR-04 (P0) | 홈 모달이 현재 슬라이드의 `rolling_interval_ms` 사용 | ✅ | `PopupModal.tsx:58` `popups[currentIndex]?.rolling_interval_ms` |
| FR-05 (P0) | null/undefined 시 5000ms fallback | ✅ | `PopupModal.tsx:13,58` `DEFAULT_INTERVAL_MS=5000` + `\|\| DEFAULT_INTERVAL_MS` |
| FR-06 (P1) | 기본 생성 시 5초 기본값 | ✅ | `PopupForm.tsx:34-36` `popup?.rolling_interval_ms ? round(.../1000) : 5` |
| FR-07 (P1) | 도움말 "2~30초" 표시 | ✅ | `PopupForm.tsx:208` "자동 전환 간격 (2~30초). 복수 팝업일 때 머무는 시간." |
| FR-08 (P2) | 관리자 목록에 롤링 시간 표시 | ✅ | `page.tsx:101` `· 롤링 ${Math.round((popup.rolling_interval_ms ?? 5000) / 1000)}초` |

---

## 2. Design 특수 요구사항 매칭 — 13/13 Pass

| # | Design Spec | 상태 | 근거 |
|---|-------------|:----:|------|
| D1 | 마이그레이션 파일 존재 + CHECK BETWEEN 2000 AND 30000 | ✅ | `019_popup_rolling_interval.sql:8-17` |
| D2 | `types/supabase.ts` popups Row/Insert/Update 3곳 모두 `rolling_interval_ms` | ✅ | `supabase.ts:854, :870, :886` |
| D3 | PopupForm state `rolling_interval_sec` (ms→초, 기본 5) | ✅ | `PopupForm.tsx:34-36` |
| D4 | Settings 그리드 3열 | ✅ | `PopupForm.tsx:175` `grid-cols-1 sm:grid-cols-3` |
| D5 | 제출 시 `clamp(2,30) * 1000` 변환 | ✅ | `PopupForm.tsx:57,64` |
| D6 | `AUTO_INTERVAL=2500` 제거, `DEFAULT_INTERVAL_MS=5000` | ✅ | `PopupModal.tsx:13`; AUTO_INTERVAL 부재 확인 |
| D7 | `autoPlayRef` 타입 `setTimeout` | ✅ | `PopupModal.tsx:41` |
| D8 | `setInterval → setTimeout` 재귀 스케줄링 + deps 정확 | ✅ | `PopupModal.tsx:56-69` |
| D9 | cleanup `clearTimeout` | ✅ | `PopupModal.tsx:63-68` |
| D10 | `startAutoPlay`/`stopAutoPlay` 함수 제거 | ✅ | 코드 전체에서 식별자 부재 확인 |
| D11 | `pauseAndResume` `setIsPaused` 상태 기반 | ✅ | `PopupModal.tsx:48-54` |
| D12 | onMouseEnter/onMouseLeave `setIsPaused` 교체 | ✅ | `PopupModal.tsx:134-142` |
| D13 | PopupManager 변경 없음 | ✅ | `PopupManager.tsx:62-68` `.select('*')` 유지 |

---

## 3. Acceptance Criteria 매칭 — 10/10 Pass

| # | AC | 상태 | 근거 |
|---|----|:----:|------|
| AC-1 | `/admin/popups/new` 기본 5, 범위 2~30 | ✅ | FR-01/FR-02/FR-06 근거 |
| AC-2 | `/admin/popups/[id]/edit` 기존 값 초 단위 | ✅ | `PopupForm.tsx:34-36` |
| AC-3 | DB DEFAULT 5000 NOT NULL + CHECK | ✅ | `019_popup_rolling_interval.sql:8-17` |
| AC-4 | 홈 2개 이상 활성 시 첫 팝업 값으로 전환 | ✅ | `PopupModal.tsx:56-69` |
| AC-5 | 팝업별 다른 값 설정 시 각자 시간 | ✅ | `PopupModal.tsx:58` currentIndex 변경 시 effect 재실행 |
| AC-6 | 호버 정지/재개 기존 유지 | ✅ | `PopupModal.tsx:134-142` |
| AC-7 | 단일 팝업 타이머 미생성 | ✅ | `PopupModal.tsx:57` `if (!isMultiple \|\| isPaused) return` |
| AC-8 | 기존 레코드 5초 동작 | ✅ | DB DEFAULT 5000 + Do 기록 3행 5000 확인 |
| AC-9 | `npx tsc --noEmit` 통과 | ✅ | 0 errors (사전 확인됨) |
| AC-10 | 목록에 롤링 시간 표시 | ✅ | `page.tsx:101` |

---

## 4. Gap 목록

### 🔴 Missing (Design O / 구현 X)
**없음.**

### 🟡 Added (Design X / 구현 O)
- `PopupForm.tsx:58-59` — `const { rolling_interval_sec: _sec, ...rest } = form; void _sec;`
  - Design(§3.3) 은 `delete` 패턴 예시를 제시했으나 구현은 구조분해로 immutable 하게 제거. **기능 동일 + 더 안전한 스타일 변주**.

### 🔵 Changed (Design ≠ 구현, 긍정적 강화)
- `PopupModal.tsx:135-142` onMouseLeave — Design 은 "`setIsPaused(false)` 로 단순 교체"라고 했으나 구현은 **추가로 `resumeTimerRef` clear**.
  - 영향도: **긍정(Positive)**. 스와이프/클릭 후 `pauseAndResume` 중인 상황에서 호버→이탈 시 예약된 resume 타이머가 이중 `setIsPaused(false)` 호출하는 경합 방지. Design §4.4 "경합 방지" 의도와 부합.

---

## 5. 매칭률 산출

```
판정 대상 = FR 8 + Design 특수 13 + AC 10 = 31
✅ 개수 = 31
Match Rate = 31 / 31 × 100 = 100%
```

| 카테고리 | 점수 | 상태 |
|----------|:----:|:----:|
| Design Match | 100% | ✅ |
| Convention Compliance | 100% | ✅ (snake_case, 상수 UPPER, immutability, timer cleanup) |
| Architecture Compliance | 100% | ✅ |
| **Overall** | **100%** | ✅ PASS |

---

## 6. Architecture / Convention 점검

- **레이어 구조**: Dynamic 레벨(components/ + lib/ + types/) 기존 구조 유지, 위반 없음
- **Naming**: `rolling_interval_ms` (DB, snake_case), `rolling_interval_sec` (form state), `DEFAULT_INTERVAL_MS` (UPPER_SNAKE_CASE 상수) — 모두 기존 컨벤션과 일치
- **Immutability**: `setForm(prev => ({ ...prev, ... }))` (PopupForm.tsx:43), payload 는 구조분해 + spread. Mutation 없음
- **Timer cleanup**: effect cleanup + unmount cleanup 양쪽 존재 — NFR-03 충족

---

## 7. 권장 조치

1. **즉시 조치 불필요** — 매칭률 100%, `/pdca report popup-rolling-interval` 진행 권장
2. **선택적 개선** (별도 티켓):
   - **Zod 서버 검증**: `/api/admin/popups` POST/PATCH 에 `rolling_interval_ms.min(2000).max(30000)` 스키마 추가 → DB 500 대신 400 응답
   - **수동 QA**: Do 기록 §3.3 브라우저 QA 7개 체크박스 미완료. Report 이전 최소 1회 실행 권장
   - **회귀 테스트**: PopupModal 타이머 로직 단위/통합 테스트 (현재 부재, 본 feature 범위 외)

---

## 8. 검증 메모

- `next build` / `npm run lint` 은 지침에 따라 실행 생략 (기존 코드베이스 사전 오류 다수로 신호 혼탁)
- `npx tsc --noEmit` 0 errors 사전 확인됨
- DB 마이그레이션 적용 및 기존 데이터 기본값 채움 확인됨 (Supabase MCP)
- 동적 브라우저 QA 는 본 분석 범위 밖 (정적 분석으로 충족 확인)

---

## 9. 다음 단계

- **`/pdca report popup-rolling-interval`** — 완료 보고서 생성 (매칭률 ≥ 90% 충족)
