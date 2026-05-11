'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import type { UseChatSessionReturn } from '@/hooks/useChatSession';
import { useChatRealtime } from '@/hooks/useChatRealtime';
import { sendVisitorMessage, fetchPresence, ChatApiError } from '@/lib/chat/chatApi';
import {
  trackChatFirstMessage,
  trackChatMessage,
  trackChatTranslationFailure,
  trackChatClose,
} from '@/lib/analytics-events';
import type { VisitorLocale } from '@/lib/chat/chatApi';
import MessageBubble from './MessageBubble';

interface Props {
  locale: VisitorLocale;
  open: boolean;
  onClose: () => void;
  // ChatWidget이 단일 useChatSession 인스턴스를 소유하고 props로 주입.
  // 새 세션 생성 시 ChatWidget의 unread broadcast 구독이 즉시 활성화되도록 하는 G-07 fix.
  sessionState: UseChatSessionReturn;
}

const MAX_LEN = 1000;

export default function ChatPanel({ locale, open, onClose, sessionState }: Props) {
  const t = useTranslations('chat');
  const { session, start, loading: starting } = sessionState;
  const [presence, setPresence] = useState<{ online: boolean; businessHours: boolean } | null>(null);
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  // G-03: 패널 열린 시각 추적 — close 이벤트의 duration 산출용
  const openedAtRef = useRef<number | null>(null);
  // 데스크톱(hover+fine pointer)에서만 Enter=전송. 모바일은 Enter=줄바꿈 + Send 버튼만 사용.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const { messages, appendOptimistic } = useChatRealtime({
    sessionId: session?.sessionId ?? null,
    sessionToken: session?.sessionToken ?? null,
    enabled: open && !!session,
  });

  // Presence polling
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const p = await fetchPresence();
        if (!cancelled) setPresence({ online: p.online, businessHours: p.businessHours });
      } catch {
        // ignore
      }
    };
    void tick();
    const interval = setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [open]);

  // Auto scroll on new messages
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // G-03: open 전환 추적 → 닫힐 때 trackChatClose 발화 (모든 close 경로 커버: Esc, X, toggle)
  useEffect(() => {
    if (open && session) {
      openedAtRef.current = Date.now();
      return;
    }
    if (!open && openedAtRef.current !== null && session) {
      const durationSec = (Date.now() - openedAtRef.current) / 1000;
      const sessionId = session.sessionId;
      openedAtRef.current = null;
      void trackChatClose('visitor_close', durationSec, sessionId, locale);
    }
  }, [open, session, locale]);

  const handleStart = async (e: FormEvent) => {
    e.preventDefault();
    await start({ name: name.trim() || undefined, email: email.trim() || undefined });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_LEN || sending) return;
    // wasFirst: appendOptimistic 호출 전 visitor 메시지 수 판정 (§8.1)
    const wasFirst =
      messages.filter((m) => m.sender === 'visitor').length === 0;
    setSending(true);
    setSendError(null);
    try {
      const created = await sendVisitorMessage(session.sessionToken, trimmed);
      trackChatMessage('sent', locale);
      if (wasFirst) trackChatFirstMessage(locale);
      if (created.translation_status === 'failed') {
        trackChatTranslationFailure(created.translation_error ?? 'unknown');
      }
      appendOptimistic(created);
      setText('');
    } catch (err) {
      if (err instanceof ChatApiError) {
        if (err.code === 'rate_limited') setSendError(t('rateLimited'));
        else if (err.code === 'invalid_input') setSendError(t('tooLong'));
        else if (err.code === 'session_closed') setSendError(t('sessionEnded'));
        else setSendError(t('rateLimited'));
      } else {
        setSendError(t('rateLimited'));
      }
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  const remaining = MAX_LEN - text.length;
  const overLimit = text.length > MAX_LEN;
  const isOnline = presence?.online ?? false;

  return (
    <div
      role="dialog"
      aria-label={t('title')}
      className="fixed left-2 sm:left-4 md:left-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
      style={{
        bottom: 'calc(140px + env(safe-area-inset-bottom, 0px))',
        width: 'min(360px, calc(100vw - 16px))',
        // dvh 우선(iOS Safari toolbar 정확 반영). 미지원 브라우저는 70vh로 fallback
        height: 'min(560px, 70dvh)',
        maxHeight: 'min(560px, 70vh)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100 bg-[#b4988d] text-white">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate">{t('title')}</div>
          <div className="text-[11px] opacity-90 mt-0.5 flex items-center gap-1.5">
            <span
              className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                isOnline ? 'bg-green-300' : 'bg-gray-300'
              }`}
              aria-hidden
            />
            <span className="truncate">{isOnline ? t('online') : t('offline')}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="text-white/90 hover:text-white text-xl leading-none flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2 flex-shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      {!session ? (
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          <p className="text-sm text-gray-600">{t('welcome')}</p>
          <p className="text-[11px] text-gray-400 leading-relaxed">{t('businessHours')}</p>
          <p className="text-[11px] text-gray-400 leading-relaxed">{t('consent')}</p>
          <form onSubmit={handleStart} className="flex flex-col gap-2 mt-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              maxLength={60}
              autoComplete="nickname"
              className="px-3 h-11 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#b4988d]"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              autoComplete="email"
              inputMode="email"
              className="px-3 h-11 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#b4988d]"
            />
            <button
              type="submit"
              disabled={starting}
              className="mt-1 bg-[#b4988d] text-white text-sm font-medium h-11 rounded-md hover:bg-[#a3877d] disabled:opacity-60 transition"
            >
              {starting ? '...' : t('startChat')}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 py-3 bg-gray-50/40"
            aria-live="polite"
          >
            {/* 운영시간 외 안내 */}
            {presence && !presence.online && (
              <div className="my-1.5 mx-auto max-w-[95%] text-center">
                <div className="inline-block rounded-md bg-yellow-50 px-3 py-2 text-[11px] text-yellow-900 border border-yellow-100">
                  {presence.businessHours
                    ? t('allOperatorsBusyNotice')
                    : t('delayedResponseNotice')}
                </div>
              </div>
            )}
            {messages.length === 0 && (
              <div className="text-xs text-gray-400 text-center py-6">{t('welcome')}</div>
            )}
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} visitorLocale={locale} />
            ))}
          </div>

          {/* Composer */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-gray-100 px-3 py-2 flex flex-col gap-1 bg-white"
            style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  // 데스크톱에서만 Enter=전송. 모바일은 Enter=줄바꿈 (자연스러운 입력)
                  if (isDesktop && e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSubmit(e as unknown as FormEvent);
                  }
                }}
                placeholder={t('placeholder')}
                rows={2}
                enterKeyHint="send"
                className="flex-1 resize-none px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#b4988d] max-h-[120px]"
              />
              <button
                type="submit"
                disabled={sending || text.trim().length === 0 || overLimit}
                className="bg-[#b4988d] text-white text-sm px-4 py-2 rounded-md hover:bg-[#a3877d] disabled:opacity-50 transition self-end min-h-[44px] min-w-[60px]"
              >
                {t('send')}
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>{t('subtitle')}</span>
              <span className={overLimit || remaining < 100 ? 'text-red-500' : ''}>
                {text.length}/{MAX_LEN}
              </span>
            </div>
            {sendError && <div className="text-[11px] text-red-500">{sendError}</div>}
          </form>
        </>
      )}
    </div>
  );
}
