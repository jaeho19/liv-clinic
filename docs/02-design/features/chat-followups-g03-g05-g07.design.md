# Design: 채팅 후속 작업 (G-03 / G-05 / G-07)

> **Feature**: `chat-followups-g03-g05-g07`
> **Phase**: Design
> **Created**: 2026-05-10
> **Owner**: jaeho19@gmail.com
> **Plan**: [`../01-plan/features/chat-followups-g03-g05-g07.plan.md`](../../01-plan/features/chat-followups-g03-g05-g07.plan.md)
> **Parent Design**: [`./realtime-translation-chat.design.md`](./realtime-translation-chat.design.md)

---

## 1. Overview

### 1.1 설계 목표

부모 PDCA(`realtime-translation-chat`)에서 후속으로 분리된 3개 갭을 **surgical change**로 해결한다. 모든 변경은 다음을 만족한다:

1. **기존 동작 무중단**: presence API 응답 추가 필드 도입은 클라이언트 미사용 시 영향 없도록 backward-compatible
2. **데이터 격리 유지**: 신규 테이블(`chat_operator_status`)도 anon 차단 RLS 동일 적용
3. **PII 보호 강화**: `trackChatClose`는 session_id 평문 미전송, SHA-256 해시(앞 16자) 사용
4. **운영 부하 안전**: heartbeat는 60초 인터벌, 페이지 unmount 시 cleanup 100% 보장

### 1.2 설계 원칙

- **Single Responsibility**: G-03/05/07 각각의 책임 모듈을 분리. heartbeat lib은 presence 로직만, unread 훅은 카운트 관리만
- **Throw-free contracts**: heartbeat upsert 실패는 어드민 UX 차단 금지(silent fallback to console.warn)
- **Server-only 격리**: `getOnlineOperatorCount`는 service_role 사용 → `lib/chat/operatorPresence.ts` 전체에 `'server-only'` 마커
- **Client-first PII**: G-03 session_id 해시는 `crypto.subtle.digest`로 클라이언트에서 수행 → 평문이 GA4 외부 네트워크로 흐를 가능성 제거
- **Backward compatibility**: presence API는 기존 `online`, `businessHours`, `operatorCount` 필드 유지 + 의미만 강화

---

## 2. Architecture

### 2.1 컴포넌트 다이어그램

```
G-03: Analytics
┌──────────────────┐                          ┌──────────────────┐
│ ChatPanel.tsx    │  trackChatClose(...)     │                  │
│ (visitor close)  │ ─────────────────────────▶│ analytics-events │
└──────────────────┘                          │      .ts         │
                                              │                  │  → gtag → GA4
┌──────────────────┐                          │  hashSessionId() │
│ ChatDetail       │  trackChatClose(...)     │                  │
│ Client.tsx       │ ─────────────────────────▶│                  │
│ (operator close) │                          │                  │
└──────────────────┘                          └──────────────────┘

G-05: Operator Presence
┌──────────────────┐  60s    ┌──────────────────────┐  upsert  ┌────────────────────┐
│ Admin Layout     │ ───────▶│ useOperatorHeartbeat │ ────────▶│ chat_operator_     │
│ (chat pages)     │ tick    │       (hook)         │          │ status (table)     │
└──────────────────┘         └──────────────────────┘          └────────────────────┘
                                                                          │
                                                                          ▼
┌──────────────────┐  GET    ┌──────────────────────┐  count   ┌────────────────────┐
│ ChatPanel        │ ───────▶│ /api/chat/presence   │ ────────▶│ getOnlineOperator  │
│ (visitor poll)   │  60s    │   (route handler)    │          │ Count(>now-90s)    │
└──────────────────┘         └──────────────────────┘          └────────────────────┘
                                       │
                                       └─ fallback if count=0 → isBusinessHours()

G-07: Unread Badge
┌──────────────────┐         ┌──────────────────────┐  count   ┌────────────────────┐
│ ChatWidget       │ ◀───────│ useUnreadIndicator   │ ─────────│ localStorage       │
│ (toggle button)  │ badge   │       (hook)         │  +event  │ liv-chat-          │
└──────────────────┘         └──────────────────────┘          │ unread:{sessionId} │
                                       ▲                        └────────────────────┘
                                       │ on new operator/system msg
                              ┌──────────────────────┐
                              │ useChatRealtime      │
                              │ (broadcast handler)  │
                              └──────────────────────┘
```

### 2.2 Data Flow

#### G-03 (visitor close)
```
[ChatWidget setOpen(false)] → [ChatPanel onClose]
  → durationSec = (now - openedAt) / 1000
  → hashSessionId(sessionId)  // SHA-256 → hex(0..16)
  → trackChatClose('visitor_close', durationSec, hash)
  → gtag('event', 'chat_close', { reason, duration_sec, session_id_hash })
```

#### G-05 (operator heartbeat)
```
[Admin enters /admin/.../chat/*]
  → useOperatorHeartbeat() mounts
  → markOperatorOnline(supabase, userId)  // 즉시 1회
  → setInterval(60_000) → markOperatorOnline()
  → unmount → clearInterval()

[Visitor opens widget]
  → polling /api/chat/presence (60s)
  → GET → getOnlineOperatorCount()
       count = SELECT COUNT(*) FROM chat_operator_status
                WHERE last_seen_at > now() - interval '90 seconds'
  → if count > 0: { online: true, operatorCount: count }
  → else fallback: isBusinessHours() → { online: bh, operatorCount: bh ? 0 : 0, fallback: 'businessHours' }
```

