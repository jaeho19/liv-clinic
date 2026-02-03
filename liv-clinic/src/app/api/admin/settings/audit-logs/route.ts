import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import getDb from '@/lib/db';

// GET /api/admin/settings/audit-logs - 감사 로그 목록
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const userName = searchParams.get('userName');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  const sql = getDb();

  try {
    const rows = await sql`
      SELECT id, user_name, action, target, detail, created_at
      FROM audit_logs
      WHERE true
        ${action && action !== 'all' ? sql`AND action = ${action}` : sql``}
        ${userName && userName !== 'all' ? sql`AND user_name = ${userName}` : sql``}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const logs = rows.map((r: Record<string, unknown>) => ({
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
