/**
 * Feature: Guest Registration and Login
 *
 * Gherkin Source: tests/features/auth/register.feature
 *
 * These tests exercise the guest registration UI — intentionally unauthenticated.
 * The successful-registration scenario creates a real user; a unique timestamp-based
 * email is used so it never conflicts, and the account is disposable (email not verified).
 */

import { test } from '@playwright/test';
import { GuestFlow } from '../../../support/screenplay/guest-flow';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Feature: Guest Registration', () => {
  let guest: GuestFlow;

  test.beforeEach(async ({ page }) => {
    guest = new GuestFlow(page);
    // Given — guest opens registration form
    await guest.openHome();
    await guest.openGuestArea();
    await guest.openGuestRegister();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Guest registration succeeds
  // Given  guest opens registration form
  // When   guest creates account with valid data
  // Then   registration notice is visible
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: guest registration succeeds', async () => {
    const email = `test${Date.now()}@gmail.com`;

    // When
    await guest.registerGuest({
      fullName: 'Luis Pablo Goez Sepulveda',
      email,
      password: '12345678',
      firstName: 'Luis',
      lastName: 'Goez',
    });

    // Then
    await guest.expectRegistrationNotice();

    // Continue to login and verify redirect
    await guest.continueToGuestLogin();
    await guest.signInAsGuest({ email, password: '12345678' });
    await guest.expectBookingRedirect();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Guest registration rejects empty fields
  // Given  guest opens registration form
  // When   guest submits empty registration form
  // Then   guest sees field validation errors
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: guest registration rejects empty fields', async ({ page }) => {
    // When
    await page.getByRole('button', { name: /Crear Cuenta/i }).click();

    // Then
    await guest.expectGuestRegisterError(/requerido|required|obligatorio/i);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Guest registration rejects short password
  // Given  guest opens registration form
  // When   guest submits short password
  // Then   guest sees password validation error
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: guest registration rejects short password', async () => {
    // When
    await guest.registerGuest({
      fullName: 'Maria López',
      email: `test${Date.now()}@gmail.com`,
      password: '123',
      firstName: 'Maria',
      lastName: 'López',
    });

    // Then
    await guest.expectGuestRegisterError(/contraseña|password|caracteres|mínimo/i);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Guest registration rejects duplicate email
  // Given  guest opens registration form
  // When   guest submits duplicate email
  // Then   guest sees duplicate email message
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: guest registration rejects duplicate email', async () => {
    // When
    await guest.registerGuest({
      fullName: 'Otro Usuario',
      email: 'alsides.goez@hotmail.com',
      password: '12345678',
      firstName: 'Otro',
      lastName: 'Usuario',
    });

    // Then
    await guest.expectGuestRegisterError(
      /correo.*registrado|ya está registrado|duplicado|already/i,
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Guest registration rejects invalid email
  // Given  guest opens registration form
  // When   guest submits invalid email
  // Then   guest sees email validation error
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: guest registration rejects invalid email', async () => {
    // When
    await guest.registerGuest({
      fullName: 'Juan Pérez',
      email: 'juanperez',
      password: '12345678',
      firstName: 'Juan',
      lastName: 'Pérez',
    });

    // Then
    await guest.expectGuestRegisterError(/email|correo|inválido|válido|invalid/i);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Guest registration requires name
  // Given  guest opens registration form
  // When   guest submits empty name
  // Then   guest sees name validation error
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: guest registration requires name', async ({ page }) => {
    // When — fill everything except the full name
    const email = `test${Date.now()}@gmail.com`;
    await page.getByRole('textbox', { name: /Correo Electrónico/i }).fill(email);
    await page.getByRole('textbox', { name: /Contraseña/i }).fill('12345678');
    await page.getByRole('textbox', { name: /^Nombre$/i }).fill('Carlos');
    await page.getByRole('textbox', { name: /Apellido/i }).fill('Sánchez');
    await page.getByRole('button', { name: /Crear Cuenta/i }).click();

    // Then
    await guest.expectGuestRegisterError(/nombre|requerido|required|obligatorio/i);
  });
});
