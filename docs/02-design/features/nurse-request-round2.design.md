# Design: nurse-request-round2

> 간호팀 2차 수정요청 — 예상소진 UI/로직 완전 삭제 + 마데카MD 수량 정정 + 긴급소진 UX 개선

## 1. 변경 대상 파일 전체 목록

| # | 파일 경로 | 변경 유형 | 작업 내용 |
|---|----------|----------|----------|
| 1 | `src/lib/inventory-utils.ts` | 수정 | `BurndownResult`, `calculateBurndown()`, `BURNDOWN_SEVERITY_CONFIG` 삭제. `getDisplayName()` 유지 |
| 2 | `src/hooks/useInventoryData.ts` | 수정 | `fetchBurndown()` 삭제, `burndownMap`/`categorySummary` state 제거, 반환 타입 변경 |
| 3 | `src/app/api/admin/inventory/burndown/route.ts` | 삭제 | API 엔드포인트 전체 삭제 |
| 4 | `src/components/admin/inventory/StockCardView.tsx` | 수정 | burndownMap prop 삭제, 예상 소진 뱃지 삭제, 일평균 표시 삭제 |
| 5 | `src/components/admin/inventory/StockTableView.tsx` | 수정 | burndownMap prop 삭제, 예상 소진/일평균 컬럼 삭제, colSpan 수정 |
| 6 | `src/components/admin/inventory/CategoryDetailSection.tsx` | 수정 | burndownMap prop 삭제, StockCardView/StockTableView에 전달 제거 |
| 7 | `src/components/admin/inventory/RestockTab.tsx` | 수정 | burndownMap prop 삭제, 소진 예상일/일사용량 텍스트 삭제, CountdownBar 삭제, 권장 발주량 단순화 |
| 8 | `src/components/admin/inventory/DashboardStatsCards.tsx` | 수정 | `onAlertClick` prop 삭제, 긴급소진 클릭 시 필터만 적용 |
| 9 | `src/components/admin/inventory/StockDashboard.tsx` | 수정 | `categorySummary` prop 삭제, 카테고리별 긴급/주의 배지 제거 |
| 10 | `src/app/admin/(authenticated)/inventory/overview/page.tsx` | 수정 | burndownMap 디스트럭처링 제거, RestockTab/CategoryDetailSection에 burndownMap 전달 제거, onAlertClick 제거 |
| 11 | `supabase/migrations/022_madeca_stock_correction.sql` | 신규 | 마데카MD 수량 정정 SQL |

## 2. 상세 설계

### 2-1. `src/lib/inventory-utils.ts` — burndown 삭제

**삭제 항목:**
```typescript
// 삭제: BurndownResult 인터페이스 (L1-6)
export interface BurndownResult { ... }

// 삭제: calculateBurndown 함수 (L14-47)
export function calculateBurndown(...) { ... }

// 삭제: BURNDOWN_SEVERITY_CONFIG 상수 (L60-64)
export const BURNDOWN_SEVERITY_CONFIG = { ... };
```

**유지 항목:**
```typescript
// 유지: getDisplayName 함수 (L53-58) — 다른 컴포넌트에서 사용 중
export function getDisplayName(item: { name: string; volume_cc?: number | null }): string { ... }
```

**결과 파일:**
```typescript
/**
 * 물품 표시명 반환. volume_cc가 있으면 "이름 Ncc" 형태로 반환.
 */
export function getDisplayName(item: { name: string; volume_cc?: number | null }): string {
  if (item.volume_cc && item.volume_cc > 0) {
    return `${item.name} ${item.volume_cc}cc`;
  }
  return item.name;
}
```

### 2-2. `src/hooks/useInventoryData.ts` — burndown 데이터 제거

