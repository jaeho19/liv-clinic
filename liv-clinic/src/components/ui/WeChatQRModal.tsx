'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { WECHAT_ID, WECHAT_QR_IMAGE } from '@/lib/constants';

interface WeChatQRModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WeChatQRModal({ open, onClose }: WeChatQRModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="WeChat QR"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white text-xl hover:bg-white/30 transition-colors cursor-pointer"
            aria-label="关闭"
          >
            ✕
          </button>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-w-[90vw] max-h-[90vh] flex-col items-center gap-3 rounded-2xl bg-white p-5 sm:p-6"
          >
            <Image
              src={WECHAT_QR_IMAGE}
              alt="WeChat QR"
              width={660}
              height={660}
              className="w-auto h-auto max-w-[80vw] max-h-[70vh] object-contain"
              priority
            />
            <p className="font-mono text-lg sm:text-xl font-semibold tracking-wide text-secondary select-all">
              WeChat ID: {WECHAT_ID}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
