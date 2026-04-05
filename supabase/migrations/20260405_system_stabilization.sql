-- ============================================================
-- Migration: Stabilisation Globale ESGIS Intranet
-- Date: 2026-04-05
-- Description: Unification du schéma, triggers de synchro et RLS robuste.
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FONCTION DE SYNCHRONISATION AUTH.USERS -> PUBLIC.PROFILES
-- Cette fonction assure que chaque utilisateur auth a un profil public
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = COALESCE(EXCLUDED.role, profiles.role);
  RETURN NEW;   
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users (doit être fait par un superutilisateur, 
-- mais on le définit pour l'élégance du schéma)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Note: Ce trigger nécessite des privilèges élevés. S'il échoue via API, 
-- il devra être mis manuellement dans la console Supabase.
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. UNIFICATION DES TABLES DE LIAISON
-- S'assurer que student_courses et professor_courses pointent vers les tables métier et non directement profiles
-- Cela permet une meilleure intégrité.

-- Correction student_courses (si besoin de migrer de profiles -> students)
-- Pour l'instant, on garde profile_id mais on ajoute student_id si absent
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_courses' AND column_name = 'student_entity_id') THEN
        ALTER TABLE public.student_courses ADD COLUMN student_entity_id INTEGER REFERENCES public.students(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. POLITIQUES RLS ROBUSTES (Utilisant check_is_admin)
-- Appliquer check_is_admin sur toutes les tables sensibles

-- Fonction helper check_is_admin (déjà créée, mais on s'assure qu'elle est là)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Application globale sur les tables critiques
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('courses', 'departments', 'filieres', 'exams', 'grades', 'students', 'professors')
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS %I_admin_all ON public.%I', t, t);
        EXECUTE format('CREATE POLICY %I_admin_all ON public.%I FOR ALL USING (public.check_is_admin())', t, t);
    END LOOP;
END $$;

-- 5. INDEX DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_students_department ON public.students(department_id);
CREATE INDEX IF NOT EXISTS idx_professors_department ON public.professors(department_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_course ON public.grades(course_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_combined ON public.student_courses(student_id, course_id, academic_year);
