-- ============================================
-- LIV Clinic Admin System - Supabase Migration
-- Supabase Dashboard > SQL Editor에서 실행하세요
-- ============================================

-- 1. Events 테이블
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_ko TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  title_ja TEXT NOT NULL DEFAULT '',
  title_zh TEXT NOT NULL DEFAULT '',
  description_ko TEXT NOT NULL,
  description_en TEXT NOT NULL DEFAULT '',
  description_ja TEXT NOT NULL DEFAULT '',
  description_zh TEXT NOT NULL DEFAULT '',
  poster_image TEXT,
  thumbnail_image TEXT,
  gallery_images TEXT[] DEFAULT '{}',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  category TEXT NOT NULL DEFAULT 'all',
  featured BOOLEAN DEFAULT false,
  related_treatments TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(is_published);

-- 2. Popups 테이블
CREATE TABLE IF NOT EXISTS popups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT DEFAULT '',
  link_target TEXT DEFAULT '_self',
  display_start TIMESTAMPTZ NOT NULL,
  display_end TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  width INTEGER DEFAULT 480,
  sort_order INTEGER DEFAULT 0,
  show_on_mobile BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. consultation_requests 테이블 업데이트 (기존 컬럼이 없는 경우에만 추가)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultation_requests' AND column_name = 'notes') THEN
    ALTER TABLE consultation_requests ADD COLUMN notes TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultation_requests' AND column_name = 'contacted_at') THEN
    ALTER TABLE consultation_requests ADD COLUMN contacted_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultation_requests' AND column_name = 'source') THEN
    ALTER TABLE consultation_requests ADD COLUMN source TEXT DEFAULT 'website';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultation_requests' AND column_name = 'updated_at') THEN
    ALTER TABLE consultation_requests ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 4. RLS 정책 설정

-- Events RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published events" ON events;
CREATE POLICY "Public can read published events"
  ON events FOR SELECT TO anon, authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage events" ON events;
CREATE POLICY "Admins can manage events"
  ON events FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Popups RLS
ALTER TABLE popups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active popups" ON popups;
CREATE POLICY "Public can read active popups"
  ON popups FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND display_start <= NOW()
    AND display_end >= NOW()
  );

DROP POLICY IF EXISTS "Admins can manage popups" ON popups;
CREATE POLICY "Admins can manage popups"
  ON popups FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Consultation requests 추가 정책
DROP POLICY IF EXISTS "Admins can update consultations" ON consultation_requests;
CREATE POLICY "Admins can update consultations"
  ON consultation_requests FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete consultations" ON consultation_requests;
CREATE POLICY "Admins can delete consultations"
  ON consultation_requests FOR DELETE TO authenticated
  USING (true);

-- 5. Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public) VALUES ('events', 'events', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('popups', 'popups', true) ON CONFLICT (id) DO NOTHING;

-- Storage 정책: events 버킷
DROP POLICY IF EXISTS "Public read events" ON storage.objects;
CREATE POLICY "Public read events" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'events');

DROP POLICY IF EXISTS "Authenticated upload events" ON storage.objects;
CREATE POLICY "Authenticated upload events" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'events');

DROP POLICY IF EXISTS "Authenticated update events" ON storage.objects;
CREATE POLICY "Authenticated update events" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'events');

DROP POLICY IF EXISTS "Authenticated delete events" ON storage.objects;
CREATE POLICY "Authenticated delete events" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'events');

-- Storage 정책: popups 버킷
DROP POLICY IF EXISTS "Public read popups" ON storage.objects;
CREATE POLICY "Public read popups" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'popups');

DROP POLICY IF EXISTS "Authenticated upload popups" ON storage.objects;
CREATE POLICY "Authenticated upload popups" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'popups');

DROP POLICY IF EXISTS "Authenticated update popups" ON storage.objects;
CREATE POLICY "Authenticated update popups" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'popups');

DROP POLICY IF EXISTS "Authenticated delete popups" ON storage.objects;
CREATE POLICY "Authenticated delete popups" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'popups');

-- ============================================
-- 완료! Supabase Dashboard > Authentication에서
-- 관리자 계정을 생성하세요 (이메일/비밀번호)
-- ============================================
