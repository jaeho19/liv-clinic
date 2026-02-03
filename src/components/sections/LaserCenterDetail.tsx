'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { TREATMENTS, MEDICAL_QA } from '@/lib/constants';

const treatment = TREATMENTS.laser.clarity;

// 레이저 종류 데이터
const laserTypes = [
  {
    id: 'clarity',
    name: '클래리티 II',
    nameEn: 'Clarity II',
    color: '#10B981',
    description: '755nm 알렉산드라이트와 1064nm Nd:YAG 듀얼 파장으로 색소, 혈관, 제모까지 다양한 피부 고민 해결',
    features: ['기미/잡티 개선', '홍조/혈관 치료', '프리미엄 제모', '피부톤 개선'],
    mechanism: 'photoacoustic',
    wavelength: '755nm / 1064nm',
    downtime: '3-5일',
  },
  {
    id: 'toning',
    name: '레이저 토닝',
    nameEn: 'Laser Toning',
    color: '#F59E0B',
    description: '저출력 레이저를 반복 조사하여 멜라닌을 점진적으로 제거, 피부톤을 균일하게 개선',
    features: ['피부톤 균일화', '기미/색소 개선', '모공 축소', '피부결 개선'],
    mechanism: 'photothermal',
    wavelength: '1064nm',
    downtime: '없음',
  },
  {
    id: 'lucas',
    name: '루카스 레이저',
    nameEn: 'LUCAS Laser',
    color: '#8B5CF6',
    description: '고출력 Q스위치 레이저로 난치성 색소 병변, 기미, 문신 제거에 탁월',
    features: ['기미/잡티 치료', '문신 제거', '검버섯 제거', '색소 병변'],
    mechanism: 'q-switch',
    wavelength: '1064nm / 532nm',
    downtime: '3-7일',
  },
  {
    id: 'ulblanc',
    name: '울블랑',
    nameEn: 'Ulblanc',
    color: '#EC4899',
    description: '저자극 화이트닝 레이저로 멜라닌에 선택적으로 작용하여 피부톤을 균일하게 개선',
    features: ['피부 톤 개선', '멜라닌 타겟팅', '저자극 시술', '피부 투명감'],
    mechanism: 'whitening',
    wavelength: '특수 파장',
    downtime: '없음',
  },
];

