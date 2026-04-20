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
    sourcemap: false
  }
});