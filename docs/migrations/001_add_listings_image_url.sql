-- Migration: Add optional image_url to listings for property photos
-- Run this in Supabase SQL Editor if your schema was created before this column existed.

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN listings.image_url IS 'Optional URL to primary/thumbnail property image';
