import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import type { TablesUpdate } from '@/types/supabase';

// 응답 포맷 변환
function formatClinicData(row: Record<string, unknown>) {
  return {
    name: row.name,
    phone: row.phone,
    address: row.address,
    email: row.email,
    kakao: row.kakao,
    hours: {
      weekday: row.hours_weekday,
      saturday: row.hours_saturday,
      sunday: row.hours_sunday,
      lunch: row.hours_lunch,
    },
    notifications: {
      callbackReminder: row.notify_callback_reminder,
      lowStockAlert: row.notify_low_stock_alert,
      newConsultation: row.notify_new_consultation,
    },
    revenueTarget: row.revenue_target ?? 250000000,
    analytics: {
      gaTrackingId: row.ga_tracking_id ?? '',
      naverWcsId: row.naver_wcs_id ?? '',
      gaEnabled: row.ga_enabled ?? true,
      naverEnabled: row.naver_enabled ?? true,
    },
  };
}

// GET /api/admin/settings/clinic - 병원 기본정보 조회
export async function GET() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  try {
    const { data, error } = await admin
      .from('clinic_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(formatClinicData(data));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT /api/admin/settings/clinic - 병원 기본정보 수정
export async function PUT(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const body = await request.json();

  try {
    const updateObj: TablesUpdate<'clinic_settings'> = {
      name: body.name,
      phone: body.phone,
      address: body.address,
      email: body.email,
      kakao: body.kakao,
      hours_weekday: body.hours?.weekday,
      hours_saturday: body.hours?.saturday,
      hours_sunday: body.hours?.sunday,
      hours_lunch: body.hours?.lunch,
      notify_callback_reminder: body.notifications?.callbackReminder,
      notify_low_stock_alert: body.notifications?.lowStockAlert,
      notify_new_consultation: body.notifications?.newConsultation,
    };

    if (body.revenueTarget !== undefined) {
      updateObj.revenue_target = body.revenueTarget;
    }

    if (body.analytics) {
      if (body.analytics.gaTrackingId !== undefined) updateObj.ga_tracking_id = body.analytics.gaTrackingId;
      if (body.analytics.naverWcsId !== undefined) updateObj.naver_wcs_id = body.analytics.naverWcsId;
      if (body.analytics.gaEnabled !== undefined) updateObj.ga_enabled = body.analytics.gaEnabled;
      if (body.analytics.naverEnabled !== undefined) updateObj.naver_enabled = body.analytics.naverEnabled;
    }

    const { data, error } = await admin
      .from('clinic_settings')
      .update(updateObj)
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(formatClinicData(data));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
