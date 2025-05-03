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

-- Politique pour les tags de documents: même politique que pour les documents
CREATE POLICY document_tags_select_policy ON document_tags
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = document_tags.document_id
    AND (
      d.visibility = 'public' OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
      (d.visibility = 'department' AND EXISTS (
        SELECT 1 FROM profiles p JOIN courses c ON p.department_id = c.department_id
        WHERE p.id = auth.uid() AND c.id = d.course_id
      )) OR
      (d.visibility = 'course' AND EXISTS (
        SELECT 1 FROM profiles p 
        LEFT JOIN students s ON p.id = s.profile_id
        LEFT JOIN student_courses sc ON s.id = sc.student_id
        LEFT JOIN professors pr ON p.id = pr.profile_id
        LEFT JOIN professor_courses pc ON pr.id = pc.professor_id
        WHERE p.id = auth.uid() AND (sc.course_id = d.course_id OR pc.course_id = d.course_id)
      ))
    )
  )
);

CREATE POLICY document_tags_insert_policy ON document_tags
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = document_tags.document_id
    AND d.uploaded_by = auth.uid()
  ) OR
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

-- Ajouter quelques tags pour tester
INSERT INTO document_tags (document_id, tag) VALUES
(1, 'important'),
(1, 'examen'),
(2, 'cours'),
(2, 'exercice'),
(3, 'projet'),
(3, 'référence');
