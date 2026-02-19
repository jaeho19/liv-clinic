# Design: admin-nurse-requests-foundation

> Feature: `admin-nurse-requests-foundation`
> Plan: `docs/01-plan/features/admin-nurse-requests-foundation.plan.md`
> Created: 2026-02-19
> Status: Draft

---

## 1. 데이터 구조 설계

### 1-1. 신규 테이블: device_tip_shots (팁 샷 수 추적)

```sql
CREATE TABLE IF NOT EXISTS device_tip_shots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  tip_type TEXT NOT NULL,             -- '1.5', '3.0', '4.5', 'v슈링크', 'S슈링크'
  device_type TEXT NOT NULL CHECK (device_type IN ('ulthera', 'shurink')),
  initial_shots INTEGER NOT NULL,     -- 초기 샷 수
  remaining_shots INTEGER NOT NULL,   -- 잔여 샷 수
  is_active BOOLEAN NOT NULL DEFAULT true,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  exhausted_at TIMESTAMPTZ            -- 소진 완료 시점
);

CREATE INDEX idx_device_tip_shots_device ON device_tip_shots(device_type);
CREATE INDEX idx_device_tip_shots_active ON device_tip_shots(is_active) WHERE is_active = true;
```

**초기 샷 수 매핑:**

| device_type | tip_type | initial_shots |
|-------------|----------|---------------|
| ulthera | 1.5, 3.0, 4.5 | 2400 |
| shurink | 4.5, 3.0, 2.0 | 20000 |
| shurink | 1.5 | 12000 |
| shurink | v슈링크, S슈링크 | 15000 |

### 1-2. 신규 테이블: device_shot_logs (샷 사용 이력)

```sql
CREATE TABLE IF NOT EXISTS device_shot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_id UUID NOT NULL REFERENCES device_tip_shots(id) ON DELETE CASCADE,
  shots_used INTEGER NOT NULL CHECK (shots_used > 0),
  patient_name TEXT,
  chart_number TEXT,
  procedure_area TEXT,    -- '상안면', '하안면', '전안면', '전안면+목'
  note TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_shot_logs_tip ON device_shot_logs(tip_id);
CREATE INDEX idx_device_shot_logs_created ON device_shot_logs(created_at DESC);
```

### 1-3. 신규 테이블: inventory_batches (배치별 유효기간)

```sql
CREATE TABLE IF NOT EXISTS inventory_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  batch_quantity INTEGER NOT NULL CHECK (batch_quantity > 0),
  remaining_quantity INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE,                    -- 유효기한/유통기한
  received_at DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_batches_item ON inventory_batches(item_id);
CREATE INDEX idx_inventory_batches_expiry ON inventory_batches(expiry_date)
  WHERE expiry_date IS NOT NULL;
```

### 1-4. inventory_items 컬럼 확장

```sql
-- 카테고리 CHECK 확장 (sample 추가)
ALTER TABLE inventory_items
  DROP CONSTRAINT IF EXISTS inventory_items_category_check;
ALTER TABLE inventory_items
  ADD CONSTRAINT inventory_items_category_check
  CHECK (category IN (
    'device_tip', 'injection', 'thread', 'consumable',
    'skincare', 'medicine', 'cosmetics', 'sample'
  ));

-- 냉장 보관 여부
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS is_refrigerated BOOLEAN NOT NULL DEFAULT false;

-- 용량(cc) 표기
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS volume_cc NUMERIC(5,1);
```

### 1-5. RLS 정책 (신규 테이블)

