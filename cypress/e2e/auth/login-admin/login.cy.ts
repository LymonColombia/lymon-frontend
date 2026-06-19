/**
 * Feature: Manager Login
 *
 * Gherkin Source: tests/features/auth/login.feature
 *
 * These tests exercise the login UI directly — intentionally unauthenticated.
 * Each scenario starts from a fresh, unauthenticated page visit.
 */

import { ManagerFlow } from '../../../support/screenplay/manager-flow';

describe('Feature: Manager Authentication', () => {
  let manager: ManagerFlow;

  beforeEach(() => {
    cy.clearLocalStorage();
    manager = new ManagerFlow();
    // Given — manager opens the Lyhost landing page
    manager.openHome();
    manager.openManagerLogin();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager login succeeds
  // Given  manager opens Lyhost landing page
  // When   manager signs in with valid credentials
  // Then   dashboard is visible
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario: manager login succeeds', () => {
    // When
    cy.env(['MANAGER_EMAIL', 'MANAGER_PASSWORD']).then((envs) => {
      manager.signInAsManager({
        email: envs['MANAGER_EMAIL'] as string,
        password: envs['MANAGER_PASSWORD'] as string,
      });
    });

    cy.url().should('match', /\/dashboard/);

    // Then
    manager.expectManagerDashboard();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager login rejects invalid email
  // Given  manager opens Lyhost landing page
  // When   manager signs in with invalid email
  // Then   manager sees validation error
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario: manager login rejects invalid email', () => {
    // When
    cy.get('#email').type('villajaramillo@');
    cy.get('#password').type('SecurePass123!');
    cy.contains('button', 'Iniciar Sesión').click();

    // Then
    manager.expectManagerLoginError('Ingresa un correo válido.');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager login rejects wrong password
  // Given  manager opens Lyhost landing page
  // When   manager signs in with wrong password
  // Then   manager sees authentication error
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario: manager login rejects wrong password', () => {
    // When
    cy.env(['MANAGER_EMAIL']).then((envs) => {
      manager.signInAsManager({
        email: envs['MANAGER_EMAIL'] as string,
        password: 'wrongpassword',
      });
    });

    // Then
    manager.expectManagerLoginError('Correo o contraseña incorrectos.');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager login rejects wrong user
  // Given  manager opens Lyhost landing page
  // When   manager signs in with unknown email
  // Then   manager sees authentication error
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario: manager login rejects wrong user', () => {
    // When
    manager.signInAsManager({
      email: 'unknown.user@nonexistent.com',
      password: 'FakePassword123!',
    });

    // Then
    manager.expectManagerLoginError('Correo o contraseña incorrectos.');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager login requires email
  // Given  manager opens Lyhost landing page
  // When   manager submits password only
  // Then   manager sees required email message
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario: manager login requires email', () => {
    // When
    cy.get('#password').type('SecurePass123!');
    cy.contains('button', 'Iniciar Sesión').click();

    // Then
    manager.expectManagerLoginError('El correo es requerido.');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager login requires password
  // Given  manager opens Lyhost landing page
  // When   manager submits email only
  // Then   manager sees required password message
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario: manager login requires password', () => {
    // When
    cy.env(['MANAGER_EMAIL']).then((envs) => {
      cy.get('#email').type(envs['MANAGER_EMAIL'] as string);
    });
    cy.contains('button', 'Iniciar Sesión').click();

    // Then
    manager.expectManagerLoginError('La contraseña es requerida.');
  });
});
