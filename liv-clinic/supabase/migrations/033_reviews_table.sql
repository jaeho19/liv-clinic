-- ============================================
-- 033: Patient Reviews Table (시술후기)
-- ============================================
-- User-submitted onsite reviews + admin-managed video reviews.
-- Ships EMPTY (no seed rows). All rows default to unpublished (moderation).
-- Writes go through service-role API routes only; anon/authenticated get
-- read-only access to published rows via RLS.

-- 1. Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locale TEXT NOT NULL
    CHECK (locale IN ('ko','en','ja','zh','zh-TW','vi','th','ru','fr','mn','ar')),
  author_name TEXT NOT NULL CHECK (char_length(author_name) <= 60),
  country TEXT CHECK (country IS NULL OR char_length(country) <= 60),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  treatment_category TEXT NOT NULL CHECK (char_length(treatment_category) <= 60),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 10 AND 2000),
  source TEXT NOT NULL DEFAULT 'onsite' CHECK (source IN ('onsite','video')),
  video_url TEXT CHECK (video_url IS NULL OR char_length(video_url) <= 300),
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3. Public read policy — published rows only (anon + authenticated).
--    No anon/authenticated INSERT/UPDATE/DELETE policies: every write goes
--    through service-role API routes (createAdminClient()), which bypasses RLS.
CREATE POLICY "Public can read published reviews"
  ON public.reviews
  FOR SELECT
  USING (is_published = true);

-- 4. updated_at trigger (reuse pattern from 027)
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_reviews_updated_at();

-- 5. Index for published listing (newest first)
CREATE INDEX IF NOT EXISTS idx_reviews_published_created
  ON public.reviews (is_published, created_at DESC);
