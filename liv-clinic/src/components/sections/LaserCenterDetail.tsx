'use client';

import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll } from '@/components/ui';
import { LASER_EQUIPMENT, LASER_CATEGORIES } from '@/lib/constants';

// 피부 고민별 카테고리 카드
interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    href: string;
    equipment: string[];
    icon: string;
  };
  index: number;
}

const CategoryCard = ({ category, index }: CategoryCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
  >
    <Link href={category.href}>
      <div className="group relative bg-white rounded-2xl p-6 border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:shadow-lg transition-all h-full">
        {/* 아이콘 */}
        <div className="text-4xl mb-4">{category.icon}</div>

        {/* 카테고리명 */}
        <h3 className="text-xl font-bold text-[var(--color-secondary)] mb-1 group-hover:text-[var(--color-primary)] transition-colors">
          {category.name}
        </h3>
        <p className="text-sm text-[var(--color-mono-light)] mb-3">{category.nameEn}</p>

        {/* 설명 */}
        <p className="text-sm text-[var(--color-mono)] mb-4 leading-relaxed">
          {category.description}
        </p>

        {/* 사용 장비 */}
        <div className="flex flex-wrap gap-1 mb-4">
          {category.equipment.map((eq, idx) => (
            <span
              key={idx}
              className="text-xs bg-[var(--color-background)] px-2 py-1 rounded text-[var(--color-mono-light)]"
            >
              {eq}
            </span>
          ))}
        </div>

        {/* 화살표 */}
        <div className="flex items-center text-[var(--color-primary)] text-sm font-medium">
          <span>자세히 보기</span>
          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  </motion.div>
);

// 장비 카드 컴포넌트
interface EquipmentCardProps {
  name: string;
  nameKo: string;
  wavelength: string;
  feature: string;
  targets: string[];
  highlight?: boolean;
}

const EquipmentCard = ({ name, nameKo, wavelength, feature, targets, highlight = false }: EquipmentCardProps) => (
  <motion.div
    className={`relative rounded-2xl p-6 h-full ${
      highlight
        ? 'bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 border-2 border-[var(--color-primary)]/30'
        : 'bg-white border border-[var(--color-border)]'
    }`}
    whileHover={{ y: -5 }}
    transition={{ duration: 0.3 }}
  >
    {highlight && (
      <div className="absolute -top-3 right-6 bg-[var(--color-primary)] text-white text-xs font-medium px-3 py-1 rounded-full">
        PREMIUM
      </div>
    )}

    <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-1">{nameKo}</h4>
    <p className="text-sm text-[var(--color-mono-light)] mb-4">{name}</p>

    <div className="space-y-3 mb-4">
      <div>
        <span className="text-xs text-[var(--color-mono-light)]">파장</span>
        <p className="text-sm font-medium text-[var(--color-secondary)]">{wavelength}</p>
      </div>
      <div>
        <span className="text-xs text-[var(--color-mono-light)]">특징</span>
        <p className="text-sm text-[var(--color-mono)]">{feature}</p>
      </div>
    </div>

    <div className="pt-3 border-t border-[var(--color-border)]">
      <span className="text-xs text-[var(--color-mono-light)]">적응증</span>
      <div className="flex flex-wrap gap-1 mt-1">
        {targets.slice(0, 3).map((target, idx) => (
          <span
            key={idx}
            className={`text-xs px-2 py-0.5 rounded ${
              highlight
                ? 'bg-[var(--color-primary)]/20 text-[var(--color-secondary)]'
                : 'bg-[var(--color-background)] text-[var(--color-mono)]'
            }`}
          >
            {target}
          </span>
        ))}
      </div>
    </div>
  </motion.div>
);

