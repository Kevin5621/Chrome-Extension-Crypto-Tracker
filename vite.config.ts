import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'src/main.tsx',
      output: {
        entryFileNames: 'main.js',
        format: 'iife'
      }
    },
    watch: {}
  },
  server: {
    hmr: true,
    port: 3000
  }
});
