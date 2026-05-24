/**
 * Feature: Guest Registration and Login
 *
 * Gherkin Source: tests/features/auth/register.feature
 *
 * These tests exercise the guest registration UI — intentionally unauthenticated.
 * The successful-registration scenario creates a real user; a unique timestamp-based
 * email is used so it never conflicts, and the account is disposable (email not verified).
 */

import { GuestFlow } from '../../../support/screenplay/guest-flow';

describe('Feature: Guest Registration', () => {
  let guest: GuestFlow;

  beforeEach(() => {
    cy.clearLocalStorage();
    guest = new GuestFlow();
    // Given — guest opens registration form
    guest.openHome();
    guest.openGuestArea();
    guest.openGuestRegister();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Guest registration succeeds
  // Given  guest opens registration form
  // When   guest creates account with valid data
  // Then   registration notice is visible
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario: guest registration succeeds', () => {
    const email = `test${Date.now()}@gmail.com`;

    // When
    guest.registerGuest({
      fullName: 'Luis Pablo Goez Sepulveda',
      email,
      password: '12345678',
      firstName: 'Luis',
      lastName: 'Goez',
    });

    // Then
    guest.expectRegistrationNotice();

    // Continue to login and verify redirect
    guest.continueToGuestLogin();
    guest.signInAsGuest({ email, password: '12345678' });
    guest.expectBookingRedirect();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Guest registration rejects empty fields
  // Given  guest opens registration form
  // When   guest submits empty registration form
  // Then   guest sees field validation errors
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario: guest registration rejects empty fields', () => {
    // When
    cy.contains('button', /Crear Cuenta/i).click();

    // Then
    guest.expectGuestRegisterError(/requerido|required|obligatorio/i);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Guest registration rejects short password
  // Given  guest opens registration form
  // When   guest submits short password
  // Then   guest sees password validation error
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario: guest registration rejects short password', () => {
    // When
    guest.registerGuest({
      fullName: 'Maria López',
      email: `test${Date.now()}@gmail.com`,
      password: '123',
      firstName: 'Maria',
      lastName: 'López',
    });

    // Then
    guest.expectGuestRegisterError(/contraseña|password|caracteres|mínimo/i);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Guest registration rejects duplicate email
  // Given  guest opens registration form
  // When   guest submits duplicate email
  // Then   guest sees duplicate email message
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario: guest registration rejects duplicate email', () => {
    // When
    guest.registerGuest({
      fullName: 'Otro Usuario',
      email: 'alsides.goez@hotmail.com',
      password: '12345678',
      firstName: 'Otro',
      lastName: 'Usuario',
    });

    // Then
    guest.expectGuestRegisterError(/correo.*registrado|ya está registrado|duplicado|already/i);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Guest registration rejects invalid email
  // Given  guest opens registration form
  // When   guest submits invalid email
  // Then   guest sees email validation error
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario: guest registration rejects invalid email', () => {
    // When
    guest.registerGuest({
      fullName: 'Juan Pérez',
      email: 'juanperez',
      password: '12345678',
      firstName: 'Juan',
      lastName: 'Pérez',
    });

    // Then
    guest.expectGuestRegisterError(/email|correo|inválido|válido|invalid/i);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Guest registration requires name
  // Given  guest opens registration form
  // When   guest submits empty name
  // Then   guest sees name validation error
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario: guest registration requires name', () => {
    // When — fill everything except the full name
    const email = `test${Date.now()}@gmail.com`;
    cy.get('#email').type(email);
    cy.get('#password').type('12345678');
    cy.get('#firstName').type('Carlos');
    cy.get('#lastName').type('Sánchez');
    cy.contains('button', /Crear Cuenta/i).click();

    // Then
    guest.expectGuestRegisterError(/nombre|requerido|required|obligatorio/i);
  });
});
