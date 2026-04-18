-- ESGIS Campus - Native learning activity engine
-- Consolidates course completion, engagement and risk analytics without
-- depending on an external LMS runtime.

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

CREATE TABLE IF NOT EXISTS public.course_activity_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL
    CHECK (activity_type IN ('resource', 'assignment', 'practice_quiz', 'interactive_resource', 'forum')),
  activity_id TEXT NOT NULL,
  activity_title TEXT,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed', 'overdue', 'failed')),
  progress_percentage INTEGER NOT NULL DEFAULT 0
    CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  metric_value NUMERIC(8,2),
  last_activity_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT course_activity_progress_unique_activity
    UNIQUE (student_id, activity_type, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_course_activity_progress_student
  ON public.course_activity_progress(student_id);

CREATE INDEX IF NOT EXISTS idx_course_activity_progress_course
  ON public.course_activity_progress(course_id);

CREATE INDEX IF NOT EXISTS idx_course_activity_progress_status
  ON public.course_activity_progress(status);

CREATE INDEX IF NOT EXISTS idx_course_activity_progress_type
  ON public.course_activity_progress(activity_type);

CREATE INDEX IF NOT EXISTS idx_course_activity_progress_student_course
  ON public.course_activity_progress(student_id, course_id);

DROP TRIGGER IF EXISTS course_activity_progress_updated_at ON public.course_activity_progress;
CREATE TRIGGER course_activity_progress_updated_at
BEFORE UPDATE ON public.course_activity_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

ALTER TABLE public.student_alerts
  ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'manual';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'student_alerts_origin_check'
      AND conrelid = 'public.student_alerts'::regclass
  ) THEN
    ALTER TABLE public.student_alerts
      ADD CONSTRAINT student_alerts_origin_check
      CHECK (origin IN ('manual', 'system'));
  END IF;
END;
$$;

ALTER TABLE public.course_activity_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS course_activity_progress_student_read_policy ON public.course_activity_progress;
CREATE POLICY course_activity_progress_student_read_policy
ON public.course_activity_progress
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.id = course_activity_progress.student_id
      AND s.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS course_activity_progress_professor_read_policy ON public.course_activity_progress;
CREATE POLICY course_activity_progress_professor_read_policy
ON public.course_activity_progress
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.professor_courses pc
    WHERE pc.course_id = course_activity_progress.course_id
      AND pc.professor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS course_activity_progress_admin_manage_policy ON public.course_activity_progress;
CREATE POLICY course_activity_progress_admin_manage_policy
ON public.course_activity_progress
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS student_performance_analytics_student_read_policy ON public.student_performance_analytics;
CREATE POLICY student_performance_analytics_student_read_policy
ON public.student_performance_analytics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.id = student_performance_analytics.student_id
      AND s.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS student_performance_analytics_professor_read_policy ON public.student_performance_analytics;
CREATE POLICY student_performance_analytics_professor_read_policy
ON public.student_performance_analytics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.professor_courses pc
    WHERE pc.course_id = student_performance_analytics.course_id
      AND pc.professor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS student_performance_analytics_admin_manage_policy ON public.student_performance_analytics;
CREATE POLICY student_performance_analytics_admin_manage_policy
ON public.student_performance_analytics
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS student_alerts_student_read_policy ON public.student_alerts;
CREATE POLICY student_alerts_student_read_policy
ON public.student_alerts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.id = student_alerts.student_id
      AND s.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS student_alerts_professor_read_policy ON public.student_alerts;
CREATE POLICY student_alerts_professor_read_policy
ON public.student_alerts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.professor_courses pc
    WHERE pc.course_id = student_alerts.related_course_id
      AND pc.professor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS student_alerts_admin_manage_policy ON public.student_alerts;
CREATE POLICY student_alerts_admin_manage_policy
ON public.student_alerts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

CREATE OR REPLACE FUNCTION public.current_academic_year_label()
RETURNS VARCHAR(9)
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_year INTEGER := EXTRACT(YEAR FROM NOW());
  v_current_month INTEGER := EXTRACT(MONTH FROM NOW());
  v_start_year INTEGER;
