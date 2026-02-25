-- ── RUN THIS IN SUPABASE SQL EDITOR ──

-- Waitlist table for landing page signups
CREATE TABLE IF NOT EXISTS waitlist (
  id serial primary key,
  email text unique not null,
  source text default 'landing',
  created_at timestamptz default now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS waitlist_email_idx ON waitlist(email);

-- Allow public inserts (for landing page)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can join waitlist" ON waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admins can read waitlist" ON waitlist FOR SELECT USING (auth.role() = 'authenticated');

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  charger_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  user_name text,
  stars integer CHECK (stars BETWEEN 1 AND 5),
  text text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add email_sent column if not already there
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_requested boolean DEFAULT false;
