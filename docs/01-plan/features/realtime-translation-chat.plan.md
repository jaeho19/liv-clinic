# Plan: 실시간 다국어 번역 채팅 (Realtime Translation Chat)

> **Feature**: `realtime-translation-chat`
> **Phase**: Plan
> **Created**: 2026-05-08
> **Owner**: jaeho19@gmail.com
> **Related**: `whatsapp-cta`, `floating-cta-redesign` (해외 환자 접점 채널)

---

## 1. 배경 (Background)

LIV 성형외과는 ko / en / ja / zh 4개 로케일을 운영하며 일본·중국·동남아·영어권 잠재 고객을 모으고 있다. 그러나 현재 **양방향 실시간 의사소통 채널이 부재**한 상태이다.

- 기존 채널:
  - 카카오톡(국내 한정)
  - 전화 `tel:02-797-2773` (한국어 응대 위주)
  - WhatsApp / LINE / WeChat (`whatsapp-cta`, `floating-cta-redesign`에서 일부 제거 또는 유지)
  - 상담 폼 (`/[locale]/contact`) — 비실시간, 단방향
- 문제:
  - 외국인 방문자가 자기 언어로 문의하더라도 데스크 직원이 즉시 이해하지 못함
  - 직원이 한국어로 답변해도 외국인이 즉시 이해하지 못함
  - 외부 메신저(WhatsApp/LINE/WeChat)는 자체 번역 기능이 약하거나 없음

이번 작업은 **홈페이지 자체에 실시간 번역 채팅 위젯**을 도입하여, 방문자 언어 ↔ 한국어 자동 번역을 거쳐 데스크 직원이 채팅창 하나로 다국어 상담을 수행하도록 한다.

---

## 2. 목표 (Goals)

1. **외국어(en / ja / zh) 로케일에만** 좌하단에 실시간 채팅 위젯을 노출한다. **`ko` 로케일은 위젯 비노출** — 한국어 사용자는 기존 카카오톡 채널로 응대.
2. 방문자 입력 메시지(en / ja / zh)는 자동으로 **한국어로 번역**되어 운영자(`/admin/chat`) 대시보드에 표시된다.
3. 운영자가 한국어로 작성한 답변은 자동으로 **방문자 언어로 번역**되어 채팅창에 표시된다.
4. 모든 메시지(원문 + 번역문)가 Supabase에 저장되어 추후 상담 이력 추적이 가능하다.
5. **채팅은 24/7 항상 가능**하되, 운영자 부재(운영시간 외 또는 0명)에는 자동 안내 메시지로 응답 지연 가능성을 고지하고 이메일 입력을 유도한다.

> **운영시간 (사용자 확정, 2026-05-08)**: 평일 10:00–19:00, 토 10:00–16:00, 일 휴무 (KST). 운영시간은 *응답 가능 여부 안내* 용도일 뿐, 채팅 자체는 24시간 동작한다.

---

## 3. 범위 (Scope)

### In Scope

- **신규 채팅 위젯** (`liv-clinic/src/components/layout/ChatWidget.tsx` 등)
  - 우측 하단 플로팅 버튼 → 클릭 시 채팅 패널 확장
  - 입력창, 메시지 목록, 닉네임/이메일(선택) 입력
- **운영자 대시보드** (`/admin/chat`)
  - 진행 중 대화 목록, 미응답 카운트
  - 대화 상세: 원문 + 번역 표시(한국어 우선)
  - 한국어 입력 → 번역본을 방문자에게 전송
- **번역 API 연동**
  - 1순위: OpenAI gpt-4o-mini 또는 DeepL API (Design 단계에서 확정)
  - 메시지 단위 호출, 결과 저장(중복 호출 방지)
- **Supabase 스키마**
  - `chat_sessions`(방문자 세션)
  - `chat_messages`(원문, 번역문, 작성자, 타임스탬프)
  - Row Level Security: 방문자는 자기 세션만 읽기/쓰기, 운영자는 전체
- **Supabase Realtime 구독**
  - 위젯 ↔ 운영자 양쪽 모두 신규 메시지 즉시 수신
- **다국어 i18n**
  - 위젯 라벨/안내 문구 ko / en / ja / zh 번역
- **운영 시간 외 폴백**
  - 운영자 부재 시 자동 응답 + `/contact` 링크 안내
- **분석/추적**
  - GA4: 채팅 시작, 첫 메시지, 응답 수신 이벤트
- **속도 제한 / 스팸 차단**
  - 같은 세션의 분당 메시지 수 제한
  - 길이/금지어 기본 필터

### Out of Scope

