-- 재고관리 초기 데이터 시딩
-- CSV 실제 운영 데이터 기반 (2025년 1월)

-- ============================================
-- 1. 장비 팁/카트리지 (device_tip)
-- ============================================
INSERT INTO inventory_items (name, category, sub_category, specification, unit, current_stock, min_stock, unit_price, supplier, storage_note) VALUES
  -- 슈링크
  ('슈링크 카트리지 4.5', 'device_tip', 'shurink', '4.5mm', '개', 1, 1, 300000, '클래시스', NULL),
  ('슈링크 카트리지 3.0', 'device_tip', 'shurink', '3.0mm', '개', 1, 1, 300000, '클래시스', NULL),
  ('슈링크 카트리지 2.0', 'device_tip', 'shurink', '2.0mm', '개', 1, 1, 300000, '클래시스', NULL),
  ('슈링크 카트리지 1.5', 'device_tip', 'shurink', '1.5mm', '개', 1, 1, 300000, '클래시스', NULL),
  -- 울쎄라
  ('울쎄라 카트리지 4.5', 'device_tip', 'ulthera', '4.5mm', '개', 4, 2, 850000, '머즈코리아', NULL),
  ('울쎄라 카트리지 3.0', 'device_tip', 'ulthera', '3.0mm', '개', 10, 3, 850000, '머즈코리아', NULL),
  ('울쎄라 카트리지 1.5', 'device_tip', 'ulthera', '1.5mm', '개', 3, 2, 850000, '머즈코리아', NULL),
  -- 덴서티
  ('덴서티 가스', 'device_tip', 'density', '-', '개', 22, 5, 50000, '하이로닉', NULL),
  ('덴서티 팁', 'device_tip', 'density', '-', '개', 48, 10, 750000, '하이로닉', NULL),
  ('덴서티 플루이드', 'device_tip', 'density', '-', '개', 70, 10, 30000, '하이로닉', NULL),
  ('덴서티 패치 (1pack*5)', 'device_tip', 'density', '5개입', '팩', 10, 3, 25000, '하이로닉', NULL),
  -- 포텐자
  ('포텐자 CP (1box*5)', 'device_tip', 'potenza', 'CP', '박스', 5, 2, 350000, '사이노슈어', NULL),
  ('포텐자 NP (1box*5)', 'device_tip', 'potenza', 'NP', '박스', 3, 2, 350000, '사이노슈어', NULL),
  ('포텐자 A1-12', 'device_tip', 'potenza', 'A1-12', '개', 12, 3, 200000, '사이노슈어', NULL),
  ('포텐자 플루이드', 'device_tip', 'potenza', '-', '개', 7, 3, 30000, '사이노슈어', NULL),
  ('포텐자 패치 (20회)', 'device_tip', 'potenza', '20회', '팩', 4, 2, 25000, '사이노슈어', NULL),
  -- 써마지
  ('써마지 가스', 'device_tip', 'thermage', '-', '개', 32, 5, 50000, '솔타메디칼', NULL),
  ('써마지 FLX 팁 600샷', 'device_tip', 'thermage', '600팁', '개', 5, 2, 1200000, '솔타메디칼', NULL),
  ('써마지 FLX 팁 900샷', 'device_tip', 'thermage', '900팁', '개', 3, 1, 1500000, '솔타메디칼', NULL),
  ('아이써마지 팁 225샷', 'device_tip', 'thermage', '225팁(I)', '개', 6, 2, 600000, '솔타메디칼', NULL),
  ('써마지 아이쉴드', 'device_tip', 'thermage', '-', '개', 1, 1, 15000, '솔타메디칼', NULL),
  ('써마지 플루이드 (6개*1box)', 'device_tip', 'thermage', '6개입', '박스', 18, 5, 30000, '솔타메디칼', NULL),
  ('써마지 패치 (1pack*12)', 'device_tip', 'thermage', '12개입', '팩', 11, 3, 25000, '솔타메디칼', NULL),
  ('써마지 마킹 0.25', 'device_tip', 'thermage', '0.25', '개', 6, 2, 5000, '솔타메디칼', NULL),
  ('써마지 마킹 0.4', 'device_tip', 'thermage', '0.4', '개', 10, 2, 5000, '솔타메디칼', NULL);

