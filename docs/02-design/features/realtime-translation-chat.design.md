# Design: 실시간 다국어 번역 채팅 (Realtime Translation Chat)

> **Feature**: `realtime-translation-chat`
> **Phase**: Design
> **Created**: 2026-05-08
> **Plan 참조**: `docs/01-plan/features/realtime-translation-chat.plan.md`
> **선행 PDCA**: `whatsapp-cta`, `floating-cta-redesign` (해외 환자 접점 채널 / 우측 하단 위치 충돌 대응)

> **2026-05-08 사용자 추가 확정 사항**:
> 1. 번역 API: **OpenAI gpt-4o-mini** 단일 (DeepL 폴백 미적용, MVP)
> 2. 위젯 위치: **좌하단** (FloatingCTA 우하단과 분리)
> 3. 운영시간: 평일 10:00–19:00 / 토 10:00–**16:00** / 일 휴무 (KST). **채팅은 24/7 항상 가능**
> 4. **`OPENAI_API_KEY` 발급 완료**
> 5. **메시지 보존 1년** (Out of scope의 자동 삭제 cron은 후속, MVP는 정책 명시만)
> 6. **로케일 분기**: **`ko` 사용자는 위젯을 노출하지 않는다.** 한국어 사용자는 기존 카카오톡 채널(FloatingCTA)로 응대. 위젯은 **`en` / `ja` / `zh` 로케일에만 노출**한다. → `visitor_locale` ∈ {en, ja, zh} 로 제약, 번역 방향은 visitor↔ko 단순 1:1
> 7. **어드민 경로**: `/admin/chat`(locale 밖, `(authenticated)` 라우트 그룹). `/admin/(authenticated)/chat/...`로 배치

---

## 1. 아키텍처 개요 (Architecture Overview)

### 1.1 전체 데이터 흐름

```
┌──────────────────┐     ┌──────────────────────┐      ┌────────────────────┐
│  Visitor 위젯    │     │ Next.js Route Handler│      │  Supabase          │
│  (any locale)    │     │ /api/chat/messages   │      │  - chat_sessions   │
│                  │ 1.  │  (server only)       │      │  - chat_messages   │
│  ChatWidget      │ ──▶ │ - 입력 검증/rate     │ 2.   │  RLS + service role│
│  (use client)    │     │ - OpenAI 번역 호출   │ ──▶  │  INSERT (admin key)│
│                  │     │ - INSERT both langs  │      │                    │
│                  │ 4.  │                      │ 3.   │  Realtime broadcast│
│  Realtime sub    │ ◀── │                      │ ◀── │  postgres_changes  │
└──────────────────┘     └──────────────────────┘      └────────────────────┘
                                                                  │
                                                                  │ 3'.
                                                                  ▼
                                                        ┌──────────────────┐
                                                        │ /admin/chat      │
                                                        │ Operator client  │
                                                        │ (Supabase user)  │
                                                        │ Realtime sub     │
                                                        └──────────────────┘
```

1. 방문자가 자기 언어로 메시지 입력 → API에 POST
2. 서버 측에서 검증 → OpenAI 번역(en/ja/zh → ko 또는 ko → 방문자 언어) → admin client로 두 컬럼(원문/번역) 모두 INSERT
3. Postgres가 Realtime 채널에 broadcast → 양쪽(위젯, 어드민) 모두 수신
4. 위젯/어드민 UI가 새 메시지 렌더링

> **핵심 원칙**:
> - **번역 API 키와 Service Role Key는 서버 사이드에서만 사용** (클라이언트에 절대 노출 금지)
> - 방문자는 Supabase에 직접 쓰지 않고 **API Route 경유** (스팸/RLS 우회 방지)
> - 운영자(admin)는 기존 Supabase auth 세션을 그대로 활용

### 1.2 컴포넌트/모듈 레이어

```
liv-clinic/src/
├─ components/
│   └─ chat/                                    [신규 폴더]
│       ├─ ChatWidget.tsx          (use client) — 토글 버튼 + 패널
│       ├─ ChatPanel.tsx           (use client) — 메시지 목록·입력·헤더
│       ├─ MessageBubble.tsx       (use client) — 단일 메시지(원문 토글)
│       ├─ ChatLauncher.tsx        (use client) — 닉네임/이메일 폼 (선택)
│       └─ TypingIndicator.tsx     (use client)
├─ hooks/
│   ├─ useChatSession.ts                        [신규] sessionId 관리(localStorage)
│   ├─ useChatRealtime.ts                       [신규] Realtime 구독 hook
│   └─ useOperatorPresence.ts                   [신규] 운영자 온라인 여부
├─ lib/
│   ├─ chat/                                    [신규 폴더]
│   │   ├─ translation.ts             — OpenAI 호출 래퍼 (server-only)
│   │   ├─ rateLimit.ts               — IP/session rate limit
│   │   ├─ businessHours.ts           — 운영시간 판정
│   │   └─ chatApi.ts                  — 클라이언트 fetch 래퍼
│   └─ supabase-admin.ts (기존)
└─ app/
    ├─ [locale]/
    │   └─ layout.tsx                 — <ChatWidget locale={locale} /> 마운트 (ko 시 null)
    ├─ admin/
    │   └─ (authenticated)/
    │       └─ chat/                                [신규]
    │           ├─ page.tsx           — 진행 중 대화 목록
    │           └─ [sessionId]/
    │               └─ page.tsx       — 대화 상세
    └─ api/
        └─ chat/                                  [신규]
            ├─ messages/route.ts      — POST 메시지 + 번역
            ├─ sessions/route.ts      — POST 세션 시작 / GET 이력
            └─ presence/route.ts      — GET 운영자 온라인 여부
```

### 1.3 변경 대상 파일 (요약)

