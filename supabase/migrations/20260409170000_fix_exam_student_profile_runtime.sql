BEGIN;

CREATE OR REPLACE VIEW public.student_exams_dashboard AS
SELECT
  se.id AS registration_id,
  e.id AS exam_id,
  e.title,
  e.exam_date AS exam_date,
  e.duration,
  e.exam_type AS exam_type,
  e.category AS exam_category,
  e.status AS exam_status,
  e.share_token,
  se.student_id,
  s.profile_id AS student_profile_id,
  se.status AS student_status,
  se.grade,
  se.attendance,
  se.joined_via_link,
  c.name AS course_name,
  c.code AS course_code,
  p.first_name || ' ' || p.last_name AS professor_name
FROM public.student_exams se
JOIN public.exams e ON se.exam_id::text = e.id::text
JOIN public.courses c ON e.course_id::text = c.id::text
JOIN public.students s ON se.student_id = s.profile_id
JOIN public.professors prof ON e.professor_id::text = prof.id::text
JOIN public.profiles p ON prof.profile_id::text = p.id::text;

CREATE OR REPLACE FUNCTION public.verify_exam_access_code(
  p_exam_id INTEGER,
  p_student_exam_id INTEGER,
  p_profile_id UUID,
  p_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_exam RECORD;
  v_settings RECORD;
  v_normalized_code TEXT;
  v_code_hash TEXT;
  v_next_failures INTEGER;
  v_lock_until TIMESTAMPTZ;
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
    se.access_verified_at,
    se.access_verification_failures,
    se.access_locked_until,
    e.access_code_required
  INTO v_student_exam
  FROM public.student_exams se
  JOIN public.exams e ON e.id = se.exam_id
  WHERE se.id = p_student_exam_id
    AND se.exam_id = p_exam_id
    AND se.student_id = p_profile_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Aucune copie active pour cet étudiant.');
  END IF;

  IF COALESCE(v_student_exam.attempt_status, 'not_started') = 'submitted' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cette copie a déjà été soumise.');
  END IF;

  IF v_student_exam.access_locked_until IS NOT NULL AND v_student_exam.access_locked_until > NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'locked', true,
      'message', 'Accès temporairement bloqué après plusieurs erreurs.'
    );
  END IF;

  IF v_student_exam.access_verified_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'verified', true, 'message', 'Code déjà validé.');
  END IF;

  IF NOT COALESCE(v_student_exam.access_code_required, false) THEN
    UPDATE public.student_exams
    SET access_verified_at = NOW(),
        access_verification_failures = 0,
        access_locked_until = NULL,
        updated_at = NOW()
    WHERE id = p_student_exam_id;

    RETURN jsonb_build_object('success', true, 'verified', true, 'message', 'Aucun code requis.');
  END IF;

  SELECT *
  INTO v_settings
  FROM public.exam_access_settings
  WHERE exam_id = p_exam_id;

  IF NOT FOUND OR v_settings.access_code_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Le code d''accès n''est pas configuré pour cette épreuve.');
  END IF;

  v_normalized_code := UPPER(REGEXP_REPLACE(COALESCE(p_code, ''), '[^A-Za-z0-9]', '', 'g'));

  IF LENGTH(v_normalized_code) = 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Veuillez saisir un code d''accès valide.');
  END IF;

  v_code_hash := ENCODE(DIGEST(v_normalized_code, 'sha256'), 'hex');

  IF v_code_hash = v_settings.access_code_hash THEN
    UPDATE public.student_exams
    SET access_verified_at = NOW(),
        access_verification_failures = 0,
        access_locked_until = NULL,
        updated_at = NOW()
    WHERE id = p_student_exam_id;

    RETURN jsonb_build_object('success', true, 'verified', true, 'message', 'Code validé.');
  END IF;

  v_next_failures := COALESCE(v_student_exam.access_verification_failures, 0) + 1;
  v_lock_until := CASE
    WHEN v_next_failures >= COALESCE(v_settings.max_failed_attempts, 5) THEN NOW() + INTERVAL '15 minutes'
    ELSE NULL
  END;

  UPDATE public.student_exams
  SET access_verification_failures = v_next_failures,
      access_locked_until = v_lock_until,
      updated_at = NOW()
  WHERE id = p_student_exam_id;

  RETURN jsonb_build_object(
    'success', false,
    'locked', v_lock_until IS NOT NULL,
    'remaining_attempts', GREATEST(COALESCE(v_settings.max_failed_attempts, 5) - v_next_failures, 0),
    'message', CASE
      WHEN v_lock_until IS NOT NULL THEN 'Trop de tentatives invalides. Accès temporairement bloqué.'
      ELSE 'Code d''accès invalide.'
    END
  );
END;
$$;

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
    e.category,
    e.access_code_required
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

CREATE OR REPLACE FUNCTION public.join_exam_by_token(
  p_share_token UUID,
  p_profile_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_record RECORD;
  v_existing_registration_id INTEGER;
BEGIN
  SELECT *
  INTO v_exam_record
  FROM public.exams
  WHERE share_token = p_share_token;

  IF v_exam_record.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Examen non trouvé');
  END IF;

  IF COALESCE(v_exam_record.allow_direct_join, false) = false THEN
    RETURN jsonb_build_object('success', false, 'message', 'L''inscription par lien est désactivée pour cet examen');
  END IF;

  IF v_exam_record.status NOT IN ('draft', 'published', 'in_progress') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cet examen n''accepte plus de nouvelles inscriptions');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.students
    WHERE profile_id = p_profile_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Vous n''êtes pas enregistré en tant qu''étudiant');
  END IF;

  SELECT id
  INTO v_existing_registration_id
  FROM public.student_exams
  WHERE student_id = p_profile_id
    AND exam_id = v_exam_record.id;

  IF v_existing_registration_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'exam_id', v_exam_record.id,
      'already_registered', true,
      'message', 'Vous êtes déjà inscrit à cet examen'
    );
  END IF;

  INSERT INTO public.student_exams (
    student_id,
    exam_id,
    course_id,
    joined_via_link,
    status
  )
  VALUES (
    p_profile_id,
    v_exam_record.id,
    v_exam_record.course_id,
    true,
    'scheduled'
  );

  RETURN jsonb_build_object(
    'success', true,
    'exam_id', v_exam_record.id,
    'new_registration', true,
    'title', v_exam_record.title,
    'message', 'Vous avez rejoint l''examen avec succès'
  );
END;
$$;

COMMIT;
