import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { EventRow } from '@/types/admin';
import { decodeEventSlug } from '@/lib/eventsMeta';

/**
 * 발행된 이벤트 한 건을 슬러그로 조회한다 (서버 컴포넌트 전용, anon 키).
 *
 * 이벤트 상세 페이지와 포스터 전용 페이지가 같은 조회를 쓴다.
 * 한글 슬러그(`6월-프로모션`)는 라우트 파라미터로 퍼센트 인코딩된 채 들어와 DB 조회가 빗나갔다
 * (2026-09-06 실측: 4개 이벤트 × 11로케일이 폴백 제목으로 서빙됨) → 조회 전에 디코드한다.
 */
export async function getPublishedEventRow(rawSlug: string): Promise<EventRow | null> {
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
