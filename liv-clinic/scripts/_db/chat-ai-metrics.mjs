// AI 응대 · 가예약 실측 SQL (스펙 docs/superpowers/specs/2026-10-02-chat-ai-first-response-design.md §2 · §4.14).
// chat-response-baseline.mjs 의 항목 10·11 · 12(제안형 응대 — 2026-10-12-chat-ai-guided-offers-design.md §4.8)가 쓴다. 모두 읽기 전용 SELECT 다.
// SQL 글만 만들어 돌려주므로 운영 DB 없이 로컬 Postgres(PGlite)에서도 그대로 돌려 볼 수 있다.
//
// 정의
//   - 시험 세션 제외: 이름에 test/테스트/smoke 가 있는 세션 (AI 시험 문의의 이름 `ai-test-…` 도 여기에 걸린다).
//   - 직원 답: sender='operator' 이고 source 가 'auto'(자동 안내)·'ai'(AI 응대)가 아닌 글.
//   - since 는 YYYY-MM-DD (한국 날짜). 호출자가 형식을 확인하고 넘긴다.

const NOT_TEST = `coalesce(cs.visitor_name, '') !~* '(test|테스트|smoke)'`;

/** 043 의 두 테이블이 있는가 — 없으면 항목 10·11 을 건너뛴다. offers = 044 의 컬럼이 있는가 — 없으면 항목 12 를 건너뛴다. */
export const AI_TABLES_SQL = `
  SELECT to_regclass('public.chat_ai_turns') IS NOT NULL AS turns,
         to_regclass('public.chat_bookings') IS NOT NULL AS bookings,
         EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'chat_ai_turns' AND column_name = 'shown_keys') AS offers`;

/**
 * 제안 줄의 key 는 `시술.first` · `시술.second` · `시술.lighter` 꼴이다(offers.ts — 가격 줄 key 와 겹치지 않는 것을 offers.test.ts 가 지킨다).
 * shown_keys 에서 제안 줄만 고를 때 쓴다.
 */
const OFFER_KEY_RE = String.raw`\.(first|second|lighter)$`;
const offerKeysOf = (col) => `ARRAY(SELECT k FROM unnest(${col}) AS k WHERE k ~ '${OFFER_KEY_RE}')`;

/**
 * 항목 12 — 제안형 응대: 제안이 나간 대화 · 답, 제안 종류, 제안 뒤 손님이 다시 쓴 비율, 제안이 나간 대화의 가예약,
 * 거절 · 상한으로 지운 꼬리표 · 혜택 문장 · 가예약에 안내한 혜택. 044 적용 뒤에만 부른다.
 */
export function aiOffersSql(since) {
  return `
  WITH t AS (
    SELECT a.session_id, a.created_at, a.reaction, a.offer_declined, a.offers_dropped,
           ${offerKeysOf('a.shown_keys')} AS offer_keys,
           coalesce('benefit' = ANY(a.shown_keys), false) AS benefit_shown
      FROM public.chat_ai_turns a
      JOIN public.chat_sessions cs ON cs.id = a.session_id
     WHERE a.outcome = 'sent' AND a.created_at >= timestamptz '${since} 00:00+09' AND ${NOT_TEST}),
  o AS (
    SELECT t.session_id, t.created_at, k AS offer_key,
           EXISTS (SELECT 1 FROM public.chat_messages m
                    WHERE m.session_id = t.session_id AND m.sender = 'visitor' AND m.created_at > t.created_at) AS visitor_wrote_after
      FROM t, unnest(t.offer_keys) AS k),
  s AS (SELECT DISTINCT session_id FROM o)
  SELECT (SELECT count(*) FROM s) AS 제안이_나간_대화,
         (SELECT count(*) FROM t WHERE cardinality(offer_keys) > 0) AS 제안이_나간_답,
         (SELECT count(*) FROM o WHERE offer_key LIKE '%.first') AS 제안_1,
         (SELECT count(*) FROM o WHERE offer_key LIKE '%.second') AS 제안_2,
         (SELECT count(*) FROM o WHERE offer_key LIKE '%.lighter') AS 부담_덜한_구성,
         (SELECT round(100.0 * count(*) FILTER (WHERE visitor_wrote_after) / nullif(count(*), 0), 1) FROM o) AS 제안_뒤_손님이_다시_쓴_비율_퍼센트,
         (SELECT count(*) FROM public.chat_bookings b WHERE b.status = 'requested' AND b.session_id IN (SELECT session_id FROM s)) AS 제안한_대화의_가예약,
         (SELECT count(DISTINCT session_id) FROM t WHERE offer_declined) AS 거절한_대화,
         (SELECT coalesce(sum(cardinality(offers_dropped)), 0) FROM t) AS 지운_꼬리표,
         (SELECT count(*) FROM t WHERE benefit_shown) AS 혜택_문장이_나간_답,
         (SELECT count(*) FROM public.chat_bookings b JOIN public.chat_sessions cs ON cs.id = b.session_id
           WHERE b.benefit = 'full' AND b.created_at >= timestamptz '${since} 00:00+09' AND ${NOT_TEST}) AS 가예약_혜택_무료서비스까지,
         (SELECT count(*) FROM public.chat_bookings b JOIN public.chat_sessions cs ON cs.id = b.session_id
           WHERE b.benefit = 'five' AND b.created_at >= timestamptz '${since} 00:00+09' AND ${NOT_TEST}) AS 가예약_혜택_5퍼센트만`;
}

