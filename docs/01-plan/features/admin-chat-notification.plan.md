# Plan: 관리자 채팅 실시간 알림 (Admin Chat Notification)

> **Feature**: `admin-chat-notification`
> **Phase**: Plan
> **Created**: 2026-05-12
> **Owner**: jaeho19@gmail.com
> **Related**: `realtime-translation-chat`, `chat-followups-g03-g05-g07`

---

## 1. 배경 (Background)

`realtime-translation-chat` PDCA로 도입된 다국어 채팅 위젯을 통해 외국인 방문자(en/ja/zh/fr/mn/ar)의 실시간 문의가 가능해졌다. 그러나 현재 관리자(데스크 직원) 측은 다음과 같은 한계가 있다.

- 새 채팅 문의가 도착해도 **`/admin/chat` 페이지를 직접 방문해야** 인지 가능
- 다른 관리자 페이지(`/admin/inventory`, `/admin/events` 등) 작업 중이면 **수 분~수십 분간 누락**
- 페이지를 켜둔 상태에서도 **수동 새로고침** 없이는 새 메시지 진입 여부를 알 수 없음
- 결과: 외국인 방문자 평균 첫 응답 지연 발생 → 문의 이탈 가능성

이번 작업은 관리자 페이지 전 구간에 **실시간 알림 레이어**를 도입하여, 직원이 어떤 화면에 있든 새 채팅 문의를 즉시 인지하도록 한다.

---

## 2. 목표 (Goals)

1. **관리자 페이지 전 경로**(`/admin/*`)에서 새 채팅 메시지를 실시간 감지한다.
2. **5단계 알림**으로 직원이 놓치지 않도록 한다:
   - 사이드바 뱃지 (시각, 영구)
   - 토스트 팝업 (시각, 일시)
   - 소리 (청각, 토글 가능)
   - 브라우저 알림 (OS 레벨, 다른 탭 포커스 시)
   - 탭 타이틀 깜빡임 (브라우저 레벨)
3. **음소거 / 푸시 권한 거부** 상태에서도 시각 알림은 정상 동작.
4. **사용자 인터랙션 정책 준수**: 자동재생 차단·푸시 권한 미요청 등으로 인한 무음 실패가 없도록 토글·권한 UX 제공.
5. 기존 `/admin/chat` UI·기능은 **변경하지 않는다** (알림 레이어만 추가).

---

## 3. 범위 (Scope)

### In Scope

- **NotificationProvider** (Context, `/admin/(authenticated)` 레이아웃에 마운트)
  - Supabase Realtime 구독 (`chat_messages` INSERT, `chat_sessions` UPDATE)
  - 미확인 합계 카운트 상태 관리
  - 소리/토스트/브라우저알림/탭타이틀 트리거
- **사이드바 뱃지** (`AdminSidebar.tsx`의 "채팅 상담" 메뉴 옆)
  - 빨간 원 + 숫자, `unread_admin_count` 합계 기준
  - 0일 때 숨김
- **소리 알림 토글** (관리자 헤더 영역 또는 사이드바 푸터)
  - `localStorage.admin_chat_sound_enabled` 영속화
  - 최초 클릭 시 오디오 unlock (자동재생 정책 회피)
  - 기본값: OFF (브라우저 정책 + 사용자 명시적 활성화 권장)
- **토스트 컴포넌트** (자체 구현 — 외부 라이브러리 미설치)
  - 우측 상단, 5초 자동 사라짐
  - 클릭 시 해당 `/admin/chat/[sessionId]`로 이동
  - 다중 토스트 스택(최대 3개)
- **브라우저 푸시 알림** (`Notification API`)
  - 페이지 진입 시 권한 안내 (강제 요청 금지 — 사용자 액션 트리거로 시작)
  - `document.hidden === true`일 때만 발송 (포커스 중이면 토스트로 충분)
