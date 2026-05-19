-- Finalize student exam submissions through a SECURITY DEFINER RPC.
-- Students can write quiz_results through RLS, but direct updates to
-- student_exams are staff-scoped. This function validates ownership and
-- performs the final submission server-side.

BEGIN;

ALTER TABLE public.student_exams
  ADD COLUMN IF NOT EXISTS student_entity_id integer;

UPDATE public.student_exams se
SET student_entity_id = s.id
FROM public.students s
WHERE s.profile_id = se.student_id
  AND se.student_entity_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'student_exams_student_entity_id_fkey'
      AND conrelid = 'public.student_exams'::regclass
  ) THEN
    ALTER TABLE public.student_exams
      ADD CONSTRAINT student_exams_student_entity_id_fkey
      FOREIGN KEY (student_entity_id)
      REFERENCES public.students(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_student_exams_student_entity_id
  ON public.student_exams(student_entity_id);

ALTER TABLE public.quiz_results
  ALTER COLUMN score TYPE numeric(6,2)
  USING score::numeric(6,2);

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
  v_existing_quiz_result_id integer;
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
    e.status AS exam_status
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
        completed_at = COALESCE(completed_at, v_now),
        updated_at = v_now
    WHERE id = v_existing_quiz_result_id;
  END IF;

  UPDATE public.student_exams
  SET attempt_status = 'submitted',
      status = v_status,
      answers = COALESCE(p_answers, answers, '{}'::jsonb),
      departure_time = COALESCE(departure_time, v_now),
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

  IF COALESCE(v_remaining_active_count, 0) = 0 THEN
    UPDATE public.exams
    SET status = 'grading',
        updated_at = v_now
    WHERE id = p_exam_id
      AND status IN ('published', 'in_progress', 'grading');
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

-- Repair copies where the old client flow wrote quiz_results but failed to
-- update student_exams because of RLS.
WITH latest_quiz_results AS (
  SELECT DISTINCT ON (qr.student_id, qr.exam_id)
    qr.student_id,
    qr.exam_id,
    qr.score,
    qr.answers,
    qr.completed_at,
    qr.updated_at,
    e.passing_grade
  FROM public.quiz_results qr
  JOIN public.exams e ON e.id = qr.exam_id
  ORDER BY qr.student_id, qr.exam_id, qr.updated_at DESC NULLS LAST, qr.id DESC
)
UPDATE public.student_exams se
SET attempt_status = 'submitted',
    status = CASE
      WHEN latest.score >= COALESCE(latest.passing_grade, 0) THEN 'passed'
      ELSE 'failed'
    END,
    answers = COALESCE(se.answers, latest.answers, '{}'::jsonb),
    departure_time = COALESCE(se.departure_time, latest.completed_at, latest.updated_at, now()),
    grade = latest.score,
    submission_reason = COALESCE(se.submission_reason, 'manual'),
    updated_at = now()
FROM latest_quiz_results latest
WHERE se.student_id = latest.student_id
  AND se.exam_id = latest.exam_id
  AND COALESCE(se.attempt_status, 'not_started') <> 'submitted';

COMMIT;
