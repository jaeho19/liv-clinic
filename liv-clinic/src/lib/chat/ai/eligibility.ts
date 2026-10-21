import type { ChatAiMode } from '@/lib/chat/chatFlags';

// AI가 이 손님 글에 답할 차례인가 (스펙 2026-10-02 chat-ai-first-response §4.2). 순수 함수 — I/O 없음.
// DB에서 읽는 값(직원이 맡았는가, 대화당·하루 호출 수)은 호출자(turn.ts)가 넣어 준다.

export const AI_TEST_NAME_PREFIX = 'ai-test';

/** 시험 모드(CHAT_AI=test)에서 AI가 답하는 문의인가 — 손님 이름이 ai-test 로 시작한다(대소문자·앞 공백 무시). */
export function isAiTestName(name: string | null | undefined): boolean {
  return (name ?? '').trim().toLowerCase().startsWith(AI_TEST_NAME_PREFIX);
}

/** 이 스위치 값에서 이 손님의 대화가 AI 응대 대상인가. 직원이 맡았는지와 한도는 decideAi 가 본다. */
export function aiAppliesTo(mode: ChatAiMode, visitorName: string | null | undefined): boolean {
  if (mode === 'on') return true;
  if (mode === 'test') return isAiTestName(visitorName);
  return false;
}

// 글자·숫자·물음표가 하나도 없으면(이모지·문장부호·공백뿐) 답할 내용이 없다.
// tsconfig target 이 ES2017 이라 \p{…} 는 리터럴이 아니라 RegExp 생성자로 쓴다.
const SUBSTANCE_RE = new RegExp('[\\p{L}\\p{N}?？]', 'u');

export function hasSubstance(text: string): boolean {
  return SUBSTANCE_RE.test(text);
}

export interface AiLimits {
  /** 대화 하나에서 AI를 부르는 횟수의 한도 — 답이 나갔든, 버렸든, 접수 안내로 대신했든 센다 */
  maxReplies: number;
  /** 24시간 동안의 AI 호출 한도 (비용 폭주 방지) */
  dailyMax: number;
}

export const DEFAULT_AI_LIMITS: AiLimits = { maxReplies: 30, dailyMax: 300 };

function positiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return raw && Number.isInteger(n) && n >= 1 ? n : fallback;
}

/** CHAT_AI_MAX_REPLIES · CHAT_AI_DAILY_MAX. 숫자가 아니거나 1보다 작으면 기본값. */
export function readAiLimits(env: Record<string, string | undefined> = process.env): AiLimits {
  return {
    maxReplies: positiveInt(env.CHAT_AI_MAX_REPLIES, DEFAULT_AI_LIMITS.maxReplies),
    dailyMax: positiveInt(env.CHAT_AI_DAILY_MAX, DEFAULT_AI_LIMITS.dailyMax),
  };
}

export type AiSkipReason = 'off' | 'no_key' | 'no_substance' | 'staff_engaged' | 'session_cap' | 'daily_cap';

export interface AiDecisionInput {
  mode: ChatAiMode;
  /** OPENAI_API_KEY 가 있는가 */
  hasKey: boolean;
  visitorName: string | null;
  /** 손님이 방금 쓴 글 */
  text: string;
  /** chat_sessions.staff_engaged_at — 직원이 맡은 대화면 값이 있다 */
  staffEngagedAt: string | null;
  /** 이 대화에서 AI를 부른 횟수 (chat_ai_turns 의 줄 수 — 결과와 상관없이) */
  sessionTurns: number;
  /** 최근 24시간의 AI 호출 수 */
  dailyCalls: number;
  limits: AiLimits;
}

export type AiDecision = { eligible: true } | { eligible: false; reason: AiSkipReason };

/** 여러 조건이 걸리면 앞의 것이 이유가 된다. session_cap 은 호출자가 직원 확인 필요로 넘긴다. */
export function decideAi(i: AiDecisionInput): AiDecision {
  if (!aiAppliesTo(i.mode, i.visitorName)) return { eligible: false, reason: 'off' };
  if (!i.hasKey) return { eligible: false, reason: 'no_key' };
  if (!hasSubstance(i.text)) return { eligible: false, reason: 'no_substance' };
  if (i.staffEngagedAt) return { eligible: false, reason: 'staff_engaged' };
  if (i.sessionTurns >= i.limits.maxReplies) return { eligible: false, reason: 'session_cap' };
  if (i.dailyCalls >= i.limits.dailyMax) return { eligible: false, reason: 'daily_cap' };
  return { eligible: true };
}
