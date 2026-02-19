-- 018: 간호팀 수정요청 - 스키마 변경
-- 신규 테이블: device_tip_shots, device_shot_logs, inventory_batches
-- 컬럼 추가: inventory_items.is_refrigerated, inventory_items.volume_cc
-- 카테고리 확장: 'sample' 추가
-- 2026-02-19

-- ============================================
-- 1. inventory_items 카테고리 CHECK 확장
-- ============================================
ALTER TABLE inventory_items
  DROP CONSTRAINT IF EXISTS inventory_items_category_check;

ALTER TABLE inventory_items
  ADD CONSTRAINT inventory_items_category_check
  CHECK (category IN (
    'device_tip', 'injection', 'thread', 'consumable',
    'skincare', 'medicine', 'cosmetics', 'sample'
  ));

-- ============================================
-- 2. inventory_items 컬럼 추가
-- ============================================

-- 냉장 보관 여부
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS is_refrigerated BOOLEAN NOT NULL DEFAULT false;

-- 용량(cc) 표기 (1cc가 아닌 약물에 사용)
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS volume_cc NUMERIC(5,1);

-- ============================================
-- 3. device_tip_shots (팁별 잔여 샷 수 추적)
-- ============================================
CREATE TABLE IF NOT EXISTS device_tip_shots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  tip_type TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('ulthera', 'shurink')),
  initial_shots INTEGER NOT NULL CHECK (initial_shots > 0),
  remaining_shots INTEGER NOT NULL CHECK (remaining_shots >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  exhausted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_device_tip_shots_device ON device_tip_shots(device_type);
CREATE INDEX IF NOT EXISTS idx_device_tip_shots_active ON device_tip_shots(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_device_tip_shots_item ON device_tip_shots(item_id);

-- ============================================
-- 4. device_shot_logs (샷 사용 이력)
-- ============================================
CREATE TABLE IF NOT EXISTS device_shot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_id UUID NOT NULL REFERENCES device_tip_shots(id) ON DELETE CASCADE,
  shots_used INTEGER NOT NULL CHECK (shots_used > 0),
  patient_name TEXT,
  chart_number TEXT,
  procedure_area TEXT,
  note TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_shot_logs_tip ON device_shot_logs(tip_id);
CREATE INDEX IF NOT EXISTS idx_device_shot_logs_created ON device_shot_logs(created_at DESC);

-- ============================================
-- 5. inventory_batches (입고 배치별 유효기간)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  batch_quantity INTEGER NOT NULL CHECK (batch_quantity > 0),
  remaining_quantity INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE,
  received_at DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_batches_item ON inventory_batches(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_expiry ON inventory_batches(expiry_date)
  WHERE expiry_date IS NOT NULL;

-- ============================================
-- 6. RLS 정책
-- ============================================
ALTER TABLE device_tip_shots ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_shot_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage device_tip_shots"
  ON device_tip_shots FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage device_shot_logs"
  ON device_shot_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage inventory_batches"
  ON inventory_batches FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 7. 샷 차감 함수
-- ============================================
CREATE OR REPLACE FUNCTION use_device_shots(
  p_tip_id UUID,
  p_shots_used INTEGER,
  p_patient_name TEXT DEFAULT NULL,
  p_chart_number TEXT DEFAULT NULL,
  p_procedure_area TEXT DEFAULT NULL,
  p_note TEXT DEFAULT NULL,
  p_created_by TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_remaining INTEGER;
  v_log_id UUID;
BEGIN
  -- 현재 잔여 샷 확인 (행 잠금)
  SELECT remaining_shots INTO v_remaining
  FROM device_tip_shots
  WHERE id = p_tip_id AND is_active = true
  FOR UPDATE;

  IF v_remaining IS NULL THEN
    RAISE EXCEPTION 'Active tip not found: %', p_tip_id;
  END IF;

  IF v_remaining < p_shots_used THEN
    RAISE EXCEPTION 'Insufficient shots: remaining=%, requested=%', v_remaining, p_shots_used;
  END IF;

  -- 잔여 샷 차감 + 소진 시 비활성화
  UPDATE device_tip_shots
  SET remaining_shots = remaining_shots - p_shots_used,
      exhausted_at = CASE
        WHEN remaining_shots - p_shots_used <= 0 THEN now()
        ELSE exhausted_at
      END,
      is_active = CASE
        WHEN remaining_shots - p_shots_used <= 0 THEN false
        ELSE true
      END
  WHERE id = p_tip_id;

  -- 사용 이력 기록
  INSERT INTO device_shot_logs (tip_id, shots_used, patient_name, chart_number, procedure_area, note, created_by)
  VALUES (p_tip_id, p_shots_used, p_patient_name, p_chart_number, p_procedure_area, p_note, p_created_by)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;
