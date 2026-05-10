# Plan: 채팅 후속 작업 (G-03 / G-05 / G-07)

> **Feature**: `chat-followups-g03-g05-g07`
> **Phase**: Plan
> **Created**: 2026-05-10
> **Owner**: jaeho19@gmail.com
> **Parent PDCA**: [`realtime-translation-chat`](./realtime-translation-chat.plan.md) (완료, matchRate 96%, 2026-05-08)

---

## 1. 배경 (Background)

직전 PDCA 사이클 `realtime-translation-chat` (2026-05-08, 96% 완료)에서 발견된 7개 Gap 중 4개는 Iteration 1으로 처리됐고, **3개가 의식적으로 후속 사이클로 분리**되었다. 보고서 §8 P0 백로그(`docs/04-report/features/realtime-translation-chat.report.md`)에 명시된 그대로 처리한다.

| Gap | 등급 | 분리 사유 | 본 사이클 처리 |
|-----|:----:|----------|:------------:|
| **G-03** `trackChatClose` 정의 + 호출 | Medium | "G-02로 주요 이벤트 커버, 모니터링용 후순위" | ✅ |
| **G-05** Presence 정확도 (`chat_operator_status` 테이블) | Medium | "Design §5.4에 MVP 단순화 인지된 한계 명시 — 별도 PDCA 권장" | ✅ |
| **G-07** 위젯 unread 배지 | Medium | "UX 향상이지만 핵심 기능 비영향" | ✅ |

이 세 갭을 한 사이클로 묶는 이유:
- 모두 채팅 기능의 **운영 가시성/모니터링**에 관한 갭으로 도메인이 동일
- 변경 범위가 surgical (각 30~100 LOC) → 단일 PDCA로 효율
- pg_cron 자동화(P1)는 별도 사이클로 분리(이번 범위 제외)

본 사이클 종료 후 채팅 시스템은 **운영 모니터링 완비 + 발견율 강화** 상태가 된다.

---

## 2. 목표 (Goals)

1. **G-03** — `trackChatClose(reason, durationSec)`를 정의하고 위젯 패널 close / 어드민 세션 종료 시점에 호출하여 GA4에서 채팅 세션 수명·종료 사유를 추적할 수 있게 한다.
2. **G-05** — 운영자 대시보드에 60초 heartbeat 도입 + `chat_operator_status` 테이블 → `/api/chat/presence`가 *실제 온라인 운영자 수*를 반환. 기존 "businessHours = 온라인" 단순화 제거.
3. **G-07** — 방문자가 위젯을 닫은 동안 운영자가 답변하면, 다시 토글 버튼으로 돌아왔을 때 **빨간 점 배지**로 미확인 메시지 존재를 알린다.

본 작업은 직전 사이클의 **품질 보강**이며 신규 사용자 노출 기능 추가가 아니다.

---

## 3. 범위 (Scope)

### In Scope (이번 사이클)

#### G-03: `trackChatClose` Analytics
- `liv-clinic/src/lib/analytics-events.ts`에 `trackChatClose(reason: 'visitor_close' | 'operator_close' | 'session_timeout', durationSec: number)` 함수 정의
- 호출 지점:
  - **방문자 측**: `ChatPanel` 닫기(`onClose`) 또는 `ChatWidget` 토글 닫힘 → `reason: 'visitor_close'`, durationSec = (now - openedAt) / 1000
  - **어드민 측**: `ChatDetailClient` "대화 종료" PATCH 성공 시 → `reason: 'operator_close'`, durationSec = (closed_at - created_at) / 1000
- GA4 매개변수: `reason`, `duration_sec`, `session_id_hash` (PII 보호용 해시)

#### G-05: Presence 정확도 (heartbeat 방식)
- **신규 마이그레이션** `supabase/migrations/029_chat_operator_status.sql`:
  - `chat_operator_status(operator_id uuid PK, last_seen_at timestamptz, status text)` 테이블
  - RLS: 본인 row 자기 read/upsert, service_role 전체 read (presence API용)
  - `last_seen_at` 인덱스
