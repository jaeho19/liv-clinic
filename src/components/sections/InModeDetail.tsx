'use client';

import { useState, useCallback } from 'react';
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

// Brand Colors
const INMODE_COLORS = {
  primary: '#E91E63', // Pink
  forma: '#4CAF50', // Green
  morpheus: '#9C27B0', // Purple
  facetite: '#FF9800', // Orange
};

// Forma Illustration
const FormaIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-full h-40">
    <defs>
      <linearGradient id="formaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#81C784" stopOpacity="0.3" />
      </linearGradient>
      <radialGradient id="formaHeat" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#4CAF50" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="100" cy="80" r="65" fill="url(#formaGrad)" />
    {/* Handpiece shape */}
    <motion.ellipse
      cx="100" cy="80" rx="35" ry="25"
      fill="#4CAF50"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    {/* Heat waves */}
    {[0, 1, 2].map((i) => (
      <motion.ellipse
        key={i}
        cx="100" cy="80"
        rx={45 + i * 12} ry={35 + i * 8}
        fill="none"
        stroke="#4CAF50"
        strokeWidth="2"
        strokeDasharray="8 4"
        initial={{ opacity: 0.2 }}
        animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
      />
    ))}
    <text x="100" y="85" fill="white" fontSize="14" fontWeight="bold" textAnchor="middle">FORMA</text>
    <text x="100" y="145" fill="#4CAF50" fontSize="10" fontWeight="bold" textAnchor="middle">피부 탄력</text>
  </svg>
);

// Morpheus8 Illustration
const Morpheus8Illustration = () => (
  <svg viewBox="0 0 200 160" className="w-full h-40">
    <defs>
      <linearGradient id="morphGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9C27B0" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#CE93D8" stopOpacity="0.3" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="80" r="65" fill="url(#morphGrad)" />
    {/* Grid pattern for microneedling */}
    <g transform="translate(60, 45)">
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2, 3, 4].map((col) => (
          <motion.circle
            key={`${row}-${col}`}
            cx={col * 20}
            cy={row * 15}
            r="3"
            fill="#9C27B0"
            initial={{ opacity: 0.3, y: 0 }}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: (row + col) * 0.1 }}
          />
        ))
      )}
    </g>
    {/* RF energy indicator */}
    <motion.path
      d="M60 120 L100 100 L140 120"
      fill="none"
      stroke="#9C27B0"
      strokeWidth="3"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: [0, 1, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <text x="100" y="145" fill="#9C27B0" fontSize="10" fontWeight="bold" textAnchor="middle">마이크로니들 RF</text>
  </svg>
);

