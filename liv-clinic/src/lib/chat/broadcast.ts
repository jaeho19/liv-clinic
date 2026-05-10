import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';

// 방문자에게 메시지 도달을 알리기 위한 Realtime Broadcast 채널 발신.
// 채널명은 session_id(UUID) 단위로 격리. 운영자는 postgres_changes로 직접 구독하므로 broadcast 의존 없음.

export type BroadcastEvent =
  | { type: 'message_created'; payload: { messageId: string; sender?: 'visitor' | 'operator' | 'system' } }
  | { type: 'session_closed'; payload: { sessionId: string } };

export async function broadcastToSession(sessionId: string, event: BroadcastEvent) {
  try {
    const admin = createAdminClient();
    const channel = admin.channel(`chat:${sessionId}`);
    // service_role 클라이언트의 채널은 RLS 검증 없이 send 가능.
    await channel.send({
      type: 'broadcast',
      event: event.type,
      payload: event.payload,
    });
    // 세션 1회용 채널은 사용 후 정리
    try {
      await admin.removeChannel(channel);
    } catch {
      // ignore
    }
  } catch (e) {
    console.warn('[chat broadcast] failed:', e);
  }
}
