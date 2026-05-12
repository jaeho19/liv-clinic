# Design: 관리자 채팅 실시간 알림 (Admin Chat Notification)

> **Feature**: `admin-chat-notification`
> **Phase**: Design
> **Created**: 2026-05-12
> **Plan 참조**: `docs/01-plan/features/admin-chat-notification.plan.md`
> **선행 PDCA**: `realtime-translation-chat` (스키마/Realtime publication/RLS 모두 활용)

> **Plan §8 미해결 질문 확정 사항 (2026-05-12)**:
> 1. **Q1 — 알림음**: `notification.mp3` 정적 파일 사용 (Web Audio API 자체 생성은 음색 제어 어려움). 파일은 `public/sounds/notification.mp3`, 길이 0.5–1초, 50KB 이하, CC0 라이선스.
> 2. **Q2 — 토스트 위치**: 우측 상단 (Plan 확정 그대로).
> 3. **Q3 — 소리 토글 위치**: 사이드바 푸터 (로그아웃 버튼 위, 기존 `useOperatorHeartbeat`과 같은 admin scope). 모바일 헤더에는 미니 아이콘만 노출 (옵션).
> 4. **Q4 — 다중 토스트**: 최대 3개 스택, FIFO (오래된 것 제거). 동일 session_id 연속 도착 시 카운트 갱신만 (스택 추가 X).
> 5. **Q5 — 에스컬레이션**: Out of scope 유지.

---

## 1. 아키텍처 개요 (Architecture Overview)

### 1.1 전체 데이터 흐름

```
┌────────────────────────────────────────────────────────────────┐
│  /admin/(authenticated)/layout.tsx (server, redirect guard)    │
│   └─ <AdminLayoutClient>                                       │
│       └─ <NotificationProvider>           ← 신규 (Context)     │
│           ├─ useOperatorHeartbeat()        (기존)              │
│           ├─ useChatNotifications()        ← 신규 (Realtime)   │
│           │   ├─ Initial unread fetch                          │
│           │   ├─ Subscribe: chat_messages INSERT (visitor)     │
│           │   ├─ Subscribe: chat_sessions UPDATE               │
│           │   └─ Side-effects: toast / sound / OS / title      │
│           ├─ <ToastStack>                  ← 신규              │
│           ├─ <AdminSidebar>                (수정: 뱃지 추가)   │
│           │   └─ <UnreadBadge>             ← 신규              │
│           │   └─ <SoundToggle>             ← 신규 (푸터)       │
│           └─ {children}  (각 admin 페이지)                     │
└────────────────────────────────────────────────────────────────┘
                              │
                              │ supabase-js Realtime WebSocket
                              ▼
┌────────────────────────────────────────────────────────────────┐
│  Supabase Postgres                                             │
│  - chat_messages       (INSERT 시 트리거 → unread_admin_count++)│
│  - chat_sessions       (unread_admin_count, last_message_at)    │
│  - supabase_realtime publication (028 마이그레이션에 등록됨)    │
│  - RLS: authenticated 전체 SELECT 허용                          │
└────────────────────────────────────────────────────────────────┘
```

### 1.2 카운트 소스 오브 트루스

**`chat_sessions.unread_admin_count`** 컬럼을 단일 소스로 사용한다.

| 이벤트 | DB 동작 | 클라이언트 동작 |
|--------|--------|----------------|
| 방문자 메시지 INSERT | `unread_admin_count++` (트리거) | `chat_sessions UPDATE` 이벤트 수신 → counter map 갱신 |
| 운영자 메시지 INSERT (응답) | `unread_admin_count=0` (트리거) | `chat_sessions UPDATE` 이벤트 수신 → counter map 갱신 |
| 세션 종료 (status='closed') | (변경 없음 — 기존 카운트 유지) | `WHERE status='open'` 필터로 자동 제외 |

**Total Unread** = `Σ chat_sessions.unread_admin_count WHERE status='open'`

> 별도 read-tracking 테이블 / localStorage가 불필요. 트리거가 모든 것을 처리하고, 어드민이 채팅방을 열어 답장하면 자동으로 0이 된다.

### 1.3 두 개의 Realtime 구독 (단일 채널)

하나의 Supabase 채널(`admin-chat-notifications`)에 두 개의 `postgres_changes` listener를 등록한다:

```ts
const channel = supabase
  .channel('admin-chat-notifications')
  // Listener A: 새 방문자 메시지 → toast/sound/OS/title 사이드이펙트용
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    filter: 'sender=eq.visitor',
  }, handleNewVisitorMessage)
  // Listener B: 세션 unread_admin_count 변동 → 뱃지 카운트 갱신
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'chat_sessions',
  }, handleSessionUpdate)
  .subscribe();
```

