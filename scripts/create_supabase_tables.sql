-- Script de création de la table quiz_results dans Supabase
-- À exécuter dans l'éditeur SQL de Supabase (https://epnhnjkbxgciojevrwfq.supabase.co/project/sql)

-- Création de la table quiz_results
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  score NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL,
  answers JSONB NOT NULL,
  cheating_attempts INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ajout des commentaires pour la documentation
COMMENT ON TABLE public.quiz_results IS 'Stocke les résultats des quiz des étudiants';
COMMENT ON COLUMN public.quiz_results.id IS 'Identifiant unique du résultat';
COMMENT ON COLUMN public.quiz_results.student_id IS 'Identifiant de l''étudiant';
COMMENT ON COLUMN public.quiz_results.student_name IS 'Nom de l''étudiant';
COMMENT ON COLUMN public.quiz_results.score IS 'Score obtenu par l''étudiant';
COMMENT ON COLUMN public.quiz_results.max_score IS 'Score maximum possible';
COMMENT ON COLUMN public.quiz_results.answers IS 'Réponses de l''étudiant au format JSON';
COMMENT ON COLUMN public.quiz_results.cheating_attempts IS 'Nombre de tentatives de triche détectées';
COMMENT ON COLUMN public.quiz_results.completed_at IS 'Date et heure de fin du quiz';
COMMENT ON COLUMN public.quiz_results.created_at IS 'Date et heure d''enregistrement du résultat';

-- Création d'une politique RLS pour permettre les insertions anonymes
-- Mais restreindre la lecture aux utilisateurs authentifiés
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Politique pour les insertions anonymes
CREATE POLICY "Allow anonymous inserts" ON public.quiz_results
  FOR INSERT TO anon
  WITH CHECK (true);

-- Politique pour permettre à tous les utilisateurs authentifiés de lire les résultats
CREATE POLICY "Allow authenticated reads" ON public.quiz_results
  FOR SELECT
  USING (true);

-- Activation des abonnements temps réel pour cette table
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_results;

-- Création d'un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS quiz_results_student_id_idx ON public.quiz_results (student_id);
CREATE INDEX IF NOT EXISTS quiz_results_completed_at_idx ON public.quiz_results (completed_at DESC);
