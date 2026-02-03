'use client';

import { type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  fadeInUp,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  staggerContainer,
  fadeInUpSmooth,
  fadeInUpLarge,
  fadeInDownSmooth,
  fadeInScale,
  fadeInBlur,
  slideInLeft,
  slideInRight,
  flipInX,
  flipInY,
  zoomInUp,
  bounceIn,
  textReveal,
} from '@/lib/animations';

type AnimationType =
  | 'fadeInUp'
  | 'fadeInLeft'
  | 'fadeInRight'
  | 'scaleIn'
  | 'stagger'
  | 'fadeInUpSmooth'
  | 'fadeInUpLarge'
  | 'fadeInDownSmooth'
  | 'fadeInScale'
  | 'fadeInBlur'
  | 'slideInLeft'
  | 'slideInRight'
  | 'flipInX'
  | 'flipInY'
  | 'zoomInUp'
  | 'bounceIn'
  | 'textReveal';

interface AnimateOnScrollProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  margin?: string;
  /** Viewport amount (0-1) that needs to be visible to trigger animation */
  amount?: number;
}

const animationVariants: Record<AnimationType, Variants> = {
  fadeInUp,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  stagger: staggerContainer,
  fadeInUpSmooth,
  fadeInUpLarge,
  fadeInDownSmooth,
  fadeInScale,
  fadeInBlur,
  slideInLeft,
  slideInRight,
  flipInX,
  flipInY,
  zoomInUp,
  bounceIn,
  textReveal,
};

export default function AnimateOnScroll({
  children,
  animation = 'fadeInUp',
  delay = 0,
  duration,
  className,
  once = true,
  margin = '-100px',
  amount = 0.1,
}: AnimateOnScrollProps) {
  const variants = animationVariants[animation];

  // Add delay and custom duration to the visible transition
  const customVariants: Variants = {
    ...variants,
    visible: {
      ...(variants.visible as object),
      transition: {
        ...(typeof variants.visible === 'object' && 'transition' in variants.visible
          ? variants.visible.transition
          : {}),
        delay,
        ...(duration && { duration }),
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin, amount }}
      variants={customVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger children wrapper
interface StaggerChildrenProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerChildren({
  children,
  className,
  staggerDelay = 0.1,
}: StaggerChildrenProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger item wrapper
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'scale' | 'smooth';
}

export function StaggerItem({ children, className, variant = 'default' }: StaggerItemProps) {
  // Enhanced easing for smoother animations
  const easeOutCubic = [0.33, 1, 0.68, 1] as const;
  const easeOutQuart = [0.25, 1, 0.5, 1] as const;

  const variants = {
    default: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.6, ease: easeOutCubic },
    },
    scale: {
      initial: { opacity: 0, scale: 0.9, y: 20 },
      animate: { opacity: 1, scale: 1, y: 0 },
      transition: { duration: 0.5, ease: easeOutQuart },
    },
    smooth: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.6, ease: easeOutCubic },
    },
  };

  const selectedVariant = variants[variant];

  return (
    <motion.div
      initial={selectedVariant.initial}
      whileInView={selectedVariant.animate}
      viewport={{ once: true, amount: 0.1 }}
      transition={selectedVariant.transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
