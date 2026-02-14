-- 시술 레시피 업데이트
-- 1. 인모드 레시피 삭제 (소모품 장비 아님)
-- 2. 보톡스 (엘러간) 레시피 추가
-- 3. 리투오, 레디어스 시술 레시피 추가

-- ============================================
-- 1. 인모드 레시피 삭제
-- ============================================
DELETE FROM procedure_recipes WHERE procedure_name = '인모드 포르마';
DELETE FROM procedure_recipes WHERE procedure_name = '인모드 모피어스8';

-- ============================================
-- 2. 보톡스 시술 (엘러간)
-- ============================================
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '보톡스 시술 (엘러간)', id, 1, NULL FROM inventory_items WHERE name = '앨러간';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '보톡스 시술 (엘러간)', id, 1, NULL FROM inventory_items WHERE name = '니들 30G';

-- ============================================
-- 3. 리투오 시술
-- ============================================
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '리투오 시술', id, 1, NULL FROM inventory_items WHERE name = '리투오';

-- ============================================
-- 4. 레디어스 시술
-- ============================================
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '레디어스 시술', id, 1, NULL FROM inventory_items WHERE name = '레디어스';
