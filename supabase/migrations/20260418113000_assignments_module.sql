-- ESGIS Campus - Module Devoirs & Remises
-- Creation des tables de devoirs, rubrics et soumissions et du bucket de pieces jointes.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.assignment_rubrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professor_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignment_rubrics_professor
  ON public.assignment_rubrics(professor_profile_id);

CREATE INDEX IF NOT EXISTS idx_assignment_rubrics_title
  ON public.assignment_rubrics(title);

CREATE TABLE IF NOT EXISTS public.course_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  professor_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rubric_id UUID REFERENCES public.assignment_rubrics(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  rubric_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  available_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at TIMESTAMPTZ,
  late_until TIMESTAMPTZ,
  allow_late_submission BOOLEAN NOT NULL DEFAULT FALSE,
  submission_mode TEXT NOT NULL DEFAULT 'text_file',
  max_points NUMERIC(6,2) NOT NULL DEFAULT 20,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT course_assignments_submission_mode_check
    CHECK (submission_mode IN ('text', 'file', 'text_file')),
  CONSTRAINT course_assignments_status_check
    CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  CONSTRAINT course_assignments_max_points_check
    CHECK (max_points > 0)
);

CREATE INDEX IF NOT EXISTS idx_course_assignments_course
  ON public.course_assignments(course_id);

CREATE INDEX IF NOT EXISTS idx_course_assignments_professor
  ON public.course_assignments(professor_profile_id);

CREATE INDEX IF NOT EXISTS idx_course_assignments_status
  ON public.course_assignments(status);