**삭제 항목:**
- `import type { BurndownResult }` (L11)
- `BurndownApiItem` 인터페이스 (L33-39)
- `BurndownApiResponse` 인터페이스 (L41-44)
- `fetchBurndown()` 함수 (L46-50)
- `CategorySummaryItem` export (L52)
- `UseInventoryDataReturn`에서 `burndownMap`, `categorySummary` 필드 (L60-61)
- `burndownMap` state (L141)
- `categorySummary` state (L142)
- `Promise.all` 에서 `fetchBurndown()` 호출 제거 (L147-151)
- burndownMap 구성 로직 (L158-168)
- return 객체에서 `burndownMap`, `categorySummary` 제거 (L201-202)

**변경 후 UseInventoryDataReturn:**
```typescript
export interface UseInventoryDataReturn {
  items: InventoryItem[];
  transactions: InventoryTransaction[];
  recipes: ProcedureRecipe[];
  loading: boolean;
  error: string | null;
  alertItems: InventoryItem[];
  loadData: () => Promise<void>;
  todayUsageSessions: UsageSession[];
  todayCategoryUsage: Map<InventoryCategory, number>;
  todayItemUsage: Map<string, number>;
  weeklyItemUsage: Map<string, number[]>;
}
```

**변경 후 loadData:**
```typescript
const loadData = useCallback(async () => {
  try {
    setError(null);
    const [itemsData, recipesData, txData] = await Promise.all([
      fetchItems(),
      fetchRecipes(),
      fetchTransactions(),
    ]);
    setItems(itemsData);
    setRecipes(recipesData);
    setTransactions(txData);
  } catch (e) {
    setError(e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.');
  } finally {
    setLoading(false);
  }
}, []);
```

### 2-3. `src/app/api/admin/inventory/burndown/route.ts` — 전체 삭제

파일 전체 삭제. 더 이상 사용하지 않는 API 엔드포인트.

### 2-4. `src/components/admin/inventory/StockCardView.tsx` — 예상소진 UI 삭제

**삭제 항목:**
- `import { BURNDOWN_SEVERITY_CONFIG, ..., type BurndownResult }` 에서 `BURNDOWN_SEVERITY_CONFIG`와 `BurndownResult` 제거 (L5)
- `StockCardViewProps`에서 `burndownMap` prop 삭제 (L19)
- 컴포넌트 파라미터에서 `burndownMap` 삭제 (L29)
- 예상 소진 뱃지 JSX 블록 삭제 (L140-152)
- 일평균 표시 부분 삭제 (L159, L169-171)

**L140-152 삭제 (예상 소진 뱃지):**
```tsx
// 삭제 전
{burndownMap && (() => {
  const bd = burndownMap.get(item.id);
  if (!bd || bd.daysUntilEmpty === Infinity) return null;
  const scfg = BURNDOWN_SEVERITY_CONFIG[bd.severity];
  return (
    <div className="flex justify-between text-xs items-center">
      <span className="text-[#a09080]">예상 소진</span>
      <span ...>{bd.daysUntilEmpty}일 ({bd.dailyRate}/일)</span>
    </div>
  );
})()}
```

**L157-174 변경 (Today usage insight) — dailyRate 참조 제거:**
```tsx
// 변경 전
{(() => {
  const todayUsed = todayItemUsage?.get(item.id);
  const dailyRate = burndownMap?.get(item.id)?.dailyRate;
  if (!todayUsed && !dailyRate) return null;
  return (
    <div ...>
      {todayUsed && todayUsed > 0 && (...오늘 사용...)}
      {dailyRate && dailyRate > 0 && (...일평균...)}
    </div>
  );
})()}

// 변경 후
{(() => {
  const todayUsed = todayItemUsage?.get(item.id);
  if (!todayUsed || todayUsed <= 0) return null;
  return (
    <div className="flex items-center gap-2 text-[10px] text-[#a09080] mt-3">
      <span className="flex items-center gap-1 text-[#b4988d] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-[#b4988d]" />
        오늘 {todayUsed}개 사용
      </span>
    </div>
  );
})()}
```