```sql
ALTER TABLE device_tip_shots ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_shot_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage device_tip_shots"
  ON device_tip_shots FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage device_shot_logs"
  ON device_shot_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage inventory_batches"
  ON inventory_batches FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 1-6. 샷 차감 함수

```sql
CREATE OR REPLACE FUNCTION use_device_shots(
  p_tip_id UUID,
  p_shots_used INTEGER,
  p_patient_name TEXT DEFAULT NULL,
  p_chart_number TEXT DEFAULT NULL,
  p_procedure_area TEXT DEFAULT NULL,
  p_created_by TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_remaining INTEGER;
  v_log_id UUID;
BEGIN
  SELECT remaining_shots INTO v_remaining
  FROM device_tip_shots WHERE id = p_tip_id AND is_active = true FOR UPDATE;

  IF v_remaining IS NULL THEN
    RAISE EXCEPTION 'Active tip not found: %', p_tip_id;
  END IF;

  IF v_remaining < p_shots_used THEN
    RAISE EXCEPTION 'Insufficient shots: remaining=%, requested=%', v_remaining, p_shots_used;
  END IF;

  UPDATE device_tip_shots
  SET remaining_shots = remaining_shots - p_shots_used,
      exhausted_at = CASE WHEN remaining_shots - p_shots_used <= 0 THEN now() ELSE NULL END,
      is_active = CASE WHEN remaining_shots - p_shots_used <= 0 THEN false ELSE true END
  WHERE id = p_tip_id;

  INSERT INTO device_shot_logs (tip_id, shots_used, patient_name, chart_number, procedure_area, created_by)
  VALUES (p_tip_id, p_shots_used, p_patient_name, p_chart_number, p_procedure_area, p_created_by)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 2. TypeScript 타입 설계

### 2-1. 신규 인터페이스 (admin.ts 하단에 추가)

```typescript
// ==========================================
// Device Shot Tracking (샷 수 추적)
// ==========================================

export type DeviceType = 'ulthera' | 'shurink';

export interface DeviceTipShot {
  id: string;
  item_id: string;
  tip_type: string;        // '1.5', '3.0', '4.5', 'v슈링크', 'S슈링크'
  device_type: DeviceType;
  initial_shots: number;
  remaining_shots: number;
  is_active: boolean;
  registered_at: string;
  exhausted_at: string | null;
}

export interface DeviceShotLog {
  id: string;
  tip_id: string;
  shots_used: number;
  patient_name?: string;
  chart_number?: string;
  procedure_area?: string;
  note?: string;
  created_by?: string;
  created_at: string;
}

/** 장비별 팁 초기 샷 수 설정 */
export const DEVICE_INITIAL_SHOTS: Record<DeviceType, Record<string, number>> = {
  ulthera: {
    '1.5': 2400,
    '3.0': 2400,
    '4.5': 2400,
  },
  shurink: {
    '4.5': 20000,
    '3.0': 20000,
    '2.0': 20000,
    '1.5': 12000,
    'v슈링크': 15000,
    'S슈링크': 15000,
  },
};

// ==========================================
// Inventory Batches (배치별 유효기간)
// ==========================================

export interface InventoryBatch {
  id: string;
  item_id: string;
  batch_quantity: number;
  remaining_quantity: number;
  expiry_date: string | null;   // 'YYYY-MM-DD'
  received_at: string;          // 'YYYY-MM-DD'
  note?: string;
  created_at: string;
}
```

### 2-2. InventoryItem 인터페이스 확장

```typescript
export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  sub_category?: string;
  specification?: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  unit_price: number;
  supplier?: string;
  storage_note?: string;
  is_active: boolean;
  is_refrigerated: boolean;     // 추가: 냉장 보관 여부
  volume_cc?: number;           // 추가: 용량(cc) 표기
  created_at: string;
  updated_at: string;
}
```

### 2-3. InventoryCategory 확장

```typescript
export type InventoryCategory =
  | 'device_tip' | 'injection' | 'thread' | 'consumable'
  | 'skincare' | 'medicine' | 'cosmetics' | 'sample';

export const INVENTORY_CATEGORY_LABELS: Record<InventoryCategory, string> = {
  device_tip: '장비 팁/카트리지',
  injection: '주사제',
  thread: '실리프팅',
  consumable: '소모품',
  skincare: '스킨케어',
  medicine: '약물/연고',
  cosmetics: '화장품',
  sample: '샘플 약물',   // 추가
};
```

### 2-4. PROCEDURE_CATALOG 실리프팅 변경

**현재 (1개 항목, 재질 기반):**
```typescript
{
  id: 'thread',
  name: '실리프팅',
  category: 'lifting',
  options: [
    { label: 'PDO', recipeName: '실리프팅 PDO' },
    { label: 'PLLA', recipeName: '실리프팅 PLLA' },
    { label: 'PCL', recipeName: '실리프팅 PCL' },
    { label: 'APTOS', recipeName: '실리프팅 APTOS' },
  ],
},
```

**변경 후 (6개 항목, 브랜드 기반):**
```typescript
{
  id: 'thread_aptos',
  name: '압토스 (APTOS)',
  category: 'lifting',
  options: [
    { label: 'visage', recipeName: '압토스 visage' },
    { label: 'light lift 500mm', recipeName: '압토스 light lift 500mm' },
    { label: 'light lift 250mm', recipeName: '압토스 light lift 250mm' },
  ],
},
{
  id: 'thread_mint',
  name: '민트실',
  category: 'lifting',
  options: [
    { label: '리프트업', recipeName: '민트실 리프트업' },
  ],
},
{
  id: 'thread_silhouette',
  name: '실루엣 소프트',
  category: 'lifting',
  options: [
    { label: '8콘', recipeName: '실루엣소프트 8콘' },
    { label: '12콘', recipeName: '실루엣소프트 12콘' },
  ],
},
{
  id: 'thread_neodoctor',
  name: '네오닥터 JAMBER',
  category: 'lifting',
  options: [
    { label: '23G×60', recipeName: '네오닥터 JAMBER 23G×60' },
    { label: '27G×50', recipeName: '네오닥터 JAMBER 27G×50' },
  ],
},
{
  id: 'thread_epiticon',
  name: '에피티콘',
  category: 'lifting',
  options: [
    { label: 'Thin', recipeName: '에피티콘 Thin' },
    { label: 'jamber 25G×50', recipeName: '에피티콘 jamber 25G×50' },
  ],
},
{
  id: 'thread_conseltina',
  name: '콘셀티나',
  category: 'lifting',
  options: [
    { label: '19×100', recipeName: '콘셀티나 19×100' },
    { label: '19×60', recipeName: '콘셀티나 19×60' },
    { label: '19×40', recipeName: '콘셀티나 19×40' },
  ],
},
```

### 2-5. 슈링크 이름 변경

```typescript
// 변경 전
{ id: 'shurink', name: '슈링크 유니버스', category: 'lifting', ... }

// 변경 후
{ id: 'shurink', name: '슈링크', category: 'lifting', ... }
```

### 2-6. PROCEDURE_RECIPE_MAP 업데이트

기존 `thread` → 삭제하고 개별 브랜드 매핑은 불필요 (options에 recipeName 있으므로).

---

## 3. Migration 파일 설계

### 3-1. `018_nurse_requests_schema.sql` (스키마 변경)

```
순서:
1. inventory_items 카테고리 CHECK 확장 (sample 추가)
2. inventory_items 컬럼 추가 (is_refrigerated, volume_cc)
3. device_tip_shots 테이블 생성
4. device_shot_logs 테이블 생성
5. inventory_batches 테이블 생성
6. RLS 정책 생성
7. use_device_shots() 함수 생성
```

### 3-2. `019_nurse_requests_data.sql` (데이터 변경)

```
순서:
1. 단위 변경
   - 쥬베룩 볼륨/스킨: 시린지 → 바이알
   - 수액 set: 박스 → 개
   - 모아랩 밴드: 박스 → 개

2. 냉장 표기 업데이트
   - storage_note에 '냉장' 포함하는 항목 → is_refrigerated = true

3. 용량(cc) 표기 업데이트
   - 리쥬란힐러 → volume_cc = 2
   - e.p.t.q. eve S Plus 3.0ml → volume_cc = 3

4. 보톡스 레시피 니들 삭제
   - procedure_name LIKE '보톡스 시술%' AND item이 니들인 레시피 삭제

5. 써마지 레시피에 소모품 추가
   - 모든 써마지 레시피(600/900/400/225)에 패치, 플루이드, 가스 추가

6. 스컬트라 레시피에 주사용수 추가
   - 스컬트라 시술 → 멸균증류수 1L (또는 N/S) 연결

7. 실리프팅 레시피 재구성
   - 기존 '실리프팅 PDO/PLLA/PCL/APTOS' 레시피 삭제
   - 브랜드별 신규 레시피 생성:
     - '압토스 visage' → 압토스 visage (item)
     - '압토스 light lift 500mm' → 압토스 light lift 500mm (item)
     - '압토스 light lift 250mm' → 압토스 light lift 250mm (item)
     - '민트실 리프트업' → 민트실 리프트업 (item)
     - '실루엣소프트 8콘' → 실루엣소프트 8 (item)
     - '실루엣소프트 12콘' → 실루엣소프트 12 (item)
     - '네오닥터 JAMBER 23G×60' → 네오닥터 JAMBER 23G*60 (item)
     - '네오닥터 JAMBER 27G×50' → 네오닥터 JAMBER 27G*50 (item)
     - '에피티콘 Thin' → 에피티콘 Thin (sam) (item)
     - '에피티콘 jamber 25G×50' → 에피티콘 jamber 25G*50 (sam) (item)
     - '콘셀티나 19×100' → 콘셀티나 19*100 (item)
     - '콘셀티나 19×60' → 콘셀티나 19*60 (item)
     - '콘셀티나 19×40' → 콘셀티나 19*40 (item)
```

---

## 4. 파일 변경 목록 (정확한 경로)

| # | 파일 | 작업 | 변경 내용 |
|---|------|------|----------|
| 1 | `liv-clinic/supabase/migrations/018_nurse_requests_schema.sql` | 생성 | 신규 테이블 3개 + 컬럼 2개 + RLS + 함수 |
| 2 | `liv-clinic/supabase/migrations/019_nurse_requests_data.sql` | 생성 | 단위 변경, 냉장 표기, cc 표기, 레시피 재구성 |
| 3 | `liv-clinic/src/types/admin.ts` | 수정 | InventoryCategory에 sample 추가, InventoryItem 필드 추가, PROCEDURE_CATALOG 변경, 신규 인터페이스 3개 |

---

## 5. 구현 순서

```
Step 1: 018_nurse_requests_schema.sql 생성
        → 테이블, 컬럼, RLS, 함수

Step 2: 019_nurse_requests_data.sql 생성
        → 데이터 변경 (단위, 레시피, 표기)

Step 3: admin.ts 수정
        3-a: InventoryCategory 타입 + LABELS에 sample 추가
        3-b: InventoryItem 인터페이스에 is_refrigerated, volume_cc 추가
        3-c: PROCEDURE_CATALOG에서 thread 항목을 6개 브랜드로 분리
        3-d: shurink name '슈링크 유니버스' → '슈링크'
        3-e: DeviceTipShot, DeviceShotLog, InventoryBatch 인터페이스 추가
        3-f: DEVICE_INITIAL_SHOTS 상수 추가
        3-g: GENERAL_INVENTORY_CATEGORIES에 sample 여부 결정

Step 4: 빌드 검증
        → npm run build (타입 에러 확인)
```

---

## 6. 다른 창에서 참조할 항목

### 창 2 (키오스크 시술 UI)가 참조:
- PROCEDURE_CATALOG의 변경된 실리프팅 6개 브랜드
- 새 recipeName 매핑

### 창 3 (재고 대시보드)이 참조:
- InventoryItem.is_refrigerated (냉장 표기)
- InventoryItem.volume_cc (용량 표기)
- InventoryCategory 'sample' (샘플 탭)

### 창 4 (샷 추적 UI)가 참조:
- DeviceTipShot, DeviceShotLog 인터페이스
- DEVICE_INITIAL_SHOTS 상수
- use_device_shots() DB 함수

### 창 5 (화장품 + 유효기간)가 참조:
- InventoryBatch 인터페이스
- inventory_batches 테이블

---

## 7. 주의사항

1. **레시피 이름 일관성**: recipeName과 DB의 procedure_name이 정확히 일치해야 함. 특히 실리프팅 브랜드 분리 시 기존 `*` → `×` 기호 주의 (DB seed에서는 `*` 사용)
2. **하위 호환**: PROCEDURE_RECIPE_MAP에서 기존 `thread` 제거 후 빌드 에러 확인
3. **냉장 표기**: `storage_note`에 '냉장' 또는 '마약냉장'이 포함된 모든 항목을 자동 매핑
4. **카테고리 CHECK**: PostgreSQL은 기존 CHECK를 DROP 후 재생성해야 함 (ALTER로 변경 불가)
5. **주사용수**: 스컬트라에 연결할 주사용수 품목이 `멸균증류수 1L` (consumable/iv_fluid)인지 확인 필요 — 별도 `주사용수` 항목이 없으면 기존 항목 사용
