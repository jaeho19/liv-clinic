import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

// GET /api/admin/consultations/[id]/timeline
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('consultation_timeline')
    .select('*')
    .eq('consultation_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const timeline = (data || []).map((t) => ({
    id: t.id,
    eventType: t.event_type,
    description: t.description,
    actor: t.actor,
    oldValue: t.old_value,
    newValue: t.new_value,
    metadata: t.metadata,
    createdAt: t.created_at,
  }));

  return NextResponse.json({ timeline });
}

// POST /api/admin/consultations/[id]/timeline
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();
  const body = await request.json();

  const { eventType, description, actor, oldValue, newValue, metadata } = body;

  if (!eventType || !description) {
    return NextResponse.json({ error: 'eventType, description are required' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('consultation_timeline')
    .insert({
      consultation_id: id,
      event_type: eventType,
      description,
      actor: actor || null,
      old_value: oldValue || null,
      new_value: newValue || null,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    eventType: data.event_type,
    description: data.description,
    actor: data.actor,
    createdAt: data.created_at,
  }, { status: 201 });
}
