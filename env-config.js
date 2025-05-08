// Configuration d'environnement sécurisée pour GitHub Pages
// Ce fichier est chargé dans index.html et configure l'application

window.ENV = {
  // Configuration Supabase - URL uniquement
  // La clé anon est déjà dans le bundle de l'application
  SUPABASE_URL: 'https://epnhnjkbxgciojevrwfq.supabase.co',
  
  // Configuration de l'application
  APP_NAME: 'Intranet ESGIS',
  
  // Configuration GitHub Pages
  IS_GITHUB_PAGES: true,
  BASE_URL: '/esgis_intranet_platform/',
  
  // Configuration pour résoudre les problèmes de routage SPA
  ENABLE_SPA_ROUTING: true,
  
  // Configuré pour accepter les requêtes depuis GitHub Pages
  ALLOWED_ORIGINS: ['https://flori92.github.io']
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
