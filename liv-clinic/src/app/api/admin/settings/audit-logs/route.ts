import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

// GET /api/admin/settings/audit-logs - 감사 로그 목록
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const userName = searchParams.get('userName');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    let query = admin
      .from('audit_logs')
      .select('id, user_name, action, target, detail, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action && action !== 'all') {
      query = query.eq('action', action);
    }
    if (userName && userName !== 'all') {
      query = query.eq('user_name', userName);
    }

    const { data, error } = await query;
    if (error) throw error;

    const logs = (data || []).map((r) => ({
      id: r.id,
      userName: r.user_name,
      action: r.action,
      target: r.target,
      detail: r.detail,
      createdAt: r.created_at,
    }));

    return NextResponse.json(logs);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
