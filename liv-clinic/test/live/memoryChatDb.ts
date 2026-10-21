import { randomUUID } from 'node:crypto';

// 재생 시험용 메모리 DB — supabase-js admin 클라이언트 가운데 AI 응대(turn.ts · bookingStore.ts · contactService.ts)가
// 쓰는 꼴만 흉내 낸다. 운영 DB에 닿지 않고 runAiTurn 을 실제 모델과 함께 끝까지 돌려 보기 위한 것이다.
// 지원: from(table).select(cols, { count, head }) / insert / update + eq · is · gte · order · limit + maybeSingle · single · await

type Row = Record<string, unknown>;
type TableName = 'chat_sessions' | 'chat_messages' | 'chat_bookings' | 'chat_ai_turns';

interface Query {
  table: TableName;
  op: 'select' | 'insert' | 'update';
  payload?: Row;
  filters: Array<(row: Row) => boolean>;
  order?: { column: string; ascending: boolean };
  limit?: number;
  head?: boolean;
  returning?: boolean;
}

export interface MemoryChatDb {
  tables: Record<TableName, Row[]>;
  /** 테스트가 넣는 손님 글 — 시각은 넣는 순서대로 1초씩 늘어난다 */
  addVisitorMessage(sessionId: string, text: string): string;
  from(table: string): unknown;
}

export function memoryChatDb(session: Row & { id: string }, startAt: Date): MemoryChatDb {
  const tables: Record<TableName, Row[]> = {
    chat_sessions: [{ staff_engaged_at: null, ai_handoff_at: null, ...session }],
    chat_messages: [],
    chat_bookings: [],
    chat_ai_turns: [],
  };
  let tick = 0;
  const stamp = (): string => new Date(startAt.getTime() + tick++ * 1000).toISOString();

  const run = (q: Query): { data: unknown; error: { code: string; message: string } | null; count: number | null } => {
    const rows = tables[q.table];
    if (q.op === 'insert') {
      const payload = q.payload ?? {};
      if (q.table === 'chat_bookings' && rows.some((r) => r.session_id === payload.session_id)) {
        return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' }, count: null };
      }
      const row: Row = { id: randomUUID(), created_at: stamp(), ...payload };
      if (q.table === 'chat_bookings' && row.status === undefined) row.status = 'collecting';
      rows.push(row);
      return { data: q.returning ? row : null, error: null, count: null };
    }
    let hit = rows.filter((r) => q.filters.every((f) => f(r)));
    if (q.op === 'update') {
      for (const r of hit) Object.assign(r, q.payload);
      return { data: q.returning ? hit : null, error: null, count: null };
    }
    if (q.order) {
      const { column, ascending } = q.order;
      hit = [...hit].sort((a, b) => (String(a[column]) < String(b[column]) ? -1 : 1) * (ascending ? 1 : -1));
    }
    const count = hit.length;
    if (q.limit !== undefined) hit = hit.slice(0, q.limit);
    return { data: q.head ? null : hit, error: null, count };
  };

  const from = (table: string) => {
    const q: Query = { table: table as TableName, op: 'select', filters: [] };
    const one = () => {
      const r = run(q);
      const first = Array.isArray(r.data) ? (r.data[0] ?? null) : r.data;
      return Promise.resolve({ ...r, data: first });
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b: any = {
      select: (_columns?: string, options?: { count?: string; head?: boolean }) => {
        if (q.op === 'select') q.head = Boolean(options?.head);
        else q.returning = true;
        return b;
      },
      insert: (payload: Row) => ((q.op = 'insert'), (q.payload = payload), b),
      update: (payload: Row) => ((q.op = 'update'), (q.payload = payload), b),
      eq: (c: string, v: unknown) => (q.filters.push((r) => r[c] === v), b),
      is: (c: string, v: unknown) => (q.filters.push((r) => (r[c] ?? null) === v), b),
      gte: (c: string, v: string) => (q.filters.push((r) => String(r[c]) >= v), b),
      order: (column: string, options?: { ascending?: boolean }) => ((q.order = { column, ascending: options?.ascending !== false }), b),
      limit: (n: number) => ((q.limit = n), b),
      maybeSingle: one,
      single: one,
      then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(run(q)).then(res, rej),
    };
    return b;
  };

  return {
    tables,
    from,
    addVisitorMessage(sessionId, text) {
      const id = randomUUID();
      tables.chat_messages.push({
        id,
        session_id: sessionId,
        sender: 'visitor',
        source: 'app',
        original_text: text,
        translated_text: null,
        created_at: stamp(),
      });
      return id;
    },
  };
}
