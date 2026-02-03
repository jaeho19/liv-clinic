'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, StaggerChildren, StaggerItem, Button, Card, ScrollLink } from '@/components/ui';
import { Certification } from '@/components/sections';
import { EQUIPMENT_LIST } from '@/lib/constants';

// 처리된 이미지 경로 (1000x1000 투명 배경 PNG)
const PROCESSED_IMAGE_PATH = '/images/equipment/processed';

// 회의록 기준 순서로 재배열된 장비 목록
const equipmentCategories = [
  {
    id: 'lifting',
    name: '리프팅 장비',
    nameEn: 'Lifting Equipment',
    description: '비수술 리프팅의 정점, 프리미엄 리프팅 장비',
    equipment: [
      {
        id: 'ultherapy',
        name: 'Ultherapy Prime',
        nameKo: '울쎄라피 프라임',
        description: 'FDA 승인 초음파 리프팅 – 깊은 층부터 탄탄하게',
        features: ['SMAS층까지 에너지 전달', '자연스러운 리프팅 효과', '시술 직후 일상생활 가능'],
        image: `${PROCESSED_IMAGE_PATH}/equipment_ultherapy.png`,
        certification: 'FDA, KFDA 승인',
      },
      {
        id: 'thermage',
        name: 'Thermage FLX',
        nameKo: '써마지 FLX',
        description: '고주파 리프팅의 정수 – 피부 속부터 팽팽하게',
        features: ['AccuREP 기술', '쿨링 시스템', '콜라겐 재생'],
        image: `${PROCESSED_IMAGE_PATH}/equipment_thermage.png`,
        certification: 'FDA, KFDA 승인',
      },
      {
        id: 'density',
        name: 'Density',
        nameKo: '덴서티',
        description: '고주파 에너지로 촘촘하게 – 정밀한 콜라겐 리프팅',
        features: ['고주파(RF) 리프팅', '균일한 에너지 분포', '합리적 가격대'],
        image: `${PROCESSED_IMAGE_PATH}/equipment_density.png`,
        certification: 'KFDA 승인',
      },
      {
        id: 'shurink',
        name: 'Shurink',
        nameKo: '슈링크',
        description: '데일리 리프팅의 대표 주자 – 합리적인 초음파 탄력 시술',
        features: ['무통 또는 저통증', '빠른 시술 시간', '경제적인 가격'],
        image: `${PROCESSED_IMAGE_PATH}/equipment_shurink.png`,
        certification: 'KFDA 승인',
      },
      {
        id: 'inmode',
        name: 'InMode',
        nameKo: '인모드',
        description: '지방 감소 + 탄력 개선을 한 번에',
        features: ['지방 감소와 리프팅 동시', '국소 부위 집중', '다운타임 적음'],
        image: `${PROCESSED_IMAGE_PATH}/equipment_inmode.png`,
        certification: 'FDA, KFDA 승인',
      },
    ],
  },
  {
    id: 'laser',
    name: '레이저 장비',
    nameEn: 'Laser Equipment',
    description: '피부 결 개선과 탄력을 위한 레이저 시스템',
    equipment: [
      {
        id: 'potenza',
        name: 'Potenza',
        nameKo: '포텐자',
        description: '모공, 피부결, 탄력까지 – 피부 리모델링의 새로운 기준',
        features: ['RF 마이크로니들', '펌핑팁 스킨부스터', '모공 축소'],
        image: `${PROCESSED_IMAGE_PATH}/equipment_potenza.png`,
        certification: 'FDA, KFDA 승인',
      },
      {
        id: 'clarity',
        name: 'Clarity II',
        nameKo: '클라리티 II',
        description: '더 빠르게, 더 정교하게 – 듀얼 파장 레이저',
        features: ['755nm/1064nm 듀얼', '색소/혈관 치료', '프리미엄 제모'],
        image: `${PROCESSED_IMAGE_PATH}/equipment_clarity.png`,
        certification: 'FDA 승인',
      },
      {
        id: 'lucas',
        name: 'LUCAS Laser',
        nameKo: '루카스 레이저',
        description: '피부 속부터 밝고 맑게 – 색소 치료의 새로운 기준',
        features: ['고출력 Q스위치', '기미/잡티 치료', '문신 제거'],
        image: `${PROCESSED_IMAGE_PATH}/equipment_lucas.png`,
        certification: 'KFDA 승인',
      },
      {
        id: 'co2',
        name: 'CO2 Laser',
        nameKo: 'CO2 레이저',
        description: '정밀 박피와 피부 재생 – 깊은 흉터와 잔주름 개선',
        features: ['프랙셔널 기술', '흉터/모공 치료', '피부 재생 촉진'],
        image: `${PROCESSED_IMAGE_PATH}/equipment_co2.png`,
        certification: 'KFDA 승인',
      },
      {
        id: 'ulblanc',
        name: 'Ulblanc',
        nameKo: '울블랑',
        description: '저자극 화이트닝 레이저',
        features: ['멜라닌 타겟팅', '피부 톤 균일화', '저자극 시술'],
        image: `${PROCESSED_IMAGE_PATH}/equipment_ulblanc.png`,
        certification: 'KFDA 승인',
      },
    ],
  },
];

