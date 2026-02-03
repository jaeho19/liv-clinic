-- ============================================
-- 008: Popups Table (팝업 관리)
-- ============================================

-- 1. Create popups table
CREATE TABLE IF NOT EXISTS public.popups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT NOT NULL DEFAULT '',
  link_target TEXT NOT NULL DEFAULT '_self',
  display_start TIMESTAMPTZ NOT NULL,
  display_end TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  width INTEGER NOT NULL DEFAULT 480,
  sort_order INTEGER NOT NULL DEFAULT 0,
  show_on_mobile BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;

-- 3. Public read policy (active popups only)
CREATE POLICY "Public can read active popups"
  ON public.popups
  FOR SELECT
  USING (
    is_active = true
    AND display_start <= now()
    AND display_end >= now()
  );

-- 4. Service role full access (for admin API)
CREATE POLICY "Service role has full access to popups"
  ON public.popups
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. Authenticated users can manage popups (admin)
CREATE POLICY "Authenticated users can manage popups"
  ON public.popups
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 6. Create storage bucket for popup images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'popups',
  'popups',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage policies for popup images
CREATE POLICY "Public can view popup images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'popups');

CREATE POLICY "Authenticated users can upload popup images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'popups' AND auth.role() = 'authenticated');

CREATE POLICY "Service role can manage popup images"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'popups' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'popups' AND auth.role() = 'service_role');

CREATE POLICY "Authenticated users can delete popup images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'popups' AND auth.role() = 'authenticated');

-- 8. Index for faster public queries
CREATE INDEX IF NOT EXISTS idx_popups_active_display
  ON public.popups (is_active, display_start, display_end, sort_order)
  WHERE is_active = true;
