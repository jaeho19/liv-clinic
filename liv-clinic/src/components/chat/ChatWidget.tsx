'use client';

import { useEffect, useRef, useState, type FocusEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  trackChatOpen,
  trackChatTeaserShown,
  trackChatTeaserClick,
  trackChatReplyTeaserShown,
  trackChatReplyTeaserClick,
} from '@/lib/analytics-events';
import { OPEN_CHAT_EVENT, fetchVisitorMessages } from '@/lib/chat/chatApi';
import { countOfflineReplies } from '@/lib/chat/unread';
import { useChatSession } from '@/hooks/useChatSession';
import { useUnreadIndicator } from '@/hooks/useUnreadIndicator';
import { createClient } from '@/lib/supabase-browser';
import type { VisitorLocale } from '@/lib/chat/chatApi';
import ChatPanel from './ChatPanel';

interface Props {
  locale: VisitorLocale;
}

// v2: 티저 카피를 혜택 선두(직접예약 5%)로 교체 — 키를 올려 기존 방문자에게도 1회 재노출.
const TOOLTIP_STORAGE_KEY = 'liv-chat-tooltip-seen-v2';
const TOOLTIP_APPEAR_MS = 3_000;
const TOOLTIP_AUTO_HIDE_MS = 12_000; // 9초 동안 노출 후 자동 사라짐
const PULSE_DURATION_MS = 5_000;
const TOOLTIP_BLUR_GRACE_MS = 3_000; // 말풍선 포커스 이탈 후 숨김까지의 유예

const LOCALE_FLAG: Record<VisitorLocale, string> = {
  en: '🇬🇧',
  ja: '🇯🇵',
  zh: '🇨🇳',
  'zh-TW': '🇹🇼',
  vi: '🇻🇳',
  th: '🇹🇭',
  ru: '🇷🇺',
  fr: '🇫🇷',
  mn: '🇲🇳',
  ar: '🇸🇦',
} satisfies Record<VisitorLocale, string>;

