-- Fix for ESGIS Intranet Database Issues
-- Run this SQL in your Supabase SQL Editor

-- 1. Add department_id to professors and students tables
ALTER TABLE professors ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;

-- 2. Update existing records to set department_id from profiles
UPDATE professors SET department_id = p.department_id
FROM profiles p WHERE professors.profile_id = p.id;

UPDATE students SET department_id = p.department_id
FROM profiles p WHERE students.profile_id = p.id;

-- 3. Create generated_documents table
CREATE TABLE IF NOT EXISTS generated_documents (
  id SERIAL PRIMARY KEY,
  template_id INTEGER,
  student_id INTEGER,
  file_path TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  generated_by UUID,
  approved_by UUID,
  approval_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints after table creation
ALTER TABLE generated_documents ADD CONSTRAINT fk_generated_documents_template_id
  FOREIGN KEY (template_id) REFERENCES document_templates(id);
ALTER TABLE generated_documents ADD CONSTRAINT fk_generated_documents_student_id
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE generated_documents ADD CONSTRAINT fk_generated_documents_generated_by
  FOREIGN KEY (generated_by) REFERENCES profiles(id);
ALTER TABLE generated_documents ADD CONSTRAINT fk_generated_documents_approved_by
  FOREIGN KEY (approved_by) REFERENCES profiles(id);

-- 4. Enable RLS
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for generated_documents
DROP POLICY IF EXISTS generated_documents_select_policy ON generated_documents;
DROP POLICY IF EXISTS generated_documents_insert_policy ON generated_documents;
DROP POLICY IF EXISTS generated_documents_update_policy ON generated_documents;

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

-- 6. Add missing columns to existing tables if needed
DO $$
BEGIN
  -- Add manual_deposit and deposit_note to generated_documents if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_documents' AND column_name = 'manual_deposit') THEN
    ALTER TABLE generated_documents ADD COLUMN manual_deposit BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_documents' AND column_name = 'deposit_note') THEN
    ALTER TABLE generated_documents ADD COLUMN deposit_note TEXT;
  END IF;
END;
$$;