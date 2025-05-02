#!/bin/bash

# Script de configuration de Supabase pour la plateforme d'examen ESGIS
# Créé le 2 mai 2025

echo "🔧 Configuration de Supabase pour la plateforme d'examen ESGIS"
echo "------------------------------------------------------------"

# Configuration
SUPABASE_URL="https://epnhnjkbxgciojevrwfq.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmhuamtieGdjaW9qZXZyd2ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjIwNjkwNiwiZXhwIjoyMDYxNzgyOTA2fQ.kbEs9bN0vpsf9cE8TZuj0-sBz6LCQ3o3LU0sptEx-mY"
SQL_FILE="create_supabase_tables.sql"

# Vérification de l'installation de curl
if ! command -v curl &> /dev/null; then
    echo "❌ curl n'est pas installé. Veuillez l'installer pour continuer."
    exit 1
fi

# Vérification du fichier SQL
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Fichier SQL '$SQL_FILE' non trouvé dans le répertoire courant."
    exit 1
fi

echo "📋 Création de la table quiz_results..."
SQL_CONTENT=$(cat "$SQL_FILE")

# Exécution du script SQL via l'API REST de Supabase
RESPONSE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$SQL_CONTENT\"}")

# Vérification de la réponse
if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ Erreur lors de l'exécution du script SQL:"
    echo "$RESPONSE"
    exit 1
else
    echo "✅ Table quiz_results créée avec succès!"
fi

echo "🔄 Configuration des règles CORS..."
# Configuration des règles CORS pour permettre l'accès depuis n'importe quelle origine
CORS_RESPONSE=$(curl -s -X PUT "$SUPABASE_URL/rest/v1/" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"config\": {\"cors\": {\"allowed_origins\": [\"*\"]}}}")

if echo "$CORS_RESPONSE" | grep -q "error"; then
    echo "⚠️ Avertissement: Impossible de configurer les règles CORS via l'API."
    echo "   Veuillez les configurer manuellement dans l'interface Supabase:"
    echo "   1. Allez à https://epnhnjkbxgciojevrwfq.supabase.co/project/settings/api"
    echo "   2. Dans la section 'API Settings', configurez 'Allow-Origin' sur '*'"
else
    echo "✅ Règles CORS configurées avec succès!"
fi

echo "🔔 Activation des notifications temps réel..."
# Activation des notifications temps réel pour la table quiz_results
REALTIME_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/enable_realtime" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"table\": \"quiz_results\"}")

if echo "$REALTIME_RESPONSE" | grep -q "error"; then
    echo "⚠️ Avertissement: Impossible d'activer les notifications temps réel via l'API."
    echo "   Veuillez les activer manuellement dans l'interface Supabase:"
    echo "   1. Allez à https://epnhnjkbxgciojevrwfq.supabase.co/project/database/replication"
    echo "   2. Activez la réplication pour la table 'quiz_results'"
else
    echo "✅ Notifications temps réel activées avec succès!"
fi

echo "------------------------------------------------------------"
echo "✅ Configuration Supabase terminée!"
echo "🌐 URL Supabase: $SUPABASE_URL"
echo "📝 Note: Vérifiez que tout fonctionne en testant l'application."
echo "------------------------------------------------------------"
