import { CypressTask } from '../../actors/guest.actor';

export interface CreatePropertyData {
  name: string;
  type: 'HOTEL' | 'HOSTAL' | 'APARTAMENTO' | string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: 'FLEXIBLE' | 'STANDARD' | 'STRICT' | string;
  phone: string;
  email: string;
}

export const openPropertiesPage = (): CypressTask => () => {
  cy.contains('a', 'Propiedades y Unidades').click();
};

export const openCreatePropertyForm = (): CypressTask => () => {
  cy.wait(5000);
  cy.get('body').then(($body) => {
    if ($body.find('button:contains("Crear primera propiedad")').length > 0) {
      cy.contains('button', 'Crear primera propiedad').first().click();
    } else {
      cy.contains('button', /Nueva Propiedad/i).first().click();
    }
  });
};

export const fillPropertyForm =
  (data: CreatePropertyData): CypressTask =>
  () => {
    cy.get('input[placeholder="Hotel Paraíso"]').clear().type(data.name);

    // propertyType select — resolved via label proximity (no id on app-select)
    cy.contains('label', 'Tipo').parent().find('.select-trigger').click();
    cy.contains('[role="option"]', data.type).click();

    cy.get('[placeholder="Describe tu propiedad..."]').clear().type(data.description);
    cy.get('input[placeholder="Calle 123 #45-67"]').clear().type(data.address);
    cy.get('input[placeholder="Bogotá"]').first().clear().type(data.city);
    cy.get('input[placeholder="Cundinamarca"]').clear().type(data.state);
    cy.get('input[placeholder="Colombia"]').clear().type(data.country);
    cy.get('input[placeholder="110111"]').clear().type(data.postalCode);
    cy.get('input[placeholder="4.7110"]').clear().type(data.latitude);
    cy.get('input[placeholder="-74.0721"]').clear().type(data.longitude);

    cy.get('input[type="time"]').first().clear().type(data.checkInTime);
    cy.get('input[type="time"]').eq(1).clear().type(data.checkOutTime);

    // cancellationPolicy select — resolved via label proximity
    cy.contains('label', 'Política de Cancelación').parent().find('.select-trigger').click();
    cy.contains('[role="option"]', data.cancellationPolicy).click();

    cy.get('input[placeholder="+57 300 000 0000"]').clear().type(data.phone);
    cy.get('input[placeholder="host@hotel.com"]').clear().type(data.email);
  };

export const submitPropertyForm = (): CypressTask => () => {
  cy.get('button').contains('Crear Propiedad').click();
};

export const deletePropertyByName =
  (propertyName: string): CypressTask =>
  () => {
    cy.visit('/properties');
    cy.get('body').then(($body) => {
      if ($body.find(`article:contains("${propertyName}")`).length === 0) return;

      cy.get('article')
        .filter(`:contains("${propertyName}")`)
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