// 클래리티 II 레이저 작용 원리 일러스트
const ClarityMechanismIllustration = () => (
  <div className="relative w-full max-w-md mx-auto aspect-square">
    <svg viewBox="0 0 400 400" className="w-full h-full">
      <defs>
        <linearGradient id="laserBeamGreen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <radialGradient id="pigmentGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#92400E" />
          <stop offset="100%" stopColor="#451A03" />
        </radialGradient>
        <filter id="laserGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 배경 */}
      <rect x="40" y="40" width="320" height="320" rx="20" fill="#F0FDF4" />

      {/* 제목 */}
      <text x="200" y="75" textAnchor="middle" fill="#059669" fontSize="14" fontWeight="600">클래리티 II 레이저 작용 원리</text>

      {/* 피부 단면 */}
      <g transform="translate(60, 100)">
        <rect x="0" y="0" width="280" height="40" rx="5" fill="#FFE4D6" />
        <text x="140" y="25" textAnchor="middle" fill="#9CA3AF" fontSize="10">표피</text>
        <rect x="0" y="45" width="280" height="80" rx="5" fill="#FFCEB3" />
        <text x="25" y="90" fill="#9CA3AF" fontSize="10">진피</text>
      </g>

      {/* 색소 입자들 (시술 전) */}
      <motion.g
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 2, duration: 0.5 }}
      >
        <circle cx="150" cy="200" r="15" fill="url(#pigmentGradient)" />
        <circle cx="200" cy="210" r="12" fill="url(#pigmentGradient)" />
        <circle cx="250" cy="195" r="14" fill="url(#pigmentGradient)" />
      </motion.g>

      {/* 레이저 빔 */}
      <motion.g filter="url(#laserGlow)">
        <motion.line
          x1="200"
          y1="80"
          x2="200"
          y2="200"
          stroke="url(#laserBeamGreen)"
          strokeWidth="4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        />

        {/* 레이저 펄스 효과 */}
        <motion.circle
          cx="200"
          cy="200"
          r="20"
          fill="#10B981"
          opacity="0.3"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 2, 0], opacity: [0.5, 0, 0] }}
          transition={{ duration: 0.5, delay: 1, repeat: 2, repeatDelay: 0.3 }}
        />
      </motion.g>

      {/* 분해된 색소 입자들 (시술 후) */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <motion.circle
            key={i}
            cx={140 + (i % 3) * 40 + Math.random() * 20}
            cy={190 + Math.floor(i / 3) * 20 + Math.random() * 10}
            r="4"
            fill="#D97706"
            initial={{ scale: 0 }}
            animate={{ scale: 1, y: [0, -10, 0] }}
            transition={{ delay: 2.5 + i * 0.1, duration: 0.5 }}
          />
        ))}
      </motion.g>

      {/* 설명 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
      >
        <rect x="70" y="280" width="260" height="60" rx="10" fill="#DCFCE7" />
        <text x="200" y="305" textAnchor="middle" fill="#059669" fontSize="12" fontWeight="500">
          피코초 펄스로 색소를 미세하게 분해
        </text>
        <text x="200" y="325" textAnchor="middle" fill="#6B7280" fontSize="10">
          주변 조직 손상 최소화 → 빠른 회복
        </text>
      </motion.g>

      {/* 비교: 나노초 vs 피코초 */}
      <motion.g
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <rect x="50" y="350" width="80" height="35" rx="5" fill="#FEE2E2" />
        <text x="90" y="372" textAnchor="middle" fill="#991B1B" fontSize="9">나노초: 10⁻⁹</text>
      </motion.g>
      <motion.g
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <rect x="270" y="350" width="80" height="35" rx="5" fill="#DCFCE7" />
        <text x="310" y="372" textAnchor="middle" fill="#059669" fontSize="9" fontWeight="600">피코초: 10⁻¹²</text>
      </motion.g>
      <text x="200" y="372" textAnchor="middle" fill="#6B7280" fontSize="10">1000배 빠름</text>
    </svg>
  </div>
);

// 레이저 종류별 파장 비교 일러스트
const WavelengthComparisonIllustration = () => (
  <div className="relative w-full max-w-3xl mx-auto">
    <svg viewBox="0 0 700 280" className="w-full h-auto">
      <defs>
        <linearGradient id="spectrum" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="20%" stopColor="#3B82F6" />
          <stop offset="40%" stopColor="#10B981" />
          <stop offset="60%" stopColor="#F59E0B" />
          <stop offset="80%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>

      {/* 스펙트럼 바 */}
      <rect x="50" y="120" width="600" height="20" rx="10" fill="url(#spectrum)" opacity="0.3" />

      {/* 파장 눈금 */}
      <line x1="50" y1="150" x2="650" y2="150" stroke="#E5E7EB" strokeWidth="1" />
      {['400nm', '500nm', '600nm', '800nm', '1000nm', '10000nm'].map((label, i) => (
        <g key={i}>
          <line x1={50 + i * 120} y1="145" x2={50 + i * 120} y2="155" stroke="#9CA3AF" strokeWidth="1" />
          <text x={50 + i * 120} y="170" textAnchor="middle" fill="#9CA3AF" fontSize="10">{label}</text>
        </g>
      ))}

      {/* 레이저별 파장 표시 */}
      {[
        { name: 'V-Beam', wavelength: '595nm', x: 200, color: '#EF4444' },
        { name: 'Pico', wavelength: '755nm', x: 300, color: '#10B981' },
        { name: 'Toning', wavelength: '1064nm', x: 420, color: '#F59E0B' },
        { name: 'CO2', wavelength: '10600nm', x: 600, color: '#8B5CF6' },
      ].map((laser, index) => (
        <motion.g
          key={laser.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.2 }}
        >
          <line x1={laser.x} y1="120" x2={laser.x} y2="70" stroke={laser.color} strokeWidth="2" strokeDasharray="4 2" />
          <circle cx={laser.x} cy="65" r="25" fill={laser.color} opacity="0.2" />
          <circle cx={laser.x} cy="65" r="15" fill={laser.color} />
          <text x={laser.x} y="40" textAnchor="middle" fill={laser.color} fontSize="11" fontWeight="600">{laser.name}</text>
          <text x={laser.x} y="200" textAnchor="middle" fill="#6B7280" fontSize="9">{laser.wavelength}</text>
        </motion.g>
      ))}

      {/* IPL 범위 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <rect x="100" y="210" width="300" height="30" rx="5" fill="#EC4899" opacity="0.2" />
        <text x="250" y="230" textAnchor="middle" fill="#EC4899" fontSize="11" fontWeight="500">IPL: 500-1200nm (광대역)</text>
      </motion.g>

      {/* 범례 */}
      <text x="350" y="265" textAnchor="middle" fill="#6B7280" fontSize="10">파장이 길수록 피부 깊은 층까지 도달</text>
    </svg>
  </div>
);

