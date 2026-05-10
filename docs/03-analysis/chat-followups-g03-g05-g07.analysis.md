# Analysis: 채팅 후속 작업 (G-03 / G-05 / G-07)

> **Feature**: `chat-followups-g03-g05-g07`
> **Phase**: Check (Gap Analysis)
> **Created**: 2026-05-10
> **Plan**: [`../01-plan/features/chat-followups-g03-g05-g07.plan.md`](../01-plan/features/chat-followups-g03-g05-g07.plan.md)
> **Design**: [`../02-design/features/chat-followups-g03-g05-g07.design.md`](../02-design/features/chat-followups-g03-g05-g07.design.md)
> **분석 도구**: bkit:gap-detector agent + 정적 코드 검증

---

## 1. 종합 matchRate

### 1.1 가중 계산식

```
종합 = (G-03 × 0.20) + (G-05 × 0.30) + (G-07 × 0.20)
     + (보안 × 0.10) + (구현순서 × 0.05) + (빌드 × 0.10) + (i18n × 0.05)
```

| 카테고리 | 가중치 | 점수 | 가중 점수 |
|----------|:------:|:----:|:--------:|
| G-03 trackChatClose | 0.20 | 100 | 20.0 |
| G-05 Operator Presence | 0.30 | 95 | 28.5 |
| G-07 Unread Badge | 0.20 | 98 | 19.6 |
| 보안 (RLS/server-only/PII) | 0.10 | 100 | 10.0 |
| 구현 순서 (Design §11.2) | 0.05 | 95 | 4.75 |
| 빌드 (NFR-06) | 0.10 | 100 | 10.0 |
| i18n (en/ja/zh) | 0.05 | 100 | 5.0 |
| **종합 matchRate** | 1.00 | — | **97.85 → 98%** |

> **GAP-G07-1 사후 수정 후 재계산**: G-07 92% → 98% (broadcast 채널/payload 호환성 fix 완료).

```
┌───────────────────────────────────────────────┐
│  Overall Match Rate: 98% — PASS (>= 90%)      │
│  Report 단계 진입 가능                          │
└───────────────────────────────────────────────┘
```

---

## 2. 카테고리별 매칭 점수

### 2.1 G-03 trackChatClose Analytics: 100%

| 검증 항목 | 상태 | 근거 |
|----------|:----:|------|
| `hashSessionId()` SHA-256 8 bytes (16 hex) | ✅ | `analytics-events.ts:76-91` |
| `typeof window` + `crypto.subtle` 가드 | ✅ | `analytics-events.ts:77` |
| `trackChatClose(reason, durationSec, sessionId, locale?)` 시그니처 | ✅ | `analytics-events.ts:100-113` |
| `ChatCloseReason` union type | ✅ | `analytics-events.ts:93` |
| ChatPanel `openedAtRef` + open 전환 추적 | ✅ | `ChatPanel.tsx:35, 91-103` |
| 'visitor_close' 호출 (Esc/X/외부 toggle 모두 커버) | ✅ | `ChatPanel.tsx:101` |
| ChatDetailClient PATCH 성공 시 'operator_close' | ✅ | `ChatDetailClient.tsx:101-103` |
| `duration_sec` 클램프 (Math.max(0, round)) | ✅ | `analytics-events.ts:109` |
| GA4 페이로드에 session_id 평문 미전송 | ✅ | `analytics-events.ts:110` |

### 2.2 G-05 Operator Presence Heartbeat: 95%

