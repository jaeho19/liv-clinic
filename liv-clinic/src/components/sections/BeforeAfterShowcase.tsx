'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, StaggerChildren, StaggerItem, Button } from '@/components/ui';

interface BeforeAfterCase {
  id: string;
  title: string;
  subtitle: string;
  category: 'lifting' | 'antiaging' | 'skincare';
  beforeImage: string;
  afterImage: string;
}

const BEFORE_AFTER_CASES: BeforeAfterCase[] = [
  {
    id: 'lifting',
    title: '리프팅',
    subtitle: '울쎄라피 프라임 / 써마지',
    category: 'lifting',
    beforeImage: '/images/before-after/lifting-before.jpg',
    afterImage: '/images/before-after/lifting-after.jpg',
  },
  {
    id: 'antiaging',
    title: '안티에이징',
    subtitle: '보톡스 / 필러',
    category: 'antiaging',
    beforeImage: '/images/before-after/antiaging-before.jpg',
    afterImage: '/images/before-after/antiaging-after.jpg',
  },
  {
    id: 'skincare',
    title: '스킨케어',
    subtitle: '레이저 토닝',
    category: 'skincare',
    beforeImage: '/images/before-after/skincare-before.jpg',
    afterImage: '/images/before-after/skincare-after.jpg',
  },
];

function BeforeAfterCard({ caseItem }: { caseItem: BeforeAfterCase }) {
  return (
    <motion.div
      className="group"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300">
        {/* Before/After 이미지 영역 */}
        <div className="flex">
          {/* Before */}
          <div className="relative flex-1 aspect-[3/4]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20">
              <Image
                src={caseItem.beforeImage}
                alt={`${caseItem.title} Before`}
                fill
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            {/* Before 라벨 */}
            <div className="absolute top-3 left-3 px-3 py-1 bg-secondary/80 backdrop-blur-sm rounded-full">
              <span className="text-xs font-semibold text-white tracking-wider">BEFORE</span>
            </div>
          </div>

          {/* After */}
          <div className="relative flex-1 aspect-[3/4]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30">
              <Image
                src={caseItem.afterImage}
                alt={`${caseItem.title} After`}
                fill
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            {/* After 라벨 */}
            <div className="absolute top-3 right-3 px-3 py-1 bg-primary/80 backdrop-blur-sm rounded-full">
              <span className="text-xs font-semibold text-white tracking-wider">AFTER</span>
            </div>
          </div>
        </div>

        {/* 제목 영역 */}
        <div className="p-5 text-center border-t border-border">
          <h3 className="font-serif text-lg text-secondary mb-1">{caseItem.title}</h3>
          <p className="text-sm text-mono-light">{caseItem.subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function BeforeAfterShowcase() {
  return (
    <section className="section-gap bg-background">
      <div className="container-custom">
        {/* 섹션 헤더 */}
        <AnimateOnScroll animation="fadeInUpSmooth">
          <div className="text-center mb-16">
            <motion.p
              className="font-serif text-h3 text-primary mb-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
            >
              Real Results
            </motion.p>
            <motion.h2
              className="text-h1 text-secondary mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
            >
              실제 시술 사례
            </motion.h2>
            <motion.p
              className="text-body text-mono-light max-w-xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
            >
              리브에서 경험한 고객님들의 실제 변화를 확인하세요
            </motion.p>
            <motion.div
              className="w-24 h-1 bg-primary mx-auto mt-6"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
            />
          </div>
        </AnimateOnScroll>

        {/* Before/After 카드 그리드 */}
        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12" staggerDelay={0.15}>
          {BEFORE_AFTER_CASES.map((caseItem) => (
            <StaggerItem key={caseItem.id} variant="scale">
              <BeforeAfterCard caseItem={caseItem} />
            </StaggerItem>
          ))}
        </StaggerChildren>

        {/* 안내 문구 */}
        <AnimateOnScroll>
          <div className="text-center">
            <p className="text-small text-mono-light mb-8">
              * 모든 사례는 환자분의 동의 하에 게시되었습니다.
            </p>

            {/* CTA 버튼 */}
            <Link href="/gallery">
              <Button variant="outline" size="lg">
                더 많은 사례 보기
                <svg
                  className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