CREATE INDEX IF NOT EXISTS idx_course_assignments_due_at
  ON public.course_assignments(due_at);

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.course_assignments(id) ON DELETE CASCADE,
  student_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES public.students(id) ON DELETE SET NULL,
  submission_text TEXT,
  attachment_path TEXT,
  attachment_name TEXT,
  attachment_size BIGINT,
  status TEXT NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  grade NUMERIC(6,2),
  feedback TEXT,
  rubric_feedback JSONB NOT NULL DEFAULT '[]'::jsonb,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT assignment_submissions_status_check
    CHECK (status IN ('submitted', 'late', 'graded', 'returned')),
  CONSTRAINT assignment_submissions_unique_student
    UNIQUE (assignment_id, student_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment
  ON public.assignment_submissions(assignment_id);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_profile
  ON public.assignment_submissions(student_profile_id);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student
  ON public.assignment_submissions(student_id);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status
  ON public.assignment_submissions(status);

DROP TRIGGER IF EXISTS assignment_rubrics_updated_at ON public.assignment_rubrics;
CREATE TRIGGER assignment_rubrics_updated_at
BEFORE UPDATE ON public.assignment_rubrics
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS course_assignments_updated_at ON public.course_assignments;
CREATE TRIGGER course_assignments_updated_at
BEFORE UPDATE ON public.course_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS assignment_submissions_updated_at ON public.assignment_submissions;
CREATE TRIGGER assignment_submissions_updated_at
BEFORE UPDATE ON public.assignment_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

ALTER TABLE public.assignment_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS assignment_rubrics_select_policy ON public.assignment_rubrics;
CREATE POLICY assignment_rubrics_select_policy
ON public.assignment_rubrics
FOR SELECT
USING (
  professor_profile_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS assignment_rubrics_insert_policy ON public.assignment_rubrics;
CREATE POLICY assignment_rubrics_insert_policy
ON public.assignment_rubrics
FOR INSERT
WITH CHECK (
  professor_profile_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS assignment_rubrics_update_policy ON public.assignment_rubrics;
CREATE POLICY assignment_rubrics_update_policy
ON public.assignment_rubrics
FOR UPDATE
USING (
  professor_profile_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (
  professor_profile_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS assignment_rubrics_delete_policy ON public.assignment_rubrics;
CREATE POLICY assignment_rubrics_delete_policy
ON public.assignment_rubrics
FOR DELETE
USING (
  professor_profile_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS course_assignments_select_policy ON public.course_assignments;
CREATE POLICY course_assignments_select_policy
ON public.course_assignments
FOR SELECT
USING (
  professor_profile_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.professor_courses pc
    WHERE pc.course_id = course_assignments.course_id
      AND pc.professor_id = auth.uid()
  )
  OR (
    status IN ('published', 'closed', 'archived')
    AND EXISTS (
      SELECT 1
      FROM public.student_courses sc
      WHERE sc.course_id = course_assignments.course_id
        AND sc.student_id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS course_assignments_insert_policy ON public.course_assignments;
CREATE POLICY course_assignments_insert_policy
ON public.course_assignments
FOR INSERT
WITH CHECK (
  professor_profile_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.professor_courses pc
    WHERE pc.course_id = course_assignments.course_id
      AND pc.professor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS course_assignments_update_policy ON public.course_assignments;
CREATE POLICY course_assignments_update_policy
ON public.course_assignments
FOR UPDATE
USING (
  professor_profile_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.professor_courses pc
    WHERE pc.course_id = course_assignments.course_id
      AND pc.professor_id = auth.uid()
  )
)
WITH CHECK (
  professor_profile_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.professor_courses pc
    WHERE pc.course_id = course_assignments.course_id
      AND pc.professor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS course_assignments_delete_policy ON public.course_assignments;
CREATE POLICY course_assignments_delete_policy
ON public.course_assignments
FOR DELETE
USING (
  professor_profile_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.professor_courses pc
    WHERE pc.course_id = course_assignments.course_id
      AND pc.professor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS assignment_submissions_select_policy ON public.assignment_submissions;
CREATE POLICY assignment_submissions_select_policy
ON public.assignment_submissions
FOR SELECT
USING (
  student_profile_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.course_assignments ca
    JOIN public.professor_courses pc ON pc.course_id = ca.course_id
    WHERE ca.id = assignment_submissions.assignment_id
      AND pc.professor_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS assignment_submissions_insert_policy ON public.assignment_submissions;
CREATE POLICY assignment_submissions_insert_policy
ON public.assignment_submissions
FOR INSERT
WITH CHECK (
  student_profile_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.course_assignments ca
    JOIN public.student_courses sc ON sc.course_id = ca.course_id
    WHERE ca.id = assignment_submissions.assignment_id
      AND sc.student_id = auth.uid()
      AND ca.status IN ('published', 'closed', 'archived')
  )
);

DROP POLICY IF EXISTS assignment_submissions_update_student_policy ON public.assignment_submissions;
CREATE POLICY assignment_submissions_update_student_policy
ON public.assignment_submissions
FOR UPDATE
USING (
  student_profile_id = auth.uid()
)
WITH CHECK (
  student_profile_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.course_assignments ca
    JOIN public.student_courses sc ON sc.course_id = ca.course_id
    WHERE ca.id = assignment_submissions.assignment_id
      AND sc.student_id = auth.uid()
  )
);

DROP POLICY IF EXISTS assignment_submissions_update_professor_policy ON public.assignment_submissions;
CREATE POLICY assignment_submissions_update_professor_policy
ON public.assignment_submissions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.course_assignments ca
    JOIN public.professor_courses pc ON pc.course_id = ca.course_id
    WHERE ca.id = assignment_submissions.assignment_id
      AND pc.professor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.course_assignments ca
    JOIN public.professor_courses pc ON pc.course_id = ca.course_id
    WHERE ca.id = assignment_submissions.assignment_id
      AND pc.professor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS assignment_submissions_delete_student_policy ON public.assignment_submissions;
CREATE POLICY assignment_submissions_delete_student_policy
ON public.assignment_submissions
FOR DELETE
USING (
  student_profile_id = auth.uid()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'storage'
      AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('assignment-submissions', 'assignment-submissions', false)
    ON CONFLICT (id) DO UPDATE
    SET public = EXCLUDED.public;
  ELSE
    RAISE NOTICE 'Skipping assignment-submissions bucket creation because storage.buckets is unavailable.';
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'storage'
      AND table_name = 'objects'
  ) THEN
    EXECUTE $sql$
      DROP POLICY IF EXISTS assignment_submission_files_insert_policy ON storage.objects;
      CREATE POLICY assignment_submission_files_insert_policy
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'assignment-submissions'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
    $sql$;

    EXECUTE $sql$
      DROP POLICY IF EXISTS assignment_submission_files_select_owner_policy ON storage.objects;
      CREATE POLICY assignment_submission_files_select_owner_policy
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'assignment-submissions'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
    $sql$;

    EXECUTE $sql$
      DROP POLICY IF EXISTS assignment_submission_files_update_owner_policy ON storage.objects;
      CREATE POLICY assignment_submission_files_update_owner_policy
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'assignment-submissions'
        AND auth.uid()::text = (storage.foldername(name))[1]
      )
      WITH CHECK (
        bucket_id = 'assignment-submissions'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
    $sql$;

    EXECUTE $sql$
      DROP POLICY IF EXISTS assignment_submission_files_delete_owner_policy ON storage.objects;
      CREATE POLICY assignment_submission_files_delete_owner_policy
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'assignment-submissions'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
    $sql$;

    EXECUTE $sql$
      DROP POLICY IF EXISTS assignment_submission_files_professor_select_policy ON storage.objects;
      CREATE POLICY assignment_submission_files_professor_select_policy
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'assignment-submissions'
        AND EXISTS (
          SELECT 1
          FROM public.assignment_submissions sub
          JOIN public.course_assignments ca ON ca.id = sub.assignment_id
          JOIN public.professor_courses pc ON pc.course_id = ca.course_id
          WHERE sub.attachment_path = name
            AND pc.professor_id = auth.uid()
        )
      );
    $sql$;

    EXECUTE $sql$
      DROP POLICY IF EXISTS assignment_submission_files_admin_select_policy ON storage.objects;
      CREATE POLICY assignment_submission_files_admin_select_policy
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'assignment-submissions'
        AND EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
      );
    $sql$;
  ELSE
    RAISE NOTICE 'Skipping assignment submission storage policies because storage.objects is unavailable.';
  END IF;
END;
$$;