| 검증 항목 | 상태 | 근거 |
|----------|:----:|------|
| 029 마이그레이션 스키마 (operator_id PK + last_seen_at + status CHECK + updated_at) | ✅ | `029_chat_operator_status.sql:10-16` |
| FK auth.users(id) ON DELETE CASCADE | ✅ | `029:11` |
| 인덱스 `idx_chat_operator_status_last_seen` | ✅ | `029:19-20` |
| updated_at 트리거 (BEFORE UPDATE) | ✅ | `029:23-34` |
| RLS 4개 정책 (service_role / authenticated SELECT/INSERT/UPDATE) | ✅ | `029:40-63` |
| anon deny-by-default | ✅ | `029:65` (정책 미정의) |
| 검증 SQL 주석 임베드 | ✅ | `029:67-79` |
| `operatorPresence.ts` server-only 마커 | ✅ | `operatorPresence.ts:1` |
| `getOnlineOperatorCount()` 90초 cutoff | ✅ | `operatorPresence.ts:4` |
| service_role(createAdminClient) 사용 | ✅ | `operatorPresence.ts:11` |
| `markOperatorOnline` upsert + onConflict | ✅ | `operatorPresence.client.ts:14-21` |
| Throw-free contract | ✅ | `operatorPresence.client.ts:23` |
| `useOperatorHeartbeat` 60초 + 즉시 1회 + cleanup | ✅ | `useOperatorHeartbeat.ts:7, 37-48` |
| auth.getUser() + cancelled 가드 | ✅ | `useOperatorHeartbeat.ts:23, 28-30` |
| AdminLayoutClient 마운트 (DDR-1) | ✅ | `AdminLayoutClient.tsx:7, 37` |
| presence API operatorCount 기반 online 계산 | ✅ | `presence/route.ts:27` |
| presence API source 필드 추가 | ✅ | `presence/route.ts:34` |
| 기존 4개 응답 필드 유지 (backward-compat) | ✅ | `presence/route.ts:30-34` |
| try/catch → 폴백 (200 응답 보장) | ✅ | `presence/route.ts:14-20` |
| **types/supabase.ts 자동 재생성** | ⚠️ | manual 추가 (마이그레이션 미적용) — GAP-G05-1 |

### 2.3 G-07 Unread 배지: 98% (GAP-G07-1 수정 후)

| 검증 항목 | 상태 | 근거 |
|----------|:----:|------|
| `useUnreadIndicator(sessionId)` API | ✅ | `useUnreadIndicator.ts:43-49, 57` |
| localStorage prefix `liv-chat-unread:` | ✅ | `useUnreadIndicator.ts:5, 14-16` |
| 7일 TTL | ✅ | `useUnreadIndicator.ts:6` |
| sessionId 변경 시 영속화 값 로드 | ✅ | `useUnreadIndicator.ts:62-77` |
| 함수형 setter (race-safe) | ✅ | `useUnreadIndicator.ts:81` |
| TTL 만료 자동 폐기 | ✅ | `useUnreadIndicator.ts:24-27` |
| try/catch privacy 모드 안전 | ✅ | `useUnreadIndicator.ts:20-32, 36-41` |
| ChatWidget useChatSession 호출 | ✅ | `ChatWidget.tsx:34` |
| 패널 열기 시 reset | ✅ | `ChatWidget.tsx:60-64` |
| 빨간 점 절대 위치 | ✅ | `ChatWidget.tsx:212-215` |
| open=false에서만 노출 | ✅ | `ChatWidget.tsx:211` |
| aria-label에 unreadAria 다국어 | ✅ | `ChatWidget.tsx:158-162` |
| en/ja/zh `chat.unreadAria` 키 | ✅ | en.json:4019, ja.json:4019, zh.json:4027 |
| **broadcast 채널 호환성** | ✅ | GAP-G07-1 수정 — `chat:${sessionId}` 통일 |
| **payload sender 필드** | ✅ | GAP-G07-1 수정 — broadcast.ts + 3 callers |

### 2.4 보안: 100%
- RLS ENABLE + 4 정책 + anon deny-by-default
- server-only 마커 (server lib만, client는 미적용)
- PII: SHA-256 16자 해시, typeof window 가드, sentinel
- service_role 격리 (presence API 내부만)

