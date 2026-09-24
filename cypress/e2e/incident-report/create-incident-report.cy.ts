/**
 * Feature: Incident Report Creation
 *
 * Gherkin Source: tests/features/incident-report/create-incident-report.feature
 *
 * Pre-condition : Manager is already authenticated (session injected via cy.injectManagerSession).
 * Post-condition: Created incident report is deleted in afterEach to restore a clean environment.
 */

import { ManagerFlow } from '../../support/screenplay/manager-flow';

// ─── Test data ────────────────────────────────────────────────────────────────

const INCIDENT = {
  title: 'Incapacidad Tomas E2E',
  description:
    'El recepcionista Tomas el dia 26 por la mañana antes de su turno, anexo su incapacidad por una operación médica.',
} as const;

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Feature: Incident Report Creation', () => {
  let manager: ManagerFlow;

  beforeEach(() => {
    cy.injectManagerSession();
    manager = new ManagerFlow();
    // Land on the domain so session storage/auth state is correctly applied
    cy.visit('/');
    // Navigate to incident-report list
    manager.openIncidentReportPage();
  });

  afterEach(() => {
    manager.deleteIncidentReport(INCIDENT.title);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario: Manager creates a new incident report
  // Given  the manager is on the Incident Report list page
  // When   the manager fills and submits the incident report form
  // Then   the new incident report appears in the list
  // ──────────────────────────────────────────────────────────────────────────
  it('Scenario: manager creates a new incident report', () => {
    // When
    manager.createIncidentReport(INCIDENT);

    // Then
    cy.get('app-hotel-page-layout').should('contain.text', INCIDENT.title);
    cy.get('app-hotel-page-layout').should('contain.text', INCIDENT.description);
    cy.contains('h1', 'Novedades Laborales').should('be.visible');
  });
});
