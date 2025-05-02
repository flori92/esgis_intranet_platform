-- Script simplifié pour créer uniquement la table active_students
CREATE TABLE IF NOT EXISTS public.active_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected',
  cheating_attempts INTEGER NOT NULL DEFAULT 0,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Activation des politiques RLS
ALTER TABLE public.active_students ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture
CREATE POLICY "Lecture pour tous" ON public.active_students
  FOR SELECT USING (true);

-- Politique pour permettre l'insertion
CREATE POLICY "Insertion pour tous" ON public.active_students
  FOR INSERT WITH CHECK (true);

-- Politique pour permettre la mise à jour
CREATE POLICY "Mise à jour pour tous" ON public.active_students
  FOR UPDATE USING (true);

-- Activation des abonnements temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_students;
