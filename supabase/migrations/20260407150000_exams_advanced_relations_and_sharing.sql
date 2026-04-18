-- Migration: Advanced Exam Relations and Sharing
-- Date: 2026-04-07
-- Description: Adds shareable links, practice relations, and improved tracking for exams.

BEGIN;

DROP POLICY IF EXISTS admin_all_exams ON public.exams;
DROP POLICY IF EXISTS professor_crud_own_exams ON public.exams;
DROP POLICY IF EXISTS professor_read_assigned_exams ON public.exams;
DROP POLICY IF EXISTS student_read_own_exams ON public.exams;

DROP POLICY IF EXISTS admin_all_student_exams ON public.student_exams;
DROP POLICY IF EXISTS professor_read_update_student_exams ON public.student_exams;
DROP POLICY IF EXISTS professor_update_student_exams ON public.student_exams;
DROP POLICY IF EXISTS student_read_own_exams ON public.student_exams;
DROP POLICY IF EXISTS professor_crud_own_exam_questions ON public.exam_questions;
DROP POLICY IF EXISTS professor_crud_own_exam_supervisors ON public.exam_supervisors;
DROP POLICY IF EXISTS professor_read_exam_incidents ON public.exam_incidents;
DROP POLICY IF EXISTS student_read_own_exam_grades ON public.exam_grades;

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
      AND table_name = 'exams'
      AND column_name = 'professor_id';

    IF professor_id_type = 'integer' THEN
        ALTER TABLE public.exams
          DROP CONSTRAINT IF EXISTS exams_professor_id_fkey;

        ALTER TABLE public.exams
          ADD COLUMN IF NOT EXISTS professor_entity_id integer,
          ADD COLUMN IF NOT EXISTS professor_profile_id uuid;

        UPDATE public.exams
        SET professor_entity_id = professor_id
        WHERE professor_entity_id IS NULL
          AND professor_id IS NOT NULL;

        UPDATE public.exams e
        SET professor_profile_id = p.profile_id
        FROM public.professors p
        WHERE p.id = e.professor_id
          AND e.professor_profile_id IS NULL;

        SELECT count(*)
        INTO unmapped_count
        FROM public.exams
        WHERE professor_id IS NOT NULL
          AND professor_profile_id IS NULL;

        IF unmapped_count > 0 THEN
            RAISE EXCEPTION 'Cannot align exams.professor_id to profile UUIDs: % rows are unmapped', unmapped_count;
        END IF;

        ALTER TABLE public.exams DROP COLUMN professor_id;
        ALTER TABLE public.exams RENAME COLUMN professor_profile_id TO professor_id;
    END IF;

    SELECT data_type
    INTO student_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'student_exams'
      AND column_name = 'student_id';

    IF student_id_type = 'integer' THEN
        ALTER TABLE public.student_exams
          DROP CONSTRAINT IF EXISTS student_exams_student_id_fkey,
          DROP CONSTRAINT IF EXISTS student_exams_exam_id_student_id_key;

        ALTER TABLE public.student_exams
          ADD COLUMN IF NOT EXISTS student_entity_id integer,
          ADD COLUMN IF NOT EXISTS student_profile_id uuid;

        UPDATE public.student_exams
        SET student_entity_id = student_id
        WHERE student_entity_id IS NULL
          AND student_id IS NOT NULL;

        UPDATE public.student_exams se
        SET student_profile_id = s.profile_id
        FROM public.students s
        WHERE s.id = se.student_id
          AND se.student_profile_id IS NULL;

        SELECT count(*)
        INTO unmapped_count
        FROM public.student_exams
        WHERE student_id IS NOT NULL
          AND student_profile_id IS NULL;

        IF unmapped_count > 0 THEN
            RAISE EXCEPTION 'Cannot align student_exams.student_id to profile UUIDs: % rows are unmapped', unmapped_count;
        END IF;

        ALTER TABLE public.student_exams DROP COLUMN student_id;
        ALTER TABLE public.student_exams RENAME COLUMN student_profile_id TO student_id;
    END IF;
