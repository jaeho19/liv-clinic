import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const admin = createAdminClient();

  // 오늘까지 알림이 필요한 미발송 건 (오늘 이하)
  const { data: todayItems, error: todayError } = await admin
    .from('patient_treatments')
    .select('*')
    .eq('notification_sent', false)
    .not('next_notification_at', 'is', null)
    .lte('next_notification_at', `${todayStr}T23:59:59`)
    .order('next_notification_at', { ascending: true });

  if (todayError) return NextResponse.json({ error: todayError.message }, { status: 500 });

  // 이번 주 예정 (내일부터 7일)
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const { count: weekCount } = await admin
    .from('patient_treatments')
    .select('*', { count: 'exact', head: true })
    .eq('notification_sent', false)
    .not('next_notification_at', 'is', null)
    .gt('next_notification_at', `${todayStr}T23:59:59`)
    .lte('next_notification_at', `${weekEndStr}T23:59:59`);

  return NextResponse.json({
    today: todayItems || [],
    todayCount: todayItems?.length || 0,
    weekCount: weekCount || 0,
  });
}