**왜 두 개 모두 필요한가?**
- Listener A만으로는 *방문자 메시지 도착*은 알지만 *어드민이 다른 탭에서 응답해 카운트가 0이 된 사건*은 모름 → 뱃지가 stale 됨
- Listener B만으로는 *카운트는 알지만 메시지 본문(toast 미리보기)*을 모름 → INSERT 페이로드 필요
- 단일 채널에 합치면 WebSocket 연결 1개로 둘 다 처리

---

## 2. 컴포넌트/모듈 구조 (Component & Module Structure)

### 2.1 신규/수정 파일 트리

```
liv-clinic/
├─ public/
│  └─ sounds/
│     └─ notification.mp3                        ★ 신규 (정적 에셋)
├─ src/
│  ├─ app/
│  │  └─ admin/(authenticated)/
│  │     └─ layout.tsx                           (변경 없음 — AdminLayoutClient가 처리)
│  ├─ components/
│  │  ├─ admin/
│  │  │  ├─ AdminLayoutClient.tsx                ◇ 수정 (NotificationProvider wrap)
│  │  │  ├─ AdminSidebar.tsx                     ◇ 수정 (UnreadBadge, SoundToggle 삽입)
│  │  │  └─ notifications/                       ★ 신규 폴더
│  │  │     ├─ NotificationProvider.tsx          ★ 신규 (Context)
│  │  │     ├─ ToastStack.tsx                    ★ 신규 (토스트 렌더)
│  │  │     ├─ UnreadBadge.tsx                   ★ 신규 (사이드바용 뱃지)
│  │  │     └─ SoundToggle.tsx                   ★ 신규 (소리 ON/OFF 버튼)
│  │  └─ ... (기존)
│  ├─ hooks/
│  │  └─ useChatNotifications.ts                 ★ 신규 (Realtime + 사이드이펙트)
│  └─ lib/
│     └─ chat/
│        └─ notificationStore.ts                 ★ 신규 (localStorage helpers, 작음)
└─ __tests__/                                    (또는 src/__tests__/)
   └─ useChatNotifications.test.ts               ★ 신규 (Vitest)
```

**범례**: ★ 신규 · ◇ 수정 · (변경 없음)

### 2.2 Context API

```ts
// src/components/admin/notifications/NotificationProvider.tsx

interface NotificationContextValue {
  /** 전체 미응답 합계 (Σ unread_admin_count WHERE status='open') */
  totalUnread: number;

  /** 소리 알림 활성 상태 (localStorage 영속화) */
  soundEnabled: boolean;
  toggleSound: () => void;

  /** OS 알림 권한 상태 */
  notificationPermission: NotificationPermission; // 'default' | 'granted' | 'denied'
  requestNotificationPermission: () => Promise<void>;

  /** 현재 활성화된 토스트 리스트 (최대 3) */
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
}

interface ToastItem {
  id: string;             // uuid v4
  sessionId: string;
  visitorLabel: string;   // "🇯🇵 방문자(익명)" 또는 visitor_name
  preview: string;        // translated_text || original_text, ≤80자
  createdAt: number;      // Date.now() (auto-dismiss 타이머용)
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
```

### 2.3 핵심 훅 시그니처

```ts
// src/hooks/useChatNotifications.ts

interface UseChatNotificationsArgs {
  /** 현재 보고 있는 세션 id (소리/토스트 무음 처리용). 채팅방 페이지 외에는 null. */
  currentSessionId: string | null;

  /** 소리 재생 trigger (NotificationProvider가 audio unlock 상태 관리) */
  playSound: () => void;

  /** 토스트 push 함수 */
  pushToast: (item: Omit<ToastItem, 'id' | 'createdAt'>) => void;

  /** 브라우저 알림 trigger */
  showOsNotification: (title: string, body: string, sessionId: string) => void;

  /** 탭 타이틀 미응답 카운트 업데이트 */
  setTabUnread: (count: number) => void;
}

interface UseChatNotificationsReturn {
  totalUnread: number;
  ready: boolean;     // 초기 fetch 완료
}

export function useChatNotifications(args: UseChatNotificationsArgs): UseChatNotificationsReturn;
```

---

## 3. 상세 동작 시퀀스 (Detailed Sequences)

### 3.1 초기 마운트 (Initial Mount)

