-- ============================================
-- 014: Analytics Settings
-- clinic_settings 테이블에 GA/Naver Analytics 설정 컬럼 추가
-- Supabase Dashboard > SQL Editor에서 실행하세요
-- ============================================

ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS ga_tracking_id text DEFAULT '';
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS naver_wcs_id text DEFAULT '';
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS ga_enabled boolean DEFAULT true;
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS naver_enabled boolean DEFAULT true;
