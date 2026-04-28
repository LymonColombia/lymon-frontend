import { ActorTask, GuestActor } from '../../actors/guest.actor';

/** Expand the sidebar and navigate to the Audit Log page */
export const openAuditLogPage = (): ActorTask => async (actor: GuestActor) => {
  const page = actor.browse.page;
  await page.getByRole('button', { name: 'Expandir menú lateral' }).click();
  await page.getByRole('link', { name: 'Registros de Auditoría' }).click();
};