| 파일 | 변경 유형 | 주요 변경 |
|------|-----------|-----------|
| `liv-clinic/src/components/chat/*` | **신규 7개** | 위젯, 패널, 버블, hook, hook 등 |
| `liv-clinic/src/lib/chat/*` | **신규 4개** | 번역 래퍼, rate limit, 운영시간, API 클라이언트 |
| `liv-clinic/src/app/api/chat/**` | **신규 3개 라우트** | messages / sessions / presence |
| `liv-clinic/src/app/admin/(authenticated)/chat/**` | **신규 2개 페이지** | list + detail (locale 밖, 기존 admin 패턴 준수) |
| `liv-clinic/src/app/[locale]/layout.tsx` | 수정 (경량) | `<ChatWidget locale={locale} />` 마운트, locale='ko'면 null 반환 |
| `liv-clinic/src/components/admin/AdminSidebar.tsx` | 수정 (경량) | "채팅 상담" 메뉴 + 미응답 배지 |
| `liv-clinic/src/lib/analytics-events.ts` | 수정 (경량) | `trackChatOpen` / `trackChatMessage` 추가 |
| `liv-clinic/src/messages/{ko,en,ja,zh}.json` | 수정 | `chat.*` 키 추가 |
| `liv-clinic/src/types/supabase.ts` | 자동 재생성 | 신규 테이블 타입 |
| `liv-clinic/.env.example` | 수정 | `OPENAI_API_KEY`, `CHAT_BUSINESS_HOURS` 등 |
| `liv-clinic/supabase/migrations/028_chat_tables.sql` | **신규** | chat_sessions, chat_messages, RLS, 트리거 |

---

## 2. 번역 API 선택 (Translation Provider)

### 2.1 후보 비교

| 항목 | OpenAI gpt-4o-mini | DeepL API Free/Pro | Google Translate v3 |
|------|--------------------|-----------|---------------------|
| 한국어 품질 | 우수 (지시 가능) | 우수 (2026~ 본격 지원) | 양호 |
| 의료/시술 용어 보존 | **시스템 프롬프트로 가능** | 용어집 기능(Pro) | 용어집(별도 설정) |
| 비용(메시지 1개당, 평균 50 token in/out) | ~$0.00005 + $0.0003 ≈ **$0.00035** | 500K 무료/월, 이후 €5/1M chars | $20/1M chars |
| 1만 메시지/월 비용 | **약 $3.5** | 무료(500K 글자 이내) → ~$5 | ~$10 |
| 응답 속도 | 1~2s | <1s | <1s |
| 자체 호스팅 | X | X | X |
| 컨텍스트(이전 메시지) 활용 | 가능 | 제한 | X |

### 2.2 결정: **OpenAI gpt-4o-mini** (1차) + **DeepL** (선택적 폴백, MVP 이후)

- **이유**:
  1. 시스템 프롬프트로 브랜드명·시술명 보존 명시 가능 (`울쎄라`, `써마지`, `Thermage`, `LIV` 등)
  2. 짧은 메시지/이모지 혼합 시 더 자연스러운 출력
  3. 향후 컨텍스트 기반 다중 턴 번역으로 확장 용이
- **MVP에서는 OpenAI 단일 의존**. 장애 발생 시 메시지를 원문만 저장하고 운영자 화면에 "(번역 실패)" 표시.
- DeepL 폴백은 1차 출시 후 비용/안정성 검토 결과에 따라 선택적으로 추가.

### 2.3 시스템 프롬프트 사양

```ts
// liv-clinic/src/lib/chat/translation.ts
const SYSTEM_PROMPT_KO_TO_TARGET = (target: TargetLang) => `
You are a professional translator for a Korean cosmetic/aesthetic clinic (LIV Plastic Surgery).
Translate the user's Korean message into ${LANG_NAMES[target]}.

Rules:
1. Preserve product/treatment brand names exactly (e.g., 울쎄라, 써마지, Ulthera, Thermage, Botox, LIV, 인모드, InMode, 리프팅, Shurink).
2. Preserve numbers, dates, and prices verbatim.
3. Maintain a polite, professional tone suitable for a medical clinic.
4. Output ONLY the translated text. No explanations, no quotes, no language tags.
5. If the input is already in ${LANG_NAMES[target]} or untranslatable (single emoji, URL), return it unchanged.
`.trim();

const SYSTEM_PROMPT_TO_KO = (source: SourceLang) => `
You are a professional translator for a Korean cosmetic/aesthetic clinic (LIV Plastic Surgery).
Translate the user's ${LANG_NAMES[source]} message into Korean.

Rules:
1. Preserve brand names: Ulthera→울쎄라, Thermage→써마지, Shurink→슈링크, InMode→인모드, Botox→보톡스, LIV→LIV.
2. Preserve numbers, dates, and prices verbatim.
3. Use a polite, professional Korean tone (~합니다체).
4. Output ONLY the translated Korean text. No explanations, no quotes.
5. If the input is already Korean, return it unchanged.
`.trim();
```

### 2.4 번역 함수 시그니처

```ts
type SupportedLang = 'ko' | 'en' | 'ja' | 'zh';
type VisitorLang = 'en' | 'ja' | 'zh';   // ko는 위젯 비노출 → 방문자 언어로 사용 안 함
type OperatorLang = 'ko';                // 운영자는 항상 한국어 입력
// 번역 방향은 단방향 두 가지뿐:
//   visitor 메시지: VisitorLang → 'ko'
//   operator 메시지: 'ko' → VisitorLang

interface TranslationResult {
  status: 'success' | 'failed' | 'skipped';
  text: string;          // 번역 결과 (실패/skipped는 원문 그대로)
  detectedLang?: SupportedLang;
  errorCode?: string;    // 'rate_limit' | 'api_error' | 'timeout'
  latencyMs: number;
}

// 핵심 함수
export async function translate(
  source: string,
  fromHint: SupportedLang,
  to: SupportedLang,
): Promise<TranslationResult>;
```

- **타임아웃**: 5초 (서버 측 `AbortController`). 초과 시 `status: 'failed'`로 fallback.
- **재시도**: 1회 재시도(지수 백오프 500ms). 재시도 실패 시 fallback.
- **빈 문자열·URL·이모지만**: `status: 'skipped'` — 번역 호출 생략.

---

## 3. 데이터 모델 (Database Schema)

