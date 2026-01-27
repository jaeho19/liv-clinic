'use client';

import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { TREATMENTS, LASER_CATEGORIES } from '@/lib/constants';

const category = LASER_CATEGORIES[1]; // vascular
const clarityData = TREATMENTS.laser.clarity;

// 듀얼 파장 작용 원리 일러스트
const DualWavelengthIllustration = () => (
  <div className="relative w-full max-w-3xl mx-auto">
    <svg viewBox="0 0 700 350" className="w-full h-auto">
      <defs>
        <linearGradient id="skinLayer1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFE4D6" />
          <stop offset="100%" stopColor="#FFD0B8" />
        </linearGradient>
        <linearGradient id="skinLayer2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFD0B8" />
          <stop offset="100%" stopColor="#FFBFA0" />
        </linearGradient>
        <linearGradient id="laser755" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="laser1064" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>

      {/* 피부 단면 */}
      <rect x="50" y="80" width="600" height="50" rx="5" fill="url(#skinLayer1)" />
      <text x="80" y="110" fill="#9CA3AF" fontSize="11">표피</text>
      <rect x="50" y="135" width="600" height="120" rx="5" fill="url(#skinLayer2)" />
      <text x="80" y="200" fill="#9CA3AF" fontSize="11">진피</text>

      {/* 혈관들 */}
      <g>
        {/* 얕은 혈관 (755nm 타겟) */}
        <ellipse cx="200" cy="150" rx="30" ry="8" fill="#EF4444" opacity="0.8" />
        <ellipse cx="350" cy="155" rx="25" ry="6" fill="#EF4444" opacity="0.8" />
        <ellipse cx="500" cy="148" rx="35" ry="9" fill="#EF4444" opacity="0.8" />

        {/* 깊은 혈관 (1064nm 타겟) */}
        <ellipse cx="250" cy="210" rx="40" ry="10" fill="#DC2626" opacity="0.9" />
        <ellipse cx="450" cy="220" rx="45" ry="12" fill="#DC2626" opacity="0.9" />
      </g>

      {/* 755nm 레이저 빔 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <line x1="200" y1="30" x2="200" y2="150" stroke="url(#laser755)" strokeWidth="4" strokeDasharray="8 4" />
        <line x1="350" y1="30" x2="350" y2="155" stroke="url(#laser755)" strokeWidth="4" strokeDasharray="8 4" />
        <line x1="500" y1="30" x2="500" y2="148" stroke="url(#laser755)" strokeWidth="4" strokeDasharray="8 4" />
      </motion.g>

      {/* 1064nm 레이저 빔 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <line x1="250" y1="30" x2="250" y2="210" stroke="url(#laser1064)" strokeWidth="4" strokeDasharray="8 4" />
        <line x1="450" y1="30" x2="450" y2="220" stroke="url(#laser1064)" strokeWidth="4" strokeDasharray="8 4" />
      </motion.g>

      {/* 범례 */}
      <g transform="translate(50, 290)">
        <rect x="0" y="0" width="280" height="50" rx="10" fill="#F0FDF4" />
        <circle cx="25" cy="25" r="8" fill="#10B981" />
        <text x="45" y="30" fill="#059669" fontSize="12" fontWeight="500">755nm - 얕은 혈관 타겟</text>
      </g>
      <g transform="translate(370, 290)">
        <rect x="0" y="0" width="280" height="50" rx="10" fill="#FEF2F2" />
        <circle cx="25" cy="25" r="8" fill="#EF4444" />
        <text x="45" y="30" fill="#DC2626" fontSize="12" fontWeight="500">1064nm - 깊은 혈관 타겟</text>
      </g>
    </svg>
  </div>
);

