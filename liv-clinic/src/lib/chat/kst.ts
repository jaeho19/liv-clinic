// KST(UTC+9) 고정 표기. 한국은 서머타임이 없으므로 산술로 충분하다 (businessHours.ts와 같은 방식).
// Slack의 <!date> 토큰은 "보는 기기의 시간대"로 렌더되어 KST를 보장하지 못하므로 서버에서 문자열을 굽는다.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

interface KstParts {
  month: number;
  day: number;
  weekday: (typeof WEEKDAY_KO)[number];
  hour: number;
  minute: number;
}

function kstParts(input: string | Date): KstParts {
  const ms = typeof input === 'string' ? Date.parse(input) : input.getTime();
  const d = new Date(ms + KST_OFFSET_MS);
  return {
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    weekday: WEEKDAY_KO[d.getUTCDay()],
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

const pad = (n: number): string => String(n).padStart(2, '0');

/** `01/01(월) 09:00 KST` */
export function formatKst(input: string | Date): string {
  const p = kstParts(input);
  return `${pad(p.month)}/${pad(p.day)}(${p.weekday}) ${pad(p.hour)}:${pad(p.minute)} KST`;
}

/** `09:00 KST` */
export function formatKstTime(input: string | Date): string {
  const p = kstParts(input);
  return `${pad(p.hour)}:${pad(p.minute)} KST`;
}
