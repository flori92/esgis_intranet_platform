-- ==========================================
-- SEED DATA: Configuration Minimale
-- Pour les 18 nouvelles relations (VERSION ADAPTÉE)
-- ==========================================

BEGIN;

-- 1. COMPETENCIES (Les 34 compétences clés ESGIS)
INSERT INTO competencies (code, name, description, category, level) VALUES
('java_prog', 'Java Programming', 'Object-oriented programming with Java', 'technical', 'intermediate'),
('python_ds', 'Python Data Science', 'Data analysis and ML with Python', 'technical', 'intermediate'),
('linux_admin', 'Linux Administration', 'Server management and automation', 'technical', 'intermediate'),
('network_design', 'Network Design', 'TCP/IP, routing, switching', 'technical', 'beginner'),
('cybersec_fund', 'Cybersecurity Fundamentals', 'Encryption, authentication principles', 'technical', 'beginner'),
('aws_cloud', 'Cloud Platforms (AWS)', 'AWS services: EC2, S3, RDS, Lambda', 'technical', 'intermediate'),
('k8s_orch', 'Kubernetes Orchestration', 'Container orchestration with K8s', 'technical', 'advanced'),
('db_design', 'Database Design (SQL)', 'Relational database modeling', 'technical', 'intermediate'),
('docker_cont', 'Docker Containerization', 'Container technology and workflows', 'technical', 'intermediate'),
('api_rest', 'API Development (REST)', 'REST API design and implementation', 'technical', 'intermediate'),
('git_vcx', 'Git & Version Control', 'Git workflows and collaboration', 'technical', 'beginner'),
('cicd_pipe', 'CI/CD Pipelines', 'Automated testing and deployment', 'technical', 'intermediate'),
('react_fe', 'React Frontend', 'React.js for web frontends', 'technical', 'intermediate'),
('mobile_dev', 'Mobile Development', 'Native or cross-platform apps', 'technical', 'intermediate'),
('web_sec', 'Web Security', 'OWASP Top 10, XSS, SQL injection', 'technical', 'intermediate'),
('ml_algo', 'Machine Learning Algorithms', 'Supervised and unsupervised learning', 'technical', 'advanced'),
('communication', 'Communication', 'Written and verbal communication', 'soft_skills', 'beginner'),
('teamwork', 'Team Collaboration', 'Working in diverse teams', 'soft_skills', 'beginner'),
('problem_solving', 'Problem Solving', 'Analytical and creative thinking', 'soft_skills', 'beginner'),
('proj_mgmt', 'Project Management', 'Planning, tracking, delivery', 'soft_skills', 'intermediate'),
('agile_meth', 'Agile Methodology', 'Scrum, sprint planning', 'soft_skills', 'intermediate'),
('tech_lead', 'Technical Leadership', 'Mentoring and architecture', 'soft_skills', 'advanced'),
('architecture', 'Architecture Design', 'System and microservices design', 'technical', 'advanced'),
('perf_opt', 'Performance Optimization', 'Profiling and optimization', 'technical', 'advanced'),
('testing_qa', 'Testing & QA', 'Unit, integration, E2E testing', 'technical', 'intermediate'),
('documentation', 'Documentation', 'API docs, code comments', 'technical', 'beginner'),
('big_data', 'Big Data Processing', 'Spark, Hadoop, distributed computing', 'technical', 'advanced'),
('iot_edge', 'IoT & Edge Computing', 'IoT protocols and edge', 'technical', 'intermediate'),
('blockchain', 'Blockchain Basics', 'Blockchain concepts and smart contracts', 'domain_specific', 'intermediate'),
('ai_ethics', 'AI Ethics', 'Responsible AI and fairness', 'domain_specific', 'intermediate'),
('english', 'English Proficiency', 'Professional English', 'languages', 'advanced'),
('french', 'French Proficiency', 'Native or fluent French', 'languages', 'beginner')
ON CONFLICT (code) DO NOTHING;

-- 2. ALERT TYPE DEFINITIONS
INSERT INTO alert_type_definitions (alert_type, severity, description, threshold_value) VALUES
('low_attendance', 'high', 'Student attendance below 80%', 80),
('low_grades', 'high', 'Grades trending downward significantly', -15),
('no_engagement', 'medium', 'No forum posts or activity for 14 days', 14),
('assignment_overdue', 'medium', 'Multiple assignments overdue', 2),
('quiz_struggles', 'medium', 'Quiz attempts > 3 with low scores', 3),
('has_anomaly', 'critical', 'Unusual behavior detected', NULL)
ON CONFLICT (alert_type) DO NOTHING;