**import 변경:**
```typescript
// 변경 전
import { BURNDOWN_SEVERITY_CONFIG, getDisplayName, type BurndownResult } from '@/lib/inventory-utils';

// 변경 후
import { getDisplayName } from '@/lib/inventory-utils';
```

### 2-5. `src/components/admin/inventory/StockTableView.tsx` — 예상소진 컬럼 삭제

**삭제 항목:**
- `import { BURNDOWN_SEVERITY_CONFIG, ..., type BurndownResult }` → `BURNDOWN_SEVERITY_CONFIG`, `BurndownResult` 제거 (L6)
- `StockTableViewProps`에서 `burndownMap` prop 삭제 (L20)
- 컴포넌트 파라미터에서 `burndownMap` 삭제 (L29)
- 예상 소진 `<th>` 삭제 (L46)
- 일평균 `<th>` 삭제 (L47)
- empty row `colSpan` 수정: `(burndownMap ? 9 : 7)` → `7` (expiryMap은 별도 처리 유지) (L55)
- 예상 소진/일평균 `<td>` 블록 삭제 (L132-156)

**colSpan 변경:**
```tsx
// 변경 전
<td colSpan={(burndownMap ? 9 : 7) + (expiryMap ? 1 : 0)} ...>

// 변경 후
<td colSpan={7 + (expiryMap ? 1 : 0)} ...>
```

**import 변경:**
```typescript
// 변경 전
import { BURNDOWN_SEVERITY_CONFIG, getDisplayName, type BurndownResult } from '@/lib/inventory-utils';

// 변경 후
import { getDisplayName } from '@/lib/inventory-utils';
```

### 2-6. `src/components/admin/inventory/CategoryDetailSection.tsx` — burndownMap prop 제거

**삭제 항목:**
- `import type { BurndownResult } from '@/lib/inventory-utils'` (L10)
- `CategoryDetailSectionProps`에서 `burndownMap` prop 삭제 (L24)
- 컴포넌트 파라미터에서 `burndownMap` 삭제 (L39)
- `<StockCardView>` 에서 `burndownMap={burndownMap}` 전달 삭제 (L204)
- `<StockTableView>` 에서 `burndownMap={burndownMap}` 전달 삭제 (L214)

### 2-7. `src/components/admin/inventory/RestockTab.tsx` — burndown 관련 전체 삭제

**삭제 항목:**
- `import type { BurndownResult } from '@/lib/inventory-utils'` (L7)
- `import { BURNDOWN_SEVERITY_CONFIG } from '@/lib/inventory-utils'` (L8)
- `RestockTabProps`에서 `burndownMap` prop 삭제 (L23)
- 컴포넌트 파라미터에서 `burndownMap` 삭제 (L26)
- `RestockCard`에 `burndown` prop 전달 삭제 (L71, L74)
- `CountdownBar` 컴포넌트 전체 삭제 (L136-158)
- `RestockCard` 내부 변경:
  - `burndown` prop 삭제 (L164)
  - `burndownSuggestedQty` 계산 삭제 (L176-178)
  - `suggestedQty` 단순화: `baseSuggestedQty`만 사용 (L179)
  - `daysUntilEmpty` 삭제 (L181-183)
  - `daysText` 삭제 (L185-187)
  - `severityCfg` 삭제 (L189)
  - CountdownBar 렌더링 삭제 (L234-238)
  - 소진 예상/일사용량 뱃지 삭제 (L239-247)
  - 권장 발주량에서 "(30일치)" 텍스트 삭제 (L251-253)

**RestockCard 변경 후:**
```tsx
function RestockCard({
  item,
  urgency,
  onRestock,
  onDismiss,
}: {
  item: InventoryItem;
  urgency: 'critical' | 'warning';
  onRestock: () => void;
  onDismiss: () => void;
}) {
  const isCritical = urgency === 'critical';
  const suggestedQty = Math.max(item.min_stock * 2 - item.current_stock, item.min_stock);
  // ... (나머지 UI는 유지, burndown 관련만 삭제)
}
```

