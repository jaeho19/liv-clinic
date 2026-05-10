-- ============================================
-- 028: Realtime Translation Chat Tables
-- - chat_sessions  (방문자 세션, en/ja/zh만)
-- - chat_messages  (원문 + 번역 분리 저장)
-- - RLS: anon 차단, authenticated 전체 접근, service_role 전체
-- - Trigger: 메시지 INSERT 시 last_message_at, unread_admin_count, updated_at 갱신
-- ============================================

-- 1. chat_sessions
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token         UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  visitor_locale        TEXT        NOT NULL CHECK (visitor_locale IN ('en','ja','zh')),
  visitor_name          TEXT        NULL CHECK (visitor_name IS NULL OR char_length(visitor_name) <= 60),
  visitor_email         TEXT        NULL,
  status                TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','abandoned')),
  assigned_admin_id     UUID        NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash               TEXT        NULL,
  user_agent            TEXT        NULL,
  last_message_at       TIMESTAMPTZ NULL,
  unread_admin_count    INTEGER     NOT NULL DEFAULT 0 CHECK (unread_admin_count >= 0),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at             TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_status_last_msg
  ON public.chat_sessions (status, last_message_at DESC NULLS LAST);

-- session_token UNIQUE 제약은 lookup도 인덱스로 활용 가능, 별도 인덱스 불필요

-- 2. chat_messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id               UUID        NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender                   TEXT        NOT NULL CHECK (sender IN ('visitor','operator','system')),
  sender_admin_id          UUID        NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  original_text            TEXT        NOT NULL CHECK (char_length(original_text) BETWEEN 1 AND 1000),
  original_lang            TEXT        NOT NULL CHECK (original_lang IN ('ko','en','ja','zh')),
  translated_text          TEXT        NULL,
  translated_lang          TEXT        NULL CHECK (translated_lang IS NULL OR translated_lang IN ('ko','en','ja','zh')),
  translation_status       TEXT        NOT NULL DEFAULT 'pending'
                                       CHECK (translation_status IN ('pending','success','failed','skipped')),
  translation_latency_ms   INTEGER     NULL,
  translation_error        TEXT        NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
  ON public.chat_messages (session_id, created_at ASC);

-- 3. updated_at 트리거 (chat_sessions)
CREATE OR REPLACE FUNCTION public.fn_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER trg_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.fn_chat_sessions_updated_at();

-- 4. 메시지 INSERT 후 세션 메타 갱신 트리거
CREATE OR REPLACE FUNCTION public.fn_chat_after_message_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_sessions
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

DROP TRIGGER IF EXISTS trg_chat_after_message_insert ON public.chat_messages;
CREATE TRIGGER trg_chat_after_message_insert
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.fn_chat_after_message_insert();

-- 5. RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 5.1 service_role: 전체 접근 (API 라우트용)
DROP POLICY IF EXISTS "Service role full access to chat_sessions" ON public.chat_sessions;
CREATE POLICY "Service role full access to chat_sessions"
  ON public.chat_sessions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to chat_messages" ON public.chat_messages;
CREATE POLICY "Service role full access to chat_messages"
  ON public.chat_messages FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5.2 authenticated (어드민): 전체 접근 — 기존 LIV 프로젝트 패턴(authenticated = admin)
DROP POLICY IF EXISTS "Authenticated users can manage chat_sessions" ON public.chat_sessions;
CREATE POLICY "Authenticated users can manage chat_sessions"
  ON public.chat_sessions FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage chat_messages" ON public.chat_messages;
CREATE POLICY "Authenticated users can manage chat_messages"
  ON public.chat_messages FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5.3 anon: 명시적 차단 (모든 anon 접근은 service_role 경유 API에서만)
-- (기본 RLS는 deny이지만 명시적 차단 정책으로 의도를 코드에 박아둠)
-- 별도 정책 추가 불필요 — 기본 RLS deny가 anon 차단으로 동작.
-- (단, 이하 NOTICE는 보안 리뷰자에게 의도를 알리는 용도)
DO $$
BEGIN
  RAISE NOTICE 'chat_sessions / chat_messages: anon access denied by default RLS. All anon read/write must go through API Routes using service_role.';
END $$;

-- 6. Realtime publication (postgres_changes 구독용)
-- 운영자(authenticated) 측만 직접 구독, 방문자는 Broadcast 채널을 사용하므로
-- chat_messages만 publication에 추가해도 충분하지만 chat_sessions도 어드민 카운트 갱신에 필요.
-- 이미 'supabase_realtime' publication이 존재한다고 가정 (Supabase 기본 설치).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- 멱등 처리: 이미 추가된 테이블이면 ALTER가 에러를 낼 수 있으므로 가드
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- 7. 코멘트 (DB 자체 문서화)
COMMENT ON TABLE  public.chat_sessions IS 'Realtime translation chat: visitor sessions (en/ja/zh only — ko visitors use Kakao channel)';
COMMENT ON TABLE  public.chat_messages IS 'Realtime translation chat: messages with original + translated text columns';
COMMENT ON COLUMN public.chat_sessions.session_token IS 'Client-side localStorage token for visitor authentication via API routes';
COMMENT ON COLUMN public.chat_messages.original_text IS 'Verbatim sender input, max 1000 chars';
COMMENT ON COLUMN public.chat_messages.translated_text IS 'Auto-translated text. NULL when status=failed/skipped';
COMMENT ON COLUMN public.chat_messages.translation_status IS 'pending → success/failed/skipped. Failed translations keep original_text only';
