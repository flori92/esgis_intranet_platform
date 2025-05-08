/**
 * Utilitaire pour gérer les chemins d'accès aux ressources statiques
 * Résout les problèmes de chemin d'accès sur GitHub Pages
 */

import { getBasePath } from './basePathUtils';

/**
 * Retourne le chemin d'accès correct pour une ressource statique
 * @param {string} path - Chemin relatif de la ressource (ex: 'images/logo.svg')
 * @returns {string} Chemin d'accès complet pour la ressource
 */
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
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  return `${basePath}/${cleanPath}`;
};

// Exportation d'un chemin spécifique pour le logo ESGIS
export const LOGO_ESGIS_PATH = () => getAssetPath('images/logo-esgis-white.svg');
