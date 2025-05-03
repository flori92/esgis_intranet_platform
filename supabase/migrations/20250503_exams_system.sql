-- Migration pour le système complet d'examens
-- Date: 2025-05-03

-- Fonction pour créer la table exam_centers si elle n'existe pas
CREATE OR REPLACE FUNCTION create_exam_centers_table()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exam_centers') THEN
        CREATE TABLE exam_centers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            location VARCHAR(255) NOT NULL,
            capacity INTEGER NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            CONSTRAINT unique_center_name UNIQUE (name)
        );

        -- Commentaires sur les colonnes
        COMMENT ON COLUMN exam_centers.status IS 'active, inactive, maintenance';

        -- Ajouter les politiques RLS pour exam_centers
        ALTER TABLE exam_centers ENABLE ROW LEVEL SECURITY;

        -- Politique pour les administrateurs
        CREATE POLICY admin_all_exam_centers ON exam_centers
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM user_roles 
                    WHERE user_roles.user_id = auth.uid() 
                    AND user_roles.role = 'admin'
                )
            );

        -- Politique pour les professeurs (lecture seule)
        CREATE POLICY professor_read_exam_centers ON exam_centers
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM professors 
                    WHERE professors.profile_id = auth.uid()
                )
            );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer la table exam_sessions si elle n'existe pas
CREATE OR REPLACE FUNCTION create_exam_sessions_table()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exam_sessions') THEN
        CREATE TABLE exam_sessions (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            academic_year VARCHAR(10) NOT NULL,
            semester INTEGER NOT NULL,
            start_date TIMESTAMP WITH TIME ZONE NOT NULL,
            end_date TIMESTAMP WITH TIME ZONE NOT NULL,
            registration_deadline DATE NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'planned',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            created_by VARCHAR(36) NOT NULL,
            CONSTRAINT date_check CHECK (end_date > start_date)
        );

        -- Commentaires sur les colonnes
        COMMENT ON COLUMN exam_sessions.status IS 'planned, active, completed, cancelled';

        -- Ajouter les politiques RLS pour exam_sessions
        ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

        -- Politique pour les administrateurs
        CREATE POLICY admin_all_exam_sessions ON exam_sessions
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM user_roles 
                    WHERE user_roles.user_id = auth.uid() 
                    AND user_roles.role = 'admin'
                )
            );

        -- Politique pour les professeurs (lecture seule)
        CREATE POLICY professor_read_exam_sessions ON exam_sessions
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM professors 
                    WHERE professors.profile_id = auth.uid()
                )
            );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer la table exams si elle n'existe pas (mise à jour)
CREATE OR REPLACE FUNCTION create_exams_table()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exams') THEN
        CREATE TABLE exams (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            exam_session_id INTEGER REFERENCES exam_sessions(id) ON DELETE SET NULL,
            exam_center_id INTEGER REFERENCES exam_centers(id) ON DELETE SET NULL,
            professor_id INTEGER NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
            date TIMESTAMP WITH TIME ZONE NOT NULL,
            duration INTEGER NOT NULL, -- en minutes
            type VARCHAR(50) NOT NULL,
            total_points NUMERIC(5,2) NOT NULL DEFAULT 20.00,
            passing_grade NUMERIC(5,2) NOT NULL DEFAULT 10.00,
            description TEXT,
            instructions TEXT,
            max_students INTEGER,
            room VARCHAR(50),
            status VARCHAR(20) NOT NULL DEFAULT 'draft',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        );

        -- Commentaires sur les colonnes
        COMMENT ON COLUMN exams.type IS 'midterm, final, quiz, project, oral, practical';
        COMMENT ON COLUMN exams.status IS 'draft, published, in_progress, grading, completed, cancelled';

        -- Ajouter les politiques RLS pour exams
        ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

        -- Politique pour les administrateurs
        CREATE POLICY admin_all_exams ON exams
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM user_roles 
                    WHERE user_roles.user_id = auth.uid() 
                    AND user_roles.role = 'admin'
                )
            );

        -- Politique pour les professeurs (CRUD pour leurs propres examens)
        CREATE POLICY professor_crud_own_exams ON exams
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM professors 
                    WHERE professors.profile_id = auth.uid() 
                    AND professors.id = exams.professor_id
                )
            );

        -- Politique pour les professeurs (lecture des examens des cours auxquels ils sont assignés)
        CREATE POLICY professor_read_assigned_exams ON exams
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM professor_courses 
                    JOIN professors ON professor_courses.professor_id = professors.id
                    WHERE professors.profile_id = auth.uid() 
                    AND professor_courses.course_id = exams.course_id
                )
            );

        -- Politique pour les étudiants (lecture des examens auxquels ils sont inscrits)
        CREATE POLICY student_read_own_exams ON exams
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM student_exams 
                    JOIN students ON student_exams.student_id = students.id
                    WHERE students.profile_id = auth.uid() 
                    AND student_exams.exam_id = exams.id
                )
            );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer la table exam_questions si elle n'existe pas
