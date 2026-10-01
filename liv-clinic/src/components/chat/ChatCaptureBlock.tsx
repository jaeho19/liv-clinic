'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  CONTACT_CHANNEL_LABELS,
  CONTACT_FORM_CHANNELS,
  buildChatRefCode,
  defaultFormChannel,
  orderedLinkChannels,
  validateContactHandle,
  type ContactChannel,
  type ContactFormChannel,
} from '@/lib/chat/contactChannels';
import { buildWhatsAppLink, LINE_LINK } from '@/lib/messengerLinks';
import { CHAT_CONTACT_EMAIL, WECHAT_ID, WECHAT_QR_IMAGE } from '@/lib/constants';
import { saveContact, reportContactClick, ChatApiError, type VisitorLocale } from '@/lib/chat/chatApi';
import { copyText } from '@/lib/copyText';
import {
  trackChatCaptureShown,
  trackChatCaptureMessengerClick,
  trackChatContactSaved,
} from '@/lib/analytics-events';
import ChannelIcon from '@/components/ui/ChannelIcon';
import WeChatQRModal from '@/components/ui/WeChatQRModal';

// 연락처 카드 (스펙 2026-10-01 §4.2). 손님이 답을 기다리는 동안 대화 아래에 뜬다 — 띄울지는 ChatPanel 이 정한다.
//   위: 병원으로 바로 연락하기 — WhatsApp·WeChat·LINE·이메일 단추 네 개(아이콘 + 이름)
//   아래: 연락처 남기기 — WhatsApp 번호·WeChat ID·이메일 (LINE ID 는 받지 않는다)
// 단추를 눌러도 카드는 닫히지 않는다. 저장에 성공하면 onSaved 로 알리고 카드가 사라진다(확인은 대화창의 시스템 메시지).

interface Props {
  locale: VisitorLocale;
  sessionId: string;
  sessionToken: string;
  /** 영업시간 중인가 — 노출 조건이 아니라 안내 한 줄만 가른다 */
  businessHours: boolean;
  nextOpenAt: string | null;
  /** ✕ 로 닫았다 (닫은 시각을 기억하는 일은 ChatPanel 이 한다) */
  onDismiss: () => void;
  /** 연락처 저장에 성공했다 */
  onSaved: () => void;
}

type ExpandedPanel = 'wechat' | 'email' | null;

// 단추의 아이콘 색 — 브랜드 색. 선택된 칩 안에서는 흰색으로 바뀐다.
const ICON_COLOR: Record<ContactChannel, string> = {
  whatsapp: 'text-[#25D366]',
  line: 'text-[#00B900]',
  wechat: '',
  email: 'text-[#6d4e42]',
};

const PLACEHOLDER_KEY: Record<ContactFormChannel, string> = {
  whatsapp: 'captureContactPlaceholderWhatsapp',
  wechat: 'captureContactPlaceholderWechat',
  email: 'captureContactPlaceholderEmail',
};

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

