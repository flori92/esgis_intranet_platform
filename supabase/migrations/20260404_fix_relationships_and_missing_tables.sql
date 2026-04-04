-- Migration to fix missing relationships and tables
-- Date: 2026-04-04

-- Add department_id to professors table
ALTER TABLE professors ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;

-- Add department_id to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;

-- Update existing records to set department_id from profiles
UPDATE professors SET department_id = p.department_id
FROM profiles p WHERE professors.profile_id = p.id;

UPDATE students SET department_id = p.department_id
FROM profiles p WHERE students.profile_id = p.id;

-- Create generated_documents table with correct types
CREATE TABLE IF NOT EXISTS generated_documents (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES document_templates(id),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  generated_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approval_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- Add policies for generated_documents
CREATE POLICY generated_documents_select_policy ON generated_documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN profiles p ON s.profile_id = p.id
    WHERE s.id = generated_documents.student_id
    AND (p.id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  )
);

CREATE POLICY generated_documents_insert_policy ON generated_documents
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor'))
);

CREATE POLICY generated_documents_update_policy ON generated_documents
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);