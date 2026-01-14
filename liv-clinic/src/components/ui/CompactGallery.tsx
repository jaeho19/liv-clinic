'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
}

interface CompactGalleryProps {
  images: GalleryImage[];
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
}

/**
 * 가로 스크롤 갤러리 컴포넌트
 * 모바일에서 스크롤, 데스크톱에서 그리드
 */
export default function CompactGallery({
  images,
  className = '',
  aspectRatio = 'square',
}: CompactGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'video':
        return 'aspect-video';
      case 'portrait':
        return 'aspect-[3/4]';
      default:
        return 'aspect-square';
    }
  };

  return (
    <>
      <div
        className={`
          flex overflow-x-auto gap-4 -mx-6 px-6 pb-4
          md:grid md:grid-cols-3 md:overflow-visible md:mx-0 md:px-0 md:pb-0 md:gap-6
          scrollbar-hide scroll-snap-x-mandatory
          ${className}
        `}
      >
        {images.map((image, index) => (
          <motion.div
            key={index}
            className={`
              flex-shrink-0 w-[85vw] md:w-auto scroll-snap-center
              cursor-pointer
            `}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedImage(image)}
          >
            <div className={`relative ${getAspectClass()} rounded-2xl overflow-hidden bg-gray-100`}>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 85vw, 33vw"
              />
            </div>
            {image.caption && (
              <p className="mt-2 text-sm text-gray-600 text-center">{image.caption}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl w-full max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt}
                width={1200}
                height={800}
                className="object-contain w-full h-auto max-h-[80vh]"
              />
              {selectedImage.caption && (
                <p className="mt-4 text-white text-center">{selectedImage.caption}</p>
              )}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 text-white p-2"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
