-- Fix RLS policies for professor access to analytics and attendances

-- 1. student_performance_analytics
DROP POLICY IF EXISTS student_performance_analytics_professor_read_policy ON public.student_performance_analytics;
CREATE POLICY student_performance_analytics_professor_read_policy
ON public.student_performance_analytics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.professor_courses pc
    WHERE pc.course_id = student_performance_analytics.course_id
      AND pc.professor_id = auth.uid()
  )
);

-- 2. course_activity_progress
DROP POLICY IF EXISTS course_activity_progress_professor_read_policy ON public.course_activity_progress;
CREATE POLICY course_activity_progress_professor_read_policy
ON public.course_activity_progress
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.professor_courses pc
    WHERE pc.course_id = course_activity_progress.course_id
      AND pc.professor_id = auth.uid()
  )
);

-- 3. attendances (Simplification and Correction)
DROP POLICY IF EXISTS attendances_select_policy ON public.attendances;
CREATE POLICY attendances_select_policy
ON public.attendances
FOR SELECT
TO authenticated
USING (
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) OR
  (EXISTS (
    SELECT 1 FROM public.course_sessions cs
    JOIN public.professor_courses pc ON pc.course_id = cs.course_id
    WHERE cs.id = attendances.session_id
      AND pc.professor_id = auth.uid()
  )) OR
  (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = attendances.student_id
      AND s.profile_id = auth.uid()
  ))
);

-- 4. student_courses (Ensuring professor can see enrollment for their courses)
DROP POLICY IF EXISTS student_courses_select_policy ON public.student_courses;
CREATE POLICY student_courses_select_policy
ON public.student_courses
FOR SELECT
TO authenticated
USING (
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) OR
  (EXISTS (
    SELECT 1 FROM public.professor_courses pc
    WHERE pc.course_id = student_courses.course_id
      AND pc.professor_id = auth.uid()
  )) OR
  (student_id = auth.uid()) OR
  (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_courses.student_entity_id
      AND s.profile_id = auth.uid()
  ))
);
