-- ============================================================================
-- MIGRATION PHASE 2: Blocs 3-6 (Resources, Analytics, Exams, Communication)
-- Date: 2026-04-05
-- ============================================================================

BEGIN TRANSACTION;

/*
 ======================================================
 BLOC 3: RESSOURCES AVANCÉES & VERSIONING (3 relations)
 ======================================================
*/

CREATE TABLE IF NOT EXISTS resource_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID NOT NULL REFERENCES course_resources(id),
  version_number INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  change_summary TEXT,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  change_type TEXT DEFAULT 'update' CHECK (change_type IN ('create', 'update', 'correction', 'archive')),
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resource_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_resource_versions_resource ON resource_versions(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_versions_version ON resource_versions(resource_id, version_number DESC);

CREATE TABLE IF NOT EXISTS resource_content_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  name TEXT NOT NULL,
  description TEXT,
  release_date DATE,
  status VARCHAR(20) DEFAULT 'preparing' CHECK (status IN ('preparing', 'ready', 'published', 'archived')),
  contains_resources UUID[],
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_packages_course ON resource_content_packages(course_id);

CREATE TABLE IF NOT EXISTS interactive_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  chapter_id UUID REFERENCES course_chapters(id),
  name TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('video', 'simulation', 'interactive_exercise', 'quiz', 'lab')),
  description TEXT,
  embed_url TEXT,
  duration_minutes DECIMAL(5,2),
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_mandatory BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactive_resources_course ON interactive_resources(course_id);

CREATE TABLE IF NOT EXISTS student_interactive_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id INTEGER NOT NULL REFERENCES students(id),
  resource_id UUID NOT NULL REFERENCES interactive_resources(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  score DECIMAL(5,2),
  time_spent DECIMAL(8,2),
  attempts INTEGER DEFAULT 1,
  feedback JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_student_interactive_progress_student ON student_interactive_progress(student_id);

CREATE TABLE IF NOT EXISTS document_annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID NOT NULL REFERENCES course_resources(id),
  author_id UUID NOT NULL REFERENCES profiles(id),
  page_number INTEGER,
  section_reference TEXT,
  content TEXT NOT NULL,
  annotation_type TEXT DEFAULT 'comment' CHECK (annotation_type IN ('comment', 'question', 'correction', 'suggestion')),
  visibility VARCHAR(20) DEFAULT 'course' CHECK (visibility IN ('private', 'group', 'course', 'public')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_annotations_resource ON document_annotations(resource_id);
CREATE INDEX IF NOT EXISTS idx_document_annotations_author ON document_annotations(author_id);

CREATE TABLE IF NOT EXISTS annotation_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  annotation_id UUID NOT NULL REFERENCES document_annotations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_annotation_replies_annotation ON annotation_replies(annotation_id);

/*
 ======================================================
 BLOC 4: SUIVI & ANALYTICS AVANCÉS (4 relations)
 ======================================================
*/

CREATE TABLE IF NOT EXISTS student_performance_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id INTEGER NOT NULL REFERENCES students(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  academic_year VARCHAR(10),
  
  continuous_assessment_avg NUMERIC(5,2),
  exam_grade NUMERIC(5,2),
  final_grade NUMERIC(5,2),
  grade_trend VARCHAR(20),
  
  attendance_percentage DECIMAL(5,2),
  resources_viewed INTEGER DEFAULT 0,
  resources_downloaded INTEGER DEFAULT 0,
  forum_posts_count INTEGER DEFAULT 0,
  quiz_attempts INTEGER DEFAULT 0,
  quiz_avg_score DECIMAL(5,2),
  
  total_learning_hours DECIMAL(8,2),
  last_access TIMESTAMPTZ,
  
  predicted_grade NUMERIC(5,2),
  risk_flag BOOLEAN DEFAULT false,
  risk_reasons TEXT[],
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_student_analytics_student ON student_performance_analytics(student_id);
CREATE INDEX IF NOT EXISTS idx_student_analytics_course ON student_performance_analytics(course_id);
CREATE INDEX IF NOT EXISTS idx_student_analytics_risk ON student_performance_analytics(risk_flag) WHERE risk_flag = true;

CREATE TABLE IF NOT EXISTS class_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  academic_year VARCHAR(10),
  professor_id INTEGER REFERENCES professors(id),
  
  total_students INTEGER DEFAULT 0,
  avg_grade NUMERIC(5,2),
  median_grade NUMERIC(5,2),
  std_deviation NUMERIC(5,2),
  highest_grade NUMERIC(5,2),
  lowest_grade NUMERIC(5,2),
  passing_percentage DECIMAL(5,2),
  
  attendance_avg DECIMAL(5,2),
  forum_activity_average INTEGER DEFAULT 0,
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, academic_year)
);

CREATE TABLE IF NOT EXISTS student_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id INTEGER NOT NULL REFERENCES students(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_attendance', 'grade_drop', 'no_submission', 'missing_exam', 'risk_failure', 'plagiarism_detected')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  related_course_id INTEGER REFERENCES courses(id),
  description TEXT,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  action_taken TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_alerts_student ON student_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_alerts_resolved ON student_alerts(resolved) WHERE resolved = false;

CREATE TABLE IF NOT EXISTS anomaly_detections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  detection_type TEXT NOT NULL CHECK (detection_type IN ('unusual_pattern', 'statistical_anomaly', 'behavior_change', 'plagiarism_similarity')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('student', 'professor', 'exam', 'resource')),
  entity_id VARCHAR(50),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  details JSONB,
  flagged BOOLEAN DEFAULT false,
  review_status VARCHAR(20) DEFAULT 'pending' CHECK (review_status IN ('pending', 'reviewed', 'false_positive', 'confirmed')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomaly_detections_flagged ON anomaly_detections(flagged) WHERE flagged = true;

CREATE TABLE IF NOT EXISTS peer_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID,
  evaluator_id INTEGER NOT NULL REFERENCES students(id),
  evaluated_student_id INTEGER NOT NULL REFERENCES students(id),
  feedback_type TEXT DEFAULT 'general' CHECK (feedback_type IN ('general', 'collaboration', 'technical', 'communication')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, evaluator_id, evaluated_student_id)
);

CREATE TABLE IF NOT EXISTS student_360_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id INTEGER NOT NULL REFERENCES students(id),
  academic_year VARCHAR(10),
  
  professor_feedback_avg DECIMAL(3,2),
  peer_feedback_avg DECIMAL(3,2),
  self_assessment_avg DECIMAL(3,2),
  
  strengths TEXT[],
  areas_for_improvement TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, academic_year)
);

