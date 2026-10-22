// 045 검증 — 트랜잭션 안에서 새 컬럼의 꼴 · 기본값 · 조건부 선점이 설계대로인지 본다.
// q(sql, params) → rows 배열을 돌려주는 함수만 받는다. run-045.mjs 가 pg 로 감싸 넘긴다.
// 넣은 행은 끝에 지운다(호출한 쪽이 트랜잭션을 되돌리든 확정하든 남지 않는다).

export async function verify045(q, log = console.log) {
  const fails = [];
  const check = (name, cond, detail) => {
    log(`[verify] ${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : ` — ${JSON.stringify(detail)}`}`);
    if (!cond) fails.push(name);
  };

  const [col] = await q(
    "SELECT data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_sessions' AND column_name = 'ai_summary_at'"
  );
  check('chat_sessions.ai_summary_at: timestamptz · NULL 허용', col?.data_type === 'timestamp with time zone' && col?.is_nullable === 'YES', col);

  const [s] = await q(
    "INSERT INTO public.chat_sessions (visitor_locale, visitor_name) VALUES ('en', 'Verify 045') RETURNING id, ai_summary_at"
  );
  check('새 대화: ai_summary_at 은 비어 있다', s.ai_summary_at === null, s);

  const claim = 'UPDATE public.chat_sessions SET ai_summary_at = now() WHERE id = $1 AND ai_summary_at IS NULL RETURNING id';
  const first = await q(claim, [s.id]);
  const again = await q(claim, [s.id]);
  check('조건부 선점: 처음 1행 · 같은 조건으로 다시 0행', first.length === 1 && again.length === 0, { first: first.length, again: again.length });

  await q('DELETE FROM public.chat_sessions WHERE id = $1', [s.id]);
  const [left] = await q('SELECT count(*)::int AS n FROM public.chat_sessions WHERE id = $1', [s.id]);
  check('정리: 넣은 대화를 지웠다', left.n === 0, left);

  return { ok: fails.length === 0, fails };
}
