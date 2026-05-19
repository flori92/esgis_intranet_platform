-- Restore the professor entity link expected by exam grading/submission flows.
-- Some deployed databases have exams.professor_id aligned to profiles(id) but
-- are missing the companion integer professor_entity_id column.

BEGIN;

ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS professor_entity_id integer;

UPDATE public.exams e
SET professor_entity_id = p.id
FROM public.professors p
WHERE p.profile_id = e.professor_id
  AND e.professor_entity_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'exams_professor_entity_id_fkey'
      AND conrelid = 'public.exams'::regclass
  ) THEN
    ALTER TABLE public.exams
      ADD CONSTRAINT exams_professor_entity_id_fkey
      FOREIGN KEY (professor_entity_id)
      REFERENCES public.professors(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_exams_professor_entity_id
  ON public.exams(professor_entity_id);

COMMIT;
