-- ============================================
-- 048: 설문 답례품 받은 분 명단
-- 받은 날부터 90일 동안 설문 링크를 다시 보내지 않으려고 적어 둔다(사용자 요청 2026-11-24).
-- 설계: docs/superpowers/specs/2026-11-24-survey-gift-recipients-design.md
-- 다시 돌려도 같은 결과가 나온다. 코드 배포보다 먼저 적용한다 —
-- 적용 전에 코드가 나가면 관리자 화면의 「드림」·명단만 실패하고 설문 제출은 영향이 없다.
-- ============================================

-- 이름과 휴대폰 뒤 4자리, 받은 날(날짜만)만 남긴다.
-- 답례품 번호·응답 id·시각은 일부러 넣지 않는다 — 명단으로 그분의 설문 답을 찾을 수 없게 한다.
-- 90일이 지난 줄은 관리자 API(/api/admin/survey/recipients)가 명단을 열 때 지운다.
CREATE TABLE IF NOT EXISTS public.survey_gift_recipients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40 AND name = btrim(name)),
  phone_last4 TEXT NOT NULL CHECK (phone_last4 ~ '^[0-9]{4}$'),
  given_on    DATE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Seoul')::date
);

CREATE INDEX IF NOT EXISTS survey_gift_recipients_given_on_idx
  ON public.survey_gift_recipients (given_on DESC);

COMMENT ON TABLE public.survey_gift_recipients IS
  '설문 답례품 받은 분(이름·휴대폰 뒤 4자리). 받은 날 + 90일 전까지 설문 링크를 다시 보내지 않는다. 답례품 번호·응답과 연결하지 않는다.';

-- RLS: 공개(anon) 접근 없음. 서비스 롤(관리자 API)만 읽고 쓴다.
ALTER TABLE public.survey_gift_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to survey_gift_recipients" ON public.survey_gift_recipients;
CREATE POLICY "Service role full access to survey_gift_recipients"
  ON public.survey_gift_recipients FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
