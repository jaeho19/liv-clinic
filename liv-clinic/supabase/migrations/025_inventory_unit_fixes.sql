-- ============================================
-- 025: 재고 단위/규격 수정 (간호팀 요청 2026-02-23)
-- ============================================

-- 1. 쥬비덤 4종: unit 시린지 → 바이알
UPDATE inventory_items SET unit = '바이알'
WHERE sub_category = 'filler_juvederm'
  AND unit = '시린지';

-- 2. 보톡스 유닛(specification) 표기 추가
UPDATE inventory_items SET specification = '100u' WHERE name = '제오민' AND sub_category = 'botox';
UPDATE inventory_items SET specification = '100u' WHERE name = '제테마더톡신주' AND sub_category = 'botox';
UPDATE inventory_items SET specification = '200u' WHERE name = '하이톡스' AND sub_category = 'botox';
UPDATE inventory_items SET specification = '50u' WHERE name = '앨러간' AND sub_category = 'botox';

-- 3. 쥬베룩 볼륨/스킨부스터: unit 시린지 → 바이알
UPDATE inventory_items SET unit = '바이알'
WHERE name IN ('쥬베룩 볼륨', '쥬베룩 스킨부스터')
  AND sub_category = 'skinbooster';

-- 4. 큐티셀 블랙 오리진: unit 시린지 → 바이알
UPDATE inventory_items SET unit = '바이알'
WHERE name = '큐티셀 블랙 오리진'
  AND sub_category = 'skinbooster';
