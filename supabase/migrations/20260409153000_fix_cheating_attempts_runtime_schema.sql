BEGIN;

ALTER TABLE public.cheating_attempts
  ADD COLUMN IF NOT EXISTS student_exam_id INTEGER REFERENCES public.student_exams(id) ON DELETE SET NULL;

ALTER TABLE public.cheating_attempts
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER;

UPDATE public.cheating_attempts
SET attempt_count = 1
WHERE attempt_count IS NULL;

ALTER TABLE public.cheating_attempts
  ALTER COLUMN attempt_count SET DEFAULT 1;

ALTER TABLE public.cheating_attempts
  ALTER COLUMN attempt_count SET NOT NULL;

ALTER TABLE public.cheating_attempts
  ADD COLUMN IF NOT EXISTS "timestamp" TIMESTAMPTZ;

UPDATE public.cheating_attempts
SET "timestamp" = COALESCE("timestamp", detected_at, created_at, NOW())
WHERE "timestamp" IS NULL;

ALTER TABLE public.cheating_attempts
  ALTER COLUMN "timestamp" SET DEFAULT NOW();

ALTER TABLE public.cheating_attempts
  ALTER COLUMN "timestamp" SET NOT NULL;

COMMIT;