END $$;

ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS professor_entity_id integer,
  ADD COLUMN IF NOT EXISTS exam_date timestamptz,
  ADD COLUMN IF NOT EXISTS exam_type varchar(50),
  ADD COLUMN IF NOT EXISTS department_id integer;

UPDATE public.exams
SET exam_date = COALESCE(exam_date, date),
    exam_type = COALESCE(exam_type, type);

UPDATE public.exams e
SET professor_entity_id = p.id
FROM public.professors p
WHERE p.profile_id = e.professor_id
  AND e.professor_entity_id IS NULL;

UPDATE public.exams e
SET department_id = c.department_id
FROM public.courses c
WHERE c.id = e.course_id
  AND e.department_id IS NULL;

ALTER TABLE public.student_exams
  ADD COLUMN IF NOT EXISTS student_entity_id integer;

UPDATE public.student_exams se
SET student_entity_id = s.id
FROM public.students s
WHERE s.profile_id = se.student_id
  AND se.student_entity_id IS NULL;

UPDATE public.student_exams se
SET course_id = e.course_id
FROM public.exams e
WHERE e.id = se.exam_id
  AND se.course_id IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'exams_professor_id_fkey'
          AND conrelid = 'public.exams'::regclass
    ) THEN
        ALTER TABLE public.exams
          ADD CONSTRAINT exams_professor_id_fkey
          FOREIGN KEY (professor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'exams_department_id_fkey'
          AND conrelid = 'public.exams'::regclass
    ) THEN
        ALTER TABLE public.exams
          ADD CONSTRAINT exams_department_id_fkey
          FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'student_exams_student_id_fkey'
          AND conrelid = 'public.student_exams'::regclass
    ) THEN
        ALTER TABLE public.student_exams
          ADD CONSTRAINT student_exams_student_id_fkey
          FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'student_exams_student_entity_id_fkey'
          AND conrelid = 'public.student_exams'::regclass
    ) THEN
        ALTER TABLE public.student_exams
          ADD CONSTRAINT student_exams_student_entity_id_fkey
          FOREIGN KEY (student_entity_id) REFERENCES public.students(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'student_exams_exam_id_student_id_key'
          AND conrelid = 'public.student_exams'::regclass
    ) THEN
        ALTER TABLE public.student_exams
          ADD CONSTRAINT student_exams_exam_id_student_id_key
          UNIQUE (exam_id, student_id);
    END IF;
END $$;

ALTER TABLE public.exams DROP CONSTRAINT IF EXISTS exams_type_check;
ALTER TABLE public.exams DROP CONSTRAINT IF EXISTS exams_status_check;

ALTER TABLE public.exams
  ADD CONSTRAINT exams_type_check
    CHECK (type IN ('midterm', 'final', 'quiz', 'project', 'oral', 'practical')),
  ADD CONSTRAINT exams_status_check
    CHECK (status IN ('draft', 'published', 'in_progress', 'grading', 'completed', 'cancelled', 'upcoming', 'graded', 'archived'));

ALTER TABLE public.exams
  ALTER COLUMN status SET DEFAULT 'draft';

CREATE OR REPLACE FUNCTION public.sync_exam_runtime_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.exam_date IS NULL THEN
        NEW.exam_date := NEW.date;
    END IF;

    IF NEW.date IS NULL THEN
        NEW.date := NEW.exam_date;
    END IF;

    IF NEW.exam_type IS NULL THEN
        NEW.exam_type := NEW.type;
    END IF;

    IF NEW.type IS NULL THEN
        NEW.type := NEW.exam_type;
    END IF;

    IF NEW.department_id IS NULL AND NEW.course_id IS NOT NULL THEN
        SELECT c.department_id
        INTO NEW.department_id
        FROM public.courses c
        WHERE c.id = NEW.course_id;
    END IF;

    IF NEW.professor_entity_id IS NULL AND NEW.professor_id IS NOT NULL THEN
        SELECT p.id
        INTO NEW.professor_entity_id
        FROM public.professors p
        WHERE p.profile_id = NEW.professor_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_exam_runtime_fields ON public.exams;
