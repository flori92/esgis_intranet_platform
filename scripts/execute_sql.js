// Script pour créer la table active_students via l'API REST de Supabase
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

// Vérifier si la table active_students existe déjà
async function checkTableExists() {
  console.log('Vérification de l\'existence de la table active_students...');
  
  const options = {
    hostname: 'epnhnjkbxgciojevrwfq.supabase.co',
    path: '/rest/v1/active_students?select=count&limit=1',
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
      console.log('✅ La table active_students existe déjà.');
      return true;
    } else if (response.statusCode === 404) {
      console.log('❌ La table active_students n\'existe pas encore.');
      return false;
    } else {
      console.error(`❌ Erreur lors de la vérification de la table: ${response.statusCode}`);
      console.error(response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de la table:', error.message);
    return false;
  }
}

// Créer la table active_students
async function createTable() {
  console.log('Création de la table active_students...');
  
  // Définition de la table
  const tableDefinition = {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: 'uuid_generate_v4()'
    },
    student_id: {
      type: 'text',
      notNull: true
    },
    student_name: {
      type: 'text',
      notNull: true
    },
    status: {
      type: 'text',
      notNull: true,
      default: "'connected'"
    },
    cheating_attempts: {
      type: 'integer',
      notNull: true,
      default: 0
    },
    connected_at: {
      type: 'timestamptz',
      notNull: true,
      default: 'now()'
    },
    last_activity: {
      type: 'timestamptz',
      notNull: true,
      default: 'now()'
    }
  };
  
  // Création de la table via l'API REST de Supabase
  const options = {
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
  
  // Insérer un enregistrement test pour créer la table
  const testData = JSON.stringify({
    student_id: 'test-student-id',
    student_name: 'Test Student',
    status: 'connected',
    cheating_attempts: 0,
    connected_at: new Date().toISOString(),
    last_activity: new Date().toISOString()
  });
  
  try {
    const response = await makeRequest(options, testData);
    
    if (response.statusCode === 201) {
      console.log('✅ Table active_students créée avec succès!');
      return true;
    } else {
      console.error(`❌ Erreur lors de la création de la table: ${response.statusCode}`);
      console.error(response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table:', error.message);
    return false;
  }
}

// Fonction principale
async function main() {
  try {
    const tableExists = await checkTableExists();
    
    if (!tableExists) {
      const created = await createTable();
      
      if (created) {
        console.log('✅ La table active_students a été créée avec succès.');
      } else {
        console.error('❌ Échec de la création de la table active_students.');
      }
    } else {
      console.log('✅ La table active_students existe déjà, aucune action nécessaire.');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du script:', error.message);
  }
}

// Exécuter le script
main();
