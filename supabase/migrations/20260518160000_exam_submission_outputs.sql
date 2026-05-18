BEGIN;

CREATE OR REPLACE FUNCTION public.sync_student_exam_submission_outputs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam public.exams%ROWTYPE;
  v_student public.students%ROWTYPE;
  v_student_name text := 'Etudiant';
  v_professor_profile_id uuid;
  v_professor_entity_id integer;
  v_category text;
  v_exam_type text;
  v_is_gradebook_exam boolean;
  v_total_points numeric;
  v_grade numeric;
  v_evaluation_type text;
  v_now timestamptz := now();
BEGIN
  IF COALESCE(NEW.attempt_status, '') <> 'submitted' THEN
    RETURN NEW;
  END IF;

  SELECT *
  INTO v_exam
  FROM public.exams
  WHERE id = NEW.exam_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  v_professor_profile_id := v_exam.professor_id;
  v_professor_entity_id := v_exam.professor_entity_id;

  IF v_professor_entity_id IS NULL AND v_professor_profile_id IS NOT NULL THEN
    SELECT id
    INTO v_professor_entity_id
    FROM public.professors
    WHERE profile_id = v_professor_profile_id
    LIMIT 1;
  END IF;

  IF NEW.student_entity_id IS NOT NULL THEN
    SELECT *
    INTO v_student
    FROM public.students
    WHERE id = NEW.student_entity_id;
  END IF;

  IF v_student.id IS NULL AND NEW.student_id IS NOT NULL THEN
    SELECT *
    INTO v_student
    FROM public.students
    WHERE profile_id = NEW.student_id
    LIMIT 1;
  END IF;

  SELECT COALESCE(NULLIF(trim(p.full_name), ''), p.email, 'Etudiant')
  INTO v_student_name
  FROM public.profiles p
  WHERE p.id = COALESCE(v_student.profile_id, NEW.student_id)
  LIMIT 1;

  IF v_professor_profile_id IS NOT NULL
    AND (TG_OP = 'INSERT' OR COALESCE(OLD.attempt_status, '') <> 'submitted')
  THEN
    INSERT INTO public.notifications (
      recipient_id,
      recipient_role,
      sender_id,
      title,
      content,
      priority,
      read,
      created_at
    )
    VALUES (
      v_professor_profile_id,
      'professor',
      NEW.student_id,
      LEFT('Copie soumise: ' || COALESCE(v_exam.title, 'Examen'), 100),
      v_student_name || ' a soumis sa copie pour "' || COALESCE(v_exam.title, 'Examen') || '". ' ||
        CASE
          WHEN NEW.grade IS NULL THEN 'La copie attend une correction manuelle.'
          ELSE 'Score automatique: ' || NEW.grade || '/' || COALESCE(v_exam.total_points, 20) || '.'
        END,
      CASE WHEN NEW.grade IS NULL THEN 'high' ELSE 'medium' END,
      false,
      v_now
    );
  END IF;

  v_category := lower(COALESCE(v_exam.category, 'evaluation'));
  v_exam_type := lower(COALESCE(v_exam.exam_type, v_exam.type, ''));
  v_is_gradebook_exam :=
    COALESCE(v_exam.is_practice, false) = false
    AND v_category NOT IN ('training', 'mock_exam', 'practice', 'challenge')
    AND v_exam_type NOT IN ('training', 'mock', 'mock_exam', 'practice', 'exam_blanc', 'quiz_blanc', 'white_exam');

  IF v_is_gradebook_exam
    AND NEW.grade IS NOT NULL
    AND v_student.id IS NOT NULL
    AND v_professor_entity_id IS NOT NULL
    AND v_exam.course_id IS NOT NULL
  THEN
    v_total_points := COALESCE(NULLIF(v_exam.total_points, 0), 20);
    IF v_total_points <= 0 THEN
      v_total_points := 20;
    END IF;

    v_grade := LEAST(GREATEST(COALESCE(NEW.grade, 0), 0), v_total_points);
    v_evaluation_type :=
      CASE
        WHEN v_exam_type = 'final' THEN 'Examen final'
        WHEN v_exam_type = 'midterm' THEN 'Examen partiel'
        ELSE 'Examen'
      END || ' - ' || LEFT(COALESCE(v_exam.title, 'Sans titre'), 80);

    INSERT INTO public.grades (
      student_id,
      course_id,
      professor_id,
      evaluation_type,
      coefficient,
      value,
      max_value,
      comment,
      evaluation_date,
      is_published,
      published_at
    )
    VALUES (
      v_student.id,
      v_exam.course_id,
      v_professor_entity_id,
      v_evaluation_type,
      1,
      v_grade,
      v_total_points,
      COALESCE(NEW.comments, 'Note creee automatiquement apres soumission de copie.'),
      COALESCE(v_exam.exam_date::date, v_exam.date::date, current_date),
      true,
      v_now
    )
    ON CONFLICT (student_id, course_id, evaluation_type, professor_id)
    DO UPDATE SET
      value = EXCLUDED.value,
      max_value = EXCLUDED.max_value,
      comment = EXCLUDED.comment,
      evaluation_date = EXCLUDED.evaluation_date,
      is_published = EXCLUDED.is_published,
      published_at = COALESCE(public.grades.published_at, EXCLUDED.published_at),
      updated_at = v_now;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_student_exam_submission_outputs ON public.student_exams;
CREATE TRIGGER trigger_sync_student_exam_submission_outputs
AFTER INSERT OR UPDATE OF attempt_status, status, grade, comments ON public.student_exams
FOR EACH ROW
EXECUTE FUNCTION public.sync_student_exam_submission_outputs();

COMMIT;
