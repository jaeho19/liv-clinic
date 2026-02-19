# inventory-dashboard-management Design Document

> **Summary**: 재고 대시보드 필터 + 물품 관리(수량 보정, 신규 추가) + 표시 개선(cc 표기, 냉장 배지)
>
> **Project**: LIV Clinic Admin
> **Date**: 2026-02-19
> **Status**: Draft
> **Planning Doc**: [inventory-dashboard-management.plan.md](../01-plan/features/inventory-dashboard-management.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. 대시보드 상태 카드를 인터랙티브하게 만들어 상태별 필터링 지원
2. 물품 상세에서 수량 직접 보정 기능 제공 (사유 입력 필수)
3. 관리자가 새 물품을 직접 등록할 수 있는 폼 UI 제공
4. 냉장 물품 시각적 구분 및 약물 용량(cc) 표기 반영
5. 모바일/PC 양쪽 반응형 대응

### 1.2 Design Principles

- **최소 변경**: 기존 컴포넌트 구조를 최대한 유지하며 prop 추가로 확장
- **DB 우선**: 단위/이름 변경은 이미 DB에서 처리됨 → UI는 동적 표시만 확인
- **기존 패턴 준수**: 기존 StockModal, API route 패턴을 그대로 따름

---

## 2. Architecture

### 2.1 Component Diagram

```
overview/page.tsx
├── DashboardStatsCards ─── [수정] 4카드 클릭 필터 + activeFilter prop
├── TodayUsageSummary
├── CategoryGrid ─── [수정] stockFilter prop 전달
│   └── CategoryCard
├── CategoryDetailSection ─── [수정] stockFilter로 items 추가 필터링
│   ├── StockCardView ─── [수정] 냉장배지 + cc표기
│   ├── StockTableView ─── [수정] 냉장배지 + cc표기
│   └── DetailPanel ─── [수정] 냉장라벨 + cc표기 + 보정버튼
│       └── StockAdjustModal ─── [신규]
├── AddItemModal ─── [신규]
├── StockModal (기존)
├── HistoryTab
└── RestockTab
```

### 2.2 Data Flow

```
[상태카드 클릭] → stockFilter state(page.tsx) → CategoryGrid/CategoryDetailSection 필터링
[수량보정 클릭] → StockAdjustModal → POST /api/admin/inventory/adjust → DB → loadData()
[물품추가 클릭] → AddItemModal → POST /api/admin/inventory → DB → loadData()
```

---

## 3. 상세 설계

### 3-1. #16 약물 cc 표기 (getDisplayName 유틸)

**파일**: `src/lib/inventory-utils.ts`

```typescript
/**
 * 물품 표시명 반환. volume_cc가 있으면 "이름 Ncc" 형태로 반환.
 * 예: { name: '리쥬란 힐러', volume_cc: 2 } → '리쥬란 힐러 2cc'
 */
export function getDisplayName(item: { name: string; volume_cc?: number | null }): string {
  if (item.volume_cc && item.volume_cc > 0) {
    return `${item.name} ${item.volume_cc}cc`;
  }
  return item.name;
}
```

**적용 위치** (3개 컴포넌트):

| 컴포넌트 | 현재 코드 | 변경 코드 |
|----------|----------|----------|
| `StockCardView.tsx:74` | `{item.name}` | `{getDisplayName(item)}` |
| `StockTableView.tsx:81` | `{item.name}` | `{getDisplayName(item)}` |
| `DetailPanel.tsx:85` | `{item.name}` | `{getDisplayName(item)}` |

---

### 3-2. #15 냉장 표기 (RefrigeratedBadge)

**인라인 배지** (별도 컴포넌트 없이 조건부 렌더링):

```tsx
{item.is_refrigerated && (
  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-md">
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18l4 4m-4-4L8 7m4 14l4-4m-4 4l-4-4M3 12h18M3 12l4-4m-4 4l4 4m14-4l-4-4m4 4l-4 4" />
    </svg>
    냉장
  </span>
)}
```

**적용 위치**:

| 컴포넌트 | 위치 | 설명 |
|----------|------|------|
| `StockCardView.tsx` | `item.name` 바로 아래 (line 75 근처) | 이름 아래 배지 표시 |
| `StockTableView.tsx` | `item.name` 오른쪽 (line 81 근처) | 이름 옆 인라인 배지 |
| `DetailPanel.tsx` | Info grid 섹션 (line 96 이후) | "보관" 행 추가: "냉장 보관" |

---

### 3-3. #10 대시보드 필터

#### 3-3-1. 타입 정의

`overview/page.tsx`에 추가:

```typescript
type StockFilter = 'all' | 'normal' | 'low' | 'out';
```

#### 3-3-2. DashboardStatsCards 수정

**Props 변경**:

```typescript
interface DashboardStatsCardsProps {
  items: InventoryItem[];
  todayCategoryUsage: Map<InventoryCategory, number>;
  alertItems: InventoryItem[];
  onAlertClick?: () => void;           // 기존 유지 (하위 호환)
  activeFilter?: StockFilter;          // 추가
  onFilterChange?: (filter: StockFilter) => void;  // 추가
}
```

**UI 변경**:
- 4개 카드를 모두 `<button>`으로 변경 (현재: 총 품목/정상/부족은 `<div>`, 긴급만 `<button>`)
- `activeFilter`와 일치하는 카드에 시각적 강조 (ring + 배경색 진하게)
- 클릭 시 `onFilterChange` 호출 (같은 카드 재클릭 시 `'all'`로 리셋)

```
┌──────────────────────────────────────────────────────────────┐
│  [총 품목: 192]  [정상: 155]  [부족: 32]  [긴급: 5]          │
│       ↑              ↑            ↑           ↑              │
│    filter=all   filter=normal  filter=low  filter=out        │
│  (모두 클릭 가능, 선택 시 ring-2 강조)                         │
└──────────────────────────────────────────────────────────────┘
```

**카드별 active 스타일**:

| 카드 | 기본 스타일 | 선택 시 추가 스타일 |
|------|-----------|-----------------|
| 총 품목 | `from-[#faf8f7] to-white` | `ring-2 ring-[#6d4e42]/20` |
| 정상 재고 | `from-emerald-50/50 to-white` | `ring-2 ring-emerald-300` |
| 부족 경고 | `from-amber-50/50 to-white` | `ring-2 ring-amber-300` |
| 긴급 소진 | `from-red-50/50 to-white` | `ring-2 ring-red-300` |

#### 3-3-3. overview/page.tsx 수정

```typescript
const [stockFilter, setStockFilter] = useState<StockFilter>('all');

// DashboardStatsCards에 전달
<DashboardStatsCards
  items={items}
  todayCategoryUsage={todayCategoryUsage}
  alertItems={alertItems}
  onAlertClick={() => setActiveTab('restock')}
  activeFilter={stockFilter}
  onFilterChange={setStockFilter}
/>

// CategoryGrid에 전달
<CategoryGrid
  items={items}
  selectedCategory={selectedCategory}
  onSelectCategory={setSelectedCategory}
  stockFilter={stockFilter}            // 추가
  ...
/>

// CategoryDetailSection에 전달
<CategoryDetailSection
  category={selectedCategory}
  items={items}
  stockFilter={stockFilter}            // 추가
  ...
/>
```

#### 3-3-4. CategoryDetailSection 수정

```typescript
interface CategoryDetailSectionProps {
  // ... 기존 props
  stockFilter?: StockFilter;  // 추가
}

// filtered 계산에 stockFilter 반영
const filtered = useMemo(() => {
  return categoryItems.filter(item => {
    // 상태 필터
    if (stockFilter && stockFilter !== 'all') {
      const status = getStockStatus(item);
      if (stockFilter !== status) return false;
    }
    // 서브카테고리 필터 (기존)
    if (subCategoryFilter !== 'all' && item.sub_category !== subCategoryFilter) return false;
    // 검색 (기존)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || (item.supplier || '').toLowerCase().includes(q);
    }
    return true;
  });
}, [categoryItems, subCategoryFilter, searchQuery, stockFilter]);
```

#### 3-3-5. CategoryGrid 수정

```typescript
interface CategoryGridProps {
  // ... 기존 props
  stockFilter?: StockFilter;  // 추가
}

// 카테고리별 아이템 수 계산 시 stockFilter 반영
const categories = useMemo(() => {
  const map = new Map<InventoryCategory, InventoryItem[]>();
  for (const item of activeItems) {
    // stockFilter 적용
    if (stockFilter && stockFilter !== 'all') {
      const status = getStockStatus(item);
      if (stockFilter !== status) continue;
    }
    const list = map.get(item.category) || [];
    list.push(item);
    map.set(item.category, list);
  }
  // ... 나머지 동일
}, [activeItems, filterMode, stockFilter]);
```

---

### 3-4. #11 수량 보정 (StockAdjustModal)

#### 3-4-1. 컴포넌트 설계

**파일**: `src/components/admin/inventory/StockAdjustModal.tsx` (신규)

```typescript
interface StockAdjustModalProps {
  item: InventoryItem;
  onSubmit: (newQuantity: number, reason: string) => void | Promise<void>;
  onClose: () => void;
  submitting?: boolean;
}
```

**UI 레이아웃 (모바일 대응)**:

```
┌──────────────────────────────────────┐
│  수량 보정                    [X]     │
│  리쥬란 힐러 2cc                      │
├──────────────────────────────────────┤
│                                      │
│  현재 재고: 15 바이알                  │
│                                      │
│  수정할 수량 *                        │
│  ┌────────────────────────────────┐  │
│  │  15                            │  │
│  └────────────────────────────────┘  │
│  변경량: +0 (변경 없음)               │
│                                      │
│  수정 사유 *                         │
│  ┌────────────────────────────────┐  │
│  │  입고 실수 보정                  │  │
│  └────────────────────────────────┘  │
│  예: 입고 실수 보정, 재고 실사 등      │
│                                      │
│  ┌─────────┐  ┌─────────────────┐   │
│  │  취소    │  │  수량 보정 확인   │   │
│  └─────────┘  └─────────────────┘   │
└──────────────────────────────────────┘
```

**유효성 검증**:
- 수량: 0 이상 정수 (음수 불가)
- 사유: 필수 입력 (빈 문자열 불가)
- 현재 수량과 동일하면 제출 비활성화
- 변경량 실시간 표시: `+5` (증가) / `-3` (감소) / `변경 없음`

**스타일**: 기존 `StockModal`과 동일한 모달 패턴 (고정 오버레이 + 중앙 카드)

#### 3-4-2. API 설계

**엔드포인트**: `POST /api/admin/inventory/adjust`

**파일**: `src/app/api/admin/inventory/adjust/route.ts` (신규)

**Request**:
```json
{
  "item_id": "uuid",
  "new_quantity": 15,
  "reason": "입고 실수 보정"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "transaction_id": "uuid",
  "old_quantity": 12,
  "new_quantity": 15
}
```

**Error Responses**:
- `400`: item_id, new_quantity, reason 누락 또는 유효하지 않음
- `401`: 인증 실패
- `404`: 해당 item_id의 품목이 없음
- `500`: 서버 오류

**서버 로직** (기존 restock API 패턴 준수):

```typescript
export async function POST(request: NextRequest) {
  // 1. 인증 확인 (supabase.auth.getUser)
  // 2. 요청 검증 (item_id, new_quantity >= 0, reason 필수)
  // 3. admin client로 RPC 또는 직접 쿼리:
  //    a. inventory_items에서 현재 수량 조회
  //    b. current_stock 업데이트
  //    c. inventory_transactions에 adjust 기록
  //       - tx_type: 'adjust'
  //       - quantity: Math.abs(new_quantity - old_quantity)
  //       - note: `[보정] ${reason} (${old_quantity} → ${new_quantity})`
  //       - created_by: user.email
  // 4. 결과 반환
}
```

**DB 쿼리** (RPC가 없으면 직접 쿼리):

```sql
-- 1. 현재 수량 조회
SELECT current_stock FROM inventory_items WHERE id = $1;

-- 2. 수량 업데이트
UPDATE inventory_items SET current_stock = $2, updated_at = now() WHERE id = $1;

-- 3. 이력 기록
INSERT INTO inventory_transactions (item_id, tx_type, quantity, note, created_by)
VALUES ($1, 'adjust', $3, $4, $5);
-- quantity = abs(new - old), note에 방향/사유 포함
```

#### 3-4-3. DetailPanel 수정

```typescript
interface DetailPanelProps {
  item: InventoryItem;
  txs: InventoryTransaction[];
  onClose: () => void;
  onDelete: () => void;
  onAdjust?: (item: InventoryItem) => void;  // 추가
}
```

"품목 삭제" 버튼 위에 "수량 보정" 버튼 추가:

```tsx
<button
  onClick={() => onAdjust?.(item)}
  className="w-full text-xs text-blue-600 hover:text-blue-800 py-2.5 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer font-medium"
>
  수량 보정
</button>
```

#### 3-4-4. overview/page.tsx 통합

```typescript
const [adjustModal, setAdjustModal] = useState<InventoryItem | null>(null);

// DetailPanel에 onAdjust 전달
<CategoryDetailSection
  ...
  onAdjust={setAdjustModal}
/>

// AdjustModal 렌더링
{adjustModal && (
  <StockAdjustModal
    item={adjustModal}
    onSubmit={async (newQty, reason) => {
      await handleAdjust(adjustModal.id, newQty, reason);
      setAdjustModal(null);
    }}
    onClose={() => setAdjustModal(null)}
    submitting={submitting}
  />
)}
```

---

### 3-5. #14 신규 물품 추가 (AddItemModal)

#### 3-5-1. API 확인

**기존 API가 이미 존재함**: `POST /api/admin/inventory` → `create_inventory_item` RPC

현재 body에 `is_refrigerated`와 `volume_cc`가 포함되지 않으므로 **API 수정 필요**:

```typescript
// 기존 p_data에 추가
p_data: {
  ...기존 필드,
  is_refrigerated: body.is_refrigerated || false,  // 추가
  volume_cc: body.volume_cc || undefined,          // 추가
}
```

#### 3-5-2. 컴포넌트 설계

**파일**: `src/components/admin/inventory/AddItemModal.tsx` (신규)

```typescript
interface AddItemModalProps {
  onSubmit: (data: NewItemData) => void | Promise<void>;
  onClose: () => void;
  submitting?: boolean;
}

interface NewItemData {
  name: string;
  category: InventoryCategory;
  sub_category?: string;
  specification?: string;
  unit: string;
  unit_price: number;
  current_stock: number;
  min_stock: number;
  supplier?: string;
  storage_note?: string;
  is_refrigerated: boolean;
  volume_cc?: number;
}
```

**UI 레이아웃**:

```
┌──────────────────────────────────────────────┐
│  새 물품 추가                         [X]     │
├──────────────────────────────────────────────┤
│                                              │
│  물품명 *           ┌────────────────────┐   │
│                     │                    │   │
│                     └────────────────────┘   │
│                                              │
│  카테고리 *  ┌──────────────┐  단위 *  ┌───┐ │
│              │ ▼ 주사제     │          │ 개│ │
│              └──────────────┘          └───┘ │
│                                              │
│  세부 분류    ┌──────────────┐               │
│              │ (선택)       │               │
│              └──────────────┘               │
│                                              │
│  규격/사양    ┌────────────────────────────┐ │
│              │                            │ │
│              └────────────────────────────┘ │
│                                              │
│  단가(원) *    ┌──────────┐                  │
│               │  0       │                  │
│               └──────────┘                  │
│                                              │
│  초기 재고 *   ┌──────┐  최소 재고 *  ┌──────┐│
│               │  0   │              │  0   ││
│               └──────┘              └──────┘│
│                                              │
│  용량(cc)     ┌──────┐  냉장 보관    [○ OFF] │
│               │      │                      │
│               └──────┘                      │
│                                              │
│  공급사       ┌────────────────────────────┐ │
│              │ (선택)                      │ │
│              └────────────────────────────┘ │
│                                              │
│  ┌──────────┐  ┌──────────────────────────┐ │
│  │  취소     │  │  물품 등록               │ │
│  └──────────┘  └──────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**필드 상세**:

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| name | text | O | - | 물품명 |
| category | select | O | 'injection' | 8개 카테고리 드롭다운 |
| sub_category | select | X | - | 카테고리별 동적 옵션 |
| specification | text | X | - | 규격/사양 |
| unit | text | O | '개' | 단위 (자주 쓰는 값 suggestions) |
| unit_price | number | O | 0 | 단가 |
| current_stock | number | O | 0 | 초기 재고 |
| min_stock | number | O | 0 | 최소 재고 기준 |
| is_refrigerated | toggle | X | false | 냉장 보관 여부 |
| volume_cc | number | X | - | 용량(cc) |
| supplier | text | X | - | 공급사 |

**단위 suggestions**: `['개', '바이알', '시린지', '박스', 'ml', '병', 'EA']`

**카테고리별 서브카테고리 매핑**: admin.ts의 INVENTORY_SUBCATEGORY_LABELS에서 동적 로드

#### 3-5-3. overview/page.tsx 통합

헤더 영역에 버튼 추가:

```tsx
const [showAddItem, setShowAddItem] = useState(false);

// 헤더 영역
<div className="flex ... gap-3 mb-5">
  <div>
    <h2>재고 현황</h2>
    ...
  </div>
  <div className="flex gap-2">
    <button onClick={() => setShowAddItem(true)} className="... bg-emerald-600 text-white ...">
      + 새 물품 추가
    </button>
    <Link href="/admin/inventory" ...>물품 사용 기록</Link>
  </div>
</div>

// 모달 렌더링
{showAddItem && (
  <AddItemModal
    onSubmit={async (data) => {
      await handleAddItem(data);
      setShowAddItem(false);
    }}
    onClose={() => setShowAddItem(false)}
    submitting={submitting}
  />
)}
```

---

## 4. API Specification

| Method | Path | Description | Auth | 상태 |
|--------|------|-------------|------|------|
| POST | `/api/admin/inventory` | 새 품목 등록 | Required | 기존 (수정) |
| POST | `/api/admin/inventory/adjust` | 수량 보정 | Required | **신규** |

### 4.1 POST /api/admin/inventory (기존 수정)

**변경 사항**: `p_data`에 `is_refrigerated`, `volume_cc` 필드 추가

```typescript
p_data: {
  ...기존 필드,
  is_refrigerated: body.is_refrigerated || false,
  volume_cc: body.volume_cc || undefined,
}
```

### 4.2 POST /api/admin/inventory/adjust (신규)

**Request**:
```json
{
  "item_id": "uuid-string",
  "new_quantity": 15,
  "reason": "입고 실수 보정"
}
```

**Validation**:
- `item_id`: UUID 필수
- `new_quantity`: 0 이상 정수 필수
- `reason`: 비어있지 않은 문자열 필수

**Response (200)**:
```json
{
  "success": true,
  "transaction_id": "uuid-string",
  "old_quantity": 12,
  "new_quantity": 15
}
```

**Error**:
- `400`: 필수 필드 누락 또는 유효하지 않은 값
- `401`: 인증 실패
- `500`: 서버 오류

---

## 5. 파일 변경 목록

### 5.1 수정 파일 (7개)

| # | 파일 | 변경 내용 | 영향 범위 |
|---|------|----------|----------|
| 1 | `src/lib/inventory-utils.ts` | `getDisplayName()` 함수 추가 | 유틸 |
| 2 | `src/components/admin/inventory/StockCardView.tsx` | cc 표기 + 냉장 배지 | UI |
| 3 | `src/components/admin/inventory/StockTableView.tsx` | cc 표기 + 냉장 배지 | UI |
| 4 | `src/components/admin/inventory/DetailPanel.tsx` | cc 표기 + 냉장 라벨 + 보정 버튼 + onAdjust prop | UI |
| 5 | `src/components/admin/inventory/DashboardStatsCards.tsx` | 4카드 전체 클릭 + activeFilter/onFilterChange props | UI |
| 6 | `src/components/admin/inventory/CategoryGrid.tsx` | stockFilter prop + 필터 적용 | UI |
| 7 | `src/components/admin/inventory/CategoryDetailSection.tsx` | stockFilter prop + 필터 적용 + onAdjust 전달 | UI |
| 8 | `src/app/admin/(authenticated)/inventory/overview/page.tsx` | stockFilter state + adjustModal state + addItem state + 버튼 | 페이지 |
| 9 | `src/app/api/admin/inventory/route.ts` | POST body에 is_refrigerated, volume_cc 추가 | API |

### 5.2 신규 파일 (2개)

| # | 파일 | 설명 |
|---|------|------|
| 1 | `src/components/admin/inventory/StockAdjustModal.tsx` | 수량 보정 모달 |
| 2 | `src/app/api/admin/inventory/adjust/route.ts` | 수량 보정 API |

### 5.3 신규 파일 - 조건부 (1개)

| # | 파일 | 조건 | 설명 |
|---|------|------|------|
| 1 | `src/components/admin/inventory/AddItemModal.tsx` | 기존 AddItemModal 없는 경우 | 물품 추가 모달 |

---

## 6. 구현 순서

### Step 1: 유틸 + 표시 개선 (#16, #15)
1. `inventory-utils.ts`에 `getDisplayName()` 추가
2. `StockCardView.tsx` 수정: 이름에 cc 표기 + 냉장 배지
3. `StockTableView.tsx` 수정: 이름에 cc 표기 + 냉장 배지
4. `DetailPanel.tsx` 수정: 이름에 cc 표기 + 냉장 라벨 (info grid에 행 추가)

### Step 2: 대시보드 필터 (#10)
5. `DashboardStatsCards.tsx` 수정: 4카드 전체를 button으로 변경 + activeFilter + onFilterChange
6. `overview/page.tsx` 수정: stockFilter state 추가
7. `CategoryGrid.tsx` 수정: stockFilter prop으로 items 필터링
8. `CategoryDetailSection.tsx` 수정: stockFilter prop으로 filtered에 추가 필터

### Step 3: 수량 보정 (#11)
9. `StockAdjustModal.tsx` 신규 생성
10. `adjust/route.ts` API 신규 생성
11. `DetailPanel.tsx` 수정: onAdjust prop + 보정 버튼
12. `CategoryDetailSection.tsx` 수정: onAdjust prop 전달
13. `overview/page.tsx` 수정: adjustModal state + handleAdjust 함수

### Step 4: 신규 물품 추가 (#14)
14. `AddItemModal.tsx` 신규 생성
15. `inventory/route.ts` 수정: POST body에 is_refrigerated, volume_cc 추가
16. `overview/page.tsx` 수정: showAddItem state + 헤더에 버튼

### Step 5: 확인
17. #3-1, #5, #8, #9 DB 반영 확인 (UI에 정상 표시되는지)
18. `npm run build` 타입 에러 확인
19. 모바일/PC 양쪽 확인

---

## 7. Error Handling

| 시나리오 | 처리 방식 |
|---------|----------|
| 수량 보정 API 실패 | alert 메시지 표시 (기존 패턴) |
| 물품 추가 API 실패 | alert 메시지 표시 |
| 수량 보정 시 동시 수정 충돌 | 최후 쓰기 우선 (현재 시스템 패턴) |
| 네트워크 오류 | "오류가 발생했습니다." alert |

---

## 8. Security Considerations

- [x] 모든 API에 인증 확인 (기존 패턴: `supabase.auth.getUser()`)
- [x] 수량 보정 시 사유 필수 (감사 추적)
- [x] 입력 값 검증 (서버 사이드: 수량 >= 0, 사유 비어있지 않음)
- [x] XSS 방지: React의 기본 이스케이핑 사용 (innerHTML 미사용)
- [x] SQL Injection 방지: Supabase RPC / parameterized query 사용

---

## 9. Test Plan

| 시나리오 | 확인 방법 |
|---------|----------|
| cc 표기 | volume_cc가 있는 물품(리쥬란 힐러)에 "2cc" 표시 확인 |
| 냉장 배지 | is_refrigerated=true인 물품에 냉장 배지 표시 확인 |
| 상태 필터 | 각 카드 클릭 시 해당 상태 물품만 목록에 표시 |
| 필터 리셋 | 같은 카드 재클릭 시 전체 표시로 복귀 |
| 수량 보정 | 수량 변경 + 사유 입력 → DB 반영 + 이력 기록 확인 |
| 보정 유효성 | 사유 미입력 시 제출 불가, 수량 변경 없으면 제출 불가 |
| 물품 추가 | 필수 필드 입력 → 등록 → 목록에 표시 |
| 반응형 | 모바일/태블릿/PC에서 모달 정상 표시 |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-02-19 | Initial draft |
