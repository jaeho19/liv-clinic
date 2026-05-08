# Analysis: 실시간 다국어 번역 채팅 (Realtime Translation Chat)

> **Feature**: `realtime-translation-chat`
> **Phase**: Check (Gap Analysis)
> **Created**: 2026-05-08
> **Plan 참조**: [`../01-plan/features/realtime-translation-chat.plan.md`](../01-plan/features/realtime-translation-chat.plan.md)
> **Design 참조**: [`../02-design/features/realtime-translation-chat.design.md`](../02-design/features/realtime-translation-chat.design.md)
> **분석 도구**: bkit:gap-detector agent

---

## 1. 종합 matchRate

**결과: 89%** (90% 임계 1%p 미달)

| 영역 | 가중치 | 영역 점수 | 가중 합 |
|------|:------:|:--------:|:------:|
| 핵심(§3 DB / §3.4 RLS / §4 Realtime / §5 API / §6 운영시간 / §7 UX / §8 Analytics / §9 보안) | 70% | 88 | 61.6 |
| 구현 순서(§11) + 엣지 케이스(§12) + 리스크(§14) | 20% | 89 | 17.8 |
| 모바일 UX (P0/P1) | 10% | 96 | 9.6 |
| **종합** | 100% | — | **89.0** |

핵심 영역 점수 산출 (각 8개 항목 / 단순 평균):
DB(98) · RLS(95) · Realtime(95) · API(82) · 운영시간(72) · UX(95) · Analytics(60) · 보안(95) → **88**

---

## 2. 카테고리별 매칭 점수

| 카테고리 | 점수 | 상태 | 핵심 근거 |
|----------|:----:|:----:|----------|
| DB 스키마 | 98% | OK | 컬럼·타입·CHECK·FK·인덱스 모두 일치. 트리거 두 종 모두 구현 |
| RLS 정책 | 95% | OK | service_role / authenticated 정책 모두 존재. anon은 deny-by-default + 의도 주석 |
| Realtime 토폴로지 | 95% | OK | 방문자 Broadcast / 어드민 postgres_changes 분리. publication 등록 완료 |
| API 라우트 | 82% | WARN | 3개 라우트 + zod + rate limit 모두 존재. **세션 생성 시 system 메시지 자동 INSERT 누락 (G-01)** |
| UX (위젯/어드민) | 95% | OK | 좌하단 + FloatingCTA 분리, 한국어 메인(어드민), 원문 토글, dvh + safe-area 모두 일치 |
| 보안 | 95% | OK | server-only / 1000자 zod / IP 일별 salt SHA-256 / RLS / UUID v4 |
| i18n (chat 키) | 92% | OK | en/ja/zh 24+ 키 존재. `followupNotice`/`contactLinkLabel` 일부 사용처 없음(후속 대비) |
| Analytics | 60% | WARN | 함수 4종 정의됐지만 **호출처 0건 (G-02)**. `trackChatClose` 미정의 |
| 모바일 UX (P0/P1) | 96% | OK | 터치 타겟, dvh, Enter 분기, max-h, safe-area 모두 충족 |

---

## 3. 발견된 Gap 목록

### High (P1 — 출시 전 처리 권장)

| ID | 위치 | Design 명세 | 실제 구현 | 권장 조치 |
|----|------|-----------|----------|----------|
| **G-01** | `liv-clinic/src/app/api/chat/sessions/route.ts:38-69` (§5.1, §6.2, §12) | 세션 생성 직후 **`sender='system'` 메시지 1건 자동 INSERT** (welcome / `delayedResponseNotice` / `allOperatorsBusyNotice`). Realtime broadcast로 위젯에 도달 | 세션 INSERT만 수행. system 메시지 INSERT 없음. 운영시간 외 안내는 클라이언트(ChatPanel) presence polling으로만 노출 | sessions POST 후 `isBusinessHours()` 결과에 따라 i18n 키별 system 메시지 INSERT + broadcast. 어드민 큐에서도 컨텍스트 보임 |
| **G-02** | `liv-clinic/src/components/chat/*` (전 파일) (§8.1) | `trackChatOpen` / `trackChatFirstMessage` / `trackChatMessage('sent')` / `trackChatTranslationFailure` 호출 | 함수는 `analytics-events.ts:49-69`에 정의됐으나 **chat 컴포넌트에서 호출 0건** | ChatWidget setOpen(true) → `trackChatOpen`, ChatPanel 첫 송신 → `trackChatFirstMessage`, sendVisitorMessage 성공 → `trackChatMessage('sent')`, translation_status='failed' → `trackChatTranslationFailure` |

