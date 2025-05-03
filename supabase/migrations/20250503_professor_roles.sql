-- Migration pour ajouter le système de gestion des rôles de professeurs
-- Date: 2025-05-03

-- Création de la fonction pour créer la table des rôles de professeurs si elle n'existe pas
CREATE OR REPLACE FUNCTION create_professor_roles_table() 
RETURNS void AS $$
BEGIN
    -- Vérifier si la table existe déjà
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'professor_roles') THEN
        -- Créer la table des rôles de professeurs
        CREATE TABLE professor_roles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            permissions TEXT[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Activer la sécurité au niveau des lignes
        ALTER TABLE professor_roles ENABLE ROW LEVEL SECURITY;

        -- Créer les politiques d'accès
        CREATE POLICY professor_roles_select_policy ON professor_roles
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'professor'))
            );

        CREATE POLICY professor_roles_insert_update_delete_policy ON professor_roles
            FOR ALL USING (
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );

        -- Créer le trigger pour mettre à jour la date de modification
        CREATE TRIGGER update_professor_roles_modtime
            BEFORE UPDATE ON professor_roles
            FOR EACH ROW EXECUTE FUNCTION update_modified_column();
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Création de la fonction pour créer la table des assignations de rôles si elle n'existe pas
CREATE OR REPLACE FUNCTION create_professor_role_assignments_table() 
RETURNS void AS $$
BEGIN
    -- Vérifier si la table existe déjà
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'professor_role_assignments') THEN
        -- Créer la table des assignations de rôles
        CREATE TABLE professor_role_assignments (
            id SERIAL PRIMARY KEY,
            professor_id INTEGER NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
            role_id INTEGER NOT NULL REFERENCES professor_roles(id) ON DELETE CASCADE,
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(professor_id, role_id)
        );

        -- Activer la sécurité au niveau des lignes
        ALTER TABLE professor_role_assignments ENABLE ROW LEVEL SECURITY;

        -- Créer les politiques d'accès
        CREATE POLICY professor_role_assignments_select_policy ON professor_role_assignments
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'professor'))
            );

        CREATE POLICY professor_role_assignments_insert_update_delete_policy ON professor_role_assignments
            FOR ALL USING (
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Exécuter les fonctions pour créer les tables si elles n'existent pas
SELECT create_professor_roles_table();
SELECT create_professor_role_assignments_table();

-- Insérer les rôles par défaut si la table est vide
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM professor_roles LIMIT 1) THEN
        INSERT INTO professor_roles (name, description, permissions) VALUES
        ('Responsable de filière', 'Gère une filière spécifique et coordonne les enseignements', 
         ARRAY['view_courses', 'edit_courses', 'view_students', 'view_grades', 'edit_grades', 'view_departments']),
        
        ('Coordinateur pédagogique', 'Coordonne les activités pédagogiques et les emplois du temps', 
         ARRAY['view_courses', 'edit_courses', 'view_students', 'view_grades']),
        
        ('Responsable des stages', 'Gère les stages et les relations avec les entreprises', 
         ARRAY['view_students', 'manage_internships', 'view_courses']),
        
        ('Tuteur', 'Accompagne un groupe d''étudiants durant leur parcours', 
         ARRAY['view_students', 'view_grades']),
        
        ('Jury d''examen', 'Membre du jury pour les délibérations des examens', 
         ARRAY['view_students', 'view_grades', 'edit_grades']);
    END IF;
END;
$$;
