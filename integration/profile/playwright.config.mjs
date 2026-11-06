import { defineConfig } from '@playwright/test'
import { fileURLToPath } from 'node:url'
const cwd = fileURLToPath(new URL('../../', import.meta.url))
export default defineConfig({
  testDir: './specs', workers: 1, retries: 0, forbidOnly: !!process.env.CI,
  expect: { timeout: 10000 }, use: { baseURL: 'http://127.0.0.1:4173', trace: 'off', screenshot: 'only-on-failure' },
  webServer: [
    { command: 'node .test-services/e2e/start-api.mjs', cwd, url: 'http://127.0.0.1:5172/health', reuseExistingServer: false },
    { command: 'node integration/profile/start-reviews.mjs', cwd, url: 'http://127.0.0.1:5178/health', reuseExistingServer: false },
    { command: 'node node_modules/vite/bin/vite.js --config .test-services/e2e/vite.config.mjs', cwd, url: 'http://127.0.0.1:4173', reuseExistingServer: false },
  ],
})