/** 항목 12-2 — AI가 읽은 손님 반응(R1~R7)의 분포. 켠 뒤 점검에서 판정이 맞았는지 볼 때 함께 본다. */
export function aiReactionsSql(since) {
  return `
  SELECT coalesce(a.reaction, '없음') AS 반응, count(*) AS 답
    FROM public.chat_ai_turns a
    JOIN public.chat_sessions cs ON cs.id = a.session_id
   WHERE a.outcome = 'sent' AND a.created_at >= timestamptz '${since} 00:00+09' AND ${NOT_TEST}
   GROUP BY 1
   ORDER BY 1`;
}

/** 항목 10 — AI 응대: 답한 대화 · 답 · 접수 안내로 대신함(G-6) · 직원 확인 필요 · 답을 만드는 시간. */
export function aiTurnsSql(since) {
  return `
  WITH t AS (
    SELECT a.session_id, a.outcome, a.needs_staff, a.attempts, a.latency_ms
      FROM public.chat_ai_turns a
      JOIN public.chat_sessions cs ON cs.id = a.session_id
     WHERE a.created_at >= timestamptz '${since} 00:00+09' AND ${NOT_TEST})
  SELECT count(DISTINCT session_id) FILTER (WHERE outcome = 'sent') AS "AI가_답한_대화",
         count(*) FILTER (WHERE outcome = 'sent') AS 나간_답,
         count(*) FILTER (WHERE outcome = 'fallback') AS 접수안내로_대신함,
         round(100.0 * count(*) FILTER (WHERE outcome = 'fallback')
               / nullif(count(*) FILTER (WHERE outcome IN ('sent', 'fallback')), 0), 1) AS 대신한_비율_퍼센트,
         count(*) FILTER (WHERE outcome = 'superseded') AS 버린_답,
         count(*) FILTER (WHERE outcome = 'sent' AND attempts > 1) AS 다시_쓴_답,
         count(*) FILTER (WHERE outcome = 'sent' AND needs_staff) AS 직원확인_필요,
         round((percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms)
                FILTER (WHERE outcome = 'sent'))::numeric / 1000, 1) AS 답_만드는_시간_중앙값_초
    FROM t`;
}

/** 항목 10-2 — 손님 글이 저장된 때부터 AI 답이 손님 화면에 나갈 때까지(초). G-1 · G-2 의 기준. */
export function aiReplyDelaySql(since) {
  return `
  WITH d AS (
    SELECT EXTRACT(EPOCH FROM (r.created_at - v.created_at)) AS sec
      FROM public.chat_ai_turns a
      JOIN public.chat_sessions cs ON cs.id = a.session_id
      JOIN public.chat_messages v ON v.id = a.trigger_message_id
      JOIN public.chat_messages r ON r.id = a.reply_message_id
     WHERE a.outcome = 'sent' AND a.created_at >= timestamptz '${since} 00:00+09' AND ${NOT_TEST})
  SELECT count(*) AS 답,
         round(min(sec)::numeric, 1) AS 최소,
         round((percentile_cont(0.5) WITHIN GROUP (ORDER BY sec))::numeric, 1) AS 중앙값,
         round(max(sec)::numeric, 1) AS 최대,
         count(*) FILTER (WHERE sec <= 5) AS "5초_안",
         count(*) FILTER (WHERE sec > 15) AS "15초_넘음"
    FROM d`;
}