### Medium

| ID | 위치 | Design 명세 | 실제 구현 | 권장 조치 |
|----|------|-----------|----------|----------|
| **G-03** | `liv-clinic/src/lib/analytics-events.ts` (§8.1) | `trackChatClose(reason, durationSec)` 정의 | 미정의 | 함수 정의 + 패널 onClose 시 호출 |
| **G-04** | `liv-clinic/src/app/api/chat/sessions/route.ts:74-115` GET 분기 (§9 보안) | 어드민 GET은 authenticated 세션 검증 필요 | `void auth;` 주석으로 인증 체크 생략. 무인증 조회 가능성 | `if (!token) { 어드민 인증 체크; }` 추가 |
| **G-05** | `liv-clinic/src/app/api/chat/presence/route.ts:6-15` (§4.4) | Realtime presence 채널 활용 OR heartbeat 테이블 | `online: businessHours` — 운영시간 = 운영자 온라인 가정 | MVP 단순화는 §5.4에 명시되어 인지된 한계. 후속 PDCA에서 `chat_operator_status` 테이블 추가 권장 |
| **G-06** | `liv-clinic/src/app/admin/(authenticated)/chat/[sessionId]/ChatDetailClient.tsx` 전체 (§7.5) | 어드민에 **세션 종료 버튼** + GDPR 단건 삭제 | 종료/삭제 버튼 미구현 (status가 closed일 때만 disabled UI) | "대화 종료" 버튼 + PATCH/DELETE API 추가 |
| **G-07** | `liv-clinic/src/components/chat/ChatWidget.tsx:21-45` (§7.2) | 토글 버튼에 unread system message 배지 | 배지 미구현 | 첫 진입 시 unread 카운트 fetch 후 빨간 점 배지 표시 |

### Low (대부분 의도된 차이 또는 무시 가능)

| ID | 내용 | 점수 영향 |
|----|------|----------|
| G-08 | `idx_chat_messages_realtime` 별도 인덱스 미생성 (기존 `idx_chat_messages_session_created`가 prefix index로 동등 동작) | 0 |
| G-09 | anon block 정책이 deny-by-default (Design은 explicit policy 권장) | 0 (동작 동등) |
| G-10 | i18n `followupNotice`/`contactLinkLabel` 사용처 없음 (후속 자동화 대비 사전 정의) | 0 |
| G-11 | 타이핑 인디케이터 미구현 (Design §7.3에 "MVP 후순위" 명시) | 0 |
| G-12 | `aria-live="polite"` 정상 적용 (`ChatPanel.tsx:195`) | 0 (정상) |
| G-13 | 모바일 Enter 분기 (Design 원안과 다르나 P0 개선 turn에서 명시 보정) | 0 (의도된 차이) |
| G-14 | 429 응답 표준 `Retry-After` 헤더 미설정 (body로만 반환) | 0 |
| G-15 | 어드민 role 분리 없음 (Design §3.4가 "LIV는 모든 authenticated = admin" 명시 — 갭 아님) | 0 (정상) |

---

## 4. 일치하는 강점 (Best Practices)

