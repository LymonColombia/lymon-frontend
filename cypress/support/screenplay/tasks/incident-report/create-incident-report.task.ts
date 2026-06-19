import { CypressTask } from '../../actors/guest.actor';

export interface CreateIncidentReportData {
  title: string;
  description: string;
}

export const openIncidentReportPage = (): CypressTask => () => {
  cy.visit('/incident-report/list');
};

export const openCreateIncidentReportForm = (): CypressTask => () => {
  cy.get('button').contains('Nueva Novedad').click();
};

export const fillIncidentReportForm =
  (data: CreateIncidentReportData): CypressTask =>
  () => {
    cy.get('#title').clear().type(data.title);
    cy.get('#description').clear().type(data.description);
  };

export const submitIncidentReportForm = (): CypressTask => () => {
  cy.get('button').contains('Registrar Novedad').click();
};

export const deleteIncidentReportByTitle =
  (title: string): CypressTask =>
  () => {
    cy.visit('/incident-report/list');
    cy.get('body').then(($body) => {
      if ($body.find(`tr:contains("${title}"), li:contains("${title}"), article:contains("${title}")`).length === 0) return;

      cy.get('tr, li, article')
        .filter(`:contains("${title}")`)
        .find('button')
        .contains(/eliminar|delete/i)
        .click();

      cy.get('body').then(($b) => {
        if ($b.find('button').filter(':contains("confirmar"), :contains("sí")').length > 0) {
          cy.contains('button', /confirmar|confirm|sí|yes/i).click();
        }
      });
    });
  };
