# PDCA Design: 재고관리 대시보드

## 1. 데이터베이스 설계

### 1.1 inventory_items (품목 마스터)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | 품목 ID |
| name | TEXT NOT NULL | 품목명 |
| category | TEXT NOT NULL | device_tip, injection, thread, consumable, skincare |
| sub_category | TEXT | 세부 분류 (ulthera, thermage, density, potenza 등) |
| specification | TEXT | 규격 (3.0mm, 600팁, 100U 등) |
| unit | TEXT NOT NULL | 단위 (개, 바이알, 시린지, 팁) |
| current_stock | INTEGER DEFAULT 0 | 현재 재고 |
| min_stock | INTEGER DEFAULT 0 | 최소 재고 |
| unit_price | INTEGER DEFAULT 0 | 단가 (원) |
| supplier | TEXT | 공급사 |
| storage_note | TEXT | 보관 조건 |
| is_active | BOOLEAN DEFAULT true | 활성 여부 |
| created_at | TIMESTAMPTZ | 생성일 |
| updated_at | TIMESTAMPTZ | 수정일 |

### 1.2 inventory_transactions (입출고 트랜잭션)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | 트랜잭션 ID |
| item_id | UUID FK | 품목 ID |
| tx_type | TEXT NOT NULL | use, restock, adjust, dispose |
| quantity | INTEGER NOT NULL | 수량 (항상 양수) |
| patient_name | TEXT | 환자명 |
| chart_number | TEXT | 차트번호 |
| note | TEXT | 사유/메모 |
| confirmed_by | TEXT | 확인자 |
| created_by | TEXT | 기록자 |
| created_at | TIMESTAMPTZ | 기록일 |

### 1.3 procedure_recipes (시술별 레시피)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | 레시피 ID |
| procedure_name | TEXT NOT NULL | 시술명 |
| item_id | UUID FK | 품목 ID |
| default_qty | INTEGER NOT NULL | 기본 수량 |
| note | TEXT | 비고 |

---

## 2. 컴포넌트 설계

### 2.1 페이지 구조
```
inventory/page.tsx
├── InventoryHeader          - 제목 + 물품 사용 버튼
├── StatsCards               - 통계 카드 (총 품목, 정상, 부족, 소진, 총 가치)
├── AlertBanner              - 긴급 경고 배너 (소진/부족 품목)
├── TabNavigation            - [재고 현황] [사용 이력] [입고 관리]
│
├── Tab: 재고 현황
│   ├── FilterBar            - 검색 + 카테고리 + 상태 필터
│   ├── InventoryTable       - 품목 테이블
│   └── DetailPanel          - 품목 상세 (우측 사이드)
│
├── Tab: 사용 이력
│   ├── DateRangeFilter      - 기간 필터
│   ├── UsageHistoryTable    - 사용 내역 테이블
│   └── ConsumptionChart     - 월별 소모량 바 차트
│
├── Tab: 입고 관리
│   ├── RestockHistory       - 입고 내역
│   └── ReorderSuggestions   - 발주 추천 목록
│
├── Modal: UseItemModal      - 물품 사용 기록
├── Modal: StockModal        - 입고/출고 모달 (기존)
└── Modal: AddItemModal      - 새 품목 등록 (기존)
```

### 2.2 UseItemModal (핵심 신규 기능)
```
Props:
  items: InventoryItem[]      - 전체 품목 목록
  recipes: ProcedureRecipe[]  - 시술 레시피
  onSubmit: (data) => void
  onClose: () => void

State:
  patientName: string
  chartNumber: string
  selectedProcedure: string
  usageItems: { itemId, quantity }[]
  confirmedBy: string
  note: string

Flow:
  1. 시술 선택 → 레시피 기반으로 usageItems 자동 세팅
  2. 수량 수정 가능
  3. 추가 물품 선택 가능
  4. 저장 시 각 물품별 inventory_transaction(tx_type='use') 생성
  5. inventory_items.current_stock 차감
```

---

## 3. API 설계

### 3.1 품목 CRUD
- `GET /api/admin/inventory` - 전체 목록 + 필터
- `POST /api/admin/inventory` - 신규 등록
- `PATCH /api/admin/inventory/[id]` - 수정
- `DELETE /api/admin/inventory/[id]` - 삭제

### 3.2 트랜잭션
- `POST /api/admin/inventory/use` - 물품 사용 기록 (다건)
- `POST /api/admin/inventory/restock` - 입고
- `GET /api/admin/inventory/transactions` - 이력 조회 (기간/품목 필터)

### 3.3 레시피
- `GET /api/admin/inventory/recipes` - 레시피 목록
- `POST /api/admin/inventory/recipes` - 레시피 등록/수정

### 3.4 통계
- `GET /api/admin/inventory/stats` - 대시보드 통계
- `GET /api/admin/inventory/consumption` - 월별 소모량

---

## 4. 초기 시딩 데이터 (마크다운 기반)

### 장비 팁
| name | category | sub_category | specification | unit |
|------|----------|-------------|---------------|------|
| 울쎄라 카트리지 DS 7-4.5 | device_tip | ulthera | 4.5mm | 개 |
| 울쎄라 카트리지 DS 7-3.0 | device_tip | ulthera | 3.0mm | 개 |
| 울쎄라 카트리지 DS 7-1.5 | device_tip | ulthera | 1.5mm | 개 |
| 써마지 FLX 팁 300샷 | device_tip | thermage | 300팁 | 개 |
| 써마지 FLX 팁 600샷 | device_tip | thermage | 600팁 | 개 |
| 써마지 FLX 팁 900샷 | device_tip | thermage | 900팁 | 개 |
| 아이써마지 팁 225샷 | device_tip | thermage | 225팁 | 개 |
| 아이써마지 팁 450샷 | device_tip | thermage | 450팁 | 개 |
| 덴서티 팁 300샷 | device_tip | density | 300팁 | 개 |
| 덴서티 팁 600샷 | device_tip | density | 600팁 | 개 |
| 포텐자 CP-25 팁 | device_tip | potenza | CP-25 | 개 |
| 포텐자 NP-25 팁 | device_tip | potenza | NP-25 | 개 |
| 슈링크 유니버스 카트리지 | device_tip | shurink | - | 개 |

### 레시피 예시
| procedure_name | item | default_qty |
|---------------|------|------------|
| 울쎄라 리프팅 (전체) | 울쎄라 DS 7-3.0 | 1 |
| 울쎄라 리프팅 (전체) | 울쎄라 DS 7-4.5 | 1 |
| 울쎄라 리프팅 (전체) | 마취 크림 | 1 |
| 울쎄라 리프팅 (전체) | 냉각젤 | 1 |
| 써마지 FLX 600 | 써마지 FLX 팁 600샷 | 1 |
| 써마지 FLX 600 | 마취 크림 | 1 |
| 써마지 FLX 900 | 써마지 FLX 팁 900샷 | 1 |
| 써마지 FLX 900 | 마취 크림 | 1 |
| 아이써마지 450 | 아이써마지 팁 450샷 | 1 |
| 덴서티 600 | 덴서티 팁 600샷 | 1 |
| 덴서티 600 | 마취 크림 | 1 |
| 보톡스 시술 | 보톡스 (엘러간 100U) | 1 |
| 보톡스 시술 | 일회용 니들 30G | 2 |
| 필러 시술 (쥬비덤) | 쥬비덤 볼류마 1ml | 1 |
| 필러 시술 (쥬비덤) | 캐뉼라 25G | 1 |
| 필러 시술 (쥬비덤) | 마취 크림 | 1 |
