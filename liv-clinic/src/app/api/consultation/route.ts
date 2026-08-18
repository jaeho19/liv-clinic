import { NextRequest, NextResponse, after } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { consultationFormSchema } from '@/types/consultation';
import type { ConsultationResponse } from '@/types/consultation';
import { hashInquiryPassword } from '@/lib/inquiryPassword';
import { pickUtmFields } from '@/lib/utm';
import { importConsultationToInflow, localeFromRequestParts } from '@/lib/inflow/consultationImport';
import { LOCALES } from '@/i18n/routing';

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json();

    // Zod 스키마로 검증
    const validationResult = consultationFormSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return NextResponse.json<ConsultationResponse>(
        {
          success: false,
          message: '입력 데이터가 올바르지 않습니다',
          error: firstError?.message || '유효성 검사 실패',
        },
        { status: 400 }
      );
    }

    const { name, password, phone, treatment, agreePrivacy, email, country, preferredDate, preferredTime } =
      validationResult.data;

    // 개인정보 동의 확인
    if (!agreePrivacy) {
      return NextResponse.json<ConsultationResponse>(
        {
          success: false,
          message: '개인정보 수집 및 이용에 동의해주세요',
          error: 'Privacy agreement is required',
        },
        { status: 400 }
      );
    }

    // Supabase에 데이터 저장 (admin client로 RLS 우회)
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('consultation_requests')
      .insert({
        name,
        phone,
        treatment_type: treatment,
        agree_privacy: agreePrivacy,
        status: 'pending',
        source: 'consultation-form',
        // 고객 본인 조회용 비밀번호 — 해시로만 저장(평문 저장 안 함)
        password: password ? hashInquiryPassword(password) : null,
        // 희망 상담 일시 — 기존 컬럼에 매핑
        preferred_date: preferredDate || null,
        preferred_time: preferredTime || null,
        // 이메일·국가는 전용 컬럼이 없어 message 텍스트로 접어 보관
        message:
          [email && `Email: ${email}`, country && `Country: ${country}`].filter(Boolean).join(' / ') || null,
        // 세션 첫 터치 UTM (없으면 null — 저장 실패 사유가 되지 않는 부가 필드)
        ...pickUtmFields(body),
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json<ConsultationResponse>(
        {
          success: false,
          message: '상담 신청 저장에 실패했습니다',
          error: 'Internal error',
        },
        { status: 500 }
      );
    }

    // 유입 통계 자동 연동 — 응답과 무관하게 백그라운드 처리 (실패해도 폼 흐름 영향 없음)
    const locale = localeFromRequestParts(request.headers.get('referer'), null, LOCALES);
    after(() =>
      importConsultationToInflow(
        admin,
        {
          id: data.id,
          created_at: data.created_at,
          name,
          phone,
          email: email ?? null,
          treatment_type: treatment,
          source: 'consultation-form',
        },
        { formType: 'consultation', locale, utm: pickUtmFields(body) }
      )
    );

    // 성공 응답
    return NextResponse.json<ConsultationResponse>(
      {
        success: true,
        message: '상담 신청이 완료되었습니다',
        data: {
          id: data.id,
          created_at: data.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Consultation API error:', error);
    return NextResponse.json<ConsultationResponse>(
      {
        success: false,
        message: '서버 오류가 발생했습니다',
        error: 'Internal error',
      },
      { status: 500 }
    );
  }
}

// OPTIONS 메서드 (CORS preflight)
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
