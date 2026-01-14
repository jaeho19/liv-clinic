'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';
import {
  AnimateOnScroll,
  StaggerChildren,
  StaggerItem,
  Button,
  Card,
  ScrollLink,
  StickyCtaBar,
  TabSection,
  CollapsibleSection,
  ExpandableList,
  SectionHeader,
} from '@/components/ui';
import { TREATMENTS, MEDICAL_QA } from '@/lib/constants';

// SVG Icons
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const FDAIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const WaveIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// Enhanced Illustrated Cards for Why Ulthera Section
const FDAIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-full h-40">
    <defs>
      <linearGradient id="fdaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#b4988d" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.3" />
      </linearGradient>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#b4988d" />
      </linearGradient>
    </defs>
    {/* Background circle */}
    <circle cx="100" cy="80" r="70" fill="url(#fdaGrad)" />
    {/* Shield */}
    <motion.path
      d="M100 25 L140 45 L140 85 C140 110 120 130 100 140 C80 130 60 110 60 85 L60 45 Z"
      fill="url(#shieldGrad)"
      initial={{ scale: 0.9, opacity: 0.8 }}
      animate={{ scale: [0.9, 1, 0.9], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 3, repeat: Infinity }}
    />
    {/* Check mark */}
    <motion.path
      d="M80 80 L95 95 L125 65"
      fill="none"
      stroke="white"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
    />
    {/* Stars */}
    <motion.circle cx="50" cy="40" r="3" fill="#D4AF37" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
    <motion.circle cx="150" cy="50" r="2" fill="#D4AF37" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
    <motion.circle cx="160" cy="100" r="2.5" fill="#D4AF37" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }} />
  </svg>
);

const DeepSEEIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-full h-40">
    <defs>
      <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1a1a2e" />
        <stop offset="100%" stopColor="#2d2d44" />
      </linearGradient>
      <linearGradient id="scanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
      </linearGradient>
    </defs>
    {/* Monitor frame */}
    <rect x="30" y="20" width="140" height="100" rx="8" fill="url(#screenGrad)" />
    <rect x="40" y="30" width="120" height="80" rx="4" fill="#0a0a15" />
    {/* Scan lines */}
    <motion.rect
      x="45" y="35" width="110" height="4"
      fill="url(#scanGrad)"
      initial={{ y: 35 }}
      animate={{ y: [35, 100, 35] }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    />
    {/* Skin layer visualization */}
    <rect x="50" y="45" width="100" height="15" fill="#f5e6df" opacity="0.8" rx="2" />
    <rect x="50" y="62" width="100" height="20" fill="#e8d4c8" opacity="0.8" rx="2" />
    <rect x="50" y="84" width="100" height="20" fill="#b4988d" opacity="0.8" rx="2" />
    {/* Focus points */}
    <motion.circle cx="80" cy="72" r="4" fill="#D4AF37" animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }} />
    <motion.circle cx="120" cy="94" r="5" fill="#D4AF37" animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }} />
    {/* Monitor stand */}
    <rect x="85" y="120" width="30" height="8" fill="#6d4e42" rx="2" />
    <rect x="75" y="128" width="50" height="6" fill="#6d4e42" rx="3" />
    {/* "LIVE" indicator */}
    <motion.circle cx="155" cy="35" r="4" fill="#4ade80" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }} />
  </svg>
);

const SMASIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-full h-40">
    <defs>
      <linearGradient id="depthGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f5e6df" />
        <stop offset="50%" stopColor="#d4b8a8" />
        <stop offset="100%" stopColor="#b4988d" />
      </linearGradient>
      <radialGradient id="energyRadial" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
      </radialGradient>
    </defs>
    {/* Face silhouette */}
    <ellipse cx="100" cy="85" rx="50" ry="65" fill="url(#depthGrad)" />
    {/* Depth layers */}
    <ellipse cx="100" cy="85" rx="45" ry="58" fill="none" stroke="#e8d4c8" strokeWidth="1" strokeDasharray="4 2" />
    <ellipse cx="100" cy="85" rx="38" ry="48" fill="none" stroke="#d4b8a8" strokeWidth="1" strokeDasharray="4 2" />
    <ellipse cx="100" cy="85" rx="30" ry="38" fill="none" stroke="#b4988d" strokeWidth="2" />
    {/* Energy targeting */}
    <motion.circle
      cx="100" cy="85" r="15"
      fill="url(#energyRadial)"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: [0.5, 2, 0.5], opacity: [0, 0.8, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    {/* Depth indicator arrow */}
    <motion.g initial={{ y: -5 }} animate={{ y: [- 5, 5, -5] }} transition={{ duration: 2, repeat: Infinity }}>
      <line x1="165" y1="40" x2="165" y2="130" stroke="#D4AF37" strokeWidth="2" />
      <polygon points="165,130 160,120 170,120" fill="#D4AF37" />
      <text x="175" y="90" fill="#6d4e42" fontSize="10" fontWeight="bold">4.5mm</text>
    </motion.g>
    {/* Label */}
    <text x="100" y="150" fill="#6d4e42" fontSize="11" fontWeight="bold" textAnchor="middle">SMAS Layer</text>
  </svg>
);

// Image Placeholder Component
const ImagePlaceholder = ({ label, aspectRatio = "square" }: { label: string; aspectRatio?: "square" | "wide" | "tall" }) => {
  const ratioClasses = {
    square: "aspect-square",
    wide: "aspect-video",
    tall: "aspect-[3/4]"
  };

  return (
    <div className={`relative ${ratioClasses[aspectRatio]} rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10`}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        <svg className="w-16 h-16 text-primary/30 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-mono-light text-sm text-center">{label}</p>
      </div>
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/10" />
      <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-secondary/10" />
    </div>
  );
};

