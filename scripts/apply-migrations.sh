#!/bin/bash
# Script pour appliquer les migrations Supabase via PostgreSQL direct
# Usage: bash scripts/apply-migrations.sh [--dry-run] [--verbose]

set -e

# Configuration
DATABASE_HOST="db.zsuszjlgatsylleuopff.supabase.co"
DATABASE_PORT="5432"
DATABASE_NAME="postgres"
DATABASE_USER="postgres"
DATABASE_PASSWORD="Apollonf@vi92"
DRY_RUN=false
VERBOSE=false
MIGRATIONS_DIR="supabase/migrations"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse des arguments
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      ;;
    --verbose)
      VERBOSE=true
      ;;
  esac
done

# Fonctions
log_info() {
  echo -e "${CYAN}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

log_debug() {
  if [ "$VERBOSE" = true ]; then
    echo -e "${CYAN}[DEBUG]${NC} $1"
  fi
}

# Vérification des prérequis
log_info "🚀 Migration Supabase — PostgreSQL Direct"
echo ""

if ! command -v psql &> /dev/null; then
  log_error "PostgreSQL client (psql) n'est pas installé"
  log_warning "Installation via Homebrew..."
  brew install postgresql
  log_success "PostgreSQL client installé"
fi

log_debug "psql trouvé: $(which psql)"

# Test de la connexion
log_debug "Test de connexion à la base de données..."
if ! PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c "SELECT version();" &> /dev/null; then
  log_error "Impossible de se connecter à PostgreSQL"
  exit 1
fi
log_success "Connexion à PostgreSQL établie"

# Vérifier que le dossier migrations existe
if [ ! -d "$MIGRATIONS_DIR" ]; then
  log_error "Dossier migrations introuvable: $MIGRATIONS_DIR"
  exit 1
fi

# Lister les fichiers de migration
MIGRATION_FILES=$(find "$MIGRATIONS_DIR" -name "*.sql" -type f | sort)

if [ -z "$MIGRATION_FILES" ]; then
  log_warning "Aucun fichier de migration trouvé"
  exit 0
fi

# Compter les fichiers
FILE_COUNT=$(echo "$MIGRATION_FILES" | wc -l)
log_info "$FILE_COUNT fichier(s) de migration trouvé(s)"

echo ""
echo -e "${CYAN}Migrations à appliquer:${NC}"
i=1
for file in $MIGRATION_FILES; do
  echo "  $i. $(basename "$file")"
  i=$((i + 1))
done

if [ "$DRY_RUN" = true ]; then
  log_warning "[DRY-RUN] Les migrations ne seront pas vraiment exécutées"
fi
echo ""

# Appliquer les migrations
SUCCESS_COUNT=0
ERROR_COUNT=0

for file in $MIGRATION_FILES; do
  FILENAME=$(basename "$file")
  
  if [ ! -s "$file" ]; then
    log_warning "$FILENAME: fichier vide, ignoré"
    continue
  fi
  
  log_info "Application: ${CYAN}$FILENAME${NC}"
  
  if [ "$VERBOSE" = true ]; then
    log_debug "Contenu ($(wc -l < "$file") lignes):"
    head -c 300 "$file" | sed 's/^/  /'
    echo ""
  fi
  
  if [ "$DRY_RUN" = true ]; then
    log_success "[DRY-RUN] Migration acceptée"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    continue
  fi
  
  # Créer un fichier temporaire
  TEMP_FILE="/tmp/migration_$$.sql"
  cp "$file" "$TEMP_FILE"
  
  # Exécuter la migration
  if PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" -f "$TEMP_FILE" > /dev/null 2>&1; then
    log_success "$FILENAME: ✓ Appliquée"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    log_error "$FILENAME: Erreur lors de l'application"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
  
  # Nettoyer
  rm -f "$TEMP_FILE"
done

# Résumé
echo ""
echo -e "${CYAN}=== Résumé ===${NC}"
if [ "$DRY_RUN" = true ]; then
  log_success "Fichiers validés: $SUCCESS_COUNT/$FILE_COUNT"
else
  log_success "Migrations appliquées: $SUCCESS_COUNT/$FILE_COUNT"
  if [ $ERROR_COUNT -gt 0 ]; then
    log_warning "Erreurs: $ERROR_COUNT"
  fi
fi

echo ""

if [ $SUCCESS_COUNT -eq $FILE_COUNT ]; then
  log_success "Toutes les migrations ont été appliquées avec succès!"
  exit 0
else
  if [ $ERROR_COUNT -gt 0 ]; then
    log_warning "$ERROR_COUNT migration(s) en erreur"
    exit 1
  fi
  exit 0
fi
