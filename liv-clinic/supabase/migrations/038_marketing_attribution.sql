-- ============================================
-- 038: 마케팅 유입 표준화 + 게시기록 (marketing-attribution)
-- ============================================
-- 목적:
--   1) inflow_leads에 표준화 필드 추가 (국내/해외, 채널 대분류/세부, 시술 태그,
--      결제, 취소/노쇼, 캠페인, 담당자, 표준화 확인 시각)
--   2) 마케팅 캠페인(광고비 선택 입력) / 콘텐츠 게시기록 테이블 신설
--   3) 리드-콘텐츠 연결 (귀속 4단계: direct/assisted/inferred/unknown)
--   4) consultation_requests에 UTM 4필드 추가
-- 전부 추가형(additive)·멱등(idempotent): 기존 컬럼/행/배포 코드에 영향 없음.
-- 기존 channel 컬럼은 "문의 수단" 의미로 유지한다 (제거·변경 금지).
-- 롤백: docs/migrations/038-marketing-attribution.md 참조 (신규 입력 데이터 소실 주의)
-- ============================================

-- 1. 마케팅 캠페인 (광고 집행 단위)
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  -- utm_campaign 매칭용 코드 (예: 2608_babitalk_launch). NULL 허용, 값 있으면 유일
  code TEXT UNIQUE,
  channel_category TEXT,
  channel_detail TEXT,
  start_date DATE,
  end_date DATE,
  -- 광고비(원). NULL = "데이터 없음" (0으로 대체 금지 — CAC/ROAS는 값이 있을 때만 계산)
  spend_krw BIGINT,
  note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 마케팅 콘텐츠 게시기록
CREATE TABLE IF NOT EXISTS marketing_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_at DATE NOT NULL DEFAULT CURRENT_DATE,
  -- instagram | youtube_shorts | youtube | naver_blog | naver_cafe | xiaohongshu | douyin | etc
  platform TEXT NOT NULL DEFAULT 'etc',
  content_type TEXT,
  title TEXT NOT NULL,
  url TEXT,
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  -- utm_content 매칭용 코드. NULL 허용, 값 있으면 유일
  code TEXT UNIQUE,
  manager TEXT,
  -- 성과 지표: 전부 NULL 허용 — 미입력은 '데이터 없음'으로 표시 (0 표기 금지)
  view_count INTEGER,
  comment_count INTEGER,
  save_count INTEGER,
  share_count INTEGER,
  inquiry_count INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. inflow_leads 표준화 컬럼 (전부 NULL/DEFAULT — 기존 행·기존 UI 불변)
ALTER TABLE inflow_leads
  ADD COLUMN IF NOT EXISTS patient_origin TEXT CHECK (patient_origin IN ('domestic', 'foreign')),
  ADD COLUMN IF NOT EXISTS channel_category TEXT,
  ADD COLUMN IF NOT EXISTS channel_detail TEXT,
  ADD COLUMN IF NOT EXISTS treatment_tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS paid BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paid_date DATE,
  ADD COLUMN IF NOT EXISTS paid_amount_krw BIGINT,
  ADD COLUMN IF NOT EXISTS outcome TEXT CHECK (outcome IN ('cancelled', 'no_show')),
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS manager TEXT,
  -- 표준화 검토에서 관리자가 확인한 시각 (NULL = 미검토 → 검토 큐 대상)
  ADD COLUMN IF NOT EXISTS classified_at TIMESTAMPTZ;

-- 4. 리드-콘텐츠 연결 (콘텐츠 귀속)
--    direct   = UTM/앱결제/전용링크/고객응답으로 출처 확인
--    assisted = 고객이 여러 채널을 함께 봤다고 응답
--    inferred = 게시일-문의일 시간적 연관성만 있음 (단정 금지)
--    unknown  = 출처 불명
CREATE TABLE IF NOT EXISTS lead_content_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES inflow_leads(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES marketing_contents(id) ON DELETE CASCADE,
  attribution TEXT NOT NULL DEFAULT 'inferred'
    CHECK (attribution IN ('direct', 'assisted', 'inferred', 'unknown')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lead_id, content_id)
);

-- 5. consultation_requests UTM (홈페이지 폼 세션 첫 터치)
ALTER TABLE consultation_requests
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT;

-- 6. 인덱스
CREATE INDEX IF NOT EXISTS idx_inflow_leads_channel_category ON inflow_leads(channel_category);
CREATE INDEX IF NOT EXISTS idx_inflow_leads_campaign ON inflow_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_inflow_leads_paid_date ON inflow_leads(paid_date);
CREATE INDEX IF NOT EXISTS idx_marketing_contents_posted_at ON marketing_contents(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_contents_campaign ON marketing_contents(campaign_id);
CREATE INDEX IF NOT EXISTS idx_lead_content_links_lead ON lead_content_links(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_content_links_content ON lead_content_links(content_id);

-- 7. updated_at 자동 갱신 (inflow_leads/consultation_requests와 공용 함수 재사용)
DROP TRIGGER IF EXISTS update_marketing_campaigns_updated_at ON marketing_campaigns;
CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketing_contents_updated_at ON marketing_contents;
CREATE TRIGGER update_marketing_contents_updated_at
  BEFORE UPDATE ON marketing_contents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. RLS (inflow_leads와 동일: 인증된 관리자만 접근)
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_content_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view marketing campaigns" ON marketing_campaigns;
CREATE POLICY "Authenticated users can view marketing campaigns"
  ON marketing_campaigns FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert marketing campaigns" ON marketing_campaigns;
CREATE POLICY "Authenticated users can insert marketing campaigns"
  ON marketing_campaigns FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update marketing campaigns" ON marketing_campaigns;
CREATE POLICY "Authenticated users can update marketing campaigns"
  ON marketing_campaigns FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can delete marketing campaigns" ON marketing_campaigns;
CREATE POLICY "Authenticated users can delete marketing campaigns"
  ON marketing_campaigns FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view marketing contents" ON marketing_contents;
CREATE POLICY "Authenticated users can view marketing contents"
  ON marketing_contents FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert marketing contents" ON marketing_contents;
CREATE POLICY "Authenticated users can insert marketing contents"
  ON marketing_contents FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update marketing contents" ON marketing_contents;
CREATE POLICY "Authenticated users can update marketing contents"
  ON marketing_contents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can delete marketing contents" ON marketing_contents;
CREATE POLICY "Authenticated users can delete marketing contents"
  ON marketing_contents FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view lead content links" ON lead_content_links;
CREATE POLICY "Authenticated users can view lead content links"
  ON lead_content_links FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert lead content links" ON lead_content_links;
CREATE POLICY "Authenticated users can insert lead content links"
  ON lead_content_links FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update lead content links" ON lead_content_links;
CREATE POLICY "Authenticated users can update lead content links"
  ON lead_content_links FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can delete lead content links" ON lead_content_links;
CREATE POLICY "Authenticated users can delete lead content links"
  ON lead_content_links FOR DELETE TO authenticated USING (true);
