-- 032: Widen chat locale CHECK constraints to match app-level VISITOR_LOCALES
-- (en/ja/zh/fr/mn/ar). The chat widget mounts for 6 locales but 028 only
-- allowed en/ja/zh, so fr/mn/ar visitors hit 23514 on session/message insert.

ALTER TABLE chat_sessions
  DROP CONSTRAINT chat_sessions_visitor_locale_check;
ALTER TABLE chat_sessions
  ADD CONSTRAINT chat_sessions_visitor_locale_check
  CHECK (visitor_locale IN ('en', 'ja', 'zh', 'fr', 'mn', 'ar'));

ALTER TABLE chat_messages
  DROP CONSTRAINT chat_messages_original_lang_check;
ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_original_lang_check
  CHECK (original_lang IN ('ko', 'en', 'ja', 'zh', 'fr', 'mn', 'ar'));

ALTER TABLE chat_messages
  DROP CONSTRAINT chat_messages_translated_lang_check;
ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_translated_lang_check
  CHECK (translated_lang IS NULL OR translated_lang IN ('ko', 'en', 'ja', 'zh', 'fr', 'mn', 'ar'));