- **신규 lib** `liv-clinic/src/lib/chat/operatorPresence.ts`:
  - `markOperatorOnline(supabase, userId)` — upsert with `last_seen_at = now()`
  - `getOnlineOperatorCount(serviceClient)` — `last_seen_at > now() - interval '90 seconds'` count
- **Heartbeat 훅** `liv-clinic/src/hooks/useOperatorHeartbeat.ts`:
  - 운영자 어드민 페이지(`/admin/(authenticated)/chat/...`)에서 60초마다 markOperatorOnline 호출
  - 페이지 unmount 시 cleanup interval
- **API 갱신** `liv-clinic/src/app/api/chat/presence/route.ts`:
  - 기존: `online: businessHours` 단순화
  - 신규: `getOnlineOperatorCount() > 0`을 우선 사용. 0이면 `businessHours` 폴백(테이블 빈 상태 안전)
  - 응답: `{ online: boolean, operatorCount: number, isBusinessHours: boolean }` (확장)
- **어드민 사이드바**: `useOperatorHeartbeat()` 마운트 위치 (모든 admin 인증 레이아웃)

#### G-07: 위젯 unread 배지
- `liv-clinic/src/hooks/useChatSession.ts` 또는 `useChatRealtime.ts`:
  - 패널 닫힌 상태에서 신규 operator/system 메시지 도착 시 `unreadVisitorCount` state 증가
  - 패널 열기(`isOpen=true`) 시 `unreadVisitorCount = 0` 리셋
  - localStorage 영속화 (탭 새로고침 후에도 유지)
- `liv-clinic/src/components/chat/ChatWidget.tsx`:
  - 토글 버튼 우상단에 빨간 점 (또는 카운트) 표시 (`unreadVisitorCount > 0`일 때)
  - 첫 진입(세션 복원) 시 미확인 메시지가 있으면 즉시 표시
- 첫 진입 fetch: 세션 복원 시 마지막 패널 열림 시각 이후의 operator/system 메시지 수를 GET `/api/chat/sessions/[id]/messages?since=...&unread=true`로 조회 (또는 클라이언트 카운트로 단순화)

### Out of Scope

- pg_cron 기반 메시지 보존 자동삭제(1년)
- pg_cron 기반 30분 미응답 자동 팔로업
- 일별 미응답 이메일 알림(Resend)
- DeepL API 폴백
- AI 자동 응답 봇
- 이미지/파일 첨부
- 외부 메신저 브릿지 (WhatsApp/LINE)
- 운영자 다중 권한 분리
- 다중 운영자 동시 대화 처리 정책 변경

---

## 4. 요구사항 (Requirements)

### Functional Requirements

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | `trackChatClose(reason, durationSec)` 함수가 `analytics-events.ts`에 정의된다. | P0 |
| FR-02 | 방문자가 패널을 닫을 때 `trackChatClose('visitor_close', duration)` 호출. | P0 |
| FR-03 | 어드민이 "대화 종료"를 클릭할 때 `trackChatClose('operator_close', duration)` 호출. | P0 |
| FR-04 | `chat_operator_status` 테이블 + RLS가 마이그레이션으로 생성된다. | P0 |
| FR-05 | 운영자 어드민 페이지에서 60초마다 `last_seen_at` upsert가 실행된다. | P0 |
| FR-06 | `/api/chat/presence`가 `last_seen_at > now()-90s`인 operator 수를 반환한다. | P0 |
| FR-07 | 운영자가 0명이면 응답이 `online: false`, 1명 이상이면 `online: true`. | P0 |
| FR-08 | `chat_operator_status` 테이블 빈 상태일 때(초기) 기존 businessHours 폴백이 작동한다. | P1 |
| FR-09 | 위젯 토글 버튼에 unread 표시(빨간 점)가 패널 닫힌 상태에서 신규 operator/system 메시지 도착 시 노출된다. | P0 |
| FR-10 | 패널을 열면 unread 카운트가 0으로 리셋된다. | P0 |
| FR-11 | 세션 복원 후 첫 진입 시 미확인 메시지가 있으면 즉시 unread 표시. | P1 |
| FR-12 | unread 카운트는 localStorage(또는 동등)에 영속화되어 새로고침 후에도 유지. | P2 |

