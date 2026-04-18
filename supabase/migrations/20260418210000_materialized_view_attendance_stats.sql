-- Performance Optimization: Materialized View for Student Attendance Stats

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_student_attendance_stats AS
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
    sc.student_id,
    sc.course_id,
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
LEFT JOIN 
    session_counts sn ON sn.course_id = sc.course_id
LEFT JOIN 
    attendance_counts ac ON ac.student_id = sc.student_entity_id AND ac.course_id = sc.course_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_student_attendance_stats_id ON public.mv_student_attendance_stats (student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_mv_student_attendance_stats_course ON public.mv_student_attendance_stats (course_id);

GRANT SELECT ON public.mv_student_attendance_stats TO authenticated;

-- Add a view for Global Stats (aggregated)
CREATE OR REPLACE VIEW public.v_student_global_attendance_stats AS
SELECT 
    student_id,
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
    public.mv_student_attendance_stats
GROUP BY 
    student_id, student_number, full_name;

GRANT SELECT ON public.v_student_global_attendance_stats TO authenticated;
