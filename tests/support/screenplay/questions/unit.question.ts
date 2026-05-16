import { ActorQuestion } from '../actors/guest.actor';

/** Returns the text content of the unit title (h3) */
export const unitTitle = (): ActorQuestion<string> => async (actor) => {
  const title = await actor.browse.page.locator('h3').textContent();
  return title?.trim() ?? '';
};

/** Returns whether a specific unit name is visible in the list */
export const unitIsVisible =
  (unitName: string): ActorQuestion<boolean> =>
  async (actor) => {
    return actor.browse.page.getByText(unitName).isVisible();
  };
