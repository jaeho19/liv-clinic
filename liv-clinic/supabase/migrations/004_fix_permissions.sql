-- ============================================
-- 004: PostgREST 역할 권한 부여
-- SQL Editor로 생성한 테이블에 API 접근 권한 추가
-- ============================================

-- 1. 테이블 권한 - service_role (API route에서 사용)
GRANT ALL ON inventory_items TO service_role;
GRANT ALL ON inventory_transactions TO service_role;
GRANT ALL ON procedure_recipes TO service_role;
GRANT ALL ON inventory_counts TO service_role;

-- 2. 테이블 권한 - authenticated (로그인 사용자)
GRANT ALL ON inventory_items TO authenticated;
GRANT ALL ON inventory_transactions TO authenticated;
GRANT ALL ON procedure_recipes TO authenticated;
GRANT ALL ON inventory_counts TO authenticated;

-- 3. 테이블 권한 - anon (읽기 전용, 필요시)
GRANT SELECT ON inventory_items TO anon;
GRANT SELECT ON inventory_transactions TO anon;
GRANT SELECT ON procedure_recipes TO anon;
GRANT SELECT ON inventory_counts TO anon;

-- 4. 시퀀스 권한 (INSERT 시 필요)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 5. 함수 실행 권한
GRANT EXECUTE ON FUNCTION use_inventory_item(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION use_inventory_item(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION restock_inventory_item(UUID, INTEGER, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION restock_inventory_item(UUID, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_inventory_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION update_inventory_updated_at() TO authenticated;

-- 6. PostgREST 스키마 캐시 리로드
NOTIFY pgrst, 'reload schema';
