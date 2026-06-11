/**
 * Media & News 데이터 (SSOT)
 *
 * 언론보도(press)와 LIV 소식(news)을 단일 소스로 관리한다.
 * - 기사/소식 텍스트는 한국어 단일 소스(전 로케일 공유). UI 크롬만 i18n 처리.
 * - `category`는 필터 기준, `type`은 press/news 색·라벨 구분 전용으로 역할을 분리한다.
 */

export type MediaType = 'press' | 'news';
export type MediaCategory = 'press' | 'news' | 'academic_global' | 'visit';

export interface MediaNewsItem {
  id: string;
  type: MediaType;
  category: MediaCategory;
  badge: string;
  year: string;
  title: string;
  description: string;
  source?: string;
  link?: string;
  isExternal?: boolean;
  /** 카드 썸네일(로컬 경로). 없으면 images[0] → 폴백 순으로 해상 */
  image?: string;
  /** 카드 썸네일 초점(object-position, 예: '52% 14%'). 얼굴 검출 기반, 없으면 중앙 */
  imagePosition?: string;
  /** 내부 소식 상세 모달용 본문(문단 배열). 없으면 description으로 폴백 */
  body?: string[];
  /** 내부 소식 상세 모달용 이미지 경로 배열 */
  images?: string[];
  /** 모달 이미지 배치 — 'stack'이면 상하로 쌓아 원본 비율로 넓게 표시(가로형 사진용). 기본은 3:4 2열 그리드 */
  imageLayout?: 'grid' | 'stack';
}

/** 메인 노출용 대표 카드 — 일부는 항목 요약, f6은 집계형(셀럽 실명 미노출) */
export interface FeaturedMediaCard {
  id: string;
  type: MediaType;
  badge: string;
  year: string;
  title: string;
  description: string;
  link: string;
  isExternal: boolean;
  /** 카드 썸네일(로컬 경로). 없으면 폴백 플레이스홀더 */
  image?: string;
  /** 카드 썸네일 초점(object-position, 예: '52% 14%'). 얼굴 검출 기반, 없으면 중앙 */
  imagePosition?: string;
  /** 내부 소식 카드 클릭 시 /media에서 자동 오픈할 상세 항목 id (mediaNewsData.id 참조) */
  newsId?: string;
}

/** 연도 표시 순서(내림차순) — 그룹 렌더 기준 */
export const MEDIA_YEARS = ['2026', '2025', '2021'] as const;

/**
 * 상세 아카이브용 전체 데이터 (요청서 §5).
 * 내부 소식(isExternal:false)의 link는 모달 전용 표식이며 실제 네비게이션엔 쓰지 않는다.
 * 참고: id 7·8은 type:news + category:academic_global → "학술·글로벌"·"전체" 탭에만 노출.
 */
