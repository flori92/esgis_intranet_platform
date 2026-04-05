-- ==========================================
-- SEED DATA: Configuration Tables
-- Pour les 18 nouvelles relations
-- ==========================================

BEGIN;

-- 1. STUDY PROGRAMS (6 programmes pour ESGIS 2025-2026)
INSERT INTO study_programs (name, description, duration_semesters, level_from, level_to, is_active) VALUES
('Licence Informatique', 'Programme 3 ans en informatique générale', 6, 'L1', 'L3', true),
('Licence Réseaux et Télécom', 'Spécialisation réseaux et télécommunications', 6, 'L1', 'L3', true),
('Licence Systèmes et Infrastructure', 'Spécialisation infrastructure et datacenter', 6, 'L1', 'L3', true),
('Master Cybersécurité', 'Master 2 ans spécialisé en cybersécurité', 4, 'M1', 'M2', true),
('Master Cloud Computing', 'Master 2 ans spécialisé cloud et DevOps', 4, 'M1', 'M2', true),
('Master Intelligence Artificielle', 'Master 2 ans spécialisé en IA et ML', 4, 'M1', 'M2', true)
ON CONFLICT DO NOTHING;

-- 2. COMPETENCY FRAMEWORK (Les 40+ compétences clés)
INSERT INTO competency_frameworks (name, description, framework_type, is_active) VALUES
('ESGIS Core Skills 2025', 'Framework principal ESGIS pour 2025-2026', 'institutional', true)
ON CONFLICT DO NOTHING;

-- Récupérer le framework ID
WITH cf AS (
  SELECT id FROM competency_frameworks WHERE name = 'ESGIS Core Skills 2025' LIMIT 1
)
INSERT INTO competencies (framework_id, name, description, category, level_difficulty) 
SELECT cf.id, * FROM cf, (VALUES
  ('Java Programming', 'Object-oriented programming with Java', 'Programming', 'intermediate'),
  ('Python Data Science', 'Data analysis and ML with Python/pandas/scikit-learn', 'Data Science', 'intermediate'),
  ('Linux Administration', 'Server management and automation on Linux', 'Infrastructure', 'intermediate'),
  ('Network Design', 'TCP/IP, routing, switching fundamentals', 'Networking', 'beginner'),
  ('Cybersecurity Fundamentals', 'Encryption, authentication, security principles', 'Security', 'beginner'),
  ('Cloud Platforms (AWS)', 'AWS services: EC2, S3, RDS, Lambda', 'Cloud', 'intermediate'),
  ('Kubernetes Orchestration', 'Container orchestration with K8s', 'DevOps', 'advanced'),
  ('Database Design (SQL)', 'Relational database modeling and SQL', 'Database', 'intermediate'),
  ('Docker Containerization', 'Container technology and Docker workflows', 'DevOps', 'intermediate'),
  ('API Development (REST)', 'REST API design and implementation', 'Backend', 'intermediate'),
  ('Git & Version Control', 'Git workflows and collaboration', 'Development', 'beginner'),
  ('CI/CD Pipelines', 'Automated testing and deployment', 'DevOps', 'intermediate'),
  ('React Frontend', 'React.js for web frontends', 'Frontend', 'intermediate'),
  ('Mobile Development', 'Native or cross-platform mobile apps', 'Mobile', 'intermediate'),
  ('Web Security', 'OWASP Top 10, XSS, SQL injection prevention', 'Security', 'intermediate'),
  ('Machine Learning Algorithms', 'Supervised and unsupervised learning', 'Data Science', 'advanced'),
  ('Communication', 'Written and verbal communication skills', 'Soft Skills', 'beginner'),
  ('Team Collaboration', 'Working effectively in diverse teams', 'Soft Skills', 'beginner'),
  ('Problem Solving', 'Analytical and creative problem-solving', 'Soft Skills', 'beginner'),
  ('Project Management', 'Planning, tracking, and delivery', 'Management', 'intermediate'),
  ('Agile Methodology', 'Scrum, sprint planning, and retrospectives', 'Management', 'intermediate'),
  ('Technical Leadership', 'Mentoring and architecture decisions', 'Leadership', 'advanced'),
  ('Architecture Design', 'System and microservices architecture', 'Architecture', 'advanced'),
  ('Performance Optimization', 'Profiling, caching, and optimization techniques', 'Performance', 'advanced'),
  ('Testing & QA', 'Unit, integration, and E2E testing', 'Quality', 'intermediate'),
  ('Documentation', 'API docs, architecture, code comments', 'Development', 'beginner'),
  ('Financial Acumen', 'Understanding budgets and project costs', 'Business', 'beginner'),
  ('Compliance & Regulations', 'GDPR, data protection, audit requirements', 'Compliance', 'beginner'),
  ('Big Data Processing', 'Spark, Hadoop, distributed computing', 'Data Science', 'advanced'),
  ('IoT & Edge Computing', 'IoT protocols and edge implementations', 'Hardware', 'intermediate'),
  ('Blockchain Basics', 'Blockchain concepts and smart contracts', 'Emerging Tech', 'intermediate'),
  ('AI Ethics', 'Responsible AI and fairness principles', 'Ethics', 'intermediate'),
  ('English Proficiency', 'Professional English for tech', 'Languages', 'advanced'),
  ('French Proficiency', 'Native or fluent French', 'Languages', 'beginner')
) AS t(name, description, category, level)
ON CONFLICT (name) DO NOTHING;

