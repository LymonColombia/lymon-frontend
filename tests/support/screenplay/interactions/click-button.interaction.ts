import { Actor } from '../actors/actor';

export const clickButtonLabeled =
  (label: string | RegExp) =>
  async (actor: Actor): Promise<void> => {
    await actor.browse.page.getByRole('button', { name: label }).click();
  };

export const clickLinkLabeled =
  (label: string | RegExp) =>
  async (actor: Actor): Promise<void> => {
    await actor.browse.page.getByRole('link', { name: label }).click();
  };
