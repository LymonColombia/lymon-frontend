/**
 * Feature: Guest Login
 *
 * Gherkin Source: tests/features/auth/login.feature (guest section)
 *
 * These tests exercise the guest login UI — intentionally unauthenticated.
 */

import { test, expect } from '@playwright/test';
import { LyhostFlow } from '../../../support/screenplay/lyhost-flow';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Feature: Guest Login', () => {
  let lyhost: LyhostFlow;

  test.beforeEach(async ({ page }) => {
    lyhost = new LyhostFlow(page);
    // Given — opens Lyhost landing and navigates to guest area
    await lyhost.openHome();
    await lyhost.openGuestArea();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Guest login succeeds
  // Given  guest opens guest area
  // When   guest signs in with valid credentials
  // Then   booking page is visible with correct user info
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: guest login succeeds', async ({ page }) => {
    // When
    await lyhost.signInAsGuest({
      email: 'prueba123@prueba.com',
      password: 'SecurePass123!',
    });

    // Then
    await expect(page.locator('booking-nav')).toMatchAriaSnapshot(`
      - text: prueba123 prueba123@prueba.com
    `);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Encuentra tu habitación');
  });
});