-- 3. LEARNING PATHS (Parcours d'apprentissage types)
INSERT INTO learning_paths (name, description, target_audience, estimated_hours, is_active) VALUES
('Développeur Backend Java', 'Chemin pour devenir développeur Java/Spring', 'L3 + Alternants', 120, true),
('Ingénieur DevOps', 'Chemin pour Docker → Kubernetes → AWS', 'M1 + Alternants', 100, true),
('Data Scientist', 'Chemin Python → ML → Big Data', 'M1 sélectionnés', 140, true),
('Cybersécurité Praticien', 'Chemin pentesting et sécurité offensive', 'M2 Cybersec', 110, true),
('Admin Système Senior', 'Chemin Linux → Ansible → Infrastructure', 'L2 + Alternants', 90, true),
('Frontend React', 'Chemin HTML/CSS → TypeScript → React', 'L2 + L3', 80, true),
('Mobile iOS', 'Chemin Swift → SwiftUI → App Publishing', 'L3 sélectionnés', 100, true),
('Cloud Architect AWS', 'Chemin AWS fundamentals → Designer → Professional', 'M2 Cloud', 130, true)
ON CONFLICT DO NOTHING;

-- 4. RESOURCE INTERACTION TYPES
INSERT INTO resource_interaction_types (name, description) VALUES
('view', 'Student viewed resource'),
('download', 'Student downloaded resource'),
('complete', 'Student marked resource as complete'),
('bookmark', 'Student bookmarked resource'),
('comment', 'Student commented on resource'),
('share', 'Student shared resource'),
('rate', 'Student rated resource')
ON CONFLICT DO NOTHING;

-- 5. INTERACTIVE RESOURCE TYPES
INSERT INTO interactive_resource_types (name, description, supported_features) VALUES
('Video Lecture', 'Recorded course video with transcripts', '["progress", "playback_speed", "subtitles", "transcript"]'),
('Live Session', 'Real-time interactive lecture or Q&A', '["chat", "hand_raise", "breakout_rooms"]'),
('Simulation Lab', 'Hands-on practical simulation environment', '["reset", "hints", "scoring"]'),
('Interactive Quiz', 'Quiz with immediate feedback and explanations', '["branching", "immediate_feedback", "hints", "attempts_tracking"]'),
('Virtual Lab', 'Remote access to lab equipment and experiments', '["control_equipment", "data_collection", "reports"]'),
('Coding Challenge', 'Programming challenges with automated testing', '["code_editor", "automated_tests", "leaderboard"]'),
('Discussion Forum', 'Async discussion with moderation', '["threading", "voting", "moderation"]'),
('E-book', 'Interactive digital textbook with annotations', '["highlighting", "notes", "search"]'),
('Webinar Recording', 'Recorded webinar with Q&A archive', '["Q&A_transcripts", "slides", "recording"]'),
('Peer Review Activity', 'Students review each other''s work', '["rubrics", "anonymous_mode", "feedback_forms"]')
ON CONFLICT DO NOTHING;

-- 6. ALERT TYPES & THRESHOLDS
INSERT INTO alert_type_definitions (alert_type, severity, description, threshold_value) VALUES
('low_attendance', 'high', 'Student attendance below 80%', 80),
('low_grades', 'high', 'Grades trending downward significantly', -15),
('no_engagement', 'medium', 'No forum posts or activity for 14 days', 14),
('assignment_overdue', 'medium', 'Multiple assignments overdue', 2),
('quiz_struggles', 'medium', 'Quiz attempts > 3 with low scores', 3),
('has_anomaly', 'critical', 'Unusual behavior detected', NULL)
ON CONFLICT DO NOTHING;

-- 7. PARTNER TYPES
INSERT INTO partner_types (name, description) VALUES
('Sponsor', 'Financial sponsor of programs'),
('Recruiter', 'Company recruiting graduates'),
('Mentor', 'Professional providing mentorship'),
('Equipment Vendor', 'Provides lab equipment or licenses'),
('Training Partner', 'Provides specialized training'),
('Research Partner', 'Collaborator on research projects')
ON CONFLICT DO NOTHING;

-- 8. JOB OFFER STATUSES
INSERT INTO job_offer_statuses (status, description, is_open_for_applications) VALUES
('draft', 'Draft, not yet published', false),
('published', 'Published and accepting applications', true),
('applications_closed', 'Published but closed for new applications', false),
('interview_phase', 'Interviews currently ongoing', false),
('filled', 'Position filled', false),
('archived', 'Old posting archived', false)
ON CONFLICT DO NOTHING;

-- 9. INTERNSHIP STATUS VALUES
INSERT INTO internship_statuses (status, description, color_code) VALUES
('offer', 'Offer received, waiting acceptance', '#FFA500'),
('accepted', 'Offer accepted by student', '#4CAF50'),
('active', 'Internship currently active', '#2196F3'),
('completed', 'Internship completed', '#9C27B0'),
('failed', 'Internship did not complete', '#F44336')
ON CONFLICT DO NOTHING;

-- 10. ANNOUNCEMENT PRIORITY & TYPES
INSERT INTO announcement_priority_types (priority, description) VALUES
('info', 'General information'),
('important', 'Important announcement'),
('urgent', 'Requires immediate attention'),
('emergency', 'Critical emergency')
ON CONFLICT DO NOTHING;

INSERT INTO announcement_audience_types (audience_type, description) VALUES
('all', 'All users'),
('students', 'Students only'),
('professors', 'Professors only'),
('admin', 'Admin staff only'),
('department', 'Specific department'),
('level', 'Specific academic level (L1/L2/L3/M1/M2)'),
('program', 'Specific study program'),
('class', 'Specific class'),
('custom', 'Custom audience filter')
ON CONFLICT DO NOTHING;

-- 11. EXAM MONITORING TYPES
INSERT INTO exam_monitoring_types (monitoring_type, description, requires_tools) VALUES
('in_person', 'Supervised in-person exam', 'proctoring_tools'),
('remote_proctored', 'Remote exam with video proctoring', 'zoom_watchexam_proctortrack'),
('honor_code', 'Exam on honor system with no monitoring', NULL),
('lockdown_browser', 'Computer-based with lockdown constraints', 'respondus_lockdown'),
('ai_monitoring', 'AI-based suspicious pattern detection', 'turnitin_proctorio')
ON CONFLICT DO NOTHING;

COMMIT;
