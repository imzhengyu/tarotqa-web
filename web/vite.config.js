import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { version } from './package.json';

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __GIT_SHA__: JSON.stringify(process.env.VITE_GIT_SHA || 'local'),
    'import.meta.env.VITE_DEFAULT_API_KEY': JSON.stringify(process.env.VITE_DEFAULT_API_KEY || '')
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-iztro': ['react-iztro', 'iztro'],
          'vendor-astro': ['astronomy-engine'],
          'vendor-md': ['markdown-it', 'markdown-it-multimd-table', 'markdown-it-mark', 'dompurify'],
          'vendor-dayjs': ['dayjs']
        }
      }
    }
  }
});