-- ============================================
-- 2. 주사제 - 필러 (injection/filler)
-- ============================================
INSERT INTO inventory_items (name, category, sub_category, specification, unit, current_stock, min_stock, unit_price, supplier, storage_note) VALUES
  -- 레스틸렌 (수입)
  ('레스틸렌 DEFYNE', 'injection', 'filler_restylane', '-', '시린지', 12, 5, 250000, '갈더마', '유효기한: 27.05.31'),
  ('레스틸렌 VOLYME', 'injection', 'filler_restylane', '-', '시린지', 11, 5, 280000, '갈더마', '유효기한: 27.01.31'),
  ('레스틸렌 KYSSE', 'injection', 'filler_restylane', '-', '시린지', 11, 5, 250000, '갈더마', '유효기한: 27.03.31'),
  ('레스틸렌 Vital', 'injection', 'filler_restylane', '-', '시린지', 14, 5, 200000, '갈더마', '유효기한: 27.02.28'),
  ('레스틸렌 리프트', 'injection', 'filler_restylane', '-', '시린지', 10, 5, 260000, '갈더마', '유효기한: 28.02.28'),
  -- 벨로테로 (수입)
  ('벨로테로 소프트', 'injection', 'filler_belotero', '-', '시린지', 9, 5, 180000, '머즈코리아', NULL),
  ('벨로테로 볼룸', 'injection', 'filler_belotero', '-', '시린지', 13, 5, 250000, '머즈코리아', NULL),
  ('벨로테로 인텐스', 'injection', 'filler_belotero', '-', '시린지', 30, 10, 220000, '머즈코리아', NULL),
  ('벨로테로 발란스', 'injection', 'filler_belotero', '-', '시린지', 10, 5, 200000, '머즈코리아', NULL),
  ('벨로테로 리바이브', 'injection', 'filler_belotero', '-', '시린지', 13, 5, 200000, '머즈코리아', NULL),
  -- 쥬비덤 (수입)
  ('쥬비덤 볼벨라', 'injection', 'filler_juvederm', '-', '바이알', 30, 10, 250000, '엘러간코리아', '유효기한: 27.03.17'),
  ('쥬비덤 볼루마', 'injection', 'filler_juvederm', '-', '바이알', 25, 10, 280000, '엘러간코리아', '유효기한: 27.02.26'),
  ('쥬비덤 볼리프트', 'injection', 'filler_juvederm', '-', '바이알', 24, 10, 260000, '엘러간코리아', '유효기한: 27.03.15'),
  ('쥬비덤 볼룩스', 'injection', 'filler_juvederm', '-', '바이알', 24, 10, 300000, '엘러간코리아', '유효기한: 26.12.22'),
  -- 로리앙 (국프)
  ('로리앙 no2', 'injection', 'filler_domestic', 'no2', '시린지', 6, 3, 80000, '로리앙', NULL),
  ('로리앙 no4', 'injection', 'filler_domestic', 'no4', '시린지', 14, 5, 80000, '로리앙', NULL),
  ('로리앙 no6', 'injection', 'filler_domestic', 'no6', '시린지', 6, 3, 80000, '로리앙', NULL),
  -- 뉴라미스 (국산)
  ('뉴라미스 Silver', 'injection', 'filler_domestic', 'Silver', '시린지', 26, 10, 50000, '메디톡스', NULL),
  ('뉴라미스 Volume', 'injection', 'filler_domestic', 'Volume', '시린지', 16, 5, 50000, '메디톡스', NULL),
  ('뉴라미스 DEEP', 'injection', 'filler_domestic', 'DEEP', '시린지', 8, 3, 50000, '메디톡스', NULL),
  -- 기타 필러
  ('큐티필 Fine', 'injection', 'filler_domestic', 'Fine', '시린지', 9, 3, 60000, NULL, NULL),
  ('순수필 100', 'injection', 'filler_domestic', '100', '시린지', 5, 3, 40000, NULL, NULL),
  ('e.p.t.q. eve S Plus 3.0ml', 'injection', 'filler_domestic', '3.0ml', '박스', 45, 10, 120000, NULL, '바디필러, 유효기한: 27.03.27');

-- ============================================
-- 3. 주사제 - 보톡스 (injection/botox)
-- ============================================
INSERT INTO inventory_items (name, category, sub_category, specification, unit, current_stock, min_stock, unit_price, supplier, storage_note) VALUES
  ('제오민', 'injection', 'botox', '100u', '바이알', 18, 5, 150000, '머즈코리아', '★냉장보관, 유효기한: 27.09.30'),
  ('앨러간', 'injection', 'botox', '50u', '바이알', 12, 5, 180000, '엘러간코리아', '★냉장보관, 유효기한: 27.09.28'),
  ('제테마더톡신주', 'injection', 'botox', '100u', '바이알', 78, 20, 30000, '제테마', '국산 프리미엄, 유효기한: 28.02.19'),
  ('하이톡스', 'injection', 'botox', '200u', '바이알', 138, 30, 15000, '휴온스', '국산, 유효기한: 27.07.02');