### 2.5 구현 순서 (Design §11.2): 95%
6단계 모두 수행. step 1만 manual types(미수정 시 100%).

### 2.6 빌드: 100%
- `npx tsc --noEmit`: 0 errors (수정 후 재검증)
- `npm run lint` chat 관련: 0 errors / 0 warnings
- `npm run build`: SUCCESS

### 2.7 i18n: 100%
- en (ICU plural), ja, zh 3 locale 모두 추가

---

## 3. 발견된 Gap 목록

### 🔴 High: 0건

### 🟡 Medium: 1건 (GAP-G05-1만 잔존)

| ID | 위치 | Design 명세 | 실제 구현 | 상태 | 권장 조치 |
|----|------|-----------|----------|:----:|----------|
| **GAP-G05-1** | `types/supabase.ts:139-159` | Design §11.2 step 1: `npm run db:types` 또는 Supabase MCP 자동 재생성 | manual 추가 (마이그레이션 미적용 상태) | 🟡 미해소 | 사용자가 029 마이그레이션 실제 적용 후 자동 재생성으로 manual diff 0 검증. `Relationships` 필드 자동 채움 가능성 있음 (현재 manual은 `[]`). 기능 영향 없음. |
| ~~GAP-G07-1~~ | ~~ChatWidget broadcast 채널~~ | ~~서버 `chat:${sessionId}`~~ | ~~`chat:${sessionId}:unread` 불일치~~ | ✅ **수정 완료** | broadcast.ts payload에 `sender` 필드 추가, 3 callers 업데이트, ChatWidget 채널명 통일 |

### 🟢 Low (긍정적 추가, 0% 감점)

| ID | 위치 | 추가 사항 | 평가 |
|----|------|----------|------|
| **ADD-1** | `ChatPanel.tsx:91-103` | `useEffect`로 open 전환 감지 → 모든 close 경로 자동 커버 | 긍정 (Esc/X/toggle 통합) |
| **ADD-2** | `useOperatorHeartbeat.ts:23, 30` | `cancelled` 플래그 추가 | 긍정 (stale write 방지) |
| **ADD-3** | `ChatWidget.tsx:34-37` | useChatSession을 위젯 레벨 호출 | 긍정 (Design dataflow §2.2 충족 필수) |
| **ADD-4** | `analytics-events.ts:88-90` | crypto 실패 시 `'hash_failed'` sentinel | 긍정 (CSP/권한 안전) |
| **ADD-5** | `presence/route.ts:23-25` | 0명 + 운영시간 내 케이스도 `source = 'businessHours'` 명시 | 긍정 (DDR-3 명확성) |
| **ADD-6** | `broadcast.ts:8` | `sender` 필드 추가 (GAP-G07-1 fix 시) | 긍정 (다른 사용처 확장성) |

---

## 4. 일치하는 강점 (Best Practices)

### 4.1 PII 보호 다층 방어 (Design §7.2)
- SHA-256 클라이언트 측 해시 → 평문 외부 노출 0
- typeof window 가드 (SSR 안전)
- crypto.subtle 미지원/실패 시 sentinel
- GA4 payload에 `session_id_hash`만 (원본 없음)

### 4.2 Throw-free Contract 일관 적용
- `markOperatorOnline`: console.warn
- `useOperatorHeartbeat`: try/catch 보호
- `presence/route.ts`: 200 응답 보장
- `useUnreadIndicator`: localStorage 실패 메모리 fallback
- `broadcast.ts`: try/catch + console.warn (기존 유지)

### 4.3 메모리 누수 방지 다중 가드
- intervalRef + clearInterval cleanup
- cancelled 플래그 (stale closure 차단)
- broadcast channel removeChannel cleanup
- localStorage TTL 7일 자동 폐기

