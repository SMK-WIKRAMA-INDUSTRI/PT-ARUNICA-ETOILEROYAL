import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'], browserName: 'chromium' } }
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    // Use an isolated proxy port so tests never reuse a stale dev server.
    env: {
      ...process.env,
      VITE_CONCIERGE_PROXY_URL: '',
      PORT: '8791',
      VITE_PAYMENT_PROXY_URL: 'http://127.0.0.1:8791'
    },
    timeout: 30_000
  }
});
