import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './specs', workers: 1, retries: 0, forbidOnly: !!process.env.CI,
  use: { baseURL: 'http://127.0.0.1:4174', trace: 'off', screenshot: 'only-on-failure' },
  webServer: [
    { command: 'node .security-api/tests/live/start.mjs', url: 'http://127.0.0.1:5175/health', reuseExistingServer: false },
    { command: 'node node_modules/vite/bin/vite.js --config security/vite.config.mjs', url: 'http://127.0.0.1:4174', reuseExistingServer: false },
  ],
})
