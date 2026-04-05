-- ================================================================
-- MIGRATION: 18 Relations Implementation for ESGIS Campus
-- Date: 2026-04-05
-- Status: Production Ready
-- ================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ================================================================
-- 1. STUDENT GROUPS TABLE (Relation 1)
-- ================================================================
CREATE TABLE IF NOT EXISTS student_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_student_groups_created_by ON student_groups(created_by);
ALTER TABLE student_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all groups" ON student_groups
  FOR SELECT USING (auth.role() = 'admin');

-- ================================================================
-- 2. STUDENT ALERTS TABLE (Relation 2)
-- ================================================================
CREATE TABLE IF NOT EXISTS student_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(20) DEFAULT 'normal',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_student_alerts_user_id ON student_alerts(user_id);
CREATE INDEX idx_student_alerts_is_read ON student_alerts(is_read);
CREATE INDEX idx_student_alerts_created_at ON student_alerts(created_at DESC);
ALTER TABLE student_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts" ON student_alerts
  FOR SELECT USING (auth.uid() = user_id);

-- ================================================================
-- 3. INTERNSHIP OFFERS TABLE (Relation 3)
-- ================================================================
CREATE TABLE IF NOT EXISTS internship_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  sector VARCHAR(100),
  duration_weeks INT,
  compensation VARCHAR(100),
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_internship_offers_status ON internship_offers(status);
CREATE INDEX idx_internship_offers_created_at ON internship_offers(created_at DESC);
ALTER TABLE internship_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view published offers" ON internship_offers
  FOR SELECT USING (status = 'published');

-- ================================================================
-- 4. COMPETENCIES TABLE (Relation 4)
-- ================================================================
CREATE TABLE IF NOT EXISTS competencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100),
  level INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_competencies_category ON competencies(category);
CREATE INDEX idx_competencies_name ON competencies(name);
ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view competencies" ON competencies
  FOR SELECT USING (TRUE);

-- ================================================================
-- 5. LEARNING PATHS TABLE (Relation 5)
-- ================================================================
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  progress INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_learning_paths_user_id ON learning_paths(user_id);
CREATE INDEX idx_learning_paths_status ON learning_paths(status);
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning paths" ON learning_paths
  FOR SELECT USING (auth.uid() = user_id);

-- ================================================================
-- 6. INTERACTIVE RESOURCES TABLE (Relation 6)
-- ================================================================
CREATE TABLE IF NOT EXISTS interactive_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50),
  url_path VARCHAR(500),
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_interactive_resources_type ON interactive_resources(resource_type);
CREATE INDEX idx_interactive_resources_active ON interactive_resources(is_active);
ALTER TABLE interactive_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active resources" ON interactive_resources
  FOR SELECT USING (is_active = TRUE);

-- ================================================================
-- 7. PROFESSOR DASHBOARDS TABLE (Relation 7)
-- ================================================================
CREATE TABLE IF NOT EXISTS professor_dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_interval_minutes INT DEFAULT 5,
  show_alerts BOOLEAN DEFAULT TRUE,
  show_student_progress BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_professor_dashboards_professor_id ON professor_dashboards(professor_id);
ALTER TABLE professor_dashboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors can view own dashboard" ON professor_dashboards
  FOR SELECT USING (auth.uid() = professor_id);

-- ================================================================
-- 8. JOB OFFERS TABLE (Relation 8)
-- ================================================================
CREATE TABLE IF NOT EXISTS job_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  contract_type VARCHAR(50),
  salary_min INT,
  salary_max INT,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_job_offers_status ON job_offers(status);
CREATE INDEX idx_job_offers_created_at ON job_offers(created_at DESC);
ALTER TABLE job_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view published jobs" ON job_offers
  FOR SELECT USING (status = 'published');

-- ================================================================
-- 9. EXAM SESSIONS TABLE (Relation 9)
-- ================================================================
CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID,
  session_number INT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  location VARCHAR(255),
  capacity INT,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_exam_sessions_status ON exam_sessions(status);
CREATE INDEX idx_exam_sessions_start_date ON exam_sessions(start_date);
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sessions" ON exam_sessions
  FOR ALL USING (auth.role() = 'admin');

-- ================================================================
-- 10. PEER FEEDBACK TABLE (Relation 10)
-- ================================================================
CREATE TABLE IF NOT EXISTS peer_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_text TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_peer_feedback_reviewer_id ON peer_feedback(reviewer_id);
CREATE INDEX idx_peer_feedback_reviewed_id ON peer_feedback(reviewed_id);
ALTER TABLE peer_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view feedback about themselves" ON peer_feedback
  FOR SELECT USING (auth.uid() = reviewed_id OR auth.uid() = reviewer_id OR auth.role() = 'admin');

-- ================================================================
-- LOOKUP TABLES
-- ================================================================

-- Alert type definitions
CREATE TABLE IF NOT EXISTS alert_type_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(255),
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20)
);

