# Design: cosmetics-expiry-management

> 창 5: 화장품 관리 + 유효기간/유통기한 시스템 — 상세 설계

## 1. 아키텍처 개요

```
┌─────────────────────────────────────────────────────────┐
│                      페이지 레이어                         │
│  inventory/page.tsx        inventory/overview/page.tsx    │
│  (키오스크 - 화장품 탭)      (재고현황 대시보드)              │
└────┬────────────────────────────────┬────────────────────┘
     │                                │
┌────▼──────────────────┐  ┌──────────▼──────────────────┐
│ CosmeticsKioskView    │  │ StockCardView / TableView   │
│  ├─ ExpiryBadge       │  │  ├─ ExpiryBadge             │
│  ├─ InventoryEditModal│  │  └─ DetailPanel             │
│  └─ (샘플 탭)          │  │      ├─ BatchManager        │
└────┬──────────────────┘  │      └─ InventoryEditModal  │
     │                     └──────────┬──────────────────┘
     │                                │
┌────▼────────────────────────────────▼──────────────────┐
│                      API 레이어                         │
│  /api/admin/inventory/batches/      (GET, POST)        │
│  /api/admin/inventory/batches/[id]/ (PATCH, DELETE)    │
│  /api/admin/inventory/restock/      (POST - 수정)      │
│  /api/admin/inventory/use/          (POST - 수정)      │
│  /api/admin/inventory/[id]/         (PATCH - 수정)     │
└────┬───────────────────────────────────────────────────┘
     │
┌────▼───────────────────────────────────────────────────┐
│                    DB 레이어                             │
│  inventory_batches (기존)                                │
│  inventory_items   (기존)                                │
│  inventory_transactions (기존)                           │
└────────────────────────────────────────────────────────┘
```

## 2. 파일별 상세 설계

### 2-1. `lib/expiry-utils.ts` (신규)

유통기한 관련 순수 유틸리티 함수. 서버/클라이언트 양쪽에서 사용 가능.

```ts
// ─── Types ──────────────────────────────────────
export type ExpiryStatus = 'normal' | 'warning' | 'critical' | 'expired';

// ─── Constants ──────────────────────────────────
export const EXPIRY_STYLES: Record<ExpiryStatus, {
  label: string;
  bg: string;
  text: string;
  dot: string;
}> = {
  normal:   { label: '정상',  bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  warning:  { label: '임박',  bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-400' },
  critical: { label: '긴급',  bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-400' },
  expired:  { label: '만료',  bg: 'bg-red-100',    text: 'text-red-800',     dot: 'bg-red-600' },
};

// ─── Functions ──────────────────────────────────
export function getExpiryStatus(expiryDate: string | null | undefined): ExpiryStatus {
  if (!expiryDate) return 'normal';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate + 'T00:00:00');
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return 'expired';
  if (diffDays < 90) return 'critical';     // 3개월 미만
  if (diffDays < 180) return 'warning';     // 6개월 미만
  return 'normal';
}

export function formatExpiryDate(date: string | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date + 'T00:00:00');
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
}

export function getRemainingText(expiryDate: string | null | undefined): string {
  if (!expiryDate) return '';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate + 'T00:00:00');
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}일 경과`;
  if (diffDays === 0) return '오늘 만료';
  if (diffDays < 30) return `${diffDays}일 남음`;
  const months = Math.floor(diffDays / 30);
  return `약 ${months}개월 남음`;
}