#### G-07 (unread indicator)
```
[Initial mount with persisted session]
  → useUnreadIndicator(sessionId, isOpen) loads
  → readPersistedUnread(sessionId) from localStorage
  → if persisted > 0: setBadge(true)

[While open=false, useChatRealtime receives operator/system msg]
  → unreadIndicator.increment(msg)
  → write localStorage { count: N, lastSeenAt: prev }

[Toggle to open=true]
  → unreadIndicator.reset()
  → write localStorage { count: 0, lastSeenAt: now() }
  → setBadge(false)
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `useOperatorHeartbeat` | `lib/supabase-browser`, current user session | 60s upsert |
| `lib/chat/operatorPresence.ts` (server) | `lib/supabase/admin` | service-role count |
| `/api/chat/presence` route | `operatorPresence.ts`, `businessHours.ts` | unified response |
| `useUnreadIndicator` | `useChatRealtime` (optional new param), localStorage | local state |
| `analytics-events.ts:hashSessionId()` | `crypto.subtle.digest` (browser native) | PII hash |
| `trackChatClose` | `hashSessionId`, `trackEvent` | GA4 emit |

신규 외부 라이브러리 도입 없음(Web Crypto API는 모든 모던 브라우저 내장).

---

## 3. Data Model

### 3.1 신규 테이블: `chat_operator_status`

```typescript
interface ChatOperatorStatus {
  operator_id: string;       // UUID, PK, references auth.users(id)
  last_seen_at: Date;        // TIMESTAMPTZ — 매 heartbeat마다 갱신
  status: 'online' | 'away'; // 향후 확장용 (현재 항상 'online' upsert)
  updated_at: Date;          // 마지막 upsert 시각
}
```

**FK 정책**: `operator_id REFERENCES auth.users(id) ON DELETE CASCADE` — 운영자 계정 삭제 시 row 자동 정리.

**PK 선택**: `operator_id`를 PK로 사용 → upsert 시 ON CONFLICT 자연스러움. 1 user = 1 row.

### 3.2 Entity Relationship (변경 영역만)

```
[auth.users] 1 ──── 1 [chat_operator_status]
                              ▲
                              │ counted by
                              │
                    [/api/chat/presence]
                              │
                              ▼
                   [Visitor ChatPanel polling]
```

`chat_sessions` / `chat_messages`는 **변경 없음**. G-07 unread 카운트는 클라이언트만 사용(서버 컬럼 추가 없음 — Plan §3 In Scope 명시).

### 3.3 Database Schema (마이그레이션 029)

```sql
-- ============================================
-- 029: chat_operator_status (Presence heartbeat)
-- - 어드민 채팅 페이지에서 60초마다 last_seen_at upsert
-- - presence API가 last_seen_at > now()-90s 카운트
-- - RLS: anon 차단, authenticated 자기 row만, service_role 전체
-- ============================================

