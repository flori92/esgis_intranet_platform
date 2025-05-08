/**
 * Utilitaires pour gérer les chemins de base de l'application
 * Particulièrement utile pour les déploiements sur GitHub Pages
 */

/**
 * Obtient le chemin de base pour l'application
 * Pour GitHub Pages, cela sera le nom du repository
 * @returns {string} Le chemin de base de l'application
 */
export const getBasePath = () => {
  // En production sur GitHub Pages, le chemin de base est le nom du repository
  const isGitHubPages = window.location.hostname.includes('github.io');
  if (isGitHubPages) {
    const pathSegments = window.location.pathname.split('/');
    // Le premier segment après la racine est le nom du repository
    if (pathSegments.length > 1) {
      return `/${pathSegments[1]}`;
    }
  }
  // En développement local ou en dehors de GitHub Pages, utiliser la racine
  return '';
};

/**
 * Préfixe un chemin avec le chemin de base de l'application
 * @param {string} path - Le chemin à préfixer
 * @returns {string} Le chemin préfixé
 */
export const getAssetPath = (path) => {
  const basePath = getBasePath();
  
  // Si le chemin commence déjà par le chemin de base, le renvoyer tel quel
  if (path.startsWith(basePath)) {
    return path;
  }
  
  // Si le chemin commence par /, supprimer ce caractère pour éviter les doubles slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  return `${basePath}/${cleanPath}`;
};