/** 배치 배열에서 가장 빠른 유효기간(earliest expiry) 반환 */
export function getEarliestExpiry(
  batches: { expiry_date: string | null; remaining_quantity: number }[]
): string | null {
  const valid = batches
    .filter(b => b.expiry_date && b.remaining_quantity > 0)
    .map(b => b.expiry_date!)
    .sort();
  return valid[0] || null;
}
```

### 2-2. `ExpiryBadge.tsx` (신규 컴포넌트)

```
위치: components/admin/inventory/ExpiryBadge.tsx
```

**Props**:
```ts
interface ExpiryBadgeProps {
  expiryDate: string | null | undefined;
  showRemaining?: boolean;  // default: true
  size?: 'sm' | 'md';       // default: 'sm'
}
```

**렌더링 규칙**:
- `expiryDate`가 null/undefined → 렌더링 안 함 (return null)
- `size='sm'`: `text-[10px]`, pill 형태, 날짜 + 잔여기간
- `size='md'`: `text-xs`, 날짜 + 잔여기간 + 상태 라벨
- 색상: `EXPIRY_STYLES[getExpiryStatus(expiryDate)]` 사용

**사용 위치**:
- `CosmeticsKioskView` — 각 화장품 아이템 행의 재고 아래
- `StockCardView` — 카드 하단 게이지 아래
- `StockTableView` — 유효기간 컬럼
- `DetailPanel` — 정보 그리드 내

### 2-3. `BatchManager.tsx` (신규 컴포넌트)

```
위치: components/admin/inventory/BatchManager.tsx
```

**Props**:
```ts
interface BatchManagerProps {
  itemId: string;
  itemName: string;
  itemUnit: string;
}
```

**내부 상태**:
```ts
const [batches, setBatches] = useState<InventoryBatch[]>([]);
const [loading, setLoading] = useState(true);
const [showAddForm, setShowAddForm] = useState(false);
// 추가 폼 필드
const [newQty, setNewQty] = useState('');
const [newExpiry, setNewExpiry] = useState('');
const [newNote, setNewNote] = useState('');
```

**레이아웃** (DetailPanel 내부에 삽입):
```
┌──────────────────────────────────┐
│ 배치별 유효기간          [+ 추가] │
├──────────────────────────────────┤
│  #1  입고: 2026-01-15            │
│      잔여: 3개 / 10개            │
│      유효기간: 2028-04-15        │
│      [ExpiryBadge: 정상]         │
│──────────────────────────────────│
│  #2  입고: 2026-03-01            │
│      잔여: 5개 / 5개             │
│      유효기간: 2028-08-18        │
│      [ExpiryBadge: 정상]         │
├──────────────────────────────────┤
│  [+ 추가 폼] (토글)              │
│  수량: [___] 유효기간: [__/__/__]│
│  메모: [_______________]         │
│         [취소]  [등록]            │
└──────────────────────────────────┘
```

**데이터 흐름**:
1. mount 시 `GET /api/admin/inventory/batches?item_id={itemId}` 호출
2. 배치 목록을 `expiry_date ASC` (FIFO) 정렬로 표시
3. "추가" → `POST /batches` → 리스트 갱신
4. 수정/삭제는 인라인 편집 or 모달

### 2-4. `InventoryEditModal.tsx` (신규 컴포넌트)

```
위치: components/admin/inventory/InventoryEditModal.tsx
```

**Props**:
```ts
interface InventoryEditModalProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;  // 저장 후 콜백 (리스트 갱신)
}
```

**레이아웃**:
```
┌───────────────────────────────────┐
│ 재고 수량 수정            [X]     │
├───────────────────────────────────┤
│                                   │
│  품목: 배리덤 쉴드 크림엠디 35g    │
│  현재 재고: 12개                   │
│                                   │
│  새 수량: [____] 개               │
│  차이: +3 (또는 -2)               │
│                                   │
│  수정 사유 (필수):                 │
│  [________________________]       │
│  예: 입고 실수 보정                │
│                                   │
│  ⚠ 수량 변경 시 조정 이력이       │
│     자동으로 기록됩니다.           │
│                                   │
│      [취소]    [수정 확인]         │
│                                   │
│  정말 수정하시겠습니까?  [예] [아니오]│
└───────────────────────────────────┘
```

**동작**:
1. 새 수량 입력 → 차이(delta) 실시간 계산 표시
2. 수정 사유 필수 입력 (빈 값이면 버튼 비활성)
3. "수정 확인" → 2차 확인 팝업 → 승인 시 API 호출
4. API: `PATCH /api/admin/inventory/[id]` + `adjust` 트랜잭션 자동 생성
5. 성공 시 `onSaved()` 콜백 + 토스트

**모바일**: 하단 시트(bottom sheet) 스타일, `fixed bottom-0 inset-x-0`, `max-h-[80vh]`

### 2-5. `/api/admin/inventory/batches/route.ts` (신규 API)

#### GET — 배치 목록 조회
```ts
// Query: ?item_id=uuid
// Response: { batches: InventoryBatch[] }  (expiry_date ASC 정렬)
```

**구현**:
```ts
const { data, error } = await admin
  .from('inventory_batches')
  .select('*')
  .eq('item_id', itemId)
  .gt('remaining_quantity', 0)    // 잔여 수량 > 0만
  .order('expiry_date', { ascending: true, nullsFirst: false })
  .order('received_at', { ascending: true });
