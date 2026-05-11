'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { trackChatOpen } from '@/lib/analytics-events';
import { useChatSession } from '@/hooks/useChatSession';
import { useUnreadIndicator } from '@/hooks/useUnreadIndicator';
import { createClient } from '@/lib/supabase-browser';
import type { VisitorLocale } from '@/lib/chat/chatApi';
import ChatPanel from './ChatPanel';

interface Props {
  locale: VisitorLocale;
}

const TOOLTIP_STORAGE_KEY = 'liv-chat-tooltip-seen-v1';
const TOOLTIP_APPEAR_MS = 3_000;
const TOOLTIP_AUTO_HIDE_MS = 12_000; // 9초 동안 노출 후 자동 사라짐
const PULSE_DURATION_MS = 5_000;

const LOCALE_FLAG: Record<VisitorLocale, string> = {
  en: '🇬🇧',
  ja: '🇯🇵',
  zh: '🇨🇳',
  fr: '🇫🇷',
  mn: '🇲🇳',
  ar: '🇸🇦',
};

export default function ChatWidget({ locale }: Props) {
  const t = useTranslations('chat');
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  // G-07: 위젯 레벨에서 세션을 단일 소스로 관리. ChatPanel은 props로 전달받아
  // 동일 인스턴스를 공유한다 (ChatPanel이 새 세션을 생성하면 위젯도 즉시 인지).
  const sessionState = useChatSession(locale);
  const sessionId = sessionState.session?.sessionId ?? null;
  const { count: unreadCount, increment: incrementUnread, reset: resetUnread } =
    useUnreadIndicator(sessionId);

  // G-07: 패널이 닫힌 동안에도 broadcast 구독 → operator/system 메시지 도착 시 unread 증가
  // 서버 lib/chat/broadcast.ts와 동일한 채널명 `chat:${sessionId}` 사용 (호환성).
  useEffect(() => {
    if (!sessionId || open) return;
    const supabase = createClient();
    const channel = supabase.channel(`chat:${sessionId}`, {
      config: { broadcast: { self: false } },
    });
    channel.on('broadcast', { event: 'message_created' }, (msg) => {
      const innerPayload = (msg as { payload?: { sender?: string } }).payload;
      const sender = innerPayload?.sender;
      // sender가 명시되지 않은 레거시 broadcast는 무시 (visitor 자기 메시지 카운트 방지)
      if (sender && sender !== 'visitor') {
        incrementUnread();
      }
    });
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId, open, incrementUnread]);

  // 패널 열릴 때 unread 카운트 리셋
  useEffect(() => {
    if (open && unreadCount > 0) {
      resetUnread();
    }
  }, [open, unreadCount, resetUnread]);

  // 첫 5초 펄스 글로우 (마운트 시 1회)
  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), PULSE_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  // 첫 방문 시 말풍선 툴팁 (세션당 1회만, localStorage 영구 저장)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (open) return;
    let seen = false;
    try {
      seen = window.localStorage.getItem(TOOLTIP_STORAGE_KEY) === '1';
    } catch {
      // localStorage 접근 불가 (privacy 모드 등) → 툴팁 미표시
      return;
    }
    if (seen) return;

    const showTimer = setTimeout(() => setShowTooltip(true), TOOLTIP_APPEAR_MS);
    const hideTimer = setTimeout(
      () => setShowTooltip(false),
      TOOLTIP_APPEAR_MS + TOOLTIP_AUTO_HIDE_MS,
    );
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [open]);

  // 방어적 안전장치: ko가 prop으로 들어오면 렌더 차단 (모든 hook 호출 이후에 위치 — rules-of-hooks)
  if ((locale as string) === 'ko') return null;

  const dismissTooltip = () => {
    setShowTooltip(false);
    try {
      window.localStorage.setItem(TOOLTIP_STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  };

  const handleToggle = () => {
    setOpen((v) => {
      if (!v) trackChatOpen(locale);
      return !v;
    });
    dismissTooltip();
  };

  return (
    <>
      {/* 첫 방문 말풍선 툴팁 — 버튼 위쪽에 노출 */}
      <AnimatePresence>
        {showTooltip && !open && (
          <motion.div
            key="chat-tooltip"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="fixed left-2 sm:left-4 md:left-6 z-40 bg-white border border-[#e5e5e5] rounded-2xl shadow-xl px-3 py-2.5 max-w-[260px]"
            style={{
              bottom: 'calc(150px + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <button
              type="button"
              onClick={dismissTooltip}
              aria-label={t('tooltipDismiss')}
              className="absolute -top-1 -right-1 bg-white border border-gray-200 rounded-full w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-sm leading-none shadow-sm"
            >
              ✕
            </button>
            <div className="text-xs sm:text-sm text-[#6d4e42] font-medium pr-3 leading-relaxed">
              {t('tooltipText')}
            </div>
            {/* 말풍선 꼬리 — 버튼을 가리키도록 아래쪽 */}
            <div
              className="absolute -bottom-2 left-7 w-4 h-4 bg-white border-r border-b border-[#e5e5e5] transform rotate-45"
              aria-hidden
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 토글 버튼 — 펄스 글로우 + 항상 라벨 + 언어 배지 */}
      <motion.button
        type="button"
        onClick={handleToggle}
        aria-label={
          unreadCount > 0
            ? `${t('openButton')} — ${t('unreadAria', { count: unreadCount })}`
            : t('openButton')
        }
        aria-expanded={open}
        className="fixed left-2 sm:left-4 md:left-6 z-40 flex items-center justify-center gap-2 bg-[#b4988d] text-white shadow-lg hover:bg-[#a3877d] active:scale-[0.97] transition-colors rounded-full min-h-[48px] px-3 sm:px-4"
        style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
        animate={
          showPulse && !open
            ? {
                boxShadow: [
                  '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                  '0 0 0 10px rgba(180, 152, 141, 0.25), 0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                ],
              }
            : undefined
        }
        transition={
          showPulse && !open
            ? { boxShadow: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } }
            : undefined
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8-1.39 0-2.71-.27-3.86-.76L3 21l1.4-4.18A8.51 8.51 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
          {t('openButton')}
        </span>
        {/* 언어 모핑 배지 — 번역 기능임을 즉시 인지 */}
        <span
          className="hidden sm:inline-flex items-center gap-0.5 text-[10px] bg-white/20 rounded-full px-1.5 py-0.5 whitespace-nowrap"
          aria-hidden
        >
          {LOCALE_FLAG[locale]}
          <span className="opacity-80">↔</span>
          🇰🇷
        </span>
        {/* G-07: 미확인 메시지 빨간 점 배지 */}
        {unreadCount > 0 && !open && (
          <span
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-600 ring-2 ring-white"
            aria-hidden
          />
        )}
      </motion.button>

      <ChatPanel
        locale={locale}
        open={open}
        onClose={() => setOpen(false)}
        sessionState={sessionState}
      />
    </>
  );
}
