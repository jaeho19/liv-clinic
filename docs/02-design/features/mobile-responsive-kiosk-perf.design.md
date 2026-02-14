# Design: 모바일 반응형 최적화 및 키오스크 속도 개선

> Feature: `mobile-responsive-kiosk-perf`
> Created: 2026-02-14
> Plan Reference: `docs/01-plan/features/mobile-responsive-kiosk-perf.plan.md`

---

## 1. 변경 파일 목록 및 상세 설계

### 1-1. `src/hooks/useInventoryData.ts` — API 병렬화

**현재 문제**: 4개 API를 순차(`await` 체이닝) 호출하여 총 로딩 시간 = sum(각 API 시간)

**변경 설계**:

```typescript
// BEFORE (순차 호출 ~2-3초)
const itemsData = await fetchItems();
setItems(itemsData);
const recipesData = await fetchRecipes();
setRecipes(recipesData);
const txData = await fetchTransactions();
setTransactions(txData);
const burndownData = await fetchBurndown();

// AFTER (병렬 호출 ~max(각 API 시간) = 0.5-1초)
const [itemsData, recipesData, txData, burndownData] = await Promise.all([
  fetchItems(),
  fetchRecipes(),
  fetchTransactions(),
  fetchBurndown(),
]);
setItems(itemsData);
setRecipes(recipesData);
setTransactions(txData);
```

**핵심 고려사항**:
- `fetchBurndown()`은 이미 개별 에러 처리 (빈 배열 반환) → Promise.all 안전
- `fetchItems`, `fetchRecipes`, `fetchTransactions` 실패 시 전체 에러 → 기존 try-catch 유지
- 중간 `setItems`/`setRecipes` 호출을 모두 Promise.all 이후로 이동 → 배치 업데이트로 리렌더 1회

---

### 1-2. `src/components/admin/inventory/KioskView.tsx` — 메모이제이션 & Optimistic UI

#### A. 시술 버튼 컴포넌트 추출 + React.memo

**현재 문제**: `usageItems` 상태가 변경될 때마다 모든 시술 버튼(~20개)이 리렌더

**변경 설계**:

```typescript
// 파일 상단에 메모이제이션된 버튼 컴포넌트 추가
interface ProcedureButtonProps {
  proc: ProcedureType;
  isSelected: boolean;
  hasAnyRecipe: boolean;
  onSelect: (proc: ProcedureType) => void;
}

const ProcedureButton = memo(function ProcedureButton({
  proc, isSelected, hasAnyRecipe, onSelect,
}: ProcedureButtonProps) {
  return (
    <button onClick={() => onSelect(proc)} disabled={!hasAnyRecipe} ...>
      ...
    </button>
  );
});
```

- `memo`로 감싸서 props가 변하지 않으면 리렌더 스킵
- `recipes.filter(...)` 계산을 부모에서 미리 계산하여 prop으로 전달 (렌더 중 필터 제거)

#### B. 사용 물품 리스트 아이템 React.memo

```typescript
interface UsageItemRowProps {
  usage: UsageItem;
  index: number;
  onQtyChange: (idx: number, delta: number) => void;
}

const UsageItemRow = memo(function UsageItemRow({
  usage, index, onQtyChange,
}: UsageItemRowProps) {
  const isOverStock = usage.quantity > usage.currentStock;
  return (
    <div className={...}>
      ...
      <button onClick={() => onQtyChange(index, -1)}>-</button>
      <span>{usage.quantity}</span>
      <button onClick={() => onQtyChange(index, 1)}>+</button>
    </div>
  );
});
```

#### C. handleQtyChange를 useCallback으로 변환

```typescript
// BEFORE (매 렌더마다 새 함수)
const handleQtyChange = (idx: number, delta: number) => { ... };

// AFTER (안정적 참조)
const handleQtyChange = useCallback((idx: number, delta: number) => {
  setUsageItems(prev => prev.map((item, i) => {
    if (i !== idx) return item;
    return { ...item, quantity: Math.max(0, item.quantity + delta) };
  }));
}, []);
```