/** 항목 11 — 가예약: 건수 · 문의 대비 비율(G-4) · 첫 글에서 가예약까지 · 가예약에서 직원 첫 답까지(G-7). */
export function bookingsSql(since) {
  return `
  WITH b AS (
    SELECT bk.status, bk.requested_at,
           (SELECT min(m.created_at) FROM public.chat_messages m
             WHERE m.session_id = bk.session_id AND m.sender = 'visitor') AS first_visitor_at,
           (SELECT min(m.created_at) FROM public.chat_messages m
             WHERE m.session_id = bk.session_id AND m.sender = 'operator' AND m.source NOT IN ('auto', 'ai')
               AND m.created_at > bk.requested_at) AS staff_after_at
      FROM public.chat_bookings bk
      JOIN public.chat_sessions cs ON cs.id = bk.session_id
     WHERE bk.created_at >= timestamptz '${since} 00:00+09' AND ${NOT_TEST}),
  s AS (
    SELECT count(*) AS n
      FROM public.chat_sessions cs
     WHERE cs.created_at >= timestamptz '${since} 00:00+09' AND ${NOT_TEST}
       AND EXISTS (SELECT 1 FROM public.chat_messages m WHERE m.session_id = cs.id AND m.sender = 'visitor'))
  SELECT (SELECT n FROM s) AS 문의,
         count(*) FILTER (WHERE status = 'requested') AS 가예약,
         round(100.0 * count(*) FILTER (WHERE status = 'requested') / nullif((SELECT n FROM s), 0), 1) AS 가예약_비율_퍼센트,
         count(*) FILTER (WHERE status = 'collecting') AS 받다가_멈춤,
         round((percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (requested_at - first_visitor_at)) / 60.0)
                FILTER (WHERE status = 'requested'))::numeric, 1) AS 첫글에서_가예약까지_중앙값_분,
         count(*) FILTER (WHERE status = 'requested' AND staff_after_at IS NOT NULL) AS 직원이_답함,
         count(*) FILTER (WHERE status = 'requested' AND staff_after_at IS NULL) AS 직원답_없음,
         round((percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (staff_after_at - requested_at)) / 60.0)
                FILTER (WHERE status = 'requested' AND staff_after_at IS NOT NULL))::numeric, 1) AS 가예약에서_직원답까지_중앙값_분
    FROM b`;
}

// ── 점검용 내보내기 (scripts/chat-ai-review-export.mjs) ─────────────────────────
// 켠 뒤 매주: AI가 답한 대화를 처음부터 끝까지 읽어 틀린 사실 · 어색한 말 · 넘겼어야 할 질문을 찾는다(설계서 §4.14).

/**
 * AI가 한 번이라도 불린 대화의 글 전부 (시스템 문구 제외), 시간순. AI 글에는 그 차례의 기록이 붙는다.
 * offers = 044 의 컬럼(반응 · 나간 제안 · 거절 · 지운 꼬리표)도 읽는다 — AI_TABLES_SQL 의 offers 가 true 일 때만.
 */
export function aiReviewMessagesSql(since, { offers = false } = {}) {
  const offerColumns = offers
    ? `, t.reaction, ${offerKeysOf('t.shown_keys')} AS offer_keys, t.offer_declined, t.offers_dropped`
    : '';
  return `
  SELECT cs.id AS session_id, cs.visitor_locale, cs.created_at AS session_created_at,
         (coalesce(cs.visitor_name, '') ~* '(test|테스트|smoke)') AS is_test,
         m.sender, m.source, m.original_text, m.translated_text, m.created_at,
         t.staff_note_ko, t.needs_staff, t.staff_reason_ko, t.attempts, t.latency_ms, t.issues${offerColumns}
    FROM public.chat_messages m
    JOIN public.chat_sessions cs ON cs.id = m.session_id
    LEFT JOIN public.chat_ai_turns t ON t.reply_message_id = m.id
   WHERE m.sender <> 'system'
     AND cs.id IN (SELECT session_id FROM public.chat_ai_turns WHERE created_at >= timestamptz '${since} 00:00+09')
   ORDER BY cs.created_at, cs.id, m.created_at`;
}

/** 답이 나가지 못한 차례 (접수 안내로 대신함 · 버림) — 이유와 그때의 손님 글. */
export function aiReviewMissesSql(since) {
  return `
  SELECT a.session_id, a.outcome, a.issues, a.created_at, v.original_text AS visitor_text
    FROM public.chat_ai_turns a
    LEFT JOIN public.chat_messages v ON v.id = a.trigger_message_id
   WHERE a.outcome <> 'sent' AND a.created_at >= timestamptz '${since} 00:00+09'
   ORDER BY a.created_at`;
}

