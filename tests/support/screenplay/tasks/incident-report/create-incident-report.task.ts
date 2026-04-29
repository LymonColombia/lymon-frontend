import { ActorTask } from '../../actors/guest.actor';
import { Actor } from '../../actors/actor';

export interface CreateIncidentReportData {
  title: string;
  description: string;
}

/** Navigate to the incident-report list page */
export const openIncidentReportPage = (): ActorTask => async (actor: Actor) => {
  await actor.browse.page.goto('/incident-report/list');
};

/** Open the "Nueva Novedad" creation form */
export const openCreateIncidentReportForm = (): ActorTask => async (actor: Actor) => {
  await actor.browse.page.locator('button').filter({ hasText: 'Nueva Novedad' }).click();
};

/** Fill the incident report title and description */
export const fillIncidentReportForm =
  (data: CreateIncidentReportData): ActorTask =>
  async (actor: Actor) => {
    const page = actor.browse.page;
    await page.getByRole('textbox', { name: 'Título *' }).fill(data.title);
    await page.getByRole('textbox', { name: 'Descripción *' }).fill(data.description);
  };

/** Submit the "Registrar Novedad" button */
export const submitIncidentReportForm = (): ActorTask => async (actor: Actor) => {
  await actor.browse.page.locator('button').filter({ hasText: 'Registrar Novedad' }).click();
};

/**
 * Delete an incident report by title from the list page.
 * Silently skips if not found (idempotent cleanup).
 */
export const deleteIncidentReportByTitle =
  (title: string): ActorTask =>
  async (actor: Actor) => {
    const page = actor.browse.page;
    await page.goto('/incident-report/list');

    const row = page.locator('tr, li, article').filter({ hasText: title });
    if (!(await row.isVisible().catch(() => false))) return;

    await row.getByRole('button', { name: /eliminar|delete/i }).click();

    const confirmButton = page.getByRole('button', { name: /confirmar|confirm|sí|yes/i });
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }
  };
