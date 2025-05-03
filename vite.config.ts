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
  // Ajout du slash final important pour les chemins relatifs
  base: '/intranet-esgis/', 
  build: {
    // Configuration pour améliorer la stabilité du build
    outDir: 'dist',
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 5000,
    // Assurer que les assets sont correctement référencés
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Garantir des noms de fichiers stables pour le cache
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      },
      onwarn(warning, warn) {
        // Ignorer certaines erreurs courantes
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || 
            warning.code === 'CIRCULAR_DEPENDENCY' ||
            warning.code === 'MISSING_EXPORT' || 
            warning.code === 'UNUSED_EXTERNAL_IMPORT') {
          return;
        }
        // Pour les autres avertissements, afficher normalement
        warn(warning);
      }
    }
  }
});
