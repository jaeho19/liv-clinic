'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { markOperatorOnline } from '@/lib/chat/operatorPresence.client';

const HEARTBEAT_INTERVAL_MS = 60_000;

/**
 * 어드민 인증 layout에 마운트하면 60초마다 chat_operator_status에 last_seen_at upsert.
 * presence API가 90초 cutoff로 카운트하여 visitor 위젯에 운영자 온라인 표시.
 *
 * 동작:
 * - 마운트 시 즉시 1회 markOperatorOnline (첫 갱신 지연 회피)
 * - 60초마다 setInterval로 갱신
 * - unmount 시 clearInterval (메모리 누수 방지)
 * - 인증되지 않은 상태에선 no-op
 */
export function useOperatorHeartbeat(): void {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const tick = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;
        if (!userId || cancelled) return;
        await markOperatorOnline(supabase, userId);
      } catch (e) {
        console.warn('[heartbeat] tick failed', e);
      }
    };

    void tick();
    intervalRef.current = setInterval(() => {
      void tick();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
}
