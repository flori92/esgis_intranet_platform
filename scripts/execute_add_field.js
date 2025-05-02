// Script pour ajouter le champ has_completed à la table active_students
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire actuel en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration Supabase
const SUPABASE_URL = 'https://epnhnjkbxgciojevrwfq.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmhuamtieGdjaW9qZXZyd2ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjIwNjkwNiwiZXhwIjoyMDYxNzgyOTA2fQ.kbEs9bN0vpsf9cE8TZuj0-sBz6LCQ3o3LU0sptEx-mY';

// Lire le fichier SQL
const sqlFilePath = path.join(__dirname, 'add_has_completed_field.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Fonction pour effectuer une requête à l'API Supabase
async function executeQuery(sql) {
  return new Promise((resolve, reject) => {
    // Créer une requête HTTP POST
    const options = {
      hostname: 'epnhnjkbxgciojevrwfq.supabase.co',
      path: '/rest/v1/active_students',
      method: 'GET', // Utiliser GET pour vérifier l'existence de la table
      headers: {
        'Content-Type': 'application/json',
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
          console.log('✅ Table active_students accessible');
          
          // Maintenant, exécuter les modifications manuellement
          console.log('Exécution des modifications SQL...');
          console.log('SQL à exécuter:');
          console.log(sql);
          
          console.log('\n⚠️ Pour exécuter ces modifications, veuillez copier le SQL ci-dessus');
          console.log('et le coller dans l\'éditeur SQL de Supabase (https://app.supabase.io)');
          console.log('puis cliquer sur le bouton "Run".');
          
          resolve(true);
        } else {
          console.error(`❌ Erreur lors de l'accès à la table: ${res.statusCode}`);
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
}

// Fonction principale
async function main() {
  try {
    console.log('Vérification de l\'accès à la table active_students...');
    await executeQuery(sqlContent);
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du script:', error.message);
  }
}

// Exécuter le script
main();