### 3.1 `chat_sessions`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | 세션 식별자(외부 노출용) |
| `session_token` | `uuid` | UNIQUE, default `gen_random_uuid()` | 클라이언트 localStorage 보관용(대조키) |
| `visitor_locale` | `text` | NOT NULL, **CHECK in (en, ja, zh)** | 방문자 1차 언어. **`ko`는 위젯이 노출되지 않으므로 세션 생성 자체가 불가** |
| `visitor_name` | `text` | NULLABLE, max 60 | 선택 입력 |
| `visitor_email` | `text` | NULLABLE | 선택 입력 (콜백용) |
| `status` | `text` | NOT NULL, default `'open'`, CHECK in (`open`,`closed`,`abandoned`) | 상태 |
| `assigned_admin_id` | `uuid` | NULLABLE, FK → `auth.users(id)` | 운영자 배정(나중) |
| `ip_hash` | `text` | NULLABLE | rate limit / 어뷰즈 추적용 SHA-256 |
| `user_agent` | `text` | NULLABLE | 디버깅 |
| `last_message_at` | `timestamptz` | NULLABLE | 정렬/유휴 추적 |
| `unread_admin_count` | `int4` | default 0 | 운영자 미확인 메시지 수(트리거로 갱신) |
| `created_at` | `timestamptz` | default `now()` | |
| `updated_at` | `timestamptz` | default `now()` | 트리거로 자동 갱신 |
| `closed_at` | `timestamptz` | NULLABLE | 종료 시각 |

**인덱스**:
- `idx_chat_sessions_status_last_msg` ON (`status`, `last_message_at` DESC) — 어드민 목록 조회용
- `idx_chat_sessions_token` UNIQUE ON (`session_token`) — 위젯 인증용

### 3.2 `chat_messages`

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `session_id` | `uuid` | FK → `chat_sessions(id)` ON DELETE CASCADE, NOT NULL | |
| `sender` | `text` | NOT NULL, CHECK in (`visitor`,`operator`,`system`) | 발신자 종류 |
| `sender_admin_id` | `uuid` | NULLABLE, FK → `auth.users(id)` | 운영자 메시지의 작성자 |
| `original_text` | `text` | NOT NULL, max 1000 (CHECK) | 원문 |
| `original_lang` | `text` | NOT NULL, CHECK in (ko,en,ja,zh) | 원문 언어 |
| `translated_text` | `text` | NULLABLE | 번역문 (실패 시 NULL) |
| `translated_lang` | `text` | NULLABLE, CHECK in (ko,en,ja,zh) | 번역 대상 언어 |
| `translation_status` | `text` | NOT NULL, default `'pending'`, CHECK in (`pending`,`success`,`failed`,`skipped`) | |
| `translation_latency_ms` | `int4` | NULLABLE | 번역 호출 응답 시간(관측) |
| `translation_error` | `text` | NULLABLE | 실패 코드 (`api_error`, `timeout`, `rate_limit`) |
| `created_at` | `timestamptz` | default `now()` | |

**인덱스**:
- `idx_chat_messages_session_created` ON (`session_id`, `created_at` ASC) — 대화 렌더링
- `idx_chat_messages_realtime` ON (`session_id`) — Realtime 필터링

### 3.3 트리거

```sql
-- 메시지 INSERT 시 세션의 last_message_at, unread_admin_count, updated_at 갱신
CREATE OR REPLACE FUNCTION fn_chat_after_message_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions
  SET
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at,
    unread_admin_count = CASE
      WHEN NEW.sender = 'visitor' THEN unread_admin_count + 1
      WHEN NEW.sender = 'operator' THEN 0
      ELSE unread_admin_count
    END
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chat_after_message_insert
AFTER INSERT ON chat_messages
FOR EACH ROW EXECUTE FUNCTION fn_chat_after_message_insert();
```

### 3.4 RLS 정책

```sql
ALTER TABLE chat_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages  ENABLE ROW LEVEL SECURITY;

-- 운영자(authenticated 유저, 어드민으로 가정) 전체 권한
-- (LIV 프로젝트는 모든 authenticated 유저가 admin이므로 역할 분리 없음)
CREATE POLICY chat_sessions_admin_all ON chat_sessions
FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY chat_messages_admin_all ON chat_messages
FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- 익명(anon) 유저: 직접 접근 차단. API 라우트만 service_role로 INSERT/SELECT.
-- (Realtime 구독은 별도, §4 참조)
CREATE POLICY chat_sessions_anon_block ON chat_sessions
FOR ALL TO anon
USING (false) WITH CHECK (false);

CREATE POLICY chat_messages_anon_block ON chat_messages
FOR ALL TO anon
USING (false) WITH CHECK (false);
```

> **방문자 보호**: 방문자는 RLS상 anon 차단. **모든 읽기/쓰기는 API Route(service_role)** 가 `session_token` 일치 여부를 검증한 후 대리 수행. Realtime 구독은 §4.2의 토큰 검증 + 채널 격리로 처리.

---

## 4. 실시간 통신 (Realtime Topology)

### 4.1 채널 전략

```
방문자 위젯 (per-session)
  ┌────────────────────────────────────────┐
  │ Realtime 채널: postgres_changes        │
  │   table: chat_messages                 │
  │   filter: session_id=eq.{session_id}   │
  │ 클라이언트 토큰: SUPABASE_ANON_KEY     │
  │ + RLS 우회 불가(anon 차단) BUT          │
  │ Realtime 채널은 RLS와 분리되어 작동    │
  └────────────────────────────────────────┘

운영자 어드민 (global)
  ┌────────────────────────────────────────┐
  │ Realtime 채널: postgres_changes        │
  │   table: chat_messages,chat_sessions   │
  │   filter: 없음 (전체)                  │
  │ 클라이언트 토큰: 운영자 JWT(authenticated)│
  └────────────────────────────────────────┘
```

### 4.2 방문자 측 Realtime 보안

Supabase Realtime의 `postgres_changes`는 RLS와 분리되며 **테이블 레벨 RLS가 anon에 false**여도 채널 자체는 받을 수 있는 위험이 있다. 따라서 다음 중 한 가지로 격리:

**선택 (a) — 권장: Broadcast 채널 사용**
- API Route가 메시지 INSERT 후 `supabase.channel('chat:{session_id}').send({ type:'broadcast', event:'new_message', payload })`
- 방문자는 `chat:{session_id}` broadcast 채널만 구독
- 다른 session_id를 구독하려면 session_id(uuid) 추측이 필요 → 사실상 불가
- 추가 보안: API가 `session_token`(별도 uuid)을 검증 후 응답에 한해 broadcast 발신

