'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { TREATMENTS, LASER_CATEGORIES } from '@/lib/constants';

const category = LASER_CATEGORIES[0]; // pigmentation
const clarityData = TREATMENTS.laser.clarity;
const lucasData = TREATMENTS.laser.lucas;
const toningData = TREATMENTS.laser.toning;
const ulblancData = TREATMENTS.laser.ulblanc;

// 피코초 vs 나노초 비교 일러스트
const PicoVsNanoIllustration = () => (
  <div className="relative w-full max-w-2xl mx-auto">
    <svg viewBox="0 0 600 300" className="w-full h-auto">
      <defs>
        <linearGradient id="picoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
        <linearGradient id="nanoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9CA3AF" />
          <stop offset="100%" stopColor="#D1D5DB" />
        </linearGradient>
      </defs>

      {/* 나노초 (왼쪽) */}
      <g>
        <rect x="30" y="40" width="240" height="220" rx="15" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="2" />
        <text x="150" y="75" textAnchor="middle" fill="#6B7280" fontSize="14" fontWeight="600">나노초 레이저</text>
        <text x="150" y="95" textAnchor="middle" fill="#9CA3AF" fontSize="11">10억분의 1초 (10⁻⁹)</text>

        {/* 큰 색소 입자들 */}
        <circle cx="100" cy="160" r="20" fill="#92400E" />
        <circle cx="150" cy="150" r="18" fill="#78350F" />
        <circle cx="200" cy="165" r="22" fill="#92400E" />

        <text x="150" y="220" textAnchor="middle" fill="#6B7280" fontSize="10">색소 입자가 크게 분해</text>
        <text x="150" y="240" textAnchor="middle" fill="#9CA3AF" fontSize="9">배출 속도 느림</text>
      </g>

      {/* 피코초 (오른쪽) */}
      <g>
        <rect x="330" y="40" width="240" height="220" rx="15" fill="#F5F3FF" stroke="#8B5CF6" strokeWidth="2" />
        <text x="450" y="75" textAnchor="middle" fill="#7C3AED" fontSize="14" fontWeight="600">피코초 레이저</text>
        <text x="450" y="95" textAnchor="middle" fill="#A78BFA" fontSize="11">1조분의 1초 (10⁻¹²)</text>

        {/* 미세하게 분해된 색소 입자들 */}
        {[...Array(25)].map((_, i) => (
          <motion.circle
            key={i}
            cx={380 + (i % 5) * 35 + Math.random() * 10}
            cy={130 + Math.floor(i / 5) * 25 + Math.random() * 10}
            r="5"
            fill="#D97706"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          />
        ))}

        <text x="450" y="220" textAnchor="middle" fill="#7C3AED" fontSize="10">색소 입자가 미세하게 분해</text>
        <text x="450" y="240" textAnchor="middle" fill="#A78BFA" fontSize="9">빠른 림프 배출</text>
      </g>

      {/* 중앙 화살표 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <path d="M280 150 L320 150" stroke="#8B5CF6" strokeWidth="3" markerEnd="url(#arrowhead)" />
        <text x="300" y="130" textAnchor="middle" fill="#8B5CF6" fontSize="10" fontWeight="600">1000배</text>
        <text x="300" y="145" textAnchor="middle" fill="#8B5CF6" fontSize="10" fontWeight="600">빠름</text>
      </motion.g>
    </svg>
  </div>
);

// 3단계 치료 시스템 일러스트
const ThreeStageSystemIllustration = () => (
  <div className="relative w-full max-w-4xl mx-auto">
    <div className="grid md:grid-cols-3 gap-6">
      {[
        {
          stage: '1단계',
          title: '집중 치료',
          equipment: '루카스 피코',
          description: '피코세컨드 펄스로 깊은 색소 집중 분해',
          color: '#8B5CF6',
          icon: '⚡',
        },
        {
          stage: '2단계',
          title: '정밀 타겟',
          equipment: '클래리티 II 755nm',
          description: '알렉산드라이트 파장으로 얕은 색소 정밀 치료',
          color: '#10B981',
          icon: '🎯',
        },
        {
          stage: '3단계',
          title: '유지 관리',
          equipment: '토닝 + 울블랑',
          description: '저자극 반복 시술로 효과 유지 및 재발 방지',
          color: '#F59E0B',
          icon: '🔄',
        },
      ].map((stage, index) => (
        <motion.div
          key={stage.stage}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.2 }}
          className="relative p-6 bg-white rounded-2xl shadow-lg border-2"
          style={{ borderColor: stage.color }}
        >
          {/* 연결선 */}
          {index < 2 && (
            <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5" style={{ backgroundColor: stage.color }} />
          )}

          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-4"
            style={{ backgroundColor: `${stage.color}20` }}
          >
            {stage.icon}
          </div>
          <div className="text-sm font-medium mb-1" style={{ color: stage.color }}>
            {stage.stage}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{stage.title}</h3>
          <div className="text-sm font-medium text-gray-700 mb-2">{stage.equipment}</div>
          <p className="text-sm text-gray-500">{stage.description}</p>
        </motion.div>
      ))}
    </div>
  </div>
);

