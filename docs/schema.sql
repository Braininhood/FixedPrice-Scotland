-- Phase 2: Database Schema for FixedPrice Scotland

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Tables

-- Listings Table
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_url TEXT NOT NULL,
  source TEXT NOT NULL, -- 'rightmove', 'zoopla', 'espc', 'agent'
  address TEXT NOT NULL,
  postcode TEXT,
  city TEXT,
  region TEXT,
  price_raw TEXT NOT NULL, -- raw price text from listing
  price_numeric DECIMAL(10,2), -- parsed numeric price
  description TEXT,
  agent_name TEXT,
  agent_url TEXT,
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_checked_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Classifications Table
CREATE TABLE IF NOT EXISTS classifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'explicit', 'likely', 'competitive'
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  classification_reason TEXT,
  ai_model_used TEXT,
  classified_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Postcode Stats Table
CREATE TABLE IF NOT EXISTS postcode_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  postcode TEXT NOT NULL UNIQUE,
  avg_sale_over_asking DECIMAL(5,2), -- percentage
  total_sales INTEGER DEFAULT 0,
  fixed_price_friendliness TEXT, -- 'high', 'medium', 'low'
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sync Logs Table
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success', 'failed', 'partial'
  listings_found INTEGER DEFAULT 0,
  listings_added INTEGER DEFAULT 0,
  listings_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'buyer', -- 'buyer', 'seller', 'agent', 'admin'
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan_type TEXT NOT NULL, -- 'buyer_monthly', 'buyer_yearly', 'agent_verification'
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'gbp',
  status TEXT NOT NULL, -- 'succeeded', 'pending', 'failed', 'refunded'
  payment_method TEXT, -- 'card', 'bank_transfer', etc.
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agents Table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  license_number TEXT,
  website_url TEXT,
  phone TEXT,
  email TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_badge_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Saved Searches Table
CREATE TABLE IF NOT EXISTS user_saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  max_budget DECIMAL(10,2),
  postcode TEXT,
  city TEXT,
  region TEXT,
  confidence_level TEXT, -- 'explicit', 'explicit_and_likely'
  is_active BOOLEAN DEFAULT TRUE,
  last_notified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS idx_listings_postcode ON listings(postcode);
CREATE INDEX IF NOT EXISTS idx_listings_source ON listings(source);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price_numeric);
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(is_active);
CREATE INDEX IF NOT EXISTS idx_classifications_listing_id ON classifications(listing_id);
CREATE INDEX IF NOT EXISTS idx_classifications_status ON classifications(status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE postcode_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_searches ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies

-- Public can read active listings (browsing)
DO $$ BEGIN
  CREATE POLICY "Public listings are viewable by everyone"
    ON listings FOR SELECT
    USING (is_active = TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Public can read classifications
DO $$ BEGIN
  CREATE POLICY "Classifications are viewable by everyone"
    ON classifications FOR SELECT
    USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Users can read their own profile
DO $$ BEGIN
  CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Users can update their own profile
DO $$ BEGIN
  CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Users can view their own subscriptions
DO $$ BEGIN
  CREATE POLICY "Users can view own subscriptions"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Users can view their own payments
DO $$ BEGIN
  CREATE POLICY "Users can view own payments"
    ON payments FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Users can manage their own saved searches
DO $$ BEGIN
  CREATE POLICY "Users can manage own saved searches"
    ON user_saved_searches FOR ALL
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Only admins can manage listings
DO $$ BEGIN
  CREATE POLICY "Admins can manage listings"
    ON listings FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Create Triggers for Auto-Profile Creation

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    'buyer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
