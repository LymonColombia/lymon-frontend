import { Locator } from '@playwright/test';
import { ActorQuestion } from '../actors/guest.actor';

/** Returns the locator for the main page layout so assertions can be chained on it. */
export const propertyPageLayout = (): ActorQuestion<Locator> => async (actor) =>
  actor.browse.page.locator('app-hotel-page-layout');

/** Returns a locator for an article card matching the given property name. */
export const propertyCard =
  (propertyName: string): ActorQuestion<Locator> =>
  async (actor) =>
    actor.browse.page.getByRole('article').filter({ hasText: propertyName });
