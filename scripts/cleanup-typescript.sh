#!/bin/bash

# Script de nettoyage des fichiers TypeScript résiduels
# Ce script supprime les fichiers de définition de types et autres fichiers TypeScript
# qui ne sont plus nécessaires après la migration vers JavaScript

echo "🧹 Nettoyage des fichiers TypeScript résiduels..."

# Suppression des fichiers de définition de types (.d.ts)
find ./src -name "*.d.ts" -type f -delete
echo "✅ Fichiers de définition de types (.d.ts) supprimés"

# Suppression des fichiers TypeScript restants (.ts)
find ./src -name "*.ts" -not -name "*.test.ts" -type f -delete
echo "✅ Fichiers TypeScript (.ts) supprimés"

# Suppression de tsconfig.json (remplacé par jsconfig.json)
if [ -f "tsconfig.json" ]; then
  rm tsconfig.json
  echo "✅ tsconfig.json supprimé"
fi

if [ -f "tsconfig.node.json" ]; then
  rm tsconfig.node.json
  echo "✅ tsconfig.node.json supprimé"
fi

echo "🎉 Nettoyage terminé ! Le projet a été entièrement migré vers JavaScript."