**선택 (b) — 보조: postgres_changes + RLS bypass 채널 정책**
- Realtime extension의 `realtime.subscription` RLS 정책으로 channel ACL 적용
- 구현 복잡도 ↑, MVP에서는 (a)를 사용

> **결정**: **(a) Broadcast 채널 + UUID v4 session_id (122-bit 엔트로피)**. (b)는 후속 강화 단계에서 검토.

### 4.3 운영자 측 Realtime 흐름

운영자는 authenticated 토큰으로 `postgres_changes` 직접 구독:

```ts
const supabase = createBrowserClient();
const channel = supabase
  .channel('admin-chat')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'chat_messages' },
    (payload) => onNewMessage(payload.new)
  )
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'chat_sessions' },
    (payload) => onSessionUpdate(payload.new)
  )
  .subscribe();
```

### 4.4 운영자 온라인 상태 (Presence)

```ts
// 운영자가 /admin/chat 진입 시
const presence = supabase
  .channel('chat-presence', { config: { presence: { key: userId } } })
  .on('presence', { event: 'sync' }, () => { /* count 갱신 */ })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await presence.track({ user_id: userId, online_at: new Date().toISOString() });
    }
  });
```

방문자 측은 `/api/chat/presence`로 운영자 수를 GET (1초 캐시) → 0이면 자동 응답 모드.

---

## 5. API 라우트 사양

### 5.1 `POST /api/chat/sessions` — 세션 생성

**Request**:
```json
{
  "visitorLocale": "en",
  "visitorName": "John (optional)",
  "visitorEmail": "john@example.com (optional)"
}
```

**Response (201)**:
```json
{
  "sessionId": "uuid",
  "sessionToken": "uuid",
  "operatorOnline": true,
  "businessHours": true,
  "welcomeMessage": "Hello! How can we help you today?"
}
```

**서버 처리**:
1. zod 검증 (`visitorLocale ∈ ko/en/ja/zh`, `visitorName ≤ 60`, `visitorEmail` zod email)
2. IP rate limit (24h 내 같은 IP가 50개 이상 세션 생성 → 429)
3. ip_hash = SHA-256(`x-forwarded-for` + DAILY_SALT)
4. `createAdminClient().from('chat_sessions').insert(...)` 후 row 반환
5. 운영자 presence 카운트 + 운영시간 판정 → response에 포함
6. 첫 system 메시지(welcome 또는 off-hours fallback) INSERT — Realtime broadcast로 위젯에 노출

### 5.2 `POST /api/chat/messages` — 메시지 전송

**Request (visitor)**:
```json
{
  "sessionToken": "uuid",
  "text": "Hello, do you have English support?"
}
```

**Request (operator)**:
- `Authorization`: Supabase auth cookie (자동)
- Body:
```json
{
  "sessionId": "uuid",
  "text": "안녕하세요. 영어 상담 가능합니다."
}
```

**Response (201)**:
```json
{
  "id": "uuid",
  "originalText": "Hello, do you have English support?",
  "originalLang": "en",
  "translatedText": "안녕하세요. 영어 상담이 가능한지 문의드립니다.",
  "translatedLang": "ko",
  "translationStatus": "success",
  "createdAt": "2026-05-08T12:34:56Z"
}
```

**서버 처리 (시퀀스)**:

```
1. zod 검증 (text length ≤ 1000, sessionToken 또는 운영자 인증)
2. 세션 조회 (visitor 측: sessionToken 일치하는 row 1개; operator: sessionId)
3. rate limit 검사 (분당 10건 / 세션당 100건)
4. INSERT chat_messages (translation_status='pending', translated_text=null)
5. 비동기 OR 동기 번역:
   - target = visitor면 'ko', operator면 session.visitor_locale
   - source = visitor면 session.visitor_locale, operator면 'ko'
   - translate(text, source, target)
6. UPDATE chat_messages SET translated_text=..., translation_status=success/failed
7. supabase.channel(`chat:${sessionId}`).send({ event: 'message_translated', payload: messageRow })
8. 응답 반환 (UI는 ‘pending → success’ 두 단계로 렌더 가능)
```

> **번역 동기/비동기 트레이드오프**:
> - **동기**: 응답이 ~2초 지연되지만 UX 단순(메시지가 한 번에 도착)
> - **비동기**: 즉시 응답 + Realtime로 번역 결과 후속. 메시지가 두 번 갱신되어 UI 깜박임 가능
> - **MVP 결정: 동기**. 단, OpenAI 호출 timeout 5초 + 1회 재시도. 실패 시 `translation_status='failed'`, `translated_text` NULL → UI는 "(번역 실패, 원문만 표시)" 안내.

### 5.3 `GET /api/chat/sessions/:id/messages` — 이력 조회 (위젯·어드민 공통)

- 위젯: `?token=session_token` 쿼리로 인증
- 어드민: Supabase auth 세션
- 페이지네이션: `?cursor={created_at}&limit=50`
- 응답: 메시지 배열 (created_at ASC)

### 5.4 `GET /api/chat/presence` — 운영자 온라인 여부

- Supabase Realtime presence 채널의 현재 사용자 수를 서버에서 polling
- 단순화: 별도 `chat_operator_status` 테이블 + heartbeat (60초)도 가능
- **MVP**: Realtime presence를 직접 위젯에서 구독하는 대신, `presence_count`와 `business_hours` 결과만 단순 캐시(10초 TTL)
- 응답:
```json
{ "online": true, "operatorCount": 1, "businessHours": true }
```

---

## 6. 운영 시간 / 부재 시 폴백

> **핵심 정책 (사용자 확정, 2026-05-08)**: **채팅은 24/7 항상 가능**. 운영시간은 *응답 가능 여부 안내* 용도로만 사용하며, 운영시간 외에도 메시지 입력·전송·번역·저장은 모두 정상 동작한다. 단, 운영자가 즉시 응답하지 못할 수 있다는 시스템 안내 메시지를 자동으로 띄운다.

