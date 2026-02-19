# Plan: cosmetics-expiry-management

> 창 5: 화장품 관리 + 유효기간/유통기한 시스템

## 1. 개요

### 배경
간호팀 수정요청 중 화장품 판매 관리 및 유효기간/유통기한 관련 5개 항목(#12, #13, #18, #19, #20)을 담당하는 창.
창 1(admin-nurse-requests-foundation)에서 DB 테이블(`inventory_batches`)과 TypeScript 타입(`InventoryBatch`)이 이미 커밋되어 있으므로, 이 창에서는 **UI + API** 구현에 집중한다.

### 목표
- 배치별 유효기간 관리 UI 구현 (입고 시 유효기간 입력, FIFO 차감, 임박 경고)
- 샘플 약물 섹션 신규 생성
- 화장품 재고 수정/삭제 + 확인 팝업 + 이력 로그
- 하라셀 수분 단품(토너/세럼/크림) 개별 재고 관리
- 화장품 유통기한 입력 + 색상 경고 + 초기 데이터 일괄 등록

### 범위
- **수정 대상**: `CosmeticsKioskView.tsx` + 신규 컴포넌트
- **API**: `inventory/batches/` 관련 새 라우트
- **DB**: `inventory_batches` 테이블 활용 (이미 존재)
- **반응형**: 모바일/PC 양쪽 모두

### 선행 의존성
| 항목 | 상태 | 위치 |
|------|------|------|
| `inventory_batches` 테이블 | ✅ 커밋 완료 | `018_nurse_requests_schema.sql` |
| `InventoryBatch` 타입 | ✅ 커밋 완료 | `src/types/admin.ts:605-614` |
| `sample` 카테고리 enum | ✅ 커밋 완료 | `admin.ts:68` + migration 018 |
| `COSMETICS_SUBCATEGORIES` | ✅ 존재 | `admin.ts:133` |

## 2. 작업 항목 상세

### 2-1. #12 물품 유효기간 (배치별 관리 UI)

**목적**: 같은 물품도 입고 시점별로 유효기간이 다를 수 있으므로 배치 단위로 관리

**구현 사항**:
1. **배치 API** (`/api/admin/inventory/batches/`)
   - `GET /batches?item_id=xxx` — 특정 물품의 배치 목록 (FIFO 순)
   - `POST /batches` — 새 배치 등록 (입고 시 유효기간 함께 입력)
   - `PATCH /batches/[id]` — 배치 수정 (수량/유효기간 보정)
   - `DELETE /batches/[id]` — 배치 삭제

2. **배치 관리 UI** (새 컴포넌트: `BatchManager.tsx`)
   - 물품 상세에서 배치 목록 표시 (입고일, 잔여수량, 유효기간)
   - 입고 시 유효기간 날짜 picker 포함
   - FIFO 차감: 유효기간 빠른 배치부터 자동 차감
   - 유효기간 임박 경고 색상:
     - 6개월 이상: 정상 (기본)
     - 3~6개월: 주황색
     - 3개월 미만: 빨간색
     - 만료: 빨간색 + "만료" 라벨

3. **재고 카드에 가장 가까운 유효기간 표시**
   - `StockCardView`, `StockTableView` 등에서 earliest expiry 간략 표시

**DB 활용**:
```
inventory_batches 테이블 (이미 존재)
- id, item_id, batch_quantity, remaining_quantity
- expiry_date (DATE, nullable)
- received_at (DATE)
- note, created_at
```

### 2-2. #13 샘플 약물 섹션

**목적**: 샘플 약물 전용 관리 영역 신규 생성

**구현 사항**:
1. **CosmeticsKioskView에 탭/섹션 추가**
   - 기존 서브카테고리 필터에 `sample` 탭 추가 (아이콘: `🧪`)
   - 또는 별도 상단 토글: "화장품 | 샘플 약물"

2. **샘플 약물 등록/관리**
   - `category: 'sample'`로 등록 (이미 enum에 포함)
   - 등록: 약물명, 수량, 입고일, 유효기간
   - 입고/출고(사용) 관리: 기존 `use`/`restock` API 재사용
   - 시각 구분: "샘플" 배지 + 다른 배경색

3. **SUBCATEGORY_ORDER 확장**
   ```ts
   { id: 'sample', label: '샘플 약물', icon: '🧪' }
   ```

### 2-3. #18 화장품 재고 수정/삭제

**목적**: 오입력 보정 기능

**구현 사항**:
1. **수정 기능** (새 컴포넌트: `InventoryEditModal.tsx`)
   - 현재 재고 수량 직접 수정
   - 수정 사유 입력 (필수): "입고 실수 보정", "소모량 오입력 수정" 등
   - 확인/취소 팝업으로 실수 방지

2. **삭제 기능**
   - 입고/사용 내역에서 특정 건 삭제
   - 삭제 시 "정말 삭제하시겠습니까?" 확인 팝업
   - 삭제 후 재고 수량 자동 재계산

3. **이력 로그**
   - `inventory_transactions`에 `tx_type: 'adjust'`로 기록
   - 누가, 언제, 얼마에서 얼마로, 사유 포함
   - 기존 `HistoryTab.tsx`에서 조정 내역 조회 가능

4. **API**:
   - `PATCH /api/admin/inventory/[id]` — 기존 route 활용 (수량 직접 수정)
   - 수정 시 adjust 트랜잭션 자동 생성

### 2-4. #19 하라셀 수분 단품

**목적**: 토너/세럼/크림 개별 재고 관리 (기존 세트와 별도)

**구현 사항**:
1. **신규 물품 등록** (migration 또는 seed data)
   ```
   - 하라셀 수분 토너 (단품) | category: cosmetics | sub_category: serum | unit: 개
   - 하라셀 수분 세럼 (단품) | category: cosmetics | sub_category: serum | unit: 개
   - 하라셀 수분 크림 (단품) | category: cosmetics | sub_category: cream | unit: 개
   ```

2. **기존 세트 유지**: "하라셀 수분 세트" (sub_category: set) 는 그대로

3. **유통기한 초기 데이터** (#20과 연계):
   - 토너: 2028-06-29
   - 세럼: 2028-07-24
   - 크림: 2028-05-13

### 2-5. #20 화장품 유통기한 관리 시스템

**목적**: 화장품별 유통기한 등록 + 색상 경고 + 초기 데이터

**구현 사항**:
1. **유통기한 입력 UI**
   - 화장품 등록/수정 시 유통기한 날짜 필드
   - `inventory_batches.expiry_date` 활용

2. **색상 경고 시스템** (공통 유틸 함수):
   ```ts
   function getExpiryStatus(expiryDate: string): 'normal' | 'warning' | 'critical' | 'expired'
   // 6개월 이상: normal (녹색)
   // 3~6개월: warning (주황)
   // 0~3개월: critical (빨강)
   // 만료: expired (빨강 + 라벨)
   ```

3. **화장품 카드에 유통기한 표시**
   - 각 화장품 옆에 유통기한 + 색상 배지
   - 세트: 구성품 중 가장 빠른 유통기한 대표 표시

4. **초기 유통기한 데이터 일괄 등록** (migration):

   **개별 제품**:
   | 제품명 | 유통기한 |
   |--------|---------|
   | 시트마스크 | 2028-08-18 |
   | 배리덤 쉴드 크림엠디 35g | 2028-04-15 |
   | 배리덤 쉴드 크림엠디 80g | 2028-04-15 |
   | MD 마데카로션 200g | 2027-10-29 |
   | MD 마데카로션 500g | 2027-11-13 |
   | MD 마데카크림 250g | 2027-06-26 |
   | 테오리아 EGF재생크림 | 2028-08-21 |

   **하라셀 수분 세트** (구성품별):
   | 구성품 | 유통기한 |
   |--------|---------|
   | 토너 | 2028-06-29 |
   | 실크폼 | 2028-06-19 |
   | 세럼 | 2028-07-24 |
   | 크림 | 2028-05-13 |
   | 선크림 | 2028-05-19 |

   **하라셀 수분 단품** (#19에서 등록):
   | 제품명 | 유통기한 |
   |--------|---------|
   | 토너 | 2028-06-29 |
   | 세럼 | 2028-07-24 |
   | 크림 | 2028-05-13 |

   **프리미엄 세트** (구성품별):
   | 구성품 | 유통기한 |
   |--------|---------|
   | 토너 | 2027-09-22 |
   | 세럼 | 2028-05-29 |
   | 크림 | 2028-05-28 |
   | 블레쉬밤 3개 묶음 | 2027-06-03 |
   | 블레쉬밤 1개 낱개 | 2027-06-09 |
   | 아이셀크림 | 2028-05-26 |

## 3. 기술 설계

### 3-1. 신규 파일

| 파일 | 용도 |
|------|------|
| `components/admin/inventory/BatchManager.tsx` | 배치별 유효기간 관리 UI (#12) |
| `components/admin/inventory/InventoryEditModal.tsx` | 재고 수정/삭제 모달 (#18) |
| `components/admin/inventory/ExpiryBadge.tsx` | 유통기한 색상 배지 공통 컴포넌트 (#20) |
| `app/api/admin/inventory/batches/route.ts` | 배치 CRUD API |
| `app/api/admin/inventory/batches/[id]/route.ts` | 개별 배치 수정/삭제 API |
| `lib/expiry-utils.ts` | 유통기한 계산 유틸리티 |
| `supabase/migrations/020_cosmetics_expiry_data.sql` | 단품 등록 + 초기 유통기한 데이터 |

### 3-2. 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `CosmeticsKioskView.tsx` | 샘플 탭 추가, 유통기한 표시, 수정/삭제 버튼 |
| `StockCardView.tsx` | 유효기간 배지 표시 |
| `StockTableView.tsx` | 유효기간 컬럼 추가 |
| `DetailPanel.tsx` | 배치 목록 + 유효기간 섹션 추가 |
| `RestockTab.tsx` | 입고 시 유효기간 입력 필드 추가 |
| `DashboardStatsCards.tsx` | 유통기한 임박 요약 (선택적) |

### 3-3. API 설계

#### `GET /api/admin/inventory/batches?item_id=xxx`
```json
{
  "batches": [
    {
      "id": "uuid",
      "item_id": "uuid",
      "batch_quantity": 10,
      "remaining_quantity": 7,
      "expiry_date": "2028-04-15",
      "received_at": "2026-02-01",
      "note": null,
      "created_at": "2026-02-01T10:00:00Z"
    }
  ]
}
```

#### `POST /api/admin/inventory/batches`
```json
{
  "item_id": "uuid",
  "batch_quantity": 10,
  "expiry_date": "2028-04-15",
  "received_at": "2026-02-19",
  "note": "초기 입고"
}
```

### 3-4. 유통기한 경고 로직

```ts
// lib/expiry-utils.ts
export type ExpiryStatus = 'normal' | 'warning' | 'critical' | 'expired';

export function getExpiryStatus(expiryDate: string | null): ExpiryStatus {
  if (!expiryDate) return 'normal';
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);

  if (diffMonths < 0) return 'expired';
  if (diffMonths < 3) return 'critical';
  if (diffMonths < 6) return 'warning';
  return 'normal';
}

export const EXPIRY_COLORS: Record<ExpiryStatus, string> = {
  normal: 'text-emerald-600 bg-emerald-50',
  warning: 'text-orange-600 bg-orange-50',
  critical: 'text-red-600 bg-red-50',
  expired: 'text-red-700 bg-red-100',
};
```

## 4. 구현 순서

```
Phase 1: 유틸리티 + API (기반)
  ├─ lib/expiry-utils.ts 생성
  ├─ /api/admin/inventory/batches/ 라우트 생성
  └─ ExpiryBadge.tsx 공통 컴포넌트

Phase 2: #19 하라셀 단품 등록
  ├─ Migration: 단품 3종 insert
  └─ CosmeticsKioskView에서 즉시 표시 확인

Phase 3: #20 유통기한 시스템
  ├─ Migration: 초기 유통기한 데이터 (inventory_batches insert)
  ├─ CosmeticsKioskView에 유통기한 배지 표시
  ├─ RestockTab에 유효기간 입력 필드
  └─ DetailPanel에 배치 목록 섹션

Phase 4: #12 배치별 유효기간 관리 UI
  ├─ BatchManager.tsx 구현
  ├─ FIFO 차감 로직 (use API 수정)
  └─ StockCardView/StockTableView에 earliest expiry 표시

Phase 5: #18 재고 수정/삭제
  ├─ InventoryEditModal.tsx 구현
  ├─ 확인 팝업 + 이력 로그
  └─ CosmeticsKioskView에 수정/삭제 버튼

Phase 6: #13 샘플 약물 섹션
  ├─ SUBCATEGORY_ORDER에 sample 탭 추가
  ├─ 샘플 등록/입고/출고 관리
  └─ 시각 구분 (배지 + 색상)
```

## 5. 리스크 및 고려사항

| 리스크 | 대응 |
|--------|------|
| 기존 화장품 items의 id 참조 | Migration에서 name 기준 매칭으로 item_id 연결 |
| 세트 구성품 유통기한 | 세트 자체에 earliest expiry만 대표 표시, 개별 추적은 단품으로 |
| FIFO 차감 정합성 | 배치 차감 시 트랜잭션 내에서 remaining_quantity 감소 + inventory_items.current_stock 동기화 |
| 모바일 UX | 모달/팝업은 bottom sheet 스타일, 날짜 picker는 native input[type="date"] 활용 |
| 초기 데이터 매칭 | 제품명이 DB에 정확히 일치하는지 migration 전 검증 필요 |

## 6. 성공 기준

- [ ] 화장품 목록에 유통기한 색상 배지 표시 (정상/주황/빨강/만료)
- [ ] 입고 시 유효기간 입력 가능
- [ ] 배치 목록 조회 (FIFO 정렬)
- [ ] 샘플 약물 탭에서 등록/입고/출고 관리
- [ ] 재고 수량 수정/삭제 + 확인 팝업 + 이력 로그
- [ ] 하라셀 수분 단품 3종 개별 관리
- [ ] 초기 유통기한 데이터 23건 일괄 등록
- [ ] 모바일/PC 양쪽 정상 동작
