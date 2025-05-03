#!/bin/bash

# Script de configuration de Supabase pour l'application ESGIS Exam Platform
# Ce script configure la base de données et les paramètres CORS

echo "🔧 Configuration de Supabase pour l'application ESGIS Exam Platform"
echo "----------------------------------------------------------------"

# Variables de configuration
SUPABASE_URL="https://epnhnjkbxgciojevrwfq.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmhuamtieGdjaW9qZXZyd2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMDY5MDYsImV4cCI6MjA2MTc4MjkwNn0.VeqmGA56qySH_f4rwk6bnsvPS6173BtoRA0iCjXnogM"
GITHUB_PAGES_DOMAIN="flori92.github.io"
SQL_FILE="scripts/create_active_students_manual.sql"

# Vérification des outils nécessaires
if ! command -v curl &> /dev/null; then
    echo "❌ curl n'est pas installé. Veuillez l'installer pour continuer."
    exit 1
fi

# 1. Configuration des CORS pour autoriser GitHub Pages
echo "⚙️ Configuration des CORS pour autoriser $GITHUB_PAGES_DOMAIN..."

curl -X POST "$SUPABASE_URL/rest/v1/cors" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"origin\": \"https://$GITHUB_PAGES_DOMAIN\"}" \
  && echo "✅ CORS configuré avec succès pour $GITHUB_PAGES_DOMAIN" \
  || echo "❌ Échec de la configuration CORS"

# 2. Exécution du script SQL via l'API REST
echo "⚙️ Création de la table active_students..."

# Lecture du contenu du fichier SQL
SQL_CONTENT=$(cat "$SQL_FILE")

# Exécution du script SQL via l'API PostgreSQL de Supabase
# Note: Cette méthode nécessite que le service PostgreSQL soit accessible
echo "Pour créer la table active_students, veuillez :"
echo "1. Connectez-vous à l'interface Supabase : https://supabase.com/dashboard/project/epnhnjkbxgciojevrwfq"
echo "2. Allez dans la section 'SQL Editor'"
echo "3. Copiez et collez le contenu du fichier $SQL_FILE"
echo "4. Exécutez le script"

echo "----------------------------------------------------------------"
echo "🔍 Vérification de la connexion à Supabase..."

# Test de connexion à Supabase
curl -s "$SUPABASE_URL/rest/v1/active_students?limit=1" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -w "\nCode de statut HTTP: %{http_code}\n"

echo "----------------------------------------------------------------"
echo "🌐 Configuration CORS pour GitHub Pages"
echo "Assurez-vous que les domaines suivants sont autorisés dans les paramètres CORS de Supabase :"
echo "- https://$GITHUB_PAGES_DOMAIN"
echo "- https://flori92.github.io/exam_esgis_platform"

echo "----------------------------------------------------------------"
echo "📋 Instructions pour le déploiement :"
echo "1. Exécutez le script SQL dans l'interface Supabase"
echo "2. Vérifiez que la table active_students a été créée"
echo "3. Assurez-vous que la configuration CORS est correcte"
echo "4. Redéployez l'application sur GitHub Pages"

echo "✅ Configuration terminée"
