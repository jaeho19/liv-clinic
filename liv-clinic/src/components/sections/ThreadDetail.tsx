'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { TREATMENTS, MEDICAL_QA } from '@/lib/constants';
import { AnimateOnScroll, Card, PriceTable, Breadcrumb } from '@/components/ui';
import { getLocalizedTreatment, getRelatedTreatmentLabel } from '@/lib/treatmentsI18n';

// SVG 일러스트레이션에서 사용할 타입
interface SkinLayersLabels {
  epidermis: string;
  dermis: string;
  subcutaneous: string;
  smas: string;
}

interface ThreadTypesLabels {
  pdo: { name: string; fullName: string; absorptionPeriod: string; types: string; note: string };
  plla: { name: string; fullName: string; absorptionPeriod: string; feature: string; note: string };
  pcl: { name: string; fullName: string; absorptionPeriod: string; feature: string; note: string };
}

interface CollagenTimelineLabels {
  immediate: { phase: string; title: string; desc: string };
  oneToTwo: { phase: string; title: string; desc: string };
  threeToSix: { phase: string; title: string; desc: string };
}

interface TreatmentAreasLabels {
  forehead: string;
  cheekbone: string;
  cheek: string;
  nasolabial: string;
  jawline: string;
  neck: string;
}

// 실리프팅 메커니즘 일러스트
const ThreadLiftingMechanismIllustration = ({ skinLayers, liftingEffect }: { skinLayers: SkinLayersLabels; liftingEffect: string }) => (
  <div className="relative w-full max-w-md mx-auto aspect-square">
    <svg viewBox="0 0 400 400" className="w-full h-full">
      <defs>
        <linearGradient id="threadGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="50%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        <linearGradient id="skinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFE4D6" />
          <stop offset="100%" stopColor="#FFCEB3" />
        </linearGradient>
        <filter id="threadGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* 피부 단면 */}
      <path
        d="M50 150 Q200 130 350 150 L350 350 Q200 330 50 350 Z"
        fill="url(#skinGradient)"
        stroke="#FFCEB3"
        strokeWidth="2"
      />

      {/* 피부 레이어 표시 */}
      <path d="M50 180 Q200 160 350 180" stroke="#E5C4B3" strokeWidth="1" strokeDasharray="5 3" />
      <path d="M50 220 Q200 200 350 220" stroke="#D4A89A" strokeWidth="1" strokeDasharray="5 3" />
      <path d="M50 280 Q200 260 350 280" stroke="#C49080" strokeWidth="1" strokeDasharray="5 3" />

      {/* 레이어 라벨 */}
      <text x="365" y="165" fill="#999" fontSize="10">{skinLayers.epidermis}</text>
      <text x="365" y="200" fill="#999" fontSize="10">{skinLayers.dermis}</text>
      <text x="365" y="250" fill="#999" fontSize="10">{skinLayers.subcutaneous}</text>
      <text x="365" y="300" fill="#999" fontSize="10">{skinLayers.smas}</text>

      {/* 실 삽입 */}
      <motion.g filter="url(#threadGlow)">
        {/* 메인 실 */}
        <motion.path
          d="M100 120 Q150 200 120 300"
          stroke="url(#threadGold)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />

        {/* 코그 (돌기) */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const y = 160 + i * 25;
          const x = 100 + (i < 3 ? i * 8 : (6 - i) * 8);
          return (
            <motion.g key={i}>
              <motion.line
                x1={x}
                y1={y}
                x2={x - 15}
                y2={y - 10}
                stroke="#D4AF37"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 + i * 0.15 }}
              />
              <motion.line
                x1={x}
                y1={y}
                x2={x + 15}
                y2={y - 10}
                stroke="#D4AF37"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 + i * 0.15 }}
              />
            </motion.g>
          );
        })}
      </motion.g>

      {/* 두 번째 실 */}
      <motion.g filter="url(#threadGlow)">
        <motion.path
          d="M200 110 Q230 190 200 290"
          stroke="url(#threadGold)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.8 }}
        />

        {[0, 1, 2, 3, 4, 5].map((i) => {
          const y = 150 + i * 25;
          const x = 200 + (i < 3 ? i * 10 : (6 - i) * 10);
          return (
            <motion.g key={`second-${i}`}>
              <motion.line
                x1={x}
                y1={y}
                x2={x - 15}
                y2={y - 10}
                stroke="#D4AF37"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 + i * 0.15 }}
              />
              <motion.line
                x1={x}
                y1={y}
                x2={x + 15}
                y2={y - 10}
                stroke="#D4AF37"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 + i * 0.15 }}
              />
            </motion.g>
          );
        })}
      </motion.g>

      {/* 세 번째 실 */}
      <motion.g filter="url(#threadGlow)">
        <motion.path
          d="M300 115 Q320 195 295 295"
          stroke="url(#threadGold)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 1.1 }}
        />

        {[0, 1, 2, 3, 4, 5].map((i) => {
          const y = 155 + i * 25;
          const x = 300 + (i < 3 ? i * 7 : (6 - i) * 7);
          return (
            <motion.g key={`third-${i}`}>
              <motion.line
                x1={x}
                y1={y}
                x2={x - 15}
                y2={y - 10}
                stroke="#D4AF37"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 + i * 0.15 }}
              />
              <motion.line
                x1={x}
                y1={y}
                x2={x + 15}
                y2={y - 10}
                stroke="#D4AF37"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 + i * 0.15 }}
              />
            </motion.g>
          );
        })}
      </motion.g>

      {/* 리프팅 효과 화살표 */}
      <motion.g
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, duration: 0.5 }}
      >
        <path d="M80 80 L80 60 L60 60 M80 60 L100 60" stroke="#D4AF37" strokeWidth="2" fill="none" markerEnd="url(#arrowUp)" />
        <path d="M200 70 L200 50 L180 50 M200 50 L220 50" stroke="#D4AF37" strokeWidth="2" fill="none" />
        <path d="M320 75 L320 55 L300 55 M320 55 L340 55" stroke="#D4AF37" strokeWidth="2" fill="none" />
      </motion.g>

      {/* 리프팅 텍스트 */}
      <motion.text
        x="200"
        y="40"
        textAnchor="middle"
        fill="#D4AF37"
        fontSize="14"
        fontWeight="600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
      >
        {liftingEffect}
      </motion.text>

      {/* 삽입점 표시 */}
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
      >
        <circle cx="100" cy="120" r="5" fill="#D4AF37" />
        <circle cx="200" cy="110" r="5" fill="#D4AF37" />
        <circle cx="300" cy="115" r="5" fill="#D4AF37" />
      </motion.g>
    </svg>
  </div>
);