- **탭 타이틀 깜빡임**
  - 미확인 > 0 → `document.title = '(N) LIV 관리자'`
  - 포커스 복귀 시 원래 타이틀 복귀
- **현재 보고 있는 세션 무음 처리**
  - `/admin/chat/[sessionId]` 페이지에 있을 때 그 세션에 들어온 메시지는
    소리·토스트·브라우저알림 발송하지 않음 (뱃지는 어차피 자동 0으로 감소)
- **오디오 에셋**
  - `liv-clinic/public/sounds/notification.mp3` (짧은 "딩" 사운드, 100KB 이하)
- **Vitest 단위 테스트**
  - `useChatNotifications` 훅
  - 사운드 토글 상태 영속화
  - 탭 타이틀 mutation

### Out of Scope

- **이메일 / SMS / 카카오 알림** (직원 OS 레벨 푸시까지만)
- **알림 히스토리 모달** (지난 알림 리스트 — 후속 PDCA)
- **개인별 음소거 시간대 설정** (집중 모드 — 후속 PDCA)
- **세션 자동 배정(라우팅)** (`assigned_admin_id` 자동 채우기 — 후속 PDCA)
- **모바일 PWA Push** (서비스워커 기반 푸시 — 후속, 1차는 페이지 열려있는 동안만)
- **운영자 다중 디바이스 중복 알림 억제** (1차는 디바이스별 독립 — 후속 검토)
- **`/admin/chat` 페이지 UI 리뉴얼** (별도 PDCA)

---

## 4. 사용자 시나리오 (User Stories)

### US-1: 다른 페이지 작업 중 새 채팅 인지
**As** 데스크 직원
**When** `/admin/inventory`에서 재고 입력 중
**And** 일본 방문자가 채팅 위젯에서 새 문의를 보냄
**Then** 1초 이내에
- 사이드바 "채팅 상담" 뱃지 `(1)` 표시
- 우측 상단 토스트 `💬 일본 방문자(익명)의 새 메시지`
- 알림음 재생 (소리 토글 ON 시)
- 탭 타이틀 `(1) LIV 관리자`

### US-2: 토스트 클릭으로 즉시 응대
**As** 데스크 직원
**When** 토스트 알림이 떴을 때
**Then** 토스트 클릭 시 `/admin/chat/{sessionId}`로 이동
**And** 페이지 진입 시 해당 세션 `unread_admin_count = 0`으로 트리거에 의해 자동 갱신
**And** 뱃지·탭 타이틀이 자동 감소

### US-3: 소리 토글
**As** 데스크 직원
**When** 사이드바 푸터의 🔔 소리 켜기 클릭
**Then** `localStorage.admin_chat_sound_enabled = 'true'` 저장
**And** 다음 알림부터 소리 재생
**And** 페이지 새로고침 후에도 유지

### US-4: 다른 탭 포커스 시 OS 알림
**As** 데스크 직원
**When** Excel 등 다른 앱에 포커스가 있을 때 (브라우저 탭 hidden)
**And** 새 채팅 도착
**Then** OS 레벨 알림 표시 (권한 부여 시)
**And** OS 알림 클릭 시 LIV 관리자 탭으로 포커스 이동 + 해당 세션으로 이동

### US-5: 현재 채팅방 보고 있을 때
**As** 데스크 직원
**When** `/admin/chat/abc-123` 페이지에서 응대 중
**And** 같은 세션(abc-123)에 새 메시지 도착
**Then** 소리·토스트·OS 알림 발송 안 함 (이미 보고 있으므로)
**And** 다른 세션(xyz-789)에서 도착한 메시지는 정상 알림

### US-6: 권한 거부 폴백
**As** 데스크 직원
**When** OS 알림 권한 거부 상태
**Then** 뱃지·토스트·소리·탭 타이틀은 정상 동작
**And** OS 알림만 비활성화

---

