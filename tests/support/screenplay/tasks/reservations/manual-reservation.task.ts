import { ActorTask } from '../../actors/guest.actor';
import { Actor } from '../../actors/actor';

export interface NewGuestData {
  fullName: string;
  primaryEmail: string;
}

export interface ManualReservationData {
  guest?: NewGuestData;
  existingGuestName?: string;
  propertyName?: string;
  unitName?: string;
  guestsCount?: number;
  notes?: string;
}

/** Navigate to /admin/reservations */
export const openReservationsPage = (): ActorTask => async (actor: Actor) => {
  await actor.browse.page.goto('/admin/reservations');
};

/** Open the "Crear Reserva" wizard dialog */
export const openCreateReservationWizard = (): ActorTask => async (actor: Actor) => {
  const page = actor.browse.page;
  await page.getByRole('button', { name: 'Crear Reserva' }).first().click();
  await page.locator('.wizard-container').waitFor({ state: 'visible' });
};

/**
 * In Step 1: look up an unregistered identification number.
 * The wizard advances to Step 2 (manual guest registration).
 */
export const lookupNewGuest =
  (idNumber: string): ActorTask =>
  async (actor: Actor) => {
    const page = actor.browse.page;
    const wizard = page.locator('.wizard-container');
    await page.locator('#idNumber').fill(idNumber);
    await wizard.getByRole('button', { name: 'Buscar' }).click();
    await page.locator('#fullName').waitFor({ state: 'visible' });
  };

/**
 * In Step 1: look up an already registered identification number.
 * The wizard skips Step 2 and goes straight to Step 3 (reservation details).
 */
export const lookupExistingGuest =
  (idNumber: string): ActorTask =>
  async (actor: Actor) => {
    const page = actor.browse.page;
    const wizard = page.locator('.wizard-container');
    await page.locator('#idNumber').fill(idNumber);
    await wizard.getByRole('button', { name: 'Buscar' }).click();
    await page.locator('#propertySelect').waitFor({ state: 'visible' });
  };

/** In Step 2: fill the new guest information form */
export const fillNewGuestForm =
  (data: NewGuestData): ActorTask =>
  async (actor: Actor) => {
    const page = actor.browse.page;
    await page.locator('#fullName').fill(data.fullName);
    await page.locator('#primaryEmail').fill(data.primaryEmail);
  };

/** In Step 2: submit guest registration and advance to step 3 */
export const submitNewGuestForm = (): ActorTask => async (actor: Actor) => {
  const page = actor.browse.page;
  await page.locator('.wizard-container').getByRole('button', { name: 'Siguiente' }).click();
  await page.locator('#propertySelect').waitFor({ state: 'visible' });
};

/** In Step 3: fill reservation property, unit, count, and notes */
export const fillReservationDetails =
  (data: { propertyName?: string; unitName?: string; guestsCount?: number; notes?: string }): ActorTask =>
  async (actor: Actor) => {
    const page = actor.browse.page;

    const propertySelect = page.locator('#propertySelect');
    if (data.propertyName) {
      await propertySelect.selectOption({ label: data.propertyName });
    } else {
      // Wait for the async property list, then pick the first real option.
      await propertySelect.locator('option').nth(1).waitFor({ state: 'attached' });
      await propertySelect.selectOption({ index: 1 });
    }

    const unitSelect = page.locator('#unitSelect');
    if (data.unitName) {
      await unitSelect.selectOption({ label: data.unitName });
    } else {
      // Units are loaded after a property is chosen.
      await unitSelect.locator('option').nth(1).waitFor({ state: 'attached' });
      await unitSelect.selectOption({ index: 1 });
    }

    if (data.guestsCount) {
      await page.locator('#guestsCount').fill(String(data.guestsCount));
    }

    if (data.notes) {
      await page.locator('#notes').fill(data.notes);
    }
  };

/** Pick check-in and check-out dates using the shift date picker */
export const selectReservationDates = (): ActorTask => async (actor: Actor) => {
  const page = actor.browse.page;

  // The `id` lives on the <app-shift-date-picker> host; click its trigger button.
  await page.locator('#checkIn .sdp-trigger').click();
  const checkInDays = page.locator('.sdp-dropdown .sdp-day:not([disabled])');
  await checkInDays.first().waitFor({ state: 'visible' });
  await checkInDays.first().click();

  // Open check-out picker
  await page.locator('#checkOut .sdp-trigger').click();
  const checkOutDays = page.locator('.sdp-dropdown .sdp-day:not([disabled])');
  await checkOutDays.first().waitFor({ state: 'visible' });
  const total = await checkOutDays.count();
  // Select a day after check-in (the first enabled day is check-in itself).
  await checkOutDays.nth(Math.min(2, total - 1)).click();
};

/** In Step 3: submit the reservation */
export const submitReservationForm = (): ActorTask => async (actor: Actor) => {
  const page = actor.browse.page;
  await page.locator('.wizard-container').getByRole('button', { name: 'Confirmar Reserva' }).click();
};

/** Close the wizard modal */
export const closeReservationWizard = (): ActorTask => async (actor: Actor) => {
  const page = actor.browse.page;
  const closeBtn = page.locator('.close-btn');
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click();
  }
};
