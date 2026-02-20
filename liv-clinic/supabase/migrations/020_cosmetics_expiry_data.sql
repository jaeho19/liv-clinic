-- ═══════════════════════════════════════════════════
-- 020: 화장품 유통기한 초기 데이터 + 하라셀 단품 등록
-- 창 5: cosmetics-expiry-management
-- ═══════════════════════════════════════════════════

-- ─── 1) 하라셀 수분 단품 3종 등록 ──────────────────
INSERT INTO inventory_items (name, category, sub_category, unit, current_stock, min_stock, unit_price, is_active, is_refrigerated)
VALUES
  ('하라셀 수분 토너 (단품)', 'cosmetics', 'serum', '개', 0, 2, 0, true, false),
  ('하라셀 수분 세럼 (단품)', 'cosmetics', 'serum', '개', 0, 2, 0, true, false),
  ('하라셀 수분 크림 (단품)', 'cosmetics', 'cream', '개', 0, 2, 0, true, false)
ON CONFLICT DO NOTHING;

-- ─── 2) 개별 제품 유통기한 배치 등록 ────────────────
-- 각 제품의 현재 재고를 배치 수량으로 사용
-- 주의: 품목명은 015_cosmetics_seed + 017_madeca_spec_update 기준

-- 시트팩 (증정용) → 유통기한 2028-08-18
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2028-08-18'::date, CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name = '시트팩 (증정용)' AND category = 'cosmetics' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);

-- 베리덤 쉴드 MD크림 35g → 유통기한 2028-04-15
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2028-04-15'::date, CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name = '베리덤 쉴드 MD크림' AND specification = '35g' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);

-- 베리덤 쉴드 MD크림 80g → 유통기한 2028-04-15
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2028-04-15'::date, CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name = '베리덤 쉴드 MD크림' AND specification = '80g' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);

-- 마데카MD 로션 200ml → 유통기한 2027-10-29
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2027-10-29'::date, CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name = '마데카MD 로션 200ml' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);

-- 마데카MD 로션 500ml → 유통기한 2027-11-13
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2027-11-13'::date, CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name = '마데카MD 로션 500ml' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);

-- 마데카MD 크림 250g → 유통기한 2027-06-26
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2027-06-26'::date, CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name = '마데카MD 크림' AND specification = '250g' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);

-- EGF 재생크림 → 유통기한 2028-08-21
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2028-08-21'::date, CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name = 'EGF 재생크림' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);

-- ─── 3) 하라셀 수분 세트 대표 유통기한 ─────────────
-- 구성품 중 가장 빠른 유효기간: 크림 2028-05-13
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2028-05-13'::date, CURRENT_DATE, '세트 대표 유통기한 (크림 기준, 가장 빠름)'
FROM inventory_items WHERE name LIKE '%하라셀 수분%' AND sub_category = 'set' AND category = 'cosmetics' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);

-- ─── 4) 하라셀 수분 단품 유통기한 ──────────────────
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2028-06-29'::date, CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name = '하라셀 수분 토너 (단품)' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);

INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2028-07-24'::date, CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name = '하라셀 수분 세럼 (단품)' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);

INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2028-05-13'::date, CURRENT_DATE, '초기 유통기한 등록'
FROM inventory_items WHERE name = '하라셀 수분 크림 (단품)' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);

-- ─── 5) 프리미엄 세트 대표 유통기한 ────────────────
-- 구성품 중 가장 빠른 유효기간: 블레쉬밤 3개 묶음 2027-06-03
INSERT INTO inventory_batches (item_id, batch_quantity, remaining_quantity, expiry_date, received_at, note)
SELECT id, GREATEST(current_stock, 1), GREATEST(current_stock, 1), '2027-06-03'::date, CURRENT_DATE, '세트 대표 유통기한 (블레쉬밤 기준, 가장 빠름)'
FROM inventory_items WHERE name LIKE '%프리미엄%세트%' AND category = 'cosmetics' AND is_active = true
  AND NOT EXISTS (SELECT 1 FROM inventory_batches WHERE item_id = inventory_items.id);
