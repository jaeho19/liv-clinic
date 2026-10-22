-- 045: 라이브채팅 AI 응대 — 대화가 멈췄을 때의 요약을 어디까지 올렸는가 (스펙 2026-10-22 chat-ai-slack-transcript §2 · §3)
-- 043 · 044 뒤에 적용한다. 추가형 · 멱등이다(다시 돌려도 된다). 코드를 배포하기 전에 적용한다 —
-- 없으면 운영 작업의 요약 단계가 조회에 실패해 건너뛸 뿐 다른 운영 작업은 그대로다.
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS ai_summary_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.chat_sessions.ai_summary_at IS
  'AI 응대 요약을 어디까지 올렸는가 — 요약한 구간의 끝(그때의 last_message_at). 운영 작업이 조건부 UPDATE 로 선점한다';
