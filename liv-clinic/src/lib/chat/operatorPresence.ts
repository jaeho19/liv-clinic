import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';

const HEARTBEAT_TIMEOUT_SECONDS = 90;

/**
 * 최근 90초 이내 heartbeat을 보낸 운영자 수.
 * service_role로 chat_operator_status 카운트.
 */
export async function getOnlineOperatorCount(): Promise<number> {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - HEARTBEAT_TIMEOUT_SECONDS * 1000).toISOString();
  const { count, error } = await supabase
    .from('chat_operator_status')
    .select('operator_id', { count: 'exact', head: true })
    .gt('last_seen_at', cutoff);
  if (error) {
    throw new Error(`presence_query_failed:${error.code ?? 'unknown'}`);
  }
  return count ?? 0;
}
