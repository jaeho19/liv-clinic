-- 015: 화장품 재고 시드 데이터 (데스크 재고)
-- 2026-02-13

INSERT INTO inventory_items (name, category, sub_category, specification, unit, current_stock, min_stock, unit_price, supplier, storage_note, is_active)
VALUES
  ('마데카MD 로션', 'cosmetics', 'lotion', '100g', '개', 15, 3, 0, '', '상온보관', true),
  ('마데카MD 로션', 'cosmetics', 'lotion', '200g', '개', 19, 3, 0, '', '상온보관', true),
  ('마데카MD 크림', 'cosmetics', 'cream', '250g', '개', 20, 3, 0, '', '상온보관', true),
  ('EGF 재생크림', 'cosmetics', 'cream', '50ml', '개', 17, 3, 0, '', '상온보관', true),
  ('베리덤 쉴드 MD크림', 'cosmetics', 'cream', '35g', '개', 11, 3, 0, '', '상온보관', true),
  ('베리덤 쉴드 MD크림', 'cosmetics', 'cream', '80g', '개', 19, 3, 0, '', '상온보관', true),
  ('하라셀 수분 세트', 'cosmetics', 'set', '', '세트', 3, 2, 0, '', '상온보관', true),
  ('하라셀 프리미엄 세트', 'cosmetics', 'set', '', '세트', 4, 2, 0, '', '상온보관', true),
  ('시트팩 (증정용)', 'cosmetics', 'mask', '', '개', 180, 20, 0, '', '상온보관', true)
ON CONFLICT DO NOTHING;
