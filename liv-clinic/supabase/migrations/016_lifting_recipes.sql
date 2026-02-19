-- 리프팅 시술 레시피 추가 (울쎄라, 덴서티, 슈링크, 실리프팅)
-- 기존: 써마지 FLX 600/900, 아이써마지만 등록됨
-- 추가: 나머지 리프팅 시술 전체

-- ============================================
-- 1. 울쎄라 프라임
-- ============================================

-- 울쎄라 상안면 (1.5mm + 3.0mm)
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '울쎄라 상안면', id, 1, '1.5mm 카트리지' FROM inventory_items WHERE name = '울쎄라 카트리지 1.5';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '울쎄라 상안면', id, 1, '3.0mm 카트리지' FROM inventory_items WHERE name = '울쎄라 카트리지 3.0';

-- 울쎄라 하안면 (3.0mm + 4.5mm)
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '울쎄라 하안면', id, 1, '3.0mm 카트리지' FROM inventory_items WHERE name = '울쎄라 카트리지 3.0';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '울쎄라 하안면', id, 1, '4.5mm 카트리지' FROM inventory_items WHERE name = '울쎄라 카트리지 4.5';

-- 울쎄라 전안면 (1.5mm + 3.0mm + 4.5mm)
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '울쎄라 전안면', id, 1, '1.5mm 카트리지' FROM inventory_items WHERE name = '울쎄라 카트리지 1.5';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '울쎄라 전안면', id, 1, '3.0mm 카트리지' FROM inventory_items WHERE name = '울쎄라 카트리지 3.0';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '울쎄라 전안면', id, 1, '4.5mm 카트리지' FROM inventory_items WHERE name = '울쎄라 카트리지 4.5';

-- 울쎄라 전안면+목 (1.5mm + 3.0mm + 4.5mm)
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '울쎄라 전안면+목', id, 1, '1.5mm 카트리지' FROM inventory_items WHERE name = '울쎄라 카트리지 1.5';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '울쎄라 전안면+목', id, 1, '3.0mm 카트리지' FROM inventory_items WHERE name = '울쎄라 카트리지 3.0';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '울쎄라 전안면+목', id, 1, '4.5mm 카트리지' FROM inventory_items WHERE name = '울쎄라 카트리지 4.5';

-- ============================================
-- 2. 덴서티
-- ============================================
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '덴서티', id, 1, NULL FROM inventory_items WHERE name = '덴서티 가스';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '덴서티', id, 1, NULL FROM inventory_items WHERE name = '덴서티 팁';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '덴서티', id, 1, NULL FROM inventory_items WHERE name = '덴서티 플루이드';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '덴서티', id, 1, '5개입 1팩' FROM inventory_items WHERE name = '덴서티 패치 (1pack*5)';

-- ============================================
-- 3. 슈링크 유니버스
-- ============================================
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '슈링크 1.5mm', id, 1, NULL FROM inventory_items WHERE name = '슈링크 카트리지 1.5';

INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '슈링크 3.0mm', id, 1, NULL FROM inventory_items WHERE name = '슈링크 카트리지 3.0';

INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '슈링크 4.5mm', id, 1, NULL FROM inventory_items WHERE name = '슈링크 카트리지 4.5';

INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '슈링크 6.0mm', id, 1, '바디용' FROM inventory_items WHERE name = '슈링크 카트리지 2.0';

-- ============================================
-- 4. 인모드 포르마 (초음파젤 사용)
-- ============================================
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '인모드 포르마', id, 1, 'RF 시술 시 사용' FROM inventory_items WHERE name = '초음파젤';

-- ============================================
-- 5. 인모드 모피어스8 (초음파젤 사용)
-- ============================================
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '인모드 모피어스8', id, 1, 'RF 시술 시 사용' FROM inventory_items WHERE name = '초음파젤';

-- ============================================
-- 6. 실리프팅
-- ============================================

-- PDO → 민트실 리프트업 (대표 PDO 실)
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '실리프팅 PDO', id, 4, 'PDO 실 기본 수량' FROM inventory_items WHERE name = '민트실 리프트업';

-- PLLA → 실루엣소프트 12콘 (대표 PLLA 실)
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '실리프팅 PLLA', id, 2, 'PLLA 콘실' FROM inventory_items WHERE name = '실루엣소프트 12';

-- PCL → 콘셀티나 19*100 (대표 PCL 실)
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '실리프팅 PCL', id, 4, 'PCL 실 기본 수량' FROM inventory_items WHERE name = '콘셀티나 19*100';

-- APTOS → 압토스 visage (APTOS 브랜드)
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '실리프팅 APTOS', id, 2, NULL FROM inventory_items WHERE name = '압토스 visage';

-- ============================================
-- 7. 써마지 FLX 400 (400샷은 재고 미보유, 600샷 팁으로 대체)
-- ============================================
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '써마지 FLX 400', id, 1, '400샷 전용 팁 없음, 600샷 팁 사용' FROM inventory_items WHERE name = '써마지 FLX 팁 600샷';