// 피부 고민별 카테고리 데이터
const skinConcernCategories = [
  {
    id: 'pigmentation',
    name: '기미/색소 개선',
    nameEn: 'Pigmentation & Melasma',
    description: '기미, 잡티, 검버섯 등 색소 질환을 피코레이저와 레이저 토닝으로 효과적으로 개선합니다.',
    href: '/laser/pigmentation',
    equipment: ['Lucas', '레이저 토닝', 'Clarity II'],
    icon: '☀️'
  },
  {
    id: 'vascular',
    name: '홍조/혈관 치료',
    nameEn: 'Redness & Vascular',
    description: '안면 홍조, 모세혈관 확장증, 혈관종을 Clarity II 듀얼 파장으로 치료합니다.',
    href: '/laser/vascular',
    equipment: ['Clarity II'],
    icon: '🔴'
  },
  {
    id: 'skintone',
    name: '피부톤 균일화',
    nameEn: 'Skin Tone Brightening',
    description: '칙칙한 피부를 레이저 토닝과 울블랑으로 맑고 환하게 개선합니다.',
    href: '/laser/skintone',
    equipment: ['레이저 토닝', '울블랑'],
    icon: '✨'
  },
  {
    id: 'hair-removal',
    name: '프리미엄 제모',
    nameEn: 'Premium Hair Removal',
    description: 'Clarity II 듀얼 파장과 IntelliTrak 기술로 모든 피부 타입에 안전한 제모.',
    href: '/laser/hair-removal',
    equipment: ['Clarity II'],
    icon: '💎'
  },
  {
    id: 'tattoo',
    name: '문신 제거',
    nameEn: 'Tattoo Removal',
    description: 'Lucas 피코레이저로 흉터 없이 모든 색상의 문신을 효과적으로 제거합니다.',
    href: '/laser/tattoo',
    equipment: ['Lucas'],
    icon: '🎨'
  }
];

// 장비 매트릭스 일러스트레이션
const EquipmentMatrixIllustration = () => (
  <svg viewBox="0 0 600 400" className="w-full h-auto">
    <defs>
      <linearGradient id="matrixGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#b4988d" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#6d4e42" stopOpacity="0.1" />
      </linearGradient>
    </defs>

    {/* 배경 */}
    <rect x="0" y="0" width="600" height="400" fill="#fafafa" rx="16" />

    {/* 제목 */}
    <text x="300" y="35" fontSize="16" fill="#575756" textAnchor="middle" fontWeight="600">
      피부 고민 × 장비 매트릭스
    </text>

    {/* 헤더 - 장비 */}
    <g transform="translate(150, 60)">
      {['Clarity II', 'Lucas', '레이저 토닝', '울블랑'].map((eq, idx) => (
        <g key={idx} transform={`translate(${idx * 110}, 0)`}>
          <rect x="0" y="0" width="100" height="35" fill="#6d4e42" rx="8" />
          <text x="50" y="22" fontSize="11" fill="white" textAnchor="middle" fontWeight="500">
            {eq}
          </text>
        </g>
      ))}
    </g>

    {/* 행 - 피부 고민 */}
    {[
      { name: '기미/색소', checks: [true, true, true, false] },
      { name: '홍조/혈관', checks: [true, false, false, false] },
      { name: '피부톤', checks: [false, false, true, true] },
      { name: '제모', checks: [true, false, false, false] },
      { name: '문신 제거', checks: [false, true, false, false] }
    ].map((row, rowIdx) => (
      <g key={rowIdx} transform={`translate(0, ${110 + rowIdx * 55})`}>
        {/* 고민명 */}
        <rect x="20" y="0" width="120" height="45" fill="url(#matrixGradient)" rx="8" />
        <text x="80" y="28" fontSize="12" fill="#575756" textAnchor="middle" fontWeight="500">
          {row.name}
        </text>

        {/* 체크박스들 */}
        {row.checks.map((checked, colIdx) => (
          <g key={colIdx} transform={`translate(${150 + colIdx * 110}, 0)`}>
            <rect x="0" y="0" width="100" height="45" fill="white" stroke="#e5e5e5" strokeWidth="1" rx="8" />
            {checked && (
              <motion.g
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: rowIdx * 0.1 + colIdx * 0.05 }}
              >
                <circle cx="50" cy="22" r="15" fill="#b4988d" opacity="0.2" />
                <path
                  d="M 40 22 L 47 29 L 60 16"
                  stroke="#b4988d"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.g>
            )}
          </g>
        ))}
      </g>
    ))}
  </svg>
);

