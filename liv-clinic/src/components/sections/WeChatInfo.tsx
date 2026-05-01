'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import WeChatQRModal from '@/components/ui/WeChatQRModal';

const WECHAT_ID = 'livps0414';

export default function WeChatInfo() {
  const t = useTranslations('wechatPage');
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(WECHAT_ID);
      } else {
        const ta = document.createElement('textarea');
        ta.value = WECHAT_ID;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(ta);
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silent fail; user can long-press the ID text to copy manually.
    }
  };

  return (
    <section className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-[480px] mx-auto flex flex-col items-center gap-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold text-secondary">
          {t('title')}
        </h1>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative w-full max-w-[360px] aspect-square rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow cursor-zoom-in"
          aria-label={t('qrLabel')}
        >
          <Image
            src="/images/wechat-qr.png"
            alt={t('qrLabel')}
            width={400}
            height={400}
            className="w-full h-full object-contain"
            priority
          />
        </button>

        <div className="w-full flex flex-col items-center gap-2">
          <span className="text-sm text-mono-light">{t('idLabel')}</span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl sm:text-2xl font-semibold tracking-wide text-secondary select-all">
              {WECHAT_ID}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-primary hover:bg-primary/90 text-white'
              }`}
              aria-live="polite"
            >
              {copied ? t('copied') : t('copy')}
            </button>
          </div>
        </div>

        <p className="text-sm text-mono leading-relaxed mt-2">
          {t('instruction')}
        </p>
      </div>

      <WeChatQRModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