CREATE TABLE IF NOT EXISTS professor_dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professor_id INTEGER NOT NULL REFERENCES professors(id),
  academic_year VARCHAR(10),
  
  total_students_taught INTEGER DEFAULT 0,
  avg_class_performance NUMERIC(5,2),
  
  submissions_pending INTEGER DEFAULT 0,
  assignments_needing_grading INTEGER DEFAULT 0,
  student_messages_unread INTEGER DEFAULT 0,
  forum_posts_unanswered INTEGER DEFAULT 0,
  
  engagement_trend VARCHAR(20),
  performance_trend VARCHAR(20),
  
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(professor_id, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_professor_dashboards_professor ON professor_dashboards(professor_id);

/*
 ======================================================
 BLOC 5: EXAMENS & PROCTORING AVANCÉS (2 relations)
 ======================================================
*/

CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id INTEGER NOT NULL REFERENCES exams(id),
  session_number INTEGER,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  proctor_id UUID REFERENCES profiles(id),
  max_students INTEGER,
  current_students_count INTEGER DEFAULT 0,
  equipment_required TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, session_number, session_date)
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'exam_sessions'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'exam_sessions' AND column_name = 'exam_id'
    ) THEN
      ALTER TABLE exam_sessions ADD COLUMN exam_id INTEGER REFERENCES exams(id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'exam_sessions' AND column_name = 'session_number'
    ) THEN
      ALTER TABLE exam_sessions ADD COLUMN session_number INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'exam_sessions' AND column_name = 'session_date'
    ) THEN
      ALTER TABLE exam_sessions ADD COLUMN session_date DATE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'exam_sessions' AND column_name = 'start_time'
    ) THEN
      ALTER TABLE exam_sessions ADD COLUMN start_time TIME;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'exam_sessions' AND column_name = 'end_time'
    ) THEN
      ALTER TABLE exam_sessions ADD COLUMN end_time TIME;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'exam_sessions' AND column_name = 'location'
    ) THEN
      ALTER TABLE exam_sessions ADD COLUMN location TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'exam_sessions' AND column_name = 'proctor_id'
    ) THEN
      ALTER TABLE exam_sessions ADD COLUMN proctor_id UUID REFERENCES profiles(id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'exam_sessions' AND column_name = 'max_students'
    ) THEN
      ALTER TABLE exam_sessions ADD COLUMN max_students INTEGER;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'exam_sessions' AND column_name = 'current_students_count'
    ) THEN
      ALTER TABLE exam_sessions ADD COLUMN current_students_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'exam_sessions' AND column_name = 'equipment_required'
    ) THEN
      ALTER TABLE exam_sessions ADD COLUMN equipment_required TEXT[];
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam ON exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_date ON exam_sessions(session_date);

