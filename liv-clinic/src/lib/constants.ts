// 사이트 정보
export const SITE_INFO = {
  name: '리브성형외과',
  nameEn: 'LIV Plastic Surgery',
  slogan: 'Slow Aging, Natural Beauty',
  phone: '02-797-2773',
  phoneInternational: '+82-2-797-2773',
  email: 'info@livps.co.kr',
  address: {
    ko: '서울특별시 서초구 나루터로 80 자은빌딩 4층',
    en: '4F, Jaeun Building, 80 Naruteo-ro, Seocho-gu, Seoul, Korea',
  },
  postalCode: '06536',
  coordinates: {
    lat: 37.5155786,
    lng: 127.0184697,
  },
} as const;

// 영업시간
export const BUSINESS_HOURS = {
  weekday: { open: '10:00', close: '19:00' },
  saturday: { open: '10:00', close: '16:00' },
  sunday: null, // 휴무
} as const;

// SNS 링크
export const SOCIAL_LINKS = {
  kakao: 'https://pf.kakao.com/_hgFwn', // 리브성형외과 카카오톡 채널
  instagram: 'https://www.instagram.com/livps_official/',
  naver: 'https://blog.naver.com/liv_clinic',
  youtube: 'https://www.youtube.com/@리브성형외과',
  wechat: 'weixin://dl/chat?livps', // WeChat ID: livps
  line: 'https://line.me/R/ti/p/@livps', // LINE ID: @livps
} as const;

// 인증 정보
export const CERTIFICATIONS = [
  {
    id: 'ulthera',
    name: '울쎄라피 프라임 정품 인증',
    nameEn: 'Ultherapy Prime Certified',
    logo: '/images/certifications/ulthera.png',
    link: 'https://merz.co.kr/',
  },
  {
    id: 'thermage',
    name: '써마지 FLX 파트너',
    nameEn: 'Thermage FLX Partner',
    logo: '/images/certifications/thermage.png',
    link: 'https://www.thermage.co.kr/',
  },
] as const;

// 4대 핵심 가치
export const CORE_VALUES = [
  {
    id: 'natural',
    title: 'Natural Beauty',
    titleKo: '자연스러운 아름다움',
    description: '과하지 않은, 본연의 아름다움을 추구합니다',
    image: '/images/values/natural-beauty.png',
  },
  {
    id: 'expertise',
    title: 'Clinical Expertise',
    titleKo: '전문적 기술',
    description: '풍부한 경험과 노하우로 최상의 결과를 제공합니다',
    image: '/images/values/clinical-expertise.png',
  },
  {
    id: 'safety',
    title: 'Safety & Ethical Care',
    titleKo: '안전과 윤리',
    description: '정품정량 원칙과 철저한 안전 관리를 준수합니다',
    image: '/images/values/safety-ethics.png',
  },
  {
    id: 'tailored',
    title: 'Tailored Aging',
    titleKo: '맞춤 안티에이징',
    description: '개인별 맞춤 솔루션으로 최적의 결과를 설계합니다',
    image: '/images/values/tailored-aging.png',
  },
] as const;

// 시그니처 프로그램
export const SIGNATURE_PROGRAMS = [
  {
    id: 'lifting',
    title: 'LIFTING',
    subtitle: '울쎄라피 프라임 & 써마지',
    description: '비수술 리프팅의 정점, 프리미엄 장비로 자연스러운 리프팅',
    href: '/signature/lifting',
  },
  {
    id: 'petit',
    title: 'PETIT',
    subtitle: '필러 & 보톡스',
    description: '섬세한 터치로 완성하는 볼륨과 윤곽',
    href: '/signature/petit',
  },
  {
    id: 'care',
    title: 'CARE',
    subtitle: '메디컬 스킨케어',
    description: '피부 본연의 건강함을 되찾는 맞춤 케어',
    href: '/signature/care',
  },
] as const;

// 장비 목록 (회의록 기준 순서)
export const EQUIPMENT_LIST = [
  { id: 'ulthera', name: 'Ultherapy Prime', nameKo: '울쎄라피 프라임' },
  { id: 'thermage', name: 'Thermage FLX', nameKo: '써마지 FLX' },
  { id: 'density', name: 'Density', nameKo: '덴서티' },
  { id: 'shurink', name: 'Shurink', nameKo: '슈링크' },
  { id: 'inmode', name: 'InMode', nameKo: '인모드' },
  { id: 'potenza', name: 'Potenza', nameKo: '포텐자' },
  { id: 'clarity', name: 'Clarity II', nameKo: '클래리티 II' },
  { id: 'lucas', name: 'Lucas', nameKo: '루카스' },
  { id: 'co2', name: 'CO2 Laser', nameKo: 'CO2 레이저' },
  { id: 'ulblanc', name: 'Ulblanc', nameKo: '울블랑' },
] as const;

