import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendNotification, buildMessageFromTemplate } from '@/lib/solapi';

// GET /api/cron/send-notifications - Vercel Cron 자동 발송
// vercel.json: schedule "0 0 * * *" (매일 UTC 00:00 = KST 09:00)
export async function GET(request: NextRequest) {
  // Vercel Cron 인증 검증
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // 발송 대상 조회: next_notification_at <= NOW, notification_sent = false, auto_send = true
  const { data: pendingItems, error } = await admin
    .from('patient_treatments')
    .select('*')
    .eq('notification_sent', false)
    .eq('auto_send', true)
    .not('next_notification_at', 'is', null)
    .lte('next_notification_at', now)
    .order('next_notification_at', { ascending: true })
    .limit(50); // 한번에 최대 50건 처리

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = pendingItems || [];
  let sent = 0;
  let failed = 0;

  for (const treatment of items) {
    // 시술에 연결된 템플릿 조회
    let messageText = `[리브성형외과] ${treatment.patient_name}님, ${treatment.treatment_name} 시술 후 재방문 시기입니다. 상담 예약: 02-xxxx-xxxx`;
    let templateVariables: Record<string, string> = {};

    // treatment_masters에서 notification_template_id 조회
    const { data: master } = await admin
      .from('treatment_masters')
      .select('notification_template_id')
      .eq('name', treatment.treatment_name)
      .single();

    if (master?.notification_template_id) {
      const { data: template } = await admin
        .from('notification_templates')
        .select('*')
        .eq('id', master.notification_template_id)
        .single();

      if (template) {
        templateVariables = {
          patientName: treatment.patient_name,
          treatmentName: treatment.treatment_name,
          clinicName: '리브성형외과',
          clinicPhone: '02-xxxx-xxxx',
        };
        messageText = buildMessageFromTemplate(template.message, templateVariables);
      }
    }

    // Solapi 발송
    const result = await sendNotification({
      to: treatment.phone,
      variables: templateVariables,
      smsMessage: messageText,
    });

    // notification_history 기록
    await admin.from('notification_history').insert({
      patient_treatment_id: treatment.id,
      template_id: master?.notification_template_id || null,
      channel: result.channel,
      sent_by: 'SYSTEM_CRON',
      status: result.success ? 'sent' : 'failed',
      solapi_message_id: result.messageId || null,
      solapi_status: result.success ? 'success' : 'failed',
      fallback_channel: result.fallbackUsed ? 'sms' : null,
      error_message: result.error || null,
    });

    if (result.success) {
      // 발송 완료 처리
      await admin
        .from('patient_treatments')
        .update({
          notification_sent: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', treatment.id);
      sent++;
    } else {
      failed++;
    }
  }

  return NextResponse.json({
    total: items.length,
    sent,
    failed,
    timestamp: now,
  });
}