### 4.4 Backward Compatibility 엄격 (DDR-3)
- presence API 기존 4개 필드 100% 유지
- 신규 `source` 필드는 추가만
- broadcast payload `sender`는 optional → 레거시 broadcast 무시 처리 (`if (sender && sender !== 'visitor')`)

### 4.5 RLS Defense-in-Depth
- ENABLE ROW LEVEL SECURITY
- service_role / authenticated 3개 분리 정책
- anon 정책 미정의 (deny-by-default)
- 검증 SQL 임베드

### 4.6 Clean Architecture Layer 정확 분배
- Presentation → Infrastructure 직접 호출 0건
- Application(hook) 경유로 모든 Infrastructure 접근
- server-only / client 모듈 분리

---

## 5. matchRate 평가 + 다음 단계 권장

### 5.1 종합 판정

```
┌──────────────────────────────────────────────────┐
│  Match Rate: 98% — PASS (>= 90%)                 │
├──────────────────────────────────────────────────┤
│  G-03 Analytics:        100%  ✅                  │
│  G-05 Presence:          95%  ✅ (manual types)   │
│  G-07 Unread Badge:      98%  ✅ (GAP fix 완료)   │
│  Security:              100%  ✅                  │
│  Implementation Order:   95%  ✅                  │
│  Build:                 100%  ✅                  │
│  i18n:                  100%  ✅                  │
└──────────────────────────────────────────────────┘
```

### 5.2 다음 단계: **`/pdca report chat-followups-g03-g05-g07`**

근거:
- 98% ≥ 90% 임계 통과
- High Gap 0건
- DDR 9개 100% 준수
- GAP-G07-1 즉시 수정 완료 (broadcast.ts + 3 callers + ChatWidget)
- GAP-G05-1은 운영 검증 항목 (빌드/타입 영향 없음)

### 5.3 Report 진입 전 권장 (선택)

| 우선순위 | 항목 |
|:------:|------|
| **P0** | 029 마이그레이션 Supabase 적용 + `Relationships` 자동 생성 vs manual diff 검증 |
| **P1** | 수동 QA — 위젯 닫고 어드민 답변 → 빨간 점 노출 (Design §8.1 G-07 시나리오) |
| **P2** | RLS 검증 SQL 실행 (anon 차단 0 rows 확인) |

---

## 6. Design §11.2 구현 순서 매핑

| Step | Design | 산출물 | 검증 | 상태 |
|:----:|--------|--------|------|:----:|
| 1 | 마이그레이션 + types 자동 재생성 | 029 SQL ✅ / types manual ⚠️ | 마이그레이션 실행 후 검증 SQL | ⚠️ partial |
| 2 | G-05 백엔드 | server lib + client lib + route | curl GET /api/chat/presence | ✅ |
| 3 | G-05 프론트엔드 | useOperatorHeartbeat + AdminLayoutClient | Supabase 콘솔 row 갱신 | ✅ |
| 4 | G-03 Analytics | hashSessionId + trackChatClose + 호출처 2곳 | GA4 DebugView | ✅ |
| 5 | G-07 unread 배지 | useUnreadIndicator + ChatWidget broadcast 통일 + i18n | 위젯 닫고 어드민 답변 | ✅ (GAP-G07-1 fix 후) |
| 6 | 회귀 검증 | tsc/lint/build 모두 0 errors | 사용자 명시 | ✅ |

**아키텍처 변경**: Step 5 broadcast 구독 위치는 Design 원안(`useChatRealtime` 콜백)에서 ChatWidget 별도 구독으로 변경됨. 사유는 `useChatRealtime`의 `enabled = open && !!session` 비활성화 조건. SRP 관점에서 더 깔끔하며, GAP-G07-1 fix 후 채널/payload 호환성 확보.

---

## 7. DDR(Design Decision Record) 준수도: 9/9 = 100%

