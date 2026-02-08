-- 014: 상담 이력 타임라인 테이블 및 Realtime 활성화

-- 상담 이력 타임라인 테이블
CREATE TABLE IF NOT EXISTS consultation_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL REFERENCES consultation_requests(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  actor TEXT,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE consultation_timeline IS '상담 상태 변경/메모 이력 타임라인';
-- event_type 값: status_change, note_added, callback_set, assigned, tag_added, budget_updated

CREATE INDEX IF NOT EXISTS idx_consultation_timeline_consultation_id
  ON consultation_timeline (consultation_id);

CREATE INDEX IF NOT EXISTS idx_consultation_timeline_created_at
  ON consultation_timeline (created_at DESC);

-- Supabase Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE consultation_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE consultation_timeline;