```
1. NotificationProvider 마운트 (어드민 페이지 진입)
2. localStorage.admin_chat_sound_enabled 읽기 → soundEnabled state 초기화 (기본 false)
3. Notification.permission 읽기 → notificationPermission state 초기화
4. useChatNotifications 훅 mount
5. 초기 fetch:
     supabase
       .from('chat_sessions')
       .select('id, unread_admin_count, visitor_name, visitor_locale, last_message_at')
       .eq('status', 'open')
       .gt('unread_admin_count', 0);
   → countMap: Map<sessionId, unread_admin_count>
   → sessionMetaCache: Map<sessionId, {visitor_name, visitor_locale}>
   → totalUnread = Σ values
6. Realtime channel 구독 시작
7. tabUnread 동기화 → document.title 업데이트
```

### 3.2 방문자 메시지 도착 (New Visitor Message)

```
[Postgres trigger]
chat_messages INSERT (sender='visitor') → chat_sessions.unread_admin_count++

[Realtime broadcast: 두 이벤트 거의 동시 발생]

Listener A (chat_messages INSERT):
  payload.new = { id, session_id, sender='visitor', original_text, translated_text, original_lang, ... }
  ├─ sessionMetaCache 조회 → visitor_name/locale 없으면 .from('chat_sessions').select() 1회 lookup
  ├─ 음소거 조건 확인:
  │    if (currentSessionId === payload.new.session_id) return;  // 보고 있으면 사이드이펙트 생략
  ├─ pushToast({sessionId, visitorLabel: `${flag} ${visitor_name || '익명'}`,
  │             preview: (translated_text ?? original_text).slice(0,80)})
  ├─ playSound()         // soundEnabled && audioUnlocked일 때만 실제 재생
  └─ showOsNotification('💬 새 채팅 문의', preview, sessionId)
                          // document.hidden && permission==='granted'일 때만

Listener B (chat_sessions UPDATE):
  payload.new = { id, unread_admin_count, status, ... }
  ├─ if (status !== 'open') {
  │    countMap.delete(id);
  │  } else if (unread_admin_count === 0) {
  │    countMap.delete(id);
  │  } else {
  │    countMap.set(id, unread_admin_count);
  │  }
  ├─ totalUnread = Σ countMap.values()
  ├─ setTabUnread(totalUnread)
  └─ Context 리렌더링 → UnreadBadge 업데이트
```

### 3.3 어드민이 채팅방 진입/응답 (Read & Reply)

```
[어드민 navigates to /admin/chat/abc-123]
1. ChatDetailClient 마운트 → 자체 Realtime 구독 (기존 코드)
2. 어드민이 응답 메시지 INSERT (sender='operator')
3. Postgres 트리거: chat_sessions.unread_admin_count = 0
4. Listener B(NotificationProvider 측) 수신 → countMap.delete('abc-123') → totalUnread 감소
5. 사이드바 뱃지 자동 감소
6. document.title 자동 복귀

** 참고 **: 어드민이 채팅방 진입만 해도 카운트가 줄지는 않음.
어드민이 메시지를 1개라도 보내야 트리거가 발화함.
이는 의도된 동작 (실제 응답 시점이 SLA 측정 기준).
```

### 3.4 사운드 토글 (Sound Toggle)

```
[SoundToggle.tsx click]
1. 현재 상태 반전 (soundEnabled → !soundEnabled)
2. localStorage.setItem('admin_chat_sound_enabled', String(next))
3. next === true 일 때 **Audio unlock 수행**:
     a. audioRef.current = new Audio('/sounds/notification.mp3')
     b. audioRef.current.volume = 0.6
     c. audioRef.current.play().then(() => audioRef.current.pause()).catch(noop)
        // 첫 사용자 인터랙션 동안 재생 시도 → 이후 무음 재생 차단 회피
     d. audioRef.current.currentTime = 0
4. next === false 일 때:
     audioRef.current = null  (다음 알림에서 재생 안 함)
```

### 3.5 OS 알림 권한 요청 (Permission Flow)

```
- 자동 요청 금지 (사용자 액션 없이 요청 시 브라우저가 차단할 수 있음)
- 트리거 위치:
  1. SoundToggle을 처음 ON으로 켤 때 (이미 사용자 액션)
  2. 사이드바에 `🔔 권한 요청` 별도 버튼 노출 (permission='default'일 때만)
- 호출:
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      setNotificationPermission(result);
    }
- 'denied' 일 경우 안내 토스트 1회 표시: "OS 알림이 비활성화되었습니다. 토스트와 소리는 계속 동작합니다."
```

### 3.6 탭 타이틀 깜빡임 (Tab Title)

