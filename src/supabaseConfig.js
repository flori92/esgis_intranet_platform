/**
 * Configuration Supabase pour l'application
 * @typedef {Object} SupabaseConfig
 * @property {string} supabaseUrl - URL de l'instance Supabase
 * @property {string} supabaseKey - Clé anonyme pour l'authentification Supabase
 */

/**
 * Paramètres de configuration Supabase
 * Utilise les variables d'environnement si disponibles, sinon des valeurs par défaut
 * @type {SupabaseConfig}
 */
export const supabaseConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://epnhnjkbxgciojevrwfq.supabase.co',
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmhuamtieGdjaW9qZXZyd2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMDY5MDYsImV4cCI6MjA2MTc4MjkwNn0.VeqmGA56qySH_f4rwk6bnsvPS6173BtoRA0iCjXnogM'
};
