-- Migration: Compatibilite legacy pour les documents de groupes
-- Date: 2026-04-03

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS group_id TEXT;

UPDATE documents
SET
  is_public = COALESCE(is_public, visibility = 'public'),
  type = COALESCE(NULLIF(type, ''), 'other');

CREATE INDEX IF NOT EXISTS idx_documents_group_id ON documents(group_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
