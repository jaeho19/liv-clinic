import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { patient_treatment_id, channel, sent_by, status = 'sent', notes, template_id } = body;

  if (!patient_treatment_id || !channel || !sent_by) {
    return NextResponse.json({ error: 'patient_treatment_id, channel, sent_by are required' }, { status: 400 });
  }

  const admin = createAdminClient();

  // 발송 이력 기록
  const { error: historyError } = await admin.from('notification_history').insert({
    patient_treatment_id,
    template_id: template_id || null,
    channel,
    sent_by,
    status,
    notes: notes || null,
  });

  if (historyError) return NextResponse.json({ error: historyError.message }, { status: 500 });

  // 발송 완료 시 patient_treatments 업데이트
  if (status === 'sent' || status === 'skipped') {
    const { error: updateError } = await admin
      .from('patient_treatments')
      .update({ notification_sent: true, updated_at: new Date().toISOString() })
      .eq('id', patient_treatment_id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