// 실 종류 일러스트
const ThreadTypesIllustration = ({ threadTypes }: { threadTypes: ThreadTypesLabels }) => (
  <div className="relative w-full max-w-3xl mx-auto">
    <svg viewBox="0 0 700 300" className="w-full h-auto">
      <defs>
        <linearGradient id="pdoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9CA3AF" />
          <stop offset="100%" stopColor="#6B7280" />
        </linearGradient>
        <linearGradient id="pllaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        <linearGradient id="pclGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
      </defs>

      {/* PDO 실 */}
      <motion.g
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <rect x="30" y="30" width="200" height="240" rx="15" fill="#f8f8f8" stroke="#e0e0e0" strokeWidth="1" />
        <text x="130" y="65" textAnchor="middle" fill="#6B7280" fontSize="18" fontWeight="bold">{threadTypes.pdo.name}</text>
        <text x="130" y="85" textAnchor="middle" fill="#999" fontSize="11">{threadTypes.pdo.fullName}</text>

        {/* PDO 실 그림 */}
        <motion.path
          d="M70 120 C90 140, 110 100, 130 140 C150 180, 170 120, 190 160"
          stroke="url(#pdoGrad)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />

        {/* 코그 표시 */}
        {[0, 1, 2, 3].map((i) => (
          <motion.circle
            key={i}
            cx={85 + i * 35}
            cy={130 + (i % 2 === 0 ? -10 : 20)}
            r="3"
            fill="#6B7280"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8 + i * 0.1 }}
          />
        ))}

        <text x="130" y="200" textAnchor="middle" fill="#333" fontSize="12" fontWeight="500">{threadTypes.pdo.absorptionPeriod}</text>
        <text x="130" y="220" textAnchor="middle" fill="#666" fontSize="11">{threadTypes.pdo.types}</text>
        <text x="130" y="240" textAnchor="middle" fill="#999" fontSize="10">{threadTypes.pdo.note}</text>
      </motion.g>

      {/* PLLA 실 */}
      <motion.g
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <rect x="250" y="30" width="200" height="240" rx="15" fill="#FFFBEB" stroke="#FCD34D" strokeWidth="1" />
        <text x="350" y="65" textAnchor="middle" fill="#B8860B" fontSize="18" fontWeight="bold">{threadTypes.plla.name}</text>
        <text x="350" y="85" textAnchor="middle" fill="#D4AF37" fontSize="11">{threadTypes.plla.fullName}</text>

        {/* PLLA 실 그림 */}
        <motion.path
          d="M290 120 C310 150, 330 100, 350 140 C370 180, 390 110, 410 150"
          stroke="url(#pllaGrad)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
        />

        {/* 바브 표시 */}
        {[0, 1, 2, 3].map((i) => (
          <motion.g key={i}>
            <motion.line
              x1={305 + i * 30}
              y1={125 + (i % 2 === 0 ? -5 : 15)}
              x2={295 + i * 30}
              y2={115 + (i % 2 === 0 ? -5 : 15)}
              stroke="#D4AF37"
              strokeWidth="2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 + i * 0.1 }}
            />
            <motion.line
              x1={305 + i * 30}
              y1={125 + (i % 2 === 0 ? -5 : 15)}
              x2={315 + i * 30}
              y2={115 + (i % 2 === 0 ? -5 : 15)}
              stroke="#D4AF37"
              strokeWidth="2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 + i * 0.1 }}
            />
          </motion.g>
        ))}

        <text x="350" y="200" textAnchor="middle" fill="#333" fontSize="12" fontWeight="500">{threadTypes.plla.absorptionPeriod}</text>
        <text x="350" y="220" textAnchor="middle" fill="#666" fontSize="11">{threadTypes.plla.feature}</text>
        <text x="350" y="240" textAnchor="middle" fill="#D4AF37" fontSize="10" fontWeight="500">{threadTypes.plla.note}</text>
      </motion.g>

      {/* PCL 실 */}
      <motion.g
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        <rect x="470" y="30" width="200" height="240" rx="15" fill="#FAF5FF" stroke="#C084FC" strokeWidth="1" />
        <text x="570" y="65" textAnchor="middle" fill="#9333EA" fontSize="18" fontWeight="bold">{threadTypes.pcl.name}</text>
        <text x="570" y="85" textAnchor="middle" fill="#A855F7" fontSize="11">{threadTypes.pcl.fullName}</text>

        {/* PCL 실 그림 */}
        <motion.path
          d="M510 120 C530 145, 550 105, 570 140 C590 175, 610 115, 630 155"
          stroke="url(#pclGrad)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
        />

        {/* 메쉬 효과 */}
        {[0, 1, 2].map((i) => (
          <motion.ellipse
            key={i}
            cx={530 + i * 40}
            cy={135}
            rx="12"
            ry="8"
            fill="none"
            stroke="#A855F7"
            strokeWidth="1"
            strokeDasharray="3 2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.2 + i * 0.1 }}
          />
        ))}

        <text x="570" y="200" textAnchor="middle" fill="#333" fontSize="12" fontWeight="500">{threadTypes.pcl.absorptionPeriod}</text>
        <text x="570" y="220" textAnchor="middle" fill="#666" fontSize="11">{threadTypes.pcl.feature}</text>
        <text x="570" y="240" textAnchor="middle" fill="#9333EA" fontSize="10" fontWeight="500">{threadTypes.pcl.note}</text>
      </motion.g>
    </svg>
  </div>
);

