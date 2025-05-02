import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Configuration pour GitHub Pages
  base: '/exam_esgis_platform/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
