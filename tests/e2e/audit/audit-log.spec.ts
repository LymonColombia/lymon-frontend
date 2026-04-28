/**
 * Feature: Audit Log
 *
 * Gherkin Source: tests/features/audit/audit-log.feature
 *
 * Pre-condition : Manager is already authenticated (storageState injected by Playwright setup).
 * Post-condition: Read-only test — no cleanup required.
 */

import { test, expect } from '../../fixtures/api.fixture';
import { LyhostFlow } from '../../support/screenplay/lyhost-flow';

test.describe('Feature: Audit Log', () => {
  let lyhost: LyhostFlow;

  test.beforeEach(async ({ page }) => {
    lyhost = new LyhostFlow(page);
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
    await lyhost.openAuditLogPage();

    // Then
    await expect(page.getByRole('heading')).toContainText('Registros de Auditoría');
    await expect(page.locator('div').filter({ hasText: 'Todos los' }).nth(3)).toBeVisible();
    await expect(page.locator('tbody')).toMatchAriaSnapshot(
      `- cell /\\d+ de abr de \\d+, \\d+:\\d+ p\\. m\\./`,
    );
  });
});
