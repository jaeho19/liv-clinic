-- ============================================
-- 043: 라이브채팅 AI 1차 응대 + 가예약
-- 설계: docs/superpowers/specs/2026-10-02-chat-ai-first-response-design.md §5
-- 다시 돌려도 같은 결과가 나온다. 코드 배포보다 먼저 적용한다 —
-- 적용 전에 코드가 나가면 AI만 답하지 않고 나머지는 지금처럼 동작한다.
-- ============================================

-- 1) chat_messages: 글의 출처에 'ai' 추가, 글 길이 한도 1000 → 4000 (AI 답 + 금액 줄 + 가예약 요약).
--    지금의 CHECK 는 컬럼 정의에 붙여 만든 것이라(028·040) 이름이 자동으로 붙었다.
--    이름을 가정하지 않고, source / original_text 길이를 다루는 CHECK 를 찾아 지운 뒤 다시 만든다.
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT con.conname, pg_get_constraintdef(con.oid) AS def
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = rel.relnamespace
     WHERE ns.nspname = 'public' AND rel.relname = 'chat_messages' AND con.contype = 'c'
  LOOP
    IF c.def ~ '\msource\M' OR c.def ~ 'char_length\(original_text\)' THEN
      EXECUTE format('ALTER TABLE public.chat_messages DROP CONSTRAINT %I', c.conname);
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_source_check
    CHECK (source IN ('app', 'slack', 'auto', 'ai')),   -- ai = AI 1차 응대
  ADD CONSTRAINT chat_messages_original_text_check
    CHECK (char_length(original_text) BETWEEN 1 AND 4000);
-- 손님이 보내는 글의 한도(1000자)는 그대로다 — API(zod)가 막는다.

-- 2) chat_sessions: 직원이 맡은 시각, 🙋 멘션을 보낸 시각.
--    기존 대화 채우기는 컬럼을 처음 만들 때 한 번만 한다(다시 돌렸을 때 AI에게 돌아간 대화를 되돌리지 않게).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'chat_sessions' AND column_name = 'staff_engaged_at'
  ) THEN
    ALTER TABLE public.chat_sessions ADD COLUMN staff_engaged_at TIMESTAMPTZ NULL;
    -- 열려 있고 보관하지 않았고 직원이 답한 적이 있는 대화 → 직원이 맡은 것으로 둔다 (AI가 끼어들지 않게)
    UPDATE public.chat_sessions cs
       SET staff_engaged_at = sub.first_staff_at
      FROM (
        SELECT m.session_id, min(m.created_at) AS first_staff_at
          FROM public.chat_messages m
         WHERE m.sender = 'operator' AND m.source NOT IN ('auto', 'ai')
         GROUP BY m.session_id
      ) sub
     WHERE cs.id = sub.session_id AND cs.status = 'open' AND cs.resolved_at IS NULL;
  END IF;
END $$;

ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS ai_handoff_at TIMESTAMPTZ NULL;