CREATE TABLE IF NOT EXISTS exam_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_session_id INTEGER NOT NULL REFERENCES exam_sessions(id),
  student_id INTEGER NOT NULL REFERENCES students(id),
  seat_number VARCHAR(10),
  registration_status VARCHAR(20) DEFAULT 'pending' CHECK (registration_status IN ('pending', 'confirmed', 'attended', 'absent', 'forfeited')),
  special_accommodation JSONB,
  extra_time_minutes INTEGER DEFAULT 0,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_registrations_session ON exam_registrations(exam_session_id);
CREATE INDEX IF NOT EXISTS idx_exam_registrations_student ON exam_registrations(student_id);

CREATE TABLE IF NOT EXISTS exam_monitoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_session_id INTEGER NOT NULL REFERENCES exam_sessions(id),
  student_id INTEGER,
  monitor_type TEXT NOT NULL CHECK (monitor_type IN ('proctoring', 'behavior', 'technical', 'security')),
  alert_level TEXT CHECK (alert_level IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  action_taken TEXT,
  recorded_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_exam_monitoring_session ON exam_monitoring(exam_session_id);

CREATE TABLE IF NOT EXISTS exam_submission_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_exam_id INTEGER NOT NULL,
  plagiarism_score DECIMAL(5,2),
  plagiarism_sources JSONB,
  similarity_matches TEXT[],
  ai_generated_probability DECIMAL(3,2),
  copy_detected_with_students UUID[],
  unusual_patterns TEXT[],
  analysis_timestamp TIMESTAMPTZ DEFAULT NOW(),
  flagged_for_review BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES profiles(id),
  review_outcome TEXT CHECK (review_outcome IN ('approved', 'suspected_plagiarism', 'ai_generated', 'inconclusive')),
  grade_penalty_applied NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submission_analysis_flagged ON exam_submission_analysis(flagged_for_review);
CREATE INDEX IF NOT EXISTS idx_submission_analysis_plagiarism ON exam_submission_analysis(plagiarism_score);

/*
 ======================================================
 BLOC 6: COMMUNICATION AVANCÉE (1 relation)
 ======================================================
*/

CREATE TABLE IF NOT EXISTS targeted_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_type TEXT NOT NULL CHECK (announcement_type IN ('general', 'academic', 'administrative', 'emergency', 'internship')),
  target_type TEXT NOT NULL CHECK (target_type IN ('everyone', 'role_based', 'department_based', 'course_based', 'level_based', 'custom')),
  
  target_roles VARCHAR(20)[],
  target_departments INTEGER[],
  target_courses INTEGER[],
  target_levels TEXT[],
  target_custom_filter JSONB,
  
  published_by UUID NOT NULL REFERENCES profiles(id),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  expiration_date TIMESTAMPTZ,
  
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  acknowledgements_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_targeted_announcements_type ON targeted_announcements(announcement_type);
CREATE INDEX IF NOT EXISTS idx_targeted_announcements_target ON targeted_announcements(target_type);

CREATE TABLE IF NOT EXISTS announcement_acknowledgements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES targeted_announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  viewed BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

CREATE TABLE IF NOT EXISTS communication_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  objective TEXT,
  start_date DATE,
  end_date DATE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  announcements UUID[],
  total_reach INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/*
 ======================================================
 Enable RLS for Blocs 3-6
 ======================================================
*/

ALTER TABLE resource_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_content_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactive_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_interactive_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotation_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_360_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE professor_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_submission_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE targeted_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_campaigns ENABLE ROW LEVEL SECURITY;

COMMIT;