// 피부 고민별 추천 레이저
const SkinConcernsIllustration = () => (
  <div className="relative w-full max-w-2xl mx-auto">
    <svg viewBox="0 0 600 320" className="w-full h-auto">
      {/* 고민별 카드 */}
      {[
        { icon: '☀️', title: '기미/잡티', lasers: ['피코', '토닝'], x: 80, y: 60, color: '#F59E0B' },
        { icon: '🔴', title: '홍조/혈관', lasers: ['V-Beam', 'IPL'], x: 300, y: 60, color: '#EF4444' },
        { icon: '⭕', title: '모공/피부결', lasers: ['피코', 'CO2'], x: 520, y: 60, color: '#10B981' },
        { icon: '📍', title: '흉터', lasers: ['CO2', '피코'], x: 190, y: 200, color: '#8B5CF6' },
        { icon: '✨', title: '피부톤', lasers: ['토닝', 'IPL'], x: 410, y: 200, color: '#EC4899' },
      ].map((concern, index) => (
        <motion.g
          key={concern.title}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.15 }}
        >
          <rect
            x={concern.x - 70}
            y={concern.y}
            width="140"
            height="100"
            rx="15"
            fill="white"
            stroke={concern.color}
            strokeWidth="2"
          />
          <text x={concern.x} y={concern.y + 30} textAnchor="middle" fontSize="24">{concern.icon}</text>
          <text x={concern.x} y={concern.y + 55} textAnchor="middle" fill="#374151" fontSize="13" fontWeight="600">
            {concern.title}
          </text>
          <text x={concern.x} y={concern.y + 80} textAnchor="middle" fill={concern.color} fontSize="11">
            {concern.lasers.join(' / ')}
          </text>
        </motion.g>
      ))}
    </svg>
  </div>
);

