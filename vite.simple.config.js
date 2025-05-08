import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Assurez-vous que le fichier env-config.js existe pour les variables d'environnement
const envConfigPath = path.resolve(__dirname, 'public/env-config.js');
if (!fs.existsSync(envConfigPath)) {
  fs.writeFileSync(
    envConfigPath,
    `window.ENV = {
  SUPABASE_URL: "https://yipwzsjbvqwqxwipgktp.supabase.co",
  // La clé anon est incluse dans le bundle, pas besoin de l'exposer ici
};
`
  );
}

// Configuration optimisée pour GitHub Pages
export default defineConfig({
  plugins: [react()],
  // Base URL pour GitHub Pages
  base: '/esgis_intranet_platform/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Activer la minification pour l'environnement de production
    minify: process.env.NODE_ENV === 'production',
    outDir: 'dist',
    // Placer les assets directement à la racine pour éviter les problèmes de chemin
    assetsDir: '',
    emptyOutDir: true,
    // Copier les fichiers nécessaires au routage SPA dans le dossier de build
    rollupOptions: {
      output: {
        // Utiliser des noms simplifiés pour faciliter les références
        entryFileNames: 'index.js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'index.css';
          }
          // Placer les images et autres ressources statiques à la racine
          if (/\.(png|jpe?g|gif|svg|ico)$/.test(assetInfo.name)) {
            return '[name][extname]';
          }
          return 'assets/[name].[hash][extname]';
        },
      },
      // Ignorer les erreurs non critiques dans la production
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || 
            warning.code === 'CIRCULAR_DEPENDENCY' ||
            warning.code === 'MISSING_EXPORT' || 
            warning.code === 'UNUSED_EXTERNAL_IMPORT') {
          return;
        }
        warn(warning);
      },
      // Exclure les fichiers de test
      external: [
        /\.test\.(js|jsx)$/,
        /\.spec\.(js|jsx)$/,
        /setupTests\.js/
      ]
    }
  },
  // Exclure les fichiers de test du build
  optimizeDeps: {
    exclude: ['@testing-library/jest-dom']
  },
  // Définir les variables d'environnement pour la production
  define: {
    // Définir jest comme un objet vide pour éviter les erreurs
    'jest': '{}'
  },
  // Exclure les fichiers de test
  exclude: ['**/*.test.js', '**/*.test.jsx', '**/*.spec.js', '**/*.spec.jsx'],
});
