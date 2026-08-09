'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  CONTACT_CHANNELS,
  CONTACT_CHANNEL_LABELS,
  validateContactHandle,
  buildChatRefCode,
  type ContactChannel,
} from '@/lib/chat/contactChannels';
import {
  primaryMessengerFor,
  buildWhatsAppLink,
  LINE_LINK,
  WECHAT_DEEPLINK,
} from '@/lib/messengerLinks';
import { saveContact, ChatApiError, type VisitorLocale } from '@/lib/chat/chatApi';
import {
  trackChatCaptureShown,
  trackChatCaptureMessengerClick,
  trackChatContactSaved,
} from '@/lib/analytics-events';
import WeChatQRModal from '@/components/ui/WeChatQRModal';

interface Props {
  locale: VisitorLocale;
  sessionId: string;
  sessionToken: string;
  nextOpenAt: string | null;
}

const dismissKey = (sessionId: string) => `liv-chat-capture-dismissed:${sessionId}`;

// primaryMessengerFor의 반환('line'|'whatsapp'|'wechat')은 ContactChannel과 동일 집합.
function orderedChannels(locale: string): ContactChannel[] {
  const primary = primaryMessengerFor(locale) as ContactChannel;
  return [primary, ...CONTACT_CHANNELS.filter((c) => c !== primary)];
}

function formatReturnTime(iso: string, locale: string, timeZone?: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...(timeZone ? { timeZone } : {}),
    }).format(d);
  } catch {
    // 알 수 없는 로케일/타임존이어도 블록의 나머지는 정상 노출 (spec §12)
    return null;
  }
}

