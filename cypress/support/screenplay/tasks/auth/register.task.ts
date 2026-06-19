import { CypressTask } from '../../actors/guest.actor';
import { clickButtonLabeled, clickLinkLabeled } from '../../interactions/click-button.interaction';
import { fillTextFields } from '../../interactions/fill-form.interaction';

export interface GuestRegistrationData {
  fullName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const openGuestRegister = (): CypressTask => () => {
  clickLinkLabeled(/Regístrate/i)();
};

export const registerGuest =
  (data: GuestRegistrationData): CypressTask =>
  () => {
    fillTextFields([
      { name: /Nombre Completo/i, value: data.fullName },
      { name: /Correo Electrónico/i, value: data.email },
      { name: /Contraseña/i, value: data.password },
      { name: /^Nombre$/i, value: data.firstName },
      { name: /Apellido/i, value: data.lastName },
    ])();
    clickButtonLabeled(/Crear Cuenta/i)();
  };

export const submitGuestRegister = (): CypressTask => () => {
  clickButtonLabeled(/Crear Cuenta/i)();
};

export const continueToGuestLogin = (): CypressTask => () => {
  cy.get('body').then(($body) => {
    if ($body.find('a:contains("Iniciar Sesión")').length > 0) {
      cy.contains('a', /Iniciar Sesión/i).click();
    } else {
      cy.visit('/lyhost/login');
    }
  });
};
