-- ============================================
-- 027: Before/After Photos Table (전후사진 관리)
-- ============================================

-- 1. Create before_after table
CREATE TABLE IF NOT EXISTS public.before_after (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title_ko TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  title_ja TEXT NOT NULL DEFAULT '',
  title_zh TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.before_after ENABLE ROW LEVEL SECURITY;

-- 3. Public read policy (visible rows only)
CREATE POLICY "Public can read visible before_after"
  ON public.before_after
  FOR SELECT
  USING (is_visible = true);

-- 4. Service role full access (for admin API)
CREATE POLICY "Service role has full access to before_after"
  ON public.before_after
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. Authenticated users can manage before_after (admin)
CREATE POLICY "Authenticated users can manage before_after"
  ON public.before_after
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 6. updated_at trigger (reuse pattern from 007)
CREATE OR REPLACE FUNCTION update_before_after_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_before_after_updated_at
  BEFORE UPDATE ON public.before_after
  FOR EACH ROW EXECUTE FUNCTION update_before_after_updated_at();

-- 7. Create storage bucket for before/after images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'before-after',
  'before-after',
  true,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage policies
CREATE POLICY "Public can view before_after images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'before-after');

CREATE POLICY "Authenticated users can upload before_after images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'before-after' AND auth.role() = 'authenticated');

CREATE POLICY "Service role can manage before_after images"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'before-after' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'before-after' AND auth.role() = 'service_role');

CREATE POLICY "Authenticated users can delete before_after images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'before-after' AND auth.role() = 'authenticated');

-- 9. Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_before_after_visible
  ON public.before_after (is_visible, sort_order, created_at DESC)
  WHERE is_visible = true;

CREATE INDEX IF NOT EXISTS idx_before_after_category
  ON public.before_after (category);
