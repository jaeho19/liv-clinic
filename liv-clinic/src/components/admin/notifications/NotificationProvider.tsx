'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useChatNotifications, type ToastPayload } from '@/hooks/useChatNotifications';
import { readSoundEnabled, writeSoundEnabled } from '@/lib/chat/notificationStore';
import { ToastStack } from './ToastStack';

const MAX_TOASTS = 3;
const TOAST_TTL_MS = 5000;
// public/sounds/notification.wav (Python 생성, 43KB). mp3 fallback도 가능 (browser sniffs content)
const SOUND_FILE = '/sounds/notification.wav';
const IS_DEV = process.env.NODE_ENV !== 'production';

function debug(...args: unknown[]): void {
  if (IS_DEV) {
    console.log('[notif-provider]', ...args);
  }
}

export interface ToastItem extends ToastPayload {
  id: string;
  createdAt: number;
}

export interface NotificationContextValue {
  totalUnread: number;
  soundEnabled: boolean;
  toggleSound: () => Promise<void>;
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

function extractSessionIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/admin\/chat\/([^/?#]+)/);
  return m ? m[1] : null;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Web Audio API 비프 — 정적 파일 의존성 없는 신뢰성 높은 fallback.
 * AudioContext는 사용자 인터랙션 후 resume 필요.
 */
function playWebAudioBeep(ctx: AudioContext): void {
  try {
    const now = ctx.currentTime;
    const duration = 0.5;
    const freqs = [880, 1318.51]; // A5 + E6 major third

    for (const f of freqs) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    }
  } catch (e) {
    debug('web audio beep failed:', e);
  }
}

type AudioCtxConstructor = typeof AudioContext;

function getAudioContextCtor(): AudioCtxConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: AudioCtxConstructor; webkitAudioContext?: AudioCtxConstructor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const currentSessionId = extractSessionIdFromPath(pathname);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioLoadFailedRef = useRef(false);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>('default');
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // 1. 초기 로드 (SSR safe)
  useEffect(() => {
    setSoundEnabled(readSoundEnabled());
    if (typeof Notification !== 'undefined') {
      setNotifPerm(Notification.permission);
      debug('mount: Notification.permission =', Notification.permission);
    } else {
      debug('mount: Notification API unavailable');
    }
  }, []);

  // 2. soundEnabled 변경 시 audio unlock / AudioContext 준비
  useEffect(() => {
    if (!soundEnabled) {
      audioRef.current = null;
      // AudioContext는 keep — resume 가능 상태로
      return;
    }
    if (typeof Audio === 'undefined') return;

    // 2a. HTMLAudio 파일 로드 시도
    const audio = new Audio(SOUND_FILE);
    audio.volume = 0.6;
    audio.preload = 'auto';
    audio.addEventListener('error', () => {
      audioLoadFailedRef.current = true;
      debug('audio file load failed — fallback to Web Audio API');
    });
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        debug('audio unlock success');
      })
      .catch((e) => {
        debug('audio unlock blocked or file missing:', e?.message ?? e);
      });
    audioRef.current = audio;

    // 2b. AudioContext도 함께 준비 (file load 실패 시 fallback)
    const Ctor = getAudioContextCtor();
    if (Ctor && !audioCtxRef.current) {
      try {
        audioCtxRef.current = new Ctor();
        // suspended 상태이면 resume (사용자 인터랙션 안에서 호출되어야 함)
        if (audioCtxRef.current.state === 'suspended') {
          void audioCtxRef.current.resume().catch(() => {});
        }
        debug('AudioContext created, state:', audioCtxRef.current.state);
      } catch (e) {
        debug('AudioContext creation failed:', e);
      }
    }
  }, [soundEnabled]);

  const playSound = useCallback(() => {
    if (!soundEnabled) {
      debug('playSound skipped (soundEnabled=false)');
      return;
    }
    // 우선: HTMLAudio (사용자 자신의 mp3로 교체 가능)
    const a = audioRef.current;
    if (a && !audioLoadFailedRef.current) {
      a.currentTime = 0;
      a.play().catch((e) => {
        debug('audio play failed → fallback web audio:', e?.message ?? e);
        if (audioCtxRef.current) playWebAudioBeep(audioCtxRef.current);
      });
      return;
    }
    // Fallback: Web Audio API
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        void audioCtxRef.current.resume().catch(() => {});
      }
      playWebAudioBeep(audioCtxRef.current);
    } else {
      debug('no audio source available');
    }
  }, [soundEnabled]);

  const pushToast = useCallback((item: ToastPayload) => {
    debug('pushToast:', item.sessionId, item.preview.slice(0, 30));
    setToasts((prev) => {
      const existingIdx = prev.findIndex((t) => t.sessionId === item.sessionId);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          ...item,
          createdAt: Date.now(),
        };
        return updated;
      }
      const next: ToastItem = {
        ...item,
        id: generateId(),
        createdAt: Date.now(),
      };
      const merged = [...prev, next];
      return merged.slice(-MAX_TOASTS);
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 3. 토스트 자동 dismiss (5초 후 가장 오래된 것부터)
  useEffect(() => {
    if (toasts.length === 0) return;
    const oldest = toasts[0];
    const elapsed = Date.now() - oldest.createdAt;
    const remaining = Math.max(0, TOAST_TTL_MS - elapsed);
    const t = setTimeout(() => dismissToast(oldest.id), remaining);
    return () => clearTimeout(t);
  }, [toasts, dismissToast]);

  const showOsNotification = useCallback(
    (title: string, body: string, sessionId: string) => {
      if (typeof Notification === 'undefined') {
        debug('OS notif skipped: Notification API unavailable');
        return;
      }
      if (Notification.permission !== 'granted') {
        debug('OS notif skipped: permission =', Notification.permission);
        return;
      }
      if (typeof document === 'undefined' || !document.hidden) {
        debug('OS notif skipped: tab is visible');
        return;
      }
      try {
        const n = new Notification(title, {
          body,
          tag: `chat-${sessionId}`,
          icon: '/icons/icon-192.png',
        });
        n.onclick = () => {
          window.focus();
          router.push(`/admin/chat/${sessionId}`);
          n.close();
        };
        debug('OS notif shown:', sessionId);
      } catch (e) {
        debug('OS notif throw:', e);
      }
    },
    [router]
  );

  const originalTitleRef = useRef<string>('LIV 관리자');

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const current = document.title;
    const stripped = current.replace(/^\(\d+\)\s*/, '');
    originalTitleRef.current = stripped || 'LIV 관리자';
  }, []);

  const setTabUnread = useCallback((count: number) => {
    if (typeof document === 'undefined') return;
    if (count === 0) {
      document.title = originalTitleRef.current;
    } else {
      document.title = `(${count}) ${originalTitleRef.current}`;
    }
  }, []);

  const { totalUnread } = useChatNotifications({
    currentSessionId,
    playSound,
    pushToast,
    showOsNotification,
    setTabUnread,
  });

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof Notification === 'undefined') return 'denied';
    if (Notification.permission !== 'default') {
      // 이미 결정된 상태 — 상태 동기화만
      setNotifPerm(Notification.permission);
      debug('permission already decided:', Notification.permission);
      return Notification.permission;
    }
    try {
      debug('requesting Notification permission...');
      const result = await Notification.requestPermission();
      setNotifPerm(result);
      debug('permission result:', result);
      return result;
    } catch (e) {
      debug('requestPermission threw:', e);
      return 'denied';
    }
  }, []);

  const toggleSound = useCallback(async (): Promise<void> => {
    // 다음 상태 계산
    const nextSoundEnabled = !soundEnabled;
    setSoundEnabled(nextSoundEnabled);
    writeSoundEnabled(nextSoundEnabled);
    debug('toggleSound:', soundEnabled, '→', nextSoundEnabled);

    // 켤 때 OS 알림 권한도 함께 요청 (default 상태일 때만; 사용자 인터랙션 안에서 호출)
    if (nextSoundEnabled) {
      await requestNotificationPermission();
    }
  }, [soundEnabled, requestNotificationPermission]);

  const value: NotificationContextValue = {
    totalUnread,
    soundEnabled,
    toggleSound,
    notificationPermission: notifPerm,
    requestNotificationPermission,
    toasts,
    dismissToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastStack />
    </NotificationContext.Provider>
  );
}
