-- Migration: Correction des données et alignement Students/Professors/Profiles
-- Date: 2026-04-05

-- 1. S'assurer que tous les profils ont le bon rôle basé sur leur existence dans les tables métier
UPDATE public.profiles p
SET role = 'student'
FROM public.students s
WHERE s.profile_id = p.id AND p.role != 'student';

UPDATE public.profiles p
SET role = 'professor'
FROM public.professors prof
WHERE prof.profile_id = p.id AND p.role != 'professor';

-- 2. Aligner les départements : copier department_id de students/professors vers profiles si absent
UPDATE public.profiles p
SET department_id = s.department_id
FROM public.students s
WHERE s.profile_id = p.id AND p.department_id IS NULL AND s.department_id IS NOT NULL;

UPDATE public.profiles p
SET department_id = prof.department_id
FROM public.professors prof
WHERE prof.profile_id = p.id AND p.department_id IS NULL AND prof.department_id IS NOT NULL;

-- 3. Inversement : s'assurer que students/professors ont le department_id du profil
UPDATE public.students s
SET department_id = p.department_id
FROM public.profiles p
WHERE s.profile_id = p.id AND s.department_id IS NULL AND p.department_id IS NOT NULL;

UPDATE public.professors prof
SET department_id = p.department_id
FROM public.profiles p
WHERE prof.profile_id = p.id AND prof.department_id IS NULL AND p.department_id IS NOT NULL;

-- 4. Nettoyage des chaînes vides dans les colonnes critiques
UPDATE public.students SET level = NULL WHERE level = '';
UPDATE public.students SET academic_year = NULL WHERE academic_year = '';
UPDATE public.profiles SET full_name = email WHERE full_name = '' OR full_name IS NULL;