export default function ChatCaptureBlock({
  locale,
  sessionId,
  sessionToken,
  businessHours,
  nextOpenAt,
  onDismiss,
  onSaved,
}: Props) {
  const t = useTranslations('chat');
  const linkChannels = orderedLinkChannels(locale);
  // 중국어 화면은 1순위가 WeChat 이라 병원 QR·아이디를 펼친 채로 보여 준다.
  const [expanded, setExpanded] = useState<ExpandedPanel>(() => (linkChannels[0] === 'wechat' ? 'wechat' : null));
  const [openedMessenger, setOpenedMessenger] = useState(false);
  const [formChannel, setFormChannel] = useState<ContactFormChannel>(() => defaultFormChannel(locale));
  const [handle, setHandle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [copied, setCopied] = useState<ExpandedPanel>(null);
  const shownTrackedRef = useRef(false);
  const reportedRef = useRef<Set<ContactChannel>>(new Set());
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shownTrackedRef.current) {
      shownTrackedRef.current = true;
      trackChatCaptureShown(locale);
    }
  }, [locale]);

  useEffect(
    () => () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    },
    []
  );

  const refCode = buildChatRefCode(sessionId);
  const codeLabel = `#${refCode}`;
  const prefill = t('whatsappPrefillChat', { code: refCode });

  const kst = nextOpenAt ? formatReturnTime(nextOpenAt, locale, 'Asia/Seoul') : null;
  const local = nextOpenAt ? formatReturnTime(nextOpenAt, locale) : null;
  const lead = businessHours ? t('captureBusyLead') : kst && local ? t('captureReturnAt', { kst, local }) : null;

  /** WeChat·이메일 블록을 펼치거나 접는다 — 한 번에 하나만. */
  const togglePanel = (panel: 'wechat' | 'email') => {
    setExpanded((cur) => (cur === panel ? null : panel));
    // 펼친 블록이 대화창 아래로 잘리지 않게, 그려진 뒤 보이는 곳까지만 스크롤한다
    requestAnimationFrame(() => expandedRef.current?.scrollIntoView({ block: 'nearest' }));
  };

  /** 병원 연락 단추를 실제로 썼다 — 직원 Slack 방에 한 줄. 같은 채널은 카드당 한 번만 알린다. */
  const reportClick = (channel: ContactChannel) => {
    trackChatCaptureMessengerClick(channel, locale);
    if (reportedRef.current.has(channel)) return;
    reportedRef.current.add(channel);
    reportContactClick(sessionToken, channel);
  };

  const handleCopy = async (panel: 'wechat' | 'email', value: string) => {
    reportClick(panel);
    if (!(await copyText(value))) return;
    setCopied(panel);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = handle.trim();
    if (!validateContactHandle(formChannel, trimmed)) {
      setError(t('captureContactInvalid'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveContact(sessionToken, formChannel, trimmed);
      trackChatContactSaved(formChannel, locale);
      onSaved();
    } catch (err) {
      if (err instanceof ChatApiError && (err.code === 'invalid_handle' || err.code === 'invalid_input')) {
        setError(t('captureContactInvalid'));
      } else {
        setError(t('captureContactFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  const mailtoHref = `mailto:${CHAT_CONTACT_EMAIL}?subject=${encodeURIComponent(
    `LIV Plastic Surgery ${codeLabel}`
  )}&body=${encodeURIComponent(prefill)}`;

  const tileClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1 rounded-xl border px-0.5 pt-2 pb-1.5 min-h-[58px] text-[11px] leading-tight transition ${
      active
        ? 'border-[#0f766e] bg-[#0f766e]/5 text-[#6d4e42] font-medium'
        : 'border-gray-200 bg-white text-gray-600 hover:border-[#0f766e]/50'
    }`;
  const tileIcon = (channel: ContactChannel) => (
    <ChannelIcon channel={channel} className={`w-7 h-7 rounded-md ${ICON_COLOR[channel]}`} />
  );
  const copyButtonClass =
    'rounded-full border border-gray-200 bg-white px-2.5 min-h-[28px] text-[11px] text-gray-600 hover:border-[#0f766e]/50 transition';
  const panelClass = 'mt-1.5 flex flex-col gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-[12px] leading-relaxed text-gray-600';

  return (
    <div className="relative my-2 rounded-lg border border-[#0f766e]/25 bg-white px-3 py-3 shadow-sm">
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t('captureDismiss')}
        className="absolute top-1 right-1 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-sm leading-none"
      >
        ✕
      </button>

      <p className="text-[13px] font-semibold text-[#6d4e42] pr-6">{t('captureHeading')}</p>
      {lead && <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{lead}</p>}

      {/* 병원으로 바로 연락하기 — 단추 네 개 */}
      <p className="text-[11px] text-gray-600 mt-2.5 font-medium">{t('captureChannelsLead')}</p>
      <div className="mt-1.5 grid grid-cols-4 gap-1.5" role="group" aria-label={t('captureChannelsLead')}>
        {linkChannels.map((c) =>
          c === 'wechat' || c === 'email' ? (
            <button
              key={c}
              type="button"
              aria-expanded={expanded === c}
              onClick={() => togglePanel(c)}
              className={tileClass(expanded === c)}
            >
              {tileIcon(c)}
              <span>{CONTACT_CHANNEL_LABELS[c]}</span>
            </button>
          ) : (
            <a
              key={c}
              href={c === 'whatsapp' ? buildWhatsAppLink(prefill) : LINE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                reportClick(c);
                setOpenedMessenger(true);
              }}
              className={tileClass(false)}
            >
              {tileIcon(c)}
              <span>{CONTACT_CHANNEL_LABELS[c]}</span>
            </a>
          )
        )}
      </div>

      {expanded === 'wechat' && (
        <div ref={expandedRef} className={panelClass}>
          <button
            type="button"
            onClick={() => {
              reportClick('wechat');
              setQrOpen(true);
            }}
            aria-label="WeChat QR"
            className="self-center rounded-lg bg-white p-1.5 cursor-zoom-in"
          >
            <Image src={WECHAT_QR_IMAGE} alt="WeChat QR" width={132} height={132} className="w-[132px] h-[132px]" />
          </button>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{t('captureWechatIdLabel')}</span>
            <span className="font-mono text-[13px] text-[#6d4e42] select-all">{WECHAT_ID}</span>
            <button
              type="button"
              onClick={() => void handleCopy('wechat', WECHAT_ID)}
              className={copyButtonClass}
              aria-live="polite"
            >
              {copied === 'wechat' ? t('captureCopied') : t('captureCopy')}
            </button>
          </div>
          <p>{t('captureWechatLead', { code: codeLabel })}</p>
        </div>
      )}

      {expanded === 'email' && (
        <div ref={expandedRef} className={panelClass}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <a
              href={mailtoHref}
              onClick={() => reportClick('email')}
              className="font-mono text-[13px] text-[#6d4e42] underline underline-offset-2 break-all"
            >
              {CHAT_CONTACT_EMAIL}
            </a>
            <button
              type="button"
              onClick={() => void handleCopy('email', CHAT_CONTACT_EMAIL)}
              className={copyButtonClass}
              aria-live="polite"
            >
              {copied === 'email' ? t('captureCopied') : t('captureCopy')}
            </button>
          </div>
          <p>{t('captureEmailLead', { code: codeLabel })}</p>
        </div>
      )}

      {openedMessenger && (
        <p className="mt-1.5 text-[11px] text-gray-500 leading-relaxed">
          {t('captureMessengerFallback', { code: codeLabel })}
        </p>
      )}

      <p className="mt-1.5 text-[10px] text-gray-400 text-center">
        {t('captureCodeInstruction', { code: codeLabel })}
      </p>

      {/* 연락처 남기기 */}
      <p className="text-[11px] text-gray-600 mt-2.5 font-medium">{t('captureContactLead')}</p>
      <form onSubmit={handleSave} className="mt-1.5 flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('captureContactLead')}>
          {CONTACT_FORM_CHANNELS.map((c) => {
            const selected = formChannel === c;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setFormChannel(c);
                  setError(null);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 min-h-[32px] rounded-full text-[11px] border transition ${
                  selected
                    ? 'bg-[#0f766e] text-white border-[#0f766e]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#0f766e]/50'
                }`}
              >
                <ChannelIcon channel={c} className={`w-3.5 h-3.5 rounded-sm ${selected ? '' : ICON_COLOR[c]}`} />
                {CONTACT_CHANNEL_LABELS[c]}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1.5">
          <input
            type={formChannel === 'whatsapp' ? 'tel' : formChannel === 'email' ? 'email' : 'text'}
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={t(PLACEHOLDER_KEY[formChannel])}
            autoComplete={formChannel === 'email' ? 'email' : formChannel === 'whatsapp' ? 'tel' : 'off'}
            maxLength={254}
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

      <p className="mt-2 text-[10px] text-gray-400 leading-relaxed">{t('capturePrivacyNote')}</p>

      <WeChatQRModal open={qrOpen} onClose={() => setQrOpen(false)} />
    </div>
  );
}