-- 3. RESOURCE INTERACTION TYPES
INSERT INTO resource_interaction_types (name, description) VALUES
('view', 'Student viewed resource'),
('download', 'Student downloaded resource'),
('complete', 'Student marked resource as complete'),
('bookmark', 'Student bookmarked resource'),
('comment', 'Student commented on resource'),
('share', 'Student shared resource'),
('rate', 'Student rated resource')
ON CONFLICT (name) DO NOTHING;

-- 4. INTERACTIVE RESOURCE TYPES
INSERT INTO interactive_resource_types (name, description, supported_features) VALUES
('Video Lecture', 'Recorded course video with transcripts', '["progress", "playback_speed", "subtitles", "transcript"]'),
('Live Session', 'Real-time interactive lecture', '["chat", "hand_raise", "breakout_rooms"]'),
('Simulation Lab', 'Hands-on practical environment', '["reset", "hints", "scoring"]'),
('Interactive Quiz', 'Quiz with immediate feedback', '["branching", "immediate_feedback", "hints", "attempts_tracking"]'),
('Virtual Lab', 'Remote access to lab equipment', '["control_equipment", "data_collection", "reports"]'),
('Coding Challenge', 'Programming challenges with tests', '["code_editor", "automated_tests", "leaderboard"]'),
('Discussion Forum', 'Async discussion with moderation', '["threading", "voting", "moderation"]'),
('E-book', 'Interactive digital textbook', '["highlighting", "notes", "search"]')
ON CONFLICT (name) DO NOTHING;

-- 5. PARTNER TYPES
INSERT INTO partner_types (name, description) VALUES
('Sponsor', 'Financial sponsor'),
('Recruiter', 'Company recruiting graduates'),
('Mentor', 'Professional providing mentorship'),
('Equipment Vendor', 'Lab equipment or licenses'),
('Training Partner', 'Specialized training'),
('Research Partner', 'Research collaborator')
ON CONFLICT (name) DO NOTHING;

-- 6. JOB OFFER STATUSES
INSERT INTO job_offer_statuses (status, description, is_open_for_applications) VALUES
('draft', 'Draft, not published', false),
('published', 'Published and accepting applications', true),
('applications_closed', 'Published but closed', false),
('interview_phase', 'Interviews ongoing', false),
('filled', 'Position filled', false),
('archived', 'Old posting archived', false)
ON CONFLICT (status) DO NOTHING;

-- 7. INTERNSHIP STATUSES
INSERT INTO internship_statuses (status, description, color_code) VALUES
('offer', 'Offer received', '#FFA500'),
('accepted', 'Offer accepted', '#4CAF50'),
('active', 'Currently active', '#2196F3'),
('completed', 'Completed', '#9C27B0'),
('failed', 'Did not complete', '#F44336')
ON CONFLICT (status) DO NOTHING;

-- 8. ANNOUNCEMENT PRIORITIES
INSERT INTO announcement_priority_types (priority, description) VALUES
('info', 'General information'),
('important', 'Important announcement'),
('urgent', 'Requires immediate attention'),
('emergency', 'Critical emergency')
ON CONFLICT (priority) DO NOTHING;

-- 9. ANNOUNCEMENT AUDIENCES
INSERT INTO announcement_audience_types (audience_type, description) VALUES
('all', 'All users'),
('students', 'Students only'),
('professors', 'Professors only'),
('admin', 'Admin staff only'),
('department', 'Specific department'),
('level', 'Specific academic level'),
('program', 'Specific study program'),
('class', 'Specific class'),
('custom', 'Custom audience filter')
ON CONFLICT (audience_type) DO NOTHING;

-- 10. EXAM MONITORING TYPES
INSERT INTO exam_monitoring_types (monitoring_type, description, requires_tools) VALUES
('in_person', 'Supervised in-person exam', 'proctoring_tools'),
('remote_proctored', 'Remote exam with video', 'zoom_watchexam'),
('honor_code', 'Exam on honor system', NULL),
('lockdown_browser', 'Computer-based with constraints', 'respondus_lockdown'),
('ai_monitoring', 'AI-based pattern detection', 'turnitin_proctorio')
ON CONFLICT (monitoring_type) DO NOTHING;

COMMIT;

-- Afficher le résumé
SELECT 'SEED DATA LOADED - Summary:' as status;
SELECT COUNT(*) FROM competencies;
SELECT COUNT(*) FROM alert_type_definitions;
SELECT COUNT(*) FROM resource_interaction_types;
SELECT COUNT(*) FROM interactive_resource_types;
SELECT COUNT(*) FROM partner_types;
SELECT COUNT(*) FROM job_offer_statuses;
SELECT COUNT(*) FROM internship_statuses;
SELECT COUNT(*) FROM announcement_priority_types;
SELECT COUNT(*) FROM announcement_audience_types;
SELECT COUNT(*) FROM exam_monitoring_types;
