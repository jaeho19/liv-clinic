'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import {
  sendOperatorMessage,
  closeSession,
  resolveSession,
  unresolveSession,
  ChatApiError,
  type ChatMessage,
  type VisitorLocale,
} from '@/lib/chat/chatApi';
import { buildChatRefCode } from '@/lib/chat/contactChannels';
import { trackChatClose } from '@/lib/analytics-events';

interface SessionMeta {
  id: string;
  visitor_locale: VisitorLocale;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_messenger_channel: string | null;
  visitor_messenger_handle: string | null;
  status: 'open' | 'closed' | 'abandoned';
  created_at: string;
  assigned_label: string | null;
  resolved_at: string | null;
}

// 방문자가 남긴 채널 표기 (미지의 값은 원문 그대로 — 채널 확장 대비)
function messengerLabel(channel: string | null): string {
  if (channel === 'whatsapp') return 'WhatsApp';
  if (channel === 'wechat') return 'WeChat';
  if (channel === 'line') return 'LINE';
  return channel ?? '';
}

interface Props {
  session: SessionMeta;
  initialMessages: ChatMessage[];
}

const MAX_LEN = 1000;

const LOCALE_LABEL: Record<VisitorLocale, string> = {
  en: '🇬🇧 English',
  ja: '🇯🇵 日本語',
  zh: '🇨🇳 中文',
  'zh-TW': '🇹🇼 中文(繁體)',
  vi: '🇻🇳 Tiếng Việt',
  th: '🇹🇭 ไทย',
  ru: '🇷🇺 Русский',
  fr: '🇫🇷 Français',
  mn: '🇲🇳 Монгол',
  ar: '🇸🇦 العربية',
} satisfies Record<VisitorLocale, string>;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', { hour12: false, timeZone: 'Asia/Seoul' });
}

