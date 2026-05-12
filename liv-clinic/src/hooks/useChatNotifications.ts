'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

const IS_DEV = process.env.NODE_ENV !== 'production';

function debug(...args: unknown[]): void {
  if (IS_DEV) {
    // eslint-disable-next-line no-console
    console.log('[chat-notif]', ...args);
  }
}

const FLAG_BY_LOCALE: Record<string, string> = {
  en: '🇬🇧',
  ja: '🇯🇵',
  zh: '🇨🇳',
  fr: '🇫🇷',
  mn: '🇲🇳',
  ar: '🇸🇦',
};

interface SessionMeta {
  visitor_name: string | null;
  visitor_locale: string;
}

export interface ToastPayload {
  sessionId: string;
  visitorLabel: string;
  preview: string;
}

export interface UseChatNotificationsArgs {
  currentSessionId: string | null;
  playSound: () => void;
  pushToast: (item: ToastPayload) => void;
  showOsNotification: (title: string, body: string, sessionId: string) => void;
  setTabUnread: (count: number) => void;
}

export interface UseChatNotificationsReturn {
  totalUnread: number;
  ready: boolean;
}

/**
 * 관리자 페이지 전역 채팅 알림 훅.
 * - chat_sessions.unread_admin_count 합계를 단일 소스로 사용
 * - 1개 Supabase 채널에 2개 postgres_changes listener 등록:
 *   A) chat_messages INSERT (sender=visitor) → toast/sound/OS 사이드이펙트
 *   B) chat_sessions UPDATE → countMap 갱신 → totalUnread 재계산
 * - 마운트 시 auth.getSession 부트스트랩 → realtime JWT 보장 → 초기 fetch → 구독
 */
export function useChatNotifications(
  args: UseChatNotificationsArgs
): UseChatNotificationsReturn {
  const { currentSessionId, playSound, pushToast, showOsNotification, setTabUnread } = args;

  const [totalUnread, setTotalUnread] = useState(0);
  const [ready, setReady] = useState(false);

  const countMapRef = useRef<Map<string, number>>(new Map());
  const metaCacheRef = useRef<Map<string, SessionMeta>>(new Map());

  const playSoundRef = useRef(playSound);
  const pushToastRef = useRef(pushToast);
  const showOsRef = useRef(showOsNotification);
  const setTabUnreadRef = useRef(setTabUnread);
  const currentSessionIdRef = useRef(currentSessionId);

  useEffect(() => {
    playSoundRef.current = playSound;
  }, [playSound]);
  useEffect(() => {
    pushToastRef.current = pushToast;
  }, [pushToast]);
  useEffect(() => {
    showOsRef.current = showOsNotification;
  }, [showOsNotification]);
  useEffect(() => {
    setTabUnreadRef.current = setTabUnread;
  }, [setTabUnread]);
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channelRef: ReturnType<typeof supabase.channel> | null = null;

    function recomputeTotal(): void {
      if (cancelled) return;
      let total = 0;
      for (const v of countMapRef.current.values()) total += v;
      setTotalUnread(total);
      setTabUnreadRef.current(total);
    }

    void (async () => {
      // 0. Auth 부트스트랩 — realtime client의 JWT 보장 (RLS 적용 채널 구독 필수)
      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (sessionErr) {
        debug('auth.getSession error:', sessionErr.message);
      }
      if (!session) {
        debug('no auth session — realtime subscription will likely fail with RLS');
      } else {
        debug('auth session ready, user:', session.user.id);
        // realtime accessToken 명시 set (createBrowserClient에서 cookie sync는 자동이지만 안전망)
        try {
          await supabase.realtime.setAuth(session.access_token);
        } catch (e) {
          debug('realtime.setAuth failed:', e);
        }
      }

      // 1. 초기 fetch — open 세션의 미응답 카운트 시드
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id, unread_admin_count, visitor_name, visitor_locale')
        .eq('status', 'open')
        .gt('unread_admin_count', 0);

      if (cancelled) return;
      if (error) {
        debug('initial fetch failed:', error.message);
      } else if (data) {
        for (const row of data as Array<{
          id: string;
          unread_admin_count: number;
          visitor_name: string | null;
          visitor_locale: string;
        }>) {
          countMapRef.current.set(row.id, row.unread_admin_count);
          metaCacheRef.current.set(row.id, {
            visitor_name: row.visitor_name,
            visitor_locale: row.visitor_locale,
          });
        }
        debug(`initial fetch: ${data.length} open session(s) with unread`);
      }
      recomputeTotal();
      setReady(true);

      // 2. Realtime 구독
      const channel = supabase
        .channel('admin-chat-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: 'sender=eq.visitor',
          },
          async (payload) => {
            debug('chat_messages INSERT:', payload.new);
            const m = payload.new as {
              id: string;
              session_id: string;
              original_text: string;
              translated_text: string | null;
            };
            const sid = m.session_id;

            // 보고 있는 세션이면 사이드이펙트 생략
            if (currentSessionIdRef.current === sid) {
              debug('skip side-effects (viewing this session):', sid);
              return;
            }

            // 메타 lookup (캐시 미스 시 1회 fetch)
            let meta = metaCacheRef.current.get(sid);
            if (!meta) {
              const { data: sessionRow } = await supabase
                .from('chat_sessions')
                .select('visitor_name, visitor_locale')
                .eq('id', sid)
                .maybeSingle();
              if (sessionRow) {
                meta = {
                  visitor_name: sessionRow.visitor_name,
                  visitor_locale: sessionRow.visitor_locale,
                };
                metaCacheRef.current.set(sid, meta);
              }
            }
            const flag = FLAG_BY_LOCALE[meta?.visitor_locale ?? ''] ?? '🌐';
            const name = meta?.visitor_name ?? '익명';
            const visitorLabel = `${flag} ${name}`;
            const preview = (m.translated_text ?? m.original_text).slice(0, 80);

            pushToastRef.current({ sessionId: sid, visitorLabel, preview });
            playSoundRef.current();
            showOsRef.current('💬 새 채팅 문의', `${visitorLabel}: ${preview}`, sid);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_sessions',
          },
          (payload) => {
            const s = payload.new as {
              id: string;
              unread_admin_count: number;
              status: string;
              visitor_name: string | null;
              visitor_locale: string;
            };
            debug('chat_sessions UPDATE:', s.id, 'unread=', s.unread_admin_count, 'status=', s.status);

            metaCacheRef.current.set(s.id, {
              visitor_name: s.visitor_name,
              visitor_locale: s.visitor_locale,
            });

            if (s.status !== 'open' || s.unread_admin_count === 0) {
              countMapRef.current.delete(s.id);
            } else {
              countMapRef.current.set(s.id, s.unread_admin_count);
            }
            recomputeTotal();
          }
        )
        .on('system', { event: '*' }, (payload) => {
          debug('system event:', payload);
        })
        .subscribe((status, err) => {
          debug('channel status:', status, err ? `error=${err.message}` : '');
        });

      channelRef = channel;
    })();

    return () => {
      cancelled = true;
      if (channelRef) {
        void supabase.removeChannel(channelRef);
        debug('channel removed (cleanup)');
      }
    };
  }, []);

  return { totalUnread, ready };
}
