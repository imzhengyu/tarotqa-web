import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    include: ['src/tests/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      exclude: [
        'node_modules/',
        'src/tests/',
        'src/main.jsx',
        'src/App.jsx',
        'scripts/**',
        'public/',
        'coverage/',
        '**/*.config.*',
        'dist/',
        // 搁置的 Word 导出方案（未接入任何页面，等启用时再补测试）
        'src/utils/docxMarkdown.js',
        'src/utils/exportDocx.js'
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    },
    alias: {
      '@': '/src'
    }
  }
});
