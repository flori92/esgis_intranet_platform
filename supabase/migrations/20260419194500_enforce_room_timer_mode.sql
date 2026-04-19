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

  IF COALESCE(v_student_exam.attempt_status, 'not_started') = 'submitted' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cette copie a déjà été soumise. Vous ne pouvez pas repasser cet examen.');
  END IF;

  IF v_student_exam.exam_status NOT IN ('published', 'in_progress') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cet examen n''est pas disponible.');
  END IF;

  IF v_student_exam.category NOT IN ('training', 'mock_exam') AND v_student_exam.exam_date > v_now THEN
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

  IF COALESCE(v_student_exam.attempt_status, 'not_started') <> 'in_progress' THEN
    UPDATE public.student_exams
    SET attempt_status = 'in_progress',
        arrival_time = COALESCE(arrival_time, v_now),
        start_count = COALESCE(start_count, 0) + 1,
        updated_at = v_now
    WHERE id = p_student_exam_id
      AND COALESCE(attempt_status, 'not_started') <> 'submitted';
  END IF;

  UPDATE public.exams
  SET status = 'in_progress',
      updated_at = v_now
  WHERE id = p_exam_id
    AND status IN ('published', 'in_progress');

  RETURN jsonb_build_object('success', true, 'message', 'Examen démarré.');
END;
$$;

COMMIT;
