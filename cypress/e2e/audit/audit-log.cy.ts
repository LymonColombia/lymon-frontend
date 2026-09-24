/**
 * Feature: Audit Log
 *
 * Gherkin Source: tests/features/audit/audit-log.feature
 *
 * Pre-condition : Manager is already authenticated (session injected via cy.injectManagerSession).
 * Post-condition: Read-only test — no cleanup required.
 */

import { ManagerFlow } from '../../support/screenplay/manager-flow';

describe('Feature: Audit Log', () => {
  let manager: ManagerFlow;

  beforeEach(() => {
    cy.injectManagerSession();
    manager = new ManagerFlow();
    // Session already loaded — land on dashboard
    cy.visit('/admin/dashboard');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Audit log list is visible and contains entries
  // Given  the manager is on the Dashboard
  // When   the manager navigates to Audit Log
  // Then   the Audit Log page is visible with at least one timestamped entry
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario: audit log list is visible and contains entries', () => {
    // When
    manager.openAuditLogPage();

    // Then
    cy.get('h1, h2, h3, h4, h5, h6, [role="heading"]').should('contain.text', 'Registros de Auditoría');
    cy.get('div').contains('Todos los').should('be.visible');
    cy.get('tbody tr')
      .first()
      .find('td.cell-date')
      .invoke('text')
      .should('match', /\d{1,2} de [a-záéíóú]+ de \d{4}, \d{1,2}:\d{2} [ap]\.\s*m\./i);
  });
});
