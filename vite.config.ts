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
  build: {
    // Configuration pour améliorer la stabilité du build
    outDir: 'dist',
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
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
