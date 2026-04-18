-- ESGIS Campus - Course completion settings and professor insights
-- Adds configurable completion rules per course and refresh helpers for professor dashboards.

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

CREATE TABLE IF NOT EXISTS public.course_completion_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id INTEGER NOT NULL UNIQUE REFERENCES public.courses(id) ON DELETE CASCADE,
  resource_completion_mode TEXT NOT NULL DEFAULT 'view'
    CHECK (resource_completion_mode IN ('view', 'download')),
  assignment_completion_mode TEXT NOT NULL DEFAULT 'submission'
    CHECK (assignment_completion_mode IN ('submission', 'graded')),
  forum_completion_mode TEXT NOT NULL DEFAULT 'reply_or_post'
    CHECK (forum_completion_mode IN ('none', 'reply', 'post', 'reply_or_post')),
  forum_target_count INTEGER NOT NULL DEFAULT 1
    CHECK (forum_target_count >= 0),
  quiz_completion_threshold INTEGER NOT NULL DEFAULT 50
    CHECK (quiz_completion_threshold > 0 AND quiz_completion_threshold <= 100),
  interactive_completion_threshold INTEGER NOT NULL DEFAULT 70
    CHECK (interactive_completion_threshold > 0 AND interactive_completion_threshold <= 100),
  attendance_alert_threshold INTEGER NOT NULL DEFAULT 60
    CHECK (attendance_alert_threshold >= 0 AND attendance_alert_threshold <= 100),
  assignment_overdue_alert_threshold INTEGER NOT NULL DEFAULT 1
    CHECK (assignment_overdue_alert_threshold > 0),
  passing_grade_threshold NUMERIC(4,2) NOT NULL DEFAULT 10.00
    CHECK (passing_grade_threshold >= 0 AND passing_grade_threshold <= 20),
  course_progress_weights JSONB NOT NULL DEFAULT
    '{"resource":20,"assignment":30,"practice_quiz":20,"interactive_resource":20,"forum":10}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_completion_settings_course
  ON public.course_completion_settings(course_id);

CREATE INDEX IF NOT EXISTS idx_course_completion_settings_updated_by
  ON public.course_completion_settings(updated_by);

DROP TRIGGER IF EXISTS course_completion_settings_updated_at ON public.course_completion_settings;
CREATE TRIGGER course_completion_settings_updated_at
BEFORE UPDATE ON public.course_completion_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

ALTER TABLE public.course_completion_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS course_completion_settings_student_read_policy ON public.course_completion_settings;
CREATE POLICY course_completion_settings_student_read_policy
ON public.course_completion_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.student_courses sc
    JOIN public.students s
      ON s.id = sc.student_entity_id
    WHERE sc.course_id = course_completion_settings.course_id
      AND s.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS course_completion_settings_professor_manage_policy ON public.course_completion_settings;
CREATE POLICY course_completion_settings_professor_manage_policy
ON public.course_completion_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.professor_courses pc
    WHERE pc.course_id = course_completion_settings.course_id
      AND pc.professor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.professor_courses pc
    WHERE pc.course_id = course_completion_settings.course_id
      AND pc.professor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS course_completion_settings_admin_manage_policy ON public.course_completion_settings;