// Skin Layer Diagram Component
const SkinLayerDiagram = () => (
  <div className="relative w-full max-w-xl mx-auto">
    <svg viewBox="0 0 400 300" className="w-full h-auto">
      {/* Background gradient */}
      <defs>
        <linearGradient id="skinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f5e6df" />
          <stop offset="33%" stopColor="#e8d4c8" />
          <stop offset="66%" stopColor="#d4b8a8" />
          <stop offset="100%" stopColor="#b4988d" />
        </linearGradient>
        <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#b4988d" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Skin layers */}
      <rect x="50" y="30" width="300" height="40" fill="#f5e6df" stroke="#e5e5e5" strokeWidth="1" rx="4" />
      <rect x="50" y="70" width="300" height="70" fill="#e8d4c8" stroke="#e5e5e5" strokeWidth="1" rx="4" />
      <rect x="50" y="140" width="300" height="60" fill="#d4b8a8" stroke="#e5e5e5" strokeWidth="1" rx="4" />
      <rect x="50" y="200" width="300" height="70" fill="#b4988d" stroke="#e5e5e5" strokeWidth="1" rx="4" />

      {/* Layer labels */}
      <text x="370" y="55" className="text-xs fill-mono" textAnchor="end">표피</text>
      <text x="370" y="110" className="text-xs fill-mono" textAnchor="end">진피 상층</text>
      <text x="370" y="175" className="text-xs fill-mono" textAnchor="end">진피 하층</text>
      <text x="370" y="240" className="text-xs fill-mono" textAnchor="end">SMAS층</text>

      {/* Depth markers */}
      <line x1="30" y1="70" x2="45" y2="70" stroke="#b4988d" strokeWidth="2" />
      <text x="25" y="74" className="text-xs fill-primary font-medium" textAnchor="end">1.5mm</text>

      <line x1="30" y1="140" x2="45" y2="140" stroke="#b4988d" strokeWidth="2" />
      <text x="25" y="144" className="text-xs fill-primary font-medium" textAnchor="end">3.0mm</text>

      <line x1="30" y1="200" x2="45" y2="200" stroke="#b4988d" strokeWidth="2" />
      <text x="25" y="204" className="text-xs fill-primary font-medium" textAnchor="end">4.5mm</text>

      {/* Energy focal points */}
      <motion.circle
        cx="150" cy="70" r="8"
        fill="url(#energyGradient)"
        initial={{ scale: 0.8, opacity: 0.6 }}
        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.circle
        cx="200" cy="140" r="10"
        fill="url(#energyGradient)"
        initial={{ scale: 0.8, opacity: 0.6 }}
        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
      <motion.circle
        cx="250" cy="220" r="12"
        fill="url(#energyGradient)"
        initial={{ scale: 0.8, opacity: 0.6 }}
        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      />

      {/* Ultrasound wave lines */}
      <motion.path
        d="M150 30 L150 70"
        stroke="#D4AF37"
        strokeWidth="2"
        strokeDasharray="4 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.path
        d="M200 30 L200 140"
        stroke="#D4AF37"
        strokeWidth="2"
        strokeDasharray="4 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
      />
      <motion.path
        d="M250 30 L250 220"
        stroke="#D4AF37"
        strokeWidth="2"
        strokeDasharray="4 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
      />
    </svg>
  </div>
);

