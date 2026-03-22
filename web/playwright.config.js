import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests-e2e',
  testMatch: '**/*.spec.js',
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    baseURL: 'http://localhost:4173',
  },
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  reporter: [['html'], ['json', { outputFile: 'test-results/results.json' }]],
});
