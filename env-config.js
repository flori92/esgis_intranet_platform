// Configuration d'environnement de secours
// Ce fichier est chargé dans index.html et fournit une solution de fallback
// si les variables d'environnement ne sont pas correctement chargées

window.ENV = {
  // Configuration Supabase
  SUPABASE_URL: 'https://epnhnjkbxgciojevrwfq.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmhuamtieGdjaW9qZXZyd2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMDY5MDYsImV4cCI6MjA2MTc4MjkwNn0.VeqmGA56qySH_f4rwk6bnsvPS6173BtoRA0iCjXnogM',
  SUPABASE_SERVICE_ROLE: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmhuamtieGdjaW9qZXZyd2ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjIwNjkwNiwiZXhwIjoyMDYxNzgyOTA2fQ.kbEs9bN0vpsf9cE8TZuj0-sBz6LCQ3o3LU0sptEx-mY',
  
  // Configuration de l'application
  APP_NAME: 'Intranet ESGIS',
  
  // Connexion PostgreSQL directe (pour les outils d'administration)
  PG_CONNECTION: {
    host: 'db.epnhnjkbxgciojevrwfq.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'Apollonf@vi92',
    database: 'postgres',
    ssl: true
  }
};

// Fonction de vérification de connexion
window.checkSupabaseConnection = async function() {
  try {
    const { createClient } = window.supabase;
    const supabase = createClient(
      window.ENV.SUPABASE_URL,
      window.ENV.SUPABASE_ANON_KEY
    );
    
    const { error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      console.error('Erreur de connexion Supabase:', error);
      return false;
    }
    
    console.log('Connexion Supabase établie avec succès');
    return true;
  } catch (err) {
    console.error('Exception lors de la vérification de la connexion:', err);
    return false;
  }
};
