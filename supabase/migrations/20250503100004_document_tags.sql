-- Migration: Ajout de la table des tags de documents
-- Date: 2025-05-03

-- Création de la table pour les tags de documents
CREATE TABLE IF NOT EXISTS document_tags (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, tag)
);

-- Ajouter des index pour améliorer les performances des recherches par tag
CREATE INDEX IF NOT EXISTS idx_document_tags_document_id ON document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_tag ON document_tags(tag);

-- Activer Row Level Security
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS document_tags_select_policy ON document_tags;
DROP POLICY IF EXISTS document_tags_insert_policy ON document_tags;
DROP POLICY IF EXISTS document_tags_update_policy ON document_tags;
DROP POLICY IF EXISTS document_tags_delete_policy ON document_tags;

-- Politique simplifiée pour les tags de documents
CREATE POLICY document_tags_select_policy ON document_tags
FOR SELECT USING (true);

CREATE POLICY document_tags_insert_policy ON document_tags
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = document_tags.document_id
    AND d.uploaded_by = auth.uid()
  ) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY document_tags_update_policy ON document_tags
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY document_tags_delete_policy ON document_tags
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = document_tags.document_id
    AND d.uploaded_by = auth.uid()
  ) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger pour mettre à jour le champ updated_at
CREATE TRIGGER update_document_tags_modtime
BEFORE UPDATE ON document_tags
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