## 5. 기능 요구사항 (Functional Requirements)

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-1 | Supabase Realtime으로 `chat_messages` INSERT(`sender=visitor`) 구독 | P0 |
| FR-2 | Supabase Realtime으로 `chat_sessions` UPDATE(`unread_admin_count`) 구독 → 합계 갱신 | P0 |
| FR-3 | 마운트 시 1회 초기 합계 페치 (`SUM(unread_admin_count) WHERE status='open'`) | P0 |
| FR-4 | 사이드바 "채팅 상담" 메뉴 옆 뱃지 (0이면 숨김) | P0 |
| FR-5 | 새 메시지 도착 시 토스트 (5초 후 자동 dismiss, 클릭 시 라우팅) | P0 |
| FR-6 | 알림음 재생 (토글 OFF 시 무음, localStorage 영속화) | P0 |
| FR-7 | 사이드바 푸터에 🔔 소리 토글 버튼 | P0 |
| FR-8 | 탭 타이틀 `(N) LIV 관리자` mutation, 포커스 복귀 시 원복 | P1 |
| FR-9 | `Notification API` 권한 요청 (사용자 인터랙션 후), 권한 부여 시 OS 알림 | P1 |
| FR-10 | 현재 `/admin/chat/[sessionId]` 페이지의 세션은 소리/토스트/OS 알림 무음 | P1 |
| FR-11 | 모바일 뷰포트에서도 뱃지 동작 (소리·OS 알림은 best-effort) | P2 |
| FR-12 | 다중 토스트 스택 (최대 3개, 초과 시 오래된 것 제거) | P2 |

---

## 6. 비기능 요구사항 (Non-Functional Requirements)

| ID | 요구사항 | 측정 기준 |
|----|---------|---------|
| NFR-1 | 메시지 도착 ~ 알림 표시 지연 ≤ 2초 (Realtime 네트워크 포함) | 수동 검증 |
| NFR-2 | 사운드 파일 크기 ≤ 100KB (모바일 데이터 절약) | 파일 사이즈 |
| NFR-3 | Realtime 채널 1개만 사용 (`chat_messages` + `chat_sessions` 다중 listener) | 코드 리뷰 |
| NFR-4 | NotificationProvider unmount 시 채널·인터벌·이벤트 리스너 모두 해제 (메모리 누수 0) | Vitest |
| NFR-5 | 사운드 토글 OFF 시 `Audio` 객체 생성 자체 안 함 (불필요 리소스 차단) | 코드 리뷰 |
| NFR-6 | 외부 토스트 라이브러리 미사용 (번들 사이즈 +0KB) | package.json diff |
| NFR-7 | RLS는 기존 `authenticated` 정책 그대로 사용 (마이그레이션 0건) | migration diff |

---

## 7. 의존성 / 전제 (Dependencies & Assumptions)

### 의존성

- ✅ `chat_messages`, `chat_sessions` 테이블 존재 (Migration `028_chat_tables.sql`)
- ✅ `supabase_realtime` publication에 두 테이블 등록됨 (`028` 마이그레이션 끝부분)
- ✅ RLS: `authenticated` 역할에 전체 SELECT 허용됨 → 어드민이 직접 구독 가능
- ✅ `@supabase/ssr`, `@supabase/supabase-js` 설치됨
- ✅ Browser Supabase client 존재 (`src/lib/supabase-browser.ts`)
- ✅ `/admin/(authenticated)/layout.tsx`에 `useOperatorHeartbeat`이 이미 마운트되어 있어 동일 위치에 NotificationProvider 추가 자연스러움
- ✅ Vitest 테스트 환경 구성됨 (`package.json`의 `"test"` 스크립트)

### 전제

- Realtime은 Supabase Free/Pro 플랜 모두 기본 활성 (별도 비용 없음)
- 관리자 동시 접속 수 ≤ 5명 (Realtime 동시 연결 제한 충분)
- 알림음 파일은 무료 라이선스(CC0 등) 또는 자체 생성 후 직접 등록
- 토스트는 자체 구현 (`sonner`/`react-hot-toast` 미설치 → 번들 추가 회피)