### Non-Functional Requirements

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-01 | Heartbeat 부하 | 60초당 upsert 1회/operator. 동시 운영자 5명 기준 분당 5 RPC ≤ Supabase Free 한도 |
| NFR-02 | Presence 응답 시간 | `/api/chat/presence` p95 ≤ 200ms (인덱스 사용) |
| NFR-03 | RLS 정책 | `chat_operator_status` anon 차단(deny-by-default), authenticated는 본인 row만 read/upsert |
| NFR-04 | unread 배지 a11y | `aria-label`에 "N개의 새 메시지" 다국어 포함 |
| NFR-05 | unread 배지 모바일 | 터치 타겟 영향 없음(토글 버튼 ≥44×44 유지) |
| NFR-06 | 빌드 안정성 | `npm run lint`(chat 관련 파일 0 errors), `npm run build` exit 0 |
| NFR-07 | Heartbeat 메모리 누수 | 페이지 unmount 시 interval clear 보장 |
| NFR-08 | Analytics PII | `trackChatClose`는 session_id를 직접 전송하지 않고 SHA-256 해시 사용 |

---

## 5. 제약사항 (Constraints)

- **기존 테이블/RLS와 호환**: `chat_operator_status`는 `chat_sessions`/`chat_messages`와 독립. FK 없음 (operator_id는 `auth.users.id` 참조).
- **service_role 사용 최소화**: `presence` API에서만 service_role로 count 조회. 클라이언트는 service_role 키 미접근.
- **Heartbeat 인터벌**: 60초 권장. Supabase 부하 대비 최대 30초까지만 단축 가능. 90초 timeout(`now()-90s`)으로 1번 누락 허용.
- **어드민 인증 컨텍스트**: 기존 `createServerClient().auth.getUser()` 패턴 준수. heartbeat 호출 시 인증된 사용자만 자기 row upsert.
- **Analytics 호출 위치**: 컴포넌트 unmount 시점이 아닌 명시적 close 액션에서 호출 (라우팅 변경, 탭 전환 등은 제외).
- **localStorage 키 충돌 방지**: 기존 `liv_chat_session_*` 패턴 따라 `liv_chat_unread_${sessionId}` 사용.
- **모바일 키보드/뷰포트**: unread 배지 추가가 기존 dvh + safe-area 레이아웃에 영향을 주지 않도록 절대 위치(absolute) + transform 사용.

---

## 6. 수용 기준 (Acceptance Criteria)

### G-03 (`trackChatClose`)
- [ ] `trackChatClose` 함수가 `analytics-events.ts`에 export됨
- [ ] 방문자 위젯 닫기 → GA4 DebugView에 `chat_close` 이벤트 노출 (`reason=visitor_close`)
- [ ] 어드민 "대화 종료" PATCH 성공 → `chat_close` 이벤트 (`reason=operator_close`)
- [ ] `duration_sec` 파라미터가 양수, session 생성 시각과 일치
- [ ] `session_id_hash` 16자 이상 hex 문자열, 원본 UUID 노출 없음

### G-05 (Presence 정확도)
- [ ] 마이그레이션 적용 후 `chat_operator_status` 테이블이 Supabase에 존재
- [ ] RLS 정책 활성화 (anon SELECT 차단 검증)
- [ ] 어드민 채팅 페이지 진입 → 60초 후 `last_seen_at` 갱신 확인 (Supabase 콘솔 또는 SELECT)
- [ ] 운영자 1명 온라인 시 `/api/chat/presence` 응답 `online: true`, `operatorCount: 1`
- [ ] 운영자 페이지 닫고 90초 경과 → `online: false`, `operatorCount: 0`
- [ ] 테이블 비어있을 때 기존 businessHours 폴백 작동
- [ ] 빌드 성공

