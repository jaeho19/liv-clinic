import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

// DELETE /api/admin/patients/photos/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  // Get photo record to find the storage path
  const { data: photo, error: fetchErr } = await admin
    .from('patient_photos')
    .select('photo_url')
    .eq('id', id)
    .single();

  if (fetchErr) {
    if (fetchErr.code === 'PGRST116') {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  // Try to delete from storage
  if (photo.photo_url) {
    try {
      const url = new URL(photo.photo_url);
      const pathParts = url.pathname.split('/storage/v1/object/public/patient-photos/');
      if (pathParts[1]) {
        await admin.storage.from('patient-photos').remove([pathParts[1]]);
      }
    } catch {
      // Storage deletion is best-effort
    }
  }

  // Delete DB record
  const { error } = await admin
    .from('patient_photos')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
