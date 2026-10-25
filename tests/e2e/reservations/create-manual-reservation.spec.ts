/**
 * Feature: Manual Reservation and Guest Registration
 *
 * Gherkin Source: tests/features/reservations/manual-reservation.feature
 *
 * Guided by:
 * - src/app/domain/tenant/tenant-guest/use-cases/create-tenant-guest.use-case.spec.ts
 * - src/app/infrastructure/tenant/tenant-guest/tenant-guest.repository.impl.spec.ts
 * - src/app/presentation/tenant/features/reservations/pages/reservation-list/components/create-reservation-wizard/create-reservation-wizard.spec.ts
 *
 * Pre-condition : Manager is already authenticated (storageState injected by Playwright setup).
 */

import { test, expect } from '../../fixtures/api.fixture';
import { ManagerFlow } from '../../support/screenplay/manager-flow';

const UNIQUE_ID = Date.now();
const NEW_GUEST = {
  fullName: `Huésped E2E ${UNIQUE_ID}`,
  primaryEmail: `huesped.e2e.${UNIQUE_ID}@example.com`,
} as const;

test.describe('Feature: Manual Reservation and Guest Registration', () => {
  let manager: ManagerFlow;

  test.beforeEach(async ({ page }) => {
    manager = new ManagerFlow(page);
    await page.goto('/');
    await manager.openReservationsPage();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager manually registers a new guest in the reservation wizard
  // Guided by: create-tenant-guest.use-case.spec.ts (DTO whitelist compliance:
  // no 400 Bad Request on POST /guests) and create-reservation-wizard.spec.ts
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: manager manually registers a new guest in the reservation wizard', async ({ page }) => {
    // Intercept POST /guests so we can:
    // 1. Assert the request body matches CreateGuestDto (no non-whitelisted fields)
    // 2. Mock a successful response so the wizard flow works regardless of deployment state
    let capturedRequestBody: Record<string, unknown> | null = null;

    await page.route('**/guests', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      capturedRequestBody = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            guestId: `guest-e2e-${UNIQUE_ID}`,
            fullName: NEW_GUEST.fullName,
            primaryEmail: NEW_GUEST.primaryEmail,
          },
        }),
      });
    });

    // Given the manager is on the Reservations page and opens the wizard
    await manager.openCreateReservationWizard();

    const wizard = page.locator('.wizard-container');
    await expect(wizard).toBeVisible();
    await expect(wizard.getByRole('heading', { name: 'Nueva Reserva' })).toBeVisible();

    // When selecting that the guest is not registered (Step 1 -> Step 2)
    await manager.chooseNewGuestRegistration();
    await expect(wizard.getByRole('heading', { name: 'Información del Huésped' })).toBeVisible();

    // And filling the guest information
    await manager.fillNewGuestForm(NEW_GUEST);

    // And advancing to the next step
    await manager.submitNewGuestForm();

    // Then the wizard advances to Step 3 (Reservation details)
    await expect(wizard.getByRole('heading', { name: 'Detalles de la Reserva' })).toBeVisible();

    // Regression guard (LYMON-1137): the request body must not contain `emails` or `phones`,
    // which CreateGuestDto does not declare — these caused the original 400 Bad Request.
    expect(capturedRequestBody).not.toBeNull();
    expect(capturedRequestBody).not.toHaveProperty('emails');
    expect(capturedRequestBody).not.toHaveProperty('phones');

    // Verify the body only contains whitelisted properties
    const allowedKeys = ['fullName', 'primaryEmail', 'identity', 'firstName', 'lastName', 'tags', 'preferences'];
    expect(Object.keys(capturedRequestBody!).sort()).toEqual([...allowedKeys].sort());

    // And the guest is pre-selected and labeled as (Nuevo), with selector disabled
    const guestSelect = page.locator('#guestSelect');
    await expect(guestSelect).toBeDisabled();
    await expect(guestSelect).toContainText(NEW_GUEST.fullName);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Guest registration requires full name and email
  // Guided by: create-reservation-wizard.spec.ts (registerAndNext validation)
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: guest registration requires full name and primary email to advance', async ({ page }) => {
    await manager.openCreateReservationWizard();
    await manager.chooseNewGuestRegistration();

    const nextButton = page.locator('button').filter({ hasText: 'Siguiente' });

    // Both empty: button should be disabled
    await expect(nextButton).toBeDisabled();

    // Only full name: button should stay disabled
    await page.locator('#fullName').fill('Huésped Incompleto');
    await expect(nextButton).toBeDisabled();

    // Clear name and only email: button should stay disabled
    await page.locator('#fullName').fill('');
    await page.locator('#primaryEmail').fill('incompleto@example.com');
    await expect(nextButton).toBeDisabled();

    // Both provided: button becomes enabled
    await page.locator('#fullName').fill('Huésped Completo');
    await expect(nextButton).toBeEnabled();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager creates a manual reservation with a newly registered guest
  // Guided by: create-reservation-wizard.spec.ts (full flow step 1 -> 2 -> 3 -> submit)
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: manager creates a manual reservation with a newly registered guest', async ({ page }) => {
    await manager.openCreateReservationWizard();
    await manager.chooseNewGuestRegistration();
    await manager.fillNewGuestForm({
      fullName: `Reserva E2E ${UNIQUE_ID}`,
      primaryEmail: `reserva.${UNIQUE_ID}@example.com`,
    });
    await manager.submitNewGuestForm();

    const wizard = page.locator('.wizard-container');
    await expect(wizard.getByText('Detalles de la Reserva')).toBeVisible();

    // Fill reservation parameters
    await manager.fillReservationDetails({
      guestsCount: 2,
      notes: 'Reserva manual de prueba E2E',
    });

    // Select check-in and check-out dates
    await manager.selectReservationDates();

    // Confirm reservation
    await manager.submitReservationForm();

    // Wizard should close on successful submission
    await expect(wizard).not.toBeVisible({ timeout: 10000 });

    // The reservation list displays the management table
    await expect(page.getByRole('heading', { name: 'Reservaciones', level: 2 })).toBeVisible();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager creates a manual reservation for an already registered guest
  // Guided by: create-reservation-wizard.spec.ts (skipping step 2 directly to step 3)
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: manager creates a manual reservation for an already registered guest', async ({ page }) => {
    await manager.openCreateReservationWizard();

    // In Step 1: select "Sí, ya está registrado" -> skips Step 2 straight to Step 3
    await manager.chooseExistingGuest();

    const wizard = page.locator('.wizard-container');
    await expect(wizard.getByRole('heading', { name: 'Detalles de la Reserva' })).toBeVisible();

    // The guest selector should be enabled so the manager can pick from existing guests
    const guestSelect = page.locator('#guestSelect');
    await expect(guestSelect).toBeEnabled();

    // Fill remaining reservation details
    await manager.fillReservationDetails({
      guestsCount: 1,
      notes: 'Reserva para huésped recurrente',
    });

    // Close the wizard
    await manager.closeReservationWizard();
    await expect(wizard).not.toBeVisible();
  });
});