CREATE TRIGGER trigger_sync_exam_runtime_fields
BEFORE INSERT OR UPDATE ON public.exams
FOR EACH ROW
EXECUTE FUNCTION public.sync_exam_runtime_fields();

CREATE OR REPLACE FUNCTION public.sync_student_exam_runtime_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.student_entity_id IS NULL AND NEW.student_id IS NOT NULL THEN
        SELECT s.id
        INTO NEW.student_entity_id
        FROM public.students s
        WHERE s.profile_id = NEW.student_id;
    END IF;

    IF NEW.course_id IS NULL AND NEW.exam_id IS NOT NULL THEN
        SELECT e.course_id
        INTO NEW.course_id
        FROM public.exams e
        WHERE e.id = NEW.exam_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_student_exam_runtime_fields ON public.student_exams;
CREATE TRIGGER trigger_sync_student_exam_runtime_fields
BEFORE INSERT OR UPDATE ON public.student_exams
FOR EACH ROW
EXECUTE FUNCTION public.sync_student_exam_runtime_fields();

CREATE INDEX IF NOT EXISTS idx_exams_professor_id ON public.exams(professor_id);
CREATE INDEX IF NOT EXISTS idx_exams_department_id ON public.exams(department_id);
CREATE INDEX IF NOT EXISTS idx_exams_exam_date ON public.exams(exam_date);
CREATE INDEX IF NOT EXISTS idx_student_exams_student_id ON public.student_exams(student_id);
CREATE INDEX IF NOT EXISTS idx_student_exams_student_entity_id ON public.student_exams(student_entity_id);

