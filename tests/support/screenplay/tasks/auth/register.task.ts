import { ActorTask } from '../../actors/guest.actor';
import { Actor } from '../../actors/actor';
import { clickButtonLabeled, clickLinkLabeled } from '../../interactions/click-button.interaction';
import { fillTextFields } from '../../interactions/fill-form.interaction';

export interface GuestRegistrationData {
  fullName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const openGuestRegister = (): ActorTask => async (actor) => {
  await clickLinkLabeled(/Regístrate/i)(actor);
};

export const registerGuest =
  (data: GuestRegistrationData): ActorTask =>
  async (actor) => {
    await fillTextFields([
      { name: /Nombre Completo/i, value: data.fullName },
      { name: /Correo Electrónico/i, value: data.email },
      { name: /Contraseña/i, value: data.password },
      { name: /^Nombre$/i, value: data.firstName },
      { name: /Apellido/i, value: data.lastName },
    ])(actor);

    await clickButtonLabeled(/Crear Cuenta/i)(actor);
  };

export const submitGuestRegister = (): ActorTask => async (actor: Actor) => {
  await clickButtonLabeled(/Crear Cuenta/i)(actor);
};

export const continueToGuestLogin = (): ActorTask => async (actor: Actor) => {
  const loginLink = actor.browse.page.getByRole('link', { name: /Iniciar Sesión/i });

  if (await loginLink.isVisible()) {
    await loginLink.click();
    return;
  }

  await actor.browse.page.goto('/lyhost/login');
};