### 6.1 운영시간 판정

```ts
// liv-clinic/src/lib/chat/businessHours.ts
const DEFAULT_HOURS = {
  weekday:  ['10:00', '19:00'],   // 월~금
  saturday: ['10:00', '16:00'],   // 토 (사용자 확정)
  sunday:   null,                  // 일 휴무
};
// 환경변수 CHAT_BUSINESS_HOURS_JSON 으로 override 가능
// KST 기준 (Asia/Seoul). 서버에서는 `Intl.DateTimeFormat` + timeZone 'Asia/Seoul' 로 KST 정규화

export function isBusinessHours(now = new Date()): boolean { /* ... */ }
export function getNextBusinessOpening(now = new Date()): Date { /* 다음 운영 시작 시각 */ }
```

### 6.2 부재 시 자동 시스템 메시지 (채팅은 계속 가능)

운영시간 외이거나 운영자 0명일 때, **채팅은 차단하지 않고** 다음을 수행한다:

1. 세션 생성 시 sender=`system` 메시지 1건 자동 INSERT
   - i18n key: `chat.delayedResponseNotice` (운영시간 외)  / `chat.allOperatorsBusyNotice` (운영시간 내인데 전부 부재)
   - 본문 예 (ko, 운영시간 외): "지금은 운영 시간(평일 10:00–19:00, 토 10:00–16:00 KST)이 아닙니다. 메시지를 남겨주시면 운영 시간 시작과 함께 답변드리겠습니다. 빠른 회신을 원하시면 이메일을 함께 남겨주세요."
   - 본문 예 (en): "We're outside business hours (Weekdays 10:00–19:00, Sat 10:00–16:00 KST). Leave a message and we'll reply once we're back online. Please include your email for a faster response."
2. visitor 메시지는 평소처럼 INSERT + 번역 + Realtime broadcast (어드민이 다음 운영시간에 확인)
3. 위젯 헤더 인디케이터를 **"운영자 부재 / Offline"** 표시로 변경 (응답 지연 가능성 경고)
4. (선택) 첫 visitor 메시지 시 이메일 입력을 강하게 권장(폼 강조 / 별도 안내 버블)

### 6.3 운영자 응답 30분 미응답 자동 안내 (운영시간 내 한정)

- **운영시간 내**에서 마지막 visitor 메시지 후 30분 동안 운영자 응답이 없으면 sender=`system`으로 미응답 안내 INSERT (`chat.followupNotice`)
- 구현: Supabase pg_cron 또는 Next.js cron worker (**out of scope**, 후속). MVP에서는 어드민 화면에 "30분 이상 미응답" 배지를 표시하고 운영자가 수동으로 "응답 지연 안내 보내기" 버튼을 누른다.

### 6.4 응답 지연 알림용 이메일 수집

- 운영시간 외 시작 세션은 이메일 입력 폼을 닫지 않고 노출 유지
- 이메일 입력 시 `chat_sessions.visitor_email`에 저장 → 운영자가 수기로 회신 가능 (자동 알림 메일은 후속)

---

## 7. UI/UX 설계

### 7.0 로케일 분기 (사용자 확정, 2026-05-08)

**`ko` 로케일에서는 위젯을 마운트하지 않는다.** 한국어 사용자는 기존 카카오톡 채널(FloatingCTA)로 응대.

```tsx
// liv-clinic/src/app/[locale]/layout.tsx
import ChatWidget from '@/components/chat/ChatWidget';
// ...
{locale !== 'ko' && <ChatWidget locale={locale as 'en' | 'ja' | 'zh'} />}
```

```tsx
// liv-clinic/src/components/chat/ChatWidget.tsx
'use client';
type Props = { locale: 'en' | 'ja' | 'zh' };
export default function ChatWidget({ locale }: Props) {
  // 방어적 검증: prop이 잘못 들어와도 ko면 null
  if (locale === 'ko' as never) return null;
  // ...
}
```

**효과**:
- 번역 방향이 단방향 두 가지로 단순화 (§2.4 visitor → ko, ko → visitor)
- ko 방문자에게 카카오톡 채널 집중 노출 (전환율 가설)
- ko 메시지는 chat 시스템에 들어오지 않으므로 `chat_messages.original_lang ≠ 'ko'` 가 visitor 메시지 invariant

### 7.1 위젯 위치 (FloatingCTA와의 충돌 해결)

기존 `FloatingCTA`는 우하단 (`right-2 sm:right-4`), `bottom: calc(80px + env(safe-area-inset-bottom))`.

**결정: 채팅 위젯은 좌하단** — 우측 CTA(인스타·유튜브·전화·메신저)와 시각 분리, 양손잡이 모바일 사용성 향상. 게다가 ko에서는 위젯이 아예 없으므로 ko 사용자는 우하단 CTA만 본다.

```
┌──────────────────── viewport ────────────────────┐
│                                                  │
│                                                  │
│                                                  │
│                                                  │
│                                                  │
│                                                  │
│                                                  │
│                                                  │
│  💬 Chat                              📷 IG     │  ← 좌: 채팅 / 우: FloatingCTA
│  (toggle)                             ▶️ YT     │
│                                       📞 Phone  │
│                                       💛 Kakao  │
└──────────────────────────────────────────────────┘
```

```tsx
// 위젯 컨테이너
<div
  className="fixed left-2 sm:left-4 md:left-6 z-40 flex flex-col items-start"
  style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
>
```

### 7.2 토글 버튼 디자인

```
┌───────────────────────────┐
│ ┌─────────────────────┐   │
│ │ 💬 채팅상담         │   │  ← 라벨 포함 (모바일은 아이콘만)
│ │  지금 문의하세요     │   │
│ └─────────────────────┘   │
└───────────────────────────┘
```

- 닫힌 상태: 원형 아이콘 (`w-12 h-12`, `bg-primary` `text-white`, 챗 아이콘 SVG)
- 데스크톱(>= md): 라벨 옵션 노출 (`hidden md:inline`)
- 미응답 system 메시지 1건 이상 시 빨간 점 배지 (`absolute -top-1 -right-1`)

### 7.3 채팅 패널 (열림 상태)

