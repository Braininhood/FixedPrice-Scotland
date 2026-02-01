-- ================================================================
-- Content blocks – run this in Supabase SQL Editor
-- ================================================================
-- 1. Go to: Supabase Dashboard → Your project → SQL Editor
-- 2. Paste this entire file and click "Run"
-- 3. Refresh Admin → Content in the app
-- ================================================================

CREATE TABLE IF NOT EXISTS content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  title TEXT,
  body TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO content_blocks (key, title, body) VALUES
  ('privacy', 'Privacy Policy', ''),
  ('terms', 'Terms of Service', ''),
  ('about', 'About Us', '')
ON CONFLICT (key) DO NOTHING;