// 시술 정보
export const TREATMENTS = {
  // 리프팅 시술
  lifting: {
    ulthera: {
      id: 'ulthera',
      category: 'lifting',
      name: '울쎄라피 프라임',
      nameEn: 'Ultherapy Prime',
      tagline: 'FDA 승인 초음파 리프팅 – 깊은 층부터 탄탄하게',
      shortDesc: '미국 FDA와 국내 식약처 승인, HIFU 리프팅의 글로벌 스탠다드',
      heroImage: '/images/treatments/ulthera-hero.jpg',
      description: '울쎄라피 프라임은 미국 FDA에서 유일하게 리프팅 효과를 승인받은 HIFU(고강도 집속 초음파) 장비입니다. 피부 깊은 층인 SMAS까지 에너지를 전달하여 콜라겐 재생을 촉진하고, 자연스러운 리프팅 효과를 제공합니다.',
      benefits: [
        { title: 'FDA 유일 승인', desc: '리프팅 효과를 인정받은 유일한 HIFU 장비' },
        { title: 'DeepSEE 기술', desc: '시술 부위를 실시간으로 확인하며 정확한 시술' },
        { title: '자연스러운 결과', desc: '점진적 콜라겐 재생으로 3-6개월에 걸쳐 개선' },
        { title: '다운타임 최소화', desc: '일상생활에 바로 복귀 가능' },
      ],
      process: [
        { step: 1, title: '상담', desc: '피부 상태 분석 및 시술 계획 수립' },
        { step: 2, title: '세안', desc: '메이크업 제거 및 피부 정돈' },
        { step: 3, title: '마취', desc: '편안한 시술을 위한 마취 크림 도포' },
        { step: 4, title: '시술', desc: 'DeepSEE로 확인하며 정밀 시술' },
        { step: 5, title: '마무리', desc: '시술 부위 진정 및 애프터케어 안내' },
      ],
      duration: '60-90분',
      anesthesia: '마취 크림 (30분)',
      recovery: '즉시 일상 복귀 가능',
      results: '3-6개월에 걸쳐 점진적 개선, 1-2년 유지',
      targetAreas: ['이마', '눈가', '볼', '턱선', '목'],
      idealFor: [
        '비수술로 리프팅을 원하는 분',
        '처진 피부, 탄력 저하가 고민인 분',
        '자연스러운 변화를 원하는 분',
        '다운타임 없이 시술받고 싶은 분',
      ],
      cautions: [
        '시술 후 약간의 붓기, 홍조가 있을 수 있음',
        '시술 부위에 따라 일시적 감각 이상 가능',
        '임산부, 수유부는 시술 불가',
        '시술 부위에 금속 임플란트가 있는 경우 상담 필요',
      ],
      faqs: [
        { q: '울쎄라피 프라임 시술은 얼마나 아픈가요?', shortA: '마취 크림 후 시술하며 대부분 견딜 만한 수준입니다.', a: '마취 크림을 바르고 시술하기 때문에 대부분 견딜 만한 수준입니다. 통증에 민감하신 분은 추가적인 통증 조절이 가능합니다.' },
        { q: '효과는 언제부터 나타나나요?', shortA: '시술 직후 효과 + 3~6개월에 걸쳐 점진적 개선됩니다.', a: '시술 직후에도 약간의 리프팅 효과를 느낄 수 있으며, 콜라겐 재생에 따라 3-6개월에 걸쳐 점진적으로 개선됩니다.' },
        { q: '울쎄라피 프라임과 써마지의 차이는 무엇인가요?', shortA: '울쎄라피는 초음파(HIFU), 써마지는 고주파(RF) 방식입니다.', a: '울쎄라피 프라임은 HIFU(초음파), 써마지는 RF(고주파) 에너지를 사용합니다. 울쎄라피 프라임은 깊은 층의 리프팅에, 써마지는 전체적인 탄력 개선에 효과적입니다. 두 시술을 병행하면 시너지 효과를 볼 수 있습니다.' },
      ],
      relatedTreatments: ['thermage', 'shurink', 'thread'],
    },
    thermage: {
      id: 'thermage',
      category: 'lifting',
      name: '써마지 FLX',
      nameEn: 'Thermage FLX',
      tagline: '4세대 프리미엄 고주파 리프팅',
      shortDesc: '전 세계가 인정한 고주파 리프팅의 명품',
      heroImage: '/images/treatments/thermage-hero.jpg',
      description: '써마지 FLX는 최신 4세대 고주파 리프팅 장비로, AccuREP 기술을 통해 피부 상태에 맞는 최적의 에너지를 자동으로 조절합니다. 콜라겐 수축과 재생을 유도하여 전체적인 피부 탄력을 개선합니다.',
      benefits: [
        { title: 'AccuREP 기술', desc: '피부 임피던스를 실시간 측정하여 최적 에너지 전달' },
        { title: '시술 시간 단축', desc: '기존 대비 25% 빠른 시술 시간' },
        { title: '통증 감소', desc: '진동 기술로 시술 중 불편감 최소화' },
        { title: '균일한 효과', desc: '고른 에너지 전달로 균일한 리프팅 효과' },
      ],
      process: [
        { step: 1, title: '상담', desc: '피부 상태 분석 및 시술 계획 수립' },
        { step: 2, title: '세안', desc: '메이크업 제거 및 피부 정돈' },
        { step: 3, title: '마킹', desc: '시술 부위 격자 표시' },
        { step: 4, title: '시술', desc: 'AccuREP 기술로 맞춤 에너지 전달' },
        { step: 5, title: '마무리', desc: '시술 부위 진정 및 애프터케어 안내' },
      ],
      duration: '45-60분',
      anesthesia: '무마취 (진동 기술로 통증 감소)',
      recovery: '즉시 일상 복귀 가능',
      results: '즉각적 탄력 개선, 3-6개월 콜라겐 재생',
      targetAreas: ['얼굴 전체', '눈가', '목', '바디'],
      idealFor: [
        '피부 탄력 저하가 고민인 분',
        '잔주름 개선을 원하는 분',
        '자연스럽고 점진적인 변화를 원하는 분',
        '무마취 시술을 원하는 분',
      ],
      cautions: [
        '시술 후 일시적인 홍조가 있을 수 있음',
        '페이스메이커 장착자는 시술 불가',
        '임산부, 수유부는 시술 불가',
        '시술 부위에 금속 임플란트가 있는 경우 상담 필요',
      ],
      faqs: [
        { q: '써마지 FLX와 이전 버전의 차이는?', shortA: 'AccuREP 기술로 에너지 자동 조절, 25% 빠른 시술.', a: '4세대 FLX는 AccuREP 기술로 피부 상태에 맞는 에너지를 자동 조절하며, 시술 시간이 25% 단축되고 통증도 감소했습니다.' },
        { q: '시술 주기는 어떻게 되나요?', shortA: '1년에 1~2회 시술을 권장합니다.', a: '일반적으로 1년에 1-2회 시술을 권장합니다. 피부 상태에 따라 달라질 수 있으므로 상담을 통해 결정합니다.' },
        { q: '써마지 눈가 시술도 가능한가요?', shortA: '네, 써마지 아이 전용 팁으로 눈가 시술 가능합니다.', a: '네, 써마지 아이(Thermage Eye)는 눈가 전용 팁으로 눈꺼풀과 눈밑 탄력 개선에 효과적입니다.' },
      ],
      relatedTreatments: ['ulthera', 'inmode', 'density'],
    },
    density: {
      id: 'density',
      category: 'lifting',
      name: '덴서티',
      nameEn: 'Density',
      tagline: '고주파 에너지로 촘촘하게 – 정밀한 콜라겐 리프팅 솔루션',
      shortDesc: '고주파(RF) 에너지로 균일하고 매끄러운 리프팅',
      heroImage: '/images/treatments/density-hero.jpg',
      description: '덴서티는 고주파(RF) 에너지를 진피층에 집중 전달하여, 피부 깊은 곳의 콜라겐을 자극하고 피부 탄력과 주름 개선을 유도하는 고주파 리프팅 장비입니다. 일정한 깊이로 고르게 전달되는 에너지 덕분에 보다 균일하고 매끄러운 리프팅 효과를 기대할 수 있습니다.',
      benefits: [
        { title: '고주파 리프팅', desc: '고주파 방식으로 통증과 자극이 적음' },
        { title: '균일한 에너지', desc: '정밀하고 균일한 에너지 분포' },
        { title: '합리적 비용', desc: '써마지 대비 부담 적은 가격대' },
        { title: '정기적 관리', desc: '꾸준한 리프팅 관리에 적합' },
      ],
      process: [
        { step: 1, title: '상담', desc: '피부 상태 분석 및 시술 계획 수립' },
        { step: 2, title: '세안', desc: '메이크업 제거 및 피부 정돈' },
        { step: 3, title: '마취', desc: '필요시 마취 크림 도포' },
        { step: 4, title: '시술', desc: 'RF 고주파 리프팅 진행' },
        { step: 5, title: '마무리', desc: '시술 부위 진정 및 애프터케어' },
      ],
      duration: '40-60분',
      anesthesia: '마취 크림 (선택)',
      recovery: '즉시 일상 복귀 가능',
      results: '즉각적 리프팅 + 3-6개월 콜라겐 재생',
      targetAreas: ['이마', '눈가', '볼', '턱선', '목'],
      idealFor: [
        '복합적인 리프팅 효과를 원하는 분',
        '즉각적인 효과와 장기적 개선을 모두 원하는 분',
        '기존 리프팅 시술에 만족하지 못한 분',
      ],
      cautions: [
        '시술 후 약간의 붓기, 홍조 가능',
        '피부 상태에 따라 시술 가능 여부 상담 필요',
        '임산부, 수유부는 시술 불가',
      ],
      faqs: [
        { q: '울쎄라피 프라임, 써마지와 어떤 차이가 있나요?', shortA: '덴서티는 합리적 비용의 고주파 리프팅 입문 장비입니다.', a: '덴서티는 써마지와 같은 고주파(RF) 리프팅 계열이지만, 보다 합리적인 비용과 낮은 통증으로 리프팅 관리를 시작하기에 적합한 장비입니다. 울쎄라피 프라임, 슈링크 같은 HIFU 계열과 병행 시 다양한 층을 아우르는 복합 탄력 시술도 가능합니다.' },
        { q: '시술 간격은 어느 정도가 좋은가요?', shortA: '3~6개월 간격 시술을 권장합니다.', a: '일반적으로 3-6개월 간격으로 시술을 권장하며, 피부 상태에 따라 조절됩니다.' },
      ],
      relatedTreatments: ['ulthera', 'thermage', 'inmode'],
    },
    inmode: {
      id: 'inmode',
      category: 'lifting',
      name: '인모드',
      nameEn: 'InMode',
      tagline: '지방 감소 + 탄력 개선을 한 번에 – 스마트 고주파 리프팅',
      shortDesc: 'RF 에너지로 지방 감소와 리프팅 동시에',
      heroImage: '/images/treatments/inmode-hero.jpg',
      description: '인모드는 고주파(RF) 에너지를 활용해 지방층과 진피층을 동시에 자극, 리프팅과 동시에 슬리밍 효과까지 기대할 수 있는 멀티 리프팅 장비입니다. 얼굴 지방이 많은 타입이나 늘어진 피부가 복합적으로 고민인 경우에 효과적입니다.',
      benefits: [
        { title: '듀얼 효과', desc: '지방을 녹이고 리프팅까지 가능한 고주파 기술' },
        { title: '국소 집중', desc: '국소 부위 집중 시술 가능' },
        { title: '빠른 회복', desc: '통증과 다운타임 적음' },
        { title: '시너지 효과', desc: '써마지와 병행 시 고주파 시너지 효과 강화' },
      ],
      process: [
        { step: 1, title: '상담', desc: '피부 상태 분석 및 맞춤 핸드피스 선택' },
        { step: 2, title: '세안', desc: '메이크업 제거 및 피부 정돈' },
        { step: 3, title: '마취', desc: '시술 종류에 따라 국소 마취' },
        { step: 4, title: '시술', desc: '선택한 핸드피스로 맞춤 시술' },
        { step: 5, title: '마무리', desc: '시술 부위 진정 및 애프터케어' },
      ],
      duration: '30-60분',
      anesthesia: '무마취 또는 마취 크림',
      recovery: '즉시 일상 복귀 가능',
      results: '즉각적 탄력 + 점진적 콜라겐 재생',
      targetAreas: ['턱밑', '볼살', '페이스라인', '이중턱', '심부볼'],
      idealFor: [
        '턱 밑 지방 제거 및 탄력 강화를 원하는 분',
        '볼살 리프팅 및 페이스라인 정리를 원하는 분',
        '이중턱, 심부볼 개선을 원하는 분',
        '피부 속 콜라겐 재생 및 잔주름 개선을 원하는 분',
      ],
      cautions: [
        '시술 후 약간의 붓기, 홍조 가능',
        '피부 상태에 따라 시술 가능 여부 상담 필요',
        '임산부, 수유부는 시술 불가',
      ],
      faqs: [
        { q: '인모드는 어떤 분께 추천하나요?', shortA: '얼굴 지방이 많거나 늘어진 피부가 복합 고민인 분.', a: '얼굴 지방이 많거나 늘어진 피부가 복합적으로 고민인 분께 추천드립니다. 지방층과 진피층을 동시에 자극하여 리프팅과 슬리밍 효과를 동시에 기대할 수 있습니다.' },
        { q: '써마지와 병행하면 효과가 더 좋나요?', shortA: '네, 고주파 시너지 효과로 더 강력한 탄력 개선 가능.', a: '네, 인모드와 써마지를 병행하면 고주파 시너지 효과로 더 강력한 탄력 개선을 기대할 수 있습니다.' },
      ],
      relatedTreatments: ['thermage', 'density', 'thread'],
    },
    shurink: {
      id: 'shurink',
      category: 'lifting',
      name: '슈링크',
      nameEn: 'Shurink',
      tagline: '데일리 리프팅의 대표 주자',
      shortDesc: '합리적인 초음파 탄력 시술',
      heroImage: '/images/treatments/shurink-hero.jpg',
      description: '슈링크는 울쎄라피 프라임과 동일한 HIFU(고강도 집속 초음파) 기술을 기반으로, 보다 합리적인 비용으로 반복 관리가 가능한 리프팅 장비입니다. 얕은 층부터 깊은 층까지 골고루 작용하여, 탄력 개선과 피부결 정리 효과를 동시에 기대할 수 있습니다.',
      benefits: [
        { title: '빠른 시술', desc: '고속 연사 방식으로 시술 시간 단축' },
        { title: '다양한 카트리지', desc: '부위별 최적화된 카트리지 제공' },
        { title: '정밀 조사', desc: '섬세한 에너지 조절 가능' },
        { title: '합리적 비용', desc: '효과 대비 합리적인 가격' },
      ],
      process: [
        { step: 1, title: '상담', desc: '피부 상태 분석 및 시술 계획 수립' },
        { step: 2, title: '세안', desc: '메이크업 제거 및 피부 정돈' },
        { step: 3, title: '마취', desc: '마취 크림 도포 (선택)' },
        { step: 4, title: '시술', desc: '부위별 맞춤 카트리지로 시술' },
        { step: 5, title: '마무리', desc: '시술 부위 진정 및 애프터케어' },
      ],
      duration: '30-45분',
      anesthesia: '마취 크림 (선택)',
      recovery: '즉시 일상 복귀 가능',
      results: '2-4주 후 효과 시작, 3개월 최대 효과',
      targetAreas: ['이마', '눈가', '볼', '턱선', '목'],
      idealFor: [
        '처음 리프팅 시술을 받는 분',
        '빠른 시술을 원하는 분',
        '합리적인 비용으로 리프팅을 원하는 분',
        '정기적인 유지 관리를 원하는 분',
      ],
      cautions: [
        '시술 후 약간의 홍조 가능',
        '민감한 피부는 상담 필요',
        '임산부, 수유부는 시술 불가',
      ],
      faqs: [
        { q: '울쎄라피 프라임과 슈링크의 차이는?', shortA: '둘 다 HIFU지만 슈링크는 합리적 비용의 정기 관리용.', a: '둘 다 HIFU 원리이지만, 울쎄라피 프라임은 DeepSEE 시각화 기술이 있고 더 깊은 층까지 도달합니다. 슈링크는 빠르고 합리적인 비용으로 정기적 관리에 적합합니다.' },
        { q: '시술 주기는 어떻게 되나요?', shortA: '3~6개월 간격 시술, 유지 관리용으로 적합.', a: '보통 3-6개월 간격으로 시술을 권장하며, 울쎄라피 프라임이나 써마지 사이 유지 관리용으로도 좋습니다.' },
      ],
      relatedTreatments: ['ulthera', 'thermage', 'density'],
    },
    thread: {
      id: 'thread',
      category: 'lifting',
      name: '실리프팅',
      nameEn: 'Thread Lifting',
      tagline: '즉각적인 볼륨 리프팅',
      shortDesc: '녹는 실로 완성하는 V라인 리프팅',
      heroImage: '/images/treatments/thread-hero.jpg',
      description: '실리프팅은 PDO, PLLA, PCL 등 체내에서 녹는 특수 실을 사용하여 피부를 물리적으로 당겨 올리는 시술입니다. 즉각적인 리프팅 효과와 함께 실이 녹으면서 콜라겐 생성을 촉진합니다.',
      benefits: [
        { title: '즉각적 효과', desc: '시술 직후 리프팅 효과 확인 가능' },
        { title: '콜라겐 촉진', desc: '실이 녹으면서 콜라겐 재생 유도' },
        { title: '자연스러운 결과', desc: '점진적으로 효과가 자리잡아 자연스러움' },
        { title: '복합 효과', desc: '리프팅 + 탄력 개선 동시 효과' },
      ],
      process: [
        { step: 1, title: '상담', desc: '얼굴 구조 분석 및 실 종류 결정' },
        { step: 2, title: '세안', desc: '메이크업 제거 및 소독' },
        { step: 3, title: '마취', desc: '시술 부위 국소 마취' },
        { step: 4, title: '시술', desc: '디자인에 따라 실 삽입' },
        { step: 5, title: '마무리', desc: '시술 부위 정돈 및 관리 안내' },
      ],
      duration: '30-60분',
      anesthesia: '국소 마취',
      recovery: '3-7일 (멍, 붓기 가능)',
      results: '즉각적 리프팅, 6-12개월 유지',
      targetAreas: ['이마', '광대', '볼', '턱선', '팔자', '목'],
      idealFor: [
        '즉각적인 리프팅을 원하는 분',
        '처진 볼살, 무너진 광대가 고민인 분',
        '팔자주름, 턱선 정리를 원하는 분',
        '레이저 리프팅만으로 만족스럽지 않은 분',
      ],
      cautions: [
        '시술 후 3-7일 멍, 붓기 가능',
        '2주간 과격한 표정, 마사지 피해야 함',
        '시술 부위 당김감이 있을 수 있음',
        '드물게 감염, 실 노출 가능성',
      ],
      faqs: [
        { q: '실리프팅은 얼마나 유지되나요?', shortA: '실 종류에 따라 6~12개월 효과가 유지됩니다.', a: '실 종류에 따라 다르지만, 보통 6-12개월 정도 효과가 유지됩니다. PDO는 6-8개월, PLLA/PCL은 12개월 이상 유지됩니다.' },
        { q: '실리프팅 후 언제부터 화장이 가능한가요?', shortA: '시술 24시간 후부터 가벼운 화장 가능합니다.', a: '시술 24시간 후부터 가벼운 화장이 가능하며, 시술 부위는 1주일 정도 피해주시는 것이 좋습니다.' },
        { q: '레이저 리프팅과 병행해도 되나요?', shortA: '네, 1~2주 후 병행 시 시너지 효과 있습니다.', a: '네, 실리프팅 후 1-2주 뒤에 레이저 리프팅을 병행하면 시너지 효과를 볼 수 있습니다.' },
      ],
      relatedTreatments: ['ulthera', 'thermage', 'filler'],
    },
    aptos: {
      id: 'aptos',
      category: 'lifting',
      name: '압토스 바이오 리프팅',
      nameEn: 'APTOS Bio Lifting',
      tagline: '4세대 바이오 리프팅',
      shortDesc: '글로벌 100개국 이상 사용, KFDA 4등급 정식 허가',
      heroImage: '/images/aptos/procedure-main.jpg',
      description: 'APTOS NAMICA는 히알루론산 40mg을 나노, 서브마이크로, 마이크로 단위로 캡슐화하여 단계별로 방출하는 혁신적인 약물 전달 시스템(NAMICA Technology)을 적용한 4세대 바이오 실 리프팅입니다.',
      benefits: [
        { title: 'NAMICA 기술', desc: '히알루론산 40mg 단계별 방출 시스템' },
        { title: '글로벌 인증', desc: 'KFDA 4등급, CE, ISO 13485, FDA MDSAP' },
        { title: '장기 지속', desc: '최대 24개월 효과 지속' },
        { title: '바이오스티뮬레이션', desc: '콜라겐 생성 촉진으로 자연스러운 탄력' },
      ],
      process: [
        { step: 1, title: '상담', desc: '얼굴 구조 분석 및 시술 계획 수립' },
        { step: 2, title: '세안', desc: '메이크업 제거 및 소독' },
        { step: 3, title: '마취', desc: '시술 부위 국소 마취' },
        { step: 4, title: '시술', desc: 'APTOS 실 삽입 및 리프팅' },
        { step: 5, title: '마무리', desc: '시술 부위 정돈 및 관리 안내' },
      ],
      duration: '30-60분',
      anesthesia: '국소 마취',
      recovery: '3-7일 (멍, 붓기 가능)',
      results: '즉각적 리프팅, 최대 24개월 유지',
      targetAreas: ['이마', '광대', '볼', '턱선', '팔자', '목'],
      idealFor: [
        '장기간 지속되는 리프팅을 원하는 분',
        '바이오스티뮬레이션 효과를 원하는 분',
        '글로벌 인증 제품을 원하는 분',
        '자연스러운 볼륨감과 탄력을 원하는 분',
      ],
      cautions: [
        '시술 후 3-7일 멍, 붓기 가능',
        '2주간 과격한 표정, 마사지 피해야 함',
        '시술 부위 당김감이 있을 수 있음',
        '드물게 감염, 실 노출 가능성',
      ],
      faqs: [
        { q: 'APTOS NAMICA는 일반 실리프팅과 어떻게 다른가요?', shortA: '히알루론산 40mg 캡슐화, 최대 24개월 효과 지속.', a: 'APTOS NAMICA는 히알루론산 40mg이 캡슐화되어 있어 즉각, 중기, 장기 3단계로 효과가 나타납니다. 또한 콜라겐 생성을 촉진하는 바이오스티뮬레이션 효과가 있어 최대 24개월까지 효과가 지속됩니다.' },
        { q: 'APTOS는 어떤 인증을 받았나요?', shortA: 'KFDA 4등급, CE, ISO 13485, FDA MDSAP 인증.', a: 'KFDA 의료기기 4등급 정식 허가, 유럽 CE 인증, ISO 13485 품질경영시스템, FDA MDSAP 인증을 받은 글로벌 표준 제품입니다.' },
        { q: '레이저 리프팅과 병행해도 되나요?', shortA: '네, 2~4주 후 병행 시 시너지 효과 있습니다.', a: '네, APTOS 시술 후 2-4주 뒤에 레이저 리프팅을 병행하면 시너지 효과를 볼 수 있습니다.' },
      ],
      relatedTreatments: ['thread', 'ulthera', 'thermage'],
    },
  },
  // 안티에이징 시술
  antiaging: {
    botox: {
      id: 'botox',
      category: 'antiaging',
      name: '보톡스',
      nameEn: 'Botox',
      tagline: '표정 주름의 완벽한 해결책',
      shortDesc: '자연스러운 주름 개선과 윤곽 정리',
      heroImage: '/images/treatments/botox-hero.jpg',
      description: '보톡스(보툴리눔 톡신)는 근육의 움직임을 일시적으로 약화시켜 표정에 의한 주름을 개선하고, 턱근육(사각턱)이나 종아리 근육의 볼륨을 줄여주는 시술입니다. 정품 제품과 정확한 용량으로 자연스러운 결과를 제공합니다.',
      benefits: [
        { title: '표정 주름 개선', desc: '이마, 미간, 눈가 주름을 효과적으로 완화' },
        { title: '윤곽 정리', desc: '사각턱, 승모근 볼륨 감소' },
        { title: '빠른 시술', desc: '10-20분 내외의 짧은 시술 시간' },
        { title: '자연스러운 표정', desc: '적정 용량으로 자연스러운 표정 유지' },
      ],
      process: [
        { step: 1, title: '상담', desc: '주름 분석 및 원하는 결과 상담' },
        { step: 2, title: '세안', desc: '메이크업 제거 및 소독' },
        { step: 3, title: '마취', desc: '필요시 마취 크림 도포' },
        { step: 4, title: '마킹', desc: '시술 포인트 표시' },
        { step: 5, title: '시술', desc: '미세 주사로 보톡스 주입' },
        { step: 6, title: '마무리', desc: '주의사항 안내' },
      ],
      duration: '10-20분',
      anesthesia: '무마취 또는 마취 크림 (원하시는 경우)',
      recovery: '즉시 일상 복귀',
      results: '3-7일 후 효과 시작, 3-6개월 유지',
      targetAreas: ['이마', '미간', '눈가', '사각턱', '입꼬리', '승모근', '종아리'],
      idealFor: [
        '표정 주름이 고민인 분',
        '사각턱, 승모근 볼륨 축소를 원하는 분',
        '빠르고 간편한 시술을 원하는 분',
        '예방적 안티에이징을 원하는 젊은 층',
      ],
      cautions: [
        '시술 당일 음주, 사우나 피해야 함',
        '시술 부위 마사지 금지',
        '임산부, 수유부, 신경근육 질환자 시술 불가',
      ],
      faqs: [
        { q: '보톡스 맞으면 표정이 부자연스러워지나요?', shortA: '적정 용량이면 자연스러운 표정 유지됩니다.', a: '적정 용량을 정확한 위치에 주입하면 자연스러운 표정을 유지하면서 주름만 개선됩니다. 과용량 사용시 부자연스러울 수 있어 숙련된 의료진의 시술이 중요합니다.' },
        { q: '보톡스 효과는 얼마나 유지되나요?', shortA: '개인차 있지만 보통 3~6개월 유지됩니다.', a: '개인차가 있지만 보통 3-6개월 정도 유지됩니다. 정기적으로 시술받으면 근육이 약화되어 효과가 더 오래갈 수 있습니다.' },
        { q: '보톡스 종류에 따라 차이가 있나요?', shortA: '제품마다 발현 시간, 확산도, 지속 시간이 다릅니다.', a: '제품마다 효과 발현 시간, 확산도, 지속 시간에 차이가 있습니다. 부위와 목적에 맞는 제품을 선택하는 것이 중요합니다.' },
      ],
      relatedTreatments: ['filler', 'skinbooster', 'thread'],
    },
    filler: {
      id: 'filler',
      category: 'antiaging',
      name: '필러',
      nameEn: 'Filler',
      tagline: '볼륨과 윤곽의 아트',
      shortDesc: '히알루론산으로 채우는 자연스러운 볼륨',
      heroImage: '/images/treatments/filler-hero.jpg',
      description: '필러는 히알루론산(HA)을 주성분으로 하여 꺼진 부위에 볼륨을 채우고, 주름을 개선하며, 윤곽을 정돈하는 시술입니다. 다양한 제품과 경도를 활용하여 부위별 맞춤 시술이 가능합니다.',
      benefits: [
        { title: '즉각적 효과', desc: '시술 직후 볼륨 개선 확인 가능' },
        { title: '자연스러운 촉감', desc: '히알루론산의 부드러운 질감' },
        { title: '가역적 시술', desc: '필요시 녹일 수 있어 안전' },
        { title: '다양한 적용', desc: '볼륨, 주름, 윤곽 등 다목적 사용' },
      ],
      process: [
        { step: 1, title: '상담', desc: '얼굴 분석 및 시술 계획 수립' },
        { step: 2, title: '세안', desc: '메이크업 제거 및 소독' },
        { step: 3, title: '마취', desc: '시술 부위 마취 크림 또는 신경 차단' },
        { step: 4, title: '시술', desc: '부위별 맞춤 필러 주입' },
        { step: 5, title: '마무리', desc: '모양 정돈 및 애프터케어 안내' },
      ],
      duration: '20-40분',
      anesthesia: '마취 크림 또는 신경 차단 마취',
      recovery: '즉시 ~ 3일 (부위에 따라 상이)',
      results: '즉각적 효과, 6-24개월 유지 (제품에 따라 상이)',
      targetAreas: ['이마', '관자놀이', '코', '앞광대', '팔자', '옆볼', '턱끝', '애교살', '입술', '눈썹'],
      idealFor: [
        '꺼진 볼륨을 채우고 싶은 분',
        '팔자주름, 입가 주름이 고민인 분',
        '코, 턱 윤곽을 높이고 싶은 분',
        '입술 볼륨을 원하는 분',
      ],
      cautions: [
        '시술 후 멍, 붓기가 있을 수 있음',
        '시술 부위 마사지, 압박 금지',
        '과격한 운동, 사우나 3일간 피하기',
        '드물게 혈관 폐색 위험 있어 숙련된 의료진 시술 필수',
      ],
      faqs: [
        { q: '필러가 뭉치거나 부자연스러워지지 않나요?', shortA: '적정량 + 숙련된 의료진 시술이면 자연스럽습니다.', a: '정품 필러를 적정량 사용하고 해부학적 지식을 갖춘 의료진이 시술하면 자연스러운 결과를 얻을 수 있습니다. 과도한 시술은 부자연스러울 수 있으니 적정량 시술이 중요합니다.' },
        { q: '필러 시술 후 바로 일상생활이 가능한가요?', shortA: '대부분 즉시 일상 복귀 가능합니다.', a: '대부분 즉시 일상 복귀가 가능합니다. 다만 시술 부위에 따라 멍이나 붓기가 있을 수 있어 중요한 일정 전에는 여유를 두고 시술받는 것이 좋습니다.' },
        { q: '필러를 녹일 수 있나요?', shortA: '네, 히알루로니다제로 안전하게 녹일 수 있습니다.', a: '히알루론산 필러는 히알루로니다제로 녹일 수 있습니다. 시술 결과가 마음에 들지 않거나 합병증이 생겼을 때 안전하게 제거할 수 있습니다.' },
      ],
      relatedTreatments: ['botox', 'skinbooster', 'thread'],
    },
    skinbooster: {
      id: 'skinbooster',
      category: 'antiaging',
      name: '스킨부스터',
      nameEn: 'Skin Booster',
      tagline: '피부 속부터 차오르는 광채',
      shortDesc: '진피층 주입으로 수분, 재생, 탄력 개선',
      heroImage: '/images/treatments/skinbooster-hero.jpg',
      description: '스킨부스터는 다양한 제품을 피부 진피층에 주입하여 수분 공급, 재생, 탄력, 광채를 개선하는 시술입니다. 리쥬란, 쥬베룩, 리바이브, 비탈, 리투오 등 피부 상태에 맞는 제품을 선택하여 피부 컨디션을 끌어올립니다.',
      benefits: [
        { title: '깊은 수분 공급', desc: '진피층까지 히알루론산 전달' },
        { title: '피부 탄력 개선', desc: '콜라겐, 엘라스틴 생성 촉진' },
        { title: '자연스러운 광채', desc: '피부 속부터 건강한 빛' },
        { title: '피부결 개선', desc: '잔주름, 모공 개선 효과' },
      ],
      process: [
        { step: 1, title: '상담', desc: '피부 상태 분석 및 제품 선택' },
        { step: 2, title: '세안', desc: '메이크업 제거 및 피부 정돈' },
        { step: 3, title: '마취', desc: '마취 크림 도포' },
        { step: 4, title: '시술', desc: '미세 주사 또는 기기로 주입' },
        { step: 5, title: '마무리', desc: '진정 케어 및 자외선 차단' },
      ],
      duration: '30-45분',
      anesthesia: '마취 크림',
      recovery: '1-3일 (미세 주사 자국)',
      results: '2-4주 후 효과, 3-4회 코스 권장',
      targetAreas: ['얼굴 전체', '목', '손등'],
      idealFor: [
        '피부 건조함, 수분 부족이 고민인 분',
        '피부 탄력 저하, 잔주름이 고민인 분',
        '칙칙한 피부톤, 생기 없는 피부가 고민인 분',
        '레이저 시술 후 피부 재생을 원하는 분',
      ],
      cautions: [
        '시술 후 미세 주사 자국, 붉은기 가능',
        '시술 당일 화장, 음주 피하기',
        '자외선 차단 철저히 하기',
        '2-4주 간격으로 3-4회 시술 권장',
      ],
      faqs: [
        { q: '스킨부스터와 물광주사는 같은 건가요?', shortA: '비슷하지만 스킨부스터가 더 다양한 성분 포함.', a: '비슷한 개념이지만, 스킨부스터는 다양한 성분(히알루론산, 폴리뉴클레오타이드 등)을 포함합니다. 물광주사는 주로 히알루론산 기반의 수분 공급에 초점을 맞춥니다.' },
        { q: '효과는 언제부터 나타나나요?', shortA: '직후 수분감 + 2~4주 후 탄력·광채 개선.', a: '시술 직후에도 수분감을 느낄 수 있으며, 2-4주 후부터 피부 탄력, 광채가 개선됩니다. 최적의 효과를 위해 2-4주 간격으로 3-4회 시술을 권장합니다.' },
        { q: '어떤 제품이 좋은가요?', shortA: '피부 상태와 목적에 따라 상담 후 선택합니다.', a: '리쥬란, 쥬베룩, 리바이브, 비탈, 리투오 등 다양한 제품이 있으며, 피부 상태와 목적에 따라 선택합니다. 상담을 통해 본인에게 맞는 제품을 결정합니다.' },
      ],
      relatedTreatments: ['botox', 'filler', 'laser'],
    },
    skincare: {
      id: 'skincare',
      category: 'antiaging',
      name: '스킨케어',
      nameEn: 'Skincare',
      tagline: '피부관리사의 전문 터치',
      shortDesc: '물톡스, 플라필 등 피부관리사가 진행하는 프리미엄 스킨케어',
      heroImage: '/images/treatments/skincare-hero.jpg',
      description: '리브의 스킨케어는 피부관리사가 직접 진행하는 전문 피부 관리 프로그램입니다. 물톡스(수분 공급), 플라필(피부 재생), 클렌징 등 다양한 프로그램으로 피부 본연의 건강함을 회복시켜 드립니다.',
      benefits: [
        { title: '전문 피부관리사', desc: '숙련된 피부관리사의 정교한 테크닉' },
        { title: '물톡스 프로그램', desc: '깊은 수분 공급으로 촉촉하고 탄력 있는 피부' },
        { title: '플라필 프로그램', desc: '피부 재생과 탄력 회복을 위한 집중 케어' },
        { title: '맞춤형 프로그램', desc: '피부 타입별 최적화된 관리 프로그램 제공' },
      ],
      process: [
        { step: 1, title: '상담', desc: '피부 상태 분석 및 프로그램 선택' },
        { step: 2, title: '클렌징', desc: '딥클렌징으로 노폐물 제거' },
        { step: 3, title: '관리', desc: '선택한 프로그램에 따른 전문 관리' },
        { step: 4, title: '팩/마무리', desc: '진정 팩 및 수분 공급 마무리' },
      ],
      duration: '60-90분',
      anesthesia: '해당 없음',
      recovery: '없음 (즉시 일상 복귀)',
      results: '즉각적인 피부톤 개선, 정기 관리 시 효과 극대화',
      targetAreas: ['얼굴 전체', '목', '데콜테'],
      idealFor: [
        '건조하고 푸석푸석한 피부',
        '피부 탄력이 저하된 분',
        '특별한 날 앞두고 피부 관리가 필요한 분',
        '정기적인 피부 관리를 원하는 분',
      ],
      cautions: [
        '민감성 피부는 상담 후 프로그램 조정 가능',
        '급성 피부 트러블이 있는 경우 상담 필요',
        '시술 후 즉시 화장 가능',
      ],
      faqs: [
        { q: '물톡스와 플라필의 차이점은 무엇인가요?', shortA: '물톡스는 수분 공급, 플라필은 피부 재생에 초점을 맞춥니다.', a: '물톡스는 깊은 수분 공급에 초점을 맞춘 프로그램으로 건조한 피부에 적합합니다. 플라필은 피부 재생과 탄력 회복에 중점을 둔 프로그램으로 탄력 저하가 고민인 분께 추천드립니다.' },
        { q: '얼마나 자주 받는 것이 좋은가요?', shortA: '2-4주 간격으로 정기 관리를 권장합니다.', a: '피부 상태에 따라 다르지만, 2-4주 간격으로 정기적인 관리를 받으시면 효과가 극대화됩니다. 상담을 통해 개인별 맞춤 주기를 안내해 드립니다.' },
        { q: '시술 후 바로 화장해도 되나요?', shortA: '네, 즉시 화장 가능합니다.', a: '네, 스킨케어 후에는 별도의 다운타임 없이 바로 화장하실 수 있습니다. 오히려 화장이 더 잘 받는 것을 느끼실 수 있습니다.' },
      ],
      relatedTreatments: ['skinbooster', 'botox', 'filler'],
    },
  },
  // 레이저 시술
  laser: {
    clarity: {
      id: 'clarity',
      category: 'laser',
      name: '클래리티 II',
      nameEn: 'Clarity II',
      tagline: '듀얼 파장 레이저의 정점 – 색소, 혈관, 제모까지 올인원',
      shortDesc: '755nm + 1064nm 듀얼 파장으로 색소, 혈관, 제모까지 멀티 솔루션',
      heroImage: '/images/treatments/clarity-hero.jpg',
      description: '클래리티 II는 루트로닉의 프리미엄 듀얼 파장 레이저로, 755nm 알렉산드라이트와 1064nm Nd:YAG 두 가지 파장을 탑재했습니다. IntelliTrak 기술로 피부 상태를 실시간 분석하여 최적의 에너지를 정밀하게 전달합니다. 한 대의 장비로 색소 치료, 혈관 치료, 제모까지 모든 피부 고민을 해결할 수 있는 올인원 장비입니다.',
      benefits: [
        { title: '듀얼 파장', desc: '755nm(색소/제모) + 1064nm(혈관/깊은색소) 멀티 솔루션' },
        { title: 'IntelliTrak 기술', desc: '자동 18% 오버랩으로 균일한 에너지 전달, 놓치는 부분 최소화' },
        { title: '모든 피부 타입', desc: '피부 타입 I-VI까지 안전한 시술 가능' },
        { title: '크라이오겐 쿨링', desc: '젤 도포 불필요, 시술 중 피부 보호' },
      ],
      wavelengthInfo: {
        '755nm': {
          name: '알렉산드라이트',
          target: 'Fitzpatrick I-III (밝은 피부)',
          features: ['멜라닌 흡수율 높음', '얕은 색소 정밀 타겟', '제모 골드 스탠다드'],
          indications: ['색소 병변', '레이저 제모', '기미/잡티'],
        },
        '1064nm': {
          name: 'Nd:YAG',
          target: 'Fitzpatrick IV-VI (어두운 피부)',
          features: ['깊은 침투력', '표피 멜라닌 우회', '혈관 선택적 작용'],
          indications: ['혈관 병변', '홍조', '깊은 색소', '피부톤 개선'],
        },
      },
      process: [
        { step: 1, title: '상담', desc: '피부 타입 분석 및 맞춤 시술 계획 수립' },
        { step: 2, title: '세안', desc: '메이크업 제거 및 피부 정돈' },
        { step: 3, title: '시술', desc: 'IntelliTrak으로 정밀 레이저 조사' },
        { step: 4, title: '쿨링', desc: '크라이오겐 쿨링으로 즉각 진정' },
        { step: 5, title: '마무리', desc: '자외선 차단 및 관리 안내' },
      ],
      duration: '15-30분',
      anesthesia: '무마취 (크라이오겐 쿨링으로 통증 최소화)',
      recovery: '3-5일 (색소 부위 미세 딱지 가능)',
      results: '2-4주 간격 3-5회 시술 권장',
      targetAreas: ['얼굴 전체', '색소 부위', '혈관 부위', '제모 부위'],
      idealFor: [
        '기미, 잡티, 주근깨가 고민인 분',
        '홍조, 모세혈관 확장이 있는 분',
        '전체적인 피부톤 개선을 원하는 분',
        '프리미엄 레이저 제모를 원하는 분',
      ],
      cautions: [
        '시술 후 2-4주간 자외선 차단 필수 (SPF 50+)',
        '일시적 색소 침착 가능 (2-4주 내 개선)',
        '시술 간격 2-4주 유지',
        '임산부, 수유부는 시술 불가',
      ],
      faqs: [
        { q: '클래리티 II의 IntelliTrak 기술이란?', a: 'IntelliTrak은 롤러 방식으로 피부 위를 미끄러지듯 움직이며 자동으로 18% 오버랩을 유지합니다. 이로 인해 놓치는 부분 없이 균일한 에너지를 전달하고, 과치료를 방지합니다.' },
        { q: '755nm와 1064nm 중 어떤 파장이 좋은가요?', a: '피부 타입과 치료 목적에 따라 다릅니다. 밝은 피부(I-III)의 색소나 제모는 755nm, 어두운 피부(IV-VI)나 혈관 치료는 1064nm가 적합합니다. 상담을 통해 최적의 파장을 선택합니다.' },
        { q: '몇 회 시술이 필요한가요?', a: '색소 깊이와 종류에 따라 다르지만, 보통 2-4주 간격으로 3-5회 시술을 권장합니다. 제모의 경우 6-8회 시술이 필요합니다.' },
      ],
      relatedTreatments: ['lucas', 'toning', 'ulblanc'],
    },
    lucas: {
      id: 'lucas',
      category: 'laser',
      name: '루카스 레이저',
      nameEn: 'Lucas Laser',
      tagline: '피코세컨드 기술로 난치성 색소까지 – 1000배 빠른 펄스',
      shortDesc: '피코초(10⁻¹²) 초단펄스로 색소를 미세하게 분해, 문신 제거에도 탁월',
      heroImage: '/images/treatments/lucas-hero.jpg',
      description: '루카스 레이저는 피코세컨드(10⁻¹²초) 기술을 적용한 최신 레이저입니다. 기존 나노초(10⁻⁹초) 레이저보다 1000배 빠른 펄스로 색소를 미세하게 분해하여, 주변 조직 손상을 최소화하면서 효과적인 치료가 가능합니다. 특히 난치성 기미, 문신 제거에 탁월한 효과를 보입니다.',
      benefits: [
        { title: '피코세컨드 펄스', desc: '1조분의 1초(10⁻¹²) 초단펄스로 나노초 대비 1000배 빠름' },
        { title: '미세 색소 분해', desc: '색소를 나노 레이저보다 더 미세하게 분해하여 빠른 배출' },
        { title: '주변 조직 보호', desc: '열 손상 최소화로 부작용 감소, 빠른 회복' },
        { title: '난치성 색소 효과', desc: '기존 토닝으로 개선 안 된 기미도 효과적 치료' },
      ],
      picoVsNano: {
        pico: {
          name: '피코초 (10⁻¹²)',
          speed: '1조분의 1초',
          particleSize: '미세',
          tissueDamage: '최소',
          heatDamage: '거의 없음',
          sessions: '적음',
          downtime: '짧음',
        },
        nano: {
          name: '나노초 (10⁻⁹)',
          speed: '10억분의 1초',
          particleSize: '상대적 큼',
          tissueDamage: '있음',
          heatDamage: '있음',
          sessions: '많음',
          downtime: '상대적 김',
        },
      },
      process: [
        { step: 1, title: '상담', desc: '색소 타입 분석 및 치료 계획 수립' },
        { step: 2, title: '세안', desc: '메이크업 제거 및 피부 정돈' },
        { step: 3, title: '마취', desc: '필요시 마취 크림 도포 (20-30분)' },
        { step: 4, title: '시술', desc: '피코세컨드 레이저 정밀 조사' },
        { step: 5, title: '마무리', desc: '진정 케어 및 자외선 차단 안내' },
      ],
      duration: '20-40분',
      anesthesia: '마취 크림 (선택)',
      recovery: '3-7일 (미세 딱지 가능)',
      results: '2-4주 간격 3-5회 시술 권장',
      targetAreas: ['기미 부위', '잡티', '오타모반', '문신', '흉터'],
      idealFor: [
        '난치성 기미로 고민인 분 (토닝으로 개선 안 된 경우)',
        '잡티, 검버섯 제거를 원하는 분',
        '문신 제거를 원하는 분 (컬러 문신 포함)',
        '모공, 흉터 개선을 원하는 분',
      ],
      cautions: [
        '시술 후 2-4주간 자외선 차단 필수',
        '일시적 색소 침착 가능 (1-2주 내 개선)',
        '시술 부위 미세 딱지 3-7일간 유지',
        '임산부, 수유부는 시술 불가',
      ],
      faqs: [
        { q: '피코세컨드와 나노세컨드의 차이는?', a: '피코세컨드는 나노세컨드보다 1000배 빠른 펄스입니다. 이로 인해 색소를 더 미세하게 분해하고, 주변 조직 손상을 최소화하여 부작용이 적고 회복이 빠릅니다.' },
        { q: '기존 토닝과 어떤 차이가 있나요?', a: '토닝은 저출력으로 점진적 개선을 유도하고, 피코 레이저는 고에너지 초단펄스로 색소를 직접 분해합니다. 난치성 기미나 깊은 색소에는 피코 레이저가 더 효과적입니다.' },
        { q: '문신 제거에 몇 회가 필요한가요?', a: '문신 크기, 색상, 깊이에 따라 다르지만, 보통 5-10회 이상 시술이 필요합니다. 컬러 문신은 추가 시술이 필요할 수 있습니다.' },
      ],
      relatedTreatments: ['clarity', 'toning', 'ulblanc'],
    },
    toning: {
      id: 'toning',
      category: 'laser',
      name: '레이저 토닝',
      nameEn: 'Laser Toning',
      tagline: '저자극 반복 시술로 점진적 개선 – 일상 속 유지 관리',
      shortDesc: '1064nm 저출력 반복 조사로 피부톤 균일화, 다운타임 거의 없음',
      heroImage: '/images/treatments/toning-hero.jpg',
      description: '레이저 토닝은 1064nm Nd:YAG 큐스위치 레이저를 저출력으로 반복 조사하는 시술입니다. 멜라닌 색소를 점진적으로 분해하여 피부톤을 균일하게 개선하고, 모공 축소와 피부결 개선 효과도 있습니다. 다운타임이 거의 없어 일상생활과 병행하며 꾸준히 관리할 수 있습니다.',
      benefits: [
        { title: '저자극 시술', desc: '저출력 반복 조사로 부작용 최소화' },
        { title: '다운타임 없음', desc: '시술 직후 일상생활 즉시 가능' },
        { title: '누적 효과', desc: '반복 시술로 점진적이고 자연스러운 개선' },
        { title: '복합 효과', desc: '피부톤 개선 + 모공 축소 + 피부결 정리' },
      ],
      whyNdYag: {
        wavelength: '1064nm',
        reason: '멜라닌에 적당히 흡수되면서 깊이 침투하여 깊은 색소까지 작용',
        advantage: '저색소반/과색소반 부작용 확률 낮음',
        suitableFor: '광범위한 토닝 시술에 최적',
      },
      process: [
        { step: 1, title: '상담', desc: '피부 상태 분석 및 시술 계획' },
        { step: 2, title: '세안', desc: '메이크업 제거 및 피부 정돈' },
        { step: 3, title: '시술', desc: '1064nm 저출력 레이저 전체 조사 (5-15분)' },
        { step: 4, title: '마무리', desc: '보습 및 자외선 차단' },
      ],
      duration: '5-15분',
      anesthesia: '무마취',
      recovery: '없음 (즉시 일상 복귀)',
      results: '10회 이상 누적 시술 권장, 3-4회부터 효과 체감',
      targetAreas: ['얼굴 전체', '기미 부위', '모공 부위'],
      idealFor: [
        '기미, 칙칙한 피부톤이 고민인 분',
        '다운타임 없이 시술받고 싶은 분',
        '꾸준한 유지 관리를 원하는 분',
        '피코 레이저 시술 후 유지 관리가 필요한 분',
      ],
      cautions: [
        '시술 후 자외선 차단 필수',
        '누적 효과를 위해 꾸준한 시술 필요 (10회+)',
        '야외 활동이 많은 시기에는 효과 감소 가능',
      ],
      faqs: [
        { q: '토닝은 왜 여러 번 받아야 하나요?', a: '토닝은 저출력으로 색소를 점진적으로 분해하는 방식입니다. 멜라노사이트를 자극하지 않으면서 안전하게 치료하기 위해 여러 번 시술이 필요합니다. 보통 10회 이상 누적 시술을 권장합니다.' },
        { q: '피코 레이저와 토닝 중 뭐가 좋나요?', a: '목적에 따라 다릅니다. 난치성 기미나 진한 색소는 피코 레이저로 집중 치료 후, 토닝으로 유지 관리하는 것이 효과적입니다. 경미한 색소나 유지 관리 목적이라면 토닝만으로도 충분합니다.' },
        { q: '시술 후 바로 화장해도 되나요?', a: '네, 토닝은 다운타임이 거의 없어 시술 직후 가벼운 화장이 가능합니다. 단, 자외선 차단제는 필수입니다.' },
      ],
      relatedTreatments: ['lucas', 'clarity', 'ulblanc'],
    },
    ulblanc: {
      id: 'ulblanc',
      category: 'laser',
      name: '울블랑',
      nameEn: 'Ulblanc',
      tagline: '멜라닌 타겟팅 화이트닝 – 전체 피부톤 개선',
      shortDesc: '저자극 화이트닝 레이저로 멜라닌에 선택적 작용, 피부 투명감 부여',
      heroImage: '/images/treatments/ulblanc-hero.jpg',
      description: '울블랑은 멜라닌 색소에 선택적으로 작용하는 저자극 화이트닝 레이저입니다. 전체적인 피부톤을 밝게 개선하고 피부에 투명감을 부여합니다. 다운타임이 거의 없어 일상생활과 병행하며 꾸준히 관리할 수 있으며, 토닝과 병행 시 시너지 효과가 있습니다.',
      benefits: [
        { title: '멜라닌 타겟팅', desc: '멜라닌 색소에 선택적으로 작용하여 효과적 개선' },
        { title: '전체 톤업', desc: '부분이 아닌 전체 피부톤을 균일하게 밝게' },
        { title: '저자극 시술', desc: '다운타임 거의 없음, 일상 복귀 즉시' },
        { title: '토닝 시너지', desc: '레이저 토닝과 병행 시 효과 극대화' },
      ],
      process: [
        { step: 1, title: '상담', desc: '피부 상태 분석 및 시술 계획' },
        { step: 2, title: '세안', desc: '메이크업 제거 및 피부 정돈' },
        { step: 3, title: '시술', desc: '울블랑 화이트닝 레이저 조사' },
        { step: 4, title: '마무리', desc: '보습 및 자외선 차단' },
      ],
      duration: '15-20분',
      anesthesia: '무마취',
      recovery: '없음 (즉시 일상 복귀)',
      results: '5-10회 누적 시술 권장',
      targetAreas: ['얼굴 전체'],
      idealFor: [
        '칙칙한 피부톤이 고민인 분',
        '전체적인 피부 화이트닝을 원하는 분',
        '다운타임 없이 시술받고 싶은 분',
        '토닝과 함께 복합 관리를 원하는 분',
      ],
      cautions: [
        '시술 후 자외선 차단 필수',
        '누적 효과를 위해 꾸준한 시술 필요',
        '야외 활동이 많은 시기에는 효과 감소 가능',
      ],
      faqs: [
        { q: '울블랑과 토닝의 차이는?', a: '둘 다 피부톤 개선 목적이지만, 토닝은 1064nm 파장으로 색소 분해에 초점을 맞추고, 울블랑은 멜라닌 타겟팅으로 전체 화이트닝에 초점을 맞춥니다. 병행 시 시너지 효과가 있습니다.' },
        { q: '효과는 언제부터 나타나나요?', a: '시술 직후에도 피부가 밝아진 느낌을 받을 수 있으며, 누적 시술에 따라 점진적으로 개선됩니다. 5-10회 시술을 권장합니다.' },
      ],
      relatedTreatments: ['toning', 'clarity', 'lucas'],
    },
  },
} as const;

