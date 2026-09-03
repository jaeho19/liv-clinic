import 'server-only';

// OpenAI 기반 번역 래퍼 (기본 gpt-5.6-luna, OPENAI_TRANSLATION_MODEL로 교체 가능).
// - 서버 전용 (server-only import 가드)
// - 5초 타임아웃 + 1회 재시도
// - 시스템 프롬프트로 LIV 클리닉 시술/브랜드명 보존 지시
// - 빈/이모지/URL만 입력은 호출 생략(skipped)
//
// 모델 교체 이력:
//   gpt-4.1-nano → gpt-5.6-luna  (2026-09) — gpt-4.1-nano가 2026-10-23 종료 공지 대상.
//   OpenAI가 지정한 공식 대체 모델이 gpt-5.6-luna이며, buildOpenAIBody가 계열별 파라미터를
//   자동 처리하므로 이후 교체는 OPENAI_TRANSLATION_MODEL 환경변수만 바꾸면 된다.
//   롤백이 필요하면 gpt-4.1-mini (종료 공지 없음, 구형 파라미터 계열)로 되돌린다.
//
// 지연 최적화 시 하지 말 것 (실측/문서 확인 완료, 2026-09-01):
//   - max_tokens 축소: 출력이 15~27토큰인데 상한만 800이라 개선 0. 긴 문장 잘림 위험만 생긴다.
//   - 시스템 프롬프트 축소: 절반으로 줄여야 1~5% 개선. 오히려 느려진 측정도 있었다.
//   - prompt caching 유도: 1,024토큰 이상 프리픽스에서만 동작. 현재 ~200토큰이라 해당 없음.
//   - service_tier: 'flex': 싸지만 "더 느려지는" 옵션이다. 절대 넣지 말 것.
//   실제 병목은 첫 토큰 도달(TTFT, 실측 571ms 중 412ms)이며, 이는 모델 파라미터로 줄지 않는다.

export type SupportedLang =
  | 'ko'
  | 'en'
  | 'ja'
  | 'zh'
  | 'zh-TW'
  | 'vi'
  | 'th'
  | 'ru'
  | 'fr'
  | 'mn'
  | 'ar';

const LANG_NAMES: Record<SupportedLang, string> = {
  ko: 'Korean',
  en: 'English',
  ja: 'Japanese',
  zh: 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  vi: 'Vietnamese',
  th: 'Thai',
  ru: 'Russian',
  fr: 'French',
  mn: 'Mongolian',
  ar: 'Arabic',
};

export type TranslationStatus = 'success' | 'failed' | 'skipped';

export interface TranslationResult {
  status: TranslationStatus;
  text: string;
  errorCode?: 'api_error' | 'timeout' | 'rate_limit' | 'invalid_response' | 'no_api_key';
  latencyMs: number;
}

const TIMEOUT_MS = Number(process.env.CHAT_TRANSLATION_TIMEOUT_MS ?? 5000);
const RETRY_COUNT = Number(process.env.CHAT_TRANSLATION_RETRY ?? 1);
const MODEL = process.env.OPENAI_TRANSLATION_MODEL ?? 'gpt-5.6-luna';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_OUTPUT_TOKENS = 800;

// 고유명사(장비·브랜드)만 남긴다. 일반 시술 용어는 목록에서 빼야 각 언어의 현지 표현으로 번역된다.
// - 2026-09-01: '리프팅/Lifting' 제거 (원장님 결정). 목록에 있으면 모든 언어에서 영어 'Lifting'이
//   그대로 나가는데, 중국어 '提升'·태국어 등 현지 표현이 있는 언어에서 부자연스럽다.
//   장비명(울쎄라·써마지·슈링크·인모드)은 고유명사이므로 계속 보존한다.
const BRAND_TERMS_KO = '울쎄라, 써마지, 슈링크, 인모드, 보톡스, 필러, 스킨부스터, LIV';
const BRAND_TERMS_EN = 'Ulthera, Thermage, Shurink, InMode, Botox, Filler, Skinbooster, LIV';

function buildSystemPrompt(from: SupportedLang, to: SupportedLang): string {
  if (to === 'ko') {
    return [
      `You are a professional translator for a Korean cosmetic/aesthetic clinic (LIV Plastic Surgery).`,
      `Translate the user's ${LANG_NAMES[from]} message into Korean (한국어).`,
      ``,
      `Rules:`,
      `1. Preserve brand/treatment names (use Korean form when standard exists): ${BRAND_TERMS_EN} → ${BRAND_TERMS_KO}.`,
      `2. Preserve numbers, dates, prices, and proper nouns verbatim.`,
      `3. Use a polite, professional Korean tone (~합니다체).`,
      `4. Output ONLY the translated Korean text. No explanations, no quotes, no language tags.`,
      `5. If the input is already Korean or untranslatable (single emoji, URL only), return it unchanged.`,
    ].join('\n');
  }
  return [
    `You are a professional translator for a Korean cosmetic/aesthetic clinic (LIV Plastic Surgery).`,
    `Translate the user's Korean message into ${LANG_NAMES[to]}.`,
    ``,
    `Rules:`,
    `1. Preserve brand/treatment names: ${BRAND_TERMS_KO} → ${BRAND_TERMS_EN} (or the standard local form).`,
    `2. Preserve numbers, dates, prices, and proper nouns verbatim.`,
    `3. Maintain a polite, professional tone suitable for a medical clinic.`,
    `4. Output ONLY the translated text. No explanations, no quotes, no language tags.`,
    `5. If the input is already in ${LANG_NAMES[to]} or untranslatable (single emoji, URL only), return it unchanged.`,
  ].join('\n');
}

