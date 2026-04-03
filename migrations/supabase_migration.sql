-- ============================================
-- Migration Supabase pour Intranet ESGIS
-- Nouveau projet: zsuszjlgatsylleuopff
-- ============================================

-- ============================================
-- 1. TABLE: profiles (utilisateurs)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'professor', 'student')),
  department_id INTEGER,
  student_id TEXT,
  level TEXT,
  speciality TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department_id);

-- ============================================
-- 2. TABLE: departments
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  head_professor_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter la FK department_id dans profiles
ALTER TABLE profiles 
  ADD CONSTRAINT fk_profiles_department 
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- ============================================
-- 3. TABLE: courses (matières)
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  credits INTEGER DEFAULT 3,
  semester INTEGER,
  level TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TABLE: professor_courses (assignation prof-cours)
-- ============================================
CREATE TABLE IF NOT EXISTS professor_courses (
  id SERIAL PRIMARY KEY,
  professor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  academic_year TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(professor_id, course_id, academic_year)
);

-- ============================================
-- 5. TABLE: student_courses (inscription étudiant-cours)
-- ============================================
CREATE TABLE IF NOT EXISTS student_courses (
  id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  academic_year TEXT,
  grade NUMERIC(5,2),
  status TEXT DEFAULT 'enrolled',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id, academic_year)
);

-- ============================================
-- 6. TABLE: exams
-- ============================================
CREATE TABLE IF NOT EXISTS exams (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  professor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  exam_date TIMESTAMPTZ,
  duration INTEGER, -- en minutes
  total_points INTEGER DEFAULT 20,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'in_progress', 'completed', 'archived')),
  exam_type TEXT DEFAULT 'exam' CHECK (exam_type IN ('exam', 'quiz', 'midterm', 'final')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exams_professor ON exams(professor_id);
CREATE INDEX IF NOT EXISTS idx_exams_department ON exams(department_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);

-- ============================================
-- 7. TABLE: questions
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay')),
  points INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);

-- ============================================
-- 8. TABLE: question_options
-- ============================================
CREATE TABLE IF NOT EXISTS question_options (
  id SERIAL PRIMARY KEY,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_options_question ON question_options(question_id);

-- ============================================
-- 9. TABLE: exam_results
-- ============================================
CREATE TABLE IF NOT EXISTS exam_results (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score NUMERIC(5,2),
  total_points INTEGER,
  status TEXT DEFAULT 'submitted',
  answers JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES profiles(id),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_results_student ON exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam ON exam_results(exam_id);

-- ============================================
-- 10. TABLE: quiz_results
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_results (
  id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  completion_time INTEGER, -- en secondes
  answers JSONB DEFAULT '{}',
  cheating_attempts INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_results_student ON quiz_results(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_exam ON quiz_results(exam_id);

-- ============================================
-- 11. TABLE: active_students (suivi en temps réel)
-- ============================================
CREATE TABLE IF NOT EXISTS active_students (
  id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  last_ping TIMESTAMPTZ DEFAULT NOW(),
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, exam_id)
);

-- ============================================
-- 12. TABLE: cheating_attempts
-- ============================================
CREATE TABLE IF NOT EXISTS cheating_attempts (
  id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  details TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 13. TABLE: events (emploi du temps / événements)
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location TEXT,
  event_type TEXT DEFAULT 'course' CHECK (event_type IN ('course', 'exam', 'meeting', 'general', 'holiday')),
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  exam_id INTEGER REFERENCES exams(id) ON DELETE SET NULL,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id),
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

-- ============================================
-- 14. TABLE: documents
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  category TEXT DEFAULT 'general',
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES profiles(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 15. TABLE: messages
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subject TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  parent_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);

-- ============================================
-- 16. TABLE: notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ============================================
-- 17. TABLE: internships (stages)
-- ============================================
CREATE TABLE IF NOT EXISTS internships (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'in_progress', 'completed')),
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  contact_email TEXT,
  contact_phone TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 18. TABLE: internship_applications (candidatures)
-- ============================================
CREATE TABLE IF NOT EXISTS internship_applications (
  id SERIAL PRIMARY KEY,
  internship_id INTEGER REFERENCES internships(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cover_letter TEXT,
  resume_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'interview')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(internship_id, student_id)
);

-- ============================================
-- TRIGGER: updated_at automatique
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur toutes les tables avec updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT table_name FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
    AND table_schema = 'public'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trigger_updated_at ON %I;
      CREATE TRIGGER trigger_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    ', t, t);
  END LOOP;
END;
$$;

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE professor_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheating_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_applications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policies: Profiles
-- ============================================
CREATE POLICY "Utilisateurs peuvent voir tous les profils"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Utilisateurs peuvent modifier leur propre profil"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins peuvent tout faire sur profiles"
  ON profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Insertion de profil à la création"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================
-- Policies: Departments, Courses (lecture pour tous, écriture admins)
-- ============================================
CREATE POLICY "Lecture departments pour tous" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gèrent departments" ON departments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Lecture courses pour tous" ON courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gèrent courses" ON courses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Lecture professor_courses pour tous" ON professor_courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gèrent professor_courses" ON professor_courses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Lecture student_courses pour tous" ON student_courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gèrent student_courses" ON student_courses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- Policies: Exams
-- ============================================
CREATE POLICY "Lecture exams pour tous" ON exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profs gèrent leurs exams" ON exams FOR ALL TO authenticated
  USING (professor_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Lecture questions pour tous" ON questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profs gèrent questions de leurs exams" ON questions FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM exams WHERE exams.id = questions.exam_id 
    AND (exams.professor_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  ));

CREATE POLICY "Lecture options pour tous" ON question_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profs gèrent options" ON question_options FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM questions q JOIN exams e ON e.id = q.exam_id 
    WHERE q.id = question_options.question_id
    AND (e.professor_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  ));

-- ============================================
-- Policies: Résultats
-- ============================================
CREATE POLICY "Étudiants voient leurs résultats" ON exam_results FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor')));
CREATE POLICY "Étudiants soumettent résultats" ON exam_results FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "Profs/admins gèrent résultats" ON exam_results FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor')));

CREATE POLICY "Étudiants voient leurs quiz_results" ON quiz_results FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor')));
CREATE POLICY "Étudiants insèrent quiz_results" ON quiz_results FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

-- ============================================
-- Policies: Active students & cheating
-- ============================================
CREATE POLICY "Suivi active_students" ON active_students FOR ALL TO authenticated USING (true);
CREATE POLICY "Enregistrement cheating" ON cheating_attempts FOR ALL TO authenticated USING (true);

-- ============================================
-- Policies: Events, Documents, Messages, Notifications
-- ============================================
CREATE POLICY "Lecture events pour tous" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins/profs gèrent events" ON events FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor')));

CREATE POLICY "Lecture documents pour tous" ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins/profs gèrent documents" ON documents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor')));

CREATE POLICY "Utilisateurs voient leurs messages" ON messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "Utilisateurs envoient des messages" ON messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Utilisateurs modifient messages reçus (lecture)" ON messages FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Utilisateurs voient leurs notifications" ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Système insère notifications" ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "Utilisateurs marquent notifications lues" ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- Policies: Stages
-- ============================================
CREATE POLICY "Lecture internships pour tous" ON internships FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gèrent internships" ON internships FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Étudiants voient leurs candidatures" ON internship_applications FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Étudiants postulent" ON internship_applications FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "Admins gèrent candidatures" ON internship_applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
