// 043 검증 — 트랜잭션 안에서 실제로 글을 넣어 보고 트리거·CHECK·새 테이블이 설계대로 동작하는지 본다.
// q(sql, params) → rows 배열을 돌려주는 함수만 받는다. run-043.mjs 가 pg 로 감싸 넘긴다.
// 넣은 행은 끝에 지운다(호출한 쪽이 트랜잭션을 되돌리든 확정하든 남지 않는다).

export async function verify043(q, log = console.log) {
  const fails = [];
  const check = (name, cond, detail) => {
    log(`[verify] ${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : ` — ${JSON.stringify(detail)}`}`);
    if (!cond) fails.push(name);
  };
  // 실패해야 하는 문장: 세이브포인트로 감싸 트랜잭션을 살린다
  const expectFail = async (name, sql, params) => {
    await q('SAVEPOINT v043');
    let failed = false;
    try {
      await q(sql, params);
    } catch {
      failed = true;
    }
    await q('ROLLBACK TO SAVEPOINT v043');
    check(name, failed, 'statement succeeded');
  };

  const [s] = await q(
    "INSERT INTO public.chat_sessions (visitor_locale, visitor_name) VALUES ('en', 'Verify 043') RETURNING id"
  );
  const state = async () =>
    (
      await q(
        'SELECT unread_admin_count, awaiting_since, escalation_level, resolved_at, staff_engaged_at, ai_handoff_at FROM public.chat_sessions WHERE id = $1',
        [s.id]
      )
    )[0];
  const insert = (sender, source, text = 'hi') =>
    q(
      "INSERT INTO public.chat_messages (session_id, sender, original_text, original_lang, source, translation_status) VALUES ($1, $2, $3, $4, $5, 'success') RETURNING id",
      [s.id, sender, text, sender === 'visitor' ? 'en' : 'ko', source]
    );

  // 1. 손님 글 → 대기 시작, 직원이 맡지 않음
  const [visitorMsg] = await insert('visitor', 'app');
  let st = await state();
  check('손님 글: 미응답 1 · 대기 시작 · 직원 미배정', st.unread_admin_count === 1 && st.awaiting_since !== null && st.staff_engaged_at === null, st);

  // 2. AI 글(3,000자) → 답변으로 세지 않는다, 직원이 맡은 것도 아니다
  const [aiMsg] = await insert('operator', 'ai', 'a'.repeat(3000));
  st = await state();
  check('AI 글(3,000자): 저장됨 · 미응답 1 · 대기 유지 · 직원 미배정', st.unread_admin_count === 1 && st.awaiting_since !== null && st.staff_engaged_at === null, st);

  // 3. 자동 안내 → 지금과 같다
  await insert('operator', 'auto');
  st = await state();
  check('자동 안내: 미응답 1 · 대기 유지 · 직원 미배정', st.unread_admin_count === 1 && st.awaiting_since !== null && st.staff_engaged_at === null, st);

  // 4. 직원 글(Slack) → 리셋 + 직원이 맡는다. 🙋 표시는 그대로 둔다
  await q('UPDATE public.chat_sessions SET escalation_level = 2, ai_handoff_at = now() WHERE id = $1', [s.id]);
  await insert('operator', 'slack');
  st = await state();
  check('직원 글: 미응답 0 · 대기 끝 · 단계 0 · 직원이 맡음', st.unread_admin_count === 0 && st.awaiting_since === null && st.escalation_level === 0 && st.staff_engaged_at !== null, st);
  check('직원 글: 🙋 표시는 그대로', st.ai_handoff_at !== null, st);

  // 5. 보관하지 않은 대화의 손님 글 → 계속 직원 담당, 받아 둔 가예약도 그대로
  const bookings = async () =>
    (await q('SELECT count(*)::int AS n FROM public.chat_bookings WHERE session_id = $1', [s.id]))[0].n;
  await q("INSERT INTO public.chat_bookings (session_id, visit_date, status) VALUES ($1, '2026-10-14', 'requested')", [s.id]);
  await insert('visitor', 'app');
  st = await state();
  check('손님 글(보관 전): 직원 담당 유지', st.staff_engaged_at !== null && st.unread_admin_count === 1, st);
  check('손님 글(보관 전): 가예약은 그대로', (await bookings()) === 1);

  // 6. 보관(완료)한 뒤의 손님 글 → 완료 해제 + AI에게 돌아간다 + 지난 방문의 가예약을 지운다(새로 받는다)
  await q('UPDATE public.chat_sessions SET resolved_at = now() WHERE id = $1', [s.id]);
  await insert('visitor', 'app');
  st = await state();
  check('손님 글(보관 뒤): 완료 해제 · 직원 담당 해제 · 🙋 표시 해제', st.resolved_at === null && st.staff_engaged_at === null && st.ai_handoff_at === null, st);
  check('손님 글(보관 뒤): 지난 가예약을 지운다', (await bookings()) === 0);

  // 7. CHECK
  await expectFail(
    "출처 'bogus' 는 거부",
    "INSERT INTO public.chat_messages (session_id, sender, original_text, original_lang, source) VALUES ($1, 'operator', 'x', 'ko', 'bogus')",
    [s.id]
  );
  await expectFail(
    '4,001자는 거부',
    "INSERT INTO public.chat_messages (session_id, sender, original_text, original_lang, source) VALUES ($1, 'operator', $2, 'ko', 'ai')",
    [s.id, 'a'.repeat(4001)]
  );

  // 8. 가예약
  const [b] = await q(
    "INSERT INTO public.chat_bookings (session_id, visit_date, visit_time, party_size, contact_channel, contact_handle) VALUES ($1, '2026-10-14', '14:00', 2, 'whatsapp', '+65 9123 4567') RETURNING id, status, created_at",
    [s.id]
  );
  check("가예약: 기본 상태 'collecting'", b.status === 'collecting', b);
  const [b2] = await q(
    "UPDATE public.chat_bookings SET status = 'requested', requested_at = now(), notified_key = '2026-10-14|14:00|2|whatsapp|+65 9123 4567' WHERE id = $1 RETURNING status, updated_at, created_at",
    [b.id]
  );
  check("가예약: 'requested' 로 바뀌고 updated_at 이 채워진다", b2.status === 'requested' && b2.updated_at !== null, b2);
  await expectFail('가예약: 대화마다 한 줄', 'INSERT INTO public.chat_bookings (session_id) VALUES ($1)', [s.id]);
  await expectFail("가예약: 시간 '25:00' 은 거부", "UPDATE public.chat_bookings SET visit_time = '25:00' WHERE id = $1", [b.id]);
  await expectFail("가예약: 채널 'kakao' 는 거부", "UPDATE public.chat_bookings SET contact_channel = 'kakao' WHERE id = $1", [b.id]);

  // 9. AI 호출 기록
  const [t] = await q(
    "INSERT INTO public.chat_ai_turns (session_id, trigger_message_id, reply_message_id, outcome, model, attempts, latency_ms, raw_reply, history_text, staff_note_ko, issues) VALUES ($1, $2, $3, 'sent', 'gpt-6-sol', 2, 3700, 'r', 'h', '요지', ARRAY['money: KRW 1']) RETURNING id, needs_staff, issues",
    [s.id, visitorMsg.id, aiMsg.id]
  );
  check('AI 기록: 저장됨 · needs_staff 기본 false · issues 배열', t.needs_staff === false && Array.isArray(t.issues) && t.issues.length === 1, t);
  await expectFail(
    "AI 기록: 결과 'bogus' 는 거부",
    "INSERT INTO public.chat_ai_turns (session_id, outcome) VALUES ($1, 'bogus')",
    [s.id]
  );

  // 10. 정리 — 세션을 지우면 글·가예약·기록이 함께 지워진다
  await q('DELETE FROM public.chat_sessions WHERE id = $1', [s.id]);
  const [left] = await q(
    'SELECT (SELECT count(*) FROM public.chat_bookings WHERE session_id = $1)::int AS bookings, (SELECT count(*) FROM public.chat_ai_turns WHERE session_id = $1)::int AS turns',
    [s.id]
  );
  check('정리: 세션을 지우면 가예약·기록도 지워진다', left.bookings === 0 && left.turns === 0, left);

  // 11. 새 테이블 둘은 서버(service_role)만 쓴다 — 로그인한 사용자에게 여는 정책이 없어야 한다(이름·연락처가 들어 있다)
  const [pol] = await q(
    "SELECT count(*)::int AS n FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('chat_bookings', 'chat_ai_turns') AND (qual ILIKE '%authenticated%' OR with_check ILIKE '%authenticated%')"
  );
  check('권한: 새 테이블에 로그인 사용자용 정책이 없다', pol.n === 0, pol);

  // 참고: 기존 대화 채우기 결과 (운영에서는 숫자만 본다)
  const [engaged] = await q(
    "SELECT count(*)::int AS n FROM public.chat_sessions WHERE staff_engaged_at IS NOT NULL AND status = 'open' AND resolved_at IS NULL"
  );
  log(`[verify] 직원이 맡은 것으로 표시된 열린 대화: ${engaged.n}건`);

  return { ok: fails.length === 0, fails };
}
