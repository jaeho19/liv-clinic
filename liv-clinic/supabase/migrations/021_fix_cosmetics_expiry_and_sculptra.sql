-- ═══════════════════════════════════════════════════
-- 021: 보정 마이그레이션 - 유통기한 이름 불일치 + 스컬트라 주사용수
-- 실제 DB 이름 기준 (skincare 카테고리)
-- ═══════════════════════════════════════════════════

-- ─── 1) 스컬트라 주사용수 기본수량 보정 ─────────────
-- 스컬트라 기본 2바이알이므로 주사용수도 2개가 기본
-- 레시피가 없으면 INSERT, 있으면 UPDATE
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '스컬트라 시술', id, 2, '스컬트라 1바이알당 주사용수 1개 소모'
FROM inventory_items WHERE name = '멸균증류수 1L'
ON CONFLICT DO NOTHING;

UPDATE procedure_recipes
SET default_qty = 2
WHERE procedure_name = '스컬트라 시술'
  AND item_id IN (SELECT id FROM inventory_items WHERE name = '멸균증류수 1L')
  AND default_qty = 1;

-- ─── 2) 유통기한 배치 보정 (실제 DB 이름 기준) ──────

-- 시트팩 증정용 → 2028-08-18
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2028-08-18'::date, CURRENT_DATE, '초기 유통기한 등록 (보정)'
FROM inventory_items WHERE name = '시트팩 증정용' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);

-- 베리덤 쉴드 MD크림 35g → 2028-04-15
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2028-04-15'::date, CURRENT_DATE, '초기 유통기한 등록 (보정)'
FROM inventory_items WHERE name = '베리덤 쉴드 MD크림 35g' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);

-- 베리덤 쉴드 MD크림 80g → 2028-04-15
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2028-04-15'::date, CURRENT_DATE, '초기 유통기한 등록 (보정)'
FROM inventory_items WHERE name = '베리덤 쉴드 MD크림 80g' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);

-- 마데카MD 로션 200ml → 2027-10-29
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2027-10-29'::date, CURRENT_DATE, '초기 유통기한 등록 (보정)'
FROM inventory_items WHERE name = '마데카MD 로션 200ml' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);

-- 마데카MD 로션 500ml → 2027-11-13
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2027-11-13'::date, CURRENT_DATE, '초기 유통기한 등록 (보정)'
FROM inventory_items WHERE name = '마데카MD 로션 500ml' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);

-- 마데카MD 크림 250g → 2027-06-26
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2027-06-26'::date, CURRENT_DATE, '초기 유통기한 등록 (보정)'
FROM inventory_items WHERE name = '마데카MD 크림 250g' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);

-- EGF 재생크림 50ml → 2028-08-21
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2028-08-21'::date, CURRENT_DATE, '초기 유통기한 등록 (보정)'
FROM inventory_items WHERE name = 'EGF 재생크림 50ml' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);

-- 하라셀 수분 Set → 2028-05-13 (크림 기준, 가장 빠름)
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2028-05-13'::date, CURRENT_DATE, '세트 대표 유통기한 (크림 기준, 가장 빠름)'
FROM inventory_items WHERE name = '하라셀 수분 Set' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);

-- 하라셀 프리미엄 Set → 2027-06-03 (블레쉬밤 기준, 가장 빠름)
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2027-06-03'::date, CURRENT_DATE, '세트 대표 유통기한 (블레쉬밤 기준, 가장 빠름)'
FROM inventory_items WHERE name = '하라셀 프리미엄 Set' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);
