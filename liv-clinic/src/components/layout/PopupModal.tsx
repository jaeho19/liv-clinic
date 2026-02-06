'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { PopupRow } from '@/types/admin';

interface PopupModalProps {
  popup: PopupRow;
  onClose: () => void;
  onDismissToday: () => void;
}

export default function PopupModal({ popup, onClose, onDismissToday }: PopupModalProps) {
  const handleImageClick = () => {
    if (popup.link_url) {
      window.open(popup.link_url, popup.link_target || '_self');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-start justify-start p-3 sm:p-4 pt-4 sm:pt-6 pl-3 sm:pl-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl overflow-hidden flex flex-col shadow-lg"
          style={{
            maxWidth: `min(${popup.width || 400}px, 88vw)`,
            maxHeight: '85dvh',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors cursor-pointer text-xs"
            aria-label="닫기"
          >
            ✕
          </button>

          {/* Image area - edge to edge, no padding */}
          <div className="overflow-y-auto min-h-0">
            {popup.image_url && (
              <div
                className={popup.link_url ? 'cursor-pointer' : ''}
                onClick={handleImageClick}
              >
                <img
                  src={popup.image_url}
                  alt={popup.title}
                  className="w-full h-auto block"
                />
              </div>
            )}
          </div>

          {/* Bottom actions - blends with image */}
          <div className="flex justify-between items-center px-3 py-2 bg-black/60 backdrop-blur-sm text-xs text-white/80 shrink-0">
            <button
              onClick={onDismissToday}
              className="hover:text-white transition-colors cursor-pointer"
            >
              오늘 하루 보지 않기
            </button>
            <button
              onClick={onClose}
              className="hover:text-white transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