export const mediaNewsData: MediaNewsItem[] = [
  // ── 2026 ──
  {
    id: '16',
    type: 'press',
    category: 'press',
    badge: 'MEDIA INTERVIEW',
    year: '2026',
    title: '김수영 대표원장, APTOS Bio-Lifting 임상 인터뷰 참여',
    source: '메디컬 에스테틱',
    description:
      '김수영 리브성형외과 대표원장이 미용의학 전문 매체 『Medical Aesthetic』의 APTOS Bio-Lifting 인터뷰에 참여했습니다. 이번 기사는 APTOS 공식 트레이너로 인증받은 국내 의료진들이 실제 임상 현장에서 APTOS를 어떻게 활용하고 있는지 조명한 내용으로, 김수영 대표원장은 얼굴 구조와 조직 상태를 고려한 정밀한 리프팅 디자인, 자연스러운 변화, 환자 맞춤형 Bio-Lifting 접근의 중요성을 전했습니다.',
    body: [
      '김수영 리브성형외과 대표원장이 미용의학 전문 매체 『Medical Aesthetic』의 기사 「APTOS Bio-Lifting, 한국 임상 현장에서 어떻게 활용되고 있나」에 참여했습니다.',
      '이번 기사는 글로벌 실리프팅 브랜드 APTOS가 한국 시장에서 공식 트레이너 중심의 학술 활동을 확대하고 있는 흐름을 다루며, APTOS를 단순히 처진 조직을 당기는 실리프팅 제품이 아니라 얼굴 구조와 조직 상태에 따라 정교한 vector design이 필요한 Bio-Lifting 시술 플랫폼으로 소개했습니다.',
      '김수영 대표원장은 APTOS 공식 트레이너로서 제품별 구조와 적응증, 조직 상태에 따른 디자인, 시술 plane과 fixation point의 중요성을 강조했습니다. 특히 APTOS Bio-Lifting은 단순한 물리적 리프팅을 넘어, 환자 개개인의 노화 양상과 얼굴 구조를 고려해 필요한 부위에 조직 지지와 리프팅 방향을 설계하는 접근이라는 점에서 리브성형외과의 Slow Aging 철학과 맞닿아 있습니다.',
      '리브성형외과는 과한 변화보다 자연스럽고 세련된 개선을 지향합니다. 김수영 대표원장은 인터뷰를 통해 국내 환자들이 최근에는 과교정이나 부자연스러운 결과보다 얼굴선 정리, 중안면과 하안면의 안정적인 개선, 자연스러운 회복 과정을 중요하게 여긴다고 설명했습니다. 이는 리브성형외과가 추구하는 절제된 안티에이징, 정밀한 리프팅, 개인별 맞춤 진료 방향과도 일치합니다.',
      '또한 APTOS는 단독 리프팅 시술뿐 아니라 피부 탄력, 볼륨 저하, 얼굴선 변화 등 환자의 상태에 따라 에너지 기반 장비, 스킨부스터, 필러, 보툴리눔 톡신 등과 병합해 활용할 수 있는 시술로 소개되었습니다. 리브성형외과는 얼굴의 구조적 지지와 vector correction을 중심으로, 피부 질감과 볼륨, 표정근 조절을 함께 고려하는 통합적 안티에이징 접근을 이어가고 있습니다.',
      '이번 인터뷰는 김수영 대표원장이 APTOS 공식 트레이너로서 국내외 환자에게 보다 안전하고 재현성 있는 리프팅 시술을 제공하기 위해 학술적 교육과 임상 경험을 지속적으로 확장하고 있음을 보여주는 사례입니다.',
    ],
    images: [
      '/images/media-news/aptos-bio-lifting-1.jpg',
      '/images/media-news/aptos-bio-lifting-2.jpg',
    ],
    imageLayout: 'stack',
    imagePosition: '50% 11%',
    link: '/media',
    isExternal: false,
  },
  {
    id: '15',
    type: 'press',
    category: 'press',
    badge: 'MEDIA INTERVIEW',
    year: '2026',
    title: '김수영 대표원장, ‘메디컬 에스테틱’ 인터뷰 진행',
    source: '메디컬 에스테틱',
    description:
      '김수영 대표원장이 미용성형·의료기기 전문 매체 ‘메디컬 에스테틱’과 공식 인터뷰를 진행했습니다. 리브의 Slow Aging 철학과 글로벌 리프팅 브랜드 APTOS 시술, 부위별 맞춤형 알고리즘에 대한 의학적 지견을 전했습니다.',
    body: [
      '안녕하세요, 리브성형외과입니다.',
      '최근 리브성형외과의 김수영 대표원장님이 미용성형 및 의료기기 분야의 공신력 있는 언론사 ‘메디컬 에스테틱(Medical Aesthetic)’과 공식 인터뷰 및 기사 촬영을 진행하셨습니다.',
      '국내외 미용성형 시장의 트렌드를 선도하는 의료진을 주목하는 이번 인터뷰에서, 김수영 대표원장님은 리브성형외과가 지향하는 ‘Slow Aging(슬로우 에이징)’ 철학과 함께, 최근 메디컬 업계에서 가장 주목받고 있는 글로벌 리프팅 브랜드 ‘압토스(APTOS)’ 시술에 대한 심도 있는 의학적 지견을 전하셨습니다.',
      '특히 압토스 본사 공식 트레이너(International Trainer) 자격을 보유한 김 원장님은, 압토스 고유의 독보적인 기술력이 리브성형외과의 해부학적 층별 접근법인 ‘Site-specific algorithm(부위별 맞춤형 알고리즘)’과 만났을 때 발휘되는 시너지 효과를 심도 있게 설명하셨습니다. 인위적인 당김이 아닌, 조직의 처짐을 해부학적으로 정확히 재배치하여 본연의 입체감과 우아함을 이끌어내는 리브만의 고난도 실리프팅 노하우는 현장 취재팀의 큰 관심과 감탄을 자아냈습니다.',
      '글로벌 브랜드와 의료 미용 전문가들이 먼저 깊은 신뢰를 보내고 주목하는 리브성형외과. 앞으로도 세계적 수준으로 인정받은 정밀한 기술력과 끊임없는 학술 연구를 바탕으로, 국경을 넘어 리브를 찾아주시는 모든 분께 안전하고 차별화된 프리미엄 안티에이징의 기준을 제시하겠습니다.',
      '본 인터뷰의 자세한 전문은 추후 공식 기사 발행과 함께 다시 한번 공유해 드리겠습니다.',
      '감사합니다.',
    ],
    images: [
      '/images/media-news/medical-aesthetic-1.jpg',
      '/images/media-news/medical-aesthetic-2.jpg',
    ],
    imagePosition: '63% 57%',
    link: '/media',
    isExternal: false,
  },
  {
    id: '1',
    type: 'press',
    category: 'academic_global',
    badge: 'GLOBAL TRAINER',
    year: '2026',
    title: 'APTOS 공식 트레이너 인증',
    source: '하이뉴스',
    description:
      '김수영 리브성형외과 대표원장이 글로벌 실리프팅 브랜드 APTOS의 본사 공식 트레이너, International Trainer 자격을 획득했습니다. 임상 경험과 시술 숙련도를 바탕으로 리프팅 시술에 대한 전문성을 인정받은 사례입니다.',
    image: '/images/media-news/og/1.jpg',
    imagePosition: '25% 30%',
    link: 'https://www.hinews.co.kr/view.php?ud=202604081129541521dacadeb388_48',
    isExternal: true,
  },
  // ── 2025 ──
  {
    id: '2',
    type: 'press',
    category: 'press',
    badge: 'BROADCAST',
    year: '2025',
    title: 'SBS 좋은아침 방송 출연',
    source: 'SBS / Vegan News',
    description:
      '피부 탄력, 생활습관 노화, 콜라겐 재생에 대한 내용을 중심으로 안티에이징 관리에 대한 전문가 의견을 전했습니다.',
    image: '/images/media-news/og/2.png',
    imagePosition: '52% 14%',
    link: 'https://www.vegannews.co.kr/news/article.html?no=354684',
    isExternal: true,
  },
  {
    id: '3',
    type: 'press',
    category: 'academic_global',
    badge: 'GLOBAL PROGRAM',
    year: '2025',
    title: 'APTOS International Program 보도',
    source: '이슈메이커',
    description:
      'APTOS 본사 초청 한국 대표 의료진으로 소개되며, 리프팅 시술과 관련한 국제 프로그램에 참여했습니다.',
    image: '/images/media-news/aptos-procedure.jpg',
    imagePosition: '50% 45%',
    link: 'https://www.issuemaker.kr/news/articleView.html?idxno=51127',
    isExternal: true,
  },
  {
    id: '4',
    type: 'press',
    category: 'press',
    badge: 'COVER STORY',
    year: '2025',
    title: '이슈메이커 커버스토리',
    source: '이슈메이커',
    description:
      '슬로우에이징 철학, 재생 시술, 신사역 확장에 관한 리브성형외과의 브랜드 방향성과 진료 철학이 소개되었습니다.',
    image: '/images/media-news/director-portrait.jpg',
    imagePosition: '50% 0%',
    link: 'https://www.issuemaker.kr/news/articleView.html?idxno=50870',
    isExternal: true,
  },
  {
    id: '5',
    type: 'press',
    category: 'press',
    badge: 'ULTHERAPY PRIME',
    year: '2025',
    title: 'Ultherapy-Prime 도입 인터뷰',
    source: '헤모필리아 라이프',
    description:
      'Ultherapy-Prime 도입과 정밀한 SMAS 타깃 리프팅에 대한 리브성형외과의 접근을 소개했습니다.',
    image: '/images/media-news/og/5.png',
    imagePosition: '49% 30%',
    link: 'http://www.hemophilia.co.kr/news/articleView.html?idxno=32088',
    isExternal: true,
  },
  {
    id: '6',
    type: 'press',
    category: 'press',
    badge: 'REGENERATIVE CARE',
    year: '2025',
    title: 'GRIDA 메디컬 톤매칭 시스템 소개',
    source: '메디컬투데이',
    description:
      '52가지 색조와 FDA 승인 색소를 활용한 흉터 및 저색소 부위의 자연스러운 톤 재건 시술이 소개되었습니다.',
    image: '/images/media-news/director-consult.jpg',
    imagePosition: '50% 0%',
    link: 'https://mdtoday.co.kr/news/view/1065576613797810',
    isExternal: true,
  },
  {
    id: '7',
    type: 'news',
    category: 'academic_global',
    badge: 'ACADEMIC',
    year: '2025',
    title: '김수영 대표원장, Aesthetic Plastic Surgery Korea 초청 강연',
    source: 'LIV 소식',
    description:
      '김수영 대표원장이 대한미용성형외과학회 Aesthetic Plastic Surgery Korea에서 ‘Site-specific algorithm for facial rejuvenation’을 주제로 공식 초청 구연 발표를 진행했습니다. 얼굴의 해부학적 특성에 따른 정밀한 부위별 접근법과 리브만의 시술 알고리즘을 소개했습니다.',
    image: '/images/media-news/academic-lecture.jpg',
    imagePosition: '50% 72%',
    link: '/media',
    isExternal: false,
  },
  {
    id: '8',
    type: 'news',
    category: 'academic_global',
    badge: 'LIV NEWS',
    year: '2025',
    title: 'APTOS 글로벌 트레이너 공식 인증패 수여',
    source: 'LIV NEWS',
    description:
      '김수영 대표원장이 글로벌 실리프팅 브랜드 APTOS의 본사 공식 트레이너 인증패를 수여받았습니다. 이번 인증은 국내외 의료진 교육과 리프팅 시술 분야의 학술적 활동을 확장하는 계기가 되었습니다.',
    image: '/images/media-news/aptos-plaque.jpg',
    imagePosition: '50% 54%',
    link: '/media',
    isExternal: false,
  },
  {
    id: '9',
    type: 'news',
    category: 'visit',
    badge: 'LIV VISIT',
    year: '2025',
    title: '배우 심형탁 님, 리브성형외과 방문',
    source: 'LIV 소식',
    description:
      '배우 심형탁 님이 리브성형외과를 방문했습니다. 리브는 본연의 건강함과 자연스러운 아름다움을 추구하는 Slow Aging 케어 철학을 바탕으로 편안한 진료 경험을 제공합니다.',
    image: '/images/media-news/visit-shim.jpg',
    imagePosition: '50% 18%',
    link: '/media',
    isExternal: false,
  },
  {
    id: '10',
    type: 'news',
    category: 'visit',
    badge: 'LIV VISIT',
    year: '2025',
    title: '가수 배기성 님 & 쇼호스트 이은비 님 부부, 리브성형외과 방문',
    source: 'LIV 소식',
    description:
      '가수 배기성 님과 쇼호스트 이은비 님 부부가 리브성형외과를 방문했습니다. 리브는 꾸준한 관리와 자연스러운 안티에이징을 지향하는 맞춤형 케어를 제공합니다.',
    image: '/images/media-news/visit-bae-lee.jpg',
    imagePosition: '50% 43%',
    link: '/media',
    isExternal: false,
  },
  {
    id: '11',
    type: 'news',
    category: 'visit',
    badge: 'GLOBAL VISIT',
    year: '2025',
    title: '중국 유명 인플루언서 다수, 리브성형외과 방문',
    source: 'LIV 소식',
    description:
      '중국 유명 인플루언서들이 리브성형외과를 방문했습니다. 리브는 한국의 프리미엄 안티에이징 케어와 자연스러운 Slow Aging 철학을 바탕으로 글로벌 고객에게도 차별화된 진료 경험을 제공합니다.',
    image: '/images/media-news/visit-china-influencer.jpg',
    link: '/media',
    isExternal: false,
  },
  {
    id: '12',
    type: 'news',
    category: 'visit',
    badge: 'LIV VISIT',
    year: '2025',
    title: '이진주 아나운서, 리브성형외과 방문',
    source: 'LIV 소식',
    description:
      '이진주 아나운서가 리브성형외과를 방문했습니다. 리브는 본연의 단아함과 자연스러운 피부 탄력을 고려한 Slow Aging 케어 철학을 지향합니다.',
    image: '/images/media-news/visit-lee-announcer.jpg',
    imagePosition: '50% 51%',
    link: '/media',
    isExternal: false,
  },
  // ── 2021 ──
  {
    id: '13',
    type: 'press',
    category: 'press',
    badge: 'INTERVIEW',
    year: '2021',
    title: '이슈메이커 인터뷰',
    source: '이슈메이커',
    description:
      '동부이촌동 첫 성형외과 개원 과정과 정직한 진료 철학, 자연스러운 아름다움을 지향하는 리브성형외과의 방향성이 소개되었습니다.',
    image: '/images/media-news/og/13.jpg',
    imagePosition: '63% 33%',
    link: 'https://www.issuemaker.kr/news/articleView.html?idxno=32976',
    isExternal: true,
  },
  {
    id: '14',
    type: 'press',
    category: 'press',
    badge: 'MEDICAL COLUMN',
    year: '2021',
    title: '메디컬투데이 초음파 강도 조절 인터뷰',
    source: '메디컬투데이',
    description:
      '피부 두께와 구조에 따라 에너지 강도, 깊이, 샷 분배를 조절해야 하는 맞춤형 리프팅 접근에 대해 설명했습니다.',
    image: '/images/media-news/og/14.jpg',
    imagePosition: '67% 27%',
    link: 'https://mdtoday.co.kr/news/view/179516865175686',
    isExternal: true,
  },
];

