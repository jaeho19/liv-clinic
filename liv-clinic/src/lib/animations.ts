import { type Variants } from 'framer-motion';

// Fade animations
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

// Scale animations
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// Stagger container
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

// Stagger items
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// Hero text animation
export const heroText: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Slide animations for menu (deprecated - use slideInLeftMenu/slideInRightMenu instead)
export const slideInRightMenu: Variants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: { type: 'tween', duration: 0.3 },
  },
  exit: {
    x: '100%',
    transition: { type: 'tween', duration: 0.3 },
  },
};

export const slideInLeftMenu: Variants = {
  hidden: { x: '-100%' },
  visible: {
    x: 0,
    transition: { type: 'tween', duration: 0.3 },
  },
  exit: {
    x: '-100%',
    transition: { type: 'tween', duration: 0.3 },
  },
};

// Viewport config for scroll animations
export const viewportConfig = {
  once: true,
  margin: '-100px',
};

// Scroll-linked animations helper
export const scrollFadeIn = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: viewportConfig,
  transition: { duration: 0.6, ease: 'easeOut' },
};

// Page transition
export const pageTransition: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
};

// Button hover animation
export const buttonHover = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

export const buttonTap = {
  scale: 0.98,
};

// Card hover animation
export const cardHover = {
  y: -8,
  transition: { duration: 0.3, ease: 'easeOut' },
};

// Image reveal
export const imageReveal: Variants = {
  hidden: {
    clipPath: 'inset(0 100% 0 0)',
    opacity: 0,
  },
  visible: {
    clipPath: 'inset(0 0% 0 0)',
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Counter animation helper
export const counterAnimation = {
  duration: 2,
  ease: 'easeOut',
};

// ===== Enhanced Scroll Animations (AOS-style) =====

// Smooth cubic bezier easing functions
export const easeOutCubic = [0.33, 1, 0.68, 1] as const;
export const easeInOutCubic = [0.65, 0, 0.35, 1] as const;
export const easeOutQuart = [0.25, 1, 0.5, 1] as const;
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;

// Enhanced Fade In Up with better easing
export const fadeInUpSmooth: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: easeOutCubic
    },
  },
};

// Fade In Up Large (for big elements)
export const fadeInUpLarge: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      ease: easeOutExpo
    },
  },
};

// Fade In Down Smooth
export const fadeInDownSmooth: Variants = {
  hidden: { opacity: 0, y: -40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: easeOutCubic
    },
  },
};

// Fade In with Scale (zoom effect)
export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: easeOutQuart
    },
  },
};

// Fade In with Blur (modern effect)
export const fadeInBlur: Variants = {
  hidden: { opacity: 0, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      ease: easeOutCubic
    },
  },
};

// Slide and Fade from Left (with overshoot)
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.9,
      ease: easeOutCubic,
      opacity: { duration: 0.6 }
    },
  },
};

// Slide and Fade from Right (with overshoot)
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.9,
      ease: easeOutCubic,
      opacity: { duration: 0.6 }
    },
  },
};

// Flip In X (card flip effect)
export const flipInX: Variants = {
  hidden: { opacity: 0, rotateX: -90, transformPerspective: 1000 },
  visible: {
    opacity: 1,
    rotateX: 0,
    transition: {
      duration: 0.8,
      ease: easeOutQuart
    },
  },
};

// Flip In Y (horizontal flip)
export const flipInY: Variants = {
  hidden: { opacity: 0, rotateY: -90, transformPerspective: 1000 },
  visible: {
    opacity: 1,
    rotateY: 0,
    transition: {
      duration: 0.8,
      ease: easeOutQuart
    },
  },
};

// Zoom In from Bottom (dramatic entrance)
export const zoomInUp: Variants = {
  hidden: { opacity: 0, scale: 0.7, y: 50 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: easeOutCubic
    },
  },
};

// Bounce In (playful effect)
export const bounceIn: Variants = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: easeOutCubic,
      scale: {
        type: 'spring',
        damping: 10,
        stiffness: 100,
      }
    },
  },
};

// Enhanced Stagger Containers with different speeds
export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

export const staggerContainerVeryFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

// Enhanced Stagger Item with smooth easing
export const staggerItemSmooth: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: easeOutCubic
    },
  },
};

// Stagger Item with Scale
export const staggerItemScale: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easeOutQuart
    },
  },
};

// Parallax effect helper
export const parallaxScroll = (scrollY: number, speed: number = 0.5) => {
  return scrollY * speed;
};

// Text reveal animation (for headings)
export const textReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)',
  },
  visible: {
    opacity: 1,
    y: 0,
    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
    transition: {
      duration: 0.8,
      ease: easeOutCubic,
      clipPath: { duration: 0.6 }
    },
  },
};
