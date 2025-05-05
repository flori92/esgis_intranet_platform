#!/bin/bash

# Script de migration TypeScript vers JavaScript pur
# Auteur: Cascade AI
# Date: 2025-05-05

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Répertoire racine du projet
PROJECT_ROOT="/Users/floriace/Downloads/project"

echo -e "${BLUE}=== Migration TypeScript vers JavaScript ===${NC}"
echo -e "${YELLOW}Ce script assistera dans la conversion des fichiers .ts/.tsx vers .js/.jsx${NC}"

# Fonction pour convertir un fichier TypeScript en JavaScript
convert_file() {
    local source_file=$1
    local target_file
    
    # Déterminer le nom du fichier cible
    if [[ $source_file == *.tsx ]]; then
        target_file="${source_file%.tsx}.jsx"
    else
        target_file="${source_file%.ts}.js"
    fi
    
    echo -e "${YELLOW}Conversion de ${source_file} vers ${target_file}${NC}"
    
    # Créer un dossier de sauvegarde si nécessaire
    backup_dir="$PROJECT_ROOT/ts_backup"
    mkdir -p "$backup_dir"
    
    # Sauvegarder le fichier original
    cp "$source_file" "$backup_dir/$(basename "$source_file")"
    
    # Copier le contenu sans les annotations de type (version basique)
    # Note: Cette conversion est simplifiée et pourrait nécessiter des ajustements manuels
    sed -E 's/: [A-Za-z<>{}[\],\|]+//g; s/<[A-Za-z<>{}[\],\|]+>//g; s/implements [A-Za-z<>{}[\],\|]+//g' "$source_file" > "$target_file"
    
    echo -e "${GREEN}Fichier converti: ${target_file}${NC}"
    echo -e "${YELLOW}⚠️  Important: Vérifiez manuellement le fichier converti pour des corrections supplémentaires${NC}"
    
    return 0
}

# Fonction pour générer une liste des fichiers à convertir
generate_file_list() {
    echo -e "${BLUE}Génération de la liste des fichiers TypeScript...${NC}"
    
    # Créer un fichier temporaire pour la liste
    file_list="$PROJECT_ROOT/ts_files_to_convert.txt"
    
    # Trouver tous les fichiers .ts/.tsx, à l'exclusion des fichiers .d.ts
    find "$PROJECT_ROOT/src" -type f \( -name "*.ts" -o -name "*.tsx" \) | grep -v ".d.ts" > "$file_list"
    
    echo -e "${GREEN}Liste générée: $(wc -l < "$file_list") fichiers à convertir${NC}"
    echo -e "${YELLOW}La liste est disponible dans ${file_list}${NC}"
    
    return 0
}

# Menu principal
echo -e "${BLUE}Options disponibles :${NC}"
echo -e " 1. ${YELLOW}Convertir un fichier spécifique${NC}"
echo -e " 2. ${YELLOW}Générer une liste des fichiers à convertir${NC}"
echo -e " 3. ${YELLOW}Convertir tous les fichiers (risqué)${NC}"
echo -e " 4. ${YELLOW}Quitter${NC}"

read -p "Choisissez une option (1-4): " option

case $option in
    1)
        read -p "Entrez le chemin complet du fichier à convertir: " file_path
        if [[ -f "$file_path" ]]; then
            convert_file "$file_path"
        else
            echo -e "${RED}Erreur: Le fichier spécifié n'existe pas.${NC}"
        fi
        ;;
    2)
        generate_file_list
        ;;
    3)
        generate_file_list
        file_list="$PROJECT_ROOT/ts_files_to_convert.txt"
        
        echo -e "${RED}⚠️  ATTENTION: Vous êtes sur le point de convertir tous les fichiers TypeScript.${NC}"
        echo -e "${RED}Cette opération peut introduire des bugs. Il est recommandé de procéder fichier par fichier.${NC}"
        read -p "Êtes-vous sûr de vouloir continuer? (o/N): " confirm
        
        if [[ $confirm == "o" || $confirm == "O" ]]; then
            echo -e "${YELLOW}Début de la conversion...${NC}"
            
            while IFS= read -r file; do
                convert_file "$file"
            done < "$file_list"
            
            echo -e "${GREEN}Conversion terminée!${NC}"
        else
            echo -e "${BLUE}Opération annulée.${NC}"
        fi
        ;;
    4)
        echo -e "${BLUE}Au revoir!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Option invalide.${NC}"
        ;;
esac

echo -e "${BLUE}=== Fin du script ===${NC}"
echo -e "${YELLOW}N'oubliez pas de vérifier et corriger les fichiers convertis manuellement.${NC}"
echo -e "${YELLOW}Certains ajustements seront nécessaires, notamment pour les imports et les blocs conditionnels.${NC}"
