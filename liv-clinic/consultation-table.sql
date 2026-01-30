-- ============================================
-- consultation_requests 테이블 생성
-- Supabase Dashboard > SQL Editor에서 실행하세요
-- ============================================

CREATE TABLE IF NOT EXISTS consultation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  treatment_type TEXT NOT NULL,
  preferred_date TEXT DEFAULT '',
  preferred_time TEXT DEFAULT '',
  message TEXT DEFAULT '',
  password TEXT DEFAULT '',
  agree_privacy BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT '',
  contacted_at TIMESTAMPTZ,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert consultation" ON consultation_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can read consultations" ON consultation_requests
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can update consultations" ON consultation_requests
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete consultations" ON consultation_requests
  FOR DELETE TO authenticated
  USING (true);
