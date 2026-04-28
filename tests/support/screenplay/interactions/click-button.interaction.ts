import { GuestActor } from '../actors/guest.actor';

export const clickButtonLabeled =
  (label: string | RegExp) =>
  async (actor: GuestActor): Promise<void> => {
    await actor.browse.page.getByRole('button', { name: label }).click();
  };

export const clickLinkLabeled =
  (label: string | RegExp) =>
  async (actor: GuestActor): Promise<void> => {
    await actor.browse.page.getByRole('link', { name: label }).click();
  };
