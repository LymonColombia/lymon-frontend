import { CypressTask } from '../../actors/guest.actor';

export interface CreateUnitData {
  name: string;
  pricePerNight: string;
  description: string;
  roomName: string;
  amenities: readonly string[];
}

export const openPropertyUnits =
  (propertyLocatorText: string): CypressTask =>
  () => {
    cy.get('article').filter(`:contains("${propertyLocatorText}")`).contains('Ver Unidades').click();
    cy.get('app-button').contains('Crear primera unidad').click();
  };

export const createUnit =
  (data: CreateUnitData): CypressTask =>
  () => {
    cy.get('input[placeholder="Deluxe Ocean View Suite"]').click().clear().type(data.name);
    cy.get('input[placeholder="150"]').click().clear().type(data.pricePerNight);
    cy.get('textarea[placeholder="Spacious suite with private balcony..."]').click().clear().type(data.description);
    cy.get('input[placeholder="Master Bedroom"]').click().clear().type(data.roomName);
    // bed type select — resolved via label proximity (default is QUEEN, not "Select an option")
    cy.contains('label', 'Tipo de Cama').parent().find('.select-trigger').click();
    cy.contains('[role="option"]', 'KING').click();

    for (const amenity of data.amenities) {
      cy.contains('button', amenity).click();
    }

    cy.get('button').contains('Crear Unidad').click();
  };

export const deleteUnitByName =
  (unitName: string): CypressTask =>
  () => {
    cy.get('body').then(($body) => {
      if ($body.find(`article:contains("${unitName}")`).length === 0) return;

      cy.get('article')
        .filter(`:contains("${unitName}")`)
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