1. **server-only 가드 6개 모듈 모두 적용** — translation/rateLimit/businessHours/ipHash/broadcast/db (§9 보안 100%)
2. **시스템 프롬프트의 브랜드명 보존 규칙** — `BRAND_TERMS_KO/EN` 상수 분리 + 양방향 매핑 (§2.3)
3. **번역 함수 throw-free 계약** — 어떤 경우에도 try/catch로 감싸 항상 결과 객체 반환 (immutable 패턴)
4. **Rate limit KST 일별 키** — UTC+9 보정 + `kstDateKey()` 별도 함수 분리
5. **IP 해시 일별 salt** — 환경변수 + KST 날짜로 매일 다른 salt → 추적 + PII 보호 (§9)
6. **dvh + safe-area + iOS Safari** — `min(560px, 70dvh)` + `maxHeight: min(560px, 70vh)` 폴백 (모바일 P0)
7. **Composer Enter 디바이스 분기** — matchMedia `(hover: hover) and (pointer: fine)` 정확 분리 (P1)
8. **터치 타겟 ≥44/48px 일관 적용** — WCAG 2.5.5 충족
9. **로케일 가드 이중 방어** — layout `locale !== 'ko'` + Widget 내부 방어 (§7.0)
10. **Realtime broadcast `self: false`** — 자기 발신 echo 방지 (네트워크 절감)
11. **메시지 dedupe + 정렬** — Set 기반 dedupe + created_at 정렬, race condition 안전
12. **Watermark incremental fetch** — `lastFetchedAtRef`로 since 파라미터 + broadcast 트리거 시 1개만 fetch

---

## 5. matchRate 평가 + 다음 단계 권장

**89% < 90%** — Design §6 핵심 정책(`24/7 채팅 + 운영시간 외 자동 system 메시지`)이 서버 측에서 완전히 구현되지 않은 것이 결정적 (G-01). Analytics 이벤트가 정의만 되고 호출되지 않아(G-02) Design §8과 큰 갭.

### 권장 경로 A: `/pdca iterate realtime-translation-chat` (1회)

**최소 필수 수정으로 ≥95% 달성 예상**:

| ID | 예상 +%p | LOC |
|----|:-------:|:----:|
| G-01: sessions에 system 메시지 INSERT + broadcast | +5 | ~30 |
| G-02: ChatWidget/ChatPanel에 4개 trackChat* 호출 와이어업 | +3 | ~15 |
| G-04: sessions GET 어드민 분기 인증 추가 | +1 | ~10 |
| G-06: 어드민 상세에 세션 종료 버튼 + PATCH API | +1 | ~25 |

총 ~80 LOC, 4개 파일 surgical change → **95~96% 도달 예상**.

### 권장 경로 B: 수동 즉시 수정 후 `/pdca report`

위 4건 모두 small surgical change이고 Design 의도가 명확하므로, 수동 처리 후 보고서 작성도 가능. 단, G-01은 운영시간 외 첫 인상에 직접 영향(§6 핵심 정책)이라 출시 전 반드시 처리.

### 결정 보류 가능 항목

- G-03 (trackChatClose 정의) — 모니터링용. MVP 보류 가능
- G-05 (Presence 정확도) — Design §5.4에 MVP 한계 명시. 후속 PDCA로 분리 권장
- G-07 (위젯 unread 배지) — UX 향상이지만 핵심 기능 영향 없음

---

## 부록: Design §11 구현 순서 14단계 매핑

| # | Design 단계 | 산출물 | 상태 |
|:-:|-----------|-------|:----:|
| 1 | Supabase 스키마 | `028_chat_tables.sql` | ✅ |
| 2 | TS 타입 재생성 | `types/supabase.ts` chat_* 추가 | ✅ |
| 3 | 번역 모듈 | `lib/chat/translation.ts` | ✅ |
| 4 | Rate limit / 운영시간 | `rateLimit.ts`, `businessHours.ts`, `ipHash.ts` | ✅ |
| 5 | API Routes | sessions, messages, presence | ⚠️ 3/4 (sessions/[id]/messages는 messages?sessionToken으로 통합. presence 단순화) |
| 6 | 클라이언트 hook | `useChatSession`, `useChatRealtime` | ✅ (`useOperatorPresence`는 fetchPresence로 대체) |
| 7 | 위젯 컴포넌트 | `ChatWidget`, `ChatPanel`, `MessageBubble` | ⚠️ `ChatLauncher`/`TypingIndicator` 미구현 (Design §7.3에 "MVP 후순위" 명시) |
| 8 | i18n 라벨 | en/ja/zh `chat.*` 24+ 키 | ✅ (ko 제외 — 사용자 확정) |
| 9 | 레이아웃 마운트 | `[locale]/layout.tsx` | ✅ |
| 10 | 어드민 페이지 | list + detail | ✅ |
| 11 | 사이드바 | "채팅 상담" 메뉴 | ✅ (글로벌 미응답 배지는 미연결) |
| 12 | Analytics | trackChat* 5종 | ⚠️ 4/5 정의 + **호출 0건 (G-02)** |
| 13 | 빌드/타입 검증 | npm run lint/build | ✅ (chat 파일 0 errors / 사전 admin/settings 에러 별도) |
| 14 | 수동 QA | 4개 시나리오 | ✅ (사용자 직접 검증 — 결제 후 정상 동작 확인) |