// 장비 카드 컴포넌트
interface EquipmentData {
  name: string;
  nameEn: string;
  tagline: string;
  benefits: readonly { readonly title: string; readonly desc: string }[];
  duration: string;
  recovery: string;
  results: string;
}

const EquipmentCard = ({
  equipment,
  isFeatured = false,
  color
}: {
  equipment: EquipmentData;
  isFeatured?: boolean;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`relative p-6 rounded-2xl ${isFeatured ? 'bg-white shadow-xl border-2' : 'bg-gray-50'}`}
    style={{ borderColor: isFeatured ? color : 'transparent' }}
  >
    {isFeatured && (
      <span
        className="absolute -top-3 left-6 px-3 py-1 text-xs font-bold text-white rounded-full"
        style={{ backgroundColor: color }}
      >
        FEATURED
      </span>
    )}

    <div className="flex items-start gap-4">
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <svg className="w-7 h-7" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-gray-900">{equipment.name}</h3>
        <p className="text-sm text-gray-500 mb-3">{equipment.nameEn}</p>
        <p className="text-sm text-gray-600 mb-4">{equipment.tagline}</p>

        <div className="space-y-2">
          {equipment.benefits.slice(0, 3).map((benefit, i) => (
            <div key={i} className="flex items-start gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: `${color}20` }}
              >
                <svg className="w-3 h-3" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">{benefit.title}</span>
                <span className="text-sm text-gray-500"> - {benefit.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4">
      <div>
        <div className="text-xs text-gray-500">시술 시간</div>
        <div className="text-sm font-medium text-gray-900">{equipment.duration}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500">다운타임</div>
        <div className="text-sm font-medium text-gray-900">{equipment.recovery}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500">권장 횟수</div>
        <div className="text-sm font-medium text-gray-900">{equipment.results.split(',')[0]}</div>
      </div>
    </div>
  </motion.div>
);

export default function PigmentationDetail() {
  return (
    <main className="bg-white">
      {/* 히어로 섹션 */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-amber-50 to-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-amber-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Link
                href="/laser"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                레이저 센터
              </Link>

              <span
                className="inline-block px-4 py-2 text-sm font-medium rounded-full mb-6"
                style={{ backgroundColor: `${category.color}15`, color: category.color }}
              >
                {category.nameEn}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6"
            >
              {category.name}
              <span className="block text-2xl md:text-3xl mt-4 font-normal" style={{ color: category.color }}>
                난치성 기미도 리브의 3단계 시스템으로
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
            >
              피코세컨드 레이저부터 저자극 토닝까지,
              4가지 프리미엄 장비로 완성하는 맞춤 색소 치료
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 text-white font-medium rounded-full transition-colors"
                style={{ backgroundColor: category.color }}
              >
                무료 상담 예약
              </Link>
              <a
                href="tel:02-797-2773"
                className="inline-flex items-center px-8 py-4 border-2 font-medium rounded-full transition-colors"
                style={{ borderColor: category.color, color: category.color }}
              >
                전화 상담 02-797-2773
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3단계 치료 시스템 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              리브의 <span style={{ color: category.color }}>3단계 색소 치료</span> 시스템
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              경증부터 난치성 기미까지, 단계별 맞춤 치료로 효과적인 색소 개선
            </p>
          </motion.div>

          <ThreeStageSystemIllustration />
        </div>
      </section>

      {/* 피코초 vs 나노초 비교 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              왜 <span className="text-purple-600">피코세컨드</span>인가?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              나노초 레이저 대비 1000배 빠른 펄스로 색소를 더 미세하게 분해
            </p>
          </motion.div>

          <PicoVsNanoIllustration />

          {/* 비교 테이블 */}
          <div className="max-w-3xl mx-auto mt-12">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">비교 항목</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-400">나노초</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-purple-600">피코초</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { item: '펄스 속도', nano: '10억분의 1초', pico: '1조분의 1초' },
                    { item: '색소 분해 크기', nano: '상대적 큼', pico: '미세함' },
                    { item: '주변 조직 손상', nano: '있음', pico: '최소' },
                    { item: '열 손상', nano: '있음', pico: '거의 없음' },
                    { item: '다운타임', nano: '상대적 김', pico: '짧음' },
                    { item: '시술 횟수', nano: '많음', pico: '적음' },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.item}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">{row.nano}</td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-purple-600">{row.pico}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 추천 장비 섹션 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              색소 치료 <span style={{ color: category.color }}>추천 장비</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              리브성형외과가 보유한 4가지 프리미엄 레이저로 최적의 색소 치료
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto space-y-6">
            {/* Featured: 루카스 레이저 */}
            <EquipmentCard
              equipment={lucasData}
              isFeatured={true}
              color="#8B5CF6"
            />

            {/* 클래리티 II */}
            <EquipmentCard
              equipment={clarityData}
              color="#10B981"
            />

            <div className="grid md:grid-cols-2 gap-6">
              {/* 레이저 토닝 */}
              <EquipmentCard
                equipment={toningData}
                color="#F59E0B"
              />

              {/* 울블랑 */}
              <EquipmentCard
                equipment={ulblancData}
                color="#EC4899"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 치료 프로토콜 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              증상별 <span style={{ color: category.color }}>추천 프로토콜</span>
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
            {[
              {
                level: '경증',
                description: '가벼운 기미, 잡티',
                treatment: '레이저 토닝',
                sessions: '5-10회',
                interval: '2주 간격',
                color: '#10B981',
              },
              {
                level: '중등도',
                description: '중간 깊이 색소',
                treatment: '클래리티 II 755nm',
                sessions: '3-5회',
                interval: '3-4주 간격',
                color: '#F59E0B',
              },
              {
                level: '중증 / 난치성',
                description: '깊은 기미, 난치성',
                treatment: '루카스 피코 + 토닝',
                sessions: '5-10회',
                interval: '2-4주 간격',
                color: '#8B5CF6',
              },
            ].map((protocol, index) => (
              <motion.div
                key={protocol.level}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-white rounded-2xl shadow-lg border-t-4"
                style={{ borderColor: protocol.color }}
              >
                <div
                  className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-4"
                  style={{ backgroundColor: `${protocol.color}15`, color: protocol.color }}
                >
                  {protocol.level}
                </div>
                <p className="text-gray-600 text-sm mb-4">{protocol.description}</p>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-500">추천 치료</div>
                    <div className="text-lg font-semibold text-gray-900">{protocol.treatment}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">시술 횟수</div>
                      <div className="text-sm font-medium text-gray-900">{protocol.sessions}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">시술 간격</div>
                      <div className="text-sm font-medium text-gray-900">{protocol.interval}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 이런 분께 추천 */}
      <section className="py-20 bg-amber-50/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              이런 분께 <span style={{ color: category.color }}>추천</span>합니다
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
            {[
              '기미가 점점 짙어지고 넓어지는 분',
              '여러 번 토닝을 받았지만 효과가 없는 분',
              '잡티, 주근깨가 많아 고민인 분',
              '검버섯이 생기기 시작한 분',
              '피부톤이 칙칙하고 균일하지 않은 분',
              '다운타임 없이 꾸준히 관리하고 싶은 분',
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 p-5 bg-white rounded-xl shadow-sm"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                >
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
              자주 묻는 <span style={{ color: category.color }}>질문</span>
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: '기미는 완치가 가능한가요?',
                a: '기미는 완치보다는 "관리"의 개념으로 접근해야 합니다. 집중 치료로 크게 개선한 후, 정기적인 유지 관리와 자외선 차단으로 재발을 최소화합니다. 리브의 3단계 시스템은 치료와 유지 관리를 모두 포함합니다.'
              },
              {
                q: '피코 레이저와 토닝 중 뭐가 좋나요?',
                a: '목적에 따라 다릅니다. 난치성 기미나 깊은 색소는 피코 레이저로 집중 치료하고, 경미한 색소나 유지 관리는 토닝이 적합합니다. 많은 경우 피코 치료 후 토닝으로 유지하는 복합 프로토콜이 효과적입니다.'
              },
              {
                q: '레이저 후 색소가 더 진해지기도 하나요?',
                a: '일시적 색소 침착(PIH)이 발생할 수 있습니다. 이는 2-4주 내 자연스럽게 개선되며, 자외선 차단을 철저히 하면 예방할 수 있습니다. 리브에서는 시술 후 관리 안내를 철저히 해드립니다.'
              },
              {
                q: '임신 중에도 색소 레이저가 가능한가요?',
                a: '임신 중이나 수유 중에는 레이저 시술을 권장하지 않습니다. 출산 및 수유 완료 후 시술을 권장합니다. 임신 중에는 자외선 차단과 보습에 집중해주세요.'
              },
            ].map((faq, index) => (
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
                  <span style={{ color: category.color }} className="transform group-open:rotate-180 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-gray-600">{faq.a}</div>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: `linear-gradient(135deg, ${category.color}, #8B5CF6)` }}>
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
              기미/색소 무료 상담
            </h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              피부 상태에 맞는 맞춤 색소 치료 계획을 상담해드립니다.
              전문의 상담으로 최적의 치료를 시작하세요.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-white font-medium rounded-full hover:bg-gray-100 transition-colors"
                style={{ color: category.color }}
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

      {/* 다른 레이저 카테고리 */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-xl font-medium text-gray-900 text-center mb-8">다른 레이저 시술 보기</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {LASER_CATEGORIES.filter(cat => cat.id !== 'pigmentation').map((cat) => (
              <Link
                key={cat.id}
                href={cat.href}
                className="px-6 py-3 bg-white rounded-full text-gray-700 hover:shadow-md transition-all"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