// The CSS reduced-motion block cannot reach framer-motion's JS-driven keyframes,
// so the pulse is gated on the media query at runtime instead.
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ChatWidget({ locale }: Props) {
  const t = useTranslations('chat');
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  // Reduced-motion visitors start with the pulse already off, so no keyframe ever runs.
  const [showPulse, setShowPulse] = useState(() => !prefersReducedMotion());
  // 자동 숨김 타이머 id — 포커스 중에는 취소하고, 포커스 이탈 시 재설정한다.
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // G-07: 위젯 레벨에서 세션을 단일 소스로 관리. ChatPanel은 props로 전달받아
  // 동일 인스턴스를 공유한다 (ChatPanel이 새 세션을 생성하면 위젯도 즉시 인지).
  const sessionState = useChatSession(locale);
  const sessionId = sessionState.session?.sessionId ?? null;
  const {
    count: unreadCount,
    increment: incrementUnread,
    reset: resetUnread,
    hydrate: hydrateUnread,
    lastSeenAt,
  } = useUnreadIndicator(sessionId);

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

  // 패널 열림/닫힘 시 unread 리셋 + lastSeenAt 워터마크 기록.
  // unread>0일 때만 리셋하면 워터마크가 영영 저장되지 않아, "패널을 열고 대화하다
  // 떠난" 방문자(오프시간의 전형)의 재방문 하이드레이션(§5.1)이 동작하지 않는다.
  // cleanup은 닫기·페이지 이탈 시각을 마지막 열람 시각으로 남긴다.
  useEffect(() => {
    if (!open) return;
    resetUnread();
    return () => resetUnread();
  }, [open, resetUnread]);

  // 재방문 하이드레이션: 부재중(사이트 이탈 중) 도착한 답장을 서버에서 1회 조회해
  // 배지를 복구한다 (spec §5.1 — 기존에는 체류 중 broadcast만 집계되던 갭).
  const hydratedForRef = useRef<string | null>(null);
  useEffect(() => {
    const token = sessionState.session?.sessionToken;
    if (!sessionId || !token || !lastSeenAt) return;
    if (hydratedForRef.current === sessionId) return;
    hydratedForRef.current = sessionId;
    fetchVisitorMessages(token, lastSeenAt)
      .then((msgs) => {
        const n = countOfflineReplies(msgs);
        if (n > 0) hydrateUnread(n);
      })
      .catch(() => {
        // 조회 실패 시 배지 없이 기존 동작 유지
      });
  }, [sessionId, lastSeenAt, sessionState.session?.sessionToken, hydrateUnread]);

  // 재방문 답장 티저 — 첫 방문 seen 플래그와 무관하게 노출, 우선순위 높음 (spec §5.2)
  const replyTeaserTrackedRef = useRef(false);
  useEffect(() => {
    if (open || unreadCount === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- unread 전환 시 1회, useUnreadIndicator와 동일 패턴
    setShowTooltip(true);
    if (!replyTeaserTrackedRef.current) {
      replyTeaserTrackedRef.current = true;
      trackChatReplyTeaserShown(locale);
    }
  }, [open, unreadCount, locale]);

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

    const showTimer = setTimeout(() => {
      setShowTooltip(true);
      trackChatTeaserShown(locale);
      // 티저를 실제로 노출한 순간 seen 기록 — 무시한 방문자 재노출·중복 발화 방지
      try {
        window.localStorage.setItem(TOOLTIP_STORAGE_KEY, '1');
      } catch {
        // ignore
      }
    }, TOOLTIP_APPEAR_MS);
    const hideTimer = setTimeout(
      () => setShowTooltip(false),
      TOOLTIP_APPEAR_MS + TOOLTIP_AUTO_HIDE_MS,
    );
    hideTimerRef.current = hideTimer;
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [open, locale]);

  // 외부 컴포넌트(QuickConsultBar 등)에서 `liv:open-chat` 이벤트로 패널 열기.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      setOpen((v) => {
        if (!v) trackChatOpen(locale);
        return true;
      });
      setShowTooltip(false);
      try {
        window.localStorage.setItem(TOOLTIP_STORAGE_KEY, '1');
      } catch {
        // ignore
      }
    };
    window.addEventListener(OPEN_CHAT_EVENT, handler);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handler);
  }, [locale]);

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

  // 말풍선에 포커스가 있는 동안에는 자동 숨김을 멈춘다 (WCAG 2.2.1 — 포커스된 콘텐츠 유지).
  const cancelTeaserHide = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const handleTeaserBlur = (e: FocusEvent<HTMLDivElement>) => {
    // 포커스가 말풍선 밖으로 나가면 3초 유예 후 숨김 (내부 포커스 이동은 유지)
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      cancelTeaserHide();
      hideTimerRef.current = setTimeout(() => setShowTooltip(false), TOOLTIP_BLUR_GRACE_MS);
    }
  };

  const handleToggle = () => {
    setOpen((v) => {
      if (!v) trackChatOpen(locale);
      return !v;
    });
    dismissTooltip();
  };

  // 티저 말풍선 클릭 = 패널 열기 (말풍선은 패널이 닫힌 동안에만 보이므로 항상 open 방향)
  const handleTeaserClick = () => {
    if (unreadCount > 0) {
      trackChatReplyTeaserClick(locale);
    } else {
      trackChatTeaserClick(locale);
    }
    handleToggle();
  };

  return (
    <>
      {/* 첫 방문 말풍선 툴팁 — 버튼 위쪽에 노출 */}
      <AnimatePresence>
        {showTooltip && !open && (
          <motion.div
            key="chat-tooltip"
            onFocus={cancelTeaserHide}
            onBlur={handleTeaserBlur}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            // Pinned physically by owner decision (chat left, socials right, all writing directions) — do not convert to logical properties.
            className="fixed left-2 sm:left-4 md:left-6 z-40 bg-white border border-[#e5e5e5] rounded-2xl shadow-xl max-w-[260px]"
            style={{
              bottom: 'calc(160px + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <button
              type="button"
              onClick={dismissTooltip}
              aria-label={t('tooltipDismiss')}
              className="absolute -top-1 -right-1 bg-white border border-gray-200 rounded-full w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-sm leading-none shadow-sm"
            >
              ✕
            </button>
            {/* 말풍선 본문 자체가 채팅을 여는 버튼 (닫기 ✕는 형제 요소로 분리) */}
            <button
              type="button"
              onClick={handleTeaserClick}
              className="block w-full text-start pl-3 pr-7 py-2.5 text-sm text-[#6d4e42] font-medium leading-relaxed cursor-pointer"
            >
              <span role="status">
                {unreadCount > 0 ? t('replyWaitingTeaser') : t('tooltipText')}
              </span>
            </button>
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
        // Pinned physically by owner decision (chat left, socials right, all writing directions) — do not convert to logical properties.
        className="fixed left-2 sm:left-4 md:left-6 z-40 flex items-center justify-center gap-2 bg-[#0f766e] text-white shadow-lg hover:bg-[#115e59] active:scale-[0.97] transition-colors rounded-full min-h-[52px] sm:min-h-[60px] px-4 sm:px-5"
        style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
        animate={
          showPulse && !open
            ? {
                boxShadow: [
                  '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                  '0 0 0 10px rgba(15, 118, 110, 0.35), 0 4px 6px -1px rgb(0 0 0 / 0.1)',
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
          className="w-6 h-6 flex-shrink-0"
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
        <span className="text-sm sm:text-base font-medium whitespace-nowrap">
          {t('openButton')}
        </span>
        {/* 직접예약 5% 혜택 필 — 패널을 열기 전에도 혜택이 보이도록 라벨 옆 인라인 배치 */}
        <span
          className="inline-flex items-center rounded-full bg-white text-[#0f766e] text-[11px] sm:text-xs font-bold px-2 py-0.5 whitespace-nowrap"
          aria-hidden="true"
        >
          {t('launcherBadge')}
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
