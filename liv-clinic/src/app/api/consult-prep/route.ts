import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { classify } from '@/lib/consultPrep/classify';
import { buildResult, type PrepCardResult } from '@/lib/consultPrep/buildResult';
import { treatmentsFor } from '@/lib/consultPrep/rules';
import { PREP_LANGS, type PrepLang } from '@/lib/consultPrep/types';

const schema = z.object({
  concernId: z.string().min(1).max(40),
  // 설계 §12-2: 자유 서술은 필수. 문턱을 낮추려 최소 2자만 요구한다.
  description: z.string().trim().min(2, '어떤 점이 신경 쓰이는지 적어주세요').max(500),
  lang: z.enum(PREP_LANGS as unknown as [PrepLang, ...PrepLang[]]),
});

export interface ConsultPrepResponse {
  success: boolean;
  data?: PrepCardResult;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json<ConsultPrepResponse>(
        { success: false, error: parsed.error.issues[0]?.message ?? '입력이 올바르지 않습니다' },
        { status: 400 }
      );
    }

    const { concernId, description, lang } = parsed.data;

    // 없는 고민 id면 규칙표가 비어 카드가 못 나온다 — 여기서 끊는다.
    if (treatmentsFor(concernId).length === 0) {
      return NextResponse.json<ConsultPrepResponse>(
        { success: false, error: '알 수 없는 고민 항목입니다' },
        { status: 400 }
      );
    }

    const selection = await classify({ concernId, description, lang });
    return NextResponse.json<ConsultPrepResponse>(
      { success: true, data: buildResult(selection, concernId, lang) },
      { status: 200 }
    );
  } catch (error) {
    console.error('consult-prep API error:', error);
    return NextResponse.json<ConsultPrepResponse>(
      { success: false, error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
