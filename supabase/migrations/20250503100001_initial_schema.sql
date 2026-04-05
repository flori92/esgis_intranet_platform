-- Création des tables pour l'intranet ESGIS
-- Date: 2025-05-03

-- Activation de l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des départements/filières
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  description TEXT,
  head_professor_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des profils utilisateurs (liée à auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'professor', 'student')),
  department_id INTEGER REFERENCES departments(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des étudiants
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_number VARCHAR(20) NOT NULL UNIQUE,
  entry_year INTEGER NOT NULL,
  level VARCHAR(10) NOT NULL CHECK (level IN ('L1', 'L2', 'L3', 'M1', 'M2')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'suspended', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des professeurs
CREATE TABLE IF NOT EXISTS professors (
  id SERIAL PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employee_number VARCHAR(20) NOT NULL UNIQUE,
  hire_date DATE NOT NULL,
  specialties TEXT[] DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'retired', 'terminated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des cours
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  credits INTEGER NOT NULL,
  description TEXT,
  department_id INTEGER REFERENCES departments(id),
  level VARCHAR(10) NOT NULL CHECK (level IN ('L1', 'L2', 'L3', 'M1', 'M2')),
  semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de relation professeurs-cours
CREATE TABLE IF NOT EXISTS professor_courses (
  id SERIAL PRIMARY KEY,
  professor_id INTEGER NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  academic_year VARCHAR(9) NOT NULL, -- Format: "2024-2025"
  is_principal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(professor_id, course_id, academic_year)
);

-- Table de relation étudiants-cours
CREATE TABLE IF NOT EXISTS student_courses (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  academic_year VARCHAR(9) NOT NULL, -- Format: "2024-2025"
  status VARCHAR(20) NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'failed', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id, academic_year)
);

-- Table des sessions de cours
CREATE TABLE IF NOT EXISTS course_sessions (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  professor_id INTEGER NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL, -- en minutes
  room VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des présences aux cours
CREATE TABLE IF NOT EXISTS attendances (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- Table des examens
CREATE TABLE IF NOT EXISTS exams (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL, -- en minutes
  room VARCHAR(50),
  type VARCHAR(20) NOT NULL CHECK (type IN ('midterm', 'final', 'quiz')),
  weight DECIMAL(5,2) NOT NULL, -- pourcentage dans la note finale
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'graded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des résultats d'examens
CREATE TABLE IF NOT EXISTS exam_results (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  grade DECIMAL(5,2),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  sender_id UUID REFERENCES profiles(id),
  recipient_id UUID REFERENCES profiles(id),
  recipient_role VARCHAR(20) CHECK (recipient_role IN ('admin', 'professor', 'student', 'all')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des événements
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(100),
  type VARCHAR(20) NOT NULL CHECK (type IN ('exam', 'meeting', 'holiday', 'other')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des documents
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  visibility VARCHAR(20) NOT NULL DEFAULT 'course' CHECK (visibility IN ('course', 'department', 'public')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des demandes (congés, absences, etc.)
CREATE TABLE IF NOT EXISTS requests (
  id SERIAL PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES profiles(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('leave', 'absence', 'grade_review', 'other')),
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id UUID REFERENCES profiles(id),
  review_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paiements
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  reference_number VARCHAR(100),
  description TEXT,
  academic_year VARCHAR(9) NOT NULL,
  semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des stages
CREATE TABLE IF NOT EXISTS internships (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  company_name VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,
  supervisor_name VARCHAR(100),
  supervisor_email VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'ongoing' CHECK (status IN ('pending', 'ongoing', 'completed', 'cancelled')),
  grade DECIMAL(5,2),
  professor_id INTEGER REFERENCES professors(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fonction pour mettre à jour le champ updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour le champ updated_at
CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_departments_modtime
BEFORE UPDATE ON departments
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_students_modtime
BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_professors_modtime
BEFORE UPDATE ON professors
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_courses_modtime
BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_course_sessions_modtime
BEFORE UPDATE ON course_sessions
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_exams_modtime
BEFORE UPDATE ON exams
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_exam_results_modtime
BEFORE UPDATE ON exam_results
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_events_modtime
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_documents_modtime
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_requests_modtime
BEFORE UPDATE ON requests
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_payments_modtime
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_internships_modtime
BEFORE UPDATE ON internships
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Politiques de sécurité Row Level Security (RLS)

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE professor_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;

-- Politique pour les profils: chacun peut voir son profil, les admins peuvent tout voir
CREATE POLICY profiles_select_policy ON profiles
FOR SELECT USING (
  auth.uid() = id OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY profiles_insert_policy ON profiles
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY profiles_update_policy ON profiles
FOR UPDATE USING (
  auth.uid() = id OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Politique pour les départements: visibles par tous, modifiables par les admins
CREATE POLICY departments_select_policy ON departments
FOR SELECT USING (true);

CREATE POLICY departments_insert_update_delete_policy ON departments
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Politique pour les étudiants: visibles par les admins et les professeurs, chaque étudiant peut voir son profil
CREATE POLICY students_select_policy ON students
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'professor')) OR
  EXISTS (SELECT 1 FROM profiles p JOIN students s ON p.id = s.profile_id WHERE p.id = auth.uid() AND s.id = students.id)
);

CREATE POLICY students_insert_update_delete_policy ON students
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Politique pour les professeurs: visibles par les admins, chaque professeur peut voir son profil
CREATE POLICY professors_select_policy ON professors
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
  EXISTS (SELECT 1 FROM profiles p JOIN professors pr ON p.id = pr.profile_id WHERE p.id = auth.uid() AND pr.id = professors.id)
);

CREATE POLICY professors_insert_update_delete_policy ON professors
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Politique pour les cours: visibles par tous
CREATE POLICY courses_select_policy ON courses
FOR SELECT USING (true);

CREATE POLICY courses_insert_update_delete_policy ON courses
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Politique pour les relations professeur-cours: visibles par les admins et les professeurs concernés
CREATE POLICY professor_courses_select_policy ON professor_courses
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
  EXISTS (SELECT 1 FROM profiles p JOIN professors pr ON p.id = pr.profile_id WHERE p.id = auth.uid() AND pr.id = professor_courses.professor_id)
);

CREATE POLICY professor_courses_insert_update_delete_policy ON professor_courses
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Politique pour les relations étudiant-cours: visibles par les admins, les professeurs du cours et l'étudiant concerné
CREATE POLICY student_courses_select_policy ON student_courses
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
  EXISTS (SELECT 1 FROM profiles p JOIN professors pr ON p.id = pr.profile_id JOIN professor_courses pc ON pr.id = pc.professor_id WHERE p.id = auth.uid() AND pc.course_id = student_courses.course_id) OR
  EXISTS (SELECT 1 FROM profiles p JOIN students s ON p.id = s.profile_id WHERE p.id = auth.uid() AND s.id = student_courses.student_id)
);

CREATE POLICY student_courses_insert_update_delete_policy ON student_courses
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Politique pour les sessions de cours: visibles par tous
CREATE POLICY course_sessions_select_policy ON course_sessions
FOR SELECT USING (true);

CREATE POLICY course_sessions_insert_update_delete_policy ON course_sessions
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'professor'))
);

-- Politique pour les présences: visibles par les admins, les professeurs du cours et l'étudiant concerné
CREATE POLICY attendances_select_policy ON attendances
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
  EXISTS (SELECT 1 FROM profiles p JOIN professors pr ON p.id = pr.profile_id JOIN course_sessions cs ON pr.id = cs.professor_id WHERE p.id = auth.uid() AND cs.id = attendances.session_id) OR
  EXISTS (SELECT 1 FROM profiles p JOIN students s ON p.id = s.profile_id WHERE p.id = auth.uid() AND s.id = attendances.student_id)
);

CREATE POLICY attendances_insert_update_delete_policy ON attendances
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'professor'))
);

-- Politique pour les examens: visibles par tous
CREATE POLICY exams_select_policy ON exams
FOR SELECT USING (true);

CREATE POLICY exams_insert_update_delete_policy ON exams
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'professor'))
);