```ts
// 단순화: 깜빡임(blink) 대신 정적 카운트 표시 (UX/접근성 우월)
const originalTitle = useRef('LIV 관리자');

useEffect(() => {
  if (totalUnread === 0) {
    document.title = originalTitle.current;
  } else {
    document.title = `(${totalUnread}) ${originalTitle.current}`;
  }
}, [totalUnread]);

// 페이지 포커스 복귀 시 별도 처리 불필요
// (totalUnread가 0이 되면 자연스럽게 원복)
```

> 요청서 §6 "탭 타이틀 깜빡임"은 점멸(blink) 대신 카운트 표기로 구현. 점멸은 접근성(전정 장애 / WCAG 2.3.1)·OS 화면 캡처 시 산만함 이슈가 있어 LIV 디자인 톤(precision, calm)에 부적합. 카운트 표기만으로 충분히 인지 가능.

---

## 4. 컴포넌트 인터페이스 (Component Interfaces)

### 4.1 NotificationProvider.tsx

```tsx
'use client';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useChatNotifications } from '@/hooks/useChatNotifications';
import { ToastStack } from './ToastStack';
import { readSoundEnabled, writeSoundEnabled } from '@/lib/chat/notificationStore';

const MAX_TOASTS = 3;
const TOAST_TTL_MS = 5000;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentSessionId = extractSessionIdFromPath(pathname); // /admin/chat/[sessionId] 매칭
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>('default');
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // 초기 로드 (SSR safe)
  useEffect(() => {
    setSoundEnabled(readSoundEnabled());
    if (typeof Notification !== 'undefined') setNotifPerm(Notification.permission);
  }, []);

  // soundEnabled 변경 시 audio unlock 또는 해제
  useEffect(() => {
    if (soundEnabled) {
      audioRef.current = new Audio('/sounds/notification.mp3');
      audioRef.current.volume = 0.6;
      audioRef.current.preload = 'auto';
      // 사용자 액션 동안 호출되었다면 unlock 성공
      audioRef.current.play().then(() => audioRef.current?.pause()).catch(() => {});
    } else {
      audioRef.current = null;
    }
  }, [soundEnabled]);

  const playSound = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => {}); // autoplay 거부 시 silent fail
  }, []);

  const pushToast = useCallback((item: Omit<ToastItem, 'id' | 'createdAt'>) => {
    setToasts((prev) => {
      // 같은 session_id 토스트가 이미 있으면 그것의 preview만 갱신
      const existingIdx = prev.findIndex((t) => t.sessionId === item.sessionId);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], ...item, createdAt: Date.now() };
        return updated;
      }
      const next: ToastItem = { ...item, id: crypto.randomUUID(), createdAt: Date.now() };
      const merged = [...prev, next];
      // 최대 3개 유지 (FIFO)
      return merged.slice(-MAX_TOASTS);
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 토스트 자동 dismiss 타이머 (5초)
  useEffect(() => {
    if (toasts.length === 0) return;
    const oldest = toasts[0];
    const elapsed = Date.now() - oldest.createdAt;
    const remaining = Math.max(0, TOAST_TTL_MS - elapsed);
    const t = setTimeout(() => dismissToast(oldest.id), remaining);
    return () => clearTimeout(t);
  }, [toasts, dismissToast]);

  const showOsNotification = useCallback((title: string, body: string, sessionId: string) => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    if (!document.hidden) return; // 탭 포커스 중이면 토스트만으로 충분
    const n = new Notification(title, { body, tag: `chat-${sessionId}`, icon: '/icons/icon-192.png' });
    n.onclick = () => {
      window.focus();
      router.push(`/admin/chat/${sessionId}`);
      n.close();
    };
  }, [router]);

  const setTabUnread = useCallback((count: number) => {
    if (count === 0) document.title = 'LIV 관리자';
    else document.title = `(${count}) LIV 관리자`;
  }, []);

  const { totalUnread } = useChatNotifications({
    currentSessionId,
    playSound,
    pushToast,
    showOsNotification,
    setTabUnread,
  });

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      writeSoundEnabled(next);
      return next;
    });
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'default') return;
    const result = await Notification.requestPermission();
    setNotifPerm(result);
  }, []);

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

function extractSessionIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/admin\/chat\/([^/?#]+)/);
  return m ? m[1] : null;
}
```

### 4.2 useChatNotifications.ts

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

const FLAG_BY_LOCALE: Record<string, string> = {
  en: '🇬🇧', ja: '🇯🇵', zh: '🇨🇳', fr: '🇫🇷', mn: '🇲🇳', ar: '🇸🇦',
};

