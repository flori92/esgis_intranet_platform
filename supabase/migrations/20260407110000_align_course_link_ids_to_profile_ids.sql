-- Align professor_courses and student_courses with profile UUIDs.
-- This matches the application runtime model:
-- - professor_courses.professor_id = profiles.id
-- - student_courses.student_id = profiles.id
-- - student_courses.student_entity_id keeps the student entity integer

DROP POLICY IF EXISTS professor_courses_select_policy ON public.professor_courses;
DROP POLICY IF EXISTS professor_courses_insert_update_delete_policy ON public.professor_courses;
DROP POLICY IF EXISTS admin_all_professor_courses ON public.professor_courses;
DROP POLICY IF EXISTS professor_read_own_courses ON public.professor_courses;
DROP POLICY IF EXISTS student_courses_select_policy ON public.student_courses;
DROP POLICY IF EXISTS student_courses_insert_update_delete_policy ON public.student_courses;
DROP POLICY IF EXISTS admin_all_student_courses ON public.student_courses;
DROP POLICY IF EXISTS professor_read_student_courses ON public.student_courses;
DROP POLICY IF EXISTS student_read_own_courses ON public.student_courses;
DROP POLICY IF EXISTS documents_select_policy ON public.documents;
DROP POLICY IF EXISTS exam_results_select_policy ON public.exam_results;
DROP POLICY IF EXISTS professor_read_assigned_exams ON public.exams;
DROP POLICY IF EXISTS professor_read_update_student_exams ON public.student_exams;
DROP POLICY IF EXISTS professor_update_student_exams ON public.student_exams;
DROP POLICY IF EXISTS professor_manage_assigned_grades_v2 ON public.grades;

BEGIN;

DO $$
DECLARE
  professor_id_type text;
  student_id_type text;
  unmapped_count integer;
BEGIN
  SELECT data_type
  INTO professor_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'professor_courses'
    AND column_name = 'professor_id';

  IF professor_id_type = 'integer' THEN
    ALTER TABLE public.professor_courses
      DROP CONSTRAINT IF EXISTS professor_courses_professor_id_fkey,
      DROP CONSTRAINT IF EXISTS professor_courses_professor_id_course_id_academic_year_key;

    ALTER TABLE public.professor_courses
      ADD COLUMN IF NOT EXISTS professor_profile_id uuid;

    UPDATE public.professor_courses pc
    SET professor_profile_id = pr.profile_id
    FROM public.professors pr
    WHERE pr.id = pc.professor_id
      AND pc.professor_profile_id IS NULL;

    SELECT count(*)
    INTO unmapped_count
    FROM public.professor_courses
    WHERE professor_profile_id IS NULL;

    IF unmapped_count > 0 THEN
      RAISE EXCEPTION 'Cannot align professor_courses.professor_id to profile UUIDs: % rows are unmapped', unmapped_count;
    END IF;

    ALTER TABLE public.professor_courses DROP COLUMN professor_id;
    ALTER TABLE public.professor_courses RENAME COLUMN professor_profile_id TO professor_id;

    ALTER TABLE public.professor_courses
      ALTER COLUMN professor_id SET NOT NULL;

    ALTER TABLE public.professor_courses
      ADD CONSTRAINT professor_courses_professor_id_fkey
        FOREIGN KEY (professor_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
      ADD CONSTRAINT professor_courses_professor_id_course_id_academic_year_key
        UNIQUE (professor_id, course_id, academic_year);
  END IF;

  SELECT data_type
  INTO student_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'student_courses'
    AND column_name = 'student_id';

  IF student_id_type = 'integer' THEN
    ALTER TABLE public.student_courses
      DROP CONSTRAINT IF EXISTS student_courses_student_id_fkey,
      DROP CONSTRAINT IF EXISTS student_courses_student_id_course_id_academic_year_key;

    ALTER TABLE public.student_courses
      ADD COLUMN IF NOT EXISTS student_entity_id integer;

    UPDATE public.student_courses
    SET student_entity_id = student_id
    WHERE student_entity_id IS NULL;

    ALTER TABLE public.student_courses
      DROP CONSTRAINT IF EXISTS student_courses_student_entity_id_fkey;

    ALTER TABLE public.student_courses
      ADD CONSTRAINT student_courses_student_entity_id_fkey
        FOREIGN KEY (student_entity_id) REFERENCES public.students(id) ON DELETE CASCADE;

    ALTER TABLE public.student_courses
      ADD COLUMN IF NOT EXISTS student_profile_id uuid;

    UPDATE public.student_courses sc
    SET student_profile_id = s.profile_id
    FROM public.students s
    WHERE s.id = sc.student_id
      AND sc.student_profile_id IS NULL;

    SELECT count(*)
    INTO unmapped_count
    FROM public.student_courses
    WHERE student_profile_id IS NULL;

    IF unmapped_count > 0 THEN
      RAISE EXCEPTION 'Cannot align student_courses.student_id to profile UUIDs: % rows are unmapped', unmapped_count;
    END IF;

    ALTER TABLE public.student_courses DROP COLUMN student_id;
    ALTER TABLE public.student_courses RENAME COLUMN student_profile_id TO student_id;

    ALTER TABLE public.student_courses
      ALTER COLUMN student_id SET NOT NULL;

    ALTER TABLE public.student_courses
      ADD CONSTRAINT student_courses_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
      ADD CONSTRAINT student_courses_student_id_course_id_academic_year_key
        UNIQUE (student_id, course_id, academic_year);
  END IF;
END;
$$;

ALTER TABLE public.student_courses
  ADD COLUMN IF NOT EXISTS semester integer,
  ADD COLUMN IF NOT EXISTS enrollment_date timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS grade numeric(4,2);

UPDATE public.student_courses sc
SET semester = c.semester
FROM public.courses c
WHERE c.id = sc.course_id
  AND sc.semester IS NULL;

UPDATE public.student_courses
SET enrollment_date = created_at
WHERE enrollment_date IS NULL;

ALTER TABLE public.course_sessions
  ADD COLUMN IF NOT EXISTS department_id integer,
  ADD COLUMN IF NOT EXISTS level_code text;

UPDATE public.course_sessions cs
SET department_id = c.department_id,
    level_code = c.level
FROM public.courses c
WHERE c.id = cs.course_id
  AND (cs.department_id IS NULL OR cs.level_code IS NULL);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'course_sessions_department_id_fkey'
      AND conrelid = 'public.course_sessions'::regclass
  ) THEN
    ALTER TABLE public.course_sessions
      ADD CONSTRAINT course_sessions_department_id_fkey
      FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
  END IF;
