import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'src/main.ts',
      output: {
        entryFileNames: 'main.js',
        format: 'iife'
      }
    }
  }
})
