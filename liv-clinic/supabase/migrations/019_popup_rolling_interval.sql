-- ============================================
-- 019: Add rolling_interval_ms to popups
-- ============================================
-- 다중 팝업 캐러셀에서 각 팝업이 화면에 머무는 시간(ms).
-- 관리자 페이지에서 팝업별로 2~30초 사이로 설정 가능.

-- 1. Add column with default value (covers existing rows)
ALTER TABLE public.popups
  ADD COLUMN IF NOT EXISTS rolling_interval_ms INTEGER NOT NULL DEFAULT 5000;

-- 2. CHECK constraint: 2~30 seconds range
ALTER TABLE public.popups
  DROP CONSTRAINT IF EXISTS popups_rolling_interval_ms_range;

ALTER TABLE public.popups
  ADD CONSTRAINT popups_rolling_interval_ms_range
  CHECK (rolling_interval_ms BETWEEN 2000 AND 30000);

-- 3. Column comment
COMMENT ON COLUMN public.popups.rolling_interval_ms IS
  '슬라이드 자동 전환 간격(ms). 2000~30000ms 범위. 다중 팝업 캐러셀에서 이 팝업이 화면에 머무는 시간.';
