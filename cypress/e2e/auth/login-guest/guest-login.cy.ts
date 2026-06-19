/**
 * Feature: Guest Login
 *
 * Gherkin Source: tests/features/auth/login.feature (guest section)
 *
 * These tests exercise the guest login UI — intentionally unauthenticated.
 */

import { GuestFlow } from '../../../support/screenplay/guest-flow';

describe('Feature: Guest Login', () => {
  let guest: GuestFlow;

  beforeEach(() => {
    cy.clearLocalStorage();
    guest = new GuestFlow();
    // Given — opens Lyhost landing and navigates to guest area
    guest.openHome();
    guest.openGuestArea();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Guest login succeeds
  // Given  guest opens guest area
  // When   guest signs in with valid credentials
  // Then   booking page is visible with correct user info
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario: guest login succeeds', () => {
    // When
    guest.signInAsGuest({
      email: 'prueba123@prueba.com',
      password: 'SecurePass123!',
    });

    // Then
    cy.get('booking-nav').should('contain.text', 'prueba123').and('contain.text', 'prueba123@prueba.com');
    cy.contains('h1', 'Encuentra tu habitación').should('be.visible');
  });
});
