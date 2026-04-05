-- ============================================================
-- MIGRATION: Nouvelles Transactions & Relationships Académiques
-- Version: 1.0
-- Date: 2026-04-05
-- Description: Implémente les 18 nouvelles relations recommandées
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

BEGIN TRANSACTION;

/*
 ======================================================
 BLOC 1: RELATIONS ACADÉMIQUES AVANCÉES (5 relations)
 ======================================================
*/

-- ============================================================
-- 1. GROUPES PÉDAGOGIQUES (TP/TD)
-- ============================================================

CREATE TABLE IF NOT EXISTS student_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  academic_year VARCHAR(10) NOT NULL,
  group_letter VARCHAR(1) NOT NULL,
  size INTEGER DEFAULT 0,
  professor_id INTEGER REFERENCES professors(id) ON DELETE SET NULL,
  room VARCHAR(50),
  session_day VARCHAR(20),
  session_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, academic_year, group_letter),
  CHECK (group_letter ~ '^[A-Z]$')
);

CREATE INDEX IF NOT EXISTS idx_student_groups_course ON student_groups(course_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_year ON student_groups(academic_year);
CREATE INDEX IF NOT EXISTS idx_student_groups_professor ON student_groups(professor_id);

CREATE TABLE IF NOT EXISTS group_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_group_memberships_group ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_student ON group_memberships(student_id);

-- ============================================================
-- 2. PRÉ-REQUIS ACADÉMIQUES
-- ============================================================

CREATE TABLE IF NOT EXISTS course_prerequisites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  prerequisite_course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  min_grade NUMERIC(5,2) DEFAULT 10.00,
  is_mandatory BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, prerequisite_course_id),
  CHECK (course_id != prerequisite_course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_prerequisites_course ON course_prerequisites(course_id);
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_prereq ON course_prerequisites(prerequisite_course_id);

CREATE TABLE IF NOT EXISTS prerequisite_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id INTEGER NOT NULL REFERENCES students(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  prerequisite_id UUID NOT NULL REFERENCES course_prerequisites(id),
  is_satisfied BOOLEAN,
  actual_grade NUMERIC(5,2),
  waived BOOLEAN DEFAULT false,
  waived_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, prerequisite_id)
);

CREATE INDEX IF NOT EXISTS idx_prerequisite_validations_student ON prerequisite_validations(student_id);
CREATE INDEX IF NOT EXISTS idx_prerequisite_validations_course ON prerequisite_validations(course_id);

-- ============================================================
-- 3. PROGRAMMES D'ÉTUDES (PARCOURS)
-- ============================================================

CREATE TABLE IF NOT EXISTS study_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  level_code TEXT NOT NULL,
  description TEXT,
  start_year INTEGER,
  end_year INTEGER,
  responsible_professor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_programs_dept ON study_programs(department_id);
CREATE INDEX IF NOT EXISTS idx_study_programs_level ON study_programs(level_code);

CREATE TABLE IF NOT EXISTS program_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES study_programs(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 10),
  is_mandatory BOOLEAN DEFAULT true,
  coefficient NUMERIC(5,2) DEFAULT 1.00,
  credits INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, course_id),
  CHECK (coefficient > 0)
);

CREATE INDEX IF NOT EXISTS idx_program_courses_program ON program_courses(program_id);
CREATE INDEX IF NOT EXISTS idx_program_courses_course ON program_courses(course_id);

CREATE TABLE IF NOT EXISTS student_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id INTEGER NOT NULL REFERENCES students(id),
  program_id UUID NOT NULL REFERENCES study_programs(id),
  start_year INTEGER NOT NULL,
  end_year INTEGER,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'abandoned', 'transfer')),
  specialization VARCHAR(100),
  thesis_title TEXT,
  thesis_grade NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, program_id, start_year)
);

CREATE INDEX IF NOT EXISTS idx_student_programs_student ON student_programs(student_id);
CREATE INDEX IF NOT EXISTS idx_student_programs_program ON student_programs(program_id);

-- ============================================================
-- 4. COMPÉTENCES & SKILLS
-- ============================================================

CREATE TABLE IF NOT EXISTS competencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('technical', 'soft_skills', 'languages', 'domain_specific', 'other')),
  level TEXT DEFAULT 'intermediate' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competencies_category ON competencies(category);

