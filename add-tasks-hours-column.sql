-- Ensure hours column exists on tasks table
ALTER TABLE IF EXISTS public.tasks
  ADD COLUMN IF NOT EXISTS hours NUMERIC(4, 2) NOT NULL DEFAULT 0;

-- Optional index if querying by hours (not required)
-- CREATE INDEX IF NOT EXISTS idx_tasks_hours ON public.tasks (hours);
