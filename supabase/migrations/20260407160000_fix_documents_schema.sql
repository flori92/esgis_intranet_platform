-- Migration: Correction table documents pour relations cours et visibilité
-- Date: 2026-04-07

BEGIN;

-- 1. Ajouter course_id et la relation vers courses
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS course_id INTEGER REFERENCES public.courses(id) ON DELETE SET NULL;

-- 2. Ajouter visibility avec valeur par défaut
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public';

-- 3. Gérer file_path (renommer file_url si file_path n'existe pas)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'file_url') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'file_path') THEN
        ALTER TABLE public.documents RENAME COLUMN file_url TO file_path;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'file_path') THEN
        ALTER TABLE public.documents ADD COLUMN file_path TEXT;
    END IF;
END $$;

-- 4. Ajouter index pour performance
CREATE INDEX IF NOT EXISTS idx_documents_course_id ON public.documents(course_id);

COMMIT;