// 홍조 유형 카드
const RednessTypeCard = ({
  type,
  description,
  treatment,
  icon,
}: {
  type: string;
  description: string;
  treatment: string;
  icon: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="p-6 bg-white rounded-2xl shadow-lg border-l-4 border-red-500"
  >
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{type}</h3>
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full">
          <span className="text-xs font-medium text-red-600">추천 치료:</span>
          <span className="text-xs text-gray-700">{treatment}</span>
        </div>
      </div>
    </div>
  </motion.div>
);

export default function VascularDetail() {
  const faqRefs = useRef<Map<number, HTMLDetailsElement>>(new Map());

  // FAQ 토글 시 스크롤
  const handleFaqToggle = useCallback((index: number, e: React.MouseEvent<HTMLElement>) => {
    const details = e.currentTarget.closest('details') as HTMLDetailsElement;
    if (!details) return;

    if (!details.open) {
      requestAnimationFrame(() => {
        const rect = details.getBoundingClientRect();
        const scrollOffset = 120;
        const scrollTop = window.scrollY + rect.top - scrollOffset;
        window.scrollTo({ top: scrollTop, behavior: 'smooth' });
      });
    }
  }, []);

  return (
    <main className="bg-white">
      {/* 히어로 섹션 */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-red-50 to-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-red-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-400 rounded-full blur-3xl" />
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
                듀얼 파장으로 홍조와 혈관을 동시에
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
            >
              클래리티 II의 1064nm Nd:YAG 파장이
              홍조, 모세혈관 확장, 주사비를 효과적으로 개선합니다
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

      {/* 홍조 유형별 치료 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              <span style={{ color: category.color }}>홍조 유형</span>별 맞춤 치료
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              홍조의 원인과 깊이에 따라 최적의 파장과 에너지로 치료합니다
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            <RednessTypeCard
              type="안면홍조"
              description="감정 변화나 온도 변화에 얼굴이 쉽게 붉어지는 증상"
              treatment="클래리티 II 1064nm 저출력"
              icon="🔥"
            />
            <RednessTypeCard
              type="모세혈관 확장"
              description="코, 볼 주변에 실핏줄이 비치는 증상"
              treatment="클래리티 II 1064nm 고출력"
              icon="🩸"
            />
            <RednessTypeCard
              type="주사비 (Rosacea)"
              description="만성적인 홍조와 구진, 농포가 동반되는 피부 질환"
              treatment="클래리티 II + 스킨케어 병행"
              icon="💊"
            />
            <RednessTypeCard
              type="혈관종 / 혈관 기형"
              description="선천성 또는 후천성 혈관 병변"
              treatment="클래리티 II 집중 치료"
              icon="⭕"
            />
          </div>
        </div>
      </section>

      {/* 듀얼 파장 작용 원리 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              <span style={{ color: category.color }}>듀얼 파장</span>의 원리
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              755nm와 1064nm 두 파장이 얕은 혈관부터 깊은 혈관까지 선택적으로 치료
            </p>
          </motion.div>

          <DualWavelengthIllustration />

          <div className="max-w-3xl mx-auto mt-12 grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-emerald-50 rounded-2xl">
              <h3 className="text-lg font-bold text-emerald-700 mb-3">755nm 알렉산드라이트</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">•</span>
                  표피 가까이의 얕은 혈관 타겟
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">•</span>
                  모세혈관 확장 치료에 효과적
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">•</span>
                  헤모글로빈 흡수율 높음
                </li>
              </ul>
            </div>
            <div className="p-6 bg-red-50 rounded-2xl">
              <h3 className="text-lg font-bold text-red-700 mb-3">1064nm Nd:YAG</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  진피층의 깊은 혈관까지 도달
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  만성 홍조, 주사비 치료에 효과적
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  어두운 피부에도 안전
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 클래리티 II 장비 소개 */}
      <section className="py-20 bg-red-50/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-red-100 text-red-600 text-sm font-medium rounded-full mb-4">
              ONLY OPTION
            </span>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              <span className="text-emerald-600">Clarity II</span> 클래리티 II
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              혈관 치료에 최적화된 듀얼 파장 프리미엄 레이저
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">왜 클래리티 II인가?</h3>
                  <p className="text-gray-600 mb-6">
                    리브성형외과가 보유한 장비 중 혈관 치료에 가장 적합한 장비입니다.
                    1064nm Nd:YAG 파장이 혈관의 헤모글로빈에 선택적으로 흡수되어
                    주변 조직 손상 없이 혈관만 치료합니다.
                  </p>

                  <ul className="space-y-3">
                    {clarityData.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{benefit.title}</span>
                          <span className="text-gray-500"> - {benefit.desc}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  {[
                    { label: '시술 시간', value: clarityData.duration, icon: '⏱️' },
                    { label: '마취', value: clarityData.anesthesia, icon: '💉' },
                    { label: '다운타임', value: clarityData.recovery, icon: '🔄' },
                    { label: '권장 횟수', value: '3-8회 (증상에 따라)', icon: '📅' },
                  ].map((info, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <div className="text-xs text-gray-500">{info.label}</div>
                        <div className="text-sm font-medium text-gray-900">{info.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                description: '가벼운 홍조, 초기 모세혈관',
                sessions: '3-5회',
                interval: '3-4주 간격',
                color: '#10B981',
              },
              {
                level: '중등도',
                description: '만성 홍조, 확장된 모세혈관',
                sessions: '5-8회',
                interval: '3-4주 간격',
                color: '#F59E0B',
              },
              {
                level: '중증',
                description: '주사비, 심한 혈관 확장',
                sessions: '8-10회+',
                interval: '2-3주 간격',
                color: '#EF4444',
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
                    <div className="text-lg font-semibold text-gray-900">클래리티 II 1064nm</div>
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
      <section className="py-20 bg-gray-50">
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
              '감정 변화나 온도 변화에 얼굴이 쉽게 붉어지는 분',
              '코, 볼 주변에 실핏줄이 비치는 분',
              '만성적인 홍조로 화장이 잘 안 받는 분',
              '주사비 진단을 받은 분',
              '레이저 치료 후 홍조가 오래 지속되는 분',
              '안면 홍조로 대인관계가 불편한 분',
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
                q: '홍조 치료 후 바로 효과가 나타나나요?',
                a: '시술 직후에는 일시적으로 홍조가 더 심해 보일 수 있습니다. 이는 정상적인 반응이며, 2-3일 내에 가라앉습니다. 실제 효과는 3-4주 후부터 서서히 나타나며, 반복 시술에 따라 점진적으로 개선됩니다.'
              },
              {
                q: '홍조가 완전히 없어지나요?',
                a: '홍조의 원인과 심각도에 따라 다릅니다. 대부분의 경우 50-80% 개선을 기대할 수 있으며, 완전히 없애기보다는 증상을 크게 완화시키는 것이 목표입니다. 유지 관리 시술을 통해 효과를 지속시킬 수 있습니다.'
              },
              {
                q: '주사비도 레이저로 치료가 되나요?',
                a: '주사비의 혈관 확장 증상은 레이저로 효과적으로 치료할 수 있습니다. 다만 주사비는 복합적인 피부 질환이므로, 레이저 치료와 함께 스킨케어, 약물 치료를 병행하는 것이 효과적입니다.'
              },
              {
                q: '시술 후 주의사항이 있나요?',
                a: '시술 후 2-3일간은 사우나, 음주, 격한 운동을 피해야 합니다. 자외선 차단을 철저히 하고, 자극적인 화장품 사용을 자제해주세요. 시술 부위가 일시적으로 붉어지거나 붓는 것은 정상입니다.'
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
                <summary
                  onClick={(e) => handleFaqToggle(index, e)}
                  className="flex items-center justify-between p-6 cursor-pointer list-none"
                >
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
      <section className="py-20" style={{ background: `linear-gradient(135deg, ${category.color}, #DC2626)` }}>
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
              홍조/혈관 무료 상담
            </h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              홍조 유형에 맞는 맞춤 치료 계획을 상담해드립니다.
              전문의 상담으로 건강하고 맑은 피부를 되찾으세요.
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
            {LASER_CATEGORIES.filter(cat => cat.id !== 'vascular').map((cat) => (
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
