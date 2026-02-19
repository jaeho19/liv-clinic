# Plan: admin-nurse-requests-foundation

> 간호팀 수정요청 20개 항목의 기반 작업 (DB 스키마 + 타입 정의)

## 1. 개요

### 배경
간호팀에서 관리자 홈페이지에 대한 20개 수정요청이 접수됨. 작업을 5개 창으로 분할하여 병렬 진행하기 위해, 모든 창이 의존하는 DB 스키마와 TypeScript 타입 정의를 먼저 완료해야 함.

### 목표
- 전체 20개 항목에 필요한 DB migration 생성
- `src/types/admin.ts`의 타입/인터페이스/카탈로그 업데이트
- 다른 4개 창(UI 작업)이 즉시 시작할 수 있는 기반 마련

### 범위
이 Plan은 **데이터 레이어만** 다룸. UI 컴포넌트 수정은 별도 창에서 진행.

## 2. 변경 항목 상세

### 2-A. PROCEDURE_CATALOG 변경 (admin.ts)

#### #1 실리프팅 분류 변경
- **현재**: `thread` → options: PDO, PLLA, PCL, APTOS
- **변경**: 브랜드명 기준 6개 시술로 분리
```
thread_aptos     → 압토스 (visage / light lift 500mm / light lift 250mm)
thread_mint      → 민트실 (리프트업)
thread_silhouette → 실루엣 소프트 (8콘 / 12콘)
thread_neodoctor → 네오닥터 JAMBER (23G×60 / 27G×50)
thread_epiticon  → 에피티콘 (Thin / jamber 25G×50)
thread_conseltina → 콘셀티나 (19×100 / 19×60 / 19×40)
```

#### #3-1 슈링크 이름 변경
- **현재**: `name: '슈링크 유니버스'`
- **변경**: `name: '슈링크'`

#### #4 보톡스 니들 레시피 삭제
- procedure_recipes에서 보톡스 시술의 니들 30G 참조 제거
- 해당 레시피 데이터 삭제 migration

#### #5 쥬베룩 단위 변경
- inventory_items에서 쥬베룩 볼륨/스킨 unit: `'시린지'` → `'바이알'`

#### #6 써마지 소모품 추가
- procedure_recipes에 써마지 FLX 레시피에 패치/플루이드/가스 추가

#### #7 스컬트라 주사용수 연동
- `주사용수` 항목 확인 또는 신규 등록
- procedure_recipes에 스컬트라 시술 → 주사용수 연결 추가

#### #8 수액세트 단위 변경
- inventory_items: `수액 set` unit `'박스'` → `'개'`

#### #9 모야랩 밴드 단위 변경
- inventory_items: `모아랩 밴드` unit `'박스'` → `'개'`

#### #16 약물 cc 표기
- inventory_items에 `volume_cc` 컬럼 추가 (nullable NUMERIC)
- 또는 기존 specification 필드 활용

### 2-B. 샷 추적 시스템 신규 테이블 (#2, #3-2)

