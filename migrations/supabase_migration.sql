-- Script de migration Supabase pour ajouter les tables manquantes
-- Créé le: 04/05/2025
-- Auteur: Cascade AI

-- Table quiz_results
CREATE TABLE IF NOT EXISTS quiz_results (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  completion_time INTEGER, -- en secondes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajout d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON quiz_results(quiz_id);

-- Table quiz_questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  points INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table quiz
CREATE TABLE IF NOT EXISTS quiz (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  time_limit INTEGER, -- en secondes
  passing_score INTEGER DEFAULT 60, -- pourcentage
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table quiz_attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id INTEGER REFERENCES quiz(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  answers JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table quiz_results_temp (table temporaire utilisée dans QuizContext.tsx)
CREATE TABLE IF NOT EXISTS quiz_results_temp (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  completion_time INTEGER, -- en secondes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fonction RPC pour récupérer les événements du tableau de bord étudiant
CREATE OR REPLACE FUNCTION get_student_dashboard_events(student_id UUID)
RETURNS TABLE (
  id INTEGER,
  title VARCHAR,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  location VARCHAR,
  event_type VARCHAR,
  course_id INTEGER,
  exam_id INTEGER,
  day_of_week VARCHAR
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.start_time,
    e.end_time,
    e.location,
    e.event_type,
    e.course_id,
    e.exam_id,
    TO_CHAR(e.start_time, 'Day') as day_of_week
  FROM events e
  LEFT JOIN courses c ON e.course_id = c.id
  LEFT JOIN student_courses sc ON c.id = sc.course_id
  WHERE sc.student_id = student_id
  OR e.event_type = 'general'
  ORDER BY e.start_time ASC;
END;
$$;

-- Création des politiques de sécurité RLS (Row Level Security)
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results_temp ENABLE ROW LEVEL SECURITY;

-- Politique pour quiz_results: les étudiants peuvent voir leurs propres résultats
CREATE POLICY "Les étudiants peuvent voir leurs propres résultats" 
ON quiz_results FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Politique pour quiz_results: les professeurs peuvent voir tous les résultats
CREATE POLICY "Les professeurs peuvent voir tous les résultats" 
ON quiz_results FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'professor'
  )
);

-- Politique pour quiz: tout le monde peut voir les quiz
CREATE POLICY "Tout le monde peut voir les quiz" 
ON quiz FOR SELECT
TO authenticated
USING (true);

-- Politique pour quiz: seuls les professeurs peuvent créer/modifier/supprimer des quiz
CREATE POLICY "Seuls les professeurs peuvent gérer les quiz" 
ON quiz FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'professor'
  )
);

-- Politique pour quiz_attempts: les étudiants peuvent voir leurs propres tentatives
CREATE POLICY "Les étudiants peuvent voir leurs propres tentatives" 
ON quiz_attempts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Politique pour quiz_attempts: les étudiants peuvent créer leurs propres tentatives
CREATE POLICY "Les étudiants peuvent créer leurs propres tentatives" 
ON quiz_attempts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Politique pour quiz_attempts: les étudiants peuvent mettre à jour leurs propres tentatives
CREATE POLICY "Les étudiants peuvent mettre à jour leurs propres tentatives" 
ON quiz_attempts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Triggers pour mettre à jour le champ updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quiz_results_modtime
BEFORE UPDATE ON quiz_results
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_quiz_questions_modtime
BEFORE UPDATE ON quiz_questions
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_quiz_modtime
BEFORE UPDATE ON quiz
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_quiz_attempts_modtime
BEFORE UPDATE ON quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_quiz_results_temp_modtime
BEFORE UPDATE ON quiz_results_temp
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