-- ============================================
-- 4. 주사제 - 스킨부스터 (injection/skinbooster)
-- ============================================
INSERT INTO inventory_items (name, category, sub_category, specification, unit, current_stock, min_stock, unit_price, supplier, storage_note) VALUES
  ('리쥬란힐러', 'injection', 'skinbooster', '-', '시린지', 34, 10, 180000, '파마리서치', NULL),
  ('리쥬란 아이', 'injection', 'skinbooster', '-', '시린지', 80, 20, 180000, '파마리서치', NULL),
  ('리쥬란 HB', 'injection', 'skinbooster', '-', '시린지', 119, 30, 150000, '파마리서치', '★냉장보관, 유효기한: 27.05.09'),
  ('쥬베룩 볼륨', 'injection', 'skinbooster', '-', '바이알', 24, 10, 200000, '에이미셀', '★냉장보관, 유효기한: 27.08.24'),
  ('쥬베룩 스킨부스터', 'injection', 'skinbooster', '-', '바이알', 31, 10, 150000, '에이미셀', NULL),
  ('스컬트라', 'injection', 'skinbooster', '-', '바이알', 6, 3, 300000, '갈더마', '유효기한: 28.01'),
  ('리투오', 'injection', 'skinbooster', '-', '시린지', 30, 10, 120000, NULL, '유효기한: 29.12.23'),
  ('LAFULLEN', 'injection', 'skinbooster', '-', '시린지', 2, 2, 100000, NULL, '유효기한: 27.05.17'),
  ('큐티셀 블랙 오리진', 'injection', 'skinbooster', '-', '바이알', 17, 5, 150000, NULL, '★냉장보관, 유효기한: 27.03.17'),
  ('로리앙엘리멘트 1제', 'injection', 'skinbooster', '앰플/투명', '시린지', 4, 2, 100000, '로리앙', '★냉장보관, 유효기한: 27.02.07'),
  ('로리앙엘리멘트 2제', 'injection', 'skinbooster', '가루/갈색', '시린지', 4, 2, 100000, '로리앙', '★냉장보관, 유효기한: 27.05.02'),
  ('레디어스', 'injection', 'skinbooster', '-', '시린지', 16, 5, 200000, NULL, '유효기한: 27.02.14'),
  ('볼라썸', 'injection', 'skinbooster', '-', '시린지', 33, 10, 120000, NULL, '유효기한: 27.01.11'),
  ('뉴아티', 'injection', 'skinbooster', '-', '시린지', 8, 5, 150000, NULL, '유효기한: 28.08.20'),
  ('샤넬주사', 'injection', 'skinbooster', '-', '시린지', 9, 5, 200000, NULL, '유효기한: 26.06');

-- ============================================
-- 5. 주사제 - 윤곽주사 (injection/contouring)
-- ============================================
INSERT INTO inventory_items (name, category, sub_category, specification, unit, current_stock, min_stock, unit_price, supplier, storage_note) VALUES
  ('아미노필린', 'injection', 'contouring', '-', '바이알', 50, 10, 15000, NULL, '유효기한: 28.08.17'),
  ('브이올렛', 'injection', 'contouring', '-', '박스', 11, 3, 30000, NULL, '유효기한: 28.03.13');

-- ============================================
-- 6. 실리프팅 (thread)
-- ============================================
INSERT INTO inventory_items (name, category, sub_category, specification, unit, current_stock, min_stock, unit_price, supplier, storage_note) VALUES
  ('실루엣소프트 8', 'thread', 'silhouette', '8콘', '개', 4, 2, 200000, NULL, '★냉장보관'),
  ('실루엣소프트 12', 'thread', 'silhouette', '12콘', '개', 14, 5, 280000, NULL, '★냉장보관'),
  ('민트실 리프트업', 'thread', 'mint', '-', '개', 30, 10, 55000, NULL, '유효기한: 28.01.19'),
  ('네오닥터 JAMBER 23G*60', 'thread', 'neodoctor', '23G*60', '개', 10, 5, 45000, '네오닥터', '유효기한: 27.08.06'),
  ('네오닥터 JAMBER 27G*50', 'thread', 'neodoctor', '27G*50', '개', 4, 2, 40000, '네오닥터', '유효기한: 27.04.02'),
  ('에피티콘 Thin (sam)', 'thread', 'epiticon', 'Thin', '개', 4, 2, 35000, NULL, '유효기한: 26.08.22'),
  ('에피티콘 jamber 25G*50 (sam)', 'thread', 'epiticon', '25G*50', '개', 2, 2, 40000, NULL, '유효기한: 27.02.19'),
  ('콘셀티나 19*100', 'thread', 'conseltina', '19*100', '개', 40, 10, 50000, NULL, '유효기한: 26.09.22'),
  ('콘셀티나 19*60', 'thread', 'conseltina', '19*60', '개', 18, 5, 45000, NULL, '유효기한: 26.02.13'),
  ('콘셀티나 19*40', 'thread', 'conseltina', '19*40', '개', 20, 5, 40000, NULL, '유효기한: 26.07.09'),
  ('압토스 visage', 'thread', 'aptos', 'visage', '개', 3, 2, 80000, NULL, NULL),
  ('압토스 light lift 500mm', 'thread', 'aptos', '500mm', '개', 1, 1, 70000, NULL, NULL),
  ('압토스 light lift 250mm', 'thread', 'aptos', '250mm', '개', 2, 1, 60000, NULL, NULL),
  ('미니팅 (sam)', 'thread', 'mint', '-', '개', 4, 2, 30000, NULL, '유효기한: 28.10.21');

