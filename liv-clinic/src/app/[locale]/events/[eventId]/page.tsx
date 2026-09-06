import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { BASE_URL, buildHreflangMap, getSiteName } from '@/lib/seo';
import { pickLocalized } from '@/lib/i18nFallback';
import { buildEventMetaDescription, decodeEventSlug, eventsMetaFor } from '@/lib/eventsMeta';
import type { Locale } from '@/i18n/routing';
import EventDetailClient from './EventDetailClient';

// 이벤트 상세 메타데이터는 자주 갱신되도록 짧은 ISR 적용
// (관리자에서 이벤트 정보 수정 시 탭 제목/OG 정보가 빠르게 반영되어야 함)
export const revalidate = 60;

// Server-side: Supabase에서 이벤트 데이터 가져오기
// 한글 슬러그(`6월-프로모션`)는 라우트 파라미터로 퍼센트 인코딩된 채 들어와 DB 조회가 빗나갔다
// (2026-09-06 실측: 4개 이벤트 × 11로케일이 폴백 제목으로 서빙됨) → 조회 전에 디코드한다.
async function getEvent(rawSlug: string) {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('slug', decodeEventSlug(rawSlug))
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
    // 중립적인 이벤트 허브 제목을 fallback으로 사용(11개 로케일 공통 메타).
    return {
      title: eventsMetaFor(locale).title,
      robots: { index: false, follow: true },
    };
  }

  // 언어별 제목 — zh-TW·vi 등 컬럼이 없는 로케일은 본문(EventDetailClient)과 같은 폴백 순서를 따른다
  // (예전 맵 방식은 zh-TW를 한국어로 떨어뜨려 meta description이 한국어로 나갔다).
  const title =
    pickLocalized(
      { ko: event.title_ko, en: event.title_en, ja: event.title_ja, zh: event.title_zh },
      locale as Locale,
    ) || event.title_ko;
  // 설명 — 해당 언어 원문이 없으면 한국어 대신 로케일 공통 설명, 60자 미만이면 공통 설명을 덧붙인다
  // (Bing "description too short" 98페이지의 대부분이 이벤트 상세였다. 2026-09-06)
  const description = buildEventMetaDescription(locale, {
    ko: event.description_ko,
    en: event.description_en,
    ja: event.description_ja,
    zh: event.description_zh,
  });

  // 포스터 이미지 URL (언어별 포스터 우선, 전체 경로로 변환)
  const posterImage = pickLocalized({
    ko: event.poster_image,
    en: event.poster_image_en,
    ja: event.poster_image_ja,
    zh: event.poster_image_zh,
  }, locale as Locale) || '/images/placeholder-event.jpg';
  const imageUrl = posterImage.startsWith('http') ? posterImage : `${BASE_URL}${posterImage}`;

  // 병원명은 로케일별 정본(getSiteName) — 외국어 페이지 제목에 한국어 병원명이 새지 않게
  const siteName = getSiteName(locale);
  const fullTitle = `${title} | ${siteName}`;
  const pageUrl = `${BASE_URL}/${locale}/events/${eventId}`;

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      url: pageUrl,
      siteName,
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
      title: fullTitle,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: pageUrl,
      // 11개 로케일 + x-default, BCP-47 — 사이트 공통 hreflang 맵과 동일한 신호
      languages: buildHreflangMap(`/events/${eventId}`),
    },
  };
}

export default function EventDetailPage() {
  return <EventDetailClient />;
}
