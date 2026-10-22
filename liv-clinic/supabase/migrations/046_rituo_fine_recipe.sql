-- 046: 리투오 파인 시술 레시피 추가
-- 배경: 직원이 2026-10-17 관리자 화면에서 '리투오 파인' 물품을 등록했으나,
--       간호사용 「물품 사용 기록」(키오스크)은 시술 레시피가 있어야 카드가 활성화된다.
--       코드의 PROCEDURE_CATALOG(rituo_fine) → PROCEDURE_RECIPE_MAP('리투오 파인 시술')과 짝.
-- 참고: 같은 이름의 비활성(is_active=false) 행이 1건 더 있으므로 활성 행만 연결한다.
-- 재실행해도 안전(멱등).

INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '리투오 파인 시술', id, 1, NULL
FROM inventory_items
WHERE name = '리투오 파인'
  AND is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM procedure_recipes WHERE procedure_name = '리투오 파인 시술'
  );