const URL_REGEX = /^(https?:\/\/\S+)$/;
// 이모지 / 공백만 — 단순 휴리스틱 (정확한 emoji-only 판정은 의도적으로 보수적으로)
const EMOJI_OR_PUNCT_ONLY = /^[\s\p{P}\p{S}\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u;

function shouldSkip(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  if (URL_REGEX.test(trimmed)) return true;
  try {
    if (EMOJI_OR_PUNCT_ONLY.test(trimmed)) return true;
  } catch {
    // 일부 런타임에서 \p{Emoji_Presentation} 미지원 시 false로 안전 fallback
  }
  return false;
}

/**
 * gpt-5 계열(gpt-5.6-luna 등)과 o 시리즈인지. 이 계열은 요청 바디 규칙이 다르다.
 * (테스트를 위해 export)
 */
export function isReasoningFamily(model: string): boolean {
  return /^(gpt-5|o[134])/.test(model);
}

/**
 * 모델 계열에 맞는 chat.completions 요청 바디를 만든다. (테스트를 위해 export)
 *
 * gpt-5 계열은 구형 모델과 세 가지가 다르고, **하나라도 어긋나면 400이 난다.**
 * 그런데 이 파일의 실패 정책은 "원문 그대로 반환"이라, 400이 나도 화면은 멀쩡해 보이면서
 * 번역만 조용히 꺼진 채로 운영된다. 그래서 분기를 추측이 아니라 코드로 고정한다.
 *
 *   1. temperature 비기본값 거부 — `Only the default (1) value is supported`
 *   2. max_tokens → max_completion_tokens
 *   3. reasoning_effort 미지정 시 기본값이 'medium'이다. 보이지 않는 추론 토큰이
 *      출력 토큰으로 과금되고 지연이 수 초 붙는다. 단문 번역에는 'none'이 맞다.
 */
export function buildOpenAIBody(
  model: string,
  prompt: string,
  userText: string,
): Record<string, unknown> {
  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: userText },
  ];

  if (isReasoningFamily(model)) {
    return {
      model,
      messages,
      max_completion_tokens: MAX_OUTPUT_TOKENS,
      // 환경변수는 override 용도로만 둔다 — 값을 올리면 그만큼 느려지고 비싸진다.
      reasoning_effort: process.env.OPENAI_TRANSLATION_REASONING_EFFORT || 'none',
    };
  }

  return { model, messages, temperature: 0.2, max_tokens: MAX_OUTPUT_TOKENS };
}

async function callOpenAI(
  prompt: string,
  userText: string,
  signal: AbortSignal,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('NO_API_KEY');

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(buildOpenAIBody(MODEL, prompt, userText)),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error('RATE_LIMIT');
    throw new Error(`API_ERROR_${res.status}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('INVALID_RESPONSE');
  return content;
}

function mapErrorCode(message: string): TranslationResult['errorCode'] {
  if (message === 'NO_API_KEY') return 'no_api_key';
  if (message === 'RATE_LIMIT') return 'rate_limit';
  if (message === 'INVALID_RESPONSE') return 'invalid_response';
  if (message.startsWith('API_ERROR_')) return 'api_error';
  if (message === 'AbortError' || message.toLowerCase().includes('abort')) return 'timeout';
  return 'api_error';
}

/**
 * source 텍스트를 from → to 언어로 번역한다.
 * - from === to 이거나 텍스트가 URL/이모지/빈값이면 status='skipped'
 * - 5초 타임아웃 + 1회 재시도 후 실패 시 status='failed'
 * - 어떤 경우에도 throw하지 않고 결과 객체 반환
 */
export async function translate(
  source: string,
  from: SupportedLang,
  to: SupportedLang,
): Promise<TranslationResult> {
  const start = Date.now();

  if (from === to || shouldSkip(source)) {
    return { status: 'skipped', text: source, latencyMs: Date.now() - start };
  }

  const prompt = buildSystemPrompt(from, to);
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= RETRY_COUNT; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const result = await callOpenAI(prompt, source, controller.signal);
      clearTimeout(timer);
      return { status: 'success', text: result, latencyMs: Date.now() - start };
    } catch (e) {
      clearTimeout(timer);
      lastError = e;
      // 일시적 오류면 짧게 기다린 후 재시도
      if (attempt < RETRY_COUNT) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }

  const message =
    lastError instanceof Error
      ? lastError.message
      : typeof lastError === 'string'
      ? lastError
      : 'API_ERROR';

  return {
    status: 'failed',
    text: source, // 실패 시 원문 그대로 반환 (UI는 원문만 노출 + (번역 실패) 라벨)
    errorCode: mapErrorCode(message),
    latencyMs: Date.now() - start,
  };
}
