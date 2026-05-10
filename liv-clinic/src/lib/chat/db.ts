import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';

// 028_chat_tables 마이그레이션 후 supabase 자동 생성 타입(`@/types/supabase`)에 chat_sessions/chat_messages가
// 포함되므로 별도 타입 캐스팅 없이 createAdminClient를 그대로 재사용한다.
// 이 파일은 chat 도메인용 헬퍼 시그니처를 모아두는 진입점 역할.

export type ChatLang = 'ko' | 'en' | 'ja' | 'zh';
export type VisitorLang = 'en' | 'ja' | 'zh';
export type SessionStatus = 'open' | 'closed' | 'abandoned';
export type MessageSender = 'visitor' | 'operator' | 'system';
export type TranslationStatus = 'pending' | 'success' | 'failed' | 'skipped';

export type ChatAdminClient = ReturnType<typeof createAdminClient>;

export function createChatAdminClient(): ChatAdminClient {
  return createAdminClient();
}