BEGIN
  IF v_current_month >= 9 THEN
    v_start_year := v_current_year;
  ELSE
    v_start_year := v_current_year - 1;
  END IF;

  RETURN FORMAT('%s-%s', v_start_year, v_start_year + 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_student_course_activity_progress(
  p_student_id INTEGER,
  p_course_id INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
  v_course_ids INTEGER[];
  v_inserted INTEGER := 0;
  v_activity_count INTEGER := 0;
BEGIN
  SELECT s.profile_id
  INTO v_profile_id
  FROM public.students s
  WHERE s.id = p_student_id;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object(
      'student_id', p_student_id,
      'course_ids', '[]'::jsonb,
      'activities_count', 0,
      'status', 'student_not_found'
    );
  END IF;

  SELECT COALESCE(array_agg(DISTINCT sc.course_id), ARRAY[]::INTEGER[])
  INTO v_course_ids
  FROM public.student_courses sc
  WHERE (sc.student_entity_id = p_student_id OR sc.student_id = v_profile_id)
    AND (p_course_id IS NULL OR sc.course_id = p_course_id);

  IF p_course_id IS NOT NULL AND COALESCE(array_length(v_course_ids, 1), 0) = 0 THEN
    v_course_ids := ARRAY[p_course_id];
  ELSE
    v_course_ids := COALESCE(v_course_ids, ARRAY[]::INTEGER[]);
  END IF;

  DELETE FROM public.course_activity_progress cap
  WHERE cap.student_id = p_student_id
    AND (p_course_id IS NULL OR cap.course_id = p_course_id);

  IF COALESCE(array_length(v_course_ids, 1), 0) = 0 THEN
    RETURN jsonb_build_object(
      'student_id', p_student_id,
      'course_ids', '[]'::jsonb,
      'activities_count', 0,
      'status', 'no_courses'
    );
  END IF;

  WITH resource_activity AS (
    SELECT
      ri.resource_id,
      MAX(ri.created_at) AS last_activity_at,
      COUNT(*) AS interaction_count,
      COUNT(*) FILTER (WHERE ri.interaction_type = 'download') AS download_count,
      BOOL_OR(ri.interaction_type = 'view') AS viewed,
      BOOL_OR(ri.interaction_type = 'download') AS downloaded
    FROM public.resource_interactions ri
    WHERE ri.user_id = v_profile_id
    GROUP BY ri.resource_id
  )
  INSERT INTO public.course_activity_progress (
    student_id,
    course_id,
    activity_type,
    activity_id,
    activity_title,
    status,
    progress_percentage,
    metric_value,
    last_activity_at,
    completed_at,
    metadata
  )
  SELECT
    p_student_id,
    cr.course_id,
    'resource',
    cr.id::TEXT,
    cr.title,
    CASE
      WHEN COALESCE(ra.downloaded, false) THEN 'completed'
      WHEN COALESCE(ra.viewed, false) THEN 'in_progress'
      ELSE 'not_started'
    END,
    CASE
      WHEN COALESCE(ra.downloaded, false) THEN 100
      WHEN COALESCE(ra.viewed, false) THEN 60
      ELSE 0
    END,
    CASE
      WHEN ra.interaction_count IS NULL THEN NULL
      ELSE ra.interaction_count::NUMERIC
    END,
    ra.last_activity_at,
    CASE
      WHEN COALESCE(ra.downloaded, false) THEN ra.last_activity_at
      ELSE NULL
    END,
    jsonb_build_object(
      'chapter_id', cr.chapter_id,
      'file_type', cr.file_type,
      'publish_at', cr.publish_at,
      'interactions', COALESCE(ra.interaction_count, 0),
      'downloads', COALESCE(ra.download_count, 0)
    )
  FROM public.course_resources cr
  LEFT JOIN resource_activity ra
    ON ra.resource_id = cr.id
  WHERE cr.course_id = ANY(v_course_ids)
    AND COALESCE(cr.status, 'published') = 'published'
    AND (cr.publish_at IS NULL OR cr.publish_at <= NOW());

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  v_activity_count := v_activity_count + v_inserted;

  WITH assignment_state AS (
    SELECT
      ca.id,
      ca.course_id,
      ca.title,
      ca.due_at,
      ca.late_until,
      ca.allow_late_submission,
      ca.max_points,
      sub.id AS submission_id,
      sub.status AS submission_status,
      sub.submitted_at,
      sub.updated_at AS submission_updated_at,
      sub.grade,
      sub.graded_at
    FROM public.course_assignments ca
    LEFT JOIN LATERAL (
      SELECT s.*
      FROM public.assignment_submissions s
      WHERE s.assignment_id = ca.id
        AND (s.student_id = p_student_id OR s.student_profile_id = v_profile_id)
      ORDER BY COALESCE(s.graded_at, s.submitted_at, s.updated_at) DESC NULLS LAST
      LIMIT 1
    ) sub ON TRUE
    WHERE ca.course_id = ANY(v_course_ids)
      AND COALESCE(ca.status, 'draft') IN ('published', 'closed', 'archived')
  )
  INSERT INTO public.course_activity_progress (
    student_id,
    course_id,
    activity_type,
    activity_id,
    activity_title,
    status,
    progress_percentage,
    metric_value,
    last_activity_at,
    completed_at,
    metadata
  )
  SELECT
    p_student_id,
    ass.course_id,
    'assignment',
    ass.id::TEXT,
    ass.title,
    CASE
      WHEN ass.submission_id IS NOT NULL THEN 'completed'
      WHEN ass.due_at IS NOT NULL
        AND ass.due_at < NOW()
        AND (
          ass.allow_late_submission = false
          OR (ass.late_until IS NOT NULL AND ass.late_until < NOW())
        ) THEN 'overdue'
      ELSE 'not_started'
    END,
    CASE
      WHEN ass.submission_id IS NOT NULL THEN 100
      ELSE 0
    END,
    ass.grade,
    COALESCE(ass.graded_at, ass.submitted_at, ass.submission_updated_at),
    CASE
      WHEN ass.submission_id IS NOT NULL THEN COALESCE(ass.submitted_at, ass.submission_updated_at)
      ELSE NULL
    END,
    jsonb_build_object(
      'due_at', ass.due_at,
      'late_until', ass.late_until,
      'allow_late_submission', ass.allow_late_submission,
      'submission_status', ass.submission_status,
      'max_points', ass.max_points,
      'grade', ass.grade
    )
  FROM assignment_state ass;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  v_activity_count := v_activity_count + v_inserted;

  WITH quiz_stats AS (
    SELECT
      pqa.quiz_id,
      COUNT(*)::INTEGER AS attempts_count,
      MAX(pqa.completed_at) AS last_activity_at,
      ROUND(AVG((pqa.percentage / 5.0)::NUMERIC), 2) AS average_score_on_twenty,
      ROUND(MAX((pqa.percentage / 5.0)::NUMERIC), 2) AS best_score_on_twenty,
      MAX(pqa.percentage) AS best_percentage
    FROM public.practice_quiz_attempts pqa
    WHERE pqa.student_id = v_profile_id
    GROUP BY pqa.quiz_id
  )
  INSERT INTO public.course_activity_progress (
    student_id,
    course_id,
    activity_type,
    activity_id,
    activity_title,
    status,
    progress_percentage,
    metric_value,
    last_activity_at,
    completed_at,
    metadata
  )
  SELECT
    p_student_id,
    pq.course_id,
    'practice_quiz',
    pq.id::TEXT,
    pq.title,
    CASE
      WHEN COALESCE(qs.attempts_count, 0) > 0 THEN 'completed'
      ELSE 'not_started'
    END,
    COALESCE(LEAST(100, GREATEST(0, ROUND(qs.best_percentage)))::INTEGER, 0),
    qs.best_score_on_twenty,
    qs.last_activity_at,
    CASE
      WHEN COALESCE(qs.attempts_count, 0) > 0 THEN qs.last_activity_at
      ELSE NULL
    END,
    jsonb_build_object(
      'difficulty', pq.difficulty,
      'duration_minutes', pq.duration_minutes,
      'attempts_count', COALESCE(qs.attempts_count, 0),
      'average_score_on_20', qs.average_score_on_twenty,
      'best_score_on_20', qs.best_score_on_twenty
    )
  FROM public.practice_quizzes pq
  LEFT JOIN quiz_stats qs
    ON qs.quiz_id = pq.id
  WHERE pq.course_id = ANY(v_course_ids)
    AND COALESCE(pq.is_active, true) = true;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  v_activity_count := v_activity_count + v_inserted;

  WITH interactive_state AS (
    SELECT
      ir.id,
      ir.course_id,
      ir.name,
      ir.resource_type,
      ir.duration_minutes,
      ir.difficulty,
      ir.is_mandatory,
      sip.started_at,
      sip.completed_at,
      sip.score,
      sip.time_spent,
      sip.attempts
    FROM public.interactive_resources ir
    LEFT JOIN public.student_interactive_progress sip
      ON sip.resource_id = ir.id
     AND sip.student_id = p_student_id
    WHERE ir.course_id = ANY(v_course_ids)
  )
  INSERT INTO public.course_activity_progress (
    student_id,
    course_id,
    activity_type,
    activity_id,
    activity_title,
    status,
    progress_percentage,
    metric_value,
    last_activity_at,
    completed_at,
    metadata
  )
  SELECT
    p_student_id,
    ir.course_id,
    'interactive_resource',
    ir.id::TEXT,
    ir.name,
    CASE
      WHEN ir.completed_at IS NOT NULL THEN 'completed'
      WHEN ir.started_at IS NOT NULL OR COALESCE(ir.time_spent, 0) > 0 OR COALESCE(ir.attempts, 0) > 0 THEN 'in_progress'
      ELSE 'not_started'
    END,
    CASE
      WHEN ir.completed_at IS NOT NULL THEN 100
      WHEN COALESCE(ir.time_spent, 0) > 0 AND COALESCE(ir.duration_minutes, 0) > 0 THEN
        LEAST(95, GREATEST(10, ROUND((ir.time_spent / ir.duration_minutes) * 100)))::INTEGER
      WHEN ir.started_at IS NOT NULL THEN 30
      ELSE 0
    END,
    ir.score,
    COALESCE(ir.completed_at, ir.started_at),
    ir.completed_at,
    jsonb_build_object(
      'resource_type', ir.resource_type,
      'duration_minutes', ir.duration_minutes,
      'difficulty', ir.difficulty,
      'is_mandatory', ir.is_mandatory,
      'attempts', COALESCE(ir.attempts, 0),
      'time_spent', COALESCE(ir.time_spent, 0),
      'score', ir.score
    )
  FROM interactive_state ir;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  v_activity_count := v_activity_count + v_inserted;

  WITH forum_state AS (
    SELECT
      f.id,
      f.course_id,
      COALESCE(posts.posts_count, 0) AS posts_count,
      COALESCE(replies.replies_count, 0) AS replies_count,
      CASE
        WHEN posts.last_post_at IS NULL THEN replies.last_reply_at
        WHEN replies.last_reply_at IS NULL THEN posts.last_post_at
        ELSE GREATEST(posts.last_post_at, replies.last_reply_at)
      END AS last_activity_at
    FROM public.forums f
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::INTEGER AS posts_count,
        MAX(fp.created_at) AS last_post_at
      FROM public.forum_posts fp
      WHERE fp.forum_id = f.id
        AND fp.author_id = v_profile_id
    ) posts ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::INTEGER AS replies_count,
        MAX(fr.created_at) AS last_reply_at
      FROM public.forum_replies fr
      JOIN public.forum_posts fp
        ON fp.id = fr.post_id
      WHERE fp.forum_id = f.id
        AND fr.author_id = v_profile_id
    ) replies ON TRUE
    WHERE f.course_id = ANY(v_course_ids)
  )
  INSERT INTO public.course_activity_progress (
    student_id,
    course_id,
    activity_type,
    activity_id,
    activity_title,
    status,
    progress_percentage,
    metric_value,
    last_activity_at,
    completed_at,
    metadata
  )
  SELECT
    p_student_id,
    fs.course_id,
    'forum',
    fs.id::TEXT,
    'Forum du cours',
    CASE
      WHEN fs.posts_count + fs.replies_count > 0 THEN 'completed'
      ELSE 'not_started'
    END,
    CASE
      WHEN fs.posts_count > 0 THEN 100
      WHEN fs.replies_count > 0 THEN 80
      ELSE 0
    END,
    (fs.posts_count + fs.replies_count)::NUMERIC,
    fs.last_activity_at,
    CASE
      WHEN fs.posts_count + fs.replies_count > 0 THEN fs.last_activity_at
      ELSE NULL
    END,
    jsonb_build_object(
      'posts_count', fs.posts_count,
      'replies_count', fs.replies_count
    )
  FROM forum_state fs;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  v_activity_count := v_activity_count + v_inserted;

  RETURN jsonb_build_object(
    'student_id', p_student_id,
    'course_ids', to_jsonb(v_course_ids),
    'activities_count', v_activity_count,
    'status', 'ok'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_student_course_analytics(
  p_student_id INTEGER,
  p_course_id INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
  v_course_ids INTEGER[];
  v_analytics_count INTEGER := 0;
BEGIN
  SELECT s.profile_id
  INTO v_profile_id
  FROM public.students s
  WHERE s.id = p_student_id;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object(
      'student_id', p_student_id,
      'course_ids', '[]'::jsonb,
      'analytics_count', 0,
      'status', 'student_not_found'
    );
  END IF;

  SELECT COALESCE(array_agg(DISTINCT sc.course_id), ARRAY[]::INTEGER[])
  INTO v_course_ids
  FROM public.student_courses sc
  WHERE (sc.student_entity_id = p_student_id OR sc.student_id = v_profile_id)
    AND (p_course_id IS NULL OR sc.course_id = p_course_id);

  IF p_course_id IS NOT NULL AND COALESCE(array_length(v_course_ids, 1), 0) = 0 THEN
    v_course_ids := ARRAY[p_course_id];
  ELSE
    v_course_ids := COALESCE(v_course_ids, ARRAY[]::INTEGER[]);
  END IF;

  IF COALESCE(array_length(v_course_ids, 1), 0) = 0 THEN
    RETURN jsonb_build_object(
      'student_id', p_student_id,
      'course_ids', '[]'::jsonb,
      'analytics_count', 0,
      'status', 'no_courses'
    );
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS tmp_student_learning_metrics (
    course_id INTEGER,
    academic_year VARCHAR(9),
    attendance_percentage NUMERIC(5,2),
    resources_viewed INTEGER,
    resources_downloaded INTEGER,
    forum_posts_count INTEGER,
    quiz_attempts INTEGER,
    quiz_avg_score NUMERIC(5,2),
    assignment_avg_score NUMERIC(5,2),
    continuous_assessment_avg NUMERIC(5,2),
    final_grade NUMERIC(5,2),
    predicted_grade NUMERIC(5,2),
    grade_trend VARCHAR(20),
    total_learning_hours NUMERIC(8,2),
    last_access TIMESTAMPTZ,
    risk_flag BOOLEAN,
    risk_reasons TEXT[],
    overdue_assignments INTEGER
  ) ON COMMIT DROP;

  TRUNCATE TABLE tmp_student_learning_metrics;

  INSERT INTO tmp_student_learning_metrics (
    course_id,
    academic_year,
    attendance_percentage,
    resources_viewed,
    resources_downloaded,
    forum_posts_count,
    quiz_attempts,
    quiz_avg_score,
    assignment_avg_score,
    continuous_assessment_avg,
    final_grade,
    predicted_grade,
    grade_trend,
    total_learning_hours,
    last_access,
    risk_flag,
    risk_reasons,
    overdue_assignments
  )
  WITH scoped_courses AS (
    SELECT DISTINCT
      sc.course_id,
      COALESCE(NULLIF(sc.academic_year, ''), public.current_academic_year_label()) AS academic_year
    FROM public.student_courses sc
    WHERE (sc.student_entity_id = p_student_id OR sc.student_id = v_profile_id)
      AND sc.course_id = ANY(v_course_ids)
  ),
  attendance_stats AS (
    SELECT
      cs.course_id,
      COUNT(*)::INTEGER AS total_sessions,
      COUNT(*) FILTER (WHERE a.status IN ('present', 'late', 'excused'))::INTEGER AS attended_sessions
    FROM public.attendances a
    JOIN public.course_sessions cs
      ON cs.id = a.session_id
    WHERE a.student_id = p_student_id
      AND cs.course_id = ANY(v_course_ids)
    GROUP BY cs.course_id
  ),
  resource_stats AS (
    SELECT
      cr.course_id,
      COUNT(DISTINCT ri.resource_id) FILTER (
        WHERE ri.interaction_type IN ('view', 'download')
      )::INTEGER AS resources_viewed,
      COUNT(DISTINCT ri.resource_id) FILTER (
        WHERE ri.interaction_type = 'download'
      )::INTEGER AS resources_downloaded
    FROM public.course_resources cr
    LEFT JOIN public.resource_interactions ri
      ON ri.resource_id = cr.id
     AND ri.user_id = v_profile_id
    WHERE cr.course_id = ANY(v_course_ids)
      AND COALESCE(cr.status, 'published') = 'published'
    GROUP BY cr.course_id
  ),
  forum_activity AS (
    SELECT
      f.course_id,
      COALESCE(posts.posts_count, 0) + COALESCE(replies.replies_count, 0) AS forum_posts_count
    FROM public.forums f
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::INTEGER AS posts_count
      FROM public.forum_posts fp
      WHERE fp.forum_id = f.id
        AND fp.author_id = v_profile_id
    ) posts ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::INTEGER AS replies_count
      FROM public.forum_replies fr
      JOIN public.forum_posts fp
        ON fp.id = fr.post_id
      WHERE fp.forum_id = f.id
        AND fr.author_id = v_profile_id
    ) replies ON TRUE
    WHERE f.course_id = ANY(v_course_ids)
  ),
  forum_stats AS (
    SELECT
      fa.course_id,
      SUM(fa.forum_posts_count)::INTEGER AS forum_posts_count
    FROM forum_activity fa
    GROUP BY fa.course_id
  ),
  quiz_stats AS (
    SELECT
      pq.course_id,
      COUNT(*)::INTEGER AS quiz_attempts,
      ROUND(AVG((pqa.percentage / 5.0)::NUMERIC), 2) AS quiz_avg_score
    FROM public.practice_quizzes pq
    JOIN public.practice_quiz_attempts pqa
      ON pqa.quiz_id = pq.id
    WHERE pq.course_id = ANY(v_course_ids)
      AND pqa.student_id = v_profile_id
    GROUP BY pq.course_id
  ),
  assignment_stats AS (
    SELECT
      ca.course_id,
      ROUND(
        AVG(
          CASE
            WHEN sub.grade IS NOT NULL AND ca.max_points > 0 THEN (sub.grade / ca.max_points) * 20
            ELSE NULL
          END
        )::NUMERIC,
        2
      ) AS assignment_avg_score
    FROM public.course_assignments ca
    LEFT JOIN public.assignment_submissions sub
      ON sub.assignment_id = ca.id
     AND (sub.student_id = p_student_id OR sub.student_profile_id = v_profile_id)
    WHERE ca.course_id = ANY(v_course_ids)
      AND COALESCE(ca.status, 'draft') IN ('published', 'closed', 'archived')
    GROUP BY ca.course_id
  ),
  grade_stats AS (
    SELECT
      g.course_id,
      ROUND(
        SUM(((g.value / NULLIF(g.max_value, 0)) * 20) * COALESCE(g.coefficient, 1))
        / NULLIF(SUM(COALESCE(g.coefficient, 1)), 0),
        2
      ) AS final_grade
    FROM public.grades g
    WHERE g.student_id = p_student_id
      AND g.course_id = ANY(v_course_ids)
    GROUP BY g.course_id
  ),
  learning_time_stats AS (
    SELECT
      learning_rows.course_id,
      ROUND(SUM(learning_rows.hours)::NUMERIC, 2) AS total_learning_hours
    FROM (
      SELECT
        ir.course_id,
        COALESCE(sip.time_spent, 0)::NUMERIC AS hours
      FROM public.interactive_resources ir
      JOIN public.student_interactive_progress sip
        ON sip.resource_id = ir.id
      WHERE sip.student_id = p_student_id
        AND ir.course_id = ANY(v_course_ids)

      UNION ALL

      SELECT
        lp.course_id,
        COALESCE(spp.time_spent, 0)::NUMERIC AS hours
      FROM public.student_path_progress spp
      JOIN public.learning_paths lp
        ON lp.id = spp.path_id
      WHERE spp.student_id = p_student_id
        AND lp.course_id = ANY(v_course_ids)
    ) learning_rows
    GROUP BY learning_rows.course_id
  ),
  activity_stats AS (
    SELECT
      cap.course_id,
      COUNT(*) FILTER (
        WHERE cap.activity_type = 'assignment' AND cap.status = 'overdue'
      )::INTEGER AS overdue_assignments,
      MAX(cap.last_activity_at) AS last_access
    FROM public.course_activity_progress cap
    WHERE cap.student_id = p_student_id
      AND cap.course_id = ANY(v_course_ids)
    GROUP BY cap.course_id
  ),
  base_metrics AS (
    SELECT
      sc.course_id,
      sc.academic_year,
      ROUND(
        COALESCE(
          (attendance.attended_sessions::NUMERIC / NULLIF(attendance.total_sessions, 0)) * 100,
          0
        ),
        2
      ) AS attendance_percentage,
      COALESCE(resource.resources_viewed, 0) AS resources_viewed,
      COALESCE(resource.resources_downloaded, 0) AS resources_downloaded,
      COALESCE(forum.forum_posts_count, 0) AS forum_posts_count,
      COALESCE(quiz.quiz_attempts, 0) AS quiz_attempts,
      quiz.quiz_avg_score,
      assignment.assignment_avg_score,
      assessment.continuous_assessment_avg,
      COALESCE(grade.final_grade, assessment.continuous_assessment_avg, prediction.predicted_grade) AS final_grade,
      COALESCE(prediction.predicted_grade, grade.final_grade, assessment.continuous_assessment_avg) AS predicted_grade,
      CASE
        WHEN grade.final_grade IS NULL OR prediction.predicted_grade IS NULL THEN NULL
        WHEN prediction.predicted_grade >= grade.final_grade + 1 THEN 'up'
        WHEN prediction.predicted_grade <= grade.final_grade - 1 THEN 'down'
        ELSE 'stable'
      END AS grade_trend,
      COALESCE(learning_time.total_learning_hours, 0) AS total_learning_hours,
      activity.last_access,
      COALESCE(activity.overdue_assignments, 0) AS overdue_assignments
    FROM scoped_courses sc
    LEFT JOIN attendance_stats attendance
      ON attendance.course_id = sc.course_id
    LEFT JOIN resource_stats resource
      ON resource.course_id = sc.course_id
    LEFT JOIN forum_stats forum
      ON forum.course_id = sc.course_id
    LEFT JOIN quiz_stats quiz
      ON quiz.course_id = sc.course_id
    LEFT JOIN assignment_stats assignment
      ON assignment.course_id = sc.course_id
    LEFT JOIN grade_stats grade
      ON grade.course_id = sc.course_id
    LEFT JOIN learning_time_stats learning_time
      ON learning_time.course_id = sc.course_id
    LEFT JOIN activity_stats activity
      ON activity.course_id = sc.course_id
    LEFT JOIN LATERAL (
      SELECT ROUND(AVG(metric)::NUMERIC, 2) AS predicted_grade
      FROM unnest(ARRAY[
        grade.final_grade,
        assignment.assignment_avg_score,
        quiz.quiz_avg_score
      ]::NUMERIC[]) metric
    ) prediction ON TRUE
    LEFT JOIN LATERAL (
      SELECT ROUND(AVG(metric)::NUMERIC, 2) AS continuous_assessment_avg
      FROM unnest(ARRAY[
        assignment.assignment_avg_score,
        quiz.quiz_avg_score
      ]::NUMERIC[]) metric
    ) assessment ON TRUE
  )
  SELECT
    bm.course_id,
    bm.academic_year,
    bm.attendance_percentage,
    bm.resources_viewed,
    bm.resources_downloaded,
    bm.forum_posts_count,
    bm.quiz_attempts,
    bm.quiz_avg_score,
    bm.assignment_avg_score,
    bm.continuous_assessment_avg,
    bm.final_grade,
    bm.predicted_grade,
    bm.grade_trend,
    bm.total_learning_hours,
    bm.last_access,
    COALESCE(array_length(risk.risk_reasons, 1), 0) > 0 AS risk_flag,
    risk.risk_reasons,
    bm.overdue_assignments
  FROM base_metrics bm
  LEFT JOIN LATERAL (
    SELECT ARRAY_REMOVE(ARRAY[
      CASE
        WHEN bm.attendance_percentage < 60 THEN 'attendance_below_60'
        ELSE NULL
      END,
      CASE
        WHEN bm.overdue_assignments > 0 THEN 'assignments_overdue'
        ELSE NULL
      END,
      CASE
        WHEN COALESCE(bm.predicted_grade, bm.final_grade, bm.continuous_assessment_avg, 20) < 10 THEN 'average_below_10'
        ELSE NULL
      END
    ], NULL) AS risk_reasons
  ) risk ON TRUE;

  INSERT INTO public.student_performance_analytics (
    student_id,
    course_id,
    academic_year,
    continuous_assessment_avg,
    final_grade,
    grade_trend,
    attendance_percentage,
    resources_viewed,
    resources_downloaded,
    forum_posts_count,
    quiz_attempts,
    quiz_avg_score,
    total_learning_hours,
    last_access,
    predicted_grade,
    risk_flag,
    risk_reasons,
    updated_at
  )
  SELECT
    p_student_id,
    tm.course_id,
    tm.academic_year,
    tm.continuous_assessment_avg,
    tm.final_grade,
    tm.grade_trend,
    tm.attendance_percentage,
    tm.resources_viewed,
    tm.resources_downloaded,
    tm.forum_posts_count,
    tm.quiz_attempts,
    tm.quiz_avg_score,
    tm.total_learning_hours,
    tm.last_access,
    tm.predicted_grade,
    tm.risk_flag,
    tm.risk_reasons,
    NOW()
  FROM tmp_student_learning_metrics tm
  ON CONFLICT (student_id, course_id, academic_year)
  DO UPDATE SET
    continuous_assessment_avg = EXCLUDED.continuous_assessment_avg,
    final_grade = EXCLUDED.final_grade,
    grade_trend = EXCLUDED.grade_trend,
    attendance_percentage = EXCLUDED.attendance_percentage,
    resources_viewed = EXCLUDED.resources_viewed,
    resources_downloaded = EXCLUDED.resources_downloaded,
    forum_posts_count = EXCLUDED.forum_posts_count,
    quiz_attempts = EXCLUDED.quiz_attempts,
    quiz_avg_score = EXCLUDED.quiz_avg_score,
    total_learning_hours = EXCLUDED.total_learning_hours,
    last_access = EXCLUDED.last_access,
    predicted_grade = EXCLUDED.predicted_grade,
    risk_flag = EXCLUDED.risk_flag,
    risk_reasons = EXCLUDED.risk_reasons,
    updated_at = NOW();

  GET DIAGNOSTICS v_analytics_count = ROW_COUNT;

  UPDATE public.student_alerts sa
  SET
    resolved = true,
    resolved_at = NOW()
  WHERE sa.student_id = p_student_id
    AND sa.origin = 'system'
    AND sa.related_course_id = ANY(v_course_ids)
    AND sa.alert_type IN ('low_attendance', 'no_submission', 'risk_failure')
    AND sa.resolved = false
    AND NOT EXISTS (
      SELECT 1
      FROM tmp_student_learning_metrics tm
      WHERE tm.course_id = sa.related_course_id
        AND (
          (sa.alert_type = 'low_attendance' AND tm.attendance_percentage < 60)
          OR (sa.alert_type = 'no_submission' AND tm.overdue_assignments > 0)
          OR (
            sa.alert_type = 'risk_failure'
            AND COALESCE(tm.predicted_grade, tm.final_grade, tm.continuous_assessment_avg, 20) < 10
          )
        )
    );

  UPDATE public.student_alerts sa
  SET
    severity = CASE
      WHEN sa.alert_type = 'low_attendance' AND tm.attendance_percentage < 40 THEN 'high'
      WHEN sa.alert_type = 'risk_failure' AND COALESCE(tm.predicted_grade, tm.final_grade, tm.continuous_assessment_avg, 20) < 8 THEN 'high'
      ELSE 'medium'
    END,
    description = CASE
      WHEN sa.alert_type = 'low_attendance' THEN 'Presence calculee a ' || COALESCE(ROUND(tm.attendance_percentage)::TEXT, '0') || '% sur ce cours.'
      WHEN sa.alert_type = 'no_submission' THEN COALESCE(tm.overdue_assignments, 0)::TEXT || ' activite(s) de type devoir sont en retard.'
      WHEN sa.alert_type = 'risk_failure' THEN 'La moyenne previsionnelle du cours est estimee a ' || COALESCE(TO_CHAR(tm.predicted_grade, 'FM90D0'), '0.0') || '/20.'
      ELSE sa.description
    END,
    triggered_at = NOW(),
    resolved = false,
    resolved_at = NULL
  FROM tmp_student_learning_metrics tm
  WHERE sa.student_id = p_student_id
    AND sa.origin = 'system'
    AND sa.related_course_id = tm.course_id
    AND sa.resolved = false
    AND (
      (sa.alert_type = 'low_attendance' AND tm.attendance_percentage < 60)
      OR (sa.alert_type = 'no_submission' AND tm.overdue_assignments > 0)
      OR (
        sa.alert_type = 'risk_failure'
        AND COALESCE(tm.predicted_grade, tm.final_grade, tm.continuous_assessment_avg, 20) < 10
      )
    );

  INSERT INTO public.student_alerts (
    student_id,
    alert_type,
    severity,
    related_course_id,
    description,
    triggered_at,
    resolved,
    origin
  )
  SELECT
    p_student_id,
    'low_attendance',
    CASE
      WHEN tm.attendance_percentage < 40 THEN 'high'
      ELSE 'medium'
    END,
    tm.course_id,
    'Presence calculee a ' || COALESCE(ROUND(tm.attendance_percentage)::TEXT, '0') || '% sur ce cours.',
    NOW(),
    false,
    'system'
  FROM tmp_student_learning_metrics tm
  WHERE tm.attendance_percentage < 60
    AND NOT EXISTS (
      SELECT 1
      FROM public.student_alerts sa
      WHERE sa.student_id = p_student_id
        AND sa.related_course_id = tm.course_id
        AND sa.alert_type = 'low_attendance'
        AND sa.origin = 'system'
        AND sa.resolved = false
    );

  INSERT INTO public.student_alerts (
    student_id,
    alert_type,
    severity,
    related_course_id,
    description,
    triggered_at,
    resolved,
    origin
  )
  SELECT
    p_student_id,
    'no_submission',
    CASE
      WHEN tm.overdue_assignments >= 2 THEN 'high'
      ELSE 'medium'
    END,
    tm.course_id,
    COALESCE(tm.overdue_assignments, 0)::TEXT || ' activite(s) de type devoir sont en retard.',
    NOW(),
    false,
    'system'
  FROM tmp_student_learning_metrics tm
  WHERE tm.overdue_assignments > 0
    AND NOT EXISTS (
      SELECT 1
      FROM public.student_alerts sa
      WHERE sa.student_id = p_student_id
        AND sa.related_course_id = tm.course_id
        AND sa.alert_type = 'no_submission'
        AND sa.origin = 'system'
        AND sa.resolved = false
    );

  INSERT INTO public.student_alerts (
    student_id,
    alert_type,
    severity,
    related_course_id,
    description,
    triggered_at,
    resolved,
    origin
  )
  SELECT
    p_student_id,
    'risk_failure',
    CASE
      WHEN COALESCE(tm.predicted_grade, tm.final_grade, tm.continuous_assessment_avg, 20) < 8 THEN 'high'
      ELSE 'medium'
    END,
    tm.course_id,
    'La moyenne previsionnelle du cours est estimee a ' || COALESCE(TO_CHAR(tm.predicted_grade, 'FM90D0'), '0.0') || '/20.',
    NOW(),
    false,
    'system'
  FROM tmp_student_learning_metrics tm
  WHERE COALESCE(tm.predicted_grade, tm.final_grade, tm.continuous_assessment_avg, 20) < 10
    AND NOT EXISTS (
      SELECT 1
      FROM public.student_alerts sa
      WHERE sa.student_id = p_student_id
        AND sa.related_course_id = tm.course_id
        AND sa.alert_type = 'risk_failure'
        AND sa.origin = 'system'
        AND sa.resolved = false
    );

  RETURN jsonb_build_object(
    'student_id', p_student_id,
    'course_ids', to_jsonb(v_course_ids),
    'analytics_count', v_analytics_count,
    'status', 'ok'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_student_learning_metrics(
  p_student_id INTEGER,
  p_course_id INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity JSONB;
  v_analytics JSONB;
BEGIN
  v_activity := public.refresh_student_course_activity_progress(p_student_id, p_course_id);
  v_analytics := public.refresh_student_course_analytics(p_student_id, p_course_id);

  RETURN jsonb_build_object(
    'activity', v_activity,
    'analytics', v_analytics
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.current_academic_year_label() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_student_course_activity_progress(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_student_course_analytics(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_student_learning_metrics(INTEGER, INTEGER) TO authenticated;
