-- 022: Madeca MD 재고 수량 보정 (간호팀 수정요청 Round 2)
-- 마데카솔 MD 로션 200g: 14 → 19
-- 마데카솔 MD 로션 500g: 18 → 15

UPDATE inventory_items
SET current_stock = 19
WHERE name = '마데카솔 MD 로션' AND volume_cc = 200 AND category = 'cosmetics';

UPDATE inventory_items
SET current_stock = 15
WHERE name = '마데카솔 MD 로션' AND volume_cc = 500 AND category = 'cosmetics';
