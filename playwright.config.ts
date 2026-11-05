import { defineConfig, devices } from '@playwright/test';

/**
 * e2e journeys run against the Vite dev server with the admin API faked in
 * the browser (e2e/mock-api.ts) — no flick-backend needed.
 *
 *   bun run e2e            # headless chromium
 *   bun run e2e --ui       # watch mode
 *
 * media/capture.spec.ts is NOT part of this run; media/capture.sh drives it.
 */
const PORT = 5175;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `bunx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
