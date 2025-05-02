// Script pour créer la table active_students via l'API REST de Supabase
const SUPABASE_URL = 'https://epnhnjkbxgciojevrwfq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmhuamtieGdjaW9qZXZyd2ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjIwNjkwNiwiZXhwIjoyMDYxNzgyOTA2fQ.kbEs9bN0vpsf9cE8TZuj0-sBz6LCQ3o3LU0sptEx-mY';

// SQL pour créer la table
const createTableSQL = `
CREATE TABLE IF NOT EXISTS public.active_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected',
  cheating_attempts INTEGER NOT NULL DEFAULT 0,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.active_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture pour tous" ON public.active_students
  FOR SELECT USING (true);

CREATE POLICY "Insertion pour tous" ON public.active_students
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Mise à jour pour tous" ON public.active_students
  FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.active_students;
`;

// Fonction pour créer la table
async function createTable() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({ query: createTableSQL })
    });

    const data = await response.text();
    console.log('Réponse de l\'API:', response.status, data);

    if (response.ok) {
      console.log('✅ Table active_students créée avec succès!');
    } else {
      console.error('❌ Erreur lors de la création de la table:', response.status, data);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter la fonction
createTable();
