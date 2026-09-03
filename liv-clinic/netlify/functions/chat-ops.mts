// 미응답 확대 알림 (Netlify Scheduled Function, 영업시간대 3분 간격).
// 예약 함수 한도가 30초라 여기서는 fetch 1발만 하고 실제 처리는 POST /api/chat/ops 가 한다.
// 스케줄은 UTC: 1-10시 = KST 10:00~19:59, 월~토. 영업시간 판정은 라우트가 다시 한다(토요일 16시 이후 등).
// 타입 주의: tsconfig가 **/*.mts를 타입체크하므로 @netlify/functions 타입 import를 쓰지 않는다 (keepwarm.mts와 동일).

const SITE_URL = process.env.URL ?? 'https://liv-clinic.net';

const chatOps = async () => {
  const secret = process.env.CHAT_OPS_SECRET;
  if (!secret) {
    console.warn('[chat-ops] CHAT_OPS_SECRET not set — skipping');
    return;
  }
  try {
    const res = await fetch(`${SITE_URL}/api/chat/ops`, {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}`, 'user-agent': 'liv-chat-ops/1.0' },
      signal: AbortSignal.timeout(25_000),
    });
    console.log(`[chat-ops] -> ${res.status} ${await res.text()}`);
  } catch (e) {
    console.warn('[chat-ops] failed:', e instanceof Error ? e.message : e);
  }
};

export default chatOps;

export const config = { schedule: '*/3 1-10 * * 1-6' };
