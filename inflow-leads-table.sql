-- ============================================
-- LIV 성형외과 - 유입 리드(일일 통계) 테이블 생성 SQL
-- ============================================
-- 2026-06-18 운영 회의 반영:
--   신규 연락 → 예약 → 내원 흐름을 채널/에이전시별로 기록.
--   직원이 어드민(/admin/inflow)에서 매일 입력하고, 주간/월간 집계·시각화.
-- Supabase 대시보드 > SQL Editor에서 실행하세요.
-- ============================================

-- 1. inflow_leads 테이블 생성 (리드 1건 = 1행)
CREATE TABLE IF NOT EXISTS inflow_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 최초 문의(신규 연락)일
  contact_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- 유입 채널: wechat | kakao | naver | phone | walk_in | website | livechat | etc
  channel TEXT NOT NULL DEFAULT 'etc',
  -- 연계 에이전시명 (바이올렛 등). 직접 유입이면 NULL
  agency TEXT,
  -- 신규(false) / 재진·재방문(true)
  is_returning BOOLEAN NOT NULL DEFAULT false,
  -- 고객 식별 정보 (선택)
  name TEXT,
  wechat_id TEXT,
  kakao_id TEXT,
  phone TEXT,
  -- 관심/예약 시술
  treatment TEXT,
  -- 예약 전환
  reserved BOOLEAN NOT NULL DEFAULT false,
  reserved_date DATE,
  -- 실제 내원
  visited BOOLEAN NOT NULL DEFAULT false,
  visited_date DATE,
  -- 비고
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 인덱스 (집계/필터 성능)
CREATE INDEX IF NOT EXISTS idx_inflow_leads_contact_date
  ON inflow_leads(contact_date DESC);

CREATE INDEX IF NOT EXISTS idx_inflow_leads_channel
  ON inflow_leads(channel);

CREATE INDEX IF NOT EXISTS idx_inflow_leads_agency
  ON inflow_leads(agency);

-- 3. updated_at 자동 갱신 트리거 함수 (consultation_requests와 공용)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_inflow_leads_updated_at ON inflow_leads;

CREATE TRIGGER update_inflow_leads_updated_at
  BEFORE UPDATE ON inflow_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS 활성화 (내부 데이터 → 인증된 관리자만 접근)
ALTER TABLE inflow_leads ENABLE ROW LEVEL SECURITY;

-- 4-1. SELECT: 인증된 사용자만 조회
DROP POLICY IF EXISTS "Authenticated users can view inflow leads" ON inflow_leads;
CREATE POLICY "Authenticated users can view inflow leads"
  ON inflow_leads FOR SELECT TO authenticated USING (true);

-- 4-2. INSERT: 인증된 사용자만 등록
DROP POLICY IF EXISTS "Authenticated users can insert inflow leads" ON inflow_leads;
CREATE POLICY "Authenticated users can insert inflow leads"
  ON inflow_leads FOR INSERT TO authenticated WITH CHECK (true);

-- 4-3. UPDATE: 인증된 사용자만 수정
DROP POLICY IF EXISTS "Authenticated users can update inflow leads" ON inflow_leads;
CREATE POLICY "Authenticated users can update inflow leads"
  ON inflow_leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 4-4. DELETE: 인증된 사용자만 삭제
DROP POLICY IF EXISTS "Authenticated users can delete inflow leads" ON inflow_leads;
CREATE POLICY "Authenticated users can delete inflow leads"
  ON inflow_leads FOR DELETE TO authenticated USING (true);

-- ============================================
-- 완료! 아래로 확인
-- ============================================
-- SELECT * FROM inflow_leads ORDER BY contact_date DESC;
