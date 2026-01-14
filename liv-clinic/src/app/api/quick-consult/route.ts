import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// 빠른 상담 폼 스키마 (간소화)
const quickConsultSchema = z.object({
  name: z
    .string()
    .min(1, '성함을 입력해주세요')
    .max(50, '성함은 50자 이하로 입력해주세요'),
  phone: z
    .string()
    .regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, '올바른 휴대폰 번호를 입력해주세요'),
  agreePrivacy: z
    .boolean()
    .refine((val) => val === true, {
      message: '개인정보 수집 및 이용에 동의해주세요',
    }),
  source: z.string().optional(), // 어느 페이지에서 신청했는지
});

export interface QuickConsultResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    created_at: string;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Zod 스키마로 검증
    const validationResult = quickConsultSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return NextResponse.json<QuickConsultResponse>(
        {
          success: false,
          message: '입력 데이터가 올바르지 않습니다',
          error: firstError?.message || '유효성 검사 실패',
        },
        { status: 400 }
      );
    }

    const { name, phone, agreePrivacy, source } = validationResult.data;

    // 전화번호에서 하이픈 제거
    const cleanPhone = phone.replace(/-/g, '');

    // Supabase에 데이터 저장
    const { data, error } = await (supabase as any)
      .from('quick_consultations')
      .insert([
        {
          name,
          phone: cleanPhone,
          agree_privacy: agreePrivacy,
          source: source || 'quick-bar',
          status: 'pending',
        },
      ])
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);

      // 테이블이 없는 경우 consultation_requests 테이블 사용 시도
      if (error.code === '42P01') {
        // 기존 테이블에 저장 시도
        const { data: fallbackData, error: fallbackError } = await (supabase as any)
          .from('consultation_requests')
          .insert([
            {
              name,
              phone: cleanPhone,
              treatment_type: '빠른 상담',
              agree_privacy: agreePrivacy,
              status: 'pending',
            },
          ])
          .select('id, created_at')
          .single();

        if (fallbackError) {
          console.error('Fallback insert error:', fallbackError);
          return NextResponse.json<QuickConsultResponse>(
            {
              success: false,
              message: '상담 신청 저장에 실패했습니다. 잠시 후 다시 시도해주세요.',
              error: fallbackError.message,
            },
            { status: 500 }
          );
        }

        return NextResponse.json<QuickConsultResponse>(
          {
            success: true,
            message: '상담 신청이 완료되었습니다. 빠른 시간 내에 연락드리겠습니다.',
            data: {
              id: fallbackData.id,
              created_at: fallbackData.created_at,
            },
          },
          { status: 201 }
        );
      }

      return NextResponse.json<QuickConsultResponse>(
        {
          success: false,
          message: '상담 신청 저장에 실패했습니다. 잠시 후 다시 시도해주세요.',
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json<QuickConsultResponse>(
      {
        success: true,
        message: '상담 신청이 완료되었습니다. 빠른 시간 내에 연락드리겠습니다.',
        data: {
          id: data.id,
          created_at: data.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Quick consult API error:', error);
    return NextResponse.json<QuickConsultResponse>(
      {
        success: false,
        message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        error: error instanceof Error ? error.message : 'Unknown error',
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
