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
import { LyhostFlow } from '../../../support/screenplay/lyhost-flow';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Feature: Guest Registration', () => {
  let lyhost: LyhostFlow;

  test.beforeEach(async ({ page }) => {
    lyhost = new LyhostFlow(page);
    // Given — guest opens registration form
    await lyhost.openHome();
    await lyhost.openGuestArea();
    await lyhost.openGuestRegister();
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
    await lyhost.registerGuest({
      fullName: 'Luis Pablo Goez Sepulveda',
      email,
      password: '12345678',
      firstName: 'Luis',
      lastName: 'Goez',
    });

    // Then
    await lyhost.expectRegistrationNotice();

    // Continue to login and verify redirect
    await lyhost.continueToGuestLogin();
    await lyhost.signInAsGuest({ email, password: '12345678' });
    await lyhost.expectBookingRedirect();
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
    await lyhost.expectGuestRegisterError(/requerido|required|obligatorio/i);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Guest registration rejects short password
  // Given  guest opens registration form
  // When   guest submits short password
  // Then   guest sees password validation error
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: guest registration rejects short password', async () => {
    // When
    await lyhost.registerGuest({
      fullName: 'Maria López',
      email: `test${Date.now()}@gmail.com`,
      password: '123',
      firstName: 'Maria',
      lastName: 'López',
    });

    // Then
    await lyhost.expectGuestRegisterError(/contraseña|password|caracteres|mínimo/i);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Guest registration rejects duplicate email
  // Given  guest opens registration form
  // When   guest submits duplicate email
  // Then   guest sees duplicate email message
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: guest registration rejects duplicate email', async () => {
    // When
    await lyhost.registerGuest({
      fullName: 'Otro Usuario',
      email: 'alsides.goez@hotmail.com',
      password: '12345678',
      firstName: 'Otro',
      lastName: 'Usuario',
    });

    // Then
    await lyhost.expectGuestRegisterError(/correo.*registrado|ya está registrado|duplicado|already/i);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Guest registration rejects invalid email
  // Given  guest opens registration form
  // When   guest submits invalid email
  // Then   guest sees email validation error
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: guest registration rejects invalid email', async () => {
    // When
    await lyhost.registerGuest({
      fullName: 'Juan Pérez',
      email: 'juanperez',
      password: '12345678',
      firstName: 'Juan',
      lastName: 'Pérez',
    });

    // Then
    await lyhost.expectGuestRegisterError(/email|correo|inválido|válido|invalid/i);
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
    await lyhost.expectGuestRegisterError(/nombre|requerido|required|obligatorio/i);
  });
});
