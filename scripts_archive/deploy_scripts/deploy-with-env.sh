#!/bin/bash

# Script de déploiement optimisé pour GitHub Pages avec injection des variables d'environnement
# Usage: ./deploy-with-env.sh [GITHUB_TOKEN]

# Définition des couleurs pour un meilleur affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration du projet
REPO_NAME="esgis_intranet_platform"
BASE_URL="/$REPO_NAME/"

# Récupération des variables d'environnement (priorité aux variables d'environnement)
SUPABASE_URL=${VITE_SUPABASE_URL:-$SUPABASE_URL}
SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY:-$SUPABASE_ANON_KEY}

# Vérification des variables nécessaires
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}Erreur: Les variables d'environnement SUPABASE_URL et SUPABASE_ANON_KEY sont requises.${NC}"
  echo "Vous pouvez les définir comme variables d'environnement ou les passer en arguments."
  exit 1
fi

echo -e "${GREEN}=== Démarrage du déploiement vers GitHub Pages ===${NC}"

# 1. Nettoyage des anciens builds
echo -e "${YELLOW}Nettoyage des anciens fichiers...${NC}"
rm -rf dist

# 2. Build du projet avec la base URL correcte
echo -e "${YELLOW}Build du projet avec base URL: $BASE_URL${NC}"
npm run build -- --base=$BASE_URL

if [ ! -d "dist" ]; then
  echo -e "${RED}Erreur: Le build a échoué, le dossier dist n'existe pas.${NC}"
  exit 1
fi

# 3. Création du fichier .nojekyll (pour désactiver le traitement Jekyll par défaut)
echo -e "${YELLOW}Création du fichier .nojekyll...${NC}"
touch dist/.nojekyll

# 4. Création du fichier env-config.js avec les variables d'environnement
echo -e "${YELLOW}Création du fichier de configuration des variables d'environnement...${NC}"
cat > dist/env-config.js << EOL
// Configuration des variables d'environnement pour Supabase
// Généré automatiquement lors du déploiement le $(date)
window.ENV = {
  SUPABASE_URL: "${SUPABASE_URL}",
  SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY}"
};
EOL

# 5. Création d'un fichier 404.html pour gérer le routage SPA
echo -e "${YELLOW}Création du fichier 404.html pour routage SPA...${NC}"
cat > dist/404.html << EOL
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirection vers l'application</title>
  <script>
    // Redirection vers la page index avec le chemin comme paramètre
    const path = window.location.pathname.substr('${BASE_URL}'.length);
    window.location.href = '${BASE_URL}#' + path;
  </script>
</head>
<body>
  <p>Redirection en cours...</p>
</body>
</html>
EOL

# 6. Vérification finale et informations
echo -e "${GREEN}✅ Build terminé avec succès !${NC}"
echo -e "Dossier dist créé avec $(find dist -type f | wc -l) fichiers"

# 7. Déploiement sur GitHub Pages
echo -e "${YELLOW}Déploiement vers la branche gh-pages...${NC}"
npx gh-pages -d dist -m "📦 Déploiement sur GitHub Pages $(date)"

echo -e "${GREEN}=== Déploiement terminé ! ===${NC}"
echo -e "Le site sera accessible à l'adresse: https://flori92.github.io/$REPO_NAME/"
echo -e "Noter que la propagation peut prendre quelques minutes."