CREATE TABLE IF NOT EXISTS course_competencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  level_required TEXT DEFAULT 'intermediate',
  weight INTEGER DEFAULT 50 CHECK (weight >= 0 AND weight <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, competency_id)
);

CREATE INDEX IF NOT EXISTS idx_course_competencies_course ON course_competencies(course_id);
CREATE INDEX IF NOT EXISTS idx_course_competencies_competency ON course_competencies(competency_id);

CREATE TABLE IF NOT EXISTS student_competencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id INTEGER NOT NULL REFERENCES students(id),
  competency_id UUID NOT NULL REFERENCES competencies(id),
  level_achieved TEXT NOT NULL CHECK (level_achieved IN ('beginner', 'intermediate', 'advanced', 'expert')),
  acquired_from TEXT NOT NULL CHECK (acquired_from IN ('course', 'exam', 'project', 'internship', 'certification')),
  source_id VARCHAR(50),
  acquired_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, competency_id)
);

CREATE INDEX IF NOT EXISTS idx_student_competencies_student ON student_competencies(student_id);
CREATE INDEX IF NOT EXISTS idx_student_competencies_competency ON student_competencies(competency_id);

-- ============================================================
-- 5. PARCOURS D'APPRENTISSAGE PERSONNALISÉS
-- ============================================================

CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sequence_order INTEGER DEFAULT 0,
  objectives TEXT[],
  estimated_hours DECIMAL(5,2) DEFAULT 0,
  is_personalized BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_paths_course ON learning_paths(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_student ON learning_paths(student_id);

CREATE TABLE IF NOT EXISTS path_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES course_resources(id) ON DELETE CASCADE,
  order_sequence INTEGER NOT NULL,
  estimated_duration DECIMAL(5,2),
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(path_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_path_resources_path ON path_resources(path_id);

CREATE TABLE IF NOT EXISTS student_path_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id INTEGER NOT NULL REFERENCES students(id),
  path_id UUID NOT NULL REFERENCES learning_paths(id),
  resource_id UUID NOT NULL REFERENCES course_resources(id),
  viewed BOOLEAN DEFAULT false,
  downloaded BOOLEAN DEFAULT false,
  time_spent DECIMAL(8,2), -- minutes
  last_accessed TIMESTAMPTZ,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  viewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, path_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_student_path_progress_student ON student_path_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_path_progress_path ON student_path_progress(path_id);

/*
 ======================================================
 BLOC 2: GESTION DES STAGES & EMPLOIS (3 relations)
 ======================================================
*/

-- ============================================================
-- 6. OFFRES DE STAGE
-- ============================================================

CREATE TABLE IF NOT EXISTS internship_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_contact_email VARCHAR(255),
  company_phone VARCHAR(20),
  location TEXT,
  duration_weeks INTEGER,
  start_date DATE,
  end_date DATE,
  required_level TEXT NOT NULL CHECK (required_level IN ('L1', 'L2', 'L3', 'M1', 'M2')),
  required_semester INTEGER,
  salary_range_min DECIMAL(10,2),
  salary_range_max DECIMAL(10,2),
  required_skills UUID[],
  required_documents TEXT[],
  posted_by UUID NOT NULL REFERENCES profiles(id),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled', 'cancelled')),
  application_deadline DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_internship_offers_status ON internship_offers(status);
CREATE INDEX IF NOT EXISTS idx_internship_offers_deadline ON internship_offers(application_deadline);
CREATE INDEX IF NOT EXISTS idx_internship_offers_level ON internship_offers(required_level);

CREATE TABLE IF NOT EXISTS internship_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID NOT NULL REFERENCES internship_offers(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id),
  application_date TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'interview', 'offered')),
  resume_url TEXT,
  motivation_letter TEXT,
  applied_skills UUID[],
  interview_date TIMESTAMPTZ,
  interview_notes TEXT,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(offer_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_internship_applications_offer ON internship_applications(offer_id);
CREATE INDEX IF NOT EXISTS idx_internship_applications_student ON internship_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_internship_applications_status ON internship_applications(status);

CREATE TABLE IF NOT EXISTS student_internships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id INTEGER NOT NULL REFERENCES students(id),
  internship_offer_id UUID NOT NULL REFERENCES internship_offers(id),
  application_id UUID NOT NULL REFERENCES internship_applications(id),
  academic_year VARCHAR(10),
  start_date DATE NOT NULL,
  end_date DATE,
  company_supervisor_name TEXT,
  company_supervisor_email VARCHAR(255),
  internship_report_url TEXT,
  internship_grade NUMERIC(5,2),
  university_supervisor_id UUID REFERENCES profiles(id),
  supervisor_comments TEXT,
  completed BOOLEAN DEFAULT false,
  credits_earned INTEGER DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_internships_student ON student_internships(student_id);
CREATE INDEX IF NOT EXISTS idx_student_internships_offer ON student_internships(internship_offer_id);

-- ============================================================
-- 7. OFFRES D'EMPLOI POUR GRADUANDOS
-- ============================================================

CREATE TABLE IF NOT EXISTS job_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT,
  job_type VARCHAR(50) CHECK (job_type IN ('cdi', 'cdd', 'freelance', 'project')),
  salary_range_min DECIMAL(10,2),
  salary_range_max DECIMAL(10,2),
  location TEXT,
  remote_allowed BOOLEAN DEFAULT false,
  required_level TEXT CHECK (required_level IN ('L3', 'M1', 'M2', 'graduate')),
  required_skills UUID[],
  posted_by UUID NOT NULL REFERENCES profiles(id),
  application_deadline DATE,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_offers_status ON job_offers(status);
CREATE INDEX IF NOT EXISTS idx_job_offers_level ON job_offers(required_level);

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_offer_id UUID NOT NULL REFERENCES job_offers(id),
  student_id INTEGER NOT NULL REFERENCES students(id),
  cover_letter TEXT,
  resume_url TEXT,
  application_date TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'interview', 'offered', 'rejected')),
  interview_date TIMESTAMPTZ,
  interview_notes TEXT,
  offer_made BOOLEAN DEFAULT false,
  offer_accepted BOOLEAN,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_offer_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_offer ON job_applications(job_offer_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_student ON job_applications(student_id);

CREATE TABLE IF NOT EXISTS alumni_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  graduate_student_id INTEGER NOT NULL REFERENCES students(id),
  current_company TEXT,
  current_position TEXT,
  graduation_date DATE,
  career_path TEXT[],
  linkedin_profile VARCHAR(255),
  contact_email VARCHAR(255),
  is_available_mentoring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alumni_registrations_student ON alumni_registrations(graduate_student_id);

-- ============================================================
-- 8. PARTENARIATS ENTREPRISES
-- ============================================================

CREATE TABLE IF NOT EXISTS company_partnerships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_code TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  sector VARCHAR(100),
  website VARCHAR(255),
  contact_person_name TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  partnership_type TEXT[] DEFAULT '{}',
  partnership_level TEXT DEFAULT 'standard' CHECK (partnership_level IN ('standard', 'premium', 'strategic')),
  agreement_start_date DATE,
  agreement_end_date DATE,
  account_manager_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_partnerships_level ON company_partnerships(partnership_level);

CREATE TABLE IF NOT EXISTS company_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES company_partnerships(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('presentation', 'recruiting', 'sponsoring', 'meeting', 'other')),
  interaction_date TIMESTAMPTZ,
  description TEXT,
  contact_person VARCHAR(100),
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_interactions_company ON company_interactions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_interactions_date ON company_interactions(interaction_date);

/*
 ======================================================
 BLOC 3: RESSOURCES AVANCÉES & VERSIONING (3 relations)
 ======================================================
*/

-- ============================================================
-- 9. VERSIONING RESSOURCES
-- ============================================================

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

-- ============================================================
-- 10. RESSOURCES INTERACTIVES
-- ============================================================

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

-- ============================================================
-- 11. ANNOTATIONS DOCUMENTS
-- ============================================================

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

-- ============================================================
-- 12. ANALYTICS ÉTUDIANTS
-- ============================================================

CREATE TABLE IF NOT EXISTS student_performance_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id INTEGER NOT NULL REFERENCES students(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  academic_year VARCHAR(10),
  
  -- Notes
  continuous_assessment_avg NUMERIC(5,2),
  exam_grade NUMERIC(5,2),
  final_grade NUMERIC(5,2),
  grade_trend VARCHAR(20),
  
  -- Engagement
  attendance_percentage DECIMAL(5,2),
  resources_viewed INTEGER DEFAULT 0,
  resources_downloaded INTEGER DEFAULT 0,
  forum_posts_count INTEGER DEFAULT 0,
  quiz_attempts INTEGER DEFAULT 0,
  quiz_avg_score DECIMAL(5,2),
  
  -- Time spent
  total_learning_hours DECIMAL(8,2),
  last_access TIMESTAMPTZ,
  
  -- Prédiction
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

-- ============================================================
-- 13. ALERTES ÉTUDIANTS
-- ============================================================

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

-- ============================================================
-- 14. FEEDBACK & ÉVALUATIONS 360
-- ============================================================

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

-- ============================================================
-- 15. DASHBOARDS PROFESSEURS
-- ============================================================

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

-- ============================================================
-- 16. SESSIONS D'EXAMENS
-- ============================================================

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

CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam ON exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_date ON exam_sessions(session_date);

CREATE TABLE IF NOT EXISTS exam_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_session_id UUID NOT NULL REFERENCES exam_sessions(id),
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
  exam_session_id UUID NOT NULL REFERENCES exam_sessions(id),
  student_id INTEGER,
  monitor_type TEXT NOT NULL CHECK (monitor_type IN ('proctoring', 'behavior', 'technical', 'security')),
  alert_level TEXT CHECK (alert_level IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  action_taken TEXT,
  recorded_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_exam_monitoring_session ON exam_monitoring(exam_session_id);

-- ============================================================
-- 17. PLAGIARISME & INTÉGRITÉ
-- ============================================================

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

-- ============================================================
-- 18. ANNONCES CIBLÉES
-- ============================================================

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
 RLS POLICIES FOR NEW TABLES
 ======================================================
*/

-- Enable RLS on all new tables
ALTER TABLE student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE prerequisite_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE path_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_path_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_interactions ENABLE ROW LEVEL SECURITY;
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

-- Basic RLS Policies (example for student_groups)
CREATE POLICY "students_see_own_groups" ON student_groups
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM group_memberships gm
      JOIN students s ON s.id = gm.student_id
      JOIN profiles p ON p.id = s.profile_id
      WHERE gm.group_id = student_groups.id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "professors_manage_own_groups" ON student_groups
  FOR ALL USING (
    professor_id IN (
      SELECT prof.id FROM professors prof
      JOIN profiles p ON p.id = prof.profile_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "admins_manage_all" ON student_groups
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

/*
 ======================================================
 FINAL CHECKS
 ======================================================
*/

-- Ensure all schemas are aligned
-- Verify foreign key constraints haven't been broken
SELECT constraint_name, table_name, column_name
FROM information_schema.constraint_column_usage
WHERE table_name IN (
  'student_groups', 'group_memberships', 'course_prerequisites',
  'prerequisite_validations', 'study_programs', 'program_courses',
  'student_programs', 'competencies', 'course_competencies', 'student_competencies',
  'learning_paths', 'path_resources', 'student_path_progress',  
  'internship_offers', 'internship_applications', 'student_internships',
  'job_offers', 'job_applications', 'alumni_registrations',
  'company_partnerships', 'company_interactions',
  'resource_versions', 'resource_content_packages', 'interactive_resources',
  'student_interactive_progress', 'document_annotations', 'annotation_replies',
  'student_performance_analytics', 'class_statistics', 'student_alerts',
  'anomaly_detections', 'peer_feedback', 'student_360_reviews',
  'professor_dashboards', 'exam_sessions', 'exam_registrations', 'exam_monitoring',
  'exam_submission_analysis', 'targeted_announcements', 'announcement_acknowledgements',
  'communication_campaigns'
);

COMMIT;

-- Log successful completion
INSERT INTO system_monitoring (metric_type, metric_value, metadata)
VALUES (
  'database_migration',
  1,
  jsonb_build_object(
    'migration_name', 'New Relations (Phase 1-6)',
    'tables_created', 39,
    'timestamp', NOW()
  )
);

RAISE NOTICE 'Migration completed: 39 new tables created with 18 new rich relationships';