// 의료정보 Q&A (음성검색/AEO 최적화 - shortAnswer + questionVariants 추가)
export const MEDICAL_QA = [
  {
    id: 'ulthera-vs-thermage',
    category: 'lifting',
    question: '울쎄라피 프라임과 써마지의 차이점은 무엇인가요?',
    // 음성검색용 구어체 질문 변형
    questionVariants: [
      '울쎄라랑 써마지 뭐가 달라요?',
      '울쎄라피 프라임 써마지 차이',
      '울쎄라 써마지 둘 다 해야 해요?',
    ],
    // 음성검색용 한 문장 정답 (30자 내외)
    shortAnswer: '울쎄라는 초음파로 깊은 층을, 써마지는 고주파로 탄력을 개선합니다.',
    answer: '울쎄라피 프라임은 HIFU(고강도 집속 초음파) 기술을 사용하여 피부 깊은 층인 SMAS까지 에너지를 전달합니다. 반면 써마지는 RF(고주파) 에너지를 사용하여 진피층의 콜라겐을 수축시키고 재생을 촉진합니다. 울쎄라피 프라임은 처진 피부의 리프팅에 효과적이고, 써마지는 전반적인 피부 탄력 개선에 효과적입니다. 두 시술을 병행하면 시너지 효과를 볼 수 있습니다.',
    relatedTreatments: ['ulthera', 'thermage'],
    tags: ['울쎄라피 프라임', '써마지', '리프팅', 'HIFU', '고주파'],
  },
  {
    id: 'lifting-pain',
    category: 'lifting',
    question: '리프팅 시술은 얼마나 아픈가요?',
    questionVariants: [
      '울쎄라 아파요?',
      '써마지 통증 어때요?',
      '리프팅 시술 많이 아프나요?',
    ],
    shortAnswer: '마취 크림 후 시술하며 대부분 견딜 만한 수준입니다.',
    answer: '리프팅 시술의 통증은 시술 종류와 개인차에 따라 다릅니다. 울쎄라피 프라임과 써마지 FLX 모두 시술 전 마취 크림을 30분 정도 바른 후 진행합니다. 특히 써마지 FLX는 진동 기술(Vibrating Tip)이 적용되어 통증이 크게 감소했으며, 대부분의 환자분들이 편안하게 시술을 받으실 수 있습니다. 통증에 민감하신 분은 추가적인 통증 조절이 가능하니 상담 시 말씀해주세요.',
    relatedTreatments: ['ulthera', 'thermage', 'shurink'],
    tags: ['리프팅', '통증', '마취'],
  },
  {
    id: 'lifting-frequency',
    category: 'lifting',
    question: '리프팅 시술은 얼마나 자주 받아야 하나요?',
    questionVariants: [
      '울쎄라 몇 번 맞아야 해요?',
      '리프팅 시술 주기가 어떻게 돼요?',
      '써마지 얼마나 자주 해야 해요?',
    ],
    shortAnswer: '울쎄라는 1-2년에 1회, 써마지는 6개월-1년에 1회 권장합니다.',
    answer: '울쎄라피 프라임은 1-2년에 1회, 써마지는 6개월-1년에 1회를 권장합니다. 슈링크나 인모드 등 유지 관리용 시술은 3-6개월 간격으로 받으실 수 있습니다. 피부 상태와 원하시는 효과에 따라 시술 주기가 달라질 수 있으므로, 정확한 주기는 상담을 통해 결정하시는 것이 좋습니다.',
    relatedTreatments: ['ulthera', 'thermage', 'shurink'],
    tags: ['리프팅', '시술주기', '유지관리'],
  },
  {
    id: 'lifting-duration',
    category: 'lifting',
    question: '리프팅 효과는 얼마나 지속되나요?',
    questionVariants: [
      '울쎄라 효과 얼마나 가요?',
      '써마지 효과 유지 기간이 어떻게 돼요?',
      '리프팅 한 번 하면 얼마나 가요?',
    ],
    shortAnswer: '울쎄라는 약 1-2년, 써마지는 6개월-1년 지속됩니다.',
    answer: '울쎄라피 프라임의 효과는 약 1년, 써마지는 6개월-1년 정도 지속됩니다. 다만 효과 지속 기간은 개인의 피부 상태, 나이, 생활 습관에 따라 달라질 수 있습니다. 정기적인 유지 관리 시술을 받으시면 효과를 더 오래 유지할 수 있습니다.',
    relatedTreatments: ['ulthera', 'thermage'],
    tags: ['리프팅', '효과지속', '유지기간'],
  },
  {
    id: 'botox-natural',
    category: 'antiaging',
    question: '보톡스 맞으면 표정이 부자연스러워지나요?',
    questionVariants: [
      '보톡스 맞으면 표정 이상해져요?',
      '보톡스 부작용 있어요?',
      '보톡스 자연스럽게 맞을 수 있어요?',
    ],
    shortAnswer: '적정 용량을 정확한 위치에 주입하면 자연스러운 표정이 유지됩니다.',
    answer: '적정 용량을 정확한 위치에 주입하면 자연스러운 표정을 유지하면서 주름만 개선됩니다. 부자연스러운 표정은 주로 과용량 사용이나 잘못된 주입 위치로 인해 발생합니다. 리브성형외과에서는 숙련된 전문의가 개인의 근육 특성에 맞춰 적정량을 시술하므로 자연스러운 결과를 기대하실 수 있습니다.',
    relatedTreatments: ['botox'],
    tags: ['보톡스', '표정', '자연스러움'],
  },
  {
    id: 'botox-duration',
    category: 'antiaging',
    question: '보톡스 효과는 얼마나 지속되나요?',
    questionVariants: [
      '보톡스 얼마나 가요?',
      '보톡스 효과 유지 기간',
      '보톡스 몇 개월 가요?',
    ],
    shortAnswer: '보통 3-6개월 정도 지속되며, 정기 시술 시 더 오래 유지됩니다.',
    answer: '보톡스 효과는 개인차가 있지만 보통 3-6개월 정도 지속됩니다. 정기적으로 시술받으면 근육이 점차 약화되어 효과가 더 오래 지속되고, 시술 간격도 늘어날 수 있습니다. 첫 시술 후 2-3주 뒤 추가 터치업이 필요할 수 있으니, 경과를 확인하시는 것이 좋습니다.',
    relatedTreatments: ['botox'],
    tags: ['보톡스', '효과지속', '시술주기'],
  },
  {
    id: 'filler-dissolve',
    category: 'antiaging',
    question: '필러는 녹일 수 있나요?',
    questionVariants: [
      '필러 녹일 수 있어요?',
      '필러 잘못 맞으면 어떡해요?',
      '히알루론산 필러 제거 가능해요?',
    ],
    shortAnswer: '네, 히알루론산 필러는 녹이는 주사로 안전하게 제거 가능합니다.',
    answer: '네, 히알루론산 필러는 히알루로니다제(녹이는 주사)로 녹일 수 있습니다. 시술 결과가 마음에 들지 않거나 부작용이 발생했을 때 안전하게 제거할 수 있습니다. 이것이 히알루론산 필러의 큰 장점 중 하나입니다. 다만 비가역적 필러(예: 아테콜)는 녹일 수 없으므로, 필러 선택 시 이 점을 고려하셔야 합니다.',
    relatedTreatments: ['filler'],
    tags: ['필러', '히알루론산', '녹이는주사'],
  },
  {
    id: 'filler-lumps',
    category: 'antiaging',
    question: '필러가 뭉치거나 울퉁불퉁해질 수 있나요?',
    questionVariants: [
      '필러 뭉칠 수 있어요?',
      '필러 울퉁불퉁 부작용',
      '필러 부작용 걱정돼요',
    ],
    shortAnswer: '숙련된 의료진이 정품을 사용하면 거의 발생하지 않습니다.',
    answer: '정품 필러를 적정량 사용하고, 해부학적 지식을 갖춘 숙련된 의료진이 시술하면 이런 문제가 거의 발생하지 않습니다. 간혹 발생하는 울퉁불퉁함은 대부분 마사지로 해결되며, 필요시 히알루로니다제로 조절할 수 있습니다. 시술 후 불편하신 점이 있으면 바로 상담해주세요.',
    relatedTreatments: ['filler'],
    tags: ['필러', '부작용', '뭉침'],
  },
  {
    id: 'skinbooster-frequency',
    category: 'antiaging',
    question: '스킨부스터는 몇 회 맞아야 효과가 있나요?',
    questionVariants: [
      '스킨부스터 몇 번 맞아야 해요?',
      '물광주사 몇 회 추천해요?',
      '스킨부스터 한 번만 맞아도 돼요?',
    ],
    shortAnswer: '기본 3-4회 코스 후 2-3개월마다 유지 시술을 권장합니다.',
    answer: '스킨부스터는 2-4주 간격으로 3-4회 시술을 기본 코스로 권장합니다. 1회 시술 후에도 수분감 개선을 느낄 수 있지만, 최적의 효과를 위해서는 코스 시술이 필요합니다. 이후에는 2-3개월마다 유지 시술을 받으시면 좋습니다.',
    relatedTreatments: ['skinbooster'],
    tags: ['스킨부스터', '물광주사', '시술횟수'],
  },
  {
    id: 'laser-sun',
    category: 'laser',
    question: '레이저 시술 후 햇빛을 피해야 하나요?',
    questionVariants: [
      '레이저 후 햇빛 노출 괜찮아요?',
      '레이저 시술 후 자외선 차단',
      '레이저 후 야외 활동해도 돼요?',
    ],
    shortAnswer: '네, 최소 2-4주간 SPF 50+ 자외선 차단제가 필수입니다.',
    answer: '네, 레이저 시술 후에는 자외선 차단이 매우 중요합니다. 시술 후 피부가 민감해져 자외선에 의한 색소침착 위험이 높아집니다. 최소 2-4주간은 자외선 차단제(SPF 50+)를 꼼꼼히 바르고, 모자나 양산을 사용하시는 것이 좋습니다. 야외 활동이 많은 시기에는 레이저 시술을 피하시는 것이 좋습니다.',
    relatedTreatments: ['clarity'],
    tags: ['레이저', '자외선', '색소침착'],
  },
  {
    id: 'laser-downtime',
    category: 'laser',
    question: '레이저 시술 후 다운타임은 어느 정도인가요?',
    questionVariants: [
      '레이저 후 회복 기간이 어떻게 돼요?',
      '레이저 토닝 다운타임 있어요?',
      '레이저 후 바로 일상생활 가능해요?',
    ],
    shortAnswer: '토닝은 다운타임 없고, 색소 레이저는 3-5일 정도입니다.',
    answer: '레이저 종류에 따라 다릅니다. 레이저 토닝의 경우 거의 다운타임이 없어 바로 일상생활이 가능합니다. 클래리티 II 레이저로 표피 색소를 치료한 경우 3-5일 정도 색소가 진해지거나 얇은 딱지가 생겼다가 자연스럽게 떨어집니다.',
    relatedTreatments: ['clarity'],
    tags: ['레이저', '다운타임', '회복기간'],
  },
  {
    id: 'thread-duration',
    category: 'lifting',
    question: '실리프팅 효과는 얼마나 유지되나요?',
    questionVariants: [
      '실리프팅 얼마나 가요?',
      'PDO 실 효과 유지 기간',
      '실리프팅 한 번 하면 얼마나 가요?',
    ],
    shortAnswer: 'PDO 실은 6-8개월, PCL 실은 12-18개월 효과가 유지됩니다.',
    answer: '실 종류에 따라 다릅니다. PDO(녹는 실)는 6-8개월, PLLA나 PCL 실은 12-18개월 정도 효과가 유지됩니다. 실이 녹으면서 콜라겐 재생을 촉진하므로, 실이 완전히 녹은 후에도 일정 기간 효과가 유지됩니다. 정기적인 유지 시술을 통해 효과를 지속시킬 수 있습니다.',
    relatedTreatments: ['thread'],
    tags: ['실리프팅', '효과지속', 'PDO'],
  },
  {
    id: 'consultation-fee',
    category: 'general',
    question: '상담만 받아도 되나요? 비용이 있나요?',
    questionVariants: [
      '상담만 해도 돼요?',
      '상담비 얼마예요?',
      '시술 안 해도 상담 가능해요?',
    ],
    shortAnswer: '네, 상담비 1만원이며 당일 시술 시 전액 차감됩니다.',
    answer: '네, 상담만 받으셔도 됩니다. 1:1 전문 상담비용은 1만원이며, 당일 시술 진행 시 시술 금액에서 전액 차감됩니다. 성형외과 전문의가 직접 피부 상태를 진단하고 최적의 시술 플랜을 제안해 드립니다. 충분히 고민하신 후 결정하셔도 괜찮습니다.',
    relatedTreatments: [],
    tags: ['상담', '상담비', '예약'],
  },
  {
    id: 'payment-installment',
    category: 'general',
    question: '시술 비용 할부가 가능한가요?',
    questionVariants: [
      '할부 되나요?',
      '카드 결제 가능해요?',
      '무이자 할부 되나요?',
    ],
    shortAnswer: '네, 카드 할부 가능하며 무이자 혜택은 카드사별로 상이합니다.',
    answer: '네, 카드 할부 결제가 가능합니다. 무이자 할부 혜택은 카드사와 결제 금액에 따라 다를 수 있으니, 상담 시 문의해주세요. 또한 시술별로 다양한 프로모션과 패키지 할인도 있으니 확인해보시기 바랍니다.',
    relatedTreatments: [],
    tags: ['비용', '할부', '결제'],
  },
  {
    id: 'pregnant-treatment',
    category: 'general',
    question: '임신 중이나 수유 중에도 시술이 가능한가요?',
    questionVariants: [
      '임산부 시술 가능해요?',
      '수유 중 보톡스 맞아도 돼요?',
      '임신 중 리프팅 가능해요?',
    ],
    shortAnswer: '아니요, 임신/수유 중에는 대부분의 미용 시술이 권장되지 않습니다.',
    answer: '임신 중이나 수유 중에는 대부분의 미용 시술이 권장되지 않습니다. 보톡스, 필러, 리프팅 시술 모두 태아나 모유에 미치는 영향에 대한 안전성이 충분히 검증되지 않았기 때문입니다. 임신과 수유를 마친 후에 시술받으시는 것을 권장합니다.',
    relatedTreatments: [],
    tags: ['임신', '수유', '금기사항'],
  },
  // 추가 음성검색 최적화 Q&A
  {
    id: 'liv-specialty',
    category: 'general',
    question: '리브성형외과에서 가장 잘하는 시술이 뭔가요?',
    questionVariants: [
      '리브성형외과 대표 시술이 뭐예요?',
      '신사역 리프팅 잘하는 곳 어디예요?',
      '리브 클리닉 뭐가 유명해요?',
    ],
    shortAnswer: '울쎄라피 프라임과 써마지 FLX 인증 병원으로 비수술 리프팅 전문입니다.',
    answer: '리브성형외과는 울쎄라피 프라임 정품 인증과 써마지 FLX 파트너 병원으로, 비수술 리프팅 시술을 전문으로 합니다. 성형외과 전문의가 SCI 논문 4편의 학술 경험을 바탕으로 환자 개개인에게 맞춤 시술을 제공합니다. 신사역 4번 출구 도보 1분 거리에 위치해 있습니다.',
    relatedTreatments: ['ulthera', 'thermage'],
    tags: ['리브성형외과', '전문분야', '울쎄라', '써마지'],
  },
  {
    id: 'first-visit',
    category: 'general',
    question: '처음 방문하면 어떻게 진행되나요?',
    questionVariants: [
      '첫 방문 절차가 어떻게 돼요?',
      '예약 없이 가도 돼요?',
      '상담 예약 어떻게 해요?',
    ],
    shortAnswer: '전화나 카카오톡으로 예약 후 방문하시면 전문의 1:1 상담을 받으실 수 있습니다.',
    answer: '전화(02-797-2773) 또는 카카오톡으로 상담 예약을 해주시면 됩니다. 방문 시 성형외과 전문의가 직접 피부 상태를 진단하고, 환자분의 고민과 원하시는 결과에 맞는 최적의 시술 플랜을 제안해 드립니다. 상담 후 충분히 고민하신 뒤 시술 여부를 결정하셔도 됩니다.',
    relatedTreatments: [],
    tags: ['첫방문', '예약', '상담절차'],
  },
] as const;