export default function EquipmentPage() {
  const t = useTranslations();

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl">
              <p className="font-serif text-h3 text-primary mb-4">Equipment</p>
              <h1 className="text-display text-secondary mb-6">보유 장비</h1>
              <p className="text-h4 text-mono leading-relaxed">
                정품 인증 프리미엄 장비로
                <br />
                안전하고 효과적인 시술을 제공합니다.
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Official Certification Highlight */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <p className="font-serif text-h3 text-primary mb-4">Official Certified Clinic</p>
                <h2 className="text-h1 md:text-display text-secondary mb-6 leading-tight">
                  공식 인증 병원에서만 가능한
                  <br />
                  <span className="text-primary">프리미엄 리프팅 & 레이저</span> 솔루션
                </h2>
                <p className="text-h4 text-mono-light leading-relaxed max-w-2xl mx-auto">
                  리브성형외과는 울쎄라피 프라임, 써마지, 슈링크 등 글로벌 브랜드의
                  <br className="hidden md:block" />
                  공식 인증을 받은 프리미엄 클리닉입니다.
                </p>
              </motion.div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Official Partner - 공식 파트너 로고 */}
      <Certification />

      {/* Equipment Categories */}
      {equipmentCategories.map((category, categoryIndex) => (
        <section
          key={category.id}
          className={`section-gap ${categoryIndex % 2 === 0 ? 'bg-background' : 'bg-white'}`}
        >
          <div className="container-custom">
            <AnimateOnScroll>
              <div className="text-center mb-16">
                <p className="font-serif text-h3 text-primary mb-2">{category.nameEn}</p>
                <h2 className="text-h1 text-secondary mb-4">{category.name}</h2>
                <p className="text-body text-mono-light max-w-2xl mx-auto">
                  {category.description}
                </p>
              </div>
            </AnimateOnScroll>

            <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {category.equipment.map((item) => (
                <StaggerItem key={item.id}>
                  <Card padding="none" className="overflow-hidden h-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      {/* Image - 정사각형 비율 고정 (1:1), 배지 제거됨 */}
                      <div className="relative aspect-square bg-gradient-to-b from-gray-50/50 to-gray-100/50">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={`${item.nameKo} (${item.name}) 장비`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                            className="object-contain"
                            priority={category.id === 'lifting'}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-mono-light/50">
                              <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <p className="font-serif">{item.name}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6 lg:p-8 flex flex-col justify-between h-full">
                        <div>
                          <h3 className="font-serif text-2xl text-primary mb-1">{item.name}</h3>
                          <p className="text-h4 text-secondary mb-2">{item.nameKo}</p>

                          {/* 인증 정보 - 텍스트로 표시 */}
                          <p className="text-small text-primary/80 mb-4">{item.certification}</p>

                          <p className="text-body text-mono mb-4">{item.description}</p>
                        </div>

                        <div className="space-y-2">
                          {item.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-small text-mono-light">
                              <svg className="w-4 h-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerChildren>
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section className="py-20 bg-secondary text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center">
              <h2 className="text-h1 mb-4">프리미엄 장비로 시술받으세요</h2>
              <p className="text-h4 opacity-80 mb-8">
                정품 인증 장비와 전문의 시술로 안전하고 효과적인 결과를 경험하세요.
              </p>
              <div className="flex justify-center gap-4">
                <ScrollLink href="/contact">
                  <Button variant="primary" size="lg" className="bg-primary text-white hover:bg-secondary">
                    상담 예약하기
                  </Button>
                </ScrollLink>
                <Link href="/signature">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                    시그니처 프로그램
                  </Button>
                </Link>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-20 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/about">
              <Card padding="lg" className="group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-h4 text-secondary group-hover:text-primary transition-colors">
                      리브 브랜드
                    </h3>
                    <p className="text-body text-mono-light">About LIV</p>
                  </div>
                  <svg className="w-6 h-6 text-primary group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Card>
            </Link>
            <Link href="/about/staff">
              <Card padding="lg" className="group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-h4 text-secondary group-hover:text-primary transition-colors">
                      의료진 소개
                    </h3>
                    <p className="text-body text-mono-light">Medical Staff</p>
                  </div>
                  <svg className="w-6 h-6 text-primary group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Card>
            </Link>
            <Link href="/about/location">
              <Card padding="lg" className="group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-h4 text-secondary group-hover:text-primary transition-colors">
                      오시는 길
                    </h3>
                    <p className="text-body text-mono-light">Location</p>
                  </div>
                  <svg className="w-6 h-6 text-primary group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