- **음성 / 영상 통화**
- **이미지·파일 업로드** (1차 텍스트만, 후속 PDCA에서 확장)
- **운영자 다중 계정 권한 분리** (모든 admin이 채팅 접근. 세분화는 후속)
- **외부 메신저 통합** (WhatsApp/LINE/WeChat 브릿지는 별도 PDCA)
- **AI 자동 응답 봇** (사람 직원 응대 전제. 자동 봇은 후속 검토)
- **모바일 푸시 알림** (1차는 브라우저 데스크톱 알림 + 사운드만)
- **결제/예약 트랜잭션** (채팅에서 직접 결제는 불가)
- **번역 품질 측정 대시보드**

---

## 4. 요구사항 (Requirements)

### Functional Requirements

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | 모든 로케일 페이지 우측 하단에 채팅 위젯 토글 버튼이 노출된다. | P0 |
| FR-02 | 토글 버튼을 누르면 채팅 패널이 열리며 닉네임(선택) 및 첫 메시지 입력 가능. | P0 |
| FR-03 | 방문자가 입력한 메시지는 감지된 언어 그대로 저장되고, 별도 필드에 한국어 번역본이 저장된다. | P0 |
| FR-04 | 운영자(`/admin/chat`)는 한국어 번역본을 메인으로 보고, 토글로 원문도 확인 가능하다. | P0 |
| FR-05 | 운영자가 한국어로 답변을 보내면 방문자 로케일 언어로 번역된 결과가 위젯에 표시된다. | P0 |
| FR-06 | 신규 메시지는 Supabase Realtime을 통해 1초 이내 양쪽에 도달한다. | P0 |
| FR-07 | 운영자 부재(설정값 또는 운영시간 외)일 때 자동 안내 메시지(응답 지연 가능 + 이메일 입력 유도)가 노출되되, 채팅 입력은 24/7 항상 활성화된다. | P0 |
| FR-08 | 위젯 UI 라벨은 현재 로케일에 따라 ko / en / ja / zh로 표시된다. | P0 |
| FR-09 | 모든 메시지(원문 + 번역문 + 메타)가 `chat_messages`에 영구 저장된다. | P0 |
| FR-10 | 방문자는 동일 브라우저 세션 동안 이전 대화 이력을 볼 수 있다(localStorage sessionId). | P1 |
| FR-11 | 운영자 대시보드는 미응답 대화 수를 사이드바 배지에 표시한다. | P1 |
| FR-12 | GA4에 `chat_open`, `chat_first_message`, `chat_message_received` 이벤트가 전송된다. | P1 |
| FR-13 | 같은 세션에서 분당 최대 N건 이상 메시지 전송 시 차단(스팸 방지). | P1 |
| FR-14 | 메시지 길이 상한(예: 1000자)을 초과하면 거부한다. | P1 |
| FR-15 | 운영자가 대화를 "종료" 처리하면 방문자에게 종료 안내가 표시된다. | P2 |

### Non-Functional Requirements

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-01 | 번역 + 전송 왕복 지연 | 일반 메시지 ≤ 3초 (번역 API 응답 포함) |
| NFR-02 | Realtime 메시지 도달 지연 | ≤ 1초 (Supabase Realtime) |
| NFR-03 | 위젯 초기 로딩 영향 | 메인 페이지 LCP +100ms 이내 (lazy load 적용) |
| NFR-04 | 모바일 터치 타겟 | 토글 버튼 ≥ 44×44px |
| NFR-05 | 접근성 | 키보드 탐색, `aria-live="polite"`로 신규 메시지 SR 통지 |
| NFR-06 | 데이터 보호 | 메시지 암호화 in-transit, RLS로 세션별 격리 |
| NFR-07 | 빌드 안정성 | `npm run lint` 0 errors, `npm run build` exit 0 |
| NFR-08 | 번역 API 비용 | 월간 메시지 1만 건 기준 예상 비용 < $20 (Design에서 확정) |
| NFR-09 | 운영자 알림 | 신규 메시지 수신 시 브라우저 탭 타이틀 변경 + 옵션으로 사운드 |

---

## 5. 제약사항 (Constraints)

- **번역 API 외부 의존성**: 네트워크 장애 또는 API 한도 초과 시 번역 실패 처리 필요. → 원문만 저장 + "(번역 실패)" 표시 fallback.
- **API Key 보관**: 번역 API 키는 서버 사이드(Next.js Route Handler / Edge Function)에서만 사용. 클라이언트 노출 금지.
- **운영 인력 가용성**: 24/7 대응 불가능. 운영시간(예: 10:00~19:00 KST) 외에는 자동 응답 + 폼 폴백 필수.
- **Supabase Realtime 채널 한도**: Free/Pro 플랜의 동시 connection 한계 확인 필요(Design 단계).
- **GDPR / 개인정보**: 채팅 메시지에 의료 관련 PII가 포함될 수 있음. 보존 기간(예: 1년), 삭제 정책, 개인정보처리방침 갱신 필요.
- **언어 감지 신뢰도**: 짧은 메시지("hi", "안녕")는 감지 오류 가능. → 사용자 로케일을 1차 힌트로 사용, API에 hint 파라미터 전달.
- **i18n 라우팅**: 위젯이 모든 `[locale]` 페이지에 노출되어야 하므로 `(layout.tsx`)에 마운트.
- **기존 어드민 인증**: `createServerClient()` 세션 체크와 `createAdminClient()` DB 작업 패턴 준수 (CLAUDE 메모리 참조).
- **Next.js 16 App Router**: Server Component 기본, 인터랙티브 위젯은 `'use client'` 명시.
- **번역 정확도 한계**: 의료/시술 전문 용어(울쎄라, 써마지 등 브랜드명)는 번역하지 않고 원문 유지 필요. → 시스템 프롬프트로 보존 지시.

