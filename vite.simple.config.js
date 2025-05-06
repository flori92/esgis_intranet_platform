import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Configuration simplifiée pour GitHub Pages
export default defineConfig({
  plugins: [react()],
  // Base URL pour GitHub Pages
  base: '/esgis_intranet_platform/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    // Désactiver la minification pour le débogage
    minify: false,
    // Ne pas utiliser de répertoire d'assets
    assetsDir: '',
    rollupOptions: {
      output: {
        // Garantir des noms de fichiers cohérents
        entryFileNames: '[name].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[ext]'
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
  }
});
