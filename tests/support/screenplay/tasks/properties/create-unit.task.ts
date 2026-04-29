import { ActorTask } from '../../actors/guest.actor';
import { Actor } from '../../actors/actor';

export interface CreateUnitData {
  name: string;
  pricePerNight: string;
  description: string;
  roomName: string;
  amenities: readonly string[];
}

export const openPropertiesPage = (): ActorTask => async (actor: Actor) => {
  await actor.browse.page.getByRole('link', { name: 'Propiedades y Unidades' }).click();
};

export const openPropertyUnits =
  (propertyLocatorText: string): ActorTask =>
  async (actor: Actor) => {
    await actor.browse.page
      .getByRole('article')
      .filter({ hasText: propertyLocatorText })
      .locator('button')
      .click();
    await actor.browse.page
      .locator('app-button')
      .filter({ hasText: 'Crear primera unidad' })
      .click();
  };

export const createUnit =
  (data: CreateUnitData): ActorTask =>
  async (actor: Actor) => {
    const page = actor.browse.page;

    await page.getByRole('textbox', { name: 'Deluxe Ocean View Suite' }).click();
    await page.getByRole('textbox', { name: 'Deluxe Ocean View Suite' }).fill(data.name);
    await page.getByPlaceholder('150').nth(1).click();
    await page.getByPlaceholder('150').nth(1).fill(data.pricePerNight);
    await page.getByRole('textbox', { name: 'Spacious suite with private' }).click();
    await page.getByRole('textbox', { name: 'Spacious suite with private' }).fill(data.description);
    await page.getByRole('textbox', { name: 'Master Bedroom' }).click();
    await page.getByRole('textbox', { name: 'Master Bedroom' }).fill(data.roomName);
    await page.getByRole('button', { name: 'Select an option' }).click();
    await page.getByRole('option', { name: 'KING' }).click();

    for (const amenity of data.amenities) {
      await page.getByRole('button', { name: amenity }).click();
    }

    await page.locator('button').filter({ hasText: 'Crear Unidad' }).click();
  };

/**
 * Delete a unit by its name from the currently-open property units page.
 * Silently skips if the unit is no longer present (idempotent cleanup).
 */
export const deleteUnitByName =
  (unitName: string): ActorTask =>
  async (actor: Actor) => {
    const page = actor.browse.page;

    const card = page.getByRole('article').filter({ hasText: unitName });
    if (!(await card.isVisible().catch(() => false))) return;

    await card.getByRole('button', { name: /eliminar|delete/i }).click();

    const confirmButton = page.getByRole('button', { name: /confirmar|confirm|sí|yes/i });
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }
  };
