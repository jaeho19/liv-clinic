-- ============================================
-- 011: Add revenue_target to clinic_settings
-- 리포트 페이지 목표 매출을 설정에서 관리 가능하게
-- ============================================

ALTER TABLE public.clinic_settings
  ADD COLUMN IF NOT EXISTS revenue_target BIGINT DEFAULT 250000000;

COMMENT ON COLUMN public.clinic_settings.revenue_target IS '월 목표 매출 (원)';

NOTIFY pgrst, 'reload schema';