-- 3) 가예약 — 대화마다 한 줄
CREATE TABLE IF NOT EXISTS public.chat_bookings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID        NOT NULL UNIQUE REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  status           TEXT        NOT NULL DEFAULT 'collecting' CHECK (status IN ('collecting', 'requested')),
  visit_date       DATE        NULL,
  visit_time       TEXT        NULL CHECK (visit_time IS NULL OR visit_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  time_note        TEXT        NULL CHECK (time_note IS NULL OR char_length(time_note) <= 60),
  treatment        TEXT        NULL CHECK (treatment IS NULL OR char_length(treatment) <= 200),
  treatment_ko     TEXT        NULL CHECK (treatment_ko IS NULL OR char_length(treatment_ko) <= 200),
  party_size       SMALLINT    NULL CHECK (party_size IS NULL OR party_size BETWEEN 1 AND 20),
  visitor_name     TEXT        NULL CHECK (visitor_name IS NULL OR char_length(visitor_name) <= 60),
  contact_channel  TEXT        NULL CHECK (contact_channel IS NULL OR contact_channel IN ('whatsapp', 'wechat', 'line', 'email')),
  contact_handle   TEXT        NULL CHECK (contact_handle IS NULL OR char_length(contact_handle) <= 254),
  arrival_date     DATE        NULL,
  departure_date   DATE        NULL,
  requested_at     TIMESTAMPTZ NULL,
  notified_key     TEXT        NULL,
  notified_at      TIMESTAMPTZ NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_chat_bookings_updated_at ON public.chat_bookings;
CREATE TRIGGER trg_chat_bookings_updated_at
  BEFORE UPDATE ON public.chat_bookings
  FOR EACH ROW EXECUTE FUNCTION public.fn_chat_sessions_updated_at();   -- NEW.updated_at = now() (028)

-- 4) AI 호출 기록 — 호출 한 번마다 한 줄
CREATE TABLE IF NOT EXISTS public.chat_ai_turns (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         UUID        NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  trigger_message_id UUID        NULL REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  reply_message_id   UUID        NULL REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  outcome            TEXT        NOT NULL CHECK (outcome IN ('sent', 'fallback', 'superseded')),
  model              TEXT        NULL,
  attempts           SMALLINT    NOT NULL DEFAULT 1,
  latency_ms         INTEGER     NULL,
  prompt_tokens      INTEGER     NULL,
  cached_tokens      INTEGER     NULL,
  completion_tokens  INTEGER     NULL,
  raw_reply          TEXT        NULL,
  history_text       TEXT        NULL,
  staff_note_ko      TEXT        NULL,
  needs_staff        BOOLEAN     NOT NULL DEFAULT false,
  staff_reason_ko    TEXT        NULL,
  issues             TEXT[]      NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_ai_turns_session_created
  ON public.chat_ai_turns (session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_ai_turns_created
  ON public.chat_ai_turns (created_at);

-- 5) 메시지 INSERT 트리거 함수 (040의 것을 교체. 세션 UPDATE 횟수는 그대로 1회)
CREATE OR REPLACE FUNCTION public.fn_chat_after_message_insert()
RETURNS TRIGGER AS $$
DECLARE
  -- 직원이 쓴 글인가 — 자동 안내(auto)와 AI 응대(ai)는 "답변"이 아니다
  is_staff BOOLEAN := NEW.sender = 'operator' AND NEW.source NOT IN ('auto', 'ai');
BEGIN
  -- 완료(보관)했던 대화에 손님이 다시 왔다 → AI가 다시 먼저 답한다. 지난 방문의 가예약은 지우고 새로 받는다
  -- (그대로 두면 새 방문이 "가예약 변경"으로 알려지고, 지난 날짜가 "이미 받은 것"으로 AI에게 간다).
  -- 아래 UPDATE 가 resolved_at 을 비우기 전에 본다.
  IF NEW.sender = 'visitor' THEN
    DELETE FROM public.chat_bookings b
     USING public.chat_sessions s
     WHERE b.session_id = NEW.session_id
       AND s.id = NEW.session_id
       AND s.resolved_at IS NOT NULL;
  END IF;

  UPDATE public.chat_sessions
  SET
    last_message_at = NEW.created_at,
    updated_at      = NEW.created_at,
    unread_admin_count = CASE
      WHEN NEW.sender = 'visitor' THEN unread_admin_count + 1
      WHEN is_staff THEN 0
      ELSE unread_admin_count END,
    -- 손님 메시지: 답 대기 시작(이미 기다리는 중이면 유지). 직원 메시지: 시계 정지 + 단계 초기화
    awaiting_since = CASE
      WHEN NEW.sender = 'visitor' THEN COALESCE(awaiting_since, NEW.created_at)
      WHEN is_staff THEN NULL
      ELSE awaiting_since END,
    escalation_level = CASE WHEN is_staff THEN 0 ELSE escalation_level END,
    -- 손님 재발신: 완료 자동 해제
    resolved_at    = CASE WHEN NEW.sender = 'visitor' THEN NULL ELSE resolved_at END,
    resolved_label = CASE WHEN NEW.sender = 'visitor' THEN NULL ELSE resolved_label END,
    -- 직원이 답하면 그 대화는 직원이 맡는다. 완료했던 대화에 손님이 다시 쓰면 AI가 다시 먼저 답한다.
    -- (SET 식 오른쪽의 resolved_at 은 갱신 전 값이다)
    staff_engaged_at = CASE
      WHEN is_staff THEN COALESCE(staff_engaged_at, NEW.created_at)
      WHEN NEW.sender = 'visitor' AND resolved_at IS NOT NULL THEN NULL
      ELSE staff_engaged_at END,
    ai_handoff_at = CASE
      WHEN NEW.sender = 'visitor' AND resolved_at IS NOT NULL THEN NULL
      ELSE ai_handoff_at END
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6) RLS — 새 표 둘은 서버(service_role)만 읽고 쓴다. 관리자 화면도 서버에서 읽어 넘긴다.
--    로그인한 사용자(authenticated)에게는 열지 않는다 — 손님 이름·연락처와 AI의 답 기록이 들어 있다. anon 은 기본 차단.
ALTER TABLE public.chat_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_ai_turns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to chat_bookings" ON public.chat_bookings;
CREATE POLICY "Service role full access to chat_bookings"
  ON public.chat_bookings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to chat_ai_turns" ON public.chat_ai_turns;
CREATE POLICY "Service role full access to chat_ai_turns"
  ON public.chat_ai_turns FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 7) 코멘트
COMMENT ON COLUMN public.chat_sessions.staff_engaged_at IS
  '직원이 이 대화에 처음 답한 시각(관리자 화면·Slack). 값이 있으면 AI가 답하지 않는다. 완료했던 대화에 손님이 다시 쓰면 NULL';
COMMENT ON COLUMN public.chat_sessions.ai_handoff_at IS
  '🙋 직원 확인 필요 멘션을 마지막으로 보낸 시각. 값이 있으면 같은 대화의 다음 🙋 는 멘션 없이 올린다';
COMMENT ON TABLE public.chat_bookings IS
  'AI 1차 응대가 받은 가예약 — 대화마다 한 줄. requested = 날짜 + 시간(또는 시간 메모) + 연락처가 모였다';
COMMENT ON COLUMN public.chat_bookings.notified_key IS
  '직원에게 마지막으로 알린 "날짜|시간|인원|채널|연락처". 이 값이 달라지면 가예약 변경 알림을 올린다';
COMMENT ON TABLE public.chat_ai_turns IS
  'AI 1차 응대의 호출 기록. sent = 답이 나감, fallback = 접수 안내로 대신함, superseded = 더 새 글이 있거나 직원이 답해 버림';
COMMENT ON COLUMN public.chat_ai_turns.history_text IS
  '다음 차례의 대화 이력에 넣는 글 — 금액 줄과 가예약 요약을 금액 없는 표시로 바꾼 것';
