-- ============================================
-- 047: 내원객 만족도 설문
-- 계획서: claude.ai/artifact/J8zNRAf51hunVkg7QqC1qz (2026-11-18 대표원장 답변 반영, 15문항)
-- 설문 주소 /{locale}/survey 는 시술 후 주의사항 카카오톡에 함께 보낸다.
-- 다시 돌려도 같은 결과가 나온다. 코드 배포보다 먼저 적용한다 —
-- 적용 전에 코드가 나가면 설문 제출만 실패하고(화면에 "다시 시도" 안내) 나머지는 영향이 없다.
-- ============================================

-- 1) 응답. 이름·연락처는 받지 않는다(익명).
--    평가 문항(1~5점)은 문항이 바뀔 수 있어 ratings JSON 에 문항 id → 점수로 담는다.
--    어떤 문항 묶음인지는 survey_version 으로 구분한다(코드 src/lib/survey/questions.ts).
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  survey_version  SMALLINT    NOT NULL DEFAULT 1 CHECK (survey_version BETWEEN 1 AND 100),
  locale          TEXT        NOT NULL CHECK (locale IN ('ko', 'en', 'ja', 'zh', 'zh-TW')),
  first_visit     BOOLEAN     NOT NULL,
  treatments      TEXT[]      NOT NULL CHECK (cardinality(treatments) BETWEEN 1 AND 12),
  treatment_other TEXT        NULL CHECK (treatment_other IS NULL OR char_length(treatment_other) <= 100),
  ratings         JSONB       NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(ratings) = 'object'),
  -- 「오늘 만나지 않았어요」로 넘긴 파트 (counselor·doctor·nurse·skincare)
  skipped_parts   TEXT[]      NOT NULL DEFAULT '{}'
                  CHECK (skipped_parts <@ ARRAY['counselor', 'doctor', 'nurse', 'skincare']::TEXT[]),
  recommend       SMALLINT    NOT NULL CHECK (recommend BETWEEN 0 AND 10),
  comment         TEXT        NULL CHECK (comment IS NULL OR char_length(comment) <= 1000)
);

CREATE INDEX IF NOT EXISTS survey_responses_created_at_idx
  ON public.survey_responses (created_at DESC);

COMMENT ON TABLE public.survey_responses IS
  '내원객 만족도 설문 응답(익명). 공개 API /api/survey 가 서비스 롤로 넣고, 관리자 화면이 읽는다.';
COMMENT ON COLUMN public.survey_responses.ratings IS
  '평가 문항 id → 1~5점. 답하지 않은 문항·넘긴 파트의 문항은 키가 없다.';

-- 2) 답례품 번호. 응답과 일부러 연결하지 않는다(응답 id 없음, 발급 시각도 날짜까지만) —
--    데스크에서 번호를 확인해도 그 손님이 어떤 답을 했는지 알 수 없게 한다.
CREATE TABLE IF NOT EXISTS public.survey_gift_codes (
  code        TEXT        PRIMARY KEY CHECK (code ~ '^[2-9A-HJ-NP-Z]{6}$'),
  issued_on   DATE        NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Seoul')::date,
  redeemed_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS survey_gift_codes_issued_on_idx
  ON public.survey_gift_codes (issued_on DESC);

COMMENT ON TABLE public.survey_gift_codes IS
  '설문 답례품 번호. 응답과 연결하지 않는다(익명 유지). redeemed_at = 데스크에서 「드림」을 누른 시각.';

-- 3) RLS: 공개(anon) 접근 없음. 서비스 롤(API)만 읽고 쓴다.
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_gift_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to survey_responses" ON public.survey_responses;
CREATE POLICY "Service role full access to survey_responses"
  ON public.survey_responses FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to survey_gift_codes" ON public.survey_gift_codes;
CREATE POLICY "Service role full access to survey_gift_codes"
  ON public.survey_gift_codes FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
