-- Performance Optimization: Materialized View for Professor Learning Insights

-- 1. Create a function to refresh metrics for a professor
-- This replaces the complex logic in getProfessorLearningInsights and refresh_professor_learning_metrics
-- by pre-calculating the most expensive parts.

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_professor_course_stats AS
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_professor_course_stats_id ON public.mv_professor_course_stats (professor_id, course_id, academic_year);

-- 2. Function to refresh this materialized view
CREATE OR REPLACE FUNCTION public.refresh_professor_stats_mv()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_professor_course_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Automate refresh on data changes (optional, can be done manually or via cron)
-- For now, let's just ensure we have a fast way to refresh it.
GRANT SELECT ON public.mv_professor_course_stats TO authenticated;