interface SessionMeta { visitor_name: string | null; visitor_locale: string; }

export function useChatNotifications(args: UseChatNotificationsArgs): UseChatNotificationsReturn {
  const { currentSessionId, playSound, pushToast, showOsNotification, setTabUnread } = args;
  const [totalUnread, setTotalUnread] = useState(0);
  const [ready, setReady] = useState(false);
  const countMapRef = useRef<Map<string, number>>(new Map());
  const metaCacheRef = useRef<Map<string, SessionMeta>>(new Map());
  // currentSessionId를 ref로 보관 → realtime callback closure 갱신 비용 회피
  const currentSessionIdRef = useRef(currentSessionId);
  useEffect(() => { currentSessionIdRef.current = currentSessionId; }, [currentSessionId]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    function recomputeTotal() {
      let total = 0;
      for (const v of countMapRef.current.values()) total += v;
      if (cancelled) return;
      setTotalUnread(total);
      setTabUnread(total);
    }

    // 1. 초기 fetch
    (async () => {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id, unread_admin_count, visitor_name, visitor_locale')
        .eq('status', 'open')
        .gt('unread_admin_count', 0);
      if (error) {
        console.warn('[notif] initial fetch failed', error);
      } else if (data) {
        for (const row of data) {
          countMapRef.current.set(row.id, row.unread_admin_count);
          metaCacheRef.current.set(row.id, {
            visitor_name: row.visitor_name,
            visitor_locale: row.visitor_locale,
          });
        }
      }
      recomputeTotal();
      if (!cancelled) setReady(true);
    })();

    // 2. Realtime
    const channel = supabase
      .channel('admin-chat-notifications')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: 'sender=eq.visitor',
      }, async (payload) => {
        const m = payload.new as {
          id: string; session_id: string;
          original_text: string; translated_text: string | null;
        };
        const sid = m.session_id;
        // 보고 있는 세션이면 사이드이펙트 생략
        if (currentSessionIdRef.current === sid) return;

        // 메타 lookup (캐시 미스 시)
        let meta = metaCacheRef.current.get(sid);
        if (!meta) {
          const { data } = await supabase
            .from('chat_sessions')
            .select('visitor_name, visitor_locale')
            .eq('id', sid)
            .maybeSingle();
          if (data) {
            meta = { visitor_name: data.visitor_name, visitor_locale: data.visitor_locale };
            metaCacheRef.current.set(sid, meta);
          }
        }
        const flag = FLAG_BY_LOCALE[meta?.visitor_locale ?? ''] ?? '🌐';
        const name = meta?.visitor_name ?? '익명';
        const visitorLabel = `${flag} ${name}`;
        const preview = (m.translated_text ?? m.original_text).slice(0, 80);

        pushToast({ sessionId: sid, visitorLabel, preview });
        playSound();
        showOsNotification('💬 새 채팅 문의', `${visitorLabel}: ${preview}`, sid);
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'chat_sessions',
      }, (payload) => {
        const s = payload.new as {
          id: string; unread_admin_count: number; status: string;
          visitor_name: string | null; visitor_locale: string;
        };
        // 메타 캐시 갱신
        metaCacheRef.current.set(s.id, {
          visitor_name: s.visitor_name, visitor_locale: s.visitor_locale,
        });
        if (s.status !== 'open' || s.unread_admin_count === 0) {
          countMapRef.current.delete(s.id);
        } else {
          countMapRef.current.set(s.id, s.unread_admin_count);
        }
        recomputeTotal();
      })
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [pushToast, playSound, showOsNotification, setTabUnread]);

  return { totalUnread, ready };
}
```

### 4.3 ToastStack.tsx

```tsx
'use client';
import Link from 'next/link';
import { useNotifications } from './NotificationProvider';

export function ToastStack() {
  const { toasts, dismissToast } = useNotifications();
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-[90vw] sm:max-w-sm"
      role="region"
      aria-label="새 채팅 알림"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <Link
          key={t.id}
          href={`/admin/chat/${t.sessionId}`}
          onClick={() => dismissToast(t.id)}
          className="group block bg-white border border-[#b4988d]/30 shadow-lg rounded-lg p-3 hover:bg-[#f6f6f6] transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[#b4988d] mb-1">💬 새 채팅 문의</div>
              <div className="text-sm font-medium text-[#6d4e42] truncate">{t.visitorLabel}</div>
              <div className="text-xs text-[#575756] line-clamp-2 mt-0.5">{t.preview}</div>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); dismissToast(t.id); }}
              className="text-[#8a8a8a] hover:text-[#575756] p-1 -m-1"
              aria-label="알림 닫기"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </Link>
      ))}
    </div>
  );
}
```

### 4.4 UnreadBadge.tsx

```tsx
'use client';
import { useNotifications } from './NotificationProvider';

