#!/bin/bash

# Script de déploiement temporaire pour contourner les problèmes de build
# Auteur: Cascade
# Date: 03/05/2025

set -e  # Arrêter l'exécution en cas d'erreur

echo "🚀 Démarrage du déploiement temporaire sur GitHub Pages..."

# Vérifier que le dossier temp-deploy existe
if [ ! -d "temp-deploy" ]; then
  echo "❌ Erreur: Le dossier temp-deploy n'existe pas!"
  exit 1
fi

# Vérifier que git est installé
if ! command -v git &> /dev/null; then
  echo "❌ Erreur: Git n'est pas installé!"
  exit 1
fi

# Vérifier que npm est installé
if ! command -v npm &> /dev/null; then
  echo "❌ Erreur: NPM n'est pas installé!"
  exit 1
fi

# Vérifier si gh-pages est installé
if ! npm list -g gh-pages &> /dev/null; then
  echo "📦 Installation de gh-pages globalement..."
  npm install -g gh-pages
fi

# Copier les fichiers temporaires dans le dossier dist (qui est normalement ignoré par git)
echo "📂 Préparation des fichiers pour le déploiement..."
rm -rf dist
mkdir -p dist
cp -r temp-deploy/* dist/

# Créer un fichier .nojekyll pour éviter le traitement Jekyll sur GitHub Pages
touch dist/.nojekyll

# Déployer sur GitHub Pages
echo "🌐 Déploiement sur GitHub Pages..."
npx gh-pages -d dist -m "✨ DEPLOY: Page temporaire en attendant la résolution des problèmes de build"

echo "✅ Déploiement terminé avec succès!"
echo "🔗 Le site devrait être accessible sous peu à l'adresse: https://[votre-username].github.io/intranet-esgis/"
echo "⚠️ Note: Cette page est temporaire en attendant la résolution complète des problèmes de build."
