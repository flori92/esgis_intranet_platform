import { createClient } from '@supabase/supabase-js';
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

async function listTables() {
  try {
    // Requête SQL directe pour lister toutes les tables du schéma public
    const { data, error } = await supabase
      .from('_metadata')
      .select('*');
      
    if (error) {
      console.error('Erreur lors de la requête SQL directe:', error);
      
      // Tentative avec une requête SQL brute
      const { data: rawData, error: rawError } = await supabase
        .rpc('execute_sql', {
          query: `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
          `
        });
        
      if (rawError) {
        console.error('Échec de toutes les tentatives pour lister les tables:', rawError);
      } else {
        console.log('Tables (via requête brute):');
        console.log(rawData);
      }
    } else {
      console.log('Métadonnées:');
      console.log(data);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des tables:', error);
  }
}

// Exécuter la fonction
listTables();
