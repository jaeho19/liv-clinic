'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import type { UseChatSessionReturn } from '@/hooks/useChatSession';
import { useChatRealtime } from '@/hooks/useChatRealtime';
import { sendVisitorMessage, fetchPresence, fetchSessionInfo, ChatApiError } from '@/lib/chat/chatApi';
import { parseCaptureDismissedAt, shouldShowCaptureBlock } from '@/lib/chat/contactChannels';
import { countVisitorText } from '@/lib/chat/messageList';
import {
  trackChatFirstMessage,
  trackChatMessage,
  trackChatTranslationFailure,
  trackChatClose,
  trackPromoClick,
} from '@/lib/analytics-events';
import type { VisitorLocale } from '@/lib/chat/chatApi';
import MessageBubble from './MessageBubble';
import ChatCaptureBlock from './ChatCaptureBlock';

interface Props {
  locale: VisitorLocale;
  open: boolean;
  onClose: () => void;
  // ChatWidget이 단일 useChatSession 인스턴스를 소유하고 props로 주입.
  // 새 세션 생성 시 ChatWidget의 unread broadcast 구독이 즉시 활성화되도록 하는 G-07 fix.
  sessionState: UseChatSessionReturn;
}

const MAX_LEN = 1000;

// 연락처 카드를 ✕로 닫은 시각(ms)을 세션별로 기억한다. 12시간 뒤에는 다시 뜬다 (스펙 2026-10-01 §4.2).
const captureDismissKey = (sessionId: string) => `liv-chat-capture-dismissed:${sessionId}`;

function readCaptureDismissedAt(sessionId: string): number | null {
  try {
    return parseCaptureDismissedAt(window.localStorage.getItem(captureDismissKey(sessionId)));
  } catch {
    return null;
  }
}