export function UnreadBadge() {
  const { totalUnread } = useNotifications();
  if (totalUnread === 0) return null;
  return (
    <span
      className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-semibold bg-red-500 text-white rounded-full"
      aria-label={`미응답 ${totalUnread}건`}
    >
      {totalUnread > 99 ? '99+' : totalUnread}
    </span>
  );
}
```

### 4.5 SoundToggle.tsx

```tsx
'use client';
import { useNotifications } from './NotificationProvider';

export function SoundToggle() {
  const { soundEnabled, toggleSound, notificationPermission, requestNotificationPermission } = useNotifications();

  const handleClick = async () => {
    toggleSound();
    // 소리를 켤 때, OS 권한이 default이면 함께 요청 (사용자 액션 동안)
    if (!soundEnabled && notificationPermission === 'default') {
      await requestNotificationPermission();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8a8a8a] hover:bg-[#f6f6f6] transition-colors cursor-pointer"
      aria-pressed={soundEnabled}
      aria-label={soundEnabled ? '채팅 알림 소리 끄기' : '채팅 알림 소리 켜기'}
    >
      <span className="text-base">{soundEnabled ? '🔔' : '🔕'}</span>
      {soundEnabled ? '알림 소리 켜짐' : '알림 소리 꺼짐'}
    </button>
  );
}
```

### 4.6 notificationStore.ts

```ts
const SOUND_KEY = 'admin_chat_sound_enabled';

export function readSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SOUND_KEY) === 'true';
  } catch {
    return false;
  }
}

export function writeSoundEnabled(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SOUND_KEY, String(value));
  } catch {
    // privacy mode / quota → silent fail
  }
}
```

### 4.7 AdminSidebar.tsx 변경점 (Diff 개요)

```diff
 const NAV_SECTIONS: NavSection[] = [
   ...
   {
     title: '홈페이지 관리',
     items: [
       ...
-      { href: '/admin/chat', label: '채팅 상담', icon: '💬' },
+      { href: '/admin/chat', label: '채팅 상담', icon: '💬', badge: 'chat-unread' },
       ...
     ],
   },
   ...
 ];
```

```tsx
// 렌더 부분
<Link href={item.href} className="...">
  <span className="text-base">{item.icon}</span>
  <span>{item.label}</span>
  {item.badge === 'chat-unread' && <UnreadBadge />}
</Link>
```

푸터에는 로그아웃 버튼 *위에* `<SoundToggle />` 삽입.

### 4.8 AdminLayoutClient.tsx 변경점

```diff
 import AdminSidebar from './AdminSidebar';
 import { useOperatorHeartbeat } from '@/hooks/useOperatorHeartbeat';
+import { NotificationProvider } from './notifications/NotificationProvider';

 export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
   ...
   useOperatorHeartbeat();

   return (
+    <NotificationProvider>
       <div className="flex min-h-screen">
         <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
         ...
       </div>
+    </NotificationProvider>
   );
 }
