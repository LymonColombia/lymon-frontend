/**
 * Feature: Incident Report Creation
 *
 * Gherkin Source: tests/features/incident-report/create-incident-report.feature
 *
 * Pre-condition : Manager is already authenticated (storageState injected by Playwright setup).
 * Post-condition: Created incident report is deleted in afterEach to restore a clean environment.
 */

import { test, expect } from '../../fixtures/api.fixture';
import { ManagerFlow } from '../../support/screenplay/manager-flow';

// ─── Test data ────────────────────────────────────────────────────────────────

const INCIDENT = {
  title: 'Incapacidad Tomas E2E',
  description:
    'El recepcionista Tomas el dia 26 por la mañana antes de su turno, anexo su incapacidad por una operación médica.',
} as const;

// ─── Suite ───────────────────────────────────────────────────────────────────

test.describe('Feature: Incident Report Creation', () => {
  let manager: ManagerFlow;

  test.beforeEach(async ({ page }) => {
    manager = new ManagerFlow(page);
    // Land on the domain so session storage/auth state is correctly applied
    await page.goto('/');
    // Navigate to incident-report list
    await manager.openIncidentReportPage();
  });

  test.afterEach(async () => {
    // Clean-up: remove the incident report so the next run starts fresh.
    await manager.deleteIncidentReport(INCIDENT.title);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager creates a new incident report
  // Given  the manager is on the Incident Report list page
  // When   the manager fills and submits the incident report form
  // Then   the new incident report appears in the list
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: manager creates a new incident report', async ({ page }) => {
    // When
    await manager.createIncidentReport(INCIDENT);

    // Then
    const layout = page.locator('app-hotel-page-layout');
    await expect(layout).toContainText(INCIDENT.title);
    await expect(layout).toContainText(INCIDENT.description);
    await expect(
      page.getByRole('heading', { name: 'Novedades Laborales', level: 1 }),
    ).toBeVisible();
  });
});