#### D. computed values 메모이제이션

```typescript
// BEFORE (매 렌더마다 재계산)
const activeCount = usageItems.filter(u => u.quantity > 0).length;
const displayName = selectedType ? ...;
const waitingForOption = ...;

// AFTER
const activeCount = useMemo(() => usageItems.filter(u => u.quantity > 0).length, [usageItems]);
const displayName = useMemo(() => selectedType
  ? selectedOption ? `${selectedType.name} - ${selectedOption.label}` : selectedType.name
  : '사용 물품', [selectedType, selectedOption]);
const waitingForOption = useMemo(() =>
  selectedType && selectedType.options.length > 0 && !selectedOption,
  [selectedType, selectedOption]);
```

#### E. Optimistic UI 패턴 (제출 후)

```typescript
const handleSubmit = async () => {
  // ... validation ...
  setSubmitting(true);

  // 1) Optimistic: 로컬 상태 즉시 반영
  const previousItems = [...items]; // 롤백용 스냅샷 (부모 items)
  // UI 즉시 초기화 (사용자 체감 즉각 반응)
  setToast({ message: `${label} - 재고 차감 완료!`, type: 'success' });
  setSelectedType(null);
  setSelectedOption(null);
  setPatientName('');
  setChartNumber('');
  setConfirmedBy('');
  setUsageItems([]);
  setRefetchKey(k => k + 1);

  try {
    const res = await fetch('/api/admin/inventory/use', { ... });
    if (res.ok) {
      // 2) 백그라운드에서 데이터 동기화 (UI는 이미 초기화됨)
      loadData();
    } else {
      // 3) 실패 시 에러 토스트만 표시 (데이터는 loadData()로 복구)
      const err = await res.json();
      setToast({ message: err.error || '차감 실패', type: 'error' });
      loadData(); // 서버 상태로 복원
    }
  } catch {
    setToast({ message: '네트워크 오류', type: 'error' });
    loadData(); // 서버 상태로 복원
  } finally {
    setSubmitting(false);
  }
};
```

#### F. 레시피 품목 수 사전 계산

```typescript
// KioskView 내부, procedureGroups 아래
const recipeCountMap = useMemo(() => {
  const map = new Map<string, number>();
  for (const group of procedureGroups) {
    for (const proc of group.procedures) {
      const recipeName = PROCEDURE_RECIPE_MAP[proc.id] ?? proc.name;
      map.set(proc.id, recipes.filter(r => r.procedure_name === recipeName).length);
    }
  }
  return map;
}, [procedureGroups, recipes]);
```

→ 렌더 중 `recipes.filter(...)` 호출 제거 → ProcedureButton에 `recipeCount` prop 전달

---

### 1-3. `src/components/admin/inventory/CategoryCard.tsx` — React.memo 적용

```typescript
// BEFORE
export default function CategoryCard({ ... }) { ... }

// AFTER
export default memo(function CategoryCard({ ... }) { ... });
```

- `items` 배열은 부모 `useMemo`에서 이미 안정적 → memo 효과적
- `MiniSparkline`은 이미 순수 함수형 → 별도 memo 불필요 (props 작음)

---

### 1-4. `src/app/[locale]/page.tsx` — 추가 Dynamic Import

**현재**: Hero, Equipment, Signature, CoreValues, Doctor가 정적 import

**변경**: below-fold 섹션을 dynamic import로 전환

```typescript
import dynamic from 'next/dynamic';
import { Hero } from '@/components/sections';  // Hero만 정적 (LCP 보호)

// Below-fold 섹션 지연 로드
const Equipment = dynamic(() => import('@/components/sections/Equipment'), { ssr: true });
const Signature = dynamic(() => import('@/components/sections/Signature'), { ssr: true });
const CoreValues = dynamic(() => import('@/components/sections/CoreValues'), { ssr: true });
const Doctor = dynamic(() => import('@/components/sections/Doctor'), { ssr: true });
const InstagramFeed = dynamic(() => import('@/components/sections/InstagramFeed'), { ssr: true });
const Location = dynamic(() => import('@/components/sections/Location'), { ssr: true });
```