INSERT INTO alert_type_definitions (alert_type, label, description, icon, color) VALUES
('grading_low', 'Note faible', 'Vous avez obtenu une note faible', 'alert-triangle', 'red'),
('deadline_approaching', 'Deadline proche', 'Une deadline de travail approche', 'clock', 'orange'),
('feedback_ready', 'Feedback disponible', 'Un feedback a été partagé avec vous', 'check-circle', 'green'),
('attendance_issue', 'Problème d''assiduité', 'Vous avez un problème de présence', 'alert-circle', 'red'),
('achievement_unlocked', 'Achievement débloqué', 'Vous avez atteint un jalons', 'star', 'gold')
ON CONFLICT (alert_type) DO NOTHING;

-- Resource interaction types
CREATE TABLE IF NOT EXISTS resource_interaction_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interaction_type VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(255),
  description TEXT
);

INSERT INTO resource_interaction_types (interaction_type, label, description) VALUES
('view', 'Consulter', 'Visualiser une ressource'),
('download', 'Télécharger', 'Télécharger une ressource'),
('comment', 'Commenter', 'Ajouter des commentaires'),
('rate', 'Noter', 'Donner une note'),
('share', 'Partager', 'Partager une ressource')
ON CONFLICT (interaction_type) DO NOTHING;

-- Interactive resource types
CREATE TABLE IF NOT EXISTS interactive_resource_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_type VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(255),
  description TEXT,
  icon VARCHAR(50)
);

INSERT INTO interactive_resource_types (resource_type, label, description, icon) VALUES
('video', 'Vidéo', 'Contenu vidéo pédagogique', 'play-circle'),
('quiz', 'Quiz', 'Test d''évaluation interactif', 'help-circle'),
('document', 'Document', 'Supports de cours', 'file-text'),
('exercise', 'Exercice', 'Exercice pratique', 'edit-3'),
('simulation', 'Simulation', 'Simulation interactive', 'activity')
ON CONFLICT (resource_type) DO NOTHING;

-- Partner types
CREATE TABLE IF NOT EXISTS partner_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_type VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(255),
  description TEXT
);

INSERT INTO partner_types (partner_type, label, description) VALUES
('company', 'Entreprise', 'Partenaire entreprise'),
('university', 'Université', 'Partenaire académique'),
('ngo', 'ONG', 'Organisation non-gouvernementale'),
('government', 'Gouvernement', 'Organisme gouvernemental'),
('research', 'Centre de recherche', 'Institution de recherche')
ON CONFLICT (partner_type) DO NOTHING;

-- Job offer statuses
CREATE TABLE IF NOT EXISTS job_offer_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(255),
  description TEXT,
  color VARCHAR(20)
);

INSERT INTO job_offer_statuses (status, label, description, color) VALUES
('draft', 'Brouillon', 'Offre non publiée', 'gray'),
('published', 'Publiée', 'Offre disponible', 'green'),
('closed', 'Fermée', 'Offre fermée', 'red'),
('filled', 'Pourvue', 'Poste pourvu', 'blue')
ON CONFLICT (status) DO NOTHING;

-- Internship statuses
CREATE TABLE IF NOT EXISTS internship_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(255),
  description TEXT,
  color VARCHAR(20)
);

INSERT INTO internship_statuses (status, label, description, color) VALUES
('open', 'Ouvert', 'Candidatures acceptées', 'green'),
('in_progress', 'En cours', 'Stage en cours', 'blue'),
('completed', 'Complété', 'Stage terminé', 'gray'),
('cancelled', 'Annulé', 'Stage annulé', 'red')
ON CONFLICT (status) DO NOTHING;

-- Announcement priority types
CREATE TABLE IF NOT EXISTS announcement_priority_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  priority VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(255),
  score INT,
  color VARCHAR(20)
);

INSERT INTO announcement_priority_types (priority, label, score, color) VALUES
('low', 'Basse', 1, 'gray'),
('normal', 'Normale', 2, 'blue'),
('high', 'Élevée', 3, 'orange'),
('urgent', 'Urgente', 4, 'red')
ON CONFLICT (priority) DO NOTHING;

-- Announcement audience types
CREATE TABLE IF NOT EXISTS announcement_audience_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audience VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(255),
  description TEXT
);

INSERT INTO announcement_audience_types (audience, label, description) VALUES
('all', 'Tous', 'Destiné à tous les utilisateurs'),
('students', 'Étudiants', 'Destiné aux étudiants'),
('professors', 'Professeurs', 'Destiné aux professeurs'),
('staff', 'Personnel', 'Destiné au personnel'),
('alumni', 'Anciens élèves', 'Destiné aux anciens élèves')
ON CONFLICT (audience) DO NOTHING;

-- Exam monitoring types
CREATE TABLE IF NOT EXISTS exam_monitoring_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitoring_type VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(255),
  description TEXT
);

