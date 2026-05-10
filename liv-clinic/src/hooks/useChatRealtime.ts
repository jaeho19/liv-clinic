'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { fetchVisitorMessages, type ChatMessage } from '@/lib/chat/chatApi';

interface UseChatRealtimeArgs {
  sessionId: string | null;
  sessionToken: string | null;
  enabled: boolean;
}

interface UseChatRealtimeReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  appendOptimistic: (msg: ChatMessage) => void;
  refresh: () => Promise<void>;
}

// Visitor 측 Realtime: Broadcast 채널 chat:{sessionId} 구독.
// 서버가 INSERT 후 broadcast.send → 위젯이 'message_created' 이벤트 수신 → /api/chat/messages?since=… 로 새 메시지 fetch
// (단순화를 위해 broadcast payload만으로 갱신하지 않고 항상 since fetch — 1개 메시지만 들어오므로 비용 미미)
export function useChatRealtime(args: UseChatRealtimeArgs): UseChatRealtimeReturn {
  const { sessionId, sessionToken, enabled } = args;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedAtRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const since = lastFetchedAtRef.current ?? undefined;
      const fetched = await fetchVisitorMessages(sessionToken, since);
      if (fetched.length > 0) {
        setMessages((prev) => {
          // 중복 제거: id 기준 dedupe
          const existing = new Set(prev.map((m) => m.id));
          const merged = [...prev];
          for (const m of fetched) {
            if (!existing.has(m.id)) merged.push(m);
          }
          merged.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
          return merged;
        });
        lastFetchedAtRef.current = fetched[fetched.length - 1].created_at;
      } else if (lastFetchedAtRef.current === null) {
        // 최초 진입 시 빈 결과여도 watermark 초기화
        lastFetchedAtRef.current = new Date(0).toISOString();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'fetch_failed');
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  // 최초 fetch (세션 변경 시 상태 리셋 — 기존 useShotTracking 등과 동일 패턴)
  useEffect(() => {
    if (!enabled || !sessionToken) return;
    lastFetchedAtRef.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages([]);
    void refresh();
  }, [enabled, sessionToken, refresh]);

  // Realtime 구독
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const supabase = createClient();
    const channel = supabase.channel(`chat:${sessionId}`, {
      config: { broadcast: { self: false } },
    });

    channel.on('broadcast', { event: 'message_created' }, () => {
      void refresh();
    });

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, sessionId, refresh]);

  const appendOptimistic = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      const next = [...prev, msg];
      next.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
      return next;
    });
    lastFetchedAtRef.current = msg.created_at;
  }, []);

  return { messages, loading, error, appendOptimistic, refresh };
}