CREATE OR REPLACE FUNCTION create_exam_questions_table()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exam_questions') THEN
        CREATE TABLE exam_questions (
            id SERIAL PRIMARY KEY,
            exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
            question_number INTEGER NOT NULL,
            question_text TEXT NOT NULL,
            question_type VARCHAR(20) NOT NULL,
            points NUMERIC(5,2) NOT NULL,
            options JSONB, -- Pour les QCM
            correct_answer TEXT, -- Pour les questions à réponse unique
            rubric TEXT, -- Critères d'évaluation pour les questions ouvertes
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            CONSTRAINT unique_question_number UNIQUE (exam_id, question_number)
        );

        -- Commentaires sur les colonnes
        COMMENT ON COLUMN exam_questions.question_type IS 'multiple_choice, short_answer, essay, numerical, true_false';
        COMMENT ON COLUMN exam_questions.options IS 'Pour les QCM: [{"id": "a", "text": "Option A"}, {"id": "b", "text": "Option B"}]';

        -- Ajouter les politiques RLS pour exam_questions
        ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;

        -- Politique pour les administrateurs
        CREATE POLICY admin_all_exam_questions ON exam_questions
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM user_roles 
                    WHERE user_roles.user_id = auth.uid() 
                    AND user_roles.role = 'admin'
                )
            );

        -- Politique pour les professeurs (CRUD pour les questions de leurs propres examens)
        CREATE POLICY professor_crud_own_exam_questions ON exam_questions
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM exams 
                    JOIN professors ON exams.professor_id = professors.id
                    WHERE professors.profile_id = auth.uid() 
                    AND exams.id = exam_questions.exam_id
                )
            );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer la table exam_supervisors si elle n'existe pas
CREATE OR REPLACE FUNCTION create_exam_supervisors_table()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exam_supervisors') THEN
        CREATE TABLE exam_supervisors (
            id SERIAL PRIMARY KEY,
            exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
            professor_id INTEGER NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
            role VARCHAR(20) NOT NULL DEFAULT 'supervisor',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            CONSTRAINT unique_supervisor UNIQUE (exam_id, professor_id)
        );

        -- Commentaires sur les colonnes
        COMMENT ON COLUMN exam_supervisors.role IS 'supervisor, proctor, coordinator';

        -- Ajouter les politiques RLS pour exam_supervisors
        ALTER TABLE exam_supervisors ENABLE ROW LEVEL SECURITY;

        -- Politique pour les administrateurs
        CREATE POLICY admin_all_exam_supervisors ON exam_supervisors
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM user_roles 
                    WHERE user_roles.user_id = auth.uid() 
                    AND user_roles.role = 'admin'
                )
            );

        -- Politique pour les professeurs (lecture et mise à jour pour les examens qu'ils créent)
        CREATE POLICY professor_crud_own_exam_supervisors ON exam_supervisors
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM exams 
                    JOIN professors ON exams.professor_id = professors.id
                    WHERE professors.profile_id = auth.uid() 
                    AND exams.id = exam_supervisors.exam_id
                )
            );

        -- Politique pour les professeurs (lecture de leurs propres assignations)
        CREATE POLICY professor_read_own_supervisors ON exam_supervisors
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM professors 
                    WHERE professors.profile_id = auth.uid() 
                    AND professors.id = exam_supervisors.professor_id
                )
            );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour la table student_exams si elle existe déjà
CREATE OR REPLACE FUNCTION update_student_exams_table()
RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'student_exams') THEN
        -- Ajouter les nouvelles colonnes si elles n'existent pas
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'student_exams' AND column_name = 'seat_number') THEN
            ALTER TABLE student_exams ADD COLUMN seat_number VARCHAR(10);
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'student_exams' AND column_name = 'attendance') THEN
            ALTER TABLE student_exams ADD COLUMN attendance VARCHAR(20) DEFAULT 'pending';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'student_exams' AND column_name = 'arrival_time') THEN
            ALTER TABLE student_exams ADD COLUMN arrival_time TIMESTAMP WITH TIME ZONE;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'student_exams' AND column_name = 'departure_time') THEN
            ALTER TABLE student_exams ADD COLUMN departure_time TIMESTAMP WITH TIME ZONE;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'student_exams' AND column_name = 'comments') THEN
            ALTER TABLE student_exams ADD COLUMN comments TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'student_exams' AND column_name = 'answers') THEN
            ALTER TABLE student_exams ADD COLUMN answers JSONB;
        END IF;
        
        -- Commentaires sur les colonnes
        COMMENT ON COLUMN student_exams.attendance IS 'pending, present, absent, late, excused';
        COMMENT ON COLUMN student_exams.answers IS 'Réponses de l''étudiant au format JSON';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer la table exam_incidents si elle n'existe pas
