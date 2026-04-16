-- Documents: ciblage explicite par département
-- Validation queue: aligner les statuts et types réellement utilisés par l'interface

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL;

UPDATE public.documents AS d
SET department_id = c.department_id
FROM public.courses AS c
WHERE d.course_id = c.id
  AND d.department_id IS NULL
  AND c.department_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_department_id ON public.documents(department_id);

DROP POLICY IF EXISTS documents_select_policy ON public.documents;
DROP POLICY IF EXISTS documents_public_select_policy ON public.documents;
DROP POLICY IF EXISTS documents_owner_select_policy ON public.documents;
DROP POLICY IF EXISTS documents_admin_select_policy ON public.documents;
DROP POLICY IF EXISTS documents_department_select_policy ON public.documents;
DROP POLICY IF EXISTS documents_course_select_policy ON public.documents;

CREATE POLICY documents_public_select_policy ON public.documents
  FOR SELECT TO authenticated
  USING (visibility = 'public');

CREATE POLICY documents_owner_select_policy ON public.documents
  FOR SELECT TO authenticated
  USING (uploaded_by::text = auth.uid()::text);

CREATE POLICY documents_admin_select_policy ON public.documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id::text = auth.uid()::text
        AND role = 'admin'
    )
  );

CREATE POLICY documents_department_select_policy ON public.documents
  FOR SELECT TO authenticated
  USING (
    visibility = 'department'
    AND department_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id::text = auth.uid()::text
        AND p.department_id::text = documents.department_id::text
    )
  );

CREATE POLICY documents_course_select_policy ON public.documents
  FOR SELECT TO authenticated
  USING (
    visibility = 'course'
    AND course_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.student_courses sc
        WHERE sc.course_id = documents.course_id
          AND (
            sc.student_id::text = auth.uid()::text
            OR EXISTS (
              SELECT 1
              FROM public.students s
              WHERE s.profile_id::text = auth.uid()::text
                AND (
                  sc.student_entity_id = s.id
                  OR sc.student_id::text = s.id::text
                )
            )
          )
      )
      OR EXISTS (
        SELECT 1
        FROM public.professor_courses pc
        WHERE pc.course_id = documents.course_id
          AND (
            pc.professor_id::text = auth.uid()::text
            OR EXISTS (
              SELECT 1
              FROM public.professors pr
              WHERE pr.profile_id::text = auth.uid()::text
                AND pc.professor_id::text = pr.id::text
            )
          )
      )
    )
  );

UPDATE public.validation_queue
SET status = 'received'
WHERE status = 'pending';

DO $$
DECLARE
  request_type_constraint TEXT;
  status_constraint TEXT;
BEGIN
  SELECT c.conname
  INTO request_type_constraint
  FROM pg_constraint c
  WHERE c.conrelid = 'public.validation_queue'::regclass
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%request_type%';

  IF request_type_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.validation_queue DROP CONSTRAINT %I', request_type_constraint);
  END IF;

  SELECT c.conname
  INTO status_constraint
  FROM pg_constraint c
  WHERE c.conrelid = 'public.validation_queue'::regclass
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%status%';

  IF status_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.validation_queue DROP CONSTRAINT %I', status_constraint);
  END IF;
END $$;

ALTER TABLE public.validation_queue
  DROP CONSTRAINT IF EXISTS validation_queue_request_type_check;

ALTER TABLE public.validation_queue
  DROP CONSTRAINT IF EXISTS validation_queue_status_check;

ALTER TABLE public.validation_queue
  ADD CONSTRAINT validation_queue_request_type_check
  CHECK (
    request_type IN (
      'certificate',
      'attestation',
      'transcript',
      'report_card',
      'correction',
      'duplicate',
      'access_reset',
      'diploma',
      'grade_correction',
      'document_upload',
      'other'
    )
  );

ALTER TABLE public.validation_queue
  ADD CONSTRAINT validation_queue_status_check
  CHECK (
    status IN (
      'pending',
      'received',
      'processing',
      'approved',
      'rejected',
      'ready'
    )
  );