// 레이저 장비 정보
export const LASER_EQUIPMENT = {
  clarity: {
    name: 'Clarity II',
    nameKo: '클래리티 II',
    manufacturer: 'Lutronic',
    wavelength: '755nm + 1064nm',
    feature: '듀얼 파장 + IntelliTrak 실시간 추적 기술',
    advantage: '색소, 혈관, 제모까지 올인원 솔루션',
    targets: ['기미', '색소', '홍조', '혈관', '제모', '피부톤'],
    sessions: '3-10회 (적응증에 따라 상이)',
    downtime: '3-5일',
  },
  lucas: {
    name: 'Lucas',
    nameKo: '루카스',
    manufacturer: 'Lutronic',
    wavelength: '532nm / 755nm / 1064nm',
    feature: '피코초 펄스 (450ps) - 나노초 대비 1000배 빠름',
    advantage: '광음향 효과로 색소 미세 분쇄, 흉터 위험 최소화',
    targets: ['기미', '색소', '잡티', '검버섯', '문신 제거'],
    sessions: '3-10회 (적응증에 따라 상이)',
    downtime: '3-7일',
  },
  toning: {
    name: 'Laser Toning',
    nameKo: '레이저 토닝',
    manufacturer: 'Lutronic (Spectra XT)',
    wavelength: '1064nm Nd:YAG',
    feature: '저출력 반복 조사 (MLA 모드)',
    advantage: '다운타임 제로, 점진적 피부톤 개선',
    targets: ['피부톤', '모공', '피부결', '칙칙함', '색소'],
    sessions: '5-10회',
    downtime: '없음',
  },
  ulblanc: {
    name: 'Ulblanc',
    nameKo: '울블랑',
    manufacturer: 'Ulthera',
    wavelength: '전용 화이트닝 파장',
    feature: '멜라닌 선택적 타겟팅',
    advantage: '자극 없이 피부 미백 및 투명감 개선',
    targets: ['피부 미백', '톤 균일화', '투명감', '칙칙함'],
    sessions: '5-10회',
    downtime: '없음',
  },
} as const;

