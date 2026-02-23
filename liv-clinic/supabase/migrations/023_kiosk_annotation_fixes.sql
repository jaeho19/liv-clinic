-- 023: Kiosk annotation fixes (간호팀 피드백 반영)
-- A) 보톡스 레시피에서 니들 삭제
-- B) 필러 레시피에서 케뉼라 삭제
-- C) 스컬트라 레시피에서 멸균증류수 삭제
-- D) 쥬비덤 필러 단위: 실린지로 통일
-- E) 울쎄라 영역 기반 레시피 삭제 (팁 트래킹으로 대체)
-- F) 슈링크 mm 기반 레시피 삭제 (팁 트래킹으로 대체)

-- A) 보톡스 레시피에서 니들 삭제
DELETE FROM procedure_recipes
WHERE procedure_name LIKE '보톡스 시술%'
  AND item_id IN (SELECT id FROM inventory_items WHERE sub_category = 'needle');

-- B) 필러 레시피에서 케뉼라 삭제
DELETE FROM procedure_recipes
WHERE procedure_name LIKE '필러 시술%'
  AND item_id IN (SELECT id FROM inventory_items WHERE sub_category = 'cannula');

-- C) 스컬트라 레시피에서 멸균증류수 삭제
DELETE FROM procedure_recipes
WHERE procedure_name = '스컬트라 시술'
  AND item_id IN (SELECT id FROM inventory_items WHERE name = '멸균증류수 1L');

-- D) 쥬비덤 필러 단위: 실린지로 통일
UPDATE inventory_items SET unit = '실린지'
WHERE name LIKE '쥬비덤%';

-- E) 울쎄라 영역 기반 레시피 삭제 (팁 트래킹으로 대체)
DELETE FROM procedure_recipes WHERE procedure_name LIKE '울쎄라%';

-- F) 슈링크 mm 기반 레시피 삭제 (팁 트래킹으로 대체)
DELETE FROM procedure_recipes WHERE procedure_name LIKE '슈링크%';
