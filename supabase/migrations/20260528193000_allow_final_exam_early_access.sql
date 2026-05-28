BEGIN;

CREATE OR REPLACE FUNCTION public.exam_has_early_access(
  p_settings jsonb,
  p_profile_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    p_profile_id IS NOT NULL
    AND jsonb_typeof(COALESCE(p_settings, '{}'::jsonb) -> 'early_access_profile_ids') = 'array'
    AND (COALESCE(p_settings, '{}'::jsonb) -> 'early_access_profile_ids') ? p_profile_id::text,
    false
  );
$$;

REVOKE ALL ON FUNCTION public.exam_has_early_access(jsonb, uuid) FROM PUBLIC;

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
  v_has_early_access boolean := false;
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
  v_has_early_access := public.exam_has_early_access(v_exam.settings, p_profile_id);

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
    CASE WHEN v_is_retakable THEN q.correct_answer ELSE NULL END AS correct_answer,
    CASE WHEN v_is_retakable THEN q.rubric ELSE NULL END AS rubric
  FROM public.exam_questions q
  WHERE q.exam_id = p_exam_id
  ORDER BY q.question_number;
END;
$$;

REVOKE ALL ON FUNCTION public.get_student_exam_questions(integer, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_student_exam_questions(integer, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.start_exam_attempt(
  p_exam_id INTEGER,
  p_student_exam_id INTEGER,
  p_profile_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_exam RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_attempt_status TEXT;
  v_is_retakable BOOLEAN := FALSE;
  v_is_retake BOOLEAN := FALSE;
  v_has_early_access BOOLEAN := FALSE;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.students
    WHERE profile_id = p_profile_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Compte étudiant introuvable.');
  END IF;

  SELECT
    se.id,
    se.attempt_status,
    se.arrival_time,
    se.access_verified_at,
    se.access_locked_until,
    se.start_count,
    e.status AS exam_status,
    e.exam_date,
    e.duration,
    e.category,
    e.access_code_required,
    e.settings
  INTO v_student_exam
  FROM public.student_exams se
  JOIN public.exams e ON e.id = se.exam_id
  WHERE se.id = p_student_exam_id
    AND se.exam_id = p_exam_id
    AND se.student_id = p_profile_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Inscription à l''examen introuvable.');
  END IF;

  v_attempt_status := COALESCE(v_student_exam.attempt_status, 'not_started');
  v_is_retakable := COALESCE(v_student_exam.category, 'evaluation') IN ('training', 'mock_exam');
  v_has_early_access := public.exam_has_early_access(v_student_exam.settings, p_profile_id);

  IF v_attempt_status = 'submitted' AND NOT v_is_retakable THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cette copie a déjà été soumise. Vous ne pouvez pas repasser cet examen.');
  END IF;

  IF v_attempt_status = 'submitted' AND v_is_retakable THEN
    v_is_retake := TRUE;
  END IF;

  IF NOT (
    (v_is_retakable AND v_student_exam.exam_status IN ('published', 'in_progress', 'grading', 'graded', 'completed'))
    OR (NOT v_is_retakable AND v_student_exam.exam_status IN ('published', 'in_progress'))
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cet examen n''est pas disponible.');
  END IF;

  IF NOT v_is_retakable AND v_student_exam.exam_date > v_now AND NOT v_has_early_access THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cet examen n''est pas encore disponible.');
  END IF;

  IF COALESCE(v_student_exam.settings->>'timer_mode', 'individual') = 'room'
    AND v_student_exam.exam_date IS NOT NULL
    AND (v_student_exam.exam_date + make_interval(mins => GREATEST(COALESCE(v_student_exam.duration, 0), 0))) <= v_now THEN
    RETURN jsonb_build_object('success', false, 'message', 'Le temps de composition est écoulé pour cette salle.');
  END IF;

  IF v_student_exam.access_locked_until IS NOT NULL AND v_student_exam.access_locked_until > v_now THEN
    RETURN jsonb_build_object('success', false, 'message', 'Accès temporairement bloqué après plusieurs codes invalides.');
  END IF;

  IF COALESCE(v_student_exam.access_code_required, false) AND v_student_exam.access_verified_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Validation du code d''accès requise avant le démarrage.');
  END IF;

  IF v_is_retake THEN
    v_attempt_status := 'not_started';

    UPDATE public.student_exams
    SET attempt_status = 'not_started',
        status = 'pending',
        grade = NULL,
        comments = NULL,
        answers = '{}'::jsonb,
        arrival_time = NULL,
        departure_time = NULL,
        submission_reason = NULL,
        access_verification_failures = 0,
        access_locked_until = NULL,
        updated_at = v_now
    WHERE id = p_student_exam_id;
  END IF;

  IF v_attempt_status <> 'in_progress' THEN
    UPDATE public.student_exams
    SET attempt_status = 'in_progress',
        arrival_time = v_now,
        answers = CASE WHEN v_is_retake THEN '{}'::jsonb ELSE COALESCE(answers, '{}'::jsonb) END,
        start_count = COALESCE(start_count, 0) + 1,
        updated_at = v_now
    WHERE id = p_student_exam_id;
  END IF;

  INSERT INTO public.active_students (
    student_id,
    exam_id,
    start_time,
    last_ping,
    is_completed,
    created_at,
    updated_at
  )
  VALUES (
    p_profile_id,
    p_exam_id,
    v_now,
    v_now,
    false,
    v_now,
    v_now
  )
  ON CONFLICT (student_id, exam_id)
  DO UPDATE SET
    start_time = EXCLUDED.start_time,
    last_ping = EXCLUDED.last_ping,
    is_completed = false,
    updated_at = v_now;

  UPDATE public.exams
  SET status = 'in_progress',
      updated_at = v_now
  WHERE id = p_exam_id
    AND status IN ('published', 'in_progress', 'grading', 'graded', 'completed')
    AND (
      v_is_retakable
      OR v_student_exam.exam_date IS NULL
      OR v_student_exam.exam_date <= v_now
    );

  RETURN jsonb_build_object(
    'success', true,
    'message', CASE WHEN v_is_retake THEN 'Nouvelle tentative démarrée.' ELSE 'Examen démarré.' END,
    'retake', v_is_retake,
    'early_access', v_has_early_access AND NOT v_is_retakable AND v_student_exam.exam_date > v_now
  );
END;
$$;

REVOKE ALL ON FUNCTION public.start_exam_attempt(INTEGER, INTEGER, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_exam_attempt(INTEGER, INTEGER, UUID) TO authenticated;

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

  IF COALESCE(v_student_exam.exam_category, 'evaluation') NOT IN ('training', 'mock_exam')
    AND (v_student_exam.exam_date IS NULL OR v_student_exam.exam_date <= v_now) THEN
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
SET settings = jsonb_set(
      COALESCE(settings, '{}'::jsonb),
      '{early_access_profile_ids}',
      (
        SELECT jsonb_agg(DISTINCT allowed_profile_id)
        FROM (
          SELECT value AS allowed_profile_id
          FROM jsonb_array_elements_text(
            CASE
              WHEN jsonb_typeof(COALESCE(settings, '{}'::jsonb) -> 'early_access_profile_ids') = 'array'
                THEN COALESCE(settings, '{}'::jsonb) -> 'early_access_profile_ids'
              ELSE '[]'::jsonb
            END
          )
          UNION
          SELECT '2d24512c-13e4-48a6-b51d-35362ef53123'
        ) allowed
      ),
      true
    ),
    updated_at = now()
WHERE id = 10;

COMMIT;
