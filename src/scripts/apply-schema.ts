import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Les variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applySchema() {
  try {
    // Lire le fichier de schéma SQL
    const schemaPath = path.resolve(__dirname, '../../supabase/migrations/20250503_initial_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('Schéma SQL chargé avec succès');
    
    // Diviser le schéma en instructions individuelles
    // Nous séparons par ';' mais nous devons faire attention aux blocs PL/pgSQL qui contiennent des ';'
    const statements = schemaSQL.split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Nombre d'instructions SQL à exécuter : ${statements.length}`);
    
    // Exécuter chaque instruction séparément
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Exécution de l'instruction ${i + 1}/${statements.length}`);
      
      try {
        // Utiliser l'API REST de Supabase pour exécuter le SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            query: statement
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erreur lors de l'exécution de l'instruction ${i + 1}:`, errorText);
          console.error('Instruction problématique:', statement);
        } else {
          console.log(`Instruction ${i + 1} exécutée avec succès`);
        }
      } catch (error) {
        console.error(`Erreur lors de l'exécution de l'instruction ${i + 1}:`, error);
        console.error('Instruction problématique:', statement);
      }
    }
    
    console.log('Application du schéma SQL terminée');
  } catch (error) {
    console.error('Erreur lors de l\'application du schéma SQL:', error);
  }
}

// Exécuter la fonction
applySchema();