// 레이저 센터 피부 고민별 카테고리
export const LASER_CATEGORIES = [
  {
    id: 'pigmentation',
    name: '기미/색소 개선',
    nameEn: 'Pigmentation & Melasma',
    href: '/laser/pigmentation',
    icon: 'sun',
    color: '#F59E0B',
    description: '난치성 기미도 리브의 3단계 시스템으로 효과적 개선',
    shortDesc: '기미, 잡티, 주근깨, 검버섯 등 색소 병변 치료',
    recommendedEquipment: ['lucas', 'clarity', 'toning', 'ulblanc'],
    featuredEquipment: 'lucas',
    treatmentProtocol: {
      mild: { treatment: '레이저 토닝', sessions: '5-10회', interval: '2주' },
      moderate: { treatment: '클래리티 II 755nm', sessions: '3-5회', interval: '3-4주' },
      severe: { treatment: '루카스 피코 + 토닝', sessions: '5-10회', interval: '2-4주' },
    },
  },
  {
    id: 'vascular',
    name: '홍조/혈관 치료',
    nameEn: 'Redness & Vascular',
    href: '/laser/vascular',
    icon: 'heart',
    color: '#EF4444',
    description: '듀얼 파장으로 홍조와 혈관 병변을 효과적으로 개선',
    shortDesc: '안면홍조, 모세혈관 확장, 주사비 치료',
    recommendedEquipment: ['clarity'],
    featuredEquipment: 'clarity',
    treatmentProtocol: {
      mild: { treatment: '클래리티 II 1064nm', sessions: '3-5회', interval: '3-4주' },
      moderate: { treatment: '클래리티 II 1064nm', sessions: '5-8회', interval: '3-4주' },
      severe: { treatment: '클래리티 II 집중 치료', sessions: '8-10회', interval: '2-3주' },
    },
  },
  {
    id: 'skintone',
    name: '피부톤 균일화',
    nameEn: 'Skin Tone Enhancement',
    href: '/laser/skintone',
    icon: 'sparkles',
    color: '#EC4899',
    description: '울블랑과 토닝의 시너지로 맑고 투명한 피부톤',
    shortDesc: '칙칙한 피부톤, 피부 투명감, 전체 화이트닝',
    recommendedEquipment: ['ulblanc', 'toning', 'clarity'],
    featuredEquipment: 'ulblanc',
    treatmentProtocol: {
      mild: { treatment: '울블랑 + 토닝', sessions: '5회', interval: '2주' },
      moderate: { treatment: '울블랑 + 토닝 + 클래리티', sessions: '10회', interval: '2주' },
      severe: { treatment: '집중 복합 관리', sessions: '15회+', interval: '1-2주' },
    },
  },
  {
    id: 'hair-removal',
    name: '프리미엄 제모',
    nameEn: 'Premium Hair Removal',
    href: '/laser/hair-removal',
    icon: 'zap',
    color: '#10B981',
    description: '755nm 알렉산드라이트 - 제모의 골드 스탠다드',
    shortDesc: '얼굴, 겨드랑이, 팔다리, 비키니라인 영구 제모',
    recommendedEquipment: ['clarity'],
    featuredEquipment: 'clarity',
    treatmentProtocol: {
      face: { treatment: '클래리티 II 755nm', sessions: '6-8회', interval: '4-6주' },
      body: { treatment: '클래리티 II 755nm', sessions: '6-10회', interval: '6-8주' },
      bikini: { treatment: '클래리티 II 755nm/1064nm', sessions: '8-10회', interval: '6-8주' },
    },
  },
  {
    id: 'tattoo',
    name: '문신 제거',
    nameEn: 'Tattoo Removal',
    href: '/laser/tattoo',
    icon: 'eraser',
    color: '#8B5CF6',
    description: '피코세컨드 기술로 깨끗한 문신 제거',
    shortDesc: '흑색, 컬러, 아이라인, 눈썹 문신 제거',
    recommendedEquipment: ['lucas'],
    featuredEquipment: 'lucas',
    treatmentProtocol: {
      black: { treatment: '루카스 피코', sessions: '5-8회', interval: '6-8주' },
      color: { treatment: '루카스 피코 + 클래리티', sessions: '8-12회', interval: '6-8주' },
      cosmetic: { treatment: '루카스 피코', sessions: '3-5회', interval: '4-6주' },
    },
  },
] as const;