---

## 8. 리스크 / 미해결 질문 (Risks & Open Questions)

| 리스크 | 영향 | 완화책 |
|--------|------|--------|
| 브라우저 자동재생 정책 → 첫 알림 무음 | 중 | 토글 ON 시 사용자 인터랙션 ↔ `Audio.load()` 실행하여 unlock |
| 다중 탭 동시 열림 → 중복 알림 (5명 × 3탭 = 15회 OS 알림) | 중 | 1차는 허용. 후속 PDCA에서 `BroadcastChannel`로 탭 간 dedup |
| Realtime WebSocket 끊김 (네트워크 불안정) | 중 | `@supabase/realtime-js`가 자동 재연결. 추가로 30초마다 fallback 폴링 ✗ (1차 생략, Realtime 신뢰) |
| `Notification API` Safari·구버전 미지원 | 저 | `typeof Notification !== 'undefined'` 가드 |
| 토스트 클릭 라우팅 시 RSC 페이지 prefetch 누락 | 저 | `<Link prefetch>` 대신 `router.push` |
| 사운드 파일 라이선스 분쟁 | 저 | CC0 또는 자체 생성(Web Audio API 톤 생성도 검토) |

### 미해결 질문 → Design 단계에서 확정

- **Q1**: 알림음 — `notification.mp3` 파일 vs Web Audio API 자체 생성 톤? → Design에서 결정
- **Q2**: 토스트 컴포넌트 위치 — 우측 상단(요청서대로) vs 우측 하단? → 요청서 따라 우측 상단 확정
- **Q3**: 소리 토글 위치 — 사이드바 푸터 vs 모바일 헤더 vs 양쪽? → Design에서 결정 (잠정: 사이드바 푸터)
- **Q4**: 다른 세션이 동시 다발 도착 시 토스트 묶기(grouping) 정책 → 1차는 개별 토스트(최대 3개 스택)
- **Q5**: 채팅방 미답변 ≥ N분 시 추가 알림(에스컬레이션)? → Out of Scope, 후속 PDCA

---

## 9. 성공 기준 (Acceptance Criteria)

- [ ] `/admin/inventory`에서 작업 중 새 채팅 도착 → 사이드바 뱃지, 토스트, 알림음 모두 ≤ 2초 내 표시
- [ ] 소리 토글 OFF → 시각 알림만, 소리·OS 알림 없음
- [ ] 소리 토글 ON 상태에서 새로고침 → 토글 상태 유지
- [ ] 토스트 클릭 → 해당 `/admin/chat/{sessionId}`로 이동
- [ ] 해당 채팅방 페이지 진입 → 1초 이내 뱃지 카운트 그 세션만큼 감소 (트리거 기준)
- [ ] 다른 탭(Excel 등)에 포커스 → 권한 부여 시 OS 알림 표시, 미부여 시 무시
- [ ] 같은 세션 메시지(보고 있을 때) → 소리·토스트 없음, 뱃지·탭 타이틀 자동 0
- [ ] Vitest 커버리지: NotificationProvider 핵심 로직 70%+
- [ ] 빌드 성공 (`npm run build`)
- [ ] ESLint 통과 (`npm run lint`)
- [ ] 모바일(폭 375px) 뷰포트에서 뱃지 정상 표시

---

## 10. 다음 단계 (Next Steps)

1. **Design Phase** → `docs/02-design/features/admin-chat-notification.design.md`
   - 컴포넌트 트리 / Context 구조 / Realtime 구독 정확한 SQL filter / 토스트 컴포넌트 인터페이스 / 사운드 unlock 시퀀스
2. **Do Phase** → 구현
3. **Check Phase** → gap-detector로 Match Rate ≥ 90% 검증
4. **Act Phase** → Match Rate < 90%면 pdca-iterator, ≥ 90%면 report-generator

---

**End of Plan**