```

#### POST — 새 배치 등록
```ts
// Body: { item_id, batch_quantity, expiry_date?, received_at?, note? }
// 1. inventory_batches에 INSERT (remaining_quantity = batch_quantity)
// 2. inventory_items.current_stock += batch_quantity
// 3. inventory_transactions에 restock 기록
```

**중요**: POST는 기존 `restock` API를 대체하는 것이 아니라, 배치 추적이 필요한 경우 사용. 기존 restock은 배치 없이 단순 수량 증가.

### 2-6. `/api/admin/inventory/batches/[id]/route.ts` (신규 API)

#### PATCH — 배치 수정
```ts
// Body: { remaining_quantity?, expiry_date?, note? }
// inventory_batches 해당 행 UPDATE
```

#### DELETE — 배치 삭제
```ts
// 1. 해당 배치의 remaining_quantity만큼 inventory_items.current_stock 감소
// 2. inventory_batches에서 DELETE
// 3. inventory_transactions에 adjust 기록 (사유: 배치 삭제)
```

### 2-7. `restock/route.ts` (수정)

현재 단순 RPC 호출만 하지만, 배치 시스템 연동 추가:

```ts
// 기존: restock_inventory_item RPC만 호출
// 추가: expiry_date가 body에 있으면 inventory_batches에도 INSERT
//
// Body 확장:
interface RestockRequest {
  item_id: string;
  quantity: number;
  note?: string;
  expiry_date?: string;   // ← 추가
  received_at?: string;   // ← 추가 (기본: 오늘)
}
```

### 2-8. `CosmeticsKioskView.tsx` (수정)

#### 변경 1: 유통기한 배지 표시
각 `usageItem` 행에 `ExpiryBadge` 추가. 배치 데이터는 별도 fetch:

```ts
// 컴포넌트 마운트 시 화장품 items의 배치 정보 일괄 로드
const [batchMap, setBatchMap] = useState<Map<string, InventoryBatch[]>>(new Map());

useEffect(() => {
  // 모든 화장품 item_id에 대해 배치 조회
  // → 각 아이템의 earliest expiry를 batchMap에 저장
}, [cosmeticsItems]);
```

아이템 행 JSX 변경:
```tsx
<div className="text-[10px] text-[#a09080] mt-0.5">
  재고: {usage.currentStock}{usage.unit}
  {/* 추가: 유통기한 배지 */}
  <ExpiryBadge expiryDate={getEarliestExpiry(batchMap.get(usage.itemId) || [])} />
</div>
```

#### 변경 2: 샘플 약물 탭 (#13)
`SUBCATEGORY_ORDER`에 추가하는 대신, 상단에 모드 토글 추가:

```tsx
// 상단 모드 선택
const [viewMode, setViewMode] = useState<'cosmetics' | 'sample'>('cosmetics');

// 필터 분기
const targetItems = viewMode === 'cosmetics'
  ? items.filter(i => i.category === 'cosmetics')
  : items.filter(i => i.category === 'sample');
```

모드 토글 UI:
```
┌─────────────────────────────────────┐
│  [화장품]  [샘플 약물]               │
└─────────────────────────────────────┘
```

샘플 모드에서는 서브카테고리 대신 전체 리스트 표시 (샘플은 소수 품목 예상).

#### 변경 3: 수정/삭제 버튼 (#18)
각 아이템 행에 long-press 또는 편집 아이콘 추가:

```tsx
// 아이템 행 우측에 편집 아이콘 (⋮ 메뉴 또는 연필 아이콘)
<button onClick={() => setEditItem(item)} className="...">
  <PencilIcon />
