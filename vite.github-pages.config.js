import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Configuration spécifique pour GitHub Pages
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // Configuration essentielle pour GitHub Pages
  base: '/intranet-esgis/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Assurer que les ressources sont dans le bon dossier
    assetsInlineLimit: 0,
    // Utiliser une structure de dossier plate pour les assets
    assetsDir: '',
    rollupOptions: {
      output: {
        // Garantir des noms de fichiers cohérents
        entryFileNames: '[name].[hash].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[hash].[ext]',
        // Éviter la minification excessive
        compact: false,
        // S'assurer que les imports sont correctement résolus
        manualChunks: undefined
      },
      onwarn(warning, warn) {
        // Ignorer certains avertissements courants
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || 
            warning.code === 'CIRCULAR_DEPENDENCY' ||
            warning.code === 'MISSING_EXPORT' || 
            warning.code === 'UNUSED_EXTERNAL_IMPORT') {
          return;
        }
        warn(warning);
      }
    }
  }
});
