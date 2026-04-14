BEGIN;

ALTER TABLE public.weekly_schedules
  ADD COLUMN IF NOT EXISTS filiere_id INTEGER REFERENCES public.filieres(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_weekly_schedules_filiere
  ON public.weekly_schedules(filiere_id);

DROP POLICY IF EXISTS weekly_schedules_student_select ON public.weekly_schedules;
CREATE POLICY weekly_schedules_student_select ON public.weekly_schedules
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.profile_id = auth.uid()
        AND s.department_id = weekly_schedules.department_id
        AND s.level = weekly_schedules.level_code
        AND (
          weekly_schedules.filiere_id IS NULL
          OR s.filiere_id = weekly_schedules.filiere_id
        )
    )
    AND status = 'published'
  );

DROP POLICY IF EXISTS weekly_schedules_professor_insert ON public.weekly_schedules;
CREATE POLICY weekly_schedules_professor_insert ON public.weekly_schedules
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.professors p
      WHERE p.profile_id = auth.uid()
        AND p.department_id = weekly_schedules.department_id
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

COMMIT;
