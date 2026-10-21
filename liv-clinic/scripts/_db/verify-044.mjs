// 044 검증 — 트랜잭션 안에서 실제로 글을 넣어 보고 새 컬럼의 기본값 · CHECK 가 설계대로인지 본다.
// q(sql, params) → rows 배열을 돌려주는 함수만 받는다. run-044.mjs 가 pg 로 감싸 넘긴다.
// 넣은 행은 끝에 지운다(호출한 쪽이 트랜잭션을 되돌리든 확정하든 남지 않는다).

export async function verify044(q, log = console.log) {
  const fails = [];
  const check = (name, cond, detail) => {
    log(`[verify] ${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : ` — ${JSON.stringify(detail)}`}`);
    if (!cond) fails.push(name);
  };
  // 실패해야 하는 문장: 세이브포인트로 감싸 트랜잭션을 살린다
  const expectFail = async (name, sql, params) => {
    await q('SAVEPOINT v044');
    let failed = false;
    try {
      await q(sql, params);
    } catch {
      failed = true;
    }
    await q('ROLLBACK TO SAVEPOINT v044');
    check(name, failed, 'statement succeeded');
  };

  const [s] = await q(
    "INSERT INTO public.chat_sessions (visitor_locale, visitor_name) VALUES ('en', 'Verify 044') RETURNING id"
  );

  // 1. 10/2 의 기록(새 컬럼을 모르는 INSERT)도 그대로 들어가고, 새 컬럼은 비어 있다
  const [plain] = await q(
    "INSERT INTO public.chat_ai_turns (session_id, outcome) VALUES ($1, 'sent') RETURNING shown_keys, reaction, offer_declined, offers_dropped",
    [s.id]
  );
  check(
    'AI 기록(새 컬럼 없이): 저장됨 · shown_keys/reaction/offers_dropped 는 NULL · offer_declined 는 false',
    plain.shown_keys === null && plain.reaction === null && plain.offer_declined === false && plain.offers_dropped === null,
    plain
  );

  // 2. 제안형 응대의 기록
  const [t] = await q(
    "INSERT INTO public.chat_ai_turns (session_id, outcome, shown_keys, reaction, offer_declined, offers_dropped) VALUES ($1, 'sent', ARRAY['sculptra.first', 'promo.2026-10.19', 'benefit'], 'R1', false, ARRAY['C03:first_reply']) RETURNING shown_keys, reaction, offers_dropped",
    [s.id]
  );
  check(
    'AI 기록: shown_keys · reaction · offers_dropped 가 들어간다',
    Array.isArray(t.shown_keys) && t.shown_keys.length === 3 && t.reaction === 'R1' && t.offers_dropped?.[0] === 'C03:first_reply',
    t
  );
  await expectFail(
    "AI 기록: 반응 'R8' 은 거부",
    "INSERT INTO public.chat_ai_turns (session_id, outcome, reaction) VALUES ($1, 'sent', 'R8')",
    [s.id]
  );
  await expectFail(
    'AI 기록: offer_declined 는 NULL 이 될 수 없다',
    "INSERT INTO public.chat_ai_turns (session_id, outcome, offer_declined) VALUES ($1, 'sent', NULL)",
    [s.id]
  );

  // 3. 가예약의 혜택
  const [b] = await q('INSERT INTO public.chat_bookings (session_id) VALUES ($1) RETURNING id, benefit', [s.id]);
  check('가예약: benefit 은 처음에 NULL', b.benefit === null, b);
  const [b2] = await q("UPDATE public.chat_bookings SET benefit = 'full' WHERE id = $1 RETURNING benefit", [b.id]);
  check("가예약: benefit 'full' 이 들어간다", b2.benefit === 'full', b2);
  await expectFail("가예약: benefit 'gift' 는 거부", "UPDATE public.chat_bookings SET benefit = 'gift' WHERE id = $1", [b.id]);

  // 4. 정리
  await q('DELETE FROM public.chat_sessions WHERE id = $1', [s.id]);
  const [left] = await q(
    'SELECT (SELECT count(*) FROM public.chat_bookings WHERE session_id = $1)::int AS bookings, (SELECT count(*) FROM public.chat_ai_turns WHERE session_id = $1)::int AS turns',
    [s.id]
  );
  check('정리: 세션을 지우면 가예약·기록도 지워진다', left.bookings === 0 && left.turns === 0, left);

  return { ok: fails.length === 0, fails };
}