CREATE POLICY course_completion_settings_admin_manage_policy
ON public.course_completion_settings
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

  CREATE TEMP TABLE IF NOT EXISTS tmp_course_completion_settings (
    course_id INTEGER PRIMARY KEY,
    resource_completion_mode TEXT,
    assignment_completion_mode TEXT,
    forum_completion_mode TEXT,
    forum_target_count INTEGER,
    quiz_completion_threshold INTEGER,
    interactive_completion_threshold INTEGER,
    attendance_alert_threshold INTEGER,
    assignment_overdue_alert_threshold INTEGER,
    passing_grade_threshold NUMERIC(5,2)
  ) ON COMMIT DROP;

  TRUNCATE TABLE tmp_course_completion_settings;

  INSERT INTO tmp_course_completion_settings (
    course_id,
    resource_completion_mode,
    assignment_completion_mode,
    forum_completion_mode,
    forum_target_count,
    quiz_completion_threshold,
    interactive_completion_threshold,
    attendance_alert_threshold,
    assignment_overdue_alert_threshold,
    passing_grade_threshold
  )
  SELECT
    scope_course.course_id,
    COALESCE(ccs.resource_completion_mode, 'view'),
    COALESCE(ccs.assignment_completion_mode, 'submission'),
    COALESCE(ccs.forum_completion_mode, 'reply_or_post'),
    GREATEST(COALESCE(ccs.forum_target_count, 1), 0),
    GREATEST(COALESCE(ccs.quiz_completion_threshold, 50), 1),
    GREATEST(COALESCE(ccs.interactive_completion_threshold, 70), 1),
    GREATEST(COALESCE(ccs.attendance_alert_threshold, 60), 0),
    GREATEST(COALESCE(ccs.assignment_overdue_alert_threshold, 1), 1),
    COALESCE(ccs.passing_grade_threshold, 10.00)
  FROM unnest(v_course_ids) AS scope_course(course_id)
  LEFT JOIN public.course_completion_settings ccs
    ON ccs.course_id = scope_course.course_id;

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
      WHEN tcs.resource_completion_mode = 'download' AND COALESCE(ra.downloaded, false) THEN 'completed'
      WHEN tcs.resource_completion_mode = 'view' AND (COALESCE(ra.viewed, false) OR COALESCE(ra.downloaded, false)) THEN 'completed'
      WHEN COALESCE(ra.viewed, false) OR COALESCE(ra.downloaded, false) THEN 'in_progress'
      ELSE 'not_started'
    END,
    CASE
      WHEN tcs.resource_completion_mode = 'download' AND COALESCE(ra.downloaded, false) THEN 100
      WHEN tcs.resource_completion_mode = 'view' AND (COALESCE(ra.viewed, false) OR COALESCE(ra.downloaded, false)) THEN 100
      WHEN COALESCE(ra.viewed, false) OR COALESCE(ra.downloaded, false) THEN 60
      ELSE 0
    END,
    CASE
      WHEN ra.interaction_count IS NULL THEN NULL
      ELSE ra.interaction_count::NUMERIC
    END,
    ra.last_activity_at,
    CASE
      WHEN tcs.resource_completion_mode = 'download' AND COALESCE(ra.downloaded, false) THEN ra.last_activity_at
      WHEN tcs.resource_completion_mode = 'view' AND (COALESCE(ra.viewed, false) OR COALESCE(ra.downloaded, false)) THEN ra.last_activity_at
      ELSE NULL
    END,
    jsonb_build_object(
      'chapter_id', cr.chapter_id,
      'file_type', cr.file_type,
      'publish_at', cr.publish_at,
      'completion_rule', tcs.resource_completion_mode,
      'interactions', COALESCE(ra.interaction_count, 0),
      'downloads', COALESCE(ra.download_count, 0)
    )
  FROM public.course_resources cr
  JOIN tmp_course_completion_settings tcs
    ON tcs.course_id = cr.course_id
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
      WHEN tcs.assignment_completion_mode = 'graded' AND ass.grade IS NOT NULL THEN 'completed'
      WHEN tcs.assignment_completion_mode = 'submission' AND ass.submission_id IS NOT NULL THEN 'completed'
      WHEN ass.submission_id IS NOT NULL THEN 'in_progress'
      WHEN ass.due_at IS NOT NULL
        AND ass.due_at < NOW()
        AND (
          ass.allow_late_submission = false
          OR (ass.late_until IS NOT NULL AND ass.late_until < NOW())
        ) THEN 'overdue'
      ELSE 'not_started'
    END,
    CASE
      WHEN tcs.assignment_completion_mode = 'graded' AND ass.grade IS NOT NULL THEN 100
      WHEN tcs.assignment_completion_mode = 'submission' AND ass.submission_id IS NOT NULL THEN 100
      WHEN ass.submission_id IS NOT NULL THEN 70
      ELSE 0
    END,
    ass.grade,
    COALESCE(ass.graded_at, ass.submitted_at, ass.submission_updated_at),
    CASE
      WHEN tcs.assignment_completion_mode = 'graded' AND ass.grade IS NOT NULL THEN COALESCE(ass.graded_at, ass.submitted_at, ass.submission_updated_at)
      WHEN tcs.assignment_completion_mode = 'submission' AND ass.submission_id IS NOT NULL THEN COALESCE(ass.submitted_at, ass.submission_updated_at)
      ELSE NULL
    END,
    jsonb_build_object(
      'due_at', ass.due_at,
      'late_until', ass.late_until,
      'allow_late_submission', ass.allow_late_submission,
      'submission_status', ass.submission_status,
      'completion_rule', tcs.assignment_completion_mode,
      'max_points', ass.max_points,
      'grade', ass.grade
    )
  FROM assignment_state ass
  JOIN tmp_course_completion_settings tcs
    ON tcs.course_id = ass.course_id;

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
      WHEN COALESCE(qs.attempts_count, 0) > 0
        AND COALESCE(qs.best_percentage, 0) >= tcs.quiz_completion_threshold THEN 'completed'
      WHEN COALESCE(qs.attempts_count, 0) > 0 THEN 'in_progress'
      ELSE 'not_started'
    END,
    CASE
      WHEN COALESCE(qs.attempts_count, 0) = 0 THEN 0
      WHEN COALESCE(qs.best_percentage, 0) >= tcs.quiz_completion_threshold THEN 100
      ELSE LEAST(
        99,
        ROUND((COALESCE(qs.best_percentage, 0)::NUMERIC / NULLIF(tcs.quiz_completion_threshold, 0)) * 100)
      )::INTEGER
    END,
    qs.best_score_on_twenty,
    qs.last_activity_at,
    CASE
      WHEN COALESCE(qs.attempts_count, 0) > 0
        AND COALESCE(qs.best_percentage, 0) >= tcs.quiz_completion_threshold THEN qs.last_activity_at
      ELSE NULL
    END,
    jsonb_build_object(
      'difficulty', pq.difficulty,
      'duration_minutes', pq.duration_minutes,
      'completion_threshold', tcs.quiz_completion_threshold,
      'attempts_count', COALESCE(qs.attempts_count, 0),
      'average_score_on_20', qs.average_score_on_twenty,
      'best_score_on_20', qs.best_score_on_twenty,
      'best_percentage', COALESCE(qs.best_percentage, 0)
    )
  FROM public.practice_quizzes pq
  JOIN tmp_course_completion_settings tcs
    ON tcs.course_id = pq.course_id
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
      sip.attempts,
      CASE
        WHEN sip.completed_at IS NOT NULL THEN 100
        WHEN COALESCE(sip.time_spent, 0) > 0 AND COALESCE(ir.duration_minutes, 0) > 0 THEN
          LEAST(100, ROUND((sip.time_spent / ir.duration_minutes) * 100))::INTEGER
        WHEN sip.started_at IS NOT NULL OR COALESCE(sip.attempts, 0) > 0 THEN 25
        ELSE 0
      END AS raw_progress_percentage
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
      WHEN ir.raw_progress_percentage >= tcs.interactive_completion_threshold THEN 'completed'
      WHEN ir.started_at IS NOT NULL OR COALESCE(ir.time_spent, 0) > 0 OR COALESCE(ir.attempts, 0) > 0 THEN 'in_progress'
      ELSE 'not_started'
    END,
    CASE
      WHEN ir.completed_at IS NOT NULL THEN 100
      WHEN ir.raw_progress_percentage >= tcs.interactive_completion_threshold THEN 100
      WHEN ir.raw_progress_percentage > 0 THEN LEAST(
        99,
        ROUND((ir.raw_progress_percentage::NUMERIC / NULLIF(tcs.interactive_completion_threshold, 0)) * 100)
      )::INTEGER
      ELSE 0
    END,
    ir.score,
    COALESCE(ir.completed_at, ir.started_at),
    CASE
      WHEN ir.completed_at IS NOT NULL OR ir.raw_progress_percentage >= tcs.interactive_completion_threshold THEN COALESCE(ir.completed_at, ir.started_at)
      ELSE NULL
    END,
    jsonb_build_object(
      'resource_type', ir.resource_type,
      'duration_minutes', ir.duration_minutes,
      'difficulty', ir.difficulty,
      'is_mandatory', ir.is_mandatory,
      'attempts', COALESCE(ir.attempts, 0),
      'time_spent', COALESCE(ir.time_spent, 0),
      'score', ir.score,
      'completion_threshold', tcs.interactive_completion_threshold,
      'raw_progress_percentage', ir.raw_progress_percentage
    )
  FROM interactive_state ir
  JOIN tmp_course_completion_settings tcs
    ON tcs.course_id = ir.course_id;

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
  ),
  forum_progress AS (
    SELECT
      fs.*,
      tcs.forum_completion_mode,
      tcs.forum_target_count,
      CASE
        WHEN tcs.forum_completion_mode = 'reply' THEN fs.replies_count
        WHEN tcs.forum_completion_mode = 'post' THEN fs.posts_count
        WHEN tcs.forum_completion_mode = 'none' THEN GREATEST(tcs.forum_target_count, 1)
        ELSE fs.posts_count + fs.replies_count
      END AS contribution_count
    FROM forum_state fs
    JOIN tmp_course_completion_settings tcs
      ON tcs.course_id = fs.course_id
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
    fp.course_id,
    'forum',
    fp.id::TEXT,
    'Forum du cours',
    CASE
      WHEN fp.forum_completion_mode = 'none' THEN 'completed'
      WHEN fp.forum_target_count = 0 THEN 'completed'
      WHEN fp.contribution_count >= fp.forum_target_count THEN 'completed'
      WHEN fp.posts_count + fp.replies_count > 0 THEN 'in_progress'
      ELSE 'not_started'
    END,
    CASE
      WHEN fp.forum_completion_mode = 'none' THEN 100
      WHEN fp.forum_target_count = 0 THEN 100
      WHEN fp.contribution_count >= fp.forum_target_count THEN 100
      WHEN fp.contribution_count > 0 THEN LEAST(
        99,
        ROUND((fp.contribution_count::NUMERIC / NULLIF(fp.forum_target_count, 0)) * 100)
      )::INTEGER
      ELSE 0
    END,
    fp.contribution_count::NUMERIC,
    fp.last_activity_at,
    CASE
      WHEN fp.forum_completion_mode = 'none' THEN NOW()
      WHEN fp.forum_target_count = 0 THEN NOW()
      WHEN fp.contribution_count >= fp.forum_target_count THEN fp.last_activity_at
      ELSE NULL
    END,
    jsonb_build_object(
      'completion_rule', fp.forum_completion_mode,
      'target_count', fp.forum_target_count,
      'posts_count', fp.posts_count,
      'replies_count', fp.replies_count
    )
  FROM forum_progress fp;

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

  CREATE TEMP TABLE IF NOT EXISTS tmp_course_completion_settings (
    course_id INTEGER PRIMARY KEY,
    resource_completion_mode TEXT,
    assignment_completion_mode TEXT,
    forum_completion_mode TEXT,
    forum_target_count INTEGER,
    quiz_completion_threshold INTEGER,
    interactive_completion_threshold INTEGER,
    attendance_alert_threshold INTEGER,
    assignment_overdue_alert_threshold INTEGER,
    passing_grade_threshold NUMERIC(5,2)
  ) ON COMMIT DROP;

  TRUNCATE TABLE tmp_course_completion_settings;

  INSERT INTO tmp_course_completion_settings (
    course_id,
    resource_completion_mode,
    assignment_completion_mode,
    forum_completion_mode,
    forum_target_count,
    quiz_completion_threshold,
    interactive_completion_threshold,
    attendance_alert_threshold,
    assignment_overdue_alert_threshold,
    passing_grade_threshold
  )
  SELECT
    scope_course.course_id,
    COALESCE(ccs.resource_completion_mode, 'view'),
    COALESCE(ccs.assignment_completion_mode, 'submission'),
    COALESCE(ccs.forum_completion_mode, 'reply_or_post'),
    GREATEST(COALESCE(ccs.forum_target_count, 1), 0),
    GREATEST(COALESCE(ccs.quiz_completion_threshold, 50), 1),
    GREATEST(COALESCE(ccs.interactive_completion_threshold, 70), 1),
    GREATEST(COALESCE(ccs.attendance_alert_threshold, 60), 0),
    GREATEST(COALESCE(ccs.assignment_overdue_alert_threshold, 1), 1),
    COALESCE(ccs.passing_grade_threshold, 10.00)
  FROM unnest(v_course_ids) AS scope_course(course_id)
  LEFT JOIN public.course_completion_settings ccs
    ON ccs.course_id = scope_course.course_id;

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
    overdue_assignments INTEGER,
    attendance_alert_threshold INTEGER,
    assignment_overdue_alert_threshold INTEGER,
    passing_grade_threshold NUMERIC(5,2)
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
    overdue_assignments,
    attendance_alert_threshold,
    assignment_overdue_alert_threshold,
    passing_grade_threshold
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
      tcs.attendance_alert_threshold,
      tcs.assignment_overdue_alert_threshold,
      tcs.passing_grade_threshold,
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
    JOIN tmp_course_completion_settings tcs
      ON tcs.course_id = sc.course_id
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
    bm.overdue_assignments,
    bm.attendance_alert_threshold,
    bm.assignment_overdue_alert_threshold,
    bm.passing_grade_threshold
  FROM base_metrics bm
  LEFT JOIN LATERAL (
    SELECT ARRAY_REMOVE(ARRAY[
      CASE
        WHEN bm.attendance_percentage < bm.attendance_alert_threshold THEN 'attendance_below_threshold'
        ELSE NULL
      END,
      CASE
        WHEN bm.overdue_assignments >= bm.assignment_overdue_alert_threshold THEN 'assignments_overdue'
        ELSE NULL
      END,
      CASE
        WHEN bm.quiz_avg_score IS NOT NULL AND bm.quiz_avg_score < bm.passing_grade_threshold THEN 'quiz_below_threshold'
        ELSE NULL
      END,
      CASE
        WHEN COALESCE(bm.predicted_grade, bm.final_grade, bm.continuous_assessment_avg, 20) < bm.passing_grade_threshold THEN 'average_below_threshold'
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
          (sa.alert_type = 'low_attendance' AND tm.attendance_percentage < tm.attendance_alert_threshold)
          OR (sa.alert_type = 'no_submission' AND tm.overdue_assignments >= tm.assignment_overdue_alert_threshold)
          OR (
            sa.alert_type = 'risk_failure'
            AND COALESCE(tm.predicted_grade, tm.final_grade, tm.continuous_assessment_avg, 20) < tm.passing_grade_threshold
          )
        )
    );

  UPDATE public.student_alerts sa
  SET
    severity = CASE
      WHEN sa.alert_type = 'low_attendance' AND tm.attendance_percentage < GREATEST(tm.attendance_alert_threshold - 20, 0) THEN 'high'
      WHEN sa.alert_type = 'risk_failure' AND COALESCE(tm.predicted_grade, tm.final_grade, tm.continuous_assessment_avg, 20) < GREATEST(tm.passing_grade_threshold - 2, 0) THEN 'high'
      WHEN sa.alert_type = 'no_submission' AND tm.overdue_assignments >= tm.assignment_overdue_alert_threshold + 1 THEN 'high'
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
      (sa.alert_type = 'low_attendance' AND tm.attendance_percentage < tm.attendance_alert_threshold)
      OR (sa.alert_type = 'no_submission' AND tm.overdue_assignments >= tm.assignment_overdue_alert_threshold)
      OR (
        sa.alert_type = 'risk_failure'
        AND COALESCE(tm.predicted_grade, tm.final_grade, tm.continuous_assessment_avg, 20) < tm.passing_grade_threshold
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
      WHEN tm.attendance_percentage < GREATEST(tm.attendance_alert_threshold - 20, 0) THEN 'high'
      ELSE 'medium'
    END,
    tm.course_id,
    'Presence calculee a ' || COALESCE(ROUND(tm.attendance_percentage)::TEXT, '0') || '% sur ce cours.',
    NOW(),
    false,
    'system'
  FROM tmp_student_learning_metrics tm
  WHERE tm.attendance_percentage < tm.attendance_alert_threshold
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
      WHEN tm.overdue_assignments >= tm.assignment_overdue_alert_threshold + 1 THEN 'high'
      ELSE 'medium'
    END,
    tm.course_id,
    COALESCE(tm.overdue_assignments, 0)::TEXT || ' activite(s) de type devoir sont en retard.',
    NOW(),
    false,
    'system'
  FROM tmp_student_learning_metrics tm
  WHERE tm.overdue_assignments >= tm.assignment_overdue_alert_threshold
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
      WHEN COALESCE(tm.predicted_grade, tm.final_grade, tm.continuous_assessment_avg, 20) < GREATEST(tm.passing_grade_threshold - 2, 0) THEN 'high'
      ELSE 'medium'
    END,
    tm.course_id,
    'La moyenne previsionnelle du cours est estimee a ' || COALESCE(TO_CHAR(tm.predicted_grade, 'FM90D0'), '0.0') || '/20.',
    NOW(),
    false,
    'system'
  FROM tmp_student_learning_metrics tm
  WHERE COALESCE(tm.predicted_grade, tm.final_grade, tm.continuous_assessment_avg, 20) < tm.passing_grade_threshold
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

CREATE OR REPLACE FUNCTION public.refresh_course_learning_metrics(
  p_course_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
  v_students_refreshed INTEGER := 0;
BEGIN
  FOR v_student IN
    SELECT DISTINCT sc.student_entity_id AS student_id
    FROM public.student_courses sc
    WHERE sc.course_id = p_course_id
      AND sc.student_entity_id IS NOT NULL
  LOOP
    PERFORM public.refresh_student_learning_metrics(v_student.student_id, p_course_id);
    v_students_refreshed := v_students_refreshed + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'course_id', p_course_id,
    'students_refreshed', v_students_refreshed,
    'status', 'ok'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_professor_learning_metrics(
  p_professor_profile_id UUID,
  p_course_id INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_ids INTEGER[];
  v_course_id INTEGER;
  v_students_refreshed INTEGER := 0;
  v_course_result JSONB;
BEGIN
  SELECT COALESCE(array_agg(DISTINCT pc.course_id), ARRAY[]::INTEGER[])
  INTO v_course_ids
  FROM public.professor_courses pc
  WHERE pc.professor_id = p_professor_profile_id
    AND (p_course_id IS NULL OR pc.course_id = p_course_id);

  IF COALESCE(array_length(v_course_ids, 1), 0) = 0 THEN
    RETURN jsonb_build_object(
      'course_ids', '[]'::jsonb,
      'courses_refreshed', 0,
      'students_refreshed', 0,
      'status', 'no_courses'
    );
  END IF;

  FOREACH v_course_id IN ARRAY v_course_ids
  LOOP
    v_course_result := public.refresh_course_learning_metrics(v_course_id);
    v_students_refreshed := v_students_refreshed + COALESCE((v_course_result ->> 'students_refreshed')::INTEGER, 0);
  END LOOP;

  RETURN jsonb_build_object(
    'course_ids', to_jsonb(v_course_ids),
    'courses_refreshed', COALESCE(array_length(v_course_ids, 1), 0),
    'students_refreshed', v_students_refreshed,
    'status', 'ok'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_course_learning_metrics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_professor_learning_metrics(UUID, INTEGER) TO authenticated;
