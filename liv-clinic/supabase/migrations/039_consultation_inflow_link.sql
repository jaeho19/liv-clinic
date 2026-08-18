-- ============================================
-- 039: 홈페이지 상담 → 유입 통계 자동 연동 링크
-- ============================================
-- consultation_requests(홈페이지 폼) 1건 = inflow_leads 1행 자동 생성 시
-- 원본 추적 + 중복 연동 방지(UNIQUE)를 위한 링크 컬럼.
-- 추가형·멱등. 롤백: ALTER TABLE inflow_leads DROP COLUMN IF EXISTS consultation_id;
-- ============================================

ALTER TABLE inflow_leads
  ADD COLUMN IF NOT EXISTS consultation_id UUID UNIQUE REFERENCES consultation_requests(id) ON DELETE SET NULL;
