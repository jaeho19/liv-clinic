import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import type { Database } from '@/types/supabase';

type OperationCaseInsert = Database['public']['Tables']['operation_cases']['Insert'];

// 결제수단 한글 → 코드 매핑
const PAYMENT_METHOD_MAP: Record<string, string> = {
  '카드': 'CARD',
  '현금': 'CASH',
  '이체': 'TRANSFER',
  '복합': 'MIXED',
  CARD: 'CARD',
  CASH: 'CASH',
  TRANSFER: 'TRANSFER',
  MIXED: 'MIXED',
};

// 결제상태 한글 → 코드 매핑
const PAYMENT_STATUS_MAP: Record<string, string> = {
  '완료': 'COMPLETED',
  '결제완료': 'COMPLETED',
  '미결제': 'PENDING',
  '대기': 'PENDING',
  '환불': 'REFUNDED',
  COMPLETED: 'COMPLETED',
  PENDING: 'PENDING',
  REFUNDED: 'REFUNDED',
};

interface CsvColumnMapping {
  date: string;
  patientName: string;
  procedureName: string;
  category?: string;
  doctor: string;
  priceKrw: string;
  discountKrw?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

function parseNumber(value: string): number | null {
  if (!value) return null;
  // Remove commas, spaces, currency symbols
  const cleaned = value.replace(/[,\s원₩\\]/g, '');
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

function parseDate(value: string): string | null {
  if (!value) return null;
  // Try various date formats
  // YYYY-MM-DD, YYYY/MM/DD, MM/DD/YYYY, M/D
  const trimmed = value.trim();

  // ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // YYYY/MM/DD
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(trimmed)) {
    const d = new Date(trimmed.replace(/\//g, '-'));
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // MM/DD/YYYY or M/D/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [m, d, y] = trimmed.split('/');
    const date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T09:00:00+09:00`);
    if (!isNaN(date.getTime())) return date.toISOString();
  }

  // YYYYMMDD
  if (/^\d{8}$/.test(trimmed)) {
    const y = trimmed.slice(0, 4);
    const m = trimmed.slice(4, 6);
    const d = trimmed.slice(6, 8);
    const date = new Date(`${y}-${m}-${d}T09:00:00+09:00`);
    if (!isNaN(date.getTime())) return date.toISOString();
  }

  return null;
}

// POST /api/admin/revenue/import - CSV 일괄 임포트
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const body = await request.json();
  const { rows, mappings, skipDuplicates = true } = body as {
    rows: Record<string, string>[];
    mappings: CsvColumnMapping;
    skipDuplicates: boolean;
  };

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'rows가 비어있습니다.' }, { status: 400 });
  }
  if (!mappings || !mappings.date || !mappings.patientName || !mappings.procedureName || !mappings.doctor || !mappings.priceKrw) {
    return NextResponse.json({ error: '필수 매핑 필드가 누락되었습니다. (date, patientName, procedureName, doctor, priceKrw)' }, { status: 400 });
  }

  const batchId = `import-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}`;
  const errors: ImportError[] = [];
  const insertRows: OperationCaseInsert[] = [];
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    // Extract values using mappings
    const dateRaw = row[mappings.date] || '';
    const patientName = (row[mappings.patientName] || '').trim();
    const procedureName = (row[mappings.procedureName] || '').trim();
    const doctor = (row[mappings.doctor] || '').trim();
    const priceRaw = row[mappings.priceKrw] || '';
    const discountRaw = mappings.discountKrw ? (row[mappings.discountKrw] || '') : '';
    const methodRaw = mappings.paymentMethod ? (row[mappings.paymentMethod] || '') : '';
    const statusRaw = mappings.paymentStatus ? (row[mappings.paymentStatus] || '') : '';
    const categoryRaw = mappings.category ? (row[mappings.category] || '') : '';

    // Validate required fields
    if (!patientName) { errors.push({ row: rowNum, field: 'patientName', message: '환자명이 비어있습니다.' }); continue; }
    if (!procedureName) { errors.push({ row: rowNum, field: 'procedureName', message: '시술명이 비어있습니다.' }); continue; }
    if (!doctor) { errors.push({ row: rowNum, field: 'doctor', message: '담당의가 비어있습니다.' }); continue; }

    const parsedDate = parseDate(dateRaw);
    if (!parsedDate) { errors.push({ row: rowNum, field: 'date', message: `날짜 형식 오류: '${dateRaw}'` }); continue; }

    const priceKrw = parseNumber(priceRaw);
    if (priceKrw === null || priceKrw < 0) { errors.push({ row: rowNum, field: 'priceKrw', message: `금액 오류: '${priceRaw}'` }); continue; }

    const discountKrw = discountRaw ? parseNumber(discountRaw) : 0;
    const paymentMethod = methodRaw ? (PAYMENT_METHOD_MAP[methodRaw.trim()] || null) : null;
    const paymentStatus = statusRaw ? (PAYMENT_STATUS_MAP[statusRaw.trim()] || 'PENDING') : 'COMPLETED';

    insertRows.push({
      room_id: 'import',
      patient_name: patientName,
      procedure_name: procedureName,
      doctor,
      treatment_type: categoryRaw || 'PROCEDURE',
      price_krw: priceKrw,
      discount_krw: discountKrw || 0,
      payment_method: paymentMethod || 'CARD',
      payment_status: paymentStatus,
      status: 'COMPLETED',
      location: 'OTHER',
      import_batch_id: batchId,
      import_source: 'csv_import',
      created_at: parsedDate,
      updated_at: new Date().toISOString(),
    } satisfies OperationCaseInsert);
  }

  // Duplicate check
  if (skipDuplicates && insertRows.length > 0) {
    const dedupRows: OperationCaseInsert[] = [];
    for (const row of insertRows) {
      const dateStr = (row.created_at || '').split('T')[0];
      const { data: existing } = await admin
        .from('operation_cases')
        .select('id')
        .eq('patient_name', row.patient_name)
        .eq('procedure_name', row.procedure_name)
        .gte('created_at', dateStr + 'T00:00:00')
        .lte('created_at', dateStr + 'T23:59:59')
        .limit(1);

      if (existing && existing.length > 0) {
        skipped++;
      } else {
        dedupRows.push(row);
      }
    }
    insertRows.length = 0;
    insertRows.push(...dedupRows);
  }

  // Batch insert
  let imported = 0;
  if (insertRows.length > 0) {
    const { error: insertError, data: inserted } = await admin
      .from('operation_cases')
      .insert(insertRows)
      .select('id');

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    imported = inserted?.length || 0;
  }

  return NextResponse.json({
    imported,
    skipped,
    errors: errors.slice(0, 50), // Max 50 errors
    batchId,
  });
}