// 메인 네비게이션
export const MAIN_NAV = [
  {
    label: '리브 소개',
    href: '/about',
    children: [
      { label: '리브 브랜드', href: '/about' },
      { label: '의료진 소개', href: '/about/staff' },
      { label: '보유 장비', href: '/about/equipment' },
      { label: '오시는 길', href: '/about/location' },
    ],
  },
  {
    label: '시그니처',
    href: '/signature',
  },
  {
    label: '리프팅',
    href: '/lifting',
    children: [
      { label: '울쎄라피 프라임', href: '/lifting/ulthera' },
      { label: '써마지 FLX', href: '/lifting/thermage' },
      { label: '덴서티', href: '/lifting/density' },
      { label: '인모드', href: '/lifting/inmode' },
      { label: '슈링크', href: '/lifting/shurink' },
      { label: '압토스 바이오 리프팅', href: '/lifting/aptos' },
      { label: '실리프팅', href: '/lifting/thread' },
    ],
  },
  {
    label: '안티에이징',
    href: '/antiaging',
    children: [
      { label: '보톡스', href: '/antiaging/botox' },
      { label: '필러', href: '/antiaging/filler' },
      { label: '스킨부스터', href: '/antiaging/skinbooster' },
      { label: '스킨케어', href: '/antiaging/skincare' },
    ],
  },
  {
    label: '레이저',
    href: '/laser',
    children: [
      { label: '기미/색소 개선', href: '/laser/pigmentation' },
      { label: '홍조/혈관 치료', href: '/laser/vascular' },
      { label: '피부톤 균일화', href: '/laser/skintone' },
      { label: '프리미엄 제모', href: '/laser/hair-removal' },
      { label: '문신 제거', href: '/laser/tattoo' },
    ],
  },
  {
    label: '의료정보',
    href: '/medical',
  },
  {
    label: '이벤트',
    href: '/events',
  },
] as const;

