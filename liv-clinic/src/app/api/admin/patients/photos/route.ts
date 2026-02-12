import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

// GET /api/admin/patients/photos?name=X&phone=Y
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const phone = searchParams.get('phone');

  if (!name) {
    return NextResponse.json({ error: 'name parameter required' }, { status: 400 });
  }

  const admin = createAdminClient();
  let query = admin
    .from('patient_photos')
    .select('*')
    .eq('patient_name', name)
    .order('taken_at', { ascending: false });

  if (phone) {
    query = query.eq('phone', phone);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST /api/admin/patients/photos - save photo record
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.patient_name || !body.photo_url) {
    return NextResponse.json({ error: 'patient_name and photo_url are required' }, { status: 400 });
  }

  // Validate photo_url is a proper URL (prevent arbitrary injection)
  try {
    const url = new URL(body.photo_url);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return NextResponse.json({ error: 'photo_url must be an HTTP(S) URL' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'photo_url is not a valid URL' }, { status: 400 });
  }

  const validPhotoTypes = ['before', 'after', 'progress'];
  const photoType = validPhotoTypes.includes(body.photo_type) ? body.photo_type : 'progress';

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('patient_photos')
    .insert({
      patient_name: body.patient_name,
      phone: body.phone || null,
      photo_type: photoType,
      photo_url: body.photo_url,
      procedure_name: body.procedure_name || null,
      memo: body.memo || null,
      taken_at: body.taken_at || new Date().toISOString().split('T')[0],
      uploaded_by: session.user.email || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
