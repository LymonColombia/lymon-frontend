import { GuestActor } from './actors/guest.actor';
import {
  openLyhostHome,
  openGuestArea,
  signInAsGuest,
  LoginCredentials,
} from './tasks/auth/login.task';
import {
  continueToGuestLogin,
  GuestRegistrationData,
  openGuestRegister,
  registerGuest,
} from './tasks/auth/register.task';
import { errorMessageFrom } from './questions/error-message.question';

export class GuestFlow {
  private readonly actor: GuestActor;

  constructor() {
    this.actor = GuestActor.named('Guest');
  }

  openHome(): void {
    this.actor.attemptsTo(openLyhostHome());
  }

  openGuestArea(): void {
    this.actor.attemptsTo(openGuestArea());
  }

  openGuestRegister(): void {
    this.actor.attemptsTo(openGuestRegister());
  }

  signInAsGuest(credentials: LoginCredentials): void {
    this.actor.attemptsTo(signInAsGuest(credentials));
  }

  registerGuest(data: GuestRegistrationData): void {
    this.actor.attemptsTo(registerGuest(data));
  }

  continueToGuestLogin(): void {
    this.actor.attemptsTo(continueToGuestLogin());
  }

  expectGuestLoginError(message: string | RegExp): void {
    this.actor.asks(errorMessageFrom('app-guest-login')).contains(message as string).should('exist');
  }

  expectGuestRegisterError(message: string | RegExp): void {
    this.actor
      .asks(errorMessageFrom('app-guest-register'))
      .contains(message as string)
      .should('exist');
  }

  expectRegistrationNotice(): void {
    cy.contains(/Revisa tu correo/i, { timeout: 10000 }).should('be.visible');
    cy.contains(/Enviamos un enlace/i).should('be.visible');
  }

  expectBookingRedirect(): void {
    cy.url().should('match', /booking/i);
  }
}
