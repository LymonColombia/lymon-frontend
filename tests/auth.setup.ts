/**
 * auth.setup.ts
 *
 * Runs once before every authenticated E2E test suite.
 * Saves the manager session (cookies + localStorage) to disk so that all
 * other tests can inject it via `storageState` without repeating the login flow.
 *
 * Pattern: Screenplay
 * Gherkin: "Given the manager is already authenticated"
 */

import { test as setup } from './fixtures/api.fixture';
import { BrowseTheWeb } from './support/screenplay/abilities/browse-the-web.ability';
import { GuestActor } from './support/screenplay/actors/guest.actor';

const AUTH_FILE = 'tests/.auth/manager.json';

setup('authenticate as manager', async ({ page, apiClient }) => {
  const email = process.env.MANAGER_EMAIL!;
  const password = process.env.MANAGER_PASSWORD!;

  // 1. Ensure user exists via API (Clean Slate)
  try {
    await apiClient.registerTenant({
      tenantName: 'Mi Hotel Paradise',
      email: email,
      password: password,
      planType: 'TRIAL',
    });
  } catch (e) {
    // Ignore if exists
  }

  // 2. API Login & Storage Injection
  await apiClient.login(email, password, page);

  // 3. Navigate to the actual application domain to settle storage
  await page.goto('/');

  // 4. Save state
  await page.context().storageState({ path: AUTH_FILE });
});
