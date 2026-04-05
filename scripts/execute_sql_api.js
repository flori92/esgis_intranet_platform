// Script pour exécuter le SQL via l'API REST de Supabase
import https from 'https';

// Configuration Supabase
const SUPABASE_URL = 'https://zsuszjlgatsylleuopff.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzdXN6amxnYXRzeWxsZXVvcGZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIwMDk2NiwiZXhwIjoyMDkwNzY5NjY2fQ.KoZX_65H9eeGDrV4FrYi3b-i0xxLa4GVLah-nKlHUhw';

// SQL à exécuter
const SQL_QUERY = `
-- Script to create missing students and professors tables

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

-- Add RLS policies for students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own record" ON public.students
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Professors and admins can view all students" ON public.students
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('professor', 'admin')
    )
  );

CREATE POLICY "Admins can manage students" ON public.students
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Add RLS policies for professors table
ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors can view their own record" ON public.professors
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Everyone can view professors" ON public.professors
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage professors" ON public.professors
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_students_profile_id ON public.students(profile_id);
CREATE INDEX IF NOT EXISTS idx_students_student_number ON public.students(student_number);
CREATE INDEX IF NOT EXISTS idx_professors_profile_id ON public.professors(profile_id);
CREATE INDEX IF NOT EXISTS idx_professors_employee_number ON public.professors(employee_number);
`;

// Fonction pour exécuter une requête SQL directement via l'API REST
async function executeSql() {
  return new Promise((resolve, reject) => {
    // Créer une requête POST vers l'API REST de Supabase
    const options = {
      hostname: 'zsuszjlgatsylleuopff.supabase.co',
      path: '/rest/v1/rpc/alter_table_add_column',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Requête SQL exécutée avec succès');
          try {
            const jsonData = JSON.parse(data);
            console.log('Réponse:', jsonData);
          } catch (e) {
            console.log('Réponse (non-JSON):', data);
          }
          resolve(true);
        } else {
          console.error(`❌ Erreur lors de l'exécution de la requête SQL: ${res.statusCode}`);
          console.error('Réponse:', data);
          
          // Si la fonction RPC n'existe pas, essayons une approche alternative
          if (res.statusCode === 404) {
            console.log('⚠️ La fonction RPC n\'existe pas, tentative avec une approche alternative...');
            executeAlternativeApproach().then(resolve).catch(reject);
          } else {
            reject(new Error(`HTTP status ${res.statusCode}`));
          }
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Erreur de requête:', error.message);
      reject(error);
    });
    
    // Envoyer les données
    req.write(JSON.stringify({
      table_name: 'active_students',
      column_name: 'has_completed',
      column_type: 'BOOLEAN',
      default_value: 'FALSE'
    }));
    req.end();
  });
}

// Approche alternative: utiliser l'API REST pour vérifier et modifier la table
async function executeAlternativeApproach() {
  console.log('Utilisation de l\'API REST pour vérifier la table active_students...');
  
  // Étape 1: Vérifier si la table existe et si le champ existe déjà
  const checkColumnExists = () => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'zsuszjlgatsylleuopff.supabase.co',
        path: '/rest/v1/active_students?select=has_completed&limit=1',
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('✅ Le champ has_completed existe déjà dans la table active_students');
            resolve(true);
          } else if (res.statusCode === 400 && data.includes('column')) {
            console.log('❌ Le champ has_completed n\'existe pas encore dans la table active_students');
            resolve(false);
          } else {
            console.error(`❌ Erreur lors de la vérification du champ: ${res.statusCode}`);
            console.error('Réponse:', data);
            reject(new Error(`HTTP status ${res.statusCode}`));
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('❌ Erreur de requête:', error.message);
        reject(error);
      });
      
      req.end();
    });
  };
  
  try {
    const columnExists = await checkColumnExists();
    
    if (!columnExists) {
      console.log('⚠️ Impossible d\'ajouter le champ via l\'API REST directement.');
      console.log('⚠️ Veuillez exécuter le script SQL suivant dans l\'éditeur SQL de Supabase:');
      console.log('\n' + SQL_QUERY + '\n');
    }
    
    return columnExists;
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de l\'approche alternative:', error.message);
    throw error;
  }
}

// Exécuter le script
console.log('Exécution du script SQL pour ajouter le champ has_completed à la table active_students...');
executeSql()
  .then(() => console.log('✅ Script terminé'))
  .catch(error => console.error('❌ Erreur lors de l\'exécution du script:', error.message));
