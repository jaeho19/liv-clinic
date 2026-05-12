-- ============================================
-- 030: REPLICA IDENTITY FULL for chat tables
-- - admin-chat-notification Design §5.2 요구사항
-- - chat_sessions UPDATE 이벤트의 payload.new에 unread_admin_count, status,
--   visitor_name, visitor_locale 등 full row를 포함시키기 위함
-- - chat_messages INSERT는 default(PK)로 충분하지만 일관성·향후 UPDATE 대비 FULL로 통일
-- - WAL 크기는 chat 트래픽 규모(저빈도)에서 무시 가능
-- ============================================

ALTER TABLE public.chat_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- 검증용 코멘트
COMMENT ON TABLE public.chat_sessions IS 'Realtime translation chat: visitor sessions (en/ja/zh only). REPLICA IDENTITY FULL for admin-chat-notification (030)';
COMMENT ON TABLE public.chat_messages IS 'Realtime translation chat: messages with original + translated text columns. REPLICA IDENTITY FULL for admin-chat-notification (030)';
