import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { BASE_URL } from '@/lib/seo';
import { SITE_INFO } from '@/lib/constants';
import { pickLocalized } from '@/lib/i18nFallback';
import type { Locale } from '@/i18n/routing';
import EventDetailClient from './EventDetailClient';

// 이벤트 상세 메타데이터는 자주 갱신되도록 짧은 ISR 적용
// (관리자에서 이벤트 정보 수정 시 탭 제목/OG 정보가 빠르게 반영되어야 함)
export const revalidate = 60;

// 언어별 이벤트 페이지 기본 제목 (이벤트를 찾지 못했을 때 fallback)
const FALLBACK_TITLES: Record<string, string> = {
  ko: '이벤트 | 리브성형외과',
  en: 'Events | LIV Plastic Surgery',
  ja: 'イベント | リブ形成外科',
  zh: '活动 | LIV整形外科',
};

// Server-side: Supabase에서 이벤트 데이터 가져오기
async function getEvent(slug: string) {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  return data;
}

// OG 메타데이터 생성 (카카오톡, SNS 공유 시 썸네일 표시)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; eventId: string }>;
}): Promise<Metadata> {
  const { locale, eventId } = await params;
  const event = await getEvent(eventId);

  if (!event) {
    // 사용자에게 "찾을 수 없음" 같은 부정 문구가 탭/주소창에 노출되지 않도록
    // 중립적인 이벤트 페이지 기본 제목을 fallback으로 사용
    return {
      title: FALLBACK_TITLES[locale] || FALLBACK_TITLES.ko,
    };
  }

  // 언어별 제목/설명
  const titleMap: Record<string, string> = {
    ko: event.title_ko,
    en: event.title_en || event.title_ko,
    ja: event.title_ja || event.title_ko,
    zh: event.title_zh || event.title_ko,
  };
  const descMap: Record<string, string> = {
    ko: event.description_ko,
    en: event.description_en || event.description_ko,
    ja: event.description_ja || event.description_ko,
    zh: event.description_zh || event.description_ko,
  };

  const title = titleMap[locale] || event.title_ko;
  const description = descMap[locale] || event.description_ko;

  // 포스터 이미지 URL (언어별 포스터 우선, 전체 경로로 변환)
  const posterImage = pickLocalized({
    ko: event.poster_image,
    en: event.poster_image_en,
    ja: event.poster_image_ja,
    zh: event.poster_image_zh,
  }, locale as Locale) || '/images/placeholder-event.jpg';
  const imageUrl = posterImage.startsWith('http') ? posterImage : `${BASE_URL}${posterImage}`;

  return {
    title: `${title} | 리브성형외과`,
    description,
    openGraph: {
      title: `${title} | 리브성형외과`,
      description,
      url: `${BASE_URL}/${locale}/events/${eventId}`,
      siteName: SITE_INFO.name,
      type: 'article',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 1200,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | 리브성형외과`,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/events/${eventId}`,
      languages: {
        ko: `${BASE_URL}/ko/events/${eventId}`,
        en: `${BASE_URL}/en/events/${eventId}`,
        ja: `${BASE_URL}/ja/events/${eventId}`,
        zh: `${BASE_URL}/zh/events/${eventId}`,
      },
    },
  };
}

export default function EventDetailPage() {
  return <EventDetailClient />;
}
