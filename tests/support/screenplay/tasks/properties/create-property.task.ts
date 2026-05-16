import { ActorTask } from '../../actors/guest.actor';
import { Actor } from '../../actors/actor';

export interface CreatePropertyData {
  name: string;
  type: 'HOTEL' | 'HOSTAL' | 'APARTAMENTO' | string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: 'FLEXIBLE' | 'STANDARD' | 'STRICT' | string;
  phone: string;
  email: string;
}

/** Navigate to /properties via the sidebar link */
export const openPropertiesPage = (): ActorTask => async (actor: Actor) => {
  await actor.browse.page.getByRole('link', { name: 'Propiedades y Unidades' }).click();
};

/**
 * Open the "Nueva Propiedad" creation dialog.
 * Handles both the empty-state ("Crear primera propiedad") and the normal
 * ("Nueva Propiedad") button.
 */
export const openCreatePropertyForm = (): ActorTask => async (actor: Actor) => {
  const page = actor.browse.page;

  // 1. Wait for properties to load (either list or empty state)
  // We wait for the spinner/skeleton to disappear or a static timeout to let the API settle
  await page.waitForTimeout(5000);

  // Use .first() to avoid strict mode violation with app-button wrapper
  const firstPropertyButton = page.getByRole('button', { name: 'Crear primera propiedad' }).first();

  if (await firstPropertyButton.isVisible().catch(() => false)) {
    await firstPropertyButton.click();
  } else {
    await page
      .getByRole('button', { name: /Nueva Propiedad/i })
      .first()
      .click();
  }
};

/** Fill and submit the property creation form */
export const fillPropertyForm =
  (data: CreatePropertyData): ActorTask =>
  async (actor: Actor) => {
    const page = actor.browse.page;

    await page.getByRole('textbox', { name: 'Hotel Paraíso' }).fill(data.name);

    await page.getByRole('button', { name: 'Select an option' }).first().click();
    await page.getByRole('option', { name: data.type }).click();

    await page.getByRole('textbox', { name: 'Describe tu propiedad...' }).fill(data.description);
    await page.getByRole('textbox', { name: 'Calle 123 #45-' }).fill(data.address);
    await page.getByRole('textbox', { name: 'Bogotá' }).fill(data.city);
    await page.getByRole('textbox', { name: 'Bogotá' }).press('Tab');
    await page.getByRole('textbox', { name: 'Cundinamarca' }).fill(data.state);
    await page.getByRole('textbox', { name: 'Cundinamarca' }).press('Tab');
    await page.getByRole('textbox', { name: 'Colombia' }).fill(data.country);
    await page.getByRole('textbox', { name: 'Colombia' }).press('Tab');
    await page.getByRole('textbox', { name: '110111' }).fill(data.postalCode);
    await page.getByRole('textbox', { name: '110111' }).press('Tab');
    await page.getByPlaceholder('4.7110').nth(1).fill(data.latitude);
    await page.getByPlaceholder('4.7110').nth(1).press('Tab');
    await page.getByPlaceholder('-').nth(3).fill(data.longitude);

    await page.locator('input[type="time"]').first().fill(data.checkInTime);
    await page.locator('input[type="time"]').first().press('Tab');
    await page.locator('input[type="time"]').nth(1).fill(data.checkOutTime);

    await page.getByRole('button', { name: 'Select an option' }).click();
    await page.getByRole('option', { name: data.cancellationPolicy }).click();
    await page.getByRole('button', { name: data.cancellationPolicy }).click();
    await page.getByRole('option', { name: 'STANDARD' }).click();

    await page.getByRole('textbox', { name: '+57 300 000' }).fill(data.phone);
    await page.getByRole('textbox', { name: 'host@hotel.com' }).fill(data.email);
  };

/** Submit the "Crear Propiedad" button */
export const submitPropertyForm = (): ActorTask => async (actor: Actor) => {
  await actor.browse.page.locator('button').filter({ hasText: 'Crear Propiedad' }).click();
};

/** Delete a property by exact name from the /properties page */
export const deletePropertyByName =
  (propertyName: string): ActorTask =>
  async (actor: Actor) => {
    const page = actor.browse.page;
    await page.goto('/properties');

    const card = page.getByRole('article').filter({ hasText: propertyName });

    // Only attempt deletion if the card is actually present.
    if (!(await card.isVisible().catch(() => false))) return;

    await card.getByRole('button', { name: /eliminar|delete/i }).click();

    // Confirm deletion dialog if present.
    const confirmButton = page.getByRole('button', { name: /confirmar|confirm|sí|yes/i });
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }
  };
