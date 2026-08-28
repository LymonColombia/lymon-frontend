/**
 * Feature: Unit Creation
 *
 * Gherkin Source: tests/features/properties/create-unit.feature
 *
 * Pre-condition : Manager is already authenticated (session injected via cy.injectManagerSession).
 *                 A property is created via API in beforeEach.
 * Post-condition: Created property (and its units) deleted in afterEach.
 */

import { ManagerFlow } from '../../support/screenplay/manager-flow';

// ─── Test data ────────────────────────────────────────────────────────────────

const PROPERTY_DATA = {
  name: 'Hotel for Units E2E',
  propertyType: 'HOTEL',
  description: 'Property created for unit testing',
  address: 'Calle 123 #67 - 79',
  city: 'Medellin',
  state: 'Antioquia',
  country: 'Colombia',
  zipCode: '05001',
  location: { lat: 6.2442, lng: -75.5812 },
  checkInTime: '09:00',
  checkOutTime: '22:00',
  cancellationPolicy: 'FLEXIBLE',
  hostPhone: '+57 3006007000',
  hostEmail: 'host@unit-test.com',
};

const UNIT = {
  name: 'Unidad Viltrum E2E',
  pricePerNight: '800000',
  description: 'La unidad viltrum',
  roomName: 'Master Viltrum',
  amenities: [
    'WiFi',
    'Calefacción',
    'Aire Acondicionado',
    'Caja Fuerte',
    'TV',
    'Escritorio',
    'Mini Bar',
    'Secador de Pelo',
    'Cafetera',
    'Baño Privado',
    'Plancha',
    'Cocina',
    'Bañera',
    'Balcón',
    'Vista al Mar',
  ],
} as const;

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Feature: Unit Creation', () => {
  let manager: ManagerFlow;

  beforeEach(() => {
    cy.injectManagerSession();
    manager = new ManagerFlow();

    // 1. Setup: Clean old runs then create property via API
    cy.apiDeleteProperty(PROPERTY_DATA.name);
    cy.apiCreateProperty(PROPERTY_DATA);

    // 2. Navigate
    cy.visit('/admin/properties');
    cy.wait(5000); // UI settle
  });

  afterEach(() => {
    cy.apiDeleteProperty(PROPERTY_DATA.name);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager creates a unit from the properties page
  // Given  the manager is logged into LyHost
  // When   the manager opens the property units page
  // And    the manager creates the new unit
  // Then   the unit appears in the property units list
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario: manager creates a unit from the properties page', () => {
    // When
    manager.openPropertyUnits(PROPERTY_DATA.name);
    manager.createUnit(UNIT);

    // Then
    cy.get('h3').should('contain.text', UNIT.name);
    cy.contains(UNIT.name).should('be.visible');
  });
});
