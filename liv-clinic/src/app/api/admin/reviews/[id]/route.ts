import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const update: { is_published?: boolean; is_verified?: boolean; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };
    if ('is_published' in body) {
      if (typeof body.is_published !== 'boolean') {
        return NextResponse.json({ error: 'is_published must be a boolean' }, { status: 400 });
      }
      update.is_published = body.is_published;
    }
    if ('is_verified' in body) {
      if (typeof body.is_verified !== 'boolean') {
        return NextResponse.json({ error: 'is_verified must be a boolean' }, { status: 400 });
      }
      update.is_verified = body.is_verified;
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('reviews')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('PATCH /api/admin/reviews/[id] failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Best-effort ISR refresh of the public reviews page; never fail the request.
    try {
      revalidatePath('/', 'layout');
    } catch (revalidateError) {
      console.warn('revalidatePath after review update failed:', revalidateError);
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('PATCH /api/admin/reviews/[id] error:', e);
    return NextResponse.json({ error: '후기 수정에 실패했습니다.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const admin = createAdminClient();

    const { error } = await admin.from('reviews').delete().eq('id', id);

    if (error) {
      console.error('DELETE /api/admin/reviews/[id] failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      revalidatePath('/', 'layout');
    } catch (revalidateError) {
      console.warn('revalidatePath after review delete failed:', revalidateError);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/admin/reviews/[id] error:', e);
    return NextResponse.json({ error: '후기 삭제에 실패했습니다.' }, { status: 500 });
  }
}
