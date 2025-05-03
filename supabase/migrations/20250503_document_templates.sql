-- Migration: Ajout des tables pour la génération de documents administratifs
-- Date: 2025-05-03

-- Table des modèles de documents
CREATE TABLE IF NOT EXISTS document_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('certificate', 'attestation', 'transcript', 'other')),
  template_path TEXT,
  requires_signature BOOLEAN DEFAULT TRUE,
  required_fields TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des documents générés
CREATE TABLE IF NOT EXISTS generated_documents (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES document_templates(id),
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  generated_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approval_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer Row Level Security
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- Trigger pour mettre à jour le champ updated_at
CREATE TRIGGER update_document_templates_modtime
BEFORE UPDATE ON document_templates
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_generated_documents_modtime
BEFORE UPDATE ON generated_documents
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Politique pour les modèles de documents: visibles par tous, modifiables par les administrateurs
CREATE POLICY document_templates_select_policy ON document_templates
FOR SELECT USING (true);

CREATE POLICY document_templates_insert_update_delete_policy ON document_templates
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Politique pour les documents générés: visibles par les administrateurs et l'étudiant concerné
CREATE POLICY generated_documents_select_policy ON generated_documents
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
  EXISTS (
    SELECT 1 FROM profiles p JOIN students s ON p.id = s.profile_id
    WHERE p.id = auth.uid() AND s.id = generated_documents.student_id
  )
);

CREATE POLICY generated_documents_insert_policy ON generated_documents
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'student'))
);

CREATE POLICY generated_documents_update_delete_policy ON generated_documents
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
  (
    EXISTS (
      SELECT 1 FROM profiles p JOIN students s ON p.id = s.profile_id
      WHERE p.id = auth.uid() AND s.id = generated_documents.student_id
    ) AND
    generated_documents.status = 'draft'
  )
);

-- Données initiales pour les tests
INSERT INTO document_templates (name, description, type, requires_signature, required_fields, created_at) VALUES
('Certificat de scolarité', 'Certificat attestant que l''étudiant est inscrit à l''école', 'certificate', true, '{}', NOW()),
('Attestation de réussite', 'Attestation de réussite académique', 'attestation', true, '{purpose}', NOW()),
('Relevé de notes', 'Relevé détaillé des notes obtenues', 'transcript', true, '{semester, academic_year}', NOW()),
('Demande d''absence', 'Formulaire de demande d''absence justifiée', 'other', true, '{start_date, end_date, reason}', NOW());