```sql
-- device_tip_shots: 팁별 잔여 샷 수 추적
CREATE TABLE device_tip_shots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  tip_type TEXT NOT NULL,           -- '1.5', '3.0', '4.5' 등
  device_type TEXT NOT NULL,        -- 'ulthera', 'shurink'
  initial_shots INTEGER NOT NULL,   -- 초기 샷 수
  remaining_shots INTEGER NOT NULL, -- 잔여 샷 수
  is_active BOOLEAN DEFAULT true,
  registered_at TIMESTAMPTZ DEFAULT now(),
  exhausted_at TIMESTAMPTZ          -- 소진 시점
);

-- device_shot_logs: 샷 사용 이력
CREATE TABLE device_shot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_id UUID NOT NULL REFERENCES device_tip_shots(id),
  shots_used INTEGER NOT NULL,
  patient_name TEXT,
  chart_number TEXT,
  procedure_area TEXT,              -- 상안면/하안면/전안면 등
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**초기 샷 수 설정:**
| 장비 | 팁 | 초기 샷 |
|------|-----|---------|
| 울쎄라 | 1.5, 3.0, 4.5 | 2,400 |
| 슈링크 | 4.5, 3.0, 2.0 | 20,000 |
| 슈링크 | 1.5 | 12,000 |
| 슈링크 | v슈링크, S슈링크 | 15,000 |

### 2-C. 유효기간/유통기한 시스템 (#12, #20)

```sql
-- inventory_batches: 입고 배치별 유효기간 관리
CREATE TABLE inventory_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  batch_quantity INTEGER NOT NULL,    -- 배치 수량
  remaining_quantity INTEGER NOT NULL,-- 잔여 수량
  expiry_date DATE,                   -- 유효기한
  received_at DATE DEFAULT CURRENT_DATE, -- 입고일
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2-D. inventory_items 컬럼 추가 (#15 냉장, #16 용량)

```sql
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS is_refrigerated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS volume_cc NUMERIC(5,1);
```

- `is_refrigerated`: 냉장 보관 여부
- `volume_cc`: 용량(cc) - 1cc가 아닌 약물에 표기용

### 2-E. 카테고리 확장 (#13 샘플 약물)

```sql
-- category CHECK 제약조건에 'sample' 추가
ALTER TABLE inventory_items
  DROP CONSTRAINT IF EXISTS inventory_items_category_check;
ALTER TABLE inventory_items
  ADD CONSTRAINT inventory_items_category_check
  CHECK (category IN ('device_tip', 'injection', 'thread', 'consumable', 'skincare', 'medicine', 'cosmetics', 'sample'));
```

### 2-F. TypeScript 타입 업데이트 (admin.ts)

1. **InventoryCategory** 타입에 `'sample'` 추가
2. **INVENTORY_CATEGORY_LABELS**에 `sample: '샘플 약물'` 추가
3. **InventoryItem** 인터페이스에 필드 추가:
   - `is_refrigerated?: boolean`
   - `volume_cc?: number`
4. **PROCEDURE_CATALOG** 실리프팅 항목 6개 브랜드로 분리
5. **슈링크 유니버스 → 슈링크** 이름 변경
6. **DeviceTipShot, DeviceShotLog** 인터페이스 신규 추가
7. **InventoryBatch** 인터페이스 신규 추가
8. **COSMETICS_SUBCATEGORIES**는 유지

### 2-G. 데이터 수정 Migration

```sql
-- 쥬베룩 단위 변경
UPDATE inventory_items SET unit = '바이알'
WHERE name IN ('쥬베룩 볼륨', '쥬베룩 스킨부스터');

-- 수액세트 단위 변경
UPDATE inventory_items SET unit = '개' WHERE name = '수액 set';

-- 모야랩(모아랩) 밴드 단위 변경
UPDATE inventory_items SET unit = '개' WHERE name = '모아랩 밴드';

-- 냉장 약물 표기 업데이트
UPDATE inventory_items SET is_refrigerated = true
WHERE storage_note LIKE '%냉장%' OR storage_note LIKE '%마약냉장%';

-- 용량 표기 업데이트
UPDATE inventory_items SET volume_cc = 2 WHERE name = '리쥬란힐러';
UPDATE inventory_items SET volume_cc = 3 WHERE name LIKE '%e.p.t.q%3.0ml%';

-- 보톡스 레시피에서 니들 제거
DELETE FROM procedure_recipes
WHERE procedure_name LIKE '보톡스 시술%'
  AND item_id IN (SELECT id FROM inventory_items WHERE sub_category = 'needle');

-- 써마지 레시피에 소모품 추가
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '써마지 FLX 600', id, 1, '패치' FROM inventory_items WHERE name LIKE '써마지 패치%';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '써마지 FLX 600', id, 1, '플루이드' FROM inventory_items WHERE name LIKE '써마지 플루이드%';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '써마지 FLX 600', id, 1, '가스' FROM inventory_items WHERE name = '써마지 가스';
-- 900, 400, 225도 동일 패턴 반복

-- 스컬트라 주사용수 연동
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '스컬트라 시술', id, 1, '스컬트라 1바이알당 주사용수 1개'
FROM inventory_items WHERE name = '멸균증류수 1L';

-- 화장품 유통기한 초기 데이터 (inventory_batches에 입력)
-- (화장품 20개 항목의 유통기한 데이터는 창 5에서 처리)
```

## 3. 파일 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| `supabase/migrations/018_nurse_requests_schema.sql` | 신규 테이블 + 컬럼 추가 |
| `supabase/migrations/019_nurse_requests_data.sql` | 데이터 수정 (단위, 레시피 등) |
| `src/types/admin.ts` | 타입/인터페이스/카탈로그 업데이트 |

## 4. 다른 창과의 의존관계

```
[이 창: Foundation] ──완료──┬──> 창 2: KioskView UI (PROCEDURE_CATALOG 의존)
                            ├──> 창 3: 재고 대시보드 (InventoryItem 타입 의존)
                            ├──> 창 4: 샷 추적 UI (DeviceTipShot 타입 의존)
                            └──> 창 5: 화장품+유효기간 (InventoryBatch 타입 의존)
```

## 5. 완료 기준

- [ ] migration 파일 2개 생성 (스키마 + 데이터)
- [ ] admin.ts 타입/인터페이스 업데이트 완료
- [ ] PROCEDURE_CATALOG 실리프팅 6개 브랜드 분리
- [ ] 슈링크 이름 변경 반영
- [ ] `npm run build` 타입 에러 없음
- [ ] 다른 창에서 바로 사용 가능한 상태

## 6. 예상 작업 순서

1. migration 018: 신규 테이블 (device_tip_shots, device_shot_logs, inventory_batches) + 컬럼 추가
2. migration 019: 데이터 수정 (단위 변경, 레시피 수정, 냉장 표기, 용량 표기)
3. admin.ts 타입 업데이트 (인터페이스 + 카탈로그)
4. 빌드 확인