```
┌────────────────────────────────────┐ width: 360px (mobile: 100vw - 16px)
│  💬 LIV Chat               ✕      │ height: 70vh max, 480px desktop
│  운영자 온라인 ● / 부재 ○          │ ─ Header
├────────────────────────────────────┤
│                                    │
│  System: Welcome to LIV...         │
│                                    │
│  Visitor (you): Hello              │
│   ↳ 한국어: 안녕하세요             │ ← 토글 (기본 숨김)
│                                    │
│  Operator: 안녕하세요 무엇을…       │
│   ↳ English: Hello, how can we…   │
│                                    │
│  [typing indicator]                │
├────────────────────────────────────┤
│ [텍스트 입력 ......           전송]│ ─ Composer (max 1000)
│ Powered by LIV · 한국어 자동 번역  │
└────────────────────────────────────┘
```

- **메시지 버블**: 발신자별 좌/우 정렬, 시각적 구분
  - visitor: 우측 정렬, `bg-primary` `text-white`
  - operator: 좌측 정렬, `bg-gray-100` `text-mono`
  - system: 가운데 정렬, `bg-yellow-50` `text-mono-light`, 작은 글씨
- **번역 토글**: 메시지 하단 작은 버튼 "원문 보기 / Show original"
- **타이핑 인디케이터**: 운영자/방문자가 입력 중일 때 점 3개 애니메이션 (Realtime broadcast 별도 이벤트, MVP 옵션 — 후순위)

### 7.4 컴포저(입력창)

- `<textarea>` rows=2, max 1000 글자, Enter=전송 / Shift+Enter=줄바꿈
- 우측 전송 버튼 (`bg-primary`, 비활성: 0자 / 1000자 초과)
- 좌측 글자 수 카운터 (`{n}/1000`, 900자 이상 시 빨간색)
- 모바일: `inputMode="text"`, autosize 위로

### 7.5 어드민 대시보드

#### `/admin/chat` (목록)

```
┌──────────────────────────────────────────────────────────┐
│ 채팅 상담  (미응답 3)                                     │
├──────────────────────────────────────────────────────────┤
│ ● John (en)         미응답 2     2분 전                   │
│ ● 田中 (ja)         미응답 1     5분 전                   │
│ ○ 王 (zh)           응답완료     30분 전                  │
│ ○ guest (en)        종료         어제                     │
└──────────────────────────────────────────────────────────┘
```

- 정렬: 미응답 우선, 그 안에서 `last_message_at` DESC
- 검색: 닉네임/이메일 텍스트 검색 (LIKE)
- 필터 탭: `진행중` / `종료` / `전체`

#### `/admin/chat/[sessionId]` (상세)

- 좌측: 세션 메타(닉네임, 이메일, 로케일, IP hash, 시작 시각, 종료 버튼)
- 중앙: 메시지 목록(원문 + 번역 모두 항상 표시 — 한국어를 메인으로)
- 하단: 한국어 입력창 + 전송 / 빠른 응답 템플릿(추후)

### 7.6 i18n 라벨 (chat 키)

```json
// ko.json
"chat": {
  "openButton": "채팅 상담",
  "openButtonShort": "💬",
  "title": "LIV 채팅 상담",
  "online": "운영자 온라인",
  "offline": "운영자 부재 · 메시지를 남겨주세요",
  "welcome": "안녕하세요! 무엇을 도와드릴까요?",
  "delayedResponseNotice": "지금은 운영 시간이 아닙니다. 메시지를 남겨주시면 운영 시작과 함께 답변드립니다. 빠른 회신을 원하시면 이메일을 함께 남겨주세요.",
  "allOperatorsBusyNotice": "운영자가 잠시 자리를 비웠습니다. 메시지를 남겨주시면 곧 답변드리겠습니다.",
  "followupNotice": "응답이 늦어지고 있습니다. 양해 부탁드립니다.",
  "contactLinkLabel": "상담 폼",
  "businessHours": "운영시간: 평일 10:00–19:00, 토 10:00–16:00 (KST), 일 휴무",
  "placeholder": "메시지를 입력하세요...",
  "send": "전송",
  "showOriginal": "원문 보기",
  "hideOriginal": "원문 숨기기",
  "translationFailed": "(번역 실패 — 원문만 표시)",
  "rateLimited": "메시지를 너무 빠르게 보내고 있습니다. 잠시 후 다시 시도해주세요.",
  "tooLong": "메시지는 1000자를 초과할 수 없습니다.",
  "sessionEnded": "대화가 종료되었습니다. 추가 문의는 새 채팅을 시작해주세요.",
  "consent": "메시지는 상담 품질 개선을 위해 저장됩니다.",
  "namePlaceholder": "닉네임 (선택)",
  "emailPlaceholder": "이메일 (선택, 답변 알림용)"
}
```

en/ja/zh도 동일 키 구조로 번역 (Do 단계에서 4개 언어 동시 작성).

---

## 8. Analytics / Observability

### 8.1 GA4 이벤트

```ts
// liv-clinic/src/lib/analytics-events.ts (신규 추가)
export function trackChatOpen(locale: SupportedLang) { /* event: chat_open */ }
export function trackChatFirstMessage(sessionId: string, locale: SupportedLang) { /* event: chat_first_message */ }
export function trackChatMessage(direction: 'sent'|'received', locale: SupportedLang) { /* event: chat_message */ }
export function trackChatTranslationFailure(reason: string) { /* event: chat_translation_error */ }
export function trackChatClose(reason: 'user_close'|'session_ended', durationSec: number) { /* event: chat_close */ }
```

### 8.2 서버 로깅

- 번역 실패 / rate limit hit / 5초 timeout: `console.warn` (Vercel logs)
- 번역 latency 분포: 메시지 row의 `translation_latency_ms` 컬럼으로 추적 → 추후 Looker/Metabase 분석 가능

### 8.3 어뷰즈 모니터링 지표

- 일일 메시지 수 / 세션 수 / 번역 비용 추산
- `unread_admin_count > 10`인 세션 = 봇/스팸 의심

---

## 9. 보안 / 개인정보

