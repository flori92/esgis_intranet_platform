// Initialisation de Supabase avec variables d'environnement
import { createClient } from '@supabase/supabase-js';

// Configuration - utilise les variables d'environnement Vite
// On utilise .replace(/\s/g, '') pour supprimer TOUS les espaces, tabulations et retours à la ligne
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\s/g, '');
const SUPABASE_ANON_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)?.replace(/\s/g, '');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'Variables d\'environnement Supabase manquantes. ' +
    'Vérifiez que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définies dans .env'
  );
}

// Options de configuration avancées
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
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

/**
 * Fonction pour vérifier la connexion à Supabase
 * @returns {Promise<boolean>} true si la connexion est établie
 */
export const checkSupabaseConnection = async () => {
  try {
    // Requête simple pour tester la connexion
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
      
    if (error) {
      // Si la table n'existe pas encore, la connexion est quand même OK
      if (error.code === '42P01') {
        console.log('Connexion Supabase OK (tables non encore créées)');
        return true;
      }
      console.error('Erreur de connexion Supabase:', error.message);
      return false;
    }
    
    console.log('Connexion à Supabase établie avec succès');
    return true;
  } catch (err) {
    console.error('Exception lors de la vérification Supabase:', err);
    return false;
  }
};

export default supabase;
