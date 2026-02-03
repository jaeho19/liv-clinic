-- 006_operation_cases.sql
-- 운영현황 (당일 시술 케이스 관리) 테이블

-- ─── 타입 정의 ──────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE treatment_type AS ENUM ('CONSULT', 'SKINCARE', 'ANESTHESIA', 'PROCEDURE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE case_status AS ENUM ('WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE case_location AS ENUM ('ROOM', 'LOUNGE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 테이블 생성 ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS operation_cases (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id       text NOT NULL,
  patient_name  text NOT NULL,
  phone_number  text,
  treatment_type treatment_type NOT NULL,
  status        case_status NOT NULL DEFAULT 'WAITING',
  location      case_location NOT NULL DEFAULT 'LOUNGE',
  doctor        text NOT NULL,
  procedure_name text NOT NULL,
  actual_start  timestamptz,
  expected_duration_min integer NOT NULL DEFAULT 60,
  memo          text,
  parent_case_id uuid REFERENCES operation_cases(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now() NOT NULL,
  updated_at    timestamptz DEFAULT now() NOT NULL
);

-- ─── 인덱스 ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_operation_cases_status ON operation_cases(status);
CREATE INDEX IF NOT EXISTS idx_operation_cases_created_at ON operation_cases(created_at);
CREATE INDEX IF NOT EXISTS idx_operation_cases_room_id ON operation_cases(room_id);

-- ─── updated_at 자동 갱신 트리거 ──────────────────────
CREATE OR REPLACE FUNCTION update_operation_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_operation_cases_updated_at ON operation_cases;
CREATE TRIGGER trigger_operation_cases_updated_at
  BEFORE UPDATE ON operation_cases
  FOR EACH ROW EXECUTE FUNCTION update_operation_cases_updated_at();

-- ─── RLS 정책 ──────────────────────────────────────────
ALTER TABLE operation_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON operation_cases
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON operation_cases
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── 권한 부여 ──────────────────────────────────────────
GRANT ALL ON operation_cases TO service_role;
GRANT ALL ON operation_cases TO authenticated;
GRANT SELECT ON operation_cases TO anon;
