#!/bin/bash

echo "🔍 AUDIT COMPLET: Vérification des erreurs JavaScript"
echo "═════════════════════════════════════════════════════════"
echo ""

# 1. Vérifier les liens d'import
echo "1️⃣  Vérification des imports..."
echo ""

# Vérifier le fichier index
if grep -q "from './18Relations.components'" src/services/18Relations.index.js; then
    echo "❌ ERROR: Mauvais import dans 18Relations.index.js"
    echo "   Doit être: '../components/18Relations.components'"
    echo "   Actuellement: './18Relations.components'"
fi

# Vérifier si les fichiers existent
echo ""
echo "2️⃣  Vérification des fichiers..."
FILES=(
    "src/config/supabase.config.js"
    "src/services/18Relations.service.js"
    "src/services/18Relations.enhanced.js"
    "src/services/18Relations.index.js"
    "src/hooks/use18Relations.js"
    "src/hooks/use18Relations.enhanced.js"
    "src/components/18Relations.components.jsx"
    "src/types/18Relations.types.d.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file MISSING"
    fi
done

echo ""
echo "3️⃣  Vérification de la syntaxe..."
node -c src/services/18Relations.service.js 2>&1 | head -5
node -c src/services/18Relations.enhanced.js 2>&1 | head -5
node -c src/hooks/use18Relations.js 2>&1 | head -5
node -c src/hooks/use18Relations.enhanced.js 2>&1 | head -5

echo ""
echo "4️⃣  Build test..."
npm run build 2>&1 | tail -3

echo ""
echo "═════════════════════════════════════════════════════════"
echo "✅ Audit complété"
