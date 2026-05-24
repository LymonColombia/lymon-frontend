import { CypressQuestion } from '../actors/guest.actor';

export const errorMessageFrom =
  (selector: string): CypressQuestion<Cypress.Chainable<JQuery<HTMLElement>>> =>
  () =>
    cy.get(selector);