### G-07 (위젯 unread 배지)
- [ ] 위젯 닫힌 상태에서 어드민 메시지 전송 → 토글 버튼에 빨간 점 노출
- [ ] 토글 클릭으로 패널 열기 → 빨간 점 사라짐
- [ ] 세션 새로고침(F5) 후 패널 닫힌 채로 미확인 메시지 있으면 빨간 점 즉시 노출
- [ ] 패널 열린 상태에서 메시지 수신 → 빨간 점 표시되지 않음 (이미 보고 있음)
- [ ] 빨간 점에 `aria-label` 다국어(en/ja/zh) 적용
- [ ] 모바일에서 토글 버튼 터치 영역 영향 없음

### 통합
- [ ] `npm run lint` chat 관련 파일 0 errors
- [ ] `npm run build` exit 0
- [ ] 기존 PDCA 시나리오 4개 (en/ja/zh + 어드민 → 방문자) 회귀 정상

---

## 7. 예상 구조 (변경 파일)

### 신규 파일

| 파일 | 설명 | LOC 추정 |
|------|------|:--------:|
| `supabase/migrations/029_chat_operator_status.sql` | 테이블 + RLS + 인덱스 | 40 |
| `liv-clinic/src/lib/chat/operatorPresence.ts` | `markOperatorOnline`, `getOnlineOperatorCount` | 50 |
| `liv-clinic/src/hooks/useOperatorHeartbeat.ts` | 60초 interval + cleanup | 35 |

### 수정 파일

| 파일 | 변경 유형 | 설명 | LOC 추정 |
|------|----------|------|:--------:|
| `liv-clinic/src/lib/analytics-events.ts` | 함수 추가 | `trackChatClose`, session_id 해시 유틸 | 25 |
| `liv-clinic/src/components/chat/ChatPanel.tsx` | 호출 추가 | 닫기 시 `trackChatClose('visitor_close', ...)` | 10 |
| `liv-clinic/src/components/chat/ChatWidget.tsx` | UI 추가 | unread 배지 + onClose 핸들러 | 30 |
| `liv-clinic/src/hooks/useChatSession.ts` | 상태 추가 | `unreadVisitorCount` + localStorage 영속화 | 40 |
| `liv-clinic/src/hooks/useChatRealtime.ts` | 카운트 증가 | 패널 닫힌 동안 신규 메시지 카운트 | 15 |
| `liv-clinic/src/app/api/chat/presence/route.ts` | 로직 교체 | businessHours 단독 → operator count + 폴백 | 30 |
| `liv-clinic/src/app/admin/(authenticated)/chat/ChatDetailClient.tsx` | 호출 추가 | PATCH 성공 시 `trackChatClose('operator_close', ...)` | 10 |
| `liv-clinic/src/app/admin/(authenticated)/layout.tsx` 또는 채팅 layout | 훅 마운트 | `useOperatorHeartbeat()` | 5 |
| `liv-clinic/src/types/supabase.ts` | 자동 재생성 | `chat_operator_status` 타입 추가 | (auto) |
| `liv-clinic/src/messages/{en,ja,zh}.json` | 키 추가 | `chat.unreadAria` (다국어 SR 라벨) | 9 |

**합계 추정**: 신규 3 + 수정 9 = 12 파일, ~300 LOC + 마이그레이션 1개

---

## 8. 리스크 및 대응

