import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import getDb from '@/lib/db';

// GET /api/admin/settings/clinic - 병원 기본정보 조회
export async function GET() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getDb();

  try {
    const [row] = await sql`
      SELECT * FROM clinic_settings WHERE id = 1
    `;

    if (!row) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    return NextResponse.json({
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
    });
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

  const body = await request.json();
  const sql = getDb();

  try {
    const [updated] = await sql`
      UPDATE clinic_settings SET
        name = ${body.name},
        phone = ${body.phone},
        address = ${body.address},
        email = ${body.email},
        kakao = ${body.kakao},
        hours_weekday = ${body.hours?.weekday},
        hours_saturday = ${body.hours?.saturday},
        hours_sunday = ${body.hours?.sunday},
        hours_lunch = ${body.hours?.lunch},
        notify_callback_reminder = ${body.notifications?.callbackReminder},
        notify_low_stock_alert = ${body.notifications?.lowStockAlert},
        notify_new_consultation = ${body.notifications?.newConsultation}
      WHERE id = 1
      RETURNING *
    `;

    return NextResponse.json({
      name: updated.name,
      phone: updated.phone,
      address: updated.address,
      email: updated.email,
      kakao: updated.kakao,
      hours: {
        weekday: updated.hours_weekday,
        saturday: updated.hours_saturday,
        sunday: updated.hours_sunday,
        lunch: updated.hours_lunch,
      },
      notifications: {
        callbackReminder: updated.notify_callback_reminder,
        lowStockAlert: updated.notify_low_stock_alert,
        newConsultation: updated.notify_new_consultation,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
