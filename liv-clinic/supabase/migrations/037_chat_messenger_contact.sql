-- ============================================
-- 037: 오프시간 메신저 브리지 — 방문자 메신저 연락처
-- 채널 값은 API 레벨에서 검증 (whatsapp/wechat/line).
-- DB CHECK로 채널 enum을 고정하지 않는다 — Telegram/Zalo 등 확장 대비.
-- ============================================
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS visitor_messenger_channel TEXT NULL
    CHECK (visitor_messenger_channel IS NULL OR char_length(visitor_messenger_channel) <= 20),
  ADD COLUMN IF NOT EXISTS visitor_messenger_handle TEXT NULL
    CHECK (visitor_messenger_handle IS NULL OR char_length(visitor_messenger_handle) <= 100);

COMMENT ON COLUMN public.chat_sessions.visitor_messenger_channel IS 'Messenger the visitor left for proactive outreach (whatsapp/wechat/line — validated at API level)';
COMMENT ON COLUMN public.chat_sessions.visitor_messenger_handle IS 'Visitor messenger number/ID for staff-initiated contact during business hours';
