'use client';

import { useTranslations } from 'next-intl';
import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, StaggerChildren, StaggerItem, Button, Card, ScrollLink } from '@/components/ui';
import { TREATMENTS, MEDICAL_QA } from '@/lib/constants';

// SVG Icons
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const RFIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// AccuREP Illustration
const AccuREPIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-full h-40">
    <defs>
      <linearGradient id="accuGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#b4988d" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.3" />
      </linearGradient>
      <linearGradient id="energyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FF6B35" />
        <stop offset="100%" stopColor="#b4988d" />
      </linearGradient>
    </defs>
    {/* Background circle */}
    <circle cx="100" cy="80" r="70" fill="url(#accuGrad)" />
    {/* Central chip/sensor */}
    <motion.rect
      x="70" y="50" width="60" height="60" rx="8"
      fill="url(#energyGrad)"
      initial={{ scale: 0.9, opacity: 0.8 }}
      animate={{ scale: [0.9, 1, 0.9], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 3, repeat: Infinity }}
    />
    {/* Signal waves */}
    <motion.path
      d="M60 80 Q50 70 60 60"
      fill="none"
      stroke="#FF6B35"
      strokeWidth="2"
      strokeLinecap="round"
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <motion.path
      d="M50 80 Q35 65 50 50"
      fill="none"
      stroke="#FF6B35"
      strokeWidth="2"
      strokeLinecap="round"
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
    />
    <motion.path
      d="M140 80 Q150 70 140 60"
      fill="none"
      stroke="#FF6B35"
      strokeWidth="2"
      strokeLinecap="round"
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <motion.path
      d="M150 80 Q165 65 150 50"
      fill="none"
      stroke="#FF6B35"
      strokeWidth="2"
      strokeLinecap="round"
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
    />
    {/* Text */}
    <text x="100" y="85" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">AccuREP</text>
    {/* Data points */}
    <motion.circle cx="50" cy="120" r="4" fill="#FF6B35" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
    <motion.circle cx="100" cy="130" r="4" fill="#FF6B35" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
    <motion.circle cx="150" cy="120" r="4" fill="#FF6B35" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} />
  </svg>
);