| 리스크 | 영향도 | 대응 |
|--------|:----:|------|
| Heartbeat가 운영자 페이지 무한 백그라운드로 누적 부하 | Medium | useEffect cleanup으로 unmount 시 clearInterval 보장. 60초 인터벌로 분당 RPC 1건/operator 한도 |
| `chat_operator_status` RLS 누락 시 anon이 운영자 ID 조회 가능 | High | 마이그레이션에 RLS enable + anon deny 명시, Design 단계에서 재검토 |
| Presence 응답이 비어있을 때 `online: false`로만 폴백 → 정상 운영시간에도 false | High | 테이블 row count = 0이면 기존 businessHours 폴백 사용. 점진 도입 안전성 |
| Analytics PII 유출 (session_id 평문 전송) | High | SHA-256 해시 후 처음 16자만 전송. `analytics-events.ts`에 `hashSessionId()` 별도 정의 |
| unread 카운트 race condition (열기/닫기 빠른 연속 클릭) | Low | state 업데이트는 useState 함수형 setter (prev → next) 사용 |
| localStorage 영속화 시 다른 세션과 키 충돌 | Medium | sessionId 별 키 prefix `liv_chat_unread_${sessionId}` |
| Heartbeat 시작 직후 운영자 카운트 0(첫 갱신 전) | Low | 첫 진입 즉시 1회 갱신 후 setInterval 시작. 첫 갱신 전엔 businessHours 폴백 |
| 다중 탭/창 운영자 같은 user → 카운트 1로 집계 (operator_id PK upsert) | Low | 의도된 동작 (1명 = 1 user). 동시 처리 가능 대화수와 무관 |
| Presence 호출 빈도 증가로 어드민 페이지 진입 시 N+1 쿼리 | Low | 위젯의 presence polling은 60초 단위, count() 1회 쿼리 |

---

## 9. 다음 단계 (Next Phase)

- `/pdca design chat-followups-g03-g05-g07` — 다음 항목 확정:
  - `chat_operator_status` 컬럼 정의 + RLS 정책 정확한 SQL
  - heartbeat 호출 위치 (어드민 layout 한곳 vs 채팅 layout)
  - presence API 응답 스키마 변경 호환성 (기존 `{online}` 클라이언트 영향)
  - unread 카운트 구현 위치 (useChatSession vs useChatRealtime)
  - localStorage 영속화 vs sessionStorage 결정
  - GA4 이벤트 파라미터 정확한 키 (`reason`, `duration_sec`, `session_id_hash`)
- `/pdca do chat-followups-g03-g05-g07` — 마이그레이션 → presence API → heartbeat → unread 배지 → analytics 순 구현
- `/pdca analyze chat-followups-g03-g05-g07` — Gap 분석 + RLS/PII 검증

---

## 10. 참고 자료

### 부모 PDCA
- Plan: [`docs/01-plan/features/realtime-translation-chat.plan.md`](./realtime-translation-chat.plan.md)
- Design: [`docs/02-design/features/realtime-translation-chat.design.md`](../../02-design/features/realtime-translation-chat.design.md)
- Analysis: [`docs/03-analysis/realtime-translation-chat.analysis.md`](../../03-analysis/realtime-translation-chat.analysis.md)
- Report: [`docs/04-report/features/realtime-translation-chat.report.md`](../../04-report/features/realtime-translation-chat.report.md)

### 관련 코드
- 기존 마이그레이션: `supabase/migrations/028_chat_tables.sql`
- 기존 presence API: `liv-clinic/src/app/api/chat/presence/route.ts`
- 기존 chat hooks: `liv-clinic/src/hooks/useChatSession.ts`, `useChatRealtime.ts`
- 기존 analytics: `liv-clinic/src/lib/analytics-events.ts`
- 기존 위젯: `liv-clinic/src/components/chat/ChatWidget.tsx`, `ChatPanel.tsx`
- 어드민: `liv-clinic/src/app/admin/(authenticated)/chat/ChatDetailClient.tsx`
- 운영시간 라이브러리: `liv-clinic/src/lib/chat/businessHours.ts`

### 외부 자료
- Supabase RLS: <https://supabase.com/docs/guides/auth/row-level-security>
- Supabase Realtime Presence (참고용 미사용): <https://supabase.com/docs/guides/realtime/presence>
- React useEffect cleanup: <https://react.dev/reference/react/useEffect#parameters>
- GA4 event parameters: <https://developers.google.com/analytics/devguides/collection/ga4/event-parameters>

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-10 | Initial draft (G-03/05/07 후속 사이클) | jaeho19@gmail.com |