```

---

## 5. 데이터/스키마 (Data & Schema)

### 5.1 DB 변경

**없음**. `028_chat_tables.sql` / `029_chat_operator_status.sql`로 이미 모두 준비됨:

- `chat_sessions.unread_admin_count` 컬럼 ✅
- 트리거 `trg_chat_after_message_insert` (자동 증감) ✅
- `supabase_realtime` publication에 `chat_messages`, `chat_sessions` 등록 ✅
- RLS `authenticated`에 SELECT 허용 ✅

### 5.2 Realtime Publication 사전 검증 SQL (Do Phase에서 1회 실행)

```sql
-- chat_sessions UPDATE이 페이로드에 전체 row를 포함하도록 REPLICA IDENTITY 확인
-- (기본 DEFAULT는 PRIMARY KEY만 → unread_admin_count, status 등 필드 누락 가능)
ALTER TABLE public.chat_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
```

> Supabase는 publication 등록 시 자동으로 FULL을 설정하지 않을 수 있다. Do Phase 초반에 위 ALTER 실행 후 `pg_publication_tables` 조회로 확인. **필요 시 030 마이그레이션으로 등록**.

### 5.3 클라이언트 사용 RLS 정책

| 작업 | 정책 (기존 028 마이그레이션) |
|------|--------------------------|
| `SELECT chat_sessions` (초기 fetch) | "Authenticated users can manage chat_sessions" → 허용 |
| `postgres_changes` 구독 | RLS SELECT 권한 기반 → 허용 |
| `INSERT chat_messages` (어드민 응답) | 기존 ChatDetailClient가 `/api/chat/messages` 경유 → 변경 없음 |

---

## 6. 에러 / 폴백 / 엣지 케이스

| 케이스 | 처리 |
|--------|------|
| Realtime WebSocket 끊김 | `@supabase/realtime-js` 자동 재연결. 재연결 후 첫 이벤트가 들어올 때까지 카운트는 stale. **Do 단계에서** `channel.on('system', ...)`로 RECONNECT 감지 시 재fetch 추가 검토 (NFR 영향 미미) |
| 초기 fetch 실패 | `console.warn` 후 빈 map. Realtime은 계속 동작 → 차후 첫 이벤트가 카운트 보정 |
| Notification API 미지원 (Safari 16 이하 등) | `typeof Notification === 'undefined'` 가드 → 토스트/소리만 동작 |
| autoplay 차단 | `audio.play()` Promise reject → silent catch. SoundToggle ON 시 unlock 시도. 사용자가 페이지 어디든 클릭하면 다음 알림부터 정상 |
| localStorage 차단 (private mode) | try/catch silent fail → soundEnabled 항상 false 시작 |
| 매우 긴 visitor_name (60자) | `truncate` CSS로 시각만 자름. 토스트 visitorLabel은 컴포넌트가 처리 |
| 동일 session 토스트 연쇄 도착 | `pushToast` 내에서 같은 sessionId 토스트 있으면 preview만 갱신 (스택 추가 안 함) |
| `currentSessionId` 매칭 후 닫힘 → 다시 새 메시지 | pathname 변경 시 useEffect로 ref 갱신됨 → 정상 알림 |
| status='abandoned'로 강제 종료 | Listener B에서 `status !== 'open'` → 카운트 제거 |
| 어드민 다중 탭 (5명 × 3탭) | 1차는 허용. 후속 PDCA에서 `BroadcastChannel`로 탭 dedup |

---

## 7. 보안 / 권한 (Security & Permissions)

| 검토 항목 | 결과 |
|----------|------|
| Service Role Key 클라이언트 노출 | ❌ 없음 (브라우저는 anon key + RLS authenticated 만 사용) |
| RLS 우회 | ❌ 없음 (기존 028 정책 그대로) |
| XSS via preview | `preview`는 React 기본 escape로 안전. dangerouslySetInnerHTML 미사용 |
| Notification 페이로드 사용자 데이터 | visitor_name, translated_text — 어드민에게만 표시. OS 알림 본문은 다른 사용자에게 노출되지 않음 |
| OS 알림 권한 거부 | 정상 동작, 토스트/소리로 폴백 |
| 사운드 파일 라이선스 | CC0 또는 자체 생성. PR 본문에 출처 명시 (Plan §8 리스크 반영) |
| Realtime 채널 데이터 누설 | RLS가 SELECT 정책을 강제하므로 anon 클라이언트는 구독 불가 |

---

## 8. 테스트 전략 (Test Strategy)

### 8.1 Vitest (단위)

| 파일 | 케이스 |
|------|--------|
| `notificationStore.test.ts` | readSoundEnabled / writeSoundEnabled localStorage 영속화 / privacy mode silent fail |
| `useChatNotifications.test.ts` | mock supabase channel으로 INSERT/UPDATE 페이로드 dispatch → totalUnread 정합성, pushToast/playSound 호출 횟수, currentSessionId 매칭 시 사이드이펙트 생략 검증 |
| `NotificationProvider.test.tsx` | 마운트 시 soundEnabled 초기화, toggleSound localStorage write, toasts 최대 3 유지 |
| `ToastStack.test.tsx` | toasts 0개 → null 렌더, 3개 → 3개 렌더, 닫기 클릭 시 dismissToast 호출 |

### 8.2 수동 검증 (Plan §9 Acceptance Criteria)

1. `npm run dev` → 2개 브라우저(`/`, `/admin/inventory`)
2. 일반 브라우저(`/en`)에서 채팅 위젯 열고 메시지 입력
3. 어드민 브라우저(`/admin/inventory`) — 뱃지/토스트/소리/탭타이틀 확인
4. 토스트 클릭 → `/admin/chat/{sessionId}` 이동 확인
5. 응답 메시지 보내기 → 뱃지·탭타이틀 즉시 감소 확인
6. 소리 토글 OFF → 다음 알림 무음 확인
7. 새로고침 → 토글 상태 유지 확인
8. DevTools에서 다른 탭으로 포커스 이동 → 새 메시지 도착 시 OS 알림 확인 (권한 부여 후)
9. 모바일 뷰포트(375px) — 뱃지 표시 / 토스트 max-w 폴리시 확인

### 8.3 빌드 검증

```powershell
cd C:\dev\LIV_homepage\liv-clinic
npm run lint     # ESLint 통과
npm run test     # Vitest 통과
npm run build    # 빌드 성공
```

---

## 9. 구현 순서 (Implementation Order — Do Phase Roadmap)

> 각 단계는 독립적으로 commit 가능. 단계마다 `npm run lint && npm run build`로 회귀 확인.

1. **Step 1 — 정적 에셋**
   - [ ] `liv-clinic/public/sounds/notification.mp3` 추가 (CC0 음원 또는 자체 생성)
   - [ ] PR 본문에 출처 명시

2. **Step 2 — 스키마 사전 점검**
   - [ ] Supabase MCP `list_tables`로 `chat_sessions`, `chat_messages` REPLICA IDENTITY 확인
   - [ ] FULL이 아니면 `030_chat_realtime_replica_identity.sql` 마이그레이션 추가

3. **Step 3 — 유틸 / 훅 / Context 골격**
   - [ ] `src/lib/chat/notificationStore.ts`
   - [ ] `src/hooks/useChatNotifications.ts` (초기 fetch + Realtime 구독)
   - [ ] `src/components/admin/notifications/NotificationProvider.tsx`

4. **Step 4 — 프레젠테이션 컴포넌트**
   - [ ] `src/components/admin/notifications/ToastStack.tsx`
   - [ ] `src/components/admin/notifications/UnreadBadge.tsx`
   - [ ] `src/components/admin/notifications/SoundToggle.tsx`

5. **Step 5 — 통합**
   - [ ] `AdminLayoutClient.tsx`에 `<NotificationProvider>` 감싸기
   - [ ] `AdminSidebar.tsx` "채팅 상담" 항목에 `<UnreadBadge>` 삽입
   - [ ] `AdminSidebar.tsx` 푸터 로그아웃 위에 `<SoundToggle>` 삽입

6. **Step 6 — 테스트**
   - [ ] Vitest 단위 테스트 4종 작성
   - [ ] `npm run test` 통과

7. **Step 7 — 수동 QA**
   - [ ] §8.2 시나리오 9건 모두 통과
   - [ ] 빌드/린트 통과

---

## 10. 미해결 / 추적 (Tracking)

- ⚠️ **알림음 파일 출처**: Do Step 1에서 음원 결정 필요. 후보:
  1. `freesound.org` CC0 (예: "notification" 검색)
  2. 자체 생성 (GarageBand / Audacity 0.5초 ding)
  3. Material Design Sound (구글 라이선스 확인 필요)
- ⚠️ **REPLICA IDENTITY**: Step 2 점검 결과에 따라 030 마이그레이션 필요 여부 결정
- 📌 **후속 PDCA 후보**:
  - 다탭 dedup (`BroadcastChannel`)
  - 알림 히스토리 모달
  - 모바일 PWA Push (서비스워커)
  - 미응답 N분 에스컬레이션 (이메일/SMS)

---

## 11. Acceptance Criteria 추적 매트릭스

| Plan §9 기준 | Design 구현 위치 |
|------------|----------------|
| `/admin/inventory`에서 새 채팅 도착 → 뱃지/토스트/소리 ≤ 2초 | §3.2 시퀀스, NotificationProvider가 `(authenticated)` 레이아웃 마운트 |
| 소리 토글 OFF → 시각만 | §3.4 `audioRef.current = null` |
| 토글 상태 새로고침 후 유지 | §3.4 + §4.6 localStorage |
| 토스트 클릭 → 채팅방 이동 | §4.3 `<Link href>` |
| 채팅방 진입+응답 → 뱃지 감소 | §3.3 Listener B + 기존 트리거 |
| 다른 탭 포커스 시 OS 알림 | §3.5 `document.hidden` 가드 |
| 같은 세션 메시지 무음 | §4.2 `currentSessionIdRef` 비교 |
| Vitest 70%+ | §8.1 |
| `npm run build` 성공 | §8.3 |
| 모바일 뱃지 정상 | §4.4 `min-w-[20px]` + sidebar 반응형 |

---

**End of Design**
