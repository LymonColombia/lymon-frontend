/**
 * Feature: Manager Login
 *
 * Gherkin Source: tests/features/auth/login.feature
 *
 * These tests exercise the login UI directly, so they intentionally do NOT
 * rely on the shared manager storageState. Each scenario starts from a
 * fresh, unauthenticated page visit.
 */

import { test } from '@playwright/test';
import { ManagerFlow } from '../../../support/screenplay/manager-flow';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Feature: Manager Authentication', () => {
  let manager: ManagerFlow;

  test.beforeEach(async ({ page }) => {
    manager = new ManagerFlow(page);
    // Given — manager opens the Lyhost landing page
    await manager.openHome();
    await manager.openManagerLogin();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager login succeeds
  // Given  manager opens Lyhost landing page
  // When   manager signs in with valid credentials
  // Then   dashboard is visible
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: manager login succeeds', async () => {
    // When
    await manager.signInAsManager({
      email: process.env.MANAGER_EMAIL ?? 'villajaramillofelipe4@gmail.com',
      password: process.env.MANAGER_PASSWORD ?? 'SecurePass123!',
    });

    await manager.page.waitForURL(/\/dashboard/);

    // Then
    await manager.expectManagerDashboard();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager login rejects invalid email
  // Given  manager opens Lyhost landing page
  // When   manager signs in with invalid email
  // Then   manager sees validation error
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: manager login rejects invalid email', async ({ page }) => {
    // When
    await page.getByRole('textbox', { name: 'Correo Electrónico' }).fill('villajaramillo@');
    await page.getByRole('textbox', { name: 'Contraseña' }).fill('SecurePass123!');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // Then
    await manager.expectManagerLoginError('Ingresa un correo válido.');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager login rejects wrong password
  // Given  manager opens Lyhost landing page
  // When   manager signs in with wrong password
  // Then   manager sees authentication error
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: manager login rejects wrong password', async () => {
    // When
    await manager.signInAsManager({
      email: process.env.MANAGER_EMAIL ?? 'villajaramillofelipe4@gmail.com',
      password: 'wrongpassword',
    });

    // Then
    await manager.expectManagerLoginError('Correo o contraseña incorrectos.');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager login rejects wrong user
  // Given  manager opens Lyhost landing page
  // When   manager signs in with unknown email
  // Then   manager sees authentication error
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: manager login rejects wrong user', async () => {
    // When
    await manager.signInAsManager({
      email: 'unknown.user@nonexistent.com',
      password: 'SecurePass123!',
    });

    // Then
    await manager.expectManagerLoginError('Correo o contraseña incorrectos.');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager login requires email
  // Given  manager opens Lyhost landing page
  // When   manager submits password only
  // Then   manager sees required email message
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: manager login requires email', async ({ page }) => {
    // When
    await page.getByRole('textbox', { name: 'Contraseña' }).fill('SecurePass123!');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // Then
    await manager.expectManagerLoginError('El correo es requerido.');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager login requires password
  // Given  manager opens Lyhost landing page
  // When   manager submits email only
  // Then   manager sees required password message
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: manager login requires password', async ({ page }) => {
    // When
    await page
      .getByRole('textbox', { name: 'Correo Electrónico' })
      .fill(process.env.MANAGER_EMAIL ?? 'villajaramillofelipe4@gmail.com');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // Then
    await manager.expectManagerLoginError('La contraseña es requerida.');
  });
});
