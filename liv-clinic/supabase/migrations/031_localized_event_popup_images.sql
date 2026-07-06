-- ============================================
-- 031: 이벤트·팝업 이미지 다국어 컬럼 추가
-- (기존 컬럼 = ko/기본값, en/ja/zh 컬럼 추가)
-- ============================================

-- 1. events: 언어별 포스터 이미지 + 상세 갤러리
ALTER TABLE public.events
  ADD COLUMN poster_image_en TEXT,
  ADD COLUMN poster_image_ja TEXT,
  ADD COLUMN poster_image_zh TEXT,
  ADD COLUMN gallery_images_en TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN gallery_images_ja TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN gallery_images_zh TEXT[] NOT NULL DEFAULT '{}';

-- 2. popups: 언어별 팝업 이미지
ALTER TABLE public.popups
  ADD COLUMN image_url_en TEXT,
  ADD COLUMN image_url_ja TEXT,
  ADD COLUMN image_url_zh TEXT;
