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
    id: '1',
    type: 'press',
    category: 'academic_global',
    badge: 'GLOBAL TRAINER',
    year: '2026',
    title: 'APTOS 공식 트레이너 인증',
    source: '하이뉴스',
    description:
      '김수영 리브성형외과 대표원장이 글로벌 실리프팅 브랜드 APTOS의 본사 공식 트레이너, International Trainer 자격을 획득했습니다. 임상 경험과 시술 숙련도를 바탕으로 리프팅 시술에 대한 전문성을 인정받은 사례입니다.',
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
    link: 'https://mdtoday.co.kr/news/view/179516865175686',
    isExternal: true,
  },
];

/**
 * 메인 노출용 대표 카드 6개 (요청서 §2 — 메인용 짧은 카피).
 * f6은 14개 항목에 없는 집계형 카드(셀럽 실명 미노출, 브랜드 신뢰·전문성 중심).
 */
export const featuredMediaNews: FeaturedMediaCard[] = [
  {
    id: 'f1',
    type: 'press',
    badge: 'BROADCAST',
    year: '2025',
    title: 'SBS 좋은아침 방송 출연',
    description: '피부 탄력, 생활습관 노화, 콜라겐 재생에 대한 전문가 의견을 전했습니다.',
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
    link: '/media',
    isExternal: false,
  },
  {
    id: 'f5',
    type: 'news',
    badge: 'LIV NEWS',
    year: '2025',
    title: 'APTOS 글로벌 트레이너 공식 인증패 수여',
    description: 'APTOS 본사 공식 트레이너 인증패가 리브성형외과에 전달되며, 글로벌 교육 활동의 기반을 확장했습니다.',
    link: '/media',
    isExternal: false,
  },
  {
    id: 'f6',
    type: 'news',
    badge: 'LIV VISIT',
    year: '2025',
    title: '셀럽과 글로벌 인플루언서의 리브 방문',
    description: '방송인, 아나운서, 글로벌 인플루언서 등 다양한 방문 소식을 통해 리브의 Slow Aging 케어 철학을 전합니다.',
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