</button>

// 하단에 InventoryEditModal 렌더
{editItem && (
  <InventoryEditModal
    item={editItem}
    isOpen={!!editItem}
    onClose={() => setEditItem(null)}
    onSaved={() => { loadData(); setEditItem(null); }}
  />
)}
```

### 2-9. `DetailPanel.tsx` (수정)

기존 "최근 입출고" 섹션 위에 `BatchManager` 삽입:

```tsx
// 기존 코드 (line 94 ~ 123 info grid 뒤)에 추가:
{/* 배치별 유효기간 섹션 */}
<BatchManager
  itemId={item.id}
  itemName={item.name}
  itemUnit={item.unit}
/>
```

### 2-10. `RestockTab.tsx` (수정)

RestockCard 컴포넌트의 "입고 처리" 버튼 클릭 시 열리는 모달(부모 컴포넌트 `overview/page.tsx`에 있음)에 유효기간 입력 필드 추가.

부모의 stock modal에 `expiry_date` 필드 추가:
```tsx
// StockModal 내부 (overview/page.tsx에 정의된 모달)
<label>유효기간 (선택)</label>
<input type="date" value={expiryDate} onChange={...} />
```

모달 submit 시 `/api/admin/inventory/restock`에 `expiry_date` 포함.

### 2-11. `StockCardView.tsx` (수정)

카드 하단에 earliest expiry 표시:

```tsx
// 게이지 아래, action buttons 위에 삽입
{(() => {
  const earliest = expiryMap?.get(item.id);
  if (!earliest) return null;
  return <ExpiryBadge expiryDate={earliest} size="sm" />;
})()}
```

`expiryMap`은 부모(`overview/page.tsx`)에서 전달:
```ts
// 부모에서 모든 아이템의 earliest_expiry를 일괄 조회
const [expiryMap, setExpiryMap] = useState<Map<string, string>>(new Map());
```

### 2-12. `StockTableView.tsx` (수정)

테이블 헤더에 "유효기간" 컬럼 추가:
```tsx
<th>유효기간</th>
```

테이블 바디에:
```tsx
<td>
  <ExpiryBadge expiryDate={expiryMap?.get(item.id)} size="sm" />
</td>
```

### 2-13. `020_cosmetics_expiry_data.sql` (신규 Migration)

```sql
-- ═══════════════════════════════════════════════════
-- 020: 화장품 유통기한 초기 데이터 + 하라셀 단품 등록
-- ═══════════════════════════════════════════════════

-- 1) 하라셀 수분 단품 3종 등록
INSERT INTO inventory_items (name, category, sub_category, unit, current_stock, min_stock, unit_price, is_active)
VALUES
  ('하라셀 수분 토너 (단품)', 'cosmetics', 'serum', '개', 0, 2, 0, true),
  ('하라셀 수분 세럼 (단품)', 'cosmetics', 'serum', '개', 0, 2, 0, true),
  ('하라셀 수분 크림 (단품)', 'cosmetics', 'cream', '개', 0, 2, 0, true);

-- 2) 개별 제품 유통기한 배치 등록
-- NOTE: item_id는 name 기준 서브쿼리로 매칭
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, current_stock, current_stock, '2028-08-18', CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name = '시트마스크' AND is_active = true
UNION ALL
SELECT id, current_stock, current_stock, '2028-04-15', CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name = '배리덤 쉴드 크림엠디 35g' AND is_active = true
UNION ALL
SELECT id, current_stock, current_stock, '2028-04-15', CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name = '배리덤 쉴드 크림엠디 80g' AND is_active = true
UNION ALL
SELECT id, current_stock, current_stock, '2027-10-29', CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name LIKE 'MD 마데카로션 200%' AND is_active = true
UNION ALL
SELECT id, current_stock, current_stock, '2027-11-13', CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name LIKE 'MD 마데카로션 500%' AND is_active = true
UNION ALL
SELECT id, current_stock, current_stock, '2027-06-26', CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name LIKE 'MD 마데카크림 250%' AND is_active = true
UNION ALL
SELECT id, current_stock, current_stock, '2028-08-21', CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name LIKE '테오리아 EGF%' AND is_active = true;

