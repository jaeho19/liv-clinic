-- ============================================
-- 005: RPC Wrapper Functions
-- PostgREST 테이블 캐시를 우회하기 위한 함수 래퍼
-- 모든 API 쿼리를 .rpc()로 전환
-- ============================================

-- 1. 재고 품목 목록 조회 (필터 포함)
CREATE OR REPLACE FUNCTION get_inventory_items(
  p_category text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_stock_status text DEFAULT NULL,
  p_show_inactive boolean DEFAULT false
) RETURNS json AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT * FROM inventory_items
      WHERE (p_show_inactive OR is_active = true)
        AND (p_category IS NULL OR p_category = 'all' OR category = p_category)
        AND (p_search IS NULL OR name ILIKE '%' || p_search || '%')
        AND (
          p_stock_status IS NULL
          OR (p_stock_status = 'out' AND current_stock <= 0)
          OR (p_stock_status = 'low' AND current_stock > 0 AND current_stock <= min_stock)
        )
      ORDER BY category, sub_category, name
    ) t
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 재고 품목 등록
CREATE OR REPLACE FUNCTION create_inventory_item(p_data jsonb) RETURNS json AS $$
DECLARE
  new_row inventory_items;
BEGIN
  INSERT INTO inventory_items (
    name, category, sub_category, specification, unit,
    current_stock, min_stock, unit_price, supplier, storage_note
  ) VALUES (
    p_data->>'name',
    p_data->>'category',
    p_data->>'sub_category',
    p_data->>'specification',
    COALESCE(p_data->>'unit', '개'),
    COALESCE((p_data->>'current_stock')::integer, 0),
    COALESCE((p_data->>'min_stock')::integer, 0),
    COALESCE((p_data->>'unit_price')::integer, 0),
    p_data->>'supplier',
    p_data->>'storage_note'
  ) RETURNING * INTO new_row;

  RETURN row_to_json(new_row);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 재고 품목 수정
CREATE OR REPLACE FUNCTION update_inventory_item_by_id(
  p_id uuid,
  p_data jsonb
) RETURNS json AS $$
DECLARE
  updated_row inventory_items;
BEGIN
  UPDATE inventory_items SET
    name = COALESCE(p_data->>'name', name),
    category = COALESCE(p_data->>'category', category),
    sub_category = CASE WHEN p_data ? 'sub_category' THEN p_data->>'sub_category' ELSE sub_category END,
    specification = CASE WHEN p_data ? 'specification' THEN p_data->>'specification' ELSE specification END,
    unit = COALESCE(p_data->>'unit', unit),
    current_stock = COALESCE((p_data->>'current_stock')::integer, current_stock),
    min_stock = COALESCE((p_data->>'min_stock')::integer, min_stock),
    unit_price = COALESCE((p_data->>'unit_price')::integer, unit_price),
    supplier = CASE WHEN p_data ? 'supplier' THEN p_data->>'supplier' ELSE supplier END,
    storage_note = CASE WHEN p_data ? 'storage_note' THEN p_data->>'storage_note' ELSE storage_note END,
    is_active = COALESCE((p_data->>'is_active')::boolean, is_active)
  WHERE id = p_id
  RETURNING * INTO updated_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found: %', p_id;
  END IF;

  RETURN row_to_json(updated_row);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 재고 품목 비활성화 (소프트 삭제)
CREATE OR REPLACE FUNCTION soft_delete_inventory_item(p_id uuid) RETURNS json AS $$
BEGIN
  UPDATE inventory_items SET is_active = false WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found: %', p_id;
  END IF;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 대시보드 통계
CREATE OR REPLACE FUNCTION get_inventory_stats() RETURNS json AS $$
DECLARE
  v_total integer := 0;
  v_normal integer := 0;
  v_low integer := 0;
  v_out integer := 0;
  v_total_value bigint := 0;
  v_alert_ids uuid[] := '{}';
  rec record;