**효과**: 초기 JS 번들에서 Equipment~Doctor 컴포넌트 분리 → FCP/LCP 개선

---

### 1-5. `src/components/layout/FloatingCTA.tsx` — 소형 화면 안전성

**현재 문제**: `bottom: calc(80px + env(safe-area-inset-bottom))` → 320px 화면에서 너무 높을 수 있음

**변경 설계**:

```typescript
// style prop 조정
style={{ bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}

// 추가: 매우 작은 화면 대응 (320px 이하)
className="fixed right-2 sm:right-3 md:right-6 z-40 flex flex-col items-end gap-1.5 sm:gap-2 md:gap-3"
```

**변경 포인트**:
- `right-3` → `right-2` (320px에서 여유 확보)
- `bottom` 80px → 60px (하단 여백 줄임)
- `gap-2` → `gap-1.5` (기본 간격 축소)

---

### 1-6. `src/app/globals.css` — 터치 피드백 강화

**추가할 스타일**:

```css
/* ─── 키오스크 터치 최적화 ─── */
@media (pointer: coarse) {
  .kiosk-btn {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;  /* 더블탭 줌 비활성화 → 300ms 딜레이 제거 */
  }
}
```

> 참고: Next.js는 이미 `<meta name="viewport" content="width=device-width">` 설정으로 대부분의 모바일 브라우저에서 300ms tap delay가 제거되어 있음. `touch-action: manipulation`은 추가 안전장치.

---

## 2. 구현 순서 (Implementation Order)

```
Step 1: useInventoryData.ts — Promise.all 병렬화 (가장 큰 체감 효과)
  ↓
Step 2: KioskView.tsx — ProcedureButton, UsageItemRow memo 추출
  ↓
Step 3: KioskView.tsx — handleQtyChange useCallback + computed useMemo
  ↓
Step 4: KioskView.tsx — Optimistic UI + recipeCountMap
  ↓
Step 5: CategoryCard.tsx — React.memo 적용
  ↓
Step 6: page.tsx — dynamic import 확대
  ↓
Step 7: FloatingCTA.tsx — 소형 화면 조정
  ↓
Step 8: globals.css — touch-action 스타일
```

---

## 3. 영향 범위

| 파일 | 변경 종류 | 리스크 |
|------|-----------|--------|
| `useInventoryData.ts` | API 호출 패턴 변경 | 낮음 (결과 동일) |
| `KioskView.tsx` | 컴포넌트 추출 + 최적화 | 낮음 (동작 동일) |
| `CategoryCard.tsx` | memo 래핑 | 매우 낮음 |
| `page.tsx` | import 방식 변경 | 낮음 (SSR 유지) |
| `FloatingCTA.tsx` | 스타일 미세 조정 | 매우 낮음 |
| `globals.css` | CSS 추가 | 매우 낮음 |

**파괴적 변경 없음** — 모든 변경은 기존 동작을 유지하면서 성능만 개선

---

## 4. 테스트 체크리스트

- [ ] 키오스크: 시술 선택 → 물품 로드 → 수량 변경 → 차감 완료 플로우
- [ ] 키오스크: 옵션이 있는 시술 (2단계 선택) 정상 동작
- [ ] 키오스크: 차감 후 DailyUsageLog 자동 갱신
- [ ] 키오스크: 네트워크 오류 시 에러 토스트 표시
- [ ] 재고현황: CategoryGrid 필터 (전체/일반/화장품) 정상 동작
- [ ] 재고현황: CategoryCard 클릭 → 품목 목록 표시
- [ ] 메인 페이지: Hero → Location 순서대로 모든 섹션 렌더
- [ ] FloatingCTA: 320px, 375px, 768px, 1024px에서 위치 정상
- [ ] 모바일: 터치 반응 즉각적 (300ms 딜레이 없음)