-- 3) 하라셀 수분 세트 구성품별 유통기한
-- 세트 자체에 대표 배치로 등록 (earliest = 크림 2028-05-13)
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, current_stock, current_stock, '2028-05-13', CURRENT_DATE, '세트 대표 유통기한 (크림 기준, 가장 빠름)'
FROM inventory_items WHERE name LIKE '하라셀 수분%세트%' AND category = 'cosmetics' AND is_active = true;

-- 4) 하라셀 수분 단품 유통기한
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, 0, 0, '2028-06-29', CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name = '하라셀 수분 토너 (단품)' AND is_active = true
UNION ALL
SELECT id, 0, 0, '2028-07-24', CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name = '하라셀 수분 세럼 (단품)' AND is_active = true
UNION ALL
SELECT id, 0, 0, '2028-05-13', CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name = '하라셀 수분 크림 (단품)' AND is_active = true;

-- 5) 프리미엄 세트 (earliest = 블레쉬밤 3개 묶음 2027-06-03)
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, current_stock, current_stock, '2027-06-03', CURRENT_DATE, '세트 대표 유통기한 (블레쉬밤 기준, 가장 빠름)'
FROM inventory_items WHERE name LIKE '프리미엄%세트%' AND category = 'cosmetics' AND is_active = true;
```

**참고**: 세트 제품은 구성품 중 가장 빠른 유효기간을 대표 배치로 등록. 개별 구성품 추적은 하지 않음 (세트는 분리 판매 안 함).

## 3. 데이터 흐름 다이어그램

### 3-1. 배치 등록 (입고 + 유효기간)

```
사용자 → RestockTab "입고 처리" 클릭
       → 모달: 수량 + 유효기간 입력
       → POST /api/admin/inventory/restock
         { item_id, quantity, expiry_date?, note? }
       → API:
         1. restock_inventory_item RPC (current_stock 증가)
         2. if (expiry_date) → INSERT inventory_batches
       → 성공 → 목록 갱신
```

### 3-2. FIFO 차감

```
사용자 → KioskView/CosmeticsKioskView에서 차감
       → POST /api/admin/inventory/use
         { items: [{ item_id, quantity }] }
       → API:
         1. use_inventory_item RPC (current_stock 감소)
         2. 해당 item의 배치 조회 (expiry_date ASC)
         3. FIFO로 remaining_quantity 차감:
            - batch[0].remaining -= min(remaining, qty)
            - qty -= used
            - 다음 배치로 이동 (qty > 0이면)
       → 배치 remaining이 0인 행은 유지 (삭제 안 함, 이력 보존)
```

### 3-3. 재고 수정 (#18)

```
사용자 → CosmeticsKioskView 아이템 편집 아이콘 클릭
       → InventoryEditModal 열림
       → 새 수량 + 사유 입력
       → 2차 확인 팝업
       → PATCH /api/admin/inventory/[id]
         { current_stock: newQty, adjust_reason: "..." }
       → API:
         1. UPDATE inventory_items SET current_stock = newQty
         2. INSERT inventory_transactions (tx_type: 'adjust', quantity: delta, note: reason)
       → 성공 → 모달 닫기 + 목록 갱신 + 토스트
```

## 4. 컴포넌트 Props/State 인터페이스

### 4-1. expiryMap 전파 패턴

최상위(`overview/page.tsx`)에서 배치 데이터를 일괄 로드 → 각 컴포넌트에 전달:

```ts
// overview/page.tsx
const [expiryMap, setExpiryMap] = useState<Map<string, string>>(new Map());
// key: item_id, value: earliest expiry_date

useEffect(() => {
  // GET /api/admin/inventory/batches?all=true → 전체 배치 조회
  // 아이템별 earliest expiry 계산 → setExpiryMap
}, [items]);

