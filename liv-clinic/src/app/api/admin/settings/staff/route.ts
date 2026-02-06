import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

const ROLE_ORDER: Record<string, number> = { owner: 1, admin: 2, doctor: 3, nurse: 4, staff: 5 };

function formatStaff(r: Record<string, unknown>) {
  const createdAt = r.created_at;
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    position: r.position,
    isActive: r.is_active,
    createdAt: typeof createdAt === 'string'
      ? createdAt.split('T')[0]
      : createdAt instanceof Date
        ? createdAt.toISOString().split('T')[0]
        : createdAt,
  };
}

// GET /api/admin/settings/staff - 직원 목록
export async function GET() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  try {
    const { data, error } = await admin
      .from('staff_members')
      .select('id, name, email, role, position, is_active, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // 역할 순서대로 정렬 (Supabase에서 CASE 정렬 불가 → JS에서 처리)
    const sorted = (data || []).sort((a, b) => {
      const ra = ROLE_ORDER[a.role as string] || 99;
      const rb = ROLE_ORDER[b.role as string] || 99;
      return ra - rb;
    });

    return NextResponse.json(sorted.map(formatStaff));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/settings/staff - 직원 추가
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const body = await request.json();

  try {
    const { data, error } = await admin
      .from('staff_members')
      .insert({
        name: body.name,
        email: body.email,
        role: body.role || 'staff',
        position: body.position || '',
        is_active: body.isActive ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(formatStaff(data), { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