-- Politique pour les résultats d'examens: visibles par les admins, les professeurs du cours et l'étudiant concerné
CREATE POLICY exam_results_select_policy ON exam_results
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
  EXISTS (SELECT 1 FROM profiles p JOIN professors pr ON p.id = pr.profile_id JOIN professor_courses pc ON pr.id = pc.professor_id JOIN exams e ON pc.course_id = e.course_id WHERE p.id = auth.uid() AND e.id = exam_results.exam_id) OR
  EXISTS (SELECT 1 FROM profiles p JOIN students s ON p.id = s.profile_id WHERE p.id = auth.uid() AND s.id = exam_results.student_id)
);

CREATE POLICY exam_results_insert_update_delete_policy ON exam_results
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'professor'))
);

-- Politique pour les notifications: chacun voit ses notifications
CREATE POLICY notifications_select_policy ON notifications
FOR SELECT USING (
  recipient_id = auth.uid() OR
  recipient_role = (SELECT role FROM profiles WHERE id = auth.uid()) OR
  recipient_role = 'all' OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY notifications_insert_policy ON notifications
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'professor'))
);

CREATE POLICY notifications_update_policy ON notifications
FOR UPDATE USING (
  recipient_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Politique pour les événements: visibles par tous
CREATE POLICY events_select_policy ON events
FOR SELECT USING (true);

CREATE POLICY events_insert_update_delete_policy ON events
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'professor'))
);