CREATE TABLE IF NOT EXISTS public.chat_operator_status (
  operator_id   UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  status        TEXT         NOT NULL DEFAULT 'online'
                             CHECK (status IN ('online','away')),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_operator_status_last_seen
  ON public.chat_operator_status (last_seen_at DESC);

-- updated_at 트리거 (기존 fn_chat_sessions_updated_at 패턴 동일)
CREATE OR REPLACE FUNCTION public.fn_chat_operator_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chat_operator_status_updated_at ON public.chat_operator_status;
CREATE TRIGGER trg_chat_operator_status_updated_at
  BEFORE UPDATE ON public.chat_operator_status
  FOR EACH ROW EXECUTE FUNCTION public.fn_chat_operator_status_updated_at();

-- RLS
ALTER TABLE public.chat_operator_status ENABLE ROW LEVEL SECURITY;

-- service_role: 전체 접근 (presence API count용)
DROP POLICY IF EXISTS "Service role full access to operator_status" ON public.chat_operator_status;
CREATE POLICY "Service role full access to operator_status"
  ON public.chat_operator_status FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- authenticated: 자기 row만 SELECT/INSERT/UPDATE (heartbeat용)
DROP POLICY IF EXISTS "Authenticated can read own status" ON public.chat_operator_status;
CREATE POLICY "Authenticated can read own status"
  ON public.chat_operator_status FOR SELECT
  USING (auth.uid() = operator_id);

DROP POLICY IF EXISTS "Authenticated can upsert own status" ON public.chat_operator_status;
CREATE POLICY "Authenticated can upsert own status"
  ON public.chat_operator_status FOR INSERT
  WITH CHECK (auth.uid() = operator_id);

DROP POLICY IF EXISTS "Authenticated can update own status" ON public.chat_operator_status;
CREATE POLICY "Authenticated can update own status"
  ON public.chat_operator_status FOR UPDATE
  USING (auth.uid() = operator_id)
  WITH CHECK (auth.uid() = operator_id);

-- anon은 deny-by-default (정책 미정의 = 거부)
```

**검증 SQL** (수동 실행):
```sql
-- 1. anon 차단 검증 (실패해야 정상)
SET ROLE anon;
SELECT * FROM public.chat_operator_status;  -- → 0 rows
RESET ROLE;

-- 2. 다른 user row 차단 검증
SET ROLE authenticated;
SET request.jwt.claims = '{"sub":"OTHER_UUID"}';
SELECT * FROM public.chat_operator_status;  -- → 0 rows (자기 row 아님)
RESET ROLE;
```

---

## 4. API Specification

### 4.1 변경 API: `GET /api/chat/presence`

**기존**:
```ts
// route.ts (현재)
export async function GET() {
  const businessHours = isBusinessHours();
  return NextResponse.json({
    online: businessHours,
    operatorCount: businessHours ? 1 : 0,
    businessHours,
    schedule: config,
  });
}
```

**개선**:
```ts
// route.ts (G-05 후)
export const runtime = 'nodejs';

export async function GET() {
  const businessHours = isBusinessHours();
  const config = getBusinessHoursConfig();
  let operatorCount = 0;
  let source: 'realtime' | 'businessHours' = 'realtime';

  try {
    operatorCount = await getOnlineOperatorCount();  // service_role
  } catch (e) {
    console.warn('[presence] heartbeat query failed, fallback to businessHours', e);
    source = 'businessHours';
  }

  // 폴백: realtime 쿼리 성공했으나 0명일 때, 운영시간 내라면 backward-compat 유지
  if (operatorCount === 0 && businessHours) {
    source = 'businessHours';
  }

  const online = operatorCount > 0 || (source === 'businessHours' && businessHours);

  return NextResponse.json({
    online,
    operatorCount,
    businessHours,
    schedule: config,
    source,  // 신규 필드 (디버깅용, 클라이언트 무시 가능)
  });
}
```

**응답 호환성**:
- 기존 필드 4개 (`online`, `operatorCount`, `businessHours`, `schedule`) **모두 유지**
- 신규 1개 (`source`) 추가만 — 기존 클라이언트 무영향
- `online` 계산은 OR 결합으로 보강 → 운영자 0명이고 운영시간 외면 false (정확도 ↑), 운영자 0명이고 운영시간 내면 true (운영자 부재 안전 폴백)

### 4.2 신규 lib API (server-only)

```ts
// liv-clinic/src/lib/chat/operatorPresence.ts
import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';

const HEARTBEAT_TIMEOUT_SECONDS = 90;

export async function getOnlineOperatorCount(): Promise<number> {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - HEARTBEAT_TIMEOUT_SECONDS * 1000).toISOString();
  const { count, error } = await supabase
    .from('chat_operator_status')
    .select('operator_id', { count: 'exact', head: true })
    .gt('last_seen_at', cutoff);
  if (error) throw new Error(`presence_query_failed:${error.code}`);
  return count ?? 0;
}
```

### 4.3 신규 client API

```ts
// liv-clinic/src/lib/chat/operatorPresence.client.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export async function markOperatorOnline(
  supabase: SupabaseClient,
  operatorId: string,
): Promise<void> {
  const { error } = await supabase
    .from('chat_operator_status')
    .upsert(
      { operator_id: operatorId, last_seen_at: new Date().toISOString(), status: 'online' },
      { onConflict: 'operator_id' },
    );
  if (error) {
    // throw-free contract — silent log
    console.warn('[heartbeat] upsert failed', error.code);
  }
}
```

### 4.4 Analytics 함수

```ts
// liv-clinic/src/lib/analytics-events.ts (추가분)