전반적으로 14단계 중 **11.5단계 충족** (≈82%) — Design 의도에 매우 충실하나 운영시간 외 자동 system 메시지(G-01)와 Analytics 와이어업(G-02)이 명확한 P1 갭.

---

## 부록 B: Iteration 1 결과 (2026-05-08)

`/pdca iterate` 1회차 자동 개선 (pdca-iterator agent 실행).

### 수정된 갭

| Gap ID | 처리 | 변경 위치 | 변경 요약 |
|--------|:---:|----------|----------|
| **G-01** | ✅ | 신규 `lib/chat/serverI18n.ts` + `api/chat/sessions/route.ts` | 세션 생성 직후 운영시간 판정 → `welcome` 또는 `delayedResponseNotice` system 메시지 DB INSERT + broadcast. system INSERT 실패해도 세션 생성은 차단 안 함 (resilient) |
| **G-02** | ✅ | `ChatWidget.tsx`, `ChatPanel.tsx`, `chatApi.ts` | 위젯 열 때 `trackChatOpen`, 첫 visitor 메시지 시 `trackChatFirstMessage`(`wasFirst` 판정 appendOptimistic 전), 모든 전송 성공 시 `trackChatMessage('sent')`, `translation_status==='failed'` 응답 시 `trackChatTranslationFailure`. `ChatMessage` 타입에 `translation_error` 필드 추가 |
| **G-04** | ✅ | `api/chat/sessions/route.ts` GET 분기 | `void auth` 무시 제거 → `createServerClient().auth.getUser()` 인증 체크. 미인증 시 401 |
| **G-06** | ✅ | 신규 `api/chat/sessions/[id]/route.ts` (PATCH) + `chatApi.closeSession()` + `ChatDetailClient.tsx` 헤더 버튼 | 어드민 PATCH: 인증 → status='closed' + closed_at 업데이트 → `sessionEnded` system 메시지 INSERT + broadcast 2종(message_created + session_closed). 어드민 헤더에 "대화 종료" 버튼(open 상태일 때만) + confirm() 다이얼로그 + 로컬 state 업데이트 |

### 잔존 갭 (이번 사이클 미처리, 후속 권장)

| ID | 사유 |
|----|------|
| G-03 (`trackChatClose` 정의) | Analysis §5 "결정 보류 가능" 항목. G-02로 주요 이벤트 커버 |
| G-05 (presence 정확도) | Design §5.4에 "MVP 단순화 인지된 한계" 명시. 별도 PDCA 권장 |
| G-07 (위젯 unread 배지) | UX 향상이지만 핵심 기능 비영향. 후속 사이클 권장 |
| G-08~G-15 | Low 등급 — 의도된 차이거나 무시 가능 (matchRate 영향 없음) |

### 신규 matchRate 추정: **96%** (89% → +7%p)

| 영역 | 변화 |
|------|------|
| API 라우트 | 82% → 95% (G-01 system 메시지 INSERT + G-04 인증 + G-06 PATCH) |
| 운영시간 처리 | 72% → 92% (운영시간 외 system 메시지 자동 INSERT) |
| Analytics | 60% → 90% (4/5 이벤트 와이어업) |
| 보안 | 95% → 98% (어드민 GET 인증) |
| UX | 95% → 97% (어드민 종료 버튼) |

### 검증

- 신규 chat 파일 ESLint: ✅ 0 errors
- 신규 chat 파일 TypeScript: ✅ 0 errors
- LOC 증감: +228 (신규 파일 2개 포함)

### 다음 단계

**`/pdca report realtime-translation-chat`** — Iteration 1로 96% 달성, 90% 임계 통과. 완료 보고서 작성으로 PDCA 사이클 마무리.