-- ============================================
-- 7. 소모품 - 니들 (consumable/needle)
-- ============================================
INSERT INTO inventory_items (name, category, sub_category, specification, unit, current_stock, min_stock, unit_price, supplier) VALUES
  ('니들 18G', 'consumable', 'needle', '18G', '박스', 5, 2, 15000, NULL),
  ('니들 21G', 'consumable', 'needle', '21G', '박스', 1, 2, 15000, NULL),
  ('니들 23G', 'consumable', 'needle', '23G', '박스', 8, 3, 15000, NULL),
  ('니들 25G', 'consumable', 'needle', '25G', '박스', 9, 3, 15000, NULL),
  ('니들 27G', 'consumable', 'needle', '27G', '박스', 4, 2, 15000, NULL),
  ('니들 29G', 'consumable', 'needle', '29G', '박스', 2, 2, 15000, NULL),
  ('니들 30G', 'consumable', 'needle', '30G', '박스', 4, 2, 15000, NULL),
  ('니들 30G (나노)', 'consumable', 'needle', '30G 나노', '박스', 1, 1, 20000, NULL),
  ('니들 32G (나노)', 'consumable', 'needle', '32G 나노', '박스', 1, 1, 20000, NULL),
  ('니들 33G (나노)', 'consumable', 'needle', '33G 나노', '박스', 1, 1, 20000, NULL),
  ('니들 34G (나노)', 'consumable', 'needle', '34G 나노', '박스', 1, 1, 20000, NULL),
  ('니들 34G (나노/2mm)', 'consumable', 'needle', '34G 나노 2mm', '박스', 1, 1, 20000, NULL),
  ('Dental 니들 30G', 'consumable', 'needle', 'Dental 30G', '박스', 8, 3, 18000, NULL);

-- ============================================
-- 8. 소모품 - 케뉼라/카테터/롱니들 (consumable/cannula)
-- ============================================
INSERT INTO inventory_items (name, category, sub_category, specification, unit, current_stock, min_stock, unit_price, supplier) VALUES
  ('케뉼라 21G', 'consumable', 'cannula', '21G', '박스', 1, 1, 25000, NULL),
  ('케뉼라 23G', 'consumable', 'cannula', '23G', '박스', 5, 2, 25000, NULL),
  ('케뉼라 25G', 'consumable', 'cannula', '25G', '박스', 0, 2, 25000, NULL),
  ('케뉼라 27G', 'consumable', 'cannula', '27G', '박스', 1, 1, 25000, NULL),
  ('카테터 24G', 'consumable', 'cannula', '24G', '박스', 2, 1, 30000, NULL),
  ('롱니들 25G', 'consumable', 'cannula', '25G', '박스', 1, 1, 25000, NULL);

-- ============================================
-- 9. 소모품 - 주사기 (consumable/syringe)
-- ============================================
INSERT INTO inventory_items (name, category, sub_category, specification, unit, current_stock, min_stock, unit_price, supplier) VALUES
  ('주사기 1cc', 'consumable', 'syringe', '1cc', '박스', 4, 2, 10000, NULL),
  ('주사기 3cc', 'consumable', 'syringe', '3cc', '박스', 3, 2, 10000, NULL),
  ('주사기 5cc', 'consumable', 'syringe', '5cc', '박스', 3, 2, 10000, NULL),
  ('주사기 10cc', 'consumable', 'syringe', '10cc', '박스', 2, 1, 10000, NULL),
  ('주사기 20cc', 'consumable', 'syringe', '20cc', '박스', 1, 1, 10000, NULL),
  ('주사기 50cc', 'consumable', 'syringe', '50cc', '박스', 0, 1, 12000, NULL),
  ('주사기 1cc 루어락', 'consumable', 'syringe', '1cc 루어락', '박스', 5, 2, 12000, NULL),
  ('주사기 10cc 루어락', 'consumable', 'syringe', '10cc 루어락', '박스', 1, 1, 12000, NULL),
  ('인슐린 주사기 0.5', 'consumable', 'syringe', '0.5cc', '박스', 6, 2, 15000, NULL),
  ('인슐린 주사기 1.0', 'consumable', 'syringe', '1.0cc', '박스', 2, 1, 15000, NULL);

-- ============================================
-- 10. 소모품 - 수액 (consumable/iv_fluid)
-- ============================================
INSERT INTO inventory_items (name, category, sub_category, specification, unit, current_stock, min_stock, unit_price, supplier) VALUES
  ('수액 set', 'consumable', 'iv_fluid', '-', '박스', 142, 20, 5000, NULL),
  ('Y수액 set', 'consumable', 'iv_fluid', 'Y형', '개', 41, 10, 3000, NULL),
  ('익스텐션', 'consumable', 'iv_fluid', '-', '개', 58, 10, 2000, NULL),
  ('N/S 50', 'consumable', 'iv_fluid', '50ml', '개', 50, 10, 1500, NULL),
  ('N/S 100', 'consumable', 'iv_fluid', '100ml', '개', 60, 10, 2000, NULL),
  ('N/S 20ml', 'consumable', 'iv_fluid', '20ml', '개', 0, 10, 1000, NULL),
  ('멸균증류수 1L', 'consumable', 'iv_fluid', '1L', '개', 2, 1, 3000, NULL);

