BEGIN;

CREATE OR REPLACE FUNCTION public.score_exam_attempt(
  p_exam_id integer,
  p_answers jsonb
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_score numeric := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE
      WHEN q.question_type IN ('multiple_choice', 'qcm_single')
        AND btrim(COALESCE(p_answers ->> q.id::text, '')) = btrim(COALESCE(q.correct_answer, ''))
        THEN COALESCE(q.points, 0)
      WHEN q.question_type IN ('true_false', 'short_answer')
        AND lower(btrim(COALESCE(p_answers ->> q.id::text, ''))) = lower(btrim(COALESCE(q.correct_answer, '')))
        THEN COALESCE(q.points, 0)
      ELSE 0
    END
  ), 0)
  INTO v_score
  FROM public.exam_questions q
  WHERE q.exam_id = p_exam_id;

  RETURN COALESCE(v_score, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.score_exam_attempt(integer, jsonb) FROM PUBLIC;

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
  v_is_retakable boolean := false;
  v_now timestamptz := now();
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_profile_id THEN
    RETURN;
  END IF;

  SELECT
    e.id,
    e.status,
    e.category,
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
    se.attempt_status,
    se.status
  INTO v_student_exam
  FROM public.student_exams se
  WHERE se.exam_id = p_exam_id
    AND se.student_id = p_profile_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_is_retakable := COALESCE(v_exam.category, 'evaluation') IN ('training', 'mock_exam');

  IF v_is_retakable THEN
    IF COALESCE(v_exam.status, '') NOT IN ('published', 'in_progress', 'grading', 'graded', 'completed') THEN
      RETURN;
    END IF;
  ELSE
    IF COALESCE(v_student_exam.attempt_status, 'not_started') <> 'in_progress' THEN
      RETURN;
    END IF;

    IF COALESCE(v_exam.status, '') NOT IN ('published', 'in_progress') THEN
      RETURN;
    END IF;

    IF v_exam.exam_date IS NOT NULL AND v_exam.exam_date > v_now THEN
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
    CASE WHEN v_is_retakable THEN q.correct_answer ELSE NULL END AS correct_answer,
    CASE WHEN v_is_retakable THEN q.rubric ELSE NULL END AS rubric
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
            COALESCE(e.category, 'evaluation') IN ('training', 'mock_exam')
            AND COALESCE(e.status, '') IN ('published', 'in_progress', 'grading', 'graded', 'completed')
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

CREATE OR REPLACE FUNCTION public.submit_student_exam_attempt(
  p_exam_id integer,
  p_student_exam_id integer,
  p_profile_id uuid,
  p_answers jsonb,
  p_score numeric,
  p_total_questions integer,
  p_completion_time integer,
  p_cheating_attempts integer,
  p_has_manual_questions boolean,
  p_passing_grade numeric,
  p_submission_reason text DEFAULT 'manual'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_student_exam record;
  v_client_score numeric := COALESCE(p_score, 0);
  v_score numeric := 0;
  v_status text;
  v_existing_quiz_result_id public.quiz_results.id%TYPE;
  v_remaining_active_count integer;
  v_pending_submission_count integer;
  v_room_end timestamptz;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_profile_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Profil étudiant invalide.');
  END IF;

  SELECT
    se.id,
    se.student_id,
    se.exam_id,
    se.attempt_status,
    se.status,
    se.answers,
    e.status AS exam_status,
    e.category AS exam_category,
    e.exam_date,
    e.duration,
    e.settings
  INTO v_student_exam
  FROM public.student_exams se
  JOIN public.exams e ON e.id = se.exam_id
  WHERE se.id = p_student_exam_id
    AND se.exam_id = p_exam_id
    AND se.student_id = p_profile_id
  FOR UPDATE OF se;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Copie introuvable pour cet étudiant.');
  END IF;

  IF COALESCE(v_student_exam.attempt_status, 'not_started') = 'submitted' THEN
    RETURN jsonb_build_object('success', true, 'already_submitted', true, 'message', 'Copie déjà soumise.');
  END IF;

  v_score := CASE
    WHEN COALESCE(p_has_manual_questions, false) THEN v_client_score
    ELSE public.score_exam_attempt(p_exam_id, COALESCE(p_answers, '{}'::jsonb))
  END;

  v_status := CASE
    WHEN COALESCE(p_has_manual_questions, false) THEN 'pending'
    WHEN v_score >= COALESCE(p_passing_grade, 0) THEN 'passed'
    ELSE 'failed'
  END;

  SELECT id
  INTO v_existing_quiz_result_id
  FROM public.quiz_results
  WHERE student_id = p_profile_id
    AND exam_id = p_exam_id
  ORDER BY updated_at DESC NULLS LAST, id DESC
  LIMIT 1;

  IF v_existing_quiz_result_id IS NULL THEN
    INSERT INTO public.quiz_results (
      student_id,
      exam_id,
      score,
      total_questions,
      completion_time,
      answers,
      cheating_attempts,
      completed_at,
      updated_at
    )
    VALUES (
      p_profile_id,
      p_exam_id,
      v_score,
      COALESCE(p_total_questions, 0),
      COALESCE(p_completion_time, 0),
      COALESCE(p_answers, '{}'::jsonb),
      COALESCE(p_cheating_attempts, 0),
      v_now,
      v_now
    );
  ELSE
    UPDATE public.quiz_results
    SET score = v_score,
        total_questions = COALESCE(p_total_questions, total_questions),
        completion_time = COALESCE(p_completion_time, completion_time),
        answers = COALESCE(p_answers, answers, '{}'::jsonb),
        cheating_attempts = COALESCE(p_cheating_attempts, cheating_attempts, 0),
        completed_at = v_now,
        updated_at = v_now
    WHERE id = v_existing_quiz_result_id;
  END IF;

  UPDATE public.student_exams
  SET attempt_status = 'submitted',
      status = v_status,
      answers = COALESCE(p_answers, answers, '{}'::jsonb),
      departure_time = v_now,
      grade = CASE WHEN COALESCE(p_has_manual_questions, false) THEN NULL ELSE v_score END,
      submission_reason = COALESCE(NULLIF(p_submission_reason, ''), 'manual'),
      updated_at = v_now
  WHERE id = p_student_exam_id;

  UPDATE public.active_students
  SET is_completed = true,
      last_ping = v_now,
      updated_at = v_now
  WHERE student_id = p_profile_id
    AND exam_id = p_exam_id;

  SELECT count(*)
  INTO v_remaining_active_count
  FROM public.active_students
  WHERE exam_id = p_exam_id
    AND COALESCE(is_completed, false) = false;

  SELECT count(*)
  INTO v_pending_submission_count
  FROM public.student_exams
  WHERE exam_id = p_exam_id
    AND COALESCE(attempt_status, 'not_started') <> 'submitted'
    AND COALESCE(status, 'pending') <> 'absent';

  v_room_end := CASE
    WHEN v_student_exam.exam_date IS NULL THEN NULL
    ELSE v_student_exam.exam_date + make_interval(mins => GREATEST(COALESCE(v_student_exam.duration, 0), 0))
  END;

  IF COALESCE(v_student_exam.exam_category, 'evaluation') NOT IN ('training', 'mock_exam') THEN
    UPDATE public.exams
    SET status = CASE
          WHEN COALESCE(v_pending_submission_count, 0) = 0
            OR (COALESCE(v_remaining_active_count, 0) = 0 AND v_room_end IS NOT NULL AND v_room_end <= v_now)
            THEN 'completed'
          ELSE 'in_progress'
        END,
        updated_at = v_now
    WHERE id = p_exam_id
      AND status IN ('published', 'in_progress', 'completed');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'student_exam_id', p_student_exam_id,
    'status', v_status,
    'score', v_score
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_student_exam_attempt(
  integer,
  integer,
  uuid,
  jsonb,
  numeric,
  integer,
  integer,
  integer,
  boolean,
  numeric,
  text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_student_exam_attempt(
  integer,
  integer,
  uuid,
  jsonb,
  numeric,
  integer,
  integer,
  integer,
  boolean,
  numeric,
  text
) TO authenticated;

UPDATE public.exams
SET status = CASE
      WHEN status IN ('draft', 'published') THEN 'published'
      ELSE status
    END,
    exam_date = timestamptz '2026-05-29 18:30:00+00',
    duration = 90,
    total_points = 40,
    passing_grade = 24,
    room = COALESCE(NULLIF(room, ''), 'En ligne'),
    access_code_required = false,
    allow_direct_join = false,
    settings = COALESCE(settings, '{}'::jsonb) ||
      jsonb_build_object(
        'anti_cheat', true,
        'lock_browser', true,
        'prevent_copy_paste', true,
        'timer_mode', 'room',
        'randomize_questions', true,
        'randomize_questions_per_student', true,
        'randomize_options', true,
        'randomize_options_per_student', true,
        'randomization_scope', 'per_student',
        'server_side_grading', true
      ),
    updated_at = now()
WHERE id = 10;

INSERT INTO public.student_exams (
  exam_id,
  student_id,
  student_entity_id,
  course_id,
  status,
  attempt_status,
  attendance,
  answers,
  created_at,
  updated_at
)
SELECT DISTINCT
  10,
  s.profile_id,
  s.id,
  9,
  'pending',
  'not_started',
  'pending',
  '{}'::jsonb,
  now(),
  now()
FROM public.student_courses sc
JOIN public.students s
  ON s.id = sc.student_entity_id
  OR s.profile_id = sc.student_id
WHERE sc.course_id = 9
  AND sc.status = 'enrolled'
  AND s.status = 'active'
  AND s.profile_id IS NOT NULL
ON CONFLICT (exam_id, student_id)
DO UPDATE SET
  student_entity_id = EXCLUDED.student_entity_id,
  course_id = EXCLUDED.course_id,
  attendance = COALESCE(student_exams.attendance, EXCLUDED.attendance),
  answers = COALESCE(student_exams.answers, '{}'::jsonb),
  updated_at = now()
WHERE COALESCE(student_exams.attempt_status, 'not_started') <> 'submitted';

COMMIT;
