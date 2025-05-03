// Gestion des routes pour une SPA sur GitHub Pages
(function() {
  // Ne pas rediriger sur la page d'accueil
  if (window.location.pathname === '/intranet-esgis/' || 
      window.location.pathname === '/intranet-esgis/index.html') {
    return;
  }
  
  // Récupérer le segment de la route après la base
  var path = window.location.pathname.replace('/intranet-esgis/', '/');
  var search = window.location.search;
  var hash = window.location.hash;
  
  // Stocker la route actuelle dans sessionStorage
  sessionStorage.setItem('redirectPath', path + search + hash);
  
  // Rediriger vers l'index
  window.location.replace('/intranet-esgis/');
})();
