-- ============================================
-- 036: Slack live-chat relay
-- - chat_sessions.slack_thread_ts   : 세션의 첫 방문자 메시지가 만든 Slack 루트 메시지 ts
-- - chat_sessions.slack_channel_id  : 실제로 전송된 채널 (환경변수가 바뀌어도 과거 세션 추적 가능)
-- - chat_messages.slack_ts          : 해당 메시지에 대응하는 Slack 메시지 ts
--                                     · 아웃바운드: chat.postMessage 응답 ts
--                                     · 인바운드:   직원 답글 이벤트의 event.ts
--                                     thread_ts → 세션 역방향 조회의 fallback 인덱스로도 쓰인다.
-- - chat_slack_events               : Slack Events API event_id 중복 처리 방지 (retry 대응)
-- ============================================

-- 1. chat_sessions: Slack 스레드 매핑
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS slack_thread_ts  TEXT NULL,
  ADD COLUMN IF NOT EXISTS slack_channel_id TEXT NULL;

-- 직원 답글(thread_ts)로 세션을 역조회하는 주 경로
CREATE INDEX IF NOT EXISTS idx_chat_sessions_slack_thread_ts
  ON public.chat_sessions (slack_thread_ts)
  WHERE slack_thread_ts IS NOT NULL;

-- 2. chat_messages: 메시지 ↔ Slack ts 대응
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS slack_ts TEXT NULL;

-- 세션 역조회 fallback + 인바운드 답글 2차 멱등성
CREATE INDEX IF NOT EXISTS idx_chat_messages_slack_ts
  ON public.chat_messages (slack_ts)
  WHERE slack_ts IS NOT NULL;

-- 3. chat_slack_events: event_id 중복 처리 방지
-- Slack은 3초 내 200을 못 받으면 동일 event_id로 최대 3회 재시도한다.
-- PK 충돌(23505)을 "이미 처리함" 신호로 사용한다.
CREATE TABLE IF NOT EXISTS public.chat_slack_events (
  event_id     TEXT        PRIMARY KEY,
  event_type   TEXT        NULL,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 오래된 행 정리용 (보관 기간 정책은 운영 중 결정 — 최소 5분만 넘기면 재시도 창은 닫힌다)
CREATE INDEX IF NOT EXISTS idx_chat_slack_events_received_at
  ON public.chat_slack_events (received_at DESC);

-- 4. RLS: anon/authenticated 모두 차단, service_role만 접근
-- (인바운드 웹훅은 service_role로만 동작하며 브라우저에서 읽을 이유가 없다)
ALTER TABLE public.chat_slack_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to chat_slack_events" ON public.chat_slack_events;
CREATE POLICY "Service role full access to chat_slack_events"
  ON public.chat_slack_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. 코멘트
COMMENT ON COLUMN public.chat_sessions.slack_thread_ts IS
  'Slack root message ts for this session. Staff replies with this thread_ts map back to the session.';
COMMENT ON COLUMN public.chat_sessions.slack_channel_id IS
  'Slack channel the session thread lives in (private channel — message.groups events).';
COMMENT ON COLUMN public.chat_messages.slack_ts IS
  'Slack message ts. Outbound: chat.postMessage response ts. Inbound: staff reply event.ts.';
COMMENT ON TABLE public.chat_slack_events IS
  'Processed Slack Events API event_id log. PK conflict = duplicate delivery, skip processing.';
