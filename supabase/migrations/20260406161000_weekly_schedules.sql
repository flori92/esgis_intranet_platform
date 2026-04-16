-- Migration: Table weekly_schedules + bucket storage
-- Date: 2026-04-06
-- Feature: Upload et affichage des emplois du temps PDF hebdomadaires

BEGIN;

-- Table weekly_schedules
CREATE TABLE IF NOT EXISTS public.weekly_schedules (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  department_id INTEGER NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  level_code VARCHAR(20) NOT NULL,
  week_start_date DATE NOT NULL,
  academic_year TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_dept_level
  ON public.weekly_schedules(department_id, level_code);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_week
  ON public.weekly_schedules(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_status
  ON public.weekly_schedules(status);

-- RLS
ALTER TABLE public.weekly_schedules ENABLE ROW LEVEL SECURITY;

-- Admins: full access
DROP POLICY IF EXISTS weekly_schedules_admin_all ON public.weekly_schedules;
CREATE POLICY weekly_schedules_admin_all ON public.weekly_schedules
  FOR ALL TO authenticated
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());

-- Professors: INSERT/SELECT on their department
DROP POLICY IF EXISTS weekly_schedules_professor_select ON public.weekly_schedules;
CREATE POLICY weekly_schedules_professor_select ON public.weekly_schedules
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.professors p
      WHERE p.profile_id = auth.uid()
        AND p.department_id = weekly_schedules.department_id
    )
  );

DROP POLICY IF EXISTS weekly_schedules_professor_insert ON public.weekly_schedules;
CREATE POLICY weekly_schedules_professor_insert ON public.weekly_schedules
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professors p
      WHERE p.profile_id = auth.uid()
        AND p.department_id = weekly_schedules.department_id
    )
  );

DROP POLICY IF EXISTS weekly_schedules_professor_update ON public.weekly_schedules;
CREATE POLICY weekly_schedules_professor_update ON public.weekly_schedules
  FOR UPDATE TO authenticated
  USING (
    uploaded_by = auth.uid()
  )
  WITH CHECK (
    uploaded_by = auth.uid()
  );

DROP POLICY IF EXISTS weekly_schedules_professor_delete ON public.weekly_schedules;
CREATE POLICY weekly_schedules_professor_delete ON public.weekly_schedules
  FOR DELETE TO authenticated
  USING (
    uploaded_by = auth.uid()
  );

-- Students: SELECT only their department + level
DROP POLICY IF EXISTS weekly_schedules_student_select ON public.weekly_schedules;
CREATE POLICY weekly_schedules_student_select ON public.weekly_schedules
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.profile_id = auth.uid()
        AND s.department_id = weekly_schedules.department_id
        AND s.level = weekly_schedules.level_code
    )
    AND status = 'published'
  );

COMMIT;
