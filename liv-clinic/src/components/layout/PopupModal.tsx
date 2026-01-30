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
        className="fixed inset-0 z-[9999] flex items-start justify-start p-4 pt-6 pl-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-2xl overflow-hidden"
          style={{ width: '100%', maxWidth: popup.width || 480 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <div className="flex justify-end p-2">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer text-lg"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>

          {/* Image */}
          {popup.image_url && (
            <div
              className={popup.link_url ? 'cursor-pointer' : ''}
              onClick={handleImageClick}
            >
              <img
                src={popup.image_url}
                alt={popup.title}
                className="w-full"
              />
            </div>
          )}

          {/* Bottom actions */}
          <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <button
              onClick={onDismissToday}
              className="hover:text-gray-700 transition-colors cursor-pointer"
            >
              오늘 하루 보지 않기
            </button>
            <button
              onClick={onClose}
              className="hover:text-gray-700 transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
