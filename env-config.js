/**
 * Configuration d'environnement
 * Ce fichier est un legacy fallback. 
 * Les variables d'environnement sont maintenant gérées via .env et import.meta.env
 */
window.ENV = {
  APP_NAME: 'Intranet ESGIS',
  // Les clés Supabase sont chargées via .env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
  // NE JAMAIS mettre de clés ici - ce fichier est public
};
