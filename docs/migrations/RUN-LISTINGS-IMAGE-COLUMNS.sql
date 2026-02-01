-- ================================================================
-- Listings image columns – run this in Supabase SQL Editor
-- ================================================================
-- Fixes: "Could not find the 'image_url' column of 'listings' in the schema cache"
-- 1. Go to: Supabase Dashboard → Your project → SQL Editor
-- 2. Paste this entire file and click "Run"
-- 3. (Optional) If needed: Database → Tables → listings → refresh
-- 4. Retry creating/editing a listing with photos
-- ================================================================

-- Primary/thumbnail image URL
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN listings.image_url IS 'Optional URL to primary/thumbnail property image';

-- Additional gallery image URLs (JSON array)
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS extra_image_urls JSONB DEFAULT '[]';

COMMENT ON COLUMN listings.extra_image_urls IS 'Array of additional image URLs for the listing gallery';
