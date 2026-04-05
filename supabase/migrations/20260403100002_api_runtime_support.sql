-- Runtime support for remaining client API surfaces:
-- - quiz_results / active_students / cheating_attempts
-- - forum like counters
-- - course resource download counters
-- - exam statistics RPC

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS active_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ,
  last_ping TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  cheating_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, exam_id)
);

CREATE TABLE IF NOT EXISTS cheating_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_exam_id INTEGER REFERENCES student_exams(id) ON DELETE SET NULL,
  details TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  score NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  completion_time INTEGER,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  cheating_attempts INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, exam_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_resource_interactions_unique
  ON resource_interactions(resource_id, user_id, interaction_type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_forum_likes_post_unique
  ON forum_likes(user_id, post_id)
  WHERE post_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_forum_likes_reply_unique
  ON forum_likes(user_id, reply_id)
  WHERE reply_id IS NOT NULL;

CREATE OR REPLACE FUNCTION set_runtime_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_active_students_updated_at ON active_students;
CREATE TRIGGER trigger_active_students_updated_at
BEFORE UPDATE ON active_students
FOR EACH ROW EXECUTE FUNCTION set_runtime_updated_at();

DROP TRIGGER IF EXISTS trigger_quiz_results_updated_at ON quiz_results;
CREATE TRIGGER trigger_quiz_results_updated_at
BEFORE UPDATE ON quiz_results
FOR EACH ROW EXECUTE FUNCTION set_runtime_updated_at();

CREATE OR REPLACE FUNCTION increment_download_count(rid UUID)
RETURNS void AS $$
BEGIN
  UPDATE course_resources
  SET downloads_count = COALESCE(downloads_count, 0) + 1,
      updated_at = NOW()
  WHERE id = rid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_post_likes(pid UUID)
RETURNS void AS $$
BEGIN
  UPDATE forum_posts
  SET likes_count = COALESCE(likes_count, 0) + 1,
      updated_at = NOW()
  WHERE id = pid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_post_likes(pid UUID)
RETURNS void AS $$
BEGIN
  UPDATE forum_posts
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0),
      updated_at = NOW()
  WHERE id = pid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_reply_likes(rid UUID)
RETURNS void AS $$
BEGIN
  UPDATE forum_replies
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = rid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_reply_likes(rid UUID)
RETURNS void AS $$
BEGIN
  UPDATE forum_replies
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
  WHERE id = rid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_exam_class_statistics(p_exam_id INTEGER)
RETURNS TABLE (
  average NUMERIC,
  highest NUMERIC,
  lowest NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH canonical_grades AS (
    SELECT
      COALESCE(se.student_id::TEXT, er.student_id::TEXT) AS student_key,
      COALESCE(se.grade, er.grade)::NUMERIC AS grade
    FROM student_exams se
    FULL OUTER JOIN exam_results er
      ON er.exam_id = se.exam_id
     AND er.student_id = se.student_id
    WHERE COALESCE(se.exam_id, er.exam_id) = p_exam_id
      AND COALESCE(se.grade, er.grade) IS NOT NULL
  ),
  runtime_grades AS (
    SELECT
      qr.student_id::TEXT AS student_key,
      qr.score::NUMERIC AS grade
    FROM quiz_results qr
    WHERE qr.exam_id = p_exam_id
  ),
  merged_grades AS (
    SELECT student_key, grade FROM canonical_grades
    UNION
    SELECT student_key, grade FROM runtime_grades
  )
  SELECT
    COALESCE(ROUND(AVG(grade), 2), 0)::NUMERIC,
    COALESCE(MAX(grade), 0)::NUMERIC,
    COALESCE(MIN(grade), 0)::NUMERIC
  FROM merged_grades;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE active_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheating_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS active_students_student_self ON active_students;
CREATE POLICY active_students_student_self ON active_students
FOR ALL TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS active_students_staff_read ON active_students;
CREATE POLICY active_students_staff_read ON active_students
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'professor')
  )
);

DROP POLICY IF EXISTS active_students_staff_update ON active_students;
CREATE POLICY active_students_staff_update ON active_students
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'professor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'professor')
  )
);

DROP POLICY IF EXISTS cheating_attempts_student_self ON cheating_attempts;
CREATE POLICY cheating_attempts_student_self ON cheating_attempts
FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS cheating_attempts_staff_read ON cheating_attempts;
CREATE POLICY cheating_attempts_staff_read ON cheating_attempts
FOR SELECT TO authenticated
USING (
  student_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'professor')
  )
);

DROP POLICY IF EXISTS quiz_results_student_self ON quiz_results;
CREATE POLICY quiz_results_student_self ON quiz_results
FOR ALL TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS quiz_results_staff_read ON quiz_results;
CREATE POLICY quiz_results_staff_read ON quiz_results
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'professor')
  )
);
