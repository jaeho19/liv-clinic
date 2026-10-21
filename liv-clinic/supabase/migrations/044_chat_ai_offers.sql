-- 044: 라이브채팅 AI "제안형 응대" — 기록 컬럼 (스펙 2026-10-12 chat-ai-guided-offers §0.2 · §4.8)
-- 043(AI 1차 응대) 뒤에 적용한다. 추가형 · 멱등이다(다시 돌려도 된다). 코드를 배포하기 전에 적용한다 —
-- AI 응대는 CHAT_AI_OFFERS 가 꺼져 있어도 이 컬럼을 읽고 쓴다(꺼져 있으면 비어 있는 값).
--
-- 제안 상태(첫 답인가 · 무엇을 보였나 · 거절했나)는 세션 컬럼이 아니라 chat_ai_turns 에서 계산한다.
-- 꼬리표 번호(C01 · P031)는 날마다 바뀌므로 자료의 key 로 남긴다.

-- 1) AI 호출 기록
ALTER TABLE public.chat_ai_turns
  -- 이 답에 나간 가격 줄 · 제안 줄의 key, 혜택 문장은 'benefit', 가예약 요약 아래 혜택 줄은 'benefit-line'
  ADD COLUMN IF NOT EXISTS shown_keys     TEXT[]  NULL,
  -- AI가 읽은 손님 반응 (R1 관심 · R2 가격 부담 · R3 흥정 · R4 유보 · R5 거절 · R6 의료 · R7 예약 분명)
  ADD COLUMN IF NOT EXISTS reaction       TEXT    NULL CHECK (reaction IS NULL OR reaction IN ('R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7')),
  -- 손님이 제안을 거절했다 — 이 대화에서 더 제안하지 않는다
  ADD COLUMN IF NOT EXISTS offer_declined BOOLEAN NOT NULL DEFAULT false,
  -- 상한 · 첫 답 · 거절 때문에 지운 꼬리표 — 'C03:first_reply' 꼴
  ADD COLUMN IF NOT EXISTS offers_dropped TEXT[]  NULL;

-- 2) 가예약 — 손님에게 안내한 채팅 예약 혜택
--    full = 5% + (그날 결제 30만 원 이상이면) 피부관리 또는 수액 1회, five = 5%만(체험가만 안내했거나 제안형 응대가 꺼짐)
ALTER TABLE public.chat_bookings
  ADD COLUMN IF NOT EXISTS benefit TEXT NULL CHECK (benefit IS NULL OR benefit IN ('five', 'full'));

-- 3) 코멘트
COMMENT ON COLUMN public.chat_ai_turns.shown_keys IS
  '이 답에 나간 가격 줄 · 제안 줄의 key (benefit = 혜택 문장, benefit-line = 가예약 요약 아래 혜택 줄). 제안 상한은 이 값으로 센다';
COMMENT ON COLUMN public.chat_ai_turns.reaction IS
  'AI가 읽은 손님 반응 R1~R7 (제안형 응대). 켠 뒤 점검에서 판정이 맞았는지 본다';
COMMENT ON COLUMN public.chat_ai_turns.offer_declined IS
  '손님이 제안을 거절했다 — 이 대화(보관 뒤 재방문 포함)에서는 더 제안하지 않는다';
COMMENT ON COLUMN public.chat_ai_turns.offers_dropped IS
  '프로그램이 지운 제안 · 혜택 꼬리표와 이유 (C03:first_reply 등)';
COMMENT ON COLUMN public.chat_bookings.benefit IS
  '손님에게 안내한 채팅 예약 혜택: full = 5% + 피부관리 또는 수액 1회(그날 결제 30만 원 이상, 체험가 제외), five = 5%만';
