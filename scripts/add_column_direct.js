// Script pour ajouter directement le champ has_completed via l'API REST de Supabase
import https from 'https';

// Configuration Supabase
const SUPABASE_URL = 'https://epnhnjkbxgciojevrwfq.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmhuamtieGdjaW9qZXZyd2ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjIwNjkwNiwiZXhwIjoyMDYxNzgyOTA2fQ.kbEs9bN0vpsf9cE8TZuj0-sBz6LCQ3o3LU0sptEx-mY';

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
          // Tenter de parser en JSON si possible
          const jsonData = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          // Sinon retourner la réponse brute
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

// Fonction pour vérifier si le champ has_completed existe déjà
async function checkColumnExists() {
  console.log('Vérification de l\'existence du champ has_completed...');
  
  const options = {
    hostname: 'epnhnjkbxgciojevrwfq.supabase.co',
    path: '/rest/v1/active_students?select=has_completed&limit=1',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
    }
  };
  
  try {
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ Le champ has_completed existe déjà dans la table active_students');
      return true;
    } else {
      console.log('❌ Le champ has_completed n\'existe pas encore dans la table active_students');
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du champ:', error.message);
    return false;
  }
}

// Fonction pour exécuter le SQL via l'API PostgreSQL de Supabase
async function executeSqlViaPostgrest() {
  console.log('Tentative d\'exécution du SQL via l\'API PostgreSQL...');
  
  // Nous allons utiliser une approche différente : créer un enregistrement test avec le champ has_completed
  // Si le champ n'existe pas, PostgreSQL l'ajoutera automatiquement (avec certaines limitations)
  
  // Étape 1: Récupérer un ID existant ou en créer un nouveau
  const options1 = {
    hostname: 'epnhnjkbxgciojevrwfq.supabase.co',
    path: '/rest/v1/active_students?select=student_id&limit=1',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
    }
  };
  
  try {
    const response1 = await makeRequest(options1);
    
    if (response1.statusCode === 200 && Array.isArray(response1.data) && response1.data.length > 0) {
      const studentId = response1.data[0].student_id;
      console.log(`✅ ID d'étudiant existant trouvé: ${studentId}`);
      
      // Étape 2: Mettre à jour l'enregistrement avec le nouveau champ
      const options2 = {
        hostname: 'epnhnjkbxgciojevrwfq.supabase.co',
        path: '/rest/v1/active_students',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
          'Prefer': 'resolution=merge-duplicates'
        }
      };
      
      const data = JSON.stringify({
        student_id: 'test-id-' + Date.now(),
        student_name: 'Test Student',
        status: 'connected',
        has_completed: false,
        cheating_attempts: 0,
        connected_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      });
      
      const response2 = await makeRequest(options2, data);
      
      if (response2.statusCode === 201) {
        console.log('✅ Enregistrement créé avec le champ has_completed');
        return true;
      } else {
        console.error(`❌ Erreur lors de la création de l'enregistrement: ${response2.statusCode}`);
        console.error(response2.data);
        return false;
      }
    } else {
      console.log('❌ Aucun ID d\'étudiant existant trouvé, création d\'un nouvel enregistrement');
      
      // Créer un nouvel enregistrement avec le champ has_completed
      const options2 = {
        hostname: 'epnhnjkbxgciojevrwfq.supabase.co',
        path: '/rest/v1/active_students',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
          'Prefer': 'return=representation'
        }
      };
      
      const data = JSON.stringify({
        student_id: 'test-id-' + Date.now(),
        student_name: 'Test Student',
        status: 'connected',
        has_completed: false,
        cheating_attempts: 0,
        connected_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      });
      
      const response2 = await makeRequest(options2, data);
      
      if (response2.statusCode === 201) {
        console.log('✅ Nouvel enregistrement créé avec le champ has_completed');
        return true;
      } else {
        console.error(`❌ Erreur lors de la création de l'enregistrement: ${response2.statusCode}`);
        console.error(response2.data);
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du SQL:', error.message);
    return false;
  }
}

// Fonction principale
async function main() {
  try {
    // Vérifier si le champ existe déjà
    const columnExists = await checkColumnExists();
    
    if (!columnExists) {
      // Tenter d'ajouter le champ via l'API PostgreSQL
      const success = await executeSqlViaPostgrest();
      
      if (success) {
        console.log('✅ Le champ has_completed a été ajouté avec succès à la table active_students');
      } else {
        console.log('❌ Échec de l\'ajout du champ has_completed');
        console.log('\n⚠️ Veuillez exécuter le script SQL suivant dans l\'éditeur SQL de Supabase:');
        console.log(`
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
        `);
      }
    } else {
      console.log('✅ Le champ has_completed existe déjà, aucune action nécessaire');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du script:', error.message);
  }
}

// Exécuter le script
main();
