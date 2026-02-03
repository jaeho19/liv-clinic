'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const [isVisible, setIsVisible] = useState(false);

  // 스프링 애니메이션 적용
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const handleScroll = () => {
      // 100px 이상 스크롤했을 때만 표시
      setIsVisible(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* 상단 프로그레스 바 */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left z-[60]"
        style={{
          scaleX,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ opacity: { duration: 0.3 } }}
      />

      {/* 그라데이션 글로우 효과 */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 origin-left z-[59] blur-sm"
        style={{
          scaleX,
          opacity: isVisible ? 0.5 : 0,
          background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
        }}
      />
    </>
  );
}
