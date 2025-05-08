#!/bin/bash

# Script de déploiement optimisé pour GitHub Pages
# Ce script utilise une approche directe pour garantir un déploiement correct

set -e  # Arrêter en cas d'erreur

echo "🚀 Préparation du déploiement optimisé pour GitHub Pages..."

# Nettoyage du dossier de build précédent
rm -rf dist

# Ajout de variables d'environnement explicites pour garantir les bons chemins
export VITE_PUBLIC_URL="/intranet-esgis"

# Construction avec les variables d'environnement définies
echo "🏗️ Construction du projet avec l'optimisation des chemins..."
npm run build

# Vérification du contenu du fichier index.html généré
echo "🔍 Vérification du fichier index.html..."
if grep -q '<base href="/intranet-esgis/">' dist/index.html; then
    echo "✅ Tag base correctement configuré"
else
    echo "⚠️ Ajout manuel du tag base..."
    sed -i '' 's|<head>|<head>\n  <base href="/intranet-esgis/">|' dist/index.html
fi

# Création explicite du fichier .nojekyll pour éviter le traitement Jekyll
echo "📝 Création du fichier .nojekyll..."
touch dist/.nojekyll

# Copie du fichier 404.html pour la gestion des routes SPA
cp public/404.html dist/

# Ajout d'un fichier de redirection pour Netlify (au cas où)
cp public/_redirects dist/

echo "📝 Création d'un script de redirection pour les routes SPA..."
cat > dist/spa-redirect.js << 'EOL'
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
EOL

# Modification manuelle de l'index.html pour ajouter le script de redirection
echo "🔄 Ajout du script de redirection à index.html..."
SCRIPT_TAG='<script src="./spa-redirect.js"></script>'
INDEX_FILE="dist/index.html"

# Approche compatible avec macOS et Linux
awk -v script="$SCRIPT_TAG" '/<\/head>/ { print script; } { print; }' "$INDEX_FILE" > "$INDEX_FILE.tmp"
mv "$INDEX_FILE.tmp" "$INDEX_FILE"

# Déploiement via gh-pages
echo "🌐 Déploiement sur GitHub Pages..."
npx gh-pages -d dist -m "✨ [DEPLOY] Déploiement optimisé avec correction des chemins d'assets"

echo "✅ Déploiement terminé avec succès !"
echo "🔗 Le site sera accessible sous peu à l'adresse: https://flori92.github.io/intranet-esgis/"
echo "⏱️ Notez qu'il peut y avoir un délai de quelques minutes avant que les changements soient visibles."