/**
 * 메인 노출용 대표 카드 6개 (요청서 §2 — 메인용 짧은 카피).
 * 최신 소식을 맨 앞에 추가하고 가장 오래된 카드를 제거해 항상 6개를 유지한다.
 */
export const featuredMediaNews: FeaturedMediaCard[] = [
  {
    id: 'f8',
    type: 'press',
    badge: 'MEDIA INTERVIEW',
    year: '2026',
    title: '김수영 대표원장, APTOS Bio-Lifting 임상 인터뷰 참여',
    description:
      '미용의학 전문 매체 『Medical Aesthetic』의 APTOS Bio-Lifting 인터뷰에 참여해 얼굴 구조와 조직 상태를 고려한 정밀한 리프팅 디자인과 환자 맞춤형 Bio-Lifting 접근을 전했습니다.',
    image: '/images/media-news/aptos-bio-lifting-1.jpg',
    imagePosition: '50% 11%',
    link: '/media',
    isExternal: false,
    newsId: '16',
  },
  {
    id: 'f7',
    type: 'press',
    badge: 'MEDIA INTERVIEW',
    year: '2026',
    title: '‘메디컬 에스테틱’ 인터뷰 진행',
    description:
      '미용·의료기기 전문 매체 ‘메디컬 에스테틱’과 공식 인터뷰를 진행하며 Slow Aging 철학과 글로벌 리프팅 APTOS 시술을 조명했습니다.',
    image: '/images/media-news/medical-aesthetic-1.jpg',
    imagePosition: '63% 57%',
    link: '/media',
    isExternal: false,
    newsId: '15',
  },
  {
    id: 'f1',
    type: 'press',
    badge: 'BROADCAST',
    year: '2025',
    title: 'SBS 좋은아침 방송 출연',
    description: '피부 탄력, 생활습관 노화, 콜라겐 재생에 대한 전문가 의견을 전했습니다.',
    image: '/images/media-news/og/2.png',
    imagePosition: '52% 14%',
    link: 'https://www.vegannews.co.kr/news/article.html?no=354684',
    isExternal: true,
  },
  {
    id: 'f2',
    type: 'press',
    badge: 'COVER STORY',
    year: '2025',
    title: '이슈메이커 커버스토리',
    description: '슬로우에이징 철학, 재생 시술, 신사역 확장에 관한 리브성형외과의 방향성을 소개했습니다.',
    image: '/images/media-news/director-portrait.jpg',
    imagePosition: '50% 0%',
    link: 'https://www.issuemaker.kr/news/articleView.html?idxno=50870',
    isExternal: true,
  },
  {
    id: 'f3',
    type: 'press',
    badge: 'GLOBAL TRAINER',
    year: '2026',
    title: 'APTOS 공식 트레이너 인증',
    description: '김수영 대표원장이 글로벌 실리프팅 브랜드 APTOS의 International Trainer 자격을 획득했습니다.',
    image: '/images/media-news/og/1.jpg',
    imagePosition: '25% 30%',
    link: 'https://www.hinews.co.kr/view.php?ud=202604081129541521dacadeb388_48',
    isExternal: true,
  },
  {
    id: 'f4',
    type: 'news',
    badge: 'ACADEMIC',
    year: '2025',
    title: 'Aesthetic Plastic Surgery Korea 초청 강연',
    description: '김수영 대표원장이 ‘Site-specific algorithm for facial rejuvenation’을 주제로 공식 초청 구연 발표를 진행했습니다.',
    image: '/images/media-news/academic-lecture.jpg',
    imagePosition: '50% 72%',
    link: '/media',
    isExternal: false,
  },
];

/** 특정 연도의 항목만 추출(필터 결과 내) */
export function getItemsByYear(items: MediaNewsItem[], year: string): MediaNewsItem[] {
  return items.filter((item) => item.year === year);
}

/** 카테고리 필터링('all'이면 전체) */
export function filterByCategory(
  items: MediaNewsItem[],
  category: MediaCategory | 'all',
): MediaNewsItem[] {
  return category === 'all' ? items : items.filter((item) => item.category === category);
}
