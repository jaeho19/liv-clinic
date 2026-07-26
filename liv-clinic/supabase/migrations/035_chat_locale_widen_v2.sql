-- 035: Widen chat locale CHECK constraints to match app-level VISITOR_LOCALES v2
-- (en/ja/zh/zh-TW/vi/th/ru/fr/mn/ar). The chat widget now mounts for every foreign
-- locale but 032 only allowed 6, so zh-TW/vi/th/ru visitors hit 23514 on
-- session/message insert. ko stays out (Korean visitors use the KakaoTalk channel).

ALTER TABLE chat_sessions
  DROP CONSTRAINT chat_sessions_visitor_locale_check;
ALTER TABLE chat_sessions
  ADD CONSTRAINT chat_sessions_visitor_locale_check
  CHECK (visitor_locale IN ('en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'));

ALTER TABLE chat_messages
  DROP CONSTRAINT chat_messages_original_lang_check;
ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_original_lang_check
  CHECK (original_lang IN ('ko', 'en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'));

ALTER TABLE chat_messages
  DROP CONSTRAINT chat_messages_translated_lang_check;
ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_translated_lang_check
  CHECK (translated_lang IS NULL OR translated_lang IN ('ko', 'en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'));
