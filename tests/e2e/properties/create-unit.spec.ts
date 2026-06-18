/**
 * Feature: Unit Creation
 *
 * Gherkin Source: tests/features/properties/create-unit.feature
 *
 * Pre-condition : Manager is already authenticated (storageState injected by Playwright setup).
 *                 The property "Hotel Viltrum" already exists in the system.
 * Post-condition: Created unit is deleted in afterEach to restore a clean environment.
 */

import { test, expect } from '../../fixtures/api.fixture';
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
  location: {
    lat: 6.2442,
    lng: -75.5812,
  },
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

test.describe('Feature: Unit Creation', () => {
  let manager: ManagerFlow;

  test.beforeEach(async ({ page, apiClient }) => {
    manager = new ManagerFlow(page);

    // 1. Setup: Create property via API
    await apiClient.deleteProperty(PROPERTY_DATA.name); // Clean old runs
    await apiClient.createProperty(PROPERTY_DATA);

    // 2. Navigate
    await page.goto('/properties');
    await page.waitForTimeout(5000); // UI settle
  });

  test.afterEach(async ({ apiClient }) => {
    // Teardown: Property + Units via API (Clean Slate)
    await apiClient.deleteProperty(PROPERTY_DATA.name);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager creates a unit from the properties page
  // Given  the manager is logged into LyHost
  // When   the manager opens the property units page
  // And    the manager creates the new unit
  // Then   the unit appears in the property units list
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: manager creates a unit from the properties page', async ({ page }) => {
    // When
    await manager.openPropertyUnits(PROPERTY_DATA.name);
    await manager.createUnit(UNIT);

    // Then
    const title = await manager.page.locator('h3').textContent();
    expect(title?.trim() ?? '').toContain(UNIT.name);

    expect(await page.getByText(`${UNIT.name}`).isVisible()).toBeTruthy();
  });
});