CREATE OR REPLACE FUNCTION create_exam_incidents_table()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exam_incidents') THEN
        CREATE TABLE exam_incidents (
            id SERIAL PRIMARY KEY,
            exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
            student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
            reported_by INTEGER NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
            incident_time TIMESTAMP WITH TIME ZONE NOT NULL,
            incident_type VARCHAR(50) NOT NULL,
            description TEXT NOT NULL,
            severity VARCHAR(20) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'reported',
            resolution TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        );

        -- Commentaires sur les colonnes
        COMMENT ON COLUMN exam_incidents.incident_type IS 'cheating, disruption, illness, technical_issue, other';
        COMMENT ON COLUMN exam_incidents.severity IS 'minor, moderate, major, critical';
        COMMENT ON COLUMN exam_incidents.status IS 'reported, investigating, resolved, dismissed';

        -- Ajouter les politiques RLS pour exam_incidents
        ALTER TABLE exam_incidents ENABLE ROW LEVEL SECURITY;

        -- Politique pour les administrateurs
        CREATE POLICY admin_all_exam_incidents ON exam_incidents
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM user_roles 
                    WHERE user_roles.user_id = auth.uid() 
                    AND user_roles.role = 'admin'
                )
            );

        -- Politique pour les professeurs (CRUD pour les incidents qu'ils rapportent)
        CREATE POLICY professor_crud_own_exam_incidents ON exam_incidents
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM professors 
                    WHERE professors.profile_id = auth.uid() 
                    AND professors.id = exam_incidents.reported_by
                )
            );

        -- Politique pour les professeurs (lecture des incidents des examens qu'ils créent)
        CREATE POLICY professor_read_exam_incidents ON exam_incidents
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM exams 
                    JOIN professors ON exams.professor_id = professors.id
                    WHERE professors.profile_id = auth.uid() 
                    AND exams.id = exam_incidents.exam_id
                )
            );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer la table exam_grades si elle n'existe pas
CREATE OR REPLACE FUNCTION create_exam_grades_table()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exam_grades') THEN
        CREATE TABLE exam_grades (
            id SERIAL PRIMARY KEY,
            student_exam_id INTEGER NOT NULL REFERENCES student_exams(id) ON DELETE CASCADE,
            question_id INTEGER NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
            points_earned NUMERIC(5,2) NOT NULL,
            feedback TEXT,
            graded_by INTEGER NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
            graded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            CONSTRAINT unique_grade UNIQUE (student_exam_id, question_id)
        );

        -- Ajouter les politiques RLS pour exam_grades
        ALTER TABLE exam_grades ENABLE ROW LEVEL SECURITY;

        -- Politique pour les administrateurs
        CREATE POLICY admin_all_exam_grades ON exam_grades
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM user_roles 
                    WHERE user_roles.user_id = auth.uid() 
                    AND user_roles.role = 'admin'
                )
            );

        -- Politique pour les professeurs (CRUD pour les notes qu'ils donnent)
        CREATE POLICY professor_crud_own_exam_grades ON exam_grades
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM professors 
                    WHERE professors.profile_id = auth.uid() 
                    AND professors.id = exam_grades.graded_by
                )
            );

        -- Politique pour les étudiants (lecture seule pour leurs propres notes)
        CREATE POLICY student_read_own_exam_grades ON exam_grades
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM student_exams 
                    JOIN students ON student_exams.student_id = students.id
                    WHERE students.profile_id = auth.uid() 
                    AND student_exams.id = exam_grades.student_exam_id
                )
            );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Exécuter les fonctions pour créer les tables si elles n'existent pas
SELECT create_exam_centers_table();
SELECT create_exam_sessions_table();
SELECT create_exams_table();
SELECT create_exam_questions_table();
SELECT create_exam_supervisors_table();
SELECT update_student_exams_table();
SELECT create_exam_incidents_table();
SELECT create_exam_grades_table();

-- Insertion des données initiales pour les centres d'examen
INSERT INTO exam_centers (name, location, capacity, status)
VALUES 
    ('Centre Principal', 'Bâtiment A, Campus Central', 200, 'active'),
    ('Centre Sciences', 'Bâtiment B, Campus Sciences', 150, 'active'),
    ('Centre Informatique', 'Bâtiment C, Campus Technologies', 100, 'active'),
    ('Centre Business', 'Bâtiment D, Campus Économie', 120, 'active')
ON CONFLICT (name) DO NOTHING;

-- Supprimer les fonctions de création des tables
DROP FUNCTION create_exam_centers_table();
DROP FUNCTION create_exam_sessions_table();
DROP FUNCTION create_exams_table();
DROP FUNCTION create_exam_questions_table();
DROP FUNCTION create_exam_supervisors_table();
DROP FUNCTION update_student_exams_table();
DROP FUNCTION create_exam_incidents_table();
DROP FUNCTION create_exam_grades_table();
