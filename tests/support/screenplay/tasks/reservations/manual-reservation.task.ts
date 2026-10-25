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
  await page.locator('button').filter({ hasText: 'Crear Reserva' }).first().click();
  await page.locator('.wizard-container').waitFor({ state: 'visible' });
};

/** In Step 1: select "No, registrar nuevo" to enter manual guest registration */
export const chooseNewGuestRegistration = (): ActorTask => async (actor: Actor) => {
  const page = actor.browse.page;
  await page.locator('button').filter({ hasText: 'No, registrar nuevo' }).click();
  await page.locator('#fullName').waitFor({ state: 'visible' });
};

/** In Step 1: select "Sí, ya está registrado" to skip to reservation details */
export const chooseExistingGuest = (): ActorTask => async (actor: Actor) => {
  const page = actor.browse.page;
  await page.locator('button').filter({ hasText: 'Sí, ya está registrado' }).click();
  await page.locator('#guestSelect').waitFor({ state: 'visible' });
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
  await page.locator('button').filter({ hasText: 'Siguiente' }).click();
};

/** In Step 3: fill reservation property, unit, count, and notes */
export const fillReservationDetails =
  (data: { propertyName?: string; unitName?: string; guestsCount?: number; notes?: string }): ActorTask =>
  async (actor: Actor) => {
    const page = actor.browse.page;

    if (data.propertyName) {
      await page.locator('#propertySelect').selectOption({ label: data.propertyName });
    } else {
      // Select the first available non-disabled property option if present
      const propertySelect = page.locator('#propertySelect');
      const count = await propertySelect.locator('option').count();
      if (count > 1) {
        await propertySelect.selectOption({ index: 1 });
      }
    }

    if (data.unitName) {
      await page.locator('#unitSelect').selectOption({ label: data.unitName });
    } else {
      // Select the first available unit option once loaded
      const unitSelect = page.locator('#unitSelect');
      await page.waitForTimeout(1000);
      const count = await unitSelect.locator('option').count();
      if (count > 1) {
        await unitSelect.selectOption({ index: 1 });
      }
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

  // Open check-in picker
  await page.locator('#checkIn').click();
  const checkInDays = page.locator('.sdp-dropdown .sdp-day:not([disabled])');
  if (await checkInDays.count()) {
    await checkInDays.first().click();
  }

  // Open check-out picker
  await page.locator('#checkOut').click();
  const checkOutDays = page.locator('.sdp-dropdown .sdp-day:not([disabled])');
  if (await checkOutDays.count()) {
    const total = await checkOutDays.count();
    // Select a day towards the end of the available dates
    await checkOutDays.nth(Math.min(2, total - 1)).click();
  }
};

/** In Step 3: submit the reservation */
export const submitReservationForm = (): ActorTask => async (actor: Actor) => {
  const page = actor.browse.page;
  await page.locator('button').filter({ hasText: 'Confirmar Reserva' }).click();
};

/** Close the wizard modal */
export const closeReservationWizard = (): ActorTask => async (actor: Actor) => {
  const page = actor.browse.page;
  const closeBtn = page.locator('.close-btn');
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click();
  }
};
