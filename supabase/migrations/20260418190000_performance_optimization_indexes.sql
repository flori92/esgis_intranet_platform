-- Performance optimization: Adding missing indexes for common joins and filters

-- 1. course_sessions
CREATE INDEX IF NOT EXISTS idx_course_sessions_course_id ON public.course_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_professor_id ON public.course_sessions(professor_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_date ON public.course_sessions(date DESC);

-- 2. attendances
CREATE INDEX IF NOT EXISTS idx_attendances_session_id ON public.attendances(session_id);
CREATE INDEX IF NOT EXISTS idx_attendances_student_id ON public.attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_attendances_status ON public.attendances(status);

-- 3. student_courses
CREATE INDEX IF NOT EXISTS idx_student_courses_course_id ON public.student_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_student_id ON public.student_courses(student_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_student_entity_id ON public.student_courses(student_entity_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_academic_year ON public.student_courses(academic_year);

-- 4. professor_courses
CREATE INDEX IF NOT EXISTS idx_professor_courses_course_id ON public.professor_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_professor_courses_professor_id ON public.professor_courses(professor_id);

-- 5. course_activity_progress
CREATE INDEX IF NOT EXISTS idx_course_activity_progress_course_id ON public.course_activity_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_course_activity_progress_student_id ON public.course_activity_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_course_activity_progress_status ON public.course_activity_progress(status);