// 콜라겐 재생 일러스트
const CollagenRegenerationIllustration = ({ timeline }: { timeline: CollagenTimelineLabels }) => (
  <div className="relative w-full max-w-2xl mx-auto">
    <svg viewBox="0 0 600 280" className="w-full h-auto">
      {/* 시술 직후 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <text x="100" y="30" textAnchor="middle" fill="#999" fontSize="14" fontWeight="600">{timeline.immediate.phase}</text>
        <rect x="30" y="50" width="140" height="180" rx="10" fill="#FFF5EB" stroke="#FFCEB3" strokeWidth="1" />

        {/* 피부 조직 */}
        <ellipse cx="100" cy="120" rx="50" ry="40" fill="#FFE4D6" />

        {/* 실 */}
        <motion.path
          d="M70 100 L130 140"
          stroke="#D4AF37"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        />

        {/* 코그 */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <line x1="85" y1="110" x2="78" y2="102" stroke="#D4AF37" strokeWidth="2" />
          <line x1="100" y1="120" x2="93" y2="112" stroke="#D4AF37" strokeWidth="2" />
          <line x1="115" y1="130" x2="108" y2="122" stroke="#D4AF37" strokeWidth="2" />
        </motion.g>

        <text x="100" y="200" textAnchor="middle" fill="#666" fontSize="11">{timeline.immediate.title}</text>
        <text x="100" y="218" textAnchor="middle" fill="#999" fontSize="10">{timeline.immediate.desc}</text>
      </motion.g>

      {/* 화살표 1 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <path d="M180 130 L210 130" stroke="#D4AF37" strokeWidth="2" markerEnd="url(#arrowGold)" />
      </motion.g>

      {/* 1-2개월 후 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <text x="300" y="30" textAnchor="middle" fill="#D4AF37" fontSize="14" fontWeight="600">{timeline.oneToTwo.phase}</text>
        <rect x="230" y="50" width="140" height="180" rx="10" fill="#FFFBEB" stroke="#FCD34D" strokeWidth="1" />

        {/* 피부 조직 */}
        <ellipse cx="300" cy="120" rx="50" ry="40" fill="#FFE4D6" />

        {/* 실 */}
        <path d="M270 100 L330 140" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round" opacity="0.7" />

        {/* 콜라겐 섬유 시작 */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.path
              key={i}
              d={`M${275 + i * 12} ${95 + i * 5} Q${280 + i * 10} ${115 + i * 3} ${290 + i * 8} ${135 + i * 2}`}
              stroke="#FF9F43"
              strokeWidth="1.5"
              fill="none"
              opacity="0.6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 1.7 + i * 0.1 }}
            />
          ))}
        </motion.g>

        <text x="300" y="200" textAnchor="middle" fill="#666" fontSize="11">{timeline.oneToTwo.title}</text>
        <text x="300" y="218" textAnchor="middle" fill="#D4AF37" fontSize="10">{timeline.oneToTwo.desc}</text>
      </motion.g>

      {/* 화살표 2 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <path d="M380 130 L410 130" stroke="#D4AF37" strokeWidth="2" markerEnd="url(#arrowGold)" />
      </motion.g>

      {/* 3-6개월 후 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
      >
        <text x="500" y="30" textAnchor="middle" fill="#22C55E" fontSize="14" fontWeight="600">{timeline.threeToSix.phase}</text>
        <rect x="430" y="50" width="140" height="180" rx="10" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="1" />

        {/* 피부 조직 - 더 탄력있게 */}
        <ellipse cx="500" cy="115" rx="52" ry="38" fill="#FFE4D6" />

        {/* 실 흡수됨 (점선) */}
        <path d="M470 100 L530 135" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" opacity="0.3" />

        {/* 풍부한 콜라겐 네트워크 */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
        >
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <motion.path
              key={i}
              d={`M${465 + i * 10} ${90 + (i % 2) * 10} Q${480 + i * 8} ${110 + (i % 3) * 5} ${495 + i * 5} ${130 + (i % 2) * 8}`}
              stroke="#22C55E"
              strokeWidth="2"
              fill="none"
              opacity="0.7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 2.7 + i * 0.08 }}
            />
          ))}
        </motion.g>

        <text x="500" y="200" textAnchor="middle" fill="#666" fontSize="11">{timeline.threeToSix.title}</text>
        <text x="500" y="218" textAnchor="middle" fill="#22C55E" fontSize="10" fontWeight="500">{timeline.threeToSix.desc}</text>
      </motion.g>

      {/* 화살표 마커 */}
      <defs>
        <marker id="arrowGold" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#D4AF37" />
        </marker>
      </defs>
    </svg>
  </div>
);

