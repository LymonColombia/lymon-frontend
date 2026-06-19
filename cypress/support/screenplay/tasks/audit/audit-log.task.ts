import { CypressTask } from '../../actors/guest.actor';

export const openAuditLogPage = (): CypressTask => () => {
  cy.get('button[aria-label="Expandir menú lateral"]').click();
  cy.contains('a', 'Registros de Auditoría').click();
};
