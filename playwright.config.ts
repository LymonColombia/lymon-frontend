import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Playwright configuration.
 *
 * Auth setup runs first (once) and saves manager session to disk.
 * All authenticated test suites declare 'setup' as a dependency so they
 * reuse the stored session instead of logging in on every test.
 */
export default defineConfig({
  testDir: './tests',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    trace: 'on-first-retry',
    // The Angular app — NOT the backend API (which runs on :3000).
    baseURL: process.env.BASE_URL ?? 'http://localhost:4200',
  },

  /**
   * Starts the Angular dev server automatically so the suite is self-contained.
   * If a dev server is already running on :4200 it is reused instead.
   */
  webServer: {
    command: 'pnpm exec ng serve --port 4200',
    url: process.env.BASE_URL ?? 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },

  projects: [
    // ─── Auth setup project (runs once before authenticated suites) ───────────
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // ─── Chromium ─────────────────────────────────────────────────────────────
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/manager.json',
      },
    },

    // ─── Firefox ──────────────────────────────────────────────────────────────
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'tests/.auth/manager.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },

    // ─── WebKit ───────────────────────────────────────────────────────────────
    // WebKit needs system libraries (GTK4, GStreamer, …) that are not installed
    // by default. Install them with `sudo pnpm exec playwright install-deps webkit`
    // and run with PW_WEBKIT=1 to include this project.
    ...(process.env.PW_WEBKIT === '1'
      ? [
          {
            name: 'webkit',
            use: {
              ...devices['Desktop Safari'],
              storageState: 'tests/.auth/manager.json',
            },
            dependencies: ['setup'],
            testIgnore: /auth\.setup\.ts/,
          },
        ]
      : []),
  ],
});