| 영역 | 조치 |
|------|------|
| API 키 | `OPENAI_API_KEY`는 서버 환경변수만, `NEXT_PUBLIC_*` 금지. 빌드 산출물 grep 검증 |
| 클라이언트 토큰 | `session_token`은 localStorage 보관(7일 TTL). 다른 도메인 접근 불가 |
| RLS | anon false, authenticated true. 모든 anon 접근은 service_role 경유 API만 가능 |
| Realtime 격리 | UUID v4 session_id(122-bit)로 broadcast 채널 고유성 보장. 추측 공격 불가능 |
| 입력 검증 | zod schema (length, locale, email format) — 모든 라우트 동일 |
| Rate limit | IP/세션 이중 제한. 초과 시 429 + i18n 에러 응답 |
| XSS | 메시지 본문 렌더 시 React 자동 escape. 마크다운 비활성 (1차 텍스트만) |
| HTML/태그 입력 | 서버에서 `text` 컬럼 그대로 저장하되 렌더 시 텍스트 렌더 (DOM 직접 주입 금지) |
| 개인정보 | 메시지 보존 1년 (Supabase pg_cron 일일 삭제 — out of scope, 후속). 위젯에 `consent` 안내 표기 |
| 이메일 수집 | optional. 입력 시 zod email 검증 |
| GDPR 삭제 요청 | 운영자 어드민에서 세션 단건 삭제 버튼 제공 (CASCADE) |
| 로그 마스킹 | Vercel logs에 `original_text` 출력 금지 (메타만 로깅) |

---

## 10. 환경 변수 / 설정

```env
# .env.example 추가 항목
OPENAI_API_KEY=sk-...
OPENAI_TRANSLATION_MODEL=gpt-4o-mini

# 운영시간 (선택, JSON. 미설정 시 DEFAULT_HOURS 사용)
# 주의: 운영시간은 응답 가능 안내용. 운영시간 외에도 채팅은 24/7 계속 동작한다.
CHAT_BUSINESS_HOURS_JSON='{"weekday":["10:00","19:00"],"saturday":["10:00","16:00"],"sunday":null}'

# rate limit
CHAT_RATE_LIMIT_PER_MIN=10
CHAT_RATE_LIMIT_PER_SESSION=100
CHAT_RATE_LIMIT_SESSIONS_PER_IP_DAILY=50

# 번역
CHAT_TRANSLATION_TIMEOUT_MS=5000
CHAT_TRANSLATION_RETRY=1

# 보존 (정책: 1년 = 365일, 사용자 확정)
# MVP는 정책만 명시. 자동 삭제 cron(pg_cron)은 후속 PDCA에서 추가
CHAT_MESSAGE_RETENTION_DAYS=365
```

---

## 11. 구현 순서 (Implementation Order)

1. **Supabase 스키마 작성** — `028_chat_tables.sql` (테이블, 인덱스, RLS, 트리거) 작성 → 적용
2. **TypeScript 타입 재생성** — `npx supabase gen types typescript` (또는 MCP `generate_typescript_types`)
3. **번역 모듈** — `lib/chat/translation.ts` (OpenAI 클라이언트, 시스템 프롬프트, timeout/retry)
4. **Rate limit / 운영시간 모듈** — `lib/chat/rateLimit.ts`, `lib/chat/businessHours.ts` (in-memory LRU)
5. **API Routes**:
   - `POST /api/chat/sessions` (생성)
   - `POST /api/chat/messages` (전송 + 번역)
   - `GET /api/chat/sessions/:id/messages` (이력)
   - `GET /api/chat/presence` (presence)
6. **클라이언트 hook** — `useChatSession`, `useChatRealtime`
7. **위젯 컴포넌트** — `ChatWidget`, `ChatPanel`, `MessageBubble`, `TypingIndicator`
8. **i18n 라벨** — ko/en/ja/zh `chat.*` 키 추가
9. **레이아웃 마운트** — `[locale]/layout.tsx`에 `<ChatWidget />` 추가
10. **어드민 페이지** — `/admin/chat` (목록), `/admin/chat/[sessionId]` (상세)
11. **사이드바 메뉴** — `AdminSidebar.tsx`에 "채팅 상담" + 미응답 배지
12. **Analytics** — GA4 이벤트 5종 추가
13. **빌드/타입 검증** — `npm run lint`, `npm run build`
14. **수동 QA** — 4개 로케일에서 양방향 채팅, off-hours 폴백, rate limit, 번역 실패 시나리오

---

## 12. 엣지 케이스 매트릭스

| 케이스 | 예상 동작 | 검증 방법 |
|--------|-----------|-----------|
| 방문자가 한국어로 입력 (locale=en이지만) | source hint=en, 결과 detect=ko, `translation_status='skipped'` (이미 ko) → translated_text=원문 | 수동 |
| 방문자 메시지가 이모지/URL만 | translation `skipped`, original = translated | 수동 |
| 1001자 입력 | 클라이언트 검증 차단 + 서버 zod 거부 (`tooLong`) | 수동/유닛 |
| 분당 11건 메시지 | 11번째 429 + `rateLimited` 메시지 | 수동/유닛 |
| OpenAI 타임아웃 | 5초 후 status=`failed`, UI "(번역 실패)" | API 모킹 |
| OpenAI 5xx | 재시도 1회 → 실패 시 동일 처리 | API 모킹 |
| 동일 IP 51번째 세션 생성 | 429 | 수동 |
| 운영시간 외 첫 진입 | system `delayedResponseNotice` 표시. **채팅 입력은 정상 활성화**, 메시지 전송·번역·저장 모두 동작. 위젯 헤더는 "운영자 부재 · 메시지를 남겨주세요" | 시각 변경 후 수동 |
| 운영자 0명 + 운영시간 내 | `online: false`, `businessHours: true` → system `allOperatorsBusyNotice` 표시. **채팅 입력은 정상 활성화** | presence 0 시 |
| 운영시간 외 메시지 입력 | 메시지 정상 INSERT + 번역 + Realtime broadcast. 다음 운영 시작 시 어드민이 미응답 큐에서 확인 | 자정 이후 메시지 입력 |
| 세션 종료 후 visitor 입력 | `sessionEnded` 메시지 표시 + 입력 차단 | 어드민에서 종료 |
| Realtime 끊김(네트워크) | 재연결 시도 + 재진입 시 `GET messages`로 누락 메시지 동기화 | DevTools offline |
| FloatingCTA와 위치 충돌 | 좌/우 분리로 미충돌 (좌하단 vs 우하단) | 모바일 시뮬 |
| 키보드 사용자 | Tab으로 위젯 진입 → Enter로 토글 → Esc로 닫기 | 수동 |
| 스크린리더 | 신규 메시지 `aria-live="polite"` 통지 | VoiceOver/NVDA |
| 새 탭 다중 열기 | localStorage sessionToken 공유 → 동일 세션 동기화 | 수동 |
| 시크릿 모드 | localStorage 가능, 세션 유지. 시크릿 종료 시 자동 폐기 | 수동 |
| 메시지에 LIV/Ulthera 등 브랜드명 | 시스템 프롬프트로 보존됨 | 수동/스냅샷 |
| 운영자가 영어로 답변 | source=ko로 처리 → 번역 skipped (이미 영어 → ko로 번역됨, 결과는 부정확). **MVP 한계** — 운영자는 한국어 입력만 권장. UI 안내 추가 | 수동 |