---

## 6. 수용 기준 (Acceptance Criteria)

- [ ] `/en` 페이지에서 채팅 위젯 열기 → 영어로 "Hello" 입력 → 운영자 화면에 "안녕하세요" + 원문 "Hello" 표시.
- [ ] `/ja`에서 일본어 메시지 → 운영자 화면에 한국어 번역 표시.
- [ ] `/zh`에서 중국어 메시지 → 운영자 화면에 한국어 번역 표시.
- [ ] 운영자가 한국어 "감사합니다" 입력 → en 위젯에 "Thank you", ja 위젯에 "ありがとうございます", zh 위젯에 "谢谢" 노출.
- [ ] 메시지 전송 후 1초 이내 상대방 화면에 표시 (네트워크 정상 환경).
- [ ] 번역 왕복 시간(전송 → 상대 표시)은 평균 3초 이내.
- [ ] `/admin/chat`에서 진행 중 대화 목록 + 미응답 카운트 노출.
- [ ] 새 메시지 수신 시 운영자 화면 탭 타이틀에 `(N) ...` 카운트 표시.
- [ ] 같은 세션에서 분당 메시지 한도 초과 시 차단 메시지 표시.
- [ ] 운영시간 외(예: 일요일, 평일 22:00 등) 첫 진입 시 자동 안내 메시지 노출 + 이메일 입력 권장. **채팅 입력은 정상 활성화**되어 메시지 전송·번역·저장 모두 동작.
- [ ] 운영시간(평일 10:00–19:00, 토 10:00–16:00, 일 휴무)이 i18n 헬프 텍스트와 환경변수 기본값에 정확히 반영된다.
- [ ] 위젯 라벨(ko/en/ja/zh) 모두 번역 적용.
- [ ] 키보드(Tab/Enter/Esc)만으로 위젯 사용 가능.
- [ ] 모바일(≤375px), 태블릿, 데스크톱에서 레이아웃 정상.
- [ ] `chat_sessions`, `chat_messages` 테이블 RLS 정책으로 다른 세션 메시지 노출 차단(Postgres 권한 검증).
- [ ] 번역 API 키가 클라이언트 번들에 노출되지 않음(빌드 결과 grep 검증).
- [ ] `npm run lint` 0 errors, `npm run build` exit 0.

---

## 7. 예상 구조 (변경 파일)

### 신규 파일

| 파일 | 설명 |
|------|------|
| `liv-clinic/src/components/chat/ChatWidget.tsx` | 클라이언트 위젯 (토글 버튼 + 패널) |
| `liv-clinic/src/components/chat/ChatPanel.tsx` | 메시지 목록·입력창 |
| `liv-clinic/src/components/chat/MessageBubble.tsx` | 단일 메시지 UI (원문/번역 토글 옵션) |
| `liv-clinic/src/hooks/useChatSession.ts` | sessionId 관리 + Realtime 구독 |
| `liv-clinic/src/lib/translation.ts` | 번역 API 래퍼(서버 전용) |
| `liv-clinic/src/lib/chatApi.ts` | 메시지 송수신 API 클라이언트 |
| `liv-clinic/src/app/api/chat/messages/route.ts` | POST 메시지 전송 + 번역 |
| `liv-clinic/src/app/api/chat/sessions/route.ts` | 세션 생성/조회 |
| `liv-clinic/src/app/[locale]/admin/chat/page.tsx` | 운영자 대시보드 |
| `liv-clinic/src/app/[locale]/admin/chat/[sessionId]/page.tsx` | 대화 상세 |
| `supabase/migrations/0XX_chat_tables.sql` | `chat_sessions`, `chat_messages` 테이블 + RLS |
| `liv-clinic/src/messages/{ko,en,ja,zh}.json` (chat 키 추가) | 위젯 라벨 i18n |