// ============================================
// 이벤트 (Events)
// ============================================

export type EventCategory = 'lifting' | 'antiaging' | 'laser' | 'skincare' | 'all';
export type EventStatus = 'active' | 'ended';

export interface EventItem {
  id: string;
  sortOrder: number; // 레거시 사이트 노출 순서 기준 정렬
  title: {
    ko: string;
    en: string;
    ja: string;
    zh: string;
  };
  description: {
    ko: string;
    en: string;
    ja: string;
    zh: string;
  };
  posterImage: string;
  thumbnailImage?: string;
  galleryImages?: string[]; // 상세 페이지에서 표시할 이미지 갤러리
  imagePosition?: string; // CSS object-position (기본값: 'center top') — hero 이미지 focal point
  startDate: string; // ISO 8601 format (YYYY-MM-DD)
  endDate: string;
  category: EventCategory;
  featured?: boolean;
  relatedTreatments?: string[]; // href paths like '/lifting/ulthera'
}

// 이벤트 상태를 날짜 기반으로 계산하는 헬퍼 함수
export function getEventStatus(event: EventItem): EventStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(event.endDate);
  endDate.setHours(23, 59, 59, 999);
  return endDate >= today ? 'active' : 'ended';
}

// 이벤트 데이터 (sortOrder: 레거시 사이트 노출 순서 기준)
// 이미지 경로: /images/event/{이벤트폴더}/{번호}.{확장자}
//   - aptos/        → 압토스 실리프팅 (001~013.jpg)
//   - restart-2026/ → 2026 Re:Start 1월 이벤트 (001~007.jpeg)
//   - ulthera-prime/→ 울쎄라피 프라임 이벤트 (001~016.jpg)
//   - thermage-flx/ → 써마지 FLX (001~007.jpg)
//   - goodbye-ulthera/ → 굿바이 울쎄라 (001~010.jpg)
//   - density/      → 덴서티 이벤트 (001.png)
export const EVENTS: EventItem[] = [
  {
    id: 'aptos-thread-lifting',
    sortOrder: 1,
    title: {
      ko: '압토스 실리프팅',
      en: 'APTOS Thread Lifting',
      ja: 'APTOS スレッドリフト',
      zh: 'APTOS 线雕',
    },
    description: {
      ko: '부드러운 변화, APTOS 바이오 리프팅으로 자연스러운 리프팅 효과를 경험하세요.',
      en: 'Experience natural lifting effects with APTOS Bio Lifting thread lifting.',
      ja: '自然なリフティング効果をAPTOS Bio Liftingスレッドリフトで体験してください。',
      zh: '通过APTOS Bio Lifting线雕体验自然提升效果。',
    },
    posterImage: '/images/event/aptos/001.jpg',
    thumbnailImage: '/images/event/aptos/001.jpg',
    imagePosition: 'center 20%', // 모델 얼굴+상체 중심
    galleryImages: [
      '/images/event/aptos/001.jpg',
      '/images/event/aptos/002.jpg',
      '/images/event/aptos/003.jpg',
      '/images/event/aptos/004.jpg',
      '/images/event/aptos/005.jpg',
      '/images/event/aptos/006.jpg',
      '/images/event/aptos/007.jpg',
      '/images/event/aptos/008.jpg',
      '/images/event/aptos/009.jpg',
      '/images/event/aptos/010.jpg',
      '/images/event/aptos/011.jpg',
      '/images/event/aptos/012.jpg',
      '/images/event/aptos/013.jpg',
    ],
    startDate: '2025-01-01',
    endDate: '2099-12-31', // 기한없이 광고용
    category: 'lifting',
    featured: false,
    relatedTreatments: ['/lifting/thread'],
  },
  {
    id: '2026-restart-january',
    sortOrder: 2,
    title: {
      ko: '2026 Re:Start. 1월 이벤트',
      en: '2026 Re:Start. January Event',
      ja: '2026 Re:Start. 1月イベント',
      zh: '2026 Re:Start. 1月活动',
    },
    description: {
      ko: '새해를 맞아 리브성형외과에서 준비한 특별 패키지! 새로운 시작을 위한 특별 할인 혜택.',
      en: 'Special package from LIV Plastic Surgery for the new year! Special discounts for a fresh start.',
      ja: '新年を迎え、リブ形成外科で準備した特別パッケージ！新しいスタートのための特別割引。',
      zh: '迎接新年，LIV整形外科准备的特别套餐！新起点特别优惠。',
    },
    posterImage: '/images/event/restart-2026/001.jpeg',
    thumbnailImage: '/images/event/restart-2026/001.jpeg',
    imagePosition: 'center center', // 정방형에 가까운 이미지, 중앙 기준
    galleryImages: [
      '/images/event/restart-2026/001.jpeg',
      '/images/event/restart-2026/002.jpeg',
      '/images/event/restart-2026/003.jpeg',
      '/images/event/restart-2026/004.jpeg',
      '/images/event/restart-2026/005.jpeg',
      '/images/event/restart-2026/006.jpeg',
      '/images/event/restart-2026/007.jpeg',
    ],
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    category: 'all',
    featured: false,
    relatedTreatments: ['/lifting/ulthera', '/antiaging/skinbooster'],
  },
  {
    id: 'ulthera-prime-event',
    sortOrder: 3,
    title: {
      ko: '울쎄라피 프라임 이벤트',
      en: 'Ultherapy Prime Event',
      ja: 'ウルセラピープライム イベント',
      zh: '超声刀尊享活动',
    },
    description: {
      ko: 'FDA 승인 정품 울쎄라피 프라임! 전문의 직접 시술로 안전하고 확실한 리프팅 효과를 경험하세요.',
      en: 'FDA-approved genuine Ultherapy Prime! Experience safe and effective lifting with specialist treatment.',
      ja: 'FDA承認の正規ウルセラピープライム！専門医による直接施術で安全で確実なリフティング効果を体験。',
      zh: 'FDA认证正品超声刀尊享！专业医师亲自操作，体验安全有效的提升效果。',
    },
    posterImage: '/images/event/ulthera-prime/001.jpg',
    thumbnailImage: '/images/event/ulthera-prime/001.jpg',
    imagePosition: 'center 15%', // 모델 얼굴 상단 포커스
    galleryImages: [
      '/images/event/ulthera-prime/001.jpg',
      '/images/event/ulthera-prime/002.jpg',
      '/images/event/ulthera-prime/003.jpg',
      '/images/event/ulthera-prime/004.jpg',
      '/images/event/ulthera-prime/005.jpg',
      '/images/event/ulthera-prime/006.jpg',
      '/images/event/ulthera-prime/007.jpg',
      '/images/event/ulthera-prime/008.jpg',
      '/images/event/ulthera-prime/009.jpg',
      '/images/event/ulthera-prime/010.jpg',
      '/images/event/ulthera-prime/011.jpg',
      '/images/event/ulthera-prime/012.jpg',
      '/images/event/ulthera-prime/013.jpg',
      '/images/event/ulthera-prime/014.jpg',
      '/images/event/ulthera-prime/015.jpg',
      '/images/event/ulthera-prime/016.jpg',
    ],
    startDate: '2025-08-01',
    endDate: '2025-11-30',
    category: 'lifting',
    featured: false,
    relatedTreatments: ['/lifting/ulthera'],
  },
  {
    id: 'thermage-flx-event',
    sortOrder: 4,
    title: {
      ko: '써마지 FLX',
      en: 'Thermage FLX',
      ja: 'サーマジ FLX',
      zh: '热玛吉 FLX',
    },
    description: {
      ko: '피부 탄력 관리의 정석! 써마지 FLX로 처진 피부를 탄탄하게. 눈가, 턱선 집중 케어.',
      en: 'The gold standard for skin elasticity! Firm sagging skin with Thermage FLX. Eye and jawline intensive care.',
      ja: '肌弾力ケアの定番！サーマジFLXでたるんだ肌を引き締め。目元・あごライン集中ケア。',
      zh: '皮肤弹力护理经典！用热玛吉FLX紧致松弛皮肤。眼周、下颌线集中护理。',
    },
    posterImage: '/images/event/thermage-flx/001.jpg',
    thumbnailImage: '/images/event/thermage-flx/001.jpg',
    imagePosition: 'center 25%', // 모델 얼굴 중상단 포커스
    galleryImages: [
      '/images/event/thermage-flx/001.jpg',
      '/images/event/thermage-flx/002.jpg',
      '/images/event/thermage-flx/003.jpg',
      '/images/event/thermage-flx/004.jpg',
      '/images/event/thermage-flx/005.jpg',
      '/images/event/thermage-flx/006.jpg',
      '/images/event/thermage-flx/007.jpg',
    ],
    startDate: '2025-01-01',
    endDate: '2099-12-31', // 기한없이 광고용
    category: 'lifting',
    featured: false,
    relatedTreatments: ['/lifting/thermage'],
  },
  {
    id: 'goodbye-ulthera',
    sortOrder: 5,
    title: {
      ko: '굿바이 울쎄라 | 울쎄라 리프팅 마지막 특가 이벤트',
      en: 'Goodbye Ulthera | Final Special Ulthera Lifting Event',
      ja: 'グッバイ ウルセラ | ウルセラリフティング最終特価イベント',
      zh: '告别超声刀 | 超声刀提升最后特价活动',
    },
    description: {
      ko: '울쎄라 리프팅 마지막 특가! 놓치면 후회할 최저가 이벤트. 지금 바로 예약하세요.',
      en: 'Final special price for Ulthera lifting! Don\'t miss this lowest price event. Book now.',
      ja: 'ウルセラリフティング最終特価！見逃すと後悔する最低価格イベント。今すぐご予約を。',
      zh: '超声刀提升最后特价！错过将后悔的最低价活动。立即预约。',
    },
    posterImage: '/images/event/goodbye-ulthera/001.jpg',
    thumbnailImage: '/images/event/goodbye-ulthera/001.jpg',
    imagePosition: 'center 20%', // 모델 얼굴 중상단 포커스
    galleryImages: [
      '/images/event/goodbye-ulthera/001.jpg',
      '/images/event/goodbye-ulthera/002.jpg',
      '/images/event/goodbye-ulthera/003.jpg',
      '/images/event/goodbye-ulthera/004.jpg',
      '/images/event/goodbye-ulthera/005.jpg',
      '/images/event/goodbye-ulthera/006.jpg',
      '/images/event/goodbye-ulthera/007.jpg',
      '/images/event/goodbye-ulthera/008.jpg',
      '/images/event/goodbye-ulthera/009.jpg',
      '/images/event/goodbye-ulthera/010.jpg',
    ],
    startDate: '2025-08-01',
    endDate: '2025-11-30',
    category: 'lifting',
    featured: false,
    relatedTreatments: ['/lifting/ulthera'],
  },
  {
    id: 'density-event',
    sortOrder: 6,
    title: {
      ko: '덴서티 이벤트',
      en: 'Density Event',
      ja: 'デンシティ イベント',
      zh: '密度提升活动',
    },
    description: {
      ko: 'HIFU+RF 듀얼 리프팅! 덴서티로 탄력과 볼륨을 동시에 잡으세요. 특별 할인 진행 중.',
      en: 'HIFU+RF dual lifting! Achieve elasticity and volume with Density. Special discount available.',
      ja: 'HIFU+RFデュアルリフティング！デンシティで弾力とボリュームを同時に。特別割引実施中。',
      zh: 'HIFU+RF双重提升！用Density同时获得弹力和丰盈。特别折扣进行中。',
    },
    posterImage: '/images/event/density/001.png',
    thumbnailImage: '/images/event/density/001.png',
    imagePosition: 'center center', // 장비+가격 중앙 포커스
    galleryImages: [
      '/images/event/density/001.png',
    ],
    startDate: '2025-08-01',
    endDate: '2025-11-30',
    category: 'lifting',
    featured: false,
    relatedTreatments: ['/lifting/density'],
  },
];
