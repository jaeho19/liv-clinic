import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * 운영자가 어드민 페이지에 머무는 동안 60초마다 호출.
 * Throw-free: upsert 실패해도 어드민 작업 차단 금지.
 */
export async function markOperatorOnline(
  supabase: SupabaseClient<Database>,
  operatorId: string,
): Promise<void> {
  const { error } = await supabase
    .from('chat_operator_status')
    .upsert(
      {
        operator_id: operatorId,
        last_seen_at: new Date().toISOString(),
        status: 'online',
      },
      { onConflict: 'operator_id' },
    );
  if (error) {
    console.warn('[chat] heartbeat upsert failed:', error.code ?? 'unknown');
  }
}
