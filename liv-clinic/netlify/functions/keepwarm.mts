// 콜드스타트 방지 keep-warm 핑 (Netlify Scheduled Function, 5분 간격).
//
// 채팅 문의는 빈도가 낮아 오프시간 첫 문의가 거의 항상 콜드스타트(+1~3초)를 맞는다.
// Next.js 라우트 전체(@netlify/plugin-nextjs)가 단일 서버 함수로 배포되므로,
// 부작용 없는 동적 라우트 하나를 주기 호출하면 채팅/Slack API 경로가 함께 따뜻하게 유지된다.
// 대상인 GET /api/slack/events 는 헬스체크 전용 응답이라 상태 변화가 없다.
//
// 타입 주의: tsconfig가 **/*.mts를 타입체크하므로 @netlify/functions 타입 import를 쓰지 않는다
// (패키지 미설치 — schedule은 config export만으로 인식된다).

const SITE_URL = process.env.URL ?? 'https://liv-clinic.net';

const keepwarm = async () => {
  const target = `${SITE_URL}/api/slack/events`;
  try {
    const res = await fetch(target, {
      headers: { 'user-agent': 'liv-keepwarm/1.0' },
      signal: AbortSignal.timeout(10_000),
    });
    console.log(`[keepwarm] ${target} -> ${res.status}`);
  } catch (e) {
    console.warn('[keepwarm] ping failed:', e instanceof Error ? e.message : e);
  }
};

export default keepwarm;

export const config = { schedule: '*/5 * * * *' };
