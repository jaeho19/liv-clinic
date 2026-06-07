'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createChatSession,
  type CreateSessionResponse,
  type VisitorLocale,
} from '@/lib/chat/chatApi';

const STORAGE_KEY_PREFIX = 'liv-chat-session-v1';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일

interface StoredSession {
  sessionId: string;
  sessionToken: string;
  visitorLocale: VisitorLocale;
  createdAt: string;
}

interface StoredEnvelope {
  session: StoredSession;
  storedAtMs: number;
}

function storageKey(locale: VisitorLocale) {
  return `${STORAGE_KEY_PREFIX}:${locale}`;
}

function readStored(locale: VisitorLocale): StoredSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(storageKey(locale));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredEnvelope;
    if (Date.now() - parsed.storedAtMs > SESSION_TTL_MS) {
      window.localStorage.removeItem(storageKey(locale));
      return null;
    }
    return parsed.session;
  } catch {
    return null;
  }
}

function writeStored(locale: VisitorLocale, session: StoredSession) {
  if (typeof window === 'undefined') return;
  const envelope: StoredEnvelope = { session, storedAtMs: Date.now() };
  window.localStorage.setItem(storageKey(locale), JSON.stringify(envelope));
}

function clearStored(locale: VisitorLocale) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(storageKey(locale));
}

export type { StoredSession };

export interface UseChatSessionReturn {
  session: StoredSession | null;
  loading: boolean;
  error: string | null;
  start: (input?: { name?: string; email?: string }) => Promise<StoredSession | null>;
  reset: () => void;
}

export function useChatSession(locale: VisitorLocale): UseChatSessionReturn {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 로컬 캐시 복원 (프로젝트의 useInventoryData 등 기존 hook과 동일 패턴)
  useEffect(() => {
    const stored = readStored(locale);
    if (stored) {
      setSession(stored);
    }
  }, [locale]);

  const start = useCallback(
    async (input?: { name?: string; email?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const created: CreateSessionResponse = await createChatSession({
          visitorLocale: locale,
          visitorName: input?.name,
          visitorEmail: input?.email,
        });
        const next: StoredSession = {
          sessionId: created.sessionId,
          sessionToken: created.sessionToken,
          visitorLocale: created.visitorLocale,
          createdAt: created.createdAt,
        };
        writeStored(locale, next);
        setSession(next);
        return next;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'unknown_error';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [locale]
  );

  const reset = useCallback(() => {
    clearStored(locale);
    setSession(null);
  }, [locale]);

  return { session, loading, error, start, reset };
}
