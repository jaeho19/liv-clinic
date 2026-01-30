import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

// 시술 옵션 매핑
const treatmentLabels: Record<string, string> = {
  'lifting-ulthera': '울쎄라피 프라임',
  'lifting-thermage': '써마지 FLX',
  'lifting-density': '덴서티',
  'lifting-inmode': '인모드',
  'lifting-shurink': '슈링크',
  'lifting-thread': '실리프팅',
  'antiaging-botox': '보톡스',
  'antiaging-filler': '필러',
  'antiaging-skinbooster': '스킨부스터',
  'laser': '레이저',
  'other': '기타 / 상담 후 결정',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, treatment, preferredDate, preferredTime, message } = body;

    // 유효성 검사
    if (!name || !phone || !treatment) {
      return NextResponse.json(
        { error: '필수 항목을 입력해주세요.' },
        { status: 400 }
      );
    }

    const treatmentLabel = treatmentLabels[treatment] || treatment;

    // Supabase에 상담 데이터 저장
    const admin = createAdminClient();
    const { data, error: dbError } = await admin
      .from('consultation_requests')
      .insert({
        name,
        phone,
        email: email || '',
        treatment_type: treatmentLabel,
        preferred_date: preferredDate || '',
        preferred_time: preferredTime || '',
        message: message || '',
        status: 'pending',
        source: 'website',
      })
      .select('id, created_at')
      .single();

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return NextResponse.json(
        { error: '상담 신청 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    // Resend 이메일 발송 (키가 설정된 경우에만)
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        const formattedDate = preferredDate || '미정';
        const formattedTime = preferredTime || '미정';

        await resend.emails.send({
          from: 'LIV 상담예약 <noreply@livps.co.kr>',
          to: [process.env.CLINIC_EMAIL || 'info@livps.co.kr'],
          subject: `[상담예약] ${name}님 - ${treatmentLabel}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #b4988d;">새로운 상담 예약</h2>
              <p><strong>이름:</strong> ${name}</p>
              <p><strong>연락처:</strong> ${phone}</p>
              <p><strong>이메일:</strong> ${email || '-'}</p>
              <p><strong>관심 시술:</strong> ${treatmentLabel}</p>
              <p><strong>희망 날짜:</strong> ${formattedDate}</p>
              <p><strong>희망 시간:</strong> ${formattedTime}</p>
              ${message ? `<p><strong>문의 내용:</strong> ${message}</p>` : ''}
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Email send error (non-critical):', emailError);
      }
    }

    return NextResponse.json(
      { success: true, message: '상담 예약이 접수되었습니다.', data: { id: data.id } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