### 2-8. `src/components/admin/inventory/DashboardStatsCards.tsx` — 긴급소진 UX 개선

**변경 내용:**
- `DashboardStatsCardsProps`에서 `onAlertClick` prop 삭제 (L14)
- 긴급 소진 버튼 `onClick`에서 `onAlertClick()` 호출 제거 (L131)

**변경 전:**
```tsx
onClick={() => { handleClick('out'); if (onAlertClick) onAlertClick(); }}
```

**변경 후:**
```tsx
onClick={() => handleClick('out')}
```

**효과**: 긴급 소진 클릭 시 restock 탭으로 이동하지 않고, 현재 카테고리 뷰에서 재고 0인 항목만 필터링됨. 이것이 간호팀이 요청한 "중간 페이지 없이 해당 물품 목록으로 바로 연결" 동작.

### 2-9. `src/components/admin/inventory/StockDashboard.tsx` — categorySummary 제거

**변경 내용:**
- `CategoryBurndownSummary` 인터페이스 삭제 (L8-14)
- `StockDashboardProps`에서 `categorySummary` prop 삭제 (L17-19)
- 컴포넌트 파라미터에서 `categorySummary` 삭제 (L32)
- 카테고리 분포에서 긴급/주의 배지 삭제 (L149-172의 summary 관련 부분)

**참고**: `StockDashboard`는 현재 overview page에서 import되지 않음 (dead code). 하지만 burndown 의존성이 있으므로 정리.

### 2-10. `src/app/admin/(authenticated)/inventory/overview/page.tsx` — 연결 정리

**변경 내용:**

L130: `burndownMap` 디스트럭처링 제거
```typescript
// 변경 전
const {
  items, transactions, loading, error, burndownMap, alertItems, loadData,
  todayUsageSessions, todayCategoryUsage, todayItemUsage, weeklyItemUsage,
} = useInventoryData();

// 변경 후
const {
  items, transactions, loading, error, alertItems, loadData,
  todayUsageSessions, todayCategoryUsage, todayItemUsage, weeklyItemUsage,
} = useInventoryData();
```

L424: `CategoryDetailSection`에서 `burndownMap` 전달 삭제
```tsx
// 삭제
burndownMap={burndownMap}
```

L455: `RestockTab`에서 `burndownMap` 전달 삭제
```tsx
// 삭제
burndownMap={burndownMap}
```

DashboardStatsCards에서 `onAlertClick` 전달 삭제 (해당 부분 검색하여 제거)

### 2-11. `supabase/migrations/022_madeca_stock_correction.sql` — 데이터 정정

```sql
-- 마데카MD 로션 재고 수량 정정 (간호팀 요청 2026-02-20)
-- 200ml(200g): 14 → 19
-- 500ml(500g): 18 → 15

UPDATE inventory_items
SET current_stock = 19
WHERE name LIKE '%마데카%200%';

UPDATE inventory_items
SET current_stock = 15
WHERE name LIKE '%마데카%500%';
```

**주의**: migration 실행 전 Supabase에서 `SELECT name, current_stock FROM inventory_items WHERE name LIKE '%마데카%'`로 정확한 이름 확인 필요.

## 3. 구현 순서

```
Phase 1: 데이터 레이어 정리
├── 1a. burndown API 삭제 (burndown/route.ts)
├── 1b. inventory-utils.ts에서 burndown 삭제
└── 1c. useInventoryData.ts에서 burndown 제거

Phase 2: UI 컴포넌트 정리
├── 2a. StockCardView — burndown prop/UI 삭제
├── 2b. StockTableView — burndown 컬럼/prop 삭제
├── 2c. RestockTab — burndown/CountdownBar 삭제
├── 2d. CategoryDetailSection — burndownMap prop 삭제
├── 2e. StockDashboard — categorySummary prop 삭제
└── 2f. DashboardStatsCards — onAlertClick 삭제

Phase 3: 페이지 연결 정리
└── 3a. overview/page.tsx — burndownMap 전달 제거

Phase 4: DB 데이터 정정
└── 4a. 마데카MD 수량 정정 migration

Phase 5: 검증
├── 5a. npm run build (타입 에러 없음)
└── 5b. 재고 현황 페이지 정상 렌더링 확인
```