// Comfort Plus Illustration
const ComfortPlusIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-full h-40">
    <defs>
      <linearGradient id="comfortGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#4ade80" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#b4988d" stopOpacity="0.3" />
      </linearGradient>
    </defs>
    {/* Background */}
    <circle cx="100" cy="80" r="70" fill="url(#comfortGrad)" />
    {/* Vibration waves */}
    {[0, 1, 2].map((i) => (
      <motion.ellipse
        key={i}
        cx="100"
        cy="80"
        rx={30 + i * 15}
        ry={20 + i * 10}
        fill="none"
        stroke="#4ade80"
        strokeWidth="2"
        strokeDasharray="5 5"
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
    {/* Central comfort icon */}
    <motion.circle
      cx="100" cy="80" r="25"
      fill="#4ade80"
      initial={{ scale: 0.9 }}
      animate={{ scale: [0.9, 1.1, 0.9] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    {/* Smile */}
    <path d="M90 85 Q100 95 110 85" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <circle cx="92" cy="75" r="3" fill="white" />
    <circle cx="108" cy="75" r="3" fill="white" />
    {/* Text */}
    <text x="100" y="140" fill="#6d4e42" fontSize="11" fontWeight="bold" textAnchor="middle">Comfort Pulse</text>
  </svg>
);

// Collagen Remodeling Illustration
const CollagenIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-full h-40">
    <defs>
      <linearGradient id="collagenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f5e6df" />
        <stop offset="50%" stopColor="#d4b8a8" />
        <stop offset="100%" stopColor="#b4988d" />
      </linearGradient>
      <radialGradient id="heatRadial" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
      </radialGradient>
    </defs>
    {/* Skin layers */}
    <rect x="30" y="40" width="140" height="25" fill="#f5e6df" rx="4" />
    <rect x="30" y="65" width="140" height="35" fill="#e8d4c8" rx="4" />
    <rect x="30" y="100" width="140" height="30" fill="#d4b8a8" rx="4" />
    {/* Heat zones */}
    <motion.circle
      cx="70" cy="82"
      r="15"
      fill="url(#heatRadial)"
      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <motion.circle
      cx="130" cy="82"
      r="15"
      fill="url(#heatRadial)"
      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
    />
    {/* Collagen fibers (before/after) */}
    <g transform="translate(40, 75)">
      <motion.path
        d="M0 0 Q10 5 20 0 Q30 -5 40 0"
        fill="none"
        stroke="#b4988d"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </g>
    <g transform="translate(110, 75)">
      <motion.path
        d="M0 5 Q10 0 20 5 Q30 10 40 5"
        fill="none"
        stroke="#b4988d"
        strokeWidth="3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
    </g>
    {/* Labels */}
    <text x="100" y="150" fill="#6d4e42" fontSize="10" fontWeight="bold" textAnchor="middle">콜라겐 수축 & 재생</text>
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

// RF Energy Diagram Component
const RFEnergyDiagram = () => (
  <div className="relative w-full max-w-xl mx-auto">
    <svg viewBox="0 0 400 280" className="w-full h-auto">
      {/* Background gradient */}
      <defs>
        <linearGradient id="rfSkinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f5e6df" />
          <stop offset="50%" stopColor="#e8d4c8" />
          <stop offset="100%" stopColor="#d4b8a8" />
        </linearGradient>
        <radialGradient id="rfHeatGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#FF6B35" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Handpiece */}
      <rect x="160" y="10" width="80" height="40" fill="#6d4e42" rx="8" />
      <rect x="175" y="50" width="50" height="20" fill="#8a7060" rx="4" />

      {/* RF waves from handpiece */}
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d={`M180 70 Q200 ${90 + i * 20} 220 70`}
          fill="none"
          stroke="#FF6B35"
          strokeWidth="2"
          strokeDasharray="4 4"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}

      {/* Skin layers */}
      <rect x="50" y="100" width="300" height="30" fill="#f5e6df" stroke="#e5e5e5" strokeWidth="1" rx="4" />
      <rect x="50" y="130" width="300" height="50" fill="#e8d4c8" stroke="#e5e5e5" strokeWidth="1" rx="4" />
      <rect x="50" y="180" width="300" height="40" fill="#d4b8a8" stroke="#e5e5e5" strokeWidth="1" rx="4" />
      <rect x="50" y="220" width="300" height="40" fill="#b4988d" stroke="#e5e5e5" strokeWidth="1" rx="4" />

      {/* Layer labels */}
      <text x="370" y="120" className="text-xs fill-mono" textAnchor="end">표피</text>
      <text x="370" y="160" className="text-xs fill-mono" textAnchor="end">진피</text>
      <text x="370" y="205" className="text-xs fill-mono" textAnchor="end">피하지방</text>
      <text x="370" y="245" className="text-xs fill-mono" textAnchor="end">근막</text>

      {/* Heat effect in dermis */}
      <motion.ellipse
        cx="200" cy="155"
        rx="80" ry="30"
        fill="url(#rfHeatGradient)"
        initial={{ scale: 0.8, opacity: 0.5 }}
        animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Collagen fibers tightening */}
      <motion.g initial={{ opacity: 0.5 }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
        <path d="M120 145 Q140 150 160 145 Q180 140 200 145" fill="none" stroke="#b4988d" strokeWidth="2" />
        <path d="M200 145 Q220 150 240 145 Q260 140 280 145" fill="none" stroke="#b4988d" strokeWidth="2" />
        <path d="M120 165 Q140 160 160 165 Q180 170 200 165" fill="none" stroke="#b4988d" strokeWidth="2" />
        <path d="M200 165 Q220 160 240 165 Q260 170 280 165" fill="none" stroke="#b4988d" strokeWidth="2" />
      </motion.g>

      {/* Temperature indicator */}
      <text x="200" y="95" fill="#FF6B35" fontSize="12" fontWeight="bold" textAnchor="middle">65-75°C</text>
    </svg>
  </div>
);

// Collagen Effect Timeline Component
const CollagenTimeline = () => {
  const timelineData = [
    { time: '시술 직후', effect: '즉각적 탄력', desc: '콜라겐 수축 효과', percent: 30 },
    { time: '1개월', effect: '탄력 개선', desc: '콜라겐 재생 시작', percent: 50 },
    { time: '3개월', effect: '눈에 띄는 변화', desc: '신생 콜라겐 증가', percent: 80 },
    { time: '6개월', effect: '최대 효과', desc: '콜라겐 리모델링 완료', percent: 100 },
    { time: '12개월+', effect: '효과 유지', desc: '연 1회 유지 권장', percent: 85 },
  ];

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-0 right-0 top-1/2 h-1 bg-gradient-to-r from-[#FF6B35]/30 via-[#FF6B35] to-[#FF6B35]/30 rounded-full" />

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
              className="w-4 h-4 rounded-full bg-[#FF6B35] border-4 border-white shadow-lg z-10"
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

// Generation Comparison Table
const GenerationTable = () => {
  const comparisonData = [
    { feature: '기술', flx: 'AccuREP 자동 조절', cpt: '수동 에너지 설정', nxt: '1세대 기술' },
    { feature: '시술 시간', flx: '25% 단축', cpt: '표준', nxt: '가장 김' },
    { feature: '통증', flx: '진동 기술로 최소화', cpt: '중간', nxt: '높음' },
    { feature: '효과 균일성', flx: '최적 자동 조절', cpt: '시술자 의존', nxt: '불균일 가능' },
    { feature: '팁 종류', flx: '900/600/400/225', cpt: '900/600/400', nxt: '제한적' },
    { feature: '눈가 전용', flx: 'Total Tip O', cpt: 'Eye Tip O', nxt: 'X' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="border-b-2 border-primary/20">
            <th className="py-4 px-4 text-left text-h4 text-secondary">비교 항목</th>
            <th className="py-4 px-4 text-center bg-[#FF6B35]/10 rounded-t-lg">
              <span className="text-h4 text-[#FF6B35]">FLX (4세대)</span>
            </th>
            <th className="py-4 px-4 text-center text-h4 text-mono-light">CPT (3세대)</th>
            <th className="py-4 px-4 text-center text-h4 text-mono-light">NXT (2세대)</th>
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
              <td className="py-4 px-4 text-center bg-[#FF6B35]/5 text-body text-[#FF6B35] font-medium">{row.flx}</td>
              <td className="py-4 px-4 text-center text-body text-mono">{row.cpt}</td>
              <td className="py-4 px-4 text-center text-body text-mono">{row.nxt}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Tip Types Component with Images
const TipTypes = () => {
  const tips = [
    { shots: '900', area: '바디', desc: '넓은 면적', image: '/images/lifting/thermage/tips/total-tip-900.png' },
    { shots: '600', area: '얼굴', desc: '볼, 이마', image: '/images/lifting/thermage/tips/total-tip-600.png' },
    { shots: '400', area: '중안면', desc: '볼, 턱선', image: '/images/lifting/thermage/tips/total-tip-400.png' },
    { shots: '225', area: '눈가/입가', desc: '섬세 부위', image: '/images/lifting/thermage/tips/total-tip-225.png' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {tips.map((tip, index) => (
        <motion.div
          key={tip.shots}
          className="text-center group"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5 }}
        >
          <div className="relative w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-[#FF6B35]/10 to-primary/10">
            <img
              src={tip.image}
              alt={`Total Tip ${tip.shots}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <span className="text-white text-h3 font-serif font-bold drop-shadow-lg">{tip.shots}</span>
            </div>
          </div>
          <p className="text-h4 text-secondary font-medium">{tip.area}</p>
          <p className="text-small text-mono-light">{tip.desc}</p>
        </motion.div>
      ))}
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
      <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-[#FF6B35] to-[#FF6B35]/30" />
    )}

    {/* Step circle */}
    <motion.div
      className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B35] to-primary text-white flex items-center justify-center text-xl font-serif shadow-lg"
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

// 동적 레이블 데이터
const heroLabels = [
  {
    top: { title: 'AccuREP', subtitle: '자동 에너지 조절' },
    bottom: { title: 'Comfort Pulse', subtitle: '진동 통증 완화' }
  },
  {
    top: { title: 'RF Technology', subtitle: '콜라겐 수축 & 재생' },
    bottom: { title: '14M+', subtitle: '전세계 시술 건수' }
  },
  {
    top: { title: 'AccuTip', subtitle: '3.0cm² 정밀 면적' },
    bottom: { title: '멀츠 코리아', subtitle: '공식 인증 클리닉' }
  },
];

// Main Component
export default function ThermageDetail() {
  const t = useTranslations('treatments');
  const tCommon = useTranslations('common');
  const treatment = TREATMENTS.lifting.thermage;
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [currentLabelIndex, setCurrentLabelIndex] = useState(0);
  const faqRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // 동적 레이블 전환 효과
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLabelIndex((prev) => (prev + 1) % heroLabels.length);
    }, 4000); // 4초마다 전환

    return () => clearInterval(interval);
  }, []);

  const relatedMedicalQA = MEDICAL_QA.filter((qa) =>
    qa.relatedTreatments?.some((id) => id === 'thermage')
  );

  const toggleFaq = useCallback((index: number) => {
    // 항상 해당 FAQ를 열기 (이미 열려있어도)
    setExpandedFaq(index);

    // 해당 FAQ 요소로 스무스 스크롤
    requestAnimationFrame(() => {
      const el = faqRefs.current.get(index);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollOffset = 120; // 헤더 높이(96px) + 여유 공간(24px)
      const scrollTop = window.scrollY + rect.top - scrollOffset;
      window.scrollTo({ top: scrollTop, behavior: 'smooth' });
    });
  }, []);

  // Extended FAQ data
  const extendedFaqs = [
    ...treatment.faqs,
    {
      q: '써마지와 울쎄라피 프라임 중 어떤 시술이 좋나요?',
      a: '두 시술은 상호 보완적입니다. 울쎄라피 프라임은 SMAS층의 깊은 리프팅에 효과적이고, 써마지는 진피층 콜라겐 수축으로 전체적 탄력 개선에 탁월합니다. 처짐이 심하면 울쎄라피 프라임, 탄력 저하가 주 고민이면 써마지를 권장합니다.'
    },
    {
      q: '써마지 시술 중 통증이 많이 느껴지나요?',
      a: 'FLX는 진동 기술(Comfort Pulse Technology)로 시술 중 불편감을 최소화했습니다. 무마취로 진행 가능하며, 대부분의 환자분들이 참을 수 있는 수준의 열감만 느끼십니다.'
    },
    {
      q: '써마지 정품 확인은 어떻게 하나요?',
      a: '리브성형외과는 솔타메디칼 공식 인증 클리닉입니다. 시술 전 정품 팁의 시리얼 번호와 실제 샷 수를 확인하실 수 있으며, 시술 후 정품 인증서를 발급해드립니다.'
    },
  ];

  return (
    <>
      {/* Hero Section - Premium Full Screen with Gold Accent */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/10 via-background to-primary/5" />

        {/* Animated background elements */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-[#FF6B35]/5 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl"
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
                {/* Badge */}
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-xl rounded-full shadow-lg border border-[#D4AF37]/20 mb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-[#FF6B35]"><RFIcon /></span>
                  <span className="text-small font-medium text-secondary">4세대 프리미엄 고주파</span>
                </motion.div>

                <p className="font-serif text-h2 text-[#FF6B35] mb-3 tracking-wide">Thermage FLX</p>
                <h1 className="text-display text-secondary mb-4 leading-tight">
                  써마지 FLX
                </h1>
                <p className="font-serif text-xl text-mono-light mb-6 italic">
                  {treatment.tagline}
                </p>
                <p className="text-h4 text-mono leading-relaxed mb-8 max-w-lg">
                  AccuREP 기술로 피부 상태에 맞는 최적 에너지 자동 조절.<br />
                  진동 기술로 통증은 줄이고, 효과는 높이는 고주파 리프팅.
                </p>

{/* Quick stats */}
                <div className="flex gap-8 mt-10 pt-8 border-t border-border/50">
                  <div>
                    <p className="text-h2 text-[#FF6B35] font-serif">14M+</p>
                    <p className="text-small text-mono-light">전세계 시술 건수</p>
                  </div>
                  <div>
                    <p className="text-h2 text-[#FF6B35] font-serif">25%</p>
                    <p className="text-small text-mono-light">시술시간 단축</p>
                  </div>
                  <div>
                    <p className="text-h2 text-[#FF6B35] font-serif">93%</p>
                    <p className="text-small text-mono-light">환자 만족도</p>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Right: Visual with Video */}
            <AnimateOnScroll animation="fadeInRight">
              <div className="relative">
                {/* Main visual with device video */}
                <motion.div
                  className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  {/* Premium gradient border */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#FF6B35]/30 via-[#D4AF37]/20 to-primary/30 p-[2px]">
                    <div className="w-full h-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d]">
                      {/* Hero Video */}
                      <video
                        src="/images/lifting/thermage/videos/thermage-flx-demo.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />

                      {/* Glassmorphism overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />

                      {/* Premium corner accents */}
                      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#D4AF37]/50 rounded-tl-lg" />
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#D4AF37]/50 rounded-br-lg" />
                    </div>
                  </div>
                </motion.div>

                {/* Floating badges - Dynamic Labels */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`top-${currentLabelIndex}`}
                    className="absolute -top-4 -right-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl px-4 py-3 border border-[#D4AF37]/20"
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: [0, -10, 0], scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    transition={{
                      opacity: { duration: 0.5 },
                      y: { duration: 3, repeat: Infinity },
                      scale: { duration: 0.5 }
                    }}
                  >
                    <p className="text-small font-medium text-secondary">{heroLabels[currentLabelIndex].top.title}</p>
                    <p className="text-xs text-mono-light">{heroLabels[currentLabelIndex].top.subtitle}</p>
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`bottom-${currentLabelIndex}`}
                    className="absolute -bottom-4 -left-4 bg-gradient-to-r from-[#FF6B35] to-[#FF8B55] text-white rounded-2xl shadow-xl px-4 py-3"
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: [0, 10, 0], scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{
                      opacity: { duration: 0.5 },
                      y: { duration: 3, repeat: Infinity, delay: 1 },
                      scale: { duration: 0.5 }
                    }}
                  >
                    <p className="text-small font-medium">{heroLabels[currentLabelIndex].bottom.title}</p>
                    <p className="text-xs opacity-80">{heroLabels[currentLabelIndex].bottom.subtitle}</p>
                  </motion.div>
                </AnimatePresence>

                {/* Premium glow effect */}
                <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-[#FF6B35]/20 to-[#D4AF37]/20 blur-2xl opacity-50" />
              </div>
            </AnimateOnScroll>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg className="w-6 h-6 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* About Section - 써마지란? */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#FF6B35] mb-2">About Thermage</p>
              <h2 className="text-h1 text-secondary mb-6">써마지 FLX란?</h2>
              <p className="text-body text-mono max-w-3xl mx-auto leading-relaxed">
                써마지 FLX는 <strong className="text-secondary">전 세계 1,400만 건 이상</strong> 시술된 글로벌 No.1 고주파(RF) 리프팅 장비입니다.
                특허받은 AccuREP 기술로 피부 임피던스를 실시간 측정하여 최적의 에너지를 자동으로 조절하며,
                콜라겐 수축과 재생을 통해 피부 탄력을 개선합니다.
              </p>
            </div>
          </AnimateOnScroll>

          {/* Technology explanation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <AnimateOnScroll animation="fadeInLeft">
              <RFEnergyDiagram />
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInRight">
              <div className="space-y-6">
                <h3 className="text-h2 text-secondary mb-4">
                  고주파 에너지의 원리
                </h3>

                <div className="space-y-4">
                  <Card padding="md" hover={false} className="border-l-4 border-l-[#FF6B35]/50">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#FF6B35] font-serif font-bold text-lg">1</span>
                      </div>
                      <div>
                        <h4 className="text-h4 text-secondary mb-1">RF 에너지 전달</h4>
                        <p className="text-body text-mono-light">고주파 에너지가 진피층에 균일하게 전달되어 65-75°C의 열을 발생시킵니다.</p>
                      </div>
                    </div>
                  </Card>

                  <Card padding="md" hover={false} className="border-l-4 border-l-[#FF6B35]/70">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#FF6B35]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#FF6B35] font-serif font-bold text-lg">2</span>
                      </div>
                      <div>
                        <h4 className="text-h4 text-secondary mb-1">콜라겐 수축</h4>
                        <p className="text-body text-mono-light">열 에너지로 기존 콜라겐이 수축되어 즉각적인 탄력 개선 효과가 나타납니다.</p>
                      </div>
                    </div>
                  </Card>

                  <Card padding="md" hover={false} className="border-l-4 border-l-[#FF6B35]">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#FF6B35]/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#FF6B35] font-serif font-bold text-lg">3</span>
                      </div>
                      <div>
                        <h4 className="text-h4 text-secondary mb-1">신생 콜라겐 생성</h4>
                        <p className="text-body text-mono-light">3-6개월에 걸쳐 신생 콜라겐이 생성되며 지속적인 탄력 개선이 이루어집니다.</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Why Thermage Section */}
      <section className="section-gap bg-gradient-to-b from-background to-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#FF6B35] mb-2">Why Thermage FLX?</p>
              <h2 className="text-h1 text-secondary">왜 써마지 FLX인가?</h2>
            </div>
          </AnimateOnScroll>

          <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StaggerItem>
              <Card padding="lg" className="h-full text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B35]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="mb-4">
                    <AccuREPIllustration />
                  </div>
                  <h3 className="text-h3 text-secondary mb-4">AccuREP 기술</h3>
                  <p className="text-body text-mono-light leading-relaxed">
                    피부 임피던스를 <strong className="text-secondary">실시간 측정</strong>하여 각 부위에 최적화된 에너지를 자동으로 조절합니다.
                    균일하고 안전한 시술 결과를 보장합니다.
                  </p>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card padding="lg" className="h-full text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B35]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="mb-4">
                    <ComfortPlusIllustration />
                  </div>
                  <h3 className="text-h3 text-secondary mb-4">Comfort Pulse</h3>
                  <p className="text-body text-mono-light leading-relaxed">
                    특허받은 진동 기술로 시술 중 <strong className="text-secondary">통증을 최소화</strong>합니다.
                    무마취로도 편안하게 시술받을 수 있습니다.
                  </p>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card padding="lg" className="h-full text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B35]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="mb-4">
                    <CollagenIllustration />
                  </div>
                  <h3 className="text-h3 text-secondary mb-4">콜라겐 리모델링</h3>
                  <p className="text-body text-mono-light leading-relaxed">
                    시술 직후 <strong className="text-secondary">즉각적 수축 효과</strong>와 함께 3-6개월에 걸친 신생 콜라겐 생성으로
                    점진적인 탄력 개선이 이루어집니다.
                  </p>
                </div>
              </Card>
            </StaggerItem>
          </StaggerChildren>

          {/* Clinical evidence banner */}
          <AnimateOnScroll>
            <div className="mt-16 p-8 bg-gradient-to-r from-[#FF6B35] to-primary rounded-3xl text-white text-center">
              <p className="font-serif text-h3 opacity-80 mb-4">Global Trust</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <p className="text-h1 font-serif">14M+</p>
                  <p className="text-small opacity-70">전세계 시술 건수</p>
                </div>
                <div>
                  <p className="text-h1 font-serif">93%</p>
                  <p className="text-small opacity-70">환자 만족도</p>
                </div>
                <div>
                  <p className="text-h1 font-serif">25%</p>
                  <p className="text-small opacity-70">시술 시간 단축</p>
                </div>
                <div>
                  <p className="text-h1 font-serif">1년+</p>
                  <p className="text-small opacity-70">효과 지속 기간</p>
                </div>
              </div>
              <p className="text-small opacity-60 mt-6">
                출처: Solta Medical 공식 임상 데이터
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Tips Section */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#FF6B35] mb-2">Treatment Tips</p>
              <h2 className="text-h1 text-secondary mb-4">부위별 맞춤 팁</h2>
              <p className="text-body text-mono-light">
                다양한 크기의 팁으로 부위에 따라 최적화된 시술이 가능합니다
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <Card padding="lg" hover={false}>
              <TipTypes />
            </Card>
          </AnimateOnScroll>

          {/* Thermage Eye */}
          <AnimateOnScroll>
            <div className="mt-12 p-8 bg-gradient-to-r from-primary/5 to-[#FF6B35]/5 rounded-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="font-serif text-h3 text-[#FF6B35] mb-2">Thermage Eye</p>
                  <h3 className="text-h2 text-secondary mb-4">써마지 아이</h3>
                  <p className="text-body text-mono leading-relaxed mb-6">
                    눈가 전용 Total Tip으로 눈꺼풀 처짐, 눈밑 주름, 까마귀발 개선에 효과적입니다.
                    눈가 피부는 얇고 예민하기 때문에 전용 팁으로 섬세하게 시술합니다.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-body text-mono">
                      <span className="text-[#FF6B35]"><CheckIcon /></span>
                      눈꺼풀 탄력 개선
                    </li>
                    <li className="flex items-center gap-2 text-body text-mono">
                      <span className="text-[#FF6B35]"><CheckIcon /></span>
                      눈밑 주름 완화
                    </li>
                    <li className="flex items-center gap-2 text-body text-mono">
                      <span className="text-[#FF6B35]"><CheckIcon /></span>
                      눈가 전체 타이트닝
                    </li>
                  </ul>
                </div>
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg group">
                  <img
                    src="/images/lifting/thermage/treatment/thermage-eye.png"
                    alt="써마지 아이 시술"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Generation Compare Section */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#FF6B35] mb-2">Generation Comparison</p>
              <h2 className="text-h1 text-secondary mb-4">써마지 세대별 비교</h2>
              <p className="text-body text-mono-light">
                4세대 FLX는 기존 세대 대비 획기적으로 개선된 최신 기술입니다
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <Card padding="lg" hover={false}>
              <GenerationTable />
            </Card>
          </AnimateOnScroll>
        </div>
      </section>

      {/* LIV Section - 리브만의 써마지 */}
      <section className="section-gap bg-gradient-to-b from-secondary/5 to-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#FF6B35] mb-2">LIV Difference</p>
              <h2 className="text-h1 text-secondary">리브만의 써마지</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimateOnScroll animation="fadeInUp" delay={0}>
              <Card padding="lg" className="h-full border-t-4 border-t-[#FF6B35]">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FF6B35]/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-h4 text-secondary mb-3">정품 인증 클리닉</h3>
                  <p className="text-body text-mono-light">
                    솔타메디칼 공식 인증 클리닉으로 정품 장비와 팁만 사용합니다.
                    시리얼 번호 확인 및 정품 인증서 발급이 가능합니다.
                  </p>
                </div>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInUp" delay={0.1}>
              <Card padding="lg" className="h-full border-t-4 border-t-[#FF6B35]">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FF6B35]/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-h4 text-secondary mb-3">샷 수 투명 공개</h3>
                  <p className="text-body text-mono-light">
                    시술 전 계획된 샷 수와 실제 사용된 샷 수를 투명하게 공개합니다.
                    정직한 시술을 약속드립니다.
                  </p>
                </div>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInUp" delay={0.2}>
              <Card padding="lg" className="h-full border-t-4 border-t-[#FF6B35]">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FF6B35]/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Collagen Timeline Section */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#FF6B35] mb-2">Results Timeline</p>
              <h2 className="text-h1 text-secondary mb-4">{t('common.timeline')}</h2>
              <p className="text-body text-mono-light">
                써마지 시술 후 즉각적 효과와 점진적 콜라겐 재생이 함께 나타납니다
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <div className="py-8 px-4 md:px-8">
              <CollagenTimeline />
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Process Section */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#FF6B35] mb-2">Treatment Process</p>
              <h2 className="text-h1 text-secondary">{t('common.process')}</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
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
        </div>
      </section>

      {/* Treatment Info Section */}
      <section className="py-20 bg-gradient-to-r from-[#FF6B35] to-primary text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-12">
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

          {/* Recommended shots info */}
          <AnimateOnScroll>
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur">
              <h3 className="text-h4 mb-4 text-center">부위별 권장 샷 수</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-h3 font-serif">300-400</p>
                  <p className="text-small opacity-70">전안면</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-h3 font-serif">200-300</p>
                  <p className="text-small opacity-70">하안면</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-h3 font-serif">225</p>
                  <p className="text-small opacity-70">눈가 (아이)</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-h3 font-serif">500-900</p>
                  <p className="text-small opacity-70">전안면 + 목</p>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Target & Ideal For Section */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <AnimateOnScroll animation="fadeInLeft">
              <Card padding="lg">
                <h3 className="text-h3 text-secondary mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t('common.targetAreas')}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {treatment.targetAreas.map((area, index) => (
                    <motion.span
                      key={index}
                      className="px-4 py-2 bg-[#FF6B35]/10 text-[#FF6B35] rounded-full text-body"
                      whileHover={{ scale: 1.05 }}
                    >
                      {area}
                    </motion.span>
                  ))}
                </div>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInRight">
              <Card padding="lg">
                <h3 className="text-h3 text-secondary mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {t('common.recommended')}
                </h3>
                <ul className="space-y-3">
                  {treatment.idealFor.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-body text-mono">
                      <span className="text-[#FF6B35] mt-0.5"><CheckIcon /></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Cautions Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl mx-auto">
              <Card padding="lg" className="border-2 border-[#FF6B35]/20">
                <h3 className="text-h3 text-secondary mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {t('common.precautions')}
                </h3>
                <ul className="space-y-3">
                  {treatment.cautions.map((caution, index) => (
                    <li key={index} className="flex items-start gap-3 text-body text-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] mt-2 flex-shrink-0" />
                      {caution}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#FF6B35] mb-2">FAQ</p>
              <h2 className="text-h1 text-secondary">자주 묻는 질문</h2>
            </div>
          </AnimateOnScroll>

          <div className="max-w-3xl mx-auto space-y-4">
            {extendedFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  padding="none"
                  hover={false}
                  className="overflow-hidden"
                  id={`faq-${index}`}
                  ref={(el: HTMLDivElement | null) => {
                    if (el) faqRefs.current.set(index, el);
                  }}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 text-left flex items-start justify-between gap-4 hover:bg-background/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-full bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#FF6B35] font-serif font-medium">Q</span>
                      </span>
                      <span className="text-h4 text-secondary pt-0.5">{faq.q}</span>
                    </div>
                    <motion.svg
                      className="w-5 h-5 text-mono-light flex-shrink-0 mt-1.5"
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
                        <div className="px-6 pb-5">
                          <div className="flex items-start gap-3 pt-3 border-t border-border">
                            <span className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-secondary font-serif font-medium">A</span>
                            </span>
                            <p className="text-body text-mono leading-relaxed pt-1">{faq.a}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Link to Medical Q&A */}
          {relatedMedicalQA.length > 0 && (
            <AnimateOnScroll>
              <div className="text-center mt-12">
                <p className="text-body text-mono-light mb-4">
                  더 많은 의료 정보가 궁금하신가요?
                </p>
                <Link href="/medical">
                  <Button variant="outline">
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
      <section className="py-24 bg-gradient-to-br from-secondary via-secondary to-[#FF6B35]/80 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
        </div>

        <div className="container-custom relative z-10">
          <AnimateOnScroll>
            <div className="text-center max-w-2xl mx-auto">
              <p className="font-serif text-h3 opacity-80 mb-4">Ready for Transformation?</p>
              <h2 className="text-h1 mb-6">써마지 상담 예약</h2>
              <p className="text-h4 opacity-90 mb-10 leading-relaxed">
                전문 의료진과 1:1 맞춤 상담을 통해<br />
                나에게 맞는 최적의 시술 계획을 수립해보세요.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <ScrollLink href="/contact">
                  <Button variant="ghost" size="lg" className="bg-white !text-secondary hover:bg-[#FF6B35] hover:!text-white w-full sm:w-auto">
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
        <section className="section-gap bg-white">
          <div className="container-custom">
            <AnimateOnScroll>
              <div className="text-center mb-16">
                <p className="font-serif text-h3 text-[#FF6B35] mb-2">Related Treatments</p>
                <h2 className="text-h1 text-secondary">함께 보면 좋은 시술</h2>
              </div>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                            <p className="font-serif text-[#FF6B35] mb-1">{related.nameEn}</p>
                            <h3 className="text-h4 text-secondary group-hover:text-[#FF6B35] transition-colors">
                              {related.name}
                            </h3>
                            <p className="text-small text-mono-light mt-2">{related.shortDesc}</p>
                          </div>
                          <svg className="w-6 h-6 text-[#FF6B35] group-hover:translate-x-2 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
