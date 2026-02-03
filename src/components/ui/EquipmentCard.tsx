'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

/**
 * 장비 데이터 타입 정의
 */
interface EquipmentItem {
  id: string;
  name: string;           // 영문명
  nameKo: string;         // 한글명
  description: string;    // 설명
  features: string[];     // 특징 목록
  image: string;          // 이미지 경로
  certification: string;  // 인증 정보
}

interface EquipmentCardProps {
  equipment: EquipmentItem;
  index?: number;
}

/**
 * 장비 카드 컴포넌트 v2.0
 *
 * 변경사항:
 * - 이미지 영역에서 인증 배지 제거 (텍스트로 이동)
 * - 이미지 패딩 제거 (장비가 더 크게 보임)
 * - object-contain 사용 (장비 전체 표시, 잘림 없음)
 *
 * object-fit 선택 이유:
 * - contain: 이미지 전체가 보이도록 축소/확대, 빈 공간 발생 가능
 * - cover: 컨테이너를 채우지만 이미지 잘림 발생
 * → 장비 이미지는 전체가 보여야 하므로 contain이 적합
 */
export function EquipmentCard({ equipment, index = 0 }: EquipmentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
        {/*
         * 이미지 컨테이너
         * - aspect-square: 1:1 비율 고정 (모든 카드 동일 높이)
         * - bg-gradient: 투명 배경 이미지를 위한 배경색
         */}
        <div className="relative aspect-square bg-gradient-to-b from-gray-50/50 to-gray-100/50">
          {equipment.image && (
            <Image
              src={equipment.image}
              alt={`${equipment.nameKo} (${equipment.name}) 장비`}
              fill
              /*
               * sizes 속성: 반응형 이미지 최적화
               * - 모바일 (<640px): 화면 전체 너비
               * - 태블릿 (<1024px): 화면의 50%
               * - 데스크톱: 400px 고정
               */
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
              /*
               * object-contain: 이미지 비율 유지, 전체 표시
               * 패딩 없음 - 이미지 자체에 여백이 포함됨 (85% 크기)
               */
              className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              priority={index < 4}
            />
          )}

          {!equipment.image && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="font-serif text-sm">{equipment.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* 콘텐츠 영역 */}
        <div className="p-6">
          <h3 className="font-serif text-xl text-primary mb-1">{equipment.name}</h3>
          <p className="text-lg font-medium text-secondary mb-1">{equipment.nameKo}</p>

          {/* 인증 정보 - 이미지 배지 대신 텍스트로 표시 */}
          <p className="text-sm text-primary/70 mb-3">{equipment.certification}</p>

          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{equipment.description}</p>

          <ul className="space-y-1.5">
            {equipment.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * 장비 카드 그리드 컴포넌트
 *
 * - 반응형 그리드: 모바일 1열, 태블릿 2열, 데스크톱 3열
 * - 균일한 간격과 정렬
 */
interface EquipmentGridProps {
  equipment: EquipmentItem[];
  title?: string;
  subtitle?: string;
}

export function EquipmentGrid({ equipment, title, subtitle }: EquipmentGridProps) {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        {/* 섹션 헤더 */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {subtitle && (
              <p className="font-serif text-lg text-primary mb-2">
                {subtitle}
              </p>
            )}
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-secondary">
                {title}
              </h2>
            )}
          </div>
        )}

        {/* 장비 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {equipment.map((item, index) => (
            <EquipmentCard
              key={item.id}
              equipment={item}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default EquipmentCard;
