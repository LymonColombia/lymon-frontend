import { test as base } from '@playwright/test';
import { LyhostApiClient } from '../support/api/lyhost-api-client';

/**
 * Custom test fixture to provide the API Client to any test.
 */
export const test = base.extend<{
  apiClient: LyhostApiClient;
}>({
  apiClient: async ({ request }, use) => {
    const client = new LyhostApiClient(request);
    await use(client);
  },
});

export { expect } from '@playwright/test';
