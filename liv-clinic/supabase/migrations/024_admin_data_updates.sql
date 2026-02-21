-- 간호팀 3차 수정 요청 반영
-- 1. 수액 단위 변경 (박스→개)
-- 2. 샤넬주사 단위 변경 (시린지→바이알)
-- 3. 리쥬란힐러 이름 변경 (→ 리쥬란힐러 2cc)
-- 4. 보톡스 규격(유닛) 추가
-- 5. 실 종류 개별 레시피 추가
-- 6. 필러 전체 브랜드 레시피 추가

-- ============================================
-- 1. 수액 set 단위 변경: 박스 → 개
-- ============================================
UPDATE inventory_items SET unit = '개' WHERE name = '수액 set' AND category = 'consumable';

-- ============================================
-- 2. 샤넬주사 단위 변경: 시린지 → 바이알
-- ============================================
UPDATE inventory_items SET unit = '바이알' WHERE name = '샤넬주사' AND category = 'injection';

-- ============================================
-- 3. 리쥬란힐러 → 리쥬란힐러 2cc
-- ============================================
UPDATE inventory_items SET name = '리쥬란힐러 2cc' WHERE name = '리쥬란힐러' AND category = 'injection';

-- ============================================
-- 4. 보톡스 규격(유닛) 추가
-- ============================================
UPDATE inventory_items SET specification = '100유닛' WHERE name = '제오민' AND sub_category = 'botox';
UPDATE inventory_items SET specification = '200유닛' WHERE name = '하이톡스' AND sub_category = 'botox';
UPDATE inventory_items SET specification = '50유닛' WHERE name = '앨러간' AND sub_category = 'botox';
UPDATE inventory_items SET specification = '100유닛' WHERE name = '제테마더톡신주' AND sub_category = 'botox';

-- ============================================
-- 5. 실 종류 개별 레시피 추가
--    (기존 '실리프팅 PDO/PLLA/PCL/APTOS'는 유지, 브랜드별 옵션 추가)
-- ============================================

-- 압토스
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '압토스 visage', id, 1, NULL FROM inventory_items WHERE name = '압토스 visage';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '압토스 light lift 500mm', id, 1, NULL FROM inventory_items WHERE name = '압토스 light lift 500mm';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '압토스 light lift 250mm', id, 1, NULL FROM inventory_items WHERE name = '압토스 light lift 250mm';

-- 민트실
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '민트실 리프트업', id, 1, NULL FROM inventory_items WHERE name = '민트실 리프트업';

-- 실루엣소프트
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '실루엣소프트 8콘', id, 1, NULL FROM inventory_items WHERE name = '실루엣소프트 8';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '실루엣소프트 12콘', id, 1, NULL FROM inventory_items WHERE name = '실루엣소프트 12';

-- 네오닥터
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '네오닥터 JAMBER 23G×60', id, 1, NULL FROM inventory_items WHERE name = '네오닥터 JAMBER 23G*60';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '네오닥터 JAMBER 27G×50', id, 1, NULL FROM inventory_items WHERE name = '네오닥터 JAMBER 27G*50';

-- 에피티콘
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '에피티콘 Thin', id, 1, NULL FROM inventory_items WHERE name = '에피티콘 Thin (sam)';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '에피티콘 jamber 25G×50', id, 1, NULL FROM inventory_items WHERE name = '에피티콘 jamber 25G*50 (sam)';

-- 콘셀티나
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '콘셀티나 19×100', id, 1, NULL FROM inventory_items WHERE name = '콘셀티나 19*100';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '콘셀티나 19×60', id, 1, NULL FROM inventory_items WHERE name = '콘셀티나 19*60';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '콘셀티나 19×40', id, 1, NULL FROM inventory_items WHERE name = '콘셀티나 19*40';

-- ============================================
-- 6. 필러 전체 브랜드 레시피 추가
-- ============================================

-- 레스틸렌
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (레스틸렌 DEFYNE)', id, 1, NULL FROM inventory_items WHERE name = '레스틸렌 DEFYNE';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (레스틸렌 VOLYME)', id, 1, NULL FROM inventory_items WHERE name = '레스틸렌 VOLYME';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (레스틸렌 KYSSE)', id, 1, NULL FROM inventory_items WHERE name = '레스틸렌 KYSSE';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (레스틸렌 Vital)', id, 1, NULL FROM inventory_items WHERE name = '레스틸렌 Vital';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (레스틸렌 리프트)', id, 1, NULL FROM inventory_items WHERE name = '레스틸렌 리프트';

-- 벨로테로
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (벨로테로 소프트)', id, 1, NULL FROM inventory_items WHERE name = '벨로테로 소프트';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (벨로테로 볼룸)', id, 1, NULL FROM inventory_items WHERE name = '벨로테로 볼룸';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (벨로테로 인텐스)', id, 1, NULL FROM inventory_items WHERE name = '벨로테로 인텐스';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (벨로테로 발란스)', id, 1, NULL FROM inventory_items WHERE name = '벨로테로 발란스';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (벨로테로 리바이브)', id, 1, NULL FROM inventory_items WHERE name = '벨로테로 리바이브';

-- 국산 필러 - 뉴라미스
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (뉴라미스 Silver)', id, 1, NULL FROM inventory_items WHERE name = '뉴라미스 Silver';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (뉴라미스 Volume)', id, 1, NULL FROM inventory_items WHERE name = '뉴라미스 Volume';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (뉴라미스 DEEP)', id, 1, NULL FROM inventory_items WHERE name = '뉴라미스 DEEP';

-- 국산 필러 - 로리앙
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (로리앙 no2)', id, 1, NULL FROM inventory_items WHERE name = '로리앙 no2';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (로리앙 no4)', id, 1, NULL FROM inventory_items WHERE name = '로리앙 no4';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (로리앙 no6)', id, 1, NULL FROM inventory_items WHERE name = '로리앙 no6';

-- 국산 필러 - 기타
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (큐티필 Fine)', id, 1, NULL FROM inventory_items WHERE name = '큐티필 Fine';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (순수필 100)', id, 1, NULL FROM inventory_items WHERE name = '순수필 100';
