-- Script de création de la table quiz_results dans Supabase
-- À exécuter dans l'éditeur SQL de Supabase (https://epnhnjkbxgciojevrwfq.supabase.co/project/sql)

-- Création de la table quiz_results pour stocker les résultats des examens
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

-- Ajout des politiques de sécurité Row Level Security (RLS)
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Politique permettant à tous les utilisateurs de lire les résultats
CREATE POLICY "Tout le monde peut lire les résultats" 
  ON public.quiz_results FOR SELECT 
  USING (true);

-- Politique permettant à tous les utilisateurs d'insérer leurs propres résultats
CREATE POLICY "Les utilisateurs peuvent ajouter leurs résultats" 
  ON public.quiz_results FOR INSERT 
  WITH CHECK (true);

-- Création d'un index sur student_id pour des recherches plus rapides
CREATE INDEX IF NOT EXISTS idx_quiz_results_student_id ON public.quiz_results(student_id);

-- Création d'un index sur completed_at pour trier par date
CREATE INDEX IF NOT EXISTS idx_quiz_results_completed_at ON public.quiz_results(completed_at);

-- Ajout d'une fonction pour calculer la moyenne des scores
CREATE OR REPLACE FUNCTION get_average_score()
RETURNS NUMERIC AS $$
BEGIN
  RETURN (SELECT AVG(score) FROM public.quiz_results);
END;
$$ LANGUAGE plpgsql;

-- Activation des abonnements temps réel pour cette table
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_results;
