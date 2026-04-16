BEGIN;

WITH ranked_results AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY student_id, exam_id
      ORDER BY COALESCE(updated_at, completed_at, created_at, NOW()) DESC, id DESC
    ) AS row_number
  FROM public.quiz_results
  WHERE student_id IS NOT NULL
    AND exam_id IS NOT NULL
),
duplicate_results AS (
  SELECT id
  FROM ranked_results
  WHERE row_number > 1
)
DELETE FROM public.quiz_results
WHERE id IN (SELECT id FROM duplicate_results);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quiz_results_student_id_exam_id_key'
      AND conrelid = 'public.quiz_results'::regclass
  ) THEN
    ALTER TABLE public.quiz_results
      ADD CONSTRAINT quiz_results_student_id_exam_id_key
      UNIQUE (student_id, exam_id);
  END IF;
END $$;

COMMIT;