// 하위 컴포넌트에 전달
<StockCardView expiryMap={expiryMap} ... />
<StockTableView expiryMap={expiryMap} ... />
<DetailPanel expiryMap={expiryMap} ... />
```

### 4-2. CosmeticsKioskView 확장 Props

기존 props는 변경 없음. 내부에서 배치 데이터를 자체 fetch:
```ts
// CosmeticsKioskView 내부
const [batchMap, setBatchMap] = useState<Map<string, InventoryBatch[]>>(new Map());
```

### 4-3. StockCardView / StockTableView 확장 Props

```ts
interface StockCardViewProps {
  // ... 기존 props 유지
  expiryMap?: Map<string, string>;  // ← 추가
}
```

## 5. 구현 순서 (Phase별 체크리스트)

### Phase 1: 기반 (유틸 + API + 공통 컴포넌트)
- [ ] `lib/expiry-utils.ts` 생성
- [ ] `ExpiryBadge.tsx` 생성
- [ ] `app/api/admin/inventory/batches/route.ts` 생성 (GET, POST)
- [ ] `app/api/admin/inventory/batches/[id]/route.ts` 생성 (PATCH, DELETE)

### Phase 2: #19 하라셀 단품 등록
- [ ] Migration `020_cosmetics_expiry_data.sql` — 하라셀 단품 3종 INSERT 부분
- [ ] CosmeticsKioskView에서 단품 표시 확인

### Phase 3: #20 유통기한 시스템
- [ ] Migration `020_cosmetics_expiry_data.sql` — 초기 유통기한 데이터 INSERT
- [ ] CosmeticsKioskView에 ExpiryBadge 통합
- [ ] CosmeticsKioskView 내부 batchMap fetch 로직
- [ ] `restock/route.ts`에 expiry_date 파라미터 추가
- [ ] overview/page.tsx 입고 모달에 유효기간 필드 추가

### Phase 4: #12 배치별 관리 UI
- [ ] `BatchManager.tsx` 생성
- [ ] `DetailPanel.tsx`에 BatchManager 통합
- [ ] `use/route.ts`에 FIFO 배치 차감 로직 추가
- [ ] StockCardView에 expiryMap prop + ExpiryBadge 표시
- [ ] StockTableView에 유효기간 컬럼 + ExpiryBadge 추가
- [ ] overview/page.tsx에서 expiryMap 로드 + 전파

### Phase 5: #18 재고 수정/삭제
- [ ] `InventoryEditModal.tsx` 생성
- [ ] `[id]/route.ts` PATCH에 adjust 트랜잭션 자동 생성 로직 추가
- [ ] CosmeticsKioskView에 편집 아이콘 + 모달 연결
- [ ] DetailPanel에 "수량 수정" 버튼 + 모달 연결

### Phase 6: #13 샘플 약물 섹션
- [ ] CosmeticsKioskView에 viewMode 토글 추가 ('cosmetics' | 'sample')
- [ ] sample 모드 필터링 로직
- [ ] 샘플 약물 시각 구분 (배지 + 배경색)

## 6. 모바일 반응형 고려사항

| 컴포넌트 | PC | 모바일 |
|---------|-----|--------|
| ExpiryBadge | 인라인 pill | 동일 (작은 사이즈) |
| BatchManager | DetailPanel 내부 | DetailPanel이 모바일에서 full-width |
| InventoryEditModal | 센터 모달 (max-w-md) | bottom sheet (fixed bottom-0) |
| 샘플 토글 | 상단 탭 (가로 배치) | 동일 |
| 유효기간 입력 | date input | native date picker |

## 7. 테스트 시나리오

1. **유통기한 배지 색상 검증**: 2027-06-26 (마데카크림) → 오늘 기준 약 16개월 → 정상(녹색)
2. **FIFO 차감**: 배치 A(유효기간 빠름, 잔여 3) + 배치 B(느림, 잔여 5) → 5개 차감 → A 0 + B 3
3. **재고 수정**: 현재 12 → 새 수량 15 → delta +3 → adjust 트랜잭션 기록
4. **세트 대표 유효기간**: 하라셀 수분 세트 → 크림(2028-05-13)이 가장 빠름 → 세트 카드에 표시
5. **만료 경고**: 유효기간 < 오늘 → 빨강 + "만료" 라벨
