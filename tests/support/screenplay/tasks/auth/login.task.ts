import { GuestActor, ActorTask } from '../../actors/guest.actor';
import { clickButtonLabeled } from '../../interactions/click-button.interaction';
import { fillTextFields } from '../../interactions/fill-form.interaction';

export interface LoginCredentials {
  email: string;
  password: string;
}

const LYHOST_HOME_URL = '/lyhost';

export const openLyhostHome = (): ActorTask => async (actor: GuestActor) => {
  await actor.browse.page.goto(LYHOST_HOME_URL);
};

export const openManagerLogin = (): ActorTask => async (actor: GuestActor) => {
  await actor.browse.page.locator('button').filter({ hasText: 'Acceder como gestor' }).click();
};

export const openGuestArea = (): ActorTask => async (actor: GuestActor) => {
  await actor.browse.page.getByText('Acceder como huésped').click();
};

export const signInAsManager =
  (credentials: LoginCredentials): ActorTask =>
  async (actor) => {
    await fillTextFields([
      { name: 'Correo Electrónico', value: credentials.email },
      { name: 'Contraseña', value: credentials.password },
    ])(actor);

    await clickButtonLabeled('Iniciar Sesión')(actor);
  };

export const signInAsGuest =
  (credentials: LoginCredentials): ActorTask =>
  async (actor) => {
    await fillTextFields([
      { name: /Correo Electrónico/i, value: credentials.email },
      { name: /Contraseña/i, value: credentials.password },
    ])(actor);

    await clickButtonLabeled(/Iniciar Sesión/i)(actor);
  };
