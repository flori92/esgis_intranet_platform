#!/bin/bash

# Script de déploiement via CLI Vercel
# Créé pour la plateforme d'examen ESGIS

echo "🚀 Déploiement de la plateforme d'examen ESGIS sur Vercel via CLI"
echo "----------------------------------------------------------------"

# Configuration
VERCEL_TOKEN="tAipySZbYC8gA70WBVUgDtLV"
PROJECT_NAME="exam-esgis-platform"

# Vérification de l'installation de npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez l'installer pour continuer."
    exit 1
fi

echo "📦 Installation de Vercel CLI..."
npm install -g vercel

# Création du répertoire de configuration Vercel
echo "🔧 Création du répertoire de configuration Vercel..."
mkdir -p ~/.vercel

# Configuration du token Vercel
echo "🔑 Configuration du token Vercel..."
echo "{\"token\":\"$VERCEL_TOKEN\"}" > ~/.vercel/credentials.json

echo "🚀 Déploiement du projet..."
vercel --prod --yes --token "$VERCEL_TOKEN"

echo "----------------------------------------------------------------"
echo "✅ Déploiement terminé!"
echo "📝 Note: Pour voir tous les détails, consultez votre tableau de bord Vercel."
echo "🔗 https://vercel.com/dashboard"