-- ============================================
-- 11. 소모품 - 거즈/소독/기타 (consumable)
-- ============================================
INSERT INTO inventory_items (name, category, sub_category, specification, unit, current_stock, min_stock, unit_price, supplier) VALUES
  -- 거즈
  ('부직포 거즈 (보릭)', 'consumable', 'gauze', '-', '팩', 22, 5, 5000, NULL),
  ('코튼솜', 'consumable', 'gauze', '-', '팩', 3, 2, 3000, NULL),
  ('포장 거즈 4*4', 'consumable', 'gauze', '4x4', '팩', 1, 1, 3000, NULL),
  ('거즈 4*4', 'consumable', 'gauze', '4x4', '팩', 1, 1, 2000, NULL),
  ('거즈 2*2', 'consumable', 'gauze', '2x2', '팩', 10, 3, 2000, NULL),
  ('탈지면 (묶음)', 'consumable', 'gauze', '-', '팩', 9, 3, 3000, NULL),
  -- 소독
  ('베타딘', 'consumable', 'disinfection', '-', '병', 2, 1, 8000, NULL),
  ('에탄올', 'consumable', 'disinfection', '-', '병', 3, 1, 5000, NULL),
  ('대일밴드', 'consumable', 'disinfection', '-', '박스', 1, 1, 3000, NULL),
  ('모아랩 밴드', 'consumable', 'disinfection', '-', '박스', 7, 2, 5000, NULL),
  -- 기타 소모품
  ('롱 면봉', 'consumable', 'glove', '-', '박스', 8, 2, 5000, NULL),
  ('나비바늘', 'consumable', 'glove', '-', '박스', 2, 1, 8000, NULL),
  ('3way', 'consumable', 'glove', '-', '박스', 1, 1, 10000, NULL),
  ('XS 글러브', 'consumable', 'glove', 'XS', '박스', 3, 1, 15000, NULL),
  ('S 글러브', 'consumable', 'glove', 'S', '박스', 6, 2, 15000, NULL),
  ('멸균 S 글러브', 'consumable', 'glove', 'S멸균', '박스', 1, 1, 25000, NULL),
  ('멸균 M 글러브', 'consumable', 'glove', 'M멸균', '박스', 2, 1, 25000, NULL),
  ('테이프 1/2', 'consumable', 'glove', '1/2', '개', 2, 1, 2000, NULL),
  ('테이프 (box*10)', 'consumable', 'glove', '10개입', '박스', 1, 1, 15000, NULL),
  ('초음파젤', 'consumable', 'gel', '-', '병', 1, 1, 8000, NULL),
  ('덴탈마스크', 'consumable', 'glove', '-', '박스', 7, 2, 10000, NULL),
  ('수술용 모자', 'consumable', 'glove', '-', '박스', 1, 1, 8000, NULL),
  ('소독기테이프', 'consumable', 'disinfection', '-', '개', 2, 1, 5000, NULL),
  -- 폼/드레싱
  ('듀오덤', 'consumable', 'foam', '-', '박스', 3, 1, 15000, NULL),
  ('메디폼 2mm', 'consumable', 'foam', '2mm', '박스', 2, 1, 12000, NULL),
  ('메디폼 5mm', 'consumable', 'foam', '5mm', '박스', 6, 2, 12000, NULL),
  ('이지덤', 'consumable', 'foam', '-', '박스', 7, 2, 10000, NULL);

