import { createClient } from '@supabase/supabase-js';
import type { EventRow } from '@/types/admin';
import { eventRowToEventItem } from '@/lib/eventApi';
import EventsPageClient from './EventsPageClient';

// 이벤트 카드를 서버에서 렌더링해 검색엔진이 목록을 읽게 한다(이전에는 클라이언트 fetch라 SSR HTML에 없었다).
// 관리자 변경은 1분 안에 반영 — 이벤트 상세 페이지와 같은 주기.
export const revalidate = 60;

async function getPublishedEvents(): Promise<{ events: ReturnType<typeof eventRowToEventItem>[]; ok: boolean }> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('start_date', { ascending: false });
    if (error) throw error;
    return { events: ((data ?? []) as EventRow[]).map(eventRowToEventItem), ok: true };
  } catch (err) {
    console.error('events page fetch error:', err);
    return { events: [], ok: false };
  }
}

export default async function EventsPage() {
  const { events, ok } = await getPublishedEvents();
  return <EventsPageClient initialEvents={events} loadFailed={!ok} />;
}
