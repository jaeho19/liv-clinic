-- ============================================
-- 042: 라이브채팅 "연락처 먼저" 1단계
-- 설계: docs/superpowers/specs/2026-10-01-chat-contact-first-design.md §5
-- 전부 추가형·멱등. 트리거·인덱스·정책·publication 변경 없음.
-- 코드 배포보다 먼저 적용한다 (적용 전에 코드가 나가면 요약·클릭 기록·번역본 게시·이벤트 안내가 경고만 남기고 실패한다).
-- ============================================
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS followup_digest_at        TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS visitor_messenger_clicked TEXT NULL
    CHECK (visitor_messenger_clicked IS NULL OR char_length(visitor_messenger_clicked) <= 20),
  ADD COLUMN IF NOT EXISTS event_hint_at             TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.chat_sessions.followup_digest_at IS
  '"오늘 연락할 손님" 요약에 마지막으로 오른 시각. 요약 창 시작보다 이전이면 다시 오른다';
COMMENT ON COLUMN public.chat_sessions.visitor_messenger_clicked IS
  '손님이 카드에서 마지막으로 누른 단추(whatsapp/wechat/line/email). 연락처가 아니다 — 측정과 번역본 게시 대상 판정에 쓴다';
COMMENT ON COLUMN public.chat_sessions.event_hint_at IS
  '가격 문의에 이벤트 안내(프로모션 링크)를 마지막으로 보낸 시각. 12시간이 지나야 다시 보낸다';
