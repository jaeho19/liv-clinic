// supabase-js admin 클라이언트의 체이닝 빌더를 흉내 낸다.
// 각 from() 체인이 끝(maybeSingle/single/await)에 닿으면 handler(op)의 결과를 돌려준다.
export interface FakeOp {
  table: string;
  op: 'select' | 'update' | 'insert';
  filters: Array<[column: string, operator: string, value: unknown]>;
  payload?: unknown;
}

export interface FakeResult {
  data?: unknown;
  error?: { code: string; message?: string } | null;
}

export function fakeAdmin(handler: (op: FakeOp) => FakeResult) {
  const ops: FakeOp[] = [];
  const client = {
    ops,
    from(table: string) {
      const op: FakeOp = { table, op: 'select', filters: [] };
      ops.push(op);
      const finish = () => {
        const r = handler(op);
        return { data: r.data ?? null, error: r.error ?? null };
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b: any = {
        select: () => b,
        update: (payload: unknown) => ((op.op = 'update'), (op.payload = payload), b),
        insert: (payload: unknown) => ((op.op = 'insert'), (op.payload = payload), b),
        eq: (c: string, v: unknown) => (op.filters.push([c, 'eq', v]), b),
        is: (c: string, v: unknown) => (op.filters.push([c, 'is', v]), b),
        not: (c: string, o: string, v: unknown) => (op.filters.push([c, `not.${o}`, v]), b),
        lt: (c: string, v: unknown) => (op.filters.push([c, 'lt', v]), b),
        limit: () => b,
        order: () => b,
        maybeSingle: () => Promise.resolve(finish()),
        single: () => Promise.resolve(finish()),
        then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(finish()).then(res, rej),
      };
      return b;
    },
  };
  return client;
}

export function hasFilter(op: FakeOp, column: string, value: unknown): boolean {
  return op.filters.some(([c, , v]) => c === column && v === value);
}
