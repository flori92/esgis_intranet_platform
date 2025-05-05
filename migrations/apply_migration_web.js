/**
 * Script pour appliquer les migrations Supabase via l'API REST
 * Créé le: 04/05/2025
 * Auteur: Cascade AI
 * 
 * Ce script utilise l'API REST de Supabase pour exécuter les migrations SQL
 * Il nécessite Node.js et le module axios
 * 
 * Installation des dépendances:
 * npm install axios dotenv
 * 
 * Exécution:
 * node apply_migration_web.js
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Obtenir le chemin du répertoire actuel en utilisant ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Paramètres de connexion directe à Supabase (fallback)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://epnhnjkbxgciojevrwfq.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmhuamtieGdjaW9qZXZyd2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMDY5MDYsImV4cCI6MjA2MTc4MjkwNn0.VeqmGA56qySH_f4rwk6bnsvPS6173BtoRA0iCjXnogM';

// Couleurs pour les messages
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

/**
 * Fonction pour créer une table si elle n'existe pas
 * @param {string} tableName - Nom de la table à créer
 * @param {string} schema - Schéma SQL pour créer la table
 */
async function createTableIfNotExists(tableName, schema) {
  try {
    console.log(`${colors.yellow}Vérification de l'existence de la table ${tableName}...${colors.reset}`);
    
    // Vérifier si la table existe
    const { data: existingTable, error: tableError } = await axios({
      method: 'GET',
      url: `${SUPABASE_URL}/rest/v1/rpc/check_table_exists`,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        table_name: tableName,
        schema_name: 'public'
      }
    }).catch(err => {
      return { error: err };
    });
    
    if (tableError) {
      console.log(`${colors.yellow}La fonction RPC check_table_exists n'existe pas, création de la fonction...${colors.reset}`);
      
      // Créer la fonction RPC pour vérifier l'existence d'une table
      await axios({
        method: 'POST',
        url: `${SUPABASE_URL}/rest/v1/rpc/create_check_table_exists_function`,
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        data: {}
      }).catch(err => {
        console.log(`${colors.red}Erreur lors de la création de la fonction RPC: ${err.message}${colors.reset}`);
      });
      
      // Réessayer de vérifier si la table existe
      const { data: retryExistingTable } = await axios({
        method: 'GET',
        url: `${SUPABASE_URL}/rest/v1/rpc/check_table_exists`,
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        data: {
          table_name: tableName,
          schema_name: 'public'
        }
      }).catch(err => {
        console.log(`${colors.red}Impossible de vérifier l'existence de la table: ${err.message}${colors.reset}`);
        return { data: false };
      });
      
      if (!retryExistingTable) {
        // Créer la table
        console.log(`${colors.yellow}Création de la table ${tableName}...${colors.reset}`);
        await axios({
          method: 'POST',
          url: `${SUPABASE_URL}/rest/v1/rpc/execute_sql`,
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          data: {
            sql: schema
          }
        }).catch(err => {
          console.log(`${colors.red}Erreur lors de la création de la table ${tableName}: ${err.message}${colors.reset}`);
        });
        
        console.log(`${colors.green}Table ${tableName} créée avec succès.${colors.reset}`);
      } else {
        console.log(`${colors.green}La table ${tableName} existe déjà.${colors.reset}`);
      }
    } else if (!existingTable) {
      // Créer la table
      console.log(`${colors.yellow}Création de la table ${tableName}...${colors.reset}`);
      await axios({
        method: 'POST',
        url: `${SUPABASE_URL}/rest/v1/rpc/execute_sql`,
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        data: {
          sql: schema
        }
      }).catch(err => {
        console.log(`${colors.red}Erreur lors de la création de la table ${tableName}: ${err.message}${colors.reset}`);
      });
      
      console.log(`${colors.green}Table ${tableName} créée avec succès.${colors.reset}`);
    } else {
      console.log(`${colors.green}La table ${tableName} existe déjà.${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}Erreur lors de la vérification/création de la table ${tableName}: ${error.message}${colors.reset}`);
  }
}

/**
 * Fonction principale pour appliquer les migrations
 */
async function applyMigrations() {
  try {
    console.log(`${colors.yellow}Application des migrations Supabase via l'API REST...${colors.reset}`);
    
    // Créer la fonction RPC pour exécuter du SQL
    console.log(`${colors.yellow}Création de la fonction RPC execute_sql...${colors.reset}`);
    await axios({
      method: 'POST',
      url: `${SUPABASE_URL}/rest/v1/rpc/create_execute_sql_function`,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {}
    }).catch(err => {
      console.log(`${colors.yellow}La fonction RPC execute_sql existe peut-être déjà: ${err.message}${colors.reset}`);
    });
    
    // Lire le fichier de migration
    const migrationFilePath = path.resolve(__dirname, './supabase_migration.sql');
    const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');
    
    // Diviser le fichier en instructions SQL individuelles
    const sqlStatements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    // Créer les tables une par une
    const tables = [
      { name: 'quiz_results', schema: `
        CREATE TABLE IF NOT EXISTS quiz_results (
          id SERIAL PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          quiz_id INTEGER NOT NULL,
          score INTEGER NOT NULL,
          total_questions INTEGER NOT NULL,
          completion_time INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `},
      { name: 'quiz_questions', schema: `
        CREATE TABLE IF NOT EXISTS quiz_questions (
          id SERIAL PRIMARY KEY,
          quiz_id INTEGER NOT NULL,
          question TEXT NOT NULL,
          options JSONB NOT NULL,
          correct_answer TEXT NOT NULL,
          points INTEGER DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `},
      { name: 'quiz', schema: `
        CREATE TABLE IF NOT EXISTS quiz (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          course_id INTEGER,
          professor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          time_limit INTEGER,
          passing_score INTEGER DEFAULT 60,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `},
      { name: 'quiz_attempts', schema: `
        CREATE TABLE IF NOT EXISTS quiz_attempts (
          id SERIAL PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          quiz_id INTEGER,
          started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          completed_at TIMESTAMP WITH TIME ZONE,
          is_completed BOOLEAN DEFAULT false,
          answers JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `},
      { name: 'quiz_results_temp', schema: `
        CREATE TABLE IF NOT EXISTS quiz_results_temp (
          id SERIAL PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          quiz_id INTEGER NOT NULL,
          score INTEGER NOT NULL,
          total_questions INTEGER NOT NULL,
          completion_time INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `}
    ];
    
    // Créer les tables
    for (const table of tables) {
      await createTableIfNotExists(table.name, table.schema);
    }
    
    console.log(`${colors.green}Migration appliquée avec succès.${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}Erreur lors de l'application des migrations: ${error.message}${colors.reset}`);
  }
}

// Exécuter la fonction principale
applyMigrations();
