/**
 * Feature: Property Creation
 *
 * Gherkin Source: tests/features/properties/create-property.feature
 *
 * Pre-condition : Manager is already authenticated (session injected via cy.injectManagerSession).
 * Post-condition: Created property is deleted in afterEach to restore a clean environment.
 */

import { ManagerFlow } from '../../support/screenplay/manager-flow';

// ─── Test data ────────────────────────────────────────────────────────────────

const PROPERTY = {
  name: 'Hotel Viltrum E2E',
  type: 'HOTEL',
  description: 'La mejor experiencia de tu vida',
  address: 'Calle 123 #67 - 79',
  city: 'Medellin',
  state: 'Medellin',
  country: 'Colombia',
  postalCode: '670076',
  latitude: '4.3',
  longitude: '74',
  checkInTime: '09:00',
  checkOutTime: '22:00',
  cancellationPolicy: 'FLEXIBLE',
  phone: '+57 3006007000',
  email: 'host@viltrum.com',
} as const;

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Feature: Property Creation', () => {
  let manager: ManagerFlow;

  beforeEach(() => {
    cy.injectManagerSession();
    manager = new ManagerFlow();
    cy.visit('/properties');
  });

  afterEach(() => {
    cy.apiDeleteProperty(PROPERTY.name);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager creates a new property
  // Given  the manager is on the Properties page
  // When   the manager fills and submits the property creation form
  // Then   the new property appears in the property list
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario: manager creates a new property', () => {
    // When
    manager.createProperty(PROPERTY);

    // Then
    cy.get('app-hotel-page-layout').should('contain.text', PROPERTY.name);
    cy.get('article').filter(`:contains("${PROPERTY.name}")`).first().should('be.visible');
    cy.contains('h1', 'Mis Propiedades').should('be.visible');
  });
});
