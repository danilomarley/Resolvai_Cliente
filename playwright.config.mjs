import { defineConfig, devices } from '@playwright/test'
import { baseURL, cleanEnv } from './e2e/runtime.mjs'

export default defineConfig({
  testDir: './e2e/specs', fullyParallel: false, workers: 1, retries: 0, forbidOnly: !!process.env.CI,
  timeout: 30000, expect: { timeout: 10000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'off', serviceWorkers: 'block' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: 'node e2e/start-api.mjs', url: 'http://127.0.0.1:5172/health', reuseExistingServer: false, timeout: 60000 },
    { command: 'node node_modules/vite/bin/vite.js --config e2e/vite.config.mjs', url: baseURL,
      env: cleanEnv(), reuseExistingServer: false, timeout: 60000 },
  ],
})
