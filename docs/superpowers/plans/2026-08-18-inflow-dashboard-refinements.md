# 유입 대시보드 소통·개선 4건 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/admin/inflow` 통계 대시보드의 용어 순화·비교 카드 상위 제외 토글·절단 표기·검토탭 문구 보강 (스펙: `docs/superpowers/specs/2026-08-18-inflow-dashboard-refinements-design.md`).

**Architecture:** 순수 분리 헬퍼 `splitTopGroups`를 `stats.ts`에 추가(TDD)하고, 두 비교 카드가 공유하는 `GroupBarCard` 컴포넌트에 토글 UI를 붙인다. 나머지는 문구 1곳(h3)·prop 1개(moreCount)·문장 1개(검토탭) 수준의 국소 수정.

**Tech Stack:** Next.js 16(app router, client component), React 19, Vitest 4, Tailwind 4. DB·i18n 무변경.

## Global Constraints

- 모든 npm/npx 명령은 `D:\dev\LIV_homepage\liv-clinic\`에서 실행 (상위 폴더엔 package.json 없음)
- 커밋은 이 작업의 파일만 명시적으로 `git add` — 워킹트리의 무관한 미커밋 파일(CLAUDE.md 수정분, AGENTS.md 등) 절대 포함 금지
- `npx eslint src` 결과가 베이스라인 **54 errors / 72 warnings** 를 초과하면 안 됨
- `npm run build`는 TLS 프록시 우회 env 필요: `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1`
- 관리자 UI 문구는 한국어 하드코딩(i18n 메시지 파일 건드리지 않음), JSX 안 따옴표는 `&lsquo;&rsquo;` 엔티티 사용(기존 관례)
- 기존 지표 산식·CSV·정렬 동작 무변경. 작업 브랜치: `feature/inflow-dashboard-refinements`

---

### Task 1: `splitTopGroups` 헬퍼 (stats.ts, TDD)

**Files:**
- Modify: `liv-clinic/src/lib/inflow/stats.ts` (파일 끝에 섹션 추가)
- Test: `liv-clinic/src/lib/inflow/__tests__/stats.test.ts` (describe 블록 추가 + import 확장)

**Interfaces:**
- Consumes: 없음 (순수 함수)
- Produces: `export interface TopSplit<T> { excluded: T[]; visible: T[] }` ·
  `export function splitTopGroups<T extends { contacts: number }>(rows: T[], excludeTop: number): TopSplit<T>`
  — 반환 배열 둘 다 contacts 내림차순(동률은 입력 순서 유지), 입력 비파괴. Task 2가 이 시그니처를 사용.

- [ ] **Step 1: 실패하는 테스트 작성**

`stats.test.ts`의 import에 `splitTopGroups` 추가:

```ts
import {
  applyDimensionFilters,
  filterByContactDate,
  computeKpis,
  computeTrend,
  bucketKey,
  groupCounts,
  computeFunnel,
  beforeAfterComparison,
  computeCampaignPerf,
  splitTopGroups,
} from '../stats';
```

파일 끝에 describe 추가:

```ts
describe('splitTopGroups — 비교 카드 상위 제외', () => {
  const rows = (ns: number[]) => ns.map((n, i) => ({ contacts: n, id: i }));

  test('excludeTop 0 이하면 전부 visible (정렬만 적용)', () => {
    const r = rows([5, 3, 1]);
    expect(splitTopGroups(r, 0)).toEqual({ excluded: [], visible: r });
    expect(splitTopGroups(r, -1)).toEqual({ excluded: [], visible: r });
  });

  test('contacts 상위부터 제외한다 (미정렬 입력 포함)', () => {
    const s = splitTopGroups(rows([3, 10, 7, 1]), 2);
    expect(s.excluded.map((x) => x.contacts)).toEqual([10, 7]);
    expect(s.visible.map((x) => x.contacts)).toEqual([3, 1]);
  });

  test('동률은 입력 순서를 유지한다(안정 분리)', () => {
    const r = [
      { contacts: 5, id: 'a' },
      { contacts: 5, id: 'b' },
      { contacts: 2, id: 'c' },
    ];
    const s = splitTopGroups(r, 1);
    expect(s.excluded.map((x) => x.id)).toEqual(['a']);
    expect(s.visible.map((x) => x.id)).toEqual(['b', 'c']);
  });

  test('행 수 이상을 제외하면 전부 excluded', () => {
    const s = splitTopGroups(rows([2, 1]), 5);
    expect(s.visible).toEqual([]);
    expect(s.excluded.map((x) => x.contacts)).toEqual([2, 1]);
  });

  test('입력 배열을 변형하지 않는다', () => {
    const r = rows([1, 9, 4]);
    const copy = r.map((x) => ({ ...x }));
    splitTopGroups(r, 1);
    expect(r).toEqual(copy);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run (liv-clinic/에서): `npx vitest run src/lib/inflow/__tests__/stats.test.ts`
Expected: FAIL — `splitTopGroups`가 export되지 않아 import 에러 또는 TypeError

- [ ] **Step 3: 최소 구현**

`stats.ts` 파일 끝에 추가:

```ts
// ─── 비교 카드 상위 제외 (UI 토글용) ──────────────────
export interface TopSplit<T> {
  excluded: T[];
  visible: T[];
}

/**
 * contacts 상위 excludeTop개를 분리한다. 두 배열 모두 contacts 내림차순
 * (동률은 입력 순서 유지 — Array.sort 안정성), 입력 배열은 변형하지 않는다.
 * excludeTop이 음수면 0, 행 수 초과면 전부 excluded.
 */
export function splitTopGroups<T extends { contacts: number }>(
  rows: T[],
  excludeTop: number
): TopSplit<T> {
  const n = Math.max(0, Math.min(Math.trunc(excludeTop), rows.length));
  const sorted = [...rows].sort((a, b) => b.contacts - a.contacts);
  return { excluded: sorted.slice(0, n), visible: sorted.slice(n) };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/lib/inflow/__tests__/stats.test.ts`
Expected: PASS (기존 케이스 포함 전부)

- [ ] **Step 5: 커밋**

```bash
cd D:/dev/LIV_homepage
git add liv-clinic/src/lib/inflow/stats.ts liv-clinic/src/lib/inflow/__tests__/stats.test.ts
git commit -m "feat(admin): splitTopGroups — 비교 카드 상위 제외 분리 헬퍼 (TDD)"
```

---

### Task 2: GroupBarCard 토글 + 시술 카드 '외 N개' + 용어 교체 (InflowDashboard.tsx)

**Files:**
- Modify: `liv-clinic/src/components/admin/inflow/InflowDashboard.tsx`
  - import 블록(§a) · 집계 useMemo(§b, 현재 178행 부근) · 카드 호출부(§c, 340행 부근) · FunnelCard h3(§d, 476행) · GroupBarCard 전체 교체(§e, 503–546행)

**Interfaces:**
- Consumes: Task 1의 `splitTopGroups` (`@/lib/inflow/stats`에서 import)
- Produces: `GroupBarCard`에 optional prop `moreCount?: number` 추가 (기본 0). 그 외 시그니처 무변경.

- [ ] **Step 1: import에 splitTopGroups 추가 (§a)**

기존 `@/lib/inflow/stats` import 목록의 `groupCounts,` 다음 줄에 `splitTopGroups,` 추가:

```ts
import {
  applyDimensionFilters,
  beforeAfterComparison,
  computeCampaignPerf,
  computeKpis,
  computeTrend,
  groupByTreatmentTag,
  groupCounts,
  splitTopGroups,
  type DimensionFilter,
  type Granularity,
  type StatsLead,
} from '@/lib/inflow/stats';
```

- [ ] **Step 2: 시술 그룹 전체 개수 확보 (§b)**

기존 한 줄:

```ts
const treatmentGroups = useMemo(() => groupByTreatmentTag(dimFiltered, range).slice(0, 12), [dimFiltered, range]);
```

을 두 줄로 교체:

```ts
const treatmentGroupsAll = useMemo(() => groupByTreatmentTag(dimFiltered, range), [dimFiltered, range]);
const treatmentGroups = useMemo(() => treatmentGroupsAll.slice(0, 12), [treatmentGroupsAll]);
```

- [ ] **Step 3: 시술 카드에 moreCount 전달 (§c)**

`title="시술별 문의 비교"`인 `<GroupBarCard` 호출에 prop 추가:

```tsx
<GroupBarCard
  title="시술별 문의 비교"
  caption="연락일 기준 코호트 · 태그 복수 선택 시 중복 집계 · 괄호는 (내원·결제)"
  moreCount={treatmentGroupsAll.length - treatmentGroups.length}
  rows={treatmentGroups.map((g) => ({
    key: g.key,
    label: g.key ? getTreatmentTagLabel(g.key) : '태그 없음',
    badgeClass: g.key ? 'bg-[#b4988d]' : 'bg-gray-300',
    contacts: g.contacts,
    visited: g.visited,
    paid: g.paid,
  }))}
/>
```

(유입 경로 카드는 변경 없음 — moreCount 기본값 0)

- [ ] **Step 4: FunnelCard 제목 교체 (§d)**

```tsx
<h3 className="font-bold text-sm text-[#6d4e42] mb-1">연락→결제 전환 흐름</h3>
```

(캡션 "발생일 기준 · 괄호는 직전 단계 대비 전환율"은 유지)

- [ ] **Step 5: GroupBarCard 교체 (§e)**

`// ─── 그룹 막대 카드 (유입 경로/시술) ───` 섹션의 기존 `GroupBarCard` 함수 전체를 아래로 교체:

```tsx
// ─── 그룹 막대 카드 (유입 경로/시술 — 상위 제외 토글) ──
const EXCLUDE_TOP_OPTIONS = [
  { value: 0, label: '전체' },
  { value: 1, label: '1위 제외' },
  { value: 2, label: '상위 2 제외' },
] as const;

function GroupBarCard({
  title,
  caption,
  rows,
  moreCount = 0,
}: {
  title: string;
  caption: string;
  rows: { key: string | null; label: string; badgeClass: string; contacts: number; visited: number; paid: number }[];
  moreCount?: number;
}) {
  const [excludeTop, setExcludeTop] = useState<0 | 1 | 2>(0);
  const { excluded, visible } = splitTopGroups(rows, excludeTop);
  const total = rows.reduce((s, r) => s + r.contacts, 0);
  const excludedTotal = excluded.reduce((s, r) => s + r.contacts, 0);
  const max = Math.max(...visible.map((r) => r.contacts), 1);
  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
        <h3 className="font-bold text-sm text-[#6d4e42]">{title}</h3>
        {rows.length >= 2 && (
          <div className="flex items-center gap-1 bg-[#f6f6f6] rounded-lg p-0.5" role="group" aria-label="상위 항목 제외">
            {EXCLUDE_TOP_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setExcludeTop(o.value)}
                disabled={o.value >= rows.length}
                aria-pressed={excludeTop === o.value}
                className={`px-2 py-1 text-[11px] rounded-md cursor-pointer disabled:opacity-40 disabled:cursor-default ${
                  excludeTop === o.value ? 'bg-white text-[#6d4e42] font-medium shadow-sm' : 'text-[#8a8a8a] hover:text-[#575756]'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-[11px] text-[#8a8a8a] mb-4">{caption}</p>
      {excludeTop > 0 && excluded.length > 0 && (
        <p className="text-[11px] text-[#8a8a8a] -mt-2 mb-3">
          제외됨: {excluded.map((r) => `${r.label} ${r.contacts}`).join(' · ')}
          {total > 0 ? ` (전체의 ${Math.round((excludedTotal / total) * 100)}%)` : ''} · 막대는 표시 항목 기준
        </p>
      )}
      {rows.length === 0 ? (
        <p className="text-sm text-[#8a8a8a] py-6 text-center">기간 내 데이터가 없습니다.</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-[#8a8a8a] py-6 text-center">제외 후 표시할 항목이 없습니다 — &lsquo;전체&rsquo;를 선택하세요.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => {
            const pct = total > 0 ? Math.round((r.contacts / total) * 100) : 0;
            return (
              <div key={r.key ?? '(미분류)'}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[#575756]">{r.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#6d4e42]">{r.contacts}</span>
                    <span className="text-xs text-[#8a8a8a]">
                      {pct}% ({r.visited}·{r.paid})
                    </span>
                  </div>
                </div>
                <div className="w-full bg-[#f0f0f0] rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full transition-all ${r.badgeClass}`} style={{ width: `${(r.contacts / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {moreCount > 0 && (
        <p className="text-[11px] text-[#8a8a8a] mt-3">외 {moreCount}개 항목 생략 — 필터로 좁혀서 확인하세요.</p>
      )}
    </div>
  );
}
```

동작 규약(스펙 그대로): % 텍스트는 전체(제외 포함) 기준 유지 · 막대 폭 max만 visible 기준 · `rows.length < 2`면 토글 숨김 · 옵션 n은 `n >= rows.length`면 disabled · visible 0건이면 안내 문구(자동 리셋 없음 — setState-in-effect 회피).

- [ ] **Step 6: 타입·린트 확인**

Run (liv-clinic/에서): `npx tsc --noEmit` → 0 errors, `npx eslint src/components/admin/inflow/InflowDashboard.tsx` → 신규 지적 0
Expected: PASS. (컴포넌트 테스트는 기존 관례상 없음 — 스펙 §테스트)

- [ ] **Step 7: 커밋**

```bash
cd D:/dev/LIV_homepage
git add liv-clinic/src/components/admin/inflow/InflowDashboard.tsx
git commit -m "feat(admin): 비교 카드 상위 1~2위 제외 토글 + 시술 '외 N개' 표기 + 퍼널 용어 순화"
```

---

### Task 3: 표준화 검토 탭 빈 상태 설명 보강 (InflowReviewTab.tsx)

**Files:**
- Modify: `liv-clinic/src/components/admin/inflow/InflowReviewTab.tsx` (빈 상태 분기, 현재 145–156행)

**Interfaces:**
- Consumes/Produces: 없음 (문구만)

- [ ] **Step 1: 빈 상태에 설명 문장 추가**

기존:

```tsx
  if (queue.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-10 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="text-sm text-[#575756] font-medium">표준화 검토가 필요한 항목이 없습니다.</p>
        <p className="text-xs text-[#8a8a8a] mt-1">
          새 리드에 국내/해외·유입 경로·시술 태그가 비어 있으면 여기에 다시 나타납니다.
        </p>
        {message && <p className="text-xs text-emerald-600 mt-3">{message}</p>}
      </div>
    );
  }
```

을 아래로 교체 (설명 1문장 추가):

```tsx
  if (queue.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-10 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="text-sm text-[#575756] font-medium">표준화 검토가 필요한 항목이 없습니다.</p>
        <p className="text-xs text-[#8a8a8a] mt-2 max-w-md mx-auto leading-relaxed">
          이 탭은 리드의 자유 입력 기록을 표준 분류(국내/해외 · 유입 경로 · 시술 태그)로 정리하는
          곳으로, 규칙 엔진의 제안을 관리자가 확인한 행만 반영됩니다(기존 값은 덮어쓰지 않음).
        </p>
        <p className="text-xs text-[#8a8a8a] mt-1">
          새 리드에 국내/해외·유입 경로·시술 태그가 비어 있으면 여기에 다시 나타납니다.
        </p>
        {message && <p className="text-xs text-emerald-600 mt-3">{message}</p>}
      </div>
    );
  }
```

- [ ] **Step 2: 타입·린트 확인**

Run: `npx tsc --noEmit` → 0 errors, `npx eslint src/components/admin/inflow/InflowReviewTab.tsx` → 신규 지적 0

- [ ] **Step 3: 커밋**

```bash
cd D:/dev/LIV_homepage
git add liv-clinic/src/components/admin/inflow/InflowReviewTab.tsx
git commit -m "docs(admin): 표준화 검토 탭 빈 상태에 절차 설명 1문장 보강"
```

---

### Task 4: 전체 검증 → master 머지·푸시 → 배포 확인

**Files:**
- 없음 (검증·배포만)

- [ ] **Step 1: 전체 검증 4종 (liv-clinic/에서)**

```bash
cd D:/dev/LIV_homepage/liv-clinic
npx tsc --noEmit          # 기대: 0 errors
npx vitest run            # 기대: 기존 170 + 신규 5 = 175 passed (수치는 실측으로 확인)
npx eslint src            # 기대: ≤ 54 errors / ≤ 72 warnings (베이스라인 초과 금지)
NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 npm run build   # 기대: exit 0 (prebuild verify:i18n 포함)
```

- [ ] **Step 2: master 머지·푸시**

```bash
cd D:/dev/LIV_homepage
git checkout master
git merge --no-ff feature/inflow-dashboard-refinements -m "Merge branch 'feature/inflow-dashboard-refinements'"
git push origin master
```

주의: 머지 전 `git status`로 스테이징 대상 없음 확인(무관 미커밋 파일은 그대로 둔다).

- [ ] **Step 3: 배포 확인 (Netlify — GitHub 커밋 상태 없음이 확인됨)**

공개 페이지는 무변경이므로 마커 폴링 불가. 다음 순서로 확인:

1. `liv-clinic/.env.local`·`netlify.toml`에 NETLIFY 토큰/사이트 ID가 있으면 Netlify API로 최신 deploy state=ready 폴링 (우선).
2. 없으면 청크 해시 폴링 (백그라운드, 60초 × 25회 — 지난 세션 15분 타임아웃 오탐의 재발 방지로 여유 확보):

```bash
S="C:/Users/1/AppData/Local/Temp/claude/D--dev-LIV-homepage/7aea7a69-b9ae-44e2-b9e8-9ba93438aa0c/scratchpad"
grep -o '/_next/static/chunks/[a-zA-Z0-9.-]*' "$S/prod-ko.html" | sort -u > "$S/chunks-before.txt"
for i in $(seq 1 25); do
  sleep 60
  curl -sk --max-time 30 https://liv-clinic.net/ko -o "$S/prod-ko-after.html" || continue
  grep -o '/_next/static/chunks/[a-zA-Z0-9.-]*' "$S/prod-ko-after.html" | sort -u > "$S/chunks-after.txt"
  if ! diff -q "$S/chunks-before.txt" "$S/chunks-after.txt" >/dev/null 2>&1; then
    echo "DEPLOY DETECTED (+${i}min)"; exit 0
  fi
done
echo "TIMEOUT: 25분 내 청크 변경 미관측"; exit 1
```

3. `curl -sk -o /dev/null -w '%{http_code}' https://liv-clinic.net/admin/login` → 200 확인.
4. 청크 변경이 끝내 미관측이면(관리자 청크만 바뀌어 /ko가 동일할 수 있음) **추정 보고 금지** — "빌드 트리거는 푸시로 완료, 원격 관측 수단 없음. 관리자 화면에서 새 토글 확인 요청"으로 정직하게 보고.

- [ ] **Step 4: 태스크 정리·최종 보고**

체크박스 갱신, 사용자에게 변경 요약 + 배포 확인 결과 보고. (기능 보고서 파일 추가는 범위 외 — 스펙에 없음.)
