-- Migration: Table des demandes de correction de notes
-- Date: 2025-05-03
-- Description: Permet aux professeurs de soumettre des demandes de correction
-- après publication des notes, avec validation par l'administration.

-- Table des demandes de correction de notes
CREATE TABLE IF NOT EXISTS demandes_correction_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  professeur_id UUID NOT NULL REFERENCES profiles(id),
  ancienne_note NUMERIC NOT NULL,
  nouvelle_note NUMERIC NOT NULL,
  justification TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'validee', 'rejetee')),
  commentaire_admin TEXT,
  validee_par UUID REFERENCES profiles(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_corrections_professeur ON demandes_correction_notes(professeur_id);
CREATE INDEX IF NOT EXISTS idx_corrections_statut ON demandes_correction_notes(statut);
CREATE INDEX IF NOT EXISTS idx_corrections_note ON demandes_correction_notes(note_id);

-- Trigger de mise à jour du updated_at
CREATE OR REPLACE FUNCTION update_correction_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_correction_updated_at
  BEFORE UPDATE ON demandes_correction_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_correction_updated_at();

-- Trigger: Appliquer la correction quand validée
CREATE OR REPLACE FUNCTION apply_grade_correction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.statut = 'validee' AND OLD.statut = 'en_attente' THEN
    -- Mettre à jour la note
    UPDATE notes SET note = NEW.nouvelle_note, updated_at = NOW()
    WHERE id = NEW.note_id;
    
    -- Enregistrer la date de validation
    NEW.validated_at = NOW();
    
    -- Notifier l'étudiant
    INSERT INTO notifications (user_id, type, titre, contenu, lien, lu)
    SELECT n.etudiant_id, 'correction_note', 'Note corrigée',
      'Votre note a été corrigée de ' || NEW.ancienne_note || ' à ' || NEW.nouvelle_note || '.',
      '/student/grades', false
    FROM notes n WHERE n.id = NEW.note_id;
  END IF;
  
  IF NEW.statut = 'rejetee' AND OLD.statut = 'en_attente' THEN
    NEW.validated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_apply_grade_correction
  BEFORE UPDATE ON demandes_correction_notes
  FOR EACH ROW
  EXECUTE FUNCTION apply_grade_correction();

-- RLS Policies
ALTER TABLE demandes_correction_notes ENABLE ROW LEVEL SECURITY;

-- Les professeurs peuvent voir et créer leurs propres demandes
CREATE POLICY "professors_own_corrections" ON demandes_correction_notes
  FOR ALL
  USING (professeur_id = auth.uid())
  WITH CHECK (professeur_id = auth.uid());

-- Les administrateurs peuvent tout voir et modifier
CREATE POLICY "admins_all_corrections" ON demandes_correction_notes
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
