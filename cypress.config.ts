import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  e2e: {
    baseUrl: 'https://lyhost.netlify.app',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    retries: { runMode: 2, openMode: 0 },
    video: false,
    screenshotOnRunFailure: true,
    allowCypressEnv: false,
    env: {
      MANAGER_EMAIL: process.env['MANAGER_EMAIL'],
      MANAGER_PASSWORD: process.env['MANAGER_PASSWORD'],
    },
  },
});