export default function LaserCenterDetail() {
  const faqRefs = useRef<Map<number, HTMLDetailsElement>>(new Map());

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
    <main className="min-h-screen bg-[var(--color-background)]">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-b from-white to-[var(--color-background)]">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="max-w-4xl mx-auto text-center">
              <span className="inline-block bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium px-4 py-1 rounded-full mb-6">
                LASER CENTER
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--color-secondary)] mb-6">
                레이저 센터
              </h1>
              <p className="text-xl md:text-2xl text-[var(--color-primary)] font-medium mb-4">
                피부 고민별 맞춤 레이저 솔루션
              </p>
              <p className="text-lg text-[var(--color-mono)] max-w-2xl mx-auto leading-relaxed">
                Clarity II + Lucas 조합으로<br className="hidden md:block" />
                색소부터 혈관, 제모, 문신 제거까지 원스톱 케어
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* 강점 하이라이트 */}
      <section className="py-12 bg-[var(--color-secondary)]">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { label: '보유 장비', value: '4종', desc: '프리미엄 레이저' },
              { label: '치료 영역', value: '5가지', desc: '피부 고민 해결' },
              { label: '경험', value: '10년+', desc: '레이저 시술 경력' },
              { label: '안전성', value: '검증됨', desc: 'FDA 승인 장비' }
            ].map((stat, idx) => (
              <AnimateOnScroll key={idx} animation="fadeInUp" delay={idx * 0.1}>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-white/80 text-sm">{stat.label}</div>
                  <div className="text-white/60 text-xs">{stat.desc}</div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* 피부 고민별 카테고리 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                피부 고민별 맞춤 치료
              </h2>
              <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                고민하는 피부 문제를 선택하시면 최적의 레이저 치료를 안내해드립니다
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {skinConcernCategories.map((category, idx) => (
              <CategoryCard key={category.id} category={category} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* 장비-고민 매트릭스 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <span className="inline-block bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium px-4 py-1 rounded-full mb-4">
                장비 × 적응증
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                어떤 고민이든 해결할 수 있는 장비 라인업
              </h2>
              <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                LIV 레이저 센터의 4종 프리미엄 장비가 모든 피부 고민을 커버합니다
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fadeInUp" delay={0.1}>
            <div className="max-w-4xl mx-auto bg-[var(--color-background)] rounded-2xl p-6 overflow-x-auto">
              <EquipmentMatrixIllustration />
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* 보유 장비 소개 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <span className="inline-block bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium px-4 py-1 rounded-full mb-4">
                LIV 보유 장비
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                프리미엄 레이저 라인업
              </h2>
              <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                FDA 승인 최신 장비로 안전하고 효과적인 시술을 제공합니다
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <AnimateOnScroll animation="fadeInUp" delay={0.1}>
              <EquipmentCard
                name="Clarity II"
                nameKo="클래리티 II"
                wavelength="755nm + 1064nm"
                feature="듀얼 파장 + IntelliTrak 기술"
                targets={['색소', '혈관', '제모', '피부톤']}
                highlight
              />
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInUp" delay={0.2}>
              <EquipmentCard
                name="Lucas"
                nameKo="루카스"
                wavelength="532/755/1064nm"
                feature="피코초 펄스 (450ps)"
                targets={['기미', '색소', '문신 제거']}
              />
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInUp" delay={0.3}>
              <EquipmentCard
                name="Laser Toning"
                nameKo="레이저 토닝"
                wavelength="1064nm Nd:YAG"
                feature="저출력 반복 조사"
                targets={['피부톤', '모공', '피부결']}
              />
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInUp" delay={0.4}>
              <EquipmentCard
                name="Ulblanc"
                nameKo="울블랑"
                wavelength="전용 파장"
                feature="멜라닌 선택적 타겟"
                targets={['피부 미백', '톤 균일화']}
              />
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Clarity II + Lucas 시너지 */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <AnimateOnScroll animation="fadeInUp">
              <div className="text-center mb-12">
                <span className="inline-block bg-white text-[var(--color-primary)] text-sm font-medium px-4 py-1 rounded-full mb-4">
                  LIV EXCLUSIVE
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                  Clarity II + Lucas<br className="md:hidden" /> 시너지 효과
                </h2>
                <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                  두 프리미엄 장비의 조합으로 단독 시술 대비 더 빠르고 효과적인 결과를 기대할 수 있습니다
                </p>
              </div>
            </AnimateOnScroll>

            <div className="grid md:grid-cols-3 gap-6">
              <AnimateOnScroll animation="fadeInUp" delay={0.1}>
                <div className="bg-white rounded-2xl p-6 text-center">
                  <div className="w-16 h-16 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-[var(--color-secondary)] mb-2">다중 파장 커버리지</h4>
                  <p className="text-sm text-[var(--color-mono)]">
                    532nm~1064nm까지<br />모든 깊이의 타겟 접근
                  </p>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fadeInUp" delay={0.2}>
                <div className="bg-white rounded-2xl p-6 text-center">
                  <div className="w-16 h-16 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-[var(--color-secondary)] mb-2">복합 적응증 치료</h4>
                  <p className="text-sm text-[var(--color-mono)]">
                    기미+홍조, 색소+모공 등<br />복합 고민 동시 해결
                  </p>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fadeInUp" delay={0.3}>
                <div className="bg-white rounded-2xl p-6 text-center">
                  <div className="w-16 h-16 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-[var(--color-secondary)] mb-2">빠른 효과 발현</h4>
                  <p className="text-sm text-[var(--color-mono)]">
                    단독 시술 대비<br />1.5~2배 빠른 결과
                  </p>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* 시술 프로세스 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                레이저 시술 프로세스
              </h2>
            </div>
          </AnimateOnScroll>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: 1, title: '피부 분석', desc: '전문의 상담 및 피부 타입, 고민 정밀 분석' },
                { step: 2, title: '맞춤 설계', desc: '개인별 최적의 레이저 조합 및 치료 계획 수립' },
                { step: 3, title: '레이저 시술', desc: '숙련된 전문의의 안전하고 정밀한 시술' },
                { step: 4, title: '사후 관리', desc: '시술 후 케어 및 정기 점검, 유지 관리' }
              ].map((item, idx) => (
                <AnimateOnScroll key={idx} animation="fadeInUp" delay={idx * 0.1}>
                  <div className="text-center">
                    <div className="w-14 h-14 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-[var(--color-secondary)] mb-2">{item.title}</h4>
                    <p className="text-sm text-[var(--color-mono)]">{item.desc}</p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 자주 묻는 질문 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                자주 묻는 질문
              </h2>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fadeInUp" delay={0.1}>
            <div className="max-w-3xl mx-auto space-y-4">
              {[
                {
                  q: '어떤 레이저가 저에게 맞나요?',
                  a: '피부 상태와 고민에 따라 최적의 레이저가 다릅니다. 무료 상담을 통해 전문의가 피부를 직접 분석하고 맞춤 치료 계획을 제안해드립니다.'
                },
                {
                  q: '레이저 시술은 아픈가요?',
                  a: '장비마다 다르지만 대부분 "고무줄로 튕기는 느낌" 정도입니다. 필요시 마취 크림을 도포하여 통증을 최소화합니다. Clarity II의 경우 내장 쿨링 시스템이 있어 더욱 편안합니다.'
                },
                {
                  q: '다운타임은 얼마나 걸리나요?',
                  a: '레이저 종류에 따라 다릅니다. 레이저 토닝, 울블랑은 다운타임이 거의 없어 바로 일상생활이 가능하고, 피코레이저는 3-5일 정도의 경미한 붉음이 있을 수 있습니다.'
                },
                {
                  q: '효과는 언제부터 나타나나요?',
                  a: '시술 직후부터 피부톤 개선을 느끼실 수 있으며, 2-4주에 걸쳐 콜라겐 리모델링으로 효과가 더욱 뚜렷해집니다. 최적의 결과를 위해 권장 횟수를 완료하시는 것이 좋습니다.'
                }
              ].map((faq, idx) => (
                <details key={idx} className="group bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
                  <summary
                    onClick={(e) => handleFaqToggle(idx, e)}
                    className="flex items-center justify-between p-5 cursor-pointer"
                  >
                    <span className="font-medium text-[var(--color-secondary)]">{faq.q}</span>
                    <span className="text-[var(--color-primary)] group-open:rotate-180 transition-transform">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-[var(--color-mono)]">{faq.a}</div>
                </details>
              ))}
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-16 md:py-24 bg-[var(--color-secondary)]">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                맑고 건강한 피부를 위한 첫걸음
              </h2>
              <p className="text-white/80 mb-8 leading-relaxed">
                피부 고민에 맞는 최적의 레이저를 찾아드립니다<br className="hidden md:block" />
                무료 상담으로 맞춤 치료 계획을 확인하세요
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-8 py-4 rounded-full font-medium hover:bg-[var(--color-primary)]/90 transition-colors"
                >
                  무료 상담 예약
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <a
                  href="tel:02-547-0118"
                  className="inline-flex items-center justify-center gap-2 bg-transparent text-white px-8 py-4 rounded-full font-medium border-2 border-white/50 hover:border-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  02-547-0118
                </a>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </main>
  );
}