// Collagen Timeline Component
const CollagenTimeline = () => {
  const timelineData = [
    { time: '시술 직후', effect: '콜라겐 수축', desc: '즉각적 타이트닝', percent: 20 },
    { time: '1개월', effect: '신생 콜라겐', desc: 'Type III 생성 시작', percent: 40 },
    { time: '3개월', effect: '눈에 띄는 변화', desc: '턱선 선명해짐', percent: 70 },
    { time: '6개월', effect: '최대 효과', desc: 'Type I 콜라겐 성숙', percent: 100 },
    { time: '12-24개월', effect: '효과 유지', desc: '점진적 유지', percent: 85 },
  ];

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-0 right-0 top-1/2 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30 rounded-full" />

      {/* Timeline points */}
      <div className="relative flex justify-between">
        {timelineData.map((item, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15 }}
          >
            {/* Top label */}
            <div className="text-center mb-4 h-16">
              <p className="text-small font-medium text-secondary">{item.effect}</p>
              <p className="text-xs text-mono-light">{item.desc}</p>
            </div>

            {/* Circle indicator */}
            <motion.div
              className="w-4 h-4 rounded-full bg-primary border-4 border-white shadow-lg z-10"
              whileHover={{ scale: 1.5 }}
            />

            {/* Bottom label */}
            <div className="mt-4 text-center">
              <p className="text-small font-medium text-primary">{item.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Comparison Table Component
const ComparisonTable = () => {
  const comparisonData = [
    { feature: '에너지 종류', ulthera: 'MFU-V (초음파)', shurink: 'HIFU (초음파)', thermage: 'RF (고주파)' },
    { feature: '실시간 시각화', ulthera: 'DeepSEE O', shurink: 'X', thermage: 'X' },
    { feature: 'FDA 리프팅 승인', ulthera: '유일하게 승인', shurink: 'X', thermage: 'X' },
    { feature: '최대 깊이', ulthera: '4.5mm (SMAS)', shurink: '4.5mm', thermage: '진피층' },
    { feature: '임상 연구', ulthera: '110+ 논문', shurink: '소수', thermage: '다수' },
    { feature: '효과 지속', ulthera: '1-2년', shurink: '6-12개월', thermage: '6-12개월' },
    { feature: '최적 적응증', ulthera: '심한 처짐/리프팅', shurink: '유지관리', thermage: '탄력/피부결' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b-2 border-primary/20">
            <th className="py-4 px-4 text-left text-h4 text-secondary">비교 항목</th>
            <th className="py-4 px-4 text-center bg-primary/5 rounded-t-lg">
              <span className="text-h4 text-primary">울쎄라피 프라임</span>
            </th>
            <th className="py-4 px-4 text-center text-h4 text-mono-light">슈링크/더블로</th>
            <th className="py-4 px-4 text-center text-h4 text-mono-light">써마지</th>
          </tr>
        </thead>
        <tbody>
          {comparisonData.map((row, index) => (
            <motion.tr
              key={index}
              className="border-b border-border hover:bg-background/50 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <td className="py-4 px-4 text-body font-medium text-secondary">{row.feature}</td>
              <td className="py-4 px-4 text-center bg-primary/5 text-body text-primary font-medium">{row.ulthera}</td>
              <td className="py-4 px-4 text-center text-body text-mono">{row.shurink}</td>
              <td className="py-4 px-4 text-center text-body text-mono">{row.thermage}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Process Step Component
const ProcessStep = ({ step, title, desc, isLast }: { step: number; title: string; desc: string; isLast?: boolean }) => (
  <motion.div
    className="relative flex flex-col items-center text-center"
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: step * 0.1 }}
  >
    {/* Connector line */}
    {!isLast && (
      <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-primary to-primary/30" />
    )}

    {/* Step circle */}
    <motion.div
      className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center text-xl font-serif shadow-lg"
      whileHover={{ scale: 1.1 }}
    >
      {step}
    </motion.div>

    {/* Content */}
    <div className="mt-4">
      <h4 className="text-h4 text-secondary mb-2">{title}</h4>
      <p className="text-small text-mono-light max-w-[150px]">{desc}</p>
    </div>
  </motion.div>
);

// Main Component
// Transducer data for interactive section
interface Transducer {
  id: string;
  name: string;
  depth: string;
  frequency: string;
  target: string;
  applications: string[];
  image: string;
  color: string;
}

const TRANSDUCERS: Transducer[] = [
  {
    id: 'ds-10-1.5',
    name: 'DS 10-1.5',
    depth: '1.5mm',
    frequency: '10 MHz',
    target: '표피-진피 경계',
    applications: ['미세주름', '눈가', '입가', '피부결'],
    image: '/images/lifting/ulthera/transducers/ds-10-1.5.jpg',
    color: '#E8D5C4',
  },
  {
    id: 'ds-10-1.5-n',
    name: 'DS 10-1.5N',
    depth: '1.5mm',
    frequency: '10 MHz',
    target: '협소한 부위',
    applications: ['눈주름', '눈밑', '눈꺼풀'],
    image: '/images/lifting/ulthera/transducers/ds-10-1.5-n.jpg',
    color: '#E8D5C4',
  },
  {
    id: 'ds-7-3.0',
    name: 'DS 7-3.0',
    depth: '3.0mm',
    frequency: '7 MHz',
    target: '진피 하층',
    applications: ['볼', '이마', '광대', '턱선'],
    image: '/images/lifting/ulthera/transducers/ds-7-3.0.jpg',
    color: '#C4A484',
  },
  {
    id: 'ds-7-3.0-n',
    name: 'DS 7-3.0N',
    depth: '3.0mm',
    frequency: '7 MHz',
    target: '협소한 진피층',
    applications: ['눈가주름', '입가', '손등'],
    image: '/images/lifting/ulthera/transducers/ds-7-3.0-n.jpg',
    color: '#C4A484',
  },
  {
    id: 'ds-4-4.5',
    name: 'DS 4-4.5',
    depth: '4.5mm',
    frequency: '4 MHz',
    target: 'SMAS층',
    applications: ['중안면', '하안면', '목', '데콜테'],
    image: '/images/lifting/ulthera/transducers/ds-4-4.5.jpg',
    color: '#D4AF37',
  },
  {
    id: 'ds-7-4.5',
    name: 'DS 7-4.5',
    depth: '4.5mm',
    frequency: '7 MHz',
    target: '고해상도 SMAS',
    applications: ['턱선', '이중턱', '볼처짐'],
    image: '/images/lifting/ulthera/transducers/ds-7-4.5.jpg',
    color: '#D4AF37',
  },
];

export default function UltheraDetail() {
  const treatment = TREATMENTS.lifting.ulthera;
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeTransducer, setActiveTransducer] = useState<string | null>(null);

  const relatedMedicalQA = MEDICAL_QA.filter((qa) =>
    qa.relatedTreatments?.some((id) => id === 'ulthera')
  );

  const toggleFaq = useCallback((index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  }, [expandedFaq]);

  // Extended FAQ data
  const extendedFaqs = [
    ...treatment.faqs,
    {
      q: '울쎄라피 프라임 시술 후 바로 일상생활이 가능한가요?',
      a: '네, 울쎄라피 프라임은 비침습적 시술로 다운타임이 거의 없습니다. 시술 직후 약간의 홍조나 붓기가 있을 수 있지만 대부분 당일 내 사라집니다. 메이크업도 바로 가능하며, 일상생활에 지장이 없습니다.'
    },
    {
      q: '울쎄라피 프라임과 써마지를 함께 받아도 되나요?',
      a: '네, 울쎄라피 프라임과 써마지는 상호 보완적인 시술로 병합하면 시너지 효과를 볼 수 있습니다. 울쎄라피 프라임은 SMAS층의 깊은 리프팅을, 써마지는 표피~진피층의 탄력 개선에 효과적입니다. 일반적으로 3개월 간격을 두고 시술합니다.'
    },
    {
      q: '울쎄라피 프라임 정품 확인은 어떻게 하나요?',
      a: '리브성형외과는 멀츠 코리아 공식 인증 클리닉입니다. 시술 시 정품 트랜스듀서의 시리얼 번호를 확인하실 수 있으며, 실제 조사된 샷 수도 투명하게 공개해드립니다.'
    },
  ];

  return (
    <>
      {/* Sticky CTA Bar (Mobile Only) */}
      <StickyCtaBar phoneNumber="02-797-2773" />

      {/* Hero Section - Premium Full Screen with Video */}
      <section className="relative min-h-[70vh] md:min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#f9f6f3] via-background to-secondary/5" />

        {/* Animated background elements with gold accents */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-[#D4AF37]/5 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        />
        <motion.div
          className="absolute top-1/3 left-1/3 w-32 h-32 rounded-full bg-[#D4AF37]/10 blur-2xl"
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <AnimateOnScroll animation="fadeInLeft">
              <div>
                {/* FDA Badge with gold accent */}
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-xl rounded-full shadow-lg border border-[#D4AF37]/20 mb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-primary"><FDAIcon /></span>
                  <span className="text-small font-medium text-secondary">FDA 유일 승인 리프팅 장비</span>
                </motion.div>

                {/* Gold accent line */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-px bg-gradient-to-r from-[#D4AF37] to-transparent" />
                  <span className="text-xs tracking-[0.3em] text-[#D4AF37] uppercase font-medium">Premium Lifting</span>
                </div>
                <p className="font-serif text-h2 text-primary mb-3 tracking-wide">Ultherapy Prime</p>
                <h1 className="text-display text-secondary mb-4 leading-tight">
                  울쎄라피 프라임
                </h1>
                <p className="font-serif text-xl text-mono-light mb-6 italic">
                  {treatment.tagline}
                </p>
                <p className="text-h4 text-mono leading-relaxed mb-8 max-w-lg">
                  피부 깊은 층 SMAS까지 도달하는 유일한 비침습 리프팅.<br />
                  실시간 시각화 DeepSEE 기술로 정확하고 안전하게.
                </p>

                {/* Quick stats - Gold accented */}
                <div className="flex gap-8 mt-10 pt-8 border-t border-border/50">
                  <div>
                    <p className="text-h2 text-primary font-serif">110+</p>
                    <p className="text-small text-mono-light">임상 연구</p>
                  </div>
                  <div>
                    <p className="text-h2 text-primary font-serif">175만+</p>
                    <p className="text-small text-mono-light">전세계 시술 건수</p>
                  </div>
                  <div>
                    <p className="text-h2 text-primary font-serif">89%</p>
                    <p className="text-small text-mono-light">환자 개선율</p>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Right: Premium Video Visual */}
            <AnimateOnScroll animation="fadeInRight">
              <div className="relative">
                {/* Main video container with glassmorphism */}
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                  {/* Video Element */}
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  >
                    <source src="/images/lifting/ulthera/videos/ultherapy-device.mp4" type="video/mp4" />
                  </video>

                  {/* Glassmorphism overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />

                  {/* Gold accent gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/30 via-transparent to-[#D4AF37]/10" />

                  {/* Bottom info bar with glassmorphism */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
                    <p className="font-serif text-xl text-white/90">MFU-V Technology</p>
                    <p className="text-sm text-white/70">Micro-focused Ultrasound with Visualization</p>
                  </div>
                </div>

                {/* Floating badges with glassmorphism */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg px-4 py-3 border border-[#D4AF37]/20"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <p className="text-small font-medium text-secondary">DeepSEE</p>
                  <p className="text-xs text-mono-light">실시간 시각화</p>
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -left-4 bg-gradient-to-br from-[#D4AF37] to-primary text-white rounded-2xl shadow-lg px-4 py-3"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                >
                  <p className="text-small font-medium">4.5mm SMAS</p>
                  <p className="text-xs opacity-90">깊은 층 타겟팅</p>
                </motion.div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>

        {/* Scroll indicator - hidden on mobile */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* About Section - 울쎄라란? */}
      <section className="section-gap-lg bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-primary mb-2">About Ultherapy Prime</p>
              <h2 className="text-h1 text-secondary mb-6">울쎄라피 프라임이란?</h2>
              <p className="text-body text-mono max-w-3xl mx-auto leading-relaxed">
                울쎄라피 프라임은 미국 FDA에서 <strong className="text-secondary">리프팅 효과를 승인받은 유일한</strong> 비침습 HIFU 장비입니다.
                특허받은 MFU-V(Micro-focused Ultrasound with Visualization) 기술로
                피부 깊은 층인 SMAS까지 에너지를 정확하게 전달하여 콜라겐 재생을 촉진합니다.
              </p>
            </div>
          </AnimateOnScroll>

          {/* Technology explanation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <AnimateOnScroll animation="fadeInLeft">
              <SkinLayerDiagram />
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInRight">
              <div className="space-y-6">
                <h3 className="text-h2 text-secondary mb-4">
                  깊이별 맞춤 타겟팅
                </h3>

                <div className="space-y-4">
                  <Card padding="md" hover={false} className="border-l-4 border-l-primary/50">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-serif font-bold">1.5</span>
                      </div>
                      <div>
                        <h4 className="text-h4 text-secondary mb-1">1.5mm - 표피/진피 경계</h4>
                        <p className="text-body text-mono-light">미세주름, 피부결 개선에 효과적. 눈가, 입가 등 섬세한 부위에 적용</p>
                      </div>
                    </div>
                  </Card>

                  <Card padding="md" hover={false} className="border-l-4 border-l-primary/70">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-serif font-bold">3.0</span>
                      </div>
                      <div>
                        <h4 className="text-h4 text-secondary mb-1">3.0mm - 진피 하층</h4>
                        <p className="text-body text-mono-light">콜라겐 유도, 전반적 탄력 개선. 볼, 이마 등 넓은 부위에 적용</p>
                      </div>
                    </div>
                  </Card>

                  <Card padding="md" hover={false} className="border-l-4 border-l-primary">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-serif font-bold">4.5</span>
                      </div>
                      <div>
                        <h4 className="text-h4 text-secondary mb-1">4.5mm - SMAS층</h4>
                        <p className="text-body text-mono-light">구조적 리프팅 효과. 턱선, 목, 중안면 등 처짐이 심한 부위에 적용</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Transducer Interactive Section - NEW */}
      <section className="section-gap-md bg-gradient-to-b from-white to-[#f9f6f3]">
        <div className="container-custom">
          {/* Section Header */}
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#D4AF37]" />
                <span className="text-xs tracking-[0.3em] text-[#D4AF37] uppercase font-medium">Transducers</span>
                <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#D4AF37]" />
              </div>
              <h2 className="text-h1 text-secondary mb-4">6가지 트랜스듀서</h2>
              <p className="text-body text-mono-light max-w-2xl mx-auto">
                깊이와 주파수가 다른 6가지 트랜스듀서로 피부층별 맞춤 시술이 가능합니다
              </p>
            </div>
          </AnimateOnScroll>

          {/* Transducer Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column - Shallow Depth */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-mono-light uppercase tracking-wider mb-4 text-center">
                표층 (1.5mm - 3.0mm)
              </h3>
              {TRANSDUCERS.filter(t => t.depth === '1.5mm' || (t.depth === '3.0mm' && t.id.includes('n'))).map((transducer) => (
                <motion.div
                  key={transducer.id}
                  className={`
                    relative p-5 rounded-2xl cursor-pointer transition-all duration-300
                    ${activeTransducer === transducer.id
                      ? 'bg-white shadow-xl border-2 border-[#D4AF37]'
                      : 'bg-white/70 hover:bg-white hover:shadow-lg border border-transparent'
                    }
                  `}
                  onClick={() => setActiveTransducer(activeTransducer === transducer.id ? null : transducer.id)}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${transducer.color}20` }}
                    >
                      <img
                        src={transducer.image}
                        alt={transducer.name}
                        className="w-12 h-12 object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-serif text-lg text-secondary font-medium">{transducer.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${transducer.color}30`, color: '#6d4e42' }}
                        >
                          {transducer.depth}
                        </span>
                        <span className="text-xs text-mono-light">{transducer.frequency}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {activeTransducer === transducer.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-[#D4AF37]/20"
                      >
                        <p className="text-sm text-mono-light mb-3">{transducer.target}</p>
                        <div className="flex flex-wrap gap-2">
                          {transducer.applications.map((app, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-[#D4AF37]/10 text-[#6d4e42] rounded-full text-xs"
                            >
                              {app}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Center - Visualization */}
            <div className="relative">
              <AnimateOnScroll>
                <div className="sticky top-24">
                  {/* Handset Image */}
                  <div className="relative aspect-[3/4] flex items-center justify-center">
                    <motion.img
                      src="/images/lifting/ulthera/transducers/handset.jpg"
                      alt="Ultherapy Handset"
                      className="w-full max-w-[280px] object-contain drop-shadow-2xl"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Depth Indicators */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 space-y-4">
                      {['1.5mm', '3.0mm', '4.5mm'].map((depth, i) => (
                        <motion.div
                          key={depth}
                          className={`
                            flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all
                            ${TRANSDUCERS.find(t => t.id === activeTransducer)?.depth === depth
                              ? 'bg-[#D4AF37] text-white shadow-lg'
                              : 'bg-white/80 text-mono-light'
                            }
                          `}
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: TRANSDUCERS.find(t => t.id === activeTransducer)?.depth === depth
                                ? 'white'
                                : TRANSDUCERS.find(t => t.depth === depth)?.color || '#ccc'
                            }}
                          />
                          {depth}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Active Transducer Info */}
                  <AnimatePresence mode="wait">
                    {activeTransducer && (
                      <motion.div
                        key={activeTransducer}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mt-6 p-5 bg-white/90 backdrop-blur-xl rounded-2xl border border-[#D4AF37]/20 shadow-lg"
                      >
                        <h4 className="font-serif text-xl text-secondary mb-2">
                          {TRANSDUCERS.find(t => t.id === activeTransducer)?.name}
                        </h4>
                        <p className="text-sm text-mono-light">
                          {TRANSDUCERS.find(t => t.id === activeTransducer)?.target}에 정확하게 에너지를 전달합니다
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </AnimateOnScroll>
            </div>

            {/* Right Column - Deep Depth */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-mono-light uppercase tracking-wider mb-4 text-center">
                심층 (3.0mm - 4.5mm)
              </h3>
              {TRANSDUCERS.filter(t => (t.depth === '3.0mm' && !t.id.includes('n')) || t.depth === '4.5mm').map((transducer) => (
                <motion.div
                  key={transducer.id}
                  className={`
                    relative p-5 rounded-2xl cursor-pointer transition-all duration-300
                    ${activeTransducer === transducer.id
                      ? 'bg-white shadow-xl border-2 border-[#D4AF37]'
                      : 'bg-white/70 hover:bg-white hover:shadow-lg border border-transparent'
                    }
                  `}
                  onClick={() => setActiveTransducer(activeTransducer === transducer.id ? null : transducer.id)}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${transducer.color}20` }}
                    >
                      <img
                        src={transducer.image}
                        alt={transducer.name}
                        className="w-12 h-12 object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-serif text-lg text-secondary font-medium">{transducer.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${transducer.color}30`, color: '#6d4e42' }}
                        >
                          {transducer.depth}
                        </span>
                        <span className="text-xs text-mono-light">{transducer.frequency}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {activeTransducer === transducer.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-[#D4AF37]/20"
                      >
                        <p className="text-sm text-mono-light mb-3">{transducer.target}</p>
                        <div className="flex flex-wrap gap-2">
                          {transducer.applications.map((app, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-[#D4AF37]/10 text-[#6d4e42] rounded-full text-xs"
                            >
                              {app}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Ulthera Section - Premium Styled */}
      <section className="section-gap-md bg-gradient-to-b from-background to-white relative overflow-hidden">
        {/* Gold accent background element */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#D4AF37]/5 blur-3xl" />
        <div className="container-custom relative z-10">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#D4AF37]" />
                <span className="text-xs tracking-[0.3em] text-[#D4AF37] uppercase font-medium">Premium Quality</span>
                <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#D4AF37]" />
              </div>
              <p className="font-serif text-h3 text-primary mb-2">Why Ultherapy Prime?</p>
              <h2 className="text-h1 text-secondary">왜 울쎄라피 프라임인가?</h2>
            </div>
          </AnimateOnScroll>

          {/* Mobile: Horizontal Scroll Cards, Desktop: Grid */}
          <div className="flex overflow-x-auto gap-4 -mx-6 px-6 pb-4 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:mx-0 md:px-0 md:pb-0 scrollbar-hide scroll-snap-x-mandatory">
            <div className="flex-shrink-0 w-[280px] md:w-auto scroll-snap-center">
              <Card padding="lg" className="h-full text-center relative overflow-hidden group border-t-2 border-t-[#D4AF37]/30 hover:border-t-[#D4AF37] transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="mb-4">
                    <FDAIllustration />
                  </div>
                  <h3 className="text-h3 text-secondary mb-4">FDA 유일 승인</h3>
                  <p className="text-body text-mono-light leading-relaxed">
                    미국 FDA에서 비침습 리프팅 효과를 승인받은 <strong className="text-secondary">유일한</strong> HIFU 장비입니다.
                  </p>
                </div>
              </Card>
            </div>

            <div className="flex-shrink-0 w-[280px] md:w-auto scroll-snap-center">
              <Card padding="lg" className="h-full text-center relative overflow-hidden group border-t-2 border-t-[#D4AF37]/30 hover:border-t-[#D4AF37] transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="mb-4">
                    <DeepSEEIllustration />
                  </div>
                  <h3 className="text-h3 text-secondary mb-4">DeepSEE 시각화</h3>
                  <p className="text-body text-mono-light leading-relaxed">
                    특허 받은 DeepSEE 기술로 피부층을 <strong className="text-secondary">실시간 확인</strong>하며 시술합니다.
                  </p>
                </div>
              </Card>
            </div>

            <div className="flex-shrink-0 w-[280px] md:w-auto scroll-snap-center">
              <Card padding="lg" className="h-full text-center relative overflow-hidden group border-t-2 border-t-[#D4AF37]/30 hover:border-t-[#D4AF37] transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="mb-4">
                    <SMASIllustration />
                  </div>
                  <h3 className="text-h3 text-secondary mb-4">SMAS층 타겟팅</h3>
                  <p className="text-body text-mono-light leading-relaxed">
                    성형 수술 시 타겟하는 <strong className="text-secondary">SMAS층까지 도달</strong>하는 유일한 비침습 장비입니다.
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Clinical evidence banner */}
          <AnimateOnScroll>
            <div className="mt-16 p-8 bg-secondary rounded-3xl text-white text-center">
              <p className="font-serif text-h3 opacity-80 mb-4">Clinical Evidence</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <p className="text-h1 font-serif">110+</p>
                  <p className="text-small opacity-70">임상 연구 논문</p>
                </div>
                <div>
                  <p className="text-h1 font-serif">89%</p>
                  <p className="text-small opacity-70">심미적 개선율</p>
                </div>
                <div>
                  <p className="text-h1 font-serif">84%</p>
                  <p className="text-small opacity-70">환자 만족도</p>
                </div>
                <div>
                  <p className="text-h1 font-serif">1-2년</p>
                  <p className="text-small opacity-70">효과 지속 기간</p>
                </div>
              </div>
              <p className="text-small opacity-60 mt-6">
                출처: 2024 체계적 문헌고찰 및 메타분석 (PubMed)
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Compare Section - Premium */}
      <section className="section-gap-md bg-white relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#D4AF37]/5 blur-3xl" />
        </div>
        <div className="container-custom relative z-10">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#D4AF37]" />
                <span className="text-xs tracking-[0.3em] text-[#D4AF37] uppercase font-medium">Compare</span>
                <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#D4AF37]" />
              </div>
              <p className="font-serif text-h3 text-primary mb-2">Comparison</p>
              <h2 className="text-h1 text-secondary mb-4">울쎄라피 프라임 vs 타 장비</h2>
              <p className="text-body text-mono-light">
                같은 HIFU라도 기술력과 임상 근거에는 큰 차이가 있습니다
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <Card padding="lg" hover={false}>
              <ComparisonTable />
            </Card>
          </AnimateOnScroll>

          {/* Synergy note */}
          <AnimateOnScroll>
            <div className="mt-12 p-6 bg-gradient-to-br from-[#D4AF37]/5 to-primary/5 rounded-2xl border border-[#D4AF37]/20 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-h4 text-secondary mb-2">울쎄라피 프라임 + 써마지 시너지</h4>
                  <p className="text-body text-mono-light">
                    울쎄라피 프라임(SMAS층 리프팅)과 써마지(표피~진피층 탄력)를 3개월 간격으로 병행하면
                    다층적 콜라겐 재생으로 더욱 강력한 시너지 효과를 경험할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* LIV Section - 리브만의 울쎄라 */}
      <section className="section-gap-sm bg-gradient-to-b from-secondary/5 to-background relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-64 h-64 rounded-full bg-[#D4AF37]/10 blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#D4AF37]/5 blur-3xl" />
        <div className="container-custom relative z-10">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#D4AF37]" />
                <span className="text-xs tracking-[0.3em] text-[#D4AF37] uppercase font-medium">LIV Clinic</span>
                <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#D4AF37]" />
              </div>
              <p className="font-serif text-h3 text-primary mb-2">LIV Difference</p>
              <h2 className="text-h1 text-secondary">리브만의 울쎄라피 프라임</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimateOnScroll animation="fadeInUp" delay={0}>
              <Card padding="lg" className="h-full border-t-4 border-t-[#D4AF37] hover:shadow-lg hover:shadow-[#D4AF37]/10 transition-shadow">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-primary/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-h4 text-secondary mb-3">정품 인증 클리닉</h3>
                  <p className="text-body text-mono-light">
                    멀츠 코리아 공식 인증 클리닉으로 정품 장비와 트랜스듀서만 사용합니다.
                    시리얼 번호 확인이 가능합니다.
                  </p>
                </div>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInUp" delay={0.1}>
              <Card padding="lg" className="h-full border-t-4 border-t-[#D4AF37] hover:shadow-lg hover:shadow-[#D4AF37]/10 transition-shadow">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-primary/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-h4 text-secondary mb-3">샷 수 투명 공개</h3>
                  <p className="text-body text-mono-light">
                    시술 전 계획된 라인 수와 실제 조사된 샷 수를 투명하게 공개합니다.
                    정직한 시술을 약속드립니다.
                  </p>
                </div>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInUp" delay={0.2}>
              <Card padding="lg" className="h-full border-t-4 border-t-[#D4AF37] hover:shadow-lg hover:shadow-[#D4AF37]/10 transition-shadow">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-primary/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-h4 text-secondary mb-3">전문의 직접 시술</h3>
                  <p className="text-body text-mono-light">
                    피부과/성형외과 전문의가 직접 상담부터 시술까지 진행합니다.
                    개인별 맞춤 시술 계획을 수립합니다.
                  </p>
                </div>
              </Card>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Journey Section - Process & Timeline Combined with Tabs */}
      <section className="section-gap-sm bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-8 md:mb-12">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#D4AF37]" />
                <span className="text-xs tracking-[0.3em] text-[#D4AF37] uppercase font-medium">Journey</span>
                <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#D4AF37]" />
              </div>
              <h2 className="text-h1 text-secondary">시술 여정</h2>
            </div>
          </AnimateOnScroll>

          <TabSection
            tabs={[
              {
                id: 'process',
                label: '시술 과정',
                content: (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8">
                    {treatment.process.map((step, index) => (
                      <ProcessStep
                        key={step.step}
                        step={step.step}
                        title={step.title}
                        desc={step.desc}
                        isLast={index === treatment.process.length - 1}
                      />
                    ))}
                  </div>
                ),
              },
              {
                id: 'timeline',
                label: '효과 타임라인',
                content: (
                  <div className="py-4 md:py-8 px-2 md:px-8">
                    <CollagenTimeline />
                    <p className="text-center text-sm text-mono-light mt-6">
                      울쎄라피 프라임 시술 후 콜라겐이 재생되며 점진적으로 효과가 나타납니다
                    </p>
                  </div>
                ),
              },
            ]}
            defaultTab="process"
            tabClassName="justify-center"
          />
        </div>
      </section>

      {/* Treatment Info Section - Premium Dark */}
      <section className="py-20 bg-gradient-to-br from-secondary via-secondary to-[#4a3830] text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#D4AF37]/5 blur-3xl" />
        </div>
        <div className="container-custom relative z-10">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#D4AF37]" />
                <span className="text-xs tracking-[0.3em] text-[#D4AF37] uppercase font-medium">Details</span>
                <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#D4AF37]" />
              </div>
              <p className="font-serif text-h3 opacity-80 mb-2">Treatment Info</p>
              <h2 className="text-h1">시술 정보</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <AnimateOnScroll delay={0}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-small opacity-70 mb-1">시술 시간</p>
                <p className="font-medium text-lg">{treatment.duration}</p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={0.1}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-small opacity-70 mb-1">마취</p>
                <p className="font-medium text-lg">{treatment.anesthesia}</p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={0.2}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-small opacity-70 mb-1">회복 기간</p>
                <p className="font-medium text-lg">{treatment.recovery}</p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={0.3}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-small opacity-70 mb-1">효과 지속</p>
                <p className="font-medium text-lg">{treatment.results}</p>
              </div>
            </AnimateOnScroll>
          </div>

          {/* Recommended lines info */}
          <AnimateOnScroll>
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur">
              <h3 className="text-h4 mb-4 text-center">부위별 권장 라인 수</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-h3 font-serif text-primary">250-400</p>
                  <p className="text-small opacity-70">상안면</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-h3 font-serif text-primary">~600</p>
                  <p className="text-small opacity-70">하안면</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-h3 font-serif text-primary">800-1,100</p>
                  <p className="text-small opacity-70">전안면</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-h3 font-serif text-primary">~1,200</p>
                  <p className="text-small opacity-70">전안면 + 목</p>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Info Section - Target, Ideal For & Cautions Combined with Collapsible */}
      <section className="section-gap-sm bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-8">
              <h2 className="text-h2 text-secondary">상세 정보</h2>
            </div>
          </AnimateOnScroll>

          <div className="max-w-3xl mx-auto">
            <CollapsibleSection
              items={[
                {
                  id: 'targetAreas',
                  title: '시술 부위',
                  defaultOpen: true,
                  content: (
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {treatment.targetAreas.map((area, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 md:px-4 md:py-2 bg-primary/10 text-primary rounded-full text-sm md:text-base"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  ),
                },
                {
                  id: 'idealFor',
                  title: '이런 분께 추천',
                  content: (
                    <ul className="space-y-2 md:space-y-3">
                      {treatment.idealFor.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 md:gap-3 text-sm md:text-base text-mono">
                          <span className="text-primary mt-0.5"><CheckIcon /></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ),
                },
                {
                  id: 'cautions',
                  title: '시술 전후 주의사항',
                  content: (
                    <ul className="space-y-2 md:space-y-3">
                      {treatment.cautions.map((caution, index) => (
                        <li key={index} className="flex items-start gap-2 md:gap-3 text-sm md:text-base text-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          {caution}
                        </li>
                      ))}
                    </ul>
                  ),
                },
              ]}
              variant="card"
              allowMultiple={true}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section - with ExpandableList for mobile */}
      <section className="section-gap-sm bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-8 md:mb-12">
              <p className="font-serif text-h3 text-primary mb-2">FAQ</p>
              <h2 className="text-h1 text-secondary">자주 묻는 질문</h2>
            </div>
          </AnimateOnScroll>

          <div className="max-w-3xl mx-auto">
            <ExpandableList
              items={extendedFaqs}
              initialCount={3}
              expandText={`${extendedFaqs.length - 3}개 더 보기`}
              collapseText="접기"
              renderItem={(faq, index) => (
                <Card padding="none" hover={false} className="overflow-hidden mb-3 md:mb-4">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-4 py-4 md:px-6 md:py-5 text-left flex items-start justify-between gap-3 md:gap-4 hover:bg-background/50 transition-colors"
                  >
                    <div className="flex items-start gap-2 md:gap-3">
                      <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-serif font-medium text-sm md:text-base">Q</span>
                      </span>
                      <span className="text-sm md:text-h4 text-secondary pt-0.5">{faq.q}</span>
                    </div>
                    <motion.svg
                      className="w-4 h-4 md:w-5 md:h-5 text-mono-light flex-shrink-0 mt-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      animate={{ rotate: expandedFaq === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </motion.svg>
                  </button>

                  <AnimatePresence>
                    {expandedFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 md:px-6 md:pb-5">
                          <div className="flex items-start gap-2 md:gap-3 pt-3 border-t border-border">
                            <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-secondary font-serif font-medium text-sm md:text-base">A</span>
                            </span>
                            <p className="text-sm md:text-body text-mono leading-relaxed pt-1">{faq.a}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              )}
            />
          </div>

          {/* Link to Medical Q&A */}
          {relatedMedicalQA.length > 0 && (
            <AnimateOnScroll>
              <div className="text-center mt-8 md:mt-12">
                <Link href="/medical">
                  <Button variant="outline" size="sm" className="md:hidden">
                    의료정보 Q&A 더보기
                  </Button>
                  <Button variant="outline" className="hidden md:inline-flex">
                    의료정보 Q&A 더보기
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Button>
                </Link>
              </div>
            </AnimateOnScroll>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-secondary via-secondary to-primary/80 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
        </div>

        <div className="container-custom relative z-10">
          <AnimateOnScroll>
            <div className="text-center max-w-2xl mx-auto">
              <p className="font-serif text-h3 opacity-80 mb-4">Ready for Transformation?</p>
              <h2 className="text-h1 mb-6">울쎄라피 프라임 상담 예약</h2>
              <p className="text-h4 opacity-90 mb-10 leading-relaxed">
                전문 의료진과 1:1 맞춤 상담을 통해<br />
                나에게 맞는 최적의 시술 계획을 수립해보세요.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <ScrollLink href="/contact">
                  <Button variant="ghost" size="lg" className="bg-white !text-secondary hover:bg-primary hover:!text-white w-full sm:w-auto">
                    무료 상담 예약하기
                  </Button>
                </ScrollLink>
                <a href="tel:02-797-2773">
                  <Button variant="outline" size="lg" className="border-white !text-white hover:bg-white/10 w-full sm:w-auto">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    02-797-2773
                  </Button>
                </a>
              </div>

              <div className="mt-10 pt-8 border-t border-white/20 flex flex-col sm:flex-row justify-center items-center gap-6 text-small opacity-70">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  평일 10:00-19:00
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  신사역 4번 출구 도보 3분
                </span>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Related Treatments */}
      {treatment.relatedTreatments && treatment.relatedTreatments.length > 0 && (
        <section className="section-gap-sm bg-white pb-24 md:pb-32">
          <div className="container-custom">
            <AnimateOnScroll>
              <div className="text-center mb-8 md:mb-12">
                <p className="font-serif text-h3 text-primary mb-2">Related Treatments</p>
                <h2 className="text-h1 text-secondary">함께 보면 좋은 시술</h2>
              </div>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              {treatment.relatedTreatments.slice(0, 3).map((relatedId) => {
                const related =
                  TREATMENTS.lifting[relatedId as keyof typeof TREATMENTS.lifting] ||
                  TREATMENTS.antiaging[relatedId as keyof typeof TREATMENTS.antiaging] ||
                  TREATMENTS.laser[relatedId as keyof typeof TREATMENTS.laser];

                if (!related) return null;

                return (
                  <AnimateOnScroll key={relatedId}>
                    <Link href={`/${related.category}/${related.id}`}>
                      <Card padding="lg" className="group cursor-pointer h-full">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-serif text-primary mb-1">{related.nameEn}</p>
                            <h3 className="text-h4 text-secondary group-hover:text-primary transition-colors">
                              {related.name}
                            </h3>
                            <p className="text-small text-mono-light mt-2">{related.shortDesc}</p>
                          </div>
                          <svg className="w-6 h-6 text-primary group-hover:translate-x-2 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </Card>
                    </Link>
                  </AnimateOnScroll>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
