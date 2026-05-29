ALTER TABLE public.active_students
  ADD COLUMN IF NOT EXISTS cheating_attempts integer NOT NULL DEFAULT 0;
