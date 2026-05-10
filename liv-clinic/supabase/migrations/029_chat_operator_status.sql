-- ============================================
-- 029: chat_operator_status (Presence Heartbeat)
-- - 어드민 채팅 페이지에서 60초마다 last_seen_at upsert
-- - presence API가 last_seen_at > now()-90s 카운트
-- - RLS: anon 차단(deny-by-default), authenticated 자기 row만, service_role 전체
-- - FK: auth.users(id) ON DELETE CASCADE → 사용자 삭제 시 자동 정리
-- ============================================

-- 1. chat_operator_status 테이블
CREATE TABLE IF NOT EXISTS public.chat_operator_status (
  operator_id   UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  status        TEXT         NOT NULL DEFAULT 'online'
                             CHECK (status IN ('online','away')),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 2. 인덱스 (presence count 조회용)
CREATE INDEX IF NOT EXISTS idx_chat_operator_status_last_seen
  ON public.chat_operator_status (last_seen_at DESC);

-- 3. updated_at 트리거
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

-- 4. RLS 활성화
ALTER TABLE public.chat_operator_status ENABLE ROW LEVEL SECURITY;

-- 4.1 service_role: 전체 접근 (presence API count용)
DROP POLICY IF EXISTS "Service role full access to operator_status" ON public.chat_operator_status;
CREATE POLICY "Service role full access to operator_status"
  ON public.chat_operator_status FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4.2 authenticated: 자기 row만 SELECT (heartbeat 후 확인용)
DROP POLICY IF EXISTS "Authenticated can read own status" ON public.chat_operator_status;
CREATE POLICY "Authenticated can read own status"
  ON public.chat_operator_status FOR SELECT
  USING (auth.uid() = operator_id);

-- 4.3 authenticated: 자기 row INSERT (최초 heartbeat)
DROP POLICY IF EXISTS "Authenticated can upsert own status" ON public.chat_operator_status;
CREATE POLICY "Authenticated can upsert own status"
  ON public.chat_operator_status FOR INSERT
  WITH CHECK (auth.uid() = operator_id);

-- 4.4 authenticated: 자기 row UPDATE (이후 heartbeat)
DROP POLICY IF EXISTS "Authenticated can update own status" ON public.chat_operator_status;
CREATE POLICY "Authenticated can update own status"
  ON public.chat_operator_status FOR UPDATE
  USING (auth.uid() = operator_id)
  WITH CHECK (auth.uid() = operator_id);

-- anon 정책은 정의하지 않음 → deny-by-default

-- ============================================
-- 검증 SQL (수동 실행 권장)
-- ============================================
-- 1. anon 차단 검증 (0 rows 정상)
--    SET ROLE anon;
--    SELECT * FROM public.chat_operator_status;
--    RESET ROLE;
--
-- 2. 다른 사용자 row 차단 검증 (0 rows 정상)
--    SET ROLE authenticated;
--    SET request.jwt.claims = '{"sub":"OTHER_USER_UUID"}';
--    SELECT * FROM public.chat_operator_status;
--    RESET ROLE;
