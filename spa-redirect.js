// Script de redirection pour les applications SPA sur GitHub Pages
(function() {
  // Fonction exécutée au chargement de la page
  window.addEventListener('DOMContentLoaded', function() {
    // Uniquement sur GitHub Pages
    if (window.location.hostname.includes('github.io')) {
      // Base URL pour GitHub Pages
      const baseUrl = '/esgis_intranet_platform/';
      
      // Récupérer les informations de l'URL actuelle
      const { pathname, search, hash, origin } = window.location;
      
      // Si l'URL ne commence pas par la base URL, rediriger
      if (!pathname.startsWith(baseUrl)) {
        window.location.replace(origin + baseUrl);
        return;
      }
      
      // Si l'URL contient un paramètre de requête commençant par '/''
      // qui indique une redirection depuis 404.html
      if (search && search.startsWith('?/')) {
        // Extraire le chemin de navigation
        const redirectPath = search.substring(1);
        const newUrl = baseUrl + redirectPath + (hash || '');
        
        // Mettre à jour l'URL dans l'historique sans recharger la page
        window.history.replaceState(null, document.title, newUrl);
      }
    }
  });
})();
