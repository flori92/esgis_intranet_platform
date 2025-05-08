#!/bin/bash

# Script optimisé pour déployer une application React/Vite sur GitHub Pages
# Résout les problèmes courants de chemins d'accès et de chargement des ressources

echo "🚀 Début du déploiement optimisé pour GitHub Pages (version corrigée)..."

# Variables de configuration
REPO_URL="https://github.com/flori92/esgis_intranet_platform.git"
PROJECT_NAME="intranet-esgis"
GH_PAGES_URL="https://flori92.github.io/intranet-esgis/"

# Nettoyage du dossier de build précédent
echo "🧹 Nettoyage des dossiers précédents..."
rm -rf dist gh-pages-build

# Création d'un dossier temporaire pour le build
mkdir -p gh-pages-build
cd gh-pages-build

# Clone du dépôt dans un dossier séparé pour ne travailler que sur la branche gh-pages
echo "📥 Clonage du dépôt pour la branche gh-pages..."
git clone --single-branch --branch gh-pages $REPO_URL .
cd ..

# Construction avec la configuration spécifique pour GitHub Pages
echo "🏗️ Construction du projet avec la configuration GitHub Pages..."
NODE_ENV=production npx vite build --config vite.github-pages.config.js

# Copie de la page de test HTML
echo "📄 Copie de la page de test..."
cp public/index-test.html dist/test.html

# Vérification et correction du fichier index.html
echo "🔍 Vérification et correction de index.html..."
if ! grep -q '<base href="/' dist/index.html; then
    echo "⚠️ Ajout de la balise base..."
    sed -i '' 's|<head>|<head>\n  <base href="/intranet-esgis/">|' dist/index.html
fi

# Création de fichiers essentiels pour GitHub Pages
echo "📝 Création des fichiers de configuration pour GitHub Pages..."
touch dist/.nojekyll
cat > dist/404.html << EOL
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirection vers l'application</title>
  <script>
    // Redirection vers la page index avec le chemin comme paramètre
    const path = window.location.pathname.substr('/intranet-esgis'.length);
    window.location.href = '/intranet-esgis/#' + path;
  </script>
</head>
<body>
  <p>Redirection en cours...</p>
</body>
</html>
EOL

# Ajout du script de redirection dans index.html pour supporter les routes SPA
echo "🔄 Ajout du script de redirection pour les routes SPA..."
if ! grep -q "window.ESGIS_INTRANET_BASE_PATH" dist/index.html; then
    sed -i '' '/<\/head>/i \
  <script>\
    // Configuration des chemins de base\
    window.ESGIS_INTRANET_BASE_PATH = "/intranet-esgis";\
    // Support pour les routes SPA sur GitHub Pages\
    (function() {\
      const redirect = sessionStorage.redirect;\
      delete sessionStorage.redirect;\
      if (redirect && redirect !== location.href) {\
        history.replaceState(null, null, redirect);\
      }\
    })();\
  </script>' dist/index.html
fi

# Déploiement sur GitHub Pages (branche gh-pages)
echo "🌐 Déploiement vers la branche gh-pages..."
cd gh-pages-build
rm -rf *
cp -R ../dist/* .

# Commit et push des modifications
git add .
git config user.name "GitHub Actions"
git config user.email "actions@github.com"
git commit -m "🚀 Déploiement optimisé pour GitHub Pages avec correction des chemins"
git push origin gh-pages

echo "✅ Déploiement terminé avec succès !"
echo "🔗 Le site sera accessible sous peu à l'adresse: $GH_PAGES_URL"
echo "⏱️ Notez qu'il peut y avoir un délai de quelques minutes avant que les changements soient visibles."
echo "🧪 Vous pouvez vérifier la page de test à l'adresse: ${GH_PAGES_URL}test.html"