-- ============================================
-- 12. 약물/연고 (medicine)
-- ============================================
INSERT INTO inventory_items (name, category, sub_category, specification, unit, current_stock, min_stock, unit_price, supplier, storage_note) VALUES
  -- 향정신성 (마약류)
  ('프로포폴', 'medicine', 'controlled', '-', '바이알', 6, 3, 25000, NULL, '★마약냉장, 유효기한: 27.01.27'),
  ('미다졸람', 'medicine', 'controlled', '-', '앰플', 10, 5, 8000, NULL, '★마약냉장, 유효기한: 28.08.19'),
  ('케타민', 'medicine', 'controlled', '-', '바이알', 6, 3, 15000, NULL, '★마약냉장, 유효기한: 27.01.19'),
  -- 약물
  ('리도카인 덴탈 1.8ml', 'medicine', 'drug', '1.8ml', '앰플', 30, 10, 2000, NULL, '유효기한: 27.03.26'),
  ('리도카인 20ml', 'medicine', 'drug', '20ml', '앰플', 46, 10, 5000, NULL, '★냉장보관, 유효기한: 28.09.10'),
  ('라이넥', 'medicine', 'drug', '-', '앰플', 44, 10, 8000, NULL, '유효기한: 27.10.27'),
  ('차오델라', 'medicine', 'drug', '-', '앰플', 9, 5, 10000, NULL, '유효기한: 28.04.13'),
  ('리보비타주', 'medicine', 'drug', '-', '앰플', 98, 20, 3000, NULL, '유효기한: 27.07.31'),
  ('리비탈렉스', 'medicine', 'drug', '-', '앰플', 12, 5, 5000, NULL, '유효기한: 27.12.03'),
  ('디톡시온', 'medicine', 'drug', '-', '앰플', 31, 10, 4000, NULL, '유효기한: 28.11.09'),
  ('카르티닌', 'medicine', 'drug', '-', '앰플', 25, 10, 5000, NULL, '유효기한: 27.08.15'),
  ('리쥬비넥스 앰플', 'medicine', 'drug', '-', '앰플', 3, 2, 15000, NULL, '유효기한: 27.09.23'),
  ('덱사', 'medicine', 'drug', '-', '앰플', 108, 20, 2000, NULL, '유효기한: 28.09.14'),
  ('트리암 (염증주사)', 'medicine', 'drug', '-', '앰플', 35, 10, 3000, NULL, '유효기한: 28.07.16'),
  ('아르믹스주', 'medicine', 'drug', '-', '앰플', 5, 3, 5000, NULL, '유효기한: 28.02.05'),
  ('비비에스', 'medicine', 'drug', '-', '앰플', 5, 3, 8000, NULL, '★냉장보관, 유효기한: 28.01.08'),
  ('포비원', 'medicine', 'drug', '-', '병', 20, 5, 5000, NULL, '유효기한: 27.12.10'),
  ('비타모', 'medicine', 'drug', '-', '앰플', 28, 10, 5000, NULL, '★냉장보관, 유효기한: 26.12.05'),
  ('하이코민', 'medicine', 'drug', '-', '앰플', 50, 10, 3000, NULL, '유효기한: 28.08.10'),
  ('모비눌', 'medicine', 'drug', '-', '앰플', 50, 10, 3000, NULL, '유효기한: 28.08.26'),
  ('피리독신염산염 (비타민B)', 'medicine', 'drug', '-', '앰플', 29, 10, 2000, NULL, '유효기한: 27.12.17'),
  ('마시주사 (진경제)', 'medicine', 'drug', '-', '앰플', 5, 3, 3000, NULL, '유효기한: 28.01.12'),
  ('히루니다제', 'medicine', 'drug', '-', '앰플', 31, 10, 5000, NULL, '유효기한: 28.09.04'),
  ('지씨아르기닌', 'medicine', 'drug', '-', '앰플', 6, 3, 5000, NULL, '유효기한: 27.10.16'),
  ('아스크로브산', 'medicine', 'drug', '-', '앰플', 43, 10, 2000, NULL, '유효기한: 28.03.26'),
  ('페니라민', 'medicine', 'drug', '-', '앰플', 113, 20, 1500, NULL, '유효기한: 28.05.24'),
  ('비타벨라', 'medicine', 'drug', '-', '앰플', 90, 20, 3000, NULL, '유효기한: 27.10.27'),
  -- 연고
  ('에펙신', 'medicine', 'ointment', '-', '개', 2, 1, 8000, NULL, '몰딩연고'),
  ('포러스', 'medicine', 'ointment', '-', '개', 5, 2, 8000, NULL, '몰딩연고'),
  ('타라비드', 'medicine', 'ointment', '-', '개', 9, 3, 5000, NULL, '몰딩연고'),
  ('에스로반', 'medicine', 'ointment', '-', '개', 2, 1, 5000, NULL, NULL),
  ('아드반탄', 'medicine', 'ointment', '-', '개', 0, 1, 6000, NULL, NULL),
  ('더마톱', 'medicine', 'ointment', '-', '개', 1, 1, 5000, NULL, NULL),
  ('토라신', 'medicine', 'ointment', '-', '개', 1, 1, 5000, NULL, NULL),
  -- 그리다
  ('그리다 연고', 'medicine', 'grida', '-', '개', 9, 3, 15000, NULL, '유효기한: 27.11.19'),
  ('그리다 바늘', 'medicine', 'grida', '-', '개', 15, 5, 3000, NULL, NULL),
  ('그리다 Care Patch', 'medicine', 'grida', '-', '개', 1, 1, 10000, NULL, NULL);

-- ============================================
-- 13. 시술 레시피
-- ============================================

-- 리쥬란 HB 시술
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '리쥬란 HB 시술', id, 4, '기본 4시린지' FROM inventory_items WHERE name = '리쥬란 HB';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '리쥬란 HB 시술', id, 1, NULL FROM inventory_items WHERE name = '니들 30G';

-- 리쥬란 힐러 시술
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '리쥬란 힐러 시술', id, 2, '기본 2시린지' FROM inventory_items WHERE name = '리쥬란힐러';

-- 리쥬란 아이 시술
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '리쥬란 아이 시술', id, 1, NULL FROM inventory_items WHERE name = '리쥬란 아이';

-- 필러 시술 (쥬비덤 볼벨라)
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (볼벨라)', id, 1, NULL FROM inventory_items WHERE name = '쥬비덤 볼벨라';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (볼벨라)', id, 1, NULL FROM inventory_items WHERE name = '케뉼라 25G';

-- 필러 시술 (쥬비덤 볼루마)
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (볼루마)', id, 1, NULL FROM inventory_items WHERE name = '쥬비덤 볼루마';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (볼루마)', id, 1, NULL FROM inventory_items WHERE name = '케뉼라 25G';

-- 필러 시술 (쥬비덤 볼리프트)
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (볼리프트)', id, 1, NULL FROM inventory_items WHERE name = '쥬비덤 볼리프트';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (볼리프트)', id, 1, NULL FROM inventory_items WHERE name = '케뉼라 25G';

-- 필러 시술 (쥬비덤 볼룩스)
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (볼룩스)', id, 1, NULL FROM inventory_items WHERE name = '쥬비덤 볼룩스';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '필러 시술 (볼룩스)', id, 1, NULL FROM inventory_items WHERE name = '케뉼라 25G';

-- 보톡스 시술 (제오민)
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '보톡스 시술 (제오민)', id, 1, NULL FROM inventory_items WHERE name = '제오민';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '보톡스 시술 (제오민)', id, 1, NULL FROM inventory_items WHERE name = '니들 30G';