END;
$$;

DROP POLICY IF EXISTS professor_courses_select_policy ON public.professor_courses;
DROP POLICY IF EXISTS professor_courses_insert_update_delete_policy ON public.professor_courses;
DROP POLICY IF EXISTS admin_all_professor_courses ON public.professor_courses;
DROP POLICY IF EXISTS professor_read_own_courses ON public.professor_courses;

CREATE POLICY professor_courses_select_policy ON public.professor_courses
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
  professor_id = auth.uid()
);

CREATE POLICY professor_courses_insert_update_delete_policy ON public.professor_courses
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS student_courses_select_policy ON public.student_courses;
DROP POLICY IF EXISTS student_courses_insert_update_delete_policy ON public.student_courses;
DROP POLICY IF EXISTS admin_all_student_courses ON public.student_courses;
DROP POLICY IF EXISTS professor_read_student_courses ON public.student_courses;
DROP POLICY IF EXISTS student_read_own_courses ON public.student_courses;

CREATE POLICY student_courses_select_policy ON public.student_courses
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
  student_id = auth.uid() OR
  EXISTS (
    SELECT 1
    FROM public.professor_courses pc
    WHERE pc.professor_id = auth.uid()
      AND pc.course_id = student_courses.course_id
  )
);

CREATE POLICY student_courses_insert_update_delete_policy ON public.student_courses
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS documents_select_policy ON public.documents;
CREATE POLICY documents_select_policy ON public.documents
FOR SELECT USING (
  visibility = 'public' OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
  (visibility = 'department' AND EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.courses c ON p.department_id = c.department_id
    WHERE p.id = auth.uid()
      AND c.id = documents.course_id
  )) OR
  (visibility = 'course' AND (
    EXISTS (
      SELECT 1
      FROM public.student_courses sc
      WHERE sc.student_id = auth.uid()
        AND sc.course_id = documents.course_id
    ) OR EXISTS (
      SELECT 1
      FROM public.professor_courses pc
      WHERE pc.professor_id = auth.uid()
        AND pc.course_id = documents.course_id
    )
  ))
);

DROP POLICY IF EXISTS exam_results_select_policy ON public.exam_results;
CREATE POLICY exam_results_select_policy ON public.exam_results
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
  EXISTS (
    SELECT 1
    FROM public.professor_courses pc
    JOIN public.exams e ON pc.course_id = e.course_id
    WHERE pc.professor_id = auth.uid()
      AND e.id::text = exam_results.exam_id::text
  ) OR
  EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.profile_id = auth.uid()
      AND s.id::text = exam_results.student_id::text
  )
);

DROP POLICY IF EXISTS professor_read_assigned_exams ON public.exams;
CREATE POLICY professor_read_assigned_exams ON public.exams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.professor_courses
      WHERE professor_courses.professor_id = auth.uid()
        AND professor_courses.course_id = exams.course_id
    )
  );

DROP POLICY IF EXISTS professor_read_update_student_exams ON public.student_exams;
DROP POLICY IF EXISTS professor_update_student_exams ON public.student_exams;

CREATE POLICY professor_read_update_student_exams ON public.student_exams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.professor_courses
      WHERE professor_courses.professor_id = auth.uid()
        AND professor_courses.course_id = student_exams.course_id
    )
  );

CREATE POLICY professor_update_student_exams ON public.student_exams
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.professor_courses
      WHERE professor_courses.professor_id = auth.uid()
        AND professor_courses.course_id = student_exams.course_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.professor_courses
      WHERE professor_courses.professor_id = auth.uid()
        AND professor_courses.course_id = student_exams.course_id
    )
  );

DROP POLICY IF EXISTS professor_manage_assigned_grades_v2 ON public.grades;
CREATE POLICY professor_manage_assigned_grades_v2 ON public.grades
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.professors pr
      JOIN public.professor_courses pc ON pc.professor_id = pr.profile_id
      WHERE pr.profile_id = auth.uid()
        AND pr.id = grades.professor_id
        AND pc.course_id = grades.course_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.professors pr
      JOIN public.professor_courses pc ON pc.professor_id = pr.profile_id
      WHERE pr.profile_id = auth.uid()
        AND pr.id = grades.professor_id
        AND pc.course_id = grades.course_id
    )
  );

COMMIT;
