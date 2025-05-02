-- Script SQL pour créer la table active_students
-- À exécuter directement dans l'interface SQL Editor de Supabase

-- Création de la table active_students
CREATE TABLE IF NOT EXISTS public.active_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected',
  cheating_attempts INTEGER NOT NULL DEFAULT 0,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Activation de la sécurité au niveau des lignes (RLS)
ALTER TABLE public.active_students ENABLE ROW LEVEL SECURITY;

-- Vérifier si les politiques existent déjà
DO $$
BEGIN
  -- Vérifier si la politique "Lecture pour tous" existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'active_students' 
    AND policyname = 'Lecture pour tous'
  ) THEN
    -- Créer la politique si elle n'existe pas
    EXECUTE 'CREATE POLICY "Lecture pour tous" ON public.active_students
      FOR SELECT USING (true)';
  END IF;

  -- Vérifier si la politique "Insertion pour tous" existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'active_students' 
    AND policyname = 'Insertion pour tous'
  ) THEN
    -- Créer la politique si elle n'existe pas
    EXECUTE 'CREATE POLICY "Insertion pour tous" ON public.active_students
      FOR INSERT WITH CHECK (true)';
  END IF;

  -- Vérifier si la politique "Mise à jour pour tous" existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'active_students' 
    AND policyname = 'Mise à jour pour tous'
  ) THEN
    -- Créer la politique si elle n'existe pas
    EXECUTE 'CREATE POLICY "Mise à jour pour tous" ON public.active_students
      FOR UPDATE USING (true)';
  END IF;
END
$$;

-- Vérifier si la table est déjà dans la publication supabase_realtime
DO $$
DECLARE
  table_in_publication BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'active_students'
  ) INTO table_in_publication;
  
  IF NOT table_in_publication THEN
    -- Ajouter la table à la publication si elle n'y est pas déjà
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.active_students';
  END IF;
END
$$;

-- Vérification que la table a été créée
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'active_students'
) AS table_exists;
LI et l'API peux tu 