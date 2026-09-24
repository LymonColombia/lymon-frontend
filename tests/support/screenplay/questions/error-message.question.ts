import { Locator } from '@playwright/test';
import { ActorQuestion } from '../actors/guest.actor';

export const errorMessageFrom =
  (selector: string): ActorQuestion<Locator> =>
  async (actor) =>
    actor.browse.page.locator(selector);
