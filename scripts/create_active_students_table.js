// Script pour créer la table active_students directement via l'API SQL de Supabase
import { request } from 'https';

const SUPABASE_URL = 'epnhnjkbxgciojevrwfq.supabase.co';
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
function createTable() {
  // Options pour la requête HTTP
  const options = {
    hostname: SUPABASE_URL,
    port: 443,
    path: '/rest/v1/sql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=minimal'
    }
  };

  // Créer la requête
  const req = request(options, (res) => {
    console.log(`Statut de la réponse: ${res.statusCode}`);
    
    let data = '';
    
    // Récupérer les données de la réponse
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    // Traiter la réponse complète
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('✅ Table active_students créée avec succès!');
      } else {
        console.error(`❌ Erreur lors de la création de la table: ${res.statusCode}`, data);
      }
    });
  });
  
  // Gérer les erreurs de requête
  req.on('error', (e) => {
    console.error(`❌ Erreur de requête: ${e.message}`);
  });
  
  // Envoyer la requête avec le SQL
  req.write(JSON.stringify({ query: createTableSQL }));
  req.end();
}

// Exécuter la fonction
console.log('🔧 Création de la table active_students...');
createTable();
