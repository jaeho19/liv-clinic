-- ============================================
-- LIV 성형외과 - 상담 신청 테이블 생성 SQL
-- ============================================
-- Supabase 대시보드 > SQL Editor에서 실행하세요
-- ============================================

-- 1. consultation_requests 테이블 생성
CREATE TABLE IF NOT EXISTS consultation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  password TEXT,
  phone TEXT NOT NULL,
  treatment_type TEXT NOT NULL,
  agree_privacy BOOLEAN DEFAULT false NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'contacted', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_consultation_requests_status
  ON consultation_requests(status);

CREATE INDEX IF NOT EXISTS idx_consultation_requests_created_at
  ON consultation_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_consultation_requests_phone
  ON consultation_requests(phone);

-- 3. updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_consultation_requests_updated_at ON consultation_requests;

CREATE TRIGGER update_consultation_requests_updated_at
  BEFORE UPDATE ON consultation_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. RLS (Row Level Security) 활성화
ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책 생성

-- 6-1. INSERT: 모든 사람이 상담 신청 가능 (익명 포함)
DROP POLICY IF EXISTS "Anyone can insert consultations" ON consultation_requests;

CREATE POLICY "Anyone can insert consultations"
  ON consultation_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 6-2. SELECT: 인증된 사용자만 조회 가능 (관리자용)
DROP POLICY IF EXISTS "Authenticated users can view consultations" ON consultation_requests;

CREATE POLICY "Authenticated users can view consultations"
  ON consultation_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- 6-3. UPDATE: 인증된 사용자만 업데이트 가능 (관리자용)
DROP POLICY IF EXISTS "Authenticated users can update consultations" ON consultation_requests;

CREATE POLICY "Authenticated users can update consultations"
  ON consultation_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6-4. DELETE: 인증된 사용자만 삭제 가능 (관리자용)
DROP POLICY IF EXISTS "Authenticated users can delete consultations" ON consultation_requests;

CREATE POLICY "Authenticated users can delete consultations"
  ON consultation_requests
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 테이블 생성 완료!
-- ============================================

-- 테스트용 샘플 데이터 삽입 (선택사항)
INSERT INTO consultation_requests (name, phone, treatment_type, agree_privacy)
VALUES
  ('홍길동', '01012345678', '레이저 시술', true),
  ('김철수', '01098765432', '필러 시술', true),
  ('이영희', '01055556666', '보톡스', true);

-- 테이블 확인
SELECT * FROM consultation_requests ORDER BY created_at DESC;