const KST_MS = 9 * 60 * 60 * 1000;
const kst = (d) => new Date(new Date(d).getTime() + KST_MS).toISOString().replace('T', ' ').slice(5, 16);
/** 이메일 · 전화번호를 가린다 — 점검 파일에 연락처를 남기지 않는다 */
const mask = (text) =>
  String(text ?? '')
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '<email>')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '<phone>');
const quote = (text) => mask(text).split('\n').join('\n    ');
/** 반응 R1~R7 의 한국어 (제안형 응대 §4.2) */
const REACTION_KO = { R1: '관심', R2: '가격 부담', R3: '흥정', R4: '유보', R5: '거절', R6: '의료 질문', R7: '예약 분명' };

/**
 * 조회 결과 → 읽기 좋은 마크다운. includeTest 가 아니면 시험 세션(이름에 test)을 뺀다.
 * AI 글은 한국어 번역(original_text)이 큰 글, 손님에게 나간 글(translated_text)이 그 아래다.
 */
export function renderAiReview(messages, misses, { since, includeTest = false } = {}) {
  const sessions = new Map();
  for (const m of messages) {
    if (m.is_test && !includeTest) continue;
    if (!sessions.has(m.session_id)) sessions.set(m.session_id, { head: m, lines: [] });
    const s = sessions.get(m.session_id);
    const at = kst(m.created_at).slice(6);
    if (m.sender === 'visitor') {
      s.lines.push(`- [${at}] **손님**: ${quote(m.original_text)}`);
      if (m.translated_text && m.translated_text !== m.original_text) s.lines.push(`    뜻: ${quote(m.translated_text)}`);
    } else if (m.source === 'ai') {
      const translated = m.original_text !== m.translated_text;
      s.lines.push(`- [${at}] **AI**: ${quote(translated ? m.original_text : m.translated_text)}`);
      if (translated) s.lines.push(`    손님에게 나간 글: ${quote(m.translated_text)}`);
      const meta = [
        m.staff_note_ko ? `요지: ${m.staff_note_ko}` : '',
        m.needs_staff ? `🙋 ${m.staff_reason_ko ?? '직원 확인 필요'}` : '',
        // 다시 써서 나간 답 — 처음 쓴 글이 왜 걸렸는지(chat_ai_turns.issues). 이유에 든 번호 · 메일도 가린다
        m.attempts > 1 ? `다시 쓴 답(${m.attempts}회${m.issues?.length ? ` — 처음 걸린 이유: ${mask(m.issues.join(' | '))}` : ''})` : '',
        m.latency_ms ? `${(m.latency_ms / 1000).toFixed(1)}초` : '',
        // 제안형 응대 (044) — 반응 판정이 맞았는지 · 제안이 알맞았는지 함께 본다
        m.reaction ? `반응 ${m.reaction} ${REACTION_KO[m.reaction] ?? ''}`.trim() : '',
        m.offer_keys?.length ? `제안: ${m.offer_keys.join(', ')}` : '',
        m.offer_declined ? '제안 거절' : '',
        m.offers_dropped?.length ? `지운 꼬리표: ${m.offers_dropped.join(', ')}` : '',
      ].filter(Boolean);
      if (meta.length) s.lines.push(`    (${meta.join(' · ')})`);
    } else if (m.source === 'auto') {
      s.lines.push(`- [${at}] 자동 안내: ${quote(m.translated_text ?? m.original_text)}`);
    } else {
      s.lines.push(`- [${at}] **직원**(${m.source ?? '?'}): ${quote(m.original_text)}`);
    }
  }
  for (const x of misses) {
    const s = sessions.get(x.session_id);
    if (!s) continue;
    const why = x.outcome === 'fallback' ? '접수 안내로 대신함' : '버림(더 새 글이 있거나 직원이 답함)';
    s.lines.push(`- ⚠ [${kst(x.created_at).slice(6)}] ${why}${x.issues?.length ? ` — ${mask(x.issues.join(' | '))}` : ''} · 손님 글: ${quote(x.visitor_text ?? '')}`);
  }
  const out = [`# AI 응대 점검 — ${since} 이후`, '', `대화 ${sessions.size}건${includeTest ? ' (시험 세션 포함)' : ''}. 이메일 · 전화번호는 가렸다.`, ''];
  let n = 0;
  for (const s of sessions.values()) {
    n += 1;
    out.push(`## ${n}. ${s.head.visitor_locale} · ${kst(s.head.session_created_at)} KST${s.head.is_test ? ' · 시험' : ''}`, '', ...s.lines, '');
  }
  return out.join('\n');
}
