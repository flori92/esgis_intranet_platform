BEGIN;

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

  IF NOT v_is_retakable AND v_student_exam.exam_date > v_now THEN
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
    AND status IN ('published', 'in_progress', 'grading', 'graded', 'completed');

  RETURN jsonb_build_object(
    'success', true,
    'message', CASE WHEN v_is_retake THEN 'Nouvelle tentative démarrée.' ELSE 'Examen démarré.' END,
    'retake', v_is_retake
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_exam_attempt(INTEGER, INTEGER, UUID) TO authenticated;

COMMIT;
