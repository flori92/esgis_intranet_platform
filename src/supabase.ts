// Initialisation de Supabase avec gestion des erreurs et retries
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://epnhnjkbxgciojevrwfq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmhuamtieGdjaW9qZXZyd2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMDY5MDYsImV4cCI6MjA2MTc4MjkwNn0.VeqmGA56qySH_f4rwk6bnsvPS6173BtoRA0iCjXnogM';

// Options de configuration avancées
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js/2.39.7',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    timeout: 30000, // 30 secondes
  }
};

// Création du client Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, supabaseOptions);

// Fonction pour vérifier la connexion à Supabase
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('active_students')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Erreur lors de la vérification de la connexion Supabase:', error);
      return false;
    }
    
    console.log('Connexion à Supabase établie avec succès');
    return true;
  } catch (err) {
    console.error('Exception lors de la vérification de la connexion Supabase:', err);
    return false;
  }
};

// Export par défaut
export default supabase;
