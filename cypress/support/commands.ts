import {
  apiLogin,
  apiCreateProperty,
  apiDeleteProperty,
  apiCreateUnit,
  apiDeleteUnit,
} from './api/lyhost-api-client';

declare global {
  namespace Cypress {
    interface Chainable {
      injectManagerSession(): Chainable<void>;
      apiLogin(email: string, password: string): Chainable<void>;
      apiCreateProperty(data: Record<string, unknown>): Chainable<unknown>;
      apiDeleteProperty(identifier: string): Chainable<void>;
      apiCreateUnit(data: Record<string, unknown>): Chainable<unknown>;
      apiDeleteUnit(unitId: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('injectManagerSession', () => {
  cy.env(['MANAGER_EMAIL', 'MANAGER_PASSWORD']).then((envs) => {
    cy.session(
      'manager',
      () => {
        cy.visit('/');
        apiLogin(envs['MANAGER_EMAIL'] as string, envs['MANAGER_PASSWORD'] as string);
      },
      {
        validate() {
          cy.window().its('localStorage').invoke('getItem', 'lymon_access_token').should('exist');
        },
      },
    );
  });
});

Cypress.Commands.add('apiLogin', (email: string, password: string) => {
  apiLogin(email, password);
});

Cypress.Commands.add('apiCreateProperty', (data: Record<string, unknown>) => {
  apiCreateProperty(data);
});

Cypress.Commands.add('apiDeleteProperty', (identifier: string) => {
  apiDeleteProperty(identifier);
});

Cypress.Commands.add('apiCreateUnit', (data: Record<string, unknown>) => {
  apiCreateUnit(data);
});

Cypress.Commands.add('apiDeleteUnit', (unitId: string) => {
  apiDeleteUnit(unitId);
});