// 시술 부위 일러스트
const TreatmentAreasIllustration = ({ areas }: { areas: TreatmentAreasLabels }) => (
  <div className="relative w-full max-w-sm mx-auto aspect-[3/4]">
    <svg viewBox="0 0 300 400" className="w-full h-full">
      {/* 얼굴 윤곽 */}
      <ellipse cx="150" cy="160" rx="90" ry="110" fill="#FFE4D6" stroke="#FFCEB3" strokeWidth="2" />

      {/* 헤어라인 */}
      <path d="M70 120 Q90 60 150 50 Q210 60 230 120" fill="none" stroke="#8B6914" strokeWidth="8" strokeLinecap="round" />

      {/* 눈 */}
      <ellipse cx="115" cy="150" rx="18" ry="8" fill="#fff" stroke="#ddd" strokeWidth="1" />
      <ellipse cx="185" cy="150" rx="18" ry="8" fill="#fff" stroke="#ddd" strokeWidth="1" />
      <circle cx="115" cy="150" r="5" fill="#4A3728" />
      <circle cx="185" cy="150" r="5" fill="#4A3728" />

      {/* 코 */}
      <path d="M150 150 L150 190 Q145 200 150 205 Q155 200 150 190" fill="none" stroke="#FFCEB3" strokeWidth="2" />

      {/* 입 */}
      <path d="M130 230 Q150 240 170 230" fill="none" stroke="#E8A090" strokeWidth="2" strokeLinecap="round" />

      {/* 목 */}
      <path d="M110 265 L100 350 M190 265 L200 350" stroke="#FFE4D6" strokeWidth="30" strokeLinecap="round" />
      <path d="M110 265 L100 350 M190 265 L200 350" stroke="#FFCEB3" strokeWidth="2" fill="none" />

      {/* 실 삽입 라인들 */}
      {/* 이마 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.path
          d="M100 85 Q130 75 160 85"
          stroke="#D4AF37"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
        <circle cx="100" cy="85" r="4" fill="#D4AF37" />
        <line x1="75" y1="75" x2="30" y2="60" stroke="#D4AF37" strokeWidth="1" strokeDasharray="2 2" />
        <text x="5" y="65" fill="#D4AF37" fontSize="10" fontWeight="500">{areas.forehead}</text>
      </motion.g>

      {/* 광대 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.path
          d="M75 170 Q85 185 90 200"
          stroke="#D4AF37"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
        <circle cx="75" cy="170" r="4" fill="#D4AF37" />
        <line x1="60" y1="175" x2="20" y2="175" stroke="#D4AF37" strokeWidth="1" strokeDasharray="2 2" />
        <text x="5" y="180" fill="#D4AF37" fontSize="10" fontWeight="500">{areas.cheekbone}</text>
      </motion.g>

      {/* 볼 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <motion.path
          d="M225 170 Q215 195 205 220"
          stroke="#D4AF37"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        />
        <circle cx="225" cy="170" r="4" fill="#D4AF37" />
        <line x1="240" y1="175" x2="275" y2="175" stroke="#D4AF37" strokeWidth="1" strokeDasharray="2 2" />
        <text x="280" y="180" fill="#D4AF37" fontSize="10" fontWeight="500">{areas.cheek}</text>
      </motion.g>

      {/* 팔자 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.path
          d="M120 195 Q115 210 115 225"
          stroke="#D4AF37"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        />
        <circle cx="120" cy="195" r="4" fill="#D4AF37" />
        <line x1="100" y1="220" x2="45" y2="230" stroke="#D4AF37" strokeWidth="1" strokeDasharray="2 2" />
        <text x="5" y="235" fill="#D4AF37" fontSize="10" fontWeight="500">{areas.nasolabial}</text>
      </motion.g>

      {/* 턱선 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.path
          d="M100 245 Q125 265 150 270 Q175 265 200 245"
          stroke="#D4AF37"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 1.1 }}
        />
        <circle cx="100" cy="245" r="4" fill="#D4AF37" />
        <circle cx="200" cy="245" r="4" fill="#D4AF37" />
        <line x1="215" y1="260" x2="265" y2="275" stroke="#D4AF37" strokeWidth="1" strokeDasharray="2 2" />
        <text x="270" y="280" fill="#D4AF37" fontSize="10" fontWeight="500">{areas.jawline}</text>
      </motion.g>

      {/* 목 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <motion.path
          d="M120 310 Q150 320 180 310"
          stroke="#D4AF37"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 1.3 }}
        />
        <circle cx="120" cy="310" r="4" fill="#D4AF37" />
        <circle cx="180" cy="310" r="4" fill="#D4AF37" />
        <line x1="185" y1="320" x2="250" y2="340" stroke="#D4AF37" strokeWidth="1" strokeDasharray="2 2" />
        <text x="255" y="345" fill="#D4AF37" fontSize="10" fontWeight="500">{areas.neck}</text>
      </motion.g>
    </svg>
  </div>
);

export default function ThreadDetail() {
  const t = useTranslations('treatments');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const treatment = getLocalizedTreatment(TREATMENTS.lifting.thread, 'thread', locale);
  const faqRefs = useRef<Map<number, HTMLDetailsElement>>(new Map());

  // 번역 데이터 로드
  const skinLayers = t.raw('lifting.thread.detail.skinLayers') as SkinLayersLabels;
  const liftingEffect = t('lifting.thread.detail.liftingEffect');
  const threadTypes = t.raw('lifting.thread.detail.threadTypes') as ThreadTypesLabels;
  const collagenTimeline = t.raw('lifting.thread.detail.collagenTimeline') as CollagenTimelineLabels;
  const treatmentAreas = t.raw('lifting.thread.detail.treatmentAreas') as TreatmentAreasLabels;
  const threadTypesSection = t.raw('lifting.thread.detail.threadTypesSection') as {
    title: string;
    description: string;
    pdoCard: { title: string; subtitle: string; features: string[] };
    pllaCard: { title: string; subtitle: string; features: string[] };
    pclCard: { title: string; subtitle: string; features: string[] };
  };
  const comparisonData = t.raw('lifting.thread.detail.comparison') as {
    title: string;
    description: string;
    headers: { item: string; laser: string; thread: string };
    rows: Array<{ item: string; laser: string; thread: string }>;
  };

  // 관련 Q&A 필터링
  const relatedMedicalQA = MEDICAL_QA.filter((qa) =>
    qa.relatedTreatments?.some((id) => (id as string) === 'thread')
  );

  // FAQ 토글 시 스크롤
  const handleFaqToggle = useCallback((index: number, e: React.MouseEvent<HTMLElement>) => {
    const details = e.currentTarget.closest('details') as HTMLDetailsElement;
    if (!details) return;

    // details가 열릴 때만 스크롤 (열리기 전 상태가 closed일 때)
    if (!details.open) {
      requestAnimationFrame(() => {
        const rect = details.getBoundingClientRect();
        const scrollOffset = 120; // 헤더 높이(96px) + 여유 공간(24px)
        const scrollTop = window.scrollY + rect.top - scrollOffset;
        window.scrollTo({ top: scrollTop, behavior: 'smooth' });
      });
    }
  }, []);

  return (
    <main className="bg-white">
      <Breadcrumb items={[{ navKey: 'lifting', href: '/lifting' }, { navKey: 'thread' }]} />

      {/* 히어로 섹션 */}
      <section className="relative min-h-70-dvh flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#FFFBEB] to-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-[#D4AF37] rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#B8860B] rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block px-4 py-2 bg-[#D4AF37]/10 text-[#B8860B] text-sm font-medium rounded-full mb-6 border border-[#D4AF37]/30 shadow-sm">
                {t('lifting.thread.detail.hero.badge')}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-4">
                {treatment.name}
                <span className="block text-2xl md:text-3xl text-[#D4AF37] mt-2 font-normal">
                  {treatment.nameEn}
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-6 font-light">
                {treatment.tagline}
              </p>
              <p className="text-gray-500 leading-relaxed mb-8 max-w-lg">
                {treatment.description}
              </p>
              {/* CTA buttons removed for premium look */}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <ThreadLiftingMechanismIllustration skinLayers={skinLayers} liftingEffect={liftingEffect} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Price Table Section */}
      <PriceTable treatmentId="thread" />

      {/* 실리프팅 특장점 섹션 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#D4AF37]" />
              <span className="text-xs tracking-[0.3em] text-[#D4AF37] uppercase font-medium">{t('lifting.thread.detail.advantages.sectionLabel')}</span>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#D4AF37]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4" dangerouslySetInnerHTML={{ __html: t('lifting.thread.detail.advantages.title') }} />
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('lifting.thread.detail.advantages.description')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {treatment.benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-8 rounded-2xl bg-gradient-to-b from-[#FFFBEB] to-white border border-[#D4AF37]/10"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                  <span className="text-2xl">
                    {index === 0 ? '⚡' : index === 1 ? '✨' : index === 2 ? '🌿' : '🔄'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 실 종류 섹션 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4" dangerouslySetInnerHTML={{ __html: t('lifting.thread.detail.threadTypesSection.title') }} />
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('lifting.thread.detail.threadTypesSection.description')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <ThreadTypesIllustration threadTypes={threadTypes} />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-white rounded-xl shadow-sm border-t-4 border-gray-400"
            >
              <div className="text-2xl font-bold text-gray-600 mb-2">{threadTypesSection.pdoCard.title}</div>
              <div className="text-gray-500 text-sm mb-4">{threadTypesSection.pdoCard.subtitle}</div>
              <ul className="text-left text-gray-600 text-sm space-y-2">
                {threadTypesSection.pdoCard.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-gray-400">•</span> {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center p-6 bg-white rounded-xl shadow-sm border-t-4 border-[#D4AF37]"
            >
              <div className="text-2xl font-bold text-[#D4AF37] mb-2">{threadTypesSection.pllaCard.title}</div>
              <div className="text-[#B8860B] text-sm mb-4">{threadTypesSection.pllaCard.subtitle}</div>
              <ul className="text-left text-gray-600 text-sm space-y-2">
                {threadTypesSection.pllaCard.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-[#D4AF37]">•</span> {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center p-6 bg-white rounded-xl shadow-sm border-t-4 border-purple-500"
            >
              <div className="text-2xl font-bold text-purple-600 mb-2">{threadTypesSection.pclCard.title}</div>
              <div className="text-purple-500 text-sm mb-4">{threadTypesSection.pclCard.subtitle}</div>
              <ul className="text-left text-gray-600 text-sm space-y-2">
                {threadTypesSection.pclCard.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-purple-500">•</span> {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 콜라겐 재생 과정 섹션 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4" dangerouslySetInnerHTML={{ __html: t('lifting.thread.detail.collagenSection.title') }} />
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('lifting.thread.detail.collagenSection.description')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <CollagenRegenerationIllustration timeline={collagenTimeline} />
          </motion.div>
        </div>
      </section>

      {/* 시술 부위 섹션 */}
      <section className="py-20 bg-gradient-to-b from-white to-[#FFFBEB]/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6">
                {t('lifting.thread.detail.targetAreasSection.title')}
              </h2>
              <p className="text-gray-600 mb-8">
                {t('lifting.thread.detail.targetAreasSection.description')}
              </p>

              <div className="grid grid-cols-2 gap-4">
                {treatment.targetAreas.map((area, index) => (
                  <motion.div
                    key={area}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                      <span className="text-[#D4AF37] text-sm">✓</span>
                    </div>
                    <span className="text-gray-700 font-medium">{area}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <div className="relative w-full max-w-[500px] mx-auto">
                <Image
                  src="/images/lifting/Gemini_Generated_Image_h2bh3zh2bh3zh2bh.png"
                  alt={t('lifting.thread.ui.diagramAlt')}
                  width={500}
                  height={600}
                  className="w-full h-auto object-contain"
                  quality={95}
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 시술 과정 섹션 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              {t('lifting.thread.detail.processSection.title')}
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* 연결선 */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#D4AF37] to-[#B8860B] hidden md:block" />

              {treatment.process.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-20 pb-12 last:pb-0"
                >
                  <div className="absolute left-0 w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {step.step}
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 시술 정보 섹션 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4" dangerouslySetInnerHTML={{ __html: t('lifting.thread.detail.treatmentInfo.title') }} />
          </motion.div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            {[
              { label: t('lifting.thread.detail.treatmentInfo.labels.duration'), value: treatment.duration, icon: '⏱️' },
              { label: t('lifting.thread.detail.treatmentInfo.labels.anesthesia'), value: treatment.anesthesia, icon: '💉' },
              { label: t('lifting.thread.detail.treatmentInfo.labels.recovery'), value: treatment.recovery, icon: '🔄' },
              { label: t('lifting.thread.detail.treatmentInfo.labels.results'), value: treatment.results, icon: '✨' },
            ].map((info, index) => (
              <motion.div
                key={info.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm"
              >
                <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-2xl">
                  {info.icon}
                </div>
                <div>
                  <div className="text-sm text-gray-500">{info.label}</div>
                  <div className="text-lg font-medium text-gray-900">{info.value}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 레이저 리프팅 vs 실리프팅 비교 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4" dangerouslySetInnerHTML={{ __html: comparisonData.title }} />
            <p className="text-gray-600 max-w-2xl mx-auto">
              {comparisonData.description}
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="grid grid-cols-3 bg-gray-900 text-white">
                <div className="p-4 text-center font-medium">{comparisonData.headers.item}</div>
                <div className="p-4 text-center font-medium border-l border-gray-700">{comparisonData.headers.laser}</div>
                <div className="p-4 text-center font-medium border-l border-gray-700 bg-[#D4AF37]">{comparisonData.headers.thread}</div>
              </div>

              {comparisonData.rows.map((row, index) => (
                <motion.div
                  key={row.item}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className={`grid grid-cols-3 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                >
                  <div className="p-4 font-medium text-gray-900">{row.item}</div>
                  <div className="p-4 text-center text-gray-600 border-l border-gray-100">{row.laser}</div>
                  <div className="p-4 text-center text-[#B8860B] font-medium border-l border-gray-100">{row.thread}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 이런 분께 추천 섹션 */}
      <section className="py-20 bg-gradient-to-b from-[#FFFBEB]/30 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              {t('lifting.thread.detail.recommended.title')}
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
            {treatment.idealFor.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ 섹션 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              {t('lifting.thread.detail.faq.title')}
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {treatment.faqs.map((faq, index) => (
              <motion.details
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-gray-50 rounded-xl overflow-hidden"
              >
                <summary
                  onClick={(e) => handleFaqToggle(index, e)}
                  className="flex items-center justify-between p-6 cursor-pointer list-none"
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                  <span className="text-[#D4AF37] transform group-open:rotate-180 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-gray-600">
                  {faq.a}
                </div>
              </motion.details>
            ))}
          </div>

          {/* 관련 의료정보 Q&A */}
          {relatedMedicalQA.length > 0 && (
            <div className="max-w-3xl mx-auto mt-12">
              <h3 className="text-xl font-medium text-gray-900 mb-6 text-center">
                {t('lifting.thread.detail.faq.relatedQA')}
              </h3>
              <div className="space-y-4">
                {relatedMedicalQA.slice(0, 3).map((qa, index) => (
                  <motion.details
                    key={qa.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group bg-[#FFFBEB]/50 rounded-xl overflow-hidden"
                  >
                    <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                      <span className="font-medium text-gray-900 pr-4">{qa.question}</span>
                      <span className="text-[#D4AF37] transform group-open:rotate-180 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </summary>
                    <div className="px-6 pb-6 text-gray-600">
                      {qa.answer}
                    </div>
                  </motion.details>
                ))}
              </div>
              <div className="text-center mt-6">
                <Link
                  href="/medical"
                  className="text-[#D4AF37] hover:text-[#B8860B] font-medium inline-flex items-center gap-2"
                >
                  {t('lifting.thread.detail.faq.moreButton')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 주의사항 섹션 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-2xl font-light text-gray-900 mb-8 text-center" dangerouslySetInnerHTML={{ __html: t('lifting.thread.detail.cautions.title') }} />
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <ul className="space-y-4">
                {treatment.cautions.map((caution, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-600">
                    <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-amber-600 text-xs">!</span>
                    </span>
                    {caution}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 bg-gradient-to-r from-[#D4AF37] to-[#B8860B]">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
              {t('lifting.thread.detail.cta.title')}
            </h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              {t('lifting.thread.detail.cta.description')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-white text-[#D4AF37] font-medium rounded-full hover:bg-gray-100 transition-colors"
              >
                {t('lifting.thread.detail.cta.consultButton')}
              </Link>
              <a
                href="tel:02-797-2773"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-medium rounded-full hover:bg-white/10 transition-colors"
              >
                {t('lifting.thread.detail.cta.callButton')}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Related Treatments */}
      {treatment.relatedTreatments && treatment.relatedTreatments.length > 0 && (
        <section className="section-gap-sm bg-white pb-24 md:pb-32">
          <div className="container-custom">
            <AnimateOnScroll>
              <div className="text-center mb-8 md:mb-12">
                <h2 className="text-h1 text-secondary">{tCommon('relatedTreatments')}</h2>
              </div>
            </AnimateOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              {treatment.relatedTreatments.slice(0, 3).map((relatedId) => {
                const related =
                  TREATMENTS.lifting[relatedId as keyof typeof TREATMENTS.lifting] ||
                  TREATMENTS.antiaging[relatedId as keyof typeof TREATMENTS.antiaging] ||
                  TREATMENTS.laser[relatedId as keyof typeof TREATMENTS.laser];
                if (!related) return null;
                const l10n = getRelatedTreatmentLabel(relatedId, locale);
                return (
                  <AnimateOnScroll key={relatedId}>
                    <Link href={`/${related.category}/${related.id}`}>
                      <Card padding="lg" className="group cursor-pointer h-full">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-serif text-primary mb-1">{related.nameEn}</p>
                            <h3 className="text-h4 text-secondary group-hover:text-primary transition-colors">{l10n?.name ?? related.name}</h3>
                            <p className="text-small text-mono-light mt-2">{l10n?.desc ?? related.shortDesc}</p>
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
    </main>
  );
}
