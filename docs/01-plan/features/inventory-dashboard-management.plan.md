# Plan: inventory-dashboard-management

> 창 3: 재고 대시보드 + 물품 관리 (간호팀 수정요청 #3-1, #5, #8, #9, #10, #11, #14, #15, #16)

## 1. 개요

### 배경
간호팀 수정요청 20개 항목 중 재고 대시보드 및 물품 관리 관련 9개 항목을 담당하는 창.
창 1(Foundation)에서 DB 스키마(`is_refrigerated`, `volume_cc`, `sample` 카테고리)와 admin.ts 타입이 이미 커밋되어 있으므로, 이 창에서는 **UI 컴포넌트 수정**에 집중한다.

### 목표
- 재고 대시보드 상태 카드 필터링 기능 추가
- 물품 상세에서 수량 직접 수정(보정) 기능
- 신규 물품 추가 UI
- 냉장 표기 및 약물 cc 표기 반영
- 하드코딩된 텍스트가 있는 경우 확인 및 수정

### 범위
이 Plan은 **재고 overview 페이지 UI**만 다룸. 키오스크(창 2), 샷 추적(창 4), 화장품/유효기간(창 5)은 별도 창 담당.

## 2. 사전 조사 결과

### 현재 코드 상태 분석

**하드코딩 텍스트 확인:**
- `Equipment3DCarousel.tsx`에 `'슈링크 유니버스'` 존재 → 홈페이지 마케팅 텍스트 (재고 무관, 별도 확인 필요)
- **재고 컴포넌트에는 하드코딩된 제품명/단위 없음** → 모든 unit은 `item.unit`으로 동적 표시
- DB에서 이미 단위가 변경되었다면(창 1 migration) UI는 자동 반영됨

**#3-1 슈링크 이름**: `admin.ts` PROCEDURE_CATALOG에서 이미 변경됨. 재고 페이지에서는 inventory_items.name을 DB에서 가져오므로 **추가 작업 불필요** (확인만 필요)

**#5 쥬베룩 단위**: DB migration에서 `unit='바이알'`로 이미 변경. UI는 `item.unit` 사용 → **추가 작업 불필요**

**#8 수액세트 단위**: DB migration에서 `unit='개'`로 이미 변경 → **추가 작업 불필요**

**#9 모야랩 밴드 단위**: DB migration에서 `unit='개'`로 이미 변경 → **추가 작업 불필요**

> 결론: #3-1, #5, #8, #9는 DB 레이어에서 해결 완료. 빌드 후 확인만 하면 됨.

### 실제 구현이 필요한 항목: 5개

| # | 항목 | 난이도 | 영향 컴포넌트 |
|---|------|--------|--------------|
| #16 | 약물 cc 표기 | 낮음 | StockCardView, StockTableView, DetailPanel |
| #15 | 냉장 표기 | 낮음 | StockCardView, StockTableView, DetailPanel |
| #10 | 대시보드 필터 | 중간 | DashboardStatsCards, overview/page.tsx |
| #11 | 수량 수정 버튼 | 중간 | DetailPanel, 신규 StockAdjustModal |
| #14 | 신규 약물 추가 | 중간 | 신규 AddItemModal, overview/page.tsx |

## 3. 변경 항목 상세

### 3-1. #16 약물 cc 표기 (volume_cc)

**현재**: 약물명만 표시 (예: "리쥬란 힐러")
**변경**: `volume_cc`가 있으면 약물명 뒤에 cc 표기 (예: "리쥬란 힐러 2cc")

**구현 방식:**
- 유틸 함수 `getDisplayName(item: InventoryItem): string` 생성
  ```ts
  // item.volume_cc가 존재하면 "이름 Ncc" 형식으로 반환
  const getDisplayName = (item: InventoryItem) =>
    item.volume_cc ? `${item.name} ${item.volume_cc}cc` : item.name;
  ```
- 적용 위치: StockCardView, StockTableView, DetailPanel에서 `item.name` 대신 사용

**수정 파일:**
- `src/types/admin.ts` 또는 `src/lib/inventory-utils.ts`: 유틸 함수 추가
- `src/components/admin/inventory/StockCardView.tsx`: 이름 표시 변경
- `src/components/admin/inventory/StockTableView.tsx`: 이름 표시 변경
- `src/components/admin/inventory/DetailPanel.tsx`: 이름 표시 변경

### 3-2. #15 냉장 표기 (is_refrigerated)

**현재**: 냉장/상온 구분 없음
**변경**: `is_refrigerated === true`인 물품에 냉장 아이콘/배지 표시

**구현 방식:**
- 물품명 옆에 파란색 냉장 배지 표시: `[냉장]` 또는 눈꽃 아이콘
- StockCardView: 카드 우상단 또는 이름 옆에 배지
- StockTableView: 이름 컬럼에 배지
- DetailPanel: 상세 정보에 "냉장 보관" 라벨

**수정 파일:**
- `src/components/admin/inventory/StockCardView.tsx`
- `src/components/admin/inventory/StockTableView.tsx`
- `src/components/admin/inventory/DetailPanel.tsx`

### 3-3. #10 대시보드 필터

**현재**:
- DashboardStatsCards에 4개 카드 (총 품목 / 정상 재고 / 부족 경고 / 긴급 소진)
- "긴급 소진" 카드만 `<button>`으로 되어 있고 `onAlertClick` → 입고 관리 탭 전환
- 나머지 카드는 `<div>`로 클릭 불가

**변경**: 4개 카드 모두 클릭 가능 → 클릭 시 해당 상태 물품만 필터링

**구현 방식:**
1. `DashboardStatsCards`에 `onFilterChange?: (filter: StockFilter) => void` prop 추가
   - `StockFilter = 'all' | 'normal' | 'low' | 'out'`
2. overview/page.tsx에 `stockFilter` state 추가
3. 카드 클릭 시 필터 상태 변경 → 아래 CategoryDetailSection에 필터 전달
4. 선택된 카드 시각적 강조 (active 상태)
5. 같은 페이지 내 필터링 (페이지 이동 없음)

**수정 파일:**
- `src/components/admin/inventory/DashboardStatsCards.tsx`: 4개 카드를 모두 버튼으로 변경 + activeFilter prop
- `src/app/admin/(authenticated)/inventory/overview/page.tsx`: stockFilter state + 필터 로직
- `src/components/admin/inventory/CategoryDetailSection.tsx`: stockFilter prop으로 items 추가 필터링
- `src/components/admin/inventory/CategoryGrid.tsx`: 필터에 따른 카테고리별 수량 업데이트

### 3-4. #11 수량 수정 버튼

**현재**: DetailPanel에 물품 상세 정보만 표시. 수량 변경은 StockModal(입고/출고)로만 가능.
**변경**: "수량 보정" 기능 추가 - 현재 재고를 직접 수정 + 사유 입력 + 이력 기록

**구현 방식:**
1. **신규 컴포넌트**: `StockAdjustModal.tsx`
   - 현재 수량 표시
   - 수정할 수량 입력 (직접 입력)
   - 변경 사유 입력 (필수)
   - 확인/취소 버튼
2. **API**: `/api/admin/inventory/adjust` (POST)
   - body: `{ item_id, new_quantity, reason }`
   - inventory_transactions에 `tx_type: 'adjust'` 기록
   - old_quantity → new_quantity 변경 이력 저장
3. **DetailPanel**: "수량 보정" 버튼 추가

**수정 파일:**
- `src/components/admin/inventory/StockAdjustModal.tsx` (신규)
- `src/components/admin/inventory/DetailPanel.tsx`: 보정 버튼 추가
- `src/app/api/admin/inventory/adjust/route.ts` (신규): API 엔드포인트
- `src/types/admin.ts`: InventoryTransaction tx_type에 'adjust' 추가 (필요시)

### 3-5. #14 신규 약물 추가

**현재**: 새 물품을 추가하는 UI 없음
**변경**: "새 물품 추가" 버튼 + 입력 폼

**구현 방식:**
1. **신규 컴포넌트**: `AddItemModal.tsx`
   - 입력 필드:
     - 물품명 (필수)
     - 카테고리 선택 (드롭다운, 8개 카테고리)
     - 세부 분류 (카테고리에 따른 동적 옵션)
     - 규격/사양 (specification)
     - 단위 (바이알/개/박스/시린지/ml 등)
     - 단가 (unit_price)
     - 초기 재고 수량
     - 최소 재고 기준 (min_stock)
     - 냉장 보관 여부 (토글)
     - 용량 cc (선택)
   - 확인/취소 버튼
2. **API**: `/api/admin/inventory/items` (POST)
   - body: 위 필드들
   - inventory_items에 INSERT
   - 초기 재고가 있으면 inventory_transactions에 'restock' 기록
3. **overview 페이지**: 헤더 영역에 "새 물품 추가" 버튼

**수정 파일:**
- `src/components/admin/inventory/AddItemModal.tsx` (신규)
- `src/app/admin/(authenticated)/inventory/overview/page.tsx`: 버튼 추가
- `src/app/api/admin/inventory/items/route.ts` (신규 또는 기존 확장)

## 4. 파일 변경 목록 종합

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/lib/inventory-utils.ts` | 수정 | `getDisplayName()` 유틸 함수 추가 |
| `src/components/admin/inventory/DashboardStatsCards.tsx` | 수정 | 4개 카드 클릭 필터 + active 상태 |
| `src/components/admin/inventory/CategoryDetailSection.tsx` | 수정 | stockFilter prop 추가 |
| `src/components/admin/inventory/CategoryGrid.tsx` | 수정 | stockFilter prop 전달 |
| `src/components/admin/inventory/StockCardView.tsx` | 수정 | 냉장 배지 + cc 표기 |
| `src/components/admin/inventory/StockTableView.tsx` | 수정 | 냉장 배지 + cc 표기 |
| `src/components/admin/inventory/DetailPanel.tsx` | 수정 | 냉장 라벨 + cc 표기 + 수량 보정 버튼 |
| `src/components/admin/inventory/StockAdjustModal.tsx` | **신규** | 수량 보정 모달 |
| `src/components/admin/inventory/AddItemModal.tsx` | **신규** | 신규 물품 추가 모달 |
| `src/app/admin/(authenticated)/inventory/overview/page.tsx` | 수정 | 필터 state + 새 물품 추가 버튼 |
| `src/app/api/admin/inventory/adjust/route.ts` | **신규** | 수량 보정 API |
| `src/app/api/admin/inventory/items/route.ts` | 신규/수정 | 물품 추가 API |

## 5. 완료 기준

- [ ] #16: volume_cc 있는 물품에 "이름 Ncc" 형식 표시
- [ ] #15: is_refrigerated 물품에 냉장 배지 표시
- [ ] #10: 4개 상태 카드 클릭 시 해당 상태 물품 필터링
- [ ] #11: DetailPanel에서 수량 보정 + 사유 입력 + 이력 기록
- [ ] #14: 새 물품 추가 모달 + API
- [ ] 모바일/PC 양쪽 반응형 대응
- [ ] `npm run build` 에러 없음
- [ ] #3-1, #5, #8, #9: DB 반영 확인 (추가 UI 수정 불필요 확인)

## 6. 구현 순서

1. **유틸 함수** (getDisplayName) → 가장 작은 단위, 이후 작업에서 재사용
2. **#16 cc 표기 + #15 냉장 표기** → 기존 컴포넌트 3개 수정 (StockCardView, StockTableView, DetailPanel)
3. **#10 대시보드 필터** → DashboardStatsCards + overview/page.tsx + CategoryDetailSection 수정
4. **#11 수량 보정** → StockAdjustModal(신규) + DetailPanel 수정 + adjust API(신규)
5. **#14 신규 물품 추가** → AddItemModal(신규) + overview/page.tsx 수정 + items API(신규)
6. **확인**: #3-1, #5, #8, #9 DB 반영 상태 확인
7. **빌드 확인**: `npm run build`

## 7. 의존관계

```
[창 1: Foundation] ──완료──> [이 창: 재고 대시보드]
  - InventoryItem.is_refrigerated ✅
  - InventoryItem.volume_cc ✅
  - InventoryCategory 'sample' ✅
  - DB migration (단위 변경, 냉장 표기, 용량 표기) ✅
```

## 8. 리스크 및 주의사항

1. **adjust API**: inventory_transactions 테이블에 `tx_type: 'adjust'`가 기존 체크 제약조건에 포함되어 있는지 확인 필요
2. **모바일 반응형**: 모달(StockAdjustModal, AddItemModal)이 모바일에서 정상 표시되는지 확인
3. **카테고리 필터 + 상태 필터 조합**: 카테고리 선택과 상태 필터가 동시에 적용될 때 UX 확인 필요
4. **홈페이지 슈링크**: `Equipment3DCarousel.tsx`의 '슈링크 유니버스' 텍스트는 재고와 무관한 마케팅 텍스트이므로 이 창 범위 밖 (필요시 별도 확인)
