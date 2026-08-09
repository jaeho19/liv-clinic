'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY_PREFIX = 'liv-chat-unread';
const STORAGE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일 (chat_session 만료와 동기)

interface PersistedUnread {
  count: number;
  lastSeenAt: string; // ISO — visitor가 마지막으로 패널 연 시각
  storedAtMs: number;
}

function storageKey(sessionId: string): string {
  return `${STORAGE_KEY_PREFIX}:${sessionId}`;
}

function readPersisted(sessionId: string): PersistedUnread | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedUnread;
    if (Date.now() - parsed.storedAtMs > STORAGE_TTL_MS) {
      window.localStorage.removeItem(storageKey(sessionId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writePersisted(sessionId: string, value: PersistedUnread): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(sessionId), JSON.stringify(value));
  } catch {
    // privacy 모드 등에서 실패 → 메모리 only fallback
  }
}

export interface UseUnreadIndicatorReturn {
  count: number;
  /** 패널 닫힌 동안 신규 operator/system 메시지 도착 시 호출 */
  increment: () => void;
  /** 패널 열림 시 호출 — 카운트 0 + lastSeenAt now() */
  reset: () => void;
  /** 재방문 시 서버 조회 결과로 카운트를 초기화 — lastSeenAt은 유지 */
  hydrate: (serverCount: number) => void;
  /** 영속화된 마지막 열람 시각. 영속값이 없으면(신규 세션) null — 하이드레이션 대상 아님 */
  lastSeenAt: string | null;
}

/**
 * 위젯 토글 버튼의 unread 배지 카운트 관리.
 * - localStorage 영속화 (sessionId 별 7일 TTL)
 * - 함수형 setter로 race condition 안전
 * - sessionId 변경 시 새 카운트 로드
 */
export function useUnreadIndicator(sessionId: string | null): UseUnreadIndicatorReturn {
  const [count, setCount] = useState(0);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const lastSeenAtRef = useRef<string>(new Date().toISOString());

  // sessionId 변경 시 영속화된 값 로드
  useEffect(() => {
    if (!sessionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCount(0);
      setLastSeenAt(null);
      lastSeenAtRef.current = new Date().toISOString();
      return;
    }
    const persisted = readPersisted(sessionId);
    if (persisted) {
      setCount(persisted.count);
      setLastSeenAt(persisted.lastSeenAt);
      lastSeenAtRef.current = persisted.lastSeenAt;
    } else {
      setCount(0);
      setLastSeenAt(null);
      lastSeenAtRef.current = new Date().toISOString();
    }
  }, [sessionId]);

  const increment = useCallback(() => {
    if (!sessionId) return;
    setCount((prev) => {
      const next = prev + 1;
      writePersisted(sessionId, {
        count: next,
        lastSeenAt: lastSeenAtRef.current,
        storedAtMs: Date.now(),
      });
      return next;
    });
  }, [sessionId]);

  const reset = useCallback(() => {
    if (!sessionId) {
      setCount(0);
      return;
    }
    const now = new Date().toISOString();
    lastSeenAtRef.current = now;
    setLastSeenAt(now);
    setCount(0);
    writePersisted(sessionId, {
      count: 0,
      lastSeenAt: now,
      storedAtMs: Date.now(),
    });
  }, [sessionId]);

  // 재방문 하이드레이션: 부재중 도착 답장 수를 서버 기준으로 반영.
  // lastSeenAt은 갱신하지 않는다 — 아직 읽지 않았기 때문.
  const hydrate = useCallback(
    (serverCount: number) => {
      if (!sessionId || serverCount <= 0) return;
      setCount(serverCount);
      writePersisted(sessionId, {
        count: serverCount,
        lastSeenAt: lastSeenAtRef.current,
        storedAtMs: Date.now(),
      });
    },
    [sessionId]
  );

  return { count, increment, reset, hydrate, lastSeenAt };
}
