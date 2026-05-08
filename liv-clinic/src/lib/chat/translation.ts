import 'server-only';

// OpenAI gpt-4o-mini 기반 번역 래퍼.
// - 서버 전용 (server-only import 가드)
// - 5초 타임아웃 + 1회 재시도
// - 시스템 프롬프트로 LIV 클리닉 시술/브랜드명 보존 지시
// - 빈/이모지/URL만 입력은 호출 생략(skipped)

export type SupportedLang = 'ko' | 'en' | 'ja' | 'zh';

const LANG_NAMES: Record<SupportedLang, string> = {
  ko: 'Korean',
  en: 'English',
  ja: 'Japanese',
  zh: 'Chinese (Simplified)',
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
const MODEL = process.env.OPENAI_TRANSLATION_MODEL ?? 'gpt-4o-mini';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

const BRAND_TERMS_KO = '울쎄라, 써마지, 슈링크, 인모드, 보톡스, 필러, 스킨부스터, 리프팅, LIV';
const BRAND_TERMS_EN = 'Ulthera, Thermage, Shurink, InMode, Botox, Filler, Skinbooster, Lifting, LIV';

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
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 800,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: userText },
      ],
    }),
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