CREATE POLICY admin_all_exams ON public.exams
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE POLICY professor_crud_own_exams ON public.exams
    FOR ALL
    TO authenticated
    USING (
        professor_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        professor_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE POLICY professor_read_assigned_exams ON public.exams
    FOR SELECT
    TO authenticated
    USING (
        professor_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.professor_courses pc
            WHERE pc.professor_id = auth.uid()
              AND pc.course_id = exams.course_id
        )
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE POLICY student_read_own_exams ON public.exams
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.student_exams se
            WHERE se.exam_id = exams.id
              AND se.student_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE POLICY admin_all_student_exams ON public.student_exams
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE POLICY professor_read_update_student_exams ON public.student_exams
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.professor_courses pc
            WHERE pc.professor_id = auth.uid()
              AND pc.course_id = student_exams.course_id
        )
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE POLICY professor_update_student_exams ON public.student_exams
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.professor_courses pc
            WHERE pc.professor_id = auth.uid()
              AND pc.course_id = student_exams.course_id
        )
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.professor_courses pc
            WHERE pc.professor_id = auth.uid()
              AND pc.course_id = student_exams.course_id
        )
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE POLICY student_read_own_exams ON public.student_exams
    FOR SELECT
    TO authenticated
    USING (
        student_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE POLICY professor_crud_own_exam_questions ON public.exam_questions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.exams e
            WHERE e.id = exam_questions.exam_id
              AND e.professor_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.exams e
            JOIN public.professor_courses pc ON pc.course_id = e.course_id
            WHERE e.id = exam_questions.exam_id
              AND pc.professor_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.exams e
            WHERE e.id = exam_questions.exam_id
              AND e.professor_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.exams e
            JOIN public.professor_courses pc ON pc.course_id = e.course_id
            WHERE e.id = exam_questions.exam_id
              AND pc.professor_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE POLICY professor_crud_own_exam_supervisors ON public.exam_supervisors
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.exams e
            WHERE e.id = exam_supervisors.exam_id
              AND e.professor_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.exams e
            WHERE e.id = exam_supervisors.exam_id
              AND e.professor_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE POLICY professor_read_exam_incidents ON public.exam_incidents
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.exams e
            WHERE e.id = exam_incidents.exam_id
              AND e.professor_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.exams e
            JOIN public.professor_courses pc ON pc.course_id = e.course_id
            WHERE e.id = exam_incidents.exam_id
              AND pc.professor_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE POLICY student_read_own_exam_grades ON public.exam_grades
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.student_exams se
            WHERE se.id = exam_grades.student_exam_id
              AND se.student_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

-- 1. Add share_token to exams for direct access
-- This allows teachers to share a unique link with students
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid() NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_exams_share_token') THEN
        CREATE UNIQUE INDEX idx_exams_share_token ON public.exams(share_token);
    END IF;
END $$;

-- 2. Add hierarchical and practice relations to exams
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS parent_exam_id INTEGER REFERENCES public.exams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_practice BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS practice_quiz_id UUID REFERENCES public.practice_quizzes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'evaluation';

-- Add comment for category
COMMENT ON COLUMN public.exams.category IS 'evaluation, training, mock_exam, challenge';

-- 3. Add metadata for student tracking via link in student_exams
ALTER TABLE public.student_exams
ADD COLUMN IF NOT EXISTS joined_via_link BOOLEAN DEFAULT false;

-- 4. View for students to see their exams (past, current, future) with course info
CREATE OR REPLACE VIEW public.student_exams_dashboard AS
SELECT 
    se.id as registration_id,
    e.id as exam_id,
    e.title,
    e.exam_date as exam_date,
    e.duration,
    e.exam_type as exam_type,
    e.category as exam_category,
    e.status as exam_status,
    e.share_token,
    se.student_id,
    s.profile_id as student_profile_id,
    se.status as student_status,
    se.grade,
    se.attendance,
    se.joined_via_link,
    c.name as course_name,
    c.code as course_code,
    COALESCE(NULLIF(trim(concat_ws(' ', p.first_name, p.last_name)), ''), p.full_name, p.email) as professor_name
FROM public.student_exams se
JOIN public.exams e ON se.exam_id = e.id
JOIN public.courses c ON e.course_id = c.id
JOIN public.students s ON se.student_id = s.profile_id
JOIN public.profiles p ON e.professor_id = p.id;

-- 5. Function to join exam via token
-- This function handles the logic of registering a student to an exam using a token
CREATE OR REPLACE FUNCTION public.join_exam_by_token(p_share_token UUID, p_profile_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_exam_id INTEGER;
    v_existing_registration_id INTEGER;
    v_exam_record RECORD;
BEGIN
    -- Get exam by token
    SELECT * INTO v_exam_record FROM public.exams WHERE share_token = p_share_token;
    
    IF v_exam_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Examen non trouvé');
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.students
        WHERE profile_id = p_profile_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Vous n''êtes pas enregistré en tant qu''étudiant');
    END IF;
    
    -- Check if already registered
    SELECT id INTO v_existing_registration_id 
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

    -- Register student
    INSERT INTO public.student_exams (student_id, exam_id, course_id, joined_via_link, status)
    VALUES (p_profile_id, v_exam_record.id, v_exam_record.course_id, true, 'scheduled');

    RETURN jsonb_build_object(
        'success', true, 
        'exam_id', v_exam_record.id, 
        'new_registration', true,
        'title', v_exam_record.title,
        'message', 'Vous avez rejoint l''examen avec succès'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add policy for public/token access if needed
-- For now, the function is SECURITY DEFINER, so it bypasses RLS for the join operation.
-- We should ensure students can see exams they joined via link.
-- The existing student_read_own_exams policy already covers this because it checks student_exams.

COMMIT;
