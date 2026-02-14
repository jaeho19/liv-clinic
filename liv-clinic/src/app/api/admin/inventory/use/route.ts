import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

interface UseItem {
  item_id: string;
  quantity: number;
}

interface UseRequest {
  items: UseItem[];
  patient_name?: string;
  chart_number?: string;
  note?: string;
  confirmed_by?: string;
}

// POST /api/admin/inventory/use - 물품 사용 (재고 차감)
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: UseRequest = await request.json();

  if (!body.items || body.items.length === 0) {
    return NextResponse.json({ error: '사용 품목을 선택해주세요.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const txIds: string[] = [];
  const errors: string[] = [];

  for (const item of body.items) {
    try {
      const { data, error } = await admin.rpc('use_inventory_item', {
        p_item_id: item.item_id,
        p_quantity: item.quantity,
        p_patient_name: body.patient_name ?? undefined,
        p_chart_number: body.chart_number ?? undefined,
        p_note: body.note ?? undefined,
        p_confirmed_by: body.confirmed_by ?? undefined,
        p_created_by: user.email ?? undefined,
      });

      if (error) throw new Error(error.message);
      txIds.push(data as string);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      errors.push(`${item.item_id}: ${msg}`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { error: '일부 품목 처리 실패', details: errors, successful: txIds },
      { status: errors.length === body.items.length ? 500 : 207 }
    );
  }

  return NextResponse.json({ success: true, transaction_ids: txIds }, { status: 201 });
}
