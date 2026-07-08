import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('reviews')
      .select('*')
      .order('is_published', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET /api/admin/reviews failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('GET /api/admin/reviews error:', e);
    return NextResponse.json({ error: '후기 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}
