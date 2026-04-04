import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const SUPABASE_URL = 'https://zsuszjlgatsylleuopff.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzdXN6amxnYXRzeWxsZXVvcGZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIwMDk2NiwiZXhwItoyMDkwNzY5NjY2fQ.KoZX_65H9eeGDrV4FrYi3b-i0xxLa4GVLah-nKlHUhw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

const SQL_QUERY = `
-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_number TEXT UNIQUE,
  entry_year INTEGER,
  level TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Create professors table
CREATE TABLE IF NOT EXISTS public.professors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  employee_number TEXT UNIQUE,
  hire_date DATE,
  specialties TEXT[],
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id)
);
`;

async function executeSql() {
  try {
    console.log('Executing SQL to create missing tables...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: SQL_QUERY });

    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }

    console.log('✅ Tables created successfully');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

executeSql();