import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Configuration Vite pour le développement local
 * Cette configuration est utilisée uniquement pour le développement local
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // Base vide pour le développement local
  base: '/', 
  build: {
    outDir: 'dist',
    sourcemap: true, // Activer les sourcemaps pour le développement
    reportCompressedSize: false,
    chunkSizeWarningLimit: 5000,
    assetsDir: 'assets',
  },
  server: {
    port: 3000, // Port par défaut
    open: true, // Ouvrir automatiquement le navigateur
    host: true, // Écouter sur toutes les interfaces réseau
  }
});
