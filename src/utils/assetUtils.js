/**
 * Utilitaire pour gérer les chemins d'accès aux ressources statiques
 * Résout les problèmes de chemin d'accès sur GitHub Pages
 */

/**
 * Retourne le chemin d'accès correct pour une ressource statique
 * @param {string} path - Chemin relatif de la ressource (ex: 'images/logo.svg')
 * @returns {string} Chemin d'accès complet pour la ressource
 */
export const getAssetPath = (path) => {
  // Détecte si l'application est exécutée sur GitHub Pages
  const isGitHubPages = window.location.hostname.includes('github.io');
  
  // Obtient le chemin de base de l'application
  const basePath = isGitHubPages ? '/esgis_intranet_platform' : '';
  
  // Construit le chemin d'accès complet
  return `${basePath}/${path}`;
};

// Exportation d'un chemin spécifique pour le logo ESGIS
export const LOGO_ESGIS_PATH = () => getAssetPath('images/logo-esgis-white.svg');

