// Script pour créer la table active_students directement via l'API Supabase
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration Supabase
const SUPABASE_URL = 'https://epnhnjkbxgciojevrwfq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmhuamtieGdjaW9qZXZyd2ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjIwNjkwNiwiZXhwIjoyMDYxNzgyOTA2fQ.kbEs9bN0vpsf9cE8TZuj0-sBz6LCQ3o3LU0sptEx-mY';

// Lire le contenu du fichier SQL
const sqlFilePath = path.join(__dirname, 'create_active_students_table.sql');
const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');

console.log('Création de la table active_students dans Supabase...');

// Préparer les données pour la requête
const data = JSON.stringify({
  query: sqlQuery
});

// Options de la requête
const options = {
  hostname: 'epnhnjkbxgciojevrwfq.supabase.co',
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Length': data.length
  }
};

// Effectuer la requête
const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Table active_students créée avec succès !');
    } else {
      console.error(`❌ Erreur lors de la création de la table: ${res.statusCode}`);
      console.error(responseData);
    }
    
    // Vérifier que la table a bien été créée
    checkTableExists();
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur lors de la requête:', error);
});

// Envoyer les données
req.write(data);
req.end();

// Fonction pour vérifier que la table existe
function checkTableExists() {
  const checkOptions = {
    hostname: 'epnhnjkbxgciojevrwfq.supabase.co',
    path: '/rest/v1/active_students?select=id&limit=1',
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  };
  
  const checkReq = https.request(checkOptions, (res) => {
    console.log(`Vérification de la table: Status ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      console.log('✅ La table active_students est accessible !');
    } else {
      console.error('❌ La table active_students n\'est pas accessible.');
    }
  });
  
  checkReq.on('error', (error) => {
    console.error('❌ Erreur lors de la vérification:', error);
  });
  
  checkReq.end();
}
