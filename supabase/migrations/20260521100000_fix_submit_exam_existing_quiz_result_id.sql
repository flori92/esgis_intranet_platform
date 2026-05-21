BEGIN;

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
  v_score numeric := COALESCE(p_score, 0);
  v_status text;
  v_existing_quiz_result_id public.quiz_results.id%TYPE;
  v_remaining_active_count integer;
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
    e.category AS exam_category
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

  IF COALESCE(v_remaining_active_count, 0) = 0
    AND COALESCE(v_student_exam.exam_category, 'evaluation') NOT IN ('training', 'mock_exam') THEN
    UPDATE public.exams
    SET status = 'completed',
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

COMMIT;
