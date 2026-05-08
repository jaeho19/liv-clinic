'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ChatMessage } from '@/lib/chat/chatApi';

interface Props {
  message: ChatMessage;
  visitorLocale: 'en' | 'ja' | 'zh';
}

export default function MessageBubble({ message, visitorLocale }: Props) {
  const t = useTranslations('chat');
  const [showOriginal, setShowOriginal] = useState(false);

  if (message.sender === 'system') {
    return (
      <div className="my-2 mx-auto max-w-[90%] text-center">
        <div className="inline-block rounded-md bg-yellow-50 px-3 py-2 text-xs text-yellow-900 border border-yellow-100">
          {message.original_text}
        </div>
      </div>
    );
  }

  const isVisitor = message.sender === 'visitor';
  const align = isVisitor ? 'items-end' : 'items-start';
  const bubbleColor = isVisitor
    ? 'bg-[#b4988d] text-white'
    : 'bg-gray-100 text-[#575756]';

  // 방문자 메시지(visitorLocale 원문) → 한국어 번역, 운영자 메시지(ko 원문) → visitorLocale 번역
  // 위젯 사용자(방문자)는 자기 언어로 보여줘야 함.
  // - visitor 본인 메시지: 원문(자기 언어) 메인. 토글로 한국어 확인 가능
  // - operator 메시지: 번역(자기 언어) 메인. 토글로 한국어 원문 확인 가능
  const primary =
    message.sender === 'visitor'
      ? message.original_text
      : message.translation_status === 'success' && message.translated_text
      ? message.translated_text
      : message.original_text;

  const secondary =
    message.sender === 'visitor'
      ? message.translated_text
      : message.original_text;

  const failed = message.translation_status === 'failed';
  const showSecondary =
    !failed && secondary !== null && secondary !== undefined && secondary !== primary;

  void visitorLocale;

  return (
    <div className={`my-1.5 flex flex-col ${align}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${bubbleColor} whitespace-pre-wrap break-words`}
      >
        {primary}
      </div>
      {failed && (
        <div className="mt-0.5 text-[11px] text-red-500">{t('translationFailed')}</div>
      )}
      {showSecondary && (
        <button
          type="button"
          onClick={() => setShowOriginal((v) => !v)}
          className="mt-1 text-[11px] text-gray-400 hover:text-gray-600 transition"
        >
          {showOriginal ? t('hideOriginal') : t('showOriginal')}
        </button>
      )}
      {showSecondary && showOriginal && (
        <div
          className={`mt-1 max-w-[85%] rounded-xl px-3 py-1.5 text-xs ${
            isVisitor ? 'bg-[#b4988d]/10 text-[#6d4e42]' : 'bg-gray-50 text-gray-500'
          } border border-dashed ${
            isVisitor ? 'border-[#b4988d]/30' : 'border-gray-200'
          } whitespace-pre-wrap break-words`}
        >
          {secondary}
        </div>
      )}
    </div>
  );
}