BEGIN
  FOR rec IN SELECT id, current_stock, min_stock, unit_price FROM inventory_items WHERE is_active = true
  LOOP
    v_total := v_total + 1;
    v_total_value := v_total_value + (rec.current_stock * rec.unit_price);
    IF rec.current_stock <= 0 THEN
      v_out := v_out + 1;
      v_alert_ids := array_append(v_alert_ids, rec.id);
    ELSIF rec.current_stock <= rec.min_stock THEN
      v_low := v_low + 1;
      v_alert_ids := array_append(v_alert_ids, rec.id);
    ELSE
      v_normal := v_normal + 1;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'total', v_total,
    'normal', v_normal,
    'low', v_low,
    'out', v_out,
    'totalValue', v_total_value,
    'alertItemIds', to_json(v_alert_ids)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 트랜잭션 이력 조회 (품목 정보 JOIN 포함)
CREATE OR REPLACE FUNCTION get_inventory_transactions(
  p_type text DEFAULT NULL,
  p_item_id uuid DEFAULT NULL,
  p_date_from text DEFAULT NULL,
  p_date_to text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
) RETURNS json AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        tx.id, tx.item_id, tx.tx_type, tx.quantity,
        tx.patient_name, tx.chart_number, tx.note,
        tx.confirmed_by, tx.created_by, tx.created_at,
        json_build_object(
          'id', i.id,
          'name', i.name,
          'category', i.category,
          'unit', i.unit
        ) as item
      FROM inventory_transactions tx
      JOIN inventory_items i ON i.id = tx.item_id
      WHERE (p_type IS NULL OR p_type = 'all' OR tx.tx_type = p_type)
        AND (p_item_id IS NULL OR tx.item_id = p_item_id)
        AND (p_date_from IS NULL OR tx.created_at >= (p_date_from || 'T00:00:00')::timestamptz)
        AND (p_date_to IS NULL OR tx.created_at <= (p_date_to || 'T23:59:59')::timestamptz)
      ORDER BY tx.created_at DESC
      LIMIT p_limit OFFSET p_offset
    ) t
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 시술 레시피 조회 (품목 정보 JOIN 포함)
CREATE OR REPLACE FUNCTION get_procedure_recipes(
  p_procedure text DEFAULT NULL
) RETURNS json AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        r.id, r.procedure_name, r.item_id, r.default_qty, r.note,
        json_build_object(
          'id', i.id,
          'name', i.name,
          'category', i.category,
          'unit', i.unit,
          'current_stock', i.current_stock
        ) as item
      FROM procedure_recipes r
      JOIN inventory_items i ON i.id = r.item_id
      WHERE (p_procedure IS NULL OR r.procedure_name = p_procedure)
      ORDER BY r.procedure_name, r.id
    ) t
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 시술 레시피 등록
CREATE OR REPLACE FUNCTION create_procedure_recipe(
  p_procedure_name text,
  p_item_id uuid,
  p_default_qty integer DEFAULT 1,
  p_note text DEFAULT NULL
) RETURNS json AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
  VALUES (p_procedure_name, p_item_id, p_default_qty, p_note)
  RETURNING id INTO v_id;

  RETURN (
    SELECT row_to_json(t) FROM (
      SELECT
        r.id, r.procedure_name, r.item_id, r.default_qty, r.note,
        json_build_object(
          'id', i.id,
          'name', i.name,
          'category', i.category,
          'unit', i.unit
        ) as item
      FROM procedure_recipes r
      JOIN inventory_items i ON i.id = r.item_id
      WHERE r.id = v_id
    ) t
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수 실행 권한
GRANT EXECUTE ON FUNCTION get_inventory_items(text, text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION get_inventory_items(text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION create_inventory_item(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION create_inventory_item(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION update_inventory_item_by_id(uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION update_inventory_item_by_id(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_inventory_item(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION soft_delete_inventory_item(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_stats() TO service_role;
GRANT EXECUTE ON FUNCTION get_inventory_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_transactions(text, uuid, text, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION get_inventory_transactions(text, uuid, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_procedure_recipes(text) TO service_role;
GRANT EXECUTE ON FUNCTION get_procedure_recipes(text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_procedure_recipe(text, uuid, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION create_procedure_recipe(text, uuid, integer, text) TO authenticated;

-- PostgREST 스키마 캐시 리로드
NOTIFY pgrst, 'reload schema';
