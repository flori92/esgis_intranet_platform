BEGIN;

CREATE OR REPLACE FUNCTION public.get_student_exam_questions(
  p_exam_id integer,
  p_profile_id uuid
)
RETURNS TABLE (
  id integer,
  exam_id integer,
  question_number integer,
  question_text text,
  question_type text,
  points numeric,
  options jsonb,
  correct_answer text,
  rubric text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam record;
  v_student_exam record;
  v_category text := 'evaluation';
  v_can_show_correction boolean := false;
  v_has_early_access boolean := false;
  v_now timestamptz := now();
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_profile_id THEN
    RETURN;
  END IF;

  SELECT
    e.id,
    e.status,
    COALESCE(e.category, 'evaluation') AS category,
    e.exam_date,
    e.duration,
    e.settings
  INTO v_exam
  FROM public.exams e
  WHERE e.id = p_exam_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT
    se.id,
    COALESCE(se.attempt_status, 'not_started') AS attempt_status,
    se.status
  INTO v_student_exam
  FROM public.student_exams se
  WHERE se.exam_id = p_exam_id
    AND se.student_id = p_profile_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_category := COALESCE(v_exam.category, 'evaluation');
  v_has_early_access := public.exam_has_early_access(v_exam.settings, p_profile_id);
  v_can_show_correction := v_category = 'training'
    OR (v_category = 'mock_exam' AND v_student_exam.attempt_status = 'submitted');

  IF v_category = 'training' THEN
    IF COALESCE(v_exam.status, '') NOT IN ('published', 'in_progress', 'grading', 'graded', 'completed') THEN
      RETURN;
    END IF;
  ELSIF v_category = 'mock_exam' THEN
    IF COALESCE(v_exam.status, '') NOT IN ('published', 'in_progress', 'grading', 'graded', 'completed') THEN
      RETURN;
    END IF;

    IF v_student_exam.attempt_status NOT IN ('in_progress', 'submitted') THEN
      RETURN;
    END IF;
  ELSE
    IF v_student_exam.attempt_status <> 'in_progress' THEN
      RETURN;
    END IF;

    IF COALESCE(v_exam.status, '') NOT IN ('published', 'in_progress') THEN
      RETURN;
    END IF;

    IF v_exam.exam_date IS NOT NULL AND v_exam.exam_date > v_now AND NOT v_has_early_access THEN
      RETURN;
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    q.id,
    q.exam_id,
    q.question_number,
    q.question_text,
    q.question_type,
    q.points,
    q.options,
    CASE WHEN v_can_show_correction THEN q.correct_answer ELSE NULL END AS correct_answer,
    CASE WHEN v_can_show_correction THEN q.rubric ELSE NULL END AS rubric
  FROM public.exam_questions q
  WHERE q.exam_id = p_exam_id
  ORDER BY q.question_number;
END;
$$;

REVOKE ALL ON FUNCTION public.get_student_exam_questions(integer, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_student_exam_questions(integer, uuid) TO authenticated;

DROP POLICY IF EXISTS exam_questions_student_read ON public.exam_questions;
CREATE POLICY exam_questions_student_read
  ON public.exam_questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.student_exams se
      JOIN public.exams e ON e.id = se.exam_id
      WHERE se.exam_id = exam_questions.exam_id
        AND se.student_id = auth.uid()
        AND (
          (
            COALESCE(e.category, 'evaluation') = 'training'
            AND COALESCE(e.status, '') IN ('published', 'in_progress', 'grading', 'graded', 'completed')
          )
          OR (
            COALESCE(e.category, 'evaluation') = 'mock_exam'
            AND COALESCE(e.status, '') IN ('published', 'in_progress', 'grading', 'graded', 'completed')
            AND COALESCE(se.attempt_status, 'not_started') = 'submitted'
          )
          OR (
            COALESCE(e.category, 'evaluation') NOT IN ('training', 'mock_exam')
            AND COALESCE(se.attempt_status, 'not_started') = 'submitted'
            AND (
              COALESCE(e.status, '') IN ('graded', 'completed')
              OR (
                e.exam_date IS NOT NULL
                AND now() >= e.exam_date + make_interval(mins => GREATEST(COALESCE(e.duration, 0), 0))
              )
            )
          )
        )
    )
  );

UPDATE public.exams
SET settings = COALESCE(settings, '{}'::jsonb) ||
      jsonb_build_object(
        'anti_cheat', true,
        'lock_browser', true,
        'prevent_copy_paste', true
      ),
    max_cheating_alerts = COALESCE(max_cheating_alerts, 3),
    updated_at = now()
WHERE id IN (8, 9, 10);

COMMIT;
