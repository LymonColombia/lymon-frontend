/**
 * Feature: Property Creation
 *
 * Gherkin Source: tests/features/properties/create-property.feature
 *
 * Pre-condition : Manager is already authenticated (storageState injected by Playwright setup).
 * Post-condition: Created property is deleted in afterEach to restore a clean environment.
 */

import { test, expect } from '../../fixtures/api.fixture';
import { ManagerFlow } from '../../support/screenplay/manager-flow';

// ─── Test data ────────────────────────────────────────────────────────────────

const PROPERTY = {
  name: 'Hotel Viltrum E2E',
  type: 'HOTEL',
  description: 'La mejor experiencia de tu vida',
  address: 'Calle 123 #67 - 79',
  city: 'Medellin',
  state: 'Medellin',
  country: 'Colombia',
  postalCode: '670076',
  latitude: '4.3',
  longitude: '74',
  checkInTime: '09:00',
  checkOutTime: '22:00',
  cancellationPolicy: 'FLEXIBLE',
  phone: '+57 3006007000',
  email: 'host@viltrum.com',
} as const;

// ─── Suite ───────────────────────────────────────────────────────────────────

test.describe('Feature: Property Creation', () => {
  let manager: ManagerFlow;

  test.beforeEach(async ({ page }) => {
    manager = new ManagerFlow(page);
    // Navigate to /properties — session is already loaded from storageState.
    await page.goto('/properties');
  });

  test.afterEach(async ({ apiClient }) => {
    // Clean-up: remove the property that was created so the next run starts fresh.
    await apiClient.deleteProperty(PROPERTY.name);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager creates a new property
  // Given  the manager is on the Properties page
  // When   the manager fills and submits the property creation form
  // Then   the new property appears in the property list
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: manager creates a new property', async ({ page }) => {
    // When
    await manager.createProperty(PROPERTY);

    // Then
    const layout = page.locator('app-hotel-page-layout');
    await expect(layout).toContainText(PROPERTY.name);
    // Use .first() to handle any potential duplicate renders during the transition
    await expect(
      page.getByRole('article').filter({ hasText: PROPERTY.name }).first(),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mis Propiedades', level: 1 })).toBeVisible();
  });
});