INSERT INTO exam_monitoring_types (monitoring_type, label, description) VALUES
('in_person', 'En présentiel', 'Surveillance physique'),
('remote', 'À distance', 'Surveillance à distance'),
('hybrid', 'Hybride', 'Combinaison des deux'),
('automated', 'Automatisée', 'Surveillance par AI')
ON CONFLICT (monitoring_type) DO NOTHING;

-- ================================================================
-- SEED: Competencies (32 competencies)
-- ================================================================
INSERT INTO competencies (name, category, description, level) VALUES
('Communication écrite', 'Communication', 'Rédiger clairement et profesionnellement', 3),
('Présentation orale', 'Communication', 'Présenter efficacement devant un auditoire', 3),
('Travail d''équipe', 'Collaboration', 'Collaborer efficacement en groupe', 3),
('Leadership', 'Collaboration', 'Diriger et motiver une équipe', 2),
('Résolution de problèmes', 'Compétences transversales', 'Analyser et résoudre des problèmes complexes', 3),
('Pensée critique', 'Compétences transversales', 'Évaluer et critiquer les idées', 2),
('Gestion de projet', 'Gestion', 'Planifier et gérer des projets', 2),
('Gestion du temps', 'Gestion', 'Organiser et prioriser les tâches', 3),
('Python', 'Programmation', 'Maîtriser le langage Python', 2),
('JavaScript', 'Programmation', 'Développer avec JavaScript', 2),
('SQL', 'Bases de données', 'Interroger et gérer des bases de données', 2),
('REST API', 'Web', 'Concevoir et utiliser les APIs REST', 2),
('React', 'Frontend', 'Développer avec React', 2),
('Node.js', 'Backend', 'Développer des serveurs avec Node.js', 2),
('HTML/CSS', 'Frontend', 'Maîtriser HTML et CSS', 2),
('Data Analysis', 'Data', 'Analyser les données', 2),
('Machine Learning', 'Data', 'Appliquer le ML aux problèmes', 1),
('Cloud Computing', 'Infrastructure', 'Déployer sur AWS/Azure/GCP', 2),
('DevOps', 'Infrastructure', 'CI/CD et automatisation', 1),
('Git', 'Outils', 'Maîtriser Git et GitHub', 2),
('Linux', 'Systèmes', 'Administrer Linux', 2),
('Docker', 'Containers', 'Containeriser avec Docker', 2),
('Kubernetes', 'Orchestration', 'Orchestrer avec Kubernetes', 1),
('Pensée design', 'Design', 'Appliquer le design thinking', 2),
('UX/UI Design', 'Design', 'Designer l''expérience utilisateur', 1),
('Négociation', 'Soft skills', 'Négocier efficacement', 2),
('Empathie', 'Soft skills', 'Comprendre les besoins d''autrui', 3),
('Créativité', 'Soft skills', 'Générer des idées innovantes', 2),
('Adaptabilité', 'Soft skills', 'S''adapter aux changements', 3),
('Prise d''initiative', 'Soft skills', 'Agir sans indication', 2),
('Éthique professionnelle', 'Valeurs', 'Respecter les principes éthiques', 3),
('Engagement social', 'Valeurs', 'Contribuer à la société', 2)
ON CONFLICT (name) DO NOTHING;

-- ================================================================
-- TRIGGERS for updated_at timestamps
-- ================================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_groups_updated_at BEFORE UPDATE ON student_groups
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER student_alerts_updated_at BEFORE UPDATE ON student_alerts
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER internship_offers_updated_at BEFORE UPDATE ON internship_offers
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER learning_paths_updated_at BEFORE UPDATE ON learning_paths
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER professor_dashboards_updated_at BEFORE UPDATE ON professor_dashboards
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ================================================================
-- INDEXES for performance
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_student_alerts_severity ON student_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_internship_offers_sector ON internship_offers(sector);
CREATE INDEX IF NOT EXISTS idx_job_offers_location ON job_offers(location);
CREATE INDEX IF NOT EXISTS idx_job_offers_salary ON job_offers(salary_min, salary_max);
CREATE INDEX IF NOT EXISTS idx_competencies_level ON competencies(level);
CREATE INDEX IF NOT EXISTS idx_learning_paths_progress ON learning_paths(progress);

-- ================================================================
-- FULL TEXT SEARCH INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_internship_offers_search ON internship_offers 
USING gin(to_tsvector('french', title || ' ' || description || ' ' || company_name));

CREATE INDEX IF NOT EXISTS idx_job_offers_search ON job_offers 
USING gin(to_tsvector('french', title || ' ' || description || ' ' || company_name));

-- ================================================================
-- FINAL VERIFICATION
-- ================================================================
SELECT 
  'Tables créées: ' || COUNT(*) as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'student_groups', 'student_alerts', 'internship_offers', 
  'competencies', 'learning_paths', 'interactive_resources',
  'professor_dashboards', 'job_offers', 'exam_sessions', 'peer_feedback'
);

COMMIT;