> **MVP 한계 명시**: 운영자가 한국어가 아닌 언어로 입력해도 기술적으로 동작하지만 번역 흐름이 어긋날 수 있다. 어드민 placeholder에 "한국어로 입력해주세요" 안내. 후속 개선 사항.

---

## 13. 비용 시뮬레이션

| 시나리오 | 메시지/월 | 평균 토큰(in+out) | OpenAI 비용 | Supabase Realtime | 합계/월 |
|--------|---------|----------|-----------|----|-----|
| 가벼움 | 1,000 | 100 | ~$0.04 | $0 (free) | ~$0.04 |
| 표준 | 10,000 | 100 | ~$0.4 | $0~ | ~$0.4 |
| 활발 | 50,000 | 100 | ~$2 | $0~$25 (Pro 필요시) | ~$2~$27 |
| 어뷰즈/봇 (rate limit 부재 시) | 500,000 | 100 | ~$20 | — | ~$20 |

> **결론**: 표준 트래픽(월 1만 메시지) 기준 **OpenAI 번역 비용 < $1/월**. NFR-08 충족. Rate limit이 어뷰즈 비용 폭주를 방어한다.

---

## 14. 리스크 대응 (Plan §8과 연계)

| Plan 리스크 | Design 단계 대응 |
|-------------|------------------|
| 번역 비용 폭증 | §10 환경변수로 분당/세션/IP 한도 설정. §13 비용 시뮬로 안전 마진 확인 |
| 번역 품질 부족 | §2.3 시스템 프롬프트 + 의료 용어 매핑 규칙. 어드민 화면은 항상 원문 동시 노출 |
| 운영자 부재 시 | §6 운영시간 + presence 기반 자동 응답 분기 |
| Realtime 끊김 | §4.2 broadcast 사용 + §12 재진입 시 GET 이력 fallback |
| API 키 노출 | §9 환경변수 분리, 서버 모듈 `'server-only'` 마커, grep 검증 |
| RLS 누락 | §3.4 명시적 anon 차단 + service_role 경유. Analyze 단계에서 보안 시나리오 검증 필수 |
| 메시지 길이 폭주 | §5/§12 zod 1000자 상한 |
| 짧은 메시지 언어 감지 오류 | §2.4 fromHint = visitor_locale로 명시 전달 |
| 모바일 키보드 가림 | §7 textarea autosize + viewport 처리 |
| 운영자 과부하 | §7.5 미응답 우선 정렬 + 카운트 노출 |
| GDPR/PII | §9 보존 정책 + 삭제 API. 1차는 안내 문구만, 자동 삭제는 후속 |
| 번역 API 장애 | §5.2 status='failed' fallback + i18n 안내 |
| 스팸/봇 | §3.1 ip_hash + §10 rate limit |

---

## 15. 추후 확장 후보 (Out of Scope, 메모)

- **AI 자동 응답 봇** (FAQ 학습 → 운영자 부재 시 1차 응답)
- **이미지/파일 첨부**
- **WhatsApp/LINE 외부 메신저 브릿지** (단일 어드민 inbox 통합)
- **운영자 다중 권한** (수석/일반 분리, 채팅 배정)
- **일별 미응답 메시지 이메일 알림** (Resend 활용)
- **메시지 자동 보존 기간 만료 삭제** (pg_cron)
- **번역 품질 피드백 (👍/👎)** → DeepL 폴백 자동 전환
- **음성 → 텍스트 (Whisper) → 번역**
- **상담 폼 → 채팅 자동 승계** (이메일로 답신 → 채팅 재오픈)
- **Naver Pay / 결제 시작 트리거** (예약금 결제까지 통합)

---

## 16. 참고 링크

- Plan: [`../01-plan/features/realtime-translation-chat.plan.md`](../../01-plan/features/realtime-translation-chat.plan.md)
- 기존 supabase 클라이언트: `liv-clinic/src/lib/supabase-server.ts`, `supabase-admin.ts`, `supabase-browser.ts`
- 기존 어드민 사이드바: `liv-clinic/src/components/admin/AdminSidebar.tsx`
- 기존 i18n routing: `liv-clinic/src/i18n/routing.ts`
- 기존 contact 폼: `liv-clinic/src/app/[locale]/contact/page.tsx`
- 기존 FloatingCTA: `liv-clinic/src/components/layout/FloatingCTA.tsx` (좌/우 분리 충돌 회피)
- Supabase Realtime Broadcast: <https://supabase.com/docs/guides/realtime/broadcast>
- Supabase Realtime Presence: <https://supabase.com/docs/guides/realtime/presence>
- OpenAI Chat Completion: <https://platform.openai.com/docs/api-reference/chat>
- DeepL API (후보): <https://www.deepl.com/docs-api>
- Next.js Route Handler: <https://nextjs.org/docs/app/building-your-application/routing/route-handlers>
- WCAG 2.5.5 Target Size: <https://www.w3.org/WAI/WCAG21/Understanding/target-size.html>
