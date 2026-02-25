-- ── RUN THIS IN SUPABASE SQL EDITOR ──
-- Adds columns needed for check-in and auto-release features

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_start_iso timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;

-- Allow 'checked_in' and 'expired' as valid status values
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Update existing paid bookings to have a booking_start_iso if missing
UPDATE bookings 
SET booking_start_iso = created_at 
WHERE booking_start_iso IS NULL AND payment_status = 'paid';