// 레이저 카드 컴포넌트
const LaserCard = ({ laser, isActive, onClick }: { laser: typeof laserTypes[0]; isActive: boolean; onClick: () => void }) => (
  <motion.div
    onClick={onClick}
    className={`cursor-pointer p-6 rounded-2xl border-2 transition-all ${
      isActive ? 'border-current bg-white shadow-lg' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
    }`}
    style={{ borderColor: isActive ? laser.color : undefined }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${laser.color}20` }}
      >
        <svg className="w-5 h-5" style={{ color: laser.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{laser.name}</h3>
        <p className="text-xs text-gray-500">{laser.nameEn}</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-1">
      {laser.features.slice(0, 2).map((feature, i) => (
        <span
          key={i}
          className="px-2 py-0.5 rounded text-xs"
          style={{ backgroundColor: `${laser.color}15`, color: laser.color }}
        >
          {feature}
        </span>
      ))}
    </div>
  </motion.div>
);

export default function LaserCenterDetail() {
  const [activeLaser, setActiveLaser] = useState(laserTypes[0]);

  const relatedMedicalQA = MEDICAL_QA.filter((qa) =>
    qa.relatedTreatments?.some((id) => (id as string) === 'clarity') || qa.category === 'laser'
  );

  return (
    <main className="bg-white">
      {/* 히어로 섹션 */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#F0FDF4] to-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-[#10B981] rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#059669] rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block px-4 py-2 bg-[#10B981]/10 text-[#059669] text-sm font-medium rounded-full mb-6">
                LASER CENTER
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-4">
                레이저 센터
                <span className="block text-2xl md:text-3xl text-[#10B981] mt-2 font-normal">
                  Laser Center
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-6 font-light">
                프리미엄 레이저로 완성하는 맑고 건강한 피부
              </p>
              <p className="text-gray-500 leading-relaxed mb-8 max-w-lg">
                리브성형외과 레이저 센터는 클래리티 II, 루카스 레이저, 울블랑 등
                최신 레이저 장비로 기미, 색소, 혈관, 제모 등 다양한 피부 고민을 해결합니다.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center px-8 py-4 bg-[#10B981] text-white font-medium rounded-full hover:bg-[#059669] transition-colors"
                >
                  상담 예약하기
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <ClarityMechanismIllustration />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 레이저 종류 선택 섹션 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              <span className="text-[#10B981]">레이저</span> 종류
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              피부 고민과 목적에 맞는 최적의 레이저를 선택합니다
            </p>
          </motion.div>

          {/* 레이저 선택 그리드 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
            {laserTypes.map((laser) => (
              <LaserCard
                key={laser.id}
                laser={laser}
                isActive={activeLaser.id === laser.id}
                onClick={() => setActiveLaser(laser)}
              />
            ))}
          </div>

          {/* 선택된 레이저 상세 정보 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeLaser.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div
                className="p-8 rounded-3xl"
                style={{ backgroundColor: `${activeLaser.color}08`, borderColor: `${activeLaser.color}30` }}
              >
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3
                      className="text-2xl font-semibold mb-2"
                      style={{ color: activeLaser.color }}
                    >
                      {activeLaser.name}
                    </h3>
                    <p className="text-gray-600 mb-6">{activeLaser.description}</p>

                    <div className="space-y-3">
                      {activeLaser.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${activeLaser.color}20` }}
                          >
                            <svg
                              className="w-3 h-3"
                              style={{ color: activeLaser.color }}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl">
                      <div className="text-sm text-gray-500 mb-1">파장</div>
                      <div className="text-lg font-semibold text-gray-900">{activeLaser.wavelength}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl">
                      <div className="text-sm text-gray-500 mb-1">다운타임</div>
                      <div className="text-lg font-semibold text-gray-900">{activeLaser.downtime}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl">
                      <div className="text-sm text-gray-500 mb-1">작용 원리</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {activeLaser.mechanism === 'photoacoustic' && '광음향 효과'}
                        {activeLaser.mechanism === 'photothermal' && '광열 효과'}
                        {activeLaser.mechanism === 'vascular' && '혈관 선택적'}
                        {activeLaser.mechanism === 'ablative' && '절제성 재생'}
                        {activeLaser.mechanism === 'broadband' && '광대역 광선'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 파장 비교 섹션 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              레이저 <span className="text-[#10B981]">파장</span> 비교
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              각 레이저는 고유한 파장으로 특정 타겟에 선택적으로 작용합니다
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <WavelengthComparisonIllustration />
          </motion.div>
        </div>
      </section>

      {/* 피부 고민별 추천 섹션 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              피부 고민별 <span className="text-[#10B981]">추천 레이저</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <SkinConcernsIllustration />
          </motion.div>
        </div>
      </section>

      {/* 클래리티 II 상세 섹션 */}
      <section className="py-20 bg-gradient-to-b from-white to-[#F0FDF4]/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-[#10B981]/10 text-[#059669] text-sm font-medium rounded-full mb-4">
              FEATURED
            </span>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              <span className="text-[#10B981]">Clarity II</span> 클래리티 II
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              듀얼 파장 레이저의 정점, 색소·혈관·제모까지 멀티 솔루션
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {treatment.benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 bg-white rounded-2xl shadow-sm"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                  <span className="text-xl">
                    {index === 0 ? '⚡' : index === 1 ? '🎯' : index === 2 ? '💧' : '✨'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* IntelliTrak 기술 설명 */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">IntelliTrak 기술</h3>
                  <p className="text-gray-600 mb-6">
                    클래리티 II만의 IntelliTrak 기술은 피부 상태를 실시간으로 분석하여
                    최적의 에너지를 정밀하게 전달합니다.
                  </p>
                  <ul className="space-y-3">
                    {['755nm + 1064nm 듀얼 파장', '색소와 혈관 동시 치료', '안전하고 효과적인 제모'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Focus Lens 일러스트 */}
                <div className="relative">
                  <svg viewBox="0 0 200 200" className="w-full max-w-[200px] mx-auto">
                    <defs>
                      <radialGradient id="focusGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* 렌즈 효과 */}
                    <motion.circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2"
                      strokeDasharray="10 5"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      style={{ transformOrigin: '100px 100px' }}
                    />

                    {/* 집속된 에너지 포인트 */}
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                      const angle = (i * 40) * Math.PI / 180;
                      const x = 100 + Math.cos(angle) * 50;
                      const y = 100 + Math.sin(angle) * 50;
                      return (
                        <motion.circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="5"
                          fill="#10B981"
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, delay: i * 0.15, repeat: Infinity }}
                        />
                      );
                    })}

                    {/* 중앙 집속점 */}
                    <motion.circle
                      cx="100"
                      cy="100"
                      r="15"
                      fill="url(#focusGradient)"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <circle cx="100" cy="100" r="8" fill="#10B981" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 시술 과정 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              시술 <span className="text-[#10B981]">과정</span>
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#10B981] to-[#6EE7B7] hidden md:block" />

              {treatment.process.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-20 pb-12 last:pb-0"
                >
                  <div className="absolute left-0 w-16 h-16 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {step.step}
                  </div>
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 시술 정보 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              시술 <span className="text-[#10B981]">정보</span>
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            {[
              { label: '시술 시간', value: treatment.duration, icon: '⏱️' },
              { label: '마취', value: treatment.anesthesia, icon: '💉' },
              { label: '회복 기간', value: treatment.recovery, icon: '🔄' },
              { label: '권장 횟수', value: treatment.results, icon: '📅' },
            ].map((info, index) => (
              <motion.div
                key={info.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm"
              >
                <div className="w-14 h-14 rounded-full bg-[#10B981]/10 flex items-center justify-center text-2xl">
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

      {/* 이런 분께 추천 */}
      <section className="py-20 bg-gradient-to-b from-white to-[#F0FDF4]/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              이런 분께 <span className="text-[#10B981]">추천</span>합니다
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
                <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0">
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

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              자주 묻는 <span className="text-[#10B981]">질문</span>
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
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                  <span className="text-[#10B981] transform group-open:rotate-180 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-gray-600">{faq.a}</div>
              </motion.details>
            ))}
          </div>

          {relatedMedicalQA.length > 0 && (
            <div className="max-w-3xl mx-auto mt-12">
              <h3 className="text-xl font-medium text-gray-900 mb-6 text-center">관련 의료정보 Q&A</h3>
              <div className="space-y-4">
                {relatedMedicalQA.slice(0, 3).map((qa, index) => (
                  <motion.details
                    key={qa.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group bg-[#F0FDF4]/50 rounded-xl overflow-hidden"
                  >
                    <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                      <span className="font-medium text-gray-900 pr-4">{qa.question}</span>
                      <span className="text-[#10B981] transform group-open:rotate-180 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </summary>
                    <div className="px-6 pb-6 text-gray-600">{qa.answer}</div>
                  </motion.details>
                ))}
              </div>
              <div className="text-center mt-6">
                <Link href="/medical" className="text-[#10B981] hover:text-[#059669] font-medium inline-flex items-center gap-2">
                  더 많은 Q&A 보기
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 주의사항 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-2xl font-light text-gray-900 mb-8 text-center">
              시술 <span className="text-[#10B981]">주의사항</span>
            </h2>
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

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-[#10B981] to-[#059669]">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
              레이저 상담 예약
            </h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              피부 타입과 고민에 맞는 맞춤 레이저 시술을 제안해드립니다.
              전문의 상담으로 최적의 치료 계획을 세워보세요.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-white text-[#10B981] font-medium rounded-full hover:bg-gray-100 transition-colors"
              >
                온라인 상담 예약
              </Link>
              <a
                href="tel:02-797-2773"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-medium rounded-full hover:bg-white/10 transition-colors"
              >
                전화 상담 02-797-2773
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
