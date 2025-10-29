-- Ensure working_hours column exists on profiles table
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS working_hours NUMERIC(5, 2) NOT NULL DEFAULT 40.00;
