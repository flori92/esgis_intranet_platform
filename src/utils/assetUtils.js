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

/**
 * Composant pour afficher une image avec le chemin d'accès correct
 * @param {Object} props - Propriétés du composant
 * @param {string} props.src - Chemin relatif de l'image
 * @param {string} props.alt - Texte alternatif de l'image
 * @param {Object} props.style - Style CSS de l'image
 * @returns {JSX.Element} Élément image avec le chemin d'accès correct
 */
export const Image = ({ src, alt, ...props }) => {
  return <img src={getAssetPath(src)} alt={alt} {...props} />;
};

/**
 * Composant pour afficher le logo ESGIS
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element} Élément image du logo ESGIS
 */
export const ESGISLogo = (props) => {
  return <img src={getAssetPath('images/logo-esgis-white.svg')} alt="Logo ESGIS" {...props} />;
};