-- Politique pour les documents: visibles selon les droits d'accès
CREATE POLICY documents_select_policy ON documents
FOR SELECT USING (
  visibility = 'public' OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
  (visibility = 'department' AND EXISTS (
    SELECT 1 FROM profiles p JOIN courses c ON p.department_id = c.department_id
    WHERE p.id = auth.uid() AND c.id = documents.course_id
  )) OR
  (visibility = 'course' AND EXISTS (
    SELECT 1 FROM profiles p 
    LEFT JOIN students s ON p.id = s.profile_id
    LEFT JOIN student_courses sc ON s.id = sc.student_id
    LEFT JOIN professors pr ON p.id = pr.profile_id
    LEFT JOIN professor_courses pc ON pr.id = pc.professor_id
    WHERE p.id = auth.uid() AND (sc.course_id = documents.course_id OR pc.course_id = documents.course_id)
  ))
);

CREATE POLICY documents_insert_update_delete_policy ON documents
FOR ALL USING (
  uploaded_by = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Politique pour les demandes: chacun voit ses demandes, les admins voient tout
CREATE POLICY requests_select_policy ON requests
FOR SELECT USING (
  requester_id = auth.uid() OR
  reviewer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY requests_insert_policy ON requests
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

CREATE POLICY requests_update_policy ON requests
FOR UPDATE USING (
  requester_id = auth.uid() OR
  reviewer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Politique pour les paiements: visibles par les admins et l'étudiant concerné
CREATE POLICY payments_select_policy ON payments
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
  EXISTS (SELECT 1 FROM profiles p JOIN students s ON p.id = s.profile_id WHERE p.id = auth.uid() AND s.id = payments.student_id)
);

CREATE POLICY payments_insert_update_delete_policy ON payments
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Politique pour les stages: visibles par les admins, le professeur superviseur et l'étudiant concerné
CREATE POLICY internships_select_policy ON internships
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
  EXISTS (SELECT 1 FROM profiles p JOIN professors pr ON p.id = pr.profile_id WHERE p.id = auth.uid() AND pr.id = internships.professor_id) OR
  EXISTS (SELECT 1 FROM profiles p JOIN students s ON p.id = s.profile_id WHERE p.id = auth.uid() AND s.id = internships.student_id)
);

CREATE POLICY internships_insert_update_delete_policy ON internships
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'professor'))
);

-- Données initiales pour les tests

-- Départements
INSERT INTO departments (name, code, description) VALUES
('Informatique', 'INFO', 'Département d''informatique et sciences du numérique'),
('Gestion', 'GEST', 'Département de gestion et management'),
('Réseaux et Télécommunications', 'RT', 'Département de réseaux et télécommunications'),
('Marketing et Communication', 'MKTG', 'Département de marketing et communication');

-- Administrateur par défaut (à créer manuellement dans la console Supabase)
-- Mot de passe: Admin@123
-- INSERT INTO profiles (id, email, full_name, role, is_active)
-- VALUES ('ID_GÉNÉRÉ_PAR_SUPABASE', 'admin@esgis.bj', 'Administrateur ESGIS', 'admin', true);
