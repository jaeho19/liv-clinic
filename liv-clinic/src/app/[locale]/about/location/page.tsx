'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, StaggerChildren, StaggerItem, Button, Card, NaverMap, ScrollLink } from '@/components/ui';
import { SITE_INFO, BUSINESS_HOURS } from '@/lib/constants';

const transportations = [
  {
    id: 'subway',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: '지하철',
    description: '신사역 4번 출구',
    detail: '도보 1분 거리',
    lines: ['3호선'],
  },
  {
    id: 'bus',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0a4 4 0 110 8H4m16-8l-4-4m0 8l4-4" />
      </svg>
    ),
    title: '버스',
    description: '신사역 정류장',
    detail: '도보 2분 거리',
    lines: ['145', '148', '240', '402'],
  },
  {
    id: 'car',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    title: '자가용',
    description: '건물 내 주차장',
    detail: '시술 고객 2시간 무료',
    lines: [],
  },
];

export default function LocationPage() {
  const t = useTranslations();
  const tFooter = useTranslations('footer');
  const tLoc = useTranslations('aboutPage.locationPage');

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl">
              <p className="font-serif text-h3 text-primary mb-4">{tLoc('sectionLabel')}</p>
              <h1 className="text-display text-secondary mb-6">{tLoc('heroTitle')}</h1>
              <p className="text-h4 text-mono leading-relaxed">
                {tLoc('heroDescription')}
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Map Section */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Map */}
            <AnimateOnScroll animation="fadeInLeft" className="lg:col-span-2">
              <div className="relative h-[500px] rounded-3xl overflow-hidden bg-mono-light/20">
                {/* Naver Maps */}
                <NaverMap
                  lat={SITE_INFO.coordinates.lat}
                  lng={SITE_INFO.coordinates.lng}
                  zoom={17}
                  className="absolute inset-0"
                />
              </div>
            </AnimateOnScroll>

            {/* Info Cards */}
            <AnimateOnScroll animation="fadeInRight">
              <div className="space-y-6">
                {/* Address */}
                <Card padding="lg" hover={false}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-h4 text-secondary mb-2">{tLoc('addressLabel')}</h3>
                      <p className="text-body text-mono mb-1">{t('sections.location.address')}</p>
                      <p className="text-small text-mono-light">{tLoc('buildingDetail')}</p>
                    </div>
                  </div>
                </Card>

                {/* Phone */}
                <Card padding="lg" hover={false}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-h4 text-secondary mb-2">{tLoc('phoneLabel')}</h3>
                      <a
                        href={`tel:${SITE_INFO.phone}`}
                        className="text-h3 text-primary hover:text-secondary transition-colors"
                      >
                        {SITE_INFO.phone}
                      </a>
                    </div>
                  </div>
                </Card>

                {/* Business Hours */}
                <Card padding="lg" hover={false}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-h4 text-secondary mb-4">{tFooter('businessHours')}</h3>
                      <div className="space-y-2 text-body">
                        <div className="flex justify-between">
                          <span className="text-mono-light">{tFooter('weekday')}</span>
                          <span className="text-mono">{BUSINESS_HOURS.weekday.open} - {BUSINESS_HOURS.weekday.close}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-mono-light">{tFooter('saturday')}</span>
                          <span className="text-mono">{BUSINESS_HOURS.saturday.open} - {BUSINESS_HOURS.saturday.close}</span>
                        </div>
                        <div className="pt-2 border-t border-border">
                          <span className="text-primary font-medium">{tFooter('sunday')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Map App Buttons */}
                <div className="space-y-3">
                  <p className="text-small text-mono-light text-center">지도 앱에서 열기</p>
                  <div className="grid grid-cols-3 gap-2">
                    {/* 네이버 지도 */}
                    <a
                      href={`https://map.naver.com/v5/search/${encodeURIComponent(SITE_INFO.address.ko)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#03C75A]/10 hover:bg-[#03C75A]/20 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#03C75A] flex items-center justify-center">
                        <span className="text-white font-bold text-sm">N</span>
                      </div>
                      <span className="text-xs text-mono">네이버</span>
                    </a>

                    {/* 카카오맵 */}
                    <a
                      href={`https://map.kakao.com/link/map/${encodeURIComponent('리브성형외과')},${SITE_INFO.coordinates.lat},${SITE_INFO.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#FEE500]/20 hover:bg-[#FEE500]/30 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#FEE500] flex items-center justify-center">
                        <span className="text-[#3C1E1E] font-bold text-sm">K</span>
                      </div>
                      <span className="text-xs text-mono">카카오</span>
                    </a>

                    {/* 구글 지도 */}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${SITE_INFO.coordinates.lat},${SITE_INFO.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#4285F4]/10 hover:bg-[#4285F4]/20 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#4285F4] flex items-center justify-center">
                        <span className="text-white font-bold text-sm">G</span>
                      </div>
                      <span className="text-xs text-mono">구글</span>
                    </a>
                  </div>

                  {/* 전화하기 버튼 */}
                  <div className="pt-2">
                    <a
                      href={`tel:${SITE_INFO.phone}`}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-secondary/10 hover:bg-secondary/20 transition-colors w-full"
                    >
                      <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-sm text-secondary font-medium">전화하기</span>
                    </a>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Transportation */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-primary mb-2">Transportation</p>
              <h2 className="text-h1 text-secondary">교통편 안내</h2>
            </div>
          </AnimateOnScroll>

          <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {transportations.map((transport) => (
              <StaggerItem key={transport.id}>
                <Card padding="lg" className="h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      {transport.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-h4 text-secondary mb-1">{transport.title}</h3>
                      <p className="text-body text-mono mb-1">{transport.description}</p>
                      <p className="text-small text-primary font-medium mb-3">{transport.detail}</p>
                      {transport.lines.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {transport.lines.map((line, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-secondary/10 text-secondary rounded text-small"
                            >
                              {line}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Parking Info */}
      <section className="py-20 bg-secondary text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="font-serif text-h3 opacity-80 mb-2">Parking</p>
                <h2 className="text-h1 mb-6">주차 안내</h2>
                <div className="space-y-4 text-body opacity-90">
                  <p>
                    건물 내 지하 주차장을 이용하실 수 있습니다.
                    <br />
                    시술 고객님께는 <span className="text-white font-medium">2시간 무료 주차</span>를 제공해드립니다.
                  </p>
                  <p>
                    주차 공간이 협소할 수 있으니,
                    <br />
                    가급적 대중교통 이용을 권장드립니다.
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="bg-white/10 backdrop-blur rounded-3xl p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <p className="font-serif text-3xl mb-2">2시간</p>
                  <p className="text-small opacity-80">시술 고객 무료 주차</p>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center">
              <h2 className="text-h1 text-secondary mb-4">방문 상담 예약</h2>
              <p className="text-h4 text-mono mb-8">
                편안한 상담을 위해 미리 예약해주세요.
              </p>
              <div className="flex justify-center gap-4">
                <ScrollLink href="/contact">
                  <Button variant="primary" size="lg">
                    상담 예약하기
                  </Button>
                </ScrollLink>
                <a href={`tel:${SITE_INFO.phone}`}>
                  <Button variant="outline" size="lg">
                    전화 상담
                  </Button>
                </a>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-20 bg-white">
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
            <Link href="/about/equipment">
              <Card padding="lg" className="group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-h4 text-secondary group-hover:text-primary transition-colors">
                      보유 장비
                    </h3>
                    <p className="text-body text-mono-light">Equipment</p>
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
