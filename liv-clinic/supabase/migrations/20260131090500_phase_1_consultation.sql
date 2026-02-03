-- Phase 1: 상담관리 확장 (팔로업 시스템)
-- consultation_requests 테이블에 운영 필드 추가

-- 1. 새 컬럼 추가
ALTER TABLE consultation_requests
  ADD COLUMN IF NOT EXISTS assignee text,
  ADD COLUMN IF NOT EXISTS next_followup_at timestamptz,
  ADD COLUMN IF NOT EXISTS followup_outcome text,
  ADD COLUMN IF NOT EXISTS procedure_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS budget_range text,
  ADD COLUMN IF NOT EXISTS availability text;

-- 2. 기존 status 'pending' → 'new' 마이그레이션
UPDATE consultation_requests SET status = 'new' WHERE status = 'pending';

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_consultation_next_followup
  ON consultation_requests(next_followup_at)
  WHERE next_followup_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_consultation_assignee
  ON consultation_requests(assignee)
  WHERE assignee IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_consultation_status
  ON consultation_requests(status);