-- 보톡스 시술 (하이톡스)
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '보톡스 시술 (하이톡스)', id, 1, NULL FROM inventory_items WHERE name = '하이톡스';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '보톡스 시술 (하이톡스)', id, 1, NULL FROM inventory_items WHERE name = '니들 30G';

-- 보톡스 시술 (제테마더)
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '보톡스 시술 (제테마더)', id, 1, NULL FROM inventory_items WHERE name = '제테마더톡신주';
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '보톡스 시술 (제테마더)', id, 1, NULL FROM inventory_items WHERE name = '니들 30G';

-- 써마지 FLX 600
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '써마지 FLX 600', id, 1, NULL FROM inventory_items WHERE name = '써마지 FLX 팁 600샷';

-- 써마지 FLX 900
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '써마지 FLX 900', id, 1, NULL FROM inventory_items WHERE name = '써마지 FLX 팁 900샷';

-- 아이써마지
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '아이써마지', id, 1, NULL FROM inventory_items WHERE name = '아이써마지 팁 225샷';

-- 스컬트라 시술
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '스컬트라 시술', id, 2, '기본 2바이알' FROM inventory_items WHERE name = '스컬트라';

-- 쥬베룩 볼륨 시술
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '쥬베룩 볼륨 시술', id, 1, NULL FROM inventory_items WHERE name = '쥬베룩 볼륨';

-- 쥬베룩 스킨부스터 시술
INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
SELECT '쥬베룩 스킨부스터 시술', id, 1, NULL FROM inventory_items WHERE name = '쥬베룩 스킨부스터';

-- ============================================
-- 14. 1월 사용 이력 (CSV 실제 데이터 기반)
-- ============================================

-- 2025-01-02
INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 1, '황얜', '437', '김수정', '2025-01-02T10:00:00+09:00' FROM inventory_items WHERE name = '리투오';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, note, created_at)
SELECT id, 'use', 1, '믹스', NULL, '김수정', '약물 믹스', '2025-01-02T10:30:00+09:00' FROM inventory_items WHERE name = '제오민';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, note, created_at)
SELECT id, 'use', 2, '믹스', NULL, '김수정', '약물 믹스', '2025-01-02T10:30:00+09:00' FROM inventory_items WHERE name = '하이톡스';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, note, created_at)
SELECT id, 'use', 1, '믹스', NULL, '김수정', '약물 믹스', '2025-01-02T10:30:00+09:00' FROM inventory_items WHERE name = '제테마더톡신주';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 1, '김민지', '230', '김수정', '2025-01-02T11:00:00+09:00' FROM inventory_items WHERE name = '쥬비덤 볼룩스';

-- 2025-01-03
INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 1, '류만리', '825', '김수정', '2025-01-03T10:00:00+09:00' FROM inventory_items WHERE name = '쥬비덤 볼벨라';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 2, '리나', '824', '김수정', '2025-01-03T10:30:00+09:00' FROM inventory_items WHERE name = '쥬비덤 볼룩스';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 1, '양싱', '202', '김수정', '2025-01-03T11:00:00+09:00' FROM inventory_items WHERE name = '쥬비덤 볼벨라';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 1, '천잉', '207', '김수정', '2025-01-03T11:30:00+09:00' FROM inventory_items WHERE name = '레스틸렌 리프트';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, note, created_at)
SELECT id, 'use', 1, '믹스', NULL, '김수정', '약물 믹스', '2025-01-03T12:00:00+09:00' FROM inventory_items WHERE name = '앨러간';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, note, created_at)
SELECT id, 'use', 1, '믹스', NULL, '김수정', '약물 믹스', '2025-01-03T12:00:00+09:00' FROM inventory_items WHERE name = '제오민';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, note, created_at)
SELECT id, 'use', 1, '믹스', NULL, '김수정', '약물 믹스', '2025-01-03T12:00:00+09:00' FROM inventory_items WHERE name = '하이톡스';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 4, '우신', '386', '김수정', '2025-01-03T13:00:00+09:00' FROM inventory_items WHERE name = '리쥬란 HB';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 4, '라니안', '817', '김수정', '2025-01-03T14:00:00+09:00' FROM inventory_items WHERE name = '리쥬란 HB';

-- 2025-01-05
INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 4, '짱야우', '834', '김수정', '2025-01-05T10:00:00+09:00' FROM inventory_items WHERE name = '리쥬란 HB';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 1, '짱야우', '834', '김수정', '2025-01-05T10:00:00+09:00' FROM inventory_items WHERE name = '쥬비덤 볼벨라';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 3, '짱야우', '834', '김수정', '2025-01-05T10:00:00+09:00' FROM inventory_items WHERE name = '벨로테로 발란스';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 4, '추쏘찡', '833', '김수정', '2025-01-05T11:00:00+09:00' FROM inventory_items WHERE name = '리쥬란 HB';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 1, '추쏘찡', '833', '김수정', '2025-01-05T11:00:00+09:00' FROM inventory_items WHERE name = '쥬비덤 볼벨라';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 3, '추쏘찡', '833', '김수정', '2025-01-05T11:00:00+09:00' FROM inventory_items WHERE name = '벨로테로 발란스';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 2, '추쏘찡', '833', '김수정', '2025-01-05T11:00:00+09:00' FROM inventory_items WHERE name = '벨로테로 인텐스';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 4, '수훙위', '832', '김수정', '2025-01-05T12:00:00+09:00' FROM inventory_items WHERE name = '리쥬란 HB';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 4, '황원왠', '831', '김수정', '2025-01-05T13:00:00+09:00' FROM inventory_items WHERE name = '리쥬란 HB';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 4, '워싱싱', '830', '김수정', '2025-01-05T14:00:00+09:00' FROM inventory_items WHERE name = '리쥬란 HB';

