import { defineConfig } from '@playwright/test';
import localConfig from './playwright.config';

export default defineConfig({
  ...localConfig,
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/chess-combinations-trainer/',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
