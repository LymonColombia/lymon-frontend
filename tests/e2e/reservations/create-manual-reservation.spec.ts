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
// Document numbers must match the wizard's ID_NUMBER_PATTERN: ^[A-Za-z0-9-]{5,15}$
const RUN_ID = String(UNIQUE_ID).slice(-9);
const NEW_GUEST_ID = `E2E${RUN_ID}1`;
const VALIDATION_ID = `E2E${RUN_ID}2`;
const RESERVATION_ID = `E2E${RUN_ID}3`;
const EXISTING_GUEST_ID = `E2E${RUN_ID}4`;

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

    await page.route(/\/guests(?:\?|$)/, async (route) => {
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

    // When entering an identification number that is not registered (Step 1 -> Step 2)
    await manager.lookupNewGuest(NEW_GUEST_ID);
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
    expect(capturedRequestBody!.identity).toEqual({ documentNumber: NEW_GUEST_ID });

    // And the guest is shown in the summary and labeled as "Nuevo"
    const guestSummary = wizard.locator('.guest-summary');
    await expect(guestSummary).toContainText(NEW_GUEST.fullName);
    await expect(guestSummary.locator('.guest-summary-badge')).toHaveText('Nuevo');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Guest registration requires full name and email
  // Guided by: create-reservation-wizard.spec.ts (registerAndNext validation)
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: guest registration requires full name and primary email to advance', async ({ page }) => {
    await manager.openCreateReservationWizard();
    await manager.lookupNewGuest(VALIDATION_ID);

    const nextButton = page.locator('.wizard-container').getByRole('button', { name: 'Siguiente' });

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
    // Stub POST /reservations so parallel browser projects cannot collide on the
    // single shared unit (409 Conflict). Guest creation and lookup remain real.
    let reservationRequestBody: Record<string, unknown> | null = null;
    await page.route(/\/reservations(?:\?|$)/, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      reservationRequestBody = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Reservation created successfully',
          data: { id: `reservation-e2e-${UNIQUE_ID}` },
        }),
      });
    });

    await manager.openCreateReservationWizard();
    await manager.lookupNewGuest(RESERVATION_ID);
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

    // The request carries the guest created in step 2 and the selected stay details.
    expect(reservationRequestBody).not.toBeNull();
    expect(reservationRequestBody).toMatchObject({
      guestsCount: 2,
      source: 'MANUAL',
      notes: 'Reserva manual de prueba E2E',
    });
    expect(reservationRequestBody!.guestId).toBeTruthy();
    expect(reservationRequestBody!.propertyId).toBeTruthy();
    expect(reservationRequestBody!.unitId).toBeTruthy();
    expect(reservationRequestBody!.checkIn).toBeTruthy();
    expect(reservationRequestBody!.checkOut).toBeTruthy();

    // The reservation list displays the management table
    await expect(page.getByRole('heading', { name: 'Reservaciones', level: 2 })).toBeVisible();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager creates a manual reservation for an already registered guest
  // Guided by: create-reservation-wizard.spec.ts (skipping step 2 directly to step 3)
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: manager creates a manual reservation for an already registered guest', async ({
    page,
    apiClient,
  }) => {
    // Seed an already registered guest with a known document number (Clean Slate).
    const existingGuestName = `Huésped Recurrente ${UNIQUE_ID}`;
    await apiClient.createGuest({
      fullName: existingGuestName,
      primaryEmail: `recurrente.${UNIQUE_ID}@example.com`,
      identity: { documentNumber: EXISTING_GUEST_ID },
    });

    await manager.openCreateReservationWizard();

    // In Step 1: look up the registered document number -> skips Step 2 straight to Step 3
    await manager.lookupExistingGuest(EXISTING_GUEST_ID);

    const wizard = page.locator('.wizard-container');
    await expect(wizard.getByRole('heading', { name: 'Detalles de la Reserva' })).toBeVisible();

    // The guest summary is populated and labeled as "Registrado"
    const guestSummary = wizard.locator('.guest-summary');
    await expect(guestSummary).toContainText(existingGuestName);
    await expect(guestSummary.locator('.guest-summary-badge')).toHaveText('Registrado');

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