/** Session ID를 GA4용 16자 hex 해시로 변환 (PII 보호) */
async function hashSessionId(sessionId: string): Promise<string> {
  if (typeof window === 'undefined' || !crypto?.subtle) {
    return 'unsupported';
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(sessionId);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .slice(0, 8)  // 8 bytes = 16 hex chars
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export type ChatCloseReason = 'visitor_close' | 'operator_close' | 'session_timeout';

/** 채팅 세션 종료 (방문자 패널 닫기 또는 어드민 종료) */
export async function trackChatClose(
  reason: ChatCloseReason,
  durationSec: number,
  sessionId: string,
  locale?: 'en' | 'ja' | 'zh',
): Promise<void> {
  const sessionIdHash = await hashSessionId(sessionId);
  trackEvent('chat_close', {
    reason,
    duration_sec: Math.max(0, Math.round(durationSec)),
    session_id_hash: sessionIdHash,
    ...(locale && { locale }),
  });
}
```

**호출 예시**:
```ts
// ChatPanel.tsx onClose
const onClose = async () => {
  if (session?.sessionId && openedAtRef.current) {
    const dur = (Date.now() - openedAtRef.current) / 1000;
    await trackChatClose('visitor_close', dur, session.sessionId, locale);
  }
  externalOnClose();
};
```

---

## 5. UI/UX Design

### 5.1 G-07 위젯 unread 배지 레이아웃

```
                                        ┌─────────────────────────┐
                                        │  💬  Live chat  🇬🇧↔🇰🇷  │ ← 기존 토글 버튼
                                        └─────────────────────────┘
                                                          ▲
                                                          │
              ┌─────────────────────────────┐            │
              │  💬  Live chat  🇬🇧↔🇰🇷  ●   │  ← 신규 (빨간 점)
              └─────────────────────────────┘            ▲
                                                          │ 절대 위치
                                                          │ top: -4px, right: -4px
                                                          │ width: 12px, height: 12px
                                                          │ background: #dc2626 (red-600)
                                                          │ ring: 2px white
```

**규칙**:
- 빨간 점은 토글 버튼 우상단에 절대 위치
- 카운트는 미표시(단순 dot 모드, MVP) — 향후 N개 표시는 별도 PDCA
- 기존 펄스 글로우와 충돌 회피: 펄스 종료(5초) 후에만 빨간 점 노출 검토 → 결정: 빨간 점은 펄스와 독립 노출 (펄스는 첫 5초 마운트 효과, 배지는 unread > 0일 때 노출)
- a11y: `aria-live="polite"` 영역에 "N개의 새 메시지" SR 안내(다국어)

### 5.2 G-07 상태 머신

```
┌────────┐  msg arrives (operator/system)   ┌────────────┐
│ closed │ ──────── while open=false ─────▶ │ has unread │
│ &      │                                  │ (badge on) │
│ unread │                                  └────────────┘
│ = 0    │ ◀────── toggle open ──────────── │
└────────┘                                  │
   ▲                                        │
   │ panel closes &                         │
   │ count had been reset                   │
   └────────────────────────────────────────┘
```

### 5.3 컴포넌트 변경표

| Component | Location | 변경 | 신규/수정 |
|-----------|----------|------|----------|
| `ChatWidget` | `components/chat/` | 빨간 점 SVG 추가, `useUnreadIndicator` 사용 | 수정 |
| `ChatPanel` | `components/chat/` | onClose에 `trackChatClose` + duration 측정 | 수정 |
| `ChatDetailClient` | `app/admin/(authenticated)/chat/` | PATCH 성공 시 `trackChatClose('operator_close')` | 수정 |
| `useUnreadIndicator` | `hooks/` | 신규 hook (count, increment, reset, persisted) | 신규 |
| `useOperatorHeartbeat` | `hooks/` | 신규 hook (60s interval upsert) | 신규 |

### 5.4 G-05 Heartbeat 마운트 위치 결정

**옵션 비교**:

| 옵션 | 장점 | 단점 |
|------|------|------|
| (A) 어드민 인증 layout(`/admin/(authenticated)/layout.tsx`) | 모든 어드민 페이지에서 heartbeat → 운영자가 채팅 외 다른 페이지에 있어도 onlineCount에 포함 | 인벤토리/세팅 페이지 사용자도 채팅 운영자로 카운트 → 정확도 ↓ |
| (B) 채팅 layout(`/admin/(authenticated)/chat/layout.tsx` 또는 직접 page) | 채팅 화면 진입 시에만 카운트 → 정확도 ↑ | 다른 어드민 탭에 있을 때 visitor가 보면 offline 표시 |
| (C) 어드민 layout + 별도 toggle | 운영자가 명시적으로 "채팅 응대 중" 상태 toggle | UX 복잡도, 잊으면 false negative |

**선택**: **(A) 어드민 인증 layout**.

**근거**:
- LIV는 운영자 ≤ 3명 소규모 → 누구든 어드민 들어와 있으면 응대 가능
- 운영자가 inventory 보면서도 "옆 탭에 채팅 열려 있음"이 일반 워크플로우
- (B)는 채팅 페이지 떠나면 즉시 offline → 빈번한 false negative
- 미래 옵션 (C)는 별도 PDCA로 분리(Plan §3 Out of Scope)

**구현 위치**: `liv-clinic/src/app/admin/(authenticated)/layout.tsx` 클라이언트 컴포넌트 보조에서 마운트. layout이 server component이면 별도 `<HeartbeatProvider>` 클라이언트 wrapper 추가.

### 5.5 G-07 unread 카운트 영속화 정책

**Plan FR-12**: P2 우선순위 (선택). 이번 사이클은 **localStorage 영속화 포함**으로 구현(P2도 같이 처리, ~5 LOC 추가).

```ts
// hooks/useUnreadIndicator.ts
const STORAGE_KEY = (sessionId: string) => `liv-chat-unread:${sessionId}`;
const STORAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;  // 7일 (세션과 동일)

interface PersistedUnread {
  count: number;
  lastSeenAt: string;  // ISO timestamp (visitor가 마지막으로 패널 연 시각)
  storedAtMs: number;
}
```

**저장 시점**: increment, reset 양쪽에서 즉시 write
**읽기 시점**: hook mount 시 1회
**TTL**: 7일 (chat_session 만료와 동기). 만료 시 자동 폐기.

---

## 6. Error Handling

### 6.1 G-03 에러 케이스

| 케이스 | 처리 | UX 영향 |
|--------|------|---------|
| `crypto.subtle` 미지원 (구형 브라우저, IE 등) | `hashSessionId` → `'unsupported'` 반환 | 이벤트는 전송되나 hash 필드만 sentinel, 카운트 자체는 GA4에 정상 기록 |
| GA4 gtag 미로드 | `trackEvent` 내부 if 분기로 silent skip | UX 영향 없음 (기존 패턴) |
| sessionId가 null (세션 미생성 상태에서 close) | `trackChatClose` 호출 자체 skip (조건문) | 정상 — 미생성 세션은 close 이벤트 의미 없음 |

### 6.2 G-05 에러 케이스

| 케이스 | 처리 | UX 영향 |
|--------|------|---------|
| heartbeat upsert 실패 (네트워크 일시 장애) | console.warn, 다음 60초에 재시도 | 운영자 작업 중단 없음. 90초 timeout 내 재시도 1번 허용 |
| `getOnlineOperatorCount` 쿼리 실패 | try/catch → fallback `source: 'businessHours'` | presence API는 항상 200 응답. visitor UX 무중단 |
| 운영자 0명, 운영시간 외 | `online: false` 정상 반환 | 위젯에 "운영시간 외" system 메시지 (기존 동작) |
| 운영자 0명, 운영시간 내 | `online: true, source: 'businessHours'` | 폴백으로 backward-compat. 운영자 부재 안내는 별도 PDCA |
| 운영자 1명+ | `online: true, source: 'realtime'` | 정확한 표시 |

### 6.3 G-07 에러 케이스

| 케이스 | 처리 | UX 영향 |
|--------|------|---------|
| localStorage 접근 불가 (privacy 모드) | try/catch → 메모리 only 동작 | 새로고침 시 리셋 (기능 저하 허용) |
| sessionId 없는 상태에서 메시지 도착 | hook `enabled=false`로 skip | 정상 |
| TTL 만료된 영속 데이터 | mount 시 자동 폐기 + count=0 시작 | 정상 |
| 빠른 toggle (open→close→open 0.5초 내) | useState 함수형 setter로 race condition 안전 | 정상 |

### 6.4 에러 응답 포맷

`/api/chat/presence`는 항상 200 응답(폴백 보장). 4xx/5xx는 발생 시점이 명확한 경우(예: 운영자 외 인증 시도)에만 사용 — 본 사이클에선 신규 4xx/5xx 추가 없음.

---

## 7. Security Considerations

### 7.1 RLS 정책 검증

- [x] `chat_operator_status` anon 차단 (deny-by-default)
- [x] `chat_operator_status` authenticated 자기 row만 read/insert/update
- [x] service_role full access (presence API 내부 사용)
- [x] DELETE 정책 미정의 (의도된 — operator_id가 PK이므로 ON DELETE CASCADE만 사용. 사용자 삭제 시 자동 정리)

### 7.2 PII 보호

| 항목 | 보호 방식 |
|------|----------|
| Session ID | GA4 전송 전 SHA-256 해시 후 16 hex chars만 사용. 클라이언트 측 `crypto.subtle.digest`로 평문 외부 노출 0 |
| Visitor IP | 기존 `ipHash.ts` 일별 salt 유지 (변경 없음) |
| Visitor Email/Name | 기존 정책 유지 (변경 없음) |
| Operator ID | `chat_operator_status.operator_id`는 `auth.users.id` UUID. RLS로 본인 외 조회 불가. presence API는 count만 반환 (ID 노출 0) |

### 7.3 입력 검증

| 입력 | 검증 |
|------|------|
| `markOperatorOnline(supabase, operatorId)` | operatorId는 `auth.uid()`로부터 직접 사용 (사용자 입력 아님) |
| `trackChatClose(reason, durationSec, sessionId)` | reason은 union type 강제 (TS), durationSec은 `Math.max(0, Math.round(...))` 클램프 |
| `/api/chat/presence` | GET 메서드, 매개변수 없음. 추가 입력 검증 불필요 |

### 7.4 Rate Limiting

- heartbeat 60초 인터벌 → 분당 1 RPC/operator → 운영자 5명 동시 = 5 RPC/min (Supabase Free 충분)
- presence GET 60초 polling → visitor 측 기존 polling 유지 (변경 없음)
- GA4 이벤트 전송은 클라이언트 → Google 직접, 백엔드 부하 0

### 7.5 Server-only 가드

- [x] `lib/chat/operatorPresence.ts` 서버 모듈에 `import 'server-only'`
- [x] `lib/chat/operatorPresence.client.ts`는 클라이언트 전용 (server-only 마커 없음)
- [x] `analytics-events.ts:hashSessionId`는 `typeof window === 'undefined'` 가드로 SSR 안전

---

## 8. Test Plan

### 8.1 수동 검증 (Zero Script QA)

| 영역 | 시나리오 | 기대 결과 |
|------|----------|----------|
| G-03 | en 위젯 열기 → 30초 대기 → 닫기 | GA4 DebugView에 `chat_close{reason:'visitor_close', duration_sec:~30, session_id_hash:'xxxx'}` |
| G-03 | 어드민 "대화 종료" 클릭 → confirm OK | GA4 DebugView에 `chat_close{reason:'operator_close', duration_sec:>0}` |
| G-03 | 빌드 산출물에서 session_id 평문 grep | 0 hit (해시만) |
| G-05 | 어드민 인증 후 chat 페이지 진입 → 60초 대기 | Supabase Console → `chat_operator_status` row 1건, `last_seen_at` 갱신 |
| G-05 | 어드민 탭 닫고 90초 경과 → visitor 위젯에서 presence 확인 | `online: false` 또는 운영시간 폴백 동작 |
| G-05 | 어드민 2명 동시 접속 | `operatorCount: 2` |
| G-05 | RLS — anon으로 SELECT 시도 | 0 rows |
| G-05 | RLS — authenticated가 다른 user row 조회 | 0 rows |
| G-07 | en 위젯 열기 → 메시지 보내기 → 닫기 → 어드민 답변 → 위젯 토글 버튼 확인 | 빨간 점 노출 |
| G-07 | 위젯 토글 클릭 (열기) | 빨간 점 사라짐 |
| G-07 | F5 새로고침 후 토글 닫힌 채 어드민 답변 후 다시 진입 | 빨간 점 즉시 노출 (localStorage 영속화) |
| G-07 | 패널 열어둔 상태에서 메시지 수신 | 빨간 점 노출 안 함 |
| 회귀 | 기존 4개 PDCA 시나리오 (en/ja/zh + 어드민 → 방문자) | 정상 |

### 8.2 자동 빌드 검증

| 검사 | 명령 | 기대 |
|------|------|------|
| 타입 체크 | `npm run build` | exit 0 |
| Lint (chat 관련) | `npm run lint 2>&1 | grep -i "chat\|operator" -B1 -A1` | 0 errors |
| 신규 마이그레이션 | Supabase 콘솔 적용 | 성공 + 검증 SQL 통과 |

### 8.3 안 함 (Unit Test 미포함)

기존 PDCA와 동일 정책: 채팅 기능은 외부 의존(Supabase, OpenAI)이 많아 단위 테스트보다 Zero Script QA(실 환경 + 로그 기반 검증)이 효율적. 단위 테스트는 별도 PDCA에서 결정.

---

## 9. Clean Architecture

### 9.1 Layer 분배

| Component | Layer | Location |
|-----------|-------|----------|
| `ChatWidget`, `ChatPanel`, 빨간 점 | Presentation | `src/components/chat/` |
| `useUnreadIndicator`, `useOperatorHeartbeat` | Application | `src/hooks/` |
| `trackChatClose`, `hashSessionId` | Application (utility) | `src/lib/analytics-events.ts` |
| `markOperatorOnline` (client) | Infrastructure | `src/lib/chat/operatorPresence.client.ts` |
| `getOnlineOperatorCount` (server) | Infrastructure | `src/lib/chat/operatorPresence.ts` |
| `chat_operator_status` 스키마 | Domain | `supabase/migrations/029_*.sql` |

### 9.2 의존성 방향 검증

- ✅ `useOperatorHeartbeat` → `markOperatorOnline` → Supabase client (Application → Infrastructure)
- ✅ `/api/chat/presence` route → `getOnlineOperatorCount` (Infrastructure → Infrastructure 동일 layer 호출 OK)
- ✅ `ChatWidget` → `useUnreadIndicator` (Presentation → Application)
- ✅ Domain(SQL 스키마)은 외부 의존 없음
- ❌ Presentation이 Infrastructure를 직접 호출하는 경로 없음 (검증 통과)

### 9.3 Import 규칙 적용

- 신규 hook `useOperatorHeartbeat`은 `@/lib/chat/operatorPresence.client`만 import (server 모듈 import 금지)
- 신규 server lib `operatorPresence.ts`은 `'server-only'` 마커 → 빌드 시 client 번들 차단

---

## 10. Coding Convention Reference

기존 PDCA(`realtime-translation-chat`)의 컨벤션을 100% 따른다.

### 10.1 신규 파일 명명

| 파일 | 컨벤션 | 비고 |
|------|--------|------|
| `029_chat_operator_status.sql` | snake_case + 번호 prefix | 028과 동일 패턴 |
| `operatorPresence.ts` / `.client.ts` | camelCase | 기존 `translation.ts`, `rateLimit.ts` 패턴 |
| `useOperatorHeartbeat.ts`, `useUnreadIndicator.ts` | `use*` 훅 prefix | 기존 `useChatSession`, `useChatRealtime` 패턴 |

### 10.2 환경변수 (신규 없음)

이번 사이클은 신규 환경변수 도입 0건. 기존 `OPENAI_API_KEY`, 운영시간, rate limit 그대로 사용.

### 10.3 i18n 키 추가

```json
// en.json / ja.json / zh.json (chat 키 추가)
{
  "chat": {
    // 기존 키 유지...
    "unreadAria": "{count, plural, one {1 new message} other {{count} new messages}}"
  }
}
```

| 로케일 | 메시지 |
|--------|--------|
| en | "{count, plural, one {1 new message} other {# new messages}}" |
| ja | "{count}件の新しいメッセージ" |
| zh | "{count} 条新消息" |

---

## 11. Implementation Guide

### 11.1 파일 구조 (변경 영역)

```
liv-clinic/
├── src/
│   ├── app/
│   │   ├── admin/(authenticated)/
│   │   │   ├── layout.tsx                    # ★ 수정: HeartbeatProvider 마운트
│   │   │   └── chat/[sessionId]/
│   │   │       └── ChatDetailClient.tsx       # ★ 수정: trackChatClose 호출
│   │   └── api/chat/
│   │       └── presence/route.ts              # ★ 수정: operator count + 폴백
│   ├── components/chat/
│   │   ├── ChatWidget.tsx                     # ★ 수정: 빨간 점 배지
│   │   └── ChatPanel.tsx                      # ★ 수정: onClose에 trackChatClose
│   ├── hooks/
│   │   ├── useChatRealtime.ts                 # ★ 수정: onUnreadIncrement 콜백
│   │   ├── useOperatorHeartbeat.ts            # ☆ 신규
│   │   └── useUnreadIndicator.ts              # ☆ 신규
│   ├── lib/
│   │   ├── analytics-events.ts                # ★ 수정: trackChatClose, hashSessionId
│   │   └── chat/
│   │       ├── operatorPresence.ts            # ☆ 신규 (server-only)
│   │       └── operatorPresence.client.ts     # ☆ 신규
│   ├── messages/
│   │   ├── en.json                            # ★ 수정: chat.unreadAria
│   │   ├── ja.json                            # ★ 수정
│   │   └── zh.json                            # ★ 수정
│   └── types/
│       └── supabase.ts                        # ★ 자동 재생성
└── supabase/
    └── migrations/
        └── 029_chat_operator_status.sql        # ☆ 신규
```

### 11.2 구현 순서

권장 순서(의존성 최소 → 최대):

1. **마이그레이션 적용** (029)
   - SQL 작성 → Supabase 콘솔/CLI로 적용 → 검증 SQL 실행 (anon/authenticated 격리)
   - `npm run db:types` 또는 Supabase MCP로 `types/supabase.ts` 재생성

2. **G-05 백엔드** (presence)
   - `lib/chat/operatorPresence.ts` (server) — `getOnlineOperatorCount`
   - `lib/chat/operatorPresence.client.ts` — `markOperatorOnline`
   - `/api/chat/presence/route.ts` 갱신 + `source` 필드 추가
   - 수동 검증: presence API curl → 응답 확인

3. **G-05 프론트엔드** (heartbeat)
   - `hooks/useOperatorHeartbeat.ts` — 60초 interval + cleanup
   - `app/admin/(authenticated)/layout.tsx` 또는 보조 client wrapper에 `useOperatorHeartbeat` 마운트
   - 수동 검증: 어드민 진입 → Supabase 콘솔 row 갱신

4. **G-03 Analytics**
   - `lib/analytics-events.ts` — `hashSessionId`, `trackChatClose`, `ChatCloseReason` 타입 export
   - `components/chat/ChatPanel.tsx` — `openedAtRef` + `onClose` 핸들러에서 호출
   - `app/admin/(authenticated)/chat/[sessionId]/ChatDetailClient.tsx` — PATCH 성공 분기에서 호출
   - 수동 검증: GA4 DebugView에 이벤트 노출

5. **G-07 unread 배지**
   - `hooks/useUnreadIndicator.ts` — 신규 (count, increment, reset, persisted)
   - `hooks/useChatRealtime.ts` — `onUnreadIncrement?: (msg) => void` prop 추가, broadcast handler에서 호출
   - `components/chat/ChatWidget.tsx` — 빨간 점 SVG + `useUnreadIndicator` 연동
   - `messages/en.json`, `ja.json`, `zh.json` — `chat.unreadAria` 키 추가
   - 수동 검증: 위젯 닫고 어드민 답변 → 빨간 점 노출 / F5 후 재현

6. **회귀 검증**
   - 기존 4개 PDCA 시나리오 (en/ja/zh visitor → operator) 정상 동작 확인
   - `npm run build` exit 0
   - `npm run lint 2>&1 | grep -E "chat|operator" -A 1` 0 errors

### 11.3 커밋 분할

| 커밋 # | 메시지 | 포함 |
|--------|--------|------|
| 1 | docs(chat-followups): PDCA Plan + Design 문서 | docs/01-plan, docs/02-design |
| 2 | feat(chat): G-05 operator presence heartbeat — DB + lib + API | 029 마이그레이션 + operatorPresence.* + presence route |
| 3 | feat(chat): G-05 operator heartbeat hook + admin layout 마운트 | useOperatorHeartbeat + admin layout |
| 4 | feat(chat): G-03 trackChatClose with PII-safe session hash | analytics-events + ChatPanel + ChatDetailClient |
| 5 | feat(chat): G-07 unread indicator badge with localStorage | useUnreadIndicator + useChatRealtime + ChatWidget + i18n |

각 커밋은 독립적으로 빌드 통과 + lint 통과해야 함.

---

## 12. Edge Cases & 의사결정

### 12.1 의사결정 요약 (DDR)

| ID | 결정 | 대안 | 근거 |
|----|------|------|------|
| DDR-1 | Heartbeat 마운트는 어드민 layout (모든 어드민) | 채팅 layout 한정 | 운영자 ≤ 3명 소규모 → 다른 어드민 탭에 있어도 응대 가능 (§5.4) |
| DDR-2 | Heartbeat 60초 + 90초 timeout | 30s/45s, 120s/180s | 60s = Supabase 부하 1 RPC/min/op. 90s timeout = 1회 누락 허용 |
| DDR-3 | presence API backward-compat (`online`, `operatorCount` 유지) | 응답 스키마 v2 변경 | 기존 클라이언트 무영향, 점진 도입 안전 |
| DDR-4 | Session ID는 SHA-256 16자 해시 (`crypto.subtle`) | 평문, MD5, full SHA-256 | PII 보호 + 분석 cardinality 충분 (16 hex = 64 bits 엔트로피) |
| DDR-5 | unread 카운트는 클라이언트만 (서버 컬럼 없음) | `chat_sessions.unread_visitor_count` 추가 | Plan §3 In Scope. 디바이스 간 sync 불필요(MVP) |
| DDR-6 | unread 영속화는 localStorage (P2도 같이 처리) | sessionStorage, IndexedDB | 7일 TTL이면 localStorage 충분, 기존 패턴 일관성 |
| DDR-7 | 빨간 점만 노출 (카운트 미표시) | 카운트 숫자 표시 | MVP 단순. 카운트는 별도 UX PDCA |
| DDR-8 | `getOnlineOperatorCount` 실패 시 폴백 | hard-fail 500 응답 | visitor UX 우선, presence는 보조 정보 |
| DDR-9 | trackChatClose는 async 함수 | sync (해시 없이) | PII 보호 위해 `crypto.subtle.digest` 비동기 필요 |

### 12.2 Edge Cases

| 케이스 | 처리 |
|--------|------|
| 운영자 동일 user 다중 탭 | PK가 `operator_id` → upsert로 1 row만 → 카운트 1 (의도) |
| 운영자가 페이지 닫지 않고 노트북 절전 | 60초 후 heartbeat 안 감 → 90초 후 offline 처리 (정상) |
| Visitor가 운영시간 외 진입 | operatorCount=0 + businessHours=false → online=false (정확) |
| Visitor가 운영시간 내, 운영자 0명 | operatorCount=0, businessHours=true → online=true (폴백, backward-compat) |
| Heartbeat 첫 1회 갱신 전 visitor 조회 | row 없음 → operatorCount=0 → 폴백 동작 |
| sessionId가 미생성된 상태에서 위젯 닫기 | trackChatClose 호출 skip (조건문) |
| 빠른 toggle (open→close→open 0.1초) | 첫 close에서 trackChatClose 발화, 다음 open은 새 세션 생성 안 함 (기존 세션 재사용) |
| localStorage 가득 참 (privacy 모드) | try/catch → 메모리 fallback, 기능 저하 허용 |
| 빨간 점이 새 메시지 도착과 펄스 글로우 동시 | 펄스는 첫 5초만, 그 이후 빨간 점만 노출 (충돌 없음) |
| trackChatClose가 unmount race | `await` 없이 fire-and-forget(promise 반환만) → 페이지 이탈 차단 안 함 |
| 어드민이 세션 종료 후 다시 종료 시도 | PATCH 응답 status=closed면 confirm UI 비활성화 (기존 동작 유지) |

---

## 13. Migration & Rollout

### 13.1 마이그레이션 적용 절차

1. PR 생성 + 029 SQL 포함
2. Staging Supabase에 적용 (manual or `supabase db push`)
3. 검증 SQL 실행 (RLS anon/authenticated 격리)
4. Prod 적용 (PR 승인 후)
5. 어드민 배포 → heartbeat 자동 시작
6. 모니터링: Supabase 콘솔 → `chat_operator_status` row 갱신 확인

### 13.2 Rollback 계획

| 단계 | 롤백 방법 |
|------|----------|
| 029 SQL 문제 | `DROP TABLE chat_operator_status CASCADE;` (분리 테이블이라 chat_sessions/messages 영향 없음) |
| presence API 문제 | route 파일 git revert → businessHours 단독 복귀 |
| heartbeat hook 문제 | layout에서 `<HeartbeatProvider>` 제거 |
| trackChatClose 문제 | analytics-events.ts에서 trackChatClose 호출 점만 주석 처리 |
| 빨간 점 문제 | ChatWidget.tsx git revert |

각 변경은 독립 커밋이므로 부분 롤백 용이.

### 13.3 점진적 rollout 권장

- 1차: 029 마이그레이션 + presence API 갱신만 (visitor UX 무영향)
- 2차: heartbeat hook 활성화 (어드민만 영향)
- 3차: trackChatClose + 빨간 점 (visitor UX 변경 — 빌드 후 1주 모니터링)

위 3단계는 같은 PR로 머지 가능하지만 배포 단계에서 분리 가능 (피처 플래그는 도입 안 함, MVP 우선).

---

## 14. Risks (Plan §8 후속)

Plan에서 식별한 9개 리스크 모두 본 Design에서 대응:

| Plan 리스크 | Design 대응 (§) |
|------------|----------------|
| heartbeat 메모리 누수 | useEffect cleanup 보장 (§11.2 step 3, §6.2) |
| RLS 누락 anon 노출 | 검증 SQL 명시 (§3.3 검증 SQL) |
| presence 폴백 정확도 | source 필드 + or 조합 (§4.1) |
| Analytics PII | crypto.subtle SHA-256 16자 (§4.4, §7.2) |
| unread race condition | useState 함수형 setter (§6.3) |
| localStorage 키 충돌 | sessionId prefix + TTL (§5.5) |
| 첫 갱신 전 0명 | 폴백 businessHours (§4.1, §6.2) |
| 다중 탭 카운트 1 | PK upsert 의도된 동작 (§12.2) |
| presence N+1 쿼리 | count() 1회 + 인덱스 (§3.3) |

---

## 15. References

### PDCA 문서
- Plan: [`docs/01-plan/features/chat-followups-g03-g05-g07.plan.md`](../../01-plan/features/chat-followups-g03-g05-g07.plan.md)
- 부모 Plan: [`docs/01-plan/features/realtime-translation-chat.plan.md`](../../01-plan/features/realtime-translation-chat.plan.md)
- 부모 Design: [`docs/02-design/features/realtime-translation-chat.design.md`](./realtime-translation-chat.design.md)
- 부모 Analysis: [`docs/03-analysis/realtime-translation-chat.analysis.md`](../../03-analysis/realtime-translation-chat.analysis.md)
- 부모 Report: [`docs/04-report/features/realtime-translation-chat.report.md`](../../04-report/features/realtime-translation-chat.report.md)

### 코드
- 기존 마이그레이션: `supabase/migrations/028_chat_tables.sql`
- 기존 presence: `liv-clinic/src/app/api/chat/presence/route.ts`
- 기존 analytics: `liv-clinic/src/lib/analytics-events.ts`
- 기존 위젯: `liv-clinic/src/components/chat/ChatWidget.tsx`, `ChatPanel.tsx`
- 기존 hooks: `liv-clinic/src/hooks/useChatSession.ts`, `useChatRealtime.ts`
- 어드민 종료: `liv-clinic/src/app/admin/(authenticated)/chat/[sessionId]/ChatDetailClient.tsx`

### 외부
- Supabase RLS: <https://supabase.com/docs/guides/auth/row-level-security>
- Web Crypto SubtleCrypto.digest: <https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest>
- React useEffect cleanup: <https://react.dev/reference/react/useEffect#parameters>
- GA4 event params: <https://developers.google.com/analytics/devguides/collection/ga4/event-parameters>

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-10 | Initial draft (Plan v0.1 기반) | jaeho19@gmail.com |