export default function ChatPanel({ locale, open, onClose, sessionState }: Props) {
  const t = useTranslations('chat');
  const { session, start, loading: starting, error: startError } = sessionState;
  const sessionId = session?.sessionId ?? null;
  const sessionToken = session?.sessionToken ?? null;
  const [presence, setPresence] = useState<{
    online: boolean;
    businessHours: boolean;
    nextOpenAt: string | null;
  } | null>(null);
  // presence 를 받아 올 때마다(30초) 갱신하는 "지금" — 연락처 카드의 시간 조건(직원 글 10분, ✕ 12시간)에 쓴다.
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // 보내는 중인 글 — 전송 응답보다 자동 안내가 먼저 도착하면 손님 글이 목록에 먼저 보인다. 그때 입력창을 바로 비운다.
  const [inFlight, setInFlight] = useState<{ text: string; countBefore: number } | null>(null);
  // 서버 기준 연락처 유무 (세션별). null = 아직 모름
  const [contactInfo, setContactInfo] = useState<{ sessionId: string; hasContact: boolean } | null>(null);
  // 이 화면에서 방금 ✕로 닫은 시각 (세션별)
  const [dismissedNow, setDismissedNow] = useState<{ sessionId: string; atMs: number } | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  // G-03: 패널 열린 시각 추적 — close 이벤트의 duration 산출용
  const openedAtRef = useRef<number | null>(null);
  // M2: 사전-세션 화면에 직접예약 프로모션 노출 + select_promotion 추적.
  // 위젯이 뜨는 방문자 로케일 6개 전체 대상 (초기 en/ja/zh 한정 → fr/mn/ar 확장).
  const promoViewedRef = useRef(false);
  // 데스크톱(hover+fine pointer)에서만 Enter=전송. 모바일은 Enter=줄바꿈 + Send 버튼만 사용.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const { messages, appendOptimistic } = useChatRealtime({
    sessionId,
    sessionToken,
    enabled: open && !!session,
  });

  // Presence polling
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const p = await fetchPresence();
        if (!cancelled) {
          setPresence({
            online: p.online,
            businessHours: p.businessHours,
            nextOpenAt: p.nextOpenAt,
          });
          setNowMs(Date.now());
        }
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

  // 연락처 유무 조회 — 패널을 열 때 한 번. 실패하면 "연락처 없음"으로 본다(놓치는 것보다 한 번 더 묻는 편이 낫다).
  useEffect(() => {
    if (!open || !sessionId || !sessionToken) return;
    let cancelled = false;
    fetchSessionInfo(sessionToken)
      .then((info) => {
        if (!cancelled) setContactInfo({ sessionId, hasContact: info.hasContact });
      })
      .catch(() => {
        if (!cancelled) {
          setContactInfo((cur) => (cur?.sessionId === sessionId ? cur : { sessionId, hasContact: false }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, sessionId, sessionToken]);

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
      if (e.key !== 'Escape') return;
      // 패널 위에 모달(WeChat QR 크게 보기)이 떠 있으면 Esc 는 그 모달만 닫는다
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      onClose();
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
      const closedSessionId = session.sessionId;
      openedAtRef.current = null;
      void trackChatClose('visitor_close', durationSec, closedSessionId, locale);
    }
  }, [open, session, locale]);

  // M2: 프로모션 노출 1회 추적 (사전-세션 화면이 실제로 보일 때)
  useEffect(() => {
    if (open && !session && !promoViewedRef.current) {
      promoViewedRef.current = true;
      trackPromoClick('chat_direct_booking', 'view');
    }
  }, [open, session]);

  // 저장돼 있던 "카드를 닫은 시각" — 세션이 정해지면 한 번 읽는다.
  const storedDismissedAt = useMemo(() => (open && sessionId ? readCaptureDismissedAt(sessionId) : null), [open, sessionId]);

  const handleStart = async (e: FormEvent) => {
    e.preventDefault();
    await start({ name: name.trim() || undefined, email: email.trim() || undefined });
  };

  // M2: 프로모션 CTA — 직접예약 초안 메시지를 미리 채운 뒤 세션 시작(방문자는 전송만 하면 됨).
  const handlePromoStart = async () => {
    trackPromoClick('chat_direct_booking', 'cta');
    setText(t('promoDraft'));
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
    setInFlight({ text: trimmed, countBefore: countVisitorText(messages, trimmed) });
    try {
      const { message: created, contact } = await sendVisitorMessage(session.sessionToken, trimmed);
      trackChatMessage('sent', locale);
      if (wasFirst) trackChatFirstMessage(locale);
      if (created.translation_status === 'failed') {
        trackChatTranslationFailure(created.translation_error ?? 'unknown');
      }
      appendOptimistic(created);
      // 글 속 이메일이 연락처로 저장됐으면 카드를 숨긴다 (hasContact 는 서버가 알려 준다)
      if (contact) setContactInfo({ sessionId: session.sessionId, hasContact: contact.hasContact });
      // 응답을 기다리는 사이 손님이 새 글을 쓰기 시작했으면 지우지 않는다
      setText((cur) => (cur.trim() === trimmed ? '' : cur));
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
      setInFlight(null);
    }
  };

  const dismissCapture = () => {
    if (!sessionId) return;
    const atMs = Date.now();
    setDismissedNow({ sessionId, atMs });
    try {
      window.localStorage.setItem(captureDismissKey(sessionId), String(atMs));
    } catch {
      // privacy 모드 등 — 저장하지 못해도 이 화면에서는 닫힌 채로 둔다
    }
  };

  if (!open) return null;

  // 보내는 중인 글이 이미 목록에 나타났으면(자동 안내가 응답보다 먼저 도착) 입력창을 비워 보여 준다.
  const echoed =
    inFlight !== null &&
    text.trim() === inFlight.text &&
    countVisitorText(messages, inFlight.text) > inFlight.countBefore;
  const shownText = echoed ? '' : text;
  const remaining = MAX_LEN - shownText.length;
  const overLimit = shownText.length > MAX_LEN;
  const isOnline = presence?.online ?? false;

  const hasContact = contactInfo?.sessionId === sessionId ? contactInfo.hasContact : false;
  const dismissedAtMs = dismissedNow?.sessionId === sessionId ? dismissedNow.atMs : storedDismissedAt;
  const showCapture = shouldShowCaptureBlock({
    presenceLoaded: presence !== null,
    sessionInfoLoaded: contactInfo?.sessionId === sessionId,
    hasContact,
    dismissedAtMs,
    messages,
    nowMs,
  });

  return (
    <div
      role="dialog"
      aria-label={t('title')}
      // Pinned physically by owner decision (chat left, socials right, all writing directions) — do not convert to logical properties.
      className="fixed left-2 sm:left-4 md:left-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
      style={{
        bottom: 'calc(150px + env(safe-area-inset-bottom, 0px))',
        width: 'min(384px, calc(100vw - 16px))',
        // dvh 우선(iOS Safari toolbar 정확 반영). 미지원 브라우저는 72vh로 fallback
        height: 'min(600px, 72dvh)',
        maxHeight: 'min(600px, 72vh)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100 bg-[#0f766e] text-white">
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
          {/* 직접예약 프로모션 — 라이브챗을 통한 직접 유입 유도 (에이전시 fee 절감) */}
          <div className="rounded-lg border border-[#b4988d]/40 bg-[#b4988d]/10 px-3 py-2.5">
            <p className="text-[13px] font-semibold text-[#6d4e42]">🎁 {t('promoTitle')}</p>
            <p className="text-[11px] text-[#8a6f63] mt-0.5 leading-relaxed">{t('promoBody')}</p>
            <button
              type="button"
              onClick={() => void handlePromoStart()}
              disabled={starting}
              className="mt-2 w-full bg-[#0f766e] text-white text-[12px] font-medium min-h-[44px] rounded-md hover:bg-[#115e59] disabled:opacity-60 transition"
            >
              {t('promoCta')} →
            </button>
            <p className="mt-1.5 text-[10px] leading-relaxed text-[#8a6f63]/80">{t('promoTerms')}</p>
          </div>
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
              className="px-3 h-11 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#0f766e]"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              autoComplete="email"
              inputMode="email"
              className="px-3 h-11 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#0f766e]"
            />
            <button
              type="submit"
              disabled={starting}
              className="mt-1 bg-[#0f766e] text-white text-sm font-medium h-11 rounded-md hover:bg-[#115e59] disabled:opacity-60 transition"
            >
              {starting ? '...' : t('startChat')}
            </button>
            {startError && <div className="text-[11px] text-red-500">{t('startFailed')}</div>}
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
            {/* 연락처 카드 — 손님이 답을 기다리는 동안이면 영업시간에도 뜬다 (스펙 2026-10-01 §4.2).
                띄울지는 shouldShowCaptureBlock 이 정하고, 영업시간 여부는 카드 안의 안내 한 줄만 가른다. */}
            {presence && showCapture && (
              <ChatCaptureBlock
                locale={locale}
                sessionId={session.sessionId}
                sessionToken={session.sessionToken}
                businessHours={presence.businessHours}
                nextOpenAt={presence.nextOpenAt}
                onDismiss={dismissCapture}
                onSaved={() => setContactInfo({ sessionId: session.sessionId, hasContact: true })}
              />
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-gray-100 px-3 py-2 flex flex-col gap-1 bg-white"
            style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="flex items-end gap-2">
              <textarea
                value={shownText}
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
                className="flex-1 resize-none px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#0f766e] max-h-[120px]"
              />
              <button
                type="submit"
                disabled={sending || shownText.trim().length === 0 || overLimit}
                className="bg-[#0f766e] text-white text-sm px-4 py-2 rounded-md hover:bg-[#115e59] disabled:opacity-50 transition self-end min-h-[44px] min-w-[60px]"
              >
                {t('send')}
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>{t('subtitle')}</span>
              <span className={overLimit || remaining < 100 ? 'text-red-500' : ''}>
                {shownText.length}/{MAX_LEN}
              </span>
            </div>
            {sendError && <div className="text-[11px] text-red-500">{sendError}</div>}
          </form>
        </>
      )}
    </div>
  );
}
