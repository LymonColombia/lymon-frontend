import { CypressTask } from '../actors/actor';

export const clickButtonLabeled =
  (label: string | RegExp): CypressTask =>
  () => {
    cy.contains('button, [role="button"]', label).click();
  };

export const clickLinkLabeled =
  (label: string | RegExp): CypressTask =>
  () => {
    cy.contains('a', label).click();
  };