export default function ChatCaptureBlock({ locale, sessionId, sessionToken, nextOpenAt }: Props) {
  const t = useTranslations('chat');
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(dismissKey(sessionId)) === '1';
    } catch {
      return false;
    }
  });
  const [saved, setSaved] = useState(false);
  const [channel, setChannel] = useState<ContactChannel>(
    () => primaryMessengerFor(locale) as ContactChannel,
  );
  const [handle, setHandle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const shownTrackedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    setIsDesktop(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  }, []);

  useEffect(() => {
    if (!dismissed && !shownTrackedRef.current) {
      shownTrackedRef.current = true;
      trackChatCaptureShown(locale);
    }
  }, [dismissed, locale]);

  const persistDismiss = () => {
    try {
      window.localStorage.setItem(dismissKey(sessionId), '1');
    } catch {
      // privacy 모드 등 — 미영속이어도 현재 렌더에서는 숨김 유지
    }
  };

  const dismiss = () => {
    setDismissed(true);
    persistDismiss();
  };

  const refCode = buildChatRefCode(sessionId);
  const channels = orderedChannels(locale);
  const primary = channels[0];

  const kst = nextOpenAt ? formatReturnTime(nextOpenAt, locale, 'Asia/Seoul') : null;
  const local = nextOpenAt ? formatReturnTime(nextOpenAt, locale) : null;

  const handleMessengerClick = (c: ContactChannel) => {
    trackChatCaptureMessengerClick(c, locale);
    if (c === 'wechat' && isDesktop) {
      // 데스크톱 WeChat은 QR 모달 — 모달을 닫을 때 블록도 해제한다.
      setQrOpen(true);
      return;
    }
    dismiss();
  };

  const messengerHref = (c: ContactChannel): string => {
    if (c === 'whatsapp') return buildWhatsAppLink(t('whatsappPrefillChat', { code: refCode }));
    if (c === 'line') return LINE_LINK;
    return WECHAT_DEEPLINK;
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = handle.trim();
    if (!validateContactHandle(channel, trimmed)) {
      setError(t('captureContactInvalid'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveContact(sessionToken, channel, trimmed);
      trackChatContactSaved(channel, locale);
      setSaved(true);
      persistDismiss();
    } catch (err) {
      if (err instanceof ChatApiError && err.code === 'invalid_handle') {
        setError(t('captureContactInvalid'));
      } else {
        setError(t('captureContactFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  if (dismissed) return null;
  if (saved) {
    return (
      <div className="my-2 rounded-lg border border-[#0f766e]/30 bg-[#0f766e]/5 px-3 py-2.5 text-[12px] text-[#0f766e]">
        {t('captureContactSaved')}
      </div>
    );
  }

  const placeholderKey =
    channel === 'whatsapp'
      ? 'captureContactPlaceholderWhatsapp'
      : channel === 'wechat'
        ? 'captureContactPlaceholderWechat'
        : 'captureContactPlaceholderLine';

  return (
    <div className="relative my-2 rounded-lg border border-[#0f766e]/25 bg-white px-3 py-3 shadow-sm">
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('captureDismiss')}
        className="absolute top-1 right-1 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-sm leading-none"
      >
        ✕
      </button>

      <p className="text-[13px] font-semibold text-[#6d4e42] pr-6">{t('captureHeading')}</p>
      {kst && local && (
        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
          {t('captureReturnAt', { kst, local })}
        </p>
      )}

      <p className="text-[11px] text-gray-600 mt-2.5 font-medium">{t('captureMessengerLead')}</p>
      <div className="mt-1.5 flex flex-col gap-1.5">
        {primary === 'wechat' && isDesktop ? (
          <button
            type="button"
            onClick={() => handleMessengerClick('wechat')}
            className="w-full bg-[#0f766e] text-white text-[12px] font-medium min-h-[44px] rounded-md hover:bg-[#115e59] transition"
          >
            {CONTACT_CHANNEL_LABELS.wechat} →
          </button>
        ) : (
          <a
            href={messengerHref(primary)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleMessengerClick(primary)}
            className="w-full flex items-center justify-center bg-[#0f766e] text-white text-[12px] font-medium min-h-[44px] rounded-md hover:bg-[#115e59] transition"
          >
            {CONTACT_CHANNEL_LABELS[primary]} →
          </a>
        )}
        <div className="flex gap-3 justify-center">
          {channels.slice(1).map((c) =>
            c === 'wechat' && isDesktop ? (
              <button
                key={c}
                type="button"
                onClick={() => handleMessengerClick(c)}
                className="text-[11px] text-[#0f766e] underline underline-offset-2 min-h-[32px]"
              >
                {CONTACT_CHANNEL_LABELS[c]}
              </button>
            ) : (
              <a
                key={c}
                href={messengerHref(c)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleMessengerClick(c)}
                className="text-[11px] text-[#0f766e] underline underline-offset-2 min-h-[32px] inline-flex items-center"
              >
                {CONTACT_CHANNEL_LABELS[c]}
              </a>
            ),
          )}
        </div>
        <p className="text-[10px] text-gray-400 text-center">
          {t('captureCodeInstruction', { code: `#${refCode}` })}
        </p>
      </div>

      <p className="text-[11px] text-gray-600 mt-2.5 font-medium">{t('captureContactLead')}</p>
      <form onSubmit={handleSave} className="mt-1.5 flex flex-col gap-1.5">
        <div className="flex gap-1.5" role="radiogroup" aria-label={t('captureContactLead')}>
          {channels.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={channel === c}
              onClick={() => {
                setChannel(c);
                setError(null);
              }}
              className={`px-2.5 min-h-[32px] rounded-full text-[11px] border transition ${
                channel === c
                  ? 'bg-[#0f766e] text-white border-[#0f766e]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#0f766e]/50'
              }`}
            >
              {CONTACT_CHANNEL_LABELS[c]}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input
            type={channel === 'whatsapp' ? 'tel' : 'text'}
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={t(placeholderKey)}
            maxLength={100}
            className="flex-1 min-w-0 px-3 h-10 text-[12px] border border-gray-200 rounded-md focus:outline-none focus:border-[#0f766e]"
          />
          <button
            type="submit"
            disabled={saving || handle.trim().length === 0}
            className="px-3 h-10 bg-[#0f766e] text-white text-[12px] rounded-md hover:bg-[#115e59] disabled:opacity-50 transition whitespace-nowrap"
          >
            {t('captureContactSubmit')}
          </button>
        </div>
        {error && <div className="text-[11px] text-red-500">{error}</div>}
      </form>

      <WeChatQRModal
        open={qrOpen}
        onClose={() => {
          setQrOpen(false);
          dismiss();
        }}
      />
    </div>
  );
}
