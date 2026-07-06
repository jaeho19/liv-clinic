import type { EventRow } from '@/types/admin';
import type { EventItem, EventCategory } from '@/lib/constants';

/**
 * Supabase EventRow → 프론트엔드 EventItem 변환
 * DB 스키마(snake_case, 언어별 컬럼)를 UI 컴포넌트가 사용하는 형식으로 매핑
 */
export function eventRowToEventItem(row: EventRow): EventItem {
  return {
    id: row.slug,
    sortOrder: row.sort_order,
    title: {
      ko: row.title_ko,
      en: row.title_en || row.title_ko,
      ja: row.title_ja || row.title_ko,
      zh: row.title_zh || row.title_ko,
    },
    description: {
      ko: row.description_ko,
      en: row.description_en || row.description_ko,
      ja: row.description_ja || row.description_ko,
      zh: row.description_zh || row.description_ko,
    },
    posterImage: row.poster_image || '/images/placeholder-event.jpg',
    posterImageLocalized: {
      ko: row.poster_image,
      en: row.poster_image_en,
      ja: row.poster_image_ja,
      zh: row.poster_image_zh,
    },
    thumbnailImage: row.thumbnail_image || undefined,
    galleryImages: row.gallery_images || [],
    galleryImagesLocalized: {
      ko: row.gallery_images,
      en: row.gallery_images_en,
      ja: row.gallery_images_ja,
      zh: row.gallery_images_zh,
    },
    startDate: row.start_date,
    endDate: row.end_date,
    category: (row.category as EventCategory) || 'all',
    featured: row.featured,
    relatedTreatments: row.related_treatments || [],
  };
}

/**
 * 공개 이벤트 목록 가져오기 (API → 상수 폴백)
 * API에서 받은 이벤트 + 상수에만 있는 이벤트를 병합하여 반환
 */
export async function fetchPublishedEvents(): Promise<{ events: EventItem[]; fromApi: boolean }> {
  try {
    const res = await fetch('/api/events', { next: { revalidate: 0 } });
    if (!res.ok) throw new Error('Failed to fetch events');
    const rows: EventRow[] = await res.json();
    return { events: rows.map(eventRowToEventItem), fromApi: true };
  } catch {
    return { events: [], fromApi: false };
  }
}

/**
 * 슬러그로 단일 이벤트 가져오기
 */
export async function fetchEventBySlug(slug: string): Promise<EventItem | null> {
  try {
    const res = await fetch(`/api/events/${slug}`);
    if (!res.ok) return null;
    const row: EventRow = await res.json();
    return eventRowToEventItem(row);
  } catch {
    return null;
  }
}
