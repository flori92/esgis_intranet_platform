// Script pour exécuter le SQL via l'API REST de Supabase
import https from 'https';

// Configuration Supabase
const SUPABASE_URL = 'https://epnhnjkbxgciojevrwfq.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmhuamtieGdjaW9qZXZyd2ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjIwNjkwNiwiZXhwIjoyMDYxNzgyOTA2fQ.kbEs9bN0vpsf9cE8TZuj0-sBz6LCQ3o3LU0sptEx-mY';

// SQL à exécuter
const SQL_QUERY = `
-- Ajout d'un champ has_completed à la table active_students
ALTER TABLE public.active_students 
ADD COLUMN IF NOT EXISTS has_completed BOOLEAN DEFAULT FALSE;

-- Mise à jour des enregistrements existants
UPDATE public.active_students 
SET has_completed = (status = 'completed')
WHERE has_completed IS NULL;

-- Création d'un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_active_students_has_completed 
ON public.active_students(has_completed);
`;

// Fonction pour exécuter une requête SQL directement via l'API REST
async function executeSql() {
  return new Promise((resolve, reject) => {
    // Créer une requête POST vers l'API REST de Supabase
    const options = {
      hostname: 'epnhnjkbxgciojevrwfq.supabase.co',
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
        hostname: 'epnhnjkbxgciojevrwfq.supabase.co',
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
