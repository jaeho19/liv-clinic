-- Phase 3: 재고관리 시스템
-- inventory_items, inventory_transactions, procedure_recipes, inventory_counts

-- ============================================
-- 1. inventory_items (품목 마스터)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('device_tip', 'injection', 'thread', 'consumable', 'skincare', 'medicine')),
  sub_category TEXT,
  specification TEXT,
  unit TEXT NOT NULL DEFAULT '개',
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  unit_price INTEGER NOT NULL DEFAULT 0,
  supplier TEXT,
  storage_note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_active ON inventory_items(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_inventory_items_stock ON inventory_items(current_stock, min_stock);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_inventory_updated_at();

-- ============================================
-- 2. inventory_transactions (입출고 트랜잭션)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('use', 'restock', 'adjust', 'dispose')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  patient_name TEXT,
  chart_number TEXT,
  note TEXT,
  confirmed_by TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_inventory_tx_item ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_type ON inventory_transactions(tx_type);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_created ON inventory_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_patient ON inventory_transactions(chart_number) WHERE chart_number IS NOT NULL;

-- ============================================
-- 3. procedure_recipes (시술별 소모 레시피)
-- ============================================
CREATE TABLE IF NOT EXISTS procedure_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_name TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  default_qty INTEGER NOT NULL DEFAULT 1,
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_procedure_recipes_name ON procedure_recipes(procedure_name);

-- ============================================
-- 4. inventory_counts (정기 실사 기록)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  count_type TEXT NOT NULL DEFAULT '정기',
  counted_qty INTEGER NOT NULL,
  system_qty INTEGER NOT NULL,
  difference INTEGER GENERATED ALWAYS AS (counted_qty - system_qty) STORED,
  counted_by TEXT,
  counted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_counts_item ON inventory_counts(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_date ON inventory_counts(counted_at DESC);

-- ============================================
-- 5. 재고 차감 함수 (트랜잭션 안전)
-- ============================================
CREATE OR REPLACE FUNCTION use_inventory_item(
  p_item_id UUID,
  p_quantity INTEGER,
  p_patient_name TEXT DEFAULT NULL,
  p_chart_number TEXT DEFAULT NULL,
  p_note TEXT DEFAULT NULL,
  p_confirmed_by TEXT DEFAULT NULL,
  p_created_by TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_current_stock INTEGER;
  v_tx_id UUID;
BEGIN
  -- 현재 재고 확인 (행 잠금)
  SELECT current_stock INTO v_current_stock
  FROM inventory_items WHERE id = p_item_id FOR UPDATE;

  IF v_current_stock IS NULL THEN
    RAISE EXCEPTION 'Item not found: %', p_item_id;
  END IF;

  IF v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock: current=%, requested=%', v_current_stock, p_quantity;
  END IF;

  -- 재고 차감
  UPDATE inventory_items
  SET current_stock = current_stock - p_quantity
  WHERE id = p_item_id;

  -- 트랜잭션 기록
  INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, note, confirmed_by, created_by)
  VALUES (p_item_id, 'use', p_quantity, p_patient_name, p_chart_number, p_note, p_confirmed_by, p_created_by)
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. 입고 함수
-- ============================================
CREATE OR REPLACE FUNCTION restock_inventory_item(
  p_item_id UUID,
  p_quantity INTEGER,
  p_note TEXT DEFAULT NULL,
  p_created_by TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_tx_id UUID;
BEGIN
  -- 재고 증가
  UPDATE inventory_items
  SET current_stock = current_stock + p_quantity
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found: %', p_item_id;
  END IF;

  -- 트랜잭션 기록
  INSERT INTO inventory_transactions (item_id, tx_type, quantity, note, created_by)
  VALUES (p_item_id, 'restock', p_quantity, p_note, p_created_by)
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. RLS 정책
-- ============================================
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedure_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자만 접근 가능
CREATE POLICY "Authenticated users can manage inventory_items"
  ON inventory_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage inventory_transactions"
  ON inventory_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage procedure_recipes"
  ON procedure_recipes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage inventory_counts"
  ON inventory_counts FOR ALL TO authenticated USING (true) WITH CHECK (true);