| ID | DDR 결정 | 실제 구현 | 준수 |
|:--:|---------|----------|:----:|
| DDR-1 | Heartbeat 어드민 layout 마운트 | `AdminLayoutClient.tsx:37` 모든 어드민 페이지에서 동작 | ✅ |
| DDR-2 | 60초 + 90초 timeout | `useOperatorHeartbeat.ts:7` 60_000 / `operatorPresence.ts:4` 90 | ✅ |
| DDR-3 | presence API backward-compat | 기존 4개 필드 유지 + source 추가만 | ✅ |
| DDR-4 | SHA-256 16자 해시 | `analytics-events.ts:84-86` 8 bytes (16 hex) | ✅ |
| DDR-5 | unread는 클라이언트만 | `chat_sessions` 컬럼 추가 0, localStorage만 | ✅ |
| DDR-6 | localStorage 영속화 | window.localStorage 사용 | ✅ |
| DDR-7 | 빨간 점만 (카운트 미표시) | UI 단순 dot, aria-label만 카운트 포함 (a11y) | ✅ |
| DDR-8 | 폴백 → 200 응답 | try/catch + source = 'businessHours' | ✅ |
| DDR-9 | trackChatClose async | `Promise<void>` + fire-and-forget(`void`) | ✅ |

---

## 8. Iteration 로그

### Iteration 0 (Initial Analysis)
- matchRate: 96%
- Gap: GAP-G07-1 (Medium, broadcast 채널/payload 호환성), GAP-G05-1 (Medium, manual types)

### Iteration 0.5 (즉시 수정)
- **GAP-G07-1 fix**:
  - `lib/chat/broadcast.ts`: `BroadcastEvent.message_created.payload`에 optional `sender` 필드 추가
  - `api/chat/messages/route.ts`: broadcast 호출 시 `sender: updated.sender` 추가
  - `api/chat/sessions/route.ts`: system 메시지 broadcast 시 `sender: 'system'` 추가
  - `api/chat/sessions/[id]/route.ts`: sessionEnded broadcast 시 `sender: 'system'` 추가
  - `components/chat/ChatWidget.tsx`: 채널명 `chat:${sessionId}:unread` → `chat:${sessionId}` 통일, `sender && sender !== 'visitor'` 가드 (레거시 broadcast 무시)
- **재검증**: tsc 0 errors, lint chat 관련 0 errors
- matchRate: 96% → **98%** (+2%p)

---

## 9. 참고 링크

### 신규 구현
- `liv-clinic/supabase/migrations/029_chat_operator_status.sql`
- `liv-clinic/src/lib/chat/operatorPresence.ts` (server-only)
- `liv-clinic/src/lib/chat/operatorPresence.client.ts`
- `liv-clinic/src/hooks/useOperatorHeartbeat.ts`
- `liv-clinic/src/hooks/useUnreadIndicator.ts`

### 수정 구현
- `liv-clinic/src/types/supabase.ts:139-159` (manual 타입)
- `liv-clinic/src/app/api/chat/presence/route.ts`
- `liv-clinic/src/lib/analytics-events.ts:76-113`
- `liv-clinic/src/lib/chat/broadcast.ts:7-9` (sender 필드, GAP-G07-1 fix)
- `liv-clinic/src/app/api/chat/messages/route.ts:170` (sender 전달)
- `liv-clinic/src/app/api/chat/sessions/route.ts:84` (sender: 'system')
- `liv-clinic/src/app/api/chat/sessions/[id]/route.ts:81` (sender: 'system')
- `liv-clinic/src/components/admin/AdminLayoutClient.tsx`
- `liv-clinic/src/components/chat/ChatWidget.tsx`
- `liv-clinic/src/components/chat/ChatPanel.tsx`
- `liv-clinic/src/app/admin/(authenticated)/chat/[sessionId]/ChatDetailClient.tsx`
- `liv-clinic/src/messages/{en,ja,zh}.json`

---

**최종 판정**: matchRate **98%** — `/pdca report chat-followups-g03-g05-g07` 진입 권장.
