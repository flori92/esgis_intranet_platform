import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Configuration simplifiée pour GitHub Pages
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
    // Désactiver la minification pour le débogage
    minify: false,
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Garantir des noms de fichiers cohérents
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return '[name].css';
          }
          // Placer les images et autres ressources statiques à la racine
          if (/\.(png|jpe?g|gif|svg|ico)$/.test(assetInfo.name)) {
            return '[name][extname]';
          }
          return 'assets/[name].[hash][extname]';
        },
      },
      // Ignorer les erreurs dans la production
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
