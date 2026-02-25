-- Reviews table (new)
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

-- Drop policies first to avoid conflicts, then recreate
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- New columns on bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_requested boolean DEFAULT false;

-- Remove enum constraints blocking refund_requested status
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
