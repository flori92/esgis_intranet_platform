BEGIN;

-- Prevent duplicate weekly schedule rows for the same scope/week.
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_schedules_unique_scope_filiere
  ON public.weekly_schedules(department_id, level_code, week_start_date, filiere_id)
  WHERE filiere_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_schedules_unique_scope_all
  ON public.weekly_schedules(department_id, level_code, week_start_date)
  WHERE filiere_id IS NULL;

-- Professors can manage weekly schedules from the dedicated professor route.
DROP POLICY IF EXISTS weekly_schedules_professor_select ON public.weekly_schedules;
CREATE POLICY weekly_schedules_professor_select ON public.weekly_schedules
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.professors p
      WHERE p.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS weekly_schedules_professor_insert ON public.weekly_schedules;
CREATE POLICY weekly_schedules_professor_insert ON public.weekly_schedules
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.professors p
      WHERE p.profile_id = auth.uid()
    )
    AND (
      weekly_schedules.filiere_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.filieres f
        WHERE f.id = weekly_schedules.filiere_id
          AND (
            f.department_id IS NULL
            OR f.department_id = weekly_schedules.department_id
          )
      )
    )
  );

DROP POLICY IF EXISTS weekly_schedules_professor_update ON public.weekly_schedules;
CREATE POLICY weekly_schedules_professor_update ON public.weekly_schedules
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.professors p
      WHERE p.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.professors p
      WHERE p.profile_id = auth.uid()
    )
    AND (
      weekly_schedules.filiere_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.filieres f
        WHERE f.id = weekly_schedules.filiere_id
          AND (
            f.department_id IS NULL
            OR f.department_id = weekly_schedules.department_id
          )
      )
    )
  );

DROP POLICY IF EXISTS weekly_schedules_professor_delete ON public.weekly_schedules;
CREATE POLICY weekly_schedules_professor_delete ON public.weekly_schedules
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.professors p
      WHERE p.profile_id = auth.uid()
    )
  );

-- Storage upsert needs UPDATE on storage.objects for the schedules bucket.
DROP POLICY IF EXISTS schedules_update ON storage.objects;
CREATE POLICY schedules_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'schedules'
    AND (
      check_is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.professors p
        WHERE p.profile_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'schedules'
    AND (
      check_is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.professors p
        WHERE p.profile_id = auth.uid()
      )
    )
  );

COMMIT;