// FaceTite Illustration
const FaceTiteIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-full h-40">
    <defs>
      <linearGradient id="faceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF9800" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#FFB74D" stopOpacity="0.3" />
      </linearGradient>
      <linearGradient id="liftGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#FF9800" />
        <stop offset="100%" stopColor="#FFB74D" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="80" r="65" fill="url(#faceGrad)" />
    {/* Face outline */}
    <ellipse cx="100" cy="75" rx="40" ry="50" fill="none" stroke="#FF9800" strokeWidth="2" />
    {/* Lifting arrows */}
    <motion.g
      initial={{ y: 10 }}
      animate={{ y: [10, 0, 10] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <path d="M65 90 L65 70" stroke="url(#liftGrad)" strokeWidth="3" strokeLinecap="round" />
      <polygon points="65,65 60,75 70,75" fill="#FF9800" />
    </motion.g>
    <motion.g
      initial={{ y: 10 }}
      animate={{ y: [10, 0, 10] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
    >
      <path d="M135 90 L135 70" stroke="url(#liftGrad)" strokeWidth="3" strokeLinecap="round" />
      <polygon points="135,65 130,75 140,75" fill="#FF9800" />
    </motion.g>
    {/* Tightening effect */}
    <motion.ellipse
      cx="100" cy="95" rx="25" ry="8"
      fill="none"
      stroke="#FF9800"
      strokeWidth="2"
      strokeDasharray="5 3"
      animate={{ rx: [25, 20, 25], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <text x="100" y="145" fill="#FF9800" fontSize="10" fontWeight="bold" textAnchor="middle">지방 타이트닝</text>
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
    <div className={`relative ${ratioClasses[aspectRatio]} rounded-2xl overflow-hidden bg-gradient-to-br from-[#E91E63]/10 via-background to-[#9C27B0]/10`}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        <svg className="w-16 h-16 text-[#E91E63]/30 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-mono-light text-sm text-center">{label}</p>
      </div>
      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#E91E63]/10" />
      <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-[#9C27B0]/10" />
    </div>
  );
};

// Before/After Comparison Placeholder
const BeforeAfterPlaceholder = ({ treatment }: { treatment: string }) => (
  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-mono-light/5 to-[#E91E63]/5">
    <div className="grid grid-cols-2 divide-x divide-border">
      <div className="aspect-[4/5] flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-mono-light/20 mb-3 flex items-center justify-center">
          <span className="text-mono-light text-2xl font-serif">B</span>
        </div>
        <p className="text-mono-light text-sm">Before</p>
      </div>
      <div className="aspect-[4/5] flex flex-col items-center justify-center p-6 bg-[#E91E63]/5">
        <div className="w-20 h-20 rounded-full bg-[#E91E63]/20 mb-3 flex items-center justify-center">
          <span className="text-[#E91E63] text-2xl font-serif">A</span>
        </div>
        <p className="text-[#E91E63] text-sm">After</p>
      </div>
    </div>
    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent flex items-end justify-center pb-3">
      <span className="text-xs text-mono-light">{treatment}</span>
    </div>
  </div>
);

// Treatment Card Component for each handpiece
const TreatmentCard = ({
  name,
  nameKo,
  color,
  icon,
  description,
  benefits,
  duration,
  downtime,
  idealFor
}: {
  name: string;
  nameKo: string;
  color: string;
  icon: React.ReactNode;
  description: string;
  benefits: string[];
  duration: string;
  downtime: string;
  idealFor: string[];
}) => (
  <Card padding="lg" className="h-full" style={{ borderTopWidth: '4px', borderTopColor: color }}>
    <div className="mb-6">
      {icon}
    </div>
    <div className="mb-4">
      <h3 className="text-h3 text-secondary">{name}</h3>
      <p className="text-body font-medium" style={{ color }}>{nameKo}</p>
    </div>
    <p className="text-body text-mono-light mb-6">{description}</p>

    <div className="space-y-4">
      <div>
        <p className="text-small font-medium text-secondary mb-2">주요 효과</p>
        <ul className="space-y-1">
          {benefits.map((benefit, i) => (
            <li key={i} className="flex items-start gap-2 text-small text-mono">
              <span style={{ color }} className="mt-0.5"><CheckIcon /></span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div>
          <p className="text-xs text-mono-light">시술 시간</p>
          <p className="text-small font-medium text-secondary">{duration}</p>
        </div>
        <div>
          <p className="text-xs text-mono-light">다운타임</p>
          <p className="text-small font-medium text-secondary">{downtime}</p>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-mono-light mb-2">추천 대상</p>
        <div className="flex flex-wrap gap-2">
          {idealFor.map((item, i) => (
            <span
              key={i}
              className="px-2 py-1 text-xs rounded-full"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  </Card>
);

// Comparison Table Component
const ComparisonTable = () => {
  const comparisonData = [
    { feature: '시술 방식', forma: 'RF 고주파', morpheus: '마이크로니들 + RF', facetite: '캐뉼라 + RF' },
    { feature: '침습도', forma: '비침습', morpheus: '최소침습', facetite: '최소침습' },
    { feature: '마취', forma: '불필요', morpheus: '마취크림', facetite: '국소마취' },
    { feature: '다운타임', forma: '없음', morpheus: '3-5일', facetite: '5-7일' },
    { feature: '효과 발현', forma: '점진적', morpheus: '점진적', facetite: '즉각적' },
    { feature: '시술 횟수', forma: '4-6회', morpheus: '2-3회', facetite: '1회' },
    { feature: '주요 타겟', forma: '탄력', morpheus: '모공/흉터', facetite: '지방/처짐' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b-2 border-[#E91E63]/20">
            <th className="py-4 px-4 text-left text-h4 text-secondary">비교 항목</th>
            <th className="py-4 px-4 text-center rounded-t-lg" style={{ backgroundColor: `${INMODE_COLORS.forma}10` }}>
              <span className="text-h4" style={{ color: INMODE_COLORS.forma }}>Forma</span>
            </th>
            <th className="py-4 px-4 text-center" style={{ backgroundColor: `${INMODE_COLORS.morpheus}10` }}>
              <span className="text-h4" style={{ color: INMODE_COLORS.morpheus }}>Morpheus8</span>
            </th>
            <th className="py-4 px-4 text-center" style={{ backgroundColor: `${INMODE_COLORS.facetite}10` }}>
              <span className="text-h4" style={{ color: INMODE_COLORS.facetite }}>FaceTite</span>
            </th>
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
              <td className="py-4 px-4 text-center text-body" style={{ backgroundColor: `${INMODE_COLORS.forma}05`, color: INMODE_COLORS.forma }}>{row.forma}</td>
              <td className="py-4 px-4 text-center text-body" style={{ backgroundColor: `${INMODE_COLORS.morpheus}05`, color: INMODE_COLORS.morpheus }}>{row.morpheus}</td>
              <td className="py-4 px-4 text-center text-body" style={{ backgroundColor: `${INMODE_COLORS.facetite}05`, color: INMODE_COLORS.facetite }}>{row.facetite}</td>
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
    {!isLast && (
      <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-[#E91E63] to-[#E91E63]/30" />
    )}

    <motion.div
      className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-[#E91E63] to-[#9C27B0] text-white flex items-center justify-center text-xl font-serif shadow-lg"
      whileHover={{ scale: 1.1 }}
    >
      {step}
    </motion.div>

    <div className="mt-4">
      <h4 className="text-h4 text-secondary mb-2">{title}</h4>
      <p className="text-small text-mono-light max-w-[150px]">{desc}</p>
    </div>
  </motion.div>
);

// Main Component
export default function InModeDetail() {
  const treatment = TREATMENTS.lifting.inmode;
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'forma' | 'morpheus' | 'facetite'>('morpheus');

  const relatedMedicalQA = MEDICAL_QA.filter((qa) =>
    qa.relatedTreatments?.some((id) => (id as string) === 'inmode')
  );

  const toggleFaq = useCallback((index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  }, [expandedFaq]);

  // Extended FAQ data
  const extendedFaqs = [
    ...treatment.faqs,
    {
      q: '인모드 시술 중 가장 인기 있는 것은 무엇인가요?',
      a: 'Morpheus8이 가장 인기 있습니다. 마이크로니들과 RF를 결합하여 모공, 흉터, 피부결, 탄력을 동시에 개선할 수 있어 다양한 피부 고민을 가진 분들께 효과적입니다.'
    },
    {
      q: '인모드 시술을 여러 개 조합해서 받을 수 있나요?',
      a: '네, 가능합니다. 예를 들어 Morpheus8으로 피부결을 개선하고 FaceTite로 지방을 타이트닝하는 조합이 인기 있습니다. 상담을 통해 최적의 조합을 결정합니다.'
    },
    {
      q: '인모드와 다른 리프팅 시술의 차이점은?',
      a: '인모드는 올인원 플랫폼으로 하나의 시스템에서 다양한 시술을 선택할 수 있습니다. 특히 Morpheus8은 마이크로니들 RF로 피부결과 탄력을, FaceTite는 지방 타이트닝까지 가능해 개인 맞춤 시술이 가능합니다.'
    },
  ];

  const treatmentOptions = [
    {
      id: 'forma',
      name: 'Forma',
      nameKo: '포르마',
      color: INMODE_COLORS.forma,
      icon: <FormaIllustration />,
      description: '비침습 RF 고주파로 콜라겐 수축과 재생을 유도하여 피부 탄력을 개선합니다. 통증이 거의 없고 다운타임이 없어 일상생활에 지장이 없습니다.',
      benefits: ['즉각적 피부 탄력', '콜라겐 재생 촉진', '잔주름 개선', '무통증 시술'],
      duration: '20-30분',
      downtime: '없음',
      idealFor: ['탄력 저하', '잔주름', '예방관리'],
    },
    {
      id: 'morpheus',
      name: 'Morpheus8',
      nameKo: '모피어스8',
      color: INMODE_COLORS.morpheus,
      icon: <Morpheus8Illustration />,
      description: '24개의 금도금 마이크로니들이 진피층까지 RF 에너지를 전달하여 피부 리모델링을 유도합니다. 모공, 흉터, 피부결, 탄력을 동시에 개선합니다.',
      benefits: ['모공 축소', '여드름 흉터 개선', '피부결 개선', '진피층 리모델링'],
      duration: '30-45분',
      downtime: '3-5일',
      idealFor: ['넓은 모공', '여드름 흉터', '피부결'],
    },
    {
      id: 'facetite',
      name: 'FaceTite',
      nameKo: '페이스타이트',
      color: INMODE_COLORS.facetite,
      icon: <FaceTiteIllustration />,
      description: '얇은 캐뉼라를 통해 지방층에 직접 RF 에너지를 전달하여 지방을 녹이고 피부를 타이트닝합니다. 미니 리프팅급의 효과를 제공합니다.',
      benefits: ['지방 감소', '피부 타이트닝', '턱선 개선', '이중턱 개선'],
      duration: '60-90분',
      downtime: '5-7일',
      idealFor: ['이중턱', '볼살', '턱선 처짐'],
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E91E63]/10 via-background to-[#9C27B0]/5" />

        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-[#E91E63]/5 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-[#9C27B0]/5 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        />

        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimateOnScroll animation="fadeInLeft">
              <div>
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-xl rounded-full shadow-lg border border-[#D4AF37]/20 mb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="flex gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: INMODE_COLORS.forma }} />
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: INMODE_COLORS.morpheus }} />
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: INMODE_COLORS.facetite }} />
                  </span>
                  <span className="text-small font-medium text-secondary">올인원 리프팅 시스템</span>
                </motion.div>

                <p className="font-serif text-h2 text-[#E91E63] mb-3 tracking-wide">InMode</p>
                <h1 className="text-display text-secondary mb-4 leading-tight">
                  인모드
                </h1>
                <p className="font-serif text-xl text-mono-light mb-6 italic">
                  {treatment.tagline}
                </p>
                <p className="text-h4 text-mono leading-relaxed mb-8 max-w-lg">
                  고주파(RF) 에너지로 지방 감소와 리프팅을 동시에.<br />
                  얼굴 지방이 고민이라면 인모드가 답입니다.
                </p>

                <div className="flex flex-wrap gap-4">
                  <ScrollLink href="/contact">
                    <Button variant="primary" size="lg">
                      무료 상담 예약
                    </Button>
                  </ScrollLink>
                  <a href="tel:02-797-2773">
                    <Button variant="outline" size="lg">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      02-797-2773
                    </Button>
                  </a>
                </div>

                <div className="flex gap-8 mt-10 pt-8 border-t border-border/50">
                  <div>
                    <p className="text-h2 text-[#E91E63] font-serif">RF</p>
                    <p className="text-small text-mono-light">고주파 에너지</p>
                  </div>
                  <div>
                    <p className="text-h2 text-[#E91E63] font-serif">FDA</p>
                    <p className="text-small text-mono-light">승인 장비</p>
                  </div>
                  <div>
                    <p className="text-h2 text-[#E91E63] font-serif">맞춤</p>
                    <p className="text-small text-mono-light">개인별 시술</p>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInRight">
              <div className="relative">
                <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: 'url(/images/lifting/inmode-hero.png)' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#E91E63]/20 via-transparent to-[#9C27B0]/10" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div className="relative w-64 h-64">
                      {/* Three orbiting circles */}
                      <motion.div
                        className="absolute inset-0"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      >
                        <motion.div
                          className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: INMODE_COLORS.forma }}
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          Forma
                        </motion.div>
                      </motion.div>
                      <motion.div
                        className="absolute inset-0"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      >
                        <motion.div
                          className="absolute bottom-4 left-4 w-16 h-16 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: INMODE_COLORS.morpheus }}
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        >
                          M8
                        </motion.div>
                      </motion.div>
                      <motion.div
                        className="absolute inset-0"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                      >
                        <motion.div
                          className="absolute bottom-4 right-4 w-16 h-16 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: INMODE_COLORS.facetite }}
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        >
                          FT
                        </motion.div>
                      </motion.div>
                      {/* Center */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E91E63] to-[#9C27B0] flex items-center justify-center"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <span className="text-white font-serif text-lg">IN</span>
                        </motion.div>
                      </div>
                    </motion.div>
                    <div className="absolute bottom-8 left-0 right-0 text-center">
                      <p className="font-serif text-2xl text-secondary/70">All-in-One</p>
                      <p className="text-small text-mono-light">Premium Platform</p>
                    </div>
                  </div>
                </div>

                <motion.div
                  className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg px-4 py-3"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <p className="text-small font-medium" style={{ color: INMODE_COLORS.morpheus }}>Morpheus8</p>
                  <p className="text-xs text-mono-light">마이크로니들 RF</p>
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -left-4 bg-[#E91E63] text-white rounded-2xl shadow-lg px-4 py-3"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                >
                  <p className="text-small font-medium">맞춤 시술</p>
                  <p className="text-xs opacity-80">고민별 최적화</p>
                </motion.div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg className="w-6 h-6 text-[#E91E63]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* About Section */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#E91E63] mb-2">About InMode</p>
              <h2 className="text-h1 text-secondary mb-6">인모드란?</h2>
              <p className="text-body text-mono max-w-3xl mx-auto leading-relaxed">
                인모드는 <strong className="text-secondary">고주파(RF) 에너지</strong>를 활용하여 지방층과 진피층을 동시에 자극하는
                멀티 리프팅 장비입니다. 얼굴 지방이 많은 타입이나 늘어진 피부가 복합적으로 고민인 경우에 효과적입니다.
              </p>
            </div>
          </AnimateOnScroll>

          {/* Treatment Tabs */}
          <AnimateOnScroll>
            <div className="flex justify-center gap-4 mb-12">
              {treatmentOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setActiveTab(option.id as 'forma' | 'morpheus' | 'facetite')}
                  className={`px-6 py-3 rounded-full text-body font-medium transition-all ${
                    activeTab === option.id
                      ? 'text-white shadow-lg'
                      : 'bg-background text-mono hover:bg-background/80'
                  }`}
                  style={{
                    backgroundColor: activeTab === option.id ? option.color : undefined
                  }}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </AnimateOnScroll>

          {/* Treatment Cards */}
          <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {treatmentOptions.map((option) => (
              <StaggerItem key={option.id}>
                <TreatmentCard {...option} />
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Compare Section */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#E91E63] mb-2">Comparison</p>
              <h2 className="text-h1 text-secondary mb-4">핸드피스 비교</h2>
              <p className="text-body text-mono-light">
                각 시술의 특성을 비교하여 나에게 맞는 시술을 찾아보세요
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <Card padding="lg" hover={false}>
              <ComparisonTable />
            </Card>
          </AnimateOnScroll>

          {/* Recommendation */}
          <AnimateOnScroll>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl" style={{ backgroundColor: `${INMODE_COLORS.forma}10` }}>
                <h4 className="text-h4 mb-2" style={{ color: INMODE_COLORS.forma }}>Forma 추천</h4>
                <p className="text-body text-mono-light">
                  피부 탄력 유지, 예방 관리, 다운타임 없이 시술받고 싶은 분
                </p>
              </div>
              <div className="p-6 rounded-2xl" style={{ backgroundColor: `${INMODE_COLORS.morpheus}10` }}>
                <h4 className="text-h4 mb-2" style={{ color: INMODE_COLORS.morpheus }}>Morpheus8 추천</h4>
                <p className="text-body text-mono-light">
                  모공, 흉터, 피부결 개선을 원하고 단기 다운타임 가능한 분
                </p>
              </div>
              <div className="p-6 rounded-2xl" style={{ backgroundColor: `${INMODE_COLORS.facetite}10` }}>
                <h4 className="text-h4 mb-2" style={{ color: INMODE_COLORS.facetite }}>FaceTite 추천</h4>
                <p className="text-body text-mono-light">
                  이중턱, 볼살 등 지방 처짐이 고민이고 확실한 효과를 원하는 분
                </p>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#E91E63] mb-2">Treatment Gallery</p>
              <h2 className="text-h1 text-secondary mb-4">인모드 시술 사례</h2>
              <p className="text-body text-mono-light">
                실제 리브성형외과에서 시술받으신 분들의 변화입니다
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <AnimateOnScroll animation="fadeInUp" delay={0}>
              <BeforeAfterPlaceholder treatment="Morpheus8 - 모공/피부결" />
            </AnimateOnScroll>
            <AnimateOnScroll animation="fadeInUp" delay={0.1}>
              <BeforeAfterPlaceholder treatment="FaceTite - 이중턱 개선" />
            </AnimateOnScroll>
            <AnimateOnScroll animation="fadeInUp" delay={0.2}>
              <BeforeAfterPlaceholder treatment="Forma - 피부 탄력" />
            </AnimateOnScroll>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnimateOnScroll animation="scaleIn" delay={0}>
              <ImagePlaceholder label="인모드 장비" aspectRatio="square" />
            </AnimateOnScroll>
            <AnimateOnScroll animation="scaleIn" delay={0.1}>
              <ImagePlaceholder label="Morpheus8 팁" aspectRatio="square" />
            </AnimateOnScroll>
            <AnimateOnScroll animation="scaleIn" delay={0.2}>
              <ImagePlaceholder label="시술 과정" aspectRatio="square" />
            </AnimateOnScroll>
            <AnimateOnScroll animation="scaleIn" delay={0.3}>
              <ImagePlaceholder label="상담실" aspectRatio="square" />
            </AnimateOnScroll>
          </div>

          <AnimateOnScroll>
            <p className="text-center text-xs text-mono-light mt-8">
              * 시술 결과는 개인에 따라 차이가 있을 수 있습니다
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* LIV Section */}
      <section className="section-gap bg-gradient-to-b from-secondary/5 to-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#E91E63] mb-2">LIV Difference</p>
              <h2 className="text-h1 text-secondary">리브만의 인모드</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimateOnScroll animation="fadeInUp" delay={0}>
              <Card padding="lg" className="h-full border-t-4 border-t-[#E91E63]">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#E91E63]/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#E91E63]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-h4 text-secondary mb-3">정품 인증 클리닉</h3>
                  <p className="text-body text-mono-light">
                    인모드코리아 공식 인증 클리닉으로 정품 장비와 팁만 사용합니다.
                    최신 버전의 장비를 운용합니다.
                  </p>
                </div>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInUp" delay={0.1}>
              <Card padding="lg" className="h-full border-t-4 border-t-[#9C27B0]">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#9C27B0]/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#9C27B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-h4 text-secondary mb-3">맞춤형 조합 시술</h3>
                  <p className="text-body text-mono-light">
                    한 가지 핸드피스만이 아닌, 피부 상태에 따라 여러 시술을 조합하여
                    최적의 결과를 도출합니다.
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
                    풍부한 경험으로 최적의 결과를 도출합니다.
                  </p>
                </div>
              </Card>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#E91E63] mb-2">Treatment Process</p>
              <h2 className="text-h1 text-secondary">시술 과정</h2>
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
      <section className="py-20 bg-gradient-to-r from-[#E91E63] to-[#9C27B0] text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <p className="font-serif text-h3 opacity-80 mb-2">Treatment Info</p>
              <h2 className="text-h1">시술 정보</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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
                <p className="text-small opacity-70 mb-1">효과</p>
                <p className="font-medium text-lg">{treatment.results}</p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Target & Ideal For Section */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <AnimateOnScroll animation="fadeInLeft">
              <Card padding="lg">
                <h3 className="text-h3 text-secondary mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-[#E91E63]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  시술 부위
                </h3>
                <div className="flex flex-wrap gap-3">
                  {treatment.targetAreas.map((area, index) => (
                    <motion.span
                      key={index}
                      className="px-4 py-2 bg-[#E91E63]/10 text-[#E91E63] rounded-full text-body"
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
                  <svg className="w-6 h-6 text-[#9C27B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  이런 분께 추천
                </h3>
                <ul className="space-y-3">
                  {treatment.idealFor.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-body text-mono">
                      <span className="text-[#E91E63] mt-0.5"><CheckIcon /></span>
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
              <Card padding="lg" className="border-2 border-[#E91E63]/20">
                <h3 className="text-h3 text-secondary mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-[#E91E63]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  시술 전후 주의사항
                </h3>
                <ul className="space-y-3">
                  {treatment.cautions.map((caution, index) => (
                    <li key={index} className="flex items-start gap-3 text-body text-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E91E63] mt-2 flex-shrink-0" />
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
              <p className="font-serif text-h3 text-[#E91E63] mb-2">FAQ</p>
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
                <Card padding="none" hover={false} className="overflow-hidden">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 text-left flex items-start justify-between gap-4 hover:bg-background/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-full bg-[#E91E63]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#E91E63] font-serif font-medium">Q</span>
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
      <section className="py-24 bg-gradient-to-br from-secondary via-secondary to-[#E91E63]/80 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
        </div>

        <div className="container-custom relative z-10">
          <AnimateOnScroll>
            <div className="text-center max-w-2xl mx-auto">
              <p className="font-serif text-h3 opacity-80 mb-4">Ready for Transformation?</p>
              <h2 className="text-h1 mb-6">인모드 상담 예약</h2>
              <p className="text-h4 opacity-90 mb-10 leading-relaxed">
                전문 의료진과 1:1 맞춤 상담을 통해<br />
                나에게 맞는 최적의 시술을 찾아보세요.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <ScrollLink href="/contact">
                  <Button size="lg" className="bg-white text-secondary hover:bg-[#E91E63] hover:text-white w-full sm:w-auto">
                    무료 상담 예약하기
                  </Button>
                </ScrollLink>
                <a href="tel:02-797-2773">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
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
                <p className="font-serif text-h3 text-[#E91E63] mb-2">Related Treatments</p>
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
                            <p className="font-serif text-[#E91E63] mb-1">{related.nameEn}</p>
                            <h3 className="text-h4 text-secondary group-hover:text-[#E91E63] transition-colors">
                              {related.name}
                            </h3>
                            <p className="text-small text-mono-light mt-2">{related.shortDesc}</p>
                          </div>
                          <svg className="w-6 h-6 text-[#E91E63] group-hover:translate-x-2 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
