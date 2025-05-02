#!/bin/bash

# Script pour exécuter les commandes SQL dans Supabase
# Auteur: Flori Ace
# Date: 2 mai 2025

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Informations de connexion Supabase
SUPABASE_URL="https://epnhnjkbxgciojevrwfq.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmhuamtieGdjaW9qZXZyd2ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjIwNjkwNiwiZXhwIjoyMDYxNzgyOTA2fQ.kbEs9bN0vpsf9cE8TZuj0-sBz6LCQ3o3LU0sptEx-mY"
SUPABASE_DB_PASSWORD="Apollonf@vi92"

echo -e "${BLUE}=== Exécution des scripts SQL dans Supabase ===${NC}"

# Vérifier si le fichier SQL existe
SQL_FILE="./scripts/create_supabase_tables.sql"
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}Erreur: Le fichier SQL n'existe pas à l'emplacement spécifié: $SQL_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}Fichier SQL trouvé: $SQL_FILE${NC}"

# Méthode 1: Utiliser curl pour exécuter le SQL via l'API REST
echo -e "${BLUE}Méthode 1: Exécution via l'API REST de Supabase...${NC}"
SQL_CONTENT=$(cat "$SQL_FILE")

curl -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$SQL_CONTENT\"}" \
  && echo -e "${GREEN}✓ SQL exécuté avec succès via l'API REST${NC}" \
  || echo -e "${RED}✗ Échec de l'exécution via l'API REST${NC}"

# Méthode 2: Utiliser psql si disponible
echo -e "${BLUE}Méthode 2: Tentative d'exécution via psql...${NC}"
if command -v psql &> /dev/null; then
    # Extraire le nom d'hôte de l'URL Supabase
    DB_HOST=$(echo $SUPABASE_URL | sed -e 's|^[^/]*//||' -e 's|/.*$||')
    
    # Connexion à la base de données Supabase
    PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
      -h "$DB_HOST" \
      -U "postgres" \
      -d "postgres" \
      -f "$SQL_FILE" \
      && echo -e "${GREEN}✓ SQL exécuté avec succès via psql${NC}" \
      || echo -e "${RED}✗ Échec de l'exécution via psql${NC}"
else
    echo -e "${RED}psql n'est pas installé. Seule la méthode API REST a été tentée.${NC}"
fi

echo -e "${BLUE}=== Vérification de la table quiz_results ===${NC}"

# Vérifier si la table a été créée
curl -X GET "$SUPABASE_URL/rest/v1/quiz_results?select=count()" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  && echo -e "${GREEN}✓ Table quiz_results accessible${NC}" \
  || echo -e "${RED}✗ Table quiz_results non accessible${NC}"

echo -e "${GREEN}Script terminé.${NC}"
