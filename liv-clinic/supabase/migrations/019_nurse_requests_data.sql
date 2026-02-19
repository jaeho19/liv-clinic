-- 019: 간호팀 수정요청 - 데이터 변경
-- 단위 변경, 냉장 표기, cc 표기, 레시피 재구성
-- 2026-02-19

-- ============================================
-- 1. 단위 변경
-- ============================================

-- #5: 쥬베룩 볼륨/스킨 시린지 → 바이알
UPDATE inventory_items SET unit = '바이알'
WHERE name IN ('쥬베룩 볼륨', '쥬베룩 스킨부스터');

-- #8: 수액 set 박스 → 개
UPDATE inventory_items SET unit = '개'
WHERE name = '수액 set';

-- #9: 모아랩 밴드 박스 → 개
UPDATE inventory_items SET unit = '개'
WHERE name = '모아랩 밴드';

-- ============================================
-- 2. 냉장 보관 표기 (#15)
-- ============================================
UPDATE inventory_items SET is_refrigerated = true
WHERE storage_note LIKE '%냉장%';

-- ============================================
-- 3. 용량(cc) 표기 (#16)
-- ============================================

-- 리쥬란 힐러 2cc
UPDATE inventory_items SET volume_cc = 2
WHERE name = '리쥬란힐러';

-- EPTQ EVES 3cc
UPDATE inventory_items SET volume_cc = 3
WHERE name LIKE 'e.p.t.q.%3.0ml%';

-- ============================================
-- 4. 보톡스 레시피에서 니들 삭제 (#4)
-- ============================================
DELETE FROM procedure_recipes
WHERE procedure_name LIKE '보톡스 시술%'
  AND item_id IN (
    SELECT id FROM inventory_items
    WHERE category = 'consumable' AND sub_category = 'needle'
  );

-- ============================================
-- 5. 써마지 레시피에 소모품 추가 (#6)
-- ============================================

-- 써마지 FLX 600 - 패치/플루이드/가스
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '써마지 FLX 600', id, 1, '패치'
FROM inventory_items WHERE name LIKE '써마지 패치%'
ON CONFLICT DO NOTHING;

INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '써마지 FLX 600', id, 1, '플루이드'
FROM inventory_items WHERE name LIKE '써마지 플루이드%'
ON CONFLICT DO NOTHING;

INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '써마지 FLX 600', id, 1, '가스'
FROM inventory_items WHERE name = '써마지 가스'
ON CONFLICT DO NOTHING;

-- 써마지 FLX 900 - 패치/플루이드/가스
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '써마지 FLX 900', id, 1, '패치'
FROM inventory_items WHERE name LIKE '써마지 패치%'
ON CONFLICT DO NOTHING;

INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '써마지 FLX 900', id, 1, '플루이드'
FROM inventory_items WHERE name LIKE '써마지 플루이드%'
ON CONFLICT DO NOTHING;

INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '써마지 FLX 900', id, 1, '가스'
FROM inventory_items WHERE name = '써마지 가스'
ON CONFLICT DO NOTHING;

-- 써마지 FLX 400 - 패치/플루이드/가스
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '써마지 FLX 400', id, 1, '패치'
FROM inventory_items WHERE name LIKE '써마지 패치%'
ON CONFLICT DO NOTHING;

INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '써마지 FLX 400', id, 1, '플루이드'
FROM inventory_items WHERE name LIKE '써마지 플루이드%'
ON CONFLICT DO NOTHING;

INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '써마지 FLX 400', id, 1, '가스'
FROM inventory_items WHERE name = '써마지 가스'
ON CONFLICT DO NOTHING;

-- 아이써마지 - 패치/플루이드/가스
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '아이써마지', id, 1, '패치'
FROM inventory_items WHERE name LIKE '써마지 패치%'
ON CONFLICT DO NOTHING;

INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '아이써마지', id, 1, '플루이드'
FROM inventory_items WHERE name LIKE '써마지 플루이드%'
ON CONFLICT DO NOTHING;

INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '아이써마지', id, 1, '가스'
FROM inventory_items WHERE name = '써마지 가스'
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. 스컬트라 주사용수 연동 (#7)
-- ============================================

-- 스컬트라 시술 시 멸균증류수 1L을 함께 차감
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '스컬트라 시술', id, 1, '스컬트라 1바이알당 주사용수 1개 소모'
FROM inventory_items WHERE name = '멸균증류수 1L'
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. 실리프팅 레시피 재구성 (#1)
-- ============================================

-- 기존 재질 기반 레시피 삭제
DELETE FROM procedure_recipes
WHERE procedure_name IN (
  '실리프팅 PDO',
  '실리프팅 PLLA',
  '실리프팅 PCL',
  '실리프팅 APTOS'
);

-- 브랜드별 신규 레시피 생성

-- 압토스
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '압토스 visage', id, 1, NULL
FROM inventory_items WHERE name = '압토스 visage';

INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '압토스 light lift 500mm', id, 1, NULL
FROM inventory_items WHERE name = '압토스 light lift 500mm';

INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '압토스 light lift 250mm', id, 1, NULL
FROM inventory_items WHERE name = '압토스 light lift 250mm';

-- 민트실
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '민트실 리프트업', id, 1, NULL
FROM inventory_items WHERE name = '민트실 리프트업';

-- 실루엣소프트
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '실루엣소프트 8콘', id, 1, NULL
FROM inventory_items WHERE name = '실루엣소프트 8';

INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '실루엣소프트 12콘', id, 1, NULL
FROM inventory_items WHERE name = '실루엣소프트 12';

-- 네오닥터 JAMBER
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '네오닥터 JAMBER 23G×60', id, 1, NULL
FROM inventory_items WHERE name = '네오닥터 JAMBER 23G*60';

INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '네오닥터 JAMBER 27G×50', id, 1, NULL
FROM inventory_items WHERE name = '네오닥터 JAMBER 27G*50';

-- 에피티콘
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '에피티콘 Thin', id, 1, NULL
FROM inventory_items WHERE name = '에피티콘 Thin (sam)';

INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '에피티콘 jamber 25G×50', id, 1, NULL
FROM inventory_items WHERE name = '에피티콘 jamber 25G*50 (sam)';

-- 콘셀티나
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '콘셀티나 19×100', id, 1, NULL
FROM inventory_items WHERE name = '콘셀티나 19*100';

INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '콘셀티나 19×60', id, 1, NULL
FROM inventory_items WHERE name = '콘셀티나 19*60';

INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '콘셀티나 19×40', id, 1, NULL
FROM inventory_items WHERE name = '콘셀티나 19*40';
