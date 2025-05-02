-- Ajout d'un champ has_completed à la table active_students
ALTER TABLE public.active_students 
ADD COLUMN IF NOT EXISTS has_completed BOOLEAN DEFAULT FALSE;

-- Mise à jour des enregistrements existants
UPDATE public.active_students 
SET has_completed = (status = 'completed')
WHERE has_completed IS NULL;

-- Création d'un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_active_students_has_completed 
ON public.active_students(has_completed);
