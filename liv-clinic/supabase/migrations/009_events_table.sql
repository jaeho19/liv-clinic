-- ============================================
-- 009: Events Table (이벤트 관리)
-- ============================================

-- 1. Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title_ko TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  title_ja TEXT NOT NULL DEFAULT '',
  title_zh TEXT NOT NULL DEFAULT '',
  description_ko TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  description_ja TEXT NOT NULL DEFAULT '',
  description_zh TEXT NOT NULL DEFAULT '',
  poster_image TEXT,
  thumbnail_image TEXT,
  gallery_images TEXT[] NOT NULL DEFAULT '{}',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  category TEXT NOT NULL DEFAULT 'all',
  featured BOOLEAN NOT NULL DEFAULT false,
  related_treatments TEXT[] NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 3. Public read policy (published events only)
CREATE POLICY "Public can read published events"
  ON public.events
  FOR SELECT
  USING (is_published = true);

-- 4. Service role full access (for admin API)
CREATE POLICY "Service role has full access to events"
  ON public.events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. Authenticated users can manage events (admin)
CREATE POLICY "Authenticated users can manage events"
  ON public.events
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 6. Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'events',
  'events',
  true,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage policies for event images
CREATE POLICY "Public can view event images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'events');

CREATE POLICY "Authenticated users can upload event images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'events' AND auth.role() = 'authenticated');

CREATE POLICY "Service role can manage event images"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'events' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'events' AND auth.role() = 'service_role');

CREATE POLICY "Authenticated users can delete event images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'events' AND auth.role() = 'authenticated');

-- 8. Index for faster public queries
CREATE INDEX IF NOT EXISTS idx_events_published
  ON public.events (is_published, sort_order, start_date DESC)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_events_slug
  ON public.events (slug);
