import { NextRequest, NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { classify } from '@/lib/consultPrep/classify';
import {
  buildResult,
  treatmentGroupOf,
  type PrepCardResult,
  type TreatmentNameResolver,
} from '@/lib/consultPrep/buildResult';
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

/**
 * 손님 언어의 시술명을 `messages/{locale}.json` 에서 꺼내는 resolver.
 *
 * `TREATMENTS[...].name` 은 한국어 고정이라 그대로 쓰면 lang='en' 손님에게도 카드 2에
 * `울쎄라피 프라임`이 뜬다(2026-09-03 리뷰 Important 3). 번역본은 이미
 * `treatments.{그룹}.{id}.name` 에 있으므로 조회만 붙인다.
 *
 * 키가 없으면 undefined 를 돌려 buildResult 가 한국어로 폴백하게 둔다 — `toning`
 * (레이저 토닝)은 4개 로케일 모두에 키가 없다. `t.has()` 로 먼저 확인하지 않으면
 * next-intl 이 키 문자열 자체를 이름으로 돌려준다.
 */
async function createTreatmentNameResolver(lang: PrepLang): Promise<TreatmentNameResolver> {
  const t = await getTranslations({ locale: lang, namespace: 'treatments' });
  return (treatmentId: string) => {
    const group = treatmentGroupOf(treatmentId);
    if (!group) return undefined;
    const key = `${group}.${treatmentId}.name`;
    return t.has(key) ? t(key) : undefined;
  };
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

    const [selection, nameOf] = await Promise.all([
      classify({ concernId, description, lang }),
      createTreatmentNameResolver(lang),
    ]);
    return NextResponse.json<ConsultPrepResponse>(
      { success: true, data: buildResult(selection, concernId, lang, nameOf) },
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
