// Script to fix database schema issues
import https from 'https';

// Configuration Supabase
const SUPABASE_URL = 'https://zsuszjlgatsylleuopff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzdXN6amxnYXRzeWxsZXVvcGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMDA5NjYsImV4cCI6MjA5MDc3Njk2Nn0.KoZX_65H9eeGDrV4FrYi3b-i0xxLa4GVLah-nKlHUhw';

// Fonction pour effectuer une requête HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

// SQL to fix the schema
const FIX_SQL = `
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
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
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
`;

async function fixSchema() {
  console.log('Fixing database schema...');

  const options = {
    hostname: 'zsuszjlgatsylleuopff.supabase.co',
    path: '/rest/v1/rpc/exec_sql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  };

  try {
    const result = await makeRequest(options, JSON.stringify({ sql: FIX_SQL }));
    if (result.statusCode >= 200 && result.statusCode < 300) {
      console.log('✅ Schema fixed successfully!');
    } else {
      console.error('❌ Failed to fix schema:', result.statusCode, result.data);
    }
  } catch (error) {
    console.error('❌ Error executing schema fix:', error);
  }
}

fixSchema();