export default function ChatDetailClient({ session, initialMessages }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionMeta['status']>(session.status);
  const [assignedLabel, setAssignedLabel] = useState<string | null>(session.assigned_label);
  const [resolvedAt, setResolvedAt] = useState<string | null>(session.resolved_at);
  const [resolving, setResolving] = useState(false);
  const [closing, setClosing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Realtime: postgres_changes 구독 (어드민은 authenticated 토큰)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`admin-chat-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((x) => x.id === m.id)) return prev;
            const next = [...prev, m].sort((a, b) =>
              a.created_at < b.created_at ? -1 : 1
            );
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_sessions', filter: `id=eq.${session.id}` },
        (payload) => {
          const s = payload.new as { status?: SessionMeta['status']; assigned_label?: string | null; resolved_at?: string | null };
          if (s.status) setSessionStatus(s.status);
          setAssignedLabel(s.assigned_label ?? null);
          setResolvedAt(s.resolved_at ?? null);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session.id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const handleClose = async () => {
    if (!window.confirm('이 대화를 종료하시겠습니까? 방문자에게 종료 안내 메시지가 전송됩니다.')) return;
    setClosing(true);
    setError(null);
    try {
      await closeSession(session.id);
      setSessionStatus('closed');
      // G-03: 어드민 종료 분석 이벤트 (PII-safe session hash, fire-and-forget)
      const durationSec = (Date.now() - new Date(session.created_at).getTime()) / 1000;
      void trackChatClose('operator_close', durationSec, session.id, session.visitor_locale);
    } catch (err) {
      if (err instanceof ChatApiError) {
        setError(`종료 실패: ${err.code}`);
      } else {
        setError('종료 실패');
      }
    } finally {
      setClosing(false);
    }
  };

  const handleResolve = async () => {
    if (
      !window.confirm(
        '이 상담을 완료로 표시할까요?\nSlack에서는 이 손님의 방이 보관함으로 들어가고, 대화 기록은 이 화면에 그대로 남습니다.\n손님에게는 아무 메시지도 가지 않습니다.'
      )
    )
      return;
    setResolving(true);
    setError(null);
    try {
      await resolveSession(session.id);
      setResolvedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof ChatApiError ? `완료 처리 실패: ${err.code}` : '완료 처리 실패');
    } finally {
      setResolving(false);
    }
  };

  const handleUnresolve = async () => {
    setResolving(true);
    setError(null);
    try {
      await unresolveSession(session.id);
      setResolvedAt(null);
    } catch (err) {
      setError(err instanceof ChatApiError ? `완료 취소 실패: ${err.code}` : '완료 취소 실패');
    } finally {
      setResolving(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_LEN || sending) return;
    setSending(true);
    setError(null);
    try {
      const created = await sendOperatorMessage(session.id, trimmed);
      setMessages((prev) => {
        if (prev.some((x) => x.id === created.id)) return prev;
        return [...prev, created].sort((a, b) =>
          a.created_at < b.created_at ? -1 : 1
        );
      });
      setText('');
    } catch (err) {
      if (err instanceof ChatApiError) {
        setError(`전송 실패: ${err.code}`);
      } else {
        setError('전송 실패');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-3 sm:mb-4">
        <Link href="/admin/chat" className="text-sm text-gray-500 hover:text-[#b4988d] inline-flex items-center min-h-[44px]">
          ← 채팅 상담 목록
        </Link>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-[#e5e5e5] bg-[#f6f6f6]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-base font-semibold text-[#6d4e42] flex flex-wrap items-baseline gap-x-2">
                <span className="truncate max-w-[200px]">{session.visitor_name || '익명'}</span>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {LOCALE_LABEL[session.visitor_locale] ?? `🌐 ${session.visitor_locale}`}
                </span>
                {/* 메신저 대화(WhatsApp 프리필 등)와 이 세션을 잇는 참조코드 */}
                <span className="text-xs text-gray-400 whitespace-nowrap font-mono">
                  #{buildChatRefCode(session.id)}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1 break-all">
                {session.visitor_email || '이메일 없음'}
                <span className="hidden sm:inline"> · 시작 {formatTime(session.created_at)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                담당: {assignedLabel ?? '미정'}
              </div>
              {session.visitor_messenger_handle && (
                <div className="text-xs text-emerald-700 mt-0.5 break-all">
                  📱 {messengerLabel(session.visitor_messenger_channel)}{' '}
                  {session.visitor_messenger_handle}
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(session.visitor_messenger_handle ?? '');
                    }}
                    className="ml-2 text-[11px] text-gray-400 underline underline-offset-2"
                  >
                    복사
                  </button>
                </div>
              )}
              <div className="text-[11px] text-gray-400 mt-0.5 sm:hidden">
                시작 {formatTime(session.created_at)}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`text-xs px-2 py-1 rounded-md whitespace-nowrap ${
                  sessionStatus !== 'open'
                    ? 'bg-gray-100 text-gray-500'
                    : resolvedAt
                    ? 'bg-[#b4988d]/10 text-[#6d4e42] border border-[#b4988d]/30'
                    : 'bg-green-50 text-green-700 border border-green-100'
                }`}
              >
                {sessionStatus !== 'open' ? '종료' : resolvedAt ? '완료' : '진행 중'}
              </span>
              {sessionStatus === 'open' && !resolvedAt && (
                <button
                  type="button"
                  onClick={() => void handleResolve()}
                  disabled={resolving}
                  className="text-xs px-3 min-h-[32px] rounded-md bg-[#b4988d] text-white hover:bg-[#a3877d] disabled:opacity-50 transition whitespace-nowrap"
                >
                  {resolving ? '처리 중...' : '완료 처리'}
                </button>
              )}
              {sessionStatus === 'open' && resolvedAt && (
                <button
                  type="button"
                  onClick={() => void handleUnresolve()}
                  disabled={resolving}
                  className="text-xs px-3 min-h-[32px] rounded-md border border-[#b4988d] text-[#6d4e42] hover:bg-[#b4988d]/10 disabled:opacity-50 transition whitespace-nowrap"
                >
                  {resolving ? '처리 중...' : '완료 취소'}
                </button>
              )}
              {sessionStatus === 'open' && (
                <button
                  type="button"
                  onClick={() => void handleClose()}
                  disabled={closing}
                  className="text-xs px-3 min-h-[32px] rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition whitespace-nowrap"
                >
                  {closing ? '보내는 중...' : '상담 종료 안내 보내기'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="h-[55dvh] sm:h-[55vh] min-h-[300px] overflow-y-auto px-3 sm:px-4 py-3 bg-white">
          {messages.length === 0 && (
            <div className="text-xs text-gray-400 text-center py-6">메시지가 없습니다.</div>
          )}
          {messages.map((m) => (
            <AdminMessageRow key={m.id} message={m} />
          ))}
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-[#e5e5e5] px-3 sm:px-4 py-3 bg-white flex flex-col gap-2"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void handleSubmit(e as unknown as FormEvent);
              }
            }}
            placeholder="한국어로 입력하세요. 자동으로 방문자 언어로 번역됩니다."
            rows={3}
            disabled={sessionStatus !== 'open'}
            enterKeyHint="enter"
            className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#b4988d] resize-none max-h-[200px] disabled:bg-gray-50 disabled:text-gray-400"
          />
          <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
            <span className="hidden sm:inline">{text.length}/{MAX_LEN} · Ctrl/⌘+Enter 전송</span>
            <span className="sm:hidden">{text.length}/{MAX_LEN}</span>
            <button
              type="submit"
              disabled={
                sending ||
                text.trim().length === 0 ||
                text.length > MAX_LEN ||
                sessionStatus !== 'open'
              }
              className="bg-[#b4988d] text-white text-sm font-medium px-5 min-h-[44px] rounded-md hover:bg-[#a3877d] disabled:opacity-50 transition flex-shrink-0"
            >
              {sending ? '전송 중...' : '전송'}
            </button>
          </div>
          {error && <div className="text-xs text-red-500">{error}</div>}
        </form>
      </div>
    </div>
  );
}

function AdminMessageRow({ message }: { message: ChatMessage }) {
  if (message.sender === 'system') {
    return (
      <div className="my-2 mx-auto max-w-[80%] text-center">
        <div className="inline-block rounded-md bg-yellow-50 px-3 py-1.5 text-[11px] text-yellow-900 border border-yellow-100">
          {message.original_text}
        </div>
      </div>
    );
  }

  const isOperator = message.sender === 'operator';
  const align = isOperator ? 'items-end' : 'items-start';

  // 한국어 메인 노출 (어드민은 한국어 컨텍스트)
  // - visitor 메시지: original_lang ∈ {en,ja,zh}, translated to ko → 한국어 번역을 메인으로
  // - operator 메시지: 한국어 원문을 그대로
  const koText =
    isOperator
      ? message.original_text
      : message.translation_status === 'success' && message.translated_text
      ? message.translated_text
      : message.original_text;

  const originalText = isOperator ? message.translated_text : message.original_text;
  const failed = message.translation_status === 'failed';

  return (
    <div className={`my-2 flex flex-col ${align}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
          isOperator ? 'bg-[#b4988d] text-white' : 'bg-gray-100 text-[#575756]'
        }`}
      >
        {koText}
      </div>
      {originalText && originalText !== koText && (
        <div
          className={`mt-1 max-w-[80%] rounded-xl px-3 py-1.5 text-xs border whitespace-pre-wrap break-words ${
            isOperator
              ? 'bg-[#b4988d]/10 text-[#6d4e42] border-[#b4988d]/30 border-dashed'
              : 'bg-gray-50 text-gray-500 border-gray-200 border-dashed'
          }`}
        >
          <span className="text-[10px] text-gray-400 uppercase mr-1">
            {(isOperator ? message.translated_lang : message.original_lang) ?? ''}
          </span>
          {originalText}
        </div>
      )}
      {failed && (
        <div className="mt-0.5 text-[11px] text-red-500">(번역 실패 — 원문만 저장됨)</div>
      )}
      <div className="mt-0.5 text-[10px] text-gray-400">
        {isOperator && (
          <span className="mr-1">
            {message.source === 'auto'
              ? '자동 안내'
              : message.source === 'slack'
              ? `Slack · ${message.sender_label ?? 'Slack 직원'}`
              : '관리자 화면'}
            {' · '}
          </span>
        )}
        {formatTime(message.created_at)}
      </div>
    </div>
  );
}
