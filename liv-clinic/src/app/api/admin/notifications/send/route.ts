import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendNotification, buildMessageFromTemplate } from '@/lib/solapi';

// POST /api/admin/notifications/send - 실제 카카오/SMS 발송
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { patient_treatment_id, channel, template_id, sent_by } = body;

  if (!patient_treatment_id || !channel || !sent_by) {
    return NextResponse.json({ error: 'patient_treatment_id, channel, sent_by are required' }, { status: 400 });
  }

  const admin = createAdminClient();

  // 1. 환자 시술 정보 조회
  const { data: treatment, error: treatmentError } = await admin
    .from('patient_treatments')
    .select('*')
    .eq('id', patient_treatment_id)
    .single();

  if (treatmentError || !treatment) {
    return NextResponse.json({ error: '시술 기록을 찾을 수 없습니다.' }, { status: 404 });
  }

  // 2. 템플릿 조회 (있는 경우)
  let messageText = `[리브성형외과] ${treatment.patient_name}님, ${treatment.treatment_name} 시술 후 관리 안내드립니다. 재방문 상담을 원하시면 02-xxxx-xxxx로 연락 부탁드립니다.`;
  let templateVariables: Record<string, string> = {};
  let kakaoTemplateId: string | undefined;

  if (template_id) {
    const { data: template } = await admin
      .from('notification_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (template) {
      templateVariables = {
        patientName: treatment.patient_name,
        treatmentName: treatment.treatment_name,
        clinicName: '리브성형외과',
        clinicPhone: '02-xxxx-xxxx',
      };
      messageText = buildMessageFromTemplate(template.message, templateVariables);
      kakaoTemplateId = template.title; // 카카오 템플릿 ID는 title에 저장한다고 가정
    }
  }

  // 3. Solapi API 호출
  const result = await sendNotification({
    to: treatment.phone,
    templateId: kakaoTemplateId,
    variables: templateVariables,
    smsMessage: messageText,
  });

  // 4. notification_history에 결과 기록
  const { error: historyError } = await admin.from('notification_history').insert({
    patient_treatment_id,
    template_id: template_id || null,
    channel: result.channel,
    sent_by,
    status: result.success ? 'sent' : 'failed',
    notes: body.notes || null,
    solapi_message_id: result.messageId || null,
    solapi_status: result.success ? 'success' : 'failed',
    fallback_channel: result.fallbackUsed ? 'sms' : null,
    error_message: result.error || null,
  });

  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 });
  }

  // 5. 성공 시 patient_treatments 업데이트
  if (result.success) {
    await admin
      .from('patient_treatments')
      .update({ notification_sent: true, updated_at: new Date().toISOString() })
      .eq('id', patient_treatment_id);
  }

  return NextResponse.json({
    success: result.success,
    messageId: result.messageId,
    channel: result.channel,
    fallbackUsed: result.fallbackUsed,
    ...(result.error ? { error: result.error } : {}),
  }, { status: result.success ? 200 : 500 });
}
