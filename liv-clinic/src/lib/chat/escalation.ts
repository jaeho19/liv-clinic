// 미응답 확대 알림의 "다음 단계" 판정. I/O 없음.
// 원장님 규칙(2026-09-03): 첫 문의 전원 → 이후 담당자만 → 담당자가 답을 안 하면 다른 직원에게.
//   1단계(5분):  담당자 있으면 담당자만, 없으면 전원
//   2단계(12분): 전원 (담당자가 응답하지 않았으므로)
//   3단계(30분): 전원 + #해외문의 피드 🚨
// 영업시간 판정은 호출자(escalationRunner)가 한다.

export const DEFAULT_THRESHOLDS_MIN = [5, 12, 30];

export function parseThresholds(raw: string | undefined | null): number[] {
  const nums = (raw ?? '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length !== 3) return DEFAULT_THRESHOLDS_MIN;
  for (let i = 1; i < 3; i++) if (nums[i] <= nums[i - 1]) return DEFAULT_THRESHOLDS_MIN;
  return nums;
}

export interface EscalationInput {
  awaitingSinceMs: number | null;
  level: number;
  hasAssignee: boolean;
}

export interface EscalationStep {
  nextLevel: 1 | 2 | 3;
  target: 'assignee' | 'all';
  feed: boolean;
  /** 문구에 쓰는 "N분째" — 임계값 */
  minutes: number;
}

/** 한 실행에 한 단계만 올린다. 올릴 것이 없으면 null. */
export function planEscalation(
  input: EscalationInput,
  nowMs: number,
  thresholdsMin: number[] = DEFAULT_THRESHOLDS_MIN
): EscalationStep | null {
  if (input.awaitingSinceMs === null) return null;
  if (input.level < 0 || input.level >= 3) return null;
  const nextLevel = (input.level + 1) as 1 | 2 | 3;
  const threshold = thresholdsMin[nextLevel - 1];
  const waitedMin = (nowMs - input.awaitingSinceMs) / 60_000;
  if (waitedMin < threshold) return null;
  const target: EscalationStep['target'] = nextLevel === 1 && input.hasAssignee ? 'assignee' : 'all';
  return { nextLevel, target, feed: nextLevel === 3, minutes: threshold };
}
