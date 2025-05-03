#!/bin/bash

# Script d'installation et de configuration de l'environnement de développement pour l'intranet ESGIS
# Auteur: Équipe de développement ESGIS
# Date: 3 mai 2025

echo "🚀 Configuration de l'environnement de développement pour l'intranet ESGIS"
echo "---------------------------------------------------------------------"

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js (v18.x ou supérieur) avant de continuer."
    exit 1
fi

# Vérifier la version de Node.js
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d '.' -f 1)

if [ $NODE_MAJOR_VERSION -lt 18 ]; then
    echo "❌ La version de Node.js est trop ancienne. Veuillez installer Node.js v18.x ou supérieur."
    echo "Version actuelle: $NODE_VERSION"
    exit 1
fi

echo "✅ Node.js v$NODE_VERSION détecté"

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez installer npm avant de continuer."
    exit 1
fi

echo "✅ npm détecté"

# Créer le répertoire .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cat > .env << EOL
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon
VITE_APP_NAME=Intranet ESGIS
EOL
    echo "✅ Fichier .env créé. Veuillez mettre à jour les variables d'environnement avec vos informations Supabase."
else
    echo "✅ Fichier .env existant détecté"
fi

# Créer le répertoire public s'il n'existe pas
if [ ! -d public ]; then
    echo "📁 Création du répertoire public..."
    mkdir -p public
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Créer le répertoire types/database.ts pour Supabase
echo "📁 Création du répertoire pour les types Supabase..."
mkdir -p src/types

# Créer le fichier de types pour Supabase
echo "📝 Création du fichier de types pour Supabase..."
cat > src/types/database.ts << EOL
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string
          avatar_url: string | null
          email: string
          role: 'admin' | 'professor' | 'student'
          department_id: number | null
          is_active: boolean
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name: string
          avatar_url?: string | null
          email: string
          role: 'admin' | 'professor' | 'student'
          department_id?: number | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string
          avatar_url?: string | null
          email?: string
          role?: 'admin' | 'professor' | 'student'
          department_id?: number | null
          is_active?: boolean
        }
      }
      departments: {
        Row: {
          id: number
          created_at: string
          name: string
          description: string | null
          head_professor_id: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          name: string
          description?: string | null
          head_professor_id?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          name?: string
          description?: string | null
          head_professor_id?: string | null
        }
      }
      courses: {
        Row: {
          id: number
          created_at: string
          name: string
          code: string
          description: string | null
          department_id: number
          credits: number
          semester: number
        }
        Insert: {
          id?: number
          created_at?: string
          name: string
          code: string
          description?: string | null
          department_id: number
          credits: number
          semester: number
        }
        Update: {
          id?: number
          created_at?: string
          name?: string
          code?: string
          description?: string | null
          department_id?: number
          credits?: number
          semester?: number
        }
      }
      // Autres tables selon le schéma de base de données
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
EOL

echo "✅ Fichier de types pour Supabase créé"

# Créer le fichier vite.config.ts
echo "📝 Mise à jour du fichier vite.config.ts..."
cat > vite.config.ts << EOL
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  base: '/intranet-esgis/', // Pour le déploiement sur GitHub Pages
});
EOL

echo "✅ Fichier vite.config.ts mis à jour"

# Créer le fichier tsconfig.json
echo "📝 Mise à jour du fichier tsconfig.json..."
cat > tsconfig.json << EOL
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOL

echo "✅ Fichier tsconfig.json mis à jour"

# Créer le fichier tsconfig.node.json s'il n'existe pas
if [ ! -f tsconfig.node.json ]; then
    echo "📝 Création du fichier tsconfig.node.json..."
    cat > tsconfig.node.json << EOL
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOL
    echo "✅ Fichier tsconfig.node.json créé"
fi

# Créer le fichier index.html
echo "📝 Mise à jour du fichier index.html..."
cat > index.html << EOL
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap"
      rel="stylesheet"
    />
    <title>Intranet ESGIS</title>
    <meta
      name="description"
      content="Intranet de l'École Supérieure de Gestion d'Informatique et des Sciences (ESGIS)"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOL

echo "✅ Fichier index.html mis à jour"

echo "---------------------------------------------------------------------"
echo "✅ Configuration de l'environnement terminée avec succès !"
echo ""
echo "Pour démarrer le serveur de développement, exécutez :"
echo "npm run dev"
echo ""
echo "N'oubliez pas de mettre à jour le fichier .env avec vos informations Supabase."
echo "---------------------------------------------------------------------"
