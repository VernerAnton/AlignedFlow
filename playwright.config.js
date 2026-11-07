import { defineConfig, devices } from '@playwright/test'

// End-to-end tests against a production build served by `vite preview`, so the
// real worker timer, service worker and bundling are what gets exercised.
// These run on real time — presets in the specs use durations of a few
// seconds to keep the suite short.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /touch\.spec/ },
    { name: 'phone', use: { ...devices['Pixel 7'] }, testMatch: /touch\.spec/ },
  ],
})
