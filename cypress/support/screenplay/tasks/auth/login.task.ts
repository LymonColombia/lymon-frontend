import { CypressTask } from '../../actors/guest.actor';
import { clickButtonLabeled } from '../../interactions/click-button.interaction';
import { fillTextFields } from '../../interactions/fill-form.interaction';

export interface LoginCredentials {
  email: string;
  password: string;
}

const LYHOST_HOME_URL = '/lyhost';

export const openLyhostHome = (): CypressTask => () => {
  cy.visit(LYHOST_HOME_URL);
};

export const openManagerLogin = (): CypressTask => () => {
  cy.get('button').contains('Acceder como gestor').click();
};

export const openGuestArea = (): CypressTask => () => {
  cy.contains('Acceder como huésped').click();
};

export const signInAsManager =
  (credentials: LoginCredentials): CypressTask =>
  () => {
    fillTextFields([
      { name: 'Correo Electrónico', value: credentials.email },
      { name: 'Contraseña', value: credentials.password },
    ])();
    clickButtonLabeled('Iniciar Sesión')();
  };

export const signInAsGuest =
  (credentials: LoginCredentials): CypressTask =>
  () => {
    fillTextFields([
      { name: /Correo Electrónico/i, value: credentials.email },
      { name: /Contraseña/i, value: credentials.password },
    ])();
    clickButtonLabeled(/Iniciar Sesión/i)();
  };
