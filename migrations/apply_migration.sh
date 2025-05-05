#!/bin/bash
# Script pour appliquer les migrations Supabase
# Créé le: 04/05/2025
# Auteur: Cascade AI

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Paramètres de connexion directe à Supabase
SUPABASE_URL="https://epnhnjkbxgciojevrwfq.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmhuamtieGdjaW9qZXZyd2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMDY5MDYsImV4cCI6MjA2MTc4MjkwNn0.VeqmGA56qySH_f4rwk6bnsvPS6173BtoRA0iCjXnogM"
SUPABASE_DB_HOST="db.epnhnjkbxgciojevrwfq.supabase.co"
SUPABASE_DB_PORT="5432"
SUPABASE_DB_NAME="postgres"
SUPABASE_DB_USER="postgres"
SUPABASE_DB_PASSWORD="Apollonf@vi92"

echo -e "${YELLOW}Application de la migration avec connexion directe à Supabase...${NC}"

# Vérification de l'installation de psql
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL client (psql) n'est pas installé.${NC}"
    echo -e "${YELLOW}Installation de PostgreSQL client...${NC}"
    
    # Détection du système d'exploitation
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install postgresql
        else
            echo -e "${RED}Homebrew n'est pas installé. Veuillez installer Homebrew puis réessayer.${NC}"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt-get update
        sudo apt-get install -y postgresql-client
    else
        echo -e "${RED}Système d'exploitation non supporté. Veuillez installer PostgreSQL client manuellement.${NC}"
        exit 1
    fi
    
    # Vérification de l'installation
    if ! command -v psql &> /dev/null; then
        echo -e "${RED}L'installation de PostgreSQL client a échoué. Veuillez l'installer manuellement.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}PostgreSQL client a été installé avec succès.${NC}"
fi

# Exécution de la migration avec connexion directe
echo -e "${YELLOW}Connexion à la base de données Supabase et application du script de migration...${NC}"
PGPASSWORD=$SUPABASE_DB_PASSWORD psql -h $SUPABASE_DB_HOST -p $SUPABASE_DB_PORT -d $SUPABASE_DB_NAME -U $SUPABASE_DB_USER -f supabase_migration.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Migration appliquée avec succès.${NC}"
else
    echo -e "${RED}Erreur lors de l'application de la migration.${NC}"
    exit 1
fi

echo -e "${GREEN}Terminé !${NC}"
