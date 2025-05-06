#!/bin/bash

# Script pour corriger les chemins d'accès dans le déploiement GitHub Pages
echo "🔧 Correction des chemins d'accès pour le déploiement GitHub Pages..."

# Créer les dossiers nécessaires
mkdir -p public/images

# Copier le logo SVG dans le dossier public/images
echo "📁 Création du logo SVG..."
cat > public/images/logo-esgis-white.svg << 'EOL'
<?xml version="1.0" encoding="UTF-8"?>
<svg width="200px" height="60px" viewBox="0 0 200 60" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <g fill="#FFFFFF">
    <path d="M20,10 L50,10 C55.5228,10 60,14.4772 60,20 L60,40 C60,45.5228 55.5228,50 50,50 L20,50 C14.4772,50 10,45.5228 10,40 L10,20 C10,14.4772 14.4772,10 20,10 Z M22,18 L22,42 L48,42 L48,18 L22,18 Z" />
    <path d="M70,15 L90,15 L90,20 L75,20 L75,25 L85,25 L85,30 L75,30 L75,35 L90,35 L90,40 L70,40 L70,15 Z" />
    <path d="M95,15 L105,15 C110.5228,15 115,19.4772 115,25 C115,30.5228 110.5228,35 105,35 L100,35 L100,45 L95,45 L95,15 Z M100,20 L100,30 L105,30 C107.7614,30 110,27.7614 110,25 C110,22.2386 107.7614,20 105,20 L100,20 Z" />
    <path d="M120,15 L140,15 L140,20 L125,20 L125,25 L135,25 L135,30 L125,30 L125,35 L140,35 L140,40 L120,40 L120,15 Z" />
    <path d="M145,15 L150,15 L150,40 L145,40 L145,15 Z" />
    <path d="M155,15 L175,15 L175,20 L160,20 L160,25 L170,25 L170,30 L160,30 L160,35 L175,35 L175,40 L155,40 L155,15 Z" />
  </g>
</svg>
EOL

# Créer un favicon SVG
echo "📁 Création du favicon SVG..."
cat > public/favicon.svg << 'EOL'
<?xml version="1.0" encoding="UTF-8"?>
<svg width="32px" height="32px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <g fill="#3f51b5">
    <path d="M6,4 L26,4 C27.1046,4 28,4.89543 28,6 L28,26 C28,27.1046 27.1046,28 26,28 L6,28 C4.89543,28 4,27.1046 4,26 L4,6 C4,4.89543 4.89543,4 6,4 Z M8,8 L8,24 L24,24 L24,8 L8,8 Z" />
    <path d="M12,12 L20,12 L20,14 L14,14 L14,16 L18,16 L18,18 L14,18 L14,20 L20,20 L20,22 L12,22 L12,12 Z" />
  </g>
</svg>
EOL

# Créer un fichier favicon.ico vide (sera remplacé par le SVG)
touch public/favicon.ico

# Reconstruire l'application
echo "🏗️ Reconstruction de l'application..."
npm run build

# Mettre à jour la branche gh-pages
echo "🚀 Mise à jour de la branche gh-pages..."
git checkout gh-pages || git checkout -b gh-pages

# Copier les fichiers de build
cp -r dist/* .

# Corriger les chemins d'accès dans index.html
echo "🔄 Correction des chemins d'accès dans index.html..."
sed -i '' 's|/intranet-esgis/|/esgis_intranet_platform/|g' index.html

# Corriger les chemins d'accès dans 404.html
echo "🔄 Correction des chemins d'accès dans 404.html..."
sed -i '' 's|/intranet-esgis|/esgis_intranet_platform|g' 404.html

# Ajouter les fichiers modifiés
git add .

# Commiter les changements
git commit -m "✨ [FIX] Correction des chemins d'accès pour GitHub Pages"

# Pousser les changements
git push origin gh-pages

echo "✅ Terminé ! L'application devrait être accessible à l'adresse https://flori92.github.io/esgis_intranet_platform/"
