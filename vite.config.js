import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Configuration Vite pour l'Intranet ESGIS
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // Base URL: '/' pour dev et Vercel, '/intranet-esgis/' pour GitHub Pages
  base: process.env.GITHUB_PAGES ? '/intranet-esgis/' : '/',
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