-- 2025-01-06
INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 4, '천징', '836', '김수정', '2025-01-06T10:00:00+09:00' FROM inventory_items WHERE name = '쥬비덤 볼루마';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 1, '천징', '836', '김수정', '2025-01-06T10:00:00+09:00' FROM inventory_items WHERE name = '벨로테로 소프트';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 2, '천징', '836', '김수정', '2025-01-06T10:00:00+09:00' FROM inventory_items WHERE name = '리쥬란힐러';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 2, '천징', '836', '김수정', '2025-01-06T10:00:00+09:00' FROM inventory_items WHERE name = '스컬트라';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, note, created_at)
SELECT id, 'use', 2, '약물믹스', NULL, '김수정', '약물 믹스', '2025-01-06T12:00:00+09:00' FROM inventory_items WHERE name = '제오민';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, note, created_at)
SELECT id, 'use', 1, '약물믹스', NULL, '김수정', '약물 믹스', '2025-01-06T12:00:00+09:00' FROM inventory_items WHERE name = '하이톡스';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 4, '텐푸', '837', '김수정', '2025-01-06T13:00:00+09:00' FROM inventory_items WHERE name = '리쥬란 HB';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 2, '박예슬', '840', '김수정', '2025-01-06T14:00:00+09:00' FROM inventory_items WHERE name = '리쥬란 HB';

-- 2025-01-07
INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 1, '박예슬', '840', '김수정', '2025-01-07T10:00:00+09:00' FROM inventory_items WHERE name = '리쥬란 아이';

-- 2025-01-08~10 (주요 건만)
INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 4, '추샤우찬', '842', '김수정', '2025-01-08T10:00:00+09:00' FROM inventory_items WHERE name = '리쥬란 HB';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 4, '최인정', '20210316', '김수정', '2025-01-09T10:00:00+09:00' FROM inventory_items WHERE name = '리쥬란 HB';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 1, '한성희', '740305', '김수정', '2025-01-09T11:00:00+09:00' FROM inventory_items WHERE name = '레디어스';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 4, '판야징', '849', '김수정', '2025-01-10T10:00:00+09:00' FROM inventory_items WHERE name = '리쥬란 HB';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 2, '판야징', '849', '김수정', '2025-01-10T10:00:00+09:00' FROM inventory_items WHERE name = '제테마더톡신주';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 5, '황훼이지', '848', '김수정', '2025-01-10T11:00:00+09:00' FROM inventory_items WHERE name = '쥬비덤 볼리프트';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 1, '황훼이지', '848', '김수정', '2025-01-10T11:00:00+09:00' FROM inventory_items WHERE name = '쥬베룩 스킨부스터';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 1, '황훼이지', '848', '김수정', '2025-01-10T11:00:00+09:00' FROM inventory_items WHERE name = '쥬베룩 볼륨';

-- 2025-01-17
INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 4, '진예', '871', '김수정', '2025-01-17T10:00:00+09:00' FROM inventory_items WHERE name = '쥬비덤 볼리프트';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 2, '진예', '871', '김수정', '2025-01-17T10:00:00+09:00' FROM inventory_items WHERE name = '쥬비덤 볼루마';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 4, '찡웨이훙', '862', '김수정', '2025-01-17T11:00:00+09:00' FROM inventory_items WHERE name = '리쥬란 HB';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 2, '장징', '863', '김수정', '2025-01-17T12:00:00+09:00' FROM inventory_items WHERE name = '리쥬란힐러';

-- 2025-01-20~26
INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 2, '차오위치', '896', '김지연', '2025-01-20T10:00:00+09:00' FROM inventory_items WHERE name = '쥬비덤 볼룩스';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 1, '차오위치', '896', '김지연', '2025-01-20T10:00:00+09:00' FROM inventory_items WHERE name = '레스틸렌 리프트';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 4, '쉬정', '903', '김지연', '2025-01-22T10:00:00+09:00' FROM inventory_items WHERE name = '리쥬란 HB';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 4, '천취', '901', '김지연', '2025-01-22T11:00:00+09:00' FROM inventory_items WHERE name = '리쥬란 HB';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 3, '양지혜', '905', '김지연', '2025-01-23T10:00:00+09:00' FROM inventory_items WHERE name = '순수필 100';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 2, '양지혜', '905', '김지연', '2025-01-23T10:00:00+09:00' FROM inventory_items WHERE name = '뉴라미스 DEEP';

INSERT INTO inventory_transactions (item_id, tx_type, quantity, patient_name, chart_number, confirmed_by, created_at)
SELECT id, 'use', 1, '이가은', '909', '김지연', '2025-01-23T14:00:00+09:00' FROM inventory_items WHERE name = '리투오';
