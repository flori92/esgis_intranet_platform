-- Final Dynamic Views with Professor awareness and instant refresh
-- ESGIS Campus § Real-time Analytics Engine

-- 1. DROP old views to avoid conflicts
DROP VIEW IF EXISTS public.v_student_global_attendance_stats CASCADE;
DROP VIEW IF EXISTS public.v_student_attendance_stats CASCADE;
DROP VIEW IF EXISTS public.v_professor_course_stats CASCADE;

-- 2. CREATE Base Attendance View with Professor link
CREATE OR REPLACE VIEW public.v_student_attendance_stats AS
WITH session_counts AS (
    SELECT 
        course_id, 
        COUNT(*) as total_sessions
    FROM public.course_sessions
    GROUP BY course_id
),
attendance_counts AS (
    SELECT 
        a.student_id,
        cs.course_id,
        COUNT(*) FILTER (WHERE a.status = 'present') as present_count,
        COUNT(*) FILTER (WHERE a.status = 'absent') as absent_count,
        COUNT(*) FILTER (WHERE a.status = 'late') as late_count,
        COUNT(*) FILTER (WHERE a.status = 'excused') as excused_count
    FROM public.attendances a
    JOIN public.course_sessions cs ON cs.id = a.session_id
    GROUP BY a.student_id, cs.course_id
)
SELECT 
    sc.student_id as student_profile_id,
    sc.student_entity_id as student_id,
    sc.course_id,
    pc.professor_id, -- Link to professor for RLS and filtering
    c.name as course_name,
    c.code as course_code,
    s.student_number,
    p.full_name,
    COALESCE(ac.present_count, 0) as present_count,
    COALESCE(ac.absent_count, 0) as absent_count,
    COALESCE(ac.late_count, 0) as late_count,
    COALESCE(ac.excused_count, 0) as excused_count,
    COALESCE(sn.total_sessions, 0) as total_sessions,
    CASE 
        WHEN COALESCE(sn.total_sessions, 0) > 0 
        THEN ROUND((COALESCE(ac.present_count, 0)::numeric / sn.total_sessions) * 100)
        ELSE 0 
    END as attendance_rate
FROM 
    public.student_courses sc
JOIN 
    public.courses c ON c.id = sc.course_id
JOIN 
    public.students s ON s.id = sc.student_entity_id
JOIN 
    public.profiles p ON p.id = s.profile_id
JOIN
    public.professor_courses pc ON pc.course_id = sc.course_id AND pc.academic_year = sc.academic_year
LEFT JOIN 
    session_counts sn ON sn.course_id = sc.course_id
LEFT JOIN 
    attendance_counts ac ON ac.student_id = sc.student_entity_id AND ac.course_id = sc.course_id;

GRANT SELECT ON public.v_student_attendance_stats TO authenticated;

-- 3. CREATE Global Attendance View (Professor specific)
CREATE OR REPLACE VIEW public.v_student_global_attendance_stats AS
SELECT 
    student_id,
    professor_id, -- Keep professor separation
    student_number,
    full_name,
    SUM(present_count) as total_present,
    SUM(total_sessions) as total_sessions,
    CASE 
        WHEN SUM(total_sessions) > 0 
        THEN ROUND((SUM(present_count)::numeric / SUM(total_sessions)) * 100)
        ELSE 0 
    END as global_attendance_rate
FROM 
    public.v_student_attendance_stats
GROUP BY 
    student_id, professor_id, student_number, full_name;

GRANT SELECT ON public.v_student_global_attendance_stats TO authenticated;

-- 4. CREATE Professor Insights View (Instant refresh)
CREATE OR REPLACE VIEW public.v_professor_course_stats AS
SELECT 
    pc.professor_id,
    c.id AS course_id,
    c.name AS course_name,
    c.code AS course_code,
    pc.academic_year,
    COUNT(DISTINCT sc.student_entity_id) AS student_count,
    COALESCE(AVG(spa.attendance_percentage), 0) AS avg_attendance,
    COALESCE(AVG(COALESCE(spa.predicted_grade, spa.final_grade)), 0) AS avg_predicted_grade,
    COALESCE(AVG(cap_agg.avg_progress), 0) AS avg_progress,
    COUNT(DISTINCT CASE WHEN spa.risk_flag THEN spa.student_id END) AS at_risk_count,
    MAX(GREATEST(spa.updated_at, cap_agg.last_activity)) AS last_updated
FROM 
    public.professor_courses pc
JOIN 
    public.courses c ON c.id = pc.course_id
LEFT JOIN 
    public.student_courses sc ON sc.course_id = c.id AND sc.academic_year = pc.academic_year
LEFT JOIN 
    public.student_performance_analytics spa ON spa.course_id = c.id AND spa.student_id = sc.student_entity_id AND spa.academic_year = pc.academic_year
LEFT JOIN (
    SELECT 
        student_id, 
        course_id, 
        AVG(progress_percentage) as avg_progress,
        MAX(last_activity_at) as last_activity
    FROM public.course_activity_progress
    GROUP BY student_id, course_id
) cap_agg ON cap_agg.student_id = sc.student_entity_id AND cap_agg.course_id = c.id
GROUP BY 
    pc.professor_id, c.id, pc.academic_year;

GRANT SELECT ON public.v_professor_course_stats TO authenticated;
