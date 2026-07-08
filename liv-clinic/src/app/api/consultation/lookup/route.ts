import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { verifyInquiryPassword } from '@/lib/inquiryPassword';
import { z } from 'zod';

const lookupSchema = z.object({
  phone: z.string().min(1).max(30),
  password: z.string().min(1).max(50),
});

// 간단 in-memory 속도제한 (전화번호 기준 — 무차별 대입 방지).
// 다중 인스턴스 환경에선 정확도 한계가 있으나 scrypt 지연과 결합해 1차 방어로 충분.
const attempts = new Map<string, { count: number; firstAtMs: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(key: string, now: number): boolean {
  const rec = attempts.get(key);
  if (!rec || now - rec.firstAtMs > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAtMs: now });
    return false;
  }
  if (rec.count >= MAX_ATTEMPTS) return true;
  rec.count += 1;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = lookupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    const phone = parsed.data.phone.replace(/[\s().-]/g, '');
    const { password } = parsed.data;

    if (isRateLimited(phone, Date.now())) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('consultation_requests')
      .select('id, treatment_type, message, preferred_date, preferred_time, status, created_at, password')
      .eq('phone', phone)
      .not('password', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('inquiry lookup error:', error);
      return NextResponse.json({ error: 'internal_error' }, { status: 500 });
    }

    // 비밀번호 해시 검증을 통과한 본인 문의만 반환. 안전한 필드만 노출(이름/담당자/내부필드 제외).
    const inquiries = (data || [])
      .filter((row) => verifyInquiryPassword(password, row.password))
      .map((row) => ({
        id: row.id,
        treatmentType: row.treatment_type,
        message: row.message,
        preferredDate: row.preferred_date,
        preferredTime: row.preferred_time,
        status: row.status,
        createdAt: row.created_at,
      }));

    // 전화번호 존재 여부를 노출하지 않도록, 불일치 시에도 200 + 빈 목록.
    return NextResponse.json({ found: inquiries.length > 0, inquiries }, { status: 200 });
  } catch (e) {
    console.error('inquiry lookup error:', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
