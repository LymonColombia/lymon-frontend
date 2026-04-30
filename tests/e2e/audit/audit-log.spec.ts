/**
 * Feature: Audit Log
 *
 * Gherkin Source: tests/features/audit/audit-log.feature
 *
 * Pre-condition : Manager is already authenticated (storageState injected by Playwright setup).
 * Post-condition: Read-only test — no cleanup required.
 */

import { test, expect } from '../../fixtures/api.fixture';
import { ManagerFlow } from '../../support/screenplay/manager-flow';

test.describe('Feature: Audit Log', () => {
  let manager: ManagerFlow;

  test.beforeEach(async ({ page }) => {
    manager = new ManagerFlow(page);
    // Session already loaded from storageState — land on dashboard.
    await page.goto('/dashboard');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Audit log list is visible and contains entries
  // Given  the manager is on the Dashboard
  // When   the manager navigates to Audit Log
  // Then   the Audit Log page is visible with at least one timestamped entry
  // ──────────────────────────────────────────────────────────────────────────
  test('Scenario: audit log list is visible and contains entries', async ({ page }) => {
    // When
    await manager.openAuditLogPage();

    // Then
    await expect(page.getByRole('heading')).toContainText('Registros de Auditoría');
    await expect(page.locator('div').filter({ hasText: 'Todos los' }).nth(3)).toBeVisible();
    await expect(page.locator('tbody tr').first().locator('td.cell-date')).toContainText(
      /\d{1,2} de abr de \d{4}, \d{1,2}:\d{2} [ap]\.\s*m\./i,
    );
  });
});