### 수정 파일

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `liv-clinic/src/app/[locale]/layout.tsx` | 수정 (경량) | `<ChatWidget />` 마운트 |
| `liv-clinic/src/components/layout/AdminSidebar.tsx` | 수정 (경량) | "채팅 상담" 메뉴 + 미응답 배지 |
| `liv-clinic/src/lib/analytics-events.ts` | 수정 (경량) | `trackChatOpen()`, `trackChatMessage()` 추가 |
| `liv-clinic/.env.example` | 수정 | `OPENAI_API_KEY` 또는 `DEEPL_API_KEY` 환경변수 안내 |
| `liv-clinic/next.config.ts` | 검토 | 필요 시 `experimental.serverActions` 또는 외부 도메인 허용 |

---

## 8. 리스크 및 대응

| 리스크 | 영향도 | 대응 |
|--------|--------|------|
| 번역 API 비용 폭증(트래픽/봇) | High | 분당/일별 메시지 한도, 세션당 최대 메시지 수 제한, IP 기반 rate limit |
| 번역 품질 부족(의료 용어 오역) | Medium | 시스템 프롬프트에 시술명/브랜드명 보존 지시. 운영자 화면에 원문도 항상 표시 |
| 운영자 부재 시 응답 지연 → 사용자 이탈 | High | 첫 메시지 시 자동 응답 + `/contact` 폼 안내. 운영시간 명시 |
| Supabase Realtime 연결 끊김 | Medium | 재연결 로직, 새로고침 시 마지막 N건 이력 불러오기 |
| API 키 클라이언트 노출 | Critical | 모든 번역 호출은 Route Handler 경유. `NEXT_PUBLIC_` prefix 절대 사용 금지 |
| RLS 정책 누락으로 세션 간 메시지 노출 | Critical | 마이그레이션에 RLS 명시, Design 단계에서 보안 시나리오 검증 |
| 메시지 길이 폭주(1만자 등)로 비용 증가 | Medium | 1000자 상한, 초과 시 거절 |
| 짧은 메시지 언어 감지 오류 | Low | 현재 로케일을 hint로 전달. fallback: 영어 가정 |
| 모바일 키보드가 입력창을 가림 | Medium | `inputMode`, `viewport-fit` 검토, 입력 포커스 시 위젯 상단 정렬 |
| 동시 다발 채팅으로 운영자 과부하 | Medium | 미응답 카운트 표시, 운영자 1명 동시 대화 수 제한 옵션 |
| 개인정보 수집/보존 이슈(GDPR/개인정보보호법) | High | 개인정보처리방침 갱신, 보존 기간 명시, 삭제 API 제공 (out of scope 1차) |
| 번역 API 장애 | Medium | 원문만 저장 + "(번역 실패, 운영자 직접 확인)" 표시 |
| 봇/스팸 메시지로 채널 오염 | Medium | rate limit + 금지어 필터 + 운영자 차단 기능 (1차는 기본 필터만) |

---

## 9. 다음 단계 (Next Phase)

- `/pdca design realtime-translation-chat` — 다음 항목 확정:
  - 번역 API 선택(OpenAI vs DeepL vs Google) 및 비용 시뮬레이션
  - `chat_sessions`/`chat_messages` 컬럼 정의 + RLS 정책
  - Realtime 채널 토폴로지 (per-session vs global admin)
  - 위젯 ↔ 서버 ↔ 번역 API 시퀀스 다이어그램
  - 운영자 부재 자동 응답 메시지 사양
  - 운영 시간 / 운영자 온라인 상태 판단 로직
- `/pdca do realtime-translation-chat` — 마이그레이션 → API 라우트 → 위젯 → 어드민 순 구현
- `/pdca analyze realtime-translation-chat` — 수용 기준 기반 Gap 분석 + 보안 시나리오 검증

---

## 10. 참고 자료

- 기존 어드민 인증 패턴: `liv-clinic/src/lib/supabase/server.ts` (`createServerClient()`, `createAdminClient()`)
- 기존 i18n: `liv-clinic/src/i18n/routing.ts`, `liv-clinic/src/messages/*.json`
- 기존 사이드바: `liv-clinic/src/components/layout/AdminSidebar.tsx`
- 기존 플로팅 CTA: `liv-clinic/src/components/layout/FloatingCTA.tsx` (위치 충돌 검토)
- 상담 폼 폴백: `liv-clinic/src/app/[locale]/contact/page.tsx`
- Supabase Realtime: <https://supabase.com/docs/guides/realtime>
- OpenAI Chat API: <https://platform.openai.com/docs/api-reference/chat>
- DeepL API: <https://www.deepl.com/docs-api>
- Next.js 16 Route Handler: <https://nextjs.org/docs/app/building-your-application/routing/route-handlers>
- 선행 PDCA: `docs/01-plan/features/floating-cta-redesign.plan.md`, `docs/01-plan/features/whatsapp-cta.plan.md`
