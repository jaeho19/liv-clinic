-- 017: 마데카MD 로션 specification 및 name 수정 (용량 단위 변경)
-- 2026-02-14
-- 이미 REST API로 운영 DB에 적용 완료

-- 마데카MD 로션 100g → 200ml
UPDATE inventory_items
SET name = '마데카MD 로션 200ml', specification = '200ml'
WHERE id = 'f063efbe-25b5-463b-bde0-5af2b6359d32';

-- 마데카MD 로션 200g → 500ml
UPDATE inventory_items
SET name = '마데카MD 로션 500ml', specification = '500ml'
WHERE id = '36256381-a8be-44c7-9c61-3dc06f70a6ba';
