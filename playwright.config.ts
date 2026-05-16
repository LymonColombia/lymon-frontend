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
    baseURL: 'https://lyhost.netlify.app',
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
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'tests/.auth/manager.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
});
