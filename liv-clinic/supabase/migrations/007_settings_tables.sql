-- ==========================================
-- 007: 설정 관련 테이블
-- - treatment_masters (시술 마스터)
-- - staff_members (직원 관리)
-- - audit_logs (감사 로그)
-- - clinic_settings (병원 기본정보)
-- ==========================================

-- 1. 시술 마스터 테이블
CREATE TABLE IF NOT EXISTS treatment_masters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('lifting', 'antiaging', 'laser', 'skincare')),
  price_range text NOT NULL DEFAULT '-',
  duration integer NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_treatment_masters_category ON treatment_masters(category);

-- 2. 직원 관리 테이블
CREATE TABLE IF NOT EXISTS staff_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'staff')) DEFAULT 'staff',
  position text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_members_role ON staff_members(role);

-- 3. 감사 로그 테이블
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name text NOT NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login', 'export')),
  target text NOT NULL,
  detail text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_name ON audit_logs(user_name);

-- 4. 병원 기본정보 테이블 (싱글 row)
CREATE TABLE IF NOT EXISTS clinic_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name text NOT NULL DEFAULT '리브성형외과의원',
  phone text NOT NULL DEFAULT '02-1234-5678',
  address text NOT NULL DEFAULT '서울특별시 강남구 강남대로 432 리브빌딩 3~5층',
  email text NOT NULL DEFAULT 'info@livps.co.kr',
  kakao text NOT NULL DEFAULT '@livps',
  hours_weekday text NOT NULL DEFAULT '10:00 ~ 19:00',
  hours_saturday text NOT NULL DEFAULT '10:00 ~ 16:00',
  hours_sunday text NOT NULL DEFAULT '휴진',
  hours_lunch text NOT NULL DEFAULT '13:00 ~ 14:00',
  notify_callback_reminder boolean NOT NULL DEFAULT true,
  notify_low_stock_alert boolean NOT NULL DEFAULT true,
  notify_new_consultation boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 기본 행 삽입
INSERT INTO clinic_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_treatment_masters_updated_at
  BEFORE UPDATE ON treatment_masters
  FOR EACH ROW EXECUTE FUNCTION update_settings_updated_at();

CREATE TRIGGER trg_staff_members_updated_at
  BEFORE UPDATE ON staff_members
  FOR EACH ROW EXECUTE FUNCTION update_settings_updated_at();

CREATE TRIGGER trg_clinic_settings_updated_at
  BEFORE UPDATE ON clinic_settings
  FOR EACH ROW EXECUTE FUNCTION update_settings_updated_at();

-- RLS 정책
ALTER TABLE treatment_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read treatment_masters"
  ON treatment_masters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage treatment_masters"
  ON treatment_masters FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read staff_members"
  ON staff_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage staff_members"
  ON staff_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read audit_logs"
  ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert audit_logs"
  ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can read clinic_settings"
  ON clinic_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update clinic_settings"
  ON clinic_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 권한 부여
GRANT ALL ON treatment_masters TO authenticated;
GRANT ALL ON staff_members TO authenticated;
GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT SELECT, UPDATE ON clinic_settings TO authenticated;
