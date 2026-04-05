-- Migration pour la gestion des cours étudiants et de l'inscription aux cours
-- Date: 2025-05-03

-- Fonction pour créer la table professor_courses si elle n'existe pas
CREATE OR REPLACE FUNCTION create_professor_courses_table()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'professor_courses') THEN
        CREATE TABLE professor_courses (
            id SERIAL PRIMARY KEY,
            professor_id INTEGER NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
            course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            academic_year VARCHAR(10) NOT NULL,
            is_principal BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            UNIQUE(professor_id, course_id, academic_year)
        );

        -- Ajouter les politiques RLS pour professor_courses
        ALTER TABLE professor_courses ENABLE ROW LEVEL SECURITY;

        -- Politique pour les administrateurs
        CREATE POLICY admin_all_professor_courses ON professor_courses
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM user_roles 
                    WHERE user_roles.user_id = auth.uid() 
                    AND user_roles.role = 'admin'
                )
            );

        -- Politique pour les professeurs (lecture seule de leurs propres cours)
        CREATE POLICY professor_read_own_courses ON professor_courses
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM professors 
                    WHERE professors.profile_id = auth.uid() 
                    AND professors.id = professor_courses.professor_id
                )
            );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer la table student_courses si elle n'existe pas
CREATE OR REPLACE FUNCTION create_student_courses_table()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'student_courses') THEN
        CREATE TABLE student_courses (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            academic_year VARCHAR(10) NOT NULL,
            semester INTEGER NOT NULL,
            enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            grade NUMERIC(4,2) DEFAULT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            UNIQUE(student_id, course_id, academic_year)
        );

        -- Commentaires sur les colonnes
        COMMENT ON COLUMN student_courses.status IS 'active, completed, failed, withdrawn';

        -- Ajouter les politiques RLS pour student_courses
        ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;

        -- Politique pour les administrateurs
        CREATE POLICY admin_all_student_courses ON student_courses
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM user_roles 
                    WHERE user_roles.user_id = auth.uid() 
                    AND user_roles.role = 'admin'
                )
            );

        -- Politique pour les professeurs (lecture seule des étudiants inscrits à leurs cours)
        CREATE POLICY professor_read_student_courses ON student_courses
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM professor_courses 
                    JOIN professors ON professor_courses.professor_id = professors.id
                    WHERE professors.profile_id = auth.uid() 
                    AND professor_courses.course_id = student_courses.course_id
                    AND professor_courses.academic_year = student_courses.academic_year
                )
            );

        -- Politique pour les étudiants (lecture seule de leurs propres cours)
        CREATE POLICY student_read_own_courses ON student_courses
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM students 
                    WHERE students.profile_id = auth.uid() 
                    AND students.id = student_courses.student_id
                )
            );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer la table student_exams si elle n'existe pas
CREATE OR REPLACE FUNCTION create_student_exams_table()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'student_exams') THEN
        CREATE TABLE student_exams (
            id SERIAL PRIMARY KEY,
            exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            grade NUMERIC(4,2) DEFAULT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            UNIQUE(exam_id, student_id)
        );

        -- Commentaires sur les colonnes
        COMMENT ON COLUMN student_exams.status IS 'pending, passed, failed, absent';

        -- Ajouter les politiques RLS pour student_exams
        ALTER TABLE student_exams ENABLE ROW LEVEL SECURITY;

        -- Politique pour les administrateurs
        CREATE POLICY admin_all_student_exams ON student_exams
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM user_roles 
                    WHERE user_roles.user_id = auth.uid() 
                    AND user_roles.role = 'admin'
                )
            );

        -- Politique pour les professeurs (lecture et mise à jour des examens pour leurs cours)
        CREATE POLICY professor_read_update_student_exams ON student_exams
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM professor_courses 
                    JOIN professors ON professor_courses.professor_id = professors.id
                    WHERE professors.profile_id = auth.uid() 
                    AND professor_courses.course_id = student_exams.course_id
                )
            );

        CREATE POLICY professor_update_student_exams ON student_exams
            FOR UPDATE
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM professor_courses 
                    JOIN professors ON professor_courses.professor_id = professors.id
                    WHERE professors.profile_id = auth.uid() 
                    AND professor_courses.course_id = student_exams.course_id
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM professor_courses 
                    JOIN professors ON professor_courses.professor_id = professors.id
                    WHERE professors.profile_id = auth.uid() 
                    AND professor_courses.course_id = student_exams.course_id
                )
            );

        -- Politique pour les étudiants (lecture seule de leurs propres examens)
        CREATE POLICY student_read_own_exams ON student_exams
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM students 
                    WHERE students.profile_id = auth.uid() 
                    AND students.id = student_exams.student_id
                )
            );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Exécuter les fonctions pour créer les tables si elles n'existent pas
SELECT create_professor_courses_table();
SELECT create_student_courses_table();
SELECT create_student_exams_table();

-- Supprimer les fonctions de création des tables
DROP FUNCTION create_professor_courses_table();
DROP FUNCTION create_student_courses_table();
DROP FUNCTION create_student_exams_table();
