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

-- Politiques de sécurité pour permettre les opérations CRUD
CREATE POLICY "Lecture pour tous" ON public.active_students
  FOR SELECT USING (true);

CREATE POLICY "Insertion pour tous" ON public.active_students
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Mise à jour pour tous" ON public.active_students
  FOR UPDATE USING (true);

-- Activation des notifications temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_students;

-- Vérification que la table a été créée
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'active_students'
) AS table_exists;