## 4. 삭제되는 것 vs 유지되는 것

### 삭제
| 항목 | 파일 |
|------|------|
| `BurndownResult` 타입 | inventory-utils.ts |
| `calculateBurndown()` 함수 | inventory-utils.ts |
| `BURNDOWN_SEVERITY_CONFIG` 상수 | inventory-utils.ts |
| `fetchBurndown()` 함수 | useInventoryData.ts |
| `BurndownApiItem/Response` 타입 | useInventoryData.ts |
| `CategorySummaryItem` export | useInventoryData.ts |
| `burndownMap` state | useInventoryData.ts |
| `categorySummary` state | useInventoryData.ts |
| burndown API route 전체 | burndown/route.ts |
| `CountdownBar` 컴포넌트 | RestockTab.tsx |
| 예상 소진 뱃지 | StockCardView.tsx |
| 예상 소진/일평균 컬럼 | StockTableView.tsx |
| 소진 예상일 텍스트 | RestockTab.tsx |
| `CategoryBurndownSummary` | StockDashboard.tsx |
| `onAlertClick` prop | DashboardStatsCards.tsx |

### 유지
| 항목 | 이유 |
|------|------|
| `getDisplayName()` | StockCardView, StockTableView에서 사용 |
| `alertItems` 로직 | 재고 부족 알림은 burndown과 무관 (`getStockStatus` 기반) |
| `DashboardStatsCards` 4개 카드 | 필터 기능 유지 (onAlertClick만 삭제) |
| `RestockCard` 기본 구조 | burndown 관련만 제거, 발주 추천 UI 유지 |
| "오늘 N개 사용" 표시 | `todayItemUsage` 기반, burndown과 무관 |

## 5. 긴급소진 UX 개선 상세

### 현재 동작 (문제)
```
긴급 소진 카드 클릭
  → stockFilter = 'out' (필터 적용)
  → onAlertClick() → activeTab = 'restock' (탭 전환)
  = restock 탭으로 이동하여 발주 추천 목록 표시
```

### 변경 후 동작 (개선)
```
긴급 소진 카드 클릭
  → stockFilter = 'out' (필터 적용)
  = 현재 카테고리 뷰에서 재고 0인 항목만 표시
  = 카드/테이블 뷰 그대로 유지 → 클릭하면 바로 상세 확인 가능
```

### 필터 해제
- 같은 카드 다시 클릭 → `handleClick('out')` → `activeFilter === 'out'` → `'all'`로 복귀
- 이미 구현된 토글 로직 활용 (추가 작업 불필요)

## 6. 완료 기준

- [ ] `npm run build` 타입 에러 없음
- [ ] "예상 소진", "일평균", burndown 관련 UI 화면에 표시되지 않음
- [ ] `calculateBurndown` 함수 코드에서 완전히 삭제됨
- [ ] `/api/admin/inventory/burndown` 엔드포인트 삭제됨
- [ ] burndownMap prop 체인 완전 제거됨
- [ ] 마데카MD 200g → 19개, 500g → 15개 DB 수정 완료
- [ ] 긴급소진 카드 클릭 시 현재 탭에서 필터만 적용됨 (탭 전환 없음)
- [ ] "오늘 N개 사용" 표시는 정상 유지됨
- [ ] 재고 현황 페이지 (카드뷰/테이블뷰) 정상 렌더링
- [ ] 입고 관리 탭 정상 렌더링 (burndown 뱃지 없이)
