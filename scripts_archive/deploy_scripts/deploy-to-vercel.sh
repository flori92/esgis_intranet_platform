#!/bin/bash

# Script de déploiement automatisé vers Vercel
# Créé pour la plateforme d'examen ESGIS

echo "🚀 Déploiement de la plateforme d'examen ESGIS sur Vercel"
echo "--------------------------------------------------------"

# Configuration
GITHUB_REPO="flori92/exam_esgis_platform"
PROJECT_NAME="exam-esgis-platform"

# Vérification de l'installation de curl
if ! command -v curl &> /dev/null; then
    echo "❌ curl n'est pas installé. Veuillez l'installer pour continuer."
    exit 1
fi

# Vérification du token Vercel
if [ -z "$VERCEL_TOKEN" ]; then
    echo "⚠️ Variable d'environnement VERCEL_TOKEN non définie."
    echo "Veuillez exécuter: export VERCEL_TOKEN=votre_token_vercel"
    exit 1
fi

echo "📋 Vérification de l'existence du projet sur Vercel..."
PROJECT_CHECK=$(curl -s -X GET "https://api.vercel.com/v9/projects/$PROJECT_NAME" \
    -H "Authorization: Bearer $VERCEL_TOKEN")

if echo "$PROJECT_CHECK" | grep -q "\"name\":\"$PROJECT_NAME\""; then
    echo "✅ Projet trouvé sur Vercel, préparation du déploiement..."
    PROJECT_EXISTS=true
else
    echo "🆕 Projet non trouvé, création d'un nouveau projet..."
    PROJECT_EXISTS=false
fi

if [ "$PROJECT_EXISTS" = false ]; then
    echo "📋 Création du projet sur Vercel..."
    CREATE_RESPONSE=$(curl -s -X POST "https://api.vercel.com/v9/projects" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$PROJECT_NAME\",
            \"framework\": \"vite\",
            \"gitRepository\": {
                \"type\": \"github\",
                \"repo\": \"$GITHUB_REPO\"
            },
            \"environmentVariables\": [
                {
                    \"key\": \"VITE_SUPABASE_URL\",
                    \"value\": \"https://zsuszjlgatsylleuopff.supabase.co\",
                    \"target\": [\"production\", \"preview\", \"development\"]
                },
                {
                    \"key\": \"VITE_SUPABASE_ANON_KEY\",
                    \"value\": \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmhuamtieGdjaW9qZXZyd2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMDY5MDYsImV4cCI6MjA2MTc4MjkwNn0.VeqmGA56qySH_f4rwk6bnsvPS6173BtoRA0iCjXnogM\",
                    \"target\": [\"production\", \"preview\", \"development\"]
                }
            ]
        }")

    # Vérification de la réponse
    if echo "$CREATE_RESPONSE" | grep -q "error"; then
        echo "❌ Erreur lors de la création du projet:"
        echo "$CREATE_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4
        
        # Vérifier si le projet existe déjà
        if echo "$CREATE_RESPONSE" | grep -q "already exists"; then
            echo "ℹ️ Le projet existe déjà sur Vercel, tentative de déploiement..."
        else
            exit 1
        fi
    else
        echo "✅ Projet créé avec succès sur Vercel!"
    fi
fi

echo "🔄 Déploiement du projet depuis GitHub..."
DEPLOY_RESPONSE=$(curl -s -X POST "https://api.vercel.com/v13/deployments" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"$PROJECT_NAME\",
        \"project\": \"$PROJECT_NAME\",
        \"target\": \"production\",
        \"gitSource\": {
            \"type\": \"github\",
            \"repo\": \"$GITHUB_REPO\",
            \"ref\": \"main\"
        }
    }")

# Vérification de la réponse
if echo "$DEPLOY_RESPONSE" | grep -q "error"; then
    echo "❌ Erreur lors du déploiement:"
    echo "$DEPLOY_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4
    
    # Essayer une méthode alternative de déploiement
    echo "🔄 Tentative de déploiement alternatif..."
    ALT_DEPLOY_RESPONSE=$(curl -s -X POST "https://api.vercel.com/v13/deployments" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$PROJECT_NAME\",
            \"project\": \"$PROJECT_NAME\",
            \"target\": \"production\",
            \"source\": \"git\",
            \"gitSource\": {
                \"type\": \"github\",
                \"repo\": \"$GITHUB_REPO\",
                \"ref\": \"main\"
            }
        }")
    
    if echo "$ALT_DEPLOY_RESPONSE" | grep -q "error"; then
        echo "❌ Échec du déploiement alternatif:"
        echo "$ALT_DEPLOY_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4
        
        echo "ℹ️ Conseil: Essayez de déployer manuellement via l'interface Vercel:"
        echo "1. Allez sur https://vercel.com/new"
        echo "2. Importez le dépôt GitHub $GITHUB_REPO"
        echo "3. Configurez les variables d'environnement Supabase"
        echo "4. Cliquez sur 'Deploy'"
        exit 1
    else
        DEPLOYMENT_URL=$(echo "$ALT_DEPLOY_RESPONSE" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$DEPLOYMENT_URL" ]; then
            echo "✅ Déploiement alternatif réussi!"
            echo "🌐 URL du projet: https://$DEPLOYMENT_URL"
        else
            echo "✅ Déploiement alternatif initié avec succès!"
            echo "🌐 Vérifiez votre tableau de bord Vercel pour l'URL du projet."
        fi
    fi
else
    DEPLOYMENT_URL=$(echo "$DEPLOY_RESPONSE" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$DEPLOYMENT_URL" ]; then
        echo "✅ Déploiement réussi!"
        echo "🌐 URL du projet: https://$DEPLOYMENT_URL"
    else
        echo "✅ Déploiement initié avec succès!"
        echo "🌐 Vérifiez votre tableau de bord Vercel pour l'URL du projet."
    fi
fi

echo "--------------------------------------------------------"
echo "📝 Note: Pour voir tous les détails, consultez votre tableau de bord Vercel."
echo "🔗 https://vercel.com/dashboard"
