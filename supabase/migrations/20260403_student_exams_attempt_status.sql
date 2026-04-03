ALTER TABLE IF EXISTS student_exams
ADD COLUMN IF NOT EXISTS attempt_status VARCHAR(20) NOT NULL DEFAULT 'not_started';

ALTER TABLE IF EXISTS student_exams
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

COMMENT ON COLUMN student_exams.attempt_status IS 'not_started, in_progress, submitted';
